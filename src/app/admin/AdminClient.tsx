"use client";

import { useState, useTransition } from "react";
import { generateLicenseKey, revokeLicense, updateCredits, updateCustomer } from "@/actions/admin";
import { logout } from "@/actions/auth";

export default function AdminClient({ stats, allLicenses, allProjects }: { stats: any, allLicenses: any[], allProjects: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'FLOWS'>('DASHBOARD');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showGenModal, setShowGenModal] = useState(false);
  const [newLicData, setNewLicData] = useState({ name: '', source: '', credits: 20 });
  const [editingCustomer, setEditingCustomer] = useState<{ id: string, name: string, source: string } | null>(null);
  const [viewingFlowsFor, setViewingFlowsFor] = useState<string | null>(null);
  const [viewingFlow, setViewingFlow] = useState<any>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const displayedLicenses = filter === 'ACTIVE' ? allLicenses.filter(l => l.status === 'ACTIVE') : allLicenses;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.append('customerName', newLicData.name);
      formData.append('source', newLicData.source);
      formData.append('credits', newLicData.credits.toString());
      const res = await generateLicenseKey(formData);
      if (res?.error) {
        alert("Error generating license: " + res.error);
      } else {
        setShowGenModal(false);
        setNewLicData({ name: '', source: '', credits: 20 });
      }
    });
  };

  const handleRevoke = (id: string) => {
    startTransition(async () => {
      await revokeLicense(id);
    });
  };

  const handleUpdateCredits = (id: string, amount: number) => {
    startTransition(async () => {
      await updateCredits(id, amount);
    });
  };

  const handleUpdateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    startTransition(async () => {
      const res = await updateCustomer(editingCustomer.id, editingCustomer.name, editingCustomer.source);
      if (res?.error) {
        alert("Error updating customer: " + res.error);
      } else {
        setEditingCustomer(null);
      }
    });
  };

  return (
    <div className="flex w-screen h-screen font-sans text-[#e8efe8] bg-[#080c08] overflow-hidden">
      {/* Admin Sidebar */}
      <div className="w-[240px] flex flex-col bg-[#0e0e0e]/95 border-r border-[#e8efe8]/[0.06] shrink-0">
        {/* Logo */}
        <div className="p-5 pb-6 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L11 7L16 9L11 11L9 16L7 11L2 9L7 7L9 2Z" fill="#080c08"/>
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-bold tracking-[-0.3px]">Rotifex</div>
            <div className="text-[10px] font-semibold text-[#e8efe8]/30 tracking-[1px]">ADMIN</div>
          </div>
        </div>

        {/* Admin nav */}
        <div className="flex-1 overflow-y-auto px-2">
          <div onClick={() => setActiveTab('DASHBOARD')} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer mb-0.5 ${activeTab === 'DASHBOARD' ? 'bg-green-500/[0.08] text-green-500' : 'hover:bg-[#e8efe8]/[0.04] text-[#e8efe8]/50'}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>
            <span className="text-[13px] font-semibold">Dashboard</span>
          </div>
          <div onClick={() => setActiveTab('FLOWS')} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer mb-0.5 ${activeTab === 'FLOWS' ? 'bg-green-500/[0.08] text-green-500' : 'hover:bg-[#e8efe8]/[0.04] text-[#e8efe8]/50'}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 3v10M8 3v10M12 3v10M2 8h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            <span className="text-[13px] font-semibold">Generated Flows</span>
          </div>
        </div>

        {/* Admin user */}
        <div className="p-4 border-t border-[#e8efe8]/[0.06] flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-[13px] font-bold text-[#080c08]">A</div>
            <div>
              <div className="text-xs font-semibold text-[#e8efe8]/70">Admin</div>
              <div className="text-[10px] text-[#e8efe8]/25">admin@rotifex.ai</div>
            </div>
          </div>
          <form action={logout}>
            <button type="submit" className="w-full flex items-center gap-2.5 px-3 py-2 bg-transparent border border-transparent rounded-lg cursor-pointer transition-colors hover:bg-red-500/10 hover:border-red-500/20 text-[#e8efe8]/40 hover:text-red-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              <span className="text-[12px] font-semibold">Sign Out</span>
            </button>
          </form>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center justify-between py-4 px-8 border-b border-[#e8efe8]/[0.06] shrink-0">
          <div>
            <div className="text-xl font-bold tracking-[-0.5px]">Dashboard</div>
            <div className="text-xs text-[#e8efe8]/30 mt-0.5">Overview of platform activity and usage</div>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="flex items-center gap-1.5 px-4 py-2 bg-[#e8efe8]/[0.04] border border-[#e8efe8]/[0.08] rounded-lg text-[#e8efe8]/50 text-xs font-medium cursor-pointer hover:bg-[#e8efe8]/[0.08]">
              Last 30 days
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button 
              onClick={() => setShowGenModal(true)}
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-green-500 to-teal-500 border-none rounded-lg text-[#080c08] text-xs font-bold cursor-pointer hover:shadow-[0_4px_16px_rgba(34,197,94,0.25)] disabled:opacity-50"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="#080c08" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Generate UUID
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 pb-12">

        {activeTab === 'DASHBOARD' && (
          <>
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4 mb-7">
            {/* Stat 1 */}
            <div className="p-5 bg-[#141c14]/40 border border-[#e8efe8]/[0.06] rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#e8efe8]/35 tracking-[0.5px]">ACTIVE UUIDs</span>
                <div className="w-8 h-8 rounded-lg bg-[#e8efe8]/[0.06] flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="2" stroke="rgba(232,239,232,0.4)" strokeWidth="1.3"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="rgba(232,239,232,0.4)" strokeWidth="1.3"/></svg>
                </div>
              </div>
              <div className="text-[32px] font-bold tracking-[-1px] text-[#e8efe8]">{stats.activeLicenses}</div>
            </div>

            {/* Stat 2 */}
            <div className="p-5 bg-[#141c14]/40 border border-[#e8efe8]/[0.06] rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#e8efe8]/35 tracking-[0.5px]">WORKFLOWS</span>
                <div className="w-8 h-8 rounded-lg bg-[#e8efe8]/[0.06] flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3h4v4H3zM9 9h4v4H9z" stroke="rgba(232,239,232,0.4)" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 5h4v4" stroke="rgba(232,239,232,0.4)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
              <div className="text-[32px] font-bold tracking-[-1px] text-[#e8efe8]">{stats.workflows}</div>
            </div>

            {/* Stat 3 */}
            <div className="p-5 bg-[#141c14]/40 border border-[#e8efe8]/[0.06] rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#e8efe8]/35 tracking-[0.5px]">PROMPTS</span>
                <div className="w-8 h-8 rounded-lg bg-[#e8efe8]/[0.06] flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4h8v8H4z" stroke="rgba(232,239,232,0.4)" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 7h2M7 9h4" stroke="rgba(232,239,232,0.4)" strokeWidth="1.3" strokeLinecap="round"/></svg>
                </div>
              </div>
              <div className="text-[32px] font-bold tracking-[-1px] text-[#e8efe8]">{stats.prompts}</div>
            </div>

            {/* Stat 4 */}
            <div className="p-5 bg-[#141c14]/40 border border-[#e8efe8]/[0.06] rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#e8efe8]/35 tracking-[0.5px]">EXPIRING SOON</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/[0.08] flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#f59e0b" strokeWidth="1.3"/><path d="M8 5v3.5l2 1.5" stroke="#f59e0b" strokeWidth="1.3" strokeLinecap="round"/></svg>
                </div>
              </div>
              <div className="text-[32px] font-bold tracking-[-1px] text-amber-500">{stats.expiringLicenses}</div>
            </div>
          </div>

          {/* UUID Management Table */}
          <div className="bg-[#141c14]/40 border border-[#e8efe8]/[0.06] rounded-2xl overflow-hidden mb-7">

            {/* Table header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8efe8]/[0.06]">
              <div className="flex items-center gap-3">
                <span className="text-[15px] font-bold">Customers & UUIDs</span>
                <span className="px-2.5 py-1 bg-green-500/[0.08] rounded-md text-[11px] font-semibold text-green-500">{stats.activeLicenses} active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5 p-1 bg-[#e8efe8]/[0.03] rounded-lg">
                  <span onClick={() => setFilter('ALL')} className={`px-3 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${filter === 'ALL' ? 'bg-[#e8efe8]/[0.08] text-[#e8efe8]/70' : 'text-[#e8efe8]/30 hover:text-[#e8efe8]/50'}`}>All</span>
                  <span onClick={() => setFilter('ACTIVE')} className={`px-3 py-1 rounded-md text-[11px] font-medium cursor-pointer ${filter === 'ACTIVE' ? 'bg-[#e8efe8]/[0.08] text-[#e8efe8]/70' : 'text-[#e8efe8]/30 hover:text-[#e8efe8]/50'}`}>Active</span>
                </div>
              </div>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[2.5fr_1fr_1fr_1.5fr_160px] px-6 py-2.5 border-b border-[#e8efe8]/[0.04]">
              <span className="text-[10px] font-semibold text-[#e8efe8]/20 tracking-[1px]">CUSTOMER / UUID</span>
              <span className="text-[10px] font-semibold text-[#e8efe8]/20 tracking-[1px]">STATUS</span>
              <span className="text-[10px] font-semibold text-[#e8efe8]/20 tracking-[1px]">CREDITS</span>
              <span className="text-[10px] font-semibold text-[#e8efe8]/20 tracking-[1px]">JOINED / EXPIRES</span>
              <span className="text-[10px] font-semibold text-[#e8efe8]/20 tracking-[1px] text-right">ACTIONS</span>
            </div>

            {/* Rows */}
            {displayedLicenses.map((license) => (
              <div key={license.id} className="grid grid-cols-[2.5fr_1fr_1fr_1.5fr_160px] px-6 py-3.5 border-b border-[#e8efe8]/[0.03] items-center transition-colors hover:bg-[#e8efe8]/[0.02]">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[13px] font-bold text-[#e8efe8]/90">{license.customerName || 'Unnamed Customer'}</span>
                    <span className="text-[10px] text-[#e8efe8]/40 px-2 py-0.5 bg-[#e8efe8]/5 rounded-md">{license.source || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-mono text-[#e8efe8]/50">{license.key}</div>
                    <button onClick={() => handleCopy(license.id, license.key)} className="text-[#e8efe8]/30 hover:text-green-500 transition-colors cursor-pointer" title="Copy UUID">
                      {copiedId === license.id ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="3" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M4 3V1.5h4V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <span className={`px-2.5 py-1 border rounded-md text-[11px] font-semibold ${license.status === 'ACTIVE' ? 'bg-green-500/10 border-green-500/15 text-green-500' : 'bg-red-500/10 border-red-500/15 text-red-500'}`}>
                    {license.status}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleUpdateCredits(license.id, -10)} disabled={isPending || license.workflowCredits < 10} className="w-5 h-5 rounded flex items-center justify-center bg-[#e8efe8]/[0.05] hover:bg-[#e8efe8]/[0.1] text-[#e8efe8]/50 hover:text-[#e8efe8] disabled:opacity-30 cursor-pointer">-</button>
                    <div className="text-[13px] font-semibold text-[#e8efe8] w-[40px] text-center">{license.workflowCredits}</div>
                    <button onClick={() => handleUpdateCredits(license.id, 10)} disabled={isPending} className="w-5 h-5 rounded flex items-center justify-center bg-[#e8efe8]/[0.05] hover:bg-[#e8efe8]/[0.1] text-[#e8efe8]/50 hover:text-[#e8efe8] disabled:opacity-30 cursor-pointer">+</button>
                  </div>
                </div>
                <div>
                  <div className="text-[12px] text-[#e8efe8]/80">{new Date(license.createdAt).toLocaleDateString()}</div>
                  <div className="text-[10px] text-[#e8efe8]/40 mt-0.5">Exp: {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : 'Never'}</div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setViewingFlowsFor(license.id); setActiveTab('FLOWS'); }} className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-[10px] font-bold hover:bg-blue-500/20 cursor-pointer" title="View Flows">Flows</button>
                  <button onClick={() => setEditingCustomer({ id: license.id, name: license.customerName || '', source: license.source || '' })} className="px-2 py-1 bg-[#e8efe8]/[0.06] text-[#e8efe8]/60 rounded text-[10px] font-bold hover:bg-[#e8efe8]/[0.1] hover:text-[#e8efe8] cursor-pointer" title="Edit Customer">Edit</button>
                  {license.status === 'ACTIVE' && (
                    <button 
                      onClick={() => handleRevoke(license.id)}
                      disabled={isPending}
                      title="Revoke License"
                      className="px-2 py-1 rounded-md bg-[#e8efe8]/[0.04] flex items-center justify-center cursor-pointer hover:bg-red-500/20 hover:text-red-500 text-[#e8efe8]/40 transition-colors disabled:opacity-50"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {allLicenses.length === 0 && (
              <div className="p-8 text-center text-[#e8efe8]/30 text-sm">No licenses generated yet.</div>
            )}
          </div>
          </>
        )}

        {activeTab === 'FLOWS' && (
          <div className="bg-[#141c14]/40 border border-[#e8efe8]/[0.06] rounded-2xl overflow-hidden mb-7">
            <div className="px-6 py-4 border-b border-[#e8efe8]/[0.06] flex items-center justify-between">
              <span className="text-[15px] font-bold">
                Generated Flows {viewingFlowsFor && `(Filtered)`}
              </span>
              {viewingFlowsFor && (
                <button onClick={() => setViewingFlowsFor(null)} className="text-[11px] text-[#e8efe8]/40 hover:text-white cursor-pointer">Clear Filter</button>
              )}
            </div>
            <div className="grid grid-cols-[2fr_1fr_1fr_100px] px-6 py-2.5 border-b border-[#e8efe8]/[0.04]">
              <span className="text-[10px] font-semibold text-[#e8efe8]/20 tracking-[1px]">PROJECT NAME</span>
              <span className="text-[10px] font-semibold text-[#e8efe8]/20 tracking-[1px]">CUSTOMER / KEY</span>
              <span className="text-[10px] font-semibold text-[#e8efe8]/20 tracking-[1px]">DATE</span>
              <span className="text-[10px] font-semibold text-[#e8efe8]/20 tracking-[1px] text-right">ACTIONS</span>
            </div>
            {allProjects.filter(p => !viewingFlowsFor || p.licenseId === viewingFlowsFor).map(project => (
              <div key={project.id} className="grid grid-cols-[2fr_1fr_1fr_100px] px-6 py-3.5 border-b border-[#e8efe8]/[0.03] items-center transition-colors hover:bg-[#e8efe8]/[0.02]">
                <div className="text-[13px] font-semibold text-green-500">{project.name}</div>
                <div className="text-xs text-[#e8efe8]/60">{project.license?.customerName || project.license?.key?.split('-')[0] + '...'}</div>
                <div className="text-xs text-[#e8efe8]/35">{new Date(project.createdAt).toLocaleDateString()}</div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setViewingFlow(project)} className="px-3 py-1.5 bg-[#e8efe8]/[0.06] text-[#e8efe8]/80 rounded text-[10px] font-bold hover:bg-green-500 hover:text-black transition-colors cursor-pointer">View</button>
                </div>
              </div>
            ))}
            {allProjects.filter(p => !viewingFlowsFor || p.licenseId === viewingFlowsFor).length === 0 && (
              <div className="p-8 text-center text-[#e8efe8]/30 text-sm">No projects generated yet.</div>
            )}
          </div>
        )}

        </div>
      </div>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-[400px] bg-[#0a0f0a] border border-[#e8efe8]/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[15px] font-bold">Edit Customer</h3>
              <button onClick={() => setEditingCustomer(null)} className="text-[#e8efe8]/40 hover:text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleUpdateCustomer} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#e8efe8]/50">CUSTOMER NAME</label>
                <input required type="text" value={editingCustomer.name} onChange={e => setEditingCustomer({ ...editingCustomer, name: e.target.value })} className="w-full bg-[#e8efe8]/[0.03] border border-[#e8efe8]/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500/50" placeholder="e.g. John Doe" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#e8efe8]/50">SOURCE</label>
                <input required type="text" value={editingCustomer.source} onChange={e => setEditingCustomer({ ...editingCustomer, source: e.target.value })} className="w-full bg-[#e8efe8]/[0.03] border border-[#e8efe8]/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500/50" placeholder="e.g. Stripe Payment" />
              </div>
              <button type="submit" disabled={isPending} className="mt-2 w-full py-2.5 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg text-[#080c08] font-bold text-xs hover:shadow-[0_4px_16px_rgba(34,197,94,0.2)] disabled:opacity-50">
                {isPending ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View Flow Modal */}
      {viewingFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-[800px] max-w-full max-h-[90vh] flex flex-col bg-[#0a0f0a] border border-[#e8efe8]/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#e8efe8]/10 shrink-0">
              <div>
                <h3 className="text-[18px] font-bold text-green-500">{viewingFlow.name}</h3>
                <div className="text-xs text-[#e8efe8]/50 mt-1">Generated by {viewingFlow.license?.customerName || viewingFlow.license?.key?.split('-')[0] + '...'} on {new Date(viewingFlow.createdAt).toLocaleString()}</div>
              </div>
              <button onClick={() => setViewingFlow(null)} className="text-[#e8efe8]/40 hover:text-white cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Context Summary */}
              {viewingFlow.context && (
                <div>
                  <h4 className="text-[11px] font-bold text-[#e8efe8]/40 tracking-[1px] mb-3">PROJECT CONTEXT</h4>
                  <div className="p-4 bg-[#e8efe8]/[0.03] border border-[#e8efe8]/[0.05] rounded-xl text-[13px] leading-relaxed whitespace-pre-wrap text-[#e8efe8]/80">
                    {JSON.stringify(viewingFlow.context, null, 2)}
                  </div>
                </div>
              )}

              {/* Generated Prompts */}
              {viewingFlow.generatedPrompts?.length > 0 ? (
                <div>
                  <h4 className="text-[11px] font-bold text-[#e8efe8]/40 tracking-[1px] mb-3">GENERATED PROMPTS</h4>
                  <div className="space-y-4">
                    {viewingFlow.generatedPrompts.map((prompt: any, i: number) => (
                      <div key={i} className="border border-green-500/20 rounded-xl overflow-hidden">
                        <div className="bg-green-500/10 px-4 py-2 border-b border-green-500/20">
                          <span className="text-xs font-bold text-green-500">{prompt.name || 'Final Output'}</span>
                        </div>
                        <div className="p-4 bg-[#080c08] overflow-x-auto">
                          <pre className="text-[13px] leading-relaxed text-[#e8efe8]/90 whitespace-pre-wrap font-mono">
                            {prompt.content}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-[#e8efe8]/30 border border-dashed border-[#e8efe8]/10 rounded-xl">
                  No generated prompts found for this flow.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generate License Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-[400px] bg-[#0a0f0a] border border-[#e8efe8]/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[15px] font-bold">Create New UUID</h3>
              <button onClick={() => setShowGenModal(false)} className="text-[#e8efe8]/40 hover:text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleGenerate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#e8efe8]/50">CUSTOMER NAME</label>
                <input required type="text" value={newLicData.name} onChange={e => setNewLicData({ ...newLicData, name: e.target.value })} className="w-full bg-[#e8efe8]/[0.03] border border-[#e8efe8]/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500/50" placeholder="e.g. John Doe" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#e8efe8]/50">SOURCE (e.g. Stripe, Manual)</label>
                <input required type="text" value={newLicData.source} onChange={e => setNewLicData({ ...newLicData, source: e.target.value })} className="w-full bg-[#e8efe8]/[0.03] border border-[#e8efe8]/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500/50" placeholder="e.g. Stripe Payment" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#e8efe8]/50">INITIAL CREDITS</label>
                <input required type="number" value={newLicData.credits} onChange={e => setNewLicData({ ...newLicData, credits: parseInt(e.target.value) || 0 })} className="w-full bg-[#e8efe8]/[0.03] border border-[#e8efe8]/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500/50" />
              </div>
              <button type="submit" disabled={isPending} className="mt-2 w-full py-2.5 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg text-[#080c08] font-bold text-xs hover:shadow-[0_4px_16px_rgba(34,197,94,0.2)] disabled:opacity-50">
                {isPending ? "Generating..." : "Generate License"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
