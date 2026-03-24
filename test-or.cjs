const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const https = require('https');

const data = JSON.stringify({
  model: "google/gemini-2.0-flash-lite-preview-02-05:free",
  messages: [{ role: "user", content: "Hi" }]
});

const options = {
  hostname: 'openrouter.ai',
  port: 443,
  path: '/api/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sk-or-v1-fake-key',
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'GenuineOS'
  }
};

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
