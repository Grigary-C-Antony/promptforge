import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const activeLicenses = await prisma.license.count({ where: { status: "ACTIVE" } });
  const workflows = await prisma.project.count();
  const prompts = await prisma.generatedPrompt.count();
  const expiringLicenses = await prisma.license.count({
    where: {
      expiresAt: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    }
  });

  const allLicenses = await prisma.license.findMany({
    orderBy: { createdAt: "desc" },
  });

  const allProjects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      license: true,
      generatedPrompts: true,
    }
  });

  const stats = {
    activeLicenses,
    workflows,
    prompts,
    expiringLicenses
  };

  return <AdminClient stats={stats} allLicenses={allLicenses} allProjects={allProjects} />;
}
