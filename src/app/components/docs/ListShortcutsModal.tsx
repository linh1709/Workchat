import { X, Keyboard } from "lucide-react";

interface ListShortcutsModalProps {
  onClose: () => void;
}

export function ListShortcutsModal({ onClose }: ListShortcutsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-cyan-500" />
            <h3 className="text-[14px] text-gray-900">Phím tắt</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 max-h-[60vh] overflow-auto">
          {[
            { group: "Chung", shortcuts: [
              { keys: "⌘ + S", desc: "Lưu tài liệu" },
              { keys: "⌘ + K", desc: "Mở Command Palette" },
              { keys: "Esc", desc: "Thoát Focus Mode / Đóng modal" },
            ]},
            { group: "Soạn thảo", shortcuts: [
              { keys: "/", desc: "Mở menu chèn block (Slash Commands)" },
              { keys: "@", desc: "Mention — nhắc đến thành viên" },
              { keys: "⌘ + B", desc: "In đậm (Bold)" },
              { keys: "⌘ + I", desc: "In nghiêng (Italic)" },
              { keys: "⌘ + U", desc: "Gạch chân (Underline)" },
              { keys: "⌘ + Shift + S", desc: "Gạch ngang (Strikethrough)" },
              { keys: "⌘ + Shift + K", desc: "Chèn code inline" },
              { keys: "⌘ + Z", desc: "Hoàn tác (Undo)" },
              { keys: "⌘ + Shift + Z", desc: "Làm lại (Redo)" },
            ]},
            { group: "Điều hướng", shortcuts: [
              { keys: "⌘ + F", desc: "Tìm kiếm trong tài liệu" },
              { keys: "⌘ + H", desc: "Tìm & Thay thế" },
              { keys: "⌘ + \\", desc: "Ẩn/hiện sidebar" },
              { keys: "⌘ + Shift + P", desc: "Bật/tắt Preview" },
              { keys: "⌘ + Shift + F", desc: "Focus Mode" },
              { keys: "⌘ + Shift + O", desc: "Mở Mục lục (Outline)" },
            ]},
            { group: "Danh sách tài liệu", shortcuts: [
              { keys: "⌘ + A", desc: "Chọn tất cả" },
              { keys: "Delete", desc: "Xoá tài liệu đã chọn" },
              { keys: "⌘ + N", desc: "Tạo tài liệu mới" },
            ]},
          ].map(g => (
            <div key={g.group} className="mb-4 last:mb-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2" style={{ fontWeight: 600 }}>{g.group}</p>
              <div className="space-y-1">
                {g.shortcuts.map(s => (
                  <div key={s.keys} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-all">
                    <span className="text-[11px] text-gray-600">{s.desc}</span>
                    <kbd className="text-[10px] text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md font-mono">{s.keys}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center">
          <p className="text-[9px] text-gray-400">Trên macOS, ⌘ = Command. Trên Windows, ⌘ = Ctrl.</p>
          <button onClick={onClose} className="text-[11px] text-cyan-600 hover:text-cyan-700 px-3 py-1.5 rounded-lg hover:bg-cyan-50 transition-all">Đóng</button>
        </div>
      </div>
    </div>
  );
}
