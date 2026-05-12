import { useState, useMemo } from "react";
import { Zap, Plus, Play, Pause, MoreHorizontal, ArrowRight, Clock, CheckCircle2, AlertTriangle, Settings, GitBranch, Bell, Mail, Search, Edit3, Trash2, Copy, X, Filter, Activity, ChevronDown, ChevronRight, AlertCircle, Eye, BarChart3, Sparkles, Target, TrendingUp, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { automations as initialAutomations, type Automation, teamMembers } from "./data";

const triggerOptions = [
  { value: "When status changes to In Review", label: "Status changes", icon: "branch", cat: "status" },
  { value: "When status changes to Done", label: "Status → Done", icon: "branch", cat: "status" },
  { value: "When task is 2 days before deadline", label: "Before deadline", icon: "clock", cat: "time" },
  { value: "When task is overdue", label: "Task overdue", icon: "clock", cat: "time" },
  { value: "When all subtasks are completed", label: "All subtasks done", icon: "check", cat: "task" },
  { value: "When sprint ends", label: "Sprint ends", icon: "zap", cat: "sprint" },
  { value: "When task is created", label: "Task created", icon: "zap", cat: "task" },
  { value: "When priority changes to Urgent", label: "Priority → Urgent", icon: "alert", cat: "task" },
  { value: "When assignee changes", label: "Assignee changed", icon: "branch", cat: "task" },
];

const conditionOptions = [
  "Task has tag 'backend'", "Task has tag 'frontend'", "Task has tag 'design'",
  "Task is not Done", "Task status is not Done", "Priority is not Urgent", "Priority is High or Urgent",
  "Assignee is not empty", "Due date is set", "Task has subtasks",
];

const actionOptions = [
  "Assign reviewer", "Send notification to QA channel", "Send email to assignee",
  "Post in project channel", "Change status to Done", "Log completion time",
  "Move to next sprint", "Notify project manager", "Notify team lead",
  "Escalate priority to High", "Add tag 'reviewed'", "Create follow-up task",
  "Update due date", "Send Slack message", "Archive task",
];

// Mock execution log
const mockExecutionLog: { id: string; automationId: string; timestamp: string; status: "success" | "failed" | "skipped"; taskTitle: string; details: string }[] = [
  { id: "el1", automationId: "auto1", timestamp: "2026-03-17T09:15:00", status: "success", taskTitle: "API Rate Limiting", details: "Assigned Hoàng Đức as reviewer" },
  { id: "el2", automationId: "auto2", timestamp: "2026-03-17T08:00:00", status: "success", taskTitle: "Mobile Push Notifications", details: "Email sent to Lê Thị Hương" },
  { id: "el3", automationId: "auto5", timestamp: "2026-03-16T23:00:00", status: "success", taskTitle: "Fix Search Bug", details: "Escalated priority Normal → High" },
  { id: "el4", automationId: "auto3", timestamp: "2026-03-16T16:30:00", status: "success", taskTitle: "Unit Tests Auth Module", details: "Status changed to Done" },
  { id: "el5", automationId: "auto1", timestamp: "2026-03-16T14:20:00", status: "skipped", taskTitle: "Landing Page Copy", details: "No tag 'backend' found, condition not met" },
  { id: "el6", automationId: "auto2", timestamp: "2026-03-16T08:00:00", status: "success", taskTitle: "Design System Docs", details: "Email sent to Trần Văn Minh" },
  { id: "el7", automationId: "auto5", timestamp: "2026-03-15T23:00:00", status: "failed", taskTitle: "DB Migration", details: "Error: Could not update priority (locked)" },
  { id: "el8", automationId: "auto3", timestamp: "2026-03-15T12:00:00", status: "success", taskTitle: "E2E Login Tests", details: "All subtasks done → status Done" },
];

type ViewTab = "rules" | "templates" | "analytics";

const automationTemplates = [
  { id: "t1", name: "Auto-assign Reviewer", desc: "Tự động assign reviewer khi task vào In Review", trigger: "When status changes to In Review", actions: ["Assign reviewer"], category: "Code Review", color: "#0891b2", uses: 156 },
  { id: "t2", name: "Deadline Reminder", desc: "Gửi email trước deadline 2 ngày", trigger: "When task is 2 days before deadline", actions: ["Send email to assignee"], category: "Notifications", color: "#d97706", uses: 243 },
  { id: "t3", name: "Auto-close Completed", desc: "Đóng task khi hoàn thành tất cả subtasks", trigger: "When all subtasks are completed", actions: ["Change status to Done", "Log completion time"], category: "Task Management", color: "#059669", uses: 189 },
  { id: "t4", name: "Sprint Cleanup", desc: "Chuyển tasks chưa done sang sprint tiếp theo", trigger: "When sprint ends", actions: ["Move to next sprint", "Notify project manager"], category: "Sprint", color: "#7c3aed", uses: 92 },
  { id: "t5", name: "Overdue Escalation", desc: "Tự động nâng priority khi quá hạn", trigger: "When task is overdue", actions: ["Escalate priority to High", "Notify team lead"], category: "Escalation", color: "#dc2626", uses: 178 },
  { id: "t6", name: "Welcome New Task", desc: "Thông báo channel khi tạo task mới", trigger: "When task is created", actions: ["Post in project channel", "Send Slack message"], category: "Notifications", color: "#2563eb", uses: 134 },
  { id: "t7", name: "Priority Alert", desc: "Alert khi priority đổi thành Urgent", trigger: "When priority changes to Urgent", actions: ["Notify team lead", "Send Slack message"], category: "Escalation", color: "#f97316", uses: 67 },
  { id: "t8", name: "Assignment Tracker", desc: "Log khi reassign task", trigger: "When assignee changes", actions: ["Post in project channel", "Create follow-up task"], category: "Task Management", color: "#db2777", uses: 45 },
];

export function AutomationsView() {
  const [rules, setRules] = useState<Automation[]>(initialAutomations);
  const [searchQ, setSearchQ] = useState("");
  const [filterEnabled, setFilterEnabled] = useState<"all" | "active" | "paused">("all");
  const [sortBy, setSortBy] = useState<"name" | "runs" | "recent">("recent");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Automation | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [showLogPanel, setShowLogPanel] = useState(false);
  const [logFilterId, setLogFilterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>("rules");
  const [testingRuleId, setTestingRuleId] = useState<string | null>(null);

  // Form state
  const emptyForm = { name: "", trigger: triggerOptions[0].value, conditions: [] as string[], actions: [] as string[], enabled: true };
  const [form, setForm] = useState(emptyForm);
  const [addCondition, setAddCondition] = useState(false);
  const [addAction, setAddAction] = useState(false);

  const filtered = useMemo(() => {
    let res = [...rules];
    if (searchQ) res = res.filter(r => r.name.toLowerCase().includes(searchQ.toLowerCase()) || r.trigger.toLowerCase().includes(searchQ.toLowerCase()));
    if (filterEnabled === "active") res = res.filter(r => r.enabled);
    if (filterEnabled === "paused") res = res.filter(r => !r.enabled);
    switch (sortBy) {
      case "name": res.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "runs": res.sort((a, b) => b.runsCount - a.runsCount); break;
      case "recent": res.sort((a, b) => (b.lastRun || "").localeCompare(a.lastRun || "")); break;
    }
    return res;
  }, [rules, searchQ, filterEnabled, sortBy]);

  const filteredLog = logFilterId ? mockExecutionLog.filter(l => l.automationId === logFilterId) : mockExecutionLog;

  const toggleRule = (id: string) => setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));

  const handleCreate = () => {
    if (!form.name.trim() || form.actions.length === 0) return;
    const nr: Automation = { id: `auto_${Date.now()}`, name: form.name, trigger: form.trigger, conditions: form.conditions, actions: form.actions, enabled: form.enabled, runsCount: 0, createdBy: "u1" };
    setRules(prev => [...prev, nr]);
    setShowCreateModal(false);
    setForm(emptyForm);
  };

  const handleSaveEdit = () => {
    if (!editingRule || !form.name.trim()) return;
    setRules(prev => prev.map(r => r.id === editingRule.id ? { ...r, name: form.name, trigger: form.trigger, conditions: form.conditions, actions: form.actions, enabled: form.enabled } : r));
    setEditingRule(null);
    setForm(emptyForm);
  };

  const handleDelete = (id: string) => { setRules(prev => prev.filter(r => r.id !== id)); setDeleteConfirm(null); };

  const handleDuplicate = (id: string) => {
    const orig = rules.find(r => r.id === id);
    if (!orig) return;
    const dup: Automation = { ...orig, id: `auto_${Date.now()}`, name: `${orig.name} (copy)`, runsCount: 0, lastRun: undefined, enabled: false };
    setRules(prev => [...prev, dup]);
    setCtxMenu(null);
  };

  const openEdit = (rule: Automation) => {
    setForm({ name: rule.name, trigger: rule.trigger, conditions: [...rule.conditions], actions: [...rule.actions], enabled: rule.enabled });
    setEditingRule(rule);
    setCtxMenu(null);
  };

  const triggerIcon = (trigger: string) => {
    if (trigger.startsWith("When status")) return <GitBranch className="w-4 h-4 text-cyan-500" />;
    if (trigger.includes("deadline") || trigger.includes("overdue")) return <Clock className="w-4 h-4 text-amber-500" />;
    if (trigger.startsWith("When all subtasks")) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (trigger.startsWith("When sprint")) return <Zap className="w-4 h-4 text-violet-500" />;
    if (trigger.includes("created") || trigger.includes("assignee")) return <Activity className="w-4 h-4 text-blue-500" />;
    if (trigger.includes("priority")) return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    return <Zap className="w-4 h-4 text-gray-400" />;
  };

  // Form modal (shared between create/edit)
  const renderFormModal = (isEdit: boolean) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => { isEdit ? setEditingRule(null) : setShowCreateModal(false); setForm(emptyForm); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-200 max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-500" /><h3 className="text-[15px] text-gray-800 tracking-tight">{isEdit ? "Edit Automation" : "New Automation"}</h3></div>
          <button onClick={() => { isEdit ? setEditingRule(null) : setShowCreateModal(false); setForm(emptyForm); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Tên rule *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: Auto-assign reviewer..."
              className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 text-gray-700" autoFocus />
          </div>

          {/* Trigger */}
          <div>
            <label className="text-[10px] text-gray-500 mb-1.5 block flex items-center gap-1"><span className="text-[8px] bg-cyan-50 text-cyan-600 px-1.5 py-0.5 rounded">TRIGGER</span> Khi nào chạy?</label>
            <div className="grid grid-cols-2 gap-1.5">
              {triggerOptions.map(t => (
                <button key={t.value} onClick={() => setForm(p => ({ ...p, trigger: t.value }))}
                  className={`flex items-center gap-2 px-2.5 py-2 text-[10px] rounded-lg border transition-all text-left ${form.trigger === t.value ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  {triggerIcon(t.value)}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div>
            <label className="text-[10px] text-gray-500 mb-1.5 block flex items-center gap-1"><span className="text-[8px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">IF</span> Điều kiện (optional)</label>
            <div className="space-y-1.5">
              {form.conditions.map((c, i) => (
                <div key={i} className="flex items-center gap-2 bg-amber-50/50 rounded-lg px-3 py-1.5 border border-amber-100">
                  <span className="text-[11px] text-gray-600 flex-1">{c}</span>
                  <button onClick={() => setForm(p => ({ ...p, conditions: p.conditions.filter((_, j) => j !== i) }))} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                </div>
              ))}
              {addCondition ? (
                <div className="border border-amber-200 rounded-lg p-2 bg-amber-50/30">
                  <div className="grid grid-cols-2 gap-1">
                    {conditionOptions.filter(c => !form.conditions.includes(c)).map(c => (
                      <button key={c} onClick={() => { setForm(p => ({ ...p, conditions: [...p.conditions, c] })); setAddCondition(false); }}
                        className="text-[10px] text-gray-600 px-2 py-1.5 rounded-lg hover:bg-amber-100 text-left transition-all">{c}</button>
                    ))}
                  </div>
                  <button onClick={() => setAddCondition(false)} className="text-[9px] text-gray-400 mt-1.5">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setAddCondition(true)} className="text-[10px] text-amber-600 hover:text-amber-700 flex items-center gap-1"><Plus className="w-3 h-3" /> Add condition</button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div>
            <label className="text-[10px] text-gray-500 mb-1.5 block flex items-center gap-1"><span className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">THEN</span> Thực hiện gì? *</label>
            <div className="space-y-1.5">
              {form.actions.map((a, i) => (
                <div key={i} className="flex items-center gap-2 bg-emerald-50/50 rounded-lg px-3 py-1.5 border border-emerald-100">
                  <span className="text-[9px] text-emerald-500 shrink-0">{i + 1}.</span>
                  <span className="text-[11px] text-gray-600 flex-1">{a}</span>
                  <button onClick={() => setForm(p => ({ ...p, actions: p.actions.filter((_, j) => j !== i) }))} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                </div>
              ))}
              {addAction ? (
                <div className="border border-emerald-200 rounded-lg p-2 bg-emerald-50/30">
                  <div className="grid grid-cols-2 gap-1">
                    {actionOptions.filter(a => !form.actions.includes(a)).map(a => (
                      <button key={a} onClick={() => { setForm(p => ({ ...p, actions: [...p.actions, a] })); setAddAction(false); }}
                        className="text-[10px] text-gray-600 px-2 py-1.5 rounded-lg hover:bg-emerald-100 text-left transition-all">{a}</button>
                    ))}
                  </div>
                  <button onClick={() => setAddAction(false)} className="text-[9px] text-gray-400 mt-1.5">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setAddAction(true)} className="text-[10px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1"><Plus className="w-3 h-3" /> Add action</button>
              )}
            </div>
          </div>

          {/* Enabled toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-[11px] text-gray-600">Kích hoạt ngay</span>
            <button onClick={() => setForm(p => ({ ...p, enabled: !p.enabled }))}
              className={`w-10 h-6 rounded-full transition-all relative ${form.enabled ? "bg-cyan-500" : "bg-gray-200"}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-all ${form.enabled ? "left-5" : "left-1"}`} />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => { isEdit ? setEditingRule(null) : setShowCreateModal(false); setForm(emptyForm); }} className="text-[12px] text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Cancel</button>
          <button onClick={isEdit ? handleSaveEdit : handleCreate} disabled={!form.name.trim() || form.actions.length === 0}
            className="text-[12px] bg-cyan-500 text-white px-4 py-1.5 rounded-lg hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed">{isEdit ? "Save" : "Create"}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50 p-6" onClick={() => setCtxMenu(null)}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-gray-900 tracking-tight">Automations</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Automate repetitive tasks with custom rules</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowLogPanel(!showLogPanel); setLogFilterId(null); }}
              className={`flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-xl border transition-all ${showLogPanel ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
              <Activity className="w-3.5 h-3.5" /> Log
            </button>
            <button onClick={() => { setForm(emptyForm); setShowCreateModal(true); }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-[11px] px-4 py-2 rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm shadow-cyan-500/20">
              <Plus className="w-3.5 h-3.5" /> New Automation
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4">
          {([
            ["rules", "Rules", <Zap key="r" className="w-3.5 h-3.5" />],
            ["templates", "Templates", <BookOpen key="t" className="w-3.5 h-3.5" />],
            ["analytics", "Analytics", <BarChart3 key="a" className="w-3.5 h-3.5" />],
          ] as [ViewTab, string, React.ReactNode][]).map(([key, label, icon]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-[11px] rounded-xl transition-all ${activeTab === key ? "bg-white shadow-sm text-gray-800 border border-gray-200" : "text-gray-500 hover:bg-gray-100"}`}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* RULES TAB */}
        {activeTab === "rules" && (<>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: "Total Rules", value: rules.length, color: "#0891b2", bg: "#ecfeff", icon: <Zap className="w-4 h-4" /> },
              { label: "Active", value: rules.filter(r => r.enabled).length, color: "#059669", bg: "#ecfdf5", icon: <Play className="w-4 h-4" /> },
              { label: "Paused", value: rules.filter(r => !r.enabled).length, color: "#6b7280", bg: "#f9fafb", icon: <Pause className="w-4 h-4" /> },
              { label: "Total Runs", value: rules.reduce((a, r) => a + r.runsCount, 0), color: "#7c3aed", bg: "#f3e8ff", icon: <TrendingUp className="w-4 h-4" /> },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.bg, color: s.color }}>{s.icon}</div>
                <div><p className="text-[18px] text-gray-800">{s.value}</p><p className="text-[9px] text-gray-400">{s.label}</p></div>
              </div>
            ))}
          </div>

          {/* Execution Log Panel */}
          {showLogPanel && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-5 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[12px] text-gray-700">Execution Log</span>
                  {logFilterId && (
                    <span className="text-[9px] bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                      {rules.find(r => r.id === logFilterId)?.name}
                      <button onClick={() => setLogFilterId(null)}><X className="w-2.5 h-2.5" /></button>
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400">{filteredLog.length} entries</span>
              </div>
              <div className="max-h-[200px] overflow-auto">
                {filteredLog.map(log => {
                  const rule = rules.find(r => r.id === log.automationId);
                  return (
                    <div key={log.id} className="flex items-center gap-3 px-5 py-2.5 border-b border-gray-50 hover:bg-gray-50/50">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${log.status === "success" ? "bg-emerald-500" : log.status === "failed" ? "bg-red-500" : "bg-gray-400"}`} />
                      <span className="text-[10px] text-gray-400 w-24 shrink-0">{new Date(log.timestamp).toLocaleString("vi-VN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                      <button onClick={() => setLogFilterId(log.automationId)} className="text-[10px] text-cyan-600 hover:underline shrink-0 max-w-[140px] truncate">{rule?.name || "?"}</button>
                      <span className="text-[10px] text-gray-500 truncate flex-1">{log.taskTitle}</span>
                      <span className="text-[10px] text-gray-400 truncate max-w-[180px]">{log.details}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full shrink-0 ${log.status === "success" ? "bg-emerald-50 text-emerald-600" : log.status === "failed" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                        {log.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm automation..."
                className="w-full pl-9 pr-3 py-2 text-[11px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-cyan-300 text-gray-700" />
            </div>
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-0.5">
              {[{ v: "all" as const, l: "Tất cả" }, { v: "active" as const, l: "Active" }, { v: "paused" as const, l: "Paused" }].map(f => (
                <button key={f.v} onClick={() => setFilterEnabled(f.v)} className={`px-2.5 py-1.5 text-[10px] rounded-lg transition-all ${filterEnabled === f.v ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>{f.l}</button>
              ))}
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="text-[10px] bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-gray-600 focus:outline-none">
              <option value="recent">Gần nhất</option>
              <option value="runs">Nhiều runs</option>
              <option value="name">Tên A→Z</option>
            </select>
            <span className="text-[10px] text-gray-400 ml-auto">{filtered.length} rules</span>
          </div>

          {/* Automation rules */}
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <Zap className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-[13px] text-gray-400">Không tìm thấy automation nào</p>
              </div>
            )}
            {filtered.map(rule => {
              const creator = teamMembers.find(m => m.id === rule.createdBy);
              const ruleRuns = mockExecutionLog.filter(l => l.automationId === rule.id);
              const lastStatus = ruleRuns[0]?.status;
              return (
                <div key={rule.id} className={`bg-white rounded-2xl border shadow-sm transition-all ${rule.enabled ? "border-gray-200 hover:shadow-md" : "border-gray-100 opacity-60"}`}>
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${rule.enabled ? "bg-cyan-50" : "bg-gray-50"}`}>
                        {triggerIcon(rule.trigger)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-[13px] text-gray-800">{rule.name}</h3>
                          <span className="text-[10px] text-gray-400">#{rule.id}</span>
                          {lastStatus && (
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${lastStatus === "success" ? "bg-emerald-50 text-emerald-600" : lastStatus === "failed" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                              Last: {lastStatus}
                            </span>
                          )}
                          {/* Success rate badge */}
                          {ruleRuns.length > 0 && (() => {
                            const successCount = ruleRuns.filter(l => l.status === "success").length;
                            const rate = Math.round((successCount / ruleRuns.length) * 100);
                            const rateColor = rate >= 80 ? "#059669" : rate >= 50 ? "#d97706" : "#dc2626";
                            return (
                              <span className="text-[8px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ backgroundColor: rateColor + "10", color: rateColor }}>
                                <Target className="w-2.5 h-2.5" /> {rate}% success
                              </span>
                            );
                          })()}
                        </div>

                        {/* Trigger → Conditions → Actions flow */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-cyan-50 text-cyan-600 px-1.5 py-0.5 rounded-md shrink-0">TRIGGER</span>
                            <span className="text-[11px] text-gray-600">{rule.trigger}</span>
                          </div>
                          {rule.conditions.length > 0 && (
                            <div className="flex items-start gap-2">
                              <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md shrink-0">IF</span>
                              <div className="text-[11px] text-gray-500">{rule.conditions.join(" AND ")}</div>
                            </div>
                          )}
                          <div className="flex items-start gap-2">
                            <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md shrink-0">THEN</span>
                            <div className="text-[11px] text-gray-600">
                              {rule.actions.map((a, i) => (<span key={i}>{a}{i < rule.actions.length - 1 ? " → " : ""}</span>))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {rule.runsCount} runs</span>
                          {rule.lastRun && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(rule.lastRun).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>}
                          {creator && <span>By {creator.name}</span>}
                          <button
                            disabled={testingRuleId === rule.id}
                            onClick={e => {
                              e.stopPropagation();
                              setTestingRuleId(rule.id);
                              toast.loading(`Testing "${rule.name}"...`, { id: `test-${rule.id}` });
                              setTimeout(() => {
                                const success = Math.random() > 0.2;
                                toast.dismiss(`test-${rule.id}`);
                                if (success) {
                                  toast.success(`✓ Dry run passed: ${rule.actions[0]}`, { description: `Trigger: ${rule.trigger}` });
                                } else {
                                  toast.error(`✗ Dry run failed: condition not met`, { description: `${rule.conditions[0] || "No matching tasks found"}` });
                                }
                                setTestingRuleId(null);
                              }, 1500);
                            }}
                            className={`flex items-center gap-1 ml-auto px-2 py-0.5 rounded-lg border text-[9px] transition-all ${testingRuleId === rule.id ? "border-amber-300 bg-amber-50 text-amber-600 animate-pulse" : "border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-cyan-600"}`}>
                            <Play className="w-2.5 h-2.5" /> {testingRuleId === rule.id ? "Testing..." : "Test Run"}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => toggleRule(rule.id)}
                          className={`w-10 h-6 rounded-full transition-all relative ${rule.enabled ? "bg-cyan-500" : "bg-gray-200"}`}>
                          <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-all ${rule.enabled ? "left-5" : "left-1"}`} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setCtxMenu({ id: rule.id, x: e.clientX, y: e.clientY }); }}
                          className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>)}

        {/* TEMPLATES TAB */}
        {activeTab === "templates" && (
          <div>
            <p className="text-[11px] text-gray-500 mb-4">Bắt đầu nhanh với các template automation phổ biến</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {automationTemplates.map(tpl => (
                <div key={tpl.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all shadow-sm group">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: tpl.color }}>
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] text-gray-800">{tpl.name}</h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">{tpl.desc}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{tpl.category}</span>
                        <span className="text-[8px] text-gray-400">{tpl.uses} uses</span>
                      </div>
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] bg-cyan-50 text-cyan-600 px-1 py-0.5 rounded">WHEN</span>
                          <span className="text-[9px] text-gray-500">{tpl.trigger}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded">THEN</span>
                          <span className="text-[9px] text-gray-500">{tpl.actions.join(" → ")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => {
                    setForm({ name: tpl.name, trigger: tpl.trigger, conditions: [], actions: tpl.actions, enabled: true });
                    setShowCreateModal(true);
                    toast.success(`Template "${tpl.name}" loaded`);
                  }}
                    className="mt-3 w-full text-[10px] text-cyan-600 bg-cyan-50 border border-cyan-200 rounded-xl py-1.5 hover:bg-cyan-100 transition-all opacity-0 group-hover:opacity-100">
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="space-y-4">
            {/* Success rate */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-[13px] text-gray-700 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-gray-400" /> Execution Summary</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {(() => {
                  const success = mockExecutionLog.filter(l => l.status === "success").length;
                  const failed = mockExecutionLog.filter(l => l.status === "failed").length;
                  const skipped = mockExecutionLog.filter(l => l.status === "skipped").length;
                  const total = mockExecutionLog.length;
                  return [
                    { label: "Success", value: success, pct: Math.round((success / total) * 100), color: "#059669", bg: "#ecfdf5" },
                    { label: "Failed", value: failed, pct: Math.round((failed / total) * 100), color: "#dc2626", bg: "#fef2f2" },
                    { label: "Skipped", value: skipped, pct: Math.round((skipped / total) * 100), color: "#6b7280", bg: "#f9fafb" },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-4 text-center" style={{ backgroundColor: s.bg }}>
                      <p className="text-[24px]" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[10px] text-gray-500">{s.label} ({s.pct}%)</p>
                    </div>
                  ));
                })()}
              </div>

              {/* Success rate bar */}
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500" style={{ width: `${(mockExecutionLog.filter(l => l.status === "success").length / mockExecutionLog.length) * 100}%` }} />
                <div className="h-full bg-red-500" style={{ width: `${(mockExecutionLog.filter(l => l.status === "failed").length / mockExecutionLog.length) * 100}%` }} />
                <div className="h-full bg-gray-300" style={{ width: `${(mockExecutionLog.filter(l => l.status === "skipped").length / mockExecutionLog.length) * 100}%` }} />
              </div>
            </div>

            {/* Per-rule analytics */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-[13px] text-gray-700 mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-gray-400" /> Rule Performance</h3>
              <div className="space-y-2">
                {rules.sort((a, b) => b.runsCount - a.runsCount).map(rule => {
                  const logs = mockExecutionLog.filter(l => l.automationId === rule.id);
                  const successCount = logs.filter(l => l.status === "success").length;
                  const rate = logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 0;
                  const maxRuns = Math.max(...rules.map(r => r.runsCount), 1);
                  return (
                    <div key={rule.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${rule.enabled ? "bg-cyan-50" : "bg-gray-100"}`}>
                        {triggerIcon(rule.trigger)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-700 truncate">{rule.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${(rule.runsCount / maxRuns) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[12px] text-gray-700">{rule.runsCount} <span className="text-[9px] text-gray-400">runs</span></p>
                        <p className={`text-[9px] ${rate >= 80 ? "text-emerald-600" : rate >= 50 ? "text-amber-600" : "text-red-500"}`}>{rate}% success</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Time saved estimate */}
            <div className="bg-gradient-to-r from-cyan-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg shadow-cyan-500/20">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-6 h-6" />
                <h3 className="text-[16px]">Time Saved Estimate</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><p className="text-[32px] tracking-tight">{rules.reduce((a, r) => a + r.runsCount, 0) * 3}</p><p className="text-[11px] opacity-70">Minutes saved</p></div>
                <div><p className="text-[32px] tracking-tight">{Math.round(rules.reduce((a, r) => a + r.runsCount, 0) * 3 / 60)}</p><p className="text-[11px] opacity-70">Hours total</p></div>
                <div><p className="text-[32px] tracking-tight">${Math.round(rules.reduce((a, r) => a + r.runsCount, 0) * 3 / 60 * 25)}</p><p className="text-[11px] opacity-70">Cost saved (est.)</p></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {ctxMenu && (
        <div className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 min-w-[160px]"
          style={{ left: Math.min(ctxMenu.x, window.innerWidth - 180), top: ctxMenu.y }} onClick={e => e.stopPropagation()}>
          <button onClick={() => { const r = rules.find(x => x.id === ctxMenu.id); if (r) openEdit(r); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50"><Edit3 className="w-3.5 h-3.5 text-gray-400" /> Chỉnh sửa</button>
          <button onClick={() => { handleDuplicate(ctxMenu.id); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50"><Copy className="w-3.5 h-3.5 text-gray-400" /> Nhân bản</button>
          <button onClick={() => { setShowLogPanel(true); setLogFilterId(ctxMenu.id); setCtxMenu(null); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-gray-700 hover:bg-gray-50"><Activity className="w-3.5 h-3.5 text-gray-400" /> Xem log</button>
          <div className="border-t border-gray-100 my-1" />
          <button onClick={() => { setDeleteConfirm(ctxMenu.id); setCtxMenu(null); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /> Xóa</button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && renderFormModal(false)}
      {editingRule && renderFormModal(true)}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-500" /></div>
              <div><h3 className="text-[14px] text-gray-800">Delete Automation?</h3><p className="text-[11px] text-gray-500 mt-0.5">Rule sẽ bị xóa vĩnh viễn.</p></div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setDeleteConfirm(null)} className="text-[12px] text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-100">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="text-[12px] text-white bg-red-500 hover:bg-red-600 px-5 py-2 rounded-xl shadow-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}