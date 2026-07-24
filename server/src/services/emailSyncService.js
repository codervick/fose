const { google } = require('googleapis');
const { getAuthenticatedClient } = require('./gmailService');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const startGmailWatch = async (userId) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user.gmailToken) {
      throw new Error('Gmail not connected for this user');
    }

    const auth = getAuthenticatedClient(user.gmailToken, user.gmailRefreshToken);
    const gmail = google.gmail({ version: 'v1', auth });

    const response = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        labelIds: ['INBOX'],
        topicName: `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/topics/${process.env.GMAIL_PUBSUB_TOPIC}`
      }
    });

    return response.data;

  } catch (error) {
    throw new Error(`Failed to start Gmail watch: ${error.message}`);
  }
};

const getEmailContent = async (userId, messageId) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const auth = getAuthenticatedClient(user.gmailToken, user.gmailRefreshToken);
    const gmail = google.gmail({ version: 'v1', auth });

    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    const headers = message.data.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
    const from = headers.find(h => h.name === 'From')?.value || '';
    const threadId = message.data.threadId;

    let body = '';
    if (message.data.payload.parts) {
      const textPart = message.data.payload.parts.find(p => p.mimeType === 'text/plain');
      if (textPart && textPart.body.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      }
    } else if (message.data.payload.body.data) {
      body = Buffer.from(message.data.payload.body.data, 'base64').toString('utf-8');
    }

    return { subject, from, body, threadId, messageId };

  } catch (error) {
    throw new Error(`Failed to get email content: ${error.message}`);
  }
};

const matchEmailToEvent = async (threadId) => {
  try {
    const node = await prisma.node.findFirst({
      where: { gmailThreadId: threadId },
      include: { branch: true }
    });

    return node;

  } catch (error) {
    throw new Error(`Failed to match email to event: ${error.message}`);
  }
};

const sendEmail = async (userId, to, subject, body, threadId) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const auth = getAuthenticatedClient(user.gmailToken, user.gmailRefreshToken);
    const gmail = google.gmail({ version: 'v1', auth });

    const emailLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body
    ];

    const email = emailLines.join('\n');
    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
        threadId: threadId || undefined
      }
    });

    return response.data;

  } catch (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = { startGmailWatch, getEmailContent, matchEmailToEvent, sendEmail };