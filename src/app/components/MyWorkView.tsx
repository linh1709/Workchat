import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus, AlertTriangle, Calendar,
  Clock, CheckSquare, ArrowUp, ArrowDown, Minus,
  BarChart2, ListChecks, Bug, Zap, X, ChevronDown, Check
} from "lucide-react";
import { type Task, type TaskType, statusConfig, priorityConfig, tagColors, taskTypeConfig, projects, teamMembers } from "./data";

const CURRENT_USER_ID = "u1";
const CURRENT_USER_NAME = "Nguyễn Minh";

interface MyWorkViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (type?: "task" | "story" | "bug" | "epic") => void;
  onSaveTask?: (task: Task) => void;
}

type TabType = "mywork" | "assigned";
type StatusFilter = "all" | "todo" | "in_progress" | "in_review" | "done";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "todo", label: "Cần làm" },
  { key: "in_progress", label: "Đang làm" },
  { key: "in_review", label: "Đang review" },
  { key: "done", label: "Hoàn thành" },
];

const TYPE_ICON: Record<string, React.ReactNode> = {
  task: <ListChecks className="w-3.5 h-3.5" />,
  story: <BarChart2 className="w-3.5 h-3.5" />,
  bug: <Bug className="w-3.5 h-3.5" />,
  epic: <Zap className="w-3.5 h-3.5" />,
};

function TaskTypeIcon({ type }: { type?: string }) {
  if (type === "bug")   return <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-red-500 shrink-0"><Bug className="w-2.5 h-2.5 text-white" /></span>;
  if (type === "story") return <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-emerald-500 shrink-0"><BarChart2 className="w-2.5 h-2.5 text-white" /></span>;
  if (type === "epic")  return <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-violet-500 shrink-0"><Zap className="w-2.5 h-2.5 text-white" /></span>;
  return <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-blue-500 shrink-0"><ListChecks className="w-2.5 h-2.5 text-white" /></span>;
}

