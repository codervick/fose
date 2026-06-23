const { getAuthUrl, getTokensFromCode } = require('../services/gmailService');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const connectGmail = (req, res) => {
  const url = getAuthUrl(req.userId);
  res.json({ url });
};

const gmailCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ message: 'Invalid callback' });
    }

    const tokens = await getTokensFromCode(code);

    await prisma.user.update({
      where: { id: state },
      data: {
        gmailToken: tokens.access_token,
        gmailRefreshToken: tokens.refresh_token
      }
    });

    res.json({ message: 'Gmail connected successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Failed to connect Gmail', error: error.message });
  }
};

module.exports = { connectGmail, gmailCallback };