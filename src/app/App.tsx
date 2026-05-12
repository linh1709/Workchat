import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { CommandPalette } from "./components/CommandPalette";
import { Toaster, toast } from "sonner";
import { Dashboard } from "./components/Dashboard";
import { ListView } from "./components/ListView";
import { BoardView } from "./components/BoardView";
import { CalendarView } from "./components/CalendarView";
import { TaskModal } from "./components/TaskModal";
import { ChatView, commonGroups, NotificationPanel, mockNotifications, type AppNotification } from "./components/ChatView";
import { GanttView } from "./components/GanttView";
import { GoalsView } from "./components/GoalsView";
import { SprintsView } from "./components/SprintsView";
import { WorkloadView } from "./components/WorkloadView";
import { AutomationsView } from "./components/AutomationsView";
import { NotepadView } from "./components/NotepadView";
import { RemindersView } from "./components/RemindersView";
import { FormsView } from "./components/FormsView";
import { ActivityView } from "./components/ActivityView";
import { WhiteboardView } from "./components/WhiteboardView";
import { MindMapView } from "./components/MindMapView";
import { OKRView, MeetingView, ProjectDocsView, EmbedView, MapView, ProjectDashboardView, ProjectSprintsView } from "./components/ProjectViews";
import { GamesView } from "./components/GamesView";
import { ELearningView } from "./components/ELearningView";
import { ReportsView } from "./components/ReportsView";
import { GitDevOpsView } from "./components/GitDevOpsView";
import { BotAIView } from "./components/BotAIView";
import { InboxView } from "./components/InboxView";
import { BacklogView } from "./components/BacklogView";
import { EpicCreateModal } from "./components/EpicCreateModal";
import { DocsView } from "./components/DocsView";
import { DashboardsView } from "./components/DashboardsView";
import { TimeTrackingView } from "./components/TimeTrackingView";
import { TeamView } from "./components/TeamView";
import { SettingsView } from "./components/SettingsView";
import { ProjectsSidebar, projectMeta } from "./components/ProjectsSidebar";
import { PersonalSidebar } from "./components/PersonalSidebar";
import { ChannelSidebar } from "./components/ChannelSidebar";
import { BottomNavBar } from "./components/BottomNavBar";
import { AdminProceduresSidebar } from "./components/AdminProceduresSidebar";
import { ProcedureDetailView } from "./components/ProcedureDetailModal";
import { ChannelDetailSidebar, getChannelItemName } from "./components/ChannelDetailSidebar";
import { ChannelItemDetailView } from "./components/ChannelItemDetailView";
import { CrmInvoiceProvider } from "./context/CrmInvoiceContext";
import { initialTasks, type Task, type Sprint, statusConfig, teamMembers, epics, sprints as initialSprints, spaces as allSpaces, type PersonalChatItem, channelItems as defaultChannelItems, type ChannelItem, personalChatItems, companyDirectory } from "./components/data";
export type CustomStatusMap = Record<string, { label: string; color: string }>;
import {
  FileText, BarChart3, Clock, Users, Settings,
  CheckCircle2, Star, Bell, ArrowRight, Calendar,
  MessageSquare, Video, Sparkles, Play, ExternalLink, PhoneIncoming, PhoneOutgoing, PhoneMissed,
  Search, Filter, X, Inbox as InboxIcon, Check, Archive,
  AtSign, AlertTriangle, GitPullRequest, Pause, Square,
  MoreHorizontal, ChevronDown, Grid3X3, List, Eye, EyeOff,
  Globe, Shield, Palette, Database, Moon, Sun, Monitor,
  CreditCard, Zap, UserPlus, Mail, Smartphone, Lock,
  FolderOpen, Tag, TrendingUp, Hash, Layers,
  Bookmark, Heart, Phone, User,
  ChevronLeft, ChevronRight
} from "lucide-react";

