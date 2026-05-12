import { useState, useRef, useEffect } from "react";
import {
  X, Search, Hash, Pin, PinOff, ChevronDown, ChevronRight, ChevronLeft,
  MoreHorizontal, BellOff, Bell, LogOut, Plus, Users, Lock, Globe,
  Star, ArrowUpDown, ArrowDownAZ, ArrowUpAZ, MessageSquare, Clock,
  Activity, CheckCheck, Link2, Settings2, Compass, Crown, Eye,
  User, FolderKanban
} from "lucide-react";
import { channelItems as defaultChannelItems, browseChannels, teamMembers, type ChannelItem } from "./data";
import { toast } from "sonner";

const CURRENT_USER_ID = "u1"; // Nguyễn Minh

type ChannelRole = "owner" | "member" | "viewer";

function getChannelRole(ch: ChannelItem): ChannelRole {
  if (ch.ownerId === CURRENT_USER_ID) return "owner";
  if ((ch.allowedPosterIds ?? []).includes(CURRENT_USER_ID)) return "member";
  return "viewer";
}

/* ═══════════ Emoji picker data ═══════════ */
const emojiOptions = [
  "💬", "📢", "💰", "📋", "🎯", "💻", "👥", "🎲", "🏃", "🚀",
  "🔒", "📊", "🎓", "🛠️", "📝", "🌍", "🎨", "⚡", "🔥", "❤️",
  "📦", "🧪", "🤖", "📸", "🎵", "☕", "🍕", "🎮", "✈️", "🏠",
];

const colorOptions = [
  "#059669", "#0891b2", "#7c3aed", "#db2777", "#d97706",
  "#dc2626", "#4f46e5", "#0f766e", "#ea580c", "#16a34a",
  "#6366f1", "#b91c1c",
];

/* ═══════════ Props ═══════════ */
interface ChannelSidebarProps {
  selectedChannel: string | null;
  onChannelSelect: (id: string) => void;
  onClose: () => void;
  channels: ChannelItem[];
  onChannelsChange: (channels: ChannelItem[]) => void;
  activeSection?: "personal" | "channel" | "project";
  onSectionChange?: (section: "personal" | "channel" | "project") => void;
}

