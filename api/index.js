require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.post('/api/generate', async (req, res) => {
  const { company, phone, email, address, city, state, zip, client, fullClientAddress, jobType, details, price, timeline } = req.body;

  const prompt = `Write a professional contractor proposal letter with the following details:

Contractor Information:
- Company: ${company}
- Address: ${address}, ${city}, ${state} ${zip}
- Phone: ${phone}
- Email: ${email}

Client Information:
- Client Name: ${client}
- Client Address: ${fullClientAddress}

Project Details:
- Job Type: ${jobType}
- Job Description: ${details}
- Total Price: $${price}
- Timeline: ${timeline}

Write a clean professional proposal. Use the company name as the heading, not the words "Contractor Proposal". Include: contractor contact info at the top, client name and address, intro paragraph, scope of work, pricing, timeline, payment terms (50% upfront 50% on completion), 30 day validity clause, and a closing signature block with the contractor's name, title, phone and email. Plain text only, no markdown, no asterisks.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();
  const text = data.content[0].text;
  res.json({ proposal: text });
});

module.exports = app;
