const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const gmailRoutes = require('./routes/gmailRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/auth/gmail', gmailRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'FOSE API is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`FOSE server running on port 5000`);
});