import { X, GitCompare, ArrowRightLeft } from "lucide-react";
import type { Doc } from "./docs-types";

interface VersionDiffModalProps {
  editingDoc: Doc;
  diffVersions: [number, number];
  setDiffVersions: (v: [number, number]) => void;
  onClose: () => void;
}

export function VersionDiffModal({
  editingDoc, diffVersions, setDiffVersions, onClose,
}: VersionDiffModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #DFE1E6" }}>
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5" style={{ color: "#0052CC" }} />
            <div>
              <h3 className="text-[14px]" style={{ color: "#172B4D", fontWeight: 500 }}>So sánh phiên bản</h3>
              <p className="text-[10px] mt-0.5" style={{ color: "#6B778C" }}>So sánh sự thay đổi giữa hai phiên bản</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: "#6B778C" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}><X className="w-4 h-4" /></button>
        </div>
        {/* Version selector */}
        <div className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: "1px solid #DFE1E6", backgroundColor: "#FAFBFC" }}>
          <div className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color: "#6B778C" }}>Từ:</span>
            <select value={diffVersions[0]} onChange={e => setDiffVersions([parseInt(e.target.value), diffVersions[1]])}
              className="text-[11px] px-2 py-1 rounded-md focus:outline-none" style={{ border: "1px solid #DFE1E6", color: "#172B4D" }}>
              {editingDoc.versions.map((v, i) => (
                <option key={v.id} value={i}>v{v.id} — {v.summary.slice(0, 30)}</option>
              ))}
            </select>
          </div>
          <ArrowRightLeft className="w-4 h-4 shrink-0" style={{ color: "#6B778C" }} />
          <div className="flex items-center gap-2">
            <span className="text-[10px]" style={{ color: "#6B778C" }}>Đến:</span>
            <select value={diffVersions[1]} onChange={e => setDiffVersions([diffVersions[0], parseInt(e.target.value)])}
              className="text-[11px] px-2 py-1 rounded-md focus:outline-none" style={{ border: "1px solid #DFE1E6", color: "#172B4D" }}>
              {editingDoc.versions.map((v, i) => (
                <option key={v.id} value={i}>v{v.id} — {v.summary.slice(0, 30)}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Diff content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-5" style={{ borderRight: "1px solid #DFE1E6" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#DE350B" }} />
              <span className="text-[11px]" style={{ color: "#172B4D", fontWeight: 500 }}>
                v{editingDoc.versions[diffVersions[0]]?.id || "?"} — {editingDoc.versions[diffVersions[0]]?.date}
              </span>
            </div>
            <div className="text-[12px] leading-relaxed p-4 rounded-lg" style={{ backgroundColor: "#FFEBE6", border: "1px solid #FFBDAD", color: "#172B4D" }}>
              <p className="text-[11px] italic" style={{ color: "#6B778C" }}>
                {editingDoc.versions[diffVersions[0]]?.summary || "Không có thông tin"}
              </p>
              <p className="text-[10px] mt-2" style={{ color: "#6B778C" }}>
                Bởi {editingDoc.versions[diffVersions[0]]?.author}
              </p>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#00875A" }} />
              <span className="text-[11px]" style={{ color: "#172B4D", fontWeight: 500 }}>
                v{editingDoc.versions[diffVersions[1]]?.id || "?"} — {editingDoc.versions[diffVersions[1]]?.date}
              </span>
            </div>
            <div className="text-[12px] leading-relaxed p-4 rounded-lg" style={{ backgroundColor: "#E3FCEF", border: "1px solid #ABF5D1", color: "#172B4D" }}>
              <p className="text-[11px] italic" style={{ color: "#6B778C" }}>
                {editingDoc.versions[diffVersions[1]]?.summary || "Không có thông tin"}
              </p>
              <p className="text-[10px] mt-2" style={{ color: "#6B778C" }}>
                Bởi {editingDoc.versions[diffVersions[1]]?.author}
              </p>
            </div>
          </div>
        </div>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid #DFE1E6", backgroundColor: "#FAFBFC" }}>
          <span className="text-[10px]" style={{ color: "#6B778C" }}>
            Đang so sánh {editingDoc.versions.length} phiên bản
          </span>
          <button onClick={onClose} className="px-3 py-1.5 rounded-md text-[11px] text-white" style={{ backgroundColor: "#0052CC" }}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
