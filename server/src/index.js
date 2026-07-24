const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const gmailRoutes = require('./routes/gmailRoutes');
const eventRoutes = require('./routes/eventRoutes');
const branchRoutes = require('./routes/branchRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const emailRoutes = require('./routes/emailRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/auth/gmail', gmailRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/events/:eventId/branches', branchRoutes);
app.use('/api/events/:eventId/branches/:branchId/nodes', emailRoutes);
app.use('/api/gmail', webhookRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'FOSE API is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`FOSE server running on port 5000`);
});