const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// In-memory queue (resets if server restarts)
let updateQueue = [];

// Home route (optional)
app.get('/', (req, res) => {
  res.send('Tally Credit Sync API Running!');
});

// Add a new update from AppSheet/Google Sheets
app.post('/addUpdate', (req, res) => {
  const { ledgerName, creditLimit } = req.body;

  if (!ledgerName || !creditLimit) {
    return res.status(400).json({ message: "Missing ledgerName or creditLimit" });
  }

  // Avoid duplicates
  const exists = updateQueue.some(item => item.ledgerName === ledgerName);
  if (!exists) {
    updateQueue.push({ ledgerName, creditLimit });
    console.log(`✅ Received update: ${ledgerName} -> ${creditLimit}`);
  }

  res.json({ message: "Update stored successfully" });
});

// Fetch current update queue (used by sync.js)
app.get('/getQueue', (req, res) => {
  res.json(updateQueue);
});

// Remove a ledger from queue after successful sync
app.post('/clearLedger', (req, res) => {
  const { ledgerName } = req.body;

  if (!ledgerName) {
    return res.status(400).json({ message: "Missing ledgerName" });
  }

  updateQueue = updateQueue.filter(item => item.ledgerName !== ledgerName);
  console.log(`🧹 Cleared ledger: ${ledgerName}`);
  res.json({ message: "Ledger cleared from queue" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});