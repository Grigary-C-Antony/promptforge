"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { createProject } from "@/actions/project";

const STEPS = [
  { id: "platform", title: "Platform", subtitle: "Select Platform", desc: "Choose the target platform for your project." },
  { id: "categories", title: "Category", subtitle: "Select Category", desc: "Choose a primary category for your project." },
  { id: "business", title: "Business", subtitle: "Business Information", desc: "Provide details about your business and brand." },
  { id: "tech", title: "Tech Stack", subtitle: "Technology Stack", desc: "Select the technologies you plan to use." },
  { id: "features", title: "Features", subtitle: "Core Features", desc: "What are the main features of your project?" },
  { id: "design", title: "Design", subtitle: "Design Preferences", desc: "Describe your ideal aesthetic and UI style." },
  { id: "goals", title: "Goals", subtitle: "Business Goals", desc: "Define your primary objectives and KPIs." },
  { id: "constraints", title: "Constraints", subtitle: "Project Constraints", desc: "Any limitations, budget, or hard constraints?" }
];

const PLATFORMS = [
  "Web App", "Chrome Extension", "Mobile App", "Desktop App", "API Service", "Other"
];

const CATEGORIES = [
  "E-commerce & Marketplace", "SaaS & Business", "Healthcare & Wellness",
  "Education & Learning", "Finance & Enterprise", "Travel & Hospitality",
  "Real Estate", "Marketing & Content", "Developer Tools", "Corporate Website", "Custom Category"
];

const TECH_CATEGORIES = {
  frontend: ["Next.js", "React", "Vue", "Angular", "Flutter", "React Native", "Electron", "Tauri"],
  backend: ["Next.js Route Handlers", "Supabase", "Express", "NestJS", "FastAPI", "Rust", "Go", "Python"],
  database: ["Neon PostgreSQL", "Supabase PostgreSQL", "MySQL", "MongoDB"],
  orm: ["Prisma", "Drizzle"],
  auth: ["UUID License Authentication", "Auth.js", "Clerk", "Supabase Auth"],
  storage: ["Cloudinary", "Supabase Storage", "AWS S3"],
  email: ["Resend", "SendGrid"],
  hosting: ["Vercel", "Railway"],
  ai: ["OpenAI", "Claude", "Gemini", "Ollama", "Custom"]
};

const FEATURES = [
  "Authentication", "User Management", "Admin Dashboard", "Analytics", "Search",
  "Wishlist", "Reviews", "Coupons", "Inventory", "Payment Gateway", "Shipping",
  "Notifications", "AI Chat", "AI Recommendations", "Reports", "SEO",
  "Multi-language", "Multi-currency", "Dark Mode", "Other"
];

const DESIGN_PREFS = [
  "Glassmorphism", "Liquid Glass", "Apple Inspired", "Material Design",
  "Minimal", "Corporate", "Premium", "Dashboard Style", "Other"
];

