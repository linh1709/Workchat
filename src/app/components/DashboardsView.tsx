import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  BarChart3, Plus, X, ChevronDown, CheckCircle2, TrendingUp, Eye,
  AlertTriangle, Square, Layers, Clock, Users, Target, Calendar,
  ArrowUp, ArrowDown, ArrowRight, Zap, Activity, PieChart, LineChart,
  MoreHorizontal, Edit3, Trash2, Copy, Star, StarOff, GripVertical,
  Maximize2, Minimize2, Settings, RefreshCw, Download, Filter,
  Hash, Sparkles, Globe, Flag
} from "lucide-react";
import { type Task, teamMembers } from "./data";

interface Widget {
  id: string;
  type: "stats" | "progress" | "time" | "assignees" | "priority" | "overdue" | "recent" | "burnup" | "trend" | "velocity" | "custom";
  title: string;
  size: "sm" | "md" | "lg" | "full";
  starred: boolean;
}

interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  widgets: Widget[];
  isDefault: boolean;
}

const defaultWidgets: Widget[] = [
  { id: "w1", type: "stats", title: "Task Overview", size: "full", starred: true },
  { id: "w2", type: "progress", title: "Sprint Progress", size: "md", starred: false },
  { id: "w3", type: "time", title: "Time Overview", size: "md", starred: false },
  { id: "w4", type: "assignees", title: "By Assignee", size: "md", starred: true },
  { id: "w5", type: "priority", title: "By Priority", size: "md", starred: false },
  { id: "w6", type: "overdue", title: "Overdue Tasks", size: "md", starred: false },
  { id: "w7", type: "recent", title: "Recent Activity", size: "md", starred: false },
  { id: "w8", type: "burnup", title: "Burn-up Chart", size: "lg", starred: false },
  { id: "w9", type: "trend", title: "Weekly Trend", size: "lg", starred: false },
  { id: "w10", type: "velocity", title: "Sprint Velocity", size: "lg", starred: false },
];

const initialDashboards: DashboardConfig[] = [
  { id: "db1", name: "Main Dashboard", description: "Tổng quan dự án", icon: "📊", widgets: defaultWidgets, isDefault: true },
  { id: "db2", name: "Team Performance", description: "Hiệu suất đội nhóm", icon: "👥", widgets: [
    { id: "w_t1", type: "assignees", title: "Workload Distribution", size: "full", starred: false },
    { id: "w_t2", type: "stats", title: "Team Stats", size: "full", starred: false },
  ], isDefault: false },
  { id: "db3", name: "Sprint Tracker", description: "Theo dõi sprint", icon: "⚡", widgets: [
    { id: "w_s1", type: "progress", title: "Current Sprint", size: "lg", starred: false },
    { id: "w_s2", type: "burnup", title: "Sprint Burn-up", size: "lg", starred: false },
    { id: "w_s3", type: "overdue", title: "At Risk", size: "md", starred: false },
    { id: "w_s4", type: "recent", title: "Sprint Activity", size: "md", starred: false },
  ], isDefault: false },
];

const widgetTemplates = [
  { type: "stats", name: "Task Overview", desc: "Số liệu tổng quan tasks", icon: <Layers className="w-4 h-4" /> },
  { type: "progress", name: "Sprint Progress", desc: "Donut chart tiến độ", icon: <PieChart className="w-4 h-4" /> },
  { type: "time", name: "Time Tracking", desc: "Tracked vs Estimated", icon: <Clock className="w-4 h-4" /> },
  { type: "assignees", name: "By Assignee", desc: "Phân bổ theo thành viên", icon: <Users className="w-4 h-4" /> },
  { type: "priority", name: "By Priority", desc: "Phân bổ theo mức ưu tiên", icon: <Flag className="w-4 h-4" /> },
  { type: "overdue", name: "Overdue Tasks", desc: "Tasks quá hạn", icon: <AlertTriangle className="w-4 h-4" /> },
  { type: "recent", name: "Recent Activity", desc: "Hoạt động gần đây", icon: <Activity className="w-4 h-4" /> },
  { type: "burnup", name: "Burn-up Chart", desc: "Biểu đồ tích lũy", icon: <TrendingUp className="w-4 h-4" /> },
  { type: "trend", name: "Weekly Trend", desc: "Xu hướng theo tuần", icon: <LineChart className="w-4 h-4" /> },
  { type: "velocity", name: "Sprint Velocity", desc: "Tốc độ sprint qua các kỳ", icon: <Zap className="w-4 h-4" /> },
];

