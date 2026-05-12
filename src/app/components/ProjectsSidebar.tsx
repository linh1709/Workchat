import { useState, useRef } from "react";
import {
  Search, Plus, ChevronLeft, Users, Star,
  CheckCircle2, Clock, X, FolderKanban,
  ArrowUpDown, ArrowDownAZ, ArrowUpAZ, Percent, Activity,
  Palette, Type, FileText, UserPlus, Sparkles, Check,
  Zap, GitBranch, Kanban, BarChart3, BookOpen, AlertCircle,
  Globe, Lock, Eye,
  ChevronRight,
  FolderOpen, Link2, Archive, Settings,
  User, Hash,
} from "lucide-react";
import { toast } from "sonner";
import { teamMembers, spaces, type Space } from "./data";

interface ProjectsSidebarProps {
  selectedSpace: string | null;
  onSpaceSelect: (id: string) => void;
  onClose: () => void;
  activeSection?: "personal" | "channel" | "project";
  onSectionChange?: (section: "personal" | "channel" | "project") => void;
}

const projectSpaces = spaces.filter(s => s.category === "project");

const PROJECT_COLORS = [
  "#7c3aed", "#6366f1", "#0891b2", "#059669", "#d97706",
  "#db2777", "#dc2626", "#0d9488", "#4f46e5", "#2563eb",
  "#c026d3", "#ea580c", "#16a34a", "#0284c7", "#7c2d12",
];

const PROJECT_ICONS = [
  "🚀", "💼", "🎯", "📱", "🌐", "🛠", "📊", "🎨",
  "📦", "🔬", "📈", "🏗", "💡", "🎮", "🤖", "📚",
  "🔐", "☁️", "🛒", "📝",
];

type TemplateKey = "blank" | "agile" | "waterfall" | "kanban" | "marketing" | "product";

interface ProjectTemplate {
  key: TemplateKey;
  name: string;
  description: string;
  color: string;
  emoji: string;
  icon: React.ReactNode;
  workflow: { label: string; color: string }[];
  topics: { name: string; emoji: string; description: string }[];
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    key: "blank",
    name: "Trống",
    description: "Bắt đầu từ đầu, tùy chỉnh hoàn toàn",
    color: "#6b7280",
    emoji: "📝",
    icon: <FileText className="w-4 h-4" />,
    workflow: [
      { label: "To Do", color: "#94a3b8" },
      { label: "In Progress", color: "#0891b2" },
      { label: "Done", color: "#059669" },
    ],
    topics: [
      { name: "General", emoji: "💬", description: "Thảo luận chung" },
      { name: "Tasks", emoji: "✅", description: "Quản lý công việc" },
    ],
  },
  {
    key: "agile",
    name: "Agile / Scrum",
    description: "Sprint, backlog, retrospective",
    color: "#0891b2",
    emoji: "⚡",
    icon: <Zap className="w-4 h-4" />,
    workflow: [
      { label: "Backlog", color: "#94a3b8" },
      { label: "Sprint", color: "#0891b2" },
      { label: "In Progress", color: "#d97706" },
      { label: "Review", color: "#7c3aed" },
      { label: "Done", color: "#059669" },
    ],
    topics: [
      { name: "General", emoji: "💬", description: "Thảo luận chung" },
      { name: "Sprint Planning", emoji: "🎯", description: "Lên kế hoạch sprint" },
      { name: "Daily Standup", emoji: "☀️", description: "Họp standup hàng ngày" },
      { name: "Backlog", emoji: "📋", description: "Product backlog" },
      { name: "Retrospective", emoji: "🔄", description: "Nhìn lại sprint" },
      { name: "Bugs", emoji: "🐛", description: "Theo dõi lỗi" },
    ],
  },
  {
    key: "waterfall",
    name: "Waterfall",
    description: "Quy trình tuần tự theo giai đoạn",
    color: "#7c3aed",
    emoji: "🌊",
    icon: <GitBranch className="w-4 h-4" />,
    workflow: [
      { label: "Yêu cầu", color: "#6366f1" },
      { label: "Thiết kế", color: "#7c3aed" },
      { label: "Phát triển", color: "#0891b2" },
      { label: "Kiểm thử", color: "#d97706" },
      { label: "Triển khai", color: "#059669" },
    ],
    topics: [
      { name: "General", emoji: "💬", description: "Thảo luận chung" },
      { name: "Yêu cầu", emoji: "📝", description: "Thu thập & phân tích yêu cầu" },
      { name: "Thiết kế", emoji: "🎨", description: "Thiết kế hệ thống & UI/UX" },
      { name: "Phát triển", emoji: "💻", description: "Triển khai code" },
      { name: "Kiểm thử", emoji: "🧪", description: "Testing & QA" },
      { name: "Triển khai", emoji: "🚀", description: "Deploy & bàn giao" },
    ],
  },
  {
    key: "kanban",
    name: "Kanban",
    description: "Luồng công việc liên tục, WIP limits",
    color: "#059669",
    emoji: "📋",
    icon: <Kanban className="w-4 h-4" />,
    workflow: [
      { label: "Inbox", color: "#94a3b8" },
      { label: "In Progress", color: "#0891b2" },
      { label: "Review", color: "#d97706" },
      { label: "Done", color: "#059669" },
    ],
    topics: [
      { name: "General", emoji: "💬", description: "Thảo luận chung" },
      { name: "Inbox", emoji: "📥", description: "Công việc mới" },
      { name: "In Progress", emoji: "🔄", description: "Đang thực hiện" },
      { name: "Review", emoji: "👀", description: "Đang review" },
      { name: "Done", emoji: "✅", description: "Hoàn thành" },
    ],
  },
  {
    key: "marketing",
    name: "Marketing",
    description: "Chiến dịch, content, analytics",
    color: "#d97706",
    emoji: "📣",
    icon: <BarChart3 className="w-4 h-4" />,
    workflow: [
      { label: "Ý tưởng", color: "#94a3b8" },
      { label: "Lên kế hoạch", color: "#d97706" },
      { label: "Thực thi", color: "#0891b2" },
      { label: "Đánh giá", color: "#059669" },
    ],
    topics: [
      { name: "General", emoji: "💬", description: "Thảo luận chung" },
      { name: "Campaigns", emoji: "📣", description: "Quản lý chiến dịch" },
      { name: "Content", emoji: "✍️", description: "Kế hoạch nội dung" },
      { name: "Social Media", emoji: "📱", description: "Mạng xã hội" },
      { name: "Analytics", emoji: "📊", description: "Phân tích & báo cáo" },
    ],
  },
  {
    key: "product",
    name: "Product Launch",
    description: "Ra mắt sản phẩm từ A đến Z",
    color: "#db2777",
    emoji: "🚀",
    icon: <BookOpen className="w-4 h-4" />,
    workflow: [
      { label: "Research", color: "#6366f1" },
      { label: "Design", color: "#db2777" },
      { label: "Build", color: "#0891b2" },
      { label: "Launch", color: "#d97706" },
      { label: "Growth", color: "#059669" },
    ],
    topics: [
      { name: "General", emoji: "💬", description: "Thảo luận chung" },
      { name: "Research", emoji: "🔬", description: "Nghiên cứu thị trường" },
      { name: "Design", emoji: "🎨", description: "Thiết kế sản phẩm" },
      { name: "Development", emoji: "⚙️", description: "Phát triển" },
      { name: "Launch Plan", emoji: "🚀", description: "Kế hoạch ra mắt" },
      { name: "Feedback", emoji: "💬", description: "Phản hồi khách hàng" },
    ],
  },
];

