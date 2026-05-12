import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { copyToClipboard } from "./clipboard";
import {
  Lightbulb, Plus, Trash2, Edit3, ZoomIn, ZoomOut, Maximize2,
  ChevronRight, ChevronDown, Palette, Download, X, Check,
  Circle, GitBranch, Eye, Layers, Move, Search, Copy,
  ChevronsDown, ChevronsUp, FileText, MoreHorizontal, Star,
  ArrowUp, ArrowDown, Undo
} from "lucide-react";

interface MindNode {
  id: string;
  text: string;
  color: string;
  children: MindNode[];
  collapsed?: boolean;
}

const initialMap: MindNode = {
  id: "root", text: "Product Roadmap", color: "#0891b2",
  children: [
    {
      id: "n1", text: "Q1 2026", color: "#7c3aed",
      children: [
        { id: "n1a", text: "Chat Module", color: "#059669", children: [
          { id: "n1a1", text: "Real-time messaging", color: "#059669", children: [] },
          { id: "n1a2", text: "File sharing", color: "#059669", children: [] },
          { id: "n1a3", text: "Reactions & threads", color: "#059669", children: [] },
        ]},
        { id: "n1b", text: "Task Management", color: "#d97706", children: [
          { id: "n1b1", text: "Board view", color: "#d97706", children: [] },
          { id: "n1b2", text: "Gantt chart", color: "#d97706", children: [] },
        ]},
        { id: "n1c", text: "Dashboard", color: "#db2777", children: [
          { id: "n1c1", text: "Analytics widgets", color: "#db2777", children: [] },
          { id: "n1c2", text: "Custom charts", color: "#db2777", children: [] },
        ]},
      ]
    },
    {
      id: "n2", text: "Q2 2026", color: "#059669",
      children: [
        { id: "n2a", text: "Automation Engine", color: "#dc2626", children: [
          { id: "n2a1", text: "Trigger system", color: "#dc2626", children: [] },
          { id: "n2a2", text: "Action builder", color: "#dc2626", children: [] },
        ]},
        { id: "n2b", text: "API Platform", color: "#2563eb", children: [
          { id: "n2b1", text: "REST endpoints", color: "#2563eb", children: [] },
          { id: "n2b2", text: "Webhooks", color: "#2563eb", children: [] },
        ]},
      ]
    },
    {
      id: "n3", text: "Q3 2026", color: "#d97706",
      children: [
        { id: "n3a", text: "Mobile App", color: "#7c3aed", children: [] },
        { id: "n3b", text: "AI Assistant", color: "#0891b2", children: [] },
        { id: "n3c", text: "Marketplace", color: "#059669", children: [] },
      ]
    },
  ]
};

const nodeColors = ["#0891b2", "#7c3aed", "#059669", "#dc2626", "#d97706", "#db2777", "#2563eb", "#4f46e5"];

