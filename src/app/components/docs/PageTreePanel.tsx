import { X, Layers, Clock, ChevronDown, ChevronRight, FolderOpen, FolderClosed, FileText } from "lucide-react";
import type { Doc, DocFolder } from "./docs-types";

interface PageTreePanelProps {
  docs: Doc[];
  folders: DocFolder[];
  editingDoc: Doc | null;
  recentlyViewedDocs: string[];
  pageTreeExpanded: Record<string, boolean>;
  setPageTreeExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onClose: () => void;
  onOpenDoc: (doc: Doc) => void;
}

export function PageTreePanel({
  docs, folders, editingDoc, recentlyViewedDocs,
  pageTreeExpanded, setPageTreeExpanded, onClose, onOpenDoc,
}: PageTreePanelProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-start" onClick={onClose}>
      <div className="bg-white shadow-2xl w-[320px] h-full overflow-hidden flex flex-col" onClick={e => e.stopPropagation()} style={{ borderRight: "1px solid #DFE1E6" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #DFE1E6" }}>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" style={{ color: "#0052CC" }} />
            <span className="text-[12px]" style={{ color: "#172B4D", fontWeight: 500 }}>Page Tree</span>
          </div>
          <button onClick={onClose} className="w-6 h-6 rounded flex items-center justify-center" style={{ color: "#6B778C" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}><X className="w-3.5 h-3.5" /></button>
        </div>
        {/* Recently viewed */}
        <div className="px-3 py-2" style={{ borderBottom: "1px solid #DFE1E6" }}>
          <p className="text-[9px] uppercase tracking-wider mb-2 px-1" style={{ color: "#6B778C", fontWeight: 600 }}>Xem gần đây</p>
          {recentlyViewedDocs.slice(0, 4).map(id => {
            const doc = docs.find(d => d.id === id);
            if (!doc) return null;
            return (
              <button key={doc.id} onClick={() => { onOpenDoc(doc); onClose(); }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all"
                style={{ color: "#172B4D" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                <Clock className="w-3 h-3 shrink-0" style={{ color: "#6B778C" }} />
                <span className="text-[11px] truncate">{doc.icon} {doc.title}</span>
              </button>
            );
          })}
        </div>
        {/* Full tree */}
        <div className="flex-1 overflow-auto px-2 py-2">
          <p className="text-[9px] uppercase tracking-wider mb-2 px-2" style={{ color: "#6B778C", fontWeight: 600 }}>Tất cả trang</p>
          {folders.filter(f => !f.parentId).map(folder => {
            const isExpanded = pageTreeExpanded[folder.id] ?? false;
            const folderDocs = docs.filter(d => d.folderId === folder.id && !d.deleted && !d.archived);
            const subFolders = folders.filter(f => f.parentId === folder.id);
            return (
              <div key={folder.id}>
                <button onClick={() => setPageTreeExpanded(p => ({ ...p, [folder.id]: !isExpanded }))}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-left transition-all"
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                  {isExpanded ? <ChevronDown className="w-3 h-3 shrink-0" style={{ color: "#6B778C" }} /> : <ChevronRight className="w-3 h-3 shrink-0" style={{ color: "#6B778C" }} />}
                  <FolderOpen className="w-3.5 h-3.5 shrink-0" style={{ color: "#FF8B00" }} />
                  <span className="text-[11px] truncate" style={{ color: "#172B4D", fontWeight: 500 }}>{folder.name}</span>
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#DFE1E6", color: "#6B778C" }}>{folderDocs.length}</span>
                </button>
                {isExpanded && (
                  <div className="ml-4 border-l" style={{ borderColor: "#DFE1E6" }}>
                    {subFolders.map(sf => {
                      const sfDocs = docs.filter(d => d.folderId === sf.id && !d.deleted && !d.archived);
                      const sfExpanded = pageTreeExpanded[sf.id] ?? false;
                      return (
                        <div key={sf.id}>
                          <button onClick={() => setPageTreeExpanded(p => ({ ...p, [sf.id]: !sfExpanded }))}
                            className="w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-left transition-all ml-1"
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                            {sfExpanded ? <ChevronDown className="w-2.5 h-2.5 shrink-0" style={{ color: "#6B778C" }} /> : <ChevronRight className="w-2.5 h-2.5 shrink-0" style={{ color: "#6B778C" }} />}
                            <FolderClosed className="w-3 h-3 shrink-0" style={{ color: "#FF8B00" }} />
                            <span className="text-[10px] truncate" style={{ color: "#172B4D" }}>{sf.name}</span>
                          </button>
                          {sfExpanded && sfDocs.map(doc => (
                            <button key={doc.id} onClick={() => { onOpenDoc(doc); onClose(); }}
                              className="w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-left transition-all ml-5"
                              style={{ color: editingDoc?.id === doc.id ? "#0052CC" : "#172B4D", backgroundColor: editingDoc?.id === doc.id ? "#DEEBFF" : "transparent" }}
                              onMouseEnter={e => { if (editingDoc?.id !== doc.id) e.currentTarget.style.backgroundColor = "#F4F5F7"; }}
                              onMouseLeave={e => { if (editingDoc?.id !== doc.id) e.currentTarget.style.backgroundColor = editingDoc?.id === doc.id ? "#DEEBFF" : "transparent"; }}>
                              <span className="text-[10px]">{doc.icon}</span>
                              <span className="text-[10px] truncate">{doc.title}</span>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                    {folderDocs.map(doc => (
                      <button key={doc.id} onClick={() => { onOpenDoc(doc); onClose(); }}
                        className="w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-left transition-all ml-1"
                        style={{ color: editingDoc?.id === doc.id ? "#0052CC" : "#172B4D", backgroundColor: editingDoc?.id === doc.id ? "#DEEBFF" : "transparent" }}
                        onMouseEnter={e => { if (editingDoc?.id !== doc.id) e.currentTarget.style.backgroundColor = "#F4F5F7"; }}
                        onMouseLeave={e => { if (editingDoc?.id !== doc.id) e.currentTarget.style.backgroundColor = editingDoc?.id === doc.id ? "#DEEBFF" : "transparent"; }}>
                        <span className="text-[10px]">{doc.icon}</span>
                        <span className="text-[10px] truncate">{doc.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {/* Root docs (no folder) */}
          <div className="mt-1">
            {docs.filter(d => !d.folderId && !d.deleted && !d.archived).map(doc => (
              <button key={doc.id} onClick={() => { onOpenDoc(doc); onClose(); }}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-left transition-all"
                style={{ color: editingDoc?.id === doc.id ? "#0052CC" : "#172B4D", backgroundColor: editingDoc?.id === doc.id ? "#DEEBFF" : "transparent" }}
                onMouseEnter={e => { if (editingDoc?.id !== doc.id) e.currentTarget.style.backgroundColor = "#F4F5F7"; }}
                onMouseLeave={e => { if (editingDoc?.id !== doc.id) e.currentTarget.style.backgroundColor = editingDoc?.id === doc.id ? "#DEEBFF" : "transparent"; }}>
                <FileText className="w-3 h-3 shrink-0" style={{ color: "#6B778C" }} />
                <span className="text-[11px]">{doc.icon} {doc.title}</span>
              </button>
            ))}
          </div>
        </div>
        {/* Footer */}
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: "1px solid #DFE1E6", backgroundColor: "#FAFBFC" }}>
          <span className="text-[10px]" style={{ color: "#6B778C" }}>{docs.filter(d => !d.deleted).length} trang · {folders.length} thư mục</span>
        </div>
      </div>
    </div>
  );
}
