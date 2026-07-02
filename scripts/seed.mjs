import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = `${process.env.DATABASE_URL}`
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.EMAIL_USER;
  const password = process.env.EMAIL_PASS;
  if (!email || !password) throw new Error("Missing EMAIL_USER or EMAIL_PASS in environment");

  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcryptjs.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log('Admin user created!');
  } else {
    console.log('Admin user already exists!');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
