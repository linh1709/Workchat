import {
  X, ClipboardList, FileText, ShieldCheck, BarChart3
} from "lucide-react";
import { getSidebarCounts } from "./ProcedureDetailModal";

interface AdminProceduresSidebarProps {
  activeFilter: string;
  onFilterChange: (id: string) => void;
  onClose: () => void;
}

export function AdminProceduresSidebar({ activeFilter, onFilterChange, onClose }: AdminProceduresSidebarProps) {
  const counts = getSidebarCounts();

  const quickFilters = [
    { id: "all",     label: "Tất cả yêu cầu",  icon: <ClipboardList className="w-4 h-4" />, count: counts.all     },
    { id: "mine",    label: "Yêu cầu của tôi",  icon: <FileText className="w-4 h-4" />,      count: counts.mine    },
    { id: "approve", label: "Cần tôi duyệt",    icon: <ShieldCheck className="w-4 h-4" />,   count: counts.approve },
    { id: "stats",   label: "Thống kê",          icon: <BarChart3 className="w-4 h-4" />                           },
  ];

  return (
    <div className="w-[272px] h-full bg-white flex flex-col border-r border-gray-200 overflow-hidden shrink-0">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2.5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50/50">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shrink-0 shadow-sm">
          <FileText className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-gray-900 truncate" style={{ fontWeight: 600 }}>Thủ tục hành chính</p>
          <p className="text-[10px] text-gray-400">{counts.all} yêu cầu đang xử lý</p>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick filters */}
      <div className="px-3 pt-3 space-y-0.5">
        {quickFilters.map(f => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
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
    </div>
  );
}
