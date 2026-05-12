import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Users, Search, Grid3X3, List, MoreHorizontal, Plus, X, Mail,
  MessageSquare, Phone, Video, Star, StarOff, Shield, Crown,
  Clock, CheckCircle2, TrendingUp, Activity, ChevronDown,
  ExternalLink, Copy, UserMinus, Edit3, Eye, Zap, Target,
  BarChart3, Calendar, Award, Filter, ArrowUpDown
} from "lucide-react";
import { type Task, teamMembers } from "./data";

interface MemberProfile {
  id: string;
  status: "online" | "away" | "busy" | "offline";
  statusText?: string;
  joinDate: string;
  department: string;
  location: string;
  phone: string;
  skills: string[];
  starred: boolean;
}

const memberProfiles: Record<string, MemberProfile> = {
  u1: { id: "u1", status: "online", statusText: "Đang code Sprint 12", joinDate: "2024-06-15", department: "Engineering", location: "Hà Nội", phone: "+84 912 345 678", skills: ["React", "TypeScript", "Node.js", "GraphQL"], starred: true },
  u2: { id: "u2", status: "online", statusText: "Reviewing PRs", joinDate: "2024-08-01", department: "Engineering", location: "HCM", phone: "+84 908 765 432", skills: ["Python", "Django", "AWS", "Docker"], starred: false },
  u3: { id: "u3", status: "away", statusText: "Họp đến 15:00", joinDate: "2025-01-10", department: "Design", location: "Đà Nẵng", phone: "+84 933 222 111", skills: ["Figma", "UI/UX", "Illustration", "Motion"], starred: true },
  u4: { id: "u4", status: "online", joinDate: "2024-09-20", department: "Engineering", location: "Hà Nội", phone: "+84 977 888 666", skills: ["React Native", "iOS", "Swift", "Flutter"], starred: false },
  u5: { id: "u5", status: "busy", statusText: "Do not disturb", joinDate: "2025-03-01", department: "QA", location: "HCM", phone: "+84 966 555 444", skills: ["Testing", "Selenium", "Cypress", "Jest"], starred: false },
  u6: { id: "u6", status: "offline", joinDate: "2024-11-05", department: "Product", location: "Remote", phone: "+84 944 333 222", skills: ["Agile", "Scrum", "Jira", "Analytics"], starred: false },
};

const statusConfig = {
  online: { label: "Online", color: "#059669", bg: "#ecfdf5" },
  away: { label: "Away", color: "#d97706", bg: "#fefce8" },
  busy: { label: "Busy", color: "#dc2626", bg: "#fef2f2" },
  offline: { label: "Offline", color: "#9ca3af", bg: "#f9fafb" },
};

const roleIcons: Record<string, React.ReactNode> = {
  "Team Lead": <Crown className="w-3 h-3 text-amber-500" />,
  "Admin": <Shield className="w-3 h-3 text-red-500" />,
};

type ViewTab = "members" | "performance" | "activity" | "org";
type SortBy = "name" | "tasks" | "completion" | "role";

const recentActivity = [
  { id: 1, member: "u1", action: "completed", target: "Implement chat module", time: "2 giờ trước" },
  { id: 2, member: "u2", action: "created PR", target: "#156 API rate limiting", time: "3 giờ trước" },
  { id: 3, member: "u3", action: "updated", target: "Design System v2", time: "5 giờ trước" },
  { id: 4, member: "u4", action: "started", target: "Mobile responsive fixes", time: "6 giờ trước" },
  { id: 5, member: "u1", action: "merged", target: "Inbox module PR #148", time: "1 ngày trước" },
  { id: 6, member: "u6", action: "reviewed", target: "Sprint 12 retrospective", time: "1 ngày trước" },
  { id: 7, member: "u5", action: "reported bug", target: "Login redirect issue", time: "1 ngày trước" },
  { id: 8, member: "u3", action: "uploaded", target: "Brand assets v3", time: "2 ngày trước" },
  { id: 9, member: "u2", action: "deployed", target: "Staging environment", time: "2 ngày trước" },
  { id: 10, member: "u4", action: "completed", target: "Unit tests auth module", time: "3 ngày trước" },
];

