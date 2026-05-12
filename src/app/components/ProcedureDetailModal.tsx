import { useState, useRef, useEffect } from "react";
import {
  X, Plus, ChevronDown, Clock, CheckCircle2, XCircle, AlertCircle,
  CalendarDays, User, FileText, Send, Paperclip, MessageSquare,
  ArrowRight, RotateCcw, Eye, Download, MoreHorizontal, Filter,
  ChevronRight, Info, History, Users, Building2, Tag, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";

/* ═══════════ Types ═══════════ */
type RequestStatus = "pending" | "approved" | "rejected" | "processing" | "cancelled";

interface RequestItem {
  id: string;
  code: string;
  requester: { name: string; initials: string; color: string; department: string };
  title: string;
  description: string;
  createdAt: string;
  status: RequestStatus;
  approver?: { name: string; initials: string; color: string };
  approvedAt?: string;
  priority: "low" | "medium" | "high" | "urgent";
  comments: number;
  attachments: number;
}

interface ProcedureInfo {
  id: string;
  name: string;
  emoji: string;
  category: string;
  description: string;
  avgProcessTime: string;
  approvalSteps: string[];
  requiredDocs: string[];
}

/* ═══════════ Status config ═══════════ */
const statusConfig: Record<RequestStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: "Chờ duyệt", color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: <Clock className="w-3.5 h-3.5" /> },
  processing: { label: "Đang xử lý", color: "text-blue-600", bg: "bg-blue-50 border-blue-200", icon: <RotateCcw className="w-3.5 h-3.5" /> },
  approved: { label: "Đã duyệt", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected: { label: "Từ chối", color: "text-red-500", bg: "bg-red-50 border-red-200", icon: <XCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: "Đã huỷ", color: "text-gray-400", bg: "bg-gray-50 border-gray-200", icon: <XCircle className="w-3.5 h-3.5" /> },
};

const priorityConfig: Record<string, { label: string; color: string; dot: string }> = {
  low: { label: "Thấp", color: "text-gray-500", dot: "bg-gray-400" },
  medium: { label: "Trung bình", color: "text-blue-600", dot: "bg-blue-500" },
  high: { label: "Cao", color: "text-orange-600", dot: "bg-orange-500" },
  urgent: { label: "Khẩn cấp", color: "text-red-600", dot: "bg-red-500" },
};

