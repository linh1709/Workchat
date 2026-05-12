import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Area, AreaChart, Cell, RadialBarChart, RadialBar, Legend } from "recharts";
import { type Task, statusConfig, priorityConfig, projects, teamMembers, goals, sprints } from "./data";
import { ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, AlertTriangle, TrendingUp, Calendar, Sparkles, Target, Zap, Users, Activity, ChevronRight, Flag, ListTodo, BarChart3, Plus, MessageSquare, Inbox, FileText, Lightbulb, ArrowRight, Bell, Star, Search, Eye, GitBranch, Timer, Coffee } from "lucide-react";

interface DashboardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

type TimeRange = "today" | "week" | "month" | "quarter";

const tooltipStyle = {
  fontSize: 11, borderRadius: 12, border: "1px solid #e2e8f0",
  backgroundColor: "#ffffff", color: "#475569", boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
};

// Mock activity feed
const activityFeed = [
  { id: "a1", user: "Trần Văn Minh", action: "completed", target: "API Rate Limiting", time: "10 phút trước", icon: "check", color: "#059669" },
  { id: "a2", user: "Lê Thị Hương", action: "uploaded design", target: "Homepage Mockup v2", time: "25 phút trước", icon: "upload", color: "#7c3aed" },
  { id: "a3", user: "Nguyễn Hoàng Đức", action: "commented on", target: "Sprint 12 Planning", time: "1 giờ trước", icon: "comment", color: "#0891b2" },
  { id: "a4", user: "Phạm Thị Mai", action: "moved to In Review", target: "Unit Tests Auth", time: "2 giờ trước", icon: "move", color: "#d97706" },
  { id: "a5", user: "Vũ Đức Anh", action: "created task", target: "Fix Search Bug", time: "3 giờ trước", icon: "create", color: "#6b7280" },
  { id: "a6", user: "Trần Văn Minh", action: "updated priority", target: "DB Migration Script", time: "4 giờ trước", icon: "flag", color: "#dc2626" },
];

