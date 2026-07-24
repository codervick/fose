const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { runAlertsNow, processAlerts } = require('../jobs/alertJob');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const getAlerts = async (req, res) => {
  try {
    const alerts = await prisma.alert.findMany({
      where: {
        seen: false,
        node: {
          branch: {
            event: {
              driverId: req.userId
            }
          }
        }
      },
      include: {
        node: {
          include: {
            branch: {
              include: {
                event: true
              }
            }
          }
        },
        pendingAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ alerts });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const markAlertSeen = async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: { seen: true }
    });

    res.json({ message: 'Alert marked as seen', alert });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const triggerAlerts = async (req, res) => {
  try {
    await processAlerts();
    res.json({ message: 'Alerts processed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getAlerts, markAlertSeen, triggerAlerts };