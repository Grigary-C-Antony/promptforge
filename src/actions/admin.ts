"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateCustomerSchema = z.object({
  id: z.string().uuid(),
  customerName: z.string().max(100),
  source: z.string().max(100),
});

const UpdateCreditsSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().int(),
});

const GenerateLicenseSchema = z.object({
  customerName: z.string().max(100).optional(),
  source: z.string().max(100).optional(),
  workflowCredits: z.number().int().min(1).max(100000).optional().default(100),
});

export async function generateLicenseKey(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  try {
    const creditsStr = formData.get("credits") as string;
    const parsedCredits = creditsStr ? parseInt(creditsStr, 10) : 100;

    const validated = GenerateLicenseSchema.parse({
      customerName: formData.get("customerName") as string || "",
      source: formData.get("source") as string || "",
      workflowCredits: isNaN(parsedCredits) ? 100 : parsedCredits,
    });

    const newLicense = await prisma.license.create({
      data: {
        key: crypto.randomUUID(),
        status: "ACTIVE",
        workflowCredits: validated.workflowCredits,
        customerName: validated.customerName,
        source: validated.source,
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
    const parsedId = z.string().uuid().parse(id);
    await prisma.license.update({
      where: { id: parsedId },
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
    const validated = UpdateCreditsSchema.parse({ id, amount });
    await prisma.license.update({
      where: { id: validated.id },
      data: { workflowCredits: { increment: validated.amount } }
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
    const validated = UpdateCustomerSchema.parse({ id, customerName, source });
    await prisma.license.update({
      where: { id: validated.id },
      data: { customerName: validated.customerName, source: validated.source }
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update customer" };
  }
}