/* ═══════════ Procedure metadata ═══════════ */
const procedureMetadata: Record<string, ProcedureInfo> = {
  "pr-leave": {
    id: "pr-leave", name: "Xin nghỉ phép", emoji: "📅", category: "leave",
    description: "Đăng ký nghỉ phép năm, nghỉ ốm, nghỉ việc riêng hoặc các loại nghỉ phép khác theo quy định công ty.",
    avgProcessTime: "1-2 ngày làm việc",
    approvalSteps: ["Quản lý trực tiếp", "Trưởng phòng nhân sự"],
    requiredDocs: ["Đơn xin nghỉ phép", "Giấy khám bệnh (nếu nghỉ ốm)"],
  },
  "pr-remote": {
    id: "pr-remote", name: "Đăng ký làm việc từ xa", emoji: "🏠", category: "leave",
    description: "Đăng ký làm việc từ xa (WFH) theo ngày hoặc theo tuần. Áp dụng cho các vị trí được phép WFH.",
    avgProcessTime: "Trong ngày",
    approvalSteps: ["Quản lý trực tiếp"],
    requiredDocs: ["Không yêu cầu"],
  },
  "pr-salary-adv": {
    id: "pr-salary-adv", name: "Tạm ứng lương", emoji: "💰", category: "advance",
    description: "Yêu cầu tạm ứng lương trước kỳ thanh toán. Tối đa 50% lương tháng hiện tại.",
    avgProcessTime: "2-3 ngày làm việc",
    approvalSteps: ["Quản lý trực tiếp", "Kế toán trưởng", "Giám đốc tài chính"],
    requiredDocs: ["Đơn tạm ứng lương", "Xác nhận kế toán"],
  },
  "pr-project-adv": {
    id: "pr-project-adv", name: "Tạm ứng dự án", emoji: "💳", category: "advance",
    description: "Yêu cầu tạm ứng chi phí cho dự án. Phải có phê duyệt từ PM và kế toán.",
    avgProcessTime: "3-5 ngày làm việc",
    approvalSteps: ["Project Manager", "Kế toán trưởng", "Giám đốc tài chính"],
    requiredDocs: ["Đề xuất tạm ứng", "Bảng dự toán chi phí", "Phê duyệt PM"],
  },
  "pr-travel": {
    id: "pr-travel", name: "Thanh toán công tác phí", emoji: "✈️", category: "payment",
    description: "Thanh toán các chi phí phát sinh trong chuyến công tác: vé máy bay, khách sạn, ăn uống, di chuyển.",
    avgProcessTime: "5-7 ngày làm việc",
    approvalSteps: ["Quản lý trực tiếp", "Kế toán", "Giám đốc tài chính"],
    requiredDocs: ["Hoá đơn gốc", "Bảng kê chi phí", "Vé máy bay/tàu", "Biên nhận khách sạn"],
  },
  "pr-expense": {
    id: "pr-expense", name: "Đề nghị thanh toán", emoji: "🧾", category: "payment",
    description: "Đề nghị thanh toán các khoản chi phí phát sinh trong công việc.",
    avgProcessTime: "3-5 ngày làm việc",
    approvalSteps: ["Quản lý trực tiếp", "Kế toán"],
    requiredDocs: ["Hoá đơn/biên nhận", "Phiếu đề nghị thanh toán"],
  },
  "pr-buy-equip": {
    id: "pr-buy-equip", name: "Đề xuất mua thiết bị", emoji: "📦", category: "equipment",
    description: "Đề xuất mua sắm thiết bị, dụng cụ làm việc cho cá nhân hoặc phòng ban.",
    avgProcessTime: "5-10 ngày làm việc",
    approvalSteps: ["Quản lý trực tiếp", "Trưởng phòng hành chính", "Giám đốc"],
    requiredDocs: ["Đơn đề xuất mua thiết bị", "Báo giá (tối thiểu 3 nhà cung cấp)"],
  },
  "pr-fix-equip": {
    id: "pr-fix-equip", name: "Báo hỏng/Sửa chữa thiết bị", emoji: "🔧", category: "equipment",
    description: "Báo cáo thiết bị hỏng và yêu cầu sửa chữa hoặc thay thế.",
    avgProcessTime: "1-3 ngày làm việc",
    approvalSteps: ["Phòng IT/Hành chính"],
    requiredDocs: ["Phiếu báo hỏng thiết bị"],
  },
  "pr-return-equip": {
    id: "pr-return-equip", name: "Trả thiết bị", emoji: "📤", category: "equipment",
    description: "Trả lại thiết bị công ty khi không còn sử dụng hoặc khi nghỉ việc.",
    avgProcessTime: "1 ngày làm việc",
    approvalSteps: ["Phòng hành chính"],
    requiredDocs: ["Biên bản bàn giao thiết bị"],
  },
  "pr-training": {
    id: "pr-training", name: "Đăng ký đào tạo", emoji: "🎓", category: "training",
    description: "Đăng ký tham gia khoá đào tạo nội bộ hoặc bên ngoài. Bao gồm cả đào tạo online.",
    avgProcessTime: "3-5 ngày làm việc",
    approvalSteps: ["Quản lý trực tiếp", "Trưởng phòng nhân sự"],
    requiredDocs: ["Đơn đăng ký đào tạo", "Thông tin khoá học"],
  },
  "pr-cert": {
    id: "pr-cert", name: "Xin cấp giấy xác nhận", emoji: "📜", category: "admin",
    description: "Xin cấp giấy xác nhận đang làm việc, xác nhận lương, xác nhận kinh nghiệm, v.v.",
    avgProcessTime: "2-3 ngày làm việc",
    approvalSteps: ["Phòng nhân sự"],
    requiredDocs: ["Đơn xin cấp giấy xác nhận"],
  },
  "pr-stamp": {
    id: "pr-stamp", name: "Yêu cầu đóng dấu", emoji: "🔏", category: "admin",
    description: "Yêu cầu đóng dấu công ty lên văn bản, hợp đồng hoặc tài liệu.",
    avgProcessTime: "Trong ngày",
    approvalSteps: ["Trưởng phòng hành chính"],
    requiredDocs: ["Văn bản cần đóng dấu", "Phiếu yêu cầu đóng dấu"],
  },
  "pr-room": {
    id: "pr-room", name: "Đặt phòng họp", emoji: "🏢", category: "admin",
    description: "Đặt phòng họp theo giờ hoặc theo ngày. Kiểm tra lịch trống và đặt trước.",
    avgProcessTime: "Ngay lập tức",
    approvalSteps: ["Tự động phê duyệt"],
    requiredDocs: ["Không yêu cầu"],
  },
  "pr-vehicle": {
    id: "pr-vehicle", name: "Đặt xe công tác", emoji: "🚗", category: "admin",
    description: "Đặt xe công ty để đi công tác, gặp khách hàng hoặc di chuyển công vụ.",
    avgProcessTime: "1 ngày làm việc",
    approvalSteps: ["Quản lý trực tiếp", "Phòng hành chính"],
    requiredDocs: ["Phiếu đặt xe"],
  },
  "pr-schedule": {
    id: "pr-schedule", name: "Đề xuất thay đổi lịch làm việc", emoji: "⏰", category: "hr",
    description: "Đề xuất thay đổi ca làm việc, giờ làm việc linh hoạt hoặc lịch làm việc đặc biệt.",
    avgProcessTime: "3-5 ngày làm việc",
    approvalSteps: ["Quản lý trực tiếp", "Trưởng phòng nhân sự"],
    requiredDocs: ["Đơn đề xuất thay đổi lịch"],
  },
  "pr-maternity": {
    id: "pr-maternity", name: "Đăng ký nghỉ thai sản", emoji: "👶", category: "hr",
    description: "Đăng ký nghỉ thai sản theo quy định Luật Lao Động. Thời gian nghỉ tối đa 6 tháng.",
    avgProcessTime: "5-7 ngày làm việc",
    approvalSteps: ["Quản lý trực tiếp", "Trưởng phòng nhân sự", "Ban giám đốc"],
    requiredDocs: ["Đơn xin nghỉ thai sản", "Giấy khám thai", "Giấy chứng sinh (sau sinh)"],
  },
  "pr-insurance": {
    id: "pr-insurance", name: "Đăng ký bảo hiểm", emoji: "❤️", category: "hr",
    description: "Đăng ký hoặc thay đổi gói bảo hiểm sức khoẻ, bảo hiểm nhân thọ cho bản thân và người thân.",
    avgProcessTime: "5-10 ngày làm việc",
    approvalSteps: ["Phòng nhân sự", "Công ty bảo hiểm"],
    requiredDocs: ["Đơn đăng ký bảo hiểm", "CMND/CCCD", "Giấy tờ người thân (nếu có)"],
  },
  "pr-health": {
    id: "pr-health", name: "Đăng ký khám sức khỏe", emoji: "🩺", category: "hr",
    description: "Đăng ký khám sức khoẻ định kỳ hàng năm tại các cơ sở y tế liên kết với công ty.",
    avgProcessTime: "Theo lịch đợt khám",
    approvalSteps: ["Phòng nhân sự"],
    requiredDocs: ["Không yêu cầu"],
  },
};

