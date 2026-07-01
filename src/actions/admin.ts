"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function generateLicenseKey(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const customerName = formData.get("customerName") as string || "";
  const source = formData.get("source") as string || "";
  const creditsStr = formData.get("credits") as string;
  const workflowCredits = parseInt(creditsStr, 10) || 100;

  try {
    const newLicense = await prisma.license.create({
      data: {
        key: crypto.randomUUID(),
        status: "ACTIVE",
        workflowCredits,
        customerName,
        source,
      },
    });

    revalidatePath("/admin");
    return { success: true, license: newLicense };
  } catch (error: any) {
    return { error: error.message || "Failed to generate license" };
  }
}

export async function revokeLicense(id: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.license.update({
      where: { id },
      data: { status: "REVOKED" }
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to revoke license" };
  }
}

export async function updateCredits(id: string, amount: number) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.license.update({
      where: { id },
      data: { workflowCredits: { increment: amount } }
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update credits" };
  }
}

export async function updateCustomer(id: string, customerName: string, source: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.license.update({
      where: { id },
      data: { customerName, source }
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update customer" };
  }
}
