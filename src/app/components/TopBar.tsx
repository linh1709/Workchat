import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  List, LayoutGrid, CalendarDays, ChartGantt, Plus,
  Search, PanelLeftClose, PanelLeft, MoreHorizontal, Share2,
  MessageSquare, Hash, Bot, Users, Map, Brain, BarChart3, FileText,
  PenTool, Globe, ClipboardList, Activity, X, Columns3, Clock,
  StickyNote, Layers, Target, Video, Zap, PieChart, Bookmark,
  Bell, ChevronRight, Home, AtSign, ArrowRight, CheckCircle2,
  AlertTriangle, GitPullRequest, GitBranch, Upload,
  BellOff, UserPlus, LogOut, Image, LinkIcon, UserCog,
  Timer, Rocket, Archive, FolderPlus, FileDown, Settings,
  Check, Link, Camera, Smile, Lock, Eye, LayoutList, Palette, Heart, Key, Shield, History, Trash2, QrCode, Copy, Ban,
  ChevronLeft, ChevronDown
} from "lucide-react";
import { spaces, teamMembers, personalChatItems, type ChannelItem, type PersonalChatItem } from "./data";
import { getChannelItemName } from "./ChannelDetailSidebar";
import { toast } from "sonner";
import { copyToClipboard } from "./clipboard";
import { GroupManageModals, type SubModal } from "./GroupManageModals";

interface TopBarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  selectedSpace: string | null;
  onSpaceSelect: (space: string | null) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onAddTask: (type?: "task" | "story" | "bug" | "epic") => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterStatus: string;
  onFilterStatusChange: (s: string) => void;
  selectedChannel?: string | null;
  selectedPersonalChat?: string | null;
  selectedProcedure?: string | null;
  selectedChannelItem?: string | null;
  channels?: ChannelItem[];
  groupChats?: PersonalChatItem[];
  extraDMs?: PersonalChatItem[];
  onClearChannelItem?: () => void;
  onClearProcedure?: () => void;
  onBack?: () => void;
  notifCount?: number;
  onToggleNotif?: () => void;
  hideMobileViewSwitcher?: boolean;
}

/* ============== ADD VIEW DROPDOWN (ClickUp-style) ============== */
const addViewItems = [
  {
    group: "Mục tiêu & Tổng quan",
    items: [
      { id: "project_dashboard", icon: <BarChart3 className="w-4 h-4" />, label: "Tổng quan dự án", desc: "Biểu đồ, thống kê & tiến độ tổng thể", color: "text-indigo-600", bg: "bg-indigo-50" },
      { id: "backlog", icon: <Archive className="w-4 h-4" />, label: "Backlog", desc: "Quản lý Epic & task chưa vào sprint", color: "text-orange-600", bg: "bg-orange-50" },
      { id: "list", icon: <List className="w-4 h-4" />, label: "Danh sách", desc: "Quản lý task dạng danh sách", color: "text-cyan-600", bg: "bg-cyan-50" },
      { id: "board", icon: <LayoutGrid className="w-4 h-4" />, label: "Bảng Kanban", desc: "Kéo thả task giữa các cột", color: "text-violet-600", bg: "bg-violet-50" },
    ],
  },
  {
    group: "Lịch trình & Tiến độ",
    items: [
      { id: "calendar", icon: <CalendarDays className="w-4 h-4" />, label: "Lịch", desc: "Xem task theo ngày, tuần, tháng", color: "text-amber-600", bg: "bg-amber-50" },
      { id: "gantt", icon: <ChartGantt className="w-4 h-4" />, label: "Biểu đồ Gantt", desc: "Timeline & phụ thuộc task", color: "text-rose-600", bg: "bg-rose-50" },
      { id: "project_sprints", icon: <Zap className="w-4 h-4" />, label: "Sprints", desc: "Quản lý sprint & velocity", color: "text-amber-600", bg: "bg-amber-50" },
    ],
  },
  {
    group: "Tài liệu & Tích hợp",
    items: [
      { id: "project_docs", icon: <FileText className="w-4 h-4" />, label: "Tài liệu", desc: "Wiki, specs, ghi chú dự án", color: "text-blue-600", bg: "bg-blue-50" },
      { id: "git_devops", icon: <GitBranch className="w-4 h-4" />, label: "Git & DevOps", desc: "Commits, PR, CI/CD & Deployments", color: "text-orange-600", bg: "bg-orange-50" },
      { id: "bot_ai", icon: <Bot className="w-4 h-4" />, label: "BOT AI Agent", desc: "6 AI agents hỗ trợ dự án", color: "text-purple-600", bg: "bg-purple-50" },
    ],
  },
  {
    group: "Cộng tác",
    items: [
      { id: "meeting", icon: <Video className="w-4 h-4" />, label: "Họp trực tuyến", desc: "Cuộc họp, ghi chú & bản ghi", color: "text-violet-600", bg: "bg-violet-50" },
      { id: "whiteboard", icon: <PenTool className="w-4 h-4" />, label: "Bảng trắng", desc: "Vẽ, phác thảo & brainstorm", color: "text-teal-600", bg: "bg-teal-50" },
    ],
  },
  {
    group: "Sắp ra mắt",
    items: [
      { id: "okr", icon: <Target className="w-4 h-4" />, label: "OKR / Mục tiêu", desc: "Mục tiêu & Kết quả then chốt", color: "text-rose-600", bg: "bg-rose-50", comingSoon: true },
      { id: "workload", icon: <PieChart className="w-4 h-4" />, label: "Khối lượng công việc", desc: "Phân bổ & cân bằng tài nguyên", color: "text-indigo-600", bg: "bg-indigo-50", comingSoon: true },
      { id: "activity", icon: <Activity className="w-4 h-4" />, label: "Hoạt động", desc: "Theo dõi lịch sử thay đổi", color: "text-pink-600", bg: "bg-pink-50", comingSoon: true },
      { id: "reports", icon: <BarChart3 className="w-4 h-4" />, label: "Báo cáo", desc: "Burndown, Velocity, Sprint Report", color: "text-indigo-600", bg: "bg-indigo-50", comingSoon: true },
      { id: "forms", icon: <ClipboardList className="w-4 h-4" />, label: "Biểu mẫu", desc: "Tạo form thu thập dữ liệu", color: "text-lime-600", bg: "bg-lime-50", comingSoon: true },
    ],
  },
];

