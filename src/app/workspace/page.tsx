import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import WorkspaceClient from "./WorkspaceClient";

export default async function Workspace() {
  const session = await getSession();
  if (!session || !session.licenseId) {
    redirect("/");
  }

  const license = await prisma.license.findUnique({
    where: { id: session.licenseId }
  });

  if (!license || license.status !== "ACTIVE") {
    redirect("/");
  }

  let projects = await prisma.project.findMany({
    where: { licenseId: session.licenseId },
    orderBy: { createdAt: "desc" },
    include: { generatedPrompts: true }
  });

  projects = projects.filter(p => !p.context || !(p.context as any).isDeleted);

  const openRouterProvider = await prisma.aIProvider.findFirst({
    where: { licenseId: session.licenseId, name: "OpenRouter" }
  });

  return <WorkspaceClient projects={projects} license={license} openRouterKey={openRouterProvider?.apiKey || ""} />;
}
