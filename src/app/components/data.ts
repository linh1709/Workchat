export interface Epic {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  color: string;
  status: "todo" | "in_progress" | "in_review" | "done";
  startDate?: string;
  dueDate?: string;
  ownerId?: string;
}

export type TaskType = "task" | "story" | "bug" | "epic";

export const taskTypeConfig: Record<TaskType, { label: string; icon: string; color: string; bg: string }> = {
  task:  { label: "Task",  icon: "☑",  color: "#0891b2", bg: "#ecfeff" },
  story: { label: "Story", icon: "📖", color: "#7c3aed", bg: "#f5f3ff" },
  bug:   { label: "Bug",   icon: "🐛", color: "#dc2626", bg: "#fef2f2" },
  epic:  { label: "Epic",  icon: "⚡", color: "#d97706", bg: "#fffbeb" },
};

export interface WorkLog {
  id: string;
  userId: string;
  date: string;
  timeSpent: number;
  note?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type?: TaskType;
  status: "todo" | "in_progress" | "in_review" | "done";
  priority: "urgent" | "high" | "normal" | "low";
  assignee?: TeamMember;
  dueDate?: string;
  startDate?: string;
  tags: string[];
  subtasks?: { id: string; title: string; done: boolean }[];
  createdAt: string;
  projectId: string;
  epicId?: string;
  storyPoints?: number;
  timeEstimate?: number;
  timeSpent?: number;
  dependencies?: string[];
  watchers?: string[];
  comments?: TaskComment[];
  activityLog?: ActivityEntry[];
  customFields?: Record<string, string>;
  checklists?: Checklist[];
  sprintId?: string;
  updatedAt?: string;
  reporterId?: string;
  workLogs?: WorkLog[];
  parentId?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  email: string;
  color: string;
}

// ===== NEW UNIFIED SPACE MODEL =====
// Spaces are level 1 entities (like Telegram groups)
// Topics are level 2 (like Telegram topics within a group)
// "category" is just for sidebar grouping, not a hierarchy level

export type SpaceCategory = "personal" | "group" | "channel" | "project" | "elearning" | "bot";

export interface Topic {
  id: string;
  name: string;
  emoji?: string;
  unread?: number;
  pinned?: boolean;
  description?: string;
  lastMessage?: string;
  muted?: boolean;
  agentId?: "vwork_bot" | "code_review" | "analytics" | "kb_agent";
  agentStatus?: "online" | "idle" | "offline";
}

export interface Space {
  id: string;
  name: string;
  category: SpaceCategory;
  color: string;
  icon: string;
  description?: string;
  members?: number;
  unread?: number;
  online?: boolean;
  topics: Topic[];
}

// Backward compat: Project interface derived from project-type spaces
export interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
  spaceId: string;
  description?: string;
}

export const teamMembers: TeamMember[] = [
  { id: "u1", name: "Nguyễn Minh", avatar: "", role: "Project Manager", email: "minh@vwork.com", color: "#0891b2" },
  { id: "u2", name: "Trần Hương", avatar: "", role: "Designer", email: "huong@vwork.com", color: "#7c3aed" },
  { id: "u3", name: "Lê Phúc", avatar: "", role: "Developer", email: "phuc@vwork.com", color: "#059669" },
  { id: "u4", name: "Phạm Lan", avatar: "", role: "Developer", email: "lan@vwork.com", color: "#d97706" },
  { id: "u5", name: "Hoàng Đức", avatar: "", role: "QA Engineer", email: "duc@vwork.com", color: "#db2777" },
  { id: "u6", name: "Vũ Mai", avatar: "", role: "Marketing", email: "mai@vwork.com", color: "#4f46e5" },
];

// Personal chat item (DMs + personal tools in level 2 sidebar)
export interface PersonalChatItem {
  id: string;
  name: string;
  type: "tool" | "dm" | "group"; // tool = Ghi chú, Tin nhắn đã lưu, etc. | dm = direct message | group = group chat
  icon: string;
  color: string;
  emoji?: string;
  description?: string;
  unread?: number;
  online?: boolean;
  lastMessage?: string;
  lastTime?: string;
  pinned?: boolean;
  userId?: string; // linked team member for DMs
  members?: string[]; // member names for group chats
  typing?: boolean;
  pinnedAt?: number;
}

// ============== FORMAT TIME FOR DMS ==============
const getTimeAgo = (date: Date): string => {
  const nowTime = new Date();
  const diffMs = nowTime.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
  return `${Math.floor(diffDays / 30)} tháng trước`;
};

// ============== PERSONAL DMS WITH TIMESTAMPS ==============
const nowTime = new Date();
const personalDMsWithTimestamps = [
  { id: "pc-dm-huong", name: "Trần Hương", type: "dm" as const, icon: "TH", color: "#7c3aed", userId: "u2", online: true, unread: 3, lastMessage: "Chị ơi, em gửi bản thiết kế mới rồi nhé!", timestamp: new Date(nowTime.getTime() - 2 * 60 * 1000) },
  { id: "pc-dm-phuc", name: "Lê Phúc", type: "dm" as const, icon: "LP", color: "#059669", userId: "u3", online: true, unread: 1, lastMessage: "PR #142 đã merge, anh review giúp em nhé", timestamp: new Date(nowTime.getTime() - 15 * 60 * 1000), typing: true },
  { id: "pc-dm-duc", name: "Hoàng Đức", type: "dm" as const, icon: "HĐ", color: "#db2777", userId: "u5", online: true, unread: 2, lastMessage: "Test case cho module payment đã pass hết!", timestamp: new Date(nowTime.getTime() - 3 * 60 * 60 * 1000) },
  { id: "pc-dm-linh", name: "Đặng Linh", type: "dm" as const, icon: "ĐL", color: "#be185d", userId: "u8", online: true, lastMessage: "Em đã deploy lên staging rồi ạ", timestamp: new Date(nowTime.getTime() - 4 * 60 * 60 * 1000) },
  { id: "pc-dm-khoa", name: "Trương Khoa", type: "dm" as const, icon: "TK", color: "#b45309", userId: "u9", online: false, unread: 1, lastMessage: "Sprint review chiều nay nhé team", timestamp: new Date(nowTime.getTime() - 5 * 60 * 60 * 1000) },
  { id: "pc-dm-lan", name: "Phạm Lan", type: "dm" as const, icon: "PL", color: "#d97706", userId: "u4", online: false, lastMessage: "OK anh, em sẽ fix bug đó trước 5h chiều", timestamp: new Date(nowTime.getTime() - 24 * 60 * 60 * 1000) },
  { id: "pc-dm-mai", name: "Vũ Mai", type: "dm" as const, icon: "VM", color: "#4f46e5", userId: "u6", online: false, lastMessage: "Anh có thể check giúp em landing page ko?", timestamp: new Date(nowTime.getTime() - 24 * 60 * 60 * 1000) },
  { id: "pc-dm-tuan", name: "Nguyễn Tuấn", type: "dm" as const, icon: "NT", color: "#0f766e", userId: "u7", online: false, lastMessage: "Cuộc họp ngày mai bị dời sang 3h chiều", timestamp: new Date(nowTime.getTime() - 3 * 24 * 60 * 60 * 1000) },
];

