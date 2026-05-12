import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  FileText, Plus, Search, MoreHorizontal, Copy, Trash2, Edit3,
  Eye, ExternalLink, BarChart3, CheckCircle2, X, ChevronDown,
  Type, Hash, AlignLeft, ListChecks, Calendar, ToggleLeft,
  Star, Upload, Mail, Link2, Users, Clock, Palette, Grid3X3
} from "lucide-react";

interface FormField {
  id: string;
  type: "text" | "textarea" | "number" | "select" | "checkbox" | "date" | "email" | "rating" | "file";
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface Form {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  responses: number;
  status: "active" | "draft" | "closed";
  color: string;
  createdAt: string;
  updatedAt: string;
}

const initialForms: Form[] = [
  {
    id: "f1", title: "Bug Report", description: "Report bugs and issues", color: "#dc2626", status: "active", responses: 23, createdAt: "2026-03-10", updatedAt: "2026-03-17",
    fields: [
      { id: "ff1", type: "text", label: "Bug Title", required: true, placeholder: "Brief description" },
      { id: "ff2", type: "select", label: "Severity", required: true, options: ["Critical", "High", "Medium", "Low"] },
      { id: "ff3", type: "textarea", label: "Steps to Reproduce", required: true, placeholder: "1. Go to...\n2. Click on..." },
      { id: "ff4", type: "text", label: "Expected Behavior", required: true },
      { id: "ff5", type: "file", label: "Screenshot", required: false },
    ]
  },
  {
    id: "f2", title: "Feature Request", description: "Submit feature ideas", color: "#7c3aed", status: "active", responses: 45, createdAt: "2026-03-05", updatedAt: "2026-03-16",
    fields: [
      { id: "ff6", type: "text", label: "Feature Name", required: true },
      { id: "ff7", type: "textarea", label: "Description", required: true, placeholder: "Describe the feature..." },
      { id: "ff8", type: "select", label: "Priority", required: true, options: ["Must have", "Should have", "Nice to have"] },
      { id: "ff9", type: "rating", label: "Impact Score", required: false },
    ]
  },
  {
    id: "f3", title: "Sprint Retrospective", description: "Team feedback for sprint review", color: "#059669", status: "active", responses: 6, createdAt: "2026-03-14", updatedAt: "2026-03-17",
    fields: [
      { id: "ff10", type: "textarea", label: "What went well?", required: true },
      { id: "ff11", type: "textarea", label: "What could improve?", required: true },
      { id: "ff12", type: "text", label: "Action items", required: false },
      { id: "ff13", type: "rating", label: "Sprint Rating", required: true },
    ]
  },
  {
    id: "f4", title: "Onboarding Checklist", description: "New member onboarding", color: "#0891b2", status: "draft", responses: 0, createdAt: "2026-03-15", updatedAt: "2026-03-15",
    fields: [
      { id: "ff14", type: "text", label: "Full Name", required: true },
      { id: "ff15", type: "email", label: "Email", required: true },
      { id: "ff16", type: "date", label: "Start Date", required: true },
      { id: "ff17", type: "select", label: "Department", required: true, options: ["Engineering", "Design", "Product", "QA"] },
    ]
  },
  {
    id: "f5", title: "Satisfaction Survey", description: "Customer satisfaction feedback", color: "#d97706", status: "closed", responses: 128, createdAt: "2026-02-01", updatedAt: "2026-03-01",
    fields: [
      { id: "ff18", type: "rating", label: "Overall Satisfaction", required: true },
      { id: "ff19", type: "textarea", label: "Comments", required: false },
    ]
  },
];

const fieldTypeConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  text: { icon: <Type className="w-3.5 h-3.5" />, label: "Text" },
  textarea: { icon: <AlignLeft className="w-3.5 h-3.5" />, label: "Long Text" },
  number: { icon: <Hash className="w-3.5 h-3.5" />, label: "Number" },
  select: { icon: <ListChecks className="w-3.5 h-3.5" />, label: "Select" },
  checkbox: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Checkbox" },
  date: { icon: <Calendar className="w-3.5 h-3.5" />, label: "Date" },
  email: { icon: <Mail className="w-3.5 h-3.5" />, label: "Email" },
  rating: { icon: <Star className="w-3.5 h-3.5" />, label: "Rating" },
  file: { icon: <Upload className="w-3.5 h-3.5" />, label: "File Upload" },
};

