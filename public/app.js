async function generateProposal() {
  const company = document.getElementById('company').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const address = document.getElementById('address').value.trim();
const city = document.getElementById('city').value.trim();
const state = document.getElementById('state').value.trim();
const zip = document.getElementById('zip').value.trim();
  const clientFirst = document.getElementById('clientFirst').value.trim();
const clientLast = document.getElementById('clientLast').value.trim();
const client = `${clientFirst} ${clientLast}`;
  const clientAddress = document.getElementById('clientAddress').value.trim();
const clientCity = document.getElementById('clientCity').value.trim();
const clientState = document.getElementById('clientState').value.trim();
const clientZip = document.getElementById('clientZip').value.trim();
const fullClientAddress = `${clientAddress}, ${clientCity}, ${clientState} ${clientZip}`;
  const jobType = document.getElementById('jobType').value;
  const details = document.getElementById('details').value.trim();
  const price = document.getElementById('price').value.trim();
  const timeline = document.getElementById('timeline').value.trim();

 if (
  !company || !phone || !email || !address || !city || !state || !zip ||
  !clientFirst || !clientLast || !clientAddress || !clientCity || !clientState || !clientZip ||
  !jobType || !details || !price || !timeline
) {
  document.getElementById('status').textContent = 'Please fill in all fields before generating your proposal.';
  return;
}

  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  document.getElementById('status').textContent = 'Claude is writing your proposal...';
  document.getElementById('outputCard').style.display = 'none';

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, phone, email, address, city, state, zip, client, fullClientAddress, jobType, details, price, timeline })
    });

    const data = await response.json();
    document.getElementById('output').textContent = data.proposal.replace(/\*\*/g, '');
    document.getElementById('outputCard').style.display = 'block';
    document.getElementById('status').textContent = '';
  } catch (error) {
    document.getElementById('status').textContent = 'Something went wrong. Please try again.';
  }

  btn.disabled = false;
}

function copyProposal() {
  const text = document.getElementById('output').textContent;
  navigator.clipboard.writeText(text);
  const btn = event.target;
  btn.textContent = 'Copied!';
  setTimeout(() => btn.textContent = 'Copy', 2000);
}