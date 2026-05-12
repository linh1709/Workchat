import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Inbox, AtSign, ArrowRight, CheckCircle2, MessageSquare, Video, Zap,
  AlertTriangle, GitPullRequest, Check, Archive, Search, Filter, X,
  MoreHorizontal, Clock, Bell, BellOff, Star, StarOff, Reply, ExternalLink,
  ChevronDown, Trash2, Eye, EyeOff, AlarmClock, Calendar, Upload,
  UserPlus, Settings, Tag, RefreshCw, CheckSquare, Square, Mail, MailOpen
} from "lucide-react";

/* ============ TYPES ============ */
type NotificationType = "mention" | "assigned" | "comment" | "status_change" | "review" | "update" | "invite" | "deadline" | "file" | "system";

interface Notification {
  id: number;
  text: string;
  detail: string;
  time: string;
  timestamp: number; // for sorting
  type: NotificationType;
  icon: React.ReactNode;
  iconBg: string;
  from: string;
  fromAvatar: string; // color
  fromInitial: string;
  project: string;
  taskId?: string;
  starred?: boolean;
}

type TabFilter = "all" | "unread" | "mentions" | "assigned";
type SnoozeOption = "15m" | "1h" | "3h" | "tomorrow" | "next_week";

/* ============ MOCK DATA ============ */
const now = Date.now();
const min = 60 * 1000;
const hr = 60 * min;