export function Dashboard({ tasks, onTaskClick }: DashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [showAllGoals, setShowAllGoals] = useState(false);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === "done").length;
  const inProgressTasks = tasks.filter(t => t.status === "in_progress").length;
  const todoTasks = tasks.filter(t => t.status === "todo").length;
  const reviewTasks = tasks.filter(t => t.status === "in_review").length;
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const totalEstimated = tasks.reduce((a, t) => a + (t.timeEstimate || 0), 0) / 60;
  const totalSpent = tasks.reduce((a, t) => a + (t.timeSpent || 0), 0) / 60;

  const statusData = Object.entries(statusConfig).map(([key, val]) => ({
    name: val.label, value: tasks.filter(t => t.status === key).length, color: val.color,
  }));

  const priorityData = Object.entries(priorityConfig).map(([key, val]) => ({
    name: val.label, value: tasks.filter(t => t.priority === key).length, color: val.color,
  }));

  const projectData = projects.map(p => ({
    name: p.name.length > 12 ? p.name.substring(0, 12) + "..." : p.name,
    tasks: tasks.filter(t => t.projectId === p.id).length,
    done: tasks.filter(t => t.projectId === p.id && t.status === "done").length,
  })).filter(p => p.tasks > 0);

  const weeklyData = [
    { day: "T2", completed: 3, created: 5 },
    { day: "T3", completed: 5, created: 3 },
    { day: "T4", completed: 2, created: 4 },
    { day: "T5", completed: 7, created: 2 },
    { day: "T6", completed: 4, created: 6 },
    { day: "T7", completed: 1, created: 1 },
    { day: "CN", completed: 0, created: 2 },
  ];

  // Velocity/burnup data
  const velocityData = [
    { name: "S8", planned: 38, completed: 35 },
    { name: "S9", planned: 40, completed: 32 },
    { name: "S10", planned: 35, completed: 34 },
    { name: "S11", planned: 42, completed: 38 },
    { name: "S12", planned: 42, completed: 18 },
  ];

  // Team performance
  const teamPerf = useMemo(() => teamMembers.map(m => {
    const mt = tasks.filter(t => t.assignee?.id === m.id);
    const md = mt.filter(t => t.status === "done").length;
    const active = mt.filter(t => t.status !== "done").length;
    return { ...m, total: mt.length, done: md, active, rate: mt.length > 0 ? Math.round((md / mt.length) * 100) : 0 };
  }).sort((a, b) => b.rate - a.rate), [tasks]);

  const recentTasks = [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const upcomingTasks = [...tasks].filter(t => t.dueDate && t.status !== "done").sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()).slice(0, 5);

  const activeSprint = sprints.find(s => s.status === "active");
  const activeSprintTasks = activeSprint ? tasks.filter(t => activeSprint.taskIds.includes(t.id)) : [];
  const sprintDone = activeSprintTasks.filter(t => t.status === "done").length;
  const sprintPct = activeSprintTasks.length > 0 ? Math.round((sprintDone / activeSprintTasks.length) * 100) : 0;

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
      {/* Hidden SVG for gradient definitions */}
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="dashGradCyan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0891b2" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="dashGradViolet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="dashGradEmerald" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#059669" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#059669" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>

      {/* Welcome + Time Range */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-gray-900 tracking-tight">Welcome back, Minh</h1>
            <p className="text-[12px] text-gray-400">Tổng quan dự án · Thứ Ba, 17/03/2026</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-0.5">
            {([["today", "Hôm nay"], ["week", "Tuần"], ["month", "Tháng"], ["quarter", "Quý"]] as [TimeRange, string][]).map(([v, l]) => (
              <button key={v} onClick={() => setTimeRange(v)} className={`px-3 py-1.5 text-[10px] rounded-lg transition-all ${timeRange === v ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-0.5">
        {[
          { icon: <Plus className="w-3.5 h-3.5" />, label: "New Task", color: "#0891b2", bg: "#ecfeff" },
          { icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Open Chat", color: "#7c3aed", bg: "#f3e8ff" },
          { icon: <Search className="w-3.5 h-3.5" />, label: "Search ⌘K", color: "#6b7280", bg: "#f9fafb" },
          { icon: <Inbox className="w-3.5 h-3.5" />, label: "Inbox", color: "#d97706", bg: "#fefce8" },
          { icon: <GitBranch className="w-3.5 h-3.5" />, label: "Sprint Board", color: "#059669", bg: "#ecfdf5" },
        ].map(a => (
          <button key={a.label} className="flex items-center gap-1.5 px-3 py-2 text-[10px] rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-all shrink-0" style={{ color: a.color }}>
            <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: a.bg }}>{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>

      {/* Workspace Health Score */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-5">
        <div className="flex items-center gap-6">
          <div className="relative w-20 h-20 shrink-0">
            {(() => {
              const healthScore = Math.round((completionRate * 0.3) + ((100 - Math.min(100, overdueTasks * 15)) * 0.25) + (Math.min(100, (inProgressTasks / Math.max(1, totalTasks)) * 200) * 0.2) + (75 * 0.25));
              const r = 32;
              const color = healthScore >= 80 ? "#059669" : healthScore >= 60 ? "#d97706" : "#dc2626";
              return (
                <>
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
                    <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
                      strokeDasharray={`${2 * Math.PI * r}`} strokeDashoffset={`${2 * Math.PI * r * (1 - healthScore / 100)}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[20px] text-gray-800">{healthScore}</span>
                    <span className="text-[7px] text-gray-400">/ 100</span>
                  </div>
                </>
              );
            })()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-[13px] text-gray-700">Workspace Health</h3>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Good</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Completion", value: `${completionRate}%`, color: completionRate >= 60 ? "#059669" : "#d97706", pct: completionRate },
                { label: "On-time", value: `${totalTasks > 0 ? Math.round(((totalTasks - overdueTasks) / totalTasks) * 100) : 100}%`, color: overdueTasks <= 2 ? "#059669" : "#dc2626", pct: totalTasks > 0 ? ((totalTasks - overdueTasks) / totalTasks) * 100 : 100 },
                { label: "Velocity", value: "38 pts", color: "#0891b2", pct: 76 },
                { label: "Team Load", value: "Balanced", color: "#7c3aed", pct: 68 },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-gray-500">{m.label}</span>
                    <span className="text-[9px]" style={{ color: m.color }}>{m.value}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <StatCard icon={<ListTodo className="w-4 h-4" />} color="#6b7280" bgColor="#f9fafb" label="Total Tasks" value={totalTasks} />
        <StatCard icon={<CheckCircle2 className="w-4 h-4" />} color="#059669" bgColor="#ecfdf5" label="Completed" value={doneTasks} change="+12%" positive />
        <StatCard icon={<Clock className="w-4 h-4" />} color="#0891b2" bgColor="#ecfeff" label="In Progress" value={inProgressTasks} change="+3%" positive />
        <StatCard icon={<AlertTriangle className="w-4 h-4" />} color="#dc2626" bgColor="#fef2f2" label="Overdue" value={overdueTasks} change="-5%" positive={false} />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} color="#7c3aed" bgColor="#f3e8ff" label="Completion" value={`${completionRate}%`} change="+8%" positive />
        <StatCard icon={<Clock className="w-4 h-4" />} color="#d97706" bgColor="#fefce8" label="Hours" value={`${totalSpent.toFixed(0)}h`} sub={`/ ${totalEstimated.toFixed(0)}h est.`} />
      </div>

      {/* AI Insight Banner */}
      <div className="bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-cyan-500/10 rounded-2xl border border-violet-200/50 p-4 mb-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
          <Lightbulb className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-gray-800">AI Insights</p>
          <div className="mt-1.5 space-y-1">
            <p className="text-[11px] text-gray-600 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />
              Velocity tăng <span className="text-emerald-600">12%</span> so với sprint trước. Team đang on track.
            </p>
            <p className="text-[11px] text-gray-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="text-amber-600">{overdueTasks} tasks</span> quá hạn - cần review lại priorities.
            </p>
            <p className="text-[11px] text-gray-600 flex items-center gap-1.5">
              <Users className="w-3 h-3 text-cyan-500 shrink-0" />
              {teamMembers[0].name.split(" ").slice(-2).join(" ")} có workload cao nhất ({Math.round(totalSpent / teamMembers.length)}h avg). Consider redistributing.
            </p>
          </div>
        </div>
        <button className="text-[9px] text-violet-600 bg-violet-100 px-2.5 py-1 rounded-lg hover:bg-violet-200 shrink-0">Details</button>
      </div>

      {/* Row 1: Activity chart + Status pie + Priority pie */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] text-gray-700 tracking-tight">Weekly Activity</h3>
            <div className="flex items-center gap-3 text-[9px] text-gray-400">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-500" /> Completed</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-violet-500" /> Created</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weeklyData}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis key="xaxis" dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis key="yaxis" tick={{ fontSize: 10, fill: "#cbd5e1" }} axisLine={false} tickLine={false} width={25} />
              <Tooltip key="tooltip" contentStyle={tooltipStyle} />
              <Area key="area-completed" type="monotone" dataKey="completed" stroke="#0891b2" fill="url(#dashGradCyan)" strokeWidth={2} name="Completed" />
              <Area key="area-created" type="monotone" dataKey="created" stroke="#7c3aed" fill="url(#dashGradViolet)" strokeWidth={2} name="Created" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-[13px] text-gray-700 tracking-tight mb-3">Task Status</h3>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={4} strokeWidth={0}>
                {statusData.map((entry, i) => <Cell key={`sc-${i}`} fill={entry.color} />)}
              </Pie>
              <Tooltip key="stp" contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {statusData.map(item => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[9px] text-gray-400">{item.name}</span>
                <span className="text-[9px] text-gray-700 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-[13px] text-gray-700 tracking-tight mb-3">Priority</h3>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={priorityData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={4} strokeWidth={0}>
                {priorityData.map((entry, i) => <Cell key={`pc-${i}`} fill={entry.color} />)}
              </Pie>
              <Tooltip key="ptp" contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {priorityData.map(item => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[9px] text-gray-400">{item.name}</span>
                <span className="text-[9px] text-gray-700 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Sprint + Goals + Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        {/* Active Sprint */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] text-gray-700 tracking-tight flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-cyan-500" /> Active Sprint</h3>
            {activeSprint && <span className="text-[9px] text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">{activeSprint.name}</span>}
          </div>
          {activeSprint ? (<>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="#f1f5f9" strokeWidth="5" />
                    <circle cx="28" cy="28" r="22" fill="none" stroke="#0891b2" strokeWidth="5" strokeDasharray={`${2 * Math.PI * 22}`} strokeDashoffset={`${2 * Math.PI * 22 * (1 - sprintPct / 100)}`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[12px] text-gray-800">{sprintPct}%</span>
                </div>
                <div>
                  <p className="text-[12px] text-gray-700">{sprintDone}/{activeSprintTasks.length} tasks done</p>
                  <p className="text-[10px] text-gray-400">{activeSprint.completedPoints}/{activeSprint.goalPoints} points</p>
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {Object.entries(statusConfig).map(([k, v]) => {
                const c = activeSprintTasks.filter(t => t.status === k).length;
                if (c === 0) return null;
                const pct = Math.round((c / activeSprintTasks.length) * 100);
                return (
                  <div key={k} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: v.color }} />
                    <span className="text-[10px] text-gray-500 flex-1">{v.label}</span>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: v.color }} />
                    </div>
                    <span className="text-[10px] text-gray-400 w-4 text-right">{c}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-3 text-[9px] text-gray-400">
              <span>{new Date(activeSprint.startDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} — {new Date(activeSprint.endDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</span>
              <span>{Math.max(0, Math.ceil((new Date(activeSprint.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days left</span>
            </div>
          </>) : (
            <div className="text-center py-6 text-[11px] text-gray-400">No active sprint</div>
          )}
        </div>

        {/* Goals Progress */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] text-gray-700 tracking-tight flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-violet-500" /> Goals</h3>
            <button onClick={() => setShowAllGoals(!showAllGoals)} className="text-[9px] text-gray-400 hover:text-gray-600">{showAllGoals ? "Less" : "All"} ({goals.length})</button>
          </div>
          <div className="space-y-3">
            {goals.map(g => {
              const stColor = g.status === "on_track" ? "#059669" : g.status === "at_risk" ? "#d97706" : "#dc2626";
              const stLabel = g.status === "on_track" ? "On Track" : g.status === "at_risk" ? "At Risk" : "Behind";
              return (
                <div key={g.id} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] text-gray-700 truncate flex-1">{g.title}</p>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full ml-2 shrink-0" style={{ backgroundColor: `${stColor}12`, color: stColor }}>{stLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${g.progress}%`, backgroundColor: g.color }} />
                    </div>
                    <span className="text-[9px] text-gray-400 w-7 text-right">{g.progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Velocity */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] text-gray-700 tracking-tight flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-gray-400" /> Velocity</h3>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={velocityData}>
              <CartesianGrid key="vg" strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis key="vx" dataKey="name" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis key="vy" tick={{ fontSize: 9, fill: "#cbd5e1" }} axisLine={false} tickLine={false} width={20} />
              <Tooltip key="vt" contentStyle={tooltipStyle} />
              <Bar key="vb-p" dataKey="planned" fill="#e2e8f0" radius={[3, 3, 0, 0]} name="Planned" barSize={12} />
              <Bar key="vb-c" dataKey="completed" fill="#0891b2" radius={[3, 3, 0, 0]} name="Completed" barSize={12} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 justify-center mt-1">
            <span className="flex items-center gap-1 text-[8px] text-gray-400"><div className="w-2 h-2 rounded-sm bg-gray-200" /> Planned</span>
            <span className="flex items-center gap-1 text-[8px] text-gray-400"><div className="w-2 h-2 rounded-sm bg-cyan-500" /> Done</span>
          </div>
        </div>
      </div>

      {/* Row 3: Projects + Recent + Upcoming + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        {/* Tasks by Project */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-[13px] text-gray-700 tracking-tight mb-3">By Project</h3>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={projectData} layout="vertical">
              <CartesianGrid key="bg" strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis key="bx" type="number" tick={{ fontSize: 9, fill: "#cbd5e1" }} axisLine={false} tickLine={false} />
              <YAxis key="by" type="category" dataKey="name" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} width={75} />
              <Tooltip key="bt" contentStyle={tooltipStyle} />
              <Bar key="bb-t" dataKey="tasks" fill="#0891b2" radius={[0, 4, 4, 0]} name="Total" barSize={8} opacity={0.8} />
              <Bar key="bb-d" dataKey="done" fill="#059669" radius={[0, 4, 4, 0]} name="Done" barSize={8} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Tasks */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-[13px] text-gray-700 tracking-tight mb-3">Recent Tasks</h3>
          <div className="space-y-0.5">
            {recentTasks.map(task => (
              <button key={task.id} onClick={() => onTaskClick(task)} className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-all text-left group">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: statusConfig[task.status].color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-700 truncate group-hover:text-gray-900">{task.title}</p>
                  <p className="text-[9px] text-gray-400">{task.assignee?.name || "Unassigned"}</p>
                </div>
                <span className="text-[7px]" style={{ color: priorityConfig[task.priority].color }}>{priorityConfig[task.priority].icon}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-[13px] text-gray-700 tracking-tight mb-3">Deadlines</h3>
          <div className="space-y-0.5">
            {upcomingTasks.map(task => {
              const isOverdue = new Date(task.dueDate!) < new Date();
              const daysLeft = Math.ceil((new Date(task.dueDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <button key={task.id} onClick={() => onTaskClick(task)} className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-all text-left group">
                  <Calendar className={`w-3 h-3 shrink-0 ${isOverdue ? "text-red-400" : "text-gray-300"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-700 truncate group-hover:text-gray-900">{task.title}</p>
                    <p className="text-[9px] text-gray-400">{new Date(task.dueDate!).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</p>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isOverdue ? "bg-red-50 text-red-500" : daysLeft <= 2 ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-400"}`}>
                    {isOverdue ? "Quá hạn" : daysLeft === 0 ? "Hôm nay" : `${daysLeft}d`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-[13px] text-gray-700 tracking-tight mb-3 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-gray-400" /> Activity</h3>
          <div className="space-y-0.5">
            {activityFeed.map((a, i) => (
              <div key={a.id} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-all relative">
                {i < activityFeed.length - 1 && <div className="absolute left-[14.5px] top-8 w-[1px] h-[calc(100%-8px)] bg-gray-100" />}
                <div className="w-2 h-2 rounded-full mt-1 shrink-0 relative z-10" style={{ backgroundColor: a.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-600"><span className="text-gray-800">{a.user.split(" ").pop()}</span> {a.action} <span className="text-gray-700">{a.target}</span></p>
                  <p className="text-[8px] text-gray-400 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Team Performance */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] text-gray-700 tracking-tight flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-gray-400" /> Team Performance</h3>
          <span className="text-[9px] text-gray-400">{teamMembers.length} members</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {teamPerf.map(member => (
            <div key={member.id} className="text-center p-4 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-gray-200 transition-all cursor-pointer group">
              <div className="relative mx-auto w-11 h-11 mb-2">
                <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                  <circle cx="22" cy="22" r="18" fill="none" stroke={member.color} strokeWidth="3" strokeDasharray={`${2 * Math.PI * 18}`} strokeDashoffset={`${2 * Math.PI * 18 * (1 - member.rate / 100)}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white rounded-full" style={{ backgroundColor: member.color, margin: 6 }}>
                  {member.name.charAt(0)}
                </div>
              </div>
              <p className="text-[11px] text-gray-700 truncate">{member.name.split(" ").slice(-2).join(" ")}</p>
              <p className="text-[9px] text-gray-400 mb-2">{member.role}</p>
              <div className="flex items-center justify-center gap-2 text-[9px]">
                <span className="text-gray-500">{member.total} tasks</span>
                <span className="text-emerald-600">{member.rate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 5: Project Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-[13px] text-gray-700 tracking-tight mb-4 flex items-center gap-1.5"><Flag className="w-3.5 h-3.5 text-gray-400" /> Project Health</h3>
          <div className="space-y-2.5">
            {projects.map(p => {
              const pTasks = tasks.filter(t => t.projectId === p.id);
              const pDone = pTasks.filter(t => t.status === "done").length;
              const pOverdue = pTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length;
              const pPct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;
              const health = pOverdue > 2 ? "at_risk" : pPct > 60 ? "healthy" : "needs_attention";
              const healthConfig = { healthy: { color: "#059669", bg: "#ecfdf5", label: "Healthy" }, at_risk: { color: "#dc2626", bg: "#fef2f2", label: "At Risk" }, needs_attention: { color: "#d97706", bg: "#fefce8", label: "Attention" } };
              const hc = healthConfig[health];
              return (
                <div key={p.id} className="flex items-center gap-3 py-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-[11px] text-gray-700 w-32 truncate">{p.name}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pPct}%`, backgroundColor: p.color }} />
                  </div>
                  <span className="text-[10px] text-gray-500 w-8 text-right">{pPct}%</span>
                  <span className="text-[10px] text-gray-400 w-14 text-right">{pDone}/{pTasks.length}</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: hc.bg, color: hc.color }}>{hc.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Focus */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-[13px] text-gray-700 tracking-tight mb-4 flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-400" /> Today's Focus</h3>
          <div className="space-y-2">
            {[
              { time: "09:00", task: "Sprint 12 standup", type: "meeting", color: "#7c3aed" },
              { time: "10:00", task: "Review PR #158", type: "code", color: "#0891b2" },
              { time: "14:00", task: "Chat module testing", type: "task", color: "#059669" },
              { time: "16:00", task: "Design review", type: "meeting", color: "#d97706" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-all">
                <span className="text-[10px] text-gray-400 w-10 shrink-0">{item.time}</span>
                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: item.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-700 truncate">{item.task}</p>
                  <p className="text-[9px] text-gray-400 capitalize">{item.type}</p>
                </div>
                {i === 1 && <span className="text-[8px] bg-cyan-50 text-cyan-600 px-1.5 py-0.5 rounded-full">Now</span>}
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <Timer className="w-3 h-3" />
              <span>{totalSpent.toFixed(0)}h tracked today</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <Coffee className="w-3 h-3" />
              <span>Next break: 15:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 6: Pinned Notes */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] text-gray-700 tracking-tight flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-amber-400" /> Pinned Notes</h3>
          <span className="text-[9px] text-gray-400">Quick capture</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { title: "Sprint 12 Notes", preview: "Focus: Chat module, Dashboard polish, Performance...", color: "#ecfeff", tags: ["sprint"] },
            { title: "API Design Patterns", preview: "RESTful conventions, GraphQL considerations...", color: "#f3e8ff", tags: ["api"] },
            { title: "Bug Investigation", preview: "Login redirect loop on Safari - SameSite fix", color: "#fdf2f8", tags: ["bugfix"] },
          ].map((note, i) => (
            <div key={i} className="rounded-xl p-3 border border-gray-100 hover:shadow-sm transition-all cursor-pointer group" style={{ backgroundColor: note.color }}>
              <p className="text-[11px] text-gray-800 mb-1 group-hover:text-gray-900">{note.title}</p>
              <p className="text-[10px] text-gray-500 line-clamp-2">{note.preview}</p>
              <div className="flex items-center gap-1 mt-2">
                {note.tags.map(t => <span key={t} className="text-[7px] text-gray-400 bg-white/60 px-1.5 py-0.5 rounded">#{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, color, bgColor, label, value, change, positive, sub }: {
  icon: React.ReactNode; color: string; bgColor: string;
  label: string; value: string | number; change?: string; positive?: boolean; sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-all group shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: bgColor, color: color }}>{icon}</div>
        {change && (
          <span className={`flex items-center gap-0.5 text-[10px] ${positive ? "text-emerald-600" : "text-red-500"}`}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{change}
          </span>
        )}
      </div>
      <p className="text-xl text-gray-900 tracking-tight">{value}</p>
      <div className="flex items-center gap-1">
        <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
        {sub && <p className="text-[9px] text-gray-300 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}