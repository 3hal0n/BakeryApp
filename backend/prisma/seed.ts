import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/auth';

async function main() {
  const email = 'admin@bakery.com';
  const plainPassword = 'adminpassword123';

  const passwordHash = await hashPassword(plainPassword);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: 'Admin',
      role: 'ADMIN',
      passwordHash,
      isActive: true
    },
    create: {
      name: 'Admin',
      email,
      role: 'ADMIN',
      passwordHash,
      isActive: true
    }
  });

  console.log('Upserted user:', user.email);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Seeding finished');
  });
