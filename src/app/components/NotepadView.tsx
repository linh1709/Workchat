import { toast } from "sonner";
import { copyToClipboard } from "./clipboard";
import {
  StickyNote, Plus, Pin, PinOff, Trash2, Edit3, Search, X,
  MoreHorizontal, Copy, Clock, Star, StarOff, Grid3X3, List,
  Palette, Tag, Filter, Download, ChevronDown, Check,
  AlignLeft, FileText, Archive, Bold, Italic, Strikethrough,
  ListOrdered, ListChecks, Code, Link, Heading1, Heading2,
  Type, Minus, Quote, Undo, Redo
} from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  starred: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

const noteColors = ["#ffffff", "#ecfeff", "#f3e8ff", "#ecfdf5", "#fefce8", "#fdf2f8", "#eef2ff", "#fff7ed"];

const initialNotes: Note[] = [
  { id: "n1", title: "Sprint 12 Notes", content: "Focus areas:\n- Chat module completion\n- Dashboard polish\n- Performance optimization\n\nKey decisions:\n- Use WebSocket for real-time\n- Implement lazy loading", color: "#ecfeff", pinned: true, starred: true, tags: ["sprint", "planning"], createdAt: "2026-03-17", updatedAt: "2026-03-17", archived: false },
  { id: "n2", title: "API Design Patterns", content: "RESTful conventions:\n- Use plural nouns: /tasks, /projects\n- HTTP verbs for actions\n- Pagination with cursor\n- Rate limiting headers\n\nGraphQL considerations:\n- Fragments for reuse\n- Subscriptions for real-time", color: "#f3e8ff", pinned: true, starred: false, tags: ["api", "backend"], createdAt: "2026-03-16", updatedAt: "2026-03-16", archived: false },
  { id: "n3", title: "Meeting Notes - Team Sync", content: "Attendees: All team\n\nAgenda:\n1. Sprint progress review\n2. Blockers discussion\n3. Next sprint planning\n\nAction items:\n- Minh: Complete auth module\n- Bình: Design system v2\n- Cường: Mobile fixes", color: "#fefce8", pinned: false, starred: false, tags: ["meeting"], createdAt: "2026-03-15", updatedAt: "2026-03-15", archived: false },
  { id: "n4", title: "Bug Investigation", content: "Issue: Login redirect loop on Safari\n\nSteps to reproduce:\n1. Clear cookies\n2. Navigate to /dashboard\n3. Login via Google OAuth\n4. Redirect fails\n\nRoot cause: SameSite cookie policy\nFix: Set SameSite=None; Secure", color: "#fdf2f8", pinned: false, starred: true, tags: ["bugfix", "auth"], createdAt: "2026-03-14", updatedAt: "2026-03-15", archived: false },
  { id: "n5", title: "Design System Colors", content: "Primary: #0891b2 (Cyan)\nSecondary: #7c3aed (Violet)\nSuccess: #059669 (Emerald)\nWarning: #d97706 (Amber)\nError: #dc2626 (Red)\n\nNeutrals: Gray 50-950\nBorder radius: 8px, 12px, 16px", color: "#ecfdf5", pinned: false, starred: false, tags: ["design"], createdAt: "2026-03-13", updatedAt: "2026-03-13", archived: false },
  { id: "n6", title: "Performance Checklist", content: "[ ] Lighthouse score > 90\n[ ] First paint < 1.5s\n[ ] Bundle size < 200KB\n[ ] Code splitting routes\n[ ] Image optimization\n[x] React.memo for lists\n[x] Virtual scrolling\n[x] Service worker cache", color: "#eef2ff", pinned: false, starred: false, tags: ["performance"], createdAt: "2026-03-12", updatedAt: "2026-03-14", archived: false },
  { id: "n7", title: "Ideas Backlog", content: "- AI task suggestions\n- Voice commands\n- Markdown editor\n- Code snippets in tasks\n- Dark mode themes\n- Custom emoji\n- Template marketplace", color: "#fff7ed", pinned: false, starred: false, tags: ["ideas"], createdAt: "2026-03-11", updatedAt: "2026-03-11", archived: false },
];