export const projectMeta: Record<string, { progress: number; tasksTotal: number; tasksDone: number; status: "on_track" | "at_risk" | "behind"; lastActivity: string }> = {
  p1: { progress: 40, tasksTotal: 12, tasksDone: 5, status: "on_track", lastActivity: "2h" },
  p2: { progress: 25, tasksTotal: 18, tasksDone: 4, status: "at_risk", lastActivity: "5h" },
  p3: { progress: 65, tasksTotal: 8, tasksDone: 5, status: "on_track", lastActivity: "1h" },
  p4: { progress: 10, tasksTotal: 6, tasksDone: 1, status: "behind", lastActivity: "1d" },
  p5: { progress: 80, tasksTotal: 10, tasksDone: 8, status: "on_track", lastActivity: "3h" },
  p6: { progress: 55, tasksTotal: 14, tasksDone: 7, status: "on_track", lastActivity: "30m" },
};

// ─── MenuItem helper ───────────────────────────────────────────────────────────
function MenuItem({ icon, label, onClick, labelClass = "" }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  labelClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-[6px] text-[12px] hover:bg-gray-50 transition-all text-left ${labelClass || "text-gray-700"}`}
    >
      <span className="text-gray-400">{icon}</span>
      {label}
    </button>
  );
}

// ─── ProjectContextMenu ────────────────────────────────────────────────────────
function ProjectContextMenu({ project, pos, onClose, onToggleFav, isFav, onSettings, onArchive, onSelect }: {
  project: Space;
  pos: { x: number; y: number };
  onClose: () => void;
  onToggleFav: () => void;
  isFav: boolean;
  onSettings: () => void;
  onArchive: () => void;
  onSelect: () => void;
}) {
  const isMobile = window.innerWidth < 768;

  const menuItems = (
    <>
      <button onClick={() => { onSelect(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 md:px-3 md:py-[6px] text-[14px] md:text-[12px] text-gray-700 active:bg-gray-50 hover:bg-gray-50 transition-all text-left">
        <FolderOpen className="w-4 h-4 md:w-3.5 md:h-3.5 text-gray-400" /> Mở dự án
      </button>
      <button onClick={() => { toast.success("Đã sao chép link"); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 md:px-3 md:py-[6px] text-[14px] md:text-[12px] text-gray-700 active:bg-gray-50 hover:bg-gray-50 transition-all text-left">
        <Link2 className="w-4 h-4 md:w-3.5 md:h-3.5 text-gray-400" /> Sao chép link
      </button>
      <div className="h-px bg-gray-100 my-1" />
      <button onClick={() => { onToggleFav(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 md:px-3 md:py-[6px] text-[14px] md:text-[12px] text-gray-700 active:bg-gray-50 hover:bg-gray-50 transition-all text-left">
        <Star className="w-4 h-4 md:w-3.5 md:h-3.5 text-gray-400" /> {isFav ? "Bỏ yêu thích" : "Thêm yêu thích"}
      </button>
      <button onClick={() => { onSettings(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 md:px-3 md:py-[6px] text-[14px] md:text-[12px] text-gray-700 active:bg-gray-50 hover:bg-gray-50 transition-all text-left">
        <Settings className="w-4 h-4 md:w-3.5 md:h-3.5 text-gray-400" /> Cài đặt dự án
      </button>
      <div className="h-px bg-gray-100 my-1" />
      <button onClick={() => { onArchive(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 md:px-3 md:py-[6px] text-[14px] md:text-[12px] text-red-500 active:bg-red-50 hover:bg-red-50 transition-all text-left">
        <Archive className="w-4 h-4 md:w-3.5 md:h-3.5 text-red-400" /> Lưu trữ dự án
      </button>
    </>
  );

  if (isMobile) return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="w-full bg-white rounded-t-2xl shadow-2xl pb-6 overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: "slideUp 0.2s ease" }}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-9 h-1 rounded-full bg-gray-200" /></div>
        <div className="px-2 py-2 border-b border-gray-100">
          <p className="text-[13px] font-semibold text-gray-800 px-2">{project.icon} {project.name}</p>
        </div>
        <div className="py-1">{menuItems}</div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-[200px]" style={{ left: pos.x, top: pos.y }}>
        {menuItems}
      </div>
    </>
  );
}

// ─── ProjectSettingsModal ──────────────────────────────────────────────────────
function ProjectSettingsModal({ project, onClose, onSave }: {
  project: Space;
  onClose: () => void;
  onSave: (updates: Partial<Space>) => void;
}) {
  const [tab, setTab] = useState<"overview" | "members" | "advanced">("overview");
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [color, setColor] = useState(project.color);
  const [icon, setIcon] = useState(project.icon);
  const [status, setStatus] = useState<"on_track" | "at_risk" | "behind">(
    (projectMeta[project.id]?.status) || "on_track"
  );
  const [memberSearch, setMemberSearch] = useState("");
  // Advanced fields
  const [client, setClient] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [repoUrl, setRepoUrl] = useState("");

  const filteredMembers = teamMembers.filter(m =>
    !memberSearch || m.name.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const roleLabel: Record<string, string> = {
    "Project Manager": "PM",
    "Designer": "Designer",
    "Developer": "Dev",
    "QA Engineer": "QA",
    "Marketing": "Mkt",
  };

  const roleColor: Record<string, string> = {
    "Project Manager": "bg-cyan-100 text-cyan-700",
    "Designer": "bg-violet-100 text-violet-700",
    "Developer": "bg-emerald-100 text-emerald-700",
    "QA Engineer": "bg-amber-100 text-amber-700",
    "Marketing": "bg-pink-100 text-pink-700",
  };

  const statusOptions = [
    { value: "on_track" as const, label: "On Track", bg: "#f0fdf4", color: "#059669" },
    { value: "at_risk" as const, label: "At Risk", bg: "#fffbeb", color: "#d97706" },
    { value: "behind" as const, label: "Behind", bg: "#fef2f2", color: "#dc2626" },
  ];

  const SETTING_COLORS = [
    "#7c3aed", "#6366f1", "#0891b2", "#059669",
    "#d97706", "#db2777", "#dc2626", "#0d9488",
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl md:rounded-2xl shadow-2xl shadow-black/15 w-full md:w-[520px] max-h-[90vh] md:max-h-[85vh] overflow-hidden animate-in fade-in slide-in-from-bottom md:zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-base text-white shadow-sm"
              style={{ backgroundColor: color }}
            >
              {icon}
            </div>
            <div>
              <h3 className="text-[14px] text-gray-900">Cài đặt dự án</h3>
              <p className="text-[11px] text-gray-500">{project.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0">
          {([
            { key: "overview", label: "Tổng quan" },
            { key: "members", label: "Thành viên" },
            { key: "advanced", label: "Nâng cao" },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 text-[12px] transition-all border-b-2 ${
                tab === t.key
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {tab === "overview" && (
            <>
              {/* Name */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] text-gray-700 font-medium mb-1.5">
                  <Type className="w-3 h-3" /> Tên dự án
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={50}
                  className="w-full px-3 py-2.5 text-[12px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 text-gray-800 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] text-gray-700 font-medium mb-1.5">
                  <FileText className="w-3 h-3" /> Mô tả
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Mô tả ngắn gọn về dự án..."
                  className="w-full px-3 py-2.5 text-[12px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 text-gray-800 placeholder-gray-400 transition-all resize-none"
                />
              </div>

              {/* Color swatches */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] text-gray-700 font-medium mb-2">
                  <Palette className="w-3 h-3" /> Màu dự án
                </label>
                <div className="flex gap-2 flex-wrap">
                  {SETTING_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-lg transition-all hover:scale-110 ${color === c ? "ring-2 ring-offset-2 ring-cyan-400 scale-110" : "hover:shadow-md"}`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-3.5 h-3.5 text-white mx-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon picker */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] text-gray-700 font-medium mb-2">
                  <span className="text-[10px]">🎯</span> Biểu tượng
                </label>
                <div className="grid grid-cols-10 gap-1 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  {PROJECT_ICONS.map(ic => (
                    <button
                      key={ic}
                      onClick={() => setIcon(ic)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm hover:bg-white hover:shadow-sm transition-all ${icon === ic ? "bg-white shadow-sm ring-2 ring-cyan-300" : ""}`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] text-gray-700 font-medium mb-2">
                  <Activity className="w-3 h-3" /> Trạng thái sức khỏe
                </label>
                <div className="flex gap-2">
                  {statusOptions.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setStatus(s.value)}
                      className={`flex-1 py-2 rounded-xl text-[11px] font-medium transition-all border-2 ${
                        status === s.value ? "border-current shadow-sm" : "border-transparent"
                      }`}
                      style={{
                        backgroundColor: s.bg,
                        color: s.color,
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "members" && (
            <>
              {/* Search */}
              <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                <Search className="w-3 h-3 text-gray-400 shrink-0" />
                <input
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  placeholder="Tìm thành viên..."
                  className="flex-1 text-[12px] bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                />
              </div>

              {/* Member list */}
              <div className="space-y-1">
                {filteredMembers.map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-all">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] text-white shrink-0 font-medium"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-gray-800 truncate">{m.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{m.email}</p>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${roleColor[m.role] || "bg-gray-100 text-gray-500"}`}>
                      {roleLabel[m.role] || m.role}
                    </span>
                  </div>
                ))}
              </div>

              {/* Invite button */}
              <button
                onClick={() => toast.success("Đã gửi lời mời thành viên")}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-[12px] text-gray-400 hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Mời thành viên
              </button>
            </>
          )}

          {tab === "advanced" && (
            <>
              <div>
                <label className="text-[11px] text-gray-700 font-medium mb-1.5 block">Khách hàng</label>
                <input
                  value={client}
                  onChange={e => setClient(e.target.value)}
                  placeholder="Tên khách hàng hoặc tổ chức..."
                  className="w-full px-3 py-2.5 text-[12px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 text-gray-800 placeholder-gray-400 transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-700 font-medium mb-1.5 block">Ngân sách dự kiến</label>
                <input
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  placeholder="VD: 500 triệu VND"
                  className="w-full px-3 py-2.5 text-[12px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 text-gray-800 placeholder-gray-400 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-700 font-medium mb-1.5 block">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-[12px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 text-gray-800 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-700 font-medium mb-1.5 block">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-[12px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 text-gray-800 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[11px] text-gray-700 font-medium mb-1.5">
                  <GitBranch className="w-3 h-3" /> Repository URL
                </label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={e => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/org/repo"
                  className="w-full px-3 py-2.5 text-[12px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 text-gray-800 placeholder-gray-400 transition-all"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[12px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
          >
            Hủy
          </button>
          <button
            onClick={() => onSave({ name, description, color, icon })}
            className="px-5 py-2 text-[12px] text-white bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 rounded-xl shadow-md shadow-cyan-200/50 transition-all flex items-center gap-1.5"
          >
            <Check className="w-3 h-3" />
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function ProjectsSidebar({ selectedSpace, onSpaceSelect, onClose, activeSection = "project", onSectionChange }: ProjectsSidebarProps) {
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>(["p1"]);
  const [sortBy, setSortBy] = useState<"name" | "progress" | "status" | "activity">("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjects, setNewProjects] = useState<Space[]>([]);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    color: PROJECT_COLORS[0],
    icon: PROJECT_ICONS[0],
    members: 1,
    visibility: "public" as "public" | "private",
  });
  const [createStep, setCreateStep] = useState(0);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const newProjectRef = useRef<HTMLDivElement | null>(null);

  // Context menu state
  const [projectCtxMenu, setProjectCtxMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  // Archived projects state
  const [archivedProjectIds, setArchivedProjectIds] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  // Settings modal state
  const [settingsProject, setSettingsProject] = useState<Space | null>(null);

  const allProjectSpaces = [...projectSpaces, ...newProjects];

  const validateName = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return "Tên dự án không được để trống";
    if (trimmed.length < 2) return "Tên dự án phải có ít nhất 2 ký tự";
    if (trimmed.length > 50) return "Tên dự án không được quá 50 ký tự";
    const duplicate = allProjectSpaces.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) return `Dự án "${duplicate.name}" đã tồn tại`;
    return null;
  };

  const handleCreate = () => {
    const error = validateName(createForm.name);
    if (error) { setNameError(error); return; }
    const newId = `pn${Date.now()}`;
    const template = PROJECT_TEMPLATES.find(t => t.key === "agile") || PROJECT_TEMPLATES[0];
    const newSpace: Space = {
      id: newId,
      name: createForm.name.trim(),
      category: "project",
      color: createForm.color,
      icon: createForm.icon,
      description: createForm.description.trim() || undefined,
      members: createForm.members,
      visibility: createForm.visibility,
      unread: 0,
      topics: template.topics.map((t, i) => ({
        id: `${newId}_t${i + 1}`,
        name: t.name,
        emoji: t.emoji,
        description: t.description,
      })),
    };
    setNewProjects(prev => [...prev, newSpace]);
    spaces.push(newSpace);
    projectMeta[newId] = { progress: 0, tasksTotal: 0, tasksDone: 0, status: "on_track", lastActivity: "Vừa xong" };
    setLastCreatedId(newId);
    setCreateStep(1);
  };

  const handleSaveProjectSettings = (id: string, updates: Partial<Space>) => {
    toast.success("Đã lưu cài đặt dự án");
    setSettingsProject(null);
  };

  const sortProjects = (list: Space[]) => {
    const sorted = [...list].sort((a, b) => {
      const ma = projectMeta[a.id] || { progress: 0, status: "on_track", lastActivity: "" };
      const mb = projectMeta[b.id] || { progress: 0, status: "on_track", lastActivity: "" };
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name);
        case "progress": return ma.progress - mb.progress;
        case "status": {
          const order = { on_track: 0, at_risk: 1, behind: 2 };
          return order[ma.status] - order[mb.status];
        }
        case "activity": return 0;
        default: return 0;
      }
    });
    return sortAsc ? sorted : sorted.reverse();
  };

  // Filter out archived projects from main list
  const visibleProjectSpaces = allProjectSpaces.filter(p => !archivedProjectIds.includes(p.id));

  const filtered = visibleProjectSpaces.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const favProjects = sortProjects(filtered.filter(p => favorites.includes(p.id)));
  const otherProjects = sortProjects(filtered.filter(p => !favorites.includes(p.id)));

  const toggleFav = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const renderProject = (project: Space) => {
    const meta = projectMeta[project.id] || { progress: 0, tasksTotal: 0, tasksDone: 0, status: "on_track" as const, lastActivity: "" };
    const isActive = selectedSpace === project.id;
    const isFav = favorites.includes(project.id);

    const statusLabel = { on_track: "On Track", at_risk: "At Risk", behind: "Behind" }[meta.status];
    const statusColor = { on_track: "#059669", at_risk: "#d97706", behind: "#dc2626" }[meta.status];
    const statusBg = { on_track: "#f0fdf4", at_risk: "#fffbeb", behind: "#fef2f2" }[meta.status];

    return (
      <div
        key={project.id}
        ref={project.id === lastCreatedId ? newProjectRef : undefined}
        onClick={() => onSpaceSelect(project.id)}
        onContextMenu={(e) => { e.preventDefault(); setProjectCtxMenu({ id: project.id, x: Math.min(e.clientX, window.innerWidth - 210), y: Math.min(e.clientY, window.innerHeight - 220) }); }}
        className={`group/proj w-full px-3 py-2.5 rounded-lg cursor-pointer transition-all mb-0.5 ${
          isActive
            ? "bg-cyan-50 border border-cyan-200/60"
            : "hover:bg-gray-50 border border-transparent"
        } ${highlightedId === project.id ? "ring-2 ring-cyan-400 ring-offset-1" : ""}`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] text-white shrink-0 shadow-sm"
            style={{ backgroundColor: project.color }}
          >
            {project.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {project.visibility === "private" && (
                <Lock className="w-2.5 h-2.5 shrink-0 text-amber-400" />
              )}
              <span className={`text-[12px] truncate ${isActive ? "text-cyan-800" : "text-gray-800"}`}>
                {project.name}
              </span>
              <button
                onClick={e => toggleFav(project.id, e)}
                className={`shrink-0 transition-all ${
                  isFav ? "text-amber-400" : "text-gray-300 opacity-0 group-hover/proj:opacity-100"
                }`}
              >
                <Star className={`w-3 h-3 ${isFav ? "fill-current" : ""}`} />
              </button>
            </div>
            <p className={`text-[10px] truncate mt-0.5 ${isActive ? "text-cyan-500" : "text-gray-400"}`}>
              {project.description}
            </p>
          </div>
          {project.unread && project.unread > 0 && !isActive && (
            <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-cyan-500 text-white text-[9px] flex items-center justify-center shrink-0">
              {project.unread}
            </span>
          )}
        </div>
        {/* Progress bar */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${meta.progress}%`, backgroundColor: project.color }}
            />
          </div>
          <span className={`text-[9px] shrink-0 ${isActive ? "text-cyan-500" : "text-gray-400"}`}>
            {meta.progress}%
          </span>
        </div>
        {/* Stats row */}
        <div className="mt-1.5 flex items-center gap-3">
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
            style={{ backgroundColor: statusBg, color: statusColor }}
          >
            {statusLabel}
          </span>
          <span className={`flex items-center gap-1 text-[9px] ${isActive ? "text-cyan-500" : "text-gray-400"}`}>
            <CheckCircle2 className="w-2.5 h-2.5" />
            {meta.tasksDone}/{meta.tasksTotal}
          </span>
          {project.members && (
            <span className={`flex items-center gap-0.5 text-[9px] ${isActive ? "text-cyan-500" : "text-gray-400"}`}>
              <Users className="w-2.5 h-2.5" />
              {project.members}
            </span>
          )}
          <span className={`flex items-center gap-0.5 text-[9px] ml-auto ${isActive ? "text-cyan-500" : "text-gray-400"}`}>
            <Clock className="w-2.5 h-2.5" />
            {meta.lastActivity}
          </span>
        </div>
      </div>
    );
  };

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
            <FolderKanban className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-[12px] text-gray-700 tracking-tight">Dự Án</span>
          </div>
          <span className="hidden md:inline text-[10px] text-gray-500">{allProjectSpaces.length}</span>
          <button
            onClick={() => {
              setCreateForm({
                name: "",
                description: "",
                color: PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)],
                icon: PROJECT_ICONS[Math.floor(Math.random() * PROJECT_ICONS.length)],
                members: 1,
                visibility: "public",
              });
              setCreateStep(0);
              setNameError(null);
              setShowIconPicker(false);
              setShowCreateModal(true);
              setTimeout(() => nameInputRef.current?.focus(), 100);
            }}
            className="w-6 h-6 rounded-md hover:bg-cyan-50 flex items-center justify-center text-gray-400 hover:text-cyan-600 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Search */}
        <div className="flex items-center gap-1.5">
          <div className="flex-1 flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-100">
            <Search className="w-3 h-3 text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm dự án..."
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
                  ? "bg-cyan-50 text-cyan-600 border border-cyan-200"
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
                    { key: "progress", asc: false, icon: <Percent className="w-3.5 h-3.5" />, label: "Tiến độ cao nhất" },
                    { key: "progress", asc: true, icon: <Percent className="w-3.5 h-3.5" />, label: "Tiến độ thấp nhất" },
                    { key: "status", asc: true, icon: <Activity className="w-3.5 h-3.5" />, label: "Trạng thái tốt nhất" },
                    { key: "status", asc: false, icon: <Activity className="w-3.5 h-3.5" />, label: "Trạng thái xấu nhất" },
                  ] as const).map((opt, i) => {
                    const isActiveOpt = sortBy === opt.key && sortAsc === opt.asc;
                    return (
                      <button
                        key={i}
                        onClick={() => { setSortBy(opt.key as any); setSortAsc(opt.asc); setShowSortMenu(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-[6px] text-[11px] transition-all ${
                          isActiveOpt ? "bg-cyan-50 text-cyan-700" : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span className={isActiveOpt ? "text-cyan-500" : "text-gray-400"}>{opt.icon}</span>
                        <span className="flex-1 text-left">{opt.label}</span>
                        {isActiveOpt && <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
        {/* Section switcher — mobile only, below search */}
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
                {s.icon}{s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto py-1.5 px-1.5 pb-16 md:pb-1.5">
        {/* Favorites */}
        {favProjects.length > 0 && (
          <>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5">
              <Star className="w-2.5 h-2.5 text-amber-400" />
              <span className="text-[9px] text-gray-500 uppercase tracking-wider">Yêu thích</span>
            </div>
            {favProjects.map(renderProject)}
            <div className="h-px bg-gray-100 mx-2 my-2" />
          </>
        )}

        {/* All projects */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5">
          <span className="text-[9px] text-gray-500 uppercase tracking-wider">Tất cả dự án</span>
        </div>
        {otherProjects.map(renderProject)}

        {filtered.length === 0 && archivedProjectIds.length === 0 && (
          <div className="text-center py-8">
            <FolderKanban className="w-6 h-6 text-gray-200 mx-auto mb-2" />
            <p className="text-[11px] text-gray-500">Không tìm thấy</p>
          </div>
        )}

        {/* Archived Projects Section */}
        {archivedProjectIds.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
            >
              <Archive className="w-3 h-3" />
              <span className="flex-1 text-left">Đã lưu trữ ({archivedProjectIds.length})</span>
              <ChevronRight className={`w-3 h-3 transition-transform ${showArchived ? "rotate-90" : ""}`} />
            </button>
            {showArchived && (() => {
              const archivedItems = archivedProjectIds
                .map(id => allProjectSpaces.find(p => p.id === id))
                .filter((proj): proj is Space => proj !== undefined);
              if (archivedItems.length === 0) {
                return (
                  <div className="px-3 py-3 text-center">
                    <p className="text-[11px] text-gray-500">Chưa có dự án nào được lưu trữ</p>
                  </div>
                );
              }
              return archivedItems.map(proj => (
                <div
                  key={proj.id}
                  className="flex items-center gap-2.5 px-3 py-2 opacity-50 hover:opacity-70 cursor-pointer rounded-lg hover:bg-gray-50 transition-all"
                  onClick={() => onSpaceSelect(proj.id)}
                >
                  <div
                    className="w-[24px] h-[24px] rounded-md flex items-center justify-center text-[9px] text-white shrink-0"
                    style={{ backgroundColor: proj.color }}
                  >
                    {proj.icon}
                  </div>
                  <span className="text-[11px] text-gray-600 truncate flex-1">{proj.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setArchivedProjectIds(prev => prev.filter(x => x !== proj.id));
                      toast.success("Đã khôi phục dự án");
                    }}
                    className="ml-auto text-[10px] text-gray-400 hover:text-cyan-600 px-1.5 py-0.5 rounded hover:bg-cyan-50"
                  >
                    Khôi phục
                  </button>
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl shadow-black/15 w-full max-w-[600px] max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {createStep === 0 ? (
              <>
                {/* Modal Header */}
                <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                        <Plus className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-[14px] text-gray-900">Tạo dự án mới</h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">Thiết lập thông tin cơ bản cho dự án</p>
                      </div>
                    </div>
                    <button onClick={() => setShowCreateModal(false)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">

                  {/* Preview */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl text-white shadow-md transition-all cursor-pointer hover:scale-105"
                        style={{ backgroundColor: createForm.color }}
                        onClick={() => setShowIconPicker(!showIconPicker)}
                      >
                        {createForm.icon}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                        <Sparkles className="w-2.5 h-2.5 text-violet-500" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-gray-800 truncate">
                        {createForm.name || "Tên dự án..."}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">
                        {createForm.description || "Mô tả ngắn gọn..."}
                      </p>
                    </div>
                  </div>

                  {/* Icon Picker */}
                  {showIconPicker && (
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Chọn biểu tượng</p>
                      <div className="grid grid-cols-10 gap-1">
                        {PROJECT_ICONS.map(icon => (
                          <button
                            key={icon}
                            onClick={() => { setCreateForm(f => ({ ...f, icon })); setShowIconPicker(false); }}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm hover:bg-white hover:shadow-sm transition-all ${createForm.icon === icon ? "bg-white shadow-sm ring-2 ring-cyan-300" : ""}`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Project Name */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] text-gray-700 font-medium mb-1.5">
                      <Type className="w-3 h-3" /> Tên dự án <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        ref={nameInputRef}
                        value={createForm.name}
                        onChange={e => { setCreateForm(f => ({ ...f, name: e.target.value })); if (nameError) setNameError(null); }}
                        placeholder="VD: Website Redesign 2026"
                        maxLength={50}
                        className={`w-full px-3 py-2.5 text-[13px] bg-white border rounded-xl focus:outline-none focus:ring-2 text-gray-800 placeholder-gray-400 transition-all ${
                          nameError
                            ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                            : "border-gray-200 focus:ring-cyan-200 focus:border-cyan-400"
                        }`}
                        onKeyDown={e => { if (e.key === "Enter" && createForm.name.trim()) handleCreate(); }}
                      />
                      {createForm.name.trim() && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-300">
                          {createForm.name.trim().length}/50
                        </span>
                      )}
                    </div>
                    {nameError && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                        <p className="text-[10px] text-red-500">{nameError}</p>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] text-gray-700 font-medium mb-1.5">
                      <FileText className="w-3 h-3" /> Mô tả
                    </label>
                    <textarea
                      value={createForm.description}
                      onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Mô tả ngắn gọn về mục tiêu và phạm vi dự án..."
                      rows={3}
                      className="w-full px-3 py-2.5 text-[13px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 text-gray-800 placeholder-gray-400 transition-all resize-none"
                    />
                  </div>

                  {/* Color Picker */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] text-gray-700 font-medium mb-2">
                      <Palette className="w-3 h-3" /> Màu dự án
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PROJECT_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setCreateForm(f => ({ ...f, color }))}
                          className={`w-7 h-7 rounded-lg transition-all hover:scale-110 ${createForm.color === color ? "ring-2 ring-offset-2 ring-cyan-400 scale-110" : "hover:shadow-md"}`}
                          style={{ backgroundColor: color }}
                        >
                          {createForm.color === color && <Check className="w-3.5 h-3.5 text-white mx-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visibility Toggle */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] text-gray-700 font-medium mb-2">
                      <Eye className="w-3 h-3" /> Khả năng hiển thị
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCreateForm(f => ({ ...f, visibility: "public" }))}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] transition-all border ${createForm.visibility === "public" ? "bg-cyan-50 border-cyan-400 text-cyan-700" : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"}`}
                      >
                        <Globe className="w-3 h-3" /> Public
                      </button>
                      <button
                        onClick={() => setCreateForm(f => ({ ...f, visibility: "private" }))}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] transition-all border ${createForm.visibility === "private" ? "bg-amber-50 border-amber-400 text-amber-700" : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"}`}
                      >
                        <Lock className="w-3 h-3" /> Private
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-[12px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!createForm.name.trim()}
                    className="px-5 py-2 text-[12px] text-white bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 rounded-xl shadow-md shadow-cyan-200/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3" />
                    Tạo dự án
                  </button>
                </div>
              </>
            ) : (
              /* Success Step */
              <div className="px-6 py-10 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg mx-auto mb-4"
                  style={{ backgroundColor: createForm.color }}
                >
                  {createForm.icon}
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 -mt-8 ml-[calc(50%+12px)] border-2 border-white">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-[15px] text-gray-900 mt-2">Dự án đã được tạo!</h3>
                <p className="text-[12px] text-gray-500 mt-1">{createForm.name}</p>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      if (lastCreatedId) {
                        setHighlightedId(lastCreatedId);
                        setTimeout(() => setHighlightedId(null), 2500);
                        setTimeout(() => {
                          newProjectRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }, 100);
                      }
                    }}
                    className="px-4 py-2 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      if (lastCreatedId) {
                        setHighlightedId(lastCreatedId);
                        setTimeout(() => setHighlightedId(null), 2500);
                        setTimeout(() => {
                          newProjectRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }, 100);
                        onSpaceSelect(lastCreatedId);
                      }
                    }}
                    className="px-5 py-2 text-[12px] text-white bg-cyan-500 hover:bg-cyan-600 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <FolderKanban className="w-3.5 h-3.5" />
                    Mở dự án
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Project Context Menu */}
      {projectCtxMenu && (() => {
        const proj = spaces.find(s => s.id === projectCtxMenu.id) || allProjectSpaces.find(s => s.id === projectCtxMenu.id);
        if (!proj) return null;
        return (
          <ProjectContextMenu
            project={proj}
            pos={projectCtxMenu}
            onClose={() => setProjectCtxMenu(null)}
            onToggleFav={() => {
              setFavorites(prev =>
                prev.includes(proj.id) ? prev.filter(x => x !== proj.id) : [...prev, proj.id]
              );
            }}
            isFav={favorites.includes(proj.id)}
            onSettings={() => setSettingsProject(proj)}
            onArchive={() => {
              setArchivedProjectIds(prev => [...prev, proj.id]);
              toast.success("Đã lưu trữ dự án");
            }}
            onSelect={() => onSpaceSelect(proj.id)}
          />
        );
      })()}

      {/* Project Settings Modal */}
      {settingsProject && (
        <ProjectSettingsModal
          project={settingsProject}
          onClose={() => setSettingsProject(null)}
          onSave={(updates) => handleSaveProjectSettings(settingsProject.id, updates)}
        />
      )}
    </div>
  );
}
