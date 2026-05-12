import { X, Shield, Globe, Lock, ShieldCheck, Check } from "lucide-react";
import { toast } from "sonner";
import { teamMembers } from "./docs-data";

interface PageRestrictionsModalProps {
  pageRestrictions: { type: "none" | "view" | "edit"; users: string[] };
  setPageRestrictions: React.Dispatch<React.SetStateAction<{ type: "none" | "view" | "edit"; users: string[] }>>;
  restrictionTab: "view" | "edit";
  setRestrictionTab: (v: "view" | "edit") => void;
  onClose: () => void;
}

export function PageRestrictionsModal({
  pageRestrictions, setPageRestrictions,
  restrictionTab, setRestrictionTab, onClose,
}: PageRestrictionsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #DFE1E6" }}>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: "#0052CC" }} />
            <div>
              <h3 className="text-[14px]" style={{ color: "#172B4D", fontWeight: 500 }}>Giới hạn trang</h3>
              <p className="text-[10px] mt-0.5" style={{ color: "#6B778C" }}>Chỉ người được chọn mới có quyền truy cập</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: "#6B778C" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">
          {/* Restriction type */}
          <div className="space-y-2 mb-5">
            {[
              { type: "none" as const, label: "Không giới hạn", desc: "Tất cả thành viên đều có thể xem và chỉnh sửa", icon: <Globe className="w-4 h-4" />, color: "#00875A" },
              { type: "edit" as const, label: "Giới hạn chỉnh sửa", desc: "Chỉ người được chọn mới có thể chỉnh sửa", icon: <Lock className="w-4 h-4" />, color: "#FF8B00" },
              { type: "view" as const, label: "Giới hạn xem", desc: "Chỉ người được chọn mới có thể xem", icon: <ShieldCheck className="w-4 h-4" />, color: "#DE350B" },
            ].map(opt => (
              <button key={opt.type} onClick={() => setPageRestrictions(prev => ({ ...prev, type: opt.type }))}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all"
                style={{
                  border: pageRestrictions.type === opt.type ? `2px solid ${opt.color}` : "1px solid #DFE1E6",
                  backgroundColor: pageRestrictions.type === opt.type ? (opt.type === "none" ? "#E3FCEF" : opt.type === "edit" ? "#FFFAE6" : "#FFEBE6") : "white",
                }}>
                <span style={{ color: opt.color }}>{opt.icon}</span>
                <div className="flex-1">
                  <p className="text-[12px]" style={{ color: "#172B4D", fontWeight: 500 }}>{opt.label}</p>
                  <p className="text-[10px]" style={{ color: "#6B778C" }}>{opt.desc}</p>
                </div>
                {pageRestrictions.type === opt.type && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: opt.color }}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* User list for restricted modes */}
          {pageRestrictions.type !== "none" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px]" style={{ color: "#172B4D", fontWeight: 500 }}>
                  {pageRestrictions.type === "edit" ? "Ai có thể chỉnh sửa?" : "Ai có thể xem?"}
                </p>
              </div>
              {/* Tabs */}
              <div className="flex gap-0.5 mb-3 p-0.5 rounded-lg" style={{ backgroundColor: "#F4F5F7" }}>
                <button onClick={() => setRestrictionTab("edit")} className={`flex-1 text-[11px] py-1.5 rounded-md transition-all ${restrictionTab === "edit" ? "bg-white shadow-sm" : ""}`}
                  style={{ color: restrictionTab === "edit" ? "#172B4D" : "#6B778C", fontWeight: restrictionTab === "edit" ? 500 : 400 }}>Chỉnh sửa</button>
                <button onClick={() => setRestrictionTab("view")} className={`flex-1 text-[11px] py-1.5 rounded-md transition-all ${restrictionTab === "view" ? "bg-white shadow-sm" : ""}`}
                  style={{ color: restrictionTab === "view" ? "#172B4D" : "#6B778C", fontWeight: restrictionTab === "view" ? 500 : 400 }}>Chỉ xem</button>
              </div>
              {/* User checkboxes */}
              <div className="space-y-1.5 max-h-[200px] overflow-auto">
                {teamMembers.map(m => {
                  const isIncluded = pageRestrictions.users.includes(m.name);
                  return (
                    <button key={m.name} onClick={() => {
                      setPageRestrictions(prev => ({
                        ...prev,
                        users: isIncluded ? prev.users.filter(u => u !== m.name) : [...prev.users, m.name],
                      }));
                    }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
                      style={{ border: isIncluded ? "1px solid #0052CC" : "1px solid #DFE1E6", backgroundColor: isIncluded ? "#DEEBFF" : "white" }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] text-white shrink-0" style={{ backgroundColor: m.color }}>
                        {m.initials}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-[11px] truncate" style={{ color: "#172B4D" }}>{m.name}</p>
                        <p className="text-[9px]" style={{ color: "#6B778C" }}>{m.role}</p>
                      </div>
                      <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${isIncluded ? "" : "border"}`}
                        style={{ backgroundColor: isIncluded ? "#0052CC" : "white", borderColor: "#DFE1E6" }}>
                        {isIncluded && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              {pageRestrictions.users.length > 0 && (
                <p className="text-[10px] mt-2" style={{ color: "#6B778C" }}>
                  {pageRestrictions.users.length} người được phép {restrictionTab === "edit" ? "chỉnh sửa" : "xem"}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-5">
            <button onClick={() => { setPageRestrictions({ type: "none", users: [] }); onClose(); toast.success("Đã bỏ giới hạn trang"); }}
              className="px-4 py-2 rounded-md text-[12px] transition-all"
              style={{ color: "#6B778C" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
              Bỏ giới hạn
            </button>
            <button onClick={() => { onClose(); toast.success(pageRestrictions.type === "none" ? "Trang không bị giới hạn" : `Đã áp dụng giới hạn "${pageRestrictions.type === "edit" ? "chỉnh sửa" : "xem"}"`); }}
              className="px-4 py-2 rounded-md text-[12px] text-white transition-all"
              style={{ backgroundColor: "#0052CC" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#0747A6")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#0052CC")}>
              Áp dụng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
