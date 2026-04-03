require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { runSeed } = require('./db/seed');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/instruments', require('./routes/instruments'));
app.use('/api/counts', require('./routes/counts'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/export', require('./routes/export'));

const PORT = process.env.PORT || 5000;

runSeed();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
