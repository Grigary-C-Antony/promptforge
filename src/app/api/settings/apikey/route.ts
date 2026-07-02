import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.licenseId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { apiKey } = await req.json();

  let provider = await prisma.aIProvider.findFirst({
    where: { licenseId: session.licenseId, name: "OpenRouter" }
  });

  if (provider) {
    await prisma.aIProvider.update({
      where: { id: provider.id },
      data: { apiKey }
    });
  } else {
    await prisma.aIProvider.create({
      data: {
        licenseId: session.licenseId,
        name: "OpenRouter",
        apiKey
      }
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
}
