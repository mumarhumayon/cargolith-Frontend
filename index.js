const express = require('express');
const cors = require('cors');
const { initDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all frontend origins (Netlify, local preview, custom domains)
app.use(cors());
app.use(express.json());

// Health Check Endpoint for Render
app.get('/', (req, res) => {
  res.json({ status: 'active', message: 'Cargolith Dispatching API Server Running' });
});

// Carrier Onboarding Submission API
app.post('/api/onboard', async (req, res) => {
  try {
    const { name, mc, dot, equip, location, lanes, phone, email } = req.body;

    if (!name || !mc || !dot || !phone || !email) {
      return res.status(400).json({ error: 'Missing required carrier fields' });
    }

    const db = await initDB();
    const result = await db.run(
      `INSERT INTO carrier_onboardings (carrier_name, mc_number, usdot_number, equipment_type, base_location, preferred_lanes, phone, email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, mc, dot, equip || 'Dry Van', location || 'N/A', lanes || 'N/A', phone, email]
    );

    console.log(`🚛 New Carrier Onboarded: ${name} (MC# ${mc}) - ID: ${result.lastID}`);

    res.status(201).json({
      success: true,
      message: 'Onboarding packet submitted successfully',
      id: result.lastID
    });
  } catch (err) {
    console.error('Error handling onboarding submission:', err);
    res.status(500).json({ error: 'Failed to process carrier onboarding packet' });
  }
});

// Contact Form Submission API
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const db = await initDB();
    const result = await db.run(
      `INSERT INTO contact_submissions (name, email, phone, message)
       VALUES (?, ?, ?, ?)`,
      [name, email, phone || 'N/A', message]
    );

    console.log(`📩 New Contact Message from ${name} (${email}) - ID: ${result.lastID}`);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      id: result.lastID
    });
  } catch (err) {
    console.error('Error handling contact submission:', err);
    res.status(500).json({ error: 'Failed to submit contact message' });
  }
});

// Admin API: Retrieve All Carrier Onboardings
app.get('/api/admin/onboardings', async (req, res) => {
  try {
    const db = await initDB();
    const rows = await db.all('SELECT * FROM carrier_onboardings ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch onboardings' });
  }
});

// Admin API: Retrieve All Contact Submissions
app.get('/api/admin/contacts', async (req, res) => {
  try {
    const db = await initDB();
    const rows = await db.all('SELECT * FROM contact_submissions ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contact submissions' });
  }
});

// Start Server
app.listen(PORT, async () => {
  await initDB();
  console.log(`🚀 Cargolith Express Backend Server running on port ${PORT}`);
});
