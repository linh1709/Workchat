import { useState } from "react";
import {
  X, Search, ChevronDown, FileText, BarChart3, ListFilter,
  Clock, CalendarDays, Laptop, GraduationCap, Stamp,
  Users, CreditCard, Wallet, Wrench, ShieldCheck,
  Car, Plane, Baby, Heart, Stethoscope, FileCheck,
  ClipboardList, Building2, Receipt, Package
} from "lucide-react";

/* ═══════════ Data Types ═══════════ */
interface ProcedureItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  emoji?: string;
  count?: number;
  category: string;
}

interface ProcedureCategory {
  key: string;
  label: string;
  items: ProcedureItem[];
}

/* ═══════════ Quick Filters ═══════════ */
const quickFilters = [
  { id: "all", label: "Tất cả yêu cầu", icon: <ClipboardList className="w-4 h-4" />, count: 12 },
  { id: "mine", label: "Yêu cầu của tôi", icon: <FileText className="w-4 h-4" />, count: 5 },
  { id: "approve", label: "Cần tôi duyệt", icon: <ShieldCheck className="w-4 h-4" />, count: 3 },
  { id: "stats", label: "Thống kê", icon: <BarChart3 className="w-4 h-4" /> },
];

/* ═══════════ Procedure Categories & Items ═══════════ */
const procedureCategories: ProcedureCategory[] = [
  {
    key: "leave",
    label: "NGHỈ PHÉP",
    items: [
      { id: "pr-leave", name: "Xin nghỉ phép", icon: <CalendarDays className="w-[18px] h-[18px]" />, emoji: "📅", count: 2, category: "leave" },
      { id: "pr-remote", name: "Đăng ký làm việc từ xa", icon: <Laptop className="w-[18px] h-[18px]" />, emoji: "🏠", count: 1, category: "leave" },
    ],
  },
  {
    key: "advance",
    label: "TẠM ỨNG",
    items: [
      { id: "pr-salary-adv", name: "Tạm ứng lương", icon: <Wallet className="w-[18px] h-[18px]" />, emoji: "💰", count: 1, category: "advance" },
      { id: "pr-project-adv", name: "Tạm ứng dự án", icon: <CreditCard className="w-[18px] h-[18px]" />, emoji: "💳", category: "advance" },
    ],
  },
  {
    key: "payment",
    label: "THANH TOÁN",
    items: [
      { id: "pr-travel", name: "Thanh toán công tác phí", icon: <Plane className="w-[18px] h-[18px]" />, emoji: "✈️", count: 1, category: "payment" },
      { id: "pr-expense", name: "Đề nghị thanh toán", icon: <Receipt className="w-[18px] h-[18px]" />, emoji: "🧾", count: 1, category: "payment" },
    ],
  },
  {
    key: "equipment",
    label: "THIẾT BỊ",
    items: [
      { id: "pr-buy-equip", name: "Đề xuất mua thiết bị", icon: <Package className="w-[18px] h-[18px]" />, emoji: "📦", count: 1, category: "equipment" },
      { id: "pr-fix-equip", name: "Báo hỏng/Sửa chữa thiết bị", icon: <Wrench className="w-[18px] h-[18px]" />, emoji: "🔧", count: 1, category: "equipment" },
      { id: "pr-return-equip", name: "Trả thiết bị", icon: <Package className="w-[18px] h-[18px]" />, emoji: "📤", category: "equipment" },
    ],
  },
  {
    key: "training",
    label: "ĐÀO TẠO",
    items: [
      { id: "pr-training", name: "Đăng ký đào tạo", icon: <GraduationCap className="w-[18px] h-[18px]" />, emoji: "🎓", count: 1, category: "training" },
    ],
  },
  {
    key: "admin",
    label: "HÀNH CHÍNH",
    items: [
      { id: "pr-cert", name: "Xin cấp giấy xác nhận", icon: <Stamp className="w-[18px] h-[18px]" />, emoji: "📜", count: 1, category: "admin" },
      { id: "pr-stamp", name: "Yêu cầu đóng dấu", icon: <FileCheck className="w-[18px] h-[18px]" />, emoji: "🔏", category: "admin" },
      { id: "pr-room", name: "Đặt phòng họp", icon: <Building2 className="w-[18px] h-[18px]" />, emoji: "🏢", count: 2, category: "admin" },
      { id: "pr-vehicle", name: "Đặt xe công tác", icon: <Car className="w-[18px] h-[18px]" />, emoji: "🚗", category: "admin" },
    ],
  },
  {
    key: "hr",
    label: "NHÂN SỰ",
    items: [
      { id: "pr-schedule", name: "Đề xuất thay đổi lịch làm việc", icon: <Clock className="w-[18px] h-[18px]" />, emoji: "⏰", category: "hr" },
      { id: "pr-maternity", name: "Đăng ký nghỉ thai sản", icon: <Baby className="w-[18px] h-[18px]" />, emoji: "👶", category: "hr" },
      { id: "pr-insurance", name: "Đăng ký bảo hiểm", icon: <Heart className="w-[18px] h-[18px]" />, emoji: "❤️", category: "hr" },
      { id: "pr-health", name: "Đăng ký khám sức khỏe", icon: <Stethoscope className="w-[18px] h-[18px]" />, emoji: "🩺", category: "hr" },
    ],
  },
];

