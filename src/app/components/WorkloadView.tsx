import { useState, useMemo } from "react";
import { Users, AlertTriangle, CheckCircle2, Clock, TrendingUp, Search, ChevronDown, ChevronRight, Settings, ArrowUpDown, Filter, MoreHorizontal, Edit3, X, BarChart3, Zap, Calendar, Target, ArrowRight, Grid3X3, List, Layers } from "lucide-react";
import { toast } from "sonner";
import { type Task, teamMembers, statusConfig, priorityConfig } from "./data";

interface WorkloadViewProps { tasks: Task[]; onTaskClick: (task: Task) => void; }

type SortBy = "utilization_desc" | "utilization_asc" | "name" | "tasks_desc" | "active_desc";
type WorkloadStatus = "overloaded" | "optimal" | "underloaded";
type TimePeriod = "week" | "biweek" | "month";

const statusColors: Record<WorkloadStatus, { bg: string; text: string; label: string; border: string }> = {
  overloaded: { bg: "#fef2f2", text: "#dc2626", label: "Overloaded", border: "#fecaca" },
  optimal: { bg: "#ecfdf5", text: "#059669", label: "Optimal", border: "#a7f3d0" },
  underloaded: { bg: "#fefce8", text: "#d97706", label: "Available", border: "#fde68a" },
};

const periodConfig: Record<TimePeriod, { label: string; hours: number }> = {
  week: { label: "Tuần", hours: 40 },
  biweek: { label: "2 Tuần", hours: 80 },
  month: { label: "Tháng", hours: 160 },
};

type ViewTab = "overview" | "timeline" | "forecast";

