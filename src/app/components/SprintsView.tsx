import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  Zap, Plus, Play, Pause, CheckCircle2, Circle, Clock, Flag,
  ChevronDown, ChevronRight, ArrowRight, Search, MoreHorizontal,
  Edit3, Trash2, X, AlertCircle, Target, Calendar, TrendingDown,
  Package, ArrowUpRight, RotateCcw, Users, BarChart3, FileText,
  MessageSquare, Copy, Star, ArrowUp, ArrowDown, Sparkles, RefreshCw,
  Award, ThumbsUp, ThumbsDown, Lightbulb, ListChecks
} from "lucide-react";
import { sprints as initialSprints, type Sprint, type Task, statusConfig, priorityConfig, teamMembers } from "./data";

interface SprintsViewProps { tasks: Task[]; onTaskClick: (task: Task) => void; }

const velocityHistory = [
  { sprint: "Sprint 8", planned: 38, completed: 35 },
  { sprint: "Sprint 9", planned: 40, completed: 32 },
  { sprint: "Sprint 10", planned: 35, completed: 34 },
  { sprint: "Sprint 11", planned: 42, completed: 38 },
];

interface RetroNote {
  id: string; sprintId: string;
  wentWell: string[]; needsImprovement: string[]; actionItems: { text: string; done: boolean }[];
}

interface SprintGoal { id: string; sprintId: string; text: string; achieved: boolean; }

const initialRetros: RetroNote[] = [
  {
    id: "r1", sprintId: "sp1",
    wentWell: ["CI/CD pipeline hoàn thành ahead of schedule", "Chat module đạt 100% features", "Team velocity tăng 15%"],
    needsImprovement: ["Code review chậm 2-3 ngày", "Documentation thiếu cho API mới", "Daily standup quá dài"],
    actionItems: [{ text: "Implement PR review SLA (max 24h)", done: false }, { text: "Doc-as-code workflow", done: true }, { text: "Standup timer 15 phút", done: false }],
  },
];

const initialSprintGoals: SprintGoal[] = [
  { id: "sg1", sprintId: "sp1", text: "Hoàn thành Chat module với đầy đủ 90 tính năng", achieved: true },
  { id: "sg2", sprintId: "sp1", text: "Setup CI/CD pipeline cho staging và production", achieved: true },
  { id: "sg3", sprintId: "sp1", text: "Tăng test coverage lên 75%", achieved: false },
  { id: "sg4", sprintId: "sp2", text: "Implement tất cả 16 modules trong More section", achieved: false },
  { id: "sg5", sprintId: "sp2", text: "Mobile responsive cho 5 views chính", achieved: false },
];

type DetailTab = "tasks" | "goals" | "retro" | "report" | "capacity";

