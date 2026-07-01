import { OrchestratorContext } from "./Context";

export abstract class BaseAgent {
  abstract name: string;
  abstract description: string;

  // Execute the agent's logic
  abstract execute(context: OrchestratorContext, onProgress?: (msg: string) => void): Promise<OrchestratorContext>;

  // Helper method to call OpenRouter and return JSON
  protected async callLLM(systemPrompt: string, userMessage: string, customApiKey?: string, retries = 3): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
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
            { role: "user", content: userMessage }
          ],
        })
      });

      if (response.status === 429 && attempt < retries) {
        console.warn(`Rate limited. Retrying in ${2000 * attempt}ms...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        continue;
      }

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || "{}";
    
      const cleanText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      try {
        return JSON.parse(cleanText);
      } catch (e) {
        console.error("LLM did not return valid JSON for agent:", this.name, cleanText);
        return { _raw: cleanText };
      }
    }
    throw new Error("Max retries reached");
  }
}
