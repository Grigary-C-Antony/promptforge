"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generatePromptsForProject } from "@/actions/generate";
import { logout } from "@/actions/auth";

export default function WorkspaceClient({ projects, license }: { projects: any[], license: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeProjectId, setActiveProjectId] = useState(projects.length > 0 ? projects[0].id : null);
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [showGenModal, setShowGenModal] = useState(false);
  const [useCustomKey, setUseCustomKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  
  const [agentStatuses, setAgentStatuses] = useState<{ agent: string, status: string, subMessage?: string }[]>([]);
  const [isGeneratingStream, setIsGeneratingStream] = useState(false);

  const togglePrompt = (id: string) => setExpandedPrompts(prev => ({ ...prev, [id]: !prev[id] }));
  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  const activeProject = projects.find(p => p.id === activeProjectId);
  const displayedPrompts = activeProject?.generatedPrompts?.filter((p: any) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.content.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleNewWorkflow = () => {
    router.push("/onboarding");
  };

  useEffect(() => {
    if (activeProject && (!activeProject.generatedPrompts || activeProject.generatedPrompts.length === 0)) {
      setShowGenModal(true);
    } else {
      setShowGenModal(false);
    }
  }, [activeProject]);

  const handleGenerate = async () => {
    if (useCustomKey && !apiKey.trim()) {
      alert("Please enter your OpenRouter API key");
      return;
    }
    
    setIsGeneratingStream(true);
    setAgentStatuses([]);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: activeProject.id,
          licenseId: license.id,
          customApiKey: useCustomKey ? apiKey : undefined
        })
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.type === "progress") {
                  setAgentStatuses(prev => {
                    const existing = prev.find(p => p.agent === parsed.data.agent);
                    if (existing) {
                      return prev.map(p => p.agent === parsed.data.agent ? { ...p, status: parsed.data.status, subMessage: parsed.data.subMessage || p.subMessage } : p);
                    }
                    return [...prev, { agent: parsed.data.agent, status: parsed.data.status, subMessage: parsed.data.subMessage }];
                  });
                } else if (parsed.type === "complete") {
                  // Done
                } else if (parsed.type === "error") {
                  alert("Generation error: " + parsed.data.message);
                }
              } catch (e) { }
            }
          }
        }
      }
      
      setShowGenModal(false);
      window.location.reload(); // Quick refresh to load DB prompts
    } catch (e) {
      console.error(e);
      alert("Failed to connect to orchestrator.");
    } finally {
      setIsGeneratingStream(false);
    }
  };

  return (
    <div className="flex w-screen h-screen font-sans text-[#e8efe8] bg-[#080c08] overflow-hidden">
      {/* Sidebar */}
      <div className="w-[260px] flex flex-col bg-[#0e0e0e]/97 border-r border-[#e8efe8]/[0.06] shrink-0">
        
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M9 2L11 7L16 9L11 11L9 16L7 11L2 9L7 7L9 2Z" fill="#080c08"/></svg>
            </div>
            <span className="text-[15px] font-bold tracking-[-0.3px]">Rotifex</span>
          </div>
        </div>

        {/* Quota badge */}
        <div className="mx-4 mb-4 px-3.5 py-3 bg-[#e8efe8]/[0.03] border border-[#e8efe8]/[0.06] rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#e8efe8]/40 tracking-[0.5px]">CREDITS</span>
            <span className="text-xs font-semibold text-green-500 font-mono">{license.workflowCredits} left</span>
          </div>
          <div className="w-full h-1 bg-[#e8efe8]/[0.06] rounded overflow-hidden">
            <div className="w-[100%] h-full bg-gradient-to-r from-green-500 to-teal-500 rounded"></div>
          </div>
        </div>

        {/* Nav sections */}
        <div className="flex-1 overflow-y-auto px-2">
          
          {/* Projects */}
          <div className="pt-2 pb-1">
            <div className="px-3 pb-2 text-[10px] font-semibold text-[#e8efe8]/20 tracking-[1.5px] uppercase">My Projects</div>
            
            {projects.map(p => (
              <div 
                key={p.id}
                onClick={() => setActiveProjectId(p.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer mb-px ${activeProjectId === p.id ? 'bg-green-500/[0.08] text-green-500' : 'hover:bg-[#e8efe8]/[0.04] text-[#e8efe8]/40'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeProjectId === p.id ? 'bg-green-500' : 'bg-teal-500'}`}></div>
                <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis font-medium">{p.name}</span>
              </div>
            ))}

            {projects.length === 0 && (
              <div className="px-3 py-2 text-xs text-[#e8efe8]/30">No projects yet.</div>
            )}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="p-3 px-4 border-t border-[#e8efe8]/[0.06] flex flex-col gap-2">
          <div onClick={handleNewWorkflow} className="flex items-center gap-2.5 px-3 py-2.5 bg-[#e8efe8]/[0.04] border border-[#e8efe8]/[0.08] rounded-xl cursor-pointer transition-colors hover:border-green-500/25">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <span className="text-[13px] font-semibold text-green-500">New Project</span>
          </div>
          <form action={logout}>
            <button type="submit" className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-transparent border border-transparent rounded-xl cursor-pointer transition-colors hover:bg-red-500/10 hover:border-red-500/20 text-[#e8efe8]/40 hover:text-red-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              <span className="text-[13px] font-semibold">Sign Out</span>
            </button>
          </form>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeProject ? (
          <>
            <div className="flex items-center justify-between py-4 px-8 border-b border-[#e8efe8]/[0.06] shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold tracking-[-0.3px]">{activeProject.name}</span>
                {activeProject.context?.categories?.map((cat: string) => (
                  <div key={cat} className="px-2.5 py-1 bg-[#e8efe8]/[0.06] rounded-md text-[11px] font-semibold text-[#e8efe8]/60">{cat}</div>
                ))}
              </div>
              {activeProject.generatedPrompts && activeProject.generatedPrompts.length > 0 && (
                <button 
                  onClick={() => setShowGenModal(true)}
                  className="px-4 py-2 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 rounded-lg text-green-500 font-bold text-[11px] flex items-center gap-1.5 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
                  Regenerate
                </button>
              )}
            </div>

            <div className="mt-4 mx-8 px-4 py-3.5 bg-[#e8efe8]/[0.03] border border-[#e8efe8]/[0.06] rounded-xl flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M8 12v1" stroke="rgba(232,239,232,0.4)" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <span className="text-xs text-[#e8efe8]/45 flex-1">Global Instructions active — your custom context will be appended to every prompt below.</span>
            </div>

            <div className="mt-4 mx-8 max-w-[880px]">
              <input 
                type="text"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#e8efe8]/[0.03] border border-[#e8efe8]/[0.06] rounded-xl px-4 py-3 text-sm text-[#e8efe8] outline-none focus:border-green-500/30"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 pb-12">
              <div className="flex flex-col gap-4 max-w-[880px]">
                
                {displayedPrompts.length > 0 ? (
                  displayedPrompts.map((prompt: any, index: number) => {
                    const isExpanded = expandedPrompts[prompt.id] ?? true;
                    return (
                      <div key={prompt.id} className={`border border-[#e8efe8]/[0.08] rounded-2xl overflow-hidden transition-all ${isExpanded ? 'bg-[#141814]/50' : 'bg-[#141c14]/30 hover:bg-[#141c14]/50 hover:border-[#e8efe8]/[0.12]'}`}>
                        <div 
                          onClick={() => togglePrompt(prompt.id)}
                          className={`flex items-center justify-between p-5 px-6 cursor-pointer ${isExpanded ? 'border-b border-[#e8efe8]/[0.04]' : ''}`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-xl bg-[#e8efe8]/[0.06] flex items-center justify-center text-sm font-bold text-[#e8efe8]/50">{(index + 1).toString().padStart(2, '0')}</div>
                            <div>
                              <div className="text-[15px] font-bold text-[#e8efe8] mb-0.5">{prompt.name}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isExpanded && (
                              <button onClick={(e) => { e.stopPropagation(); copyToClipboard(prompt.id, prompt.content); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-md text-green-500 font-sans text-[11px] font-semibold cursor-pointer transition-colors hover:bg-green-500/15">
                                {copiedId === prompt.id ? 'Copied!' : 'Copy'}
                              </button>
                            )}
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}><path d="M4 6l4 4 4-4" stroke="rgba(232,239,232,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="p-5 px-6">
                            <div className="p-5 bg-[#0a0f0a]/60 border border-[#e8efe8]/[0.04] rounded-xl font-mono text-[12.5px] leading-[1.8] text-[#e8efe8]/60 whitespace-pre-wrap">
                              {prompt.content}
                            </div>
                            <div className="flex items-center justify-end mt-4">
                              <button onClick={() => copyToClipboard(prompt.id, prompt.content)} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-green-500/10 border border-green-500/20 rounded-md text-green-500 font-sans text-[11px] font-semibold cursor-pointer transition-colors hover:bg-green-500/15">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="3" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M4 3V1.5h4V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                                {copiedId === prompt.id ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="p-8 text-center bg-[#141c14]/30 border border-[#e8efe8]/[0.06] rounded-2xl">
                    <div className="text-[15px] font-bold mb-2">No Prompts Generated Yet</div>
                    <div className="text-xs text-[#e8efe8]/40 mb-4">Click below to generate prompts for this project based on its context.</div>
                    <button 
                      onClick={() => setShowGenModal(true)}
                      className="px-6 py-2.5 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg text-[#080c08] font-bold text-xs"
                    >
                      Generate Prompts
                    </button>
                  </div>
                )}
                
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-[#e8efe8]/30 text-sm">Select a project or create a new one.</div>
          </div>
        )}
      </div>

      {/* Generation Modal */}
      {showGenModal && activeProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="w-full max-w-md bg-[#0a0f0a] border border-[#e8efe8]/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[#e8efe8]/10 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#e8efe8]">Generation Options</h3>
              {activeProject?.generatedPrompts?.length === 0 && (
                <button onClick={() => setShowGenModal(false)} className="text-[#e8efe8]/40 hover:text-[#e8efe8]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div 
                onClick={() => setUseCustomKey(false)}
                className={`p-4 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${!useCustomKey ? 'bg-green-500/10 border-green-500/40' : 'bg-[#e8efe8]/[0.02] border-[#e8efe8]/10 hover:border-[#e8efe8]/20'}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${!useCustomKey ? 'text-green-500' : 'text-[#e8efe8]'}`}>Use Credits</span>
                  {!useCustomKey && <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.333 4L6 11.333 2.667 8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className="text-xs text-[#e8efe8]/50">Deduct 1 generation credit (You have {license.workflowCredits} left). Fast & seamless.</span>
              </div>
              
              <div 
                onClick={() => setUseCustomKey(true)}
                className={`p-4 rounded-xl border flex flex-col gap-3 cursor-pointer transition-all ${useCustomKey ? 'bg-green-500/10 border-green-500/40' : 'bg-[#e8efe8]/[0.02] border-[#e8efe8]/10 hover:border-[#e8efe8]/20'}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${useCustomKey ? 'text-green-500' : 'text-[#e8efe8]'}`}>Use Custom API Key</span>
                  {useCustomKey && <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.333 4L6 11.333 2.667 8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className="text-xs text-[#e8efe8]/50">Use your own OpenRouter API key. 0 credits deducted.</span>
                {useCustomKey && (
                  <input 
                    type="text" 
                    placeholder="sk-or-v1-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full mt-1 bg-[#080c08] border border-[#e8efe8]/20 rounded-lg p-2.5 text-xs text-[#e8efe8] outline-none focus:border-green-500"
                  />
                )}
              </div>
            </div>
            <div className="p-5 border-t border-[#e8efe8]/10 flex items-center justify-end gap-3 bg-[#e8efe8]/[0.02]">
              <button 
                onClick={() => setShowGenModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#e8efe8]/60 hover:text-[#e8efe8]"
              >
                Cancel
              </button>
              <button 
                onClick={handleGenerate}
                disabled={isGeneratingStream || (!useCustomKey && license.workflowCredits <= 0) || (useCustomKey && !apiKey.trim())}
                className="px-5 py-2.5 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg text-[#080c08] font-bold text-xs disabled:opacity-50 flex items-center gap-2"
              >
                {isGeneratingStream ? "Initializing OS..." : "Generate"}
              </button>
            </div>

            {/* Agent Progress Flow UI */}
            {isGeneratingStream && (
              <div className="p-5 border-t border-[#e8efe8]/10 bg-[#080c08] max-h-[300px] overflow-y-auto flex flex-col gap-3">
                <div className="text-xs font-bold text-green-500 mb-1 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  Prompt OS Pipeline Active
                </div>
                {agentStatuses.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 animate-fade-in-up">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${s.status === 'completed' || s.status === 'saving' ? 'bg-green-500/20 text-green-500' : s.status === 'running' ? 'bg-[#e8efe8]/10 text-[#e8efe8]' : 'bg-red-500/20 text-red-500'}`}>
                      {s.status === 'completed' || s.status === 'saving' ? (
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M13.333 4L6 11.333 2.667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : s.status === 'running' ? (
                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <span className="text-[10px] font-bold">!</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[13px] font-medium ${s.status === 'running' ? 'text-[#e8efe8]' : 'text-[#e8efe8]/60'}`}>
                        {s.agent}
                      </span>
                      {s.subMessage && (
                        <span className="text-[10px] text-[#e8efe8]/50 mt-0.5 animate-fade-in-up">
                          {s.subMessage}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
