"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function createProject(data: any) {
  const session = await getSession();
  
  if (!session || !session.licenseId) {
    return { error: "Unauthorized" };
  }

  try {
    const project = await prisma.project.create({
      data: {
        name: data.businessName || "New Project",
        licenseId: session.licenseId,
        context: data,
      }
    });

    return { success: true, project };
  } catch (error: any) {
    return { error: error.message || "Failed to create project" };
  }
}
