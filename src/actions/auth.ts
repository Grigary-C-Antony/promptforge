"use server";

import { createSession, createLicenseSession, destroySession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";
import { redirect } from "next/navigation";

export async function adminLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    return { error: "Invalid credentials" };
  }

  const isValid = await compare(password, user.password);
  
  if (!isValid) {
    return { error: "Invalid credentials" };
  }

  await createSession(user.id, user.role);
  redirect("/admin");
}

export async function userLogin(formData: FormData) {
  const licenseKey = formData.get("licenseKey") as string;

  if (!licenseKey) {
    return { error: "License key is required" };
  }

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
  redirect("/workspace");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
