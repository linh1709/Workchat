import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { copyToClipboard } from "./clipboard";
import {
  X, Search, TrendingUp, FileText, DollarSign, Receipt, PieChart,
  Calendar, Star, Trophy, PartyPopper, Heart, Gift,
  Ticket, AlertTriangle, CheckCircle2, Clock, Flame, ArrowUpRight,
  GraduationCap, Video, BookOpen, Presentation,
  Megaphone, Pin, Bell, Info,
  Code2, Cpu, Globe, Database, Smartphone,
  Briefcase, UserPlus, FileCheck, BookMarked,
  MessageCircle, ThumbsUp, Sparkles, Dice5,
  Dumbbell, Bike, Salad, Footprints,
  Rocket, Target, Lightbulb, Bug, BarChart3,
  Shield, Lock, AlertCircle, Eye, KeyRound,
  ChevronDown, Users, MoreHorizontal, Pencil, Trash2
} from "lucide-react";

/* ═══════════ Shared Types ═══════════ */
interface SidebarItem {
  id: string;
  name: string;
  emoji?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeColor?: string;
  subtitle?: string;
  status?: string;
  filterTag?: string;
  indent?: boolean;
}

interface SidebarGroup {
  key: string;
  label: string;
  items: SidebarItem[];
}

/* ═══════════ Channel Data ═══════════ */

// ── ch-crm ──
const crmGroups: SidebarGroup[] = [
  {
    key: "customers", label: "QUẢN LÝ KHÁCH HÀNG",
    items: [
      { id: "crm-companies", name: "Công ty",  emoji: "🏢", badge: 21 },
      { id: "crm-contacts",  name: "Liên hệ",  emoji: "👤", badge: 14 },
      { id: "crm-leads",     name: "Lead",      emoji: "🎯", badge: 12 },
    ]
  },
  {
    key: "deals", label: "CƠ HỘI BÁN HÀNG",
    items: [
      { id: "crm-pipeline", name: "Pipeline (Kanban)", emoji: "📊" },
      { id: "crm-opps",     name: "Tất cả cơ hội",    emoji: "💼", badge: 9 },
    ]
  },
  {
    key: "reports", label: "BÁO CÁO",
    items: [
      { id: "crm-report-revenue",    name: "Doanh thu",         emoji: "📈" },
      { id: "crm-report-conversion", name: "Tỉ lệ chuyển đổi", emoji: "🔄" },
      { id: "crm-report-perf",       name: "Hiệu suất Sales",   emoji: "🏆" },
    ]
  },
  {
    key: "settings", label: "CÀI ĐẶT",
    items: [
      { id: "crm-settings-products", name: "Sản phẩm / Dịch vụ", emoji: "📦" },
      { id: "crm-settings-sources",  name: "Nguồn Lead",           emoji: "🌐" },
      { id: "crm-settings-users",    name: "Người dùng CRM",       emoji: "👥" },
    ]
  }
];

// ── ch-finance ──
const financeGroups: SidebarGroup[] = [
  {
    key: "overview", label: "TỔNG QUAN TÀI CHÍNH",
    items: [
      { id: "fi-revenue", name: "Doanh thu", emoji: "📈", filterTag: "overview" },
      { id: "fi-expense", name: "Chi phí", emoji: "💸", filterTag: "overview" },
      { id: "fi-profit", name: "Lợi nhuận", emoji: "💰", filterTag: "overview" },
      { id: "fi-cashflow", name: "Dòng tiền", emoji: "🔄", filterTag: "overview" },
      { id: "fi-debt", name: "Công nợ", emoji: "📋", filterTag: "overview" },
      { id: "fi-taxreport", name: "Thuế", emoji: "🏛️", filterTag: "overview" },
      { id: "fi-budget", name: "Tổng quan ngân sách", emoji: "🎯", filterTag: "overview" },
    ]
  },
  {
    key: "payments", label: "QUẢN LÝ THANH TOÁN",
    items: [
      { id: "fi-invoice", name: "Hóa đơn", emoji: "🧾", badge: 15, badgeColor: "bg-blue-100 text-blue-600", filterTag: "payment" },
      { id: "fi-payment", name: "Thanh toán", emoji: "💳", filterTag: "payment" },
    ]
  },
];

const chatKenhFilter = { id: "chat", label: "Chat kênh", icon: <MessageCircle className="w-4 h-4" />, count: undefined as number | undefined };

const financeQuickFilters = [
  chatKenhFilter,
  { id: "overview", label: "Tổng quan tài chính", icon: <PieChart className="w-4 h-4" />, count: undefined },
  { id: "payment", label: "Quản lý thanh toán", icon: <Receipt className="w-4 h-4" />, count: 15 },
];

// ── ch-culture ──
const cultureGroups: SidebarGroup[] = [
  {
    key: "events", label: "SỰ KIỆN SẮP TỚI",
    items: [
      { id: "cu-teambuilding", name: "Team building Đà Lạt", emoji: "🏕️", subtitle: "05-07/04/2026", badge: "Hot", badgeColor: "bg-red-100 text-red-600" },
      { id: "cu-birthday", name: "Sinh nhật tháng 4", emoji: "🎂", subtitle: "15/04/2026", badge: 3 },
      { id: "cu-sports", name: "Giải bóng đá mini", emoji: "⚽", subtitle: "20/04/2026" },
      { id: "cu-party", name: "Friday Happy Hour", emoji: "🍻", subtitle: "Thứ 6 hàng tuần" },
    ]
  },
  {
    key: "values", label: "GIÁ TRỊ CỐT LÕI",
    items: [
      { id: "cu-innovation", name: "Đổi mới sáng tạo", emoji: "💡" },
      { id: "cu-teamwork", name: "Tinh thần đồng đội", emoji: "🤝" },
      { id: "cu-growth", name: "Phát triển bản thân", emoji: "🌱" },
      { id: "cu-customer", name: "Khách hàng là trọng tâm", emoji: "❤️" },
    ]
  },
  {
    key: "recognition", label: "VINH DANH",
    items: [
      { id: "cu-employee", name: "Nhân viên xuất sắc T3", emoji: "🏆" },
      { id: "cu-team-award", name: "Team xuất sắc Q1", emoji: "���" },
      { id: "cu-kudos", name: "Bảng Kudos", emoji: "⭐", badge: 28 },
    ]
  }
];

