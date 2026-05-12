import { X, Bell, Edit3, MessageSquare, Heart, Share2, AtSign } from "lucide-react";

interface Notification {
  id: number;
  type: "edit" | "comment" | "like" | "share" | "mention";
  user: string;
  avatar: string;
  initials: string;
  message: string;
  doc: string;
  time: string;
  read: boolean;
}

interface NotificationsPanelProps {
  pageNotifications: Notification[];
  notificationsRead: Set<number>;
  setNotificationsRead: React.Dispatch<React.SetStateAction<Set<number>>>;
  onClose: () => void;
}

export function NotificationsPanel({
  pageNotifications, notificationsRead, setNotificationsRead, onClose,
}: NotificationsPanelProps) {
  return (
    <div className="fixed top-12 right-4 z-[60] w-[360px] bg-white rounded-lg shadow-2xl overflow-hidden" style={{ border: "1px solid #DFE1E6" }}
      onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #DFE1E6" }}>
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" style={{ color: "#0052CC" }} />
          <span className="text-[12px]" style={{ color: "#172B4D", fontWeight: 500 }}>Thông báo</span>
          {pageNotifications.filter(n => !n.read && !notificationsRead.has(n.id)).length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] text-white" style={{ backgroundColor: "#DE350B" }}>
              {pageNotifications.filter(n => !n.read && !notificationsRead.has(n.id)).length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setNotificationsRead(new Set(pageNotifications.map(n => n.id)))}
            className="text-[10px] px-2 py-1 rounded transition-all"
            style={{ color: "#0052CC" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#DEEBFF")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
            Đánh dấu tất cả đã đọc
          </button>
          <button onClick={onClose} style={{ color: "#6B778C" }} className="hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="max-h-[400px] overflow-auto">
        {pageNotifications.map(notif => {
          const isRead = notif.read || notificationsRead.has(notif.id);
          const typeIcon = notif.type === "edit" ? <Edit3 className="w-3 h-3" />
            : notif.type === "comment" ? <MessageSquare className="w-3 h-3" />
            : notif.type === "like" ? <Heart className="w-3 h-3" />
            : notif.type === "share" ? <Share2 className="w-3 h-3" />
            : <AtSign className="w-3 h-3" />;
          const typeColor = notif.type === "edit" ? "#0052CC"
            : notif.type === "comment" ? "#00875A"
            : notif.type === "like" ? "#DE350B"
            : notif.type === "share" ? "#5243AA"
            : "#FF8B00";
          return (
            <div key={notif.id}
              className="flex items-start gap-3 px-4 py-3 transition-all cursor-pointer"
              style={{ backgroundColor: isRead ? "transparent" : "#FAFBFC", borderBottom: "1px solid #F4F5F7" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = isRead ? "transparent" : "#FAFBFC")}
              onClick={() => setNotificationsRead(prev => new Set([...prev, notif.id]))}>
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] text-white" style={{ backgroundColor: notif.avatar }}>{notif.initials}</div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: typeColor, color: "white" }}>
                  {typeIcon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px]" style={{ color: "#172B4D" }}>
                  <strong>{notif.user}</strong>{" "}{notif.message}{" "}
                  <span style={{ color: "#0052CC" }}>{notif.doc}</span>
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "#6B778C" }}>{notif.time}</p>
              </div>
              {!isRead && <div className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ backgroundColor: "#0052CC" }} />}
            </div>
          );
        })}
        {pageNotifications.length === 0 && (
          <div className="py-12 text-center">
            <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: "#DFE1E6" }} />
            <p className="text-[12px]" style={{ color: "#6B778C" }}>Không có thông báo mới</p>
          </div>
        )}
      </div>
      <div className="px-4 py-2.5 text-center" style={{ borderTop: "1px solid #DFE1E6", backgroundColor: "#FAFBFC" }}>
        <button className="text-[10px] transition-all" style={{ color: "#0052CC" }}>Xem tất cả thông báo</button>
      </div>
    </div>
  );
}