function AddViewDropdown({
  onClose,
  onAddView,
  activeViews,
}: {
  onClose: () => void;
  onAddView: (viewId: string) => void;
  activeViews: string[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const query = searchQuery.toLowerCase();
  const filteredGroups = addViewItems
    .map(group => ({
      ...group,
      items: group.items.filter(
        item =>
          item.label.toLowerCase().includes(query) ||
          item.desc.toLowerCase().includes(query)
      ),
    }))
    .filter(group => group.items.length > 0);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1.5 w-[340px] bg-white rounded-xl border border-gray-200 shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 pt-3.5 pb-2">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[13px] text-gray-800">Thêm hiển thị</h3>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-2 border border-gray-200 focus-within:border-cyan-300 focus-within:ring-2 focus-within:ring-cyan-50 transition-all">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            ref={searchRef}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm hiển thị..."
            className="flex-1 text-[12px] bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* View list */}
      <div className="max-h-[380px] overflow-y-auto px-2 pb-2">
        {filteredGroups.length === 0 && (
          <div className="text-center py-8">
            <Search className="w-6 h-6 text-gray-200 mx-auto mb-2" />
            <p className="text-[12px] text-gray-400">Không tìm thấy hiển thị nào</p>
          </div>
        )}
        {filteredGroups.map((group, gi) => (
          <div key={group.group}>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider px-2.5 pt-3 pb-1.5">
              {group.group}
            </p>
            {group.items.map(item => {
              const isActive = activeViews.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if ((item as any).comingSoon) return;
                    onAddView(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all text-left group/item ${
                    (item as any).comingSoon
                      ? "opacity-50 cursor-not-allowed"
                      : isActive
                      ? "bg-gray-50 opacity-60 cursor-default"
                      : "hover:bg-gray-50"
                  }`}
                  disabled={isActive || (item as any).comingSoon}
                >
                  <div
                    className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center ${item.color} shrink-0 transition-all ${!isActive && !(item as any).comingSoon ? "group-hover/item:scale-105" : ""}`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-gray-800">
                        {item.label}
                      </span>
                      {(item as any).comingSoon && (
                        <span className="text-[9px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-md">
                          Sắp ra mắt
                        </span>
                      )}
                      {isActive && (
                        <span className="text-[9px] bg-cyan-50 text-cyan-600 px-1.5 py-0.5 rounded-md border border-cyan-100">
                          Đang dùng
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                  {!isActive && (
                    <Plus className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover/item:opacity-100 transition-all shrink-0" />
                  )}
                </button>
              );
            })}
            {gi < filteredGroups.length - 1 && (
              <div className="h-px bg-gray-100 mx-2.5 mt-1" />
            )}
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
        <p className="text-[10px] text-gray-400 flex items-center gap-1.5">
          <Layers className="w-3 h-3" />
          Thêm nhiều hiển thị để làm việc hiệu quả hơn
        </p>
      </div>
    </div>
  );
}

/* ============== MAIN TOPBAR ============== */
export function TopBar({
  currentView, onViewChange, selectedSpace, onSpaceSelect, sidebarCollapsed,
  onToggleSidebar, onAddTask, searchQuery, onSearchChange,
  filterStatus, onFilterStatusChange, selectedChannel, selectedPersonalChat,
  selectedProcedure, selectedChannelItem, channels, groupChats, extraDMs,
  onClearChannelItem, onClearProcedure, onBack, notifCount = 0, onToggleNotif,
  hideMobileViewSwitcher = false,
}: TopBarProps) {
  const space = selectedSpace ? spaces.find(s => s.id === selectedSpace) : null;
  const isProject = space?.category === "project";

  // Channel role for the currently selected channel
  const CHANNEL_USER_ID = "u1";
  const activeChannelItem = (selectedSpace === "sp-channel" && selectedChannel && channels)
    ? channels.find(c => c.id === selectedChannel) : null;
  const channelRole: "owner" | "member" | "viewer" = activeChannelItem
    ? activeChannelItem.ownerId === CHANNEL_USER_ID ? "owner"
    : (activeChannelItem.allowedPosterIds ?? []).includes(CHANNEL_USER_ID) ? "member"
    : "viewer"
    : "owner"; // default for non-channel spaces
  const allPersonalChats = [...personalChatItems, ...(groupChats || []), ...(extraDMs || [])];
  const currentPersonalChat = (space?.category === "personal" && selectedPersonalChat)
    ? allPersonalChats.find(c => c.id === selectedPersonalChat)
    : null;
  const personalChatType = currentPersonalChat?.type;
  const [showAddView, setShowAddView] = useState(false);
  const [tabContextMenu, setTabContextMenu] = useState<{ tabId: string; x: number; y: number } | null>(null);
  const tabContextRef = useRef<HTMLDivElement>(null);
  const [showMemberPanel, setShowMemberPanel] = useState(false);
  const memberPanelRef = useRef<HTMLDivElement>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageGroupName, setManageGroupName] = useState("");
  const [manageGroupDesc, setManageGroupDesc] = useState("");
  const [projectSubPanel, setProjectSubPanel] = useState<"members" | "access" | "type" | "notifications" | "archive-confirm" | "delete-confirm" | null>(null);
  const [projectAccess, setProjectAccess] = useState<"private" | "public">("private");
  const [projectType, setProjectType] = useState<"scrum" | "kanban" | "basic">("scrum");
  const [projectMuted, setProjectMuted] = useState(false);
  const [showGroupTypeModal, setShowGroupTypeModal] = useState(false);
  const [groupType, setGroupType] = useState<"private" | "public">("private");
  const [restrictSaving, setRestrictSaving] = useState(false);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const linkMenuRef = useRef<HTMLDivElement>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSearch, setShareSearch] = useState("");
  const [shareTab, setShareTab] = useState<"all" | "work" | "misc">("all");
  const [selectedShareTargets, setSelectedShareTargets] = useState<string[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [manageSubModal, setManageSubModal] = useState<SubModal>(null);
  const [showSpaceMoreMenu, setShowSpaceMoreMenu] = useState(false);
  const [showBlockDMConfirm, setShowBlockDMConfirm] = useState(false);
  const spaceMoreMenuRef = useRef<HTMLDivElement>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState("");
  const [selectedNewMembers, setSelectedNewMembers] = useState<Set<string>>(new Set());
  const addMemberSearchRef = useRef<HTMLInputElement>(null);

  const availableContacts = useMemo(() => [
    { id: "c1", name: "Vũ Thành", username: "@vuthanh", color: "#2563eb", lastSeen: "vừa xong" },
    { id: "c2", name: "Ngọc Anh", username: "@ngocanh_dev", color: "#db2777", lastSeen: "3 phút trước" },
    { id: "c3", name: "Trịnh Khoa", username: "@trinhkhoa", color: "#059669", lastSeen: "đang hoạt động" },
    { id: "c4", name: "Bảo Ngọc", username: "@baongoc92", color: "#d97706", lastSeen: "15 phút trước" },
    { id: "c5", name: "Đặng Huy", username: "@danghuy", color: "#7c3aed", lastSeen: "1 giờ trước" },
    { id: "c6", name: "Mai Linh", username: "@mailinh", color: "#0891b2", lastSeen: "cách đây rất lâu" },
    { id: "c7", name: "Quốc Bảo", username: "@quocbao", color: "#dc2626", lastSeen: "32 phút trước" },
    { id: "c8", name: "Thanh Tùng", username: "@thanhtung_pm", color: "#6366f1", lastSeen: "52 phút trước" },
    { id: "c9", name: "Hà My", username: "@hamy", color: "#ec4899", lastSeen: "đang hoạt động" },
    { id: "c10", name: "Công Minh", username: "@congminh", color: "#14b8a6", lastSeen: "2 giờ trước" },
  ], []);

  const filteredContacts = useMemo(() => {
    if (!addMemberSearch.trim()) return availableContacts;
    const q = addMemberSearch.toLowerCase();
    return availableContacts.filter(c => c.name.toLowerCase().includes(q) || c.username.toLowerCase().includes(q));
  }, [addMemberSearch, availableContacts]);

  const handleToggleSelectContact = useCallback((contactId: string) => {
    setSelectedNewMembers(prev => {
      const n = new Set(prev);
      if (n.has(contactId)) n.delete(contactId); else n.add(contactId);
      return n;
    });
  }, []);

  const handleAddSelectedMembers = useCallback(() => {
    if (selectedNewMembers.size === 0) return;
    const names = availableContacts.filter(c => selectedNewMembers.has(c.id)).map(c => c.name);
    toast.success(`Đã thêm ${names.length} thành viên: ${names.join(", ")}`, { duration: 3000 });
    setSelectedNewMembers(new Set());
    setAddMemberSearch("");
    setShowAddMemberModal(false);
  }, [selectedNewMembers, availableContacts]);

  const handleCopyInviteLink = useCallback(() => {
    copyToClipboard("https://vwork.app/invite/grp-abc123").then(() => toast.success("Đã sao chép liên kết mời", { duration: 2000 }));
  }, []);

  // Focus search when modal opens
  useEffect(() => {
    if (showAddMemberModal) {
      setTimeout(() => addMemberSearchRef.current?.focus(), 100);
    }
  }, [showAddMemberModal]);



  // Close member panel on outside click
  useEffect(() => {
    if (!showMemberPanel) return;
    const handler = (e: MouseEvent) => {
      if (memberPanelRef.current && !memberPanelRef.current.contains(e.target as Node)) setShowMemberPanel(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMemberPanel]);

  // Close link menu on outside click
  useEffect(() => {
    if (!showLinkMenu) return;
    const handler = (e: MouseEvent) => {
      if (linkMenuRef.current && !linkMenuRef.current.contains(e.target as Node)) setShowLinkMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showLinkMenu]);

  // Close space more menu on outside click
  useEffect(() => {
    if (!showSpaceMoreMenu) return;
    const handler = (e: MouseEvent) => {
      if (spaceMoreMenuRef.current && !spaceMoreMenuRef.current.contains(e.target as Node)) setShowSpaceMoreMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSpaceMoreMenu]);

  // All possible view definitions
  const allViewDefs: Record<string, { icon: React.ReactNode; label: string }> = {
    chat: { icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Chat" },
    list: { icon: <List className="w-3.5 h-3.5" />, label: "List" },
    board: { icon: <LayoutGrid className="w-3.5 h-3.5" />, label: "Board" },
    calendar: { icon: <CalendarDays className="w-3.5 h-3.5" />, label: "Calendar" },
    gantt: { icon: <ChartGantt className="w-3.5 h-3.5" />, label: "Gantt" },
    project_dashboard: { icon: <BarChart3 className="w-3.5 h-3.5" />, label: "Dashboard" },
    project_sprints: { icon: <Zap className="w-3.5 h-3.5" />, label: "Sprints" },
    backlog: { icon: <Archive className="w-3.5 h-3.5" />, label: "Backlog" },
    okr: { icon: <Target className="w-3.5 h-3.5" />, label: "OKR" },
    meeting: { icon: <Video className="w-3.5 h-3.5" />, label: "Meeting" },
    workload: { icon: <PieChart className="w-3.5 h-3.5" />, label: "Workload" },
    activity: { icon: <Activity className="w-3.5 h-3.5" />, label: "Activity" },
    timetracking: { icon: <Clock className="w-3.5 h-3.5" />, label: "Time" },
    project_docs: { icon: <FileText className="w-3.5 h-3.5" />, label: "Docs" },
    docs: { icon: <FileText className="w-3.5 h-3.5" />, label: "Docs" },
    whiteboard: { icon: <PenTool className="w-3.5 h-3.5" />, label: "Whiteboard" },
    mindmap: { icon: <Brain className="w-3.5 h-3.5" />, label: "Mind Map" },
    forms: { icon: <ClipboardList className="w-3.5 h-3.5" />, label: "Forms" },
    embed: { icon: <Globe className="w-3.5 h-3.5" />, label: "Embed" },
    map: { icon: <Map className="w-3.5 h-3.5" />, label: "Map" },
    reports: { icon: <BarChart3 className="w-3.5 h-3.5" />, label: "Reports" },
    git_devops: { icon: <GitBranch className="w-3.5 h-3.5" />, label: "Git/DevOps" },
    bot_ai: { icon: <Bot className="w-3.5 h-3.5" />, label: "BOT AI" },
  };

  const defaultTabIds = ["chat", "backlog", "list", "board", "calendar", "gantt"];
  const [openTabIds, setOpenTabIds] = useState<string[]>(defaultTabIds);
  const [showMobileViewPicker, setShowMobileViewPicker] = useState(false);

  // Reset tabs when space changes
  useEffect(() => {
    setOpenTabIds(defaultTabIds);
    setShowMobileViewPicker(false);
  }, [selectedSpace]);

  // Close tab context menu on outside click
  useEffect(() => {
    if (!tabContextMenu) return;
    const handler = (e: MouseEvent) => {
      if (tabContextRef.current && !tabContextRef.current.contains(e.target as Node)) setTabContextMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [tabContextMenu]);

  const handleAddView = (viewId: string) => {
    if (!openTabIds.includes(viewId)) {
      setOpenTabIds(prev => [...prev, viewId]);
    }
    onViewChange(viewId);
  };

  const handleRemoveTab = (tabId: string) => {
    if (defaultTabIds.slice(0, 1).includes(tabId) && openTabIds.length <= 1) return; // Keep at least 1 tab
    const remaining = openTabIds.filter(id => id !== tabId);
    setOpenTabIds(remaining);
    if (currentView === tabId) {
      onViewChange(remaining[0] || "chat");
    }
    setTabContextMenu(null);
  };

  const viewTabs = openTabIds.map(id => ({
    id,
    icon: allViewDefs[id]?.icon || <Layers className="w-3.5 h-3.5" />,
    label: allViewDefs[id]?.label || id,
  }));

  // Only project spaces get full tab bar - show if currentView is any of the open tabs
  const showTabs = isProject && openTabIds.includes(currentView);

  const viewTitles: Record<string, string> = {
    mywork: "Công việc của tôi",
    dashboard: "Home", inbox: "Inbox", docs: "Docs", goals: "Goals", sprints: "Sprints",
    dashboards: "Dashboards", timetracking: "Time Tracking", workload: "Workload",
    automations: "Automations", activity: "Activity", whiteboard: "Whiteboard",
    mindmap: "Mind Map", forms: "Forms", notepad: "Notepad", reminders: "Reminders",
    team: "Team", settings: "Settings",
    reports: "Reports", git_devops: "Git & DevOps", bot_ai: "BOT AI Agent",
  };
  const viewTitle = viewTitles[currentView] || currentView;

  return (
    <div className="bg-white border-b border-gray-300/60">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Mobile back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden w-8 h-8 flex items-center justify-center -ml-1 text-gray-500 hover:text-gray-700 shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {/* Header: Space info or view title */}
        {space && currentView !== "mywork" ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {space.category === "channel" ? (
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Hash className="w-4 h-4 text-indigo-500" />
              </div>
            ) : space.category === "bot" ? (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: space.color }}>
                <Bot className="w-3.5 h-3.5" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] shrink-0 text-white" style={{ backgroundColor: space.color }}>
                {space.icon}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-[14px] text-gray-900 truncate tracking-tight">{space.name}</h2>
              {space.description && (
                <p className="text-[11px] text-gray-400 truncate">{space.description}</p>
              )}
            </div>
            {space.members && (
              <div className="relative" ref={memberPanelRef}>
                <button
                  onClick={() => { setShowMemberPanel(!showMemberPanel); setMemberSearch(""); }}
                  className={`flex items-center gap-1 text-[11px] shrink-0 px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    showMemberPanel ? "bg-cyan-50 text-cyan-600" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>{space.members}</span>
                </button>
                {showMemberPanel && (() => {
                  // Build member list from teamMembers, matching space.members count
                  const spaceMembers = teamMembers.slice(0, space.members || 4).map((m, i) => ({
                    ...m,
                    online: i < 3, // first 3 online
                    lastSeen: i >= 3 ? (i === 3 ? "last seen just now" : `last seen ${i} minute${i > 1 ? "s" : ""} ago`) : undefined,
                    isOwner: i === 0,
                  }));
                  const onlineCount = spaceMembers.filter(m => m.online).length;
                  const q = memberSearch.toLowerCase();
                  const filtered = q ? spaceMembers.filter(m => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)) : spaceMembers;
                  const onlineMembers = filtered.filter(m => m.online);
                  const offlineMembers = filtered.filter(m => !m.online);

                  return (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[360px] bg-white rounded-2xl border border-gray-200 shadow-2xl z-[70] overflow-hidden">
                      {/* Header: Space avatar + info */}
                      <div className="flex flex-col items-center pt-6 pb-4 px-4 relative bg-gradient-to-b from-gray-50 to-white">
                        <button onClick={() => setShowMemberPanel(false)} className="absolute top-3 right-3 w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                        <div className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-[22px] text-white shadow-lg mb-3" style={{ backgroundColor: space.color }}>
                          {space.icon}
                        </div>
                        <h3 className="text-[15px] text-gray-900">{space.name}</h3>
                        <p className="text-[12px] text-gray-400">{space.members} members</p>
                      </div>

                      {/* Action buttons row */}
                      <div className="flex items-center justify-center gap-6 py-3 border-b border-gray-100">
                        <div className="flex flex-col items-center gap-1 cursor-pointer group">
                          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-cyan-50 group-hover:text-cyan-600 transition-all">
                            <BellOff className="w-4.5 h-4.5" />
                          </div>
                          <span className="text-[10px] text-gray-500">Mute</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => { setShowManageModal(true); setManageGroupName(space.name); setManageGroupDesc(space.description || ""); setShowMemberPanel(false); setShowMoreMenu(false); }}>
                          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-cyan-50 group-hover:text-cyan-600 transition-all">
                            <UserCog className="w-4.5 h-4.5" />
                          </div>
                          <span className="text-[10px] text-gray-500">Manage</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 cursor-pointer group">
                          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-red-50 group-hover:text-red-500 transition-all">
                            <LogOut className="w-4.5 h-4.5" />
                          </div>
                          <span className="text-[10px] text-gray-500">Leave</span>
                        </div>
                        {space.category !== "project" && (
                          <div className="relative">
                            <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => setShowMoreMenu(!showMoreMenu)}>
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${showMoreMenu ? "bg-cyan-50 text-cyan-600" : "bg-gray-50 text-gray-500 group-hover:bg-cyan-50 group-hover:text-cyan-600"}`}>
                                <MoreHorizontal className="w-4.5 h-4.5" />
                              </div>
                              <span className="text-[10px] text-gray-500">More</span>
                            </div>
                            {showMoreMenu && (
                              <div className="absolute top-full right-0 mt-2 w-[220px] bg-white rounded-xl border border-gray-200 shadow-2xl z-[80] py-1.5 overflow-hidden">
                                <button onClick={() => setShowMoreMenu(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                                  <Timer className="w-4 h-4 text-gray-400" />
                                  Tự động xóa
                                </button>
                                <div className="h-px bg-gray-100 mx-3" />
                                <button onClick={() => setShowMoreMenu(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                                  <UserPlus className="w-4 h-4 text-gray-400" />
                                  Thêm thành viên
                                </button>
                                <button onClick={() => setShowMoreMenu(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                                  <Rocket className="w-4 h-4 text-gray-400" />
                                  Boosts
                                </button>
                                <button onClick={() => setShowMoreMenu(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                                  <Archive className="w-4 h-4 text-gray-400" />
                                  Kho lưu trữ Story
                                </button>
                                <button onClick={() => setShowMoreMenu(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                                  <Settings className="w-4 h-4 text-gray-400" />
                                  Quản lý nhóm
                                </button>
                                <button onClick={() => setShowMoreMenu(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                                  <FileDown className="w-4 h-4 text-gray-400" />
                                  Xuất lịch sử chat
                                </button>
                                <button onClick={() => setShowMoreMenu(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left justify-between">
                                  <span className="flex items-center gap-3">
                                    <FolderPlus className="w-4 h-4 text-gray-400" />
                                    Thêm vào thư mục
                                  </span>
                                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                                </button>
                                <div className="h-px bg-gray-100 mx-3" />
                                <button onClick={() => setShowMoreMenu(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-all text-left">
                                  <LogOut className="w-4 h-4 text-red-400" />
                                  Rời nhóm
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {space.category === "project" ? (
                        /* Project info — thay thế photos/videos/links */
                        <div className="border-b border-gray-100 px-4 py-3 space-y-2">
                          {space.description && (
                            <p className="text-[12px] text-gray-500">{space.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-[11px] text-gray-500">
                            <ClipboardList className="w-3.5 h-3.5 text-gray-400" />
                            <span>5/12 tasks hoàn thành</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span>Sprint hiện tại: Sprint 12</span>
                          </div>
                        </div>
                      ) : (
                        /* Chat — SHOW TOPICS LIST + shared media */
                        <>
                          <button className="w-full px-4 py-2.5 text-left text-[12px] text-cyan-600 hover:bg-cyan-50/50 transition-all tracking-wide">
                            SHOW TOPICS LIST
                          </button>
                          <div className="border-t border-gray-100">
                            <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-all">
                              <Image className="w-4 h-4 text-gray-400" />
                              <span className="text-[12px] text-cyan-600">11 photos</span>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-all">
                              <Video className="w-4 h-4 text-gray-400" />
                              <span className="text-[12px] text-cyan-600">1 video</span>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-all">
                              <LinkIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-[12px] text-cyan-600">12 shared links</span>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Members section */}
                      <div className="border-t border-gray-100">
                        <div className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-[11px] text-gray-500 uppercase tracking-wider">{filtered.length} MEMBERS</span>
                          </div>
                          <button onClick={() => { setShowAddMemberModal(true); setAddMemberSearch(""); setSelectedNewMembers(new Set()); setShowMemberPanel(false); }} className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-cyan-600 transition-all">
                            <UserPlus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Search members */}
                        <div className="px-4 pb-2">
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200 focus-within:border-cyan-300 transition-all">
                            <Search className="w-3 h-3 text-gray-400" />
                            <input
                              value={memberSearch}
                              onChange={e => setMemberSearch(e.target.value)}
                              placeholder="Search members..."
                              className="flex-1 text-[11px] bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                            />
                          </div>
                        </div>

                        {/* Member list */}
                        <div className="max-h-[240px] overflow-y-auto pb-2">
                          {onlineMembers.map(m => (
                            <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-all">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] text-white" style={{ backgroundColor: m.color }}>
                                  {m.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] text-gray-900 truncate">{m.name}</p>
                                <p className="text-[11px] text-emerald-500">online</p>
                              </div>
                              {m.isOwner && (
                                <span className="text-[11px] text-cyan-600">owner</span>
                              )}
                            </div>
                          ))}
                          {offlineMembers.map(m => (
                            <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-all">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] text-white" style={{ backgroundColor: m.color }}>
                                  {m.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] text-gray-900 truncate">{m.name}</p>
                                <p className="text-[11px] text-gray-400">{m.lastSeen}</p>
                              </div>
                            </div>
                          ))}
                          {filtered.length === 0 && (
                            <div className="text-center py-6">
                              <p className="text-[12px] text-gray-400">No members found</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            {space.category !== "personal" && (
              <button onClick={() => { setShowShareModal(true); setShareSearch(""); setShareTab("all"); setSelectedShareTargets([]); }} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-all">
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="relative" ref={spaceMoreMenuRef}>
              {space.category !== "project" && (
                <button onClick={() => setShowSpaceMoreMenu(!showSpaceMoreMenu)} className={`w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-all ${showSpaceMoreMenu ? "bg-gray-100 text-gray-600" : "text-gray-300 hover:text-gray-500"}`}>
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              )}
              {showSpaceMoreMenu && (
                <div className="absolute top-full right-0 mt-1.5 w-[220px] bg-white rounded-xl border border-gray-200 shadow-2xl z-[80] py-1.5 overflow-hidden" style={{ animation: "fadeInScale 0.15s ease" }}>
                  {space.category === "personal" && personalChatType !== "group" ? (
                    // DM menu
                    <>
                      {personalChatType === "dm" && (
                        <button onClick={() => { setShowSpaceMoreMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                          <UserCog className="w-4 h-4 text-gray-400" />
                          <span>Thông tin liên hệ</span>
                        </button>
                      )}
                      <button onClick={() => { setShowSpaceMoreMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                        <Search className="w-4 h-4 text-gray-400" />
                        <span>Tìm trong cuộc trò chuyện</span>
                      </button>
                      <div className="h-px bg-gray-100 mx-3" />
                      <button onClick={() => { setShowSpaceMoreMenu(false); toast.success("Đã tắt thông báo", { duration: 2000 }); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                        <BellOff className="w-4 h-4 text-gray-400" />
                        <span>Tắt thông báo</span>
                      </button>
                      <button onClick={() => { setShowSpaceMoreMenu(false); toast("Đã xóa lịch sử chat", { duration: 2000 }); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                        <Trash2 className="w-4 h-4 text-gray-400" />
                        <span>Xóa lịch sử chat</span>
                      </button>
                      {personalChatType === "dm" && (
                        <>
                          <div className="h-px bg-gray-100 mx-3" />
                          <button onClick={() => setShowBlockDMConfirm(true)} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-all text-left">
                            <Ban className="w-4 h-4" />
                            <span>Chặn người dùng</span>
                          </button>
                        </>
                      )}
                    </>
                  ) : space.category === "project" ? (
                    // Project menu — không có QR, invite link, copy link
                    <>
                      <button onClick={() => { setShowSpaceMoreMenu(false); setShowManageModal(true); setManageGroupName(space.name); setManageGroupDesc(space.description || ""); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                        <Settings className="w-4 h-4 text-gray-400" />
                        <span>Cài đặt dự án</span>
                      </button>
                      <button onClick={() => { setShowSpaceMoreMenu(false); setShowMemberPanel(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>Thành viên</span>
                        <span className="ml-auto text-[11px] text-gray-400">{space.members || 5}</span>
                      </button>
                      <button onClick={() => { setShowSpaceMoreMenu(false); setShowAddMemberModal(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                        <UserPlus className="w-4 h-4 text-gray-400" />
                        <span>Thêm thành viên</span>
                      </button>
                      <div className="h-px bg-gray-100 mx-3" />
                      <button onClick={() => { setShowSpaceMoreMenu(false); toast.success("Đã tắt thông báo", { duration: 2000 }); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                        <BellOff className="w-4 h-4 text-gray-400" />
                        <span>Tắt thông báo</span>
                      </button>
                    </>
                  ) : (
                    // Group/channel menu
                    <>
                      <button onClick={() => { setShowSpaceMoreMenu(false); setShowManageModal(true); setManageGroupName(space.name); setManageGroupDesc(space.description || ""); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                        <Settings className="w-4 h-4 text-gray-400" />
                        <span>Cài đặt nhóm</span>
                      </button>
                      <button onClick={() => { setShowSpaceMoreMenu(false); setShowMemberPanel(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>Thành viên</span>
                        <span className="ml-auto text-[11px] text-gray-400">{space.members || 5}</span>
                      </button>
                      <button onClick={() => { setShowSpaceMoreMenu(false); setShowAddMemberModal(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                        <UserPlus className="w-4 h-4 text-gray-400" />
                        <span>Thêm thành viên</span>
                      </button>
                      <div className="h-px bg-gray-100 mx-3" />
                      <button onClick={() => { setShowSpaceMoreMenu(false); setShowLinkMenu(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                        <LinkIcon className="w-4 h-4 text-gray-400" />
                        <span>Liên kết mời</span>
                      </button>
                      <button onClick={() => { setShowSpaceMoreMenu(false); setShowQRModal(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                        <QrCode className="w-4 h-4 text-gray-400" />
                        <span>Mã QR</span>
                      </button>
                      <div className="h-px bg-gray-100 mx-3" />
                      <button onClick={() => { setShowSpaceMoreMenu(false); copyToClipboard(`https://vwork.app/s/${space.id}`).then(() => toast.success("Đã sao chép liên kết", { duration: 2000 })); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                        <Copy className="w-4 h-4 text-gray-400" />
                        <span>Sao chép liên kết</span>
                      </button>
                      <button onClick={() => { setShowSpaceMoreMenu(false); toast.success("Đã tắt thông báo", { duration: 2000 }); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                        <BellOff className="w-4 h-4 text-gray-400" />
                        <span>Tắt thông báo</span>
                      </button>
                      <div className="h-px bg-gray-100 mx-3" />
                      <button onClick={() => { setShowSpaceMoreMenu(false); toast("Đã rời nhóm " + space.name, { duration: 2000 }); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-all text-left">
                        <LogOut className="w-4 h-4" />
                        <span>Rời nhóm</span>
                      </button>
                    </>
                  )}
                </div>
              )}
              {/* Block DM Confirmation Dialog */}
              {showBlockDMConfirm && (
                <div className="fixed inset-0 bg-black/40 z-[600] flex items-end justify-center" onClick={() => setShowBlockDMConfirm(false)}>
                  <div className="bg-white rounded-t-2xl w-full max-w-sm p-6 space-y-4 animate-in slide-in-from-bottom-5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-[16px] font-semibold text-gray-900">Chặn người dùng?</h3>
                      <button onClick={() => setShowBlockDMConfirm(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-[13px] text-gray-600">Người này sẽ không thể xem tin nhắn, gửi tin nhắn hoặc liên hệ bạn. Họ sẽ không biết bạn đã chặn họ.</p>
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => setShowBlockDMConfirm(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                        Hủy
                      </button>
                      <button 
                        onClick={() => {
                          setShowSpaceMoreMenu(false);
                          setShowBlockDMConfirm(false);
                          toast("Đã chặn người dùng", { duration: 2000, icon: <Ban className="w-4 h-4 text-red-500" /> });
                        }} 
                        className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-[13px] hover:bg-red-600 transition-colors font-medium"
                      >
                        Chặn
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <h2 className="text-[14px] text-gray-900 tracking-tight">{viewTitle}</h2>
          </div>
        )}

        {/* Mobile view switcher — project spaces only, hidden when tab bar is shown */}
        {isProject && !hideMobileViewSwitcher && (
          <button
            onClick={() => setShowMobileViewPicker(v => !v)}
            className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-[12px] text-gray-700 shrink-0 transition-all active:bg-gray-100"
          >
            {allViewDefs[currentView]?.icon}
            <span className="font-medium">{allViewDefs[currentView]?.label || currentView}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showMobileViewPicker ? "rotate-180" : ""}`} />
          </button>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {currentView !== "chat" && (
            <>
              <div className={`relative ${hideMobileViewSwitcher ? "hidden md:block" : ""}`}>
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter tasks..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9 pr-3 py-[7px] text-[12px] bg-gray-50 border border-gray-200 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 text-gray-800 placeholder-gray-400 transition-all"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => onFilterStatusChange(e.target.value)}
                className={`text-[12px] text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-[7px] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 appearance-none cursor-pointer hover:bg-gray-100 transition-all ${hideMobileViewSwitcher ? "hidden md:block" : ""}`}
              >
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </>
          )}
          {isProject && <CreateButton onAddTask={onAddTask} />}

          {/* Notification Bell */}
          <button onClick={onToggleNotif}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all relative text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <Bell className="w-4 h-4" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[8px] text-white flex items-center justify-center animate-pulse">{notifCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Breadcrumb removed */}
      {false && (
        <div className="flex items-center gap-1 px-4 pb-2 text-[11px]">
          <button onClick={() => { onViewChange("dashboard"); onSpaceSelect(null); }} className="text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-all">
            <Home className="w-3 h-3" /> Home
          </button>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          {space ? (() => {
            const categoryLabel = space.category === "project" ? "Dự án" : space.category === "channel" ? "Kênh" : space.category === "group" ? "Nhóm" : space.category === "bot" ? "Bot" : space.category === "personal" ? "Cá nhân" : "E-Learning";

            // Resolve sub-item name for channels
            const channelName = selectedChannel && channels
              ? channels.find(c => c.id === selectedChannel)?.name
              : null;

            // Resolve sub-item name for personal chats
            const allPersonalChats = [...personalChatItems, ...(groupChats || []), ...(extraDMs || [])];
            const personalChatName = selectedPersonalChat
              ? allPersonalChats.find(c => c.id === selectedPersonalChat)?.name
              : null;

            // Resolve procedure name
            const procedureNameMap: Record<string, string> = {
              "pr-leave": "Xin nghỉ phép", "pr-remote": "Làm việc từ xa", "pr-salary-adv": "Tạm ứng lương",
              "pr-project-adv": "Tạm ứng dự án", "pr-travel": "Thanh toán công tác phí", "pr-expense": "Đề nghị thanh toán",
              "pr-buy-equip": "Mua thiết bị", "pr-fix-equip": "Sửa chữa thiết bị", "pr-return-equip": "Trả thiết bị",
              "pr-training": "Đăng ký đào tạo", "pr-cert": "Giấy xác nhận", "pr-stamp": "Yêu cầu đóng dấu",
              "pr-room": "Đặt phòng họp", "pr-vehicle": "Đặt xe công tác", "pr-schedule": "Thay đổi lịch",
              "pr-maternity": "Nghỉ thai sản", "pr-insurance": "Đăng ký bảo hiểm", "pr-health": "Khám sức khỏe",
            };
            const procedureName = selectedProcedure ? procedureNameMap[selectedProcedure] : null;

            // Resolve channel detail item name
            const channelItemDetailName = selectedChannelItem && selectedChannel
              ? getChannelItemName(selectedChannel, selectedChannelItem)
              : null;

            // The deepest detail name (procedure or channel item)
            const detailName = procedureName || channelItemDetailName;

            // Determine the sub-item label based on context
            const subItemName = space.category === "channel" ? channelName
              : space.category === "personal" ? personalChatName
              : null;

            return (
              <>
                <span className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" onClick={() => { onSpaceSelect(null); onViewChange("dashboard"); }}>{categoryLabel}</span>
                {subItemName ? (
                  <>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                    <span
                      className={detailName ? "text-gray-400 cursor-pointer hover:text-cyan-600 transition-colors" : "text-gray-700"}
                      onClick={detailName ? () => { onClearChannelItem?.(); onClearProcedure?.(); } : undefined}
                    >{subItemName}</span>
                    {detailName && (
                      <>
                        <ChevronRight className="w-3 h-3 text-gray-300" />
                        <span className="text-cyan-600">{detailName}</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                    <span className="text-gray-700">{space.name}</span>
                  </>
                )}
                {currentView !== "chat" && (
                  <>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                    <span className="text-cyan-600">{allViewDefs[currentView]?.label || currentView}</span>
                  </>
                )}
              </>
            );
          })() : (
            <span className="text-gray-700">{viewTitle}</span>
          )}
        </div>
      )}

      {/* Tab bar — only for project-type spaces (desktop only) */}
      {showTabs && (
        <div className="hidden md:flex items-center gap-1 px-4 pb-0">
          {viewTabs.map(tab => {
            const isDefault = defaultTabIds.includes(tab.id);
            return (
              <div key={tab.id} className="relative group/tab">
                <button
                  onClick={() => onViewChange(tab.id)}
                  onContextMenu={e => { e.preventDefault(); setTabContextMenu({ tabId: tab.id, x: e.clientX, y: e.clientY }); }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-t-lg transition-all relative ${
                    currentView === tab.id
                      ? "text-cyan-700 bg-cyan-50/60"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {currentView === tab.id && (
                    <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-cyan-500 rounded-t-full" />
                  )}
                </button>
                {/* Close button for non-default tabs */}
                {!isDefault && (
                  <button
                    onClick={e => { e.stopPropagation(); handleRemoveTab(tab.id); }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-200 hover:bg-red-400 hover:text-white text-gray-500 flex items-center justify-center opacity-0 group-hover/tab:opacity-100 transition-all z-10"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}
          {/* Add View button (ClickUp-style) */}
          <div className="relative ml-1">
            <button
              onClick={() => setShowAddView(!showAddView)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                showAddView
                  ? "bg-cyan-50 text-cyan-600 ring-2 ring-cyan-100"
                  : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              }`}
            >
              <Plus className={`w-3.5 h-3.5 transition-transform ${showAddView ? "rotate-45" : ""}`} />
            </button>
            {showAddView && (
              <AddViewDropdown
                onClose={() => setShowAddView(false)}
                onAddView={handleAddView}
                activeViews={openTabIds}
              />
            )}
          </div>
        </div>
      )}

      {/* Tab context menu */}
      {tabContextMenu && (
        <div
          ref={tabContextRef}
          style={{ position: "fixed", top: tabContextMenu.y, left: tabContextMenu.x, zIndex: 60 }}
          className="bg-white rounded-xl border border-gray-200 shadow-2xl py-1.5 w-[180px]"
        >
          <button
            onClick={() => handleRemoveTab(tabContextMenu.tabId)}
            className="w-full flex items-center gap-3 px-3.5 py-[7px] text-[13px] text-red-500 hover:bg-red-50 transition-all text-left"
          >
            <X className="w-4 h-4" />
            Ẩn hiển thị
          </button>
        </div>
      )}

      {/* Mobile View Picker Dropdown */}
      {isProject && showMobileViewPicker && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-[55]"
            onClick={() => setShowMobileViewPicker(false)}
          />
          {/* Dropdown panel */}
          <div className="md:hidden absolute left-0 right-0 z-[56] bg-white border-b border-gray-200 shadow-lg px-3 py-3"
            style={{ top: "100%" }}
          >
            <div className="grid grid-cols-3 gap-2">
              {openTabIds.map(viewId => {
                const def = allViewDefs[viewId];
                const isActive = currentView === viewId;
                return (
                  <button
                    key={viewId}
                    onClick={() => { onViewChange(viewId); setShowMobileViewPicker(false); }}
                    className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-[11px] font-medium transition-all ${
                      isActive
                        ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`${isActive ? "text-cyan-600" : "text-gray-400"}`}>
                      {def?.icon}
                    </div>
                    <span>{def?.label || viewId}</span>
                  </button>
                );
              })}
              {/* Add View button */}
              <button
                onClick={() => { setShowAddView(true); setShowMobileViewPicker(false); }}
                className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-[11px] text-gray-400 hover:bg-gray-50 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add Member Modal - Telegram style */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => setShowAddMemberModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[340px] max-h-[520px] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: "fadeInScale 0.2s ease" }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
              <button onClick={() => setShowAddMemberModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
                <X className="w-4.5 h-4.5" />
              </button>
              <h3 className="text-[15px] text-gray-800 flex-1 text-center pr-8">Thêm thành viên</h3>
            </div>
            {/* Search */}
            <div className="px-4 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  ref={addMemberSearchRef}
                  value={addMemberSearch}
                  onChange={e => setAddMemberSearch(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-[13px] text-gray-800 placeholder:text-gray-400 outline-none focus:border-cyan-300 focus:bg-white focus:ring-1 focus:ring-cyan-100 transition-all"
                />
              </div>
            </div>
            {/* Selected chips */}
            {selectedNewMembers.size > 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {availableContacts.filter(c => selectedNewMembers.has(c.id)).map(c => (
                  <span key={c.id} className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-600 rounded-full px-2.5 py-1 text-[11px]">
                    <span className="w-4 h-4 rounded-full text-[8px] text-white flex items-center justify-center" style={{ backgroundColor: c.color }}>{c.name.charAt(0)}</span>
                    {c.name}
                    <button onClick={() => handleToggleSelectContact(c.id)} className="hover:bg-cyan-100 rounded-full p-0.5 transition-all"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
            {/* Invite via link */}
            <button onClick={handleCopyInviteLink} className="mx-4 mb-1 flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cyan-50 transition-all group">
              <div className="w-10 h-10 rounded-full bg-cyan-50 group-hover:bg-cyan-100 flex items-center justify-center transition-all">
                <Link className="w-4.5 h-4.5 text-cyan-500" />
              </div>
              <span className="text-[13px] text-cyan-500">Mời qua liên kết</span>
            </button>
            {/* Contact list */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="px-4 pt-1 pb-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Liên hệ thường xuyên</p>
              </div>
              {filteredContacts.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="w-6 h-6 text-gray-200 mx-auto mb-2" />
                  <p className="text-[12px] text-gray-400">Không tìm thấy liên hệ nào</p>
                </div>
              ) : (
                filteredContacts.map(contact => {
                  const isSelected = selectedNewMembers.has(contact.id);
                  const isOnline = contact.lastSeen === "đang hoạt động" || contact.lastSeen === "vừa xong";
                  return (
                    <button
                      key={contact.id}
                      onClick={() => handleToggleSelectContact(contact.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-all ${isSelected ? "bg-cyan-50/50" : ""}`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] text-white" style={{ backgroundColor: contact.color }}>
                          {contact.name.charAt(0)}
                        </div>
                        {isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-green-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[13px] text-gray-800 truncate">{contact.name}</p>
                        <p className={`text-[11px] truncate ${isOnline ? "text-cyan-500" : "text-gray-400"}`}>
                          {contact.username}
                        </p>
                      </div>
                      <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? "border-cyan-500 bg-cyan-500" : "border-gray-300"}`}>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-center">
              <button
                onClick={handleAddSelectedMembers}
                disabled={selectedNewMembers.size === 0}
                className={`px-8 py-2 rounded-xl text-[13px] transition-all ${selectedNewMembers.size > 0 ? "bg-cyan-500 hover:bg-cyan-600 text-white shadow-sm" : "text-gray-300 cursor-not-allowed"}`}
              >
                {selectedNewMembers.size > 0 ? `Thêm ${selectedNewMembers.size} thành viên` : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Group Modal - Telegram style */}
      {showManageModal && space && space.category === "project" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => { setShowManageModal(false); setProjectSubPanel(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-[380px] max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: "fadeInScale 0.2s ease" }}>
            {/* Header */}
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2">
                {projectSubPanel && (
                  <button onClick={() => setProjectSubPanel(null)} className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                )}
                <h3 className="text-[15px] font-semibold text-gray-900">
                  {projectSubPanel === "members" ? "Thành viên" :
                   projectSubPanel === "access" ? "Quyền truy cập" :
                   projectSubPanel === "type" ? "Loại dự án" :
                   "Cài đặt dự án"}
                </h3>
              </div>
              <button onClick={() => { setShowManageModal(false); setProjectSubPanel(null); }} className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Avatar + Name + Description */}
            <div className="px-5 py-4 flex items-center gap-4 border-b border-gray-100">
              <div className="w-[56px] h-[56px] rounded-2xl flex items-center justify-center text-[20px] text-white shrink-0" style={{ backgroundColor: space.color }}>
                {space.icon}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-gray-400">Tên dự án</label>
                  <input
                    value={manageGroupName}
                    onChange={e => setManageGroupName(e.target.value)}
                    className="w-full text-[14px] text-gray-900 bg-transparent border-b border-gray-200 focus:border-cyan-400 outline-none pb-0.5 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-gray-400">Mô tả</label>
                  <input
                    value={manageGroupDesc}
                    onChange={e => setManageGroupDesc(e.target.value)}
                    placeholder="Thêm mô tả dự án..."
                    className="w-full text-[12px] text-gray-600 bg-transparent border-b border-gray-200 focus:border-cyan-400 outline-none pb-0.5 placeholder:text-gray-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Body — main list or sub-panel */}
            <div className="flex-1 overflow-y-auto">

              {/* ── Main list ── */}
              {!projectSubPanel && (<>
                <div className="border-b border-gray-100">
                  <button onClick={() => setProjectSubPanel("members")} className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-all text-left">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="flex-1 text-[13px] text-gray-800">Thành viên</span>
                    <span className="text-[13px] text-cyan-600">{space.members || 4}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                  <button onClick={() => setProjectSubPanel("access")} className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-all text-left">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <span className="flex-1 text-[13px] text-gray-800">Quyền truy cập</span>
                    <span className="text-[13px] text-cyan-600">{projectAccess === "private" ? "Riêng tư" : "Công khai"}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                  <button onClick={() => setProjectSubPanel("type")} className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-all text-left">
                    <ClipboardList className="w-5 h-5 text-gray-400" />
                    <span className="flex-1 text-[13px] text-gray-800">Loại dự án</span>
                    <span className="text-[13px] text-cyan-600">{projectType === "scrum" ? "Scrum" : projectType === "kanban" ? "Kanban" : "Cơ bản"}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
                <div className="border-b border-gray-100">
                  <div className="w-full flex items-center gap-4 px-5 py-3">
                    <BellOff className="w-5 h-5 text-gray-400" />
                    <span className="flex-1 text-[13px] text-gray-800">Tắt thông báo</span>
                    <div
                      onClick={() => setProjectMuted(p => !p)}
                      className={`w-10 h-[22px] rounded-full relative transition-all cursor-pointer ${projectMuted ? "bg-cyan-500" : "bg-gray-200"}`}
                    >
                      <div className={`w-[18px] h-[18px] bg-white rounded-full absolute top-[2px] transition-all shadow-sm ${projectMuted ? "left-[20px]" : "left-[2px]"}`} />
                    </div>
                  </div>
                </div>
                <div>
                  <button onClick={() => setProjectSubPanel("archive-confirm")} className="w-full flex items-center gap-4 px-5 py-3 hover:bg-amber-50 transition-all text-left">
                    <Archive className="w-5 h-5 text-amber-400" />
                    <span className="text-[13px] text-amber-600">Lưu trữ dự án</span>
                  </button>
                  <button onClick={() => setProjectSubPanel("delete-confirm")} className="w-full flex items-center gap-4 px-5 py-3 hover:bg-red-50 transition-all text-left">
                    <Trash2 className="w-5 h-5 text-red-400" />
                    <span className="text-[13px] text-red-500">Xóa dự án</span>
                  </button>
                </div>
              </>)}

              {/* ── Sub: Thành viên ── */}
              {projectSubPanel === "members" && (
                <div>
                  <button onClick={() => setProjectSubPanel(null)} className="flex items-center gap-2 px-5 py-3 text-[12px] text-gray-500 hover:text-gray-700 border-b border-gray-100 w-full">
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Quay lại
                  </button>
                  <div className="px-5 py-2">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 mb-3">
                      <Search className="w-3.5 h-3.5 text-gray-400" />
                      <input placeholder="Tìm thành viên..." className="flex-1 text-[12px] bg-transparent outline-none text-gray-700 placeholder-gray-400" />
                    </div>
                    {teamMembers.slice(0, space.members || 4).map((m, i) => (
                      <div key={m.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0" style={{ backgroundColor: m.color }}>
                          {m.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-gray-800 font-medium">{m.name}</p>
                          <p className="text-[11px] text-gray-400">{m.role}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${i === 0 ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-gray-100 text-gray-500"}`}>
                          {i === 0 ? "Chủ sở hữu" : "Thành viên"}
                        </span>
                      </div>
                    ))}
                    <button onClick={() => { setShowAddMemberModal(true); setProjectSubPanel(null); setShowManageModal(false); }} className="w-full mt-3 py-2.5 text-[12px] text-cyan-600 border border-dashed border-cyan-200 rounded-lg hover:bg-cyan-50 flex items-center justify-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Thêm thành viên
                    </button>
                  </div>
                </div>
              )}

              {/* ── Sub: Quyền truy cập ── */}
              {projectSubPanel === "access" && (
                <div>
                  <button onClick={() => setProjectSubPanel(null)} className="flex items-center gap-2 px-5 py-3 text-[12px] text-gray-500 hover:text-gray-700 border-b border-gray-100 w-full">
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Quay lại
                  </button>
                  <div className="px-5 py-3 space-y-2">
                    {([
                      { value: "private", label: "Riêng tư", desc: "Chỉ thành viên được mời mới thấy" },
                      { value: "public", label: "Công khai", desc: "Mọi người trong tổ chức có thể xem" },
                    ] as const).map(opt => (
                      <button key={opt.value} onClick={() => setProjectAccess(opt.value)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${projectAccess === opt.value ? "border-cyan-300 bg-cyan-50" : "border-gray-200 hover:bg-gray-50"}`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${projectAccess === opt.value ? "border-cyan-500" : "border-gray-300"}`}>
                          {projectAccess === opt.value && <div className="w-2 h-2 rounded-full bg-cyan-500" />}
                        </div>
                        <div>
                          <p className={`text-[13px] font-medium ${projectAccess === opt.value ? "text-cyan-700" : "text-gray-800"}`}>{opt.label}</p>
                          <p className="text-[11px] text-gray-400">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Sub: Loại dự án ── */}
              {projectSubPanel === "type" && (
                <div>
                  <button onClick={() => setProjectSubPanel(null)} className="flex items-center gap-2 px-5 py-3 text-[12px] text-gray-500 hover:text-gray-700 border-b border-gray-100 w-full">
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Quay lại
                  </button>
                  <div className="px-5 py-3 space-y-2">
                    {([
                      { value: "scrum", label: "Scrum", desc: "Làm việc theo sprint, backlog & board" },
                      { value: "kanban", label: "Kanban", desc: "Luồng công việc liên tục, không sprint" },
                      { value: "basic", label: "Cơ bản", desc: "Quản lý task đơn giản, không phức tạp" },
                    ] as const).map(opt => (
                      <button key={opt.value} onClick={() => setProjectType(opt.value)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${projectType === opt.value ? "border-cyan-300 bg-cyan-50" : "border-gray-200 hover:bg-gray-50"}`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${projectType === opt.value ? "border-cyan-500" : "border-gray-300"}`}>
                          {projectType === opt.value && <div className="w-2 h-2 rounded-full bg-cyan-500" />}
                        </div>
                        <div>
                          <p className={`text-[13px] font-medium ${projectType === opt.value ? "text-cyan-700" : "text-gray-800"}`}>{opt.label}</p>
                          <p className="text-[11px] text-gray-400">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Sub: Archive confirm ── */}
              {projectSubPanel === "archive-confirm" && (
                <div className="px-5 py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                    <Archive className="w-6 h-6 text-amber-500" />
                  </div>
                  <p className="text-[14px] font-semibold text-gray-800 mb-1">Lưu trữ dự án?</p>
                  <p className="text-[12px] text-gray-500 mb-5">Dự án sẽ bị ẩn khỏi danh sách nhưng vẫn có thể khôi phục sau.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setProjectSubPanel(null)} className="flex-1 py-2.5 text-[13px] border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">Huỷ</button>
                    <button onClick={() => { toast.success("Đã lưu trữ dự án"); setShowManageModal(false); setProjectSubPanel(null); }} className="flex-1 py-2.5 text-[13px] bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-medium">Lưu trữ</button>
                  </div>
                </div>
              )}

              {/* ── Sub: Delete confirm ── */}
              {projectSubPanel === "delete-confirm" && (
                <div className="px-5 py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                    <Trash2 className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-[14px] font-semibold text-gray-800 mb-1">Xóa dự án?</p>
                  <p className="text-[12px] text-gray-500 mb-5">Toàn bộ task, sprint và dữ liệu sẽ bị xóa vĩnh viễn. Không thể hoàn tác.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setProjectSubPanel(null)} className="flex-1 py-2.5 text-[13px] border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">Huỷ</button>
                    <button onClick={() => { toast.error("Đã xóa dự án"); setShowManageModal(false); setProjectSubPanel(null); }} className="flex-1 py-2.5 text-[13px] bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium">Xóa vĩnh viễn</button>
                  </div>
                </div>
              )}

            </div>

            {/* Footer — chỉ hiện ở main list */}
            {!projectSubPanel && (
              <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
                <button onClick={() => { setShowManageModal(false); setProjectSubPanel(null); }} className="px-4 py-2 text-[12px] text-gray-600 hover:bg-gray-100 rounded-lg">Huỷ</button>
                <button onClick={() => { toast.success("Đã lưu cài đặt dự án"); setShowManageModal(false); setProjectSubPanel(null); }} className="px-4 py-2 text-[12px] bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-medium">Lưu</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manage Channel Modal - for non-project spaces */}
      {showManageModal && space && space.category !== "project" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => setShowManageModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[380px] max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: "fadeInScale 0.2s ease" }}>

            {/* ── Role badge header ── */}
            <div className="px-5 pt-4 pb-3 flex items-center justify-between">
              <h3 className="text-[15px] text-gray-900" style={{ fontWeight: 600 }}>
                {channelRole === "owner" ? "Chỉnh sửa kênh" : "Thông tin kênh"}
              </h3>
              {activeChannelItem && (
                <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
                  channelRole === "owner"
                    ? "bg-amber-50 text-amber-600 border-amber-200"
                    : channelRole === "member"
                    ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                    : "bg-gray-100 text-gray-500 border-gray-200"
                }`}>
                  {channelRole === "owner" && <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>Chủ kênh</>}
                  {channelRole === "member" && <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>Đã tham gia</>}
                  {channelRole === "viewer" && <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>Đang theo dõi</>}
                </span>
              )}
            </div>

            {/* ── Channel avatar + name ── */}
            <div className="px-5 pb-3 flex items-center gap-4">
              <div className={`relative shrink-0 ${channelRole === "owner" ? "group/avatar cursor-pointer" : ""}`}>
                <div className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center text-[20px] text-white" style={{ backgroundColor: activeChannelItem?.color || space.color }}>
                  {activeChannelItem?.icon || space.icon}
                </div>
                {channelRole === "owner" && (
                  <div className="absolute inset-0 rounded-2xl bg-black/30 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-all">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[10px] uppercase tracking-wider text-gray-400">Tên kênh</label>
                {channelRole === "owner" ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={manageGroupName}
                      onChange={e => setManageGroupName(e.target.value)}
                      className="flex-1 text-[14px] text-gray-900 bg-transparent border-b border-gray-200 focus:border-cyan-400 outline-none pb-1 transition-all"
                    />
                    <button className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                      <Smile className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-[14px] text-gray-900 pb-1">{activeChannelItem?.name || space.name}</p>
                )}
              </div>
            </div>

            {/* ── Description ── */}
            <div className="px-5 pb-4">
              {channelRole === "owner" ? (
                <input
                  value={manageGroupDesc}
                  onChange={e => setManageGroupDesc(e.target.value)}
                  placeholder="Mô tả kênh..."
                  className="w-full text-[13px] text-gray-600 bg-transparent border-b border-gray-200 focus:border-cyan-400 outline-none pb-1 placeholder:text-gray-400 transition-all"
                />
              ) : (
                <p className="text-[12px] text-gray-500 border-b border-gray-100 pb-2">{activeChannelItem?.description || space.description || "Không có mô tả"}</p>
              )}
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto min-h-0">

              {/* ══ OWNER: Full management ══ */}
              {channelRole === "owner" && (<>
                <div className="border-t border-gray-100">
                  <button className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-all text-left" onClick={() => setShowGroupTypeModal(true)}>
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="flex-1 text-[13px] text-gray-800">Loại kênh</span>
                    <span className="text-[13px] text-cyan-600">{groupType === "private" ? "Riêng tư" : "Công khai"}</span>
                  </button>
                  <button className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-all text-left" onClick={() => setManageSubModal("chatHistory")}>
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                    <span className="flex-1 text-[13px] text-gray-800">Lịch sử chat cho thành viên mới</span>
                    <span className="text-[13px] text-cyan-600">Hiển thị</span>
                  </button>
                  <button className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-all text-left" onClick={() => setManageSubModal("topics")}>
                    <LayoutList className="w-5 h-5 text-gray-400" />
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-[13px] text-gray-800">Chủ đề</span>
                      <span className="text-[9px] bg-cyan-50 text-cyan-600 px-1.5 py-0.5 rounded">MỚI</span>
                    </div>
                    <span className="text-[13px] text-cyan-600">Tab</span>
                  </button>
                  <button className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-all text-left" onClick={() => setManageSubModal("appearance")}>
                    <Palette className="w-5 h-5 text-gray-400" />
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-[13px] text-gray-800">Giao diện</span>
                      <span className="text-[9px] bg-cyan-50 text-cyan-600 px-1.5 py-0.5 rounded">MỚI</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
                <div className="border-t border-gray-100 mt-1">
                  <button className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-all text-left" onClick={() => setManageSubModal("reactions")}>
                    <Heart className="w-5 h-5 text-gray-400" />
                    <span className="flex-1 text-[13px] text-gray-800">Biểu cảm</span>
                    <span className="text-[13px] text-cyan-600">Tất cả</span>
                  </button>
                  <button className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-all text-left" onClick={() => setManageSubModal("permissions")}>
                    <Key className="w-5 h-5 text-gray-400" />
                    <span className="flex-1 text-[13px] text-gray-800">Quyền đăng bài</span>
                    <span className="text-[13px] text-cyan-600">{activeChannelItem ? `${(activeChannelItem.allowedPosterIds?.length || 0) + 1}/${space.members || 5}` : "14/15"}</span>
                  </button>
                  <button className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-all text-left" onClick={() => setManageSubModal("inviteLinks")}>
                    <LinkIcon className="w-5 h-5 text-gray-400" />
                    <span className="flex-1 text-[13px] text-gray-800">Liên kết mời</span>
                    <span className="text-[13px] text-cyan-600">1</span>
                  </button>
                  <button className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-all text-left" onClick={() => setManageSubModal("admins")}>
                    <Shield className="w-5 h-5 text-gray-400" />
                    <span className="flex-1 text-[13px] text-gray-800">Quản trị viên</span>
                    <span className="text-[13px] text-cyan-600">1</span>
                  </button>
                  <button className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-all text-left" onClick={() => setManageSubModal("members")}>
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="flex-1 text-[13px] text-gray-800">Thành viên đăng bài</span>
                    <span className="text-[13px] text-cyan-600">{activeChannelItem ? (activeChannelItem.allowedPosterIds?.length || 0) + 1 : space.members || 5}</span>
                  </button>
                  <button className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-all text-left" onClick={() => setManageSubModal("recentActions")}>
                    <History className="w-5 h-5 text-gray-400" />
                    <span className="flex-1 text-[13px] text-gray-800">Hành động gần đây</span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
                <div className="border-t border-gray-100 mt-1">
                  <button className="w-full flex items-center gap-4 px-5 py-3 hover:bg-red-50 transition-all text-left" onClick={() => setManageSubModal("deleteConfirm")}>
                    <Trash2 className="w-5 h-5 text-red-400" />
                    <span className="text-[13px] text-red-500">Xóa kênh</span>
                  </button>
                </div>
              </>)}

              {/* ══ MEMBER: Can view members + notifs, can leave ══ */}
              {channelRole === "member" && (<>
                {/* Info row */}
                <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    {activeChannelItem?.visibility === "private"
                      ? <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                      : <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/></svg>
                    }
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-700" style={{ fontWeight: 500 }}>{activeChannelItem?.visibility === "private" ? "Kênh riêng tư" : "Kênh công khai"}</p>
                    <p className="text-[10px] text-gray-400">Bạn được chủ kênh mời đăng bài</p>
                  </div>
                </div>
                <div className="border-t border-gray-100">
                  <button className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-all text-left" onClick={() => setManageSubModal("members")}>
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="flex-1 text-[13px] text-gray-800">Thành viên kênh</span>
                    <span className="text-[13px] text-indigo-500">{activeChannelItem?.members || space.members || 5}</span>
                  </button>
                  <div className="flex items-center gap-4 px-5 py-3 border-t border-gray-50">
                    <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                    <span className="flex-1 text-[13px] text-gray-800">Thông báo</span>
                    <div
                      className={`w-10 h-[22px] rounded-full relative transition-all cursor-pointer ${!activeChannelItem?.muted ? "bg-indigo-400" : "bg-gray-300"}`}
                      onClick={() => toast.success("Đã cập nhật thông báo")}
                    >
                      <div className={`w-[18px] h-[18px] bg-white rounded-full absolute top-[2px] transition-all shadow-sm ${!activeChannelItem?.muted ? "left-[20px]" : "left-[2px]"}`} />
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-100 mt-1 px-5 py-3">
                  <p className="text-[10px] text-gray-400 mb-2">Quyền của bạn trong kênh này</p>
                  <div className="space-y-1.5">
                    {[
                      { label: "Đăng tin nhắn", ok: true },
                      { label: "Gửi file & ảnh", ok: true },
                      { label: "Xem lịch sử chat", ok: true },
                      { label: "Thêm thành viên", ok: false },
                      { label: "Chỉnh sửa kênh", ok: false },
                      { label: "Xóa tin nhắn người khác", ok: false },
                    ].map(p => (
                      <div key={p.label} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${p.ok ? "bg-green-100" : "bg-gray-100"}`}>
                          {p.ok
                            ? <svg className="w-2.5 h-2.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                            : <svg className="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                          }
                        </div>
                        <span className={`text-[11px] ${p.ok ? "text-gray-700" : "text-gray-400"}`}>{p.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>)}

              {/* ══ VIEWER: Read-only info + notifications only ══ */}
              {channelRole === "viewer" && (<>
                <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-3 bg-gray-50/60">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-600" style={{ fontWeight: 500 }}>Chế độ xem</p>
                    <p className="text-[10px] text-gray-400">Bạn chỉ có thể đọc nội dung kênh này</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 px-5 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-600">Số thành viên</span>
                    <span className="text-[12px] text-gray-800 font-medium">{activeChannelItem?.members || space.members || 5}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-600">Loại kênh</span>
                    <span className="text-[12px] text-gray-800">{activeChannelItem?.visibility === "private" ? "Riêng tư" : "Công khai"}</span>
                  </div>
                </div>
                <div className="border-t border-gray-100">
                  <div className="flex items-center gap-4 px-5 py-3">
                    <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                    <span className="flex-1 text-[13px] text-gray-800">Nhận thông báo</span>
                    <div
                      className={`w-10 h-[22px] rounded-full relative transition-all cursor-pointer ${!activeChannelItem?.muted ? "bg-gray-400" : "bg-gray-300"}`}
                      onClick={() => toast.success("Đã cập nhật thông báo")}
                    >
                      <div className={`w-[18px] h-[18px] bg-white rounded-full absolute top-[2px] transition-all shadow-sm ${!activeChannelItem?.muted ? "left-[20px]" : "left-[2px]"}`} />
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-100 mt-1 px-5 py-3">
                  <p className="text-[10px] text-gray-400 mb-2">Quyền của bạn trong kênh này</p>
                  <div className="space-y-1.5">
                    {[
                      { label: "Xem nội dung kênh", ok: true },
                      { label: "Xem danh sách thành viên", ok: true },
                      { label: "Đăng tin nhắn", ok: false },
                      { label: "Gửi file & ảnh", ok: false },
                      { label: "Thêm thành viên", ok: false },
                      { label: "Chỉnh sửa kênh", ok: false },
                    ].map(p => (
                      <div key={p.label} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${p.ok ? "bg-green-100" : "bg-gray-100"}`}>
                          {p.ok
                            ? <svg className="w-2.5 h-2.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                            : <svg className="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                          }
                        </div>
                        <span className={`text-[11px] ${p.ok ? "text-gray-700" : "text-gray-400"}`}>{p.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>)}

            </div>

            {/* ── Footer ── */}
            <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-end gap-3">
              {channelRole === "owner" && (<>
                <button onClick={() => setShowManageModal(false)} className="px-5 py-2 rounded-xl text-[13px] text-cyan-600 hover:bg-cyan-50 transition-all">Hủy</button>
                <button onClick={() => { toast.success("Đã lưu cài đặt kênh", { duration: 2000 }); setShowManageModal(false); }} className="px-5 py-2 rounded-xl text-[13px] bg-cyan-500 hover:bg-cyan-600 text-white shadow-sm transition-all">Lưu</button>
              </>)}
              {channelRole === "member" && (<>
                <button onClick={() => setShowManageModal(false)} className="px-5 py-2 rounded-xl text-[13px] text-gray-600 hover:bg-gray-100 transition-all">Đóng</button>
                <button onClick={() => { toast.success("Đã rời khỏi kênh"); setShowManageModal(false); }} className="px-5 py-2 rounded-xl text-[13px] bg-red-500 hover:bg-red-600 text-white shadow-sm transition-all">Rời kênh</button>
              </>)}
              {channelRole === "viewer" && (<>
                <button onClick={() => setShowManageModal(false)} className="px-5 py-2 rounded-xl text-[13px] text-gray-600 hover:bg-gray-100 transition-all">Đóng</button>
                <button onClick={() => { toast.success("Đã hủy theo dõi kênh"); setShowManageModal(false); }} className="px-5 py-2 rounded-xl text-[13px] bg-gray-500 hover:bg-gray-600 text-white shadow-sm transition-all">Hủy theo dõi</button>
              </>)}
            </div>
          </div>
        </div>
      )}

      {/* Group Manage Sub-Modals */}
      <GroupManageModals
        subModal={manageSubModal}
        onClose={() => { setManageSubModal(null); setShowManageModal(false); }}
        onBack={() => setManageSubModal(null)}
        spaceName={manageGroupName}
        spaceColor={space?.color || "#0891b2"}
        spaceMembers={space?.members || 5}
      />

      {/* Group Type Modal - Telegram style */}
      {showGroupTypeModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30" onClick={() => setShowGroupTypeModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[380px] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: "fadeInScale 0.2s ease" }}>
            {/* Header */}
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-[15px] text-gray-900">Loại nhóm</h3>
            </div>

            {/* Radio options */}
            <div className="px-5 pb-4">
              <label className="flex items-start gap-3 py-3 cursor-pointer group" onClick={() => setGroupType("public")}>
                <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${groupType === "public" ? "border-cyan-500" : "border-gray-300"}`}>
                  {groupType === "public" && <div className="w-3 h-3 rounded-full bg-cyan-500" />}
                </div>
                <div>
                  <p className="text-[13px] text-gray-900">Nhóm công khai</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">Mọi người có thể tìm nhóm này qua tìm kiếm và tham gia, lịch sử chat hiển thị cho tất cả</p>
                </div>
              </label>
              <label className="flex items-start gap-3 py-3 cursor-pointer group" onClick={() => setGroupType("private")}>
                <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${groupType === "private" ? "border-cyan-500" : "border-gray-300"}`}>
                  {groupType === "private" && <div className="w-3 h-3 rounded-full bg-cyan-500" />}
                </div>
                <div>
                  <p className="text-[13px] text-gray-900">Nhóm riêng tư</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">Chỉ có thể tham gia khi được thêm vào hoặc có liên kết mời</p>
                </div>
              </label>
            </div>

            {/* Primary link */}
            <div className="px-5 pb-2">
              <p className="text-[12px] text-cyan-600 mb-2">Liên kết chính</p>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <span className="flex-1 text-[13px] text-gray-600 truncate">vwork.app/+zepWErfVhpkxZjg1</span>
                <div className="relative" ref={linkMenuRef}>
                  <button onClick={() => setShowLinkMenu(!showLinkMenu)} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${showLinkMenu ? "bg-gray-200 text-gray-600" : "hover:bg-gray-200 text-gray-400 hover:text-gray-600"}`}>
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {showLinkMenu && (
                    <div className="absolute right-0 top-full mt-1.5 w-[180px] bg-white rounded-xl border border-gray-200 shadow-2xl z-[80] py-1.5 overflow-hidden">
                      <button onClick={() => { copyToClipboard("https://vwork.app/+zepWErfVhpkxZjg1").then(() => toast.success("Đã sao chép liên kết", { duration: 2000 })); setShowLinkMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                        <Copy className="w-4 h-4 text-gray-400" />
                        Sao chép
                      </button>
                      <button onClick={() => { setShowShareModal(true); setShareSearch(""); setShareTab("all"); setSelectedShareTargets([]); setShowLinkMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                        <Share2 className="w-4 h-4 text-gray-400" />
                        Chia sẻ
                      </button>
                      <button onClick={() => { setShowQRModal(true); setShowLinkMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left">
                        <QrCode className="w-4 h-4 text-gray-400" />
                        Lấy mã QR
                      </button>
                      <div className="h-px bg-gray-100 mx-3" />
                      <button onClick={() => { toast.error("Đã thu hồi liên kết", { duration: 2000 }); setShowLinkMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-all text-left">
                        <Ban className="w-4 h-4 text-red-400" />
                        Thu hồi
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Copy / Share buttons */}
            <div className="px-5 py-3 flex items-center gap-3">
              <button
                onClick={() => { copyToClipboard("https://vwork.app/+zepWErfVhpkxZjg1").then(() => toast.success("Đã sao chép liên kết", { duration: 2000 })); }}
                className="flex-1 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl py-2.5 text-[13px] transition-all shadow-sm"
              >
                <Link className="w-4 h-4" />
                Sao chép
              </button>
              <button
                onClick={() => { setShowShareModal(true); setShareSearch(""); setShareTab("all"); setSelectedShareTargets([]); }}
                className="flex-1 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl py-2.5 text-[13px] transition-all shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                Chia sẻ
              </button>
            </div>

            {/* Info text */}
            <div className="px-5 pb-3">
              <p className="text-[11px] text-gray-400">Bất kỳ ai có ứng dụng VWork đều có thể tham gia nhóm của bạn qua liên kết này.</p>
            </div>

            {/* Content protection */}
            <div className="border-t border-gray-100">
              <div className="px-5 pt-3 pb-1">
                <p className="text-[12px] text-cyan-600">Bảo vệ nội dung</p>
              </div>
              <div className="flex items-center gap-4 px-5 py-3">
                <span className="flex-1 text-[13px] text-gray-800">Hạn chế lưu nội dung</span>
                <button
                  onClick={() => setRestrictSaving(!restrictSaving)}
                  className={`w-11 h-6 rounded-full transition-all relative ${restrictSaving ? "bg-cyan-500" : "bg-gray-300"}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${restrictSaving ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
              <div className="px-5 pb-4">
                <p className="text-[11px] text-gray-400">Thành viên sẽ không thể sao chép, lưu hoặc chuyển tiếp nội dung từ nhóm này.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowGroupTypeModal(false)}
                className="px-5 py-2 rounded-xl text-[13px] text-cyan-600 hover:bg-cyan-50 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={() => { toast.success("Đã lưu loại nhóm", { duration: 2000 }); setShowGroupTypeModal(false); }}
                className="px-5 py-2 rounded-xl text-[13px] bg-cyan-500 hover:bg-cyan-600 text-white shadow-sm transition-all"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (() => {
        const linkUrl = "https://vwork.app/+zepWErfVhpkxZjg1";
        // Simple QR-like pattern generator (visual representation)
        const generateQRPattern = (canvas: HTMLCanvasElement) => {
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          const size = 220;
          canvas.width = size;
          canvas.height = size;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, size, size);
          const cellSize = 5;
          const gridSize = Math.floor(size / cellSize);
          ctx.fillStyle = "#1a1a2e";
          // Generate deterministic pattern from URL
          let seed = 0;
          for (let i = 0; i < linkUrl.length; i++) seed = ((seed << 5) - seed + linkUrl.charCodeAt(i)) | 0;
          const next = () => { seed = (seed * 16807) % 2147483647; return (seed & 0x7fffffff) / 0x7fffffff; };
          // Draw finder patterns (3 corners)
          const drawFinder = (x: number, y: number) => {
            for (let dy = 0; dy < 7; dy++) for (let dx = 0; dx < 7; dx++) {
              if (dy === 0 || dy === 6 || dx === 0 || dx === 6 || (dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4))
                ctx.fillRect((x + dx) * cellSize, (y + dy) * cellSize, cellSize, cellSize);
            }
          };
          drawFinder(2, 2);
          drawFinder(gridSize - 9, 2);
          drawFinder(2, gridSize - 9);
          // Data area
          for (let y = 0; y < gridSize; y++) for (let x = 0; x < gridSize; x++) {
            if ((x >= 2 && x <= 8 && y >= 2 && y <= 8) || (x >= gridSize - 9 && x <= gridSize - 3 && y >= 2 && y <= 8) || (x >= 2 && x <= 8 && y >= gridSize - 9 && y <= gridSize - 3)) continue;
            if (next() > 0.55) ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          }
          // Center logo area (white circle)
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#06b6d4";
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 14px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("T", size / 2, size / 2 + 1);
        };
        return (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30" onClick={() => setShowQRModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-[340px] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: "fadeInScale 0.2s ease" }}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h3 className="text-[15px] text-gray-900">Mã QR</h3>
                <button onClick={() => setShowQRModal(false)} className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center px-5 pb-4">
                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-3">
                  <canvas
                    ref={el => { if (el) generateQRPattern(el); }}
                    className="rounded-lg"
                    style={{ width: 220, height: 220 }}
                  />
                </div>
                <p className="text-[12px] text-gray-500 text-center mb-1">Quét mã để tham gia nhóm</p>
                <p className="text-[12px] text-cyan-600 text-center font-medium">{linkUrl.replace("https://", "")}</p>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    const canvas = document.querySelector("canvas");
                    if (canvas) {
                      const link = document.createElement("a");
                      link.download = "vwork-qr.png";
                      link.href = canvas.toDataURL("image/png");
                      link.click();
                    }
                    toast.success("Đã tải xuống mã QR", { duration: 2000 });
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl py-2.5 text-[13px] transition-all shadow-sm"
                >
                  <FileDown className="w-4 h-4" />
                  Lưu ảnh
                </button>
                <button
                  onClick={() => {
                    copyToClipboard(linkUrl).then(() => toast.success("Đã sao chép liên kết", { duration: 2000 }));
                  }}
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl py-2.5 text-[13px] transition-all"
                >
                  <Copy className="w-4 h-4" />
                  Sao chép
                </button>
              </div>

              {/* Share */}
              <div className="px-5 pb-4">
                <button
                  onClick={() => { setShowQRModal(false); setShowShareModal(true); setShareSearch(""); setShareTab("all"); setSelectedShareTargets([]); }}
                  className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl py-2.5 text-[13px] transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Chia sẻ mã QR
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Share Modal - Telegram style */}
      {showShareModal && (() => {
        const shareContacts = [
          { id: "saved", name: "Tin nhắn đã lưu", type: "misc" as const, icon: "📑", color: "#6366f1" },
          { id: "ba-cv", name: "BA công việc phòng GP", type: "work" as const, initials: "BG", color: "#3b82f6" },
          { id: "fintech", name: "Dự án Fintech", type: "work" as const, initials: "DF", color: "#6366f1" },
          { id: "csdl", name: "CSDL Bộ giáo dục", type: "work" as const, initials: "CD", color: "#3b82f6" },
          { id: "da-bgd", name: "Dự án Bộ GD", type: "work" as const, initials: "DG", color: "#10b981" },
          { id: "anh-hung", name: "Anh Hưng PGD", type: "misc" as const, initials: "AH", color: "#8b5cf6" },
          { id: "portal", name: "[VHV] Portal", type: "work" as const, initials: "VP", color: "#6366f1" },
          { id: "huyen-trang", name: "Huyền Trang Trịnh VHV", type: "misc" as const, initials: "HT", color: "#ec4899" },
          { id: "hai-mt", name: "Hải MT", type: "misc" as const, initials: "HM", color: "#f43f5e" },
          { id: "k12", name: "[VHV] K12 Online 2026", type: "work" as const, initials: "K12", color: "#f59e0b" },
          { id: "ba-ai", name: "BA- AI Products", type: "work" as const, initials: "BP", color: "#6366f1" },
          { id: "giai-phap", name: "Phòng giải pháp", type: "work" as const, initials: "GP", color: "#22c55e" },
          { id: "thoat2", name: "Thoát 2.0", type: "misc" as const, initials: "T2", color: "#64748b" },
          { id: "nha-qa", name: "Anh Nhã QA", type: "misc" as const, initials: "AN", color: "#0ea5e9" },
          { id: "minh-tt", name: "Minh TT", type: "misc" as const, initials: "MT", color: "#e11d48" },
          { id: "vhv-2026", name: "VHV 2026", type: "work" as const, initials: "V26", color: "#7c3aed" },
        ];
        const filtered = shareContacts.filter(c => {
          const matchTab = shareTab === "all" || (shareTab === "work" && c.type === "work") || (shareTab === "misc" && c.type === "misc");
          const matchSearch = !shareSearch || c.name.toLowerCase().includes(shareSearch.toLowerCase());
          return matchTab && matchSearch;
        });
        const toggleTarget = (id: string) => setSelectedShareTargets(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        return (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30" onClick={() => setShowShareModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-[360px] max-h-[520px] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: "fadeInScale 0.2s ease" }}>
              {/* Header */}
              <div className="px-5 pt-5 pb-2">
                <h3 className="text-[15px] text-gray-900">Chia sẻ đến</h3>
              </div>

              {/* Search */}
              <div className="px-5 pb-2">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                  <Search className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    value={shareSearch}
                    onChange={e => setShareSearch(e.target.value)}
                    placeholder="Tìm kiếm"
                    className="flex-1 text-[13px] text-gray-700 bg-transparent outline-none placeholder:text-gray-400"
                    autoFocus
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="px-5 pb-2 flex items-center gap-4">
                {([["all", "Tất cả"], ["work", "Công việc"], ["misc", "Linh tinh"]] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setShareTab(key)}
                    className={`text-[13px] pb-1 transition-all ${shareTab === key ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
                <div className="grid grid-cols-4 gap-1">
                  {filtered.map(contact => {
                    const selected = selectedShareTargets.includes(contact.id);
                    return (
                      <button
                        key={contact.id}
                        onClick={() => toggleTarget(contact.id)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${selected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                      >
                        <div className="relative">
                          <div
                            className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-white text-[14px] shrink-0"
                            style={{ backgroundColor: contact.color }}
                          >
                            {contact.icon || contact.initials}
                          </div>
                          {selected && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-700 text-center leading-tight line-clamp-2 w-full">{contact.name}</span>
                      </button>
                    );
                  })}
                </div>
                {filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Search className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-[13px]">Không tìm thấy kết quả</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 rounded-xl text-[13px] text-cyan-600 hover:bg-cyan-50 transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    copyToClipboard("https://vwork.app/+zepWErfVhpkxZjg1").then(() => toast.success("Đã sao chép liên kết chia sẻ", { duration: 2000 }));
                    setShowShareModal(false);
                  }}
                  className="px-4 py-2 rounded-xl text-[13px] text-cyan-600 hover:bg-cyan-50 transition-all"
                >
                  Sao chép liên kết
                </button>
              </div>

              {/* Selected bar */}
              {selectedShareTargets.length > 0 && (
                <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-1.5 overflow-x-auto">
                    {selectedShareTargets.map(id => {
                      const c = shareContacts.find(x => x.id === id);
                      return c ? (
                        <div key={id} className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] shrink-0" style={{ backgroundColor: c.color }}>
                          {c.icon || c.initials}
                        </div>
                      ) : null;
                    })}
                  </div>
                  <button
                    onClick={() => {
                      toast.success(`Đã chia sẻ đến ${selectedShareTargets.length} người/nhóm`, { duration: 2000 });
                      setShowShareModal(false);
                    }}
                    className="w-10 h-10 bg-cyan-500 hover:bg-cyan-600 rounded-full flex items-center justify-center text-white shadow-md transition-all shrink-0"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Create Button with type dropdown ──
function CreateButton({ onAddTask }: { onAddTask: (type?: "task" | "story" | "bug" | "epic") => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const items: { type: "task" | "story" | "bug" | "epic"; icon: string; label: string; desc: string; color: string }[] = [
    { type: "task",  icon: "☑",  label: "Task",  desc: "Công việc thông thường", color: "#0891b2" },
    { type: "story", icon: "📖", label: "Story", desc: "Tính năng từ góc nhìn user", color: "#7c3aed" },
    { type: "bug",   icon: "🐛", label: "Bug",   desc: "Lỗi cần được xử lý", color: "#dc2626" },
    { type: "epic",  icon: "⚡", label: "Epic",  desc: "Nhóm tính năng lớn", color: "#d97706" },
  ];

  return (
    <div className="relative" ref={ref}>
      {/* Main button + chevron */}
      <div className="flex items-stretch rounded-lg overflow-hidden shadow-sm shadow-cyan-500/20">
        <button
          onClick={() => { onAddTask("task"); setOpen(false); }}
          className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-[12px] px-3.5 py-[7px] hover:from-cyan-600 hover:to-teal-600 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Tạo
        </button>
        <button
          onClick={() => setOpen(o => !o)}
          className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-1.5 hover:from-teal-600 hover:to-teal-700 transition-all border-l border-teal-400/40"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 py-1">
          <p className="px-3 py-1.5 text-[9px] text-gray-400 uppercase tracking-wider font-medium">Chọn loại</p>
          {items.map(item => (
            <button
              key={item.type}
              onClick={() => { onAddTask(item.type); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left group"
            >
              <span className="text-[16px] w-6 text-center">{item.icon}</span>
              <div>
                <p className="text-[12px] font-medium text-gray-800 group-hover:text-gray-900">{item.label}</p>
                <p className="text-[10px] text-gray-400">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}