const recentActivities = [
  { id: 1, text: "Nguyễn Minh hoàn thành \"Chat module integration\"", time: "2 giờ trước", color: "#0891b2" },
  { id: 2, text: "Lê Phúc tạo PR #156 \"API rate limiting\"", time: "3 giờ trước", color: "#059669" },
  { id: 3, text: "Trần Hương cập nhật \"Design System v2\"", time: "5 giờ trước", color: "#7c3aed" },
  { id: 4, text: "Phạm Lan review \"Sprint 12 retrospective\"", time: "6 giờ trước", color: "#d97706" },
  { id: 5, text: "Hoàng Đức deploy staging environment", time: "1 ngày trước", color: "#db2777" },
  { id: 6, text: "Nguyễn Minh merge \"Inbox module\"", time: "1 ngày trước", color: "#0891b2" },
];

// Mock weekly trend data
const weeklyTrend = [
  { week: "W9", created: 12, completed: 8 },
  { week: "W10", created: 15, completed: 14 },
  { week: "W11", created: 10, completed: 11 },
  { week: "W12", created: 18, completed: 16 },
  { week: "W13", created: 14, completed: 12 },
];

// Mock burn-up data
const burnUpData = [
  { day: "1/3", total: 25, done: 5 }, { day: "3/3", total: 28, done: 9 }, { day: "5/3", total: 30, done: 13 },
  { day: "7/3", total: 32, done: 16 }, { day: "10/3", total: 35, done: 20 }, { day: "12/3", total: 36, done: 24 },
  { day: "14/3", total: 38, done: 28 }, { day: "17/3", total: 40, done: 32 },
];

