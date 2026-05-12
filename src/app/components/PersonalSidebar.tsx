import { useState, useRef } from "react";
import {
  X, Search, Plus, MessageSquare, Pin, MoreHorizontal,
  StickyNote, Bookmark, BookOpen, User, Users,
  ChevronDown, ChevronRight, Archive, Bell, BellOff, Trash2, PenLine, Check, Settings2, UserPlus, UserMinus,
  Phone, QrCode, ScanLine, Share2, Copy, CheckCircle2,
  Hash, FolderKanban, PenSquare, CheckSquare
} from "lucide-react";
import { toast } from "sonner";
import { personalChatItems, type PersonalChatItem } from "./data";
import { companyDirectory, type CompanyContact } from "./data";
import { MosaicAvatar } from "./ChatView";

interface PersonalSidebarProps {
  selectedChat: string | null;
  onChatSelect: (id: string) => void;
  onClose: () => void;
  groupChats: PersonalChatItem[];
  onGroupChatsChange: (chats: PersonalChatItem[]) => void;
  extraDMs: PersonalChatItem[];
  onExtraDMsChange: (dms: PersonalChatItem[]) => void;
  expanded?: boolean;
  activeSection?: "personal" | "channel" | "project";
  onSectionChange?: (section: "personal" | "channel" | "project") => void;
  notifCount?: number;
  onToggleNotif?: () => void;
  onViewChange?: (view: string) => void;
}

const groupColorOptions = [
  "#0891b2", "#7c3aed", "#059669", "#d97706", "#db2777",
  "#4f46e5", "#0f766e", "#b45309", "#6366f1", "#e11d48",
];

