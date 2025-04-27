const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 9003; // You can change port if needed
const DATA_FILE = 'pending_updates.json';

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Tally Credit Sync API Running!');
});

// Initialize JSON file if not present
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Endpoint to receive credit limit update from Google Sheet
app.post('/addUpdate', (req, res) => {
  const { ledgerName, creditLimit } = req.body;

  if (!ledgerName || !creditLimit) {
    return res.status(400).send({ message: 'Missing ledgerName or creditLimit' });
  }

  const currentUpdates = JSON.parse(fs.readFileSync(DATA_FILE));
  currentUpdates.push({ ledgerName, creditLimit, status: 'pending' });
  fs.writeFileSync(DATA_FILE, JSON.stringify(currentUpdates, null, 2));

  console.log(`Received update: ${ledgerName} -> ${creditLimit}`);
  res.send({ message: 'Update stored successfully' });
});

// Endpoint for agent to pull pending updates
app.get('/pendingUpdates', (req, res) => {
  const currentUpdates = JSON.parse(fs.readFileSync(DATA_FILE));
  const pending = currentUpdates.filter(update => update.status === 'pending');
  res.send(pending);
});

// Endpoint to mark update as completed after agent updates Tally
app.post('/markCompleted', (req, res) => {
  const { ledgerName } = req.body;
  const currentUpdates = JSON.parse(fs.readFileSync(DATA_FILE));

  const index = currentUpdates.findIndex(u => u.ledgerName === ledgerName && u.status === 'pending');
  if (index >= 0) {
    currentUpdates[index].status = 'completed';
    fs.writeFileSync(DATA_FILE, JSON.stringify(currentUpdates, null, 2));
    console.log(`Marked ${ledgerName} as completed.`);
    res.send({ message: 'Update marked as completed' });
  } else {
    res.status(404).send({ message: 'Ledger not found or already completed' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
