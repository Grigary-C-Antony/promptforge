"use server";

import { createSession, createLicenseSession, destroySession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";

const AdminLoginSchema = z.object({
  email: z.string().email().max(100),
  password: z.string().min(1).max(255),
});

const UserLoginSchema = z.object({
  licenseKey: z.string().uuid(),
});

export async function adminLogin(formData: FormData) {
  const rawEmail = formData.get("email") as string;
  const rawPassword = formData.get("password") as string;

  const parseResult = AdminLoginSchema.safeParse({ email: rawEmail, password: rawPassword });
  if (!parseResult.success) {
    return { error: "Invalid credentials format" };
  }

  const { email, password } = parseResult.data;

  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    return { error: "Invalid credentials" };
  }

  const isValid = await compare(password, user.password);
  
  if (!isValid) {
    return { error: "Invalid credentials" };
  }

  await createSession(user.id, user.role);
  return { success: true };
}

export async function userLogin(formData: FormData) {
  const rawLicenseKey = formData.get("licenseKey") as string;

  const parseResult = UserLoginSchema.safeParse({ licenseKey: rawLicenseKey });
  if (!parseResult.success) {
    return { error: "Invalid license key format" };
  }

  const { licenseKey } = parseResult.data;
  const license = await prisma.license.findUnique({ where: { key: licenseKey } });

  if (!license || license.status !== "ACTIVE") {
    return { error: "Invalid or inactive license key" };
  }

  if (license.expiresAt && license.expiresAt < new Date()) {
    return { error: "License key has expired" };
  }

  // Update last activity
  await prisma.license.update({
    where: { id: license.id },
    data: { lastActivityAt: new Date() }
  });

  await createLicenseSession(license.id);
  return { success: true };
}

export async function logout() {
  await destroySession();
  redirect("/");
}