// Sort by timestamp descending (newest first) and add lastTime
const personalDMsSorted = personalDMsWithTimestamps
  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  .map(dm => ({
    ...dm,
    lastTime: getTimeAgo(dm.timestamp),
    timestamp: undefined, // remove internal timestamp
  }));

export const personalChatItems: PersonalChatItem[] = [
  // ── Công cụ cá nhân ──
  { id: "pc-notes", name: "Ghi chú cá nhân", type: "tool", icon: "📝", color: "#0891b2", emoji: "📝", description: "Ghi chú & todo riêng tư", pinned: true },
  { id: "pc-saved", name: "Tin nhắn đã lưu", type: "tool", icon: "🔖", color: "#0284c7", emoji: "🔖", description: "Bookmarks & tin đã lưu", pinned: true },
  { id: "pc-journal", name: "Nhật ký công việc", type: "tool", icon: "📅", color: "#06b6d4", emoji: "📅", description: "Daily standup cá nhân", pinned: true },
  // ── Tin nhắn trực tiếp (DM) với đồng nghiệp (sorted by latest) ──
  ...personalDMsSorted,
];

// ── Danh bạ công ty (Company Directory) ──
// Những người chưa có trong DM list, có thể bắt đầu tin nhắn mới
export interface CompanyContact {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
  department: string;
  online: boolean;
  phone?: string;
}

export const companyDirectory: CompanyContact[] = [
  { id: "ct-thao", name: "Nguyễn Thảo", initials: "NTh", color: "#8b5cf6", role: "Product Manager", department: "Product", online: true, phone: "0901234567" },
  { id: "ct-nam", name: "Bùi Nam", initials: "BN", color: "#2563eb", role: "Backend Developer", department: "Engineering", online: true, phone: "0912345678" },
  { id: "ct-hien", name: "Lý Hiền", initials: "LH", color: "#dc2626", role: "QA Engineer", department: "Engineering", online: false, phone: "0923456789" },
  { id: "ct-minh", name: "Võ Minh", initials: "VMi", color: "#0d9488", role: "DevOps Engineer", department: "Infrastructure", online: true, phone: "0934567890" },
  { id: "ct-yen", name: "Trịnh Yến", initials: "TY", color: "#c026d3", role: "UI/UX Designer", department: "Design", online: false, phone: "0945678901" },
  { id: "ct-quan", name: "Đỗ Quân", initials: "ĐQ", color: "#ea580c", role: "Frontend Developer", department: "Engineering", online: true, phone: "0956789012" },
  { id: "ct-ngoc", name: "Hà Ngọc", initials: "HN", color: "#0891b2", role: "Business Analyst", department: "Product", online: false, phone: "0967890123" },
  { id: "ct-huy", name: "Phan Huy", initials: "PH", color: "#4f46e5", role: "Tech Lead", department: "Engineering", online: true, phone: "0978901234" },
  { id: "ct-trang", name: "Lương Trang", initials: "LT", color: "#e11d48", role: "Scrum Master", department: "Product", online: false, phone: "0989012345" },
  { id: "ct-khanh", name: "Cao Khánh", initials: "CK", color: "#059669", role: "Data Engineer", department: "Data", online: true, phone: "0990123456" },
  { id: "ct-son", name: "Đinh Sơn", initials: "ĐS", color: "#7c3aed", role: "Mobile Developer", department: "Engineering", online: false, phone: "0901122334" },
  { id: "ct-uyen", name: "Mạc Uyên", initials: "MU", color: "#b45309", role: "Content Writer", department: "Marketing", online: true, phone: "0912233445" },
  { id: "ct-dat", name: "Tạ Đạt", initials: "TĐ", color: "#0f766e", role: "Security Engineer", department: "Infrastructure", online: false, phone: "0923344556" },
  { id: "ct-ha", name: "Kiều Hà", initials: "KH", color: "#db2777", role: "HR Manager", department: "People", online: true, phone: "0934455667" },
  { id: "ct-long", name: "Vương Long", initials: "VL", color: "#6366f1", role: "Full-stack Developer", department: "Engineering", online: false, phone: "0945566778" },
];

// ── Danh sách kênh công ty (Channel Items) ──
export interface ChannelItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  members: number;
  unread?: number;
  lastMessage?: string;
  lastTime?: string;
  pinned?: boolean;
  visibility?: "public" | "private";
  muted?: boolean;
  lastActivityTimestamp?: number;
  ownerId?: string;          // user who created/owns the channel
  allowedPosterIds?: string[]; // other users allowed to post (besides owner)
}