export default function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const methods = useForm({
    defaultValues: {
      platform: "",
      customPlatform: "",
      category: "",
      customCategory: "",
      business: { projectName: "", companyName: "", industry: "", businessModel: "", niche: "", targetAudience: "", country: "", competitors: "", revenueModel: "", brandPersonality: "", brandDescription: "", uniqueSellingProp: "", existingWebsite: "" },
      tech: { frontend: "", backend: "", database: "", orm: "", auth: "", storage: "", email: "", hosting: "", ai: "", customTech: "" },
      features: [] as string[],
      customFeatures: "",
      design: { style: "", theme: "", primaryColor: "", secondaryColor: "", typography: "", borderRadius: "", preferences: [] as string[] },
      customDesign: "",
      goals: { primaryGoal: "", successMetrics: "", kpis: "", businessObjectives: "", technicalObjectives: "" },
      constraints: { timeline: "", budget: "", teamSize: "", compliance: "", performance: "", security: "", accessibility: "", seo: "", additional: "" }
    }
  });

  const onSubmit = async (data: any) => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsSubmitting(true);
      try {
        const finalCategory = data.category === "Custom Category" && data.customCategory.trim() !== "" ? data.customCategory : data.category;
        const payload = {
          categories: [finalCategory],
          platform: data.platform === "Other" && data.customPlatform?.trim() ? data.customPlatform : data.platform,
          businessName: data.business.projectName || data.business.companyName || "New Project",
          ...data
        };
        const res = await createProject(payload);
        if (res.success) {
          router.push("/workspace");
        } else {
          alert("Error creating project: " + res.error);
        }
      } catch (e) {
        alert("Unexpected error.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const currentStepData = STEPS[currentStep];

  const renderInput = (name: string, label: string, type = "text", placeholder = "") => (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-[#e8efe8]/60 tracking-[0.5px] uppercase">{label}</label>
      {type === "textarea" ? (
        <textarea {...methods.register(name as any)} className="bg-[#e8efe8]/[0.02] border border-[#e8efe8]/10 rounded-xl p-4 outline-none focus:border-green-500/50 min-h-[100px] text-sm text-[#e8efe8]" placeholder={placeholder} />
      ) : (
        <input type={type} {...methods.register(name as any)} className="bg-[#e8efe8]/[0.02] border border-[#e8efe8]/10 rounded-xl p-3 outline-none focus:border-green-500/50 text-sm text-[#e8efe8]" placeholder={placeholder} />
      )}
    </div>
  );

  return (
    <div className="min-h-screen font-sans text-[#e8efe8] bg-[#080c08] flex flex-col overflow-x-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-10 py-5 border-b border-[#e8efe8]/[0.06] bg-[#080c08]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M9 2L11 7L16 9L11 11L9 16L7 11L2 9L7 7L9 2Z" fill="#080c08"/></svg>
          </div>
          <span className="text-base font-bold tracking-[-0.3px]">Rotifex</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-6 md:px-10 pt-12 pb-24 relative">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.03)_0%,transparent_70%)] top-0 left-1/2 -translate-x-1/2 pointer-events-none"></div>

        {/* Step indicator */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12 relative z-10 animate-fade-in-up">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center text-[13px] font-bold transition-all duration-300 ${currentStep === index ? 'bg-gradient-to-br from-green-500 to-teal-500 text-[#080c08] scale-110 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : currentStep > index ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-[#e8efe8]/[0.06] border border-[#e8efe8]/10 text-[#e8efe8]/30'}`}>
                  {currentStep > index ? <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> : (index + 1)}
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-6 md:w-10 h-0.5 mx-1 rounded-sm transition-colors duration-300 ${currentStep > index ? 'bg-green-500/30' : 'bg-[#e8efe8]/[0.06]'}`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="w-full max-w-[800px] relative z-10 animate-fade-in-up">
          <div className="text-center mb-10">
            <div className="text-[28px] font-bold tracking-[-0.5px] mb-2">{currentStepData.subtitle}</div>
            <div className="text-[15px] text-[#e8efe8]/40">{currentStepData.desc}</div>
          </div>

          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col gap-8">
              
              {currentStep === 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {PLATFORMS.map(plat => {
                    const isSelected = methods.watch("platform") === plat;
                    return (
                      <div 
                        key={plat} 
                        onClick={() => methods.setValue("platform", plat)}
                        className={`p-5 px-4 border-[1.5px] rounded-2xl flex flex-col items-center gap-3 cursor-pointer text-center transition-all ${isSelected ? 'bg-green-500/[0.08] border-green-500/40 shadow-[0_4px_20px_rgba(34,197,94,0.1)] scale-[1.02]' : 'bg-[#e8efe8]/[0.02] border-[#e8efe8]/[0.08] hover:bg-[#e8efe8]/[0.04]'}`}
                      >
                        <div className={`text-[13px] font-bold ${isSelected ? 'text-green-500' : 'text-[#e8efe8]/60'}`}>{plat}</div>
                      </div>
                    )
                  })}
                </div>
                {methods.watch("platform") === "Other" && (
                  <div className="mt-4 flex flex-col gap-2 animate-fade-in-up">
                    <label className="text-xs font-semibold text-[#e8efe8]/60 tracking-[0.5px] uppercase">Please Specify Custom Platform</label>
                    <input 
                      type="text" 
                      {...methods.register("customPlatform", { maxLength: 100 })}
                      maxLength={100}
                      className="bg-[#e8efe8]/[0.02] border border-[#e8efe8]/10 rounded-xl p-3 outline-none focus:border-green-500/50 text-sm text-[#e8efe8]"
                      placeholder="e.g. Smart Watch App (max 100 chars)"
                    />
                    <div className="text-[10px] text-right text-[#e8efe8]/40">
                      {methods.watch("customPlatform")?.length || 0}/100
                    </div>
                  </div>
                )}
                </>
              )}

              {currentStep === 1 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {CATEGORIES.map(cat => {
                      const isSelected = methods.watch("category") === cat;
                      return (
                        <div 
                          key={cat} 
                          onClick={() => methods.setValue("category", cat)}
                          className={`p-5 px-4 border-[1.5px] rounded-2xl flex flex-col items-center gap-3 cursor-pointer text-center transition-all ${isSelected ? 'bg-green-500/[0.08] border-green-500/40 shadow-[0_4px_20px_rgba(34,197,94,0.1)] scale-[1.02]' : 'bg-[#e8efe8]/[0.02] border-[#e8efe8]/[0.08] hover:bg-[#e8efe8]/[0.04]'}`}
                        >
                          <div className={`text-[13px] font-bold ${isSelected ? 'text-green-500' : 'text-[#e8efe8]/60'}`}>{cat}</div>
                        </div>
                      )
                    })}
                  </div>
                  {methods.watch("category") === "Custom Category" && (
                    <div className="mt-4 flex flex-col gap-2 animate-fade-in-up">
                      <label className="text-xs font-semibold text-[#e8efe8]/60 tracking-[0.5px] uppercase">Please Specify Custom Category</label>
                      <input 
                        type="text" 
                        {...methods.register("customCategory", { maxLength: 50 })}
                        maxLength={50}
                        className="bg-[#e8efe8]/[0.02] border border-[#e8efe8]/10 rounded-xl p-3 outline-none focus:border-green-500/50 text-sm text-[#e8efe8]"
                        placeholder="e.g. Smart Home IoT (max 50 chars)"
                      />
                      <div className="text-[10px] text-right text-[#e8efe8]/40">
                        {methods.watch("customCategory")?.length || 0}/50
                      </div>
                    </div>
                  )}
                </>
              )}

              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderInput("business.projectName", "Project Name", "text", "e.g. PromptForge")}
                  {renderInput("business.companyName", "Company Name", "text", "e.g. Acme Corp")}
                  {renderInput("business.industry", "Industry", "text", "e.g. Technology")}
                  {renderInput("business.businessModel", "Business Model", "text", "e.g. B2B SaaS")}
                  {renderInput("business.niche", "Niche", "text", "e.g. AI Prompting")}
                  {renderInput("business.targetAudience", "Target Audience", "text", "e.g. Developers")}
                  {renderInput("business.country", "Country / Region", "text", "e.g. Global")}
                  {renderInput("business.revenueModel", "Revenue Model", "text", "e.g. Subscription")}
                  <div className="md:col-span-2">{renderInput("business.competitors", "Competitors", "text", "e.g. OpenAI, Anthropic")}</div>
                  <div className="md:col-span-2">{renderInput("business.brandPersonality", "Brand Personality", "text", "e.g. Innovative, Professional")}</div>
                  <div className="md:col-span-2">{renderInput("business.brandDescription", "Brand Description", "textarea", "Describe what your brand stands for...")}</div>
                  <div className="md:col-span-2">{renderInput("business.uniqueSellingProp", "Unique Selling Proposition (USP)", "textarea", "What makes you different?")}</div>
                  <div className="md:col-span-2">{renderInput("business.existingWebsite", "Existing Website (Optional)", "text", "https://")}</div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(TECH_CATEGORIES).map(([key, options]) => (
                    <div key={key} className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-[#e8efe8]/60 tracking-[0.5px] uppercase">{key}</label>
                      <select {...methods.register(`tech.${key}` as any)} className="bg-[#e8efe8]/[0.02] border border-[#e8efe8]/10 rounded-xl p-3 outline-none focus:border-green-500/50 text-sm text-[#e8efe8] appearance-none cursor-pointer">
                        <option value="" className="bg-[#080c08]">Select {key}...</option>
                        {options.map(opt => <option key={opt} value={opt} className="bg-[#080c08]">{opt}</option>)}
                      </select>
                    </div>
                  ))}
                  <div className="md:col-span-2 flex flex-col gap-2 mt-2">
                    <label className="text-xs font-semibold text-[#e8efe8]/60 tracking-[0.5px] uppercase">Other / Custom Technologies</label>
                    <input 
                      type="text" 
                      {...methods.register("tech.customTech", { maxLength: 100 })}
                      maxLength={100}
                      className="bg-[#e8efe8]/[0.02] border border-[#e8efe8]/10 rounded-xl p-3 outline-none focus:border-green-500/50 text-sm text-[#e8efe8]"
                      placeholder="List any other specific frameworks or tools (max 100 chars)"
                    />
                    <div className="text-[10px] text-right text-[#e8efe8]/40">
                      {methods.watch("tech.customTech")?.length || 0}/100
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {FEATURES.map(feature => {
                    const featuresWatched = methods.watch("features") || [];
                    const isSelected = featuresWatched.includes(feature);
                    return (
                      <div 
                        key={feature} 
                        onClick={() => {
                          const current = methods.getValues("features") || [];
                          methods.setValue("features", isSelected ? current.filter(c => c !== feature) : [...current, feature]);
                        }}
                        className={`p-3 px-4 border rounded-xl flex items-center justify-center gap-3 cursor-pointer text-center transition-all ${isSelected ? 'bg-green-500/[0.08] border-green-500/40 text-green-500' : 'bg-[#e8efe8]/[0.02] border-[#e8efe8]/[0.08] text-[#e8efe8]/60 hover:bg-[#e8efe8]/[0.05]'}`}
                      >
                        <span className="text-[13px] font-semibold">{feature}</span>
                      </div>
                    )
                  })}
                </div>
                {(methods.watch("features") || []).includes("Other") && (
                  <div className="mt-4 flex flex-col gap-2 animate-fade-in-up">
                    <label className="text-xs font-semibold text-[#e8efe8]/60 tracking-[0.5px] uppercase">Please Specify Other Features</label>
                    <input 
                      type="text" 
                      {...methods.register("customFeatures", { maxLength: 100 })}
                      maxLength={100}
                      className="bg-[#e8efe8]/[0.02] border border-[#e8efe8]/10 rounded-xl p-3 outline-none focus:border-green-500/50 text-sm text-[#e8efe8]"
                      placeholder="e.g. 3D Model Viewer, VR Support (max 100 chars)"
                    />
                    <div className="text-[10px] text-right text-[#e8efe8]/40">
                      {methods.watch("customFeatures")?.length || 0}/100
                    </div>
                  </div>
                )}
                </>
              )}

              {currentStep === 5 && (
                <div className="flex flex-col gap-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderInput("design.style", "Design Style", "text", "e.g. Modern, Minimalist")}
                    {renderInput("design.theme", "Theme", "text", "e.g. Dark Mode")}
                    {renderInput("design.primaryColor", "Primary Color", "text", "e.g. #22c55e (Green)")}
                    {renderInput("design.secondaryColor", "Secondary Color", "text", "e.g. #080c08 (Dark)")}
                    {renderInput("design.typography", "Typography", "text", "e.g. Inter, Roboto")}
                    {renderInput("design.borderRadius", "Border Radius", "text", "e.g. 12px")}
                  </div>
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-semibold text-[#e8efe8]/60 tracking-[0.5px] uppercase">Design Preferences</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {DESIGN_PREFS.map(pref => {
                        const prefsWatched = methods.watch("design.preferences") || [];
                        const isSelected = prefsWatched.includes(pref);
                        return (
                          <div 
                            key={pref} 
                            onClick={() => {
                              const current = methods.getValues("design.preferences") || [];
                              methods.setValue("design.preferences", isSelected ? current.filter(c => c !== pref) : [...current, pref]);
                            }}
                            className={`p-3 px-4 border rounded-xl flex items-center justify-center cursor-pointer text-center transition-all ${isSelected ? 'bg-green-500/[0.08] border-green-500/40 text-green-500' : 'bg-[#e8efe8]/[0.02] border-[#e8efe8]/[0.08] text-[#e8efe8]/60 hover:bg-[#e8efe8]/[0.05]'}`}
                          >
                            <span className="text-xs font-semibold">{pref}</span>
                          </div>
                        )
                      })}
                    </div>
                    {(methods.watch("design.preferences") || []).includes("Other") && (
                      <div className="mt-4 flex flex-col gap-2 animate-fade-in-up">
                        <label className="text-xs font-semibold text-[#e8efe8]/60 tracking-[0.5px] uppercase">Please Specify Other Design Preferences</label>
                        <input 
                          type="text" 
                          {...methods.register("customDesign", { maxLength: 100 })}
                          maxLength={100}
                          className="bg-[#e8efe8]/[0.02] border border-[#e8efe8]/10 rounded-xl p-3 outline-none focus:border-green-500/50 text-sm text-[#e8efe8]"
                          placeholder="e.g. Neumorphism, Cyberpunk (max 100 chars)"
                        />
                        <div className="text-[10px] text-right text-[#e8efe8]/40">
                          {methods.watch("customDesign")?.length || 0}/100
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div className="grid grid-cols-1 gap-6">
                  {renderInput("goals.primaryGoal", "Primary Goal", "textarea", "What is the main objective of this project?")}
                  {renderInput("goals.successMetrics", "Success Metrics", "textarea", "How will you measure success?")}
                  {renderInput("goals.kpis", "KPIs", "text", "e.g. Monthly Active Users, MRR")}
                  {renderInput("goals.businessObjectives", "Business Objectives", "textarea", "What business outcomes do you expect?")}
                  {renderInput("goals.technicalObjectives", "Technical Objectives", "textarea", "Any technical goals? (e.g. <1s load time)")}
                </div>
              )}

              {currentStep === 7 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderInput("constraints.timeline", "Timeline", "text", "e.g. 3 Months")}
                  {renderInput("constraints.budget", "Budget", "text", "e.g. $10,000")}
                  {renderInput("constraints.teamSize", "Team Size", "text", "e.g. 5 Developers")}
                  {renderInput("constraints.compliance", "Compliance Requirements", "text", "e.g. GDPR, HIPAA")}
                  {renderInput("constraints.performance", "Performance Requirements", "text", "e.g. Handle 10k concurrent users")}
                  {renderInput("constraints.security", "Security Requirements", "text", "e.g. SOC2 Compliance")}
                  {renderInput("constraints.accessibility", "Accessibility", "text", "e.g. WCAG 2.1 AA")}
                  {renderInput("constraints.seo", "SEO Requirements", "text", "e.g. Server-side rendering, Meta tags")}
                  <div className="md:col-span-2">
                    {renderInput("constraints.additional", "Additional Instructions", "textarea", "Any other constraints or context?")}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-[#e8efe8]/[0.06] mt-4">
                <button 
                  type="button" 
                  onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                  className={`px-6 py-3.5 bg-[#e8efe8]/[0.04] border border-[#e8efe8]/10 rounded-xl text-[#e8efe8]/60 font-sans text-sm font-semibold cursor-pointer transition-colors hover:bg-[#e8efe8]/[0.08] ${currentStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                >
                  Back
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || (currentStep === 0 && !methods.watch("platform")) || (currentStep === 1 && !methods.watch("category"))}
                  className="px-8 py-3.5 bg-gradient-to-br from-green-500 to-teal-500 border-none rounded-xl text-[#080c08] font-sans text-sm font-bold cursor-pointer flex items-center gap-2 transition-all hover:-translate-y-px hover:shadow-[0_8px_25px_rgba(34,197,94,0.25)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {isSubmitting ? "Generating Context..." : currentStep === STEPS.length - 1 ? "Complete Setup" : "Continue"}
                  {!isSubmitting && <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="#080c08" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>
              </div>

            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}
