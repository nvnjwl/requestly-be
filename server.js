const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, '../public');

const USERS = {
  naveen: 'supersecure',
  qa_user: 'qapass123'
};

let TOKENS = {};

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Auth middleware for POST/DELETE
app.use((req, res, next) => {
  if (req.method === 'GET' || req.path === '/api/login') return next();
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.split(' ')[1];
  if (!Object.values(TOKENS).includes(token)) return res.status(403).json({ error: 'Forbidden' });
  next();
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (USERS[username] && USERS[username] === password) {
    const token = `${username}-${Date.now()}`;
    TOKENS[username] = token;
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Save any JS file (rules or mapping)
app.post('/api/files/:filename', (req, res) => {
  const { filename } = req.params;
  const { content } = req.body;
  if (!filename.endsWith('.js')) {
    return res.status(400).json({ error: 'Only .js files are allowed' });
  }
  const filePath = path.join(PUBLIC_DIR, filename);
  fs.writeFileSync(filePath, content);
  res.json({ success: true, message: `${filename} saved.` });
});

// Delete any JS file
app.delete('/api/files/:filename', (req, res) => {
  const { filename } = req.params;
  if (!filename.endsWith('.js')) {
    return res.status(400).json({ error: 'Only .js files can be deleted' });
  }
  const filePath = path.join(PUBLIC_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return res.json({ success: true, message: `${filename} deleted.` });
  }
  res.status(404).json({ error: 'File not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Rule editor backend running at http://localhost:${PORT}`);
});