export function WorkloadView({ tasks, onTaskClick }: WorkloadViewProps) {
  const [searchQ, setSearchQ] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("utilization_desc");
  const [filterWL, setFilterWL] = useState<"all" | WorkloadStatus>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("week");
  const [capacities, setCapacities] = useState<Record<string, number>>({});
  const [showCapModal, setShowCapModal] = useState(false);
  const [capForm, setCapForm] = useState<Record<string, string>>({});
  const [reassignMenu, setReassignMenu] = useState<{ taskId: string; memberId: string } | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>("overview");

  const capHours = periodConfig[timePeriod].hours;

  const memberData = useMemo(() => {
    return teamMembers.map(m => {
      const memberCap = capacities[m.id] || capHours;
      const memberTasks = tasks.filter(t => t.assignee?.id === m.id);
      const activeTasks = memberTasks.filter(t => t.status !== "done");
      const doneTasks = memberTasks.filter(t => t.status === "done");
      const inProgressTasks = activeTasks.filter(t => t.status === "in_progress");
      const todoTasks = activeTasks.filter(t => t.status === "todo");
      const reviewTasks = activeTasks.filter(t => t.status === "in_review");
      const totalEstimate = activeTasks.reduce((a, t) => a + (t.timeEstimate || 0), 0) / 60;
      const totalSpent = memberTasks.reduce((a, t) => a + (t.timeSpent || 0), 0) / 60;
      const utilization = Math.round((totalEstimate / memberCap) * 100);
      const status: WorkloadStatus = utilization > 100 ? "overloaded" : utilization > 60 ? "optimal" : "underloaded";
      return { member: m, tasks: memberTasks, activeTasks, doneTasks, inProgressTasks, todoTasks, reviewTasks, totalEstimate, totalSpent, utilization, status, capacity: memberCap };
    });
  }, [tasks, capacities, capHours]);

  const filtered = useMemo(() => {
    let res = memberData;
    if (searchQ) res = res.filter(m => m.member.name.toLowerCase().includes(searchQ.toLowerCase()) || m.member.role.toLowerCase().includes(searchQ.toLowerCase()));
    if (filterWL !== "all") res = res.filter(m => m.status === filterWL);
    // Sort
    switch (sortBy) {
      case "utilization_desc": res = [...res].sort((a, b) => b.utilization - a.utilization); break;
      case "utilization_asc": res = [...res].sort((a, b) => a.utilization - b.utilization); break;
      case "name": res = [...res].sort((a, b) => a.member.name.localeCompare(b.member.name)); break;
      case "tasks_desc": res = [...res].sort((a, b) => b.tasks.length - a.tasks.length); break;
      case "active_desc": res = [...res].sort((a, b) => b.activeTasks.length - a.activeTasks.length); break;
    }
    return res;
  }, [memberData, searchQ, filterWL, sortBy]);

  const avgUtil = memberData.length > 0 ? Math.round(memberData.reduce((a, m) => a + m.utilization, 0) / memberData.length) : 0;
  const totalActive = tasks.filter(t => t.status !== "done").length;
  const overloadedCount = memberData.filter(m => m.status === "overloaded").length;
  const unassignedCount = tasks.filter(t => !t.assignee).length;

  const handleSaveCapacities = () => {
    const newCaps: Record<string, number> = {};
    for (const m of teamMembers) {
      const v = parseFloat(capForm[m.id]);
      if (v && v > 0) newCaps[m.id] = v;
    }
    setCapacities(newCaps);
    setShowCapModal(false);
  };

  const handleReassign = (taskId: string, newMemberId: string) => {
    // In real app this would update the task's assignee
    // For demo, we just close the menu
    setReassignMenu(null);
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50 p-6" onClick={() => setReassignMenu(null)}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-gray-900 tracking-tight">Workload</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Team capacity and workload distribution</p>
            </div>
          </div>
          <button onClick={() => { const f: Record<string, string> = {}; teamMembers.forEach(m => f[m.id] = String(capacities[m.id] || capHours)); setCapForm(f); setShowCapModal(true); }}
            className="flex items-center gap-1.5 text-[11px] text-gray-600 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all">
            <Settings className="w-3.5 h-3.5" /> Capacity
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4">
          {([
            ["overview", "Overview", <BarChart3 key="o" className="w-3.5 h-3.5" />],
            ["timeline", "Timeline", <Calendar key="t" className="w-3.5 h-3.5" />],
            ["forecast", "Forecast", <TrendingUp key="f" className="w-3.5 h-3.5" />],
          ] as [ViewTab, string, React.ReactNode][]).map(([key, label, icon]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-[11px] rounded-xl transition-all ${activeTab === key ? "bg-white shadow-sm text-gray-800 border border-gray-200" : "text-gray-500 hover:bg-gray-100"}`}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Overloaded Members Alert */}
        {overloadedCount > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-3.5 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-red-700">{overloadedCount} thành viên đang quá tải!</p>
              <p className="text-[10px] text-red-500 mt-0.5">
                {memberData.filter(m => m.status === "overloaded").map(m => `${m.member.name.split(" ").slice(-2).join(" ")} (${m.utilization}%)`).join(", ")}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => { setFilterWL("overloaded"); toast.success("Đang hiển thị members quá tải"); }}
                className="text-[10px] text-orange-600 bg-orange-100 hover:bg-orange-200 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter
              </button>
              <button onClick={() => toast.success("Gợi ý: Redistribute tasks từ members quá tải sang members available")}
                className="text-[10px] text-indigo-600 bg-indigo-100 hover:bg-indigo-200 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1">
                <Zap className="w-3 h-3" /> Auto-balance
              </button>
            </div>
          </div>
        )}

        {/* Overview cards */}
        <div className="grid grid-cols-5 gap-3 mb-5">
          {[
            { label: "Team Members", value: teamMembers.length, color: "#0891b2", bg: "#ecfeff", icon: <Users className="w-4 h-4" /> },
            { label: "Active Tasks", value: totalActive, color: "#7c3aed", bg: "#f3e8ff", icon: <CheckCircle2 className="w-4 h-4" /> },
            { label: "Unassigned", value: unassignedCount, color: "#6b7280", bg: "#f9fafb", icon: <AlertTriangle className="w-4 h-4" /> },
            { label: "Overloaded", value: overloadedCount, color: "#dc2626", bg: "#fef2f2", icon: <AlertTriangle className="w-4 h-4" /> },
            { label: "Avg Utilization", value: `${avgUtil}%`, color: "#059669", bg: "#ecfdf5", icon: <TrendingUp className="w-4 h-4" /> },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.bg, color: s.color }}>{s.icon}</div>
              <div><p className="text-[18px] text-gray-800">{s.value}</p><p className="text-[9px] text-gray-400">{s.label}</p></div>
            </div>
          ))}
        </div>

        {/* Team Health Score */}
        {(() => {
          const optimalCount = memberData.filter(m => m.status === "optimal").length;
          const healthScore = Math.round(((optimalCount * 3 + memberData.filter(m => m.status === "underloaded").length * 1) / (memberData.length * 3)) * 100);
          const healthColor = healthScore >= 70 ? "#059669" : healthScore >= 40 ? "#d97706" : "#dc2626";
          const healthLabel = healthScore >= 70 ? "Healthy" : healthScore >= 40 ? "Needs Attention" : "Critical";
          return (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-5 flex items-center gap-4">
              <div className="relative w-14 h-14 shrink-0">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#f1f5f9" strokeWidth="5" />
                  <circle cx="28" cy="28" r="22" fill="none" stroke={healthColor} strokeWidth="5"
                    strokeDasharray={`${2 * Math.PI * 22}`} strokeDashoffset={`${2 * Math.PI * 22 * (1 - healthScore / 100)}`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[12px]" style={{ color: healthColor }}>{healthScore}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] text-gray-800">Team Health Score</p>
                  <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ backgroundColor: healthColor + "15", color: healthColor }}>{healthLabel}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{optimalCount}/{memberData.length} members at optimal workload · {overloadedCount} overloaded</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {memberData.map(md => {
                  const sc = statusColors[md.status];
                  return <div key={md.member.id} className="w-3 h-3 rounded-full" style={{ backgroundColor: sc.text }} title={`${md.member.name}: ${md.utilization}%`} />;
                })}
              </div>
            </div>
          );
        })()}

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (<>
          {/* Utilization overview bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-gray-600 flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5 text-gray-400" /> Team Utilization</p>
              <div className="flex items-center gap-3 text-[9px] text-gray-400">
                {Object.entries(statusColors).map(([k, v]) => <span key={k} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.text }} />{v.label}</span>)}
              </div>
            </div>
            <div className="flex items-end gap-1.5 h-16">
              {memberData.map(md => {
                const sc = statusColors[md.status];
                const h = Math.min(100, md.utilization);
                return (
                  <div key={md.member.id} className="flex-1 flex flex-col items-center gap-0.5 group cursor-pointer" onClick={() => setExpanded(p => ({ ...p, [md.member.id]: !p[md.member.id] }))}>
                    <span className="text-[7px] text-gray-400 opacity-0 group-hover:opacity-100 transition-all">{md.utilization}%</span>
                    <div className="w-full rounded-t-sm transition-all" style={{ height: `${Math.max(4, h * 0.55)}px`, backgroundColor: sc.text }} />
                    <span className="text-[7px] text-gray-400 truncate max-w-full">{md.member.name.split(" ").pop()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls: Search, Filter, Sort, Time Period */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm thành viên..."
                className="w-full pl-9 pr-3 py-2 text-[11px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-cyan-300 text-gray-700" />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-0.5">
              {[{ v: "all" as const, l: "All" }, { v: "overloaded" as const, l: "Overloaded" }, { v: "optimal" as const, l: "Optimal" }, { v: "underloaded" as const, l: "Available" }].map(f => (
                <button key={f.v} onClick={() => setFilterWL(f.v)} className={`px-2.5 py-1.5 text-[10px] rounded-lg transition-all ${filterWL === f.v ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>{f.l}</button>
              ))}
            </div>

            {/* Time Period */}
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-0.5">
              {(["week", "biweek", "month"] as const).map(p => (
                <button key={p} onClick={() => setTimePeriod(p)} className={`px-2.5 py-1.5 text-[10px] rounded-lg transition-all ${timePeriod === p ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>{periodConfig[p].label}</button>
              ))}
            </div>

            {/* Sort */}
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}
              className="text-[10px] bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-gray-600 focus:outline-none">
              <option value="utilization_desc">Utilization ↓</option>
              <option value="utilization_asc">Utilization ↑</option>
              <option value="name">Tên A→Z</option>
              <option value="tasks_desc">Tasks ↓</option>
              <option value="active_desc">Active ↓</option>
            </select>

            <span className="text-[10px] text-gray-400 ml-auto">{filtered.length} members</span>
          </div>

          {/* Workload bars */}
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-[13px] text-gray-400">Không tìm thấy thành viên</p>
              </div>
            )}
            {filtered.map(({ member, activeTasks, doneTasks, inProgressTasks, todoTasks, reviewTasks, totalEstimate, totalSpent, utilization, status, capacity }) => {
              const sc = statusColors[status];
              const isOpen = expanded[member.id];
              return (
                <div key={member.id} className={`bg-white rounded-2xl border shadow-sm transition-all ${status === "overloaded" ? "border-red-200 hover:shadow-md" : "border-gray-200 hover:shadow-md"}`}>
                  <div className="p-5 cursor-pointer" onClick={() => setExpanded(p => ({ ...p, [member.id]: !p[member.id] }))}>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] text-white shrink-0" style={{ backgroundColor: member.color }}>
                        {member.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] text-gray-800">{member.name}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full border" style={{ backgroundColor: sc.bg, color: sc.text, borderColor: sc.border }}>{sc.label}</span>
                          {status === "overloaded" && <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />}
                        </div>
                        <p className="text-[11px] text-gray-400">{member.role}</p>
                      </div>
                      <div className="flex items-center gap-5 text-[11px] shrink-0">
                        <div className="text-center"><p className="text-gray-400">Active</p><p className="text-gray-700">{activeTasks.length}</p></div>
                        <div className="text-center"><p className="text-gray-400">Done</p><p className="text-emerald-600">{doneTasks.length}</p></div>
                        <div className="text-center"><p className="text-gray-400">Est.</p><p className="text-gray-700">{totalEstimate.toFixed(0)}h</p></div>
                        <div className="text-center"><p className="text-gray-400">Spent</p><p className="text-cyan-600">{totalSpent.toFixed(0)}h</p></div>
                        <div className="text-center"><p className="text-gray-400">Cap.</p><p className="text-gray-700">{capacity}h</p></div>
                        {isOpen ? <ChevronDown className="w-4 h-4 text-gray-300" /> : <ChevronRight className="w-4 h-4 text-gray-300" />}
                      </div>
                    </div>

                    {/* Capacity bar */}
                    <div className="relative">
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        {/* Spent portion */}
                        <div className="h-full rounded-full transition-all absolute left-0 top-0 opacity-40" style={{ width: `${Math.min(100, Math.round((totalSpent / capacity) * 100))}%`, backgroundColor: sc.text }} />
                        {/* Estimated portion */}
                        <div className="h-full rounded-full transition-all relative" style={{ width: `${Math.min(100, utilization)}%`, backgroundColor: sc.text }} />
                      </div>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px]" style={{ color: sc.text }}>
                        {utilization > 100 && <AlertTriangle className="w-3 h-3" />}{utilization}%
                      </div>
                    </div>
                  </div>

                  {/* Expanded: Task breakdown */}
                  {isOpen && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/30">
                      {/* Status summary pills */}
                      <div className="flex items-center gap-2 mb-3">
                        {[{ l: "In Progress", c: inProgressTasks.length, cl: "#0e7490" }, { l: "To Do", c: todoTasks.length, cl: "#6b7280" }, { l: "Review", c: reviewTasks.length, cl: "#b45309" }, { l: "Done", c: doneTasks.length, cl: "#047857" }].map(s => (
                          <span key={s.l} className="text-[9px] px-2 py-0.5 rounded-full bg-white border border-gray-100 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.cl }} /><span style={{ color: s.cl }}>{s.c}</span> <span className="text-gray-400">{s.l}</span>
                          </span>
                        ))}
                      </div>

                      {/* Time tracking */}
                      <div className="bg-white rounded-lg border border-gray-100 p-3 mb-3">
                        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1.5">
                          <span>Thời gian: {totalSpent.toFixed(1)}h spent / {totalEstimate.toFixed(1)}h estimated</span>
                          <span>{totalEstimate > 0 ? Math.round((totalSpent / totalEstimate) * 100) : 0}% burned</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${totalEstimate > 0 ? Math.min(100, Math.round((totalSpent / totalEstimate) * 100)) : 0}%` }} />
                        </div>
                      </div>

                      {/* Tasks list */}
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Tasks ({activeTasks.length + doneTasks.length})</p>
                      <div className="space-y-1">
                        {[...activeTasks, ...doneTasks].map(task => {
                          const stCfg = statusConfig[task.status];
                          const prCfg = priorityConfig[task.priority];
                          return (
                            <div key={task.id} className="flex items-center gap-2.5 py-1.5 px-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-all group/task">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stCfg.color }} />
                              <button onClick={e => { e.stopPropagation(); onTaskClick(task); }} className="flex-1 text-left text-[11px] text-gray-700 truncate hover:text-gray-900">{task.title}</button>
                              <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: prCfg.color, backgroundColor: `${prCfg.color}12` }}>{prCfg.label}</span>
                              <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: stCfg.color, backgroundColor: stCfg.bg }}>{stCfg.label}</span>
                              {task.timeEstimate && <span className="text-[8px] text-gray-400">{(task.timeEstimate / 60).toFixed(0)}h</span>}
                              {/* Reassign button */}
                              <div className="relative">
                                <button onClick={e => { e.stopPropagation(); setReassignMenu(reassignMenu?.taskId === task.id ? null : { taskId: task.id, memberId: member.id }); }}
                                  className="opacity-0 group-hover/task:opacity-100 p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600" title="Reassign">
                                  <Users className="w-3 h-3" />
                                </button>
                                {reassignMenu?.taskId === task.id && (
                                  <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-xl border border-gray-200 shadow-xl py-1 min-w-[160px]" onClick={e => e.stopPropagation()}>
                                    <p className="text-[9px] text-gray-400 px-3 py-1">Reassign to:</p>
                                    {teamMembers.filter(tm => tm.id !== member.id).map(tm => (
                                      <button key={tm.id} onClick={e => { e.stopPropagation(); handleReassign(task.id, tm.id); }}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50">
                                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: tm.color }}>{tm.name.charAt(0)}</div>
                                        {tm.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {activeTasks.length === 0 && doneTasks.length === 0 && (
                          <div className="text-center py-4 text-[11px] text-gray-400">Chưa có task nào</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>)}

        {/* TIMELINE TAB */}
        {activeTab === "timeline" && (
          <div className="space-y-4">
            {/* Weekly heatmap */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-[13px] text-gray-700 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /> Weekly Workload Heatmap</h3>
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <div className="grid grid-cols-[140px_repeat(7,1fr)] gap-1 mb-2">
                    <div />
                    {["Mon 17", "Tue 18", "Wed 19", "Thu 20", "Fri 21", "Sat 22", "Sun 23"].map(d => (
                      <div key={d} className="text-[9px] text-gray-400 text-center py-1">{d}</div>
                    ))}
                  </div>
                  {memberData.map(md => {
                    // Generate mock daily load
                    const dailyLoad = [0.9, 0.7, 0.85, 0.6, 0.5, 0.1, 0].map(base => {
                      const val = Math.min(1, base * (md.utilization / 80) + (Math.random() * 0.2 - 0.1));
                      return Math.max(0, val);
                    });
                    return (
                      <div key={md.member.id} className="grid grid-cols-[140px_repeat(7,1fr)] gap-1 mb-1">
                        <div className="flex items-center gap-2 pr-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] text-white shrink-0" style={{ backgroundColor: md.member.color }}>{md.member.name.charAt(0)}</div>
                          <span className="text-[10px] text-gray-600 truncate">{md.member.name.split(" ").slice(-2).join(" ")}</span>
                        </div>
                        {dailyLoad.map((load, i) => {
                          const intensity = load;
                          const isWeekend = i >= 5;
                          const bgColor = isWeekend && load < 0.15 ? "#f9fafb" :
                            intensity > 0.9 ? "#dc2626" :
                            intensity > 0.7 ? "#f97316" :
                            intensity > 0.5 ? "#d97706" :
                            intensity > 0.3 ? "#059669" :
                            intensity > 0.1 ? "#0891b2" : "#f1f5f9";
                          const opacity = isWeekend && load < 0.15 ? 0.3 : 0.15 + intensity * 0.85;
                          return (
                            <div key={i} className="h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
                              style={{ backgroundColor: bgColor, opacity }}
                              title={`${md.member.name}: ${Math.round(load * 8)}h`}>
                              <span className="text-[8px] text-white mix-blend-difference">{load > 0.1 ? `${Math.round(load * 8)}h` : ""}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-3 mt-3 justify-center">
                    {[{ l: "Light", c: "#0891b2" }, { l: "Moderate", c: "#059669" }, { l: "Busy", c: "#d97706" }, { l: "Heavy", c: "#f97316" }, { l: "Overloaded", c: "#dc2626" }].map(i => (
                      <span key={i.l} className="flex items-center gap-1 text-[8px] text-gray-400"><div className="w-3 h-3 rounded" style={{ backgroundColor: i.c, opacity: 0.7 }} /> {i.l}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Task distribution by day */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-[13px] text-gray-700 mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-gray-400" /> Task Distribution This Week</h3>
              <div className="space-y-2">
                {memberData.sort((a, b) => b.activeTasks.length - a.activeTasks.length).map(md => {
                  const maxTasks = Math.max(...memberData.map(m => m.activeTasks.length), 1);
                  return (
                    <div key={md.member.id} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] text-white shrink-0" style={{ backgroundColor: md.member.color }}>{md.member.name.charAt(0)}</div>
                      <span className="text-[10px] text-gray-600 w-24 truncate">{md.member.name.split(" ").slice(-2).join(" ")}</span>
                      <div className="flex-1 h-6 bg-gray-50 rounded-lg overflow-hidden flex">
                        {md.inProgressTasks.length > 0 && <div className="h-full bg-cyan-500 flex items-center justify-center text-[7px] text-white" style={{ width: `${(md.inProgressTasks.length / maxTasks) * 100}%` }}>{md.inProgressTasks.length}</div>}
                        {md.reviewTasks.length > 0 && <div className="h-full bg-amber-500 flex items-center justify-center text-[7px] text-white" style={{ width: `${(md.reviewTasks.length / maxTasks) * 100}%` }}>{md.reviewTasks.length}</div>}
                        {md.todoTasks.length > 0 && <div className="h-full bg-gray-300 flex items-center justify-center text-[7px] text-white" style={{ width: `${(md.todoTasks.length / maxTasks) * 100}%` }}>{md.todoTasks.length}</div>}
                      </div>
                      <span className="text-[9px] text-gray-400 w-6 text-right">{md.activeTasks.length}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 justify-center">
                {[{ l: "In Progress", c: "bg-cyan-500" }, { l: "Review", c: "bg-amber-500" }, { l: "Todo", c: "bg-gray-300" }].map(i => (
                  <span key={i.l} className="flex items-center gap-1 text-[8px] text-gray-400"><div className={`w-2.5 h-2.5 rounded-sm ${i.c}`} /> {i.l}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FORECAST TAB */}
        {activeTab === "forecast" && (
          <div className="space-y-4">
            {/* Capacity forecast */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-[13px] text-gray-700 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-gray-400" /> Capacity Forecast</h3>
              <p className="text-[10px] text-gray-500 mb-4">Dự báo workload dựa trên tasks hiện tại và deadlines sắp tới</p>
              <div className="space-y-3">
                {memberData.sort((a, b) => b.utilization - a.utilization).map(md => {
                  const sc = statusColors[md.status];
                  const forecast = Math.min(150, md.utilization + Math.round(Math.random() * 20 - 5));
                  const forecastStatus: WorkloadStatus = forecast > 100 ? "overloaded" : forecast > 60 ? "optimal" : "underloaded";
                  const fsc = statusColors[forecastStatus];
                  const trend = forecast - md.utilization;
                  return (
                    <div key={md.member.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] text-white" style={{ backgroundColor: md.member.color }}>{md.member.name.charAt(0)}</div>
                        <div className="flex-1">
                          <p className="text-[12px] text-gray-800">{md.member.name}</p>
                          <p className="text-[9px] text-gray-400">{md.member.role}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: sc.bg, color: sc.text }}>Now: {md.utilization}%</span>
                            <ArrowRight className="w-3 h-3 text-gray-300" />
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: fsc.bg, color: fsc.text }}>Next: {forecast}%</span>
                          </div>
                          <p className={`text-[9px] mt-0.5 ${trend > 0 ? "text-red-500" : trend < 0 ? "text-emerald-500" : "text-gray-400"}`}>
                            {trend > 0 ? `↑ +${trend}%` : trend < 0 ? `↓ ${trend}%` : "→ Stable"}
                          </p>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden relative">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, md.utilization)}%`, backgroundColor: sc.text }} />
                        <div className="absolute top-0 h-full rounded-full border-2 border-dashed transition-all" style={{ width: `${Math.min(100, forecast)}%`, borderColor: fsc.text, left: 0 }} />
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-[9px] text-gray-400">
                        <span>{md.activeTasks.length} active tasks · {md.totalEstimate.toFixed(0)}h estimated</span>
                        <span>Capacity: {md.capacity}h</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Risk assessment */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-[13px] text-gray-700 mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Risk Assessment</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <p className="text-[20px] text-red-600">{overloadedCount}</p>
                  <p className="text-[11px] text-red-700 mt-1">Overloaded Members</p>
                  <p className="text-[9px] text-red-500 mt-0.5">Cần reassign hoặc giãn deadline</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <p className="text-[20px] text-amber-600">{unassignedCount}</p>
                  <p className="text-[11px] text-amber-700 mt-1">Unassigned Tasks</p>
                  <p className="text-[9px] text-amber-500 mt-0.5">Tasks chưa có người phụ trách</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                  <p className="text-[20px] text-emerald-600">{memberData.filter(m => m.status === "underloaded").length}</p>
                  <p className="text-[11px] text-emerald-700 mt-1">Available Members</p>
                  <p className="text-[9px] text-emerald-500 mt-0.5">Có thể nhận thêm tasks</p>
                </div>
              </div>

              {/* Recommendations */}
              <div className="mt-4">
                <p className="text-[11px] text-gray-600 mb-2">Recommendations</p>
                <div className="space-y-1.5">
                  {memberData.filter(m => m.status === "overloaded").map(md => {
                    const available = memberData.filter(m => m.status === "underloaded");
                    return (
                      <div key={md.member.id} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl text-[10px]">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-gray-600 flex-1">
                          Move tasks from <span className="text-gray-800">{md.member.name.split(" ").slice(-2).join(" ")}</span> ({md.utilization}%)
                          {available.length > 0 && <> to <span className="text-emerald-600">{available[0].member.name.split(" ").slice(-2).join(" ")}</span> ({available[0].utilization}%)</>}
                        </span>
                        <button onClick={() => toast.info("Auto-balance coming soon")} className="text-[9px] text-cyan-600 bg-cyan-50 px-2 py-1 rounded-lg hover:bg-cyan-100">Auto-balance</button>
                      </div>
                    );
                  })}
                  {overloadedCount === 0 && (
                    <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl text-[10px] text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Team workload đang cân bằng tốt!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Capacity Settings Modal */}
      {showCapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowCapModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] text-gray-800 tracking-tight">Capacity Settings</h3>
              <button onClick={() => setShowCapModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-[10px] text-gray-400 mb-4">Cài đặt capacity (giờ) cho mỗi thành viên trong kỳ "{periodConfig[timePeriod].label}" (mặc định: {capHours}h)</p>
            <div className="space-y-2 max-h-[320px] overflow-auto">
              {teamMembers.map(m => (
                <div key={m.id} className="flex items-center gap-3 py-1.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white shrink-0" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0"><p className="text-[12px] text-gray-700 truncate">{m.name}</p><p className="text-[9px] text-gray-400">{m.role}</p></div>
                  <div className="flex items-center gap-1">
                    <input value={capForm[m.id] || ""} onChange={e => setCapForm(p => ({ ...p, [m.id]: e.target.value }))} type="number"
                      className="w-16 text-[12px] border border-gray-200 rounded-lg px-2 py-1 text-right focus:outline-none focus:border-cyan-400" />
                    <span className="text-[10px] text-gray-400">h</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-5">
              <button onClick={() => { const f: Record<string, string> = {}; teamMembers.forEach(m => f[m.id] = String(capHours)); setCapForm(f); }}
                className="text-[11px] text-gray-400 hover:text-gray-600">Reset defaults</button>
              <div className="flex gap-2">
                <button onClick={() => setShowCapModal(false)} className="text-[12px] text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Cancel</button>
                <button onClick={handleSaveCapacities} className="text-[12px] bg-cyan-500 text-white px-4 py-1.5 rounded-lg hover:bg-cyan-600">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}