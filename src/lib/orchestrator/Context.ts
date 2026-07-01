export interface OrchestratorContext {
  projectId: string;
  licenseId: string;
  customApiKey?: string;
  rawInput: any; // Original project context from DB
  
  // State accumulated through pipeline
  contextAnalysis?: any; // Validation, Requirements, Business
  architecturePlan?: any; // Tech, Workflow, Strategy
  draftPrompt?: any;      // Prompt Composer
  reviewedPrompt?: any;   // Optimizer, Reviewer
  finalOutput?: any;      // AI Tools, QA, Final Generation
}