export function NotepadView() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQ, setSearchQ] = useState("");
  const [filterTag, setFilterTag] = useState("all");
  const [filterStarred, setFilterStarred] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [ctxMenu, setCtxMenu] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"updated" | "created" | "title" | "starred">("updated");
  const [showPreview, setShowPreview] = useState(false);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(n => n.tags.forEach(t => tags.add(t)));
    return ["all", ...Array.from(tags)];
  }, [notes]);

  const filtered = useMemo(() => {
    return notes.filter(n => {
      if (n.archived !== showArchived) return false;
      const matchSearch = !searchQ || n.title.toLowerCase().includes(searchQ.toLowerCase()) || n.content.toLowerCase().includes(searchQ.toLowerCase());
      const matchTag = filterTag === "all" || n.tags.includes(filterTag);
      const matchStar = !filterStarred || n.starred;
      return matchSearch && matchTag && matchStar;
    }).sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      switch (sortBy) {
        case "updated": return b.updatedAt.localeCompare(a.updatedAt);
        case "created": return b.createdAt.localeCompare(a.createdAt);
        case "title": return a.title.localeCompare(b.title);
        case "starred": return a.starred ? -1 : 1;
      }
    });
  }, [notes, searchQ, filterTag, filterStarred, showArchived, sortBy]);

  const createNote = () => {
    const note: Note = { id: `n_${Date.now()}`, title: "", content: "", color: noteColors[Math.floor(Math.random() * noteColors.length)], pinned: false, starred: false, tags: [], createdAt: "2026-03-17", updatedAt: "2026-03-17", archived: false };
    setNotes(prev => [note, ...prev]);
    setEditingNote(note);
  };

  const saveNote = (note: Note) => {
    setNotes(prev => prev.map(n => n.id === note.id ? { ...note, updatedAt: "2026-03-17" } : n));
    setEditingNote(null);
    toast.success("Note saved");
  };

  const togglePin = (id: string) => setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  const toggleStar = (id: string) => setNotes(prev => prev.map(n => n.id === id ? { ...n, starred: !n.starred } : n));
  const archiveNote = (id: string) => { setNotes(prev => prev.map(n => n.id === id ? { ...n, archived: !n.archived } : n)); setCtxMenu(null); toast.success("Note archived"); };
  const deleteNote = (id: string) => { setNotes(prev => prev.filter(n => n.id !== id)); setCtxMenu(null); toast.success("Note deleted"); };
  const duplicateNote = (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    setNotes(prev => [{ ...note, id: `n_${Date.now()}`, title: `${note.title} (Copy)`, pinned: false }, ...prev]);
    setCtxMenu(null);
    toast.success("Note duplicated");
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50 p-6" onClick={() => setCtxMenu(null)}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-md shadow-amber-500/20">
              <StickyNote className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-gray-900 tracking-tight">Notepad</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">{notes.filter(n => !n.archived).length} notes · {notes.filter(n => n.pinned).length} pinned</p>
            </div>
          </div>
          <button onClick={createNote}
            className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-[11px] px-4 py-2 rounded-xl hover:from-cyan-600 hover:to-teal-600 shadow-sm">
            <Plus className="w-3.5 h-3.5" /> New Note
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm notes..."
              className="w-full pl-9 pr-3 py-2 text-[11px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-cyan-300 text-gray-700" />
          </div>
          <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
            className="text-[10px] bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-600 focus:outline-none">
            {allTags.map(t => <option key={t} value={t}>{t === "all" ? "All Tags" : `#${t}`}</option>)}
          </select>
          <button onClick={() => setFilterStarred(!filterStarred)}
            className={`flex items-center gap-1 px-2.5 py-2 text-[10px] rounded-xl border transition-all ${filterStarred ? "border-amber-300 bg-amber-50 text-amber-600" : "border-gray-200 text-gray-500"}`}>
            <Star className="w-3 h-3" /> Starred
          </button>
          <button onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-1 px-2.5 py-2 text-[10px] rounded-xl border transition-all ${showArchived ? "border-gray-400 bg-gray-100 text-gray-700" : "border-gray-200 text-gray-500"}`}>
            <Archive className="w-3 h-3" /> {showArchived ? "Archived" : "Active"}
          </button>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="text-[10px] bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-gray-600 focus:outline-none">
            <option value="updated">Updated</option>
            <option value="created">Created</option>
            <option value="title">Title A→Z</option>
            <option value="starred">Starred first</option>
          </select>
          <div className="flex-1" />
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode("grid")} className={`w-7 h-7 rounded-md flex items-center justify-center ${viewMode === "grid" ? "bg-white shadow-sm text-gray-700" : "text-gray-400"}`}><Grid3X3 className="w-3.5 h-3.5" /></button>
            <button onClick={() => setViewMode("list")} className={`w-7 h-7 rounded-md flex items-center justify-center ${viewMode === "list" ? "bg-white shadow-sm text-gray-700" : "text-gray-400"}`}><List className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {/* GRID VIEW */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(note => (
              <div key={note.id} onClick={() => setEditingNote(note)}
                className="bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-all cursor-pointer shadow-sm group overflow-hidden"
                style={{ backgroundColor: note.color }}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {note.pinned && <Pin className="w-3 h-3 text-amber-500 shrink-0" />}
                      {note.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                      <h3 className="text-[13px] text-gray-800 truncate">{note.title || "Untitled"}</h3>
                    </div>
                    <div className="relative">
                      <button onClick={e => { e.stopPropagation(); setCtxMenu(ctxMenu === note.id ? null : note.id); }}
                        className="w-6 h-6 rounded-lg hover:bg-white/60 flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                      {ctxMenu === note.id && (
                        <div className="absolute right-0 top-full mt-1 w-[140px] bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => { togglePin(note.id); setCtxMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50">{note.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />} {note.pinned ? "Unpin" : "Pin"}</button>
                          <button onClick={() => { toggleStar(note.id); setCtxMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50"><Star className="w-3 h-3" /> {note.starred ? "Unstar" : "Star"}</button>
                          <button onClick={() => duplicateNote(note.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50"><Copy className="w-3 h-3" /> Duplicate</button>
                          <button onClick={() => archiveNote(note.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50"><Archive className="w-3 h-3" /> Archive</button>
                          <div className="h-px bg-gray-100 my-0.5" />
                          <button onClick={() => deleteNote(note.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-500 hover:bg-red-50"><Trash2 className="w-3 h-3" /> Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-600 whitespace-pre-wrap line-clamp-5">{note.content}</p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {note.tags.map(t => <span key={t} className="text-[8px] text-gray-500 bg-white/60 px-1.5 py-0.5 rounded">#{t}</span>)}
                    <span className="text-[8px] text-gray-300">{note.content.split(/\s+/).filter(Boolean).length}w</span>
                    <span className="text-[8px] text-gray-400 ml-auto">{note.updatedAt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LIST VIEW */}
        {viewMode === "list" && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {filtered.map((note, i) => (
              <div key={note.id} onClick={() => setEditingNote(note)}
                className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-all group ${i < filtered.length - 1 ? "border-b border-gray-50" : ""}`}>
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: note.color, border: "1px solid #e5e7eb" }} />
                <div className="flex items-center gap-1.5 shrink-0">
                  {note.pinned && <Pin className="w-2.5 h-2.5 text-amber-500" />}
                  {note.starred && <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-gray-800 truncate">{note.title || "Untitled"}</p>
                  <p className="text-[10px] text-gray-400 truncate">{note.content.split("\n")[0]}</p>
                </div>
                <div className="flex items-center gap-1">
                  {note.tags.slice(0, 2).map(t => <span key={t} className="text-[8px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">#{t}</span>)}
                </div>
                <span className="text-[9px] text-gray-400">{note.updatedAt}</span>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <StickyNote className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-[13px] text-gray-500">{showArchived ? "Không có notes archived" : "Chưa có notes nào"}</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingNote && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditingNote(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()} style={{ backgroundColor: editingNote.color }}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200/50">
              <div className="flex items-center gap-2">
                <button onClick={() => { const n = { ...editingNote, pinned: !editingNote.pinned }; setEditingNote(n); setNotes(prev => prev.map(nn => nn.id === n.id ? n : nn)); }}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${editingNote.pinned ? "text-amber-500 bg-amber-100/50" : "text-gray-400 hover:bg-white/50"}`}>
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { const n = { ...editingNote, starred: !editingNote.starred }; setEditingNote(n); setNotes(prev => prev.map(nn => nn.id === n.id ? n : nn)); }}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${editingNote.starred ? "text-amber-400" : "text-gray-400 hover:bg-white/50"}`}>
                  <Star className={`w-3.5 h-3.5 ${editingNote.starred ? "fill-amber-400" : ""}`} />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-0.5 mr-2">
                  {noteColors.map(c => (
                    <button key={c} onClick={() => { const n = { ...editingNote, color: c }; setEditingNote(n); setNotes(prev => prev.map(nn => nn.id === n.id ? n : nn)); }}
                      className={`w-5 h-5 rounded-md border ${editingNote.color === c ? "border-gray-800 scale-110" : "border-gray-200"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
                <button onClick={() => saveNote(editingNote)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <input value={editingNote.title} onChange={e => setEditingNote({ ...editingNote, title: e.target.value })} placeholder="Title"
                className="w-full text-[16px] text-gray-800 bg-transparent focus:outline-none mb-2" />

              {/* Formatting toolbar */}
              <div className="flex items-center gap-0.5 mb-3 pb-2 border-b border-gray-200/50 overflow-x-auto">
                {[
                  { icon: <Bold className="w-3 h-3" />, label: "Bold", insert: "**text**" },
                  { icon: <Italic className="w-3 h-3" />, label: "Italic", insert: "_text_" },
                  { icon: <Strikethrough className="w-3 h-3" />, label: "Strikethrough", insert: "~~text~~" },
                  { icon: <Code className="w-3 h-3" />, label: "Code", insert: "`code`" },
                  null,
                  { icon: <Heading1 className="w-3 h-3" />, label: "Heading 1", insert: "# " },
                  { icon: <Heading2 className="w-3 h-3" />, label: "Heading 2", insert: "## " },
                  null,
                  { icon: <AlignLeft className="w-3 h-3" />, label: "Bullet List", insert: "- " },
                  { icon: <ListOrdered className="w-3 h-3" />, label: "Numbered List", insert: "1. " },
                  { icon: <ListChecks className="w-3 h-3" />, label: "Checklist", insert: "[ ] " },
                  null,
                  { icon: <Quote className="w-3 h-3" />, label: "Quote", insert: "> " },
                  { icon: <Minus className="w-3 h-3" />, label: "Divider", insert: "\n---\n" },
                  { icon: <Link className="w-3 h-3" />, label: "Link", insert: "[text](url)" },
                ].map((btn, i) => btn === null ? (
                  <div key={`sep-${i}`} className="w-px h-4 bg-gray-200/60 mx-0.5" />
                ) : (
                  <button key={btn.label} title={btn.label}
                    onClick={() => setEditingNote({ ...editingNote, content: editingNote.content + btn.insert })}
                    className="w-6 h-6 rounded-md hover:bg-white/60 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all shrink-0">
                    {btn.icon}
                  </button>
                ))}
              </div>

              <textarea value={editingNote.content} onChange={e => setEditingNote({ ...editingNote, content: e.target.value })} placeholder="Write something..."
                className="w-full text-[12px] text-gray-700 bg-transparent focus:outline-none h-[260px] resize-none leading-relaxed" />
            </div>
            <div className="p-3 border-t border-gray-200/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input value={editingNote.tags.join(", ")} onChange={e => setEditingNote({ ...editingNote, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })} placeholder="Tags (comma separated)"
                  className="text-[10px] text-gray-500 bg-transparent focus:outline-none w-40" />
                <span className="text-[9px] text-gray-300">
                  {editingNote.content.split(/\s+/).filter(Boolean).length} words · {editingNote.content.length} chars · ~{Math.max(1, Math.ceil(editingNote.content.split(/\s+/).filter(Boolean).length / 200))} min read
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { copyToClipboard(editingNote.content).then(() => toast.success("Content copied!")); }}
                  className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</button>
                <button onClick={() => saveNote(editingNote)} className="text-[11px] text-cyan-600 bg-cyan-50 px-3 py-1 rounded-lg hover:bg-cyan-100">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}