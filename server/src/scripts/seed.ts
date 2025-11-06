import { PrismaClient, EventStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create sample users
  const passwordHash = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      name: 'Alice Smith',
      email: 'alice@example.com',
      passwordHash,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      name: 'Bob Johnson',
      email: 'bob@example.com',
      passwordHash,
    },
  });

  console.log('Created users:', user1.email, user2.email);

  // Create sample events for user1
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const event1 = await prisma.event.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Team Meeting',
      startTime: new Date(tomorrow.setHours(10, 0, 0, 0)),
      endTime: new Date(tomorrow.setHours(11, 0, 0, 0)),
      status: EventStatus.BUSY,
      ownerId: user1.id,
    },
  });

  const event2 = await prisma.event.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      title: 'Client Presentation',
      startTime: new Date(tomorrow.setHours(14, 0, 0, 0)),
      endTime: new Date(tomorrow.setHours(15, 30, 0, 0)),
      status: EventStatus.SWAPPABLE,
      ownerId: user1.id,
    },
  });

  // Create sample events for user2
  const event3 = await prisma.event.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      title: 'Project Review',
      startTime: new Date(tomorrow.setHours(9, 0, 0, 0)),
      endTime: new Date(tomorrow.setHours(10, 30, 0, 0)),
      status: EventStatus.SWAPPABLE,
      ownerId: user2.id,
    },
  });

  const event4 = await prisma.event.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      title: 'Training Session',
      startTime: new Date(tomorrow.setHours(16, 0, 0, 0)),
      endTime: new Date(tomorrow.setHours(17, 0, 0, 0)),
      status: EventStatus.BUSY,
      ownerId: user2.id,
    },
  });

  console.log('Created events');
  console.log('\nSample credentials:');
  console.log('User 1: alice@example.com / password123');
  console.log('User 2: bob@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