export const channelItems: ChannelItem[] = [
  // u1 (Nguyễn Minh) is owner — can post
  { id: "ch-crm", name: "CRM - Quản lý KH", icon: "📞", color: "#0891b2", description: "Quản lý khách hàng, cơ hội bán hàng", members: 6, unread: 2, lastMessage: "Deal mới: Công ty ABC - $50k", lastTime: "10:45", pinned: true, visibility: "private", muted: false, lastActivityTimestamp: Date.now() - 1800000, ownerId: "u1", allowedPosterIds: ["u1", "u3"] },
  { id: "ch-finance", name: "Tài chính kế toán", icon: "💰", color: "#059669", description: "Thông tin tài chính, hóa đơn, thanh toán", members: 15, unread: 3, lastMessage: "Bảng lương T3 đã gửi qua email", lastTime: "09:30", pinned: true, visibility: "private", muted: false, lastActivityTimestamp: Date.now() - 1800000, ownerId: "u1", allowedPosterIds: ["u3", "u4"] },
  // u2 owns, u1 is NOT invited — read-only
  { id: "ch-admin", name: "Thủ tục hành chính", icon: "📋", color: "#0891b2", description: "Quy trình, biểu mẫu, thủ tục nội bộ", members: 20, unread: 1, lastMessage: "Cập nhật form xin nghỉ phép mới", lastTime: "Hôm qua", pinned: true, visibility: "private", muted: false, lastActivityTimestamp: Date.now() - 86400000, ownerId: "u2", allowedPosterIds: ["u3"] },
  // u1 is invited — can post
  { id: "ch-culture", name: "Văn hóa doanh nghiệp", icon: "🎯", color: "#7c3aed", description: "Giá trị cốt lõi, hoạt động team building", members: 25, lastMessage: "Team building tháng 4 tại Đà Lạt!", lastTime: "10:15", visibility: "public", muted: false, lastActivityTimestamp: Date.now() - 3600000, ownerId: "u6", allowedPosterIds: ["u1", "u2", "u3", "u4", "u5"] },
  // u3 owns, u1 invited — can post
  { id: "ch-support", name: "Chăm sóc khách hàng", icon: "💬", color: "#db2777", description: "Hỗ trợ khách hàng, phản hồi, escalation", members: 8, unread: 5, lastMessage: "Case #892 cần xử lý gấp", lastTime: "08:45", visibility: "public", muted: false, lastActivityTimestamp: Date.now() - 900000, ownerId: "u3", allowedPosterIds: ["u1", "u5"] },
  // u4 owns, u1 NOT invited — read-only
  { id: "ch-workshop", name: "Workshop", icon: "🎓", color: "#d97706", description: "Tổ chức workshop, training nội bộ", members: 18, lastMessage: "Workshop Docker cơ bản - Thứ 6 tuần này", lastTime: "T3", visibility: "public", muted: false, lastActivityTimestamp: Date.now() - Math.floor(Math.random() * 86400000), ownerId: "u4", allowedPosterIds: ["u2"] },
  // u1 owns — can post
  { id: "ch-announce", name: "Thông báo chung", icon: "📢", color: "#dc2626", description: "Thông báo quan trọng từ ban lãnh đạo", members: 30, unread: 2, lastMessage: "Lịch nghỉ lễ 30/4 - 1/5", lastTime: "11:00", pinned: true, visibility: "public", muted: false, lastActivityTimestamp: Date.now() - Math.floor(Math.random() * 86400000), ownerId: "u1", allowedPosterIds: [] },
  // u3 owns, u1 invited — can post
  { id: "ch-tech", name: "Tech Talk", icon: "💻", color: "#4f46e5", description: "Chia sẻ kiến thức công nghệ", members: 12, lastMessage: "Bài viết hay về React Server Components", lastTime: "Hôm qua", visibility: "public", muted: false, lastActivityTimestamp: Date.now() - 600000, ownerId: "u3", allowedPosterIds: ["u1", "u4", "u5"] },
  // u5 owns, u1 NOT invited — read-only
  { id: "ch-hr", name: "Nhân sự", icon: "👥", color: "#0f766e", description: "Tuyển dụng, onboarding, chính sách nhân sự", members: 10, unread: 1, lastMessage: "Chào mừng 2 thành viên mới!", lastTime: "T2", visibility: "private", muted: false, lastActivityTimestamp: Date.now() - 7200000, ownerId: "u5", allowedPosterIds: ["u2"] },
  // u1 invited — can post
  { id: "ch-random", name: "Random", icon: "🎲", color: "#ea580c", description: "Chuyện phiếm, memes, chia sẻ vui", members: 25, unread: 8, lastMessage: "Ai biết quán cafe nào gần công ty không?", lastTime: "11:30", visibility: "public", muted: false, lastActivityTimestamp: Date.now() - 1200000, ownerId: "u6", allowedPosterIds: ["u1", "u2", "u3", "u4", "u5"] },
  // u2 invited — can post
  { id: "ch-health", name: "Sức khỏe & Wellness", icon: "🏃", color: "#16a34a", description: "CLB thể thao, sức khỏe, yoga", members: 14, lastMessage: "Giải chạy bộ nội bộ tháng 4", lastTime: "Hôm qua", visibility: "public", muted: false, lastActivityTimestamp: Date.now() - Math.floor(Math.random() * 86400000), ownerId: "u2", allowedPosterIds: ["u1", "u3"] },

];

export const browseChannels: ChannelItem[] = [
  { id: "ch-sales", name: "Sales", icon: "💼", color: "#0891b2", description: "Đội ngũ bán hàng & kinh doanh", members: 8, lastMessage: "", lastTime: "", unread: 0, visibility: "public", muted: false, lastActivityTimestamp: Date.now() - 3600000 },
  { id: "ch-legal", name: "Pháp lý", icon: "⚖️", color: "#4f46e5", description: "Vấn đề pháp lý & hợp đồng", members: 5, lastMessage: "", lastTime: "", unread: 0, visibility: "private", muted: false, lastActivityTimestamp: Date.now() - 86400000 },
  { id: "ch-infra", name: "Infrastructure", icon: "☁️", color: "#0d9488", description: "Cloud, Kubernetes, monitoring, DevOps", members: 6, lastMessage: "", lastTime: "", unread: 0, visibility: "public", muted: false, lastActivityTimestamp: Date.now() - 7200000 },
  { id: "ch-design-system", name: "Design System", icon: "🎨", color: "#db2777", description: "Components, tokens, design guidelines", members: 4, lastMessage: "", lastTime: "", unread: 0, visibility: "public", muted: false, lastActivityTimestamp: Date.now() - 10800000 },
];

// Category display info for sidebar headers
export const spaceCategories: { key: SpaceCategory; label: string; color: string }[] = [
  { key: "personal", label: "Cá nhân", color: "#0891b2" },
  { key: "channel", label: "Kênh", color: "#6366f1" },
  { key: "project", label: "Dự Án", color: "#7c3aed" },
  { key: "bot", label: "Bot / AI Agent", color: "#0d9488" },
];