export function MindMapView() {
  const [root, setRoot] = useState<MindNode>(initialMap);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [zoom, setZoom] = useState(100);
  const [showOutline, setShowOutline] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const updateNode = useCallback((nodeId: string, updater: (node: MindNode) => MindNode): void => {
    const traverse = (node: MindNode): MindNode => {
      if (node.id === nodeId) return updater(node);
      return { ...node, children: node.children.map(traverse) };
    };
    setRoot(prev => traverse(prev));
  }, []);

  const findNode = useCallback((nodeId: string, node: MindNode = root): MindNode | null => {
    if (node.id === nodeId) return node;
    for (const child of node.children) {
      const found = findNode(nodeId, child);
      if (found) return found;
    }
    return null;
  }, [root]);

  const addChild = useCallback((parentId: string) => {
    const newNode: MindNode = { id: `n_${Date.now()}`, text: "New Node", color: nodeColors[Math.floor(Math.random() * nodeColors.length)], children: [] };
    updateNode(parentId, node => ({ ...node, children: [...node.children, newNode], collapsed: false }));
    setEditingId(newNode.id);
    setEditText("New Node");
    toast.success("Node added");
  }, [updateNode]);

  const deleteNode = useCallback((nodeId: string) => {
    if (nodeId === "root") return;
    const removeFromParent = (node: MindNode): MindNode => ({
      ...node,
      children: node.children.filter(c => c.id !== nodeId).map(removeFromParent)
    });
    setRoot(prev => removeFromParent(prev));
    setSelectedId(null);
    toast.success("Node deleted");
  }, []);

  const startEdit = (node: MindNode) => {
    setEditingId(node.id);
    setEditText(node.text);
  };

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      updateNode(editingId, node => ({ ...node, text: editText.trim() }));
    }
    setEditingId(null);
  };

  const toggleCollapse = (nodeId: string) => {
    updateNode(nodeId, node => ({ ...node, collapsed: !node.collapsed }));
  };

  const changeColor = (nodeId: string, color: string) => {
    updateNode(nodeId, node => ({ ...node, color }));
  };

  const countNodes = (node: MindNode): number => 1 + node.children.reduce((a, c) => a + countNodes(c), 0);
  const totalNodes = countNodes(root);

  const maxDepth = useCallback((node: MindNode, d = 0): number => {
    if (node.children.length === 0) return d;
    return Math.max(...node.children.map(c => maxDepth(c, d + 1)));
  }, []);

  const collapseAll = () => {
    const traverse = (node: MindNode): MindNode => ({
      ...node, collapsed: node.id !== "root" && node.children.length > 0,
      children: node.children.map(traverse),
    });
    setRoot(prev => traverse(prev));
    toast.success("All nodes collapsed");
  };

  const expandAll = () => {
    const traverse = (node: MindNode): MindNode => ({
      ...node, collapsed: false, children: node.children.map(traverse),
    });
    setRoot(prev => traverse(prev));
    toast.success("All nodes expanded");
  };

  const duplicateNode = useCallback((nodeId: string) => {
    if (nodeId === "root") return;
    const cloneNode = (node: MindNode): MindNode => ({
      ...node, id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      children: node.children.map(cloneNode),
    });
    const findAndDuplicate = (node: MindNode): MindNode => {
      const idx = node.children.findIndex(c => c.id === nodeId);
      if (idx !== -1) {
        const clone = cloneNode(node.children[idx]);
        clone.text = `${clone.text} (Copy)`;
        return { ...node, children: [...node.children.slice(0, idx + 1), clone, ...node.children.slice(idx + 1)] };
      }
      return { ...node, children: node.children.map(findAndDuplicate) };
    };
    setRoot(prev => findAndDuplicate(prev));
    toast.success("Node duplicated");
  }, []);

  const exportToText = () => {
    const lines: string[] = [];
    const toText = (node: MindNode, indent: number) => {
      lines.push(`${"  ".repeat(indent)}${indent > 0 ? "- " : ""}${node.text}`);
      node.children.forEach(c => toText(c, indent + 1));
    };
    toText(root, 0);
    copyToClipboard(lines.join("\n")).then(() => toast.success("Mind map copied as text outline"));
  };

  const moveNode = useCallback((nodeId: string, direction: "up" | "down") => {
    if (nodeId === "root") return;
    const moveInParent = (node: MindNode): MindNode => {
      const idx = node.children.findIndex(c => c.id === nodeId);
      if (idx !== -1) {
        const newIdx = direction === "up" ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= node.children.length) return node;
        const newChildren = [...node.children];
        [newChildren[idx], newChildren[newIdx]] = [newChildren[newIdx], newChildren[idx]];
        return { ...node, children: newChildren };
      }
      return { ...node, children: node.children.map(moveInParent) };
    };
    setRoot(prev => moveInParent(prev));
    toast.success(`Moved ${direction}`);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const results: { id: string; text: string; path: string[] }[] = [];
    const search = (node: MindNode, path: string[]) => {
      if (node.text.toLowerCase().includes(searchQuery.toLowerCase())) {
        results.push({ id: node.id, text: node.text, path });
      }
      node.children.forEach(c => search(c, [...path, node.text]));
    };
    search(root, []);
    return results;
  }, [searchQuery, root]);

  // Render tree node recursively
  const renderNode = (node: MindNode, level: number, isLast: boolean) => {
    const isSelected = selectedId === node.id;
    const isEditing = editingId === node.id;
    const hasChildren = node.children.length > 0;
    const isRoot = level === 0;

    return (
      <div key={node.id} className={`${level > 0 ? "ml-6" : ""}`}>
        <div className="flex items-start gap-1 group relative">
          {/* Connection line */}
          {level > 0 && (
            <div className="absolute -left-6 top-4 w-6 h-px" style={{ backgroundColor: node.color + "60" }} />
          )}

          {/* Collapse toggle */}
          {hasChildren ? (
            <button onClick={() => toggleCollapse(node.id)} className="w-5 h-5 mt-1.5 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0">
              {node.collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          ) : (
            <div className="w-5 mt-1.5 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: node.color }} />
            </div>
          )}

          {/* Node */}
          <div onClick={() => setSelectedId(node.id)} onDoubleClick={() => startEdit(node)}
            className={`flex-1 min-w-0 px-3.5 py-2 rounded-xl border-2 transition-all cursor-pointer mb-1.5 ${isSelected ? "shadow-md" : "hover:shadow-sm"} ${isRoot ? "text-[14px]" : level === 1 ? "text-[12px]" : "text-[11px]"}`}
            style={{
              borderColor: isSelected ? node.color : node.color + "40",
              backgroundColor: isSelected ? node.color + "10" : "white",
            }}>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: node.color }} />
              {isEditing ? (
                <div className="flex items-center gap-1 flex-1">
                  <input value={editText} onChange={e => setEditText(e.target.value)} autoFocus
                    onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }}
                    className="flex-1 bg-transparent focus:outline-none text-gray-800 min-w-0" />
                  <button onClick={saveEdit} className="text-emerald-500"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setEditingId(null)} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <span className="text-gray-800 truncate">{node.text}</span>
              )}
              {hasChildren && !node.collapsed && (
                <span className="text-[8px] text-gray-400 shrink-0">{node.children.length}</span>
              )}
            </div>

            {/* Actions */}
            {isSelected && !isEditing && (
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                <button onClick={e => { e.stopPropagation(); addChild(node.id); }}
                  className="text-[8px] text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 hover:bg-gray-200 flex items-center gap-0.5"><Plus className="w-2.5 h-2.5" /> Add</button>
                <button onClick={e => { e.stopPropagation(); startEdit(node); }}
                  className="text-[8px] text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 hover:bg-gray-200 flex items-center gap-0.5"><Edit3 className="w-2.5 h-2.5" /> Edit</button>
                {node.id !== "root" && (
                  <button onClick={e => { e.stopPropagation(); deleteNode(node.id); }}
                    className="text-[8px] text-red-500 bg-red-50 rounded px-1.5 py-0.5 hover:bg-red-100 flex items-center gap-0.5"><Trash2 className="w-2.5 h-2.5" /> Del</button>
                )}
                {node.id !== "root" && (
                  <>
                    <button onClick={e => { e.stopPropagation(); moveNode(node.id, "up"); }}
                      className="text-[8px] text-gray-500 bg-gray-100 rounded px-1 py-0.5 hover:bg-gray-200"><ArrowUp className="w-2.5 h-2.5" /></button>
                    <button onClick={e => { e.stopPropagation(); moveNode(node.id, "down"); }}
                      className="text-[8px] text-gray-500 bg-gray-100 rounded px-1 py-0.5 hover:bg-gray-200"><ArrowDown className="w-2.5 h-2.5" /></button>
                  </>
                )}
                <div className="flex items-center gap-0.5 ml-1">
                  {nodeColors.slice(0, 6).map(c => (
                    <button key={c} onClick={e => { e.stopPropagation(); changeColor(node.id, c); }}
                      className={`w-3.5 h-3.5 rounded-full border ${node.color === c ? "border-gray-800 scale-125" : "border-white shadow-sm"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && !node.collapsed && (
          <div className={`relative ${level > 0 ? "ml-2.5" : ""}`}>
            {level > 0 && <div className="absolute left-[2px] top-0 bottom-4 w-px" style={{ backgroundColor: node.color + "30" }} />}
            {node.children.map((child, i) => renderNode(child, level + 1, i === node.children.length - 1))}
          </div>
        )}
      </div>
    );
  };

  // Outline view
  const renderOutline = (node: MindNode, level: number) => (
    <div key={node.id}>
      <button onClick={() => setSelectedId(node.id)}
        className={`w-full text-left flex items-center gap-1.5 py-1 px-2 rounded-lg text-[10px] transition-all ${selectedId === node.id ? "bg-cyan-50 text-cyan-700" : "text-gray-600 hover:bg-gray-50"}`}
        style={{ paddingLeft: 8 + level * 16 }}>
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: node.color }} />
        <span className="truncate">{node.text}</span>
        {node.children.length > 0 && <span className="text-[8px] text-gray-400 ml-auto">{node.children.length}</span>}
      </button>
      {!node.collapsed && node.children.map(c => renderOutline(c, level + 1))}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
      {/* Header */}
      <div className="h-12 border-b border-gray-200 px-4 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[12px] text-gray-800">Mind Map</p>
            <p className="text-[9px] text-gray-400">{totalNodes} nodes</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => addChild("root")} className="flex items-center gap-1 text-[10px] text-gray-600 bg-gray-100 rounded-lg px-2.5 py-1.5 hover:bg-gray-200"><Plus className="w-3 h-3" /> Add Node</button>
          <div className="h-5 w-px bg-gray-200 mx-1" />
          <button onClick={() => setShowSearch(!showSearch)} title="Search nodes"
            className={`w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center ${showSearch ? "text-cyan-600" : "text-gray-400"}`}><Search className="w-3.5 h-3.5" /></button>
          <button onClick={expandAll} title="Expand all"
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><ChevronsDown className="w-3.5 h-3.5" /></button>
          <button onClick={collapseAll} title="Collapse all"
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><ChevronsUp className="w-3.5 h-3.5" /></button>
          {selectedId && selectedId !== "root" && (
            <button onClick={() => duplicateNode(selectedId)} title="Duplicate"
              className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><Copy className="w-3.5 h-3.5" /></button>
          )}
          <button onClick={exportToText} title="Export as text"
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><Download className="w-3.5 h-3.5" /></button>
          <div className="h-5 w-px bg-gray-200 mx-1" />
          <button onClick={() => setZoom(Math.max(50, zoom - 25))} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"><ZoomOut className="w-3.5 h-3.5" /></button>
          <span className="text-[10px] text-gray-400 w-8 text-center">{zoom}%</span>
          <button onClick={() => setZoom(Math.min(150, zoom + 25))} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"><ZoomIn className="w-3.5 h-3.5" /></button>
          <div className="h-5 w-px bg-gray-200 mx-1" />
          <button onClick={() => setShowOutline(!showOutline)}
            className={`w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center ${showOutline ? "text-cyan-600" : "text-gray-400"}`}><Layers className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 py-2 bg-white border-b border-gray-200 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search nodes..."
            autoFocus className="flex-1 text-[12px] text-gray-700 focus:outline-none bg-transparent" />
          {searchQuery && <span className="text-[9px] text-gray-400">{searchResults.length} found</span>}
          <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {showSearch && searchResults.length > 0 && (
        <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto">
          {searchResults.slice(0, 8).map(r => (
            <button key={r.id} onClick={() => { setSelectedId(r.id); expandAll(); }}
              className={`text-[9px] px-2 py-1 rounded-lg border whitespace-nowrap transition-all ${selectedId === r.id ? "bg-cyan-50 border-cyan-200 text-cyan-700" : "border-gray-200 text-gray-500 hover:bg-white"}`}>
              {r.text}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Mind map */}
        <div className="flex-1 overflow-auto p-6" onClick={e => { if (e.target === e.currentTarget) setSelectedId(null); }}>
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }} className="min-w-max">
            {renderNode(root, 0, true)}
          </div>
        </div>

        {/* Outline panel */}
        {showOutline && (
          <div className="w-[220px] border-l border-gray-200 bg-white overflow-auto shrink-0">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-600">Outline</span>
              <button onClick={() => setShowOutline(false)} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
            </div>
            <div className="p-1">
              {renderOutline(root, 0)}
            </div>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="h-8 border-t border-gray-200 bg-white px-4 flex items-center gap-4 shrink-0 text-[9px] text-gray-400">
        <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {totalNodes} nodes</span>
        <span>Depth: {maxDepth(root)}</span>
        <span>Branches: {root.children.length}</span>
        <span>Leaf nodes: {(() => { let c = 0; const count = (n: MindNode) => { if (n.children.length === 0) c++; n.children.forEach(count); }; count(root); return c; })()}</span>
        {/* Color distribution */}
        <span className="flex items-center gap-0.5 ml-2">
          {(() => {
            const colorMap = new Map<string, number>();
            const countC = (n: MindNode) => { colorMap.set(n.color, (colorMap.get(n.color) || 0) + 1); n.children.forEach(countC); };
            countC(root);
            return Array.from(colorMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([color, count]) => (
              <div key={color} className="flex items-center gap-0.5" title={`${count} nodes`}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[7px]">{count}</span>
              </div>
            ));
          })()}
        </span>
        {selectedId && (() => {
          const n = findNode(selectedId);
          return n ? <span className="ml-auto text-cyan-600">Selected: {n.text} ({n.children.length} children)</span> : null;
        })()}
      </div>
    </div>
  );
}