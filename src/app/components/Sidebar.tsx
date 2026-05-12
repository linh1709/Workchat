import { useState } from "react";
import {
  Search, Plus, ChevronDown, ChevronRight, Inbox,
  Users, Settings, Star, Bell, Pin,
  Home, BarChart3, Clock, FileText, MessageSquare,
  Sparkles, Bot, Target, Zap, GitBranch,
  Activity, StickyNote, Lightbulb, PenTool, TextCursorInput,
  CalendarDays, User, Hash, FolderKanban,
  GraduationCap, Cpu, UsersRound, Gamepad2,
  Share2, MoreHorizontal, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import { spaces, spaceCategories, type Space, type SpaceCategory, personalChatItems } from "./data";
import { channelItems } from "./data";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  selectedSpace: string | null;
  onSpaceSelect: (id: string | null) => void;
  collapsed: boolean;
  onToggleSidebar?: () => void;
  onOpenCommandPalette?: () => void;
  showProjectsSidebar?: boolean;
  onToggleProjectsSidebar?: () => void;
  showPersonalSidebar?: boolean;
  onTogglePersonalSidebar?: () => void;
  showChannelSidebar?: boolean;
  onToggleChannelSidebar?: () => void;
}

const categoryIcons: Record<SpaceCategory, React.ReactNode> = {
  personal: <User className="w-3 h-3" />,
  group: <UsersRound className="w-3 h-3" />,
  channel: <Hash className="w-3 h-3" />,
  project: <FolderKanban className="w-3 h-3" />,
  elearning: <GraduationCap className="w-3 h-3" />,
  bot: <Cpu className="w-3 h-3" />,
};

const categoryColors: Record<SpaceCategory, string> = {
  personal: "#0891b2",
  group: "#059669",
  channel: "#6366f1",
  project: "#7c3aed",
  elearning: "#d97706",
  bot: "#dc2626",
};

