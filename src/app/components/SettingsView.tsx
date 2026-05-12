import { useState, useMemo } from "react";
import { toast } from "sonner";
import { copyToClipboard } from "./clipboard";
import {
  Settings, Sparkles, Palette, Bell, Shield, ExternalLink, CreditCard,
  ChevronDown, Moon, Sun, Monitor, Lock, Mail, Smartphone, AtSign,
  CheckCircle2, Globe, Users, Database, Trash2, Download, Upload,
  Key, Eye, EyeOff, LogOut, HardDrive, RefreshCw, Zap, FileText,
  Clock, Flag, Hash, MessageSquare, Webhook, Bot, Puzzle, Check, X,
  ChevronRight, Copy, AlertTriangle, Keyboard, Command, Info,
  Languages, CircleAlert, ShieldCheck, Type, LayoutDashboard, ListTodo,
  CalendarDays, MessageCircle, BarChart3
} from "lucide-react";

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button onClick={onChange} className={`w-9 h-5 rounded-full transition-all duration-200 ${checked ? "bg-cyan-500" : "bg-gray-300"}`}>
    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-all duration-200 ${checked ? "ml-[18px]" : "ml-0.5"}`} />
  </button>
);

type SettingsSection = "workspace" | "profile" | "appearance" | "notifications" | "security" | "integrations" | "billing" | "import_export" | "api" | "shortcuts" | "about" | "danger";

export function SettingsView() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("workspace");

  // Workspace
  const [wsName, setWsName] = useState("VWork");
  const [wsUrl, setWsUrl] = useState("pro-team");
  const [wsTimezone, setWsTimezone] = useState("Asia/Ho_Chi_Minh");
  const [wsLang, setWsLang] = useState("vi");

  // Profile
  const [profileName, setProfileName] = useState("Nguyễn Minh");
  const [profileEmail, setProfileEmail] = useState("minh@vwork.app");
  const [profileTitle, setProfileTitle] = useState("Full-stack Developer");
  const [profileBio, setProfileBio] = useState("Building amazing products 🚀");

  // Appearance
  const [darkMode, setDarkMode] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [accentColor, setAccentColor] = useState("#0891b2");
  const [fontSize, setFontSize] = useState("default");
  const [sidebarPos, setSidebarPos] = useState("left");
  const [animEnabled, setAnimEnabled] = useState(true);

  // Notifications
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [mentionNotifs, setMentionNotifs] = useState(true);
  const [taskNotifs, setTaskNotifs] = useState(false);
  const [deadlineNotifs, setDeadlineNotifs] = useState(true);
  const [commentNotifs, setCommentNotifs] = useState(true);
  const [digestFreq, setDigestFreq] = useState("daily");
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("08:00");

  // Security
  const [twoFA, setTwoFA] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);

  // Integrations
  const [integrations, setIntegrations] = useState([
    { id: "slack", name: "Slack", desc: "Nhận thông báo và cập nhật task", connected: true, color: "#4A154B", icon: "S" },
    { id: "github", name: "GitHub", desc: "Liên kết PR và commit", connected: true, color: "#24292f", icon: "G" },
    { id: "figma", name: "Figma", desc: "Preview design trong task", connected: false, color: "#0ACF83", icon: "F" },
    { id: "gcal", name: "Google Calendar", desc: "Đồng bộ deadline", connected: false, color: "#4285F4", icon: "C" },
    { id: "notion", name: "Notion", desc: "Import/export documents", connected: false, color: "#000000", icon: "N" },
    { id: "discord", name: "Discord", desc: "Bot notifications", connected: false, color: "#5865F2", icon: "D" },
    { id: "jira", name: "Jira", desc: "Migrate & sync issues", connected: false, color: "#0052CC", icon: "J" },
    { id: "zapier", name: "Zapier", desc: "Automation workflows", connected: true, color: "#FF4A00", icon: "Z" },
  ]);

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: !i.connected } : i));
    const intg = integrations.find(i => i.id === id);
    toast.success(intg?.connected ? `${intg.name} đã ngắt kết nối` : `${intg?.name} đã kết nối`);
  };

  const saveSettings = () => toast.success("Cài đặt đã được lưu");

  // ===== i18n System =====
  type LangKey = "vi" | "en" | "ja" | "ko" | "zh" | "fr" | "de" | "es";
  const languages: { id: LangKey; name: string; nativeName: string; flag: string; completion: number }[] = [
    { id: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳", completion: 100 },
    { id: "en", name: "English", nativeName: "English", flag: "🇺🇸", completion: 100 },
    { id: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", completion: 98 },
    { id: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", completion: 95 },
    { id: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳", completion: 97 },
    { id: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", completion: 92 },
    { id: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", completion: 88 },
    { id: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", completion: 90 },
  ];

  const i18n: Record<LangKey, Record<string, string>> = {
    vi: {
      dashboard: "Bảng điều khiển", tasks: "Công việc", chat: "Trò chuyện", calendar: "Lịch", reports: "Báo cáo",
      newTask: "Tạo công việc mới", search: "Tìm kiếm...", settings: "Cài đặt", profile: "Hồ sơ", logout: "Đăng xuất",
      save: "Lưu thay đổi", cancel: "Hủy", delete: "Xoá", edit: "Chỉnh sửa", welcome: "Xin chào",
      notifications: "Thông báo", members: "Thành viên", projects: "Dự án", workspace: "Không gian làm việc",
      today: "Hôm nay", overdue: "Quá hạn", completed: "Hoàn thành", inProgress: "Đang thực hiện",
    },
    en: {
      dashboard: "Dashboard", tasks: "Tasks", chat: "Chat", calendar: "Calendar", reports: "Reports",
      newTask: "Create new task", search: "Search...", settings: "Settings", profile: "Profile", logout: "Log out",
      save: "Save changes", cancel: "Cancel", delete: "Delete", edit: "Edit", welcome: "Welcome",
      notifications: "Notifications", members: "Members", projects: "Projects", workspace: "Workspace",
      today: "Today", overdue: "Overdue", completed: "Completed", inProgress: "In Progress",
    },
    ja: {
      dashboard: "ダッシュボード", tasks: "タスク", chat: "チャット", calendar: "カレンダー", reports: "レポート",
      newTask: "新しいタスクを作成", search: "検索...", settings: "設定", profile: "プロフィール", logout: "ログアウト",
      save: "変更を保存", cancel: "キャンセル", delete: "削除", edit: "編集", welcome: "ようこそ",
      notifications: "通知", members: "メンバー", projects: "プロジェクト", workspace: "ワークスペース",
      today: "今日", overdue: "期限超過", completed: "完了", inProgress: "進行中",
    },
    ko: {
      dashboard: "대시보드", tasks: "작업", chat: "채팅", calendar: "캘린더", reports: "보고서",
      newTask: "새 작업 만들기", search: "검색...", settings: "설정", profile: "프로필", logout: "로그아웃",
      save: "변경 사항 저장", cancel: "취소", delete: "삭제", edit: "편집", welcome: "환영합니다",
      notifications: "알림", members: "멤버", projects: "프로젝트", workspace: "워크스페이스",
      today: "오늘", overdue: "기한 초과", completed: "완료", inProgress: "진행 중",
    },
    zh: {
      dashboard: "仪表盘", tasks: "任务", chat: "聊天", calendar: "日历", reports: "报告",
      newTask: "创建新任务", search: "搜索...", settings: "设置", profile: "个人资料", logout: "退出登录",
      save: "保存更改", cancel: "取消", delete: "删除", edit: "编辑", welcome: "欢迎",
      notifications: "通知", members: "成员", projects: "项目", workspace: "工作空间",
      today: "今天", overdue: "逾期", completed: "已完成", inProgress: "进行中",
    },
    fr: {
      dashboard: "Tableau de bord", tasks: "Tâches", chat: "Discussion", calendar: "Calendrier", reports: "Rapports",
      newTask: "Créer une tâche", search: "Rechercher...", settings: "Paramètres", profile: "Profil", logout: "Déconnexion",
      save: "Sauvegarder", cancel: "Annuler", delete: "Supprimer", edit: "Modifier", welcome: "Bienvenue",
      notifications: "Notifications", members: "Membres", projects: "Projets", workspace: "Espace de travail",
      today: "Aujourd'hui", overdue: "En retard", completed: "Terminé", inProgress: "En cours",
    },
    de: {
      dashboard: "Dashboard", tasks: "Aufgaben", chat: "Chat", calendar: "Kalender", reports: "Berichte",
      newTask: "Neue Aufgabe erstellen", search: "Suchen...", settings: "Einstellungen", profile: "Profil", logout: "Abmelden",
      save: "Änderungen speichern", cancel: "Abbrechen", delete: "Löschen", edit: "Bearbeiten", welcome: "Willkommen",
      notifications: "Benachrichtigungen", members: "Mitglieder", projects: "Projekte", workspace: "Arbeitsbereich",
      today: "Heute", overdue: "Überfällig", completed: "Abgeschlossen", inProgress: "In Bearbeitung",
    },
    es: {
      dashboard: "Panel", tasks: "Tareas", chat: "Chat", calendar: "Calendario", reports: "Informes",
      newTask: "Crear nueva tarea", search: "Buscar...", settings: "Configuración", profile: "Perfil", logout: "Cerrar sesión",
      save: "Guardar cambios", cancel: "Cancelar", delete: "Eliminar", edit: "Editar", welcome: "Bienvenido",
      notifications: "Notificaciones", members: "Miembros", projects: "Proyectos", workspace: "Espacio de trabajo",
      today: "Hoy", overdue: "Atrasado", completed: "Completado", inProgress: "En progreso",
    },
  };

  const t = useMemo(() => i18n[wsLang as LangKey] || i18n.vi, [wsLang]);
  const currentLang = languages.find(l => l.id === wsLang) || languages[0];
  const [langSearch, setLangSearch] = useState("");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const filteredLangs = languages.filter(l =>
    l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.nativeName.toLowerCase().includes(langSearch.toLowerCase())
  );

  // ===== Password Change Modal =====
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwErrors, setPwErrors] = useState<string[]>([]);
  const [pwStrength, setPwStrength] = useState(0);
  const [pwChanging, setPwChanging] = useState(false);

  const validatePassword = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const handleNewPasswordChange = (val: string) => {
    setNewPassword(val);
    setPwStrength(validatePassword(val));
  };

  const handlePasswordSubmit = () => {
    const errors: string[] = [];
    if (!currentPassword) errors.push("Vui lòng nhập mật khẩu hiện tại");
    if (newPassword.length < 8) errors.push("Mật khẩu mới phải có ít nhất 8 ký tự");
    if (!/[A-Z]/.test(newPassword)) errors.push("Phải có ít nhất 1 chữ hoa");
    if (!/[0-9]/.test(newPassword)) errors.push("Phải có ít nhất 1 chữ số");
    if (!/[^A-Za-z0-9]/.test(newPassword)) errors.push("Phải có ít nhất 1 ký tự đặc biệt");
    if (newPassword !== confirmPassword) errors.push("Mật khẩu xác nhận không khớp");
    if (currentPassword === newPassword) errors.push("Mật khẩu mới phải khác mật khẩu cũ");

    setPwErrors(errors);
    if (errors.length > 0) return;

    setPwChanging(true);
    setTimeout(() => {
      setPwChanging(false);
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwErrors([]);
      setPwStrength(0);
      toast.success("Mật khẩu đã được thay đổi thành công!");
    }, 1500);
  };

  const pwStrengthLabel = ["", "Rất yếu", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];
  const pwStrengthColor = ["", "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"];

  const navItems: { id: SettingsSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: "workspace", label: "Workspace", icon: <Sparkles className="w-4 h-4" /> },
    { id: "profile", label: "Profile", icon: <Users className="w-4 h-4" /> },
    { id: "appearance", label: "Giao diện", icon: <Palette className="w-4 h-4" /> },
    { id: "notifications", label: "Thông báo", icon: <Bell className="w-4 h-4" /> },
    { id: "security", label: "Bảo mật", icon: <Shield className="w-4 h-4" /> },
    { id: "integrations", label: "Tích hợp", icon: <Puzzle className="w-4 h-4" />, badge: `${integrations.filter(i => i.connected).length}` },
    { id: "billing", label: "Billing", icon: <CreditCard className="w-4 h-4" /> },
    { id: "import_export", label: "Import / Export", icon: <Download className="w-4 h-4" /> },
    { id: "api", label: "API & Webhooks", icon: <Webhook className="w-4 h-4" /> },
    { id: "shortcuts", label: "Shortcuts", icon: <Keyboard className="w-4 h-4" /> },
    { id: "about", label: "About", icon: <Info className="w-4 h-4" /> },
    { id: "danger", label: "Danger Zone", icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "workspace":
        return (
          <div>
            <h3 className="text-[16px] text-gray-900 mb-1">Workspace Settings</h3>
            <p className="text-[11px] text-gray-500 mb-5">Tên workspace, URL và cài đặt chung</p>
            <div className="space-y-4">
              <div><label className="text-[11px] text-gray-500 mb-1 block">Tên Workspace</label><input value={wsName} onChange={e => setWsName(e.target.value)} className="w-full text-[13px] text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-400" /></div>
              <div><label className="text-[11px] text-gray-500 mb-1 block">URL</label><div className="flex text-[13px]"><span className="text-gray-400 bg-gray-50 border border-gray-200 border-r-0 rounded-l-xl px-3 py-2.5">vwork.app/</span><input value={wsUrl} onChange={e => setWsUrl(e.target.value)} className="flex-1 text-gray-700 border border-gray-200 rounded-r-xl px-3 py-2.5 focus:outline-none focus:border-cyan-400" /></div></div>
              <div><label className="text-[11px] text-gray-500 mb-1 block">Timezone</label><select value={wsTimezone} onChange={e => setWsTimezone(e.target.value)} className="w-full text-[12px] text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none"><option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option><option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option><option value="US/Pacific">US/Pacific (GMT-7)</option><option value="Europe/London">Europe/London (GMT+0)</option><option value="US/Eastern">US/Eastern (GMT-5)</option></select></div>

              {/* Language Switcher with i18n */}
              <div>
                <label className="text-[11px] text-gray-500 mb-2 block flex items-center gap-1.5"><Languages className="w-3.5 h-3.5" /> Ngôn ngữ giao diện</label>
                <div className="relative">
                  <button onClick={() => { setShowLangPicker(!showLangPicker); setLangSearch(""); }} className="w-full flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all text-left">
                    <span className="text-[20px]">{currentLang.flag}</span>
                    <div className="flex-1">
                      <p className="text-[13px] text-gray-800">{currentLang.nativeName}</p>
                      <p className="text-[10px] text-gray-400">{currentLang.name} · {currentLang.completion}% translated</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showLangPicker ? "rotate-180" : ""}`} />
                  </button>
                  {showLangPicker && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                      <div className="p-2 border-b border-gray-100">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                          <Globe className="w-3.5 h-3.5 text-gray-400" />
                          <input value={langSearch} onChange={e => setLangSearch(e.target.value)} placeholder="Search languages..." className="flex-1 text-[12px] bg-transparent focus:outline-none text-gray-700 placeholder-gray-400" autoFocus />
                        </div>
                      </div>
                      <div className="max-h-[240px] overflow-y-auto py-1">
                        {filteredLangs.map(lang => (
                          <button key={lang.id} onClick={() => { setWsLang(lang.id); setShowLangPicker(false); toast.success(`Ngôn ngữ đã chuyển sang ${lang.nativeName}`); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-all ${wsLang === lang.id ? "bg-cyan-50" : ""}`}>
                            <span className="text-[18px]">{lang.flag}</span>
                            <div className="flex-1">
                              <p className="text-[12px] text-gray-800">{lang.nativeName}</p>
                              <p className="text-[10px] text-gray-400">{lang.name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${lang.completion}%`, backgroundColor: lang.completion === 100 ? "#059669" : lang.completion >= 95 ? "#0891b2" : "#d97706" }} />
                              </div>
                              <span className="text-[9px] text-gray-400 w-7 text-right">{lang.completion}%</span>
                              {wsLang === lang.id && <Check className="w-4 h-4 text-cyan-600" />}
                            </div>
                          </button>
                        ))}
                        {filteredLangs.length === 0 && (
                          <div className="text-center py-4"><p className="text-[11px] text-gray-400">No languages found</p></div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* i18n Live Preview */}
              <div>
                <label className="text-[11px] text-gray-500 mb-2 block">Preview ({currentLang.nativeName})</label>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { icon: <LayoutDashboard className="w-3 h-3" />, key: "dashboard" },
                      { icon: <ListTodo className="w-3 h-3" />, key: "tasks" },
                      { icon: <MessageCircle className="w-3 h-3" />, key: "chat" },
                      { icon: <CalendarDays className="w-3 h-3" />, key: "calendar" },
                      { icon: <BarChart3 className="w-3 h-3" />, key: "reports" },
                    ].map(item => (
                      <span key={item.key} className="inline-flex items-center gap-1 text-[10px] text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-200">
                        {item.icon} {t[item.key]}
                      </span>
                    ))}
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div className="flex items-center gap-2">
                    <button className="text-[10px] text-white px-3 py-1.5 rounded-lg" style={{ backgroundColor: accentColor }}>{t.save}</button>
                    <button className="text-[10px] text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 bg-white">{t.cancel}</button>
                    <button className="text-[10px] text-red-500 px-3 py-1.5 rounded-lg border border-red-200 bg-white">{t.delete}</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-white rounded-lg p-2 border border-gray-200">
                      <span className="text-gray-400">{t.search}</span>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-gray-200 text-gray-600">
                      {t.welcome}, {profileName.split(" ")[0]}!
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-gray-400">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" />{t.completed}: 12</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" />{t.inProgress}: 8</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" />{t.overdue}: 3</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <button onClick={saveSettings} className="bg-cyan-500 text-white text-[12px] px-5 py-2 rounded-xl hover:bg-cyan-600 transition-all">Lưu thay đổi</button>
              </div>
            </div>
          </div>
        );

      case "profile":
        return (
          <div>
            <h3 className="text-[16px] text-gray-900 mb-1">Profile Settings</h3>
            <p className="text-[11px] text-gray-500 mb-5">Thông tin cá nhân của bạn</p>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-[28px] text-white">M</div>
              <div><button className="text-[11px] text-cyan-600 bg-cyan-50 px-3 py-1.5 rounded-lg border border-cyan-200 hover:bg-cyan-100 transition-all">Đổi ảnh đại diện</button><p className="text-[9px] text-gray-400 mt-1">PNG, JPG tối đa 2MB</p></div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] text-gray-500 mb-1 block">Họ tên</label><input value={profileName} onChange={e => setProfileName(e.target.value)} className="w-full text-[13px] text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-400" /></div>
                <div><label className="text-[11px] text-gray-500 mb-1 block">Email</label><input value={profileEmail} onChange={e => setProfileEmail(e.target.value)} className="w-full text-[13px] text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-400" /></div>
              </div>
              <div><label className="text-[11px] text-gray-500 mb-1 block">Chức danh</label><input value={profileTitle} onChange={e => setProfileTitle(e.target.value)} className="w-full text-[13px] text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-400" /></div>
              <div><label className="text-[11px] text-gray-500 mb-1 block">Bio</label><textarea value={profileBio} onChange={e => setProfileBio(e.target.value)} className="w-full text-[12px] text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 h-20 resize-none focus:outline-none focus:border-cyan-400" /></div>
              <div className="pt-3 border-t border-gray-100"><button onClick={saveSettings} className="bg-cyan-500 text-white text-[12px] px-5 py-2 rounded-xl hover:bg-cyan-600 transition-all">Lưu thay đổi</button></div>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div>
            <h3 className="text-[16px] text-gray-900 mb-1">Giao diện</h3>
            <p className="text-[11px] text-gray-500 mb-5">Theme, colors và layout</p>
            <div className="space-y-4">
              {[
                { label: "Dark Mode", desc: "Chế độ tối cho mắt", icon: darkMode ? <Moon className="w-4 h-4 text-indigo-500" /> : <Sun className="w-4 h-4 text-amber-500" />, checked: darkMode, toggle: () => setDarkMode(!darkMode) },
                { label: "Compact Mode", desc: "Hiển thị nhiều nội dung hơn", icon: <Monitor className="w-4 h-4 text-gray-500" />, checked: compactMode, toggle: () => setCompactMode(!compactMode) },
                { label: "Animations", desc: "Hiệu ứng chuyển động", icon: <Zap className="w-4 h-4 text-amber-500" />, checked: animEnabled, toggle: () => setAnimEnabled(!animEnabled) },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">{item.icon}<div><p className="text-[12px] text-gray-700">{item.label}</p><p className="text-[10px] text-gray-400">{item.desc}</p></div></div>
                  <Toggle checked={item.checked} onChange={item.toggle} />
                </div>
              ))}
              <div>
                <label className="text-[11px] text-gray-500 mb-2 block">Accent Color</label>
                <div className="flex items-center gap-2">
                  {["#0891b2", "#7c3aed", "#059669", "#dc2626", "#d97706", "#db2777", "#4f46e5", "#0ea5e9", "#f43f5e"].map(c => (
                    <button key={c} onClick={() => setAccentColor(c)} className={`w-8 h-8 rounded-xl border-2 hover:scale-110 transition-all ${accentColor === c ? "border-gray-800 scale-110" : "border-white shadow-sm"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              {/* Real-time Theme Preview */}
              <div>
                <label className="text-[11px] text-gray-500 mb-2 block">Theme Preview</label>
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  {/* Mini header */}
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px]" style={{ backgroundColor: accentColor }}>T</div>
                    <span className="text-[12px] text-gray-800">VWork</span>
                    <div className="flex-1" />
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center"><Bell className="w-3 h-3 text-gray-400" /></div>
                      <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center"><Settings className="w-3 h-3 text-gray-400" /></div>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px]" style={{ backgroundColor: accentColor }}>M</div>
                    </div>
                  </div>
                  {/* Mini content */}
                  <div className="flex">
                    {/* Mini sidebar */}
                    <div className="w-[100px] border-r border-gray-100 p-2 space-y-1">
                      {[t.dashboard, t.tasks, t.chat].map((label, i) => (
                        <div key={label} className={`text-[8px] px-2 py-1.5 rounded-lg truncate ${i === 0 ? "text-white" : "text-gray-500 bg-transparent"}`}
                          style={i === 0 ? { backgroundColor: accentColor } : {}}>
                          {label}
                        </div>
                      ))}
                    </div>
                    {/* Mini main area */}
                    <div className="flex-1 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] text-gray-800">{t.dashboard}</div>
                        <button className="text-[8px] text-white px-2 py-0.5 rounded-md" style={{ backgroundColor: accentColor }}>+ {t.newTask?.split(" ").slice(-1)[0] || "New"}</button>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { label: t.completed, val: "12", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                          { label: t.inProgress, val: "8", color: "bg-amber-50 text-amber-700 border-amber-200" },
                          { label: t.overdue, val: "3", color: "bg-red-50 text-red-700 border-red-200" },
                        ].map(card => (
                          <div key={card.label} className={`text-center p-1.5 rounded-lg border ${card.color}`}>
                            <div className="text-[12px]">{card.val}</div>
                            <div className="text-[7px] truncate">{card.label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {["Design System Update", "API Integration"].map((task, i) => (
                          <div key={task} className="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded-lg">
                            <div className="w-3 h-3 rounded border-2 flex items-center justify-center" style={{ borderColor: accentColor }}>
                              {i === 0 && <Check className="w-2 h-2" style={{ color: accentColor }} />}
                            </div>
                            <span className={`text-[8px] ${i === 0 ? "line-through text-gray-400" : "text-gray-700"}`}>{task}</span>
                            <div className="flex-1" />
                            <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[6px]" style={{ backgroundColor: accentColor }}>{i === 0 ? "M" : "A"}</div>
                          </div>
                        ))}
                      </div>
                      {/* Progress bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: "65%", backgroundColor: accentColor }} />
                        </div>
                        <span className="text-[8px] text-gray-400">65%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">Font Size</label>
                  <select value={fontSize} onChange={e => setFontSize(e.target.value)} className="w-full text-[12px] text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none">
                    <option value="small">Small</option><option value="default">Default</option><option value="large">Large</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">Sidebar Position</label>
                  <select value={sidebarPos} onChange={e => setSidebarPos(e.target.value)} className="w-full text-[12px] text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none">
                    <option value="left">Left</option><option value="right">Right</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div>
            <h3 className="text-[16px] text-gray-900 mb-1">Thông báo</h3>
            <p className="text-[11px] text-gray-500 mb-5">Quản lý cách nhận thông báo</p>
            <div className="space-y-3">
              {[
                { label: "Email notifications", desc: "Nhận thông báo qua email", checked: emailNotifs, toggle: () => setEmailNotifs(!emailNotifs), icon: <Mail className="w-4 h-4 text-gray-400" /> },
                { label: "Push notifications", desc: "Thông báo trên trình duyệt", checked: pushNotifs, toggle: () => setPushNotifs(!pushNotifs), icon: <Smartphone className="w-4 h-4 text-gray-400" /> },
                { label: "Mentions", desc: "Khi ai đó nhắc tên bạn", checked: mentionNotifs, toggle: () => setMentionNotifs(!mentionNotifs), icon: <AtSign className="w-4 h-4 text-gray-400" /> },
                { label: "Task updates", desc: "Khi task được cập nhật", checked: taskNotifs, toggle: () => setTaskNotifs(!taskNotifs), icon: <CheckCircle2 className="w-4 h-4 text-gray-400" /> },
                { label: "Deadline reminders", desc: "Nhắc nhở trước deadline", checked: deadlineNotifs, toggle: () => setDeadlineNotifs(!deadlineNotifs), icon: <Clock className="w-4 h-4 text-gray-400" /> },
                { label: "Comments", desc: "Khi có comment mới", checked: commentNotifs, toggle: () => setCommentNotifs(!commentNotifs), icon: <MessageSquare className="w-4 h-4 text-gray-400" /> },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">{item.icon}<div><p className="text-[12px] text-gray-700">{item.label}</p><p className="text-[10px] text-gray-400">{item.desc}</p></div></div>
                  <Toggle checked={item.checked} onChange={item.toggle} />
                </div>
              ))}
              <div className="border-t border-gray-100 pt-3 mt-3">
                <p className="text-[11px] text-gray-600 mb-2">Email Digest</p>
                <div className="flex items-center gap-2">
                  {["realtime", "daily", "weekly", "off"].map(f => (
                    <button key={f} onClick={() => setDigestFreq(f)}
                      className={`text-[10px] px-3 py-1.5 rounded-xl border transition-all capitalize ${digestFreq === f ? "bg-white border-cyan-300 text-cyan-700 shadow-sm" : "border-gray-200 text-gray-500"}`}>
                      {f === "realtime" ? "Real-time" : f === "off" ? "Tắt" : f === "daily" ? "Hàng ngày" : "Hàng tuần"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <div><p className="text-[11px] text-gray-600">Quiet Hours</p><p className="text-[9px] text-gray-400">Tắt thông báo trong khoảng thời gian</p></div>
                  <Toggle checked={quietHoursEnabled} onChange={() => setQuietHoursEnabled(!quietHoursEnabled)} />
                </div>
                {quietHoursEnabled && (
                  <div className="flex items-center gap-2 mt-2">
                    <input type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)} className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 focus:outline-none" />
                    <span className="text-[10px] text-gray-400">đến</span>
                    <input type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)} className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 focus:outline-none" />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div>
            <h3 className="text-[16px] text-gray-900 mb-1">Bảo mật</h3>
            <p className="text-[11px] text-gray-500 mb-5">Mật khẩu, 2FA và quản lý phiên</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3"><Shield className="w-4 h-4 text-emerald-500" /><div><p className="text-[12px] text-gray-700">Two-Factor Authentication</p><p className="text-[10px] text-gray-400">Bảo mật 2 lớp</p></div></div>
                <Toggle checked={twoFA} onChange={() => { setTwoFA(!twoFA); toast.success(twoFA ? "2FA đã tắt" : "2FA đã bật"); }} />
              </div>
              <button onClick={() => setShowPasswordModal(true)} className="w-full text-left p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all flex items-center gap-3">
                <Lock className="w-4 h-4 text-gray-400" /><div className="flex-1"><p className="text-[12px] text-gray-700">Đổi mật khẩu</p><p className="text-[10px] text-gray-400">Thay đổi lần cuối: 15/02/2026</p></div><ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
              <div className="bg-gray-50 rounded-xl p-3.5">
                <div className="flex items-center gap-3 mb-3"><Monitor className="w-4 h-4 text-gray-400" /><p className="text-[12px] text-gray-700">Active Sessions</p></div>
                <div className="space-y-2">
                  {[
                    { device: "MacBook Pro - Chrome", location: "Hà Nội, VN", time: "Hiện tại", active: true },
                    { device: "iPhone 15 - Safari", location: "Hà Nội, VN", time: "2 giờ trước", active: false },
                    { device: "Windows PC - Edge", location: "HCM, VN", time: "1 ngày trước", active: false },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${s.active ? "bg-emerald-500" : "bg-gray-300"}`} />
                      <div className="flex-1"><p className="text-[11px] text-gray-700">{s.device}</p><p className="text-[9px] text-gray-400">{s.location} · {s.time}</p></div>
                      {!s.active && <button onClick={() => toast.success("Session revoked")} className="text-[9px] text-red-500 hover:text-red-600">Revoke</button>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "integrations":
        return (
          <div>
            <h3 className="text-[16px] text-gray-900 mb-1">Tích hợp</h3>
            <p className="text-[11px] text-gray-500 mb-5">Kết nối với các dịch vụ bên ngoài</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {integrations.map(intg => (
                <div key={intg.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[14px]" style={{ backgroundColor: intg.color }}>{intg.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-[13px] text-gray-800">{intg.name}</p>
                        {intg.connected ? (
                          <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1"><Check className="w-2.5 h-2.5" /> Connected</span>
                        ) : (
                          <span className="text-[9px] text-gray-400">Not connected</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 mb-2">{intg.desc}</p>
                      <button onClick={() => toggleIntegration(intg.id)}
                        className={`text-[10px] px-3 py-1 rounded-lg border transition-all ${intg.connected ? "border-red-200 text-red-500 hover:bg-red-50" : "border-cyan-200 text-cyan-600 hover:bg-cyan-50"}`}>
                        {intg.connected ? "Disconnect" : "Connect"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "billing":
        return (
          <div>
            <h3 className="text-[16px] text-gray-900 mb-1">Billing & Subscription</h3>
            <p className="text-[11px] text-gray-500 mb-5">Quản lý gói dịch vụ và thanh toán</p>
            <div className="bg-gradient-to-r from-cyan-500 to-teal-500 rounded-2xl p-6 text-white mb-5 shadow-lg shadow-cyan-500/20">
              <div className="flex items-center justify-between mb-3"><span className="text-[14px]">Enterprise Plan</span><span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full">Active</span></div>
              <p className="text-[32px] tracking-tight">$49<span className="text-[14px] opacity-70">/month</span></p>
              <p className="text-[11px] opacity-70 mt-1">Gia hạn: 01/04/2026 · 6 seats used</p>
              <div className="flex items-center gap-2 mt-4">
                <button className="text-[11px] bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 backdrop-blur-sm transition-all">Nâng cấp</button>
                <button className="text-[11px] bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-all">Xem invoice</button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div className="flex-1"><p className="text-[12px] text-gray-700">Visa •••• 4242</p><p className="text-[10px] text-gray-400">Hết hạn 12/2027</p></div>
                <button className="text-[10px] text-cyan-600 hover:text-cyan-700">Thay đổi</button>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-[12px] text-gray-700 mb-2">Lịch sử thanh toán</p>
                {[
                  { date: "01/03/2026", amount: "$49.00", status: "Paid" },
                  { date: "01/02/2026", amount: "$49.00", status: "Paid" },
                  { date: "01/01/2026", amount: "$49.00", status: "Paid" },
                ].map((inv, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-[11px] text-gray-600">{inv.date}</span>
                    <span className="text-[11px] text-gray-700">{inv.amount}</span>
                    <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{inv.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "import_export":
        return (
          <div>
            <h3 className="text-[16px] text-gray-900 mb-1">Import / Export</h3>
            <p className="text-[11px] text-gray-500 mb-5">Nhập dữ liệu từ nền tảng khác hoặc xuất dữ liệu</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-2xl p-5">
                <Upload className="w-8 h-8 text-cyan-500 mb-3" />
                <h4 className="text-[14px] text-gray-800 mb-1">Import</h4>
                <p className="text-[10px] text-gray-500 mb-4">Nhập dữ liệu từ CSV, Jira, Trello, Asana hoặc Notion</p>
                <div className="space-y-2">
                  {["CSV / Excel", "Jira", "Trello", "Asana", "Notion"].map(s => (
                    <button key={s} onClick={() => toast.info(`Import từ ${s}`)} className="w-full text-left text-[11px] text-gray-600 p-2.5 bg-white rounded-lg border border-gray-200 hover:border-cyan-300 transition-all flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5 text-gray-400" /> {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-5">
                <Download className="w-8 h-8 text-emerald-500 mb-3" />
                <h4 className="text-[14px] text-gray-800 mb-1">Export</h4>
                <p className="text-[10px] text-gray-500 mb-4">Xuất dữ liệu workspace ra file</p>
                <div className="space-y-2">
                  {[
                    { format: "CSV", desc: "Tất cả tasks" },
                    { format: "JSON", desc: "Full data backup" },
                    { format: "PDF Report", desc: "Báo cáo tổng quan" },
                  ].map(s => (
                    <button key={s.format} onClick={() => toast.success(`Exporting ${s.format}...`)} className="w-full text-left text-[11px] text-gray-600 p-2.5 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 transition-all flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-gray-400" /> <div><span>{s.format}</span><p className="text-[9px] text-gray-400">{s.desc}</p></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "api":
        return (
          <div>
            <h3 className="text-[16px] text-gray-900 mb-1">API & Webhooks</h3>
            <p className="text-[11px] text-gray-500 mb-5">API keys và webhook endpoints</p>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2"><p className="text-[12px] text-gray-700">API Key</p><button onClick={() => { copyToClipboard("tfp_sk_abc123xyz456").then(() => toast.success("API key copied!")); }} className="text-[10px] text-cyan-600 hover:text-cyan-700 flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</button></div>
                <div className="flex items-center gap-2">
                  <input type={showApiKey ? "text" : "password"} value="tfp_sk_abc123xyz456def789" readOnly className="flex-1 text-[11px] text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 font-mono" />
                  <button onClick={() => setShowApiKey(!showApiKey)} className="w-8 h-8 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-400">
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[9px] text-gray-400 mt-1.5">Tạo: 01/01/2026 · Sử dụng lần cuối: 2 giờ trước</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-[12px] text-gray-700 mb-3">Webhooks</p>
                <div className="space-y-2">
                  {[
                    { url: "https://hooks.slack.com/xxx", events: "task.created, task.updated", active: true },
                    { url: "https://api.company.com/webhook", events: "sprint.completed", active: true },
                  ].map((wh, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-gray-200">
                      <div className={`w-2 h-2 rounded-full ${wh.active ? "bg-emerald-500" : "bg-gray-300"}`} />
                      <div className="flex-1 min-w-0"><p className="text-[11px] text-gray-700 truncate font-mono">{wh.url}</p><p className="text-[9px] text-gray-400">{wh.events}</p></div>
                      <button className="text-[9px] text-red-500 hover:text-red-600">Delete</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => toast.info("Thêm webhook")} className="mt-2 text-[10px] text-cyan-600 hover:text-cyan-700 flex items-center gap-1"><Webhook className="w-3 h-3" /> Thêm webhook</button>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-[12px] text-gray-700 mb-1">API Documentation</p>
                <p className="text-[10px] text-gray-400 mb-2">Xem tài liệu API đầy đủ</p>
                <button className="text-[10px] text-cyan-600 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> docs.vwork.app/api</button>
              </div>
            </div>
          </div>
        );

      case "shortcuts":
        return (
          <div>
            <h3 className="text-[16px] text-gray-900 mb-1">Keyboard Shortcuts</h3>
            <p className="text-[11px] text-gray-500 mb-5">Tất cả phím tắt để thao tác nhanh hơn</p>
            {[
              { title: "General", shortcuts: [
                { keys: ["⌘", "K"], desc: "Command Palette" },
                { keys: ["⌘", "B"], desc: "Toggle Sidebar" },
                { keys: ["⌘", "/"], desc: "Show Shortcuts" },
                { keys: ["Esc"], desc: "Close modal / Cancel" },
              ]},
              { title: "G-key Navigation (nhấn G rồi phím tiếp)", shortcuts: [
                { keys: ["G", "H"], desc: "Go to Home / Dashboard" },
                { keys: ["G", "I"], desc: "Go to Inbox" },
                { keys: ["G", "C"], desc: "Go to Chat" },
                { keys: ["G", "S"], desc: "Go to Settings" },
                { keys: ["G", "T"], desc: "Go to Team" },
                { keys: ["G", "L"], desc: "Go to List View" },
                { keys: ["G", "B"], desc: "Go to Board View" },
                { keys: ["G", "D"], desc: "Go to Docs" },
                { keys: ["G", "A"], desc: "Go to Activity" },
                { keys: ["G", "G"], desc: "Go to Goals" },
              ]},
              { title: "Tasks", shortcuts: [
                { keys: ["N"], desc: "New Task" },
                { keys: ["⌘", "Enter"], desc: "Save & Close task" },
                { keys: ["⌘", "D"], desc: "Duplicate task" },
                { keys: ["Del"], desc: "Delete selected" },
              ]},
              { title: "Chat", shortcuts: [
                { keys: ["Enter"], desc: "Send message" },
                { keys: ["Shift", "Enter"], desc: "New line" },
                { keys: ["⌘", "E"], desc: "Toggle emoji picker" },
                { keys: ["⌘", "U"], desc: "Upload file" },
              ]},
              { title: "Whiteboard", shortcuts: [
                { keys: ["V"], desc: "Select tool" },
                { keys: ["H"], desc: "Pan / Hand tool" },
                { keys: ["R"], desc: "Rectangle" },
                { keys: ["O"], desc: "Circle / Oval" },
                { keys: ["L"], desc: "Line" },
                { keys: ["P"], desc: "Pen / Draw" },
                { keys: ["T"], desc: "Text" },
                { keys: ["N"], desc: "Sticky Note" },
                { keys: ["⌘", "Z"], desc: "Undo" },
                { keys: ["⌘", "⇧", "Z"], desc: "Redo" },
              ]},
            ].map(group => (
              <div key={group.title} className="mb-5">
                <p className="text-[12px] text-gray-700 mb-2">{group.title}</p>
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  {group.shortcuts.map((sc, i) => (
                    <div key={i} className={`flex items-center justify-between px-4 py-2.5 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                      <span className="text-[11px] text-gray-600">{sc.desc}</span>
                      <div className="flex items-center gap-1">
                        {sc.keys.map((k, j) => (
                          <span key={j}>
                            <kbd className="inline-block min-w-[24px] text-center text-[10px] text-gray-600 bg-white border border-gray-200 rounded-md px-1.5 py-0.5 shadow-sm">{k}</kbd>
                            {j < sc.keys.length - 1 && <span className="text-[9px] text-gray-300 mx-0.5">+</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case "about":
        return (
          <div>
            <h3 className="text-[16px] text-gray-900 mb-1">About VWork</h3>
            <p className="text-[11px] text-gray-500 mb-5">Thông tin ứng dụng và hệ thống</p>
            <div className="bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl p-6 text-white mb-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[18px]">VWork</p>
                  <p className="text-[11px] opacity-70">Project Management Platform</p>
                </div>
              </div>
              <p className="text-[11px] opacity-80">The world-class project management platform with Conversational UI, 20+ views, and real-time collaboration.</p>
            </div>
            <div className="space-y-3">
              {[
                { label: "Version", value: "2.5.0 (Build 20260317)" },
                { label: "Environment", value: "Production" },
                { label: "API Version", value: "v3.1" },
                { label: "Uptime", value: "99.97% (last 30 days)" },
                { label: "License", value: "Enterprise - 50 seats" },
                { label: "Data Region", value: "Asia Pacific (Singapore)" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-[11px] text-gray-500">{item.label}</span>
                  <span className="text-[11px] text-gray-700">{item.value}</span>
                </div>
              ))}
            </div>
            {/* Storage Usage */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-[11px] text-gray-600 mb-3 flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-gray-400" /> Storage Usage</p>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between text-[10px] text-gray-500 mb-2">
                  <span>12.4 GB / 50 GB used</span>
                  <span>24.8%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex">
                  <div className="h-full bg-cyan-500 rounded-l-full" style={{ width: "14%" }} title="Documents: 7 GB" />
                  <div className="h-full bg-violet-500" style={{ width: "5%" }} title="Attachments: 2.5 GB" />
                  <div className="h-full bg-amber-500" style={{ width: "3.5%" }} title="Media: 1.8 GB" />
                  <div className="h-full bg-emerald-500 rounded-r-full" style={{ width: "2.3%" }} title="Other: 1.1 GB" />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  {[{ l: "Documents", c: "bg-cyan-500", v: "7 GB" }, { l: "Attachments", c: "bg-violet-500", v: "2.5 GB" }, { l: "Media", c: "bg-amber-500", v: "1.8 GB" }, { l: "Other", c: "bg-emerald-500", v: "1.1 GB" }].map(s => (
                    <span key={s.l} className="flex items-center gap-1 text-[8px] text-gray-400"><div className={`w-2 h-2 rounded-sm ${s.c}`} />{s.l}: {s.v}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <button onClick={() => toast.success("Checking for updates...")} className="text-[10px] text-cyan-600 bg-cyan-50 px-3 py-1.5 rounded-lg border border-cyan-200 hover:bg-cyan-100 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Check for updates</button>
                <button onClick={() => toast.info("Opening changelog...")} className="text-[10px] text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 flex items-center gap-1"><FileText className="w-3 h-3" /> Changelog</button>
                <button onClick={() => toast.info("Opening docs...")} className="text-[10px] text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Documentation</button>
              </div>
              <p className="text-[9px] text-gray-400">Made with care. &copy; 2026 VWork Inc.</p>
            </div>
          </div>
        );

      case "danger":
        return (
          <div>
            <h3 className="text-[16px] text-red-600 mb-1">Danger Zone</h3>
            <p className="text-[11px] text-gray-500 mb-5">Các thao tác không thể hoàn tác</p>
            <div className="space-y-3">
              <div className="border border-red-200 rounded-xl p-4 bg-red-50/50">
                <div className="flex items-center justify-between">
                  <div><p className="text-[12px] text-gray-800">Transfer ownership</p><p className="text-[10px] text-gray-500">Chuyển quyền sở hữu workspace</p></div>
                  <button onClick={() => toast.info("Transfer ownership")} className="text-[10px] text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all">Transfer</button>
                </div>
              </div>
              <div className="border border-red-200 rounded-xl p-4 bg-red-50/50">
                <div className="flex items-center justify-between">
                  <div><p className="text-[12px] text-gray-800">Archive workspace</p><p className="text-[10px] text-gray-500">Ẩn workspace và tất cả dữ liệu</p></div>
                  <button onClick={() => toast.info("Archive workspace")} className="text-[10px] text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all">Archive</button>
                </div>
              </div>
              <div className="border border-red-300 rounded-xl p-4 bg-red-50">
                <div className="flex items-center justify-between">
                  <div><p className="text-[12px] text-red-700">Delete workspace</p><p className="text-[10px] text-red-500">Xoá vĩnh viễn tất cả dữ liệu</p></div>
                  <button onClick={() => toast.error("Workspace will be deleted!")} className="text-[10px] text-white bg-red-500 px-3 py-1.5 rounded-lg hover:bg-red-600 transition-all">Delete</button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50">
      <div className="flex h-full">
        {/* Sidebar nav */}
        <div className="w-[220px] border-r border-gray-200 bg-white p-4 shrink-0 overflow-auto">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center"><Settings className="w-4 h-4 text-gray-600" /></div>
            <div><p className="text-[13px] text-gray-800">Settings</p><p className="text-[9px] text-gray-400">Cài đặt workspace</p></div>
          </div>
          <div className="space-y-0.5">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] rounded-xl transition-all ${activeSection === item.id ? "bg-gray-100 text-gray-800" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"} ${item.id === "danger" ? "mt-4 !text-red-500 hover:!bg-red-50" : ""}`}>
                <span className={activeSection === item.id ? "text-gray-700" : "text-gray-400"}>{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && <span className="text-[8px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{item.badge}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-2xl">
            {renderSection()}
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center" onClick={() => { setShowPasswordModal(false); setPwErrors([]); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPwStrength(0); }}>
          <div className="bg-white rounded-2xl w-[440px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <h3 className="text-[15px] text-gray-900">Đổi mật khẩu</h3>
                  <p className="text-[10px] text-gray-400">Cập nhật mật khẩu bảo mật</p>
                </div>
              </div>
              <button onClick={() => { setShowPasswordModal(false); setPwErrors([]); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPwStrength(0); }} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Error messages */}
              {pwErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  {pwErrors.map((err, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-red-600 py-0.5">
                      <CircleAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Current password */}
              <div>
                <label className="text-[11px] text-gray-500 mb-1.5 block">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input type={showCurrentPw ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Nhập mật khẩu hiện tại" className="w-full text-[13px] text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:border-cyan-400 transition-all" />
                  <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="text-[11px] text-gray-500 mb-1.5 block">Mật khẩu mới</label>
                <div className="relative">
                  <input type={showNewPw ? "text" : "password"} value={newPassword} onChange={e => handleNewPasswordChange(e.target.value)} placeholder="Tối thiểu 8 ký tự" className="w-full text-[13px] text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:border-cyan-400 transition-all" />
                  <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength meter */}
                {newPassword.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map(level => (
                        <div key={level} className={`flex-1 h-1.5 rounded-full transition-all ${level <= pwStrength ? pwStrengthColor[pwStrength] : "bg-gray-200"}`} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] ${pwStrength <= 2 ? "text-red-500" : pwStrength <= 3 ? "text-amber-500" : "text-emerald-600"}`}>{pwStrengthLabel[pwStrength]}</span>
                      <div className="flex items-center gap-2 text-[9px] text-gray-400">
                        <span className={newPassword.length >= 8 ? "text-emerald-500" : ""}>8+ ký tự</span>
                        <span className={/[A-Z]/.test(newPassword) ? "text-emerald-500" : ""}>A-Z</span>
                        <span className={/[0-9]/.test(newPassword) ? "text-emerald-500" : ""}>0-9</span>
                        <span className={/[^A-Za-z0-9]/.test(newPassword) ? "text-emerald-500" : ""}>!@#</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="text-[11px] text-gray-500 mb-1.5 block">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <input type={showConfirmPw ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu mới" className={`w-full text-[13px] text-gray-700 border rounded-xl px-3 py-2.5 pr-10 focus:outline-none transition-all ${confirmPassword.length > 0 && confirmPassword !== newPassword ? "border-red-300 focus:border-red-400" : confirmPassword.length > 0 && confirmPassword === newPassword ? "border-emerald-300 focus:border-emerald-400" : "border-gray-200 focus:border-cyan-400"}`} />
                  <button onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    {confirmPassword === newPassword ? (
                      <><ShieldCheck className="w-3 h-3 text-emerald-500" /><span className="text-[10px] text-emerald-500">Mật khẩu khớp</span></>
                    ) : (
                      <><CircleAlert className="w-3 h-3 text-red-400" /><span className="text-[10px] text-red-400">Mật khẩu không khớp</span></>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-5 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button onClick={() => { setShowPasswordModal(false); setPwErrors([]); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPwStrength(0); }} className="text-[12px] text-gray-500 px-4 py-2 rounded-xl hover:bg-gray-100 transition-all">Hủy</button>
              <button onClick={handlePasswordSubmit} disabled={pwChanging} className="text-[12px] text-white px-5 py-2 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50" style={{ backgroundColor: accentColor }}>
                {pwChanging ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang xử lý...</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /> Đổi mật khẩu</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}