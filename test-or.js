import fetch from 'node-fetch';

async function test() {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer sk-or-v1-fake-key",
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "GenuineOS"
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-lite-preview-02-05:free",
      messages: [{ role: "user", content: "Hi" }]
    })
  });
  console.log(res.status);
  const json = await res.json();
  console.log(json);
}
test();