export const spaces: Space[] = [
  // ── Cá nhân ── (no sub-items in level 1, uses PersonalSidebar level 2)
  {
    id: "sp-personal", name: "Cá nhân", category: "personal", color: "#0891b2", icon: "CN",
    description: "Tin nhắn & ghi chú riêng",
    topics: [],
  },

  // ── Nhóm ──
  {
    id: "sp-devteam", name: "Dev Team", category: "group", color: "#059669", icon: "DT",
    description: "Backend & Frontend devs", members: 4, unread: 5,
    topics: [
      { id: "tp-dev-general", name: "General", pinned: true, emoji: "💬", unread: 2, lastMessage: "Phúc: PR đã merge" },
      { id: "tp-dev-backend", name: "Backend", emoji: "⚙️", unread: 1 },
      { id: "tp-dev-frontend", name: "Frontend", emoji: "🎨", unread: 2 },
      { id: "tp-dev-code-review", name: "Code Review", emoji: "👀" },
      { id: "tp-dev-standup", name: "Daily Standup", emoji: "🗓️" },
    ],
  },
  {
    id: "sp-designteam", name: "Design Team", category: "group", color: "#db2777", icon: "DS",
    description: "UI/UX Designers", members: 3, unread: 2,
    topics: [
      { id: "tp-design-general", name: "General", pinned: true, emoji: "💬", unread: 1 },
      { id: "tp-design-feedback", name: "Design Feedback", emoji: "🎯", unread: 1 },
      { id: "tp-design-resources", name: "Resources", emoji: "📚" },
    ],
  },
  {
    id: "sp-mkteam", name: "Marketing Team", category: "group", color: "#d97706", icon: "MK",
    description: "Growth & Content", members: 3,
    topics: [
      { id: "tp-mk-general", name: "General", pinned: true, emoji: "💬" },
      { id: "tp-mk-campaigns", name: "Campaigns", emoji: "📣" },
      { id: "tp-mk-analytics", name: "Analytics", emoji: "📈" },
    ],
  },
  {
    id: "sp-leadership", name: "Ban lãnh đạo", category: "group", color: "#4f46e5", icon: "BL",
    description: "C-level & Managers", members: 3, unread: 1,
    topics: [
      { id: "tp-lead-general", name: "General", pinned: true, emoji: "💬", unread: 1 },
      { id: "tp-lead-decisions", name: "Decisions", emoji: "📋" },
      { id: "tp-lead-okrs", name: "OKRs", emoji: "🎯" },
    ],
  },

  // ── Kênh ── (no sub-items in level 1, uses ChannelSidebar level 2)
  {
    id: "sp-channel", name: "Kênh", category: "channel", color: "#6366f1", icon: "#",
    description: "Kênh thông tin công ty",
    topics: [],
  },

  // ── Dự Án (project-type → has tabs: Chat, List, Board, Table, Calendar, Gantt) ──
  {
    id: "p1", name: "Website Redesign", category: "project", color: "#0891b2", icon: "WR",
    description: "Redesign toàn bộ website v2.0", members: 4, unread: 2,
    topics: [
      { id: "tp-p1-general", name: "General", pinned: true, emoji: "💬", unread: 1, lastMessage: "Bot: Task updated" },
      { id: "tp-p1-design", name: "Design Discussion", emoji: "🎨", unread: 1 },
      { id: "tp-p1-bugs", name: "Bug Reports", emoji: "🐛" },
      { id: "tp-p1-standup", name: "Daily Standup", emoji: "🗓️" },
      { id: "tp-p1-deploy", name: "Deployments", emoji: "🚀" },
    ],
  },
  {
    id: "p2", name: "Mobile App", category: "project", color: "#7c3aed", icon: "MA",
    description: "Phát triển ứng dụng mobile", members: 3,
    topics: [
      { id: "tp-p2-general", name: "General", pinned: true, emoji: "💬" },
      { id: "tp-p2-ios", name: "iOS", emoji: "🍎" },
      { id: "tp-p2-android", name: "Android", emoji: "🤖" },
      { id: "tp-p2-testing", name: "Testing", emoji: "🧪" },
    ],
  },
  {
    id: "p3", name: "API Development", category: "project", color: "#059669", icon: "AD",
    description: "Phát triển API backend", members: 3, unread: 1,
    topics: [
      { id: "tp-p3-general", name: "General", pinned: true, emoji: "💬", unread: 1 },
      { id: "tp-p3-endpoints", name: "Endpoints", emoji: "🔌" },
      { id: "tp-p3-security", name: "Security", emoji: "🔐" },
      { id: "tp-p3-performance", name: "Performance", emoji: "⚡" },
    ],
  },
  {
    id: "p4", name: "Social Campaign", category: "project", color: "#d97706", icon: "SC",
    description: "Chiến dịch marketing Q1", members: 2,
    topics: [
      { id: "tp-p4-general", name: "General", pinned: true, emoji: "💬" },
      { id: "tp-p4-content", name: "Content Plan", emoji: "📝" },
      { id: "tp-p4-metrics", name: "Metrics", emoji: "📊" },
    ],
  },
  {
    id: "p5", name: "Brand Guidelines", category: "project", color: "#db2777", icon: "BG",
    description: "Xây dựng bộ nhận diện thương hiệu", members: 2,
    topics: [
      { id: "tp-p5-general", name: "General", pinned: true, emoji: "💬" },
      { id: "tp-p5-review", name: "Review & Feedback", emoji: "🎯" },
    ],
  },
  {
    id: "p6", name: "UI Kit", category: "project", color: "#4f46e5", icon: "UK",
    description: "Thư viện UI components", members: 2,
    topics: [
      { id: "tp-p6-general", name: "General", pinned: true, emoji: "💬" },
      { id: "tp-p6-components", name: "Components", emoji: "🧩" },
      { id: "tp-p6-docs", name: "Documentation", emoji: "📖" },
    ],
  },

  // ── Bot / AI Agent ──
  {
    id: "sp-botai", name: "Bot / AI Agent", category: "bot", color: "#0d9488", icon: "AI",
    description: "Các trợ lý AI cho toàn bộ team", unread: 3,
    topics: [
      { id: "tp-bot-vwork-chat", name: "VWork Bot", pinned: true, emoji: "🤖", agentId: "vwork_bot", agentStatus: "online", description: "Quản lý task, sprint, daily standup" },
      { id: "tp-bot-vwork-reports", name: "VWork Bot - Báo cáo", emoji: "📊", agentId: "vwork_bot", agentStatus: "online" },
      { id: "tp-bot-vwork-commands", name: "VWork Bot - Commands", emoji: "⌨️", agentId: "vwork_bot", agentStatus: "online" },
      { id: "tp-bot-code-reviews", name: "Code Review Bot", emoji: "👀", unread: 1, agentId: "code_review", agentStatus: "online", description: "AI code review & suggestions" },
      { id: "tp-bot-code-suggestions", name: "Code Suggestions", emoji: "💡", agentId: "code_review", agentStatus: "online" },
      { id: "tp-bot-analytics-reports", name: "Analytics Bot", emoji: "📈", agentId: "analytics", agentStatus: "idle", description: "Báo cáo & phân tích dữ liệu" },
      { id: "tp-bot-analytics-alerts", name: "Analytics - Alerts", emoji: "🚨", agentId: "analytics", agentStatus: "idle" },
      { id: "tp-kb-qa", name: "KB - Hỏi đáp", emoji: "📚", unread: 2, agentId: "kb_agent", agentStatus: "online", description: "Hỏi bot về business, kỹ năng, quy trình nội bộ" },
      { id: "tp-kb-update", name: "KB - Cập nhật", emoji: "✏️", agentId: "kb_agent", agentStatus: "online", description: "Gửi thông tin mới để bot tự động cập nhật knowledge base" },
      { id: "tp-kb-manage", name: "KB - Quản lý", emoji: "🗂️", agentId: "kb_agent", agentStatus: "online", description: "Xem danh sách, tìm kiếm và chỉnh sửa KB entries" },
      { id: "tp-kb-log", name: "KB - Lịch sử cập nhật", emoji: "📜", agentId: "kb_agent", agentStatus: "online", description: "Log toàn bộ các lần KB được cập nhật" },
    ],
  },
];