// ── ch-support ──
const supportGroups: SidebarGroup[] = [
  {
    key: "announcements", label: "📌 THÔNG BÁO KÊNH",
    items: [
      { id: "csk-sla",      name: "Chính sách SLA 2026",         emoji: "📋", badge: "Quan trọng", badgeColor: "bg-red-100 text-red-600" },
      { id: "csk-template", name: "Mẫu phản hồi khách hàng",     emoji: "📝", badge: "Cập nhật",   badgeColor: "bg-blue-100 text-blue-600" },
      { id: "csk-kpi",      name: "KPI & Mục tiêu Q2/2026",      emoji: "🎯", badge: "Mới",        badgeColor: "bg-green-100 text-green-600" },
    ]
  },
  {
    key: "kb", label: "CƠ SỞ KIẾN THỨC",
    items: [
      { id: "csk-faq",        name: "FAQ thường gặp",            emoji: "❓", badge: 24 },
      { id: "csk-guide",      name: "Hướng dẫn xử lý ticket",    emoji: "📖" },
      { id: "csk-script",     name: "Script tư vấn & xử lý",     emoji: "🎙️" },
      { id: "csk-escalation", name: "Quy trình leo thang",        emoji: "⚡" },
    ]
  }
];

const supportQuickFilters = [
  chatKenhFilter,
  { id: "all",   label: "Tất cả ticket",       icon: <Ticket className="w-4 h-4" />,        count: 8 },
  { id: "mine",  label: "Được giao cho tôi",   icon: <Users className="w-4 h-4" />,          count: 2 },
];

// ── ch-workshop ──
const workshopGroups: SidebarGroup[] = [
  {
    key: "upcoming", label: "SẮP DIỄN RA",
    items: [
      { id: "ws-docker", name: "Docker cơ bản cho Dev", emoji: "🐳", subtitle: "21/03 • 14:00-16:00", badge: "Đăng ký", badgeColor: "bg-blue-100 text-blue-600" },
      { id: "ws-figma", name: "Figma cho PM", emoji: "🎨", subtitle: "25/03 • 10:00-12:00", badge: "Đăng ký", badgeColor: "bg-blue-100 text-blue-600" },
      { id: "ws-ai", name: "AI & Machine Learning 101", emoji: "🤖", subtitle: "28/03 • 14:00-17:00" },
      { id: "ws-leadership", name: "Leadership Workshop", emoji: "👔", subtitle: "02/04 • 09:00-12:00" },
    ]
  },
  {
    key: "past", label: "ĐÃ DIỄN RA",
    items: [
      { id: "ws-react", name: "React Advanced Patterns", emoji: "⚛️", subtitle: "14/03 • 32 tham dự", badge: "Slide", badgeColor: "bg-gray-100 text-gray-600" },
      { id: "ws-security", name: "Bảo mật ứng dụng web", emoji: "🔐", subtitle: "07/03 • 28 tham dự", badge: "Video", badgeColor: "bg-purple-100 text-purple-600" },
      { id: "ws-agile", name: "Agile & Scrum Master", emoji: "🏃", subtitle: "28/02 • 25 tham dự" },
    ]
  }
];

// ── ch-announce ──
const announceGroups: SidebarGroup[] = [
  {
    key: "pinned", label: "📌 GHIM",
    items: [
      { id: "an-holiday", name: "Lịch nghỉ lễ 30/4 - 1/5", emoji: "🎌", badge: "Quan trọng", badgeColor: "bg-red-100 text-red-600" },
      { id: "an-policy", name: "Chính sách làm việc hybrid mới", emoji: "📜", badge: "Quan trọng", badgeColor: "bg-red-100 text-red-600" },
    ]
  },
  {
    key: "recent", label: "GẦN ĐÂY",
    items: [
      { id: "an-q2plan", name: "Kế hoạch kinh doanh Q2/2026", emoji: "📋", subtitle: "18/03/2026", badge: "Thông báo", badgeColor: "bg-amber-100 text-amber-700" },
      { id: "an-award", name: "Kết quả bình chọn nhân viên Q1", emoji: "🏆", subtitle: "17/03/2026", badge: "Thông báo", badgeColor: "bg-amber-100 text-amber-700" },
      { id: "an-move", name: "Thông báo di chuyển văn phòng", emoji: "🏢", subtitle: "15/03/2026", badge: "Quan trọng", badgeColor: "bg-red-100 text-red-600" },
      { id: "an-salary", name: "Điều chỉnh lương & phúc lợi 2026", emoji: "💼", subtitle: "12/03/2026", badge: "Quan trọng", badgeColor: "bg-red-100 text-red-600" },
      { id: "an-event", name: "Sự kiện công ty Annual Summit", emoji: "🎪", subtitle: "10/03/2026", badge: "Thông báo", badgeColor: "bg-amber-100 text-amber-700" },
    ]
  },
  {
    key: "categories", label: "PHÂN LOẠI",
    items: [
      { id: "an-cat-policy", name: "Chính sách & Quy định", emoji: "📜", badge: 8 },
      { id: "an-cat-event", name: "Sự kiện & Hoạt động", emoji: "🎉", badge: 12 },
      { id: "an-cat-hr", name: "Nhân sự & Tuyển dụng", emoji: "👥", badge: 6 },
      { id: "an-cat-biz", name: "Kinh doanh & Chiến lược", emoji: "📈", badge: 4 },
    ]
  }
];

