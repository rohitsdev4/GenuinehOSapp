import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Google Sheets Sync
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
