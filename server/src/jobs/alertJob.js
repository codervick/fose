const Bull = require('bull');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const alertQueue = new Bull('alert-queue', {
  redis: {
    host: '127.0.0.1',
    port: 6379
  }
});

const processAlerts = async () => {
  const pendingNodes = await prisma.node.findMany({
    where: { status: 'PENDING' },
    include: { assignedTo: true }
  });

  for (const node of pendingNodes) {
    console.log(`Checking node ${node.id}`);
    console.log(`pendingSince: ${node.pendingSince}`);
    console.log(`assignedToId: ${node.assignedToId}`);

    if (!node.pendingSince) {
      console.log('Skipped - no pendingSince');
      continue;
    }

    const now = new Date();
    const pendingSince = new Date(node.pendingSince);
    const hoursPending = Math.floor((now - pendingSince) / (1000 * 60 * 60));
    const daysPending = Math.floor(hoursPending / 24) || 1;
    console.log(`hoursPending: ${hoursPending}, daysPending: ${daysPending}`);

    if (hoursPending < 1) {
      console.log('Skipped - less than 1 hour');
      continue;
    }

    if (!node.assignedToId) {
      console.log('Skipped - no assignedToId');
      continue;
    }

    const existingAlert = await prisma.alert.findFirst({
      where: { nodeId: node.id, seen: false }
    });

    if (existingAlert) {
      await prisma.alert.update({
        where: { id: existingAlert.id },
        data: { daysPending }
      });
      console.log(`Updated alert for node ${node.id}`);
    } else {
      await prisma.alert.create({
        data: {
          nodeId: node.id,
          pendingAtId: node.assignedToId,
          daysPending,
          seen: false
        }
      });
      console.log(`Created alert for node ${node.id}`);
    }
  }

  console.log(`Alert job ran — ${pendingNodes.length} pending nodes checked`);
};

alertQueue.process(async (job) => {
  await processAlerts();
});

const startAlertJob = () => {
  alertQueue.add({}, { repeat: { cron: '0 9 * * *' } });
  console.log('Alert job scheduled — runs daily at 9am');
};

const runAlertsNow = async () => {
  await processAlerts();
};

module.exports = { startAlertJob, runAlertsNow, alertQueue, processAlerts };