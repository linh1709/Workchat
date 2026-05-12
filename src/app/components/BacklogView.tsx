import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus, ChevronDown, ChevronRight, Search, Filter, X, GripVertical,
  MoreHorizontal, AlertCircle, Bug, BookOpen, Zap, CheckSquare2,
  CalendarDays, Check,
} from "lucide-react";
import { type Task, type Sprint, type TaskType, taskTypeConfig, priorityConfig, teamMembers, epics } from "./data";

interface BacklogViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onSaveTask: (task: Task) => void;
  onDeleteTask?: (id: string) => void;
  selectedProject: string | null;
  sprints: Sprint[];
  onSprintsChange: React.Dispatch<React.SetStateAction<Sprint[]>>;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function TaskTypeIcon({ type }: { type?: Task["type"] }) {
  if (type === "bug")   return <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-red-500 shrink-0"><Bug      className="w-2.5 h-2.5 text-white" /></span>;
  if (type === "story") return <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-emerald-500 shrink-0"><BookOpen className="w-2.5 h-2.5 text-white" /></span>;
  if (type === "epic")  return <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-violet-500 shrink-0"><Zap      className="w-2.5 h-2.5 text-white" /></span>;
  return                       <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-blue-500 shrink-0"><CheckSquare2 className="w-2.5 h-2.5 text-white" /></span>;
}

const STATUS_OPTIONS: { value: Task["status"]; label: string; cls: string }[] = [
  { value: "todo",        label: "TO DO",        cls: "bg-gray-100 text-gray-600" },
  { value: "in_progress", label: "IN PROGRESS",  cls: "bg-blue-100 text-blue-700" },
  { value: "in_review",   label: "IN REVIEW",    cls: "bg-amber-100 text-amber-700" },
  { value: "done",        label: "DONE",         cls: "bg-green-100 text-green-700" },
];

