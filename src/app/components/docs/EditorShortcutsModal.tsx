import { X, Keyboard } from "lucide-react";

interface EditorShortcutsModalProps {
  onClose: () => void;
}

export function EditorShortcutsModal({ onClose }: EditorShortcutsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #DFE1E6" }}>
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" style={{ color: "#0052CC" }} />
            <h3 className="text-[14px]" style={{ color: "#172B4D", fontWeight: 500 }}>Phím tắt bàn phím</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: "#6B778C" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 max-h-[60vh] overflow-auto">
          {[
            { group: "Soạn thảo", shortcuts: [
              { keys: "⌘B", desc: "In đậm (Bold)" },
              { keys: "⌘I", desc: "In nghiêng (Italic)" },
              { keys: "⌘U", desc: "Gạch chân (Underline)" },
              { keys: "⌘S", desc: "Lưu tài liệu" },
              { keys: "/", desc: "Mở menu lệnh (Slash commands)" },
              { keys: "@", desc: "Mention thành viên" },
            ]},
            { group: "Tìm kiếm", shortcuts: [
              { keys: "⌘F", desc: "Tìm kiếm trong trang" },
              { keys: "⌘H", desc: "Tìm & Thay thế" },
            ]},
            { group: "Điều hướng", shortcuts: [
              { keys: "Esc", desc: "Quay lại / Thoát Focus Mode" },
            ]},
          ].map(g => (
            <div key={g.group} className="mb-4">
              <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#6B778C" }}>{g.group}</p>
              <div className="space-y-1.5">
                {g.shortcuts.map(s => (
                  <div key={s.keys} className="flex items-center justify-between py-1.5 px-2 rounded" style={{ backgroundColor: "#FAFBFC" }}>
                    <span className="text-[12px]" style={{ color: "#172B4D" }}>{s.desc}</span>
                    <kbd className="text-[11px] px-2 py-0.5 rounded" style={{ backgroundColor: "#DFE1E6", color: "#172B4D", fontFamily: "monospace" }}>{s.keys}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