const initialNotifications: Notification[] = [
  {
    id: 1, text: "Trần Hương mentioned you in Website Redesign",
    detail: "\"@Minh anh review mockup trang Products giúp em nhé!\"",
    time: "5 phút trước", timestamp: now - 5 * min,
    type: "mention", icon: <AtSign className="w-4 h-4 text-cyan-600" />, iconBg: "#ecfeff",
    from: "Trần Hương", fromAvatar: "#7c3aed", fromInitial: "TH", project: "Website Redesign", taskId: "t-1"
  },
  {
    id: 2, text: "Bạn được giao task 'API rate limiting'",
    detail: "Phạm Lan giao task này cho bạn với priority High",
    time: "1 giờ trước", timestamp: now - 1 * hr,
    type: "assigned", icon: <ArrowRight className="w-4 h-4 text-violet-600" />, iconBg: "#f3e8ff",
    from: "Phạm Lan", fromAvatar: "#d97706", fromInitial: "PL", project: "API Development", taskId: "t-2"
  },
  {
    id: 3, text: "PR #142 cần review của bạn",
    detail: "Authentication JWT refresh token flow — 12 files changed, +342 -89",
    time: "1.5 giờ trước", timestamp: now - 1.5 * hr,
    type: "review", icon: <GitPullRequest className="w-4 h-4 text-indigo-600" />, iconBg: "#eef2ff",
    from: "Lê Phúc", fromAvatar: "#059669", fromInitial: "LP", project: "Website Redesign", taskId: "t-3"
  },
  {
    id: 4, text: "Lê Phúc đã hoàn thành 'Setup CI/CD pipeline'",
    detail: "Task chuyển sang Done. Build time: 4-5 phút. Auto-deploy activated.",
    time: "2 giờ trước", timestamp: now - 2 * hr,
    type: "status_change", icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, iconBg: "#ecfdf5",
    from: "Lê Phúc", fromAvatar: "#059669", fromInitial: "LP", project: "Website Redesign"
  },
  {
    id: 5, text: "Phạm Lan commented on 'Database schema'",
    detail: "\"Reviewed, LGTM! Nhớ backup trước khi migrate nhé 💪\"",
    time: "3 giờ trước", timestamp: now - 3 * hr,
    type: "comment", icon: <MessageSquare className="w-4 h-4 text-amber-600" />, iconBg: "#fefce8",
    from: "Phạm Lan", fromAvatar: "#d97706", fromInitial: "PL", project: "API Development", taskId: "t-5"
  },
  {
    id: 6, text: "Sprint 12 — Daily standup summary",
    detail: "4 tasks In Progress, 2 cần Review, 3 Overdue. Team velocity: 12 pts/sprint",
    time: "4 giờ trước", timestamp: now - 4 * hr,
    type: "system", icon: <Zap className="w-4 h-4 text-cyan-600" />, iconBg: "#ecfeff",
    from: "VWork Bot", fromAvatar: "#0891b2", fromInitial: "VB", project: "Sprint 12"
  },
  {
    id: 7, text: "Task 'Authentication' sắp hết hạn",
    detail: "Deadline: 18/03/2026 — Đang In Progress. Còn 1 ngày nữa.",
    time: "5 giờ trước", timestamp: now - 5 * hr,
    type: "deadline", icon: <AlertTriangle className="w-4 h-4 text-red-600" />, iconBg: "#fef2f2",
    from: "System", fromAvatar: "#dc2626", fromInitial: "S", project: "Website Redesign", taskId: "t-7"
  },
  {
    id: 8, text: "Hoàng Đức mời bạn vào 'Sprint Planning'",
    detail: "Thứ Tư, 18/03/2026 lúc 9:00 AM — Google Meet",
    time: "1 ngày trước", timestamp: now - 24 * hr,
    type: "invite", icon: <Video className="w-4 h-4 text-violet-600" />, iconBg: "#f3e8ff",
    from: "Hoàng Đức", fromAvatar: "#db2777", fromInitial: "HĐ", project: "General"
  },
  {
    id: 9, text: "Trần Hương uploaded 'Design_System_v2.fig'",
    detail: "File uploaded to Design Assets folder — 24.5 MB",
    time: "1 ngày trước", timestamp: now - 26 * hr,
    type: "file", icon: <Upload className="w-4 h-4 text-teal-600" />, iconBg: "#f0fdfa",
    from: "Trần Hương", fromAvatar: "#7c3aed", fromInitial: "TH", project: "Website Redesign"
  },
  {
    id: 10, text: "Nguyễn Minh đổi status 'Landing Page' → In Review",
    detail: "Task chuyển từ In Progress sang In Review. Assignee: Trần Hương",
    time: "2 ngày trước", timestamp: now - 48 * hr,
    type: "status_change", icon: <RefreshCw className="w-4 h-4 text-blue-600" />, iconBg: "#eff6ff",
    from: "Nguyễn Minh", fromAvatar: "#0891b2", fromInitial: "NM", project: "Website Redesign"
  },
  {
    id: 11, text: "Bạn được thêm vào project 'Mobile App v2'",
    detail: "Hoàng Đức đã thêm bạn với role Member",
    time: "3 ngày trước", timestamp: now - 72 * hr,
    type: "invite", icon: <UserPlus className="w-4 h-4 text-green-600" />, iconBg: "#f0fdf4",
    from: "Hoàng Đức", fromAvatar: "#db2777", fromInitial: "HĐ", project: "Mobile App v2"
  },
  {
    id: 12, text: "Goal 'Q1 Revenue Target' check-in overdue",
    detail: "Weekly check-in chưa cập nhật. Current progress: 68%",
    time: "3 ngày trước", timestamp: now - 74 * hr,
    type: "deadline", icon: <AlertTriangle className="w-4 h-4 text-orange-600" />, iconBg: "#fff7ed",
    from: "System", fromAvatar: "#ea580c", fromInitial: "S", project: "Goals — Q1"
  },
];

const snoozeOptions: { key: SnoozeOption; label: string; icon: React.ReactNode }[] = [
  { key: "15m", label: "15 phút", icon: <Clock className="w-3.5 h-3.5" /> },
  { key: "1h", label: "1 giờ", icon: <Clock className="w-3.5 h-3.5" /> },
  { key: "3h", label: "3 giờ", icon: <Clock className="w-3.5 h-3.5" /> },
  { key: "tomorrow", label: "Ngày mai", icon: <Calendar className="w-3.5 h-3.5" /> },
  { key: "next_week", label: "Tuần sau", icon: <Calendar className="w-3.5 h-3.5" /> },
];

const emptyStateMessages: Record<TabFilter, { icon: React.ReactNode; title: string; desc: string }> = {
  all: { icon: <Inbox className="w-10 h-10 text-gray-200" />, title: "Inbox trống", desc: "Bạn đã xử lý hết thông báo! 🎉" },
  unread: { icon: <MailOpen className="w-10 h-10 text-gray-200" />, title: "Không có thông báo chưa đọc", desc: "Tất cả đã được đọc. Làm việc hiệu quả!" },
  mentions: { icon: <AtSign className="w-10 h-10 text-gray-200" />, title: "Chưa có ai nhắc đến bạn", desc: "Khi ai đó @mention bạn, nó sẽ xuất hiện ở đây" },
  assigned: { icon: <ArrowRight className="w-10 h-10 text-gray-200" />, title: "Không có task được giao", desc: "Bạn chưa được giao task mới nào gần đây" },
};