/* ═══════════ Mock existing requests ═══════════ */
const mockRequests: Record<string, RequestItem[]> = {
  "pr-leave": [
    {
      id: "req-001", code: "NP-2026-0142", title: "Nghỉ phép năm - 3 ngày",
      description: "Xin nghỉ phép năm từ 22/03 đến 24/03/2026 để giải quyết việc gia đình.",
      requester: { name: "Nguyễn Minh Anh", initials: "NA", color: "#4f46e5", department: "Engineering" },
      createdAt: "15/03/2026", status: "pending", priority: "medium", comments: 2, attachments: 0,
      approver: { name: "Trần Văn Hùng", initials: "TH", color: "#059669" },
    },
    {
      id: "req-002", code: "NP-2026-0141", title: "Nghỉ ốm - 1 ngày",
      description: "Xin nghỉ ốm ngày 14/03/2026. Đã có giấy khám bệnh đính kèm.",
      requester: { name: "Lê Thị Hương", initials: "LH", color: "#db2777", department: "Marketing" },
      createdAt: "14/03/2026", status: "approved", priority: "high", comments: 1, attachments: 1,
      approver: { name: "Phạm Đức Long", initials: "PL", color: "#7c3aed" }, approvedAt: "14/03/2026",
    },
  ],
  "pr-remote": [
    {
      id: "req-003", code: "WFH-2026-0089", title: "Làm việc từ xa - Thứ 6 hàng tuần",
      description: "Đăng ký WFH cố định vào thứ 6 hàng tuần trong tháng 4/2026.",
      requester: { name: "Hoàng Đức Trí", initials: "HT", color: "#0891b2", department: "Engineering" },
      createdAt: "16/03/2026", status: "processing", priority: "low", comments: 3, attachments: 0,
      approver: { name: "Trần Văn Hùng", initials: "TH", color: "#059669" },
    },
  ],
  "pr-salary-adv": [
    {
      id: "req-004", code: "TU-2026-0034", title: "Tạm ứng 50% lương tháng 3",
      description: "Xin tạm ứng 50% lương tháng 3 để giải quyết chi phí cá nhân khẩn cấp.",
      requester: { name: "Võ Thanh Sơn", initials: "VS", color: "#d97706", department: "Sales" },
      createdAt: "10/03/2026", status: "approved", priority: "urgent", comments: 4, attachments: 1,
      approver: { name: "Nguyễn Thị Mai", initials: "NM", color: "#dc2626" }, approvedAt: "12/03/2026",
    },
  ],
  "pr-travel": [
    {
      id: "req-005", code: "CT-2026-0021", title: "Công tác HCM 05-07/03",
      description: "Thanh toán chi phí công tác TP.HCM: vé máy bay, khách sạn 2 đêm, taxi, ăn uống. Tổng: 8.500.000đ.",
      requester: { name: "Đặng Quốc Bảo", initials: "DB", color: "#16a34a", department: "Business" },
      createdAt: "08/03/2026", status: "processing", priority: "medium", comments: 2, attachments: 5,
      approver: { name: "Lý Minh Châu", initials: "LC", color: "#b91c1c" },
    },
  ],
  "pr-expense": [
    {
      id: "req-006", code: "TT-2026-0056", title: "Thanh toán phần mềm Figma",
      description: "Thanh toán license Figma Business cho team Design - 12 seats, $15/seat/month.",
      requester: { name: "Trần Khánh Linh", initials: "TL", color: "#7c3aed", department: "Design" },
      createdAt: "12/03/2026", status: "pending", priority: "high", comments: 1, attachments: 2,
      approver: { name: "Nguyễn Thị Mai", initials: "NM", color: "#dc2626" },
    },
  ],
  "pr-buy-equip": [
    {
      id: "req-007", code: "TB-2026-0015", title: "Mua 5 bộ bàn phím cơ",
      description: "Đề xuất mua 5 bộ bàn phím cơ Keychron K8 Pro cho team Engineering. Báo giá đính kèm.",
      requester: { name: "Phạm Anh Tuấn", initials: "PT", color: "#0891b2", department: "Engineering" },
      createdAt: "11/03/2026", status: "pending", priority: "medium", comments: 3, attachments: 3,
      approver: { name: "Vũ Hồng Nhung", initials: "VN", color: "#059669" },
    },
  ],
  "pr-fix-equip": [
    {
      id: "req-008", code: "SC-2026-0042", title: "Màn hình Dell 27\" bị lỗi",
      description: "Màn hình Dell U2722D tại vị trí D-15 bị nhấp nháy liên tục. Mã tài sản: IT-MON-0234.",
      requester: { name: "Lê Quang Huy", initials: "LH", color: "#ea580c", department: "Product" },
      createdAt: "17/03/2026", status: "processing", priority: "high", comments: 2, attachments: 1,
    },
  ],
  "pr-room": [
    {
      id: "req-009", code: "PH-2026-0198", title: "Phòng họp A3 - Sprint Review",
      description: "Đặt phòng họp A3 (20 người) cho Sprint Review ngày 21/03/2026, 14:00-16:00.",
      requester: { name: "Nguyễn Minh Anh", initials: "NA", color: "#4f46e5", department: "Engineering" },
      createdAt: "17/03/2026", status: "approved", priority: "medium", comments: 0, attachments: 0,
    },
    {
      id: "req-010", code: "PH-2026-0199", title: "Phòng họp B1 - All Hands",
      description: "Đặt phòng B1 (50 người) cho buổi All Hands tháng 3, ngày 25/03/2026, 10:00-12:00.",
      requester: { name: "Kiều Hà", initials: "KH", color: "#db2777", department: "People" },
      createdAt: "18/03/2026", status: "approved", priority: "low", comments: 1, attachments: 0,
    },
  ],
  "pr-training": [
    {
      id: "req-011", code: "DT-2026-0028", title: "Khoá AWS Solutions Architect",
      description: "Đăng ký khoá đào tạo AWS Solutions Architect - Associate trên Udemy. Chi phí: $89.99.",
      requester: { name: "Cao Khánh", initials: "CK", color: "#059669", department: "Data" },
      createdAt: "13/03/2026", status: "approved", priority: "medium", comments: 2, attachments: 1,
      approver: { name: "Trần Văn Hùng", initials: "TH", color: "#059669" }, approvedAt: "15/03/2026",
    },
  ],
  "pr-cert": [
    {
      id: "req-012", code: "XN-2026-0067", title: "Xác nhận đang làm việc",
      description: "Xin giấy xác nhận đang làm việc tại công ty để nộp hồ sơ vay ngân hàng.",
      requester: { name: "Mạc Uyên", initials: "MU", color: "#b45309", department: "Marketing" },
      createdAt: "16/03/2026", status: "approved", priority: "medium", comments: 0, attachments: 0,
      approver: { name: "Kiều Hà", initials: "KH", color: "#db2777" }, approvedAt: "17/03/2026",
    },
  ],
};

/* ═══════════ Form fields by category ═══════════ */
interface FormField {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "select" | "daterange" | "number" | "time";
  placeholder?: string;
  required?: boolean;
  options?: string[];
  suffix?: string;
}