export function Sidebar({ currentView, onViewChange, selectedSpace, onSpaceSelect, collapsed, onToggleSidebar, onOpenCommandPalette, showProjectsSidebar, onToggleProjectsSidebar, showPersonalSidebar, onTogglePersonalSidebar, showChannelSidebar, onToggleChannelSidebar }: SidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    personal: false,
    group: true,
    channel: true,
    project: true,
    elearning: false,
    bot: true,
  });
  const [expandedMore, setExpandedMore] = useState(false);
  const [userStatus, setUserStatus] = useState<"online" | "away" | "busy" | "offline">("online");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(["p1"]);
  const [showFavorites, setShowFavorites] = useState(true);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleSpaceClick = (space: Space) => {
    onSpaceSelect(space.id);
    onViewChange("chat");
  };

  const totalUnread = spaces.reduce((sum, s) => sum + (s.unread || 0), 0);
  const personalUnread = personalChatItems.reduce((sum, i) => sum + (i.unread || 0), 0);
  const channelUnread = channelItems.reduce((sum, c) => sum + (c.unread || 0), 0);

  // ══════════════ COLLAPSED STATE ══════════════
  if (collapsed) {
    return (
      <div className="hidden md:flex w-[56px] h-full bg-white flex-col items-center py-3 gap-0.5 border-r border-gray-300/60 shrink-0">
        {/* Logo */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center mb-2 shadow-md shadow-cyan-500/20">
          <Sparkles className="w-4.5 h-4.5 text-white" />
        </div>

        {/* Expand button */}
        <CollapsedBtn icon={<PanelLeftOpen className="w-[18px] h-[18px]" />} active={false} onClick={() => onToggleSidebar?.()} tooltip="Mở rộng sidebar" />

        <div className="w-6 h-px bg-gray-200 my-1" />

        {/* Search */}
        <CollapsedBtn icon={<Search className="w-[18px] h-[18px]" />} active={false} onClick={() => onOpenCommandPalette?.()} tooltip="Tìm kiếm (⌘K)" />

        <div className="w-6 h-px bg-gray-200 my-1" />

        {/* Space categories */}
        <CollapsedBtn
          icon={<User className="w-[18px] h-[18px]" />}
          active={showPersonalSidebar || false}
          onClick={() => onTogglePersonalSidebar?.()}
          tooltip="Cá nhân"
          color="#0891b2"
          badge={personalUnread > 0}
        />
        <CollapsedBtn
          icon={<Hash className="w-[18px] h-[18px]" />}
          active={showChannelSidebar || false}
          onClick={() => onToggleChannelSidebar?.()}
          tooltip="Kênh"
          color="#6366f1"
          badge={channelUnread > 0}
        />
        <CollapsedBtn
          icon={<FolderKanban className="w-[18px] h-[18px]" />}
          active={showProjectsSidebar || false}
          onClick={() => onToggleProjectsSidebar?.()}
          tooltip="Dự Án"
          color="#7c3aed"
        />

        {/* Group spaces */}
        {spaces.filter(s => s.category === "group").map(space => (
          <CollapsedBtn
            key={space.id}
            icon={
              <div className="w-5 h-5 rounded-md flex items-center justify-center text-[8px] text-white" style={{ backgroundColor: space.color }}>
                {space.icon}
              </div>
            }
            active={selectedSpace === space.id}
            onClick={() => { onSpaceSelect(space.id); onViewChange("chat"); }}
            tooltip={space.name}
            badge={(space.unread || 0) > 0}
          />
        ))}

        <div className="w-6 h-px bg-gray-200 my-1" />

        {/* More nav items */}
        <CollapsedBtn icon={<Inbox className="w-[18px] h-[18px]" />} active={currentView === "inbox"} onClick={() => { onViewChange("inbox"); onSpaceSelect(null); }} tooltip="Inbox" badge />
        <CollapsedBtn icon={<Target className="w-[18px] h-[18px]" />} active={currentView === "goals"} onClick={() => { onViewChange("goals"); onSpaceSelect(null); }} tooltip="Goals" />
        <CollapsedBtn icon={<BarChart3 className="w-[18px] h-[18px]" />} active={currentView === "dashboards"} onClick={() => { onViewChange("dashboards"); onSpaceSelect(null); }} tooltip="Dashboards" />
        <CollapsedBtn icon={<Bell className="w-[18px] h-[18px]" />} active={currentView === "reminders"} onClick={() => { onViewChange("reminders"); onSpaceSelect(null); }} tooltip="Reminders" badge />

        {/* Bottom spacer */}
        <div className="flex-1" />

        {/* Settings */}
        <CollapsedBtn icon={<Settings className="w-[18px] h-[18px]" />} active={currentView === "settings"} onClick={() => { onViewChange("settings"); onSpaceSelect(null); }} tooltip="Settings" />

        {/* User avatar */}
        <div className="relative mt-1">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-gray-50"
            title="Nguyễn Minh"
          >
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-[10px] text-white">M</div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${userStatus === "online" ? "bg-emerald-500" : userStatus === "away" ? "bg-amber-500" : userStatus === "busy" ? "bg-red-500" : "bg-gray-400"}`} />
            </div>
          </button>
          {showStatusMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowStatusMenu(false)} />
              <div className="absolute bottom-full left-full ml-2 mb-0 w-[180px] bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1" onClick={e => e.stopPropagation()}>
                <p className="px-3 py-1 text-[9px] text-gray-500 uppercase tracking-wider">Set status</p>
                {([
                  { key: "online" as const, label: "Online", color: "#059669", desc: "Đang hoạt động" },
                  { key: "away" as const, label: "Away", color: "#d97706", desc: "Đang rời đi" },
                  { key: "busy" as const, label: "Busy", color: "#dc2626", desc: "Không làm phiền" },
                  { key: "offline" as const, label: "Offline", color: "#9ca3af", desc: "Ẩn trạng thái" },
                ]).map(s => (
                  <button key={s.key} onClick={() => { setUserStatus(s.key); setShowStatusMenu(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] hover:bg-gray-50 transition-all ${userStatus === s.key ? "bg-gray-50" : ""}`}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <div className="flex-1 text-left">
                      <p className="text-gray-700">{s.label}</p>
                      <p className="text-[9px] text-gray-400">{s.desc}</p>
                    </div>
                    {userStatus === s.key && <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ══════════════ EXPANDED STATE ══════════════
  // Group spaces by category
  const grouped = spaceCategories.map(cat => ({
    ...cat,
    spaces: spaces.filter(s => s.category === cat.key),
  }));

  return (
    <div className="hidden md:flex w-[264px] h-full bg-white flex-col border-r border-gray-300/60 overflow-hidden shrink-0">
      {/* Workspace Header */}
      <div className="px-4 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/20">
          <Sparkles className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] text-gray-900 tracking-[-0.01em] truncate" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>VWork Pro</p>
          <p className="text-[11px] text-gray-600 truncate">Enterprise Plan</p>
        </div>
        <button
          onClick={onToggleSidebar}
          className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
          title="Thu gọn sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <button onClick={onOpenCommandPalette} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50 text-gray-500 text-[12px] hover:bg-gray-100 transition-all border border-gray-200">
          <Search className="w-3.5 h-3.5" />
          <span>Search...</span>
          <span className="ml-auto text-[10px] text-gray-400 bg-white px-1.5 py-0.5 rounded-md border border-gray-200">&#8984;K</span>
        </button>
      </div>

      {/* ===== SPACES ===== */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        <div className="flex items-center px-2.5 py-1.5 mb-1">
          <span className="text-[10px] text-gray-600 uppercase tracking-[0.1em]">Spaces</span>
        </div>

        {grouped.map(cat => {
          const catUnread = cat.spaces.reduce((sum, s) => sum + (s.unread || 0), 0);

          // "Dự Án" category navigates to ProjectListView instead of expanding
          if (cat.key === "project") {
            return (
              <div key={cat.key} className="mb-0.5">
                <button
                  onClick={() => { onToggleProjectsSidebar?.(); }}
                  className={`w-full flex items-center gap-2 px-2.5 py-[7px] rounded-lg text-[12px] group transition-all ${
                    showProjectsSidebar ? "bg-violet-50 text-violet-800" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="w-[20px] h-[20px] rounded-md flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: cat.color }}>
                    {categoryIcons[cat.key]}
                  </div>
                  <span className="truncate flex-1 text-left">{cat.label}</span>
                  <span className="text-[10px] text-gray-400">{cat.spaces.length}</span>
                  {catUnread > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-100 text-cyan-700 text-[10px] flex items-center justify-center shrink-0">
                      {catUnread}
                    </span>
                  )}
                </button>
              </div>
            );
          }

          // "Cá nhân" category — toggle PersonalSidebar (level 2)
          if (cat.key === "personal") {
            return (
              <div key={cat.key} className="mb-0.5">
                <button
                  onClick={() => { onTogglePersonalSidebar?.(); }}
                  className={`w-full flex items-center gap-2 px-2.5 py-[7px] rounded-lg text-[12px] group transition-all ${
                    showPersonalSidebar ? "bg-cyan-50 text-cyan-800" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="w-[20px] h-[20px] rounded-md flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: cat.color }}>
                    {categoryIcons[cat.key]}
                  </div>
                  <span className="truncate flex-1 text-left">{cat.label}</span>
                  {personalUnread > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-100 text-cyan-700 text-[10px] flex items-center justify-center shrink-0">
                      {personalUnread}
                    </span>
                  )}
                </button>
              </div>
            );
          }

          // "Bot / AI Agent" category — navigate to single bot space
          if (cat.key === "bot") {
            const botSpace = cat.spaces[0];
            if (!botSpace) return null;
            const isActive = selectedSpace === botSpace.id;
            return (
              <div key={cat.key} className="mb-0.5">
                <button
                  onClick={() => handleSpaceClick(botSpace)}
                  className={`w-full flex items-center gap-2 px-2.5 py-[7px] rounded-lg text-[12px] group transition-all ${
                    isActive ? "bg-teal-50 text-teal-800" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="w-[20px] h-[20px] rounded-md flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: cat.color }}>
                    {categoryIcons[cat.key]}
                  </div>
                  <span className="truncate flex-1 text-left">{cat.label}</span>
                  {catUnread > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-teal-100 text-teal-700 text-[10px] flex items-center justify-center shrink-0">
                      {catUnread}
                    </span>
                  )}
                </button>
              </div>
            );
          }

          // "Kênh" category — toggle ChannelSidebar (level 2)
          if (cat.key === "channel") {
            return (
              <div key={cat.key} className="mb-0.5">
                <button
                  onClick={() => { onToggleChannelSidebar?.(); }}
                  className={`w-full flex items-center gap-2 px-2.5 py-[7px] rounded-lg text-[12px] group transition-all ${
                    showChannelSidebar ? "bg-indigo-50 text-indigo-800" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="w-[20px] h-[20px] rounded-md flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: cat.color }}>
                    {categoryIcons[cat.key]}
                  </div>
                  <span className="truncate flex-1 text-left">{cat.label}</span>
                  {channelUnread > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center shrink-0">
                      {channelUnread}
                    </span>
                  )}
                </button>
              </div>
            );
          }

          return (
            <div key={cat.key} className="mb-0.5">
              {/* Category header */}
              <button
                onClick={() => toggleCategory(cat.key)}
                className="w-full flex items-center gap-2 px-2.5 py-[7px] rounded-lg hover:bg-gray-50 text-gray-700 text-[12px] group transition-all"
              >
                <div className="w-[20px] h-[20px] rounded-md flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: cat.color }}>
                  {categoryIcons[cat.key]}
                </div>
                <span className="truncate flex-1 text-left">{cat.label}</span>
                {catUnread > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-100 text-cyan-700 text-[10px] flex items-center justify-center shrink-0">
                    {catUnread}
                  </span>
                )}
              </button>

              {/* Spaces in this category */}
              {expandedCategories[cat.key] && (
                <div className="ml-4 space-y-0.5 mt-0.5">
                  {cat.spaces.map(space => {
                    const isActive = selectedSpace === space.id;
                    const isChannel = space.category === "channel";
                    const isBot = space.category === "bot";
                    const isProject = space.category === "project";

                    // Enhanced project space item (Figma-style 2-line layout)
                    if (isProject) {
                      return (
                        <button
                          key={space.id}
                          onClick={() => handleSpaceClick(space)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[12px] transition-all group ${
                            isActive
                              ? "bg-cyan-50 text-cyan-800"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                          }`}
                        >
                          {/* Larger rounded-lg avatar */}
                          <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[10px] text-white shrink-0 shadow-sm" style={{ backgroundColor: space.color }}>
                            {space.icon}
                          </div>
                          {/* Title + description 2-line */}
                          <div className="flex-1 min-w-0 text-left">
                            <p className={`text-[12px] truncate ${isActive ? "text-cyan-800" : "text-gray-800"}`}>{space.name}</p>
                            {space.description && (
                              <p className="text-[10px] text-gray-400 truncate">{space.description}</p>
                            )}
                          </div>
                          {/* Right side: members + share + more */}
                          <div className="flex items-center gap-2 shrink-0">
                            {space.unread && space.unread > 0 && !isActive && (
                              <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-cyan-500 text-white text-[9px] flex items-center justify-center">
                                {space.unread}
                              </span>
                            )}
                            {space.members && (
                              <span className={`flex items-center gap-0.5 text-[10px] ${isActive ? "text-cyan-500" : "text-gray-400"}`}>
                                <Users className="w-3 h-3" />
                                {space.members}
                              </span>
                            )}
                            <Share2 className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-gray-600 ${isActive ? "text-cyan-400" : "text-gray-300"}`}
                              onClick={e => { e.stopPropagation(); }} />
                            <MoreHorizontal className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-gray-600 ${isActive ? "text-cyan-400" : "text-gray-300"}`}
                              onClick={e => { e.stopPropagation(); }} />
                          </div>
                        </button>
                      );
                    }

                    return (
                      <button
                        key={space.id}
                        onClick={() => handleSpaceClick(space)}
                        className={`w-full flex items-center gap-2 px-2.5 py-[6px] rounded-lg text-[12px] transition-all ${
                          isActive
                            ? "bg-cyan-50 text-cyan-800"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                        }`}
                      >
                        {isChannel ? (
                          <Hash className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-cyan-500" : "text-gray-400"}`} />
                        ) : isBot ? (
                          <div className="w-[16px] h-[16px] rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: space.color }}>
                            <Bot className="w-2.5 h-2.5 text-white" />
                          </div>
                        ) : (
                          <div className="w-[16px] h-[16px] rounded-md flex items-center justify-center text-[7px] text-white shrink-0" style={{ backgroundColor: space.color }}>
                            {space.icon}
                          </div>
                        )}
                        <span className="truncate flex-1 text-left">{space.name}</span>
                        {space.unread && space.unread > 0 && !isActive && (
                          <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-cyan-500 text-white text-[9px] flex items-center justify-center shrink-0">
                            {space.unread}
                          </span>
                        )}
                        {isActive && (
                          space.category === "project"
                            ? <FolderKanban className="w-3 h-3 text-cyan-500 shrink-0" />
                            : <MessageSquare className="w-3 h-3 text-cyan-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="h-px bg-gray-200 mx-2 my-2" />

        {/* Favorites */}
        <div className="mb-1">
          <button onClick={() => setShowFavorites(!showFavorites)} className="w-full flex items-center px-2.5 py-1.5 hover:bg-gray-50 rounded-lg transition-all">
            <Star className="w-3 h-3 text-amber-400 mr-2" />
            <span className="text-[10px] text-gray-600 uppercase tracking-[0.1em] flex-1 text-left">Favorites</span>
            <span className="text-[9px] text-gray-400">{favoriteIds.length}</span>
            {showFavorites ? <ChevronDown className="w-3 h-3 text-gray-400 ml-1" /> : <ChevronRight className="w-3 h-3 text-gray-400 ml-1" />}
          </button>
          {showFavorites && (
            <div className="space-y-0.5">
              {favoriteIds.map(id => {
                const space = spaces.find(s => s.id === id);
                if (!space) return null;
                const isActive = selectedSpace === space.id;
                const isChannel = space.category === "channel";
                const isBot = space.category === "bot";
                const isProject = space.category === "project";

                // Enhanced project space in favorites
                if (isProject) {
                  return (
                    <button
                      key={space.id}
                      onClick={() => handleSpaceClick(space)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[12px] transition-all group ${
                        isActive
                          ? "bg-cyan-50 text-cyan-800"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                      }`}
                    >
                      <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[10px] text-white shrink-0 shadow-sm" style={{ backgroundColor: space.color }}>
                        {space.icon}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className={`text-[12px] truncate ${isActive ? "text-cyan-800" : "text-gray-800"}`}>{space.name}</p>
                        {space.description && (
                          <p className="text-[10px] text-gray-400 truncate">{space.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {space.unread && space.unread > 0 && !isActive && (
                          <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-cyan-500 text-white text-[9px] flex items-center justify-center">
                            {space.unread}
                          </span>
                        )}
                        {space.members && (
                          <span className={`flex items-center gap-0.5 text-[10px] ${isActive ? "text-cyan-500" : "text-gray-400"}`}>
                            <Users className="w-3 h-3" />
                            {space.members}
                          </span>
                        )}
                        <Share2 className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-gray-600 ${isActive ? "text-cyan-400" : "text-gray-300"}`}
                          onClick={e => { e.stopPropagation(); }} />
                        <MoreHorizontal className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-gray-600 ${isActive ? "text-cyan-400" : "text-gray-300"}`}
                          onClick={e => { e.stopPropagation(); }} />
                      </div>
                    </button>
                  );
                }

                return (
                  <button
                    key={space.id}
                    onClick={() => handleSpaceClick(space)}
                    className={`w-full flex items-center gap-2 px-2.5 py-[6px] rounded-lg text-[12px] transition-all ${
                      isActive
                        ? "bg-cyan-50 text-cyan-800"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                    }`}
                  >
                    {isChannel ? (
                      <Hash className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-cyan-500" : "text-gray-400"}`} />
                    ) : isBot ? (
                      <div className="w-[16px] h-[16px] rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: space.color }}>
                        <Bot className="w-2.5 h-2.5 text-white" />
                      </div>
                    ) : (
                      <div className="w-[16px] h-[16px] rounded-md flex items-center justify-center text-[7px] text-white shrink-0" style={{ backgroundColor: space.color }}>
                        {space.icon}
                      </div>
                    )}
                    <span className="truncate flex-1 text-left">{space.name}</span>
                    {space.unread && space.unread > 0 && !isActive && (
                      <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-cyan-500 text-white text-[9px] flex items-center justify-center shrink-0">
                        {space.unread}
                      </span>
                    )}
                    {isActive && (
                      space.category === "project"
                        ? <FolderKanban className="w-3 h-3 text-cyan-500 shrink-0" />
                        : <MessageSquare className="w-3 h-3 text-cyan-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-px bg-gray-200 mx-2 my-2" />

        {/* ===== MORE ===== */}
        <div>
          <button onClick={() => setExpandedMore(!expandedMore)} className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] text-gray-600 uppercase tracking-wider hover:text-gray-700 transition-all">
            {expandedMore ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            More
          </button>
          {expandedMore && (
            <div className="space-y-0.5">
              <NavItem icon={<Home className="w-[16px] h-[16px]" />} label="Home" active={currentView === "dashboard" && !selectedSpace} onClick={() => { onViewChange("dashboard"); onSpaceSelect(null); }} small />
              <NavItem icon={<Inbox className="w-[16px] h-[16px]" />} label="Inbox" badge={3} active={currentView === "inbox"} onClick={() => { onViewChange("inbox"); onSpaceSelect(null); }} small />
              <NavItem icon={<FileText className="w-[16px] h-[16px]" />} label="Docs" active={currentView === "docs"} onClick={() => { onViewChange("docs"); onSpaceSelect(null); }} small />
              <NavItem icon={<Target className="w-[16px] h-[16px]" />} label="Goals" active={currentView === "goals"} onClick={() => { onViewChange("goals"); onSpaceSelect(null); }} small />
              <NavItem icon={<Zap className="w-[16px] h-[16px]" />} label="Sprints" active={currentView === "sprints"} onClick={() => { onViewChange("sprints"); onSpaceSelect(null); }} small />
              <NavItem icon={<BarChart3 className="w-[16px] h-[16px]" />} label="Dashboards" active={currentView === "dashboards"} onClick={() => { onViewChange("dashboards"); onSpaceSelect(null); }} small />
              <NavItem icon={<Clock className="w-[16px] h-[16px]" />} label="Time Tracking" active={currentView === "timetracking"} onClick={() => { onViewChange("timetracking"); onSpaceSelect(null); }} small />
              <NavItem icon={<Users className="w-[16px] h-[16px]" />} label="Workload" active={currentView === "workload"} onClick={() => { onViewChange("workload"); onSpaceSelect(null); }} small />
              <NavItem icon={<GitBranch className="w-[16px] h-[16px]" />} label="Automations" active={currentView === "automations"} onClick={() => { onViewChange("automations"); onSpaceSelect(null); }} small />
              <NavItem icon={<Activity className="w-[16px] h-[16px]" />} label="Activity" active={currentView === "activity"} onClick={() => { onViewChange("activity"); onSpaceSelect(null); }} small />
              <NavItem icon={<PenTool className="w-[16px] h-[16px]" />} label="Whiteboard" active={currentView === "whiteboard"} onClick={() => { onViewChange("whiteboard"); onSpaceSelect(null); }} small />
              <NavItem icon={<Lightbulb className="w-[16px] h-[16px]" />} label="Mind Map" active={currentView === "mindmap"} onClick={() => { onViewChange("mindmap"); onSpaceSelect(null); }} small />
              <NavItem icon={<TextCursorInput className="w-[16px] h-[16px]" />} label="Forms" active={currentView === "forms"} onClick={() => { onViewChange("forms"); onSpaceSelect(null); }} small />
              <NavItem icon={<StickyNote className="w-[16px] h-[16px]" />} label="Notepad" active={currentView === "notepad"} onClick={() => { onViewChange("notepad"); onSpaceSelect(null); }} small />
              <NavItem icon={<CalendarDays className="w-[16px] h-[16px]" />} label="Reminders" badge={2} active={currentView === "reminders"} onClick={() => { onViewChange("reminders"); onSpaceSelect(null); }} small />
              <NavItem icon={<Users className="w-[16px] h-[16px]" />} label="Team" active={currentView === "team"} onClick={() => { onViewChange("team"); onSpaceSelect(null); }} small />
              <NavItem icon={<Gamepad2 className="w-[16px] h-[16px]" />} label="Games" active={currentView === "games"} onClick={() => { onViewChange("games"); onSpaceSelect(null); }} small />
              <NavItem icon={<GraduationCap className="w-[16px] h-[16px]" />} label="Học trực tuyến" active={currentView === "elearning"} onClick={() => { onViewChange("elearning"); onSpaceSelect(null); }} small />
              <NavItem icon={<BarChart3 className="w-[16px] h-[16px]" />} label="Reports" active={currentView === "reports"} onClick={() => { onViewChange("reports"); onSpaceSelect(null); }} small />
            </div>
          )}
        </div>
      </div>

      {/* Bottom */}
      <div className="p-2 border-t border-gray-200 space-y-1">
        <NavItem icon={<Settings className="w-[16px] h-[16px]" />} label="Settings" active={currentView === "settings"} onClick={() => { onViewChange("settings"); onSpaceSelect(null); }} />
        {/* User profile with status */}
        <div className="relative">
          <button onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[12px] text-gray-600 hover:bg-gray-50 transition-all">
            <div className="relative">
              <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-[8px] text-white">M</div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${userStatus === "online" ? "bg-emerald-500" : userStatus === "away" ? "bg-amber-500" : userStatus === "busy" ? "bg-red-500" : "bg-gray-400"}`} />
            </div>
            <span className="truncate flex-1 text-left">Nguyễn Minh</span>
            <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${userStatus === "online" ? "bg-emerald-50 text-emerald-600" : userStatus === "away" ? "bg-amber-50 text-amber-600" : userStatus === "busy" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}>
              {userStatus === "online" ? "Online" : userStatus === "away" ? "Away" : userStatus === "busy" ? "Busy" : "Offline"}
            </span>
          </button>
          {showStatusMenu && (
            <div className="absolute bottom-full left-0 mb-1 w-full bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1" onClick={e => e.stopPropagation()}>
              <p className="px-3 py-1 text-[9px] text-gray-400 uppercase tracking-wider">Set status</p>
              {([
                { key: "online" as const, label: "Online", color: "#059669", desc: "Đang hoạt động" },
                { key: "away" as const, label: "Away", color: "#d97706", desc: "Đang rời đi" },
                { key: "busy" as const, label: "Busy", color: "#dc2626", desc: "Không làm phiền" },
                { key: "offline" as const, label: "Offline", color: "#9ca3af", desc: "Ẩn trạng thái" },
              ]).map(s => (
                <button key={s.key} onClick={() => { setUserStatus(s.key); setShowStatusMenu(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] hover:bg-gray-50 transition-all ${userStatus === s.key ? "bg-gray-50" : ""}`}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <div className="flex-1 text-left">
                    <p className="text-gray-700">{s.label}</p>
                    <p className="text-[9px] text-gray-400">{s.desc}</p>
                  </div>
                  {userStatus === s.key && <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, badge, small }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badge?: number; small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 ${small ? "py-[5px]" : "py-[7px]"} rounded-lg text-[12px] transition-all relative ${
        active ? "bg-cyan-50 text-cyan-800" : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
      }`}
    >
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full bg-cyan-500" />}
      <span className={active ? "text-cyan-600" : ""}>{icon}</span>
      <span className="truncate">{label}</span>
      {badge && badge > 0 && (
        <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-100 text-cyan-700 text-[10px] flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function CollapsedBtn({ icon, active, onClick, badge, tooltip, color }: { icon: React.ReactNode; active: boolean; onClick: () => void; badge?: boolean; tooltip?: string; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`group/btn w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${
        active
          ? color ? "text-white" : "bg-cyan-50 text-cyan-600"
          : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
      }`}
      style={active && color ? { backgroundColor: `${color}15`, color } : undefined}
      title={tooltip}
    >
      {icon}
      {badge && <div className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-cyan-500" />}
      {/* Tooltip */}
      {tooltip && (
        <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-[11px] rounded-lg whitespace-nowrap opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all z-50 pointer-events-none shadow-lg">
          {tooltip}
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      )}
    </button>
  );
}