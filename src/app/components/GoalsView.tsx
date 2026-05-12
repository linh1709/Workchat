import { useState, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  Target, Plus, ChevronDown, ChevronRight, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, Search, Edit3, Trash2, X, MoreHorizontal, Star,
  Eye, AlertCircle, Filter, BarChart3, Calendar, GitBranch, MessageSquare,
  Users, ArrowRight, ArrowUp, ArrowDown, Zap, Flag, Bookmark, Copy,
  History, Sparkles, Layout, List, RefreshCw, Share2, Link, Hash
} from "lucide-react";
import { goals as initialGoals, teamMembers, type Goal, type KeyResult } from "./data";

const goalColors = ["#0891b2", "#7c3aed", "#059669", "#d97706", "#dc2626", "#ec4899", "#6366f1", "#0ea5e9"];

const statusOptions: { value: Goal["status"]; label: string; color: string; bg: string }[] = [
  { value: "on_track", label: "On Track", color: "#059669", bg: "#ecfdf5" },
  { value: "at_risk", label: "At Risk", color: "#d97706", bg: "#fefce8" },
  { value: "behind", label: "Behind", color: "#dc2626", bg: "#fef2f2" },
  { value: "completed", label: "Completed", color: "#059669", bg: "#ecfdf5" },
];

type ViewType = "list" | "timeline" | "alignment";
type ConfidenceLevel = 1 | 2 | 3 | 4 | 5;

interface CheckIn {
  id: string;
  goalId: string;
  date: string;
  note: string;
  confidence: ConfidenceLevel;
  progress: number;
  author: string;
  authorColor: string;
  authorInitial: string;
}

interface GoalActivity {
  id: string;
  goalId: string;
  text: string;
  time: string;
  type: "progress" | "status" | "checkin" | "kr_update" | "comment";
  authorInitial: string;
  authorColor: string;
}

const goalTemplates = [
  { id: "revenue", name: "Tăng doanh thu", desc: "KRs: MRR, conversion, retention", icon: "💰", color: "#059669", krs: [{ title: "Tăng MRR lên $50K", target: 50000, unit: "USD" }, { title: "Conversion rate ≥ 5%", target: 5, unit: "%" }, { title: "Retention rate ≥ 90%", target: 90, unit: "%" }] },
  { id: "product", name: "Ra mắt tính năng mới", desc: "KRs: delivery, adoption, satisfaction", icon: "🚀", color: "#7c3aed", krs: [{ title: "Ship 3 major features", target: 3, unit: "features" }, { title: "Feature adoption ≥ 60%", target: 60, unit: "%" }, { title: "CSAT ≥ 4.5/5", target: 4.5, unit: "score" }] },
  { id: "engineering", name: "Cải thiện chất lượng code", desc: "KRs: coverage, bugs, performance", icon: "⚙️", color: "#0891b2", krs: [{ title: "Test coverage ≥ 80%", target: 80, unit: "%" }, { title: "Critical bugs < 5", target: 5, unit: "bugs" }, { title: "Page load < 2s", target: 2, unit: "seconds" }] },
  { id: "hiring", name: "Mở rộng đội ngũ", desc: "KRs: hiring, onboarding, retention", icon: "👥", color: "#d97706", krs: [{ title: "Hire 5 engineers", target: 5, unit: "people" }, { title: "Onboarding < 2 weeks", target: 2, unit: "weeks" }, { title: "Employee NPS ≥ 70", target: 70, unit: "score" }] },
  { id: "growth", name: "Tăng trưởng người dùng", desc: "KRs: MAU, DAU, churn", icon: "📈", color: "#ec4899", krs: [{ title: "MAU đạt 100K", target: 100000, unit: "users" }, { title: "DAU/MAU ≥ 40%", target: 40, unit: "%" }, { title: "Churn rate < 3%", target: 3, unit: "%" }] },
];

/* ============ INITIAL EXTRA DATA ============ */
const initialCheckIns: CheckIn[] = [
  { id: "ci1", goalId: "g1", date: "14/03/2026", note: "Sprint 12 delivered 3 features ahead of schedule. Team velocity increased 15%. Need to focus on test coverage.", confidence: 4, progress: 65, author: "Nguyễn Minh", authorColor: "#0891b2", authorInitial: "NM" },
  { id: "ci2", goalId: "g1", date: "07/03/2026", note: "CI/CD pipeline completed. Auth module in progress. On track overall.", confidence: 4, progress: 52, author: "Nguyễn Minh", authorColor: "#0891b2", authorInitial: "NM" },
  { id: "ci3", goalId: "g2", date: "12/03/2026", note: "API v2 endpoints 70% done. Rate limiting needs more work. Considering deadline extension.", confidence: 3, progress: 45, author: "Lê Phúc", authorColor: "#059669", authorInitial: "LP" },
  { id: "ci4", goalId: "g3", date: "10/03/2026", note: "Design system tokens finalized. Component library at 60%. Dark mode in progress.", confidence: 4, progress: 70, author: "Trần Hương", authorColor: "#7c3aed", authorInitial: "TH" },
];

const initialActivities: GoalActivity[] = [
  { id: "a1", goalId: "g1", text: "KR \"Test coverage\" tăng từ 65% → 72%", time: "2 giờ trước", type: "kr_update", authorInitial: "LP", authorColor: "#059669" },
  { id: "a2", goalId: "g1", text: "Check-in weekly: Confidence 4/5", time: "3 ngày trước", type: "checkin", authorInitial: "NM", authorColor: "#0891b2" },
  { id: "a3", goalId: "g1", text: "Status thay đổi: At Risk → On Track", time: "5 ngày trước", type: "status", authorInitial: "NM", authorColor: "#0891b2" },
  { id: "a4", goalId: "g2", text: "Thêm KR mới: \"API response time < 200ms\"", time: "1 tuần trước", type: "kr_update", authorInitial: "LP", authorColor: "#059669" },
  { id: "a5", goalId: "g3", text: "Progress cập nhật: 65% → 70%", time: "1 tuần trước", type: "progress", authorInitial: "TH", authorColor: "#7c3aed" },
];