// ── ch-tech ──
const techGroups: SidebarGroup[] = [
  {
    key: "trending", label: "🔥 TRENDING",
    items: [
      { id: "te-rsc", name: "React Server Components deep dive", emoji: "⚛️", badge: "42 👍", badgeColor: "bg-blue-100 text-blue-600" },
      { id: "te-rust", name: "Tại sao nên học Rust?", emoji: "🦀", badge: "38 👍", badgeColor: "bg-orange-100 text-orange-600" },
      { id: "te-ai-tools", name: "AI Tools cho developer 2026", emoji: "🤖", badge: "35 👍", badgeColor: "bg-purple-100 text-purple-600" },
    ]
  },
  {
    key: "topics", label: "CHỦ ĐỀ",
    items: [
      { id: "te-frontend", name: "Frontend & UI/UX", emoji: "🎨", badge: 15 },
      { id: "te-backend", name: "Backend & API", emoji: "⚙️", badge: 12 },
      { id: "te-devops", name: "DevOps & Cloud", emoji: "☁️", badge: 9 },
      { id: "te-mobile", name: "Mobile Development", emoji: "📱", badge: 7 },
      { id: "te-data", name: "Data & AI/ML", emoji: "🧠", badge: 11 },
      { id: "te-security", name: "Security", emoji: "🔒", badge: 5 },
    ]
  },
  {
    key: "resources", label: "TÀI NGUYÊN",
    items: [
      { id: "te-stack", name: "Tech Stack công ty", emoji: "🏗️" },
      { id: "te-wiki", name: "Developer Wiki", emoji: "📚" },
      { id: "te-coding", name: "Coding Standards", emoji: "📏" },
    ]
  }
];

// ── ch-hr ──
const hrGroups: SidebarGroup[] = [
  {
    key: "hiring", label: "ĐANG TUYỂN",
    items: [
      { id: "hr-fe", name: "Senior Frontend Developer", emoji: "👨‍💻", badge: "5 CV", badgeColor: "bg-blue-100 text-blue-600" },
      { id: "hr-pm", name: "Product Manager", emoji: "📊", badge: "8 CV", badgeColor: "bg-blue-100 text-blue-600" },
      { id: "hr-design", name: "UI/UX Designer", emoji: "🎨", badge: "3 CV", badgeColor: "bg-blue-100 text-blue-600" },
      { id: "hr-data", name: "Data Engineer", emoji: "🔬", badge: "2 CV", badgeColor: "bg-blue-100 text-blue-600" },
    ]
  },
  {
    key: "new", label: "THÀNH VIÊN MỚI",
    items: [
      { id: "hr-new1", name: "Phạm Quốc Bảo - Backend Dev", emoji: "👋", subtitle: "Bắt đầu 17/03/2026" },
      { id: "hr-new2", name: "Lê Thị Hồng Nhung - QA", emoji: "👋", subtitle: "Bắt đầu 17/03/2026" },
    ]
  },
  {
    key: "policies", label: "CHÍNH SÁCH",
    items: [
      { id: "hr-handbook", name: "Sổ tay nhân viên 2026", emoji: "📖" },
      { id: "hr-benefit", name: "Phúc lợi & Đãi ngộ", emoji: "🎁" },
      { id: "hr-eval", name: "Quy trình đánh giá năng lực", emoji: "📋" },
      { id: "hr-career", name: "Lộ trình thăng tiến", emoji: "🪜" },
    ]
  }
];

const hrQuickFilters = [
  chatKenhFilter,
  { id: "overview", label: "Tổng quan nhân sự", icon: <Users className="w-4 h-4" />, count: undefined },
  { id: "onboarding", label: "Đang onboarding", icon: <UserPlus className="w-4 h-4" />, count: 2 },
  { id: "referral", label: "Giới thiệu ứng viên", icon: <Gift className="w-4 h-4" />, count: undefined },
];

// ── ch-random ──
const randomGroups: SidebarGroup[] = [
  {
    key: "hot", label: "🔥 ĐANG HOT",
    items: [
      { id: "ra-cafe", name: "Quán cafe gần công ty", emoji: "☕", badge: "18 💬", badgeColor: "bg-yellow-100 text-yellow-700" },
      { id: "ra-lunch", name: "Trưa nay ăn gì?", emoji: "🍜", badge: "12 💬", badgeColor: "bg-orange-100 text-orange-600" },
      { id: "ra-game", name: "Giải game công ty mùa 3", emoji: "🎮", badge: "9 💬" },
    ]
  },
  {
    key: "polls", label: "📊 BÌNH CHỌN",
    items: [
      { id: "ra-poll1", name: "Team building đi đâu?", emoji: "🗳️", badge: "Đang mở", badgeColor: "bg-green-100 text-green-600" },
      { id: "ra-poll2", name: "Màu áo đồng phục mới", emoji: "👕", badge: "Đang mở", badgeColor: "bg-green-100 text-green-600" },
      { id: "ra-poll3", name: "Nhà hàng cho Year-end party", emoji: "🍽️", badge: "Đã đóng" },
    ]
  },
  {
    key: "fun", label: "VUI VẺ",
    items: [
      { id: "ra-meme", name: "Meme của ngày", emoji: "😂", badge: 5 },
      { id: "ra-pet", name: "Khoe thú cưng", emoji: "🐾", badge: 8 },
      { id: "ra-travel", name: "Ảnh du lịch", emoji: "📸", badge: 14 },
      { id: "ra-recipe", name: "Công thức nấu ăn", emoji: "👨‍🍳", badge: 6 },
    ]
  }
];

