import { BaseAgent } from "./BaseAgent";
import { OrchestratorContext } from "./Context";

export class OrchestratorEngine {
  private agents: BaseAgent[] = [];

  registerAgent(agent: BaseAgent) {
    this.agents.push(agent);
  }

  async run(initialContext: OrchestratorContext, onProgress?: (agentName: string, status: string, partialContext: OrchestratorContext, subMessage?: string) => void): Promise<OrchestratorContext> {
    let context = { ...initialContext };

    for (const agent of this.agents) {
      if (onProgress) {
        onProgress(agent.name, "running", context);
      }
      
      try {
        context = await agent.execute(context, (msg) => {
          if (onProgress) onProgress(agent.name, "running", context, msg);
        });
        if (onProgress) {
          onProgress(agent.name, "completed", context);
        }
      } catch (error: any) {
        console.error(`Agent ${agent.name} failed:`, error);
        if (onProgress) {
          onProgress(agent.name, "error", context);
        }
        throw error;
      }
    }

    return context;
  }
}
