import { useState, useRef, useEffect } from "react";
import { Paperclip, Smile, X, FileText, Image as ImageIcon, File } from "lucide-react";

interface CommentActionsProps {
  onInsertEmoji: (emoji: string) => void;
}

const quickEmojis = ["👍", "❤️", "😂", "🎉", "🔥", "👀", "✅", "💯"];

const emojiCategories = [
  { icon: "😊", label: "Mặt cười", emojis: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😉","😊","😇","🥰","😍","🤩","😘","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","😐","😏","😒","🙄","😬","😌","😔","😪","😴","😷","🤯","🥳","😎","🤓","🧐"] },
  { icon: "👍", label: "Cử chỉ", emojis: ["👋","🤚","✋","🖖","👌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤝","🙏","💪","🤝"] },
  { icon: "❤️", label: "Biểu tượng", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","❤️‍🔥","💕","💖","💗","💝","⭐","🌟","✨","⚡","🔥","💥","🎯","🎉","🎊","🏆","🥇","✅","❌","⚠️","💡","🔔","📌","🔗","💬","💭","🗓️","📊","📈","📝","🔍","💻","🚀","🏁"] },
  { icon: "🍔", label: "Đồ vật", emojis: ["☕","🍕","🍔","🍟","🍿","🧁","🍰","🎂","🍩","🍪","🥤","🍺","🍷","🥂","🍻","🎮","🎲","🎯","🎸","🎵","🎶","📱","💻","⌨️","🖥️","📷","📸","📹","🔋","💡","🔧","🔨","⚙️","🛠️","📦","📫","✏️","📎","📐","📏"] },
];

type AttachedFile = {
  id: string;
  name: string;
  size: string;
  type: "image" | "document" | "other";
};

export function CommentActions({ onInsertEmoji }: CommentActionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Close emoji picker on click outside
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmojiPicker]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: AttachedFile[] = Array.from(files).map(file => {
      const isImage = file.type.startsWith("image/");
      const isDoc = file.type.includes("pdf") || file.type.includes("document") || file.type.includes("text");
      const sizeKB = file.size / 1024;
      const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${Math.round(sizeKB)} KB`;
      return {
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        size: sizeStr,
        type: isImage ? "image" : isDoc ? "document" : "other",
      };
    });
    setAttachedFiles(prev => [...prev, ...newFiles]);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const FileIcon = ({ type }: { type: AttachedFile["type"] }) => {
    if (type === "image") return <ImageIcon className="w-3 h-3 text-cyan-500" />;
    if (type === "document") return <FileText className="w-3 h-3 text-violet-500" />;
    return <File className="w-3 h-3 text-gray-400" />;
  };

  return (
    <>
      {/* Attached files preview (above the toolbar) */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {attachedFiles.map(file => (
            <div key={file.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-[10px] text-gray-600 group">
              <FileIcon type={file.type} />
              <span className="truncate max-w-[120px]">{file.name}</span>
              <span className="text-[8px] text-gray-400">{file.size}</span>
              <button onClick={() => removeFile(file.id)} className="w-3.5 h-3.5 rounded-full hover:bg-red-100 flex items-center justify-center text-gray-300 hover:text-red-500 transition-all">
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {/* Paperclip - File attachment */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.pptx,.zip,.rar"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center transition-all ${attachedFiles.length > 0 ? "text-cyan-500" : "text-gray-300 hover:text-gray-500"}`}
          title="Đính kèm file"
        >
          <Paperclip className="w-3 h-3" />
        </button>

        {/* Smile - Emoji picker */}
        <div className="relative" ref={emojiRef}>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center transition-all ${showEmojiPicker ? "text-cyan-500 bg-cyan-50" : "text-gray-300 hover:text-gray-500"}`}
            title="Thêm emoji"
          >
            <Smile className="w-3 h-3" />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl border border-gray-200 shadow-2xl w-[280px] z-50 overflow-hidden">
              {/* Quick reactions */}
              <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100">
                {quickEmojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => { onInsertEmoji(emoji); setShowEmojiPicker(false); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[16px] hover:bg-gray-100 hover:scale-110 transition-all"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Category tabs */}
              <div className="flex items-center gap-0.5 px-2 py-1 border-b border-gray-100">
                {emojiCategories.map((cat, i) => (
                  <button
                    key={cat.label}
                    onClick={() => setActiveCategory(i)}
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[13px] shrink-0 transition-all ${activeCategory === i ? "bg-cyan-50" : "hover:bg-gray-100"}`}
                  >
                    {cat.icon}
                  </button>
                ))}
              </div>

              {/* Emoji grid */}
              <div className="px-2 py-1.5 h-[160px] overflow-y-auto">
                <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1 px-0.5">{emojiCategories[activeCategory]?.label}</p>
                <div className="grid grid-cols-8 gap-0.5">
                  {emojiCategories[activeCategory]?.emojis.map((emoji, i) => (
                    <button
                      key={`${emoji}-${i}`}
                      onClick={() => { onInsertEmoji(emoji); setShowEmojiPicker(false); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[15px] hover:bg-gray-100 hover:scale-110 transition-all"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
