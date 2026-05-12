import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
import { copyToClipboard } from "./clipboard";
import type { Doc, DocFolder, ViewMode, SortBy, SidebarSection, EditorMode } from "./docs/docs-types";
import { renderMarkdown, markdownToEditorHtml, htmlToMarkdown, getPlainText, getHtmlHeadings } from "./docs/docs-utils";
import { docIcons, templates, recentActivities, teamMembers, initialFolders, initialDocs, macroBrowserItems as macroBrowserItemsData } from "./docs/docs-data";
import { MacroBrowserModal } from "./docs/MacroBrowserModal";
import { PageTreePanel } from "./docs/PageTreePanel";
import { NotificationsPanel } from "./docs/NotificationsPanel";
import { PageRestrictionsModal } from "./docs/PageRestrictionsModal";
import { VersionDiffModal } from "./docs/VersionDiffModal";
import { TemplateGalleryModal } from "./docs/TemplateGalleryModal";
import { EditorShortcutsModal } from "./docs/EditorShortcutsModal";
import { ListShortcutsModal } from "./docs/ListShortcutsModal";
import {
  FileText, FolderOpen, FolderPlus, FilePlus, Search, Filter, X,
  MoreHorizontal, ChevronDown, ChevronRight, Grid3X3, List, Users,
  Star, StarOff, Trash2, Copy, Clock, Eye, Lock, Globe, Share2,
  Tag, Edit3, History, BookTemplate, Plus, ArrowLeft, Bold, Italic,
  Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  ListOrdered, Link, Image, Code, Quote, Heading1, Heading2, Heading3,
  CheckSquare, Undo2, Redo2, Download, Printer, MessageSquare,
  Settings, Hash, Bookmark, Archive, ExternalLink, Type,
  FolderClosed, RotateCcw, Inbox, UserCheck, ArchiveRestore,
  TrendingUp, Activity, BarChart3, Pencil, ArrowUpRight,
  Maximize2, Minimize2, SplitSquareHorizontal, Eye as EyeIcon,
  PanelRightOpen, PanelRightClose, Upload, FolderInput,
  Palette, Smile, Table, Minus, ListChecks, FileUp, Columns2,
  ChevronUp, Pin, PinOff, Layers, Check, HelpCircle, Keyboard,
  Highlighter, AtSign, Calendar, Vote, CircleDot, Zap, AlertTriangle,
  Heart, ThumbsUp, Laugh, Bell, BellOff,
  SearchCode, Replace, ArrowDown as ArrowDownIcon, ArrowUp as ArrowUpIcon,
  FileText as PageIcon, ChevronLeft, CornerDownRight, MessageCircle,
  Shield, ShieldCheck, FileCode, FileType, Clipboard,
  Target, LayoutGrid, BookOpen, Sparkles, UserPlus, Ban,
  BarChart2, Users2,
  PlusCircle, MinusCircle, Paintbrush, GitCompare, ArrowRightLeft,
  SquarePlus, Trash, Braces, IndentIncrease, IndentDecrease, Columns3
} from "lucide-react";

