import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Clock, ChevronDown, Search, SlidersHorizontal, User, CalendarDays, ExternalLink, CheckSquare2, BookOpen, Bug, Zap, GitBranch, Timer, CalendarX2, ArrowDownUp, GripVertical } from "lucide-react";
import { type Task, statusConfig, priorityConfig, teamMembers, taskTypeConfig, sprints } from "./data";

function TaskTypeIcon({ task, size = 10 }: { task: Task; size?: number }) {
  const cls = `shrink-0 opacity-70`;
  const s = { width: size, height: size };
  switch (task.type) {
    case "bug":   return <Bug style={s} className={cls} />;
    case "story": return <BookOpen style={s} className={cls} />;
    case "epic":  return <Zap style={s} className={cls} />;
    default:      return task.parentId
      ? <GitBranch style={s} className={cls} />
      : <CheckSquare2 style={s} className={cls} />;
  }
}

function InlineCreateForm({ pos, dateStr, title, type, showTypePicker, onTitleChange, onTypeChange, onToggleTypePicker, onSubmit, onClose }: {
  pos: { x: number; y: number };
  dateStr: string;
  title: string;
  type: Task["type"];
  showTypePicker: boolean;
  onTitleChange: (v: string) => void;
  onTypeChange: (t: Task["type"]) => void;
  onToggleTypePicker: () => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cfg = taskTypeConfig[type || "task"];

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const fmt = new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "short" });

  return (
    <div ref={ref} style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: 1000, width: 280 }}
      className="bg-white rounded-xl border border-gray-200 shadow-2xl">
      <div className="px-3 pt-3 pb-1 text-[10px] text-gray-400 font-medium">{fmt}</div>
      <div className="px-3 pb-2">
        <input
          ref={inputRef}
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && title.trim()) onSubmit(); if (e.key === "Escape") onClose(); }}
          placeholder="Tên công việc..."
          className="w-full text-[13px] text-gray-800 placeholder-gray-300 outline-none border-b border-gray-100 pb-2 mb-3"
        />
        <div className="flex items-center gap-2">
          {/* Type picker */}
          <div className="relative">
            <button onClick={e => { e.stopPropagation(); onToggleTypePicker(); }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-[11px] font-medium transition-all"
              style={{ color: cfg.color }}>
              <span className="text-[12px]">{cfg.icon}</span>
              {cfg.label}
              <ChevronDown className="w-2.5 h-2.5 opacity-50" />
            </button>
            {showTypePicker && (
              <div className="absolute left-0 top-full mt-1 bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-10 w-28">
                {(["task", "story", "bug", "epic"] as Task["type"][]).map(t => {
                  const c = taskTypeConfig[t!];
                  return (
                    <button key={t} onClick={() => onTypeChange(t)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${type === t ? "bg-gray-50" : ""}`}>
                      <span>{c.icon}</span><span className="text-gray-700">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex-1" />
          <button onClick={onClose} className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onSubmit}
            disabled={!title.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            Tạo
            <kbd className="text-[9px] opacity-60 font-normal">⏎</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}

function DayMorePopover({ dateStr, tasks, pos, onClose, onTaskClick, isPastMonth }: {
  dateStr: string;
  tasks: Task[];
  pos: { x: number; y: number };
  onClose: () => void;
  onTaskClick: (task: Task, e: React.MouseEvent) => void;
  isPastMonth: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const adjustedX = Math.min(pos.x, window.innerWidth - 240);
  const estimatedH = 56 + tasks.length * 36;
  const adjustedY = pos.y + estimatedH > window.innerHeight ? pos.y - estimatedH - 8 : pos.y;

  const fmt = new Date(dateStr).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "short" });

  return (
    <div ref={ref}
      style={{ position: "fixed", left: adjustedX, top: adjustedY, zIndex: 1000, width: 230 }}
      className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
      onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <span className="text-[11px] font-medium text-gray-700">{fmt}</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="py-1 max-h-[280px] overflow-y-auto">
        {tasks.map(task => {
          const isOverdue = !isPastMonth && task.status !== "done" && task.dueDate && task.dueDate < today;
          const cfg = taskTypeConfig[task.type ?? "task"];
          return (
            <button key={task.id}
              onClick={e => { e.stopPropagation(); onTaskClick(task, e); }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left">
              <span className="flex items-center justify-center w-4 h-4 rounded shrink-0" style={{ backgroundColor: cfg.bg }}>
                <TaskTypeIcon task={task} size={9} />
              </span>
              <span className={`flex-1 text-[11px] truncate ${task.status === "done" ? "text-gray-400 line-through" : isOverdue ? "text-red-600" : "text-gray-700"}`}>
                {task.title}
              </span>
              <span className="text-[8px] px-1.5 py-0.5 rounded shrink-0" style={{ color: statusConfig[task.status].color, backgroundColor: statusConfig[task.status].bg }}>
                {statusConfig[task.status].label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getSprintName(sprintId?: string) {
  if (!sprintId) return null;
  return sprints.find(s => s.id === sprintId)?.name ?? null;
}

function TaskPopover({ task, pos, onClose, onOpen, isPastMonth }: {
  task: Task;
  pos: { x: number; y: number };
  onClose: () => void;
  onOpen: (task: Task) => void;
  isPastMonth: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Adjust position so popover doesn't overflow viewport
  const adjustedX = Math.min(pos.x, window.innerWidth - 260);
  const adjustedY = pos.y + 200 > window.innerHeight ? pos.y - 210 : pos.y;

  const fmt = (d: string) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "short" });
  const isOverdue = !isPastMonth && task.status !== "done" && task.dueDate && task.dueDate < new Date().toISOString().split("T")[0];

  return (
    <div
      ref={ref}
      style={{ position: "fixed", left: adjustedX, top: adjustedY, zIndex: 1000, width: 240 }}
      className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Color bar */}
      <div className="h-1 w-full" style={{ backgroundColor: priorityConfig[task.priority].color }} />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
        {/* Type badge */}
        <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-medium"
          style={{ color: taskTypeConfig[task.type ?? "task"].color, backgroundColor: taskTypeConfig[task.type ?? "task"].bg }}>
          <TaskTypeIcon task={task} size={9} />
          {taskTypeConfig[task.type ?? "task"].label}
        </span>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ color: statusConfig[task.status].color, backgroundColor: statusConfig[task.status].bg }}>
          {statusConfig[task.status].label}
        </span>
        {isOverdue && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-500 font-medium">Overdue</span>
        )}
        <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Title */}
      <div className="px-3 pb-2">
        <p className={`text-[13px] font-medium leading-snug ${task.status === "done" ? "text-gray-400 line-through" : "text-gray-800"}`}>
          {task.title}
        </p>
      </div>

      {/* Details */}
      <div className="px-3 pb-3 space-y-1.5 border-t border-gray-100 pt-2">
        {/* Date range */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <CalendarDays className="w-3 h-3 text-gray-400 shrink-0" />
          {task.startDate && task.startDate !== task.dueDate
            ? <span>{fmt(task.startDate)} → {task.dueDate ? fmt(task.dueDate) : "—"}</span>
            : <span>{task.dueDate ? fmt(task.dueDate) : "Chưa có deadline"}</span>
          }
        </div>

        {/* Assignee */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          {task.assignee ? (
            <>
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white shrink-0" style={{ backgroundColor: task.assignee.color }}>
                {task.assignee.name.charAt(0)}
              </div>
              <span>{task.assignee.name}</span>
            </>
          ) : (
            <>
              <User className="w-3 h-3 text-gray-300 shrink-0" />
              <span className="text-gray-400">Unassigned</span>
            </>
          )}
          {task.timeEstimate && (
            <span className="ml-auto flex items-center gap-0.5 text-gray-400">
              <Clock className="w-3 h-3" />{Math.floor(task.timeEstimate / 60)}h
            </span>
          )}
        </div>

        {/* Priority */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: priorityConfig[task.priority].color, opacity: 0.8 }} />
          <span>{priorityConfig[task.priority].label}</span>
        </div>

        {/* Sprint */}
        {getSprintName(task.sprintId) && (
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <Timer className="w-3 h-3 text-gray-400 shrink-0" />
            <span>{getSprintName(task.sprintId)}</span>
            {sprints.find(s => s.id === task.sprintId) && (
              <span className={`text-[9px] px-1 py-0.5 rounded ml-auto ${
                sprints.find(s => s.id === task.sprintId)!.status === "active" ? "bg-green-50 text-green-600" :
                sprints.find(s => s.id === task.sprintId)!.status === "planning" ? "bg-blue-50 text-blue-500" :
                "bg-gray-100 text-gray-400"
              }`}>
                {sprints.find(s => s.id === task.sprintId)!.status === "active" ? "Active" :
                 sprints.find(s => s.id === task.sprintId)!.status === "planning" ? "Planning" : "Done"}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="border-t border-gray-100 px-3 py-2">
        <button
          onClick={() => { onOpen(task); onClose(); }}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-[11px] font-medium transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Xem chi tiết
        </button>
      </div>
    </div>
  );
}

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  selectedProject: string | null;
  onCreateTask?: (dateStr: string) => void;
  onSaveTask?: (task: Task) => void;
}

type ViewMode = "month" | "week";

const CURRENT_USER_ID = teamMembers[0].id;

// Assignee dropdown with search + special options
function AssigneeDropdown({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch(""); }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (v: string) => onChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v]);

  const filteredMembers = teamMembers.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const isActive = values.length > 0;
  const buttonLabel = values.length === 0 ? "Assignee"
    : values.length === 1
      ? values[0] === "me" ? "Tôi" : values[0] === "unassigned" ? "Không có" : (teamMembers.find(m => m.id === values[0])?.name.split(" ").pop() ?? "Assignee")
      : `Assignee (${values.length})`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] transition-all ${isActive ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"}`}
      >
        <span>{buttonLabel}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[200px]">
          {/* Search input */}
          <div className="px-2 pt-2 pb-1">
            <div className="relative">
              <Search className="w-3 h-3 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                autoFocus
                type="text"
                placeholder="Tìm assignee..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-6 pr-2 py-1.5 text-[11px] border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-300 bg-gray-50"
              />
            </div>
          </div>

          {/* Special options */}
          {!search && (
            <div className="border-b border-gray-100 pb-1 mb-1">
              {[
                { value: "me", label: "Current User (Tôi)", icon: <User className="w-3 h-3 text-cyan-500" /> },
                { value: "unassigned", label: "Unassigned", icon: <User className="w-3 h-3 text-gray-400" /> },
              ].map(opt => (
                <button key={opt.value} onClick={() => toggle(opt.value)}
                  className="w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 hover:bg-gray-50">
                  <Checkbox checked={values.includes(opt.value)} />
                  {opt.icon}
                  <span className="text-gray-600">{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Member list */}
          <div className="pb-1 max-h-[180px] overflow-y-auto">
            {filteredMembers.length === 0 && (
              <p className="text-[10px] text-gray-400 text-center py-2">Không tìm thấy</p>
            )}
            {filteredMembers.map(m => (
              <button key={m.id} onClick={() => toggle(m.id)}
                className="w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 hover:bg-gray-50">
                <Checkbox checked={values.includes(m.id)} />
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ backgroundColor: m.color }}>
                  {m.name.charAt(0)}
                </div>
                <span className="text-gray-600">{m.name}</span>
              </button>
            ))}
          </div>

          {values.length > 0 && (
            <div className="border-t border-gray-100 px-3 py-1.5">
              <button onClick={() => onChange([])} className="text-[10px] text-red-400 hover:text-red-500">Xóa filter</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const TYPE_GROUPS = {
  standard: [
    { value: "epic",  label: "Epic",    color: "#d97706", Icon: Zap },
    { value: "bug",   label: "Bug",     color: "#dc2626", Icon: Bug },
    { value: "story", label: "Story",   color: "#7c3aed", Icon: BookOpen },
    { value: "task",  label: "Task",    color: "#0891b2", Icon: CheckSquare2 },
  ],
  subtask: [
    { value: "subtask", label: "Subtask", color: "#0891b2", Icon: GitBranch },
  ],
} as const;

const ALL_STANDARD = ["epic", "bug", "story", "task"];

function TypeFilterDropdown({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch(""); }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (v: string) => onChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v]);

  const allStandardChecked = ALL_STANDARD.every(v => values.includes(v));
  const allStandardIndeterminate = !allStandardChecked && ALL_STANDARD.some(v => values.includes(v));
  const allSubtaskChecked = values.includes("subtask");

  const toggleAllStandard = () => {
    if (allStandardChecked) onChange(values.filter(v => !ALL_STANDARD.includes(v)));
    else onChange([...new Set([...values, ...ALL_STANDARD])]);
  };

  const allItems = [...TYPE_GROUPS.standard, ...TYPE_GROUPS.subtask];
  const filtered = search
    ? allItems.filter(t => t.label.toLowerCase().includes(search.toLowerCase()))
    : null;

  const isActive = values.length > 0;
  const buttonLabel = values.length === 0 ? "Type"
    : values.length === 1
      ? allItems.find(t => t.value === values[0])?.label ?? "Type"
      : `Type (${values.length})`;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] transition-all ${isActive ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"}`}>
        {values.length === 1 && (() => { const t = allItems.find(x => x.value === values[0]); return t ? <t.Icon style={{ width: 10, height: 10 }} className="shrink-0" /> : null; })()}
        <span>{buttonLabel}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[210px]">
          {/* Search */}
          <div className="px-2 pt-2 pb-1">
            <div className="relative">
              <Search className="w-3 h-3 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input autoFocus type="text" placeholder="Search Type" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-6 pr-2 py-1.5 text-[11px] border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-300 bg-gray-50" />
            </div>
          </div>

          {!search ? (
            <>
              {/* Select all shortcuts */}
              <div className="border-b border-gray-100 pb-1 mb-1">
                <button onClick={toggleAllStandard}
                  className="w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 hover:bg-gray-50 text-gray-600">
                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${allStandardChecked ? "bg-cyan-500 border-cyan-500" : allStandardIndeterminate ? "bg-cyan-200 border-cyan-300" : "border-gray-300"}`}>
                    {(allStandardChecked || allStandardIndeterminate) && (
                      <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 8 8">
                        <path d={allStandardChecked ? "M1 4l2 2 4-4" : "M1 4h6"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  All standard work types
                </button>
                <button onClick={() => allSubtaskChecked ? toggle("subtask") : toggle("subtask")}
                  className="w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 hover:bg-gray-50 text-gray-600">
                  <Checkbox checked={allSubtaskChecked} />
                  All sub-tasks
                </button>
              </div>

              {/* Standard work types */}
              <div className="mb-1">
                <p className="px-3 py-1 text-[9px] text-gray-400 uppercase tracking-wider font-medium">Standard work types</p>
                {TYPE_GROUPS.standard.map(({ value, label, color, Icon }) => (
                  <button key={value} onClick={() => toggle(value)}
                    className="w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 hover:bg-gray-50">
                    <Checkbox checked={values.includes(value)} />
                    <Icon style={{ width: 12, height: 12, color }} className="shrink-0" />
                    <span className="text-gray-600">{label}</span>
                  </button>
                ))}
              </div>

              {/* Subtasks */}
              <div className="border-t border-gray-100 pt-1 pb-1">
                <p className="px-3 py-1 text-[9px] text-gray-400 uppercase tracking-wider font-medium">Subtasks</p>
                <button onClick={() => toggle("subtask")}
                  className="w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 hover:bg-gray-50">
                  <Checkbox checked={values.includes("subtask")} />
                  <GitBranch style={{ width: 12, height: 12, color: "#0891b2" }} className="shrink-0" />
                  <span className="text-gray-600">Subtask</span>
                </button>
              </div>
            </>
          ) : (
            <div className="pb-1">
              {filtered!.length === 0
                ? <p className="text-[10px] text-gray-400 text-center py-2">Không tìm thấy</p>
                : filtered!.map(({ value, label, color, Icon }) => (
                  <button key={value} onClick={() => toggle(value)}
                    className="w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 hover:bg-gray-50">
                    <Checkbox checked={values.includes(value)} />
                    <Icon style={{ width: 12, height: 12, color }} className="shrink-0" />
                    <span className="text-gray-600">{label}</span>
                  </button>
                ))
              }
            </div>
          )}

          {values.length > 0 && (
            <div className="border-t border-gray-100 px-3 py-1.5">
              <button onClick={() => onChange([])} className="text-[10px] text-red-400 hover:text-red-500">Xóa filter</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${checked ? "bg-cyan-500 border-cyan-500" : "border-gray-300"}`}>
      {checked && (
        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 8 8">
          <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

function MultiFilterDropdown({ label, values, options, onChange }: {
  label: string;
  values: string[];
  options: { value: string; label: string; color?: string }[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (v: string) => onChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v]);
  const isActive = values.length > 0;
  const buttonLabel = values.length === 0 ? label
    : values.length === 1 ? (options.find(o => o.value === values[0])?.label ?? label)
    : `${label} (${values.length})`;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] transition-all ${isActive ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"}`}>
        {values.length === 1 && options.find(o => o.value === values[0])?.color && (
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: options.find(o => o.value === values[0])!.color }} />
        )}
        <span>{buttonLabel}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px]">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 mb-1">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</span>
            {values.length > 0 && <button onClick={() => onChange([])} className="text-[10px] text-red-400 hover:text-red-500">Xóa</button>}
          </div>
          {options.map(opt => (
            <button key={opt.value} onClick={() => toggle(opt.value)}
              className="w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 hover:bg-gray-50">
              <Checkbox checked={values.includes(opt.value)} />
              {opt.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />}
              <span className="text-gray-600">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CalendarView({ tasks, onTaskClick, selectedProject, onCreateTask, onSaveTask }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1));
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [filterAssignees, setFilterAssignees] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [filterPriorities, setFilterPriorities] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showUnscheduled, setShowUnscheduled] = useState(false);
  const [unscheduledSearch, setUnscheduledSearch] = useState("");
  const [unscheduledSort, setUnscheduledSort] = useState<"recent" | "title">("recent");
  const [schedulingTask, setSchedulingTask] = useState<Task | null>(null);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [calendarDragTask, setCalendarDragTask] = useState<Task | null>(null);
  const [dragOverPanel, setDragOverPanel] = useState(false);
  const [popoverTask, setPopoverTask] = useState<Task | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const [morePopover, setMorePopover] = useState<{ dateStr: string; pos: { x: number; y: number } } | null>(null);
  const [inlineCreate, setInlineCreate] = useState<{ dateStr: string; pos: { x: number; y: number } } | null>(null);
  const [inlineTitle, setInlineTitle] = useState("");
  const [inlineType, setInlineType] = useState<Task["type"]>("task");
  const [showInlineTypePicker, setShowInlineTypePicker] = useState(false);

  const submitInlineCreate = () => {
    if (!inlineTitle.trim() || !inlineCreate) return;
    onSaveTask?.({
      id: `t${Date.now()}`, title: inlineTitle.trim(), status: "todo", priority: "normal",
      type: inlineType, tags: [], createdAt: new Date().toISOString().split("T")[0],
      projectId: selectedProject || "p1", dueDate: inlineCreate.dateStr,
    });
    setInlineTitle(""); setInlineType("task"); setInlineCreate(null); setShowInlineTypePicker(false);
  };

  const openInlineCreate = (dateStr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.min(rect.left, window.innerWidth - 300);
    const y = rect.bottom + 6 > window.innerHeight - 150 ? rect.top - 156 : rect.bottom + 6;
    setInlineCreate({ dateStr, pos: { x, y } });
    setInlineTitle(""); setInlineType("task"); setShowInlineTypePicker(false);
    setPopoverTask(null); setMorePopover(null);
  };

  const handleTaskBarClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    if (popoverTask?.id === task.id) { setPopoverTask(null); setPopoverPos(null); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopoverTask(task);
    setPopoverPos({ x: rect.left, y: rect.bottom + 6 });
  };

  const projectTasks = selectedProject ? tasks.filter(t => t.projectId === selectedProject) : tasks;

  const unscheduledTasks = useMemo(() => {
    const base = projectTasks.filter(t => !t.dueDate);
    const searched = unscheduledSearch
      ? base.filter(t => t.title.toLowerCase().includes(unscheduledSearch.toLowerCase()))
      : base;
    return unscheduledSort === "title"
      ? [...searched].sort((a, b) => a.title.localeCompare(b.title))
      : [...searched].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  }, [projectTasks, unscheduledSearch, unscheduledSort]);

  const filteredTasks = useMemo(() => {
    return projectTasks.filter(t => {
      if (filterAssignees.length > 0) {
        const hasMe = filterAssignees.includes("me");
        const hasUnassigned = filterAssignees.includes("unassigned");
        const memberIds = filterAssignees.filter(x => x !== "me" && x !== "unassigned");
        const matchesMe = hasMe && t.assignee?.id === CURRENT_USER_ID;
        const matchesUnassigned = hasUnassigned && !t.assignee;
        const matchesMember = memberIds.length > 0 && memberIds.includes(t.assignee?.id ?? "");
        if (!matchesMe && !matchesUnassigned && !matchesMember) return false;
      }
      if (filterStatuses.length > 0 && !filterStatuses.includes(t.status)) return false;
      if (filterTypes.length > 0) {
        const taskType = t.parentId ? "subtask" : (t.type ?? "task");
        if (!filterTypes.includes(taskType)) return false;
      }
      if (filterPriorities.length > 0 && !filterPriorities.includes(t.priority)) return false;
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [projectTasks, filterAssignees, filterStatuses, filterTypes, filterPriorities, searchQuery]);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; color?: string; onRemove: () => void }[] = [];
    filterAssignees.forEach(id => {
      if (id === "me") {
        chips.push({ key: "a-me", label: "Tôi", color: teamMembers[0].color, onRemove: () => setFilterAssignees(v => v.filter(x => x !== "me")) });
      } else if (id === "unassigned") {
        chips.push({ key: "a-unassigned", label: "Unassigned", onRemove: () => setFilterAssignees(v => v.filter(x => x !== "unassigned")) });
      } else {
        const m = teamMembers.find(x => x.id === id);
        if (m) chips.push({ key: `a-${id}`, label: m.name.split(" ").pop()!, color: m.color, onRemove: () => setFilterAssignees(v => v.filter(x => x !== id)) });
      }
    });
    filterStatuses.forEach(s => {
      chips.push({ key: `s-${s}`, label: statusConfig[s as keyof typeof statusConfig].label, color: statusConfig[s as keyof typeof statusConfig].color, onRemove: () => setFilterStatuses(v => v.filter(x => x !== s)) });
    });
    filterTypes.forEach(tp => {
      const allItems = [...TYPE_GROUPS.standard, ...TYPE_GROUPS.subtask] as { value: string; label: string; color: string }[];
      const found = allItems.find(x => x.value === tp);
      if (found) chips.push({ key: `t-${tp}`, label: found.label, color: found.color, onRemove: () => setFilterTypes(v => v.filter(x => x !== tp)) });
    });
    filterPriorities.forEach(p => {
      chips.push({ key: `p-${p}`, label: priorityConfig[p as keyof typeof priorityConfig].label, color: priorityConfig[p as keyof typeof priorityConfig].color, onRemove: () => setFilterPriorities(v => v.filter(x => x !== p)) });
    });
    if (searchQuery) chips.push({ key: "q", label: `"${searchQuery}"`, onRemove: () => setSearchQuery("") });
    return chips;
  }, [filterAssignees, filterStatuses, filterTypes, filterPriorities, searchQuery]);

  const clearAllFilters = () => { setFilterAssignees([]); setFilterStatuses([]); setFilterTypes([]); setFilterPriorities([]); setSearchQuery(""); };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date().toISOString().split("T")[0];
  const realNow = new Date();
  // Past months show historical data without overdue highlighting
  const isPastMonth = year < realNow.getFullYear() || (year === realNow.getFullYear() && month < realNow.getMonth());

  const prevPeriod = () => {
    if (viewMode === "month") setCurrentDate(new Date(year, month - 1, 1));
    else setCurrentDate(new Date(currentDate.getTime() - 7 * 86400000));
  };
  const nextPeriod = () => {
    if (viewMode === "month") setCurrentDate(new Date(year, month + 1, 1));
    else setCurrentDate(new Date(currentDate.getTime() + 7 * 86400000));
  };
  const goToday = () => setCurrentDate(new Date());

  // Tasks that cover a date: either single-day (dueDate only) or multi-day span
  const getTasksForDate = (dateStr: string) => filteredTasks.filter(t => t.dueDate === dateStr);

  const getSpanningTasks = (dateStr: string) =>
    filteredTasks.filter(t => t.startDate && t.startDate !== t.dueDate && t.startDate <= dateStr && t.dueDate! >= dateStr);

  const getSingleDayTasks = (dateStr: string) =>
    filteredTasks.filter(t => (!t.startDate || t.startDate === t.dueDate) && t.dueDate === dateStr);

  const stats = useMemo(() => {
    const overdue = projectTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date(today) && t.status !== "done").length;
    const thisMonth = projectTasks.filter(t => t.dueDate && t.dueDate.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)).length;
    const doneThisMonth = projectTasks.filter(t => t.dueDate && t.dueDate.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`) && t.status === "done").length;
    return { overdue, thisMonth, doneThisMonth };
  }, [projectTasks, year, month]);

  const monthCells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const cells: { day: number; month: "prev" | "current" | "next"; dateStr: string }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      cells.push({ day, month: "prev", dateStr: `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}` });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ day, month: "current", dateStr: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` });
    }
    const remaining = 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const m = month + 2 > 12 ? 1 : month + 2;
      const y = month + 2 > 12 ? year + 1 : year;
      cells.push({ day, month: "next", dateStr: `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}` });
    }
    return cells;
  }, [year, month]);

  const weekCells = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const dow = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dow);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return {
        day: d.getDate(),
        month: d.getMonth() === month ? "current" as const : "next" as const,
        dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        dayName: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()],
      };
    });
  }, [currentDate, month]);

  const headerTitle = viewMode === "month"
    ? currentDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })
    : (() => {
        const start = weekCells[0];
        const end = weekCells[6];
        return `${start.day}/${String(new Date(start.dateStr).getMonth() + 1).padStart(2, "0")} — ${end.day}/${String(new Date(end.dateStr).getMonth() + 1).padStart(2, "0")}/${year}`;
      })();

  const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const dayTasks = selectedDay ? getTasksForDate(selectedDay) : [];

  const statusOptions = Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label, color: v.color }));
  const priorityOptions = Object.entries(priorityConfig).map(([k, v]) => ({ value: k, label: v.label, color: v.color }));

  /* ── Mobile agenda view ───────────────────────────────────────────────────── */
  if (window.innerWidth < 768) {
    const todayStr = new Date().toISOString().split("T")[0];
    const selDay = selectedDay || todayStr;

    // Build days in current month for the strip
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const allOnDay = [...getTasksForDate(dateStr), ...getSpanningTasks(dateStr)];
      return { d, dateStr, hasTasks: allOnDay.length > 0 };
    });

    const selTasks = [...getTasksForDate(selDay), ...getSpanningTasks(selDay)];
    const selDate = new Date(selDay);
    const selLabel = selDate.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" });

    const monthLabel = new Date(year, month, 1).toLocaleDateString("vi-VN", { month: "long", year: "numeric" });

    return (
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Month navigator */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <span className="text-[15px] font-semibold text-gray-800 capitalize">{monthLabel}</span>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200">
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Weekday labels */}
        <div className="shrink-0 grid grid-cols-7 px-2 pt-2 pb-1">
          {["CN","T2","T3","T4","T5","T6","T7"].map(d => (
            <div key={d} className="text-center text-[10px] font-medium text-gray-400">{d}</div>
          ))}
        </div>

        {/* Date grid */}
        <div className="shrink-0 grid grid-cols-7 px-2 pb-3 gap-y-1">
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
          {monthDays.map(({ d, dateStr, hasTasks }) => {
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selDay;
            return (
              <button key={dateStr} onClick={() => setSelectedDay(dateStr)}
                className={`flex flex-col items-center py-1 rounded-xl transition-all ${isSelected ? "bg-cyan-500" : isToday ? "bg-cyan-50" : "hover:bg-gray-50"}`}>
                <span className={`text-[13px] font-medium ${isSelected ? "text-white" : isToday ? "text-cyan-600" : "text-gray-700"}`}>{d}</span>
                {hasTasks && <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? "bg-white" : "bg-cyan-400"}`} />}
                {!hasTasks && <span className="w-1.5 h-1.5 mt-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Selected day task list */}
        <div className="flex-1 overflow-y-auto border-t border-gray-100 bg-gray-50">
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-gray-700 capitalize">{selLabel}</span>
            <span className="text-[11px] text-gray-400">{selTasks.length} task</span>
          </div>
          {selTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <CalendarDays className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-[13px]">Không có task nào</p>
            </div>
          )}
          <div className="px-4 space-y-2 pb-4">
            {selTasks.map(task => {
              const pr = priorityConfig[task.priority as keyof typeof priorityConfig];
              const st = statusConfig[task.status as keyof typeof statusConfig];
              const assignee = teamMembers.find(m => m.id === task.assignee);
              const isOverdue = task.status !== "done" && task.dueDate && task.dueDate < todayStr;
              return (
                <button key={task.id} onClick={() => onTaskClick(task)}
                  className="w-full text-left bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm active:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <TaskTypeIcon task={task} size={14} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[14px] text-gray-800 leading-snug ${task.status === "done" ? "line-through text-gray-400" : ""}`}>{task.title}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {st && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]" style={{ backgroundColor: st.color + "22", color: st.color }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.color }} />
                            {st.label}
                          </span>
                        )}
                        {pr && <span className="text-[11px] font-medium" style={{ color: pr.color }}>{pr.label}</span>}
                        {isOverdue && <span className="text-[11px] text-red-500 font-medium">Quá hạn</span>}
                      </div>
                    </div>
                    {assignee && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] text-white shrink-0" style={{ backgroundColor: assignee.color }}>
                        {assignee.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAB */}
        <button onClick={() => onCreateTask?.(selDay)}
          className="absolute bottom-20 right-4 w-12 h-12 rounded-full bg-cyan-500 text-white shadow-lg flex items-center justify-center active:bg-cyan-600 z-10">
          <Plus className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Header row 1 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="text-[14px] text-gray-800 tracking-tight">{headerTitle}</h3>
          <div className="flex items-center gap-0.5">
            <button onClick={prevPeriod} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={nextPeriod} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button onClick={goToday} className="text-[11px] text-cyan-600 hover:text-cyan-700 px-2.5 py-1 rounded-lg hover:bg-cyan-50 transition-all border border-cyan-200">Today</button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-[10px] text-gray-400 mr-2">
            <span>{stats.thisMonth} this month</span>
            <span className="text-emerald-500">{stats.doneThisMonth} done</span>
            {stats.overdue > 0 && <span className="text-red-500">{stats.overdue} overdue</span>}
          </div>
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode("month")} className={`px-2.5 py-1 text-[10px] rounded-md transition-all ${viewMode === "month" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>Month</button>
            <button onClick={() => setViewMode("week")} className={`px-2.5 py-1 text-[10px] rounded-md transition-all ${viewMode === "week" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>Week</button>
          </div>
          <button
            onClick={() => { setShowUnscheduled(v => !v); setSchedulingTask(null); }}
            className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] transition-all ${showUnscheduled ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"}`}
            title="Unscheduled work"
          >
            <CalendarX2 className="w-3.5 h-3.5" />
            {unscheduledTasks.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-medium">
                {unscheduledTasks.length > 9 ? "9+" : unscheduledTasks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Scheduling mode banner */}
      {schedulingTask && (
        <div className="flex items-center gap-3 px-5 py-2 bg-cyan-500 text-white text-[11px] shrink-0">
          <CalendarDays className="w-3.5 h-3.5 shrink-0" />
          <span>Đang lên lịch: <strong>{schedulingTask.title}</strong> — Click vào ngày để đặt due date</span>
          <button onClick={() => setSchedulingTask(null)} className="ml-auto flex items-center gap-1 hover:opacity-70 transition-opacity">
            <X className="w-3.5 h-3.5" /> Hủy
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-5 py-2 border-b border-gray-200 shrink-0 bg-gray-50/50">
        <div className="relative flex items-center">
          <Search className="w-3 h-3 text-gray-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm task..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-7 pr-3 py-1.5 text-[11px] border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-cyan-300 w-[140px] text-gray-600 placeholder-gray-400"
          />
        </div>
        <AssigneeDropdown values={filterAssignees} onChange={setFilterAssignees} />
        <TypeFilterDropdown values={filterTypes} onChange={setFilterTypes} />
        <MultiFilterDropdown label="Status" values={filterStatuses} options={statusOptions} onChange={setFilterStatuses} />
        <button
          onClick={() => setShowMoreFilters(v => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] transition-all ${showMoreFilters ? "border-gray-300 bg-gray-100 text-gray-700" : "border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:bg-gray-50"}`}
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>More filters</span>
        </button>
        {activeChips.length > 0 && (
          <button onClick={clearAllFilters} className="ml-auto flex items-center gap-1 text-[10px] text-red-400 hover:text-red-500 transition-colors">
            <X className="w-3 h-3" />
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex items-center gap-1.5 px-5 py-1.5 border-b border-gray-100 bg-white shrink-0 flex-wrap">
          <span className="text-[10px] text-gray-400 mr-1">Đang lọc:</span>
          {activeChips.map(chip => (
            <span key={chip.key} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-[10px] text-gray-600 border border-gray-200">
              {chip.color && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: chip.color }} />}
              {chip.label}
              <button onClick={chip.onRemove} className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* More filters panel */}
      {showMoreFilters && (
        <div className="flex items-center gap-3 px-5 py-2 border-b border-gray-200 bg-gray-50/70 shrink-0 flex-wrap">
          <span className="text-[10px] text-gray-400 font-medium">More:</span>
          <MultiFilterDropdown label="Priority" values={filterPriorities} options={priorityOptions} onChange={setFilterPriorities} />
          <div className="w-px h-4 bg-gray-200" />
          <label className="flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer">
            <input type="checkbox" className="w-3 h-3 rounded accent-cyan-500" />
            Chỉ task của tôi
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer">
            <input type="checkbox" className="w-3 h-3 rounded accent-cyan-500" />
            Chỉ overdue
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer">
            <input type="checkbox" className="w-3 h-3 rounded accent-cyan-500" />
            Không có assignee
          </label>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {viewMode === "month" ? (
            <>
              <div className="grid grid-cols-7 border-b border-gray-200 shrink-0">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-[10px] text-gray-400 uppercase tracking-wider py-2 border-r border-gray-100 last:border-r-0">{day}</div>
                ))}
              </div>
              <div className="flex-1 grid grid-cols-7 grid-rows-6">
                {monthCells.map((cell, idx) => {
                  const colIdx = idx % 7;
                  const isToday = cell.dateStr === today;
                  const isSelected = cell.dateStr === selectedDay;
                  const isHovered = hoveredDay === cell.dateStr;

                  // Multi-day spanning tasks
                  const spanTasks = getSpanningTasks(cell.dateStr);
                  // Single-day tasks (no startDate or startDate === dueDate)
                  const chipTasks = getSingleDayTasks(cell.dateStr);

                  const totalCount = spanTasks.length + chipTasks.length;
                  const hasOverdue = !isPastMonth && (spanTasks.some(t => t.status !== "done") || chipTasks.some(t => t.status !== "done")) && cell.dateStr < today;

                  const visibleSpans = spanTasks.slice(0, 2);
                  const remainingAfterSpans = Math.max(0, spanTasks.length - 2);
                  const chipSlots = Math.max(0, 3 - visibleSpans.length);
                  const visibleChips = chipTasks.slice(0, chipSlots);
                  const hiddenCount = remainingAfterSpans + Math.max(0, chipTasks.length - chipSlots);

                  return (
                    <div key={idx}
                      onClick={e => {
                        if (schedulingTask) {
                          onSaveTask?.({ ...schedulingTask, dueDate: cell.dateStr });
                          setSchedulingTask(null);
                          return;
                        }
                        if (totalCount === 0 && onSaveTask) {
                          openInlineCreate(cell.dateStr, e);
                          return;
                        }
                        setSelectedDay(selectedDay === cell.dateStr ? null : cell.dateStr);
                        setPopoverTask(null);
                      }}
                      onMouseEnter={() => setHoveredDay(cell.dateStr)}
                      onMouseLeave={() => setHoveredDay(null)}
                      onDragOver={e => { e.preventDefault(); setDragOverCell(cell.dateStr); }}
                      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCell(null); }}
                      onDrop={e => {
                        e.preventDefault();
                        setDragOverCell(null);
                        if (draggingTask) {
                          onSaveTask?.({ ...draggingTask, dueDate: cell.dateStr });
                          setDraggingTask(null);
                        }
                      }}
                      className={`border-r border-b border-gray-100 min-h-[80px] flex flex-col cursor-pointer transition-colors overflow-hidden ${cell.month !== "current" ? "bg-gray-50/30" : "bg-white"} ${dragOverCell === cell.dateStr ? "bg-cyan-50 ring-2 ring-inset ring-cyan-400" : schedulingTask ? "hover:bg-cyan-50/40 hover:ring-2 hover:ring-inset hover:ring-cyan-300" : isSelected ? "ring-2 ring-inset ring-cyan-300 bg-cyan-50/20" : "hover:bg-gray-50/50"}`}>

                      {/* Date header */}
                      <div className="flex justify-between items-start px-1 pt-1 mb-0.5 shrink-0">
                        <span className={`text-[11px] w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-sm" : cell.month !== "current" ? "text-gray-300" : "text-gray-500"}`}>
                          {cell.day}
                        </span>
                        <div className="flex items-center gap-1">
                          {isHovered && onSaveTask && (
                            <button onClick={e => openInlineCreate(cell.dateStr, e)}
                              className="w-4 h-4 rounded flex items-center justify-center bg-cyan-500 text-white hover:bg-cyan-600 transition-all shadow-sm">
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          )}
                          {totalCount > 0 && (
                            <span className={`text-[8px] px-1 py-0.5 rounded-full ${hasOverdue ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-400"}`}>{totalCount}</span>
                          )}
                        </div>
                      </div>

                      {/* Multi-day span bars */}
                      {visibleSpans.map(task => {
                        const isTaskStart = task.startDate === cell.dateStr;
                        const isTaskEnd = task.dueDate === cell.dateStr;
                        const isVisualLeft = isTaskStart || colIdx === 0;
                        const isVisualRight = isTaskEnd || colIdx === 6;
                        const showTitle = isTaskStart || colIdx === 0;
                        const isOverdue = !isPastMonth && task.status !== "done" && task.dueDate! < today;

                        return (
                          <button key={`span-${task.id}`}
                            draggable={showUnscheduled}
                            onDragStart={e => { e.stopPropagation(); e.dataTransfer.effectAllowed = "move"; setCalendarDragTask(task); }}
                            onDragEnd={() => setCalendarDragTask(null)}
                            onClick={e => handleTaskBarClick(task, e)}
                            title={task.title}
                            style={{
                              marginLeft: isVisualLeft ? "2px" : "0",
                              marginRight: isVisualRight ? "2px" : "0",
                              borderRadius: `${isVisualLeft ? 3 : 0}px ${isVisualRight ? 3 : 0}px ${isVisualRight ? 3 : 0}px ${isVisualLeft ? 3 : 0}px`,
                              backgroundColor: isOverdue ? "rgba(239,68,68,0.12)" : statusConfig[task.status].bg,
                              color: isOverdue ? "#dc2626" : statusConfig[task.status].color,
                              borderLeft: isTaskStart ? `2px solid ${priorityConfig[task.priority].color}` : "none",
                              opacity: calendarDragTask?.id === task.id ? 0.4 : 1,
                            }}
                            className="h-[18px] flex items-center gap-0.5 px-1 text-[9px] mb-px w-full text-left hover:opacity-80 transition-opacity shrink-0"
                          >
                            {showTitle && <>
                              <TaskTypeIcon task={task} size={9} />
                              <span className="truncate">{task.title}</span>
                            </>}
                          </button>
                        );
                      })}

                      {/* Single-day chip tasks */}
                      <div className="px-1 space-y-0.5 flex-1">
                        {visibleChips.map(task => {
                          const isOverdue = !isPastMonth && task.status !== "done" && task.dueDate && task.dueDate < today;
                          return (
                            <button key={task.id}
                              draggable={showUnscheduled}
                              onDragStart={e => { e.stopPropagation(); e.dataTransfer.effectAllowed = "move"; setCalendarDragTask(task); }}
                              onDragEnd={() => setCalendarDragTask(null)}
                              onClick={e => handleTaskBarClick(task, e)}
                              className="w-full text-left px-1 py-[2px] rounded text-[9px] truncate transition-all hover:shadow-sm border border-transparent hover:border-gray-200"
                              style={{
                                backgroundColor: isOverdue ? "rgba(239,68,68,0.08)" : statusConfig[task.status].bg,
                                color: isOverdue ? "#dc2626" : statusConfig[task.status].color,
                                borderLeft: `2px solid ${priorityConfig[task.priority].color}`,
                                paddingLeft: "4px",
                                opacity: calendarDragTask?.id === task.id ? 0.4 : 1,
                              }}>
                              <span className="flex items-center gap-0.5 truncate">
                                <TaskTypeIcon task={task} size={8} />
                                <span className="truncate">{task.title}</span>
                              </span>
                            </button>
                          );
                        })}
                        {hiddenCount > 0 && (
                          <button onClick={e => {
                            e.stopPropagation();
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setMorePopover({ dateStr: cell.dateStr, pos: { x: rect.left, y: rect.bottom + 4 } });
                            setPopoverTask(null);
                          }}
                            className="text-[8px] text-cyan-500 hover:text-cyan-600 px-1 transition-colors">
                            +{hiddenCount} more
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex-1 grid grid-cols-7">
              {weekCells.map((cell, idx) => {
                const cellTasks = getTasksForDate(cell.dateStr);
                const isToday = cell.dateStr === today;
                const isSelected = cell.dateStr === selectedDay;

                return (
                  <div key={idx}
                    onClick={() => setSelectedDay(selectedDay === cell.dateStr ? null : cell.dateStr)}
                    className={`border-r border-gray-100 flex flex-col overflow-hidden cursor-pointer transition-colors ${isSelected ? "bg-cyan-50/30" : "hover:bg-gray-50/50"}`}>
                    <div className={`text-center py-3 border-b border-gray-200 ${isToday ? "bg-cyan-50" : ""}`}>
                      <p className={`text-[10px] uppercase tracking-wider ${isToday ? "text-cyan-600" : "text-gray-400"}`}>{cell.dayName}</p>
                      <p className={`text-[18px] mt-0.5 ${isToday ? "text-cyan-600" : "text-gray-700"}`}>{cell.day}</p>
                    </div>
                    <div className="flex-1 p-1.5 space-y-1 overflow-y-auto">
                      {cellTasks.map(task => {
                        const isOverdue = task.status !== "done" && task.dueDate && task.dueDate < today;
                        return (
                          <button key={task.id} onClick={e => handleTaskBarClick(task, e)}
                            className="w-full text-left p-2 rounded-lg border hover:shadow-md transition-all"
                            style={{
                              borderColor: isOverdue ? "rgba(239,68,68,0.3)" : "#e5e7eb",
                              backgroundColor: isOverdue ? "rgba(239,68,68,0.04)" : "#fff",
                              borderLeft: `3px solid ${priorityConfig[task.priority].color}`,
                            }}>
                            <p className={`text-[11px] mb-1 line-clamp-2 ${task.status === "done" ? "text-gray-400 line-through" : isOverdue ? "text-red-600" : "text-gray-700"}`}>{task.title}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] px-1 py-0.5 rounded" style={{ color: statusConfig[task.status].color, backgroundColor: statusConfig[task.status].bg }}>
                                {statusConfig[task.status].label}
                              </span>
                              {task.assignee && (
                                <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: task.assignee.color }}>
                                  {task.assignee.name.charAt(0)}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                      {cellTasks.length === 0 && (
                        <div className="h-full flex items-center justify-center text-[9px] text-gray-300">No tasks</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Day detail panel */}
        {selectedDay && (
          <div className="w-[260px] border-l border-gray-200 bg-white shrink-0 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div>
                <p className="text-[13px] text-gray-800">
                  {new Date(selectedDay).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long" })}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">{dayTasks.length} tasks</p>
              </div>
              <div className="flex items-center gap-1">
                {onCreateTask && (
                  <button onClick={() => onCreateTask(selectedDay)} className="w-6 h-6 rounded-lg flex items-center justify-center bg-cyan-500 text-white hover:bg-cyan-600 transition-all">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {dayTasks.length === 0 && (
                <div className="text-center py-8 text-[11px] text-gray-400">Không có task nào</div>
              )}
              {dayTasks.map(task => (
                <button key={task.id} onClick={() => onTaskClick(task)}
                  className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-white"
                  style={{ borderLeft: `3px solid ${priorityConfig[task.priority].color}` }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: statusConfig[task.status].color, backgroundColor: statusConfig[task.status].bg }}>
                      {statusConfig[task.status].label}
                    </span>
                  </div>
                  <p className={`text-[12px] mb-2 ${task.status === "done" ? "text-gray-400 line-through" : "text-gray-700"}`}>{task.title}</p>
                  <div className="flex items-center gap-2">
                    {task.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: task.assignee.color }}>{task.assignee.name.charAt(0)}</div>
                        <span className="text-[9px] text-gray-500">{task.assignee.name.split(" ").pop()}</span>
                      </div>
                    ) : <span className="text-[9px] text-gray-300">Unassigned</span>}
                    {task.timeEstimate && (
                      <span className="text-[9px] text-gray-400 flex items-center gap-0.5 ml-auto"><Clock className="w-2.5 h-2.5" />{Math.floor(task.timeEstimate / 60)}h</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Unscheduled work panel */}
        {showUnscheduled && (
          <div
            className={`w-[270px] border-l shrink-0 flex flex-col overflow-hidden transition-colors ${dragOverPanel ? "bg-cyan-50 border-cyan-300" : "border-gray-200 bg-white"}`}
            onDragOver={e => { if (calendarDragTask) { e.preventDefault(); setDragOverPanel(true); } }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverPanel(false); }}
            onDrop={e => {
              e.preventDefault();
              setDragOverPanel(false);
              if (calendarDragTask) {
                onSaveTask?.({ ...calendarDragTask, dueDate: undefined, startDate: undefined });
                setCalendarDragTask(null);
              }
            }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <CalendarX2 className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-[12px] font-medium text-gray-700">Unscheduled work</p>
                {unscheduledTasks.length > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                    {unscheduledTasks.length}
                  </span>
                )}
              </div>
              <button onClick={() => { setShowUnscheduled(false); setSchedulingTask(null); }}
                className="text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Hint text */}
            {dragOverPanel ? (
              <div className="px-4 py-2 bg-cyan-100 border-b border-cyan-200 shrink-0 flex items-center gap-2">
                <CalendarX2 className="w-3 h-3 text-cyan-600 shrink-0" />
                <p className="text-[9px] text-cyan-700 font-medium">Thả vào đây để bỏ due date</p>
              </div>
            ) : (
              <div className="px-4 py-2 bg-cyan-50/60 border-b border-cyan-100 shrink-0">
                <p className="text-[9px] text-cyan-600 leading-snug">Kéo task vào đây để bỏ khỏi calendar · Click task rồi click ngày để đặt lịch</p>
              </div>
            )}

            {/* Search + sort */}
            <div className="px-3 py-2 flex items-center gap-1.5 border-b border-gray-100 shrink-0">
              <div className="relative flex-1">
                <Search className="w-3 h-3 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm task..."
                  value={unscheduledSearch}
                  onChange={e => setUnscheduledSearch(e.target.value)}
                  className="w-full pl-6 pr-2 py-1.5 text-[11px] border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-cyan-300"
                />
              </div>
              <button
                onClick={() => setUnscheduledSort(s => s === "recent" ? "title" : "recent")}
                title={unscheduledSort === "recent" ? "Sắp xếp theo tên" : "Sắp xếp theo mới nhất"}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-all shrink-0"
              >
                <ArrowDownUp className="w-3 h-3" />
              </button>
            </div>

            {/* Sort label */}
            <div className="px-4 py-1 shrink-0">
              <span className="text-[9px] text-gray-400 uppercase tracking-wider">
                {unscheduledSort === "recent" ? "Mới nhất" : "A → Z"}
              </span>
            </div>

            {/* Task list */}
            <div className="flex-1 overflow-y-auto pb-2">
              {unscheduledTasks.length === 0 && (
                <div className="text-center py-10 text-[11px] text-gray-400 px-4">
                  {unscheduledSearch ? "Không tìm thấy task nào" : "Không có task nào chưa lên lịch"}
                </div>
              )}
              {unscheduledTasks.map(task => {
                const isScheduling = schedulingTask?.id === task.id;
                const isDragging = draggingTask?.id === task.id;
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.effectAllowed = "move";
                      setDraggingTask(task);
                      setSchedulingTask(null);
                    }}
                    onDragEnd={() => setDraggingTask(null)}
                    className={`group px-3 py-2.5 border-b border-gray-100 transition-all cursor-grab active:cursor-grabbing ${isDragging ? "opacity-40" : "hover:bg-gray-50"} ${isScheduling ? "bg-cyan-50 border-l-2 border-l-cyan-500" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      {/* Drag handle */}
                      <GripVertical className="w-3 h-3 text-gray-300 group-hover:text-gray-400 shrink-0 mt-1 transition-colors" />
                      {/* Priority dot */}
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: priorityConfig[task.priority].color }} />
                      {/* Content — click opens detail */}
                      <button className="flex-1 min-w-0 text-left" onClick={() => onTaskClick(task)}>
                        <div className="flex items-center gap-1 mb-1">
                          <TaskTypeIcon task={task} size={9} />
                          <span className="text-[9px] text-gray-400 truncate">{task.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                        <p className={`text-[11px] leading-snug truncate ${isScheduling ? "text-cyan-700 font-medium" : "text-gray-700"}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: statusConfig[task.status].color, backgroundColor: statusConfig[task.status].bg }}>
                            {statusConfig[task.status].label}
                          </span>
                          {task.assignee && (
                            <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[6px] text-white shrink-0" style={{ backgroundColor: task.assignee.color }}>
                              {task.assignee.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      </button>
                      {/* Schedule button */}
                      <button
                        onClick={() => setSchedulingTask(isScheduling ? null : task)}
                        title={isScheduling ? "Hủy lên lịch" : "Đặt lên lịch"}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${isScheduling ? "bg-cyan-500 text-white" : "text-gray-300 hover:text-cyan-500 hover:bg-cyan-50 opacity-0 group-hover:opacity-100"}`}
                      >
                        <CalendarDays className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Inline create form */}
      {inlineCreate && (
        <InlineCreateForm
          pos={inlineCreate.pos}
          dateStr={inlineCreate.dateStr}
          title={inlineTitle}
          type={inlineType}
          showTypePicker={showInlineTypePicker}
          onTitleChange={setInlineTitle}
          onTypeChange={t => { setInlineType(t); setShowInlineTypePicker(false); }}
          onToggleTypePicker={() => setShowInlineTypePicker(v => !v)}
          onSubmit={submitInlineCreate}
          onClose={() => { setInlineCreate(null); setInlineTitle(""); setInlineType("task"); setShowInlineTypePicker(false); }}
        />
      )}

      {/* Day more popover */}
      {morePopover && (
        <DayMorePopover
          dateStr={morePopover.dateStr}
          tasks={[...getSpanningTasks(morePopover.dateStr), ...getSingleDayTasks(morePopover.dateStr)]}
          pos={morePopover.pos}
          onClose={() => setMorePopover(null)}
          onTaskClick={(task, e) => {
            setMorePopover(null);
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setPopoverTask(task);
            setPopoverPos({ x: rect.left, y: rect.bottom + 6 });
          }}
          isPastMonth={isPastMonth}
        />
      )}

      {/* Task popover */}
      {popoverTask && popoverPos && (
        <TaskPopover
          task={popoverTask}
          pos={popoverPos}
          onClose={() => { setPopoverTask(null); setPopoverPos(null); }}
          onOpen={onTaskClick}
          isPastMonth={isPastMonth}
        />
      )}

      {/* Footer legend */}
      {viewMode === "month" && (
        <div className="flex items-center gap-5 px-5 py-2 bg-gray-50 border-t border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            {Object.entries(statusConfig).map(([k, v]) => {
              const count = projectTasks.filter(t => t.dueDate?.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`) && t.status === k).length;
              return (
                <span key={k} className="flex items-center gap-1 text-[9px] text-gray-400">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
                  {v.label}: {count}
                </span>
              );
            })}
          </div>
          <div className="w-px h-3 bg-gray-200" />
          <div className="flex items-center gap-3">
            {Object.entries(priorityConfig).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1 text-[9px] text-gray-400">
                <div className="w-2.5 h-3 rounded-sm" style={{ backgroundColor: v.color, opacity: 0.7 }} />
                {v.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
