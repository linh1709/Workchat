import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

const EPIC_COLORS = ["#dc2626", "#ea580c", "#d97706", "#65a30d", "#059669", "#0891b2", "#2563eb", "#7c3aed", "#db2777"];

interface EpicCreateModalProps {
  projectId: string;
  onClose: () => void;
}

export function EpicCreateModal({ projectId, onClose }: EpicCreateModalProps) {
  const [form, setForm] = useState({ title: "", description: "", color: EPIC_COLORS[0], startDate: "", dueDate: "" });

  const save = () => {
    if (!form.title.trim()) return;
    // Trong thực tế sẽ gọi API/state management để lưu
    // Hiện tại toast thông báo thành công
    toast.success("Epic đã được tạo", { description: form.title });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[460px] overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-[18px]">⚡</span>
            <h3 className="text-[15px] font-semibold text-gray-800">Tạo Epic mới</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Tên Epic <span className="text-red-500">*</span></label>
            <input
              autoFocus value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && save()}
              placeholder="Ví dụ: Authentication & Security"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10 text-gray-800 transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Mô tả</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Mô tả ngắn về Epic này..."
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10 text-gray-700 resize-none transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-gray-500 mb-2 block">Màu sắc</label>
            <div className="flex gap-2.5">
              {EPIC_COLORS.map(c => (
                <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                  className="w-7 h-7 rounded-full transition-all duration-150 ring-offset-2"
                  style={{
                    backgroundColor: c,
                    transform: form.color === c ? "scale(1.2)" : "scale(1)",
                    ring: form.color === c ? `2px solid ${c}` : "none",
                    boxShadow: form.color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : "none",
                  }}
                />
              ))}
            </div>
            {/* Preview */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium"
              style={{ backgroundColor: form.color + "18", color: form.color, borderColor: form.color + "40" }}>
              ⚡ {form.title || "Tên Epic"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Ngày bắt đầu</label>
              <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-cyan-400 text-gray-700" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Ngày kết thúc</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-cyan-400 text-gray-700" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
            Huỷ
          </button>
          <button onClick={save} disabled={!form.title.trim()}
            className="px-5 py-2 text-[12px] font-medium bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-40 transition-colors flex items-center gap-1.5">
            ⚡ Tạo Epic
          </button>
        </div>
      </div>
    </div>
  );
}