function QuickAddInline({
  value, onChange, type, onTypeChange, projectId, onProjectChange, onSubmit, onCancel,
}: {
  value: string; onChange: (v: string) => void;
  type: TaskType; onTypeChange: (t: TaskType) => void;
  projectId: string; onProjectChange: (id: string) => void;
  onSubmit: () => void; onCancel: () => void;
}) {
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentProject = projects.find(p => p.id === projectId);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 border border-cyan-200 rounded-xl bg-cyan-50/30 mt-1">
      {/* Type selector */}
      <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => { setShowTypePicker(o => !o); setShowProjectPicker(false); }}
          className="flex items-center gap-0.5 px-1 py-1 rounded-md hover:bg-gray-100 transition-colors"
        >
          <TaskTypeIcon type={type} />
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>
        {showTypePicker && (
          <div className="absolute left-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl py-1 z-30 w-[130px]">
            {(["task", "story", "bug"] as TaskType[]).map(t => (
              <button key={t} onClick={() => { onTypeChange(t); setShowTypePicker(false); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-left ${type === t ? "bg-gray-50" : ""}`}>
                <TaskTypeIcon type={t} />
                <span className="text-[12px] text-gray-700">{taskTypeConfig[t].label}</span>
                {type === t && <Check className="w-3 h-3 text-cyan-500 ml-auto" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Title input */}
      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") onSubmit(); if (e.key === "Escape") onCancel(); }}
        placeholder="Tên công việc..."
        className="flex-1 text-[13px] bg-transparent outline-none text-gray-800 placeholder-gray-400"
      />

      {/* Project selector */}
      <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => { setShowProjectPicker(o => !o); setShowTypePicker(false); }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 bg-white hover:border-gray-300 text-[11px] font-medium text-gray-500 transition-colors max-w-[110px]"
        >
          <span className="truncate">{currentProject?.name ?? "Dự án"}</span>
          <ChevronDown className="w-3 h-3 shrink-0 opacity-60" />
        </button>
        {showProjectPicker && (
          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl py-1 z-30 w-[160px]">
            {projects.map(p => (
              <button key={p.id} onClick={() => { onProjectChange(p.id); setShowProjectPicker(false); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-left ${projectId === p.id ? "bg-gray-50" : ""}`}>
                <span className="w-4 h-4 rounded text-[8px] font-bold text-white flex items-center justify-center shrink-0" style={{ backgroundColor: p.color }}>{p.icon}</span>
                <span className="text-[12px] text-gray-700 truncate">{p.name}</span>
                {projectId === p.id && <Check className="w-3 h-3 text-cyan-500 ml-auto shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={onSubmit} disabled={!value.trim()}
        className="px-2.5 py-1 text-[11px] bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 disabled:opacity-40 transition-all shrink-0">
        Tạo ↵
      </button>
      <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600 shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

const PRIORITY_ICON: Record<string, React.ReactNode> = {
  urgent: <ArrowUp className="w-3 h-3" />,
  high: <ArrowUp className="w-3 h-3" />,
  normal: <Minus className="w-3 h-3" />,
  low: <ArrowDown className="w-3 h-3" />,
};

function isDueOverdue(dueDate?: string) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function formatDueDate(dueDate: string) {
  const d = new Date(dueDate);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `Quá hạn ${Math.abs(diff)} ngày`;
  if (diff === 0) return "Hôm nay";
  if (diff === 1) return "Ngày mai";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const status = statusConfig[task.status as keyof typeof statusConfig];
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig];
  const overdue = isDueOverdue(task.dueDate);
  const doneSubtasks = task.subtasks?.filter(s => s.done).length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;
  const subtaskProgress = totalSubtasks > 0 ? (doneSubtasks / totalSubtasks) * 100 : 0;

  const assigneeInitials = task.assignee
    ? task.assignee.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-gray-100 p-4 hover:border-cyan-200 hover:shadow-sm active:bg-gray-50 transition-all group"
    >
      {/* Top row: assignee + time */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {task.assignee && (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0"
              style={{ backgroundColor: task.assignee.color }}
            >
              {assigneeInitials}
            </div>
          )}
          <div>
            <p className="text-[12px] font-medium text-gray-700 leading-none">
              {task.assignee?.name ?? "Chưa giao"}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {task.assignee?.role ?? ""}
            </p>
          </div>
        </div>
        <span className="text-[11px] text-gray-400">
          {task.createdAt
            ? new Date(task.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
            : ""}
        </span>
      </div>

      {/* ID + badges row */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{ backgroundColor: priority.color + "18", color: priority.color }}
        >
          {task.id.toUpperCase()}
        </span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
          style={{ backgroundColor: status.bg, color: status.color }}
        >
          {status.label}
        </span>
        {overdue && (
          <span className="flex items-center gap-0.5 text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded font-medium">
            <AlertTriangle className="w-2.5 h-2.5" />
            Quá hạn
          </span>
        )}
      </div>

      {/* Title */}
      <p className={`text-[14px] font-semibold text-gray-800 mb-1 leading-snug group-hover:text-cyan-700 transition-colors ${task.status === "done" ? "line-through text-gray-400" : ""}`}>
        {task.title}
      </p>

      {/* Description */}
      {task.description && (
        <p className="text-[12px] text-gray-500 mb-2 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 3).map(tag => {
            const tc = tagColors[tag] ?? { bg: "#f3f4f6", text: "#6b7280" };
            return (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: tc.bg, color: tc.text }}>
                #{tag}
              </span>
            );
          })}
          {task.tags.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Subtask progress */}
      {totalSubtasks > 0 && (
        <div className="mb-2">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${subtaskProgress}%`, backgroundColor: subtaskProgress === 100 ? "#10b981" : "#0891b2" }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">{doneSubtasks}/{totalSubtasks} subtask</p>
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center gap-3 mt-1 flex-wrap">
        {task.dueDate && (
          <span className={`flex items-center gap-1 text-[11px] ${overdue ? "text-red-500" : "text-gray-400"}`}>
            <Calendar className="w-3 h-3" />
            {formatDueDate(task.dueDate)}
          </span>
        )}
        {task.timeEstimate ? (
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <Clock className="w-3 h-3" />
            {Math.round(task.timeEstimate / 60)}h
          </span>
        ) : null}
        {task.storyPoints ? (
          <span className="flex items-center gap-1 text-[11px] text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded">
            {task.storyPoints} pts
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-1 text-[11px] text-gray-400">
          {TYPE_ICON[task.type ?? "task"]}
          <span
            className="flex items-center gap-0.5 font-medium"
            style={{ color: priority.color }}
          >
            {PRIORITY_ICON[task.priority]}
            {priority.label}
          </span>
        </div>
      </div>
    </button>
  );
}

export function MyWorkView({ tasks, onTaskClick, onAddTask, onSaveTask }: MyWorkViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("mywork");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isAddingInline, setIsAddingInline] = useState(false);
  const [inlineTitle, setInlineTitle] = useState("");
  const [inlineType, setInlineType] = useState<TaskType>("task");
  const [inlineProjectId, setInlineProjectId] = useState("");

  const myTasks = useMemo(
    () => tasks.filter(t => t.assignee?.id === CURRENT_USER_ID),
    [tasks]
  );

  const assignedByMe = useMemo(
    () => tasks.filter(t => t.reporterId === CURRENT_USER_ID && t.assignee?.id !== CURRENT_USER_ID),
    [tasks]
  );

  const sourceTasks = activeTab === "mywork" ? myTasks : assignedByMe;

  const filtered = useMemo(() => {
    if (statusFilter === "all") return sourceTasks;
    return sourceTasks.filter(t => t.status === statusFilter);
  }, [sourceTasks, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sourceTasks.length };
    sourceTasks.forEach(t => {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    });
    return counts;
  }, [sourceTasks]);

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-5 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[20px] font-bold text-gray-900">Công việc</h1>
            <p className="text-[12px] text-gray-400 mt-0.5">{sourceTasks.length} công việc</p>
          </div>
          <button
            onClick={() => onAddTask("task")}
            className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white rounded-xl text-[13px] font-medium transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tạo công việc</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0">
          {([
            { key: "mywork" as TabType, label: "Công việc của tôi", count: myTasks.length },
            { key: "assigned" as TabType, label: "Đã giao", count: assignedByMe.length },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setStatusFilter("all"); }}
              className={`relative px-4 py-2.5 text-[13px] font-medium transition-all flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? "text-cyan-600 border-b-2 border-cyan-500"
                  : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"
              }`}
            >
              {tab.label}
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === tab.key ? "bg-cyan-100 text-cyan-600" : "bg-gray-100 text-gray-500"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Status filter bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-1 overflow-x-auto no-scrollbar shrink-0">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
              statusFilter === tab.key
                ? "bg-cyan-500 text-white shadow-sm"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            {tab.label}
            {statusCounts[tab.key] !== undefined && statusCounts[tab.key] > 0 && (
              <span className={`text-[10px] font-bold ${statusFilter === tab.key ? "text-white/80" : "text-gray-400"}`}>
                {statusCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <CheckSquare className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-[14px] font-medium text-gray-500">
              {statusFilter === "all" ? "Chưa có công việc nào" : `Không có task "${STATUS_TABS.find(t => t.key === statusFilter)?.label}"`}
            </p>
            <p className="text-[12px] text-gray-400 mt-1">
              {activeTab === "mywork" ? "Các task được giao cho bạn sẽ xuất hiện ở đây" : "Các task bạn giao cho người khác sẽ xuất hiện ở đây"}
            </p>
          </div>
        ) : (
          <>
            {filtered.map(task => (
              <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ))}
          </>
        )}

        {/* Add task inline */}
        {isAddingInline ? (
          <QuickAddInline
            value={inlineTitle}
            onChange={setInlineTitle}
            type={inlineType}
            onTypeChange={setInlineType}
            projectId={inlineProjectId}
            onProjectChange={setInlineProjectId}
            onSubmit={() => {
              if (!inlineTitle.trim()) return;
              if (onSaveTask) {
                const newTask: Task = {
                  id: `task-${Date.now()}`,
                  title: inlineTitle.trim(),
                  type: inlineType,
                  status: "todo",
                  priority: "normal",
                  assignee: teamMembers[0],
                  reporterId: CURRENT_USER_ID,
                  tags: [],
                  createdAt: new Date().toISOString(),
                  ...(inlineProjectId ? { projectId: inlineProjectId } : {}),
                  subtasks: [], comments: [], activityLog: [], dependencies: [], watchers: [],
                };
                onSaveTask(newTask);
              }
              setInlineTitle("");
              setInlineType("task");
              setInlineProjectId("");
              setIsAddingInline(false);
            }}
            onCancel={() => { setIsAddingInline(false); setInlineTitle(""); setInlineType("task"); setInlineProjectId(""); }}
          />
        ) : (
          <button
            onClick={() => { setIsAddingInline(true); setInlineProjectId(""); }}
            className="w-full flex items-center gap-2 px-4 py-3.5 rounded-xl border border-dashed border-gray-200 text-gray-400 hover:border-cyan-300 hover:text-cyan-500 hover:bg-cyan-50/50 active:bg-cyan-50 transition-all text-[13px]"
          >
            <Plus className="w-4 h-4" />
            Thêm công việc mới...
          </button>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