type ViewMode = "gallery" | "detail" | "builder";

export function FormsView() {
  const [forms, setForms] = useState<Form[]>(initialForms);
  const [viewMode, setViewMode] = useState<ViewMode>("gallery");
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "draft" | "closed">("all");
  const [ctxMenu, setCtxMenu] = useState<string | null>(null);

  // Builder state
  const [builderTitle, setBuilderTitle] = useState("Untitled Form");
  const [builderDesc, setBuilderDesc] = useState("");
  const [builderFields, setBuilderFields] = useState<FormField[]>([]);
  const [builderColor, setBuilderColor] = useState("#0891b2");
  const [detailTab, setDetailTab] = useState<"preview" | "responses">("preview");

  const filtered = forms.filter(f => {
    const matchSearch = !searchQ || f.title.toLowerCase().includes(searchQ.toLowerCase());
    const matchStatus = filterStatus === "all" || f.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalResponses = forms.reduce((a, f) => a + f.responses, 0);
  const activeForms = forms.filter(f => f.status === "active").length;

  const openBuilder = (form?: Form) => {
    if (form) {
      setBuilderTitle(form.title);
      setBuilderDesc(form.description);
      setBuilderFields([...form.fields]);
      setBuilderColor(form.color);
      setSelectedForm(form.id);
    } else {
      setBuilderTitle("Untitled Form");
      setBuilderDesc("");
      setBuilderFields([]);
      setBuilderColor("#0891b2");
      setSelectedForm(null);
    }
    setViewMode("builder");
  };

  const addField = (type: FormField["type"]) => {
    setBuilderFields(prev => [...prev, {
      id: `ff_${Date.now()}`, type, label: fieldTypeConfig[type].label, required: false,
      ...(type === "select" ? { options: ["Option 1", "Option 2", "Option 3"] } : {}),
    }]);
  };

  const removeField = (id: string) => {
    setBuilderFields(prev => prev.filter(f => f.id !== id));
  };

  const saveForm = () => {
    if (!builderTitle.trim()) return;
    const formData: Form = {
      id: selectedForm || `f_${Date.now()}`, title: builderTitle, description: builderDesc,
      fields: builderFields, responses: selectedForm ? (forms.find(f => f.id === selectedForm)?.responses || 0) : 0,
      status: "draft", color: builderColor, createdAt: selectedForm ? (forms.find(f => f.id === selectedForm)?.createdAt || "2026-03-17") : "2026-03-17", updatedAt: "2026-03-17",
    };
    if (selectedForm) {
      setForms(prev => prev.map(f => f.id === selectedForm ? formData : f));
    } else {
      setForms(prev => [formData, ...prev]);
    }
    setViewMode("gallery");
    toast.success(selectedForm ? "Form updated" : "Form created");
  };

  const deleteForm = (id: string) => {
    setForms(prev => prev.filter(f => f.id !== id));
    setCtxMenu(null);
    toast.success("Form deleted");
  };

  const duplicateForm = (id: string) => {
    const form = forms.find(f => f.id === id);
    if (!form) return;
    setForms(prev => [{ ...form, id: `f_${Date.now()}`, title: `${form.title} (Copy)`, responses: 0, status: "draft" }, ...prev]);
    setCtxMenu(null);
    toast.success("Form duplicated");
  };

  const toggleFormStatus = (id: string) => {
    setForms(prev => prev.map(f => {
      if (f.id !== id) return f;
      const next = f.status === "active" ? "closed" : f.status === "closed" ? "draft" : "active";
      toast.success(`Form "${f.title}" → ${next}`);
      return { ...f, status: next as Form["status"], updatedAt: "2026-03-17" };
    }));
    setCtxMenu(null);
  };

  const statusColors = { active: { bg: "#ecfdf5", text: "#059669" }, draft: { bg: "#f3f4f6", text: "#6b7280" }, closed: { bg: "#fef2f2", text: "#dc2626" } };

  const detailForm = selectedForm ? forms.find(f => f.id === selectedForm) : null;

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50 p-6" onClick={() => setCtxMenu(null)}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-md shadow-pink-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-gray-900 tracking-tight">Forms</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">{forms.length} forms · {totalResponses} responses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {viewMode === "builder" && (
              <button onClick={() => setViewMode("gallery")} className="text-[11px] text-gray-500 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-100">Cancel</button>
            )}
            <button onClick={() => viewMode === "builder" ? saveForm() : openBuilder()}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-[11px] px-4 py-2 rounded-xl hover:from-cyan-600 hover:to-teal-600 shadow-sm">
              {viewMode === "builder" ? <><CheckCircle2 className="w-3.5 h-3.5" /> Save Form</> : <><Plus className="w-3.5 h-3.5" /> New Form</>}
            </button>
          </div>
        </div>

        {/* GALLERY VIEW */}
        {viewMode === "gallery" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center text-pink-500"><FileText className="w-4 h-4" /></div>
                <div><p className="text-[18px] text-gray-800">{activeForms}</p><p className="text-[9px] text-gray-400">Active Forms</p></div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center text-violet-500"><Users className="w-4 h-4" /></div>
                <div><p className="text-[18px] text-gray-800">{totalResponses}</p><p className="text-[9px] text-gray-400">Total Responses</p></div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500"><BarChart3 className="w-4 h-4" /></div>
                <div><p className="text-[18px] text-gray-800">{forms.filter(f => f.status === "draft").length}</p><p className="text-[9px] text-gray-400">Drafts</p></div>
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm forms..."
                  className="w-full pl-9 pr-3 py-2 text-[11px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-cyan-300 text-gray-700" />
              </div>
              <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-0.5">
                {(["all", "active", "draft", "closed"] as const).map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-2.5 py-1.5 text-[10px] rounded-lg capitalize transition-all ${filterStatus === s ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>
                    {s === "all" ? "All" : s}
                  </button>
                ))}
              </div>
            </div>

            {/* Forms grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(form => {
                const sc = statusColors[form.status];
                return (
                  <div key={form.id} className="bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-all group cursor-pointer shadow-sm overflow-hidden"
                    onClick={() => { setSelectedForm(form.id); setViewMode("detail"); }}>
                    <div className="h-1.5" style={{ backgroundColor: form.color }} />
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[13px] text-gray-800 truncate">{form.title}</h3>
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{form.description}</p>
                        </div>
                        <div className="relative">
                          <button onClick={e => { e.stopPropagation(); setCtxMenu(ctxMenu === form.id ? null : form.id); }}
                            className="w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                          {ctxMenu === form.id && (
                            <div className="absolute right-0 top-full mt-1 w-[140px] bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1" onClick={e => e.stopPropagation()}>
                              <button onClick={() => { openBuilder(form); setCtxMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50"><Edit3 className="w-3 h-3" /> Edit</button>
                              <button onClick={() => duplicateForm(form.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50"><Copy className="w-3 h-3" /> Duplicate</button>
                              <button onClick={() => toggleFormStatus(form.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50">
                                <ToggleLeft className="w-3 h-3" /> {form.status === "active" ? "Close" : form.status === "closed" ? "Draft" : "Activate"}
                              </button>
                              <div className="h-px bg-gray-100 my-0.5" />
                              <button onClick={() => deleteForm(form.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-500 hover:bg-red-50"><Trash2 className="w-3 h-3" /> Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ backgroundColor: sc.bg, color: sc.text }}>{form.status}</span>
                        <span className="text-[9px] text-gray-400">{form.fields.length} fields</span>
                        <span className="text-[9px] text-gray-400">{form.responses} responses</span>
                        {/* Response trend sparkline */}
                        {form.responses > 0 && (
                          <svg className="w-12 h-4 ml-auto" viewBox="0 0 48 16">
                            {(() => {
                              const trend = [0.2, 0.3, 0.5, 0.4, 0.7, 0.9, 1].map(v => Math.round(v * form.responses));
                              const maxV = Math.max(...trend);
                              const points = trend.map((v, i) => `${(i / 6) * 44 + 2},${14 - (v / maxV) * 12}`).join(" ");
                              return <polyline fill="none" stroke={form.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />;
                            })()}
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Create new card */}
              <button onClick={() => openBuilder()}
                className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 hover:border-cyan-300 hover:bg-cyan-50/30 transition-all flex flex-col items-center justify-center py-10 min-h-[140px]">
                <Plus className="w-6 h-6 text-gray-300 mb-2" />
                <p className="text-[11px] text-gray-400">Create New Form</p>
              </button>
            </div>
          </>
        )}

        {/* DETAIL VIEW */}
        {viewMode === "detail" && detailForm && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="h-2" style={{ backgroundColor: detailForm.color }} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setViewMode("gallery")} className="text-[10px] text-gray-500 hover:text-gray-700">← Back to forms</button>
                <div className="flex items-center gap-2">
                  <button onClick={() => openBuilder(detailForm)} className="text-[10px] text-gray-600 bg-gray-100 rounded-lg px-3 py-1.5 hover:bg-gray-200 flex items-center gap-1"><Edit3 className="w-3 h-3" /> Edit</button>
                  <button onClick={() => toast.success("Link copied!")} className="text-[10px] text-gray-600 bg-gray-100 rounded-lg px-3 py-1.5 hover:bg-gray-200 flex items-center gap-1"><Link2 className="w-3 h-3" /> Share</button>
                </div>
              </div>
              <h2 className="text-[20px] text-gray-900 mb-1">{detailForm.title}</h2>
              <p className="text-[12px] text-gray-500 mb-4">{detailForm.description}</p>

              {/* Tabs */}
              <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-0.5 mb-6 w-fit">
                <button onClick={() => setDetailTab("preview")}
                  className={`px-3 py-1.5 text-[10px] rounded-lg transition-all ${detailTab === "preview" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>
                  <Eye className="w-3 h-3 inline mr-1" /> Preview
                </button>
                <button onClick={() => setDetailTab("responses")}
                  className={`px-3 py-1.5 text-[10px] rounded-lg transition-all ${detailTab === "responses" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>
                  <BarChart3 className="w-3 h-3 inline mr-1" /> Responses ({detailForm.responses})
                </button>
              </div>

              {detailTab === "preview" && (
                <div className="space-y-4 max-w-lg">
                  {detailForm.fields.map(field => (
                    <div key={field.id}>
                      <label className="text-[12px] text-gray-700 mb-1.5 flex items-center gap-1">
                        {fieldTypeConfig[field.type]?.icon}
                        {field.label}
                        {field.required && <span className="text-red-400">*</span>}
                      </label>
                      {field.type === "text" || field.type === "email" ? (
                        <input placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-500" readOnly />
                      ) : field.type === "textarea" ? (
                        <textarea placeholder={field.placeholder || "Type here..."} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 h-20 bg-gray-50 text-gray-500 resize-none" readOnly />
                      ) : field.type === "select" ? (
                        <select className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-500" disabled>
                          <option>Select...</option>
                          {field.options?.map(o => <option key={o}>{o}</option>)}
                        </select>
                      ) : field.type === "date" ? (
                        <input type="date" className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-500" readOnly />
                      ) : field.type === "rating" ? (
                        <div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-5 h-5 text-gray-300" />)}</div>
                      ) : field.type === "file" ? (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center"><Upload className="w-5 h-5 text-gray-300 mx-auto mb-1" /><p className="text-[10px] text-gray-400">Drag & drop or click to upload</p></div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}

              {detailTab === "responses" && (
                <div>
                  {detailForm.responses > 0 ? (
                    <div className="space-y-3">
                      {/* Response Analytics Mini Charts */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-[10px] text-gray-500 mb-2">Responses per week</p>
                          <div className="flex items-end gap-1.5 h-12">
                            {[3, 5, 8, 4, detailForm.responses > 20 ? 7 : 3].map((v, i) => (
                              <div key={i} className="flex-1 rounded-t transition-all" style={{ height: `${(v / 8) * 100}%`, backgroundColor: detailForm.color + (i === 4 ? "" : "80") }} title={`W${i + 9}: ${v}`} />
                            ))}
                          </div>
                          <div className="flex justify-between mt-1 text-[7px] text-gray-400">
                            <span>W9</span><span>W10</span><span>W11</span><span>W12</span><span>W13</span>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-[10px] text-gray-500 mb-2">Completion rate</p>
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 shrink-0">
                              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                                <circle cx="24" cy="24" r="18" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                                <circle cx="24" cy="24" r="18" fill="none" stroke={detailForm.color} strokeWidth="4"
                                  strokeDasharray={`${2 * Math.PI * 18}`} strokeDashoffset={`${2 * Math.PI * 18 * 0.15}`} strokeLinecap="round" />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-700">85%</span>
                            </div>
                            <div className="text-[9px] text-gray-400 space-y-0.5">
                              <p>Started: {detailForm.responses + 5}</p>
                              <p>Completed: {detailForm.responses}</p>
                              <p>Avg time: 2m 30s</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-gray-500">Showing {Math.min(5, detailForm.responses)} of {detailForm.responses}</span>
                        <button onClick={() => toast.success("Exported CSV")} className="text-[10px] text-cyan-600 hover:text-cyan-700 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Export</button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 text-gray-500">#</th>
                              {detailForm.fields.slice(0, 4).map(f => (
                                <th key={f.id} className="text-left py-2 px-3 text-gray-500">{f.label}</th>
                              ))}
                              <th className="text-left py-2 px-3 text-gray-500">Submitted</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: Math.min(5, detailForm.responses) }).map((_, i) => (
                              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                                {detailForm.fields.slice(0, 4).map(f => (
                                  <td key={f.id} className="py-2 px-3 text-gray-700">
                                    {f.type === "rating" ? `${3 + (i % 3)}/5` : f.type === "select" ? f.options?.[i % (f.options?.length || 1)] : f.type === "email" ? `user${i + 1}@company.com` : `Sample ${f.label} ${i + 1}`}
                                  </td>
                                ))}
                                <td className="py-2 px-3 text-gray-400">{`Mar ${17 - i}, 2026`}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-[12px] text-gray-500">No responses yet</p>
                      <p className="text-[10px] text-gray-400 mt-1">Share this form to start collecting responses</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-3 text-[10px] text-gray-400">
                <span>{detailForm.responses} responses</span>
                <span>·</span>
                <span>Created {detailForm.createdAt}</span>
                <span>·</span>
                <span>Updated {detailForm.updatedAt}</span>
              </div>
            </div>
          </div>
        )}

        {/* BUILDER VIEW */}
        {viewMode === "builder" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
            {/* Form editor */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="h-2" style={{ backgroundColor: builderColor }} />
              <div className="p-6">
                <input value={builderTitle} onChange={e => setBuilderTitle(e.target.value)} placeholder="Form Title"
                  className="w-full text-[20px] text-gray-800 focus:outline-none mb-1 bg-transparent" />
                <input value={builderDesc} onChange={e => setBuilderDesc(e.target.value)} placeholder="Description (optional)"
                  className="w-full text-[12px] text-gray-500 focus:outline-none mb-6 bg-transparent" />

                {/* Fields */}
                <div className="space-y-3">
                  {builderFields.map((field, i) => (
                    <div key={field.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 group">
                      <div className="w-6 h-6 rounded flex items-center justify-center text-gray-400 mt-0.5">{fieldTypeConfig[field.type]?.icon}</div>
                      <div className="flex-1">
                        <input value={field.label} onChange={e => setBuilderFields(prev => prev.map(f => f.id === field.id ? { ...f, label: e.target.value } : f))}
                          className="text-[12px] text-gray-700 bg-transparent focus:outline-none w-full" />
                        <p className="text-[9px] text-gray-400 mt-0.5">{fieldTypeConfig[field.type]?.label}{field.required ? " · Required" : ""}</p>
                      </div>
                      <button onClick={() => setBuilderFields(prev => prev.map(f => f.id === field.id ? { ...f, required: !f.required } : f))}
                        className={`text-[8px] px-1.5 py-0.5 rounded ${field.required ? "text-red-500 bg-red-50" : "text-gray-400 bg-gray-100"}`}>
                        {field.required ? "Required" : "Optional"}
                      </button>
                      <button onClick={() => removeField(field.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>

                {builderFields.length === 0 && (
                  <div className="text-center py-10 text-gray-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                    <p className="text-[12px]">Add fields from the panel →</p>
                  </div>
                )}
              </div>
            </div>

            {/* Field types panel */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm h-fit">
              <p className="text-[11px] text-gray-600 mb-3">Add Field</p>
              <div className="space-y-1">
                {Object.entries(fieldTypeConfig).map(([type, cfg]) => (
                  <button key={type} onClick={() => addField(type as FormField["type"])}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-gray-600 rounded-xl hover:bg-gray-50 transition-all">
                    <span className="text-gray-400">{cfg.icon}</span> {cfg.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-500 mb-2">Form Color</p>
                <div className="flex items-center gap-1.5">
                  {["#0891b2", "#7c3aed", "#059669", "#dc2626", "#d97706", "#db2777"].map(c => (
                    <button key={c} onClick={() => setBuilderColor(c)}
                      className={`w-6 h-6 rounded-lg border-2 ${builderColor === c ? "border-gray-800 scale-110" : "border-white shadow-sm"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}