export function PersonalSidebar({ selectedChat, onChatSelect, onClose, groupChats, onGroupChatsChange, extraDMs, onExtraDMsChange, expanded, activeSection = "personal", onSectionChange, notifCount = 0, onToggleNotif, onViewChange }: PersonalSidebarProps) {
  const [search, setSearch] = useState("");
  const [showTools, setShowTools] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PersonalChatItem | null>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [showFindContact, setShowFindContact] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [chatFilter, setChatFilter] = useState<"all" | "unread" | "online">("all");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renamedItems, setRenamedItems] = useState<Record<string, string>>({});

  const dms = [...personalChatItems.filter(i => i.type === "dm"), ...extraDMs];

  const filteredTools = search
    ? personalChatItems.filter(t => t.type === "tool" && t.name.toLowerCase().includes(search.toLowerCase()))
    : personalChatItems.filter(t => t.type === "tool");

  const timeScore = (t?: string): number => {
    if (!t) return 99999;
    if (t === "Vừa xong") return 0;
    // Relative: "5 phút trước", "2 giờ trước", etc.
    const rel = t.match(/^(\d+)\s*(phút|giờ|ngày|tuần|tháng)/);
    if (rel) {
      const n = parseInt(rel[1]);
      if (rel[2] === "phút") return n;
      if (rel[2] === "giờ") return n * 60;
      if (rel[2] === "ngày") return n * 60 * 24;
      if (rel[2] === "tuần") return n * 60 * 24 * 7;
      if (rel[2] === "tháng") return n * 60 * 24 * 30;
    }
    // Clock time today: "10:32" → convert to minutes ago using actual current time
    const clock = t.match(/^(\d{1,2}):(\d{2})$/);
    if (clock) {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const msgMin = parseInt(clock[1]) * 60 + parseInt(clock[2]);
      return Math.max(0, nowMin - msgMin);
    }
    if (t === "Hôm qua") return 60 * 24;
    // Day of week abbreviations: T2–T7, CN
    const dow: Record<string, number> = { "CN": 2 * 1440, "T2": 3 * 1440, "T3": 4 * 1440, "T4": 5 * 1440, "T5": 6 * 1440, "T6": 7 * 1440, "T7": 8 * 1440 };
    if (dow[t] !== undefined) return dow[t];
    return 99999;
  };

  const allChats: (PersonalChatItem & { _type: "dm" | "group" })[] = [
    ...groupChats.map(g => ({ ...g, _type: "group" as const })),
    ...dms.map(d => ({ ...d, _type: "dm" as const })),
  ].sort((a, b) => timeScore(a.lastTime) - timeScore(b.lastTime));

  const filteredChats = allChats.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.lastMessage?.toLowerCase().includes(search.toLowerCase())) return false;
    if (archivedIds.includes(c.id)) return false;
    if (chatFilter === "unread") return (c.unread || 0) > 0;
    if (chatFilter === "online") return c._type === "dm" && (c as any).online === true;
    return true;
  });

  const pinnedChats = filteredChats.filter(c => pinnedIds.includes(c.id));
  const regularChats = filteredChats.filter(c => !pinnedIds.includes(c.id));
  const archivedChats = allChats.filter(c => archivedIds.includes(c.id));

  const totalUnread = allChats.reduce((sum, c) => sum + (c.unread || 0), 0);

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 260);
    setContextMenu({ id, x, y });
  };

  const handleTogglePin = (id: string) => {
    const isCurrentlyPinned = pinnedIds.includes(id);
    setPinnedIds(prev => isCurrentlyPinned ? prev.filter(x => x !== id) : [...prev, id]);
    toast.success(isCurrentlyPinned ? "Đã bỏ ghim" : "Đã ghim");
    setContextMenu(null);
  };

  const handleArchive = (id: string) => {
    setArchivedIds(prev => [...prev, id]);
    toast.success("Đã lưu trữ cuộc trò chuyện");
    setContextMenu(null);
  };

  const handleCreateGroup = (name: string, memberIds: string[], color: string) => {
    const selectedMembers = dms.filter(d => memberIds.includes(d.id));
    const memberNames = selectedMembers.map(m => m.name);
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "GR";
    const newGroup: PersonalChatItem = {
      id: `pc-group-${Date.now()}`,
      name,
      type: "group",
      icon: initials,
      color,
      members: memberNames,
      lastMessage: `Nhóm được tạo với ${memberNames.length} thành viên`,
      lastTime: "Vừa xong",
    };
    onGroupChatsChange([newGroup, ...groupChats]);
    setShowCreateGroup(false);
    onChatSelect(newGroup.id);
  };

  const handleEditGroup = (id: string, name: string, memberIds: string[], color: string) => {
    const selectedMembers = dms.filter(d => memberIds.includes(d.id));
    const memberNames = selectedMembers.map(m => m.name);
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "GR";
    onGroupChatsChange(groupChats.map(g => g.id === id ? { ...g, name, icon: initials, color, members: memberNames } : g));
    setEditingGroup(null);
  };

  const handleDeleteGroup = (id: string) => {
    onGroupChatsChange(groupChats.filter(g => g.id !== id));
    setContextMenu(null);
  };

  const handleStartRename = (item: PersonalChatItem) => {
    setRenamingId(item.id);
    setRenameValue(renamedItems[item.id] || item.name);
    setContextMenu(null);
  };

  const handleConfirmRename = (id: string) => {
    if (renameValue.trim()) {
      setRenamedItems(prev => ({ ...prev, [id]: renameValue.trim() }));
      toast.success("Đã đổi tên");
    }
    setRenamingId(null);
  };

  const activeContacts = [...dms, ...groupChats].slice(0, 12);

  return (
    <div className={`${expanded ? "flex-1" : "hidden md:flex md:w-[280px] md:shrink-0"} h-full bg-white flex flex-col border-r border-gray-300/60 overflow-hidden pb-16 md:pb-0`}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex-1 min-w-0 md:hidden">
          <p className="text-[22px] leading-tight truncate" style={{ fontWeight: 800 }}>
            <span className="text-cyan-500">VWork</span>
            <span className="text-gray-900"> Chat</span>
          </p>
        </div>
        <button onClick={() => setShowNewMessage(true)}
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-200 flex items-center justify-center text-gray-700 transition-all shrink-0">
          <PenSquare className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 focus-within:border-cyan-300 transition-all">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Tìm cuộc trò chuyện..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-[13px] bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

      {/* Section switcher — mobile only, between search and filter tabs */}
      {onSectionChange && (
        <div className="md:hidden flex gap-2 mt-2">
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
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>
      )}
      </div>

      {/* Active contacts row — mobile only */}
      <div className="md:hidden px-3 py-2 border-b border-gray-100">
        <div className="flex gap-4 overflow-x-auto no-scrollbar px-1 py-2">
          {activeContacts.map(contact => {
            const unreadCount = contact.unread || 0;
            const label = contact.icon || contact.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            return (
              <button key={contact.id} onClick={() => onChatSelect(contact.id)}
                className="flex flex-col items-center gap-1 shrink-0 active:opacity-70 transition-opacity">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-[16px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: contact.color || "#0891b2" }}>
                    {label}
                  </div>
                  {contact.online && (
                    <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white" />
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] text-white font-bold flex items-center justify-center px-1 shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-gray-600 w-14 text-center truncate leading-tight">
                  {contact.name.split(" ").slice(-1)[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* My Work shortcut */}
      {onViewChange && (
        <div className="px-3 pb-2">
          <button
            onClick={() => onViewChange("mywork")}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 active:bg-cyan-200 border border-cyan-100 transition-all group"
          >
            <div className="w-7 h-7 rounded-lg bg-cyan-500 flex items-center justify-center shrink-0">
              <CheckSquare className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[13px] font-medium text-cyan-700">Công việc của tôi</p>
              <p className="text-[10px] text-cyan-500/70">Task được giao cho bạn</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-600 shrink-0" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 px-3 mt-1.5 mb-1 overflow-x-auto no-scrollbar">
        {([
          { key: "all", label: "Tất cả" },
          { key: "unread", label: "Chưa đọc" },
          { key: "online", label: "Online" },
        ] as const).map(f => (
          <button key={f.key} onClick={() => setChatFilter(f.key)}
            className={`shrink-0 px-3 py-[4px] rounded-full text-[12px] font-medium transition-all ${chatFilter === f.key ? "bg-cyan-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100 bg-gray-50"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {/* Tools section - hide when filtering by group or dm */}
        {chatFilter === "all" && (
          <div className="mb-1">
            <button
              onClick={() => setShowTools(!showTools)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-all"
            >
              {showTools ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Pin className="w-3 h-3 text-gray-400" />
              <span className="flex-1 text-left">Ghim</span>
              <span className="text-[9px] text-gray-400">{filteredTools.length}</span>
            </button>
            {showTools && (
              <div className="space-y-0.5">
                {filteredTools.map(item => (
                  <ToolItem
                    key={item.id}
                    item={item}
                    isActive={selectedChat === item.id}
                    onClick={() => onChatSelect(item.id)}
                    onContextMenu={e => handleContextMenu(e, item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pinned chats */}
        {pinnedChats.length > 0 && (
          <div className="mb-1">
            <div className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-gray-500 uppercase tracking-wider">
              <Pin className="w-3 h-3 text-amber-500" />
              <span className="flex-1 text-left">Đã ghim</span>
              <span className="text-[9px] text-gray-400">{pinnedChats.length}</span>
            </div>
            <div className="space-y-0.5">
              {pinnedChats.map(item => (
                <ChatItem
                  key={item.id}
                  item={item}
                  isActive={selectedChat === item.id}
                  isPinned={true}
                  isGroup={item._type === "group"}
                  onClick={() => onChatSelect(item.id)}
                  onContextMenu={e => handleContextMenu(e, item.id)}
                  onMoreClick={(e) => { const x = Math.min(e.clientX, window.innerWidth - 200); const y = Math.min(e.clientY, window.innerHeight - 260); setContextMenu({ id: item.id, x, y }); }}
                  renamedName={renamedItems[item.id]}
                  renamingId={renamingId}
                  renameValue={renameValue}
                  onRenameChange={setRenameValue}
                  onRenameConfirm={handleConfirmRename}
                  onRenameCancel={() => setRenamingId(null)}
                />
              ))}
            </div>
          </div>
        )}

        {/* All chats (interleaved DMs + groups) */}
        {regularChats.length > 0 ? (
          <div className="space-y-0.5">
            {regularChats.map(item => (
              <ChatItem
                key={item.id}
                item={item}
                isActive={selectedChat === item.id}
                isPinned={false}
                isGroup={item._type === "group"}
                onClick={() => onChatSelect(item.id)}
                onContextMenu={e => handleContextMenu(e, item.id)}
                onMoreClick={(e) => { const x = Math.min(e.clientX, window.innerWidth - 200); const y = Math.min(e.clientY, window.innerHeight - 260); setContextMenu({ id: item.id, x, y }); }}
                renamedName={renamedItems[item.id]}
                renamingId={renamingId}
                renameValue={renameValue}
                onRenameChange={setRenameValue}
                onRenameConfirm={handleConfirmRename}
                onRenameCancel={() => setRenamingId(null)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-6 h-6 text-gray-200 mx-auto mb-2" />
            <p className="text-[11px] text-gray-500">
              {search ? "Không tìm thấy cuộc trò chuyện" : chatFilter === "unread" ? "Không có tin chưa đọc" : "Chưa có cuộc trò chuyện nào"}
            </p>
          </div>
        )}

        {/* Archived section */}
        {archivedChats.length > 0 && (
          <div className="mb-1 mt-2">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-all"
            >
              {showArchived ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Archive className="w-3 h-3 text-gray-400" />
              <span className="flex-1 text-left">Đã lưu trữ ({archivedChats.length})</span>
            </button>
            {showArchived && (
              <div className="space-y-0.5 opacity-60">
                {archivedChats.map(item => (
                  <ChatItem
                    key={item.id}
                    item={item as PersonalChatItem & { _type: "dm" | "group" }}
                    isActive={selectedChat === item.id}
                    isPinned={false}
                    isGroup={(item as any)._type === "group" || item.type === "group"}
                    onClick={() => onChatSelect(item.id)}
                    onContextMenu={e => handleContextMenu(e, item.id)}
                    onMoreClick={(e) => { const x = Math.min(e.clientX, window.innerWidth - 200); const y = Math.min(e.clientY, window.innerHeight - 260); setContextMenu({ id: item.id, x, y }); }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>


      {/* Context Menu */}
      {contextMenu && (() => {
        const isMobile = window.innerWidth < 768;
        const isGroup = contextMenu.id.startsWith("pc-group-") || contextMenu.id.startsWith("cg");
        const menuItems = (
          <>
            <button onClick={() => contextMenu && handleTogglePin(contextMenu.id)}
              className="w-full flex items-center gap-3 px-4 py-3 md:px-3 md:py-1.5 text-[14px] md:text-[12px] text-gray-600 active:bg-gray-50 hover:bg-gray-50">
              <Pin className="w-4 h-4 md:w-3 md:h-3 text-gray-400" /> {contextMenu && pinnedIds.includes(contextMenu.id) ? "Bỏ ghim" : "Ghim cuộc trò chuyện"}
            </button>
            <button onClick={() => { toast.success("Đã tắt thông báo"); setContextMenu(null); }}
              className="w-full flex items-center gap-3 px-4 py-3 md:px-3 md:py-1.5 text-[14px] md:text-[12px] text-gray-600 active:bg-gray-50 hover:bg-gray-50">
              <BellOff className="w-4 h-4 md:w-3 md:h-3 text-gray-400" /> Tắt thông báo
            </button>
            {isGroup && (
              <button
                onClick={() => { const group = groupChats.find(g => g.id === contextMenu.id); if (group) { setEditingGroup(group); setContextMenu(null); } }}
                className="w-full flex items-center gap-3 px-4 py-3 md:px-3 md:py-1.5 text-[14px] md:text-[12px] text-gray-600 active:bg-gray-50 hover:bg-gray-50">
                <Settings2 className="w-4 h-4 md:w-3 md:h-3 text-gray-400" /> Chỉnh sửa nhóm
              </button>
            )}
            <button
              onClick={() => {
                if (isGroup) {
                  const group = groupChats.find(g => g.id === contextMenu.id);
                  if (group) { setEditingGroup(group); setContextMenu(null); }
                } else {
                  const allDMs = [...personalChatItems.filter(i => i.type === "dm"), ...extraDMs];
                  const item = allDMs.find(d => d.id === contextMenu.id);
                  if (item) handleStartRename(item);
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 md:px-3 md:py-1.5 text-[14px] md:text-[12px] text-gray-600 active:bg-gray-50 hover:bg-gray-50">
              <PenLine className="w-4 h-4 md:w-3 md:h-3 text-gray-400" /> Đổi tên
            </button>
            <button onClick={() => contextMenu && handleArchive(contextMenu.id)}
              className="w-full flex items-center gap-3 px-4 py-3 md:px-3 md:py-1.5 text-[14px] md:text-[12px] text-gray-600 active:bg-gray-50 hover:bg-gray-50">
              <Archive className="w-4 h-4 md:w-3 md:h-3 text-gray-400" /> Lưu trữ
            </button>
            <div className="h-px bg-gray-100 my-1 mx-3" />
            <button
              onClick={() => { if (isGroup) { handleDeleteGroup(contextMenu.id); } else { setContextMenu(null); } }}
              className="w-full flex items-center gap-3 px-4 py-3 md:px-3 md:py-1.5 text-[14px] md:text-[12px] text-red-500 active:bg-red-50 hover:bg-red-50">
              <Trash2 className="w-4 h-4 md:w-3 md:h-3" /> Xoá cuộc trò chuyện
            </button>
          </>
        );

        if (isMobile) return (
          <div className="fixed inset-0 z-50 flex items-end" onClick={() => setContextMenu(null)}>
            <div className="w-full bg-white rounded-t-2xl shadow-2xl pb-6 overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: "slideUp 0.2s ease" }}>
              <div className="flex justify-center pt-3 pb-2"><div className="w-9 h-1 rounded-full bg-gray-200" /></div>
              <div className="py-1">{menuItems}</div>
            </div>
          </div>
        );

        return (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
            <div className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-1 w-[180px]" style={{ top: contextMenu.y, left: contextMenu.x }}>
              {menuItems}
            </div>
          </>
        );
      })()}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <GroupModal
          mode="create"
          dms={dms}
          onClose={() => setShowCreateGroup(false)}
          onCreate={handleCreateGroup}
        />
      )}

      {/* Edit Group Modal */}
      {editingGroup && (
        <GroupModal
          mode="edit"
          dms={dms}
          editGroup={editingGroup}
          onClose={() => setEditingGroup(null)}
          onEdit={(name, memberIds, color) => handleEditGroup(editingGroup.id, name, memberIds, color)}
        />
      )}

      {/* New Message Modal */}
      {showNewMessage && (
        <NewMessageModal
          existingDMs={dms}
          onClose={() => setShowNewMessage(false)}
          onSelectNotes={() => { setShowNewMessage(false); onChatSelect("pc-notes"); }}
          onCreateGroup={() => { setShowNewMessage(false); setShowCreateGroup(true); }}
          onStartChat={(contact) => {
            // Check if DM already exists for this contact
            const existing = dms.find(d => d.name === contact.name);
            if (existing) {
              onChatSelect(existing.id);
            } else {
              // Create new DM from company contact
              const newDM: PersonalChatItem = {
                id: `pc-dm-${contact.id}`,
                name: contact.name,
                type: "dm",
                icon: contact.initials,
                color: contact.color,
                online: contact.online,
                lastMessage: "Bắt đầu cuộc trò chuyện",
                lastTime: "Vừa xong",
              };
              onExtraDMsChange([newDM, ...extraDMs]);
              onChatSelect(newDM.id);
            }
            setShowNewMessage(false);
          }}
        />
      )}

      {showFindContact && (
        <FindContactModal
          onClose={() => setShowFindContact(false)}
          onStartChat={(contact) => {
            const existing = dms.find(d => d.name === contact.name);
            if (existing) {
              onChatSelect(existing.id);
            } else {
              const newDM: PersonalChatItem = {
                id: `pc-dm-${contact.id}`,
                name: contact.name,
                type: "dm",
                icon: contact.initials,
                color: contact.color,
                online: contact.online,
                lastMessage: "Bắt đầu cuộc trò chuyện",
                lastTime: "Vừa xong",
              };
              onExtraDMsChange([newDM, ...extraDMs]);
              onChatSelect(newDM.id);
            }
            setShowFindContact(false);
          }}
        />
      )}
    </div>
  );
}

// ── Group Modal (Create & Edit) ──
function GroupModal({ mode, dms, editGroup, onClose, onCreate, onEdit }: {
  mode: "create" | "edit";
  dms: PersonalChatItem[];
  editGroup?: PersonalChatItem;
  onClose: () => void;
  onCreate?: (name: string, memberIds: string[], color: string) => void;
  onEdit?: (name: string, memberIds: string[], color: string) => void;
}) {
  // For edit mode, find which DM ids correspond to the group's member names
  const initialSelectedIds = mode === "edit" && editGroup?.members
    ? dms.filter(d => editGroup.members!.includes(d.name)).map(d => d.id)
    : [];

  const [step, setStep] = useState<"select" | "name">(mode === "edit" ? "name" : "select");
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [groupName, setGroupName] = useState(mode === "edit" ? editGroup?.name || "" : "");
  const [selectedColor, setSelectedColor] = useState(mode === "edit" ? editGroup?.color || groupColorOptions[0] : groupColorOptions[0]);
  const [memberSearch, setMemberSearch] = useState("");

  const filteredDMs = dms.filter(d =>
    !memberSearch || d.name.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const toggleMember = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectedMembers = dms.filter(d => selectedIds.includes(d.id));

  const autoName = selectedMembers.length > 0
    ? selectedMembers.map(m => m.name.split(" ").pop()).join(", ")
    : "";

  const handleSubmit = () => {
    const name = groupName.trim() || autoName;
    if (name && selectedIds.length >= 2) {
      if (mode === "edit" && onEdit) {
        onEdit(name, selectedIds, selectedColor);
      } else if (onCreate) {
        onCreate(name, selectedIds, selectedColor);
      }
    }
  };

  const isEdit = mode === "edit";
  const accentColor = isEdit ? "blue" : "emerald";
  const accentBg = isEdit ? "from-blue-500 to-indigo-500" : "from-emerald-500 to-teal-500";
  const accentBtn = isEdit ? "bg-blue-500 hover:bg-blue-600" : "bg-emerald-500 hover:bg-emerald-600";
  const accentBtnDisabled = isEdit ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-400 cursor-not-allowed";
  const accentRing = isEdit ? "ring-blue-400" : "ring-emerald-400";
  const accentBorder = isEdit ? "focus-within:border-blue-300" : "focus-within:border-emerald-300";
  const accentCheck = isEdit ? "bg-blue-500 border-blue-500" : "bg-emerald-500 border-emerald-500";
  const accentChip = isEdit ? "bg-blue-50" : "bg-emerald-50";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 md:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:w-[420px] max-h-[calc(90vh-64px)] md:max-h-[85vh] flex flex-col overflow-hidden mb-16 md:mb-0"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${accentBg} flex items-center justify-center`}>
            {isEdit ? <Settings2 className="w-4 h-4 text-white" /> : <Users className="w-4 h-4 text-white" />}
          </div>
          <div className="flex-1">
            <p className="text-[14px] text-gray-900" style={{ fontWeight: 600 }}>
              {isEdit
                ? (step === "select" ? "Quản lý thành viên" : "Chỉnh sửa nhóm")
                : (step === "select" ? "Chọn thành viên" : "Đặt tên nhóm")}
            </p>
            <p className="text-[11px] text-gray-500">
              {step === "select"
                ? `Chọn ít nhất 2 người (${selectedIds.length} đã chọn)`
                : `${selectedIds.length} thành viên`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === "select" ? (
          <>
            {/* Search members */}
            <div className="px-4 py-2.5">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 ${accentBorder} transition-all`}>
                <Search className="w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm đồng nghiệp..."
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  className="flex-1 text-[12px] bg-transparent outline-none text-gray-700 placeholder-gray-400"
                  autoFocus
                />
              </div>
            </div>

            {/* Selected chips */}
            {selectedMembers.length > 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {selectedMembers.map(m => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-white cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: m.color }}
                    onClick={() => toggleMember(m.id)}
                  >
                    {m.name.split(" ").pop()}
                    <X className="w-2.5 h-2.5" />
                  </span>
                ))}
              </div>
            )}

            {/* Member list */}
            <div className="flex-1 overflow-y-auto px-3 pb-2">
              {filteredDMs.map(dm => {
                const isSelected = selectedIds.includes(dm.id);
                return (
                  <button
                    key={dm.id}
                    onClick={() => toggleMember(dm.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      isSelected ? accentChip : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div
                        className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] text-white"
                        style={{ backgroundColor: dm.color }}
                      >
                        {dm.icon}
                      </div>
                      {dm.online !== undefined && (
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          dm.online ? "bg-emerald-500" : "bg-gray-300"
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-gray-800 truncate">{dm.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {dm.online ? "Đang hoạt động" : "Ngoại tuyến"}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? accentCheck
                        : "border-gray-300"
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Next button */}
            <div className="px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => setStep("name")}
                disabled={selectedIds.length < 2}
                className={`w-full py-2.5 rounded-xl text-[12px] transition-all ${
                  selectedIds.length >= 2
                    ? `${accentBtn} text-white shadow-sm`
                    : accentBtnDisabled
                }`}
                style={{ fontWeight: 500 }}
              >
                {isEdit ? `Xác nhận (${selectedIds.length} thành viên)` : `Tiếp tục (${selectedIds.length} thành viên)`}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Name step */}
            <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
              {/* Group preview with mosaic */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <MosaicAvatar
                  members={selectedMembers.map(m => m.name)}
                  color={selectedColor}
                  size={42}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-gray-800 truncate" style={{ fontWeight: 600 }}>
                    {groupName.trim() || autoName || "Nhóm mới"}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {selectedMembers.length} thành viên · {selectedMembers.map(m => m.name.split(" ").pop()).join(", ")}
                  </p>
                </div>
              </div>

              {/* Group name input */}
              <div>
                <label className="text-[11px] text-gray-700 font-medium mb-1.5 block">
                  Tên nhóm {!isEdit && <span className="text-gray-400">(tuỳ chọn)</span>}
                </label>
                <input
                  type="text"
                  placeholder={autoName}
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-800 outline-none focus:border-emerald-300 placeholder-gray-400 transition-all"
                  autoFocus
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="text-[11px] text-gray-700 font-medium mb-2 block">
                  Màu nhóm
                </label>
                <div className="flex gap-2 flex-wrap">
                  {groupColorOptions.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`w-7 h-7 rounded-full transition-all ${
                        selectedColor === c ? `ring-2 ring-offset-2 ${accentRing} scale-110` : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Members summary */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] text-gray-700 font-medium">
                    Thành viên ({selectedMembers.length})
                  </label>
                  <button
                    onClick={() => setStep("select")}
                    className="text-[10px] text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-all"
                  >
                    <UserPlus className="w-3 h-3" />
                    {isEdit ? "Thêm/xoá" : "Thay đổi"}
                  </button>
                </div>
                <div className="space-y-1">
                  {selectedMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-all group">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] text-white shrink-0"
                        style={{ backgroundColor: m.color }}
                      >
                        {m.icon}
                      </div>
                      <span className="text-[11px] text-gray-700 flex-1">{m.name}</span>
                      {m.online !== undefined && (
                        <span className={`w-1.5 h-1.5 rounded-full ${m.online ? "bg-emerald-400" : "bg-gray-300"}`} />
                      )}
                      <button
                        onClick={() => { if (selectedIds.length > 2) toggleMember(m.id); }}
                        className={`w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ${selectedIds.length > 2 ? "text-red-400 hover:bg-red-50 hover:text-red-600" : "text-gray-300 cursor-not-allowed"}`}
                        title={selectedIds.length <= 2 ? "Cần ít nhất 2 thành viên" : "Xoá khỏi nhóm"}
                      >
                        <UserMinus className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="px-5 py-3 border-t border-gray-100 flex gap-2">
              {!isEdit ? (
                <button
                  onClick={() => setStep("select")}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-[12px] transition-all"
                  style={{ fontWeight: 500 }}
                >
                  Quay lại
                </button>
              ) : null}
              <button
                onClick={handleSubmit}
                disabled={selectedIds.length < 2}
                className={`flex-1 py-2.5 rounded-xl text-white text-[12px] shadow-sm transition-all ${selectedIds.length >= 2 ? accentBtn : "bg-gray-300 cursor-not-allowed"}`}
                style={{ fontWeight: 500 }}
              >
                {isEdit ? "Lưu thay đổi" : "Tạo nhóm"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── New Message Modal ──
function NewMessageModal({ existingDMs, onClose, onSelectNotes, onCreateGroup, onStartChat }: {
  existingDMs: PersonalChatItem[];
  onClose: () => void;
  onSelectNotes: () => void;
  onCreateGroup: () => void;
  onStartChat: (contact: CompanyContact) => void;
}) {
  const [search, setSearch] = useState("");

  const allContacts = companyDirectory;
  const filtered = allContacts.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) => {
    if (a.online && !b.online) return -1;
    if (!a.online && b.online) return 1;
    return a.name.localeCompare(b.name);
  });

  const quickOptions = [
    {
      icon: <StickyNote className="w-5 h-5 text-gray-600" />,
      bg: "bg-gray-200",
      label: "Ghi chú mới",
      onClick: onSelectNotes,
    },
    {
      icon: <Users className="w-5 h-5 text-gray-600" />,
      bg: "bg-gray-200",
      label: "Nhóm chat",
      onClick: onCreateGroup,
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-gray-600" />,
      bg: "bg-gray-200",
      label: "Chat với AI",
      onClick: () => { toast.success("Tính năng đang phát triển"); onClose(); },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col md:bg-black/30 md:items-center md:justify-center md:p-4">
      <div
        className="flex flex-col h-full md:h-auto md:max-h-[85vh] md:w-[420px] md:rounded-2xl md:shadow-2xl md:bg-white overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top bar — Messenger style */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
          <button onClick={onClose} className="text-[15px] text-cyan-500 font-medium active:opacity-60 transition-opacity w-12">
            Hủy
          </button>
          <p className="text-[16px] text-gray-900 font-bold">Tin nhắn mới</p>
          <div className="w-12" />
        </div>

        {/* Đến: row */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <span className="text-[14px] text-gray-500 shrink-0">Đến:</span>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-[14px] outline-none text-gray-800 placeholder-gray-400 bg-transparent"
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Quick options — only show when not searching */}
          {!search && (
            <>
              {quickOptions.map(opt => (
                <button
                  key={opt.label}
                  onClick={opt.onClick}
                  className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-11 h-11 rounded-full ${opt.bg} flex items-center justify-center shrink-0`}>
                    {opt.icon}
                  </div>
                  <span className="flex-1 text-left text-[15px] text-gray-900 font-medium">{opt.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
              <p className="px-4 pt-4 pb-2 text-[13px] text-gray-500 font-medium">Gợi ý</p>
            </>
          )}

          {/* Contact list */}
          {sorted.map(contact => (
            <button
              key={contact.id}
              onClick={() => onStartChat(contact)}
              className="w-full flex items-center gap-4 px-4 py-3 active:bg-gray-50 hover:bg-gray-50 transition-colors"
            >
              <div className="relative shrink-0">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold text-white"
                  style={{ backgroundColor: contact.color }}
                >
                  {contact.initials}
                </div>
                {contact.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[15px] text-gray-900 truncate">{contact.name}</p>
                {contact.online && (
                  <p className="text-[12px] text-green-500 truncate">Đang hoạt động</p>
                )}
              </div>
            </button>
          ))}

          {sorted.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[14px] text-gray-400">Không tìm thấy kết quả</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Tool item (Ghi chú, Tin nhắn đã lưu, Nhật ký)
function ToolItem({ item, isActive, onClick, onContextMenu }: {
  item: PersonalChatItem; isActive: boolean; onClick: () => void; onContextMenu: (e: React.MouseEvent) => void;
}) {
  const iconMap: Record<string, React.ReactNode> = {
    "pc-notes": <StickyNote className="w-3.5 h-3.5" />,
    "pc-saved": <Bookmark className="w-3.5 h-3.5" />,
    "pc-journal": <BookOpen className="w-3.5 h-3.5" />,
  };

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[12px] transition-all group ${
        isActive
          ? "bg-cyan-50 text-cyan-800"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
      }`}
    >
      <div
        className={`w-[28px] h-[28px] rounded-lg flex items-center justify-center shrink-0 transition-all ${
          isActive ? "bg-cyan-500 text-white" : "bg-gray-100 text-gray-500"
        }`}
      >
        {iconMap[item.id] || <span className="text-[10px]">{item.emoji}</span>}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className={`text-[13px] truncate ${isActive ? "text-cyan-800" : "text-gray-700"}`}>
          {item.name}
        </p>
        {item.description && (
          <p className="text-[11px] text-gray-500 truncate">{item.description}</p>
        )}
      </div>
      {item.unread && item.unread > 0 && !isActive && (
        <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-cyan-500 text-white text-[9px] flex items-center justify-center shrink-0">
          {item.unread}
        </span>
      )}
    </button>
  );
}

// Unified chat item for both DMs and groups (Messenger-style)
function ChatItem({ item, isActive, isPinned, isGroup, onClick, onContextMenu, onMoreClick, renamedName, renamingId, renameValue, onRenameChange, onRenameConfirm, onRenameCancel }: {
  item: PersonalChatItem;
  isActive: boolean;
  isPinned?: boolean;
  isGroup: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onMoreClick?: (e: React.MouseEvent) => void;
  renamedName?: string;
  renamingId?: string | null;
  renameValue?: string;
  onRenameChange?: (val: string) => void;
  onRenameConfirm?: (id: string) => void;
  onRenameCancel?: () => void;
}) {
  const isRenaming = renamingId === item.id;
  const displayName = renamedName || item.name;
  const hasEmoji = item.emoji && item.id.startsWith("cg");

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`w-full relative flex items-center gap-2.5 px-2.5 py-[7px] rounded-xl text-[12px] transition-all group ${
        isActive
          ? "bg-cyan-50 text-cyan-800"
          : "text-gray-600 hover:bg-gray-50/80 hover:text-gray-800"
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {isGroup ? (
          hasEmoji ? (
            <div className="w-[38px] h-[38px] rounded-xl flex items-center justify-center text-[18px]" style={{ backgroundColor: item.color + "22" }}>
              {item.emoji}
            </div>
          ) : (
            <MosaicAvatar members={item.members || []} color={item.color} size={38} />
          )
        ) : (
          <>
            <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[12px] text-white font-medium" style={{ backgroundColor: item.color }}>
              {item.icon}
            </div>
            {item.typing ? (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center">
                <span className="text-[5px] text-white leading-none">···</span>
              </div>
            ) : item.online ? (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            ) : item.online === false ? (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-gray-300 border-2 border-white" />
            ) : null}
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue ?? ""}
              onChange={e => onRenameChange?.(e.target.value)}
              onBlur={() => onRenameConfirm?.(item.id)}
              onKeyDown={e => {
                if (e.key === "Enter") onRenameConfirm?.(item.id);
                if (e.key === "Escape") onRenameCancel?.();
              }}
              className="text-[13px] bg-white border border-cyan-300 rounded px-1.5 py-0.5 outline-none text-gray-800 w-full"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <p className={`text-[13px] truncate flex-1 leading-snug ${
              isActive ? "text-cyan-800" : (item.unread ? "text-gray-900" : "text-gray-700")
            }`} style={item.unread ? { fontWeight: 600 } : { fontWeight: 500 }}>
              {displayName}
              {isPinned && <span className="ml-1 text-amber-500 text-[10px]">📌</span>}
            </p>
          )}
          {!isRenaming && item.lastTime && (
            <span className={`text-[10px] shrink-0 ${item.unread ? "text-cyan-600 font-medium" : "text-gray-400"}`}>
              {item.lastTime}
            </span>
          )}
        </div>
        {item.typing ? (
          <span className="text-[11px] text-cyan-500 italic flex items-center gap-1">
            <span className="inline-flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
            đang nhập...
          </span>
        ) : (
          <p className={`text-[11px] truncate leading-snug ${item.unread ? "text-gray-600" : "text-gray-400"}`}>
            {item.lastMessage || (isGroup && item.members ? `${item.members.length} thành viên` : "")}
          </p>
        )}
      </div>

      {/* Unread badge */}
      {(item.unread || 0) > 0 && !isActive && (
        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-500 text-white text-[9px] flex items-center justify-center shrink-0 font-medium">
          {item.unread}
        </span>
      )}

      {/* Mobile-only action button */}
      <button
        onClick={(e) => { e.stopPropagation(); onMoreClick ? onMoreClick(e) : onContextMenu(e); }}
        className="md:hidden w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600"
      >
        <MoreHorizontal className="w-3 h-3" />
      </button>

      {/* Desktop hover actions */}
      <div className="absolute right-1 inset-y-0 items-center gap-0.5 hidden md:group-hover:flex transition-all">
        {!isGroup && (
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="w-6 h-6 rounded-md hover:bg-gray-200/80 flex items-center justify-center text-gray-400 hover:text-gray-600"
            title="Tắt thông báo"
          >
            <BellOff className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onMoreClick ? onMoreClick(e) : onContextMenu(e); }}
          className="w-6 h-6 rounded-md hover:bg-gray-200/80 flex items-center justify-center text-gray-400 hover:text-gray-600"
        >
          <MoreHorizontal className="w-3 h-3" />
        </button>
      </div>
    </button>
  );
}

// DM item (chat with colleague)
function DMItem({ item, isActive, isPinned, onClick, onContextMenu, onMute, onMoreClick, renamingId, renameValue, onRenameChange, onRenameConfirm, onRenameCancel }: {
  item: PersonalChatItem;
  isActive: boolean;
  isPinned?: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onMute?: () => void;
  onMoreClick?: (e: React.MouseEvent) => void;
  renamingId?: string | null;
  renameValue?: string;
  onRenameChange?: (val: string) => void;
  onRenameConfirm?: (id: string) => void;
  onRenameCancel?: () => void;
}) {
  const isRenaming = renamingId === item.id;

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`w-full relative flex items-center gap-2.5 px-2.5 py-[8px] rounded-lg text-[12px] transition-all group ${
        isActive
          ? "bg-cyan-50 text-cyan-800"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
      }`}
    >
      <div className="relative shrink-0">
        <div
          className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] text-white"
          style={{ backgroundColor: item.color }}
        >
          {item.icon}
        </div>
        {item.typing ? (
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center">
            <span className="text-[4px] text-white">···</span>
          </div>
        ) : item.online ? (
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
        ) : item.online === false ? (
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-gray-300 border-2 border-white" />
        ) : null}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1">
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue ?? ""}
              onChange={e => onRenameChange && onRenameChange(e.target.value)}
              onBlur={() => onRenameConfirm && onRenameConfirm(item.id)}
              onKeyDown={e => {
                if (e.key === "Enter") { onRenameConfirm && onRenameConfirm(item.id); }
                if (e.key === "Escape") { onRenameCancel && onRenameCancel(); }
              }}
              className="text-[13px] bg-white border border-cyan-300 rounded px-1.5 py-0.5 outline-none text-gray-800 w-full"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <p className={`text-[13px] truncate flex-1 ${
              isActive ? "text-cyan-800" : item.unread ? "text-gray-900" : "text-gray-700"
            }`} style={item.unread ? { fontWeight: 600 } : {}}>
              {item.name}
            </p>
          )}
          {!isRenaming && isPinned && (
            <Pin className="w-2.5 h-2.5 text-amber-500 shrink-0" />
          )}
          {!isRenaming && item.lastTime && !item.typing && (
            <span className={`text-[10px] shrink-0 ${item.unread ? "text-cyan-600" : "text-gray-400"}`}>
              {item.lastTime}
            </span>
          )}
        </div>
        {item.typing ? (
          <span className="text-[12px] text-cyan-500 italic flex items-center gap-1">
            <span className="inline-flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
            đang nhập...
          </span>
        ) : item.lastMessage ? (
          <p className={`text-[11px] truncate mt-0.5 ${
            item.unread ? "text-gray-600" : "text-gray-500"
          }`}>
            {item.lastMessage}
          </p>
        ) : null}
      </div>
      {item.unread && item.unread > 0 && !isActive && (
        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-500 text-white text-[9px] flex items-center justify-center shrink-0">
          {item.unread}
        </span>
      )}
      {/* Mobile: always-visible more button */}
      <button
        onClick={(e) => { e.stopPropagation(); onMoreClick ? onMoreClick(e) : onContextMenu(e); }}
        className="md:hidden w-7 h-7 rounded-md flex items-center justify-center text-gray-400 active:bg-gray-100 shrink-0"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {/* Desktop: hover-only actions */}
      <div className="absolute right-1 inset-y-0 items-center gap-0.5 hidden md:group-hover:flex transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onMute && onMute(); }}
          className="w-6 h-6 rounded-md hover:bg-gray-200/80 flex items-center justify-center text-gray-400 hover:text-gray-600"
          title="Tắt thông báo"
        >
          <BellOff className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMoreClick ? onMoreClick(e) : onContextMenu(e); }}
          className="w-6 h-6 rounded-md hover:bg-gray-200/80 flex items-center justify-center text-gray-400 hover:text-gray-600"
        >
          <MoreHorizontal className="w-3 h-3" />
        </button>
      </div>
    </button>
  );
}

// Group chat item with mosaic avatar
function GroupItem({ item, isActive, onClick, onContextMenu }: {
  item: PersonalChatItem; isActive: boolean; onClick: () => void; onContextMenu: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`w-full flex items-center gap-2.5 px-2.5 py-[8px] rounded-lg text-[12px] transition-all group ${
        isActive
          ? "bg-emerald-50 text-emerald-800"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
      }`}
    >
      <MosaicAvatar members={item.members || []} color={item.color} size={32} />
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1">
          <p className={`text-[13px] truncate flex-1 ${
            isActive ? "text-emerald-800" : "text-gray-700"
          }`} style={{ fontWeight: 500 }}>
            {item.name}
          </p>
          {item.lastTime && (
            <span className="text-[10px] text-gray-500 shrink-0">{item.lastTime}</span>
          )}
        </div>
        <p className="text-[11px] text-gray-500 truncate mt-0.5">
          {item.members ? `${item.members.length} thành viên` : ""}
          {item.lastMessage ? ` · ${item.lastMessage}` : ""}
        </p>
      </div>
      {item.unread && item.unread > 0 && !isActive && (
        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center shrink-0">
          {item.unread}
        </span>
      )}
      {/* Mobile: always-visible more button */}
      <button
        onClick={e => { e.stopPropagation(); onContextMenu(e); }}
        className="md:hidden w-7 h-7 rounded-md flex items-center justify-center text-gray-400 active:bg-gray-100 shrink-0"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {/* Desktop: hover-only */}
      <MoreHorizontal
        className={`w-3 h-3 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0 ${
          isActive ? "text-emerald-400" : "text-gray-300"
        }`}
        onClick={e => { e.stopPropagation(); onContextMenu(e); }}
      />
    </button>
  );
}

/* ── Find Contact Modal (Phone / QR) ── */
// My profile QR data
const MY_PROFILE = {
  name: "Nguyễn Minh",
  phone: "0912 345 678",
  id: "vwork_minhnd",
  color: "#0891b2",
};

function QRCodeSVG({ value, size = 160 }: { value: string; size?: number }) {
  // Deterministic pixel pattern from string — purely visual demo
  const cells = 21;
  const cell = size / cells;
  const bits: boolean[][] = Array.from({ length: cells }, (_, r) =>
    Array.from({ length: cells }, (_, c) => {
      // finder patterns (corners)
      const inFinder = (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);
      if (inFinder) {
        const fr = r % 7, fc = c % 7;
        const inFC = (r >= cells - 7) ? r - (cells - 7) : r;
        const inFR = (c >= cells - 7) ? c - (cells - 7) : c;
        const rr = inFinder && r < 7 && c < 7 ? r : inFinder && r < 7 ? c < 7 ? r : r : inFC;
        return (fr === 0 || fr === 6 || fc === 0 || fc === 6 || (fr >= 2 && fr <= 4 && fc >= 2 && fc <= 4));
      }
      // data cells — hash value string
      let h = 0;
      for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i) + r * 17 + c * 13) & 0xffff;
      return h % 3 !== 0;
    })
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: "pixelated" }}>
      <rect width={size} height={size} fill="white" />
      {bits.map((row, r) => row.map((on, c) => on ? (
        <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#1a1a1a" />
      ) : null))}
    </svg>
  );
}

function FindContactModal({ onClose, onStartChat }: {
  onClose: () => void;
  onStartChat: (contact: CompanyContact) => void;
}) {
  const [tab, setTab] = useState<"phone" | "qr" | "myqr">("phone");
  const [phone, setPhone] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalise = (p: string) => p.replace(/[\s\-().+]/g, "");
  const found = companyDirectory.find(c => c.phone && normalise(c.phone) === normalise(phone));
  const phoneValid = phone.replace(/\D/g, "").length >= 9;

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => { setScanning(false); setScanDone(true); }, 2200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(MY_PROFILE.phone).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-[80] backdrop-blur-[2px] p-0 md:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:w-[400px] max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()} style={{ animation: "fadeInScale 0.2s ease" }}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <QrCode className="w-4.5 h-4.5 text-violet-500" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-gray-800">Tìm liên hệ</h3>
              <p className="text-[10px] text-gray-400">Tìm qua số điện thoại hoặc mã QR</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {([
            { key: "phone" as const, label: "Số điện thoại", icon: <Phone className="w-3.5 h-3.5" /> },
            { key: "qr" as const, label: "Quét mã QR", icon: <ScanLine className="w-3.5 h-3.5" /> },
            { key: "myqr" as const, label: "Mã QR của tôi", icon: <QrCode className="w-3.5 h-3.5" /> },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-medium border-b-2 transition-all ${
                tab === t.key ? "border-violet-500 text-violet-600" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <div className="px-5 py-5">
          {/* Phone tab */}
          {tab === "phone" && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-gray-600 font-medium mb-1.5 block">Nhập số điện thoại</label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-50 transition-all">
                  <div className="flex items-center gap-1.5 pr-2 border-r border-gray-200">
                    <span className="text-[13px]">🇻🇳</span>
                    <span className="text-[12px] text-gray-500">+84</span>
                  </div>
                  <input ref={inputRef} value={phone} onChange={e => setPhone(e.target.value.replace(/[^\d\s\-().+]/g, ""))}
                    placeholder="090 123 4567" autoFocus
                    className="flex-1 text-[13px] text-gray-800 focus:outline-none bg-transparent placeholder-gray-300" />
                  {phone && <button onClick={() => setPhone("")} className="text-gray-300 hover:text-gray-500 transition-all"><X className="w-3.5 h-3.5" /></button>}
                </div>
              </div>

              {phoneValid && !found && (
                <div className="flex flex-col items-center py-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <User className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-[12px] text-gray-500">Không tìm thấy tài khoản với số điện thoại này</p>
                  <p className="text-[10px] text-gray-400 mt-1">Hãy kiểm tra lại số điện thoại</p>
                </div>
              )}

              {found && (
                <div className="bg-violet-50/60 rounded-xl p-4 flex items-center gap-3 border border-violet-100">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[14px] font-semibold shrink-0" style={{ backgroundColor: found.color }}>
                    {found.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-gray-800">{found.name}</p>
                    <p className="text-[11px] text-gray-500">{found.role} · {found.department}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${found.online ? "bg-green-400" : "bg-gray-300"}`} />
                      <span className="text-[10px] text-gray-400">{found.online ? "Đang hoạt động" : "Không hoạt động"}</span>
                    </div>
                  </div>
                  <button onClick={() => onStartChat(found)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-violet-500 text-white text-[12px] rounded-xl hover:bg-violet-600 transition-all shadow-sm">
                    <MessageSquare className="w-3.5 h-3.5" />Nhắn tin
                  </button>
                </div>
              )}

              {!phoneValid && (
                <p className="text-[11px] text-gray-400 text-center">Nhập số điện thoại để tìm kiếm người dùng</p>
              )}
            </div>
          )}

          {/* QR Scanner tab */}
          {tab === "qr" && (
            <div className="flex flex-col items-center gap-4">
              {!scanning && !scanDone && (
                <>
                  <div className="w-[200px] h-[200px] rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/30 flex flex-col items-center justify-center gap-3">
                    <ScanLine className="w-10 h-10 text-violet-300" />
                    <p className="text-[11px] text-gray-400 text-center px-4">Đưa mã QR của người dùng vào khung để quét</p>
                  </div>
                  <button onClick={handleScan}
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-500 text-white text-[12px] rounded-xl hover:bg-violet-600 transition-all shadow-sm">
                    <ScanLine className="w-3.5 h-3.5" />
                    Mở camera quét QR
                  </button>
                  <p className="text-[10px] text-gray-400">Bạn cũng có thể yêu cầu người kia chia sẻ mã QR của họ</p>
                </>
              )}

              {scanning && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-[200px] h-[200px] rounded-2xl bg-gray-900 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/20 to-transparent animate-bounce" style={{ animationDuration: "1.5s" }} />
                    <div className="w-32 h-32 border-2 border-violet-400 rounded-lg relative">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-violet-400 rounded-tl-sm" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-violet-400 rounded-tr-sm" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-violet-400 rounded-bl-sm" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-violet-400 rounded-br-sm" />
                      <div className="absolute inset-x-0 h-0.5 bg-violet-400 animate-bounce" style={{ animationDuration: "0.8s" }} />
                    </div>
                    <p className="absolute bottom-4 text-[11px] text-violet-300">Đang quét...</p>
                  </div>
                </div>
              )}

              {scanDone && (() => {
                const demo = companyDirectory[0];
                return (
                  <div className="flex flex-col items-center gap-3 w-full">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-[12px] text-green-600 font-medium">Quét thành công!</p>
                    <div className="bg-violet-50/60 rounded-xl p-4 flex items-center gap-3 border border-violet-100 w-full">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[14px] font-semibold shrink-0" style={{ backgroundColor: demo.color }}>
                        {demo.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-gray-800">{demo.name}</p>
                        <p className="text-[11px] text-gray-500">{demo.role}</p>
                      </div>
                      <button onClick={() => onStartChat(demo)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-violet-500 text-white text-[12px] rounded-xl hover:bg-violet-600 transition-all shadow-sm">
                        <MessageSquare className="w-3.5 h-3.5" />Nhắn tin
                      </button>
                    </div>
                    <button onClick={() => { setScanning(false); setScanDone(false); }} className="text-[11px] text-gray-400 hover:text-gray-600">Quét lại</button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* My QR tab */}
          {tab === "myqr" && (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2.5 w-full">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0" style={{ backgroundColor: MY_PROFILE.color }}>
                    NM
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800">{MY_PROFILE.name}</p>
                    <p className="text-[11px] text-gray-400">{MY_PROFILE.phone}</p>
                  </div>
                </div>
                <QRCodeSVG value={`vwork:${MY_PROFILE.id}:${MY_PROFILE.phone}`} size={180} />
                <p className="text-[10px] text-gray-400">ID: @{MY_PROFILE.id}</p>
              </div>
              <div className="flex gap-2 w-full">
                <button onClick={handleCopy}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] border transition-all ${copied ? "bg-green-50 text-green-600 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}>
                  {copied ? <><CheckCircle2 className="w-3.5 h-3.5" />Đã sao chép</> : <><Copy className="w-3.5 h-3.5" />Sao chép SĐT</>}
                </button>
                <button onClick={() => toast.success("Đã chia sẻ mã QR", { duration: 2000 })}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] bg-violet-500 text-white hover:bg-violet-600 transition-all border border-violet-400">
                  <Share2 className="w-3.5 h-3.5" />Chia sẻ QR
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}