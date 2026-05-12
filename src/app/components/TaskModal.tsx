import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  X, Calendar, Tag, User, Flag, Plus, CheckSquare, Square, Layers,
  MessageSquare, Clock, Eye, Activity, Send, ListChecks,
  ChevronDown, ChevronRight, MoreHorizontal, Paperclip, Smile,
  Copy, Link2, Trash2, ArrowUpRight, ExternalLink, FolderOpen,
  AlertTriangle, Zap, Play, Pause, Hash, ChevronUp, GripVertical,
  Pencil, Reply, ThumbsUp, Heart, Check, RotateCcw, Filter,
  Bug, BookOpen, CheckSquare2,
} from "lucide-react";
import { type Task, type TaskType, type WorkLog, taskTypeConfig, type TaskComment, type ActivityEntry, type Checklist, statusConfig, priorityConfig, teamMembers, projects, tagColors, initialTasks, epics, sprints } from "./data";
import type { CustomStatusMap } from "../App";
import { CommentActions } from "./CommentActions";

function TaskTypeIcon({ type }: { type?: string }) {
  if (type === "bug")   return <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-red-500 shrink-0"><Bug      className="w-2.5 h-2.5 text-white" /></span>;
  if (type === "story") return <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-emerald-500 shrink-0"><BookOpen className="w-2.5 h-2.5 text-white" /></span>;
  if (type === "epic")  return <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-violet-500 shrink-0"><Zap      className="w-2.5 h-2.5 text-white" /></span>;
  return                       <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm bg-blue-500 shrink-0"><CheckSquare2 className="w-2.5 h-2.5 text-white" /></span>;
}

interface TaskModalProps {
  task: Task | null;
  isNew: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete?: (id: string) => void;
  defaultProjectId?: string;
  defaultType?: TaskType;
  allTasks?: Task[];
  prevTaskId?: string;
  nextTaskId?: string;
  onNavigate?: (taskId: string) => void;
  customStatusConfig?: CustomStatusMap;
}

type TabType = "details" | "comments" | "checklists" | "activity" | "worklog";

