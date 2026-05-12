import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { copyToClipboard } from "./clipboard";
import {
  ListChecks, AtSign, ArrowRight, BarChart3, Calendar, Flag, Zap, Users, Check, Command,
  MessageSquare, Bot, Pin, Plus, Phone, Video, Search, Clock, ThumbsUp, ThumbsDown,
  MoreHorizontal, Smile, Send, Paperclip, Image as ImageIcon, Mic, Sparkles, X,
  ArrowLeft, Hash, PinOff, Reply, Pencil, Trash2, Share2, ChevronRight, AlertTriangle,
  ExternalLink, BellOff, Bell, Volume2, VolumeX, Music, Archive, ChevronDown, CheckCheck,
  Copy, SquareMousePointer, FileText, Download, Play, Pause, Link2, Globe, File as FileIcon,
  Camera, FolderOpen, ArrowDown, Circle, Wifi, Bookmark, BookmarkCheck, CalendarClock,
  Info, ChevronLeft, Link, Settings, UserCheck, Timer, Eye, Volume1,
  FastForward, ChevronUp, Languages, Tag, ShieldBan, Crown, UserMinus,
  Gift, UserPlus, Ban, Square, Megaphone, Mail, User, CheckSquare
} from "lucide-react";
import { type Task, type Topic, type PersonalChatItem, type ChannelItem, teamMembers, spaces as allSpaces, statusConfig, priorityConfig, tagColors, personalChatItems, companyDirectory } from "./data";
import { TaskModal } from "./TaskModal";

interface ChatViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: Task["status"]) => void;
  onPublishAnnouncement?: (title: string, emoji: string, category: string, badge: string, description: string, stats: { label: string; value: string }[], attachment: string, publishedBy: string) => void;
  onAddCategory?: (name: string) => void;
  categories?: string[];
  onAddTask: () => void;
  onSaveTaskFromChat?: (task: Task) => void;
  selectedSpace?: string | null;
  selectedPersonalChat?: string | null;
  groupChats?: PersonalChatItem[];
  extraDMs?: PersonalChatItem[];
  selectedChannel?: string | null;
  channels?: ChannelItem[];
  onStartDM?: (name: string, userId?: string) => void;
  onUpdateChannel?: (channelId: string, patch: Partial<ChannelItem>) => void;
  onOpenGroup?: (groupId: string) => void;
}

interface ChatMessage {
  id: string;
  type: "text" | "task_card" | "report" | "approval" | "bot_response" | "system" | "task_update" | "command_result" | "image" | "file" | "voice" | "link_preview" | "poll" | "announcement_card";
  sender: { id: string; name: string; color: string; isBot?: boolean };
  content: string;
  timestamp: string;
  topicId: string;
  reactions?: { emoji: string; count: number; reacted: boolean }[];
  taskData?: Task;
  reportData?: { title: string; items: { label: string; value: string | number; color: string }[] };
  approvalData?: { title: string; description: string; status: "pending" | "approved" | "rejected" };
  threadCount?: number;
  pinned?: boolean;
  parentId?: string;
  replyToId?: string;
  forwarded?: { fromTopicName: string; fromTopicEmoji?: string };
  edited?: boolean;
  // Media fields
  imageUrl?: string;
  imageCaption?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  voiceDuration?: number;
  voiceWaveform?: number[];
  linkPreview?: { url: string; title: string; description: string; image?: string; domain: string };
  suggestions?: string[];
  agentId?: string;
  // Announcement card
  announcementData?: { title: string; emoji: string; category: string; badge: string; description: string; stats: { label: string; value: string }[] };
  // Personal topic tag
  chatTopicId?: string;
  // Poll fields
  pollData?: {
    question: string;
    options: { id: string; text: string; voterIds: string[] }[];
    multipleChoice: boolean;
    anonymous: boolean;
    closed: boolean;
  };
}

/* ============== MOSAIC AVATAR ============== */
const memberColorMap: Record<string, string> = {
  "Trần Hương": "#7c3aed", "Lê Phúc": "#059669", "Phạm Lan": "#d97706",
  "Hoàng Đức": "#db2777", "Vũ Mai": "#4f46e5", "Nguyễn Tuấn": "#0f766e",
  "Đặng Linh": "#be185d", "Trương Khoa": "#b45309", "Nguyễn Minh": "#0891b2",
};

export function MosaicAvatar({ members, color, size = 32 }: { members: string[]; color: string; size?: number }) {
  const displayMembers = members.slice(0, 4);
  const half = size / 2;
  const gap = 1;

  if (displayMembers.length <= 1) {
    const initials = (displayMembers[0] || "GR").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return (
      <div className="shrink-0 rounded-xl flex items-center justify-center text-white" style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.3, fontWeight: 600 }}>
        {initials}
      </div>
    );
  }

  return (
    <div className="shrink-0 rounded-xl overflow-hidden" style={{ width: size, height: size, backgroundColor: "#e5e7eb" }}>
      <div className="w-full h-full grid" style={{
        gridTemplateColumns: `1fr ${gap}px 1fr`,
        gridTemplateRows: displayMembers.length <= 2 ? "1fr" : `1fr ${gap}px 1fr`,
      }}>
        {displayMembers.map((name, i) => {
          const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
          const bg = memberColorMap[name] || color;
          const cellSize = half - gap / 2;
          const gridStyles: Record<number, React.CSSProperties> = {
            0: displayMembers.length === 2 ? { gridColumn: "1", gridRow: "1" } : displayMembers.length === 3 ? { gridColumn: "1", gridRow: "1" } : { gridColumn: "1", gridRow: "1" },
            1: displayMembers.length === 2 ? { gridColumn: "3", gridRow: "1" } : displayMembers.length === 3 ? { gridColumn: "3", gridRow: "1" } : { gridColumn: "3", gridRow: "1" },
            2: displayMembers.length === 3 ? { gridColumn: "1 / 4", gridRow: "3" } : { gridColumn: "1", gridRow: "3" },
            3: { gridColumn: "3", gridRow: "3" },
          };
          return (
            <div key={i} className="flex items-center justify-center text-white" style={{ backgroundColor: bg, fontSize: Math.max(cellSize * 0.45, 7), fontWeight: 600, ...gridStyles[i] }}>
              {initials}
            </div>
          );
        })}
        {/* Gap lines */}
        <div style={{ gridColumn: "2", gridRow: "1 / -1", backgroundColor: "white" }} />
        {displayMembers.length > 2 && <div style={{ gridColumn: "1 / -1", gridRow: "2", backgroundColor: "white" }} />}
      </div>
    </div>
  );
}

const botUser = { id: "bot", name: "VWork Bot", color: "#0891b2", isBot: true };
const minhUser = { id: "u1", name: "Nguyễn Minh", color: "#0891b2" };
const huongUser = { id: "u2", name: "Trần Hương", color: "#7c3aed" };
const phucUser = { id: "u3", name: "Lê Phúc", color: "#059669" };
const lanUser = { id: "u4", name: "Phạm Lan", color: "#d97706" };
const ducUser = { id: "u5", name: "Hoàng Đức", color: "#db2777" };

// Online status: "online" | "away" | "offline"
const userOnlineStatus: Record<string, "online" | "away" | "offline"> = {
  "u1": "online", // Minh (me)
  "u2": "online", // Hương
  "u3": "online", // Phúc
  "u4": "away",   // Lan
  "u5": "offline", // Đức
  "bot": "online",
};

const onlineStatusColor: Record<string, string> = {
  online: "#22c55e",
  away: "#f59e0b",
  offline: "#9ca3af",
};

const now = new Date();
const fmt = (h: number, m: number) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

// ============== FORMAT TIME HELPER ==============
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

// ============== GROUP DATA WITH TIMESTAMPS ==============
const groupsWithTimestamps = [
  { id: "cg1",  name: "Team Frontend",    emoji: "💻", color: "#0891b2", members: 8,  timestamp: new Date(now.getTime() - 0 * 60 * 1000),               lastMessage: "Build mới đã deploy lên staging ✅" },
  { id: "cg2",  name: "Dự án VWork Pro",  emoji: "🚀", color: "#7c3aed", members: 12, timestamp: new Date(now.getTime() - 5 * 60 * 1000),               lastMessage: "Demo client chiều nay lúc 3h nhé mọi người" },
  { id: "cg6",  name: "Coffee Chat",      emoji: "☕", color: "#d97706", members: 15, timestamp: new Date(now.getTime() - 30 * 60 * 1000),             lastMessage: "Ai đi cafe chiều nay không? ☕" },
  { id: "cg7",  name: "Code Review",      emoji: "🔍", color: "#4f46e5", members: 7,  timestamp: new Date(now.getTime() - 45 * 60 * 1000),             lastMessage: "PR #158 cần review gấp trước EOD" },
  { id: "cg3",  name: "Design Review",    emoji: "🎨", color: "#db2777", members: 5,  timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),         lastMessage: "Figma file đã cập nhật, mời review" },
  { id: "cg4",  name: "Sprint Planning",  emoji: "📋", color: "#059669", members: 10, timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),         lastMessage: "Sprint 13 kickoff meeting lúc 9h sáng" },
  { id: "cg5",  name: "Bug Reports",      emoji: "🐛", color: "#dc2626", members: 6,  timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000),         lastMessage: "Critical bug trên prod đã được fix" },
  { id: "cg8",  name: "DevOps & Infra",   emoji: "⚙️", color: "#0f766e", members: 4,  timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),         lastMessage: "K8s cluster đã scale up xong" },
  { id: "cg9",  name: "Product Roadmap",  emoji: "🗺️", color: "#be185d", members: 9,  timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),     lastMessage: "Q3 roadmap đã được approve từ ban lãnh đạo" },
  { id: "cg10", name: "Tech Talks",       emoji: "🎤", color: "#6366f1", members: 20, timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),     lastMessage: "Buổi talk tuần tới chủ đề AI/LLM" },
  { id: "cg11", name: "Onboarding",       emoji: "👋", color: "#14b8a6", members: 6,  timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),     lastMessage: "Chào mừng Bảo và Nhung join team! 🎉" },
  { id: "cg12", name: "Company Updates",  emoji: "📢", color: "#f59e0b", members: 45, timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),     lastMessage: "Kết quả kinh doanh Q1 đã được công bố" },
  { id: "cg13", name: "Hackathon 2026",   emoji: "⚡", color: "#8b5cf6", members: 18, timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),     lastMessage: "Ý tưởng của team mình lọt top 3 🏆" },
  { id: "cg14", name: "Book Club",        emoji: "📚", color: "#ec4899", members: 11, timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),     lastMessage: "Tuần này đọc chương 5-7 của Atomic Habits nhé" },
  { id: "cg15", name: "Fitness & Health", emoji: "💪", color: "#10b981", members: 13, timestamp: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),    lastMessage: "Kết quả marathon nội bộ cuối tuần 🏃" },
];

// Sort by timestamp descending (newest first) and format lastActive
export const commonGroups = groupsWithTimestamps
  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  .map(g => ({
    id: g.id,
    name: g.name,
    emoji: g.emoji,
    color: g.color,
    members: g.members,
    lastActive: getTimeAgo(g.timestamp),
    lastMessage: g.lastMessage,
  }));


const initialMessages: ChatMessage[] = [
  { id: "m1", type: "system", sender: botUser, content: "Sprint 12 đã bắt đầu — Chào mừng tuần mới! 🚀", timestamp: fmt(8, 0), topicId: "tp-gen-all" },
  { id: "m2", type: "bot_response", sender: botUser, content: "📊 **Daily Standup Summary** — Hôm nay có 4 tasks In Progress, 2 tasks cần Review, 3 tasks Overdue. Team cần focus vào deadline cuối tuần.", timestamp: fmt(8, 30), topicId: "tp-gen-all", reactions: [{ emoji: "👍", count: 4, reacted: true }, { emoji: "🔥", count: 2, reacted: false }], pinned: true },
  { id: "m3", type: "text", sender: minhUser, content: "Team ơi, sprint mới bắt đầu rồi. Mọi người check board và update status nhé! @Trần Hương mockup trang chủ xong chưa?", timestamp: fmt(9, 15), topicId: "tp-gen-all", reactions: [{ emoji: "✅", count: 3, reacted: false }], pinned: true },
  { id: "m4", type: "text", sender: huongUser, content: "Em đang làm high-fidelity mockup, chiều nay xong ạ. Wireframe đã pass review rồi 🎨", timestamp: fmt(9, 22), topicId: "tp-gen-all", replyToId: "m3" },
  { id: "m5", type: "task_update", sender: botUser, content: "🔄 **Task Updated** — Lê Phúc đã chuyển \"Setup CI/CD pipeline\" sang **Done** ", timestamp: fmt(9, 45), topicId: "tp-gen-all" },
  { id: "m6", type: "text", sender: phucUser, content: "CI/CD pipeline đã hoàn thành! GitHub Actions auto-deploy lên staging mỗi khi merge vào develop. Production deploy qua manual approval.", timestamp: fmt(9, 50), topicId: "tp-gen-all", threadCount: 3, reactions: [{ emoji: "🎉", count: 5, reacted: true }, { emoji: "💪", count: 3, reacted: false }] },
  { id: "m7", type: "approval", sender: minhUser, content: "Cần phê duyệt budget cho tính năng Push Notification", timestamp: fmt(10, 0), topicId: "tp-gen-all", approvalData: { title: "Budget Approval: Push Notification System", description: "Firebase Cloud Messaging + Server infrastructure — Estimated: $2,400/month", status: "pending" } },
  { id: "m8", type: "text", sender: lanUser, content: "Mình đang review API rate limiting PR. Có vài concerns về Redis caching strategy, mình sẽ comment trên GitHub nhé.", timestamp: fmt(10, 30), topicId: "tp-gen-all" },
  { id: "m9-img", type: "image", sender: huongUser, content: "", timestamp: fmt(11, 0), topicId: "tp-gen-all", imageUrl: "https://images.unsplash.com/photo-1665470909939-959569b20021?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBhcHBsaWNhdGlvbiUyMGRhc2hib2FyZCUyMGRlc2lnbnxlbnwxfHx8fDE3NzM3MjgxMTR8MA&ixlib=rb-4.1.0&q=80&w=1080", imageCaption: "Dashboard mockup v2 — feedback welcome! 🎨" },
  { id: "m10-file", type: "file", sender: phucUser, content: "Đây là migration script cho v2 schema", timestamp: fmt(11, 15), topicId: "tp-gen-all", fileName: "migration_v2_schema.sql", fileSize: "24.5 KB", fileType: "sql" },
  { id: "m11-voice", type: "voice", sender: minhUser, content: "", timestamp: fmt(11, 30), topicId: "tp-gen-all", voiceDuration: 12, voiceWaveform: [0.3, 0.5, 0.8, 0.6, 0.9, 1.0, 0.7, 0.4, 0.6, 0.8, 0.5, 0.3, 0.7, 0.9, 0.6, 0.4, 0.2, 0.5, 0.7, 0.3] },
  { id: "m12-link", type: "link_preview", sender: ducUser, content: "Mọi người xem bài này nhé, rất hữu ích cho dự án https://react.dev/blog", timestamp: fmt(11, 45), topicId: "tp-gen-all", linkPreview: { url: "https://react.dev/blog", title: "React Blog – React", description: "This blog is the official source for the updates from the React team. Anything important will be posted here first.", domain: "react.dev" } },
  { id: "m13-img2", type: "image", sender: minhUser, content: "", timestamp: fmt(12, 0), topicId: "tp-gen-all", imageUrl: "https://images.unsplash.com/photo-1681949215173-fe0d15c790c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwbWVldGluZyUyMG9mZmljZSUyMHdoaXRlYm9hcmR8ZW58MXx8fHwxNzczNzU1MTg5fDA&ixlib=rb-4.1.0&q=80&w=1080", imageCaption: "Planning session sáng nay 📋" },
  { id: "m14-file2", type: "file", sender: lanUser, content: "API docs đã cập nhật", timestamp: fmt(12, 15), topicId: "tp-gen-all", fileName: "API_Documentation_v3.pdf", fileSize: "1.2 MB", fileType: "pdf" },
  { id: "m6-r1", type: "text", sender: minhUser, content: "Nice! Auto-deploy chạy mất bao lâu vậy Phúc?", timestamp: fmt(9, 55), topicId: "tp-gen-all", parentId: "m6" },
  { id: "m6-r2", type: "text", sender: phucUser, content: "Build + test + deploy tầm 4-5 phút. Nếu chỉ deploy thôi thì 1-2 phút.", timestamp: fmt(10, 2), topicId: "tp-gen-all", parentId: "m6" },
  { id: "m6-r3", type: "text", sender: ducUser, content: "Tuyệt vời! Thêm Slack notification khi deploy xong được không? 🔔", timestamp: fmt(10, 10), topicId: "tp-gen-all", parentId: "m6" },
  { id: "m20", type: "text", sender: phucUser, content: "Mọi người review PR #142 giúp mình nhé — Authentication JWT refresh token flow.", timestamp: fmt(8, 15), topicId: "tp-dev-general", reactions: [{ emoji: "👀", count: 2, reacted: false }], threadCount: 2 },
  { id: "m21", type: "command_result", sender: botUser, content: "", timestamp: fmt(8, 20), topicId: "tp-dev-general", reportData: { title: "📋 Sprint 12 — Dev Tasks", items: [{ label: "Authentication system", value: "In Progress", color: "#0891b2" }, { label: "API rate limiting", value: "In Progress", color: "#0891b2" }, { label: "Database schema optimization", value: "To Do", color: "#64748b" }, { label: "Push notification system", value: "To Do", color: "#64748b" }, { label: "E2E testing", value: "To Do", color: "#64748b" }] }, pinned: true },
  { id: "m22", type: "text", sender: lanUser, content: "PR reviewed, mình approve rồi. Nhớ add thêm rate limit cho refresh endpoint nhé 👍", timestamp: fmt(10, 0), topicId: "tp-dev-general" },
  { id: "m23", type: "text", sender: phucUser, content: "Done! Đã thêm rate limit 10 req/min cho /auth/refresh. Merge được rồi.", timestamp: fmt(10, 15), topicId: "tp-dev-general" },
  { id: "m20-r1", type: "text", sender: lanUser, content: "Đang review, sẽ xong trước 3h chiều.", timestamp: fmt(9, 0), topicId: "tp-dev-general", parentId: "m20" },
  { id: "m20-r2", type: "text", sender: minhUser, content: "Mình cũng sẽ review phần security flow.", timestamp: fmt(9, 30), topicId: "tp-dev-general", parentId: "m20" },
  { id: "m24", type: "text", sender: phucUser, content: "Database migration script cho v2 schema đã ready. Mọi người review trước khi run lên staging.", timestamp: fmt(14, 0), topicId: "tp-dev-backend", pinned: true },
  { id: "m25", type: "text", sender: lanUser, content: "Reviewed, LGTM! Nhớ backup trước khi migrate nhé 💪", timestamp: fmt(14, 20), topicId: "tp-dev-backend" },
  { id: "m30", type: "bot_response", sender: botUser, content: "📊 **Website Redesign Progress** — 2/5 tasks completed (40%). Deadline gần nhất: Authentication system (18/03).", timestamp: fmt(8, 0), topicId: "tp-p1-general", pinned: true },
  { id: "m31", type: "text", sender: huongUser, content: "Wireframe trang Products và About đã xong. Mình upload lên Figma rồi, anh Minh review giúp nhé!", timestamp: fmt(9, 0), topicId: "tp-p1-general", reactions: [{ emoji: "😍", count: 2, reacted: false }] },
  { id: "m32", type: "text", sender: minhUser, content: "Đẹp lắm Hương! Mình thích layout Products page. Chỉ cần adjust spacing ở hero section một chút.", timestamp: fmt(9, 30), topicId: "tp-p1-general" },
  { id: "m33", type: "text", sender: huongUser, content: "Mọi người thấy color scheme này thế nào? Em đang dùng palette Cyan-Teal cho primary, Gray cho text.", timestamp: fmt(11, 0), topicId: "tp-p1-design", reactions: [{ emoji: "💯", count: 3, reacted: true }], threadCount: 1 },
  { id: "m34", type: "text", sender: minhUser, content: "Rất clean và modern! Đúng hướng rồi Hương.", timestamp: fmt(11, 15), topicId: "tp-p1-design" },
  { id: "m33-r1", type: "text", sender: ducUser, content: "Đồng ý! Có thể thêm accent color cho CTA buttons không?", timestamp: fmt(11, 20), topicId: "tp-p1-design", parentId: "m33" },
  { id: "m50", type: "report", sender: botUser, content: "", timestamp: fmt(8, 0), topicId: "tp-bot-vwork-chat", reportData: { title: "📊 Weekly Report — Sprint 12", items: [{ label: "Total Tasks", value: 15, color: "#0891b2" }, { label: "Completed", value: 3, color: "#059669" }, { label: "In Progress", value: 4, color: "#0891b2" }, { label: "Overdue", value: 2, color: "#dc2626" }, { label: "Completion Rate", value: "20%", color: "#7c3aed" }, { label: "Team Velocity", value: "12 pts", color: "#d97706" }] }, pinned: true },
  { id: "m51", type: "bot_response", sender: botUser, content: "⚠️ **Overdue Alert** — 2 tasks đã quá hạn:\n• \"Implement authentication system\" (Due: 18/03) — Assigned: Lê Phúc\n• \"Landing page cho chiến dịch mùa hè\" (Due: 19/03) — Assigned: Trần Hương\n\nBạn có muốn gia hạn deadline hoặc reassign không?", timestamp: fmt(8, 5), topicId: "tp-bot-vwork-chat" },
  { id: "m60", type: "text", sender: ducUser, content: "Ai đi lunch không? 🍜", timestamp: fmt(11, 30), topicId: "tp-rand-chat" },
  { id: "m61", type: "text", sender: huongUser, content: "Đi! Bún bò Huế nhé 😋", timestamp: fmt(11, 32), topicId: "tp-rand-chat" },
  { id: "m62", type: "text", sender: phucUser, content: "+1, 12h meet ở lobby nhé", timestamp: fmt(11, 33), topicId: "tp-rand-chat", reactions: [{ emoji: "🍜", count: 3, reacted: true }] },
  { id: "m70", type: "text", sender: huongUser, content: "Update: Design system v2 đã hoàn thành 80%. Sẽ share Figma link trong tuần này.", timestamp: fmt(10, 0), topicId: "tp-design-general", reactions: [{ emoji: "🎨", count: 2, reacted: false }] },
  { id: "m80", type: "bot_response", sender: { id: "bot-code", name: "Code Review Bot", color: "#6366f1", isBot: true }, content: "🔍 **PR #145 Review Complete**\n\n✅ No critical issues found\n⚠️ 2 warnings: unused imports, missing error handling\n💡 1 suggestion: consider memoizing expensive computation in line 142\n\nOverall: **Approved with suggestions**", timestamp: fmt(9, 0), topicId: "tp-bot-code-reviews" },
  // ── KB Agent Messages ──
  { id: "kb-qa-1", type: "bot_response", sender: { id: "bot-kb", name: "KB Agent", color: "#7c3aed", isBot: true }, content: "Xin chào! Tôi là **KB Agent** — trợ lý tri thức của công ty.\n\nBạn có thể hỏi tôi bất cứ điều gì về:\n\n• **Quy trình nội bộ**: onboarding, phê duyệt, báo cáo\n• **Business rules**: chính sách, tiêu chuẩn vận hành\n• **Kỹ năng & hướng dẫn**: cách dùng tool, best practices\n• **Thông tin dự án**: tóm tắt, lịch sử, quyết định\n\nHỏi thôi nào! 💡", timestamp: fmt(8, 0), topicId: "tp-kb-qa", pinned: true },
  { id: "kb-qa-2", type: "text", sender: minhUser, content: "Quy trình phê duyệt ngân sách chi phí marketing là gì?", timestamp: fmt(9, 15), topicId: "tp-kb-qa" },
  { id: "kb-qa-3", type: "bot_response", sender: { id: "bot-kb", name: "KB Agent", color: "#7c3aed", isBot: true }, content: "**Quy trình phê duyệt ngân sách Marketing:**\n\n1. **Team lead** tạo request → điền form chi tiết khoản chi\n2. **Marketing Manager** duyệt nếu ≤ 5 triệu VNĐ\n3. **CFO** duyệt thêm nếu 5–50 triệu VNĐ\n4. **CEO** duyệt nếu > 50 triệu VNĐ\n\n⏱ SLA: 1–3 ngày làm việc\n📄 Form: Workchat → Finance Channel → Budget Request\n\n*Nguồn: Business Rules v2.3 — cập nhật 15/01/2026*", timestamp: fmt(9, 16), topicId: "tp-kb-qa", reactions: [{ emoji: "👍", count: 3, reacted: true }] },
  { id: "kb-qa-4", type: "text", sender: lanUser, content: "Onboarding checklist cho dev mới gồm những gì?", timestamp: fmt(10, 30), topicId: "tp-kb-qa" },
  { id: "kb-qa-5", type: "bot_response", sender: { id: "bot-kb", name: "KB Agent", color: "#7c3aed", isBot: true }, content: "**Onboarding Checklist — Developer:**\n\n**Ngày 1:**\n☐ Nhận máy tính & setup VPN\n☐ Tạo tài khoản: GitHub, Workchat, AWS\n☐ Clone repos chính & chạy thử local\n\n**Tuần 1:**\n☐ Đọc Architecture Doc\n☐ Setup môi trường dev\n☐ Pair programming với senior\n☐ Complete task đầu tiên\n\n**Tháng 1:**\n☐ Deliver feature độc lập\n☐ Tham gia code review\n☐ 30-day check-in với manager\n\n*Nguồn: HR Handbook v4.1 — cập nhật 01/03/2026*", timestamp: fmt(10, 31), topicId: "tp-kb-qa" },
  { id: "kb-up-1", type: "bot_response", sender: { id: "bot-kb", name: "KB Agent", color: "#7c3aed", isBot: true }, content: "Kênh này để **cập nhật tri thức vào KB**.\n\nKhi bạn gửi thông tin mới, tôi sẽ tự động phân loại và lưu vào Knowledge Base. Dùng tag để phân loại rõ hơn:\n\n`#rule` — Chính sách, quy định\n`#process` — Quy trình thực hiện\n`#decision` — Quyết định của team\n`#skill` — Kỹ năng, hướng dẫn\n`#market` — Thông tin thị trường", timestamp: fmt(8, 0), topicId: "tp-kb-update", pinned: true },
  { id: "kb-up-2", type: "text", sender: ducUser, content: "#decision Meeting 28/03: Team quyết định migrate từ REST sang GraphQL cho API v3. Bắt đầu từ Sprint 14. Lead: Lê Phúc.", timestamp: fmt(9, 0), topicId: "tp-kb-update" },
  { id: "kb-up-3", type: "bot_response", sender: { id: "bot-kb", name: "KB Agent", color: "#7c3aed", isBot: true }, content: "✅ **Đã cập nhật KB** — 1 quyết định mới được lưu\n\n📌 **Decision #D-2026-031**\n**Tiêu đề:** Migration API từ REST sang GraphQL\n**Ngày:** 28/03/2026 | **Lead:** Lê Phúc | **Bắt đầu:** Sprint 14\n**Tags:** Architecture, API, Backend\n\n*KB đã được index và sẵn sàng tìm kiếm*", timestamp: fmt(9, 1), topicId: "tp-kb-update", reactions: [{ emoji: "✅", count: 2, reacted: false }] },
  { id: "kb-up-4", type: "text", sender: minhUser, content: "#rule Chính sách WFH mới: Mỗi nhân viên được WFH tối đa 3 ngày/tuần. Cần thông báo trước 24h qua Workchat. Hiệu lực từ 01/04/2026.", timestamp: fmt(11, 0), topicId: "tp-kb-update" },
  { id: "kb-up-5", type: "bot_response", sender: { id: "bot-kb", name: "KB Agent", color: "#7c3aed", isBot: true }, content: "✅ **Đã cập nhật KB** — Business Rule mới\n\n📌 **Rule #HR-2026-012**\n**Tiêu đề:** Chính sách Work From Home\n**Nội dung:** WFH tối đa 3 ngày/tuần, thông báo trước 24h\n**Hiệu lực:** 01/04/2026 | **Phân loại:** HR Policy\n\n*Đã thay thế Rule #HR-2025-008 (WFH 2 ngày/tuần)*", timestamp: fmt(11, 1), topicId: "tp-kb-update" },
  { id: "kb-mg-1", type: "bot_response", sender: { id: "bot-kb", name: "KB Agent", color: "#7c3aed", isBot: true }, content: "**Knowledge Base — Tổng quan:**\n\n📊 **Thống kê hiện tại:**\n• 🗂️ Tổng entries: **247**\n• 📋 Business Rules: **58**\n• 📄 Processes: **43**\n• 💡 Skills & How-tos: **89**\n• 🎯 Decisions: **32**\n• 📈 Market Knowledge: **25**\n\n⚡ Lần cập nhật gần nhất: **hôm nay 11:01**\n🔍 Queries trong 7 ngày: **134**", timestamp: fmt(8, 0), topicId: "tp-kb-manage", pinned: true },
  { id: "kb-log-1", type: "bot_response", sender: { id: "bot-kb", name: "KB Agent", color: "#7c3aed", isBot: true }, content: "**Lịch sử cập nhật KB — Tuần này:**\n\n| Thời gian | Loại | Tiêu đề | Người cập nhật |\n|-----------|------|---------|----------------|\n| 31/03 11:01 | 📋 Rule | WFH Policy 3 ngày/tuần | Nguyễn Minh |\n| 31/03 09:01 | 🎯 Decision | Migrate API sang GraphQL | Nguyễn Đức |\n| 30/03 15:30 | 💡 Skill | Best practices React Query v5 | Lê Phúc |\n| 30/03 10:00 | 📄 Process | Quy trình deploy production v2 | Lê Phúc |\n| 29/03 14:15 | 📋 Rule | Chính sách review code PR | Nguyễn Minh |\n| 28/03 09:00 | 📈 Market | Báo cáo competitor Q1/2026 | Trần Hương |", timestamp: fmt(8, 0), topicId: "tp-kb-log", pinned: true },
  // ── Personal DM Messages ──
  { id: "pdm-h1", type: "text", sender: huongUser, content: "Anh ơi, em gửi bản thiết kế mới cho trang Dashboard rồi nhé!", timestamp: fmt(10, 15), topicId: "pc-dm-huong" },
  { id: "pdm-h2", type: "text", sender: minhUser, content: "OK em, anh xem ngay. Figma link nhé?", timestamp: fmt(10, 18), topicId: "pc-dm-huong" },
  { id: "pdm-h3", type: "text", sender: huongUser, content: "Dạ, em share qua Figma rồi ạ. Anh check email nhé 📧", timestamp: fmt(10, 20), topicId: "pc-dm-huong" },
  { id: "pdm-h4", type: "text", sender: huongUser, content: "Chị ơi, em gửi bản thiết kế mới rồi nhé!", timestamp: fmt(10, 32), topicId: "pc-dm-huong" },
  { id: "pdm-p1", type: "text", sender: phucUser, content: "Anh ơi, PR #142 đã merge rồi. Anh review giúp em flow mới nhé", timestamp: fmt(9, 30), topicId: "pc-dm-phuc" },
  { id: "pdm-p2", type: "text", sender: minhUser, content: "Nice, anh sẽ review trong sáng nay 👍", timestamp: fmt(9, 35), topicId: "pc-dm-phuc" },
  { id: "pdm-p3", type: "text", sender: phucUser, content: "PR #142 đã merge, anh review giúp em nhé", timestamp: fmt(9, 45), topicId: "pc-dm-phuc" },
  { id: "pdm-l1", type: "text", sender: lanUser, content: "Anh Minh, em tìm thấy bug trong payment module rồi ạ", timestamp: fmt(14, 0), topicId: "pc-dm-lan" },
  { id: "pdm-l2", type: "text", sender: minhUser, content: "Bug gì vậy Lan? Critical không?", timestamp: fmt(14, 5), topicId: "pc-dm-lan" },
  { id: "pdm-l3", type: "text", sender: lanUser, content: "OK anh, em sẽ fix bug đó trước 5h chiều", timestamp: fmt(14, 10), topicId: "pc-dm-lan" },
  { id: "pdm-d1", type: "text", sender: ducUser, content: "Anh Minh, test case cho module payment đã pass hết!", timestamp: fmt(8, 10), topicId: "pc-dm-duc" },
  { id: "pdm-d2", type: "text", sender: minhUser, content: "Tuyệt vời Đức! Coverage bao nhiêu %?", timestamp: fmt(8, 12), topicId: "pc-dm-duc" },
  { id: "pdm-d3", type: "text", sender: ducUser, content: "Test case cho module payment đã pass hết!", timestamp: fmt(8, 15), topicId: "pc-dm-duc" },
  { id: "pdm-m1", type: "text", sender: { id: "u6", name: "Vũ Mai", color: "#4f46e5" }, content: "Anh có thể check giúp em landing page ko?", timestamp: fmt(16, 0), topicId: "pc-dm-mai" },
  { id: "pdm-m2", type: "text", sender: minhUser, content: "Để anh xem, chiều nay feedback nhé", timestamp: fmt(16, 5), topicId: "pc-dm-mai" },
  { id: "pdm-t1", type: "text", sender: { id: "u7", name: "Nguyễn Tuấn", color: "#0f766e" }, content: "Cuộc họp ngày mai bị dời sang 3h chiều nhé anh", timestamp: fmt(11, 0), topicId: "pc-dm-tuan" },
  { id: "pdm-t2", type: "text", sender: minhUser, content: "OK Tuấn, anh note lại rồi 📝", timestamp: fmt(11, 5), topicId: "pc-dm-tuan" },
  { id: "pdm-li1", type: "text", sender: { id: "u8", name: "Đặng Linh", color: "#be185d" }, content: "Em đã deploy lên staging rồi ạ", timestamp: fmt(11, 18), topicId: "pc-dm-linh" },
  { id: "pdm-li2", type: "text", sender: minhUser, content: "Good job Linh! Anh sẽ test ngay", timestamp: fmt(11, 22), topicId: "pc-dm-linh" },
  { id: "pdm-k1", type: "text", sender: { id: "u9", name: "Trương Khoa", color: "#b45309" }, content: "Sprint review chiều nay nhé team", timestamp: fmt(7, 28), topicId: "pc-dm-khoa" },
  { id: "pdm-k2", type: "text", sender: minhUser, content: "OK Khoa, anh chuẩn bị slides rồi", timestamp: fmt(7, 35), topicId: "pc-dm-khoa" },
  // Images in DM with Hương (2 images for lightbox sliding)
  { id: "pdm-h-img1", type: "image", sender: huongUser, content: "", timestamp: fmt(10, 25), topicId: "pc-dm-huong", imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80", imageCaption: "Design mockup mới cho trang Dashboard 🎨" },
  { id: "pdm-h-img2", type: "image", sender: huongUser, content: "", timestamp: fmt(10, 28), topicId: "pc-dm-huong", imageUrl: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=80", imageCaption: "Mobile version - anh xem thêm nhé!" },
  // Images in group chat cg1 (Team Frontend) - 3 images for lightbox sliding
  { id: "cg1-img1", type: "image", sender: phucUser, content: "", timestamp: fmt(9, 15), topicId: "cg1", imageUrl: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&q=80", imageCaption: "Screenshot staging build mới ✅" },
  { id: "cg1-img2", type: "image", sender: lanUser, content: "", timestamp: fmt(9, 30), topicId: "cg1", imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80", imageCaption: "Bug trên mobile - responsive cần fix" },
  { id: "cg1-img3", type: "image", sender: minhUser, content: "", timestamp: fmt(9, 50), topicId: "cg1", imageUrl: "https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=800&q=80", imageCaption: "Fixed! Xem kết quả nhé team 🎉" },
  // ── Personal tools messages ──
  { id: "pnote-1", type: "text", sender: minhUser, content: "📝 TODO hôm nay:\n- Review PR #142\n- Check mockup Dashboard\n- Họp sprint review 3h chiều\n- Fix bug payment module", timestamp: fmt(8, 0), topicId: "pc-notes" },
  { id: "pnote-2", type: "text", sender: minhUser, content: "💡 Ý tưởng: Thêm dark mode cho app, AI suggest tasks", timestamp: fmt(9, 0), topicId: "pc-notes" },
  { id: "psaved-1", type: "text", sender: botUser, content: "📌 Tin nhắn đã lưu từ #general:\n\"Sprint 12 đã bắt đầu — Chào mừng tuần mới! 🚀\"", timestamp: fmt(8, 30), topicId: "pc-saved" },
  { id: "pjournal-1", type: "text", sender: minhUser, content: "📅 Standup 18/03:\n✅ Hôm qua: Review design, merge PR auth\n🔄 Hôm nay: Sprint planning, review payment bug\n🚫 Blockers: Chờ approval budget push notification", timestamp: fmt(9, 0), topicId: "pc-journal" },
  // ── Group chat seed messages ──
  { id: "cg1-1", type: "text", sender: phucUser, content: "Build mới đã deploy lên staging ✅ Mọi người test thử nhé", timestamp: fmt(9, 10), topicId: "cg1" },
  { id: "cg1-2", type: "text", sender: lanUser, content: "Test xong rồi, có 1 minor bug ở responsive mobile, đang fix", timestamp: fmt(9, 25), topicId: "cg1" },
  { id: "cg1-3", type: "text", sender: minhUser, content: "Tốt lắm team! Deadline cuối tuần này, mình đang track progress 💪", timestamp: fmt(9, 40), topicId: "cg1" },
  { id: "cg2-1", type: "text", sender: { id: "u6", name: "Vũ Mai", color: "#4f46e5" }, content: "Demo client chiều nay lúc 3h nhé mọi người! Chuẩn bị slides chưa ai?", timestamp: fmt(8, 30), topicId: "cg2" },
  { id: "cg2-2", type: "text", sender: ducUser, content: "Anh Minh chuẩn bị phần architecture overview nhé, em lo phần live demo", timestamp: fmt(8, 45), topicId: "cg2" },
  { id: "cg2-3", type: "text", sender: minhUser, content: "OK, anh đã cập nhật slides rồi. Mọi người vào meet link lúc 14:50 warm up nhé!", timestamp: fmt(8, 50), topicId: "cg2" },
  { id: "cg3-1", type: "text", sender: huongUser, content: "Figma file đã cập nhật, mọi người vào review nhé 🎨", timestamp: fmt(10, 0), topicId: "cg3" },
  { id: "cg3-2", type: "text", sender: lanUser, content: "Typography system trông rất clean! Chỉ cần adjust spacing ở card component", timestamp: fmt(10, 30), topicId: "cg3" },
  { id: "cg4-1", type: "text", sender: minhUser, content: "Sprint 13 kickoff 9h sáng mai. User stories đã được groom xong hết rồi nhé", timestamp: fmt(16, 0), topicId: "cg4" },
  { id: "cg4-2", type: "text", sender: phucUser, content: "Team đang có capacity bao nhiêu points sprint này anh?", timestamp: fmt(16, 10), topicId: "cg4" },
  { id: "cg4-3", type: "text", sender: minhUser, content: "Estimate 42 points, sprint trước đạt 38. Mình set target 40 nhé", timestamp: fmt(16, 15), topicId: "cg4" },
  { id: "cg5-1", type: "text", sender: phucUser, content: "Critical bug trên prod đã được fix và deploy 🎉 Response time về 120ms", timestamp: fmt(11, 0), topicId: "cg5" },
  { id: "cg5-2", type: "text", sender: minhUser, content: "Root cause là gì vậy? Cần document lại để tránh tái diễn", timestamp: fmt(11, 10), topicId: "cg5" },
  { id: "cg5-3", type: "text", sender: phucUser, content: "N+1 query trong product listing. Đã fix bằng eager loading + cache. Postmortem sẽ có sau", timestamp: fmt(11, 20), topicId: "cg5" },
  { id: "cg6-1", type: "text", sender: ducUser, content: "Ai đi cafe chiều nay không? ☕ Quán mới góc đường Nguyễn Huệ hay lắm", timestamp: fmt(14, 0), topicId: "cg6" },
  { id: "cg6-2", type: "text", sender: huongUser, content: "Đi! 4h chiều nhé, em xong việc lúc đó", timestamp: fmt(14, 5), topicId: "cg6" },
  { id: "cg6-3", type: "text", sender: lanUser, content: "+1, mình cũng free buổi chiều 😄", timestamp: fmt(14, 8), topicId: "cg6" },
  { id: "cg7-1", type: "text", sender: phucUser, content: "PR #158 cần review gấp trước EOD, logic khá phức tạp nhờ mọi người ưu tiên", timestamp: fmt(15, 0), topicId: "cg7" },
  { id: "cg7-2", type: "text", sender: lanUser, content: "Mình review xong rồi, approve với 2 nitpicks. Good code overall!", timestamp: fmt(15, 45), topicId: "cg7" },
];

const slashCommands = [
  { cmd: "/task", desc: "Tạo task mới", icon: <ListChecks className="w-3.5 h-3.5" />, example: "/task Thiết kế login page @Hương #design !high" },
  { cmd: "/assign", desc: "Giao việc cho thành viên", icon: <AtSign className="w-3.5 h-3.5" />, example: "/assign t1 @Phúc" },
  { cmd: "/status", desc: "Cập nhật trạng thái task", icon: <ArrowRight className="w-3.5 h-3.5" />, example: "/status t1 done" },
  { cmd: "/report", desc: "Xem báo cáo", icon: <BarChart3 className="w-3.5 h-3.5" />, example: "/report weekly" },
  { cmd: "/deadline", desc: "Đặt/thay đổi deadline", icon: <Calendar className="w-3.5 h-3.5" />, example: "/deadline t1 2026-03-25" },
  { cmd: "/priority", desc: "Đổi mức ưu tiên", icon: <Flag className="w-3.5 h-3.5" />, example: "/priority t1 urgent" },
  { cmd: "/sprint", desc: "Xem thông tin sprint", icon: <Zap className="w-3.5 h-3.5" />, example: "/sprint current" },
  { cmd: "/standup", desc: "Báo cáo standup", icon: <Users className="w-3.5 h-3.5" />, example: "/standup Hôm qua: ..., Hôm nay: ..." },
  { cmd: "/approve", desc: "Phê duyệt yêu cầu", icon: <Check className="w-3.5 h-3.5" />, example: "/approve req-123" },
  { cmd: "/help", desc: "Xem tất cả commands", icon: <Command className="w-3.5 h-3.5" />, example: "/help" },
];

/* ============== MOCK TRANSLATION MAP ============== */
const mockTranslations: Record<string, string> = {
  "Team ơi, sprint mới bắt đầu rồi. Mọi người check board và update status nhé! @Trần Hương mockup trang chủ xong chưa?": "Hey team, the new sprint has started. Everyone please check the board and update your status! @Trần Hương is the homepage mockup done?",
  "Em đang làm high-fidelity mockup, chiều nay xong ạ. Wireframe đã pass review rồi 🎨": "I'm working on the high-fidelity mockup, will be done this afternoon. The wireframe already passed review 🎨",
  "CI/CD pipeline đã hoàn thành! GitHub Actions auto-deploy lên staging mỗi khi merge vào develop. Production deploy qua manual approval.": "CI/CD pipeline is complete! GitHub Actions auto-deploys to staging every time we merge to develop. Production deploy via manual approval.",
  "Mình đang review API rate limiting PR. Có vài concerns về Redis caching strategy, mình sẽ comment trên GitHub nhé.": "I'm reviewing the API rate limiting PR. I have some concerns about the Redis caching strategy, I'll comment on GitHub.",
  "Ai đi lunch không? 🍜": "Anyone going for lunch? 🍜",
  "Đi! Bún bò Huế nhé 😋": "Let's go! Bún bò Huế (Vietnamese beef noodle soup) 😋",
  "+1, 12h meet ở lobby nhé": "+1, let's meet at the lobby at 12pm",
  "Mọi người review PR #142 giúp mình nhé — Authentication JWT refresh token flow.": "Can everyone help review PR #142 — Authentication JWT refresh token flow.",
  "PR reviewed, mình approve rồi. Nhớ add thêm rate limit cho refresh endpoint nhé 👍": "PR reviewed, I've approved it. Remember to add rate limiting for the refresh endpoint 👍",
  "Done! Đã thêm rate limit 10 req/min cho /auth/refresh. Merge được rồi.": "Done! Added rate limit of 10 req/min for /auth/refresh. Ready to merge.",
  "Database migration script cho v2 schema đã ready. Mọi người review trước khi run lên staging.": "Database migration script for v2 schema is ready. Everyone please review before running on staging.",
  "Reviewed, LGTM! Nhớ backup trước khi migrate nhé 💪": "Reviewed, LGTM! Remember to backup before migrating 💪",
  "Wireframe trang Products và About đã xong. Mình upload lên Figma rồi, anh Minh review giúp nhé!": "Wireframe for Products and About pages are done. I've uploaded to Figma, Minh can you help review!",
  "Đẹp lắm Hương! Mình thích layout Products page. Chỉ cần adjust spacing ở hero section một chút.": "Looks great Hương! I love the Products page layout. Just need to adjust the spacing in the hero section a bit.",
  "Mọi người thấy color scheme này thế nào? Em đang dùng palette Cyan-Teal cho primary, Gray cho text.": "What does everyone think of this color scheme? I'm using a Cyan-Teal palette for primary, Gray for text.",
  "Rất clean và modern! Đúng hướng rồi Hương.": "Very clean and modern! You're on the right track Hương.",
  "Update: Design system v2 đã hoàn thành 80%. Sẽ share Figma link trong tuần này.": "Update: Design system v2 is 80% complete. Will share the Figma link this week.",
};

const autoTranslate = (content: string): string => {
  if (mockTranslations[content]) return mockTranslations[content];
  // Fallback: pseudo-translate by adding prefix
  return `[EN] ${content}`;
};

/* ============== EMOJI DATA ============== */
const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👀"];
const skinToneModifiers = ["", "🏻", "🏼", "🏽", "🏾", "🏿"];
const skinToneBaseEmojis = new Set(["👍","👎","👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💪","🦵","🦶","👂","👃","🧑","👶","👦","👧","🧒","👱","👨","👩","🧔","👴","👵"]);
const recentEmojis = ["🕐", "😊", "😍", "😂", "🤩", "😎", "🤪", "😤", "😈", "🤑"];
const emojiCategories = [
  { icon: "😊", label: "Mặt cười", emojis: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😉","😊","😇","🥰","😍","🤩","😘","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","😮‍💨","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐"] },
  { icon: "👍", label: "Cử chỉ", emojis: ["👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏"] },
  { icon: "🏃", label: "Hoạt động", emojis: ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🥍","🏑","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸️","🥌","🎿","🎯","🪃","🎲","🧩","🎮","🎰"] },
  { icon: "😺", label: "Động vật", emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪰","🪲","🦟"] },
  { icon: "🍔", label: "Đồ ăn", emojis: ["🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🫑","🌽","🥕","🫒","🧄","🧅","🥔","🍠","🥐","🍞","🥖","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🌭","🍔","🍟","🍕"] },
  { icon: "🏠", label: "Đồ vật", emojis: ["⌚","📱","📲","💻","⌨️","🖥️","🖨️","🖱️","🖲️","🕹️","🗜️","💽","💾","💿","📀","📼","📷","📸","📹","🎥","📽️","🎞️","📞","☎️","📟","📠","📺","📻","🎙️","🎚️","🎛️","🧭","⏱️","⏲️","⏰","🕰️","⌛","⏳","📡","🔋","🔌","💡","🔦","🕯️","🪔","🧯","🛢️","💸","💵","💴","💶","💷"] },
  { icon: "❤️", label: "Biểu tượng", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️","☦️","🛐","⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"] },
  { icon: "🏁", label: "Cờ & Sự kiện", emojis: ["🎪","🎭","🎨","🎬","🎤","🎧","🎼","🎵","🎶","🪘","🥁","🎷","🎺","🪗","🎸","🪕","🎻","🎲","♟️","🎯","🎳","🎮","🧸","🪄","🎩","🪅","🎊","🎉","🎈","🎀","🎁","🎗️","🏅","🥇","🥈","🥉","🏆","🏁","🚩","🎌","🏴","🏳️"] },
];

/* ============== EMOJI REACTION PICKER ============== */
function EmojiReactionPicker({
  onSelect,
  onClose,
  position,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  position: { top: number; left: number };
}) {
  const [activeTab, setActiveTab] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Adjust position so picker stays within viewport
  const style: React.CSSProperties = {
    position: "fixed",
    top: Math.min(position.top, window.innerHeight - 380),
    left: Math.min(position.left, window.innerWidth - 310),
    zIndex: 60,
  };

  return (
    <div ref={ref} style={style} className="bg-white rounded-xl border border-gray-200 shadow-2xl w-[300px] overflow-hidden">
      {/* Quick reactions */}
      <div className="flex items-center gap-0.5 px-2 py-2 border-b border-gray-100">
        {quickReactions.map(e => (
          <button
            key={e}
            onClick={() => { onSelect(e); onClose(); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[18px] hover:bg-gray-100 hover:scale-110 transition-all"
          >
            {e}
          </button>
        ))}
      </div>
      {/* Category tabs */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-gray-100 overflow-x-auto">
        {emojiCategories.map((cat, i) => (
          <button
            key={cat.label}
            onClick={() => setActiveTab(i)}
            className={`w-7 h-7 rounded-md flex items-center justify-center text-[14px] shrink-0 transition-all ${activeTab === i ? "bg-cyan-50" : "hover:bg-gray-100"}`}
          >
            {cat.icon}
          </button>
        ))}
      </div>
      {/* Emoji grid */}
      <div className="px-2 py-1.5 h-[200px] overflow-y-auto">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 px-0.5">{emojiCategories[activeTab]?.label}</p>
        <div className="grid grid-cols-8 gap-0.5">
          {emojiCategories[activeTab]?.emojis.map((e, i) => {
            const hasSkinTone = skinToneBaseEmojis.has(e);
            let longPressTimer: ReturnType<typeof setTimeout> | null = null;
            return (
            <button
              key={`${e}-${i}`}
              onClick={() => { onSelect(e); onClose(); }}
              onMouseDown={(ev) => {
                if (hasSkinTone) {
                  longPressTimer = setTimeout(() => {
                    onClose();
                    // Dispatch custom event for skin tone
                    window.dispatchEvent(new CustomEvent("skinTonePick", {
                      detail: { emoji: e, x: ev.clientX, y: ev.clientY, callback: onSelect }
                    }));
                  }, 500);
                }
              }}
              onMouseUp={() => { if (longPressTimer) clearTimeout(longPressTimer); }}
              onMouseLeave={() => { if (longPressTimer) clearTimeout(longPressTimer); }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-[17px] hover:bg-gray-100 hover:scale-110 transition-all relative ${hasSkinTone ? "group/skin" : ""}`}
            >
              {e}
              {hasSkinTone && <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-gray-300 opacity-0 group-hover/skin:opacity-100 transition-all" />}
            </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============== SKIN TONE PICKER ============== */
function SkinTonePicker({ emoji, pos, onSelect, onClose }: {
  emoji: string; pos: { x: number; y: number }; onSelect: (emoji: string) => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const base = emoji.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, "");
  const variants = skinToneModifiers.map(mod => mod ? base + mod : base);

  return (
    <div ref={ref} className="fixed z-[70] bg-white rounded-xl border border-gray-200 shadow-2xl px-1.5 py-1.5 flex items-center gap-0.5"
      style={{ top: Math.min(pos.y - 50, window.innerHeight - 60), left: Math.min(pos.x - 80, window.innerWidth - 260) }}>
      {variants.map((v, i) => (
        <button key={i} onClick={() => { onSelect(v); onClose(); }}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[20px] hover:bg-gray-100 hover:scale-110 transition-all">
          {v}
        </button>
      ))}
    </div>
  );
}

/* ============== READ RECEIPT POPUP ============== */
function ReadReceiptPopup({ pos, msgId, onClose }: {
  pos: { x: number; y: number }; msgId: string; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const readers = [
    { user: huongUser, time: "14:32", status: "read" },
    { user: phucUser, time: "14:35", status: "read" },
    { user: lanUser, time: "15:01", status: "delivered" },
    { user: ducUser, time: "—", status: "sent" },
  ];

  return (
    <div ref={ref} className="fixed z-[70] bg-white rounded-xl border border-gray-200 shadow-2xl w-[240px] overflow-hidden"
      style={{ top: Math.min(pos.y + 8, window.innerHeight - 250), left: Math.min(pos.x - 120, window.innerWidth - 260) }}
    >
      <div className="px-3 py-2.5 border-b border-gray-100 flex items-center gap-2">
        <Eye className="w-3.5 h-3.5 text-cyan-500" />
        <span className="text-[12px] text-gray-800">Chi tiết đã đọc</span>
      </div>
      <div className="max-h-[200px] overflow-y-auto">
        {readers.map(r => (
          <div key={r.user.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-all">
            <div className="relative shrink-0">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white" style={{ backgroundColor: r.user.color }}>
                {r.user.name.charAt(0)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-gray-800 truncate block">{r.user.name}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {r.status === "read" ? (
                <CheckCheck className="w-3 h-3 text-cyan-500" />
              ) : r.status === "delivered" ? (
                <CheckCheck className="w-3 h-3 text-gray-400" />
              ) : (
                <Check className="w-3 h-3 text-gray-300" />
              )}
              <span className="text-[9px] text-gray-400">{r.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============== TOPIC CONTEXT MENU (Telegram-style) ============== */
function TopicContextMenu({
  position,
  topic,
  isMuted,
  isClosed,
  onClose,
  onOpenNewWindow,
  onTogglePin,
  onMute,
  onCloseTopic,
  onEdit,
  onDelete,
}: {
  position: { x: number; y: number };
  topic: Topic;
  isMuted: boolean;
  isClosed: boolean;
  onClose: () => void;
  onOpenNewWindow: () => void;
  onTogglePin: () => void;
  onMute: (mode: "select_tone" | "disable_sound" | "mute_duration" | "mute_forever" | "unmute") => void;
  onCloseTopic: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [showMuteSubmenu, setShowMuteSubmenu] = useState(false);
  const muteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Adjust position to stay in viewport
  const menuWidth = 220;
  const submenuWidth = 200;
  const menuHeight = 260;
  const adjustedX = Math.min(position.x, window.innerWidth - menuWidth - submenuWidth - 8);
  const adjustedY = Math.min(position.y, window.innerHeight - menuHeight - 8);

  const handleMuteHover = (entering: boolean) => {
    if (muteTimerRef.current) clearTimeout(muteTimerRef.current);
    if (entering) {
      muteTimerRef.current = setTimeout(() => setShowMuteSubmenu(true), 150);
    } else {
      muteTimerRef.current = setTimeout(() => setShowMuteSubmenu(false), 200);
    }
  };

  return (
    <div
      ref={ref}
      style={{ position: "fixed", top: adjustedY, left: adjustedX, zIndex: 60 }}
      className="bg-white rounded-xl border border-gray-200 shadow-2xl py-1.5 w-[220px] overflow-visible"
    >
      {/* Mở trong cửa sổ mới */}
      <button
        onClick={() => { onOpenNewWindow(); onClose(); }}
        className="w-full flex items-center gap-3 px-3.5 py-[7px] text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left"
      >
        <ExternalLink className="w-4 h-4 text-gray-400" />
        Mở trong cửa sổ mới
      </button>

      {/* Chỉnh sửa chủ đề */}
      <button
        onClick={() => { onEdit(); onClose(); }}
        className="w-full flex items-center gap-3 px-3.5 py-[7px] text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left"
      >
        <Pencil className="w-4 h-4 text-gray-400" />
        Chỉnh sửa chủ đề
      </button>

      <div className="h-px bg-gray-100 mx-3 my-1" />

      {/* Ghim / Bỏ ghim */}
      <button
        onClick={() => { onTogglePin(); onClose(); }}
        className="w-full flex items-center gap-3 px-3.5 py-[7px] text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left"
      >
        {topic.pinned ? (
          <>
            <PinOff className="w-4 h-4 text-gray-400" />
            Bỏ ghim
          </>
        ) : (
          <>
            <Pin className="w-4 h-4 text-gray-400" />
            Ghim chủ đề
          </>
        )}
      </button>

      {/* Tắt thông báo (with submenu) */}
      <div
        className="relative"
        onMouseEnter={() => handleMuteHover(true)}
        onMouseLeave={() => handleMuteHover(false)}
      >
        <button
          className="w-full flex items-center gap-3 px-3.5 py-[7px] text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left"
        >
          {isMuted ? (
            <BellOff className="w-4 h-4 text-gray-400" />
          ) : (
            <Bell className="w-4 h-4 text-gray-400" />
          )}
          <span className="flex-1">{isMuted ? "Bật thông báo" : "Tắt thông báo"}</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
        </button>

        {/* Submenu */}
        {showMuteSubmenu && (
          <div
            className="absolute left-full top-0 ml-1 bg-white rounded-xl border border-gray-200 shadow-2xl py-1.5 w-[200px]"
            onMouseEnter={() => handleMuteHover(true)}
            onMouseLeave={() => handleMuteHover(false)}
          >
            {isMuted ? (
              <button
                onClick={() => { onMute("unmute"); onClose(); }}
                className="w-full flex items-center gap-3 px-3.5 py-[7px] text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left"
              >
                <Bell className="w-4 h-4 text-green-500" />
                Bật lại thông báo
              </button>
            ) : (
              <>
                <button
                  onClick={() => { onMute("select_tone"); onClose(); }}
                  className="w-full flex items-center gap-3 px-3.5 py-[7px] text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left"
                >
                  <Music className="w-4 h-4 text-gray-400" />
                  Chọn âm báo
                </button>
                <button
                  onClick={() => { onMute("disable_sound"); onClose(); }}
                  className="w-full flex items-center gap-3 px-3.5 py-[7px] text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left"
                >
                  <VolumeX className="w-4 h-4 text-gray-400" />
                  Tắt âm thanh
                </button>
                <button
                  onClick={() => { onMute("mute_duration"); onClose(); }}
                  className="w-full flex items-center gap-3 px-3.5 py-[7px] text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left"
                >
                  <BellOff className="w-4 h-4 text-gray-400" />
                  Tắt trong...
                </button>
                <button
                  onClick={() => { onMute("mute_forever"); onClose(); }}
                  className="w-full flex items-center gap-3 px-3.5 py-[7px] text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left"
                >
                  <BellOff className="w-4 h-4 text-red-400" />
                  Tắt vĩnh viễn
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="h-px bg-gray-100 mx-3 my-1" />

      {/* Đóng / Mở lại chủ đề */}
      <button
        onClick={() => { onCloseTopic(); onClose(); }}
        className="w-full flex items-center gap-3 px-3.5 py-[7px] text-[13px] text-gray-700 hover:bg-gray-50 transition-all text-left"
      >
        {isClosed ? (
          <>
            <Archive className="w-4 h-4 text-green-500" />
            Mở lại chủ đề
          </>
        ) : (
          <>
            <Archive className="w-4 h-4 text-gray-400" />
            Đóng chủ đề
          </>
        )}
      </button>

      {/* Xoá */}
      <button
        onClick={() => { onDelete(); onClose(); }}
        className="w-full flex items-center gap-3 px-3.5 py-[7px] text-[13px] text-red-500 hover:bg-red-50 transition-all text-left"
      >
        <Trash2 className="w-4 h-4" />
        Xoá
      </button>
    </div>
  );
}

/* ============== EDIT TOPIC MODAL ============== */
function EditTopicModal({
  topic,
  onClose,
  onSave,
}: {
  topic: Topic;
  onClose: () => void;
  onSave: (id: string, name: string, emoji: string) => void;
}) {
  const [topicName, setTopicName] = useState(topic.name);
  const [selectedEmoji, setSelectedEmoji] = useState(topic.emoji || "💬");
  const [activeCategory, setActiveCategory] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSave = () => {
    if (!topicName.trim()) return;
    onSave(topic.id, topicName.trim(), selectedEmoji);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:w-[340px] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-[15px] text-gray-900">Chỉnh sửa chủ đề</h3>
        </div>
        <div className="px-5 pb-3">
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-xl shrink-0 hover:bg-cyan-600 transition-colors">
              {selectedEmoji}
            </button>
            <div className="flex-1">
              <input
                ref={inputRef}
                value={topicName}
                onChange={e => setTopicName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
                placeholder="Tên chủ đề"
                className="w-full text-[14px] text-cyan-600 placeholder-gray-400 focus:outline-none border-b-2 border-cyan-500 pb-1.5 bg-transparent"
              />
            </div>
          </div>
        </div>
        {/* Compact emoji selector */}
        <div className="px-4 py-1 flex items-center gap-0.5 overflow-x-auto border-t border-gray-100">
          {emojiCategories.map((cat, i) => (
            <button key={cat.label} onClick={() => setActiveCategory(i)}
              className={`w-7 h-7 rounded-md flex items-center justify-center text-[14px] shrink-0 transition-all ${activeCategory === i ? "bg-cyan-50" : "hover:bg-gray-100"}`}>
              {cat.icon}
            </button>
          ))}
        </div>
        <div className="px-4 py-2 h-[160px] overflow-y-auto border-t border-gray-100">
          <div className="grid grid-cols-8 gap-0.5">
            {emojiCategories[activeCategory]?.emojis.map((e, i) => (
              <button key={`${e}-${i}`} onClick={() => setSelectedEmoji(e)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[17px] transition-all ${selectedEmoji === e ? "bg-cyan-100 scale-110" : "hover:bg-gray-100"}`}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2 text-[13px] text-gray-500 hover:bg-gray-50 rounded-lg transition-all">Huỷ bỏ</button>
          <button onClick={handleSave} disabled={!topicName.trim()}
            className={`px-5 py-2 text-[13px] rounded-lg transition-all ${topicName.trim() ? "bg-cyan-500 text-white hover:bg-cyan-600" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}>
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============== DELETE TOPIC CONFIRM ============== */
function DeleteTopicModal({
  topic,
  onClose,
  onConfirm,
}: {
  topic: Topic;
  onClose: () => void;
  onConfirm: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:w-[340px] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-[15px] text-gray-900 mb-1">Xoá chủ đề?</h3>
            <p className="text-[12px] text-gray-500 leading-relaxed">
              Bạn có chắc muốn xoá chủ đề <strong className="text-gray-700">"{topic.emoji} {topic.name}"</strong>?
              Tất cả tin nhắn trong chủ đề này sẽ bị xoá vĩnh viễn.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2 text-[13px] text-gray-500 hover:bg-gray-50 rounded-lg transition-all">Huỷ bỏ</button>
          <button onClick={() => { onConfirm(topic.id); onClose(); }}
            className="px-5 py-2 text-[13px] bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all">
            Xoá chủ đề
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============== FORWARD MESSAGE MODAL ============== */
function ForwardMessageModal({
  message,
  allTopics,
  currentTopicId,
  personalItems,
  personalGroups,
  onClose,
  onForward,
}: {
  message: ChatMessage;
  allTopics: { topicId: string; topicName: string; topicEmoji?: string; spaceName: string }[];
  currentTopicId: string;
  personalItems: { id: string; name: string; type: string; icon: string; color: string; emoji?: string; online?: boolean }[];
  personalGroups: { id: string; name: string; color: string; members?: string[] }[];
  onClose: () => void;
  onForward: (msgId: string, targetId: string, targetName: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const q = search.toLowerCase();

  const tools = personalItems.filter(p => p.type === "tool" && p.name.toLowerCase().includes(q || ""));
  const dms = personalItems.filter(p => p.type === "dm" && (p.name.toLowerCase().includes(q || "") ));
  const groups = personalGroups.filter(g => g.name.toLowerCase().includes(q || ""));
  const topics = allTopics.filter(t =>
    t.topicId !== currentTopicId &&
    (t.topicName.toLowerCase().includes(q) || t.spaceName.toLowerCase().includes(q))
  );

  const totalResults = tools.length + dms.length + groups.length + topics.length;

  const itemBtn = (id: string, left: React.ReactNode, name: string, sub: string) => (
    <button key={id} onClick={() => setSelectedId(id)}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${selectedId === id ? "bg-cyan-50 border border-cyan-200" : "hover:bg-gray-50 border border-transparent"}`}>
      {left}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-gray-800 truncate">{name}</p>
        {sub && <p className="text-[10px] text-gray-400 truncate">{sub}</p>}
      </div>
      {selectedId === id && <div className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center shrink-0"><Check className="w-2.5 h-2.5 text-white" /></div>}
    </button>
  );

  const sectionLabel = (label: string) => (
    <p className="px-3 pt-2 pb-1 text-[10px] text-gray-400 uppercase tracking-wider font-medium">{label}</p>
  );

  const getSelectedName = () => {
    const t = tools.find(x => x.id === selectedId) || dms.find(x => x.id === selectedId);
    if (t) return t.name;
    const g = groups.find(x => x.id === selectedId);
    if (g) return g.name;
    const tp = topics.find(x => x.topicId === selectedId);
    if (tp) return tp.topicName;
    return "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-[1px]" onClick={onClose}>
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:w-[400px] max-h-[85vh] md:max-h-[560px] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: "fadeInScale 0.15s ease" }}>
        {/* Header */}
        <div className="px-5 pt-5 pb-3 shrink-0">
          <h3 className="text-[15px] font-medium text-gray-900 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-cyan-500" />
            Chuyển tiếp tin nhắn
          </h3>
        </div>

        {/* Message preview */}
        <div className="mx-5 mb-3 p-3 bg-gray-50 rounded-xl border border-gray-100 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ backgroundColor: message.sender.color }}>{message.sender.name.charAt(0)}</div>
            <span className="text-[11px] text-gray-500">{message.sender.name}</span>
            <span className="text-[10px] text-gray-300">{message.timestamp}</span>
          </div>
          <p className="text-[12px] text-gray-600 line-clamp-2">{message.content || message.reportData?.title || "📊 Report"}</p>
        </div>

        {/* Search */}
        <div className="px-5 pb-2 shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-2 border border-gray-200 focus-within:border-cyan-300 transition-colors">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm người, nhóm hoặc chủ đề..."
              className="flex-1 text-[12px] bg-transparent focus:outline-none text-gray-700 placeholder-gray-400" autoFocus />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-0">
          {totalResults === 0 && (
            <div className="text-center py-10"><p className="text-[12px] text-gray-400">Không tìm thấy kết quả</p></div>
          )}

          {/* Tools */}
          {tools.length > 0 && (<>
            {sectionLabel("Ghi chú & Lưu trữ")}
            {tools.map(p => itemBtn(p.id,
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-[16px] shrink-0">{p.emoji || p.icon}</div>,
              p.name, "Cá nhân"
            ))}
          </>)}

          {/* Groups */}
          {groups.length > 0 && (<>
            {sectionLabel("Nhóm chat")}
            {groups.map(g => itemBtn(g.id,
              <div className="shrink-0"><MosaicAvatar members={g.members || []} color={g.color} size={32} /></div>,
              g.name, `${g.members?.length || 0} thành viên`
            ))}
          </>)}

          {/* DMs */}
          {dms.length > 0 && (<>
            {sectionLabel("Tin nhắn trực tiếp")}
            {dms.map(p => itemBtn(p.id,
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] text-white" style={{ backgroundColor: p.color }}>{p.icon}</div>
                {p.online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />}
              </div>,
              p.name, p.online ? "Đang hoạt động" : "Ngoại tuyến"
            ))}
          </>)}

          {/* Workspace topics */}
          {topics.length > 0 && (<>
            {sectionLabel("Không gian làm việc")}
            {topics.map(t => itemBtn(t.topicId,
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[14px] shrink-0">{t.topicEmoji || <Hash className="w-3.5 h-3.5 text-gray-400" />}</div>,
              t.topicName, t.spaceName
            ))}
          </>)}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-500 hover:bg-gray-50 rounded-lg transition-all">Huỷ bỏ</button>
          <button
            onClick={() => { if (selectedId) { onForward(message.id, selectedId, getSelectedName()); onClose(); } }}
            disabled={!selectedId}
            className={`px-4 py-2 text-[13px] rounded-lg transition-all flex items-center gap-1.5 ${selectedId ? "bg-cyan-500 text-white hover:bg-cyan-600 shadow-sm" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}>
            <Share2 className="w-3.5 h-3.5" />Chuyển tiếp
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============== MESSAGE CONTEXT MENU (Telegram-style) ============== */
function MessageContextMenu({
  position,
  message,
  isOwn,
  isBookmarked,
  onClose,
  onReply,
  onEdit,
  onCopy,
  onPin,
  onForward,
  onDelete,
  onThread,
  onReaction,
  onEmojiPicker,
  onSelect,
  onBookmark,
  onTranslate,
  isTranslated,
  onTagTopic,
  showTagTopic,
  onCreateTask,
  showCreateTask,
}: {
  position: { x: number; y: number };
  message: ChatMessage;
  isOwn: boolean;
  isBookmarked: boolean;
  onClose: () => void;
  onReply: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onPin: () => void;
  onForward: () => void;
  onDelete: () => void;
  onThread: () => void;
  onReaction: (emoji: string) => void;
  onEmojiPicker: (e: React.MouseEvent) => void;
  onSelect: () => void;
  onBookmark: () => void;
  onTranslate?: () => void;
  isTranslated?: boolean;
  onTagTopic?: () => void;
  showTagTopic?: boolean;
  onCreateTask?: () => void;
  showCreateTask?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const isMobile = window.innerWidth < 768;
  const menuWidth = 200;
  const menuHeight = 330;
  const adjustedX = Math.min(position.x, window.innerWidth - menuWidth - 8);
  const adjustedY = Math.min(position.y, window.innerHeight - menuHeight - 8);

  const MenuItem = ({ icon, label, onClick, danger, accent }: {
    icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; accent?: boolean;
  }) => (
    <button
      onClick={() => { onClick(); onClose(); }}
      className={`w-full flex items-center gap-3 px-4 py-3 md:px-3.5 md:py-[7px] text-[14px] md:text-[13px] transition-all text-left md:rounded-lg ${
        danger ? "text-red-500 active:bg-red-50 hover:bg-red-50" : accent ? "text-cyan-600 active:bg-cyan-50 hover:bg-cyan-50" : "text-gray-700 active:bg-gray-50 hover:bg-gray-50"
      }`}
    >
      <span className={`${danger ? "text-red-400" : accent ? "text-cyan-500" : "text-gray-400"}`}>{icon}</span>
      {label}
    </button>
  );

  const menuContent = (
    <>
      {/* Quick reactions row */}
      <div className="flex items-center justify-center gap-1.5 md:gap-1 px-4 py-3 md:px-2 md:py-1.5 border-b border-gray-100">
        {["👍", "❤️", "😂", "😮", "🔥", "🎉"].map(emoji => (
          <button
            key={emoji}
            onClick={() => { onReaction(emoji); onClose(); }}
            className="w-10 h-10 md:w-8 md:h-8 rounded-xl md:rounded-lg flex items-center justify-center text-[22px] md:text-[17px] active:bg-gray-100 hover:bg-gray-100 hover:scale-125 transition-all"
          >
            {emoji}
          </button>
        ))}
        <button
          onClick={(e) => { onEmojiPicker(e); onClose(); }}
          className="w-10 h-10 md:w-8 md:h-8 rounded-xl md:rounded-lg flex items-center justify-center text-gray-400 active:bg-gray-100 hover:bg-gray-100 hover:text-gray-600 transition-all"
        >
          <Plus className="w-5 h-5 md:w-4 md:h-4" />
        </button>
      </div>

      <div className="py-1 md:px-1">
        <MenuItem icon={<Reply className="w-4 h-4" />} label="Trả lời" onClick={onReply} accent />
        <MenuItem icon={<Copy className="w-4 h-4" />} label="Sao chép" onClick={onCopy} />
        {isOwn && (
          <MenuItem icon={<Pencil className="w-4 h-4" />} label="Chỉnh sửa" onClick={onEdit} />
        )}
        <MenuItem icon={<Pin className="w-4 h-4" />} label={message.pinned ? "Bỏ ghim" : "Ghim tin nhắn"} onClick={onPin} />
        {showTagTopic && onTagTopic && (
          <MenuItem icon={<Hash className="w-4 h-4" />} label="Gắn chủ đề" onClick={onTagTopic} />
        )}
        {showCreateTask && onCreateTask && (message.type === "text" || message.type === "bot_response") && message.content && (
          <MenuItem icon={<CheckSquare className="w-4 h-4" />} label="Tạo task từ tin nhắn" onClick={onCreateTask} accent />
        )}
        <MenuItem icon={isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          label={isBookmarked ? "Bỏ lưu" : "Lưu tin nhắn"} onClick={onBookmark} accent={isBookmarked} />
        <MenuItem icon={<Share2 className="w-4 h-4" />} label="Chuyển tiếp" onClick={onForward} />
        <MenuItem icon={<MessageSquare className="w-4 h-4" />} label="Trả lời trong thread" onClick={onThread} />
        <MenuItem icon={<SquareMousePointer className="w-4 h-4" />} label="Chọn tin nhắn" onClick={onSelect} />
        {onTranslate && (message.type === "text" || message.type === "bot_response") && (
          <MenuItem icon={<Languages className="w-4 h-4" />} label={isTranslated ? "Xem bản gốc" : "Dịch sang Tiếng Anh"} onClick={onTranslate} accent={isTranslated} />
        )}
        {isOwn && (
          <>
            <div className="h-px bg-gray-100 mx-2 my-0.5" />
            <MenuItem icon={<Trash2 className="w-4 h-4" />} label="Xoá tin nhắn" onClick={onDelete} danger />
          </>
        )}
      </div>
    </>
  );

  /* Mobile: bottom sheet */
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[60] flex items-end" onClick={onClose}>
        <div
          ref={ref}
          className="w-full bg-white rounded-t-2xl shadow-2xl pb-6 overflow-hidden"
          onClick={e => e.stopPropagation()}
          style={{ animation: "slideUp 0.2s ease" }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-9 h-1 rounded-full bg-gray-200" />
          </div>
          {/* Message preview */}
          {(message.content || message.reportData?.title) && (
            <div className="mx-4 mb-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[12px] text-gray-500 line-clamp-2">{message.content || message.reportData?.title}</p>
            </div>
          )}
          {menuContent}
        </div>
      </div>
    );
  }

  /* Desktop: floating dropdown */
  return (
    <div
      ref={ref}
      style={{ position: "fixed", top: adjustedY, left: adjustedX, zIndex: 60 }}
      className="bg-white rounded-2xl border border-gray-200 shadow-2xl py-1.5 w-[200px] overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {menuContent}
    </div>
  );
}

/* ============== NEW TOPIC MODAL ============== */
function NewTopicModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, emoji: string) => void }) {
  const [topicName, setTopicName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("💬");
  const [emojiSearch, setEmojiSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filteredEmojis = emojiSearch
    ? emojiCategories.flatMap(c => c.emojis)
    : emojiCategories[activeCategory]?.emojis || [];

  const handleCreate = () => {
    if (!topicName.trim()) return;
    onCreate(topicName.trim(), selectedEmoji);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:w-[340px] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-[15px] text-gray-900">Chủ đề mới</h3>
        </div>
        <div className="px-5 pb-3">
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-xl shrink-0 hover:bg-cyan-600 transition-colors">
              {selectedEmoji}
            </button>
            <div className="flex-1">
              <input
                ref={inputRef}
                value={topicName}
                onChange={e => setTopicName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
                placeholder="Tên chủ đề"
                className="w-full text-[14px] text-cyan-600 placeholder-gray-400 focus:outline-none border-b-2 border-cyan-500 pb-1.5 bg-transparent"
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-500 mt-2.5">Chọn tên chủ đề và biểu tượng</p>
        </div>
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="flex items-center gap-0.5 overflow-x-auto">
            {recentEmojis.map(e => (
              <button key={`recent-${e}`} onClick={() => setSelectedEmoji(e)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[18px] shrink-0 transition-all ${selectedEmoji === e ? "bg-cyan-100 scale-110" : "hover:bg-gray-100"}`}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input value={emojiSearch} onChange={e => setEmojiSearch(e.target.value)} placeholder="Tìm kiếm"
              className="flex-1 text-[12px] bg-transparent focus:outline-none text-gray-700 placeholder-gray-400" />
          </div>
        </div>
        {!emojiSearch && (
          <div className="px-4 py-1 flex items-center gap-0.5 overflow-x-auto border-t border-gray-100">
            {emojiCategories.map((cat, i) => (
              <button key={cat.label} onClick={() => setActiveCategory(i)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[16px] shrink-0 transition-all ${activeCategory === i ? "bg-cyan-50" : "hover:bg-gray-100"}`}
                title={cat.label}>
                {cat.icon}
              </button>
            ))}
          </div>
        )}
        <div className="px-4 py-2 h-[200px] overflow-y-auto border-t border-gray-100">
          {!emojiSearch && (
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 px-0.5">{emojiCategories[activeCategory]?.label}</p>
          )}
          <div className="grid grid-cols-8 gap-0.5">
            {filteredEmojis.map((e, i) => (
              <button key={`${e}-${i}`} onClick={() => setSelectedEmoji(e)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[18px] transition-all ${selectedEmoji === e ? "bg-cyan-100 scale-110" : "hover:bg-gray-100"}`}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2 text-[13px] text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all">Huỷ bỏ</button>
          <button onClick={handleCreate} disabled={!topicName.trim()}
            className={`px-5 py-2 text-[13px] rounded-lg transition-all ${topicName.trim() ? "text-cyan-600 hover:bg-cyan-50" : "text-gray-300 cursor-not-allowed"}`}>
            Tạo mới
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============== THREAD PANEL ============== */
function ThreadPanel({
  parentMessage, replies, onClose, onSendReply, onToggleReaction,
}: {
  parentMessage: ChatMessage; replies: ChatMessage[]; onClose: () => void;
  onSendReply: (content: string, parentId: string) => void; onToggleReaction: (msgId: string, emoji: string) => void;
}) {
  const [replyInput, setReplyInput] = useState("");
  const repliesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { repliesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [replies.length]);

  const handleSend = () => {
    if (!replyInput.trim()) return;
    onSendReply(replyInput.trim(), parentMessage.id);
    setReplyInput("");
  };

  return (
    <div className="w-full md:w-[360px] bg-white border-l border-gray-200 flex flex-col shrink-0">
      <div className="h-[48px] border-b border-gray-200 flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-all"><ChevronLeft className="w-5 h-5 md:hidden" /><X className="w-4 h-4 hidden md:block" /></button>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-gray-800">Chủ đề trả lời</p>
          <p className="text-[10px] text-gray-500">{replies.length} trả lời</p>
        </div>
      </div>
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-start gap-2.5">
          {parentMessage.sender.isBot ? (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shrink-0"><Bot className="w-3.5 h-3.5 text-white" /></div>
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] text-white shrink-0" style={{ backgroundColor: parentMessage.sender.color }}>{parentMessage.sender.name.charAt(0)}</div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[12px] text-gray-900">{parentMessage.sender.name}</span>
              <span className="text-[10px] text-gray-300">{parentMessage.timestamp}</span>
            </div>
            <p className="text-[12px] text-gray-600 leading-relaxed whitespace-pre-wrap"><FormattedContent content={parentMessage.content} /></p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {replies.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <Reply className="w-8 h-8 text-gray-200 mb-3" />
            <p className="text-[12px] text-gray-500">Chưa có trả lời nào</p>
            <p className="text-[11px] text-gray-300 mt-1">Hãy bắt đầu cuộc thảo luận!</p>
          </div>
        )}
        {replies.map(reply => (
          <div key={reply.id} className="group flex items-start gap-2.5">
            {reply.sender.isBot ? (
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shrink-0"><Bot className="w-3 h-3 text-white" /></div>
            ) : (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white shrink-0" style={{ backgroundColor: reply.sender.color }}>{reply.sender.name.charAt(0)}</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[12px] text-gray-900">{reply.sender.name}</span>
                <span className="text-[10px] text-gray-300">{reply.timestamp}</span>
              </div>
              <p className="text-[12px] text-gray-600 leading-relaxed whitespace-pre-wrap"><FormattedContent content={reply.content} /></p>
              {reply.reactions && reply.reactions.length > 0 && (
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {reply.reactions.map(r => (
                    <button key={`${reply.id}-${r.emoji}`} onClick={() => onToggleReaction(reply.id, r.emoji)}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] transition-all ${r.reacted ? "bg-cyan-50 border border-cyan-200 text-cyan-700" : "bg-gray-50 border border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                      <span>{r.emoji}</span><span>{r.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={repliesEndRef} />
      </div>
      <div className="px-3 pb-3 pt-1">
        <div className="bg-gray-50 rounded-xl border border-gray-200 focus-within:border-cyan-300 focus-within:ring-2 focus-within:ring-cyan-50 transition-all">
          <div className="flex items-end gap-2 p-2.5">
            <textarea ref={inputRef} value={replyInput} onChange={e => setReplyInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Trả lời..." rows={1}
              className="flex-1 resize-none text-[12px] text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent min-h-[32px] max-h-[80px] py-1 leading-relaxed"
              style={{ height: "auto" }}
              onInput={e => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 80) + "px"; }} />
            <button onClick={handleSend} disabled={!replyInput.trim()}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 ${replyInput.trim() ? "bg-cyan-500 text-white hover:bg-cyan-600" : "bg-gray-200 text-gray-400"}`}>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============== PINNED MESSAGES PANEL ============== */
function ChannelManagePanel({ channel, currentUserId, onClose, onUpdate }: {
  channel: ChannelItem;
  currentUserId: string;
  onClose: () => void;
  onUpdate: (patch: Partial<ChannelItem>) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllowedPosters, setShowAllowedPosters] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const allowedIds: string[] = channel.allowedPosterIds ?? [];

  const addPoster = (userId: string) => {
    onUpdate({ allowedPosterIds: [...allowedIds, userId] });
  };
  const removePoster = (userId: string) => {
    onUpdate({ allowedPosterIds: allowedIds.filter(id => id !== userId) });
  };

  const ownerMember = teamMembers.find(m => m.id === channel.ownerId);
  const allowedMembers = teamMembers.filter(m => allowedIds.includes(m.id));
  const availableToAdd = teamMembers.filter(m =>
    m.id !== channel.ownerId &&
    !allowedIds.includes(m.id) &&
    (searchQuery === "" || m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full md:w-[340px] bg-white border-l border-gray-200 flex flex-col shrink-0">
      {/* Header */}
      <div className="h-[48px] border-b border-gray-200 flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center -ml-1 text-gray-500 hover:text-gray-700 transition-all">
          <ChevronLeft className="w-5 h-5 md:hidden" />
          <X className="w-4 h-4 hidden md:block" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-gray-800 truncate">Quản lý thành viên</p>
          <p className="text-[10px] text-gray-400 truncate">{channel.icon} {channel.name}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Owner section */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Chủ kênh</p>
          {ownerMember && (
            <div className="flex items-center gap-3 py-2.5 px-3 bg-amber-50 rounded-xl border border-amber-100">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] text-white shrink-0" style={{ backgroundColor: ownerMember.color }}>
                {ownerMember.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-gray-800 truncate">{ownerMember.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{ownerMember.role}</p>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                <Crown className="w-3 h-3" />Chủ kênh
              </span>
            </div>
          )}
        </div>

        {/* Allowed posters */}
        <div className="px-4 pb-2">
          <button onClick={() => setShowAllowedPosters(!showAllowedPosters)} className="w-full flex items-center justify-between mb-2 hover:text-cyan-600 transition-colors group">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider group-hover:text-cyan-600 transition-colors">
              Được phép đăng ({allowedMembers.length})
            </p>
            <ChevronRight className={`w-3.5 h-3.5 text-gray-400 group-hover:text-cyan-600 transition-all ${showAllowedPosters ? "rotate-90" : ""}`} />
          </button>
          {showAllowedPosters && (
            <div className="space-y-1">
              {allowedMembers.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-[12px] text-gray-400">Chưa có thành viên nào được mời</p>
                  <p className="text-[11px] text-gray-300 mt-0.5">Mời thành viên từ danh sách bên dưới</p>
                </div>
              ) : (
                allowedMembers.map(m => (
                  <div key={m.id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 group transition-all">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] text-white shrink-0" style={{ backgroundColor: m.color }}>
                      {m.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-gray-800 truncate">{m.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{m.role}</p>
                    </div>
                    <button
                      onClick={() => removePoster(m.id)}
                      className="w-6 h-6 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      title="Xóa quyền đăng">
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-gray-100 my-2" />

        {/* Add members section */}
        <div className="px-4 pb-4">
          <button onClick={() => setShowAddMembers(!showAddMembers)} className="w-full flex items-center justify-between mb-2 hover:text-cyan-600 transition-colors group">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider group-hover:text-cyan-600 transition-colors">
              Mời thành viên đăng bài
            </p>
            <ChevronRight className={`w-3.5 h-3.5 text-gray-400 group-hover:text-cyan-600 transition-all ${showAddMembers ? "rotate-90" : ""}`} />
          </button>
          {showAddMembers && (
            <>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 mb-3 border border-gray-200 focus-within:border-indigo-300 transition-all">
                <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm thành viên..."
                  className="flex-1 text-[12px] bg-transparent outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
              {availableToAdd.length === 0 ? (
                <p className="text-[12px] text-gray-400 text-center py-2">
                  {searchQuery ? "Không tìm thấy thành viên" : "Tất cả thành viên đã được mời"}
                </p>
              ) : (
                <div className="space-y-1">
                  {availableToAdd.map(m => (
                    <div key={m.id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-indigo-50 group transition-all cursor-pointer" onClick={() => addPoster(m.id)}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] text-white shrink-0" style={{ backgroundColor: m.color }}>
                        {m.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-gray-800 truncate">{m.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{m.role}</p>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        <UserPlus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PinnedMessagesPanel({ messages, onClose, onUnpin, topicName }: {
  messages: ChatMessage[]; onClose: () => void; onUnpin: (msgId: string) => void; topicName: string;
}) {
  return (
    <div className="w-full md:w-[340px] bg-white border-l border-gray-200 flex flex-col shrink-0">
      <div className="h-[48px] border-b border-gray-200 flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-all"><ChevronLeft className="w-5 h-5 md:hidden" /><X className="w-4 h-4 hidden md:block" /></button>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-gray-800 flex items-center gap-1.5"><Pin className="w-3.5 h-3.5 text-cyan-500" />Tin nhắn đã ghim</p>
          <p className="text-[10px] text-gray-500">{topicName} — {messages.length} tin nhắn</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <Pin className="w-8 h-8 text-gray-200 mb-3" />
            <p className="text-[12px] text-gray-500">Chưa có tin nhắn nào được ghim</p>
            <p className="text-[11px] text-gray-300 mt-1">Ghim tin nhắn quan trọng để dễ tìm lại</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className="group px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-all">
            <div className="flex items-start gap-2.5">
              {msg.sender.isBot ? (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shrink-0"><Bot className="w-3.5 h-3.5 text-white" /></div>
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] text-white shrink-0" style={{ backgroundColor: msg.sender.color }}>{msg.sender.name.charAt(0)}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[12px] text-gray-900">{msg.sender.name}</span>
                  <span className="text-[10px] text-gray-300">{msg.timestamp}</span>
                </div>
                <div className="text-[12px] text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {msg.content ? <FormattedContent content={msg.content} /> : msg.reportData?.title || ""}
                </div>
              </div>
              <button onClick={() => onUnpin(msg.id)}
                className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" title="Bỏ ghim">
                <PinOff className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============== PERSONAL PROFILE PANEL (Telegram-style) ============== */
function GroupProfilePanel({ onClose, group, sharedMedia, sharedFiles, sharedLinks, isMuted, onToggleMute, onStartDM }: {
  onClose: () => void;
  group: { id: string; name: string; color: string; members?: string[] };
  sharedMedia: ChatMessage[];
  sharedFiles: ChatMessage[];
  sharedLinks: ChatMessage[];
  isMuted: boolean;
  onToggleMute: () => void;
  onStartDM?: (name: string, userId?: string) => void;
}) {
  const [activeSubView, setActiveSubView] = useState<"main" | "photos" | "files" | "links">("main");
  const [showMembersList, setShowMembersList] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const members = group.members || [];
  const fileExtColors: Record<string, string> = { xlsx: "#217346", fig: "#a259ff", pdf: "#dc2626", doc: "#2b579a", zip: "#f59e0b", pptx: "#d24726" };

  const subViewHeader = (title: string, icon: React.ReactNode) => (
    <div className="h-[48px] border-b border-gray-200 flex items-center px-3 shrink-0 gap-2">
      <button onClick={() => setActiveSubView("main")} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all">
        <ArrowLeft className="w-4 h-4" />
      </button>
      {icon}
      <span className="text-[13px] text-gray-800 flex-1">{title}</span>
      <button onClick={onClose} className="hidden md:flex w-7 h-7 rounded-lg hover:bg-gray-100 items-center justify-center text-gray-400 transition-all">
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  if (activeSubView === "photos") {
    return (
      <div className="w-full md:w-[300px] bg-white border-l border-gray-200 flex flex-col shrink-0" style={{ animation: "fadeInScale 0.15s ease" }}>
        {subViewHeader(`${sharedMedia.length} ảnh & video`, <ImageIcon className="w-3.5 h-3.5 text-cyan-500" />)}
        <div className="flex-1 overflow-y-auto">
          {sharedMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <ImageIcon className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-[12px] text-gray-400">Chưa có ảnh nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 p-0.5">
              {sharedMedia.map(msg => (
                <button key={msg.id} onClick={() => setLightboxImg(msg.imageUrl!)} className="aspect-square overflow-hidden group relative">
                  <img src={msg.imageUrl} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
        {lightboxImg && (() => {
          const currentIndex = sharedMedia.findIndex(m => m.imageUrl === lightboxImg);
          const hasNext = currentIndex < sharedMedia.length - 1;
          const hasPrev = currentIndex > 0;
          return (
            <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center" onClick={() => setLightboxImg(null)}>
              <button onClick={() => setLightboxImg(null)} className="absolute top-4 right-4 text-white/80 hover:text-white z-10"><X className="w-6 h-6" /></button>
              {hasPrev && <button onClick={e => { e.stopPropagation(); setLightboxImg(sharedMedia[currentIndex - 1].imageUrl!); }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white hover:bg-white/20 p-3 rounded-full transition-all"><ChevronLeft className="w-6 h-6" /></button>}
              <img src={lightboxImg} alt="" className="max-w-[85vw] max-h-[85vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
              {hasNext && <button onClick={e => { e.stopPropagation(); setLightboxImg(sharedMedia[currentIndex + 1].imageUrl!); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white hover:bg-white/20 p-3 rounded-full transition-all"><ChevronRight className="w-6 h-6" /></button>}
              <div className="absolute bottom-4 text-white/60 text-[12px]">{currentIndex + 1} / {sharedMedia.length}</div>
            </div>
          );
        })()}
      </div>
    );
  }

  if (activeSubView === "files") {
    return (
      <div className="w-full md:w-[300px] bg-white border-l border-gray-200 flex flex-col shrink-0" style={{ animation: "fadeInScale 0.15s ease" }}>
        {subViewHeader(`${sharedFiles.length} tệp tin`, <FileIcon className="w-3.5 h-3.5 text-cyan-500" />)}
        <div className="flex-1 overflow-y-auto">
          {sharedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <FileIcon className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-[12px] text-gray-400">Chưa có tệp tin nào</p>
            </div>
          ) : (
            sharedFiles.map(msg => (
              <div key={msg.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 group cursor-pointer">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-[10px]"
                  style={{ backgroundColor: fileExtColors[msg.fileType || ""] || "#6b7280" }}>
                  {(msg.fileType || "FILE").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-gray-800 truncate">{msg.fileName}</p>
                  <p className="text-[10px] text-gray-500">{msg.fileSize} · {msg.timestamp}</p>
                </div>
                <button onClick={() => toast.success(`Đang tải "${msg.fileName}"`, { duration: 2000 })} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-300 group-hover:text-gray-500 transition-all shrink-0">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (activeSubView === "links") {
    return (
      <div className="w-full md:w-[300px] bg-white border-l border-gray-200 flex flex-col shrink-0" style={{ animation: "fadeInScale 0.15s ease" }}>
        {subViewHeader(`${sharedLinks.length} liên kết`, <Link2 className="w-3.5 h-3.5 text-cyan-500" />)}
        <div className="flex-1 overflow-y-auto">
          {sharedLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <Link2 className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-[12px] text-gray-400">Chưa có liên kết nào</p>
            </div>
          ) : (
            sharedLinks.map(msg => (
              <div key={msg.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-gray-800 truncate">{msg.linkPreview?.title || msg.content}</p>
                  <p className="text-[10px] text-cyan-600 truncate">{msg.linkPreview?.url || ""}</p>
                  <p className="text-[10px] text-gray-400">{msg.timestamp}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  const mediaStats = [
    { icon: <ImageIcon className="w-[18px] h-[18px] text-blue-400" />, bg: "bg-blue-50", label: "Ảnh & video", count: sharedMedia.length, key: "photos" as const },
    { icon: <FileIcon className="w-[18px] h-[18px] text-violet-400" />, bg: "bg-violet-50", label: "Tệp tin", count: sharedFiles.length, key: "files" as const },
    { icon: <Link2 className="w-[18px] h-[18px] text-cyan-400" />, bg: "bg-cyan-50", label: "Liên kết", count: sharedLinks.length, key: "links" as const },
  ];

  return (
    <div className="w-full md:w-[300px] bg-white border-l border-gray-200 flex flex-col shrink-0" style={{ animation: "fadeInScale 0.15s ease" }}>
      <div className="h-[48px] border-b border-gray-200 flex items-center px-4 shrink-0">
        <span className="text-[13px] font-medium text-gray-800 flex-1">Thông tin nhóm</span>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-all"><ChevronLeft className="w-5 h-5 md:hidden" /><X className="w-4 h-4 hidden md:block" /></button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* Group avatar + name */}
        <div className="flex flex-col items-center pt-6 pb-4 px-4">
          <MosaicAvatar members={members} color={group.color} size={64} />
          <p className="text-[15px] font-semibold text-gray-800 mt-3">{group.name}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{members.length} thành viên</p>
        </div>
        {/* Action buttons */}
        <div className="flex justify-center gap-4 px-4 pb-5">
          <button onClick={onToggleMute} className="flex flex-col items-center gap-1.5">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isMuted ? "bg-red-50 text-red-400" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              {isMuted ? <BellOff className="w-4.5 h-4.5" /> : <Bell className="w-4.5 h-4.5" />}
            </div>
            <span className="text-[10px] text-gray-500">{isMuted ? "Bật thông báo" : "Tắt tiếng"}</span>
          </button>
          <button className="flex flex-col items-center gap-1.5" onClick={() => toast("Đã rời nhóm", { duration: 2000 })}>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all">
              <UserMinus className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] text-gray-500">Rời nhóm</span>
          </button>
        </div>
        {/* Members list */}
        <div className="border-t border-gray-100">
          <button onClick={() => setShowMembersList(!showMembersList)} className="w-full flex items-center justify-between px-4 pt-3 pb-1.5 hover:text-cyan-600 transition-colors group">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium group-hover:text-cyan-600 transition-colors">Thành viên ({members.length})</p>
            <ChevronRight className={`w-3.5 h-3.5 text-gray-400 group-hover:text-cyan-600 transition-all ${showMembersList ? "rotate-90" : ""}`} />
          </button>
          {showMembersList && (
            <div className="space-y-1">
              {members.map((name: string, i: number) => {
                const color = memberColorMap[name] || group.color;
                const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                const tm = teamMembers.find(t => t.name === name);
                return (
                  <div
                    key={i}
                    onClick={() => onStartDM && name !== "Nguyễn Minh" && (onStartDM(name, tm?.id), onClose())}
                    className={`flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group/member rounded-lg ${onStartDM && name !== "Nguyễn Minh" ? "cursor-pointer" : ""}`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] text-white shrink-0" style={{ backgroundColor: color }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13px] text-gray-800 truncate">{name}</p>
                        {name === "Nguyễn Minh" && <span className="text-[9px] bg-cyan-50 text-cyan-600 px-1.5 py-0.5 rounded-full shrink-0">Bạn</span>}
                      </div>
                      {tm && <p className="text-[10px] text-gray-400 truncate">{tm.role}</p>}
                      {!tm && (() => { const cd = companyDirectory.find(c => c.name === name); return cd ? <p className="text-[10px] text-gray-400 truncate">{cd.role}</p> : null; })()}
                    </div>
                    {onStartDM && name !== "Nguyễn Minh" && (
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg md:opacity-0 md:group-hover/member:opacity-100 hover:bg-cyan-50 text-cyan-500 transition-all shrink-0">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Media/Files/Links */}
        <div className="border-t border-gray-100 mt-2">
          <p className="px-4 pt-3 pb-1.5 text-[10px] text-gray-400 uppercase tracking-wider font-medium">File & liên kết</p>
          {mediaStats.map(item => (
            <button key={item.key} onClick={() => setActiveSubView(item.key)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0">
              <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>{item.icon}</div>
              <div className="flex-1">
                <p className="text-[12px] text-gray-800">{item.label}</p>
                <p className="text-[10px] text-gray-400">{item.count > 0 ? `${item.count} mục` : "Chưa có"}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function UserProfilePanel({ user, onClose }: {
  user: { id: string; name: string; color: string; isBot?: boolean };
  onClose: () => void;
}) {
  const [muted, setMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isContact, setIsContact] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showEditContact, setShowEditContact] = useState(false);
  const [contactInfo, setContactInfo] = useState({ nickname: "", phone: "", email: "", note: "" });
  const [activeSubView, setActiveSubView] = useState<"main" | "photos" | "files" | "links" | "groups">("main");
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const statusMap: Record<string, { label: string; color: string }> = {
    u2: { label: "đang hoạt động", color: "#22c55e" },
    u3: { label: "đang hoạt động", color: "#22c55e" },
    u4: { label: "vắng mặt", color: "#f59e0b" },
    u5: { label: "ngoại tuyến", color: "#9ca3af" },
  };
  const infoMap: Record<string, { phone: string; bio: string; username: string }> = {
    u2: { phone: "+84 912 345 678", bio: "Design Lead @ VWork 🎨", username: "@tranuong" },
    u3: { phone: "+84 987 654 321", bio: "Fullstack developer, coffee addict ☕", username: "@lephuc.dev" },
    u4: { phone: "+84 934 567 890", bio: "Product Manager | ex-Google", username: "@phamlan" },
    u5: { phone: "+84 911 222 333", bio: "Backend Engineer 🛠️", username: "@hoanhduc" },
  };

  const status = statusMap[user.id] || { label: "đang hoạt động", color: "#22c55e" };
  const info = infoMap[user.id] || { phone: "—", bio: "—", username: "@" + user.name.toLowerCase().replace(/\s+/g, "") };
  const displayName = contactInfo.nickname.trim() || user.name;

  const sharedPhotos = useMemo(() => [
    { id: "sp1", url: "https://images.unsplash.com/photo-1633457896836-f8d6025c85d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "18 Th3 2026", sender: "Bạn" },
    { id: "sp2", url: "https://images.unsplash.com/photo-1562351768-f68650f3ec54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "17 Th3 2026", sender: user.name },
    { id: "sp3", url: "https://images.unsplash.com/photo-1598439473183-42c9301db5dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "16 Th3 2026", sender: "Bạn" },
    { id: "sp4", url: "https://images.unsplash.com/photo-1663669712117-e8ba7d48e46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "15 Th3 2026", sender: user.name },
    { id: "sp5", url: "https://images.unsplash.com/photo-1765611441802-da6a2070578c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "14 Th3 2026", sender: "Bạn" },
    { id: "sp6", url: "https://images.unsplash.com/photo-1695067439031-f59068994fae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "13 Th3 2026", sender: user.name },
    { id: "sp7", url: "https://images.unsplash.com/photo-1615820358106-6b112e1f690d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "12 Th3 2026", sender: "Bạn" },
    { id: "sp8", url: "https://images.unsplash.com/photo-1541167760496-1628856ab772?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "11 Th3 2026", sender: user.name },
    { id: "sp9", url: "https://images.unsplash.com/photo-1623721854453-93a8ad273d16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "10 Th3 2026", sender: "Bạn" },
    { id: "sp10", url: "https://images.unsplash.com/photo-1598087216773-d02ad98034f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "09 Th3 2026", sender: user.name },
    { id: "sp11", url: "https://images.unsplash.com/photo-1674229229331-c45398da14e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "08 Th3 2026", sender: "Bạn" },
    { id: "sp12", url: "https://images.unsplash.com/photo-1649504277328-1f84d8bb19b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "07 Th3 2026", sender: user.name },
    { id: "sp13", url: "https://images.unsplash.com/photo-1666107677986-c264fc8f908e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "06 Th3 2026", sender: "Bạn" },
    { id: "sp14", url: "https://images.unsplash.com/photo-1613723984367-a9b7ee9052d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "05 Th3 2026", sender: user.name },
    { id: "sp15", url: "https://images.unsplash.com/photo-1667297794059-d3cbc4eef35c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "04 Th3 2026", sender: "Bạn" },
    { id: "sp16", url: "https://images.unsplash.com/photo-1666559447692-74196b1c4694?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "03 Th3 2026", sender: user.name },
    { id: "sp17", url: "https://images.unsplash.com/photo-1706463996554-6c6318946b3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "02 Th3 2026", sender: "Bạn" },
    { id: "sp18", url: "https://images.unsplash.com/photo-1768373064063-a7717c6968f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "01 Th3 2026", sender: user.name },
    { id: "sp19", url: "https://images.unsplash.com/photo-1723962807917-ffab0600929c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "28 Th2 2026", sender: "Bạn" },
    { id: "sp20", url: "https://images.unsplash.com/photo-1759668358660-0d06064f0f84?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "27 Th2 2026", sender: user.name },
  ], [user.name]);

  const ppSharedFiles = useMemo(() => [
    { id: "sf1", name: "Báo_cáo_Q1_2026.xlsx", size: "2.4 MB", date: "18 Th3 2026", sender: user.name, ext: "xlsx" },
    { id: "sf2", name: "Design_System_v3.fig", size: "18.7 MB", date: "15 Th3 2026", sender: "Bạn", ext: "fig" },
    { id: "sf3", name: "Meeting_Notes_Sprint42.pdf", size: "540 KB", date: "10 Th3 2026", sender: user.name, ext: "pdf" },
  ], [user.name]);

  const ppSharedLinks = useMemo(() => [
    { id: "sl1", url: "https://figma.com/file/abc123", title: "VWork Pro - Design System", domain: "figma.com", date: "18 Th3", sender: user.name, color: "#a259ff" },
    { id: "sl2", url: "https://github.com/vwork/frontend/pull/142", title: "PR #142: Refactor chat module", domain: "github.com", date: "17 Th3", sender: "Bạn", color: "#24292f" },
    { id: "sl3", url: "https://docs.google.com/spreadsheets/d/xyz", title: "Sprint Planning Q2 2026", domain: "docs.google.com", date: "16 Th3", sender: user.name, color: "#34a853" },
    { id: "sl4", url: "https://notion.so/vwork/roadmap", title: "Product Roadmap 2026", domain: "notion.so", date: "15 Th3", sender: "Bạn", color: "#000" },
    { id: "sl5", url: "https://stackoverflow.com/questions/12345", title: "How to optimize React re-renders", domain: "stackoverflow.com", date: "14 Th3", sender: user.name, color: "#f48024" },
    { id: "sl6", url: "https://medium.com/@dev/react-patterns", title: "Advanced React Patterns 2026", domain: "medium.com", date: "13 Th3", sender: "Bạn", color: "#000" },
    { id: "sl7", url: "https://vercel.com/vwork/deployments", title: "VWork Deployment Dashboard", domain: "vercel.com", date: "12 Th3", sender: user.name, color: "#000" },
    { id: "sl8", url: "https://linear.app/vwork/issue/VW-234", title: "VW-234: Fix chat scroll bug", domain: "linear.app", date: "11 Th3", sender: "Bạn", color: "#5e6ad2" },
    { id: "sl9", url: "https://www.youtube.com/watch?v=abc", title: "React Server Components Deep Dive", domain: "youtube.com", date: "10 Th3", sender: user.name, color: "#ff0000" },
    { id: "sl10", url: "https://tailwindcss.com/docs/v4", title: "Tailwind CSS v4 Documentation", domain: "tailwindcss.com", date: "09 Th3", sender: "Bạn", color: "#06b6d4" },
    { id: "sl11", url: "https://jira.atlassian.com/browse/VW-100", title: "VW-100: Performance audit", domain: "jira.atlassian.com", date: "08 Th3", sender: user.name, color: "#0052cc" },
    { id: "sl12", url: "https://slack.com/archives/C01/p123", title: "Thread: API integration discussion", domain: "slack.com", date: "07 Th3", sender: "Bạn", color: "#4a154b" },
    { id: "sl13", url: "https://npmjs.com/package/motion", title: "motion - npm", domain: "npmjs.com", date: "06 Th3", sender: user.name, color: "#cb3837" },
    { id: "sl14", url: "https://developer.mozilla.org/en-US/docs", title: "MDN Web Docs - CSS Grid", domain: "developer.mozilla.org", date: "05 Th3", sender: "Bạn", color: "#000" },
    { id: "sl15", url: "https://aws.amazon.com/s3", title: "Amazon S3 - Cloud Storage", domain: "aws.amazon.com", date: "04 Th3", sender: user.name, color: "#ff9900" },
    { id: "sl16", url: "https://fonts.google.com/specimen/Outfit", title: "Outfit - Google Fonts", domain: "fonts.google.com", date: "03 Th3", sender: "Bạn", color: "#4285f4" },
    { id: "sl17", url: "https://dribbble.com/shots/vwork-chat", title: "VWork Chat UI Concept", domain: "dribbble.com", date: "02 Th3", sender: user.name, color: "#ea4c89" },
    { id: "sl18", url: "https://postman.com/collections/api-v2", title: "VWork API v2 Collection", domain: "postman.com", date: "01 Th3", sender: "Bạn", color: "#ff6c37" },
    { id: "sl19", url: "https://sentry.io/vwork/issues/789", title: "Sentry: TypeError in ChatView", domain: "sentry.io", date: "28 Th2", sender: user.name, color: "#362d59" },
    { id: "sl20", url: "https://react.dev/learn/hooks", title: "React Hooks Documentation", domain: "react.dev", date: "27 Th2", sender: "Bạn", color: "#087ea4" },
    { id: "sl21", url: "https://supabase.com/docs/guides/auth", title: "Supabase Auth Guide", domain: "supabase.com", date: "26 Th2", sender: user.name, color: "#3ecf8e" },
    { id: "sl22", url: "https://vite.dev/guide", title: "Vite Guide - Next Gen Frontend", domain: "vite.dev", date: "25 Th2", sender: "Bạn", color: "#646cff" },
    { id: "sl23", url: "https://prisma.io/docs", title: "Prisma ORM Documentation", domain: "prisma.io", date: "24 Th2", sender: user.name, color: "#2d3748" },
    { id: "sl24", url: "https://excalidraw.com/#room=vwork", title: "Architecture Diagram - VWork", domain: "excalidraw.com", date: "23 Th2", sender: "Bạn", color: "#6965db" },
    { id: "sl25", url: "https://codepen.io/pen/vwork-animation", title: "Chat Transition Animation Demo", domain: "codepen.io", date: "22 Th2", sender: user.name, color: "#000" },
    { id: "sl26", url: "https://planetscale.com/docs", title: "PlanetScale Database Docs", domain: "planetscale.com", date: "21 Th2", sender: "Bạn", color: "#000" },
    { id: "sl27", url: "https://turborepo.org/docs", title: "Turborepo - Monorepo Tool", domain: "turborepo.org", date: "20 Th2", sender: user.name, color: "#000" },
    { id: "sl28", url: "https://storybook.js.org", title: "Storybook - UI Component Explorer", domain: "storybook.js.org", date: "19 Th2", sender: "Bạn", color: "#ff4785" },
    { id: "sl29", url: "https://zod.dev", title: "Zod - TypeScript Schema Validation", domain: "zod.dev", date: "18 Th2", sender: user.name, color: "#3068b7" },
    { id: "sl30", url: "https://tanstack.com/query/latest", title: "TanStack Query Documentation", domain: "tanstack.com", date: "17 Th2", sender: "Bạn", color: "#ef4444" },
    { id: "sl31", url: "https://railway.app/dashboard", title: "Railway - Cloud Deployment", domain: "railway.app", date: "16 Th2", sender: user.name, color: "#000" },
    { id: "sl32", url: "https://pnpm.io/motivation", title: "pnpm - Fast Package Manager", domain: "pnpm.io", date: "15 Th2", sender: "Bạn", color: "#f69220" },
    { id: "sl33", url: "https://vitest.dev/guide", title: "Vitest - Next Gen Testing", domain: "vitest.dev", date: "14 Th2", sender: user.name, color: "#729b1b" },
    { id: "sl34", url: "https://playwright.dev/docs/intro", title: "Playwright E2E Testing", domain: "playwright.dev", date: "13 Th2", sender: "Bạn", color: "#2ead33" },
    { id: "sl35", url: "https://www.typescriptlang.org/docs", title: "TypeScript Documentation", domain: "typescriptlang.org", date: "12 Th2", sender: user.name, color: "#3178c6" },
    { id: "sl36", url: "https://nextjs.org/docs/app", title: "Next.js App Router Docs", domain: "nextjs.org", date: "11 Th2", sender: "Bạn", color: "#000" },
    { id: "sl37", url: "https://radix-ui.com/docs", title: "Radix UI Primitives", domain: "radix-ui.com", date: "10 Th2", sender: user.name, color: "#000" },
    { id: "sl38", url: "https://sonner.dev", title: "Sonner - Toast Component", domain: "sonner.dev", date: "09 Th2", sender: "Bạn", color: "#000" },
    { id: "sl39", url: "https://lucide.dev/icons", title: "Lucide Icons Library", domain: "lucide.dev", date: "08 Th2", sender: user.name, color: "#f56565" },
    { id: "sl40", url: "https://recharts.org/en-US/api", title: "Recharts API Reference", domain: "recharts.org", date: "07 Th2", sender: "Bạn", color: "#8884d8" },
    { id: "sl41", url: "https://date-fns.org/docs", title: "date-fns Documentation", domain: "date-fns.org", date: "06 Th2", sender: user.name, color: "#770c56" },
    { id: "sl42", url: "https://formik.org/docs/overview", title: "Formik - Form Library", domain: "formik.org", date: "05 Th2", sender: "Bạn", color: "#1a73e8" },
  ], [user.name]);

  const fileExtColors: Record<string, string> = { xlsx: "#217346", fig: "#a259ff", pdf: "#dc2626", doc: "#2b579a", zip: "#f59e0b", pptx: "#d24726" };

  const subViewHeader = (title: string, icon: React.ReactNode) => (
    <div className="h-[52px] border-b border-gray-100 flex items-center px-4 shrink-0 gap-2 bg-white">
      <button onClick={() => setActiveSubView("main")} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all">
        <ArrowLeft className="w-4 h-4" />
      </button>
      {icon}
      <span className="text-[14px] font-medium text-gray-800 flex-1">{title}</span>
      <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all">
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  const renderInner = () => {
    // ---- Photos ----
    if (activeSubView === "photos") {
      const grouped: Record<string, typeof sharedPhotos> = {};
      sharedPhotos.forEach(p => {
        const month = p.date.split(" ").slice(1).join(" ");
        if (!grouped[month]) grouped[month] = [];
        grouped[month].push(p);
      });
      return (
        <>
          {subViewHeader(`${sharedPhotos.length} ảnh`, <ImageIcon className="w-4 h-4 text-sky-500" />)}
          <div className="flex-1 overflow-y-auto">
            {Object.entries(grouped).map(([month, photos]) => (
              <div key={month}>
                <div className="px-4 py-2 sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                  <span className="text-[11px] text-gray-500">{month}</span>
                </div>
                <div className="grid grid-cols-3 gap-0.5 px-0.5">
                  {photos.map(photo => (
                    <button key={photo.id} onClick={() => setLightboxImg(photo.url)} className="aspect-square overflow-hidden group relative">
                      <img src={photo.url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {lightboxImg && (() => {
            const currentIndex = sharedPhotos.findIndex(p => p.url === lightboxImg);
            return (
              <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center" onClick={() => setLightboxImg(null)}>
                <button onClick={() => setLightboxImg(null)} className="absolute top-4 right-4 text-white/80 hover:text-white z-10"><X className="w-6 h-6" /></button>
                {currentIndex > 0 && <button onClick={e => { e.stopPropagation(); setLightboxImg(sharedPhotos[currentIndex - 1].url); }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white hover:bg-white/20 p-3 rounded-full transition-all"><ChevronLeft className="w-6 h-6" /></button>}
                <img src={lightboxImg} alt="" className="max-w-[85vw] max-h-[85vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
                {currentIndex < sharedPhotos.length - 1 && <button onClick={e => { e.stopPropagation(); setLightboxImg(sharedPhotos[currentIndex + 1].url); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white hover:bg-white/20 p-3 rounded-full transition-all"><ChevronRight className="w-6 h-6" /></button>}
                <div className="absolute bottom-4 flex gap-2 items-center">
                  <div className="text-white/60 text-[12px]">{currentIndex + 1} / {sharedPhotos.length}</div>
                  <button onClick={e => { e.stopPropagation(); toast.success("Đã tải ảnh về", { duration: 2000 }); }} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[12px] flex items-center gap-1.5 backdrop-blur-sm transition-colors"><Download className="w-3.5 h-3.5" />Tải về</button>
                  <button onClick={e => { e.stopPropagation(); copyToClipboard(lightboxImg || "").then(() => toast.success("Đã sao chép liên kết", { duration: 2000 })); }} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[12px] flex items-center gap-1.5 backdrop-blur-sm transition-colors"><Share2 className="w-3.5 h-3.5" />Chia sẻ</button>
                </div>
              </div>
            );
          })()}
        </>
      );
    }

    // ---- Files ----
    if (activeSubView === "files") {
      return (
        <>
          {subViewHeader(`${ppSharedFiles.length} tệp tin`, <FileIcon className="w-4 h-4 text-amber-500" />)}
          <div className="flex-1 overflow-y-auto">
            {ppSharedFiles.map(file => (
              <div key={file.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 group cursor-pointer">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-[10px]" style={{ backgroundColor: fileExtColors[file.ext] || "#6b7280" }}>
                  {file.ext.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-gray-800 truncate">{file.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-gray-500">{file.size}</span>
                    <span className="text-[11px] text-gray-300">·</span>
                    <span className="text-[11px] text-gray-500">{file.date}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Từ: {file.sender}</p>
                </div>
                <button onClick={() => toast.success(`Đang tải "${file.name}"`, { duration: 2000 })} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-300 group-hover:text-gray-500 transition-all shrink-0 mt-0.5">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      );
    }

    // ---- Links ----
    if (activeSubView === "links") {
      return (
        <>
          {subViewHeader(`${ppSharedLinks.length} liên kết chung`, <Link2 className="w-4 h-4 text-green-500" />)}
          <div className="flex-1 overflow-y-auto">
            {ppSharedLinks.map(link => (
              <button key={link.id} onClick={() => { copyToClipboard(link.url).then(() => toast.success("Đã sao chép liên kết", { duration: 1500 })); }} className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: link.color + "14" }}>
                  <Globe className="w-3.5 h-3.5" style={{ color: link.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-gray-800 truncate group-hover:text-cyan-600 transition-colors">{link.title}</p>
                  <p className="text-[10px] text-cyan-600/70 truncate mt-0.5">{link.domain}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-500">{link.sender}</span>
                    <span className="text-[10px] text-gray-300">·</span>
                    <span className="text-[10px] text-gray-500">{link.date}</span>
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-gray-400 shrink-0 mt-1.5 transition-colors" />
              </button>
            ))}
          </div>
        </>
      );
    }

    // ---- Groups ----
    if (activeSubView === "groups") {
      return (
        <>
          {subViewHeader("15 nhóm chung", <Users className="w-4 h-4 text-indigo-500" />)}
          <div className="flex-1 overflow-y-auto">
            {commonGroups.map(group => (
              <button key={group.id} onClick={() => { onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left group/item">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg" style={{ backgroundColor: group.color + "15" }}>
                  {group.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-gray-800 group-hover/item:text-cyan-600 transition-colors">{group.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-gray-500">{group.members} thành viên</span>
                    <span className="text-[11px] text-gray-300">·</span>
                    <span className="text-[11px] text-gray-500">{group.lastActive}</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover/item:text-gray-400 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </>
      );
    }

    // ---- Delete confirm ----
    if (showDeleteConfirm) {
      return (
        <>
          <div className="h-[52px] border-b border-gray-100 flex items-center px-4 shrink-0 bg-white">
            <button onClick={() => setShowDeleteConfirm(false)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all mr-2">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-[14px] font-medium text-gray-800 flex-1">Xác nhận</span>
            <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-[15px] font-semibold text-gray-900 mb-2">Xoá liên hệ?</h3>
            <p className="text-[13px] text-gray-500 text-center mb-6">Bạn chắc chắn muốn xoá "{displayName}" khỏi danh bạ? Bạn vẫn có thể tìm thấy tin nhắn của họ trong chat.</p>
            <div className="flex gap-2 w-full">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">Hủy</button>
              <button onClick={() => { setIsContact(v => !v); toast(isContact ? "Đã xoá liên hệ" : "Đã thêm liên hệ", { icon: <Trash2 className={`w-4 h-4 ${isContact ? "text-red-500" : "text-green-500"}`} />, duration: 2000 }); setShowDeleteConfirm(false); }} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13px] hover:bg-red-600 transition-colors">Xoá</button>
            </div>
          </div>
        </>
      );
    }

    // ---- Block confirm ----
    if (showBlockConfirm) {
      return (
        <>
          <div className="h-[52px] border-b border-gray-100 flex items-center px-4 shrink-0 bg-white">
            <button onClick={() => setShowBlockConfirm(false)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all mr-2">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-[14px] font-medium text-gray-800 flex-1">Xác nhận</span>
            <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-[15px] font-semibold text-gray-900 mb-2">{isBlocked ? "Bỏ chặn người dùng?" : "Chặn người dùng?"}</h3>
            <p className="text-[13px] text-gray-500 text-center mb-6">
              {isBlocked ? `${displayName} sẽ có thể liên hệ bạn trở lại sau khi bỏ chặn.` : `${displayName} sẽ không thể xem tin nhắn, gửi tin nhắn hoặc liên hệ bạn. Họ sẽ không biết bạn đã chặn họ.`}
            </p>
            <div className="flex gap-2 w-full">
              <button onClick={() => setShowBlockConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">Hủy</button>
              <button onClick={() => { setIsBlocked(v => !v); toast(isBlocked ? "Đã bỏ chặn người dùng" : "Đã chặn người dùng", { icon: <Ban className={`w-4 h-4 ${isBlocked ? "text-green-500" : "text-red-500"}`} />, duration: 2000 }); setShowBlockConfirm(false); }} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13px] hover:bg-red-600 transition-colors">{isBlocked ? "Bỏ chặn" : "Chặn"}</button>
            </div>
          </div>
        </>
      );
    }

    // ---- Main view ----
    return (
      <>
        {/* Colored gradient header */}
        <div className="relative pt-10 pb-6 flex flex-col items-center shrink-0"
          style={{ background: `linear-gradient(160deg, ${user.color}dd 0%, ${user.color}99 100%)` }}>
          {(["top-3 left-8","top-6 right-12","top-2 right-6","top-8 left-16","top-4 left-28"] as const).map((pos, i) => (
            <span key={i} className={`absolute ${pos} text-[10px] opacity-30 text-white pointer-events-none`}>♥</span>
          ))}
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-black/30 transition-all z-10">
            <X className="w-4 h-4" />
          </button>
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-[30px] font-bold text-white shadow-xl border-[3px] border-white/40" style={{ backgroundColor: user.color }}>
            {user.isBot ? <Bot className="w-9 h-9 text-white" /> : displayName.charAt(0)}
          </div>
          <div className="mt-3 text-center px-4">
            <div className="flex items-center gap-1.5 justify-center">
              <h2 className="text-[18px] font-semibold text-white">{displayName}</h2>
              <div className="w-2.5 h-2.5 rounded-full border-2 border-white/50" style={{ backgroundColor: status.color }} />
            </div>
            <p className="text-[12px] text-white/70 mt-0.5">{status.label}</p>
          </div>
          <div className="flex items-center gap-2.5 mt-4">
            {[
              { icon: <MessageSquare className="w-[18px] h-[18px]" />, label: "Nhắn tin", action: () => { onClose(); toast.success(`Mở chat với ${displayName}`); } },
              { icon: muted ? <Bell className="w-[18px] h-[18px]" /> : <BellOff className="w-[18px] h-[18px]" />, label: muted ? "Bật thông báo" : "Tắt thông báo", action: () => { setMuted(v => !v); toast.success(muted ? "Đã bật thông báo" : "Đã tắt thông báo"); } },
              { icon: <Phone className="w-[18px] h-[18px]" />, label: "Gọi điện", action: () => toast.success(`Đang gọi ${displayName}...`) },
              { icon: <MoreHorizontal className="w-[18px] h-[18px]" />, label: "Thêm", action: () => {} },
            ].map(btn => (
              <button key={btn.label} onClick={btn.action} className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 rounded-2xl bg-white/20 hover:bg-white/35 active:bg-white/10 flex items-center justify-center text-white transition-all">{btn.icon}</div>
                <span className="text-[10px] text-white/80 whitespace-nowrap">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 bg-gray-50">
          {/* Contact info */}
          <div className="bg-white mt-2 divide-y divide-gray-100">
            <button onClick={() => { copyToClipboard(contactInfo.phone || info.phone); toast.success("Đã sao chép số điện thoại"); }} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-all text-left">
              <Phone className="w-[15px] h-[15px] text-gray-400 shrink-0" />
              <div className="flex-1"><p className="text-[14px] text-gray-800">{contactInfo.phone || info.phone}</p><p className="text-[11px] text-gray-400 mt-0.5">Di động</p></div>
              <Copy className="w-3.5 h-3.5 text-gray-300" />
            </button>
            <button onClick={() => { copyToClipboard(info.bio); toast.success("Đã sao chép giới thiệu"); }} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-all text-left">
              <Info className="w-[15px] h-[15px] text-gray-400 shrink-0" />
              <div className="flex-1"><p className="text-[14px] text-gray-800">{info.bio}</p><p className="text-[11px] text-gray-400 mt-0.5">Giới thiệu</p></div>
              <Copy className="w-3.5 h-3.5 text-gray-300" />
            </button>
            <button onClick={() => { copyToClipboard(info.username); toast.success("Đã sao chép tên người dùng"); }} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-all text-left">
              <AtSign className="w-[15px] h-[15px] text-gray-400 shrink-0" />
              <div className="flex-1"><p className="text-[14px] font-medium" style={{ color: user.color }}>{info.username}</p><p className="text-[11px] text-gray-400 mt-0.5">Tên người dùng</p></div>
              <Copy className="w-3.5 h-3.5 text-gray-300" />
            </button>
            {contactInfo.email && (
              <button onClick={() => { copyToClipboard(contactInfo.email); toast.success("Đã sao chép email"); }} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-all text-left">
                <Mail className="w-[15px] h-[15px] text-gray-400 shrink-0" />
                <div className="flex-1"><p className="text-[14px] text-gray-800">{contactInfo.email}</p><p className="text-[11px] text-gray-400 mt-0.5">Email</p></div>
                <Copy className="w-3.5 h-3.5 text-gray-300" />
              </button>
            )}
            {contactInfo.note && (
              <div className="flex items-start gap-3 px-5 py-3.5">
                <FileText className="w-[15px] h-[15px] text-gray-400 shrink-0 mt-0.5" />
                <div className="flex-1"><p className="text-[14px] text-gray-800">{contactInfo.note}</p><p className="text-[11px] text-gray-400 mt-0.5">Ghi chú</p></div>
              </div>
            )}
          </div>

          {/* Media stats */}
          <div className="bg-white mt-2 divide-y divide-gray-100">
            {[
              { icon: <ImageIcon className="w-[15px] h-[15px]" />, label: `${sharedPhotos.length} ảnh`, color: "text-sky-500", key: "photos" as const },
              { icon: <FileIcon className="w-[15px] h-[15px]" />, label: `${ppSharedFiles.length} tệp tin`, color: "text-amber-500", key: "files" as const },
              { icon: <Link2 className="w-[15px] h-[15px]" />, label: `${ppSharedLinks.length} liên kết chung`, color: "text-green-500", key: "links" as const },
              { icon: <Users className="w-[15px] h-[15px]" />, label: "15 nhóm chung", color: "text-indigo-500", key: "groups" as const },
            ].map(item => (
              <button key={item.key} onClick={() => setActiveSubView(item.key)} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 active:bg-gray-100 transition-all text-left">
                <span className={item.color}>{item.icon}</span>
                <span className="text-[14px] text-gray-700 flex-1">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="bg-white mt-2 mb-3 divide-y divide-gray-100">
            <button onClick={() => { copyToClipboard(`https://vwork.pro/u/${user.id}`).then(() => toast.success("Đã sao chép liên kết liên hệ", { duration: 2000 })); }} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-all text-left">
              <Share2 className="w-[15px] h-[15px] text-gray-400" />
              <span className="text-[14px] text-gray-700">Chia sẻ liên hệ</span>
            </button>
            <button onClick={() => setShowEditContact(true)} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-all text-left">
              <Pencil className="w-[15px] h-[15px] text-gray-400" />
              <span className="text-[14px] text-gray-700">Chỉnh sửa liên hệ</span>
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-all text-left">
              <Trash2 className="w-[15px] h-[15px] text-gray-400" />
              <span className="text-[14px] text-gray-700">{isContact ? "Xoá liên hệ" : "Thêm liên hệ"}</span>
            </button>
            <button onClick={() => setShowBlockConfirm(true)} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-red-50 active:bg-red-100 transition-all text-left">
              <Ban className="w-[15px] h-[15px] text-red-500" />
              <span className="text-[14px] text-red-500">{isBlocked ? `Bỏ chặn ${displayName}` : "Chặn người dùng"}</span>
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-[80]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-[360px] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col pointer-events-auto"
          style={{ maxHeight: "min(90vh, 700px)" }}
          onClick={e => e.stopPropagation()}
        >
          {renderInner()}
        </div>
      </div>

      {/* Edit Contact Modal (nested above popup) */}
      {showEditContact && (
        <div className="absolute inset-0 flex items-end md:items-center justify-center pointer-events-auto z-10" onClick={() => setShowEditContact(false)}>
          <EditContactModal
            person={{ id: user.id, name: user.name, icon: user.name.charAt(0), color: user.color }}
            contactInfo={contactInfo}
            onClose={() => setShowEditContact(false)}
            onSave={(info) => { setContactInfo(info); setShowEditContact(false); toast.success("Đã lưu thông tin liên hệ"); }}
          />
        </div>
      )}
    </div>
  );
}

function PersonalNotesInfoPanel({ onClose, sharedMedia, sharedFiles, sharedLinks, totalNotes, pinnedNotes }: {
  onClose: () => void;
  sharedMedia: ChatMessage[];
  sharedFiles: ChatMessage[];
  sharedLinks: ChatMessage[];
  totalNotes: number;
  pinnedNotes: number;
}) {
  const [activeSubView, setActiveSubView] = useState<"main" | "photos" | "files" | "links">("main");
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const fileExtColors: Record<string, string> = { xlsx: "#217346", fig: "#a259ff", pdf: "#dc2626", doc: "#2b579a", zip: "#f59e0b", pptx: "#d24726" };

  const subViewHeader = (title: string, icon: React.ReactNode) => (
    <div className="h-[48px] border-b border-gray-200 flex items-center px-3 shrink-0 gap-2">
      <button onClick={() => setActiveSubView("main")} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all">
        <ArrowLeft className="w-4 h-4" />
      </button>
      {icon}
      <span className="text-[13px] text-gray-800 flex-1">{title}</span>
      <button onClick={onClose} className="hidden md:flex w-7 h-7 rounded-lg hover:bg-gray-100 items-center justify-center text-gray-400 transition-all">
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  if (activeSubView === "photos") {
    return (
      <div className="w-full md:w-[300px] bg-white border-l border-gray-200 flex flex-col shrink-0" style={{ animation: "fadeInScale 0.15s ease" }}>
        {subViewHeader(`${sharedMedia.length} ảnh & video`, <ImageIcon className="w-3.5 h-3.5 text-cyan-500" />)}
        <div className="flex-1 overflow-y-auto">
          {sharedMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <ImageIcon className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-[12px] text-gray-400">Chưa có ảnh nào trong ghi chú</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 p-0.5">
              {sharedMedia.map(msg => (
                <button key={msg.id} onClick={() => setLightboxImg(msg.imageUrl!)} className="aspect-square overflow-hidden group relative">
                  <img src={msg.imageUrl} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
        {lightboxImg && (() => {
          const currentIndex = sharedMedia.findIndex(m => m.imageUrl === lightboxImg);
          const hasNext = currentIndex < sharedMedia.length - 1;
          const hasPrev = currentIndex > 0;
          return (
            <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center" onClick={() => setLightboxImg(null)}>
              <button onClick={() => setLightboxImg(null)} className="absolute top-4 right-4 text-white/80 hover:text-white z-10"><X className="w-6 h-6" /></button>
              {hasPrev && <button onClick={e => { e.stopPropagation(); setLightboxImg(sharedMedia[currentIndex - 1].imageUrl!); }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white hover:bg-white/20 p-3 rounded-full transition-all"><ChevronLeft className="w-6 h-6" /></button>}
              <img src={lightboxImg} alt="" className="max-w-[85vw] max-h-[85vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
              {hasNext && <button onClick={e => { e.stopPropagation(); setLightboxImg(sharedMedia[currentIndex + 1].imageUrl!); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white hover:bg-white/20 p-3 rounded-full transition-all"><ChevronRight className="w-6 h-6" /></button>}
              <div className="absolute bottom-4 flex gap-2 items-center">
                <div className="text-white/60 text-[12px]">{currentIndex + 1} / {sharedMedia.length}</div>
                <button onClick={e => { e.stopPropagation(); toast.success("Đã tải ảnh về", { duration: 2000 }); }} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[12px] flex items-center gap-1.5 backdrop-blur-sm transition-colors">
                  <Download className="w-3.5 h-3.5" />Tải về
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  if (activeSubView === "files") {
    return (
      <div className="w-full md:w-[300px] bg-white border-l border-gray-200 flex flex-col shrink-0" style={{ animation: "fadeInScale 0.15s ease" }}>
        {subViewHeader(`${sharedFiles.length} tệp tin`, <FileIcon className="w-3.5 h-3.5 text-cyan-500" />)}
        <div className="flex-1 overflow-y-auto">
          {sharedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <FileIcon className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-[12px] text-gray-400">Chưa có tệp tin nào trong ghi chú</p>
            </div>
          ) : (
            sharedFiles.map(msg => (
              <div key={msg.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 group cursor-pointer">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-[10px]"
                  style={{ backgroundColor: fileExtColors[msg.fileType || ""] || "#6b7280" }}>
                  {(msg.fileType || "FILE").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-gray-800 truncate">{msg.fileName}</p>
                  <p className="text-[10px] text-gray-500">{msg.fileSize} · {msg.timestamp}</p>
                </div>
                <button onClick={() => toast.success(`Đang tải "${msg.fileName}"`, { duration: 2000 })} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-300 group-hover:text-gray-500 transition-all shrink-0">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (activeSubView === "links") {
    return (
      <div className="w-full md:w-[300px] bg-white border-l border-gray-200 flex flex-col shrink-0" style={{ animation: "fadeInScale 0.15s ease" }}>
        {subViewHeader(`${sharedLinks.length} liên kết`, <Link2 className="w-3.5 h-3.5 text-cyan-500" />)}
        <div className="flex-1 overflow-y-auto">
          {sharedLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <Link2 className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-[12px] text-gray-400">Chưa có liên kết nào trong ghi chú</p>
            </div>
          ) : (
            sharedLinks.map(msg => (
              <div key={msg.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-gray-800 truncate">{msg.linkPreview?.title || msg.content}</p>
                  <p className="text-[10px] text-cyan-600 truncate">{msg.linkPreview?.url || ""}</p>
                  <p className="text-[10px] text-gray-400">{msg.timestamp}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  const storageItems = [
    { icon: <ImageIcon className="w-[18px] h-[18px] text-blue-400" />, bg: "bg-blue-50", label: "Ảnh & video", count: sharedMedia.length, key: "photos" as const, color: "text-blue-600" },
    { icon: <FileIcon className="w-[18px] h-[18px] text-violet-400" />, bg: "bg-violet-50", label: "Tệp tin", count: sharedFiles.length, key: "files" as const, color: "text-violet-600" },
    { icon: <Link2 className="w-[18px] h-[18px] text-cyan-400" />, bg: "bg-cyan-50", label: "Liên kết", count: sharedLinks.length, key: "links" as const, color: "text-cyan-600" },
  ];

  return (
    <div className="w-full md:w-[300px] bg-white border-l border-gray-200 flex flex-col shrink-0" style={{ animation: "fadeInScale 0.15s ease" }}>
      <div className="h-[48px] border-b border-gray-200 flex items-center px-4 shrink-0">
        <button onClick={onClose} className="md:hidden w-8 h-8 flex items-center justify-center -ml-1 text-gray-500 hover:text-gray-700 shrink-0 mr-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-[13px] font-medium text-gray-800 flex-1">Thông tin ghi chú</span>
        <button onClick={onClose} className="hidden md:flex w-7 h-7 rounded-lg hover:bg-gray-100 items-center justify-center text-gray-400 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center pt-6 pb-4 px-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 mb-3">
            <span className="text-3xl">📝</span>
          </div>
          <p className="text-[14px] font-medium text-gray-800">Ghi chú cá nhân</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Chỉ bạn mới xem được</p>
        </div>
        <div className="mx-4 mb-5 p-3 bg-gray-50 rounded-xl flex items-center gap-2">
          <div className="flex-1 text-center">
            <p className="text-[18px] font-semibold text-gray-800">{totalNotes}</p>
            <p className="text-[10px] text-gray-500">ghi chú</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="flex-1 text-center">
            <p className="text-[18px] font-semibold text-amber-500">{pinnedNotes}</p>
            <p className="text-[10px] text-gray-500">đã ghim</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="flex-1 text-center">
            <p className="text-[18px] font-semibold text-cyan-500">{sharedMedia.length + sharedFiles.length}</p>
            <p className="text-[10px] text-gray-500">đính kèm</p>
          </div>
        </div>
        <div className="border-t border-gray-100">
          <p className="px-4 pt-3 pb-1.5 text-[10px] text-gray-400 uppercase tracking-wider font-medium">Lưu trữ</p>
          {storageItems.map(item => (
            <button key={item.key} onClick={() => setActiveSubView(item.key)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0">
              <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="text-[13px] text-gray-800">{item.label}</p>
                <p className={`text-[11px] ${item.count > 0 ? item.color : "text-gray-400"}`}>
                  {item.count > 0 ? `${item.count} mục` : "Chưa có"}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PersonalProfilePanel({ onClose, person, isMuted, onToggleMute, onOpenGroup }: {
  onClose: () => void;
  person: { id: string; name: string; icon: string; color: string; online?: boolean; userId?: string };
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenGroup?: (groupId: string) => void;
}) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isContact, setIsContact] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [activeSubView, setActiveSubView] = useState<"main" | "photos" | "files" | "links" | "groups">("main");
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [showEditContact, setShowEditContact] = useState(false);
  const [contactInfo, setContactInfo] = useState({ nickname: "", phone: "", email: "", note: "" });

  const displayName = contactInfo.nickname.trim() || person.name;
  const initials = person.icon || displayName.split(" ").map(w => w[0]).join("").slice(0, 2);
  const lastSeen = person.online ? "đang hoạt động" : "truy cập lần cuối hôm nay lúc 14:42";

  const sharedPhotos = useMemo(() => [
    { id: "sp1", url: "https://images.unsplash.com/photo-1633457896836-f8d6025c85d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "18 Th3 2026", sender: "Bạn" },
    { id: "sp2", url: "https://images.unsplash.com/photo-1562351768-f68650f3ec54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "17 Th3 2026", sender: person.name },
    { id: "sp3", url: "https://images.unsplash.com/photo-1598439473183-42c9301db5dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "16 Th3 2026", sender: "Bạn" },
    { id: "sp4", url: "https://images.unsplash.com/photo-1663669712117-e8ba7d48e46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "15 Th3 2026", sender: person.name },
    { id: "sp5", url: "https://images.unsplash.com/photo-1765611441802-da6a2070578c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "14 Th3 2026", sender: "Bạn" },
    { id: "sp6", url: "https://images.unsplash.com/photo-1695067439031-f59068994fae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "13 Th3 2026", sender: person.name },
    { id: "sp7", url: "https://images.unsplash.com/photo-1615820358106-6b112e1f690d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "12 Th3 2026", sender: "Bạn" },
    { id: "sp8", url: "https://images.unsplash.com/photo-1541167760496-1628856ab772?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "11 Th3 2026", sender: person.name },
    { id: "sp9", url: "https://images.unsplash.com/photo-1623721854453-93a8ad273d16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "10 Th3 2026", sender: "Bạn" },
    { id: "sp10", url: "https://images.unsplash.com/photo-1598087216773-d02ad98034f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "09 Th3 2026", sender: person.name },
    { id: "sp11", url: "https://images.unsplash.com/photo-1674229229331-c45398da14e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "08 Th3 2026", sender: "Bạn" },
    { id: "sp12", url: "https://images.unsplash.com/photo-1649504277328-1f84d8bb19b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "07 Th3 2026", sender: person.name },
    { id: "sp13", url: "https://images.unsplash.com/photo-1666107677986-c264fc8f908e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "06 Th3 2026", sender: "Bạn" },
    { id: "sp14", url: "https://images.unsplash.com/photo-1613723984367-a9b7ee9052d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "05 Th3 2026", sender: person.name },
    { id: "sp15", url: "https://images.unsplash.com/photo-1667297794059-d3cbc4eef35c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "04 Th3 2026", sender: "Bạn" },
    { id: "sp16", url: "https://images.unsplash.com/photo-1666559447692-74196b1c4694?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "03 Th3 2026", sender: person.name },
    { id: "sp17", url: "https://images.unsplash.com/photo-1706463996554-6c6318946b3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "02 Th3 2026", sender: "Bạn" },
    { id: "sp18", url: "https://images.unsplash.com/photo-1768373064063-a7717c6968f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "01 Th3 2026", sender: person.name },
    { id: "sp19", url: "https://images.unsplash.com/photo-1723962807917-ffab0600929c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "28 Th2 2026", sender: "Bạn" },
    { id: "sp20", url: "https://images.unsplash.com/photo-1759668358660-0d06064f0f84?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400", date: "27 Th2 2026", sender: person.name },
  ], [person.name]);

  const ppSharedFiles = useMemo(() => [
    { id: "sf1", name: "Báo_cáo_Q1_2026.xlsx", size: "2.4 MB", date: "18 Th3 2026", sender: person.name, ext: "xlsx" },
    { id: "sf2", name: "Design_System_v3.fig", size: "18.7 MB", date: "15 Th3 2026", sender: "Bạn", ext: "fig" },
    { id: "sf3", name: "Meeting_Notes_Sprint42.pdf", size: "540 KB", date: "10 Th3 2026", sender: person.name, ext: "pdf" },
  ], [person.name]);

  const ppSharedLinks = useMemo(() => [
    { id: "sl1", url: "https://figma.com/file/abc123", title: "VWork Pro - Design System", domain: "figma.com", date: "18 Th3", sender: person.name, color: "#a259ff" },
    { id: "sl2", url: "https://github.com/vwork/frontend/pull/142", title: "PR #142: Refactor chat module", domain: "github.com", date: "17 Th3", sender: "Bạn", color: "#24292f" },
    { id: "sl3", url: "https://docs.google.com/spreadsheets/d/xyz", title: "Sprint Planning Q2 2026", domain: "docs.google.com", date: "16 Th3", sender: person.name, color: "#34a853" },
    { id: "sl4", url: "https://notion.so/vwork/roadmap", title: "Product Roadmap 2026", domain: "notion.so", date: "15 Th3", sender: "Bạn", color: "#000" },
    { id: "sl5", url: "https://stackoverflow.com/questions/12345", title: "How to optimize React re-renders", domain: "stackoverflow.com", date: "14 Th3", sender: person.name, color: "#f48024" },
    { id: "sl6", url: "https://medium.com/@dev/react-patterns", title: "Advanced React Patterns 2026", domain: "medium.com", date: "13 Th3", sender: "Bạn", color: "#000" },
    { id: "sl7", url: "https://vercel.com/vwork/deployments", title: "VWork Deployment Dashboard", domain: "vercel.com", date: "12 Th3", sender: person.name, color: "#000" },
    { id: "sl8", url: "https://linear.app/vwork/issue/VW-234", title: "VW-234: Fix chat scroll bug", domain: "linear.app", date: "11 Th3", sender: "Bạn", color: "#5e6ad2" },
    { id: "sl9", url: "https://www.youtube.com/watch?v=abc", title: "React Server Components Deep Dive", domain: "youtube.com", date: "10 Th3", sender: person.name, color: "#ff0000" },
    { id: "sl10", url: "https://tailwindcss.com/docs/v4", title: "Tailwind CSS v4 Documentation", domain: "tailwindcss.com", date: "09 Th3", sender: "Bạn", color: "#06b6d4" },
    { id: "sl11", url: "https://jira.atlassian.com/browse/VW-100", title: "VW-100: Performance audit", domain: "jira.atlassian.com", date: "08 Th3", sender: person.name, color: "#0052cc" },
    { id: "sl12", url: "https://slack.com/archives/C01/p123", title: "Thread: API integration discussion", domain: "slack.com", date: "07 Th3", sender: "Bạn", color: "#4a154b" },
    { id: "sl13", url: "https://npmjs.com/package/motion", title: "motion - npm", domain: "npmjs.com", date: "06 Th3", sender: person.name, color: "#cb3837" },
    { id: "sl14", url: "https://developer.mozilla.org/en-US/docs", title: "MDN Web Docs - CSS Grid", domain: "developer.mozilla.org", date: "05 Th3", sender: "Bạn", color: "#000" },
    { id: "sl15", url: "https://aws.amazon.com/s3", title: "Amazon S3 - Cloud Storage", domain: "aws.amazon.com", date: "04 Th3", sender: person.name, color: "#ff9900" },
    { id: "sl16", url: "https://fonts.google.com/specimen/Outfit", title: "Outfit - Google Fonts", domain: "fonts.google.com", date: "03 Th3", sender: "Bạn", color: "#4285f4" },
    { id: "sl17", url: "https://dribbble.com/shots/vwork-chat", title: "VWork Chat UI Concept", domain: "dribbble.com", date: "02 Th3", sender: person.name, color: "#ea4c89" },
    { id: "sl18", url: "https://postman.com/collections/api-v2", title: "VWork API v2 Collection", domain: "postman.com", date: "01 Th3", sender: "Bạn", color: "#ff6c37" },
    { id: "sl19", url: "https://sentry.io/vwork/issues/789", title: "Sentry: TypeError in ChatView", domain: "sentry.io", date: "28 Th2", sender: person.name, color: "#362d59" },
    { id: "sl20", url: "https://react.dev/learn/hooks", title: "React Hooks Documentation", domain: "react.dev", date: "27 Th2", sender: "Bạn", color: "#087ea4" },
    { id: "sl21", url: "https://supabase.com/docs/guides/auth", title: "Supabase Auth Guide", domain: "supabase.com", date: "26 Th2", sender: person.name, color: "#3ecf8e" },
    { id: "sl22", url: "https://vite.dev/guide", title: "Vite Guide - Next Gen Frontend", domain: "vite.dev", date: "25 Th2", sender: "Bạn", color: "#646cff" },
    { id: "sl23", url: "https://prisma.io/docs", title: "Prisma ORM Documentation", domain: "prisma.io", date: "24 Th2", sender: person.name, color: "#2d3748" },
    { id: "sl24", url: "https://excalidraw.com/#room=vwork", title: "Architecture Diagram - VWork", domain: "excalidraw.com", date: "23 Th2", sender: "Bạn", color: "#6965db" },
    { id: "sl25", url: "https://codepen.io/pen/vwork-animation", title: "Chat Transition Animation Demo", domain: "codepen.io", date: "22 Th2", sender: person.name, color: "#000" },
    { id: "sl26", url: "https://planetscale.com/docs", title: "PlanetScale Database Docs", domain: "planetscale.com", date: "21 Th2", sender: "Bạn", color: "#000" },
    { id: "sl27", url: "https://turborepo.org/docs", title: "Turborepo - Monorepo Tool", domain: "turborepo.org", date: "20 Th2", sender: person.name, color: "#000" },
    { id: "sl28", url: "https://storybook.js.org", title: "Storybook - UI Component Explorer", domain: "storybook.js.org", date: "19 Th2", sender: "Bạn", color: "#ff4785" },
    { id: "sl29", url: "https://zod.dev", title: "Zod - TypeScript Schema Validation", domain: "zod.dev", date: "18 Th2", sender: person.name, color: "#3068b7" },
    { id: "sl30", url: "https://tanstack.com/query/latest", title: "TanStack Query Documentation", domain: "tanstack.com", date: "17 Th2", sender: "Bạn", color: "#ef4444" },
    { id: "sl31", url: "https://railway.app/dashboard", title: "Railway - Cloud Deployment", domain: "railway.app", date: "16 Th2", sender: person.name, color: "#000" },
    { id: "sl32", url: "https://pnpm.io/motivation", title: "pnpm - Fast Package Manager", domain: "pnpm.io", date: "15 Th2", sender: "Bạn", color: "#f69220" },
    { id: "sl33", url: "https://vitest.dev/guide", title: "Vitest - Next Gen Testing", domain: "vitest.dev", date: "14 Th2", sender: person.name, color: "#729b1b" },
    { id: "sl34", url: "https://playwright.dev/docs/intro", title: "Playwright E2E Testing", domain: "playwright.dev", date: "13 Th2", sender: "Bạn", color: "#2ead33" },
    { id: "sl35", url: "https://www.typescriptlang.org/docs", title: "TypeScript Documentation", domain: "typescriptlang.org", date: "12 Th2", sender: person.name, color: "#3178c6" },
    { id: "sl36", url: "https://nextjs.org/docs/app", title: "Next.js App Router Docs", domain: "nextjs.org", date: "11 Th2", sender: "Bạn", color: "#000" },
    { id: "sl37", url: "https://radix-ui.com/docs", title: "Radix UI Primitives", domain: "radix-ui.com", date: "10 Th2", sender: person.name, color: "#000" },
    { id: "sl38", url: "https://sonner.dev", title: "Sonner - Toast Component", domain: "sonner.dev", date: "09 Th2", sender: "Bạn", color: "#000" },
    { id: "sl39", url: "https://lucide.dev/icons", title: "Lucide Icons Library", domain: "lucide.dev", date: "08 Th2", sender: person.name, color: "#f56565" },
    { id: "sl40", url: "https://recharts.org/en-US/api", title: "Recharts API Reference", domain: "recharts.org", date: "07 Th2", sender: "Bạn", color: "#8884d8" },
    { id: "sl41", url: "https://date-fns.org/docs", title: "date-fns Documentation", domain: "date-fns.org", date: "06 Th2", sender: person.name, color: "#770c56" },
    { id: "sl42", url: "https://formik.org/docs/overview", title: "Formik - Form Library", domain: "formik.org", date: "05 Th2", sender: "Bạn", color: "#1a73e8" },
  ], [person.name]);

  // Use module-level commonGroups (no re-computation needed)

  const mediaStats = [
    { icon: <ImageIcon className="w-[18px] h-[18px] text-gray-400" />, label: `${sharedPhotos.length} ảnh`, key: "photos" as const },
    { icon: <FileIcon className="w-[18px] h-[18px] text-gray-400" />, label: `${ppSharedFiles.length} tệp tin`, key: "files" as const },
    { icon: <Link2 className="w-[18px] h-[18px] text-gray-400" />, label: `${ppSharedLinks.length} liên kết chung`, key: "links" as const },
    { icon: <Users className="w-[18px] h-[18px] text-gray-400" />, label: "15 nhóm chung", key: "groups" as const },
  ];

  const fileExtColors: Record<string, string> = { xlsx: "#217346", fig: "#a259ff", pdf: "#dc2626", doc: "#2b579a", zip: "#f59e0b", pptx: "#d24726" };

  const subViewHeader = (title: string, icon: React.ReactNode) => (
    <div className="h-[48px] border-b border-gray-200 flex items-center px-3 shrink-0 gap-2">
      <button onClick={() => setActiveSubView("main")} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all">
        <ArrowLeft className="w-4 h-4" />
      </button>
      {icon}
      <span className="text-[13px] text-gray-800 flex-1">{title}</span>
      <button onClick={onClose} className="hidden md:flex w-7 h-7 rounded-lg hover:bg-gray-100 items-center justify-center text-gray-400 transition-all">
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  if (activeSubView === "photos") {
    const grouped: Record<string, typeof sharedPhotos> = {};
    sharedPhotos.forEach(p => {
      const month = p.date.split(" ").slice(1).join(" ");
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(p);
    });
    return (
      <div className="w-full md:w-[300px] bg-white border-l border-gray-200 flex flex-col shrink-0" style={{ animation: "fadeInScale 0.15s ease" }}>
        {subViewHeader("20 ảnh", <ImageIcon className="w-3.5 h-3.5 text-cyan-500" />)}
        <div className="flex-1 overflow-y-auto">
          {Object.entries(grouped).map(([month, photos]) => (
            <div key={month}>
              <div className="px-3 py-2 sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                <span className="text-[11px] text-gray-500">{month}</span>
              </div>
              <div className="grid grid-cols-3 gap-0.5 px-0.5">
                {photos.map(photo => (
                  <button key={photo.id} onClick={() => setLightboxImg(photo.url)} className="aspect-square overflow-hidden group relative">
                    <img src={photo.url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {lightboxImg && (() => {
          const currentIndex = sharedPhotos.findIndex(p => p.url === lightboxImg);
          const hasNext = currentIndex < sharedPhotos.length - 1;
          const hasPrev = currentIndex > 0;
          return (
            <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center" onClick={() => setLightboxImg(null)}>
              <button onClick={() => setLightboxImg(null)} className="absolute top-4 right-4 text-white/80 hover:text-white z-10"><X className="w-6 h-6" /></button>
              {hasPrev && <button onClick={e => { e.stopPropagation(); setLightboxImg(sharedPhotos[currentIndex - 1].url); }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white hover:bg-white/20 p-3 rounded-full transition-all"><ChevronLeft className="w-6 h-6" /></button>}
              <img src={lightboxImg} alt="" className="max-w-[85vw] max-h-[85vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
              {hasNext && <button onClick={e => { e.stopPropagation(); setLightboxImg(sharedPhotos[currentIndex + 1].url); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white hover:bg-white/20 p-3 rounded-full transition-all"><ChevronRight className="w-6 h-6" /></button>}
              <div className="absolute bottom-4 flex gap-2 items-center">
                <div className="text-white/60 text-[12px]">{currentIndex + 1} / {sharedPhotos.length}</div>
                <button onClick={e => { e.stopPropagation(); toast.success("Đã tải ảnh về", { duration: 2000 }); }} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[12px] flex items-center gap-1.5 backdrop-blur-sm transition-colors">
                  <Download className="w-3.5 h-3.5" />Tải về
                </button>
                <button onClick={e => { e.stopPropagation(); copyToClipboard(lightboxImg || "").then(() => toast.success("Đã sao chép liên kết", { duration: 2000 })); }} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[12px] flex items-center gap-1.5 backdrop-blur-sm transition-colors">
                  <Share2 className="w-3.5 h-3.5" />Chia sẻ
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  if (activeSubView === "files") {
    return (
      <div className="w-full md:w-[300px] bg-white border-l border-gray-200 flex flex-col shrink-0" style={{ animation: "fadeInScale 0.15s ease" }}>
        {subViewHeader("3 tệp tin", <FileIcon className="w-3.5 h-3.5 text-cyan-500" />)}
        <div className="flex-1 overflow-y-auto">
          {ppSharedFiles.map(file => (
            <div key={file.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 group cursor-pointer">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-[10px]" style={{ backgroundColor: fileExtColors[file.ext] || "#6b7280" }}>
                {file.ext.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-gray-800 truncate">{file.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-500">{file.size}</span>
                  <span className="text-[10px] text-gray-300">·</span>
                  <span className="text-[10px] text-gray-500">{file.date}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">Từ: {file.sender}</p>
              </div>
              <button onClick={() => toast.success(`Đang tải "${file.name}"`, { duration: 2000 })} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-300 group-hover:text-gray-500 transition-all shrink-0 mt-0.5">
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeSubView === "links") {
    return (
      <div className="w-full md:w-[300px] bg-white border-l border-gray-200 flex flex-col shrink-0" style={{ animation: "fadeInScale 0.15s ease" }}>
        {subViewHeader("42 liên kết chung", <Link2 className="w-3.5 h-3.5 text-cyan-500" />)}
        <div className="flex-1 overflow-y-auto">
          {ppSharedLinks.map(link => (
            <button key={link.id} onClick={() => { copyToClipboard(link.url).then(() => toast.success("Đã sao chép liên kết", { duration: 1500 })); }} className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: link.color + "14" }}>
                <Globe className="w-3.5 h-3.5" style={{ color: link.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-gray-800 truncate group-hover:text-cyan-600 transition-colors">{link.title}</p>
                <p className="text-[10px] text-cyan-600/70 truncate mt-0.5">{link.domain}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-500">{link.sender}</span>
                  <span className="text-[10px] text-gray-300">·</span>
                  <span className="text-[10px] text-gray-500">{link.date}</span>
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-gray-400 shrink-0 mt-1.5 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (activeSubView === "groups") {
    return (
      <div className="w-full md:w-[300px] bg-white border-l border-gray-200 flex flex-col shrink-0" style={{ animation: "fadeInScale 0.15s ease" }}>
        {subViewHeader("15 nhóm chung", <Users className="w-3.5 h-3.5 text-cyan-500" />)}
        <div className="flex-1 overflow-y-auto">
          {commonGroups.map(group => (
            <button key={group.id} onClick={() => { onOpenGroup?.(group.id); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left group/item">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg" style={{ backgroundColor: group.color + "15" }}>
                {group.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-gray-800 group-hover/item:text-cyan-600 transition-colors">{group.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-500">{group.members} thành viên</span>
                  <span className="text-[10px] text-gray-300">·</span>
                  <span className="text-[10px] text-gray-500">{group.lastActive}</span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover/item:text-gray-400 transition-colors shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ============== CONFIRMATION DIALOGS ==============
  if (showDeleteConfirm) {
    return (
      <div className="w-full md:w-[300px] bg-white border-l border-gray-200 flex flex-col shrink-0" style={{ animation: "fadeInScale 0.2s ease" }}>
        <div className="h-[48px] border-b border-gray-200 flex items-center px-4 shrink-0">
          <button onClick={() => setShowDeleteConfirm(false)} className="md:hidden w-8 h-8 flex items-center justify-center -ml-1 text-gray-500 hover:text-gray-700 shrink-0 mr-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-[13px] text-gray-800 flex-1">Xác nhận</span>
          <button onClick={() => setShowDeleteConfirm(false)} className="hidden md:flex w-7 h-7 rounded-lg hover:bg-gray-100 items-center justify-center text-gray-400 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-[14px] font-medium text-gray-900 mb-2">Xoá liên hệ?</h3>
          <p className="text-[12px] text-gray-500 text-center mb-6">Bạn chắc chắn muốn xoá liên hệ "{person.name}" khỏi danh bạ? Bạn vẫn có thể tìm thấy tin nhắn của họ trong chat.</p>
          <div className="flex gap-2 w-full">
            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors">
              Hủy
            </button>
            <button 
              onClick={() => {
                setIsContact(!isContact);
                toast(isContact ? "Đã xoá liên hệ" : "Đã thêm liên hệ", {
                  icon: <Trash2 className={`w-4 h-4 ${isContact ? "text-red-500" : "text-green-500"}`} />,
                  duration: 2000,
                });
                setShowDeleteConfirm(false);
              }} 
              className="flex-1 px-3 py-2 rounded-lg bg-red-500 text-white text-[12px] hover:bg-red-600 transition-colors"
            >
              Xoá
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showBlockConfirm) {
    return (
      <div className="w-full md:w-[300px] bg-white border-l border-gray-200 flex flex-col shrink-0" style={{ animation: "fadeInScale 0.2s ease" }}>
        <div className="h-[48px] border-b border-gray-200 flex items-center px-4 shrink-0">
          <button onClick={() => setShowBlockConfirm(false)} className="md:hidden w-8 h-8 flex items-center justify-center -ml-1 text-gray-500 hover:text-gray-700 shrink-0 mr-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-[13px] text-gray-800 flex-1">Xác nhận</span>
          <button onClick={() => setShowBlockConfirm(false)} className="hidden md:flex w-7 h-7 rounded-lg hover:bg-gray-100 items-center justify-center text-gray-400 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-[14px] font-medium text-gray-900 mb-2">{isBlocked ? "Bỏ chặn người dùng?" : "Chặn người dùng?"}</h3>
          <p className="text-[12px] text-gray-500 text-center mb-6">
            {isBlocked 
              ? `${person.name} sẽ có thể liên hệ bạn trở lại sau khi bỏ chặn.`
              : `${person.name} sẽ không thể xem tin nhắn, gửi tin nhắn hoặc liên hệ bạn. Họ sẽ không biết bạn đã chặn họ.`
            }
          </p>
          <div className="flex gap-2 w-full">
            <button onClick={() => setShowBlockConfirm(false)} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors">
              Hủy
            </button>
            <button 
              onClick={() => {
                setIsBlocked(!isBlocked);
                toast(isBlocked ? "Đã bỏ chặn người dùng" : "Đã chặn người dùng", {
                  icon: <Ban className={`w-4 h-4 ${isBlocked ? "text-green-500" : "text-red-500"}`} />,
                  duration: 2000,
                });
                setShowBlockConfirm(false);
              }} 
              className="flex-1 px-3 py-2 rounded-lg bg-red-500 text-white text-[12px] hover:bg-red-600 transition-colors"
            >
              {isBlocked ? "Bỏ chặn" : "Chặn"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-[300px] bg-white border-l border-gray-200 flex flex-col shrink-0" style={{ animation: "fadeInScale 0.2s ease" }}>
      <div className="h-[48px] border-b border-gray-200 flex items-center px-4 shrink-0">
        <button onClick={onClose} className="md:hidden w-8 h-8 flex items-center justify-center -ml-1 text-gray-500 hover:text-gray-700 shrink-0 mr-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Info className="w-3.5 h-3.5 text-cyan-500" />
          <span className="text-[13px] text-gray-800">Thông tin</span>
        </div>
        <button onClick={onClose} className="hidden md:flex w-7 h-7 rounded-lg hover:bg-gray-100 items-center justify-center text-gray-400 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center pt-6 pb-4">
          <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white text-[22px] mb-3 relative" style={{ backgroundColor: person.color }}>
            {initials}
            {person.online && (
              <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
            )}
          </div>
          <h3 className="text-[15px] text-gray-900 mb-0.5">{displayName}</h3>
          {contactInfo.nickname && <p className="text-[10px] text-gray-400 mb-0.5">({person.name})</p>}
          <p className="text-[11px] text-gray-500">{lastSeen}</p>
        </div>
        <div className="flex items-center justify-center gap-5 pb-4 border-b border-gray-100">
          <button onClick={onClose} className="flex flex-col items-center gap-1.5 group">
            <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-cyan-50 flex items-center justify-center transition-colors">
              <MessageSquare className="w-4 h-4 text-gray-500 group-hover:text-cyan-600" />
            </div>
            <span className="text-[10px] text-gray-500 group-hover:text-cyan-600">Nhắn tin</span>
          </button>
          <button onClick={onToggleMute} className="flex flex-col items-center gap-1.5 group">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isMuted ? "bg-orange-50" : "bg-gray-100 group-hover:bg-cyan-50"}`}>
              {isMuted ? <BellOff className="w-4 h-4 text-orange-500" /> : <Bell className="w-4 h-4 text-gray-500 group-hover:text-cyan-600" />}
            </div>
            <span className={`text-[10px] ${isMuted ? "text-orange-500" : "text-gray-500 group-hover:text-cyan-600"}`}>{isMuted ? "Đã tắt" : "Tắt tiếng"}</span>
          </button>
          <button className="flex flex-col items-center gap-1.5 group" onClick={() => toast("Tính năng quà tặng sẽ ra mắt sớm!", { icon: <Gift className="w-4 h-4 text-pink-500" />, duration: 2000 })}>
            <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-pink-50 flex items-center justify-center transition-colors">
              <Gift className="w-4 h-4 text-gray-500 group-hover:text-pink-500" />
            </div>
            <span className="text-[10px] text-gray-500 group-hover:text-pink-500">Quà tặng</span>
          </button>
        </div>
        <div className="px-4 py-3 border-b border-gray-100 space-y-2">
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-gray-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-gray-800">{contactInfo.phone || "Đã ẩn"}</p>
              <p className="text-[11px] text-gray-500">Di động</p>
            </div>
          </div>
          {contactInfo.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-gray-800 truncate">{contactInfo.email}</p>
                <p className="text-[11px] text-gray-500">Email</p>
              </div>
            </div>
          )}
          {contactInfo.note && (
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-gray-800 line-clamp-2">{contactInfo.note}</p>
                <p className="text-[11px] text-gray-500">Ghi chú</p>
              </div>
            </div>
          )}
        </div>
        {/* Media Stats */}
        <div className="py-1 border-b border-gray-100">
          {mediaStats.map(stat => (
            <button key={stat.key} onClick={() => setActiveSubView(stat.key)} className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-gray-50 transition-colors group/stat">
              {stat.icon}
              <span className="text-[12px] text-gray-700 flex-1 text-left group-hover/stat:text-cyan-600 transition-colors">{stat.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover/stat:text-gray-400 transition-colors" />
            </button>
          ))}
        </div>

        {/* Contact Actions */}
        <div className="py-1">
          <button
            onClick={() => { copyToClipboard(`https://vwork.pro/u/${person.id}`).then(() => toast.success("Đã sao chép liên kết liên hệ", { duration: 2000 })); }}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-gray-50 transition-colors group/act"
          >
            <Share2 className="w-[18px] h-[18px] text-gray-500" />
            <span className="text-[12px] text-gray-700 group-hover/act:text-cyan-600 transition-colors">Chia sẻ liên hệ</span>
          </button>
          <button
            onClick={() => setShowEditContact(true)}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-gray-50 transition-colors group/act"
          >
            <Pencil className="w-[18px] h-[18px] text-gray-500" />
            <span className="text-[12px] text-gray-700 group-hover/act:text-cyan-600 transition-colors">Sửa liên hệ</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-gray-50 transition-colors group/act"
          >
            <Trash2 className="w-[18px] h-[18px] text-gray-500" />
            <span className="text-[12px] text-gray-700 group-hover/act:text-cyan-600 transition-colors">{isContact ? "Xoá liên hệ" : "Thêm liên hệ"}</span>
          </button>
          <button
            onClick={() => setShowBlockConfirm(true)}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 hover:bg-gray-50 transition-colors"
          >
            <Ban className="w-[18px] h-[18px] text-red-500" />
            <span className="text-[12px] text-red-500">{isBlocked ? "Bỏ chặn người dùng" : "Chặn người dùng"}</span>
          </button>
        </div>
      </div>

      {/* Edit Contact Modal */}
      {showEditContact && (
        <EditContactModal
          person={person}
          contactInfo={contactInfo}
          onClose={() => setShowEditContact(false)}
          onSave={(info) => {
            setContactInfo(info);
            setShowEditContact(false);
            toast.success("Đã lưu thông tin liên hệ");
          }}
        />
      )}
    </div>
  );
}

function EditContactModal({ person, contactInfo, onClose, onSave }: {
  person: { id: string; name: string; icon: string; color: string };
  contactInfo: { nickname: string; phone: string; email: string; note: string };
  onClose: () => void;
  onSave: (info: { nickname: string; phone: string; email: string; note: string }) => void;
}) {
  const [form, setForm] = useState({ ...contactInfo });
  const initials = person.icon || person.name.split(" ").map(w => w[0]).join("").slice(0, 2);

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white w-full md:w-[420px] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] md:max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation: "fadeInScale 0.2s ease" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shrink-0">
            <Pencil className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] text-gray-900 font-semibold">Sửa liên hệ</p>
            <p className="text-[11px] text-gray-500">{person.name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex justify-center pt-5 pb-3 shrink-0">
          <div className="relative">
            <div className="w-[68px] h-[68px] rounded-full flex items-center justify-center text-white text-[20px] font-medium" style={{ backgroundColor: person.color }}>
              {initials}
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center shadow-sm border-2 border-white">
              <Camera className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3">
          {/* Nickname */}
          <div>
            <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-1 block">Tên gọi</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 focus-within:border-cyan-400 bg-gray-50 focus-within:bg-white transition-all">
              <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder={person.name}
                value={form.nickname}
                onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
                className="flex-1 text-[13px] bg-transparent outline-none text-gray-800 placeholder-gray-400"
                autoFocus
              />
              {form.nickname && (
                <button onClick={() => setForm(f => ({ ...f, nickname: "" }))} className="text-gray-300 hover:text-gray-500">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-1 ml-1">Tên này chỉ hiển thị với bạn</p>
          </div>

          {/* Phone */}
          <div>
            <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-1 block">Số điện thoại</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 focus-within:border-cyan-400 bg-gray-50 focus-within:bg-white transition-all">
              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="tel"
                placeholder="Nhập số điện thoại..."
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="flex-1 text-[13px] bg-transparent outline-none text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-1 block">Email</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 focus-within:border-cyan-400 bg-gray-50 focus-within:bg-white transition-all">
              <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="email"
                placeholder="Nhập địa chỉ email..."
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="flex-1 text-[13px] bg-transparent outline-none text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-1 block">Ghi chú</label>
            <div className="px-3 py-2.5 rounded-xl border border-gray-200 focus-within:border-cyan-400 bg-gray-50 focus-within:bg-white transition-all">
              <textarea
                placeholder="Thêm ghi chú về liên hệ này..."
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                rows={3}
                className="w-full text-[13px] bg-transparent outline-none text-gray-800 placeholder-gray-400 resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2.5 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-600 hover:bg-gray-50 transition-all font-medium"
          >
            Huỷ
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-[13px] font-medium transition-all shadow-sm"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============== CHAT INFO PANEL ============== */
function ChatInfoPanel({ onClose, activeTab, onTabChange, topicName, topicEmoji, sharedMedia, sharedFiles, sharedLinks, savedMessages, scheduledMessages, onRemoveScheduled, onToggleBookmark, isMuted, onToggleMute, onOpenSearch, onStartDM }: {
  onClose: () => void;
  activeTab: "members" | "media" | "files" | "links";
  onTabChange: (tab: "members" | "media" | "files" | "links") => void;
  topicName: string;
  topicEmoji?: string;
  sharedMedia: ChatMessage[];
  sharedFiles: ChatMessage[];
  sharedLinks: ChatMessage[];
  savedMessages: ChatMessage[];
  scheduledMessages: { id: string; content: string; scheduledTime: string; topicId: string }[];
  onRemoveScheduled: (id: string) => void;
  onToggleBookmark: (msgId: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSearch: () => void;
  onStartDM?: (name: string, userId?: string) => void;
  onLightbox?: (url: string) => void;
}) {
  const [infoSection, setInfoSection] = useState<"info" | "saved" | "scheduled">("info");
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({
    [minhUser.id]: "owner",
    [huongUser.id]: "member",
    [phucUser.id]: "member",
    [lanUser.id]: "member",
    [ducUser.id]: "member",
  });
  const [memberTags, setMemberTags] = useState<Record<string, string>>({});
  const [restrictedMembers, setRestrictedMembers] = useState<Set<string>>(new Set());
  const [removedMembers, setRemovedMembers] = useState<Set<string>>(new Set());
  const [memberCtxMenu, setMemberCtxMenu] = useState<{ member: typeof minhUser & { role: string; lastSeen: string }; pos: { x: number; y: number } } | null>(null);
  const [editTagModal, setEditTagModal] = useState<{ memberId: string; memberName: string } | null>(null);
  const [editTagValue, setEditTagValue] = useState("");
  const editTagInputRef = useRef<HTMLInputElement>(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showMembersList, setShowMembersList] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState("");
  const [selectedNewMembers, setSelectedNewMembers] = useState<Set<string>>(new Set());
  const addMemberSearchRef = useRef<HTMLInputElement>(null);
  const [settingsState, setSettingsState] = useState({
    autoDeleteMessages: false,
    autoDeleteDuration: "7d",
    slowMode: false,
    slowModeInterval: "30s",
    pinnedPermission: "admin" as "admin" | "everyone",
    mediaPermission: "everyone" as "admin" | "everyone",
    mentionPermission: "everyone" as "admin" | "everyone",
    linkPreview: true,
    readReceipts: true,
    topicColor: "#0891b2",
  });

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
    copyToClipboard("https://vwork.app/invite/grp-abc123");
    toast.success("Đã sao chép liên kết mời", { icon: <Link className="w-4 h-4 text-cyan-500" />, duration: 2000 });
  }, []);

  const baseMembersList = [
    { ...minhUser, role: "owner", lastSeen: "Đang hoạt động" },
    { ...huongUser, role: "member", lastSeen: "Đang hoạt động" },
    { ...phucUser, role: "member", lastSeen: "Đang hoạt động" },
    { ...lanUser, role: "member", lastSeen: "15 phút trước" },
    { ...ducUser, role: "member", lastSeen: "2 giờ trước" },
  ];
  const allMembers = baseMembersList
    .filter(m => !removedMembers.has(m.id))
    .map(m => ({ ...m, role: memberRoles[m.id] || m.role }));

  const handleMemberContextMenu = (e: React.MouseEvent, member: typeof allMembers[0]) => {
    e.preventDefault();
    if (member.id === minhUser.id) return; // Can't manage yourself
    setMemberCtxMenu({ member, pos: { x: e.clientX, y: e.clientY } });
  };

  const handlePromote = (memberId: string) => {
    setMemberRoles(prev => {
      const current = prev[memberId] || "member";
      const next = current === "member" ? "admin" : current === "admin" ? "owner" : "member";
      toast.success(`Đã thăng cấp thành ${next === "admin" ? "Quản trị viên" : next === "owner" ? "Chủ sở hữu" : "Thành viên"}`, { duration: 2000 });
      return { ...prev, [memberId]: next };
    });
    setMemberCtxMenu(null);
  };

  const handleRestrict = (memberId: string) => {
    setRestrictedMembers(prev => {
      const n = new Set(prev);
      if (n.has(memberId)) {
        n.delete(memberId);
        toast("Đã bỏ hạn chế", { duration: 2000 });
      } else {
        n.add(memberId);
        toast("Đã hạn chế thành viên", { icon: <ShieldBan className="w-4 h-4 text-orange-500" />, duration: 2000 });
      }
      return n;
    });
    setMemberCtxMenu(null);
  };

  const handleRemoveMember = (memberId: string) => {
    setRemovedMembers(prev => new Set(prev).add(memberId));
    toast("Đã xoá thành viên khỏi chủ đề", { icon: <UserMinus className="w-4 h-4 text-red-500" />, duration: 2000 });
    setMemberCtxMenu(null);
  };

  const handleEditTag = (memberId: string, memberName: string) => {
    setEditTagValue(memberTags[memberId] || "");
    setEditTagModal({ memberId, memberName });
    setMemberCtxMenu(null);
    setTimeout(() => editTagInputRef.current?.focus(), 100);
  };

  const handleSaveTag = () => {
    if (!editTagModal) return;
    setMemberTags(prev => {
      if (!editTagValue.trim()) {
        const n = { ...prev };
        delete n[editTagModal.memberId];
        toast("Đã xoá nhãn", { duration: 1500 });
        return n;
      }
      toast.success(`Đã đặt nhãn "${editTagValue.trim()}"`, { duration: 2000 });
      return { ...prev, [editTagModal.memberId]: editTagValue.trim() };
    });
    setEditTagModal(null);
  };
  return (
    <div className="w-full md:w-[340px] bg-white border-l border-gray-200 flex flex-col shrink-0" style={{ animation: "fadeInScale 0.2s ease" }}>
      <div className="h-[48px] border-b border-gray-200 flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-all"><ChevronLeft className="w-5 h-5 md:hidden" /><X className="w-4 h-4 hidden md:block" /></button>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-gray-800 flex items-center gap-1.5">
            {infoSection === "info" && <><Info className="w-3.5 h-3.5 text-cyan-500" />Thông tin chủ đề</>}
            {infoSection === "saved" && <><BookmarkCheck className="w-3.5 h-3.5 text-amber-500" />Tin nhắn đã lưu</>}
            {infoSection === "scheduled" && <><CalendarClock className="w-3.5 h-3.5 text-violet-500" />Tin nhắn hẹn giờ</>}
          </p>
        </div>
      </div>
      <div className="flex items-center border-b border-gray-100 px-1">
        {([
          { key: "info" as const, label: "Thông tin", icon: <Info className="w-3.5 h-3.5" /> },
          { key: "saved" as const, label: "Đã lưu", icon: <Bookmark className="w-3.5 h-3.5" /> },
          { key: "scheduled" as const, label: "Hẹn giờ", icon: <CalendarClock className="w-3.5 h-3.5" /> },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setInfoSection(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] transition-all border-b-2 ${infoSection === tab.key ? "border-cyan-500 text-cyan-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {infoSection === "info" && (
          <div>
            <div className="px-4 py-4 border-b border-gray-100 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 flex items-center justify-center mx-auto mb-2.5 border border-cyan-100 shadow-sm">
                {topicEmoji ? <span className="text-2xl">{topicEmoji}</span> : <Hash className="w-6 h-6 text-cyan-500" />}
              </div>
              <h3 className="text-[14px] text-gray-800 mb-0.5">{topicName}</h3>
              <p className="text-[11px] text-gray-500">{allMembers.length} thành viên · {Object.values(userOnlineStatus).filter(s => s === "online").length} online</p>
            </div>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              {/* Thông báo */}
              <button
                onClick={() => { onToggleMute(); }}
                className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all group/action ${isMuted ? "bg-orange-50 text-orange-500 hover:bg-orange-100" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isMuted ? "bg-orange-100 group-hover/action:bg-orange-200" : "bg-gray-100 group-hover/action:bg-gray-200"}`}>
                  {isMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                </div>
                <span className="text-[9px]">{isMuted ? "Đã tắt" : "Thông báo"}</span>
              </button>
              {/* Tìm kiếm */}
              <button
                onClick={() => { onOpenSearch(); onClose(); }}
                className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all text-gray-400 hover:bg-cyan-50 hover:text-cyan-500 group/action"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 group-hover/action:bg-cyan-100 flex items-center justify-center transition-all">
                  <Search className="w-4 h-4" />
                </div>
                <span className="text-[9px]">Tìm kiếm</span>
              </button>
              {/* Cài đặt */}
              <button
                onClick={() => setShowSettingsPanel(p => !p)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all group/action ${showSettingsPanel ? "bg-cyan-50 text-cyan-500" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${showSettingsPanel ? "bg-cyan-100" : "bg-gray-100 group-hover/action:bg-gray-200"}`}>
                  <Settings className={`w-4 h-4 transition-transform duration-300 ${showSettingsPanel ? "rotate-90" : ""}`} />
                </div>
                <span className="text-[9px]">Cài đặt</span>
              </button>
            </div>
            {/* Settings Panel - expandable */}
            {showSettingsPanel && (
              <div className="border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-white" style={{ animation: "fadeInScale 0.2s ease" }}>
                <div className="px-4 py-3 space-y-3">
                  <h4 className="text-[11px] text-gray-500 uppercase tracking-wider">Cài đặt chủ đề</h4>
                  {/* Auto-delete messages */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center"><Timer className="w-3.5 h-3.5 text-red-400" /></div>
                      <div>
                        <p className="text-[12px] text-gray-700">Tự xoá tin nhắn</p>
                        <p className="text-[10px] text-gray-500">Tin nhắn sẽ biến mất sau thời gian</p>
                      </div>
                    </div>
                    <button onClick={() => { setSettingsState(s => ({ ...s, autoDeleteMessages: !s.autoDeleteMessages })); toast(settingsState.autoDeleteMessages ? "Đã tắt tự xoá tin nhắn" : "Đã bật tự xoá tin nhắn", { duration: 2000 }); }}
                      className={`w-9 h-5 rounded-full transition-all relative ${settingsState.autoDeleteMessages ? "bg-cyan-500" : "bg-gray-200"}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${settingsState.autoDeleteMessages ? "left-4.5" : "left-0.5"}`} />
                    </button>
                  </div>
                  {settingsState.autoDeleteMessages && (
                    <div className="flex gap-1 ml-9">
                      {[{ v: "1h", l: "1 giờ" }, { v: "24h", l: "24 giờ" }, { v: "7d", l: "7 ngày" }, { v: "30d", l: "30 ngày" }].map(d => (
                        <button key={d.v} onClick={() => { setSettingsState(s => ({ ...s, autoDeleteDuration: d.v })); toast.success(`Tin nhắn sẽ tự xoá sau ${d.l}`, { duration: 2000 }); }}
                          className={`px-2 py-1 rounded-md text-[10px] transition-all ${settingsState.autoDeleteDuration === d.v ? "bg-cyan-100 text-cyan-600" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{d.l}</button>
                      ))}
                    </div>
                  )}
                  {/* Slow mode */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><Clock className="w-3.5 h-3.5 text-amber-400" /></div>
                      <div>
                        <p className="text-[12px] text-gray-700">Chế độ chậm</p>
                        <p className="text-[10px] text-gray-500">Giới hạn tốc độ gửi tin nhắn</p>
                      </div>
                    </div>
                    <button onClick={() => { setSettingsState(s => ({ ...s, slowMode: !s.slowMode })); toast(settingsState.slowMode ? "Đã tắt chế độ chậm" : "Đã bật chế độ chậm", { duration: 2000 }); }}
                      className={`w-9 h-5 rounded-full transition-all relative ${settingsState.slowMode ? "bg-cyan-500" : "bg-gray-200"}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${settingsState.slowMode ? "left-4.5" : "left-0.5"}`} />
                    </button>
                  </div>
                  {settingsState.slowMode && (
                    <div className="flex gap-1 ml-9">
                      {[{ v: "10s", l: "10s" }, { v: "30s", l: "30s" }, { v: "1m", l: "1 phút" }, { v: "5m", l: "5 phút" }].map(d => (
                        <button key={d.v} onClick={() => { setSettingsState(s => ({ ...s, slowModeInterval: d.v })); toast.success(`Chế độ chậm: ${d.l}/tin nhắn`, { duration: 2000 }); }}
                          className={`px-2 py-1 rounded-md text-[10px] transition-all ${settingsState.slowModeInterval === d.v ? "bg-cyan-100 text-cyan-600" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{d.l}</button>
                      ))}
                    </div>
                  )}
                  {/* Permissions section */}
                  <div className="pt-1">
                    <h4 className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Quyền hạn</h4>
                    {[
                      { key: "pinnedPermission" as const, icon: <Pin className="w-3.5 h-3.5 text-cyan-400" />, bg: "bg-cyan-50", label: "Ghim tin nhắn" },
                      { key: "mediaPermission" as const, icon: <ImageIcon className="w-3.5 h-3.5 text-violet-400" />, bg: "bg-violet-50", label: "Gửi media" },
                      { key: "mentionPermission" as const, icon: <AtSign className="w-3.5 h-3.5 text-blue-400" />, bg: "bg-blue-50", label: "Mention @all" },
                    ].map(perm => (
                      <div key={perm.key} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg ${perm.bg} flex items-center justify-center`}>{perm.icon}</div>
                          <span className="text-[12px] text-gray-700">{perm.label}</span>
                        </div>
                        <button onClick={() => {
                          const newVal = settingsState[perm.key] === "admin" ? "everyone" : "admin";
                          setSettingsState(s => ({ ...s, [perm.key]: newVal }));
                          toast.success(`${perm.label}: ${newVal === "admin" ? "Chỉ Admin" : "Tất cả"}`, { duration: 2000 });
                        }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] transition-all ${settingsState[perm.key] === "admin" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}>
                          {settingsState[perm.key] === "admin" ? "Chỉ Admin" : "Tất cả"}
                        </button>
                      </div>
                    ))}
                  </div>
                  {/* Toggle options */}
                  <div className="pt-1 space-y-2">
                    {[
                      { key: "linkPreview" as const, icon: <Link2 className="w-3.5 h-3.5 text-blue-400" />, bg: "bg-blue-50", label: "Xem trước liên kết", desc: "Hiển thị preview cho link" },
                      { key: "readReceipts" as const, icon: <CheckCheck className="w-3.5 h-3.5 text-green-400" />, bg: "bg-green-50", label: "Đã đọc", desc: "Hiển thị trạng thái đã đọc" },
                    ].map(opt => (
                      <div key={opt.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg ${opt.bg} flex items-center justify-center`}>{opt.icon}</div>
                          <div>
                            <p className="text-[12px] text-gray-700">{opt.label}</p>
                            <p className="text-[10px] text-gray-500">{opt.desc}</p>
                          </div>
                        </div>
                        <button onClick={() => { setSettingsState(s => ({ ...s, [opt.key]: !s[opt.key] })); toast(settingsState[opt.key] ? `Đã tắt ${opt.label.toLowerCase()}` : `Đã bật ${opt.label.toLowerCase()}`, { duration: 2000 }); }}
                          className={`w-9 h-5 rounded-full transition-all relative ${settingsState[opt.key] ? "bg-cyan-500" : "bg-gray-200"}`}>
                          <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${settingsState[opt.key] ? "left-4.5" : "left-0.5"}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {/* Topic color */}
                  <div className="pt-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-50 to-violet-50 flex items-center justify-center"><Sparkles className="w-3.5 h-3.5 text-violet-400" /></div>
                      <span className="text-[12px] text-gray-700">Màu chủ đề</span>
                    </div>
                    <div className="flex gap-1.5 ml-9">
                      {["#0891b2", "#7c3aed", "#059669", "#d97706", "#db2777", "#6366f1", "#dc2626", "#0d9488"].map(c => (
                        <button key={c} onClick={() => { setSettingsState(s => ({ ...s, topicColor: c })); toast.success("Đã đổi màu chủ đề", { duration: 1500 }); }}
                          className={`w-6 h-6 rounded-full transition-all hover:scale-110 ${settingsState.topicColor === c ? "ring-2 ring-offset-2 ring-gray-300 scale-110" : ""}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="px-4 py-3 border-b border-gray-100">
              <button onClick={() => setShowMembersList(!showMembersList)} className="w-full flex items-center justify-between mb-2.5 hover:text-cyan-600 transition-colors group">
                <h4 className="text-[11px] text-gray-500 uppercase tracking-wider group-hover:text-cyan-600 transition-colors">Thành viên ({allMembers.length})</h4>
                <ChevronRight className={`w-3.5 h-3.5 text-gray-400 group-hover:text-cyan-600 transition-all ${showMembersList ? "rotate-90" : ""}`} />
              </button>
              {showMembersList && (
                <>
                  <button onClick={() => { setShowAddMemberModal(true); setAddMemberSearch(""); setSelectedNewMembers(new Set()); setTimeout(() => addMemberSearchRef.current?.focus(), 100); }} className="w-full text-[10px] text-cyan-500 hover:text-cyan-700 transition-all flex items-center gap-0.5 mb-2">
                    <Plus className="w-3 h-3" />Thêm
                  </button>
                  {allMembers.map(member => {
                const status = userOnlineStatus[member.id] || "offline";
                const isRestricted = restrictedMembers.has(member.id);
                const tag = memberTags[member.id];
                const roleLabel = member.role === "owner" ? "Chủ sở hữu" : member.role === "admin" ? "Quản trị viên" : "Thành viên";
                return (
                  <div key={member.id}
                    onContextMenu={(e) => handleMemberContextMenu(e, member)}
                    className={`flex items-center gap-2.5 py-1.5 hover:bg-gray-50 rounded-lg px-1.5 -mx-1.5 transition-all group/member cursor-pointer ${isRestricted ? "opacity-60" : ""}`}>
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] text-white" style={{ backgroundColor: member.color }}>{member.name.charAt(0)}</div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: onlineStatusColor[status] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] text-gray-800 truncate">{member.name}</span>
                        {member.id === minhUser.id && <span className="text-[9px] bg-cyan-50 text-cyan-600 px-1.5 py-0.5 rounded-full">Bạn</span>}
                        {tag && <span className="text-[9px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded-full">{tag}</span>}
                        {isRestricted && <ShieldBan className="w-3 h-3 text-orange-400" />}
                      </div>
                      <span className={`text-[10px] ${status === "online" ? "text-green-500" : status === "away" ? "text-amber-500" : "text-gray-400"}`}>{member.lastSeen}</span>
                    </div>
                    {onStartDM && member.id !== minhUser.id ? (
                      <button
                        onClick={() => { onStartDM(member.name, member.id); onClose(); }}
                        title="Nhắn tin trực tiếp"
                        className="w-6 h-6 rounded-lg opacity-0 group-hover/member:opacity-100 hover:bg-cyan-50 flex items-center justify-center text-cyan-500 transition-all shrink-0 ml-auto"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${member.role === "owner" ? "bg-amber-50 text-amber-600" : member.role === "admin" ? "bg-cyan-50 text-cyan-600" : "text-gray-300 opacity-0 group-hover/member:opacity-100"}`}>
                        {member.role === "owner" ? "owner" : member.role === "admin" ? "admin" : roleLabel}
                      </span>
                    )}
                  </div>
                );
              })}
                </>
              )}
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center gap-1 mb-3 bg-gray-50 rounded-lg p-0.5">
                {([{ key: "media" as const, label: "Media", count: sharedMedia.length }, { key: "files" as const, label: "Files", count: sharedFiles.length }, { key: "links" as const, label: "Links", count: sharedLinks.length }]).map(tab => (
                  <button key={tab.key} onClick={() => onTabChange(tab.key)}
                    className={`flex-1 text-[11px] py-1.5 rounded-md transition-all ${activeTab === tab.key ? "bg-white shadow-sm text-gray-800" : "text-gray-400 hover:text-gray-600"}`}>{tab.label} ({tab.count})</button>
                ))}
              </div>
              {activeTab === "media" && (sharedMedia.length > 0 ? (
                <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
                  {sharedMedia.map(msg => (
                    <div key={msg.id} onClick={() => onLightbox?.(msg.imageUrl!)} className="aspect-square bg-gray-100 relative group/media cursor-pointer overflow-hidden">
                      <img src={msg.imageUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/20 transition-all flex items-center justify-center"><Eye className="w-4 h-4 text-white opacity-0 group-hover/media:opacity-100 transition-all" /></div>
                    </div>
                  ))}
                </div>
              ) : (<div className="text-center py-8"><ImageIcon className="w-6 h-6 text-gray-200 mx-auto mb-2" /><p className="text-[11px] text-gray-500">Chưa có media nào</p></div>))}
              {activeTab === "files" && (sharedFiles.length > 0 ? (
                <div className="space-y-1">
                  {sharedFiles.map(msg => (
                    <div key={msg.id} className="flex items-center gap-2.5 py-2 px-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-blue-500" /></div>
                      <div className="flex-1 min-w-0"><p className="text-[12px] text-gray-800 truncate">{msg.fileName}</p><p className="text-[10px] text-gray-500">{msg.fileSize} · {msg.timestamp}</p></div>
                      <Download className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (<div className="text-center py-8"><FileIcon className="w-6 h-6 text-gray-200 mx-auto mb-2" /><p className="text-[11px] text-gray-500">Chưa có file nào</p></div>))}
              {activeTab === "links" && (sharedLinks.length > 0 ? (
                <div className="space-y-1">
                  {sharedLinks.map(msg => (
                    <div key={msg.id} className="flex items-center gap-2.5 py-2 px-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer">
                      <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0"><Link className="w-4 h-4 text-green-500" /></div>
                      <div className="flex-1 min-w-0"><p className="text-[12px] text-gray-800 truncate">{msg.linkPreview?.title}</p><p className="text-[10px] text-cyan-500 truncate">{msg.linkPreview?.domain}</p></div>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (<div className="text-center py-8"><Globe className="w-6 h-6 text-gray-200 mx-auto mb-2" /><p className="text-[11px] text-gray-500">Chưa có link nào</p></div>))}
            </div>
          </div>
        )}
        {infoSection === "saved" && (
          <div>
            {savedMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center"><Bookmark className="w-8 h-8 text-gray-200 mb-3" /><p className="text-[12px] text-gray-500">Chưa lưu tin nhắn nào</p><p className="text-[11px] text-gray-300 mt-1">Click chuột phải → Lưu tin nhắn</p></div>
            ) : (savedMessages.map(msg => (
              <div key={msg.id} className="group px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-all">
                <div className="flex items-start gap-2.5">
                  {msg.sender.isBot ? (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shrink-0"><Bot className="w-3 h-3 text-white" /></div>
                  ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white shrink-0" style={{ backgroundColor: msg.sender.color }}>{msg.sender.name.charAt(0)}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5"><span className="text-[11px] text-gray-800">{msg.sender.name}</span><span className="text-[10px] text-gray-300">{msg.timestamp}</span></div>
                    <div className="text-[12px] text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-3">{msg.content ? <FormattedContent content={msg.content} /> : msg.type === "image" ? "🖼️ Ảnh" : msg.fileName || ""}</div>
                  </div>
                  <button onClick={() => onToggleBookmark(msg.id)} className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center text-amber-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" title="Bỏ lưu"><BookmarkCheck className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            )))}
          </div>
        )}
        {infoSection === "scheduled" && (
          <div>
            {scheduledMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center"><CalendarClock className="w-8 h-8 text-gray-200 mb-3" /><p className="text-[12px] text-gray-500">Chưa có tin nhắn hẹn giờ</p><p className="text-[11px] text-gray-300 mt-1">Nhấn giữ nút Gửi để hẹn giờ</p></div>
            ) : (scheduledMessages.map(sch => (
              <div key={sch.id} className="group px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-all">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0 mt-0.5"><Timer className="w-4 h-4 text-violet-500" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-gray-800 leading-relaxed mb-1">{sch.content}</div>
                    <div className="flex items-center gap-1.5"><CalendarClock className="w-3 h-3 text-violet-400" /><span className="text-[10px] text-violet-500">{sch.scheduledTime}</span></div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <button className="w-6 h-6 rounded-md hover:bg-cyan-50 flex items-center justify-center text-gray-300 hover:text-cyan-500 transition-all" title="Gửi ngay"><Send className="w-3 h-3" /></button>
                    <button onClick={() => onRemoveScheduled(sch.id)} className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition-all" title="Xóa"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            )))}
          </div>
        )}
      </div>

      {/* Member Context Menu */}
      {memberCtxMenu && (
        <MemberContextMenu
          position={memberCtxMenu.pos}
          member={memberCtxMenu.member}
          isRestricted={restrictedMembers.has(memberCtxMenu.member.id)}
          onClose={() => setMemberCtxMenu(null)}
          onEditTag={() => handleEditTag(memberCtxMenu.member.id, memberCtxMenu.member.name)}
          onRestrict={() => handleRestrict(memberCtxMenu.member.id)}
          onPromote={() => handlePromote(memberCtxMenu.member.id)}
          onDelete={() => handleRemoveMember(memberCtxMenu.member.id)}
        />
      )}

      {/* Add Member Modal - Telegram style */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/30" onClick={() => setShowAddMemberModal(false)}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:w-[340px] max-h-[85vh] md:max-h-[520px] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: "fadeInScale 0.2s ease" }}>
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
                  <span key={c.id} className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-600 rounded-full px-2.5 py-1 text-[11px]" style={{ animation: "fadeInScale 0.15s ease" }}>
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
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Liên hệ thường xuyên</p>
              </div>
              {filteredContacts.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="w-6 h-6 text-gray-200 mx-auto mb-2" />
                  <p className="text-[12px] text-gray-500">Không tìm thấy liên hệ nào</p>
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
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] text-white" style={{ backgroundColor: contact.color }}>
                          {contact.name.charAt(0)}
                        </div>
                        {isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-green-400" />
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[13px] text-gray-800 truncate">{contact.name}</p>
                        <p className={`text-[11px] truncate ${contact.lastSeen === "đang hoạt động" || contact.lastSeen === "vừa xong" ? "text-cyan-500" : "text-gray-500"}`}>
                          {contact.username ? contact.username : `lần cuối: ${contact.lastSeen}`}
                        </p>
                      </div>
                      {/* Checkbox */}
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

      {/* Edit Tag Modal */}
      {editTagModal && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/30" onClick={() => setEditTagModal(null)}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:w-[300px] overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: "fadeInScale 0.15s ease" }}>
            <div className="px-5 pt-5 pb-2">
              <h3 className="text-[14px] text-gray-800">Sửa nhãn cho {editTagModal.memberName}</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Nhãn sẽ hiển thị bên cạnh tên thành viên</p>
            </div>
            <div className="px-5 py-3">
              <input ref={editTagInputRef} value={editTagValue} onChange={e => setEditTagValue(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSaveTag(); if (e.key === "Escape") setEditTagModal(null); }}
                placeholder="VD: Designer, Backend, PM..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100 transition-all" />
            </div>
            <div className="flex items-center justify-end gap-2 px-5 pb-4">
              <button onClick={() => setEditTagModal(null)} className="px-3 py-1.5 text-[12px] text-gray-500 hover:bg-gray-100 rounded-lg transition-all">Huỷ</button>
              <button onClick={handleSaveTag} className="px-4 py-1.5 text-[12px] text-white bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-all">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============== MEMBER CONTEXT MENU ============== */
function MemberContextMenu({ position, member, isRestricted, onClose, onEditTag, onRestrict, onPromote, onDelete }: {
  position: { x: number; y: number };
  member: { id: string; name: string; role: string };
  isRestricted: boolean;
  onClose: () => void;
  onEditTag: () => void;
  onRestrict: () => void;
  onPromote: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const adjustedPos = {
    x: Math.min(position.x, window.innerWidth - 200),
    y: Math.min(position.y, window.innerHeight - 200),
  };

  const MenuItem = ({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) => (
    <button onClick={() => { onClick(); onClose(); }}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] rounded-md transition-all ${
        danger ? "text-red-500 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"
      }`}>
      {icon}
      {label}
    </button>
  );

  return (
    <div ref={ref} className="fixed z-[60] bg-white rounded-xl shadow-xl border border-gray-200 py-1 px-1 min-w-[170px]"
      style={{ left: adjustedPos.x, top: adjustedPos.y, animation: "fadeInScale 0.12s ease" }}>
      <div className="px-3 py-1.5 border-b border-gray-100 mb-0.5">
        <p className="text-[11px] text-gray-800 truncate">{member.name}</p>
        <p className="text-[9px] text-gray-500">{member.role === "owner" ? "Chủ sở hữu" : member.role === "admin" ? "Quản trị viên" : "Thành viên"}</p>
      </div>
      <MenuItem icon={<Tag className="w-4 h-4" />} label="Sửa nhãn" onClick={onEditTag} />
      <MenuItem icon={<ShieldBan className="w-4 h-4" />} label={isRestricted ? "Bỏ hạn chế" : "Hạn chế"} onClick={onRestrict} />
      <MenuItem icon={<Crown className="w-4 h-4" />} label="Thăng cấp" onClick={onPromote} />
      <div className="h-px bg-gray-100 mx-2 my-0.5" />
      <MenuItem icon={<Trash2 className="w-4 h-4" />} label="Xoá" onClick={onDelete} danger />
    </div>
  );
}

/* ============== SCHEDULE MESSAGE MODAL ============== */
function ScheduleMessageModal({ onClose, onSchedule, inputValue }: {
  onClose: () => void; onSchedule: (content: string, time: string) => void; inputValue: string;
}) {
  const [content, setContent] = useState(inputValue);
  const [scheduleDate, setScheduleDate] = useState("2026-03-17");
  const [scheduleTime, setScheduleTime] = useState("17:00");
  const quickOptions = [
    { label: "Sau 1 giờ", time: (() => { const d = new Date(); d.setHours(d.getHours() + 1); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; })() },
    { label: "Chiều nay 17:00", time: "17:00" },
    { label: "Sáng mai 09:00", time: "Ngày mai, 09:00" },
    { label: "Thứ 2 tới 08:00", time: "Thứ 2, 08:00" },
  ];
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-[60] backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:w-[400px] overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: "fadeInScale 0.2s ease" }}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center"><CalendarClock className="w-4 h-4 text-violet-500" /></div>
            <div><h3 className="text-[14px] text-gray-800">Hẹn giờ gửi tin nhắn</h3><p className="text-[10px] text-gray-500">Tin nhắn sẽ được gửi tự động</p></div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-[11px] text-gray-700 font-medium mb-1.5 block">Nội dung tin nhắn</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-800 resize-none h-[72px] focus:outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-50 transition-all" placeholder="Nhập tin nhắn..." />
          </div>
          <div>
            <label className="text-[11px] text-gray-700 font-medium mb-1.5 block">Gửi nhanh</label>
            <div className="grid grid-cols-2 gap-1.5">
              {quickOptions.map(opt => (
                <button key={opt.label} onClick={() => setScheduleTime(opt.time)}
                  className={`text-[11px] px-3 py-2 rounded-lg border transition-all text-left ${scheduleTime === opt.time ? "border-violet-300 bg-violet-50 text-violet-600" : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}>
                  <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{opt.label}</div>
                  <span className="text-[10px] text-gray-500 mt-0.5 block">{opt.time}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[11px] text-gray-700 font-medium mb-1.5 block">Ngày</label>
              <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] text-gray-800 focus:outline-none focus:border-cyan-300 transition-all" />
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-gray-700 font-medium mb-1.5 block">Giờ</label>
              <input type="time" value={scheduleTime.includes(":") && scheduleTime.length <= 5 ? scheduleTime : "17:00"} onChange={e => setScheduleTime(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] text-gray-800 focus:outline-none focus:border-cyan-300 transition-all" />
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-[12px] text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-all">Hủy</button>
          <button onClick={() => { if (content.trim()) { onSchedule(content.trim(), scheduleTime); onClose(); } }} className="px-4 py-2 text-[12px] text-white bg-violet-500 hover:bg-violet-600 rounded-lg shadow-sm transition-all flex items-center gap-1.5"><CalendarClock className="w-3.5 h-3.5" />Hẹn giờ gửi</button>
        </div>
      </div>
    </div>
  );
}

/* ============== CHAT TOPICS DRAWER ============== */
function ChatTopicsDrawer({ chatId, topics, activeTopicId, onSelectTopic, onClose, onCreateTopic, onDeleteTopic, messages }: {
  chatId: string;
  topics: { id: string; name: string; emoji: string; color: string }[];
  activeTopicId: string;
  onSelectTopic: (id: string) => void;
  onClose: () => void;
  onCreateTopic: (chatId: string, name: string, emoji: string, color: string) => void;
  onDeleteTopic: (chatId: string, topicId: string) => void;
  messages: ChatMessage[];
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("💬");
  const [newColor, setNewColor] = useState("#0891b2");
  const emojiOptions = ["💬", "📌", "📝", "🔥", "✅", "📎", "🎯", "💡", "🚀", "⭐", "🔔", "🏷️"];
  const colorOptions = ["#0891b2", "#7c3aed", "#059669", "#d97706", "#db2777", "#4f46e5", "#0f766e", "#b45309"];

  const countForTopic = (topicId: string) =>
    messages.filter(m => m.chatTopicId === topicId && !m.parentId).length;
  const allCount = messages.filter(m => !m.parentId).length;

  return (
    <div className="w-full md:w-[230px] bg-white border-r border-gray-200 flex flex-col shrink-0" style={{ animation: "fadeInScale 0.15s ease" }}>
      {/* Header */}
      <div className="h-[48px] border-b border-gray-200 flex items-center px-4 shrink-0 gap-2">
        <Hash className="w-4 h-4 text-indigo-500 shrink-0" />
        <span className="text-[13px] font-medium text-gray-800 flex-1">Chủ đề</span>
        <button onClick={() => setCreating(true)} className="w-6 h-6 rounded-lg hover:bg-indigo-50 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-all" title="Tạo chủ đề">
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-all">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {/* "All messages" row */}
        <button onClick={() => onSelectTopic("all")}
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 transition-all ${activeTopicId === "all" ? "bg-indigo-50" : "hover:bg-gray-50"}`}>
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-[13px] shrink-0">📋</div>
          <div className="flex-1 min-w-0 text-left">
            <p className={`text-[12px] truncate ${activeTopicId === "all" ? "text-indigo-700 font-medium" : "text-gray-700"}`}>Tất cả tin nhắn</p>
            <p className="text-[10px] text-gray-400">{allCount} tin nhắn</p>
          </div>
          {activeTopicId === "all" && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />}
        </button>

        {/* Topic list */}
        {topics.length > 0 && (
          <div className="mx-4 h-px bg-gray-100 my-1.5" />
        )}
        {topics.map(t => {
          const cnt = countForTopic(t.id);
          const isActive = activeTopicId === t.id;
          return (
            <div key={t.id} className="group/tp relative">
              <button onClick={() => onSelectTopic(t.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 transition-all ${isActive ? "bg-indigo-50" : "hover:bg-gray-50"}`}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] shrink-0" style={{ backgroundColor: t.color + "22" }}>
                  {t.emoji}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className={`text-[12px] truncate ${isActive ? "font-medium" : "text-gray-700"}`} style={isActive ? { color: t.color } : {}}>{t.name}</p>
                  <p className="text-[10px] text-gray-400">{cnt} tin nhắn</p>
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />}
              </button>
              <button onClick={() => onDeleteTopic(chatId, t.id)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md opacity-0 group-hover/tp:opacity-100 hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition-all">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Create form */}
        {creating && (
          <div className="mx-3 mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
            <p className="text-[11px] font-medium text-gray-700">Chủ đề mới</p>
            <div className="flex gap-1.5 flex-wrap">
              {emojiOptions.map(e => (
                <button key={e} onClick={() => setNewEmoji(e)}
                  className={`w-7 h-7 rounded-lg text-[14px] flex items-center justify-center transition-all ${newEmoji === e ? "bg-indigo-100 ring-2 ring-indigo-300" : "hover:bg-gray-100"}`}>{e}</button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {colorOptions.map(c => (
                <button key={c} onClick={() => setNewColor(c)}
                  className={`w-5 h-5 rounded-full transition-all ${newColor === c ? "ring-2 ring-offset-1 ring-gray-400" : ""}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Tên chủ đề..."
              className="w-full text-[12px] border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-300"
              onKeyDown={e => { if (e.key === "Enter" && newName.trim()) { onCreateTopic(chatId, newName.trim(), newEmoji, newColor); setNewName(""); setCreating(false); } if (e.key === "Escape") setCreating(false); }}
              autoFocus />
            <div className="flex gap-1.5">
              <button onClick={() => { if (newName.trim()) { onCreateTopic(chatId, newName.trim(), newEmoji, newColor); setNewName(""); setCreating(false); } }}
                className="flex-1 py-1.5 text-[11px] bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all">Tạo</button>
              <button onClick={() => setCreating(false)} className="flex-1 py-1.5 text-[11px] bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all">Hủy</button>
            </div>
          </div>
        )}

        {topics.length === 0 && !creating && (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
              <Hash className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-[12px] text-gray-600 font-medium mb-1">Chưa có chủ đề</p>
            <p className="text-[11px] text-gray-400">Tạo chủ đề để sắp xếp tin nhắn theo từng chủ đề riêng</p>
            <button onClick={() => setCreating(true)} className="mt-3 px-3 py-1.5 text-[11px] bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all flex items-center gap-1">
              <Plus className="w-3 h-3" /> Tạo chủ đề
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============== TAG TOPIC MODAL ============== */
function TagTopicModal({ topics, onTag, onClose, onCreateNew }: {
  topics: { id: string; name: string; emoji: string; color: string }[];
  onTag: (topicId: string) => void;
  onClose: () => void;
  onCreateNew?: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-end md:items-center justify-center z-[70] backdrop-blur-[1px]" onClick={onClose}>
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:w-[280px] overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: "fadeInScale 0.15s ease" }}>
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-indigo-500" />
            <span className="text-[13px] font-medium text-gray-800">Gắn chủ đề</span>
          </div>
          <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-3.5 h-3.5" /></button>
        </div>
        <div className="py-1.5">
          {onCreateNew && (
            <button onClick={() => { onCreateNew(); onClose(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-indigo-50 transition-all">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500"><Plus className="w-4 h-4" /></div>
              <span className="text-[12px] text-indigo-600 font-medium">Tạo chủ đề mới</span>
            </button>
          )}
          <button onClick={() => { onTag(""); onClose(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-all">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-[12px]">🚫</div>
            <span className="text-[12px] text-gray-500">Bỏ chủ đề</span>
          </button>
          {topics.map(t => (
            <button key={t.id} onClick={() => { onTag(t.id); onClose(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-all">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px]" style={{ backgroundColor: t.color + "22" }}>{t.emoji}</div>
              <span className="text-[12px] text-gray-700">{t.name}</span>
            </button>
          ))}
          {topics.length === 0 && !onCreateNew && (
            <p className="text-[11px] text-gray-400 text-center py-4">Chưa có chủ đề nào. Mở ngăn Chủ đề để tạo.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============== CREATE POLL MODAL ============== */
function CreatePollModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (question: string, options: string[], multipleChoice: boolean, anonymous: boolean) => void;
}) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [anonymous, setAnonymous] = useState(false);

  const addOption = () => { if (options.length < 10) setOptions([...options, ""]); };
  const removeOption = (i: number) => { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)); };
  const updateOption = (i: number, v: string) => { const n = [...options]; n[i] = v; setOptions(n); };
  const canCreate = question.trim() && options.filter(o => o.trim()).length >= 2;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-[60] backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:w-[440px] max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()} style={{ animation: "fadeInScale 0.2s ease" }}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center"><BarChart3 className="w-4.5 h-4.5 text-indigo-500" /></div>
            <div><h3 className="text-[14px] font-semibold text-gray-800">Tạo bình chọn</h3><p className="text-[10px] text-gray-500">Tạo cuộc khảo sát cho nhóm</p></div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-all"><ChevronLeft className="w-5 h-5 md:hidden" /><X className="w-4 h-4 hidden md:block" /></button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {/* Question */}
          <div>
            <label className="text-[11px] text-gray-700 font-medium mb-1.5 block">Câu hỏi <span className="text-red-400">*</span></label>
            <textarea
              value={question} onChange={e => setQuestion(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] text-gray-800 resize-none h-[64px] focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all"
              placeholder="Ví dụ: Team muốn đi ăn gì cuối tuần?"
              maxLength={200}
            />
            <p className="text-[10px] text-gray-400 text-right mt-0.5">{question.length}/200</p>
          </div>

          {/* Options */}
          <div>
            <label className="text-[11px] text-gray-700 font-medium mb-1.5 block">Lựa chọn <span className="text-red-400">*</span> <span className="text-gray-400 font-normal">(tối thiểu 2, tối đa 10)</span></label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 group/opt">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center shrink-0 text-[9px] text-gray-400 font-medium">{i + 1}</div>
                  <input
                    value={opt} onChange={e => updateOption(i, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-[12px] text-gray-800 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all"
                    placeholder={`Lựa chọn ${i + 1}`}
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <button onClick={() => removeOption(i)} className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 opacity-0 group-hover/opt:opacity-100 transition-all shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <button onClick={addOption} className="mt-2 flex items-center gap-1.5 text-[11px] text-indigo-500 hover:text-indigo-600 transition-all px-1 py-1">
                <Plus className="w-3.5 h-3.5" /> Thêm lựa chọn
              </button>
            )}
          </div>

          {/* Settings */}
          <div className="border-t border-gray-100 pt-3 space-y-2.5">
            <label className="text-[11px] text-gray-700 font-medium block">Cài đặt</label>
            <label className="flex items-center gap-2.5 cursor-pointer group/chk">
              <div className={`w-[34px] h-[18px] rounded-full transition-all relative ${multipleChoice ? "bg-indigo-500" : "bg-gray-200"}`} onClick={() => setMultipleChoice(!multipleChoice)}>
                <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-all ${multipleChoice ? "left-[17px]" : "left-[2px]"}`} />
              </div>
              <span className="text-[12px] text-gray-700">Cho phép chọn nhiều đáp án</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer group/chk">
              <div className={`w-[34px] h-[18px] rounded-full transition-all relative ${anonymous ? "bg-indigo-500" : "bg-gray-200"}`} onClick={() => setAnonymous(!anonymous)}>
                <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-all ${anonymous ? "left-[17px]" : "left-[2px]"}`} />
              </div>
              <span className="text-[12px] text-gray-700">Bình chọn ẩn danh</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between shrink-0">
          <p className="text-[10px] text-gray-400">{options.filter(o => o.trim()).length} lựa chọn hợp lệ</p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-[12px] text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-all">Hủy</button>
            <button
              disabled={!canCreate}
              onClick={() => { if (canCreate) { onCreate(question.trim(), options.filter(o => o.trim()), multipleChoice, anonymous); onClose(); } }}
              className={`px-4 py-2 text-[12px] rounded-lg shadow-sm transition-all flex items-center gap-1.5 ${canCreate ? "text-white bg-indigo-500 hover:bg-indigo-600" : "text-gray-400 bg-gray-100 cursor-not-allowed"}`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Tạo bình chọn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============== QUICK PROMPTS PER AGENT ============== */
const agentQuickPrompts: Record<string, string[]> = {
  vwork_bot: [
    "/report weekly",
    "Overdue tasks?",
    "/sprint current",
    "Tiến độ hôm nay?",
    "/standup",
  ],
  code_review: [
    "Review PR mới nhất",
    "Lỗi phổ biến tuần này?",
    "Best practices cho React?",
    "Check security issues",
  ],
  analytics: [
    "Báo cáo tuần này",
    "Top metrics hôm nay",
    "So sánh với tuần trước",
    "Alert nào đang active?",
  ],
  kb_agent: [
    "Quy trình onboarding mới?",
    "Chính sách WFH mới nhất",
    "Business rules về approve?",
    "Hướng dẫn deploy production",
    "Quyết định gần nhất của team",
  ],
};

/* ============== MAIN CHAT VIEW ============== */
export function ChatView({ tasks, onTaskClick, onStatusChange, onAddTask, onSaveTaskFromChat, selectedSpace, selectedPersonalChat, groupChats = [], extraDMs = [], selectedChannel, channels = [], onStartDM, onUpdateChannel, onPublishAnnouncement, onAddCategory, categories, onOpenGroup }: ChatViewProps) {
  const space = selectedSpace ? allSpaces.find(s => s.id === selectedSpace) : null;
  const isPersonalChat = selectedSpace === "sp-personal" && !!selectedPersonalChat;
  const isChannelChat = selectedSpace === "sp-channel" && !!selectedChannel;
  const isGroupChat = isPersonalChat && (selectedPersonalChat?.startsWith("pc-group-") || selectedPersonalChat?.startsWith("cg"));
  const isProjectTopicChat = !isPersonalChat && !isChannelChat && space?.category === "project";
  const activeGroupChat = isGroupChat ? groupChats.find(g => g.id === selectedPersonalChat) : null;
  const activeChannelItem = isChannelChat ? channels.find(c => c.id === selectedChannel) : null;
  const currentUserId = "u1"; // Nguyễn Minh — logged-in user
  const canPostInChannel = !isChannelChat || !activeChannelItem ||
    activeChannelItem.ownerId === currentUserId ||
    (activeChannelItem.allowedPosterIds ?? []).includes(currentUserId);
  const allPersonalItems = [...personalChatItems, ...extraDMs];
  const activePersonalItem = isPersonalChat ? allPersonalItems.find(p => p.id === selectedPersonalChat) : null;
  const isPersonalTool = isPersonalChat && !isGroupChat && activePersonalItem?.type === "tool";
  const isPcSaved = isPersonalTool && selectedPersonalChat === "pc-saved";
  const [localTopics, setLocalTopics] = useState<Topic[]>(space?.topics || []);
  const defaultTopic = localTopics.find(t => t.pinned)?.id || localTopics[0]?.id || "";

  const [activeTopic, setActiveTopic] = useState(defaultTopic);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [showCommands, setShowCommands] = useState(false);
  const [showTopicList, setShowTopicList] = useState(true);
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [topicSearchQuery, setTopicSearchQuery] = useState("");
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  // NEW: emoji picker, topic edit/delete, forward
  const [emojiPickerState, setEmojiPickerState] = useState<{ msgId: string; pos: { top: number; left: number } } | null>(null);
  const [topicContextMenu, setTopicContextMenu] = useState<{ topic: Topic; pos: { x: number; y: number } } | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [deletingTopic, setDeletingTopic] = useState<Topic | null>(null);
  const [forwardingMsg, setForwardingMsg] = useState<ChatMessage | null>(null);
  const [mutedTopics, setMutedTopics] = useState<Record<string, string>>({}); // topicId -> mute mode
  const [closedTopics, setClosedTopics] = useState<Set<string>>(new Set());
  const [muteDurationModal, setMuteDurationModal] = useState<string | null>(null); // topicId
  const [openedNewWindow, setOpenedNewWindow] = useState<string | null>(null);
  // NEW: Chat Search, Typing Indicator, @Mention, Message Edit
  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editMsgContent, setEditMsgContent] = useState("");
  const [showTyping, setShowTyping] = useState(false);
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [msgContextMenu, setMsgContextMenu] = useState<{ msg: ChatMessage; pos: { x: number; y: number } } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const lightboxTouchStartX = useRef<number | null>(null);
  const [announceFormOpen, setAnnounceFormOpen] = useState(false);
  const [announceForm, setAnnounceForm] = useState({ title: "", emoji: "📢", category: "Kinh doanh & Chiến lược", badge: "Thông báo", description: "", s1l: "", s1v: "", s2l: "", s2v: "", s3l: "", s3v: "", attachment: "", publishedBy: "" });
  const [addCatMode, setAddCatMode] = useState(false);
  const [newCatInput, setNewCatInput] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [searchResultIdx, setSearchResultIdx] = useState(0);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [reactionDetailMsg, setReactionDetailMsg] = useState<{ msgId: string; emoji: string; pos: { x: number; y: number } } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [emojiSearchQuery, setEmojiSearchQuery] = useState("");
  const [typingUsers, setTypingUsers] = useState<{ id: string; name: string }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadMsgId, setLastReadMsgId] = useState<string | null>(null);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showChannelManage, setShowChannelManage] = useState(false);
  const [showNotesInfo, setShowNotesInfo] = useState(false);
  const [chatInfoTab, setChatInfoTab] = useState<"members" | "media" | "files" | "links">("members");
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set(["m2", "m5"]));
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  // ── Personal chat topics (DM / group / notes) ──
  const [chatTopicsMap, setChatTopicsMap] = useState<Record<string, { id: string; name: string; emoji: string; color: string }[]>>({});
  const [activeChatTopicId, setActiveChatTopicId] = useState<string>("all");
  const [showTopicsDrawer, setShowTopicsDrawer] = useState(false);
  const [pinnedBannerIdx, setPinnedBannerIdx] = useState(0);
  const [tagTopicModalMsg, setTagTopicModalMsg] = useState<string | null>(null);
  const [createTaskFromMsg, setCreateTaskFromMsg] = useState<{ id: string; content: string } | null>(null);
  const [scheduledMessages, setScheduledMessages] = useState<{ id: string; content: string; scheduledTime: string; topicId: string }[]>([
    { id: "sch-1", content: "Nhắc team review PR #42 trước 5pm", scheduledTime: "17:00", topicId: "tp-gen-all" },
    { id: "sch-2", content: "Gửi báo cáo sprint cuối tuần", scheduledTime: "Thứ 6, 16:30", topicId: "tp-gen-all" },
  ]);
  const [profileUser, setProfileUser] = useState<{ id: string; name: string; color: string; isBot?: boolean } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [animatingReactions, setAnimatingReactions] = useState<Set<string>>(new Set());
  const [readReceiptPopup, setReadReceiptPopup] = useState<{ msgId: string; pos: { x: number; y: number } } | null>(null);
  const [skinToneEmoji, setSkinToneEmoji] = useState<{ emoji: string; pos: { x: number; y: number }; callback: (e: string) => void } | null>(null);
  const [notificationSound, setNotificationSound] = useState(true);
  const [translatedMsgIds, setTranslatedMsgIds] = useState<Set<string>>(new Set());
  const [pinAnimatingIds, setPinAnimatingIds] = useState<Set<string>>(new Set());
  const [noteCheckedItems, setNoteCheckedItems] = useState<Record<string, Set<number>>>({});

  const toggleTranslate = useCallback((msgId: string) => {
    setTranslatedMsgIds(prev => {
      const n = new Set(prev);
      if (n.has(msgId)) { n.delete(msgId); toast("Hiển thị bản gốc", { duration: 1500 }); }
      else { n.add(msgId); toast.success("Đã dịch sang Tiếng Anh", { icon: <Languages className="w-4 h-4 text-blue-500" />, duration: 2000 }); }
      return n;
    });
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputEmojiRef = useRef<HTMLDivElement>(null);

  const topicMessages = useMemo(() => {
    let base: ChatMessage[];
    if (activeTopic === "pc-saved") {
      base = messages.filter(m => savedMessageIds.has(m.id) && !m.parentId);
    } else {
      base = messages.filter(m => m.topicId === activeTopic && !m.parentId);
    }
    // Filter by personal chat topic when active
    if (isPersonalChat && activeChatTopicId !== "all") {
      base = base.filter(m => m.chatTopicId === activeChatTopicId);
    }
    return base;
  }, [messages, activeTopic, savedMessageIds, isPersonalChat, activeChatTopicId]);
  const currentTopic = localTopics.find(t => t.id === activeTopic);

  const threadParent = activeThread ? messages.find(m => m.id === activeThread) : null;
  const threadReplies = useMemo(
    () => activeThread ? messages.filter(m => m.parentId === activeThread) : [],
    [messages, activeThread]
  );

  const pinnedMessages = useMemo(
    () => messages.filter(m => m.topicId === activeTopic && m.pinned && !m.parentId),
    [messages, activeTopic]
  );

  const filteredTopics = useMemo(() => {
    if (!topicSearchQuery.trim()) return localTopics;
    const q = topicSearchQuery.toLowerCase();
    return localTopics.filter(t =>
      t.name.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q)
    );
  }, [localTopics, topicSearchQuery]);

  // Build all topics list for forward modal (across all spaces)
  const allTopicsFlat = useMemo(() => {
    const result: { topicId: string; topicName: string; topicEmoji?: string; spaceName: string }[] = [];
    // Current space topics
    for (const t of localTopics) {
      result.push({ topicId: t.id, topicName: t.name, topicEmoji: t.emoji, spaceName: space?.name || "" });
    }
    // Other spaces
    for (const s of allSpaces) {
      if (s.id === space?.id) continue;
      for (const t of s.topics) {
        result.push({ topicId: t.id, topicName: t.name, topicEmoji: t.emoji, spaceName: s.name });
      }
    }
    return result;
  }, [localTopics, space]);

  useEffect(() => {
    if (isChannelChat) {
      setLocalTopics([]);
      setActiveTopic(selectedChannel!);
      setActiveThread(null);
      setShowPinnedPanel(false);
      setTopicSearchQuery("");
    } else if (isPersonalChat) {
      setLocalTopics([]);
      setActiveTopic(selectedPersonalChat!);
      setActiveThread(null);
      setShowPinnedPanel(false);
      setTopicSearchQuery("");
    } else if (space) {
      setLocalTopics(space.topics);
      const first = space.topics.find(t => t.pinned)?.id || space.topics[0]?.id || "";
      setActiveTopic(first);
      setActiveThread(null);
      setShowPinnedPanel(false);
      setTopicSearchQuery("");
    }
  }, [selectedSpace, selectedPersonalChat, isPersonalChat, selectedChannel, isChannelChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [topicMessages.length]);

  // Close input emoji picker on outside click
  useEffect(() => {
    if (!showInputEmojiPicker) return;
    const handler = (e: MouseEvent) => {
      if (inputEmojiRef.current && !inputEmojiRef.current.contains(e.target as Node)) setShowInputEmojiPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showInputEmojiPicker]);

  // Close attach menu on outside click
  useEffect(() => {
    if (!showAttachMenu) return;
    const handler = () => setShowAttachMenu(false);
    setTimeout(() => document.addEventListener("click", handler), 0);
    return () => document.removeEventListener("click", handler);
  }, [showAttachMenu]);

  // Simulated multi-user typing indicator
  useEffect(() => {
    const typingSimulation = [
      { delay: 3000, users: [{ id: "u2", name: "Trần Hương" }] },
      { delay: 5000, users: [{ id: "u2", name: "Trần Hương" }, { id: "u3", name: "Lê Phúc" }] },
      { delay: 7500, users: [{ id: "u3", name: "Lê Phúc" }] },
      { delay: 9000, users: [] },
    ];
    const timers = typingSimulation.map(s =>
      setTimeout(() => setTypingUsers(s.users), s.delay)
    );
    const loop = setInterval(() => {
      typingSimulation.forEach(s => {
        setTimeout(() => setTypingUsers(s.users), s.delay);
      });
    }, 15000);
    return () => { timers.forEach(clearTimeout); clearInterval(loop); };
  }, [activeTopic]);

  // Track unread count when scrolled up
  useEffect(() => {
    if (!isScrolledUp) { setUnreadCount(0); return; }
  }, [isScrolledUp]);

  // Set last read message id on topic switch
  useEffect(() => {
    const msgs = messages.filter(m => m.topicId === activeTopic && !m.parentId);
    if (msgs.length > 3) {
      setLastReadMsgId(msgs[msgs.length - 4]?.id || null);
    } else {
      setLastReadMsgId(null);
    }
  }, [activeTopic]);

  // Skin tone picker event listener
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setSkinToneEmoji({ emoji: detail.emoji, pos: { x: detail.x, y: detail.y }, callback: detail.callback });
      }
    };
    window.addEventListener("skinTonePick", handler);
    return () => window.removeEventListener("skinTonePick", handler);
  }, []);

  // Scroll tracking for FAB
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsScrolledUp(distFromBottom > 150);
    if (distFromBottom <= 50) setUnreadCount(0);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadCount(0);
  }, []);

  // Chat search filtered messages
  const chatSearchResults = useMemo(() => {
    if (!chatSearchQuery.trim()) return [];
    const q = chatSearchQuery.toLowerCase();
    return messages.filter(m => m.topicId === activeTopic && !m.parentId && m.content?.toLowerCase().includes(q));
  }, [messages, activeTopic, chatSearchQuery]);

  // @mention filtered members
  const mentionMembers = useMemo(() => {
    if (!mentionFilter) return teamMembers;
    const q = mentionFilter.toLowerCase();
    return teamMembers.filter(m => m.name.toLowerCase().includes(q));
  }, [mentionFilter]);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    setShowCommands(val.startsWith("/") && val.length < 15 && !val.includes(" "));
    // @mention detection
    const lastAt = val.lastIndexOf("@");
    if (lastAt !== -1 && lastAt === val.length - 1) {
      setShowMentionPicker(true);
      setMentionFilter("");
    } else if (lastAt !== -1 && !val.slice(lastAt).includes(" ")) {
      setShowMentionPicker(true);
      setMentionFilter(val.slice(lastAt + 1));
    } else {
      setShowMentionPicker(false);
    }
  };

  const insertMention = (name: string) => {
    const lastAt = inputValue.lastIndexOf("@");
    const before = lastAt >= 0 ? inputValue.slice(0, lastAt) : inputValue;
    setInputValue(before + `@${name} `);
    setShowMentionPicker(false);
    inputRef.current?.focus();
  };

  const startEditMessage = (msg: ChatMessage) => {
    setEditingMsgId(msg.id);
    setEditMsgContent(msg.content);
    setInputValue(msg.content);
    setReplyingTo(null);
    inputRef.current?.focus();
  };

  const saveEditMessage = () => {
    if (!editingMsgId || !editMsgContent.trim()) return;
    setMessages(prev => prev.map(m => m.id === editingMsgId ? { ...m, content: editMsgContent.trim(), edited: true } : m));
    setEditingMsgId(null);
    setEditMsgContent("");
  };

  const cancelEditMessage = () => {
    setEditingMsgId(null);
    setEditMsgContent("");
    setInputValue("");
  };

  const deleteMessage = (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId && m.parentId !== msgId));
    setSelectedMsgIds(prev => { const n = new Set(prev); n.delete(msgId); return n; });
    toast("Đã xoá tin nhắn", { icon: <Trash2 className="w-4 h-4 text-red-500" />, duration: 2000 });
  };

  const copyMessageText = (msg: ChatMessage) => {
    const text = msg.content || msg.reportData?.title || "";
    copyToClipboard(text).then(() => {
      toast("Đã sao chép", { icon: <Copy className="w-4 h-4 text-gray-500" />, duration: 1500 });
    });
  };

  const toggleSelectMsg = (msgId: string) => {
    setSelectedMsgIds(prev => {
      const n = new Set(prev);
      if (n.has(msgId)) n.delete(msgId); else n.add(msgId);
      if (n.size === 0) setSelectionMode(false);
      return n;
    });
  };

  const enterSelectionMode = (msgId: string) => {
    setSelectionMode(true);
    setSelectedMsgIds(new Set([msgId]));
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedMsgIds(new Set());
  };

  const deleteSelectedMessages = () => {
    setMessages(prev => prev.filter(m => !selectedMsgIds.has(m.id)));
    exitSelectionMode();
  };

  const toggleBookmark = (msgId: string) => {
    const wasBookmarked = savedMessageIds.has(msgId);
    setSavedMessageIds(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId); else next.add(msgId);
      return next;
    });
    toast(wasBookmarked ? "Đã bỏ lưu tin nhắn" : "Đã lưu tin nhắn", {
      icon: wasBookmarked ? <Bookmark className="w-4 h-4 text-gray-400" /> : <BookmarkCheck className="w-4 h-4 text-amber-500" />,
      duration: 1500,
    });
  };

  const addScheduledMessage = (content: string, time: string) => {
    setScheduledMessages(prev => [...prev, {
      id: `sch-${Date.now()}`, content, scheduledTime: time, topicId: activeTopic
    }]);
    toast.success(`Tin nhắn sẽ được gửi lúc ${time}`, {
      icon: <CalendarClock className="w-4 h-4 text-violet-500" />,
      duration: 3000,
      action: { label: "Xem", onClick: () => { setShowChatInfo(true); setChatInfoTab("members"); } },
    });
  };

  const removeScheduledMessage = (id: string) => {
    setScheduledMessages(prev => prev.filter(m => m.id !== id));
  };

  // Shared media/files from messages
  const sharedMedia = useMemo(() => {
    return messages.filter(m => m.topicId === activeTopic && m.type === "image" && m.imageUrl);
  }, [messages, activeTopic]);

  // All images in current topic (for lightbox navigation)
  const allChatImages = useMemo(() =>
    topicMessages.filter(m => m.type === "image" && m.imageUrl).map(m => ({ url: m.imageUrl!, caption: m.imageCaption })),
    [topicMessages]
  );
  const openLightbox = useCallback((url: string) => {
    const idx = allChatImages.findIndex(img => img.url === url);
    setLightboxIdx(idx >= 0 ? idx : 0);
  }, [allChatImages]);
  const lightboxPrev = useCallback(() => setLightboxIdx(i => (i !== null && i > 0) ? i - 1 : i), []);
  const lightboxNext = useCallback(() => setLightboxIdx(i => (i !== null && i < allChatImages.length - 1) ? i + 1 : i), [allChatImages.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  { e.preventDefault(); lightboxPrev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); lightboxNext(); }
      if (e.key === "Escape")     setLightboxIdx(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [lightboxIdx, lightboxPrev, lightboxNext]);

  const sharedFiles = useMemo(() => {
    return messages.filter(m => m.topicId === activeTopic && m.type === "file" && m.fileName);
  }, [messages, activeTopic]);

  const sharedLinks = useMemo(() => {
    return messages.filter(m => m.topicId === activeTopic && m.linkPreview);
  }, [messages, activeTopic]);

  const navigateSearchResult = (direction: "prev" | "next") => {
    if (chatSearchResults.length === 0) return;
    const newIdx = direction === "next"
      ? (searchResultIdx + 1) % chatSearchResults.length
      : (searchResultIdx - 1 + chatSearchResults.length) % chatSearchResults.length;
    setSearchResultIdx(newIdx);
    const targetMsg = chatSearchResults[newIdx];
    if (targetMsg) {
      setHighlightedMsgId(targetMsg.id);
      const el = document.getElementById(`msg-${targetMsg.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setHighlightedMsgId(null), 2000);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const n = new Date();
      const isImage = file.type.startsWith("image/");
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setMessages(prev => [...prev, {
            id: `msg-drop-${Date.now()}`, type: "image", sender: minhUser,
            content: "", timestamp: fmt(n.getHours(), n.getMinutes()), topicId: activeTopic,
            imageUrl: ev.target?.result as string, imageCaption: file.name
          }]);
        };
        reader.readAsDataURL(file);
      } else {
        const size = file.size < 1024 ? `${file.size} B` : file.size < 1048576 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / 1048576).toFixed(1)} MB`;
        const ext = file.name.split(".").pop() || "file";
        setMessages(prev => [...prev, {
          id: `msg-drop-${Date.now()}`, type: "file", sender: minhUser,
          content: `Đã gửi ${file.name}`, timestamp: fmt(n.getHours(), n.getMinutes()), topicId: activeTopic,
          fileName: file.name, fileSize: size, fileType: ext
        }]);
      }
    }
  };

  const handleCreateTopic = (name: string, emoji: string) => {
    const newTopic: Topic = { id: `tp-custom-${Date.now()}`, name, emoji, unread: 0, pinned: false };
    setLocalTopics(prev => [...prev, newTopic]);
    setActiveTopic(newTopic.id);
    setMessages(prev => [...prev, {
      id: `sys-${Date.now()}`, type: "system" as const, sender: botUser,
      content: `Chủ đề "${emoji} ${name}" đã được tạo`,
      timestamp: fmt(now.getHours(), now.getMinutes()), topicId: newTopic.id,
    }]);
  };

  const handleEditTopic = (id: string, name: string, emoji: string) => {
    setLocalTopics(prev => prev.map(t => t.id === id ? { ...t, name, emoji } : t));
    setMessages(prev => [...prev, {
      id: `sys-${Date.now()}`, type: "system" as const, sender: botUser,
      content: `Chủ đề đã được đổi tên thành "${emoji} ${name}"`,
      timestamp: fmt(now.getHours(), now.getMinutes()), topicId: id,
    }]);
  };

  const handleDeleteTopic = (id: string) => {
    const remaining = localTopics.filter(t => t.id !== id);
    setLocalTopics(remaining);
    setMessages(prev => prev.filter(m => m.topicId !== id));
    if (activeTopic === id) {
      setActiveTopic(remaining[0]?.id || "");
    }
  };

  const handleToggleTopicPin = (id: string) => {
    setLocalTopics(prev => prev.map(t => t.id === id ? { ...t, pinned: !t.pinned } : t));
    const topic = localTopics.find(t => t.id === id);
    const newPinned = !topic?.pinned;
    setMessages(prev => [...prev, {
      id: `sys-${Date.now()}`, type: "system" as const, sender: botUser,
      content: newPinned ? `📌 Chủ đề đã được ghim` : `Đã bỏ ghim chủ đề`,
      timestamp: fmt(now.getHours(), now.getMinutes()), topicId: id,
    }]);
  };

  const handleMuteTopic = (topicId: string, mode: "select_tone" | "disable_sound" | "mute_duration" | "mute_forever" | "unmute") => {
    if (mode === "unmute") {
      setMutedTopics(prev => { const n = { ...prev }; delete n[topicId]; return n; });
      setMessages(prev => [...prev, {
        id: `sys-${Date.now()}`, type: "system" as const, sender: botUser,
        content: `🔔 Đã bật lại thông báo cho chủ đề này`,
        timestamp: fmt(now.getHours(), now.getMinutes()), topicId,
      }]);
    } else if (mode === "mute_duration") {
      setMuteDurationModal(topicId);
    } else {
      const label = mode === "select_tone" ? "Đã thay đổi âm báo" : mode === "disable_sound" ? "Đã tắt âm thanh" : "Đã tắt thông báo vĩnh viễn";
      setMutedTopics(prev => ({ ...prev, [topicId]: mode }));
      setMessages(prev => [...prev, {
        id: `sys-${Date.now()}`, type: "system" as const, sender: botUser,
        content: `🔕 ${label}`,
        timestamp: fmt(now.getHours(), now.getMinutes()), topicId,
      }]);
    }
  };

  const handleMuteDuration = (topicId: string, duration: string) => {
    setMutedTopics(prev => ({ ...prev, [topicId]: `mute_${duration}` }));
    setMuteDurationModal(null);
    setMessages(prev => [...prev, {
      id: `sys-${Date.now()}`, type: "system" as const, sender: botUser,
      content: `🔕 Đã tắt thông báo trong ${duration}`,
      timestamp: fmt(now.getHours(), now.getMinutes()), topicId,
    }]);
  };

  const handleCloseTopic = (id: string) => {
    const wasClosed = closedTopics.has(id);
    setClosedTopics(prev => {
      const n = new Set(prev);
      if (wasClosed) n.delete(id); else n.add(id);
      return n;
    });
    setMessages(prev => [...prev, {
      id: `sys-${Date.now()}`, type: "system" as const, sender: botUser,
      content: wasClosed ? `🔓 Chủ đề đã được mở lại` : `🔒 Chủ đề đã được đóng`,
      timestamp: fmt(now.getHours(), now.getMinutes()), topicId: id,
    }]);
  };

  const handleOpenNewWindow = (topicId: string) => {
    setOpenedNewWindow(topicId);
    setTimeout(() => setOpenedNewWindow(null), 2500);
  };

  const handleForwardMessage = (msgId: string, targetId: string, targetName: string) => {
    const originalMsg = messages.find(m => m.id === msgId);
    if (!originalMsg) return;
    const srcTopic = localTopics.find(t => t.id === originalMsg.topicId) ||
      allSpaces.flatMap(s => s.topics).find(t => t.id === originalMsg.topicId);
    const forwardedMsg: ChatMessage = {
      id: `fwd-${Date.now()}`,
      type: originalMsg.type,
      sender: minhUser,
      content: originalMsg.content,
      timestamp: fmt(now.getHours(), now.getMinutes()),
      topicId: targetId,
      reportData: originalMsg.reportData,
      imageUrl: originalMsg.imageUrl,
      imageCaption: originalMsg.imageCaption,
      fileName: originalMsg.fileName,
      fileSize: originalMsg.fileSize,
      fileType: originalMsg.fileType,
      forwarded: {
        fromTopicName: srcTopic?.name || originalMsg.sender.name,
        fromTopicEmoji: srcTopic?.emoji,
      },
    };
    setMessages(prev => [...prev, forwardedMsg]);
    toast.success(`Đã chuyển tiếp đến "${targetName}"`, {
      icon: <Share2 className="w-4 h-4 text-cyan-500" />, duration: 2000,
    });
  };

  const handleSendThreadReply = (content: string, parentId: string) => {
    const reply: ChatMessage = {
      id: `reply-${Date.now()}`, type: "text", sender: minhUser, content,
      timestamp: fmt(now.getHours(), now.getMinutes()), topicId: activeTopic, parentId,
    };
    setMessages(prev => {
      const updated = [...prev, reply];
      return updated.map(m => m.id === parentId ? { ...m, threadCount: (m.threadCount || 0) + 1 } : m);
    });
  };

  const handleTogglePin = (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    const wasPinned = msg?.pinned;
    setPinAnimatingIds(prev => new Set(prev).add(msgId));
    setTimeout(() => setPinAnimatingIds(prev => { const n = new Set(prev); n.delete(msgId); return n; }), 800);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, pinned: !m.pinned } : m));
    toast.success(wasPinned ? "Đã bỏ ghim tin nhắn" : "Đã ghim tin nhắn", {
      icon: wasPinned ? <PinOff className="w-4 h-4 text-gray-500" /> : <Pin className="w-4 h-4 text-cyan-500" />,
      duration: 2000,
    });
  };

  const toggleReaction = (msgId: string, emoji: string) => {
    const key = `${msgId}-${emoji}`;
    setAnimatingReactions(prev => new Set(prev).add(key));
    setTimeout(() => setAnimatingReactions(prev => { const n = new Set(prev); n.delete(key); return n; }), 600);
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const reactions = m.reactions || [];
      const existing = reactions.find(r => r.emoji === emoji);
      if (existing) {
        return { ...m, reactions: existing.reacted ? reactions.map(r => r.emoji === emoji ? { ...r, count: r.count - 1, reacted: false } : r).filter(r => r.count > 0) : reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, reacted: true } : r) };
      }
      return { ...m, reactions: [...reactions, { emoji, count: 1, reacted: true }] };
    }));
  };

  const handleApproval = (msgId: string, approved: boolean) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId || !m.approvalData) return m;
      return { ...m, approvalData: { ...m.approvalData, status: approved ? "approved" : "rejected" } };
    }));
  };

  const openEmojiPicker = (msgId: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setEmojiPickerState({ msgId, pos: { top: rect.bottom + 4, left: rect.left - 100 } });
  };

  const generateBotResponse = useCallback((input: string): ChatMessage | null => {
    const lower = input.toLowerCase().trim();
    if (lower.startsWith("/task ")) {
      const taskTitle = input.slice(6).replace(/@\w+/g, "").replace(/#\w+/g, "").replace(/!\w+/g, "").trim();
      return { id: `bot-${Date.now()}`, type: "bot_response", sender: botUser, content: `✅ **Task Created Successfully!**\n\n📋 **${taskTitle || "New Task"}**\n• Status: To Do\n• Priority: Normal\n• Space: ${space?.name || "General"}\n\nTask đã được thêm vào board. Dùng \`/assign\` để giao việc.`, timestamp: fmt(now.getHours(), now.getMinutes()), topicId: activeTopic };
    }
    if (lower.startsWith("/status ")) {
      const parts = lower.split(" "); const taskId = parts[1]; const newStatus = parts[2];
      const task = tasks.find(t => t.id === taskId);
      const statusLabel = newStatus === "done" ? "Done ✅" : newStatus === "in_progress" ? "In Progress 🔄" : newStatus === "in_review" ? "In Review 👀" : "To Do 📝";
      if (task && (newStatus === "done" || newStatus === "in_progress" || newStatus === "in_review" || newStatus === "todo")) {
        onStatusChange(taskId, newStatus as Task["status"]);
        return { id: `bot-${Date.now()}`, type: "task_update", sender: botUser, content: `🔄 **Status Updated** — "${task.title}" → **${statusLabel}**\n${newStatus === "done" ? "🎉 Great job!" : ""}`, timestamp: fmt(now.getHours(), now.getMinutes()), topicId: activeTopic };
      }
      return { id: `bot-${Date.now()}`, type: "bot_response", sender: botUser, content: `❌ Task "${taskId}" không tìm thấy hoặc status không hợp lệ.\n\nSử dụng: \`/status [task_id] [todo|in_progress|in_review|done]\``, timestamp: fmt(now.getHours(), now.getMinutes()), topicId: activeTopic };
    }
    if (lower.startsWith("/report")) {
      const done = tasks.filter(t => t.status === "done").length;
      return { id: `bot-${Date.now()}`, type: "command_result", sender: botUser, content: "", timestamp: fmt(now.getHours(), now.getMinutes()), topicId: activeTopic, reportData: { title: "📊 Current Sprint Report", items: [{ label: "Total Tasks", value: tasks.length, color: "#0891b2" }, { label: "Completed", value: done, color: "#059669" }, { label: "In Progress", value: tasks.filter(t => t.status === "in_progress").length, color: "#0891b2" }, { label: "To Do", value: tasks.filter(t => t.status === "todo").length, color: "#64748b" }, { label: "Overdue", value: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length, color: "#dc2626" }, { label: "Completion", value: `${tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0}%`, color: "#7c3aed" }] } };
    }
    if (lower.startsWith("/sprint")) {
      const done = tasks.filter(t => t.status === "done").length; const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
      return { id: `bot-${Date.now()}`, type: "bot_response", sender: botUser, content: `🏃 **Sprint 12 — Status**\n\n📅 Mar 10 – Mar 24, 2026\n📊 Progress: ${pct}% (${done}/${tasks.length} tasks)\n\n**By Status:**\n• 🟢 Done: ${done}\n• 🔵 In Progress: ${tasks.filter(t => t.status === "in_progress").length}\n• 🟡 In Review: ${tasks.filter(t => t.status === "in_review").length}\n• ⚪ To Do: ${tasks.filter(t => t.status === "todo").length}\n\n**Top Priority:**\n${tasks.filter(t => t.priority === "urgent" && t.status !== "done").map(t => `• 🔴 ${t.title}`).join("\n") || "• Không có task urgent pending"}`, timestamp: fmt(now.getHours(), now.getMinutes()), topicId: activeTopic };
    }
    if (lower === "/help") {
      return { id: `bot-${Date.now()}`, type: "bot_response", sender: botUser, content: `🤖 **VWork Bot Commands**\n\n${slashCommands.map(c => `\`${c.cmd}\` — ${c.desc}`).join("\n")}\n\n💡 **Mẹo:** Bạn cũng có thể chat bằng ngôn ngữ tự nhiên!`, timestamp: fmt(now.getHours(), now.getMinutes()), topicId: activeTopic };
    }
    if (lower.includes("overdue") || lower.includes("quá hạn") || lower.includes("trễ deadline")) {
      const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done");
      return { id: `bot-${Date.now()}`, type: "bot_response", sender: botUser, content: overdueTasks.length > 0 ? `⚠️ **${overdueTasks.length} tasks đã quá hạn:**\n\n${overdueTasks.map(t => `• **${t.title}**\n  Due: ${new Date(t.dueDate!).toLocaleDateString("vi-VN")} — Assigned: ${t.assignee?.name || "Unassigned"}`).join("\n\n")}` : "✅ Không có task nào bị overdue! Team đang làm tốt lắm 🎉", timestamp: fmt(now.getHours(), now.getMinutes()), topicId: activeTopic };
    }
    if (lower.includes("giao việc") || lower.includes("assign")) {
      return { id: `bot-${Date.now()}`, type: "bot_response", sender: botUser, content: `📝 **Để giao việc, sử dụng format:**\n\n\`/task [tên task] @[người nhận] #[tag] ![priority]\`\n\nVí dụ: \`/task Thiết kế trang login @Hương #design !high\``, timestamp: fmt(now.getHours(), now.getMinutes()), topicId: activeTopic };
    }
    if (lower.includes("tiến độ") || lower.includes("progress") || lower.includes("báo cáo")) {
      const done = tasks.filter(t => t.status === "done").length; const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
      return { id: `bot-${Date.now()}`, type: "bot_response", sender: botUser, content: `📊 **Tiến độ hiện tại:**\n\n🏃 Sprint 12: **${pct}%** hoàn thành\n✅ ${done}/${tasks.length} tasks done\n\n**Team Performance:**\n${teamMembers.map(m => { const mt = tasks.filter(t => t.assignee?.id === m.id); const md = mt.filter(t => t.status === "done").length; return `• ${m.name}: ${md}/${mt.length} tasks (${mt.length > 0 ? Math.round((md / mt.length) * 100) : 0}%)`; }).join("\n")}`, timestamp: fmt(now.getHours(), now.getMinutes()), topicId: activeTopic };
    }
    return null;
  }, [tasks, activeTopic, onStatusChange, space]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;

    // If editing an existing message
    if (editingMsgId) {
      setMessages(prev => prev.map(m => m.id === editingMsgId ? { ...m, content: inputValue.trim(), edited: true } : m));
      setEditingMsgId(null);
      setEditMsgContent("");
      setInputValue("");
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`, type: "text", sender: minhUser, content: inputValue.trim(),
      timestamp: fmt(now.getHours(), now.getMinutes()), topicId: activeTopic,
      replyToId: replyingTo?.id || undefined,
      chatTopicId: (isPersonalChat && activeChatTopicId !== "all") ? activeChatTopicId : undefined,
    };
    setMessages(prev => [...prev, userMsg]);
    const botResponse = generateBotResponse(inputValue.trim());
    if (botResponse) {
      setTypingUsers([{ id: "bot", name: "VWork Bot" }]);
      setTimeout(() => { setTypingUsers([]); setMessages(prev => [...prev, botResponse]); }, 1200);
    }
    setInputValue(""); setShowCommands(false); setShowMentionPicker(false); setReplyingTo(null);
  }, [inputValue, activeTopic, generateBotResponse, replyingTo, editingMsgId]);

  // ── Personal chat topic handlers ──
  const currentChatTopics = useMemo(() =>
    chatTopicsMap[selectedPersonalChat || ""] || [],
    [chatTopicsMap, selectedPersonalChat]
  );

  const handleCreateChatTopic = useCallback((chatId: string, name: string, emoji: string, color: string) => {
    const newTopic = { id: `ct-${Date.now()}`, name, emoji, color };
    setChatTopicsMap(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newTopic],
    }));
    toast.success(`Đã tạo chủ đề "${name}"`, { duration: 2000 });
  }, []);

  const handleDeleteChatTopic = useCallback((chatId: string, topicId: string) => {
    setChatTopicsMap(prev => ({
      ...prev,
      [chatId]: (prev[chatId] || []).filter(t => t.id !== topicId),
    }));
    setActiveChatTopicId(prev => prev === topicId ? "all" : prev);
    setMessages(prev => prev.map(m => m.chatTopicId === topicId ? { ...m, chatTopicId: undefined } : m));
    toast("Đã xóa chủ đề", { duration: 2000 });
  }, []);

  const handleTagMessageTopic = useCallback((msgId: string, topicId: string) => {
    if (isPersonalChat) {
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, chatTopicId: topicId || undefined } : m
      ));
      const topic = currentChatTopics.find(t => t.id === topicId);
      if (topic) toast.success(`Đã gắn vào chủ đề "${topic.name}"`, { duration: 2000 });
      else toast("Đã bỏ chủ đề", { duration: 1500 });
    } else {
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, topicId: topicId || undefined } : m
      ));
      const topic = localTopics.find(t => t.id === topicId);
      if (topic) toast.success(`Đã gắn vào chủ đề "${topic.name}"`, { duration: 2000 });
      else toast("Đã bỏ chủ đề", { duration: 1500 });
    }
    setTagTopicModalMsg(null);
  }, [isPersonalChat, currentChatTopics, localTopics]);

  const handleCreatePoll = useCallback((question: string, options: string[], multipleChoice: boolean, anonymous: boolean) => {
    const now2 = new Date();
    const pollMsg: ChatMessage = {
      id: `msg-poll-${Date.now()}`,
      type: "poll",
      sender: minhUser,
      content: question,
      timestamp: fmt(now2.getHours(), now2.getMinutes()),
      topicId: activeTopic,
      chatTopicId: (isPersonalChat && activeChatTopicId !== "all") ? activeChatTopicId : undefined,
      pollData: {
        question,
        options: options.map((text, i) => ({ id: `opt-${i}`, text, voterIds: [] })),
        multipleChoice,
        anonymous,
        closed: false,
      },
    };
    setMessages(prev => [...prev, pollMsg]);
    toast.success("Đã tạo bình chọn!", { duration: 2000 });
  }, [activeTopic]);

  const handleVotePoll = useCallback((msgId: string, optionId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId || !m.pollData || m.pollData.closed) return m;
      const myId = minhUser.id;
      const isMulti = m.pollData.multipleChoice;
      return {
        ...m,
        pollData: {
          ...m.pollData,
          options: m.pollData.options.map(opt => {
            if (opt.id === optionId) {
              // Toggle vote on this option
              const alreadyVoted = opt.voterIds.includes(myId);
              return { ...opt, voterIds: alreadyVoted ? opt.voterIds.filter(id => id !== myId) : [...opt.voterIds, myId] };
            }
            // If single choice, remove vote from other options
            if (!isMulti) {
              return { ...opt, voterIds: opt.voterIds.filter(id => id !== myId) };
            }
            return opt;
          }),
        },
      };
    }));
  }, []);

  const handleClosePoll = useCallback((msgId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === msgId && m.pollData ? { ...m, pollData: { ...m.pollData, closed: true } } : m
    ));
    toast("Đã đóng bình chọn", { duration: 2000 });
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") { 
      if (editingMsgId) { cancelEditMessage(); } 
      else { setReplyingTo(null); } 
      setShowCommands(false); setShowMentionPicker(false); setShowAttachMenu(false);
    }
  };

  const insertCommand = (cmd: string) => {
    setInputValue(cmd + " "); setShowCommands(false); inputRef.current?.focus();
  };

  const handleMicToggle = () => {
    if (isRecording) {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      const duration = recordingSeconds;
      setRecordingSeconds(0);
      const n = new Date();
      const newMsg: ChatMessage = {
        id: `voice-${Date.now()}`,
        type: "voice",
        sender: minhUser,
        content: "",
        timestamp: fmt(n.getHours(), n.getMinutes()),
        topicId: activeTopic,
        voiceDuration: duration,
        voiceWaveform: Array.from({ length: 20 }, () => Math.random()),
      };
      setMessages((prev: ChatMessage[]) => [...prev, newMsg]);
      toast.success(`Đã gửi tin nhắn thoại (${duration}s)`);
    } else {
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((s: number) => s + 1), 1000);
    }
  };

  if (selectedSpace === "sp-personal" && !selectedPersonalChat) {
    return <div className="flex-1 bg-gray-50/30" />;
  }

  if (!space && !isPersonalChat) {
    const isPersonalSpace = selectedSpace === "sp-personal";
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50/50">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 flex items-center justify-center mx-auto mb-5 border border-cyan-100">
            <MessageSquare className="w-9 h-9 text-cyan-500" />
          </div>
          {isPersonalSpace ? (
            <>
              <h2 className="text-gray-800 tracking-tight mb-2">Tin nhắn & Ghi chú cá nhân</h2>
              <p className="text-[13px] text-gray-500 leading-relaxed">Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu.</p>
            </>
          ) : (
            <>
              <h2 className="text-gray-800 tracking-tight mb-2">Chào mừng đến VWork Chat</h2>
              <p className="text-[13px] text-gray-500 leading-relaxed">Chọn một dự án từ sidebar để bắt đầu trao đổi công việc. Mỗi dự án có các kênh thảo luận riêng theo chủ đề.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const renderNoteContent = (msgId: string, content: string) => {
    if (!content) return null;
    const lines = content.split("\n");
    const hasChecklist = lines.some(l => /^- \[[ x]\] /i.test(l));
    if (!hasChecklist) {
      return <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>;
    }
    return (
      <div className="space-y-1.5">
        {lines.map((line, i) => {
          const unchecked = line.match(/^- \[ \] (.+)/);
          const checked = line.match(/^- \[x\] (.+)/i);
          if (unchecked || checked) {
            const isChecked = !!checked;
            const label = (unchecked || checked)![1];
            return (
              <div key={i} className="flex items-start gap-2 cursor-pointer group/item"
                onClick={() => {
                  setMessages(prev => prev.map(m => {
                    if (m.id !== msgId) return m;
                    const newLines = m.content.split("\n");
                    newLines[i] = isChecked ? `- [ ] ${label}` : `- [x] ${label}`;
                    return { ...m, content: newLines.join("\n") };
                  }));
                }}>
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${isChecked ? "bg-cyan-500 border-cyan-500" : "border-gray-300 group-hover/item:border-cyan-400"}`}>
                  {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className={`text-[13px] leading-snug select-none ${isChecked ? "line-through text-gray-400" : "text-gray-700"}`}>{label}</span>
              </div>
            );
          }
          if (line.trim() === "") return <div key={i} className="h-1" />;
          return <p key={i} className="text-[13px] text-gray-700 whitespace-pre-wrap leading-snug">{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-gray-50/50">
      {/* Topics sidebar */}
      {showTopicList && localTopics.length > 0 && (
        <div className="hidden md:flex w-[230px] bg-white border-r border-gray-200 flex-col shrink-0">
          <div className="px-3 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[12px] text-gray-700 font-medium uppercase tracking-wider">Chủ đề</h3>
              <button onClick={() => setShowNewTopicModal(true)}
                className="w-6 h-6 rounded-md hover:bg-cyan-50 flex items-center justify-center text-gray-400 hover:text-cyan-600 transition-all" title="Tạo chủ đề mới">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1.5">
              <Search className="w-3 h-3 text-gray-400 shrink-0" />
              <input value={topicSearchQuery} onChange={e => setTopicSearchQuery(e.target.value)} placeholder="Tìm chủ đề..."
                className="flex-1 text-[11px] bg-transparent focus:outline-none text-gray-700 placeholder-gray-400" />
              {topicSearchQuery && (
                <button onClick={() => setTopicSearchQuery("")} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-1.5 px-1.5">
            {filteredTopics.length === 0 && (
              <div className="text-center py-8">
                <Search className="w-5 h-5 text-gray-200 mx-auto mb-2" />
                <p className="text-[11px] text-gray-500">Không tìm thấy chủ đề</p>
              </div>
            )}
            {filteredTopics.map(topic => {
              const isActive = activeTopic === topic.id;
              const lastMsg = messages.filter(m => m.topicId === topic.id && !m.parentId).slice(-1)[0];
              const isMuted = !!mutedTopics[topic.id];
              const isClosed = closedTopics.has(topic.id);
              return (
                <div
                  key={topic.id}
                  className={`group/topic w-full flex items-center gap-2.5 px-3 py-[8px] rounded-lg text-[12px] transition-all mb-0.5 cursor-pointer ${
                    isActive ? "bg-cyan-50 text-cyan-700"
                    : isClosed ? "text-gray-400 hover:bg-gray-50 hover:text-gray-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                  }`}
                  onClick={() => { setActiveTopic(topic.id); setActiveThread(null); setShowPinnedPanel(false); }}
                  onContextMenu={e => { e.preventDefault(); setTopicContextMenu({ topic, pos: { x: e.clientX, y: e.clientY } }); }}
                >
                  <div className="relative shrink-0">
                    {topic.emoji && <span className={`text-[14px] ${isClosed ? "opacity-50" : ""}`}>{topic.emoji}</span>}
                    {topic.agentId && topic.agentStatus && !isClosed && (
                      <span className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white ${
                        topic.agentStatus === "online" ? "bg-emerald-500" :
                        topic.agentStatus === "idle" ? "bg-amber-400" :
                        "bg-gray-300"
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-1">
                      <span className={`truncate ${isClosed ? "line-through opacity-60" : ""}`}>{topic.name}</span>
                      {isClosed && <Archive className="w-3 h-3 text-gray-300 shrink-0" />}
                    </div>
                    {lastMsg && !isClosed && (
                      <span className="text-[10px] text-gray-500 truncate block mt-0.5">
                        {lastMsg.sender.name.split(" ").pop()}: {lastMsg.content?.slice(0, 30) || "📊 Report"}
                        {(lastMsg.content?.length || 0) > 30 ? "..." : ""}
                      </span>
                    )}
                    {isClosed && (
                      <span className="text-[10px] text-gray-300 block mt-0.5">Đã đóng</span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <div className="flex items-center gap-0.5">
                      {isMuted && <BellOff className="w-3 h-3 text-gray-300" />}
                      {topic.pinned && <Pin className="w-2.5 h-2.5 text-cyan-400" />}
                    </div>
                    {topic.unread && topic.unread > 0 && !isActive && !isMuted && (
                      <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-cyan-500 text-white text-[9px] flex items-center justify-center">{topic.unread}</span>
                    )}
                    {topic.unread && topic.unread > 0 && !isActive && isMuted && (
                      <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-gray-300 text-white text-[9px] flex items-center justify-center">{topic.unread}</span>
                    )}
                    {/* Context menu hover button */}
                    <button
                      onClick={e => { e.stopPropagation(); setTopicContextMenu({ topic, pos: { x: e.clientX, y: e.clientY } }); }}
                      className="w-5 h-5 rounded-md hover:bg-gray-200/60 flex items-center justify-center text-gray-300 hover:text-gray-500 opacity-0 group-hover/topic:opacity-100 transition-all"
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Personal chat topics sidebar (left) */}
      {showTopicsDrawer && isPersonalChat && !activeThread && (
        <div className="hidden md:flex shrink-0">
          <ChatTopicsDrawer
            chatId={selectedPersonalChat!}
            topics={currentChatTopics}
            activeTopicId={activeChatTopicId}
            onSelectTopic={(id) => { setActiveChatTopicId(id); }}
            onClose={() => setShowTopicsDrawer(false)}
            onCreateTopic={handleCreateChatTopic}
            onDeleteTopic={handleDeleteChatTopic}
            messages={topicMessages}
          />
        </div>
      )}

      {/* Main chat area */}
      <div className={`flex-1 flex flex-col min-w-0 ${isPersonalTool ? "bg-[#f7f6f3]" : "bg-[#E8F4F8]"}`}>
        {/* Chat header */}
        <div className="h-[48px] bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0 relative">
          {/* Selection mode header — Telegram style */}
          {selectionMode && (
            <div className="absolute inset-0 bg-cyan-50 border-b border-cyan-200 flex items-center px-4 gap-3 z-10"
              style={{ animation: "fadeInScale 0.15s ease" }}>
              <button onClick={exitSelectionMode}
                className="w-8 h-8 rounded-full hover:bg-cyan-100 flex items-center justify-center text-cyan-600 transition-all shrink-0">
                <X className="w-4 h-4" />
              </button>
              <span className="text-[13px] font-medium text-cyan-800 flex-1">
                {selectedMsgIds.size} tin nhắn đã chọn
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => {
                  const selected = messages.filter(m => selectedMsgIds.has(m.id));
                  const text = selected.map(m => `${m.sender.name}: ${m.content || m.reportData?.title || ""}`).join("\n");
                  copyToClipboard(text);
                  exitSelectionMode();
                }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-cyan-700 hover:bg-cyan-100 rounded-lg transition-all"
                  title="Sao chép">
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sao chép</span>
                </button>
                <button onClick={() => {
                  const firstSelected = messages.find(m => selectedMsgIds.has(m.id));
                  if (firstSelected) setForwardingMsg(firstSelected);
                  exitSelectionMode();
                }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-cyan-700 hover:bg-cyan-100 rounded-lg transition-all"
                  title="Chuyển tiếp">
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Chuyển tiếp</span>
                </button>
                <button onClick={deleteSelectedMessages}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Xoá">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Xoá</span>
                </button>
              </div>
            </div>
          )}
          {/* Channel chat icon */}
          {isChannelChat && activeChannelItem && (
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-[16px] shrink-0">
              {activeChannelItem.icon}
            </div>
          )}
          {/* Personal chat avatar */}
          {isPersonalChat && (() => {
            if (isGroupChat && activeGroupChat) {
              return <MosaicAvatar members={activeGroupChat.members || []} color={activeGroupChat.color} size={32} />;
            }
            const pcItem = allPersonalItems.find(p => p.id === selectedPersonalChat);
            if (!pcItem) return null;
            if (pcItem.type === "dm") {
              return (
                <button className="relative shrink-0 cursor-pointer" onClick={() => setProfileUser({ id: pcItem.id, name: pcItem.name, color: pcItem.color })}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] text-white" style={{ backgroundColor: pcItem.color }}>
                    {pcItem.icon}
                  </div>
                  {pcItem.online !== undefined && (
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${pcItem.online ? "bg-emerald-500" : "bg-gray-300"}`} />
                  )}
                </button>
              );
            }
            return null;
          })()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {isChannelChat && activeChannelItem ? (
                <p className="text-[13px] text-gray-800 truncate">{activeChannelItem.name}</p>
              ) : isPersonalChat ? (() => {
                if (isGroupChat && activeGroupChat) {
                  return <p className="text-[13px] text-gray-800 truncate">{activeGroupChat.name}</p>;
                }
                const pcItem = allPersonalItems.find(p => p.id === selectedPersonalChat);
                if (pcItem?.type === "dm") {
                  return (
                    <button onClick={() => setProfileUser({ id: pcItem.id, name: pcItem.name, color: pcItem.color })} className="text-[13px] font-medium text-gray-800 truncate hover:underline text-left">
                      {pcItem.name}
                    </button>
                  );
                }
                return (
                  <>
                    {pcItem?.type === "tool" && <span className="text-[15px]">{pcItem?.emoji}</span>}
                    <p className="text-[13px] text-gray-800 truncate">{pcItem?.name || "Chat"}</p>
                  </>
                );
              })() : (
                <>
                  {currentTopic?.emoji && <span className="text-[15px]">{currentTopic.emoji}</span>}
                  <p className="text-[13px] text-gray-800 truncate">{currentTopic?.name || "General"}</p>
                </>
              )}
              {isChannelChat && !canPostInChannel && (
                <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full border border-gray-200 flex items-center gap-0.5 shrink-0">
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  Chỉ đọc
                </span>
              )}
              {pinnedMessages.length > 0 && (
                <span className="text-[9px] bg-cyan-50 text-cyan-600 px-1.5 py-0.5 rounded-full border border-cyan-100">📌 {pinnedMessages.length}</span>
              )}
              {!isPersonalChat && scheduledMessages.filter(s => s.topicId === activeTopic).length > 0 && (
                <span className="text-[9px] bg-violet-50 text-violet-500 px-1.5 py-0.5 rounded-full border border-violet-100 flex items-center gap-0.5">
                  <CalendarClock className="w-2.5 h-2.5" />{scheduledMessages.filter(s => s.topicId === activeTopic).length}
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-500 truncate">
              {isRecording ? (
                <span className="text-red-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                  Đang ghi âm...
                </span>
              ) : typingUsers.length > 0 ? (
                <span className="text-cyan-500">
                  {typingUsers.length === 1
                    ? `${typingUsers[0].name.split(" ").pop()} đang nhập...`
                    : `${typingUsers.length} người đang nhập...`}
                </span>
              ) : isChannelChat && activeChannelItem ? (
                <span>{activeChannelItem.members} thành viên · {activeChannelItem.description}</span>
              ) : isPersonalChat ? (() => {
                if (isGroupChat && activeGroupChat) {
                  return <span>{activeGroupChat.members?.length || 0} thành viên · {activeGroupChat.members?.join(", ")}</span>;
                }
                const pcItem = allPersonalItems.find(p => p.id === selectedPersonalChat);
                if (pcItem?.type === "dm") {
                  return (
                    <span className="inline-flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${pcItem.online ? "bg-green-400" : "bg-gray-300"}`} />
                      <span className={pcItem.online ? "text-green-600" : "text-gray-400"}>{pcItem.online ? "Đang hoạt động" : "Ngoại tuyến"}</span>
                    </span>
                  );
                }
                return <span>{pcItem?.description || ""}</span>;
              })() : (
                <>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                    <span className="text-green-600">{Object.values(userOnlineStatus).filter(s => s === "online").length} online</span>
                  </span>
                  <span className="mx-1.5 text-gray-300">·</span>
                  {currentTopic?.description || `${topicMessages.length} tin nhắn`}
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {isChannelChat && activeChannelItem?.ownerId === currentUserId && (
              <button
                onClick={() => { setShowChannelManage(!showChannelManage); setShowChatInfo(false); setShowPinnedPanel(false); setActiveThread(null); }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${showChannelManage ? "bg-indigo-50 text-indigo-600" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}
                title="Quản lý thành viên kênh">
                <Users className="w-3.5 h-3.5" />
              </button>
            )}
            {!isPersonalTool && (
              <>
                <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"><Phone className="w-3.5 h-3.5" /></button>
                <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"><Video className="w-3.5 h-3.5" /></button>
              </>
            )}
            <button onClick={() => { setShowPinnedPanel(!showPinnedPanel); setActiveThread(null); setShowTopicsDrawer(false); }}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${showPinnedPanel ? "bg-cyan-50 text-cyan-600" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`} title="Tin nhắn đã ghim">
              <Pin className="w-3.5 h-3.5" />
            </button>
            {isPersonalChat && (
              <button onClick={() => { setShowTopicsDrawer(!showTopicsDrawer); setShowPinnedPanel(false); setActiveThread(null); setShowChatInfo(false); }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all relative ${showTopicsDrawer ? "bg-indigo-50 text-indigo-600" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}
                title="Chủ đề">
                <Hash className="w-3.5 h-3.5" />
                {currentChatTopics.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-indigo-500 text-white text-[8px] flex items-center justify-center leading-none">{currentChatTopics.length}</span>
                )}
              </button>
            )}
            {!isPersonalChat && !isChannelChat && localTopics.length > 0 && (
              <button onClick={() => setShowTopicList(!showTopicList)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all relative ${showTopicList ? "bg-indigo-50 text-indigo-600" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}
                title={showTopicList ? "Ẩn danh sách chủ đề" : "Hiện danh sách chủ đề"}>
                <Hash className="w-3.5 h-3.5" />
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-indigo-500 text-white text-[8px] flex items-center justify-center leading-none">{localTopics.length}</span>
              </button>
            )}
            <button onClick={() => { setChatSearchOpen(!chatSearchOpen); setChatSearchQuery(""); }}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${chatSearchOpen ? "bg-cyan-50 text-cyan-600" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}><Search className="w-3.5 h-3.5" /></button>
            {!isPersonalTool && (
              <button onClick={() => setNotificationSound(!notificationSound)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${!notificationSound ? "bg-red-50 text-red-400" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}
                title={notificationSound ? "Tắt âm thông báo" : "Bật âm thông báo"}>
                {notificationSound ? <Volume1 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            )}
            {isPersonalTool ? (
              <button onClick={() => { setShowNotesInfo(!showNotesInfo); setActiveThread(null); setShowPinnedPanel(false); }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${showNotesInfo ? "bg-cyan-50 text-cyan-600" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`} title="Thông tin ghi chú">
                <Info className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button onClick={() => { setShowChatInfo(!showChatInfo); setActiveThread(null); setShowPinnedPanel(false); }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${showChatInfo ? "bg-cyan-50 text-cyan-600" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`} title="Thông tin">
                <Info className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Chat search bar */}
        {chatSearchOpen && (
          <div className="px-4 py-2 bg-white border-b border-gray-200 flex items-center gap-2 shrink-0">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              value={chatSearchQuery}
              onChange={e => { setChatSearchQuery(e.target.value); setSearchResultIdx(0); }}
              onKeyDown={e => { if (e.key === "Enter") navigateSearchResult(e.shiftKey ? "prev" : "next"); }}
              placeholder="Tìm kiếm tin nhắn trong chủ đề này..."
              className="flex-1 text-[12px] text-gray-700 placeholder-gray-400 outline-none bg-transparent"
              autoFocus
            />
            {chatSearchQuery && chatSearchResults.length > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] text-gray-500">{searchResultIdx + 1}/{chatSearchResults.length}</span>
                <button onClick={() => navigateSearchResult("prev")}
                  className="w-5 h-5 rounded hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
                  <ChevronDown className="w-3 h-3 rotate-180" />
                </button>
                <button onClick={() => navigateSearchResult("next")}
                  className="w-5 h-5 rounded hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            )}
            {chatSearchQuery && chatSearchResults.length === 0 && (
              <span className="text-[10px] text-gray-500 shrink-0">Không tìm thấy</span>
            )}
            <button onClick={() => { setChatSearchOpen(false); setChatSearchQuery(""); setHighlightedMsgId(null); }}
              className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-gray-600">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Pinned message bar (Telegram style) */}
        {pinnedMessages.length > 0 && !chatSearchOpen && (
          <div className="w-full px-3 py-1.5 bg-white/95 border-b border-gray-100 flex items-center gap-2 shrink-0 backdrop-blur-sm">
            <div className="w-[3px] self-stretch rounded-full bg-cyan-400 shrink-0" />
            <button
              onClick={() => { setShowPinnedPanel(true); setActiveThread(null); }}
              className="flex-1 min-w-0 text-left hover:opacity-80 transition-all"
            >
              <p className="text-[9px] text-cyan-600 font-medium">
                📌 Tin nhắn đã ghim {pinnedMessages.length > 1 ? `(${pinnedBannerIdx + 1}/${pinnedMessages.length})` : ""}
              </p>
              <p className="text-[11px] text-gray-700 truncate mt-0.5">
                {pinnedMessages[pinnedBannerIdx]?.content?.slice(0, 80) ||
                  pinnedMessages[pinnedBannerIdx]?.pollData?.question ||
                  pinnedMessages[pinnedBannerIdx]?.reportData?.title || "Tin nhắn đã ghim"}
              </p>
            </button>
            {pinnedMessages.length > 1 && (
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => setPinnedBannerIdx(i => (i - 1 + pinnedMessages.length) % pinnedMessages.length)}
                  className="w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setPinnedBannerIdx(i => (i + 1) % pinnedMessages.length)}
                  className="w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <button onClick={() => handleTogglePin(pinnedMessages[pinnedBannerIdx].id)}
              className="w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-all shrink-0" title="Bỏ ghim">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Active chat topic filter bar */}
        {isPersonalChat && activeChatTopicId !== "all" && (() => {
          const t = currentChatTopics.find(tp => tp.id === activeChatTopicId);
          if (!t) return null;
          return (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50/80 border-b border-indigo-100 shrink-0">
              <Hash className="w-3 h-3 text-indigo-400 shrink-0" />
              <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: t.color }}>
                {t.emoji} {t.name}
              </span>
              <span className="text-[10px] text-gray-400">· {topicMessages.length} tin nhắn</span>
              <button onClick={() => setActiveChatTopicId("all")}
                className="ml-auto flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-all">
                <X className="w-3 h-3" /> Bỏ lọc
              </button>
            </div>
          );
        })()}

        {/* Messages - Telegram bubble layout */}
        <div ref={scrollContainerRef} onScroll={handleScroll}
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          className={`flex-1 overflow-y-auto ${isPersonalTool ? "bg-[#f7f6f3]" : "chat-bg-pattern"} chat-scroll-container relative`}>
          {/* Drag & drop overlay */}
          {isDragOver && (
            <div className="absolute inset-0 z-30 bg-cyan-50/80 backdrop-blur-sm border-2 border-dashed border-cyan-400 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Download className="w-10 h-10 text-cyan-500 mx-auto mb-2" />
                <p className="text-[14px] text-cyan-700">Thả file để gửi</p>
                <p className="text-[11px] text-cyan-500 mt-0.5">Ảnh, tài liệu, hoặc file bất kỳ</p>
              </div>
            </div>
          )}
          <div className="px-4 py-4">
          {topicMessages.length === 0 && (
            isPersonalTool ? (
              <div className="flex flex-col items-center justify-center h-full text-center min-h-[400px] gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-amber-100 shadow-sm">
                  <span className="text-3xl">{isPcSaved ? "🔖" : "📝"}</span>
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-gray-700 mb-1.5">{isPcSaved ? "Chưa có tin nhắn nào được lưu" : "Ghi chú của bạn"}</h3>
                  <p className="text-[12px] text-gray-500 max-w-xs leading-relaxed">
                    {isPcSaved
                      ? <>Nhấn giữ hoặc chuột phải vào tin nhắn bất kỳ<br />rồi chọn <strong>Lưu tin nhắn</strong> để lưu vào đây.</>
                      : <>Lưu ý tưởng, việc cần làm và những điều quan trọng.<br />Chỉ bạn mới xem được ghi chú này.</>
                    }
                  </p>
                </div>
                <div className="flex gap-2">
                  {[
                    { icon: <FileText className="w-3.5 h-3.5" />, label: "Văn bản" },
                    { icon: <ListChecks className="w-3.5 h-3.5" />, label: "Checklist" },
                    { icon: <ImageIcon className="w-3.5 h-3.5" />, label: "Hình ảnh" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-100 shadow-sm text-gray-400">
                      {item.icon}
                      <span className="text-[11px]">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center min-h-[400px]">
                <div className="w-16 h-16 rounded-2xl bg-white/80 flex items-center justify-center mb-4 border border-cyan-100 shadow-sm">
                  {currentTopic?.emoji ? <span className="text-2xl">{currentTopic.emoji}</span> : <MessageSquare className="w-7 h-7 text-cyan-500" />}
                </div>
                <h3 className="text-gray-700 mb-1.5 tracking-tight">Chủ đề: {currentTopic?.name || "General"}</h3>
                <p className="text-[12px] text-gray-500 max-w-sm leading-relaxed">
                  Bắt đầu cuộc trò chuyện trong chủ đề này. Gõ <code className="bg-white/80 px-1.5 py-0.5 rounded text-cyan-600">/help</code> để xem commands.
                </p>
              </div>
            )
          )}

          {/* Date separator */}
          {topicMessages.length > 0 && (
            <div className="flex justify-center mb-4 sticky top-2 z-10">
              <span className="bg-[#4E6E78]/70 text-white text-[11px] px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
                Hôm nay, 17 tháng 3
              </span>
            </div>
          )}

          {topicMessages.map((msg, idx) => {
            const prevMsg = topicMessages[idx - 1];
            const nextMsg = topicMessages[idx + 1];
            const isOwn = msg.sender.id === minhUser.id && !msg.sender.isBot;
            const showSenderName = !prevMsg || prevMsg.sender.id !== msg.sender.id || prevMsg.type === "system";
            const isLastInGroup = !nextMsg || nextMsg.sender.id !== msg.sender.id || nextMsg.type === "system";
            const replyParent = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null;

            // Unread separator: show after lastReadMsgId
            const showUnreadSep = lastReadMsgId && prevMsg?.id === lastReadMsgId && msg.id !== lastReadMsgId;

            // Time gap separator (> 1 hour gap based on timestamp)
            const showTimeGap = prevMsg && (() => {
              const prevH = parseInt(prevMsg.timestamp.split(":")[0]);
              const currH = parseInt(msg.timestamp.split(":")[0]);
              return currH - prevH >= 2;
            })();

            // Read status simulation
            const getReadStatus = () => {
              if (idx < topicMessages.length - 2) return "read";
              if (idx < topicMessages.length - 1) return "delivered";
              return "sent";
            };

            const unreadDivider = showUnreadSep ? (
              <div key={`unread-${msg.id}`} className="flex items-center gap-3 my-3" style={{ animation: "fadeInScale 0.3s ease" }}>
                <div className="h-px flex-1 bg-cyan-400/40" />
                <span className="text-[10px] text-cyan-600 shrink-0 px-3 py-0.5 bg-cyan-50 rounded-full border border-cyan-200/50 shadow-sm">
                  Tin nhắn chưa đọc
                </span>
                <div className="h-px flex-1 bg-cyan-400/40" />
              </div>
            ) : null;

            const timeGapDivider = showTimeGap ? (
              <div key={`time-${msg.id}`} className="flex justify-center my-3">
                <span className="bg-[#4E6E78]/50 text-white text-[10px] px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  {msg.timestamp}
                </span>
              </div>
            ) : null;

            if (msg.type === "system" || msg.type === "task_update") {
              return (
                <React.Fragment key={msg.id}>
                  {timeGapDivider}
                  {unreadDivider}
                  <div className="flex justify-center my-2">
                    <span className="bg-[#4E6E78]/60 text-white text-[11px] px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                      <Zap className="w-3 h-3" />{msg.content}
                    </span>
                  </div>
                </React.Fragment>
              );
            }

            if (msg.type === "announcement_card" && msg.announcementData) {
              const ann = msg.announcementData;
              const badgeColors: Record<string, string> = {
                "Khẩn cấp": "bg-red-100 text-red-600",
                "Quan trọng": "bg-orange-100 text-orange-600",
                "Thông báo": "bg-blue-100 text-blue-600",
                "Sự kiện": "bg-purple-100 text-purple-600",
                "Cập nhật": "bg-green-100 text-green-600",
              };
              const badgeCls = badgeColors[ann.badge] || "bg-gray-100 text-gray-600";
              return (
                <React.Fragment key={msg.id}>
                  {timeGapDivider}
                  {unreadDivider}
                  <div className={`flex ${isOwn ? "justify-end" : "justify-start"} ${showSenderName ? "mt-3" : "mt-[3px]"}`}>
                    {!isOwn && (
                      <div className="w-8 shrink-0 self-end mr-1.5">
                        {isLastInGroup && (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] text-white shadow-sm" style={{ backgroundColor: msg.sender.color }}>{msg.sender.name.charAt(0)}</div>
                        )}
                      </div>
                    )}
                    <div className="max-w-[340px] min-w-[220px]">
                      {!isOwn && showSenderName && (
                        <p className="text-[12px] mb-0.5 ml-1" style={{ color: msg.sender.color }}>{msg.sender.name}</p>
                      )}
                      <div className="bg-white rounded-2xl rounded-bl-[4px] shadow-[0_1px_4px_rgba(0,0,0,0.10)] overflow-hidden border border-amber-100">
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2 flex items-center gap-2 border-b border-amber-100">
                          <Megaphone className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">Thông báo chính thức</span>
                          <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${badgeCls}`}>{ann.badge}</span>
                        </div>
                        <div className="px-3 py-2.5">
                          <div className="flex items-start gap-2 mb-1.5">
                            <span className="text-[22px] shrink-0 leading-tight">{ann.emoji}</span>
                            <p className="text-[13px] font-bold text-gray-900 leading-snug">{ann.title}</p>
                          </div>
                          {ann.category && (
                            <span className="inline-block text-[10px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 mb-1.5">{ann.category}</span>
                          )}
                          {ann.description && (
                            <p className="text-[12px] text-gray-600 leading-relaxed line-clamp-3">{ann.description}</p>
                          )}
                          {ann.stats.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {ann.stats.map((s, i) => (
                                <div key={i} className="bg-amber-50 rounded-lg px-2 py-1 text-center">
                                  <p className="text-[13px] font-bold text-amber-700">{s.value}</p>
                                  <p className="text-[9px] text-amber-500">{s.label}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100">
                            <span className="text-[10px] text-gray-400">Đăng bởi {msg.sender.name}</span>
                            <span className="text-[10px] text-gray-400">{msg.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            }

            if (isPersonalTool) {
              const msgContent = (
                <div className="p-3.5 pb-2">
                  {(msg.type === "text" || msg.type === "bot_response") && (isPcSaved
                    ? <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    : renderNoteContent(msg.id, msg.content || "")
                  )}
                  {msg.type === "image" && (
                    <div className="rounded-lg overflow-hidden cursor-pointer" onClick={() => openLightbox(msg.imageUrl || "")}>
                      <img src={msg.imageUrl} className="w-full object-cover max-h-56" alt={msg.imageCaption || ""} />
                      {msg.imageCaption && <p className="text-[11px] text-gray-600 px-1 pt-1.5">{msg.imageCaption}</p>}
                    </div>
                  )}
                  {msg.type === "file" && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                        <FileIcon className="w-4 h-4 text-violet-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-gray-800 truncate">{msg.fileName}</p>
                        <p className="text-[10px] text-gray-400">{msg.fileSize}</p>
                      </div>
                    </div>
                  )}
                  {msg.type === "voice" && (
                    <div className="flex items-center gap-2.5">
                      <button className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center shrink-0 hover:bg-cyan-600 transition-all">
                        <Play className="w-3.5 h-3.5 text-white" />
                      </button>
                      <div className="flex-1 flex items-center gap-0.5 h-6">
                        {(msg.voiceWaveform || []).map((h: number, wi: number) => (
                          <div key={wi} className="w-0.5 rounded-full bg-cyan-400/70" style={{ height: `${Math.max(3, h * 22)}px` }} />
                        ))}
                      </div>
                      <span className="text-[11px] text-gray-400 shrink-0">{msg.voiceDuration}s</span>
                    </div>
                  )}
                </div>
              );

              return (
                <React.Fragment key={msg.id}>
                  {timeGapDivider}
                  <div
                    id={`msg-${msg.id}`}
                    className={`group relative bg-white rounded-xl border shadow-sm mb-2.5 transition-all hover:shadow-md ${msg.pinned && !isPcSaved ? "border-amber-200 shadow-amber-50" : "border-gray-100"} ${pinAnimatingIds.has(msg.id) ? "animate-pin-glow" : ""} ${highlightedMsgId === msg.id ? "animate-[highlightPulse_2s_ease]" : ""}`}
                    onContextMenu={(e) => { e.preventDefault(); setMsgContextMenu({ msg, pos: { x: e.clientX, y: e.clientY } }); }}
                  >
                    {/* Saved message: sender context header */}
                    {isPcSaved && (
                      <div className="flex items-center gap-2 px-3.5 pt-3 pb-0">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white shrink-0" style={{ backgroundColor: msg.sender.color }}>
                          {msg.sender.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] font-medium" style={{ color: msg.sender.color }}>{msg.sender.name}</span>
                          {msg.topicId && msg.topicId !== "pc-saved" && (
                            <span className="text-[10px] text-gray-400 ml-1.5">· {allSpaces.flatMap(s => s.topics || []).find(t => t.id === msg.topicId)?.name || msg.topicId}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">{msg.timestamp}</span>
                      </div>
                    )}

                    {/* Pin badge (notes only) */}
                    {msg.pinned && !isPcSaved && (
                      <div className="flex items-center gap-1 px-3 pt-2.5 pb-0 text-amber-500">
                        <Pin className="w-2.5 h-2.5 fill-amber-400" />
                        <span className="text-[9px] font-medium uppercase tracking-wide">Đã ghim</span>
                      </div>
                    )}

                    {msgContent}

                    {/* Footer */}
                    <div className="flex items-center justify-between px-3.5 pb-2.5">
                      {isPcSaved
                        ? <span className="text-[10px] text-amber-500 flex items-center gap-1"><Bookmark className="w-2.5 h-2.5 fill-amber-400" />Đã lưu</span>
                        : <span className="text-[10px] text-gray-400">{msg.timestamp}{msg.edited && " · đã sửa"}</span>
                      }
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                        {isPcSaved ? (
                          <button onClick={(e) => { e.stopPropagation(); toggleBookmark(msg.id); }}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-amber-50 text-amber-400 hover:text-amber-600 transition-all text-[10px]" title="Bỏ lưu">
                            <BookmarkCheck className="w-3 h-3" />Bỏ lưu
                          </button>
                        ) : (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); startEditMessage(msg); inputRef.current?.focus(); }}
                              className="w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-cyan-600 transition-all" title="Chỉnh sửa">
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleTogglePin(msg.id); }}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${msg.pinned ? "text-amber-500 hover:bg-amber-50" : "text-gray-400 hover:text-amber-500 hover:bg-amber-50"}`} title={msg.pinned ? "Bỏ ghim" : "Ghim"}>
                              <Pin className="w-3 h-3" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }}
                              className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all" title="Xóa">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={msg.id}>
                {timeGapDivider}
                {unreadDivider}
              <div
                id={`msg-${msg.id}`}
                className={`group flex ${isOwn ? "justify-end" : "justify-start"} ${showSenderName ? "mt-3" : "mt-[3px]"} relative ${selectionMode ? "cursor-pointer" : ""} ${selectionMode && selectedMsgIds.has(msg.id) ? "bg-cyan-100/40 -mx-2 px-2 rounded-xl" : ""} ${highlightedMsgId === msg.id ? "animate-[highlightPulse_2s_ease]" : ""} transition-all`}
                onClick={selectionMode ? () => toggleSelectMsg(msg.id) : undefined}
                onContextMenu={!selectionMode ? (e) => { e.preventDefault(); setMsgContextMenu({ msg, pos: { x: e.clientX, y: e.clientY } }); } : undefined}
                onDoubleClick={!selectionMode ? () => { setReplyingTo(msg); inputRef.current?.focus(); } : undefined}
                onTouchStart={!selectionMode ? () => {
                  longPressTimer.current = setTimeout(() => {
                    setMsgContextMenu({ msg, pos: { x: 0, y: 0 } });
                  }, 500);
                } : undefined}
                onTouchEnd={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
                onTouchMove={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
              >
                {/* Selection checkbox */}
                {selectionMode && (
                  <div className="w-6 shrink-0 self-center mr-1">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedMsgIds.has(msg.id) ? "bg-cyan-500 border-cyan-500" : "border-gray-300 bg-white"}`}>
                      {selectedMsgIds.has(msg.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                )}

                {/* Avatar for incoming - only show for last in group */}
                {!isOwn && !selectionMode && (
                  <div className="w-8 shrink-0 self-end mr-1.5">
                    {isLastInGroup && (
                      <div className="relative">
                        {msg.sender.isBot ? (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-sm cursor-pointer" onClick={() => setProfileUser(msg.sender)}><Bot className="w-3.5 h-3.5 text-white" /></div>
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] text-white shadow-sm cursor-pointer" style={{ backgroundColor: msg.sender.color }} onClick={() => setProfileUser(msg.sender)}>{msg.sender.name.charAt(0)}</div>
                        )}
                        {/* Online status dot */}
                        {!msg.sender.isBot && userOnlineStatus[msg.sender.id] && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#E8F4F8]"
                            style={{ backgroundColor: onlineStatusColor[userOnlineStatus[msg.sender.id]] }} />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Bubble container */}
                <div className={`relative max-w-[65%] min-w-[80px] ${isOwn ? "" : ""}`}>
                  {/* Forwarded label */}
                  {msg.forwarded && (
                    <div className={`flex items-center gap-1 mb-0.5 text-[10px] ${isOwn ? "justify-end" : ""} text-gray-400`}>
                      <Share2 className="w-2.5 h-2.5" />
                      <span>Chuyển tiếp từ {msg.forwarded.fromTopicEmoji} {msg.forwarded.fromTopicName}</span>
                    </div>
                  )}
                  {/* Chat topic badge */}
                  {msg.chatTopicId && (() => {
                    const t = currentChatTopics.find(tp => tp.id === msg.chatTopicId);
                    if (!t) return null;
                    return (
                      <div className={`flex items-center gap-1 mb-0.5 text-[10px] ${isOwn ? "justify-end" : ""}`}>
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: t.color + "20", color: t.color }}>
                          <span>{t.emoji}</span>
                          <span className="font-medium">{t.name}</span>
                        </span>
                      </div>
                    );
                  })()}

                  {/* The bubble */}
                  <div className={`relative shadow-[0_1px_2px_rgba(0,0,0,0.08)] overflow-hidden ${
                    msg.type === "image" ? "p-0" : "px-[9px] pt-[6px] pb-[5px]"
                  } ${
                    isOwn
                      ? `bg-[#D7F8EE] ${isLastInGroup ? "rounded-2xl rounded-br-[4px] bubble-tail-right" : "rounded-2xl"}`
                      : `bg-white ${isLastInGroup ? "rounded-2xl rounded-bl-[4px] bubble-tail-left" : "rounded-2xl"}`
                  } ${pinAnimatingIds.has(msg.id) ? "animate-pin-glow" : ""}`}>

                    {/* Sender name & reply quote (with conditional padding for image msgs) */}
                    {(!isOwn && showSenderName || replyParent) && (
                      <div className={msg.type === "image" ? "px-[9px] pt-[6px]" : ""}>
                        {!isOwn && showSenderName && (
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[12px] cursor-pointer hover:underline" style={{ color: msg.sender.color }} onClick={() => setProfileUser(msg.sender)}>{msg.sender.name}</span>
                            {msg.sender.isBot && <span className="text-[8px] bg-cyan-50 text-cyan-600 px-1 py-0 rounded border border-cyan-100">BOT</span>}
                            {msg.pinned && <Pin className="w-2.5 h-2.5 text-cyan-400" style={pinAnimatingIds.has(msg.id) ? { animation: "reactionBounce 0.6s ease" } : undefined} />}
                          </div>
                        )}
                        {replyParent && (
                          <div className={`mb-1.5 rounded-lg overflow-hidden cursor-pointer ${isOwn ? "bg-[#BCEFE0]" : "bg-gray-50"}`}>
                            <div className="flex">
                              <div className="w-[3px] shrink-0" style={{ backgroundColor: replyParent.sender.color }} />
                              <div className="px-2 py-1.5 min-w-0">
                                <p className="text-[11px]" style={{ color: replyParent.sender.color }}>{replyParent.sender.name}</p>
                                <p className="text-[11px] text-gray-500 truncate">{replyParent.content?.slice(0, 60) || "📊 Report"}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message content */}
                    {(msg.type === "text" || msg.type === "bot_response") && (
                        <div className={`text-[13px] leading-[1.35] ${msg.type === "bot_response" ? "" : "whitespace-pre-wrap"} ${isOwn ? "text-gray-800" : "text-gray-800"} ${chatSearchQuery && msg.content?.toLowerCase().includes(chatSearchQuery.toLowerCase()) ? "bg-yellow-100/60 -mx-0.5 px-0.5 rounded" : ""}`}>
                          {msg.type === "bot_response"
                            ? renderBotContent(translatedMsgIds.has(msg.id) ? autoTranslate(msg.content) : msg.content)
                            : <FormattedContent content={translatedMsgIds.has(msg.id) ? autoTranslate(msg.content) : msg.content} />
                          }
                          {translatedMsgIds.has(msg.id) && (
                            <div className="mt-1 flex items-center gap-1 opacity-60">
                              <Languages className="w-2.5 h-2.5 text-blue-400" />
                              <span className="text-[9px] text-blue-400 italic">Translated from Vietnamese</span>
                            </div>
                          )}
                          {/* Suggestions chips for bot_response */}
                          {msg.type === "bot_response" && msg.suggestions && msg.suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-100">
                              {msg.suggestions.map((s, i) => (
                                <button key={i}
                                  onClick={() => setInputValue(s)}
                                  className="px-2.5 py-1 text-[11px] bg-teal-50 text-teal-700 rounded-full border border-teal-100 hover:bg-teal-100 transition-all">
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                          {/* Inline timestamp + read status */}
                          <span className="float-right ml-2 mt-1 flex items-center gap-0.5 translate-y-[2px]">
                            {savedMessageIds.has(msg.id) && <Bookmark className="w-2.5 h-2.5 text-amber-400 fill-amber-400 mr-0.5" />}
                            {msg.edited && <span className="text-[9px] text-gray-400 mr-0.5">đã sửa</span>}
                            <span className={`text-[10px] ${isOwn ? "text-teal-600/60" : "text-gray-400"}`}>{msg.timestamp}</span>
                            {isOwn && (
                              <span className={`cursor-pointer hover:opacity-70 ${getReadStatus() === "read" ? "check-read" : "check-delivered"}`}
                                onClick={(e) => { e.stopPropagation(); setReadReceiptPopup({ msgId: msg.id, pos: { x: e.clientX, y: e.clientY } }); }}>
                                {getReadStatus() === "sent" ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <CheckCheck className="w-3 h-3" />
                                )}
                              </span>
                            )}
                          </span>
                        </div>
                    )}

                    {/* Image message */}
                    {msg.type === "image" && msg.imageUrl && (
                      <div>
                        <img
                          src={msg.imageUrl}
                          alt={msg.imageCaption || "Image"}
                          className="w-full max-w-[320px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                          style={{ maxHeight: 280, minWidth: 200 }}
                          onClick={(e) => { e.stopPropagation(); openLightbox(msg.imageUrl!); }}
                        />
                        <div className="px-[9px] pt-1 pb-[5px]">
                          {msg.imageCaption && (
                            <p className="text-[13px] text-gray-800 leading-[1.35]">
                              <FormattedContent content={msg.imageCaption} />
                            </p>
                          )}
                          <span className="float-right ml-2 flex items-center gap-0.5 translate-y-[1px]">
                            <span className={`text-[10px] ${isOwn ? "text-teal-600/60" : "text-gray-400"}`}>{msg.timestamp}</span>
                            {isOwn && (
                              <span className={getReadStatus() === "read" ? "check-read" : "check-delivered"}>
                                {getReadStatus() === "sent" ? <Check className="w-3 h-3" /> : <CheckCheck className="w-3 h-3" />}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* File message */}
                    {msg.type === "file" && msg.fileName && (
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          msg.fileType === "pdf" ? "bg-red-50 text-red-500" :
                          msg.fileType === "sql" ? "bg-violet-50 text-violet-500" :
                          msg.fileType === "zip" ? "bg-amber-50 text-amber-500" :
                          "bg-cyan-50 text-cyan-500"
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-gray-800 truncate">{msg.fileName}</p>
                          <p className="text-[10px] text-gray-500">{msg.fileSize} · {msg.fileType?.toUpperCase()}</p>
                        </div>
                        <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all shrink-0">
                          <Download className="w-4 h-4" />
                        </button>
                        <span className="absolute bottom-1.5 right-2.5 flex items-center gap-0.5">
                          <span className={`text-[10px] ${isOwn ? "text-teal-600/60" : "text-gray-400"}`}>{msg.timestamp}</span>
                          {isOwn && (
                            <span className={getReadStatus() === "read" ? "check-read" : "check-delivered"}>
                              {getReadStatus() === "sent" ? <Check className="w-3 h-3" /> : <CheckCheck className="w-3 h-3" />}
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Voice message */}
                    {msg.type === "voice" && (
                      <VoiceMessageBubble
                        duration={msg.voiceDuration || 0}
                        waveform={msg.voiceWaveform || []}
                        timestamp={msg.timestamp}
                        isOwn={isOwn}
                        readStatus={getReadStatus()}
                      />
                    )}

                    {/* Link preview message */}
                    {msg.type === "link_preview" && (
                      <div>
                        <div className="text-[13px] leading-[1.35] whitespace-pre-wrap text-gray-800 mb-1.5">
                          <FormattedContent content={msg.content} />
                        </div>
                        {msg.linkPreview && (
                          <a href={msg.linkPreview.url} target="_blank" rel="noopener noreferrer"
                            className={`block rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity ${isOwn ? "border-teal-200/50" : "border-gray-200"}`}>
                            {msg.linkPreview.image && (
                              <img src={msg.linkPreview.image} alt="" className="w-full h-[120px] object-cover" />
                            )}
                            <div className={`px-2.5 py-2 ${isOwn ? "bg-[#C4F0E1]" : "bg-gray-50"}`}>
                              <div className="flex items-center gap-1 mb-0.5">
                                <Globe className="w-3 h-3 text-gray-500" />
                                <span className="text-[10px] text-gray-500">{msg.linkPreview.domain}</span>
                              </div>
                              <p className="text-[12px] text-gray-800 truncate">{msg.linkPreview.title}</p>
                              <p className="text-[10px] text-gray-500 line-clamp-2">{msg.linkPreview.description}</p>
                            </div>
                          </a>
                        )}
                        <span className="float-right ml-2 flex items-center gap-0.5 translate-y-[1px]">
                          <span className={`text-[10px] ${isOwn ? "text-teal-600/60" : "text-gray-400"}`}>{msg.timestamp}</span>
                          {isOwn && (
                            <span className={getReadStatus() === "read" ? "check-read" : "check-delivered"}>
                              {getReadStatus() === "sent" ? <Check className="w-3 h-3" /> : <CheckCheck className="w-3 h-3" />}
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Report/Command result cards */}
                    {(msg.type === "report" || msg.type === "command_result") && msg.reportData && (
                      <div className="mt-0.5">
                        <h4 className="text-[13px] text-gray-800 mb-2">{msg.reportData.title}</h4>
                        <div className="space-y-1.5">
                          {msg.reportData.items.map((item, i) => (
                            <div key={`${msg.id}-item-${i}`} className="flex items-center justify-between py-1 border-b border-gray-100/60 last:border-0">
                              <span className="text-[12px] text-gray-500">{item.label}</span>
                              <span className="text-[12px] px-2 py-0.5 rounded-md" style={{ color: item.color, backgroundColor: `${item.color}15` }}>{item.value}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end mt-1.5">
                          <span className="text-[10px] text-gray-400">{msg.timestamp}</span>
                        </div>
                      </div>
                    )}

                    {/* Approval cards */}
                    {msg.type === "approval" && msg.approvalData && (
                      <div className="mt-0.5">
                        <div className="flex items-start gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.approvalData.status === "approved" ? "bg-emerald-50" : msg.approvalData.status === "rejected" ? "bg-red-50" : "bg-amber-50"}`}>
                            {msg.approvalData.status === "approved" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : msg.approvalData.status === "rejected" ? <X className="w-3.5 h-3.5 text-red-500" /> : <Clock className="w-3.5 h-3.5 text-amber-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] text-gray-800 mb-0.5">{msg.approvalData.title}</p>
                            <p className="text-[11px] text-gray-500 mb-2">{msg.approvalData.description}</p>
                            {msg.approvalData.status === "pending" ? (
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleApproval(msg.id, true)} className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white text-[11px] rounded-lg hover:bg-emerald-600 transition-all"><ThumbsUp className="w-3 h-3" /> Duyệt</button>
                                <button onClick={() => handleApproval(msg.id, false)} className="flex items-center gap-1 px-2.5 py-1 bg-white text-red-500 text-[11px] rounded-lg hover:bg-red-50 transition-all border border-red-200"><ThumbsDown className="w-3 h-3" /> Từ chối</button>
                              </div>
                            ) : (
                              <span className={`text-[10px] px-2 py-0.5 rounded-md ${msg.approvalData.status === "approved" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                                {msg.approvalData.status === "approved" ? "✅ Đã duyệt" : "❌ Đã từ chối"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end mt-1">
                          <span className="text-[10px] text-gray-400">{msg.timestamp}</span>
                        </div>
                      </div>
                    )}

                    {/* ── Poll card ── */}
                    {msg.type === "poll" && msg.pollData && (() => {
                      const pd = msg.pollData;
                      const totalVotes = pd.options.reduce((s, o) => s + o.voterIds.length, 0);
                      const myVotes = pd.options.filter(o => o.voterIds.includes(minhUser.id)).map(o => o.id);
                      const hasVoted = myVotes.length > 0;
                      const isCreator = msg.sender.id === minhUser.id;
                      return (
                        <div className="mt-0.5 min-w-[260px] max-w-[340px]">
                          <div className="flex items-start gap-2 mb-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                              <BarChart3 className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-gray-800 leading-snug">{pd.question}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {pd.multipleChoice && <span className="text-[9px] bg-violet-50 text-violet-500 px-1.5 py-0.5 rounded-full">Nhiều đáp án</span>}
                                {pd.anonymous && <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Ẩn danh</span>}
                                {pd.closed && <span className="text-[9px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full">Đã đóng</span>}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            {pd.options.map(opt => {
                              const pct = totalVotes > 0 ? Math.round((opt.voterIds.length / totalVotes) * 100) : 0;
                              const isMyVote = opt.voterIds.includes(minhUser.id);
                              const showBar = hasVoted || pd.closed;
                              return (
                                <button key={opt.id} onClick={() => !pd.closed && handleVotePoll(msg.id, opt.id)} disabled={pd.closed}
                                  className={`w-full text-left rounded-lg border transition-all relative overflow-hidden ${isMyVote ? "border-indigo-300 bg-indigo-50/50" : pd.closed ? "border-gray-200 bg-gray-50" : "border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30"}`}>
                                  {showBar && <div className={`absolute inset-y-0 left-0 transition-all duration-500 rounded-lg ${isMyVote ? "bg-indigo-100/70" : "bg-gray-100/70"}`} style={{ width: `${pct}%` }} />}
                                  <div className="relative flex items-center gap-2 px-3 py-2">
                                    <div className={`w-4 h-4 rounded-${pd.multipleChoice ? "sm" : "full"} border-2 flex items-center justify-center shrink-0 transition-all ${isMyVote ? "border-indigo-500 bg-indigo-500" : "border-gray-300"}`}>
                                      {isMyVote && <Check className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                    <span className={`flex-1 text-[12px] ${isMyVote ? "text-indigo-700 font-medium" : "text-gray-700"}`}>{opt.text}</span>
                                    {showBar && <span className={`text-[10px] font-medium shrink-0 ${isMyVote ? "text-indigo-600" : "text-gray-400"}`}>{pct}%</span>}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3 h-3 text-gray-400" />
                              <span className="text-[10px] text-gray-500">{totalVotes} lượt bình chọn</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {!pd.closed && isCreator && <button onClick={() => handleClosePoll(msg.id)} className="text-[10px] text-red-400 hover:text-red-500 transition-all">Đóng bình chọn</button>}
                              <span className="text-[10px] text-gray-400">{msg.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Reactions below bubble */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className={`flex items-center gap-1 mt-1 flex-wrap ${isOwn ? "justify-end" : "justify-start"}`}>
                      {msg.reactions.map(r => {
                        const rKey = `${msg.id}-${r.emoji}`;
                        const isBouncing = animatingReactions.has(rKey);
                        return (
                        <button key={rKey}
                          onClick={() => toggleReaction(msg.id, r.emoji)}
                          onMouseEnter={(e) => setReactionDetailMsg({ msgId: msg.id, emoji: r.emoji, pos: { x: e.clientX, y: e.clientY } })}
                          onMouseLeave={() => setReactionDetailMsg(null)}
                          className={`relative flex items-center gap-1 px-2 py-[3px] rounded-full text-[11px] transition-all shadow-sm hover:scale-105 ${r.reacted ? "bg-cyan-50 border border-cyan-200 text-cyan-700" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"}`}
                          style={isBouncing ? { animation: "reactionBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)" } : undefined}>
                          <span className={`text-[13px] ${isBouncing ? "inline-block" : ""}`}
                            style={isBouncing ? { animation: "reactionPop 0.4s ease" } : undefined}>{r.emoji}</span>
                          <span>{r.count}</span>
                          {isBouncing && <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-cyan-400" />}
                        </button>
                        );
                      })}
                      <button onClick={e => openEmojiPicker(msg.id, e)}
                        className="w-5 h-5 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}

                  {/* Thread replies count */}
                  {msg.threadCount && msg.threadCount > 0 && (
                    <button onClick={() => { setActiveThread(msg.id); setShowPinnedPanel(false); }}
                      className={`flex items-center gap-1 mt-1 text-[11px] text-cyan-600 hover:text-cyan-700 hover:bg-white/80 px-2 py-0.5 rounded-lg transition-all ${isOwn ? "ml-auto" : ""}`}>
                      <MessageSquare className="w-3 h-3" /> {msg.threadCount} trả lời
                    </button>
                  )}

                  {/* Mobile-only action button */}
                  {!selectionMode && (
                    <button onClick={(e) => { e.stopPropagation(); setMsgContextMenu({ msg, pos: { x: e.clientX, y: e.clientY } }); }}
                      className={`absolute md:hidden ${isOwn ? "left-0 -translate-x-full -ml-1" : "right-0 translate-x-full ml-1"} top-1/2 -translate-y-1/2 flex items-center justify-center z-10 w-7 h-7 rounded-full bg-white/90 border border-gray-200 shadow-sm text-gray-400 hover:text-gray-600`}
                      title="Thêm">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Desktop hover action bar - quick reply only */}
                  {!selectionMode && (
                    <div className={`absolute hidden md:flex ${isOwn ? "left-0 -translate-x-full -ml-1" : "right-0 translate-x-full ml-1"} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all items-center gap-0.5 z-10`}>
                      <button onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); inputRef.current?.focus(); }}
                        className="w-7 h-7 rounded-full bg-white/90 border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all" title="Trả lời">
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, "👍"); }}
                        className="w-7 h-7 rounded-full bg-white/90 border border-gray-200 shadow-sm flex items-center justify-center text-[13px] hover:scale-110 transition-all" title="👍">
                        👍
                      </button>
                      {(msg.type === "text" || msg.type === "bot_response") && msg.content && (
                        <button onClick={(e) => { e.stopPropagation(); toggleTranslate(msg.id); }}
                          className={`w-7 h-7 rounded-full bg-white/90 border shadow-sm flex items-center justify-center transition-all ${translatedMsgIds.has(msg.id) ? "border-blue-300 text-blue-500 bg-blue-50" : "border-gray-200 text-gray-400 hover:text-blue-500 hover:bg-blue-50"}`}
                          title={translatedMsgIds.has(msg.id) ? "Xem bản gốc" : "Dịch"}>
                          <Languages className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isChannelChat && onPublishAnnouncement && (msg.type === "text" || msg.type === "bot_response") && msg.content && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const pre = msg.content.length > 80 ? msg.content.slice(0, 77) + "..." : msg.content;
                            const emojiMap: Record<string, string> = { "ch-tech": "📝", "ch-workshop": "🎓", "ch-culture": "🎯", "ch-hr": "👥", "ch-random": "🎲", "ch-health": "🏃", "ch-finance": "💰" };
                            const badgeMap: Record<string, string> = { "ch-tech": "Bài viết", "ch-workshop": "Sắp diễn ra", "ch-culture": "Sự kiện", "ch-hr": "Tuyển dụng", "ch-random": "Hot", "ch-health": "Sắp diễn ra", "ch-finance": "Báo cáo" };
                            const defEmoji = emojiMap[selectedChannel || ""] || "📢";
                            const defBadge = badgeMap[selectedChannel || ""] || "Thông báo";
                            setAnnounceForm(f => ({ ...f, title: pre, emoji: defEmoji, badge: defBadge, description: "", s1l: "", s1v: "", s2l: "", s2v: "", s3l: "", s3v: "", attachment: "", publishedBy: "" }));
                            setAnnounceFormOpen(true);
                          }}
                          className="w-7 h-7 rounded-full bg-white/90 border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200 transition-all"
                          title="Đăng lên kênh">
                          <Megaphone className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom FAB with unread badge */}
          {isScrolledUp && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-4 right-6 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:shadow-xl transition-all z-20"
              style={{ animation: "fadeInScale 0.2s ease" }}
            >
              <ChevronDown className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1 min-w-[18px] h-[18px] rounded-full bg-cyan-500 text-white text-[9px] flex items-center justify-center px-1 shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Closed topic notice */}
        {closedTopics.has(activeTopic) && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center gap-3">
            <Archive className="w-4 h-4 text-gray-400 shrink-0" />
            <p className="text-[12px] text-gray-500 flex-1">Chủ đề này đã được đóng. Không thể gửi tin nhắn mới.</p>
            <button onClick={() => handleCloseTopic(activeTopic)}
              className="text-[11px] text-cyan-600 hover:text-cyan-700 px-2.5 py-1 rounded-lg hover:bg-cyan-50 transition-all shrink-0">
              Mở lại
            </button>
          </div>
        )}

        {/* Typing indicator - Telegram style (multi-user) */}
        {typingUsers.length > 0 && (
          <div className="px-6 pb-2 flex items-center gap-2.5" style={{ animation: "fadeInScale 0.2s ease" }}>
            {/* Stacked avatars */}
            <div className="flex items-center -space-x-1.5">
              {typingUsers.slice(0, 3).map((u, i) => (
                <div key={u.id} className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] text-white border-2 border-[#E8F4F8] shadow-sm"
                  style={{ backgroundColor: [huongUser, phucUser, lanUser, ducUser].find(x => x.id === u.id)?.color || "#64748b", zIndex: 3 - i }}>
                  {u.name.charAt(0)}
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl rounded-bl-[4px] px-3.5 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.08)] flex items-center gap-2">
              <div className="flex items-center gap-[3px]">
                <div className="w-[5px] h-[5px] rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms", animationDuration: "0.8s" }} />
                <div className="w-[5px] h-[5px] rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms", animationDuration: "0.8s" }} />
                <div className="w-[5px] h-[5px] rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms", animationDuration: "0.8s" }} />
              </div>
              <span className="text-[11px] text-gray-500">
                {typingUsers.length === 1
                  ? <><span className="text-gray-700">{typingUsers[0].name.split(" ").pop()}</span> đang nhập...</>
                  : typingUsers.length === 2
                  ? <><span className="text-gray-700">{typingUsers[0].name.split(" ").pop()}</span> và <span className="text-gray-700">{typingUsers[1].name.split(" ").pop()}</span> đang nhập...</>
                  : <><span className="text-gray-700">{typingUsers.length} người</span> đang nhập...</>
                }
              </span>
            </div>
          </div>
        )}

        {/* Quick Prompts Bar — shown for bot/agent topics */}
        {!closedTopics.has(activeTopic) && !selectionMode && currentTopic?.agentId && agentQuickPrompts[currentTopic.agentId] && (
          <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0" style={{ scrollbarWidth: "none" }}>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            {agentQuickPrompts[currentTopic.agentId].map((prompt: string) => (
              <button
                key={prompt}
                onClick={() => { setInputValue(prompt); inputRef.current?.focus(); }}
                className="shrink-0 px-3 py-1.5 text-[11px] bg-white text-cyan-700 border border-cyan-200 rounded-full hover:bg-cyan-50 hover:border-cyan-300 transition-all shadow-sm whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        {!closedTopics.has(activeTopic) && !selectionMode && !canPostInChannel && (
          <div className="px-2 py-2">
            <div className="flex items-center gap-3 px-4 py-3 bg-white/90 rounded-2xl text-[13px] text-gray-500 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-600 font-medium text-[12px]">Kênh chỉ đọc</p>
                <p className="text-gray-400 text-[11px]">Chỉ chủ kênh và thành viên được mời mới có thể đăng tin.</p>
              </div>
            </div>
          </div>
        )}
        {!closedTopics.has(activeTopic) && !selectionMode && canPostInChannel && <div className="px-2 py-2">
          {/* Reply preview bar */}
          {replyingTo && (
            <div className="flex items-center gap-2 px-1 pb-1.5">
              <div className="flex-1 flex items-stretch gap-0 min-w-0 bg-white/80 rounded-xl overflow-hidden shadow-sm">
                <div className="w-[3px] shrink-0 bg-cyan-500" />
                <div className="px-2.5 py-1.5 min-w-0 flex-1">
                  <p className="text-[11px] text-cyan-600 truncate">{replyingTo.sender.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{replyingTo.content?.slice(0, 80) || "📊 Report"}</p>
                </div>
              </div>
              <button onClick={() => setReplyingTo(null)} className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center text-gray-400 hover:text-gray-600 shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {/* Edit preview bar */}
          {editingMsgId && (
            <div className="flex items-center gap-2 px-1 pb-1.5">
              <div className="flex-1 flex items-stretch gap-0 min-w-0 bg-cyan-50/90 rounded-xl overflow-hidden shadow-sm">
                <div className="w-[3px] shrink-0 bg-cyan-500" />
                <div className="px-2.5 py-1.5 min-w-0 flex-1 flex items-center gap-1.5">
                  <Pencil className="w-3 h-3 text-cyan-500 shrink-0" />
                  <p className="text-[11px] text-cyan-600 truncate">Đang chỉnh sửa tin nhắn</p>
                </div>
              </div>
              <button onClick={cancelEditMessage} className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center text-gray-400 hover:text-gray-600 shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {/* ── MOBILE: Messenger-style [+][📷][🎤] [pill] [➤] ── */}
          <div className="md:hidden flex items-center gap-2">
            {/* + Attach */}
            <div className="shrink-0 relative">
              <button onClick={() => setShowAttachMenu(!showAttachMenu)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${showAttachMenu ? "bg-cyan-500 text-white rotate-45" : "bg-cyan-500 text-white hover:bg-cyan-600"}`}
                style={{ transition: "transform 0.2s, background 0.15s" }} title="Thêm">
                <Plus className="w-[18px] h-[18px]" />
              </button>
              {showAttachMenu && (
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl border border-gray-100 shadow-2xl w-[200px] py-2 z-20">
                  {[
                    { icon: <FileIcon className="w-[18px] h-[18px]" />, label: "Tài liệu", color: "text-violet-500", bg: "bg-violet-50" },
                    { icon: <FolderOpen className="w-[18px] h-[18px]" />, label: "Từ Drive", color: "text-amber-500", bg: "bg-amber-50" },
                    ...((isGroupChat || (!isPersonalChat && !isChannelChat)) ? [{ icon: <BarChart3 className="w-[18px] h-[18px]" />, label: "Bình chọn", color: "text-indigo-500", bg: "bg-indigo-50" }] : []),
                    ...(isPersonalTool ? [{ icon: <ListChecks className="w-[18px] h-[18px]" />, label: "Checklist", color: "text-green-500", bg: "bg-green-50" }] : []),
                  ].map(item => (
                    <button key={item.label} onClick={() => {
                      setShowAttachMenu(false);
                      const attachChatTopicId = (isPersonalChat && activeChatTopicId !== "all") ? activeChatTopicId : undefined;
                      if (item.label === "Tài liệu") {
                        const n = new Date();
                        setMessages(prev => [...prev, { id: `msg-file-${Date.now()}`, type: "file", sender: minhUser, content: "Gửi file", timestamp: fmt(n.getHours(), n.getMinutes()), topicId: activeTopic, fileName: "document.pdf", fileSize: "256 KB", fileType: "pdf", chatTopicId: attachChatTopicId }]);
                      } else if (item.label === "Bình chọn") {
                        setShowPollModal(true);
                      } else if (item.label === "Checklist") {
                        const ta = inputRef.current;
                        if (!ta) return;
                        const start = ta.selectionStart ?? inputValue.length;
                        const before = inputValue.slice(0, start);
                        const after = inputValue.slice(start);
                        const prefix = before.length > 0 && !before.endsWith("\n") ? "\n- [ ] " : "- [ ] ";
                        setInputValue(before + prefix + after);
                        requestAnimationFrame(() => { ta.focus(); const p = (before + prefix).length; ta.setSelectionRange(p, p); });
                      }
                    }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all text-left">
                      <div className={`w-8 h-8 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>{item.icon}</div>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Camera — ẩn khi đang gõ */}
            {!inputValue.trim() && !isRecording && (
              <button onClick={() => {
                const n = new Date();
                const attachChatTopicId = (isPersonalChat && activeChatTopicId !== "all") ? activeChatTopicId : undefined;
                setMessages(prev => [...prev, { id: `msg-img-${Date.now()}`, type: "image", sender: minhUser, content: "", timestamp: fmt(n.getHours(), n.getMinutes()), topicId: activeTopic, imageUrl: "https://images.unsplash.com/photo-1665470909939-959569b20021?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600", imageCaption: "Ảnh mới gửi", chatTopicId: attachChatTopicId }]);
              }}
                className="w-9 h-9 rounded-full bg-cyan-500 text-white hover:bg-cyan-600 flex items-center justify-center shrink-0 transition-all" title="Ảnh / Video">
                <Camera className="w-[17px] h-[17px]" />
              </button>
            )}

            {/* Mic — ẩn khi đang gõ */}
            {!inputValue.trim() && (
              <button onClick={handleMicToggle}
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-cyan-500 text-white hover:bg-cyan-600"}`}
                title={isRecording ? "Dừng ghi âm" : "Ghi âm"}>
                <Mic className="w-[17px] h-[17px]" />
              </button>
            )}

            {/* Pill */}
            <div className="flex-1 flex items-center bg-white rounded-[22px] shadow-sm px-3.5 py-2 min-h-[36px] relative">
              {showMentionPicker && mentionMembers.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border border-gray-200 shadow-xl max-h-[200px] overflow-y-auto z-20">
                  <div className="px-3 py-2 border-b border-gray-100"><p className="text-[10px] text-gray-500 uppercase tracking-wider">Nhắc đến</p></div>
                  {mentionMembers.map(m => (
                    <button key={m.id} onClick={() => insertMention(m.name)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-all text-left">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white shrink-0" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                      <div className="flex-1 min-w-0"><p className="text-[12px] text-gray-800">{m.name}</p><p className="text-[10px] text-gray-500">{m.role}</p></div>
                    </button>
                  ))}
                </div>
              )}
              {showCommands && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border border-gray-200 shadow-xl max-h-[320px] overflow-y-auto z-20">
                  <div className="px-3 py-2 border-b border-gray-100"><p className="text-[10px] text-gray-500 uppercase tracking-wider">ChatOps Commands</p></div>
                  {slashCommands.filter(c => c.cmd.startsWith(inputValue.toLowerCase())).map(cmd => (
                    <button key={cmd.cmd} onClick={() => insertCommand(cmd.cmd)} className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50 transition-all text-left">
                      <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600 shrink-0 mt-0.5">{cmd.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><span className="text-[12px] text-gray-800">{cmd.cmd}</span><span className="text-[11px] text-gray-500">— {cmd.desc}</span></div>
                        <p className="text-[10px] text-gray-300 mt-0.5 font-mono truncate">{cmd.example}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {isRecording ? (
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  <span className="text-[13px] text-red-500 font-medium tabular-nums">{Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, "0")}</span>
                  <span className="flex-1 text-[12px] text-gray-400">Đang ghi âm...</span>
                </div>
              ) : (
                <textarea ref={inputRef} value={inputValue} onChange={e => handleInputChange(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder={isPersonalTool ? "Nhập ghi chú..." : `Nhắn tin trong ${isChannelChat ? (activeChannelItem?.name || "Kênh") : isPersonalChat ? (activeGroupChat?.name || allPersonalItems.find(p => p.id === selectedPersonalChat)?.name || "Chat") : (currentTopic?.name || space?.name || "Chat")}...`} rows={1}
                  className="flex-1 resize-none text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent min-h-[20px] max-h-[120px] py-0 leading-[1.4]"
                  style={{ height: "auto" }}
                  onInput={e => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 120) + "px"; }} />
              )}
              {!isRecording && (
                <div className="relative shrink-0 ml-1" ref={inputEmojiRef}>
                  <button onClick={() => setShowInputEmojiPicker(!showInputEmojiPicker)}
                    className={`w-7 h-7 flex items-center justify-center transition-all ${showInputEmojiPicker ? "text-cyan-500" : "text-gray-400 hover:text-gray-600"}`} title="Emoji">
                    <Smile className="w-[20px] h-[20px]" />
                  </button>
                  {showInputEmojiPicker && (
                    <InputEmojiPanel onSelect={(e) => { setInputValue(prev => prev + e); setShowInputEmojiPicker(false); inputRef.current?.focus(); }} searchQuery={emojiSearchQuery} onSearchChange={setEmojiSearchQuery} />
                  )}
                </div>
              )}
            </div>

            {/* Send */}
            {(inputValue.trim() || isRecording) && (
              <button onClick={isRecording ? handleMicToggle : handleSend}
                className="w-9 h-9 rounded-full bg-cyan-500 text-white hover:bg-cyan-600 flex items-center justify-center shrink-0 transition-all"
                title={isRecording ? "Gửi âm thanh" : "Gửi"}>
                <Send className="w-[16px] h-[16px]" />
              </button>
            )}
          </div>

          {/* ── DESKTOP: pill gộp [attach | textarea | emoji mic | send] ── */}
          <div className="hidden md:flex items-center gap-2">
            {/* Pill */}
            <div className="flex-1 flex items-center bg-white shadow-sm rounded-2xl px-3 py-2 min-h-[40px] gap-2 relative">
              {/* Attach inside pill */}
              <div className="shrink-0 relative">
                <button onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${showAttachMenu ? "text-cyan-500 bg-cyan-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
                  style={{ transition: "transform 0.2s" }} title="Đính kèm">
                  <Paperclip className="w-[17px] h-[17px]" />
                </button>
                {showAttachMenu && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl border border-gray-100 shadow-2xl w-[200px] py-2 z-20">
                    {[
                      { icon: <FileIcon className="w-[18px] h-[18px]" />, label: "Tài liệu", color: "text-violet-500", bg: "bg-violet-50" },
                      { icon: <FolderOpen className="w-[18px] h-[18px]" />, label: "Từ Drive", color: "text-amber-500", bg: "bg-amber-50" },
                      { icon: <ImageIcon className="w-[18px] h-[18px]" />, label: "Ảnh / Video", color: "text-sky-500", bg: "bg-sky-50" },
                      ...((isGroupChat || (!isPersonalChat && !isChannelChat)) ? [{ icon: <BarChart3 className="w-[18px] h-[18px]" />, label: "Bình chọn", color: "text-indigo-500", bg: "bg-indigo-50" }] : []),
                      ...(isPersonalTool ? [{ icon: <ListChecks className="w-[18px] h-[18px]" />, label: "Checklist", color: "text-green-500", bg: "bg-green-50" }] : []),
                    ].map(item => (
                      <button key={item.label} onClick={() => {
                        setShowAttachMenu(false);
                        const attachChatTopicId = (isPersonalChat && activeChatTopicId !== "all") ? activeChatTopicId : undefined;
                        if (item.label === "Tài liệu") {
                          const n = new Date();
                          setMessages(prev => [...prev, { id: `msg-file-${Date.now()}`, type: "file", sender: minhUser, content: "Gửi file", timestamp: fmt(n.getHours(), n.getMinutes()), topicId: activeTopic, fileName: "document.pdf", fileSize: "256 KB", fileType: "pdf", chatTopicId: attachChatTopicId }]);
                        } else if (item.label === "Ảnh / Video") {
                          const n = new Date();
                          setMessages(prev => [...prev, { id: `msg-img-${Date.now()}`, type: "image", sender: minhUser, content: "", timestamp: fmt(n.getHours(), n.getMinutes()), topicId: activeTopic, imageUrl: "https://images.unsplash.com/photo-1665470909939-959569b20021?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600", imageCaption: "Ảnh mới gửi", chatTopicId: attachChatTopicId }]);
                        } else if (item.label === "Bình chọn") {
                          setShowPollModal(true);
                        } else if (item.label === "Checklist") {
                          const ta = inputRef.current;
                          if (!ta) return;
                          const start = ta.selectionStart ?? inputValue.length;
                          const before = inputValue.slice(0, start);
                          const after = inputValue.slice(start);
                          const prefix = before.length > 0 && !before.endsWith("\n") ? "\n- [ ] " : "- [ ] ";
                          setInputValue(before + prefix + after);
                          requestAnimationFrame(() => { ta.focus(); const p = (before + prefix).length; ta.setSelectionRange(p, p); });
                        }
                      }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all text-left">
                        <div className={`w-8 h-8 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>{item.icon}</div>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mention/Command pickers */}
              {showMentionPicker && mentionMembers.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border border-gray-200 shadow-xl max-h-[200px] overflow-y-auto z-20">
                  <div className="px-3 py-2 border-b border-gray-100"><p className="text-[10px] text-gray-500 uppercase tracking-wider">Nhắc đến</p></div>
                  {mentionMembers.map(m => (
                    <button key={m.id} onClick={() => insertMention(m.name)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-all text-left">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white shrink-0" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                      <div className="flex-1 min-w-0"><p className="text-[12px] text-gray-800">{m.name}</p><p className="text-[10px] text-gray-500">{m.role}</p></div>
                    </button>
                  ))}
                </div>
              )}
              {showCommands && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border border-gray-200 shadow-xl max-h-[320px] overflow-y-auto z-20">
                  <div className="px-3 py-2 border-b border-gray-100"><p className="text-[10px] text-gray-500 uppercase tracking-wider">ChatOps Commands</p></div>
                  {slashCommands.filter(c => c.cmd.startsWith(inputValue.toLowerCase())).map(cmd => (
                    <button key={cmd.cmd} onClick={() => insertCommand(cmd.cmd)} className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50 transition-all text-left">
                      <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600 shrink-0 mt-0.5">{cmd.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><span className="text-[12px] text-gray-800">{cmd.cmd}</span><span className="text-[11px] text-gray-500">— {cmd.desc}</span></div>
                        <p className="text-[10px] text-gray-300 mt-0.5 font-mono truncate">{cmd.example}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Textarea */}
              {isRecording ? (
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  <span className="text-[13px] text-red-500 font-medium tabular-nums">{Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, "0")}</span>
                  <span className="flex-1 text-[12px] text-gray-400">Đang ghi âm...</span>
                </div>
              ) : (
                <textarea ref={inputRef} value={inputValue} onChange={e => handleInputChange(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder={isPersonalTool ? "Nhập ghi chú..." : `Nhắn tin trong ${isChannelChat ? (activeChannelItem?.name || "Kênh") : isPersonalChat ? (activeGroupChat?.name || allPersonalItems.find(p => p.id === selectedPersonalChat)?.name || "Chat") : (currentTopic?.name || space?.name || "Chat")}...`} rows={1}
                  className="flex-1 resize-none text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent min-h-[20px] max-h-[120px] py-0 leading-[1.4]"
                  style={{ height: "auto" }}
                  onInput={e => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 120) + "px"; }} />
              )}

              {/* Right icons inside pill: emoji + mic */}
              {!isRecording && (
                <>
                  <div className="relative shrink-0" ref={inputEmojiRef}>
                    <button onClick={() => setShowInputEmojiPicker(!showInputEmojiPicker)}
                      className={`w-7 h-7 flex items-center justify-center transition-all ${showInputEmojiPicker ? "text-cyan-500" : "text-gray-400 hover:text-gray-600"}`} title="Emoji">
                      <Smile className="w-[18px] h-[18px]" />
                    </button>
                    {showInputEmojiPicker && (
                      <InputEmojiPanel onSelect={(e) => { setInputValue(prev => prev + e); setShowInputEmojiPicker(false); inputRef.current?.focus(); }} searchQuery={emojiSearchQuery} onSearchChange={setEmojiSearchQuery} />
                    )}
                  </div>
                  <button onClick={handleMicToggle}
                    className={`w-7 h-7 flex items-center justify-center transition-all shrink-0 ${isRecording ? "text-red-500" : "text-gray-400 hover:text-gray-600"}`} title="Ghi âm">
                    <Mic className="w-[17px] h-[17px]" />
                  </button>
                </>
              )}
            </div>

            {/* Send button outside pill */}
            {(inputValue.trim() || isRecording) && (
              <button onClick={isRecording ? handleMicToggle : handleSend}
                className="w-9 h-9 rounded-full bg-cyan-500 text-white hover:bg-cyan-600 flex items-center justify-center shrink-0 transition-all"
                title={isRecording ? "Gửi âm thanh" : "Gửi"}>
                <Send className="w-[16px] h-[16px]" />
              </button>
            )}

            {/* Schedule send */}
            {inputValue.trim() && (
              <button onClick={() => setShowScheduleModal(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/60 text-gray-400 hover:text-violet-500 transition-all shrink-0" title="Hẹn giờ gửi">
                <CalendarClock className="w-[15px] h-[15px]" />
              </button>
            )}
          </div>
        </div>}
      </div>

      {/* Thread panel */}
      {activeThread && threadParent && (
        <div className="fixed inset-0 z-[60] bg-white overflow-y-auto pb-16 md:pb-0 md:relative md:inset-auto md:z-auto md:bg-transparent md:overflow-visible">
          <ThreadPanel parentMessage={threadParent} replies={threadReplies} onClose={() => setActiveThread(null)}
            onSendReply={handleSendThreadReply} onToggleReaction={toggleReaction} />
        </div>
      )}

      {/* Notes Info Panel */}
      {showNotesInfo && isPersonalTool && !activeThread && (
        <div className="fixed inset-0 z-[60] bg-white overflow-y-auto pb-16 md:pb-0 md:relative md:inset-auto md:z-auto md:bg-transparent md:overflow-visible">
          <PersonalNotesInfoPanel
            onClose={() => setShowNotesInfo(false)}
            sharedMedia={sharedMedia}
            sharedFiles={sharedFiles}
            sharedLinks={sharedLinks}
            totalNotes={topicMessages.filter(m => m.type !== "system" && m.type !== "task_update").length}
            pinnedNotes={topicMessages.filter(m => m.pinned).length}
          />
        </div>
      )}

      {/* User Profile Panel */}
      {profileUser && (
        <UserProfilePanel user={profileUser} onClose={() => setProfileUser(null)} />
      )}

      {/* Channel Manage Panel */}
      {showChannelManage && isChannelChat && activeChannelItem && activeChannelItem.ownerId === currentUserId && !activeThread && (
        <div className="fixed inset-0 z-[60] bg-white overflow-y-auto pb-16 md:pb-0 md:relative md:inset-auto md:z-auto md:bg-transparent md:overflow-visible">
          <ChannelManagePanel
            channel={activeChannelItem}
            currentUserId={currentUserId}
            onClose={() => setShowChannelManage(false)}
            onUpdate={(patch) => onUpdateChannel?.(activeChannelItem.id, patch)}
          />
        </div>
      )}

      {/* Pinned messages panel */}
      {showPinnedPanel && !activeThread && !showChatInfo && !showTopicsDrawer && (
        <div className="fixed inset-0 z-[60] bg-white overflow-y-auto pb-16 md:pb-0 md:relative md:inset-auto md:z-auto md:bg-transparent md:overflow-visible">
          <PinnedMessagesPanel messages={pinnedMessages} onClose={() => setShowPinnedPanel(false)}
            onUnpin={msgId => handleTogglePin(msgId)} topicName={currentTopic?.name || "General"} />
        </div>
      )}

      {/* Chat Topics Drawer */}

      {/* Chat Info Panel */}
      {showChatInfo && !activeThread && !isPersonalTool && (
        <div className="fixed inset-0 z-[60] bg-white overflow-y-auto pb-16 md:pb-0 md:relative md:inset-auto md:z-auto md:bg-transparent md:overflow-visible">
          {isGroupChat && activeGroupChat ? (
            <GroupProfilePanel
              onClose={() => setShowChatInfo(false)}
              group={activeGroupChat}
              sharedMedia={sharedMedia}
              sharedFiles={sharedFiles}
              sharedLinks={sharedLinks}
              isMuted={!!mutedTopics[activeTopic]}
              onStartDM={onStartDM}
              onToggleMute={() => {
                if (mutedTopics[activeTopic]) {
                  setMutedTopics(prev => { const n = { ...prev }; delete n[activeTopic]; return n; });
                  toast.success("Đã bật thông báo", { icon: <Bell className="w-4 h-4 text-cyan-500" />, duration: 2000 });
                } else {
                  setMutedTopics(prev => ({ ...prev, [activeTopic]: "mute_forever" }));
                  toast("Đã tắt thông báo", { icon: <BellOff className="w-4 h-4 text-orange-400" />, duration: 2000 });
                }
              }}
            />
          ) : isPersonalChat && !isGroupChat ? (() => {
            const pcItem = allPersonalItems.find(p => p.id === selectedPersonalChat);
            return pcItem && pcItem.type === "dm" ? (
              <PersonalProfilePanel
                onClose={() => setShowChatInfo(false)}
                person={pcItem}
                isMuted={!!mutedTopics[activeTopic]}
                onOpenGroup={onOpenGroup}
                onToggleMute={() => {
                  if (mutedTopics[activeTopic]) {
                    setMutedTopics(prev => { const n = { ...prev }; delete n[activeTopic]; return n; });
                    toast.success("Đã bật thông báo", { icon: <Bell className="w-4 h-4 text-cyan-500" />, duration: 2000 });
                  } else {
                    setMutedTopics(prev => ({ ...prev, [activeTopic]: "mute_forever" }));
                    toast("Đã tắt thông báo", { icon: <BellOff className="w-4 h-4 text-orange-400" />, duration: 2000 });
                  }
                }}
              />
            ) : null;
          })() : (
            <ChatInfoPanel
              onClose={() => setShowChatInfo(false)}
              activeTab={chatInfoTab}
              onTabChange={setChatInfoTab}
              topicName={currentTopic?.name || "General"}
              topicEmoji={currentTopic?.emoji}
              sharedMedia={sharedMedia}
              sharedFiles={sharedFiles}
              sharedLinks={sharedLinks}
              savedMessages={messages.filter(m => savedMessageIds.has(m.id))}
              scheduledMessages={scheduledMessages.filter(s => s.topicId === activeTopic)}
              onRemoveScheduled={removeScheduledMessage}
              onToggleBookmark={toggleBookmark}
              isMuted={!!mutedTopics[activeTopic]}
              onToggleMute={() => {
                if (mutedTopics[activeTopic]) {
                  setMutedTopics(prev => { const n = { ...prev }; delete n[activeTopic]; return n; });
                  toast.success("Đã bật thông báo", { icon: <Bell className="w-4 h-4 text-cyan-500" />, duration: 2000 });
                } else {
                  setMutedTopics(prev => ({ ...prev, [activeTopic]: "mute_forever" }));
                  toast("Đã tắt thông báo", { icon: <BellOff className="w-4 h-4 text-orange-400" />, duration: 2000 });
                }
              }}
              onOpenSearch={() => { setChatSearchOpen(true); }}
              onStartDM={onStartDM}
              onLightbox={openLightbox}
            />
          )}
        </div>
      )}

      {/* ===== MODALS & POPUPS ===== */}

      {/* Schedule Message Modal */}
      {showScheduleModal && (
        <ScheduleMessageModal
          onClose={() => setShowScheduleModal(false)}
          onSchedule={(content, time) => { addScheduledMessage(content, time); setInputValue(""); }}
          inputValue={inputValue}
        />
      )}

      {/* Create Poll Modal */}
      {showPollModal && (
        <CreatePollModal
          onClose={() => setShowPollModal(false)}
          onCreate={handleCreatePoll}
        />
      )}

      {/* Tag Topic Modal */}
      {tagTopicModalMsg && (
        <TagTopicModal
          topics={isPersonalChat
            ? currentChatTopics
            : localTopics.map(t => ({ id: t.id, name: t.name, emoji: t.emoji || "💬", color: space?.color || "#6366f1" }))}
          onTag={(topicId) => handleTagMessageTopic(tagTopicModalMsg, topicId)}
          onClose={() => setTagTopicModalMsg(null)}
          onCreateNew={isPersonalChat
            ? () => { setTagTopicModalMsg(null); setShowTopicsDrawer(true); }
            : () => { setTagTopicModalMsg(null); setShowNewTopicModal(true); }}
        />
      )}

      {/* New Topic Modal */}
      {showNewTopicModal && <NewTopicModal onClose={() => setShowNewTopicModal(false)} onCreate={handleCreateTopic} />}

      {/* Edit Topic Modal */}
      {editingTopic && <EditTopicModal topic={editingTopic} onClose={() => setEditingTopic(null)} onSave={handleEditTopic} />}

      {/* Delete Topic Confirm */}
      {deletingTopic && <DeleteTopicModal topic={deletingTopic} onClose={() => setDeletingTopic(null)} onConfirm={handleDeleteTopic} />}

      {/* Forward Message Modal */}
      {forwardingMsg && (
        <ForwardMessageModal
          message={forwardingMsg}
          allTopics={allTopicsFlat}
          currentTopicId={activeTopic}
          personalItems={allPersonalItems}
          personalGroups={groupChats}
          onClose={() => setForwardingMsg(null)}
          onForward={handleForwardMessage}
        />
      )}

      {/* Topic Context Menu */}
      {topicContextMenu && (
        <TopicContextMenu
          position={topicContextMenu.pos}
          topic={topicContextMenu.topic}
          isMuted={!!mutedTopics[topicContextMenu.topic.id]}
          isClosed={closedTopics.has(topicContextMenu.topic.id)}
          onClose={() => setTopicContextMenu(null)}
          onOpenNewWindow={() => handleOpenNewWindow(topicContextMenu.topic.id)}
          onTogglePin={() => handleToggleTopicPin(topicContextMenu.topic.id)}
          onMute={mode => handleMuteTopic(topicContextMenu.topic.id, mode)}
          onCloseTopic={() => handleCloseTopic(topicContextMenu.topic.id)}
          onEdit={() => setEditingTopic(topicContextMenu.topic)}
          onDelete={() => setDeletingTopic(topicContextMenu.topic)}
        />
      )}

      {/* Emoji Reaction Picker */}
      {emojiPickerState && (
        <EmojiReactionPicker
          position={emojiPickerState.pos}
          onSelect={emoji => toggleReaction(emojiPickerState.msgId, emoji)}
          onClose={() => setEmojiPickerState(null)}
        />
      )}

      {/* Reaction Detail Tooltip */}
      {reactionDetailMsg && (
        <div
          style={{ position: "fixed", top: reactionDetailMsg.pos.y - 50, left: reactionDetailMsg.pos.x - 60, zIndex: 65 }}
          className="bg-gray-800 text-white px-3 py-1.5 rounded-lg shadow-xl text-[11px] pointer-events-none"
        >
          <span className="text-[16px] mr-1">{reactionDetailMsg.emoji}</span>
          {(() => {
            const msg = messages.find(m => m.id === reactionDetailMsg.msgId);
            const r = msg?.reactions?.find(rx => rx.emoji === reactionDetailMsg.emoji);
            if (!r) return null;
            const names = r.reacted ? ["Bạn"] : [];
            const others = r.count - (r.reacted ? 1 : 0);
            if (others > 0) {
              const sample = [huongUser, phucUser, lanUser, ducUser].slice(0, others);
              names.push(...sample.map(u => u.name.split(" ").pop()!));
            }
            return names.join(", ");
          })()}
        </div>
      )}

      {/* Read Receipt Popup */}
      {readReceiptPopup && (
        <ReadReceiptPopup
          pos={readReceiptPopup.pos}
          msgId={readReceiptPopup.msgId}
          onClose={() => setReadReceiptPopup(null)}
        />
      )}

      {/* Skin Tone Picker */}
      {skinToneEmoji && (
        <SkinTonePicker
          emoji={skinToneEmoji.emoji}
          pos={skinToneEmoji.pos}
          onSelect={(e) => { skinToneEmoji.callback(e); }}
          onClose={() => setSkinToneEmoji(null)}
        />
      )}

      {/* Message Context Menu */}
      {msgContextMenu && (
        <MessageContextMenu
          position={msgContextMenu.pos}
          message={msgContextMenu.msg}
          isOwn={msgContextMenu.msg.sender.id === minhUser.id && !msgContextMenu.msg.sender.isBot}
          isBookmarked={savedMessageIds.has(msgContextMenu.msg.id)}
          onClose={() => setMsgContextMenu(null)}
          onReply={() => { setReplyingTo(msgContextMenu.msg); inputRef.current?.focus(); }}
          onEdit={() => startEditMessage(msgContextMenu.msg)}
          onCopy={() => copyMessageText(msgContextMenu.msg)}
          onPin={() => handleTogglePin(msgContextMenu.msg.id)}
          onForward={() => setForwardingMsg(msgContextMenu.msg)}
          onDelete={() => deleteMessage(msgContextMenu.msg.id)}
          onThread={() => { setActiveThread(msgContextMenu.msg.id); setShowPinnedPanel(false); }}
          onReaction={(emoji) => toggleReaction(msgContextMenu.msg.id, emoji)}
          onEmojiPicker={(e) => openEmojiPicker(msgContextMenu.msg.id, e)}
          onSelect={() => enterSelectionMode(msgContextMenu.msg.id)}
          onBookmark={() => toggleBookmark(msgContextMenu.msg.id)}
          onTranslate={() => toggleTranslate(msgContextMenu.msg.id)}
          isTranslated={translatedMsgIds.has(msgContextMenu.msg.id)}
          showTagTopic={isPersonalChat || isProjectTopicChat}
          onTagTopic={() => { setTagTopicModalMsg(msgContextMenu.msg.id); setMsgContextMenu(null); }}
          showCreateTask={isProjectTopicChat}
          onCreateTask={() => {
            const content = msgContextMenu.msg.content || "";
            setCreateTaskFromMsg({ id: msgContextMenu.msg.id, content });
            setMsgContextMenu(null);
          }}
        />
      )}

      {/* Create Task Modal (from message) */}
      {createTaskFromMsg && (() => {
        const preTitle = createTaskFromMsg.content.length > 80
          ? createTaskFromMsg.content.slice(0, 77) + "..."
          : createTaskFromMsg.content;
        const preTask: Task = {
          id: `t${Date.now()}`,
          title: preTitle,
          description: "",
          status: "todo",
          priority: "normal",
          type: "task",
          tags: [],
          subtasks: [],
          createdAt: new Date().toISOString(),
          projectId: selectedSpace && selectedSpace !== "sp-personal" && selectedSpace !== "sp-channel" && selectedSpace !== "sp-botai" ? selectedSpace : "p1",
          timeEstimate: 0,
          timeSpent: 0,
          dependencies: [],
          watchers: [],
          comments: [],
          activityLog: [],
          checklists: [],
          reporterId: "u1",
          workLogs: [],
        };
        return (
          <TaskModal
            task={preTask}
            isNew={true}
            onClose={() => setCreateTaskFromMsg(null)}
            onSave={(task) => {
              onSaveTaskFromChat?.(task);
              setCreateTaskFromMsg(null);
            }}
          />
        );
      })()}

      {/* Mute Duration Modal */}
      {muteDurationModal && (
        <MuteDurationModal
          topicId={muteDurationModal}
          onClose={() => setMuteDurationModal(null)}
          onSelect={handleMuteDuration}
        />
      )}


      {/* ── Image Gallery Lightbox ── */}
      {lightboxIdx !== null && allChatImages[lightboxIdx] && (() => {
        const current = allChatImages[lightboxIdx];
        const total = allChatImages.length;
        const hasPrev = lightboxIdx > 0;
        const hasNext = lightboxIdx < total - 1;
        return (
          <div
            className="fixed inset-0 z-[70] bg-black/90 flex flex-col"
            onClick={() => setLightboxIdx(null)}
            onTouchStart={e => { lightboxTouchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={e => {
              if (lightboxTouchStartX.current === null) return;
              const dx = e.changedTouches[0].clientX - lightboxTouchStartX.current;
              if (dx < -50) lightboxNext();
              else if (dx > 50) lightboxPrev();
              lightboxTouchStartX.current = null;
            }}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={e => e.stopPropagation()}>
              <p className="text-white/60 text-[13px]">{lightboxIdx + 1} / {total}</p>
              {current.caption && <p className="text-white/80 text-[13px] truncate max-w-[60%] text-center">{current.caption}</p>}
              <button onClick={() => setLightboxIdx(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Main image area */}
            <div className="flex-1 flex items-center justify-center relative min-h-0 px-16">
              {/* Prev button */}
              {hasPrev && (
                <button
                  onClick={e => { e.stopPropagation(); lightboxPrev(); }}
                  className="absolute left-3 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all z-10 backdrop-blur-sm"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <img
                src={current.url}
                alt={current.caption || "Image"}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
                style={{ maxHeight: "calc(100vh - 160px)" }}
                onClick={e => e.stopPropagation()}
                draggable={false}
              />

              {/* Next button */}
              {hasNext && (
                <button
                  onClick={e => { e.stopPropagation(); lightboxNext(); }}
                  className="absolute right-3 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all z-10 backdrop-blur-sm"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Bottom: thumbnails + actions */}
            <div className="shrink-0 pb-4 pt-3" onClick={e => e.stopPropagation()}>
              {/* Thumbnail strip */}
              {total > 1 && (
                <div className="flex items-center justify-center gap-1.5 px-4 mb-3 overflow-x-auto">
                  {allChatImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setLightboxIdx(i)}
                      className={`shrink-0 w-10 h-10 rounded-md overflow-hidden border-2 transition-all ${i === lightboxIdx ? "border-white scale-110" : "border-transparent opacity-50 hover:opacity-80"}`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              {/* Actions */}
              <div className="flex items-center justify-center gap-2">
                <a
                  href={current.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-[12px] rounded-lg flex items-center gap-2 backdrop-blur-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Tải về
                </a>
                <button
                  onClick={e => { e.stopPropagation(); copyToClipboard(current.url).then(() => toast.success("Đã sao chép liên kết")); }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-[12px] rounded-lg flex items-center gap-2 backdrop-blur-sm transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" /> Sao chép link
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* "Opened in new window" toast */}
      {openedNewWindow && (
        <div className="fixed bottom-[80px] md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-[13px] animate-[fadeInUp_0.3s_ease]">
          <ExternalLink className="w-4 h-4 text-cyan-400" />
          Đã mở chủ đề trong cửa sổ mới
        </div>
      )}

      {/* ── Announce Form Modal ── */}
      {announceFormOpen && onPublishAnnouncement && (() => {
        type ChCfg = { title: string; subtitle: string; iconBg: string; iconColor: string; descPlaceholder: string; submitLabel: string; badges: string[]; publisherLabel: string; badgeLabel: string; statsTitle: string; statRows: [string,string][]; injectLabel: string };
        const chFormCfg: Record<string, ChCfg> = {
          "ch-announce": { title: "Tạo thông báo mới", subtitle: "Kênh Thông báo chung", iconBg: "bg-amber-100", iconColor: "text-amber-600", descPlaceholder: "Nội dung chi tiết của thông báo...", submitLabel: "Đăng thông báo", badges: ["Thông báo","Quan trọng","Khẩn cấp","Thông tin","Sự kiện","Cập nhật"], publisherLabel: "Người đăng", badgeLabel: "Mức độ", statsTitle: "Thông tin nổi bật", statRows: [["Mục tiêu","Giá trị (vd: 15 tỷ)"],["Chỉ số","Giá trị"],["Khác","Giá trị"]], injectLabel: "Gần đây" },
          "ch-tech":     { title: "Chia sẻ lên Tech Talk", subtitle: "Kênh Kỹ thuật", iconBg: "bg-blue-100", iconColor: "text-blue-600", descPlaceholder: "Mô tả bài viết kỹ thuật, công nghệ, thảo luận...", submitLabel: "Đăng bài viết", badges: ["Bài viết","Hot","Tutorial","Thảo luận"], publisherLabel: "Tác giả", badgeLabel: "Loại bài", statsTitle: "Tech stack & Tags", statRows: [["Ngôn ngữ / Framework","vd: React, TypeScript"],["Thời gian đọc","vd: 5 phút"],["Độ khó","vd: Trung bình"]], injectLabel: "Trending" },
          "ch-workshop": { title: "Tạo sự kiện Workshop", subtitle: "Kênh Workshop & Đào tạo", iconBg: "bg-green-100", iconColor: "text-green-600", descPlaceholder: "Mô tả nội dung workshop, mục tiêu học tập...", submitLabel: "Đăng sự kiện", badges: ["Sắp diễn ra","Đăng ký mở","Miễn phí","Online"], publisherLabel: "Diễn giả / Tổ chức", badgeLabel: "Trạng thái", statsTitle: "Thời gian & Địa điểm", statRows: [["Ngày giờ","vd: 21/04 • 14:00-16:00"],["Địa điểm","vd: Phòng A101 / Online"],["Số lượng tối đa","vd: 50 người"]], injectLabel: "Sắp diễn ra" },
          "ch-culture":  { title: "Đăng lên Culture Hub", subtitle: "Kênh Văn hóa & Nội bộ", iconBg: "bg-purple-100", iconColor: "text-purple-600", descPlaceholder: "Chia sẻ hoạt động văn hóa, vinh danh, giá trị công ty...", submitLabel: "Đăng bài", badges: ["Sự kiện","Vinh danh","Hoạt động","Team Building"], publisherLabel: "Ban tổ chức", badgeLabel: "Loại", statsTitle: "Chi tiết sự kiện", statRows: [["Ngày tổ chức","vd: 05-07/04/2026"],["Địa điểm","vd: Đà Lạt"],["Số người tham gia","vd: 120 người"]], injectLabel: "Sự kiện sắp tới" },
          "ch-hr":       { title: "Đăng tin Nhân sự", subtitle: "Kênh Nhân sự & Tuyển dụng", iconBg: "bg-sky-100", iconColor: "text-sky-600", descPlaceholder: "Thông tin tuyển dụng, onboarding, chính sách...", submitLabel: "Đăng tin", badges: ["Tuyển dụng","Onboarding","Chính sách","Đào tạo"], publisherLabel: "Bộ phận / Phòng ban", badgeLabel: "Loại", statsTitle: "Thông tin vị trí", statRows: [["Kinh nghiệm yêu cầu","vd: 3+ năm"],["Mức lương","vd: Thỏa thuận"],["Địa điểm làm việc","vd: HCM / Hybrid"]], injectLabel: "Đang tuyển" },
          "ch-random":   { title: "Chia sẻ lên Random", subtitle: "Kênh Linh tinh & Vui vẻ", iconBg: "bg-orange-100", iconColor: "text-orange-600", descPlaceholder: "Chia sẻ chuyện hay, meme, thảo luận tự do...", submitLabel: "Chia sẻ ngay", badges: ["Hot","Meme","Thảo luận","Chia sẻ hay"], publisherLabel: "Người đăng", badgeLabel: "Loại", statsTitle: "Chi tiết thêm", statRows: [["Tag","vd: #fun #team"],["Nguồn","vd: Reddit / tự viết"],["Liên kết","vd: https://..."]], injectLabel: "Đang hot" },
          "ch-health":   { title: "Đăng hoạt động Sức khỏe", subtitle: "Kênh Sức khỏe & Thể thao", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", descPlaceholder: "Thông tin hoạt động thể thao, yoga, dinh dưỡng...", submitLabel: "Đăng hoạt động", badges: ["Sắp diễn ra","Thể thao","Yoga & Thiền","Dinh dưỡng"], publisherLabel: "Người tổ chức / CLB", badgeLabel: "Loại hoạt động", statsTitle: "Thông tin hoạt động", statRows: [["Ngày giờ","vd: 12/04 • 07:00"],["Địa điểm","vd: Công viên Gia Định"],["Số chỗ còn lại","vd: 28/50"]], injectLabel: "Hoạt động sắp tới" },
          "ch-finance":  { title: "Đăng báo cáo Tài chính", subtitle: "Kênh Tài chính & Kế toán", iconBg: "bg-indigo-100", iconColor: "text-indigo-600", descPlaceholder: "Nội dung báo cáo, phân tích, nhận xét tài chính...", submitLabel: "Đăng báo cáo", badges: ["Báo cáo","Hóa đơn","Ngân sách","Quan trọng"], publisherLabel: "Bộ phận / Phụ trách", badgeLabel: "Loại báo cáo", statsTitle: "Số liệu tài chính", statRows: [["Chỉ tiêu","vd: Doanh thu tháng 3"],["Giá trị thực","vd: 4.5 tỷ"],["So sánh / Tăng trưởng","vd: +8% so T2"]], injectLabel: "Tổng quan tài chính" },
          "ch-support":  { title: "Đăng thông báo CSKH", subtitle: "Kênh Chăm sóc khách hàng", iconBg: "bg-pink-100", iconColor: "text-pink-600", descPlaceholder: "Thông báo nội bộ, quy trình, tài nguyên hỗ trợ...", submitLabel: "Đăng thông báo", badges: ["Quan trọng","Quy trình","Cập nhật","Tài nguyên"], publisherLabel: "Team Lead / Phụ trách", badgeLabel: "Loại", statsTitle: "Thông tin chi tiết", statRows: [["Áp dụng từ","vd: 15/04/2026"],["Phạm vi áp dụng","vd: Tất cả agents"],["Liên hệ","vd: lead@support"]], injectLabel: "Thông báo kênh" },
        };
        const cfg = chFormCfg[selectedChannel ?? ""] ?? chFormCfg["ch-announce"];
        return (
        <div className="absolute inset-0 bg-black/40 z-50 flex items-end" onClick={() => setAnnounceFormOpen(false)}>
          <div className="bg-white rounded-t-2xl w-full shadow-2xl max-h-[92%] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl ${cfg.iconBg} flex items-center justify-center`}>
                  <Megaphone className={`w-4 h-4 ${cfg.iconColor}`} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-gray-800">{cfg.title}</p>
                  <p className="text-[10px] text-gray-400">{cfg.subtitle}</p>
                </div>
              </div>
              <button onClick={() => setAnnounceFormOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

              {/* ── 1. Tiêu đề & Icon ── */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tiêu đề & Icon</p>
                </div>
                <div className="p-3 space-y-2.5">
                  <div className="flex gap-2">
                    <div className="shrink-0">
                      <p className="text-[10px] text-gray-400 mb-1">Icon</p>
                      <input value={announceForm.emoji} onChange={e => setAnnounceForm(f => ({ ...f, emoji: e.target.value }))}
                        className="w-12 h-10 border border-gray-200 rounded-xl text-center text-[20px] focus:outline-none focus:border-amber-400 bg-gray-50" maxLength={2} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-400 mb-1">Tiêu đề <span className="text-red-400">*</span></p>
                      <input value={announceForm.title} onChange={e => setAnnounceForm(f => ({ ...f, title: e.target.value }))}
                        placeholder={`Nhập tiêu đề ${selectedChannel === "ch-tech" ? "bài viết" : selectedChannel === "ch-workshop" || selectedChannel === "ch-health" ? "sự kiện / hoạt động" : selectedChannel === "ch-hr" ? "tin tuyển dụng" : selectedChannel === "ch-finance" ? "báo cáo" : "thông báo"}...`}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 2. Thông tin cơ bản ── */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Thông tin cơ bản</p>
                </div>
                <div className="p-3 space-y-2.5">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">{cfg.publisherLabel}</p>
                    <input value={announceForm.publishedBy} onChange={e => setAnnounceForm(f => ({ ...f, publishedBy: e.target.value }))}
                      placeholder={`Nhập ${cfg.publisherLabel.toLowerCase()}...`}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[12px] text-gray-700 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1">Danh mục</p>
                      {addCatMode ? (
                        <div className="flex gap-1.5">
                          <input autoFocus value={newCatInput} onChange={e => setNewCatInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter" && newCatInput.trim()) { onAddCategory?.(newCatInput.trim()); setAnnounceForm(f => ({ ...f, category: newCatInput.trim() })); setNewCatInput(""); setAddCatMode(false); }
                              if (e.key === "Escape") { setAddCatMode(false); setNewCatInput(""); }
                            }}
                            placeholder="Tên phân loại mới..."
                            className="flex-1 min-w-0 border border-amber-300 rounded-xl px-2.5 py-2 text-[12px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-200 bg-amber-50/50" />
                          <button disabled={!newCatInput.trim()} onClick={() => { if (!newCatInput.trim()) return; onAddCategory?.(newCatInput.trim()); setAnnounceForm(f => ({ ...f, category: newCatInput.trim() })); setNewCatInput(""); setAddCatMode(false); }}
                            className={`px-2 rounded-xl text-[11px] font-bold ${newCatInput.trim() ? "bg-amber-400 text-white" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}>✓</button>
                          <button onClick={() => { setAddCatMode(false); setNewCatInput(""); }} className="px-2 rounded-xl text-[11px] text-gray-400 hover:bg-gray-100">✕</button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          <select value={announceForm.category} onChange={e => setAnnounceForm(f => ({ ...f, category: e.target.value }))}
                            className="flex-1 min-w-0 border border-gray-200 rounded-xl px-2.5 py-2 text-[12px] text-gray-700 bg-white focus:outline-none focus:border-amber-400">
                            {(categories && categories.length > 0 ? categories : ["Kinh doanh & Chiến lược", "Chính sách & Quy định", "Sự kiện & Hoạt động", "Nhân sự & Tuyển dụng"]).map(cat => (
                              <option key={cat}>{cat}</option>
                            ))}
                          </select>
                          <button title="Thêm phân loại mới" onClick={() => setAddCatMode(true)}
                            className="w-8 h-[34px] flex items-center justify-center rounded-xl border border-dashed border-amber-300 text-amber-500 hover:bg-amber-50 text-[16px] shrink-0">+</button>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1">{cfg.badgeLabel}</p>
                      <select value={announceForm.badge} onChange={e => setAnnounceForm(f => ({ ...f, badge: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-2.5 py-2 text-[12px] text-gray-700 bg-white focus:outline-none focus:border-amber-400">
                        {cfg.badges.map(b => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 3. Mô tả chi tiết ── */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Mô tả chi tiết</p>
                </div>
                <div className="p-3">
                  <textarea value={announceForm.description} onChange={e => setAnnounceForm(f => ({ ...f, description: e.target.value }))}
                    placeholder={cfg.descPlaceholder}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[12px] text-gray-700 resize-none focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200" />
                </div>
              </div>

              {/* ── 4. Thông tin nổi bật ── */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{cfg.statsTitle}</p>
                  <span className="text-[10px] text-gray-400">Tối đa 3 mục</span>
                </div>
                <div className="p-3 space-y-2">
                  {([["s1l","s1v"],["s2l","s2v"],["s3l","s3v"]] as [keyof typeof announceForm, keyof typeof announceForm][]).map(([lk, vk], i) => (
                    <div key={i} className="grid grid-cols-2 gap-2">
                      <input value={announceForm[lk]} onChange={e => setAnnounceForm(f => ({ ...f, [lk]: e.target.value }))}
                        placeholder={cfg.statRows[i]?.[0] ?? `Nhãn ${i+1}`}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-[12px] text-gray-700 focus:outline-none focus:border-amber-400" />
                      <input value={announceForm[vk]} onChange={e => setAnnounceForm(f => ({ ...f, [vk]: e.target.value }))}
                        placeholder={cfg.statRows[i]?.[1] ?? `Giá trị ${i+1}`}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-[12px] text-gray-700 focus:outline-none focus:border-amber-400" />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 5. Tệp đính kèm ── */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tệp đính kèm <span className="normal-case font-normal text-gray-300">(tuỳ chọn)</span></p>
                </div>
                <div className="p-3">
                  <input value={announceForm.attachment} onChange={e => setAnnounceForm(f => ({ ...f, attachment: e.target.value }))}
                    placeholder="Tên file (vd: Kế hoạch Q2.pdf)"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[12px] text-gray-700 focus:outline-none focus:border-amber-400" />
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 flex gap-2 shrink-0">
              <button onClick={() => setAnnounceFormOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-[12px] font-medium hover:bg-gray-50 transition-all">
                Huỷ
              </button>
              <button
                disabled={!announceForm.title.trim()}
                onClick={() => {
                  const stats = [
                    announceForm.s1l && announceForm.s1v ? { label: announceForm.s1l, value: announceForm.s1v } : null,
                    announceForm.s2l && announceForm.s2v ? { label: announceForm.s2l, value: announceForm.s2v } : null,
                    announceForm.s3l && announceForm.s3v ? { label: announceForm.s3l, value: announceForm.s3v } : null,
                  ].filter(Boolean) as { label: string; value: string }[];
                  onPublishAnnouncement!(announceForm.title.trim(), announceForm.emoji, announceForm.category, announceForm.badge, announceForm.description, stats, announceForm.attachment, announceForm.publishedBy);
                  const nowAnn = new Date();
                  const fmtAnn = (h: number, m: number) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                  setMessages(prev => [...prev, {
                    id: `ann-${Date.now()}`,
                    type: "announcement_card" as const,
                    sender: { id: "u1", name: announceForm.publishedBy || "Nguyễn Minh", color: "#0891b2" },
                    content: announceForm.title.trim(),
                    timestamp: fmtAnn(nowAnn.getHours(), nowAnn.getMinutes()),
                    topicId: activeTopic,
                    announcementData: {
                      title: announceForm.title.trim(),
                      emoji: announceForm.emoji,
                      category: announceForm.category,
                      badge: announceForm.badge,
                      description: announceForm.description,
                      stats,
                    },
                  }]);
                  toast.success(cfg.submitLabel, { description: `"${announceForm.title.trim()}" xuất hiện trong mục ${cfg.injectLabel}` });
                  setAnnounceFormOpen(false);
                }}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition-all ${announceForm.title.trim() ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                {cfg.submitLabel}
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}

/* ============== MUTE DURATION MODAL ============== */
function MuteDurationModal({
  topicId,
  onClose,
  onSelect,
}: {
  topicId: string;
  onClose: () => void;
  onSelect: (topicId: string, duration: string) => void;
}) {
  const durations = [
    { label: "30 phút", value: "30 phút" },
    { label: "1 giờ", value: "1 giờ" },
    { label: "4 giờ", value: "4 giờ" },
    { label: "8 giờ", value: "8 giờ" },
    { label: "1 ngày", value: "1 ngày" },
    { label: "3 ngày", value: "3 ngày" },
    { label: "1 tuần", value: "1 tuần" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:w-[300px] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
            <BellOff className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <h3 className="text-[15px] text-gray-900">Tắt thông báo trong...</h3>
            <p className="text-[11px] text-gray-500">Chọn thời gian tắt thông báo</p>
          </div>
        </div>
        <div className="px-3 pb-2">
          {durations.map(d => (
            <button
              key={d.value}
              onClick={() => onSelect(topicId, d.value)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 rounded-lg transition-all text-left"
            >
              <Clock className="w-4 h-4 text-gray-400" />
              {d.label}
            </button>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-gray-100">
          <button onClick={onClose} className="w-full py-2 text-[13px] text-gray-500 hover:bg-gray-50 rounded-lg transition-all">
            Huỷ bỏ
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Sub-components ---- */

function InputEmojiPanel({
  onSelect,
  searchQuery,
  onSearchChange,
}: {
  onSelect: (emoji: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}) {
  const [activeTab, setActiveTab] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Simple emoji search by matching label keywords
  const emojiSearchMap: Record<string, string[]> = {
    "cười": ["😀","😂","🤣","😄","😆","😊","😁"],
    "buồn": ["😢","😭","😞","😔","🥺"],
    "tim": ["❤️","💕","💖","💗","💙","💚","💛"],
    "lửa": ["🔥","🌟","⚡","💥"],
    "tay": ["👍","👎","👏","🤝","✌️","🤞","👋"],
    "hoa": ["🌸","🌹","🌺","🌻","🌼","💐"],
    "ok": ["👌","✅","👍","🆗"],
    "vui": ["🎉","🥳","😄","🎊","🤗"],
    "giận": ["😡","🤬","😤","💢"],
    "sợ": ["😱","😨","😰","🫣"],
  };

  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const results: string[] = [];
    // Search in map
    for (const [key, emojis] of Object.entries(emojiSearchMap)) {
      if (key.includes(q)) results.push(...emojis);
    }
    // Also search in all categories
    for (const cat of emojiCategories) {
      if (cat.label.toLowerCase().includes(q)) {
        results.push(...cat.emojis.slice(0, 16));
      }
    }
    return [...new Set(results)];
  }, [searchQuery]);

  return (
    <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl border border-gray-200 shadow-2xl w-[320px] z-30 overflow-hidden">
      {/* Search bar */}
      <div className="px-2.5 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Tìm emoji..."
            className="flex-1 text-[12px] text-gray-700 placeholder-gray-400 outline-none bg-transparent"
            autoFocus
          />
          {searchQuery && (
            <button onClick={() => onSearchChange("")} className="text-gray-400 hover:text-gray-600">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Quick reactions */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100">
        {quickReactions.map(e => (
          <button key={e} onClick={() => onSelect(e)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[18px] hover:bg-gray-100 hover:scale-110 transition-all">{e}</button>
        ))}
      </div>

      {filteredEmojis ? (
        /* Search results */
        <div className="px-2 py-1.5 h-[200px] overflow-y-auto">
          {filteredEmojis.length > 0 ? (
            <>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 px-0.5">Kết quả tìm kiếm</p>
              <div className="grid grid-cols-8 gap-0.5">
                {filteredEmojis.map((e, i) => (
                  <button key={`search-${e}-${i}`} onClick={() => onSelect(e)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[17px] hover:bg-gray-100 hover:scale-110 transition-all">{e}</button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-[12px]">
              Không tìm thấy emoji
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Category tabs */}
          <div className="flex items-center gap-0.5 px-2 py-1 border-b border-gray-100 overflow-x-auto">
            {emojiCategories.map((cat, i) => (
              <button key={cat.label} onClick={() => setActiveTab(i)}
                className={`w-7 h-7 rounded-md flex items-center justify-center text-[14px] shrink-0 transition-all ${activeTab === i ? "bg-cyan-50" : "hover:bg-gray-100"}`}>
                {cat.icon}
              </button>
            ))}
          </div>
          {/* Emoji grid */}
          <div className="px-2 py-1.5 h-[200px] overflow-y-auto">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 px-0.5">{emojiCategories[activeTab]?.label}</p>
            <div className="grid grid-cols-8 gap-0.5">
              {emojiCategories[activeTab]?.emojis.map((e, i) => (
                <button key={`input-${e}-${i}`} onClick={() => onSelect(e)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[17px] hover:bg-gray-100 hover:scale-110 transition-all">{e}</button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function VoiceMessageBubble({
  duration,
  waveform,
  timestamp,
  isOwn,
  readStatus,
}: {
  duration: number;
  waveform: number[];
  timestamp: string;
  isOwn: boolean;
  readStatus: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const waveformRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 1) { setPlaying(false); return 0; }
        return p + (playbackSpeed / (duration * 10));
      });
    }, 100);
    return () => clearInterval(interval);
  }, [playing, duration, playbackSpeed]);

  const fmtDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaybackSpeed(prev => prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1);
  };

  const [isDragging, setIsDragging] = useState(false);

  const calcProgress = (clientX: number) => {
    if (!waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const newProgress = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setProgress(newProgress);
  };

  const handleWaveformClick = (e: React.MouseEvent) => calcProgress(e.clientX);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    calcProgress(e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => calcProgress(e.clientX);
    const handleUp = () => setIsDragging(false);
    const handleTouchMove = (e: TouchEvent) => { if (e.touches[0]) calcProgress(e.touches[0].clientX); };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleUp);
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); window.removeEventListener("touchmove", handleTouchMove); window.removeEventListener("touchend", handleUp); };
  }, [isDragging]);

  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <button
        onClick={(e) => { e.stopPropagation(); setPlaying(!playing); if (!playing && progress >= 1) setProgress(0); }}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
          isOwn ? "bg-teal-500 text-white hover:bg-teal-600" : "bg-cyan-500 text-white hover:bg-cyan-600"
        }`}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div ref={waveformRef} className={`flex items-end gap-[2px] h-[28px] select-none ${isDragging ? "cursor-grabbing" : "cursor-pointer"}`} onClick={handleWaveformClick} onMouseDown={handleMouseDown} onTouchStart={(e) => { e.preventDefault(); setIsDragging(true); if (e.touches[0]) calcProgress(e.touches[0].clientX); }}>
          {waveform.map((v, i) => {
            const isPlayed = i / waveform.length <= progress;
            return (
              <div
                key={i}
                className={`w-[3px] rounded-full transition-all duration-150 ${
                  isPlayed
                    ? isOwn ? "bg-teal-600" : "bg-cyan-600"
                    : isOwn ? "bg-teal-300" : "bg-cyan-200"
                }`}
                style={{
                  height: `${Math.max(v * 24, 4)}px`,
                  transform: playing && isPlayed && Math.abs(i / waveform.length - progress) < 0.05 ? "scaleY(1.2)" : "scaleY(1)",
                }}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500">
              {(playing || isDragging || progress > 0) ? fmtDuration(Math.floor(progress * duration)) : fmtDuration(duration)}
            </span>
            {(playing || playbackSpeed !== 1) && (
              <button onClick={cycleSpeed}
                className={`text-[8px] px-1 py-0.5 rounded ${isOwn ? "bg-teal-100 text-teal-600" : "bg-cyan-100 text-cyan-600"} transition-all hover:opacity-80`}>
                {playbackSpeed}×
              </button>
            )}
          </div>
          <span className="flex items-center gap-0.5">
            <span className={`text-[10px] ${isOwn ? "text-teal-600/60" : "text-gray-400"}`}>{timestamp}</span>
            {isOwn && (
              <span className={readStatus === "read" ? "check-read" : "check-delivered"}>
                {readStatus === "sent" ? <Check className="w-3 h-3" /> : <CheckCheck className="w-3 h-3" />}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============== BOT CODE BLOCK ============== */
function BotCodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl bg-gray-900 overflow-hidden my-2 text-left">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-b border-gray-700">
        <span className="text-[10px] text-gray-400 font-mono">{language || "code"}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-200 transition-colors">
          {copied ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Đã sao chép</span></> : <><Copy className="w-3 h-3" />Sao chép</>}
        </button>
      </div>
      <pre className="px-4 py-3 text-[11px] text-gray-100 overflow-x-auto font-mono leading-relaxed whitespace-pre">{code}</pre>
    </div>
  );
}

function renderBotContent(content: string): React.ReactNode[] {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    const codeMatch = part.match(/```(\w*)\n?([\s\S]*?)```/);
    if (codeMatch) {
      return <BotCodeBlock key={i} language={codeMatch[1] || "code"} code={codeMatch[2].trim()} />;
    }
    return (
      <span key={i} dangerouslySetInnerHTML={{
        __html: part
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\n/g, "<br/>")
      }} />
    );
  });
}

function FormattedContent({ content }: { content: string }) {
  // Match **bold**, `code`, and @Name (supports Vietnamese diacritics + multi-word names)
  const parts = content.split(/(\*\*.*?\*\*|`.*?`|@[^\s@]+(?:\s[^\s@,.:!?;]+)?)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="text-gray-800">{part.slice(2, -2)}</strong>;
        if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="bg-gray-100 text-cyan-600 px-1.5 py-0.5 rounded text-[12px]">{part.slice(1, -1)}</code>;
        if (part.startsWith("@") && part.length > 1) return <span key={i} className="bg-cyan-50 text-cyan-600 px-1 rounded cursor-pointer hover:bg-cyan-100 transition-colors">{part}</span>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/* ============== SHARED NOTIFICATION DATA ============== */
export interface AppNotification {
  id: number;
  text: string;
  detail: string;
  time: string;
  module: "personal" | "channel" | "project";
  read: boolean;
  navigate?: { space: string; view?: string; chatId?: string; channelId?: string };
}

export const mockNotifications: AppNotification[] = [
  { id: 1, text: "Trần Hương mentioned you", detail: "Review mockup trang Products", time: "5 phút", module: "personal", read: false, navigate: { space: "sp-personal", chatId: "pc-dm-huong" } },
  { id: 2, text: "PR #142 cần review", detail: "Auth JWT refresh token flow", time: "1 giờ", module: "project", read: false, navigate: { space: "p1", view: "chat" } },
  { id: 3, text: "Task 'Authentication' sắp hết hạn", detail: "Deadline: 18/03/2026", time: "2 giờ", module: "project", read: false, navigate: { space: "p1", view: "list" } },
  { id: 4, text: "Lê Phúc hoàn thành CI/CD setup", detail: "Build time: 4-5 phút", time: "3 giờ", module: "project", read: true, navigate: { space: "p1", view: "chat" } },
  { id: 5, text: "Phạm Lan commented", detail: "LGTM! Nhớ backup trước khi migrate", time: "4 giờ", module: "channel", read: true, navigate: { space: "sp-channel", channelId: "ch-tech" } },
  { id: 6, text: "Minh đã nhắn tin cho bạn", detail: "Cập nhật về dự án VWork Pro", time: "30 phút", module: "personal", read: false, navigate: { space: "sp-personal", chatId: "cg2" } },
  { id: 7, text: "Kênh Tech Talk có tin mới", detail: "Chia sẻ kiến thức về React hooks", time: "2 giờ", module: "channel", read: true, navigate: { space: "sp-channel", channelId: "ch-tech" } },
];

/* ============== NOTIFICATION PANEL ============== */
export function NotificationPanel({ onClose, onNavigate }: {
  onClose: () => void;
  onNavigate: (space: string, view?: string, chatId?: string, channelId?: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | "personal" | "channel" | "project">("all");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const filtered = mockNotifications.filter(n => filter === "all" || n.module === filter);
  const unread = mockNotifications.filter(n => !n.read).length;

  const moduleIcon = (module: string) => {
    if (module === "personal") return <User className="w-3.5 h-3.5 text-cyan-600" />;
    if (module === "channel") return <Hash className="w-3.5 h-3.5 text-indigo-600" />;
    return <Zap className="w-3.5 h-3.5 text-amber-500" />;
  };

  const moduleBg: Record<string, string> = {
    personal: "#ecfeff",
    channel: "#eef2ff",
    project: "#fefce8",
  };

  const filterTabs = [
    { key: "all" as const, label: "Tất cả" },
    { key: "personal" as const, label: "Cá nhân" },
    { key: "channel" as const, label: "Kênh" },
    { key: "project" as const, label: "Dự án" },
  ];

  return (
    <div
      ref={ref}
      className="fixed top-[48px] right-2 z-[100] w-[360px] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col"
      style={{ animation: "fadeInScale 0.15s ease", maxHeight: "calc(100vh - 60px)" }}
    >
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-semibold text-gray-800">Thông báo</h3>
          {unread > 0 && (
            <span className="text-[9px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full font-medium">{unread} mới</span>
          )}
        </div>
        <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
              filter === tab.key ? "bg-cyan-500 text-white" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="py-10 text-center">
            <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-[12px] text-gray-400">Không có thông báo</p>
          </div>
        )}
        {filtered.map(n => (
          <div
            key={n.id}
            onClick={() => { if (n.navigate) onNavigate(n.navigate.space, n.navigate.view, n.navigate.chatId, n.navigate.channelId); onClose(); }}
            className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-all border-b border-gray-50 ${!n.read ? "bg-cyan-50/30" : ""}`}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: moduleBg[n.module] }}>
              {moduleIcon(n.module)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[12px] leading-snug ${!n.read ? "text-gray-800 font-medium" : "text-gray-600"}`}>{n.text}</p>
              <p className="text-[11px] text-gray-400 truncate mt-0.5">{n.detail}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="text-[9px] text-gray-400 whitespace-nowrap">{n.time}</span>
              {!n.read && <div className="w-2 h-2 rounded-full bg-cyan-500" />}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
