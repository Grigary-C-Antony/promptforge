"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generatePromptsForProject } from "@/actions/generate";
import { logout } from "@/actions/auth";
import { 
  Command, 
  Sparkles, 
  Folder, 
  Settings, 
  Plus, 
  Play, 
  MoreVertical,
  Clock,
  Star,
  PenTool,
  Copy,
  CheckCircle2,
  Zap,
  Layers,
  Database,
  Code,
  FileText,
  Home,
  ChevronRight,
  MessageSquare,
  Download,
  Activity,
  LayoutDashboard,
  Smartphone,
  Archive,
  ArchiveRestore,
  Bot,
  BrainCircuit,
  Search,
  Image,
  Wand2,
  Wrench
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { PROMPT_TEMPLATES } from '@/data/templates';

export default function WorkspaceClient({ projects, license, openRouterKey = "" }: { projects: any[], license: any, openRouterKey?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Navigation State
  const [currentView, setCurrentView] = useState<'dashboard' | 'workflow' | 'templates' | 'prompt_packs' | 'projects' | 'history' | 'favorites' | 'ai_tools' | 'settings'>(() => {
    if (projects.length > 0 && (!projects[0].generatedPrompts || projects[0].generatedPrompts.length === 0)) return 'workflow';
    return 'dashboard';
  });
  const [activeNav, setActiveNav] = useState(() => {
    if (projects.length > 0 && (!projects[0].generatedPrompts || projects[0].generatedPrompts.length === 0)) return 'Projects';
    return 'Workspace';
  });
  const [activeProjectId, setActiveProjectId] = useState<string | null>(projects.length > 0 ? projects[0].id : null);

  // Workflow State
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Generation Modal State
  const [showGenModal, setShowGenModal] = useState(false);
  const [useCustomKey, setUseCustomKey] = useState(false);
  
  // Template State
  const [selectedTemplate, setSelectedTemplate] = useState<{title: string, prompt: string} | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState<number | null>(null);
  const [apiKey, setApiKey] = useState(openRouterKey);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState<{ agent: string, status: string, subMessage?: string }[]>([]);
  const [isGeneratingStream, setIsGeneratingStream] = useState(false);
  const [showArchivedProjects, setShowArchivedProjects] = useState(false);

  // Optimistic Favorites State
  const [optimisticFavorites, setOptimisticFavorites] = useState<Record<string, boolean>>({});

  const togglePrompt = (id: string) => setExpandedPrompts(prev => ({ ...prev, [id]: !prev[id] }));
  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const checkIsFavorite = (prompt: any) => {
    if (optimisticFavorites[prompt.id] !== undefined) return optimisticFavorites[prompt.id];
    if (!prompt.metadata) return false;
    if (typeof prompt.metadata === 'string') {
      try { return JSON.parse(prompt.metadata).isFavorite === true; } catch(e) { return false; }
    }
    return prompt.metadata.isFavorite === true;
  };
  
  const activeProject = projects.find(p => p.id === activeProjectId);
  const displayedPrompts = activeProject?.generatedPrompts?.filter((p: any) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.content.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const favoritePrompts = projects.flatMap(p => (p.generatedPrompts || []).map((prompt: any) => ({ ...prompt, projectName: p.name }))).filter((p: any) => checkIsFavorite(p));

  const toggleFavorite = async (e: React.MouseEvent, promptId: string, currentStatus: boolean) => {
    e.stopPropagation();
    const newStatus = !currentStatus;
    setOptimisticFavorites(prev => ({ ...prev, [promptId]: newStatus }));
    try {
      await fetch('/api/prompts/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId, isFavorite: newStatus })
      });
      router.refresh();
    } catch (err) {
      console.error(err);
      setOptimisticFavorites(prev => ({ ...prev, [promptId]: currentStatus })); // Revert on failure
    }
  };

  const activeProjects = projects.filter(p => !p.context?.isArchived);
  const archivedProjects = projects.filter(p => p.context?.isArchived);
  const currentProjectList = showArchivedProjects ? archivedProjects : activeProjects;

  const toggleArchive = async (e: React.MouseEvent, projectId: string, currentStatus: boolean) => {
    e.stopPropagation();
    try {
      await fetch('/api/projects/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, isArchived: !currentStatus })
      });
      if (activeProjectId === projectId && !currentStatus) {
        setActiveProjectId(activeProjects.find(p => p.id !== projectId)?.id || null);
      }
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveApiKey = async () => {
    setIsSavingKey(true);
    try {
      await fetch('/api/settings/apikey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });
      alert("API Key saved successfully!");
      router.refresh();
    } catch (e) {
      alert("Failed to save API key");
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleNewWorkflow = () => {
    router.push("/onboarding");
  };

  useEffect(() => {
    if (currentView === 'workflow' && activeProject && (!activeProject.generatedPrompts || activeProject.generatedPrompts.length === 0)) {
      setShowGenModal(true);
    } else {
      setShowGenModal(false);
    }
  }, [activeProject, currentView]);

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
      router.refresh(); 
    } catch (e) {
      console.error(e);
      alert("Failed to connect to orchestrator.");
    } finally {
      setIsGeneratingStream(false);
    }
  };

  const navItems = [
    { name: 'Workspace', icon: Home },
    { name: 'Projects', icon: Folder },
    { name: 'Templates', icon: FileText },
    { name: 'History', icon: Clock },
    { name: 'Favorites', icon: Star },
    { name: 'AI Tools', icon: Sparkles },
    { name: 'Settings', icon: Settings },
  ];

  const projectIcons = [
    { bg: 'bg-green-500/20', text: 'text-green-500', icon: Database },
    { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: Activity },
    { bg: 'bg-teal-500/20', text: 'text-teal-400', icon: Sparkles },
    { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: Smartphone }
  ];

  return (
    <div className="flex w-screen h-screen font-sans text-[#e8efe8] bg-[#040604] overflow-hidden">
      
      {/* --- Sidebar --- */}
      <div className="w-[260px] flex flex-col bg-[#060906] border-r border-[#e8efe8]/[0.06] shrink-0">
        {/* Logo */}
        <div className="px-6 pt-7 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M9 2L11 7L16 9L11 11L9 16L7 11L2 9L7 7L9 2Z" fill="#080c08"/></svg>
            </div>
            <span className="text-[17px] font-bold tracking-[-0.3px] text-white">PromptForge</span>
          </div>
          <div className="text-[#e8efe8]/30 cursor-pointer hover:text-[#e8efe8]/60 transition-colors">
            <MoreVertical size={18} />
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-4 flex flex-col gap-1">
          {navItems.map(item => (
            <div 
              key={item.name}
              onClick={() => {
                setActiveNav(item.name);
                if (item.name === 'Workspace') setCurrentView('dashboard');
                else if (item.name === 'Projects') {
                  setCurrentView('projects');
                }
                else if (item.name === 'Templates') setCurrentView('templates');
                else if (item.name === 'History') setCurrentView('history');
                else if (item.name === 'Favorites') setCurrentView('favorites');
                else if (item.name === 'AI Tools') setCurrentView('ai_tools');
                else if (item.name === 'Settings') setCurrentView('settings');
              }}
              className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl cursor-pointer transition-all
                ${activeNav === item.name 
                  ? 'bg-green-500/[0.08] text-green-500 font-semibold' 
                  : 'text-[#e8efe8]/50 hover:bg-[#e8efe8]/[0.04] hover:text-[#e8efe8] font-medium'}`}
            >
              <item.icon size={18} strokeWidth={activeNav === item.name ? 2.5 : 2} />
              <span className="text-[13px]">{item.name}</span>
            </div>
          ))}
        </div>

        {/* Bottom Section (Credits + Profile) */}
        <div className="p-5 border-t border-[#e8efe8]/[0.06] flex flex-col gap-5">
          {/* Credits Box */}
          <div className="p-4 bg-[#e8efe8]/[0.02] border border-[#e8efe8]/[0.04] rounded-2xl">
            <div className="flex flex-col mb-3">
              <span className="text-[11px] font-medium text-[#e8efe8]/40 mb-1">Credits Left</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[26px] font-bold text-white leading-none">{license.workflowCredits}</span>
                <span className="text-xs text-[#e8efe8]/40 font-medium">/ 20</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-[#e8efe8]/[0.06] rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                style={{ width: `${Math.min(100, Math.max(0, (license.workflowCredits / 20) * 100))}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-[#e8efe8]/30 font-medium">Renews on May 10, 2025</div>
          </div>
          
          {/* Sign Out Box */}
          <form action={logout}>
            <button type="submit" className="w-full flex items-center justify-center p-3.5 rounded-xl bg-[#e8efe8]/[0.02] hover:bg-red-500/10 text-[#e8efe8]/60 hover:text-red-500 border border-[#e8efe8]/[0.04] hover:border-red-500/20 transition-colors cursor-pointer font-bold text-[14px] gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      {currentView === 'dashboard' ? (
        <div className="flex-1 flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#040604] p-10">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-[32px] font-bold text-white tracking-[-0.5px] flex items-center gap-3 mb-2">
                Welcome back, Rotifex <span className="text-[28px] animate-wave origin-[70%_70%]">👋</span>
              </h1>
              <p className="text-[15px] font-medium text-[#e8efe8]/50">Let's build something amazing today.</p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-5 mb-10">
            <div className="p-6 bg-[#0a0f0a] border border-[#e8efe8]/[0.05] rounded-[24px] shadow-sm hover:border-[#e8efe8]/10 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <span className="text-[14px] font-semibold text-[#e8efe8]/60">Total Projects</span>
                <Folder size={18} className="text-green-500" />
              </div>
              <div className="text-[32px] font-bold text-white mb-1.5 tracking-tight">{activeProjects.length}</div>
              <div className="text-[12px] font-medium text-[#e8efe8]/40">{Math.min(2, activeProjects.length)} in progress</div>
            </div>
            
            <div className="p-6 bg-[#0a0f0a] border border-[#e8efe8]/[0.05] rounded-[24px] shadow-sm hover:border-[#e8efe8]/10 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <span className="text-[14px] font-semibold text-[#e8efe8]/60">Credits Left</span>
                <Zap size={18} className="text-teal-400" />
              </div>
              <div className="text-[32px] font-bold text-white mb-1.5 tracking-tight">{license.workflowCredits}</div>
              <div className="text-[12px] font-medium text-[#e8efe8]/40">20 total credits</div>
            </div>

            <div className="p-6 bg-[#0a0f0a] border border-[#e8efe8]/[0.05] rounded-[24px] shadow-sm hover:border-[#e8efe8]/10 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <span className="text-[14px] font-semibold text-[#e8efe8]/60">Prompts Generated</span>
                <Activity size={18} className="text-green-500" />
              </div>
              <div className="text-[32px] font-bold text-white mb-1.5 tracking-tight">
                {projects.reduce((acc, p) => acc + (p.generatedPrompts?.length || 0), 0)}
              </div>
              <div className="text-[12px] font-medium text-[#e8efe8]/40">This month</div>
            </div>

            <div className="p-6 bg-[#0a0f0a] border border-[#e8efe8]/[0.05] rounded-[24px] shadow-sm hover:border-[#e8efe8]/10 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <span className="text-[14px] font-semibold text-[#e8efe8]/60">Favorites</span>
                <Star size={18} className="text-yellow-500" />
              </div>
              <div className="text-[32px] font-bold text-white mb-1.5 tracking-tight">{favoritePrompts.length}</div>
              <div className="text-[12px] font-medium text-[#e8efe8]/40">Saved prompts</div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-12 gap-6 mb-8 flex-1">
            {/* Left Column: Recent Projects */}
            <div className="col-span-7 bg-[#0a0f0a] border border-[#e8efe8]/[0.05] rounded-[24px] p-7 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[16px] font-bold text-white">Recent Projects</h3>
                <span 
                  onClick={() => {
                    setActiveNav('Projects');
                    if (projects.length > 0) setActiveProjectId(projects[0].id);
                    setCurrentView('workflow');
                  }}
                  className="text-[13px] font-semibold text-[#e8efe8]/40 hover:text-white cursor-pointer transition-colors"
                >
                  View all
                </span>
              </div>
              
              <div className="flex flex-col gap-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-2">
                {activeProjects.slice(0, 4).map((p, idx) => {
                  const theme = projectIcons[idx % projectIcons.length];
                  const isComplete = p.generatedPrompts?.length > 0;
                  return (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setActiveProjectId(p.id);
                        setActiveNav('Projects');
                        setCurrentView('workflow');
                      }}
                      className="flex items-center justify-between p-4 bg-[#e8efe8]/[0.01] hover:bg-[#e8efe8]/[0.03] border border-transparent hover:border-[#e8efe8]/[0.05] rounded-[16px] cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-4.5">
                        <div className={`w-[52px] h-[52px] rounded-2xl ${theme.bg} ${theme.text} flex items-center justify-center shrink-0`}>
                          <theme.icon size={22} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[15px] font-bold text-[#e8efe8] group-hover:text-white transition-colors">
                            {p.name}
                          </span>
                          <span className="text-[12px] font-medium text-[#e8efe8]/40 flex items-center gap-1.5">
                            {p.context?.categories?.join(" • ") || "Next.js • Tailwind • Prisma"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`px-3 py-1.5 ${isComplete ? 'bg-green-500/10 text-green-500' : 'bg-[#e8efe8]/10 text-[#e8efe8]/70'} text-[10px] font-bold uppercase tracking-wider rounded-lg`}>
                          {isComplete ? 'Completed' : 'In Progress'}
                        </div>
                        <span className="text-[11px] font-medium text-[#e8efe8]/30">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {activeProjects.length === 0 && (
                  <div className="py-10 text-center text-[#e8efe8]/30 text-sm font-medium">No active projects found. Create one to get started!</div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-5 flex flex-col gap-6">
              {/* Recommended AI Tools */}
              <div className="bg-[#0a0f0a] border border-[#e8efe8]/[0.05] rounded-[24px] p-7 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[16px] font-bold text-white">Recommended AI Tools</h3>
                  <span onClick={() => { setActiveNav('AI Tools'); setCurrentView('ai_tools'); }} className="text-[13px] font-semibold text-[#e8efe8]/40 hover:text-white cursor-pointer transition-colors">View all</span>
                </div>
                
                <div className="flex flex-col gap-5">
                  
                  {/* Claude 3.5 Sonnet */}
                  <div className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-[14px] bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
                        <PenTool size={20} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[14px] font-bold text-[#e8efe8] group-hover:text-orange-400 transition-colors">Claude 3.5 Sonnet</span>
                        <span className="text-[12px] font-medium text-[#e8efe8]/40">Best for reasoning & planning (Content)</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[#e8efe8]/20 group-hover:text-orange-400 transition-colors" />
                  </div>

                  {/* GPT-4o */}
                  <div className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-[14px] bg-green-500/10 text-green-400 flex items-center justify-center shrink-0 border border-green-500/20">
                        <Sparkles size={20} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[14px] font-bold text-[#e8efe8] group-hover:text-green-400 transition-colors">GPT-4o</span>
                        <span className="text-[12px] font-medium text-[#e8efe8]/40">Best for general purpose (Designs)</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[#e8efe8]/20 group-hover:text-green-400 transition-colors" />
                  </div>

                  {/* Claude Code */}
                  <div className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-[14px] bg-zinc-700/30 text-zinc-300 flex items-center justify-center shrink-0 border border-zinc-500/30">
                        <Code size={20} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[14px] font-bold text-[#e8efe8] group-hover:text-zinc-300 transition-colors">Claude Code</span>
                        <span className="text-[12px] font-medium text-[#e8efe8]/40">Best for complex programming (Coding)</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[#e8efe8]/20 group-hover:text-zinc-300 transition-colors" />
                  </div>

                  {/* Gemini 1.5 Pro */}
                  <div className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-[14px] bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                        <LayoutDashboard size={20} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[14px] font-bold text-[#e8efe8] group-hover:text-blue-400 transition-colors">Gemini 1.5 Pro</span>
                        <span className="text-[12px] font-medium text-[#e8efe8]/40">Best for massive contexts (Analysis)</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[#e8efe8]/20 group-hover:text-blue-400 transition-colors" />
                  </div>

                </div>
              </div>

              {/* Bottom Banner */}
              <div className="bg-gradient-to-r from-green-500/[0.05] to-teal-500/[0.02] border border-green-500/10 rounded-[24px] p-6 flex flex-col gap-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-green-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4"></div>
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20 shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[15px] font-bold text-white">Use your OpenRouter API Key</h3>
                    <p className="text-[13px] font-medium text-[#e8efe8]/50">Unlock unlimited generations across all AI models.</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setActiveNav('Settings'); setCurrentView('settings'); }}
                  className="relative z-10 w-full py-3 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 hover:border-green-500/50 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all"
                >
                  Configure API Key <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

        </div>
      ) : currentView === 'templates' ? (
        <div className="flex-1 flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#040604] p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-[32px] font-bold text-white tracking-[-0.5px] mb-2">Prompt Templates</h1>
              <p className="text-[15px] font-medium text-[#e8efe8]/50">Essential AI prompts categorized for your daily workflow.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PROMPT_TEMPLATES.map((template, idx) => {
              const colors = ['text-blue-400 bg-blue-500/10', 'text-purple-400 bg-purple-500/10', 'text-green-400 bg-green-500/10', 'text-orange-400 bg-orange-500/10', 'text-pink-400 bg-pink-500/10'];
              const borders = ['hover:border-blue-500/30', 'hover:border-purple-500/30', 'hover:border-green-500/30', 'hover:border-orange-500/30', 'hover:border-pink-500/30'];
              const colorClass = colors[idx % colors.length];
              const borderClass = borders[idx % borders.length];
              return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-6 bg-[#0a0f0a] border border-[#e8efe8]/[0.05] rounded-[24px] ${borderClass} transition-colors group cursor-pointer flex flex-col`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colorClass}`}>
                    <Sparkles size={20} />
                  </div>
                  <h3 className="text-[16px] font-bold text-white mb-3 line-clamp-2 leading-snug">{template.title}</h3>
                  <div className="bg-[#040604] rounded-xl p-3 border border-[#e8efe8]/[0.03] flex-1 overflow-hidden relative">
                    <p className="text-[12px] font-mono text-[#e8efe8]/40 whitespace-pre-wrap line-clamp-4">
                      {template.prompt}
                    </p>
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#040604] to-transparent pointer-events-none"></div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(template.prompt);
                        setCopiedTemplate(idx);
                        setTimeout(() => setCopiedTemplate(null), 2000);
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${copiedTemplate === idx ? 'bg-green-500/10 text-green-500' : 'bg-[#e8efe8]/5 text-[#e8efe8]/50 hover:bg-[#e8efe8]/10 hover:text-white'}`}
                      title="Copy Prompt"
                    >
                      {copiedTemplate === idx ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : currentView === 'projects' ? (
        <div className="flex-1 flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#040604] p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-[32px] font-bold text-white tracking-[-0.5px] mb-2">All Projects</h1>
              <p className="text-[15px] font-medium text-[#e8efe8]/50">Manage and navigate through your entire project history.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-[#e8efe8]/[0.02] border border-[#e8efe8]/[0.04] p-1 rounded-xl">
                <button onClick={() => setShowArchivedProjects(false)} className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${!showArchivedProjects ? 'bg-[#0a0f0a] text-white shadow-sm' : 'text-[#e8efe8]/40 hover:text-white'}`}>
                  Active
                </button>
                <button onClick={() => setShowArchivedProjects(true)} className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${showArchivedProjects ? 'bg-[#0a0f0a] text-white shadow-sm' : 'text-[#e8efe8]/40 hover:text-white'}`}>
                  Archived
                </button>
              </div>
              <button 
                onClick={handleNewWorkflow}
                className="px-5 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 rounded-xl text-[14px] font-bold flex items-center gap-2 transition-all"
              >
                <Plus size={18} /> New Project
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {currentProjectList.map((p, idx) => {
              const theme = projectIcons[idx % projectIcons.length];
              const isComplete = p.generatedPrompts?.length > 0;
              return (
                <div 
                  key={p.id}
                  onClick={() => {
                    setActiveProjectId(p.id);
                    setCurrentView('workflow');
                  }}
                  className="bg-[#0a0f0a] border border-[#e8efe8]/[0.05] rounded-[24px] p-6 hover:border-[#e8efe8]/[0.15] hover:bg-[#141814]/50 cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl ${theme.bg} ${theme.text} flex items-center justify-center shrink-0`}>
                      <theme.icon size={24} />
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => toggleArchive(e, p.id, p.context?.isArchived)} className="w-8 h-8 rounded-xl bg-[#e8efe8]/5 text-[#e8efe8]/40 hover:bg-[#e8efe8]/10 hover:text-white flex items-center justify-center transition-colors" title={p.context?.isArchived ? "Unarchive" : "Archive"}>
                        {p.context?.isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                      </button>
                      <div className={`px-3 py-1.5 ${isComplete ? 'bg-green-500/10 text-green-500' : 'bg-[#e8efe8]/10 text-[#e8efe8]/70'} text-[10px] font-bold uppercase tracking-wider rounded-lg`}>
                        {isComplete ? 'Completed' : 'In Progress'}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-[18px] font-bold text-white mb-2 group-hover:text-[#e8efe8] transition-colors">{p.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {p.context?.categories?.slice(0, 3).map((cat: string) => (
                      <span key={cat} className="px-2.5 py-1 bg-[#e8efe8]/[0.03] rounded-md text-[11px] font-medium text-[#e8efe8]/60">{cat}</span>
                    )) || <span className="px-2.5 py-1 bg-[#e8efe8]/[0.03] rounded-md text-[11px] font-medium text-[#e8efe8]/60">No categories</span>}
                  </div>
                  <div className="flex items-center justify-between text-[12px] font-medium text-[#e8efe8]/40 border-t border-[#e8efe8]/[0.04] pt-4">
                    <span>{p.generatedPrompts?.length || 0} Prompts</span>
                    <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
            {currentProjectList.length === 0 && (
              <div className="col-span-2 py-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-[#e8efe8]/10 rounded-[24px]">
                <Folder size={48} className="text-[#e8efe8]/20 mb-4" />
                <h3 className="text-[18px] font-bold text-white mb-2">{showArchivedProjects ? "No archived projects" : "No projects yet"}</h3>
                <p className="text-[14px] text-[#e8efe8]/40 mb-6">{showArchivedProjects ? "Archived projects will appear here." : "Create your first project to start generating prompts."}</p>
                <button 
                  onClick={handleNewWorkflow}
                  className="px-6 py-3 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl text-[#080c08] font-bold text-[14px] flex items-center gap-2 shadow-lg shadow-green-500/20"
                >
                  <Plus size={18} /> Create Project
                </button>
              </div>
            )}
          </div>
        </div>
      ) : currentView === 'history' ? (
        <div className="flex-1 flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#040604] p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-[32px] font-bold text-white tracking-[-0.5px] mb-2">Credit & Generation History</h1>
              <p className="text-[15px] font-medium text-[#e8efe8]/50">Track how you've used your generation credits across all projects.</p>
            </div>
            <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
              <Zap size={16} className="text-green-500" />
              <span className="text-green-500 font-bold text-[14px]">{license?.workflowCredits || 0} Credits Remaining</span>
            </div>
          </div>
          
          <div className="bg-[#0a0f0a] border border-[#e8efe8]/[0.05] rounded-[24px] overflow-hidden">
            <div className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-4 p-5 border-b border-[#e8efe8]/[0.05] bg-[#e8efe8]/[0.01]">
              <div className="text-[12px] font-bold text-[#e8efe8]/40 uppercase tracking-wider">Action</div>
              <div className="text-[12px] font-bold text-[#e8efe8]/40 uppercase tracking-wider">Project Context</div>
              <div className="text-[12px] font-bold text-[#e8efe8]/40 uppercase tracking-wider">Date & Time</div>
              <div className="text-[12px] font-bold text-[#e8efe8]/40 uppercase tracking-wider text-right">Credits</div>
            </div>
            
            <div className="divide-y divide-[#e8efe8]/[0.03]">
              {projects.filter(p => p.generatedPrompts && p.generatedPrompts.length > 0).sort((a, b) => new Date(b.generatedPrompts[0].createdAt).getTime() - new Date(a.generatedPrompts[0].createdAt).getTime()).map((p, idx) => {
                const genDate = new Date(p.generatedPrompts[0].createdAt);
                const projDate = new Date(p.createdAt);
                const isRegeneration = (genDate.getTime() - projDate.getTime()) > 300000; // 5 minutes
                return (
                <div key={p.id} className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-4 p-5 items-center hover:bg-[#e8efe8]/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRegeneration ? 'bg-orange-500/10 text-orange-400' : 'bg-purple-500/10 text-purple-400'}`}>
                      <Sparkles size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-white">{isRegeneration ? 'AI Regeneration' : 'AI Generation'}</span>
                      {isRegeneration && <span className="text-[10px] text-orange-400/80">Previous prompts replaced</span>}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-medium text-[#e8efe8]/80">{p.name}</span>
                    <span className="text-[12px] text-[#e8efe8]/40">Generated {p.generatedPrompts.length} pipeline prompts</span>
                  </div>
                  <div className="text-[13px] font-medium text-[#e8efe8]/60">
                    {genDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex justify-end">
                    <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[13px] font-bold rounded-lg flex items-center gap-1">
                      -1 <Zap size={12} />
                    </span>
                  </div>
                </div>
              );})}
              {projects.filter(p => p.generatedPrompts && p.generatedPrompts.length > 0).length === 0 && (
                <div className="p-10 text-center flex flex-col items-center">
                   <Clock size={32} className="text-[#e8efe8]/20 mb-3" />
                   <span className="text-[#e8efe8]/40 font-medium">No generations found in active projects.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : currentView === 'favorites' ? (
        <div className="flex-1 flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#040604] p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-[32px] font-bold text-white tracking-[-0.5px] mb-2">Favorites</h1>
              <p className="text-[15px] font-medium text-[#e8efe8]/50">Your most valuable and frequently used prompts.</p>
            </div>
          </div>
          
          {favoritePrompts.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 max-w-[880px]">
              {favoritePrompts.map((prompt: any) => (
                <div key={prompt.id} className="p-7 bg-[#0a0f0a] border border-[#e8efe8]/[0.05] rounded-[24px] group flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#e8efe8]/[0.04] flex items-center justify-center text-yellow-500">
                        <Star size={18} fill="currentColor" />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-[16px] font-bold text-white">{prompt.name}</h3>
                        <span className="text-[12px] font-medium text-[#e8efe8]/40">From project: {prompt.projectName}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => copyToClipboard(prompt.id, prompt.content)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 rounded-xl text-[12px] font-bold transition-colors"
                      >
                        {copiedId === prompt.id ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                        {copiedId === prompt.id ? 'Copied' : 'Copy'}
                      </button>
                      <button 
                        onClick={(e) => toggleFavorite(e, prompt.id, true)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                        title="Remove from favorites"
                      >
                        <Star size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="p-5 bg-[#040604] border border-[#e8efe8]/[0.03] rounded-xl overflow-hidden relative">
                     <pre className="text-[13px] font-mono text-[#e8efe8]/60 whitespace-pre-wrap line-clamp-6">
                       {prompt.content}
                     </pre>
                     <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#040604] to-transparent pointer-events-none"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#e8efe8]/10 rounded-[24px] py-20">
              <Star size={48} className="text-yellow-500/20 mb-4" />
              <h3 className="text-[18px] font-bold text-white mb-2">No favorites found</h3>
              <p className="text-[14px] text-[#e8efe8]/40">Star prompts in your projects to save them here.</p>
            </div>
          )}
        </div>
      ) : currentView === 'ai_tools' ? (
        <div className="flex-1 flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#040604] p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-[32px] font-bold text-white tracking-[-0.5px] mb-2">AI Tools Directory</h1>
              <p className="text-[15px] font-medium text-[#e8efe8]/50">A curated directory of top AI tools you can use alongside PromptForge.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { name: "ChatGPT", desc: "Advanced conversational AI by OpenAI, great for coding and general reasoning.", url: "https://chatgpt.com", icon: Bot, color: "text-emerald-400" },
              { name: "Claude", desc: "Highly capable AI by Anthropic, exceptional at coding, writing, and large context windows.", url: "https://claude.ai", icon: BrainCircuit, color: "text-orange-400" },
              { name: "Gemini", desc: "Google's multimodal AI model, deeply integrated with Google Workspace and extremely fast.", url: "https://gemini.google.com", icon: Sparkles, color: "text-blue-400" },
              { name: "Perplexity", desc: "AI-powered research and conversational search engine providing accurate citations.", url: "https://perplexity.ai", icon: Search, color: "text-cyan-400" },
              { name: "Midjourney", desc: "State-of-the-art AI image generator operating via Discord for stunning visuals.", url: "https://midjourney.com", icon: Image, color: "text-indigo-400" },
              { name: "Cursor", desc: "The AI Code Editor built to make you extraordinarily productive.", url: "https://cursor.com", icon: Code, color: "text-zinc-300" },
              { name: "Google Stitch", desc: "Google's AI-native design canvas for generating responsive UI layouts with text prompts.", url: "https://stitch.google.com", icon: Wand2, color: "text-red-400" },
              { name: "Google AI Studio", desc: "The fastest way to start building with Gemini models and Google's AI developer tools.", url: "https://aistudio.google.com", icon: Code, color: "text-yellow-400" },
              { name: "Claude Design", desc: "Anthropic's advanced AI interface design and artifact generation tool.", url: "https://claude.ai", icon: PenTool, color: "text-orange-300" },
              { name: "Antigravity", desc: "Powerful agentic AI coding assistant designed by the Google DeepMind team.", url: "https://deepmind.google", icon: Zap, color: "text-green-400" },
              { name: "z.ai", desc: "Next-generation AI workflow and automation platform.", url: "https://z.ai", icon: Zap, color: "text-purple-400" },
              { name: "IT Tools", desc: "Handy open-source collection of useful tools for developers and IT staff.", url: "https://it-tools.tech", icon: Wrench, color: "text-sky-400" },
            ].map(tool => (
              <div key={tool.name} className="bg-[#0a0f0a] border border-[#e8efe8]/[0.05] rounded-[24px] p-6 hover:border-[#e8efe8]/[0.15] transition-all flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-[#e8efe8]/[0.04] border border-[#e8efe8]/10 flex items-center justify-center shrink-0 ${tool.color}`}>
                    <tool.icon size={24} />
                  </div>
                  <h3 className="text-[18px] font-bold text-white">{tool.name}</h3>
                </div>
                <p className="text-[13px] text-[#e8efe8]/40 mb-6 flex-1">
                  {tool.desc}
                </p>
                <a href={tool.url} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3 bg-[#e8efe8]/5 hover:bg-[#e8efe8]/10 text-white rounded-xl text-[13px] font-bold transition-colors">
                  Visit {tool.name} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      ) : currentView === 'settings' ? (
        <div className="flex-1 flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#040604] p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-[32px] font-bold text-white tracking-[-0.5px] mb-2">Workspace Settings</h1>
              <p className="text-[15px] font-medium text-[#e8efe8]/50">Manage your account, preferences, and OpenRouter API keys.</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-6 max-w-3xl">
            {/* API Key Section */}
            <div className="bg-[#0a0f0a] border border-[#e8efe8]/[0.05] rounded-[24px] p-7">
              <h3 className="text-[18px] font-bold text-white mb-4 flex items-center gap-2"><Zap size={18} className="text-green-500"/> OpenRouter Integration</h3>
              <p className="text-[14px] text-[#e8efe8]/40 mb-5">Bring your own OpenRouter key to bypass credit limits and access all available models.</p>
              <div className="flex gap-3">
                <input 
                  type="password" 
                  placeholder="sk-or-v1-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 bg-[#040604] border border-[#e8efe8]/10 rounded-xl px-4 py-3 text-[14px] text-white outline-none focus:border-green-500/50 transition-colors"
                />
                <button 
                  onClick={handleSaveApiKey}
                  disabled={isSavingKey}
                  className="px-6 py-3 bg-gradient-to-br from-green-500 to-teal-500 text-[#080c08] rounded-xl font-bold text-[14px] shadow-lg shadow-green-500/20 disabled:opacity-50"
                >
                  {isSavingKey ? "Saving..." : "Save Key"}
                </button>
              </div>
            </div>

            {/* Billing Section */}
            <div className="bg-[#0a0f0a] border border-[#e8efe8]/[0.05] rounded-[24px] p-7">
              <h3 className="text-[18px] font-bold text-white mb-4 flex items-center gap-2"><Activity size={18} className="text-purple-400"/> Subscription & Credits</h3>
              <div className="flex items-center justify-between p-5 bg-[#e8efe8]/[0.02] border border-[#e8efe8]/[0.04] rounded-2xl mb-5">
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-white">Pro Plan</span>
                  <span className="text-[13px] text-[#e8efe8]/50">{license.workflowCredits} Workflow Credits remaining</span>
                </div>
                <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-[11px] font-bold uppercase tracking-wider rounded-lg">
                  Active
                </span>
              </div>
              <button className="w-full py-3.5 bg-[#e8efe8]/5 hover:bg-[#e8efe8]/10 rounded-xl text-[14px] font-bold text-white transition-colors">
                Buy More Credits
              </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-[#140808] border border-red-500/20 rounded-[24px] p-7">
              <h3 className="text-[18px] font-bold text-red-500 mb-2">Danger Zone</h3>
              <p className="text-[14px] text-red-500/50 mb-5">Permanently delete your account and all associated projects.</p>
              <button className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl font-bold text-[14px] transition-colors">Delete Account</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Original Workflow/Project View */}
          {activeProject ? (
            <>
              <div className="flex items-center justify-between py-5 px-10 border-b border-[#e8efe8]/[0.06] shrink-0">
                <div className="flex items-center gap-4">
                  <span className="text-[20px] font-bold tracking-[-0.3px]">{activeProject.name}</span>
                  <div className="flex gap-2">
                    {activeProject.context?.categories?.map((cat: string) => (
                      <div key={cat} className="px-3 py-1 bg-[#e8efe8]/[0.04] border border-[#e8efe8]/10 rounded-lg text-[12px] font-semibold text-[#e8efe8]/70">
                        {cat}
                      </div>
                    ))}
                  </div>
                </div>
                {activeProject.generatedPrompts && activeProject.generatedPrompts.length > 0 && (
                  <button 
                    onClick={() => setShowGenModal(true)}
                    className="px-5 py-2.5 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 rounded-xl text-green-500 font-bold text-[13px] flex items-center gap-2 transition-colors"
                  >
                    <Sparkles size={16} />
                    Regenerate
                  </button>
                )}
              </div>

              <div className="mt-6 mx-10 px-5 py-4 bg-[#e8efe8]/[0.02] border border-[#e8efe8]/[0.06] rounded-2xl flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M8 12v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <span className="text-[13px] font-medium text-[#e8efe8]/60 flex-1">
                  Global Instructions active — your custom context will be appended to every prompt below.
                </span>
              </div>

              <div className="mt-6 mx-10 max-w-[880px]">
                <input 
                  type="text"
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#e8efe8]/[0.02] border border-[#e8efe8]/[0.06] rounded-2xl px-5 py-4 text-[14px] font-medium text-[#e8efe8] outline-none focus:border-green-500/40 transition-colors"
                />
              </div>

              <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-10 py-8 pb-12">
                <div className="flex flex-col gap-5 max-w-[880px]">
                  
                  {displayedPrompts.length > 0 ? (
                    displayedPrompts.map((prompt: any, index: number) => {
                      const isExpanded = expandedPrompts[prompt.id] ?? true;
                      return (
                        <div key={prompt.id} className={`border border-[#e8efe8]/[0.06] rounded-[24px] overflow-hidden transition-all ${isExpanded ? 'bg-[#141814]/50' : 'bg-[#0a0f0a] hover:bg-[#141c14]/50 hover:border-[#e8efe8]/[0.12]'}`}>
                          <div 
                            onClick={() => togglePrompt(prompt.id)}
                            className={`flex items-center justify-between p-6 px-8 cursor-pointer ${isExpanded ? 'border-b border-[#e8efe8]/[0.04]' : ''}`}
                          >
                            <div className="flex items-center gap-4.5">
                              <div className="w-10 h-10 rounded-xl bg-[#e8efe8]/[0.04] border border-[#e8efe8]/5 flex items-center justify-center text-[15px] font-bold text-[#e8efe8]/60">
                                {(index + 1).toString().padStart(2, '0')}
                              </div>
                              <div>
                                <div className="text-[16px] font-bold text-white mb-0.5">{prompt.name}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={(e) => toggleFavorite(e, prompt.id, checkIsFavorite(prompt))}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${checkIsFavorite(prompt) ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/20 scale-110' : 'bg-[#e8efe8]/5 text-[#e8efe8]/40 border border-transparent hover:bg-[#e8efe8]/10 hover:text-white hover:scale-105'}`}
                              >
                                <Star size={14} fill={checkIsFavorite(prompt) ? "currentColor" : "none"} />
                              </button>
                              {!isExpanded && (
                                <button onClick={(e) => { e.stopPropagation(); copyToClipboard(prompt.id, prompt.content); }} className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-[12px] font-bold cursor-pointer transition-colors hover:bg-green-500/15">
                                  {copiedId === prompt.id ? 'Copied!' : 'Copy'}
                                </button>
                              )}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-[#e8efe8]/5 text-[#e8efe8]/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </div>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="p-6 px-8">
                              <div className="p-6 bg-[#040604]/80 border border-[#e8efe8]/[0.03] rounded-2xl font-mono text-[13.5px] leading-[1.8] text-[#e8efe8]/70 whitespace-pre-wrap">
                                {prompt.content}
                              </div>
                              <div className="flex items-center justify-end mt-5">
                                <button onClick={() => copyToClipboard(prompt.id, prompt.content)} className="flex items-center gap-2 px-5 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-[12px] font-bold cursor-pointer transition-colors hover:bg-green-500/15">
                                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><rect x="2" y="3" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M4 3V1.5h4V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                  {copiedId === prompt.id ? 'Copied!' : 'Copy Prompt'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-12 text-center bg-[#0a0f0a] border border-[#e8efe8]/[0.04] rounded-[24px]">
                      <div className="text-[18px] font-bold text-white mb-2.5">No Prompts Generated Yet</div>
                      <div className="text-[14px] font-medium text-[#e8efe8]/40 mb-6">Click below to generate prompts for this project based on its context.</div>
                      <button 
                        onClick={() => setShowGenModal(true)}
                        className="px-8 py-3.5 bg-gradient-to-br from-green-500 to-teal-500 hover:opacity-90 rounded-xl text-[#080c08] font-bold text-[14px] transition-opacity shadow-lg shadow-green-500/20"
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
              <div className="text-[#e8efe8]/30 text-[15px] font-medium">Select a project or create a new one.</div>
            </div>
          )}
        </div>
      )}

      {/* --- Template Preview Modal --- */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#040604]/80 backdrop-blur-md p-4 animate-fade-in-up">
          <div className="w-full max-w-2xl max-h-[85vh] bg-[#0a0f0a] border border-[#e8efe8]/10 rounded-[24px] shadow-2xl flex flex-col">
            <div className="p-6 px-7 border-b border-[#e8efe8]/5 flex items-center justify-between shrink-0">
              <h3 className="text-[18px] font-bold text-white pr-4">{selectedTemplate.title}</h3>
              <button onClick={() => setSelectedTemplate(null)} className="w-8 h-8 rounded-full bg-[#e8efe8]/5 flex items-center justify-center text-[#e8efe8]/40 hover:text-white hover:bg-[#e8efe8]/10 transition-colors shrink-0">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <div className="p-7 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <pre className="text-[14px] font-mono text-[#e8efe8]/80 whitespace-pre-wrap font-medium font-sans">{selectedTemplate.prompt}</pre>
            </div>
            <div className="p-6 border-t border-[#e8efe8]/5 flex justify-end gap-3 shrink-0 bg-[#e8efe8]/[0.01]">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(selectedTemplate.prompt);
                  setCopiedTemplate(-1);
                  setTimeout(() => setCopiedTemplate(null), 2000);
                }}
                className="px-5 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 rounded-xl text-[14px] font-bold flex items-center gap-2 transition-all"
              >
                {copiedTemplate === -1 ? <CheckCircle2 size={16}/> : <Copy size={16}/>} 
                {copiedTemplate === -1 ? 'Copied to Clipboard!' : 'Copy Full Prompt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Generation Modal --- */}
      {showGenModal && activeProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#040604]/80 backdrop-blur-md p-4 animate-fade-in-up">
          <div className="w-full max-w-lg max-h-[85vh] bg-[#0a0f0a] border border-[#e8efe8]/10 rounded-[24px] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 px-7 border-b border-[#e8efe8]/5 flex items-center justify-between bg-[#e8efe8]/[0.01] shrink-0">
              <h3 className="text-[18px] font-bold text-white">Generation Options</h3>
              {activeProject?.generatedPrompts?.length === 0 && (
                <button onClick={() => setShowGenModal(false)} className="w-8 h-8 rounded-full bg-[#e8efe8]/5 flex items-center justify-center text-[#e8efe8]/40 hover:text-white hover:bg-[#e8efe8]/10 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>
            <div className="p-7 flex flex-col gap-5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shrink">
              <div 
                onClick={() => setUseCustomKey(false)}
                className={`p-5 rounded-2xl border-2 flex flex-col gap-1.5 cursor-pointer transition-all ${!useCustomKey ? 'bg-green-500/5 border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.05)]' : 'bg-[#e8efe8]/[0.02] border-[#e8efe8]/5 hover:border-[#e8efe8]/15'}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[15px] font-bold ${!useCustomKey ? 'text-green-500' : 'text-[#e8efe8]'}`}>Use Credits</span>
                  {!useCustomKey && <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-[#080c08]"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M13.333 4L6 11.333 2.667 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>}
                </div>
                <span className="text-[13px] font-medium text-[#e8efe8]/50">Deduct 1 generation credit (You have {license.workflowCredits} left). Fast & seamless.</span>
              </div>
              
              <div 
                onClick={() => setUseCustomKey(true)}
                className={`p-5 rounded-2xl border-2 flex flex-col gap-3.5 cursor-pointer transition-all ${useCustomKey ? 'bg-green-500/5 border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.05)]' : 'bg-[#e8efe8]/[0.02] border-[#e8efe8]/5 hover:border-[#e8efe8]/15'}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[15px] font-bold ${useCustomKey ? 'text-green-500' : 'text-[#e8efe8]'}`}>Use Custom API Key</span>
                  {useCustomKey && <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-[#080c08]"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M13.333 4L6 11.333 2.667 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>}
                </div>
                <span className="text-[13px] font-medium text-[#e8efe8]/50">Use your own OpenRouter API key. 0 credits deducted.</span>
                {useCustomKey && (
                  <input 
                    type="text" 
                    placeholder="sk-or-v1-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full mt-1 bg-[#040604] border border-[#e8efe8]/10 rounded-xl p-3.5 text-[14px] text-white outline-none focus:border-green-500/50 transition-colors"
                  />
                )}
              </div>
            </div>
            <div className="p-6 border-t border-[#e8efe8]/5 flex items-center justify-end gap-4 bg-[#e8efe8]/[0.01] shrink-0">
              <button 
                onClick={() => setShowGenModal(false)}
                className="px-5 py-2.5 text-[14px] font-bold text-[#e8efe8]/50 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleGenerate}
                disabled={isGeneratingStream || (!useCustomKey && license.workflowCredits <= 0) || (useCustomKey && !apiKey.trim())}
                className="px-7 py-3 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl text-[#080c08] font-bold text-[14px] disabled:opacity-50 flex items-center gap-2.5 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-shadow"
              >
                {isGeneratingStream ? "Initializing OS..." : "Generate Now"}
              </button>
            </div>

            {/* Agent Progress Flow UI */}
            {isGeneratingStream && (
              <div className="p-7 border-t border-[#e8efe8]/10 bg-[#040604] shrink overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-4 max-h-[320px]">
                <div className="text-[14px] font-bold text-green-500 mb-2 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                  Prompt OS Pipeline Active
                </div>
                {agentStatuses.map((s, i) => (
                  <div key={i} className="flex items-start gap-4 animate-fade-in-up">
                    <div className={`w-7 h-7 mt-0.5 rounded-lg flex items-center justify-center shrink-0 ${s.status === 'completed' || s.status === 'saving' ? 'bg-green-500/20 text-green-500' : s.status === 'running' ? 'bg-[#e8efe8]/10 text-[#e8efe8]' : 'bg-red-500/20 text-red-500'}`}>
                      {s.status === 'completed' || s.status === 'saving' ? (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13.333 4L6 11.333 2.667 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : s.status === 'running' ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <span className="text-[12px] font-bold">!</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[14px] font-bold ${s.status === 'running' ? 'text-white' : 'text-[#e8efe8]/60'}`}>
                        {s.agent}
                      </span>
                      {s.subMessage && (
                        <span className="text-[12px] font-medium text-[#e8efe8]/40 mt-1">
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
