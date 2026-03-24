import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to fetch data from Google Sheets (read-only)
  app.get('/api/fetch-sheets', async (req, res) => {
    const { sheetId, apiKey, range } = req.query;
    
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range || 'Main!A2:J1000'}?key=${apiKey}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error?.message || 'Sheets API error');

      res.json({ success: true, data: result.values || [] });
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
