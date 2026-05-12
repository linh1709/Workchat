import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Activity, Search, Filter, Calendar, ChevronDown, Clock,
  CheckCircle2, MessageSquare, GitBranch, Users, FileText,
  Upload, Edit3, Trash2, Plus, Eye, Zap, Target, Tag,
  ArrowRight, User, Flag, AlertCircle, RefreshCw,
  MoreHorizontal, Download, Star, TrendingUp, BarChart3,
  Check
} from "lucide-react";
import { teamMembers, projects } from "./data";

interface ActivityItem {
  id: string;
  type: "task_created" | "task_completed" | "task_updated" | "comment" | "status_change" | "assignment" | "sprint" | "file_upload" | "priority_change" | "tag_added" | "deleted" | "milestone";
  actor: string;
  target: string;
  detail?: string;
  project?: string;
  timestamp: string;
  timeAgo: string;
}

const activityData: ActivityItem[] = [
  { id: "a1", type: "task_completed", actor: "u1", target: "Implement chat module", project: "Website Redesign", timestamp: "2026-03-17T16:30:00", timeAgo: "30 phút trước" },
  { id: "a2", type: "comment", actor: "u2", target: "API rate limiting", detail: "Đã fix edge case khi request > 1000/min", project: "API Development", timestamp: "2026-03-17T15:45:00", timeAgo: "1 giờ trước" },
  { id: "a3", type: "status_change", actor: "u3", target: "Design System v2", detail: "In Progress → In Review", project: "Brand Guidelines", timestamp: "2026-03-17T14:20:00", timeAgo: "2 giờ trước" },
  { id: "a4", type: "assignment", actor: "u1", target: "Mobile responsive fixes", detail: "→ Trần Văn Cường", project: "Website Redesign", timestamp: "2026-03-17T13:00:00", timeAgo: "4 giờ trước" },
  { id: "a5", type: "file_upload", actor: "u3", target: "Brand assets v3.fig", detail: "4.2 MB", project: "Brand Guidelines", timestamp: "2026-03-17T11:30:00", timeAgo: "5 giờ trước" },
  { id: "a6", type: "priority_change", actor: "u2", target: "Database migration", detail: "Normal → Urgent", project: "API Development", timestamp: "2026-03-17T10:15:00", timeAgo: "6 giờ trước" },
  { id: "a7", type: "task_created", actor: "u4", target: "Push notification integration", project: "Website Redesign", timestamp: "2026-03-17T09:30:00", timeAgo: "7 giờ trước" },
  { id: "a8", type: "sprint", actor: "u6", target: "Sprint 12", detail: "Sprint started", project: "Website Redesign", timestamp: "2026-03-17T09:00:00", timeAgo: "8 giờ trước" },
  { id: "a9", type: "milestone", actor: "u1", target: "Phase 2 Launch", detail: "Milestone reached!", project: "Website Redesign", timestamp: "2026-03-16T18:00:00", timeAgo: "1 ngày trước" },
  { id: "a10", type: "task_completed", actor: "u5", target: "E2E test suite for auth", project: "Website Redesign", timestamp: "2026-03-16T17:30:00", timeAgo: "1 ngày trước" },
  { id: "a11", type: "tag_added", actor: "u2", target: "GraphQL schema update", detail: "#breaking-change", project: "API Development", timestamp: "2026-03-16T16:00:00", timeAgo: "1 ngày trước" },
  { id: "a12", type: "comment", actor: "u4", target: "Flutter integration", detail: "Need to update iOS build config", project: "Website Redesign", timestamp: "2026-03-16T14:30:00", timeAgo: "1 ngày trước" },
  { id: "a13", type: "deleted", actor: "u6", target: "Deprecated API endpoint docs", project: "API Development", timestamp: "2026-03-16T11:00:00", timeAgo: "1 ngày trước" },
  { id: "a14", type: "task_updated", actor: "u3", target: "Icon set redesign", detail: "Due date → Mar 25", project: "Brand Guidelines", timestamp: "2026-03-15T16:00:00", timeAgo: "2 ngày trước" },
  { id: "a15", type: "task_completed", actor: "u1", target: "WebSocket real-time sync", project: "Website Redesign", timestamp: "2026-03-15T15:00:00", timeAgo: "2 ngày trước" },
  { id: "a16", type: "assignment", actor: "u6", target: "Performance audit", detail: "→ Lê Thị Bình", project: "Website Redesign", timestamp: "2026-03-15T10:00:00", timeAgo: "2 ngày trước" },
  { id: "a17", type: "sprint", actor: "u6", target: "Sprint 11", detail: "Sprint completed - 28/32 tasks done", project: "Website Redesign", timestamp: "2026-03-14T18:00:00", timeAgo: "3 ngày trước" },
  { id: "a18", type: "file_upload", actor: "u3", target: "Logo variations.zip", detail: "12.8 MB", project: "Brand Guidelines", timestamp: "2026-03-14T14:00:00", timeAgo: "3 ngày trước" },
];

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  task_created: { icon: <Plus className="w-3.5 h-3.5" />, color: "#7c3aed", bg: "#f5f3ff", label: "Created" },
  task_completed: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "#059669", bg: "#ecfdf5", label: "Completed" },
  task_updated: { icon: <Edit3 className="w-3.5 h-3.5" />, color: "#0891b2", bg: "#ecfeff", label: "Updated" },
  comment: { icon: <MessageSquare className="w-3.5 h-3.5" />, color: "#2563eb", bg: "#eff6ff", label: "Comment" },
  status_change: { icon: <GitBranch className="w-3.5 h-3.5" />, color: "#d97706", bg: "#fefce8", label: "Status" },
  assignment: { icon: <User className="w-3.5 h-3.5" />, color: "#0891b2", bg: "#ecfeff", label: "Assigned" },
  sprint: { icon: <Zap className="w-3.5 h-3.5" />, color: "#7c3aed", bg: "#f5f3ff", label: "Sprint" },
  file_upload: { icon: <Upload className="w-3.5 h-3.5" />, color: "#db2777", bg: "#fdf2f8", label: "Upload" },
  priority_change: { icon: <Flag className="w-3.5 h-3.5" />, color: "#dc2626", bg: "#fef2f2", label: "Priority" },
  tag_added: { icon: <Tag className="w-3.5 h-3.5" />, color: "#059669", bg: "#ecfdf5", label: "Tag" },
  deleted: { icon: <Trash2 className="w-3.5 h-3.5" />, color: "#dc2626", bg: "#fef2f2", label: "Deleted" },
  milestone: { icon: <Star className="w-3.5 h-3.5" />, color: "#d97706", bg: "#fefce8", label: "Milestone" },
};

