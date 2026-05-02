require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/generate', async (req, res) => {
  const { company, client, jobType, details, price, timeline } = req.body;

  const prompt = `Write a professional contractor proposal letter with the following details:
- Contractor/Company: ${company}
- Client name: ${client}
- Job type: ${jobType}
- Job details: ${details}
- Total price: $${price}
- Timeline: ${timeline}

Write a clean, professional proposal that includes: a brief intro, scope of work, pricing, timeline, payment terms (50% upfront, 50% on completion), and a closing. Keep it concise and professional. Plain text only, no markdown.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();
  const text = data.content[0].text;
  res.json({ proposal: text });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});