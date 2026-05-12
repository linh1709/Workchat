import { useState, useRef, useEffect } from "react";
import { useCrmInvoices, type CrmInvoice } from "../context/CrmInvoiceContext";
import { CRMView } from "./CRMView";
import {
  X, MessageSquare, Share2, Bookmark, MoreHorizontal,
  Clock, Send, Calendar, MapPin, Users, Eye,
  CheckCircle2, AlertTriangle, Download,
  Star, Heart, FileText, Play, Image as ImageIcon,
  ThumbsUp, Flame, ArrowUpRight, UserPlus, ExternalLink,
  Check, Circle, ChevronDown, Award, TrendingUp,
  Zap, Bug, Target, Shield, AlertCircle, Vote, ArrowLeft, ArrowRight,
  Building2, CreditCard, Wallet, PiggyBank, BarChart2, FileBarChart, Calculator, Plus,
  Phone, Mail, PhoneCall, TrendingDown, Handshake, UserCheck, Filter, Search as SearchIcon
} from "lucide-react";

import { toast } from "sonner";
import { copyToClipboard } from "./clipboard";

/* ═══════════ Detail Data Types ═══════════ */
interface DetailData {
  title: string;
  emoji: string;
  type: "article" | "event" | "ticket" | "announcement" | "policy" | "job" | "activity" | "feature" | "discussion";
  meta: { label: string; value: string; highlight?: boolean }[];
  description: string;
  tags?: string[];
  // Type-specific fields
  ticketStatus?: "open" | "in_progress" | "waiting" | "resolved";
  ticketTimeline?: { time: string; action: string; user: string }[];
  eventSchedule?: { time: string; activity: string }[];
  pollOptions?: { label: string; votes: number; percent: number }[];
  progressPercent?: number;
  jobRequirements?: string[];
  checklist?: { label: string; done: boolean }[];
  stats?: { label: string; value: string; trend?: "up" | "down" }[];
  participants?: { initials: string; name: string; color: string }[];
  // Announcement-specific fields
  category?: string;
  badge?: string;
  publishedAt?: string;
  publishedBy?: string;
  attachment?: string;
}

/* ═══════════ Invoice Mini-App Data ═══════════ */
type InvoiceStatus = "draft" | "unpaid" | "partially_paid" | "paid" | "cancelled";

interface InvoiceLineItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  vat: number;      // % VAT (0 | 5 | 10)
  discount: number; // % discount per line
}

interface Invoice {
  id: string;
  number: string;
  type: "ban" | "mua";
  date: string;
  dueDate: string;
  party: string;
  status: InvoiceStatus;
  items: InvoiceLineItem[];
  note?: string;
}

const statusConfig: Record<InvoiceStatus, { label: string; color: string; bg: string; dot: string }> = {
  draft:          { label: "Draft",              color: "text-gray-500",  bg: "bg-gray-50 border-gray-200",    dot: "bg-gray-400" },
  unpaid:         { label: "Chưa thanh toán",    color: "text-amber-600", bg: "bg-amber-50 border-amber-200",  dot: "bg-amber-400" },
  partially_paid: { label: "Thanh toán 1 phần",  color: "text-blue-600",  bg: "bg-blue-50 border-blue-200",    dot: "bg-blue-400" },
  paid:           { label: "Đã thanh toán",       color: "text-green-600", bg: "bg-green-50 border-green-200",  dot: "bg-green-400" },
  cancelled:      { label: "Đã hủy",             color: "text-red-500",   bg: "bg-red-50 border-red-200",      dot: "bg-red-400" },
};

function calcLine(it: InvoiceLineItem) {
  const sub = it.quantity * it.unitPrice;
  const disc = sub * (it.discount / 100);
  const tax = (sub - disc) * (it.vat / 100);
  return { sub, disc, tax, total: sub - disc + tax };
}
function calcInvoice(inv: Invoice) {
  let sub = 0, disc = 0, tax = 0;
  inv.items.forEach(it => { const c = calcLine(it); sub += c.sub; disc += c.disc; tax += c.tax; });
  return { sub, disc, tax, grand: sub - disc + tax };
}

const li = (id: string, name: string, qty: number, price: number, vat = 10, disc = 0): InvoiceLineItem =>
  ({ id, name, quantity: qty, unitPrice: price, vat, discount: disc });

const financeInvoices: Invoice[] = [
  { id: "inv-001", number: "HĐ-2026-031", type: "mua", date: "10/03/2026", dueDate: "22/03/2026", party: "Dell Technologies VN", status: "unpaid", items: [
    li("l1", "Laptop Dell XPS 15 (14 units)", 14, 18000000, 10),
    li("l2", "Bag & accessories pack", 14, 500000, 10),
  ]},
  { id: "inv-002", number: "HĐ-2026-032", type: "mua", date: "12/03/2026", dueDate: "22/03/2026", party: "Amazon Web Services", status: "unpaid", items: [
    li("l1", "EC2 Compute (t3.xlarge × 3)", 1, 85000000, 0),
    li("l2", "S3 Storage 10TB", 1, 45000000, 0),
    li("l3", "RDS PostgreSQL Multi-AZ", 1, 65000000, 0),
  ]},
  { id: "inv-003", number: "HĐ-2026-033", type: "mua", date: "08/03/2026", dueDate: "22/03/2026", party: "BĐS Phú Mỹ Hưng", status: "partially_paid", items: [
    li("l1", "Thuê văn phòng tầng 12 — Q2/2026", 1, 150000000, 10),
    li("l2", "Phí dịch vụ tòa nhà", 1, 27272728, 10),
  ]},
  { id: "inv-004", number: "HĐ-2026-034", type: "mua", date: "11/03/2026", dueDate: "30/03/2026", party: "Dentsu Aegis VN", status: "draft", items: [
    li("l1", "Digital Ads — Google/Meta T3", 1, 80000000, 10),
    li("l2", "SEO & Content Marketing", 1, 28000000, 10, 5),
  ]},
  { id: "inv-005", number: "HĐ-2026-035", type: "mua", date: "05/03/2026", dueDate: "20/03/2026", party: "Trung tâm đào tạo FPT", status: "paid", items: [
    li("l1", "AWS Certified Solutions Architect (5 người)", 5, 12000000, 10),
    li("l2", "Tài liệu học & thi", 5, 1500000, 10),
  ]},
  { id: "inv-006", number: "HĐ-2026-028", type: "mua", date: "25/02/2026", dueDate: "10/03/2026", party: "Viettel Business", status: "paid", items: [
    li("l1", "Cước Internet Leased Line 1Gbps", 1, 12000000, 10),
    li("l2", "Điện thoại cố định & di động", 50, 130000, 10),
  ]},
  { id: "inv-007", number: "HĐ-2026-029", type: "mua", date: "01/03/2026", dueDate: "15/03/2026", party: "Adobe Systems", status: "cancelled", items: [
    li("l1", "Adobe Creative Cloud — 20 licenses", 20, 2100000, 0),
  ]},
  { id: "inv-011", number: "HD-2026-011", type: "ban", date: "05/03/2026", dueDate: "20/03/2026", party: "Tập đoàn Vingroup", status: "paid", items: [
    li("l1", "VWork Pro — 500 users (Q1/2026)", 500, 1400000, 10),
    li("l2", "Triển khai & onboarding", 1, 50000000, 10),
  ]},
  { id: "inv-012", number: "HD-2026-012", type: "ban", date: "08/03/2026", dueDate: "22/03/2026", party: "Masan Group", status: "partially_paid", items: [
    li("l1", "Tư vấn chuyển đổi số — Phase 1", 1, 200000000, 10),
    li("l2", "Workshop & training (2 ngày)", 2, 45454545, 10),
  ]},
  { id: "inv-013", number: "HD-2026-013", type: "ban", date: "10/03/2026", dueDate: "25/03/2026", party: "Techcombank", status: "unpaid", items: [
    li("l1", "VWork Enterprise — 200 users (Q2/2026)", 200, 1800000, 10),
    li("l2", "Custom integration API", 1, 50000000, 10),
    li("l3", "Priority support package", 1, 30000000, 10, 10),
  ]},
  { id: "inv-014", number: "HD-2026-014", type: "ban", date: "12/03/2026", dueDate: "27/03/2026", party: "FPT Software", status: "unpaid", items: [
    li("l1", "Hoa hồng giới thiệu KH Q1/2026", 1, 180000000, 10),
  ]},
  { id: "inv-015", number: "HD-2026-010", type: "ban", date: "28/02/2026", dueDate: "14/03/2026", party: "VPBank", status: "paid", items: [
    li("l1", "VWork Pro — 150 users (T3/2026)", 150, 1500000, 10),
    li("l2", "SLA Premium Support", 1, 25000000, 10, 5),
  ]},
  { id: "inv-016", number: "HD-2026-016", type: "ban", date: "15/03/2026", dueDate: "30/03/2026", party: "Sacombank", status: "draft", items: [
    li("l1", "VWork Enterprise — 300 users (Q2)", 300, 1800000, 10),
  ]},
];

/* ═══════════ Payment Data ═══════════ */
type PaymentType   = "ban" | "mua"; // ban = thu từ KH, mua = chi cho NCC
type PaymentStatus = "pending" | "partially_paid" | "completed" | "failed" | "cancelled";
type PaymentMethod = "bank_transfer" | "cash" | "credit_card" | "e_wallet";

interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  note?: string;
}

interface Payment {
  id: string;
  type: PaymentType;
  amount: number;          // tổng cần thanh toán
  partner_id: string;
  method: PaymentMethod;   // phương thức mặc định
  date: string;
  invoice_links: string[];
  status: PaymentStatus;
  note?: string;
  records: PaymentRecord[]; // các lần thanh toán thực tế
}

const paymentStatusConfig: Record<PaymentStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending:        { label: "Chờ thanh toán",    color: "text-amber-600", bg: "bg-amber-50 border-amber-200",  dot: "bg-amber-400" },
  partially_paid: { label: "Thanh toán 1 phần", color: "text-blue-600",  bg: "bg-blue-50 border-blue-200",    dot: "bg-blue-400"  },
  completed:      { label: "Hoàn thành",        color: "text-green-600", bg: "bg-green-50 border-green-200",  dot: "bg-green-400" },
  failed:         { label: "Thất bại",          color: "text-red-500",   bg: "bg-red-50 border-red-200",      dot: "bg-red-400"   },
  cancelled:      { label: "Đã hủy",            color: "text-gray-500",  bg: "bg-gray-50 border-gray-200",    dot: "bg-gray-400"  },
};

const paymentMethodLabel: Record<PaymentMethod, string> = {
  bank_transfer: "Chuyển khoản",
  cash:          "Tiền mặt",
  credit_card:   "Thẻ tín dụng",
  e_wallet:      "Ví điện tử",
};

const financePayments: Payment[] = [
  { id: "pay-001", type: "mua", amount: 280000000, partner_id: "p6",  method: "bank_transfer", date: "20/03/2026", invoice_links: ["inv-001"], status: "completed",      note: "Thanh toán hóa đơn laptop Dell",   records: [{ id: "r1", amount: 280000000, date: "20/03/2026", method: "bank_transfer" }] },
  { id: "pay-002", type: "mua", amount: 195000000, partner_id: "p7",  method: "bank_transfer", date: "22/03/2026", invoice_links: ["inv-002"], status: "completed",      note: "AWS tháng 3/2026",                 records: [{ id: "r1", amount: 195000000, date: "22/03/2026", method: "bank_transfer" }] },
  { id: "pay-003", type: "mua", amount: 360000000, partner_id: "p8",  method: "bank_transfer", date: "15/03/2026", invoice_links: ["inv-003"], status: "partially_paid", note: "Đặt cọc thuê văn phòng Q2",        records: [{ id: "r1", amount: 180000000, date: "15/03/2026", method: "bank_transfer", note: "Đợt 1 — 50%" }] },
  { id: "pay-004", type: "ban", amount: 850000000, partner_id: "p1",  method: "bank_transfer", date: "28/02/2026", invoice_links: ["inv-005"], status: "completed",      note: "Vingroup thanh toán hợp đồng năm", records: [{ id: "r1", amount: 850000000, date: "28/02/2026", method: "bank_transfer" }] },
  { id: "pay-005", type: "ban", amount: 280000000, partner_id: "p5",  method: "bank_transfer", date: "05/03/2026", invoice_links: ["inv-009"], status: "completed",      note: "VPBank — 2 hóa đơn Q1",            records: [{ id: "r1", amount: 280000000, date: "05/03/2026", method: "bank_transfer" }] },
  { id: "pay-006", type: "mua", amount: 120000000, partner_id: "p9",  method: "bank_transfer", date: "10/04/2026", invoice_links: ["inv-006"], status: "pending",        note: "Dentsu — phí marketing Q2",        records: [] },
  { id: "pay-007", type: "mua", amount:  42000000, partner_id: "p10", method: "credit_card",   date: "01/04/2026", invoice_links: ["inv-007"], status: "pending",        note: "Adobe CC license gia hạn",          records: [] },
  { id: "pay-008", type: "ban", amount: 320000000, partner_id: "p2",  method: "bank_transfer", date: "01/04/2026", invoice_links: ["inv-011"], status: "partially_paid", note: "Masan — thanh toán đợt 1",         records: [{ id: "r1", amount: 100000000, date: "01/04/2026", method: "bank_transfer", note: "Đợt 1" }] },
  { id: "pay-009", type: "mua", amount:  25000000, partner_id: "p8",  method: "cash",          date: "18/03/2026", invoice_links: [],          status: "completed",      note: "Tiền mặt — phí sửa chữa nhỏ",     records: [{ id: "r1", amount: 25000000,  date: "18/03/2026", method: "cash" }] },
  { id: "pay-010", type: "ban", amount: 450000000, partner_id: "p3",  method: "bank_transfer", date: "30/03/2026", invoice_links: ["inv-013"], status: "failed",         note: "Techcombank — giao dịch bị từ chối", records: [] },
];

/* ═══════════ Partners & Financial Summary Data ═══════════ */
interface Partner {
  id: string; name: string; type: "customer" | "vendor";
  contact: string; email: string; phone: string;
  totalAmount: number; outstanding: number;
  status: "active" | "critical" | "inactive";
  invoiceCount: number;
}

const financePartners: Partner[] = [
  { id: "p1", name: "Tập đoàn Vingroup", type: "customer", contact: "Nguyễn Văn An", email: "finance@vingroup.net", phone: "024-3974-9999", totalAmount: 850000000, outstanding: 0, status: "active", invoiceCount: 3 },
  { id: "p2", name: "Masan Group", type: "customer", contact: "Trần Thị Bình", email: "ap@masangroup.com", phone: "028-3840-5888", totalAmount: 320000000, outstanding: 320000000, status: "active", invoiceCount: 2 },
  { id: "p3", name: "Techcombank", type: "customer", contact: "Lê Văn Cường", email: "procurement@techcombank.vn", phone: "024-3944-6699", totalAmount: 450000000, outstanding: 450000000, status: "active", invoiceCount: 1 },
  { id: "p4", name: "FPT Software", type: "customer", contact: "Phạm Minh Đức", email: "vendor@fpt.com.vn", phone: "024-7300-7300", totalAmount: 180000000, outstanding: 180000000, status: "active", invoiceCount: 1 },
  { id: "p5", name: "VPBank", type: "customer", contact: "Hoàng Thị Em", email: "finance@vpbank.com.vn", phone: "028-3821-8300", totalAmount: 280000000, outstanding: 0, status: "active", invoiceCount: 2 },
  { id: "p6", name: "Dell Technologies VN", type: "vendor", contact: "Smith Nguyễn", email: "vietnam@dell.com", phone: "028-3827-5000", totalAmount: 280000000, outstanding: 280000000, status: "active", invoiceCount: 1 },
  { id: "p7", name: "Amazon Web Services", type: "vendor", contact: "AWS Support", email: "aws-billing@amazon.com", phone: "N/A", totalAmount: 195000000, outstanding: 195000000, status: "active", invoiceCount: 1 },
  { id: "p8", name: "BĐS Phú Mỹ Hưng", type: "vendor", contact: "Nguyễn Phú Hưng", email: "accounting@pmh.vn", phone: "028-5413-0000", totalAmount: 360000000, outstanding: 180000000, status: "critical", invoiceCount: 2 },
  { id: "p9", name: "Dentsu Aegis VN", type: "vendor", contact: "Marketing Lead", email: "billing@dentsu.vn", phone: "028-3829-7000", totalAmount: 120000000, outstanding: 120000000, status: "active", invoiceCount: 1 },
  { id: "p10", name: "Adobe Systems", type: "vendor", contact: "Adobe Sales", email: "sales@adobe.com", phone: "N/A", totalAmount: 42000000, outstanding: 42000000, status: "critical", invoiceCount: 1 },
];

const financialData = {
  revenue: {
    ytd: 12500000000, target: 50000000000, growth: 18,
    monthly: [
      { month: "T1", actual: 3800000000, target: 4000000000 },
      { month: "T2", actual: 4200000000, target: 4200000000 },
      { month: "T3", actual: 4500000000, target: 4400000000 },
    ],
    bySegment: [
      { name: "SaaS", amount: 5600000000, percent: 44.8, color: "#4f46e5" },
      { name: "Dịch vụ", amount: 4200000000, percent: 33.6, color: "#0891b2" },
      { name: "Đào tạo", amount: 1800000000, percent: 14.4, color: "#059669" },
      { name: "Khác", amount: 900000000, percent: 7.2, color: "#d97706" },
    ]
  },
  expenses: {
    ytd: 9300000000, budget: 10000000000, overBudget: false,
    monthly: [
      { month: "T1", actual: 2900000000, budget: 3000000000 },
      { month: "T2", actual: 3100000000, budget: 3200000000 },
      { month: "T3", actual: 3300000000, budget: 3800000000 },
    ],
    byCategory: [
      { name: "Nhân sự", amount: 6045000000, percent: 65, color: "#7c3aed" },
      { name: "Vận hành", amount: 1860000000, percent: 20, color: "#0891b2" },
      { name: "Marketing", amount: 930000000, percent: 10, color: "#db2777" },
      { name: "Khác", amount: 465000000, percent: 5, color: "#d97706" },
    ]
  },
  profit: { ytd: 3200000000, margin: 25.6, ebitda: 4100000000, ebitdaMargin: 32.8, target: 15000000000, progress: 21.3 },
  cashFlow: {
    operatingCF: 3800000000, investingCF: -1200000000, financingCF: -500000000,
    netCF: 2100000000, cashBalance: 18500000000,
    monthly: [
      { month: "T1", inflow: 3800000000, outflow: 2900000000 },
      { month: "T2", inflow: 4200000000, outflow: 3100000000 },
      { month: "T3", inflow: 4500000000, outflow: 3300000000 },
    ]
  },
  receivables: {
    total: 2850000000, overdue: 450000000,
    items: [
      { id: "ar-001", party: "Techcombank", amount: 450000000, dueDate: "25/03/2026", daysOverdue: 0, invoiceNo: "HD-2026-013", category: "Dịch vụ SaaS", contact: "Nguyễn Thị Lan", phone: "0901 234 567", createdDate: "10/03/2026", note: "Gói Enterprise VWork 200 users Q2/2026", history: [{ date: "10/03/2026", action: "Xuất hóa đơn", by: "Trần Thu Hà" }, { date: "12/03/2026", action: "Gửi email nhắc thanh toán", by: "Hệ thống" }] },
      { id: "ar-002", party: "FPT Software", amount: 180000000, dueDate: "27/03/2026", daysOverdue: 0, invoiceNo: "HD-2026-014", category: "Hoa hồng đối tác", contact: "Phạm Văn Hùng", phone: "0912 345 678", createdDate: "12/03/2026", note: "Hoa hồng giới thiệu khách hàng Q1/2026", history: [{ date: "12/03/2026", action: "Xuất hóa đơn", by: "Trần Thu Hà" }] },
      { id: "ar-003", party: "Masan Group", amount: 320000000, dueDate: "10/03/2026", daysOverdue: 3, invoiceNo: "HD-2026-012", category: "Tư vấn", contact: "Lê Thị Mai", phone: "0923 456 789", createdDate: "08/03/2026", note: "Dịch vụ tư vấn chuyển đổi số T3/2026", history: [{ date: "08/03/2026", action: "Xuất hóa đơn", by: "Trần Thu Hà" }, { date: "10/03/2026", action: "Đến hạn thanh toán", by: "Hệ thống" }, { date: "11/03/2026", action: "Gửi nhắc lần 1", by: "Hệ thống" }, { date: "13/03/2026", action: "Liên hệ trực tiếp", by: "Nguyễn Minh" }] },
      { id: "ar-004", party: "VPBank", amount: 130000000, dueDate: "05/03/2026", daysOverdue: 8, invoiceNo: "HD-2026-010b", category: "Dịch vụ SaaS", contact: "Trần Văn Nam", phone: "0934 567 890", createdDate: "20/02/2026", note: "Gia hạn VWork Pro 150 users - phần còn lại", history: [{ date: "20/02/2026", action: "Xuất hóa đơn", by: "Trần Thu Hà" }, { date: "05/03/2026", action: "Đến hạn thanh toán", by: "Hệ thống" }, { date: "07/03/2026", action: "Gửi nhắc lần 1", by: "Hệ thống" }, { date: "10/03/2026", action: "Gửi nhắc lần 2 + cảnh báo", by: "Hệ thống" }, { date: "13/03/2026", action: "Báo cáo ban lãnh đạo", by: "Trần Thu Hà" }] },
    ]
  },
  payables: {
    total: 1650000000, overdue: 222000000,
    items: [
      { id: "ap-001", party: "Dell Technologies VN", amount: 280000000, dueDate: "22/03/2026", daysOverdue: 0, invoiceNo: "HĐ-2026-031", category: "Thiết bị CNTT", contact: "David Nguyen", phone: "0901 111 222", createdDate: "10/03/2026", note: "Mua 14 laptop Dell XPS 15 cho team kỹ thuật", history: [{ date: "10/03/2026", action: "Nhận hóa đơn", by: "Phạm Lan" }, { date: "14/03/2026", action: "Chờ phê duyệt", by: "Hệ thống" }] },
      { id: "ap-002", party: "Amazon Web Services", amount: 195000000, dueDate: "22/03/2026", daysOverdue: 0, invoiceNo: "HĐ-2026-032", category: "Cloud & Hạ tầng", contact: "AWS Billing", phone: "N/A", createdDate: "12/03/2026", note: "Phí sử dụng dịch vụ AWS tháng 3/2026", history: [{ date: "12/03/2026", action: "Nhận hóa đơn tự động", by: "Hệ thống" }, { date: "13/03/2026", action: "Chờ phê duyệt CFO", by: "Phạm Lan" }] },
      { id: "ap-003", party: "BĐS Phú Mỹ Hưng", amount: 180000000, dueDate: "28/02/2026", daysOverdue: 15, invoiceNo: "HĐ-2026-025", category: "Văn phòng", contact: "Võ Thị Hoa", phone: "0902 222 333", createdDate: "01/02/2026", note: "Tiền thuê văn phòng T2/2026 — QUÁ HẠN 15 NGÀY, nguy cơ phạt hợp đồng", history: [{ date: "01/02/2026", action: "Nhận hóa đơn", by: "Phạm Lan" }, { date: "28/02/2026", action: "Đến hạn - chưa thanh toán", by: "Hệ thống" }, { date: "05/03/2026", action: "Nhà cho thuê gửi nhắc lần 1", by: "BĐS PMH" }, { date: "10/03/2026", action: "Nhắc ban lãnh đạo", by: "Trần Thu Hà" }, { date: "14/03/2026", action: "Báo cáo quá hạn khẩn cấp", by: "Trần Thu Hà" }] },
      { id: "ap-004", party: "Adobe Systems", amount: 42000000, dueDate: "06/03/2026", daysOverdue: 7, invoiceNo: "HĐ-2026-027", category: "Phần mềm", contact: "Adobe Support", phone: "N/A", createdDate: "01/03/2026", note: "Adobe Creative Cloud 20 licenses — QUÁ HẠN 7 NGÀY, tài khoản có thể bị khóa", history: [{ date: "01/03/2026", action: "Nhận hóa đơn gia hạn", by: "Hệ thống" }, { date: "06/03/2026", action: "Đến hạn - chưa thanh toán", by: "Hệ thống" }, { date: "08/03/2026", action: "Adobe gửi cảnh báo khóa tài khoản", by: "Adobe" }, { date: "12/03/2026", action: "Thông báo nội bộ khẩn", by: "Phạm Lan" }] },
    ]
  },
  tax: {
    vat: { amount: 380000000, period: "Q1/2026", dueDate: "30/04/2026" },
    corporateTax: { amount: 520000000, period: "Q1/2026", dueDate: "30/04/2026" },
    personalIncomeTax: { amount: 145000000, period: "T3/2026", dueDate: "20/04/2026" },
    ytdPaid: 850000000,
    reports: [
      { name: "Tờ khai VAT Q1/2026", status: "pending", deadline: "30/04/2026", amount: 380000000,
        type: "VAT", period: "Q1/2026", preparedBy: "Trần Thu Hà", taxAuthority: "Chi cục Thuế TP.HCM",
        taxCode: "0301234567", invoiceSold: 45, invoicePurchased: 62,
        breakdown: [
          { label: "Doanh thu chịu thuế 10%", base: "6.200.000.000", tax: "+620.000.000" },
          { label: "Thuế GTGT đầu vào được KT", base: "—", tax: "-240.000.000" },
          { label: "Thuế GTGT phải nộp", base: "—", tax: "380.000.000", highlight: true },
        ],
        outputInvoices: [
          { no: "HD-2026-011", date: "05/03/2026", buyer: "Tập đoàn Vingroup",   revenue: 850000000, vat: 85000000 },
          { no: "HD-2026-013", date: "10/03/2026", buyer: "Techcombank",          revenue: 450000000, vat: 45000000 },
          { no: "HD-2026-012", date: "08/03/2026", buyer: "Masan Group",          revenue: 320000000, vat: 32000000 },
          { no: "HD-2026-015", date: "28/02/2026", buyer: "VPBank",               revenue: 280000000, vat: 28000000 },
          { no: "HD-2026-014", date: "12/03/2026", buyer: "FPT Software",         revenue: 180000000, vat: 18000000 },
          { no: "HD-2026-016", date: "15/03/2026", buyer: "BIDV",                 revenue: 150000000, vat: 15000000 },
          { no: "HD-2026-017", date: "18/03/2026", buyer: "Sacombank",            revenue: 130000000, vat: 13000000 },
          { no: "HD-2026-018", date: "20/03/2026", buyer: "MB Bank",              revenue: 120000000, vat: 12000000 },
          { no: "(38 hóa đơn còn lại)",    date: "—",  buyer: "",                 revenue: 3720000000,vat: 372000000, isSummary: true },
        ],
        inputInvoices: [
          { no: "HĐ-2026-031", date: "10/03/2026", supplier: "Dell Technologies VN",      amount: 280000000, vat: 28000000, deductible: true },
          { no: "HĐ-2026-033", date: "08/03/2026", supplier: "BĐS Phú Mỹ Hưng",          amount: 180000000, vat: 18000000, deductible: true },
          { no: "HĐ-2026-034", date: "11/03/2026", supplier: "Dentsu Aegis VN",           amount: 120000000, vat: 12000000, deductible: true },
          { no: "HĐ-2026-035", date: "05/03/2026", supplier: "Trung tâm đào tạo FPT",    amount:  75000000, vat:  7500000, deductible: true },
          { no: "HĐ-2026-030", date: "01/03/2026", supplier: "Sodexo VN",                amount:  65000000, vat:  6500000, deductible: true },
          { no: "HĐ-2026-028", date: "25/02/2026", supplier: "Điện lực TP.HCM",          amount:  42000000, vat:  4200000, deductible: true },
          { no: "HĐ-2026-029", date: "28/02/2026", supplier: "Viettel Business",         amount:  18500000, vat:  1850000, deductible: true },
          { no: "HĐ-2026-032", date: "12/03/2026", supplier: "Amazon Web Services",      amount: 195000000, vat:        0, deductible: false, reason: "Dịch vụ nước ngoài — không có VAT đầu vào" },
          { no: "HĐ-2026-027", date: "01/03/2026", supplier: "Adobe Systems",            amount:  42000000, vat:        0, deductible: false, reason: "Phần mềm nước ngoài — không có VAT đầu vào" },
          { no: "(53 hóa đơn còn lại)",   date: "—",  supplier: "",                      amount: 1850000000,vat: 161950000, deductible: true, isSummary: true },
        ],
        history: [
          { date: "01/04/2026", action: "Hệ thống tự động tổng hợp số liệu Q1", by: "Hệ thống" },
          { date: "07/04/2026", action: "Kiểm tra và đối chiếu số liệu hóa đơn", by: "Trần Thu Hà" },
          { date: "10/04/2026", action: "Trình kế toán trưởng xem xét", by: "Trần Thu Hà" },
        ]
      },
      { name: "TNDN Q1/2026", status: "pending", deadline: "30/04/2026", amount: 520000000,
        type: "TNDN", period: "Q1/2026", preparedBy: "Trần Thu Hà", taxAuthority: "Chi cục Thuế TP.HCM",
        taxCode: "0301234567", taxRate: 20,
        breakdown: [
          { label: "Lợi nhuận trước thuế Q1", base: "2.600.000.000", tax: "—" },
          { label: "Điều chỉnh tăng thu nhập chịu thuế", base: "+200.000.000", tax: "—" },
          { label: "Thu nhập chịu thuế TNDN", base: "2.800.000.000", tax: "—" },
          { label: "Thuế TNDN tạm tính (20%)", base: "—", tax: "520.000.000", highlight: true },
        ],
        history: [
          { date: "02/04/2026", action: "Tổng hợp kết quả kinh doanh Q1/2026", by: "Hệ thống" },
          { date: "08/04/2026", action: "Kiểm tra và điều chỉnh số liệu", by: "Trần Thu Hà" },
          { date: "10/04/2026", action: "Trình kế toán trưởng xem xét và ký duyệt", by: "Trần Thu Hà" },
        ]
      },
      { name: "TNCN T3/2026", status: "pending", deadline: "20/04/2026", amount: 145000000,
        type: "TNCN", period: "T3/2026", preparedBy: "Phạm Lan", taxAuthority: "Chi cục Thuế TP.HCM",
        taxCode: "0301234567", employeeCount: 32,
        breakdown: [
          { label: "Tổng thu nhập tính thuế của NV", base: "850.000.000", tax: "—" },
          { label: "Số nhân viên chịu thuế TNCN", base: "32 người", tax: "—" },
          { label: "Thuế TNCN phải khấu trừ nộp NN", base: "—", tax: "145.000.000", highlight: true },
        ],
        history: [
          { date: "31/03/2026", action: "Tính toán bảng lương và TNCN tháng 3", by: "Phạm Lan" },
          { date: "03/04/2026", action: "Khấu trừ TNCN từ lương 32 nhân viên", by: "Hệ thống" },
          { date: "07/04/2026", action: "Kiểm tra đối chiếu danh sách chịu thuế", by: "Phạm Lan" },
        ]
      },
      { name: "Tờ khai VAT T2/2026", status: "submitted", deadline: "20/03/2026", amount: 312000000,
        type: "VAT", period: "T2/2026", preparedBy: "Trần Thu Hà", taxAuthority: "Chi cục Thuế TP.HCM",
        taxCode: "0301234567", submittedDate: "19/03/2026", receiptNo: "GNT-2026-03-0124",
        invoiceSold: 38, invoicePurchased: 51,
        breakdown: [
          { label: "Doanh thu chịu thuế 10%", base: "5.120.000.000", tax: "+512.000.000" },
          { label: "Thuế GTGT đầu vào được KT", base: "—", tax: "-200.000.000" },
          { label: "Thuế GTGT phải nộp", base: "—", tax: "312.000.000", highlight: true },
        ],
        outputInvoices: [
          { no: "HD-2026-004", date: "05/02/2026", buyer: "Tập đoàn Vingroup",   revenue: 780000000, vat: 78000000 },
          { no: "HD-2026-005", date: "10/02/2026", buyer: "Techcombank",          revenue: 420000000, vat: 42000000 },
          { no: "HD-2026-006", date: "12/02/2026", buyer: "Masan Group",          revenue: 290000000, vat: 29000000 },
          { no: "HD-2026-007", date: "18/02/2026", buyer: "VPBank",               revenue: 260000000, vat: 26000000 },
          { no: "HD-2026-008", date: "20/02/2026", buyer: "FPT Software",         revenue: 150000000, vat: 15000000 },
          { no: "(33 hóa đơn còn lại)",    date: "—",  buyer: "",                 revenue: 3220000000,vat: 322000000, isSummary: true },
        ],
        inputInvoices: [
          { no: "HĐ-2026-018", date: "01/02/2026", supplier: "BĐS Phú Mỹ Hưng",       amount: 180000000, vat: 18000000, deductible: true },
          { no: "HĐ-2026-019", date: "05/02/2026", supplier: "Dentsu Aegis VN",        amount: 110000000, vat: 11000000, deductible: true },
          { no: "HĐ-2026-020", date: "10/02/2026", supplier: "Sodexo VN",              amount:  62000000, vat:  6200000, deductible: true },
          { no: "HĐ-2026-021", date: "15/02/2026", supplier: "Điện lực TP.HCM",       amount:  40000000, vat:  4000000, deductible: true },
          { no: "HĐ-2026-022", date: "20/02/2026", supplier: "Viettel Business",      amount:  17500000, vat:  1750000, deductible: true },
          { no: "HĐ-2026-023", date: "12/02/2026", supplier: "Amazon Web Services",   amount: 185000000, vat:        0, deductible: false, reason: "Dịch vụ nước ngoài — không có VAT đầu vào" },
          { no: "(46 hóa đơn còn lại)",   date: "—",  supplier: "",                   amount: 1590000000,vat: 159050000, deductible: true, isSummary: true },
        ],
        history: [
          { date: "01/03/2026", action: "Tổng hợp số liệu tháng 2/2026", by: "Hệ thống" },
          { date: "15/03/2026", action: "Kiểm tra và hoàn thiện tờ khai", by: "Trần Thu Hà" },
          { date: "19/03/2026", action: "Nộp tờ khai qua cổng eTax Tổng cục Thuế", by: "Trần Thu Hà" },
          { date: "19/03/2026", action: "Hệ thống eTax xác nhận tiếp nhận thành công", by: "Cổng eTax" },
        ]
      },
      { name: "TNDN Q4/2025", status: "paid", deadline: "30/01/2026", amount: 480000000,
        type: "TNDN", period: "Q4/2025", preparedBy: "Trần Thu Hà", taxAuthority: "Chi cục Thuế TP.HCM",
        taxCode: "0301234567", submittedDate: "25/01/2026", receiptNo: "GNT-2026-01-0055", paidDate: "28/01/2026",
        taxRate: 20,
        breakdown: [
          { label: "Lợi nhuận trước thuế Q4/2025", base: "2.400.000.000", tax: "—" },
          { label: "Thu nhập chịu thuế TNDN", base: "2.400.000.000", tax: "—" },
          { label: "Thuế TNDN đã nộp (20%)", base: "—", tax: "480.000.000", highlight: true },
        ],
        history: [
          { date: "05/01/2026", action: "Tổng hợp kết quả kinh doanh Q4/2025", by: "Hệ thống" },
          { date: "20/01/2026", action: "Hoàn thiện tờ khai TNDN Q4/2025", by: "Trần Thu Hà" },
          { date: "25/01/2026", action: "Nộp tờ khai TNDN qua cổng eTax", by: "Trần Thu Hà" },
          { date: "28/01/2026", action: "Nộp thuế 480 triệu qua tài khoản ngân hàng MB Bank", by: "Phạm Lan" },
          { date: "28/01/2026", action: "Kho bạc Nhà nước xác nhận thu thuế thành công", by: "Kho bạc NN" },
        ]
      },
    ],
    payments: [
      { id: "tp-001", name: "VAT T2/2026", type: "VAT", period: "T2/2026",
        dueAmount: 312000000, totalPaid: 312000000, status: "paid",
        installments: [
          { date: "19/03/2026", amount: 312000000, bank: "MB Bank", ref: "TT20260319001", note: "Nộp đủ 1 lần" }
        ]
      },
      { id: "tp-002", name: "TNDN Q4/2025", type: "TNDN", period: "Q4/2025",
        dueAmount: 480000000, totalPaid: 480000000, status: "paid",
        installments: [
          { date: "15/01/2026", amount: 200000000, bank: "Vietcombank", ref: "TT20260115002", note: "Nộp lần 1" },
          { date: "28/01/2026", amount: 280000000, bank: "MB Bank",     ref: "TT20260128001", note: "Nộp lần 2 — hoàn tất" }
        ]
      },
      { id: "tp-003", name: "VAT Q4/2025", type: "VAT", period: "Q4/2025",
        dueAmount: 295000000, totalPaid: 295000000, status: "paid",
        installments: [
          { date: "20/01/2026", amount: 295000000, bank: "Vietcombank", ref: "TT20260120001", note: "Nộp đủ 1 lần" }
        ]
      },
      { id: "tp-004", name: "TNCN T2/2026", type: "TNCN", period: "T2/2026",
        dueAmount: 138000000, totalPaid: 138000000, status: "paid",
        installments: [
          { date: "18/03/2026", amount: 138000000, bank: "MB Bank", ref: "TT20260318001", note: "Nộp đủ 1 lần" }
        ]
      },
      { id: "tp-005", name: "VAT Q1/2026", type: "VAT", period: "Q1/2026",
        dueAmount: 380000000, totalPaid: 0, status: "pending", installments: []
      },
      { id: "tp-006", name: "TNDN Q1/2026", type: "TNDN", period: "Q1/2026",
        dueAmount: 520000000, totalPaid: 0, status: "pending", installments: []
      },
      { id: "tp-007", name: "TNCN T3/2026", type: "TNCN", period: "T3/2026",
        dueAmount: 145000000, totalPaid: 0, status: "pending", installments: []
      },
    ],
    reconciliation: [
      { period: "Q1/2026", items: [
        { type: "VAT",  dueAmount: 380000000, paidAmount: 0 },
        { type: "TNDN", dueAmount: 520000000, paidAmount: 0 },
        { type: "TNCN", dueAmount: 145000000, paidAmount: 0 },
      ]},
      { period: "T2/2026", items: [
        { type: "VAT",  dueAmount: 312000000, paidAmount: 312000000 },
        { type: "TNCN", dueAmount: 138000000, paidAmount: 138000000 },
      ]},
      { period: "Q4/2025", items: [
        { type: "VAT",  dueAmount: 295000000, paidAmount: 295000000 },
        { type: "TNDN", dueAmount: 480000000, paidAmount: 480000000 },
        { type: "TNCN", dueAmount: 133000000, paidAmount: 133000000 },
      ]},
      { period: "2025 (QT)", items: [
        { type: "TNDN", dueAmount: 120000000, paidAmount: 0,  note: "Chênh lệch quyết toán năm" },
        { type: "TNCN", dueAmount:  28000000, paidAmount: 0,  note: "Quyết toán cuối năm" },
        { type: "VAT",  dueAmount: -45000000, paidAmount: 0,  note: "Nộp thừa — đang hoàn" },
      ]},
    ],
    debts: [
      { id: "td-001", name: "Thuế TNDN 2025 — chênh lệch quyết toán", type: "TNDN",
        amount: 120000000, kind: "payable" as const, deadline: "31/03/2026", daysOverdue: 10,
        note: "Chênh lệch giữa thuế tạm tính và quyết toán năm 2025. Đã tạm tính 1.92 tỷ, quyết toán thực tế 2.04 tỷ.",
        history: [
          { date: "15/02/2026", action: "Hoàn thiện quyết toán thuế TNDN 2025", by: "Trần Thu Hà" },
          { date: "20/02/2026", action: "Phát hiện chênh lệch 120 triệu cần nộp bổ sung", by: "Phạm Lan" },
          { date: "31/03/2026", action: "Đến hạn nộp — CHƯA THANH TOÁN", by: "Hệ thống" },
        ]
      },
      { id: "td-002", name: "Thuế TNCN 2025 — quyết toán cuối năm", type: "TNCN",
        amount: 28000000, kind: "payable" as const, deadline: "31/03/2026", daysOverdue: 10,
        note: "TNCN quyết toán năm 2025 còn thiếu sau khi đối chiếu toàn bộ nhân viên có thu nhập từ 2 nguồn.",
        history: [
          { date: "10/02/2026", action: "Tổng hợp quyết toán TNCN 2025 toàn công ty", by: "Phạm Lan" },
          { date: "25/02/2026", action: "Phát hiện 28 triệu TNCN thiếu từ nhân viên hợp đồng", by: "Phạm Lan" },
          { date: "31/03/2026", action: "Đến hạn nộp — CHƯA THANH TOÁN", by: "Hệ thống" },
        ]
      },
      { id: "td-003", name: "Thuế VAT Q4/2025 — nộp thừa", type: "VAT",
        amount: 45000000, kind: "refundable" as const, deadline: "—", daysOverdue: 0,
        note: "Phát sinh do điều chỉnh giảm hóa đơn dịch vụ sau khi đã nộp VAT Q4. Đang làm hồ sơ hoàn thuế.",
        history: [
          { date: "10/01/2026", action: "Phát hiện nộp thừa sau đối chiếu HĐ điều chỉnh", by: "Trần Thu Hà" },
          { date: "20/01/2026", action: "Lập hồ sơ đề nghị hoàn thuế GTGT", by: "Trần Thu Hà" },
          { date: "05/02/2026", action: "Nộp hồ sơ hoàn thuế tại Chi cục Thuế", by: "Phạm Lan" },
          { date: "07/02/2026", action: "Chi cục Thuế tiếp nhận và đang xem xét", by: "Chi cục Thuế" },
        ]
      },
      { id: "td-004", name: "Thuế TNDN Q2/2025 — nộp thừa đã xử lý", type: "TNDN",
        amount: 15000000, kind: "refundable" as const, deadline: "—", daysOverdue: 0,
        note: "Đã bù trừ vào số thuế TNDN tạm tính Q3/2025 theo xác nhận của cơ quan thuế.",
        history: [
          { date: "01/08/2025", action: "Xác nhận nộp thừa 15 triệu TNDN Q2", by: "Phạm Lan" },
          { date: "15/08/2025", action: "Chi cục Thuế đồng ý bù trừ vào Q3", by: "Chi cục Thuế" },
          { date: "30/09/2025", action: "Đã bù trừ thành công vào TNDN Q3/2025", by: "Hệ thống" },
        ]
      },
    ]
  },
  budget: {
    total: 25000000000, used: 6800000000,
    byCategory: [
      { name: "Lương & phúc lợi",          allocated: 9500000000, used: 3820000000, color: "#7c3aed" },
      { name: "Công nghệ & phần mềm",       allocated: 4000000000, used: 1250000000, color: "#0891b2" },
      { name: "Marketing & quảng cáo",      allocated: 3000000000, used:  920000000, color: "#db2777" },
      { name: "Văn phòng & vận hành",       allocated: 3500000000, used:  680000000, color: "#059669" },
      { name: "Nghiên cứu & phát triển",    allocated: 3000000000, used:  100000000, color: "#4f46e5" },
      { name: "Đào tạo & phát triển NL",    allocated: 2000000000, used:  130000000, color: "#d97706" },
    ],
    byDept: [
      { dept: "Kỹ thuật",     allocated: 8000000000, used: 2100000000, color: "#4f46e5" },
      { dept: "Marketing",    allocated: 4000000000, used: 1200000000, color: "#db2777" },
      { dept: "Nhân sự",      allocated: 5000000000, used: 1800000000, color: "#0891b2" },
      { dept: "Vận hành",     allocated: 3000000000, used:  980000000, color: "#059669" },
      { dept: "R&D",          allocated: 3500000000, used:  520000000, color: "#7c3aed" },
      { dept: "Ban lãnh đạo", allocated: 1500000000, used:  200000000, color: "#d97706" },
    ],
    byProject: [
      { name: "VWork Pro v3.0",              allocated: 6000000000, used: 2100000000, color: "#4f46e5", status: "on-track" as const },
      { name: "Cloud Infrastructure",        allocated: 3000000000, used: 2200000000, color: "#ef4444", status: "over-budget" as const },
      { name: "AI Assistant Platform",       allocated: 4000000000, used:  650000000, color: "#0891b2", status: "on-track" as const },
      { name: "Mở rộng thị trường ĐNA",     allocated: 5000000000, used:  800000000, color: "#059669", status: "on-track" as const },
      { name: "Brand Campaign 2026",         allocated: 3000000000, used:  900000000, color: "#db2777", status: "on-track" as const },
      { name: "Partner Network",             allocated: 4000000000, used:  150000000, color: "#d97706", status: "slow" as const },
    ],
  }
};

/* ═══════════ All detail data ═══════════ */
const allDetails: Record<string, DetailData> = {
  // ── FINANCE ──
  "fi-revenue": { title: "Doanh thu Q1/2026", emoji: "📊", type: "article",
    description: "Tổng doanh thu Q1/2026 đạt 12.5 tỷ VNĐ, tăng 18% so với cùng kỳ năm trước. Mảng SaaS tăng trưởng mạnh nhất với 45% thị phần.",
    meta: [{ label: "Kỳ báo cáo", value: "Q1/2026" }, { label: "Người lập", value: "Trần Thu Hà" }, { label: "Ngày tạo", value: "15/03/2026" }, { label: "Trạng thái", value: "Đã duyệt", highlight: true }],
    stats: [{ label: "Tổng doanh thu", value: "12.5 tỷ", trend: "up" }, { label: "Tăng trưởng", value: "+18%", trend: "up" }, { label: "SaaS", value: "5.6 tỷ", trend: "up" }, { label: "Dịch vụ", value: "4.2 tỷ" }],
    tags: ["Doanh thu", "Q1", "Báo cáo"]
  },
  "fi-expense": { title: "Chi phí hoạt động T3", emoji: "💸", type: "article",
    description: "Tổng chi phí hoạt động tháng 3 là 2.1 tỷ VNĐ. Chi phí nhân sự chiếm 65%, vận hành 20%, marketing 10%, khác 5%.",
    meta: [{ label: "Tháng", value: "03/2026" }, { label: "Ngân sách", value: "2.0 tỷ" }, { label: "Thực chi", value: "2.1 tỷ" }, { label: "Chênh lệch", value: "+5%", highlight: true }],
    stats: [{ label: "Nhân sự", value: "1.37 tỷ" }, { label: "Vận hành", value: "420 tr" }, { label: "Marketing", value: "210 tr" }, { label: "Khác", value: "105 tr" }],
    tags: ["Chi phí", "T3", "Vượt ngân sách"]
  },
  "fi-profit": { title: "Lợi nhuận ròng YTD", emoji: "📈", type: "article",
    description: "Lợi nhuận ròng Year-to-Date đạt 3.2 tỷ VNĐ, biên lợi nhuận 25.6%. Mục tiêu cả năm: 15 tỷ VNĐ (đạt 21.3%).",
    meta: [{ label: "Lợi nhuận YTD", value: "3.2 tỷ" }, { label: "Biên LN", value: "25.6%" }, { label: "Mục tiêu năm", value: "15 tỷ" }, { label: "Tiến độ", value: "21.3%", highlight: true }],
    progressPercent: 21, tags: ["Lợi nhuận", "YTD"]
  },
  "fi-budget": { title: "Ngân sách dự án 2026", emoji: "🎯", type: "article",
    description: "Tổng ngân sách phân bổ cho các dự án năm 2026: 25 tỷ VNĐ. Chi tiết phân bổ theo từng bộ phận và dòng sản phẩm.",
    meta: [{ label: "Tổng ngân sách", value: "25 tỷ" }, { label: "Đã sử dụng", value: "6.8 tỷ" }, { label: "Còn lại", value: "18.2 tỷ" }, { label: "Q1 Burn rate", value: "27.2%" }],
    progressPercent: 27
  },
  "fi-inv-pending": {
    title: "Hóa đơn",
    emoji: "🧾",
    type: "ticket",
    description: "5 hoá đơn đang chờ phê duyệt với tổng giá trị 850 triệu VNĐ. Vui lòng xem xét và phê duyệt trước hạn 22/03/2026.",
    meta: [
      { label: "Số lượng", value: "5 hoá đơn" },
      { label: "Tổng giá trị", value: "850,000,000 VNĐ" },
      { label: "Hạn duyệt", value: "22/03/2026", highlight: true },
      { label: "Đã duyệt", value: "2/5" },
    ],
    checklist: [
      { label: "HĐ Thiết bị CNTT - 280 triệu", done: false },
      { label: "HĐ Cloud AWS - 195 triệu", done: false },
      { label: "HĐ Thuê VP Q2 - 180 triệu", done: true },
      { label: "HĐ Marketing - 120 triệu", done: false },
      { label: "HĐ Đào tạo - 75 triệu", done: true },
    ],
    ticketTimeline: [
      { time: "10/03", action: "Gửi đề nghị phê duyệt", user: "Trần Thu Hà" },
      { time: "14/03", action: "Duyệt HĐ Thuê VP Q2", user: "Nguyễn Minh" },
      { time: "15/03", action: "Duyệt HĐ Đào tạo", user: "Nguyễn Minh" },
      { time: "17/03", action: "Nhắc nhở duyệt còn lại", user: "Hệ thống" },
    ],
    tags: ["Chờ duyệt", "Ưu tiên cao"],
  },
  "fi-overdue-rent": {
    title: "Tiền thuê VP T2 chậm thanh toán",
    emoji: "🏢",
    type: "ticket",
    description: "Hóa đơn tiền thuê văn phòng tháng 2/2026 chưa được thanh toán. Đã quá hạn 15 ngày, cần xử lý gấp để tránh phát sinh phí phạt.",
    meta: [
      { label: "Số tiền", value: "180,000,000 VNĐ" },
      { label: "Hạn thanh toán", value: "28/02/2026", highlight: true },
      { label: "Quá hạn", value: "15 ngày", highlight: true },
      { label: "Chủ nhà", value: "Công ty BĐS Phú Mỹ Hưng" },
      { label: "Trạng thái", value: "⚠️ Quá hạn" },
    ],
    ticketTimeline: [
      { time: "28/02", action: "Đến hạn thanh toán", user: "Hệ thống" },
      { time: "05/03", action: "Gửi nhắc nhở lần 1", user: "Tự động" },
      { time: "10/03", action: "Gửi nhắc nhở lần 2", user: "Tự động" },
      { time: "14/03", action: "Báo cáo quá hạn lên Ban GĐ", user: "Trần Thu Hà" },
    ],
    tags: ["Quá hạn", "Ưu tiên cao", "Văn phòng"],
  },
  "fi-overdue-sw": {
    title: "Phần mềm Adobe Creative Cloud",
    emoji: "💻",
    type: "ticket",
    description: "Hóa đơn gia hạn gói Adobe Creative Cloud (20 licenses) chưa thanh toán. Quá hạn 7 ngày, tài khoản có thể bị khóa trong 3 ngày tới.",
    meta: [
      { label: "Số tiền", value: "42,000,000 VNĐ" },
      { label: "Hạn thanh toán", value: "06/03/2026", highlight: true },
      { label: "Quá hạn", value: "7 ngày", highlight: true },
      { label: "Nhà cung cấp", value: "Adobe Systems" },
      { label: "Số licenses", value: "20 tài khoản" },
      { label: "Trạng thái", value: "🔴 Nguy cơ bị khóa" },
    ],
    ticketTimeline: [
      { time: "06/03", action: "Đến hạn thanh toán", user: "Hệ thống" },
      { time: "08/03", action: "Adobe gửi cảnh báo lần 1", user: "Adobe" },
      { time: "12/03", action: "Thông báo nội bộ", user: "Phạm Lan" },
    ],
    tags: ["Quá hạn", "Adobe", "Phần mềm", "Khẩn cấp"],
  },
  "fi-inv-paid": { title: "Đã thanh toán T3", emoji: "✅", type: "article",
    description: "12 hoá đơn đã được thanh toán trong tháng 3 với tổng giá trị 1.8 tỷ VNĐ.",
    meta: [{ label: "Số lượng", value: "12 hoá đơn" }, { label: "Tổng giá trị", value: "1.8 tỷ" }, { label: "Đúng hạn", value: "11/12" }, { label: "Trễ hạn", value: "1 hoá đơn" }]
  },
  "fi-payroll": { title: "Bảng lương T3/2026", emoji: "💰", type: "article",
    description: "Bảng lương tháng 3/2026 đã được tính toán và gửi qua email cho toàn bộ nhân viên. Tổng quỹ lương: 1.2 tỷ VNĐ.",
    meta: [{ label: "Tổng quỹ lương", value: "1.2 tỷ" }, { label: "Nhân viên", value: "52 người" }, { label: "Ngày thanh toán", value: "25/03/2026" }, { label: "Trạng thái", value: "Đã gửi", highlight: true }]
  },
  "fi-tax": { title: "Báo cáo thuế Q1", emoji: "🏛️", type: "article",
    description: "Báo cáo thuế GTGT, thuế TNDN quý 1/2026. Hạn nộp: 30/04/2026.",
    meta: [{ label: "Thuế GTGT", value: "380 triệu" }, { label: "Thuế TNDN", value: "520 triệu" }, { label: "Hạn nộp", value: "30/04/2026" }, { label: "Trạng thái", value: "Đang chuẩn bị" }]
  },
  "fi-overview": { title: "Tổng quan tài chính", emoji: "📊", type: "article", description: "Dashboard tài chính Q1/2026", meta: [] },
  "fi-calculator": { title: "Máy tính lãi suất", emoji: "🔢", type: "article",
    description: "Công cụ tính lãi suất vay, lãi suất tiền gửi, và ROI cho các khoản đầu tư dự án.",
    meta: [{ label: "Loại", value: "Công cụ nội bộ" }, { label: "Cập nhật", value: "18/03/2026" }]
  },
  "fi-exchange": { title: "Tỷ giá ngoại tệ", emoji: "💱", type: "article",
    description: "Tỷ giá hôm nay: USD/VND 24,850 | EUR/VND 27,120 | JPY/VND 166.5",
    meta: [{ label: "USD/VND", value: "24,850" }, { label: "EUR/VND", value: "27,120" }, { label: "JPY/VND", value: "166.5" }, { label: "Cập nhật", value: "09:00 18/03" }],
    stats: [{ label: "USD/VND", value: "24,850", trend: "up" }, { label: "EUR/VND", value: "27,120", trend: "down" }, { label: "JPY/VND", value: "166.5" }, { label: "GBP/VND", value: "31,450", trend: "up" }]
  },

  // ── CULTURE ──
  "cu-teambuilding": { title: "Team building Đà Lạt", emoji: "🏕️", type: "event",
    description: "Chuyến team building 3 ngày 2 đêm tại Đà Lạt. Chương trình bao gồm: trekking, BBQ, team game, camping và tham quan du lịch.",
    meta: [{ label: "Thời gian", value: "05-07/04/2026" }, { label: "Địa điểm", value: "Đà Lạt, Lâm Đồng" }, { label: "Số người", value: "45/50 đã ĐK", highlight: true }, { label: "Chi phí", value: "Công ty 100%" }],
    eventSchedule: [
      { time: "06:00 - Ngày 1", activity: "Xuất phát từ văn phòng" },
      { time: "12:00 - Ngày 1", activity: "Check-in & ăn trưa" },
      { time: "14:00 - Ngày 1", activity: "Team games & Trekking" },
      { time: "18:00 - Ngày 1", activity: "BBQ & Campfire" },
      { time: "08:00 - Ngày 2", activity: "Tham quan TP Đà Lạt" },
      { time: "14:00 - Ngày 2", activity: "Thể thao & Trò chơi" },
      { time: "08:00 - Ngày 3", activity: "Check-out & Về TP.HCM" },
    ],
    participants: [
      { initials: "MA", name: "Minh Anh", color: "#0891b2" },
      { initials: "TH", name: "Văn Hùng", color: "#7c3aed" },
      { initials: "LM", name: "Thị Mai", color: "#db2777" },
      { initials: "PH", name: "Hoàng", color: "#059669" },
      { initials: "ND", name: "Đức Anh", color: "#ea580c" },
    ],
    tags: ["Team building", "Đà Lạt", "Q2"]
  },
  "cu-birthday": { title: "Sinh nhật tháng 4", emoji: "🎂", type: "event",
    description: "Chúc mừng sinh nhật các thành viên tháng 4! Buổi tiệc tại pantry tầng 5 với bánh kem, hoa và quà tặng.",
    meta: [{ label: "Ngày tổ chức", value: "15/04 - 15:00" }, { label: "Địa điểm", value: "Pantry tầng 5" }, { label: "Sinh nhật", value: "3 thành viên" }],
    participants: [
      { initials: "TL", name: "Tuấn Linh - 02/04", color: "#6366f1" },
      { initials: "HN", name: "Hồng Nhung - 15/04", color: "#ec4899" },
      { initials: "QD", name: "Quốc Đạt - 22/04", color: "#f59e0b" },
    ]
  },
  "cu-sports": { title: "Giải bóng đá mini", emoji: "⚽", type: "event",
    description: "Giải bóng đá mini nội bộ giữa 4 team: Engineering, Product, Sales, Operations.",
    meta: [{ label: "Ngày thi đấu", value: "20/04/2026" }, { label: "Sân", value: "Sân Thành Đô" }, { label: "Số đội", value: "4 đội" }, { label: "Giải thưởng", value: "5 triệu VNĐ" }]
  },
  "cu-party": { title: "Friday Happy Hour", emoji: "🍻", type: "event",
    description: "Happy Hour vào mỗi thứ 6 cuối tuần tại pantry tầng 5. Đồ uống và snacks miễn phí!",
    meta: [{ label: "Thời gian", value: "17:00-18:30" }, { label: "Địa điểm", value: "Pantry tầng 5" }, { label: "Tần suất", value: "Hàng tuần" }]
  },
  "cu-innovation": { title: "Đổi mới sáng tạo", emoji: "💡", type: "policy",
    description: "Giá trị cốt lõi #1: Luôn tìm kiếm giải pháp sáng tạo, không ngại thử nghiệm, chấp nhận thất bại để học hỏi. Mỗi Q có Innovation Day để pitch ý tưởng mới.",
    meta: [{ label: "Loại", value: "Giá trị cốt lõi" }, { label: "Innovation Day", value: "Cuối mỗi quý" }]
  },
  "cu-teamwork": { title: "Tinh thần đồng đội", emoji: "🤝", type: "policy",
    description: "Giá trị cốt lõi #2: Hợp tác xuyên team, chia sẻ kiến thức, và hỗ trợ lẫn nhau để đạt mục tiêu chung.",
    meta: [{ label: "Loại", value: "Giá trị cốt lõi" }, { label: "Cross-team projects", value: "8 dự án/năm" }]
  },
  "cu-growth": { title: "Phát triển bản thân", emoji: "🌱", type: "policy",
    description: "Giá trị cốt lõi #3: Mỗi nhân viên có budget 15 triệu/năm cho đào tạo, được dành 10% thời gian làm việc cho self-learning.",
    meta: [{ label: "Budget đào tạo", value: "15 triệu/năm/người" }, { label: "Learning time", value: "10% working hours" }]
  },
  "cu-customer": { title: "Khách hàng là trọng tâm", emoji: "❤️", type: "policy",
    description: "Giá trị cốt lõi #4: Mọi quyết định đều lấy khách hàng làm trung tâm. NPS target: >70.",
    meta: [{ label: "NPS hiện tại", value: "72" }, { label: "CSAT", value: "4.5/5" }, { label: "Mục tiêu NPS", value: ">70" }]
  },
  "cu-employee": { title: "Nhân viên xuất sắc T3", emoji: "🏆", type: "announcement",
    description: "Chúc mừng Nguyễn Minh Anh (Engineering) - Nhân viên xuất sắc tháng 3/2026! Đóng góp nổi bật trong dự án VWork Mobile.",
    meta: [{ label: "Người được vinh danh", value: "Nguyễn Minh Anh" }, { label: "Bộ phận", value: "Engineering" }, { label: "Phần thưởng", value: "5 triệu + 1 ngày nghỉ" }]
  },
  "cu-team-award": { title: "Team xuất sắc Q1", emoji: "🥇", type: "announcement",
    description: "Team Platform Engineering được vinh danh là Team xuất sắc Q1/2026 với việc hoàn thành 100% OKRs và zero production incidents.",
    meta: [{ label: "Team", value: "Platform Engineering" }, { label: "OKR completion", value: "100%" }, { label: "Incidents", value: "0" }, { label: "Phần thưởng", value: "Team trip + 10 triệu" }]
  },
  "cu-kudos": { title: "Bảng Kudos", emoji: "⭐", type: "discussion",
    description: "Gửi lời cảm ơn và ghi nhận đồng nghiệp! Tháng này đã có 28 kudos được gửi.",
    meta: [{ label: "Tổng kudos T3", value: "28" }, { label: "Top nhận", value: "Minh Anh (5)" }, { label: "Top gửi", value: "Thu Hà (4)" }]
  },

  // ── SUPPORT – KB & ANNOUNCEMENTS ──
  "csk-sla": { title: "Chính sách SLA 2026", emoji: "📋", type: "policy",
    category: "Thông báo kênh", badge: "Quan trọng", publishedAt: "01/04/2026", publishedBy: "Team Lead CSKH",
    description: "Chính sách thỏa thuận mức dịch vụ (SLA) áp dụng từ Q2/2026. Phản hồi lần đầu trong vòng 2 giờ với ticket ưu tiên cao, 8 giờ với ticket thường.",
    meta: [{ label: "Áp dụng từ", value: "01/04/2026", highlight: true }, { label: "Ticket Khẩn", value: "Phản hồi < 2 giờ" }, { label: "Ticket Thường", value: "Phản hồi < 8 giờ" }, { label: "Giải quyết", value: "< 24 giờ" }],
    tags: ["SLA", "Chính sách", "Quan trọng"]
  },
  "csk-template": { title: "Mẫu phản hồi khách hàng", emoji: "📝", type: "policy",
    category: "Thông báo kênh", badge: "Cập nhật", publishedAt: "28/03/2026", publishedBy: "QA & Training",
    description: "Bộ mẫu phản hồi chuẩn cho các tình huống thường gặp: chào hỏi, xin lỗi, hướng dẫn, leo thang, kết thúc. Cập nhật tone-of-voice mới theo brand guidelines 2026.",
    meta: [{ label: "Số mẫu", value: "24 mẫu" }, { label: "Cập nhật", value: "28/03/2026" }, { label: "Tác giả", value: "QA Team" }, { label: "Version", value: "v3.1" }],
    tags: ["Template", "Phản hồi", "Cập nhật"]
  },
  "csk-kpi": { title: "KPI & Mục tiêu Q2/2026", emoji: "🎯", type: "announcement",
    category: "Thông báo kênh", badge: "Mới", publishedAt: "05/04/2026", publishedBy: "Manager CSKH",
    description: "Mục tiêu Q2/2026 của team CSKH: CSAT ≥ 4.5/5, First Response Time < 2h, Resolution Rate ≥ 95%, Ticket Backlog < 20.",
    meta: [{ label: "CSAT mục tiêu", value: "≥ 4.5/5", highlight: true }, { label: "First Response", value: "< 2 giờ" }, { label: "Resolution Rate", value: "≥ 95%" }, { label: "Backlog", value: "< 20 tickets" }],
    tags: ["KPI", "Q2/2026", "Mục tiêu"]
  },
  "csk-faq": { title: "FAQ thường gặp", emoji: "❓", type: "article",
    category: "Cơ sở kiến thức",
    description: "Tổng hợp 24 câu hỏi thường gặp từ khách hàng và hướng dẫn trả lời chuẩn. Bao gồm: đăng nhập/SSO, thanh toán, nâng cấp gói, tích hợp API, báo cáo.",
    meta: [{ label: "Số câu hỏi", value: "24" }, { label: "Cập nhật", value: "15/03/2026" }, { label: "Lượt xem", value: "312" }, { label: "Tác giả", value: "Knowledge Team" }],
    tags: ["FAQ", "Kiến thức", "Self-service"]
  },
  "csk-guide": { title: "Hướng dẫn xử lý ticket", emoji: "📖", type: "article",
    category: "Cơ sở kiến thức",
    description: "Quy trình xử lý ticket từ A đến Z: tiếp nhận, phân loại, assign, xử lý, leo thang, đóng ticket và follow-up. Đặc biệt chú ý các trường hợp VIP và Urgent.",
    meta: [{ label: "Thời gian đọc", value: "8 phút" }, { label: "Cập nhật", value: "20/03/2026" }, { label: "Lượt xem", value: "89" }],
    tags: ["Hướng dẫn", "Quy trình", "Ticket"]
  },
  "csk-script": { title: "Script tư vấn & xử lý", emoji: "🎙️", type: "article",
    category: "Cơ sở kiến thức",
    description: "Bộ script chi tiết cho các kịch bản: cuộc gọi inbound, outbound follow-up, khiếu nại, hoàn tiền, upsell. Tone chuyên nghiệp, thân thiện và hiệu quả.",
    meta: [{ label: "Số kịch bản", value: "18" }, { label: "Cập nhật", value: "10/03/2026" }, { label: "Đánh giá", value: "4.8/5" }],
    tags: ["Script", "Tư vấn", "Call Center"]
  },
  "csk-escalation": { title: "Quy trình leo thang", emoji: "⚡", type: "policy",
    category: "Cơ sở kiến thức",
    description: "Khi nào cần leo thang? Level 1 → L2 sau 4h không giải quyết được. L2 → L3/Manager khi ảnh hưởng nhiều khách hàng hoặc mất dữ liệu. Emergency: báo ngay Manager.",
    meta: [{ label: "L1 → L2", value: "Sau 4 giờ" }, { label: "L2 → L3", value: "Critical bugs" }, { label: "Emergency", value: "Ngay lập tức" }, { label: "Liên hệ L3", value: "@tech-oncall" }],
    tags: ["Escalation", "Quy trình", "Khẩn cấp"]
  },

  // ── SUPPORT – TICKETS ──
  "sp-892": { title: "Case #892 - Lỗi thanh toán", emoji: "🔴", type: "ticket", ticketStatus: "open",
    description: "Khách hàng báo lỗi không thể thanh toán qua VNPay từ 08:00 sáng nay. Đã xác nhận lỗi gateway VNPay.",
    meta: [{ label: "Khách hàng", value: "Công ty ABC" }, { label: "Ưu tiên", value: "🔴 Khẩn cấp", highlight: true }, { label: "SLA", value: "Còn 2 giờ" }, { label: "Người xử lý", value: "Lê Hoàng" }],
    ticketTimeline: [
      { time: "08:15", action: "Khách hàng tạo ticket", user: "Nguyễn Văn A (ABC Corp)" },
      { time: "08:22", action: "Ticket được assign", user: "Lê Hoàng" },
      { time: "08:35", action: "Xác nhận lỗi gateway VNPay", user: "Lê Hoàng" },
      { time: "08:45", action: "Liên hệ kỹ thuật VNPay", user: "Lê Hoàng" },
      { time: "09:10", action: "VNPay xác nhận đang fix", user: "VNPay Support" },
    ],
    tags: ["Thanh toán", "VNPay", "Urgent"]
  },
  "sp-891": { title: "Case #891 - Không đăng nhập được", emoji: "🟡", type: "ticket", ticketStatus: "in_progress",
    description: "SSO qua Google không hoạt động. Token refresh bị lỗi. Đang deploy hotfix.",
    meta: [{ label: "Khách hàng", value: "Startup XYZ" }, { label: "Ưu tiên", value: "🟡 Trung bình" }, { label: "SLA", value: "Còn 6 giờ" }, { label: "Người xử lý", value: "Trần Minh" }],
    ticketTimeline: [
      { time: "07:30", action: "Báo lỗi đăng nhập SSO", user: "Admin XYZ" },
      { time: "07:45", action: "Assign cho Trần Minh", user: "System" },
      { time: "08:00", action: "Phát hiện lỗi token refresh", user: "Trần Minh" },
      { time: "08:30", action: "Đang deploy hotfix", user: "Trần Minh" },
    ]
  },
  "sp-890": { title: "Case #890 - Yêu cầu hoàn tiền", emoji: "🟡", type: "ticket", ticketStatus: "waiting",
    description: "Khách hàng yêu cầu hoàn tiền cho gói Premium đã mua 5 ngày trước vì không sử dụng hết tính năng.",
    meta: [{ label: "Khách hàng", value: "Trần Thị B" }, { label: "Ưu tiên", value: "🟡 Trung bình" }, { label: "Gói", value: "Premium - 599k/tháng" }, { label: "Người xử lý", value: "Nguyễn Linh" }],
    ticketTimeline: [
      { time: "14:00", action: "Yêu cầu hoàn tiền", user: "Trần Thị B" },
      { time: "14:15", action: "Đang xem xét chính sách", user: "Nguyễn Linh" },
    ]
  },
  "sp-889": { title: "Case #889 - Hỏi về gói dịch vụ", emoji: "🟢", type: "ticket", ticketStatus: "open",
    description: "Khách hàng muốn tìm hiểu về gói Enterprise và các tính năng API integration.",
    meta: [{ label: "Khách hàng", value: "Công ty DEF" }, { label: "Ưu tiên", value: "🟢 Thấp" }, { label: "Loại", value: "Pre-sales" }, { label: "Người xử lý", value: "Sales Team" }]
  },
  "sp-888": { title: "Case #888 - Lỗi hiển thị mobile", emoji: "🟡", type: "ticket", ticketStatus: "in_progress",
    description: "Dashboard không hiển thị đúng trên iPad Safari. Charts bị overlap.",
    meta: [{ label: "Khách hàng", value: "Công ty GHI" }, { label: "Ưu tiên", value: "🟡 Trung bình" }, { label: "Device", value: "iPad Safari" }, { label: "Người xử lý", value: "FE Team" }]
  },
  "sp-887": { title: "Case #887 - Cập nhật thông tin", emoji: "✅", type: "ticket", ticketStatus: "resolved",
    description: "Đã hỗ trợ khách hàng cập nhật thông tin công ty và domain email.",
    meta: [{ label: "Khách hàng", value: "Startup JKL" }, { label: "Trạng thái", value: "✅ Đã giải quyết", highlight: true }, { label: "Thời gian xử lý", value: "25 phút" }]
  },
  "sp-886": { title: "Case #886 - Hướng dẫn sử dụng", emoji: "✅", type: "ticket", ticketStatus: "resolved",
    description: "Hướng dẫn khách hàng sử dụng tính năng Automation và Webhook.",
    meta: [{ label: "Khách hàng", value: "Công ty MNO" }, { label: "Trạng thái", value: "✅ Đã giải quyết", highlight: true }, { label: "Thời gian xử lý", value: "40 phút" }]
  },
  "sp-885": { title: "Case #885 - Khiếu nại dịch vụ", emoji: "✅", type: "ticket", ticketStatus: "resolved",
    description: "Khiếu nại về thời gian downtime 2 giờ ngày 15/03. Đã gửi SLA credit.",
    meta: [{ label: "Khách hàng", value: "Enterprise PQR" }, { label: "Trạng thái", value: "✅ Đã giải quyết", highlight: true }, { label: "SLA Credit", value: "Đã cấp" }]
  },

  // ── WORKSHOP ──
  "ws-docker": { title: "Docker cơ bản cho Dev", emoji: "🐳", type: "event",
    description: "Workshop thực hành Docker cho developer. Nội dung: Docker concepts, Dockerfile, Docker Compose, multi-stage builds.",
    meta: [{ label: "Thời gian", value: "21/03 • 14:00-16:00" }, { label: "Địa điểm", value: "Phòng họp tầng 3" }, { label: "Diễn giả", value: "Đức Anh - DevOps Lead" }, { label: "Slots", value: "18/25", highlight: true }],
    eventSchedule: [
      { time: "14:00-14:30", activity: "Docker fundamentals & architecture" },
      { time: "14:30-15:00", activity: "Hands-on: Dockerfile & build" },
      { time: "15:00-15:30", activity: "Docker Compose & networking" },
      { time: "15:30-16:00", activity: "Best practices & Q&A" },
    ],
    tags: ["Docker", "DevOps", "Hands-on"]
  },
  "ws-figma": { title: "Figma cho PM", emoji: "🎨", type: "event",
    description: "Workshop Figma cơ bản dành cho Product Managers. Học cách đọc design specs, comment, và prototype.",
    meta: [{ label: "Thời gian", value: "25/03 • 10:00-12:00" }, { label: "Diễn giả", value: "Ngọc Anh - Design Lead" }, { label: "Slots", value: "12/20" }],
    tags: ["Figma", "Design", "PM"]
  },
  "ws-ai": { title: "AI & Machine Learning 101", emoji: "🤖", type: "event",
    description: "Giới thiệu AI/ML cho non-technical roles. Nội dung: AI concepts, use cases trong sản phẩm, prompt engineering basics.",
    meta: [{ label: "Thời gian", value: "28/03 • 14:00-17:00" }, { label: "Diễn giả", value: "Dr. Quang - AI Team" }, { label: "Slots", value: "20/30" }],
    tags: ["AI", "ML", "Beginner"]
  },
  "ws-leadership": { title: "Leadership Workshop", emoji: "👔", type: "event",
    description: "Workshop phát triển kỹ năng lãnh đạo dành cho Team Leads và Managers.",
    meta: [{ label: "Thời gian", value: "02/04 • 09:00-12:00" }, { label: "Diễn giả", value: "External Coach" }, { label: "Đối tượng", value: "TL & Managers" }]
  },
  "ws-react": { title: "React Advanced Patterns", emoji: "⚛️", type: "event",
    description: "Compound Components, Render Props, Custom Hooks, Performance optimization.",
    meta: [{ label: "Ngày diễn ra", value: "14/03/2026" }, { label: "Diễn giả", value: "Phạm Hoàng - FE Lead" }, { label: "Tham dự", value: "32 người" }, { label: "Tài liệu", value: "Slide + Video", highlight: true }]
  },
  "ws-security": { title: "Bảo mật ứng dụng web", emoji: "🔐", type: "event",
    description: "OWASP Top 10, SQL Injection, XSS prevention, và security headers.",
    meta: [{ label: "Ngày diễn ra", value: "07/03/2026" }, { label: "Diễn giả", value: "Security Team" }, { label: "Tham dự", value: "28 người" }, { label: "Tài liệu", value: "Slide + Video" }]
  },
  "ws-agile": { title: "Agile & Scrum Master", emoji: "🏃", type: "event",
    description: "Agile methodology, Scrum framework, Sprint planning, Retrospective techniques.",
    meta: [{ label: "Ngày diễn ra", value: "28/02/2026" }, { label: "Diễn giả", value: "Agile Coach" }, { label: "Tham dự", value: "25 người" }]
  },

  // ── ANNOUNCE ──
  "an-holiday": { title: "Lịch nghỉ lễ 30/4 - 1/5", emoji: "🎌", type: "announcement",
    category: "Chính sách & Quy định", badge: "Quan trọng", publishedAt: "01/04/2026", publishedBy: "Ban Giám đốc",
    attachment: "Lịch nghỉ lễ 2026 chính thức.pdf",
    description: "Toàn bộ nhân viên nghỉ từ 29/04 đến 03/05/2026 (5 ngày). Làm bù: Thứ 7 ngày 26/04.",
    meta: [{ label: "Nghỉ từ", value: "29/04/2026" }, { label: "Đi làm lại", value: "04/05/2026" }, { label: "Làm bù", value: "26/04 (Thứ 7)" }, { label: "Ban hành", value: "Ban Giám đốc" }],
    checklist: [
      { label: "Hoàn thành công việc trước 28/04", done: false },
      { label: "Bàn giao task cho team", done: false },
      { label: "Set auto-reply email", done: false },
      { label: "Cập nhật status Slack", done: false },
    ]
  },
  "an-policy": { title: "Chính sách hybrid work mới", emoji: "📜", type: "policy",
    category: "Chính sách & Quy định", badge: "Quan trọng", publishedAt: "28/03/2026", publishedBy: "CEO",
    attachment: "Quy định Hybrid Work 2026.pdf",
    description: "Từ 01/04: Tối thiểu 3 ngày/tuần tại VP (T2, T3, T5). WFH tối đa 2 ngày (T4, T6).",
    meta: [{ label: "Hiệu lực", value: "01/04/2026" }, { label: "Áp dụng", value: "Toàn công ty" }, { label: "Phê duyệt", value: "CEO" }]
  },
  "an-q2plan": { title: "Kế hoạch kinh doanh Q2/2026", emoji: "📋", type: "announcement",
    category: "Kinh doanh & Chiến lược", badge: "Thông báo", publishedAt: "18/03/2026", publishedBy: "Ban Giám đốc",
    attachment: "Tài liệu chi tiết.pdf",
    description: "Mục tiêu Q2: Doanh thu 15 tỷ (+20% QoQ), ra mắt Mobile App, mở rộng thị trường SEA.",
    meta: [{ label: "Mục tiêu DT", value: "15 tỷ" }, { label: "Tăng trưởng", value: "+20% QoQ" }, { label: "Key initiative", value: "Mobile App + SEA" }]
  },
  "an-award": { title: "Kết quả bình chọn nhân viên Q1", emoji: "🏆", type: "announcement",
    category: "Nhân sự & Tuyển dụng", badge: "Thông báo", publishedAt: "17/03/2026", publishedBy: "HR",
    description: "Kết quả bình chọn nhân viên xuất sắc Q1/2026 đã có. Lễ trao giải: 20/03/2026.",
    meta: [{ label: "Cá nhân", value: "Nguyễn Minh Anh" }, { label: "Team", value: "Platform Engineering" }, { label: "Lễ trao giải", value: "20/03/2026" }]
  },
  "an-move": { title: "Thông báo di chuyển văn phòng", emoji: "🏢", type: "announcement",
    category: "Chính sách & Quy định", badge: "Quan trọng", publishedAt: "15/03/2026", publishedBy: "Admin",
    attachment: "Sơ đồ văn phòng mới.pdf",
    description: "VP mới tại tầng 10-12, toà nhà Landmark. Di chuyển vào cuối tuần 29-30/03.",
    meta: [{ label: "VP mới", value: "Landmark T10-12" }, { label: "Ngày chuyển", value: "29-30/03" }, { label: "Đi làm VP mới", value: "31/03/2026" }]
  },
  "an-salary": { title: "Điều chỉnh lương & phúc lợi 2026", emoji: "💼", type: "announcement",
    category: "Nhân sự & Tuyển dụng", badge: "Quan trọng", publishedAt: "12/03/2026", publishedBy: "HR",
    attachment: "Bảng lương & phúc lợi 2026.pdf",
    description: "Tăng lương trung bình 12%, bổ sung gói bảo hiểm sức khoẻ premium và allowance WFH.",
    meta: [{ label: "Tăng lương TB", value: "12%" }, { label: "Bảo hiểm mới", value: "Premium Health" }, { label: "WFH allowance", value: "500k/tháng" }]
  },
  "an-event": { title: "Annual Summit 2026", emoji: "🎪", type: "event",
    category: "Sự kiện & Hoạt động", badge: "Thông báo", publishedAt: "10/03/2026", publishedBy: "Admin",
    description: "Sự kiện thường niên công ty: keynote, product demo, awards, networking và party.",
    meta: [{ label: "Ngày", value: "15/05/2026" }, { label: "Địa điểm", value: "GEM Center" }, { label: "Quy mô", value: "200+ người" }]
  },
  "an-cat-policy": { title: "Chính sách & Quy định", emoji: "📜", type: "policy",
    category: "Chính sách & Quy định", badge: "Thông tin", publishedAt: "—", publishedBy: "—",
    description: "Tổng hợp 8 chính sách và quy định mới nhất của công ty.", meta: [{ label: "Số chính sách", value: "8" }]
  },
  "an-cat-event": { title: "Sự kiện & Hoạt động", emoji: "🎉", type: "event",
    category: "Sự kiện & Hoạt động", badge: "Thông tin", publishedAt: "—", publishedBy: "—",
    description: "Tổng hợp 12 sự kiện và hoạt động sắp tới.", meta: [{ label: "Sự kiện", value: "12" }]
  },
  "an-cat-hr": { title: "Nhân sự & Tuyển dụng", emoji: "👥", type: "announcement",
    category: "Nhân sự & Tuyển dụng", badge: "Thông tin", publishedAt: "—", publishedBy: "—",
    description: "Thông báo nhân sự, tuyển dụng, onboarding.", meta: [{ label: "Thông báo", value: "6" }]
  },
  "an-cat-biz": { title: "Kinh doanh & Chiến lược", emoji: "📈", type: "announcement",
    category: "Kinh doanh & Chiến lược", badge: "Thông tin", publishedAt: "—", publishedBy: "—",
    description: "Tin tức kinh doanh và chiến lược công ty.", meta: [{ label: "Tin tức", value: "4" }]
  },

  // ── TECH ──
  "te-rsc": { title: "React Server Components deep dive", emoji: "⚛️", type: "article",
    description: "Phân tích chuyên sâu RSC trong Next.js 15: kiến trúc, streaming SSR, partial hydration, so sánh hiệu năng CSR.",
    meta: [{ label: "Tác giả", value: "Phạm Hoàng" }, { label: "Ngày đăng", value: "16/03/2026" }, { label: "Lượt đọc", value: "156" }, { label: "Thời gian đọc", value: "12 phút" }],
    tags: ["React", "RSC", "Next.js", "Performance"]
  },
  "te-rust": { title: "Tại sao nên học Rust?", emoji: "🦀", type: "article",
    description: "6 tháng học Rust cho system tools. So sánh Go/C++, memory safety, zero-cost abstractions.",
    meta: [{ label: "Tác giả", value: "Trần Đức" }, { label: "Ngày đăng", value: "14/03/2026" }, { label: "Lượt đọc", value: "132" }],
    tags: ["Rust", "System Programming"]
  },
  "te-ai-tools": { title: "AI Tools cho developer 2026", emoji: "🤖", type: "article",
    description: "Tổng hợp AI tools hữu ích nhất cho developer: Copilot, Cursor, v0, Claude, Gemini. Review chi tiết từng tool.",
    meta: [{ label: "Tác giả", value: "Nguyễn Quang" }, { label: "Ngày đăng", value: "12/03/2026" }, { label: "Lượt đọc", value: "189" }],
    tags: ["AI", "Developer Tools", "Productivity"]
  },
  "te-frontend": { title: "Frontend & UI/UX", emoji: "🎨", type: "discussion",
    description: "Thảo luận về React, Vue, CSS, Design Systems, Accessibility, Performance.",
    meta: [{ label: "Bài viết", value: "15" }, { label: "Thành viên", value: "18" }]
  },
  "te-backend": { title: "Backend & API", emoji: "⚙️", type: "discussion",
    description: "Node.js, Go, Python, GraphQL, REST, gRPC, Microservices.",
    meta: [{ label: "Bài viết", value: "12" }, { label: "Thành viên", value: "14" }]
  },
  "te-devops": { title: "DevOps & Cloud", emoji: "☁️", type: "discussion",
    description: "Docker, K8s, CI/CD, AWS, GCP, Terraform, Monitoring.",
    meta: [{ label: "Bài viết", value: "9" }, { label: "Thành viên", value: "10" }]
  },
  "te-mobile": { title: "Mobile Development", emoji: "📱", type: "discussion",
    description: "React Native, Flutter, Swift, Kotlin, Mobile UX.",
    meta: [{ label: "Bài viết", value: "7" }, { label: "Thành viên", value: "8" }]
  },
  "te-data": { title: "Data & AI/ML", emoji: "🧠", type: "discussion",
    description: "Data Engineering, Machine Learning, LLMs, Analytics.",
    meta: [{ label: "Bài viết", value: "11" }, { label: "Thành viên", value: "9" }]
  },
  "te-security": { title: "Security", emoji: "🔒", type: "discussion",
    description: "AppSec, Pentesting, OWASP, Zero Trust, Compliance.",
    meta: [{ label: "Bài viết", value: "5" }, { label: "Thành viên", value: "7" }]
  },
  "te-stack": { title: "Tech Stack công ty", emoji: "🏗️", type: "policy",
    description: "Frontend: React + TypeScript + Tailwind. Backend: Node.js + Go. DB: PostgreSQL + Redis. Cloud: AWS.",
    meta: [{ label: "Frontend", value: "React + TS + Tailwind" }, { label: "Backend", value: "Node.js + Go" }, { label: "Database", value: "PostgreSQL + Redis" }, { label: "Cloud", value: "AWS" }]
  },
  "te-wiki": { title: "Developer Wiki", emoji: "📚", type: "article",
    description: "Tài liệu kỹ thuật nội bộ: Architecture decisions, API docs, Setup guides, Troubleshooting.",
    meta: [{ label: "Tài liệu", value: "45 trang" }, { label: "Cập nhật", value: "17/03/2026" }]
  },
  "te-coding": { title: "Coding Standards", emoji: "📏", type: "policy",
    description: "Quy tắc code: ESLint config, PR review checklist, Git conventions, Testing requirements.",
    meta: [{ label: "Phiên bản", value: "v2.1" }, { label: "Cập nhật", value: "01/03/2026" }],
    checklist: [
      { label: "ESLint + Prettier configured", done: true },
      { label: "TypeScript strict mode", done: true },
      { label: "Min 80% test coverage", done: false },
      { label: "PR review by 2 reviewers", done: true },
      { label: "Conventional commits", done: true },
    ]
  },

  // ── HR ──
  "hr-fe": { title: "Senior Frontend Developer", emoji: "👨‍💻", type: "job",
    description: "Tuyển Senior FE Dev cho team Platform. 4+ năm React/TypeScript, design systems, performance.",
    meta: [{ label: "Team", value: "Platform" }, { label: "Level", value: "Senior (P4-P5)" }, { label: "Lương", value: "35-50 triệu" }, { label: "CV", value: "5 CV", highlight: true }],
    jobRequirements: [
      "4+ năm kinh nghiệm React/TypeScript",
      "Hiểu biết sâu về Design Systems",
      "Performance optimization expertise",
      "Kinh nghiệm Next.js là lợi thế",
      "Testing: Jest, Cypress, Playwright",
      "Kỹ năng giao tiếp tốt, teamwork",
    ],
    tags: ["Frontend", "React", "TypeScript", "Senior"]
  },
  "hr-pm": { title: "Product Manager", emoji: "📊", type: "job",
    description: "Tuyển PM quản lý product roadmap, user research, và cross-functional collaboration.",
    meta: [{ label: "Team", value: "Product" }, { label: "Level", value: "Mid-Senior" }, { label: "Lương", value: "30-45 triệu" }, { label: "CV", value: "8 CV", highlight: true }],
    jobRequirements: [
      "3+ năm kinh nghiệm PM",
      "User research & data-driven decisions",
      "Roadmap planning & prioritization",
      "Agile/Scrum methodology",
      "Kỹ năng Figma cơ bản",
    ]
  },
  "hr-design": { title: "UI/UX Designer", emoji: "🎨", type: "job",
    description: "Tuyển Designer cho team Design System và product features.",
    meta: [{ label: "Team", value: "Design" }, { label: "Level", value: "Mid" }, { label: "Lương", value: "25-35 triệu" }, { label: "CV", value: "3 CV" }],
    jobRequirements: [
      "2+ năm UI/UX Design",
      "Proficient Figma, prototyping",
      "Design Systems experience",
      "User testing & research",
    ]
  },
  "hr-data": { title: "Data Engineer", emoji: "🔬", type: "job",
    description: "Tuyển Data Engineer xây dựng data pipeline và analytics infrastructure.",
    meta: [{ label: "Team", value: "Data" }, { label: "Level", value: "Mid-Senior" }, { label: "Lương", value: "30-45 triệu" }, { label: "CV", value: "2 CV" }],
    jobRequirements: [
      "3+ năm Data Engineering",
      "Python, SQL, Spark/Flink",
      "AWS/GCP data services",
      "ETL/ELT pipeline design",
    ]
  },
  "hr-new1": { title: "Phạm Quốc Bảo - Backend Dev", emoji: "👋", type: "announcement",
    description: "Chào mừng Quốc Bảo gia nhập team Backend! Background: 3 năm Node.js, từ Shopee.",
    meta: [{ label: "Vị trí", value: "Backend Developer" }, { label: "Team", value: "Core API" }, { label: "Bắt đầu", value: "17/03/2026" }, { label: "Buddy", value: "Trần Đức" }]
  },
  "hr-new2": { title: "Lê Thị Hồng Nhung - QA", emoji: "👋", type: "announcement",
    description: "Chào mừng Hồng Nhung gia nhập team QA! Background: 2 năm automation testing, từ FPT.",
    meta: [{ label: "Vị trí", value: "QA Engineer" }, { label: "Team", value: "Quality" }, { label: "Bắt đầu", value: "17/03/2026" }, { label: "Buddy", value: "Lê Thị Mai" }]
  },
  "hr-handbook": { title: "Sổ tay nhân viên 2026", emoji: "📖", type: "policy",
    description: "Cập nhật: chính sách nghỉ phép, đánh giá năng lực, phúc lợi bổ sung, hybrid work.",
    meta: [{ label: "Phiên bản", value: "v3.0" }, { label: "Cập nhật", value: "01/01/2026" }, { label: "Số trang", value: "68 trang" }]
  },
  "hr-benefit": { title: "Phúc lợi & Đãi ngộ", emoji: "🎁", type: "policy",
    description: "Bảo hiểm sức khoẻ premium, 15 ngày phép/năm, budget đào tạo 15tr, gym membership, lunch allowance.",
    meta: [{ label: "Ngày phép", value: "15 ngày/năm" }, { label: "Bảo hiểm", value: "Premium Health" }, { label: "Đào tạo", value: "15 triệu/năm" }, { label: "Gym", value: "Miễn phí" }]
  },
  "hr-eval": { title: "Quy trình đánh giá năng lực", emoji: "📋", type: "policy",
    description: "Đánh giá 360 độ mỗi 6 tháng. OKRs + competency matrix + peer review.",
    meta: [{ label: "Tần suất", value: "6 tháng/lần" }, { label: "Phương pháp", value: "360 + OKRs" }, { label: "Review tiếp", value: "06/2026" }]
  },
  "hr-career": { title: "Lộ trình thăng tiến", emoji: "🪜", type: "policy",
    description: "IC track: P1→P6, Manager track: M3→M6. Promotion cycle: 2 lần/năm.",
    meta: [{ label: "IC track", value: "P1 → P6" }, { label: "Manager", value: "M3 → M6" }, { label: "Cycle", value: "2 lần/năm" }]
  },

  // ── RANDOM ──
  "ra-cafe": { title: "Quán cafe gần công ty", emoji: "☕", type: "discussion",
    description: "Thread tổng hợp quán cafe ngon gần VP. 12 quán được recommend.",
    meta: [{ label: "Bình luận", value: "18" }, { label: "Người tạo", value: "Lê Minh" }, { label: "Cập nhật", value: "Hôm nay" }]
  },
  "ra-lunch": { title: "Trưa nay ăn gì?", emoji: "🍜", type: "discussion",
    description: "Thread hàng ngày - chia sẻ quán ăn trưa ngon và rủ nhau đi ăn.",
    meta: [{ label: "Hôm nay", value: "12 bình luận" }, { label: "Top pick", value: "Bún bò Huế cô Ba" }]
  },
  "ra-game": { title: "Giải game công ty mùa 3", emoji: "🎮", type: "discussion",
    description: "Giải Valorant nội bộ mùa 3. 4 team đang thi đấu. Chung kết: 25/03.",
    meta: [{ label: "Game", value: "Valorant" }, { label: "Số đội", value: "4" }, { label: "Chung kết", value: "25/03" }]
  },
  "ra-poll1": { title: "Team building đi đâu?", emoji: "🗳️", type: "discussion",
    description: "Bình chọn địa điểm team building Q2.",
    meta: [{ label: "Tổng phiếu", value: "38/50" }, { label: "Hạn chót", value: "20/03/2026" }, { label: "Dẫn đầu", value: "Đà Lạt" }],
    pollOptions: [
      { label: "🏔️ Đà Lạt", votes: 17, percent: 45 },
      { label: "🏖️ Phú Quốc", votes: 11, percent: 30 },
      { label: "🌊 Nha Trang", votes: 6, percent: 15 },
      { label: "🌉 Đà Nẵng", votes: 4, percent: 10 },
    ]
  },
  "ra-poll2": { title: "Màu áo đồng phục mới", emoji: "👕", type: "discussion",
    description: "Bình chọn màu áo đồng phục mới cho công ty.",
    meta: [{ label: "Tổng phiếu", value: "42/50" }, { label: "Hạn chót", value: "22/03/2026" }],
    pollOptions: [
      { label: "🔵 Navy Blue", votes: 18, percent: 43 },
      { label: "⚫ Black", votes: 12, percent: 29 },
      { label: "🟢 Forest Green", votes: 8, percent: 19 },
      { label: "⚪ White", votes: 4, percent: 9 },
    ]
  },
  "ra-poll3": { title: "Nhà hàng Year-end party", emoji: "🍽️", type: "discussion",
    description: "Đã chọn: Nhà hàng Riverside (65% phiếu bầu).",
    meta: [{ label: "Kết quả", value: "Nhà hàng Riverside" }, { label: "Tỷ lệ", value: "65% phiếu" }, { label: "Trạng thái", value: "Đã đóng" }]
  },
  "ra-meme": { title: "Meme của ngày", emoji: "😂", type: "discussion",
    description: "Chia sẻ meme IT, office life, và developer humor hàng ngày.", meta: [{ label: "Hôm nay", value: "5 meme" }]
  },
  "ra-pet": { title: "Khoe thú cưng", emoji: "🐾", type: "discussion",
    description: "Chia sẻ ảnh thú cưng của bạn! Chó, mèo, hamster...", meta: [{ label: "Ảnh", value: "8 ảnh mới" }]
  },
  "ra-travel": { title: "Ảnh du lịch", emoji: "📸", type: "discussion",
    description: "Chia sẻ ảnh du lịch đẹp và tips du lịch.", meta: [{ label: "Ảnh", value: "14 ảnh mới" }]
  },
  "ra-recipe": { title: "Công thức nấu ăn", emoji: "👨‍🍳", type: "discussion",
    description: "Chia sẻ công thức nấu ăn ngon và healthy.", meta: [{ label: "Công thức", value: "6 mới" }]
  },

  // ── HEALTH ──
  "he-run": { title: "Giải chạy bộ nội bộ", emoji: "🏃", type: "activity",
    description: "VWork Run 2026 lần thứ 5. Cự ly 3km/5km/10km. Đăng ký miễn phí, có áo race kit và medal.",
    meta: [{ label: "Ngày chạy", value: "12/04 • 6:00" }, { label: "Địa điểm", value: "CV Thống Nhất" }, { label: "Đã ĐK", value: "28/50", highlight: true }, { label: "Cự ly", value: "3/5/10km" }],
    participants: [
      { initials: "MA", name: "Minh Anh - 10km", color: "#0891b2" },
      { initials: "TH", name: "Văn Hùng - 5km", color: "#7c3aed" },
      { initials: "PH", name: "Hoàng - 10km", color: "#059669" },
      { initials: "LM", name: "Thị Mai - 3km", color: "#db2777" },
      { initials: "ND", name: "Đức Anh - 5km", color: "#ea580c" },
    ],
    tags: ["Chạy bộ", "Thể thao", "Team"]
  },
  "he-yoga": { title: "Lớp Yoga buổi sáng", emoji: "🧘", type: "activity",
    description: "Yoga mỗi sáng T3, T5 lúc 7:00-7:45 tại phòng gym tầng 2. Miễn phí cho nhân viên.",
    meta: [{ label: "Lịch", value: "T3, T5 • 7:00" }, { label: "Địa điểm", value: "Gym tầng 2" }, { label: "Giáo viên", value: "Cô Hương" }]
  },
  "he-swim": { title: "Đăng ký hồ bơi Q2", emoji: "🏊", type: "activity",
    description: "Đăng ký sử dụng hồ bơi tại CLB Lan Anh cho Q2/2026. Phí: công ty hỗ trợ 50%.",
    meta: [{ label: "CLB", value: "Lan Anh" }, { label: "Hỗ trợ", value: "50% chi phí" }, { label: "Hạn ĐK", value: "25/03/2026" }]
  },
  "he-football": { title: "CLB Bóng đá", emoji: "⚽", type: "activity",
    description: "Tập T3, T5 tại sân Thành Đô 18:00-19:30. Chuẩn bị giải bóng đá doanh nghiệp Q2.",
    meta: [{ label: "Thành viên", value: "22 người" }, { label: "Lịch tập", value: "T3, T5 • 18:00" }, { label: "Sân", value: "Thành Đô" }, { label: "Đội trưởng", value: "Nguyễn Hùng" }],
    participants: [
      { initials: "NH", name: "Nguyễn Hùng (C)", color: "#dc2626" },
      { initials: "TM", name: "Trần Minh", color: "#2563eb" },
      { initials: "QB", name: "Quốc Bảo", color: "#16a34a" },
    ]
  },
  "he-badminton": { title: "CLB Cầu lông", emoji: "🏸", type: "activity",
    description: "Chơi cầu lông T2, T4 tại TDTT Phú Nhuận lúc 17:30.", meta: [{ label: "Thành viên", value: "18 người" }, { label: "Lịch", value: "T2, T4 • 17:30" }]
  },
  "he-cycling": { title: "CLB Đạp xe", emoji: "🚴", type: "activity",
    description: "Đạp xe mỗi sáng Chủ nhật. Tuyến: Thủ Thiêm - Cần Giờ.", meta: [{ label: "Thành viên", value: "12 người" }, { label: "Lịch", value: "CN • 5:30" }]
  },
  "he-chess": { title: "CLB Cờ vua", emoji: "♟️", type: "activity",
    description: "Chơi cờ buổi trưa tại pantry. Giải cờ nội bộ hàng quý.", meta: [{ label: "Thành viên", value: "9 người" }, { label: "Lịch", value: "Buổi trưa" }]
  },
  "he-checkup": { title: "Lịch khám sức khoẻ định kỳ", emoji: "🩺", type: "activity",
    description: "Khám sức khoẻ định kỳ 6 tháng/lần tại Bệnh viện Đại học Y. Đợt tiếp theo: 15/04/2026.",
    meta: [{ label: "Đợt tiếp theo", value: "15/04/2026" }, { label: "Bệnh viện", value: "ĐH Y Dược" }, { label: "Chi phí", value: "Công ty 100%" }]
  },
  "he-mental": { title: "Tư vấn sức khoẻ tinh thần", emoji: "🧠", type: "activity",
    description: "Dịch vụ tư vấn tâm lý miễn phí. Đặt lịch qua HR, bảo mật tuyệt đối.",
    meta: [{ label: "Dịch vụ", value: "Tư vấn 1-1" }, { label: "Chi phí", value: "Miễn phí" }, { label: "Bảo mật", value: "Tuyệt đối" }]
  },
  "he-nutrition": { title: "Thực đơn healthy tuần này", emoji: "🥗", type: "article",
    description: "Gợi ý thực đơn healthy cho bữa trưa: Salad gà nướng, Poke bowl, Soup rau củ, Sandwich nguyên cám.",
    meta: [{ label: "Tuần", value: "18-22/03" }, { label: "Calories", value: "500-600 kcal" }]
  },

  // ── PRODUCT ──
  "pd-auth": { title: "SSO & OAuth 2.0", emoji: "🔑", type: "feature",
    description: "Tích hợp SSO/OAuth 2.0. Hỗ trợ Google, Microsoft, SAML 2.0 enterprise. Sprint: Google OAuth flow.",
    meta: [{ label: "Trạng thái", value: "🔵 In Dev", highlight: true }, { label: "Sprint", value: "Sprint 14" }, { label: "Team", value: "Platform" }, { label: "Deadline", value: "15/04/2026" }],
    progressPercent: 40,
    checklist: [
      { label: "Google OAuth flow", done: true },
      { label: "Microsoft OAuth flow", done: false },
      { label: "SAML 2.0 integration", done: false },
      { label: "Session management", done: true },
      { label: "Token refresh logic", done: true },
      { label: "UI login page", done: false },
      { label: "Testing & QA", done: false },
    ],
    tags: ["Auth", "SSO", "OAuth", "Security"]
  },
  "pd-dashboard": { title: "Dashboard v3.0", emoji: "📊", type: "feature",
    description: "Redesign Dashboard: real-time widgets, customizable layouts, AI insights.",
    meta: [{ label: "Trạng thái", value: "🔵 In Dev" }, { label: "Progress", value: "65%", highlight: true }, { label: "Team", value: "FE + Design" }, { label: "Target", value: "Q2/2026" }],
    progressPercent: 65,
    tags: ["Dashboard", "Redesign", "Widgets"]
  },
  "pd-mobile": { title: "Mobile App iOS/Android", emoji: "📱", type: "feature",
    description: "Native mobile app using React Native. Core features: Chat, Tasks, Notifications.",
    meta: [{ label: "Trạng thái", value: "🟣 Design" }, { label: "Platform", value: "iOS + Android" }, { label: "Framework", value: "React Native" }, { label: "Target", value: "Q3/2026" }],
    progressPercent: 20
  },
  "pd-ai": { title: "AI Copilot Integration", emoji: "🤖", type: "feature",
    description: "AI assistant trong app: smart search, auto-complete tasks, meeting summary, content generation.",
    meta: [{ label: "Trạng thái", value: "🟡 Planning" }, { label: "Model", value: "GPT-4 + Claude" }, { label: "Target", value: "Q3/2026" }],
    progressPercent: 5
  },
  "pd-api": { title: "Public API v2", emoji: "🔌", type: "feature",
    description: "Public REST API v2 với rate limiting, webhooks, và comprehensive documentation.",
    meta: [{ label: "Trạng thái", value: "🟡 Planning" }, { label: "Endpoints", value: "~50" }, { label: "Target", value: "Q2/2026" }],
    progressPercent: 10
  },
  "pd-fb1": { title: "Cải thiện tốc độ tải trang", emoji: "⚡", type: "feature",
    description: "Mục tiêu: LCP < 1.5s. Biện pháp: code splitting, lazy loading, edge caching, DB optimization.",
    meta: [{ label: "Upvotes", value: "42 phiếu" }, { label: "LCP hiện tại", value: "3.2s" }, { label: "Mục tiêu", value: "<1.5s" }],
    progressPercent: 30
  },
  "pd-fb2": { title: "Dark mode", emoji: "🌙", type: "feature",
    description: "Hỗ trợ dark mode cho toàn bộ app. System preference detection + manual toggle.",
    meta: [{ label: "Upvotes", value: "38 phiếu" }, { label: "Trạng thái", value: "Backlog" }]
  },
  "pd-fb3": { title: "Export báo cáo PDF", emoji: "📄", type: "feature",
    description: "Export dashboard và reports sang PDF với formatting đẹp.",
    meta: [{ label: "Upvotes", value: "25 phiếu" }, { label: "Trạng thái", value: "Backlog" }]
  },
  "pd-fb4": { title: "Tích hợp Slack/Teams", emoji: "🔗", type: "feature",
    description: "2-way sync notifications giữa VWork Pro và Slack/Microsoft Teams.",
    meta: [{ label: "Upvotes", value: "21 phiếu" }, { label: "Trạng thái", value: "Backlog" }]
  },
  "pd-dau": { title: "DAU / MAU Report", emoji: "📈", type: "article",
    description: "DAU: 2,450 (+8% MoM). MAU: 4,800. DAU/MAU ratio: 51%.",
    meta: [{ label: "DAU", value: "2,450" }, { label: "MAU", value: "4,800" }, { label: "Ratio", value: "51%" }],
    stats: [{ label: "DAU", value: "2,450", trend: "up" }, { label: "MAU", value: "4,800", trend: "up" }, { label: "Ratio", value: "51%" }, { label: "Retention D7", value: "68%", trend: "up" }]
  },
  "pd-nps": { title: "NPS Score Q1", emoji: "📊", type: "article",
    description: "NPS Q1/2026: 72 (target >70). Promoters: 58%, Passives: 28%, Detractors: 14%.",
    meta: [{ label: "NPS Score", value: "72" }, { label: "Promoters", value: "58%" }, { label: "Passives", value: "28%" }, { label: "Detractors", value: "14%" }]
  },
  "pd-churn": { title: "Churn Analysis", emoji: "📉", type: "article",
    description: "Monthly churn rate: 2.1% (-0.3% vs Q4). Top churn reason: pricing (35%), features (28%).",
    meta: [{ label: "Churn rate", value: "2.1%" }, { label: "Trend", value: "-0.3% vs Q4" }, { label: "Top reason", value: "Pricing (35%)" }],
    stats: [{ label: "Churn", value: "2.1%", trend: "down" }, { label: "vs Q4", value: "-0.3%" }, { label: "Pricing", value: "35%" }, { label: "Features", value: "28%" }]
  },

  // ── SECURITY ──
  "se-mfa": { title: "MFA bắt buộc từ 01/04", emoji: "🔐", type: "policy",
    description: "PHẢI bật MFA cho tài khoản công ty. Hỗ trợ: Google/Microsoft Authenticator, YubiKey.",
    meta: [{ label: "Hiệu lực", value: "01/04/2026" }, { label: "Áp dụng", value: "Toàn bộ NV" }, { label: "Setup support", value: "25-31/03" }, { label: "Liên hệ", value: "IT Helpdesk" }],
    checklist: [
      { label: "Download app Authenticator", done: false },
      { label: "Quét QR code setup MFA", done: false },
      { label: "Lưu recovery codes", done: false },
      { label: "Test đăng nhập với MFA", done: false },
    ]
  },
  "se-phishing": { title: "Cảnh báo phishing email mới", emoji: "⚠️", type: "announcement",
    description: "Phát hiện chiến dịch phishing giả mạo email từ HR về \"Cập nhật thông tin lương\". KHÔNG click link trong email đáng ngờ.",
    meta: [{ label: "Loại", value: "Email phishing" }, { label: "Giả mạo", value: "HR Department" }, { label: "Phát hiện", value: "17/03/2026" }]
  },
  "se-password": { title: "Quy tắc mật khẩu mạnh", emoji: "🔑", type: "policy",
    description: "Tối thiểu 12 ký tự, bao gồm chữ hoa, chữ thường, số, ký tự đặc biệt. Đổi mỗi 90 ngày.",
    meta: [{ label: "Độ dài tối thiểu", value: "12 ký tự" }, { label: "Đổi mỗi", value: "90 ngày" }],
    checklist: [
      { label: "Tối thiểu 12 ký tự", done: true },
      { label: "Chứa chữ hoa + thường", done: true },
      { label: "Chứa số", done: true },
      { label: "Chứa ký tự đặc biệt", done: true },
      { label: "Không trùng 5 mật khẩu gần nhất", done: true },
    ]
  },
  "se-data": { title: "Chính sách bảo vệ dữ liệu", emoji: "🛡️", type: "policy",
    description: "Quy định về phân loại, lưu trữ, truyền tải và xoá dữ liệu nhạy cảm.",
    meta: [{ label: "Phiên bản", value: "v2.0" }, { label: "Cập nhật", value: "01/02/2026" }]
  },
  "se-access": { title: "Quản lý quyền truy cập", emoji: "🚪", type: "policy",
    description: "Nguyên tắc Least Privilege. Review quyền truy cập mỗi quý. Revoke ngay khi nhân viên nghỉ.",
    meta: [{ label: "Nguyên tắc", value: "Least Privilege" }, { label: "Review", value: "Mỗi quý" }]
  },
  "se-incident": { title: "Quy trình xử lý sự cố", emoji: "🚨", type: "policy",
    description: "4 bước: Detect → Respond → Recover → Post-mortem. SLA response: Critical <15 phút.",
    meta: [{ label: "Bước", value: "4 bước" }, { label: "SLA Critical", value: "<15 phút" }]
  },
  "se-device": { title: "Bảo mật thiết bị cá nhân", emoji: "💻", type: "policy",
    description: "Mã hoá ổ đĩa, bật firewall, cập nhật OS, không cài phần mềm không rõ nguồn gốc.",
    meta: [{ label: "Mã hoá", value: "BitLocker/FileVault" }, { label: "Firewall", value: "Bắt buộc" }]
  },
  "se-iso": { title: "ISO 27001 Checklist", emoji: "✅", type: "policy",
    description: "Tiến độ 85% (102/120 controls). 12 controls cần hoàn thiện trước audit T5/2026.",
    meta: [{ label: "Tiến độ", value: "85%", highlight: true }, { label: "Audit", value: "15/05/2026" }, { label: "Đơn vị", value: "BSI Group" }],
    progressPercent: 85,
    checklist: [
      { label: "A.5 Information security policies", done: true },
      { label: "A.6 Organization of info security", done: true },
      { label: "A.7 Human resource security", done: true },
      { label: "A.8 Asset management", done: true },
      { label: "A.9 Access control", done: false },
      { label: "A.10 Cryptography", done: true },
      { label: "A.11 Physical security", done: false },
      { label: "A.12 Operations security", done: true },
    ]
  },
  "se-gdpr": { title: "GDPR Compliance", emoji: "🇪🇺", type: "policy",
    description: "Tuân thủ GDPR cho khách hàng EU. DPA signed, data processing agreements, right to erasure.",
    meta: [{ label: "Compliance", value: "92%" }, { label: "DPA", value: "Signed" }, { label: "DPO", value: "Legal Team" }],
    progressPercent: 92
  },
  "se-audit": { title: "Kết quả Audit Q1/2026", emoji: "📋", type: "article",
    description: "Audit nội bộ Q1: 3 findings (1 medium, 2 low). Tất cả đã có remediation plan.",
    meta: [{ label: "Findings", value: "3 (1M, 2L)" }, { label: "Remediation", value: "Đang thực hiện" }, { label: "Auditor", value: "Internal Audit" }]
  },
};

/* ═══════════ Helpers ═══════════ */
const defaultComments = [
  { author: "Nguyễn Minh Anh", initials: "MA", color: "#0891b2", text: "Đã review, LGTM! 👍", time: "10 phút trước" },
  { author: "Trần Văn Hùng", initials: "TH", color: "#7c3aed", text: "Cập nhật thêm phần timeline nhé.", time: "25 phút trước" },
  { author: "Lê Thị Mai", initials: "LM", color: "#db2777", text: "Tôi sẽ hỗ trợ phần này.", time: "1 giờ trước" },
];

const typeBadge: Record<string, { label: string; color: string; bg: string }> = {
  article: { label: "Bài viết", color: "text-blue-700", bg: "bg-blue-100" },
  event: { label: "Sự kiện", color: "text-purple-700", bg: "bg-purple-100" },
  ticket: { label: "Ticket", color: "text-red-700", bg: "bg-red-100" },
  announcement: { label: "Thông báo", color: "text-orange-700", bg: "bg-orange-100" },
  policy: { label: "Chính sách", color: "text-emerald-700", bg: "bg-emerald-100" },
  job: { label: "Tuyển dụng", color: "text-cyan-700", bg: "bg-cyan-100" },
  activity: { label: "Hoạt động", color: "text-green-700", bg: "bg-green-100" },
  feature: { label: "Feature", color: "text-indigo-700", bg: "bg-indigo-100" },
  discussion: { label: "Thảo luận", color: "text-amber-700", bg: "bg-amber-100" },
};

/* ═══════════ Sub-components for type-specific UI ═══════════ */

function TicketTimeline({ items }: { items: { time: string; action: string; user: string }[] }) {
  return (
    <div className="mb-5">
      <h3 className="text-[12px] text-gray-400 mb-3 uppercase tracking-wide" style={{ fontWeight: 600 }}>Timeline xử lý</h3>
      <div className="space-y-0 relative ml-2">
        <div className="absolute left-[5px] top-2 bottom-2 w-px bg-gray-200" />
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 pb-3 relative">
            <div className={`w-[11px] h-[11px] rounded-full border-2 shrink-0 mt-1 z-10 ${
              i === 0 ? "border-cyan-500 bg-cyan-50" : "border-gray-300 bg-white"
            }`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-cyan-600" style={{ fontWeight: 600 }}>{item.time}</span>
              </div>
              <p className="text-[12px] text-gray-700 mt-0.5">{item.action}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{item.user}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventSchedule({ items }: { items: { time: string; activity: string }[] }) {
  return (
    <div className="mb-5">
      <h3 className="text-[12px] text-gray-400 mb-3 uppercase tracking-wide" style={{ fontWeight: 600 }}>Lịch trình</h3>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
            <Clock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span className="text-[11px] text-purple-600 shrink-0" style={{ fontWeight: 600, minWidth: 120 }}>{item.time}</span>
            <span className="text-[12px] text-gray-700">{item.activity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PollResults({ options, votedOption, onChangeVote }: { options: { label: string; votes: number; percent: number }[]; votedOption?: string | null; onChangeVote?: (label: string) => void }) {
  const maxVotes = Math.max(...options.map(o => o.votes));
  return (
    <div>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const isMyVote = votedOption === opt.label;
          return (
            <button key={i} onClick={() => onChangeVote && !isMyVote && onChangeVote(opt.label)}
              disabled={!onChangeVote || isMyVote}
              className={`w-full text-left relative overflow-hidden rounded-lg border transition-all ${isMyVote ? "border-indigo-300 bg-indigo-50/40 cursor-default" : onChangeVote ? "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/20 cursor-pointer" : "border-gray-200 bg-white cursor-default"}`}>
              <div className={`absolute inset-0 bg-gradient-to-r to-transparent opacity-60 rounded-lg ${isMyVote ? "from-indigo-100" : "from-cyan-50"}`} style={{ width: `${opt.percent}%` }} />
              <div className="relative flex items-center gap-3 px-3 py-2.5">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isMyVote ? "border-indigo-500 bg-indigo-500" : "border-gray-300"}`}>
                  {isMyVote && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className={`text-[13px] flex-1 ${isMyVote ? "text-indigo-700 font-medium" : "text-gray-700"}`}>{opt.label}</span>
                <span className={`text-[12px] ${isMyVote ? "text-indigo-500" : "text-gray-500"}`} style={{ fontWeight: 600 }}>{opt.votes} phiếu</span>
                <span className={`text-[12px] px-2 py-0.5 rounded-md ${opt.votes === maxVotes ? "bg-cyan-100 text-cyan-700" : "bg-gray-100 text-gray-600"}`} style={{ fontWeight: 600 }}>{opt.percent}%</span>
              </div>
            </button>
          );
        })}
      </div>
      {votedOption && <p className="text-[10px] text-gray-400 mt-2 text-center">{options.reduce((s, o) => s + o.votes, 0)} phiếu · Bạn đã bình chọn</p>}
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  const color = percent >= 80 ? "bg-green-500" : percent >= 50 ? "bg-cyan-500" : percent >= 20 ? "bg-amber-500" : "bg-gray-400";
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-[12px] text-gray-400 uppercase tracking-wide" style={{ fontWeight: 600 }}>Tiến độ</h3>
        <span className="text-[13px] text-gray-700" style={{ fontWeight: 600 }}>{percent}%</span>
      </div>
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Checklist({ items }: { items: { label: string; done: boolean }[] }) {
  const doneCount = items.filter(i => i.done).length;
  return (
    <div className="mb-5">
      <h3 className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={{ fontWeight: 600 }}>
        Checklist ({doneCount}/{items.length})
      </h3>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all">
            <div className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center shrink-0 ${
              item.done ? "bg-green-500 border-green-500" : "border-gray-300"
            }`}>
              {item.done && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className={`text-[12px] ${item.done ? "text-gray-400 line-through" : "text-gray-700"}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsGrid({ stats }: { stats: { label: string; value: string; trend?: "up" | "down" }[] }) {
  return (
    <div className="mb-5">
      <h3 className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={{ fontWeight: 600 }}>Thống kê</h3>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s, i) => (
          <div key={i} className="bg-gradient-to-br from-gray-50 to-white rounded-xl px-3.5 py-3 border border-gray-100">
            <p className="text-[10px] text-gray-400 mb-1">{s.label}</p>
            <div className="flex items-center gap-1.5">
              <p className="text-[15px] text-gray-800" style={{ fontWeight: 700 }}>{s.value}</p>
              {s.trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
              {s.trend === "down" && <TrendingUp className="w-3.5 h-3.5 text-red-500 rotate-180" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function JobRequirements({ items }: { items: string[] }) {
  return (
    <div className="mb-5">
      <h3 className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={{ fontWeight: 600 }}>Yêu cầu</h3>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5 px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
            <span className="text-[12px] text-gray-700">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Participants({ people }: { people: { initials: string; name: string; color: string }[] }) {
  return (
    <div className="mb-5">
      <h3 className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={{ fontWeight: 600 }}>
        Người tham gia ({people.length}+)
      </h3>
      <div className="flex items-center gap-2 flex-wrap">
        {people.map((p, i) => (
          <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] text-white" style={{ background: p.color, fontWeight: 600 }}>
              {p.initials}
            </div>
            <span className="text-[11px] text-gray-600">{p.name}</span>
          </div>
        ))}
        <button className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200">
          <span className="text-[11px]">+</span>
        </button>
      </div>
    </div>
  );
}

/* ═══════════ FinancialOverviewView ═══════════ */
type RevenuePeriod = "day" | "month" | "quarter" | "year" | "project";

const revenueChartData: Record<RevenuePeriod, { label: string; actual: number; target: number; growth?: number }[]> = {
  day: [
    { label: "04/04", actual: 285000000, target: 300000000, growth: 12 },
    { label: "05/04", actual: 310000000, target: 300000000, growth: 18 },
    { label: "06/04", actual: 270000000, target: 300000000, growth: -5 },
    { label: "07/04", actual: 340000000, target: 300000000, growth: 22 },
    { label: "08/04", actual: 295000000, target: 300000000, growth: 8 },
    { label: "09/04", actual: 380000000, target: 300000000, growth: 35 },
    { label: "10/04", actual: 420000000, target: 300000000, growth: 42 },
  ],
  month: [
    { label: "T5/25", actual: 3200000000, target: 3500000000, growth: 8 },
    { label: "T6/25", actual: 3500000000, target: 3500000000, growth: 12 },
    { label: "T7/25", actual: 3100000000, target: 3600000000, growth: 5 },
    { label: "T8/25", actual: 3800000000, target: 3700000000, growth: 15 },
    { label: "T9/25", actual: 4100000000, target: 3800000000, growth: 18 },
    { label: "T10/25", actual: 4300000000, target: 4000000000, growth: 20 },
    { label: "T11/25", actual: 4500000000, target: 4200000000, growth: 22 },
    { label: "T12/25", actual: 5200000000, target: 4500000000, growth: 28 },
    { label: "T1/26", actual: 3800000000, target: 4000000000, growth: 12 },
    { label: "T2/26", actual: 4200000000, target: 4200000000, growth: 15 },
    { label: "T3/26", actual: 4500000000, target: 4400000000, growth: 18 },
    { label: "T4/26", actual: 1800000000, target: 4600000000, growth: 10 },
  ],
  quarter: [
    { label: "Q1/25", actual: 9800000000, target: 10000000000, growth: 10 },
    { label: "Q2/25", actual: 11200000000, target: 11000000000, growth: 14 },
    { label: "Q3/25", actual: 12100000000, target: 12000000000, growth: 16 },
    { label: "Q4/25", actual: 14500000000, target: 14000000000, growth: 22 },
    { label: "Q1/26", actual: 12500000000, target: 12600000000, growth: 18 },
  ],
  year: [
    { label: "2022", actual: 28000000000, target: 28000000000, growth: 15 },
    { label: "2023", actual: 35000000000, target: 33000000000, growth: 25 },
    { label: "2024", actual: 42000000000, target: 40000000000, growth: 20 },
    { label: "2025", actual: 47600000000, target: 47000000000, growth: 13 },
    { label: "2026*", actual: 12500000000, target: 50000000000, growth: 18 },
  ],
  project: [
    { label: "VWork Pro", actual: 5600000000, target: 6000000000, growth: 22 },
    { label: "Tư vấn CNTT", actual: 3200000000, target: 3000000000, growth: 15 },
    { label: "Đào tạo", actual: 1800000000, target: 2000000000, growth: 8 },
    { label: "Tích hợp API", actual: 1200000000, target: 1000000000, growth: 35 },
    { label: "Bảo trì HĐ", actual: 450000000, target: 500000000, growth: -5 },
    { label: "Khác", actual: 250000000, target: 300000000, growth: 2 },
  ],
};

interface ProjectInfo {
  id: string;
  name: string;
  color: string;
  total: number;
  target: number;
  growth: number;
  monthly: { label: string; actual: number; target: number; growth: number }[];
}

const projectList: ProjectInfo[] = [
  {
    id: "vwork", name: "VWork Pro", color: "#4f46e5", total: 5600000000, target: 6000000000, growth: 22,
    monthly: [
      { label: "T1/26", actual: 1600000000, target: 1800000000, growth: 15 },
      { label: "T2/26", actual: 1900000000, target: 1900000000, growth: 22 },
      { label: "T3/26", actual: 2100000000, target: 2000000000, growth: 28 },
      { label: "T4/26", actual: 850000000, target: 2000000000, growth: 18 },
    ],
  },
  {
    id: "consult", name: "Tư vấn CNTT", color: "#0891b2", total: 3200000000, target: 3000000000, growth: 15,
    monthly: [
      { label: "T1/26", actual: 820000000, target: 750000000, growth: 10 },
      { label: "T2/26", actual: 1050000000, target: 1000000000, growth: 18 },
      { label: "T3/26", actual: 1330000000, target: 1200000000, growth: 20 },
      { label: "T4/26", actual: 320000000, target: 1200000000, growth: 12 },
    ],
  },
  {
    id: "training", name: "Đào tạo", color: "#059669", total: 1800000000, target: 2000000000, growth: 8,
    monthly: [
      { label: "T1/26", actual: 420000000, target: 500000000, growth: 5 },
      { label: "T2/26", actual: 580000000, target: 600000000, growth: 10 },
      { label: "T3/26", actual: 800000000, target: 650000000, growth: 12 },
      { label: "T4/26", actual: 190000000, target: 650000000, growth: 6 },
    ],
  },
  {
    id: "api", name: "Tích hợp API", color: "#7c3aed", total: 1200000000, target: 1000000000, growth: 35,
    monthly: [
      { label: "T1/26", actual: 250000000, target: 240000000, growth: 28 },
      { label: "T2/26", actual: 380000000, target: 300000000, growth: 40 },
      { label: "T3/26", actual: 570000000, target: 380000000, growth: 42 },
      { label: "T4/26", actual: 180000000, target: 380000000, growth: 30 },
    ],
  },
  {
    id: "maintain", name: "Bảo trì HĐ", color: "#d97706", total: 450000000, target: 500000000, growth: -5,
    monthly: [
      { label: "T1/26", actual: 130000000, target: 125000000, growth: -2 },
      { label: "T2/26", actual: 110000000, target: 125000000, growth: -8 },
      { label: "T3/26", actual: 210000000, target: 125000000, growth: -3 },
      { label: "T4/26", actual: 80000000, target: 125000000, growth: -6 },
    ],
  },
  {
    id: "other", name: "Khác", color: "#6b7280", total: 250000000, target: 300000000, growth: 2,
    monthly: [
      { label: "T1/26", actual: 60000000, target: 75000000, growth: 0 },
      { label: "T2/26", actual: 80000000, target: 75000000, growth: 5 },
      { label: "T3/26", actual: 110000000, target: 75000000, growth: 3 },
      { label: "T4/26", actual: 42000000, target: 75000000, growth: 2 },
    ],
  },
];

type FinPeriod = "day" | "month" | "quarter" | "year" | "project";
const expenseChartData: Record<FinPeriod, { label: string; actual: number; budget: number }[]> = {
  day: [
    { label: "04/04", actual: 210000000, budget: 250000000 },
    { label: "05/04", actual: 275000000, budget: 250000000 },
    { label: "06/04", actual: 190000000, budget: 250000000 },
    { label: "07/04", actual: 310000000, budget: 250000000 },
    { label: "08/04", actual: 230000000, budget: 250000000 },
    { label: "09/04", actual: 280000000, budget: 250000000 },
    { label: "10/04", actual: 195000000, budget: 250000000 },
  ],
  month: [
    { label: "T7/25", actual: 2600000000, budget: 2800000000 },
    { label: "T8/25", actual: 2850000000, budget: 2900000000 },
    { label: "T9/25", actual: 3050000000, budget: 3000000000 },
    { label: "T10/25", actual: 3100000000, budget: 3200000000 },
    { label: "T11/25", actual: 3200000000, budget: 3300000000 },
    { label: "T12/25", actual: 3600000000, budget: 3500000000 },
    { label: "T1/26", actual: 2900000000, budget: 3000000000 },
    { label: "T2/26", actual: 3100000000, budget: 3200000000 },
    { label: "T3/26", actual: 3300000000, budget: 3800000000 },
  ],
  quarter: [
    { label: "Q1/25", actual: 7800000000, budget: 8000000000 },
    { label: "Q2/25", actual: 8200000000, budget: 8500000000 },
    { label: "Q3/25", actual: 8600000000, budget: 8800000000 },
    { label: "Q4/25", actual: 9800000000, budget: 10000000000 },
    { label: "Q1/26", actual: 9300000000, budget: 10000000000 },
  ],
  year: [
    { label: "2022", actual: 18000000000, budget: 19000000000 },
    { label: "2023", actual: 22000000000, budget: 23000000000 },
    { label: "2024", actual: 29000000000, budget: 30000000000 },
    { label: "2025", actual: 34400000000, budget: 35000000000 },
    { label: "2026*", actual: 9300000000, budget: 40000000000 },
  ],
  project: [
    { label: "Nhân sự", actual: 6045000000, budget: 6500000000 },
    { label: "Vận hành", actual: 1860000000, budget: 2000000000 },
    { label: "Marketing", actual: 930000000, budget: 1000000000 },
    { label: "R&D", actual: 280000000, budget: 350000000 },
    { label: "Khác", actual: 185000000, budget: 150000000 },
  ],
};
const profitChartData: Record<FinPeriod, { label: string; actual: number; target: number; margin: number }[]> = {
  day: [
    { label: "04/04", actual: 75000000, target: 60000000, margin: 26.3 },
    { label: "05/04", actual: 82000000, target: 60000000, margin: 26.5 },
    { label: "06/04", actual: 65000000, target: 60000000, margin: 24.1 },
    { label: "07/04", actual: 95000000, target: 60000000, margin: 27.9 },
    { label: "08/04", actual: 72000000, target: 60000000, margin: 24.4 },
    { label: "09/04", actual: 110000000, target: 60000000, margin: 28.9 },
    { label: "10/04", actual: 125000000, target: 60000000, margin: 29.8 },
  ],
  month: [
    { label: "T7/25", actual: 680000000, target: 600000000, margin: 26.2 },
    { label: "T8/25", actual: 720000000, target: 650000000, margin: 25.3 },
    { label: "T9/25", actual: 790000000, target: 700000000, margin: 25.9 },
    { label: "T10/25", actual: 850000000, target: 750000000, margin: 26.3 },
    { label: "T11/25", actual: 900000000, target: 800000000, margin: 26.1 },
    { label: "T12/25", actual: 1050000000, target: 950000000, margin: 25.6 },
    { label: "T1/26", actual: 900000000, target: 850000000, margin: 23.7 },
    { label: "T2/26", actual: 1100000000, target: 1000000000, margin: 26.2 },
    { label: "T3/26", actual: 1200000000, target: 1100000000, margin: 26.7 },
  ],
  quarter: [
    { label: "Q1/25", actual: 2000000000, target: 1800000000, margin: 20.4 },
    { label: "Q2/25", actual: 2300000000, target: 2200000000, margin: 20.5 },
    { label: "Q3/25", actual: 2800000000, target: 2600000000, margin: 23.1 },
    { label: "Q4/25", actual: 3600000000, target: 3400000000, margin: 24.8 },
    { label: "Q1/26", actual: 3200000000, target: 3000000000, margin: 25.6 },
  ],
  year: [
    { label: "2022", actual: 5500000000, target: 5000000000, margin: 19.6 },
    { label: "2023", actual: 7800000000, target: 7200000000, margin: 22.3 },
    { label: "2024", actual: 10500000000, target: 10000000000, margin: 25.0 },
    { label: "2025", actual: 10700000000, target: 10500000000, margin: 22.5 },
    { label: "2026*", actual: 3200000000, target: 15000000000, margin: 25.6 },
  ],
  project: [
    { label: "VWork Pro", actual: 2100000000, target: 1800000000, margin: 37.5 },
    { label: "Tư vấn", actual: 980000000, target: 900000000, margin: 30.6 },
    { label: "Đào tạo", actual: 520000000, target: 600000000, margin: 28.9 },
    { label: "API", actual: 480000000, target: 400000000, margin: 40.0 },
    { label: "Bảo trì", actual: 80000000, target: 120000000, margin: 17.8 },
    { label: "Khác", actual: 40000000, target: 80000000, margin: 16.0 },
  ],
};
const cashflowChartData: Record<FinPeriod, { label: string; inflow: number; outflow: number }[]> = {
  day: [
    { label: "04/04", inflow: 285000000, outflow: 210000000 },
    { label: "05/04", inflow: 310000000, outflow: 275000000 },
    { label: "06/04", inflow: 270000000, outflow: 190000000 },
    { label: "07/04", inflow: 340000000, outflow: 310000000 },
    { label: "08/04", inflow: 295000000, outflow: 230000000 },
    { label: "09/04", inflow: 380000000, outflow: 280000000 },
    { label: "10/04", inflow: 420000000, outflow: 195000000 },
  ],
  month: [
    { label: "T7/25", inflow: 3500000000, outflow: 2700000000 },
    { label: "T8/25", inflow: 3800000000, outflow: 2900000000 },
    { label: "T9/25", inflow: 4100000000, outflow: 3100000000 },
    { label: "T10/25", inflow: 4300000000, outflow: 3200000000 },
    { label: "T11/25", inflow: 4500000000, outflow: 3300000000 },
    { label: "T12/25", inflow: 5200000000, outflow: 3800000000 },
    { label: "T1/26", inflow: 3800000000, outflow: 2900000000 },
    { label: "T2/26", inflow: 4200000000, outflow: 3100000000 },
    { label: "T3/26", inflow: 4500000000, outflow: 3300000000 },
  ],
  quarter: [
    { label: "Q1/25", inflow: 9800000000, outflow: 7800000000 },
    { label: "Q2/25", inflow: 11200000000, outflow: 8400000000 },
    { label: "Q3/25", inflow: 12100000000, outflow: 9000000000 },
    { label: "Q4/25", inflow: 14500000000, outflow: 10800000000 },
    { label: "Q1/26", inflow: 12500000000, outflow: 9300000000 },
  ],
  year: [
    { label: "2022", inflow: 28000000000, outflow: 22500000000 },
    { label: "2023", inflow: 35000000000, outflow: 27200000000 },
    { label: "2024", inflow: 42000000000, outflow: 31500000000 },
    { label: "2025", inflow: 47600000000, outflow: 37000000000 },
    { label: "2026*", inflow: 12500000000, outflow: 9300000000 },
  ],
  project: [
    { label: "VWork Pro", inflow: 5600000000, outflow: 3500000000 },
    { label: "Tư vấn", inflow: 3200000000, outflow: 2220000000 },
    { label: "Đào tạo", inflow: 1800000000, outflow: 1280000000 },
    { label: "API", inflow: 1200000000, outflow: 720000000 },
    { label: "Bảo trì", inflow: 450000000, outflow: 370000000 },
    { label: "Khác", inflow: 250000000, outflow: 210000000 },
  ],
};

// Per-category monthly expense breakdown
interface FinItem { id: string; name: string; color: string; total: number; budget: number; monthly: { label: string; actual: number; budget: number }[] }
const expenseCategories: FinItem[] = [
  { id: "hr", name: "Nhân sự", color: "#7c3aed", total: 6045000000, budget: 6500000000, monthly: [
    { label: "T1/26", actual: 2010000000, budget: 2100000000 }, { label: "T2/26", actual: 2015000000, budget: 2150000000 },
    { label: "T3/26", actual: 2020000000, budget: 2250000000 }, { label: "T4/26", actual: 750000000, budget: 2250000000 }] },
  { id: "ops", name: "Vận hành", color: "#0891b2", total: 1860000000, budget: 2000000000, monthly: [
    { label: "T1/26", actual: 580000000, budget: 620000000 }, { label: "T2/26", actual: 620000000, budget: 650000000 },
    { label: "T3/26", actual: 660000000, budget: 730000000 }, { label: "T4/26", actual: 180000000, budget: 730000000 }] },
  { id: "mkt", name: "Marketing", color: "#db2777", total: 930000000, budget: 1000000000, monthly: [
    { label: "T1/26", actual: 290000000, budget: 310000000 }, { label: "T2/26", actual: 310000000, budget: 330000000 },
    { label: "T3/26", actual: 330000000, budget: 360000000 }, { label: "T4/26", actual: 120000000, budget: 360000000 }] },
  { id: "rnd", name: "R&D", color: "#7c3aed", total: 280000000, budget: 350000000, monthly: [
    { label: "T1/26", actual: 80000000, budget: 110000000 }, { label: "T2/26", actual: 90000000, budget: 115000000 },
    { label: "T3/26", actual: 110000000, budget: 125000000 }, { label: "T4/26", actual: 42000000, budget: 125000000 }] },
  { id: "other", name: "Khác", color: "#6b7280", total: 185000000, budget: 150000000, monthly: [
    { label: "T1/26", actual: 45000000, budget: 38000000 }, { label: "T2/26", actual: 65000000, budget: 38000000 },
    { label: "T3/26", actual: 75000000, budget: 38000000 }, { label: "T4/26", actual: 30000000, budget: 38000000 }] },
];

// Per-project monthly profit breakdown
interface ProfItem { id: string; name: string; color: string; total: number; target: number; monthly: { label: string; actual: number; target: number; margin: number }[] }
const profitProjects: ProfItem[] = [
  { id: "vwork", name: "VWork Pro", color: "#4f46e5", total: 2100000000, target: 1800000000, monthly: [
    { label: "T1/26", actual: 600000000, target: 500000000, margin: 37.5 }, { label: "T2/26", actual: 680000000, target: 560000000, margin: 35.8 },
    { label: "T3/26", actual: 820000000, target: 600000000, margin: 39.0 }, { label: "T4/26", actual: 320000000, target: 600000000, margin: 37.6 }] },
  { id: "consult", name: "Tư vấn CNTT", color: "#0891b2", total: 980000000, target: 900000000, monthly: [
    { label: "T1/26", actual: 230000000, target: 215000000, margin: 28.0 }, { label: "T2/26", actual: 300000000, target: 250000000, margin: 28.6 },
    { label: "T3/26", actual: 450000000, target: 300000000, margin: 33.8 }, { label: "T4/26", actual: 110000000, target: 300000000, margin: 34.4 }] },
  { id: "training", name: "Đào tạo", color: "#059669", total: 520000000, target: 600000000, monthly: [
    { label: "T1/26", actual: 115000000, target: 145000000, margin: 27.4 }, { label: "T2/26", actual: 155000000, target: 158000000, margin: 26.7 },
    { label: "T3/26", actual: 250000000, target: 165000000, margin: 31.3 }, { label: "T4/26", actual: 50000000, budget: 165000000, margin: 26.3 }] as any },
  { id: "api", name: "Tích hợp API", color: "#7c3aed", total: 480000000, target: 400000000, monthly: [
    { label: "T1/26", actual: 100000000, target: 97000000, margin: 40.0 }, { label: "T2/26", actual: 152000000, target: 120000000, margin: 40.0 },
    { label: "T3/26", actual: 228000000, target: 152000000, margin: 40.0 }, { label: "T4/26", actual: 72000000, target: 152000000, margin: 40.0 }] },
  { id: "maintain", name: "Bảo trì HĐ", color: "#d97706", total: 80000000, target: 120000000, monthly: [
    { label: "T1/26", actual: 23000000, target: 22000000, margin: 17.7 }, { label: "T2/26", actual: 19000000, target: 22000000, margin: 17.3 },
    { label: "T3/26", actual: 38000000, target: 22000000, margin: 18.1 }, { label: "T4/26", actual: 14000000, target: 22000000, margin: 17.5 }] },
];

// Per-project monthly cashflow breakdown
interface CfItem { id: string; name: string; color: string; monthly: { label: string; inflow: number; outflow: number }[] }
const cashflowProjects: CfItem[] = [
  { id: "vwork", name: "VWork Pro", color: "#4f46e5", monthly: [
    { label: "T1/26", inflow: 1600000000, outflow: 1000000000 }, { label: "T2/26", inflow: 1900000000, outflow: 1220000000 },
    { label: "T3/26", inflow: 2100000000, outflow: 1280000000 }, { label: "T4/26", inflow: 850000000, outflow: 530000000 }] },
  { id: "consult", name: "Tư vấn CNTT", color: "#0891b2", monthly: [
    { label: "T1/26", inflow: 820000000, outflow: 590000000 }, { label: "T2/26", inflow: 1050000000, outflow: 750000000 },
    { label: "T3/26", inflow: 1330000000, outflow: 880000000 }, { label: "T4/26", inflow: 320000000, outflow: 210000000 }] },
  { id: "training", name: "Đào tạo", color: "#059669", monthly: [
    { label: "T1/26", inflow: 420000000, outflow: 305000000 }, { label: "T2/26", inflow: 580000000, outflow: 425000000 },
    { label: "T3/26", inflow: 800000000, outflow: 550000000 }, { label: "T4/26", inflow: 190000000, outflow: 140000000 }] },
  { id: "api", name: "Tích hợp API", color: "#7c3aed", monthly: [
    { label: "T1/26", inflow: 250000000, outflow: 150000000 }, { label: "T2/26", inflow: 380000000, outflow: 228000000 },
    { label: "T3/26", inflow: 570000000, outflow: 342000000 }, { label: "T4/26", inflow: 180000000, outflow: 108000000 }] },
  { id: "maintain", name: "Bảo trì HĐ", color: "#d97706", monthly: [
    { label: "T1/26", inflow: 130000000, outflow: 107000000 }, { label: "T2/26", inflow: 110000000, outflow: 93000000 },
    { label: "T3/26", inflow: 210000000, outflow: 170000000 }, { label: "T4/26", inflow: 80000000, outflow: 68000000 }] },
];

const periodConfig: Record<RevenuePeriod, { label: string; kpiLabel: string; kpiValue: string; kpiSub: string }> = {
  day: { label: "Ngày", kpiLabel: "Hôm nay", kpiValue: "420 tr", kpiSub: "+42% vs hôm qua" },
  month: { label: "Tháng", kpiLabel: "Tháng này", kpiValue: "1.8 tỷ", kpiSub: "+10% vs tháng trước" },
  quarter: { label: "Quý", kpiLabel: "Q1/2026", kpiValue: "12.5 tỷ", kpiSub: "+18% vs Q1/2025" },
  year: { label: "Năm", kpiLabel: "2026 YTD", kpiValue: "12.5 tỷ", kpiSub: "25% mục tiêu năm" },
  project: { label: "Dự án", kpiLabel: "Tổng DT", kpiValue: "12.5 tỷ", kpiSub: "6 dự án đang hoạt động" },
};

function RevenueBarChart({ data }: { data: { label: string; actual: number; target: number; growth?: number }[] }) {
  const maxVal = Math.max(...data.flatMap(d => [d.actual, d.target]));
  const fmt = (n: number) => n >= 1000000000 ? (n / 1000000000).toFixed(1) + "tỷ" : (n / 1000000).toFixed(0) + "tr";
  const barW = Math.max(20, Math.floor(280 / data.length) - 6);

  return (
    <div className="w-full">
      {/* SVG chart */}
      <div className="overflow-x-auto">
        <svg width={Math.max(280, data.length * (barW + 8) + 20)} height="130" className="overflow-visible">
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((pct, i) => (
            <line key={i} x1="0" y1={100 - pct * 90} x2="100%" y2={100 - pct * 90}
              stroke="#f3f4f6" strokeWidth="1" strokeDasharray="3,3" />
          ))}
          {data.map((d, i) => {
            const x = i * (barW + 8) + 4;
            const actualH = Math.round((d.actual / maxVal) * 90);
            const targetH = Math.round((d.target / maxVal) * 90);
            const isOver = d.actual >= d.target;
            return (
              <g key={i}>
                {/* Target bar (behind) */}
                <rect x={x + barW * 0.15} y={100 - targetH} width={barW * 0.7} height={targetH}
                  fill="#e5e7eb" rx="3" />
                {/* Actual bar */}
                <rect x={x} y={100 - actualH} width={barW} height={actualH}
                  fill={isOver ? "url(#gradGreen)" : "url(#gradBlue)"} rx="3" />
                {/* Value label */}
                <text x={x + barW / 2} y={100 - actualH - 4} textAnchor="middle"
                  fontSize="8" fill={isOver ? "#059669" : "#2563eb"} fontWeight="600">
                  {fmt(d.actual)}
                </text>
                {/* X label */}
                <text x={x + barW / 2} y={118} textAnchor="middle"
                  fontSize="9" fill="#9ca3af">
                  {d.label}
                </text>
              </g>
            );
          })}
          <defs>
            <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2.5 rounded bg-gradient-to-b from-emerald-400 to-emerald-600" />
          <span className="text-[10px] text-gray-500">Thực tế (đạt/vượt)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2.5 rounded bg-gradient-to-b from-blue-400 to-blue-600" />
          <span className="text-[10px] text-gray-500">Thực tế (chưa đạt)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2.5 rounded bg-gray-200" />
          <span className="text-[10px] text-gray-500">Mục tiêu</span>
        </div>
      </div>
    </div>
  );
}

function FinancialOverviewView({ initialTab = 0, singleTab = false }: { initialTab?: number; singleTab?: boolean }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [revPeriod, setRevPeriod] = useState<RevenuePeriod>("quarter");

  // Date filter states
  const [selectedDate, setSelectedDate] = useState("2026-04-10");
  const [selectedMonth, setSelectedMonth] = useState(4);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedQYear, setSelectedQYear] = useState(2026);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [projectSearch, setProjectSearch] = useState("");
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [simplePeriod, setSimplePeriod] = useState<FinPeriod>("quarter");
  // Sub-selectors for expense/profit/cashflow project tabs
  const [expItemId, setExpItemId] = useState<string>("all");
  const [expSearch, setExpSearch] = useState("");
  const [expDropOpen, setExpDropOpen] = useState(false);
  const [profItemId, setProfItemId] = useState<string>("all");
  const [profSearch, setProfSearch] = useState("");
  const [profDropOpen, setProfDropOpen] = useState(false);
  const [cfItemId, setCfItemId] = useState<string>("all");
  const [cfSearch, setCfSearch] = useState("");
  const [cfDropOpen, setCfDropOpen] = useState(false);
  const [debtSubTab, setDebtSubTab] = useState<"receivable" | "payable">("receivable");
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [selectedTaxIdx, setSelectedTaxIdx] = useState<number | null>(null);
  const [vatInvoiceTab, setVatInvoiceTab] = useState<"output" | "input">("output");
  const [taxSubTab, setTaxSubTab] = useState<"reports" | "payments" | "debt">("reports");
  const [taxReportFilter, setTaxReportFilter] = useState<"all" | "pending" | "submitted" | "paid">("all");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedDebtTaxId, setSelectedDebtTaxId] = useState<string | null>(null);
  const [budgetViewTab, setBudgetViewTab] = useState<"category" | "dept" | "project">("category");
  const [modal, setModal] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const years = [2022, 2023, 2024, 2025, 2026];
  const months = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

  const fmt = (n: number) => n >= 1000000000 ? (n / 1000000000).toFixed(1) + " tỷ" : (n / 1000000).toFixed(0) + " tr";
  const fmtShort = (n: number) => n === 0 ? "—" : n >= 1000000000 ? (n / 1000000000).toFixed(2) + "tỷ" : n >= 1000000 ? (n / 1000000).toFixed(1) + "tr" : n.toLocaleString("vi-VN");
  const fmtPct = (n: number) => n.toFixed(1) + "%";

  const tabs = ["Doanh thu", "Chi phí", "Lợi nhuận", "Dòng tiền", "Công nợ", "Thuế", "Báo cáo thuế", "Ngân sách"];

  const daysUntil = (dateStr: string) => {
    const parts = dateStr.split("/");
    const d = new Date(+parts[2], +parts[1] - 1, +parts[0]);
    return Math.ceil((d.getTime() - Date.now()) / 86400000);
  };

  const taxStatusConfig: Record<string, { label: string; color: string; bg: string; step?: string }> = {
    pending:   { label: "Chưa nộp",        color: "text-amber-600", bg: "bg-amber-50 border-amber-200",   step: "Bước 1/2" },
    submitted: { label: "Đã nộp tờ khai",  color: "text-blue-600",  bg: "bg-blue-50 border-blue-200",     step: "Bước 2/2 — chờ nộp tiền" },
    paid:      { label: "Hoàn thành",       color: "text-green-600", bg: "bg-green-50 border-green-200",   step: "Đã nộp tờ khai + nộp tiền" },
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Tab bar — hidden when viewing a single sub-item */}
      {!singleTab && (
        <div className="flex gap-0 border-b border-gray-100 shrink-0 px-4 pt-3 overflow-x-auto">
          {tabs.map((t, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`px-3 py-2 text-[12px] font-medium border-b-2 whitespace-nowrap transition-all ${
                activeTab === i ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Tab 0: Doanh thu */}
        {activeTab === 0 && (() => {
          const pCfg = periodConfig[revPeriod];
          const selectedProject = selectedProjectId !== "all" ? projectList.find(p => p.id === selectedProjectId) : null;
          // When a specific project is selected in "project" mode, show its monthly breakdown
          const chartData = (revPeriod === "project" && selectedProject)
            ? selectedProject.monthly
            : revenueChartData[revPeriod];
          const totalActual = chartData.reduce((s, d) => s + d.actual, 0);
          const totalTarget = chartData.reduce((s, d) => s + d.target, 0);
          const achieveRate = Math.round(totalActual / totalTarget * 100);
          const bestItem = [...chartData].sort((a, b) => b.actual - a.actual)[0];
          const avgGrowth = Math.round(chartData.reduce((s, d) => s + (d.growth ?? 0), 0) / chartData.length);
          return (
            <>
              {/* Period filter pills */}
              <div className="flex gap-1.5 flex-wrap items-center">
                {(["day", "month", "quarter", "year", "project"] as RevenuePeriod[]).map(p => (
                  <button key={p} onClick={() => setRevPeriod(p)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${
                      revPeriod === p
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                        : "bg-white text-gray-500 border-gray-200 hover:border-emerald-300 hover:text-emerald-600"
                    }`}>
                    {periodConfig[p].label}
                  </button>
                ))}
              </div>

              {/* Date selector — adapts to period type */}
              {revPeriod === "day" && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 shrink-0">Chọn ngày:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="text-[12px] border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 bg-white"
                  />
                </div>
              )}
              {revPeriod === "month" && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 shrink-0">Chọn tháng:</span>
                  <select value={selectedMonth} onChange={e => setSelectedMonth(+e.target.value)}
                    className="text-[12px] border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:border-emerald-400 bg-white">
                    {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                  <select value={selectedYear} onChange={e => setSelectedYear(+e.target.value)}
                    className="text-[12px] border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:border-emerald-400 bg-white">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}
              {revPeriod === "quarter" && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 shrink-0">Chọn quý:</span>
                  <select value={selectedQuarter} onChange={e => setSelectedQuarter(+e.target.value)}
                    className="text-[12px] border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:border-emerald-400 bg-white">
                    {[1,2,3,4].map(q => <option key={q} value={q}>Q{q}</option>)}
                  </select>
                  <select value={selectedQYear} onChange={e => setSelectedQYear(+e.target.value)}
                    className="text-[12px] border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:border-emerald-400 bg-white">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}
              {revPeriod === "year" && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 shrink-0">Chọn năm:</span>
                  <select value={selectedYear} onChange={e => setSelectedYear(+e.target.value)}
                    className="text-[12px] border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:border-emerald-400 bg-white">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}
              {revPeriod === "project" && (() => {
                const filtered = projectList.filter(p =>
                  p.name.toLowerCase().includes(projectSearch.toLowerCase())
                );
                const displayName = selectedProjectId === "all" ? "Tất cả dự án" : (projectList.find(p => p.id === selectedProjectId)?.name ?? "");
                return (
                  <div className="space-y-2">
                    {/* Search input + selected badge */}
                    <div className="relative">
                      <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 bg-white transition-all ${projectDropdownOpen ? "border-emerald-400 ring-1 ring-emerald-200" : "border-gray-200"}`}>
                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Nhập tên dự án để tìm kiếm..."
                          value={projectSearch}
                          onChange={e => { setProjectSearch(e.target.value); setProjectDropdownOpen(true); }}
                          onFocus={() => setProjectDropdownOpen(true)}
                          className="flex-1 text-[12px] text-gray-700 bg-transparent outline-none placeholder-gray-400 min-w-0"
                        />
                        {(projectSearch || selectedProjectId !== "all") && (
                          <button onClick={() => { setProjectSearch(""); setSelectedProjectId("all"); setProjectDropdownOpen(false); }}
                            className="text-gray-400 hover:text-gray-600 shrink-0 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Dropdown */}
                      {projectDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                          {/* "Tất cả" option */}
                          <button
                            onClick={() => { setSelectedProjectId("all"); setProjectSearch(""); setProjectDropdownOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] hover:bg-gray-50 transition-colors ${selectedProjectId === "all" ? "bg-gray-50 font-semibold text-gray-800" : "text-gray-600"}`}>
                            <div className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                            <span>Tất cả dự án</span>
                            {selectedProjectId === "all" && <span className="ml-auto text-emerald-500">✓</span>}
                          </button>
                          <div className="border-t border-gray-100" />
                          {filtered.length === 0 ? (
                            <div className="px-3 py-3 text-[12px] text-gray-400 text-center">Không tìm thấy dự án nào</div>
                          ) : filtered.map(p => (
                            <button key={p.id}
                              onClick={() => { setSelectedProjectId(p.id); setProjectSearch(""); setProjectDropdownOpen(false); }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] hover:bg-gray-50 transition-colors ${selectedProjectId === p.id ? "bg-gray-50 font-semibold text-gray-800" : "text-gray-600"}`}>
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                              <span className="flex-1 text-left">{p.name}</span>
                              <span className="text-[11px] text-gray-400">{fmt(p.total)}</span>
                              <span className={`text-[11px] font-medium ml-1 ${p.growth >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                {p.growth >= 0 ? "+" : ""}{p.growth}%
                              </span>
                              {selectedProjectId === p.id && <span className="text-emerald-500 ml-1">✓</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Current selection badge */}
                    {selectedProject ? (
                      <div className="rounded-xl border px-3 py-2 flex items-center gap-3"
                        style={{ borderColor: selectedProject.color + "44", backgroundColor: selectedProject.color + "0a" }}>
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedProject.color }} />
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] font-semibold text-gray-700">{selectedProject.name}</span>
                          <span className="text-[11px] text-gray-400 ml-2">Tổng: {fmt(selectedProject.total)}</span>
                        </div>
                        <span className={`text-[11px] font-bold ${selectedProject.growth >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {selectedProject.growth >= 0 ? "+" : ""}{selectedProject.growth}% YoY
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-gray-400 px-1">
                        Đang hiển thị: <span className="font-medium text-gray-600">{displayName}</span> — {projectList.length} dự án
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* KPI cards */}
              <div className="grid grid-cols-2 gap-2.5">
                <div
                  className={`rounded-xl p-3 text-white shadow-sm ${!selectedProject ? "bg-gradient-to-br from-emerald-500 to-emerald-600" : ""}`}
                  style={selectedProject ? { background: `linear-gradient(135deg, ${selectedProject.color}cc, ${selectedProject.color})` } : undefined}>
                  <p className="text-[9px] font-semibold uppercase tracking-widest opacity-80">
                    {selectedProject ? selectedProject.name : pCfg.kpiLabel}
                  </p>
                  <p className="text-[22px] font-bold mt-0.5 leading-tight">{fmt(totalActual)}</p>
                  <p className="text-[10px] opacity-80 mt-1">
                    {selectedProject ? `Mục tiêu: ${fmt(selectedProject.target)}` : pCfg.kpiSub}
                  </p>
                </div>
                <div className="grid grid-rows-2 gap-2">
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-2.5">
                    <p className="text-[9px] text-blue-500 font-semibold uppercase tracking-wide">Tăng trưởng TB</p>
                    <p className="text-[15px] font-bold text-blue-700">{avgGrowth > 0 ? "+" : ""}{avgGrowth}%</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-2.5">
                    <p className="text-[9px] text-amber-600 font-semibold uppercase tracking-wide">Đạt mục tiêu</p>
                    <p className={`text-[15px] font-bold ${achieveRate >= 100 ? "text-emerald-600" : "text-amber-700"}`}>{achieveRate}%</p>
                  </div>
                </div>
              </div>

              {/* Progress bar toward target */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-gray-600">Tiến độ so với mục tiêu</span>
                  <span className="text-[11px] font-bold text-gray-700">{fmt(totalActual)} / {fmt(totalTarget)}</span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, achieveRate)}%`,
                      background: achieveRate >= 100 ? "linear-gradient(90deg,#34d399,#059669)" : "linear-gradient(90deg,#60a5fa,#2563eb)"
                    }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-gray-400">0</span>
                  <span className="text-[9px] text-gray-400">{fmt(totalTarget)}</span>
                </div>
              </div>

              {/* Bar chart */}
              <div className="rounded-xl border border-gray-100 bg-white p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                    Biểu đồ doanh thu
                  </h3>
                  <span className="text-[10px] text-gray-400">
                    {revPeriod === "project"
                      ? (selectedProject ? `${selectedProject.name} · theo tháng` : "Tổng hợp tất cả dự án")
                      : `Theo ${pCfg.label.toLowerCase()}`}
                  </span>
                </div>
                <RevenueBarChart data={chartData} />
              </div>

              {/* Detail table */}
              <div>
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Chi tiết {revPeriod === "project"
                    ? (selectedProject ? `${selectedProject.name} theo tháng` : "từng dự án")
                    : `từng ${pCfg.label.toLowerCase()}`}
                </h3>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="grid grid-cols-4 px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">Kỳ</span>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase text-right">Thực tế</span>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase text-right">Mục tiêu</span>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase text-right">Tăng trưởng</span>
                  </div>
                  {chartData.map((d, i) => {
                    const isOver = d.actual >= d.target;
                    const g = d.growth ?? 0;
                    return (
                      <div key={i} className={`grid grid-cols-4 px-3 py-2 ${i < chartData.length - 1 ? "border-b border-gray-50" : ""} hover:bg-gray-50/60 transition-colors`}>
                        <span className="text-[12px] font-medium text-gray-700">{d.label}</span>
                        <span className={`text-[12px] font-bold text-right ${isOver ? "text-emerald-600" : "text-blue-600"}`}>{fmt(d.actual)}</span>
                        <span className="text-[11px] text-gray-400 text-right">{fmt(d.target)}</span>
                        <span className={`text-[11px] font-semibold text-right ${g > 0 ? "text-emerald-600" : g < 0 ? "text-red-500" : "text-gray-400"}`}>
                          {g > 0 ? "+" : ""}{g}%
                        </span>
                      </div>
                    );
                  })}
                  <div className="grid grid-cols-4 px-3 py-2 bg-emerald-50 border-t border-emerald-100">
                    <span className="text-[11px] font-bold text-emerald-700">Tổng</span>
                    <span className="text-[12px] font-bold text-emerald-700 text-right">{fmt(totalActual)}</span>
                    <span className="text-[11px] text-emerald-600 text-right">{fmt(totalTarget)}</span>
                    <span className={`text-[11px] font-bold text-right ${achieveRate >= 100 ? "text-emerald-600" : "text-blue-600"}`}>{achieveRate}%</span>
                  </div>
                </div>
              </div>

              {/* Highlight */}
              {revPeriod !== "project" && (
                <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <span className="text-[14px]">🏆</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-emerald-700">Kỳ tốt nhất: {bestItem.label}</p>
                    <p className="text-[10px] text-emerald-600">{fmt(bestItem.actual)} · tăng trưởng {(bestItem.growth ?? 0) > 0 ? "+" : ""}{bestItem.growth ?? 0}%</p>
                  </div>
                </div>
              )}

              {/* Segment breakdown (always shown) */}
              <div>
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Phân tích theo phân khúc</h3>
                <div className="space-y-2">
                  {financialData.revenue.bySegment.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-[12px] text-gray-700 w-16 shrink-0">{s.name}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.percent}%`, backgroundColor: s.color }} />
                      </div>
                      <span className="text-[10px] text-gray-500 w-8 text-right shrink-0">{s.percent}%</span>
                      <span className="text-[11px] font-medium text-gray-700 w-14 text-right shrink-0">{fmt(s.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action bar */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => { setModal("add-revenue"); setFormData({}); }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5 shadow-sm">
                  <Plus className="w-3.5 h-3.5" /> Nhập doanh thu
                </button>
              </div>
            </>
          );
        })()}

        {/* Tab 1: Chi phí */}
        {activeTab === 1 && (() => {
          const selectedExpCat = expItemId !== "all" ? expenseCategories.find(c => c.id === expItemId) : null;
          const expData = (simplePeriod === "project" && selectedExpCat)
            ? selectedExpCat.monthly
            : expenseChartData[simplePeriod];
          const totalActual = expData.reduce((s, d) => s + d.actual, 0);
          const totalBudget = expData.reduce((s, d) => s + d.budget, 0);
          const burnRate = Math.round(totalActual / totalBudget * 100);
          const maxVal = Math.max(...expData.flatMap(d => [d.actual, d.budget]));
          const filteredExpCats = expenseCategories.filter(c => c.name.toLowerCase().includes(expSearch.toLowerCase()));
          return (
            <>
              {/* Period filter */}
              <div className="flex gap-1.5 flex-wrap">
                {(["day", "month", "quarter", "year", "project"] as FinPeriod[]).map(p => (
                  <button key={p} onClick={() => setSimplePeriod(p)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${
                      simplePeriod === p ? "bg-red-500 text-white border-red-500 shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-red-300 hover:text-red-600"
                    }`}>
                    {p === "day" ? "Ngày" : p === "month" ? "Tháng" : p === "quarter" ? "Quý" : p === "year" ? "Năm" : "Danh mục"}
                  </button>
                ))}
              </div>

              {/* Category selector */}
              {simplePeriod === "project" && (() => {
                return (
                  <div className="space-y-2">
                    <div className="relative">
                      <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 bg-white transition-all ${expDropOpen ? "border-red-400 ring-1 ring-red-200" : "border-gray-200"}`}>
                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/></svg>
                        <input type="text" placeholder="Tìm danh mục chi phí..." value={expSearch}
                          onChange={e => { setExpSearch(e.target.value); setExpDropOpen(true); }}
                          onFocus={() => setExpDropOpen(true)}
                          className="flex-1 text-[12px] text-gray-700 bg-transparent outline-none placeholder-gray-400" />
                        {(expSearch || expItemId !== "all") && (
                          <button onClick={() => { setExpSearch(""); setExpItemId("all"); setExpDropOpen(false); }} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        )}
                      </div>
                      {expDropOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                          <button onClick={() => { setExpItemId("all"); setExpSearch(""); setExpDropOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] hover:bg-gray-50 ${expItemId === "all" ? "bg-gray-50 font-semibold text-gray-800" : "text-gray-600"}`}>
                            <div className="w-2 h-2 rounded-full bg-gray-400 shrink-0"/><span>Tất cả danh mục</span>{expItemId === "all" && <span className="ml-auto text-emerald-500">✓</span>}
                          </button>
                          <div className="border-t border-gray-100"/>
                          {filteredExpCats.length === 0 ? <div className="px-3 py-3 text-[12px] text-gray-400 text-center">Không tìm thấy</div>
                            : filteredExpCats.map(c => (
                            <button key={c.id} onClick={() => { setExpItemId(c.id); setExpSearch(""); setExpDropOpen(false); }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] hover:bg-gray-50 ${expItemId === c.id ? "bg-gray-50 font-semibold text-gray-800" : "text-gray-600"}`}>
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }}/>
                              <span className="flex-1 text-left">{c.name}</span>
                              <span className="text-[11px] text-gray-400">{fmt(c.total)}</span>
                              <span className={`text-[11px] font-medium ml-1 ${c.actual > c.budget ? "text-red-500" : "text-emerald-600"}`}>{Math.round(c.total/c.budget*100)}%</span>
                              {expItemId === c.id && <span className="text-emerald-500 ml-1">✓</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedExpCat && (
                      <div className="rounded-xl border px-3 py-2 flex items-center gap-3" style={{ borderColor: selectedExpCat.color + "44", backgroundColor: selectedExpCat.color + "0a" }}>
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedExpCat.color }}/>
                        <div className="flex-1"><span className="text-[12px] font-semibold text-gray-700">{selectedExpCat.name}</span><span className="text-[11px] text-gray-400 ml-2">NS: {fmt(selectedExpCat.budget)}</span></div>
                        <span className={`text-[11px] font-bold ${selectedExpCat.total > selectedExpCat.budget ? "text-red-600" : "text-emerald-600"}`}>{Math.round(selectedExpCat.total/selectedExpCat.budget*100)}% NS</span>
                      </div>
                    )}
                    {!selectedExpCat && <div className="text-[11px] text-gray-400 px-1">Đang hiển thị: <span className="font-medium text-gray-600">Tất cả danh mục</span> — {expenseCategories.length} danh mục</div>}
                  </div>
                );
              })()}

              {/* KPIs */}
              <div className="grid grid-cols-2 gap-2.5">
                <div
                  className={`rounded-xl p-3 text-white shadow-sm ${!selectedExpCat ? "bg-gradient-to-br from-red-500 to-rose-600" : ""}`}
                  style={selectedExpCat ? { background: `linear-gradient(135deg, ${selectedExpCat.color}cc, ${selectedExpCat.color})` } : undefined}>
                  <p className="text-[9px] font-semibold uppercase tracking-widest opacity-80">{selectedExpCat ? selectedExpCat.name : "Chi phí YTD"}</p>
                  <p className="text-[22px] font-bold mt-0.5 leading-tight">{fmt(totalActual)}</p>
                  <p className="text-[10px] opacity-80 mt-1">{selectedExpCat ? `NS: ${fmt(totalBudget)}` : `Ngân sách: ${fmt(financialData.expenses.budget)}`}</p>
                </div>
                <div className="grid grid-rows-2 gap-2">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-2.5">
                    <p className="text-[9px] text-emerald-600 font-semibold uppercase tracking-wide">Còn lại</p>
                    <p className="text-[15px] font-bold text-emerald-700">{fmt(financialData.expenses.budget - financialData.expenses.ytd)}</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-2.5">
                    <p className="text-[9px] text-blue-600 font-semibold uppercase tracking-wide">Burn rate</p>
                    <p className={`text-[15px] font-bold ${burnRate > 100 ? "text-red-600" : "text-blue-700"}`}>{burnRate}%</p>
                  </div>
                </div>
              </div>
              {/* Progress */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-gray-600">Ngân sách đã sử dụng</span>
                  <span className="text-[11px] font-bold text-gray-700">{fmt(totalActual)} / {fmt(totalBudget)}</span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, burnRate)}%`, background: burnRate > 100 ? "linear-gradient(90deg,#f87171,#dc2626)" : "linear-gradient(90deg,#f97316,#ef4444)" }} />
                </div>
              </div>
              {/* Chart */}
              <div className="rounded-xl border border-gray-100 bg-white p-3">
                <h3 className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-3">Biểu đồ chi phí · Thực chi vs Ngân sách</h3>
                <div className="overflow-x-auto">
                  <svg width={Math.max(280, expData.length * 44)} height="120" className="overflow-visible">
                    {[0.25,0.5,0.75,1].map((pct,i) => (
                      <line key={i} x1="0" y1={90-pct*80} x2="100%" y2={90-pct*80} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="3,3" />
                    ))}
                    {expData.map((d, i) => {
                      const bw = 32; const x = i * 44 + 4;
                      const aH = Math.round(d.actual/maxVal*80); const bH = Math.round(d.budget/maxVal*80);
                      const over = d.actual > d.budget;
                      return (
                        <g key={i}>
                          <rect x={x+bw*0.15} y={90-bH} width={bw*0.7} height={bH} fill="#e5e7eb" rx="3" />
                          <rect x={x} y={90-aH} width={bw} height={aH} fill={over ? "#ef4444" : "#f97316"} rx="3" opacity="0.85" />
                          <text x={x+bw/2} y={90-aH-4} textAnchor="middle" fontSize="8" fill={over?"#dc2626":"#ea580c"} fontWeight="600">{fmt(d.actual)}</text>
                          <text x={x+bw/2} y={108} textAnchor="middle" fontSize="9" fill="#9ca3af">{d.label}</text>
                        </g>
                      );
                    })}
                    <defs>
                      <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f87171"/><stop offset="100%" stopColor="#ef4444"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-2.5 rounded bg-orange-400"/><span className="text-[10px] text-gray-500">Thực chi</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-2.5 rounded bg-gray-200"/><span className="text-[10px] text-gray-500">Ngân sách</span></div>
                </div>
              </div>
              {/* Detail table */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-3 px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Kỳ</span>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase text-right">Thực chi</span>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase text-right">Ngân sách</span>
                </div>
                {expData.map((d, i) => (
                  <div key={i} className={`grid grid-cols-3 px-3 py-2 ${i<expData.length-1?"border-b border-gray-50":""} hover:bg-gray-50/60`}>
                    <span className="text-[12px] font-medium text-gray-700">{d.label}</span>
                    <span className={`text-[12px] font-bold text-right ${d.actual>d.budget?"text-red-600":"text-orange-600"}`}>{fmt(d.actual)}</span>
                    <span className="text-[11px] text-gray-400 text-right">{fmt(d.budget)}</span>
                  </div>
                ))}
                <div className="grid grid-cols-3 px-3 py-2 bg-red-50 border-t border-red-100">
                  <span className="text-[11px] font-bold text-red-700">Tổng</span>
                  <span className="text-[12px] font-bold text-red-700 text-right">{fmt(totalActual)}</span>
                  <span className="text-[11px] text-red-500 text-right">{fmt(totalBudget)}</span>
                </div>
              </div>
              {/* Category breakdown */}
              <div>
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Theo danh mục</h3>
                <div className="space-y-2">
                  {financialData.expenses.byCategory.map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-[12px] text-gray-700 w-16 shrink-0">{c.name}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${c.percent}%`, backgroundColor: c.color }} />
                      </div>
                      <span className="text-[10px] text-gray-500 w-8 text-right shrink-0">{c.percent}%</span>
                      <span className="text-[11px] font-medium text-gray-700 w-14 text-right shrink-0">{fmt(c.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action bar */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => { setModal("add-expense"); setFormData({}); }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[12px] font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-1.5 shadow-sm">
                  <Plus className="w-3.5 h-3.5" /> Tạo đề nghị chi
                </button>
                <button onClick={() => toast.info("3 đề nghị đang chờ duyệt", { description: "Dell 280tr · AWS 195tr · Dentsu 120tr" })}
                  className="py-2.5 px-3.5 rounded-xl bg-amber-100 text-amber-700 text-[12px] font-medium hover:bg-amber-200 transition-all border border-amber-200">
                  Chờ duyệt (3)
                </button>
              </div>
            </>
          );
        })()}

        {/* Tab 2: Lợi nhuận */}
        {activeTab === 2 && (() => {
          const selectedProfProj = profItemId !== "all" ? profitProjects.find(p => p.id === profItemId) : null;
          const profData = (simplePeriod === "project" && selectedProfProj)
            ? selectedProfProj.monthly
            : profitChartData[simplePeriod];
          const maxVal = Math.max(...profData.flatMap(d => [d.actual, d.target]));
          const totalActual = profData.reduce((s,d)=>s+d.actual,0);
          const totalTarget = profData.reduce((s,d)=>s+d.target,0);
          const avgMargin = (profData.reduce((s,d)=>s+d.margin,0)/profData.length).toFixed(1);
          const filteredProfProjs = profitProjects.filter(p => p.name.toLowerCase().includes(profSearch.toLowerCase()));
          return (
            <>
              {/* Period filter */}
              <div className="flex gap-1.5 flex-wrap">
                {(["day","month","quarter","year","project"] as FinPeriod[]).map(p => (
                  <button key={p} onClick={() => setSimplePeriod(p)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${
                      simplePeriod===p ? "bg-blue-500 text-white border-blue-500 shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                    }`}>
                    {p==="day"?"Ngày":p==="month"?"Tháng":p==="quarter"?"Quý":p==="year"?"Năm":"Dự án"}
                  </button>
                ))}
              </div>

              {/* Project selector */}
              {simplePeriod === "project" && (() => (
                <div className="space-y-2">
                  <div className="relative">
                    <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 bg-white transition-all ${profDropOpen ? "border-blue-400 ring-1 ring-blue-200" : "border-gray-200"}`}>
                      <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/></svg>
                      <input type="text" placeholder="Tìm dự án..." value={profSearch}
                        onChange={e => { setProfSearch(e.target.value); setProfDropOpen(true); }}
                        onFocus={() => setProfDropOpen(true)}
                        className="flex-1 text-[12px] text-gray-700 bg-transparent outline-none placeholder-gray-400" />
                      {(profSearch || profItemId !== "all") && (
                        <button onClick={() => { setProfSearch(""); setProfItemId("all"); setProfDropOpen(false); }} className="text-gray-400 hover:text-gray-600">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      )}
                    </div>
                    {profDropOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                        <button onClick={() => { setProfItemId("all"); setProfSearch(""); setProfDropOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] hover:bg-gray-50 ${profItemId === "all" ? "bg-gray-50 font-semibold text-gray-800" : "text-gray-600"}`}>
                          <div className="w-2 h-2 rounded-full bg-gray-400 shrink-0"/><span>Tất cả dự án</span>{profItemId === "all" && <span className="ml-auto text-emerald-500">✓</span>}
                        </button>
                        <div className="border-t border-gray-100"/>
                        {filteredProfProjs.length === 0 ? <div className="px-3 py-3 text-[12px] text-gray-400 text-center">Không tìm thấy</div>
                          : filteredProfProjs.map(proj => (
                          <button key={proj.id} onClick={() => { setProfItemId(proj.id); setProfSearch(""); setProfDropOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] hover:bg-gray-50 ${profItemId === proj.id ? "bg-gray-50 font-semibold text-gray-800" : "text-gray-600"}`}>
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: proj.color }}/>
                            <span className="flex-1 text-left">{proj.name}</span>
                            <span className="text-[11px] text-gray-400">{fmt(proj.total)}</span>
                            <span className={`text-[11px] font-medium ml-1 ${proj.total >= proj.target ? "text-emerald-600" : "text-blue-500"}`}>{Math.round(proj.total/proj.target*100)}%</span>
                            {profItemId === proj.id && <span className="text-emerald-500 ml-1">✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedProfProj && (
                    <div className="rounded-xl border px-3 py-2 flex items-center gap-3" style={{ borderColor: selectedProfProj.color + "44", backgroundColor: selectedProfProj.color + "0a" }}>
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedProfProj.color }}/>
                      <div className="flex-1"><span className="text-[12px] font-semibold text-gray-700">{selectedProfProj.name}</span><span className="text-[11px] text-gray-400 ml-2">Mục tiêu: {fmt(selectedProfProj.target)}</span></div>
                      <span className={`text-[11px] font-bold ${selectedProfProj.total >= selectedProfProj.target ? "text-emerald-600" : "text-blue-600"}`}>{Math.round(selectedProfProj.total/selectedProfProj.target*100)}% MT</span>
                    </div>
                  )}
                  {!selectedProfProj && <div className="text-[11px] text-gray-400 px-1">Đang hiển thị: <span className="font-medium text-gray-600">Tất cả dự án</span> — {profitProjects.length} dự án</div>}
                </div>
              ))()}

              {/* KPIs */}
              <div className="grid grid-cols-2 gap-2.5">
                <div
                  className={`rounded-xl p-3 text-white shadow-sm ${!selectedProfProj ? "bg-gradient-to-br from-blue-500 to-indigo-600" : ""}`}
                  style={selectedProfProj ? { background: `linear-gradient(135deg, ${selectedProfProj.color}cc, ${selectedProfProj.color})` } : undefined}>
                  <p className="text-[9px] font-semibold uppercase tracking-widest opacity-80">{selectedProfProj ? selectedProfProj.name : "Lợi nhuận ròng YTD"}</p>
                  <p className="text-[22px] font-bold mt-0.5 leading-tight">{fmt(totalActual)}</p>
                  <p className="text-[10px] opacity-80 mt-1">{selectedProfProj ? `Mục tiêu: ${fmt(totalTarget)}` : `Mục tiêu: ${fmt(financialData.profit.target)}`}</p>
                </div>
                <div className="grid grid-rows-2 gap-2">
                  <div className="rounded-xl bg-purple-50 border border-purple-100 p-2.5">
                    <p className="text-[9px] text-purple-600 font-semibold uppercase tracking-wide">Biên LN TB</p>
                    <p className="text-[15px] font-bold text-purple-700">{avgMargin}%</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-2.5">
                    <p className="text-[9px] text-amber-600 font-semibold uppercase tracking-wide">EBITDA</p>
                    <p className="text-[15px] font-bold text-amber-700">{fmt(financialData.profit.ebitda)}</p>
                  </div>
                </div>
              </div>
              {/* Progress */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-gray-600">Tiến độ mục tiêu năm</span>
                  <span className="text-[11px] font-bold text-gray-700">{financialData.profit.progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${financialData.profit.progress}%`, background: "linear-gradient(90deg,#60a5fa,#3b82f6)" }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-gray-400">0</span>
                  <span className="text-[9px] text-gray-400">Mục tiêu: {fmt(financialData.profit.target)}</span>
                </div>
              </div>
              {/* Chart */}
              <div className="rounded-xl border border-gray-100 bg-white p-3">
                <h3 className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-3">Biểu đồ lợi nhuận · Biên lợi nhuận</h3>
                <div className="overflow-x-auto">
                  <svg width={Math.max(280, profData.length*44)} height="120" className="overflow-visible">
                    {[0.25,0.5,0.75,1].map((pct,i)=>(
                      <line key={i} x1="0" y1={90-pct*80} x2="100%" y2={90-pct*80} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="3,3"/>
                    ))}
                    {profData.map((d,i)=>{
                      const bw=32; const x=i*44+4;
                      const aH=Math.round(d.actual/maxVal*80); const tH=Math.round(d.target/maxVal*80);
                      const over=d.actual>=d.target;
                      return(
                        <g key={i}>
                          <rect x={x+bw*0.15} y={90-tH} width={bw*0.7} height={tH} fill="#e5e7eb" rx="3"/>
                          <rect x={x} y={90-aH} width={bw} height={aH} fill={over?"#3b82f6":"#60a5fa"} rx="3" opacity="0.9"/>
                          <text x={x+bw/2} y={90-aH-4} textAnchor="middle" fontSize="8" fill="#2563eb" fontWeight="600">{fmt(d.actual)}</text>
                          <text x={x+bw/2} y={108} textAnchor="middle" fontSize="9" fill="#9ca3af">{d.label}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                {/* Margin line chart (bar with margin label) */}
                <div className="mt-3 space-y-1.5 border-t border-gray-50 pt-3">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-2">Biên lợi nhuận theo kỳ</p>
                  {profData.map((d,i)=>(
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 w-12 shrink-0">{d.label}</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-blue-400" style={{width:`${d.margin}%`}}/>
                      </div>
                      <span className="text-[10px] font-semibold text-blue-600 w-10 text-right shrink-0">{d.margin}%</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Compare table */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-4 px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Kỳ</span>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase text-right">Thực tế</span>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase text-right">Mục tiêu</span>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase text-right">Biên LN</span>
                </div>
                {profData.map((d,i)=>(
                  <div key={i} className={`grid grid-cols-4 px-3 py-2 ${i<profData.length-1?"border-b border-gray-50":""} hover:bg-gray-50/60`}>
                    <span className="text-[12px] font-medium text-gray-700">{d.label}</span>
                    <span className={`text-[12px] font-bold text-right ${d.actual>=d.target?"text-blue-600":"text-gray-500"}`}>{fmt(d.actual)}</span>
                    <span className="text-[11px] text-gray-400 text-right">{fmt(d.target)}</span>
                    <span className="text-[11px] font-semibold text-blue-500 text-right">{d.margin}%</span>
                  </div>
                ))}
                <div className="grid grid-cols-4 px-3 py-2 bg-blue-50 border-t border-blue-100">
                  <span className="text-[11px] font-bold text-blue-700">Tổng</span>
                  <span className="text-[12px] font-bold text-blue-700 text-right">{fmt(totalActual)}</span>
                  <span className="text-[11px] text-blue-500 text-right">{fmt(totalTarget)}</span>
                  <span className="text-[11px] font-bold text-blue-600 text-right">{avgMargin}%</span>
                </div>
              </div>

              {/* Action bar */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => toast.success("Đã gửi báo cáo lợi nhuận", { description: "Báo cáo đã được gửi tới CFO — Nguyễn Minh để xem xét và phê duyệt" })}
                  className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-[12px] font-semibold hover:bg-blue-600 transition-all flex items-center justify-center gap-1.5 shadow-sm">
                  Gửi báo cáo CFO
                </button>
                <button onClick={() => toast.info("Đang xuất Excel...", { description: "Tệp sẽ được tải về sau vài giây" })}
                  className="py-2.5 px-3.5 rounded-xl bg-gray-100 text-gray-600 text-[12px] font-medium hover:bg-gray-200 transition-all">
                  Xuất Excel
                </button>
              </div>
            </>
          );
        })()}

        {/* Tab 3: Dòng tiền */}
        {activeTab === 3 && (() => {
          const selectedCfProj = cfItemId !== "all" ? cashflowProjects.find(p => p.id === cfItemId) : null;
          const cfData = (simplePeriod === "project" && selectedCfProj)
            ? selectedCfProj.monthly
            : cashflowChartData[simplePeriod];
          const maxVal = Math.max(...cfData.flatMap(d=>[d.inflow,d.outflow]));
          const totalIn = cfData.reduce((s,d)=>s+d.inflow,0);
          const totalOut = cfData.reduce((s,d)=>s+d.outflow,0);
          const netCF = totalIn - totalOut;
          const filteredCfProjs = cashflowProjects.filter(p => p.name.toLowerCase().includes(cfSearch.toLowerCase()));
          return (
            <>
              {/* Period filter */}
              <div className="flex gap-1.5 flex-wrap">
                {(["day","month","quarter","year","project"] as FinPeriod[]).map(p=>(
                  <button key={p} onClick={()=>setSimplePeriod(p)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${
                      simplePeriod===p ? "bg-cyan-500 text-white border-cyan-500 shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-cyan-300 hover:text-cyan-600"
                    }`}>
                    {p==="day"?"Ngày":p==="month"?"Tháng":p==="quarter"?"Quý":p==="year"?"Năm":"Dự án"}
                  </button>
                ))}
              </div>

              {/* Project selector */}
              {simplePeriod === "project" && (() => (
                <div className="space-y-2">
                  <div className="relative">
                    <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 bg-white transition-all ${cfDropOpen ? "border-cyan-400 ring-1 ring-cyan-200" : "border-gray-200"}`}>
                      <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/></svg>
                      <input type="text" placeholder="Tìm dự án..." value={cfSearch}
                        onChange={e => { setCfSearch(e.target.value); setCfDropOpen(true); }}
                        onFocus={() => setCfDropOpen(true)}
                        className="flex-1 text-[12px] text-gray-700 bg-transparent outline-none placeholder-gray-400" />
                      {(cfSearch || cfItemId !== "all") && (
                        <button onClick={() => { setCfSearch(""); setCfItemId("all"); setCfDropOpen(false); }} className="text-gray-400 hover:text-gray-600">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      )}
                    </div>
                    {cfDropOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                        <button onClick={() => { setCfItemId("all"); setCfSearch(""); setCfDropOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] hover:bg-gray-50 ${cfItemId === "all" ? "bg-gray-50 font-semibold text-gray-800" : "text-gray-600"}`}>
                          <div className="w-2 h-2 rounded-full bg-gray-400 shrink-0"/><span>Tất cả dự án</span>{cfItemId === "all" && <span className="ml-auto text-emerald-500">✓</span>}
                        </button>
                        <div className="border-t border-gray-100"/>
                        {filteredCfProjs.length === 0 ? <div className="px-3 py-3 text-[12px] text-gray-400 text-center">Không tìm thấy</div>
                          : filteredCfProjs.map(proj => {
                          const projNet = proj.monthly.reduce((s,m)=>s+m.inflow-m.outflow,0);
                          return (
                            <button key={proj.id} onClick={() => { setCfItemId(proj.id); setCfSearch(""); setCfDropOpen(false); }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] hover:bg-gray-50 ${cfItemId === proj.id ? "bg-gray-50 font-semibold text-gray-800" : "text-gray-600"}`}>
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: proj.color }}/>
                              <span className="flex-1 text-left">{proj.name}</span>
                              <span className={`text-[11px] font-medium ${projNet >= 0 ? "text-emerald-600" : "text-red-500"}`}>{projNet>=0?"+":""}{fmt(projNet)} ròng</span>
                              {cfItemId === proj.id && <span className="text-emerald-500 ml-1">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {selectedCfProj && (
                    <div className="rounded-xl border px-3 py-2 flex items-center gap-3" style={{ borderColor: selectedCfProj.color + "44", backgroundColor: selectedCfProj.color + "0a" }}>
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedCfProj.color }}/>
                      <span className="text-[12px] font-semibold text-gray-700 flex-1">{selectedCfProj.name}</span>
                      <span className={`text-[11px] font-bold ${netCF >= 0 ? "text-emerald-600" : "text-red-600"}`}>{netCF>=0?"+":""}{fmt(netCF)} ròng</span>
                    </div>
                  )}
                  {!selectedCfProj && <div className="text-[11px] text-gray-400 px-1">Đang hiển thị: <span className="font-medium text-gray-600">Tất cả dự án</span> — {cashflowProjects.length} dự án</div>}
                </div>
              ))()}

              {/* KPIs */}
              <div className="grid grid-cols-2 gap-2.5">
                <div
                  className={`rounded-xl p-3 text-white shadow-sm ${!selectedCfProj ? "bg-gradient-to-br from-cyan-500 to-teal-600" : ""}`}
                  style={selectedCfProj ? { background: `linear-gradient(135deg, ${selectedCfProj.color}cc, ${selectedCfProj.color})` } : undefined}>
                  <p className="text-[9px] font-semibold uppercase tracking-widest opacity-80">{selectedCfProj ? selectedCfProj.name : "CF ròng"}</p>
                  <p className="text-[22px] font-bold mt-0.5 leading-tight">{netCF>=0?"+":""}{fmt(netCF)}</p>
                  <p className="text-[10px] opacity-80 mt-1">{selectedCfProj ? `Inflow: ${fmt(totalIn)}` : `Số dư: ${fmt(financialData.cashFlow.cashBalance)}`}</p>
                </div>
                <div className="grid grid-rows-2 gap-2">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-2.5">
                    <p className="text-[9px] text-emerald-600 font-semibold uppercase tracking-wide">Tổng inflow</p>
                    <p className="text-[14px] font-bold text-emerald-700">+{fmt(totalIn)}</p>
                  </div>
                  <div className="rounded-xl bg-red-50 border border-red-100 p-2.5">
                    <p className="text-[9px] text-red-500 font-semibold uppercase tracking-wide">Tổng outflow</p>
                    <p className="text-[14px] font-bold text-red-600">-{fmt(totalOut)}</p>
                  </div>
                </div>
              </div>
              {/* CF type breakdown */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "CF hoạt động", val: financialData.cashFlow.operatingCF },
                  { label: "CF đầu tư", val: financialData.cashFlow.investingCF },
                  { label: "CF tài chính", val: financialData.cashFlow.financingCF },
                  { label: "CF ròng", val: financialData.cashFlow.netCF },
                ].map((item,i)=>(
                  <div key={i} className={`rounded-xl p-2.5 border ${item.val>=0?"bg-emerald-50 border-emerald-100":"bg-red-50 border-red-100"}`}>
                    <p className={`text-[9px] mb-0.5 font-medium uppercase tracking-wide ${item.val>=0?"text-emerald-600":"text-red-600"}`}>{item.label}</p>
                    <p className={`text-[14px] font-bold ${item.val>=0?"text-emerald-700":"text-red-700"}`}>{item.val>=0?"+":""}{fmt(item.val)}</p>
                  </div>
                ))}
              </div>
              {/* Chart: inflow vs outflow bars */}
              <div className="rounded-xl border border-gray-100 bg-white p-3">
                <h3 className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-3">Biểu đồ · Inflow vs Outflow</h3>
                <div className="overflow-x-auto">
                  <svg width={Math.max(280,cfData.length*50)} height="120" className="overflow-visible">
                    {[0.25,0.5,0.75,1].map((pct,i)=>(
                      <line key={i} x1="0" y1={90-pct*80} x2="100%" y2={90-pct*80} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="3,3"/>
                    ))}
                    {cfData.map((d,i)=>{
                      const bw=18; const gp=4; const x=i*50+4;
                      const iH=Math.round(d.inflow/maxVal*80); const oH=Math.round(d.outflow/maxVal*80);
                      return(
                        <g key={i}>
                          <rect x={x} y={90-iH} width={bw} height={iH} fill="#34d399" rx="3" opacity="0.9"/>
                          <rect x={x+bw+gp} y={90-oH} width={bw} height={oH} fill="#f87171" rx="3" opacity="0.9"/>
                          <text x={x+bw+gp/2} y={108} textAnchor="middle" fontSize="9" fill="#9ca3af">{d.label}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-2.5 rounded bg-emerald-400"/><span className="text-[10px] text-gray-500">Inflow</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-2.5 rounded bg-red-400"/><span className="text-[10px] text-gray-500">Outflow</span></div>
                </div>
              </div>
              {/* Detail table */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-4 px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Kỳ</span>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase text-right">Inflow</span>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase text-right">Outflow</span>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase text-right">Ròng</span>
                </div>
                {cfData.map((d,i)=>{
                  const net=d.inflow-d.outflow;
                  return(
                    <div key={i} className={`grid grid-cols-4 px-3 py-2 ${i<cfData.length-1?"border-b border-gray-50":""} hover:bg-gray-50/60`}>
                      <span className="text-[12px] font-medium text-gray-700">{d.label}</span>
                      <span className="text-[12px] font-bold text-emerald-600 text-right">+{fmt(d.inflow)}</span>
                      <span className="text-[12px] font-bold text-red-500 text-right">-{fmt(d.outflow)}</span>
                      <span className={`text-[11px] font-bold text-right ${net>=0?"text-cyan-600":"text-red-600"}`}>{net>=0?"+":""}{fmt(net)}</span>
                    </div>
                  );
                })}
                <div className="grid grid-cols-4 px-3 py-2 bg-cyan-50 border-t border-cyan-100">
                  <span className="text-[11px] font-bold text-cyan-700">Tổng</span>
                  <span className="text-[11px] font-bold text-emerald-600 text-right">+{fmt(totalIn)}</span>
                  <span className="text-[11px] font-bold text-red-500 text-right">-{fmt(totalOut)}</span>
                  <span className={`text-[11px] font-bold text-right ${netCF>=0?"text-cyan-700":"text-red-700"}`}>{netCF>=0?"+":""}{fmt(netCF)}</span>
                </div>
              </div>

              {/* Action bar */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => { setModal("add-cashflow"); setFormData({ type: "inflow" }); }}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-white text-[12px] font-semibold hover:bg-cyan-600 transition-all flex items-center justify-center gap-1.5 shadow-sm">
                  <Plus className="w-3.5 h-3.5" /> Ghi nhận giao dịch
                </button>
                <button onClick={() => toast.info("Đang tải lịch sử giao dịch...", { description: "Xuất sao kê từ ngân hàng..." })}
                  className="py-2.5 px-3.5 rounded-xl bg-gray-100 text-gray-600 text-[12px] font-medium hover:bg-gray-200 transition-all">
                  Sao kê
                </button>
              </div>
            </>
          );
        })()}

        {/* Tab 4: Công nợ */}
        {activeTab === 4 && (() => {
          const isAR = debtSubTab === "receivable";
          const items = isAR ? financialData.receivables.items : financialData.payables.items;
          const total = isAR ? financialData.receivables.total : financialData.payables.total;
          const overdueTotal = isAR ? financialData.receivables.overdue : financialData.payables.overdue;
          const selectedDebt = selectedDebtId ? items.find(x => x.id === selectedDebtId) : null;

          // Detail view
          if (selectedDebt) {
            return (
              <div className="space-y-4">
                {/* Back button */}
                <button onClick={() => setSelectedDebtId(null)}
                  className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-700 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {isAR ? "Công nợ phải thu" : "Công nợ phải trả"}
                </button>

                {/* Status banner */}
                <div className={`rounded-xl p-4 border ${selectedDebt.daysOverdue > 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedDebt.daysOverdue > 0 ? "text-red-500" : "text-emerald-600"}`}>
                      {selectedDebt.daysOverdue > 0 ? `⚠️ Quá hạn ${selectedDebt.daysOverdue} ngày` : "✓ Trong hạn"}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isAR ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                      {isAR ? "Phải thu (AR)" : "Phải trả (AP)"}
                    </span>
                  </div>
                  <p className={`text-[24px] font-bold ${selectedDebt.daysOverdue > 0 ? "text-red-700" : "text-emerald-700"}`}>
                    {fmt(selectedDebt.amount)}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{selectedDebt.invoiceNo} · {selectedDebt.category}</p>
                </div>

                {/* Info grid */}
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  {[
                    { label: "Đối tác", value: selectedDebt.party },
                    { label: "Số hóa đơn", value: selectedDebt.invoiceNo },
                    { label: "Danh mục", value: selectedDebt.category },
                    { label: "Ngày tạo", value: selectedDebt.createdDate },
                    { label: "Đến hạn", value: selectedDebt.dueDate, highlight: selectedDebt.daysOverdue > 0 },
                    { label: "Người liên hệ", value: selectedDebt.contact },
                    { label: "Điện thoại", value: selectedDebt.phone },
                  ].map((row, i, arr) => (
                    <div key={i} className={`flex items-center justify-between px-3.5 py-2.5 ${i < arr.length - 1 ? "border-b border-gray-50" : ""}`}>
                      <span className="text-[11px] text-gray-400">{row.label}</span>
                      <span className={`text-[12px] font-medium ${row.highlight ? "text-red-600 font-bold" : "text-gray-800"}`}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Note */}
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-3">
                  <p className="text-[10px] font-semibold text-amber-600 uppercase mb-1">Ghi chú</p>
                  <p className="text-[12px] text-gray-700">{selectedDebt.note}</p>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Lịch sử xử lý</h3>
                  <div className="relative pl-4">
                    <div className="absolute left-1.5 top-0 bottom-0 w-px bg-gray-200" />
                    {selectedDebt.history.map((h, i) => (
                      <div key={i} className="relative mb-3 last:mb-0">
                        <div className="absolute -left-3 top-1 w-2 h-2 rounded-full bg-white border-2 border-gray-400" />
                        <div className="bg-gray-50 rounded-lg px-3 py-2 ml-1">
                          <div className="flex items-center justify-between">
                            <p className="text-[12px] font-medium text-gray-800">{h.action}</p>
                            <span className="text-[10px] text-gray-400">{h.date}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">Bởi: {h.by}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {isAR ? (
                    <>
                      <button onClick={() => toast.success(`Đã xác nhận thu từ ${selectedDebt.party}`, { description: `${fmt(selectedDebt.amount)} · ${selectedDebt.invoiceNo}` })}
                        className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 transition-all">Xác nhận đã thu</button>
                      <button onClick={() => toast.info(`Đã gửi nhắc nợ tới ${selectedDebt.party}`, { description: `Email nhắc thanh toán đã được gửi tới ${selectedDebt.contact}` })}
                        className="flex-1 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[12px] font-medium hover:bg-amber-100 transition-all">Gửi nhắc nợ</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setModal("add-cashflow"); setFormData({ type: "outflow", description: `Thanh toán ${selectedDebt.invoiceNo} — ${selectedDebt.party}`, amount: String(selectedDebt.amount) }); }}
                        className="flex-1 py-2 rounded-xl bg-blue-500 text-white text-[12px] font-semibold hover:bg-blue-600 transition-all">Tạo lệnh thanh toán</button>
                      <button onClick={() => toast.info("Đã gửi yêu cầu gia hạn", { description: `Chờ xác nhận từ ${selectedDebt.party}` })}
                        className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 text-[12px] font-medium hover:bg-gray-200 transition-all">Yêu cầu gia hạn</button>
                    </>
                  )}
                </div>
              </div>
            );
          }

          // List view
          return (
            <>
              {/* Sub-tab toggle */}
              <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
                <button onClick={() => { setDebtSubTab("receivable"); setSelectedDebtId(null); }}
                  className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all ${debtSubTab === "receivable" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  Phải thu (AR)
                </button>
                <button onClick={() => { setDebtSubTab("payable"); setSelectedDebtId(null); }}
                  className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all ${debtSubTab === "payable" ? "bg-white text-red-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  Phải trả (AP)
                </button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className={`rounded-xl p-3 text-white shadow-sm ${isAR ? "bg-gradient-to-br from-emerald-500 to-emerald-600" : "bg-gradient-to-br from-red-500 to-rose-600"}`}>
                  <p className="text-[9px] font-semibold uppercase tracking-widest opacity-80">Tổng {isAR ? "phải thu" : "phải trả"}</p>
                  <p className="text-[20px] font-bold mt-0.5">{fmt(total)}</p>
                  <p className="text-[10px] opacity-80 mt-1">{items.length} khoản công nợ</p>
                </div>
                <div className="grid grid-rows-2 gap-2">
                  <div className="rounded-xl bg-red-50 border border-red-100 p-2.5">
                    <p className="text-[9px] text-red-500 font-semibold uppercase tracking-wide">Quá hạn</p>
                    <p className="text-[14px] font-bold text-red-600">{fmt(overdueTotal)}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-2.5">
                    <p className="text-[9px] text-amber-600 font-semibold uppercase tracking-wide">Số khoản QH</p>
                    <p className="text-[14px] font-bold text-amber-700">{items.filter(x=>x.daysOverdue>0).length} khoản</p>
                  </div>
                </div>
              </div>

              {/* List — split overdue / on-time */}
              {(() => {
                const overdueItems = items.filter(x => x.daysOverdue > 0).sort((a, b) => b.daysOverdue - a.daysOverdue);
                const onTimeItems  = items.filter(x => x.daysOverdue <= 0);
                const renderItem = (item: typeof items[0]) => (
                  <button key={item.id} onClick={() => setSelectedDebtId(item.id)}
                    className={`w-full text-left rounded-xl border px-3.5 py-3 hover:shadow-sm transition-all group ${item.daysOverdue > 0 ? "bg-red-50 border-red-200 hover:border-red-400" : "bg-white border-gray-100 hover:border-emerald-300"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-800 truncate">{item.party}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{item.invoiceNo} · {item.category}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Đến hạn: {item.dueDate}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[14px] font-bold text-gray-800">{fmt(item.amount)}</p>
                        {item.daysOverdue > 0 ? (
                          <span className="text-[10px] text-red-600 font-semibold">Quá hạn {item.daysOverdue} ngày</span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-medium">Trong hạn</span>
                        )}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 self-center shrink-0 ml-1 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                );
                return (
                  <>
                    {overdueItems.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">⚠ Quá hạn</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">{overdueItems.length}</span>
                          <span className="text-[10px] text-red-400">· {fmt(overdueItems.reduce((s, x) => s + x.amount, 0))}</span>
                        </div>
                        <div className="space-y-2">{overdueItems.map(renderItem)}</div>
                      </div>
                    )}
                    {onTimeItems.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">✓ Trong hạn</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">{onTimeItems.length}</span>
                          <span className="text-[10px] text-emerald-400">· {fmt(onTimeItems.reduce((s, x) => s + x.amount, 0))}</span>
                        </div>
                        <div className="space-y-2">{onTimeItems.map(renderItem)}</div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Action bar */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => { setModal("add-debt"); setFormData({ type: debtSubTab }); }}
                  className="flex-1 py-2.5 rounded-xl bg-violet-500 text-white text-[12px] font-semibold hover:bg-violet-600 transition-all flex items-center justify-center gap-1.5 shadow-sm">
                  <Plus className="w-3.5 h-3.5" /> Tạo công nợ mới
                </button>
                <button onClick={() => { setModal("add-invoice"); setFormData({ invoiceType: isAR ? "thu" : "chi" }); }}
                  className="py-2.5 px-3.5 rounded-xl bg-gray-100 text-gray-600 text-[12px] font-medium hover:bg-gray-200 transition-all">
                  Xuất HĐ
                </button>
              </div>
            </>
          );
        })()}

        {/* Tab 5: Thuế */}
        {activeTab === 5 && (
          <>
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 mb-1">
              <p className="text-[10px] text-blue-600 mb-1 font-medium uppercase tracking-wide">Đã nộp thuế YTD</p>
              <p className="text-[22px] font-bold text-blue-700">{fmt(financialData.tax.ytdPaid)}</p>
            </div>
            <div className="space-y-3">
              {[
                { label: "Thuế GTGT (VAT)", ...financialData.tax.vat },
                { label: "Thuế TNDN", ...financialData.tax.corporateTax },
                { label: "Thuế TNCN", ...financialData.tax.personalIncomeTax },
              ].map((item, i) => {
                const days = daysUntil(item.dueDate);
                return (
                  <div key={i} className="rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-semibold text-gray-800">{item.label}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Kỳ: {item.period} · Hạn: {item.dueDate}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${days <= 7 ? "bg-red-100 text-red-600" : days <= 30 ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-600"}`}>
                        {days} ngày
                      </span>
                    </div>
                    <p className="text-[16px] font-bold text-gray-800 mt-2">{fmt(item.amount)}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Tab 6: Báo cáo thuế */}
        {activeTab === 6 && (() => {
          const reports  = financialData.tax.reports;
          const payments = financialData.tax.payments;
          const recon    = financialData.tax.reconciliation;
          const debts    = financialData.tax.debts;

          // ── Report detail view ──
          const selectedReport = selectedTaxIdx !== null ? reports[selectedTaxIdx] : null;
          if (selectedReport) {
            const sc = taxStatusConfig[selectedReport.status] || taxStatusConfig.pending;
            const isPending = selectedReport.status === "pending";
            const r = selectedReport as typeof selectedReport & {
              submittedDate?: string; receiptNo?: string; paidDate?: string;
              invoiceSold?: number; invoicePurchased?: number; taxRate?: number; employeeCount?: number;
            };
            return (
              <div className="space-y-4">
                {/* Back */}
                <button onClick={() => setSelectedTaxIdx(null)}
                  className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-700 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Báo cáo thuế
                </button>

                {/* Status banner */}
                <div className={`rounded-xl p-4 border ${isPending ? "bg-amber-50 border-amber-200" : selectedReport.status === "paid" ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isPending ? "text-amber-600" : selectedReport.status === "paid" ? "text-emerald-600" : "text-blue-600"}`}>
                      {selectedReport.type} · {selectedReport.period}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${sc.bg} ${sc.color}`}>{sc.label}</span>
                  </div>
                  {sc.step && (
                    <p className={`text-[10px] font-medium mb-1 ${isPending ? "text-amber-500" : selectedReport.status === "paid" ? "text-emerald-500" : "text-blue-500"}`}>
                      {sc.step}
                    </p>
                  )}
                  <p className={`text-[26px] font-bold ${isPending ? "text-amber-700" : selectedReport.status === "paid" ? "text-emerald-700" : "text-blue-700"}`}>
                    {fmt(selectedReport.amount)}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">Hạn nộp: <span className="font-semibold">{selectedReport.deadline}</span></p>
                </div>

                {/* Info grid */}
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  {([
                    { label: "Loại thuế", value: selectedReport.type === "VAT" ? "Thuế GTGT (VAT)" : selectedReport.type === "TNDN" ? "Thuế Thu nhập doanh nghiệp" : "Thuế Thu nhập cá nhân" },
                    { label: "Kỳ tính thuế", value: selectedReport.period },
                    { label: "Người lập", value: selectedReport.preparedBy },
                    { label: "Cơ quan thuế", value: selectedReport.taxAuthority },
                    { label: "Mã số thuế", value: selectedReport.taxCode },
                    ...( r.taxRate ? [{ label: "Thuế suất", value: r.taxRate + "%" }] : []),
                    ...( r.invoiceSold !== undefined ? [{ label: "HĐ bán ra / mua vào", value: `${r.invoiceSold} / ${r.invoicePurchased}` }] : []),
                    ...( r.employeeCount ? [{ label: "Nhân viên chịu thuế", value: `${r.employeeCount} người` }] : []),
                    ...( r.submittedDate ? [{ label: "Ngày nộp tờ khai", value: r.submittedDate }] : []),
                    ...( r.receiptNo ? [{ label: "Mã biên nhận eTax", value: r.receiptNo }] : []),
                    ...( r.paidDate ? [{ label: "Ngày nộp thuế", value: r.paidDate, highlight: true }] : []),
                  ] as { label: string; value: string; highlight?: boolean }[]).map((row, i, arr) => (
                    <div key={i} className={`flex items-center justify-between px-3.5 py-2.5 ${i < arr.length - 1 ? "border-b border-gray-50" : ""}`}>
                      <span className="text-[11px] text-gray-400">{row.label}</span>
                      <span className={`text-[12px] font-medium ${row.highlight ? "text-emerald-600 font-bold" : "text-gray-800"}`}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Breakdown table */}
                <div>
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Chi tiết tính thuế</h3>
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-3 px-3.5 py-2 bg-gray-50 border-b border-gray-100">
                      <span className="col-span-2 text-[10px] font-semibold text-gray-400 uppercase">Chỉ tiêu</span>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase text-right">Số tiền</span>
                    </div>
                    {selectedReport.breakdown.map((row, i) => (
                      <div key={i} className={`grid grid-cols-3 px-3.5 py-2.5 ${i < selectedReport.breakdown.length - 1 ? "border-b border-gray-50" : ""} ${(row as typeof row & { highlight?: boolean }).highlight ? "bg-amber-50" : ""}`}>
                        <span className={`col-span-2 text-[12px] ${(row as typeof row & { highlight?: boolean }).highlight ? "font-bold text-gray-800" : "text-gray-600"}`}>{row.label}</span>
                        <span className={`text-[12px] text-right font-mono ${(row as typeof row & { highlight?: boolean }).highlight ? "font-bold text-amber-700" : "text-gray-700"}`}>{row.tax}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* VAT invoice breakdown */}
                {selectedReport.type === "VAT" && (() => {
                  const rep = selectedReport as typeof selectedReport & {
                    outputInvoices?: { no: string; date: string; buyer: string; revenue: number; vat: number; isSummary?: boolean }[];
                    inputInvoices?: { no: string; date: string; supplier: string; amount: number; vat: number; deductible: boolean; reason?: string; isSummary?: boolean }[];
                  };
                  if (!rep.outputInvoices) return null;
                  const totalOutput = rep.outputInvoices.reduce((s, x) => s + x.vat, 0);
                  const deductibleList = (rep.inputInvoices || []).filter(x => x.deductible);
                  const nonDeductible = (rep.inputInvoices || []).filter(x => !x.deductible);
                  const totalInput = deductibleList.reduce((s, x) => s + x.vat, 0);
                  return (
                    <div>
                      <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Hóa đơn đầu ra / đầu vào</h3>
                      {/* Tab selector */}
                      <div className="flex gap-1 mb-3 bg-gray-100 p-1 rounded-xl">
                        <button onClick={() => setVatInvoiceTab("output")}
                          className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${vatInvoiceTab === "output" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                          Đầu ra · <span className="font-bold">{fmt(totalOutput)}</span>
                        </button>
                        <button onClick={() => setVatInvoiceTab("input")}
                          className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${vatInvoiceTab === "input" ? "bg-white shadow-sm text-orange-600" : "text-gray-500 hover:text-gray-700"}`}>
                          Đầu vào KT · <span className="font-bold">-{fmt(totalInput)}</span>
                        </button>
                      </div>

                      {vatInvoiceTab === "output" && (
                        <div className="rounded-xl border border-gray-100 overflow-hidden">
                          <div className="grid grid-cols-12 px-3 py-2 bg-blue-50 border-b border-blue-100">
                            <span className="col-span-2 text-[9px] font-bold text-blue-400 uppercase">Số HĐ</span>
                            <span className="col-span-2 text-[9px] font-bold text-blue-400 uppercase">Ngày</span>
                            <span className="col-span-4 text-[9px] font-bold text-blue-400 uppercase">Khách hàng</span>
                            <span className="col-span-2 text-[9px] font-bold text-blue-400 uppercase text-right">Doanh thu</span>
                            <span className="col-span-2 text-[9px] font-bold text-blue-400 uppercase text-right">Thuế 10%</span>
                          </div>
                          {rep.outputInvoices!.map((inv, i) => (
                            <div key={i} className={`grid grid-cols-12 px-3 py-2.5 items-center ${i < rep.outputInvoices!.length - 1 ? "border-b border-gray-50" : ""} ${inv.isSummary ? "bg-blue-50/60" : "hover:bg-gray-50/80"}`}>
                              <span className={`col-span-2 font-mono text-[10px] ${inv.isSummary ? "text-blue-500 font-semibold" : "text-gray-400"}`}>{inv.isSummary ? "" : inv.no}</span>
                              <span className="col-span-2 text-[10px] text-gray-400">{inv.date}</span>
                              <span className={`col-span-4 text-[11px] ${inv.isSummary ? "text-blue-600 font-semibold italic" : "text-gray-700"}`}>{inv.isSummary ? inv.no : inv.buyer}</span>
                              <span className={`col-span-2 text-[10px] font-mono text-right ${inv.isSummary ? "text-blue-600 font-semibold" : "text-gray-500"}`}>{fmtShort(inv.revenue)}</span>
                              <span className={`col-span-2 text-[11px] font-mono font-bold text-right ${inv.isSummary ? "text-blue-700" : "text-blue-600"}`}>+{fmtShort(inv.vat)}</span>
                            </div>
                          ))}
                          <div className="grid grid-cols-12 px-3 py-2.5 bg-blue-100 border-t border-blue-200">
                            <span className="col-span-8 text-[11px] font-bold text-blue-700">Tổng thuế đầu ra</span>
                            <span className="col-span-2 text-[10px] font-semibold text-right text-blue-600">{fmtShort(rep.outputInvoices!.reduce((s,x)=>s+x.revenue,0))}</span>
                            <span className="col-span-2 text-[12px] font-bold text-right text-blue-800">+{fmt(totalOutput)}</span>
                          </div>
                        </div>
                      )}

                      {vatInvoiceTab === "input" && (
                        <div className="space-y-3">
                          <div className="rounded-xl border border-gray-100 overflow-hidden">
                            <div className="grid grid-cols-12 px-3 py-2 bg-orange-50 border-b border-orange-100">
                              <span className="col-span-2 text-[9px] font-bold text-orange-400 uppercase">Số HĐ</span>
                              <span className="col-span-2 text-[9px] font-bold text-orange-400 uppercase">Ngày</span>
                              <span className="col-span-4 text-[9px] font-bold text-orange-400 uppercase">Nhà cung cấp</span>
                              <span className="col-span-2 text-[9px] font-bold text-orange-400 uppercase text-right">Giá trị</span>
                              <span className="col-span-2 text-[9px] font-bold text-orange-400 uppercase text-right">Được KT</span>
                            </div>
                            {deductibleList.map((inv, i) => (
                              <div key={i} className={`grid grid-cols-12 px-3 py-2.5 items-center ${i < deductibleList.length - 1 ? "border-b border-gray-50" : ""} ${inv.isSummary ? "bg-orange-50/60" : "hover:bg-gray-50/80"}`}>
                                <span className={`col-span-2 font-mono text-[10px] ${inv.isSummary ? "text-orange-500" : "text-gray-400"}`}>{inv.isSummary ? "" : inv.no}</span>
                                <span className="col-span-2 text-[10px] text-gray-400">{inv.date}</span>
                                <span className={`col-span-4 text-[11px] ${inv.isSummary ? "text-orange-600 font-semibold italic" : "text-gray-700"}`}>{inv.isSummary ? inv.no : inv.supplier}</span>
                                <span className={`col-span-2 text-[10px] font-mono text-right ${inv.isSummary ? "text-orange-600 font-semibold" : "text-gray-500"}`}>{fmtShort(inv.amount)}</span>
                                <span className={`col-span-2 text-[11px] font-mono font-bold text-right ${inv.isSummary ? "text-orange-700" : "text-orange-600"}`}>-{fmtShort(inv.vat)}</span>
                              </div>
                            ))}
                            <div className="grid grid-cols-12 px-3 py-2.5 bg-orange-100 border-t border-orange-200">
                              <span className="col-span-10 text-[11px] font-bold text-orange-700">Tổng đầu vào được khấu trừ</span>
                              <span className="col-span-2 text-[12px] font-bold text-right text-orange-800">-{fmt(totalInput)}</span>
                            </div>
                          </div>

                          {nonDeductible.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Không được khấu trừ ({nonDeductible.length} hóa đơn)</p>
                              <div className="rounded-xl border border-red-100 overflow-hidden bg-red-50/30">
                                {nonDeductible.map((inv, i) => (
                                  <div key={i} className={`px-3 py-2.5 ${i < nonDeductible.length - 1 ? "border-b border-red-50" : ""}`}>
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="shrink-0 font-mono text-[10px] text-gray-400">{inv.no}</span>
                                        <span className="text-[11px] text-gray-700 truncate">{inv.supplier}</span>
                                      </div>
                                      <span className="shrink-0 text-[11px] font-mono text-gray-500">{fmtShort(inv.amount)}</span>
                                    </div>
                                    {inv.reason && <p className="text-[10px] text-red-400 mt-0.5 italic">{inv.reason}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Timeline */}
                <div>
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Lịch sử xử lý</h3>
                  <div className="relative pl-4">
                    <div className="absolute left-1.5 top-0 bottom-0 w-px bg-gray-200" />
                    {selectedReport.history.map((h, i) => (
                      <div key={i} className="relative mb-3 last:mb-0">
                        <div className={`absolute -left-3 top-1 w-2 h-2 rounded-full border-2 ${i === selectedReport.history.length - 1 ? "bg-emerald-400 border-emerald-400" : "bg-white border-gray-400"}`} />
                        <div className="bg-gray-50 rounded-lg px-3 py-2 ml-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[12px] font-medium text-gray-800">{h.action}</p>
                            <span className="text-[10px] text-gray-400 shrink-0">{h.date}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">Bởi: {h.by}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {isPending ? (
                    <>
                      <button onClick={() => { toast.success(`Đã nộp ${selectedReport.name}`, { description: `${fmt(selectedReport.amount)} · Đang chờ xác nhận từ cơ quan thuế` }); setSelectedTaxIdx(null); }}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 transition-all">
                        Nộp tờ khai eTax
                      </button>
                      <button onClick={() => toast.info("Đã gửi cho kế toán trưởng", { description: "Phạm Lan sẽ kiểm tra và ký duyệt trước khi nộp" })}
                        className="flex-1 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-[12px] font-medium hover:bg-blue-100 transition-all">
                        Gửi kế toán trưởng
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => toast.info("Đang tạo file PDF...", { description: "Tờ khai sẽ được tải về ngay" })}
                        className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-[12px] font-medium hover:bg-gray-200 transition-all">
                        Tải PDF
                      </button>
                      <button onClick={() => toast.info("Đang xuất file XML...", { description: "Định dạng chuẩn Tổng cục Thuế" })}
                        className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-[12px] font-medium hover:bg-gray-200 transition-all">
                        Xuất XML
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          }

          // ── Payment detail view ──
          const selectedPayment = selectedPaymentId ? payments.find(p => p.id === selectedPaymentId) : null;
          if (selectedPayment) {
            const isPaid = selectedPayment.status === "paid";
            return (
              <div className="space-y-4">
                <button onClick={() => setSelectedPaymentId(null)}
                  className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-700 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Nộp thuế
                </button>
                <div className={`rounded-xl p-4 border ${isPaid ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isPaid ? "text-emerald-600" : "text-amber-600"}`}>
                      {selectedPayment.type} · Kỳ {selectedPayment.period}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {isPaid ? "Đã nộp đủ" : "Chưa nộp"}
                    </span>
                  </div>
                  <p className={`text-[26px] font-bold ${isPaid ? "text-emerald-700" : "text-amber-700"}`}>{fmt(selectedPayment.dueAmount)}</p>
                  {isPaid && selectedPayment.installments.length > 1 && (
                    <p className="text-[10px] text-emerald-600 mt-1 font-medium">{selectedPayment.installments.length} lần nộp</p>
                  )}
                </div>

                <div>
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    {isPaid ? "Lịch sử nộp thuế" : "Chưa có lần nộp nào"}
                  </h3>
                  {selectedPayment.installments.length === 0 ? (
                    <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-6 text-center">
                      <p className="text-[12px] text-amber-600 font-medium">Chưa có lần nộp nào được ghi nhận</p>
                      <p className="text-[11px] text-amber-400 mt-1">Tạo lệnh nộp thuế để bắt đầu</p>
                    </div>
                  ) : (
                    <div className="relative pl-4">
                      <div className="absolute left-1.5 top-0 bottom-0 w-px bg-emerald-200" />
                      {selectedPayment.installments.map((inst, i) => (
                        <div key={i} className="relative mb-3 last:mb-0">
                          <div className="absolute -left-3 top-1.5 w-2 h-2 rounded-full bg-emerald-400 border-2 border-emerald-400" />
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-3 ml-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[12px] font-bold text-emerald-700">{fmt(inst.amount)}</span>
                              <span className="text-[10px] text-gray-400">{inst.date}</span>
                            </div>
                            <p className="text-[11px] text-gray-600">{inst.note}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-[10px] text-gray-400">🏦 {inst.bank}</span>
                              <span className="text-[10px] text-gray-400 font-mono">Ref: {inst.ref}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {selectedPayment.installments.length > 1 && (
                        <div className="ml-1 mt-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 flex justify-between">
                          <span className="text-[11px] font-semibold text-gray-600">Tổng đã nộp</span>
                          <span className="text-[12px] font-bold text-emerald-700">{fmt(selectedPayment.totalPaid)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {!isPaid ? (
                    <button onClick={() => { setModal("add-cashflow"); setFormData({ type: "outflow", description: `Nộp thuế ${selectedPayment.name}`, amount: String(selectedPayment.dueAmount) }); }}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-[12px] font-semibold hover:bg-amber-600 transition-all">
                      Tạo lệnh nộp thuế
                    </button>
                  ) : (
                    <button onClick={() => toast.info("Đang tải chứng từ nộp thuế...")}
                      className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-[12px] font-medium hover:bg-gray-200 transition-all">
                      Tải chứng từ
                    </button>
                  )}
                </div>
              </div>
            );
          }

          // ── Debt detail view ──
          const selectedDebtTax = selectedDebtTaxId ? debts.find(d => d.id === selectedDebtTaxId) : null;
          if (selectedDebtTax) {
            const isPayable = selectedDebtTax.kind === "payable";
            return (
              <div className="space-y-4">
                <button onClick={() => setSelectedDebtTaxId(null)}
                  className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-700 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Công nợ thuế
                </button>
                <div className={`rounded-xl p-4 border ${isPayable ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isPayable ? "text-red-500" : "text-emerald-600"}`}>
                      {selectedDebtTax.type} · {isPayable ? "CÒN THIẾU" : "NỘP THỪA"}
                    </span>
                    {selectedDebtTax.daysOverdue > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">Quá hạn {selectedDebtTax.daysOverdue} ngày</span>
                    )}
                    {selectedDebtTax.kind === "refundable" && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">Đang xử lý hoàn thuế</span>
                    )}
                  </div>
                  <p className={`text-[26px] font-bold ${isPayable ? "text-red-700" : "text-emerald-700"}`}>
                    {isPayable ? "-" : "+"}{fmt(Math.abs(selectedDebtTax.amount))}
                  </p>
                  {selectedDebtTax.deadline !== "—" && (
                    <p className="text-[11px] text-gray-500 mt-1">Hạn nộp: <span className="font-semibold text-red-600">{selectedDebtTax.deadline}</span></p>
                  )}
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-3">
                  <p className="text-[10px] font-semibold text-amber-600 uppercase mb-1">Nguyên nhân</p>
                  <p className="text-[12px] text-gray-700">{selectedDebtTax.note}</p>
                </div>
                <div>
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Lịch sử xử lý</h3>
                  <div className="relative pl-4">
                    <div className="absolute left-1.5 top-0 bottom-0 w-px bg-gray-200" />
                    {selectedDebtTax.history.map((h, i) => (
                      <div key={i} className="relative mb-3 last:mb-0">
                        <div className={`absolute -left-3 top-1 w-2 h-2 rounded-full border-2 ${i === selectedDebtTax.history.length - 1 ? "bg-blue-400 border-blue-400" : "bg-white border-gray-400"}`} />
                        <div className="bg-gray-50 rounded-lg px-3 py-2 ml-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[12px] font-medium text-gray-800">{h.action}</p>
                            <span className="text-[10px] text-gray-400 shrink-0">{h.date}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">Bởi: {h.by}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  {isPayable ? (
                    <>
                      <button onClick={() => { setModal("add-cashflow"); setFormData({ type: "outflow", description: selectedDebtTax.name, amount: String(selectedDebtTax.amount) }); }}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[12px] font-semibold hover:bg-red-600 transition-all">
                        Tạo lệnh nộp thuế
                      </button>
                      <button onClick={() => toast.info("Đã gửi nhắc nhở", { description: "Thông báo nộp thuế đã được gửi tới CFO" })}
                        className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-[12px] font-medium hover:bg-gray-200 transition-all">
                        Báo cáo lãnh đạo
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => toast.info("Đang chuẩn bị hồ sơ hoàn thuế...", { description: "Theo dõi tiến trình tại cổng eTax" })}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 transition-all">
                        Theo dõi hoàn thuế
                      </button>
                      <button onClick={() => toast.info("Đang tải hồ sơ hoàn thuế...")}
                        className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-[12px] font-medium hover:bg-gray-200 transition-all">
                        Tải hồ sơ
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          }

          // ── Main 3-section view ──
          const sectionTabs = [
            { key: "reports"  as const, label: "Báo cáo thuế", icon: "📋" },
            { key: "payments" as const, label: "Nộp thuế",     icon: "💳" },
            { key: "debt"     as const, label: "Công nợ thuế", icon: "⚖️" },
          ];

          return (
            <div className="space-y-3">
              {/* 3 main section tabs */}
              <div className="grid grid-cols-3 gap-1.5">
                {sectionTabs.map(t => (
                  <button key={t.key} onClick={() => { setTaxSubTab(t.key); setSelectedTaxIdx(null); setSelectedDebtTaxId(null); setSelectedPaymentId(null); }}
                    className={`py-2 rounded-xl text-[11px] font-semibold border transition-all flex flex-col items-center gap-0.5 ${
                      taxSubTab === t.key
                        ? t.key === "reports"  ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                          : t.key === "payments" ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                          : "bg-red-500 text-white border-red-500 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}>
                    <span className="text-[14px]">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── Section 1: Báo cáo thuế ── */}
              {taxSubTab === "reports" && (
                <div className="space-y-2">
                  {/* Filter pills */}
                  <div className="flex gap-1.5 overflow-x-auto">
                    {(["all","pending","submitted","paid"] as const).map(f => {
                      const cnt = f === "all" ? reports.length : reports.filter(r => r.status === f).length;
                      const labels = { all: "Tất cả", pending: "Chưa nộp", submitted: "Đã nộp tờ khai", paid: "Hoàn thành" };
                      return (
                        <button key={f} onClick={() => setTaxReportFilter(f)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap border transition-all ${
                            taxReportFilter === f ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                          }`}>
                          {labels[f]} {cnt > 0 && <span className="opacity-75">({cnt})</span>}
                        </button>
                      );
                    })}
                  </div>
                  {(taxReportFilter === "all" ? [...reports] : reports.filter(r => r.status === taxReportFilter))
                    .map((report, i) => {
                      const originalIdx = reports.indexOf(report as typeof reports[0]);
                      const sc = taxStatusConfig[report.status] || taxStatusConfig.pending;
                      return (
                        <button key={i} onClick={() => setSelectedTaxIdx(originalIdx)}
                          className="w-full text-left rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-gray-800 truncate">{report.name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">Kỳ: {report.period} · Hạn: <span className={report.status === "pending" ? "text-amber-600 font-semibold" : "text-gray-500"}>{report.deadline}</span></p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <p className="text-[9px] text-gray-400 uppercase font-semibold">Phải nộp</p>
                                <p className="text-[15px] font-bold text-gray-800">{fmt(report.amount)}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${sc.bg} ${sc.color}`}>{sc.label}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition-all" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}

              {/* ── Section 2: Nộp thuế ── */}
              {taxSubTab === "payments" && (
                <div className="space-y-2">
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3 text-white shadow-sm">
                      <p className="text-[9px] font-semibold uppercase tracking-widest opacity-80">Đã nộp YTD</p>
                      <p className="text-[18px] font-bold mt-0.5">{fmt(payments.filter(p=>p.status==="paid").reduce((s,p)=>s+p.totalPaid,0))}</p>
                      <p className="text-[10px] opacity-80 mt-1">{payments.filter(p=>p.status==="paid").length} kỳ thuế</p>
                    </div>
                    <div className="rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 p-3 text-white shadow-sm">
                      <p className="text-[9px] font-semibold uppercase tracking-widest opacity-80">Chờ nộp</p>
                      <p className="text-[18px] font-bold mt-0.5">{fmt(payments.filter(p=>p.status==="pending").reduce((s,p)=>s+p.dueAmount,0))}</p>
                      <p className="text-[10px] opacity-80 mt-1">{payments.filter(p=>p.status==="pending").length} kỳ thuế</p>
                    </div>
                  </div>
                  {payments.map(p => (
                    <button key={p.id} onClick={() => setSelectedPaymentId(p.id)}
                      className={`w-full text-left rounded-xl border px-3.5 py-3 shadow-sm hover:shadow-md transition-all group ${p.status === "paid" ? "bg-white border-gray-100 hover:border-emerald-200" : "bg-amber-50 border-amber-100 hover:border-amber-300"}`}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <p className="text-[13px] font-semibold text-gray-800">{p.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Kỳ: {p.period}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {p.status === "paid" ? "Đã nộp đủ" : "Chờ nộp"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[12px] font-bold text-gray-800">{fmt(p.dueAmount)}</span>
                          {p.installments.length > 1 && (
                            <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded-full">{p.installments.length} lần nộp</span>
                          )}
                        </div>
                        {p.status === "paid" && p.installments[0] && (
                          <span className="text-[10px] text-gray-400">{p.installments[p.installments.length-1].date}</span>
                        )}
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-400 transition-all" />
                      </div>
                      {/* Mini payment bars */}
                      {p.installments.length > 1 && (
                        <div className="mt-2 flex gap-1">
                          {p.installments.map((inst, ii) => (
                            <div key={ii} className="flex-1 rounded bg-emerald-100 px-1.5 py-1">
                              <p className="text-[9px] text-emerald-600 font-semibold">{inst.date.slice(0,5)}</p>
                              <p className="text-[10px] font-bold text-emerald-700">{fmt(inst.amount)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Section 3: Công nợ thuế ── */}
              {taxSubTab === "debt" && (
                <div className="space-y-3">
                  {/* KPI summary */}
                  {(() => {
                    const allItems = recon.flatMap(r => r.items);
                    const totalDue  = allItems.reduce((s,x) => s + Math.max(0, x.dueAmount), 0);
                    const totalPaid = allItems.reduce((s,x) => s + x.paidAmount, 0);
                    const totalGap  = allItems.reduce((s,x) => s + (x.dueAmount - x.paidAmount), 0);
                    return (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-gray-50 border border-gray-100 p-2.5 text-center">
                          <p className="text-[9px] text-gray-500 font-semibold uppercase">Phải nộp</p>
                          <p className="text-[13px] font-bold text-gray-800 mt-0.5">{fmt(totalDue)}</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-2.5 text-center">
                          <p className="text-[9px] text-emerald-600 font-semibold uppercase">Đã nộp</p>
                          <p className="text-[13px] font-bold text-emerald-700 mt-0.5">{fmt(totalPaid)}</p>
                        </div>
                        <div className={`rounded-xl border p-2.5 text-center ${totalGap > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"}`}>
                          <p className={`text-[9px] font-semibold uppercase ${totalGap > 0 ? "text-red-500" : "text-emerald-600"}`}>Chênh lệch</p>
                          <p className={`text-[13px] font-bold mt-0.5 ${totalGap > 0 ? "text-red-700" : "text-emerald-700"}`}>{totalGap > 0 ? "-" : "+"}{fmt(Math.abs(totalGap))}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* By period */}
                  {recon.map((period, pi) => {
                    const periodTotal = period.items.reduce((s,x) => s + (x.dueAmount - x.paidAmount), 0);
                    return (
                      <div key={pi} className="rounded-xl border border-gray-100 overflow-hidden">
                        <div className={`flex items-center justify-between px-3.5 py-2.5 ${periodTotal > 0 ? "bg-red-50" : periodTotal < 0 ? "bg-emerald-50" : "bg-gray-50"}`}>
                          <span className="text-[12px] font-bold text-gray-800">Kỳ {period.period}</span>
                          <span className={`text-[11px] font-bold ${periodTotal > 0 ? "text-red-600" : periodTotal < 0 ? "text-emerald-600" : "text-gray-500"}`}>
                            {periodTotal > 0 ? `Còn thiếu ${fmt(periodTotal)}` : periodTotal < 0 ? `Thừa ${fmt(Math.abs(periodTotal))}` : "Cân bằng ✓"}
                          </span>
                        </div>
                        {/* Header row */}
                        <div className="grid grid-cols-4 px-3.5 py-1.5 bg-gray-50 border-t border-gray-100">
                          <span className="text-[9px] font-semibold text-gray-400 uppercase">Loại</span>
                          <span className="text-[9px] font-semibold text-gray-400 uppercase text-right">Phải nộp</span>
                          <span className="text-[9px] font-semibold text-gray-400 uppercase text-right">Đã nộp</span>
                          <span className="text-[9px] font-semibold text-gray-400 uppercase text-right">Chênh lệch</span>
                        </div>
                        {period.items.map((item, ii) => {
                          const gap = item.dueAmount - item.paidAmount;
                          const rr = item as typeof item & { note?: string };
                          return (
                            <div key={ii} className={`grid grid-cols-4 px-3.5 py-2.5 border-t border-gray-50 ${gap > 0 ? "bg-red-50/50" : gap < 0 ? "bg-emerald-50/50" : ""}`}>
                              <div>
                                <span className="text-[12px] font-semibold text-gray-700">{item.type}</span>
                                {rr.note && <p className="text-[9px] text-gray-400 mt-0.5">{rr.note}</p>}
                              </div>
                              <span className="text-[11px] text-gray-600 text-right self-start">{item.dueAmount < 0 ? `+${fmt(-item.dueAmount)}` : fmt(item.dueAmount)}</span>
                              <span className="text-[11px] text-emerald-600 font-medium text-right self-start">{fmt(item.paidAmount)}</span>
                              <span className={`text-[11px] font-bold text-right self-start ${gap > 0 ? "text-red-600" : gap < 0 ? "text-emerald-600" : "text-gray-400"}`}>
                                {gap === 0 ? "✓" : gap > 0 ? `-${fmt(gap)}` : `+${fmt(-gap)}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* Tab 7: Ngân sách */}
        {activeTab === 7 && (() => {
          const bd = financialData.budget;
          const usedPct = bd.used / bd.total * 100;
          const remaining = bd.total - bd.used;

          // helper: render a progress bar list row
          const renderRow = (name: string, allocated: number, used: number, color: string, extra?: React.ReactNode) => {
            const pct = Math.min(used / allocated * 100, 100);
            const over = used > allocated;
            return (
              <div className="py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[12px] font-medium text-gray-800 truncate">{name}</span>
                    {extra}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[12px] font-bold ${over ? "text-red-600" : "text-gray-700"}`}>{fmt(used)}</span>
                    <span className="text-[11px] text-gray-400"> / {fmt(allocated)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: over ? "#ef4444" : color }} />
                  </div>
                  <span className={`text-[10px] font-semibold w-9 text-right ${over ? "text-red-500" : pct > 80 ? "text-amber-500" : "text-gray-400"}`}>{fmtPct(pct)}</span>
                </div>
              </div>
            );
          };

          return (
            <>
              {/* KPI summary */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                  <p className="text-[9px] text-blue-500 font-bold uppercase tracking-wide mb-1">Tổng NS</p>
                  <p className="text-[16px] font-bold text-blue-700">{fmt(bd.total)}</p>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                  <p className="text-[9px] text-amber-500 font-bold uppercase tracking-wide mb-1">Đã dùng</p>
                  <p className="text-[16px] font-bold text-amber-700">{fmt(bd.used)}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                  <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-wide mb-1">Còn lại</p>
                  <p className="text-[16px] font-bold text-emerald-700">{fmt(remaining)}</p>
                </div>
              </div>

              {/* Overall progress */}
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-3.5 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-gray-500">Tổng sử dụng</span>
                  <span className="text-[13px] font-bold text-gray-800">{fmtPct(usedPct)}</span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500" style={{ width: `${usedPct}%` }} />
                </div>
              </div>

              {/* View tabs */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                {([
                  { key: "category" as const, label: "Danh mục" },
                  { key: "dept"     as const, label: "Phòng ban" },
                  { key: "project"  as const, label: "Dự án" },
                ] as { key: "category"|"dept"|"project"; label: string }[]).map(t => (
                  <button key={t.key} onClick={() => setBudgetViewTab(t.key)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${budgetViewTab === t.key ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Danh mục */}
              {budgetViewTab === "category" && (
                <div className="rounded-xl border border-gray-100 bg-white px-3.5">
                  {bd.byCategory.map((c, i) => renderRow(c.name, c.allocated, c.used, c.color))}
                </div>
              )}

              {/* Phòng ban */}
              {budgetViewTab === "dept" && (
                <div className="rounded-xl border border-gray-100 bg-white px-3.5">
                  {bd.byDept.map((d, i) => renderRow(d.dept, d.allocated, d.used, d.color))}
                </div>
              )}

              {/* Dự án */}
              {budgetViewTab === "project" && (
                <div className="rounded-xl border border-gray-100 bg-white px-3.5">
                  {bd.byProject.map((p, i) => {
                    const statusBadge = p.status === "over-budget"
                      ? <span className="px-1.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-[9px] font-bold text-red-500">Vượt NS</span>
                      : p.status === "slow"
                      ? <span className="px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-500">Chậm</span>
                      : <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[9px] font-bold text-emerald-500">Đúng tiến độ</span>;
                    return renderRow(p.name, p.allocated, p.used, p.color, statusBadge);
                  })}
                </div>
              )}

              {/* Action bar */}
              <div className="flex gap-2 pt-1 border-t border-gray-100">
                <button onClick={() => { setModal("adjust-budget"); setFormData({}); }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-[12px] font-semibold hover:bg-amber-600 transition-all flex items-center justify-center gap-1.5 shadow-sm">
                  <Plus className="w-3.5 h-3.5" /> Đề xuất điều chỉnh NS
                </button>
                <button onClick={() => toast.info("Đang xuất báo cáo ngân sách...", { description: "Tệp Excel sẽ được tải về sau vài giây" })}
                  className="py-2.5 px-3.5 rounded-xl bg-gray-100 text-gray-600 text-[12px] font-medium hover:bg-gray-200 transition-all">
                  Xuất BC
                </button>
              </div>
            </>
          );
        })()}
      </div>

      {/* === Action Modal === */}
      {modal && (() => {
        const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[12px] text-gray-700 bg-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 transition-all";
        const labelCls = "block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5";
        const modalTitles: Record<string, string> = {
          "add-revenue": "Nhập doanh thu",
          "add-expense": "Tạo đề nghị chi",
          "add-cashflow": "Ghi nhận giao dịch",
          "add-invoice": "Tạo hóa đơn mới",
          "add-debt": "Tạo công nợ mới",
          "adjust-budget": "Đề xuất điều chỉnh ngân sách",
        };
        const handleSubmit = () => {
          const msgs: Record<string, { title: string; desc: string }> = {
            "add-revenue": { title: "Đã ghi nhận doanh thu", desc: "Đang chờ kế toán trưởng xác nhận" },
            "add-expense": { title: "Đề nghị chi đã được gửi", desc: "Chờ phê duyệt từ " + (formData.approver || "kế toán trưởng") },
            "add-cashflow": { title: `Đã ghi nhận ${formData.type === "outflow" ? "khoản chi" : "khoản thu"}`, desc: "Cập nhật dòng tiền thành công" },
            "add-invoice": { title: "Hóa đơn đã được tạo", desc: "Đang chờ phê duyệt" },
            "add-debt": { title: "Công nợ đã được tạo", desc: "Chờ kế toán trưởng xem xét" },
            "adjust-budget": { title: "Đề xuất đã được gửi", desc: "Chờ CFO phê duyệt điều chỉnh ngân sách" },
          };
          const m = msgs[modal!] ?? { title: "Đã lưu thành công", desc: "" };
          toast.success(m.title, { description: m.desc });
          setModal(null);
          setFormData({});
        };
        return (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-end" onClick={() => setModal(null)}>
            <div className="bg-white rounded-t-2xl w-full shadow-2xl max-h-[88%] flex flex-col" onClick={e => e.stopPropagation()}>
              {/* Modal header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 shrink-0">
                <h2 className="text-[14px] font-bold text-gray-800">{modalTitles[modal!]}</h2>
                <button onClick={() => setModal(null)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all">
                  <X className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

                {/* ── Nhập doanh thu ── */}
                {modal === "add-revenue" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Ngày phát sinh</label>
                        <input type="date" className={inputCls} value={formData.date ?? "2026-04-10"} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} />
                      </div>
                      <div>
                        <label className={labelCls}>Danh mục</label>
                        <select className={inputCls} value={formData.category ?? ""} onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}>
                          <option value="">-- Chọn --</option>
                          {["SaaS", "Dịch vụ tư vấn", "Đào tạo", "Đối tác", "Khác"].map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Khách hàng / Nguồn thu</label>
                      <input type="text" className={inputCls} value={formData.party ?? ""} onChange={e => setFormData(f => ({ ...f, party: e.target.value }))} placeholder="VD: Tập đoàn Vingroup" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Số hóa đơn</label>
                        <input type="text" className={inputCls} value={formData.invoiceNo ?? ""} onChange={e => setFormData(f => ({ ...f, invoiceNo: e.target.value }))} placeholder="VD: HD-2026-016" />
                      </div>
                      <div>
                        <label className={labelCls}>Số tiền (VNĐ)</label>
                        <input type="number" className={inputCls} value={formData.amount ?? ""} onChange={e => setFormData(f => ({ ...f, amount: e.target.value }))} placeholder="450000000" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Ghi chú</label>
                      <input type="text" className={inputCls} value={formData.note ?? ""} onChange={e => setFormData(f => ({ ...f, note: e.target.value }))} placeholder="Mô tả ngắn gọn..." />
                    </div>
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5">
                      <p className="text-[11px] text-emerald-700 font-medium">💡 Sau khi lưu, kế toán trưởng sẽ xem xét và xác nhận số liệu doanh thu.</p>
                    </div>
                  </>
                )}

                {/* ── Tạo đề nghị chi ── */}
                {modal === "add-expense" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Ngày phát sinh</label>
                        <input type="date" className={inputCls} value={formData.date ?? "2026-04-10"} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} />
                      </div>
                      <div>
                        <label className={labelCls}>Danh mục chi phí</label>
                        <select className={inputCls} value={formData.category ?? ""} onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}>
                          <option value="">-- Chọn --</option>
                          {["Nhân sự", "Vận hành", "Marketing", "CNTT & Hạ tầng", "Đào tạo", "Văn phòng", "Phúc lợi", "Khác"].map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Nhà cung cấp / Bên thụ hưởng</label>
                      <input type="text" className={inputCls} value={formData.party ?? ""} onChange={e => setFormData(f => ({ ...f, party: e.target.value }))} placeholder="VD: Amazon Web Services" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Số tiền (VNĐ)</label>
                        <input type="number" className={inputCls} value={formData.amount ?? ""} onChange={e => setFormData(f => ({ ...f, amount: e.target.value }))} placeholder="50000000" />
                      </div>
                      <div>
                        <label className={labelCls}>Số hóa đơn / Chứng từ</label>
                        <input type="text" className={inputCls} value={formData.invoiceNo ?? ""} onChange={e => setFormData(f => ({ ...f, invoiceNo: e.target.value }))} placeholder="VD: HĐ-2026-036" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Mô tả chi tiết</label>
                      <input type="text" className={inputCls} value={formData.description ?? ""} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả nội dung chi phí..." />
                    </div>
                    <div>
                      <label className={labelCls}>Người duyệt đề nghị</label>
                      <select className={inputCls} value={formData.approver ?? ""} onChange={e => setFormData(f => ({ ...f, approver: e.target.value }))}>
                        <option value="">-- Chọn người duyệt --</option>
                        {["Nguyễn Minh (CFO)", "Phạm Lan (KT trưởng)", "Ban GĐ"].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2.5">
                      <p className="text-[11px] text-red-700 font-medium">⚠️ Đề nghị chi trên 100 triệu VNĐ cần được CFO phê duyệt trước khi thanh toán.</p>
                    </div>
                  </>
                )}

                {/* ── Ghi nhận giao dịch ── */}
                {modal === "add-cashflow" && (
                  <>
                    <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
                      <button onClick={() => setFormData(f => ({ ...f, type: "inflow" }))}
                        className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${(formData.type ?? "inflow") !== "outflow" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        💰 Thu (Inflow)
                      </button>
                      <button onClick={() => setFormData(f => ({ ...f, type: "outflow" }))}
                        className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${formData.type === "outflow" ? "bg-white text-red-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        💸 Chi (Outflow)
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Ngày giao dịch</label>
                        <input type="date" className={inputCls} value={formData.date ?? "2026-04-10"} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} />
                      </div>
                      <div>
                        <label className={labelCls}>Số tiền (VNĐ)</label>
                        <input type="number" className={inputCls} value={formData.amount ?? ""} onChange={e => setFormData(f => ({ ...f, amount: e.target.value }))} placeholder="450000000" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Mô tả giao dịch</label>
                      <input type="text" className={inputCls} value={formData.description ?? ""} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} placeholder="VD: Thu tiền hợp đồng Vingroup Q2" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Dự án liên quan</label>
                        <input type="text" className={inputCls} value={formData.project ?? ""} onChange={e => setFormData(f => ({ ...f, project: e.target.value }))} placeholder="VD: VWork Enterprise" />
                      </div>
                      <div>
                        <label className={labelCls}>Tài khoản ngân hàng</label>
                        <select className={inputCls} value={formData.account ?? ""} onChange={e => setFormData(f => ({ ...f, account: e.target.value }))}>
                          <option value="">-- Chọn TK --</option>
                          {["MB Bank - 0123456789", "Vietcombank - 9876543210", "BIDV - 1122334455"].map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Ghi chú</label>
                      <input type="text" className={inputCls} value={formData.note ?? ""} onChange={e => setFormData(f => ({ ...f, note: e.target.value }))} placeholder="Thông tin bổ sung..." />
                    </div>
                  </>
                )}

                {/* ── Tạo hóa đơn mới ── */}
                {modal === "add-invoice" && (
                  <>
                    <div className="flex rounded-xl bg-gray-100 p-1 gap-1 mb-1">
                      <button onClick={() => setFormData(f => ({ ...f, invoiceType: "thu" }))}
                        className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${(formData.invoiceType ?? "thu") !== "chi" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        Hóa đơn bán
                      </button>
                      <button onClick={() => setFormData(f => ({ ...f, invoiceType: "chi" }))}
                        className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${formData.invoiceType === "chi" ? "bg-white text-red-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        Hóa đơn mua
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Số hóa đơn</label>
                        <input type="text" className={inputCls} value={formData.number ?? ""} onChange={e => setFormData(f => ({ ...f, number: e.target.value }))} placeholder="VD: HD-2026-016" />
                      </div>
                      <div>
                        <label className={labelCls}>Ngày hóa đơn</label>
                        <input type="date" className={inputCls} value={formData.date ?? "2026-04-10"} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Đối tác</label>
                      <input type="text" className={inputCls} value={formData.party ?? ""} onChange={e => setFormData(f => ({ ...f, party: e.target.value }))} placeholder="VD: Tập đoàn Vingroup" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Ngày đến hạn</label>
                        <input type="date" className={inputCls} value={formData.dueDate ?? ""} onChange={e => setFormData(f => ({ ...f, dueDate: e.target.value }))} />
                      </div>
                      <div>
                        <label className={labelCls}>Thuế VAT (%)</label>
                        <select className={inputCls} value={formData.vat ?? "10"} onChange={e => setFormData(f => ({ ...f, vat: e.target.value }))}>
                          {["0", "8", "10"].map(o => <option key={o} value={o}>{o}%</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Số tiền trước thuế (VNĐ)</label>
                      <input type="number" className={inputCls} value={formData.amount ?? ""} onChange={e => setFormData(f => ({ ...f, amount: e.target.value }))} placeholder="450000000" />
                    </div>
                    <div>
                      <label className={labelCls}>Mô tả dịch vụ / hàng hóa</label>
                      <input type="text" className={inputCls} value={formData.description ?? ""} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} placeholder="VD: Gói Enterprise VWork 200 users Q2/2026" />
                    </div>
                  </>
                )}

                {/* ── Tạo công nợ mới ── */}
                {modal === "add-debt" && (
                  <>
                    <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
                      <button onClick={() => setFormData(f => ({ ...f, type: "receivable" }))}
                        className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${(formData.type ?? "receivable") !== "payable" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        Phải thu (AR)
                      </button>
                      <button onClick={() => setFormData(f => ({ ...f, type: "payable" }))}
                        className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${formData.type === "payable" ? "bg-white text-red-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        Phải trả (AP)
                      </button>
                    </div>
                    <div>
                      <label className={labelCls}>Đối tác</label>
                      <input type="text" className={inputCls} value={formData.party ?? ""} onChange={e => setFormData(f => ({ ...f, party: e.target.value }))} placeholder="VD: Techcombank" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Số hóa đơn</label>
                        <input type="text" className={inputCls} value={formData.invoiceNo ?? ""} onChange={e => setFormData(f => ({ ...f, invoiceNo: e.target.value }))} placeholder="VD: HD-2026-017" />
                      </div>
                      <div>
                        <label className={labelCls}>Danh mục</label>
                        <input type="text" className={inputCls} value={formData.category ?? ""} onChange={e => setFormData(f => ({ ...f, category: e.target.value }))} placeholder="VD: Dịch vụ SaaS" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Số tiền (VNĐ)</label>
                        <input type="number" className={inputCls} value={formData.amount ?? ""} onChange={e => setFormData(f => ({ ...f, amount: e.target.value }))} placeholder="450000000" />
                      </div>
                      <div>
                        <label className={labelCls}>Ngày đến hạn</label>
                        <input type="date" className={inputCls} value={formData.dueDate ?? ""} onChange={e => setFormData(f => ({ ...f, dueDate: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Người liên hệ</label>
                      <input type="text" className={inputCls} value={formData.contact ?? ""} onChange={e => setFormData(f => ({ ...f, contact: e.target.value }))} placeholder="VD: Nguyễn Thị Lan" />
                    </div>
                    <div>
                      <label className={labelCls}>Ghi chú</label>
                      <input type="text" className={inputCls} value={formData.note ?? ""} onChange={e => setFormData(f => ({ ...f, note: e.target.value }))} placeholder="Ghi chú thêm..." />
                    </div>
                  </>
                )}

                {/* ── Đề xuất điều chỉnh ngân sách ── */}
                {modal === "adjust-budget" && (
                  <>
                    <div>
                      <label className={labelCls}>Phòng ban</label>
                      <select className={inputCls} value={formData.dept ?? ""} onChange={e => setFormData(f => ({ ...f, dept: e.target.value }))}>
                        <option value="">-- Chọn phòng ban --</option>
                        {financialData.budget.byDept.map(d => (
                          <option key={d.dept} value={d.dept}>{d.dept} — Đã dùng: {fmt(d.used)} / {fmt(d.allocated)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Khoản cần điều chỉnh</label>
                      <input type="text" className={inputCls} value={formData.item ?? ""} onChange={e => setFormData(f => ({ ...f, item: e.target.value }))} placeholder="VD: Tăng ngân sách tuyển dụng Q2" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Số tiền hiện tại (VNĐ)</label>
                        <input type="number" className={inputCls} value={formData.currentAmount ?? ""} onChange={e => setFormData(f => ({ ...f, currentAmount: e.target.value }))} placeholder="0" />
                      </div>
                      <div>
                        <label className={labelCls}>Số tiền đề xuất (VNĐ)</label>
                        <input type="number" className={inputCls} value={formData.newAmount ?? ""} onChange={e => setFormData(f => ({ ...f, newAmount: e.target.value }))} placeholder="0" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Lý do điều chỉnh</label>
                      <input type="text" className={inputCls} value={formData.reason ?? ""} onChange={e => setFormData(f => ({ ...f, reason: e.target.value }))} placeholder="Nêu rõ lý do cần điều chỉnh ngân sách..." />
                    </div>
                    <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
                      <p className="text-[11px] text-amber-700 font-medium">📋 Đề xuất điều chỉnh ngân sách sẽ được gửi tới CFO và Board để phê duyệt. Thời gian xử lý: 2–3 ngày làm việc.</p>
                    </div>
                  </>
                )}
              </div>

              {/* Modal footer */}
              <div className="px-4 pb-6 pt-3 flex gap-2 border-t border-gray-100 shrink-0">
                <button onClick={() => { setModal(null); setFormData({}); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[12px] font-medium text-gray-600 hover:bg-gray-50 transition-all">
                  Hủy
                </button>
                <button onClick={handleSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 transition-all shadow-sm">
                  Lưu &amp; Gửi duyệt
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

const fmtD = (d: Date) => `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()}`;

/* ═══════════ PaymentHubView ═══════════ */
interface PaymentFormData {
  type: PaymentType;
  amount: string;
  partner_id: string;
  method: PaymentMethod;
  date: string;
  invoice_links: string;
  note: string;
}
function emptyPaymentForm(type: PaymentType = "mua"): PaymentFormData {
  return { type, amount: "", partner_id: "", method: "bank_transfer", date: fmtD(new Date()), invoice_links: "", note: "" };
}
function paymentToForm(p: Payment): PaymentFormData {
  return { type: p.type, amount: String(p.amount), partner_id: p.partner_id, method: p.method, date: p.date, invoice_links: p.invoice_links.join(", "), note: p.note ?? "" };
}

const PAYMENT_DELETABLE: PaymentStatus[] = ["pending", "cancelled", "failed"];
const PAYMENT_EDITABLE:  PaymentStatus[] = ["pending"];

function PaymentHubView() {
  const [payments, setPayments]           = useState<Payment[]>(financePayments);
  const [activeTab, setActiveTab]         = useState<"all" | "ban" | "mua">("all");
  const [statusFilter, setStatusFilter]   = useState<PaymentStatus | "all">("all");
  const [selected, setSelected]           = useState<Payment | null>(null);
  const [showForm, setShowForm]           = useState(false);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [formData, setFormData]           = useState<PaymentFormData>(emptyPaymentForm());
  const [formErrors, setFormErrors]       = useState<Record<string, string>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [linkedInvoice, setLinkedInvoice] = useState<Invoice | null>(null);
  const [payAction, setPayAction]         = useState<"partial" | null>(null);
  const [partialForm, setPartialForm]     = useState({ amount: "", date: fmtD(new Date()), method: "bank_transfer" as PaymentMethod, note: "" });
  const [invSearch, setInvSearch]         = useState("");
  const [invSearchOpen, setInvSearchOpen] = useState(false);
  const [paySearch, setPaySearch]         = useState("");
  const lastPaySaveRef = useRef<number>(0);
  const lastInvSaveRef = useRef<number>(0);

  const fmtAmt     = (n: number) => n.toLocaleString("vi-VN") + " ₫";
  const getPartner = (id: string) => financePartners.find(p => p.id === id);
  const getInvoice = (id: string) => financeInvoices.find(i => i.id === id);
  const paidOf     = (p: Payment) => p.records.reduce((s, r) => s + r.amount, 0);
  const remainOf   = (p: Payment) => p.amount - paidOf(p);

  const tabs = [
    { key: "all" as const, label: "Tất cả" },
    { key: "ban" as const, label: "Thanh toán bán" },
    { key: "mua" as const, label: "Thanh toán mua" },
  ];
  const statusFilters: { key: PaymentStatus | "all"; label: string }[] = [
    { key: "all",            label: "Tất cả" },
    { key: "pending",        label: "Chờ TT" },
    { key: "partially_paid", label: "TT 1 phần" },
    { key: "completed",      label: "Hoàn thành" },
    { key: "failed",         label: "Thất bại" },
    { key: "cancelled",      label: "Đã hủy" },
  ];

  const filtered = payments.filter(p => {
    const matchType   = activeTab === "all" || p.type === activeTab;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchSearch = !paySearch ||
      getPartner(p.partner_id)?.name.toLowerCase().includes(paySearch.toLowerCase()) ||
      p.invoice_links.some(id => getInvoice(id)?.number.toLowerCase().includes(paySearch.toLowerCase())) ||
      p.note?.toLowerCase().includes(paySearch.toLowerCase()) ||
      p.amount.toString().includes(paySearch);
    return matchType && matchStatus && matchSearch;
  });

  const sumCompleted = (type: PaymentType) =>
    payments.filter(p => p.type === type && p.status === "completed").reduce((s, p) => s + p.amount, 0);
  const sumPending = payments
    .filter(p => ["pending", "partially_paid"].includes(p.status))
    .reduce((s, p) => s + remainOf(p), 0);

  const openAdd  = () => { setEditingId(null); setFormData(emptyPaymentForm(activeTab !== "all" ? activeTab : "mua")); setFormErrors({}); setShowForm(true); };
  const openEdit = (p: Payment) => { setEditingId(p.id); setFormData(paymentToForm(p)); setFormErrors({}); setSelected(null); setShowForm(true); };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.amount || parseFloat(formData.amount) <= 0) errs.amount = "Bắt buộc";
    if (!formData.partner_id) errs.partner_id = "Bắt buộc";
    if (!formData.date) errs.date = "Bắt buộc";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    // Prevent double-click/rapid save
    const now = Date.now();
    if (now - lastPaySaveRef.current < 300) return;
    lastPaySaveRef.current = now;

    if (!validate()) return;
    const links = formData.invoice_links.split(",").map(s => s.trim()).filter(Boolean);
    if (editingId) {
      setPayments(prev => prev.map(p => p.id !== editingId ? p : {
        ...p, type: formData.type, amount: parseFloat(formData.amount),
        partner_id: formData.partner_id, method: formData.method,
        date: formData.date, invoice_links: links, note: formData.note,
      }));
      toast.success("Đã cập nhật thanh toán");
    } else {
      setPayments(prev => [{
        id: `pay-${Date.now()}`, type: formData.type,
        amount: parseFloat(formData.amount), partner_id: formData.partner_id,
        method: formData.method, date: formData.date,
        invoice_links: links, status: "pending", note: formData.note, records: [],
      }, ...prev]);
      toast.success("Đã tạo thanh toán mới");
    }
    setShowForm(false); setEditingId(null);
  };

  const handleDelete = (p: Payment) => {
    if (!PAYMENT_DELETABLE.includes(p.status)) return;
    setPayments(prev => prev.filter(x => x.id !== p.id));
    setSelected(null); setDeleteConfirmId(null);
    toast.success("Đã xóa thanh toán");
  };

  const recordPayment = (p: Payment, amount: number, full: boolean) => {
    const rec: PaymentRecord = { id: `r-${Date.now()}`, amount, date: partialForm.date, method: partialForm.method, note: partialForm.note };
    const totalPaid = paidOf(p) + amount;
    const nextStatus: PaymentStatus = (full || totalPaid >= p.amount) ? "completed" : "partially_paid";
    const updated = { ...p, records: [...p.records, rec], status: nextStatus };
    setPayments(prev => prev.map(x => x.id !== p.id ? x : updated));
    setSelected(updated);
    setPayAction(null);
    setPartialForm({ amount: "", date: fmtD(new Date()), method: "bank_transfer", note: "" });
    toast.success(nextStatus === "completed" ? "Thanh toán hoàn tất ✓" : `Đã ghi nhận ${amount.toLocaleString("vi-VN")} ₫`);
  };

  const inputCls = (err?: string) =>
    `w-full px-3 py-2 rounded-lg border text-[12px] bg-white outline-none focus:ring-2 focus:ring-cyan-300 ${err ? "border-red-300" : "border-gray-200"}`;

  const FLabel = ({ label, err, children }: { label: string; err?: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-gray-500">{label}</label>
      {children}
      {err && <span className="text-[10px] text-red-500">{err}</span>}
    </div>
  );

  /* ── Detail panel ── */
  if (selected) {
    const sc      = paymentStatusConfig[selected.status];
    const prt     = getPartner(selected.partner_id);
    const paid    = paidOf(selected);
    const rem     = remainOf(selected);
    const pct     = Math.min((paid / selected.amount) * 100, 100);
    const canEdit   = PAYMENT_EDITABLE.includes(selected.status);
    const canDelete = PAYMENT_DELETABLE.includes(selected.status);
    const canPay    = ["pending", "partially_paid"].includes(selected.status);

    return (
      <>
        <div className="h-full flex flex-col">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
            <button onClick={() => { setSelected(null); setPayAction(null); }}
              className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-800 transition-colors">
              <ArrowLeft size={13}/> Danh sách
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-[12px] font-semibold text-gray-800 truncate">{selected.id}</span>
            <div className="ml-auto flex items-center gap-1.5">
              {canEdit && (
                <button onClick={() => openEdit(selected)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-600">Sửa</button>
              )}
              {canDelete && deleteConfirmId !== selected.id && (
                <button onClick={() => setDeleteConfirmId(selected.id)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-red-50 hover:bg-red-100 text-red-500">Xóa</button>
              )}
              {deleteConfirmId === selected.id && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-red-500">Xác nhận?</span>
                  <button onClick={() => handleDelete(selected)} className="px-2.5 py-1 rounded-lg text-[11px] bg-red-500 text-white hover:bg-red-600">Xóa</button>
                  <button onClick={() => setDeleteConfirmId(null)} className="px-2.5 py-1 rounded-lg text-[11px] bg-gray-100 text-gray-600">Hủy</button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
            {/* Amount card */}
            <div className={`rounded-2xl border p-4 flex items-center gap-4 ${selected.type === "ban" ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`}>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 ${selected.type === "ban" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}>
                {selected.type === "ban" ? "↙" : "↗"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-gray-500">{selected.type === "ban" ? "Thanh toán bán — Thu tiền" : "Thanh toán mua — Chi tiền"}</p>
                <p className={`text-[22px] font-bold ${selected.type === "ban" ? "text-green-600" : "text-blue-700"}`}>{fmtAmt(selected.amount)}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${sc.bg} ${sc.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}/>{sc.label}
              </span>
            </div>

            {/* Progress + history */}
            {["pending", "partially_paid", "completed"].includes(selected.status) && (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 pt-3 pb-2">
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-gray-500">Tiến độ thanh toán</span>
                    <span className="font-semibold text-green-600">{fmtAmt(paid)} / {fmtAmt(selected.amount)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-green-400 transition-all duration-500" style={{ width: `${pct}%` }}/>
                  </div>
                  {rem > 0 && <p className="text-[10px] text-gray-400 mt-1">Còn lại: <span className="font-semibold text-amber-600">{fmtAmt(rem)}</span></p>}
                </div>
                {selected.records.length > 0 && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Lịch sử ghi nhận</p>
                    {selected.records.map((r, i) => (
                      <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
                        <div>
                          <p className="text-[11px] font-medium text-gray-700">Đợt {i + 1}</p>
                          <p className="text-[10px] text-gray-400">{r.date} · {paymentMethodLabel[r.method]}{r.note ? ` · ${r.note}` : ""}</p>
                        </div>
                        <span className="text-[13px] font-bold text-green-600">+{fmtAmt(r.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Info grid */}
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-y divide-gray-100">
                {[
                  { label: "Đối tác",           value: prt?.name ?? selected.partner_id },
                  { label: "Phương thức",        value: paymentMethodLabel[selected.method] },
                  { label: "Ngày tạo",           value: selected.date },
                ].map(row => (
                  <div key={row.label} className="px-4 py-3">
                    <p className="text-[10px] text-gray-400 mb-0.5">{row.label}</p>
                    <p className="text-[12px] font-medium text-gray-800">{row.value}</p>
                  </div>
                ))}
                <div className="px-4 py-3">
                  <p className="text-[10px] text-gray-400 mb-1">Hóa đơn liên kết</p>
                  {selected.invoice_links.length === 0
                    ? <p className="text-[12px] text-gray-400">—</p>
                    : <div className="flex flex-wrap gap-1">
                        {selected.invoice_links.map(id => {
                          const inv = getInvoice(id);
                          return (
                            <button key={id} onClick={() => setLinkedInvoice(inv ?? null)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-cyan-200 bg-cyan-50 text-cyan-700 text-[11px] font-medium hover:bg-cyan-100 transition-colors">
                              <FileText size={10}/>{inv?.number ?? id}
                            </button>
                          );
                        })}
                      </div>
                  }
                </div>
              </div>
            </div>

            {selected.note && (
              <div className="rounded-xl border border-gray-100 px-4 py-3">
                <p className="text-[10px] text-gray-400 mb-1">Ghi chú</p>
                <p className="text-[12px] text-gray-700">{selected.note}</p>
              </div>
            )}

            {/* Action buttons */}
            {canPay && (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                {payAction === null && (
                  <div className="flex gap-2 p-3">
                    <button
                      onClick={() => recordPayment(selected, rem, true)}
                      className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${selected.type === "ban" ? "bg-green-500 hover:bg-green-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`}>
                      ✓ Thanh toán hết ({fmtAmt(rem)})
                    </button>
                    <button
                      onClick={() => setPayAction("partial")}
                      className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold bg-amber-400 hover:bg-amber-500 text-white transition-colors">
                      Thanh toán 1 phần
                    </button>
                    <button
                      onClick={() => {
                        const updated = { ...selected, status: "cancelled" as PaymentStatus };
                        setPayments(prev => prev.map(x => x.id !== selected.id ? x : updated));
                        setSelected(updated);
                        toast.success("Đã hủy thanh toán");
                      }}
                      className="px-3 py-2.5 rounded-xl text-[12px] border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                      Hủy
                    </button>
                  </div>
                )}
                {payAction === "partial" && (
                  <div className="p-4 space-y-3 bg-gray-50">
                    <p className="text-[12px] font-semibold text-gray-700">Ghi nhận thanh toán 1 phần <span className="text-gray-400 font-normal">(còn lại {fmtAmt(rem)})</span></p>
                    <div className="grid grid-cols-2 gap-2">
                      <FLabel label="Số tiền (₫)">
                        <input type="number" placeholder={String(rem)} value={partialForm.amount}
                          onChange={e => setPartialForm(f => ({ ...f, amount: e.target.value }))}
                          className={inputCls()}/>
                      </FLabel>
                      <FLabel label="Ngày">
                        <input type="text" placeholder="DD/MM/YYYY" value={partialForm.date}
                          onChange={e => setPartialForm(f => ({ ...f, date: e.target.value }))}
                          className={inputCls()}/>
                      </FLabel>
                    </div>
                    <FLabel label="Kênh thanh toán">
                      <select value={partialForm.method}
                        onChange={e => setPartialForm(f => ({ ...f, method: e.target.value as PaymentMethod }))}
                        className={inputCls()}>
                        {(Object.entries(paymentMethodLabel) as [PaymentMethod, string][]).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </FLabel>
                    <FLabel label="Ghi chú">
                      <input type="text" placeholder="Ghi chú..." value={partialForm.note}
                        onChange={e => setPartialForm(f => ({ ...f, note: e.target.value }))}
                        className={inputCls()}/>
                    </FLabel>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        const amt = parseFloat(partialForm.amount);
                        if (!amt || amt <= 0) { toast.error("Nhập số tiền hợp lệ"); return; }
                        if (amt > rem) { toast.error(`Số tiền vượt quá số còn lại (${fmtAmt(rem)})`); return; }
                        recordPayment(selected, amt, false);
                      }} className="flex-1 py-2 rounded-lg bg-green-500 text-white text-[12px] font-semibold hover:bg-green-600">
                        Xác nhận
                      </button>
                      <button onClick={() => setPayAction(null)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-[12px] hover:bg-gray-200">
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {selected.status === "completed" && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-500"/>
                <span className="text-[12px] text-green-700 font-medium">Thanh toán đã hoàn tất</span>
              </div>
            )}
            {selected.status === "cancelled" && (
              <div className={`px-4 py-3 rounded-xl border text-center text-[12px] font-medium ${sc.bg} ${sc.color}`}>Thanh toán đã bị hủy</div>
            )}
            {selected.status === "failed" && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${sc.bg}`}>
                <AlertCircle className="w-4 h-4 text-red-500"/>
                <span className={`text-[12px] font-medium ${sc.color}`}>Giao dịch thất bại</span>
              </div>
            )}
          </div>
        </div>

        {/* Linked invoice modal */}
        {linkedInvoice && (() => {
          const inv = linkedInvoice; const isBan = inv.type === "ban"; const isc = statusConfig[inv.status]; const tot = calcInvoice(inv);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setLinkedInvoice(null)}>
              <div className="bg-white rounded-2xl shadow-2xl w-[560px] max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${isBan ? "bg-green-50 border-green-200 text-green-600" : "bg-blue-50 border-blue-200 text-blue-600"}`}>{isBan ? "BÁN" : "MUA"}</span>
                    <span className="text-[15px] font-bold text-gray-900">{inv.number}</span>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${isc.bg} ${isc.color}`}><span className={`w-1.5 h-1.5 rounded-full ${isc.dot}`}/>{isc.label}</span>
                  </div>
                  <button onClick={() => setLinkedInvoice(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4"/></button>
                </div>
                <div className="px-5 py-4 space-y-5">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">A. Thông tin chung</p>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5"><p className="text-[10px] text-gray-400 mb-0.5 font-medium">Ngày tạo</p><p className="text-[12px] font-semibold text-gray-700">{inv.date}</p></div>
                      <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5"><p className="text-[10px] text-gray-400 mb-0.5 font-medium">Ngày đến hạn</p><p className="text-[12px] font-semibold text-gray-700">{inv.dueDate}</p></div>
                      <div className={`rounded-xl border px-3 py-2.5 ${isc.bg}`}><p className="text-[10px] text-gray-400 mb-0.5 font-medium">Trạng thái</p><p className={`text-[12px] font-semibold ${isc.color}`}>{isc.label}</p></div>
                    </div>
                    <div className="rounded-xl bg-gray-50 border border-gray-100 px-3.5 py-2.5"><p className="text-[10px] text-gray-400 mb-0.5 font-medium">{isBan ? "Khách hàng" : "Nhà cung cấp"}</p><p className="text-[13px] font-semibold text-gray-800">{inv.party}</p></div>
                    {inv.note && <p className="text-[11px] text-gray-500 mt-2 italic">{inv.note}</p>}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">B. Danh sách hàng hóa / dịch vụ</p>
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <table className="w-full text-[11px]">
                        <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="text-left px-3 py-2 text-gray-500 font-semibold">Tên</th><th className="text-right px-2 py-2 text-gray-500 font-semibold">SL</th><th className="text-right px-2 py-2 text-gray-500 font-semibold">Đơn giá</th><th className="text-right px-2 py-2 text-gray-500 font-semibold">CK%</th><th className="text-right px-2 py-2 text-gray-500 font-semibold">VAT%</th><th className="text-right px-3 py-2 text-gray-500 font-semibold">Thành tiền</th></tr></thead>
                        <tbody>{inv.items.map(it => { const c = calcLine(it); return (<tr key={it.id} className="border-b border-gray-50 last:border-0"><td className="px-3 py-2 text-gray-800 font-medium">{it.name}</td><td className="px-2 py-2 text-right text-gray-600">{it.quantity}</td><td className="px-2 py-2 text-right text-gray-600">{it.unitPrice.toLocaleString("vi-VN")}</td><td className="px-2 py-2 text-right text-gray-500">{it.discount > 0 ? `${it.discount}%` : "—"}</td><td className="px-2 py-2 text-right text-gray-500">{it.vat > 0 ? `${it.vat}%` : "0%"}</td><td className="px-3 py-2 text-right font-semibold text-gray-800">{c.total.toLocaleString("vi-VN")} ₫</td></tr>); })}</tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">C. Tổng tiền</p>
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="flex justify-between px-4 py-2.5 border-b border-gray-100"><span className="text-[12px] text-gray-500">Tổng tiền trước thuế</span><span className="text-[12px] font-medium text-gray-700">{tot.sub.toLocaleString("vi-VN")} ₫</span></div>
                      {tot.disc > 0 && <div className="flex justify-between px-4 py-2.5 border-b border-gray-100"><span className="text-[12px] text-gray-500">Giảm giá</span><span className="text-[12px] font-medium text-red-500">- {tot.disc.toLocaleString("vi-VN")} ₫</span></div>}
                      <div className="flex justify-between px-4 py-2.5 border-b border-gray-100"><span className="text-[12px] text-gray-500">VAT</span><span className="text-[12px] font-medium text-gray-700">+ {tot.tax.toLocaleString("vi-VN")} ₫</span></div>
                      <div className="flex justify-between px-4 py-3 bg-gray-50"><span className="text-[13px] font-bold text-gray-800">Tổng thanh toán</span><span className={`text-[16px] font-bold ${isBan ? "text-green-600" : "text-gray-900"}`}>{tot.grand.toLocaleString("vi-VN")} ₫</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </>
    );
  }

  /* ── Add / Edit form ── */
  if (showForm) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
          <button onClick={() => { setShowForm(false); setEditingId(null); }}
            className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-800">
            <ArrowLeft size={13}/> Hủy
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-[12px] font-semibold text-gray-800">{editingId ? "Sửa thanh toán" : "Thêm thanh toán"}</span>
          <button onClick={handleSave} className="ml-auto px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-[12px] font-semibold">Lưu</button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            {(["ban", "mua"] as PaymentType[]).map(t => (
              <button key={t} onClick={() => setFormData(f => ({ ...f, type: t }))}
                className={`flex-1 py-2.5 text-[12px] font-semibold transition-colors ${formData.type === t
                  ? (t === "ban" ? "bg-green-500 text-white" : "bg-blue-500 text-white")
                  : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                {t === "ban" ? "↙ Thu tiền (Bán)" : "↗ Chi tiền (Mua)"}
              </button>
            ))}
          </div>
          <FLabel label="Số tiền (₫)" err={formErrors.amount}>
            <input type="number" placeholder="0" value={formData.amount}
              onChange={e => setFormData(f => ({ ...f, amount: e.target.value }))} className={inputCls(formErrors.amount)}/>
          </FLabel>
          <FLabel label="Đối tác" err={formErrors.partner_id}>
            <select value={formData.partner_id} onChange={e => setFormData(f => ({ ...f, partner_id: e.target.value }))} className={inputCls(formErrors.partner_id)}>
              <option value="">-- Chọn đối tác --</option>
              {financePartners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FLabel>
          <FLabel label="Phương thức mặc định">
            <select value={formData.method} onChange={e => setFormData(f => ({ ...f, method: e.target.value as PaymentMethod }))} className={inputCls()}>
              {(Object.entries(paymentMethodLabel) as [PaymentMethod, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </FLabel>
          <FLabel label="Ngày" err={formErrors.date}>
            <input type="text" placeholder="DD/MM/YYYY" value={formData.date}
              onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} className={inputCls(formErrors.date)}/>
          </FLabel>
          <FLabel label="Liên kết hóa đơn">
            <div className="space-y-2">
              {/* Selected invoices as tags */}
              {(() => {
                const selected = formData.invoice_links.split(",").map(s => s.trim()).filter(Boolean);
                return (
                  <div className="flex flex-wrap gap-2">
                    {selected.map(id => {
                      const inv = getInvoice(id);
                      return (
                        <button key={id} type="button"
                          onClick={() => {
                            const newLinks = selected.filter(x => x !== id).join(", ");
                            setFormData(f => ({ ...f, invoice_links: newLinks }));
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-medium hover:bg-blue-100 transition-all">
                          {inv?.number || id}
                          <span className="text-blue-400 ml-0.5">×</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
              {/* Search to add invoices */}
              <div className="relative" onBlur={() => setTimeout(() => setInvSearchOpen(false), 200)}>
                <input type="text" placeholder="Tìm hóa đơn..." value={invSearch}
                  onChange={e => { setInvSearch(e.target.value); setInvSearchOpen(true); }}
                  onFocus={() => setInvSearchOpen(true)}
                  onKeyDown={e => { if (e.key === "Escape") setInvSearchOpen(false); }}
                  className={inputCls()} autoComplete="off"/>
                {invSearchOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto z-10">
                    {(() => {
                      const selected = formData.invoice_links.split(",").map(s => s.trim()).filter(Boolean);
                      const filtered = financeInvoices.filter(inv =>
                        (inv.number.toLowerCase().includes(invSearch.toLowerCase()) ||
                         inv.party.toLowerCase().includes(invSearch.toLowerCase())) &&
                        !selected.includes(inv.id)
                      );
                      return filtered.length > 0
                        ? filtered.map(inv => (
                            <button key={inv.id} type="button"
                              onClick={() => {
                                const newLinks = [...selected, inv.id].join(", ");
                                setFormData(f => ({ ...f, invoice_links: newLinks }));
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0 text-[12px] transition-colors">
                              <div className="font-medium text-gray-900">{inv.number}</div>
                              <div className="text-[11px] text-gray-500">{inv.party} • {inv.type === "ban" ? "Bán" : "Mua"}</div>
                            </button>
                          ))
                        : <div className="px-3 py-2 text-[12px] text-gray-400 text-center">Không tìm thấy hóa đơn</div>;
                    })()}
                  </div>
                )}
              </div>
            </div>
          </FLabel>
          <FLabel label="Ghi chú">
            <textarea rows={3} placeholder="Ghi chú..." value={formData.note}
              onChange={e => setFormData(f => ({ ...f, note: e.target.value }))} className={`${inputCls()} resize-none`}/>
          </FLabel>
        </div>
      </div>
    );
  }

  /* ── List view ── */
  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-100 shrink-0 px-4 pt-3">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); setStatusFilter("all"); }}
            className={`px-4 py-2 text-[12px] font-medium border-b-2 transition-all ${activeTab === t.key ? "border-cyan-500 text-cyan-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
        {[
          { label: "Tổng thu",  value: sumCompleted("ban"), color: "text-green-600" },
          { label: "Tổng chi",  value: sumCompleted("mua"), color: "text-blue-700" },
          { label: "Chờ xử lý", value: sumPending,          color: "text-amber-600" },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2">
            <p className="text-[10px] text-gray-400">{s.label}</p>
            <p className={`text-[12px] font-bold mt-0.5 ${s.color}`}>{fmtAmt(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Status filters + Search */}
      <div className="px-4 py-2.5 border-b border-gray-50 shrink-0 space-y-2">
        <div className="flex gap-1 flex-wrap">
          {statusFilters.map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${statusFilter === f.key ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Tìm theo hóa đơn, công ty, số tiền..." value={paySearch} onChange={e => setPaySearch(e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] bg-white outline-none focus:ring-2 focus:ring-cyan-300"/>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-[13px] gap-2">
            <span className="text-3xl">💳</span><span>Không có giao dịch</span>
          </div>
        )}
        {filtered.map(p => {
          const sc   = paymentStatusConfig[p.status];
          const prt  = getPartner(p.partner_id);
          const paid = paidOf(p);
          const pct  = Math.min((paid / p.amount) * 100, 100);
          return (
            <div key={p.id} onClick={() => setSelected(p)}
              className="group flex items-start gap-0 rounded-xl border border-gray-100 bg-white hover:border-cyan-200 hover:shadow-sm cursor-pointer transition-all overflow-hidden">
              <div className={`w-1 self-stretch shrink-0 ${p.type === "ban" ? "bg-green-400" : "bg-blue-400"}`}/>
              <div className="flex-1 px-3 py-2.5 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-gray-800 truncate">{prt?.name ?? p.partner_id}</p>
                    <p className="text-[10px] text-gray-400">{p.date}{p.note ? ` · ${p.note}` : ""}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-[13px] font-bold ${p.type === "ban" ? "text-green-600" : "text-blue-700"}`}>{fmtAmt(p.amount)}</p>
                    {paid > 0 && paid < p.amount && <p className="text-[10px] text-gray-400">Còn {fmtAmt(p.amount - paid)}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border shrink-0 ${p.type === "ban" ? "bg-green-50 border-green-200 text-green-600" : "bg-blue-50 border-blue-200 text-blue-600"}`}>
                    {p.type === "ban" ? "BÁN" : "MUA"}
                  </span>
                  <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] border ${sc.bg} ${sc.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} shrink-0`}/>{sc.label}
                  </span>
                  {p.invoice_links.length > 0 && <span className="text-[10px] text-gray-400">{p.invoice_links.length} HĐ</span>}
                </div>
                {p.status === "partially_paid" && (
                  <div className="mt-2 h-1 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-green-400" style={{ width: `${pct}%` }}/>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════ InvoiceHubView ═══════════ */
const DELETABLE_STATUSES: InvoiceStatus[] = ["draft", "cancelled"];
const EDITABLE_STATUSES: InvoiceStatus[]  = ["draft"];

interface FormLineItem { id: string; name: string; quantity: string; unitPrice: string; vat: string; discount: string; }
interface InvoiceFormData {
  type: "ban" | "mua";
  number: string;
  party: string;
  date: string;
  dueDate: string;
  note: string;
  items: FormLineItem[];
}

const newLineItem = (): FormLineItem => ({ id: `fl-${Date.now()}-${Math.random()}`, name: "", quantity: "1", unitPrice: "", vat: "10", discount: "0" });

function emptyForm(type: "ban" | "mua" = "ban"): InvoiceFormData {
  const today = new Date(); const due = new Date(today); due.setDate(due.getDate() + 30);
  return { type, number: "", party: "", date: fmtD(today), dueDate: fmtD(due), note: "", items: [newLineItem()] };
}

function invoiceToForm(inv: Invoice): InvoiceFormData {
  return { type: inv.type, number: inv.number, party: inv.party, date: inv.date, dueDate: inv.dueDate, note: inv.note ?? "",
    items: inv.items.map(it => ({ id: it.id, name: it.name, quantity: String(it.quantity), unitPrice: String(it.unitPrice), vat: String(it.vat), discount: String(it.discount) })) };
}

function calcFormTotals(items: FormLineItem[]) {
  let sub = 0, disc = 0, tax = 0;
  items.forEach(it => {
    const q = parseFloat(it.quantity) || 0, p = parseFloat(it.unitPrice) || 0, d = parseFloat(it.discount) || 0, v = parseFloat(it.vat) || 0;
    const s = q * p, da = s * d / 100, ta = (s - da) * v / 100;
    sub += s; disc += da; tax += ta;
  });
  return { sub, disc, tax, grand: sub - disc + tax };
}

function InvoiceHubView({ initTab, locked }: { initTab?: "all" | "ban" | "mua" | "history" | "partners"; locked?: boolean }) {
  const [activeTab, setActiveTab] = useState<"all" | "ban" | "mua" | "history" | "partners">(initTab ?? "all");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>(financeInvoices);
  const [partnerTypeFilter, setPartnerTypeFilter] = useState<"all" | "customer" | "vendor">("all");
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<InvoiceFormData>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  /* ── CRM invoice integration ── */
  const { crmInvoices } = useCrmInvoices();
  // Convert CRM invoices to Finance Invoice format for unified display (read-only in Finance)
  const crmAsFinance: Invoice[] = crmInvoices.map((ci: CrmInvoice) => ({
    id: ci.id,
    number: ci.invoiceNo,
    type: "ban" as const,
    date: ci.issueDate,
    dueDate: ci.dueDate,
    party: ci.entityName,
    status: (ci.status === "sent" ? "unpaid" : ci.status === "overdue" ? "unpaid" : ci.status) as InvoiceStatus,
    items: [{ id: "l1", name: ci.description || "Dịch vụ CRM", quantity: 1, unitPrice: ci.amount, vat: ci.tax, discount: 0 }],
    note: `[CRM] ${ci.entityType === "company" ? "Công ty" : "Lead"}: ${ci.entityName}`,
  }));
  const crmIds = new Set(crmInvoices.map((ci: CrmInvoice) => ci.id));

  const fmtAmount = (n: number) => n.toLocaleString("vi-VN") + " ₫";

  const openAddForm = (type: "ban" | "mua" = activeTab === "mua" ? "mua" : "ban") => {
    setEditingId(null); setFormData(emptyForm(type)); setFormErrors({}); setShowForm(true);
  };
  const openEditForm = (inv: Invoice) => {
    setEditingId(inv.id); setFormData(invoiceToForm(inv)); setFormErrors({}); setSelectedInvoice(null); setShowForm(true);
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.number.trim()) errs.number = "Bắt buộc";
    if (!formData.party.trim()) errs.party = "Bắt buộc";
    if (!formData.date.trim()) errs.date = "Bắt buộc";
    if (!formData.dueDate.trim()) errs.dueDate = "Bắt buộc";
    if (formData.items.length === 0) errs.items = "Cần ít nhất 1 dòng hàng hóa";
    formData.items.forEach((it, i) => {
      if (!it.name.trim()) errs[`item_name_${i}`] = "Bắt buộc";
      if (!it.unitPrice || parseFloat(it.unitPrice) <= 0) errs[`item_price_${i}`] = "Bắt buộc";
    });
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveForm = () => {
    // Prevent double-click/rapid save
    const now = Date.now();
    if (now - lastInvSaveRef.current < 300) return;
    lastInvSaveRef.current = now;

    if (!validateForm()) return;
    const mappedItems: InvoiceLineItem[] = formData.items.map(it => ({
      id: it.id, name: it.name.trim(),
      quantity: parseFloat(it.quantity) || 1,
      unitPrice: parseFloat(it.unitPrice) || 0,
      vat: parseFloat(it.vat) || 0,
      discount: parseFloat(it.discount) || 0,
    }));
    if (editingId) {
      setInvoices(prev => prev.map(i => i.id !== editingId ? i : { ...i, number: formData.number.trim(), party: formData.party.trim(), date: formData.date, dueDate: formData.dueDate, note: formData.note, items: mappedItems }));
      toast.success(`Đã cập nhật ${formData.number}`);
    } else {
      setInvoices(prev => [{ id: `inv-${Date.now()}`, number: formData.number.trim(), type: formData.type, date: formData.date, dueDate: formData.dueDate, party: formData.party.trim(), status: "draft", items: mappedItems, note: formData.note }, ...prev]);
      toast.success(`Đã tạo ${formData.number}`);
    }
    setShowForm(false); setEditingId(null);
  };

  const handleDelete = (inv: Invoice) => {
    if (!DELETABLE_STATUSES.includes(inv.status)) return;
    setInvoices(prev => prev.filter(i => i.id !== inv.id));
    setSelectedInvoice(null);
    setDeleteConfirmId(null);
    toast.success(`Đã xóa ${inv.number}`);
  };

  // Merge Finance invoices + CRM invoices (CRM are "ban" type, read-only in Finance)
  const allForDisplay = [...invoices, ...crmAsFinance];
  const filtered = allForDisplay.filter(inv => {
    if (activeTab === "ban" && inv.type !== "ban") return false;
    if (activeTab === "mua" && inv.type !== "mua") return false;
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    return true;
  });

  // Monthly summary for Lịch sử tab
  const monthlyData = (() => {
    const months = [
      { key: "01", label: "Tháng 1/2026" },
      { key: "02", label: "Tháng 2/2026" },
      { key: "03", label: "Tháng 3/2026" },
    ];
    return months.map(m => {
      const monthInvs = invoices.filter(inv => {
        const mm = inv.date.split("/")[1];
        return mm === m.key && inv.status === "paid";
      });
      const ban = monthInvs.filter(i => i.type === "ban").reduce((s, i) => s + calcInvoice(i).grand, 0);
      const mua = monthInvs.filter(i => i.type === "mua").reduce((s, i) => s + calcInvoice(i).grand, 0);
      return { label: m.label, ban, mua, diff: ban - mua };
    });
  })();

  const totalBan = monthlyData.reduce((s, m) => s + m.ban, 0);
  const totalMua = monthlyData.reduce((s, m) => s + m.mua, 0);

  const handleStatusChange = (inv: Invoice, next: InvoiceStatus) => {
    setInvoices(prev => prev.map(i => i.id !== inv.id ? i : { ...i, status: next }));
    const labels: Record<InvoiceStatus, string> = { draft: "Draft", unpaid: "Chưa thanh toán", partially_paid: "Thanh toán 1 phần", paid: "Đã thanh toán", cancelled: "Đã hủy" };
    toast.success(`${inv.number} → ${labels[next]}`);
    setSelectedInvoice(prev => prev?.id === inv.id ? { ...prev, status: next } : prev);
  };


  const tabs = [
    { key: "all" as const, label: "Tất cả" },
    { key: "ban" as const, label: "Hóa đơn bán" },
    { key: "mua" as const, label: "Hóa đơn mua" },
    { key: "history" as const, label: "Lịch sử" },
    { key: "partners" as const, label: "Đối tác" },
  ];

  const subFilters: { key: InvoiceStatus | "all"; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "draft", label: "Draft" },
    { key: "unpaid", label: "Chưa TT" },
    { key: "partially_paid", label: "Thanh toán 1 phần" },
    { key: "paid", label: "Đã thanh toán" },
    { key: "cancelled", label: "Đã hủy" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tabs — hidden when locked to a specific view */}
      {!locked && (
        <div className="flex gap-0 border-b border-gray-100 shrink-0 px-4 pt-3">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 text-[12px] font-medium border-b-2 transition-all ${
                activeTab === t.key
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Sub-filter pills + Add button */}
      {activeTab !== "history" && activeTab !== "partners" && activeTab !== "payments" && (
        <div className="flex items-center gap-1.5 px-4 py-2.5 flex-wrap shrink-0 border-b border-gray-50">
          <div className="flex gap-1.5 flex-wrap flex-1">
            {subFilters.map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                  statusFilter === f.key
                    ? "bg-cyan-500 text-white border-cyan-500"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {(statusFilter === "all" || statusFilter === "draft") && (
            <button
              onClick={() => openAddForm(activeTab === "mua" ? "mua" : "ban")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500 text-white text-[11px] font-semibold hover:bg-cyan-600 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm
            </button>
          )}
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "partners" ? (
          /* Partners tab */
          <div className="px-4 py-3">
            {/* Sub-filter */}
            <div className="flex gap-1.5 mb-3">
              {(["all", "customer", "vendor"] as const).map(f => (
                <button key={f} onClick={() => setPartnerTypeFilter(f)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${partnerTypeFilter === f ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}>
                  {f === "all" ? "Tất cả" : f === "customer" ? "Khách hàng" : "Nhà cung cấp"}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {financePartners.filter(p => partnerTypeFilter === "all" || p.type === partnerTypeFilter).map(partner => {
                const initials = partner.name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase().slice(0, 2);
                const bgColors: Record<string, string> = { active: "#0891b2", critical: "#dc2626", inactive: "#6b7280" };
                return (
                  <div key={partner.id} onClick={() => setSelectedPartner(partner)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 bg-white hover:border-cyan-200 hover:shadow-sm cursor-pointer transition-all">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[13px] font-bold shrink-0"
                      style={{ backgroundColor: bgColors[partner.status] }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-[12px] font-semibold text-gray-800 truncate">{partner.name}</p>
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-medium shrink-0 ${partner.type === "customer" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                          {partner.type === "customer" ? "KH" : "NCC"}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate">{partner.contact} · {partner.phone}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] font-bold text-gray-800">{fmtAmount(partner.totalAmount)}</p>
                      {partner.outstanding > 0 ? (
                        <p className="text-[10px] text-amber-600 font-medium">CN: {fmtAmount(partner.outstanding)}</p>
                      ) : (
                        <p className="text-[10px] text-emerald-600">Đã TT</p>
                      )}
                    </div>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${partner.status === "active" ? "bg-emerald-400" : partner.status === "critical" ? "bg-red-400" : "bg-gray-300"}`} />
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === "payments" ? (
          /* Payments tab */
          <div className="px-4 py-3 space-y-4">
            <div>
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Cần thanh toán</h3>
              <div className="space-y-2">
                {invoices.filter(inv => ["unpaid","partially_paid"].includes(inv.status))
                  .sort((a,b) => { const pd=(d:string)=>{const p=d.split("/");return new Date(+p[2],+p[1]-1,+p[0]).getTime();}; return pd(a.dueDate)-pd(b.dueDate); })
                  .map(inv => {
                    const sc = statusConfig[inv.status]; const isBan = inv.type === "ban";
                    const tot = calcInvoice(inv).grand;
                    return (
                      <div key={inv.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 bg-white">
                        <div className={`w-1 self-stretch rounded-full shrink-0 ${isBan ? "bg-green-400" : "bg-red-400"}`} style={{ minWidth: 3 }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-gray-800 truncate">{inv.number} · {inv.party}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-gray-500">Hạn: {inv.dueDate}</span>
                            <span className={`px-1.5 py-0.5 rounded-md text-[9px] border ${sc.bg} ${sc.color}`}>{sc.label}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-[12px] font-bold ${isBan ? "text-green-600" : "text-gray-800"}`}>{fmtAmount(tot)}</p>
                          <button onClick={() => handleStatusChange(inv, "paid")} className="mt-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-cyan-500 text-white hover:bg-cyan-600 transition-all">Đã thanh toán</button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Đã thanh toán</h3>
              <div className="space-y-2">
                {invoices.filter(inv => inv.status === "paid").map(inv => {
                  const isBan = inv.type === "ban"; const tot = calcInvoice(inv).grand;
                  return (
                    <div key={inv.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 bg-white">
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border shrink-0 ${isBan ? "bg-green-50 border-green-200 text-green-600" : "bg-red-50 border-red-200 text-red-500"}`}>{isBan ? "BÁN" : "MUA"}</span>
                      <div className="flex-1 min-w-0"><p className="text-[12px] font-semibold text-gray-800 truncate">{inv.party}</p><p className="text-[10px] text-gray-500">{inv.date} · {inv.number}</p></div>
                      <p className={`text-[12px] font-bold shrink-0 ${isBan ? "text-green-600" : "text-red-500"}`}>{isBan ? "+" : "-"}{fmtAmount(tot)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : activeTab === "history" ? (
          /* Lịch sử tab */
          <div className="px-4 py-4">
            <h3 className="text-[12px] text-gray-400 mb-3 uppercase tracking-wide font-semibold">Tổng hợp theo tháng (hóa đơn đã thanh toán)</h3>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Tháng</th>
                    <th className="text-right px-3 py-2.5 text-green-600 font-semibold">Doanh thu (bán)</th>
                    <th className="text-right px-3 py-2.5 text-red-500 font-semibold">Chi phí (mua)</th>
                    <th className="text-right px-3 py-2.5 text-gray-600 font-semibold">Chênh lệch</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((m, i) => {
                    const maxVal = Math.max(totalBan, totalMua, 1);
                    return (
                      <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="px-3 py-3">
                          <p className="font-medium text-gray-700">{m.label}</p>
                          <div className="mt-1.5 flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-green-600 w-6">Bán</span>
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-400 rounded-full" style={{ width: `${Math.round(m.ban/maxVal*100)}%` }} /></div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-red-500 w-6">Mua</span>
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.round(m.mua/maxVal*100)}%` }} /></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right text-green-600 font-medium">{m.ban > 0 ? fmtAmount(m.ban) : "—"}</td>
                        <td className="px-3 py-3 text-right text-red-500 font-medium">{m.mua > 0 ? fmtAmount(m.mua) : "—"}</td>
                        <td className={`px-3 py-3 text-right font-semibold ${m.diff >= 0 ? "text-green-600" : "text-red-500"}`}>{m.diff >= 0 ? "+" : ""}{fmtAmount(m.diff)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td className="px-3 py-2.5 font-bold text-gray-700">Tổng cộng</td>
                    <td className="px-3 py-2.5 text-right font-bold text-green-600">{fmtAmount(totalBan)}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-red-500">{fmtAmount(totalMua)}</td>
                    <td className={`px-3 py-2.5 text-right font-bold ${totalBan-totalMua >= 0 ? "text-green-600" : "text-red-500"}`}>{totalBan-totalMua >= 0 ? "+" : ""}{fmtAmount(totalBan-totalMua)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          /* Invoice list */
          <div className="px-4 py-3 space-y-2">
            {filtered.length === 0 && <div className="text-center py-10 text-gray-400 text-[13px]">Không có hóa đơn nào</div>}
            {filtered.map(inv => {
              const sc = statusConfig[inv.status]; const isBan = inv.type === "ban";
              const tot = calcInvoice(inv).grand;
              const isFromCRM = crmIds.has(inv.id);
              const canEdit = !isFromCRM && EDITABLE_STATUSES.includes(inv.status);
              const canDel  = !isFromCRM && DELETABLE_STATUSES.includes(inv.status);
              return (
                <div key={inv.id} className={`group flex items-start gap-0 rounded-xl border bg-white hover:shadow-sm transition-all overflow-hidden ${isFromCRM ? "border-violet-100 hover:border-violet-200" : "border-gray-100 hover:border-cyan-200"}`}>
                  <div className={`w-1 self-stretch shrink-0 ${isFromCRM ? "bg-violet-400" : isBan ? "bg-green-400" : "bg-blue-400"}`} />
                  <div className="flex-1 px-3 py-2.5 min-w-0 cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[12px] font-semibold text-gray-800 truncate">{inv.number}</p>
                          {isFromCRM && <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-violet-50 border border-violet-200 text-violet-600 shrink-0">CRM</span>}
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">{inv.party}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`text-[13px] font-bold ${isBan ? "text-green-600" : "text-gray-800"}`}>{isBan ? "+" : ""}{fmtAmount(tot)}</p>
                        <p className="text-[10px] text-gray-400">Hạn {inv.dueDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border shrink-0 ${isBan ? "bg-green-50 border-green-200 text-green-600" : "bg-blue-50 border-blue-200 text-blue-600"}`}>{isBan ? "BÁN" : "MUA"}</span>
                      <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] border ${sc.bg} ${sc.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} shrink-0`} />{sc.label}
                      </span>
                      {!isFromCRM && <span className="text-[10px] text-gray-400">{inv.items.length} dòng</span>}
                      {isFromCRM && <span className="text-[10px] text-violet-400">Từ CRM</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 pr-2 self-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {canEdit && <button onClick={e=>{e.stopPropagation();openEditForm(inv);}} title="Chỉnh sửa" className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>}
                    {canDel  && <button onClick={e=>{e.stopPropagation();setDeleteConfirmId(inv.id);}} title="Xóa" className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoice detail modal */}
      {selectedInvoice && !deleteConfirmId && (() => {
        const inv = selectedInvoice; const isBan = inv.type === "ban"; const sc = statusConfig[inv.status];
        const tot = calcInvoice(inv);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setSelectedInvoice(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-[560px] max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${isBan ? "bg-green-50 border-green-200 text-green-600" : "bg-blue-50 border-blue-200 text-blue-600"}`}>{isBan ? "BÁN" : "MUA"}</span>
                  <span className="text-[15px] font-bold text-gray-900">{inv.number}</span>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sc.bg} ${sc.color}`}><span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}/>{sc.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  {EDITABLE_STATUSES.includes(inv.status) && <button onClick={() => openEditForm(inv)} title="Chỉnh sửa" className="w-8 h-8 rounded-lg hover:bg-cyan-50 flex items-center justify-center text-gray-400 hover:text-cyan-600 transition-all"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>}
                  {DELETABLE_STATUSES.includes(inv.status) && <button onClick={() => setDeleteConfirmId(inv.id)} title="Xóa" className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-600 transition-all"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>}
                  <button onClick={() => setSelectedInvoice(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="px-5 py-4 space-y-5">
                {/* A. Thông tin chung */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">A. Thông tin chung</p>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                      <p className="text-[10px] text-gray-400 mb-0.5 font-medium">Ngày tạo</p>
                      <p className="text-[12px] font-semibold text-gray-700">{inv.date}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                      <p className="text-[10px] text-gray-400 mb-0.5 font-medium">Ngày đến hạn</p>
                      <p className="text-[12px] font-semibold text-gray-700">{inv.dueDate}</p>
                    </div>
                    <div className={`rounded-xl border px-3 py-2.5 ${sc.bg}`}>
                      <p className="text-[10px] text-gray-400 mb-0.5 font-medium">Trạng thái</p>
                      <p className={`text-[12px] font-semibold ${sc.color}`}>{sc.label}</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 px-3.5 py-2.5">
                    <p className="text-[10px] text-gray-400 mb-0.5 font-medium">{isBan ? "Khách hàng" : "Nhà cung cấp"}</p>
                    <p className="text-[13px] font-semibold text-gray-800">{inv.party}</p>
                  </div>
                  {inv.note && <p className="text-[11px] text-gray-500 mt-2 italic">{inv.note}</p>}
                </div>

                {/* B. Danh sách chi tiết (Line Items) */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">B. Danh sách hàng hóa / dịch vụ</p>
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-3 py-2 text-gray-500 font-semibold">Tên</th>
                          <th className="text-right px-2 py-2 text-gray-500 font-semibold">SL</th>
                          <th className="text-right px-2 py-2 text-gray-500 font-semibold">Đơn giá</th>
                          <th className="text-right px-2 py-2 text-gray-500 font-semibold">CK%</th>
                          <th className="text-right px-2 py-2 text-gray-500 font-semibold">VAT%</th>
                          <th className="text-right px-3 py-2 text-gray-500 font-semibold">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inv.items.map(it => {
                          const c = calcLine(it);
                          return (
                            <tr key={it.id} className="border-b border-gray-50 last:border-0">
                              <td className="px-3 py-2 text-gray-800 font-medium">{it.name}</td>
                              <td className="px-2 py-2 text-right text-gray-600">{it.quantity}</td>
                              <td className="px-2 py-2 text-right text-gray-600">{it.unitPrice.toLocaleString("vi-VN")}</td>
                              <td className="px-2 py-2 text-right text-gray-500">{it.discount > 0 ? `${it.discount}%` : "—"}</td>
                              <td className="px-2 py-2 text-right text-gray-500">{it.vat > 0 ? `${it.vat}%` : "0%"}</td>
                              <td className="px-3 py-2 text-right font-semibold text-gray-800">{fmtAmount(c.total)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* C. Tổng tiền */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">C. Tổng tiền</p>
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="flex justify-between px-4 py-2.5 border-b border-gray-100">
                      <span className="text-[12px] text-gray-500">Tổng tiền trước thuế</span>
                      <span className="text-[12px] font-medium text-gray-700">{fmtAmount(tot.sub)}</span>
                    </div>
                    {tot.disc > 0 && <div className="flex justify-between px-4 py-2.5 border-b border-gray-100">
                      <span className="text-[12px] text-gray-500">Giảm giá</span>
                      <span className="text-[12px] font-medium text-red-500">- {fmtAmount(tot.disc)}</span>
                    </div>}
                    <div className="flex justify-between px-4 py-2.5 border-b border-gray-100">
                      <span className="text-[12px] text-gray-500">VAT (tổng)</span>
                      <span className="text-[12px] font-medium text-gray-700">+ {fmtAmount(tot.tax)}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3 bg-gray-50">
                      <span className="text-[13px] font-bold text-gray-800">Tổng thanh toán</span>
                      <span className={`text-[16px] font-bold ${isBan ? "text-green-600" : "text-gray-900"}`}>{fmtAmount(tot.grand)}</span>
                    </div>
                  </div>
                </div>

                {/* Status actions */}
                <div className="space-y-2">
                  {inv.status === "draft" && (
                    <button onClick={() => handleStatusChange(inv, "unpaid")} className="w-full py-2.5 rounded-xl text-[13px] font-semibold bg-cyan-500 text-white hover:bg-cyan-600 transition-all">Gửi hóa đơn → Chưa thanh toán</button>
                  )}
                  {(inv.status === "unpaid" || inv.status === "partially_paid") && (
                    <div className="flex gap-2">
                      <button onClick={() => handleStatusChange(inv, "cancelled")} className="px-4 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">Hủy HĐ</button>
                    </div>
                  )}
                  {inv.status === "paid" && <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200"><CheckCircle2 className="w-4 h-4 text-green-500"/><span className="text-[12px] text-green-700 font-medium">Hóa đơn đã được thanh toán đầy đủ</span></div>}
                  {inv.status === "cancelled" && <div className={`px-4 py-3 rounded-xl border text-center text-[12px] font-medium ${sc.bg} ${sc.color}`}>Hóa đơn đã bị hủy</div>}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete confirmation modal */}
      {deleteConfirmId && (() => {
        const inv = invoices.find(i => i.id === deleteConfirmId);
        if (!inv) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteConfirmId(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-[380px] mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-gray-900">Xóa hóa đơn?</p>
                    <p className="text-[12px] text-gray-500">{inv.number} · {inv.party}</p>
                  </div>
                </div>
                <p className="text-[12px] text-gray-600 leading-relaxed bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                  Thao tác này không thể hoàn tác. Hóa đơn sẽ bị xóa vĩnh viễn khỏi hệ thống.
                </p>
              </div>
              <div className="flex gap-2 px-5 pb-5">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleDelete(inv)}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold bg-red-500 text-white hover:bg-red-600 transition-all"
                >
                  Xóa hóa đơn
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add / Edit Invoice modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="text-[15px] font-bold text-gray-900">{editingId ? "Chỉnh sửa hóa đơn" : "Tạo hóa đơn mới"}</p>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Type selector */}
              {!editingId && (
                <div className="flex gap-2">
                  {(["ban", "mua"] as const).map(t => (
                    <button key={t} onClick={() => setFormData(p => ({ ...p, type: t }))}
                      className={`flex-1 py-2 rounded-xl text-[12px] font-semibold border transition-all ${formData.type === t ? (t === "ban" ? "bg-green-500 text-white border-green-500" : "bg-blue-500 text-white border-blue-500") : "bg-white text-gray-500 border-gray-200"}`}>
                      {t === "ban" ? "⬆️ Hóa đơn bán" : "⬇️ Hóa đơn mua"}
                    </button>
                  ))}
                </div>
              )}

              {/* Header info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Mã hóa đơn <span className="text-red-400">*</span></label>
                  <input value={formData.number} onChange={e => setFormData(p=>({...p,number:e.target.value}))} placeholder="HĐ-2026-040"
                    className={`w-full px-3 py-2 rounded-xl border text-[12px] outline-none focus:ring-2 focus:ring-cyan-300 ${formErrors.number ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"}`} />
                  {formErrors.number && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.number}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">{formData.type === "ban" ? "Khách hàng" : "Nhà cung cấp"} <span className="text-red-400">*</span></label>
                  <input value={formData.party} onChange={e => setFormData(p=>({...p,party:e.target.value}))} placeholder="Tên đối tác"
                    className={`w-full px-3 py-2 rounded-xl border text-[12px] outline-none focus:ring-2 focus:ring-cyan-300 ${formErrors.party ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"}`} />
                  {formErrors.party && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.party}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Ngày tạo <span className="text-red-400">*</span></label>
                  <input value={formData.date} onChange={e => setFormData(p=>({...p,date:e.target.value}))} placeholder="DD/MM/YYYY"
                    className={`w-full px-3 py-2 rounded-xl border text-[12px] outline-none focus:ring-2 focus:ring-cyan-300 ${formErrors.date ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"}`} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Ngày đến hạn <span className="text-red-400">*</span></label>
                  <input value={formData.dueDate} onChange={e => setFormData(p=>({...p,dueDate:e.target.value}))} placeholder="DD/MM/YYYY"
                    className={`w-full px-3 py-2 rounded-xl border text-[12px] outline-none focus:ring-2 focus:ring-cyan-300 ${formErrors.dueDate ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"}`} />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Danh sách hàng hóa / dịch vụ <span className="text-red-400">*</span></label>
                  <button onClick={() => setFormData(p => ({...p, items: [...p.items, newLineItem()]}))}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] text-gray-600 font-medium transition-all">
                    <Plus className="w-3 h-3"/> Thêm dòng
                  </button>
                </div>
                {formErrors.items && <p className="text-[10px] text-red-500 mb-1">{formErrors.items}</p>}
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  {/* Column headers */}
                  <div className="grid bg-gray-50 border-b border-gray-100 text-[10px] font-semibold text-gray-500 px-3 py-1.5" style={{gridTemplateColumns:"1fr 60px 110px 52px 52px 28px"}}>
                    <span>Tên SP/DV</span><span className="text-center">SL</span><span className="text-right">Đơn giá</span><span className="text-center">CK%</span><span className="text-center">VAT%</span><span/>
                  </div>
                  {formData.items.map((it, i) => {
                    const q = parseFloat(it.quantity)||0, p2 = parseFloat(it.unitPrice)||0, d = parseFloat(it.discount)||0, v = parseFloat(it.vat)||0;
                    const sub = q*p2, da = sub*d/100, ta = (sub-da)*v/100, tot2 = sub-da+ta;
                    return (
                      <div key={it.id} className="border-b border-gray-50 last:border-0">
                        <div className="grid items-center gap-1 px-2 py-1.5" style={{gridTemplateColumns:"1fr 60px 110px 52px 52px 28px"}}>
                          <input value={it.name} onChange={e => setFormData(p=>({...p,items:p.items.map((x,j)=>j===i?{...x,name:e.target.value}:x)}))}
                            placeholder="Tên sản phẩm / dịch vụ"
                            className={`px-2 py-1.5 rounded-lg border text-[11px] outline-none focus:ring-1 focus:ring-cyan-300 ${formErrors[`item_name_${i}`] ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"}`} />
                          <input value={it.quantity} onChange={e => setFormData(p=>({...p,items:p.items.map((x,j)=>j===i?{...x,quantity:e.target.value}:x)}))}
                            className="px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-[11px] text-center outline-none focus:ring-1 focus:ring-cyan-300" />
                          <input value={it.unitPrice} onChange={e => setFormData(p=>({...p,items:p.items.map((x,j)=>j===i?{...x,unitPrice:e.target.value.replace(/[^0-9]/g,"")}:x)}))}
                            placeholder="0"
                            className={`px-2 py-1.5 rounded-lg border text-[11px] text-right outline-none focus:ring-1 focus:ring-cyan-300 ${formErrors[`item_price_${i}`] ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"}`} />
                          <input value={it.discount} onChange={e => setFormData(p=>({...p,items:p.items.map((x,j)=>j===i?{...x,discount:e.target.value}:x)}))}
                            className="px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-[11px] text-center outline-none focus:ring-1 focus:ring-cyan-300" />
                          <select value={it.vat} onChange={e => setFormData(p=>({...p,items:p.items.map((x,j)=>j===i?{...x,vat:e.target.value}:x)}))}
                            className="px-1 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-[11px] text-center outline-none focus:ring-1 focus:ring-cyan-300">
                            <option value="0">0%</option><option value="5">5%</option><option value="10">10%</option>
                          </select>
                          <button onClick={() => setFormData(p=>({...p,items:p.items.filter((_,j)=>j!==i)}))}
                            disabled={formData.items.length <= 1}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                        {tot2 > 0 && <p className="text-[10px] text-gray-400 px-3 pb-1">Thành tiền: <span className="font-semibold text-gray-600">{tot2.toLocaleString("vi-VN")} ₫</span></p>}
                      </div>
                    );
                  })}
                  {/* Summary row */}
                  {(() => { const t = calcFormTotals(formData.items); return t.grand > 0 ? (
                    <div className="bg-gray-50 border-t border-gray-200 px-3 py-2 space-y-0.5">
                      <div className="flex justify-between text-[11px]"><span className="text-gray-500">Tổng trước thuế</span><span className="text-gray-700 font-medium">{t.sub.toLocaleString("vi-VN")} ₫</span></div>
                      {t.disc > 0 && <div className="flex justify-between text-[11px]"><span className="text-gray-500">Giảm giá</span><span className="text-red-500 font-medium">- {t.disc.toLocaleString("vi-VN")} ₫</span></div>}
                      <div className="flex justify-between text-[11px]"><span className="text-gray-500">VAT</span><span className="text-gray-700 font-medium">+ {t.tax.toLocaleString("vi-VN")} ₫</span></div>
                      <div className="flex justify-between text-[12px] font-bold border-t border-gray-200 pt-1 mt-0.5"><span className="text-gray-800">Tổng thanh toán</span><span className="text-cyan-600">{t.grand.toLocaleString("vi-VN")} ₫</span></div>
                    </div>
                  ) : null; })()}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Ghi chú</label>
                <textarea value={formData.note} onChange={e => setFormData(p=>({...p,note:e.target.value}))} placeholder="Ghi chú..." rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-[12px] text-gray-800 outline-none focus:ring-2 focus:ring-cyan-300 resize-none" />
              </div>

              {/* Footer buttons */}
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">Hủy</button>
                <button onClick={handleSaveForm} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold bg-cyan-500 text-white hover:bg-cyan-600 transition-all">{editingId ? "Lưu thay đổi" : "Tạo hóa đơn"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Partner detail modal */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setSelectedPartner(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[85vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: selectedPartner.status === "critical" ? "#dc2626" : "#0891b2" }}>
                  {selectedPartner.name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p className="text-[14px] font-bold text-gray-800">{selectedPartner.name}</p>
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-medium ${selectedPartner.type === "customer" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                    {selectedPartner.type === "customer" ? "Khách hàng" : "Nhà cung cấp"}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedPartner(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-3.5 py-2.5">
                  <p className="text-[10px] text-gray-400 mb-0.5">Liên hệ</p>
                  <p className="text-[12px] font-semibold text-gray-800">{selectedPartner.contact}</p>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-3.5 py-2.5">
                  <p className="text-[10px] text-gray-400 mb-0.5">Điện thoại</p>
                  <p className="text-[12px] font-semibold text-gray-800">{selectedPartner.phone}</p>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-3.5 py-2.5 col-span-2">
                  <p className="text-[10px] text-gray-400 mb-0.5">Email</p>
                  <p className="text-[12px] font-semibold text-gray-800">{selectedPartner.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5">
                  <p className="text-[10px] text-blue-600 mb-0.5">Tổng giao dịch</p>
                  <p className="text-[13px] font-bold text-blue-700">{fmtAmount(selectedPartner.totalAmount)}</p>
                </div>
                <div className={`rounded-xl border px-3 py-2.5 ${selectedPartner.outstanding > 0 ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100"}`}>
                  <p className={`text-[10px] mb-0.5 ${selectedPartner.outstanding > 0 ? "text-amber-600" : "text-emerald-600"}`}>Công nợ</p>
                  <p className={`text-[13px] font-bold ${selectedPartner.outstanding > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                    {selectedPartner.outstanding > 0 ? fmtAmount(selectedPartner.outstanding) : "Đã TT"}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                  <p className="text-[10px] text-gray-400 mb-0.5">Hoá đơn</p>
                  <p className="text-[13px] font-bold text-gray-700">{selectedPartner.invoiceCount}</p>
                </div>
              </div>
              <div>
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Hóa đơn liên quan</h3>
                <div className="space-y-2">
                  {invoices.filter(inv => inv.party.includes(selectedPartner.name.split(" ").slice(-1)[0]) || selectedPartner.name.includes(inv.party.split(" ").slice(-1)[0])).map(inv => {
                    const sc = statusConfig[inv.status]; const tot = calcInvoice(inv).grand;
                    return (
                      <div key={inv.id} onClick={() => { setSelectedInvoice(inv); setSelectedPartner(null); }}
                        className="flex items-center justify-between px-3 py-2 rounded-xl border border-gray-100 bg-gray-50 hover:border-cyan-200 hover:bg-cyan-50 cursor-pointer transition-all">
                        <div>
                          <p className="text-[11px] font-semibold text-cyan-700 underline underline-offset-2">{inv.number}</p>
                          <p className="text-[10px] text-gray-500">{inv.date} · {inv.items.length} dòng</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-bold text-gray-700">{fmtAmount(tot)}</p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md border ${sc.bg} ${sc.color}`}>{sc.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════ Props ═══════════ */
type CustomAnnouncement = { id: string; name: string; emoji: string; subtitle: string; category: string; badge: string; description: string; stats: { label: string; value: string }[]; attachment: string; createdAt: string; publishedBy?: string };

interface ChannelItemDetailViewProps {
  channelId: string;
  itemId: string;
  onClose: () => void;
  onNavigate?: (id: string) => void;
  canNavBack?: boolean;
  canNavForward?: boolean;
  onNavBack?: () => void;
  onNavForward?: () => void;
  customAnnouncements?: CustomAnnouncement[];
  savedItems?: Set<string>;
  likedItems?: Set<string>;
  registeredItems?: Set<string>;
  onToggleSave?: (id: string) => void;
  onToggleLike?: (id: string) => void;
  onToggleRegister?: (id: string) => void;
  closedPolls?: Set<string>;
  onTogglePollClosed?: (id: string) => void;
}

/* ═══════════ CRM Data ═══════════ */
const crmFmt = (n: number) =>
  n >= 1_000_000_000 ? (n / 1_000_000_000).toFixed(1) + " tỷ"
  : n >= 1_000_000   ? (n / 1_000_000).toFixed(0) + " tr"
  : n.toLocaleString("vi-VN");

interface CrmCompany {
  id: string; name: string; industry: string; size: string; website: string;
  phone: string; owner: string; status: "customer"|"prospect"|"inactive";
  revenue: number; contacts: number; createdAt: string;
}
interface CrmContact {
  id: string; companyId: string; companyName: string; name: string; title: string;
  email: string; phone: string; status: "active"|"inactive"; owner: string; lastContact: string;
  avatar: string; tier: "normal"|"vip";
}
interface CrmLead {
  id: string; name: string; company: string; email: string; phone: string;
  source: string; stage: "new"|"contacted"|"qualified"|"proposal"|"won"|"lost";
  score: number; value: number; owner: string; createdAt: string; avatar: string;
}
interface CrmOpportunity {
  id: string; title: string; companyId: string; companyName: string;
  contactName: string; value: number;
  stage: "new"|"contacted"|"proposal"|"negotiation"|"won"|"lost";
  probability: number; closeDate: string; owner: string; avatar: string;
}
interface CrmActivity {
  id: string; type: "call"|"meeting"|"email"|"note"|"task";
  entityType: "lead"|"opportunity"|"contact"|"company";
  entityId: string; entityName: string; title: string; description: string;
  date: string; status: string; owner: string; priority?: string; dueDate?: string;
}

const crmCompanies: CrmCompany[] = [
  { id:"co1", name:"TechVision JSC",    industry:"CNTT",        size:"50-200",  website:"techvision.vn",  phone:"028 1234 5678", owner:"Phạm Thu Hà",   status:"customer",  revenue:450_000_000,  contacts:3, createdAt:"10/01/2025" },
  { id:"co2", name:"Saigon Foods Corp", industry:"F&B",         size:"200-500", website:"saigonfood.vn",  phone:"028 8765 4321", owner:"Lê Văn Nam",    status:"customer",  revenue:1_200_000_000,contacts:2, createdAt:"05/06/2024" },
  { id:"co3", name:"FPT Software",      industry:"CNTT",        size:"1000+",   website:"fpt.com",        phone:"028 7300 7300", owner:"Nguyễn Lan Anh",status:"customer",  revenue:3_500_000_000,contacts:4, createdAt:"12/03/2024" },
  { id:"co4", name:"Vinamilk",          industry:"FMCG",        size:"1000+",   website:"vinamilk.com.vn",phone:"028 5416 5888", owner:"Trần Đức Minh", status:"customer",  revenue:2_800_000_000,contacts:3, createdAt:"20/01/2024" },
  { id:"co5", name:"Masan Group",       industry:"FMCG",        size:"500-1000",website:"masan.vn",       phone:"028 3930 0631", owner:"Lê Văn Nam",    status:"prospect",  revenue:950_000_000,  contacts:2, createdAt:"03/12/2024" },
  { id:"co6", name:"An Phat Holdings",  industry:"Sản xuất",    size:"200-500", website:"anphat.vn",      phone:"0225 3855 555", owner:"Nguyễn Lan Anh",status:"prospect",  revenue:620_000_000,  contacts:1, createdAt:"15/11/2024" },
  { id:"co7", name:"Startup XYZ",       industry:"Startup",     size:"<50",     website:"xyz.io",         phone:"0912 345 678",  owner:"Phạm Thu Hà",   status:"prospect",  revenue:80_000_000,   contacts:1, createdAt:"01/02/2025" },
  { id:"co8", name:"Bamboo Airways",    industry:"Hàng không",  size:"500-1000",website:"bambooairway.vn",phone:"028 7107 0888", owner:"Trần Đức Minh", status:"inactive",  revenue:180_000_000,  contacts:2, createdAt:"08/07/2023" },
  { id:"co9", name:"VietJet Air",       industry:"Hàng không",  size:"1000+",   website:"vietjetair.com", phone:"028 3827 6600", owner:"Phạm Thu Hà",   status:"inactive",  revenue:320_000_000,  contacts:2, createdAt:"14/04/2023" },
];

const crmContacts: CrmContact[] = [
  { id:"ct1", companyId:"co1", companyName:"TechVision JSC",    name:"Nguyễn Minh Tuấn",  title:"CTO",             email:"tuan@techvision.vn",    phone:"0912 345 678", status:"active",   owner:"Phạm Thu Hà",   lastContact:"2 ngày trước",  avatar:"NT", tier:"normal" },
  { id:"ct2", companyId:"co2", companyName:"Saigon Foods",      name:"Trần Thị Mai",       title:"Giám đốc mua hàng",email:"mai@saigonfood.vn",     phone:"0987 654 321", status:"active",   owner:"Lê Văn Nam",    lastContact:"Hôm nay",       avatar:"TM", tier:"vip" },
  { id:"ct3", companyId:"co3", companyName:"FPT Software",      name:"Phạm Quang Đức",     title:"VP Engineering",  email:"duc@fpt.com",           phone:"0963 111 222", status:"active",   owner:"Nguyễn Lan Anh",lastContact:"1 ngày trước",  avatar:"PD", tier:"vip" },
  { id:"ct4", companyId:"co4", companyName:"Vinamilk",          name:"Lê Thị Hoa",         title:"IT Director",     email:"hoa@vinamilk.com",      phone:"0978 888 999", status:"active",   owner:"Trần Đức Minh", lastContact:"3 ngày trước",  avatar:"LH", tier:"vip" },
  { id:"ct5", companyId:"co5", companyName:"Masan Group",       name:"Hoàng Thị Lan",      title:"Tech Lead",       email:"lan@masan.vn",          phone:"0932 456 789", status:"active",   owner:"Lê Văn Nam",    lastContact:"1 tuần trước",  avatar:"HL", tier:"normal" },
  { id:"ct6", companyId:"co6", companyName:"An Phat Holdings",  name:"Bùi Văn An",         title:"CISO",            email:"an@anphat.vn",          phone:"0945 678 901", status:"active",   owner:"Nguyễn Lan Anh",lastContact:"2 ngày trước",  avatar:"BA", tier:"normal" },
  { id:"ct7", companyId:"co7", companyName:"Startup XYZ",       name:"Võ Thanh Long",      title:"CEO",             email:"long@xyz.io",           phone:"0901 234 567", status:"active",   owner:"Phạm Thu Hà",   lastContact:"5 ngày trước",  avatar:"VL", tier:"normal" },
  { id:"ct8", companyId:"co8", companyName:"Bamboo Airways",    name:"Đỗ Thị Thanh",       title:"IT Manager",      email:"thanh@bamboo.vn",       phone:"0956 789 012", status:"inactive", owner:"Trần Đức Minh", lastContact:"2 tháng trước", avatar:"DT", tier:"normal" },
  { id:"ct9", companyId:"co9", companyName:"VietJet Air",       name:"Ngô Văn Hùng",       title:"CTO",             email:"hung@vietjet.com",      phone:"0967 890 123", status:"inactive", owner:"Phạm Thu Hà",   lastContact:"45 ngày trước", avatar:"NH", tier:"normal" },
  { id:"ct10",companyId:"co3", companyName:"FPT Software",      name:"Trần Bình",          title:"Project Manager", email:"binh@fpt.com",          phone:"0977 222 333", status:"active",   owner:"Nguyễn Lan Anh",lastContact:"4 ngày trước",  avatar:"TB", tier:"normal" },
  { id:"ct11",companyId:"co1", companyName:"TechVision JSC",    name:"Phạm Lan",           title:"Head of Sales",   email:"lan@techvision.vn",     phone:"0988 444 555", status:"active",   owner:"Phạm Thu Hà",   lastContact:"1 tuần trước",  avatar:"PL", tier:"normal" },
  { id:"ct12",companyId:"co4", companyName:"Vinamilk",          name:"Nguyễn Hoài Nam",    title:"Procurement Mgr", email:"hoainam@vinamilk.com",  phone:"0911 666 777", status:"active",   owner:"Trần Đức Minh", lastContact:"6 ngày trước",  avatar:"NH", tier:"normal" },
];

const crmLeads: CrmLead[] = [
  { id:"ld1", name:"Đinh Văn Khoa",   company:"Nova Group",       email:"khoa@nova.vn",       phone:"0933 111 222", source:"Website",      stage:"new",       score:72, value:800_000_000,  owner:"Phạm Thu Hà",   createdAt:"10/04/2026", avatar:"DK" },
  { id:"ld2", name:"Lý Thị Thu",      company:"GreenTech VN",     email:"thu@greentech.vn",   phone:"0944 333 444", source:"Referral",     stage:"new",       score:65, value:350_000_000,  owner:"Lê Văn Nam",    createdAt:"11/04/2026", avatar:"LT" },
  { id:"ld3", name:"Trần Công Minh",  company:"Đất Xanh Group",   email:"minh@datxanh.vn",    phone:"0955 555 666", source:"LinkedIn",     stage:"new",       score:80, value:1_200_000_000,owner:"Nguyễn Lan Anh",createdAt:"12/04/2026", avatar:"TM" },
  { id:"ld4", name:"Nguyễn Thu Hằng", company:"VNG Corporation",  email:"hang@vng.vn",        phone:"0966 777 888", source:"Cold email",   stage:"contacted", score:55, value:600_000_000,  owner:"Trần Đức Minh", createdAt:"05/04/2026", avatar:"NH" },
  { id:"ld5", name:"Phạm Hữu Nghĩa",  company:"Thế Giới Di Động", email:"nghia@tgdd.vn",      phone:"0977 999 000", source:"Exhibition",   stage:"contacted", score:88, value:2_000_000_000,owner:"Phạm Thu Hà",   createdAt:"06/04/2026", avatar:"PN" },
  { id:"ld6", name:"Bùi Thị Hương",   company:"Hoa Sen Group",    email:"huong@hoasen.vn",    phone:"0988 001 002", source:"Referral",     stage:"contacted", score:61, value:450_000_000,  owner:"Lê Văn Nam",    createdAt:"07/04/2026", avatar:"BH" },
  { id:"ld7", name:"Hoàng Anh Tuấn",  company:"Viettel",          email:"tuan@viettel.vn",    phone:"0999 003 004", source:"Inbound call", stage:"qualified", score:91, value:5_000_000_000,owner:"Nguyễn Lan Anh",createdAt:"01/04/2026", avatar:"HT" },
  { id:"ld8", name:"Đặng Thị Nga",    company:"BIDV",             email:"nga@bidv.vn",        phone:"0911 005 006", source:"Website",      stage:"qualified", score:78, value:1_800_000_000,owner:"Trần Đức Minh", createdAt:"02/04/2026", avatar:"DN" },
  { id:"ld9", name:"Vũ Tiến Dũng",    company:"Techcombank",      email:"dung@tcb.vn",        phone:"0922 007 008", source:"LinkedIn",     stage:"qualified", score:84, value:2_500_000_000,owner:"Phạm Thu Hà",   createdAt:"03/04/2026", avatar:"VD" },
];

const crmOpportunities: CrmOpportunity[] = [
  { id:"op1", title:"Triển khai ERP VinGroup",       companyId:"co4", companyName:"VinGroup",        contactName:"Lê Thị Hoa",   value:2_500_000_000, stage:"new",         probability:20, closeDate:"30/06/2026", owner:"Phạm Thu Hà",   avatar:"VG" },
  { id:"op2", title:"Nâng cấp CRM FPT",              companyId:"co3", companyName:"FPT Software",    contactName:"Phạm Q.Đức",   value:850_000_000,   stage:"new",         probability:25, closeDate:"15/05/2026", owner:"Nguyễn Lan Anh",avatar:"FP" },
  { id:"op3", title:"Cloud Migration Masan",         companyId:"co5", companyName:"Masan Group",     contactName:"Hoàng T.Lan",  value:1_400_000_000, stage:"contacted",   probability:40, closeDate:"20/05/2026", owner:"Lê Văn Nam",    avatar:"MS" },
  { id:"op4", title:"SaaS License TechVision",       companyId:"co1", companyName:"TechVision JSC",  contactName:"Ng.M.Tuấn",    value:360_000_000,   stage:"contacted",   probability:55, closeDate:"30/04/2026", owner:"Phạm Thu Hà",   avatar:"TV" },
  { id:"op5", title:"Data Analytics Saigon Foods",   companyId:"co2", companyName:"Saigon Foods",    contactName:"Trần Thị Mai", value:680_000_000,   stage:"proposal",    probability:65, closeDate:"10/05/2026", owner:"Lê Văn Nam",    avatar:"SF" },
  { id:"op6", title:"Security Audit An Phat",        companyId:"co6", companyName:"An Phat Holdings",contactName:"Bùi Văn An",   value:480_000_000,   stage:"proposal",    probability:70, closeDate:"25/04/2026", owner:"Nguyễn Lan Anh",avatar:"AP" },
  { id:"op7", title:"Bảo mật hệ thống Vinamilk",    companyId:"co4", companyName:"Vinamilk",        contactName:"Lê Thị Hoa",   value:920_000_000,   stage:"negotiation", probability:80, closeDate:"20/04/2026", owner:"Trần Đức Minh", avatar:"VL" },
  { id:"op8", title:"Helpdesk System Bamboo",        companyId:"co8", companyName:"Bamboo Airways",  contactName:"Đỗ T.Thanh",   value:290_000_000,   stage:"won",         probability:100,closeDate:"01/03/2026", owner:"Trần Đức Minh", avatar:"BA" },
  { id:"op9", title:"Mobile App VietJet",            companyId:"co9", companyName:"VietJet Air",     contactName:"Ngô V.Hùng",   value:650_000_000,   stage:"won",         probability:100,closeDate:"15/02/2026", owner:"Phạm Thu Hà",   avatar:"VJ" },
];

const crmActivitiesData: CrmActivity[] = [
  { id:"av1",  type:"call",    entityType:"opportunity", entityId:"op7", entityName:"Vinamilk",        title:"Gọi xác nhận điều khoản hợp đồng",       description:"Hai bên thống nhất SLA 99.9%, triển khai 3 tháng.",       date:"15/04/2026", status:"done",      owner:"Trần Đức Minh" },
  { id:"av2",  type:"meeting", entityType:"opportunity", entityId:"op5", entityName:"Saigon Foods",    title:"Demo Analytics Dashboard",                description:"Khách hàng hài lòng, yêu cầu thêm module export Excel.", date:"14/04/2026", status:"done",      owner:"Lê Văn Nam" },
  { id:"av3",  type:"email",   entityType:"lead",        entityId:"ld7", entityName:"Viettel",         title:"Gửi đề xuất gói Enterprise",              description:"Đã gửi proposal 3 gói: Basic / Pro / Enterprise.",        date:"13/04/2026", status:"sent",      owner:"Nguyễn Lan Anh" },
  { id:"av4",  type:"note",    entityType:"contact",     entityId:"ct3", entityName:"Phạm Quang Đức",  title:"Ghi chú sau buổi gặp",                   description:"Anh Đức muốn demo thêm tính năng CI/CD integration.",     date:"12/04/2026", status:"done",      owner:"Nguyễn Lan Anh" },
  { id:"av5",  type:"call",    entityType:"lead",        entityId:"ld5", entityName:"Thế Giới Di Động",title:"Gọi follow-up sau triển lãm",             description:"Hẹn gặp ngày 18/04 để trình bày giải pháp chi tiết.",    date:"12/04/2026", status:"done",      owner:"Phạm Thu Hà" },
  { id:"av6",  type:"task",    entityType:"opportunity", entityId:"op5", entityName:"Saigon Foods",    title:"Chuẩn bị đề xuất module export",          description:"",    date:"20/04/2026", status:"pending",   owner:"Lê Văn Nam",    priority:"high",   dueDate:"18/04/2026" },
  { id:"av7",  type:"task",    entityType:"opportunity", entityId:"op7", entityName:"Vinamilk",        title:"Review bản thảo hợp đồng",               description:"",    date:"16/04/2026", status:"in_progress",owner:"Trần Đức Minh",priority:"urgent", dueDate:"16/04/2026" },
  { id:"av8",  type:"task",    entityType:"lead",        entityId:"ld7", entityName:"Viettel",         title:"Chuẩn bị demo cho Viettel",              description:"",    date:"20/04/2026", status:"pending",   owner:"Nguyễn Lan Anh",priority:"high",   dueDate:"20/04/2026" },
  { id:"av9",  type:"task",    entityType:"lead",        entityId:"ld1", entityName:"Nova Group",      title:"Gửi email giới thiệu sản phẩm",          description:"",    date:"17/04/2026", status:"pending",   owner:"Phạm Thu Hà",   priority:"normal", dueDate:"17/04/2026" },
  { id:"av10", type:"meeting", entityType:"opportunity", entityId:"op7", entityName:"Vinamilk",        title:"Ký kết hợp đồng tại trụ sở Vinamilk",    description:"Cần mang theo 2 bản hợp đồng, stamp công ty.",           date:"17/04/2026", status:"scheduled", owner:"Trần Đức Minh" },
  { id:"av11", type:"call",    entityType:"lead",        entityId:"ld9", entityName:"Techcombank",     title:"Gọi xác nhận nhu cầu",                   description:"",    date:"16/04/2026", status:"pending",   owner:"Phạm Thu Hà" },
  { id:"av12", type:"email",   entityType:"opportunity", entityId:"op6", entityName:"An Phat Holdings",title:"Gửi báo giá Security Audit",              description:"Đã gửi 2 phương án: Onsite audit & Remote assessment.",   date:"15/04/2026", status:"sent",      owner:"Nguyễn Lan Anh" },
  { id:"av13", type:"email",   entityType:"lead",        entityId:"ld8", entityName:"BIDV",            title:"Nhận yêu cầu RFP từ BIDV",                description:"BIDV yêu cầu nộp RFP trước 25/04/2026.",                  date:"14/04/2026", status:"received",  owner:"Trần Đức Minh" },
  { id:"av14", type:"note",    entityType:"company",     entityId:"co1", entityName:"TechVision JSC",  title:"KH đang xem xét mở rộng hợp đồng năm sau",description:"Tiềm năng upsell ~500M vào Q4/2026.",                     date:"11/04/2026", status:"done",      owner:"Phạm Thu Hà" },
  { id:"av15", type:"meeting", entityType:"lead",        entityId:"ld5", entityName:"Thế Giới Di Động",title:"Buổi trình bày giải pháp",               description:"",    date:"18/04/2026", status:"scheduled", owner:"Phạm Thu Hà" },
];

/* ═══════════ Main Component ═══════════ */
export function ChannelItemDetailView({ channelId, itemId, onClose, onNavigate, canNavBack, canNavForward, onNavBack, onNavForward, customAnnouncements = [], savedItems, likedItems, registeredItems, onToggleSave, onToggleLike, onToggleRegister, closedPolls = new Set(), onTogglePollClosed }: ChannelItemDetailViewProps) {
  // Check if this is a custom (user-created) announcement
  const customAnnounce = customAnnouncements.find(a => a.id === itemId) ?? null;
  const detail = customAnnounce ? null : allDetails[itemId];
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<{ author: string; initials: string; color: string; text: string; time: string }[]>([]);
  const [votedOption, setVotedOption] = useState<string | null>(null);
  // Use lifted state if provided, else local fallback
  const [localLiked, setLocalLiked] = useState(false);
  const [localBookmarked, setLocalBookmarked] = useState(false);
  const [localRegistered, setLocalRegistered] = useState(false);
  const liked = likedItems ? likedItems.has(itemId) : localLiked;
  const bookmarked = savedItems ? savedItems.has(itemId) : localBookmarked;
  const registered = registeredItems ? registeredItems.has(itemId) : localRegistered;
  const [animateIn, setAnimateIn] = useState(true);
  const prevItemRef = useRef(itemId);
  // Shared ticket status map — persists across itemId changes so list + detail stay in sync
  const [ticketStatuses, setTicketStatuses] = useState<Record<string, "open" | "in_progress" | "waiting" | "resolved">>({});
  const getTicketStatus = (id: string) => ticketStatuses[id] ?? ((allDetails[id] as { ticketStatus?: string } | undefined)?.ticketStatus as "open" | "in_progress" | "waiting" | "resolved") ?? "open";
  const setTicketStatus = (id: string, s: "open" | "in_progress" | "waiting" | "resolved") =>
    setTicketStatuses(prev => ({ ...prev, [id]: s }));
  const ticketStatus = getTicketStatus(itemId);

  const handleSubmitComment = () => {
    if (!comment.trim()) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")} ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    setComments(prev => [...prev, { author: "Bạn", initials: "B", color: "#0891b2", text: comment.trim(), time: timeStr }]);
    setComment("");
  };

  useEffect(() => {
    if (prevItemRef.current !== itemId) {
      prevItemRef.current = itemId;
      setLocalLiked(false);
      setLocalBookmarked(false);
      setLocalRegistered(false);
      setComment("");
      setComments([]);
      setVotedOption(null);
      setAnimateIn(false);
      requestAnimationFrame(() => setAnimateIn(true));
    }
  }, [itemId]);

  // ── Finance Overview sub-items ──
  const financeOverviewMap: Record<string, { tab: number; title: string; emoji: string; subtitle: string }> = {
    "fi-revenue":  { tab: 0, title: "Doanh thu",          emoji: "📈", subtitle: "Revenue · Q1/2026" },
    "fi-expense":  { tab: 1, title: "Chi phí",             emoji: "💸", subtitle: "Expenses · Q1/2026" },
    "fi-profit":   { tab: 2, title: "Lợi nhuận",           emoji: "💰", subtitle: "Profit · Q1/2026" },
    "fi-cashflow": { tab: 3, title: "Dòng tiền",           emoji: "🔄", subtitle: "Cash Flow · Q1/2026" },
    "fi-debt":     { tab: 4, title: "Công nợ",             emoji: "📋", subtitle: "Receivables / Payables" },
    "fi-taxreport":{ tab: 6, title: "Thuế",                 emoji: "🏛️", subtitle: "Tax Reports · Q1/2026" },
    "fi-budget":   { tab: 7, title: "Tổng quan ngân sách", emoji: "🎯", subtitle: "Budget · 2026" },
  };

  // ── Finance Invoice sub-items ──
  const financeInvoiceMap: Record<string, { tab: "all" | "ban" | "mua" | "history" | "partners"; title: string; emoji: string; subtitle: string; locked: boolean }> = {
    "fi-invoice": { tab: "all",      title: "Hóa đơn",    emoji: "🧾", subtitle: "Quản lý hóa đơn bán & mua", locked: false },
    "fi-payment": { tab: "all",      title: "Thanh toán", emoji: "💳", subtitle: "Quản lý thu chi & giao dịch", locked: false },
  };

  const overviewItem = financeOverviewMap[itemId];
  const invoiceItem  = financeInvoiceMap[itemId];

  // Shared nav bar
  const FinanceNavBar = ({ title = "Tài chính kế toán" }: { title?: string } = {}) => (
    <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 shrink-0 flex items-center gap-2">
      <button onClick={onClose} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] text-gray-500 hover:text-gray-700 hover:bg-white transition-all">
        <ArrowLeft className="w-3.5 h-3.5" /> {title}
      </button>
      <div className="flex-1" />
    </div>
  );

  // ── Support: ticket list views ──
  if (itemId === "sp-list-all" || itemId === "sp-list-mine") {
    const isMine = itemId === "sp-list-mine";
    type TicketStatus = "open" | "in_progress" | "waiting" | "resolved";
    interface SupportTicket {
      id: string; emoji: string; title: string; subtitle: string;
      badge?: string; badgeColor?: string; status: TicketStatus; mine?: boolean;
    }
    const baseTickets: SupportTicket[] = [
      { id: "sp-889", emoji: "🟢", title: "Case #889 - Hỏi về gói dịch vụ",      subtitle: "Ưu tiên thấp",        status: "open" },
      { id: "sp-892", emoji: "🔴", title: "Case #892 - Lỗi thanh toán",           subtitle: "Khẩn cấp",            status: "open",        badge: "Urgent", badgeColor: "bg-red-100 text-red-700", mine: true },
      { id: "sp-891", emoji: "🟡", title: "Case #891 - Không đăng nhập được",     subtitle: "Ưu tiên trung bình",  status: "in_progress" },
      { id: "sp-888", emoji: "🟡", title: "Case #888 - Lỗi hiển thị mobile",      subtitle: "Ưu tiên trung bình",  status: "in_progress", mine: true },
      { id: "sp-890", emoji: "🟡", title: "Case #890 - Yêu cầu hoàn tiền",        subtitle: "Ưu tiên trung bình",  status: "waiting" },
      { id: "sp-887", emoji: "✅", title: "Case #887 - Cập nhật thông tin",        subtitle: "Đã giải quyết",       status: "resolved" },
      { id: "sp-886", emoji: "✅", title: "Case #886 - Hướng dẫn sử dụng",        subtitle: "Đã giải quyết",       status: "resolved" },
      { id: "sp-885", emoji: "✅", title: "Case #885 - Khiếu nại dịch vụ",        subtitle: "Đã giải quyết",       status: "resolved" },
    ];
    // Apply any status changes the user made in detail views
    const allTickets = baseTickets.map(t => ({ ...t, status: getTicketStatus(t.id) }));
    const tickets = isMine ? allTickets.filter(t => t.mine) : allTickets;
    const statusSections: { key: TicketStatus; label: string }[] = [
      { key: "open",        label: "MỞ" },
      { key: "in_progress", label: "ĐANG XỬ LÝ" },
      { key: "waiting",     label: "CHỜ PHẢN HỒI" },
      { key: "resolved",    label: "ĐÃ GIẢI QUYẾT" },
    ];
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Nav */}
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 shrink-0 flex items-center gap-2">
          <button onClick={onClose} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] text-gray-500 hover:text-gray-700 hover:bg-white transition-all">
            <ArrowLeft className="w-3.5 h-3.5" /> Chăm sóc khách hàng
          </button>
        </div>
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <h2 className="text-[15px] font-semibold text-gray-900">
            {isMine ? "Được giao cho tôi" : "Tất cả ticket"}
          </h2>
          <p className="text-[12px] text-gray-400 mt-0.5">{tickets.length} ticket</p>
        </div>
        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {statusSections.map(sec => {
            const items = tickets.filter(t => t.status === sec.key);
            if (items.length === 0) return null;
            return (
              <div key={sec.key}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-semibold text-gray-400 tracking-wider">{sec.label}</span>
                  <span className="text-[10px] text-gray-300">{items.length}</span>
                </div>
                <div className="space-y-1.5">
                  {items.map(t => (
                    <button
                      key={t.id}
                      onClick={() => onNavigate?.(t.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-pink-200 hover:bg-pink-50/40 transition-all text-left group"
                    >
                      <span className="text-[18px] shrink-0">{t.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-gray-800 truncate group-hover:text-pink-700">{t.title}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{t.subtitle}</p>
                      </div>
                      {t.badge && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${t.badgeColor}`}>{t.badge}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Finance: Tổng quan tài chính (dashboard linking to sub-items) ──
  if (itemId === "fi-fin-overview") {
    const fmt2 = (n: number) => n >= 1000000000 ? (n / 1000000000).toFixed(1) + " tỷ" : (n / 1000000).toFixed(0) + " tr";
    const nav = (id: string) => onNavigate ? onNavigate(id) : undefined;
    const summaryCards = [
      {
        id: "fi-revenue", emoji: "📈", title: "Doanh thu", sub: "Q1/2026",
        color: "from-emerald-50 to-emerald-100", border: "border-emerald-200", textColor: "text-emerald-700",
        kpis: [
          { label: "YTD", value: fmt2(financialData.revenue.ytd) },
          { label: "Tăng trưởng", value: `+${financialData.revenue.growth}%` },
          { label: "Đạt mục tiêu", value: `${Math.round(financialData.revenue.ytd / financialData.revenue.target * 100)}%` },
        ],
        badge: { label: "+18% ↑", color: "bg-emerald-100 text-emerald-700" },
      },
      {
        id: "fi-expense", emoji: "💸", title: "Chi phí", sub: "Q1/2026",
        color: "from-red-50 to-rose-100", border: "border-red-200", textColor: "text-red-700",
        kpis: [
          { label: "YTD", value: fmt2(financialData.expenses.ytd) },
          { label: "Ngân sách", value: fmt2(financialData.expenses.budget) },
          { label: "Burn rate", value: `${Math.round(financialData.expenses.ytd / financialData.expenses.budget * 100)}%` },
        ],
        badge: { label: "93% NS", color: "bg-green-100 text-green-700" },
      },
      {
        id: "fi-profit", emoji: "💰", title: "Lợi nhuận", sub: "Q1/2026",
        color: "from-blue-50 to-blue-100", border: "border-blue-200", textColor: "text-blue-700",
        kpis: [
          { label: "Ròng YTD", value: fmt2(financialData.profit.ytd) },
          { label: "Biên LN", value: `${financialData.profit.margin}%` },
          { label: "EBITDA", value: fmt2(financialData.profit.ebitda) },
        ],
        badge: { label: `${financialData.profit.progress}% mục tiêu`, color: "bg-blue-100 text-blue-700" },
      },
      {
        id: "fi-cashflow", emoji: "🔄", title: "Dòng tiền", sub: "Q1/2026",
        color: "from-cyan-50 to-cyan-100", border: "border-cyan-200", textColor: "text-cyan-700",
        kpis: [
          { label: "CF ròng", value: `+${fmt2(financialData.cashFlow.netCF)}` },
          { label: "Số dư", value: fmt2(financialData.cashFlow.cashBalance) },
          { label: "CF HĐ", value: `+${fmt2(financialData.cashFlow.operatingCF)}` },
        ],
        badge: { label: "Dương ✓", color: "bg-cyan-100 text-cyan-700" },
      },
      {
        id: "fi-debt", emoji: "📋", title: "Công nợ", sub: "Phải thu / Phải trả",
        color: "from-amber-50 to-amber-100", border: "border-amber-200", textColor: "text-amber-700",
        kpis: [
          { label: "Phải thu", value: fmt2(financialData.receivables.total) },
          { label: "Phải trả", value: fmt2(financialData.payables.total) },
          { label: "Quá hạn", value: fmt2(financialData.receivables.overdue + financialData.payables.overdue) },
        ],
        badge: { label: "2 quá hạn ⚠️", color: "bg-amber-100 text-amber-700" },
      },
      {
        id: "fi-taxreport", emoji: "🏛️", title: "Thuế", sub: "Q1/2026",
        color: "from-purple-50 to-purple-100", border: "border-purple-200", textColor: "text-purple-700",
        kpis: [
          { label: "VAT", value: fmt2(financialData.tax.vat.amount) },
          { label: "TNDN", value: fmt2(financialData.tax.corporateTax.amount) },
          { label: "Hạn nộp", value: "30/04" },
        ],
        badge: { label: "Chưa nộp", color: "bg-amber-100 text-amber-700" },
      },
      {
        id: "fi-budget", emoji: "🎯", title: "Ngân sách", sub: "Năm 2026",
        color: "from-indigo-50 to-indigo-100", border: "border-indigo-200", textColor: "text-indigo-700",
        kpis: [
          { label: "Tổng NS", value: fmt2(financialData.budget.total) },
          { label: "Đã dùng", value: fmt2(financialData.budget.used) },
          { label: "Còn lại", value: fmt2(financialData.budget.total - financialData.budget.used) },
        ],
        badge: { label: `${Math.round(financialData.budget.used / financialData.budget.total * 100)}% đã dùng`, color: "bg-indigo-100 text-indigo-700" },
      },
    ];
    return (
      <div className="h-full flex flex-col bg-white">
        <FinanceNavBar />
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 border border-emerald-200 flex items-center justify-center text-[18px] shrink-0">📊</div>
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">Tổng quan tài chính</h2>
              <p className="text-[11px] text-gray-400">Financial Overview · Q1/2026</p>
            </div>
          </div>
        </div>
        {/* Summary stats bar */}
        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50 shrink-0 grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase font-medium">Doanh thu YTD</p>
            <p className="text-[15px] font-bold text-emerald-600">{fmt2(financialData.revenue.ytd)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase font-medium">Lợi nhuận</p>
            <p className="text-[15px] font-bold text-blue-600">{fmt2(financialData.profit.ytd)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase font-medium">Số dư tiền</p>
            <p className="text-[15px] font-bold text-cyan-600">{fmt2(financialData.cashFlow.cashBalance)}</p>
          </div>
        </div>
        {/* Dashboard cards */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Chọn mục để xem chi tiết</p>
          {summaryCards.map(card => (
            <button key={card.id} onClick={() => nav(card.id)}
              className={`w-full text-left rounded-xl border ${card.border} bg-gradient-to-r ${card.color} p-3.5 hover:shadow-sm transition-all group`}>
              <div className="flex items-start justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="text-[20px] leading-none">{card.emoji}</div>
                  <div>
                    <p className={`text-[13px] font-semibold ${card.textColor}`}>{card.title}</p>
                    <p className="text-[10px] text-gray-400">{card.sub}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${card.badge.color}`}>{card.badge.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {card.kpis.map((kpi, i) => (
                  <div key={i} className="bg-white/60 rounded-lg px-2.5 py-1.5">
                    <p className="text-[9px] text-gray-400 uppercase font-medium">{kpi.label}</p>
                    <p className={`text-[13px] font-bold ${card.textColor}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (overviewItem) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Breadcrumb: back to overview dashboard */}
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 shrink-0 flex items-center gap-1 text-[12px] text-gray-400">
          <button onClick={onClose} className="hover:text-gray-600 transition-colors px-1 py-0.5 rounded hover:bg-white">
            Tài chính kế toán
          </button>
          <span>/</span>
          <button onClick={() => onNavigate?.("fi-fin-overview")} className="hover:text-gray-600 transition-colors px-1 py-0.5 rounded hover:bg-white">
            Tổng quan
          </button>
          <span>/</span>
          <span className="text-gray-700 font-medium px-1">{overviewItem.title}</span>
          <div className="flex-1" />
        </div>
        <div className="px-5 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 flex items-center justify-center text-[18px] shrink-0">{overviewItem.emoji}</div>
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">{overviewItem.title}</h2>
              <p className="text-[11px] text-gray-400">{overviewItem.subtitle}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <FinancialOverviewView key={overviewItem.tab} initialTab={overviewItem.tab} singleTab={true} />
        </div>
      </div>
    );
  }

  if (invoiceItem) {
    const isPayment = itemId === "fi-payment";
    return (
      <div className="h-full flex flex-col bg-white">
        <FinanceNavBar />
        <div className="px-5 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br border flex items-center justify-center text-[18px] shrink-0 ${isPayment ? "from-violet-50 to-violet-100 border-violet-200" : "from-cyan-50 to-cyan-100 border-cyan-200"}`}>{invoiceItem.emoji}</div>
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">{invoiceItem.title}</h2>
              <p className="text-[11px] text-gray-400">{invoiceItem.subtitle}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          {isPayment ? <PaymentHubView /> : <InvoiceHubView initTab={invoiceItem.tab} locked={invoiceItem.locked} />}
        </div>
      </div>
    );
  }

  // ── CRM ──
  if (itemId.startsWith("crm-")) {
    return <CRMView itemId={itemId} onClose={onClose} onNavigate={onNavigate} />;
  }
  if (false) {
    const CrmNavBar = () => (
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 shrink-0 flex items-center gap-2">
        <button onClick={onClose} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] text-gray-500 hover:text-gray-700 hover:bg-white transition-all">
          <ArrowLeft className="w-3.5 h-3.5" /> CRM - Quản lý KH
        </button>
        <div className="flex-1" />
      </div>
    );


    // ── shared helpers ──
    const crmPriorityCfg: Record<string, { label: string; color: string; bg: string }> = {
      urgent: { label: "Khẩn cấp",    color: "text-red-700",   bg: "bg-red-100"   },
      high:   { label: "Cao",         color: "text-amber-700", bg: "bg-amber-100" },
      normal: { label: "Bình thường", color: "text-gray-600",  bg: "bg-gray-100"  },
      low:    { label: "Thấp",        color: "text-blue-600",  bg: "bg-blue-100"  },
    };

    // ── crm-companies ──
    if (itemId === "crm-companies") {
      const [compTab, setCompTab] = useState("all");
      const tabMap: Record<string, string> = { all: "", customer: "customer", prospect: "prospect", inactive: "inactive" };
      const filtered = crmCompanies.filter((c: any) => !tabMap[compTab] || c.status === tabMap[compTab]);
      const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
        customer: { label: "Khách hàng", color: "text-emerald-700", bg: "bg-emerald-100" },
        prospect: { label: "Prospect",   color: "text-amber-700",   bg: "bg-amber-100"   },
        inactive: { label: "Không HĐ",  color: "text-gray-500",    bg: "bg-gray-100"    },
      };
      return (
        <div className="h-full flex flex-col bg-white">
          <CrmNavBar />
          <div className="grid grid-cols-3 border-b border-gray-100 shrink-0">
            {[
              { label: "Tổng CT",    value: crmCompanies.length,                                        color: "text-blue-600"    },
              { label: "Khách hàng", value: crmCompanies.filter((c: any) => c.status === "customer").length, color: "text-emerald-600" },
              { label: "Prospect",   value: crmCompanies.filter((c: any) => c.status === "prospect").length, color: "text-amber-600"   },
            ].map((s, i) => (
              <div key={i} className="py-3 text-center">
                <p className={`text-[18px] font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-1 px-4 py-2 border-b border-gray-100 shrink-0">
            {([["all","Tất cả"],["customer","Khách hàng"],["prospect","Prospect"],["inactive","Không HĐ"]] as [string,string][]).map(([k,l]) => (
              <button key={k} onClick={() => setCompTab(k)} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${compTab === k ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>{l}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {filtered.map((c: any) => {
              const sc = statusCfg[c.status] || statusCfg.inactive;
              return (
                <div key={c.id} className="rounded-xl border border-gray-100 p-3 bg-white hover:border-blue-200 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[16px] shrink-0">🏢</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-semibold text-gray-900">{c.name}</p>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sc.bg} ${sc.color}`}>{sc.label}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">{c.industry} · {c.size}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-[11px] text-gray-500">💰 {crmFmt(c.revenue)}</span>
                        <span className="text-[11px] text-gray-500">👥 {c.contacts} liên hệ</span>
                        <span className="text-[11px] text-gray-400">{c.owner}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-3 border-t border-gray-100 shrink-0">
            <button onClick={() => toast.success("Thêm công ty mới")} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-medium hover:bg-blue-700 transition-all">
              <Plus className="w-4 h-4" /> Thêm công ty
            </button>
          </div>
        </div>
      );
    }

    // ── crm-contacts ──
    if (itemId === "crm-contacts") {
      const vipCount    = crmContacts.filter((c: any) => c.tier === "vip").length;
      const activeCount = crmContacts.filter((c: any) => c.status === "active").length;
      const avatarColors = ["bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-500","bg-rose-500","bg-cyan-500"];
      return (
        <div className="h-full flex flex-col bg-white">
          <CrmNavBar />
          <div className="grid grid-cols-3 border-b border-gray-100 shrink-0">
            {[
              { label: "Tổng",      value: crmContacts.length, color: "text-blue-600"    },
              { label: "VIP",       value: vipCount,           color: "text-amber-600"   },
              { label: "Hoạt động", value: activeCount,        color: "text-emerald-600" },
            ].map((s, i) => (
              <div key={i} className="py-3 text-center">
                <p className={`text-[18px] font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {crmContacts.map((c: any, idx: number) => (
              <div key={c.id} className="rounded-xl border border-gray-100 p-3 bg-white hover:border-blue-200 hover:shadow-sm transition-all">
                <div className="flex items-start gap-2.5">
                  <div className={`w-9 h-9 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-[12px] font-bold text-white shrink-0`}>
                    {c.avatar || c.name.slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-semibold text-gray-900">{c.name}</p>
                      {c.tier === "vip" && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">VIP</span>}
                    </div>
                    <p className="text-[11px] text-gray-500">{c.title} · {c.companyName}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[11px] text-gray-400">{c.email}</span>
                      <span className="text-[11px] text-gray-400">{c.phone}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">Liên hệ cuối: {c.lastContact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-gray-100 shrink-0">
            <button onClick={() => toast.success("Thêm liên hệ mới")} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-medium hover:bg-blue-700 transition-all">
              <Plus className="w-4 h-4" /> Thêm liên hệ
            </button>
          </div>
        </div>
      );
    }

    // ── crm-leads / crm-lead-* ──
    if (itemId === "crm-leads" || itemId === "crm-lead-new" || itemId === "crm-lead-contacted" || itemId === "crm-lead-qualified") {
      const stageFilter: Record<string, string> = { "crm-lead-new": "new", "crm-lead-contacted": "contacted", "crm-lead-qualified": "qualified" };
      const filteredLeads = stageFilter[itemId] ? crmLeads.filter((l: any) => l.stage === stageFilter[itemId]) : crmLeads;
      const leadStageCfg: Record<string, { label: string; color: string; bg: string }> = {
        new:       { label: "Mới",     color: "text-blue-700",    bg: "bg-blue-100"    },
        contacted: { label: "Đã LH",   color: "text-amber-700",   bg: "bg-amber-100"   },
        qualified: { label: "QL",      color: "text-emerald-700", bg: "bg-emerald-100" },
        proposal:  { label: "Đề xuất", color: "text-purple-700",  bg: "bg-purple-100"  },
        won:       { label: "Won",      color: "text-green-700",   bg: "bg-green-100"   },
        lost:      { label: "Lost",     color: "text-gray-600",    bg: "bg-gray-100"    },
      };
      const scoreCls = (s: number) => s >= 80 ? "bg-green-500" : s >= 60 ? "bg-amber-500" : "bg-red-500";
      const titleLabel = itemId === "crm-lead-new" ? "Leads Mới" : itemId === "crm-lead-contacted" ? "Đã Liên hệ" : itemId === "crm-lead-qualified" ? "Qualified" : "Tất cả Leads";
      return (
        <div className="h-full flex flex-col bg-white">
          <CrmNavBar />
          <div className="px-4 py-2 border-b border-gray-100 shrink-0">
            <p className="text-[15px] font-semibold text-gray-900">{titleLabel}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {(["new","contacted","qualified","proposal","won"] as const).map((st, i, arr) => (
                <span key={st} className="flex items-center gap-1">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${leadStageCfg[st].bg} ${leadStageCfg[st].color}`}>
                    {leadStageCfg[st].label} {(crmLeads as any[]).filter((l) => l.stage === st).length}
                  </span>
                  {i < arr.length - 1 && <span className="text-[10px] text-gray-300">→</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {filteredLeads.map((l: any) => {
              const sc = leadStageCfg[l.stage] || leadStageCfg.new;
              return (
                <div key={l.id} className="rounded-xl border border-gray-100 p-3 bg-white hover:border-blue-200 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-2.5">
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-[11px] font-bold text-white">{l.avatar || l.name.slice(0,2)}</div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${scoreCls(l.score)} flex items-center justify-center text-[8px] font-bold text-white border border-white`}>{l.score}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-semibold text-gray-900">{l.name}</p>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sc.bg} ${sc.color}`}>{sc.label}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">{l.source}</span>
                      </div>
                      <p className="text-[11px] text-gray-500">{l.company}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-[11px] font-semibold text-blue-600">{crmFmt(l.value)}</span>
                        <span className="text-[11px] text-gray-400">{l.owner}</span>
                        <span className="text-[10px] text-gray-400">{l.createdAt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ── crm-pipeline ──
    if (itemId === "crm-pipeline") {
      const pipeStages = [
        { key: "new",         label: "Mới",         colorBorder: "border-blue-300",    hdr: "bg-blue-50"    },
        { key: "contacted",   label: "Đã liên hệ",  colorBorder: "border-amber-300",   hdr: "bg-amber-50"   },
        { key: "proposal",    label: "Đề xuất",     colorBorder: "border-purple-300",  hdr: "bg-purple-50"  },
        { key: "negotiation", label: "Đàm phán",    colorBorder: "border-orange-300",  hdr: "bg-orange-50"  },
        { key: "won",         label: "Won",          colorBorder: "border-emerald-300", hdr: "bg-emerald-50" },
      ];
      return (
        <div className="h-full flex flex-col bg-white">
          <CrmNavBar />
          <div className="px-4 py-2 border-b border-gray-100 shrink-0">
            <p className="text-[15px] font-semibold text-gray-900">Pipeline Bán hàng</p>
            <p className="text-[11px] text-gray-400">Kanban theo giai đoạn cơ hội</p>
          </div>
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex gap-3 px-4 py-3 h-full" style={{ minWidth: "max-content" }}>
              {pipeStages.map(st => {
                const deals = crmOpportunities.filter((o: any) => o.stage === st.key);
                const total = deals.reduce((s: number, o: any) => s + o.value, 0);
                return (
                  <div key={st.key} className={`flex flex-col w-56 h-full rounded-xl border-2 ${st.colorBorder} overflow-hidden shrink-0`}>
                    <div className={`${st.hdr} px-3 py-2 shrink-0`}>
                      <p className="text-[12px] font-bold text-gray-700">{st.label}</p>
                      <p className="text-[10px] text-gray-500">{deals.length} deal · {crmFmt(total)}</p>
                    </div>
                    <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2 bg-gray-50/50">
                      {deals.map((d: any) => (
                        <div key={d.id} className="rounded-lg border border-gray-100 bg-white p-2.5 hover:shadow-sm transition-all">
                          <p className="text-[12px] font-medium text-gray-800 leading-snug">{d.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{d.companyName}</p>
                          <p className="text-[12px] font-bold text-blue-600 mt-1">{crmFmt(d.value)}</p>
                          <div className="mt-1.5">
                            <div className="flex justify-between mb-0.5">
                              <span className="text-[9px] text-gray-400">Prob.</span>
                              <span className="text-[9px] font-medium text-gray-600">{d.probability}%</span>
                            </div>
                            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${d.probability}%` }} />
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[9px] text-gray-400">{d.closeDate}</span>
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-[8px] font-bold text-white">{(d.avatar || d.owner || "?").slice(0,2)}</div>
                          </div>
                        </div>
                      ))}
                      {deals.length === 0 && <p className="text-[10px] text-gray-400 text-center py-4">Không có deal</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // ── crm-opps ──
    if (itemId === "crm-opps") {
      const totalVal    = crmOpportunities.reduce((s: number, o: any) => s + o.value, 0);
      const weightedVal = crmOpportunities.reduce((s: number, o: any) => s + o.value * o.probability / 100, 0);
      const avgProb     = crmOpportunities.length ? Math.round(crmOpportunities.reduce((s: number, o: any) => s + o.probability, 0) / crmOpportunities.length) : 0;
      const oppStageCfg: Record<string, { label: string; color: string; bg: string }> = {
        new:         { label: "Mới",      color: "text-blue-700",    bg: "bg-blue-100"    },
        contacted:   { label: "Đã LH",    color: "text-amber-700",   bg: "bg-amber-100"   },
        proposal:    { label: "Đề xuất",  color: "text-purple-700",  bg: "bg-purple-100"  },
        negotiation: { label: "Đàm phán", color: "text-orange-700",  bg: "bg-orange-100"  },
        won:         { label: "Won",       color: "text-emerald-700", bg: "bg-emerald-100" },
        lost:        { label: "Lost",      color: "text-gray-500",    bg: "bg-gray-100"    },
      };
      return (
        <div className="h-full flex flex-col bg-white">
          <CrmNavBar />
          <div className="grid grid-cols-3 border-b border-gray-100 shrink-0">
            {[
              { label: "Tổng pipeline", value: crmFmt(totalVal),    color: "text-blue-600"    },
              { label: "Weighted",      value: crmFmt(weightedVal), color: "text-emerald-600" },
              { label: "Avg prob.",     value: avgProb + "%",       color: "text-purple-600"  },
            ].map((s, i) => (
              <div key={i} className="py-3 text-center">
                <p className={`text-[14px] font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {crmOpportunities.map((o: any) => {
              const sc = oppStageCfg[o.stage] || oppStageCfg.new;
              return (
                <div key={o.id} className="rounded-xl border border-gray-100 p-3 bg-white hover:border-blue-200 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">{(o.avatar || o.contactName || "?").slice(0,2)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-semibold text-gray-900">{o.title}</p>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sc.bg} ${sc.color}`}>{sc.label}</span>
                      </div>
                      <p className="text-[11px] text-gray-500">{o.companyName} · {o.contactName}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-[12px] font-bold text-blue-600">{crmFmt(o.value)}</span>
                        <span className="text-[11px] text-gray-400">Đóng: {o.closeDate}</span>
                        <span className="text-[11px] text-gray-400">{o.owner}</span>
                      </div>
                      <div className="mt-1.5">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[9px] text-gray-400">Xác suất</span>
                          <span className="text-[9px] font-medium text-gray-600">{o.probability}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${o.probability}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ── crm-tasks / crm-calls / crm-meetings / crm-emails / crm-notes ──
    if (["crm-tasks","crm-calls","crm-meetings","crm-emails","crm-notes"].includes(itemId)) {
      const actTypeMap: Record<string, string> = { "crm-tasks":"task","crm-calls":"call","crm-meetings":"meeting","crm-emails":"email","crm-notes":"note" };
      const actTitleMap: Record<string, { label: string; emoji: string }> = {
        "crm-tasks":    { label: "Công việc", emoji: "✅" },
        "crm-calls":    { label: "Cuộc gọi", emoji: "📞" },
        "crm-meetings": { label: "Cuộc họp", emoji: "🤝" },
        "crm-emails":   { label: "Email",    emoji: "✉️" },
        "crm-notes":    { label: "Ghi chú",  emoji: "📝" },
      };
      const actType = actTypeMap[itemId];
      const { label: actLabel, emoji: actEmoji } = actTitleMap[itemId];
      const filteredActs = crmActivitiesData.filter((a: any) => a.type === actType);
      const pendingActs  = filteredActs.filter((a: any) => !["done","sent","received","completed"].includes(a.status)).length;
      const doneActs     = filteredActs.filter((a: any) => ["done","sent","received","completed"].includes(a.status)).length;
      const typeIconMap: Record<string, React.ReactNode> = {
        call:    <Phone        className="w-4 h-4 text-blue-500"    />,
        meeting: <Calendar     className="w-4 h-4 text-purple-500"  />,
        email:   <Mail         className="w-4 h-4 text-amber-500"   />,
        note:    <Star         className="w-4 h-4 text-gray-400"    />,
        task:    <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      };
      const actStatusCfg: Record<string, { label: string; color: string; bg: string }> = {
        pending:     { label: "Chờ xử lý",   color: "text-amber-700",   bg: "bg-amber-100"   },
        in_progress: { label: "Đang làm",    color: "text-blue-700",    bg: "bg-blue-100"    },
        scheduled:   { label: "Đã lên lịch", color: "text-purple-700",  bg: "bg-purple-100"  },
        done:        { label: "Xong",         color: "text-emerald-700", bg: "bg-emerald-100" },
        sent:        { label: "Đã gửi",      color: "text-emerald-700", bg: "bg-emerald-100" },
        received:    { label: "Đã nhận",     color: "text-emerald-700", bg: "bg-emerald-100" },
        completed:   { label: "Hoàn thành",  color: "text-emerald-700", bg: "bg-emerald-100" },
      };
      return (
        <div className="h-full flex flex-col bg-white">
          <CrmNavBar />
          <div className="px-4 py-2 border-b border-gray-100 shrink-0 flex items-center gap-2">
            <span className="text-[18px]">{actEmoji}</span>
            <div>
              <p className="text-[15px] font-semibold text-gray-900">{actLabel}</p>
              <p className="text-[11px] text-gray-400">{filteredActs.length} tổng · {pendingActs} chờ · {doneActs} xong</p>
            </div>
          </div>
          <div className="grid grid-cols-3 border-b border-gray-100 shrink-0">
            {[
              { label: "Tổng",       value: filteredActs.length, color: "text-blue-600"    },
              { label: "Chờ",        value: pendingActs,         color: "text-amber-600"   },
              { label: "Hoàn thành", value: doneActs,            color: "text-emerald-600" },
            ].map((s, i) => (
              <div key={i} className="py-3 text-center">
                <p className={`text-[18px] font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {filteredActs.map((a: any) => {
              const sc = actStatusCfg[a.status] || actStatusCfg.pending;
              const pc = a.priority ? (crmPriorityCfg[a.priority] || crmPriorityCfg.normal) : null;
              return (
                <div key={a.id} className="rounded-xl border border-gray-100 p-3 bg-white hover:border-blue-200 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                      {typeIconMap[a.type] || typeIconMap.task}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-800 leading-snug">{a.title}</p>
                      <p className="text-[11px] text-gray-500">{a.entityName || a.company}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${sc.bg} ${sc.color}`}>{sc.label}</span>
                        {pc && <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${pc.bg} ${pc.color}`}>{pc.label}</span>}
                        <span className="text-[10px] text-gray-400">{a.dueDate || a.date}</span>
                        <span className="text-[10px] text-gray-400">{a.owner}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredActs.length === 0 && <p className="text-[12px] text-gray-400 text-center py-8">Không có dữ liệu</p>}
          </div>
        </div>
      );
    }

    // ── crm-report-revenue ──
    if (itemId === "crm-report-revenue") {
      const revenueMonths = [
        { m: "T11", revenue: 3800000000, target: 4000000000 },
        { m: "T12", revenue: 5100000000, target: 4500000000 },
        { m: "T1",  revenue: 4600000000, target: 4500000000 },
        { m: "T2",  revenue: 4200000000, target: 4500000000 },
        { m: "T3",  revenue: 4900000000, target: 5000000000 },
        { m: "T4",  revenue: 3100000000, target: 5000000000 },
      ];
      const maxRevVal = Math.max(...revenueMonths.flatMap(m => [m.revenue, m.target]));
      const wonOpps   = crmOpportunities.filter((o: any) => o.stage === "won");
      const totalWon  = wonOpps.reduce((s: number, o: any) => s + o.value, 0);
      return (
        <div className="h-full flex flex-col bg-white">
          <CrmNavBar />
          <div className="px-4 py-2 border-b border-gray-100 shrink-0">
            <p className="text-[15px] font-semibold text-gray-900">Báo cáo Doanh thu</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Đã chốt",   value: crmFmt(totalWon),   color: "text-emerald-600", bg: "from-emerald-50 to-green-50",  border: "border-emerald-100" },
                { label: "T4/2026",   value: crmFmt(3100000000), color: "text-blue-600",    bg: "from-blue-50 to-sky-50",       border: "border-blue-100"    },
                { label: "Dự báo Q2", value: crmFmt(14000000000),color: "text-purple-600",  bg: "from-purple-50 to-violet-50",  border: "border-purple-100"  },
              ].map((k, i) => (
                <div key={i} className={`rounded-xl border ${k.border} bg-gradient-to-br ${k.bg} p-3 text-center`}>
                  <p className={`text-[14px] font-bold ${k.color}`}>{k.value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-gray-100 p-3 bg-white">
              <p className="text-[11px] font-semibold text-gray-500 mb-3">Doanh thu 6 tháng gần đây</p>
              <div className="flex items-end gap-1.5 h-28">
                {revenueMonths.map((m) => {
                  const revH = Math.round((m.revenue / maxRevVal) * 96);
                  const tarH = Math.round((m.target  / maxRevVal) * 96);
                  return (
                    <div key={m.m} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full flex items-end gap-0.5" style={{ height: "96px" }}>
                        <div className="flex-1 bg-blue-500 rounded-sm opacity-80" style={{ height: `${revH}px` }} />
                        <div className="flex-1 bg-gray-200 rounded-sm"            style={{ height: `${tarH}px` }} />
                      </div>
                      <p className="text-[9px] text-gray-400">{m.m}</p>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-[9px] text-gray-500"><span className="w-2 h-2 bg-blue-500 rounded-sm inline-block" /> Thực tế</span>
                <span className="flex items-center gap-1 text-[9px] text-gray-500"><span className="w-2 h-2 bg-gray-200 rounded-sm inline-block" /> Mục tiêu</span>
              </div>
            </div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Deal đã chốt</p>
            {wonOpps.map((o: any) => (
              <div key={o.id} className="rounded-xl border border-gray-100 p-3 bg-white flex items-center gap-2.5">
                <Award className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-800 truncate">{o.title}</p>
                  <p className="text-[10px] text-gray-400">{o.companyName}</p>
                </div>
                <p className="text-[12px] font-bold text-emerald-600 shrink-0">{crmFmt(o.value)}</p>
              </div>
            ))}
            {wonOpps.length === 0 && <p className="text-[12px] text-gray-400 text-center py-4">Chưa có deal nào được chốt</p>}
          </div>
        </div>
      );
    }

    // ── crm-report-conversion ──
    if (itemId === "crm-report-conversion") {
      const funnelStages = [
        { key: "new",       label: "Mới",        color: "bg-blue-500"    },
        { key: "contacted", label: "Đã liên hệ", color: "bg-amber-500"   },
        { key: "qualified", label: "Qualified",  color: "bg-purple-500"  },
        { key: "proposal",  label: "Đề xuất",    color: "bg-orange-500"  },
        { key: "won",       label: "Won",         color: "bg-emerald-500" },
      ];
      const stageCounts = funnelStages.map(s => ({
        ...s,
        count: crmLeads.filter((l: any) => l.stage === s.key).length,
      }));
      const maxFunnelCount = Math.max(...stageCounts.map(s => s.count), 1);
      const leadSources = Array.from(new Set(crmLeads.map((l: any) => l.source as string))).map((src: string) => ({
        source: src,
        total: crmLeads.filter((l: any) => l.source === src).length,
        won:   crmLeads.filter((l: any) => l.source === src && l.stage === "won").length,
      }));
      const totalLeads = crmLeads.length;
      const wonLeads   = crmLeads.filter((l: any) => l.stage === "won").length;
      const lostLeads  = crmLeads.filter((l: any) => l.stage === "lost").length;
      const winRate    = totalLeads ? Math.round(wonLeads / totalLeads * 100) : 0;
      return (
        <div className="h-full flex flex-col bg-white">
          <CrmNavBar />
          <div className="px-4 py-2 border-b border-gray-100 shrink-0">
            <p className="text-[15px] font-semibold text-gray-900">Tỷ lệ Chuyển đổi</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            <div className="rounded-xl border border-gray-100 p-3 bg-white">
              <p className="text-[11px] font-semibold text-gray-500 mb-3">Phễu chuyển đổi</p>
              <div className="space-y-2">
                {stageCounts.map((s, i) => (
                  <div key={s.key} className="flex items-center gap-2">
                    <p className="text-[10px] text-gray-500 w-20 shrink-0 text-right">{s.label}</p>
                    <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                      <div className={`h-full ${s.color} rounded-lg flex items-center px-2`} style={{ width: `${Math.max(10, Math.round(s.count / maxFunnelCount * 100))}%` }}>
                        <span className="text-[10px] font-bold text-white">{s.count}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 w-10 shrink-0">
                      {i > 0 && stageCounts[i-1].count > 0 ? Math.round(s.count / stageCounts[i-1].count * 100) + "%" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 p-3 bg-white">
              <p className="text-[11px] font-semibold text-gray-500 mb-2">Win Rate tổng thể</p>
              <div className="flex items-center gap-3">
                <p className="text-[24px] font-bold text-emerald-600">{winRate}%</p>
                <div className="flex-1">
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${winRate}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-gray-400">Won: {wonLeads}</span>
                    <span className="text-[9px] text-gray-400">Lost: {lostLeads}</span>
                    <span className="text-[9px] text-gray-400">Total: {totalLeads}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 overflow-hidden bg-white">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase">Nguồn Lead</p>
              </div>
              <div className="divide-y divide-gray-50">
                {leadSources.map(s => (
                  <div key={s.source} className="flex items-center gap-2 px-3 py-2">
                    <p className="text-[12px] text-gray-700 flex-1">{s.source}</p>
                    <p className="text-[11px] text-gray-500">{s.total} leads</p>
                    <p className="text-[11px] font-semibold text-emerald-600 w-10 text-right">{s.total ? Math.round(s.won / s.total * 100) : 0}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ── crm-report-perf ──
    if (itemId === "crm-report-perf") {
      const salesReps = [
        { name: "Phạm Thu Hà",    avatar: "PH", dealsWon: 3, revenue: 3360000000, winRate: 72 },
        { name: "Lê Văn Nam",     avatar: "LN", dealsWon: 3, revenue: 2780000000, winRate: 65 },
        { name: "Nguyễn Lan Anh", avatar: "NA", dealsWon: 2, revenue: 1330000000, winRate: 80 },
        { name: "Trần Đức Minh",  avatar: "TM", dealsWon: 2, revenue: 1210000000, winRate: 68 },
      ];
      const totalWonDeals = salesReps.reduce((s, r) => s + r.dealsWon, 0);
      const totalPerfRev  = salesReps.reduce((s, r) => s + r.revenue, 0);
      const avgWinRate    = Math.round(salesReps.reduce((s, r) => s + r.winRate, 0) / salesReps.length);
      const rankBadge = (i: number) =>
        i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-600" : "bg-gray-50 text-gray-400";
      const rankLabel = (i: number) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "#" + (i+1);
      const repAvatarBgs = ["bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-500"];
      return (
        <div className="h-full flex flex-col bg-white">
          <CrmNavBar />
          <div className="px-4 py-2 border-b border-gray-100 shrink-0">
            <p className="text-[15px] font-semibold text-gray-900">Hiệu suất Sales</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Win rate TB",  value: avgWinRate + "%",      color: "text-emerald-600", bg: "from-emerald-50 to-green-50",  border: "border-emerald-100" },
                { label: "Deal đã chốt", value: String(totalWonDeals), color: "text-blue-600",    bg: "from-blue-50 to-sky-50",       border: "border-blue-100"    },
                { label: "DT tổng",      value: crmFmt(totalPerfRev),  color: "text-purple-600",  bg: "from-purple-50 to-violet-50",  border: "border-purple-100"  },
              ].map((k, i) => (
                <div key={i} className={`rounded-xl border ${k.border} bg-gradient-to-br ${k.bg} p-3 text-center`}>
                  <p className={`text-[14px] font-bold ${k.color}`}>{k.value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Bảng xếp hạng</p>
            {[...salesReps].sort((a, b) => b.revenue - a.revenue).map((rep, i) => (
              <div key={rep.name} className="rounded-xl border border-gray-100 p-3 bg-white hover:border-blue-200 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[13px] font-bold ${rankBadge(i)} shrink-0`}>{rankLabel(i)}</span>
                  <div className={`w-8 h-8 rounded-full ${repAvatarBgs[i % repAvatarBgs.length]} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>{rep.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900">{rep.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-gray-500">{rep.dealsWon} deals</span>
                      <span className="text-[11px] font-bold text-blue-600">{crmFmt(rep.revenue)}</span>
                    </div>
                    <div className="mt-1.5">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[9px] text-gray-400">Win rate</span>
                        <span className="text-[9px] font-medium text-gray-600">{rep.winRate}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${i === 0 ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${rep.winRate}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  }


  // ── Custom announcement detail view ──
  if (customAnnounce) {
    const badgeColors: Record<string, string> = {
      "Khẩn cấp": "bg-red-100 text-red-700",
      "Quan trọng": "bg-orange-100 text-orange-700",
      "Thông báo": "bg-amber-100 text-amber-700",
      "Thông tin": "bg-blue-100 text-blue-700",
      "Sự kiện": "bg-purple-100 text-purple-700",
      "Cập nhật": "bg-green-100 text-green-700",
      "Bài viết": "bg-cyan-100 text-cyan-700",
      "Hot": "bg-red-100 text-red-700",
      "Tutorial": "bg-indigo-100 text-indigo-700",
      "Thảo luận": "bg-gray-100 text-gray-700",
      "Sắp diễn ra": "bg-violet-100 text-violet-700",
      "Đăng ký mở": "bg-teal-100 text-teal-700",
      "Miễn phí": "bg-green-100 text-green-700",
      "Online": "bg-sky-100 text-sky-700",
    };
    const badgeCls = badgeColors[customAnnounce.badge] || "bg-amber-100 text-amber-700";
    return (
      <div className={`h-full flex flex-col bg-white transition-all duration-300 ${animateIn ? "opacity-100" : "opacity-0"}`}>
        {/* ── Tiêu đề & Icon ── */}
        <div className="px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[24px] bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 shrink-0">
              {customAnnounce.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${badgeCls}`}>{customAnnounce.badge}</span>
                <span className="text-[10px] text-gray-400">{customAnnounce.category}</span>
              </div>
              <h2 className="text-[16px] font-semibold text-gray-900 leading-snug">{customAnnounce.name}</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Action bar */}
          <div className="flex items-center gap-1 mt-3">
            <button onClick={() => { setLiked(!liked); toast.success(liked ? "Đã bỏ thích" : "Đã thích"); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all ${liked ? "bg-pink-50 text-pink-600" : "text-gray-500 hover:bg-gray-50"}`}>
              <Heart className={`w-3.5 h-3.5 ${liked ? "fill-pink-500" : ""}`} /> {liked ? "Đã thích" : "Thích"}
            </button>
            <button onClick={() => { setBookmarked(!bookmarked); toast.success(bookmarked ? "Đã bỏ lưu" : "Đã lưu"); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all ${bookmarked ? "bg-amber-50 text-amber-600" : "text-gray-500 hover:bg-gray-50"}`}>
              <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? "fill-amber-500" : ""}`} /> {bookmarked ? "Đã lưu" : "Lưu"}
            </button>
            <button onClick={() => toast.info("Đã copy link")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-gray-500 hover:bg-gray-50 transition-all">
              <Share2 className="w-3.5 h-3.5" /> Chia sẻ
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* 1. Thông tin cơ bản */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
            <div className="px-3 py-1.5 bg-gray-100/60 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Thông tin cơ bản</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-gray-400">Danh mục</span>
                <span className="font-medium text-gray-700">{customAnnounce.category || "—"}</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-gray-400">Ngày đăng</span>
                <span className="font-medium text-gray-700">{customAnnounce.createdAt}</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-gray-400">Người đăng</span>
                <span className="font-medium text-gray-700">{customAnnounce.publishedBy || "—"}</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-gray-400">Mức độ</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeCls}`}>{customAnnounce.badge}</span>
              </div>
            </div>
          </div>

          {/* 2. Mô tả chi tiết */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Mô tả chi tiết</p>
            </div>
            <div className="px-4 py-3">
              {customAnnounce.description
                ? <p className="text-[13px] text-gray-700 leading-[1.7] whitespace-pre-wrap">{customAnnounce.description}</p>
                : <p className="text-[12px] text-gray-400 italic">Không có mô tả</p>
              }
            </div>
          </div>

          {/* 3. Thông tin nổi bật (stats) */}
          {customAnnounce.stats.length > 0 && (
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Thông tin nổi bật</p>
              </div>
              <div className={`p-3 grid gap-2.5 ${customAnnounce.stats.length === 1 ? "grid-cols-1" : customAnnounce.stats.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {customAnnounce.stats.map((s, i) => (
                  <div key={i} className="rounded-xl px-3.5 py-2.5 bg-amber-50 border border-amber-100 text-center">
                    <p className="text-[13px] font-bold text-amber-800">{s.value}</p>
                    <p className="text-[10px] text-amber-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Tệp đính kèm */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tệp đính kèm</p>
            </div>
            <div className="px-4 py-3">
              {customAnnounce.attachment
                ? <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-all cursor-pointer group">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="flex-1 text-[12px] text-gray-700 truncate">{customAnnounce.attachment}</span>
                    <Download className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500" />
                  </div>
                : <p className="text-[12px] text-gray-400 italic">Không có tệp đính kèm</p>
              }
            </div>
          </div>

          {/* 5. Bình luận */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Bình luận ({comments.length})</p>
            </div>
            {comments.length > 0
              ? <div className="px-4 py-3 space-y-3">
                  {comments.map((c, i) => (
                    <div key={i} className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white shrink-0" style={{ background: c.color, fontWeight: 600 }}>{c.initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] text-gray-800 font-semibold">{c.author}</span>
                          <span className="text-[10px] text-gray-400">{c.time}</span>
                        </div>
                        <p className="text-[12px] text-gray-600 mt-0.5">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              : <div className="px-4 py-6 text-center"><p className="text-[12px] text-gray-400">Chưa có bình luận nào</p></div>
            }
          </div>

        </div>

        {/* Comment input */}
        <div className="px-4 py-3 border-t border-gray-100 shrink-0 bg-white">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus-within:border-cyan-300 transition-all">
            <input type="text" placeholder="Viết bình luận..."
              value={comment} onChange={e => setComment(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSubmitComment(); }}
              className="flex-1 text-[13px] bg-transparent outline-none text-gray-700 placeholder-gray-400" />
            <button disabled={!comment.trim()} onClick={handleSubmitComment}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${comment.trim() ? "bg-cyan-500 text-white hover:bg-cyan-600" : "bg-gray-200 text-gray-400"}`}>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Category list view for an-cat-*, te-cat-*, ws-cat-* items ──
  if (itemId.startsWith("an-cat-") || itemId.startsWith("te-cat-") || itemId.startsWith("ws-cat-")) {
    const catName = (() => {
      for (const prefix of ["an-cat-u-", "te-cat-u-", "ws-cat-u-"]) {
        if (itemId.startsWith(prefix)) return itemId.slice(prefix.length);
      }
      return detail?.title ?? "";
    })();
    const hardcodedItems = Object.entries(allDetails)
      .filter(([id, d]) => d.category === catName && !id.startsWith("an-cat"))
      .sort(([, a], [, b]) => (a.publishedAt ?? "").localeCompare(b.publishedAt ?? ""))
      .reverse();
    const customItems = customAnnouncements.filter(a => a.category === catName);
    const badgeCls = (badge?: string) =>
      badge === "Quan trọng" ? "bg-red-100 text-red-700"
      : badge === "Thông tin" ? "bg-blue-100 text-blue-700"
      : "bg-amber-100 text-amber-700";
    return (
      <div className={`h-full flex flex-col bg-white transition-all duration-300 ${animateIn ? "opacity-100" : "opacity-0"}`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[24px] bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 shrink-0">
              {detail?.emoji ?? "📁"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400 mb-0.5 font-medium uppercase tracking-wide">Phân loại</p>
              <h2 className="text-[16px] font-semibold text-gray-900">{catName || "Chưa đặt tên"}</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {hardcodedItems.length === 0 && customItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <p className="text-[13px]">Chưa có thông báo nào trong phân loại này</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...customItems.map(a => ({ id: a.id, emoji: a.emoji, name: a.name, subtitle: a.createdAt, badge: a.badge })),
                ...hardcodedItems.map(([id, d]) => ({ id, emoji: d.emoji, name: d.title, subtitle: d.publishedAt ?? "", badge: d.badge }))
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-200 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[18px] bg-white border border-gray-200 shrink-0">
                    {item.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-800 truncate group-hover:text-gray-900">{item.name}</p>
                    {item.subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{item.subtitle}</p>}
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${badgeCls(item.badge)}`}>{item.badge}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Static announcement detail — same layout as user-published ("hi") ──
  if (detail && detail.category) {
    const badgeCls =
      detail.badge === "Khẩn cấp" ? "bg-red-100 text-red-700" :
      detail.badge === "Quan trọng" ? "bg-orange-100 text-orange-700" :
      detail.badge === "Thông tin" ? "bg-blue-100 text-blue-700" :
      detail.badge === "Sự kiện" ? "bg-purple-100 text-purple-700" :
      detail.badge === "Cập nhật" ? "bg-green-100 text-green-700" :
      "bg-amber-100 text-amber-700";
    return (
      <div className={`h-full flex flex-col bg-white transition-all duration-300 ${animateIn ? "opacity-100" : "opacity-0"}`}>
        {/* Tiêu đề & Icon */}
        <div className="px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[24px] bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 shrink-0">
              {detail.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${badgeCls}`}>{detail.badge}</span>
                <span className="text-[10px] text-gray-400">{detail.category}</span>
              </div>
              <h2 className="text-[16px] font-semibold text-gray-900 leading-snug">{detail.title}</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1 mt-3">
            <button onClick={() => { setLiked(!liked); toast.success(liked ? "Đã bỏ thích" : "Đã thích"); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all ${liked ? "bg-pink-50 text-pink-600" : "text-gray-500 hover:bg-gray-50"}`}>
              <Heart className={`w-3.5 h-3.5 ${liked ? "fill-pink-500" : ""}`} /> {liked ? "Đã thích" : "Thích"}
            </button>
            <button onClick={() => { setBookmarked(!bookmarked); toast.success(bookmarked ? "Đã bỏ lưu" : "Đã lưu"); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all ${bookmarked ? "bg-amber-50 text-amber-600" : "text-gray-500 hover:bg-gray-50"}`}>
              <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? "fill-amber-500" : ""}`} /> {bookmarked ? "Đã lưu" : "Lưu"}
            </button>
            <button onClick={() => toast.info("Đã copy link")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-gray-500 hover:bg-gray-50 transition-all">
              <Share2 className="w-3.5 h-3.5" /> Chia sẻ
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* 1. Thông tin cơ bản */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
            <div className="px-3 py-1.5 bg-gray-100/60 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Thông tin cơ bản</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-gray-400">Danh mục</span>
                <span className="font-medium text-gray-700">{detail.category}</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-gray-400">Ngày đăng</span>
                <span className="font-medium text-gray-700">{detail.publishedAt ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-gray-400">Người đăng</span>
                <span className="font-medium text-gray-700">{detail.publishedBy ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-gray-400">Mức độ</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeCls}`}>{detail.badge}</span>
              </div>
            </div>
          </div>
          {/* 2. Mô tả chi tiết */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Mô tả chi tiết</p>
            </div>
            <div className="px-4 py-3">
              {detail.description
                ? <p className="text-[13px] text-gray-700 leading-[1.7] whitespace-pre-wrap">{detail.description}</p>
                : <p className="text-[12px] text-gray-400 italic">Không có mô tả</p>
              }
            </div>
          </div>
          {/* 3. Tệp đính kèm */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tệp đính kèm</p>
            </div>
            <div className="px-4 py-3">
              {detail.attachment
                ? <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-all cursor-pointer group">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="flex-1 text-[12px] text-gray-700 truncate">{detail.attachment}</span>
                    <Download className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500" />
                  </div>
                : <p className="text-[12px] text-gray-400 italic">Không có tệp đính kèm</p>
              }
            </div>
          </div>
          {/* 4. Bình luận */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Bình luận ({comments.length})</p>
            </div>
            {comments.length > 0
              ? <div className="px-4 py-3 space-y-3">
                  {comments.map((c, i) => (
                    <div key={i} className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white shrink-0" style={{ background: c.color, fontWeight: 600 }}>{c.initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] text-gray-800 font-semibold">{c.author}</span>
                          <span className="text-[10px] text-gray-400">{c.time}</span>
                        </div>
                        <p className="text-[12px] text-gray-600 mt-0.5">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              : <div className="px-4 py-6 text-center"><p className="text-[12px] text-gray-400">Chưa có bình luận nào</p></div>
            }
          </div>
        </div>
        {/* Comment input */}
        <div className="px-4 py-3 border-t border-gray-100 shrink-0 bg-white">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus-within:border-cyan-300 transition-all">
            <input type="text" placeholder="Viết bình luận..."
              value={comment} onChange={e => setComment(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSubmitComment(); }}
              className="flex-1 text-[13px] bg-transparent outline-none text-gray-700 placeholder-gray-400" />
            <button disabled={!comment.trim()} onClick={handleSubmitComment}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${comment.trim() ? "bg-cyan-500 text-white hover:bg-cyan-600" : "bg-gray-200 text-gray-400"}`}>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="h-full flex flex-col bg-white items-center justify-center text-gray-400">
        <FileText className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-[14px]" style={{ fontWeight: 500 }}>Nội dung đang được cập nhật</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-[12px] hover:bg-gray-200 transition-all">
          ← Quay lại
        </button>
      </div>
    );
  }

  const badge = typeBadge[detail.type] || typeBadge.article;

  const announceBadgeColors: Record<string, string> = {
    "Khẩn cấp": "bg-red-100 text-red-700",
    "Quan trọng": "bg-orange-100 text-orange-700",
    "Thông báo": "bg-amber-100 text-amber-700",
    "Thông tin": "bg-blue-100 text-blue-700",
    "Sự kiện": "bg-purple-100 text-purple-700",
    "Cập nhật": "bg-green-100 text-green-700",
  };
  const announceBadgeCls = detail.badge ? (announceBadgeColors[detail.badge] || "bg-amber-100 text-amber-700") : `${badge.bg} ${badge.color}`;

  const handleSendComment = () => {
    if (!comment.trim()) return;
    toast.success("Đã gửi bình luận");
    setComment("");
  };

  // Type-specific action buttons
  const getTypeActions = () => {
    switch (detail.type) {
      case "event":
        return (
          <button
            onClick={() => { onToggleRegister ? onToggleRegister(itemId) : setLocalRegistered(v => !v); toast.success(registered ? "Đã hủy đăng ký" : "Đã đăng ký tham gia!"); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all ${registered ? "bg-purple-100 text-purple-700 font-medium" : "bg-purple-50 text-purple-600 hover:bg-purple-100"}`}
          >
            <Calendar className="w-3.5 h-3.5" /> {registered ? "Đã đăng ký" : "Đăng ký"}
          </button>
        );
      case "ticket":
        if (!itemId.startsWith("sp-")) return null;
        return (
          <div className="flex items-center gap-1.5">
            {ticketStatus !== "resolved" ? (
              <>
                {ticketStatus !== "in_progress" && (
                  <button onClick={() => { setTicketStatus(itemId, "in_progress"); toast.success("Đang xử lý"); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all">
                    <Circle className="w-3.5 h-3.5" /> Đang xử lý
                  </button>
                )}
                {ticketStatus !== "waiting" && (
                  <button onClick={() => { setTicketStatus(itemId, "waiting"); toast.success("Chờ phản hồi khách"); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all">
                    <Clock className="w-3.5 h-3.5" /> Chờ phản hồi
                  </button>
                )}
                <button onClick={() => { setTicketStatus(itemId, "resolved"); toast.success("Ticket đã được giải quyết ✓"); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] bg-green-50 text-green-600 hover:bg-green-100 transition-all font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã giải quyết
                </button>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] bg-green-50 text-green-600 border border-green-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã giải quyết
                </span>
                <button onClick={() => { setTicketStatus(itemId, "open"); toast.success("Ticket đã được mở lại"); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] bg-gray-50 text-gray-500 hover:bg-gray-100 transition-all">
                  Mở lại
                </button>
              </>
            )}
          </div>
        );
      case "job":
        return (
          <button onClick={() => toast.success("Đã gửi giới thiệu")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] bg-cyan-50 text-cyan-600 hover:bg-cyan-100 transition-all">
            <UserPlus className="w-3.5 h-3.5" /> Giới thiệu
          </button>
        );
      case "activity":
        return (
          <button onClick={() => toast.success("Đã đăng ký!")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] bg-green-50 text-green-600 hover:bg-green-100 transition-all">
            <CheckCircle2 className="w-3.5 h-3.5" /> Tham gia
          </button>
        );
      case "feature":
        return (
          <button onClick={() => toast.success("Đã vote +1")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all">
            <ThumbsUp className="w-3.5 h-3.5" /> Vote
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Back navigation */}
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 shrink-0 flex items-center gap-2">
        <button
          onClick={() => {
            if (itemId.startsWith("sp-")) {
              if (canNavBack && onNavBack) onNavBack();
              else onNavigate?.("sp-list-all");
            } else {
              onClose();
            }
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] text-gray-500 hover:text-gray-700 hover:bg-white transition-all group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>{itemId.startsWith("sp-") ? "Tất cả ticket" : "Quay lại chat"}</span>
        </button>
        <div className="flex-1" />
      </div>

      {/* Header */}
      <div className={`px-6 py-4 border-b border-gray-100 shrink-0 transition-all duration-300 ${animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-[24px] bg-gradient-to-br shrink-0 ${detail.category && detail.publishedAt ? "from-amber-50 to-orange-50 border border-amber-100" : "from-gray-50 to-gray-100 border border-gray-200"}`}>
            {detail.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${announceBadgeCls}`}>
                {detail.badge ?? badge.label}
              </span>
              {detail.category && <span className="text-[10px] text-gray-400">{detail.category}</span>}
            </div>
            <h2 className="text-[16px] text-gray-900" style={{ fontWeight: 600 }}>{detail.title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 shrink-0" title="Quay lại chat">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-1 mt-3">
          <button
            onClick={() => { onToggleLike ? onToggleLike(itemId) : setLocalLiked(v => !v); toast.success(liked ? "Đã bỏ thích" : "Đã thích"); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all ${
              liked ? "bg-pink-50 text-pink-600" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? "fill-pink-500" : ""}`} />
            {liked ? "Đã thích" : "Thích"}
          </button>
          <button
            onClick={() => { onToggleSave ? onToggleSave(itemId) : setLocalBookmarked(v => !v); toast.success(bookmarked ? "Đã bỏ lưu" : "Đã lưu"); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all ${
              bookmarked ? "bg-amber-50 text-amber-600" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? "fill-amber-500" : ""}`} />
            {bookmarked ? "Đã lưu" : "Lưu"}
          </button>
          {getTypeActions()}
          <button
            onClick={() => { copyToClipboard(detail.title).then(() => toast.success("Đã copy link")); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-gray-500 hover:bg-gray-50 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            Chia sẻ
          </button>
          <div className="flex-1" />
          <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto transition-all duration-300 delay-75 ${animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
        <div className="px-6 py-5 space-y-5">

          {/* ── Layout phân nhánh: thông báo có category/publishedAt dùng layout mới, còn lại dùng layout cũ ── */}
          {detail.category && detail.publishedAt ? (
            <>
              {/* 1. Thông tin cơ bản — dùng các trường chuẩn giống custom announcement */}
              <div className="rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
                <div className="px-3 py-1.5 bg-gray-100/60 border-b border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Thông tin cơ bản</p>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-400">Danh mục</span>
                    <span className="font-medium text-gray-700">{detail.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-400">Ngày đăng</span>
                    <span className="font-medium text-gray-700">{detail.publishedAt}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-400">Người đăng</span>
                    <span className="font-medium text-gray-700">{detail.publishedBy ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-gray-400">Mức độ</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.color}`}>{detail.badge ?? badge.label}</span>
                  </div>
                </div>
              </div>

              {/* 2. Mô tả chi tiết */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Mô tả chi tiết</p>
                </div>
                <div className="px-4 py-3">
                  {detail.description
                    ? <p className="text-[13px] text-gray-700 leading-[1.7] whitespace-pre-wrap">{detail.description}</p>
                    : <p className="text-[12px] text-gray-400 italic">Không có mô tả</p>
                  }
                </div>
              </div>

              {/* 3. Thông tin nổi bật — dùng detail.meta như stat cards */}
              {detail.meta.length > 0 && (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Thông tin nổi bật</p>
                  </div>
                  <div className={`p-3 grid gap-2.5 ${detail.meta.length === 1 ? "grid-cols-1" : detail.meta.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                    {detail.meta.map((m, i) => (
                      <div key={i} className={`rounded-xl px-3.5 py-2.5 border text-center ${m.highlight ? "bg-cyan-50 border-cyan-100" : "bg-amber-50 border-amber-100"}`}>
                        <p className={`text-[13px] font-bold ${m.highlight ? "text-cyan-800" : "text-amber-800"}`}>{m.value}</p>
                        <p className={`text-[10px] mt-0.5 ${m.highlight ? "text-cyan-500" : "text-amber-500"}`}>{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Tệp đính kèm */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tệp đính kèm</p>
                </div>
                <div className="px-4 py-3">
                  {detail.attachment
                    ? <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-all cursor-pointer group">
                        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="flex-1 text-[12px] text-gray-700 truncate">{detail.attachment}</span>
                        <Download className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500" />
                      </div>
                    : <p className="text-[12px] text-gray-400 italic">Không có tệp đính kèm</p>
                  }
                </div>
              </div>

              {/* 5. Bình luận */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Bình luận (0)</p>
                </div>
                <div className="px-4 py-6 text-center">
                  <p className="text-[12px] text-gray-400">Chưa có bình luận nào</p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Layout cũ cho finance, culture, tech, support items */}
              {detail.meta.length > 0 && (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Thông tin cơ bản</p>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {detail.meta.map((m, i) => (
                      <div key={i} className="flex items-center justify-between text-[12px]">
                        <span className="text-gray-400">{m.label}</span>
                        <span className={`font-medium ${m.highlight ? "text-cyan-600" : "text-gray-700"}`}>{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detail.progressPercent !== undefined && (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tiến độ</p>
                  </div>
                  <div className="px-4 py-3"><ProgressBar percent={detail.progressPercent} /></div>
                </div>
              )}

              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Mô tả chi tiết</p>
                </div>
                <div className="px-4 py-3">
                  {detail.description
                    ? <p className="text-[13px] text-gray-700 leading-[1.7] whitespace-pre-wrap">{detail.description}</p>
                    : <p className="text-[12px] text-gray-400 italic">Không có mô tả</p>
                  }
                </div>
              </div>

              {detail.stats && detail.stats.length > 0 && (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Thông tin nổi bật</p>
                  </div>
                  <div className={`p-3 grid gap-2.5 ${detail.stats.length === 1 ? "grid-cols-1" : detail.stats.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                    {detail.stats.map((s, i) => (
                      <div key={i} className="rounded-xl px-3.5 py-2.5 bg-amber-50 border border-amber-100 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-0.5">
                          <p className="text-[13px] font-bold text-amber-800">{s.value}</p>
                          {s.trend === "up" && <TrendingUp className="w-3 h-3 text-green-500" />}
                          {s.trend === "down" && <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />}
                        </div>
                        <p className="text-[10px] text-amber-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detail.ticketTimeline && <div className="rounded-xl border border-gray-100 overflow-hidden"><div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100"><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Lịch sử xử lý</p></div><div className="p-3"><TicketTimeline items={detail.ticketTimeline} /></div></div>}
              {detail.eventSchedule && <div className="rounded-xl border border-gray-100 overflow-hidden"><div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100"><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Lịch trình</p></div><div className="p-3"><EventSchedule items={detail.eventSchedule} /></div></div>}
              {detail.pollOptions && (() => {
                const isClosed = closedPolls.has(itemId);
                const showResults = isClosed || !!votedOption;
                return (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{showResults ? "Kết quả bình chọn" : "Bình chọn"}</p>
                      <div className="flex items-center gap-2">
                        {!isClosed && votedOption && (
                          <button onClick={() => setVotedOption(null)} className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium transition-all">Thay đổi</button>
                        )}
                        <button
                          onClick={() => onTogglePollClosed?.(itemId)}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-all ${isClosed ? "bg-gray-100 text-gray-500 hover:bg-gray-200" : "bg-green-100 text-green-600 hover:bg-green-200"}`}
                        >
                          {isClosed ? "Đã đóng" : "Đang mở"}
                        </button>
                      </div>
                    </div>
                    <div className="p-3">
                      {showResults ? (
                        <PollResults options={detail.pollOptions} votedOption={isClosed ? undefined : votedOption} onChangeVote={!isClosed ? (label) => {
                          setVotedOption(label);
                          toast.success("Đã đổi bình chọn: " + label, { duration: 2000 });
                        } : undefined} />
                      ) : (
                        <div className="space-y-2">
                          {detail.pollOptions.map((opt, i) => (
                            <button key={i} onClick={() => {
                              setVotedOption(opt.label);
                              toast.success("Đã bình chọn: " + opt.label, { duration: 2000 });
                            }}
                              className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all">
                              <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                              <span className="text-[13px] text-gray-700 flex-1">{opt.label}</span>
                            </button>
                          ))}
                          <p className="text-[10px] text-gray-400 mt-1 text-center">{detail.pollOptions.reduce((s, o) => s + o.votes, 0)} phiếu · Chọn 1 đáp án</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
              {detail.jobRequirements && <div className="rounded-xl border border-gray-100 overflow-hidden"><div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100"><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Yêu cầu công việc</p></div><div className="p-3"><JobRequirements items={detail.jobRequirements} /></div></div>}
              {detail.checklist && <div className="rounded-xl border border-gray-100 overflow-hidden"><div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100"><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Checklist</p></div><div className="p-3"><Checklist items={detail.checklist} /></div></div>}
              {detail.participants && <div className="rounded-xl border border-gray-100 overflow-hidden"><div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100"><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Người tham gia</p></div><div className="p-3"><Participants people={detail.participants} /></div></div>}

              {detail.checklist && detail.checklist.some(c => !c.done) && itemId === "fi-inv-pending" && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-[12px] font-semibold text-amber-800 mb-3">Phê duyệt hóa đơn chờ duyệt</p>
                  <div className="space-y-2">
                    {detail.checklist.filter(c => !c.done).map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100">
                        <span className="text-[12px] text-gray-700 flex-1">{item.label}</span>
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => toast.success("Đã duyệt: " + item.label.split(" - ")[0])} className="px-2.5 py-1 rounded-lg text-[11px] bg-green-100 text-green-700 hover:bg-green-200 transition-all font-medium">Duyệt</button>
                          <button onClick={() => toast.error("Đã từ chối: " + item.label.split(" - ")[0])} className="px-2.5 py-1 rounded-lg text-[11px] bg-red-100 text-red-600 hover:bg-red-200 transition-all font-medium">Từ chối</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(itemId === "fi-overdue-rent" || itemId === "fi-overdue-sw") && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-[11px] text-red-600 mb-3">⚠️ Cần thanh toán ngay để tránh phát sinh thêm hậu quả</p>
                  <div className="flex gap-2">
                    <button onClick={() => toast.success("Đã tạo lệnh thanh toán thành công")} className="flex-1 py-2 rounded-xl text-[12px] font-semibold bg-red-500 text-white hover:bg-red-600 transition-all">Tạo lệnh thanh toán</button>
                    <button onClick={() => toast.info("Đã nhắc nhở bộ phận liên quan")} className="px-3 py-2 rounded-xl text-[12px] bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-all">Nhắc nhở</button>
                  </div>
                </div>
              )}

              {detail.tags && detail.tags.length > 0 && (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Nhãn</p>
                  </div>
                  <div className="px-4 py-3 flex flex-wrap gap-1.5">
                    {detail.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg bg-gray-100 text-[11px] text-gray-600 border border-gray-200">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tệp đính kèm</p>
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-all cursor-pointer group">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="flex-1 text-[12px] text-gray-700 truncate">{detail.attachment || "Tài liệu chi tiết.pdf"}</span>
                    {!detail.attachment && <span className="text-[10px] text-gray-400">2.3 MB</span>}
                    <Download className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Bình luận ({defaultComments.length})</p>
                </div>
                {defaultComments.length > 0
                  ? <div className="px-4 py-3 space-y-3">
                      {defaultComments.map((c, i) => (
                        <div key={i} className="flex gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white shrink-0" style={{ background: c.color, fontWeight: 600 }}>{c.initials}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] text-gray-800 font-semibold">{c.author}</span>
                              <span className="text-[10px] text-gray-400">{c.time}</span>
                            </div>
                            <p className="text-[12px] text-gray-600 mt-0.5">{c.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  : <div className="px-4 py-6 text-center"><p className="text-[12px] text-gray-400">Chưa có bình luận nào</p></div>
                }
              </div>
            </>
          )}

        </div>
      </div>

      {/* Comment input */}
      <div className="px-4 py-3 border-t border-gray-100 shrink-0 bg-white">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus-within:border-cyan-300 transition-all">
          <input
            type="text"
            placeholder="Viết bình luận..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSendComment()}
            className="flex-1 text-[13px] bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
          <button
            onClick={handleSendComment}
            disabled={!comment.trim()}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              comment.trim() ? "bg-cyan-500 text-white hover:bg-cyan-600" : "bg-gray-200 text-gray-400"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
