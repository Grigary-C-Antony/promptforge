import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { OrchestratorEngine } from "@/lib/orchestrator/Engine";
import {
  ContextAnalysisAgent,
  ArchitectureAndPlanningAgent,
  PromptDraftingAgent,
  OptimizationAndReviewAgent,
  FinalizationAgent
} from "@/lib/orchestrator/agents";

export const maxDuration = 300; // Allow 5 minutes on pro, ignore on hobby but helps locally
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { projectId, customApiKey, licenseId } = await req.json();

  if (!projectId || !licenseId) {
    return new Response("Missing parameters", { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, licenseId }
  });

  if (!project) {
    return new Response("Project not found", { status: 404 });
  }

  const license = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!license) return new Response("License not found", { status: 404 });

  if (!customApiKey && license.workflowCredits <= 0) {
    return new Response("Insufficient credits", { status: 403 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const push = (type: string, data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`));
      };

      const engine = new OrchestratorEngine();
      engine.registerAgent(new ContextAnalysisAgent());
      engine.registerAgent(new ArchitectureAndPlanningAgent());
      engine.registerAgent(new PromptDraftingAgent());
      engine.registerAgent(new OptimizationAndReviewAgent());
      engine.registerAgent(new FinalizationAgent());

      try {
        push("start", { message: "Orchestrator started" });

        const initialContext = {
          projectId,
          licenseId,
          customApiKey,
          rawInput: project.context,
        };

        const finalContext = await engine.run(initialContext, (agentName, status, partialContext, subMessage) => {
          push("progress", { agent: agentName, status, subMessage });
        });

        // Save to DB
        push("progress", { agent: "Database", status: "saving" });
        const finalPrompts = finalContext.finalOutput || [];
        
        // Clear previous prompts if this is a regeneration
        await prisma.generatedPrompt.deleteMany({
          where: { projectId: project.id }
        });
        
        await Promise.all(finalPrompts.map((prompt: any) => {
          let safeContent = "";
          if (typeof prompt.content === 'string') {
            safeContent = prompt.content;
          } else if (prompt.content) {
            safeContent = JSON.stringify(prompt.content, null, 2);
          }
          return prisma.generatedPrompt.create({
            data: {
              projectId: project.id,
              name: prompt.name || "Generated Prompt",
              content: safeContent
            }
          });
        }));

        if (!customApiKey) {
          await prisma.license.update({
            where: { id: license.id },
            data: { workflowCredits: { decrement: 1 } }
          });
        }

        push("complete", { success: true });
      } catch (e: any) {
        console.error(e);
        push("error", { message: e.message || "Pipeline failed" });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    }
  });
}
