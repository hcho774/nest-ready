import { PrismaClient } from '../src/prisma/prismaClient';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Add your seed data here ─────────────────────────────────
  // Example:
  // const user = await prisma.user.upsert({
  //   where: { email: 'admin@example.com' },
  //   update: {},
  //   create: {
  //     email: 'admin@example.com',
  //     name: 'Admin User',
  //   },
  // });
  // console.log(`✅ User created: ${user.name} (${user.email})`);

  console.log('✅ Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