// Derived projects list for backward compatibility
export const projects: Project[] = spaces
  .filter(s => s.category === "project")
  .map(s => ({ id: s.id, name: s.name, color: s.color, icon: s.icon, spaceId: s.id, description: s.description }));

export const initialTasks: Task[] = [
  {
    id: "t1", title: "Thiết kế trang chủ mới", description: "Tạo mockup cho trang chủ với layout mới, tối ưu UX",
    status: "in_progress", priority: "high", assignee: teamMembers[1], dueDate: "2026-03-20", startDate: "2026-03-10",
    type: "story", tags: ["design", "frontend"], subtasks: [
      { id: "st1", title: "Wireframe", done: true },
      { id: "st2", title: "High-fidelity mockup", done: false },
      { id: "st3", title: "Responsive design", done: false },
    ], createdAt: "2026-03-10", projectId: "p1", epicId: "ep2", storyPoints: 8, timeEstimate: 480, timeSpent: 225, sprintId: "sp1",
    dependencies: [], watchers: ["u1", "u3"],
    comments: [
      { id: "c1", userId: "u1", content: "Wireframe trông rất tốt, Hương tiếp tục nhé!", timestamp: "2026-03-12T09:00:00" },
      { id: "c2", userId: "u2", content: "Em đang làm mockup, chiều nay xong ạ 🎨", timestamp: "2026-03-12T10:30:00" },
    ],
    activityLog: [
      { id: "a1", userId: "u2", action: "changed", field: "status", oldValue: "todo", newValue: "in_progress", timestamp: "2026-03-11T08:00:00" },
      { id: "a2", userId: "u2", action: "completed subtask", field: "Wireframe", timestamp: "2026-03-12T14:00:00" },
    ],
    checklists: [{ id: "cl1", title: "Design Checklist", items: [
      { id: "cli1", text: "Color palette defined", done: true },
      { id: "cli2", text: "Typography selected", done: true },
      { id: "cli3", text: "Icons set chosen", done: false },
    ]}]
  },
  { id: "t2", title: "Implement authentication system", description: "Set up OAuth 2.0 + JWT token refresh", type: "story", status: "in_progress", priority: "urgent", assignee: teamMembers[2], dueDate: "2026-03-18", startDate: "2026-03-08", tags: ["backend", "security"], subtasks: [{ id: "st4", title: "Login/Register API", done: true }, { id: "st5", title: "JWT middleware", done: true }, { id: "st6", title: "OAuth integration", done: false }], createdAt: "2026-03-08", projectId: "p1", epicId: "ep1", storyPoints: 13, timeEstimate: 960, timeSpent: 620, sprintId: "sp1", dependencies: ["t6"], watchers: ["u1"], comments: [{ id: "c3", userId: "u3", content: "JWT middleware done, moving to OAuth", timestamp: "2026-03-14T16:00:00" }], activityLog: [{ id: "a3", userId: "u3", action: "changed", field: "status", oldValue: "todo", newValue: "in_progress", timestamp: "2026-03-09T08:00:00" }] },
  { id: "t3", title: "Database schema optimization", description: "Review và tối ưu hóa cấu trúc DB", type: "task", status: "todo", priority: "normal", assignee: teamMembers[3], dueDate: "2026-03-25", startDate: "2026-03-18", tags: ["backend", "database"], createdAt: "2026-03-12", projectId: "p3", epicId: "ep6", storyPoints: 5, timeEstimate: 360, timeSpent: 0, sprintId: "sp1", dependencies: ["t2"] },
  { id: "t4", title: "Unit test cho payment module", description: "Viết unit test coverage > 80%", type: "task", status: "todo", priority: "high", assignee: teamMembers[4], dueDate: "2026-03-22", startDate: "2026-03-16", tags: ["testing", "backend"], createdAt: "2026-03-11", projectId: "p3", epicId: "ep6", storyPoints: 8, timeEstimate: 480, timeSpent: 0, sprintId: "sp1" },
  { id: "t5", title: "Landing page cho chiến dịch mùa hè", description: "Design và code landing page marketing", type: "story", status: "in_review", priority: "high", assignee: teamMembers[1], dueDate: "2026-03-19", startDate: "2026-03-09", tags: ["design", "marketing"], createdAt: "2026-03-09", projectId: "p4", epicId: "ep7", storyPoints: 8, timeEstimate: 600, timeSpent: 540, sprintId: "sp1" },
  { id: "t6", title: "Setup CI/CD pipeline", description: "Configure GitHub Actions cho auto deploy", type: "story", status: "done", priority: "urgent", assignee: teamMembers[2], dueDate: "2026-03-15", startDate: "2026-03-05", tags: ["devops"], createdAt: "2026-03-05", projectId: "p1", epicId: "ep3", storyPoints: 5, timeEstimate: 240, timeSpent: 300, sprintId: "sp1" },
  { id: "t7", title: "Mobile app onboarding flow", description: "Tạo flow onboarding cho user mới", type: "story", status: "todo", priority: "normal", assignee: teamMembers[1], dueDate: "2026-03-28", startDate: "2026-03-20", tags: ["design", "mobile"], createdAt: "2026-03-13", projectId: "p2", epicId: "ep4", storyPoints: 8, timeEstimate: 360, timeSpent: 0, sprintId: "sp2" },
  { id: "t8", title: "API rate limiting", description: "Implement rate limiter cho public endpoints", type: "story", status: "in_progress", priority: "high", assignee: teamMembers[3], dueDate: "2026-03-21", startDate: "2026-03-10", tags: ["backend", "security"], createdAt: "2026-03-10", projectId: "p3", epicId: "ep6", storyPoints: 5, timeEstimate: 300, timeSpent: 180, sprintId: "sp1" },
  { id: "t9", title: "Design system documentation", description: "Viết docs cho design tokens và components", type: "task", status: "in_review", priority: "normal", assignee: teamMembers[1], dueDate: "2026-03-23", startDate: "2026-03-07", tags: ["design", "docs"], createdAt: "2026-03-07", projectId: "p5", storyPoints: 5, timeEstimate: 420, timeSpent: 380, sprintId: "sp1" },
  { id: "t10", title: "Social media content calendar", description: "Lên kế hoạch content Q2 2026", type: "task", status: "todo", priority: "low", assignee: teamMembers[5], dueDate: "2026-03-30", startDate: "2026-03-22", tags: ["marketing", "content"], createdAt: "2026-03-14", projectId: "p4", epicId: "ep7", storyPoints: 3, timeEstimate: 240, timeSpent: 0, sprintId: "sp2" },
  { id: "t11", title: "Performance audit", description: "Lighthouse audit và fix các issues", type: "task", status: "done", priority: "high", assignee: teamMembers[2], dueDate: "2026-03-14", startDate: "2026-03-06", tags: ["frontend", "performance"], createdAt: "2026-03-06", projectId: "p1", epicId: "ep3", storyPoints: 5, timeEstimate: 300, timeSpent: 280, sprintId: "sp1" },
  { id: "t12", title: "Push notification system", description: "Implement Firebase Cloud Messaging", type: "story", status: "todo", priority: "normal", assignee: teamMembers[3], dueDate: "2026-04-01", startDate: "2026-03-24", tags: ["mobile", "backend"], createdAt: "2026-03-15", projectId: "p2", epicId: "ep5", storyPoints: 8, timeEstimate: 480, timeSpent: 0, sprintId: "sp2" },
  { id: "t13", title: "Component library - Buttons", description: "Tạo button variants cho UI Kit", type: "task", status: "done", priority: "normal", assignee: teamMembers[1], dueDate: "2026-03-12", startDate: "2026-03-04", tags: ["design", "ui-kit"], createdAt: "2026-03-04", projectId: "p6", storyPoints: 3, timeEstimate: 180, timeSpent: 200, sprintId: "sp1" },
  { id: "t14", title: "SEO optimization", description: "Meta tags, schema markup, sitemap", type: "task", status: "in_progress", priority: "normal", assignee: teamMembers[5], dueDate: "2026-03-24", startDate: "2026-03-11", tags: ["marketing", "frontend"], createdAt: "2026-03-11", projectId: "p4", epicId: "ep7", storyPoints: 5, timeEstimate: 360, timeSpent: 120, sprintId: "sp1" },
  { id: "t15", title: "E2E testing với Playwright", description: "Setup và viết E2E tests cho critical flows", type: "story", status: "todo", priority: "high", assignee: teamMembers[4], dueDate: "2026-03-26", startDate: "2026-03-18", tags: ["testing", "devops"], createdAt: "2026-03-13", projectId: "p1", epicId: "ep3", storyPoints: 8, timeEstimate: 600, timeSpent: 0, sprintId: "sp2" },
  { id: "t16", title: "Dark mode support", description: "Thêm dark mode cho toàn bộ UI", type: "story", status: "todo", priority: "normal", assignee: teamMembers[1], tags: ["design", "frontend"], createdAt: "2026-03-15", projectId: "p1", epicId: "ep2", storyPoints: 5, timeEstimate: 360, timeSpent: 0 },
  { id: "t17", title: "Accessibility audit (WCAG 2.1)", description: "Kiểm tra và fix các vấn đề accessibility", type: "task", status: "todo", priority: "high", assignee: teamMembers[2], tags: ["frontend", "testing"], createdAt: "2026-03-16", projectId: "p1", storyPoints: 5, timeEstimate: 300, timeSpent: 0 },
  { id: "t18", title: "Refactor auth middleware", description: "Tách auth middleware thành module riêng", type: "task", status: "todo", priority: "normal", tags: ["backend", "security"], createdAt: "2026-03-17", projectId: "p1", epicId: "ep1", storyPoints: 3, timeEstimate: 180, timeSpent: 0 },
  { id: "t19", title: "Biometric login cho mobile", description: "Face ID / Fingerprint authentication", type: "story", status: "todo", priority: "normal", assignee: teamMembers[3], tags: ["mobile", "security"], createdAt: "2026-03-14", projectId: "p2", epicId: "ep4", storyPoints: 8, timeEstimate: 480, timeSpent: 0 },
  { id: "t20", title: "Caching layer với Redis", description: "Implement Redis cache cho các API query nặng", type: "task", status: "todo", priority: "high", assignee: teamMembers[4], tags: ["backend", "database"], createdAt: "2026-03-15", projectId: "p3", storyPoints: 5, timeEstimate: 360, timeSpent: 0 },
  { id: "t21", title: "Email newsletter template", description: "Thiết kế HTML email template cho chiến dịch", type: "task", status: "todo", priority: "low", assignee: teamMembers[5], tags: ["design", "marketing"], createdAt: "2026-03-16", projectId: "p4", epicId: "ep7", storyPoints: 3, timeEstimate: 240, timeSpent: 0 },
];

