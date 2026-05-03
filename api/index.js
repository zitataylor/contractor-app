require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

app.use('/api/webhook', express.raw({type: 'application/json'}));

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.post('/api/generate', async (req, res) => {
  const { company, phone, email, address, city, state, zip, client, fullClientAddress, jobType, details, price, timeline, proposalDate } = req.body;


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

 Write a clean professional proposal. Use the company name as the heading, not the words "Contractor Proposal". Include: contractor contact info at the top, ${proposalDate}, client name and address, intro paragraph, scope of work, pricing, timeline, payment terms (50% upfront 50% on completion), 30 day validity clause, and a closing signature block with the contractor's name, title, phone and email. Plain text only, no markdown, no asterisks.`;

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

app.post('/api/checkout', async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: 'https://www.trendlockerai.com/success',
      cancel_url: 'https://www.trendlockerai.com/',
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
 if (event.type === 'customer.subscription.created') {
    const customerId = event.data.object.customer;
    const customer = await stripe.customers.retrieve(customerId);
    const email = customer.email;
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    .upsert(
  { email, status: 'active', stripe_customer_id: customerId },
  { onConflict: 'email' }
);
  }

if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details.email;
    const customerId = session.customer;
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    await supabase.from('Trendlockeraisubscribers').upsert(
  { email, status: 'active', stripe_customer_id: customerId },
  { onConflict: 'email' }
);
  }
  

if (event.type === 'customer.subscription.deleted') {
    const customerId = event.data.object.customer;
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    await supabase.from('Trendlockeraisubscribers').update({ status: 'cancelled', cancelled_at: new Date() }).eq('stripe_customer_id', customerId);
  }
  
  res.json({ received: true });
});

app.post('/api/verify', async (req, res) => {
  const { email } = req.body;
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data } = await supabase.from('Trendlockeraisubscribers').select('status').eq('email', email).single();
  if (data && data.status === 'active') {
    res.json({ subscribed: true });
  } else {
    res.json({ subscribed: false });
  }
});


module.exports = app;