function MobileNotificationsScreen({
  notifications,
  onNotificationClick,
}: {
  notifications: AppNotification[];
  onNotificationClick: (n: AppNotification) => void;
}) {
  const [filter, setFilter] = useState<"all" | "personal" | "channel" | "project">("all");
  const filtered = notifications.filter(n => filter === "all" || n.module === filter);
  const unread = notifications.filter(n => !n.read).length;

  const moduleIcon = (module: string) => {
    if (module === "personal") return <User className="w-4 h-4 text-cyan-600" />;
    if (module === "channel") return <Hash className="w-4 h-4 text-indigo-600" />;
    return <Zap className="w-4 h-4 text-amber-500" />;
  };

  const moduleBg: Record<string, string> = {
    personal: "#ecfeff",
    channel: "#eef2ff",
    project: "#fefce8",
  };

  const filterTabs: { key: "all" | "personal" | "channel" | "project"; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "personal", label: "Cá nhân" },
    { key: "channel", label: "Kênh" },
    { key: "project", label: "Dự án" },
  ];

  return (
    <div className="md:hidden fixed inset-0 bottom-16 bg-white z-30 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <p className="text-[20px] text-gray-900" style={{ fontWeight: 700 }}>Thông báo</p>
          {unread > 0 && (
            <span className="text-[11px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">{unread} mới</span>
          )}
        </div>
      </div>
      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-gray-100 bg-white">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all ${
              filter === tab.key ? "bg-cyan-500 text-white shadow-sm" : "bg-gray-100 text-gray-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Notification list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <Bell className="w-8 h-8 text-gray-200" />
            <p className="text-[13px] text-gray-400">Không có thông báo</p>
          </div>
        )}
        {filtered.map(n => (
          <button
            key={n.id}
            onClick={() => { onNotificationClick(n); }}
            className={`w-full flex items-start gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors border-b border-gray-50 text-left ${!n.read ? "bg-cyan-50/40" : ""}`}
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: moduleBg[n.module] }}>
              {moduleIcon(n.module)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[14px] leading-snug ${!n.read ? "text-gray-900 font-semibold" : "text-gray-700"}`}>{n.text}</p>
              <p className="text-[12px] text-gray-400 truncate mt-0.5">{n.detail}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
              <span className="text-[11px] text-gray-400 whitespace-nowrap">{n.time}</span>
              {!n.read && <div className="w-2 h-2 rounded-full bg-cyan-500" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

type ProjectView = { key: string; label: string; icon: React.ReactNode; desc?: string };
const PROJECT_SECTION_GROUPS: { title: string; emoji: string; views: ProjectView[] }[] = [
  {
    title: "Thảo luận",
    emoji: "💬",
    views: [
      { key: "chat", label: "Chat nhóm", icon: <MessageSquare className="w-5 h-5" />, desc: "Nhắn tin, trao đổi" },
      { key: "meeting", label: "Cuộc họp", icon: <Video className="w-5 h-5" />, desc: "Lên lịch & ghi chú họp" },
    ],
  },
  {
    title: "Công việc",
    emoji: "✅",
    views: [
      { key: "list", label: "Danh sách", icon: <List className="w-5 h-5" />, desc: "Xem task dạng danh sách" },
      { key: "board", label: "Bảng Kanban", icon: <Grid3X3 className="w-5 h-5" />, desc: "Kéo thả theo trạng thái" },
      { key: "calendar", label: "Lịch", icon: <Calendar className="w-5 h-5" />, desc: "Xem theo ngày & tuần" },
      { key: "gantt", label: "Gantt", icon: <BarChart3 className="w-5 h-5" />, desc: "Timeline dự án" },
      { key: "backlog", label: "Backlog", icon: <InboxIcon className="w-5 h-5" />, desc: "Danh sách chờ xử lý" },
      { key: "project_sprints", label: "Sprints", icon: <Zap className="w-5 h-5" />, desc: "Quản lý sprint" },
    ],
  },
  {
    title: "Phân tích",
    emoji: "📊",
    views: [
      { key: "project_dashboard", label: "Dashboard", icon: <BarChart3 className="w-5 h-5" />, desc: "Tổng quan dự án" },
      { key: "okr", label: "OKR / Mục tiêu", icon: <TrendingUp className="w-5 h-5" />, desc: "Theo dõi mục tiêu" },
      { key: "timetracking", label: "Chấm công", icon: <Clock className="w-5 h-5" />, desc: "Theo dõi thời gian" },
    ],
  },
  {
    title: "Tài liệu & Dev",
    emoji: "📄",
    views: [
      { key: "project_docs", label: "Tài liệu", icon: <FileText className="w-5 h-5" />, desc: "Wiki & ghi chú dự án" },
      { key: "git_devops", label: "Git & DevOps", icon: <GitPullRequest className="w-5 h-5" />, desc: "Repo & CI/CD" },
    ],
  },
];

function MobileProjectDetailView({
  spaceId,
  onViewSelect,
  onBack,
}: {
  spaceId: string;
  onViewSelect: (view: string) => void;
  onBack: () => void;
}) {
  const space = allSpaces.find(s => s.id === spaceId);
  const meta = projectMeta[spaceId] || { progress: 0, tasksTotal: 0, tasksDone: 0, status: "on_track" as const, lastActivity: "" };
  const statusColor = { on_track: "#059669", at_risk: "#d97706", behind: "#dc2626" }[meta.status];
  const statusLabel = { on_track: "Đúng tiến độ", at_risk: "Có rủi ro", behind: "Chậm tiến độ" }[meta.status];

  if (!space) return null;

  return (
    <div className="flex flex-col flex-1 bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center text-gray-500 rounded-lg hover:bg-gray-100 transition-all shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px] shrink-0 shadow-sm"
          style={{ backgroundColor: space.color }}
        >
          {space.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-gray-900 truncate">{space.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-medium" style={{ color: statusColor }}>{statusLabel}</span>
            <span className="text-[11px] text-gray-400">·</span>
            <span className="text-[11px] text-gray-400">{meta.tasksDone}/{meta.tasksTotal} tasks</span>
          </div>
        </div>
        <Settings className="w-4 h-4 text-gray-400 shrink-0" />
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-2.5 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-gray-500">Tiến độ</span>
          <span className="text-[11px] font-semibold text-gray-700">{meta.progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${meta.progress}%`, backgroundColor: statusColor }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {PROJECT_SECTION_GROUPS.map(group => (
          <div key={group.title}>
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <span className="text-[13px]">{group.emoji}</span>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{group.title}</span>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              {group.views.map((view, idx) => (
                <button
                  key={view.key}
                  onClick={() => onViewSelect(view.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-all text-left ${idx < group.views.length - 1 ? "border-b border-gray-50" : ""}`}
                >
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                    {view.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-gray-800">{view.label}</p>
                    {view.desc && <p className="text-[12px] text-gray-400 truncate">{view.desc}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints);
  const [customStatuses, setCustomStatuses] = useState<CustomStatusMap>({});
  const mergedStatusConfig: CustomStatusMap = { ...statusConfig, ...customStatuses };
  const [currentView, setCurrentView] = useState("chat");
  const [selectedSpace, setSelectedSpace] = useState<string | null>("sp-personal");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [isNewTask, setIsNewTask] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newTaskType, setNewTaskType] = useState<"task" | "story" | "bug">("task");
  const [showEpicModal, setShowEpicModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showProjectsSidebar, setShowProjectsSidebar] = useState(false);
  const [showPersonalSidebar, setShowPersonalSidebar] = useState(true);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifCount = mockNotifications.filter(n => !n.read).length;
  const [mobileSection, setMobileSection] = useState<"personal" | "channel" | "project">("personal");
  const [mobileTab, setMobileTab] = useState<"chat" | "calls" | "notifications" | "more">("chat");
  const [mobileShowChannelChat, setMobileShowChannelChat] = useState(false);
  const [mobileProjectLevel, setMobileProjectLevel] = useState<"list" | "detail" | "view">("list");
  const [selectedPersonalChat, setSelectedPersonalChat] = useState<string | null>(null);
  const allContactNames = [
    "Nguyễn Minh",
    ...companyDirectory.map(c => c.name),
    ...teamMembers.filter(t => t.name !== "Nguyễn Minh").map(t => t.name),
  ];
  const [groupChats, setGroupChats] = useState<PersonalChatItem[]>(() =>
    commonGroups.map(g => ({
      id: g.id, name: g.name, type: "group" as const,
      icon: g.emoji, color: g.color, emoji: g.emoji,
      lastMessage: g.lastMessage, lastTime: g.lastActive,
      members: Array.from({ length: Math.min(g.members, allContactNames.length) }, (_, i) => allContactNames[i]),
    }))
  );
  const [extraDMs, setExtraDMs] = useState<PersonalChatItem[]>([]);
  const [showChannelSidebar, setShowChannelSidebar] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [channels, setChannels] = useState<ChannelItem[]>(defaultChannelItems);
  const [selectedProcedure, setSelectedProcedure] = useState<string | null>(null);
  const [selectedChannelItem, setSelectedChannelItem] = useState<string | null>(null);
  const [publishedAnnouncements, setPublishedAnnouncements] = useState<{ id: string; channelId: string; name: string; emoji: string; subtitle: string; category: string; badge: string; description: string; stats: { label: string; value: string }[]; attachment: string; createdAt: string; publishedBy: string }[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customCategoriesMap, setCustomCategoriesMap] = useState<Record<string, string[]>>({});
  const [deletedCategoryIdsMap, setDeletedCategoryIdsMap] = useState<Record<string, string[]>>({});
  const [deletedStaticAnnouncementsMap, setDeletedStaticAnnouncementsMap] = useState<Record<string, string[]>>({});
  const [categoryNameOverridesMap, setCategoryNameOverridesMap] = useState<Record<string, Record<string, string>>>({});
  const DEFAULT_CATEGORIES = ["Kinh doanh & Chiến lược", "Chính sách & Quy định", "Sự kiện & Hoạt động", "Nhân sự & Tuyển dụng"];
  const CHANNEL_DEFAULT_CATEGORIES: Record<string, string[]> = {
    "ch-announce": DEFAULT_CATEGORIES,
    "ch-tech": ["Frontend & UI/UX", "Backend & API", "DevOps & Cloud", "Mobile Development", "Data & AI/ML", "Security"],
    "ch-workshop": ["Kỹ năng kỹ thuật", "Kỹ năng mềm", "Leadership & Quản lý", "Thiết kế & Sáng tạo"],
    "ch-culture": ["Sự kiện & Hoạt động", "Vinh danh", "Giá trị công ty", "Team Building"],
    "ch-hr": ["Tuyển dụng", "Onboarding", "Chính sách & Phúc lợi", "Đào tạo"],
    "ch-random": ["Chuyện phiếm", "Meme & Vui vẻ", "Chia sẻ hay", "Thảo luận"],
    "ch-health": ["Thể thao", "Yoga & Thiền", "Dinh dưỡng", "Sức khỏe tinh thần"],
    "ch-finance": ["Báo cáo tài chính", "Hóa đơn & Thanh toán", "Ngân sách", "Thuế & Tuân thủ"],
    "ch-support": ["Thông báo kênh", "Quy trình hỗ trợ", "Tài nguyên & Hướng dẫn", "Cập nhật chính sách"],
  };

  // Saved / liked / registered items (persisted across navigation)
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [registeredItems, setRegisteredItems] = useState<Set<string>>(new Set());
  const [closedPolls, setClosedPolls] = useState<Set<string>>(new Set());
  const togglePollClosed = (id: string) => setClosedPolls(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const toggleSave     = (id: string) => setSavedItems(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleLike     = (id: string) => setLikedItems(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleRegister = (id: string) => setRegisteredItems(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  // Navigation history for detail views
  const [navHistory, setNavHistory] = useState<{ channelId: string; itemId: string }[]>([]);
  const [navIndex, setNavIndex] = useState(-1);

  const pushNavHistory = useCallback((channelId: string, itemId: string) => {
    setNavHistory(prev => {
      const trimmed = prev.slice(0, navIndex + 1);
      return [...trimmed, { channelId, itemId }].slice(-30);
    });
    setNavIndex(prev => prev + 1);
  }, [navIndex]);

  const canNavBack = navIndex > 0;
  const canNavForward = navIndex < navHistory.length - 1;

  const navBack = useCallback(() => {
    if (!canNavBack) return;
    const entry = navHistory[navIndex - 1];
    setNavIndex(prev => prev - 1);
    setSelectedChannel(entry.channelId);
    setSelectedChannelItem(entry.itemId);
  }, [canNavBack, navHistory, navIndex]);

  const navForward = useCallback(() => {
    if (!canNavForward) return;
    const entry = navHistory[navIndex + 1];
    setNavIndex(prev => prev + 1);
    setSelectedChannel(entry.channelId);
    setSelectedChannelItem(entry.itemId);
  }, [canNavForward, navHistory, navIndex]);

  // Wrap setSelectedChannelItem to track history
  const selectChannelItem = useCallback((itemId: string | null) => {
    setSelectedChannelItem(itemId);
    if (itemId && selectedChannel) {
      pushNavHistory(selectedChannel, itemId);
    }
  }, [selectedChannel, pushNavHistory]);

  // G-key navigation state
  const gPrefixRef = useRef(false);
  const gTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isTyping = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;

      // ⌘K or Ctrl+K - Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
      // ⌘+Shift+N - New task
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "N") {
        e.preventDefault();
        handleAddTask();
      }
      // Escape - close overlays
      if (e.key === "Escape") {
        if (showShortcuts) { setShowShortcuts(false); e.preventDefault(); return; }
        if (showCommandPalette) { setShowCommandPalette(false); e.preventDefault(); return; }
        if (showModal) { setShowModal(false); e.preventDefault(); return; }
        if (selectedChannelItem) { setSelectedChannelItem(null); e.preventDefault(); return; }
        if (selectedProcedure) { setSelectedProcedure(null); e.preventDefault(); return; }
      }
      // Alt+Left/Right - navigate detail history
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        navBack();
      }
      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        navForward();
      }
      // ? - Keyboard shortcuts help (only when not typing)
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !isTyping) {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
      // G-key navigation (only when not typing)
      if (!isTyping && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === "g" || e.key === "G") {
          if (!gPrefixRef.current) {
            gPrefixRef.current = true;
            if (gTimeoutRef.current) clearTimeout(gTimeoutRef.current);
            gTimeoutRef.current = setTimeout(() => { gPrefixRef.current = false; }, 800);
            return;
          }
        }
        if (gPrefixRef.current) {
          gPrefixRef.current = false;
          if (gTimeoutRef.current) clearTimeout(gTimeoutRef.current);
          const nav = (view: string) => { setCurrentView(view); setSelectedSpace(null); e.preventDefault(); };
          switch (e.key.toLowerCase()) {
            case "h": nav("dashboard"); toast("Navigated to Home", { icon: "🏠" }); break;
            case "i": nav("inbox"); toast("Navigated to Inbox", { icon: "📥" }); break;
            case "d": nav("docs"); toast("Navigated to Docs", { icon: "📄" }); break;
            case "s": nav("settings"); toast("Navigated to Settings", { icon: "⚙️" }); break;
            case "t": nav("team"); toast("Navigated to Team", { icon: "👥" }); break;
            case "g": nav("goals"); toast("Navigated to Goals", { icon: "🎯" }); break;
            case "p": nav("sprints"); toast("Navigated to Sprints", { icon: "⚡" }); break;
            case "w": nav("workload"); toast("Navigated to Workload", { icon: "📊" }); break;
            case "a": nav("activity"); toast("Navigated to Activity", { icon: "📋" }); break;
            case "k": nav("timetracking"); toast("Navigated to Time Tracking", { icon: "⏱️" }); break;
          }
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showShortcuts, showCommandPalette, showModal, selectedChannelItem, selectedProcedure, navBack, navForward]);

  // Derive selectedProject for backward compat: only project-type spaces
  const activeSpace = useMemo(() => allSpaces.find(s => s.id === selectedSpace), [selectedSpace]);
  const selectedProject = activeSpace?.category === "project" ? activeSpace.id : null;

  // Mobile nav unread counts and bot space
  const personalUnread = useMemo(() => personalChatItems.reduce((sum, i) => sum + (i.unread || 0), 0), []);
  const channelUnread = useMemo(() => defaultChannelItems.reduce((sum, c) => sum + (c.unread || 0), 0), []);
  const botSpace = useMemo(() => allSpaces.find(s => s.category === "bot"), []);

  const filteredTasks = tasks.filter(task => {
    const matchSearch = !searchQuery || task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "all" || task.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleTaskClick = useCallback((task: Task) => { setModalTask(task); setIsNewTask(false); setShowModal(true); }, []);
  const handleCreateTaskOnDate = useCallback((dateStr: string) => {
    const newTask: Task = {
      id: `t${Date.now()}`, title: "", description: "", status: "todo", priority: "normal",
      type: "task", tags: [], createdAt: new Date().toISOString().split("T")[0],
      projectId: selectedProject || "p1", dueDate: dateStr,
    };
    setModalTask(newTask); setIsNewTask(true); setShowModal(true);
  }, [selectedProject]);
  const handleAddTask = useCallback((type?: "task" | "story" | "bug" | "epic") => {
    if (type === "epic") { setShowEpicModal(true); return; }
    setNewTaskType(type || "task");
    setModalTask(null); setIsNewTask(true); setShowModal(true);
  }, []);
  const handleSaveTask = useCallback((task: Task) => {
    // Validate epicId belongs to same project
    if (task.epicId) {
      const epic = epics.find(e => e.id === task.epicId);
      if (!epic) { toast.error("Epic không tồn tại"); return; }
      if (epic.projectId !== task.projectId) { toast.error("Epic không thuộc cùng project với task"); return; }
    }
    // Validate sprintId exists
    if (task.sprintId) {
      const sprint = sprints.find(s => s.id === task.sprintId);
      if (!sprint) { toast.error("Sprint không tồn tại"); return; }
    }
    const now = new Date().toISOString();
    const taskWithTimestamp = { ...task, updatedAt: now };
    setTasks(prev => {
      const exists = prev.find(t => t.id === task.id);
      if (exists) {
        toast.success("Task đã được cập nhật", { description: task.title });
        return prev.map(t => t.id === task.id ? taskWithTimestamp : t);
      } else {
        toast.success("Task mới đã được tạo", { description: task.title });
        return [...prev, taskWithTimestamp];
      }
    });
  }, []);
  const handleSaveTaskFromChat = useCallback((task: Task) => {
    handleSaveTask(task);
    setSelectedSpace(task.projectId);
    setCurrentView("backlog");
    setTimeout(() => {
      setModalTask(task);
      setIsNewTask(false);
      setShowModal(true);
    }, 100);
  }, [handleSaveTask]);

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (task) toast.success("Đã xóa task", { description: task.title });
      return prev.filter(t => t.id !== taskId && t.parentId !== taskId);
    });
  }, []);
  const handleStatusChange = useCallback((taskId: string, newStatus: Task["status"]) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  }, []);
  const handleReorderTasks = useCallback((reordered: Task[]) => {
    setTasks(reordered);
  }, []);
  const handleQuickAddTask = useCallback((title: string, status: Task["status"], parentId?: string, type?: string, assigneeId?: string) => {
    const assignee = assigneeId ? teamMembers.find(m => m.id === assigneeId) : undefined;
    setTasks(prev => {
      // Validate parentId
      if (parentId) {
        const parent = prev.find(t => t.id === parentId);
        if (!parent) { toast.error("Task cha không tồn tại"); return prev; }
        if (parent.parentId) { toast.error("Không thể tạo subtask của subtask"); return prev; }
      }
      const newTask: Task = {
        id: `t${Date.now()}`,
        title,
        status,
        priority: "normal",
        type: (type as Task["type"]) || "task",
        tags: [],
        subtasks: [],
        comments: [],
        activityLog: [],
        dependencies: [],
        watchers: [],
        createdAt: new Date().toISOString(),
        projectId: selectedProject || "p1",
        ...(parentId ? { parentId } : {}),
        ...(assignee ? { assignee } : {}),
      };
      toast.success(parentId ? "Subtask đã được tạo" : "Task đã được tạo", { description: title });
      return [...prev, newTask];
    });
  }, [selectedProject]);

  const handleStartDM = useCallback((name: string, userId?: string) => {
    // Check existing DMs (static + dynamic)
    const allDMs = [...(personalChatItems as PersonalChatItem[]).filter(p => p.type === "dm"), ...extraDMs];
    const existing = allDMs.find(d =>
      (userId && d.userId === userId) || d.name === name
    );
    if (existing) {
      setSelectedPersonalChat(existing.id);
      setSelectedSpace("sp-personal");
      setCurrentView("chat");
      setShowPersonalSidebar(true);
    } else {
      const newDM: PersonalChatItem = {
        id: `pc-dm-${userId || name.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`,
        name,
        type: "dm",
        icon: name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
        color: "#0891b2",
        userId,
        online: false,
        lastMessage: "",
        lastTime: "",
      };
      setExtraDMs(prev => [...prev, newDM]);
      setSelectedPersonalChat(newDM.id);
      setSelectedSpace("sp-personal");
      setCurrentView("chat");
      setShowPersonalSidebar(true);
    }
  }, [extraDMs]);

  const handleMobileSectionChange = useCallback((section: "personal" | "channel" | "project") => {
    setMobileSection(section);
    setMobileProjectLevel("list");
    if (section === "personal") {
      setShowPersonalSidebar(true);
      setShowChannelSidebar(false);
      setShowProjectsSidebar(false);
      setSelectedSpace("sp-personal");
      setCurrentView("chat");
    } else if (section === "channel") {
      setShowChannelSidebar(true);
      setShowPersonalSidebar(false);
      setShowProjectsSidebar(false);
      setSelectedSpace("sp-channel");
      setCurrentView("chat");
      if (!selectedChannel) setSelectedChannel("ch-announce");
    } else {
      setShowProjectsSidebar(true);
      setShowPersonalSidebar(false);
      setShowChannelSidebar(false);
      const firstProject = allSpaces.find(s => s.category === "project");
      if (firstProject) { setSelectedSpace(firstProject.id); setCurrentView("chat"); }
    }
  }, [selectedChannel]);

  const handleMobileTabChange = useCallback((tab: "chat" | "calls" | "notifications" | "more") => {
    setMobileTab(tab);
    setMobileProjectLevel("list");
    if (tab === "chat") {
      setCurrentView("chat");
      if (mobileSection === "personal") {
        setShowPersonalSidebar(true);
        setShowChannelSidebar(false);
        setShowProjectsSidebar(false);
        setSelectedSpace("sp-personal");
      } else if (mobileSection === "channel") {
        setShowChannelSidebar(true);
        setShowPersonalSidebar(false);
        setShowProjectsSidebar(false);
        setSelectedSpace("sp-channel");
        if (!selectedChannel) setSelectedChannel("ch-announce");
      } else {
        setShowProjectsSidebar(true);
        setShowPersonalSidebar(false);
        setShowChannelSidebar(false);
      }
    } else if (tab === "calls" || tab === "notifications") {
      setShowPersonalSidebar(false);
      setShowChannelSidebar(false);
      setShowProjectsSidebar(false);
    }
  }, [mobileSection, selectedChannel]);

  const renderContent = () => {
    switch (currentView) {
      case "dashboard": return <Dashboard tasks={filteredTasks} onTaskClick={handleTaskClick} />;
      case "backlog": return <BacklogView tasks={tasks} onTaskClick={handleTaskClick} onSaveTask={handleSaveTask} onDeleteTask={handleDeleteTask} selectedProject={selectedProject} sprints={sprints} onSprintsChange={setSprints} />;
      case "list": return <ListView tasks={filteredTasks} onTaskClick={handleTaskClick} onSaveTask={handleSaveTask} onReorderTasks={handleReorderTasks} onDeleteTask={handleDeleteTask} selectedProject={selectedProject} customStatusConfig={mergedStatusConfig} />;
      case "board": return <BoardView tasks={filteredTasks} onTaskClick={handleTaskClick} onStatusChange={handleStatusChange} onAddTask={handleQuickAddTask} onSaveTask={handleSaveTask} selectedProject={selectedProject} customStatuses={customStatuses} onCustomStatusChange={setCustomStatuses} sprints={sprints} />;
      case "calendar": return <CalendarView tasks={filteredTasks} onTaskClick={handleTaskClick} selectedProject={selectedProject} onSaveTask={handleSaveTask} onCreateTask={handleCreateTaskOnDate} />;
      case "gantt": return <GanttView tasks={filteredTasks} onTaskClick={handleTaskClick} onSaveTask={handleSaveTask} onDeleteTask={handleDeleteTask} onAddTask={handleQuickAddTask} selectedProject={selectedProject} />;
      case "chat": {
        if (selectedProcedure && selectedChannel === "ch-admin" && selectedSpace === "sp-channel") {
          return <ProcedureDetailView procedureId={selectedProcedure} onClose={() => setSelectedProcedure(null)} />;
        }
        const showDetailView = !!(selectedChannelItem && selectedChannel && selectedChannel !== "ch-admin" && selectedSpace === "sp-channel");
        return (
          <div className="h-full w-full flex flex-col min-h-0">
            {/* ChatView always mounted to preserve message state */}
            <div className={showDetailView ? "hidden" : "flex-1 min-h-0 flex flex-col"}>
              <ChatView tasks={tasks} onTaskClick={handleTaskClick} onStatusChange={handleStatusChange} onAddTask={handleAddTask} onSaveTaskFromChat={handleSaveTaskFromChat} selectedSpace={selectedSpace} selectedPersonalChat={selectedPersonalChat} groupChats={groupChats} extraDMs={extraDMs} selectedChannel={selectedChannel} channels={channels} onStartDM={handleStartDM} onUpdateChannel={(id, patch) => setChannels(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))} onPublishAnnouncement={(title, emoji, category, badge, description, stats, attachment, publishedBy) => {
                const now = new Date();
                const chanId = selectedChannel || "ch-announce";
                const prefixMap: Record<string, string> = { "ch-announce": "an", "ch-tech": "te", "ch-workshop": "ws", "ch-culture": "cu", "ch-hr": "hr", "ch-random": "ra", "ch-health": "he", "ch-finance": "fi", "ch-support": "csk" };
                const prefix = prefixMap[chanId] || "an";
                setPublishedAnnouncements(prev => [{
                  id: `${prefix}-custom-${Date.now()}`,
                  channelId: chanId,
                  name: title, emoji,
                  subtitle: now.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }),
                  category, badge, description, stats, attachment,
                  createdAt: now.toLocaleString("vi-VN"),
                  publishedBy,
                }, ...prev]);
              }} categories={(() => {
                const chanId = selectedChannel || "ch-announce";
                const defaults = CHANNEL_DEFAULT_CATEGORIES[chanId] || DEFAULT_CATEGORIES;
                const custom = customCategoriesMap[chanId] || (chanId === "ch-announce" ? customCategories : []);
                return [...defaults, ...custom];
              })()} onAddCategory={(cat) => {
                const chanId = selectedChannel || "ch-announce";
                if (chanId === "ch-announce") {
                  if (![...DEFAULT_CATEGORIES, ...customCategories].includes(cat)) setCustomCategories(prev => [...prev, cat]);
                } else {
                  setCustomCategoriesMap(prev => {
                    const existing = prev[chanId] || [];
                    const defaults = CHANNEL_DEFAULT_CATEGORIES[chanId] || [];
                    if (defaults.includes(cat) || existing.includes(cat)) return prev;
                    return { ...prev, [chanId]: [...existing, cat] };
                  });
                }
              }} onOpenGroup={(groupId) => {
                // Ensure the group exists in groupChats state
                setGroupChats(prev => {
                  if (prev.find(g => g.id === groupId)) return prev;
                  const g = commonGroups.find(cg => cg.id === groupId);
                  if (!g) return prev;
                  return [...prev, { id: g.id, name: g.name, type: "group" as const, icon: g.emoji, color: g.color, emoji: g.emoji, lastMessage: g.lastMessage, lastTime: g.lastActive, members: Array.from({ length: g.members }, (_, i) => `member-${i + 1}`) }];
                });
                setSelectedPersonalChat(groupId);
                setSelectedSpace("sp-personal");
                setCurrentView("chat");
              }} />
            </div>
            {showDetailView && (
              <ChannelItemDetailView channelId={selectedChannel!} itemId={selectedChannelItem!} onClose={() => setSelectedChannelItem(null)} onNavigate={(id) => {
                  if (id.startsWith("fi-") || id.startsWith("crm-")) {
                    const targetChannel = id.startsWith("fi-") ? "ch-finance" : "ch-crm";
                    if (selectedChannel !== targetChannel) setSelectedChannel(targetChannel);
                  }
                  selectChannelItem(id);
                }} canNavBack={canNavBack} canNavForward={canNavForward} onNavBack={navBack} onNavForward={navForward} customAnnouncements={publishedAnnouncements} savedItems={savedItems} likedItems={likedItems} registeredItems={registeredItems} onToggleSave={toggleSave} onToggleLike={toggleLike} onToggleRegister={toggleRegister} closedPolls={closedPolls} onTogglePollClosed={togglePollClosed} />
            )}
          </div>
        );
      }
      case "goals": return <GoalsView />;
      case "sprints": return <SprintsView tasks={tasks} onTaskClick={handleTaskClick} />;
      case "workload": return <WorkloadView tasks={tasks} onTaskClick={handleTaskClick} />;
      case "automations": return <AutomationsView />;
      case "activity": return <ActivityView />;
      case "whiteboard": return <WhiteboardView />;
      case "mindmap": return <MindMapView />;
      case "forms": return <FormsView />;
      case "notepad": return <NotepadView />;
      case "reminders": return <RemindersView />;
      case "inbox": return <InboxView />;
      case "docs": return <DocsView />;
      case "dashboards": return <DashboardsView tasks={filteredTasks} />;
      case "timetracking": return <TimeTrackingView />;
      case "team": return <TeamView tasks={tasks} onStartDM={handleStartDM} />;
      case "settings": return <SettingsView />;
      // New project-specific views
      case "okr": return <OKRView />;
      case "meeting": return <MeetingView />;
      case "project_docs": return <ProjectDocsView />;
      case "embed": return <EmbedView />;
      case "map": return <MapView />;
      case "project_dashboard": return <ProjectDashboardView tasks={filteredTasks} />;
      case "project_sprints": return <ProjectSprintsView tasks={filteredTasks} />;
      case "games": return <GamesView />;
      case "elearning": return <ELearningView />;
      case "reports": return <ReportsView tasks={filteredTasks} />;
      case "git_devops": return <GitDevOpsView />;
      case "bot_ai": return <BotAIView />;
      default: return <Dashboard tasks={filteredTasks} onTaskClick={handleTaskClick} />;
    }
  };

  return (
    <CrmInvoiceProvider>
    <div className="h-screen w-screen flex overflow-hidden bg-gray-50">
      <Sidebar currentView={currentView} onViewChange={(view) => { setCurrentView(view); if (view !== "chat") { setShowProjectsSidebar(false); setShowPersonalSidebar(false); setShowChannelSidebar(false); } }} selectedSpace={selectedSpace} onSpaceSelect={(id) => { setSelectedSpace(id); setShowProjectsSidebar(false); setShowPersonalSidebar(false); setShowChannelSidebar(false); }} collapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} onOpenCommandPalette={() => setShowCommandPalette(true)} showProjectsSidebar={showProjectsSidebar} onToggleProjectsSidebar={() => {
        setShowProjectsSidebar(prev => {
          const next = !prev;
          if (next) {
            setShowPersonalSidebar(false);
            setShowChannelSidebar(false);
            const firstProject = allSpaces.find(s => s.category === "project");
            if (firstProject) { setSelectedSpace(firstProject.id); setCurrentView("chat"); }
          }
          return next;
        });
      }} showPersonalSidebar={showPersonalSidebar} onTogglePersonalSidebar={() => {
        setShowPersonalSidebar(prev => {
          const next = !prev;
          if (next) {
            setShowProjectsSidebar(false);
            setShowChannelSidebar(false);
            setSelectedSpace("sp-personal");
            setCurrentView("chat");
          }
          return next;
        });
      }} showChannelSidebar={showChannelSidebar} onToggleChannelSidebar={() => {
        setShowChannelSidebar(prev => {
          const next = !prev;
          if (next) {
            setShowProjectsSidebar(false);
            setShowPersonalSidebar(false);
            setSelectedSpace("sp-channel");
            setCurrentView("chat");
            if (!selectedChannel) setSelectedChannel("ch-announce");
          }
          return next;
        });
      }} />
      {showProjectsSidebar && (
        <ProjectsSidebar
          selectedSpace={selectedSpace}
          onSpaceSelect={(id) => {
            setSelectedSpace(id);
            setCurrentView("chat");
            if (window.innerWidth < 768) {
              setMobileProjectLevel("detail");
              setShowProjectsSidebar(false);
            }
          }}
          onClose={() => setShowProjectsSidebar(false)}
          activeSection={mobileSection}
          onSectionChange={handleMobileSectionChange}
        />
      )}
      {showPersonalSidebar && (
        <PersonalSidebar
          selectedChat={selectedPersonalChat}
          onChatSelect={(id) => { setSelectedPersonalChat(id); setSelectedSpace("sp-personal"); setCurrentView("chat"); }}
          onClose={() => setShowPersonalSidebar(false)}
          groupChats={groupChats}
          onGroupChatsChange={setGroupChats}
          extraDMs={extraDMs}
          onExtraDMsChange={setExtraDMs}
          expanded={!selectedPersonalChat}
          activeSection={mobileSection}
          onSectionChange={handleMobileSectionChange}
          notifCount={notifCount}
          onToggleNotif={() => setShowNotifPanel(p => !p)}
        />
      )}
      {showChannelSidebar && (
        <ChannelSidebar
          selectedChannel={selectedChannel}
          onChannelSelect={(id) => {
            setSelectedChannel(id);
            setSelectedSpace("sp-channel");
            setCurrentView("chat");
            setSelectedChannelItem(null);
            setSelectedProcedure(null);
            setNavHistory([]);
            setNavIndex(-1);
            setMobileShowChannelChat(false);
            if (window.innerWidth < 768) setShowChannelSidebar(false);
            else setShowChannelSidebar(true);
          }}
          onClose={() => setShowChannelSidebar(false)}
          channels={channels}
          onChannelsChange={setChannels}
          activeSection={mobileSection}
          onSectionChange={handleMobileSectionChange}
        />
      )}
      {showChannelSidebar && selectedChannel === "ch-admin" && (
        <div className="hidden md:contents">
          <AdminProceduresSidebar
            selectedProcedure={selectedProcedure}
            onProcedureSelect={setSelectedProcedure}
            onClose={() => setSelectedProcedure(null)}
          />
        </div>
      )}
      {showChannelSidebar && selectedChannel && selectedChannel !== "ch-admin" && (
        <div className="hidden md:contents">
          <ChannelDetailSidebar
          channelId={selectedChannel}
          selectedItem={selectedChannelItem}
          onItemSelect={selectChannelItem}
          onClose={() => setSelectedChannelItem(null)}
          extraItems={publishedAnnouncements.filter(a => a.channelId === selectedChannel)}
          customCategories={customCategoriesMap[selectedChannel || ""] || (selectedChannel === "ch-announce" ? customCategories : [])}
          onAddCategory={(cat) => {
            const chanId = selectedChannel || "ch-announce";
            if (chanId === "ch-announce") {
              if (![...DEFAULT_CATEGORIES, ...customCategories].includes(cat)) setCustomCategories(prev => [...prev, cat]);
            } else {
              setCustomCategoriesMap(prev => {
                const existing = prev[chanId] || [];
                const defaults = CHANNEL_DEFAULT_CATEGORIES[chanId] || [];
                if (defaults.includes(cat) || existing.includes(cat)) return prev;
                return { ...prev, [chanId]: [...existing, cat] };
              });
            }
          }}
          onEditCategory={(oldName, newName) => {
            const chanId = selectedChannel || "ch-announce";
            if (chanId === "ch-announce") {
              setCustomCategories(prev => prev.map(c => c === oldName ? newName : c));
              setPublishedAnnouncements(prev => prev.map(a => a.category === oldName ? { ...a, category: newName } : a));
            } else {
              setCustomCategoriesMap(prev => ({
                ...prev,
                [chanId]: (prev[chanId] || []).map(c => c === oldName ? newName : c),
              }));
              setPublishedAnnouncements(prev => prev.map(a => a.channelId === chanId && a.category === oldName ? { ...a, category: newName } : a));
            }
          }}
          onDeleteCategory={(name) => {
            const chanId = selectedChannel || "ch-announce";
            if (chanId === "ch-announce") {
              setCustomCategories(prev => prev.filter(c => c !== name));
            } else {
              setCustomCategoriesMap(prev => ({ ...prev, [chanId]: (prev[chanId] || []).filter(c => c !== name) }));
            }
          }}
          deletedCategoryIds={deletedCategoryIdsMap[selectedChannel || ""] || []}
          onDeleteCategoryItem={(id) => {
            const chanId = selectedChannel || "ch-announce";
            setDeletedCategoryIdsMap(prev => ({
              ...prev,
              [chanId]: [...(prev[chanId] || []), id],
            }));
            if (id.includes("-cat-u-")) {
              const name = id.split("-cat-u-").slice(1).join("-cat-u-");
              if (chanId === "ch-announce") {
                setCustomCategories(prev => prev.filter(c => c !== name));
              } else {
                setCustomCategoriesMap(prev => ({
                  ...prev,
                  [chanId]: (prev[chanId] || []).filter(c => c !== name),
                }));
              }
            }
          }}
          categoryNameOverrides={categoryNameOverridesMap[selectedChannel || ""] || {}}
          onRenameCategory={(id, displayName, newName) => {
            const chanId = selectedChannel || "ch-announce";
            setCategoryNameOverridesMap(prev => ({
              ...prev,
              [chanId]: { ...(prev[chanId] || {}), [id]: newName },
            }));
            // Also update publishedAnnouncements so filter by category still works
            setPublishedAnnouncements(prev => prev.map(a =>
              a.channelId === chanId && a.category === displayName ? { ...a, category: newName } : a
            ));
            // Update customCategoriesMap for custom cats
            if (id.includes("-cat-u-")) {
              const oldName = id.split("-cat-u-").slice(1).join("-cat-u-");
              if (chanId === "ch-announce") {
                setCustomCategories(prev => prev.map(c => c === oldName ? newName : c));
              } else {
                setCustomCategoriesMap(prev => ({
                  ...prev,
                  [chanId]: (prev[chanId] || []).map(c => c === oldName ? newName : c),
                }));
              }
            }
          }}
          onDeleteAnnouncement={(id) => {
            const isPublished = publishedAnnouncements.some(a => a.id === id);
            if (isPublished) {
              setPublishedAnnouncements(prev => prev.filter(a => a.id !== id));
            } else {
              const chanId = selectedChannel || "ch-announce";
              setDeletedStaticAnnouncementsMap(prev => ({
                ...prev,
                [chanId]: [...(prev[chanId] || []), id],
              }));
            }
          }}
          deletedAnnouncementIds={deletedStaticAnnouncementsMap[selectedChannel || ""] || []}
          closedPolls={closedPolls}
        />
        </div>
      )}
      {/* Mobile: ChannelDetailSidebar as full-screen item list (when channel selected, no item selected, not in chat mode) */}
      {!showChannelSidebar && selectedChannel && selectedChannel !== "ch-admin" && selectedSpace === "sp-channel" && !selectedChannelItem && !mobileShowChannelChat && (
        <div className="md:hidden flex-1 flex flex-col min-h-0">
          <ChannelDetailSidebar
            channelId={selectedChannel}
            selectedItem={selectedChannelItem}
            onItemSelect={(id) => { selectChannelItem(id); }}
            onClose={() => setShowChannelSidebar(true)}
            onChatOpen={() => setMobileShowChannelChat(true)}
            extraItems={publishedAnnouncements.filter(a => a.channelId === selectedChannel)}
            customCategories={customCategoriesMap[selectedChannel || ""] || (selectedChannel === "ch-announce" ? customCategories : [])}
            onAddCategory={(cat) => {
              const chanId = selectedChannel || "ch-announce";
              if (chanId === "ch-announce") {
                if (![...DEFAULT_CATEGORIES, ...customCategories].includes(cat)) setCustomCategories(prev => [...prev, cat]);
              } else {
                setCustomCategoriesMap(prev => {
                  const existing = prev[chanId] || [];
                  const defaults = CHANNEL_DEFAULT_CATEGORIES[chanId] || [];
                  if (defaults.includes(cat) || existing.includes(cat)) return prev;
                  return { ...prev, [chanId]: [...existing, cat] };
                });
              }
            }}
            onEditCategory={(oldName, newName) => {
              const chanId = selectedChannel || "ch-announce";
              if (chanId === "ch-announce") {
                setCustomCategories(prev => prev.map(c => c === oldName ? newName : c));
                setPublishedAnnouncements(prev => prev.map(a => a.category === oldName ? { ...a, category: newName } : a));
              } else {
                setCustomCategoriesMap(prev => ({ ...prev, [chanId]: (prev[chanId] || []).map(c => c === oldName ? newName : c) }));
                setPublishedAnnouncements(prev => prev.map(a => a.channelId === chanId && a.category === oldName ? { ...a, category: newName } : a));
              }
            }}
            onDeleteCategory={(name) => {
              const chanId = selectedChannel || "ch-announce";
              if (chanId === "ch-announce") setCustomCategories(prev => prev.filter(c => c !== name));
              else setCustomCategoriesMap(prev => ({ ...prev, [chanId]: (prev[chanId] || []).filter(c => c !== name) }));
            }}
            deletedCategoryIds={deletedCategoryIdsMap[selectedChannel || ""] || []}
            onDeleteCategoryItem={(id) => {
              const chanId = selectedChannel || "ch-announce";
              setDeletedCategoryIdsMap(prev => ({ ...prev, [chanId]: [...(prev[chanId] || []), id] }));
            }}
            categoryNameOverrides={categoryNameOverridesMap[selectedChannel || ""] || {}}
            onRenameCategory={(id, displayName, newName) => {
              const chanId = selectedChannel || "ch-announce";
              setCategoryNameOverridesMap(prev => ({ ...prev, [chanId]: { ...(prev[chanId] || {}), [id]: newName } }));
            }}
            onDeleteAnnouncement={(id) => {
              const isPublished = publishedAnnouncements.some(a => a.id === id);
              if (isPublished) setPublishedAnnouncements(prev => prev.filter(a => a.id !== id));
              else {
                const chanId = selectedChannel || "ch-announce";
                setDeletedStaticAnnouncementsMap(prev => ({ ...prev, [chanId]: [...(prev[chanId] || []), id] }));
              }
            }}
            deletedAnnouncementIds={deletedStaticAnnouncementsMap[selectedChannel || ""] || []}
            closedPolls={closedPolls}
          />
        </div>
      )}
      {!(showPersonalSidebar && !selectedPersonalChat) && !(showChannelSidebar && !selectedChannel) && !(showProjectsSidebar && !selectedSpace) && !(!showChannelSidebar && selectedChannel && selectedChannel !== "ch-admin" && selectedSpace === "sp-channel" && !selectedChannelItem && !mobileShowChannelChat) && <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <TopBar currentView={currentView} onViewChange={setCurrentView} selectedSpace={selectedSpace} onSpaceSelect={setSelectedSpace} sidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} onAddTask={handleAddTask} searchQuery={searchQuery} onSearchChange={setSearchQuery} filterStatus={filterStatus} onFilterStatusChange={setFilterStatus} selectedChannel={selectedChannel} selectedPersonalChat={selectedPersonalChat} selectedProcedure={selectedProcedure} selectedChannelItem={selectedChannelItem} channels={channels} groupChats={groupChats} extraDMs={extraDMs} hideMobileViewSwitcher={selectedSpace !== "sp-personal" && selectedSpace !== "sp-channel" && !showProjectsSidebar && mobileProjectLevel !== "list"} onClearChannelItem={() => setSelectedChannelItem(null)} onClearProcedure={() => setSelectedProcedure(null)} onBack={
          selectedPersonalChat && selectedSpace === "sp-personal"
            ? () => setSelectedPersonalChat(null)
            : selectedChannelItem && selectedChannel && selectedSpace === "sp-channel"
            ? () => setSelectedChannelItem(null)
            : mobileShowChannelChat && selectedChannel && selectedSpace === "sp-channel"
            ? () => setMobileShowChannelChat(false)
            : selectedChannel && selectedSpace === "sp-channel" && !showChannelSidebar
            ? () => setShowChannelSidebar(true)
            : mobileProjectLevel === "view" && selectedSpace && selectedSpace !== "sp-personal" && selectedSpace !== "sp-channel"
            ? () => { setMobileProjectLevel("detail"); setCurrentView("chat"); }
            : selectedSpace && selectedSpace !== "sp-personal" && selectedSpace !== "sp-channel" && !showProjectsSidebar
            ? () => setShowProjectsSidebar(true)
            : undefined
        } notifCount={notifCount} onToggleNotif={() => setShowNotifPanel(p => !p)} />

        {/* Saved items floating button */}
        {(currentView === "saved" || savedItems.size > 0 || likedItems.size > 0 || registeredItems.size > 0) && (
          <button
            onClick={() => setShowSavedPanel(v => !v)}
            className={`fixed z-40 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all text-[13px] text-gray-700 font-medium ${currentView === "saved" ? "bottom-20 left-4 right-4 md:bottom-5 md:right-5 md:w-auto w-auto" : "hidden md:flex bottom-5 right-5"}`}
          >
            <Bookmark className={`w-4 h-4 ${showSavedPanel ? "fill-amber-400 text-amber-500" : "text-gray-400"}`} />
            Đã lưu
            <span className="bg-amber-100 text-amber-700 text-[11px] font-bold px-1.5 py-0.5 rounded-full">
              {savedItems.size + likedItems.size + registeredItems.size}
            </span>
          </button>
        )}

        {/* Saved items panel */}
        {(showSavedPanel || currentView === "saved") && (
          <div className={`fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden ${currentView === "saved" ? "md:hidden inset-4 bottom-20 flex flex-col" : "hidden md:block bottom-16 right-5 w-[340px]"}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-[13px] font-semibold text-gray-800">Mục đã lưu</span>
              <button onClick={() => setShowSavedPanel(false)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-y-auto md:max-h-[400px] divide-y divide-gray-50 flex-1">
              {savedItems.size > 0 && (
                <div className="px-4 py-2">
                  <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Bookmark className="w-3 h-3" /> Đã lưu ({savedItems.size})</p>
                  {[...savedItems].map(id => {
                    const name = getChannelItemName(selectedChannel || "", id) || id;
                    return (
                      <button key={id} onClick={() => { selectChannelItem(id); setShowSavedPanel(false); }}
                        className="w-full text-left flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-amber-50 transition-all group">
                        <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                        <span className="text-[12px] text-gray-700 truncate group-hover:text-amber-700">{name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {likedItems.size > 0 && (
                <div className="px-4 py-2">
                  <p className="text-[10px] font-semibold text-pink-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Heart className="w-3 h-3" /> Đã thích ({likedItems.size})</p>
                  {[...likedItems].map(id => {
                    const name = getChannelItemName(selectedChannel || "", id) || id;
                    return (
                      <button key={id} onClick={() => { selectChannelItem(id); setShowSavedPanel(false); }}
                        className="w-full text-left flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-pink-50 transition-all group">
                        <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400 shrink-0" />
                        <span className="text-[12px] text-gray-700 truncate group-hover:text-pink-700">{name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {registeredItems.size > 0 && (
                <div className="px-4 py-2">
                  <p className="text-[10px] font-semibold text-purple-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Đã đăng ký ({registeredItems.size})</p>
                  {[...registeredItems].map(id => {
                    const name = getChannelItemName(selectedChannel || "", id) || id;
                    return (
                      <button key={id} onClick={() => { selectChannelItem(id); setShowSavedPanel(false); }}
                        className="w-full text-left flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-purple-50 transition-all group">
                        <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="text-[12px] text-gray-700 truncate group-hover:text-purple-700">{name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile project view tab bar — visible when inside a project view on mobile */}
        {selectedSpace && selectedSpace !== "sp-personal" && selectedSpace !== "sp-channel" && !showProjectsSidebar && mobileProjectLevel !== "list" && (
          <div className="md:hidden flex items-center gap-1 px-3 py-2 bg-white border-b border-gray-100 shrink-0 overflow-x-auto scrollbar-hide">
            {[
              { key: "chat", label: "Chat", icon: <MessageSquare className="w-4 h-4" /> },
              { key: "list", label: "Danh sách", icon: <List className="w-4 h-4" /> },
              { key: "board", label: "Bảng", icon: <Grid3X3 className="w-4 h-4" /> },
              { key: "gantt", label: "Gantt", icon: <BarChart3 className="w-4 h-4" /> },
              { key: "backlog", label: "Backlog", icon: <InboxIcon className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => { setCurrentView(tab.key); setMobileProjectLevel("view"); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all shrink-0 ${
                  currentView === tab.key
                    ? "bg-cyan-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 active:bg-gray-200"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {renderContent()}
      </div>}

      {/* Mobile: Project detail overlay (sections list) */}
      {mobileProjectLevel === "detail" && selectedSpace && selectedSpace !== "sp-personal" && selectedSpace !== "sp-channel" && !showProjectsSidebar && (
        <div className="md:hidden fixed inset-0 bottom-16 z-30 flex flex-col bg-gray-50">
          <MobileProjectDetailView
            spaceId={selectedSpace}
            onViewSelect={(view) => {
              setCurrentView(view);
              setMobileProjectLevel("view");
            }}
            onBack={() => {
              setMobileProjectLevel("list");
              setShowProjectsSidebar(true);
            }}
          />
        </div>
      )}

      {/* Mobile tab overlays */}
      {mobileTab === "calls" && (
        <div className="md:hidden fixed inset-0 bottom-16 bg-white z-30 flex flex-col">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
            <p className="text-[20px] text-gray-900" style={{ fontWeight: 700 }}>Cuộc gọi</p>
            <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
              <Phone className="w-4 h-4" />
            </button>
          </div>
          {/* Call list */}
          <div className="flex-1 overflow-y-auto">
            {[
              { name: "Trần Hương", avatar: "TH", color: "#7c3aed", type: "missed", kind: "audio", time: "2 phút trước", duration: "" },
              { name: "Lê Phúc", avatar: "LP", color: "#0891b2", type: "outgoing", kind: "video", time: "15 phút trước", duration: "5:23" },
              { name: "Dự án VWork Pro", avatar: "VP", color: "#059669", type: "incoming", kind: "audio", time: "1 giờ trước", duration: "12:47" },
              { name: "Nguyễn Thành", avatar: "NT", color: "#d97706", type: "outgoing", kind: "audio", time: "3 giờ trước", duration: "2:10" },
              { name: "Team Frontend", avatar: "TF", color: "#6366f1", type: "incoming", kind: "video", time: "Hôm qua", duration: "28:05" },
              { name: "Phạm Lan Anh", avatar: "PL", color: "#db2777", type: "missed", kind: "audio", time: "Hôm qua", duration: "" },
              { name: "Coffee Chat", avatar: "CC", color: "#ea580c", type: "outgoing", kind: "audio", time: "Hôm qua", duration: "8:32" },
              { name: "Trần Hương", avatar: "TH", color: "#7c3aed", type: "incoming", kind: "video", time: "T2", duration: "45:12" },
              { name: "Hoàng Minh", avatar: "HM", color: "#0d9488", type: "missed", kind: "audio", time: "T2", duration: "" },
              { name: "Design Review", avatar: "DR", color: "#4f46e5", type: "incoming", kind: "video", time: "T3", duration: "1:02:33" },
            ].map((call, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[14px] font-bold shrink-0" style={{ backgroundColor: call.color }}>
                  {call.avatar}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] font-medium truncate ${call.type === "missed" ? "text-red-500" : "text-gray-900"}`}>
                    {call.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {call.type === "incoming" && <PhoneIncoming className="w-3 h-3 text-green-500" />}
                    {call.type === "outgoing" && <PhoneOutgoing className="w-3 h-3 text-cyan-500" />}
                    {call.type === "missed" && <PhoneMissed className="w-3 h-3 text-red-400" />}
                    <span className={`text-[12px] ${call.type === "missed" ? "text-red-400" : "text-gray-400"}`}>
                      {call.type === "incoming" ? "Đến" : call.type === "outgoing" ? "Đi" : "Nhỡ"}
                      {call.duration ? ` · ${call.duration}` : ""}
                    </span>
                    <span className="text-[11px] text-gray-300 ml-1">· {call.time}</span>
                  </div>
                </div>
                {/* Call back button */}
                <button className="w-9 h-9 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600 hover:bg-cyan-100 transition-colors shrink-0">
                  {call.kind === "video" ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {mobileTab === "notifications" && (
        <MobileNotificationsScreen
          notifications={mockNotifications}
          onNotificationClick={(n) => {
            if (!n.navigate) return;
            const { space, view, chatId, channelId } = n.navigate;
            setMobileTab("chat");
            setCurrentView(view || "chat");
            if (space === "sp-personal") {
              setSelectedSpace("sp-personal");
              setMobileSection("personal");
              setShowChannelSidebar(false);
              setShowProjectsSidebar(false);
              if (chatId) {
                setSelectedPersonalChat(chatId);
                setShowPersonalSidebar(true);
              } else {
                setShowPersonalSidebar(true);
              }
            } else if (space === "sp-channel") {
              setSelectedSpace("sp-channel");
              setMobileSection("channel");
              setShowPersonalSidebar(false);
              setShowProjectsSidebar(false);
              if (channelId) {
                setSelectedChannel(channelId);
                setSelectedChannelItem(null);
                setMobileShowChannelChat(true);
                setShowChannelSidebar(false);
              } else {
                setShowChannelSidebar(true);
              }
            } else {
              setSelectedSpace(space);
              setShowProjectsSidebar(false);
              setShowPersonalSidebar(false);
              setShowChannelSidebar(false);
              setMobileSection("project");
              setMobileProjectLevel("view");
            }
          }}
        />
      )}
      {/* Mobile Bottom Navigation */}
      <BottomNavBar
        currentView={currentView}
        selectedSpace={selectedSpace}
        showPersonalSidebar={showPersonalSidebar}
        showChannelSidebar={showChannelSidebar}
        showProjectsSidebar={showProjectsSidebar}
        onTogglePersonalSidebar={() => {
          if (!showPersonalSidebar) {
            setShowPersonalSidebar(true);
            setShowProjectsSidebar(false);
            setShowChannelSidebar(false);
            setSelectedSpace("sp-personal");
            setCurrentView("chat");
            setSelectedPersonalChat(null);
          } else {
            setShowPersonalSidebar(false);
          }
        }}
        onToggleChannelSidebar={() => {
          setShowChannelSidebar(prev => {
            const next = !prev;
            if (next) {
              setShowProjectsSidebar(false);
              setShowPersonalSidebar(false);
              setSelectedSpace("sp-channel");
              setCurrentView("chat");
              if (!selectedChannel) setSelectedChannel("ch-announce");
            }
            return next;
          });
        }}
        onToggleProjectsSidebar={() => {
          setShowProjectsSidebar(prev => {
            const next = !prev;
            if (next) {
              setShowPersonalSidebar(false);
              setShowChannelSidebar(false);
              setMobileProjectLevel("list");
              const firstProject = allSpaces.find(s => s.category === "project");
              if (firstProject) { setSelectedSpace(firstProject.id); setCurrentView("chat"); }
            }
            return next;
          });
        }}
        onBotClick={() => {
          if (botSpace) {
            setSelectedSpace(botSpace.id);
            setCurrentView("chat");
            setShowProjectsSidebar(false);
            setShowPersonalSidebar(false);
            setShowChannelSidebar(false);
          }
        }}
        onViewChange={view => { setCurrentView(view); setShowProjectsSidebar(false); setShowPersonalSidebar(false); setShowChannelSidebar(false); }}
        onSpaceSelect={setSelectedSpace}
        personalUnread={personalUnread}
        channelUnread={channelUnread}
        mobileTab={mobileTab}
        onMobileTabChange={handleMobileTabChange}
      />

      {showModal && (() => {
        const modalIdx = modalTask ? tasks.findIndex(t => t.id === modalTask.id) : -1;
        const prevTaskId = modalIdx > 0 ? tasks[modalIdx - 1].id : undefined;
        const nextTaskId = modalIdx >= 0 && modalIdx < tasks.length - 1 ? tasks[modalIdx + 1].id : undefined;
        const handleNavigate = (taskId: string) => {
          const t = tasks.find(x => x.id === taskId);
          if (t) { setModalTask(t); setIsNewTask(false); }
        };
        return (
          <TaskModal
            task={modalTask} isNew={isNewTask}
            onClose={() => setShowModal(false)}
            onSave={handleSaveTask}
            onDelete={handleDeleteTask}
            defaultProjectId={selectedProject || undefined}
            defaultType={newTaskType}
            allTasks={tasks}
            prevTaskId={prevTaskId}
            nextTaskId={nextTaskId}
            onNavigate={handleNavigate}
            customStatusConfig={mergedStatusConfig}
          />
        );
      })()}

      {showEpicModal && (
        <EpicCreateModal projectId={selectedProject || "p1"} onClose={() => setShowEpicModal(false)} />
      )}

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        tasks={tasks}
        onTaskClick={handleTaskClick}
        onViewChange={setCurrentView}
        onSpaceSelect={setSelectedSpace}
        onAddTask={handleAddTask}
        currentView={currentView}
        selectedSpace={selectedSpace}
        onChannelSelect={(channelId) => {
          setSelectedSpace("sp-channel");
          setSelectedChannel(channelId);
          setCurrentView("chat");
          setShowChannelSidebar(true);
          setSelectedChannelItem(null);
          setNavHistory([]);
          setNavIndex(-1);
        }}
        onChannelItemSelect={(channelId, itemId) => {
          setSelectedSpace("sp-channel");
          setSelectedChannel(channelId);
          setSelectedChannelItem(itemId);
          setCurrentView("chat");
          setShowChannelSidebar(true);
          pushNavHistory(channelId, itemId);
        }}
      />
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          className: "!rounded-xl !shadow-lg !shadow-black/10 !border !border-gray-100 !backdrop-blur-sm !bg-white/95 !text-gray-800 !text-[13px] !px-4 !py-3",
          style: { fontFamily: "inherit" },
        }}
        offset={16}
        gap={8}
      />
      {/* Keyboard Shortcuts Help */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-[15px] text-gray-900">Keyboard Shortcuts</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Phím tắt giúp bạn làm việc nhanh hơn</p>
              </div>
              <button onClick={() => setShowShortcuts(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 overflow-auto max-h-[60vh] space-y-5">
              {[
                { group: "Chung", shortcuts: [
                  { keys: ["⌘", "K"], desc: "Mở Command Palette" },
                  { keys: ["⌘", "⇧", "N"], desc: "Tạo task mới" },
                  { keys: ["?"], desc: "Hiển thị phím tắt" },
                  { keys: ["Esc"], desc: "Đóng modal / overlay" },
                ]},
                { group: "Điều hướng", shortcuts: [
                  { keys: ["G", "H"], desc: "Về trang Home" },
                  { keys: ["G", "I"], desc: "Mở Inbox" },
                  { keys: ["G", "D"], desc: "Mở Docs" },
                  { keys: ["G", "S"], desc: "Mở Settings" },
                  { keys: ["G", "T"], desc: "Mở Team" },
                  { keys: ["G", "G"], desc: "Mở Goals" },
                  { keys: ["G", "P"], desc: "Mở Sprints" },
                  { keys: ["G", "W"], desc: "Mở Workload" },
                  { keys: ["G", "A"], desc: "Mở Activity" },
                  { keys: ["G", "K"], desc: "Mở Time Tracking" },
                  { keys: ["Alt", "←"], desc: "Quay lại item trước" },
                  { keys: ["Alt", "→"], desc: "Tiến tới item sau" },
                  { keys: ["Esc"], desc: "Quay lại chat từ detail" },
                ]},
                { group: "Trong Task", shortcuts: [
                  { keys: ["E"], desc: "Chỉnh sửa task" },
                  { keys: ["D"], desc: "Xoá task" },
                  { keys: ["S"], desc: "Đổi trạng thái" },
                  { keys: ["P"], desc: "Đổi priority" },
                ]},
                { group: "Trong Chat", shortcuts: [
                  { keys: ["Enter"], desc: "Gửi tin nhắn" },
                  { keys: ["⇧", "Enter"], desc: "Xuống dòng" },
                  { keys: ["@"], desc: "Mention thành viên" },
                  { keys: ["/"], desc: "Slash commands" },
                ]},
              ].map(section => (
                <div key={section.group}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">{section.group}</p>
                  <div className="space-y-1">
                    {section.shortcuts.map((s, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50">
                        <span className="text-[12px] text-gray-600">{s.desc}</span>
                        <div className="flex items-center gap-1">
                          {s.keys.map((k, j) => (
                            <kbd key={j} className="min-w-[24px] h-6 px-1.5 bg-gray-100 border border-gray-200 rounded-md text-[10px] text-gray-600 flex items-center justify-center shadow-sm">{k}</kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-[10px] text-gray-400 text-center">Nhấn <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[9px] shadow-sm">?</kbd> bất cứ lúc nào để xem lại</p>
            </div>
          </div>
        </div>
      )}
      {/* Unified Notification Panel */}
      {showNotifPanel && (
        <NotificationPanel
          onClose={() => setShowNotifPanel(false)}
          onNavigate={(space, view, chatId, channelId) => {
            setShowNotifPanel(false);
            if (space === "inbox") { setCurrentView("inbox"); return; }
            if (space === "sp-personal") {
              setSelectedSpace("sp-personal");
              setShowPersonalSidebar(true);
              if (chatId) setSelectedPersonalChat(chatId);
              setCurrentView(view || "chat");
            } else if (space === "sp-channel") {
              setSelectedSpace("sp-channel");
              setShowChannelSidebar(true);
              if (channelId) setSelectedChannel(channelId);
              setCurrentView(view || "chat");
            } else if (space) {
              setSelectedSpace(space);
              setShowProjectsSidebar(false);
              setCurrentView(view || "chat");
            }
          }}
        />
      )}
    </div>
    </CrmInvoiceProvider>
  );
}