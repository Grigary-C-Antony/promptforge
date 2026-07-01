import { BaseAgent } from "./BaseAgent";
import { OrchestratorContext } from "./Context";

export class ContextAnalysisAgent extends BaseAgent {
  name = "Context Analysis Agent";
  description = "Validates input, analyzes requirements, and synthesizes business context.";

  async execute(context: OrchestratorContext): Promise<OrchestratorContext> {
    const prompt = `You are a Context Analysis Agent. Step 1: Validate the following raw project context and normalize values. Step 2: Analyze business goals, project complexity, and infer missing requirements. Step 3: Analyze industry, niche, competitors, and market positioning. Return a JSON object with a single 'contextAnalysis' key containing the synthesized data.`;
    const res = await this.callLLM(prompt, JSON.stringify(context.rawInput), context.customApiKey);
    return { ...context, contextAnalysis: res.contextAnalysis || res };
  }
}

export class ArchitectureAndPlanningAgent extends BaseAgent {
  name = "Architecture & Planning Agent";
  description = "Recommends tech stack, defines workflow, and sets prompt strategy.";

  async execute(context: OrchestratorContext): Promise<OrchestratorContext> {
    const prompt = `You are an Architecture & Planning Agent. Based on this context analysis: Step 1: Recommend a full technical architecture (Frontend, Backend, DB, etc). Step 2: Determine which exact prompt modules (e.g., PRD, Database, Frontend, Deployment) are required. Step 3: Determine the prompt strategy (objective, depth, format). Return a JSON object with a single 'architecturePlan' key containing these three components.`;
    const res = await this.callLLM(prompt, JSON.stringify(context.contextAnalysis), context.customApiKey);
    return { ...context, architecturePlan: res.architecturePlan || res };
  }
}

export class PromptDraftingAgent extends BaseAgent {
  name = "Prompt Drafting Agent";
  description = "Builds detailed prompt templates using the architecture and strategy in parallel.";

  async execute(context: OrchestratorContext, onProgress?: (msg: string) => void): Promise<OrchestratorContext> {
    let modules = ["Product Requirements (PRD)", "System Architecture", "Frontend Development", "Backend Development"];
    if (context.architecturePlan) {
      for (const val of Object.values(context.architecturePlan)) {
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') {
          modules = val;
          break;
        }
      }
    }

    let completed = 0;
    if (onProgress) onProgress(`Drafting ${modules.length} modules concurrently...`);

    const draftPromises = modules.map(async (moduleName) => {
      const prompt = `You are a Prompt Drafting Agent. Generate ONE highly-detailed prompt template specifically for the workflow module: "${moduleName}". Base it on the provided strategy and architecture plan.\n\nCRITICAL INSTRUCTION: You MUST return a raw JSON object (without markdown code blocks) with exactly two keys: 'name' (set to "${moduleName}") and 'content'. The 'content' key MUST contain a single long Markdown string representing the actual prompt text. Do NOT make 'content' a nested JSON object.`;
      const res = await this.callLLM(prompt, JSON.stringify(context.architecturePlan), context.customApiKey);
      completed++;
      if (onProgress) onProgress(`Drafted ${completed}/${modules.length}: ${moduleName}`);
      return {
        name: res.name || moduleName,
        content: res.content || (typeof res === 'string' ? res : JSON.stringify(res))
      };
    });

    const draftPrompt = await Promise.all(draftPromises);
    return { ...context, draftPrompt };
  }
}

export class OptimizationAndReviewAgent extends BaseAgent {
  name = "Optimization & Review Agent";
  description = "Improves token efficiency, fixes grammar, and resolves contradictions in parallel.";

  async execute(context: OrchestratorContext, onProgress?: (msg: string) => void): Promise<OrchestratorContext> {
    const drafts = context.draftPrompt || [];
    let completed = 0;
    if (onProgress && drafts.length > 0) onProgress(`Optimizing ${drafts.length} modules concurrently...`);
    
    const reviewPromises = drafts.map(async (draft: any) => {
      const prompt = `You are an Optimization & Review Agent. Review this draft prompt for missing sections, contradictions, and ambiguity. Optimize it for grammar, clarity, and token efficiency.\n\nCRITICAL INSTRUCTION: You MUST return a raw JSON object (without markdown code blocks) with exactly two keys: 'name' and 'content'. The 'content' key MUST contain a single long Markdown string representing the optimized prompt text. Do NOT make 'content' a nested JSON object.`;
      const res = await this.callLLM(prompt, JSON.stringify(draft), context.customApiKey);
      completed++;
      if (onProgress) onProgress(`Optimized ${completed}/${drafts.length}: ${draft.name || 'Module'}`);
      return {
        name: res.name || draft.name,
        content: res.content || draft.content
      };
    });

    const reviewedPrompt = await Promise.all(reviewPromises);
    return { ...context, reviewedPrompt };
  }
}

export class FinalizationAgent extends BaseAgent {
  name = "Finalization Agent";
  description = "Scores prompts, recommends AI tools, and packages the final payload.";

  async execute(context: OrchestratorContext): Promise<OrchestratorContext> {
    const prompt = `You are a Finalization Agent. Step 1: Recommend the best AI tools (Claude, Cursor, etc) for these workflows. Step 2: Assign Quality Assurance scores (Completeness, Readability, Scalability). Step 3: Package the final prompts into a final export-ready payload.\n\nCRITICAL INSTRUCTION: You MUST return a raw JSON object with a 'finalOutput' key containing the array of final 'name' and 'content' prompt objects. Do NOT modify the 'content' string of the prompts, leave them as raw Markdown strings.`;
    const res = await this.callLLM(prompt, JSON.stringify({ prompts: context.reviewedPrompt, plan: context.architecturePlan }), context.customApiKey);
    const finalOutput = Array.isArray(res.finalOutput) ? res.finalOutput : (Array.isArray(res) ? res : context.reviewedPrompt);
    return { ...context, finalOutput };
  }
}
