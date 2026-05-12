import { X, Search, Sparkles, LayoutGrid, FileText, Code, Users, BookOpen, Layers } from "lucide-react";
import { templates } from "./docs-data";
import { markdownToEditorHtml } from "./docs-utils";

interface TemplateGalleryModalProps {
  templateSearch: string;
  setTemplateSearch: (v: string) => void;
  templateCategory: string;
  setTemplateCategory: (v: string) => void;
  templateGalleryPreview: string | null;
  setTemplateGalleryPreview: (v: string | null) => void;
  onClose: () => void;
  onCreateDoc: (templateId: string) => void;
}

const templateCategories = [
  { key: "all", label: "Tất cả", icon: <LayoutGrid className="w-3 h-3" /> },
  { key: "doc", label: "Tài liệu", icon: <FileText className="w-3 h-3" /> },
  { key: "dev", label: "Kỹ thuật", icon: <Code className="w-3 h-3" /> },
  { key: "team", label: "Đội nhóm", icon: <Users className="w-3 h-3" /> },
];

const templateCategoryMap: Record<string, string> = {
  blank: "doc", prd: "doc", api: "dev", meeting: "team",
  retro: "team", rfc: "dev", onboard: "team", wiki: "doc",
};

export function TemplateGalleryModal({
  templateSearch, setTemplateSearch,
  templateCategory, setTemplateCategory,
  templateGalleryPreview, setTemplateGalleryPreview,
  onClose, onCreateDoc,
}: TemplateGalleryModalProps) {
  const filteredTemplates = templates.filter(t => {
    const matchCategory = templateCategory === "all" || templateCategoryMap[t.id] === templateCategory;
    const matchSearch = !templateSearch.trim() || t.name.toLowerCase().includes(templateSearch.toLowerCase()) || t.desc.toLowerCase().includes(templateSearch.toLowerCase());
    return matchCategory && matchSearch;
  });
  const previewTpl = templateGalleryPreview ? templates.find(t => t.id === templateGalleryPreview) : null;

  const handleClose = () => {
    onClose();
    setTemplateSearch("");
    setTemplateCategory("all");
    setTemplateGalleryPreview(null);
  };

  const handleCreate = (id: string) => {
    onCreateDoc(id);
    setTemplateSearch("");
    setTemplateCategory("all");
    setTemplateGalleryPreview(null);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex" onClick={e => e.stopPropagation()}>
        {/* Left: Template list */}
        <div className={`${previewTpl ? "w-[320px]" : "flex-1"} flex flex-col shrink-0`} style={{ borderRight: previewTpl ? "1px solid #DFE1E6" : undefined }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #DFE1E6" }}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: "#0052CC" }} />
              <div>
                <h3 className="text-[14px]" style={{ color: "#172B4D", fontWeight: 500 }}>Tạo tài liệu mới</h3>
                <p className="text-[10px] mt-0.5" style={{ color: "#6B778C" }}>Chọn template hoặc bắt đầu từ trang trắng</p>
              </div>
            </div>
            <button onClick={handleClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: "#6B778C" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}><X className="w-4 h-4" /></button>
          </div>
          {/* Search */}
          <div className="px-4 py-3" style={{ borderBottom: "1px solid #DFE1E6" }}>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#6B778C" }} />
              <input value={templateSearch} onChange={e => setTemplateSearch(e.target.value)}
                placeholder="Tìm template..." autoFocus
                className="w-full pl-8 pr-3 py-2 text-[12px] rounded-md focus:outline-none"
                style={{ border: "1px solid #DFE1E6", color: "#172B4D" }} />
            </div>
            {/* Category tabs */}
            <div className="flex items-center gap-1 mt-2 p-0.5 rounded-md" style={{ backgroundColor: "#F4F5F7" }}>
              {templateCategories.map(c => (
                <button key={c.key} onClick={() => setTemplateCategory(c.key)}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] rounded transition-all ${templateCategory === c.key ? "bg-white shadow-sm" : ""}`}
                  style={{ color: templateCategory === c.key ? "#172B4D" : "#6B778C", fontWeight: templateCategory === c.key ? 500 : 400 }}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>
          {/* Template list */}
          <div className="flex-1 overflow-auto p-3 space-y-1">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-8 h-8 mx-auto mb-3" style={{ color: "#DFE1E6" }} />
                <p className="text-[12px]" style={{ color: "#6B778C" }}>Không tìm thấy template phù hợp</p>
              </div>
            ) : filteredTemplates.map(tpl => (
              <div key={tpl.id}
                onMouseEnter={() => setTemplateGalleryPreview(tpl.id)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all"
                style={{
                  border: templateGalleryPreview === tpl.id ? "1px solid #0052CC" : "1px solid transparent",
                  backgroundColor: templateGalleryPreview === tpl.id ? "#DEEBFF" : "transparent",
                }}
                onClick={() => handleCreate(tpl.id)}>
                <span className="text-xl shrink-0">{tpl.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] truncate" style={{ color: "#172B4D", fontWeight: 500 }}>{tpl.name}</p>
                  <p className="text-[10px] truncate" style={{ color: "#6B778C" }}>{tpl.desc}</p>
                </div>
                <button className="shrink-0 px-2 py-1 rounded text-[10px] text-white transition-all opacity-0 group-hover:opacity-100"
                  style={{ backgroundColor: "#0052CC" }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                  onClick={e => { e.stopPropagation(); handleCreate(tpl.id); }}>
                  Dùng
                </button>
              </div>
            ))}
          </div>
          {/* Footer */}
          <div className="px-4 py-2 flex items-center justify-between" style={{ borderTop: "1px solid #DFE1E6", backgroundColor: "#FAFBFC" }}>
            <span className="text-[10px] flex items-center gap-1" style={{ color: "#6B778C" }}>
              <Layers className="w-3 h-3" /> {filteredTemplates.length}/{templates.length} templates
            </span>
            <span className="text-[10px]" style={{ color: "#C1C7D0" }}>Hover để xem trước</span>
          </div>
        </div>
        {/* Right: Preview pane */}
        {previewTpl && (
          <div className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: "#FAFBFC" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #DFE1E6" }}>
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="w-4 h-4 shrink-0" style={{ color: "#6B778C" }} />
                <span className="text-[12px] truncate" style={{ color: "#172B4D", fontWeight: 500 }}>Xem trước: {previewTpl.name}</span>
              </div>
              <button onClick={() => handleCreate(previewTpl.id)}
                className="shrink-0 px-3 py-1.5 rounded-md text-[11px] text-white transition-all"
                style={{ backgroundColor: "#0052CC" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#0747A6")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#0052CC")}>
                Dùng mẫu này
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="bg-white rounded-lg p-6 shadow-sm" style={{ border: "1px solid #DFE1E6" }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{previewTpl.icon}</span>
                  <h2 style={{ fontSize: "20px", fontWeight: 500, color: "#172B4D" }}>{previewTpl.name}</h2>
                </div>
                <div className="text-[12px] leading-[1.8]" style={{ color: "#172B4D" }}
                  dangerouslySetInnerHTML={{ __html: previewTpl.content ? markdownToEditorHtml(previewTpl.content) : "<p style='color:#6B778C'>Trang trắng — bắt đầu viết nội dung của bạn.</p>" }} />
              </div>
            </div>
            {/* Template info */}
            <div className="px-5 py-3 flex items-center gap-4" style={{ borderTop: "1px solid #DFE1E6", backgroundColor: "#FAFBFC" }}>
              <span className="text-[10px] flex items-center gap-1" style={{ color: "#6B778C" }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: previewTpl.color }} />
                {templateCategoryMap[previewTpl.id] === "dev" ? "Kỹ thuật" : templateCategoryMap[previewTpl.id] === "team" ? "Đội nhóm" : "Tài liệu"}
              </span>
              <span className="text-[10px]" style={{ color: "#6B778C" }}>
                ~{previewTpl.content ? Math.ceil(previewTpl.content.split(/\s+/).length / 250) : 0} phút đọc
              </span>
              <span className="text-[10px]" style={{ color: "#6B778C" }}>
                {previewTpl.content ? previewTpl.content.split(/\s+/).length : 0} từ
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