/* ============ COMPONENT ============ */
export function DocsView() {
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [folders] = useState<DocFolder[]>(initialFolders);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQ, setSearchQ] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("updated");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["f1", "f2", "f3"]));
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarSection, setSidebarSection] = useState<SidebarSection>("all");
  const [sidebarSearch, setSidebarSearch] = useState("");

  // Doc editor state
  const [editingDoc, setEditingDoc] = useState<Doc | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [newComment, setNewComment] = useState("");

  // Template modal
  const [showTemplates, setShowTemplates] = useState(false);

  // Editor enhancements
  const [editorMode, setEditorMode] = useState<EditorMode>("edit");
  const [focusMode, setFocusMode] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [showMoveFolder, setShowMoveFolder] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [editTags, setEditTags] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const editContentRef = useRef("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  // Context menu
  const [contextMenuDocId, setContextMenuDocId] = useState<string | null>(null);

  // Part 4: Batch operations, pinning, sort direction, drag-drop
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [sortAsc, setSortAsc] = useState(false);
  const [pinnedDocs, setPinnedDocs] = useState<Set<string>>(new Set(["d1", "d3"]));
  const [dragOver, setDragOver] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategory, setTemplateCategory] = useState("all");
  const [showOutline, setShowOutline] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Floating toolbar
  const [floatingToolbar, setFloatingToolbar] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const floatingRef = useRef<HTMLDivElement>(null);

  // Slash command menu
  const [slashMenu, setSlashMenu] = useState<{ x: number; y: number; visible: boolean; query: string; startOffset: number }>({ x: 0, y: 0, visible: false, query: "", startOffset: 0 });
  const [slashSelectedIdx, setSlashSelectedIdx] = useState(0);
  const slashMenuRef = useRef<HTMLDivElement>(null);

  // Block inserter (+)
  const [blockInserter, setBlockInserter] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const [blockInserterOpen, setBlockInserterOpen] = useState(false);

  // Heading dropdown
  const [headingDropdown, setHeadingDropdown] = useState(false);

  // Phase 3: Text color, highlight, mention, emoji, status
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [mentionMenu, setMentionMenu] = useState<{ x: number; y: number; visible: boolean; query: string }>({ x: 0, y: 0, visible: false, query: "" });
  const [mentionSelectedIdx, setMentionSelectedIdx] = useState(0);
  const mentionMenuRef = useRef<HTMLDivElement>(null);

  // Phase 4: Inline comments, find/replace, page tree, like/watch, reactions
  const [inlineComments, setInlineComments] = useState<{ id: number; text: string; selectedText: string; author: string; initials: string; color: string; time: string; resolved: boolean; reactions: Record<string, string[]> }[]>([]);
  const [showInlineCommentForm, setShowInlineCommentForm] = useState(false);
  const [inlineCommentText, setInlineCommentText] = useState("");
  const [inlineCommentSelection, setInlineCommentSelection] = useState("");
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [findMatchCount, setFindMatchCount] = useState(0);
  const [findCurrentMatch, setFindCurrentMatch] = useState(0);
  const [showPageTree, setShowPageTree] = useState(false);
  const [pageLiked, setPageLiked] = useState(false);
  const [pageLikeCount, setPageLikeCount] = useState(3);
  const [pageWatching, setPageWatching] = useState(true);
  const [activeHeadingIdx, setActiveHeadingIdx] = useState(-1);
  const findInputRef = useRef<HTMLInputElement>(null);

  // Phase 5: Export menu, page restrictions, template gallery, actions menu, reading progress, word goal
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showRestrictions, setShowRestrictions] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [templateGallerySearch, setTemplateGallerySearch] = useState("");
  const [templateGalleryCat, setTemplateGalleryCat] = useState("all");
  const [templateGalleryPreview, setTemplateGalleryPreview] = useState<string | null>(null);
  const [wordCountGoal, setWordCountGoal] = useState<number>(0);
  const [readingProgress, setReadingProgress] = useState(0);
  const [pageRestrictions, setPageRestrictions] = useState<{ type: "none" | "view" | "edit"; users: string[] }>({ type: "none", users: [] });
  const [restrictionTab, setRestrictionTab] = useState<"view" | "edit">("edit");

  // Phase 6: Table toolbar, page labels, analytics, version diff, page footer
  const [tableToolbar, setTableToolbar] = useState<{ x: number; y: number; visible: boolean; table: HTMLTableElement | null }>({ x: 0, y: 0, visible: false, table: null });
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showVersionDiff, setShowVersionDiff] = useState(false);
  const [diffVersions, setDiffVersions] = useState<[number, number]>([0, 0]);
  const [pageLabels, setPageLabels] = useState<string[]>(["confluence", "documentation"]);
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [pageViewCount] = useState(Math.floor(Math.random() * 200) + 50);
  const [pageUniqueViewers] = useState(Math.floor(Math.random() * 30) + 8);
  const labelInputRef = useRef<HTMLInputElement>(null);

  // Phase 7: Macro Browser, Page Tree, Notifications, Block Inserter
  const [showMacroBrowser, setShowMacroBrowser] = useState(false);
  const [macroBrowserSearch, setMacroBrowserSearch] = useState("");
  const [macroBrowserCategory, setMacroBrowserCategory] = useState("all");
  const [macroBrowserPreview, setMacroBrowserPreview] = useState<string | null>(null);
  const [pageTreeExpanded, setPageTreeExpanded] = useState<Record<string, boolean>>({});
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState<Set<number>>(new Set());
  const [pageNotifications] = useState([
    { id: 1, type: "edit" as const, user: "Nguyễn An", avatar: "#0052CC", initials: "NA", message: "đã chỉnh sửa trang", doc: "API Documentation", time: "2 phút trước", read: false },
    { id: 2, type: "comment" as const, user: "Trần Bình", avatar: "#00875A", initials: "TB", message: "đã bình luận trên", doc: "Sprint Planning Q1", time: "15 phút trước", read: false },
    { id: 3, type: "like" as const, user: "Lê Chi", avatar: "#5243AA", initials: "LC", message: "đã thích trang", doc: "Architecture Overview", time: "1 giờ trước", read: true },
    { id: 4, type: "share" as const, user: "Phạm Dung", avatar: "#DE350B", initials: "PD", message: "đã chia sẻ với bạn", doc: "Onboarding Guide", time: "3 giờ trước", read: true },
    { id: 5, type: "mention" as const, user: "Hoàng Em", avatar: "#FF8B00", initials: "HE", message: "đã nhắc đến bạn trong", doc: "Meeting Notes", time: "Hôm qua", read: true },
  ]);
  const [recentlyViewedDocs] = useState<string[]>(() => {
    return docs.slice(0, 5).map(d => d.id);
  });

  // Confluence text & highlight color palettes
  const textColors = [
    { label: "Default", color: "#172B4D" }, { label: "Subtle", color: "#6B778C" },
    { label: "Blue", color: "#0052CC" }, { label: "Teal", color: "#00B8D9" },
    { label: "Green", color: "#00875A" }, { label: "Yellow", color: "#FF8B00" },
    { label: "Red", color: "#DE350B" }, { label: "Purple", color: "#5243AA" },
  ];
  const highlightColors = [
    { label: "None", color: "transparent" }, { label: "Grey", color: "#DFE1E6" },
    { label: "Blue", color: "#DEEBFF" }, { label: "Teal", color: "#E6FCFF" },
    { label: "Green", color: "#E3FCEF" }, { label: "Yellow", color: "#FFFAE6" },
    { label: "Red", color: "#FFEBE6" }, { label: "Purple", color: "#EAE6FF" },
  ];
  const statusLozenges = [
    { label: "TO DO", bg: "#DFE1E6", color: "#42526E" },
    { label: "IN PROGRESS", bg: "#DEEBFF", color: "#0052CC" },
    { label: "DONE", bg: "#E3FCEF", color: "#00875A" },
    { label: "BLOCKED", bg: "#FFEBE6", color: "#DE350B" },
    { label: "IN REVIEW", bg: "#EAE6FF", color: "#5243AA" },
    { label: "ON HOLD", bg: "#FFFAE6", color: "#FF8B00" },
  ];
  const emojiCategories = [
    { label: "Phổ biến", emojis: ["👍","👎","❤️","🎉","🚀","✅","❌","⚡","🔥","💡","⭐","🎯","📌","💬","👀","🙏","💪","🤔","😊","😅"] },
    { label: "Phản ứng", emojis: ["😀","😂","🤣","😍","🥰","😎","🤩","😭","😱","🤯","😡","🥳","🫡","🫠","😏","🤝","🙌","👏","💯","✨"] },
    { label: "Công việc", emojis: ["📋","📝","📊","📈","📉","🗓️","⏰","🔔","🔒","🔓","🏷️","📎","🗂️","💼","🎨","🔧","⚙️","🧪","🏗️","📦"] },
  ];

  // Close menus
  useEffect(() => {
    const handler = () => { setContextMenuDocId(null); setHeadingDropdown(false); setBlockInserterOpen(false); setShowTextColorPicker(false); setShowHighlightPicker(false); setShowEmojiPicker(false); setShowStatusPicker(false); setShowDatePicker(false); setShowLayoutPicker(false); setShowExportMenu(false); setShowActionsMenu(false); setTableToolbar(p => ({ ...p, visible: false })); setShowNotifications(false); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [contextMenuDocId]);

  /* Active (non-archived, non-deleted) docs */
  const activeDocs = docs.filter(d => !d.archived && !d.deleted);

  /* Docs in current section (before category filter) for category counts */
  const sectionDocs = useMemo(() => {
    const active = docs.filter(d => !d.archived && !d.deleted);
    switch (sidebarSection) {
      case "trash": return docs.filter(d => d.deleted);
      case "archived": return docs.filter(d => d.archived && !d.deleted);
      case "starred": return active.filter(d => d.starred);
      case "shared": return active.filter(d => d.sharedWith.length > 0);
      case "recent": return [...active].sort((a, b) => b.updatedTimestamp - a.updatedTimestamp).slice(0, 10);
      default: return active;
    }
  }, [docs, sidebarSection]);

  const categories = useMemo(() => [
    { key: "all", label: "Tất cả", count: sectionDocs.length },
    { key: "specs", label: "Specs", count: sectionDocs.filter(d => d.category === "specs").length },
    { key: "technical", label: "Technical", count: sectionDocs.filter(d => d.category === "technical").length },
    { key: "design", label: "Design", count: sectionDocs.filter(d => d.category === "design").length },
    { key: "meeting", label: "Meeting", count: sectionDocs.filter(d => d.category === "meeting").length },
    { key: "process", label: "Process", count: sectionDocs.filter(d => d.category === "process").length },
  ], [sectionDocs]);

  const allTags = useMemo(() => [...new Set(docs.flatMap(d => d.tags))], [docs]);

  /* Helper: get all subfolder ids for a given parent */
  const getDescendantFolderIds = useCallback((parentId: string): string[] => {
    const children = folders.filter(f => f.parentId === parentId);
    return children.reduce<string[]>((acc, c) => [...acc, c.id, ...getDescendantFolderIds(c.id)], []);
  }, [folders]);

  const filtered = useMemo(() => {
    let list = docs;
    const active = docs.filter(d => !d.archived && !d.deleted);

    // Section-level filter
    switch (sidebarSection) {
      case "trash": list = list.filter(d => d.deleted); break;
      case "archived": list = list.filter(d => d.archived && !d.deleted); break;
      case "starred": list = list.filter(d => d.starred && !d.archived && !d.deleted); break;
      case "shared": list = list.filter(d => d.sharedWith.length > 0 && !d.archived && !d.deleted); break;
      case "recent": list = [...active].sort((a, b) => b.updatedTimestamp - a.updatedTimestamp).slice(0, 10); break;
      default: list = active; break;
    }

    if (selectedCategory !== "all") list = list.filter(d => d.category === selectedCategory);
    if (selectedFolder) {
      const descendantIds = getDescendantFolderIds(selectedFolder);
      const allFolderIds = [selectedFolder, ...descendantIds];
      list = list.filter(d => d.folderId && allFolderIds.includes(d.folderId));
    }
    if (selectedTag) list = list.filter(d => d.tags.includes(selectedTag));
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter(d => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q) || d.tags.some(t => t.includes(q)) || d.author.toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      // Pinned docs first
      const aPinned = pinnedDocs.has(a.id) ? 0 : 1;
      const bPinned = pinnedDocs.has(b.id) ? 0 : 1;
      if (aPinned !== bPinned) return aPinned - bPinned;

      let cmp = 0;
      if (sortBy === "updated") cmp = b.updatedTimestamp - a.updatedTimestamp;
      else if (sortBy === "title") cmp = a.title.localeCompare(b.title);
      else if (sortBy === "author") cmp = a.author.localeCompare(b.author);
      return sortAsc ? -cmp : cmp;
    });
    return list;
  }, [docs, selectedCategory, selectedFolder, selectedTag, searchQ, sortBy, sortAsc, sidebarSection, getDescendantFolderIds, pinnedDocs]);

  const toggleFolder = (fid: string) => {
    setExpandedFolders(p => { const n = new Set(p); if (n.has(fid)) n.delete(fid); else n.add(fid); return n; });
  };

  const openDoc = useCallback((doc: Doc) => {
    setEditingDoc(doc);
    // Convert markdown content to HTML for WYSIWYG editing
    const htmlContent = doc.content.startsWith('<') ? doc.content : markdownToEditorHtml(doc.content);
    editContentRef.current = htmlContent;
    setEditContent(htmlContent);
    setEditorKey(k => k + 1);
    setEditTitle(doc.title);
    setShowHistory(false);
    setShowComments(false);
    setShowShare(false);
    setShowProperties(false);
    setShowFindReplace(false);
    setShowInlineCommentForm(false);
    setInlineComments([]);
    setPageLiked(false);
    setPageLikeCount(Math.floor(Math.random() * 6) + 1);
    setPageWatching(true);
    setActiveHeadingIdx(-1);
    setCommentReactions({});
    setReadingProgress(0);
    setShowExportMenu(false);
    setShowActionsMenu(false);
    setShowAnalytics(false);
    setTableToolbar(p => ({ ...p, visible: false }));
    setShowVersionDiff(false);
    setShowMacroBrowser(false);
    setShowNotifications(false);
    setEditorKey(k => k + 1);
  }, []);

  const saveDoc = useCallback(() => {
    if (!editingDoc) return;
    setSaveStatus("saving");
    setDocs(prev => prev.map(d => d.id === editingDoc.id ? { ...d, title: editTitle, content: editContent, updated: "Vừa xong", updatedTimestamp: Date.now() } : d));
    setTimeout(() => setSaveStatus("saved"), 400);
    toast.success("Đã lưu tài liệu");
  }, [editingDoc, editTitle, editContent]);

  // Auto-save after 2s of inactivity
  useEffect(() => {
    if (!editingDoc) return;
    setSaveStatus("unsaved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus("saving");
      setDocs(prev => prev.map(d => d.id === editingDoc.id ? { ...d, title: editTitle, content: editContent, updated: "Vừa xong", updatedTimestamp: Date.now() } : d));
      setTimeout(() => setSaveStatus("saved"), 400);
    }, 2000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [editContent, editTitle]);

  // Set editor innerHTML imperatively to avoid cursor reset
  useEffect(() => {
    if (editorRef.current && editContentRef.current) {
      editorRef.current.innerHTML = editContentRef.current;
    }
  }, [editorKey]);

  const createDoc = useCallback((templateId?: string) => {
    const tpl = templates.find(t => t.id === templateId) || templates[0];
    const newDoc: Doc = {
      id: `d${Date.now()}`, title: tpl.id === "blank" ? "Untitled Document" : tpl.name,
      content: tpl.content, folderId: selectedFolder, category: selectedCategory === "all" ? "specs" : selectedCategory,
      author: "Nguyễn Minh", authorColor: "#0891b2", authorInitial: "NM",
      created: "17/03/2026", updated: "Vừa xong", updatedTimestamp: Date.now(),
      pages: 1, shared: 0, color: tpl.color, bg: "#ecfeff", icon: tpl.icon,
      tags: [], starred: false, locked: false, archived: false, deleted: false, sharedWith: [], versions: [],
      comments: [], collaborators: [{ name: "Nguyễn Minh", initials: "NM", color: "#0891b2", online: true }],
    };
    setDocs(prev => [newDoc, ...prev]);
    setShowTemplates(false);
    openDoc(newDoc);
    toast.success("Đã tạo tài liệu mới");
  }, [selectedFolder, selectedCategory, openDoc]);

  const toggleStar = useCallback((docId: string) => {
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, starred: !d.starred } : d));
  }, []);

  const duplicateDoc = useCallback((docId: string) => {
    const orig = docs.find(d => d.id === docId);
    if (!orig) return;
    const dup = { ...orig, id: `d${Date.now()}`, title: `${orig.title} (Copy)`, updated: "Vừa xong", updatedTimestamp: Date.now(), starred: false };
    setDocs(prev => [dup, ...prev]);
    toast.success("Đã nhân bản tài liệu");
  }, [docs]);

  const archiveDoc = useCallback((docId: string) => {
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, archived: true } : d));
    if (editingDoc?.id === docId) setEditingDoc(null);
    toast.success("Đã lưu trữ tài liệu", { action: { label: "Hoàn tác", onClick: () => setDocs(prev => prev.map(d => d.id === docId ? { ...d, archived: false } : d)) } });
  }, [editingDoc]);

  const restoreDoc = useCallback((docId: string) => {
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, archived: false, deleted: false } : d));
    toast.success("Đã khôi phục tài liệu");
  }, []);

  const moveToTrash = useCallback((docId: string) => {
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, deleted: true } : d));
    if (editingDoc?.id === docId) setEditingDoc(null);
    toast.success("Đã chuyển vào thùng rác", { action: { label: "Hoàn tác", onClick: () => setDocs(prev => prev.map(d => d.id === docId ? { ...d, deleted: false } : d)) } });
  }, [editingDoc]);

  const deleteDoc = useCallback((docId: string) => {
    setDocs(prev => prev.filter(d => d.id !== docId));
    if (editingDoc?.id === docId) setEditingDoc(null);
    toast.success("Đã xoá vĩnh viễn");
  }, [editingDoc]);

  const emptyTrash = useCallback(() => {
    setDocs(prev => prev.filter(d => !d.deleted));
    toast.success("Đã dọn sạch thùng rác");
  }, []);

  /* Sync editor content to ref + state */
  const syncEditorContent = useCallback(() => {
    if (editorRef.current) {
      editContentRef.current = editorRef.current.innerHTML;
      setEditContent(editorRef.current.innerHTML);
    }
  }, []);

  /* Execute formatting command on contentEditable */
  const execCmd = useCallback((command: string, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const sel = window.getSelection();
    const savedRange = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
    if (document.activeElement !== editor) {
      editor.focus();
      if (savedRange && editor.contains(savedRange.startContainer)) {
        sel!.removeAllRanges();
        sel!.addRange(savedRange);
      }
    }
    document.execCommand(command, false, value);
    setTimeout(() => syncEditorContent(), 0);
  }, [syncEditorContent]);

  const toolbarAction = useCallback((action: string) => {
    switch (action) {
      case "H1": execCmd("formatBlock", "h1"); break;
      case "H2": execCmd("formatBlock", "h2"); break;
      case "H3": execCmd("formatBlock", "h3"); break;
      case "Bold": execCmd("bold"); break;
      case "Italic": {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const node = range.commonAncestorContainer;
          const parentEm = node.nodeType === 3 ? (node as Text).parentElement?.closest("em, i") : (node as Element).closest?.("em, i");
          if (parentEm) {
            const parent = parentEm.parentNode;
            if (parent) {
              while (parentEm.firstChild) parent.insertBefore(parentEm.firstChild, parentEm);
              parent.removeChild(parentEm);
              syncEditorContent();
            }
          } else {
            const selectedText = sel.toString();
            if (selectedText) {
              execCmd("insertHTML", `<em>${selectedText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</em>`);
            }
          }
        }
        break;
      }
      case "Underline": execCmd("underline"); break;
      case "Strike": execCmd("strikeThrough"); break;
      case "Quote": execCmd("formatBlock", "blockquote"); break;
      case "Code": {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const selectedText = sel.toString();
          if (selectedText) {
            execCmd("insertHTML", `<code style="background:#F4F5F7;color:#e53e3e;padding:2px 6px;border-radius:3px;font-size:12px;font-family:monospace">${selectedText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code>`);
          }
        }
        break;
      }
      case "CodeBlock": {
        const pre = `<pre style="background:#F4F5F7;color:#172B4D;border:1px solid #DFE1E6;border-radius:3px;padding:16px;margin:12px 0;font-size:12px;line-height:1.6;font-family:monospace"><code>// code here</code></pre><p><br></p>`;
        execCmd("insertHTML", pre);
        break;
      }
      case "Link": {
        const url = prompt("Nhập URL:", "https://");
        if (url) execCmd("createLink", url);
        break;
      }
      case "Image": {
        const url = prompt("Nhập URL hình ảnh:", "https://");
        if (url) execCmd("insertHTML", `<img src="${url}" style="max-width:100%;border-radius:8px;margin:8px 0" />`);
        break;
      }
      case "List": execCmd("insertUnorderedList"); break;
      case "OrderedList": execCmd("insertOrderedList"); break;
      case "Checklist": {
        const checkHtml = `<div style="display:flex;align-items:center;gap:8px;padding:2px 0"><input type="checkbox" disabled style="accent-color:#0052CC"> Mục mới</div>`;
        execCmd("insertHTML", checkHtml);
        break;
      }
      case "Divider": execCmd("insertHTML", '<hr style="border:none;border-top:1px solid #DFE1E6;margin:16px 0">'); break;
      case "Table": {
        const tableHtml = `<table style="width:100%;border-collapse:collapse;margin:12px 0"><thead><tr><th style="border:1px solid #DFE1E6;padding:8px 12px;background:#F4F5F7;text-align:left;color:#172B4D">Cột 1</th><th style="border:1px solid #DFE1E6;padding:8px 12px;background:#F4F5F7;text-align:left;color:#172B4D">Cột 2</th><th style="border:1px solid #DFE1E6;padding:8px 12px;background:#F4F5F7;text-align:left;color:#172B4D">Cột 3</th></tr></thead><tbody><tr><td style="border:1px solid #DFE1E6;padding:8px 12px">&nbsp;</td><td style="border:1px solid #DFE1E6;padding:8px 12px">&nbsp;</td><td style="border:1px solid #DFE1E6;padding:8px 12px">&nbsp;</td></tr></tbody></table><p><br></p>`;
        execCmd("insertHTML", tableHtml);
        break;
      }
      case "Indent": execCmd("indent"); break;
      case "Outdent": execCmd("outdent"); break;
      case "Undo": execCmd("undo"); break;
      case "Redo": execCmd("redo"); break;
      case "Layout": {
        const layoutHtml = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0;padding:16px;border:1px solid #DFE1E6;border-radius:4px;background:#FAFBFC"><div style="min-height:80px;padding:12px;border:1px dashed #DFE1E6;border-radius:4px;background:#fff"><p>Cột trái</p></div><div style="min-height:80px;padding:12px;border:1px dashed #DFE1E6;border-radius:4px;background:#fff"><p>Cột phải</p></div></div><p><br></p>`;
        execCmd("insertHTML", layoutHtml);
        break;
      }
      case "Layout3": {
        const layout3Html = `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin:16px 0;padding:16px;border:1px solid #DFE1E6;border-radius:4px;background:#FAFBFC"><div style="min-height:80px;padding:12px;border:1px dashed #DFE1E6;border-radius:4px;background:#fff"><p>Cột 1</p></div><div style="min-height:80px;padding:12px;border:1px dashed #DFE1E6;border-radius:4px;background:#fff"><p>Cột 2</p></div><div style="min-height:80px;padding:12px;border:1px dashed #DFE1E6;border-radius:4px;background:#fff"><p>Cột 3</p></div></div><p><br></p>`;
        execCmd("insertHTML", layout3Html);
        break;
      }
      case "LayoutSidebar": {
        const layoutSbHtml = `<div style="display:grid;grid-template-columns:1fr 2fr;gap:16px;margin:16px 0;padding:16px;border:1px solid #DFE1E6;border-radius:4px;background:#FAFBFC"><div style="min-height:80px;padding:12px;border:1px dashed #DFE1E6;border-radius:4px;background:#fff"><p>Sidebar</p></div><div style="min-height:80px;padding:12px;border:1px dashed #DFE1E6;border-radius:4px;background:#fff"><p>Nội dung chính</p></div></div><p><br></p>`;
        execCmd("insertHTML", layoutSbHtml);
        break;
      }
      case "Date": {
        const today = new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
        execCmd("insertHTML", `<span style="display:inline-block;background:#DEEBFF;color:#0052CC;padding:2px 8px;border-radius:3px;font-size:12px;vertical-align:middle" contenteditable="false">📅 ${today}</span>&nbsp;`);
        break;
      }
      default: toast(`${action} applied`);
    }
  }, [execCmd]);

  const closeFindReplace = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.querySelectorAll('mark[data-find]').forEach(m => {
        const parent = m.parentNode;
        if (parent) { parent.replaceChild(document.createTextNode(m.textContent || ''), m); parent.normalize(); }
      });
      syncEditorContent();
    }
    setShowFindReplace(false);
    setFindQuery("");
    setReplaceQuery("");
    setFindMatchCount(0);
  }, []);

  /* Editor keyboard shortcuts */
  useEffect(() => {
    if (!editingDoc) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveDoc();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        execCmd("bold");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault();
        toolbarAction("Italic");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "u") {
        e.preventDefault();
        execCmd("underline");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setShowFindReplace(true);
        setTimeout(() => findInputRef.current?.focus(), 50);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "h") {
        e.preventDefault();
        setShowFindReplace(true);
        setTimeout(() => findInputRef.current?.focus(), 50);
        return;
      }
      if (e.key === "Escape" && showFindReplace) {
        closeFindReplace();
        return;
      }
      if (e.key === "Escape" && focusMode) {
        setFocusMode(false);
      }
      if (e.key === "Escape" && !focusMode && !showFindReplace && editingDoc) {
        saveDoc();
        setEditingDoc(null);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [editingDoc, saveDoc, execCmd, toolbarAction, focusMode, showFindReplace, closeFindReplace]);

  /* Move doc to folder */
  const moveDocToFolder = useCallback((docId: string, folderId: string | null) => {
    const folderName = folderId ? folders.find(f => f.id === folderId)?.name || "thư mục" : "gốc";
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, folderId } : d));
    if (editingDoc?.id === docId) setEditingDoc(prev => prev ? { ...prev, folderId } : null);
    setShowMoveFolder(false);
    toast.success(`Đã chuyển vào "${folderName}"`);
  }, [editingDoc, folders]);

  /* Update doc icon */
  const updateDocIcon = useCallback((docId: string, icon: string) => {
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, icon } : d));
    if (editingDoc?.id === docId) setEditingDoc(prev => prev ? { ...prev, icon } : null);
    setShowIconPicker(false);
  }, [editingDoc]);

  /* Add tag to doc */
  const addTagToDoc = useCallback((docId: string, tag: string) => {
    if (!tag.trim()) return;
    const cleanTag = tag.trim().toLowerCase().replace(/[^a-z0-9\u00C0-\u024F-]/gi, "");
    if (!cleanTag) return;
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, tags: d.tags.includes(cleanTag) ? d.tags : [...d.tags, cleanTag] } : d));
    if (editingDoc?.id === docId) setEditingDoc(prev => prev ? { ...prev, tags: prev.tags.includes(cleanTag) ? prev.tags : [...prev.tags, cleanTag] } : null);
    setEditTags("");
    toast.success(`Đã thêm tag #${cleanTag}`);
  }, [editingDoc]);

  /* Remove tag from doc */
  const removeTagFromDoc = useCallback((docId: string, tag: string) => {
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, tags: d.tags.filter(t => t !== tag) } : d));
    if (editingDoc?.id === docId) setEditingDoc(prev => prev ? { ...prev, tags: prev.tags.filter(t => t !== tag) } : null);
  }, [editingDoc]);

  /* Import .md file */
  const importMdFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const title = file.name.replace(/\.md$|\.txt$|\.markdown$/i, "");
      const newDoc: Doc = {
        id: `d${Date.now()}`, title, content,
        folderId: selectedFolder, category: selectedCategory === "all" ? "specs" : selectedCategory,
        author: "Nguyễn Minh", authorColor: "#0891b2", authorInitial: "NM",
        created: "18/03/2026", updated: "Vừa xong", updatedTimestamp: Date.now(),
        pages: Math.ceil(content.split("\n").length / 40), shared: 0,
        color: "#6b7280", bg: "#f3f4f6", icon: "📄",
        tags: [], starred: false, locked: false, archived: false, deleted: false,
        sharedWith: [], versions: [],
        comments: [], collaborators: [{ name: "Nguyễn Minh", initials: "NM", color: "#0891b2", online: true }],
      };
      setDocs(prev => [newDoc, ...prev]);
      openDoc(newDoc);
      toast.success(`Đã import "${title}"`);
    };
    reader.readAsText(file);
  }, [selectedFolder, selectedCategory, openDoc]);

  /* ===== Part 4: Pin/Unpin ===== */
  const togglePin = useCallback((docId: string) => {
    setPinnedDocs(prev => {
      const next = new Set(prev);
      if (next.has(docId)) { next.delete(docId); toast.success("Đã bỏ ghim"); }
      else { next.add(docId); toast.success("Đã ghim tài liệu"); }
      return next;
    });
  }, []);

  /* ===== Batch Operations ===== */
  const toggleSelectDoc = useCallback((docId: string) => {
    setSelectedDocs(prev => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId); else next.add(docId);
      return next;
    });
  }, []);

  const selectAllFiltered = useCallback((filteredIds: string[]) => {
    setSelectedDocs(prev => {
      if (filteredIds.every(id => prev.has(id))) return new Set();
      return new Set(filteredIds);
    });
  }, []);

  const batchArchive = useCallback(() => {
    const count = selectedDocs.size;
    setDocs(prev => prev.map(d => selectedDocs.has(d.id) ? { ...d, archived: true } : d));
    setSelectedDocs(new Set());
    toast.success(`Đã lưu trữ ${count} tài liệu`);
  }, [selectedDocs]);

  const batchTrash = useCallback(() => {
    const count = selectedDocs.size;
    setDocs(prev => prev.map(d => selectedDocs.has(d.id) ? { ...d, deleted: true } : d));
    setSelectedDocs(new Set());
    toast.success(`Đã chuyển ${count} tài liệu vào thùng rác`);
  }, [selectedDocs]);

  const batchStar = useCallback(() => {
    const count = selectedDocs.size;
    setDocs(prev => prev.map(d => selectedDocs.has(d.id) ? { ...d, starred: true } : d));
    setSelectedDocs(new Set());
    toast.success(`Đã đánh dấu ${count} tài liệu`);
  }, [selectedDocs]);

  const batchMoveToFolder = useCallback((folderId: string | null) => {
    const count = selectedDocs.size;
    const folderName = folderId ? folders.find(f => f.id === folderId)?.name || "thư mục" : "gốc";
    setDocs(prev => prev.map(d => selectedDocs.has(d.id) ? { ...d, folderId } : d));
    setSelectedDocs(new Set());
    toast.success(`Đã chuyển ${count} tài liệu vào "${folderName}"`);
  }, [selectedDocs, folders]);

  /* Drag & drop file import handlers */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const mdFiles = files.filter(f => /\.(md|txt|markdown)$/i.test(f.name));
    if (mdFiles.length === 0) { toast.error("Chỉ hỗ trợ file .md, .txt, .markdown"); return; }
    mdFiles.forEach(f => importMdFile(f));
  }, [importMdFile]);

  const addComment = useCallback(() => {
    if (!newComment.trim() || !editingDoc) return;
    const comment = { id: Date.now(), author: "Nguyễn Minh", initials: "NM", color: "#0891b2", text: newComment.trim(), time: "Vừa xong" };
    setDocs(prev => prev.map(d => d.id === editingDoc.id ? { ...d, comments: [comment, ...d.comments] } : d));
    setEditingDoc(prev => prev ? { ...prev, comments: [comment, ...prev.comments] } : null);
    setNewComment("");
    toast.success("Đã thêm comment");
  }, [newComment, editingDoc]);

  /* ============ SLASH COMMAND ITEMS ============ */
  const slashCommands = useMemo(() => [
    { id: "h1", label: "Heading 1", desc: "Tiêu đề lớn", icon: <Heading1 className="w-4 h-4" />, group: "Cơ bản", action: () => execCmd("formatBlock", "h1") },
    { id: "h2", label: "Heading 2", desc: "Tiêu đề vừa", icon: <Heading2 className="w-4 h-4" />, group: "Cơ bản", action: () => execCmd("formatBlock", "h2") },
    { id: "h3", label: "Heading 3", desc: "Tiêu đề nhỏ", icon: <Heading3 className="w-4 h-4" />, group: "Cơ bản", action: () => execCmd("formatBlock", "h3") },
    { id: "quote", label: "Trích dẫn", desc: "Blockquote", icon: <Quote className="w-4 h-4" />, group: "Cơ bản", action: () => execCmd("formatBlock", "blockquote") },
    { id: "divider", label: "Đường kẻ ngang", desc: "Phân tách nội dung", icon: <Minus className="w-4 h-4" />, group: "Cơ bản", action: () => toolbarAction("Divider") },
    { id: "bullet", label: "Danh sách", desc: "Bulleted list", icon: <List className="w-4 h-4" />, group: "Danh sách", action: () => execCmd("insertUnorderedList") },
    { id: "numbered", label: "Đánh số", desc: "Numbered list", icon: <ListOrdered className="w-4 h-4" />, group: "Danh sách", action: () => execCmd("insertOrderedList") },
    { id: "checklist", label: "Checklist", desc: "Danh sách checkbox", icon: <ListChecks className="w-4 h-4" />, group: "Danh sách", action: () => toolbarAction("Checklist") },
    { id: "code", label: "Code Block", desc: "Khối mã nguồn", icon: <Code className="w-4 h-4" />, group: "Media & Nâng cao", action: () => toolbarAction("CodeBlock") },
    { id: "table", label: "Bảng", desc: "Chèn bảng dữ liệu", icon: <Table className="w-4 h-4" />, group: "Media & Nâng cao", action: () => toolbarAction("Table") },
    { id: "image", label: "Hình ảnh", desc: "Chèn ảnh từ URL", icon: <Image className="w-4 h-4" />, group: "Media & Nâng cao", action: () => toolbarAction("Image") },
    { id: "link", label: "Liên kết", desc: "Chèn hyperlink", icon: <Link className="w-4 h-4" />, group: "Media & Nâng cao", action: () => toolbarAction("Link") },
    { id: "callout-info", label: "Callout Info", desc: "Khung thông tin", icon: <HelpCircle className="w-4 h-4" />, group: "Macro", action: () => execCmd("insertHTML", `<div style="background:#DEEBFF;border-left:3px solid #0052CC;padding:12px 16px;border-radius:3px;margin:8px 0;color:#172B4D"><strong style="color:#0052CC">ℹ️ Lưu ý</strong><br>Nội dung thông tin...</div><p><br></p>`) },
    { id: "callout-warn", label: "Callout Warning", desc: "Khung cảnh báo", icon: <HelpCircle className="w-4 h-4" />, group: "Macro", action: () => execCmd("insertHTML", `<div style="background:#FFFAE6;border-left:3px solid #FF8B00;padding:12px 16px;border-radius:3px;margin:8px 0;color:#172B4D"><strong style="color:#FF8B00">⚠️ Cảnh báo</strong><br>Nội dung cảnh báo...</div><p><br></p>`) },
    { id: "callout-success", label: "Callout Success", desc: "Khung thành công", icon: <CheckSquare className="w-4 h-4" />, group: "Macro", action: () => execCmd("insertHTML", `<div style="background:#E3FCEF;border-left:3px solid #00875A;padding:12px 16px;border-radius:3px;margin:8px 0;color:#172B4D"><strong style="color:#00875A">✅ Thành công</strong><br>Nội dung thành công...</div><p><br></p>`) },
    { id: "callout-error", label: "Callout Error", desc: "Khung lỗi", icon: <X className="w-4 h-4" />, group: "Macro", action: () => execCmd("insertHTML", `<div style="background:#FFEBE6;border-left:3px solid #DE350B;padding:12px 16px;border-radius:3px;margin:8px 0;color:#172B4D"><strong style="color:#DE350B">❌ Lỗi</strong><br>Nội dung lỗi...</div><p><br></p>`) },
    { id: "expand", label: "Mở rộng", desc: "Nội dung ẩn/hiện", icon: <ChevronDown className="w-4 h-4" />, group: "Macro", action: () => execCmd("insertHTML", `<details style="border:1px solid #DFE1E6;border-radius:3px;margin:8px 0;padding:0"><summary style="padding:8px 12px;cursor:pointer;background:#FAFBFC;color:#172B4D;font-weight:500">Click để mở rộng</summary><div style="padding:12px 16px;border-top:1px solid #DFE1E6">Nội dung ẩn...</div></details><p><br></p>`) },
    { id: "status", label: "Status Lozenge", desc: "Nhãn trạng thái màu", icon: <CircleDot className="w-4 h-4" />, group: "Macro", action: () => execCmd("insertHTML", `<span style="display:inline-block;background:#DEEBFF;color:#0052CC;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;line-height:16px;vertical-align:middle">IN PROGRESS</span>&nbsp;`) },
    { id: "decision", label: "Quyết định", desc: "Ghi nhận quyết định", icon: <Vote className="w-4 h-4" />, group: "Macro", action: () => execCmd("insertHTML", `<div style="background:#E3FCEF;border-radius:3px;padding:12px 16px;margin:8px 0;display:flex;align-items:flex-start;gap:10px"><span style="font-size:18px;line-height:1">🟢</span><div><strong style="color:#006644;display:block;margin-bottom:4px">Quyết định</strong><span style="color:#172B4D">Nội dung quyết định...</span></div></div><p><br></p>`) },
    { id: "action", label: "Action Item", desc: "Mục hành động cần thực hiện", icon: <Zap className="w-4 h-4" />, group: "Macro", action: () => execCmd("insertHTML", `<div style="background:#EAE6FF;border-radius:3px;padding:12px 16px;margin:8px 0;display:flex;align-items:flex-start;gap:10px"><span style="font-size:18px;line-height:1">⚡</span><div><strong style="color:#403294;display:block;margin-bottom:4px">Action Item</strong><span style="color:#172B4D">Mô tả action item... — <em style='color:#6B778C'>@Người phụ trách</em></span></div></div><p><br></p>`) },
    { id: "date", label: "Ngày tháng", desc: "Chèn mốc thời gian", icon: <Calendar className="w-4 h-4" />, group: "Macro", action: () => { const today = new Date(); const formatted = `${today.getDate().toString().padStart(2,'0')}/${(today.getMonth()+1).toString().padStart(2,'0')}/${today.getFullYear()}`; execCmd("insertHTML", `<span style="display:inline-block;background:#F4F5F7;color:#172B4D;padding:2px 8px;border-radius:3px;font-size:12px;border:1px solid #DFE1E6;vertical-align:middle">📅 ${formatted}</span>&nbsp;`); } },
    { id: "mention", label: "Mention", desc: "Nhắc đến thành viên", icon: <AtSign className="w-4 h-4" />, group: "Macro", action: () => { editorRef.current?.focus(); execCmd("insertText", "@"); } },
    { id: "note-tip", label: "Tip Panel", desc: "Khung mẹo hữu ích", icon: <Zap className="w-4 h-4" />, group: "Macro", action: () => execCmd("insertHTML", `<div style="background:#E3FCEF;border-left:3px solid #00875A;padding:12px 16px;border-radius:3px;margin:8px 0;color:#172B4D"><strong style="color:#00875A">💡 Mẹo</strong><br>Nội dung mẹo hữu ích...</div><p><br></p>`) },
    { id: "two-col", label: "2 cột", desc: "Bố cục 2 cột", icon: <Columns2 className="w-4 h-4" />, group: "Macro", action: () => execCmd("insertHTML", `<div style="display:flex;gap:16px;margin:12px 0"><div style="flex:1;padding:12px;background:#FAFBFC;border:1px solid #DFE1E6;border-radius:3px;min-height:80px">Cột trái...</div><div style="flex:1;padding:12px;background:#FAFBFC;border:1px solid #DFE1E6;border-radius:3px;min-height:80px">Cột phải...</div></div><p><br></p>`) },
    { id: "three-col", label: "3 cột", desc: "Bố cục 3 cột", icon: <LayoutGrid className="w-4 h-4" />, group: "Macro", action: () => execCmd("insertHTML", `<div style="display:flex;gap:16px;margin:12px 0"><div style="flex:1;padding:12px;background:#FAFBFC;border:1px solid #DFE1E6;border-radius:3px;min-height:80px">Cột 1...</div><div style="flex:1;padding:12px;background:#FAFBFC;border:1px solid #DFE1E6;border-radius:3px;min-height:80px">Cột 2...</div><div style="flex:1;padding:12px;background:#FAFBFC;border:1px solid #DFE1E6;border-radius:3px;min-height:80px">Cột 3...</div></div><p><br></p>`) },
    { id: "sidebar-layout", label: "Sidebar Layout", desc: "Bố cục có sidebar", icon: <PanelRightOpen className="w-4 h-4" />, group: "Macro", action: () => execCmd("insertHTML", `<div style="display:flex;gap:16px;margin:12px 0"><div style="flex:2;padding:12px;background:#FAFBFC;border:1px solid #DFE1E6;border-radius:3px;min-height:100px">Nội dung chính...</div><div style="flex:1;padding:12px;background:#F4F5F7;border:1px solid #DFE1E6;border-radius:3px;min-height:100px">Sidebar...</div></div><p><br></p>`) },
    { id: "toc-macro", label: "Mục lục", desc: "Table of Contents tự động", icon: <BookOpen className="w-4 h-4" />, group: "Macro", action: () => execCmd("insertHTML", `<div style="background:#F4F5F7;border:1px solid #DFE1E6;border-radius:3px;padding:16px;margin:12px 0"><strong style="color:#172B4D;display:block;margin-bottom:8px">📑 Mục lục</strong><div style="color:#0052CC;font-size:13px;line-height:2">• Mục lục sẽ tự tạo từ các headings<br>• Di chuyển nhanh đến từng phần<br>• Cập nhật tự động khi chỉnh sửa</div></div><p><br></p>`) },
    { id: "note-panel", label: "Note Panel", desc: "Khung ghi chú", icon: <FileText className="w-4 h-4" />, group: "Macro", action: () => execCmd("insertHTML", `<div style="background:#EAE6FF;border-left:3px solid #5243AA;padding:12px 16px;border-radius:3px;margin:8px 0;color:#172B4D"><strong style="color:#5243AA">📝 Ghi chú</strong><br>Nội dung ghi chú...</div><p><br></p>`) },
  ], [execCmd, toolbarAction]);

  /* ============ MACRO BROWSER DATA (moved to docs-data.ts) ============ */
  const macroBrowserItems = macroBrowserItemsData;

  /* macroBrowserCategories moved to MacroBrowserModal */

  const filteredMacros = useMemo(() => {
    let list = macroBrowserItems;
    if (macroBrowserCategory !== "all") list = list.filter(m => m.category === macroBrowserCategory);
    if (macroBrowserSearch.trim()) {
      const q = macroBrowserSearch.toLowerCase();
      list = list.filter(m => m.label.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q));
    }
    return list;
  }, [macroBrowserItems, macroBrowserCategory, macroBrowserSearch]);

  const insertMacro = useCallback((macro: typeof macroBrowserItems[0]) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    if (macro.html) {
      execCmd("insertHTML", macro.html);
    } else if (macro.id === "date-m") {
      const today = new Date();
      const formatted = `${today.getDate().toString().padStart(2,'0')}/${(today.getMonth()+1).toString().padStart(2,'0')}/${today.getFullYear()}`;
      execCmd("insertHTML", `<span style="display:inline-block;background:#F4F5F7;color:#172B4D;padding:2px 8px;border-radius:3px;font-size:12px;border:1px solid #DFE1E6;vertical-align:middle">📅 ${formatted}</span>&nbsp;`);
    } else if (macro.id === "divider-m") {
      execCmd("insertHTML", "<hr style='border:none;border-top:1px solid #DFE1E6;margin:16px 0'><p><br></p>");
    } else if (macro.id === "quote-m") {
      execCmd("formatBlock", "blockquote");
    } else if (macro.id === "checklist-m") {
      toolbarAction("Checklist");
    }
    setShowMacroBrowser(false);
    setMacroBrowserSearch("");
    setMacroBrowserCategory("all");
    setMacroBrowserPreview(null);
    toast.success(`Đã chèn ${macro.label}`);
  }, [execCmd, toolbarAction]);

  const filteredSlashCommands = useMemo(() => {
    if (!slashMenu.query) return slashCommands;
    const q = slashMenu.query.toLowerCase();
    return slashCommands.filter(c => c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q) || c.id.includes(q));
  }, [slashCommands, slashMenu.query]);

  /* ===== Floating Toolbar: show on text selection ===== */
  const handleSelectionChange = useCallback(() => {
    if (!editingDoc || editorMode !== "edit") return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setFloatingToolbar(p => ({ ...p, visible: false }));
      return;
    }
    const range = sel.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) {
      setFloatingToolbar(p => ({ ...p, visible: false }));
      return;
    }
    const rect = range.getBoundingClientRect();
    setFloatingToolbar({ x: rect.left + rect.width / 2, y: rect.top - 8, visible: true });
  }, [editingDoc, editorMode]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [handleSelectionChange]);

  // Close slash/mention menu on outside click
  useEffect(() => {
    if (!slashMenu.visible && !mentionMenu.visible) return;
    const handler = (e: MouseEvent) => {
      if (slashMenu.visible && slashMenuRef.current && !slashMenuRef.current.contains(e.target as Node)) {
        setSlashMenu(p => ({ ...p, visible: false }));
      }
      if (mentionMenu.visible && mentionMenuRef.current && !mentionMenuRef.current.contains(e.target as Node)) {
        setMentionMenu(p => ({ ...p, visible: false }));
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [slashMenu.visible, mentionMenu.visible]);

  /* ===== Execute slash command ===== */
  const executeSlashCommand = useCallback((cmd: typeof slashCommands[0]) => {
    // Remove the slash and query text from the editor
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const node = sel.anchorNode;
      if (node && node.textContent) {
        const text = node.textContent;
        const slashIdx = text.lastIndexOf("/", sel.anchorOffset);
        if (slashIdx >= 0) {
          const beforeSlash = text.slice(0, slashIdx);
          const afterCursor = text.slice(sel.anchorOffset);
          node.textContent = beforeSlash + afterCursor;
          const newRange = document.createRange();
          newRange.setStart(node, Math.min(slashIdx, node.textContent.length));
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
      }
    }
    setSlashMenu(p => ({ ...p, visible: false }));
    setTimeout(() => cmd.action(), 10);
  }, [slashCommands]);

  /* ===== Mention: filter team members ===== */
  const filteredMembers = useMemo(() => {
    if (!mentionMenu.query) return teamMembers;
    const q = mentionMenu.query.toLowerCase();
    return teamMembers.filter(m => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q));
  }, [mentionMenu.query]);

  const insertMention = useCallback((member: typeof teamMembers[0]) => {
    // Remove the "@" + query text, then insert styled mention
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const node = sel.anchorNode;
      if (node && node.textContent) {
        const text = node.textContent;
        const atIdx = text.lastIndexOf("@", sel.anchorOffset);
        if (atIdx >= 0) {
          const beforeAt = text.slice(0, atIdx);
          const afterCursor = text.slice(sel.anchorOffset);
          node.textContent = beforeAt + afterCursor;
          const newRange = document.createRange();
          newRange.setStart(node, Math.min(atIdx, node.textContent.length));
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
      }
    }
    setMentionMenu(p => ({ ...p, visible: false }));
    setTimeout(() => {
      execCmd("insertHTML", `<span style="display:inline-block;background:#DEEBFF;color:#0052CC;padding:1px 6px;border-radius:3px;font-size:13px;font-weight:500;cursor:pointer" contenteditable="false">@${member.name}</span>&nbsp;`);
    }, 10);
  }, [execCmd]);

  /* ===== Inline Comment: add comment on selected text ===== */
  const addInlineComment = useCallback(() => {
    if (!inlineCommentText.trim() || !inlineCommentSelection) return;
    const comment = {
      id: Date.now(),
      text: inlineCommentText.trim(),
      selectedText: inlineCommentSelection,
      author: "Nguyễn Minh", initials: "NM", color: "#0891b2",
      time: "Vừa xong",
      resolved: false,
      reactions: {} as Record<string, string[]>,
    };
    setInlineComments(prev => [comment, ...prev]);
    // Highlight the selected text in editor
    execCmd("hiliteColor", "#FFF0B3");
    setShowInlineCommentForm(false);
    setInlineCommentText("");
    setInlineCommentSelection("");
    setFloatingToolbar(p => ({ ...p, visible: false }));
    toast.success("Đã thêm inline comment");
  }, [inlineCommentText, inlineCommentSelection, execCmd]);

  /* ===== Toggle reaction on inline comment ===== */
  const toggleInlineReaction = useCallback((commentId: number, emoji: string) => {
    setInlineComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      const users = c.reactions[emoji] || [];
      const me = "Nguyễn Minh";
      const updated = users.includes(me) ? users.filter(u => u !== me) : [...users, me];
      const newReactions = { ...c.reactions };
      if (updated.length === 0) delete newReactions[emoji];
      else newReactions[emoji] = updated;
      return { ...c, reactions: newReactions };
    }));
  }, []);

  /* ===== Toggle reaction on regular comment ===== */
  const [commentReactions, setCommentReactions] = useState<Record<number, Record<string, string[]>>>({});
  const toggleCommentReaction = useCallback((commentId: number, emoji: string) => {
    setCommentReactions(prev => {
      const cr = { ...prev };
      const reactions = cr[commentId] || {};
      const users = reactions[emoji] || [];
      const me = "Nguyễn Minh";
      const updated = users.includes(me) ? users.filter(u => u !== me) : [...users, me];
      const newReactions = { ...reactions };
      if (updated.length === 0) delete newReactions[emoji];
      else newReactions[emoji] = updated;
      cr[commentId] = newReactions;
      return cr;
    });
  }, []);

  /* ===== Find & Replace ===== */
  const executeFindInEditor = useCallback((query: string) => {
    if (!query || !editorRef.current) { setFindMatchCount(0); setFindCurrentMatch(0); return; }
    const el = editorRef.current;
    // Remove previous highlights
    el.querySelectorAll('mark[data-find]').forEach(m => {
      const parent = m.parentNode;
      if (parent) { parent.replaceChild(document.createTextNode(m.textContent || ''), m); parent.normalize(); }
    });
    if (!query.trim()) { setFindMatchCount(0); return; }
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const matches: { node: Text; start: number }[] = [];
    let textNode: Text | null;
    while ((textNode = walker.nextNode() as Text | null)) {
      const text = textNode.textContent || '';
      let idx = 0;
      const lc = text.toLowerCase();
      const qlc = query.toLowerCase();
      while ((idx = lc.indexOf(qlc, idx)) !== -1) {
        matches.push({ node: textNode, start: idx });
        idx += qlc.length;
      }
    }
    setFindMatchCount(matches.length);
    setFindCurrentMatch(matches.length > 0 ? 1 : 0);
    // Highlight matches
    for (let i = matches.length - 1; i >= 0; i--) {
      const { node, start } = matches[i];
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, start + query.length);
      const mark = document.createElement('mark');
      mark.setAttribute('data-find', 'true');
      mark.style.cssText = i === 0 ? 'background:#FF8F73;padding:1px 0;border-radius:2px' : 'background:#FFFAE6;padding:1px 0;border-radius:2px';
      range.surroundContents(mark);
    }
    // Scroll to first
    const first = el.querySelector('mark[data-find]');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const executeReplace = useCallback((replaceAll: boolean) => {
    if (!editorRef.current || !findQuery) return;
    const marks = editorRef.current.querySelectorAll('mark[data-find]');
    if (replaceAll) {
      marks.forEach(m => { m.replaceWith(document.createTextNode(replaceQuery)); });
      setFindMatchCount(0); setFindCurrentMatch(0);
      toast.success(`Đã thay thế ${marks.length} kết quả`);
    } else {
      if (marks.length > 0) {
        const current = marks[Math.max(0, findCurrentMatch - 1)];
        if (current) {
          current.replaceWith(document.createTextNode(replaceQuery));
          setFindMatchCount(p => p - 1);
        }
      }
    }
    syncEditorContent();
  }, [findQuery, replaceQuery, findCurrentMatch, syncEditorContent]);

  /* ===== Export functions ===== */
  const exportAsHtml = useCallback(() => {
    if (!editingDoc) return;
    const fullHtml = `<!DOCTYPE html>\n<html lang="vi">\n<head><meta charset="UTF-8"><title>${editTitle}</title><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#172B4D;line-height:1.714}h1{font-size:24px;margin-top:40px}h2{font-size:20px;margin-top:28px}h3{font-size:16px;margin-top:24px}code{background:#F4F5F7;padding:2px 6px;border-radius:3px;font-size:12px}pre{background:#F4F5F7;padding:16px;border-radius:3px;overflow-x:auto}blockquote{border-left:2px solid #DFE1E6;padding-left:10px;color:#6B778C;font-style:italic}table{width:100%;border-collapse:collapse}th,td{border:1px solid #DFE1E6;padding:8px 12px;text-align:left}th{background:#F4F5F7}a{color:#0052CC}</style></head>\n<body>\n<h1>${editTitle}</h1>\n<p style="color:#6B778C;font-size:12px">${editingDoc.author} · ${editingDoc.created}</p>\n${editContent}\n</body></html>`;
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${editTitle.replace(/\s+/g, "_")}.html`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã export file .html");
    setShowExportMenu(false);
  }, [editingDoc, editTitle, editContent]);

  const exportPrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Không thể mở cửa sổ in"); return; }
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${editTitle}</title><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#172B4D;line-height:1.714;font-size:14px}h1{font-size:24px}h2{font-size:20px}h3{font-size:16px}code{background:#eee;padding:2px 6px;border-radius:3px;font-size:12px}pre{background:#eee;padding:16px;border-radius:3px}blockquote{border-left:3px solid #ccc;padding-left:10px;color:#666;font-style:italic}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px}th{background:#f5f5f5}@media print{body{margin:0;padding:20px}}</style></head><body><h1>${editTitle}</h1>${editContent}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 300);
    toast.success("Đang mở trang in...");
    setShowExportMenu(false);
  }, [editTitle, editContent]);

  const copyRichText = useCallback(() => {
    const html = `<h1>${editTitle}</h1>${editContent}`;
    const blob = new Blob([html], { type: "text/html" });
    const plainText = getPlainText(editContent);
    if (navigator.clipboard && window.ClipboardItem) {
      navigator.clipboard.write([new ClipboardItem({
        "text/html": blob,
        "text/plain": new Blob([plainText], { type: "text/plain" }),
      })]).then(() => toast.success("Đã copy nội dung có format"));
    } else {
      copyToClipboard(plainText).then(() => toast.success("Đã copy nội dung (plain text)"));
    }
    setShowExportMenu(false);
  }, [editTitle, editContent]);

  /* ===== Reading progress tracking ===== */
  const handleEditorScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const scrollHeight = el.scrollHeight - el.clientHeight;
    if (scrollHeight > 0) {
      setReadingProgress(Math.round((el.scrollTop / scrollHeight) * 100));
    }
  }, []);

  /* ===== Table toolbar: detect click on table ===== */
  const handleEditorClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const td = target.closest("td, th") as HTMLElement | null;
    const table = target.closest("table") as HTMLTableElement | null;
    if (td && table && editorRef.current?.contains(table)) {
      const rect = table.getBoundingClientRect();
      setTableToolbar({ x: rect.left + rect.width / 2, y: rect.top - 8, visible: true, table });
    } else {
      setTableToolbar(p => ({ ...p, visible: false }));
    }
  }, []);

  const tableAddRow = useCallback(() => {
    const table = tableToolbar.table;
    if (!table) return;
    const rows = table.rows;
    const lastRow = rows[rows.length - 1];
    const cols = lastRow ? lastRow.cells.length : 3;
    const newRow = table.insertRow(-1);
    for (let i = 0; i < cols; i++) {
      const cell = newRow.insertCell(-1);
      cell.textContent = "";
      cell.style.cssText = "padding:8px 12px;border:1px solid #DFE1E6;min-width:80px";
    }
    syncEditorContent();
    toast.success("Đã thêm hàng");
  }, [tableToolbar.table]);

  const tableDeleteRow = useCallback(() => {
    const table = tableToolbar.table;
    if (!table || table.rows.length <= 1) return;
    table.deleteRow(table.rows.length - 1);
    syncEditorContent();
    toast.success("Đã xoá hàng cuối");
  }, [tableToolbar.table]);

  const tableAddCol = useCallback(() => {
    const table = tableToolbar.table;
    if (!table) return;
    for (let i = 0; i < table.rows.length; i++) {
      const cell = table.rows[i].insertCell(-1);
      cell.textContent = i === 0 ? "Header" : "";
      cell.style.cssText = i === 0
        ? "padding:8px 12px;border:1px solid #DFE1E6;background:#F4F5F7;font-weight:600;min-width:80px"
        : "padding:8px 12px;border:1px solid #DFE1E6;min-width:80px";
    }
    syncEditorContent();
    toast.success("Đã thêm cột");
  }, [tableToolbar.table]);

  const tableDeleteCol = useCallback(() => {
    const table = tableToolbar.table;
    if (!table) return;
    const cols = table.rows[0]?.cells.length || 0;
    if (cols <= 1) return;
    for (let i = 0; i < table.rows.length; i++) {
      table.rows[i].deleteCell(table.rows[i].cells.length - 1);
    }
    syncEditorContent();
    toast.success("Đã xoá cột cuối");
  }, [tableToolbar.table]);

  const tableDeleteTable = useCallback(() => {
    const table = tableToolbar.table;
    if (!table) return;
    table.remove();
    setTableToolbar(p => ({ ...p, visible: false }));
    syncEditorContent();
    toast.success("Đã xoá bảng");
  }, [tableToolbar.table]);

  const tableToggleHeaderRow = useCallback(() => {
    const table = tableToolbar.table;
    if (!table || !table.rows[0]) return;
    const firstRow = table.rows[0];
    const isHeader = firstRow.cells[0]?.style.backgroundColor === "rgb(244, 245, 247)";
    for (let i = 0; i < firstRow.cells.length; i++) {
      const cell = firstRow.cells[i];
      if (isHeader) {
        cell.style.backgroundColor = "";
        cell.style.fontWeight = "";
      } else {
        cell.style.backgroundColor = "#F4F5F7";
        cell.style.fontWeight = "600";
      }
    }
    syncEditorContent();
  }, [tableToolbar.table, syncEditorContent]);

  /* ===== Page labels ===== */
  const addPageLabel = useCallback((label: string) => {
    const clean = label.trim().toLowerCase().replace(/[^a-z0-9\u00C0-\u024F\-]/gi, "");
    if (!clean) return;
    if (pageLabels.includes(clean)) { toast.error("Label đã tồn tại"); return; }
    setPageLabels(prev => [...prev, clean]);
    setNewLabel("");
    setShowLabelInput(false);
    toast.success(`Đã thêm label "${clean}"`);
  }, [pageLabels]);

  const removePageLabel = useCallback((label: string) => {
    setPageLabels(prev => prev.filter(l => l !== label));
    toast.success(`Đã xoá label "${label}"`);
  }, []);

  /* ===== Slash Command: detect "/" typing ===== */
  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Ctrl/Cmd+F: Find
    if ((e.metaKey || e.ctrlKey) && e.key === "f") {
      e.preventDefault();
      setShowFindReplace(true);
      setTimeout(() => findInputRef.current?.focus(), 50);
      return;
    }
    // Ctrl/Cmd+H: Replace
    if ((e.metaKey || e.ctrlKey) && e.key === "h") {
      e.preventDefault();
      setShowFindReplace(true);
      setTimeout(() => findInputRef.current?.focus(), 50);
      return;
    }
    // Slash command trigger
    if (e.key === "/" && !slashMenu.visible && !e.metaKey && !e.ctrlKey) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const node = sel.anchorNode;
        const textBefore = node?.textContent?.slice(0, sel.anchorOffset) || "";
        if (textBefore === "" || textBefore.endsWith(" ") || textBefore.endsWith("\n")) {
          setTimeout(() => {
            setSlashMenu({ x: rect.left, y: rect.bottom + 4, visible: true, query: "", startOffset: sel.anchorOffset + 1 });
            setSlashSelectedIdx(0);
          }, 10);
        }
      }
    }
    // @ Mention trigger
    if (e.key === "@" && !mentionMenu.visible && !slashMenu.visible && !e.metaKey && !e.ctrlKey) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setTimeout(() => {
          setMentionMenu({ x: rect.left, y: rect.bottom + 4, visible: true, query: "" });
          setMentionSelectedIdx(0);
        }, 10);
      }
    }
    // Navigate slash menu
    if (slashMenu.visible) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashSelectedIdx(p => Math.min(p + 1, filteredSlashCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashSelectedIdx(p => Math.max(p - 1, 0));
      } else if (e.key === "Enter" && filteredSlashCommands.length > 0) {
        e.preventDefault();
        executeSlashCommand(filteredSlashCommands[slashSelectedIdx]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSlashMenu(p => ({ ...p, visible: false }));
      }
    }
    // Navigate mention menu
    if (mentionMenu.visible) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionSelectedIdx(p => Math.min(p + 1, filteredMembers.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionSelectedIdx(p => Math.max(p - 1, 0));
      } else if (e.key === "Enter" && filteredMembers.length > 0) {
        e.preventDefault();
        insertMention(filteredMembers[mentionSelectedIdx]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setMentionMenu(p => ({ ...p, visible: false }));
      }
    }
  }, [slashMenu, filteredSlashCommands, slashSelectedIdx, executeSlashCommand, mentionMenu, filteredMembers, insertMention]);

  /* ===== Slash command: track query as user types ===== */
  const handleEditorInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const html = (e.target as HTMLDivElement).innerHTML;
    editContentRef.current = html;
    // Debounce state update to avoid re-render killing cursor
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setEditContent(editContentRef.current);
    }, 300);
    // Track slash command query
    if (slashMenu.visible) {
      const sel = window.getSelection();
      if (sel && sel.anchorNode) {
        const text = sel.anchorNode.textContent || "";
        const cursorPos = sel.anchorOffset;
        const slashIdx = text.lastIndexOf("/", cursorPos);
        if (slashIdx >= 0) {
          const query = text.slice(slashIdx + 1, cursorPos);
          setSlashMenu(p => ({ ...p, query }));
          setSlashSelectedIdx(0);
        } else {
          setSlashMenu(p => ({ ...p, visible: false }));
        }
      }
    }
    // Track mention query
    if (mentionMenu.visible) {
      const sel = window.getSelection();
      if (sel && sel.anchorNode) {
        const text = sel.anchorNode.textContent || "";
        const cursorPos = sel.anchorOffset;
        const atIdx = text.lastIndexOf("@", cursorPos);
        if (atIdx >= 0) {
          const query = text.slice(atIdx + 1, cursorPos);
          setMentionMenu(p => ({ ...p, query }));
          setMentionSelectedIdx(0);
        } else {
          setMentionMenu(p => ({ ...p, visible: false }));
        }
      }
    }
  }, [slashMenu.visible, mentionMenu.visible]);

  /* ===== Block inserter: show + on empty lines on hover ===== */
  const handleEditorMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (editorMode !== "edit") return;
    const editor = editorRef.current;
    if (!editor) return;
    const target = e.target as HTMLElement;
    // Find the closest block element
    const block = target.closest("p, div, h1, h2, h3, h4, li, blockquote") as HTMLElement;
    if (!block || !editor.contains(block)) {
      setBlockInserter(p => ({ ...p, visible: false }));
      return;
    }
    // Only show on empty blocks
    const text = block.textContent?.trim() || "";
    const isEmpty = text === "" || (block.tagName === "P" && block.innerHTML === "<br>");
    if (isEmpty) {
      const rect = block.getBoundingClientRect();
      const editorRect = editor.getBoundingClientRect();
      setBlockInserter({ x: editorRect.left - 30, y: rect.top + rect.height / 2 - 12, visible: true });
    } else {
      setBlockInserter(p => ({ ...p, visible: false }));
    }
  }, [editorMode]);

  /* ============ DOC EDITOR VIEW ============ */
  if (editingDoc) {
    const onlineCollabs = editingDoc.collaborators.filter(c => c.online);
    const plainText = getPlainText(editContent);
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    const charCount = plainText.length;
    const lineCount = plainText.split("\n").length;
    const readTime = Math.ceil(wordCount / 250);
    const headings = getHtmlHeadings(editContent);

    /* Confluence-style content typography classes */
    const confluenceContentCls = "text-[14px] leading-[1.714] [&>h1]:text-[24px] [&>h1]:mt-10 [&>h1]:mb-3 [&>h2]:text-[20px] [&>h2]:mt-7 [&>h2]:mb-2 [&>h3]:text-[16px] [&>h3]:mt-6 [&>h3]:mb-2 [&>blockquote]:border-l-2 [&>blockquote]:border-[#DFE1E6] [&>blockquote]:pl-[10px] [&>blockquote]:py-1 [&>blockquote]:my-3 [&>blockquote]:italic [&>blockquote]:text-[#6B778C] [&_a]:text-[#0052CC] [&_a]:underline [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_li]:py-0.5 [&_table]:w-full [&_table]:border-collapse [&_th]:p-2 [&_th]:text-left [&_th]:bg-[#F4F5F7] [&_th]:border [&_th]:border-[#DFE1E6] [&_td]:p-2 [&_td]:border [&_td]:border-[#DFE1E6] [&_pre]:rounded-[3px] [&_pre]:p-4 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:text-[12px] [&_pre]:leading-relaxed [&_pre]:font-mono [&_pre]:bg-[#F4F5F7] [&_pre]:border [&_pre]:border-[#DFE1E6] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-[3px] [&_code]:text-[12px] [&_code]:font-mono [&_code]:bg-[#F4F5F7] [&_code]:text-[#e53e3e] [&_pre_code]:p-0 [&_pre_code]:bg-transparent [&_pre_code]:text-[#172B4D] [&_hr]:my-4 [&_hr]:border-[#DFE1E6]";
    const editorInner = (
      <div className={`flex-1 flex overflow-hidden bg-white ${focusMode ? "fixed inset-0 z-[60]" : ""}`}>
        {/* Editor main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar — Confluence-style: clean & minimal */}
          <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: "#DFE1E6" }}>
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={() => { if (focusMode) { setFocusMode(false); } else { saveDoc(); setEditingDoc(null); } }} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0" style={{ color: "#6B778C" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                title={focusMode ? "Thoát Focus Mode (Esc)" : "Quay lại (Esc)"}>
                {focusMode ? <Minimize2 className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              </button>
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1 text-[12px] min-w-0" style={{ color: "#6B778C" }}>
                <button onClick={() => { saveDoc(); setEditingDoc(null); }} className="shrink-0 hover:underline transition-all" style={{ color: "#0052CC" }}>Docs</button>
                {editingDoc.folderId && (() => {
                  const folder = folders.find(f => f.id === editingDoc.folderId);
                  const parent = folder?.parentId ? folders.find(f => f.id === folder.parentId) : null;
                  return (
                    <>
                      <ChevronRight className="w-3 h-3 shrink-0" style={{ color: "#C1C7D0" }} />
                      {parent && (
                        <>
                          <button onClick={() => { saveDoc(); setEditingDoc(null); setSelectedFolder(parent.id); }} className="hover:underline transition-all truncate max-w-[80px]" style={{ color: "#0052CC" }}>{parent.name}</button>
                          <ChevronRight className="w-3 h-3 shrink-0" style={{ color: "#C1C7D0" }} />
                        </>
                      )}
                      <button onClick={() => { saveDoc(); setEditingDoc(null); setSelectedFolder(folder!.id); }} className="hover:underline transition-all truncate max-w-[100px]" style={{ color: "#0052CC" }}>{folder?.name}</button>
                    </>
                  );
                })()}
                <ChevronRight className="w-3 h-3 shrink-0" style={{ color: "#C1C7D0" }} />
                <span className="truncate max-w-[200px]" style={{ color: "#172B4D" }}>{editTitle || "Untitled"}</span>
              </nav>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {/* Online collaborators */}
              {onlineCollabs.length > 0 && (
                <div className="flex items-center -space-x-1.5 mr-2">
                  {onlineCollabs.map(c => (
                    <div key={c.name} className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] text-white border-2 border-white relative" style={{ backgroundColor: c.color }} title={`${c.name} — ${c.cursor || "đang xem"}`}>
                      {c.initials}
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border border-white" />
                    </div>
                  ))}
                </div>
              )}

              {/* Page Tree & Notifications */}
              <button onClick={() => setShowPageTree(true)}
                className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
                style={{ color: "#6B778C" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                title="Page Tree">
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setShowNotifications(!showNotifications)}
                className="w-7 h-7 rounded-md flex items-center justify-center transition-all relative"
                style={{ color: showNotifications ? "#0052CC" : "#6B778C", backgroundColor: showNotifications ? "#DEEBFF" : "transparent" }}
                onMouseEnter={e => { if (!showNotifications) e.currentTarget.style.backgroundColor = "#F4F5F7"; }}
                onMouseLeave={e => { if (!showNotifications) e.currentTarget.style.backgroundColor = "transparent"; }}
                title="Thông báo">
                <Bell className="w-3.5 h-3.5" />
                {pageNotifications.filter(n => !n.read && !notificationsRead.has(n.id)).length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-[7px] text-white flex items-center justify-center" style={{ backgroundColor: "#DE350B" }}>
                    {pageNotifications.filter(n => !n.read && !notificationsRead.has(n.id)).length}
                  </span>
                )}
              </button>

              <div className="w-px h-5 mx-0.5" style={{ backgroundColor: "#DFE1E6" }} />

              {/* Like / Watch */}
              <button onClick={() => { setPageLiked(!pageLiked); setPageLikeCount(p => pageLiked ? p - 1 : p + 1); toast.success(pageLiked ? "Đã bỏ thích" : "Đã thích trang"); }}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all"
                style={{ color: pageLiked ? "#DE350B" : "#6B778C" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                <Heart className="w-3.5 h-3.5" style={pageLiked ? { fill: "#DE350B" } : {}} />
                {pageLikeCount > 0 && <span>{pageLikeCount}</span>}
              </button>
              <button onClick={() => { setPageWatching(!pageWatching); toast.success(pageWatching ? "Đã tắt theo dõi" : "Đang theo dõi trang"); }}
                className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
                style={{ color: pageWatching ? "#0052CC" : "#6B778C" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                title={pageWatching ? "Đang theo dõi — click để tắt" : "Theo dõi trang"}>
                {pageWatching ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              </button>

              <div className="w-px h-5 mx-1" style={{ backgroundColor: "#DFE1E6" }} />

              {/* Auto-save indicator */}
              <span className="text-[11px] px-2 py-1 rounded flex items-center gap-1.5 transition-all" style={{
                color: saveStatus === "saved" ? "#00875A" : saveStatus === "saving" ? "#0052CC" : "#6B778C",
                backgroundColor: saveStatus === "saved" ? "#E3FCEF" : saveStatus === "saving" ? "#DEEBFF" : "#F4F5F7"
              }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{
                  backgroundColor: saveStatus === "saved" ? "#00875A" : saveStatus === "saving" ? "#0052CC" : "#6B778C",
                  ...(saveStatus === "saving" ? { animation: "pulse 2s infinite" } : {})
                }} />
                {saveStatus === "saved" ? "Đã lưu" : saveStatus === "saving" ? "Đang lưu..." : "Chưa lưu"}
              </span>

              {editingDoc.locked && <Lock className="w-3.5 h-3.5 ml-1" style={{ color: "#6B778C" }} />}

              <div className="w-px h-5 mx-1" style={{ backgroundColor: "#DFE1E6" }} />

              {/* Editor Mode Switcher */}
              <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ backgroundColor: "#F4F5F7" }}>
                <button onClick={() => setEditorMode("edit")} className={`px-2.5 py-1 rounded-md text-[11px] transition-all flex items-center gap-1 ${editorMode === "edit" ? "bg-white shadow-sm" : ""}`} style={{ color: editorMode === "edit" ? "#172B4D" : "#6B778C" }} title="Chỉnh sửa">
                  <Edit3 className="w-3 h-3" /> Sửa
                </button>
                <button onClick={() => setEditorMode("split")} className={`px-2.5 py-1 rounded-md text-[11px] transition-all flex items-center gap-1 ${editorMode === "split" ? "bg-white shadow-sm" : ""}`} style={{ color: editorMode === "split" ? "#172B4D" : "#6B778C" }} title="Chia đôi">
                  <Columns2 className="w-3 h-3" /> Chia
                </button>
                <button onClick={() => setEditorMode("preview")} className={`px-2.5 py-1 rounded-md text-[11px] transition-all flex items-center gap-1 ${editorMode === "preview" ? "bg-white shadow-sm" : ""}`} style={{ color: editorMode === "preview" ? "#172B4D" : "#6B778C" }} title="Xem trước">
                  <EyeIcon className="w-3 h-3" /> Xem
                </button>
              </div>

              <div className="w-px h-5 mx-1" style={{ backgroundColor: "#DFE1E6" }} />

              <button onClick={() => setFocusMode(!focusMode)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ color: focusMode ? "#0052CC" : "#6B778C", backgroundColor: focusMode ? "#DEEBFF" : "transparent" }}
                onMouseEnter={e => { if (!focusMode) e.currentTarget.style.backgroundColor = "#F4F5F7"; }}
                onMouseLeave={e => { if (!focusMode) e.currentTarget.style.backgroundColor = "transparent"; }}
                title="Focus Mode">
                <Maximize2 className="w-4 h-4" />
              </button>
              <button onClick={() => setShowOutline(!showOutline)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ color: showOutline ? "#0052CC" : "#6B778C", backgroundColor: showOutline ? "#DEEBFF" : "transparent" }}
                onMouseEnter={e => { if (!showOutline) e.currentTarget.style.backgroundColor = "#F4F5F7"; }}
                onMouseLeave={e => { if (!showOutline) e.currentTarget.style.backgroundColor = "transparent"; }}
                title="Mục lục">
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => setShowPageTree(!showPageTree)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ color: showPageTree ? "#0052CC" : "#6B778C", backgroundColor: showPageTree ? "#DEEBFF" : "transparent" }}
                onMouseEnter={e => { if (!showPageTree) e.currentTarget.style.backgroundColor = "#F4F5F7"; }}
                onMouseLeave={e => { if (!showPageTree) e.currentTarget.style.backgroundColor = "transparent"; }}
                title="Page Tree">
                <PageIcon className="w-4 h-4" />
              </button>
              <button onClick={() => { setShowFindReplace(!showFindReplace); if (!showFindReplace) setTimeout(() => findInputRef.current?.focus(), 50); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ color: showFindReplace ? "#0052CC" : "#6B778C", backgroundColor: showFindReplace ? "#DEEBFF" : "transparent" }}
                onMouseEnter={e => { if (!showFindReplace) e.currentTarget.style.backgroundColor = "#F4F5F7"; }}
                onMouseLeave={e => { if (!showFindReplace) e.currentTarget.style.backgroundColor = "transparent"; }}
                title="Tìm & Thay thế (⌘F)">
                <SearchCode className="w-4 h-4" />
              </button>
              <button onClick={() => { setShowComments(!showComments); setShowProperties(false); setShowHistory(false); setShowShare(false); }} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all relative" style={{ color: showComments ? "#0052CC" : "#6B778C", backgroundColor: showComments ? "#DEEBFF" : "transparent" }}
                onMouseEnter={e => { if (!showComments) e.currentTarget.style.backgroundColor = "#F4F5F7"; }}
                onMouseLeave={e => { if (!showComments) e.currentTarget.style.backgroundColor = "transparent"; }}>
                <MessageSquare className="w-4 h-4" />
                {editingDoc.comments.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-white text-[8px] rounded-full flex items-center justify-center" style={{ backgroundColor: "#0052CC" }}>{editingDoc.comments.length}</span>}
              </button>
              <button onClick={() => { setShowHistory(!showHistory); setShowProperties(false); setShowComments(false); setShowShare(false); setShowAnalytics(false); }} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ color: showHistory ? "#0052CC" : "#6B778C", backgroundColor: showHistory ? "#DEEBFF" : "transparent" }}
                onMouseEnter={e => { if (!showHistory) e.currentTarget.style.backgroundColor = "#F4F5F7"; }}
                onMouseLeave={e => { if (!showHistory) e.currentTarget.style.backgroundColor = "transparent"; }}
                title="Lịch sử">
                <History className="w-4 h-4" />
              </button>
              <button onClick={() => { setShowAnalytics(!showAnalytics); setShowProperties(false); setShowComments(false); setShowHistory(false); setShowShare(false); }} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ color: showAnalytics ? "#0052CC" : "#6B778C", backgroundColor: showAnalytics ? "#DEEBFF" : "transparent" }}
                onMouseEnter={e => { if (!showAnalytics) e.currentTarget.style.backgroundColor = "#F4F5F7"; }}
                onMouseLeave={e => { if (!showAnalytics) e.currentTarget.style.backgroundColor = "transparent"; }}
                title="Phân tích trang">
                <BarChart2 className="w-4 h-4" />
              </button>
              {/* Page Restrictions */}
              <button onClick={() => setShowRestrictions(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{ color: pageRestrictions.type !== "none" ? "#DE350B" : "#6B778C", backgroundColor: pageRestrictions.type !== "none" ? "#FFEBE6" : "transparent" }}
                onMouseEnter={e => { if (pageRestrictions.type === "none") e.currentTarget.style.backgroundColor = "#F4F5F7"; }}
                onMouseLeave={e => { if (pageRestrictions.type === "none") e.currentTarget.style.backgroundColor = "transparent"; }}
                title={pageRestrictions.type !== "none" ? "Trang bị giới hạn" : "Giới hạn trang"}>
                {pageRestrictions.type !== "none" ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              </button>
              {/* Page Actions ⋯ */}
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setShowActionsMenu(!showActionsMenu); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ color: showActionsMenu ? "#0052CC" : "#6B778C", backgroundColor: showActionsMenu ? "#DEEBFF" : "transparent" }}
                  onMouseEnter={e => { if (!showActionsMenu) e.currentTarget.style.backgroundColor = "#F4F5F7"; }}
                  onMouseLeave={e => { if (!showActionsMenu) e.currentTarget.style.backgroundColor = showActionsMenu ? "#DEEBFF" : "transparent"; }}
                  title="Thêm hành động">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showActionsMenu && (
                  <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-xl py-1 w-[220px] z-50" style={{ border: "1px solid #DFE1E6" }}>
                    <p className="text-[9px] uppercase tracking-wider px-3 pt-1 pb-1" style={{ color: "#6B778C" }}>Hành động trang</p>
                    {[
                      { icon: <Copy className="w-3.5 h-3.5" />, label: "Nhân bản trang", action: () => { duplicateDoc(editingDoc.id); setShowActionsMenu(false); } },
                      { icon: <FolderInput className="w-3.5 h-3.5" />, label: "Di chuyển trang", action: () => { setShowMoveFolder(true); setShowActionsMenu(false); } },
                      { icon: <Pin className="w-3.5 h-3.5" />, label: pinnedDocs.has(editingDoc.id) ? "Bỏ ghim" : "Ghim trang", action: () => { togglePin(editingDoc.id); setShowActionsMenu(false); } },
                      { icon: <Star className="w-3.5 h-3.5" />, label: editingDoc.starred ? "Bỏ yêu thích" : "Yêu thích", action: () => { toggleStar(editingDoc.id); setShowActionsMenu(false); } },
                      null,
                      { icon: <Shield className="w-3.5 h-3.5" />, label: "Giới hạn trang", action: () => { setShowRestrictions(true); setShowActionsMenu(false); } },
                      { icon: <Lock className="w-3.5 h-3.5" />, label: editingDoc.locked ? "Mở khoá trang" : "Khoá chỉnh sửa", action: () => {
                        setDocs(prev => prev.map(d => d.id === editingDoc.id ? { ...d, locked: !d.locked } : d));
                        setEditingDoc(prev => prev ? { ...prev, locked: !prev.locked } : null);
                        toast.success(editingDoc.locked ? "Đã mở khoá" : "Đã khoá trang");
                        setShowActionsMenu(false);
                      }},
                      null,
                      { icon: <Download className="w-3.5 h-3.5" />, label: "Export", action: () => { setShowExportMenu(true); setShowActionsMenu(false); } },
                      { icon: <Printer className="w-3.5 h-3.5" />, label: "In trang", action: () => { exportPrint(); setShowActionsMenu(false); } },
                      null,
                      { icon: <Settings className="w-3.5 h-3.5" />, label: showProperties ? "Ẩn thuộc tính" : "Thuộc tính", action: () => { setShowProperties(!showProperties); setShowComments(false); setShowHistory(false); setShowShare(false); setShowActionsMenu(false); } },
                      null,
                      { icon: <Archive className="w-3.5 h-3.5" />, label: "Lưu trữ", action: () => { archiveDoc(editingDoc.id); setShowActionsMenu(false); }, color: "#FF8B00" },
                      { icon: <Trash2 className="w-3.5 h-3.5" />, label: "Xoá trang", action: () => { moveToTrash(editingDoc.id); setShowActionsMenu(false); }, color: "#DE350B" },
                    ].map((item, i) => item === null ? (
                      <div key={`asep-${i}`} className="my-0.5" style={{ borderTop: "1px solid #DFE1E6" }} />
                    ) : (
                      <button key={item.label} onClick={item.action}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-left transition-all"
                        style={{ color: (item as any).color || "#172B4D" }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                        <span style={{ color: (item as any).color || "#6B778C" }}>{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-px h-5 mx-1" style={{ backgroundColor: "#DFE1E6" }} />

              <button onClick={() => { setShowShare(!showShare); setShowProperties(false); setShowComments(false); setShowHistory(false); }} className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg transition-all" style={{ color: "#0052CC" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#DEEBFF")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                <Share2 className="w-3.5 h-3.5" /> Chia sẻ
              </button>

              <button onClick={saveDoc} className="flex items-center gap-1.5 text-white text-[12px] px-4 py-1.5 rounded-lg transition-all" style={{ backgroundColor: "#0052CC" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#0747A6")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#0052CC")}>
                Xuất bản
              </button>
            </div>
          </div>

          {/* Toolbar — Confluence-style formatting bar with heading dropdown */}
          {editorMode !== "preview" && (
            <div className="flex items-center gap-0.5 px-4 py-1.5 overflow-x-auto" style={{ borderBottom: "1px solid #DFE1E6" }}>
              {/* Undo/Redo */}
              {[
                { icon: <Undo2 className="w-3.5 h-3.5" />, label: "Undo", shortcut: "⌘Z" },
                { icon: <Redo2 className="w-3.5 h-3.5" />, label: "Redo", shortcut: "⌘⇧Z" },
              ].map(item => (
                <button key={item.label} onClick={() => toolbarAction(item.label)}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-all" title={`${item.label} (${item.shortcut})`}
                  style={{ color: "#6B778C" }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#F4F5F7"; e.currentTarget.style.color = "#172B4D"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#6B778C"; }}>
                  {item.icon}
                </button>
              ))}

              <div className="w-px h-5 mx-1" style={{ backgroundColor: "#DFE1E6" }} />

              {/* Heading dropdown — Confluence-style */}
              <div className="relative">
                <button onClick={() => setHeadingDropdown(!headingDropdown)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[12px] transition-all min-w-[100px]"
                  style={{ color: "#172B4D" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = headingDropdown ? "#F4F5F7" : "transparent")}>
                  <Type className="w-3.5 h-3.5" style={{ color: "#6B778C" }} />
                  <span>Normal text</span>
                  <ChevronDown className="w-3 h-3 ml-auto" style={{ color: "#6B778C" }} />
                </button>
                {headingDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl z-50 py-1 w-[180px]" style={{ border: "1px solid #DFE1E6" }}
                    onClick={() => setHeadingDropdown(false)}>
                    {[
                      { label: "Normal text", action: () => execCmd("formatBlock", "p"), style: { fontSize: "14px", color: "#172B4D" } },
                      { label: "Heading 1", action: () => execCmd("formatBlock", "h1"), style: { fontSize: "20px", fontWeight: 500, color: "#172B4D" } },
                      { label: "Heading 2", action: () => execCmd("formatBlock", "h2"), style: { fontSize: "16px", fontWeight: 500, color: "#172B4D" } },
                      { label: "Heading 3", action: () => execCmd("formatBlock", "h3"), style: { fontSize: "14px", fontWeight: 500, color: "#172B4D" } },
                      { label: "Heading 4", action: () => execCmd("formatBlock", "h4"), style: { fontSize: "12px", fontWeight: 500, color: "#6B778C" } },
                    ].map(item => (
                      <button key={item.label} onClick={item.action}
                        className="w-full text-left px-3 py-1.5 transition-all"
                        style={item.style}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-px h-5 mx-1" style={{ backgroundColor: "#DFE1E6" }} />

              {/* Text formatting: B I U S <> {} */}
              {[
                { icon: <Bold className="w-3.5 h-3.5" />, label: "Bold", shortcut: "⌘B" },
                { icon: <Italic className="w-3.5 h-3.5" />, label: "Italic", shortcut: "⌘I" },
                { icon: <Underline className="w-3.5 h-3.5" />, label: "Underline", shortcut: "⌘U" },
                { icon: <Strikethrough className="w-3.5 h-3.5" />, label: "Strike" },
                { icon: <Code className="w-3.5 h-3.5" />, label: "Code", shortcut: "" },
                { icon: <Braces className="w-3.5 h-3.5" />, label: "CodeBlock", shortcut: "" },
              ].map(item => (
                <button key={item.label} onMouseDown={e => e.preventDefault()} onClick={() => toolbarAction(item.label)}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-all" title={`${item.label}${item.shortcut ? ` (${item.shortcut})` : ""}`}
                  style={{ color: "#6B778C" }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#F4F5F7"; e.currentTarget.style.color = "#172B4D"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#6B778C"; }}>
                  {item.icon}
                </button>
              ))}

              {/* Text color picker */}
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setShowTextColorPicker(!showTextColorPicker); setShowHighlightPicker(false); setShowEmojiPicker(false); setShowStatusPicker(false); setShowDatePicker(false); setShowLayoutPicker(false); }}
                  className="w-7 h-7 rounded-md flex flex-col items-center justify-center transition-all" title="Màu chữ"
                  style={{ color: "#6B778C" }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#F4F5F7"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = showTextColorPicker ? "#F4F5F7" : "transparent"; }}>
                  <Type className="w-3.5 h-3.5" />
                  <div className="w-3.5 h-[3px] rounded-full mt-[-1px]" style={{ backgroundColor: "#DE350B" }} />
                </button>
                {showTextColorPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl z-50 p-2 w-[176px]" style={{ border: "1px solid #DFE1E6" }}>
                    <p className="text-[10px] mb-1.5 px-1" style={{ color: "#6B778C" }}>Màu chữ</p>
                    <div className="grid grid-cols-4 gap-1">
                      {textColors.map(c => (
                        <button key={c.color} onClick={() => { execCmd("foreColor", c.color); setShowTextColorPicker(false); }}
                          className="w-9 h-9 rounded-md flex items-center justify-center transition-all group/c"
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                          title={c.label}>
                          <span className="text-[13px]" style={{ color: c.color, fontWeight: 700 }}>A</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Highlight color picker */}
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowTextColorPicker(false); setShowEmojiPicker(false); setShowStatusPicker(false); setShowDatePicker(false); setShowLayoutPicker(false); }}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-all" title="Highlight"
                  style={{ color: "#6B778C" }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#F4F5F7"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = showHighlightPicker ? "#F4F5F7" : "transparent"; }}>
                  <Highlighter className="w-3.5 h-3.5" />
                </button>
                {showHighlightPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl z-50 p-2 w-[176px]" style={{ border: "1px solid #DFE1E6" }}>
                    <p className="text-[10px] mb-1.5 px-1" style={{ color: "#6B778C" }}>Highlight</p>
                    <div className="grid grid-cols-4 gap-1">
                      {highlightColors.map(c => (
                        <button key={c.label} onClick={() => { execCmd("hiliteColor", c.color); setShowHighlightPicker(false); }}
                          className="w-9 h-9 rounded-md flex items-center justify-center transition-all"
                          style={{ border: c.color === "transparent" ? "1px dashed #DFE1E6" : "1px solid #DFE1E6", backgroundColor: c.color === "transparent" ? "transparent" : c.color }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
                          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                          title={c.label}>
                          {c.color === "transparent" && <X className="w-3 h-3" style={{ color: "#C1C7D0" }} />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-px h-5 mx-1" style={{ backgroundColor: "#DFE1E6" }} />

              {/* Alignment & lists */}
              {[
                { icon: <AlignLeft className="w-3.5 h-3.5" />, label: "AlignLeft", action: () => execCmd("justifyLeft") },
                { icon: <AlignCenter className="w-3.5 h-3.5" />, label: "AlignCenter", action: () => execCmd("justifyCenter") },
                { icon: <AlignRight className="w-3.5 h-3.5" />, label: "AlignRight", action: () => execCmd("justifyRight") },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-all" title={item.label}
                  style={{ color: "#6B778C" }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#F4F5F7"; e.currentTarget.style.color = "#172B4D"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#6B778C"; }}>
                  {item.icon}
                </button>
              ))}

              <div className="w-px h-5 mx-1" style={{ backgroundColor: "#DFE1E6" }} />

              {/* Lists & indent */}
              {[
                { icon: <List className="w-3.5 h-3.5" />, label: "List" },
                { icon: <ListOrdered className="w-3.5 h-3.5" />, label: "OrderedList" },
                { icon: <IndentIncrease className="w-3.5 h-3.5" />, label: "Indent" },
                { icon: <IndentDecrease className="w-3.5 h-3.5" />, label: "Outdent" },
              ].map(item => (
                <button key={item.label} onClick={() => toolbarAction(item.label)}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-all" title={item.label}
                  style={{ color: "#6B778C" }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#F4F5F7"; e.currentTarget.style.color = "#172B4D"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#6B778C"; }}>
                  {item.icon}
                </button>
              ))}

              <div className="w-px h-5 mx-1" style={{ backgroundColor: "#DFE1E6" }} />

              {/* Insert: Link, Image, Table, Layout */}
              {[
                { icon: <Link className="w-3.5 h-3.5" />, label: "Link" },
                { icon: <Image className="w-3.5 h-3.5" />, label: "Image" },
                { icon: <Table className="w-3.5 h-3.5" />, label: "Table" },
              ].map(item => (
                <button key={item.label} onClick={() => toolbarAction(item.label)}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-all" title={item.label}
                  style={{ color: "#6B778C" }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#F4F5F7"; e.currentTarget.style.color = "#172B4D"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#6B778C"; }}>
                  {item.icon}
                </button>
              ))}

              {/* Layout picker */}
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setShowLayoutPicker(!showLayoutPicker); setShowTextColorPicker(false); setShowHighlightPicker(false); setShowEmojiPicker(false); setShowStatusPicker(false); setShowDatePicker(false); }}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-all" title="Layout"
                  style={{ color: "#6B778C" }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#F4F5F7"; e.currentTarget.style.color = "#172B4D"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = showLayoutPicker ? "#F4F5F7" : "transparent"; e.currentTarget.style.color = "#6B778C"; }}>
                  <Columns3 className="w-3.5 h-3.5" />
                </button>
                {showLayoutPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl z-50 py-1 w-[180px]" style={{ border: "1px solid #DFE1E6" }}>
                    <p className="text-[10px] uppercase tracking-wider px-3 pt-1 pb-1" style={{ color: "#6B778C" }}>Layout</p>
                    {[
                      { label: "2 cột bằng nhau", action: "Layout", icon: <Columns2 className="w-4 h-4" /> },
                      { label: "3 cột bằng nhau", action: "Layout3", icon: <Columns3 className="w-4 h-4" /> },
                      { label: "Sidebar + Nội dung", action: "LayoutSidebar", icon: <LayoutGrid className="w-4 h-4" /> },
                    ].map(item => (
                      <button key={item.label} onClick={() => { toolbarAction(item.action); setShowLayoutPicker(false); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[12px] transition-all"
                        style={{ color: "#172B4D" }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                        <span style={{ color: "#6B778C" }}>{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-px h-5 mx-1" style={{ backgroundColor: "#DFE1E6" }} />

              {/* Emoji picker */}
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowTextColorPicker(false); setShowHighlightPicker(false); setShowStatusPicker(false); setShowDatePicker(false); setShowLayoutPicker(false); }}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-all" title="Emoji"
                  style={{ color: "#6B778C" }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#F4F5F7"; e.currentTarget.style.color = "#172B4D"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = showEmojiPicker ? "#F4F5F7" : "transparent"; e.currentTarget.style.color = "#6B778C"; }}>
                  <Smile className="w-3.5 h-3.5" />
                </button>
                {showEmojiPicker && (
                  <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-xl z-50 p-3 w-[280px]" style={{ border: "1px solid #DFE1E6" }}>
                    {emojiCategories.map(cat => (
                      <div key={cat.label} className="mb-2">
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#6B778C" }}>{cat.label}</p>
                        <div className="flex flex-wrap gap-0.5">
                          {cat.emojis.map(em => (
                            <button key={em} onClick={() => { execCmd("insertText", em); setShowEmojiPicker(false); }}
                              className="w-7 h-7 rounded flex items-center justify-center text-[16px] transition-all"
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status lozenge picker */}
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setShowStatusPicker(!showStatusPicker); setShowTextColorPicker(false); setShowHighlightPicker(false); setShowEmojiPicker(false); setShowDatePicker(false); setShowLayoutPicker(false); }}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-all" title="Status Lozenge"
                  style={{ color: "#6B778C" }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#F4F5F7"; e.currentTarget.style.color = "#172B4D"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = showStatusPicker ? "#F4F5F7" : "transparent"; e.currentTarget.style.color = "#6B778C"; }}>
                  <CircleDot className="w-3.5 h-3.5" />
                </button>
                {showStatusPicker && (
                  <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-xl z-50 py-1 w-[160px]" style={{ border: "1px solid #DFE1E6" }}>
                    <p className="text-[10px] uppercase tracking-wider px-3 pt-1 pb-1" style={{ color: "#6B778C" }}>Status</p>
                    {statusLozenges.map(s => (
                      <button key={s.label} onClick={() => {
                        execCmd("insertHTML", `<span style="display:inline-block;background:${s.bg};color:${s.color};padding:2px 8px;border-radius:3px;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;line-height:16px;vertical-align:middle" contenteditable="false">${s.label}</span>&nbsp;`);
                        setShowStatusPicker(false);
                      }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-all"
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: s.bg, color: s.color, fontWeight: 700, letterSpacing: "0.5px" }}>{s.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date picker */}
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setShowDatePicker(!showDatePicker); setShowTextColorPicker(false); setShowHighlightPicker(false); setShowEmojiPicker(false); setShowStatusPicker(false); setShowLayoutPicker(false); }}
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-all" title="Chèn ngày"
                  style={{ color: "#6B778C" }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#F4F5F7"; e.currentTarget.style.color = "#172B4D"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = showDatePicker ? "#F4F5F7" : "transparent"; e.currentTarget.style.color = "#6B778C"; }}>
                  <Calendar className="w-3.5 h-3.5" />
                </button>
                {showDatePicker && (
                  <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-xl z-50 p-3 w-[220px]" style={{ border: "1px solid #DFE1E6" }}>
                    <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#6B778C" }}>Chèn ngày</p>
                    <input type="date" defaultValue={new Date().toISOString().split("T")[0]}
                      className="w-full text-[12px] px-2 py-1.5 rounded-md mb-2 focus:outline-none"
                      style={{ border: "1px solid #DFE1E6", color: "#172B4D" }}
                      id="docs-date-input" />
                    <div className="flex gap-1">
                      <button onClick={() => { toolbarAction("Date"); setShowDatePicker(false); }}
                        className="flex-1 text-[11px] py-1 rounded-md text-white transition-all"
                        style={{ backgroundColor: "#0052CC" }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#0747A6")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#0052CC")}>
                        Hôm nay
                      </button>
                      <button onClick={() => {
                        const dateInput = document.getElementById("docs-date-input") as HTMLInputElement;
                        if (dateInput?.value) {
                          const d = new Date(dateInput.value);
                          const formatted = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
                          execCmd("insertHTML", `<span style="display:inline-block;background:#DEEBFF;color:#0052CC;padding:2px 8px;border-radius:3px;font-size:12px;vertical-align:middle" contenteditable="false">📅 ${formatted}</span>&nbsp;`);
                        }
                        setShowDatePicker(false);
                      }}
                        className="flex-1 text-[11px] py-1 rounded-md transition-all"
                        style={{ border: "1px solid #DFE1E6", color: "#172B4D" }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                        Chọn ngày
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mention button */}
              <button onClick={() => { editorRef.current?.focus(); execCmd("insertText", "@"); }}
                className="w-7 h-7 rounded-md flex items-center justify-center transition-all" title="Mention (@)"
                style={{ color: "#6B778C" }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#F4F5F7"; e.currentTarget.style.color = "#172B4D"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#6B778C"; }}>
                <AtSign className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-5 mx-1" style={{ backgroundColor: "#DFE1E6" }} />

              {/* Horizontal rule / Divider */}
              <button onClick={() => toolbarAction("Divider")}
                className="w-7 h-7 rounded-md flex items-center justify-center transition-all" title="Đường kẻ ngang"
                style={{ color: "#6B778C" }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#F4F5F7"; e.currentTarget.style.color = "#172B4D"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#6B778C"; }}>
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-5 mx-1" style={{ backgroundColor: "#DFE1E6" }} />

              {/* Macro insert hint */}
              <button onClick={() => {
                editorRef.current?.focus();
                execCmd("insertText", "/");
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                  const range = sel.getRangeAt(0);
                  const rect = range.getBoundingClientRect();
                  setSlashMenu({ x: rect.left, y: rect.bottom + 4, visible: true, query: "", startOffset: sel.anchorOffset });
                  setSlashSelectedIdx(0);
                }
              }}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all" title="Chèn macro (/)"
                style={{ color: "#6B778C" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                <Plus className="w-3.5 h-3.5" /> Chèn
              </button>

              {/* Macro Browser button */}
              <button onClick={() => setShowMacroBrowser(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all" title="Macro Browser"
                style={{ color: "#6B778C" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                <Sparkles className="w-3.5 h-3.5" /> Macro
              </button>
            </div>
          )}

          {/* Find & Replace Bar */}
          {showFindReplace && (
            <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: "1px solid #DFE1E6", backgroundColor: "#FAFBFC" }}>
              <SearchCode className="w-4 h-4 shrink-0" style={{ color: "#6B778C" }} />
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <div className="relative flex-1 min-w-[180px] max-w-[260px]">
                  <input ref={findInputRef} value={findQuery} onChange={e => { setFindQuery(e.target.value); executeFindInEditor(e.target.value); }}
                    onKeyDown={e => { if (e.key === "Enter") executeFindInEditor(findQuery); if (e.key === "Escape") closeFindReplace(); }}
                    placeholder="Tìm kiếm..."
                    className="w-full text-[12px] px-3 py-1.5 rounded-md focus:outline-none"
                    style={{ border: "1px solid #DFE1E6", color: "#172B4D" }} />
                  {findQuery && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: "#6B778C" }}>
                      {findCurrentMatch}/{findMatchCount}
                    </span>
                  )}
                </div>
                <input value={replaceQuery} onChange={e => setReplaceQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === "Escape") closeFindReplace(); }}
                  placeholder="Thay thế..."
                  className="flex-1 min-w-[140px] max-w-[200px] text-[12px] px-3 py-1.5 rounded-md focus:outline-none"
                  style={{ border: "1px solid #DFE1E6", color: "#172B4D" }} />
                <button onClick={() => executeReplace(false)} disabled={findMatchCount === 0}
                  className="px-2 py-1.5 rounded-md text-[11px] transition-all disabled:opacity-40 flex items-center gap-1"
                  style={{ color: "#172B4D", border: "1px solid #DFE1E6" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <Replace className="w-3 h-3" /> Thay
                </button>
                <button onClick={() => executeReplace(true)} disabled={findMatchCount === 0}
                  className="px-2 py-1.5 rounded-md text-[11px] transition-all disabled:opacity-40"
                  style={{ color: "#172B4D", border: "1px solid #DFE1E6" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  title="Thay thế tất cả">
                  Tất cả
                </button>
              </div>
              <button onClick={closeFindReplace} className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ color: "#6B778C" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#DFE1E6")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* Editor area with TOC */}
          <div className="flex-1 flex overflow-hidden">
            {/* Table of Contents - hide in focus mode for cleaner look unless split */}
            {!focusMode && (
              <div className="w-[180px] shrink-0 overflow-auto py-4 px-3 hidden lg:block" style={{ borderRight: "1px solid #DFE1E6", backgroundColor: "#FAFBFC" }}>
                <p className="text-[9px] uppercase tracking-wider mb-2 px-1" style={{ color: "#6B778C" }}>Mục lục</p>
                <div className="space-y-0.5">
                  {headings.map((h, i) => (
                      <button key={i} onClick={() => {
                        const el = editorRef.current;
                        if (el) { const hEls = el.querySelectorAll('h1, h2, h3, h4'); if (hEls[i]) { hEls[i].scrollIntoView({ behavior: 'smooth', block: 'center' }); setActiveHeadingIdx(i); } }
                      }}
                        className="w-full text-left px-1.5 py-1 rounded-md transition-all truncate block"
                        style={{
                          paddingLeft: `${(h.level - 1) * 10 + 6}px`,
                          fontSize: h.level === 1 ? "11px" : "10px",
                          fontWeight: h.level === 1 ? 500 : 400,
                          color: i === activeHeadingIdx ? "#0052CC" : h.level === 1 ? "#172B4D" : "#6B778C",
                          backgroundColor: i === activeHeadingIdx ? "#DEEBFF" : "transparent",
                          borderLeft: i === activeHeadingIdx ? "2px solid #0052CC" : "2px solid transparent",
                        }}
                        onMouseEnter={e => { if (i !== activeHeadingIdx) e.currentTarget.style.backgroundColor = "#F4F5F7"; }}
                        onMouseLeave={e => { if (i !== activeHeadingIdx) e.currentTarget.style.backgroundColor = "transparent"; }}>
                        {h.text || "Untitled"}
                      </button>
                  ))}
                  {headings.length === 0 && <p className="text-[10px] px-1 py-2" style={{ color: "#C1C7D0" }}>Thêm heading để tạo mục lục</p>}
                </div>

                {/* Live collaboration cursors */}
                {onlineCollabs.length > 0 && (
                  <div className="mt-4 pt-3" style={{ borderTop: "1px solid #DFE1E6" }}>
                    <p className="text-[9px] uppercase tracking-wider mb-2 px-1" style={{ color: "#6B778C" }}>Đang online</p>
                    <div className="space-y-1.5">
                      {onlineCollabs.map(c => (
                        <div key={c.name} className="flex items-center gap-2 px-1.5 py-1 rounded-lg">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] text-white relative" style={{ backgroundColor: c.color }}>
                            {c.initials}
                            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border border-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] truncate" style={{ color: "#172B4D" }}>{c.name.split(" ").pop()}</p>
                            {c.cursor && <p className="text-[8px] truncate" style={{ color: "#6B778C" }}>@ {c.cursor}</p>}
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: c.color }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Doc stats */}
                <div className="mt-4 pt-3" style={{ borderTop: "1px solid #DFE1E6" }}>
                  <p className="text-[9px] uppercase tracking-wider mb-2 px-1" style={{ color: "#6B778C" }}>Info</p>
                  <div className="space-y-1 px-1 text-[9px]" style={{ color: "#6B778C" }}>
                    <div className="flex justify-between"><span>Từ</span><span style={{ color: "#172B4D" }}>{wordCount}</span></div>
                    <div className="flex justify-between"><span>Ký tự</span><span style={{ color: "#172B4D" }}>{charCount}</span></div>
                    <div className="flex justify-between"><span>Headings</span><span style={{ color: "#172B4D" }}>{headings.length}</span></div>
                    <div className="flex justify-between"><span>Đọc</span><span style={{ color: "#172B4D" }}>~{readTime} phút</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Page Tree Sidebar — Confluence-style */}
            {showPageTree && (() => {
              const siblingDocs = docs.filter(d => !d.archived && !d.deleted && d.folderId === editingDoc.folderId);
              const currentFolder = editingDoc.folderId ? folders.find(f => f.id === editingDoc.folderId) : null;
              const parentFolder = currentFolder?.parentId ? folders.find(f => f.id === currentFolder.parentId) : null;
              const childFolders = editingDoc.folderId ? folders.filter(f => f.parentId === editingDoc.folderId) : folders.filter(f => !f.parentId);
              return (
                <div className="w-[220px] overflow-auto shrink-0 flex flex-col" style={{ borderRight: "1px solid #DFE1E6", backgroundColor: "#FAFBFC" }}>
                  <div className="px-3 pt-4 pb-2 flex items-center justify-between">
                    <p className="text-[9px] uppercase tracking-wider flex items-center gap-1.5" style={{ color: "#6B778C" }}><PageIcon className="w-3 h-3" /> Page tree</p>
                    <button onClick={() => setShowPageTree(false)} className="w-5 h-5 rounded flex items-center justify-center" style={{ color: "#6B778C" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#DFE1E6")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}><X className="w-3 h-3" /></button>
                  </div>
                  {/* Parent folder breadcrumb */}
                  {parentFolder && (
                    <button onClick={() => { saveDoc(); setEditingDoc(null); setSelectedFolder(parentFolder.id); }}
                      className="mx-2 mb-1 flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] transition-all"
                      style={{ color: "#6B778C" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                      <ChevronLeft className="w-3 h-3" />
                      {parentFolder.name}
                    </button>
                  )}
                  {/* Current folder */}
                  {currentFolder && (
                    <div className="mx-2 mb-1 flex items-center gap-1.5 px-2 py-1.5 rounded text-[11px]" style={{ color: "#172B4D", fontWeight: 500 }}>
                      <FolderOpen className="w-3.5 h-3.5" style={{ color: currentFolder.color }} />
                      {currentFolder.name}
                    </div>
                  )}
                  {/* Child folders */}
                  {childFolders.map(cf => (
                    <button key={cf.id} onClick={() => { saveDoc(); setEditingDoc(null); setSelectedFolder(cf.id); }}
                      className="mx-2 flex items-center gap-1.5 px-4 py-1.5 rounded text-[10px] transition-all"
                      style={{ color: "#6B778C" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                      <CornerDownRight className="w-3 h-3" style={{ color: "#C1C7D0" }} />
                      <FolderClosed className="w-3 h-3" style={{ color: cf.color }} />
                      {cf.name}
                    </button>
                  ))}
                  {/* Sibling docs */}
                  <div className="mx-2 mt-1 space-y-0.5">
                    {siblingDocs.map(d => (
                      <button key={d.id} onClick={() => { if (d.id !== editingDoc.id) { saveDoc(); openDoc(d); } }}
                        className="w-full flex items-center gap-2 px-4 py-1.5 rounded text-[10px] text-left transition-all truncate"
                        style={{
                          backgroundColor: d.id === editingDoc.id ? "#DEEBFF" : "transparent",
                          color: d.id === editingDoc.id ? "#0052CC" : "#172B4D",
                          fontWeight: d.id === editingDoc.id ? 500 : 400,
                        }}
                        onMouseEnter={e => { if (d.id !== editingDoc.id) e.currentTarget.style.backgroundColor = "#F4F5F7"; }}
                        onMouseLeave={e => { if (d.id !== editingDoc.id) e.currentTarget.style.backgroundColor = "transparent"; }}>
                        <span className="text-[12px] shrink-0">{d.icon}</span>
                        <span className="truncate">{d.title}</span>
                        {pinnedDocs.has(d.id) && <Pin className="w-2.5 h-2.5 ml-auto shrink-0" style={{ color: "#FF8B00" }} />}
                      </button>
                    ))}
                  </div>
                  {/* No-folder docs */}
                  {!editingDoc.folderId && (
                    <div className="mx-2 mt-2 pt-2" style={{ borderTop: "1px solid #DFE1E6" }}>
                      <p className="text-[9px] uppercase tracking-wider px-2 mb-1" style={{ color: "#C1C7D0" }}>Không thư mục</p>
                      {docs.filter(d => !d.folderId && !d.archived && !d.deleted).map(d => (
                        <button key={d.id} onClick={() => { if (d.id !== editingDoc.id) { saveDoc(); openDoc(d); } }}
                          className="w-full flex items-center gap-2 px-4 py-1.5 rounded text-[10px] text-left transition-all truncate"
                          style={{
                            backgroundColor: d.id === editingDoc.id ? "#DEEBFF" : "transparent",
                            color: d.id === editingDoc.id ? "#0052CC" : "#172B4D",
                          }}
                          onMouseEnter={e => { if (d.id !== editingDoc.id) e.currentTarget.style.backgroundColor = "#F4F5F7"; }}
                          onMouseLeave={e => { if (d.id !== editingDoc.id) e.currentTarget.style.backgroundColor = "transparent"; }}>
                          <span className="text-[12px] shrink-0">{d.icon}</span>
                          <span className="truncate">{d.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Table of Contents Sidebar */}
            {showOutline && (() => {
              const outlineHeadings = getHtmlHeadings(editContent);
              return (
                <div className="w-[200px] overflow-auto shrink-0" style={{ borderRight: "1px solid #DFE1E6", backgroundColor: "#FAFBFC" }}>
                  <div className="px-3 pt-4 pb-2">
                    <p className="text-[9px] uppercase tracking-wider flex items-center gap-1.5 mb-2" style={{ color: "#6B778C" }}><List className="w-3 h-3" /> Mục lục</p>
                  </div>
                  <div className="px-2 pb-4 space-y-0.5">
                    {outlineHeadings.length === 0 ? (
                      <p className="text-[10px] px-2 py-3" style={{ color: "#C1C7D0" }}>Chưa có heading nào. Dùng toolbar H1/H2/H3 để tạo heading.</p>
                    ) : outlineHeadings.map((h, idx) => (
                      <button key={idx} onClick={() => {
                        const el = editorRef.current;
                        if (el) {
                          const hEls = el.querySelectorAll('h1, h2, h3, h4');
                          if (hEls[idx]) {
                            hEls[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }
                      }}
                        className="w-full text-left text-[10px] py-1 px-2 rounded-md transition-all truncate block"
                        style={{ paddingLeft: h.level === 1 ? "8px" : h.level === 2 ? "16px" : h.level === 3 ? "24px" : "32px", color: h.level === 1 ? "#172B4D" : "#6B778C", fontWeight: h.level === 1 ? 600 : 400 }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                        {h.text}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Text editor / Preview / Split — Confluence-style content */}
            {editorMode === "edit" && (
              <div className="flex-1 overflow-auto">
                <div className={`mx-auto px-10 py-8 ${focusMode ? "max-w-[760px]" : "max-w-[900px]"}`}>
                  {/* Confluence-style page title */}
                  <div className="mb-1 flex items-start gap-2 relative">
                    <button onClick={() => setShowIconPicker(!showIconPicker)} className="mt-1 text-2xl hover:bg-[#F4F5F7] rounded-lg w-10 h-10 flex items-center justify-center transition-all shrink-0" title="Đổi icon">
                      {editingDoc.icon}
                    </button>
                    {showIconPicker && (
                      <div className="absolute top-12 left-0 bg-white rounded-xl shadow-xl border z-50 p-3 w-[260px]" style={{ borderColor: "#DFE1E6" }} onClick={e => e.stopPropagation()}>
                        <p className="text-[10px] mb-2" style={{ color: "#6B778C" }}>Chọn icon</p>
                        <div className="grid grid-cols-7 gap-1">
                          {docIcons.map(icon => (
                            <button key={icon} onClick={() => updateDocIcon(editingDoc.id, icon)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all ${editingDoc.icon === icon ? "ring-2" : ""}`}
                              style={{ backgroundColor: editingDoc.icon === icon ? "#DEEBFF" : undefined, ...(editingDoc.icon === icon ? { ringColor: "#0052CC" } : {}) }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = editingDoc.icon === icon ? "#DEEBFF" : "")}>
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                      placeholder="Untitled"
                      className="flex-1 bg-transparent focus:outline-none py-1 transition-all"
                      style={{ fontSize: "24px", fontWeight: 500, color: "#172B4D", lineHeight: 1.3 }}
                    />
                  </div>
                  {/* Byline */}
                  <div className="flex items-center gap-2 mb-6 ml-12" style={{ color: "#6B778C" }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] text-white" style={{ backgroundColor: editingDoc.authorColor }}>{editingDoc.authorInitial}</div>
                    <span className="text-[12px]">{editingDoc.author}</span>
                    <span className="text-[12px]">·</span>
                    <span className="text-[12px]">Cập nhật {editingDoc.updated}</span>
                    {editingDoc.tags.length > 0 && (
                      <>
                        <span className="text-[12px]">·</span>
                        {editingDoc.tags.slice(0, 3).map(t => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: "#F4F5F7", color: "#6B778C" }}>#{t}</span>
                        ))}
                      </>
                    )}
                  </div>
                  {/* Content editor */}
                  <div className="ml-12 relative">
                    <div
                      key={editorKey}
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={handleEditorInput}
                      onKeyDown={handleEditorKeyDown}
                      onMouseMove={handleEditorMouseMove}
                      onMouseLeave={() => setBlockInserter(p => ({ ...p, visible: false }))}
                      onClick={handleEditorClick}
                      className={`w-full min-h-[600px] bg-transparent focus:outline-none ${confluenceContentCls} ${focusMode ? "min-h-screen" : ""}`}
                      style={{ wordBreak: "break-word", color: "#172B4D" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {editorMode === "preview" && (
              <div className="flex-1 overflow-auto" onScroll={handleEditorScroll}>
                <div className="max-w-[900px] mx-auto px-10 py-8">
                  {/* Page title */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{editingDoc.icon}</span>
                    <h1 style={{ fontSize: "24px", fontWeight: 500, color: "#172B4D", lineHeight: 1.3 }}>{editTitle}</h1>
                  </div>
                  {/* Byline */}
                  <div className="flex items-center gap-2 mb-6 ml-10" style={{ color: "#6B778C" }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] text-white" style={{ backgroundColor: editingDoc.authorColor }}>{editingDoc.authorInitial}</div>
                    <span className="text-[12px]">{editingDoc.author}</span>
                    <span className="text-[12px]">·</span>
                    <span className="text-[12px]">Cập nhật {editingDoc.updated}</span>
                  </div>
                  {/* Content */}
                  <div className={`ml-10 ${confluenceContentCls}`}
                    style={{ color: "#172B4D" }}
                    dangerouslySetInnerHTML={{ __html: editContent }}
                  />
                </div>
              </div>
            )}

            {editorMode === "split" && (
              <div className="flex-1 flex overflow-hidden">
                {/* Edit pane */}
                <div className="flex-1 overflow-auto p-6" style={{ borderRight: "1px solid #DFE1E6" }}>
                  <div className="max-w-none">
                    <p className="text-[9px] uppercase tracking-wider mb-3 flex items-center gap-1" style={{ color: "#6B778C" }}><Edit3 className="w-3 h-3" /> Soạn thảo</p>
                    <div
                      key={editorKey}
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={handleEditorInput}
                      onKeyDown={handleEditorKeyDown}
                      className={`w-full min-h-[600px] bg-transparent focus:outline-none ${confluenceContentCls}`}
                      style={{ wordBreak: "break-word", color: "#172B4D" }}
                    />
                  </div>
                </div>
                {/* Preview pane */}
                <div className="flex-1 overflow-auto p-6" style={{ backgroundColor: "#FAFBFC" }}>
                  <div className="max-w-none">
                    <p className="text-[9px] uppercase tracking-wider mb-3 flex items-center gap-1" style={{ color: "#6B778C" }}><EyeIcon className="w-3 h-3" /> Xem trước</p>
                    <div className={confluenceContentCls}
                      style={{ color: "#172B4D" }}
                      dangerouslySetInnerHTML={{ __html: editContent }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Page Footer — Confluence-style labels & info */}
          {editorMode === "edit" && !focusMode && (
            <div className="px-10 py-3 flex items-center gap-3 flex-wrap" style={{ borderTop: "1px solid #DFE1E6", marginLeft: focusMode ? 0 : 180 }}>
              <Tag className="w-3.5 h-3.5 shrink-0" style={{ color: "#6B778C" }} />
              {pageLabels.map(label => (
                <span key={label} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] group/label transition-all cursor-default"
                  style={{ backgroundColor: "#DEEBFF", color: "#0052CC" }}>
                  {label}
                  <button onClick={() => removePageLabel(label)}
                    className="opacity-0 group-hover/label:opacity-100 transition-all"
                    style={{ color: "#0052CC" }}><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
              {showLabelInput ? (
                <div className="flex items-center gap-1">
                  <input ref={labelInputRef} value={newLabel} onChange={e => setNewLabel(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addPageLabel(newLabel); if (e.key === "Escape") { setShowLabelInput(false); setNewLabel(""); } }}
                    placeholder="Thêm label..."
                    autoFocus
                    className="text-[10px] px-2 py-0.5 rounded focus:outline-none w-[100px]"
                    style={{ border: "1px solid #0052CC", color: "#172B4D" }} />
                  <button onClick={() => addPageLabel(newLabel)} className="text-[10px] px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: "#0052CC" }}>+</button>
                  <button onClick={() => { setShowLabelInput(false); setNewLabel(""); }} style={{ color: "#6B778C" }}><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <button onClick={() => { setShowLabelInput(true); setTimeout(() => labelInputRef.current?.focus(), 50); }}
                  className="text-[10px] px-2 py-0.5 rounded transition-all flex items-center gap-1"
                  style={{ color: "#0052CC", border: "1px dashed #B3D4FF" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#DEEBFF")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <Plus className="w-2.5 h-2.5" /> Thêm label
                </button>
              )}
              <span className="ml-auto text-[10px] flex items-center gap-3" style={{ color: "#6B778C" }}>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {pageViewCount} lượt xem</span>
                <span className="flex items-center gap-1"><Users2 className="w-3 h-3" /> {pageUniqueViewers} người</span>
              </span>
            </div>
          )}

          {/* Reading progress bar */}
          {editorMode === "preview" && readingProgress > 0 && (
            <div className="h-[2px] w-full" style={{ backgroundColor: "#DFE1E6" }}>
              <div className="h-full transition-all duration-200" style={{ width: `${readingProgress}%`, backgroundColor: "#0052CC" }} />
            </div>
          )}

          {/* Status bar — Confluence-style minimal */}
          <div className="flex items-center justify-between px-5 py-1.5 border-t text-[11px]" style={{ borderColor: "#DFE1E6", color: "#6B778C" }}>
            <div className="flex items-center gap-3">
              <span>{wordCount} từ</span>
              {wordCountGoal > 0 && (
                <span className="flex items-center gap-1.5">
                  <div className="w-[60px] h-[4px] rounded-full overflow-hidden" style={{ backgroundColor: "#DFE1E6" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.round((wordCount / wordCountGoal) * 100))}%`, backgroundColor: wordCount >= wordCountGoal ? "#00875A" : "#0052CC" }} />
                  </div>
                  <span style={{ color: wordCount >= wordCountGoal ? "#00875A" : "#6B778C" }}>{Math.round((wordCount / wordCountGoal) * 100)}%</span>
                </span>
              )}
              <span className="w-px h-3" style={{ backgroundColor: "#DFE1E6" }} />
              <span>{charCount} ký tự</span>
              <span className="w-px h-3" style={{ backgroundColor: "#DFE1E6" }} />
              <span>~{readTime} phút đọc</span>
              {inlineComments.filter(c => !c.resolved).length > 0 && (
                <>
                  <span className="w-px h-3" style={{ backgroundColor: "#DFE1E6" }} />
                  <span className="flex items-center gap-1" style={{ color: "#FF8B00" }}>
                    <MessageCircle className="w-3 h-3" /> {inlineComments.filter(c => !c.resolved).length} inline
                  </span>
                </>
              )}
              {pageRestrictions.type !== "none" && (
                <>
                  <span className="w-px h-3" style={{ backgroundColor: "#DFE1E6" }} />
                  <span className="flex items-center gap-1" style={{ color: "#DE350B" }}>
                    <Shield className="w-3 h-3" /> Restricted
                  </span>
                </>
              )}
              {focusMode && <span className="flex items-center gap-1" style={{ color: "#0052CC" }}><Maximize2 className="w-3 h-3" /> Focus Mode</span>}
            </div>
            <div className="flex items-center gap-1">
              {/* Word count goal setter */}
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => {
                  const goal = prompt("Đặt mục tiêu số từ (0 để tắt):", String(wordCountGoal));
                  if (goal !== null) { const n = parseInt(goal); setWordCountGoal(isNaN(n) ? 0 : Math.max(0, n)); }
                }}
                  className="flex items-center gap-1 px-2 py-1 rounded transition-all"
                  style={{ color: "#6B778C" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  title="Đặt mục tiêu số từ"><Target className="w-3 h-3" /></button>
              </div>

              {/* Export dropdown */}
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-1 px-2 py-1 rounded transition-all"
                  style={{ color: "#6B778C" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = showExportMenu ? "#F4F5F7" : "transparent")}>
                  <Download className="w-3 h-3" /> Export
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
                {showExportMenu && (
                  <div className="absolute bottom-full right-0 mb-1 bg-white rounded-lg shadow-xl py-1 w-[200px] z-50" style={{ border: "1px solid #DFE1E6" }}>
                    <p className="text-[9px] uppercase tracking-wider px-3 pt-1 pb-1" style={{ color: "#6B778C" }}>Export</p>
                    {[
                      { icon: <FileType className="w-3.5 h-3.5" />, label: "Markdown (.md)", action: () => {
                        const md = htmlToMarkdown(editContent);
                        const blob = new Blob([`# ${editTitle}\n\n${md}`], { type: "text/markdown" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a"); a.href = url; a.download = `${editTitle.replace(/\s+/g, "_")}.md`; a.click();
                        URL.revokeObjectURL(url); toast.success("Đã export file .md"); setShowExportMenu(false);
                      }},
                      { icon: <FileCode className="w-3.5 h-3.5" />, label: "HTML (.html)", action: exportAsHtml },
                      { icon: <Clipboard className="w-3.5 h-3.5" />, label: "Copy rich text", action: copyRichText },
                      { icon: <Copy className="w-3.5 h-3.5" />, label: "Copy plain text", action: () => { copyToClipboard(getPlainText(editContent)).then(() => toast.success("Đã copy")); setShowExportMenu(false); } },
                      null,
                      { icon: <Printer className="w-3.5 h-3.5" />, label: "In trang", action: exportPrint },
                    ].map((item, i) => item === null ? (
                      <div key={`esep-${i}`} className="my-0.5" style={{ borderTop: "1px solid #DFE1E6" }} />
                    ) : (
                      <button key={item.label} onClick={item.action}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-left transition-all"
                        style={{ color: "#172B4D" }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                        <span style={{ color: "#6B778C" }}>{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={() => setShowShortcutsHelp(true)}
                className="flex items-center gap-1 px-2 py-1 rounded transition-all"
                style={{ color: "#6B778C" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}><Keyboard className="w-3 h-3" /> Phím tắt</button>
            </div>
          </div>
        </div>

        {/* ====== FLOATING TOOLBAR — appears on text selection ====== */}
        {floatingToolbar.visible && editorMode === "edit" && (
          <div ref={floatingRef}
            className="fixed z-[70] flex items-center gap-0.5 px-1.5 py-1 rounded-lg shadow-xl"
            style={{
              left: `${floatingToolbar.x}px`, top: `${floatingToolbar.y}px`,
              transform: "translate(-50%, -100%)",
              backgroundColor: "#1B2638", border: "1px solid #253858"
            }}>
            {[
              { icon: <Bold className="w-3.5 h-3.5" />, label: "Bold", action: () => execCmd("bold") },
              { icon: <Italic className="w-3.5 h-3.5" />, label: "Italic", action: () => execCmd("italic") },
              { icon: <Underline className="w-3.5 h-3.5" />, label: "Underline", action: () => execCmd("underline") },
              { icon: <Strikethrough className="w-3.5 h-3.5" />, label: "Strike", action: () => execCmd("strikeThrough") },
              null,
              { icon: <Code className="w-3.5 h-3.5" />, label: "Code", action: () => toolbarAction("Code") },
              { icon: <Link className="w-3.5 h-3.5" />, label: "Link", action: () => toolbarAction("Link") },
              null,
              { icon: <span className="flex flex-col items-center"><Type className="w-3 h-3" /><span className="w-3 h-[2px] rounded mt-[-1px]" style={{ backgroundColor: "#DE350B" }} /></span>, label: "Red", action: () => execCmd("foreColor", "#DE350B") },
              { icon: <span className="flex flex-col items-center"><Type className="w-3 h-3" /><span className="w-3 h-[2px] rounded mt-[-1px]" style={{ backgroundColor: "#0052CC" }} /></span>, label: "Blue", action: () => execCmd("foreColor", "#0052CC") },
              { icon: <Highlighter className="w-3.5 h-3.5" />, label: "Highlight", action: () => execCmd("hiliteColor", "#FFFAE6") },
              null,
              { icon: <MessageCircle className="w-3.5 h-3.5" />, label: "Comment", action: () => {
                const sel = window.getSelection();
                if (sel && !sel.isCollapsed) {
                  setInlineCommentSelection(sel.toString());
                  setShowInlineCommentForm(true);
                }
              } },
            ].map((item, i) => item === null ? (
              <div key={`fsep-${i}`} className="w-px h-4 mx-0.5" style={{ backgroundColor: "#344563" }} />
            ) : (
              <button key={item.label}
                onMouseDown={e => { e.preventDefault(); item.action(); }}
                className="w-7 h-7 rounded flex items-center justify-center transition-all"
                style={{ color: "#B3BAC5" }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#253858"; e.currentTarget.style.color = "#FFFFFF"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#B3BAC5"; }}
                title={item.label}>
                {item.icon}
              </button>
            ))}
          </div>
        )}

        {/* ====== SLASH COMMAND MENU ====== */}
        {slashMenu.visible && (
          <div ref={slashMenuRef}
            className="fixed z-[70] bg-white rounded-lg shadow-2xl overflow-hidden"
            style={{
              left: `${slashMenu.x}px`, top: `${slashMenu.y}px`,
              width: "300px", maxHeight: "340px",
              border: "1px solid #DFE1E6"
            }}>
            {/* Search header */}
            <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: "1px solid #DFE1E6", backgroundColor: "#FAFBFC" }}>
              <Search className="w-3.5 h-3.5" style={{ color: "#6B778C" }} />
              <span className="text-[12px]" style={{ color: "#6B778C" }}>
                {slashMenu.query ? `Tìm: "${slashMenu.query}"` : "Gõ để lọc..."}
              </span>
            </div>
            <div className="overflow-auto" style={{ maxHeight: "290px" }}>
              {filteredSlashCommands.length === 0 ? (
                <div className="px-3 py-6 text-center text-[12px]" style={{ color: "#6B778C" }}>Không tìm thấy lệnh nào</div>
              ) : (() => {
                let lastGroup = "";
                return filteredSlashCommands.map((cmd, idx) => {
                  const showGroup = cmd.group !== lastGroup;
                  lastGroup = cmd.group;
                  return (
                    <div key={cmd.id}>
                      {showGroup && (
                        <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider" style={{ color: "#6B778C" }}>{cmd.group}</div>
                      )}
                      <button
                        onMouseDown={e => { e.preventDefault(); executeSlashCommand(cmd); }}
                        onMouseEnter={() => setSlashSelectedIdx(idx)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left transition-all"
                        style={{
                          backgroundColor: idx === slashSelectedIdx ? "#F4F5F7" : "transparent",
                          color: "#172B4D"
                        }}>
                        <div className="w-8 h-8 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: "#F4F5F7", color: "#6B778C" }}>
                          {cmd.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px]" style={{ color: "#172B4D" }}>{cmd.label}</div>
                          <div className="text-[11px]" style={{ color: "#6B778C" }}>{cmd.desc}</div>
                        </div>
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
            <div className="px-3 py-1.5 text-[10px] flex items-center gap-3" style={{ borderTop: "1px solid #DFE1E6", backgroundColor: "#FAFBFC", color: "#6B778C" }}>
              <span>↑↓ Di chuyển</span>
              <span>↵ Chọn</span>
              <span>Esc Đóng</span>
            </div>
          </div>
        )}

        {/* ====== INLINE COMMENT FORM ====== */}
        {showInlineCommentForm && floatingToolbar.visible && (
          <div className="fixed z-[75] bg-white rounded-lg shadow-2xl w-[300px]"
            style={{
              left: `${floatingToolbar.x}px`, top: `${floatingToolbar.y + 40}px`,
              transform: "translateX(-50%)",
              border: "1px solid #DFE1E6",
            }}
            onClick={e => e.stopPropagation()}>
            <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: "1px solid #DFE1E6", backgroundColor: "#FAFBFC" }}>
              <MessageCircle className="w-3.5 h-3.5" style={{ color: "#0052CC" }} />
              <span className="text-[12px]" style={{ color: "#172B4D", fontWeight: 500 }}>Thêm inline comment</span>
              <button onClick={() => { setShowInlineCommentForm(false); setInlineCommentText(""); }} className="ml-auto" style={{ color: "#6B778C" }}><X className="w-3.5 h-3.5" /></button>
            </div>
            <div className="p-3">
              <div className="text-[10px] px-2 py-1.5 rounded mb-2 italic" style={{ backgroundColor: "#FFF0B3", color: "#172B4D" }}>
                "{inlineCommentSelection.length > 80 ? inlineCommentSelection.slice(0, 80) + "..." : inlineCommentSelection}"
              </div>
              <textarea value={inlineCommentText} onChange={e => setInlineCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addInlineComment(); } if (e.key === "Escape") { setShowInlineCommentForm(false); setInlineCommentText(""); } }}
                placeholder="Viết comment..."
                rows={3}
                autoFocus
                className="w-full text-[12px] px-3 py-2 rounded-md focus:outline-none resize-none"
                style={{ border: "1px solid #DFE1E6", color: "#172B4D" }} />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button onClick={() => { setShowInlineCommentForm(false); setInlineCommentText(""); }}
                  className="px-3 py-1.5 rounded-md text-[11px] transition-all"
                  style={{ color: "#6B778C" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                  Huỷ
                </button>
                <button onClick={addInlineComment} disabled={!inlineCommentText.trim()}
                  className="px-3 py-1.5 rounded-md text-[11px] text-white transition-all disabled:opacity-40"
                  style={{ backgroundColor: "#0052CC" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#0747A6")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#0052CC")}>
                  Comment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====== MENTION MENU (@) ====== */}
        {mentionMenu.visible && (
          <div ref={mentionMenuRef}
            className="fixed z-[70] bg-white rounded-lg shadow-2xl overflow-hidden"
            style={{
              left: `${mentionMenu.x}px`, top: `${mentionMenu.y}px`,
              width: "260px", maxHeight: "280px",
              border: "1px solid #DFE1E6"
            }}>
            <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: "1px solid #DFE1E6", backgroundColor: "#FAFBFC" }}>
              <AtSign className="w-3.5 h-3.5" style={{ color: "#6B778C" }} />
              <span className="text-[12px]" style={{ color: "#6B778C" }}>
                {mentionMenu.query ? `Tìm: "${mentionMenu.query}"` : "Nhắc đến ai..."}
              </span>
            </div>
            <div className="overflow-auto" style={{ maxHeight: "220px" }}>
              {filteredMembers.length === 0 ? (
                <div className="px-3 py-4 text-center text-[12px]" style={{ color: "#6B778C" }}>Không tìm thấy</div>
              ) : filteredMembers.map((member, idx) => (
                <button key={member.name}
                  onMouseDown={e => { e.preventDefault(); insertMention(member); }}
                  onMouseEnter={() => setMentionSelectedIdx(idx)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left transition-all"
                  style={{
                    backgroundColor: idx === mentionSelectedIdx ? "#F4F5F7" : "transparent"
                  }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] text-white shrink-0" style={{ backgroundColor: member.color }}>
                    {member.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] truncate" style={{ color: "#172B4D" }}>{member.name}</div>
                    <div className="text-[11px] truncate" style={{ color: "#6B778C" }}>{member.role}</div>
                  </div>
                  {member.online && (
                    <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
            <div className="px-3 py-1.5 text-[10px] flex items-center gap-3" style={{ borderTop: "1px solid #DFE1E6", backgroundColor: "#FAFBFC", color: "#6B778C" }}>
              <span>↑↓ Di chuyển</span>
              <span>↵ Chọn</span>
              <span>Esc Đóng</span>
            </div>
          </div>
        )}

        {/* ====== BLOCK INSERTER (+) — shows on empty lines ====== */}
        {blockInserter.visible && editorMode === "edit" && !slashMenu.visible && (
          <div className="fixed z-[65]" style={{ left: `${blockInserter.x}px`, top: `${blockInserter.y}px` }}>
            <button
              onMouseDown={e => {
                e.preventDefault();
                setBlockInserterOpen(!blockInserterOpen);
              }}
              className="w-6 h-6 rounded flex items-center justify-center transition-all"
              style={{
                color: blockInserterOpen ? "#0052CC" : "#C1C7D0",
                backgroundColor: blockInserterOpen ? "#DEEBFF" : "transparent",
                border: "1px solid",
                borderColor: blockInserterOpen ? "#0052CC" : "#DFE1E6"
              }}
              onMouseEnter={e => { if (!blockInserterOpen) { e.currentTarget.style.color = "#0052CC"; e.currentTarget.style.borderColor = "#0052CC"; } }}
              onMouseLeave={e => { if (!blockInserterOpen) { e.currentTarget.style.color = "#C1C7D0"; e.currentTarget.style.borderColor = "#DFE1E6"; } }}
              title="Chèn block">
              <Plus className="w-3.5 h-3.5" />
            </button>
            {blockInserterOpen && (
              <div className="absolute left-8 top-0 bg-white rounded-lg shadow-xl py-1 w-[200px]" style={{ border: "1px solid #DFE1E6" }}>
                {[
                  { icon: <Type className="w-3.5 h-3.5" />, label: "Paragraph", action: () => execCmd("formatBlock", "p") },
                  { icon: <Heading1 className="w-3.5 h-3.5" />, label: "Heading 1", action: () => execCmd("formatBlock", "h1") },
                  { icon: <Heading2 className="w-3.5 h-3.5" />, label: "Heading 2", action: () => execCmd("formatBlock", "h2") },
                  { icon: <Heading3 className="w-3.5 h-3.5" />, label: "Heading 3", action: () => execCmd("formatBlock", "h3") },
                  null,
                  { icon: <List className="w-3.5 h-3.5" />, label: "Bulleted list", action: () => execCmd("insertUnorderedList") },
                  { icon: <ListOrdered className="w-3.5 h-3.5" />, label: "Numbered list", action: () => execCmd("insertOrderedList") },
                  { icon: <ListChecks className="w-3.5 h-3.5" />, label: "Checklist", action: () => toolbarAction("Checklist") },
                  null,
                  { icon: <Quote className="w-3.5 h-3.5" />, label: "Quote", action: () => execCmd("formatBlock", "blockquote") },
                  { icon: <Code className="w-3.5 h-3.5" />, label: "Code block", action: () => toolbarAction("CodeBlock") },
                  { icon: <Table className="w-3.5 h-3.5" />, label: "Table", action: () => toolbarAction("Table") },
                  { icon: <Minus className="w-3.5 h-3.5" />, label: "Divider", action: () => toolbarAction("Divider") },
                  { icon: <HelpCircle className="w-3.5 h-3.5" />, label: "Callout", action: () => execCmd("insertHTML", `<div style="background:#DEEBFF;border-left:3px solid #0052CC;padding:12px 16px;border-radius:3px;margin:8px 0;color:#172B4D"><strong style="color:#0052CC">ℹ️ Lưu ý</strong><br>Nội dung...</div><p><br></p>`) },
                ].map((item, i) => item === null ? (
                  <div key={`bsep-${i}`} className="my-1" style={{ borderTop: "1px solid #DFE1E6" }} />
                ) : (
                  <button key={item.label}
                    onMouseDown={e => { e.preventDefault(); item.action(); setBlockInserterOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-left transition-all"
                    style={{ color: "#172B4D" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                    <span style={{ color: "#6B778C" }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Right panel: Properties / Comments / History / Share / Analytics */}
        {(showProperties || showComments || showHistory || showShare || showAnalytics) && (
          <div className="w-[300px] flex flex-col shrink-0" style={{ borderLeft: "1px solid #DFE1E6", backgroundColor: "#FAFBFC" }}>
            {/* ===== PROPERTIES PANEL ===== */}
            {showProperties && (
              <>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #DFE1E6" }}>
                  <span className="text-[12px]" style={{ color: "#172B4D", fontWeight: 500 }}>Thuộc tính tài liệu</span>
                  <button onClick={() => setShowProperties(false)} style={{ color: "#6B778C" }} className="hover:opacity-70"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 overflow-auto p-3 space-y-4">
                  {/* Meta info */}
                  <div className="bg-white rounded-lg p-3 space-y-2.5" style={{ border: "1px solid #DFE1E6" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: "#6B778C" }}>Tạo bởi</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: editingDoc.authorColor }}>{editingDoc.authorInitial}</div>
                        <span className="text-[10px] text-gray-700">{editingDoc.author}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">Ngày tạo</span>
                      <span className="text-[10px] text-gray-700">{editingDoc.created}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">Cập nhật</span>
                      <span className="text-[10px] text-gray-700">{editingDoc.updated}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">Trang</span>
                      <span className="text-[10px] text-gray-700">{editingDoc.pages}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">Khoá</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${editingDoc.locked ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"}`}>
                        {editingDoc.locked ? "Đã khoá" : "Mở"}
                      </span>
                    </div>
                  </div>

                  {/* Folder location */}
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-gray-500">Thư mục</span>
                      <button onClick={() => setShowMoveFolder(true)} className="text-[10px] text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
                        <FolderInput className="w-3 h-3" /> Di chuyển
                      </button>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-2 bg-gray-50 rounded-lg">
                      <FolderOpen className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[11px] text-gray-700">
                        {editingDoc.folderId ? folders.find(f => f.id === editingDoc.folderId)?.name || "Thư mục" : "Chưa phân loại"}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-[10px] text-gray-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {editingDoc.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded-full text-[10px]">
                          #{tag}
                          <button onClick={() => removeTagFromDoc(editingDoc.id, tag)} className="hover:text-red-500 transition-all">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                      {editingDoc.tags.length === 0 && <span className="text-[10px] text-gray-400">Chưa có tag</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input value={editTags} onChange={e => setEditTags(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") addTagToDoc(editingDoc.id, editTags); }}
                        placeholder="Thêm tag..." className="flex-1 text-[10px] bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-300"
                      />
                      <button onClick={() => addTagToDoc(editingDoc.id, editTags)} disabled={!editTags.trim()}
                        className="px-2.5 py-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 text-white text-[9px] rounded-lg transition-all">
                        Thêm
                      </button>
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-[10px] text-gray-500 mb-2">Thống kê</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Từ", value: wordCount, icon: <Type className="w-3 h-3" /> },
                        { label: "Ký tự", value: charCount, icon: <Hash className="w-3 h-3" /> },
                        { label: "Dòng", value: lineCount, icon: <ListOrdered className="w-3 h-3" /> },
                        { label: "Đọc", value: `~${readTime}p`, icon: <Clock className="w-3 h-3" /> },
                      ].map(s => (
                        <div key={s.label} className="flex items-center gap-2 px-2.5 py-2 bg-gray-50 rounded-lg">
                          <span className="text-gray-400">{s.icon}</span>
                          <div>
                            <p className="text-[11px] text-gray-700">{s.value}</p>
                            <p className="text-[8px] text-gray-400">{s.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Danger zone */}
                  <div className="bg-white rounded-xl p-3 border border-red-100">
                    <p className="text-[10px] text-red-500 mb-2">Hành động</p>
                    <div className="space-y-1.5">
                      <button onClick={() => { archiveDoc(editingDoc.id); setShowProperties(false); }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-[11px] text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
                        <Archive className="w-3.5 h-3.5 text-gray-400" /> Lưu trữ tài liệu
                      </button>
                      <button onClick={() => { moveToTrash(editingDoc.id); setShowProperties(false); }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-[11px] text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 className="w-3.5 h-3.5" /> Chuyển vào thùng rác
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {showComments && (
              <>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #DFE1E6" }}>
                  <span className="text-[12px]" style={{ color: "#172B4D", fontWeight: 500 }}>Comments ({editingDoc.comments.length + inlineComments.length})</span>
                  <button onClick={() => setShowComments(false)} style={{ color: "#6B778C" }} className="hover:opacity-70"><X className="w-4 h-4" /></button>
                </div>
                {/* Inline comments section */}
                {inlineComments.length > 0 && (
                  <div className="px-3 pt-3">
                    <p className="text-[9px] uppercase tracking-wider mb-2 px-1" style={{ color: "#6B778C" }}>Inline Comments</p>
                    <div className="space-y-2 mb-3">
                      {inlineComments.filter(c => !c.resolved).map(c => (
                        <div key={c.id} className="rounded-lg p-3" style={{ border: "1px solid #FFF0B3", backgroundColor: "#FFFAE6" }}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: c.color }}>{c.initials}</div>
                            <span className="text-[10px]" style={{ color: "#172B4D" }}>{c.author}</span>
                            <span className="text-[9px] ml-auto" style={{ color: "#6B778C" }}>{c.time}</span>
                          </div>
                          <div className="text-[10px] px-2 py-1 rounded mb-1.5 italic" style={{ backgroundColor: "#FFF0B3", color: "#172B4D" }}>
                            "{c.selectedText.length > 60 ? c.selectedText.slice(0, 60) + "..." : c.selectedText}"
                          </div>
                          <p className="text-[11px]" style={{ color: "#172B4D" }}>{c.text}</p>
                          {/* Reactions */}
                          <div className="flex items-center gap-1 flex-wrap mt-2">
                            {Object.entries(c.reactions).map(([emoji, users]) => (
                              <button key={emoji} onClick={() => toggleInlineReaction(c.id, emoji)}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px]"
                                style={{
                                  border: users.includes("Nguyễn Minh") ? "1px solid #0052CC" : "1px solid #DFE1E6",
                                  backgroundColor: users.includes("Nguyễn Minh") ? "#DEEBFF" : "white",
                                }}>
                                {emoji} <span style={{ color: "#6B778C" }}>{users.length}</span>
                              </button>
                            ))}
                            <div className="relative group/ir">
                              <button className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                                style={{ color: "#C1C7D0", border: "1px dashed #DFE1E6" }}>+</button>
                              <div className="absolute bottom-full left-0 mb-1 hidden group-hover/ir:flex items-center gap-0.5 bg-white rounded-lg shadow-lg p-1 z-10" style={{ border: "1px solid #DFE1E6" }}>
                                {["👍","❤️","✅","🤔"].map(e => (
                                  <button key={e} onClick={() => toggleInlineReaction(c.id, e)}
                                    className="w-6 h-6 rounded flex items-center justify-center text-[12px]"
                                    onMouseEnter={ev => (ev.currentTarget.style.backgroundColor = "#F4F5F7")}
                                    onMouseLeave={ev => (ev.currentTarget.style.backgroundColor = "transparent")}>{e}</button>
                                ))}
                              </div>
                            </div>
                            <button onClick={() => { setInlineComments(prev => prev.map(ic => ic.id === c.id ? { ...ic, resolved: true } : ic)); toast.success("Đã resolve comment"); }}
                              className="ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] transition-all"
                              style={{ color: "#00875A" }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#E3FCEF")}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                              <Check className="w-3 h-3" /> Resolve
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {inlineComments.some(c => c.resolved) && (
                      <details className="mb-3">
                        <summary className="text-[9px] cursor-pointer px-1" style={{ color: "#6B778C" }}>Resolved ({inlineComments.filter(c => c.resolved).length})</summary>
                        <div className="space-y-1.5 mt-1.5">
                          {inlineComments.filter(c => c.resolved).map(c => (
                            <div key={c.id} className="rounded-lg p-2 opacity-60" style={{ border: "1px solid #DFE1E6", backgroundColor: "#FAFBFC" }}>
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-4 h-4 rounded-full flex items-center justify-center text-[6px] text-white" style={{ backgroundColor: c.color }}>{c.initials}</div>
                                <span className="text-[9px]" style={{ color: "#6B778C" }}>{c.author}</span>
                                <Check className="w-3 h-3 ml-auto" style={{ color: "#00875A" }} />
                              </div>
                              <p className="text-[10px] line-through" style={{ color: "#6B778C" }}>{c.text}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                    <div className="mb-2" style={{ borderTop: "1px solid #DFE1E6" }} />
                    <p className="text-[9px] uppercase tracking-wider mb-2 px-1" style={{ color: "#6B778C" }}>Page Comments</p>
                  </div>
                )}
                <div className="flex-1 overflow-auto p-3 space-y-3">
                  {editingDoc.comments.map(c => {
                    const reactions = commentReactions[c.id] || {};
                    return (
                    <div key={c.id} className="bg-white rounded-lg p-3" style={{ border: "1px solid #DFE1E6" }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] text-white" style={{ backgroundColor: c.color }}>{c.initials}</div>
                        <span className="text-[11px]" style={{ color: "#172B4D" }}>{c.author}</span>
                        <span className="text-[9px] ml-auto" style={{ color: "#6B778C" }}>{c.time}</span>
                      </div>
                      <p className="text-[11px] leading-[1.5] mb-2" style={{ color: "#172B4D" }}>{c.text}</p>
                      {/* Reactions */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {Object.entries(reactions).map(([emoji, users]) => (
                          <button key={emoji} onClick={() => toggleCommentReaction(c.id, emoji)}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] transition-all"
                            style={{
                              border: users.includes("Nguyễn Minh") ? "1px solid #0052CC" : "1px solid #DFE1E6",
                              backgroundColor: users.includes("Nguyễn Minh") ? "#DEEBFF" : "#F4F5F7",
                              color: "#172B4D",
                            }}>
                            {emoji} <span style={{ color: "#6B778C" }}>{users.length}</span>
                          </button>
                        ))}
                        {/* Add reaction button */}
                        <div className="relative group/react">
                          <button className="w-6 h-6 rounded-full flex items-center justify-center transition-all text-[11px]"
                            style={{ color: "#C1C7D0", border: "1px dashed #DFE1E6" }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                            +
                          </button>
                          <div className="absolute bottom-full left-0 mb-1 hidden group-hover/react:flex items-center gap-0.5 bg-white rounded-lg shadow-lg p-1 z-10" style={{ border: "1px solid #DFE1E6" }}>
                            {["👍","❤️","😂","🎉","🤔","👀"].map(e => (
                              <button key={e} onClick={() => toggleCommentReaction(c.id, e)}
                                className="w-7 h-7 rounded flex items-center justify-center text-[14px] transition-all"
                                onMouseEnter={ev => (ev.currentTarget.style.backgroundColor = "#F4F5F7")}
                                onMouseLeave={ev => (ev.currentTarget.style.backgroundColor = "transparent")}>
                                {e}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );})}
                  {editingDoc.comments.length === 0 && <p className="text-[11px] text-gray-400 text-center py-6">Chưa c�� comment nào</p>}
                </div>
                <div className="p-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <input value={newComment} onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") addComment(); }}
                      placeholder="Viết comment..." className="flex-1 text-[11px] bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-300"
                    />
                    <button onClick={addComment} disabled={!newComment.trim()}
                      className="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 text-white text-[10px] rounded-lg transition-all">
                      Gửi
                    </button>
                  </div>
                </div>
              </>
            )}
            {showHistory && (
              <>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #DFE1E6" }}>
                  <span className="text-[12px]" style={{ color: "#172B4D", fontWeight: 500 }}>Lịch sử phiên bản</span>
                  <div className="flex items-center gap-1">
                    {editingDoc.versions.length >= 2 && (
                      <button onClick={() => { setDiffVersions([1, 0]); setShowVersionDiff(true); }}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-all"
                        style={{ color: "#0052CC" }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#DEEBFF")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                        <GitCompare className="w-3 h-3" /> So sánh
                      </button>
                    )}
                    <button onClick={() => setShowHistory(false)} style={{ color: "#6B778C" }} className="hover:opacity-70"><X className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-3 space-y-2">
                  {editingDoc.versions.map((v, i) => (
                    <div key={v.id} className={`p-3 rounded-xl border transition-all cursor-pointer hover:border-cyan-200 group ${i === 0 ? "bg-cyan-50 border-cyan-200" : "bg-white border-gray-200"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-gray-700">v{v.id}</span>
                        <span className="text-[9px] text-gray-400">{v.date}</span>
                      </div>
                      <p className="text-[10px] text-gray-500">{v.summary}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-[9px] text-gray-400">Bởi {v.author}</p>
                        {i === 0 ? (
                          <span className="text-[8px] text-cyan-700 bg-cyan-100 px-1.5 py-0.5 rounded">Hiện tại</span>
                        ) : (
                          <button onClick={() => { editContentRef.current = `<p>${v.summary}</p>`; setEditContent(`<p>${v.summary}</p>`); setEditorKey(k => k + 1); toast.success(`Đã khôi phục v${v.id}`); }}
                            className="text-[8px] text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded hover:bg-cyan-100 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-0.5">
                            <RotateCcw className="w-2.5 h-2.5" /> Khôi phục
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {editingDoc.versions.length === 0 && <p className="text-[11px] text-gray-400 text-center py-6">Chưa có lịch sử</p>}
                </div>
              </>
            )}
            {showShare && (
              <>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #DFE1E6" }}>
                  <span className="text-[12px]" style={{ color: "#172B4D", fontWeight: 500 }}>Chia sẻ & Quyền</span>
                  <button onClick={() => setShowShare(false)} style={{ color: "#6B778C" }} className="hover:opacity-70"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 overflow-auto p-3 space-y-3">
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-[10px] text-gray-500 mb-2">Link chia sẻ</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-50 rounded-lg px-3 py-1.5 text-[10px] text-gray-500 truncate">
                        https://vwork.dev/docs/{editingDoc.id}
                      </div>
                      <button onClick={() => { copyToClipboard(`https://vwork.dev/docs/${editingDoc.id}`).then(() => toast.success("Đã copy link")); }}
                        className="text-[10px] text-cyan-600 hover:text-cyan-700 px-2 py-1.5 rounded-lg hover:bg-cyan-50">
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <button className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700"><Lock className="w-3 h-3" /> Riêng tư</button>
                      <button className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700"><Globe className="w-3 h-3" /> Team</button>
                    </div>
                  </div>

                  {/* Invite member */}
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-[10px] text-gray-500 mb-2">Mời thành viên</p>
                    <div className="flex items-center gap-2">
                      <input placeholder="Email hoặc tên..."
                        className="flex-1 text-[10px] bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-300 text-gray-700" />
                      <button onClick={() => toast.success("Đã gửi lời mời")}
                        className="text-[10px] text-white bg-cyan-500 hover:bg-cyan-600 px-3 py-1.5 rounded-lg transition-all shrink-0">
                        Mời
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <select className="text-[9px] text-gray-500 bg-gray-50 border border-gray-200 rounded-md px-1.5 py-1 focus:outline-none cursor-pointer">
                        <option value="viewer">Chỉ xem</option>
                        <option value="editor">Chỉnh sửa</option>
                        <option value="admin">Quản trị</option>
                      </select>
                      <span className="text-[9px] text-gray-400">Quyền mặc định cho người được mời</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-gray-500 mb-2">Đã chia sẻ với ({editingDoc.sharedWith.length})</p>
                    <div className="space-y-1.5">
                      {editingDoc.sharedWith.map(s => (
                        <div key={s.name} className="flex items-center gap-2 bg-white rounded-xl p-2.5 border border-gray-200 group">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] text-white" style={{ backgroundColor: s.color }}>{s.initials}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-gray-700">{s.name}</p>
                          </div>
                          <select defaultValue={s.role}
                            onChange={() => toast.success(`Đã cập nhật quyền cho ${s.name}`)}
                            className="text-[9px] px-1.5 py-0.5 rounded-md border border-gray-200 bg-gray-50 focus:outline-none cursor-pointer">
                            <option value="viewer">Xem</option>
                            <option value="editor">Chỉnh sửa</option>
                            <option value="admin">Quản trị</option>
                          </select>
                          <button onClick={() => toast.success(`Đã xoá ${s.name}`)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {editingDoc.sharedWith.length === 0 && <p className="text-[11px] text-gray-400 text-center py-4">Chưa chia sẻ với ai</p>}
                    </div>
                  </div>
                </div>
              </>
            )}
            {/* ===== ANALYTICS PANEL ===== */}
            {showAnalytics && (
              <>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #DFE1E6" }}>
                  <span className="text-[12px]" style={{ color: "#172B4D", fontWeight: 500 }}>Phân tích trang</span>
                  <button onClick={() => setShowAnalytics(false)} style={{ color: "#6B778C" }} className="hover:opacity-70"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 overflow-auto p-3 space-y-3">
                  {/* Overview stats */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Tổng lượt xem", value: pageViewCount, icon: <Eye className="w-4 h-4" />, color: "#0052CC", bg: "#DEEBFF" },
                      { label: "Người xem", value: pageUniqueViewers, icon: <Users2 className="w-4 h-4" />, color: "#00875A", bg: "#E3FCEF" },
                      { label: "Lượt thích", value: pageLikeCount, icon: <Heart className="w-4 h-4" />, color: "#DE350B", bg: "#FFEBE6" },
                      { label: "Comments", value: editingDoc.comments.length + inlineComments.length, icon: <MessageSquare className="w-4 h-4" />, color: "#5243AA", bg: "#EAE6FF" },
                    ].map(s => (
                      <div key={s.label} className="rounded-lg p-3 text-center" style={{ backgroundColor: s.bg }}>
                        <div className="flex items-center justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
                        <p className="text-[16px]" style={{ color: s.color, fontWeight: 600 }}>{s.value}</p>
                        <p className="text-[9px]" style={{ color: s.color }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* View trend - simple bar chart */}
                  <div className="bg-white rounded-lg p-3" style={{ border: "1px solid #DFE1E6" }}>
                    <p className="text-[10px] mb-3" style={{ color: "#6B778C", fontWeight: 500 }}>Lượt xem 7 ngày qua</p>
                    <div className="flex items-end gap-1 h-[80px]">
                      {[35, 22, 48, 30, 55, 42, 60].map((v, i) => {
                        const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
                        const isToday = i === 6;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full rounded-t transition-all" style={{
                              height: `${(v / 60) * 60}px`,
                              backgroundColor: isToday ? "#0052CC" : "#DEEBFF",
                            }} title={`${dayNames[i]}: ${v} lượt xem`} />
                            <span className="text-[8px]" style={{ color: isToday ? "#0052CC" : "#6B778C" }}>{dayNames[i]}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[9px] flex items-center gap-1" style={{ color: "#00875A" }}>
                        <TrendingUp className="w-3 h-3" /> +18% so với tuần trước
                      </span>
                    </div>
                  </div>

                  {/* Top viewers */}
                  <div className="bg-white rounded-lg p-3" style={{ border: "1px solid #DFE1E6" }}>
                    <p className="text-[10px] mb-2" style={{ color: "#6B778C", fontWeight: 500 }}>Người xem gần đây</p>
                    <div className="space-y-1.5">
                      {teamMembers.slice(0, 5).map((m, i) => (
                        <div key={m.name} className="flex items-center gap-2 py-1">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: m.color }}>{m.initials}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] truncate" style={{ color: "#172B4D" }}>{m.name}</p>
                          </div>
                          <span className="text-[9px]" style={{ color: "#6B778C" }}>
                            {i === 0 ? "2 phút trước" : i === 1 ? "1 giờ trước" : i === 2 ? "3 giờ trước" : i === 3 ? "Hôm qua" : "2 ngày trước"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Page health */}
                  <div className="bg-white rounded-lg p-3" style={{ border: "1px solid #DFE1E6" }}>
                    <p className="text-[10px] mb-2" style={{ color: "#6B778C", fontWeight: 500 }}>Sức khoẻ trang</p>
                    <div className="space-y-2">
                      {[
                        { label: "Độ mới", value: 85, desc: "Cập nhật gần đây", color: "#00875A" },
                        { label: "Đầy đủ", value: 70, desc: wordCount > 200 ? "Nội dung chi tiết" : "Cần thêm nội dung", color: wordCount > 200 ? "#00875A" : "#FF8B00" },
                        { label: "Tương tác", value: Math.min(100, (pageLikeCount + editingDoc.comments.length) * 10), desc: `${pageLikeCount} likes, ${editingDoc.comments.length} comments`, color: "#0052CC" },
                      ].map(item => (
                        <div key={item.label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px]" style={{ color: "#172B4D" }}>{item.label}</span>
                            <span className="text-[10px]" style={{ color: item.color, fontWeight: 500 }}>{item.value}%</span>
                          </div>
                          <div className="h-[4px] rounded-full overflow-hidden" style={{ backgroundColor: "#DFE1E6" }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                          </div>
                          <p className="text-[9px] mt-0.5" style={{ color: "#6B778C" }}>{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Labels */}
                  <div className="bg-white rounded-lg p-3" style={{ border: "1px solid #DFE1E6" }}>
                    <p className="text-[10px] mb-2" style={{ color: "#6B778C", fontWeight: 500 }}>Labels</p>
                    <div className="flex flex-wrap gap-1">
                      {pageLabels.map(l => (
                        <span key={l} className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: "#DEEBFF", color: "#0052CC" }}>{l}</span>
                      ))}
                      {pageLabels.length === 0 && <span className="text-[10px]" style={{ color: "#C1C7D0" }}>Chưa có label</span>}
                    </div>
                  </div>

                  {/* Content breakdown */}
                  <div className="bg-white rounded-lg p-3" style={{ border: "1px solid #DFE1E6" }}>
                    <p className="text-[10px] mb-2" style={{ color: "#6B778C", fontWeight: 500 }}>Phân tích nội dung</p>
                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex justify-between"><span style={{ color: "#6B778C" }}>Từ</span><span style={{ color: "#172B4D", fontWeight: 500 }}>{wordCount}</span></div>
                      <div className="flex justify-between"><span style={{ color: "#6B778C" }}>Ký tự</span><span style={{ color: "#172B4D", fontWeight: 500 }}>{charCount}</span></div>
                      <div className="flex justify-between"><span style={{ color: "#6B778C" }}>Dòng</span><span style={{ color: "#172B4D", fontWeight: 500 }}>{lineCount}</span></div>
                      <div className="flex justify-between"><span style={{ color: "#6B778C" }}>Headings</span><span style={{ color: "#172B4D", fontWeight: 500 }}>{headings.length}</span></div>
                      <div className="flex justify-between"><span style={{ color: "#6B778C" }}>Thời gian đọc</span><span style={{ color: "#172B4D", fontWeight: 500 }}>~{readTime} phút</span></div>
                      <div className="flex justify-between"><span style={{ color: "#6B778C" }}>Inline comments</span><span style={{ color: "#172B4D", fontWeight: 500 }}>{inlineComments.length}</span></div>
                      <div className="flex justify-between"><span style={{ color: "#6B778C" }}>Phiên bản</span><span style={{ color: "#172B4D", fontWeight: 500 }}>v{editingDoc.versions.length}</span></div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ====== TABLE TOOLBAR ====== */}
        {tableToolbar.visible && editorMode === "edit" && (
          <div className="fixed z-[70] flex items-center gap-0.5 px-1.5 py-1 rounded-lg shadow-xl"
            style={{
              left: `${tableToolbar.x}px`, top: `${tableToolbar.y}px`,
              transform: "translate(-50%, -100%)",
              backgroundColor: "#1B2638", border: "1px solid #253858"
            }}>
            {[
              { icon: <PlusCircle className="w-3.5 h-3.5" />, label: "Thêm hàng", action: tableAddRow },
              { icon: <MinusCircle className="w-3.5 h-3.5" />, label: "Xoá hàng cuối", action: tableDeleteRow },
              null,
              { icon: <SquarePlus className="w-3.5 h-3.5" />, label: "Thêm cột", action: tableAddCol },
              { icon: <Trash className="w-3.5 h-3.5" />, label: "Xoá cột cuối", action: tableDeleteCol },
              null,
              { icon: <Paintbrush className="w-3.5 h-3.5" />, label: "Toggle header", action: tableToggleHeaderRow },
              null,
              { icon: <X className="w-3.5 h-3.5" />, label: "Xoá bảng", action: tableDeleteTable },
            ].map((item, i) => item === null ? (
              <div key={`tsep-${i}`} className="w-px h-4 mx-0.5" style={{ backgroundColor: "#344563" }} />
            ) : (
              <button key={item.label}
                onMouseDown={e => { e.preventDefault(); item.action(); }}
                className="w-7 h-7 rounded flex items-center justify-center transition-all"
                style={{ color: item.label === "Xoá bảng" ? "#FF8F73" : "#B3BAC5" }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#253858"; e.currentTarget.style.color = item.label === "Xoá bảng" ? "#FF5630" : "#FFFFFF"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = item.label === "Xoá bảng" ? "#FF8F73" : "#B3BAC5"; }}
                title={item.label}>
                {item.icon}
              </button>
            ))}
          </div>
        )}

        {/* ====== VERSION DIFF MODAL ====== */}
        {showVersionDiff && editingDoc.versions.length >= 2 && (
          <VersionDiffModal editingDoc={editingDoc} diffVersions={diffVersions} setDiffVersions={setDiffVersions} onClose={() => setShowVersionDiff(false)} />
        )}

        {/* ====== MACRO BROWSER MODAL ====== */}
        {showMacroBrowser && (
          <MacroBrowserModal
            macroBrowserSearch={macroBrowserSearch} setMacroBrowserSearch={setMacroBrowserSearch}
            macroBrowserCategory={macroBrowserCategory} setMacroBrowserCategory={setMacroBrowserCategory}
            macroBrowserPreview={macroBrowserPreview} setMacroBrowserPreview={setMacroBrowserPreview}
            filteredMacros={filteredMacros}
            onClose={() => { setShowMacroBrowser(false); setMacroBrowserSearch(""); setMacroBrowserCategory("all"); setMacroBrowserPreview(null); }}
            onInsertMacro={insertMacro}
          />
        )}

        {/* ====== PAGE TREE PANEL ====== */}
        {showPageTree && (
          <PageTreePanel docs={docs} folders={folders} editingDoc={editingDoc}
            recentlyViewedDocs={recentlyViewedDocs} pageTreeExpanded={pageTreeExpanded}
            setPageTreeExpanded={setPageTreeExpanded} onClose={() => setShowPageTree(false)} onOpenDoc={openDoc} />
        )}

        {/* ====== NOTIFICATIONS PANEL ====== */}
        {showNotifications && (
          <NotificationsPanel pageNotifications={pageNotifications} notificationsRead={notificationsRead}
            setNotificationsRead={setNotificationsRead} onClose={() => setShowNotifications(false)} />
        )}

        {/* Move to Folder Modal */}
        {/* ====== PAGE RESTRICTIONS MODAL ====== */}
        {showRestrictions && (
          <PageRestrictionsModal pageRestrictions={pageRestrictions} setPageRestrictions={setPageRestrictions}
            restrictionTab={restrictionTab} setRestrictionTab={setRestrictionTab} onClose={() => setShowRestrictions(false)} />
        )}

        {/* ====== SHORTCUTS HELP MODAL ====== */}
        {showShortcutsHelp && (
          <EditorShortcutsModal onClose={() => setShowShortcutsHelp(false)} />
        )}

        {showMoveFolder && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowMoveFolder(false)}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #DFE1E6" }}>
                <div>
                  <h3 className="text-[14px]" style={{ color: "#172B4D", fontWeight: 500 }}>Di chuyển tài liệu</h3>
                  <p className="text-[10px] mt-0.5" style={{ color: "#6B778C" }}>Chọn thư mục đích</p>
                </div>
                <button onClick={() => setShowMoveFolder(false)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: "#6B778C" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F4F5F7")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}><X className="w-4 h-4" /></button>
              </div>
              <div className="p-3 max-h-[50vh] overflow-auto space-y-0.5">
                <button onClick={() => moveDocToFolder(editingDoc.id, null)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] transition-all ${!editingDoc.folderId ? "bg-cyan-50 text-cyan-700 border border-cyan-200" : "text-gray-600 hover:bg-gray-100"}`}>
                  <Inbox className="w-4 h-4 text-gray-400" /> Gốc (không thư mục)
                </button>
                {folders.map(f => (
                  <button key={f.id} onClick={() => moveDocToFolder(editingDoc.id, f.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] transition-all ${editingDoc.folderId === f.id ? "bg-cyan-50 text-cyan-700 border border-cyan-200" : "text-gray-600 hover:bg-gray-100"}`}
                    style={{ paddingLeft: f.parentId ? "32px" : "12px" }}>
                    <FolderOpen className="w-4 h-4" style={{ color: f.color }} />
                    {f.name}
                    {editingDoc.folderId === f.id && <span className="ml-auto text-[8px] text-cyan-500">Hiện tại</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );

    return editorInner;
  }

  /* ============ DOC LIST VIEW ============ */
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar - Enhanced Navigation */}
      {showSidebar && (
        <div className="w-[240px] border-r border-gray-100 flex flex-col bg-gray-50/30 shrink-0">
          {/* Sidebar search */}
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center gap-2 px-2.5 py-[6px] rounded-lg bg-white border border-gray-200 focus-within:border-cyan-300 transition-all">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Tìm tài liệu..."
                value={sidebarSearch}
                onChange={e => setSidebarSearch(e.target.value)}
                className="flex-1 text-[11px] bg-transparent outline-none text-gray-700 placeholder-gray-400"
              />
              {sidebarSearch && (
                <button onClick={() => setSidebarSearch("")} className="text-gray-300 hover:text-gray-500">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Access */}
          <div className="px-3 pb-1">
            <p className="text-[9px] text-gray-400 uppercase tracking-[0.08em] px-2 mb-1.5 mt-1" style={{ fontWeight: 600 }}>Truy cập nhanh</p>
            <div className="space-y-0.5">
              {([
                { key: "all" as SidebarSection, label: "Tất cả tài liệu", icon: <FileText className="w-[15px] h-[15px]" />, count: activeDocs.length },
                { key: "recent" as SidebarSection, label: "Gần đây", icon: <Clock className="w-[15px] h-[15px]" />, count: Math.min(activeDocs.length, 10) },
                { key: "shared" as SidebarSection, label: "Được chia sẻ với tôi", icon: <UserCheck className="w-[15px] h-[15px]" />, count: activeDocs.filter(d => d.sharedWith.length > 0).length },
                { key: "starred" as SidebarSection, label: "Yêu thích", icon: <Star className="w-[15px] h-[15px]" />, count: activeDocs.filter(d => d.starred).length },
              ]).map(item => (
                <button
                  key={item.key}
                  onClick={() => { setSidebarSection(item.key); setSelectedFolder(null); setSelectedTag(null); }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[11px] transition-all group ${
                    sidebarSection === item.key && !selectedFolder && !selectedTag
                      ? "bg-white shadow-sm text-gray-800 border border-gray-200"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className={sidebarSection === item.key && !selectedFolder && !selectedTag ? "text-cyan-600" : "text-gray-400 group-hover:text-gray-500"}>
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  <span className={`text-[9px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center ${
                    sidebarSection === item.key && !selectedFolder && !selectedTag ? "bg-cyan-50 text-cyan-600" : "text-gray-400"
                  }`}>{item.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-3 my-1.5" />

          {/* Folders */}
          <div className="px-3">
            <div className="flex items-center justify-between px-2 mb-1.5">
              <p className="text-[9px] text-gray-400 uppercase tracking-[0.08em]" style={{ fontWeight: 600 }}>Thư mục</p>
              <button onClick={() => toast.success("Tạo thư mục mới")} className="w-5 h-5 rounded-md hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
                <FolderPlus className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto px-3 pb-2 space-y-0.5">
            {(() => {
              /* Render folder tree recursively */
              const rootFolders = folders.filter(f => f.parentId === null);

              const filterFolders = sidebarSearch.trim()
                ? rootFolders.filter(f => {
                    const q = sidebarSearch.toLowerCase();
                    const selfMatch = f.name.toLowerCase().includes(q);
                    const childFolders = folders.filter(c => c.parentId === f.id);
                    const childMatch = childFolders.some(c => c.name.toLowerCase().includes(q));
                    const docMatch = activeDocs.some(d => {
                      const allIds = [f.id, ...childFolders.map(c => c.id)];
                      return allIds.includes(d.folderId || "") && d.title.toLowerCase().includes(q);
                    });
                    return selfMatch || childMatch || docMatch;
                  })
                : rootFolders;

              const renderFolder = (f: DocFolder, depth: number) => {
                const childFolders = folders.filter(c => c.parentId === f.id);
                const directDocs = activeDocs.filter(d => d.folderId === f.id);
                const allDescIds = getDescendantFolderIds(f.id);
                const totalDocs = activeDocs.filter(d => d.folderId && [f.id, ...allDescIds].includes(d.folderId)).length;
                const isExpanded = expandedFolders.has(f.id);
                const isSelected = selectedFolder === f.id;

                return (
                  <div key={f.id}>
                    <button
                      onClick={() => { toggleFolder(f.id); setSelectedFolder(f.id); setSelectedTag(null); setSidebarSection("all"); }}
                      className={`w-full flex items-center gap-2 py-[6px] rounded-lg text-[11px] transition-all group ${
                        isSelected ? "bg-white shadow-sm text-gray-800 border border-gray-200" : "text-gray-600 hover:bg-gray-100"
                      }`}
                      style={{ paddingLeft: `${depth * 16 + 10}px`, paddingRight: "10px" }}
                    >
                      <span className="text-gray-400 shrink-0">
                        {childFolders.length > 0 || directDocs.length > 0
                          ? isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
                          : <span className="w-3" />
                        }
                      </span>
                      {isExpanded
                        ? <FolderOpen className="w-3.5 h-3.5 shrink-0" style={{ color: f.color }} />
                        : <FolderClosed className="w-3.5 h-3.5 shrink-0" style={{ color: f.color }} />
                      }
                      <span className="truncate flex-1 text-left">{f.name}</span>
                      {totalDocs > 0 && (
                        <span className={`text-[9px] shrink-0 ${isSelected ? "text-cyan-600" : "text-gray-400"}`}>{totalDocs}</span>
                      )}
                    </button>
                    {isExpanded && (
                      <div className="space-y-0.5">
                        {/* Subfolders */}
                        {childFolders.map(child => renderFolder(child, depth + 1))}
                        {/* Direct docs in this folder */}
                        {directDocs.map(d => (
                          <button
                            key={d.id}
                            onClick={() => openDoc(d)}
                            className="w-full flex items-center gap-2 py-[5px] rounded-md text-[10px] text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
                            style={{ paddingLeft: `${(depth + 1) * 16 + 10}px`, paddingRight: "10px" }}
                          >
                            <span className="text-[13px] shrink-0">{d.icon}</span>
                            <span className="truncate">{d.title}</span>
                            {d.starred && <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0 ml-auto" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              };

              return filterFolders.map(f => renderFolder(f, 0));
            })()}

            {/* Sidebar search results */}
            {sidebarSearch.trim() && (() => {
              const q = sidebarSearch.toLowerCase();
              const matchedDocs = activeDocs.filter(d => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q));
              if (matchedDocs.length === 0) return (
                <div className="py-4 text-center">
                  <p className="text-[10px] text-gray-400">Không tìm thấy kết quả</p>
                </div>
              );
              return (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider px-2 mb-1.5">Kết quả tìm kiếm ({matchedDocs.length})</p>
                  <div className="space-y-0.5">
                    {matchedDocs.slice(0, 8).map(d => (
                      <button
                        key={d.id}
                        onClick={() => openDoc(d)}
                        className="w-full flex items-center gap-2 px-2.5 py-[5px] rounded-md text-[10px] text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
                      >
                        <span className="text-[13px] shrink-0">{d.icon}</span>
                        <span className="truncate flex-1 text-left">{d.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Tags */}
          <div className="px-3 py-2.5 border-t border-gray-100">
            <p className="text-[9px] text-gray-400 uppercase tracking-[0.08em] px-2 mb-2" style={{ fontWeight: 600 }}>Tags</p>
            <div className="flex flex-wrap gap-1 px-1">
              {allTags.slice(0, 12).map(tag => (
                <button key={tag} onClick={() => { setSelectedTag(selectedTag === tag ? null : tag); setSelectedFolder(null); setSidebarSection("all"); }}
                  className={`px-2 py-[3px] rounded-full text-[9px] transition-all ${selectedTag === tag ? "bg-cyan-100 text-cyan-700 border border-cyan-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-transparent"}`}>
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Archive & Trash */}
          <div className="px-3 py-2 border-t border-gray-100 space-y-0.5">
            <button
              onClick={() => { setSidebarSection("archived"); setSelectedFolder(null); setSelectedTag(null); }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[11px] transition-all group ${
                sidebarSection === "archived" ? "bg-white shadow-sm text-gray-800 border border-gray-200" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <Archive className={`w-[15px] h-[15px] ${sidebarSection === "archived" ? "text-amber-500" : "text-gray-400"}`} />
              <span className="flex-1 text-left">Đã lưu trữ</span>
              <span className="text-[9px] text-gray-400">{docs.filter(d => d.archived && !d.deleted).length}</span>
            </button>
            <button
              onClick={() => { setSidebarSection("trash"); setSelectedFolder(null); setSelectedTag(null); }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[11px] transition-all group ${
                sidebarSection === "trash" ? "bg-white shadow-sm text-gray-800 border border-gray-200" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <Trash2 className={`w-[15px] h-[15px] ${sidebarSection === "trash" ? "text-red-500" : "text-gray-400"}`} />
              <span className="flex-1 text-left">Thùng rác</span>
              <span className="text-[9px] text-gray-400">{docs.filter(d => d.deleted).length}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-gray-50/50 p-6 relative"
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        {/* Drag overlay */}
        {dragOver && (
          <div className="absolute inset-0 bg-cyan-50/80 z-40 flex items-center justify-center border-2 border-dashed border-cyan-400 rounded-2xl m-4 backdrop-blur-sm">
            <div className="text-center">
              <FileUp className="w-12 h-12 text-cyan-500 mx-auto mb-3 animate-bounce" />
              <p className="text-[14px] text-cyan-700">Thả file .md / .txt để import</p>
              <p className="text-[11px] text-cyan-500 mt-1">Hỗ trợ kéo thả nhiều file cùng lúc</p>
            </div>
          </div>
        )}
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowSidebar(!showSidebar)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 lg:hidden">
                <List className="w-4 h-4" />
              </button>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                sidebarSection === "trash" ? "bg-gradient-to-br from-red-500 to-rose-500 shadow-red-500/20"
                : sidebarSection === "archived" ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/20"
                : sidebarSection === "starred" ? "bg-gradient-to-br from-amber-400 to-yellow-500 shadow-amber-400/20"
                : sidebarSection === "shared" ? "bg-gradient-to-br from-violet-500 to-purple-500 shadow-violet-500/20"
                : sidebarSection === "recent" ? "bg-gradient-to-br from-cyan-500 to-teal-500 shadow-cyan-500/20"
                : "bg-gradient-to-br from-blue-500 to-indigo-500 shadow-blue-500/20"
              }`}>
                {sidebarSection === "trash" ? <Trash2 className="w-5 h-5 text-white" />
                : sidebarSection === "archived" ? <Archive className="w-5 h-5 text-white" />
                : sidebarSection === "starred" ? <Star className="w-5 h-5 text-white" />
                : sidebarSection === "shared" ? <UserCheck className="w-5 h-5 text-white" />
                : sidebarSection === "recent" ? <Clock className="w-5 h-5 text-white" />
                : <FileText className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h2 className="text-gray-900 tracking-tight">
                  {sidebarSection === "trash" ? "Thùng rác"
                  : sidebarSection === "archived" ? "Đã lưu trữ"
                  : sidebarSection === "starred" ? "Yêu thích"
                  : sidebarSection === "shared" ? "Được chia sẻ với tôi"
                  : sidebarSection === "recent" ? "Gần đây"
                  : "Docs"}
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {sidebarSection === "trash" ? `${docs.filter(d => d.deleted).length} tài liệu trong thùng rác`
                  : sidebarSection === "archived" ? `${docs.filter(d => d.archived && !d.deleted).length} tài liệu đã lưu trữ`
                  : `${filtered.length} tài liệu`}
                  {sidebarSection === "all" && !selectedFolder && !selectedTag ? ` · ${activeDocs.reduce((a, d) => a + d.pages, 0)} trang` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {sidebarSection === "trash" && docs.some(d => d.deleted) && (
                <>
                  <button onClick={() => {
                    setDocs(prev => prev.map(d => d.deleted ? { ...d, deleted: false } : d));
                    toast.success("Đã khôi phục tất cả tài liệu");
                  }}
                    className="flex items-center gap-1.5 text-cyan-600 hover:text-cyan-700 text-[11px] px-3 py-2 rounded-xl border border-cyan-200 hover:bg-cyan-50 transition-all">
                    <RotateCcw className="w-3.5 h-3.5" /> Khôi phục tất cả
                  </button>
                  <button onClick={emptyTrash}
                    className="flex items-center gap-1.5 text-red-500 hover:text-red-600 text-[11px] px-3 py-2 rounded-xl border border-red-200 hover:bg-red-50 transition-all">
                    <Trash2 className="w-3.5 h-3.5" /> Dọn sạch thùng rác
                  </button>
                </>
              )}
              {sidebarSection === "archived" && docs.some(d => d.archived && !d.deleted) && (
                <button onClick={() => {
                  setDocs(prev => prev.map(d => d.archived && !d.deleted ? { ...d, archived: false } : d));
                  toast.success("Đã bỏ lưu trữ tất cả");
                }}
                  className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700 text-[11px] px-3 py-2 rounded-xl border border-amber-200 hover:bg-amber-50 transition-all">
                  <ArchiveRestore className="w-3.5 h-3.5" /> Bỏ lưu trữ tất cả
                </button>
              )}
              {sidebarSection !== "trash" && sidebarSection !== "archived" && (
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-[11px] px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer">
                    <FileUp className="w-3.5 h-3.5" /> Import .md
                    <input type="file" accept=".md,.txt,.markdown" className="hidden" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) importMdFile(file);
                      e.target.value = "";
                    }} />
                  </label>
                  <button onClick={() => setShowTemplates(true)}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-[11px] px-4 py-2 rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm shadow-cyan-500/20">
                    <Plus className="w-3.5 h-3.5" /> Tạo Doc
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filters bar */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm tài liệu, nội dung, tags..."
                className="w-full pl-8 pr-3 py-2 text-[11px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100 text-gray-700 transition-all" />
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-0.5">
              {categories.map(c => (
                <button key={c.key} onClick={() => setSelectedCategory(c.key)}
                  className={`px-2.5 py-1.5 text-[10px] rounded-lg transition-all flex items-center gap-1 ${selectedCategory === c.key ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
                  {c.label} <span className="text-[8px] text-gray-400">{c.count}</span>
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}
              className="text-[10px] text-gray-500 bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer">
              <option value="updated">Mới cập nhật</option>
              <option value="title">Tên A-Z</option>
              <option value="created">Ngày tạo</option>
              <option value="author">Tác giả</option>
            </select>
            <button onClick={() => setSortAsc(!sortAsc)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all" title={sortAsc ? "Tăng dần" : "Giảm dần"}>
              {sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => selectAllFiltered(filtered.map(d => d.id))}
              className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${selectedDocs.size > 0 ? "bg-cyan-50 border-cyan-300 text-cyan-600" : "bg-white border-gray-200 text-gray-400 hover:text-gray-600"}`}
              title={selectedDocs.size > 0 ? `${selectedDocs.size} đã chọn — bấm để bỏ chọn` : "Chọn tất cả"}>
              <CheckSquare className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => setViewMode("grid")} className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-gray-700" : "text-gray-400"}`}><Grid3X3 className="w-3.5 h-3.5" /></button>
              <button onClick={() => setViewMode("list")} className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${viewMode === "list" ? "bg-white shadow-sm text-gray-700" : "text-gray-400"}`}><List className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {/* Active tag filter */}
          {selectedTag && (
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[10px] text-gray-400">Tag:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded-full text-[10px]">
                #{selectedTag} <button onClick={() => setSelectedTag(null)}><X className="w-2.5 h-2.5" /></button>
              </span>
            </div>
          )}

          {/* Selected folder indicator */}
          {selectedFolder && (() => {
            const folder = folders.find(f => f.id === selectedFolder);
            const parentFolder = folder?.parentId ? folders.find(f => f.id === folder.parentId) : null;
            return folder ? (
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => { setSelectedFolder(null); setSidebarSection("all"); }} className="text-[10px] text-gray-400 hover:text-gray-600 transition-all">Tất cả</button>
                {parentFolder && (
                  <>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                    <button onClick={() => setSelectedFolder(parentFolder.id)} className="text-[10px] text-gray-400 hover:text-gray-600 transition-all">{parentFolder.name}</button>
                  </>
                )}
                <ChevronRight className="w-3 h-3 text-gray-300" />
                <span className="text-[10px] text-gray-700 flex items-center gap-1">
                  <FolderOpen className="w-3 h-3" style={{ color: folder.color }} /> {folder.name}
                </span>
              </div>
            ) : null;
          })()}

          {/* ====== DASHBOARD / OVERVIEW ====== */}
          {sidebarSection === "all" && !selectedFolder && !selectedTag && !searchQ.trim() && selectedCategory === "all" && (
            <div className="mb-6 space-y-5">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Tổng tài liệu", value: activeDocs.length, sub: `+${activeDocs.filter(d => d.updatedTimestamp > Date.now() - 7 * 86400000).length} tuần này`, icon: <FileText className="w-5 h-5" />, gradient: "from-blue-500 to-indigo-500", shadow: "shadow-blue-500/15", bg: "bg-blue-50", text: "text-blue-600" },
                  { label: "Được chia sẻ", value: activeDocs.filter(d => d.sharedWith.length > 0).length, sub: `${activeDocs.reduce((a, d) => a + d.sharedWith.length, 0)} lượt chia sẻ`, icon: <Users className="w-5 h-5" />, gradient: "from-violet-500 to-purple-500", shadow: "shadow-violet-500/15", bg: "bg-violet-50", text: "text-violet-600" },
                  { label: "Chỉnh sửa gần đây", value: activeDocs.filter(d => d.updatedTimestamp > Date.now() - 3 * 86400000).length, sub: "trong 3 ngày qua", icon: <Pencil className="w-5 h-5" />, gradient: "from-cyan-500 to-teal-500", shadow: "shadow-cyan-500/15", bg: "bg-cyan-50", text: "text-cyan-600" },
                  { label: "Bình luận mới", value: activeDocs.reduce((a, d) => a + d.comments.length, 0), sub: `trong ${activeDocs.filter(d => d.comments.length > 0).length} tài liệu`, icon: <MessageSquare className="w-5 h-5" />, gradient: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/15", bg: "bg-amber-50", text: "text-amber-600" },
                ].map(stat => (
                  <div key={stat.label} className={`bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all group`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center ${stat.text}`}>
                        {stat.icon}
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-all" />
                    </div>
                    <p className="text-[22px] text-gray-900 tracking-tight">{stat.value}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{stat.label}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Two-column: Activity Timeline + Team */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-500" />
                      <span className="text-[12px] text-gray-800">Hoạt động gần đây</span>
                    </div>
                    <button className="text-[10px] text-cyan-600 hover:text-cyan-700 px-2 py-1 rounded-lg hover:bg-cyan-50 transition-all">Xem tất cả</button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {recentActivities.slice(0, 6).map((act, i) => (
                      <div key={act.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50/50 transition-all group cursor-pointer">
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center pt-1 shrink-0">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[8px] text-white" style={{ backgroundColor: act.color }}>
                            {act.initials}
                          </div>
                          {i < 5 && <div className="w-px h-full bg-gray-100 mt-1.5 min-h-[12px]" />}
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <p className="text-[11px] text-gray-600 leading-relaxed">
                            <span className="text-gray-800" style={{ fontWeight: 500 }}>{act.user}</span>{" "}
                            {act.action}{" "}
                            <span className="text-cyan-600 hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); const d = activeDocs.find(d => d.title === act.doc); if (d) openDoc(d); }}>{act.doc}</span>
                          </p>
                          <p className="text-[9px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                            <Clock className="w-2.5 h-2.5" /> {act.time}
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                              act.type === "edit" ? "bg-blue-400" : act.type === "comment" ? "bg-amber-400" : act.type === "create" ? "bg-green-400" : act.type === "share" ? "bg-violet-400" : "bg-gray-300"
                            }`} />
                            <span className="text-gray-300">{act.type === "edit" ? "Chỉnh sửa" : act.type === "comment" ? "Bình luận" : act.type === "create" ? "Tạo mới" : act.type === "share" ? "Chia sẻ" : "Khác"}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Activity */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-violet-500" />
                      <span className="text-[12px] text-gray-800">Đội nhóm</span>
                    </div>
                    <span className="text-[9px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      {teamMembers.filter(m => m.online).length} online
                    </span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {teamMembers.map(m => (
                      <div key={m.name} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-all">
                        <div className="relative shrink-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] text-white" style={{ backgroundColor: m.color }}>
                            {m.initials}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${m.online ? "bg-green-400" : "bg-gray-300"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-gray-800">{m.name}</p>
                          <p className="text-[9px] text-gray-400 truncate">{m.role}</p>
                        </div>
                        {m.online && (
                          <div className="text-right shrink-0">
                            <p className="text-[8px] text-gray-400">Đang xem</p>
                            <p className="text-[9px] text-cyan-600 truncate max-w-[80px]">{m.lastDoc.split(" ").slice(0, 2).join(" ")}...</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recently Accessed Docs (horizontal scroll) */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3 h-3" /> Truy cập gần đây</p>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {[...activeDocs].sort((a, b) => b.updatedTimestamp - a.updatedTimestamp).slice(0, 6).map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => openDoc(doc)}
                      className="flex-shrink-0 w-[220px] bg-white rounded-2xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="text-base">{doc.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-gray-800 truncate group-hover:text-gray-900">{doc.title}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed mb-2.5">{doc.content.replace(/[#*`\n]/g, " ").trim().slice(0, 80)}...</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: doc.authorColor }}>{doc.authorInitial}</div>
                          <span className="text-[9px] text-gray-400">{doc.author.split(" ").pop()}</span>
                        </div>
                        <span className="text-[9px] text-gray-400">{doc.updated}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pinned docs section */}
          {filtered.some(d => pinnedDocs.has(d.id)) && sidebarSection === "all" && selectedCategory === "all" && !selectedTag && !selectedFolder && (
            <div className="mb-5">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Pin className="w-3 h-3 text-amber-500" /> Đã ghim</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {filtered.filter(d => pinnedDocs.has(d.id)).map(doc => (
                  <div key={doc.id} onClick={() => openDoc(doc)}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-amber-200 hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer group">
                    <span className="text-lg">{doc.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-gray-800 truncate">{doc.title}</p>
                      <p className="text-[10px] text-gray-400">{doc.updated}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); togglePin(doc.id); }}
                      className="opacity-0 group-hover:opacity-100 text-amber-400 hover:text-amber-600 transition-all" title="Bỏ ghim">
                      <PinOff className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Starred docs */}
          {filtered.some(d => d.starred) && sidebarSection === "all" && selectedCategory === "all" && !selectedTag && !selectedFolder && (
            <div className="mb-5">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> Được đánh dấu</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {filtered.filter(d => d.starred).map(doc => (
                  <div key={doc.id} onClick={() => openDoc(doc)}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-amber-200 hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer group">
                    <span className="text-lg">{doc.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-gray-800 truncate">{doc.title}</p>
                      <p className="text-[10px] text-gray-400">{doc.updated}</p>
                    </div>
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid/List view */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map(doc => (
                <div key={doc.id} onClick={() => openDoc(doc)}
                  className={`bg-white rounded-2xl border p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group shadow-sm relative ${selectedDocs.has(doc.id) ? "border-cyan-300 ring-2 ring-cyan-100" : pinnedDocs.has(doc.id) ? "border-amber-200" : "border-gray-200"}`}>
                  {/* Batch select checkbox */}
                  <button onClick={e => { e.stopPropagation(); toggleSelectDoc(doc.id); }}
                    className={`absolute top-2.5 left-2.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedDocs.has(doc.id) ? "bg-cyan-500 border-cyan-500 text-white" : "border-gray-300 opacity-0 group-hover:opacity-100 bg-white hover:border-cyan-400"}`}>
                    {selectedDocs.has(doc.id) && <Check className="w-3 h-3" />}
                  </button>
                  {/* Pin indicator */}
                  {pinnedDocs.has(doc.id) && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-md bg-amber-50 flex items-center justify-center" title="Đã ghim">
                      <Pin className="w-3 h-3 text-amber-500" />
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl">{doc.icon}</span>
                    <div className="flex items-center gap-1">
                      {doc.locked && <Lock className="w-3 h-3 text-gray-300" />}
                      {doc.collaborators.some(c => c.online) && (
                        <div className="flex -space-x-1">
                          {doc.collaborators.filter(c => c.online).slice(0, 2).map(c => (
                            <div key={c.name} className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] text-white border border-white" style={{ backgroundColor: c.color }}>
                              {c.initials}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setContextMenuDocId(contextMenuDocId === doc.id ? null : doc.id); }}
                          className="w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100 transition-all">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                        {contextMenuDocId === doc.id && (
                          <div className="absolute right-0 top-full mt-1 w-[200px] bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1" onClick={e => e.stopPropagation()}>
                            {doc.deleted ? (
                              <>
                                <button onClick={() => { restoreDoc(doc.id); setContextMenuDocId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50">
                                  <RotateCcw className="w-3.5 h-3.5 text-gray-400" /> Khôi phục
                                </button>
                                <div className="h-px bg-gray-100 my-1" />
                                <button onClick={() => { deleteDoc(doc.id); setContextMenuDocId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-500 hover:bg-red-50">
                                  <Trash2 className="w-3.5 h-3.5" /> Xoá vĩnh viễn
                                </button>
                              </>
                            ) : doc.archived ? (
                              <>
                                <button onClick={() => { restoreDoc(doc.id); setContextMenuDocId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50">
                                  <ArchiveRestore className="w-3.5 h-3.5 text-gray-400" /> Bỏ lưu trữ
                                </button>
                                <div className="h-px bg-gray-100 my-1" />
                                <button onClick={() => { moveToTrash(doc.id); setContextMenuDocId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-500 hover:bg-red-50">
                                  <Trash2 className="w-3.5 h-3.5" /> Chuyển vào thùng rác
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => { toggleStar(doc.id); setContextMenuDocId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50">
                                  {doc.starred ? <StarOff className="w-3.5 h-3.5 text-gray-400" /> : <Star className="w-3.5 h-3.5 text-gray-400" />}
                                  {doc.starred ? "Bỏ yêu thích" : "Yêu thích"}
                                </button>
                                <button onClick={() => { togglePin(doc.id); setContextMenuDocId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50">
                                  {pinnedDocs.has(doc.id) ? <PinOff className="w-3.5 h-3.5 text-gray-400" /> : <Pin className="w-3.5 h-3.5 text-gray-400" />}
                                  {pinnedDocs.has(doc.id) ? "Bỏ ghim" : "Ghim lên đầu"}
                                </button>
                                <button onClick={() => { duplicateDoc(doc.id); setContextMenuDocId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50">
                                  <Copy className="w-3.5 h-3.5 text-gray-400" /> Nhân bản
                                </button>
                                <button onClick={() => { copyToClipboard(`https://vwork.dev/docs/${doc.id}`).then(() => toast.success("Đã copy link")); setContextMenuDocId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50">
                                  <Link className="w-3.5 h-3.5 text-gray-400" /> Copy link
                                </button>
                                <button onClick={() => {
                                  const blob = new Blob([`# ${doc.title}\n\n${doc.content}`], { type: "text/markdown" });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a"); a.href = url; a.download = `${doc.title.replace(/\s+/g, "_")}.md`; a.click();
                                  URL.revokeObjectURL(url);
                                  toast.success("Đã export file .md");
                                  setContextMenuDocId(null);
                                }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50">
                                  <Download className="w-3.5 h-3.5 text-gray-400" /> Export .md
                                </button>
                                <div className="h-px bg-gray-100 my-1" />
                                <button onClick={() => { archiveDoc(doc.id); setContextMenuDocId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50">
                                  <Archive className="w-3.5 h-3.5 text-gray-400" /> Lưu trữ
                                </button>
                                <button onClick={() => { moveToTrash(doc.id); setContextMenuDocId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-500 hover:bg-red-50">
                                  <Trash2 className="w-3.5 h-3.5" /> Chuyển vào thùng rác
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <h4 className="text-[12px] text-gray-800 group-hover:text-gray-900 mb-2 line-clamp-2 leading-relaxed">{doc.title}</h4>
                  {doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {doc.tags.slice(0, 3).map(t => (
                        <span key={t} className="text-[8px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">#{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: doc.authorColor }}>{doc.authorInitial}</div>
                      <span>{doc.author.split(" ").pop()}</span>
                    </div>
                    <span>{doc.updated}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[9px] text-gray-400">
                    <span>{doc.pages} pages</span>
                    <span className="text-gray-300">·</span>
                    <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" /> {doc.shared}</span>
                    {doc.comments.length > 0 && <>
                      <span className="text-gray-300">·</span>
                      <span className="flex items-center gap-0.5"><MessageSquare className="w-2.5 h-2.5" /> {doc.comments.length}</span>
                    </>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex items-center px-5 py-2.5 border-b border-gray-100 text-[9px] text-gray-400 uppercase tracking-wider">
                <span className="w-6 shrink-0" />
                <span className="flex-1">Tên</span>
                <span className="w-10 text-center">📌</span>
                <span className="w-16 text-center">Tags</span>
                <span className="w-20 text-center">Tác giả</span>
                <span className="w-24 text-right">Cập nhật</span>
                <span className="w-10" />
              </div>
              {filtered.map((doc, i) => (
                <div key={doc.id} onClick={() => openDoc(doc)}
                  className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-all group ${i < filtered.length - 1 ? "border-b border-gray-100" : ""} ${selectedDocs.has(doc.id) ? "bg-cyan-50/50" : ""}`}>
                  <button onClick={e => { e.stopPropagation(); toggleSelectDoc(doc.id); }}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${selectedDocs.has(doc.id) ? "bg-cyan-500 border-cyan-500 text-white" : "border-gray-300 opacity-0 group-hover:opacity-100 hover:border-cyan-400"}`}>
                    {selectedDocs.has(doc.id) && <Check className="w-3 h-3" />}
                  </button>
                  <span className="text-base shrink-0">{doc.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] text-gray-800 truncate">{doc.title}</p>
                      {doc.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                      {doc.locked && <Lock className="w-3 h-3 text-gray-300 shrink-0" />}
                      {doc.collaborators.some(c => c.online) && (
                        <div className="flex -space-x-1">
                          {doc.collaborators.filter(c => c.online).slice(0, 2).map(c => (
                            <div key={c.name} className="w-4 h-4 rounded-full flex items-center justify-center text-[6px] text-white border border-white" style={{ backgroundColor: c.color }}>{c.initials}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-10 flex justify-center">
                    {pinnedDocs.has(doc.id) && <Pin className="w-3 h-3 text-amber-500" />}
                  </div>
                  <div className="w-16 flex justify-center">
                    {doc.tags.length > 0 && <span className="text-[8px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">#{doc.tags[0]}</span>}
                  </div>
                  <div className="w-20 flex items-center justify-center gap-1.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: doc.authorColor }}>{doc.authorInitial}</div>
                    <span className="text-[10px] text-gray-500">{doc.author.split(" ").pop()}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 w-24 text-right">{doc.updated}</span>
                  <div className="w-10 flex justify-end">
                    <button onClick={e => { e.stopPropagation(); setContextMenuDocId(contextMenuDocId === doc.id ? null : doc.id); }}
                      className="w-6 h-6 rounded-md hover:bg-gray-200 flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100 transition-all">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              {sidebarSection === "trash" ? (
                <>
                  <Trash2 className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                  <p className="text-[14px] text-gray-500">Thùng rác trống</p>
                  <p className="text-[11px] text-gray-400 mt-1">Các tài liệu đã xoá sẽ xuất hiện ở đây</p>
                </>
              ) : sidebarSection === "archived" ? (
                <>
                  <Archive className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                  <p className="text-[14px] text-gray-500">Chưa có tài liệu lưu trữ</p>
                  <p className="text-[11px] text-gray-400 mt-1">Lưu trữ tài liệu cũ để giữ workspace gọn gàng</p>
                </>
              ) : sidebarSection === "starred" ? (
                <>
                  <Star className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                  <p className="text-[14px] text-gray-500">Chưa có tài liệu yêu thích</p>
                  <p className="text-[11px] text-gray-400 mt-1">Đánh dấu ⭐ tài liệu quan trọng để truy cập nhanh</p>
                </>
              ) : sidebarSection === "shared" ? (
                <>
                  <UserCheck className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                  <p className="text-[14px] text-gray-500">Chưa có tài liệu được chia sẻ</p>
                  <p className="text-[11px] text-gray-400 mt-1">Tài liệu được người khác chia sẻ sẽ hiển thị ở đây</p>
                </>
              ) : (
                <>
                  <FileText className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                  <p className="text-[14px] text-gray-500">Không tìm thấy tài liệu</p>
                  <p className="text-[11px] text-gray-400 mt-1">Thử thay đổi bộ lọc hoặc tạo tài liệu mới</p>
                  <button onClick={() => setShowTemplates(true)} className="mt-4 text-[11px] text-cyan-600 hover:text-cyan-700 px-3 py-1.5 rounded-lg border border-cyan-200 hover:bg-cyan-50 transition-all">
                    Tạo tài liệu
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== Floating Batch Action Bar ===== */}
      {selectedDocs.size > 0 && !editingDoc && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 pr-4 border-r border-gray-700">
            <CheckSquare className="w-4 h-4 text-cyan-400" />
            <span className="text-[12px]">{selectedDocs.size} đã chọn</span>
          </div>
          <button onClick={batchStar} className="flex items-center gap-1.5 text-[11px] hover:text-amber-400 transition-all px-2 py-1 rounded-lg hover:bg-gray-800">
            <Star className="w-3.5 h-3.5" /> Yêu thích
          </button>
          <button onClick={batchArchive} className="flex items-center gap-1.5 text-[11px] hover:text-orange-400 transition-all px-2 py-1 rounded-lg hover:bg-gray-800">
            <Archive className="w-3.5 h-3.5" /> Lưu trữ
          </button>
          <button onClick={batchTrash} className="flex items-center gap-1.5 text-[11px] hover:text-red-400 transition-all px-2 py-1 rounded-lg hover:bg-gray-800">
            <Trash2 className="w-3.5 h-3.5" /> Xoá
          </button>
          <div className="relative group/move">
            <button className="flex items-center gap-1.5 text-[11px] hover:text-violet-400 transition-all px-2 py-1 rounded-lg hover:bg-gray-800">
              <FolderOpen className="w-3.5 h-3.5" /> Di chuyển
            </button>
            <div className="absolute bottom-full left-0 mb-2 w-[180px] bg-white rounded-xl shadow-xl border border-gray-200 py-1 hidden group-hover/move:block">
              <button onClick={() => batchMoveToFolder(null)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50">
                <Inbox className="w-3.5 h-3.5 text-gray-400" /> Thư mục gốc
              </button>
              {folders.filter(f => f.parentId === null).map(f => (
                <button key={f.id} onClick={() => batchMoveToFolder(f.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50">
                  <FolderClosed className="w-3.5 h-3.5" style={{ color: f.color }} /> {f.name}
                </button>
              ))}
            </div>
          </div>
          <div className="relative group/tag">
            <button className="flex items-center gap-1.5 text-[11px] hover:text-green-400 transition-all px-2 py-1 rounded-lg hover:bg-gray-800">
              <Tag className="w-3.5 h-3.5" /> Gán tag
            </button>
            <div className="absolute bottom-full left-0 mb-2 w-[180px] bg-white rounded-xl shadow-xl border border-gray-200 py-1 hidden group-hover/tag:block max-h-[200px] overflow-auto">
              {Array.from(new Set(docs.flatMap(d => d.tags))).filter(Boolean).map(tag => (
                <button key={tag} onClick={() => {
                  setDocs(prev => prev.map(d => selectedDocs.has(d.id) && !d.tags.includes(tag) ? { ...d, tags: [...d.tags, tag] } : d));
                  toast.success(`Đã gán tag #${tag} cho ${selectedDocs.size} tài liệu`);
                }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50">
                  <Hash className="w-3.5 h-3.5 text-gray-400" /> #{tag}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => {
            selectedDocs.forEach(id => togglePin(id));
          }} className="flex items-center gap-1.5 text-[11px] hover:text-amber-400 transition-all px-2 py-1 rounded-lg hover:bg-gray-800">
            <Pin className="w-3.5 h-3.5" /> Ghim
          </button>
          <div className="pl-2 border-l border-gray-700">
            <button onClick={() => setSelectedDocs(new Set())} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-all px-2 py-1 rounded-lg hover:bg-gray-800">
              <X className="w-3.5 h-3.5" /> Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* ===== Enhanced Template Gallery with Preview ===== */}
      {showTemplates && (
        <TemplateGalleryModal
          templateSearch={templateSearch} setTemplateSearch={setTemplateSearch}
          templateCategory={templateCategory} setTemplateCategory={setTemplateCategory}
          templateGalleryPreview={templateGalleryPreview} setTemplateGalleryPreview={setTemplateGalleryPreview}
          onClose={() => setShowTemplates(false)} onCreateDoc={createDoc}
        />
      )}

      {/* ===== Keyboard Shortcuts Help Modal ===== */}
      {showShortcutsHelp && (
        <ListShortcutsModal onClose={() => setShowShortcutsHelp(false)} />
      )}
    </div>
  );
}