export const statusConfig = {
  todo: { label: "To Do", color: "#475569", bg: "rgba(71, 85, 105, 0.10)" },
  in_progress: { label: "In Progress", color: "#0e7490", bg: "rgba(14, 116, 144, 0.10)" },
  in_review: { label: "In Review", color: "#b45309", bg: "rgba(180, 83, 9, 0.10)" },
  done: { label: "Done", color: "#047857", bg: "rgba(4, 120, 87, 0.10)" },
};

export const priorityConfig = {
  urgent: { label: "Urgent", color: "#b91c1c", icon: "●" },
  high: { label: "High", color: "#b45309", icon: "●" },
  normal: { label: "Normal", color: "#0e7490", icon: "●" },
  low: { label: "Low", color: "#64748b", icon: "●" },
};

export const tagColors: Record<string, { bg: string; text: string }> = {
  design: { bg: "#ede9fe", text: "#6d28d9" },
  frontend: { bg: "#e0f2fe", text: "#0369a1" },
  backend: { bg: "#d1fae5", text: "#047857" },
  security: { bg: "#ffedd5", text: "#9a3412" },
  testing: { bg: "#fee2e2", text: "#b91c1c" },
  database: { bg: "#dbeafe", text: "#1d4ed8" },
  marketing: { bg: "#fef3c7", text: "#92400e" },
  mobile: { bg: "#ccfbf1", text: "#0f766e" },
  devops: { bg: "#e0e7ff", text: "#4338ca" },
  content: { bg: "#fce7f3", text: "#9d174d" },
  performance: { bg: "#ffedd5", text: "#9a3412" },
  docs: { bg: "#e2e8f0", text: "#334155" },
  "ui-kit": { bg: "#ede9fe", text: "#6d28d9" },
};

export const avatarGradients = [
  ["#06b6d4", "#0284c7"],
  ["#8b5cf6", "#7c3aed"],
  ["#10b981", "#059669"],
  ["#f59e0b", "#d97706"],
  ["#ec4899", "#db2777"],
  ["#6366f1", "#4f46e5"],
];