export function TaskModal({ task, isNew, onClose, onSave, onDelete, defaultProjectId, defaultType, allTasks, prevTaskId, nextTaskId, onNavigate, customStatusConfig }: TaskModalProps) {
  const effectiveStatusConfig: Record<string, { label: string; color: string }> = { ...statusConfig, ...customStatusConfig };
  const taskList = allTasks || initialTasks;
  const [formData, setFormData] = useState<Task>(task || {
    id: `t${Date.now()}`, title: "", description: "", status: "todo", priority: "normal",
    type: defaultType || "task",
    assignee: undefined, dueDate: "", startDate: "", tags: [], subtasks: [],
    createdAt: new Date().toISOString(), projectId: defaultProjectId || "p1",
    timeEstimate: 0, timeSpent: 0, dependencies: [], watchers: [], comments: [], activityLog: [], checklists: [],
    reporterId: "u1", workLogs: [],
  });
  const [newTag, setNewTag] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("comments");
  const [newComment, setNewComment] = useState("");
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState<Record<string, string>>({});
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingChecklistTitle, setEditingChecklistTitle] = useState("");
  const [editingCheckItemId, setEditingCheckItemId] = useState<string | null>(null);
  const [editingCheckItemText, setEditingCheckItemText] = useState("");
  const [showCheckItemAssignee, setShowCheckItemAssignee] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [showReporterPicker, setShowReporterPicker] = useState(false);
  const [showLinkedMenu, setShowLinkedMenu] = useState(false);
  const [linkedSearch, setLinkedSearch] = useState("");
  const [newWorkLogDate, setNewWorkLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [newWorkLogTime, setNewWorkLogTime] = useState("");
  const [newWorkLogNote, setNewWorkLogNote] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isNew) titleRef.current?.focus(); }, [isNew]);

  // Close pickers on click outside
  useEffect(() => {
    const handler = () => { setShowStatusPicker(false); setShowPriorityPicker(false); setShowAssigneePicker(false); setShowQuickActions(false); setShowTypePicker(false); setShowCheckItemAssignee(null); setShowReporterPicker(false); setShowLinkedMenu(false); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingCommentId || editingChecklistId || editingCheckItemId) {
          setEditingCommentId(null); setEditingChecklistId(null); setEditingCheckItemId(null);
          return;
        }
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleSave(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [formData, editingCommentId, editingChecklistId, editingCheckItemId]);

  // Timer
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const fmtTimer = (s: number) => {
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // ============ ACTIVITY LOGGING ============
  const recordActivity = useCallback((action: string, field?: string, oldValue?: string, newValue?: string) => {
    const entry: ActivityEntry = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      userId: "u1", action, field, oldValue, newValue,
      timestamp: new Date().toISOString(),
    };
    setFormData(prev => ({ ...prev, activityLog: [...(prev.activityLog || []), entry] }));
  }, []);

  // ============ CORE ACTIONS ============
  const handleSave = () => { if (!formData.title.trim()) return; onSave(formData); onClose(); };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      const tag = newTag.trim();
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      recordActivity("đã thêm tag", undefined, undefined, tag);
      setNewTag("");
    }
  };
  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
    recordActivity("đã xoá tag", undefined, tag);
  };


  // ============ COMMENT ACTIONS ============
  const addComment = () => {
    if (!newComment.trim()) return;
    const comment: TaskComment = { id: `c${Date.now()}`, userId: "u1", content: newComment.trim(), timestamp: new Date().toISOString(), reactions: [] };
    setFormData(prev => ({ ...prev, comments: [...(prev.comments || []), comment] }));
    recordActivity("đã thêm bình luận");
    setNewComment("");
  };
  const deleteComment = (cId: string) => {
    setFormData(prev => ({ ...prev, comments: (prev.comments || []).filter(c => c.id !== cId) }));
    recordActivity("đã xoá bình luận");
  };
  const saveCommentEdit = () => {
    if (!editingCommentId || !editingCommentText.trim()) return;
    setFormData(prev => ({
      ...prev, comments: (prev.comments || []).map(c => c.id === editingCommentId ? { ...c, content: editingCommentText.trim() } : c)
    }));
    setEditingCommentId(null);
  };
  const addReply = (parentId: string) => {
    if (!replyText.trim()) return;
    const reply: TaskComment = { id: `c${Date.now()}`, userId: "u1", content: `↳ ${replyText.trim()}`, timestamp: new Date().toISOString(), reactions: [] };
    // Insert reply right after parent
    setFormData(prev => {
      const comments = [...(prev.comments || [])];
      const parentIdx = comments.findIndex(c => c.id === parentId);
      comments.splice(parentIdx + 1, 0, reply);
      return { ...prev, comments };
    });
    setReplyingToCommentId(null);
    setReplyText("");
  };
  const toggleCommentReaction = (commentId: string, emoji: string) => {
    setFormData(prev => ({
      ...prev, comments: (prev.comments || []).map(c => {
        if (c.id !== commentId) return c;
        const reactions = c.reactions || [];
        const existing = reactions.find(r => r.emoji === emoji);
        if (existing) {
          const hasUser = existing.userIds.includes("u1");
          if (hasUser) {
            const updated = reactions.map(r => r.emoji === emoji ? { ...r, userIds: r.userIds.filter(u => u !== "u1") } : r).filter(r => r.userIds.length > 0);
            return { ...c, reactions: updated };
          } else {
            return { ...c, reactions: reactions.map(r => r.emoji === emoji ? { ...r, userIds: [...r.userIds, "u1"] } : r) };
          }
        }
        return { ...c, reactions: [...reactions, { emoji, userIds: ["u1"] }] };
      })
    }));
  };

  // ============ CHECKLIST ACTIONS ============
  const addChecklist = () => {
    if (!newChecklistTitle.trim()) return;
    setFormData(prev => ({ ...prev, checklists: [...(prev.checklists || []), { id: `cl${Date.now()}`, title: newChecklistTitle.trim(), items: [] }] }));
    recordActivity("đã thêm checklist", undefined, undefined, newChecklistTitle.trim());
    setNewChecklistTitle("");
  };
  const deleteChecklist = (clId: string) => {
    const cl = (formData.checklists || []).find(c => c.id === clId);
    setFormData(prev => ({ ...prev, checklists: (prev.checklists || []).filter(c => c.id !== clId) }));
    if (cl) recordActivity("đã xoá checklist", undefined, cl.title);
  };
  const saveChecklistRename = () => {
    if (!editingChecklistId || !editingChecklistTitle.trim()) return;
    const old = (formData.checklists || []).find(c => c.id === editingChecklistId)?.title;
    setFormData(prev => ({
      ...prev, checklists: (prev.checklists || []).map(cl => cl.id === editingChecklistId ? { ...cl, title: editingChecklistTitle.trim() } : cl)
    }));
    if (old && old !== editingChecklistTitle.trim()) recordActivity("đã đổi tên checklist", undefined, old, editingChecklistTitle.trim());
    setEditingChecklistId(null);
  };
  const addChecklistItem = (clId: string) => {
    const text = newChecklistItem[clId];
    if (!text?.trim()) return;
    setFormData(prev => ({
      ...prev, checklists: prev.checklists?.map(cl =>
        cl.id === clId ? { ...cl, items: [...cl.items, { id: `cli${Date.now()}`, text: text.trim(), done: false }] } : cl
      )
    }));
    setNewChecklistItem(prev => ({ ...prev, [clId]: "" }));
  };
  const deleteChecklistItem = (clId: string, itemId: string) => {
    setFormData(prev => ({
      ...prev, checklists: prev.checklists?.map(cl =>
        cl.id === clId ? { ...cl, items: cl.items.filter(i => i.id !== itemId) } : cl
      )
    }));
  };
  const toggleChecklistItem = (clId: string, itemId: string) => {
    setFormData(prev => ({
      ...prev, checklists: prev.checklists?.map(cl =>
        cl.id === clId ? { ...cl, items: cl.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i) } : cl
      )
    }));
  };
  const saveCheckItemEdit = (clId: string) => {
    if (!editingCheckItemId || !editingCheckItemText.trim()) return;
    setFormData(prev => ({
      ...prev, checklists: prev.checklists?.map(cl =>
        cl.id === clId ? { ...cl, items: cl.items.map(i => i.id === editingCheckItemId ? { ...i, text: editingCheckItemText.trim() } : i) } : cl
      )
    }));
    setEditingCheckItemId(null);
  };
  const assignChecklistItem = (clId: string, itemId: string, userId: string | undefined) => {
    setFormData(prev => ({
      ...prev, checklists: prev.checklists?.map(cl =>
        cl.id === clId ? { ...cl, items: cl.items.map(i => i.id === itemId ? { ...i, assigneeId: userId } : i) } : cl
      )
    }));
    setShowCheckItemAssignee(null);
  };

  // ============ WORK LOG ACTIONS ============
  const addWorkLog = () => {
    const mins = parseInt(newWorkLogTime);
    if (!mins || mins <= 0 || !newWorkLogDate) return;
    const log: WorkLog = { id: `wl${Date.now()}`, userId: "u1", date: newWorkLogDate, timeSpent: mins, note: newWorkLogNote.trim() || undefined };
    setFormData(prev => ({
      ...prev,
      workLogs: [...(prev.workLogs || []), log],
      timeSpent: (prev.timeSpent || 0) + mins,
    }));
    recordActivity("đã ghi nhận thời gian", undefined, undefined, fmtTime(mins));
    setNewWorkLogTime("");
    setNewWorkLogNote("");
  };
  const deleteWorkLog = (id: string) => {
    const log = (formData.workLogs || []).find(l => l.id === id);
    setFormData(prev => ({
      ...prev,
      workLogs: (prev.workLogs || []).filter(l => l.id !== id),
      timeSpent: Math.max(0, (prev.timeSpent || 0) - (log?.timeSpent || 0)),
    }));
  };

  // ============ LINKED ITEMS ACTIONS ============
  const addDependency = (taskId: string) => {
    if ((formData.dependencies || []).includes(taskId)) return;
    setFormData(prev => ({ ...prev, dependencies: [...(prev.dependencies || []), taskId] }));
    setShowLinkedMenu(false);
    setLinkedSearch("");
  };
  const removeDependency = (taskId: string) => {
    setFormData(prev => ({ ...prev, dependencies: (prev.dependencies || []).filter(id => id !== taskId) }));
  };

  // ============ TRACKED SETTERS (with activity logging) ============
  const setStatus = (newStatus: Task["status"]) => {
    const oldLabel = statusConfig[formData.status].label;
    const newLabel = statusConfig[newStatus].label;
    setFormData(prev => ({ ...prev, status: newStatus }));
    recordActivity("đã thay đổi", "trạng thái", oldLabel, newLabel);
    setShowStatusPicker(false);
  };
  const setPriority = (newPriority: Task["priority"]) => {
    const oldLabel = priorityConfig[formData.priority].label;
    const newLabel = priorityConfig[newPriority].label;
    setFormData(prev => ({ ...prev, priority: newPriority }));
    recordActivity("đã thay đổi", "ưu tiên", oldLabel, newLabel);
    setShowPriorityPicker(false);
  };
  const setAssignee = (member: typeof teamMembers[0] | undefined) => {
    const oldName = formData.assignee?.name || "Chưa phân công";
    const newName = member?.name || "Chưa phân công";
    setFormData(prev => ({ ...prev, assignee: member }));
    recordActivity("đã thay đổi", "người phụ trách", oldName, newName);
    setShowAssigneePicker(false);
  };
  const setDueDate = (date: string) => {
    const old = formData.dueDate || "chưa đặt";
    setFormData(prev => ({ ...prev, dueDate: date }));
    if (date !== formData.dueDate) recordActivity("đã thay đổi", "deadline", old, date || "chưa đặt");
  };
  const setStartDate = (date: string) => {
    const old = formData.startDate || "chưa đặt";
    setFormData(prev => ({ ...prev, startDate: date }));
    if (date !== formData.startDate) recordActivity("đã thay đổi", "ngày bắt đầu", old, date || "chưa đặt");
  };

  const toggleWatcher = (userId: string) => {
    const member = teamMembers.find(m => m.id === userId);
    const isWatching = formData.watchers?.includes(userId);
    setFormData(prev => ({
      ...prev, watchers: isWatching ? prev.watchers!.filter(w => w !== userId) : [...(prev.watchers || []), userId]
    }));
    recordActivity(isWatching ? "đã xoá watcher" : "đã thêm watcher", undefined, undefined, member?.name);
  };


  // ============ HEADER ACTIONS ============
  const copyId = () => {
    navigator.clipboard?.writeText(formData.id).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  const copyLink = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/task/${formData.id}`).catch(() => {});
    setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000);
  };
  const duplicateTask = () => {
    const dup: Task = { ...formData, id: `t${Date.now()}`, title: `${formData.title} (copy)`, createdAt: new Date().toISOString(), startDate: undefined, dueDate: undefined, comments: [], activityLog: [], parentId: undefined };
    onSave(dup);
    setShowQuickActions(false);
  };

  // ============ COMPUTED ============

  const fmtTime = (mins: number) => { const h = Math.floor(mins / 60); const m = mins % 60; return h > 0 ? `${h}h ${m}m` : `${m}m`; };
  const timePct = formData.timeEstimate ? Math.min(100, Math.round(((formData.timeSpent || 0) / formData.timeEstimate) * 100)) : 0;
  const isOvertime = (formData.timeSpent || 0) > (formData.timeEstimate || Infinity);

  const project = projects.find(p => p.id === formData.projectId);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isOverdue = formData.dueDate && new Date(formData.dueDate) < today && formData.status !== "done";
  const daysUntilDue = formData.dueDate ? Math.ceil((new Date(formData.dueDate).getTime() - today.getTime()) / 86400000) : null;

  const totalCheckItems = (formData.checklists || []).reduce((a, cl) => a + cl.items.length, 0);
  const doneCheckItems = (formData.checklists || []).reduce((a, cl) => a + cl.items.filter(i => i.done).length, 0);

  // Activity filter
  const filteredActivity = useMemo(() => {
    const log = formData.activityLog || [];
    if (activityFilter === "all") return log;
    return log.filter(e => {
      if (activityFilter === "status") return e.field === "trạng thái";
      if (activityFilter === "assignee") return e.field === "người phụ trách";
      if (activityFilter === "comment") return e.action?.includes("bình luận");
      if (activityFilter === "checklist") return e.action?.includes("checklist") || e.action?.includes("subtask");
      return true;
    });
  }, [formData.activityLog, activityFilter]);

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "comments", label: "Bình luận", icon: <MessageSquare className="w-3.5 h-3.5" />, count: formData.comments?.length },
    { id: "checklists", label: "Checklist", icon: <ListChecks className="w-3.5 h-3.5" />, count: formData.checklists?.length },
    { id: "worklog", label: "Work log", icon: <Clock className="w-3.5 h-3.5" />, count: formData.workLogs?.length },
    { id: "activity", label: "Lịch sử", icon: <Activity className="w-3.5 h-3.5" />, count: formData.activityLog?.length },
  ];

  const totalWorkLogTime = (formData.workLogs || []).reduce((s, l) => s + l.timeSpent, 0);

  const commentReactionEmojis = ["👍", "❤️", "😂", "🎉", "👀", "🔥"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-300">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 flex-1 min-w-0">
            {project && (
              <>
                <div className="w-4 h-4 rounded flex items-center justify-center text-[6px] text-white shrink-0" style={{ backgroundColor: project.color }}>{project.icon}</div>
                <span className="truncate">{project.name}</span>
                <ChevronRight className="w-3 h-3 shrink-0" />
              </>
            )}
            <TaskTypeIcon type={formData.type} />
            <span className="text-gray-600 truncate">{isNew ? "Công việc mới" : formData.title || "Chưa đặt tên"}</span>
            {!isNew && (
              <button onClick={copyId} className="flex items-center gap-1 ml-1 text-[9px] text-gray-400 hover:text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded transition-all">
                <Hash className="w-2.5 h-2.5" />{formData.id}
                {copied && <span className="text-emerald-500 ml-0.5">✓ Đã sao</span>}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onNavigate && (
              <>
                <button onClick={() => prevTaskId && onNavigate(prevTaskId)} disabled={!prevTaskId}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${prevTaskId ? "hover:bg-gray-200 text-gray-400 hover:text-gray-600" : "text-gray-200 cursor-not-allowed"}`}
                  title="Task trước">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button onClick={() => nextTaskId && onNavigate(nextTaskId)} disabled={!nextTaskId}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${nextTaskId ? "hover:bg-gray-200 text-gray-400 hover:text-gray-600" : "text-gray-200 cursor-not-allowed"}`}
                  title="Task tiếp theo">
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-gray-200 mx-0.5" />
              </>
            )}
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowQuickActions(!showQuickActions)}
                className="w-7 h-7 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showQuickActions && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl py-1 z-30 w-[170px]">
                  <button onClick={duplicateTask} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50"><Copy className="w-3 h-3" /> Nhân bản</button>
                  <button onClick={() => { copyLink(); setShowQuickActions(false); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50">
                    <Link2 className="w-3 h-3" /> {copiedLink ? "✓ Đã sao chép!" : "Sao chép liên kết"}
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50"><ExternalLink className="w-3 h-3" /> Mở rộng</button>
                  <div className="h-px bg-gray-100 my-1 mx-3" />
                  {!isNew && onDelete && (
                    <button onClick={() => { onDelete(formData.id); onClose(); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] text-red-500 hover:bg-red-50"><Trash2 className="w-3 h-3" /> Xoá task</button>
                  )}
                </div>
              )}
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body: 2-column layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Main content */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Title + Description */}
            <div className="px-6 pt-5 pb-3 shrink-0">
              <input ref={titleRef} type="text" placeholder={formData.type === "story" ? "Tên Story..." : formData.type === "bug" ? "Mô tả Bug..." : formData.type === "epic" ? "Tên Epic..." : "Tên Task..."} value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full text-[18px] text-gray-900 placeholder-gray-300 border-none outline-none bg-transparent tracking-tight" />
              <textarea placeholder="Thêm mô tả..." value={formData.description || ""}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full text-[13px] text-gray-600 placeholder-gray-300 border-none outline-none bg-transparent resize-none mt-2 min-h-[40px] leading-relaxed" rows={2} />
            </div>

            {/* Linked work items */}
            {((formData.dependencies?.length || 0) > 0 || true) && (
              <div className="px-6 pb-3 shrink-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1"><Link2 className="w-2.5 h-2.5" /> Liên kết công việc</span>
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowLinkedMenu(o => !o)}
                      className="flex items-center gap-1 text-[9px] text-cyan-600 hover:text-cyan-700 px-1.5 py-0.5 rounded hover:bg-cyan-50 transition-all">
                      <Plus className="w-2.5 h-2.5" /> Thêm
                    </button>
                    {showLinkedMenu && (
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-30 w-[240px]">
                        <div className="p-2 border-b border-gray-100">
                          <input type="text" placeholder="Tìm task..." value={linkedSearch} onChange={e => setLinkedSearch(e.target.value)}
                            className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-400 text-gray-700" autoFocus />
                        </div>
                        <div className="max-h-[160px] overflow-y-auto py-1">
                          {taskList.filter(t => t.id !== formData.id && !(formData.dependencies || []).includes(t.id) && (linkedSearch === "" || t.title.toLowerCase().includes(linkedSearch.toLowerCase()))).slice(0, 8).map(t => (
                            <button key={t.id} onClick={() => addDependency(t.id)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-left">
                              <span className="text-[9px] text-gray-400 shrink-0">{t.id}</span>
                              <span className="text-[11px] text-gray-700 truncate">{t.title}</span>
                            </button>
                          ))}
                          {taskList.filter(t => t.id !== formData.id && !(formData.dependencies || []).includes(t.id) && (linkedSearch === "" || t.title.toLowerCase().includes(linkedSearch.toLowerCase()))).length === 0 && (
                            <p className="text-[10px] text-gray-400 text-center py-3">Không tìm thấy task</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {(formData.dependencies?.length || 0) === 0 ? (
                  <p className="text-[10px] text-gray-300 italic">Chưa có công việc liên kết nào</p>
                ) : (
                  <div className="space-y-1">
                    {(formData.dependencies || []).map(depId => {
                      const dep = taskList.find(t => t.id === depId);
                      return (
                        <div key={depId} className="group flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-100">
                          <ArrowUpRight className="w-3 h-3 text-gray-300 shrink-0" />
                          <span className="text-[9px] text-gray-400 shrink-0">{depId}</span>
                          <span className="text-[11px] text-gray-600 flex-1 truncate">{dep?.title || "Task đã bị xoá"}</span>
                          {dep && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: statusConfig[dep.status].color }} />}
                          <button onClick={() => removeDependency(depId)}
                            className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition-all">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-0.5 px-6 border-b border-gray-200 shrink-0">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[11px] border-b-2 transition-all ${activeTab === tab.id ? "text-cyan-700 border-cyan-500" : "text-gray-500 border-transparent hover:text-gray-700"}`}>
                  {tab.icon} {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-gray-100 text-gray-500 text-[9px] flex items-center justify-center">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">

              {/* ==================== COMMENTS TAB ==================== */}
              {activeTab === "comments" && (
                <div className="p-6">
                  <div className="space-y-3 mb-5">
                    {(formData.comments || []).length === 0 && (
                      <div className="text-center py-8">
                        <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-[12px] text-gray-400">Chưa có bình luận nào</p>
                        <p className="text-[10px] text-gray-300 mt-1">Hãy bắt đầu thảo luận về task này</p>
                      </div>
                    )}
                    {(formData.comments || []).map(comment => {
                      const user = teamMembers.find(m => m.id === comment.userId);
                      const isOwn = comment.userId === "u1";
                      const isEditing = editingCommentId === comment.id;
                      const isReplying = replyingToCommentId === comment.id;
                      return (
                        <div key={comment.id} className="group">
                          <div className="flex gap-3">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white shrink-0" style={{ backgroundColor: user?.color || "#94a3b8" }}>{user?.name.charAt(0) || "?"}</div>
                            <div className="flex-1 min-w-0">
                              <div className={`rounded-xl p-3 border ${isEditing ? "border-cyan-300 bg-white ring-2 ring-cyan-50" : "border-gray-100 bg-gray-50"}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[11px] text-gray-800">{user?.name || "Unknown"}</span>
                                  <span className="text-[9px] text-gray-300">{new Date(comment.timestamp).toLocaleString("vi-VN")}</span>
                                  {/* Action buttons */}
                                  <div className="flex-1" />
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => { setReplyingToCommentId(isReplying ? null : comment.id); setReplyText(""); }}
                                      className="w-5 h-5 rounded hover:bg-gray-200 flex items-center justify-center text-gray-300 hover:text-gray-500" title="Trả lời">
                                      <Reply className="w-2.5 h-2.5" />
                                    </button>
                                    {isOwn && (
                                      <>
                                        <button onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.content); }}
                                          className="w-5 h-5 rounded hover:bg-gray-200 flex items-center justify-center text-gray-300 hover:text-cyan-500" title="Chỉnh sửa">
                                          <Pencil className="w-2.5 h-2.5" />
                                        </button>
                                        <button onClick={() => deleteComment(comment.id)}
                                          className="w-5 h-5 rounded hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400" title="Xoá">
                                          <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {isEditing ? (
                                  <div>
                                    <textarea
                                      value={editingCommentText}
                                      onChange={e => setEditingCommentText(e.target.value)}
                                      onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); saveCommentEdit(); } if (e.key === "Escape") setEditingCommentId(null); }}
                                      className="w-full text-[12px] text-gray-700 bg-transparent resize-none outline-none min-h-[36px]"
                                      autoFocus
                                    />
                                    <div className="flex items-center gap-2 mt-1 pt-1 border-t border-gray-100">
                                      <button onClick={saveCommentEdit} className="text-[9px] text-cyan-600 hover:text-cyan-700 px-2 py-0.5 rounded hover:bg-cyan-50">Lưu</button>
                                      <button onClick={() => setEditingCommentId(null)} className="text-[9px] text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded hover:bg-gray-100">Huỷ</button>
                                      <span className="text-[8px] text-gray-300">⌘+Enter lưu · Esc huỷ</span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-[12px] text-gray-600 whitespace-pre-wrap">{comment.content}</p>
                                )}
                              </div>

                              {/* Reactions row */}
                              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                {(comment.reactions || []).map(r => (
                                  <button key={r.emoji} onClick={() => toggleCommentReaction(comment.id, r.emoji)}
                                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] transition-all ${r.userIds.includes("u1") ? "bg-cyan-50 border border-cyan-200 text-cyan-700" : "bg-gray-50 border border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                                    <span>{r.emoji}</span><span>{r.userIds.length}</span>
                                  </button>
                                ))}
                                {/* Quick reaction buttons */}
                                <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-all">
                                  {commentReactionEmojis.slice(0, 4).map(emoji => (
                                    <button key={emoji} onClick={() => toggleCommentReaction(comment.id, emoji)}
                                      className="w-5 h-5 rounded hover:bg-gray-100 flex items-center justify-center text-[11px] hover:scale-110 transition-all">
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Reply input */}
                              {isReplying && (
                                <div className="mt-2 flex items-start gap-2">
                                  <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center text-[7px] text-white shrink-0 mt-1">N</div>
                                  <div className="flex-1 bg-white rounded-lg border border-gray-200 focus-within:border-cyan-300">
                                    <textarea
                                      value={replyText}
                                      onChange={e => setReplyText(e.target.value)}
                                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addReply(comment.id); } if (e.key === "Escape") setReplyingToCommentId(null); }}
                                      placeholder={`Trả lời ${user?.name || ""}...`}
                                      className="w-full text-[11px] text-gray-700 placeholder-gray-300 resize-none p-2 outline-none bg-transparent min-h-[28px]"
                                      autoFocus
                                    />
                                    <div className="flex items-center justify-end px-2 pb-1.5 gap-1">
                                      <button onClick={() => setReplyingToCommentId(null)} className="text-[9px] text-gray-400 px-1.5 py-0.5 rounded hover:bg-gray-50">Huỷ</button>
                                      <button onClick={() => addReply(comment.id)} disabled={!replyText.trim()}
                                        className={`text-[9px] px-2 py-0.5 rounded transition-all ${replyText.trim() ? "text-cyan-600 hover:bg-cyan-50" : "text-gray-300"}`}>
                                        Gửi
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* AI quick reply suggestions */}
                  {!newComment && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                      <span className="text-[9px] text-gray-300">Gợi ý:</span>
                      {["LGTM! 👍", "Cần xem lại 🔍", "Đang xử lý ⚙️", "Đã xong ✅", "Bị block 🚫"].map(s => (
                        <button key={s} onClick={() => setNewComment(s)}
                          className="text-[9px] px-2 py-0.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* New comment input */}
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-cyan-500 flex items-center justify-center text-[10px] text-white shrink-0">N</div>
                    <div className="flex-1 bg-white rounded-xl border border-gray-200 focus-within:border-cyan-300 focus-within:ring-2 focus-within:ring-cyan-50">
                      <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Viết bình luận... (⌘+Enter để gửi)"
                        onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); e.stopPropagation(); addComment(); } }}
                        className="w-full text-[12px] text-gray-700 placeholder-gray-300 resize-none p-3 outline-none bg-transparent min-h-[50px]" />
                      <div className="flex items-center justify-between px-3 pb-2">
                        <div className="flex items-center gap-1">
                          <CommentActions onInsertEmoji={emoji => setNewComment(prev => prev + emoji)} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-gray-300">⌘+Enter</span>
                          <button onClick={addComment} disabled={!newComment.trim()}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] transition-all ${newComment.trim() ? "bg-cyan-500 text-white hover:bg-cyan-600" : "bg-gray-100 text-gray-300"}`}>
                            <Send className="w-2.5 h-2.5" /> Gửi
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== CHECKLISTS TAB ==================== */}
              {activeTab === "checklists" && (
                <div className="p-6 space-y-4">
                  {totalCheckItems > 0 && (
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span>Tổng cộng: {doneCheckItems}/{totalCheckItems}</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${totalCheckItems > 0 ? (doneCheckItems / totalCheckItems) * 100 : 0}%` }} />
                      </div>
                      <span>{totalCheckItems > 0 ? Math.round((doneCheckItems / totalCheckItems) * 100) : 0}%</span>
                    </div>
                  )}

                  {(formData.checklists || []).length === 0 && (
                    <div className="text-center py-8">
                      <ListChecks className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-[12px] text-gray-400">Chưa có checklist nào</p>
                      <p className="text-[10px] text-gray-300 mt-1">Tạo checklist để theo dõi các bước công việc</p>
                    </div>
                  )}

                  {(formData.checklists || []).map(cl => {
                    const done = cl.items.filter(i => i.done).length;
                    const pct = cl.items.length > 0 ? Math.round((done / cl.items.length) * 100) : 0;
                    const isEditingTitle = editingChecklistId === cl.id;
                    return (
                      <div key={cl.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 group/cl">
                        {/* Checklist header */}
                        <div className="flex items-center gap-2 mb-2">
                          <ListChecks className="w-4 h-4 text-cyan-500 shrink-0" />
                          {isEditingTitle ? (
                            <input
                              value={editingChecklistTitle}
                              onChange={e => setEditingChecklistTitle(e.target.value)}
                              onBlur={saveChecklistRename}
                              onKeyDown={e => { if (e.key === "Enter") saveChecklistRename(); if (e.key === "Escape") setEditingChecklistId(null); }}
                              className="flex-1 text-[12px] text-gray-700 bg-white border border-cyan-300 rounded px-2 py-0.5 outline-none"
                              autoFocus
                            />
                          ) : (
                            <h4 className="text-[12px] text-gray-700 flex-1 cursor-text"
                              onDoubleClick={() => { setEditingChecklistId(cl.id); setEditingChecklistTitle(cl.title); }}
                              title="Double-click để đổi tên"
                            >{cl.title}</h4>
                          )}
                          <span className="text-[9px] text-gray-400">{done}/{cl.items.length}</span>
                          {cl.items.length > 0 && <span className="text-[9px] text-gray-400">{pct}%</span>}
                          {/* Checklist actions */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover/cl:opacity-100 transition-all">
                            <button onClick={() => { setEditingChecklistId(cl.id); setEditingChecklistTitle(cl.title); }}
                              className="w-5 h-5 rounded hover:bg-gray-200 flex items-center justify-center text-gray-300 hover:text-cyan-500" title="Đổi tên">
                              <Pencil className="w-2.5 h-2.5" />
                            </button>
                            <button onClick={() => deleteChecklist(cl.id)}
                              className="w-5 h-5 rounded hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400" title="Xoá checklist">
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                        {cl.items.length > 0 && (
                          <div className="h-1 bg-gray-200 rounded-full overflow-hidden mb-2">
                            <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        )}
                        {/* Checklist items */}
                        <div className="space-y-0.5">
                          {cl.items.map(item => {
                            const isEditingItem = editingCheckItemId === item.id;
                            const assignee = item.assigneeId ? teamMembers.find(m => m.id === item.assigneeId) : null;
                            return (
                              <div key={item.id} className="group/item flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-white transition-all">
                                <button onClick={() => toggleChecklistItem(cl.id, item.id)} className="shrink-0">
                                  {item.done ? <CheckSquare className="w-3.5 h-3.5 text-cyan-500" /> : <Square className="w-3.5 h-3.5 text-gray-300" />}
                                </button>
                                {isEditingItem ? (
                                  <input
                                    value={editingCheckItemText}
                                    onChange={e => setEditingCheckItemText(e.target.value)}
                                    onBlur={() => saveCheckItemEdit(cl.id)}
                                    onKeyDown={e => { if (e.key === "Enter") saveCheckItemEdit(cl.id); if (e.key === "Escape") setEditingCheckItemId(null); }}
                                    className="flex-1 text-[11px] text-gray-700 bg-white border border-cyan-300 rounded px-2 py-0.5 outline-none"
                                    autoFocus
                                  />
                                ) : (
                                  <span
                                    onDoubleClick={() => { setEditingCheckItemId(item.id); setEditingCheckItemText(item.text); }}
                                    className={`text-[11px] flex-1 cursor-text ${item.done ? "text-gray-400 line-through" : "text-gray-700"}`}
                                    title="Double-click để sửa"
                                  >{item.text}</span>
                                )}
                                {/* Assignee avatar */}
                                <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => setShowCheckItemAssignee(showCheckItemAssignee === item.id ? null : item.id)}
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] shrink-0 transition-all ${assignee ? "" : "border border-dashed border-gray-300 text-gray-300 hover:border-gray-400 hover:text-gray-400 opacity-0 group-hover/item:opacity-100"}`}
                                    style={assignee ? { backgroundColor: assignee.color, color: "white" } : {}}
                                    title={assignee ? assignee.name : "Giao cho..."}
                                  >
                                    {assignee ? assignee.name.charAt(0) : <User className="w-2.5 h-2.5" />}
                                  </button>
                                  {showCheckItemAssignee === item.id && (
                                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-20 w-[140px]">
                                      <button onClick={() => assignChecklistItem(cl.id, item.id, undefined)}
                                        className="w-full flex items-center gap-2 px-2.5 py-1 text-[10px] text-gray-400 hover:bg-gray-50">Chưa phân công</button>
                                      {teamMembers.map(m => (
                                        <button key={m.id} onClick={() => assignChecklistItem(cl.id, item.id, m.id)}
                                          className={`w-full flex items-center gap-2 px-2.5 py-1 text-[10px] hover:bg-gray-50 ${item.assigneeId === m.id ? "bg-cyan-50/50" : ""}`}>
                                          <div className="w-4 h-4 rounded-full flex items-center justify-center text-[6px] text-white" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                                          <span className="text-gray-700">{m.name}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {/* Item actions */}
                                <div className="flex items-center gap-0 opacity-0 group-hover/item:opacity-100 transition-all">
                                  <button onClick={() => { setEditingCheckItemId(item.id); setEditingCheckItemText(item.text); }}
                                    className="w-5 h-5 rounded hover:bg-gray-200 flex items-center justify-center text-gray-300 hover:text-cyan-500">
                                    <Pencil className="w-2 h-2" />
                                  </button>
                                  <button onClick={() => deleteChecklistItem(cl.id, item.id)}
                                    className="w-5 h-5 rounded hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400">
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Add item */}
                        <div className="flex items-center gap-2 mt-2">
                          <input type="text" placeholder="Thêm item..." value={newChecklistItem[cl.id] || ""}
                            onChange={e => setNewChecklistItem(prev => ({ ...prev, [cl.id]: e.target.value }))}
                            onKeyDown={e => e.key === "Enter" && addChecklistItem(cl.id)}
                            className="flex-1 text-[10px] bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-400 text-gray-700 placeholder-gray-300" />
                          <button onClick={() => addChecklistItem(cl.id)}
                            disabled={!newChecklistItem[cl.id]?.trim()}
                            className={`text-[9px] px-2 py-1 rounded-lg transition-all ${newChecklistItem[cl.id]?.trim() ? "text-cyan-600 hover:bg-cyan-50" : "text-gray-300"}`}>
                            Thêm
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add new checklist */}
                  <div className="flex items-center gap-2">
                    <input type="text" placeholder="Tên checklist mới..." value={newChecklistTitle}
                      onChange={e => setNewChecklistTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && addChecklist()}
                      className="flex-1 text-[11px] bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-cyan-400 text-gray-700 placeholder-gray-300" />
                    <button onClick={addChecklist}
                      disabled={!newChecklistTitle.trim()}
                      className={`flex items-center gap-1 text-[10px] px-3 py-2 rounded-lg transition-all border ${newChecklistTitle.trim() ? "bg-cyan-50 text-cyan-600 border-cyan-200 hover:bg-cyan-100" : "bg-gray-50 text-gray-300 border-gray-200"}`}>
                      <Plus className="w-3 h-3" /> Thêm Checklist
                    </button>
                  </div>
                </div>
              )}

              {/* ==================== WORK LOG TAB ==================== */}
              {activeTab === "worklog" && (
                <div className="p-6 space-y-4">
                  {/* Summary */}
                  {totalWorkLogTime > 0 && (
                    <div className="flex items-center gap-3 bg-cyan-50 rounded-xl px-4 py-3 border border-cyan-100">
                      <Clock className="w-4 h-4 text-cyan-500 shrink-0" />
                      <div>
                        <p className="text-[11px] text-cyan-700 font-medium">Tổng thời gian đã ghi: {fmtTime(totalWorkLogTime)}</p>
                        {formData.timeEstimate ? (
                          <p className="text-[9px] text-cyan-500 mt-0.5">
                            Ước lượng: {fmtTime(formData.timeEstimate)} · {Math.round((totalWorkLogTime / formData.timeEstimate) * 100)}% hoàn thành
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {/* Log list */}
                  {(formData.workLogs || []).length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-[12px] text-gray-400">Chưa có work log nào</p>
                      <p className="text-[10px] text-gray-300 mt-1">Ghi lại thời gian làm việc thực tế</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {[...(formData.workLogs || [])].sort((a, b) => b.date.localeCompare(a.date)).map(log => {
                        const user = teamMembers.find(m => m.id === log.userId);
                        return (
                          <div key={log.id} className="group flex items-start gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] text-white shrink-0 mt-0.5" style={{ backgroundColor: user?.color || "#94a3b8" }}>{user?.name.charAt(0) || "?"}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-gray-700 font-medium">{fmtTime(log.timeSpent)}</span>
                                <span className="text-[9px] text-gray-400">{user?.name}</span>
                                <span className="text-[9px] text-gray-300">·</span>
                                <span className="text-[9px] text-gray-400">{new Date(log.date).toLocaleDateString("vi-VN")}</span>
                              </div>
                              {log.note && <p className="text-[10px] text-gray-500 mt-0.5">{log.note}</p>}
                            </div>
                            <button onClick={() => deleteWorkLog(log.id)}
                              className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition-all">
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add work log form */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                    <p className="text-[10px] text-gray-500 font-medium">Ghi thêm thời gian</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-gray-400 mb-1 block">Ngày</label>
                        <input type="date" value={newWorkLogDate} onChange={e => setNewWorkLogDate(e.target.value)}
                          className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-400 text-gray-700" />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 mb-1 block">Thời gian (phút)</label>
                        <input type="number" min={1} placeholder="60" value={newWorkLogTime} onChange={e => setNewWorkLogTime(e.target.value)}
                          className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-400 text-gray-700" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 mb-1 block">Ghi chú (không bắt buộc)</label>
                      <input type="text" placeholder="Mô tả công việc đã làm..." value={newWorkLogNote} onChange={e => setNewWorkLogNote(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addWorkLog()}
                        className="w-full text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-400 text-gray-700" />
                    </div>
                    <button onClick={addWorkLog} disabled={!newWorkLogTime || parseInt(newWorkLogTime) <= 0}
                      className={`flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg transition-all ${newWorkLogTime && parseInt(newWorkLogTime) > 0 ? "bg-cyan-500 text-white hover:bg-cyan-600" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}>
                      <Plus className="w-3 h-3" /> Ghi nhận
                    </button>
                  </div>
                </div>
              )}

              {/* ==================== ACTIVITY TAB ==================== */}
              {activeTab === "activity" && (
                <div className="p-6">
                  {/* Filter bar */}
                  <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                    <Filter className="w-3 h-3 text-gray-400" />
                    {[
                      { key: "all", label: "Tất cả" },
                      { key: "status", label: "Trạng thái" },
                      { key: "assignee", label: "Phân công" },
                      { key: "comment", label: "Bình luận" },
                      { key: "checklist", label: "Checklist" },
                    ].map(f => (
                      <button key={f.key} onClick={() => setActivityFilter(f.key)}
                        className={`px-2 py-0.5 rounded-md text-[9px] transition-all ${activityFilter === f.key ? "bg-cyan-50 text-cyan-600 border border-cyan-200" : "text-gray-400 hover:text-gray-600 border border-transparent hover:bg-gray-50"}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {filteredActivity.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-[12px] text-gray-400">
                        {activityFilter === "all" ? "Chưa có hoạt động nào" : "Không có hoạt động phù hợp bộ lọc"}
                      </p>
                      <p className="text-[10px] text-gray-300 mt-1">
                        {activityFilter === "all" ? "Mọi thay đổi sẽ được ghi nhận tự động tại đây" : "Thử đổi bộ lọc khác"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {[...filteredActivity].reverse().map((entry, idx) => {
                        const user = teamMembers.find(m => m.id === entry.userId);
                        const isLast = idx === filteredActivity.length - 1;
                        return (
                          <div key={entry.id} className="flex items-start gap-3 relative">
                            {/* Timeline line */}
                            {!isLast && <div className="absolute left-[11px] top-[24px] bottom-0 w-px bg-gray-100" />}
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] text-white shrink-0 relative z-10" style={{ backgroundColor: user?.color || "#94a3b8" }}>{user?.name.charAt(0) || "?"}</div>
                            <div className="flex-1 min-w-0 pb-4">
                              <p className="text-[11px] text-gray-600">
                                <span className="text-gray-800">{user?.name || "Unknown"}</span>{" "}
                                {entry.action}
                                {entry.field && <span className="text-gray-800"> {entry.field}</span>}
                                {entry.oldValue && <span> từ <span className="line-through text-gray-400 bg-red-50 px-1 rounded">{entry.oldValue}</span></span>}
                                {entry.newValue && <span> thành <span className="text-cyan-600 bg-cyan-50 px-1 rounded">{entry.newValue}</span></span>}
                              </p>
                              <p className="text-[9px] text-gray-300 mt-0.5">{new Date(entry.timestamp).toLocaleString("vi-VN")}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Right: Metadata sidebar */}
          <div className="w-[260px] border-l border-gray-200 bg-gray-50/50 overflow-y-auto shrink-0 hidden md:block">
            <div className="p-4 space-y-4">
              {/* Work Type */}
              {(() => {
                const currentType = formData.type || "task";
                const currentCfg = taskTypeConfig[currentType];
                return (
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-gray-400 uppercase tracking-wider">Loại công việc</label>
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setShowTypePicker(o => !o)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all hover:opacity-90"
                        style={{ backgroundColor: currentCfg.bg, borderColor: currentCfg.color + "50" }}>
                        <span className="text-[13px]">{currentCfg.icon}</span>
                        <span className="text-[11px] font-medium flex-1" style={{ color: currentCfg.color }}>{currentCfg.label}</span>
                        <ChevronDown className="w-3 h-3" style={{ color: currentCfg.color + "80" }} />
                      </button>
                      {showTypePicker && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-20">
                          {(["task", "story", "bug", "epic"] as TaskType[]).map(t => {
                            const cfg = taskTypeConfig[t];
                            const active = currentType === t;
                            return (
                              <button key={t} onClick={() => { const updated = { ...formData, type: t }; setFormData(updated); if (!isNew) onSave(updated); setShowTypePicker(false); }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${active ? "bg-gray-50" : ""}`}>
                                <span className="text-[13px]">{cfg.icon}</span>
                                <span className="text-[11px] text-gray-700 flex-1">{cfg.label}</span>
                                {active && <Check className="w-3 h-3 text-cyan-500" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="h-px bg-gray-200" />

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 uppercase tracking-wider">Trạng thái</label>
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setShowStatusPicker(!showStatusPicker); setShowPriorityPicker(false); setShowAssigneePicker(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-all text-left">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: (effectiveStatusConfig[formData.status] || effectiveStatusConfig.todo).color }} />
                    <span className="text-[11px] text-gray-700 flex-1">{(effectiveStatusConfig[formData.status] || effectiveStatusConfig.todo).label}</span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>
                  {showStatusPicker && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-20">
                      {Object.entries(effectiveStatusConfig).map(([k, v]) => (
                        <button key={k} onClick={() => setStatus(k as Task["status"])}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${formData.status === k ? "bg-cyan-50/50" : ""}`}>
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.color }} />
                          <span className="text-gray-700">{v.label}</span>
                          {formData.status === k && <Check className="w-3 h-3 text-cyan-500 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 uppercase tracking-wider">Độ ưu tiên</label>
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setShowPriorityPicker(!showPriorityPicker); setShowStatusPicker(false); setShowAssigneePicker(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-all text-left">
                    <span className="text-[9px]" style={{ color: priorityConfig[formData.priority].color }}>{priorityConfig[formData.priority].icon}</span>
                    <span className="text-[11px] text-gray-700 flex-1">{priorityConfig[formData.priority].label}</span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>
                  {showPriorityPicker && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-20">
                      {Object.entries(priorityConfig).map(([k, v]) => (
                        <button key={k} onClick={() => setPriority(k as Task["priority"])}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${formData.priority === k ? "bg-cyan-50/50" : ""}`}>
                          <span className="text-[9px]" style={{ color: v.color }}>{v.icon}</span>
                          <span className="text-gray-700">{v.label}</span>
                          {formData.priority === k && <Check className="w-3 h-3 text-cyan-500 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Assignee */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 uppercase tracking-wider">Người phụ trách</label>
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setShowAssigneePicker(!showAssigneePicker); setShowStatusPicker(false); setShowPriorityPicker(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-all text-left">
                    {formData.assignee ? (
                      <>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ backgroundColor: formData.assignee.color }}>{formData.assignee.name.charAt(0)}</div>
                        <span className="text-[11px] text-gray-700 flex-1">{formData.assignee.name}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 shrink-0"><User className="w-2.5 h-2.5" /></div>
                        <span className="text-[11px] text-gray-400 flex-1">Chưa phân công</span>
                      </>
                    )}
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>
                  {showAssigneePicker && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-20">
                      <button onClick={() => setAssignee(undefined)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-400 hover:bg-gray-50">Chưa phân công</button>
                      {teamMembers.map(m => (
                        <button key={m.id} onClick={() => setAssignee(m)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${formData.assignee?.id === m.id ? "bg-cyan-50/50" : ""}`}>
                          <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                          <span className="text-gray-700 flex-1">{m.name}</span>
                          {formData.assignee?.id === m.id && <Check className="w-3 h-3 text-cyan-500" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Reporter */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 uppercase tracking-wider">Người báo cáo</label>
                <div className="relative" onClick={e => e.stopPropagation()}>
                  {(() => {
                    const reporter = teamMembers.find(m => m.id === (formData.reporterId || "u1"));
                    return (
                      <>
                        <button onClick={() => { setShowReporterPicker(o => !o); setShowStatusPicker(false); setShowPriorityPicker(false); setShowAssigneePicker(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-all text-left">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white shrink-0" style={{ backgroundColor: reporter?.color || "#94a3b8" }}>{reporter?.name.charAt(0) || "?"}</div>
                          <span className="text-[11px] text-gray-700 flex-1">{reporter?.name || "Chưa xác định"}</span>
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        </button>
                        {showReporterPicker && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-xl py-1 z-20">
                            {teamMembers.map(m => (
                              <button key={m.id} onClick={() => { setFormData(prev => ({ ...prev, reporterId: m.id })); setShowReporterPicker(false); }}
                                className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-gray-50 ${(formData.reporterId || "u1") === m.id ? "bg-cyan-50/50" : ""}`}>
                                <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</div>
                                <span className="text-gray-700 flex-1">{m.name}</span>
                                <span className="text-[8px] text-gray-400">{m.role}</span>
                                {(formData.reporterId || "u1") === m.id && <Check className="w-3 h-3 text-cyan-500" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="h-px bg-gray-200" />

              {/* Project */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 uppercase tracking-wider">Dự án</label>
                <select value={formData.projectId} onChange={e => {
                  const oldP = projects.find(p => p.id === formData.projectId);
                  const newP = projects.find(p => p.id === e.target.value);
                  setFormData(prev => ({ ...prev, projectId: e.target.value, epicId: undefined }));
                  recordActivity("đã thay đổi", "dự án", oldP?.name, newP?.name);
                }}
                  className="w-full text-[11px] border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:border-cyan-400">
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Epic */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 uppercase tracking-wider">Epic</label>
                {(() => {
                  const projectEpics = epics.filter(e => e.projectId === formData.projectId);
                  const selectedEpic = formData.epicId ? epics.find(e => e.id === formData.epicId) : null;
                  return (
                    <div className="relative">
                      <select
                        value={formData.epicId || ""}
                        disabled={formData.type === "epic"}
                        onChange={e => {
                          const oldEpic = selectedEpic?.title;
                          const newEpic = epics.find(ep => ep.id === e.target.value)?.title;
                          setFormData(prev => ({ ...prev, epicId: e.target.value || undefined }));
                          recordActivity("đã thay đổi", "epic", oldEpic, newEpic);
                        }}
                        className={`w-full text-[11px] border rounded-lg px-3 py-2 outline-none transition-colors ${formData.type === "epic" ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed" : "bg-white border-gray-200 text-gray-700 focus:border-cyan-400"}`}
                        style={!formData.type || formData.type !== "epic" ? (selectedEpic ? { borderColor: selectedEpic.color + "80", color: selectedEpic.color } : {}) : {}}
                      >
                        <option value="">{formData.type === "epic" ? "Không áp dụng" : "Không có Epic"}</option>
                        {formData.type !== "epic" && projectEpics.map(ep => <option key={ep.id} value={ep.id}>{ep.title}</option>)}
                      </select>
                      {selectedEpic && (
                        <div className="mt-1 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: selectedEpic.color }} />
                          <span className="text-[9px]" style={{ color: selectedEpic.color }}>{selectedEpic.status === "done" ? "Đã xong" : selectedEpic.status === "in_progress" ? "Đang làm" : "Chưa bắt đầu"}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Sprint */}
              {(() => {
                const projectSprints = sprints.filter(s => s.status !== "completed");
                const selectedSprint = formData.sprintId ? sprints.find(s => s.id === formData.sprintId) : null;
                const sprintStatusConfig = {
                  active: { label: "Đang chạy", color: "#059669", bg: "#f0fdf4", dot: "bg-green-500 animate-pulse" },
                  planning: { label: "Lên kế hoạch", color: "#0891b2", bg: "#ecfeff", dot: "bg-cyan-400" },
                };
                return (
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-2.5 h-2.5" /> Sprint
                    </label>
                    <div className="relative">
                      <select
                        value={formData.sprintId || ""}
                        onChange={e => {
                          const old = selectedSprint?.name;
                          const next = sprints.find(s => s.id === e.target.value)?.name;
                          setFormData(prev => ({ ...prev, sprintId: e.target.value || undefined }));
                          recordActivity("đã thay đổi", "sprint", old, next || "Backlog");
                        }}
                        className="w-full text-[11px] border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:border-cyan-400 appearance-none pr-7"
                      >
                        <option value="">Backlog</option>
                        {projectSprints.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {selectedSprint ? (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border"
                        style={{ backgroundColor: sprintStatusConfig[selectedSprint.status as keyof typeof sprintStatusConfig]?.bg || "#f9fafb", borderColor: sprintStatusConfig[selectedSprint.status as keyof typeof sprintStatusConfig]?.color + "30" || "#e5e7eb" }}>
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${sprintStatusConfig[selectedSprint.status as keyof typeof sprintStatusConfig]?.dot || "bg-gray-400"}`} />
                        <span className="text-[9px] font-medium" style={{ color: sprintStatusConfig[selectedSprint.status as keyof typeof sprintStatusConfig]?.color || "#6b7280" }}>
                          {sprintStatusConfig[selectedSprint.status as keyof typeof sprintStatusConfig]?.label}
                        </span>
                        <span className="text-[9px] text-gray-400 ml-auto">{selectedSprint.startDate.slice(5)} → {selectedSprint.endDate.slice(5)}</span>
                      </div>
                    ) : (
                      <p className="text-[9px] text-gray-400 px-1">Chưa thuộc sprint nào</p>
                    )}
                  </div>
                );
              })()}

              {/* Story Points */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-2.5 h-2.5" /> Story Points
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1, 2, 3, 5, 8, 13].map(pt => {
                    const active = formData.storyPoints === pt;
                    return (
                      <button key={pt} onClick={() => {
                        setFormData(prev => ({ ...prev, storyPoints: active ? undefined : pt }));
                        if (!active) recordActivity("đã thay đổi", "story points", String(formData.storyPoints || "–"), String(pt));
                      }}
                        className="w-8 h-8 rounded-lg text-[11px] font-semibold border transition-all"
                        style={active
                          ? { backgroundColor: "#0891b2", color: "white", borderColor: "#0891b2" }
                          : { backgroundColor: "white", color: "#64748b", borderColor: "#e2e8f0" }}>
                        {pt}
                      </button>
                    );
                  })}
                  {formData.storyPoints && ![1,2,3,5,8,13].includes(formData.storyPoints) && (
                    <span className="w-8 h-8 rounded-lg text-[11px] font-semibold border flex items-center justify-center"
                      style={{ backgroundColor: "#0891b2", color: "white", borderColor: "#0891b2" }}>
                      {formData.storyPoints}
                    </span>
                  )}
                  <input
                    type="number" min={1} max={100}
                    placeholder="?"
                    value={formData.storyPoints && ![1,2,3,5,8,13].includes(formData.storyPoints) ? formData.storyPoints : ""}
                    onChange={e => {
                      const v = parseInt(e.target.value);
                      setFormData(prev => ({ ...prev, storyPoints: v > 0 ? v : undefined }));
                    }}
                    className="w-10 h-8 rounded-lg text-[11px] text-center border border-gray-200 bg-white text-gray-500 outline-none focus:border-cyan-400 [appearance:textfield]"
                  />
                </div>
                {formData.storyPoints && (
                  <p className="text-[9px] text-cyan-600 font-medium px-0.5">
                    {formData.storyPoints} {formData.storyPoints === 1 ? "point" : "points"} được ghi nhận vào velocity
                  </p>
                )}
              </div>

              {/* Dates */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 uppercase tracking-wider">Ngày bắt đầu</label>
                <input type="date" value={formData.startDate || ""} onChange={e => setStartDate(e.target.value)}
                  className="w-full text-[11px] border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 outline-none focus:border-cyan-400" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  Hạn chót
                  {isOverdue && <AlertTriangle className="w-2.5 h-2.5 text-red-500" />}
                </label>
                <input type="date" value={formData.dueDate || ""} onChange={e => setDueDate(e.target.value)}
                  className={`w-full text-[11px] border rounded-lg px-3 py-2 bg-white outline-none focus:border-cyan-400 ${isOverdue ? "border-red-300 text-red-600" : "border-gray-200 text-gray-700"}`} />
                {daysUntilDue !== null && (
                  <p className={`text-[9px] ${isOverdue ? "text-red-500" : daysUntilDue <= 2 ? "text-amber-500" : "text-gray-400"}`}>
                    {isOverdue ? `Quá hạn ${Math.abs(daysUntilDue)} ngày` : daysUntilDue === 0 ? "Hôm nay" : daysUntilDue === 1 ? "Ngày mai" : `Còn ${daysUntilDue} ngày`}
                  </p>
                )}
              </div>

              <div className="h-px bg-gray-200" />

              {/* Time tracking */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] text-gray-400 uppercase tracking-wider">Theo dõi thời gian</label>
                  <button onClick={() => {
                    if (isTimerRunning) {
                      // Stop timer — add elapsed seconds to timeSpent
                      const addedMins = Math.round(timerSeconds / 60);
                      setFormData(prev => ({ ...prev, timeSpent: (prev.timeSpent || 0) + addedMins }));
                      if (addedMins > 0) recordActivity("đã ghi nhận thời gian", undefined, undefined, fmtTime(addedMins));
                      setTimerSeconds(0);
                    }
                    setIsTimerRunning(!isTimerRunning);
                  }}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] transition-all ${isTimerRunning ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200"}`}>
                    {isTimerRunning ? <><Pause className="w-2.5 h-2.5" /> Dừng</> : <><Play className="w-2.5 h-2.5" /> Bắt đầu</>}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[8px] text-gray-400 mb-0.5">Ước lượng (phút)</p>
                    <input type="number" value={formData.timeEstimate || ""} placeholder="phút"
                      onChange={e => setFormData(prev => ({ ...prev, timeEstimate: parseInt(e.target.value) || 0 }))}
                      className="w-full text-[11px] border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 outline-none focus:border-cyan-400" />
                    {formData.timeEstimate ? <p className="text-[8px] text-gray-400 mt-0.5">{fmtTime(formData.timeEstimate)}</p> : null}
                  </div>
                  <div>
                    <p className="text-[8px] text-gray-400 mb-0.5">Đã dùng (phút)</p>
                    <input type="number" value={formData.timeSpent || ""} placeholder="phút"
                      onChange={e => setFormData(prev => ({ ...prev, timeSpent: parseInt(e.target.value) || 0 }))}
                      className="w-full text-[11px] border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 outline-none focus:border-cyan-400" />
                    {formData.timeSpent ? <p className="text-[8px] text-gray-400 mt-0.5">{fmtTime(formData.timeSpent)}</p> : null}
                  </div>
                </div>
                {formData.timeEstimate && formData.timeEstimate > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${timePct}%`, backgroundColor: isOvertime ? "#dc2626" : "#0891b2" }} />
                    </div>
                    <span className={`text-[9px] ${isOvertime ? "text-red-500" : "text-gray-400"}`}>{timePct}%</span>
                  </div>
                )}
                {isTimerRunning && (
                  <div className="flex items-center gap-1.5 bg-cyan-50 rounded-lg px-2 py-1.5 border border-cyan-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] text-cyan-700 tabular-nums">{fmtTimer(timerSeconds)}</span>
                    <span className="text-[8px] text-cyan-400 ml-auto">Đang ghi...</span>
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-200" />

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-2.5 h-2.5" /> Nhãn
                </label>
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map(tag => {
                    const tc = tagColors[tag] || { bg: "#ecfeff", text: "#0891b2" };
                    return (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: tc.bg, color: tc.text }}>
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:opacity-60 ml-0.5"><X className="w-2 h-2" /></button>
                      </span>
                    );
                  })}
                  <input type="text" placeholder="+ Nhãn" value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addTag()}
                    className="text-[10px] bg-transparent border-none outline-none text-gray-400 placeholder-gray-300 w-14 focus:text-gray-600" />
                </div>
              </div>

              {/* Watchers */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-2.5 h-2.5" /> Theo dõi
                  {(formData.watchers?.length || 0) > 0 && <span className="text-gray-300">({formData.watchers?.length})</span>}
                </label>
                <div className="flex items-center gap-1 flex-wrap">
                  {teamMembers.map(m => {
                    const isWatching = formData.watchers?.includes(m.id);
                    return (
                      <button key={m.id} onClick={() => toggleWatcher(m.id)} title={m.name}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-medium text-white transition-all ${isWatching ? "ring-2 ring-cyan-400 ring-offset-1 opacity-100" : "opacity-25 hover:opacity-60"}`}
                        style={{ backgroundColor: m.color }}>
                        {m.name.charAt(0)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-gray-200" />

              {/* Info */}
              <div className="space-y-1.5 text-[9px] text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Ngày tạo</span>
                  <span className="text-gray-500">{new Date(formData.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
                {totalCheckItems > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Mục kiểm tra</span>
                    <span className="text-gray-500">{doneCheckItems}/{totalCheckItems}</span>
                  </div>
                )}
                {(formData.watchers?.length || 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Người theo dõi</span>
                    <span className="text-gray-500">{formData.watchers?.length}</span>
                  </div>
                )}
                {(formData.dependencies?.length || 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Phụ thuộc</span>
                    <span className="text-gray-500">{formData.dependencies?.length}</span>
                  </div>
                )}
                {(formData.comments?.length || 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Bình luận</span>
                    <span className="text-gray-500">{formData.comments?.length}</span>
                  </div>
                )}
                {(formData.activityLog?.length || 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Hoạt động</span>
                    <span className="text-gray-500">{formData.activityLog?.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-2 text-[9px] text-gray-400">
            <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded">Esc <span className="text-gray-300">đóng</span></span>
            <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded">⌘+Enter <span className="text-gray-300">lưu</span></span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-[11px] text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all">Huỷ</button>
            <button onClick={handleSave} disabled={!formData.title.trim()}
              className={`text-[11px] px-5 py-2 rounded-lg transition-all shadow-sm ${formData.title.trim() ? "text-white bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 shadow-cyan-500/20" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}>
              {isNew ? "Tạo Task" : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
