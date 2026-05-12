import { useState } from "react";
import {
  MoreHorizontal,
  Home, Inbox, FileText, Target, Zap,
  Users, Activity, StickyNote, CalendarDays,
  Bookmark, MessageSquare, Phone, Bell,
  ChevronRight, Settings
} from "lucide-react";

interface BottomNavBarProps {
  currentView: string;
  selectedSpace: string | null;
  showPersonalSidebar: boolean;
  showChannelSidebar: boolean;
  showProjectsSidebar: boolean;
  onTogglePersonalSidebar: () => void;
  onToggleChannelSidebar: () => void;
  onToggleProjectsSidebar: () => void;
  onBotClick: () => void;
  onViewChange: (view: string) => void;
  onSpaceSelect: (id: string | null) => void;
  personalUnread: number;
  channelUnread: number;
  mobileTab: "chat" | "calls" | "notifications" | "more";
  onMobileTabChange: (tab: "chat" | "calls" | "notifications" | "more") => void;
}

export function BottomNavBar({
  currentView, selectedSpace,
  showPersonalSidebar, showChannelSidebar, showProjectsSidebar,
  onTogglePersonalSidebar, onToggleChannelSidebar, onToggleProjectsSidebar,
  onBotClick, onViewChange, onSpaceSelect,
  personalUnread, channelUnread,
  mobileTab, onMobileTabChange,
}: BottomNavBarProps) {
  const [showMore, setShowMore] = useState(false);


  return (
    <>
      {/* More — full screen, Messenger-style list */}
      <div
        className={`md:hidden fixed inset-0 bottom-16 z-40 bg-[#f5f5f5] flex flex-col transition-transform duration-300 ease-out ${
          showMore ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Header */}
        <div className="bg-white px-4 py-4 border-b border-gray-100">
          <p className="text-[22px] text-gray-900" style={{ fontWeight: 700 }}>Thêm</p>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-3 px-0">
          {/* Group 1: Cơ bản */}
          <div className="bg-white">
            {[
              { icon: <Home className="w-5 h-5" />, color: "#6366f1", label: "Trang chủ", view: "dashboard" },
              { icon: <Inbox className="w-5 h-5" />, color: "#0891b2", label: "Inbox", view: "inbox", badge: true },
              { icon: <Bookmark className="w-5 h-5" />, color: "#f59e0b", label: "Đã lưu", view: "saved" },
              { icon: <FileText className="w-5 h-5" />, color: "#8b5cf6", label: "Tài liệu", view: "docs" },
            ].map((item, i, arr) => (
              <button
                key={item.view}
                onClick={() => { onViewChange(item.view); onSpaceSelect(null); setShowMore(false); }}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-gray-50 transition-colors ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: item.color }}>
                  {item.icon}
                </div>
                <span className="flex-1 text-left text-[15px] text-gray-800">{item.label}</span>
                {(item as any).badge && <span className="w-2 h-2 rounded-full bg-red-500 mr-1" />}
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>

          {/* Group 2: Công việc */}
          <div className="bg-white">
            {[
              { icon: <Target className="w-5 h-5" />, color: "#ef4444", label: "Goals", view: "goals" },
              { icon: <Zap className="w-5 h-5" />, color: "#f97316", label: "Sprints", view: "sprints" },
              { icon: <Activity className="w-5 h-5" />, color: "#06b6d4", label: "Hoạt động", view: "activity" },
              { icon: <Users className="w-5 h-5" />, color: "#7c3aed", label: "Team", view: "team" },
            ].map((item, i, arr) => (
              <button
                key={item.view}
                onClick={() => { onViewChange(item.view); onSpaceSelect(null); setShowMore(false); }}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-gray-50 transition-colors ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: item.color }}>
                  {item.icon}
                </div>
                <span className="flex-1 text-left text-[15px] text-gray-800">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>

          {/* Group 3: Tiện ích */}
          <div className="bg-white">
            {[
              { icon: <StickyNote className="w-5 h-5" />, color: "#f97316", label: "Notepad", view: "notepad" },
              { icon: <CalendarDays className="w-5 h-5" />, color: "#10b981", label: "Nhắc nhở", view: "reminders" },
              { icon: <Settings className="w-5 h-5" />, color: "#6b7280", label: "Cài đặt", view: "settings" },
            ].map((item, i, arr) => (
              <button
                key={item.view}
                onClick={() => { onViewChange(item.view); onSpaceSelect(null); setShowMore(false); }}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-gray-50 transition-colors ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: item.color }}>
                  {item.icon}
                </div>
                <span className="flex-1 text-left text-[15px] text-gray-800">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Nav Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex items-stretch h-16">
        <NavTab
          icon={<MessageSquare className="w-5 h-5" />}
          label="Đoạn chat"
          active={mobileTab === "chat"}
          onClick={() => { setShowMore(false); onMobileTabChange("chat"); }}
          badge={personalUnread > 0 || channelUnread > 0}
          activeColor="#0891b2"
        />
        <NavTab
          icon={<Phone className="w-5 h-5" />}
          label="Cuộc gọi"
          active={mobileTab === "calls"}
          onClick={() => { setShowMore(false); onMobileTabChange("calls"); }}
          activeColor="#0891b2"
        />
        <NavTab
          icon={<Bell className="w-5 h-5" />}
          label="Thông báo"
          active={mobileTab === "notifications"}
          onClick={() => { setShowMore(false); onMobileTabChange("notifications"); }}
          activeColor="#0891b2"
        />
        <NavTab
          icon={<MoreHorizontal className="w-5 h-5" />}
          label="Thêm"
          active={showMore || mobileTab === "more"}
          onClick={() => { onMobileTabChange("more"); setShowMore(v => !v); }}
          activeColor="#0891b2"
        />
      </div>
    </>
  );
}

function NavTab({
  icon, label, active, onClick, badge, activeColor,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: boolean;
  activeColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all py-1"
      style={active ? { color: activeColor } : undefined}
    >
      {active && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full"
          style={{ backgroundColor: activeColor }}
        />
      )}
      <div className={`relative ${active ? "" : "text-gray-400"}`}>
        {icon}
        {badge && (
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-500 border-2 border-white" />
        )}
      </div>
      <span className={`text-[11px] font-medium ${active ? "" : "text-gray-500"}`}>{label}</span>
    </button>
  );
}