export interface TaskComment { id: string; userId: string; content: string; timestamp: string; reactions?: { emoji: string; userIds: string[] }[]; }
export interface ActivityEntry { id: string; userId: string; action: string; field?: string; oldValue?: string; newValue?: string; timestamp: string; }
export interface Checklist { id: string; title: string; items: { id: string; text: string; done: boolean; assigneeId?: string }[]; }
export interface Goal { id: string; title: string; description: string; progress: number; target: number; unit: string; color: string; ownerId: string; dueDate: string; status: "on_track" | "at_risk" | "behind" | "completed"; keyResults: KeyResult[]; }
export interface KeyResult { id: string; title: string; current: number; target: number; unit: string; }
export interface Sprint { id: string; name: string; startDate: string; endDate: string; status: "planning" | "active" | "completed"; goalPoints: number; completedPoints: number; taskIds: string[]; }
export interface Automation { id: string; name: string; trigger: string; conditions: string[]; actions: string[]; enabled: boolean; runsCount: number; lastRun?: string; createdBy: string; }
export interface Reminder { id: string; title: string; description?: string; dueDate: string; dueTime: string; completed: boolean; taskId?: string; userId: string; }
export interface NotepadEntry { id: string; title: string; content: string; color: string; updatedAt: string; pinned: boolean; }
export interface FormTemplate { id: string; title: string; description: string; fields: FormField[]; submissions: number; projectId: string; createdBy: string; active: boolean; }
export interface FormField { id: string; type: "text" | "textarea" | "select" | "date" | "number" | "checkbox" | "email" | "url"; label: string; required: boolean; options?: string[]; placeholder?: string; }

export const goals: Goal[] = [
  { id: "g1", title: "Launch Website v2.0", description: "Complete redesign and launch by end of Q1", progress: 65, target: 100, unit: "%", color: "#0891b2", ownerId: "u1", dueDate: "2026-03-31", status: "on_track", keyResults: [{ id: "kr1", title: "Complete all design mockups", current: 3, target: 5, unit: "pages" }, { id: "kr2", title: "Implement core features", current: 7, target: 12, unit: "features" }, { id: "kr3", title: "Achieve 90+ Lighthouse score", current: 82, target: 90, unit: "score" }] },
  { id: "g2", title: "Mobile App MVP", description: "Release first version of mobile app", progress: 25, target: 100, unit: "%", color: "#7c3aed", ownerId: "u1", dueDate: "2026-04-30", status: "on_track", keyResults: [{ id: "kr4", title: "Complete onboarding flow", current: 0, target: 1, unit: "flow" }, { id: "kr5", title: "Implement push notifications", current: 0, target: 1, unit: "system" }, { id: "kr6", title: "Beta test with 50 users", current: 12, target: 50, unit: "users" }] },
  { id: "g3", title: "API Performance", description: "Optimize API response times", progress: 45, target: 100, unit: "%", color: "#059669", ownerId: "u3", dueDate: "2026-03-31", status: "at_risk", keyResults: [{ id: "kr7", title: "Reduce avg response time", current: 180, target: 100, unit: "ms" }, { id: "kr8", title: "Implement caching", current: 2, target: 5, unit: "endpoints" }, { id: "kr9", title: "99.9% uptime", current: 99.7, target: 99.9, unit: "%" }] },
  { id: "g4", title: "Marketing Q1 Targets", description: "Increase brand awareness and user acquisition", progress: 70, target: 100, unit: "%", color: "#d97706", ownerId: "u6", dueDate: "2026-03-31", status: "on_track", keyResults: [{ id: "kr10", title: "Social media followers", current: 8500, target: 10000, unit: "followers" }, { id: "kr11", title: "Blog posts published", current: 9, target: 12, unit: "posts" }, { id: "kr12", title: "Newsletter subscribers", current: 3200, target: 5000, unit: "subscribers" }] },
];

export const sprints: Sprint[] = [
  { id: "sp1", name: "Sprint 12", startDate: "2026-03-10", endDate: "2026-03-24", status: "active", goalPoints: 75, completedPoints: 13, taskIds: ["t1", "t2", "t3", "t4", "t5", "t6", "t8", "t9", "t11", "t13", "t14"] },
  { id: "sp2", name: "Sprint 13", startDate: "2026-03-25", endDate: "2026-04-07", status: "planning", goalPoints: 27, completedPoints: 0, taskIds: ["t7", "t10", "t12", "t15"] },
];

export const epics: Epic[] = [
  { id: "ep1", title: "Authentication & Security", description: "Toàn bộ tính năng đăng nhập, phân quyền, bảo mật", projectId: "p1", color: "#dc2626", status: "in_progress", startDate: "2026-03-05", dueDate: "2026-03-24", ownerId: "u3" },
  { id: "ep2", title: "Homepage Redesign", description: "Thiết kế lại trang chủ và các trang marketing", projectId: "p1", color: "#7c3aed", status: "in_progress", startDate: "2026-03-10", dueDate: "2026-03-28", ownerId: "u2" },
  { id: "ep3", title: "Performance & DevOps", description: "Tối ưu hiệu suất, CI/CD, monitoring", projectId: "p1", color: "#059669", status: "in_progress", startDate: "2026-03-05", dueDate: "2026-03-20", ownerId: "u3" },
  { id: "ep4", title: "Mobile Onboarding", description: "Luồng onboarding cho ứng dụng mobile", projectId: "p2", color: "#0891b2", status: "todo", startDate: "2026-03-20", dueDate: "2026-04-07", ownerId: "u2" },
  { id: "ep5", title: "Push Notifications", description: "Hệ thống thông báo đẩy cho mobile", projectId: "p2", color: "#d97706", status: "todo", startDate: "2026-03-24", dueDate: "2026-04-07", ownerId: "u4" },
  { id: "ep6", title: "API Optimization", description: "Rate limiting, caching, schema optimization", projectId: "p3", color: "#4f46e5", status: "in_progress", startDate: "2026-03-08", dueDate: "2026-03-25", ownerId: "u4" },
  { id: "ep7", title: "Q2 Marketing Campaign", description: "Chiến dịch marketing mùa hè Q2", projectId: "p4", color: "#db2777", status: "in_progress", startDate: "2026-03-09", dueDate: "2026-03-30", ownerId: "u6" },
];

export const automations: Automation[] = [
  { id: "auto1", name: "Auto-assign reviewer", trigger: "When status changes to In Review", conditions: ["Task has tag 'backend'"], actions: ["Assign Hoàng Đức as reviewer", "Send notification to QA channel"], enabled: true, runsCount: 23, lastRun: "2026-03-15T14:30:00", createdBy: "u1" },
  { id: "auto2", name: "Deadline reminder", trigger: "When task is 2 days before deadline", conditions: ["Task is not Done"], actions: ["Send email to assignee", "Post in project channel"], enabled: true, runsCount: 45, lastRun: "2026-03-16T08:00:00", createdBy: "u1" },
  { id: "auto3", name: "Close completed tasks", trigger: "When all subtasks are completed", conditions: [], actions: ["Change status to Done", "Log completion time"], enabled: true, runsCount: 12, lastRun: "2026-03-14T16:00:00", createdBy: "u3" },
  { id: "auto4", name: "Sprint rollover", trigger: "When sprint ends", conditions: ["Task status is not Done"], actions: ["Move to next sprint", "Notify project manager"], enabled: false, runsCount: 3, lastRun: "2026-03-10T00:00:00", createdBy: "u1" },
  { id: "auto5", name: "Priority escalation", trigger: "When task is overdue", conditions: ["Priority is not Urgent"], actions: ["Escalate priority to High", "Notify team lead"], enabled: true, runsCount: 8, lastRun: "2026-03-16T09:00:00", createdBy: "u1" },
];