export function DashboardsView({ tasks }: { tasks: Task[] }) {
  const [dashboards, setDashboards] = useState<DashboardConfig[]>(initialDashboards);
  const [activeDashId, setActiveDashId] = useState("db1");
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showCreateDash, setShowCreateDash] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [editingDashId, setEditingDashId] = useState<string | null>(null);
  const [widgetMenu, setWidgetMenu] = useState<string | null>(null);
  const [renamingWidget, setRenamingWidget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [fullscreenWidget, setFullscreenWidget] = useState<string | null>(null);

  const activeDash = dashboards.find(d => d.id === activeDashId) || dashboards[0];

  // Computed stats
  const doneCount = tasks.filter(t => t.status === "done").length;
  const inProgressCount = tasks.filter(t => t.status === "in_progress").length;
  const reviewCount = tasks.filter(t => t.status === "in_review").length;
  const todoCount = tasks.filter(t => t.status === "todo").length;
  const overdueCount = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length;
  const pct = tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0;
  const totalEstH = tasks.reduce((a, t) => a + (t.timeEstimate || 0), 0) / 60;
  const totalSpentH = tasks.reduce((a, t) => a + (t.timeSpent || 0), 0) / 60;

  const overdueTasks = useMemo(() => tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done"), [tasks]);

  const byAssignee = useMemo(() => teamMembers.map(m => {
    const mt = tasks.filter(t => t.assignee?.id === m.id);
    return { ...m, total: mt.length, done: mt.filter(t => t.status === "done").length };
  }), [tasks]);

  const byPriority = useMemo(() => {
    const priorities = [
      { key: "urgent", label: "Urgent", color: "#dc2626" },
      { key: "high", label: "High", color: "#ea580c" },
      { key: "medium", label: "Medium", color: "#d97706" },
      { key: "low", label: "Low", color: "#6b7280" },
    ];
    return priorities.map(p => ({ ...p, count: tasks.filter(t => t.priority === p.key).length, done: tasks.filter(t => t.priority === p.key && t.status === "done").length }));
  }, [tasks]);

  const stats = [
    { label: "Total", value: tasks.length, color: "#0891b2", bg: "#ecfeff", icon: <Layers className="w-4 h-4" />, delta: "+3" },
    { label: "Done", value: doneCount, color: "#059669", bg: "#ecfdf5", icon: <CheckCircle2 className="w-4 h-4" />, delta: "+5" },
    { label: "In Progress", value: inProgressCount, color: "#7c3aed", bg: "#f3e8ff", icon: <TrendingUp className="w-4 h-4" />, delta: "+2" },
    { label: "In Review", value: reviewCount, color: "#d97706", bg: "#fefce8", icon: <Eye className="w-4 h-4" />, delta: "0" },
    { label: "To Do", value: todoCount, color: "#6b7280", bg: "#f9fafb", icon: <Square className="w-4 h-4" />, delta: "-1" },
    { label: "Overdue", value: overdueCount, color: "#dc2626", bg: "#fef2f2", icon: <AlertTriangle className="w-4 h-4" />, delta: "-2" },
  ];

  // Widget handlers
  const addWidget = (type: string) => {
    const tpl = widgetTemplates.find(t => t.type === type);
    if (!tpl) return;
    const newWidget: Widget = { id: `w_${Date.now()}`, type: type as Widget["type"], title: tpl.name, size: "md", starred: false };
    setDashboards(prev => prev.map(d => d.id === activeDashId ? { ...d, widgets: [...d.widgets, newWidget] } : d));
    setShowAddWidget(false);
    toast.success(`Widget "${tpl.name}" đã được thêm`);
  };

  const removeWidget = (widgetId: string) => {
    setDashboards(prev => prev.map(d => d.id === activeDashId ? { ...d, widgets: d.widgets.filter(w => w.id !== widgetId) } : d));
    setWidgetMenu(null);
    toast.success("Widget đã bị xoá");
  };

  const toggleWidgetStar = (widgetId: string) => {
    setDashboards(prev => prev.map(d => d.id === activeDashId ? { ...d, widgets: d.widgets.map(w => w.id === widgetId ? { ...w, starred: !w.starred } : w) } : d));
    setWidgetMenu(null);
  };

  const toggleWidgetSize = (widgetId: string) => {
    const sizes: Widget["size"][] = ["sm", "md", "lg", "full"];
    setDashboards(prev => prev.map(d => d.id === activeDashId ? {
      ...d, widgets: d.widgets.map(w => {
        if (w.id !== widgetId) return w;
        const idx = sizes.indexOf(w.size);
        return { ...w, size: sizes[(idx + 1) % sizes.length] };
      })
    } : d));
    setWidgetMenu(null);
  };

  const duplicateWidget = (widgetId: string) => {
    const widget = activeDash.widgets.find(w => w.id === widgetId);
    if (!widget) return;
    const dup = { ...widget, id: `w_${Date.now()}`, title: `${widget.title} (Copy)`, starred: false };
    setDashboards(prev => prev.map(d => d.id === activeDashId ? { ...d, widgets: [...d.widgets, dup] } : d));
    setWidgetMenu(null);
    toast.success("Widget đã được nhân bản");
  };

  const createDashboard = () => {
    if (!createForm.name.trim()) return;
    const nd: DashboardConfig = { id: `db_${Date.now()}`, name: createForm.name, description: createForm.description, icon: "📈", widgets: [], isDefault: false };
    setDashboards(prev => [...prev, nd]);
    setActiveDashId(nd.id);
    setShowCreateDash(false);
    setCreateForm({ name: "", description: "" });
    toast.success(`Dashboard "${createForm.name}" đã được tạo`);
  };

  const deleteDashboard = (dashId: string) => {
    setDashboards(prev => prev.filter(d => d.id !== dashId));
    if (activeDashId === dashId) setActiveDashId(dashboards[0]?.id || "db1");
    toast.success("Dashboard đã bị xoá");
  };

  const sizeClass = (size: Widget["size"]) => {
    switch (size) {
      case "sm": return "col-span-1";
      case "md": return "col-span-1 lg:col-span-1";
      case "lg": return "col-span-1 lg:col-span-2";
      case "full": return "col-span-1 lg:col-span-2";
    }
  };

  // Render widget content
  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case "stats":
        return (
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
            {stats.map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center hover:bg-gray-100 transition-all">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1.5" style={{ backgroundColor: s.bg, color: s.color }}>{s.icon}</div>
                <p className="text-[18px] text-gray-900 tracking-tight">{s.value}</p>
                <p className="text-[9px] text-gray-400">{s.label}</p>
                <span className={`text-[8px] ${s.delta.startsWith("+") ? "text-emerald-500" : s.delta.startsWith("-") ? "text-red-500" : "text-gray-400"}`}>
                  {s.delta.startsWith("+") ? <ArrowUp className="w-2 h-2 inline" /> : s.delta.startsWith("-") ? <ArrowDown className="w-2 h-2 inline" /> : null} {s.delta} tuần này
                </span>
              </div>
            ))}
          </div>
        );

      case "progress":
        return (
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                <circle cx="40" cy="40" r="32" fill="none" stroke="#0891b2" strokeWidth="6" strokeDasharray={`${2 * Math.PI * 32}`} strokeDashoffset={`${2 * Math.PI * 32 * (1 - pct / 100)}`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[16px] text-gray-800">{Math.round(pct)}%</span>
            </div>
            <div className="flex-1 space-y-2">
              {[{ l: "Done", c: doneCount, cl: "#059669" }, { l: "In Progress", c: inProgressCount, cl: "#0891b2" }, { l: "In Review", c: reviewCount, cl: "#d97706" }, { l: "To Do", c: todoCount, cl: "#6b7280" }].map(s => (
                <div key={s.l} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.cl }} />
                  <span className="text-[10px] text-gray-500 flex-1">{s.l}</span>
                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${tasks.length > 0 ? (s.c / tasks.length) * 100 : 0}%`, backgroundColor: s.cl }} /></div>
                  <span className="text-[10px] text-gray-400 w-5 text-right">{s.c}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "time":
        return (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-cyan-50 rounded-xl p-3 text-center"><p className="text-xl text-cyan-700">{totalSpentH.toFixed(0)}h</p><p className="text-[10px] text-cyan-600">Tracked</p></div>
              <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-xl text-gray-700">{totalEstH.toFixed(0)}h</p><p className="text-[10px] text-gray-500">Estimated</p></div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500" style={{ width: `${totalEstH > 0 ? Math.min(100, (totalSpentH / totalEstH) * 100) : 0}%` }} /></div>
            <p className="text-[10px] text-gray-400 mt-1.5">{totalEstH > 0 ? Math.round((totalSpentH / totalEstH) * 100) : 0}% of estimated time used</p>
          </div>
        );

      case "assignees":
        return (
          <div className="space-y-2">
            {byAssignee.map(a => (
              <div key={a.id} className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] text-white shrink-0" style={{ backgroundColor: a.color }}>{a.name.charAt(0)}</div>
                <span className="text-[11px] text-gray-600 w-20 truncate">{a.name.split(" ").slice(-2).join(" ")}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${a.total > 0 ? (a.done / a.total) * 100 : 0}%`, backgroundColor: a.color }} /></div>
                <span className="text-[10px] text-gray-400 w-10 text-right">{a.done}/{a.total}</span>
              </div>
            ))}
          </div>
        );

      case "priority":
        return (
          <div className="space-y-2.5">
            {byPriority.map(p => (
              <div key={p.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] flex items-center gap-1.5" style={{ color: p.color }}>
                    <Flag className="w-3 h-3" /> {p.label}
                  </span>
                  <span className="text-[10px] text-gray-400">{p.done}/{p.count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${p.count > 0 ? (p.done / p.count) * 100 : 0}%`, backgroundColor: p.color }} />
                </div>
              </div>
            ))}
          </div>
        );

      case "overdue":
        return (
          <div className="space-y-1.5">
            {overdueTasks.length === 0 && <p className="text-[11px] text-gray-400 text-center py-4">Không có task quá hạn 🎉</p>}
            {overdueTasks.slice(0, 6).map(t => (
              <div key={t.id} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                <span className="text-[11px] text-red-700 truncate flex-1">{t.title}</span>
                <span className="text-[9px] text-red-500 shrink-0">{t.dueDate}</span>
              </div>
            ))}
            {overdueTasks.length > 6 && <p className="text-[9px] text-gray-400 text-center">+{overdueTasks.length - 6} more</p>}
          </div>
        );

      case "recent":
        return (
          <div className="space-y-2">
            {recentActivities.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: a.color }} />
                <div>
                  <p className="text-[11px] text-gray-600">{a.text}</p>
                  <p className="text-[9px] text-gray-400">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        );

      case "burnup":
        return (
          <div>
            <div className="relative h-[120px]">
              <svg className="w-full h-full" viewBox={`0 0 ${burnUpData.length - 1} 45`} preserveAspectRatio="none">
                {/* Total scope line */}
                <polyline fill="none" stroke="#d1d5db" strokeWidth="0.3" strokeDasharray="1.5 0.5"
                  points={burnUpData.map((d, i) => `${i},${45 - d.total}`).join(" ")} />
                {/* Done line */}
                <polyline fill="none" stroke="#0891b2" strokeWidth="0.4"
                  points={burnUpData.map((d, i) => `${i},${45 - d.done}`).join(" ")} />
                {/* Fill area */}
                <polygon fill="#0891b215"
                  points={`0,45 ${burnUpData.map((d, i) => `${i},${45 - d.done}`).join(" ")} ${burnUpData.length - 1},45`} />
              </svg>
            </div>
            <div className="flex justify-between mt-1">
              {burnUpData.map((d, i) => (
                <span key={i} className="text-[7px] text-gray-400">{d.day}</span>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2 justify-center">
              <span className="flex items-center gap-1.5 text-[9px] text-gray-400"><div className="w-3 border-t border-dashed border-gray-400" /> Scope</span>
              <span className="flex items-center gap-1.5 text-[9px] text-gray-400"><div className="w-3 border-t-2 border-cyan-500" /> Done</span>
            </div>
          </div>
        );

      case "trend":
        return (
          <div>
            <div className="flex items-end gap-3 h-[110px]">
              {weeklyTrend.map(w => {
                const maxVal = Math.max(...weeklyTrend.flatMap(d => [d.created, d.completed]));
                const cH = (w.created / maxVal) * 90;
                const dH = (w.completed / maxVal) * 90;
                return (
                  <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-end gap-1 w-full justify-center" style={{ height: 90 }}>
                      <div className="w-4 rounded-t bg-gray-200 transition-all" style={{ height: cH }} title={`Created: ${w.created}`} />
                      <div className="w-4 rounded-t bg-cyan-400 transition-all" style={{ height: dH }} title={`Completed: ${w.completed}`} />
                    </div>
                    <span className="text-[9px] text-gray-500">{w.week}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-2 justify-center">
              <span className="flex items-center gap-1.5 text-[9px] text-gray-400"><div className="w-2.5 h-2.5 rounded-sm bg-gray-200" /> Created</span>
              <span className="flex items-center gap-1.5 text-[9px] text-gray-400"><div className="w-2.5 h-2.5 rounded-sm bg-cyan-400" /> Completed</span>
            </div>
          </div>
        );

      case "velocity": {
        const velocityData = [
          { sprint: "S8", planned: 28, completed: 22, points: 34 },
          { sprint: "S9", planned: 32, completed: 28, points: 42 },
          { sprint: "S10", planned: 30, completed: 30, points: 45 },
          { sprint: "S11", planned: 35, completed: 28, points: 38 },
          { sprint: "S12", planned: 40, completed: 32, points: 48 },
        ];
        const avgVelocity = Math.round(velocityData.reduce((a, d) => a + d.completed, 0) / velocityData.length);
        const maxP = Math.max(...velocityData.map(d => Math.max(d.planned, d.completed)));
        const trend = velocityData[velocityData.length - 1].completed - velocityData[velocityData.length - 2].completed;
        return (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-violet-50 rounded-xl p-3 text-center flex-1">
                <p className="text-[18px] text-violet-700">{avgVelocity}</p>
                <p className="text-[9px] text-violet-500">Avg Velocity</p>
              </div>
              <div className="bg-cyan-50 rounded-xl p-3 text-center flex-1">
                <p className="text-[18px] text-cyan-700">{velocityData[velocityData.length - 1].completed}</p>
                <p className="text-[9px] text-cyan-500">Current Sprint</p>
              </div>
              <div className={`rounded-xl p-3 text-center flex-1 ${trend >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                <p className={`text-[18px] flex items-center justify-center gap-0.5 ${trend >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {trend >= 0 ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}{Math.abs(trend)}
                </p>
                <p className={`text-[9px] ${trend >= 0 ? "text-emerald-500" : "text-red-500"}`}>Trend</p>
              </div>
            </div>
            <div className="flex items-end gap-2 h-[90px]">
              {velocityData.map(d => {
                const pH = (d.planned / maxP) * 80;
                const cH = (d.completed / maxP) * 80;
                return (
                  <div key={d.sprint} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: 80 }}>
                      <div className="w-3 rounded-t bg-gray-200 transition-all" style={{ height: pH }} title={`Planned: ${d.planned}`} />
                      <div className="w-3 rounded-t bg-violet-400 transition-all" style={{ height: cH }} title={`Completed: ${d.completed}`} />
                    </div>
                    <span className="text-[8px] text-gray-500">{d.sprint}</span>
                  </div>
                );
              })}
            </div>
            {/* Avg velocity line indicator */}
            <div className="flex items-center gap-4 mt-2 justify-center">
              <span className="flex items-center gap-1.5 text-[9px] text-gray-400"><div className="w-2.5 h-2.5 rounded-sm bg-gray-200" /> Planned</span>
              <span className="flex items-center gap-1.5 text-[9px] text-gray-400"><div className="w-2.5 h-2.5 rounded-sm bg-violet-400" /> Completed</span>
              <span className="flex items-center gap-1.5 text-[9px] text-gray-400"><div className="w-3 border-t border-dashed border-violet-400" /> Avg: {avgVelocity}</span>
            </div>
          </div>
        );
      }

      default:
        return <p className="text-[11px] text-gray-400 text-center py-4">Custom widget</p>;
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50 p-6" onClick={() => setWidgetMenu(null)}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-gray-900 tracking-tight">Dashboards</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Tổng quan · {Math.round(pct)}% hoàn thành</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAddWidget(true)} className="flex items-center gap-1.5 text-[11px] text-gray-500 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all">
              <Plus className="w-3.5 h-3.5" /> Add Widget
            </button>
            <button onClick={() => setShowCreateDash(true)} className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-[11px] px-4 py-2 rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm shadow-cyan-500/20">
              <Plus className="w-3.5 h-3.5" /> New Dashboard
            </button>
          </div>
        </div>

        {/* Dashboard tabs */}
        <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1">
          {dashboards.map(d => (
            <button key={d.id} onClick={() => setActiveDashId(d.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-[11px] rounded-xl border transition-all shrink-0 group ${activeDashId === d.id ? "bg-white border-gray-200 shadow-sm text-gray-800" : "border-transparent text-gray-500 hover:bg-gray-100"}`}>
              <span>{d.icon}</span> {d.name}
              {!d.isDefault && activeDashId === d.id && (
                <button onClick={e => { e.stopPropagation(); deleteDashboard(d.id); }} className="ml-1 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
              )}
            </button>
          ))}
        </div>

        {/* Widgets grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeDash.widgets.map(widget => (
            <div key={widget.id} className={`bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all ${sizeClass(widget.size)} group`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {renamingWidget === widget.id ? (
                    <input value={renameValue} onChange={e => setRenameValue(e.target.value)} autoFocus
                      onBlur={() => {
                        if (renameValue.trim()) {
                          setDashboards(prev => prev.map(d => d.id === activeDashId ? { ...d, widgets: d.widgets.map(w => w.id === widget.id ? { ...w, title: renameValue.trim() } : w) } : d));
                          toast.success("Widget renamed");
                        }
                        setRenamingWidget(null);
                      }}
                      onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setRenamingWidget(null); }}
                      className="text-[13px] text-gray-800 bg-transparent border-b border-cyan-400 focus:outline-none px-0 py-0 w-40" />
                  ) : (
                    <h3 className="text-[13px] text-gray-800 tracking-tight">{widget.title}</h3>
                  )}
                  {widget.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                </div>
                <div className="relative">
                  <button onClick={e => { e.stopPropagation(); setWidgetMenu(widgetMenu === widget.id ? null : widget.id); }}
                    className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100 transition-all">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                  {widgetMenu === widget.id && (
                    <div className="absolute right-0 top-full mt-1 w-[170px] bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleWidgetStar(widget.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50">
                        {widget.starred ? <StarOff className="w-3.5 h-3.5 text-gray-400" /> : <Star className="w-3.5 h-3.5 text-gray-400" />}
                        {widget.starred ? "Bỏ star" : "Star"}
                      </button>
                      <button onClick={() => { setRenamingWidget(widget.id); setRenameValue(widget.title); setWidgetMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50">
                        <Edit3 className="w-3.5 h-3.5 text-gray-400" /> Đổi tên
                      </button>
                      <button onClick={() => { setFullscreenWidget(widget.id); setWidgetMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50">
                        <Maximize2 className="w-3.5 h-3.5 text-gray-400" /> Full screen
                      </button>
                      <button onClick={() => toggleWidgetSize(widget.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50">
                        <Settings className="w-3.5 h-3.5 text-gray-400" /> Đổi kích thước
                      </button>
                      <div className="h-px bg-gray-100 my-1" />
                      <button onClick={() => removeWidget(widget.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-500 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" /> Xoá
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {renderWidget(widget)}
            </div>
          ))}
        </div>

        {activeDash.widgets.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <BarChart3 className="w-10 h-10 text-gray-200 mx-auto mb-4" />
            <p className="text-[14px] text-gray-500">Dashboard trống</p>
            <p className="text-[11px] text-gray-400 mt-1">Thêm widget để bắt đầu theo dõi</p>
            <button onClick={() => setShowAddWidget(true)} className="mt-4 text-[11px] text-cyan-600 hover:text-cyan-700 px-3 py-1.5 rounded-lg border border-cyan-200 hover:bg-cyan-50 transition-all">
              <Plus className="w-3 h-3 inline mr-1" /> Add Widget
            </button>
          </div>
        )}
      </div>

      {/* Add Widget Modal */}
      {showAddWidget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAddWidget(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div><h3 className="text-[15px] text-gray-900">Thêm Widget</h3><p className="text-[11px] text-gray-400 mt-0.5">Chọn loại widget để thêm vào dashboard</p></div>
              <button onClick={() => setShowAddWidget(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 overflow-auto max-h-[60vh] space-y-2">
              {widgetTemplates.map(tpl => (
                <button key={tpl.type} onClick={() => addWidget(tpl.type)}
                  className="w-full flex items-center gap-3 p-3.5 bg-gray-50 hover:bg-white rounded-xl border border-gray-200 hover:border-cyan-300 hover:shadow-md transition-all text-left group">
                  <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 group-hover:text-cyan-600 group-hover:border-cyan-200 transition-all">{tpl.icon}</div>
                  <div className="flex-1">
                    <p className="text-[12px] text-gray-800 group-hover:text-cyan-700">{tpl.name}</p>
                    <p className="text-[10px] text-gray-400">{tpl.desc}</p>
                  </div>
                  <Plus className="w-4 h-4 text-gray-300 group-hover:text-cyan-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Dashboard Modal */}
      {showCreateDash && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateDash(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] text-gray-900">New Dashboard</h3>
              <button onClick={() => setShowCreateDash(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-[10px] text-gray-500 mb-1 block">Tên *</label>
                <input value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: Sprint Overview" autoFocus
                  className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" /></div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Mô tả</label>
                <input value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} placeholder="Mô tả ngắn..."
                  className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400" /></div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowCreateDash(false)} className="text-[12px] text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Cancel</button>
              <button onClick={createDashboard} disabled={!createForm.name.trim()} className="text-[12px] bg-cyan-500 text-white px-4 py-1.5 rounded-lg hover:bg-cyan-600 disabled:opacity-40">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Widget Modal */}
      {fullscreenWidget && (() => {
        const widget = activeDash.widgets.find(w => w.id === fullscreenWidget);
        if (!widget) return null;
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setFullscreenWidget(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-auto p-8" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-[18px] text-gray-900">{widget.title}</h3>
                  {widget.starred && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                  <span className="text-[9px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{widget.type}</span>
                </div>
                <button onClick={() => setFullscreenWidget(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderWidget(widget)}
            </div>
          </div>
        );
      })()}
    </div>
  );
}