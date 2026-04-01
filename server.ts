import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Setup Google Auth
const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
});

async function syncSheetToFirestore(sheetId: string, collectionName: string) {
  try {
    // 1. Fetch data using googleapis
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A1:Z1000',
    });
    const rawData = response.data.values;

    // 2. Parse with Gemini
    const prompt = `Parse this raw Google Sheet data into a structured JSON array for a ${collectionName} collection. 
    Ensure each item has a unique identifier based on the data.
    Raw data: ${JSON.stringify(rawData)}`;

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const structuredData = JSON.parse(aiResponse.text || '[]');

    // 3. Sync to Firestore (Idempotent)
    const colRef = db.collection(collectionName);
    for (const item of structuredData) {
      const querySnapshot = await colRef.where('externalId', '==', item.externalId).get();
      
      if (querySnapshot.empty) {
        await colRef.add({ ...item, createdAt: new Date() });
      } else {
        const docId = querySnapshot.docs[0].id;
        await colRef.doc(docId).update({ ...item, updatedAt: new Date() });
      }
    }
    console.log(`Successfully synced ${collectionName} from Sheet`);
  } catch (error) {
    console.error(`Sync error for ${collectionName}:`, error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Periodic Sync Task (e.g., every 1 hour)
  setInterval(async () => {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (sheetId) {
      await syncSheetToFirestore(sheetId, 'sites');
      await syncSheetToFirestore(sheetId, 'expenses');
    }
  }, 60 * 60 * 1000);

  // ... (rest of the routes)
  app.post('/api/sync-sheets', async (req, res) => {
    const { sheetId, apiKey, data, action, range } = req.body;
    
    try {
      let url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range || 'A1'}`;
      let method = 'POST';
      let body: any = {
        values: [data]
      };

      if (action === 'append') {
        url += ':append?valueInputOption=RAW&key=' + apiKey;
      } else if (action === 'update') {
        url += '?valueInputOption=RAW&key=' + apiKey;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Sheets API error');

      res.json({ success: true, result });
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({ error: 'Failed to sync with Google Sheets' });
    }
  });

  // API Route to fetch data from Google Sheets
  app.get('/api/fetch-sheets', async (req, res) => {
    const { sheetId, apiKey, range } = req.query;
    
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range || 'A1:J100'}?key=${apiKey}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error?.message || 'Sheets API error');

      res.json({ success: true, data: result.values });
    } catch (error) {
      console.error('Fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch from Google Sheets' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
