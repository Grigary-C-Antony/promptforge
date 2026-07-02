import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.licenseId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { promptId, isFavorite } = await req.json();

  if (!promptId) {
    return new Response("Missing promptId", { status: 400 });
  }

  const prompt = await prisma.generatedPrompt.findUnique({
    where: { id: promptId },
    include: { project: true }
  });

  if (!prompt || prompt.project.licenseId !== session.licenseId) {
    return new Response("Not found or unauthorized", { status: 404 });
  }

  let metadata: any = prompt.metadata || {};
  if (typeof metadata !== "object") metadata = {};
  metadata.isFavorite = isFavorite;

  await prisma.generatedPrompt.update({
    where: { id: promptId },
    data: { metadata }
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