export function TeamView({ tasks, onStartDM }: { tasks: Task[]; onStartDM?: (name: string, userId?: string) => void }) {
  const [activeTab, setActiveTab] = useState<ViewTab>("members");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQ, setSearchQ] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDept, setFilterDept] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [profiles, setProfiles] = useState(memberProfiles);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Developer");
  const [ctxMenu, setCtxMenu] = useState<string | null>(null);

  const roles = useMemo(() => ["all", ...Array.from(new Set(teamMembers.map(m => m.role)))], []);
  const depts = useMemo(() => ["all", ...Array.from(new Set(Object.values(profiles).map(p => p.department)))], [profiles]);

  const onlineCount = useMemo(() => Object.values(profiles).filter(p => p.status === "online").length, [profiles]);

  const membersWithStats = useMemo(() => {
    return teamMembers.map(m => {
      const mt = tasks.filter(t => t.assignee?.id === m.id);
      const done = mt.filter(t => t.status === "done").length;
      const inProgress = mt.filter(t => t.status === "in_progress").length;
      const inReview = mt.filter(t => t.status === "in_review").length;
      const overdue = mt.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length;
      const pct = mt.length > 0 ? (done / mt.length) * 100 : 0;
      const timeSpent = mt.reduce((a, t) => a + (t.timeSpent || 0), 0);
      const profile = profiles[m.id] || { status: "offline" as const, department: "Unknown", location: "Unknown", joinDate: "2025-01-01", phone: "", skills: [], starred: false, id: m.id };
      return { ...m, total: mt.length, done, inProgress, inReview, overdue, pct, timeSpent, profile };
    });
  }, [tasks, profiles]);

  const filtered = useMemo(() => {
    return membersWithStats.filter(m => {
      const matchSearch = !searchQ || m.name.toLowerCase().includes(searchQ.toLowerCase()) || m.email.toLowerCase().includes(searchQ.toLowerCase()) || m.profile.department.toLowerCase().includes(searchQ.toLowerCase());
      const matchRole = filterRole === "all" || m.role === filterRole;
      const matchStatus = filterStatus === "all" || m.profile.status === filterStatus;
      const matchDept = filterDept === "all" || m.profile.department === filterDept;
      return matchSearch && matchRole && matchStatus && matchDept;
    }).sort((a, b) => {
      switch (sortBy) {
        case "tasks": return b.total - a.total;
        case "completion": return b.pct - a.pct;
        case "role": return a.role.localeCompare(b.role);
        default: return a.name.localeCompare(b.name);
      }
    });
  }, [membersWithStats, searchQ, filterRole, filterStatus, filterDept, sortBy]);

  const toggleStar = (id: string) => {
    setProfiles(prev => ({ ...prev, [id]: { ...prev[id], starred: !prev[id]?.starred } }));
  };

  const sendInvite = () => {
    if (!inviteEmail.trim()) return;
    toast.success(`Đã gửi lời mời đến ${inviteEmail}`);
    setInviteEmail("");
    setShowInvite(false);
  };

  const selectedMemberData = selectedMember ? membersWithStats.find(m => m.id === selectedMember) : null;

  const fmtMins = (m: number) => { const h = Math.floor(m / 60); return h > 0 ? `${h}h ${m % 60}m` : `${m}m`; };

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50" onClick={() => setCtxMenu(null)}>
      <div className="flex h-full">
        {/* Main content */}
        <div className={`flex-1 p-6 overflow-auto ${selectedMember ? "max-w-[calc(100%-340px)]" : ""}`}>
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-md shadow-violet-500/20">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-gray-900 tracking-tight">Team</h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">{teamMembers.length} thành viên · {onlineCount} online</p>
                </div>
              </div>
              <button onClick={() => setShowInvite(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-[11px] px-4 py-2 rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm shadow-cyan-500/20">
                <Plus className="w-3.5 h-3.5" /> Mời thành viên
              </button>
            </div>

            {/* Status pills */}
            <div className="flex items-center gap-2 mb-4">
              {(["online", "away", "busy", "offline"] as const).map(s => {
                const count = Object.values(profiles).filter(p => p.status === s).length;
                const cfg = statusConfig[s];
                return (
                  <div key={s} className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-gray-200">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span className="text-[10px] text-gray-600">{cfg.label}</span>
                    <span className="text-[10px] text-gray-400">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-4">
              {([
                ["members", "Members", <Users key="m" className="w-3.5 h-3.5" />],
                ["performance", "Performance", <BarChart3 key="p" className="w-3.5 h-3.5" />],
                ["activity", "Activity", <Activity key="a" className="w-3.5 h-3.5" />],
                ["org", "Org Chart", <Target key="o" className="w-3.5 h-3.5" />],
              ] as [ViewTab, string, React.ReactNode][]).map(([key, label, icon]) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-[11px] rounded-xl transition-all ${activeTab === key ? "bg-white shadow-sm text-gray-800 border border-gray-200" : "text-gray-500 hover:bg-gray-100"}`}>
                  {icon} {label}
                </button>
              ))}
              <div className="flex-1" />
              {activeTab === "members" && (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
                    <button onClick={() => setViewMode("grid")} className={`w-7 h-7 rounded-md flex items-center justify-center ${viewMode === "grid" ? "bg-white shadow-sm text-gray-700" : "text-gray-400"}`}><Grid3X3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setViewMode("list")} className={`w-7 h-7 rounded-md flex items-center justify-center ${viewMode === "list" ? "bg-white shadow-sm text-gray-700" : "text-gray-400"}`}><List className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              )}
            </div>

            {/* Filters */}
            {activeTab === "members" && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm thành viên..."
                    className="w-full pl-9 pr-3 py-2 text-[11px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-cyan-300 text-gray-700" />
                </div>
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                  className="text-[10px] bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-600 focus:outline-none">
                  {roles.map(r => <option key={r} value={r}>{r === "all" ? "All Roles" : r}</option>)}
                </select>
                <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
                  className="text-[10px] bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-600 focus:outline-none">
                  {depts.map(d => <option key={d} value={d}>{d === "all" ? "All Departments" : d}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="text-[10px] bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-600 focus:outline-none">
                  <option value="all">All Status</option>
                  {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}
                  className="text-[10px] bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-600 focus:outline-none">
                  <option value="name">Sort: Name</option>
                  <option value="tasks">Sort: Tasks</option>
                  <option value="completion">Sort: Completion</option>
                  <option value="role">Sort: Role</option>
                </select>
              </div>
            )}

            {/* MEMBERS TAB */}
            {activeTab === "members" && viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map(member => {
                  const st = statusConfig[member.profile.status];
                  return (
                    <div key={member.id} onClick={() => setSelectedMember(member.id)}
                      className={`bg-white rounded-2xl border p-5 hover:shadow-md transition-all group cursor-pointer shadow-sm ${selectedMember === member.id ? "border-cyan-300 ring-1 ring-cyan-100" : "border-gray-200 hover:border-gray-300"}`}>
                      <div className="flex items-start gap-3 mb-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] text-white" style={{ backgroundColor: member.color }}>{member.name.charAt(0)}</div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white" style={{ backgroundColor: st.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[13px] text-gray-900 truncate">{member.name}</p>
                            {roleIcons[member.role] && roleIcons[member.role]}
                            {member.profile.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                          </div>
                          <p className="text-[10px] text-gray-500">{member.role}</p>
                          <p className="text-[9px] mt-0.5" style={{ color: st.color }}>{st.label}{member.profile.statusText ? ` · ${member.profile.statusText}` : ""}</p>
                        </div>
                        <div className="relative">
                          <button onClick={e => { e.stopPropagation(); setCtxMenu(ctxMenu === member.id ? null : member.id); }}
                            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                          {ctxMenu === member.id && (
                            <div className="absolute right-0 top-full mt-1 w-[160px] bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1" onClick={e => e.stopPropagation()}>
                              <button onClick={() => { toggleStar(member.id); setCtxMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50">
                                {member.profile.starred ? <StarOff className="w-3 h-3 text-gray-400" /> : <Star className="w-3 h-3 text-gray-400" />}
                                {member.profile.starred ? "Bỏ star" : "Star"}
                              </button>
                              <button onClick={() => { setCtxMenu(null); onStartDM?.(member.name, member.id); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50"><MessageSquare className="w-3 h-3 text-gray-400" /> Nhắn tin</button>
                              <button className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50"><Mail className="w-3 h-3 text-gray-400" /> Gửi email</button>
                              <button className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50"><Copy className="w-3 h-3 text-gray-400" /> Copy email</button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center bg-gray-50 rounded-lg py-1.5"><p className="text-[14px] text-gray-800">{member.total}</p><p className="text-[8px] text-gray-400">Tasks</p></div>
                        <div className="text-center bg-emerald-50 rounded-lg py-1.5"><p className="text-[14px] text-emerald-700">{member.done}</p><p className="text-[8px] text-emerald-600">Done</p></div>
                        <div className="text-center bg-cyan-50 rounded-lg py-1.5"><p className="text-[14px] text-cyan-700">{member.inProgress}</p><p className="text-[8px] text-cyan-600">Active</p></div>
                      </div>
                      <div className="h-[3px] bg-gray-100 rounded-full overflow-hidden mb-1.5">
                        <div className="h-full rounded-full transition-all" style={{ width: `${member.pct}%`, backgroundColor: member.color }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: st.bg, color: st.color }}>{member.profile.department}</span>
                          {member.overdue > 0 && <span className="text-[8px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">⚠ {member.overdue}</span>}
                        </div>
                        <span className="text-[9px] text-gray-400">{Math.round(member.pct)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "members" && viewMode === "list" && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="grid grid-cols-[1fr_100px_80px_80px_80px_80px_40px] px-5 py-2 bg-gray-50 border-b border-gray-100 text-[9px] text-gray-400 uppercase tracking-wider">
                  <span>Member</span><span>Department</span><span className="text-center">Tasks</span><span className="text-center">Done</span><span className="text-center">Progress</span><span className="text-center">Status</span><span />
                </div>
                {filtered.map((member, i) => {
                  const st = statusConfig[member.profile.status];
                  return (
                    <div key={member.id} onClick={() => setSelectedMember(member.id)}
                      className={`grid grid-cols-[1fr_100px_80px_80px_80px_80px_40px] items-center px-5 py-3 hover:bg-gray-50 cursor-pointer transition-all group ${i < filtered.length - 1 ? "border-b border-gray-50" : ""} ${selectedMember === member.id ? "bg-cyan-50/30" : ""}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] text-white" style={{ backgroundColor: member.color }}>{member.name.charAt(0)}</div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ backgroundColor: st.color }} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[12px] text-gray-800 truncate">{member.name}</p>
                            {member.profile.starred && <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
                          </div>
                          <p className="text-[9px] text-gray-400 truncate">{member.role}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500">{member.profile.department}</span>
                      <span className="text-[12px] text-gray-700 text-center">{member.total}</span>
                      <span className="text-[12px] text-emerald-600 text-center">{member.done}</span>
                      <div className="flex items-center gap-1.5 justify-center">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${member.pct}%`, backgroundColor: member.color }} /></div>
                        <span className="text-[9px] text-gray-400">{Math.round(member.pct)}%</span>
                      </div>
                      <div className="flex justify-center"><span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span></div>
                      <button onClick={e => { e.stopPropagation(); setCtxMenu(ctxMenu === member.id ? null : member.id); }}
                        className="w-6 h-6 rounded flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-gray-100">
                        <MoreHorizontal className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* PERFORMANCE TAB */}
            {activeTab === "performance" && (
              <div className="space-y-4">
                {/* Top performers */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-[13px] text-gray-700 mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" /> Top Performers</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[...membersWithStats].sort((a, b) => b.pct - a.pct).slice(0, 3).map((m, i) => (
                      <div key={m.id} className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-[20px] mb-1">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</div>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] text-white mx-auto mb-2" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                        <p className="text-[12px] text-gray-800">{m.name.split(" ").slice(-2).join(" ")}</p>
                        <p className="text-[10px] text-gray-400">{m.role}</p>
                        <p className="text-[16px] text-gray-800 mt-1">{Math.round(m.pct)}%</p>
                        <p className="text-[9px] text-gray-400">{m.done}/{m.total} tasks</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workload comparison */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-[13px] text-gray-700 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-gray-400" /> Workload Distribution</h3>
                  <div className="space-y-3">
                    {membersWithStats.sort((a, b) => b.total - a.total).map(m => {
                      const maxTasks = Math.max(...membersWithStats.map(mm => mm.total), 1);
                      return (
                        <div key={m.id} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white shrink-0" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                          <span className="text-[11px] text-gray-600 w-28 truncate">{m.name.split(" ").slice(-2).join(" ")}</span>
                          <div className="flex-1 h-5 bg-gray-50 rounded-lg overflow-hidden flex">
                            <div className="h-full bg-emerald-400 transition-all" style={{ width: `${(m.done / maxTasks) * 100}%` }} title={`Done: ${m.done}`} />
                            <div className="h-full bg-cyan-400 transition-all" style={{ width: `${(m.inProgress / maxTasks) * 100}%` }} title={`In Progress: ${m.inProgress}`} />
                            <div className="h-full bg-amber-400 transition-all" style={{ width: `${(m.inReview / maxTasks) * 100}%` }} title={`In Review: ${m.inReview}`} />
                            <div className="h-full bg-gray-200 transition-all" style={{ width: `${((m.total - m.done - m.inProgress - m.inReview) / maxTasks) * 100}%` }} title={`Todo`} />
                          </div>
                          <span className="text-[10px] text-gray-500 w-6 text-right">{m.total}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-3 justify-center">
                    {[{ l: "Done", c: "bg-emerald-400" }, { l: "In Progress", c: "bg-cyan-400" }, { l: "In Review", c: "bg-amber-400" }, { l: "Todo", c: "bg-gray-200" }].map(i => (
                      <span key={i.l} className="flex items-center gap-1 text-[9px] text-gray-400"><div className={`w-2.5 h-2.5 rounded-sm ${i.c}`} /> {i.l}</span>
                    ))}
                  </div>
                </div>

                {/* Stats table */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="grid grid-cols-[1fr_65px_65px_65px_65px_70px_70px] px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-[9px] text-gray-400 uppercase tracking-wider">
                    <span>Member</span><span className="text-center">Total</span><span className="text-center">Done</span><span className="text-center">Active</span><span className="text-center">Overdue</span><span className="text-center">Time</span><span className="text-center">Rate</span>
                  </div>
                  {membersWithStats.sort((a, b) => b.pct - a.pct).map((m, i) => (
                    <div key={m.id} className={`grid grid-cols-[1fr_65px_65px_65px_65px_70px_70px] items-center px-5 py-2.5 ${i < membersWithStats.length - 1 ? "border-b border-gray-50" : ""} hover:bg-gray-50 transition-all`}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                        <div><p className="text-[11px] text-gray-800">{m.name.split(" ").slice(-2).join(" ")}</p><p className="text-[9px] text-gray-400">{m.role}</p></div>
                      </div>
                      <span className="text-[12px] text-gray-700 text-center">{m.total}</span>
                      <span className="text-[12px] text-emerald-600 text-center">{m.done}</span>
                      <span className="text-[12px] text-cyan-600 text-center">{m.inProgress}</span>
                      <span className={`text-[12px] text-center ${m.overdue > 0 ? "text-red-500" : "text-gray-400"}`}>{m.overdue || "—"}</span>
                      <span className="text-[11px] text-gray-500 text-center">{fmtMins(m.timeSpent)}</span>
                      <div className="flex justify-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${m.pct >= 75 ? "bg-emerald-50 text-emerald-600" : m.pct >= 50 ? "bg-cyan-50 text-cyan-600" : m.pct >= 25 ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-500"}`}>{Math.round(m.pct)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACTIVITY TAB */}
            {activeTab === "activity" && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-[13px] text-gray-700 flex items-center gap-2"><Activity className="w-4 h-4 text-gray-400" /> Recent Activity</h3>
                  <span className="text-[10px] text-gray-400">{recentActivity.length} events</span>
                </div>
                <div className="relative">
                  <div className="absolute left-[39px] top-0 bottom-0 w-px bg-gray-100" />
                  {recentActivity.map((act, i) => {
                    const member = teamMembers.find(m => m.id === act.member);
                    if (!member) return null;
                    const actionColors: Record<string, string> = {
                      completed: "#059669", "created PR": "#7c3aed", updated: "#0891b2", started: "#d97706",
                      merged: "#059669", reviewed: "#6b7280", "reported bug": "#dc2626", uploaded: "#db2777", deployed: "#059669",
                    };
                    const color = actionColors[act.action] || "#6b7280";
                    return (
                      <div key={act.id} className={`flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-all ${i < recentActivity.length - 1 ? "" : ""}`}>
                        <div className="relative z-10">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] text-white" style={{ backgroundColor: member.color }}>{member.name.charAt(0)}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-gray-700">
                            <span className="text-gray-900">{member.name.split(" ").slice(-2).join(" ")}</span>
                            {" "}<span style={{ color }}>{act.action}</span>{" "}
                            <span className="text-gray-600">{act.target}</span>
                          </p>
                          <p className="text-[9px] text-gray-400 mt-0.5">{act.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ORG CHART TAB */}
            {activeTab === "org" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-[13px] text-gray-700 mb-6 flex items-center gap-2"><Target className="w-4 h-4 text-violet-500" /> Organization Structure</h3>
                  
                  {/* CEO/Lead level */}
                  <div className="flex justify-center mb-8">
                    {(() => {
                      const lead = membersWithStats.find(m => m.role === "Team Lead");
                      if (!lead) return null;
                      const st = statusConfig[lead.profile.status];
                      return (
                        <div className="text-center">
                          <div className="relative inline-block">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center text-[20px] text-white mx-auto border-3 border-amber-300 shadow-lg" style={{ backgroundColor: lead.color }}>{lead.name.charAt(0)}</div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: st.color }} />
                            <Crown className="absolute -top-2 -right-2 w-5 h-5 text-amber-400" />
                          </div>
                          <p className="text-[12px] text-gray-900 mt-2">{lead.name}</p>
                          <p className="text-[9px] text-gray-500">{lead.role}</p>
                          <p className="text-[9px] text-gray-400">{lead.profile.department}</p>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Connector line */}
                  <div className="flex justify-center mb-4">
                    <div className="w-px h-8 bg-gray-200" />
                  </div>
                  <div className="flex justify-center mb-4">
                    <div className="w-3/4 h-px bg-gray-200" />
                  </div>

                  {/* Department level */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from(new Set(Object.values(profiles).map(p => p.department))).map(dept => {
                      const deptMembers = membersWithStats.filter(m => m.profile.department === dept && m.role !== "Team Lead");
                      const deptColor = deptMembers[0]?.color || "#6b7280";
                      return (
                        <div key={dept} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: deptColor }} />
                            <span className="text-[11px] text-gray-700">{dept}</span>
                            <span className="text-[9px] text-gray-400 ml-auto">{deptMembers.length}</span>
                          </div>
                          <div className="space-y-2">
                            {deptMembers.map(m => {
                              const st = statusConfig[m.profile.status];
                              return (
                                <div key={m.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 cursor-pointer hover:border-gray-200 hover:shadow-sm transition-all"
                                  onClick={() => setSelectedMember(m.id)}>
                                  <div className="relative">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] text-white" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ backgroundColor: st.color }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-gray-800 truncate">{m.name.split(" ").slice(-2).join(" ")}</p>
                                    <p className="text-[8px] text-gray-400">{m.role}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[9px] text-gray-600">{m.total} tasks</p>
                                    <p className="text-[8px] text-emerald-500">{Math.round(m.pct)}%</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Department summary */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-[13px] text-gray-700 mb-4">Department Summary</h3>
                  <div className="space-y-2">
                    {Array.from(new Set(Object.values(profiles).map(p => p.department))).map(dept => {
                      const deptMembers = membersWithStats.filter(m => m.profile.department === dept);
                      const totalTasks = deptMembers.reduce((a, m) => a + m.total, 0);
                      const doneTasks = deptMembers.reduce((a, m) => a + m.done, 0);
                      const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
                      const onlineCount = deptMembers.filter(m => m.profile.status === "online").length;
                      return (
                        <div key={dept} className="flex items-center gap-3 py-2">
                          <span className="text-[11px] text-gray-700 w-28">{dept}</span>
                          <span className="text-[10px] text-gray-400 w-16">{deptMembers.length} members</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-violet-400 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-500 w-8 text-right">{pct}%</span>
                          <span className="text-[10px] text-gray-400 w-16 text-right">{doneTasks}/{totalTasks}</span>
                          <span className="text-[9px] text-emerald-500 w-12 text-right">{onlineCount} on</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Availability Calendar */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-[13px] text-gray-700 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-cyan-500" /> Team Availability — This Week</h3>
                  <div className="overflow-x-auto">
                    <div className="min-w-[500px]">
                      <div className="grid grid-cols-[120px_repeat(5,1fr)] gap-1 mb-2">
                        <div />
                        {["Mon 17", "Tue 18", "Wed 19", "Thu 20", "Fri 21"].map(d => (
                          <div key={d} className="text-[9px] text-gray-400 text-center py-1">{d}</div>
                        ))}
                      </div>
                      {membersWithStats.map(m => {
                        const avail = [
                          m.profile.status === "online" ? "available" : m.profile.status === "busy" ? "busy" : "partial",
                          "available", "partial", "available",
                          m.profile.status === "offline" ? "off" : "available"
                        ] as const;
                        const colorMap = { available: { bg: "#ecfdf5", text: "#059669", label: "Available" }, partial: { bg: "#fefce8", text: "#d97706", label: "Partial" }, busy: { bg: "#fef2f2", text: "#dc2626", label: "Busy" }, off: { bg: "#f9fafb", text: "#9ca3af", label: "Off" } };
                        return (
                          <div key={m.id} className="grid grid-cols-[120px_repeat(5,1fr)] gap-1 mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                              <span className="text-[10px] text-gray-600 truncate">{m.name.split(" ").slice(-2).join(" ")}</span>
                            </div>
                            {avail.map((a, i) => {
                              const c = colorMap[a];
                              return (
                                <div key={i} className="h-7 rounded-lg flex items-center justify-center text-[8px] cursor-pointer hover:opacity-80 transition-all"
                                  style={{ backgroundColor: c.bg, color: c.text }}>
                                  {c.label}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                      <div className="flex items-center gap-3 mt-2 justify-center">
                        {[{ l: "Available", bg: "#ecfdf5", c: "#059669" }, { l: "Partial", bg: "#fefce8", c: "#d97706" }, { l: "Busy", bg: "#fef2f2", c: "#dc2626" }, { l: "Off", bg: "#f9fafb", c: "#9ca3af" }].map(x => (
                          <span key={x.l} className="flex items-center gap-1 text-[8px] text-gray-400"><div className="w-3 h-3 rounded" style={{ backgroundColor: x.bg, border: `1px solid ${x.c}30` }} />{x.l}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Member detail panel */}
        {selectedMemberData && (
          <div className="w-[340px] border-l border-gray-200 bg-white overflow-auto shrink-0">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] text-gray-400">Member Profile</span>
                <button onClick={() => setSelectedMember(null)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
              </div>

              {/* Avatar & name */}
              <div className="text-center mb-5">
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-[28px] text-white mx-auto" style={{ backgroundColor: selectedMemberData.color }}>{selectedMemberData.name.charAt(0)}</div>
                  <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full border-3 border-white" style={{ backgroundColor: statusConfig[selectedMemberData.profile.status].color }} />
                </div>
                <h3 className="text-[16px] text-gray-900 mt-3">{selectedMemberData.name}</h3>
                <p className="text-[11px] text-gray-500">{selectedMemberData.role}</p>
                {selectedMemberData.profile.statusText && (
                  <p className="text-[10px] mt-1" style={{ color: statusConfig[selectedMemberData.profile.status].color }}>
                    {selectedMemberData.profile.statusText}
                  </p>
                )}
              </div>

              {/* Quick actions */}
              <div className="flex items-center justify-center gap-2 mb-5">
                {[
                  { icon: <MessageSquare className="w-4 h-4" />, label: "Chat", color: "#0891b2" },
                  { icon: <Mail className="w-4 h-4" />, label: "Email", color: "#7c3aed" },
                  { icon: <Phone className="w-4 h-4" />, label: "Call", color: "#059669" },
                  { icon: <Video className="w-4 h-4" />, label: "Video", color: "#d97706" },
                ].map(a => (
                  <button key={a.label} onClick={() => { if (a.label === "Chat") { onStartDM?.(selectedMemberData.name, selectedMemberData.id); } else { toast.success(`${a.label} ${selectedMemberData.name}`); } }}
                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl hover:bg-gray-50 transition-all" title={a.label}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: a.color }}>{a.icon}</div>
                    <span className="text-[8px] text-gray-400">{a.label}</span>
                  </button>
                ))}
              </div>

              {/* Info */}
              <div className="space-y-3 mb-5">
                {[
                  { label: "Email", value: selectedMemberData.email },
                  { label: "Phone", value: selectedMemberData.profile.phone },
                  { label: "Department", value: selectedMemberData.profile.department },
                  { label: "Location", value: selectedMemberData.profile.location },
                  { label: "Joined", value: new Date(selectedMemberData.profile.joinDate).toLocaleDateString("vi-VN") },
                ].map(f => (
                  <div key={f.label} className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">{f.label}</span>
                    <span className="text-[11px] text-gray-700">{f.value}</span>
                  </div>
                ))}
              </div>

              {/* Skills */}
              <div className="mb-5">
                <p className="text-[10px] text-gray-400 mb-2">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {selectedMemberData.profile.skills.map(s => (
                    <span key={s} className="text-[9px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg">{s}</span>
                  ))}
                </div>
              </div>

              {/* Task stats */}
              <div className="mb-5">
                <p className="text-[10px] text-gray-400 mb-2">Task Overview</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-[18px] text-gray-800">{selectedMemberData.total}</p><p className="text-[8px] text-gray-400">Total</p></div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center"><p className="text-[18px] text-emerald-700">{selectedMemberData.done}</p><p className="text-[8px] text-emerald-600">Done</p></div>
                  <div className="bg-cyan-50 rounded-xl p-3 text-center"><p className="text-[18px] text-cyan-700">{selectedMemberData.inProgress}</p><p className="text-[8px] text-cyan-600">Active</p></div>
                  <div className="bg-red-50 rounded-xl p-3 text-center"><p className="text-[18px] text-red-600">{selectedMemberData.overdue}</p><p className="text-[8px] text-red-500">Overdue</p></div>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] text-gray-400">Completion Rate</p>
                  <span className="text-[12px] text-gray-700">{Math.round(selectedMemberData.pct)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${selectedMemberData.pct}%`, backgroundColor: selectedMemberData.color }} />
                </div>
                <p className="text-[9px] text-gray-400 mt-1">Time tracked: {fmtMins(selectedMemberData.timeSpent)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowInvite(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2"><Users className="w-4 h-4 text-violet-500" /><h3 className="text-[15px] text-gray-800">Mời thành viên</h3></div>
              <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-[10px] text-gray-500 mb-1 block">Email *</label>
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="name@company.com" autoFocus
                  className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 text-gray-700" /></div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                  className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-cyan-400 text-gray-700">
                  <option>Developer</option><option>Designer</option><option>QA</option><option>Product Manager</option><option>Team Lead</option>
                </select></div>
              <div className="bg-gray-50 rounded-xl p-3 text-[10px] text-gray-500">
                <p>Người được mời sẽ nhận email với link tham gia workspace.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowInvite(false)} className="text-[12px] text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Cancel</button>
              <button onClick={sendInvite} disabled={!inviteEmail.trim()}
                className="text-[12px] bg-violet-500 text-white px-4 py-1.5 rounded-lg hover:bg-violet-600 disabled:opacity-40">Gửi lời mời</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}