/* ═══════════ Main Component ═══════════ */
export function ChannelSidebar({ selectedChannel, onChannelSelect, onClose, channels, onChannelsChange, activeSection = "channel", onSectionChange }: ChannelSidebarProps) {
  const [search, setSearch] = useState("");
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "members" | "unread" | "activity">("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [settingChannel, setSettingChannel] = useState<ChannelItem | null>(null);
  const [showBrowse, setShowBrowse] = useState(false);

  const filtered = channels.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())
  );

  const sortChannels = (list: ChannelItem[]) => {
    // Pinned channels always float to top within their group
    const pinned = list.filter(c => c.pinned);
    const unpinned = list.filter(c => !c.pinned);
    const sortFn = (a: ChannelItem, b: ChannelItem) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name);
        case "members": return (a.members || 0) - (b.members || 0);
        case "unread": return (a.unread || 0) - (b.unread || 0);
        case "activity": return (b.lastActivityTimestamp || 0) - (a.lastActivityTimestamp || 0);
        default: return 0;
      }
    };
    const sortedPinned = [...pinned].sort(sortFn);
    const sortedUnpinned = [...unpinned].sort(sortFn);
    const result = [...sortedPinned, ...sortedUnpinned];
    return sortAsc ? result : result.reverse();
  };

  const filteredChannels = showUnreadOnly ? filtered.filter(c => (c.unread || 0) > 0) : filtered;

  const handleTogglePin = (id: string) => {
    const ch = channels.find(c => c.id === id);
    onChannelsChange(channels.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c));
    toast.success(ch?.pinned ? "Đã bỏ ghim kênh" : "Đã ghim kênh", { description: ch?.name });
    setContextMenu(null);
  };

  const handleToggleMute = (id: string) => {
    const ch = channels.find(c => c.id === id);
    onChannelsChange(channels.map(c => c.id === id ? { ...c, muted: !c.muted } : c));
    toast.success(ch?.muted ? "Đã bật thông báo" : "Đã tắt thông báo", { description: ch?.name });
    setContextMenu(null);
  };

  const handleMarkRead = (id: string) => {
    onChannelsChange(channels.map(c => c.id === id ? { ...c, unread: 0 } : c));
    setContextMenu(null);
  };

  const handleCopyLink = (ch: ChannelItem) => {
    toast.success("Đã sao chép link");
    setContextMenu(null);
  };

  const handleLeaveChannel = (id: string) => {
    const ch = channels.find(c => c.id === id);
    const remaining = channels.filter(c => c.id !== id);
    onChannelsChange(remaining);
    toast.success("Đã rời khỏi kênh", { description: ch?.name });
    if (selectedChannel === id && remaining.length > 0) {
      onChannelSelect(remaining[0].id);
    }
    setContextMenu(null);
  };

  const handleCreateChannel = (newChannel: ChannelItem) => {
    onChannelsChange([...channels, newChannel]);
    onChannelSelect(newChannel.id);
    toast.success("Đã tạo kênh mới", { description: newChannel.name });
    setShowCreateModal(false);
  };

  const handleSaveSettings = (id: string, updates: Partial<ChannelItem>) => {
    onChannelsChange(channels.map(c => c.id === id ? { ...c, ...updates } : c));
    setSettingChannel(null);
    toast.success("Đã lưu cài đặt kênh");
  };

  const handleJoinChannel = (channel: ChannelItem) => {
    onChannelsChange([...channels, channel]);
    toast.success(`Đã tham gia #${channel.name}`);
  };

  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [contextMenu]);

  const renderChannel = (ch: ChannelItem) => {
    const isActive = selectedChannel === ch.id;
    const isPinned = ch.pinned;
    const isMuted = ch.muted;
    const hasUnread = ch.unread && ch.unread > 0 && !isMuted;
    const role = getChannelRole(ch);

    return (
      <div
        key={ch.id}
        onClick={() => onChannelSelect(ch.id)}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setContextMenu({ id: ch.id, x: e.clientX, y: e.clientY });
        }}
        className={`group/ch w-full px-3 py-2.5 rounded-lg cursor-pointer transition-all mb-0.5 ${
          isActive
            ? role === "viewer"
              ? "bg-gray-50 border border-gray-200/60"
              : "bg-indigo-50 border border-indigo-200/60"
            : "hover:bg-gray-50 border border-transparent"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-[14px] shadow-sm ${role === "viewer" ? "opacity-70" : ""}`}
              style={{ backgroundColor: ch.color }}
            >
              <span>{ch.icon}</span>
            </div>
            {role === "owner" && (
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border border-white flex items-center justify-center">
                <Crown className="w-2 h-2 text-white" />
              </div>
            )}
            {role === "viewer" && (
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gray-300 border border-white flex items-center justify-center">
                <Eye className="w-2 h-2 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 min-w-0">
                <span className={`text-[12px] truncate ${isActive ? (role === "viewer" ? "text-gray-700" : "text-indigo-800") : hasUnread ? "text-gray-900" : "text-gray-800"}`} style={hasUnread ? { fontWeight: 600 } : {}}>
                  {ch.name}
                </span>
                {ch.visibility === "private" && (
                  <Lock className="w-3 h-3 text-gray-400 shrink-0" />
                )}
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleTogglePin(ch.id); }}
                className={`shrink-0 transition-all ${
                  isPinned ? "text-amber-400" : "text-gray-300 opacity-0 group-hover/ch:opacity-100"
                }`}
              >
                <Star className={`w-3 h-3 ${isPinned ? "fill-current" : ""}`} />
              </button>
            </div>
            <p className={`text-[10px] truncate mt-0.5 ${isActive ? (role === "viewer" ? "text-gray-500" : "text-indigo-500") : "text-gray-500"}`}>
              {ch.description}
            </p>
          </div>
          {hasUnread && !isActive && (
            <span className={`min-w-[16px] h-[16px] px-1 rounded-full text-white text-[9px] flex items-center justify-center shrink-0 ${role === "viewer" ? "bg-gray-400" : "bg-indigo-500"}`}>
              {ch.unread}
            </span>
          )}
          {isMuted && ch.unread && ch.unread > 0 && !isActive && (
            <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-gray-200 text-gray-500 text-[9px] flex items-center justify-center shrink-0">
              {ch.unread}
            </span>
          )}
        </div>
        {/* Stats row - like ProjectsSidebar */}
        <div className="mt-1.5 flex items-center gap-3">
          <span className={`flex items-center gap-0.5 text-[9px] ${isActive ? "text-indigo-500" : "text-gray-500"}`}>
            <Users className="w-2.5 h-2.5" />
            {ch.members}
          </span>
          {ch.unread && ch.unread > 0 ? (
            <span className={`flex items-center gap-0.5 text-[9px] ${isActive ? "text-indigo-500" : isMuted ? "text-gray-400" : "text-indigo-500"}`}>
              <MessageSquare className="w-2.5 h-2.5" />
              {ch.unread} mới
            </span>
          ) : (
            <span className={`flex items-center gap-0.5 text-[9px] ${isActive ? "text-indigo-500" : "text-gray-500"}`}>
              <MessageSquare className="w-2.5 h-2.5" />
              0
            </span>
          )}
          {isMuted && (
            <span className={`flex items-center gap-0.5 text-[9px] ${isActive ? "text-indigo-400" : "text-gray-300"}`}>
              <BellOff className="w-2.5 h-2.5" />
            </span>
          )}
          {ch.lastTime && (
            <span className={`flex items-center gap-0.5 text-[9px] ml-auto ${isActive ? "text-indigo-500" : "text-gray-500"}`}>
              <Clock className="w-2.5 h-2.5" />
              {ch.lastTime}
            </span>
          )}
        </div>
        {/* Activity bar */}
        <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, ((ch.members || 1) / 30) * 100)}%`,
              backgroundColor: ch.color,
              opacity: 0.7,
            }}
          />
        </div>
      </div>
    );
  };

  // Split channels into role groups, each sorted independently (pinned float to top within group)
  const ownedChannels  = sortChannels(filteredChannels.filter(c => getChannelRole(c) === "owner"));
  const memberChannels = sortChannels(filteredChannels.filter(c => getChannelRole(c) === "member"));
  const viewerChannels = sortChannels(filteredChannels.filter(c => getChannelRole(c) === "viewer"));
  const displayEmpty   = ownedChannels.length === 0 && memberChannels.length === 0 && viewerChannels.length === 0;

  return (
    <div className="w-full md:w-[240px] h-full bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2.5">
          {/* Mobile: app name */}
          <p className="md:hidden flex-1 text-[20px] text-gray-900" style={{ fontWeight: 700 }}>VWork Chat</p>
          {/* Desktop: original label with back button */}
          <button
            onClick={onClose}
            className="hidden md:flex w-6 h-6 rounded-md hover:bg-gray-100 items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="hidden md:flex items-center gap-1.5 flex-1">
            <Hash className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[12px] text-gray-700 tracking-tight">Kênh</span>
          </div>
          <span className="hidden md:inline text-[10px] text-gray-500">{channels.length}</span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-6 h-6 rounded-md hover:bg-indigo-50 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-all"
            title="Tạo kênh mới"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Search + Sort */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex-1 flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-100">
            <Search className="w-3 h-3 text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kênh..."
              className="flex-1 text-[11px] bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          {/* Sort button */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                sortBy !== "name" || !sortAsc
                  ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                  : "hover:bg-gray-100 text-gray-400 hover:text-gray-600 border border-transparent"
              }`}
              title="Sắp xếp"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-8 w-[180px] bg-white border border-gray-200 rounded-xl shadow-lg shadow-black/8 z-50 py-1 overflow-hidden">
                  <div className="px-3 py-1.5">
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider">Sắp xếp theo</span>
                  </div>
                  {([
                    { key: "name", asc: true, icon: <ArrowDownAZ className="w-3.5 h-3.5" />, label: "Tên A → Z" },
                    { key: "name", asc: false, icon: <ArrowUpAZ className="w-3.5 h-3.5" />, label: "Tên Z → A" },
                    { key: "members", asc: false, icon: <Users className="w-3.5 h-3.5" />, label: "Nhiều thành viên" },
                    { key: "members", asc: true, icon: <Users className="w-3.5 h-3.5" />, label: "Ít thành viên" },
                    { key: "unread", asc: false, icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Tin chưa đọc nhiều" },
                    { key: "unread", asc: true, icon: <Activity className="w-3.5 h-3.5" />, label: "Tin chưa đọc ít" },
                    { key: "activity", asc: false, icon: <Clock className="w-3.5 h-3.5" />, label: "Hoạt động gần nhất" },
                  ] as const).map((opt, i) => {
                    const isActive = sortBy === opt.key && sortAsc === opt.asc;
                    return (
                      <button
                        key={i}
                        onClick={() => { setSortBy(opt.key as any); setSortAsc(opt.asc); setShowSortMenu(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-[6px] text-[11px] transition-all ${
                          isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span className={isActive ? "text-indigo-500" : "text-gray-400"}>{opt.icon}</span>
                        <span className="flex-1 text-left">{opt.label}</span>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
        {/* Section switcher — mobile only, above filter tabs */}
        {onSectionChange && (
          <div className="md:hidden flex gap-2 mb-2">
            {([
              { key: "personal", label: "Cá nhân", icon: <User className="w-3.5 h-3.5" /> },
              { key: "channel",  label: "Kênh",    icon: <Hash className="w-3.5 h-3.5" /> },
              { key: "project",  label: "Dự án",   icon: <FolderKanban className="w-3.5 h-3.5" /> },
            ] as const).map(s => (
              <button
                key={s.key}
                onClick={() => onSectionChange(s.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                  activeSection === s.key
                    ? "bg-cyan-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {s.icon}{s.label}
              </button>
            ))}
          </div>
        )}
        {/* Unread filter toggle — full width */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setShowUnreadOnly(false)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
              !showUnreadOnly ? "bg-white text-gray-700 shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Hash className="w-3 h-3" />
            Tất cả
          </button>
          <button
            onClick={() => setShowUnreadOnly(true)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
              showUnreadOnly ? "bg-white text-cyan-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Bell className="w-3 h-3" />
            Chưa đọc
          </button>
        </div>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto py-1.5 px-1.5 pb-16 md:pb-1.5 relative">
        {/* Owned channels */}
        {ownedChannels.length > 0 && (
          <>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5">
              <Crown className="w-2.5 h-2.5 text-amber-400" />
              <span className="text-[9px] text-gray-500 uppercase tracking-wider">Kênh của tôi</span>
              <span className="text-[9px] text-gray-400 ml-auto">{ownedChannels.length}</span>
            </div>
            {ownedChannels.map(renderChannel)}
          </>
        )}

        {/* Member channels (can post, not owner) */}
        {memberChannels.length > 0 && (
          <>
            {ownedChannels.length > 0 && <div className="h-px bg-gray-100 mx-2 my-2" />}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5">
              <Hash className="w-2.5 h-2.5 text-indigo-400" />
              <span className="text-[9px] text-gray-500 uppercase tracking-wider">Đã tham gia</span>
              <span className="text-[9px] text-gray-400 ml-auto">{memberChannels.length}</span>
            </div>
            {memberChannels.map(renderChannel)}
          </>
        )}

        {/* Viewer-only channels */}
        {viewerChannels.length > 0 && (
          <>
            {(ownedChannels.length > 0 || memberChannels.length > 0) && <div className="h-px bg-gray-100 mx-2 my-2" />}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5">
              <Eye className="w-2.5 h-2.5 text-gray-400" />
              <span className="text-[9px] text-gray-500 uppercase tracking-wider">Đang theo dõi</span>
              <span className="text-[9px] text-gray-400 ml-auto">{viewerChannels.length}</span>
            </div>
            {viewerChannels.map(renderChannel)}
          </>
        )}

        {displayEmpty && (
          <div className="text-center py-8">
            <Hash className="w-6 h-6 text-gray-200 mx-auto mb-2" />
            <p className="text-[11px] text-gray-500">
              {showUnreadOnly ? "Không có kênh chưa đọc" : "Không tìm thấy"}
            </p>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && (() => {
          const ch = channels.find(c => c.id === contextMenu.id);
          if (!ch) return null;
          const role = getChannelRole(ch);
          return (
            <ContextMenuOverlay
              channel={ch}
              role={role}
              x={contextMenu.x}
              y={contextMenu.y}
              onPin={() => handleTogglePin(ch.id)}
              onMute={() => handleToggleMute(ch.id)}
              onMarkRead={() => handleMarkRead(ch.id)}
              onCopyLink={() => handleCopyLink(ch)}
              onSettings={() => { setSettingChannel(ch); setContextMenu(null); }}
              onLeave={() => handleLeaveChannel(ch.id)}
              onClose={() => setContextMenu(null)}
            />
          );
        })()}
      </div>

      {/* Footer */}
      <div className="px-2 py-2 border-t border-gray-100">
        <button
          onClick={() => setShowBrowse(true)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] text-gray-500 hover:bg-gray-50 rounded-lg transition-all border border-dashed border-gray-200 mt-1"
        >
          <Compass className="w-3.5 h-3.5" />
          Khám phá kênh
        </button>
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <CreateChannelModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateChannel}
          existingNames={channels.map(c => c.name.toLowerCase())}
        />
      )}

      {/* Channel Settings Modal */}
      {settingChannel && (
        <ChannelSettingsModal
          channel={settingChannel}
          onClose={() => setSettingChannel(null)}
          onSave={(updates) => handleSaveSettings(settingChannel.id, updates)}
        />
      )}

      {/* Browse Channels Modal */}
      {showBrowse && (
        <BrowseChannelsModal
          existingIds={channels.map(c => c.id)}
          onJoin={handleJoinChannel}
          onClose={() => setShowBrowse(false)}
        />
      )}
    </div>
  );
}

/* ═══════════ Context Menu ═══════════ */
function ContextMenuOverlay({ channel, role, x, y, onPin, onMute, onMarkRead, onCopyLink, onSettings, onLeave, onClose }: {
  channel: ChannelItem;
  role: ChannelRole;
  x: number;
  y: number;
  onPin: () => void;
  onMute: () => void;
  onMarkRead: () => void;
  onCopyLink: () => void;
  onSettings: () => void;
  onLeave: () => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let nx = x, ny = y;
      if (x + rect.width > vw - 8) nx = vw - rect.width - 8;
      if (y + rect.height > vh - 8) ny = y - rect.height;
      if (nx < 8) nx = 8;
      if (ny < 8) ny = 8;
      setPos({ x: nx, y: ny });
    }
  }, [x, y]);

  const isMuted = channel.muted;

  const menuItems = [
    {
      icon: <CheckCheck className="w-3.5 h-3.5" />,
      label: "Đánh dấu đã đọc",
      onClick: onMarkRead,
      color: "",
    },
    {
      icon: channel.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />,
      label: channel.pinned ? "Bỏ ghim" : "Ghim kênh",
      onClick: onPin,
      color: "",
    },
    {
      icon: isMuted ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />,
      label: isMuted ? "Bật thông báo" : "Tắt thông báo",
      onClick: onMute,
      color: "",
    },
    {
      icon: <Link2 className="w-3.5 h-3.5" />,
      label: "Sao chép link kênh",
      onClick: onCopyLink,
      color: "",
    },
    ...(role === "owner" ? [{
      icon: <Settings2 className="w-3.5 h-3.5" />,
      label: "Cài đặt kênh",
      onClick: onSettings,
      color: "",
    }] : []),
    { type: "divider" as const },
    {
      icon: <LogOut className="w-3.5 h-3.5" />,
      label: role === "viewer" ? "Hủy theo dõi" : role === "owner" ? "Xóa kênh" : "Rời kênh",
      onClick: onLeave,
      color: "text-red-500 hover:!bg-red-50",
    },
  ];

  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div
        ref={menuRef}
        className="fixed bg-white rounded-xl shadow-xl border border-gray-200 py-1 w-[200px] animate-in fade-in zoom-in-95 duration-150"
        style={{ left: pos.x, top: pos.y }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
          <span className="text-[14px]">{channel.icon}</span>
          <span className="text-[11px] text-gray-700 truncate flex-1" style={{ fontWeight: 600 }}>{channel.name}</span>
          {role === "owner" && (
            <span className="flex items-center gap-0.5 text-[9px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full shrink-0">
              <Crown className="w-2.5 h-2.5" />Chủ kênh
            </span>
          )}
          {role === "viewer" && (
            <span className="flex items-center gap-0.5 text-[9px] text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-full shrink-0">
              <Eye className="w-2.5 h-2.5" />Theo dõi
            </span>
          )}
        </div>
        {menuItems.map((item, i) => {
          if ('type' in item && item.type === "divider") {
            return <div key={i} className="h-px bg-gray-100 my-1" />;
          }
          const mi = item as { icon: React.ReactNode; label: string; onClick: () => void; color: string };
          return (
            <button
              key={i}
              onClick={mi.onClick}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] hover:bg-gray-50 transition-all ${mi.color || "text-gray-700"}`}
            >
              <span className={mi.color ? "" : "text-gray-400"}>{mi.icon}</span>
              <span>{mi.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════ Channel Settings Modal ═══════════ */
function ChannelSettingsModal({ channel, onClose, onSave }: {
  channel: ChannelItem;
  onClose: () => void;
  onSave: (updated: Partial<ChannelItem>) => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "notifications">("overview");
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description || "");
  const [icon, setIcon] = useState(channel.icon);
  const [color, setColor] = useState(channel.color);
  const [visibility, setVisibility] = useState<"public" | "private">(channel.visibility || "public");
  const [muted, setMuted] = useState(channel.muted || false);
  const [notifMode, setNotifMode] = useState<"all" | "mention" | "none">("all");
  const [memberSearch, setMemberSearch] = useState("");

  const filteredMembers = teamMembers.filter(m =>
    !memberSearch || m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.role.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const settingIcons = ["💬", "📢", "🎯", "💡", "🔧", "📊", "🎨", "🔐", "☁️", "💼"];
  const settingColors = ["#059669", "#0891b2", "#7c3aed", "#db2777", "#d97706", "#dc2626", "#4f46e5", "#0f766e"];

  const handleSave = () => {
    onSave({ name, description, visibility, muted, icon, color });
    toast.success("Đã lưu cài đặt kênh");
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div
        className="w-full md:w-[480px] bg-white rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px] shrink-0"
            style={{ backgroundColor: color }}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] text-gray-900 truncate" style={{ fontWeight: 600 }}>{channel.name}</h3>
            <p className="text-[10px] text-gray-500">Cài đặt kênh</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5">
          {(["overview", "members", "notifications"] as const).map(tab => {
            const labels = { overview: "Tổng quan", members: "Thành viên", notifications: "Thông báo" };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2.5 text-[12px] border-b-2 transition-all -mb-px ${
                  activeTab === tab
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                style={activeTab === tab ? { fontWeight: 600 } : {}}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-4">
          {/* Tab: Overview */}
          {activeTab === "overview" && (
            <>
              {/* Channel name */}
              <div>
                <label className="text-[11px] text-gray-700 font-medium mb-1 block">Tên kênh</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-300 text-[13px] text-gray-800 outline-none transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] text-gray-700 font-medium mb-1 block">Mô tả</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-300 text-[13px] text-gray-800 outline-none transition-all resize-none"
                />
              </div>

              {/* Icon */}
              <div>
                <label className="text-[11px] text-gray-700 font-medium mb-2 block">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {settingIcons.map(e => (
                    <button
                      key={e}
                      onClick={() => setIcon(e)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-[18px] transition-all border ${
                        icon === e ? "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-200" : "border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="text-[11px] text-gray-700 font-medium mb-2 block">Màu sắc</label>
                <div className="flex flex-wrap gap-2">
                  {settingColors.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-lg transition-all ${
                        color === c ? "ring-2 ring-offset-2 ring-indigo-400 scale-110" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Visibility */}
              <div>
                <label className="text-[11px] text-gray-700 font-medium mb-2 block">Quyền truy cập</label>
                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      visibility === "public" ? "border-indigo-200 bg-indigo-50" : "border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={visibility === "public"}
                      onChange={() => setVisibility("public")}
                      className="hidden"
                    />
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${visibility === "public" ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-500"}`}>
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] text-gray-800" style={{ fontWeight: 500 }}>Công khai</p>
                      <p className="text-[10px] text-gray-500">Mọi người trong tổ chức có thể tham gia</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${visibility === "public" ? "border-indigo-500" : "border-gray-300"}`}>
                      {visibility === "public" && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      visibility === "private" ? "border-amber-200 bg-amber-50" : "border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={visibility === "private"}
                      onChange={() => setVisibility("private")}
                      className="hidden"
                    />
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${visibility === "private" ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-500"}`}>
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] text-gray-800" style={{ fontWeight: 500 }}>Riêng tư</p>
                      <p className="text-[10px] text-gray-500">Chỉ người được mời mới có thể tham gia</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${visibility === "private" ? "border-amber-500" : "border-gray-300"}`}>
                      {visibility === "private" && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Tab: Members */}
          {activeTab === "members" && (
            <>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <input
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  placeholder="Tìm thành viên..."
                  className="flex-1 text-[12px] bg-transparent outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
              <div className="space-y-1">
                {filteredMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-all">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] text-white shrink-0"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-gray-800" style={{ fontWeight: 500 }}>{member.name}</p>
                      <p className="text-[10px] text-gray-500">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => toast.info("Tính năng đang phát triển")}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-200 text-[12px] text-gray-500 hover:bg-gray-50 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm thành viên
              </button>
            </>
          )}

          {/* Tab: Notifications */}
          {activeTab === "notifications" && (
            <div className="space-y-4">
              {/* Mute toggle */}
              <div
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-all"
                onClick={() => setMuted(!muted)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${muted ? "bg-gray-200 text-gray-500" : "bg-indigo-100 text-indigo-600"}`}>
                    {muted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-800" style={{ fontWeight: 500 }}>Tắt thông báo</p>
                    <p className="text-[10px] text-gray-500">Không nhận thông báo từ kênh này</p>
                  </div>
                </div>
                <div className={`w-10 h-[22px] rounded-full relative transition-all ${muted ? "bg-gray-400" : "bg-indigo-400"}`}>
                  <div className={`w-[18px] h-[18px] bg-white rounded-full absolute top-[2px] transition-all shadow-sm ${muted ? "left-[20px]" : "left-[2px]"}`} />
                </div>
              </div>

              {/* Notification mode */}
              <div>
                <p className="text-[11px] text-gray-700 font-medium mb-2">Chế độ thông báo</p>
                <div className="space-y-1.5">
                  {([
                    { value: "all", label: "Tất cả tin nhắn", desc: "Nhận thông báo mọi tin nhắn" },
                    { value: "mention", label: "Chỉ khi được mention", desc: "Nhận khi có @mention hoặc từ khoá" },
                    { value: "none", label: "Không có gì", desc: "Tắt hoàn toàn thông báo" },
                  ] as const).map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        notifMode === opt.value ? "border-indigo-200 bg-indigo-50" : "border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="notifMode"
                        value={opt.value}
                        checked={notifMode === opt.value}
                        onChange={() => setNotifMode(opt.value)}
                        className="hidden"
                      />
                      <div className="flex-1">
                        <p className="text-[12px] text-gray-800">{opt.label}</p>
                        <p className="text-[10px] text-gray-500">{opt.desc}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${notifMode === opt.value ? "border-indigo-500" : "border-gray-300"}`}>
                        {notifMode === opt.value && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[12px] text-gray-600 hover:bg-gray-100 transition-all"
          >
            Huỷ
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg text-[12px] text-white bg-cyan-500 hover:bg-cyan-600 shadow-sm shadow-cyan-500/20 transition-all"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Browse Channels Modal ═══════════ */
function BrowseChannelsModal({ existingIds, onJoin, onClose }: {
  existingIds: string[];
  onJoin: (channel: ChannelItem) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const available = browseChannels.filter(ch =>
    !existingIds.includes(ch.id) &&
    (!search || ch.name.toLowerCase().includes(search.toLowerCase()) || ch.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div
        className="w-full md:w-[480px] max-h-[85vh] bg-white rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Compass className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-[14px] text-gray-900" style={{ fontWeight: 600 }}>Khám phá kênh</h3>
              <p className="text-[10px] text-gray-500">Tìm và tham gia kênh mới</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kênh..."
              className="flex-1 text-[12px] bg-transparent outline-none text-gray-700 placeholder-gray-400"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Channel list */}
        <div className="flex-1 overflow-y-auto py-2 px-3">
          {available.length === 0 ? (
            <div className="text-center py-10">
              <Compass className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-[12px] text-gray-500">
                {search ? "Không tìm thấy kênh phù hợp" : "Bạn đã tham gia tất cả kênh có sẵn"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {available.map(ch => (
                <div
                  key={ch.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] shrink-0"
                    style={{ backgroundColor: ch.color }}
                  >
                    {ch.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] text-gray-800" style={{ fontWeight: 500 }}>{ch.name}</span>
                      {ch.visibility === "private" && (
                        <Lock className="w-3 h-3 text-gray-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{ch.description}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                      <Users className="w-3 h-3" />
                      <span>{ch.members} thành viên</span>
                    </div>
                  </div>
                  {ch.visibility === "private" ? (
                    <button
                      onClick={() => toast.info("Đã gửi yêu cầu")}
                      className="px-3 py-1.5 rounded-lg text-[11px] bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 transition-all shrink-0"
                    >
                      Yêu cầu tham gia
                    </button>
                  ) : (
                    <button
                      onClick={() => { onJoin(ch); toast.success(`Đã tham gia #${ch.name}`); }}
                      className="px-3 py-1.5 rounded-lg text-[11px] bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 transition-all shrink-0"
                    >
                      Tham gia
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Create Channel Modal ═══════════ */
function CreateChannelModal({ onClose, onCreate, existingNames }: {
  onClose: () => void;
  onCreate: (channel: ChannelItem) => void;
  existingNames: string[];
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("💬");
  const [selectedColor, setSelectedColor] = useState("#6366f1");
  const [isPrivate, setIsPrivate] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const nameError = name.trim() && existingNames.includes(name.trim().toLowerCase())
    ? "Tên kênh đã tồn tại"
    : "";

  const canCreate = name.trim().length > 0 && !nameError;

  const handleCreate = () => {
    if (!canCreate) return;
    const id = `ch-new-${Date.now()}`;
    onCreate({
      id,
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
      description: description.trim() || `Kênh ${name.trim()}`,
      members: 1,
      pinned: false,
      visibility: isPrivate ? "private" : "public",
      muted: false,
      lastActivityTimestamp: Date.now(),
      ownerId: CURRENT_USER_ID,
      allowedPosterIds: [],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-[15px] text-gray-900" style={{ fontWeight: 600 }}>Tạo kênh mới</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Tạo kênh để trao đổi theo chủ đề</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Icon + Name */}
          <div className="flex items-start gap-3">
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-[48px] h-[48px] rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 flex items-center justify-center text-[22px] transition-all hover:bg-indigo-50 shrink-0"
                style={{ backgroundColor: `${selectedColor}15` }}
              >
                {selectedIcon}
              </button>
              {showEmojiPicker && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-50 w-[220px]">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">Chọn biểu tượng</p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {emojiOptions.map(e => (
                      <button
                        key={e}
                        onClick={() => { setSelectedIcon(e); setShowEmojiPicker(false); }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-[16px] hover:bg-gray-100 transition-all ${
                          selectedIcon === e ? "bg-indigo-50 ring-2 ring-indigo-300" : ""
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-gray-700 font-medium mb-1 block">Tên kênh <span className="text-red-400">*</span></label>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="vd: Dự án Alpha, Happy Hour..."
                className={`w-full px-3 py-2 rounded-lg border text-[13px] text-gray-800 placeholder-gray-400 outline-none transition-all ${
                  nameError ? "border-red-300 focus:border-red-400 bg-red-50/50" : "border-gray-200 focus:border-indigo-300 bg-white"
                }`}
                onKeyDown={e => e.key === "Enter" && canCreate && handleCreate()}
              />
              {nameError && <p className="text-[10px] text-red-500 mt-1">{nameError}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] text-gray-700 font-medium mb-1 block">Mô tả</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Kênh này dùng để..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-300 text-[13px] text-gray-800 placeholder-gray-400 outline-none transition-all resize-none bg-white"
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-[11px] text-gray-700 font-medium mb-2 block">Màu sắc</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-lg transition-all ${
                    selectedColor === color ? "ring-2 ring-offset-2 ring-indigo-400 scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Privacy toggle */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-all"
            onClick={() => setIsPrivate(!isPrivate)}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPrivate ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"}`}>
              {isPrivate ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
            </div>
            <div className="flex-1">
              <p className="text-[12px] text-gray-800" style={{ fontWeight: 500 }}>
                {isPrivate ? "Kênh riêng tư" : "Kênh công khai"}
              </p>
              <p className="text-[10px] text-gray-500">
                {isPrivate ? "Chỉ người được mời mới tham gia" : "Mọi người trong công ty đều có thể tham gia"}
              </p>
            </div>
            <div className={`w-10 h-[22px] rounded-full relative transition-all ${isPrivate ? "bg-amber-400" : "bg-gray-300"}`}>
              <div className={`w-[18px] h-[18px] bg-white rounded-full absolute top-[2px] transition-all shadow-sm ${isPrivate ? "left-[20px]" : "left-[2px]"}`} />
            </div>
          </div>

          {/* Preview */}
          {name.trim() && (
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">Xem trước</p>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[18px]" style={{ backgroundColor: `${selectedColor}20` }}>
                  {selectedIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] text-gray-900 truncate" style={{ fontWeight: 600 }}>{name.trim()}</p>
                    {isPrivate && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-gray-500 truncate">{description.trim() || `Kênh ${name.trim()}`}</p>
                </div>
                <div className="flex items-center gap-0.5 text-[10px] text-gray-500">
                  <Users className="w-3 h-3" />
                  <span>1</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[12px] text-gray-600 hover:bg-gray-100 transition-all"
          >
            Huỷ
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className={`px-5 py-2 rounded-lg text-[12px] text-white transition-all ${
              canCreate
                ? "bg-indigo-500 hover:bg-indigo-600 shadow-sm shadow-indigo-500/20"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Tạo kênh
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
