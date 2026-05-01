const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const VISITORS_FILE = path.join(DATA_DIR, 'visitors.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(VISITORS_FILE)) {
    fs.writeFileSync(VISITORS_FILE, '[]', 'utf8');
  }
}

function readVisitors() {
  ensureDataFile();
  try {
    const content = fs.readFileSync(VISITORS_FILE, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error('Error reading visitors file:', err);
    return [];
  }
}

function writeVisitors(visitors) {
  ensureDataFile();
  fs.writeFileSync(VISITORS_FILE, JSON.stringify(visitors, null, 2), 'utf8');
}

function findVisitorById(id) {
  const visitors = readVisitors();
  return visitors.find(v => String(v.id) === String(id));
}


function getTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

app.get('/api/visitors', (req, res) => {
  const visitors = readVisitors();
  return res.json(visitors);
});

app.get('/api/visitor/:id', (req, res) => {
  const { id } = req.params;
  const visitor = findVisitorById(id);
  if (!visitor) {
    return res.status(404).json({ error: 'Visitor not found.' });
  }
  return res.json(visitor);
});

app.post('/api/visitor', (req, res) => {
  const visitor = req.body;
  if (!visitor || !visitor.id) {
    return res.status(400).json({ error: 'Visitor data with id is required.' });
  }

  const visitors = readVisitors();
  const index = visitors.findIndex(v => String(v.id) === String(visitor.id));
  if (index === -1) {
    visitors.unshift(visitor);
  } else {
    visitors[index] = Object.assign({}, visitors[index], visitor);
  }
  writeVisitors(visitors);
  return res.json({ success: true, visitor });
});

app.post('/api/visitor/:id/message', (req, res) => {
  const { id } = req.params;
  const message = req.body;
  if (!message || !message.from || !message.type) {
    return res.status(400).json({ error: 'Message data with from and type is required.' });
  }

  const visitors = readVisitors();
  const index = visitors.findIndex(v => String(v.id) === String(id));
  if (index === -1) {
    return res.status(404).json({ error: 'Visitor not found.' });
  }

  if (!Array.isArray(visitors[index].messages)) {
    visitors[index].messages = [];
  }
  visitors[index].messages.push(message);
  writeVisitors(visitors);
  return res.json({ success: true, message, visitor: visitors[index] });
});

app.post('/api/send-code', async (req, res) => {
  const { email, purpose, code } = req.body;
  if (!email || !purpose || !code) {
    return res.status(400).json({ error: 'Email, purpose, and code are required.' });
  }

  const transporter = getTransporter();
  if (!transporter) {
    return res.status(500).json({ error: 'SMTP credentials are not configured.' });
  }

  const subject = `Guns N' Roses ${purpose === 'signup' ? 'Signup' : 'Password Reset'} Verification Code`;
  const text = `Your Guns N' Roses verification code is ${code}.\n\nEnter this code into the Guns N' Roses app to complete the ${purpose === 'signup' ? 'signup' : 'password reset'} process.`;
  const html = `<p>Your <strong>Guns N' Roses</strong> verification code is <strong>${code}</strong>.</p><p>Enter this code into the Guns N' Roses app to complete the ${purpose === 'signup' ? 'signup' : 'password reset'} process.</p>`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject,
      text,
      html,
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({ error: 'Unable to send verification email.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
