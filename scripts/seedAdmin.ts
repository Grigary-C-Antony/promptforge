import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.EMAIL_USER;
  const password = process.env.EMAIL_PASS;
  if (!email || !password) throw new Error("Missing EMAIL_USER or EMAIL_PASS in environment");

  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingAdmin) {
    const hashedPassword = await hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "ADMIN",
      },
    });
    console.log("Admin user created!");
  } else {
    console.log("Admin user already exists!");
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