// ── ch-health ──
const healthGroups: SidebarGroup[] = [
  {
    key: "activities", label: "HOẠT ĐỘNG SẮP TỚI",
    items: [
      { id: "he-run", name: "Giải chạy bộ nội bộ", emoji: "🏃", subtitle: "12/04/2026", badge: "28/50", badgeColor: "bg-green-100 text-green-600" },
      { id: "he-yoga", name: "Lớp Yoga buổi sáng", emoji: "🧘", subtitle: "Thứ 3, 5 • 7:00" },
      { id: "he-swim", name: "Đăng ký hồ bơi Q2", emoji: "🏊", badge: "Mới", badgeColor: "bg-blue-100 text-blue-600" },
    ]
  },
  {
    key: "clubs", label: "CÂU LẠC BỘ",
    items: [
      { id: "he-football", name: "CLB Bóng đá", emoji: "⚽", badge: "22 TV" },
      { id: "he-badminton", name: "CLB Cầu lông", emoji: "🏸", badge: "18 TV" },
      { id: "he-cycling", name: "CLB Đạp xe", emoji: "🚴", badge: "12 TV" },
      { id: "he-chess", name: "CLB Cờ vua", emoji: "♟️", badge: "9 TV" },
    ]
  },
  {
    key: "wellness", label: "SỨC KHOẺ",
    items: [
      { id: "he-checkup", name: "Lịch khám sức khoẻ định kỳ", emoji: "🩺" },
      { id: "he-mental", name: "Tư vấn sức khoẻ tinh thần", emoji: "🧠" },
      { id: "he-nutrition", name: "Thực đơn healthy tuần này", emoji: "🥗" },
    ]
  }
];


/* ═══════════ Channel Config ═══════════ */
interface ChannelConfig {
  title: string;
  emoji: string;
  gradient: string;
  accentColor: string; // tailwind color prefix e.g. "cyan", "emerald"
  quickFilters?: { id: string; label: string; icon: React.ReactNode; count?: number }[];
  groups: SidebarGroup[];
  searchPlaceholder: string;
}

const channelConfigs: Record<string, ChannelConfig> = {
  "ch-crm": {
    title: "CRM - Quản lý quan hệ khách hàng", emoji: "📞",
    gradient: "from-blue-500 to-cyan-500", accentColor: "cyan",
    quickFilters: [chatKenhFilter], groups: crmGroups,
    searchPlaceholder: "Tìm khách hàng, cơ hội, hoạt động..."
  },
  "ch-finance": {
    title: "Tài chính kế toán", emoji: "💰",
    gradient: "from-emerald-500 to-teal-500", accentColor: "emerald",
    quickFilters: financeQuickFilters, groups: financeGroups,
    searchPlaceholder: "Tìm báo cáo, hoá đơn..."
  },
  "ch-culture": {
    title: "Văn hóa doanh nghiệp", emoji: "🎯",
    gradient: "from-violet-500 to-purple-500", accentColor: "violet",
    quickFilters: [chatKenhFilter], groups: cultureGroups, searchPlaceholder: "Tìm sự kiện, hoạt động..."
  },
  "ch-support": {
    title: "Chăm sóc khách hàng", emoji: "💬",
    gradient: "from-pink-500 to-rose-500", accentColor: "pink",
    quickFilters: supportQuickFilters, groups: supportGroups,
    searchPlaceholder: "Tìm thông báo, hướng dẫn..."
  },
  "ch-workshop": {
    title: "Workshop", emoji: "🎓",
    gradient: "from-amber-500 to-orange-500", accentColor: "amber",
    quickFilters: [chatKenhFilter], groups: workshopGroups, searchPlaceholder: "Tìm workshop..."
  },
  "ch-announce": {
    title: "Thông báo chung", emoji: "📢",
    gradient: "from-red-500 to-rose-500", accentColor: "red",
    quickFilters: [chatKenhFilter], groups: announceGroups, searchPlaceholder: "Tìm thông báo..."
  },
  "ch-tech": {
    title: "Tech Talk", emoji: "💻",
    gradient: "from-indigo-500 to-blue-500", accentColor: "indigo",
    quickFilters: [chatKenhFilter], groups: techGroups, searchPlaceholder: "Tìm bài viết, chủ đề..."
  },
  "ch-hr": {
    title: "Nhân sự", emoji: "👥",
    gradient: "from-teal-500 to-cyan-500", accentColor: "teal",
    quickFilters: hrQuickFilters, groups: hrGroups,
    searchPlaceholder: "Tìm vị trí, chính sách..."
  },
  "ch-random": {
    title: "Random", emoji: "🎲",
    gradient: "from-orange-500 to-amber-500", accentColor: "orange",
    quickFilters: [chatKenhFilter], groups: randomGroups, searchPlaceholder: "Tìm chủ đề..."
  },
  "ch-health": {
    title: "Sức khỏe & Wellness", emoji: "🏃",
    gradient: "from-green-500 to-emerald-500", accentColor: "green",
    quickFilters: [chatKenhFilter], groups: healthGroups, searchPlaceholder: "Tìm hoạt động, CLB..."
  },
};

