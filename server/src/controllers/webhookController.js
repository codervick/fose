const { getEmailContent, matchEmailToEvent } = require('../services/emailSyncService');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const handleGmailWebhook = async (req, res) => {
  try {
    // Acknowledge immediately to prevent timeout
    res.status(200).json({ message: 'OK' });

    const message = req.body?.message;
    if (!message) return;

    const data = JSON.parse(Buffer.from(message.data, 'base64').toString('utf-8'));
    const { emailAddress, historyId } = data;

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: emailAddress }
    });

    if (!user || !user.gmailToken) return;

    // Get recent message history
    const { google } = require('googleapis');
    const { getAuthenticatedClient } = require('../services/gmailService');
    const auth = getAuthenticatedClient(user.gmailToken, user.gmailRefreshToken);
    const gmail = google.gmail({ version: 'v1', auth });

    const history = await gmail.users.history.list({
      userId: 'me',
      startHistoryId: historyId,
      historyTypes: ['messageAdded']
    });

    if (!history.data.history) return;

    for (const record of history.data.history) {
      for (const msg of record.messagesAdded || []) {
        const messageId = msg.message.id;
        const emailContent = await getEmailContent(user.id, messageId);

        // Try to match to existing event by thread ID
        const existingNode = await matchEmailToEvent(emailContent.threadId);

        if (existingNode) {
          // Create a new node linked to the same branch
          await prisma.node.create({
            data: {
              branchId: existingNode.branchId,
              type: 'EMAIL',
              title: emailContent.subject,
              status: 'PENDING',
              pendingSince: new Date(),
              gmailMessageId: messageId,
              gmailThreadId: emailContent.threadId,
              notes: emailContent.body.substring(0, 500),
              createdById: user.id
            }
          });
        }
      }
    }

  } catch (error) {
    console.error('Webhook error:', error.message);
  }
};

module.exports = { handleGmailWebhook };