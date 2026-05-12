import { useState, useRef, useEffect, useMemo } from "react";
import {
  X, Search, ChevronRight, Check, Plus, Copy, Trash2,
  Shield, Users, LinkIcon, Heart, Key, History, Eye, EyeOff,
  MessageSquare, Crown, MoreHorizontal, Ban, UserMinus, ArrowLeft,
  Clock, Edit3, Settings, Image, Smile, Star, ThumbsUp, Flame,
  Zap, AlertTriangle, Lock, Unlock, Send, Pin, Forward, Phone,
  Video, Hash, Globe, AtSign, FileText, LayoutList, Palette, Moon, Sun
} from "lucide-react";
import { toast } from "sonner";
import { teamMembers } from "./data";
import { copyToClipboard } from "./clipboard";

/* ============= Types ============= */
type SubModal =
  | null
  | "chatHistory"
  | "topics"
  | "appearance"
  | "reactions"
  | "permissions"
  | "inviteLinks"
  | "admins"
  | "members"
  | "recentActions"
  | "deleteConfirm";

interface GroupManageModalsProps {
  subModal: SubModal;
  onClose: () => void;
  onBack: () => void;
  spaceName: string;
  spaceColor: string;
  spaceMembers: number;
}

/* ============= Shared sub-modal wrapper ============= */
function SubModalWrapper({ title, onBack, children, noPadding }: { title: string; onBack: () => void; children: React.ReactNode; noPadding?: boolean }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30" onClick={onBack}>
      <div className="bg-white rounded-2xl shadow-2xl w-[380px] max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: "fadeInScale 0.15s ease" }}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100">
          <button onClick={onBack} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-all shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h3 className="text-[15px] text-gray-900 flex-1">{title}</h3>
        </div>
        <div className={`flex-1 overflow-y-auto min-h-0 ${noPadding ? "" : "p-4"}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ============= MAIN EXPORT ============= */
export function GroupManageModals({ subModal, onClose, onBack, spaceName, spaceColor, spaceMembers }: GroupManageModalsProps) {
  if (!subModal) return null;

  switch (subModal) {
    case "chatHistory":
      return <ChatHistoryModal onBack={onBack} />;
    case "topics":
      return <TopicsModal onBack={onBack} />;
    case "appearance":
      return <AppearanceModal onBack={onBack} spaceColor={spaceColor} />;
    case "reactions":
      return <ReactionsModal onBack={onBack} />;
    case "permissions":
      return <PermissionsModal onBack={onBack} />;
    case "inviteLinks":
      return <InviteLinksModal onBack={onBack} />;
    case "admins":
      return <AdminsModal onBack={onBack} spaceColor={spaceColor} />;
    case "members":
      return <MembersModal onBack={onBack} spaceColor={spaceColor} spaceMembers={spaceMembers} />;
    case "recentActions":
      return <RecentActionsModal onBack={onBack} spaceColor={spaceColor} />;
    case "deleteConfirm":
      return <DeleteConfirmModal onBack={onBack} onClose={onClose} spaceName={spaceName} />;
    default:
      return null;
  }
}

/* ==================== 1. Chat History ==================== */
function ChatHistoryModal({ onBack }: { onBack: () => void }) {
  const [visible, setVisible] = useState(true);
  return (
    <SubModalWrapper title="Lịch sử chat" onBack={onBack}>
      <p className="text-[12px] text-gray-500 mb-4">Chọn liệu thành viên mới có thể xem lịch sử tin nhắn trước khi tham gia nhóm hay không.</p>
      <div className="space-y-2">
        <button onClick={() => { setVisible(true); toast.success("Đã bật hiển thị lịch sử chat", { duration: 2000 }); }} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${visible ? "border-cyan-300 bg-cyan-50" : "border-gray-200 hover:bg-gray-50"}`}>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${visible ? "bg-cyan-500 text-white" : "bg-gray-100 text-gray-400"}`}><Eye className="w-4 h-4" /></div>
          <div className="flex-1">
            <p className="text-[13px] text-gray-800">Hiển thị</p>
            <p className="text-[11px] text-gray-500">Thành viên mới xem được toàn bộ lịch sử</p>
          </div>
          {visible && <Check className="w-4 h-4 text-cyan-500" />}
        </button>
        <button onClick={() => { setVisible(false); toast.success("Đã ẩn lịch sử chat", { duration: 2000 }); }} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${!visible ? "border-cyan-300 bg-cyan-50" : "border-gray-200 hover:bg-gray-50"}`}>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${!visible ? "bg-cyan-500 text-white" : "bg-gray-100 text-gray-400"}`}><EyeOff className="w-4 h-4" /></div>
          <div className="flex-1">
            <p className="text-[13px] text-gray-800">Ẩn</p>
            <p className="text-[11px] text-gray-500">Chỉ xem tin nhắn sau khi tham gia</p>
          </div>
          {!visible && <Check className="w-4 h-4 text-cyan-500" />}
        </button>
      </div>
    </SubModalWrapper>
  );
}

/* ==================== 2. Topics ==================== */
function TopicsModal({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<"tab" | "list">("tab");
  const topics = [
    { id: "1", name: "General", icon: "#", messages: 128, pinned: true },
    { id: "2", name: "Thiết kế UI", icon: "🎨", messages: 56, pinned: false },
    { id: "3", name: "Backend API", icon: "⚙️", messages: 89, pinned: true },
    { id: "4", name: "Bug Reports", icon: "🐛", messages: 34, pinned: false },
    { id: "5", name: "Releases", icon: "🚀", messages: 12, pinned: false },
  ];
  return (
    <SubModalWrapper title="Chủ đề" onBack={onBack} noPadding>
      <div className="p-4 border-b border-gray-100">
        <p className="text-[12px] text-gray-500 mb-3">Chọn cách hiển thị chủ đề trong nhóm.</p>
        <div className="flex gap-2">
          {(["tab", "list"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); toast.success(`Chế độ: ${m === "tab" ? "Tab" : "Danh sách"}`, { duration: 1500 }); }} className={`flex-1 py-2 rounded-xl text-[13px] transition-all ${mode === m ? "bg-cyan-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {m === "tab" ? "Tab" : "Danh sách"}
            </button>
          ))}
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider">{topics.length} chủ đề</span>
          <button onClick={() => toast.success("Tạo chủ đề mới", { duration: 1500 })} className="text-[12px] text-cyan-600 hover:text-cyan-700 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Thêm</button>
        </div>
        {topics.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group">
            <span className="text-[16px] w-6 text-center">{t.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-gray-800 truncate">{t.name}</p>
              <p className="text-[11px] text-gray-400">{t.messages} tin nhắn</p>
            </div>
            {t.pinned && <Pin className="w-3.5 h-3.5 text-cyan-400" />}
            <button className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-all"><MoreHorizontal className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </SubModalWrapper>
  );
}

