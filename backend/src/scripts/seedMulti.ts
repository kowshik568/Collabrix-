import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Org A
  const orgA = await prisma.organization.upsert({
    where: { email: 'orgA@example.com' },
    update: {},
    create: { name: 'DemoOrgA', email: 'orgA@example.com' },
  });
  const ownerA = await prisma.user.upsert({
    where: { email: 'ownerA@example.com' },
    update: {},
    create: {
      email: 'ownerA@example.com',
      passwordHash: await bcrypt.hash('OwnerA123!', 12),
      role: 'ORG_ADMIN',
    },
  });
  await prisma.organizationMembership.upsert({
    where: {
      userId_organizationId: { userId: ownerA.id, organizationId: orgA.id },
    },
    update: {},
    create: { userId: ownerA.id, organizationId: orgA.id, role: 'ADMIN' },
  });

  // Org B
  const orgB = await prisma.organization.upsert({
    where: { email: 'orgB@example.com' },
    update: {},
    create: { name: 'DemoOrgB', email: 'orgB@example.com' },
  });
  const ownerB = await prisma.user.upsert({
    where: { email: 'ownerB@example.com' },
    update: {},
    create: {
      email: 'ownerB@example.com',
      passwordHash: await bcrypt.hash('OwnerB123!', 12),
      role: 'ORG_ADMIN',
    },
  });
  await prisma.organizationMembership.upsert({
    where: {
      userId_organizationId: { userId: ownerB.id, organizationId: orgB.id },
    },
    update: {},
    create: { userId: ownerB.id, organizationId: orgB.id, role: 'ADMIN' },
  });

  console.log('✅ Multi‑org seed complete');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