/* ═══════════ Props ═══════════ */
interface AdminProceduresSidebarProps {
  selectedProcedure: string | null;
  onProcedureSelect: (id: string) => void;
  onClose: () => void;
}

/* ═══════════ Component ═══════════ */
export function AdminProceduresSidebar({ selectedProcedure, onProcedureSelect, onClose }: AdminProceduresSidebarProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const allCategories = [{ key: "all", label: "Tất cả danh mục" }, ...procedureCategories.map(c => ({ key: c.key, label: c.label }))];
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const filteredCategories = procedureCategories
    .map(cat => ({
      ...cat,
      items: cat.items.filter(item =>
        (!search || item.name.toLowerCase().includes(search.toLowerCase())) &&
        (selectedCategory === "all" || cat.key === selectedCategory)
      ),
    }))
    .filter(cat => cat.items.length > 0);

  const totalRequests = procedureCategories.flatMap(c => c.items).reduce((sum, i) => sum + (i.count || 0), 0);

  return (
    <div className="w-[272px] h-full bg-white flex flex-col border-r border-gray-200 overflow-hidden shrink-0">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2.5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50/50">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shrink-0 shadow-sm">
          <FileText className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-gray-900 truncate" style={{ fontWeight: 600 }}>Thủ tục hành chính</p>
          <p className="text-[10px] text-gray-400">{totalRequests} yêu cầu đang xử lý</p>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick filters */}
      <div className="px-3 pt-3 pb-1 space-y-0.5">
        {quickFilters.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[12px] transition-all group ${
              activeFilter === f.id
                ? "bg-cyan-50 text-cyan-800"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className={activeFilter === f.id ? "text-cyan-600" : "text-gray-400 group-hover:text-gray-500"}>
              {f.icon}
            </span>
            <span className="flex-1 text-left truncate">{f.label}</span>
            {f.count !== undefined && (
              <span className={`min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] flex items-center justify-center shrink-0 ${
                activeFilter === f.id
                  ? "bg-cyan-200/60 text-cyan-700"
                  : "bg-gray-100 text-gray-500"
              }`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="h-px bg-gray-100 mx-3 my-2" />

      {/* Category dropdown */}
      <div className="px-3 mb-2 relative">
        <button
          onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-all text-[12px] text-gray-700"
        >
          <ListFilter className="w-3.5 h-3.5 text-gray-400" />
          <span className="flex-1 text-left truncate">
            {selectedCategory === "all" ? "Tất cả danh mục" : allCategories.find(c => c.key === selectedCategory)?.label}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`} />
        </button>
        {showCategoryDropdown && (
          <div className="absolute top-full left-3 right-3 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-30 max-h-[200px] overflow-y-auto">
            {allCategories.map(cat => (
              <button
                key={cat.key}
                onClick={() => { setSelectedCategory(cat.key); setShowCategoryDropdown(false); }}
                className={`w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 transition-all ${
                  selectedCategory === cat.key ? "text-cyan-700 bg-cyan-50" : "text-gray-600"
                }`}
              >
                {cat.key === "all" ? cat.label : cat.label.charAt(0) + cat.label.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search (only when a category filter is active or searching) */}
      {(selectedCategory !== "all" || search) && (
        <div className="px-3 mb-2">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 focus-within:border-cyan-300 transition-all">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm thủ tục..."
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
        </div>
      )}

      {/* Procedure list by category */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {filteredCategories.map(cat => (
          <div key={cat.key} className="mb-1">
            {/* Category label */}
            <div className="px-2 pt-2.5 pb-1.5">
              <p className="text-[9px] text-gray-400 tracking-[0.08em] uppercase" style={{ fontWeight: 600 }}>
                {cat.label}
              </p>
            </div>
            {/* Items */}
            <div className="space-y-0.5">
              {cat.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => onProcedureSelect(item.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-[8px] rounded-lg text-[12px] transition-all group ${
                    selectedProcedure === item.id
                      ? "bg-cyan-50 text-cyan-800"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {/* Icon with emoji-style container */}
                  <div className={`w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0 transition-all ${
                    selectedProcedure === item.id
                      ? "bg-cyan-100 text-cyan-700"
                      : "bg-gray-100 text-gray-500 group-hover:bg-gray-200/70"
                  }`}>
                    {item.emoji ? (
                      <span className="text-[16px]">{item.emoji}</span>
                    ) : (
                      item.icon
                    )}
                  </div>
                  {/* Name */}
                  <span className={`flex-1 text-left truncate text-[12px] ${
                    selectedProcedure === item.id ? "text-cyan-800" : "text-gray-700"
                  }`} style={item.count ? { fontWeight: 500 } : {}}>
                    {item.name}
                  </span>
                  {/* Badge */}
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] flex items-center justify-center shrink-0 ${
                      selectedProcedure === item.id
                        ? "bg-cyan-200/60 text-cyan-700"
                        : item.count >= 2
                          ? "bg-orange-100 text-orange-600"
                          : "bg-gray-100 text-gray-500"
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-8">
            <Search className="w-6 h-6 text-gray-200 mx-auto mb-2" />
            <p className="text-[11px] text-gray-400">Không tìm thấy thủ tục</p>
            <p className="text-[9px] text-gray-300 mt-0.5">Thử từ khoá khác hoặc bỏ lọc</p>
          </div>
        )}
      </div>
    </div>
  );
}
