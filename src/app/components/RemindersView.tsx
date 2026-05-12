import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Bell, Plus, Search, Check, X, Clock, Calendar, Trash2,
  MoreHorizontal, Copy, Edit3, AlertCircle, ChevronDown,
  Flag, Repeat, MapPin, Tag, Star, CheckCircle2, Circle,
  Filter, ArrowUpDown, BellOff, BellRing
} from "lucide-react";

interface Reminder {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  priority: "high" | "medium" | "low";
  recurring?: "daily" | "weekly" | "monthly" | null;
  completed: boolean;
  category: string;
}

const priorityConfig = {
  high: { color: "#dc2626", bg: "#fef2f2", label: "High" },
  medium: { color: "#d97706", bg: "#fefce8", label: "Medium" },
  low: { color: "#059669", bg: "#ecfdf5", label: "Low" },
};

const categories = ["Work", "Personal", "Meeting", "Deadline", "Follow-up", "Health"];

const initialReminders: Reminder[] = [
  { id: "r1", title: "Sprint 12 Review", description: "Prepare demo for stakeholders", date: "2026-03-17", time: "15:00", priority: "high", recurring: null, completed: false, category: "Meeting" },
  { id: "r2", title: "Submit timesheet", date: "2026-03-17", time: "17:00", priority: "medium", recurring: "weekly", completed: false, category: "Work" },
  { id: "r3", title: "Code review PR #158", date: "2026-03-17", time: "14:00", priority: "high", completed: true, category: "Work" },
  { id: "r4", title: "Deploy staging environment", description: "After QA approval", date: "2026-03-18", time: "09:00", priority: "high", recurring: null, completed: false, category: "Deadline" },
  { id: "r5", title: "1-on-1 with Team Lead", date: "2026-03-18", time: "10:30", priority: "medium", recurring: "weekly", completed: false, category: "Meeting" },
  { id: "r6", title: "Design review session", date: "2026-03-18", time: "14:00", priority: "medium", completed: false, category: "Meeting" },
  { id: "r7", title: "Update documentation", date: "2026-03-19", time: "11:00", priority: "low", completed: false, category: "Work" },
  { id: "r8", title: "Security audit report", description: "Quarterly security review", date: "2026-03-20", time: "09:00", priority: "high", completed: false, category: "Deadline" },
  { id: "r9", title: "Gym session", date: "2026-03-17", time: "18:30", priority: "low", recurring: "daily", completed: false, category: "Health" },
  { id: "r10", title: "Follow up client email", date: "2026-03-17", time: "11:00", priority: "medium", completed: true, category: "Follow-up" },
  { id: "r11", title: "Database backup", date: "2026-03-19", time: "02:00", priority: "high", recurring: "weekly", completed: false, category: "Work" },
  { id: "r12", title: "Team retrospective", date: "2026-03-21", time: "16:00", priority: "medium", completed: false, category: "Meeting" },
];

type FilterPriority = "all" | "high" | "medium" | "low";
type FilterTime = "all" | "today" | "upcoming" | "overdue";

