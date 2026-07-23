const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const createSubBranch = async (req, res) => {
  try {
    const { eventId, branchId } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.driverId !== req.userId) {
      return res.status(403).json({ message: 'Only the driver can create branches' });
    }

    const branch = await prisma.branch.create({
      data: {
        eventId,
        parentBranchId: branchId,
        title,
        status: 'ACTIVE',
        createdById: req.userId
      }
    });

    res.status(201).json({ message: 'Sub-branch created successfully', branch });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const closeBranch = async (req, res) => {
  try {
    const { eventId, branchId } = req.params;

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.driverId !== req.userId) {
      return res.status(403).json({ message: 'Only the driver can close branches' });
    }

    const branch = await prisma.branch.update({
      where: { id: branchId },
      data: { status: 'CLOSED' }
    });

    res.json({ message: 'Branch closed successfully', branch });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createNode = async (req, res) => {
  try {
    const { eventId, branchId } = req.params;
    const { title, type, assignedToId, notes } = req.body;

    if (!title || !type) {
      return res.status(400).json({ message: 'Title and type are required' });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.driverId !== req.userId) {
      return res.status(403).json({ message: 'Only the driver can create nodes' });
    }

    const node = await prisma.node.create({
      data: {
        branchId,
        title,
        type,
        assignedToId: assignedToId || null,
        status: 'PENDING',
        pendingSince: new Date(),
        notes: notes || null,
        createdById: req.userId
      }
    });

    res.status(201).json({ message: 'Node created successfully', node });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateNodeStatus = async (req, res) => {
  try {
    const { eventId, branchId, nodeId } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.driverId !== req.userId) {
      return res.status(403).json({ message: 'Only the driver can update nodes' });
    }

    const updateData = { status };

    if (status === 'PENDING') {
      updateData.pendingSince = new Date();
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const node = await prisma.node.update({
      where: { id: nodeId },
      data: updateData
    });

    res.json({ message: 'Node updated successfully', node });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getNodes = async (req, res) => {
  try {
    const { eventId, branchId } = req.params;

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.driverId !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const nodes = await prisma.node.findMany({
      where: { branchId },
      include: {
        assignedTo: true,
        alerts: true
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ nodes });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createSubBranch, closeBranch, createNode, updateNodeStatus, getNodes };