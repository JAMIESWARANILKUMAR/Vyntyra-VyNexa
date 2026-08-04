import React, { useState } from "react";
import { 
  Users, Phone, Mail, MessageCircle, DollarSign, Calendar, Plus, 
  TrendingUp, BarChart3, CheckCircle2, AlertCircle, FileText, Send, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NonTechWorkspaceProps {
  leads: any[];
  onAddLead: (lead: any) => Promise<void>;
  onUpdateLeadStatus: (id: string, status: any, isContacted?: boolean) => Promise<void>;
  onDeleteLead: (id: string) => Promise<void>;
}

export function NonTechDomainWorkspace({ leads, onAddLead, onUpdateLeadStatus, onDeleteLead }: NonTechWorkspaceProps) {
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({
    client_name: "",
    company_name: "",
    email: "",
    phone: "",
    lead_source: "Inbound Website",
    status: "New",
    project_scope: "",
    estimated_value: 50000,
    follow_up_date: "",
  });

  // Marketing Analytics State
  const [campaigns] = useState([
    { name: "Q3 Enterprise AI Lead Gen", platform: "LinkedIn Ads", ctr: "3.4%", impressions: "45,200", spend: "₹18,500", leads: 38 },
    { name: "VyNexa Connect Launch Campaign", platform: "Google Search", ctr: "4.8%", impressions: "82,000", spend: "₹32,000", leads: 94 },
    { name: "Intern ESS Suite Outreach", platform: "Meta Ads", ctr: "2.9%", impressions: "28,400", spend: "₹12,000", leads: 22 },
  ]);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.client_name || !leadForm.company_name) return;
    try {
      await onAddLead(leadForm);
      setLeadForm({
        client_name: "",
        company_name: "",
        email: "",
        phone: "",
        lead_source: "Inbound Website",
        status: "New",
        project_scope: "",
        estimated_value: 50000,
        follow_up_date: "",
      });
      setLeadModalOpen(false);
      toast.success("Lead record created!");
    } catch (err) {
      toast.error("Failed to create lead");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Closed-Won": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Closed-Lost": return "bg-red-100 text-red-800 border-red-200";
      case "Proposal Sent": return "bg-purple-100 text-purple-800 border-purple-200";
      case "Requirement Gathered": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. CRM Funnel High-Contrast Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Leads Generated", val: leads.length || 154, sub: "+18% this week", color: "border-l-blue-500" },
          { label: "Active Pipeline Value", val: "₹18,50,000", sub: "12 Open Proposals", color: "border-l-emerald-500" },
          { label: "Conversion Rate", val: "28.4%", sub: "Above industry avg", color: "border-l-purple-500" },
          { label: "Pending Follow-Ups", val: "8 Today", sub: "Scheduled callbacks", color: "border-l-amber-500" },
        ].map((m, idx) => (
          <div key={idx} className={`p-4 rounded-xl bg-white border border-slate-200 shadow-sm border-l-4 ${m.color}`}>
            <div className="text-xs font-semibold text-slate-500 uppercase">{m.label}</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{m.val}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* 2. Lead Generation & Management Hub (LMS) */}
      <div className="rounded-xl border bg-white shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" /> CRM & Lead Management Hub
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Track inbound leads, scope projects, log contact interactions, and trigger 1-click communications.</p>
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5" onClick={() => setLeadModalOpen(!leadModalOpen)}>
            <Plus className="h-4 w-4" /> Create Lead Record
          </Button>
        </div>

        {leadModalOpen && (
          <form onSubmit={handleLeadSubmit} className="p-4 rounded-xl bg-blue-50/40 border border-blue-200 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700">Client / Decision Maker Name</label>
                <input required className="w-full rounded border p-2 text-xs" value={leadForm.client_name} onChange={e => setLeadForm({...leadForm, client_name: e.target.value})} placeholder="e.g. Vikramaditya Rao" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700">Company Name</label>
                <input required className="w-full rounded border p-2 text-xs" value={leadForm.company_name} onChange={e => setLeadForm({...leadForm, company_name: e.target.value})} placeholder="e.g. Apex Global Tech" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700">Email Address</label>
                <input type="email" className="w-full rounded border p-2 text-xs" value={leadForm.email} onChange={e => setLeadForm({...leadForm, email: e.target.value})} placeholder="vikram@apex.in" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700">Phone / WhatsApp</label>
                <input type="text" className="w-full rounded border p-2 text-xs" value={leadForm.phone} onChange={e => setLeadForm({...leadForm, phone: e.target.value})} placeholder="+91 9876543210" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700">Est. Project Value (₹)</label>
                <input type="number" className="w-full rounded border p-2 text-xs" value={leadForm.estimated_value} onChange={e => setLeadForm({...leadForm, estimated_value: parseFloat(e.target.value) || 0})} />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700">Project Scope & Requirements</label>
              <textarea className="w-full rounded border p-2 text-xs" rows={2} value={leadForm.project_scope} onChange={e => setLeadForm({...leadForm, project_scope: e.target.value})} placeholder="Web App, Social Media Campaign, SEO Audit..." />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setLeadModalOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">Save Lead Profile</Button>
            </div>
          </form>
        )}

        {/* Lead Profiles Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {leads.length === 0 ? (
            <div className="col-span-2 p-8 text-center text-slate-400 text-xs">No active leads in pipeline. Create one above!</div>
          ) : (
            leads.map((lead: any) => (
              <div key={lead.id} className="p-4 rounded-xl border bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{lead.client_name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{lead.company_name}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${getStatusBadge(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>

                {lead.project_scope && (
                  <p className="text-xs text-slate-600 bg-white p-2.5 rounded border border-slate-200 line-clamp-2">
                    Scope: {lead.project_scope}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span className="font-bold text-slate-800">Value: ₹{Number(lead.estimated_value || 0).toLocaleString("en-IN")}</span>
                  <span>Source: {lead.lead_source}</span>
                </div>

                {/* 1-Click Direct Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  {lead.phone && (
                    <>
                      <a href={`tel:${lead.phone}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full h-7 text-[11px] border-blue-200 text-blue-700 hover:bg-blue-50">
                          <Phone className="h-3 w-3 mr-1" /> Call
                        </Button>
                      </a>
                      <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="flex-1">
                        <Button size="sm" variant="outline" className="w-full h-7 text-[11px] border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                          <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp
                        </Button>
                      </a>
                    </>
                  )}
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full h-7 text-[11px] border-purple-200 text-purple-700 hover:bg-purple-50">
                        <Mail className="h-3 w-3 mr-1" /> Email
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Digital Marketing Analytics Tracker */}
      <div className="rounded-xl border bg-white shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-purple-600" /> Digital Marketing Campaign Analytics
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-900 text-white font-mono uppercase text-[10px]">
              <tr>
                <th className="p-3">Campaign Name</th>
                <th className="p-3">Platform</th>
                <th className="p-3">CTR (%)</th>
                <th className="p-3">Impressions</th>
                <th className="p-3">Ad Spend</th>
                <th className="p-3">Leads Captured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {campaigns.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">{c.name}</td>
                  <td className="p-3 font-mono text-purple-700">{c.platform}</td>
                  <td className="p-3 font-bold text-emerald-600">{c.ctr}</td>
                  <td className="p-3">{c.impressions}</td>
                  <td className="p-3 font-medium">{c.spend}</td>
                  <td className="p-3 font-bold text-blue-600">{c.leads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
