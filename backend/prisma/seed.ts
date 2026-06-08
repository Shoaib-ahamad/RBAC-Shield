// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing database records (Cascade deletes tasks)
  await prisma.task.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing database tables.');

  // 2. Generate secure bcrypt hashes
  const adminPasswordHash = await bcrypt.hash('AdminPass123', 12);
  const userPasswordHash = await bcrypt.hash('UserPass123', 12);

  // 3. Create Seed Administrator User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@system.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN'
    }
  });

  // 4. Create Seed Regular User
  const user = await prisma.user.create({
    data: {
      email: 'user@system.com',
      passwordHash: userPasswordHash,
      role: 'USER'
    }
  });

  console.log(`👤 Seeded User accounts:`);
  console.log(`   - ADMIN: ${admin.email} (Password: AdminPass123)`);
  console.log(`   - USER:  ${user.email} (Password: UserPass123)`);

  // 5. Seed initial mock Tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Review System Architecture Design',
      description: 'Go through the initial RBAC setup and database schema validation specs.',
      status: 'COMPLETED',
      createdById: admin.id,
      assignedToId: admin.id
    }
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Configure CORS and Helmet Policies',
      description: 'Implement secure express headers and verify cross-origin domains permissions.',
      status: 'IN_PROGRESS',
      createdById: admin.id,
      assignedToId: user.id
    }
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Audit Access Token Expiration Lifecycle',
      description: 'Verify that expired JWT access tokens trigger the auto-refresh Axios interceptor flow.',
      status: 'PENDING',
      createdById: user.id,
      assignedToId: user.id
    }
  });

  console.log(`📋 Seeded Tasks:`);
  console.log(`   - "${task1.title}" (Status: ${task1.status}, Assigned to Admin)`);
  console.log(`   - "${task2.title}" (Status: ${task2.status}, Assigned to User)`);
  console.log(`   - "${task3.title}" (Status: ${task3.status}, Created by User)`);

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