const formFieldsByProcedure: Record<string, FormField[]> = {
  "pr-leave": [
    { key: "leaveType", label: "Loại nghỉ phép", type: "select", options: ["Nghỉ phép năm", "Nghỉ ốm", "Nghỉ việc riêng", "Nghỉ không lương", "Nghỉ cưới", "Nghỉ tang"], required: true },
    { key: "dateFrom", label: "Từ ngày", type: "date", required: true },
    { key: "dateTo", label: "Đến ngày", type: "date", required: true },
    { key: "reason", label: "Lý do", type: "textarea", placeholder: "Mô tả lý do nghỉ phép...", required: true },
    { key: "handover", label: "Người bàn giao công việc", type: "text", placeholder: "Tên người bàn giao" },
  ],
  "pr-remote": [
    { key: "wfhType", label: "Hình thức", type: "select", options: ["WFH theo ngày", "WFH theo tuần", "WFH dài hạn"], required: true },
    { key: "dateFrom", label: "Từ ngày", type: "date", required: true },
    { key: "dateTo", label: "Đến ngày", type: "date", required: true },
    { key: "reason", label: "Lý do", type: "textarea", placeholder: "Lý do làm việc từ xa...", required: true },
  ],
  "pr-salary-adv": [
    { key: "amount", label: "Số tiền tạm ứng", type: "number", placeholder: "0", required: true, suffix: "VNĐ" },
    { key: "percentage", label: "Tỷ lệ tạm ứng", type: "select", options: ["20% lương", "30% lương", "40% lương", "50% lương"], required: true },
    { key: "reason", label: "Lý do tạm ứng", type: "textarea", placeholder: "Mô tả lý do cần tạm ứng...", required: true },
  ],
  "pr-project-adv": [
    { key: "project", label: "Dự án", type: "text", placeholder: "Tên dự án", required: true },
    { key: "amount", label: "Số tiền tạm ứng", type: "number", placeholder: "0", required: true, suffix: "VNĐ" },
    { key: "purpose", label: "Mục đích sử dụng", type: "textarea", placeholder: "Chi tiết mục đích tạm ứng...", required: true },
    { key: "deadline", label: "Thời hạn hoàn ứng", type: "date", required: true },
  ],
  "pr-travel": [
    { key: "destination", label: "Địa điểm công tác", type: "text", placeholder: "TP. Hồ Chí Minh", required: true },
    { key: "dateFrom", label: "Từ ngày", type: "date", required: true },
    { key: "dateTo", label: "Đến ngày", type: "date", required: true },
    { key: "totalAmount", label: "Tổng chi phí", type: "number", placeholder: "0", required: true, suffix: "VNĐ" },
    { key: "details", label: "Chi tiết các khoản", type: "textarea", placeholder: "Liệt kê: vé máy bay, khách sạn, taxi, ăn uống...", required: true },
  ],
  "pr-expense": [
    { key: "expenseType", label: "Loại chi phí", type: "select", options: ["Phần mềm/License", "Văn phòng phẩm", "Tiếp khách", "Đào tạo", "Khác"], required: true },
    { key: "amount", label: "Số tiền", type: "number", placeholder: "0", required: true, suffix: "VNĐ" },
    { key: "description", label: "Mô tả chi tiết", type: "textarea", placeholder: "Mô tả khoản thanh toán...", required: true },
  ],
  "pr-buy-equip": [
    { key: "equipName", label: "Tên thiết bị", type: "text", placeholder: "VD: Bàn phím cơ Keychron K8", required: true },
    { key: "quantity", label: "Số lượng", type: "number", placeholder: "1", required: true },
    { key: "unitPrice", label: "Đơn giá (dự kiến)", type: "number", placeholder: "0", suffix: "VNĐ" },
    { key: "reason", label: "Lý do mua", type: "textarea", placeholder: "Giải thích lý do cần mua thiết bị...", required: true },
  ],
  "pr-fix-equip": [
    { key: "equipName", label: "Tên thiết bị", type: "text", placeholder: "VD: Màn hình Dell U2722D", required: true },
    { key: "assetCode", label: "Mã tài sản", type: "text", placeholder: "VD: IT-MON-0234" },
    { key: "location", label: "Vị trí", type: "text", placeholder: "VD: Tầng 5, bàn D-15" },
    { key: "issue", label: "Mô tả sự cố", type: "textarea", placeholder: "Mô tả chi tiết tình trạng hỏng...", required: true },
  ],
  "pr-return-equip": [
    { key: "equipName", label: "Tên thiết bị", type: "text", placeholder: "VD: Laptop MacBook Pro M2", required: true },
    { key: "assetCode", label: "Mã tài sản", type: "text", placeholder: "VD: IT-LAP-0123", required: true },
    { key: "condition", label: "Tình trạng", type: "select", options: ["Tốt", "Bình thường", "Có hư hỏng nhẹ", "Hỏng nặng"], required: true },
    { key: "note", label: "Ghi chú", type: "textarea", placeholder: "Ghi chú thêm (nếu có)..." },
  ],
  "pr-training": [
    { key: "courseName", label: "Tên khoá học", type: "text", placeholder: "VD: AWS Solutions Architect", required: true },
    { key: "provider", label: "Đơn vị đào tạo", type: "text", placeholder: "VD: Udemy, Coursera..." },
    { key: "cost", label: "Chi phí", type: "number", placeholder: "0", suffix: "VNĐ" },
    { key: "dateFrom", label: "Ngày bắt đầu", type: "date" },
    { key: "dateTo", label: "Ngày kết thúc", type: "date" },
    { key: "reason", label: "Lý do đăng ký", type: "textarea", placeholder: "Khoá học giúp ích gì cho công việc...", required: true },
  ],
  "pr-cert": [
    { key: "certType", label: "Loại giấy xác nhận", type: "select", options: ["Xác nhận đang làm việc", "Xác nhận lương", "Xác nhận kinh nghiệm", "Xác nhận nghỉ việc", "Khác"], required: true },
    { key: "purpose", label: "Mục đích sử dụng", type: "text", placeholder: "VD: Nộp hồ sơ vay ngân hàng", required: true },
    { key: "quantity", label: "Số bản", type: "number", placeholder: "1" },
    { key: "note", label: "Ghi chú", type: "textarea", placeholder: "Yêu cầu đặc biệt (nếu có)..." },
  ],
  "pr-stamp": [
    { key: "docName", label: "Tên văn bản", type: "text", placeholder: "VD: Hợp đồng dịch vụ ABC", required: true },
    { key: "docType", label: "Loại văn bản", type: "select", options: ["Hợp đồng", "Công văn", "Quyết định", "Biên bản", "Khác"], required: true },
    { key: "copies", label: "Số bản cần đóng dấu", type: "number", placeholder: "1" },
    { key: "note", label: "Ghi chú", type: "textarea", placeholder: "Ghi chú thêm..." },
  ],
  "pr-room": [
    { key: "room", label: "Phòng họp", type: "select", options: ["A1 (8 người)", "A2 (12 người)", "A3 (20 người)", "B1 (50 người)", "B2 (30 người)", "VIP (10 người)"], required: true },
    { key: "date", label: "Ngày họp", type: "date", required: true },
    { key: "timeFrom", label: "Giờ bắt đầu", type: "time", required: true },
    { key: "timeTo", label: "Giờ kết thúc", type: "time", required: true },
    { key: "purpose", label: "Mục đích", type: "text", placeholder: "VD: Sprint Review, All Hands...", required: true },
    { key: "attendees", label: "Số người tham dự", type: "number", placeholder: "0" },
  ],
  "pr-vehicle": [
    { key: "destination", label: "Điểm đến", type: "text", placeholder: "VD: KCN Hoà Lạc", required: true },
    { key: "date", label: "Ngày đi", type: "date", required: true },
    { key: "timeFrom", label: "Giờ xuất phát", type: "time", required: true },
    { key: "passengers", label: "Số người đi", type: "number", placeholder: "1" },
    { key: "reason", label: "Lý do", type: "textarea", placeholder: "Mục đích chuyến đi...", required: true },
  ],
  "pr-schedule": [
    { key: "currentSchedule", label: "Lịch hiện tại", type: "text", placeholder: "VD: 8:00-17:00, T2-T6" },
    { key: "newSchedule", label: "Lịch đề xuất", type: "text", placeholder: "VD: 9:00-18:00, T2-T6", required: true },
    { key: "dateFrom", label: "Áp dụng từ ngày", type: "date", required: true },
    { key: "reason", label: "Lý do", type: "textarea", placeholder: "Lý do muốn thay đổi lịch làm việc...", required: true },
  ],
  "pr-maternity": [
    { key: "dueDate", label: "Ngày dự sinh", type: "date", required: true },
    { key: "leaveFrom", label: "Ngày bắt đầu nghỉ", type: "date", required: true },
    { key: "duration", label: "Thời gian nghỉ", type: "select", options: ["4 tháng", "5 tháng", "6 tháng"], required: true },
    { key: "handover", label: "Người bàn giao", type: "text", placeholder: "Tên người bàn giao công việc", required: true },
  ],
  "pr-insurance": [
    { key: "insType", label: "Loại bảo hiểm", type: "select", options: ["Bảo hiểm sức khoẻ", "Bảo hiểm nhân thọ", "Bảo hiểm tai nạn", "Thêm người thân"], required: true },
    { key: "plan", label: "Gói bảo hiểm", type: "select", options: ["Cơ bản", "Nâng cao", "Premium"], required: true },
    { key: "beneficiary", label: "Người thụ hưởng (nếu có)", type: "text", placeholder: "Tên người thân" },
    { key: "note", label: "Ghi chú", type: "textarea", placeholder: "Yêu cầu đặc biệt..." },
  ],
  "pr-health": [
    { key: "checkType", label: "Loại khám", type: "select", options: ["Khám định kỳ", "Khám chuyên khoa", "Khám tổng quát"], required: true },
    { key: "preferDate", label: "Ngày mong muốn", type: "date", required: true },
    { key: "note", label: "Ghi chú", type: "textarea", placeholder: "Tiền sử bệnh lý hoặc yêu cầu đặc biệt..." },
  ],
};