/* ============ CONFIDENCE DISPLAY ============ */
const confidenceLabels: Record<ConfidenceLevel, { label: string; color: string; emoji: string }> = {
  1: { label: "Rất thấp", color: "#dc2626", emoji: "😟" },
  2: { label: "Thấp", color: "#ea580c", emoji: "😕" },
  3: { label: "Trung bình", color: "#d97706", emoji: "😐" },
  4: { label: "Cao", color: "#059669", emoji: "😊" },
  5: { label: "Rất cao", color: "#059669", emoji: "🔥" },
};

export function GoalsView() {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ g1: true, g2: false, g3: true, g4: false });
  const [searchQ, setSearchQ] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewType, setViewType] = useState<ViewType>("list");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<string | null>(null);
  const [editingKR, setEditingKR] = useState<{ goalId: string; kr: KeyResult } | null>(null);
  const [addingKR, setAddingKR] = useState<string | null>(null);
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"checkins" | "activity" | "alignment">("checkins");

  // Check-in state
  const [checkIns, setCheckIns] = useState<CheckIn[]>(initialCheckIns);
  const [activities] = useState<GoalActivity[]>(initialActivities);
  const [showCheckInModal, setShowCheckInModal] = useState<string | null>(null);
  const [checkInForm, setCheckInForm] = useState({ note: "", confidence: 4 as ConfidenceLevel, progress: 0 });

  // Forms
  const [createForm, setCreateForm] = useState({ title: "", description: "", color: "#0891b2", ownerId: "u1", dueDate: "2026-06-30", status: "on_track" as Goal["status"], parentId: "" });
  const [editForm, setEditForm] = useState({ title: "", description: "", color: "#0891b2", ownerId: "u1", dueDate: "", status: "on_track" as Goal["status"] });
  const [krForm, setKrForm] = useState({ title: "", target: "", unit: "" });
  const [editKRForm, setEditKRForm] = useState({ title: "", current: "", target: "", unit: "" });

  // Computed
  const filtered = useMemo(() => goals.filter(g => {
    if (searchQ && !g.title.toLowerCase().includes(searchQ.toLowerCase()) && !g.description.toLowerCase().includes(searchQ.toLowerCase())) return false;
    if (filterStatus !== "all" && g.status !== filterStatus) return false;
    return true;
  }), [goals, searchQ, filterStatus]);

  const avgProgress = goals.length > 0 ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length) : 0;
  const avgConfidence = useMemo(() => {
    const recent = checkIns.reduce((acc, ci) => {
      if (!acc[ci.goalId] || ci.date > acc[ci.goalId].date) acc[ci.goalId] = ci;
      return acc;
    }, {} as Record<string, CheckIn>);
    const vals = Object.values(recent);
    return vals.length > 0 ? (vals.reduce((a, c) => a + c.confidence, 0) / vals.length).toFixed(1) : "—";
  }, [checkIns]);

  const detailGoal = goals.find(g => g.id === detailGoalId);
  const goalCheckIns = useMemo(() => checkIns.filter(c => c.goalId === detailGoalId).sort((a, b) => b.date.localeCompare(a.date)), [checkIns, detailGoalId]);
  const goalActivities = useMemo(() => activities.filter(a => a.goalId === detailGoalId), [activities, detailGoalId]);

  // Handlers
  const statusIcon = (s: Goal["status"]) => {
    if (s === "on_track") return <TrendingUp className="w-3 h-3 text-emerald-500" />;
    if (s === "at_risk") return <AlertTriangle className="w-3 h-3 text-amber-500" />;
    if (s === "behind") return <AlertTriangle className="w-3 h-3 text-red-500" />;
    return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
  };
  const getStatusCfg = (s: Goal["status"]) => statusOptions.find(o => o.value === s)!;

  const handleCreate = useCallback(() => {
    if (!createForm.title.trim()) return;
    const ng: Goal = { id: `g_${Date.now()}`, title: createForm.title, description: createForm.description, progress: 0, target: 100, unit: "%", color: createForm.color, ownerId: createForm.ownerId, dueDate: createForm.dueDate, status: createForm.status, keyResults: [] };
    setGoals(prev => [...prev, ng]);
    setExpanded(p => ({ ...p, [ng.id]: true }));
    setShowCreateModal(false);
    setCreateForm({ title: "", description: "", color: "#0891b2", ownerId: "u1", dueDate: "2026-06-30", status: "on_track", parentId: "" });
    toast.success("Goal mới đã được tạo");
  }, [createForm]);

  const createFromTemplate = useCallback((tplId: string) => {
    const tpl = goalTemplates.find(t => t.id === tplId);
    if (!tpl) return;
    const krs: KeyResult[] = tpl.krs.map((kr, i) => ({ id: `kr_${Date.now()}_${i}`, title: kr.title, current: 0, target: kr.target, unit: kr.unit }));
    const ng: Goal = { id: `g_${Date.now()}`, title: tpl.name, description: tpl.desc, progress: 0, target: 100, unit: "%", color: tpl.color, ownerId: "u1", dueDate: "2026-06-30", status: "on_track", keyResults: krs };
    setGoals(prev => [...prev, ng]);
    setExpanded(p => ({ ...p, [ng.id]: true }));
    setShowTemplateModal(false);
    toast.success(`Goal "${tpl.name}" đã được tạo từ template`);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingGoal || !editForm.title.trim()) return;
    setGoals(prev => prev.map(g => g.id === editingGoal.id ? { ...g, title: editForm.title, description: editForm.description, color: editForm.color, ownerId: editForm.ownerId, dueDate: editForm.dueDate, status: editForm.status } : g));
    setEditingGoal(null);
    toast.success("Goal đã được cập nhật");
  }, [editingGoal, editForm]);

  const handleDelete = useCallback((id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    setDeleteConfirm(null);
    if (detailGoalId === id) setDetailGoalId(null);
    toast.success("Goal đã bị xoá");
  }, [detailGoalId]);

  const handleStatusChange = useCallback((goalId: string, status: Goal["status"]) => {
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, status, progress: status === "completed" ? 100 : g.progress } : g));
    toast.success(`Status → ${statusOptions.find(s => s.value === status)?.label}`);
  }, []);

  const duplicateGoal = useCallback((goalId: string) => {
    const orig = goals.find(g => g.id === goalId);
    if (!orig) return;
    const dup = { ...orig, id: `g_${Date.now()}`, title: `${orig.title} (Copy)`, keyResults: orig.keyResults.map(kr => ({ ...kr, id: `kr_${Date.now()}_${Math.random()}` })) };
    setGoals(prev => [...prev, dup]);
    toast.success("Goal đã được nhân bản");
  }, [goals]);

  const handleAddKR = useCallback((goalId: string) => {
    if (!krForm.title.trim() || !krForm.target) return;
    const nkr: KeyResult = { id: `kr_${Date.now()}`, title: krForm.title, current: 0, target: parseFloat(krForm.target), unit: krForm.unit || "units" };
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, keyResults: [...g.keyResults, nkr] } : g));
    setAddingKR(null); setKrForm({ title: "", target: "", unit: "" });
  }, [krForm]);

  const handleSaveEditKR = useCallback(() => {
    if (!editingKR || !editKRForm.title.trim()) return;
    setGoals(prev => prev.map(g => g.id === editingKR.goalId ? { ...g, keyResults: g.keyResults.map(kr => kr.id === editingKR.kr.id ? { ...kr, title: editKRForm.title, current: parseFloat(editKRForm.current) || 0, target: parseFloat(editKRForm.target) || kr.target, unit: editKRForm.unit || kr.unit } : kr) } : g));
    setEditingKR(null);
  }, [editingKR, editKRForm]);

  const handleDeleteKR = useCallback((goalId: string, krId: string) => {
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, keyResults: g.keyResults.filter(kr => kr.id !== krId) } : g));
  }, []);

  const handleKRProgressChange = useCallback((goalId: string, krId: string, value: number) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      const newKRs = g.keyResults.map(kr => kr.id === krId ? { ...kr, current: value } : kr);
      const totalKRProg = newKRs.reduce((a, kr) => a + Math.min(100, Math.round((kr.current / kr.target) * 100)), 0);
      const avgKR = newKRs.length > 0 ? Math.round(totalKRProg / newKRs.length) : g.progress;
      return { ...g, keyResults: newKRs, progress: avgKR };
    }));
  }, []);

  const submitCheckIn = useCallback(() => {
    if (!showCheckInModal || !checkInForm.note.trim()) return;
    const ci: CheckIn = {
      id: `ci_${Date.now()}`, goalId: showCheckInModal, date: new Date().toLocaleDateString("vi-VN"),
      note: checkInForm.note, confidence: checkInForm.confidence, progress: checkInForm.progress,
      author: "Nguyễn Minh", authorColor: "#0891b2", authorInitial: "NM",
    };
    setCheckIns(prev => [ci, ...prev]);
    // Update goal progress
    setGoals(prev => prev.map(g => g.id === showCheckInModal ? { ...g, progress: checkInForm.progress } : g));
    setShowCheckInModal(null);
    setCheckInForm({ note: "", confidence: 4, progress: 0 });
    toast.success("Check-in đã được ghi nhận");
  }, [showCheckInModal, checkInForm]);

  return (
    <div className="flex-1 flex overflow-hidden" onClick={() => setCtxMenu(null)}>
      {/* Main content */}
      <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-md shadow-cyan-500/20">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-gray-900 tracking-tight">Goals & OKRs</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">{goals.length} goals · Avg {avgProgress}% · Confidence {avgConfidence}/5</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowTemplateModal(true)} className="flex items-center gap-1.5 text-[11px] text-gray-500 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all">
                <Sparkles className="w-3.5 h-3.5" /> Templates
              </button>
              <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-[11px] px-4 py-2 rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm shadow-cyan-500/20">
                <Plus className="w-3.5 h-3.5" /> New Goal
              </button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
            {[
              { label: "Total Goals", value: goals.length, color: "#0891b2", bg: "#ecfeff", icon: <Target className="w-4 h-4" /> },
              { label: "On Track", value: goals.filter(g => g.status === "on_track").length, color: "#059669", bg: "#ecfdf5", icon: <TrendingUp className="w-4 h-4" /> },
              { label: "At Risk", value: goals.filter(g => g.status === "at_risk").length, color: "#d97706", bg: "#fefce8", icon: <AlertTriangle className="w-4 h-4" /> },
              { label: "Behind", value: goals.filter(g => g.status === "behind").length, color: "#dc2626", bg: "#fef2f2", icon: <AlertTriangle className="w-4 h-4" /> },
              { label: "Completed", value: goals.filter(g => g.status === "completed").length, color: "#059669", bg: "#ecfdf5", icon: <CheckCircle2 className="w-4 h-4" /> },
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

          {/* OKR Health Score */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] text-gray-700 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-gray-400" /> OKR Health Score</h3>
              <span className="text-[9px] text-gray-400">Q1 2026</span>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#f1f5f9" strokeWidth="5" />
                  <circle cx="32" cy="32" r="26" fill="none" stroke={avgProgress >= 70 ? "#059669" : avgProgress >= 40 ? "#d97706" : "#dc2626"} strokeWidth="5"
                    strokeDasharray={`${2 * Math.PI * 26}`} strokeDashoffset={`${2 * Math.PI * 26 * (1 - avgProgress / 100)}`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[14px] text-gray-800">{avgProgress}%</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-600 mb-2">Goal Progress Distribution</p>
                <div className="flex items-center gap-1 h-4">
                  {goals.map(g => {
                    const sc = getStatusCfg(g.status);
                    const widthPct = 100 / goals.length;
                    return (
                      <div key={g.id} className="h-full rounded-sm transition-all hover:opacity-80 cursor-pointer relative group/bar"
                        style={{ width: `${widthPct}%`, backgroundColor: sc.color, opacity: 0.7 + (g.progress / 300) }}
                        title={`${g.title}: ${g.progress}%`}>
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/bar:opacity-100 pointer-events-none z-10">
                          {g.title.length > 20 ? g.title.slice(0, 20) + "..." : g.title}: {g.progress}%
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  {statusOptions.filter(s => goals.some(g => g.status === s.value)).map(s => (
                    <span key={s.value} className="flex items-center gap-1 text-[8px] text-gray-400"><div className="w-2 h-2 rounded-sm" style={{ backgroundColor: s.color }} />{s.label}</span>
                  ))}
                </div>
              </div>
            </div>
            {/* Per-goal sparkline rows */}
            <div className="space-y-1.5 border-t border-gray-100 pt-3">
              {goals.map(g => {
                const sc = getStatusCfg(g.status);
                const history = [
                  Math.max(0, g.progress - 35 + Math.floor(Math.random() * 10)),
                  Math.max(0, g.progress - 25 + Math.floor(Math.random() * 8)),
                  Math.max(0, g.progress - 18 + Math.floor(Math.random() * 6)),
                  Math.max(0, g.progress - 10 + Math.floor(Math.random() * 5)),
                  Math.max(0, g.progress - 5 + Math.floor(Math.random() * 3)),
                  g.progress,
                ];
                const maxH = Math.max(...history, 1);
                const sparkW = 80;
                const sparkH = 18;
                const points = history.map((v, i) => `${(i / (history.length - 1)) * sparkW},${sparkH - (v / maxH) * sparkH}`).join(" ");
                const owner = teamMembers.find(m => m.id === g.ownerId);
                return (
                  <div key={g.id} className="flex items-center gap-3 py-1.5 px-2 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
                    onClick={() => { setDetailGoalId(g.id); setDetailTab("checkins"); }}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                    <span className="text-[11px] text-gray-700 w-36 truncate">{g.title}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${g.progress}%`, backgroundColor: g.color }} />
                    </div>
                    <span className="text-[10px] w-8 text-right" style={{ color: g.color }}>{g.progress}%</span>
                    <svg width={sparkW} height={sparkH} className="shrink-0">
                      <polyline fill="none" stroke={sc.color} strokeWidth="1.5" points={points} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
                    {owner && <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] text-white shrink-0" style={{ backgroundColor: owner.color }}>{owner.name.charAt(0)}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Toolbar: search, filter, view toggle */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm goals..."
                className="w-full pl-9 pr-3 py-2 text-[11px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 text-gray-700 transition-all" />
            </div>
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-0.5">
              {[{ v: "all", l: "Tất cả" }, ...statusOptions.map(s => ({ v: s.value, l: s.label }))].map(f => (
                <button key={f.v} onClick={() => setFilterStatus(f.v)}
                  className={`px-2.5 py-1.5 text-[10px] rounded-lg transition-all ${filterStatus === f.v ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>{f.l}</button>
              ))}
            </div>
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => setViewType("list")} className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${viewType === "list" ? "bg-white shadow-sm text-gray-700" : "text-gray-400"}`}><List className="w-3.5 h-3.5" /></button>
              <button onClick={() => setViewType("timeline")} className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${viewType === "timeline" ? "bg-white shadow-sm text-gray-700" : "text-gray-400"}`}><Calendar className="w-3.5 h-3.5" /></button>
              <button onClick={() => setViewType("alignment")} className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${viewType === "alignment" ? "bg-white shadow-sm text-gray-700" : "text-gray-400"}`}><GitBranch className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {/* ===== ALIGNMENT VIEW ===== */}
          {viewType === "alignment" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-[13px] text-gray-800 mb-4 flex items-center gap-2"><GitBranch className="w-4 h-4 text-cyan-500" /> Goal Alignment</h3>
              <div className="space-y-4">
                {goals.map(goal => {
                  const sc = getStatusCfg(goal.status);
                  const owner = teamMembers.find(m => m.id === goal.ownerId);
                  return (
                    <div key={goal.id} className="flex items-center gap-4 group">
                      <div className="w-3 h-3 rounded-full border-2 shrink-0" style={{ borderColor: goal.color, backgroundColor: goal.progress >= 100 ? goal.color : "white" }} />
                      <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer" onClick={() => { setDetailGoalId(goal.id); setDetailTab("checkins"); }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${goal.color}15` }}>
                          <Target className="w-4 h-4" style={{ color: goal.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-gray-800 truncate">{goal.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${goal.progress}%`, backgroundColor: goal.color }} />
                            </div>
                            <span className="text-[9px]" style={{ color: goal.color }}>{goal.progress}%</span>
                          </div>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
                        {owner && <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ backgroundColor: owner.color }}>{owner.name.charAt(0)}</div>}
                      </div>
                      {/* KRs as sub-items */}
                      {goal.keyResults.length > 0 && (
                        <div className="hidden group-hover:flex items-center gap-1 text-[9px] text-gray-400 shrink-0">
                          {goal.keyResults.length} KRs
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== TIMELINE VIEW ===== */}
          {viewType === "timeline" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-[13px] text-gray-800 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-cyan-500" /> Goal Timeline</h3>
              <div className="relative">
                {/* Timeline months */}
                <div className="flex items-center gap-0 mb-3 border-b border-gray-100 pb-2">
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                    <div key={m} className={`flex-1 text-center text-[9px] ${i === 2 ? "text-cyan-600 font-medium" : "text-gray-400"}`}>{m}</div>
                  ))}
                </div>
                {/* Goal bars */}
                <div className="space-y-2.5">
                  {goals.map(goal => {
                    const dueMonth = new Date(goal.dueDate).getMonth();
                    const startMonth = Math.max(0, dueMonth - 3);
                    const barLeft = `${(startMonth / 12) * 100}%`;
                    const barWidth = `${((dueMonth - startMonth + 1) / 12) * 100}%`;
                    const milestones = goal.keyResults.map((kr, i) => {
                      const mMonth = startMonth + Math.round(((i + 1) / (goal.keyResults.length + 1)) * (dueMonth - startMonth));
                      const pct = Math.min(100, Math.round((kr.current / kr.target) * 100));
                      return { kr, month: mMonth, pct };
                    });
                    return (
                      <div key={goal.id} className="relative h-10 cursor-pointer" onClick={() => { setDetailGoalId(goal.id); setDetailTab("checkins"); }}>
                        <div className="absolute h-7 rounded-lg flex items-center px-3 gap-2 text-[10px] text-white truncate hover:shadow-md transition-all top-0"
                          style={{ left: barLeft, width: barWidth, backgroundColor: goal.color, opacity: goal.status === "completed" ? 0.6 : 1 }}>
                          <span className="truncate">{goal.title}</span>
                          <span className="ml-auto shrink-0 bg-white/20 px-1.5 rounded text-[8px]">{goal.progress}%</span>
                        </div>
                        {milestones.map((ms, i) => (
                          <div key={i} className="absolute top-6 group/ms" style={{ left: `${(ms.month / 12) * 100}%` }}>
                            <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${ms.pct >= 100 ? "bg-emerald-500" : "bg-white"}`}
                              style={ms.pct >= 100 ? {} : { borderColor: goal.color }} />
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[7px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/ms:opacity-100 pointer-events-none z-10">
                              {ms.kr.title.length > 25 ? ms.kr.title.slice(0, 25) + "..." : ms.kr.title}: {ms.pct}%
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
                {/* Milestone legend */}
                <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-100">
                  <span className="flex items-center gap-1 text-[8px] text-gray-400"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> KR completed</span>
                  <span className="flex items-center gap-1 text-[8px] text-gray-400"><div className="w-2.5 h-2.5 rounded-full border-2 border-gray-300 bg-white" /> KR in progress</span>
                  <span className="flex items-center gap-1 text-[8px] text-gray-400"><div className="w-0.5 h-3 border-l-2 border-dashed border-cyan-400" /> Today</span>
                </div>
                {/* Today marker */}
                <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-cyan-400" style={{ left: `${((2 + 17 / 31) / 12) * 100}%` }}>
                  <div className="absolute -top-1 -left-2 w-4 h-4 rounded-full bg-cyan-500 border-2 border-white shadow-sm" />
                </div>
              </div>
            </div>
          )}

          {/* ===== LIST VIEW ===== */}
          {viewType === "list" && (
            <div className="space-y-3">
              {filtered.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <Target className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-[13px] text-gray-500">Không tìm thấy goal nào</p>
                  <p className="text-[11px] text-gray-400 mt-1">Tạo goal mới hoặc thay đổi bộ lọc</p>
                </div>
              )}
              {filtered.map(goal => {
                const owner = teamMembers.find(m => m.id === goal.ownerId);
                const sc = getStatusCfg(goal.status);
                const isOpen = expanded[goal.id];
                const lastCheckIn = checkIns.filter(c => c.goalId === goal.id).sort((a, b) => b.date.localeCompare(a.date))[0];

                return (
                  <div key={goal.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
                    <div className="p-5 cursor-pointer" onClick={() => setExpanded(p => ({ ...p, [goal.id]: !p[goal.id] }))}>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${goal.color}15` }}>
                          <Target className="w-5 h-5" style={{ color: goal.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-[13px] text-gray-800">{goal.title}</h3>
                            <div onClick={e => { e.stopPropagation(); }} className="relative group/st">
                              <span className="text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer" style={{ backgroundColor: sc.bg, color: sc.color }}>
                                {statusIcon(goal.status)} {sc.label}
                              </span>
                              <div className="absolute top-full left-0 mt-1 z-20 hidden group-hover/st:block">
                                <div className="bg-white rounded-xl border border-gray-200 shadow-xl py-1 min-w-[130px]">
                                  {statusOptions.map(opt => (
                                    <button key={opt.value} onClick={e => { e.stopPropagation(); handleStatusChange(goal.id, opt.value); }}
                                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${goal.status === opt.value ? "bg-gray-50" : ""}`} style={{ color: opt.color }}>
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} /> {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            {/* Confidence badge */}
                            {lastCheckIn && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 flex items-center gap-0.5" style={{ color: confidenceLabels[lastCheckIn.confidence].color }}>
                                {confidenceLabels[lastCheckIn.confidence].emoji} {lastCheckIn.confidence}/5
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 mb-3">{goal.description}</p>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${goal.progress}%`, backgroundColor: goal.color }} />
                              </div>
                            </div>
                            <span className="text-[12px] shrink-0" style={{ color: goal.color }}>{goal.progress}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {owner && <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] text-white" style={{ backgroundColor: owner.color }}>{owner.name.charAt(0)}</div>}
                          <div className="flex items-center gap-1 text-[10px] text-gray-400"><Clock className="w-3 h-3" />{new Date(goal.dueDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "short" })}</div>
                          {/* Check-in button */}
                          <button onClick={e => { e.stopPropagation(); setShowCheckInModal(goal.id); setCheckInForm({ note: "", confidence: 4, progress: goal.progress }); }}
                            className="text-[9px] text-cyan-600 px-2 py-1 rounded-lg hover:bg-cyan-50 border border-cyan-200 flex items-center gap-1 transition-all">
                            <RefreshCw className="w-3 h-3" /> Check-in
                          </button>
                          {/* Detail button */}
                          <button onClick={e => { e.stopPropagation(); setDetailGoalId(detailGoalId === goal.id ? null : goal.id); setDetailTab("checkins"); }}
                            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all">
                            <BarChart3 className="w-3.5 h-3.5" />
                          </button>
                          {/* Context menu */}
                          <div className="relative">
                            <button onClick={e => { e.stopPropagation(); setCtxMenu(ctxMenu === goal.id ? null : goal.id); }}
                              className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all">
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                            {ctxMenu === goal.id && (
                              <div className="absolute right-0 top-full mt-1 w-[180px] bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1" onClick={e => e.stopPropagation()}>
                                <button onClick={() => { const g = goals.find(x => x.id === goal.id); if (g) { setEditingGoal(g); setEditForm({ title: g.title, description: g.description, color: g.color, ownerId: g.ownerId, dueDate: g.dueDate, status: g.status }); } setCtxMenu(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50"><Edit3 className="w-3.5 h-3.5 text-gray-400" /> Chỉnh sửa</button>
                                <button onClick={() => { duplicateGoal(goal.id); setCtxMenu(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50"><Copy className="w-3.5 h-3.5 text-gray-400" /> Nhân bản</button>
                                <button onClick={() => { setShowCheckInModal(goal.id); setCheckInForm({ note: "", confidence: 4, progress: goal.progress }); setCtxMenu(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50"><RefreshCw className="w-3.5 h-3.5 text-gray-400" /> Check-in</button>
                                <div className="h-px bg-gray-100 my-1" />
                                <button onClick={() => { setDeleteConfirm(goal.id); setCtxMenu(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /> Xoá</button>
                              </div>
                            )}
                          </div>
                          {isOpen ? <ChevronDown className="w-4 h-4 text-gray-300" /> : <ChevronRight className="w-4 h-4 text-gray-300" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded: Key Results */}
                    {isOpen && (
                      <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/30">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Key Results ({goal.keyResults.length})</p>
                          <button onClick={() => { setAddingKR(goal.id); setKrForm({ title: "", target: "", unit: "" }); }}
                            className="text-[10px] text-cyan-600 hover:text-cyan-700 flex items-center gap-1"><Plus className="w-3 h-3" /> Thêm KR</button>
                        </div>
                        <div className="space-y-2.5">
                          {goal.keyResults.map(kr => {
                            const krPct = Math.min(100, Math.round((kr.current / kr.target) * 100));
                            return (
                              <div key={kr.id} className="bg-white rounded-xl p-3.5 border border-gray-100 group/kr">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[12px] text-gray-700 flex-1">{kr.title}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-gray-500">{kr.current} / {kr.target} {kr.unit}</span>
                                    <button onClick={() => { setEditingKR({ goalId: goal.id, kr }); setEditKRForm({ title: kr.title, current: String(kr.current), target: String(kr.target), unit: kr.unit }); }}
                                      className="opacity-0 group-hover/kr:opacity-100 p-0.5 hover:bg-gray-100 rounded text-gray-400"><Edit3 className="w-3 h-3" /></button>
                                    <button onClick={() => handleDeleteKR(goal.id, kr.id)}
                                      className="opacity-0 group-hover/kr:opacity-100 p-0.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 relative">
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full transition-all" style={{ width: `${krPct}%`, backgroundColor: goal.color }} />
                                    </div>
                                    <input type="range" min="0" max={kr.target} value={kr.current} step={kr.target > 100 ? 10 : 1}
                                      onChange={e => handleKRProgressChange(goal.id, kr.id, parseFloat(e.target.value))}
                                      className="absolute inset-0 w-full opacity-0 cursor-pointer" style={{ height: "12px", marginTop: "-3px" }} />
                                  </div>
                                  <span className="text-[9px] w-8 text-right" style={{ color: goal.color }}>{krPct}%</span>
                                </div>
                              </div>
                            );
                          })}

                          {addingKR === goal.id && (
                            <div className="bg-white rounded-xl p-3.5 border-2 border-cyan-200">
                              <div className="space-y-2">
                                <input value={krForm.title} onChange={e => setKrForm(p => ({ ...p, title: e.target.value }))} placeholder="Key result title..."
                                  className="w-full text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-400" autoFocus />
                                <div className="flex items-center gap-2">
                                  <input value={krForm.target} onChange={e => setKrForm(p => ({ ...p, target: e.target.value }))} placeholder="Target" type="number"
                                    className="flex-1 text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-400" />
                                  <input value={krForm.unit} onChange={e => setKrForm(p => ({ ...p, unit: e.target.value }))} placeholder="Unit"
                                    className="w-24 text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-400" />
                                  <button onClick={() => handleAddKR(goal.id)} className="text-[11px] bg-cyan-500 text-white px-3 py-1.5 rounded-lg hover:bg-cyan-600">Thêm</button>
                                  <button onClick={() => setAddingKR(null)} className="text-[11px] text-gray-400 px-2 py-1.5 hover:text-gray-600">Hủy</button>
                                </div>
                              </div>
                            </div>
                          )}

                          {goal.keyResults.length === 0 && addingKR !== goal.id && (
                            <div className="text-center py-4 bg-white rounded-xl border border-dashed border-gray-200">
                              <p className="text-[11px] text-gray-400 mb-1">Chưa có key results</p>
                              <button onClick={() => { setAddingKR(goal.id); setKrForm({ title: "", target: "", unit: "" }); }}
                                className="text-[10px] text-cyan-600">+ Thêm key result đầu tiên</button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== DETAIL PANEL (Check-ins, Activity, Alignment) ===== */}
      {detailGoal && (
        <div className="w-[320px] border-l border-gray-100 flex flex-col bg-gray-50/30 shrink-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${detailGoal.color}15` }}>
                <Target className="w-3.5 h-3.5" style={{ color: detailGoal.color }} />
              </div>
              <span className="text-[12px] text-gray-700 truncate max-w-[180px]">{detailGoal.title}</span>
            </div>
            <button onClick={() => setDetailGoalId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0.5 px-4 py-2 border-b border-gray-100">
            {([
              ["checkins", "Check-ins", <RefreshCw key="ci" className="w-3 h-3" />],
              ["activity", "Activity", <History key="ac" className="w-3 h-3" />],
            ] as [typeof detailTab, string, React.ReactNode][]).map(([key, label, icon]) => (
              <button key={key} onClick={() => setDetailTab(key)}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] rounded-lg transition-all ${detailTab === key ? "bg-white shadow-sm text-gray-800 border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}>
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {detailTab === "checkins" && (
              <>
                <button onClick={() => { setShowCheckInModal(detailGoal.id); setCheckInForm({ note: "", confidence: 4, progress: detailGoal.progress }); }}
                  className="w-full flex items-center justify-center gap-1.5 text-[11px] text-cyan-600 py-2.5 rounded-xl border border-dashed border-cyan-300 hover:bg-cyan-50 transition-all">
                  <Plus className="w-3.5 h-3.5" /> New Check-in
                </button>
                {goalCheckIns.length === 0 && <p className="text-[11px] text-gray-400 text-center py-6">Chưa có check-in nào</p>}
                {goalCheckIns.map(ci => (
                  <div key={ci.id} className="bg-white rounded-xl p-3.5 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] text-white" style={{ backgroundColor: ci.authorColor }}>{ci.authorInitial}</div>
                        <span className="text-[10px] text-gray-500">{ci.author}</span>
                      </div>
                      <span className="text-[9px] text-gray-400">{ci.date}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-[1.5] mb-2">{ci.note}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] flex items-center gap-1" style={{ color: confidenceLabels[ci.confidence].color }}>
                        {confidenceLabels[ci.confidence].emoji} Confidence: {ci.confidence}/5
                      </span>
                      <span className="text-[9px] text-gray-400">Progress: {ci.progress}%</span>
                    </div>
                  </div>
                ))}
              </>
            )}
            {detailTab === "activity" && (
              <>
                {goalActivities.length === 0 && <p className="text-[11px] text-gray-400 text-center py-6">Chưa có hoạt động nào</p>}
                {goalActivities.map(act => (
                  <div key={act.id} className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] text-white shrink-0 mt-0.5" style={{ backgroundColor: act.authorColor }}>{act.authorInitial}</div>
                    <div>
                      <p className="text-[11px] text-gray-600">{act.text}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{act.time}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== MODALS ===== */}

      {/* Create Goal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-[15px] text-gray-800 tracking-tight">New Goal</h3><button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button></div>
            <div className="space-y-3">
              <div><label className="text-[10px] text-gray-500 mb-1 block">Title *</label><input value={createForm.title} onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" autoFocus placeholder="Goal title..." /></div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Description</label><textarea value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 resize-none" rows={2} placeholder="Goal description..." /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] text-gray-500 mb-1 block">Owner</label>
                  <select value={createForm.ownerId} onChange={e => setCreateForm(p => ({ ...p, ownerId: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 bg-white">
                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select></div>
                <div><label className="text-[10px] text-gray-500 mb-1 block">Due Date</label><input type="date" value={createForm.dueDate} onChange={e => setCreateForm(p => ({ ...p, dueDate: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" /></div>
              </div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Parent Goal (optional)</label>
                <select value={createForm.parentId} onChange={e => setCreateForm(p => ({ ...p, parentId: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 bg-white">
                  <option value="">— Không có —</option>
                  {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                </select>
              </div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Status</label>
                <div className="flex gap-1.5">{statusOptions.map(s => (
                  <button key={s.value} onClick={() => setCreateForm(p => ({ ...p, status: s.value }))}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] rounded-lg border transition-all ${createForm.status === s.value ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-gray-200 text-gray-500"}`}>{s.label}</button>
                ))}</div></div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Color</label>
                <div className="flex gap-1.5">{goalColors.map(c => (
                  <button key={c} onClick={() => setCreateForm(p => ({ ...p, color: c }))} className={`w-6 h-6 rounded-full border-2 transition-all ${createForm.color === c ? "border-gray-800 scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                ))}</div></div>
            </div>
            <div className="flex justify-end gap-2 mt-5"><button onClick={() => setShowCreateModal(false)} className="text-[12px] text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Cancel</button><button onClick={handleCreate} className="text-[12px] bg-cyan-500 text-white px-4 py-1.5 rounded-lg hover:bg-cyan-600">Create Goal</button></div>
          </div>
        </div>
      )}

      {/* Edit Goal */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setEditingGoal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-[14px] text-gray-800">Edit Goal</h3><button onClick={() => setEditingGoal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button></div>
            <div className="space-y-3">
              <div><label className="text-[10px] text-gray-500 mb-1 block">Title</label><input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" /></div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Description</label><textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 resize-none" rows={2} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] text-gray-500 mb-1 block">Owner</label>
                  <select value={editForm.ownerId} onChange={e => setEditForm(p => ({ ...p, ownerId: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 bg-white">
                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select></div>
                <div><label className="text-[10px] text-gray-500 mb-1 block">Due Date</label><input type="date" value={editForm.dueDate} onChange={e => setEditForm(p => ({ ...p, dueDate: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" /></div>
              </div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Status</label>
                <div className="flex gap-1.5">{statusOptions.map(s => (
                  <button key={s.value} onClick={() => setEditForm(p => ({ ...p, status: s.value }))}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] rounded-lg border transition-all ${editForm.status === s.value ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-gray-200 text-gray-500"}`}>{s.label}</button>
                ))}</div></div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Color</label>
                <div className="flex gap-1.5">{goalColors.map(c => (
                  <button key={c} onClick={() => setEditForm(p => ({ ...p, color: c }))} className={`w-6 h-6 rounded-full border-2 transition-all ${editForm.color === c ? "border-gray-800 scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                ))}</div></div>
            </div>
            <div className="flex justify-end gap-2 mt-5"><button onClick={() => setEditingGoal(null)} className="text-[12px] text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Cancel</button><button onClick={handleSaveEdit} className="text-[12px] bg-cyan-500 text-white px-4 py-1.5 rounded-lg hover:bg-cyan-600">Save</button></div>
          </div>
        </div>
      )}

      {/* Edit KR */}
      {editingKR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setEditingKR(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-[14px] text-gray-800">Edit Key Result</h3><button onClick={() => setEditingKR(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button></div>
            <div className="space-y-3">
              <div><label className="text-[10px] text-gray-500 mb-1 block">Title</label><input value={editKRForm.title} onChange={e => setEditKRForm(p => ({ ...p, title: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-[10px] text-gray-500 mb-1 block">Current</label><input value={editKRForm.current} onChange={e => setEditKRForm(p => ({ ...p, current: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" type="number" /></div>
                <div><label className="text-[10px] text-gray-500 mb-1 block">Target</label><input value={editKRForm.target} onChange={e => setEditKRForm(p => ({ ...p, target: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" type="number" /></div>
                <div><label className="text-[10px] text-gray-500 mb-1 block">Unit</label><input value={editKRForm.unit} onChange={e => setEditKRForm(p => ({ ...p, unit: e.target.value }))} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" /></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5"><button onClick={() => setEditingKR(null)} className="text-[12px] text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Cancel</button><button onClick={handleSaveEditKR} className="text-[12px] bg-cyan-500 text-white px-4 py-1.5 rounded-lg hover:bg-cyan-600">Save</button></div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-500" /></div><div><h3 className="text-[14px] text-gray-800">Xoá Goal?</h3><p className="text-[11px] text-gray-500 mt-0.5">Tất cả key results sẽ bị xoá theo.</p></div></div>
            <div className="flex justify-end gap-2 mt-5"><button onClick={() => setDeleteConfirm(null)} className="text-[12px] text-gray-600 px-4 py-2 rounded-xl hover:bg-gray-100">Cancel</button><button onClick={() => handleDelete(deleteConfirm)} className="text-[12px] text-white bg-red-500 hover:bg-red-600 px-5 py-2 rounded-xl shadow-sm">Delete</button></div>
          </div>
        </div>
      )}

      {/* Check-in Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowCheckInModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] text-gray-800">Weekly Check-in</h3>
              <button onClick={() => setShowCheckInModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-500 mb-1.5 block">Tiến độ hiện tại</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="100" value={checkInForm.progress} onChange={e => setCheckInForm(p => ({ ...p, progress: parseInt(e.target.value) }))}
                    className="flex-1 accent-cyan-500" />
                  <span className="text-[14px] text-cyan-700 w-12 text-right">{checkInForm.progress}%</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1.5 block">Confidence Level</label>
                <div className="flex items-center gap-2">
                  {([1, 2, 3, 4, 5] as ConfidenceLevel[]).map(level => (
                    <button key={level} onClick={() => setCheckInForm(p => ({ ...p, confidence: level }))}
                      className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all ${checkInForm.confidence === level ? "border-cyan-300 bg-cyan-50 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}>
                      <span className="text-lg">{confidenceLabels[level].emoji}</span>
                      <span className="text-[8px] text-gray-500">{level}/5</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1.5 block">Ghi chú check-in</label>
                <textarea value={checkInForm.note} onChange={e => setCheckInForm(p => ({ ...p, note: e.target.value }))}
                  placeholder="Tình hình tuần này? Blocker nào không? Cần hỗ trợ gì?"
                  className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-400 resize-none" rows={4} autoFocus />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowCheckInModal(null)} className="text-[12px] text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Cancel</button>
              <button onClick={submitCheckIn} disabled={!checkInForm.note.trim()} className="text-[12px] bg-cyan-500 text-white px-4 py-1.5 rounded-lg hover:bg-cyan-600 disabled:opacity-40">Submit Check-in</button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowTemplateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div><h3 className="text-[15px] text-gray-800">Goal Templates</h3><p className="text-[11px] text-gray-400 mt-0.5">Chọn template để bắt đầu nhanh hơn</p></div>
              <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {goalTemplates.map(tpl => (
                <button key={tpl.id} onClick={() => createFromTemplate(tpl.id)}
                  className="flex items-center gap-3.5 p-4 bg-gray-50 hover:bg-white rounded-xl border border-gray-200 hover:border-cyan-300 hover:shadow-md transition-all text-left group">
                  <span className="text-2xl">{tpl.icon}</span>
                  <div className="flex-1">
                    <p className="text-[12px] text-gray-800 group-hover:text-cyan-700 transition-all">{tpl.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{tpl.desc}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {tpl.krs.map((kr, i) => (
                        <span key={i} className="text-[8px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{kr.title.length > 25 ? kr.title.slice(0, 25) + "..." : kr.title}</span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-cyan-500 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