/* ==================== 3. Appearance ==================== */
function AppearanceModal({ onBack, spaceColor }: { onBack: () => void; spaceColor: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const colors = ["#0891b2", "#7c3aed", "#059669", "#d97706", "#db2777", "#2563eb", "#dc2626", "#6366f1", "#0d9488", "#ea580c"];
  const [selectedColor, setSelectedColor] = useState(spaceColor);
  const wallpapers = ["Mặc định", "Gradient xanh", "Gradient tím", "Tối giản", "Họa tiết"];
  const [selectedWall, setSelectedWall] = useState(0);
  return (
    <SubModalWrapper title="Giao diện" onBack={onBack}>
      {/* Theme */}
      <div className="mb-5">
        <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">Chế độ</p>
        <div className="flex gap-2">
          <button onClick={() => setTheme("light")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] transition-all ${theme === "light" ? "bg-cyan-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}><Sun className="w-4 h-4" /> Sáng</button>
          <button onClick={() => setTheme("dark")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] transition-all ${theme === "dark" ? "bg-cyan-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}><Moon className="w-4 h-4" /> Tối</button>
        </div>
      </div>
      {/* Accent color */}
      <div className="mb-5">
        <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">Màu chủ đạo</p>
        <div className="flex flex-wrap gap-2">
          {colors.map(c => (
            <button key={c} onClick={() => { setSelectedColor(c); toast.success("Đã đổi màu chủ đạo", { duration: 1500 }); }} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${selectedColor === c ? "ring-2 ring-offset-2 ring-cyan-400 scale-110" : "hover:scale-105"}`} style={{ backgroundColor: c }}>
              {selectedColor === c && <Check className="w-4 h-4 text-white" />}
            </button>
          ))}
        </div>
      </div>
      {/* Wallpaper */}
      <div>
        <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">Hình nền chat</p>
        <div className="space-y-1.5">
          {wallpapers.map((w, i) => (
            <button key={i} onClick={() => { setSelectedWall(i); toast.success(`Hình nền: ${w}`, { duration: 1500 }); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${selectedWall === i ? "bg-cyan-50 border border-cyan-200" : "hover:bg-gray-50 border border-transparent"}`}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200" />
              <span className="text-[13px] text-gray-700 flex-1">{w}</span>
              {selectedWall === i && <Check className="w-4 h-4 text-cyan-500" />}
            </button>
          ))}
        </div>
      </div>
    </SubModalWrapper>
  );
}

/* ==================== 4. Reactions ==================== */
function ReactionsModal({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<"all" | "limited" | "none">("all");
  const quickReactions = ["👍", "❤️", "🔥", "🎉", "😂", "😮", "😢", "🙏"];
  const [enabledReactions, setEnabledReactions] = useState<Set<string>>(new Set(quickReactions));
  const toggle = (r: string) => setEnabledReactions(prev => { const n = new Set(prev); if (n.has(r)) n.delete(r); else n.add(r); return n; });
  return (
    <SubModalWrapper title="Biểu cảm" onBack={onBack}>
      <p className="text-[12px] text-gray-500 mb-4">Quản lý biểu cảm có thể sử dụng trong nhóm.</p>
      <div className="space-y-2 mb-5">
        {([["all", "Tất cả", "Cho phép tất cả biểu cảm"], ["limited", "Giới hạn", "Chỉ biểu cảm được chọn"], ["none", "Tắt", "Không cho phép biểu cảm"]] as const).map(([key, label, desc]) => (
          <button key={key} onClick={() => { setMode(key); toast.success(`Biểu cảm: ${label}`, { duration: 1500 }); }} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${mode === key ? "border-cyan-300 bg-cyan-50" : "border-gray-200 hover:bg-gray-50"}`}>
            <div className="flex-1">
              <p className="text-[13px] text-gray-800">{label}</p>
              <p className="text-[11px] text-gray-500">{desc}</p>
            </div>
            {mode === key && <Check className="w-4 h-4 text-cyan-500" />}
          </button>
        ))}
      </div>
      {mode === "limited" && (
        <div>
          <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">Biểu cảm nhanh</p>
          <div className="flex flex-wrap gap-2">
            {quickReactions.map(r => (
              <button key={r} onClick={() => toggle(r)} className={`w-11 h-11 rounded-xl text-[20px] flex items-center justify-center transition-all ${enabledReactions.has(r) ? "bg-cyan-50 border-2 border-cyan-300 scale-105" : "bg-gray-50 border-2 border-transparent hover:border-gray-200"}`}>{r}</button>
            ))}
          </div>
        </div>
      )}
    </SubModalWrapper>
  );
}

/* ==================== 5. Permissions ==================== */
function PermissionsModal({ onBack }: { onBack: () => void }) {
  const allPerms = [
    { id: "send_msg", label: "Gửi tin nhắn", desc: "Gửi tin nhắn văn bản và emoji", on: true },
    { id: "send_media", label: "Gửi media", desc: "Ảnh, video, file, voice", on: true },
    { id: "send_sticker", label: "Gửi sticker & GIF", desc: "Sticker, GIF hoạt hình", on: true },
    { id: "send_poll", label: "Tạo bình chọn", desc: "Tạo khảo sát trong nhóm", on: true },
    { id: "embed_link", label: "Nhúng liên kết", desc: "Xem trước liên kết", on: true },
    { id: "add_member", label: "Thêm thành viên", desc: "Mời người khác vào nhóm", on: true },
    { id: "pin_msg", label: "Ghim tin nhắn", desc: "Ghim tin nhắn trong nhóm", on: false },
    { id: "change_info", label: "Thay đổi thông tin nhóm", desc: "Tên, ảnh, mô tả", on: true },
    { id: "manage_topics", label: "Quản lý chủ đề", desc: "Tạo, sửa, xóa chủ đề", on: true },
    { id: "manage_video", label: "Quản lý cuộc gọi video", desc: "Bắt đầu và quản lý cuộc gọi", on: true },
    { id: "delete_msg", label: "Xóa tin nhắn", desc: "Xóa tin nhắn của người khác", on: true },
    { id: "ban_user", label: "Cấm thành viên", desc: "Xóa và cấm thành viên", on: true },
    { id: "invite_link", label: "Tạo liên kết mời", desc: "Tạo liên kết mời mới", on: true },
    { id: "manage_chat", label: "Quản lý chat", desc: "Chế độ chậm, anti-spam", on: true },
    { id: "anonymous", label: "Đăng ẩn danh", desc: "Gửi tin nhắn với tên nhóm", on: true },
  ];
  const [perms, setPerms] = useState(allPerms);
  const enabledCount = perms.filter(p => p.on).length;
  const togglePerm = (id: string) => {
    setPerms(prev => prev.map(p => p.id === id ? { ...p, on: !p.on } : p));
    toast.success("Đã cập nhật quyền hạn", { duration: 1500 });
  };
  return (
    <SubModalWrapper title={`Quyền hạn (${enabledCount}/${perms.length})`} onBack={onBack} noPadding>
      <div className="p-3 border-b border-gray-100">
        <p className="text-[12px] text-gray-500">Thiết lập quyền mặc định cho tất cả thành viên. Quản trị viên luôn có toàn quyền.</p>
      </div>
      <div className="divide-y divide-gray-50">
        {perms.map(p => (
          <button key={p.id} onClick={() => togglePerm(p.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-all text-left">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-gray-800">{p.label}</p>
              <p className="text-[11px] text-gray-400">{p.desc}</p>
            </div>
            <div className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-all ${p.on ? "bg-cyan-500" : "bg-gray-300"}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-all ${p.on ? "translate-x-4" : "translate-x-0"}`} />
            </div>
          </button>
        ))}
      </div>
    </SubModalWrapper>
  );
}

/* ==================== 6. Invite Links ==================== */
function InviteLinksModal({ onBack }: { onBack: () => void }) {
  const links = [
    { id: "1", url: "https://vwork.app/+zepWErfVhpkxZjg1", name: "Liên kết chính", created: "15/03/2026", uses: 12, limit: null as number | null, expires: null as string | null },
  ];
  const [linkList, setLinkList] = useState(links);
  return (
    <SubModalWrapper title="Liên kết mời" onBack={onBack}>
      <div className="space-y-3 mb-4">
        {linkList.map(link => (
          <div key={link.id} className="border border-gray-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] text-gray-800">{link.name}</span>
              <button onClick={() => { setLinkList(prev => prev.filter(l => l.id !== link.id)); toast.error("Đã thu hồi liên kết", { duration: 2000 }); }} className="text-[11px] text-red-500 hover:text-red-600">Thu hồi</button>
            </div>
            <p className="text-[12px] text-cyan-600 mb-2 truncate">{link.url}</p>
            <div className="flex items-center gap-3 text-[11px] text-gray-400">
              <span>Tạo: {link.created}</span>
              <span>Đã dùng: {link.uses} lần</span>
              <span>{link.limit ? `Giới hạn: ${link.limit}` : "Không giới hạn"}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button onClick={() => { copyToClipboard(link.url).catch(() => {}); toast.success("Đã sao chép", { duration: 1500 }); }} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-[12px] hover:bg-gray-200 transition-all"><Copy className="w-3.5 h-3.5" /> Sao chép</button>
              <button onClick={() => toast.success("Đã chia sẻ liên kết", { duration: 1500 })} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-[12px] hover:bg-gray-200 transition-all"><Forward className="w-3.5 h-3.5" /> Chia sẻ</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => { setLinkList(prev => [...prev, { id: Date.now().toString(), url: `https://vwork.app/+${Math.random().toString(36).slice(2, 12)}`, name: `Liên kết ${linkList.length + 1}`, created: "18/03/2026", uses: 0, limit: null, expires: null }]); toast.success("Đã tạo liên kết mời mới", { duration: 2000 }); }} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-[13px] transition-all shadow-sm">
        <Plus className="w-4 h-4" /> Tạo liên kết mời mới
      </button>
    </SubModalWrapper>
  );
}

/* ==================== 7. Admins ==================== */
function AdminsModal({ onBack, spaceColor }: { onBack: () => void; spaceColor: string }) {
  const admins = [
    { ...teamMembers[0], role: "Người tạo", customTitle: "Project Lead", permissions: "Toàn quyền" },
  ];
  return (
    <SubModalWrapper title="Quản trị viên" onBack={onBack} noPadding>
      <div className="p-3 border-b border-gray-100">
        <p className="text-[12px] text-gray-500">Quản trị viên có thể quản lý nhóm, thành viên và nội dung.</p>
      </div>
      <div>
        {admins.map(a => (
          <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-all cursor-pointer">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[14px] shrink-0" style={{ backgroundColor: a.color }}>{a.name.charAt(0)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-gray-800">{a.name}</span>
                <Crown className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-[11px] text-gray-400">{a.customTitle} · {a.permissions}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-100">
        <button onClick={() => toast.success("Chọn thành viên để thăng cấp", { duration: 2000 })} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-[13px] transition-all shadow-sm">
          <Plus className="w-4 h-4" /> Thêm quản trị viên
        </button>
      </div>
    </SubModalWrapper>
  );
}

/* ==================== 8. Members ==================== */
function MembersModal({ onBack, spaceColor, spaceMembers }: { onBack: () => void; spaceColor: string; spaceMembers: number }) {
  const [search, setSearch] = useState("");
  const members = teamMembers.slice(0, spaceMembers || 5).map((m, i) => ({
    ...m,
    isAdmin: i === 0,
    isOwner: i === 0,
    lastSeen: i === 0 ? "đang hoạt động" : i === 1 ? "vừa xong" : `${i * 15} phút trước`,
  }));
  const filtered = search ? members.filter(m => m.name.toLowerCase().includes(search.toLowerCase())) : members;
  const [contextMenu, setContextMenu] = useState<string | null>(null);

  return (
    <SubModalWrapper title={`Thành viên (${members.length})`} onBack={onBack} noPadding>
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm thành viên..." className="flex-1 text-[12px] bg-transparent outline-none text-gray-700 placeholder:text-gray-400" />
        </div>
      </div>
      <div>
        {filtered.map(m => (
          <div key={m.id} className="relative">
            <div onClick={() => setContextMenu(contextMenu === m.id ? null : m.id)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-all cursor-pointer">
              <div className="relative">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[14px] shrink-0" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                {m.lastSeen === "đang hoạt động" && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-gray-800">{m.name}</span>
                  {m.isOwner && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                  {m.isAdmin && !m.isOwner && <Shield className="w-3.5 h-3.5 text-cyan-500" />}
                </div>
                <p className="text-[11px] text-gray-400">{m.lastSeen}</p>
              </div>
              <span className="text-[11px] text-gray-400">{m.role}</span>
            </div>
            {contextMenu === m.id && !m.isOwner && (
              <div className="absolute right-4 top-12 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1.5 w-[180px]">
                <button onClick={() => { toast.success(`Đã thăng ${m.name} lên admin`, { duration: 2000 }); setContextMenu(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50"><Shield className="w-3.5 h-3.5 text-gray-400" /> Thăng quản trị</button>
                <button onClick={() => { toast.success(`Đã nhắn tin cho ${m.name}`, { duration: 2000 }); setContextMenu(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50"><MessageSquare className="w-3.5 h-3.5 text-gray-400" /> Nhắn tin</button>
                <div className="h-px bg-gray-100 mx-2 my-1" />
                <button onClick={() => { toast.error(`Đã xóa ${m.name} khỏi nhóm`, { duration: 2000 }); setContextMenu(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-red-500 hover:bg-red-50"><UserMinus className="w-3.5 h-3.5" /> Xóa khỏi nhóm</button>
                <button onClick={() => { toast.error(`Đã cấm ${m.name}`, { duration: 2000 }); setContextMenu(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-red-500 hover:bg-red-50"><Ban className="w-3.5 h-3.5" /> Cấm</button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-[13px] text-gray-400">Không tìm thấy thành viên</div>
        )}
      </div>
    </SubModalWrapper>
  );
}

/* ==================== 9. Recent Actions ==================== */
function RecentActionsModal({ onBack, spaceColor }: { onBack: () => void; spaceColor: string }) {
  const actions = [
    { id: 1, user: "Nguyễn Minh", action: "đã thay đổi ảnh nhóm", time: "2 phút trước", icon: <Image className="w-3.5 h-3.5 text-violet-500" /> },
    { id: 2, user: "Nguyễn Minh", action: "đã thêm Hoàng Đức vào nhóm", time: "15 phút trước", icon: <Users className="w-3.5 h-3.5 text-green-500" /> },
    { id: 3, user: "Trần Hương", action: "đã ghim một tin nhắn", time: "1 giờ trước", icon: <Pin className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 4, user: "Nguyễn Minh", action: "đã cập nhật quyền hạn", time: "2 giờ trước", icon: <Key className="w-3.5 h-3.5 text-cyan-500" /> },
    { id: 5, user: "Lê Phúc", action: "đã tham gia nhóm qua liên kết", time: "3 giờ trước", icon: <LinkIcon className="w-3.5 h-3.5 text-blue-500" /> },
    { id: 6, user: "Nguyễn Minh", action: "đã đổi tên nhóm", time: "1 ngày trước", icon: <Edit3 className="w-3.5 h-3.5 text-orange-500" /> },
    { id: 7, user: "Phạm Lan", action: "đã tạo chủ đề 'Bug Reports'", time: "2 ngày trước", icon: <Hash className="w-3.5 h-3.5 text-indigo-500" /> },
    { id: 8, user: "Nguyễn Minh", action: "đã tạo nhóm", time: "15/02/2026", icon: <Star className="w-3.5 h-3.5 text-yellow-500" /> },
  ];
  return (
    <SubModalWrapper title="Hành động gần đây" onBack={onBack} noPadding>
      <div className="divide-y divide-gray-50">
        {actions.map(a => (
          <div key={a.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-all">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">{a.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-gray-800"><span className="text-gray-900">{a.user}</span> {a.action}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </SubModalWrapper>
  );
}

/* ==================== 10. Delete Confirm ==================== */
function DeleteConfirmModal({ onBack, onClose, spaceName }: { onBack: () => void; onClose: () => void; spaceName: string }) {
  const [confirmText, setConfirmText] = useState("");
  const canDelete = confirmText === spaceName;
  return (
    <SubModalWrapper title="Xóa nhóm" onBack={onBack}>
      <div className="flex flex-col items-center mb-4">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-3">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <p className="text-[14px] text-gray-900 text-center mb-1">Xác nhận xóa nhóm?</p>
        <p className="text-[12px] text-gray-500 text-center">Hành động này không thể hoàn tác. Tất cả tin nhắn, tệp và dữ liệu sẽ bị xóa vĩnh viễn.</p>
      </div>
      <div className="mb-4">
        <p className="text-[12px] text-gray-600 mb-2">Nhập <span className="text-red-500 select-all">{spaceName}</span> để xác nhận:</p>
        <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder={spaceName} className="w-full text-[13px] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-50 placeholder:text-gray-300 transition-all" />
      </div>
      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 py-2.5 rounded-xl text-[13px] text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all">Hủy</button>
        <button disabled={!canDelete} onClick={() => { toast.error(`Đã xóa nhóm "${spaceName}"`, { duration: 3000 }); onClose(); }} className={`flex-1 py-2.5 rounded-xl text-[13px] text-white transition-all ${canDelete ? "bg-red-500 hover:bg-red-600" : "bg-red-300 cursor-not-allowed"}`}>Xóa vĩnh viễn</button>
      </div>
    </SubModalWrapper>
  );
}

export type { SubModal };