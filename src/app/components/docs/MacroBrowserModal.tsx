import { Search, X, Plus, Sparkles, LayoutGrid, Type, Columns2, FileText, BookOpen } from "lucide-react";
import { macroBrowserItems as macroBrowserItemsData } from "./docs-data";

interface MacroBrowserModalProps {
  macroBrowserSearch: string;
  setMacroBrowserSearch: (v: string) => void;
  macroBrowserCategory: string;
  setMacroBrowserCategory: (v: string) => void;
  macroBrowserPreview: string | null;
  setMacroBrowserPreview: (v: string | null) => void;
  filteredMacros: typeof macroBrowserItemsData;
  onClose: () => void;
  onInsertMacro: (macro: typeof macroBrowserItemsData[0]) => void;
}

const macroBrowserCategories = [
  { key: "all", label: "Tất cả", icon: <LayoutGrid className="w-4 h-4" /> },
  { key: "formatting", label: "Định dạng", icon: <Type className="w-4 h-4" /> },
  { key: "layout", label: "Bố cục", icon: <Columns2 className="w-4 h-4" /> },
  { key: "content", label: "Nội dung", icon: <FileText className="w-4 h-4" /> },
  { key: "navigation", label: "Điều hướng", icon: <BookOpen className="w-4 h-4" /> },
];

export function MacroBrowserModal({
  macroBrowserSearch, setMacroBrowserSearch,
  macroBrowserCategory, setMacroBrowserCategory,
  macroBrowserPreview, setMacroBrowserPreview,
  filteredMacros, onClose, onInsertMacro,
}: MacroBrowserModalProps) {
  const macroBrowserItems = macroBrowserItemsData;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #DFE1E6" }}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: "#0052CC" }} />
            <div>
              <h3 className="text-[14px]" style={{ color: "#172B4D", fontWeight: 500 }}>Macro Browser</h3>
              <p className="text-[10px] mt-0.5" style={{ color: "#6B778C" }}>Chèn macro, panel, layout và nội dung đặc biệt</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: "#6B778C" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}><X className="w-4 h-4" /></button>
        </div>
        {/* Search */}
        <div className="px-5 py-3" style={{ borderBottom: "1px solid #DFE1E6", backgroundColor: "#FAFBFC" }}>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#6B778C" }} />
            <input value={macroBrowserSearch} onChange={e => setMacroBrowserSearch(e.target.value)}
              placeholder="Tìm macro..." autoFocus
              className="w-full pl-8 pr-3 py-2 text-[12px] rounded-md focus:outline-none"
              style={{ border: "1px solid #DFE1E6", color: "#172B4D" }} />
          </div>
        </div>
        {/* Body */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Categories sidebar */}
          <div className="w-[180px] shrink-0 py-2 overflow-auto" style={{ borderRight: "1px solid #DFE1E6", backgroundColor: "#FAFBFC" }}>
            {macroBrowserCategories.map(cat => (
              <button key={cat.key} onClick={() => setMacroBrowserCategory(cat.key)}
                className="w-full flex items-center gap-2 px-4 py-2 text-[11px] text-left transition-all"
                style={{
                  color: macroBrowserCategory === cat.key ? "#0052CC" : "#172B4D",
                  backgroundColor: macroBrowserCategory === cat.key ? "#DEEBFF" : "transparent",
                  fontWeight: macroBrowserCategory === cat.key ? 500 : 400
                }}
                onMouseEnter={e => { if (macroBrowserCategory !== cat.key) e.currentTarget.style.backgroundColor = "#F4F5F7"; }}
                onMouseLeave={e => { if (macroBrowserCategory !== cat.key) e.currentTarget.style.backgroundColor = "transparent"; }}>
                <span style={{ color: macroBrowserCategory === cat.key ? "#0052CC" : "#6B778C" }}>{cat.icon}</span>
                {cat.label}
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: macroBrowserCategory === cat.key ? "#B3D4FF" : "#DFE1E6", color: macroBrowserCategory === cat.key ? "#0052CC" : "#6B778C" }}>
                  {cat.key === "all" ? macroBrowserItems.length : macroBrowserItems.filter(m => m.category === cat.key).length}
                </span>
              </button>
            ))}
          </div>
          {/* Macro list */}
          <div className="flex-1 overflow-auto min-w-0">
            <div className="grid grid-cols-2 gap-1 p-2">
              {filteredMacros.map(macro => (
                <button key={macro.id}
                  onClick={() => onInsertMacro(macro)}
                  onMouseEnter={() => setMacroBrowserPreview(macro.id)}
                  className="flex items-start gap-3 p-3 rounded-lg text-left transition-all group"
                  style={{
                    backgroundColor: macroBrowserPreview === macro.id ? "#F4F5F7" : "transparent",
                    border: macroBrowserPreview === macro.id ? "1px solid #DFE1E6" : "1px solid transparent"
                  }}>
                  <span className="text-xl shrink-0 mt-0.5">{macro.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] truncate" style={{ color: "#172B4D", fontWeight: 500 }}>{macro.label}</p>
                    <p className="text-[10px] mt-0.5 line-clamp-2" style={{ color: "#6B778C" }}>{macro.desc}</p>
                  </div>
                  <Plus className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-all mt-1" style={{ color: "#0052CC" }} />
                </button>
              ))}
              {filteredMacros.length === 0 && (
                <div className="col-span-2 py-12 text-center">
                  <Search className="w-8 h-8 mx-auto mb-2" style={{ color: "#DFE1E6" }} />
                  <p className="text-[12px]" style={{ color: "#6B778C" }}>Không tìm thấy macro phù hợp</p>
                </div>
              )}
            </div>
          </div>
          {/* Preview pane */}
          {macroBrowserPreview && (
            <div className="w-[240px] shrink-0 p-4 overflow-auto" style={{ borderLeft: "1px solid #DFE1E6", backgroundColor: "#FAFBFC" }}>
              <p className="text-[9px] uppercase tracking-wider mb-3" style={{ color: "#6B778C", fontWeight: 600 }}>Xem trước</p>
              {(() => {
                const macro = macroBrowserItems.find(m => m.id === macroBrowserPreview);
                if (!macro) return null;
                return (
                  <div>
                    <div className="text-[11px] mb-3" style={{ color: "#172B4D" }}>
                      <span className="text-lg mr-1.5">{macro.icon}</span>
                      <strong>{macro.label}</strong>
                    </div>
                    <div className="rounded-lg p-3 mb-3" style={{ border: "1px solid #DFE1E6", backgroundColor: "white" }}
                      dangerouslySetInnerHTML={{ __html: macro.preview }} />
                    <p className="text-[10px]" style={{ color: "#6B778C" }}>{macro.desc}</p>
                    <button onClick={() => onInsertMacro(macro)}
                      className="w-full mt-3 py-2 rounded-md text-[11px] text-white transition-all"
                      style={{ backgroundColor: "#0052CC" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#0747A6")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#0052CC")}>
                      Chèn macro
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="px-5 py-2.5 flex items-center justify-between" style={{ borderTop: "1px solid #DFE1E6", backgroundColor: "#FAFBFC" }}>
          <span className="text-[10px]" style={{ color: "#6B778C" }}>
            {filteredMacros.length} macro có sẵn · Nhấn vào macro để chèn
          </span>
          <button onClick={onClose}
            className="px-3 py-1.5 rounded-md text-[11px] transition-all"
            style={{ color: "#6B778C", border: "1px solid #DFE1E6" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
