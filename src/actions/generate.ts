"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const GeneratePromptsSchema = z.object({
  projectId: z.string().uuid(),
  customApiKey: z.string().max(255).optional(),
});

export async function generatePromptsForProject(projectId: string, customApiKey?: string) {
  const parseResult = GeneratePromptsSchema.safeParse({ projectId, customApiKey });
  if (!parseResult.success) {
    return { error: "Invalid input format" };
  }

  const session = await getSession();
  if (!session || !session.licenseId) {
    return { error: "Unauthorized" };
  }

  const license = await prisma.license.findUnique({ where: { id: session.licenseId } });
  if (!license) return { error: "License not found" };

  if (!customApiKey && license.workflowCredits <= 0) {
    return { error: "Insufficient credits. Please use your own API key." };
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, licenseId: session.licenseId }
  });

  if (!project) return { error: "Project not found" };

  try {
    const contextStr = JSON.stringify(project.context, null, 2);

    const systemPrompt = `You are an AI architect responsible for setting up projects. Based on the provided project context, output exactly 4 highly-detailed prompt templates (e.g. PRD, System Architecture, UI/UX Design, Frontend Development). Return ONLY a valid JSON array of objects with 'name' and 'content' keys. Do not include markdown formatting or backticks around the JSON.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${customApiKey || process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openrouter/auto",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contextStr }
        ],
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || "[]";
    
    // Clean up potential markdown formatting from the response
    const cleanText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    let generatedPrompts = [];
    try {
      generatedPrompts = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Failed to parse LLM response:", cleanText);
      throw new Error("LLM did not return valid JSON");
    }

    await Promise.all(generatedPrompts.map((prompt: any) => 
      prisma.generatedPrompt.create({
        data: {
          projectId: project.id,
          name: prompt.name || "Generated Prompt",
          content: prompt.content || ""
        }
      })
    ));

    if (!customApiKey) {
      await prisma.license.update({
        where: { id: license.id },
        data: { workflowCredits: { decrement: 1 } }
      });
    }

    revalidatePath("/workspace");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to generate prompts" };
  }
}