type FilterType = "all" | "task_created" | "task_completed" | "comment" | "status_change" | "assignment" | "file_upload" | "sprint";

export function ActivityView() {
  const [searchQ, setSearchQ] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterMember, setFilterMember] = useState("all");
  const [filterProject, setFilterProject] = useState("all");

  const filtered = useMemo(() => {
    return activityData.filter(a => {
      const matchType = filterType === "all" || a.type === filterType;
      const matchMember = filterMember === "all" || a.actor === filterMember;
      const matchProject = filterProject === "all" || a.project === filterProject;
      const matchSearch = !searchQ || a.target.toLowerCase().includes(searchQ.toLowerCase()) || (a.detail || "").toLowerCase().includes(searchQ.toLowerCase());
      return matchType && matchMember && matchProject && matchSearch;
    });
  }, [searchQ, filterType, filterMember, filterProject]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, ActivityItem[]>();
    filtered.forEach(a => {
      const date = a.timestamp.split("T")[0];
      const todayStr = new Date().toISOString().split("T")[0];
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const label = date === todayStr ? "Hôm nay" : date === yesterdayStr ? "Hôm qua" : new Date(date).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "short" });
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(a);
    });
    return Array.from(map.entries());
  }, [filtered]);

  // Stats
  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = activityData.filter(a => a.timestamp.startsWith(todayStr)).length;
  const completedToday = activityData.filter(a => a.timestamp.startsWith(todayStr) && a.type === "task_completed").length;
  const activeMembers = new Set(activityData.filter(a => a.timestamp.startsWith(todayStr)).map(a => a.actor)).size;

  // Member activity breakdown
  const memberActivity = useMemo(() => {
    const map = new Map<string, number>();
    activityData.forEach(a => map.set(a.actor, (map.get(a.actor) || 0) + 1));
    return Array.from(map.entries())
      .map(([id, count]) => ({ member: teamMembers.find(m => m.id === id), count }))
      .filter(m => m.member)
      .sort((a, b) => b.count - a.count);
  }, []);

  // Type breakdown for chart
  const typeBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    activityData.forEach(a => map.set(a.type, (map.get(a.type) || 0) + 1));
    return Array.from(map.entries())
      .map(([type, count]) => ({ type, count, cfg: typeConfig[type] }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const [showSummary, setShowSummary] = useState(false);

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-gray-900 tracking-tight">Activity Feed</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">{todayCount} events hôm nay</p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 text-[11px] text-gray-500 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Activity Heatmap */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[12px] text-gray-700 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /> Activity Heatmap (7 ngày)</h3>
            <button className="flex items-center gap-1 text-[9px] text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-50 transition-all">
              <Download className="w-3 h-3" /> Export CSV
            </button>
          </div>
          <div className="flex items-end gap-1.5">
            {[
              { day: "T2", hours: [0,0,1,0,0,0,0,0,2,3,2,4,3,2,3,1,2,1,0,0,0,0,0,0] },
              { day: "T3", hours: [0,0,0,0,0,0,0,1,3,4,3,2,1,3,4,2,3,2,1,0,0,0,0,0] },
              { day: "T4", hours: [0,0,0,0,0,0,0,0,2,3,5,3,2,4,3,2,1,2,0,0,0,0,0,0] },
              { day: "T5", hours: [0,0,0,0,0,0,0,1,1,2,3,2,1,2,2,1,1,0,0,0,0,0,0,0] },
              { day: "T6", hours: [0,0,0,0,0,0,0,0,3,4,3,5,4,3,2,3,2,1,1,0,0,0,0,0] },
              { day: "T7", hours: [0,0,0,0,0,0,0,0,0,1,2,1,0,0,1,1,0,0,0,0,0,0,0,0] },
              { day: "CN", hours: [0,0,0,0,0,0,0,0,1,2,3,2,1,2,3,2,1,0,0,0,0,0,0,0] },
            ].map(d => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-[2px]">
                {d.hours.filter((_, i) => i >= 7 && i <= 19).map((v, hi) => (
                  <div key={hi} className="w-full h-[10px] rounded-[2px] transition-all" title={`${d.day} ${hi + 7}:00 — ${v} events`}
                    style={{ backgroundColor: v === 0 ? "#f8fafc" : v <= 1 ? "#ccfbf1" : v <= 2 ? "#5eead4" : v <= 3 ? "#14b8a6" : v <= 4 ? "#0d9488" : "#0f766e" }} />
                ))}
                <span className="text-[8px] text-gray-400 mt-1">{d.day}</span>
              </div>
            ))}
            <div className="flex flex-col items-start gap-[2px] ml-2">
              {["7h", "", "9h", "", "11h", "", "13h", "", "15h", "", "17h", "", "19h"].map((l, i) => (
                <div key={i} className="h-[10px] flex items-center"><span className="text-[7px] text-gray-300">{l}</span></div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between mt-2.5">
            <div className="flex items-center gap-1 text-[8px] text-gray-400">
              <span>Ít</span>
              {[0, 1, 2, 3, 4, 5].map(v => (
                <div key={v} className="w-[10px] h-[10px] rounded-[2px]"
                  style={{ backgroundColor: v === 0 ? "#f8fafc" : v <= 1 ? "#ccfbf1" : v <= 2 ? "#5eead4" : v <= 3 ? "#14b8a6" : v <= 4 ? "#0d9488" : "#0f766e" }} />
              ))}
              <span>Nhiều</span>
            </div>
            <span className="text-[9px] text-gray-400">Tổng: {activityData.length} events</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500"><Activity className="w-4 h-4" /></div>
            <div><p className="text-[18px] text-gray-800">{todayCount}</p><p className="text-[9px] text-gray-400">Events Today</p></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500"><CheckCircle2 className="w-4 h-4" /></div>
            <div><p className="text-[18px] text-gray-800">{completedToday}</p><p className="text-[9px] text-gray-400">Completed</p></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-500"><Users className="w-4 h-4" /></div>
            <div><p className="text-[18px] text-gray-800">{activeMembers}</p><p className="text-[9px] text-gray-400">Active Members</p></div>
          </div>
        </div>

        {/* Streak & Productivity */}
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-200 p-4 mb-5 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-[16px]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[14px] text-gray-800">7 ngày streak!</p>
              <p className="text-[10px] text-gray-500">Hoạt động liên tục mỗi ngày</p>
            </div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            {["T2","T3","T4","T5","T6","T7","CN"].map((d, i) => (
              <div key={d} className="flex flex-col items-center gap-0.5">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[8px] ${i <= 6 ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-300"}`}>
                  {i <= 6 ? <Check className="w-3 h-3" /> : ""}
                </div>
                <span className="text-[7px] text-gray-400">{d}</span>
              </div>
            ))}
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-indigo-600">Best: 14 ngày</p>
            <p className="text-[8px] text-gray-400">Kỷ lục cá nhân</p>
          </div>
        </div>

        {/* Summary Panel Toggle */}
        <button onClick={() => setShowSummary(!showSummary)}
          className={`w-full mb-4 flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all ${showSummary ? "border-indigo-200 bg-indigo-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}>
          <span className="text-[11px] text-gray-600 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-indigo-500" /> Activity Insights</span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showSummary ? "rotate-180" : ""}`} />
        </button>

        {showSummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {/* Member Leaderboard */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-[12px] text-gray-700 mb-3 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Top Contributors</h3>
              <div className="space-y-2">
                {memberActivity.slice(0, 6).map((ma, i) => {
                  const maxCount = memberActivity[0]?.count || 1;
                  return (
                    <div key={ma.member!.id} className="flex items-center gap-2.5">
                      <span className={`text-[9px] w-4 text-center ${i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-orange-400" : "text-gray-300"}`}>{i + 1}</span>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] text-white shrink-0" style={{ backgroundColor: ma.member!.color }}>{ma.member!.name.charAt(0)}</div>
                      <span className="text-[10px] text-gray-700 w-20 truncate">{ma.member!.name.split(" ").slice(-2).join(" ")}</span>
                      <div className="flex-1 h-4 bg-gray-50 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 transition-all flex items-center justify-end pr-1.5"
                          style={{ width: `${(ma.count / maxCount) * 100}%` }}>
                          <span className="text-[7px] text-white">{ma.count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Type Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-[12px] text-gray-700 mb-3 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-indigo-400" /> Activity Breakdown</h3>
              <div className="space-y-2">
                {typeBreakdown.map(tb => {
                  const maxCount = typeBreakdown[0]?.count || 1;
                  const pct = Math.round((tb.count / activityData.length) * 100);
                  return (
                    <div key={tb.type} className="flex items-center gap-2">
                      <span className="shrink-0" style={{ color: tb.cfg?.color }}>{tb.cfg?.icon}</span>
                      <span className="text-[10px] text-gray-600 w-16 truncate">{tb.cfg?.label}</span>
                      <div className="flex-1 h-4 bg-gray-50 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all flex items-center justify-end pr-1.5"
                          style={{ width: `${(tb.count / maxCount) * 100}%`, backgroundColor: tb.cfg?.color + "30" }}>
                          <span className="text-[7px]" style={{ color: tb.cfg?.color }}>{tb.count}</span>
                        </div>
                      </div>
                      <span className="text-[8px] text-gray-400 w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm activity..."
              className="w-full pl-9 pr-3 py-2 text-[11px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-cyan-300 text-gray-700" />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value as FilterType)}
            className="text-[10px] bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-600 focus:outline-none">
            <option value="all">All Types</option>
            <option value="task_completed">Completed</option>
            <option value="task_created">Created</option>
            <option value="comment">Comments</option>
            <option value="status_change">Status Changes</option>
            <option value="assignment">Assignments</option>
            <option value="file_upload">Uploads</option>
            <option value="sprint">Sprints</option>
          </select>
          <select value={filterMember} onChange={e => setFilterMember(e.target.value)}
            className="text-[10px] bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-600 focus:outline-none">
            <option value="all">All Members</option>
            {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
            className="text-[10px] bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-600 focus:outline-none">
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
        </div>

        {/* Type pills */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
          {Object.entries(typeConfig).slice(0, 8).map(([key, cfg]) => {
            const count = filtered.filter(a => a.type === key).length;
            if (count === 0) return null;
            return (
              <button key={key} onClick={() => setFilterType(filterType === key ? "all" : key as FilterType)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] whitespace-nowrap transition-all border ${filterType === key ? "border-gray-300 bg-white shadow-sm" : "border-transparent bg-gray-100"}`} style={{ color: cfg.color }}>
                {cfg.icon} {cfg.label} <span className="text-gray-400">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {grouped.map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[12px] text-gray-600">{dateLabel}</span>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] text-gray-400">{items.length} events</span>
              </div>
              <div className="relative ml-4">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                <div className="space-y-1">
                  {items.map(item => {
                    const cfg = typeConfig[item.type] || typeConfig.task_updated;
                    const member = teamMembers.find(m => m.id === item.actor);
                    return (
                      <div key={item.id} className="flex items-start gap-3 pl-0 relative group">
                        <div className="absolute left-[10px] top-3 w-3 h-3 rounded-full border-2 border-white z-10" style={{ backgroundColor: cfg.color }} />
                        <div className="ml-8 flex-1 bg-white rounded-xl border border-gray-200 p-3.5 hover:shadow-sm transition-all">
                          <div className="flex items-start gap-3">
                            {member && (
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white shrink-0" style={{ backgroundColor: member.color }}>{member.name.charAt(0)}</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-gray-700">
                                <span className="text-gray-900">{member?.name.split(" ").slice(-2).join(" ")}</span>
                                <span className="mx-1.5 px-1.5 py-0.5 rounded-md text-[9px]" style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                                <span className="text-gray-600">{item.target}</span>
                              </p>
                              {item.detail && <p className="text-[10px] text-gray-500 mt-0.5">{item.detail}</p>}
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[9px] text-gray-400">{item.timeAgo}</span>
                                {item.project && <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{item.project}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <Activity className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-[13px] text-gray-500">Không có activity nào</p>
          </div>
        )}
      </div>
    </div>
  );
}