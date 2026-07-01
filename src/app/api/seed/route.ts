import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function GET() {
  try {
    const email = "dracorig@gmail.com";
    const password = "X6dc003aKF@drac";

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
      return NextResponse.json({ message: "Admin user created successfully!" });
    }

    return NextResponse.json({ message: "Admin user already exists." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