export const reminders: Reminder[] = [
  { id: "r1", title: "Review Hương's mockup", description: "Check homepage high-fidelity design", dueDate: "2026-03-16", dueTime: "14:00", completed: false, taskId: "t1", userId: "u1" },
  { id: "r2", title: "Sprint planning meeting", description: "Prepare backlog for Sprint 13", dueDate: "2026-03-17", dueTime: "09:00", completed: false, userId: "u1" },
  { id: "r3", title: "Deploy staging", description: "Push latest changes to staging environment", dueDate: "2026-03-16", dueTime: "17:00", completed: true, taskId: "t6", userId: "u3" },
  { id: "r4", title: "Code review PR #142", dueDate: "2026-03-16", dueTime: "11:00", completed: false, taskId: "t2", userId: "u4" },
  { id: "r5", title: "Design sync with marketing", dueDate: "2026-03-18", dueTime: "10:00", completed: false, userId: "u2" },
];

export const notepadEntries: NotepadEntry[] = [
  { id: "n1", title: "Sprint 12 Notes", content: "- Focus on auth system\n- Design review Friday\n- API rate limiting priority\n- Need to sync with marketing", color: "#ecfeff", updatedAt: "2026-03-16T10:00:00", pinned: true },
  { id: "n2", title: "Meeting action items", content: "1. Update timeline for mobile app\n2. Review design system docs\n3. Setup E2E testing framework\n4. Plan Q2 OKRs", color: "#f3e8ff", updatedAt: "2026-03-15T14:00:00", pinned: false },
  { id: "n3", title: "Architecture decisions", content: "- Use Redis for rate limiting\n- JWT with refresh tokens\n- Firebase for push notifications\n- Playwright for E2E", color: "#ecfdf5", updatedAt: "2026-03-14T11:00:00", pinned: false },
  { id: "n4", title: "Ideas for v2.1", content: "- Dark mode\n- Keyboard shortcuts\n- Offline support\n- Real-time collaboration\n- AI task suggestions", color: "#fefce8", updatedAt: "2026-03-13T16:00:00", pinned: true },
];

export const formTemplates: FormTemplate[] = [
  { id: "f1", title: "Bug Report", description: "Submit a bug report for any issue found", fields: [{ id: "ff1", type: "text", label: "Bug Title", required: true, placeholder: "Brief description..." }, { id: "ff2", type: "select", label: "Severity", required: true, options: ["Critical", "High", "Medium", "Low"] }, { id: "ff3", type: "textarea", label: "Steps to Reproduce", required: true, placeholder: "1. Go to...\n2. Click on...\n3. See error" }, { id: "ff4", type: "text", label: "Expected Behavior", required: true }, { id: "ff5", type: "url", label: "Screenshot URL", required: false }], submissions: 24, projectId: "p1", createdBy: "u1", active: true },
  { id: "f2", title: "Feature Request", description: "Suggest a new feature or improvement", fields: [{ id: "ff6", type: "text", label: "Feature Name", required: true }, { id: "ff7", type: "textarea", label: "Description", required: true, placeholder: "Describe the feature..." }, { id: "ff8", type: "select", label: "Priority", required: true, options: ["Must have", "Nice to have", "Future consideration"] }, { id: "ff9", type: "select", label: "Category", required: false, options: ["UI/UX", "Performance", "New Feature", "Integration"] }], submissions: 18, projectId: "p1", createdBy: "u1", active: true },
  { id: "f3", title: "Design Feedback", description: "Provide feedback on design mockups", fields: [{ id: "ff10", type: "text", label: "Design Name", required: true }, { id: "ff11", type: "select", label: "Rating", required: true, options: ["Excellent", "Good", "Needs Work", "Rejected"] }, { id: "ff12", type: "textarea", label: "Comments", required: true }, { id: "ff13", type: "checkbox", label: "Ready for development", required: false }], submissions: 12, projectId: "p5", createdBy: "u2", active: true },
];

export const activityFeed = [
  { id: "af1", userId: "u2", action: "completed subtask", target: "Wireframe", task: "Thiết kế trang chủ mới", project: "Website Redesign", timestamp: "2026-03-16T09:45:00", type: "subtask" as const },
  { id: "af2", userId: "u3", action: "pushed code to", target: "feature/auth", task: "Implement authentication", project: "Website Redesign", timestamp: "2026-03-16T09:30:00", type: "commit" as const },
  { id: "af3", userId: "u4", action: "commented on", target: "Database schema optimization", task: "Database schema optimization", project: "API Development", timestamp: "2026-03-16T09:15:00", type: "comment" as const },
  { id: "af4", userId: "u1", action: "created task", target: "E2E testing với Playwright", task: "E2E testing với Playwright", project: "Website Redesign", timestamp: "2026-03-16T09:00:00", type: "task" as const },
  { id: "af5", userId: "u5", action: "changed status to", target: "In Review", task: "Landing page cho chiến dịch mùa hè", project: "Social Campaign", timestamp: "2026-03-16T08:45:00", type: "status" as const },
  { id: "af6", userId: "u6", action: "updated description of", target: "SEO optimization", task: "SEO optimization", project: "Social Campaign", timestamp: "2026-03-16T08:30:00", type: "update" as const },
  { id: "af7", userId: "u2", action: "uploaded file to", target: "Design system documentation", task: "Design system docs", project: "Brand Guidelines", timestamp: "2026-03-16T08:15:00", type: "file" as const },
  { id: "af8", userId: "u3", action: "merged PR #138", target: "fix/rate-limiting", task: "API rate limiting", project: "API Development", timestamp: "2026-03-16T08:00:00", type: "commit" as const },
  { id: "af9", userId: "u1", action: "set deadline for", target: "Push notification system", task: "Push notification system", project: "Mobile App", timestamp: "2026-03-15T17:00:00", type: "deadline" as const },
  { id: "af10", userId: "u4", action: "started working on", target: "Unit test cho payment module", task: "Unit test cho payment", project: "API Development", timestamp: "2026-03-15T16:30:00", type: "status" as const },
];