/* ═══════════ Props ═══════════ */
interface ProcedureDetailViewProps {
  procedureId: string;
  onClose: () => void;
}

/* ═══════════ Main Component (Inline View) ═══════════ */
export function ProcedureDetailView({ procedureId, onClose }: ProcedureDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"list" | "create" | "info">("list");
  const [filterStatus, setFilterStatus] = useState<"all" | RequestStatus>("all");
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [formPriority, setFormPriority] = useState("medium");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const meta = procedureMetadata[procedureId];
  const requests = mockRequests[procedureId] || [];
  const fields = formFieldsByProcedure[procedureId] || [];

  const filteredRequests = filterStatus === "all"
    ? requests
    : requests.filter(r => r.status === filterStatus);

  if (!meta) return null;

  const handleSubmit = () => {
    const missing = fields.filter(f => f.required && !formData[f.key]?.trim());
    if (missing.length > 0) {
      toast.error("Vui lòng điền đầy đủ thông tin", {
        description: `Thiếu: ${missing.map(f => f.label).join(", ")}`,
      });
      return;
    }
    toast.success("Đã gửi yêu cầu thành công!", {
      description: `${meta.name} — đang chờ phê duyệt`,
    });
    setFormData({});
    setActiveTab("list");
  };

  const tabs = [
    { key: "list" as const, label: "Danh sách", count: requests.length },
    { key: "create" as const, label: "Tạo yêu cầu" },
    { key: "info" as const, label: "Thông tin" },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Back navigation */}
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 shrink-0 flex items-center gap-2">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] text-gray-500 hover:text-gray-700 hover:bg-white transition-all group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Quay lại chat</span>
        </button>
      </div>

      {/* ──── Header ──── */}
      <div className="px-6 py-4 border-b border-gray-100 shrink-0 bg-white">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[24px] bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100 shrink-0">
            {meta.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[16px] text-gray-900 truncate" style={{ fontWeight: 600 }}>{meta.name}</h2>
            <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{meta.description}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 shrink-0" title="Quay lại chat">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); setSelectedRequest(null); }}
              className={`px-3.5 py-1.5 rounded-lg text-[12px] transition-all flex items-center gap-1.5 ${
                activeTab === t.key
                  ? "bg-cyan-50 text-cyan-700 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
              style={activeTab === t.key ? { fontWeight: 600 } : {}}
            >
              {t.label}
              {t.count !== undefined && (
                <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] flex items-center justify-center ${
                  activeTab === t.key ? "bg-cyan-200/60 text-cyan-700" : "bg-gray-100 text-gray-400"
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ──── Content ──── */}
      <div className="flex-1 overflow-hidden">
          {activeTab === "list" && !selectedRequest && (
            <RequestListTab
              requests={filteredRequests}
              allRequests={requests}
              filterStatus={filterStatus}
              showStatusDropdown={showStatusDropdown}
              onToggleDropdown={() => setShowStatusDropdown(!showStatusDropdown)}
              onFilterChange={(s) => { setFilterStatus(s); setShowStatusDropdown(false); }}
              onSelect={setSelectedRequest}
              procedureName={meta.name}
              onCreateNew={() => setActiveTab("create")}
            />
          )}
          {activeTab === "list" && selectedRequest && (
            <RequestDetailView
              request={selectedRequest}
              onBack={() => setSelectedRequest(null)}
              procedureName={meta.name}
            />
          )}
          {activeTab === "create" && (
            <CreateRequestTab
              meta={meta}
              fields={fields}
              formData={formData}
              formPriority={formPriority}
              onFormChange={(key, val) => setFormData(prev => ({ ...prev, [key]: val }))}
              onPriorityChange={setFormPriority}
              onSubmit={handleSubmit}
              onCancel={() => setActiveTab("list")}
            />
          )}
          {activeTab === "info" && (
            <ProcedureInfoTab meta={meta} />
          )}
      </div>
    </div>
  );
}

/* ═══════════ Request List Tab ═══════════ */
function RequestListTab({ requests, allRequests, filterStatus, showStatusDropdown, onToggleDropdown, onFilterChange, onSelect, procedureName, onCreateNew }: {
  requests: RequestItem[];
  allRequests: RequestItem[];
  filterStatus: "all" | RequestStatus;
  showStatusDropdown: boolean;
  onToggleDropdown: () => void;
  onFilterChange: (s: "all" | RequestStatus) => void;
  onSelect: (r: RequestItem) => void;
  procedureName: string;
  onCreateNew: () => void;
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-50 shrink-0">
        <div className="relative">
          <button
            onClick={onToggleDropdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[11px] text-gray-600 hover:border-gray-300 transition-all"
          >
            <Filter className="w-3 h-3 text-gray-400" />
            <span>{filterStatus === "all" ? "Tất cả trạng thái" : statusConfig[filterStatus].label}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>
          {showStatusDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 py-1 w-[180px] z-30">
              <button onClick={() => onFilterChange("all")} className={`w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 ${filterStatus === "all" ? "text-cyan-700 bg-cyan-50" : "text-gray-600"}`}>
                Tất cả trạng thái
              </button>
              {(Object.keys(statusConfig) as RequestStatus[]).map(s => (
                <button key={s} onClick={() => onFilterChange(s)} className={`w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 flex items-center gap-2 ${filterStatus === s ? "text-cyan-700 bg-cyan-50" : "text-gray-600"}`}>
                  <span className={statusConfig[s].color}>{statusConfig[s].icon}</span>
                  <span>{statusConfig[s].label}</span>
                  <span className="ml-auto text-[10px] text-gray-400">{allRequests.filter(r => r.status === s).length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="text-[11px] text-gray-400">{requests.length} yêu cầu</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {requests.length > 0 ? (
          <div className="space-y-2">
            {requests.map(r => (
              <button
                key={r.id}
                onClick={() => onSelect(r)}
                className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-cyan-200 hover:bg-cyan-50/30 transition-all group"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] text-white shrink-0" style={{ backgroundColor: r.requester.color, fontWeight: 600 }}>
                    {r.requester.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] text-gray-400 font-mono">{r.code}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${statusConfig[r.status].bg} ${statusConfig[r.status].color}`}>
                        {statusConfig[r.status].icon}
                        {statusConfig[r.status].label}
                      </span>
                      <div className="flex items-center gap-1 ml-auto">
                        <div className={`w-1.5 h-1.5 rounded-full ${priorityConfig[r.priority].dot}`} />
                        <span className={`text-[10px] ${priorityConfig[r.priority].color}`}>{priorityConfig[r.priority].label}</span>
                      </div>
                    </div>
                    <p className="text-[13px] text-gray-800 truncate" style={{ fontWeight: 500 }}>{r.title}</p>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{r.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {r.requester.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {r.createdAt}
                      </span>
                      {r.comments > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {r.comments}
                        </span>
                      )}
                      {r.attachments > 0 && (
                        <span className="flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          {r.attachments}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-2" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-7 h-7 text-gray-200" />
            </div>
            <p className="text-[13px] text-gray-500" style={{ fontWeight: 500 }}>Chưa có yêu cầu nào</p>
            <p className="text-[11px] text-gray-400 mt-1">
              {filterStatus !== "all" ? "Không có yêu cầu với trạng thái này" : `Tạo yêu cầu ${procedureName} đầu tiên`}
            </p>
            {filterStatus === "all" && (
              <button
                onClick={onCreateNew}
                className="mt-4 px-4 py-2 rounded-lg bg-cyan-500 text-white text-[12px] hover:bg-cyan-600 transition-all shadow-sm inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Tạo yêu cầu mới
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════ Request Detail View ═══════════ */
function RequestDetailView({ request, onBack, procedureName }: {
  request: RequestItem;
  onBack: () => void;
  procedureName: string;
}) {
  const sc = statusConfig[request.status];
  const pc = priorityConfig[request.priority];

  // Mock timeline
  const timeline = [
    { time: request.createdAt, action: "Tạo yêu cầu", user: request.requester.name, icon: <Plus className="w-3 h-3" />, color: "bg-blue-500" },
    ...(request.status === "processing" ? [{ time: request.createdAt, action: "Đang được xử lý", user: request.approver?.name || "Hệ thống", icon: <RotateCcw className="w-3 h-3" />, color: "bg-amber-500" }] : []),
    ...(request.status === "approved" ? [
      { time: request.createdAt, action: "Đang xử lý", user: request.approver?.name || "", icon: <RotateCcw className="w-3 h-3" />, color: "bg-amber-500" },
      { time: request.approvedAt || "", action: "Đã phê duyệt", user: request.approver?.name || "", icon: <CheckCircle2 className="w-3 h-3" />, color: "bg-emerald-500" },
    ] : []),
    ...(request.status === "rejected" ? [{ time: request.createdAt, action: "Đã từ chối", user: request.approver?.name || "", icon: <XCircle className="w-3 h-3" />, color: "bg-red-500" }] : []),
  ];

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Back button */}
      <div className="px-6 py-3 border-b border-gray-50 flex items-center gap-2 shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-700 transition-all">
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          Quay lại
        </button>
        <span className="text-gray-300">|</span>
        <span className="text-[11px] text-gray-400 font-mono">{request.code}</span>
        <div className="ml-auto flex items-center gap-2">
          {request.status === "pending" && (
            <button
              onClick={() => toast.info("Đã huỷ yêu cầu", { description: request.title })}
              className="px-3 py-1.5 rounded-lg border border-red-200 text-[11px] text-red-500 hover:bg-red-50 transition-all"
            >
              Huỷ yêu cầu
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5 grid grid-cols-[1fr_240px] gap-6">
          {/* Left: Main content */}
          <div className="space-y-5">
            {/* Title + Status */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border ${sc.bg} ${sc.color}`} style={{ fontWeight: 500 }}>
                  {sc.icon}
                  {sc.label}
                </span>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${pc.dot}`} />
                  <span className={`text-[11px] ${pc.color}`}>{pc.label}</span>
                </div>
              </div>
              <h3 className="text-[18px] text-gray-900" style={{ fontWeight: 600 }}>{request.title}</h3>
            </div>

            {/* Description */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-2" style={{ fontWeight: 600 }}>Nội dung yêu cầu</p>
              <p className="text-[13px] text-gray-700 whitespace-pre-wrap">{request.description}</p>
            </div>

            {/* Attachments mock */}
            {request.attachments > 0 && (
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-2" style={{ fontWeight: 600 }}>Tệp đính kèm ({request.attachments})</p>
                <div className="space-y-1.5">
                  {Array.from({ length: request.attachments }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all cursor-pointer group">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-gray-700 truncate">{i === 0 ? "giay_kham_benh.pdf" : `tai_lieu_${i + 1}.pdf`}</p>
                        <p className="text-[10px] text-gray-400">{(120 + i * 45)} KB</p>
                      </div>
                      <Download className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments mock */}
            {request.comments > 0 && (
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-2" style={{ fontWeight: 600 }}>Bình luận ({request.comments})</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] text-white shrink-0" style={{ backgroundColor: request.approver?.color || "#6b7280", fontWeight: 600 }}>
                      {request.approver?.initials || "??"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-gray-800" style={{ fontWeight: 500 }}>{request.approver?.name || "Hệ thống"}</span>
                        <span className="text-[10px] text-gray-400">{request.createdAt}</span>
                      </div>
                      <p className="text-[12px] text-gray-600 mt-1">
                        {request.status === "approved" ? "Đã xem xét và phê duyệt yêu cầu này. ✅" :
                         request.status === "rejected" ? "Yêu cầu chưa đủ điều kiện. Vui lòng bổ sung thêm thông tin." :
                         "Đã tiếp nhận yêu cầu, đang xem xét."}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Add comment */}
                <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg border border-gray-200 focus-within:border-cyan-300 bg-white">
                  <input
                    type="text"
                    placeholder="Viết bình luận..."
                    className="flex-1 text-[12px] bg-transparent outline-none text-gray-700 placeholder-gray-400"
                  />
                  <button className="w-7 h-7 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white flex items-center justify-center transition-all">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Sidebar info */}
          <div className="space-y-4">
            {/* Requester */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-2" style={{ fontWeight: 600 }}>Người yêu cầu</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] text-white" style={{ backgroundColor: request.requester.color, fontWeight: 600 }}>
                  {request.requester.initials}
                </div>
                <div>
                  <p className="text-[12px] text-gray-800" style={{ fontWeight: 500 }}>{request.requester.name}</p>
                  <p className="text-[10px] text-gray-400">{request.requester.department}</p>
                </div>
              </div>
            </div>

            {/* Approver */}
            {request.approver && (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-2" style={{ fontWeight: 600 }}>Người phê duyệt</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] text-white" style={{ backgroundColor: request.approver.color, fontWeight: 600 }}>
                    {request.approver.initials}
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-800" style={{ fontWeight: 500 }}>{request.approver.name}</p>
                    {request.approvedAt && <p className="text-[10px] text-emerald-500">Duyệt: {request.approvedAt}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
              <p className="text-[9px] text-gray-400 uppercase tracking-wider" style={{ fontWeight: 600 }}>Thông tin</p>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Ngày tạo</span>
                <span className="text-gray-700">{request.createdAt}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Loại thủ tục</span>
                <span className="text-gray-700">{procedureName}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Mã yêu cầu</span>
                <span className="text-gray-700 font-mono">{request.code}</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-3" style={{ fontWeight: 600 }}>Lịch sử xử lý</p>
              <div className="space-y-3">
                {timeline.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2.5 relative">
                    {i < timeline.length - 1 && (
                      <div className="absolute left-[9px] top-[20px] w-[2px] h-[calc(100%+4px)] bg-gray-200" />
                    )}
                    <div className={`w-[20px] h-[20px] rounded-full ${ev.color} flex items-center justify-center text-white shrink-0 z-10`}>
                      {ev.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-gray-700" style={{ fontWeight: 500 }}>{ev.action}</p>
                      <p className="text-[10px] text-gray-400">{ev.user} · {ev.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Create Request Tab ═══════════ */
function CreateRequestTab({ meta, fields, formData, formPriority, onFormChange, onPriorityChange, onSubmit, onCancel }: {
  meta: ProcedureInfo;
  fields: FormField[];
  formData: Record<string, string>;
  formPriority: string;
  onFormChange: (key: string, val: string) => void;
  onPriorityChange: (p: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* Info banner */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-cyan-50/50 border border-cyan-100 mb-5">
          <Info className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] text-cyan-800" style={{ fontWeight: 500 }}>Tạo yêu cầu {meta.name}</p>
            <p className="text-[11px] text-cyan-600 mt-0.5">Thời gian xử lý trung bình: {meta.avgProcessTime}</p>
          </div>
        </div>

        {/* Priority */}
        <div className="mb-5">
          <label className="text-[11px] text-gray-500 mb-2 block" style={{ fontWeight: 500 }}>Mức độ ưu tiên</label>
          <div className="flex items-center gap-2">
            {Object.entries(priorityConfig).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => onPriorityChange(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] transition-all ${
                  formPriority === key
                    ? "border-cyan-300 bg-cyan-50 text-cyan-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          {fields.map(field => (
            <div key={field.key}>
              <label className="text-[11px] text-gray-500 mb-1.5 block" style={{ fontWeight: 500 }}>
                {field.label} {field.required && <span className="text-red-400">*</span>}
              </label>
              {field.type === "text" && (
                <input
                  type="text"
                  value={formData[field.key] || ""}
                  onChange={e => onFormChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-cyan-300 text-[13px] text-gray-800 placeholder-gray-400 outline-none transition-all bg-white"
                />
              )}
              {field.type === "number" && (
                <div className="relative">
                  <input
                    type="text"
                    value={formData[field.key] || ""}
                    onChange={e => {
                      const v = e.target.value.replace(/[^\d]/g, "");
                      onFormChange(field.key, v);
                    }}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-cyan-300 text-[13px] text-gray-800 placeholder-gray-400 outline-none transition-all bg-white"
                  />
                  {field.suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">{field.suffix}</span>
                  )}
                </div>
              )}
              {field.type === "textarea" && (
                <textarea
                  value={formData[field.key] || ""}
                  onChange={e => onFormChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-cyan-300 text-[13px] text-gray-800 placeholder-gray-400 outline-none transition-all resize-none bg-white"
                />
              )}
              {field.type === "date" && (
                <input
                  type="date"
                  value={formData[field.key] || ""}
                  onChange={e => onFormChange(field.key, e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-cyan-300 text-[13px] text-gray-800 outline-none transition-all bg-white"
                />
              )}
              {field.type === "time" && (
                <input
                  type="time"
                  value={formData[field.key] || ""}
                  onChange={e => onFormChange(field.key, e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-cyan-300 text-[13px] text-gray-800 outline-none transition-all bg-white"
                />
              )}
              {field.type === "select" && (
                <select
                  value={formData[field.key] || ""}
                  onChange={e => onFormChange(field.key, e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-cyan-300 text-[13px] text-gray-800 outline-none transition-all bg-white appearance-none cursor-pointer"
                >
                  <option value="">— Chọn —</option>
                  {field.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>

        {/* Attachment */}
        <div className="mt-5">
          <label className="text-[11px] text-gray-500 mb-1.5 block" style={{ fontWeight: 500 }}>Tệp đính kèm</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-cyan-300 hover:bg-cyan-50/30 transition-all cursor-pointer">
            <Paperclip className="w-5 h-5 text-gray-300 mx-auto mb-2" />
            <p className="text-[12px] text-gray-500">Kéo thả tệp hoặc <span className="text-cyan-600" style={{ fontWeight: 500 }}>click để chọn</span></p>
            <p className="text-[10px] text-gray-400 mt-1">PDF, DOC, XLS, JPG, PNG — Tối đa 10MB</p>
          </div>
        </div>

        {/* Required docs hint */}
        {meta.requiredDocs.length > 0 && meta.requiredDocs[0] !== "Không yêu cầu" && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50/60 border border-amber-100">
            <p className="text-[10px] text-amber-600 mb-1" style={{ fontWeight: 600 }}>📋 Hồ sơ cần thiết:</p>
            <ul className="space-y-0.5">
              {meta.requiredDocs.map((doc, i) => (
                <li key={i} className="text-[11px] text-amber-700 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                  {doc}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-[12px] text-gray-600 hover:bg-gray-100 transition-all"
        >
          Huỷ
        </button>
        <button
          onClick={onSubmit}
          className="px-5 py-2.5 rounded-lg bg-cyan-500 text-white text-[12px] hover:bg-cyan-600 transition-all shadow-sm shadow-cyan-500/20 flex items-center gap-1.5"
          style={{ fontWeight: 500 }}
        >
          <Send className="w-3.5 h-3.5" />
          Gửi yêu cầu
        </button>
      </div>
    </div>
  );
}

/* ═══════════ Procedure Info Tab ═══════════ */
function ProcedureInfoTab({ meta }: { meta: ProcedureInfo }) {
  return (
    <div className="overflow-y-auto px-6 py-5 space-y-5">
      {/* Description */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50/60 to-blue-50/40 border border-cyan-100">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-cyan-500" />
          <p className="text-[12px] text-cyan-800" style={{ fontWeight: 600 }}>Mô tả</p>
        </div>
        <p className="text-[13px] text-gray-700">{meta.description}</p>
      </div>

      {/* Processing time */}
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <p className="text-[12px] text-gray-700" style={{ fontWeight: 600 }}>Thời gian xử lý trung bình</p>
        </div>
        <p className="text-[14px] text-gray-900 ml-6" style={{ fontWeight: 500 }}>{meta.avgProcessTime}</p>
      </div>

      {/* Approval flow */}
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <p className="text-[12px] text-gray-700" style={{ fontWeight: 600 }}>Quy trình phê duyệt</p>
        </div>
        <div className="flex items-center gap-2 ml-6 flex-wrap">
          {meta.approvalSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-[12px] text-gray-700 flex items-center gap-1.5 shadow-sm">
                <div className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center text-[10px] text-cyan-700" style={{ fontWeight: 600 }}>
                  {i + 1}
                </div>
                {step}
              </div>
              {i < meta.approvalSteps.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Required documents */}
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-gray-400" />
          <p className="text-[12px] text-gray-700" style={{ fontWeight: 600 }}>Hồ sơ cần thiết</p>
        </div>
        <ul className="ml-6 space-y-1.5">
          {meta.requiredDocs.map((doc, i) => (
            <li key={i} className="flex items-center gap-2 text-[12px] text-gray-600">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              {doc}
            </li>
          ))}
        </ul>
      </div>

      {/* Tips */}
      <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
        <p className="text-[11px] text-amber-700" style={{ fontWeight: 600 }}>💡 Lưu ý:</p>
        <ul className="mt-2 space-y-1 text-[11px] text-amber-700">
          <li>• Yêu cầu sẽ được gửi đến người phê duyệt ngay sau khi bạn bấm "Gửi yêu cầu".</li>
          <li>• Bạn có thể theo dõi trạng thái yêu cầu trong tab "Danh sách".</li>
          <li>• Nếu yêu cầu bị từ chối, bạn có thể tạo yêu cầu mới với thông tin bổ sung.</li>
          <li>• Liên hệ phòng hành chính nếu cần hỗ trợ thêm.</li>
        </ul>
      </div>
    </div>
  );
}