export function RemindersView() {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [searchQ, setSearchQ] = useState("");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [filterTime, setFilterTime] = useState<FilterTime>("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showCompleted, setShowCompleted] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<string | null>(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [quickAdd, setQuickAdd] = useState("");

  // Add form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("2026-03-18");
  const [newTime, setNewTime] = useState("09:00");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [newRecurring, setNewRecurring] = useState<string>("none");
  const [newCategory, setNewCategory] = useState("Work");

  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    return reminders.filter(r => {
      if (!showCompleted && r.completed) return false;
      const matchSearch = !searchQ || r.title.toLowerCase().includes(searchQ.toLowerCase());
      const matchPriority = filterPriority === "all" || r.priority === filterPriority;
      const matchCategory = filterCategory === "all" || r.category === filterCategory;
      let matchTime = true;
      if (filterTime === "today") matchTime = r.date === today;
      else if (filterTime === "upcoming") matchTime = r.date > today;
      else if (filterTime === "overdue") matchTime = r.date < today && !r.completed;
      return matchSearch && matchPriority && matchCategory && matchTime;
    }).sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`);
    });
  }, [reminders, searchQ, filterPriority, filterTime, filterCategory, showCompleted]);

  const grouped = useMemo(() => {
    const map = new Map<string, Reminder[]>();
    filtered.forEach(r => {
      const label = r.date === today ? "Hôm nay" : r.date === "2026-03-18" ? "Ngày mai" : r.date < today ? "Quá hạn" : new Date(r.date).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "short" });
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(r);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const todayCount = reminders.filter(r => r.date === today && !r.completed).length;
  const overdueCount = reminders.filter(r => r.date < today && !r.completed).length;
  const completedToday = reminders.filter(r => r.date === today && r.completed).length;

  const toggleComplete = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
    const r = reminders.find(rr => rr.id === id);
    toast.success(r?.completed ? "Marked as incomplete" : "Completed!");
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    setCtxMenu(null);
    toast.success("Reminder deleted");
  };

  const addReminder = () => {
    if (!newTitle.trim()) return;
    const reminder: Reminder = {
      id: `r_${Date.now()}`, title: newTitle, description: newDesc || undefined, date: newDate, time: newTime,
      priority: newPriority, recurring: newRecurring !== "none" ? newRecurring as any : null,
      completed: false, category: newCategory,
    };
    setReminders(prev => [reminder, ...prev]);
    setShowAddModal(false);
    setNewTitle(""); setNewDesc("");
    toast.success("Reminder created");
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50 p-6" onClick={() => setCtxMenu(null)}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-md shadow-red-500/20">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-gray-900 tracking-tight">Reminders</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">{todayCount} hôm nay{overdueCount > 0 ? ` · ${overdueCount} quá hạn` : ""}</p>
            </div>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-[11px] px-4 py-2 rounded-xl hover:from-cyan-600 hover:to-teal-600 shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Add Reminder
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm text-center">
            <p className="text-[20px] text-gray-800">{todayCount}</p>
            <p className="text-[9px] text-gray-400">Today</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm text-center">
            <p className="text-[20px] text-emerald-600">{completedToday}</p>
            <p className="text-[9px] text-gray-400">Done</p>
          </div>
          <div className={`rounded-xl border p-3 shadow-sm text-center ${overdueCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
            <p className={`text-[20px] ${overdueCount > 0 ? "text-red-600" : "text-gray-800"}`}>{overdueCount}</p>
            <p className="text-[9px] text-gray-400">Overdue</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm text-center">
            <p className="text-[20px] text-gray-800">{reminders.filter(r => r.recurring).length}</p>
            <p className="text-[9px] text-gray-400">Recurring</p>
          </div>
        </div>

        {/* Quick Add */}
        <div className="bg-white rounded-xl border border-gray-200 p-2.5 mb-4 shadow-sm flex items-center gap-2">
          <Plus className="w-4 h-4 text-gray-300 shrink-0" />
          <input value={quickAdd} onChange={e => setQuickAdd(e.target.value)} placeholder="Quick add reminder... (Enter to add)"
            onKeyDown={e => {
              if (e.key === "Enter" && quickAdd.trim()) {
                const r: Reminder = { id: `r_${Date.now()}`, title: quickAdd.trim(), date: today, time: "17:00", priority: "medium", completed: false, category: "Work" };
                setReminders(prev => [r, ...prev]);
                setQuickAdd("");
                toast.success("Reminder added for today");
              }
            }}
            className="flex-1 text-[12px] text-gray-700 focus:outline-none bg-transparent" />
          {quickAdd && <span className="text-[9px] text-gray-400 shrink-0">Today 17:00</span>}
        </div>

        {/* Completion Ring */}
        {(() => {
          const total = reminders.filter(r => r.date === today).length;
          const done = reminders.filter(r => r.date === today && r.completed).length;
          const pct = total > 0 ? (done / total) * 100 : 0;
          if (total === 0) return null;
          return (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm flex items-center gap-4">
              <div className="relative w-12 h-12 shrink-0">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="18" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                  <circle cx="24" cy="24" r="18" fill="none" stroke={pct >= 100 ? "#059669" : "#0891b2"} strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 18}`} strokeDashoffset={`${2 * Math.PI * 18 * (1 - pct / 100)}`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-700">{Math.round(pct)}%</span>
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-gray-700">Today's Progress</p>
                <p className="text-[10px] text-gray-400">{done}/{total} completed</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {reminders.filter(r => r.date === today).map(r => (
                    <div key={r.id} className={`w-2.5 h-2.5 rounded-full transition-all ${r.completed ? "bg-emerald-500" : "bg-gray-200"}`}
                      title={r.title} />
                  ))}
                </div>
              </div>
              {pct >= 100 && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">All done!</span>}
            </div>
          );
        })()}

        {/* Overdue Alert Banner */}
        {overdueCount > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-3.5 mb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-red-700">{overdueCount} reminder{overdueCount > 1 ? "s" : ""} quá hạn!</p>
              <p className="text-[10px] text-red-500 mt-0.5">
                {reminders.filter(r => r.date < today && !r.completed).slice(0, 3).map(r => r.title).join(", ")}
                {overdueCount > 3 ? ` và ${overdueCount - 3} khác...` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => {
                const overdueIds = reminders.filter(r => r.date < today && !r.completed).map(r => r.id);
                setReminders(prev => prev.map(r => overdueIds.includes(r.id) ? { ...r, date: today } : r));
                toast.success(`${overdueIds.length} reminders rescheduled to today`);
              }} className="text-[10px] text-orange-600 bg-orange-100 hover:bg-orange-200 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1">
                <Clock className="w-3 h-3" /> Reschedule
              </button>
              <button onClick={() => {
                const overdueIds = reminders.filter(r => r.date < today && !r.completed).map(r => r.id);
                setReminders(prev => prev.map(r => overdueIds.includes(r.id) ? { ...r, completed: true } : r));
                toast.success(`${overdueIds.length} reminders marked done`);
              }} className="text-[10px] text-emerald-600 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1">
                <Check className="w-3 h-3" /> Done All
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm reminders..."
              className="w-full pl-9 pr-3 py-2 text-[11px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-cyan-300 text-gray-700" />
          </div>
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-0.5">
            {(["all", "today", "upcoming", "overdue"] as const).map(f => (
              <button key={f} onClick={() => setFilterTime(f)}
                className={`px-2 py-1.5 text-[10px] rounded-lg capitalize transition-all ${filterTime === f ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>
                {f === "all" ? "All" : f === "today" ? "Nay" : f === "upcoming" ? "Sắp tới" : "Quá hạn"}
              </button>
            ))}
          </div>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as FilterPriority)}
            className="text-[10px] bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-gray-600 focus:outline-none">
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="text-[10px] bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-gray-600 focus:outline-none">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => setShowCompleted(!showCompleted)}
            className={`text-[10px] px-2.5 py-2 rounded-xl border transition-all ${showCompleted ? "border-gray-200 text-gray-500" : "border-cyan-300 bg-cyan-50 text-cyan-600"}`}>
            {showCompleted ? "Hide Done" : "Show Done"}
          </button>
        </div>

        {/* Reminder groups */}
        <div className="space-y-4">
          {grouped.map(([label, items]) => (
            <div key={label}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[11px] ${label === "Quá hạn" ? "text-red-500" : "text-gray-600"}`}>{label}</span>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] text-gray-400">{items.length}</span>
              </div>
              <div className="space-y-1.5">
                {items.map(reminder => {
                  const pc = priorityConfig[reminder.priority];
                  const isOverdue = reminder.date < today && !reminder.completed;
                  return (
                    <div key={reminder.id}
                      className={`bg-white rounded-xl border p-3.5 flex items-start gap-3 group transition-all hover:shadow-sm ${reminder.completed ? "opacity-60 border-gray-100" : isOverdue ? "border-red-200 bg-red-50/30" : "border-gray-200"}`}>
                      <button onClick={() => toggleComplete(reminder.id)}
                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${reminder.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-300 hover:border-gray-400"}`}>
                        {reminder.completed && <Check className="w-3 h-3" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[12px] ${reminder.completed ? "line-through text-gray-400" : "text-gray-800"}`}>{reminder.title}</p>
                        {reminder.description && <p className="text-[10px] text-gray-400 mt-0.5">{reminder.description}</p>}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[9px] text-gray-400 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {reminder.time}</span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: pc.bg, color: pc.color }}>{pc.label}</span>
                          <span className="text-[8px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{reminder.category}</span>
                          {reminder.recurring && (
                            <span className="text-[8px] text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Repeat className="w-2 h-2" /> {reminder.recurring}</span>
                          )}
                          {isOverdue && <span className="text-[8px] text-red-500 flex items-center gap-0.5"><AlertCircle className="w-2.5 h-2.5" /> Quá hạn</span>}
                        </div>
                      </div>
                      <div className="relative">
                        <button onClick={e => { e.stopPropagation(); setCtxMenu(ctxMenu === reminder.id ? null : reminder.id); }}
                          className="w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                        {ctxMenu === reminder.id && (
                          <div className="absolute right-0 top-full mt-1 w-[160px] bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { setEditingReminder(reminder); setCtxMenu(null); }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50"><Edit3 className="w-3 h-3" /> Edit</button>
                            <button onClick={() => {
                              const clone: Reminder = { ...reminder, id: `r_${Date.now()}`, title: `${reminder.title} (Copy)` };
                              setReminders(prev => [clone, ...prev]); setCtxMenu(null); toast.success("Duplicated");
                            }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50"><Copy className="w-3 h-3" /> Duplicate</button>
                            <div className="h-px bg-gray-100 my-0.5" />
                            <p className="px-3 py-1 text-[8px] text-gray-400 uppercase tracking-wider">Snooze</p>
                            {[
                              { label: "+1 giờ", addDays: 0, addHours: 1 },
                              { label: "+3 giờ", addDays: 0, addHours: 3 },
                              { label: "Ngày mai", addDays: 1, addHours: 0 },
                              { label: "Tuần sau", addDays: 7, addHours: 0 },
                            ].map(s => (
                              <button key={s.label} onClick={() => {
                                const d = new Date(`${reminder.date}T${reminder.time}`);
                                d.setDate(d.getDate() + s.addDays);
                                d.setHours(d.getHours() + s.addHours);
                                setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, date: d.toISOString().slice(0, 10), time: d.toTimeString().slice(0, 5) } : r));
                                setCtxMenu(null); toast.success(`Snoozed ${s.label}`);
                              }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-500 hover:bg-gray-50">
                                <Clock className="w-3 h-3" /> {s.label}
                              </button>
                            ))}
                            <div className="h-px bg-gray-100 my-0.5" />
                            <button onClick={() => deleteReminder(reminder.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-500 hover:bg-red-50"><Trash2 className="w-3 h-3" /> Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <BellOff className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-[13px] text-gray-500">Không có reminders nào</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2"><BellRing className="w-4 h-4 text-red-500" /><h3 className="text-[15px] text-gray-800">New Reminder</h3></div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-[10px] text-gray-500 mb-1 block">Title *</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Remind me to..." autoFocus
                  className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-400 text-gray-700" /></div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Description</label>
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Details (optional)"
                  className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-400 text-gray-700" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-gray-500 mb-1 block">Date</label>
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none text-gray-700" /></div>
                <div><label className="text-[10px] text-gray-500 mb-1 block">Time</label>
                  <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none text-gray-700" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-[10px] text-gray-500 mb-1 block">Priority</label>
                  <select value={newPriority} onChange={e => setNewPriority(e.target.value as any)} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none text-gray-700">
                    <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                  </select></div>
                <div><label className="text-[10px] text-gray-500 mb-1 block">Repeat</label>
                  <select value={newRecurring} onChange={e => setNewRecurring(e.target.value)} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none text-gray-700">
                    <option value="none">None</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                  </select></div>
                <div><label className="text-[10px] text-gray-500 mb-1 block">Category</label>
                  <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none text-gray-700">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowAddModal(false)} className="text-[12px] text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Cancel</button>
              <button onClick={addReminder} disabled={!newTitle.trim()}
                className="text-[12px] bg-cyan-500 text-white px-4 py-1.5 rounded-lg hover:bg-cyan-600 disabled:opacity-40">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingReminder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditingReminder(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2"><Edit3 className="w-4 h-4 text-cyan-500" /><h3 className="text-[15px] text-gray-800">Edit Reminder</h3></div>
              <button onClick={() => setEditingReminder(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-[10px] text-gray-500 mb-1 block">Title</label>
                <input value={editingReminder.title} onChange={e => setEditingReminder({ ...editingReminder, title: e.target.value })}
                  className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-400 text-gray-700" /></div>
              <div><label className="text-[10px] text-gray-500 mb-1 block">Description</label>
                <input value={editingReminder.description || ""} onChange={e => setEditingReminder({ ...editingReminder, description: e.target.value })}
                  className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-400 text-gray-700" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-gray-500 mb-1 block">Date</label>
                  <input type="date" value={editingReminder.date} onChange={e => setEditingReminder({ ...editingReminder, date: e.target.value })}
                    className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none text-gray-700" /></div>
                <div><label className="text-[10px] text-gray-500 mb-1 block">Time</label>
                  <input type="time" value={editingReminder.time} onChange={e => setEditingReminder({ ...editingReminder, time: e.target.value })}
                    className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none text-gray-700" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-[10px] text-gray-500 mb-1 block">Priority</label>
                  <select value={editingReminder.priority} onChange={e => setEditingReminder({ ...editingReminder, priority: e.target.value as any })}
                    className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none text-gray-700">
                    <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                  </select></div>
                <div><label className="text-[10px] text-gray-500 mb-1 block">Repeat</label>
                  <select value={editingReminder.recurring || "none"} onChange={e => setEditingReminder({ ...editingReminder, recurring: e.target.value === "none" ? null : e.target.value as any })}
                    className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none text-gray-700">
                    <option value="none">None</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                  </select></div>
                <div><label className="text-[10px] text-gray-500 mb-1 block">Category</label>
                  <select value={editingReminder.category} onChange={e => setEditingReminder({ ...editingReminder, category: e.target.value })}
                    className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none text-gray-700">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setEditingReminder(null)} className="text-[12px] text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">Cancel</button>
              <button onClick={() => {
                setReminders(prev => prev.map(r => r.id === editingReminder.id ? editingReminder : r));
                setEditingReminder(null); toast.success("Reminder updated");
              }} className="text-[12px] bg-cyan-500 text-white px-4 py-1.5 rounded-lg hover:bg-cyan-600">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}