import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.licenseId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { projectId } = await req.json();

  if (!projectId) {
    return new Response("Missing projectId", { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project || project.licenseId !== session.licenseId) {
    return new Response("Not found or unauthorized", { status: 404 });
  }

  let context: any = project.context || {};
  if (typeof context !== "object") context = {};
  context.isDeleted = true;

  await prisma.project.update({
    where: { id: projectId },
    data: { context }
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
