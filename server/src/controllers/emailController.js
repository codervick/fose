const { sendEmail, getEmailContent } = require('../services/emailSyncService');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const sendNodeEmail = async (req, res) => {
  try {
    const { eventId, branchId, nodeId } = req.params;
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ message: 'to, subject and body are required' });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.driverId !== req.userId) {
      return res.status(403).json({ message: 'Only the driver can send emails' });
    }

    const node = await prisma.node.findUnique({ where: { id: nodeId } });

    if (!node) {
      return res.status(404).json({ message: 'Node not found' });
    }

    // Send email via Gmail API
    const sentMessage = await sendEmail(
      req.userId,
      to,
      subject,
      body,
      node.gmailThreadId
    );

    // Update node with Gmail message and thread ID
    const updatedNode = await prisma.node.update({
      where: { id: nodeId },
      data: {
        gmailMessageId: sentMessage.id,
        gmailThreadId: sentMessage.threadId,
        status: 'IN_PROGRESS'
      }
    });

    res.json({
      message: 'Email sent successfully',
      node: updatedNode,
      gmailMessageId: sentMessage.id,
      gmailThreadId: sentMessage.threadId
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getNodeEmail = async (req, res) => {
  try {
    const { eventId, nodeId } = req.params;

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.driverId !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const node = await prisma.node.findUnique({ where: { id: nodeId } });

    if (!node || !node.gmailMessageId) {
      return res.status(404).json({ message: 'No email linked to this node' });
    }

    const emailContent = await getEmailContent(req.userId, node.gmailMessageId);

    res.json({ emailContent });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { sendNodeEmail, getNodeEmail };