/* Accent color classes mapping */
const accentClasses: Record<string, { bg: string; text: string; bgLight: string; badgeBg: string }> = {
  cyan: { bg: "bg-cyan-50", text: "text-cyan-800", bgLight: "bg-cyan-100", badgeBg: "bg-cyan-200/60 text-cyan-700" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-800", bgLight: "bg-emerald-100", badgeBg: "bg-emerald-200/60 text-emerald-700" },
  violet: { bg: "bg-violet-50", text: "text-violet-800", bgLight: "bg-violet-100", badgeBg: "bg-violet-200/60 text-violet-700" },
  pink: { bg: "bg-pink-50", text: "text-pink-800", bgLight: "bg-pink-100", badgeBg: "bg-pink-200/60 text-pink-700" },
  amber: { bg: "bg-amber-50", text: "text-amber-800", bgLight: "bg-amber-100", badgeBg: "bg-amber-200/60 text-amber-700" },
  red: { bg: "bg-red-50", text: "text-red-800", bgLight: "bg-red-100", badgeBg: "bg-red-200/60 text-red-700" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-800", bgLight: "bg-indigo-100", badgeBg: "bg-indigo-200/60 text-indigo-700" },
  teal: { bg: "bg-teal-50", text: "text-teal-800", bgLight: "bg-teal-100", badgeBg: "bg-teal-200/60 text-teal-700" },
  orange: { bg: "bg-orange-50", text: "text-orange-800", bgLight: "bg-orange-100", badgeBg: "bg-orange-200/60 text-orange-700" },
  green: { bg: "bg-green-50", text: "text-green-800", bgLight: "bg-green-100", badgeBg: "bg-green-200/60 text-green-700" },
};

/* ═══════════ Props ═══════════ */
interface ChannelDetailSidebarProps {
  channelId: string;
  selectedItem: string | null;
  onItemSelect: (id: string) => void;
  onClose: () => void;
  onChatOpen?: () => void;
  extraItems?: { id: string; name: string; emoji: string; subtitle: string; badge?: string; badgeColor?: string }[];
  customCategories?: string[];
  onAddCategory?: (name: string) => void;
  onEditCategory?: (oldName: string, newName: string) => void;
  onDeleteCategory?: (name: string) => void;
  deletedCategoryIds?: string[];
  onDeleteCategoryItem?: (id: string) => void;
  categoryNameOverrides?: Record<string, string>;
  onRenameCategory?: (id: string, displayName: string, newName: string) => void;
  onDeleteAnnouncement?: (id: string) => void;
  deletedAnnouncementIds?: string[];
  closedPolls?: Set<string>;
}

/* ═══════════ Main Component ═══════════ */
export function ChannelDetailSidebar({ channelId, selectedItem, onItemSelect, onClose, onChatOpen, extraItems = [], customCategories = [], onAddCategory, onEditCategory, onDeleteCategory, deletedCategoryIds = [], onDeleteCategoryItem, categoryNameOverrides = {}, onRenameCategory, onDeleteAnnouncement, deletedAnnouncementIds = [], closedPolls = new Set() }: ChannelDetailSidebarProps) {
  const config = channelConfigs[channelId];
  if (!config) return null;

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId: string } | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [addCatMode, setAddCatMode] = useState(false);
  const [newCatInput, setNewCatInput] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const newCatRef = useRef<HTMLInputElement>(null);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatInput, setEditCatInput] = useState("");
  const editCatRef = useRef<HTMLInputElement>(null);
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const accent = accentClasses[config.accentColor] || accentClasses.cyan;

  // Reset state when channel changes
  useEffect(() => {
    setSearch("");
    setActiveFilter("");
    setCollapsedGroups(new Set());
  }, [channelId]);

  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Apply quick filter (filter by group key match or "all")
  const activeFilterDef = config.quickFilters?.find(f => f.id === activeFilter);
  const isAllFilter = !activeFilter || activeFilter === "all";

  const PUBLISH_CHANNELS = ["ch-announce", "ch-tech", "ch-workshop", "ch-culture", "ch-hr", "ch-random", "ch-health", "ch-finance", "ch-support"];

  const badgeColorFor = (badge?: string) => {
    // Red: urgent / important / hot
    if (["Quan trọng","Khẩn cấp","Hot"].includes(badge ?? "")) return "bg-red-100 text-red-600";
    // Blue: informational / articles / policies / reports
    if (["Thông tin","Tutorial","Bài viết","Chính sách","Onboarding","Báo cáo"].includes(badge ?? "")) return "bg-blue-100 text-blue-600";
    // Green: upcoming / open registration / sports / health
    if (["Sắp diễn ra","Đăng ký mở","Miễn phí","Online","Thể thao","Yoga & Thiền","Dinh dưỡng"].includes(badge ?? "")) return "bg-green-100 text-green-600";
    // Purple: culture events / recognition
    if (["Sự kiện","Vinh danh","Hoạt động","Team Building"].includes(badge ?? "")) return "bg-purple-100 text-purple-600";
    // Sky: HR / hiring / training
    if (["Tuyển dụng","Đào tạo"].includes(badge ?? "")) return "bg-sky-100 text-sky-600";
    // Orange: fun / meme / discussion
    if (["Meme","Thảo luận","Chia sẻ hay"].includes(badge ?? "")) return "bg-orange-100 text-orange-600";
    // Indigo: finance items
    if (["Hóa đơn","Ngân sách"].includes(badge ?? "")) return "bg-indigo-100 text-indigo-600";
    // Default amber
    return "bg-amber-100 text-amber-700";
  };

  const INJECT_GROUP: Record<string, string> = {
    "ch-announce": "recent", "ch-tech": "trending", "ch-workshop": "upcoming",
    "ch-culture": "events", "ch-hr": "hiring", "ch-random": "hot",
    "ch-health": "activities", "ch-finance": "overview", "ch-support": "announcements",
  };
  const CAT_GROUP: Record<string, string> = {
    "ch-announce": "categories", "ch-tech": "topics", "ch-workshop": "types",
    "ch-culture": "cu_cat", "ch-hr": "hr_cat", "ch-random": "ra_cat",
    "ch-health": "he_cat", "ch-finance": "fi_cat", "ch-support": "kb",
  };
  const CAT_PREFIX: Record<string, string> = {
    "ch-announce": "an-cat-u-", "ch-tech": "te-cat-u-", "ch-workshop": "ws-cat-u-",
    "ch-culture": "cu-cat-u-", "ch-hr": "hr-cat-u-", "ch-random": "ra-cat-u-",
    "ch-health": "he-cat-u-", "ch-finance": "fi-cat-u-", "ch-support": "csk-cat-u-",
  };

  const catKeyForChannel = CAT_GROUP[channelId];
  const injectKeyForChannel = INJECT_GROUP[channelId];
  const extraItemIds = new Set(extraItems.map(e => e.id));

  const effectiveGroups: SidebarGroup[] = PUBLISH_CHANNELS.includes(channelId)
    ? (() => {
        const injectKey = injectKeyForChannel;
        const catKey = catKeyForChannel;
        const catPrefix = CAT_PREFIX[channelId];
        let groups = config.groups.map(g => {
          if (g.key === injectKey) {
            const staticItems = g.items.filter(i => !deletedAnnouncementIds.includes(i.id));
            const injectedItems = extraItems.map(e => ({ ...e, filterTag: undefined, badgeColor: e.badgeColor || (e.badge ? badgeColorFor(e.badge) : undefined) }));
            return { ...g, items: [...injectedItems, ...staticItems] };
          }
          if (g.key === catKey) {
            const filteredItems = g.items
              .filter(i => !deletedCategoryIds.includes(i.id))
              .map(i => categoryNameOverrides[i.id] ? { ...i, name: categoryNameOverrides[i.id] } : i);
            const customCatItems: SidebarItem[] = customCategories.filter(name => !deletedCategoryIds.includes(`${catPrefix}${name}`)).map(name => {
              const id = `${catPrefix}${name}`;
              return { id, name: categoryNameOverrides[id] || name, emoji: "📁" };
            });
            return { ...g, items: [...filteredItems, ...customCatItems] };
          }
          return g;
        });
        // If catKey group doesn't exist and we have customCategories, add it (for ch-workshop)
        if (customCategories.length > 0 && !config.groups.find(g => g.key === catKey)) {
          const customCatItems: SidebarItem[] = customCategories.filter(name => !deletedCategoryIds.includes(`${CAT_PREFIX[channelId]}${name}`)).map(name => {
            const id = `${CAT_PREFIX[channelId]}${name}`;
            return { id, name: categoryNameOverrides[id] || name, emoji: "📁" };
          });
          if (customCatItems.length > 0) groups = [...groups, { key: catKey, label: "PHÂN LOẠI", items: customCatItems }];
        }
        return groups;
      })()
    : config.groups;

  const filteredGroups = effectiveGroups
    .map(g => ({
      ...g,
      items: g.items.filter(item => {
        const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || (item.subtitle && item.subtitle.toLowerCase().includes(search.toLowerCase()));
        const matchesFilter = isAllFilter || item.filterTag === activeFilter;
        return matchesSearch && matchesFilter;
      }),
    }))
    .filter(g => g.items.length > 0);

  const totalItems = effectiveGroups.reduce((sum, g) => sum + g.items.length, 0);
  const filteredCount = filteredGroups.reduce((sum, g) => sum + g.items.length, 0);

  const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).closest('.overflow-y-auto')?.getBoundingClientRect();
    setContextMenu({
      x: Math.min(e.clientX - (rect?.left || 0), 180),
      y: e.clientY - (rect?.top || 0),
      itemId,
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  return (
    <div className="w-full md:w-[272px] h-full bg-white flex flex-col border-r border-gray-200 overflow-hidden shrink-0" onClick={closeContextMenu}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2.5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50/50">
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
          <span className="text-[14px]">{config.emoji}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-gray-900 truncate" style={{ fontWeight: 600 }}>{config.title}</p>
          <p className="text-[10px] text-gray-400">{totalItems} mục{search ? ` · ${filteredCount} kết quả` : ""}</p>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Filters */}
      {config.quickFilters && (
        <>
          <div className="px-3 pt-3 pb-1 space-y-0.5">
            {config.quickFilters.map(f => (
              <button
                key={f.id}
                onClick={() => {
                  if (f.id === "chat") {
                    onChatOpen ? onChatOpen() : onClose();
                    return;
                  }
                  setActiveFilter(f.id);
                  if (channelId === "ch-finance" && f.id === "overview") {
                    onItemSelect("fi-fin-overview");
                  } else if (channelId === "ch-support" && (f.id === "all" || f.id === "mine")) {
                    onItemSelect(`sp-list-${f.id}`);
                  } else {
                    const firstMatch = effectiveGroups.flatMap(g => g.items).find(item =>
                      f.id === "all" ? true : item.filterTag === f.id
                    );
                    if (firstMatch) onItemSelect(firstMatch.id);
                  }
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[12px] transition-all group ${
                  activeFilter === f.id
                    ? `${accent.bg} ${accent.text}`
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className={activeFilter === f.id ? accent.text.replace("800", "600") : "text-gray-400 group-hover:text-gray-500"}>
                  {f.icon}
                </span>
                <span className="flex-1 text-left truncate">{f.label}</span>
                {f.count !== undefined && (
                  <span className={`min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] flex items-center justify-center shrink-0 ${
                    activeFilter === f.id ? accent.badgeBg : "bg-gray-100 text-gray-500"
                  }`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="h-px bg-gray-100 mx-3 my-2" />
        </>
      )}

      {/* Search */}
      {<div className="px-3 mb-2">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 focus-within:border-gray-300 transition-all">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            type="text"
            ref={searchRef}
            placeholder={config.searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-[12px] bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        {search && (
          <p className="text-[10px] text-gray-400 mt-1.5 px-1">
            Tìm thấy <span className="text-gray-600" style={{ fontWeight: 600 }}>{filteredCount}</span> / {totalItems} kết quả
          </p>
        )}
      </div>}

      {/* Items list */}
      {<div className="flex-1 overflow-y-auto px-2 pb-3">
        {filteredGroups.map(group => (
          <div key={group.key} className="mb-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleGroupCollapse(group.key)}
                className="flex-1 px-2 pt-2.5 pb-1.5 flex items-center gap-1.5 group/hdr hover:bg-gray-50 rounded-md transition-colors min-w-0"
              >
                <ChevronDown className={`w-3 h-3 text-gray-300 transition-transform shrink-0 ${collapsedGroups.has(group.key) ? "-rotate-90" : ""}`} />
                <p className="text-[9px] text-gray-400 tracking-[0.08em] uppercase flex-1 text-left truncate" style={{ fontWeight: 600 }}>
                  {group.label}
                </p>
                <span className="text-[9px] text-gray-300 shrink-0">{group.items.length}</span>
              </button>
              {PUBLISH_CHANNELS.includes(channelId) && group.key === CAT_GROUP[channelId] && onAddCategory && (
                <button
                  onClick={() => { setAddCatMode(true); setTimeout(() => newCatRef.current?.focus(), 50); }}
                  title="Thêm phân loại mới"
                  className="w-5 h-5 mr-1 flex items-center justify-center rounded text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all text-[14px] shrink-0"
                >
                  +
                </button>
              )}
            </div>
            {PUBLISH_CHANNELS.includes(channelId) && group.key === CAT_GROUP[channelId] && addCatMode && (
              <div className="mx-2 mb-1.5 flex gap-1.5">
                <input
                  ref={newCatRef}
                  value={newCatInput}
                  onChange={e => setNewCatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && newCatInput.trim()) {
                      onAddCategory?.(newCatInput.trim());
                      setNewCatInput("");
                      setAddCatMode(false);
                    }
                    if (e.key === "Escape") { setAddCatMode(false); setNewCatInput(""); }
                  }}
                  placeholder="Tên phân loại..."
                  className="flex-1 min-w-0 border border-red-200 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-700 focus:outline-none focus:border-red-400 bg-red-50/30"
                />
                <button
                  disabled={!newCatInput.trim()}
                  onClick={() => {
                    if (!newCatInput.trim()) return;
                    onAddCategory?.(newCatInput.trim());
                    setNewCatInput("");
                    setAddCatMode(false);
                  }}
                  className={`px-2 rounded-lg text-[11px] font-bold transition-all ${newCatInput.trim() ? "bg-red-400 text-white hover:bg-red-500" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}>
                  ✓
                </button>
                <button onClick={() => { setAddCatMode(false); setNewCatInput(""); }} className="px-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-all text-[11px]">✕</button>
              </div>
            )}
            {!collapsedGroups.has(group.key) && <div className="space-y-0.5">
              {group.items.map(item => {
                const isCatGroup = group.key === catKeyForChannel;
                const isInjectGroup = group.key === injectKeyForChannel;
                const isPinnedGroup = group.key === "pinned";
                const isCustomCat = item.id.includes("-cat-u-");
                const isExtraItem = extraItemIds.has(item.id);
                const isHovered = hoveredCatId === item.id;
                const showHoverActions = isCatGroup || isInjectGroup || isPinnedGroup;
                const menuOpen = openMenuId === item.id;
                return showHoverActions ? (
                  <div
                    key={item.id}
                    className="relative"
                    onMouseEnter={() => setHoveredCatId(item.id)}
                    onMouseLeave={() => { setHoveredCatId(null); }}
                  >
                    {isCatGroup && editingCatId === item.id ? (
                      <div className="flex gap-1.5 px-2 py-1.5">
                        <input
                          ref={editCatRef}
                          value={editCatInput}
                          onChange={e => setEditCatInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter" && editCatInput.trim() && onRenameCategory) {
                              onRenameCategory(item.id, item.name, editCatInput.trim());
                              setEditingCatId(null);
                            }
                            if (e.key === "Escape") { setEditingCatId(null); setEditCatInput(""); }
                          }}
                          className="flex-1 min-w-0 border border-amber-300 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-700 focus:outline-none bg-amber-50/40"
                          autoFocus
                        />
                        <button disabled={!editCatInput.trim()} onClick={() => { if (!editCatInput.trim() || !onRenameCategory) return; onRenameCategory(item.id, item.name, editCatInput.trim()); setEditingCatId(null); }} className={`px-2 rounded-lg text-[11px] font-bold ${editCatInput.trim() ? "bg-amber-400 text-white" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}>✓</button>
                        <button onClick={() => { setEditingCatId(null); setEditCatInput(""); }} className="px-1.5 rounded-lg text-gray-400 hover:bg-gray-100 text-[11px]">✕</button>
                      </div>
                    ) : item.indent ? (
                      /* ── Indented sub-item ── */
                      <div className="flex items-center gap-0.5 pl-3">
                        {/* connecting line */}
                        <div className="flex flex-col items-center self-stretch mr-1 shrink-0" style={{ width: 14 }}>
                          <div className="w-px flex-1 bg-gray-200" />
                        </div>
                        <button
                          onClick={() => onItemSelect(item.id)}
                          className={`flex-1 min-w-0 flex items-center gap-2 px-2 py-[6px] rounded-lg text-[11.5px] transition-all ${selectedItem === item.id ? `${accent.bg} ${accent.text}` : "text-gray-600 hover:bg-gray-50"}`}
                        >
                          <span className="text-[13px] shrink-0">{item.emoji}</span>
                          <span className={`flex-1 min-w-0 truncate text-left ${selectedItem === item.id ? accent.text : "text-gray-600"}`} style={{ fontWeight: 500 }}>{item.name}</span>
                          {item.badge !== undefined && !isHovered && (() => {
                            const isClosed = closedPolls.has(item.id);
                            const badge = isClosed ? "Đã đóng" : item.badge;
                            const badgeColor = isClosed ? "bg-gray-100 text-gray-500" : (item.badgeColor || (selectedItem === item.id ? accent.badgeBg : "bg-gray-100 text-gray-500"));
                            return <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] flex items-center justify-center shrink-0 ${badgeColor}`}>{badge}</span>;
                          })()}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => onItemSelect(item.id)}
                          onContextMenu={(e) => handleContextMenu(e, item.id)}
                          className={`flex-1 min-w-0 flex items-center gap-2.5 px-2.5 py-[8px] rounded-lg text-[12px] transition-all ${selectedItem === item.id ? `${accent.bg} ${accent.text}` : "text-gray-700 hover:bg-gray-50"}`}
                        >
                          <div className={`w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0 transition-all ${selectedItem === item.id ? `${accent.bgLight} ${accent.text}` : "bg-gray-100 text-gray-500"}`}>
                            {item.emoji ? <span className="text-[16px]">{item.emoji}</span> : item.icon}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className={`truncate text-[12px] ${selectedItem === item.id ? accent.text : "text-gray-700"}`} style={{ fontWeight: 500 }}>{item.name}</p>
                            {item.subtitle && <p className="text-[10px] text-gray-400 truncate mt-0.5">{item.subtitle}</p>}
                          </div>
                          {item.badge !== undefined && !isHovered && (() => {
                            const isClosed = closedPolls.has(item.id);
                            const badge = isClosed ? "Đã đóng" : item.badge;
                            const badgeColor = isClosed ? "bg-gray-100 text-gray-500" : (item.badgeColor || (selectedItem === item.id ? accent.badgeBg : "bg-gray-100 text-gray-500"));
                            return <span className={`min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] flex items-center justify-center shrink-0 ${badgeColor}`}>{badge}</span>;
                          })()}
                        </button>
                        {/* ... menu button */}
                        <div className={`relative shrink-0 transition-opacity ${isHovered || menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                          <button
                            onClick={e => { e.stopPropagation(); setOpenMenuId(menuOpen ? null : item.id); }}
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${menuOpen ? "bg-gray-200 text-gray-700" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                          {menuOpen && (
                            <>
                              {/* Backdrop to close */}
                              <div className="fixed inset-0 z-30" onClick={() => setOpenMenuId(null)} />
                              <div className="absolute right-0 top-full mt-1 z-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-[140px] overflow-hidden">
                                {isCatGroup && onRenameCategory && (
                                  <button
                                    onClick={e => { e.stopPropagation(); setOpenMenuId(null); setEditCatInput(item.name); setEditingCatId(item.id); setTimeout(() => editCatRef.current?.focus(), 50); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-amber-500" />
                                    Sửa tên
                                  </button>
                                )}
                                {isCatGroup && onDeleteCategoryItem && (
                                  <button
                                    onClick={e => { e.stopPropagation(); setOpenMenuId(null); if (window.confirm(`Xóa phân loại "${item.name}"?`)) { onDeleteCategoryItem(item.id); } }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Xóa phân loại
                                  </button>
                                )}
                                {isInjectGroup && onDeleteAnnouncement && (
                                  <button
                                    onClick={e => { e.stopPropagation(); setOpenMenuId(null); if (window.confirm(`Xóa thông báo "${item.name}"?`)) { onDeleteAnnouncement(item.id); } }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Xóa thông báo
                                  </button>
                                )}
                                {isPinnedGroup && onDeleteAnnouncement && (
                                  <button
                                    onClick={e => { e.stopPropagation(); setOpenMenuId(null); if (window.confirm(`Xóa thông báo "${item.name}"?`)) { onDeleteAnnouncement(item.id); } }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Xóa thông báo
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    key={item.id}
                    onClick={() => onItemSelect(item.id)}
                    onContextMenu={(e) => handleContextMenu(e, item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-[8px] rounded-lg text-[12px] transition-all group ${
                      selectedItem === item.id
                        ? `${accent.bg} ${accent.text}`
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0 transition-all ${
                      selectedItem === item.id
                        ? `${accent.bgLight} ${accent.text}`
                        : "bg-gray-100 text-gray-500 group-hover:bg-gray-200/70"
                    }`}>
                      {item.emoji ? (
                        <span className="text-[16px]">{item.emoji}</span>
                      ) : item.icon}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className={`truncate text-[12px] ${
                        selectedItem === item.id ? accent.text : "text-gray-700"
                      }`} style={{ fontWeight: 500 }}>
                        {item.name}
                      </p>
                      {item.subtitle && (
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                    {item.badge !== undefined && (() => {
                      const isClosed = closedPolls.has(item.id);
                      const badge = isClosed ? "Đã đóng" : item.badge;
                      const badgeColor = isClosed ? "bg-gray-100 text-gray-500" : (item.badgeColor || (selectedItem === item.id ? accent.badgeBg : "bg-gray-100 text-gray-500"));
                      return <span className={`min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] flex items-center justify-center shrink-0 ${badgeColor}`}>{badge}</span>;
                    })()}
                  </button>
                );
              })}
            </div>}
          </div>
        ))}
        {filteredGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Search className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-[12px]">Không tìm thấy kết quả</p>
            <button
              onClick={() => { setSearch(""); searchRef.current?.focus(); }}
              className="mt-2 text-[11px] text-cyan-500 hover:text-cyan-600 transition-colors"
            >
              Xoá bộ lọc
            </button>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="absolute bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 w-[180px] overflow-hidden"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => { onItemSelect(contextMenu.itemId); closeContextMenu(); }}
              className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="text-[14px]">📄</span> Xem chi tiết
            </button>
            <button
              onClick={() => { copyToClipboard(contextMenu.itemId); toast.success("Đã copy link"); closeContextMenu(); }}
              className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="text-[14px]">🔗</span> Copy link
            </button>
            <button
              onClick={() => { toast.success("Đã ghim mục này"); closeContextMenu(); }}
              className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="text-[14px]">📌</span> Ghim lên đầu
            </button>
            <button
              onClick={() => { toast.success("Đã tắt thông báo"); closeContextMenu(); }}
              className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="text-[14px]">🔕</span> Tắt thông báo
            </button>
            <div className="h-px bg-gray-100 my-1" />
            <button
              onClick={() => { toast.success("Đã đánh dấu đã đọc"); closeContextMenu(); }}
              className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="text-[14px]">✅</span> Đánh dấu đã đọc
            </button>
          </div>
        )}
      </div>}
    </div>
  );
}

/* ═══════════ Export channel item name resolver ═══════════ */
export function getChannelItemName(channelId: string, itemId: string): string | null {
  const config = channelConfigs[channelId];
  if (!config) return null;
  for (const group of config.groups) {
    const item = group.items.find(i => i.id === itemId);
    if (item) return item.name;
  }
  return null;
}

/* ═══════════ Export all channel items for search ═══════════ */
export function getAllChannelItems(): { channelId: string; channelName: string; channelEmoji: string; itemId: string; itemName: string; itemEmoji?: string }[] {
  const result: { channelId: string; channelName: string; channelEmoji: string; itemId: string; itemName: string; itemEmoji?: string }[] = [];
  for (const [channelId, config] of Object.entries(channelConfigs)) {
    for (const group of config.groups) {
      for (const item of group.items) {
        result.push({
          channelId,
          channelName: config.title,
          channelEmoji: config.emoji,
          itemId: item.id,
          itemName: item.name,
          itemEmoji: item.emoji,
        });
      }
    }
  }
  return result;
}