/* ============ COMPONENT ============ */
export function InboxView() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [readIds, setReadIds] = useState<Set<number>>(new Set([4, 8, 10, 11]));
  const [archivedIds, setArchivedIds] = useState<Set<number>>(new Set());
  const [snoozedIds, setSnoozedIds] = useState<Set<number>>(new Set());
  const [starredIds, setStarredIds] = useState<Set<number>>(new Set([1, 3]));
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterPerson, setFilterPerson] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<NotificationType | null>(null);
  const [snoozeMenuId, setSnoozeMenuId] = useState<number | null>(null);
  const [moreMenuId, setMoreMenuId] = useState<number | null>(null);
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const replyRef = useRef<HTMLInputElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setSnoozeMenuId(null);
      setMoreMenuId(null);
      setShowFilterMenu(false);
    };
    if (snoozeMenuId || moreMenuId || showFilterMenu) {
      document.addEventListener("click", handler);
      return () => document.removeEventListener("click", handler);
    }
  }, [snoozeMenuId, moreMenuId, showFilterMenu]);

  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  useEffect(() => {
    if (replyingId) setTimeout(() => replyRef.current?.focus(), 50);
  }, [replyingId]);

  // Derived data
  const activeNotifications = useMemo(() =>
    notifications.filter(n => !archivedIds.has(n.id) && !snoozedIds.has(n.id)),
    [notifications, archivedIds, snoozedIds]
  );

  const uniquePersons = useMemo(() => [...new Set(activeNotifications.map(n => n.from))], [activeNotifications]);
  const uniqueProjects = useMemo(() => [...new Set(activeNotifications.map(n => n.project))], [activeNotifications]);
  const uniqueTypes = useMemo(() => [...new Set(activeNotifications.map(n => n.type))], [activeNotifications]);

  const typeLabels: Record<NotificationType, string> = {
    mention: "Nhắc tên", assigned: "Giao việc", comment: "Bình luận", status_change: "Thay đổi status",
    review: "Review", update: "Cập nhật", invite: "Mời", deadline: "Deadline", file: "File", system: "Hệ thống"
  };

  const filtered = useMemo(() => {
    let list = activeNotifications;

    // Tab filter
    if (activeTab === "unread") list = list.filter(n => !readIds.has(n.id));
    else if (activeTab === "mentions") list = list.filter(n => n.type === "mention" || n.type === "comment");
    else if (activeTab === "assigned") list = list.filter(n => n.type === "assigned" || n.type === "deadline");

    // Advanced filters
    if (filterPerson) list = list.filter(n => n.from === filterPerson);
    if (filterProject) list = list.filter(n => n.project === filterProject);
    if (filterType) list = list.filter(n => n.type === filterType);

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(n =>
        n.text.toLowerCase().includes(q) ||
        n.detail.toLowerCase().includes(q) ||
        n.from.toLowerCase().includes(q) ||
        n.project.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [activeNotifications, activeTab, readIds, filterPerson, filterProject, filterType, searchQuery]);

  const unreadCount = activeNotifications.filter(n => !readIds.has(n.id)).length;
  const mentionCount = activeNotifications.filter(n => n.type === "mention" || n.type === "comment").length;
  const assignedCount = activeNotifications.filter(n => n.type === "assigned" || n.type === "deadline").length;
  const hasActiveFilters = filterPerson || filterProject || filterType;
  const allSelected = filtered.length > 0 && filtered.every(n => selectedIds.has(n.id));

  // Actions
  const markRead = useCallback((id: number) => setReadIds(p => new Set([...p, id])), []);
  const markUnread = useCallback((id: number) => setReadIds(p => { const ns = new Set(p); ns.delete(id); return ns; }), []);
  const markAllRead = useCallback(() => {
    setReadIds(new Set(activeNotifications.map(n => n.id)));
    toast.success("Đã đánh dấu tất cả là đã đọc");
  }, [activeNotifications]);

  const archiveNotif = useCallback((id: number) => {
    setArchivedIds(p => new Set([...p, id]));
    setSelectedIds(p => { const ns = new Set(p); ns.delete(id); return ns; });
    toast.success("Đã archive thông báo", {
      action: { label: "Hoàn tác", onClick: () => setArchivedIds(p => { const ns = new Set(p); ns.delete(id); return ns; }) }
    });
  }, []);

  const snoozeNotif = useCallback((id: number, option: SnoozeOption) => {
    setSnoozedIds(p => new Set([...p, id]));
    setSnoozeMenuId(null);
    const labels: Record<SnoozeOption, string> = { "15m": "15 phút", "1h": "1 giờ", "3h": "3 giờ", tomorrow: "ngày mai", next_week: "tuần sau" };
    toast.success(`Đã tạm ẩn thông báo — nhắc lại sau ${labels[option]}`, {
      action: { label: "Hoàn tác", onClick: () => setSnoozedIds(p => { const ns = new Set(p); ns.delete(id); return ns; }) }
    });
  }, []);

  const toggleStar = useCallback((id: number) => {
    setStarredIds(p => {
      const ns = new Set(p);
      if (ns.has(id)) { ns.delete(id); toast("Đã bỏ đánh dấu quan trọng"); }
      else { ns.add(id); toast.success("Đã đánh dấu quan trọng ⭐"); }
      return ns;
    });
  }, []);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(p => { const ns = new Set(p); if (ns.has(id)) ns.delete(id); else ns.add(id); return ns; });
  }, []);

  const selectAll = useCallback(() => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(n => n.id)));
  }, [allSelected, filtered]);

  const bulkMarkRead = useCallback(() => {
    setReadIds(p => { const ns = new Set(p); selectedIds.forEach(id => ns.add(id)); return ns; });
    setSelectedIds(new Set());
    toast.success(`Đã đọc ${selectedIds.size} thông báo`);
  }, [selectedIds]);

  const bulkArchive = useCallback(() => {
    const count = selectedIds.size;
    const archived = new Set(selectedIds);
    setArchivedIds(p => new Set([...p, ...archived]));
    setSelectedIds(new Set());
    toast.success(`Đã archive ${count} thông báo`, {
      action: { label: "Hoàn tác", onClick: () => setArchivedIds(p => { const ns = new Set(p); archived.forEach(id => ns.delete(id)); return ns; }) }
    });
  }, [selectedIds]);

  const sendReply = useCallback((notifId: number) => {
    if (!replyText.trim()) return;
    toast.success("Đã gửi reply: \"" + replyText.trim().slice(0, 40) + (replyText.length > 40 ? "..." : "") + "\"");
    setReplyText("");
    setReplyingId(null);
    markRead(notifId);
  }, [replyText, markRead]);

  const muteType = useCallback((type: NotificationType) => {
    setMoreMenuId(null);
    toast.success(`Đã tắt thông báo loại "${typeLabels[type]}"`);
  }, []);

  const muteProject = useCallback((project: string) => {
    setMoreMenuId(null);
    toast.success(`Đã tắt thông báo từ "${project}"`);
  }, []);

  const clearFilters = useCallback(() => {
    setFilterPerson(null);
    setFilterProject(null);
    setFilterType(null);
    setSearchQuery("");
    setShowSearch(false);
  }, []);

  // Group by date
  const groupedNotifs = useMemo(() => {
    const groups: { label: string; items: typeof filtered }[] = [];
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 7);

    const today: typeof filtered = [];
    const yesterday: typeof filtered = [];
    const thisWeek: typeof filtered = [];
    const older: typeof filtered = [];

    filtered.forEach(n => {
      if (n.timestamp >= todayStart.getTime()) today.push(n);
      else if (n.timestamp >= yesterdayStart.getTime()) yesterday.push(n);
      else if (n.timestamp >= weekStart.getTime()) thisWeek.push(n);
      else older.push(n);
    });

    if (today.length) groups.push({ label: "Hôm nay", items: today });
    if (yesterday.length) groups.push({ label: "Hôm qua", items: yesterday });
    if (thisWeek.length) groups.push({ label: "Tuần này", items: thisWeek });
    if (older.length) groups.push({ label: "Trước đó", items: older });

    return groups;
  }, [filtered]);

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
      <div>

        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Inbox className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-gray-900 tracking-tight">Inbox</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {unreadCount > 0
                  ? <><span className="text-cyan-700 font-medium">{unreadCount} chưa đọc</span> · {activeNotifications.length} thông báo</>
                  : "Tất cả đã đọc ✓"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowSearch(!showSearch)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${showSearch ? "bg-cyan-50 text-cyan-600" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}>
              <Search className="w-4 h-4" />
            </button>
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setShowFilterMenu(!showFilterMenu); }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all relative ${hasActiveFilters ? "bg-cyan-50 text-cyan-600" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}>
                <Filter className="w-4 h-4" />
                {hasActiveFilters && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-500" />}
              </button>

              {/* Filter dropdown */}
              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-[260px] bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-2" onClick={e => e.stopPropagation()}>
                  <div className="px-3 pb-2 mb-1 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500 uppercase tracking-wider">Bộ lọc</span>
                    {hasActiveFilters && <button onClick={clearFilters} className="text-[10px] text-cyan-600 hover:text-cyan-700">Xoá tất cả</button>}
                  </div>

                  {/* By Person */}
                  <div className="px-3 py-1.5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Người gửi</p>
                    <div className="flex flex-wrap gap-1">
                      {uniquePersons.map(p => (
                        <button key={p} onClick={() => setFilterPerson(filterPerson === p ? null : p)}
                          className={`px-2 py-1 rounded-md text-[10px] transition-all ${filterPerson === p ? "bg-cyan-100 text-cyan-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* By Project */}
                  <div className="px-3 py-1.5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Dự án</p>
                    <div className="flex flex-wrap gap-1">
                      {uniqueProjects.map(p => (
                        <button key={p} onClick={() => setFilterProject(filterProject === p ? null : p)}
                          className={`px-2 py-1 rounded-md text-[10px] transition-all ${filterProject === p ? "bg-cyan-100 text-cyan-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* By Type */}
                  <div className="px-3 py-1.5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Loại</p>
                    <div className="flex flex-wrap gap-1">
                      {uniqueTypes.map(t => (
                        <button key={t} onClick={() => setFilterType(filterType === t ? null : t)}
                          className={`px-2 py-1 rounded-md text-[10px] transition-all ${filterType === t ? "bg-cyan-100 text-cyan-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                          {typeLabels[t]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-5 bg-gray-200 mx-0.5" />

            <button onClick={() => { setSelectionMode(!selectionMode); setSelectedIds(new Set()); }}
              className={`text-[11px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all border ${selectionMode ? "bg-cyan-50 text-cyan-700 border-cyan-200" : "text-gray-500 border-gray-200 hover:bg-gray-100"}`}>
              {selectionMode ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
              {selectionMode ? "Chọn" : "Chọn"}
            </button>
          </div>
        </div>

        {/* ===== PRIORITY INBOX SUMMARY ===== */}
        {activeTab === "all" && !searchQuery && !hasActiveFilters && unreadCount > 0 && (
          <div className="mb-5 space-y-3">
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Chưa đọc", value: unreadCount, color: "#0891b2", bg: "#ecfeff", icon: <Mail className="w-3.5 h-3.5" /> },
                { label: "Nhắc tên", value: activeNotifications.filter(n => n.type === "mention").length, color: "#7c3aed", bg: "#f3e8ff", icon: <AtSign className="w-3.5 h-3.5" /> },
                { label: "Cần review", value: activeNotifications.filter(n => n.type === "review").length, color: "#d97706", bg: "#fefce8", icon: <GitPullRequest className="w-3.5 h-3.5" /> },
                { label: "Deadline", value: activeNotifications.filter(n => n.type === "deadline").length, color: "#dc2626", bg: "#fef2f2", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-2.5 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: s.bg, color: s.color }}>{s.icon}</div>
                    <span className="text-[16px]" style={{ color: s.color }}>{s.value}</span>
                  </div>
                  <p className="text-[8px] text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Priority items banner */}
            {(() => {
              const urgent = activeNotifications.filter(n => !readIds.has(n.id) && (n.type === "mention" || n.type === "review" || n.type === "deadline")).slice(0, 3);
              if (urgent.length === 0) return null;
              return (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-3.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[11px] text-amber-700">Cần xử lý ngay</span>
                    <span className="text-[9px] text-amber-500 ml-auto">{urgent.length} items</span>
                  </div>
                  <div className="space-y-1.5">
                    {urgent.map(n => (
                      <div key={n.id} className="flex items-center gap-2.5 py-1.5 px-2 bg-white/60 rounded-lg cursor-pointer hover:bg-white/80 transition-all"
                        onClick={() => markRead(n.id)}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ backgroundColor: n.fromAvatar }}>{n.fromInitial}</div>
                        <p className="text-[11px] text-gray-700 flex-1 truncate">{n.text}</p>
                        <span className="text-[9px] text-gray-400 shrink-0">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ===== SEARCH BAR ===== */}
        {showSearch && (
          <div className="mb-4 relative" style={{ animation: "slideDown 0.2s ease" }}>
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input ref={searchRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm trong inbox..."
              className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-300 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* ===== ACTIVE FILTERS PILLS ===== */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <span className="text-[10px] text-gray-400">Đang lọc:</span>
            {filterPerson && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded-full text-[10px]">
                {filterPerson} <button onClick={() => setFilterPerson(null)}><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {filterProject && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-[10px]">
                {filterProject} <button onClick={() => setFilterProject(null)}><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {filterType && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px]">
                {typeLabels[filterType]} <button onClick={() => setFilterType(null)}><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-[10px] text-gray-400 hover:text-gray-600 ml-1">Xoá tất cả</button>
          </div>
        )}

        {/* ===== TABS ===== */}
        <div className="flex items-center gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
          {([
            ["all", "Tất cả", activeNotifications.length],
            ["unread", "Chưa đọc", unreadCount],
            ["mentions", "Nhắc tên", mentionCount],
            ["assigned", "Giao việc", assignedCount],
          ] as [TabFilter, string, number][]).map(([v, l, c]) => (
            <button key={v} onClick={() => setActiveTab(v)}
              className={`px-3.5 py-1.5 text-[11px] rounded-lg transition-all flex items-center gap-1.5 ${activeTab === v ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
              {l}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${activeTab === v ? (v === "unread" && c > 0 ? "bg-cyan-100 text-cyan-700" : "bg-gray-100 text-gray-500") : "text-gray-400"}`}>
                {c}
              </span>
            </button>
          ))}
        </div>

        {/* ===== BULK ACTIONS BAR ===== */}
        {selectionMode && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-cyan-50 rounded-xl border border-cyan-100" style={{ animation: "slideDown 0.15s ease" }}>
            <button onClick={selectAll} className="flex items-center gap-1.5 text-[11px] text-cyan-700 hover:text-cyan-800">
              {allSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
              {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
            {selectedIds.size > 0 && (
              <>
                <div className="w-px h-4 bg-cyan-200" />
                <span className="text-[11px] text-cyan-600">{selectedIds.size} đã chọn</span>
                <div className="flex-1" />
                <button onClick={bulkMarkRead} className="text-[10px] text-cyan-700 hover:bg-cyan-100 px-2 py-1 rounded-lg transition-all flex items-center gap-1">
                  <Check className="w-3 h-3" /> Đã đọc
                </button>
                <button onClick={bulkArchive} className="text-[10px] text-cyan-700 hover:bg-cyan-100 px-2 py-1 rounded-lg transition-all flex items-center gap-1">
                  <Archive className="w-3 h-3" /> Archive
                </button>
              </>
            )}
          </div>
        )}

        {/* ===== QUICK ACTIONS ===== */}
        {!selectionMode && unreadCount > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <button onClick={markAllRead}
              className="text-[11px] text-cyan-700 hover:text-cyan-800 px-3 py-1.5 rounded-lg hover:bg-cyan-50 transition-all border border-cyan-200 flex items-center gap-1.5">
              <Check className="w-3 h-3" /> Đọc tất cả
            </button>
          </div>
        )}

        {/* ===== NOTIFICATION LIST ===== */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            {activeTab === "all" && !searchQuery && !hasActiveFilters && activeNotifications.length === 0 ? (
              <>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <p className="text-[18px] text-gray-800 mb-1">Inbox Zero!</p>
                <p className="text-[12px] text-gray-500">Tuyệt vời! Bạn đã xử lý hết tất cả thông báo.</p>
                <div className="mt-4 inline-flex items-center gap-2 text-[10px] text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">
                  <Zap className="w-3.5 h-3.5" /> Productivity score: 100%
                </div>
              </>
            ) : (
              <>
                {emptyStateMessages[activeTab].icon}
                <p className="text-[14px] text-gray-500 mt-4">{emptyStateMessages[activeTab].title}</p>
                <p className="text-[11px] text-gray-400 mt-1.5">{emptyStateMessages[activeTab].desc}</p>
              </>
            )}
            {(searchQuery || hasActiveFilters) && (
              <button onClick={clearFilters} className="mt-4 text-[11px] text-cyan-600 hover:text-cyan-700 px-3 py-1.5 rounded-lg border border-cyan-200 hover:bg-cyan-50 transition-all">
                Xoá bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {groupedNotifs.map(group => (
              <div key={group.label}>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 px-1">{group.label}</p>
                <div className="space-y-1.5">
                  {group.items.map(n => {
                    const isRead = readIds.has(n.id);
                    const isStarred = starredIds.has(n.id);
                    const isSelected = selectedIds.has(n.id);

                    return (
                      <div key={n.id}>
                        <div
                          onClick={() => { if (selectionMode) toggleSelect(n.id); else markRead(n.id); }}
                          className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer group relative ${
                            isSelected ? "bg-cyan-50 border-cyan-200 ring-1 ring-cyan-200"
                            : isRead ? "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                            : "bg-white border-cyan-200 hover:border-cyan-300 shadow-sm"
                          }`}
                        >
                          {/* Selection checkbox */}
                          {selectionMode && (
                            <button onClick={(e) => { e.stopPropagation(); toggleSelect(n.id); }}
                              className="shrink-0 mt-0.5">
                              {isSelected
                                ? <CheckSquare className="w-4.5 h-4.5 text-cyan-500" />
                                : <Square className="w-4.5 h-4.5 text-gray-300" />}
                            </button>
                          )}

                          {/* Avatar */}
                          <div className="relative shrink-0">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] text-white" style={{ backgroundColor: n.fromAvatar }}>
                              {n.fromInitial}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white" style={{ backgroundColor: n.iconBg }}>
                              <div className="scale-[0.55]">{n.icon}</div>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className={`text-[12.5px] leading-[1.4] ${isRead ? "text-gray-600" : "text-gray-900"}`}>{n.text}</p>
                              {!isRead && <div className="w-2 h-2 rounded-full bg-cyan-500 shrink-0 animate-pulse" />}
                            </div>
                            <p className="text-[11px] text-gray-400 mb-2 leading-[1.4]">{n.detail}</p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                              <span className="flex items-center gap-1">
                                <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: n.fromAvatar }}>{n.fromInitial.charAt(0)}</div>
                                {n.from}
                              </span>
                              <span className="text-gray-300">·</span>
                              <span className="text-gray-400">{n.project}</span>
                              <span className="text-gray-300">·</span>
                              <span>{n.time}</span>
                              {isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                            </div>
                          </div>

                          {/* Action buttons */}
                          {!selectionMode && (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-1">
                              {/* Read/Unread */}
                              <button onClick={e => { e.stopPropagation(); isRead ? markUnread(n.id) : markRead(n.id); }}
                                className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
                                title={isRead ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}>
                                {isRead ? <Mail className="w-3.5 h-3.5" /> : <MailOpen className="w-3.5 h-3.5" />}
                              </button>

                              {/* Star */}
                              <button onClick={e => { e.stopPropagation(); toggleStar(n.id); }}
                                className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-all"
                                title={isStarred ? "Bỏ quan trọng" : "Đánh dấu quan trọng"}>
                                {isStarred ? <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> : <Star className="w-3.5 h-3.5 text-gray-400 hover:text-amber-400" />}
                              </button>

                              {/* Reply */}
                              {(n.type === "mention" || n.type === "comment" || n.type === "review") && (
                                <button onClick={e => { e.stopPropagation(); setReplyingId(replyingId === n.id ? null : n.id); }}
                                  className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
                                  title="Trả lời">
                                  <Reply className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Snooze */}
                              <div className="relative">
                                <button onClick={e => { e.stopPropagation(); setSnoozeMenuId(snoozeMenuId === n.id ? null : n.id); setMoreMenuId(null); }}
                                  className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
                                  title="Tạm ẩn">
                                  <AlarmClock className="w-3.5 h-3.5" />
                                </button>
                                {snoozeMenuId === n.id && (
                                  <div className="absolute right-0 top-full mt-1 w-[160px] bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1" onClick={e => e.stopPropagation()}>
                                    <p className="px-3 py-1 text-[9px] text-gray-400 uppercase tracking-wider">Nhắc lại sau</p>
                                    {snoozeOptions.map(opt => (
                                      <button key={opt.key} onClick={() => snoozeNotif(n.id, opt.key)}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50 transition-all">
                                        <span className="text-gray-400">{opt.icon}</span> {opt.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Archive */}
                              <button onClick={e => { e.stopPropagation(); archiveNotif(n.id); }}
                                className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
                                title="Archive">
                                <Archive className="w-3.5 h-3.5" />
                              </button>

                              {/* More menu */}
                              <div className="relative">
                                <button onClick={e => { e.stopPropagation(); setMoreMenuId(moreMenuId === n.id ? null : n.id); setSnoozeMenuId(null); }}
                                  className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
                                  title="Thêm">
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>
                                {moreMenuId === n.id && (
                                  <div className="absolute right-0 top-full mt-1 w-[220px] bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => muteType(n.type)}
                                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-gray-600 hover:bg-gray-50 transition-all">
                                      <BellOff className="w-3.5 h-3.5 text-gray-400" /> Tắt thông báo loại "{typeLabels[n.type]}"
                                    </button>
                                    <button onClick={() => muteProject(n.project)}
                                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-gray-600 hover:bg-gray-50 transition-all">
                                      <BellOff className="w-3.5 h-3.5 text-gray-400" /> Tắt từ "{n.project}"
                                    </button>
                                    {n.taskId && (
                                      <button onClick={() => { setMoreMenuId(null); toast("Navigating to task..."); }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-gray-600 hover:bg-gray-50 transition-all">
                                        <ExternalLink className="w-3.5 h-3.5 text-gray-400" /> Mở task liên quan
                                      </button>
                                    )}
                                    <div className="h-px bg-gray-100 my-1" />
                                    <button onClick={() => { setMoreMenuId(null); archiveNotif(n.id); }}
                                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-red-500 hover:bg-red-50 transition-all">
                                      <Trash2 className="w-3.5 h-3.5" /> Xoá thông báo
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* ===== INLINE REPLY ===== */}
                        {replyingId === n.id && (
                          <div className="ml-12 mt-1.5 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200" style={{ animation: "slideDown 0.15s ease" }}>
                            <Reply className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <input ref={replyRef} value={replyText} onChange={e => setReplyText(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") sendReply(n.id); if (e.key === "Escape") { setReplyingId(null); setReplyText(""); } }}
                              placeholder={`Trả lời ${n.from}...`}
                              className="flex-1 bg-transparent text-[12px] text-gray-700 placeholder-gray-400 focus:outline-none"
                            />
                            <button onClick={() => sendReply(n.id)} disabled={!replyText.trim()}
                              className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 disabled:hover:bg-cyan-500 text-white text-[10px] rounded-lg transition-all">
                              Gửi
                            </button>
                            <button onClick={() => { setReplyingId(null); setReplyText(""); }}
                              className="text-gray-400 hover:text-gray-600">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== SNOOZED/ARCHIVED COUNT ===== */}
        {(snoozedIds.size > 0 || archivedIds.size > 0) && (
          <div className="mt-6 pt-4 border-t border-gray-200 flex items-center gap-4">
            {snoozedIds.size > 0 && (
              <button onClick={() => { setSnoozedIds(new Set()); toast.success("Đã khôi phục tất cả thông báo đã tạm ẩn"); }}
                className="text-[11px] text-gray-400 hover:text-gray-600 flex items-center gap-1.5 transition-all">
                <AlarmClock className="w-3.5 h-3.5" /> {snoozedIds.size} đang tạm ẩn
              </button>
            )}
            {archivedIds.size > 0 && (
              <button onClick={() => { setArchivedIds(new Set()); toast.success("Đã khôi phục tất cả thông báo đã archive"); }}
                className="text-[11px] text-gray-400 hover:text-gray-600 flex items-center gap-1.5 transition-all">
                <Archive className="w-3.5 h-3.5" /> {archivedIds.size} đã archive
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}