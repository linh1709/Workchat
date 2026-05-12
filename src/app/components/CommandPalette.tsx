import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Search, ArrowRight, Hash, FolderKanban, Bot, User, UsersRound,
  MessageSquare, List, LayoutGrid, Table2, CalendarDays, ChartGantt,
  Target, Zap, BarChart3, Clock, FileText, PenTool, Brain,
  ClipboardList, Globe, Map, Activity, Video, Columns3, PieChart,
  Home, Inbox, Users, Settings, Plus, CheckCircle2,
  ArrowUpRight, Star, Command, CornerDownLeft, ChevronUp, GraduationCap, Cpu
} from "lucide-react";
import { type Task, statusConfig, priorityConfig, spaces, spaceCategories, type Space } from "./data";
import { getAllChannelItems } from "./ChannelDetailSidebar";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onViewChange: (view: string) => void;
  onSpaceSelect: (id: string | null) => void;
  onAddTask: () => void;
  currentView: string;
  selectedSpace: string | null;
  onChannelSelect?: (channelId: string) => void;
  onChannelItemSelect?: (channelId: string, itemId: string) => void;
}

type CommandGroup = {
  label: string;
  items: CommandItem[];
};

type CommandItem = {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string;
  badge?: string;
  badgeColor?: string;
};

const viewDefs: Record<string, { icon: React.ReactNode; label: string }> = {
  dashboard: { icon: <Home className="w-4 h-4" />, label: "Home" },
  inbox: { icon: <Inbox className="w-4 h-4" />, label: "Inbox" },
  docs: { icon: <FileText className="w-4 h-4" />, label: "Docs" },
  goals: { icon: <Target className="w-4 h-4" />, label: "Goals" },
  sprints: { icon: <Zap className="w-4 h-4" />, label: "Sprints" },
  dashboards: { icon: <BarChart3 className="w-4 h-4" />, label: "Dashboards" },
  timetracking: { icon: <Clock className="w-4 h-4" />, label: "Time Tracking" },
  workload: { icon: <PieChart className="w-4 h-4" />, label: "Workload" },
  automations: { icon: <Zap className="w-4 h-4" />, label: "Automations" },
  activity: { icon: <Activity className="w-4 h-4" />, label: "Activity" },
  whiteboard: { icon: <PenTool className="w-4 h-4" />, label: "Whiteboard" },
  mindmap: { icon: <Brain className="w-4 h-4" />, label: "Mind Map" },
  forms: { icon: <ClipboardList className="w-4 h-4" />, label: "Forms" },
  team: { icon: <Users className="w-4 h-4" />, label: "Team" },
  settings: { icon: <Settings className="w-4 h-4" />, label: "Settings" },
  chat: { icon: <MessageSquare className="w-4 h-4" />, label: "Chat" },
  list: { icon: <List className="w-4 h-4" />, label: "List View" },
  board: { icon: <LayoutGrid className="w-4 h-4" />, label: "Board View" },
  table: { icon: <Table2 className="w-4 h-4" />, label: "Table View" },
  calendar: { icon: <CalendarDays className="w-4 h-4" />, label: "Calendar View" },
  gantt: { icon: <ChartGantt className="w-4 h-4" />, label: "Gantt View" },
  timeline: { icon: <Columns3 className="w-4 h-4" />, label: "Timeline" },
};

const categoryIcons: Record<string, React.ReactNode> = {
  personal: <User className="w-3.5 h-3.5" />,
  group: <UsersRound className="w-3.5 h-3.5" />,
  channel: <Hash className="w-3.5 h-3.5" />,
  project: <FolderKanban className="w-3.5 h-3.5" />,
  elearning: <GraduationCap className="w-3.5 h-3.5" />,
  bot: <Cpu className="w-3.5 h-3.5" />,
};

