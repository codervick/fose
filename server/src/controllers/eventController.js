const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const createEvent = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const event = await prisma.event.create({
      data: {
        title,
        driverId: req.userId,
        status: 'ACTIVE'
      }
    });

    // Auto-create main branch
    const mainBranch = await prisma.branch.create({
      data: {
        eventId: event.id,
        title: 'Main',
        status: 'ACTIVE',
        createdById: req.userId
      }
    });

    // Add driver as a party
    await prisma.party.create({
      data: {
        eventId: event.id,
        name: req.userName,
        email: req.userEmail,
        type: 'INTERNAL',
        role: 'DRIVER',
        addedById: req.userId
      }
    });

    res.status(201).json({
      message: 'Event created successfully',
      event,
      mainBranch
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const listEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { driverId: req.userId },
      include: {
        parties: true,
        branches: {
          include: {
            nodes: {
              where: { status: 'PENDING' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ events });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        parties: true,
        branches: {
          include: {
            nodes: {
              include: {
                assignedTo: true,
                alerts: true
              }
            },
            access: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.driverId !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ event });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const closeEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.driverId !== req.userId) {
      return res.status(403).json({ message: 'Only the driver can close an event' });
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { status: 'CLOSED', closedAt: new Date() }
    });

    res.json({ message: 'Event closed successfully', event: updated });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const addParty = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, email, type, role } = req.body;

    if (!name || !email || !type || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.driverId !== req.userId) {
      return res.status(403).json({ message: 'Only the driver can add parties' });
    }

    const party = await prisma.party.create({
      data: {
        eventId,
        name,
        email,
        type,
        role,
        addedById: req.userId
      }
    });

    res.status(201).json({ message: 'Party added successfully', party });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updatePartyRole = async (req, res) => {
  try {
    const { eventId, partyId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.driverId !== req.userId) {
      return res.status(403).json({ message: 'Only the driver can update roles' });
    }

    const party = await prisma.party.update({
      where: { id: partyId },
      data: { role }
    });

    res.json({ message: 'Role updated successfully', party });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const grantBranchAccess = async (req, res) => {
  try {
    const { eventId, partyId } = req.params;
    const { branchId } = req.body;

    if (!branchId) {
      return res.status(400).json({ message: 'Branch ID is required' });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.driverId !== req.userId) {
      return res.status(403).json({ message: 'Only the driver can grant access' });
    }

    const access = await prisma.branchAccess.create({
      data: {
        branchId,
        partyId,
        grantedById: req.userId
      }
    });

    res.status(201).json({ message: 'Branch access granted', access });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createEvent, listEvents, getEvent, closeEvent, addParty, updatePartyRole, grantBranchAccess };