export function SprintsView({ tasks, onTaskClick }: SprintsViewProps) {
  const [sprintList, setSprintList] = useState<Sprint[]>(initialSprints);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ sp1: true });
  const [searchQ, setSearchQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<string | null>(null);
  const [showBacklog, setShowBacklog] = useState(false);
  const [addTaskTo, setAddTaskTo] = useState<string | null>(null);
  const [burndownSprint, setBurndownSprint] = useState<string | null>(null);

  // New state for Phase 4 features
  const [detailSprintId, setDetailSprintId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("goals");
  const [retros, setRetros] = useState<RetroNote[]>(initialRetros);
  const [sprintGoals, setSprintGoals] = useState<SprintGoal[]>(initialSprintGoals);
  const [newGoalText, setNewGoalText] = useState("");
  const [retroInput, setRetroInput] = useState({ wentWell: "", needsImprovement: "", actionItem: "" });
  const [compareMode, setCompareMode] = useState(false);

  const emptyForm = { name: "", startDate: "", endDate: "", goalPoints: "30", goal: "" };
  const [form, setForm] = useState(emptyForm);

  const allSprintTaskIds = useMemo(() => sprintList.flatMap(s => s.taskIds), [sprintList]);
  const backlogTasks = useMemo(() => tasks.filter(t => !allSprintTaskIds.includes(t.id)), [tasks, allSprintTaskIds]);

  const velocityData = useMemo(() => {
    const current = sprintList.map(s => {
      const st = tasks.filter(t => s.taskIds.includes(t.id));
      const done = st.filter(t => t.status === "done").length;
      const points = s.goalPoints > 0 ? Math.round((done / Math.max(st.length, 1)) * s.goalPoints) : 0;
      return { sprint: s.name, planned: s.goalPoints, completed: s.status === "active" ? points : s.completedPoints };
    });
    return [...velocityHistory, ...current];
  }, [sprintList, tasks]);

  const detailSprint = sprintList.find(s => s.id === detailSprintId);
  const detailRetro = useMemo(() => retros.find(r => r.sprintId === detailSprintId), [retros, detailSprintId]);
  const detailGoals = useMemo(() => sprintGoals.filter(g => g.sprintId === detailSprintId), [sprintGoals, detailSprintId]);

  const getBurndownData = useCallback((sprint: Sprint) => {
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const total = sprint.goalPoints;
    const data: { day: number; ideal: number; actual: number; label: string }[] = [];
    let remaining = total;
    for (let i = 0; i <= days; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i);
      const ideal = Math.round(total - (total / days) * i);
      if (sprint.status === "active") {
        const today = new Date();
        if (d <= today) remaining = Math.max(0, remaining - Math.floor(Math.random() * 4 + 1));
      } else if (sprint.status === "completed") {
        remaining = Math.max(0, remaining - Math.floor(Math.random() * 4 + 1));
      }
      data.push({ day: i, ideal, actual: d <= new Date() || sprint.status === "completed" ? remaining : -1, label: `${d.getDate()}/${d.getMonth() + 1}` });
    }
    return data;
  }, []);

  // Capacity data per member
  const getCapacityData = useCallback((sprint: Sprint) => {
    const sprintTasks = tasks.filter(t => sprint.taskIds.includes(t.id));
    return teamMembers.map(m => {
      const memberTasks = sprintTasks.filter(t => t.assignee?.id === m.id);
      const done = memberTasks.filter(t => t.status === "done").length;
      const estHours = memberTasks.reduce((a, t) => a + (t.timeEstimate || 0), 0) / 60;
      const spentHours = memberTasks.reduce((a, t) => a + (t.timeSpent || 0), 0) / 60;
      const capacity = 40; // hours per sprint
      return { member: m, tasks: memberTasks.length, done, estHours, spentHours, capacity, utilization: Math.round((estHours / capacity) * 100) };
    }).filter(d => d.tasks > 0);
  }, [tasks]);

  // Handlers
  const handleCreate = useCallback(() => {
    if (!form.name.trim() || !form.startDate || !form.endDate) return;
    const ns: Sprint = { id: `sp_${Date.now()}`, name: form.name, startDate: form.startDate, endDate: form.endDate, status: "planning", goalPoints: parseInt(form.goalPoints) || 30, completedPoints: 0, taskIds: [] };
    setSprintList(prev => [...prev, ns]);
    setShowCreate(false); setForm(emptyForm);
    toast.success(`Sprint "${form.name}" đã được tạo`);
  }, [form]);

  const handleSaveEdit = useCallback(() => {
    if (!editingSprint || !form.name.trim()) return;
    setSprintList(prev => prev.map(s => s.id === editingSprint.id ? { ...s, name: form.name, startDate: form.startDate || s.startDate, endDate: form.endDate || s.endDate, goalPoints: parseInt(form.goalPoints) || s.goalPoints } : s));
    setEditingSprint(null); setForm(emptyForm);
    toast.success("Sprint đã được cập nhật");
  }, [editingSprint, form]);

  const handleDelete = useCallback((id: string) => {
    setSprintList(prev => prev.filter(s => s.id !== id)); setDeleteConfirm(null);
    if (detailSprintId === id) setDetailSprintId(null);
    toast.success("Sprint đã bị xoá");
  }, [detailSprintId]);

  const handleStatusChange = useCallback((id: string, newStatus: Sprint["status"]) => {
    setSprintList(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    setCtxMenu(null);
    const labels = { active: "Started", completed: "Completed", planning: "Reopened" };
    toast.success(`Sprint ${labels[newStatus]}`);
  }, []);

  const addTaskToSprint = useCallback((sprintId: string, taskId: string) => {
    setSprintList(prev => prev.map(s => s.id === sprintId ? { ...s, taskIds: [...s.taskIds, taskId] } : s));
  }, []);

  const removeTaskFromSprint = useCallback((sprintId: string, taskId: string) => {
    setSprintList(prev => prev.map(s => s.id === sprintId ? { ...s, taskIds: s.taskIds.filter(id => id !== taskId) } : s));
  }, []);

  const duplicateSprint = useCallback((sprintId: string) => {
    const orig = sprintList.find(s => s.id === sprintId);
    if (!orig) return;
    const dup = { ...orig, id: `sp_${Date.now()}`, name: `${orig.name} (Copy)`, status: "planning" as Sprint["status"], completedPoints: 0 };
    setSprintList(prev => [...prev, dup]);
    toast.success("Sprint đã được nhân bản");
  }, [sprintList]);

  const openEdit = useCallback((sprint: Sprint) => {
    setForm({ name: sprint.name, startDate: sprint.startDate, endDate: sprint.endDate, goalPoints: String(sprint.goalPoints), goal: "" });
    setEditingSprint(sprint); setCtxMenu(null);
  }, []);

  const getDaysLeft = (endDate: string) => Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const getDaysTotal = (start: string, end: string) => Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
  const getDaysPassed = (start: string) => Math.max(0, Math.ceil((new Date().getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)));

  // Sprint goal handlers
  const addSprintGoal = useCallback(() => {
    if (!newGoalText.trim() || !detailSprintId) return;
    setSprintGoals(prev => [...prev, { id: `sg_${Date.now()}`, sprintId: detailSprintId, text: newGoalText.trim(), achieved: false }]);
    setNewGoalText(""); toast.success("Sprint goal đã được thêm");
  }, [newGoalText, detailSprintId]);

  const toggleGoalAchieved = useCallback((goalId: string) => {
    setSprintGoals(prev => prev.map(g => g.id === goalId ? { ...g, achieved: !g.achieved } : g));
  }, []);

  // Retro handlers
  const addRetroItem = useCallback((type: "wentWell" | "needsImprovement" | "actionItem") => {
    if (!detailSprintId) return;
    const text = retroInput[type].trim();
    if (!text) return;
    setRetros(prev => {
      const existing = prev.find(r => r.sprintId === detailSprintId);
      if (existing) {
        return prev.map(r => {
          if (r.sprintId !== detailSprintId) return r;
          if (type === "actionItem") return { ...r, actionItems: [...r.actionItems, { text, done: false }] };
          return { ...r, [type]: [...r[type], text] };
        });
      } else {
        const newRetro: RetroNote = { id: `r_${Date.now()}`, sprintId: detailSprintId, wentWell: [], needsImprovement: [], actionItems: [] };
        if (type === "actionItem") newRetro.actionItems.push({ text, done: false });
        else (newRetro[type] as string[]).push(text);
        return [...prev, newRetro];
      }
    });
    setRetroInput(prev => ({ ...prev, [type]: "" }));
  }, [detailSprintId, retroInput]);

  const toggleActionItem = useCallback((sprintId: string, index: number) => {
    setRetros(prev => prev.map(r => {
      if (r.sprintId !== sprintId) return r;
      const items = [...r.actionItems]; items[index] = { ...items[index], done: !items[index].done };
      return { ...r, actionItems: items };
    }));
  }, []);

  // Auto-suggest tasks for sprint
  const suggestedTasks = useMemo(() => {
    if (!detailSprintId) return [];
    return backlogTasks
      .sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
      })
      .slice(0, 5);
  }, [backlogTasks, detailSprintId]);

  const renderFormModal = (isEdit: boolean) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => { isEdit ? setEditingSprint(null) : setShowCreate(false); setForm(emptyForm); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-500" /><h3 className="text-[15px] text-gray-800 tracking-tight">{isEdit ? "Edit Sprint" : "New Sprint"}</h3></div>
          <button onClick={() => { isEdit ? setEditingSprint(null) : setShowCreate(false); setForm(emptyForm); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div><label className="text-[10px] text-gray-500 mb-1 block">Tên Sprint *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: Sprint 14" autoFocus className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 text-gray-700" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] text-gray-500 mb-1 block">Start Date *</label><input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 text-gray-700" /></div>
            <div><label className="text-[10px] text-gray-500 mb-1 block">End Date *</label><input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 text-gray-700" /></div>
          </div>
          <div><label className="text-[10px] text-gray-500 mb-1 block">Goal Points</label>
            <input type="number" value={form.goalPoints} onChange={e => setForm(p => ({ ...p, goalPoints: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 text-gray-700" /></div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => { isEdit ? setEditingSprint(null) : setShowCreate(false); setForm(emptyForm); }} className="text-[12px] text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Cancel</button>
          <button onClick={isEdit ? handleSaveEdit : handleCreate} disabled={!form.name.trim() || !form.startDate || !form.endDate}
            className="text-[12px] bg-cyan-500 text-white px-4 py-1.5 rounded-lg hover:bg-cyan-600 disabled:opacity-40">{isEdit ? "Save" : "Create"}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex overflow-hidden" onClick={() => { setCtxMenu(null); setAddTaskTo(null); }}>
      {/* Main content */}
      <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-md shadow-cyan-500/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-gray-900 tracking-tight">Sprints</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">Manage agile sprints and track velocity</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCompareMode(!compareMode)}
                className={`flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-xl border transition-all ${compareMode ? "border-violet-300 bg-violet-50 text-violet-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                <BarChart3 className="w-3.5 h-3.5" /> So sánh
              </button>
              <button onClick={() => setShowBacklog(!showBacklog)}
                className={`flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-xl border transition-all ${showBacklog ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                <Package className="w-3.5 h-3.5" /> Backlog ({backlogTasks.length})
              </button>
              <button onClick={() => { setForm(emptyForm); setShowCreate(true); }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-[11px] px-4 py-2 rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm shadow-cyan-500/20">
                <Plus className="w-3.5 h-3.5" /> New Sprint
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Total Sprints", value: sprintList.length, color: "#0891b2", bg: "#ecfeff", icon: <Zap className="w-4 h-4" /> },
              { label: "Active", value: sprintList.filter(s => s.status === "active").length, color: "#059669", bg: "#ecfdf5", icon: <Play className="w-4 h-4" /> },
              { label: "Avg Velocity", value: Math.round(velocityHistory.reduce((a, v) => a + v.completed, 0) / velocityHistory.length), color: "#7c3aed", bg: "#f3e8ff", icon: <TrendingDown className="w-4 h-4" /> },
              { label: "Backlog", value: backlogTasks.length, color: "#6b7280", bg: "#f9fafb", icon: <Package className="w-4 h-4" /> },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.bg, color: s.color }}>{s.icon}</div>
                  <span className="text-xl tracking-tight" style={{ color: s.color }}>{s.value}</span>
                </div>
                <p className="text-[9px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Velocity chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm">
            <h3 className="text-[13px] text-gray-700 mb-4">Team Velocity</h3>
            <div className="flex items-end gap-2 h-[100px]">
              {velocityData.map((v, i) => {
                const maxH = 90;
                const maxVal = Math.max(...velocityData.map(d => Math.max(d.planned, d.completed)));
                const pH = (v.planned / maxVal) * maxH;
                const cH = (v.completed / maxVal) * maxH;
                const isCurrent = i >= velocityHistory.length;
                return (
                  <div key={v.sprint} className={`flex-1 flex flex-col items-center gap-0.5 ${isCurrent ? "" : "opacity-70"}`}>
                    <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: maxH }}>
                      <div className="w-3 rounded-t-sm bg-gray-200 transition-all" style={{ height: pH }} title={`Planned: ${v.planned}`} />
                      <div className="w-3 rounded-t-sm transition-all" style={{ height: cH, backgroundColor: v.completed >= v.planned * 0.8 ? "#0891b2" : "#d97706" }} title={`Completed: ${v.completed}`} />
                    </div>
                    <span className={`text-[8px] truncate w-full text-center ${isCurrent ? "text-gray-700" : "text-gray-400"}`}>{v.sprint.replace("Sprint ", "S")}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-2 justify-center">
              <span className="flex items-center gap-1.5 text-[9px] text-gray-400"><div className="w-2 h-2 rounded-sm bg-gray-200" /> Planned</span>
              <span className="flex items-center gap-1.5 text-[9px] text-gray-400"><div className="w-2 h-2 rounded-sm bg-cyan-500" /> Completed</span>
            </div>
          </div>

          {/* Velocity Forecast & Sprint Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
            {/* Velocity Forecast */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-[13px] text-gray-700 mb-3 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-violet-500" /> Velocity Forecast</h3>
              {(() => {
                const completedVelocities = velocityHistory.map(v => v.completed);
                const avgVelocity = Math.round(completedVelocities.reduce((a, b) => a + b, 0) / completedVelocities.length);
                const trend = completedVelocities.length >= 2 ? completedVelocities[completedVelocities.length - 1] - completedVelocities[completedVelocities.length - 2] : 0;
                const forecast = Math.max(0, avgVelocity + Math.round(trend * 0.5));
                const maxVelocity = Math.max(...completedVelocities);
                const minVelocity = Math.min(...completedVelocities);
                return (
                  <div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-cyan-50 rounded-xl p-3 text-center"><p className="text-[18px] text-cyan-700">{avgVelocity}</p><p className="text-[9px] text-cyan-500">Avg Velocity</p></div>
                      <div className="bg-violet-50 rounded-xl p-3 text-center"><p className="text-[18px] text-violet-700">{forecast}</p><p className="text-[9px] text-violet-500">Next Forecast</p></div>
                      <div className={`rounded-xl p-3 text-center ${trend >= 0 ? "bg-emerald-50" : "bg-red-50"}`}><p className={`text-[18px] ${trend >= 0 ? "text-emerald-700" : "text-red-700"}`}>{trend >= 0 ? "+" : ""}{trend}</p><p className={`text-[9px] ${trend >= 0 ? "text-emerald-500" : "text-red-500"}`}>Trend</p></div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <span>Range: {minVelocity}–{maxVelocity} pts</span>
                      <span className="text-gray-300">·</span>
                      <span>Consistency: {Math.round(100 - ((maxVelocity - minVelocity) / avgVelocity) * 100)}%</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Sprint Health */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-[13px] text-gray-700 mb-3 flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-amber-500" /> Sprint Health Scores</h3>
              <div className="space-y-2">
                {sprintList.map(sprint => {
                  const st = tasks.filter(t => sprint.taskIds.includes(t.id));
                  const done = st.filter(t => t.status === "done").length;
                  const pct = st.length > 0 ? Math.round((done / st.length) * 100) : 0;
                  const pointPct = sprint.goalPoints > 0 ? Math.round((sprint.completedPoints / sprint.goalPoints) * 100) : 0;
                  const sGoals = sprintGoals.filter(g => g.sprintId === sprint.id);
                  const goalPct = sGoals.length > 0 ? Math.round((sGoals.filter(g => g.achieved).length / sGoals.length) * 100) : 0;
                  const health = Math.round((pct + pointPct + goalPct) / 3);
                  const healthColor = health >= 70 ? "#059669" : health >= 40 ? "#d97706" : "#dc2626";
                  return (
                    <div key={sprint.id} className="flex items-center gap-3 py-1.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${sprint.status === "active" ? "bg-cyan-50 text-cyan-600" : sprint.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>{sprint.status === "active" ? "●" : sprint.status === "completed" ? "✓" : "○"}</span>
                      <span className="text-[11px] text-gray-700 w-24 truncate">{sprint.name}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${health}%`, backgroundColor: healthColor }} />
                      </div>
                      <span className="text-[10px] w-8 text-right" style={{ color: healthColor }}>{health}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sprint Comparison */}
          {compareMode && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm">
              <h3 className="text-[13px] text-gray-700 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-violet-500" /> Sprint Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-gray-400 text-[9px] uppercase tracking-wider">Sprint</th>
                      <th className="text-center py-2 text-gray-400 text-[9px] uppercase">Status</th>
                      <th className="text-center py-2 text-gray-400 text-[9px] uppercase">Tasks</th>
                      <th className="text-center py-2 text-gray-400 text-[9px] uppercase">Done</th>
                      <th className="text-center py-2 text-gray-400 text-[9px] uppercase">Points</th>
                      <th className="text-center py-2 text-gray-400 text-[9px] uppercase">Velocity</th>
                      <th className="text-center py-2 text-gray-400 text-[9px] uppercase">Duration</th>
                      <th className="text-center py-2 text-gray-400 text-[9px] uppercase">Goals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sprintList.map(sprint => {
                      const sprintTasks = tasks.filter(t => sprint.taskIds.includes(t.id));
                      const done = sprintTasks.filter(t => t.status === "done").length;
                      const pct = sprintTasks.length > 0 ? Math.round((done / sprintTasks.length) * 100) : 0;
                      const days = getDaysTotal(sprint.startDate, sprint.endDate);
                      const goals = sprintGoals.filter(g => g.sprintId === sprint.id);
                      const goalsAchieved = goals.filter(g => g.achieved).length;
                      return (
                        <tr key={sprint.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => { setDetailSprintId(sprint.id); setDetailTab("goals"); }}>
                          <td className="py-2.5 text-gray-800">{sprint.name}</td>
                          <td className="py-2.5 text-center"><span className={`text-[9px] px-2 py-0.5 rounded-full ${sprint.status === "active" ? "bg-cyan-50 text-cyan-600" : sprint.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>{sprint.status}</span></td>
                          <td className="py-2.5 text-center text-gray-600">{sprintTasks.length}</td>
                          <td className="py-2.5 text-center"><span className="text-emerald-600">{done}</span> <span className="text-gray-300">({pct}%)</span></td>
                          <td className="py-2.5 text-center text-gray-600">{sprint.completedPoints}/{sprint.goalPoints}</td>
                          <td className="py-2.5 text-center">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden mx-auto"><div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.min(100, (sprint.completedPoints / sprint.goalPoints) * 100)}%` }} /></div>
                          </td>
                          <td className="py-2.5 text-center text-gray-500">{days}d</td>
                          <td className="py-2.5 text-center text-gray-500">{goals.length > 0 ? `${goalsAchieved}/${goals.length}` : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Burndown */}
          {burndownSprint && (() => {
            const sprint = sprintList.find(s => s.id === burndownSprint);
            if (!sprint) return null;
            const data = getBurndownData(sprint);
            const maxVal = sprint.goalPoints;
            const chartH = 100;
            return (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13px] text-gray-700 flex items-center gap-2"><TrendingDown className="w-3.5 h-3.5 text-gray-400" /> Burndown — {sprint.name}</h3>
                  <button onClick={() => setBurndownSprint(null)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                </div>
                <div className="relative" style={{ height: chartH + 20 }}>
                  <div className="absolute left-0 top-0 bottom-5 flex flex-col justify-between text-[8px] text-gray-400 w-6">
                    <span>{maxVal}</span><span>{Math.round(maxVal / 2)}</span><span>0</span>
                  </div>
                  <div className="ml-8 relative" style={{ height: chartH }}>
                    {[0, 0.25, 0.5, 0.75, 1].map(p => <div key={p} className="absolute w-full border-t border-gray-100" style={{ top: `${p * 100}%` }} />)}
                    <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${data.length - 1} ${maxVal}`} preserveAspectRatio="none">
                      <line x1="0" y1="0" x2={data.length - 1} y2={maxVal} stroke="#d1d5db" strokeWidth="0.3" strokeDasharray="2 1" />
                      {data.filter(d => d.actual >= 0).length > 1 && (
                        <polyline fill="none" stroke="#0891b2" strokeWidth="0.4"
                          points={data.filter(d => d.actual >= 0).map((d, i) => `${i},${maxVal - d.actual}`).join(" ")} />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex justify-between">
                      {data.map((d, i) => (
                        <div key={i} className="relative flex flex-col items-center" style={{ width: 0 }}>
                          {d.actual >= 0 && <div className="absolute w-1.5 h-1.5 rounded-full bg-cyan-500 border border-white" style={{ top: `${((maxVal - d.actual) / maxVal) * 100}%`, transform: "translate(-50%, -50%)" }} />}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="ml-8 flex justify-between mt-1">
                    {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 7)) === 0 || i === data.length - 1).map((d, i) => (
                      <span key={i} className="text-[7px] text-gray-400">{d.label}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 justify-center">
                  <span className="flex items-center gap-1.5 text-[9px] text-gray-400"><div className="w-3 border-t border-dashed border-gray-400" /> Ideal</span>
                  <span className="flex items-center gap-1.5 text-[9px] text-gray-400"><div className="w-3 border-t-2 border-cyan-500" /> Actual</span>
                </div>
              </div>
            );
          })()}

          {/* Search */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm task trong sprint..."
                className="w-full pl-9 pr-3 py-2 text-[11px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 text-gray-700 transition-all" />
            </div>
          </div>

          {/* Sprint cards */}
          <div className="space-y-4">
            {sprintList.map(sprint => {
              const sprintTasks = tasks.filter(t => sprint.taskIds.includes(t.id));
              const filteredTasks = searchQ ? sprintTasks.filter(t => t.title.toLowerCase().includes(searchQ.toLowerCase())) : sprintTasks;
              const done = sprintTasks.filter(t => t.status === "done").length;
              const pct = sprintTasks.length > 0 ? Math.round((done / sprintTasks.length) * 100) : 0;
              const isOpen = expanded[sprint.id];
              const daysLeft = getDaysLeft(sprint.endDate);
              const daysTotal = getDaysTotal(sprint.startDate, sprint.endDate);
              const daysPassed = getDaysPassed(sprint.startDate);
              const timePct = daysTotal > 0 ? Math.round((daysPassed / daysTotal) * 100) : 0;
              const goals = sprintGoals.filter(g => g.sprintId === sprint.id);
              const goalsAchieved = goals.filter(g => g.achieved).length;

              return (
                <div key={sprint.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${sprint.status === "active" ? "border-cyan-200" : "border-gray-200"}`}>
                  <div className="p-5 cursor-pointer" onClick={() => setExpanded(p => ({ ...p, [sprint.id]: !p[sprint.id] }))}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${sprint.status === "active" ? "bg-cyan-50" : sprint.status === "completed" ? "bg-emerald-50" : "bg-gray-50"}`}>
                        {sprint.status === "active" ? <Play className="w-4 h-4 text-cyan-600" /> : sprint.status === "completed" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Pause className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-[13px] text-gray-800">{sprint.name}</h3>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full ${sprint.status === "active" ? "bg-cyan-50 text-cyan-600" : sprint.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                            {sprint.status === "active" ? "Active" : sprint.status === "completed" ? "Completed" : "Planning"}
                          </span>
                          {sprint.status === "active" && daysLeft >= 0 && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${daysLeft <= 2 ? "bg-red-50 text-red-600" : daysLeft <= 5 ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"}`}>
                              <Clock className="w-2.5 h-2.5" /> {daysLeft}d left
                            </span>
                          )}
                          {sprint.status === "active" && daysLeft < 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 flex items-center gap-0.5"><AlertCircle className="w-2.5 h-2.5" /> Overdue</span>
                          )}
                          {goals.length > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 flex items-center gap-0.5">
                              <Target className="w-2.5 h-2.5" /> {goalsAchieved}/{goals.length} goals
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(sprint.startDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "short" })} — {new Date(sprint.endDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "short" })}
                          <span className="text-gray-300 mx-1">·</span>{daysTotal} days
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] shrink-0">
                        <div className="text-center"><p className="text-[8px] text-gray-400">Tasks</p><p className="text-gray-700">{sprintTasks.length}</p></div>
                        <div className="text-center"><p className="text-[8px] text-gray-400">Points</p><p className="text-gray-700">{sprint.completedPoints}/{sprint.goalPoints}</p></div>
                        <div className="text-center"><p className="text-[8px] text-gray-400">Done</p><p className="text-emerald-600">{pct}%</p></div>
                        <div className="flex items-center gap-1">
                          <button onClick={e => { e.stopPropagation(); setBurndownSprint(burndownSprint === sprint.id ? null : sprint.id); }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-cyan-600 transition-all" title="Burndown"><TrendingDown className="w-3.5 h-3.5" /></button>
                          <button onClick={e => { e.stopPropagation(); setDetailSprintId(detailSprintId === sprint.id ? null : sprint.id); setDetailTab("goals"); }}
                            className={`p-1.5 rounded-lg transition-all ${detailSprintId === sprint.id ? "bg-cyan-50 text-cyan-600" : "text-gray-400 hover:bg-gray-100"}`} title="Detail">
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <div className="relative">
                            <button onClick={e => { e.stopPropagation(); setCtxMenu(ctxMenu === sprint.id ? null : sprint.id); }}
                              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-all"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                            {ctxMenu === sprint.id && (
                              <div className="absolute right-0 top-full mt-1 w-[180px] bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1" onClick={e => e.stopPropagation()}>
                                <button onClick={() => openEdit(sprint)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50"><Edit3 className="w-3.5 h-3.5 text-gray-400" /> Chỉnh sửa</button>
                                <button onClick={() => { duplicateSprint(sprint.id); setCtxMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50"><Copy className="w-3.5 h-3.5 text-gray-400" /> Nhân bản</button>
                                <button onClick={() => { setBurndownSprint(sprint.id); setCtxMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50"><TrendingDown className="w-3.5 h-3.5 text-gray-400" /> Burndown</button>
                                <div className="border-t border-gray-100 my-1" />
                                {sprint.status === "planning" && <button onClick={() => handleStatusChange(sprint.id, "active")} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-cyan-600 hover:bg-cyan-50"><Play className="w-3.5 h-3.5" /> Start Sprint</button>}
                                {sprint.status === "active" && <button onClick={() => handleStatusChange(sprint.id, "completed")} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-emerald-600 hover:bg-emerald-50"><CheckCircle2 className="w-3.5 h-3.5" /> Complete Sprint</button>}
                                {sprint.status === "completed" && <button onClick={() => handleStatusChange(sprint.id, "planning")} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50"><RotateCcw className="w-3.5 h-3.5" /> Reopen</button>}
                                <div className="border-t border-gray-100 my-1" />
                                <button onClick={() => { setDeleteConfirm(sprint.id); setCtxMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /> Xoá Sprint</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {isOpen ? <ChevronDown className="w-4 h-4 text-gray-300" /> : <ChevronRight className="w-4 h-4 text-gray-300" />}
                    </div>

                    {/* Progress bars */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-gray-400 w-10 shrink-0">Tasks</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all bg-gradient-to-r from-cyan-500 to-teal-500" style={{ width: `${pct}%` }} /></div>
                        <span className="text-[8px] text-gray-400 w-8 text-right">{pct}%</span>
                      </div>
                      {sprint.status === "active" && (
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-gray-400 w-10 shrink-0">Time</span>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${timePct > pct + 20 ? "bg-red-400" : "bg-gray-300"}`} style={{ width: `${Math.min(100, timePct)}%` }} /></div>
                          <span className="text-[8px] text-gray-400 w-8 text-right">{timePct}%</span>
                        </div>
                      )}
                    </div>

                    {/* Status pills */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {Object.entries(statusConfig).map(([k, v]) => {
                        const count = sprintTasks.filter(t => t.status === k).length;
                        if (count === 0) return null;
                        return <span key={k} className="text-[8px] px-1.5 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: v.bg, color: v.color }}><span className="w-1 h-1 rounded-full" style={{ backgroundColor: v.color }} />{count} {v.label}</span>;
                      })}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-gray-100">
                      <div className="px-5 py-2 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">{filteredTasks.length} tasks</span>
                        <div className="relative">
                          <button onClick={e => { e.stopPropagation(); setAddTaskTo(addTaskTo === sprint.id ? null : sprint.id); }}
                            className="flex items-center gap-1 text-[10px] text-cyan-600 hover:text-cyan-700"><Plus className="w-3 h-3" /> Add task</button>
                          {addTaskTo === sprint.id && (
                            <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-xl border border-gray-200 shadow-xl py-1 min-w-[240px] max-h-[200px] overflow-auto" onClick={e => e.stopPropagation()}>
                              <p className="text-[9px] text-gray-400 px-3 py-1">Backlog tasks:</p>
                              {backlogTasks.length === 0 && <p className="text-[10px] text-gray-400 px-3 py-2">No backlog tasks</p>}
                              {backlogTasks.map(t => (
                                <button key={t.id} onClick={() => { addTaskToSprint(sprint.id, t.id); setAddTaskTo(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50 text-left">
                                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: statusConfig[t.status].color }} />
                                  <span className="truncate">{t.title}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {filteredTasks.map((task, i) => (
                        <div key={task.id} className={`flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 cursor-pointer transition-all group/task ${i < filteredTasks.length - 1 ? "border-b border-gray-50" : ""}`}>
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusConfig[task.status].color }} />
                          <button onClick={() => onTaskClick(task)} className="flex-1 text-[12px] text-gray-700 truncate text-left hover:text-gray-900">{task.title}</button>
                          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: priorityConfig[task.priority].color, backgroundColor: `${priorityConfig[task.priority].color}12` }}>{priorityConfig[task.priority].label}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: statusConfig[task.status].color, backgroundColor: statusConfig[task.status].bg }}>{statusConfig[task.status].label}</span>
                          {task.assignee && <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ backgroundColor: task.assignee.color }}>{task.assignee.name.charAt(0)}</div>}
                          <button onClick={e => { e.stopPropagation(); removeTaskFromSprint(sprint.id, task.id); }}
                            className="opacity-0 group-hover/task:opacity-100 p-0.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 shrink-0"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                      {filteredTasks.length === 0 && <div className="text-center py-6 text-[11px] text-gray-400">{searchQ ? "Không tìm thấy task nào" : "Chưa có task trong sprint này"}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Backlog panel */}
          {showBacklog && (
            <div className="mt-5 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2"><Package className="w-3.5 h-3.5 text-gray-400" /><span className="text-[13px] text-gray-700">Backlog</span><span className="text-[10px] text-gray-400">{backlogTasks.length} tasks</span></div>
                <button onClick={() => setShowBacklog(false)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
              </div>
              {backlogTasks.length === 0 && <div className="text-center py-8 text-[11px] text-gray-400">Tất cả tasks đã được gán vào sprint</div>}
              {backlogTasks.map((task, i) => (
                <div key={task.id} className={`flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 cursor-pointer transition-all group/bl ${i < backlogTasks.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusConfig[task.status].color }} />
                  <button onClick={() => onTaskClick(task)} className="flex-1 text-[12px] text-gray-700 truncate text-left hover:text-gray-900">{task.title}</button>
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: statusConfig[task.status].color, backgroundColor: statusConfig[task.status].bg }}>{statusConfig[task.status].label}</span>
                  {task.assignee && <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ backgroundColor: task.assignee.color }}>{task.assignee.name.charAt(0)}</div>}
                  <div className="relative">
                    <button onClick={e => e.stopPropagation()} className="opacity-0 group-hover/bl:opacity-100 text-[9px] text-cyan-600 hover:text-cyan-700 flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      <select onChange={e => { if (e.target.value) { addTaskToSprint(e.target.value, task.id); e.target.value = ""; } }} className="absolute inset-0 opacity-0 cursor-pointer" defaultValue="">
                        <option value="" disabled>Add to...</option>
                        {sprintList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== DETAIL PANEL ===== */}
      {detailSprint && (
        <div className="w-[340px] border-l border-gray-100 flex flex-col bg-gray-50/30 shrink-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-500" />
              <span className="text-[12px] text-gray-700">{detailSprint.name}</span>
            </div>
            <button onClick={() => setDetailSprintId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0.5 px-3 py-2 border-b border-gray-100 overflow-x-auto">
            {([
              ["goals", "Goals", <Target key="g" className="w-3 h-3" />],
              ["retro", "Retro", <MessageSquare key="r" className="w-3 h-3" />],
              ["capacity", "Capacity", <Users key="c" className="w-3 h-3" />],
              ["report", "Report", <BarChart3 key="rp" className="w-3 h-3" />],
            ] as [DetailTab, string, React.ReactNode][]).map(([key, label, icon]) => (
              <button key={key} onClick={() => setDetailTab(key)}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] rounded-lg transition-all shrink-0 ${detailTab === key ? "bg-white shadow-sm text-gray-800 border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}>
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {/* GOALS TAB */}
            {detailTab === "goals" && (
              <>
                <div className="flex items-center gap-2">
                  <input value={newGoalText} onChange={e => setNewGoalText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addSprintGoal(); }}
                    placeholder="Thêm sprint goal..."
                    className="flex-1 text-[11px] bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-300" />
                  <button onClick={addSprintGoal} disabled={!newGoalText.trim()} className="px-3 py-2 bg-cyan-500 text-white text-[10px] rounded-lg hover:bg-cyan-600 disabled:opacity-40">Thêm</button>
                </div>
                {detailGoals.length === 0 && <p className="text-[11px] text-gray-400 text-center py-6">Chưa có sprint goal nào</p>}
                {detailGoals.map(goal => (
                  <div key={goal.id} className="flex items-start gap-2.5 bg-white rounded-xl p-3 border border-gray-200">
                    <button onClick={() => toggleGoalAchieved(goal.id)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${goal.achieved ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300"}`}>
                      {goal.achieved && <CheckCircle2 className="w-3 h-3" />}
                    </button>
                    <span className={`text-[11px] leading-[1.5] ${goal.achieved ? "text-gray-400 line-through" : "text-gray-700"}`}>{goal.text}</span>
                  </div>
                ))}

                {/* Suggested tasks */}
                {suggestedTasks.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400" /> Gợi ý thêm tasks</p>
                    {suggestedTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-2 py-1.5">
                        <span className="text-[10px] text-gray-600 truncate flex-1">{task.title}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: priorityConfig[task.priority].color, backgroundColor: `${priorityConfig[task.priority].color}12` }}>{priorityConfig[task.priority].label}</span>
                        <button onClick={() => { addTaskToSprint(detailSprint.id, task.id); toast.success("Task đã thêm vào sprint"); }}
                          className="text-[9px] text-cyan-600 hover:text-cyan-700 px-1.5 py-0.5 rounded hover:bg-cyan-50"><Plus className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* RETRO TAB */}
            {detailTab === "retro" && (
              <>
                {/* Went Well */}
                <div>
                  <p className="text-[10px] text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Went Well</p>
                  <div className="space-y-1.5">
                    {(detailRetro?.wentWell || []).map((item, i) => (
                      <div key={i} className="flex items-start gap-2 bg-emerald-50 rounded-lg px-3 py-2">
                        <span className="text-emerald-500 mt-0.5">✓</span>
                        <span className="text-[11px] text-emerald-800">{item}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5">
                      <input value={retroInput.wentWell} onChange={e => setRetroInput(p => ({ ...p, wentWell: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") addRetroItem("wentWell"); }}
                        placeholder="Thêm..." className="flex-1 text-[10px] bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-300" />
                      <button onClick={() => addRetroItem("wentWell")} disabled={!retroInput.wentWell.trim()} className="text-[9px] text-emerald-600 px-2 py-1.5 rounded-lg hover:bg-emerald-50 disabled:opacity-40">+</button>
                    </div>
                  </div>
                </div>

                {/* Needs Improvement */}
                <div>
                  <p className="text-[10px] text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1"><ThumbsDown className="w-3 h-3" /> Needs Improvement</p>
                  <div className="space-y-1.5">
                    {(detailRetro?.needsImprovement || []).map((item, i) => (
                      <div key={i} className="flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2">
                        <span className="text-amber-500 mt-0.5">!</span>
                        <span className="text-[11px] text-amber-800">{item}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5">
                      <input value={retroInput.needsImprovement} onChange={e => setRetroInput(p => ({ ...p, needsImprovement: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") addRetroItem("needsImprovement"); }}
                        placeholder="Thêm..." className="flex-1 text-[10px] bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-300" />
                      <button onClick={() => addRetroItem("needsImprovement")} disabled={!retroInput.needsImprovement.trim()} className="text-[9px] text-amber-600 px-2 py-1.5 rounded-lg hover:bg-amber-50 disabled:opacity-40">+</button>
                    </div>
                  </div>
                </div>

                {/* Action Items */}
                <div>
                  <p className="text-[10px] text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1"><ListChecks className="w-3 h-3" /> Action Items</p>
                  <div className="space-y-1.5">
                    {(detailRetro?.actionItems || []).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
                        <button onClick={() => toggleActionItem(detailSprint.id, i)} className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${item.done ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300"}`}>
                          {item.done && <CheckCircle2 className="w-2.5 h-2.5" />}
                        </button>
                        <span className={`text-[11px] ${item.done ? "text-gray-400 line-through" : "text-gray-700"}`}>{item.text}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5">
                      <input value={retroInput.actionItem} onChange={e => setRetroInput(p => ({ ...p, actionItem: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") addRetroItem("actionItem"); }}
                        placeholder="Thêm action item..." className="flex-1 text-[10px] bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-300" />
                      <button onClick={() => addRetroItem("actionItem")} disabled={!retroInput.actionItem.trim()} className="text-[9px] text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-40">+</button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* CAPACITY TAB */}
            {detailTab === "capacity" && (() => {
              const capacityData = getCapacityData(detailSprint);
              return (
                <>
                  {capacityData.length === 0 && <p className="text-[11px] text-gray-400 text-center py-6">Chưa có task nào được gán</p>}
                  {capacityData.map(d => (
                    <div key={d.member.id} className="bg-white rounded-xl p-3.5 border border-gray-200">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] text-white" style={{ backgroundColor: d.member.color }}>{d.member.name.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-gray-800 truncate">{d.member.name}</p>
                          <p className="text-[9px] text-gray-400">{d.member.role}</p>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full ${d.utilization > 100 ? "bg-red-50 text-red-600" : d.utilization > 80 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                          {d.utilization}%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-[9px] mb-2">
                        <div className="bg-gray-50 rounded-lg py-1.5"><p className="text-gray-700">{d.tasks}</p><p className="text-[8px] text-gray-400">Tasks</p></div>
                        <div className="bg-emerald-50 rounded-lg py-1.5"><p className="text-emerald-700">{d.done}</p><p className="text-[8px] text-emerald-500">Done</p></div>
                        <div className="bg-cyan-50 rounded-lg py-1.5"><p className="text-cyan-700">{d.estHours.toFixed(0)}h</p><p className="text-[8px] text-cyan-500">Est.</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-gray-400 w-10">Load</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${d.utilization > 100 ? "bg-red-400" : d.utilization > 80 ? "bg-amber-400" : "bg-emerald-400"}`}
                            style={{ width: `${Math.min(100, d.utilization)}%` }} />
                        </div>
                        <span className="text-[8px] text-gray-400">{d.estHours.toFixed(0)}/{d.capacity}h</span>
                      </div>
                    </div>
                  ))}
                </>
              );
            })()}

            {/* REPORT TAB */}
            {detailTab === "report" && (() => {
              const sprintTasks = tasks.filter(t => detailSprint.taskIds.includes(t.id));
              const done = sprintTasks.filter(t => t.status === "done").length;
              const inProgress = sprintTasks.filter(t => t.status === "in_progress").length;
              const review = sprintTasks.filter(t => t.status === "in_review").length;
              const todo = sprintTasks.filter(t => t.status === "todo").length;
              const pct = sprintTasks.length > 0 ? Math.round((done / sprintTasks.length) * 100) : 0;
              const goals = sprintGoals.filter(g => g.sprintId === detailSprint.id);
              const goalsAchieved = goals.filter(g => g.achieved).length;
              const totalEst = sprintTasks.reduce((a, t) => a + (t.timeEstimate || 0), 0) / 60;
              const totalSpent = sprintTasks.reduce((a, t) => a + (t.timeSpent || 0), 0) / 60;

              return (
                <>
                  {/* Overall */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h4 className="text-[11px] text-gray-500 mb-3">Sprint Summary</h4>
                    <div className="flex items-center justify-center mb-3">
                      <div className="relative w-20 h-20">
                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                          <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                          <circle cx="40" cy="40" r="32" fill="none" stroke="#0891b2" strokeWidth="6"
                            strokeDasharray={`${2 * Math.PI * 32}`} strokeDashoffset={`${2 * Math.PI * 32 * (1 - pct / 100)}`} strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[16px] text-gray-800">{pct}%</span>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-[10px]">
                      {[
                        { label: "Done", value: done, color: "#059669" },
                        { label: "In Progress", value: inProgress, color: "#0891b2" },
                        { label: "In Review", value: review, color: "#d97706" },
                        { label: "To Do", value: todo, color: "#6b7280" },
                      ].map(s => (
                        <div key={s.label} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="text-gray-500 flex-1">{s.label}</span>
                          <span className="text-gray-700">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h4 className="text-[11px] text-gray-500 mb-2">Time</h4>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-cyan-50 rounded-lg p-2"><p className="text-[14px] text-cyan-700">{totalSpent.toFixed(0)}h</p><p className="text-[8px] text-cyan-500">Tracked</p></div>
                      <div className="bg-gray-50 rounded-lg p-2"><p className="text-[14px] text-gray-700">{totalEst.toFixed(0)}h</p><p className="text-[8px] text-gray-500">Estimated</p></div>
                    </div>
                  </div>

                  {/* Goals */}
                  {goals.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <h4 className="text-[11px] text-gray-500 mb-2">Goals ({goalsAchieved}/{goals.length})</h4>
                      <div className="space-y-1">
                        {goals.map(g => (
                          <div key={g.id} className="flex items-center gap-2 text-[10px]">
                            {g.achieved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Circle className="w-3.5 h-3.5 text-gray-300" />}
                            <span className={g.achieved ? "text-gray-400 line-through" : "text-gray-600"}>{g.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Points */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h4 className="text-[11px] text-gray-500 mb-2">Points</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-[18px] text-cyan-700">{detailSprint.completedPoints}</span>
                      <span className="text-[12px] text-gray-400">/ {detailSprint.goalPoints} planned</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                      <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.min(100, (detailSprint.completedPoints / detailSprint.goalPoints) * 100)}%` }} />
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ===== MODALS ===== */}
      {showCreate && renderFormModal(false)}
      {editingSprint && renderFormModal(true)}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-500" /></div><div><h3 className="text-[14px] text-gray-800">Delete Sprint?</h3><p className="text-[11px] text-gray-500 mt-0.5">Tasks sẽ được chuyển về backlog.</p></div></div>
            <div className="flex justify-end gap-2 mt-5"><button onClick={() => setDeleteConfirm(null)} className="text-[12px] text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-100">Cancel</button><button onClick={() => handleDelete(deleteConfirm)} className="text-[12px] text-white bg-red-500 hover:bg-red-600 px-5 py-2 rounded-xl shadow-sm">Delete</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