function getStatusCls(status: Task["status"]) {
  return STATUS_OPTIONS.find(o => o.value === status)?.cls ?? "bg-gray-100 text-gray-600";
}
function getStatusLabel(status: Task["status"]) {
  return STATUS_OPTIONS.find(o => o.value === status)?.label ?? "TO DO";
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${s.getDate()} ${m[s.getMonth()]} – ${e.getDate()} ${m[e.getMonth()]}`;
}

function getStats(tasks: Task[]) {
  return {
    done:       tasks.filter(t => t.status === "done").length,
    inProgress: tasks.filter(t => t.status === "in_progress" || t.status === "in_review").length,
    todo:       tasks.filter(t => t.status === "todo").length,
  };
}

// ── Start Sprint Modal ────────────────────────────────────────────────────────

interface StartSprintModalProps {
  sprint: Sprint;
  taskCount: number;
  onClose: () => void;
  onStart: (data: { name: string; startDate: string; endDate: string; goal: string }) => void;
}

function StartSprintModal({ sprint, taskCount, onClose, onStart }: StartSprintModalProps) {
  const [name, setName] = useState(sprint.name);
  const [duration, setDuration] = useState("custom");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState(sprint.endDate);
  const [endTime, setEndTime] = useState("17:30");
  const [goal, setGoal] = useState("");

  // Auto-calculate end date based on duration
  useEffect(() => {
    if (duration === "custom") return;
    const weeks = parseInt(duration);
    const s = new Date(startDate);
    s.setDate(s.getDate() + weeks * 7);
    setEndDate(s.toISOString().split("T")[0]);
  }, [duration, startDate]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-[15px] font-semibold text-gray-800">Start sprint</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Item count */}
          <p className="text-[13px] text-gray-600">
            <span className="font-semibold">{taskCount}</span> work item{taskCount !== 1 ? "s" : ""} will be included in this sprint.
          </p>
          <p className="text-[11px] text-gray-400">Required fields are marked with an asterisk *</p>

          {/* Sprint name */}
          <div>
            <label className="text-[12px] font-medium text-gray-700 mb-1.5 block">Sprint name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="text-[12px] font-medium text-gray-700 mb-1.5 block">Duration *</label>
            <select
              value={duration}
              onChange={e => setDuration(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="custom">custom</option>
              <option value="1">1 week</option>
              <option value="2">2 weeks</option>
              <option value="3">3 weeks</option>
              <option value="4">4 weeks</option>
            </select>
          </div>

          {/* Start date */}
          <div>
            <label className="text-[12px] font-medium text-gray-700 mb-1.5 block">Start date *</label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                <CalendarDays className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="flex-1 text-[13px] text-gray-700 focus:outline-none bg-transparent" />
              </div>
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 w-28">
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                  className="text-[13px] text-gray-700 focus:outline-none bg-transparent w-full" />
              </div>
            </div>
          </div>

          {/* End date */}
          <div>
            <label className="text-[12px] font-medium text-gray-700 mb-1.5 block">End date *</label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                <CalendarDays className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="flex-1 text-[13px] text-gray-700 focus:outline-none bg-transparent" />
              </div>
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 w-28">
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                  className="text-[13px] text-gray-700 focus:outline-none bg-transparent w-full" />
              </div>
            </div>
          </div>

          {/* Sprint goal */}
          <div>
            <label className="text-[12px] font-medium text-gray-700 mb-1.5 block">Sprint goal</label>
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              rows={4}
              placeholder="Enter sprint goal..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 resize-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="px-4 py-2 text-[13px] text-gray-600 hover:bg-gray-100 rounded-lg transition-all font-medium">
            Cancel
          </button>
          <button
            onClick={() => { if (!name.trim()) return; onStart({ name: name.trim(), startDate, endDate, goal }); }}
            disabled={!name.trim()}
            className="px-5 py-2 text-[13px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium disabled:opacity-40">
            Start
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Sprint Modal ─────────────────────────────────────────────────────────

function EditSprintModal({ sprint, initialGoal, onClose, onSave }: {
  sprint: Sprint;
  initialGoal?: string;
  onClose: () => void;
  onSave: (data: { name: string; startDate: string; endDate: string; goal: string }) => void;
}) {
  const [name, setName] = useState(sprint.name);
  const [startDate, setStartDate] = useState(sprint.startDate);
  const [endDate, setEndDate] = useState(sprint.endDate);
  const [goal, setGoal] = useState(initialGoal ?? "");

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-[15px] font-semibold text-gray-800">Edit sprint</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[12px] font-medium text-gray-700 mb-1.5 block">Sprint name *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[12px] font-medium text-gray-700 mb-1.5 block">Start date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 focus:outline-none" />
            </div>
            <div className="flex-1">
              <label className="text-[12px] font-medium text-gray-700 mb-1.5 block">End date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-medium text-gray-700 mb-1.5 block">Sprint goal</label>
            <textarea value={goal} onChange={e => setGoal(e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 resize-none focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
          <button onClick={() => { if (!name.trim()) return; onSave({ name: name.trim(), startDate, endDate, goal }); }}
            disabled={!name.trim()}
            className="px-5 py-2 text-[13px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-40">
            Update
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Complete Sprint Modal ─────────────────────────────────────────────────────

interface CompleteSprintModalProps {
  sprint: Sprint;
  sprintTasks: Task[];
  otherSprints: Sprint[];
  onClose: () => void;
  onComplete: (moveOpenToSprintId: string | null) => void;
}

function CompleteSprintModal({ sprint, sprintTasks, otherSprints, onClose, onComplete }: CompleteSprintModalProps) {
  const completedTasks = sprintTasks.filter(t => t.status === "done");
  const openTasks      = sprintTasks.filter(t => t.status !== "done");
  const [moveTo, setMoveTo] = useState<string>("__backlog__");
  const [retro, setRetro]   = useState(false);

  const destinations = [
    { value: "__backlog__", label: "Backlog" },
    ...otherSprints.filter(s => s.status !== "completed").map(s => ({ value: s.id, label: s.name })),
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Trophy header */}
        <div className="h-36 bg-gradient-to-b from-cyan-400 to-cyan-500 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="absolute rounded-full bg-white"
                style={{ width: 60 + i * 30, height: 60 + i * 30, top: "50%", left: "50%",
                  transform: "translate(-50%,-50%)", opacity: 0.08 + i * 0.02 }} />
            ))}
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="text-6xl drop-shadow-lg">🏆</div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <h2 className="text-[17px] font-semibold text-gray-800 mb-3">Complete {sprint.name}</h2>

          <p className="text-[13px] text-gray-700 mb-3">
            This sprint contains{" "}
            <span className="font-semibold">{completedTasks.length} completed work item{completedTasks.length !== 1 ? "s" : ""}</span>
            {openTasks.length > 0 && (
              <> and <span className="font-semibold">{openTasks.length} open work item{openTasks.length !== 1 ? "s" : ""}</span></>
            )}.
          </p>

          <ul className="text-[12px] text-gray-500 space-y-1.5 mb-5 list-disc pl-4">
            <li>Completed work items includes everything in the last column on the board, Done.</li>
            {openTasks.length > 0 && (
              <li>Open work items includes everything from any other column on the board. Move these to a new sprint or the backlog.</li>
            )}
          </ul>

          {/* Move open items */}
          {openTasks.length > 0 && (
            <div className="mb-4">
              <label className="text-[12px] font-medium text-gray-700 mb-1.5 block">Move open work items to</label>
              <select
                value={moveTo}
                onChange={e => setMoveTo(e.target.value)}
                className="w-full border border-blue-400 rounded-lg px-3 py-2 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
              >
                {destinations.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Retrospective checkbox */}
          <button
            onClick={() => setRetro(p => !p)}
            className="flex items-start gap-3 w-full text-left p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all
              ${retro ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"}`}>
              {retro && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            <div>
              <p className="text-[13px] font-medium text-gray-800">Tạo Sprint Retrospective</p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Kết thúc sprint bằng một buổi retrospective để cải thiện cách làm việc của team.
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="px-4 py-2 text-[13px] text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-all">
            Cancel
          </button>
          <button
            onClick={() => onComplete(moveTo === "__backlog__" ? null : moveTo)}
            className="px-5 py-2 text-[13px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all">
            Complete sprint
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────

function SprintStats({ done, inProgress, todo, totalPoints, donePoints }: {
  done: number; inProgress: number; todo: number;
  totalPoints?: number; donePoints?: number;
}) {
  return (
    <div className="flex items-center shrink-0">
      <span className="inline-flex items-center justify-center min-w-[22px] h-[20px] rounded-sm bg-green-100 text-green-700 text-[11px] font-medium px-1">{done}</span>
      <div className="w-px h-3.5 bg-gray-200 mx-0.5" />
      <span className="inline-flex items-center justify-center min-w-[22px] h-[20px] rounded-sm bg-blue-100 text-blue-700 text-[11px] font-medium px-1">{inProgress}</span>
      <div className="w-px h-3.5 bg-gray-200 mx-0.5" />
      <span className="inline-flex items-center justify-center min-w-[22px] h-[20px] rounded-sm bg-gray-100 text-gray-500 text-[11px] font-medium px-1">{todo}</span>
      {totalPoints !== undefined && totalPoints > 0 && (
        <>
          <div className="w-px h-3.5 bg-gray-200 mx-1.5" />
          <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">{donePoints ?? 0}/{totalPoints} pts</span>
        </>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function BacklogView({ tasks, onTaskClick, onSaveTask, onDeleteTask, selectedProject, sprints, onSprintsChange: setSprints }: BacklogViewProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickType, setQuickType] = useState<TaskType>("task");
  const [sprintMenuId, setSprintMenuId] = useState<string | null>(null);
  const [reorderSprintId, setReorderSprintId] = useState<string | null>(null);
  const [taskOrders, setTaskOrders] = useState<Record<string, string[]>>({});
  const dragTaskIdRef = useRef<string | null>(null);
  const [startModalSprint, setStartModalSprint] = useState<Sprint | null>(null);
  const [editModalSprint, setEditModalSprint] = useState<Sprint | null>(null);
  const [completeModalSprint, setCompleteModalSprint] = useState<Sprint | null>(null);
  const [statusMenuTaskId, setStatusMenuTaskId] = useState<string | null>(null);
  const [taskContextMenu, setTaskContextMenu] = useState<{ task: Task; pos: { x: number; y: number } } | null>(null);
  const [sprintGoals, setSprintGoals] = useState<Record<string, string>>({});
  const [searchQ, setSearchQ] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterAssignees, setFilterAssignees] = useState<Set<string>>(new Set());
  const [filterTypes, setFilterTypes] = useState<Set<string>>(new Set());
  const [filterPriorities, setFilterPriorities] = useState<Set<string>>(new Set());
  const [filterStatuses, setFilterStatuses] = useState<Set<string>>(new Set());
  const [filterEpics, setFilterEpics] = useState<Set<string>>(new Set());
  const sprintMenuRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const hasFilters = filterAssignees.size > 0 || filterTypes.size > 0 || filterPriorities.size > 0 || filterStatuses.size > 0 || filterEpics.size > 0;
  const clearFilters = () => { setFilterAssignees(new Set()); setFilterTypes(new Set()); setFilterPriorities(new Set()); setFilterStatuses(new Set()); setFilterEpics(new Set()); };

  const toggleSet = (set: Set<string>, val: string): Set<string> => {
    const n = new Set(set);
    n.has(val) ? n.delete(val) : n.add(val);
    return n;
  };

  const applyFilter = (task: Task): boolean => {
    if (searchQ && !task.title.toLowerCase().includes(searchQ.toLowerCase())) return false;
    if (filterAssignees.size > 0 && (!task.assignee || !filterAssignees.has(task.assignee.id))) return false;
    if (filterTypes.size > 0 && !filterTypes.has(task.type || "task")) return false;
    if (filterPriorities.size > 0 && !filterPriorities.has(task.priority)) return false;
    if (filterStatuses.size > 0 && !filterStatuses.has(task.status)) return false;
    if (filterEpics.size > 0 && !filterEpics.has(task.epicId ?? "")) return false;
    return true;
  };

  const projectId = selectedProject || "p1";
  const projectTasks = useMemo(() => tasks.filter(t => t.projectId === projectId), [tasks, projectId]);

  const allBacklogTasks = useMemo(() => projectTasks.filter(t => !t.sprintId), [projectTasks]);
  const backlogTasks = useMemo(
    () => allBacklogTasks.filter(applyFilter),
    [allBacklogTasks, searchQ, filterAssignees, filterTypes, filterPriorities, filterStatuses, filterEpics]
  );
  const backlogPoints = useMemo(() => ({
    total: allBacklogTasks.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0),
    done: allBacklogTasks.filter(t => t.status === "done").reduce((sum, t) => sum + (t.storyPoints ?? 0), 0),
  }), [allBacklogTasks]);

  const sprintGroups = useMemo(() =>
    sprints.map(s => {
      const allTasks = projectTasks.filter(t => t.sprintId === s.id);
      const filteredTasks = allTasks.filter(applyFilter);
      return {
        sprint: s,
        tasks: filteredTasks,
        totalCount: allTasks.length,
        totalPoints: allTasks.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0),
        donePoints: allTasks.filter(t => t.status === "done").reduce((sum, t) => sum + (t.storyPoints ?? 0), 0),
      };
    }), [sprints, projectTasks, searchQ, filterAssignees, filterTypes, filterPriorities, filterStatuses, filterEpics]);

  // Close filter panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilterPanel(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close sprint menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sprintMenuRef.current && !sprintMenuRef.current.contains(e.target as Node))
        setSprintMenuId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleCollapse = (id: string) =>
    setCollapsed(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const addQuickTask = (sprintId: string | null) => {
    if (!quickTitle.trim()) return;
    const newTask: Task = {
      id: `TASK-${Date.now()}`,
      title: quickTitle.trim(),
      type: quickType,
      status: "todo",
      priority: "normal",
      tags: [],
      createdAt: new Date().toISOString(),
      projectId,
      sprintId: sprintId || undefined,
      subtasks: [], comments: [], activityLog: [], dependencies: [], watchers: [],
    };
    onSaveTask(newTask);
    if (sprintId) {
      setSprints(p => p.map(s => s.id === sprintId ? { ...s, taskIds: [...s.taskIds, newTask.id] } : s));
    }
    setQuickTitle("");
    setQuickType("task");
    setAddingTo(null);
  };

  const hasActiveSprint = sprints.some(s => s.status === "active");

  const handleStartSprint = (sprint: Sprint, data: { name: string; startDate: string; endDate: string; goal: string }) => {
    setSprints(p => p.map(s => s.id === sprint.id
      ? { ...s, name: data.name, startDate: data.startDate, endDate: data.endDate, status: "active" as const }
      : s));
    if (data.goal.trim()) setSprintGoals(p => ({ ...p, [sprint.id]: data.goal.trim() }));
    setStartModalSprint(null);
  };

  const handleCompleteSprint = (sprint: Sprint, moveOpenToSprintId: string | null) => {
    const openTasks = projectTasks.filter(t => t.sprintId === sprint.id && t.status !== "done");
    openTasks.forEach(t => moveTaskToSprint(t, moveOpenToSprintId || undefined));
    setSprints(p => p.map(s => s.id === sprint.id ? { ...s, status: "completed" as const } : s));
    setCompleteModalSprint(null);
  };

  const handleEditSprint = (sprint: Sprint, data: { name: string; startDate: string; endDate: string; goal: string }) => {
    setSprints(p => p.map(s => s.id === sprint.id ? { ...s, name: data.name, startDate: data.startDate, endDate: data.endDate } : s));
    setSprintGoals(p => data.goal.trim() ? { ...p, [sprint.id]: data.goal.trim() } : (() => { const n = { ...p }; delete n[sprint.id]; return n; })());
    setEditModalSprint(null);
  };

  const handleDeleteSprint = (sprintId: string) => {
    // Move tasks back to backlog
    const toBacklog = projectTasks.filter(t => t.sprintId === sprintId);
    toBacklog.forEach(t => onSaveTask({ ...t, sprintId: undefined }));
    setSprints(p => p.filter(s => s.id !== sprintId));
    setSprintMenuId(null);
  };

  const handleCreateSprint = () => {
    const newId = `sp${Date.now()}`;
    const today = new Date();
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);
    const newSprint: Sprint = {
      id: newId,
      name: `Sprint ${sprints.length + 1}`,
      startDate: today.toISOString().split("T")[0],
      endDate: twoWeeksLater.toISOString().split("T")[0],
      status: "planning",
      goalPoints: 0,
      completedPoints: 0,
      taskIds: [],
    };
    setSprints(p => [...p, newSprint]);
  };

  const moveTaskToSprint = (task: Task, newSprintId: string | undefined) => {
    onSaveTask({ ...task, sprintId: newSprintId });
    setSprints(prev => prev.map(s => {
      if (s.id === task.sprintId) return { ...s, taskIds: s.taskIds.filter(id => id !== task.id) };
      if (s.id === newSprintId) return { ...s, taskIds: [...s.taskIds, task.id] };
      return s;
    }));
  };

  const handleStatusChange = (task: Task, newStatus: Task["status"]) => {
    onSaveTask({ ...task, status: newStatus });
    setStatusMenuTaskId(null);
  };

  const toggleReorder = (sprintId: string) => {
    setReorderSprintId(prev => prev === sprintId ? null : sprintId);
    setSprintMenuId(null);
  };

  const handleDragStart = (taskId: string, sprintId: string, currentTasks: Task[]) => {
    dragTaskIdRef.current = taskId;
    if (!taskOrders[sprintId]) {
      setTaskOrders(prev => ({ ...prev, [sprintId]: currentTasks.map(t => t.id) }));
    }
  };

  const handleDragOver = (overTaskId: string, sprintId: string, currentTasks: Task[]) => {
    const dragId = dragTaskIdRef.current;
    if (!dragId || dragId === overTaskId) return;
    setTaskOrders(prev => {
      const order = prev[sprintId] ?? currentTasks.map(t => t.id);
      const fromIdx = order.indexOf(dragId);
      const toIdx = order.indexOf(overTaskId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...order];
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, dragId);
      return { ...prev, [sprintId]: next };
    });
  };

  /* ── Mobile backlog ──────────────────────────────────────────────────────── */
  if (window.innerWidth < 768) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Toolbar */}
        <div className="px-3 py-2.5 border-b border-gray-100 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm task..."
              className="w-full pl-8 pr-3 py-2 text-[13px] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400" />
          </div>
          <button onClick={() => setShowFilterPanel(p => !p)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all shrink-0 ${hasFilters ? "border-blue-400 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-500"}`}>
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto pb-20">
          {sprintGroups.map(({ sprint, tasks: st, totalCount }) => {
            const isCollapsed = collapsed.has(sprint.id);
            const isActive = sprint.status === "active";
            const isCompleted = sprint.status === "completed";
            const filteredSt = st.filter(applyFilter);
            return (
              <div key={sprint.id} className="border-b border-gray-100">
                {/* Sprint header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50/60 sticky top-0 z-10">
                  <button onClick={() => toggleCollapse(sprint.id)} className="text-gray-400">
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0" onClick={() => toggleCollapse(sprint.id)}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[13px] font-semibold text-gray-800">{sprint.name}</span>
                      {isActive && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">Active</span>}
                      {isCompleted && <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-medium">Done</span>}
                      <span className="text-[11px] text-gray-400">({filteredSt.length}/{totalCount})</span>
                    </div>
                  </div>
                  {/* Sprint action */}
                  {sprint.status === "planning" && !hasActiveSprint && (
                    <button onClick={() => setStartModalSprint(sprint)}
                      className="px-2.5 py-1 text-[11px] rounded-lg border border-gray-200 bg-white text-gray-600 font-medium whitespace-nowrap">
                      Bắt đầu
                    </button>
                  )}
                  {isActive && (
                    <button onClick={() => setCompleteModalSprint(sprint)}
                      className="px-2.5 py-1 text-[11px] rounded-lg border border-gray-200 bg-white text-gray-600 font-medium whitespace-nowrap">
                      Hoàn thành
                    </button>
                  )}
                  <button onClick={() => setSprintMenuId(s => s === sprint.id ? null : sprint.id)}
                    className="w-7 h-7 flex items-center justify-center text-gray-400">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                {/* Tasks */}
                {!isCollapsed && (
                  <div>
                    {filteredSt.map(task => {
                      const st2 = STATUS_OPTIONS.find(o => o.value === task.status);
                      return (
                        <button key={task.id} onClick={() => onTaskClick(task)}
                          className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 active:bg-gray-50 transition-colors text-left">
                          <TaskTypeIcon type={task.type} />
                          <span className={`flex-1 text-[13px] min-w-0 truncate ${task.status === "done" ? "line-through text-gray-400" : "text-gray-800"}`}>{task.title}</span>
                          {st2 && (
                            <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded ${st2.cls}`}>{st2.label}</span>
                          )}
                        </button>
                      );
                    })}
                    <button onClick={() => { setAddingTo(sprint.id); setQuickTitle(""); }}
                      className="w-full px-4 py-2.5 text-left text-[13px] text-gray-400 flex items-center gap-2 active:bg-gray-50">
                      <Plus className="w-4 h-4" /> Thêm task
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Backlog section */}
          <div>
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50/60 sticky top-0 z-10">
              <button onClick={() => toggleCollapse("__backlog__")} className="text-gray-400">
                {collapsed.has("__backlog__") ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <div className="flex-1 flex items-center gap-1.5 cursor-pointer" onClick={() => toggleCollapse("__backlog__")}>
                <span className="text-[13px] font-semibold text-gray-800">Backlog</span>
                <span className="text-[11px] text-gray-400">({allBacklogTasks.length})</span>
              </div>
              <button onClick={handleCreateSprint}
                className="px-2.5 py-1 text-[11px] rounded-lg border border-gray-200 bg-white text-gray-600 font-medium whitespace-nowrap">
                + Sprint
              </button>
            </div>
            {!collapsed.has("__backlog__") && (
              <div>
                {backlogTasks.map(task => {
                  const st2 = STATUS_OPTIONS.find(o => o.value === task.status);
                  return (
                    <button key={task.id} onClick={() => onTaskClick(task)}
                      className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 active:bg-gray-50 transition-colors text-left">
                      <TaskTypeIcon type={task.type} />
                      <span className={`flex-1 text-[13px] min-w-0 truncate ${task.status === "done" ? "line-through text-gray-400" : "text-gray-800"}`}>{task.title}</span>
                      {st2 && (
                        <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded ${st2.cls}`}>{st2.label}</span>
                      )}
                    </button>
                  );
                })}
                <button onClick={() => { setAddingTo("__backlog__"); setQuickTitle(""); }}
                  className="w-full px-4 py-2.5 text-left text-[13px] text-gray-400 flex items-center gap-2 active:bg-gray-50">
                  <Plus className="w-4 h-4" /> Thêm task
                </button>
              </div>
            )}
          </div>
        </div>

        {/* FAB */}
        <button onClick={() => { setAddingTo("__backlog__"); setQuickTitle(""); }}
          className="absolute bottom-20 right-4 w-12 h-12 rounded-full bg-cyan-500 text-white shadow-lg flex items-center justify-center active:bg-cyan-600 z-10">
          <Plus className="w-5 h-5" />
        </button>

        {/* Modals */}
        {startModalSprint && <StartSprintModal sprint={startModalSprint} onClose={() => setStartModalSprint(null)} onStart={data => handleStartSprint(startModalSprint, data)} />}
        {editModalSprint && <EditSprintModal sprint={editModalSprint} initialGoal={sprintGoals[editModalSprint.id]} onClose={() => setEditModalSprint(null)} onSave={data => handleEditSprint(editModalSprint, data)} />}
        {completeModalSprint && <CompleteSprintModal sprint={completeModalSprint} sprints={sprints} onClose={() => setCompleteModalSprint(null)} onComplete={moveToId => handleCompleteSprint(completeModalSprint, moveToId)} />}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="px-4 py-2.5 border-b border-gray-100 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="relative max-w-xs flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search backlog"
              className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 text-gray-700"
            />
          </div>

          {/* Assignee quick-filter avatars */}
          <div className="flex items-center gap-1">
            {teamMembers.slice(0, 5).map(m => (
              <button
                key={m.id}
                onClick={() => setFilterAssignees(prev => toggleSet(prev, m.id))}
                title={m.name}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold transition-all border-2
                  ${filterAssignees.has(m.id) ? "border-blue-500 scale-110 shadow-md" : "border-transparent opacity-60 hover:opacity-100"}`}
                style={{ backgroundColor: m.color }}
              >
                {m.name.charAt(0)}
              </button>
            ))}
          </div>

          {/* Filter button */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilterPanel(p => !p)}
              className={`flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-lg border transition-all
                ${hasFilters || showFilterPanel
                  ? "border-blue-400 bg-blue-50 text-blue-600"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              <Filter className="w-3 h-3" />
              Filter
              {hasFilters && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center leading-none">
                  {filterAssignees.size + filterTypes.size + filterPriorities.size + filterStatuses.size + filterEpics.size}
                </span>
              )}
            </button>

            {showFilterPanel && (
              <div className="absolute left-0 top-full mt-1.5 bg-white rounded-2xl border border-gray-200 shadow-2xl w-72 z-40 py-3">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100">
                  <span className="text-[12px] font-semibold text-gray-700">Bộ lọc</span>
                  {hasFilters && (
                    <button onClick={clearFilters} className="text-[11px] text-blue-600 hover:underline">Xóa tất cả</button>
                  )}
                </div>

                {/* Assignee */}
                <div className="px-4 pt-3 pb-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Assignee</p>
                  <div className="flex flex-wrap gap-1.5">
                    {teamMembers.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setFilterAssignees(prev => toggleSet(prev, m.id))}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] border transition-all
                          ${filterAssignees.has(m.id)
                            ? "border-blue-400 bg-blue-50 text-blue-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}
                      >
                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                          style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</span>
                        {m.name.split(" ").pop()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type */}
                <div className="px-4 pt-2 pb-2 border-t border-gray-50">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Loại</p>
                  <div className="flex gap-1.5">
                    {([
                      { value: "task",  label: "Task",  icon: <CheckSquare2 className="w-3 h-3 text-blue-500" /> },
                      { value: "story", label: "Story", icon: <BookOpen className="w-3 h-3 text-emerald-500" /> },
                      { value: "bug",   label: "Bug",   icon: <AlertCircle className="w-3 h-3 text-red-500" /> },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setFilterTypes(prev => toggleSet(prev, opt.value))}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-all
                          ${filterTypes.has(opt.value)
                            ? "border-blue-400 bg-blue-50 text-blue-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}
                      >
                        {opt.icon}{opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div className="px-4 pt-2 pb-2 border-t border-gray-50">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Priority</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(["urgent","high","normal","low"] as const).map(p => {
                      const cfg = priorityConfig[p];
                      return (
                        <button
                          key={p}
                          onClick={() => setFilterPriorities(prev => toggleSet(prev, p))}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-all
                            ${filterPriorities.has(p)
                              ? "border-blue-400 bg-blue-50 text-blue-700"
                              : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status */}
                <div className="px-4 pt-2 pb-2 border-t border-gray-50">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setFilterStatuses(prev => toggleSet(prev, opt.value))}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-all
                          ${filterStatuses.has(opt.value)
                            ? "border-blue-400 bg-blue-50 text-blue-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}
                      >
                        <span className={`inline-block w-2 h-2 rounded-sm ${opt.cls.split(" ")[0]}`} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Epic */}
                {epics.filter(e => e.projectId === projectId).length > 0 && (
                  <div className="px-4 pt-2 pb-1 border-t border-gray-50">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Epic</p>
                    <div className="flex flex-wrap gap-1.5">
                      {epics.filter(e => e.projectId === projectId).map(epic => (
                        <button
                          key={epic.id}
                          onClick={() => setFilterEpics(prev => toggleSet(prev, epic.id))}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-all
                            ${filterEpics.has(epic.id)
                              ? "border-blue-400 bg-blue-50 text-blue-700"
                              : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}
                        >
                          <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: epic.color }} />
                          <span className="max-w-[120px] truncate">{epic.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="text-[11px] text-gray-400 hover:text-red-500 flex items-center gap-1 transition-all">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-1.5">
            {[...filterAssignees].map(id => {
              const m = teamMembers.find(x => x.id === id);
              return m ? (
                <span key={id} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[11px] text-blue-700">
                  <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</span>
                  {m.name.split(" ").pop()}
                  <button onClick={() => setFilterAssignees(prev => toggleSet(prev, id))}><X className="w-2.5 h-2.5" /></button>
                </span>
              ) : null;
            })}
            {[...filterTypes].map(t => (
              <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[11px] text-blue-700">
                {t} <button onClick={() => setFilterTypes(prev => toggleSet(prev, t))}><X className="w-2.5 h-2.5" /></button>
              </span>
            ))}
            {[...filterPriorities].map(p => (
              <span key={p} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[11px] text-blue-700">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityConfig[p as Task["priority"]].color }} />
                {priorityConfig[p as Task["priority"]].label}
                <button onClick={() => setFilterPriorities(prev => toggleSet(prev, p))}><X className="w-2.5 h-2.5" /></button>
              </span>
            ))}
            {[...filterStatuses].map(s => (
              <span key={s} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[11px] text-blue-700">
                {STATUS_OPTIONS.find(o => o.value === s)?.label}
                <button onClick={() => setFilterStatuses(prev => toggleSet(prev, s))}><X className="w-2.5 h-2.5" /></button>
              </span>
            ))}
            {[...filterEpics].map(id => {
              const epic = epics.find(e => e.id === id);
              return epic ? (
                <span key={id} className="flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px]"
                  style={{ backgroundColor: epic.color + "18", borderColor: epic.color + "50", color: epic.color }}>
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: epic.color }} />
                  {epic.title}
                  <button onClick={() => setFilterEpics(prev => toggleSet(prev, id))}><X className="w-2.5 h-2.5" /></button>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {sprintGroups.map(({ sprint, tasks: st, totalCount, totalPoints, donePoints }, idx) => {
          const isCollapsed = collapsed.has(sprint.id);
          const stats = getStats(st);
          const isActive = sprint.status === "active";
          const isCompleted = sprint.status === "completed";
          const isMenuOpen = sprintMenuId === sprint.id;
          const isFiltered = hasFilters || !!searchQ;

          return (
            <div key={sprint.id} className="border-b border-gray-100 last:border-0">
              {/* Sprint Header */}
              <div className="bg-gray-50/60 hover:bg-gray-50 sticky top-0 z-10 group/hdr">
                <div className="flex items-center gap-2 px-4 py-2.5">
                <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer shrink-0" />
                <button onClick={() => toggleCollapse(sprint.id)} className="shrink-0 text-gray-400 hover:text-gray-600">
                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleCollapse(sprint.id)}>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13px] font-semibold text-gray-800 shrink-0">{sprint.name}</span>
                    <span className="text-[11px] text-gray-400 shrink-0">
                      {formatDateRange(sprint.startDate, sprint.endDate)}{" "}
                      ({isFiltered && st.length !== totalCount ? `${st.length} of ` : ""}{totalCount} work item{totalCount !== 1 ? "s" : ""})
                    </span>
                    {isActive && (
                      <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium shrink-0">Active</span>
                    )}
                    {isCompleted && (
                      <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-medium shrink-0">Completed</span>
                    )}
                  </div>
                  {sprintGoals[sprint.id] && (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">🎯 {sprintGoals[sprint.id]}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <SprintStats {...stats} totalPoints={totalPoints} donePoints={donePoints} />

                  {sprint.status === "planning" && (
                    <button
                      onClick={() => !hasActiveSprint && setStartModalSprint(sprint)}
                      disabled={hasActiveSprint}
                      title={hasActiveSprint ? "Đang có sprint active. Hoàn thành sprint hiện tại trước khi bắt đầu sprint mới." : ""}
                      className={`px-3 py-1 text-[12px] rounded border font-medium whitespace-nowrap transition-all
                        ${hasActiveSprint
                          ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
                    >
                      Start sprint
                    </button>
                  )}
                  {isActive && (
                    <button
                      onClick={() => setCompleteModalSprint(sprint)}
                      className="px-3 py-1 text-[12px] rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-medium whitespace-nowrap"
                    >
                      Complete sprint
                    </button>
                  )}

                  {/* ... menu */}
                  <div className="relative" ref={isMenuOpen ? sprintMenuRef : undefined}>
                    <button
                      onClick={e => { e.stopPropagation(); setSprintMenuId(isMenuOpen ? null : sprint.id); }}
                      className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-all"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl w-48 py-1 z-30">
                        <button
                          onClick={() => toggleReorder(sprint.id)}
                          className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50"
                        >
                          {reorderSprintId === sprint.id ? "Done reordering" : "Reorder work items"}
                        </button>
                        <button onClick={() => { setEditModalSprint(sprint); setSprintMenuId(null); }}
                          className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50">Edit sprint</button>
                        <div className="h-px bg-gray-100 my-1" />
                        <button onClick={() => handleDeleteSprint(sprint.id)}
                          className="w-full text-left px-4 py-2 text-[13px] text-red-500 hover:bg-red-50">Delete sprint</button>
                      </div>
                    )}
                  </div>
                </div>
                </div>{/* end flex row */}
              </div>{/* end sprint header */}

              {/* Tasks */}
              {!isCollapsed && (
                <>
                  {(taskOrders[sprint.id]
                    ? taskOrders[sprint.id].map(id => st.find(t => t.id === id)).filter(Boolean) as Task[]
                    : st
                  ).map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onTaskClick={() => onTaskClick(task)}
                      onStatusChange={s => handleStatusChange(task, s)}
                      statusMenuOpen={statusMenuTaskId === task.id}
                      onStatusMenuToggle={() => setStatusMenuTaskId(prev => prev === task.id ? null : task.id)}
                      onStatusMenuClose={() => setStatusMenuTaskId(null)}
                      reorderMode={reorderSprintId === sprint.id}
                      onContextMenu={(e) => { e.preventDefault(); setTaskContextMenu({ task, pos: { x: e.clientX, y: e.clientY } }); }}
                      onDragStart={reorderSprintId === sprint.id ? () => handleDragStart(task.id, sprint.id, st) : undefined}
                      onDragOver={reorderSprintId === sprint.id ? () => handleDragOver(task.id, sprint.id, st) : undefined}
                      onDragEnd={reorderSprintId === sprint.id ? () => { dragTaskIdRef.current = null; } : undefined}
                    />
                  ))}

                  {/* Quick add */}
                  {addingTo === sprint.id ? (
                    <QuickAdd
                      value={quickTitle}
                      onChange={setQuickTitle}
                      type={quickType}
                      onTypeChange={setQuickType}
                      onSubmit={() => addQuickTask(sprint.id)}
                      onCancel={() => { setAddingTo(null); setQuickTitle(""); setQuickType("task"); }}
                    />
                  ) : (
                    <button
                      onClick={() => { setAddingTo(sprint.id); setQuickTitle(""); }}
                      className="w-full px-4 py-2 text-left text-[12px] text-gray-500 hover:text-blue-600 hover:bg-blue-50/30 flex items-center gap-2 border-t border-gray-50"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Backlog section */}
        <div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50/60 hover:bg-gray-50 sticky top-0 z-10">
            <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer shrink-0" />
            <button onClick={() => toggleCollapse("__backlog__")} className="shrink-0 text-gray-400 hover:text-gray-600">
              {collapsed.has("__backlog__") ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <div className="flex-1 min-w-0 flex items-baseline gap-2 cursor-pointer" onClick={() => toggleCollapse("__backlog__")}>
              <span className="text-[13px] font-semibold text-gray-800">Backlog</span>
              <span className="text-[11px] text-gray-400">
                ({(hasFilters || !!searchQ) && backlogTasks.length !== allBacklogTasks.length ? `${backlogTasks.length} of ` : ""}{allBacklogTasks.length} work item{allBacklogTasks.length !== 1 ? "s" : ""})
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <SprintStats {...getStats(backlogTasks)} totalPoints={backlogPoints.total} donePoints={backlogPoints.done} />
              <button
                onClick={handleCreateSprint}
                className="px-3 py-1 text-[12px] rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-medium whitespace-nowrap"
              >
                Create sprint
              </button>
            </div>
          </div>

          {!collapsed.has("__backlog__") && (
            <>
              {backlogTasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onTaskClick={() => onTaskClick(task)}
                  onStatusChange={s => handleStatusChange(task, s)}
                  statusMenuOpen={statusMenuTaskId === task.id}
                  onStatusMenuToggle={() => setStatusMenuTaskId(prev => prev === task.id ? null : task.id)}
                  onStatusMenuClose={() => setStatusMenuTaskId(null)}
                  onContextMenu={(e) => { e.preventDefault(); setTaskContextMenu({ task, pos: { x: e.clientX, y: e.clientY } }); }}
                />
              ))}

              {addingTo === "__backlog__" ? (
                <QuickAdd
                  value={quickTitle}
                  onChange={setQuickTitle}
                  type={quickType}
                  onTypeChange={setQuickType}
                  onSubmit={() => addQuickTask(null)}
                  onCancel={() => { setAddingTo(null); setQuickTitle(""); setQuickType("task"); }}
                />
              ) : (
                <button
                  onClick={() => { setAddingTo("__backlog__"); setQuickTitle(""); }}
                  className="w-full px-4 py-2 text-left text-[12px] text-gray-500 hover:text-blue-600 hover:bg-blue-50/30 flex items-center gap-2 border-t border-gray-50"
                >
                  <Plus className="w-3.5 h-3.5" /> Create
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Start sprint modal */}
      {startModalSprint && (
        <StartSprintModal
          sprint={startModalSprint}
          taskCount={sprintGroups.find(g => g.sprint.id === startModalSprint.id)?.tasks.length ?? 0}
          onClose={() => setStartModalSprint(null)}
          onStart={data => handleStartSprint(startModalSprint, data)}
        />
      )}

      {/* Edit sprint modal */}
      {editModalSprint && (
        <EditSprintModal
          sprint={editModalSprint}
          initialGoal={sprintGoals[editModalSprint.id]}
          onClose={() => setEditModalSprint(null)}
          onSave={data => handleEditSprint(editModalSprint, data)}
        />
      )}

      {/* Complete sprint modal */}
      {completeModalSprint && (
        <CompleteSprintModal
          sprint={completeModalSprint}
          sprintTasks={sprintGroups.find(g => g.sprint.id === completeModalSprint.id)?.tasks ?? []}
          otherSprints={sprints.filter(s => s.id !== completeModalSprint.id)}
          onClose={() => setCompleteModalSprint(null)}
          onComplete={moveOpenToSprintId => handleCompleteSprint(completeModalSprint, moveOpenToSprintId)}
        />
      )}

      {/* Task context menu */}
      {taskContextMenu && (
        <TaskContextMenu
          task={taskContextMenu.task}
          pos={taskContextMenu.pos}
          sprints={sprints.filter(s => s.status !== "completed")}
          onClose={() => setTaskContextMenu(null)}
          onOpen={() => { onTaskClick(taskContextMenu.task); setTaskContextMenu(null); }}
          onMoveToSprint={(sprintId) => { moveTaskToSprint(taskContextMenu.task, sprintId); setTaskContextMenu(null); }}
          onSendToBacklog={() => { moveTaskToSprint(taskContextMenu.task, undefined); setTaskContextMenu(null); }}
          onDelete={() => { onDeleteTask?.(taskContextMenu.task.id); setTaskContextMenu(null); }}
        />
      )}
    </div>
  );
}

// ── Task Row ──────────────────────────────────────────────────────────────────

function TaskRow({ task, onTaskClick, onStatusChange, statusMenuOpen, onStatusMenuToggle, onStatusMenuClose, reorderMode = false, onContextMenu, onDragStart, onDragOver, onDragEnd }: {
  task: Task;
  onTaskClick: () => void;
  onStatusChange: (s: Task["status"]) => void;
  statusMenuOpen: boolean;
  onStatusMenuToggle: () => void;
  onStatusMenuClose: () => void;
  reorderMode?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDragStart?: () => void;
  onDragOver?: () => void;
  onDragEnd?: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const isDone = task.status === "done";

  useEffect(() => {
    if (!statusMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onStatusMenuClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusMenuOpen, onStatusMenuClose]);

  const priorityCfg = priorityConfig[task.priority];

  return (
    <div
      draggable={reorderMode}
      onDragStart={onDragStart}
      onDragOver={e => { if (reorderMode) { e.preventDefault(); onDragOver?.(); } }}
      onDragEnd={onDragEnd}
      className={`group/row flex items-center gap-2 px-4 py-1.5 border-b border-gray-50 hover:bg-blue-50/20 transition-colors min-h-[36px] ${reorderMode ? "cursor-grab active:cursor-grabbing" : ""}`}
      onContextMenu={onContextMenu}
    >
      {/* Checkbox */}
      <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer shrink-0" />

      {/* Drag handle — always visible in reorder mode */}
      <GripVertical className={`w-3 h-3 text-gray-400 shrink-0 cursor-move transition-opacity ${reorderMode ? "opacity-100" : "opacity-0 group-hover/row:opacity-100"}`} />

      {/* Task type icon */}
      <TaskTypeIcon type={task.type} />

      {/* Epic label */}
      {task.epicId && (() => {
        const epic = epics.find(e => e.id === task.epicId);
        return epic ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 max-w-[90px] truncate"
            style={{ backgroundColor: epic.color + "18", color: epic.color }}>
            {epic.title}
          </span>
        ) : null;
      })()}

      {/* ID + Title */}
      <div className="flex-1 min-w-0 flex items-center gap-2 cursor-pointer" onClick={onTaskClick}>
        <span className={`text-[11px] font-medium shrink-0 ${isDone ? "text-gray-300 line-through" : "text-gray-400"}`}>{task.id}</span>
        <span className={`text-[12px] truncate ${isDone ? "text-gray-400 line-through" : "text-gray-700"}`}>{task.title}</span>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {/* Story points */}
        {task.storyPoints !== undefined && (
          <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-medium bg-gray-100 text-gray-500 shrink-0">
            {task.storyPoints}
          </span>
        )}

        {/* Status dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={e => { e.stopPropagation(); onStatusMenuToggle(); }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide transition-all ${getStatusCls(task.status)}`}
          >
            {getStatusLabel(task.status)}
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>
          {statusMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl w-36 py-1 z-30">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onStatusChange(opt.value)}
                  className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-gray-50 flex items-center gap-2 ${task.status === opt.value ? "font-semibold" : ""}`}
                >
                  <span className={`inline-block w-2 h-2 rounded-sm ${opt.cls.split(" ")[0]}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Priority dot */}
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: priorityCfg.color }}
          title={priorityCfg.label}
        />

        {/* Assignee */}
        {task.assignee ? (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 cursor-pointer"
            style={{ backgroundColor: task.assignee.color }}
            title={task.assignee.name}
          >
            {task.assignee.name.charAt(0)}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center shrink-0 hover:border-gray-400 cursor-pointer" title="Assign">
            <span className="text-gray-300 text-[10px]">+</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Task Context Menu ─────────────────────────────────────────────────────────

function TaskContextMenu({ task, pos, sprints, onClose, onOpen, onMoveToSprint, onSendToBacklog, onDelete }: {
  task: Task;
  pos: { x: number; y: number };
  sprints: Sprint[];
  onClose: () => void;
  onOpen: () => void;
  onMoveToSprint: (sprintId: string) => void;
  onSendToBacklog: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const menuW = 200, menuH = 220;
  const x = Math.min(pos.x, window.innerWidth - menuW - 8);
  const y = Math.min(pos.y, window.innerHeight - menuH - 8);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const esc   = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [onClose]);

  const otherSprints = sprints.filter(s => s.id !== task.sprintId);

  return (
    <div ref={ref} style={{ position: "fixed", top: y, left: x, zIndex: 60 }}
      className="bg-white rounded-xl border border-gray-200 shadow-2xl w-[200px] py-1.5 overflow-hidden">
      <button onClick={onOpen}
        className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50">
        Mở task
      </button>

      <div className="h-px bg-gray-100 my-1" />

      {/* Move to sprint */}
      {otherSprints.map(s => (
        <button key={s.id} onClick={() => onMoveToSprint(s.id)}
          className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Chuyển sang {s.name}</span>
        </button>
      ))}

      {/* Send to backlog — only if task is in a sprint */}
      {task.sprintId && (
        <button onClick={onSendToBacklog}
          className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2">
          <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          Chuyển về Backlog
        </button>
      )}
      <div className="h-px bg-gray-100 mx-3 my-1" />
      <button onClick={onDelete}
        className="w-full text-left px-4 py-2 text-[13px] text-red-500 hover:bg-red-50 flex items-center gap-2">
        <X className="w-3.5 h-3.5 shrink-0" />
        Xóa task
      </button>
    </div>
  );
}

// ── Quick Add ─────────────────────────────────────────────────────────────────

function QuickAdd({ value, onChange, type, onTypeChange, onSubmit, onCancel }: {
  value: string;
  onChange: (v: string) => void;
  type: TaskType;
  onTypeChange: (t: TaskType) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const [showTypePicker, setShowTypePicker] = useState(false);
  const cfg = taskTypeConfig[type];

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100 bg-blue-50/20">
      {/* Type selector */}
      <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setShowTypePicker(o => !o)}
          className="flex items-center gap-0.5 px-1.5 py-1 rounded-md hover:bg-gray-100 transition-colors"
          title="Chọn loại"
        >
          <TaskTypeIcon type={type} />
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>
        {showTypePicker && (
          <div className="absolute left-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl py-1 z-30 w-[150px]">
            {(["task", "story", "bug"] as TaskType[]).map(t => {
              const c = taskTypeConfig[t];
              return (
                <button
                  key={t}
                  onClick={() => { onTypeChange(t); setShowTypePicker(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-left transition-colors ${type === t ? "bg-gray-50" : ""}`}
                >
                  <TaskTypeIcon type={t} />
                  <span className="text-[12px] text-gray-700">{c.label}</span>
                  {type === t && <Check className="w-3 h-3 text-blue-500 ml-auto" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <input
        autoFocus
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") onSubmit(); if (e.key === "Escape") onCancel(); }}
        placeholder="Describe what needs to be done."
        className="flex-1 text-[12px] bg-transparent outline-none text-gray-800 placeholder-gray-400"
      />
      <button onClick={onSubmit} disabled={!value.trim()} className="px-2.5 py-1 text-[11px] bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 transition-all">Create ↵</button>
      <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}