export function CommandPalette({
  isOpen, onClose, tasks, onTaskClick, onViewChange, onSpaceSelect, onAddTask, currentView, selectedSpace,
  onChannelSelect, onChannelItemSelect,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(["chat module", "Sprint 12", "API", "design review"]);
  const [scope, setScope] = useState<"all" | "tasks" | "spaces" | "nav" | "actions">("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      setScope("all");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Detect scope prefix
  useEffect(() => {
    if (query.startsWith("/")) setScope("actions");
    else if (query.startsWith("#")) setScope("spaces");
    else if (query.startsWith(">")) setScope("nav");
    else if (query.startsWith("@")) setScope("tasks");
    else if (scope !== "all" && !query) setScope("all");
  }, [query]);

  const effectiveQuery = query.replace(/^[/#>@]\s*/, "");

  const addToRecent = (term: string) => {
    if (!term.trim() || term.length < 2) return;
    setRecentSearches(prev => [term, ...prev.filter(s => s !== term)].slice(0, 6));
  };

  // Build command groups
  const groups = useMemo<CommandGroup[]>(() => {
    const q = effectiveQuery.toLowerCase().trim();

    // Quick actions (always show when no query, or match)
    const quickActions: CommandItem[] = [
      { id: "qa-new-task", label: "Tạo task mới", sublabel: "Mở form tạo task", icon: <Plus className="w-4 h-4 text-cyan-600" />, action: () => { onAddTask(); onClose(); }, keywords: "create new task tao moi" },
      { id: "qa-home", label: "Về trang chủ", sublabel: "Dashboard", icon: <Home className="w-4 h-4 text-gray-500" />, action: () => { onViewChange("dashboard"); onSpaceSelect(null); onClose(); }, keywords: "home trang chu dashboard" },
    ];

    // Navigation items
    const navItems: CommandItem[] = Object.entries(viewDefs).map(([k, v]) => ({
      id: `nav-${k}`,
      label: v.label,
      sublabel: k === currentView ? "Đang xem" : "Chuyển tới",
      icon: <span className={k === currentView ? "text-cyan-600" : "text-gray-400"}>{v.icon}</span>,
      action: () => { onViewChange(k); if (!["chat", "list", "board", "table", "calendar", "gantt", "timeline"].includes(k)) onSpaceSelect(null); onClose(); },
      keywords: `${v.label} go navigate view chuyen`,
      badge: k === currentView ? "Active" : undefined,
      badgeColor: k === currentView ? "#0891b2" : undefined,
    }));

    // Spaces
    const spaceItems: CommandItem[] = spaces.map(space => ({
      id: `space-${space.id}`,
      label: space.name,
      sublabel: spaceCategories.find(c => c.key === space.category)?.label || space.category,
      icon: space.category === "channel" ? <Hash className="w-4 h-4 text-indigo-400" /> :
        space.category === "bot" ? <Bot className="w-4 h-4 text-violet-500" /> :
        <div className="w-5 h-5 rounded flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: space.color }}>{space.icon}</div>,
      action: () => { onSpaceSelect(space.id); onViewChange("chat"); onClose(); },
      keywords: `${space.name} space ${space.category} ${space.description || ""}`,
      badge: selectedSpace === space.id ? "Active" : space.unread ? `${space.unread}` : undefined,
      badgeColor: selectedSpace === space.id ? "#0891b2" : space.unread ? "#dc2626" : undefined,
    }));

    // Tasks
    const taskItems: CommandItem[] = tasks.slice(0, 50).map(task => ({
      id: `task-${task.id}`,
      label: task.title,
      sublabel: `${statusConfig[task.status].label} · ${task.assignee?.name || "Unassigned"}`,
      icon: <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: statusConfig[task.status].color }} />,
      action: () => { onTaskClick(task); onClose(); },
      keywords: `${task.title} ${task.description || ""} ${task.assignee?.name || ""} ${task.tags.join(" ")} task`,
      badge: priorityConfig[task.priority]?.icon,
      badgeColor: priorityConfig[task.priority]?.color,
    }));

    // Channel items (only shown when searching)
    const channelItemsList = getAllChannelItems();
    const channelItemsCmd: CommandItem[] = channelItemsList.map(ci => ({
      id: `chi-${ci.channelId}-${ci.itemId}`,
      label: ci.itemName,
      sublabel: `${ci.channelEmoji} ${ci.channelName}`,
      icon: <span className="text-[14px]">{ci.itemEmoji || "📄"}</span>,
      action: () => {
        if (onChannelItemSelect) {
          onChannelItemSelect(ci.channelId, ci.itemId);
        } else {
          onSpaceSelect("sp-channel");
          onViewChange("chat");
        }
        onClose();
      },
      keywords: `${ci.itemName} ${ci.channelName} channel kenh`,
    }));

    // Filter by query
    const filter = (items: CommandItem[]) => {
      if (!q) return items;
      return items.filter(item => {
        const searchStr = `${item.label} ${item.sublabel || ""} ${item.keywords || ""}`.toLowerCase();
        return q.split(" ").every(word => searchStr.includes(word));
      });
    };

    const filteredQuickActions = filter(quickActions);
    const filteredNav = filter(navItems);
    const filteredSpaces = filter(spaceItems);
    const filteredTasks = filter(taskItems);
    const filteredChannelItems = q ? filter(channelItemsCmd) : [];

    const result: CommandGroup[] = [];
    if (filteredQuickActions.length > 0) result.push({ label: "Quick Actions", items: filteredQuickActions });
    if (filteredTasks.length > 0) result.push({ label: `Tasks (${filteredTasks.length})`, items: filteredTasks.slice(0, q ? 10 : 5) });
    if (filteredChannelItems.length > 0) result.push({ label: `Kênh (${filteredChannelItems.length})`, items: filteredChannelItems.slice(0, 8) });
    if (filteredSpaces.length > 0) result.push({ label: `Spaces (${filteredSpaces.length})`, items: filteredSpaces.slice(0, q ? 10 : 5) });
    if (filteredNav.length > 0) result.push({ label: "Navigation", items: filteredNav.slice(0, q ? 20 : 6) });

    return result;
  }, [query, tasks, currentView, selectedSpace]);

  // Flatten for keyboard navigation
  const allItems = useMemo(() => groups.flatMap(g => g.items), [groups]);

  // Keep activeIndex in bounds
  useEffect(() => {
    if (activeIndex >= allItems.length) setActiveIndex(Math.max(0, allItems.length - 1));
  }, [allItems.length]);

  // Keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && allItems[activeIndex]) {
      e.preventDefault();
      allItems[activeIndex].action();
    } else if (e.key === "Escape") {
      onClose();
    }
  }, [allItems, activeIndex, onClose]);

  // Scroll active into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!isOpen) return null;

  let globalIdx = 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[560px] bg-white rounded-2xl shadow-2xl border border-gray-300 overflow-hidden flex flex-col max-h-[60vh]">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder={scope === "tasks" ? "@ Tìm tasks..." : scope === "spaces" ? "# Tìm spaces..." : scope === "nav" ? "> Chuyển tới view..." : scope === "actions" ? "/ Thao tác nhanh..." : "Tìm task, space, view, hoặc thao tác..."}
            className="flex-1 text-[14px] text-gray-800 placeholder-gray-400 outline-none bg-transparent"
          />
          {scope !== "all" && (
            <button onClick={() => { setScope("all"); setQuery(""); }} className="text-[9px] px-2 py-0.5 bg-cyan-50 text-cyan-600 rounded-full border border-cyan-200 hover:bg-cyan-100">
              {scope === "tasks" ? "@Tasks" : scope === "spaces" ? "#Spaces" : scope === "nav" ? ">Nav" : "/Actions"} ✕
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
            ESC
          </kbd>
        </div>

        {/* Scope hints - shown when no query */}
        {!query && (
          <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-1.5">
            {[
              { key: "all" as const, label: "All", prefix: "" },
              { key: "tasks" as const, label: "@Tasks", prefix: "@" },
              { key: "spaces" as const, label: "#Spaces", prefix: "#" },
              { key: "nav" as const, label: ">Views", prefix: ">" },
              { key: "actions" as const, label: "/Actions", prefix: "/" },
            ].map(s => (
              <button key={s.key} onClick={() => { setScope(s.key); if (s.prefix) setQuery(s.prefix); }}
                className={`text-[9px] px-2 py-1 rounded-lg transition-all ${scope === s.key ? "bg-cyan-50 text-cyan-700 border border-cyan-200" : "text-gray-400 hover:bg-gray-50 border border-transparent"}`}>
                {s.label}
              </button>
            ))}
            {recentSearches.length > 0 && (
              <>
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <span className="text-[8px] text-gray-300">Recent:</span>
                {recentSearches.slice(0, 3).map(r => (
                  <button key={r} onClick={() => { setQuery(r); setActiveIndex(0); }}
                    className="text-[9px] text-gray-400 hover:text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded hover:bg-gray-100 transition-all truncate max-w-[80px]">
                    {r}
                  </button>
                ))}
              </>
            )}
          </div>
        )}

        {/* Results */}
        <div ref={listRef} className="flex-1 overflow-y-auto py-2">
          {allItems.length === 0 && (
            <div className="text-center py-10">
              <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-[13px] text-gray-400">Không tìm thấy kết quả</p>
              <p className="text-[11px] text-gray-300 mt-1">Thử từ khóa khác</p>
            </div>
          )}

          {groups.map((group) => (
            <div key={group.label}>
              <div className="px-4 py-1.5">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider">{group.label}</span>
              </div>
              {group.items.map((item) => {
                const idx = globalIdx++;
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={item.id}
                    data-index={idx}
                    onClick={item.action}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-all ${
                      isActive ? "bg-cyan-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="w-5 h-5 flex items-center justify-center shrink-0">
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] truncate ${isActive ? "text-gray-900" : "text-gray-700"}`}>
                        {query ? highlightMatch(item.label, query) : item.label}
                      </p>
                      {item.sublabel && (
                        <p className="text-[10px] text-gray-400 truncate">{item.sublabel}</p>
                      )}
                    </div>
                    {item.badge && (
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: item.badgeColor ? `${item.badgeColor}15` : "#f3f4f6",
                          color: item.badgeColor || "#6b7280",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <CornerDownLeft className="w-3 h-3 text-cyan-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 flex items-center gap-4 text-[9px] text-gray-400 shrink-0">
          <span className="flex items-center gap-1">
            <kbd className="bg-gray-200 text-gray-500 px-1 py-0.5 rounded text-[8px]">↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-gray-200 text-gray-500 px-1 py-0.5 rounded text-[8px]">↵</kbd> select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-gray-200 text-gray-500 px-1 py-0.5 rounded text-[8px]">esc</kbd> close
          </span>
          <span className="ml-auto text-gray-300">VWork Pro</span>
        </div>
      </div>
    </div>
  );
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const words = query.toLowerCase().split(" ").filter(Boolean);
  const regex = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        words.some(w => part.toLowerCase() === w) ? (
          <span key={i} className="text-cyan-700 bg-cyan-100 rounded px-0.5">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}