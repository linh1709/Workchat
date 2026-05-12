import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  MousePointer, Square, Circle, Type, Minus, Pencil, Eraser,
  Download, Undo2, Redo2, ZoomIn, ZoomOut, Trash2, Move,
  Palette, Layers, Lock, Unlock, Copy, Grid3X3, Image,
  ChevronDown, Plus, X, PenTool, Hand, AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter, Maximize2
} from "lucide-react";

type Tool = "select" | "pan" | "rect" | "circle" | "line" | "pen" | "text" | "eraser" | "sticky";
type ShapeType = "rect" | "circle" | "line" | "pen" | "text" | "sticky";

interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  text?: string;
  points?: { x: number; y: number }[];
  locked: boolean;
  rotation: number;
}

const colors = ["#0891b2", "#7c3aed", "#059669", "#dc2626", "#d97706", "#db2777", "#000000", "#6b7280"];
const stickyColors = ["#fef08a", "#bbf7d0", "#bae6fd", "#fecdd3", "#e9d5ff", "#fed7aa"];

const initialShapes: Shape[] = [
  { id: "s1", type: "rect", x: 80, y: 80, width: 180, height: 120, color: "#eff6ff", strokeColor: "#3b82f6", strokeWidth: 2, locked: false, rotation: 0 },
  { id: "s2", type: "circle", x: 350, y: 100, width: 100, height: 100, color: "#ecfdf5", strokeColor: "#059669", strokeWidth: 2, locked: false, rotation: 0 },
  { id: "s3", type: "sticky", x: 520, y: 60, width: 160, height: 140, color: "#fef08a", strokeColor: "transparent", strokeWidth: 0, text: "User Research\n- Surveys\n- Interviews\n- Personas", locked: false, rotation: 0 },
  { id: "s4", type: "sticky", x: 520, y: 220, width: 160, height: 140, color: "#bbf7d0", strokeColor: "transparent", strokeWidth: 0, text: "Design Sprint\n- Wireframes\n- Prototypes\n- Testing", locked: false, rotation: 0 },
  { id: "s5", type: "text", x: 110, y: 130, width: 120, height: 30, color: "transparent", strokeColor: "transparent", strokeWidth: 0, text: "Main Component", locked: false, rotation: 0 },
  { id: "s6", type: "line", x: 260, y: 140, width: 90, height: 0, color: "transparent", strokeColor: "#6b7280", strokeWidth: 2, locked: false, rotation: 0 },
  { id: "s7", type: "rect", x: 80, y: 260, width: 180, height: 100, color: "#fdf2f8", strokeColor: "#db2777", strokeWidth: 2, locked: false, rotation: 0 },
  { id: "s8", type: "text", x: 110, y: 300, width: 120, height: 30, color: "transparent", strokeColor: "transparent", strokeWidth: 0, text: "Sub Module", locked: false, rotation: 0 },
  { id: "s9", type: "line", x: 170, y: 200, width: 0, height: 60, color: "transparent", strokeColor: "#6b7280", strokeWidth: 2, locked: false, rotation: 0 },
];

export function WhiteboardView() {
  const [shapes, setShapes] = useState<Shape[]>(initialShapes);
  const [tool, setTool] = useState<Tool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentColor, setCurrentColor] = useState("#0891b2");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [penPoints, setPenPoints] = useState<{ x: number; y: number }[]>([]);
  const [history, setHistory] = useState<Shape[][]>([initialShapes]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);

  const pushHistory = useCallback((newShapes: Shape[]) => {
    setHistory(prev => [...prev.slice(0, historyIdx + 1), newShapes]);
    setHistoryIdx(prev => prev + 1);
  }, [historyIdx]);

  const undo = useCallback(() => {
    if (historyIdx > 0) {
      setHistoryIdx(prev => prev - 1);
      setShapes(history[historyIdx - 1]);
    }
  }, [historyIdx, history]);

  const redo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(prev => prev + 1);
      setShapes(history[historyIdx + 1]);
    }
  }, [historyIdx, history]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    const newShapes = shapes.filter(s => s.id !== selectedId);
    setShapes(newShapes);
    pushHistory(newShapes);
    setSelectedId(null);
    toast.success("Shape deleted");
  }, [selectedId, shapes, pushHistory]);

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return;
    const shape = shapes.find(s => s.id === selectedId);
    if (!shape) return;
    const dup = { ...shape, id: `s_${Date.now()}`, x: shape.x + 20, y: shape.y + 20 };
    const newShapes = [...shapes, dup];
    setShapes(newShapes);
    pushHistory(newShapes);
    setSelectedId(dup.id);
    toast.success("Shape duplicated");
  }, [selectedId, shapes, pushHistory]);

  const toggleLock = useCallback(() => {
    if (!selectedId) return;
    const newShapes = shapes.map(s => s.id === selectedId ? { ...s, locked: !s.locked } : s);
    setShapes(newShapes);
    pushHistory(newShapes);
    toast.success(shapes.find(s => s.id === selectedId)?.locked ? "Unlocked" : "Locked");
  }, [selectedId, shapes, pushHistory]);

  const bringToFront = useCallback(() => {
    if (!selectedId) return;
    const shape = shapes.find(s => s.id === selectedId);
    if (!shape) return;
    const newShapes = [...shapes.filter(s => s.id !== selectedId), shape];
    setShapes(newShapes);
    pushHistory(newShapes);
  }, [selectedId, shapes, pushHistory]);

  const sendToBack = useCallback(() => {
    if (!selectedId) return;
    const shape = shapes.find(s => s.id === selectedId);
    if (!shape) return;
    const newShapes = [shape, ...shapes.filter(s => s.id !== selectedId)];
    setShapes(newShapes);
    pushHistory(newShapes);
  }, [selectedId, shapes, pushHistory]);

  const clearAllShapes = useCallback(() => {
    if (shapes.length === 0) return;
    setShapes([]);
    pushHistory([]);
    setSelectedId(null);
    toast.success(`Cleared ${shapes.length} objects`);
  }, [shapes, pushHistory]);

  const fitToScreen = useCallback(() => {
    if (shapes.length === 0) return;
    const minX = Math.min(...shapes.map(s => s.x));
    const minY = Math.min(...shapes.map(s => s.y));
    const maxX = Math.max(...shapes.map(s => s.x + s.width));
    const maxY = Math.max(...shapes.map(s => s.y + s.height));
    const w = maxX - minX;
    const h = maxY - minY;
    const containerW = canvasRef.current?.clientWidth || 800;
    const containerH = canvasRef.current?.clientHeight || 600;
    const scale = Math.min(containerW / (w + 100), containerH / (h + 100), 2);
    setZoom(Math.round(scale * 100));
    setPanOffset({ x: -minX * scale + 50, y: -minY * scale + 50 });
    toast.success("Fit to screen");
  }, [shapes]);

  const handleDoubleClick = useCallback((shape: Shape) => {
    if (shape.type === "text" || shape.type === "sticky") {
      setEditingTextId(shape.id);
      setEditingTextValue(shape.text || "");
    }
  }, []);

  const saveTextEdit = useCallback(() => {
    if (!editingTextId) return;
    const newShapes = shapes.map(s => s.id === editingTextId ? { ...s, text: editingTextValue } : s);
    setShapes(newShapes);
    pushHistory(newShapes);
    setEditingTextId(null);
  }, [editingTextId, editingTextValue, shapes, pushHistory]);

  const getCanvasPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (e.clientX - rect.left - panOffset.x) / (zoom / 100), y: (e.clientY - rect.top - panOffset.y) / (zoom / 100) };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e);

    if (tool === "pan") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    if (tool === "select") {
      // Check if clicking on a shape
      const clicked = [...shapes].reverse().find(s => {
        return pos.x >= s.x && pos.x <= s.x + s.width && pos.y >= s.y && pos.y <= s.y + s.height;
      });
      if (clicked) {
        setSelectedId(clicked.id);
        setDragOffset({ x: pos.x - clicked.x, y: pos.y - clicked.y });
      } else {
        setSelectedId(null);
      }
      return;
    }

    if (tool === "pen") {
      setIsDrawing(true);
      setPenPoints([pos]);
      return;
    }

    if (["rect", "circle", "line", "text", "sticky"].includes(tool)) {
      setIsDrawing(true);
      setDrawStart(pos);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    const pos = getCanvasPos(e);

    if (tool === "select" && dragOffset && selectedId) {
      setShapes(prev => prev.map(s => s.id === selectedId ? { ...s, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y } : s));
      return;
    }

    if (isDrawing && tool === "pen") {
      setPenPoints(prev => [...prev, pos]);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (isPanning) { setIsPanning(false); return; }
    if (dragOffset) { setDragOffset(null); pushHistory(shapes); return; }

    if (!isDrawing) return;
    setIsDrawing(false);
    const pos = getCanvasPos(e);

    if (tool === "pen" && penPoints.length > 1) {
      const minX = Math.min(...penPoints.map(p => p.x));
      const minY = Math.min(...penPoints.map(p => p.y));
      const maxX = Math.max(...penPoints.map(p => p.x));
      const maxY = Math.max(...penPoints.map(p => p.y));
      const newShape: Shape = {
        id: `s_${Date.now()}`, type: "pen", x: minX, y: minY, width: maxX - minX, height: maxY - minY,
        color: "transparent", strokeColor: currentColor, strokeWidth, points: penPoints, locked: false, rotation: 0,
      };
      const newShapes = [...shapes, newShape];
      setShapes(newShapes);
      pushHistory(newShapes);
      setPenPoints([]);
      return;
    }

    if (drawStart) {
      const x = Math.min(drawStart.x, pos.x);
      const y = Math.min(drawStart.y, pos.y);
      const w = Math.max(30, Math.abs(pos.x - drawStart.x));
      const h = Math.max(30, Math.abs(pos.y - drawStart.y));
      const shapeType = tool as ShapeType;

      const newShape: Shape = {
        id: `s_${Date.now()}`, type: shapeType, x, y, width: w, height: shapeType === "line" ? 0 : h,
        color: shapeType === "sticky" ? stickyColors[Math.floor(Math.random() * stickyColors.length)] : shapeType === "text" ? "transparent" : currentColor + "20",
        strokeColor: shapeType === "sticky" || shapeType === "text" ? "transparent" : currentColor,
        strokeWidth, text: shapeType === "text" ? "Double-click to edit" : shapeType === "sticky" ? "Note" : undefined,
        locked: false, rotation: 0,
      };
      const newShapes = [...shapes, newShape];
      setShapes(newShapes);
      pushHistory(newShapes);
      setDrawStart(null);
      setSelectedId(newShape.id);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") deleteSelected();
      if (e.key === "d" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); duplicateSelected(); }
      if (e.key === "z" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); undo(); }
      if (e.key === "z" && (e.metaKey || e.ctrlKey) && e.shiftKey) { e.preventDefault(); redo(); }
      if (e.key === "v") setTool("select");
      if (e.key === "h") setTool("pan");
      if (e.key === "r") setTool("rect");
      if (e.key === "o") setTool("circle");
      if (e.key === "l") setTool("line");
      if (e.key === "p") setTool("pen");
      if (e.key === "t") setTool("text");
      if (e.key === "n") setTool("sticky");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [deleteSelected, duplicateSelected, undo, redo]);

  const selectedShape = shapes.find(s => s.id === selectedId);

  const tools: { id: Tool; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { id: "select", icon: <MousePointer className="w-4 h-4" />, label: "Select", shortcut: "V" },
    { id: "pan", icon: <Hand className="w-4 h-4" />, label: "Pan", shortcut: "H" },
    { id: "rect", icon: <Square className="w-4 h-4" />, label: "Rectangle", shortcut: "R" },
    { id: "circle", icon: <Circle className="w-4 h-4" />, label: "Circle", shortcut: "O" },
    { id: "line", icon: <Minus className="w-4 h-4" />, label: "Line", shortcut: "L" },
    { id: "pen", icon: <Pencil className="w-4 h-4" />, label: "Pen", shortcut: "P" },
    { id: "text", icon: <Type className="w-4 h-4" />, label: "Text", shortcut: "T" },
    { id: "sticky", icon: <Square className="w-4 h-4 fill-yellow-200 text-yellow-400" />, label: "Sticky Note", shortcut: "N" },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Top toolbar */}
      <div className="h-12 border-b border-gray-200 px-4 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <PenTool className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[12px] text-gray-800">Whiteboard</p>
              <p className="text-[9px] text-gray-400">{shapes.length} objects</p>
            </div>
          </div>
        </div>

        {/* Tool buttons */}
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-1">
          {tools.map(t => (
            <button key={t.id} onClick={() => setTool(t.id)} title={`${t.label} (${t.shortcut})`}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${tool === t.id ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
              {t.icon}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <button onClick={() => setShowColorPicker(!showColorPicker)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <div className="w-4 h-4 rounded border border-gray-200" style={{ backgroundColor: currentColor }} />
          </button>
          <div className="h-5 w-px bg-gray-200 mx-1" />
          <button onClick={undo} disabled={historyIdx <= 0} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-30"><Undo2 className="w-4 h-4" /></button>
          <button onClick={redo} disabled={historyIdx >= history.length - 1} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-30"><Redo2 className="w-4 h-4" /></button>
          <div className="h-5 w-px bg-gray-200 mx-1" />
          <button onClick={() => setZoom(Math.max(25, zoom - 25))} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"><ZoomOut className="w-4 h-4" /></button>
          <span className="text-[10px] text-gray-500 w-10 text-center">{zoom}%</span>
          <button onClick={() => setZoom(Math.min(200, zoom + 25))} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"><ZoomIn className="w-4 h-4" /></button>
          <div className="h-5 w-px bg-gray-200 mx-1" />
          <button onClick={() => setShowGrid(!showGrid)} className={`w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center ${showGrid ? "text-cyan-600" : "text-gray-400"}`}><Grid3X3 className="w-4 h-4" /></button>
          <button onClick={() => setShowLayers(!showLayers)} className={`w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center ${showLayers ? "text-cyan-600" : "text-gray-400"}`}><Layers className="w-4 h-4" /></button>
          <button onClick={fitToScreen} title="Fit to screen" className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><Maximize2 className="w-4 h-4" /></button>
          <button onClick={clearAllShapes} title="Clear all" className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div ref={canvasRef}
          className={`flex-1 overflow-hidden relative ${tool === "pan" ? "cursor-grab" : tool === "select" ? "cursor-default" : "cursor-crosshair"} ${isPanning ? "cursor-grabbing" : ""}`}
          style={{ background: showGrid ? "radial-gradient(circle, #e5e7eb 1px, transparent 1px)" : "#fafafa", backgroundSize: showGrid ? "20px 20px" : undefined }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
        >
          <div style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100})`, transformOrigin: "0 0" }}>
            {/* Pen drawing preview */}
            {isDrawing && tool === "pen" && penPoints.length > 1 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: "visible" }}>
                <polyline points={penPoints.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke={currentColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}

            {/* Shapes */}
            {shapes.map(shape => {
              const isSelected = shape.id === selectedId;
              const isEditing = editingTextId === shape.id;
              return (
                <div key={shape.id} className="absolute" style={{ left: shape.x, top: shape.y, width: shape.width, height: shape.height || 2 }}
                  onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(shape); }}>
                  {shape.type === "rect" && (
                    <div className={`w-full h-full rounded-lg ${isSelected ? "ring-2 ring-cyan-500 ring-offset-1" : ""}`}
                      style={{ backgroundColor: shape.color, border: `${shape.strokeWidth}px solid ${shape.strokeColor}` }} />
                  )}
                  {shape.type === "circle" && (
                    <div className={`w-full h-full rounded-full ${isSelected ? "ring-2 ring-cyan-500 ring-offset-1" : ""}`}
                      style={{ backgroundColor: shape.color, border: `${shape.strokeWidth}px solid ${shape.strokeColor}` }} />
                  )}
                  {shape.type === "line" && (
                    <div className={`${isSelected ? "ring-2 ring-cyan-500 ring-offset-1" : ""}`}
                      style={{ width: shape.width || 2, height: shape.height || 2, backgroundColor: shape.strokeColor, minHeight: shape.strokeWidth, minWidth: shape.strokeWidth }} />
                  )}
                  {shape.type === "sticky" && (
                    <div className={`w-full h-full rounded-lg shadow-md p-3 ${isSelected ? "ring-2 ring-cyan-500 ring-offset-1" : ""}`}
                      style={{ backgroundColor: shape.color }}>
                      {isEditing ? (
                        <textarea value={editingTextValue} onChange={e => setEditingTextValue(e.target.value)} autoFocus
                          onBlur={saveTextEdit} onKeyDown={e => { if (e.key === "Escape") saveTextEdit(); }}
                          className="w-full h-full text-[11px] text-gray-700 bg-transparent resize-none focus:outline-none" />
                      ) : (
                        <p className="text-[11px] text-gray-700 whitespace-pre-wrap">{shape.text}</p>
                      )}
                    </div>
                  )}
                  {shape.type === "text" && (
                    <div className={`${isSelected ? "ring-2 ring-cyan-500 ring-offset-1 rounded" : ""}`}>
                      {isEditing ? (
                        <input value={editingTextValue} onChange={e => setEditingTextValue(e.target.value)} autoFocus
                          onBlur={saveTextEdit} onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") saveTextEdit(); }}
                          className="text-[13px] text-gray-700 bg-transparent focus:outline-none border-b border-cyan-400 min-w-[80px]" />
                      ) : (
                        <p className="text-[13px] text-gray-700 whitespace-nowrap">{shape.text}</p>
                      )}
                    </div>
                  )}
                  {shape.type === "pen" && shape.points && (
                    <svg className="absolute inset-0 overflow-visible pointer-events-none" style={{ left: -shape.x, top: -shape.y }}>
                      <polyline points={shape.points.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke={shape.strokeColor} strokeWidth={shape.strokeWidth} strokeLinecap="round" strokeLinejoin="round"
                        className={isSelected ? "filter drop-shadow(0 0 2px #06b6d4)" : ""} />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>

          {/* Color picker */}
          {showColorPicker && (
            <div className="absolute top-2 right-2 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-50">
              <p className="text-[10px] text-gray-500 mb-2">Color</p>
              <div className="grid grid-cols-4 gap-1.5">
                {colors.map(c => (
                  <button key={c} onClick={() => { setCurrentColor(c); setShowColorPicker(false); }}
                    className={`w-7 h-7 rounded-lg border-2 transition-all ${currentColor === c ? "border-gray-800 scale-110" : "border-white shadow-sm hover:scale-105"}`} style={{ backgroundColor: c }} />
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mb-1.5 mt-2">Stroke</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 5].map(w => (
                  <button key={w} onClick={() => setStrokeWidth(w)}
                    className={`flex-1 py-1 text-[9px] rounded transition-all ${strokeWidth === w ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500"}`}>{w}px</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Layers panel */}
        {showLayers && (
          <div className="w-[220px] border-l border-gray-200 bg-white overflow-auto shrink-0">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-600 flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Layers</span>
              <button onClick={() => setShowLayers(false)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
            </div>
            <div className="p-1">
              {[...shapes].reverse().map(shape => (
                <button key={shape.id} onClick={() => setSelectedId(shape.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-[10px] rounded-lg transition-all ${selectedId === shape.id ? "bg-cyan-50 text-cyan-700" : "text-gray-600 hover:bg-gray-50"}`}>
                  <div className="w-4 h-4 rounded border border-gray-200 flex items-center justify-center" style={{ backgroundColor: shape.color || shape.strokeColor }}>
                    {shape.type === "text" && <Type className="w-2.5 h-2.5 text-gray-500" />}
                  </div>
                  <span className="flex-1 text-left truncate">{shape.text || `${shape.type} ${shape.id.slice(-2)}`}</span>
                  {shape.locked && <Lock className="w-2.5 h-2.5 text-gray-400" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected shape props */}
        {selectedShape && !showLayers && (
          <div className="w-[200px] border-l border-gray-200 bg-white p-3 shrink-0 overflow-auto">
            <p className="text-[10px] text-gray-400 mb-2">Properties</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><span className="text-[10px] text-gray-500">Type</span><span className="text-[10px] text-gray-700 capitalize">{selectedShape.type}</span></div>
              <div className="flex items-center justify-between"><span className="text-[10px] text-gray-500">X</span><span className="text-[10px] text-gray-700">{Math.round(selectedShape.x)}</span></div>
              <div className="flex items-center justify-between"><span className="text-[10px] text-gray-500">Y</span><span className="text-[10px] text-gray-700">{Math.round(selectedShape.y)}</span></div>
              <div className="flex items-center justify-between"><span className="text-[10px] text-gray-500">W</span><span className="text-[10px] text-gray-700">{Math.round(selectedShape.width)}</span></div>
              <div className="flex items-center justify-between"><span className="text-[10px] text-gray-500">H</span><span className="text-[10px] text-gray-700">{Math.round(selectedShape.height)}</span></div>
              <div className="h-px bg-gray-100 my-1" />
              <div className="flex gap-1">
                <button onClick={duplicateSelected} className="flex-1 text-[9px] text-gray-600 bg-gray-100 rounded-lg py-1.5 hover:bg-gray-200 flex items-center justify-center gap-1"><Copy className="w-3 h-3" /> Copy</button>
                <button onClick={deleteSelected} className="flex-1 text-[9px] text-red-500 bg-red-50 rounded-lg py-1.5 hover:bg-red-100 flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" /> Del</button>
              </div>
              <div className="flex gap-1">
                <button onClick={toggleLock} className="flex-1 text-[9px] text-gray-600 bg-gray-100 rounded-lg py-1.5 hover:bg-gray-200 flex items-center justify-center gap-1">
                  {selectedShape.locked ? <><Unlock className="w-3 h-3" /> Unlock</> : <><Lock className="w-3 h-3" /> Lock</>}
                </button>
              </div>
              <div className="h-px bg-gray-100 my-1" />
              <p className="text-[9px] text-gray-400">Layer Order</p>
              <div className="flex gap-1">
                <button onClick={bringToFront} className="flex-1 text-[9px] text-gray-600 bg-gray-100 rounded-lg py-1.5 hover:bg-gray-200 flex items-center justify-center gap-0.5">↑ Front</button>
                <button onClick={sendToBack} className="flex-1 text-[9px] text-gray-600 bg-gray-100 rounded-lg py-1.5 hover:bg-gray-200 flex items-center justify-center gap-0.5">↓ Back</button>
              </div>
              {(selectedShape.type === "text" || selectedShape.type === "sticky") && (
                <>
                  <div className="h-px bg-gray-100 my-1" />
                  <button onClick={() => handleDoubleClick(selectedShape)}
                    className="w-full text-[9px] text-cyan-600 bg-cyan-50 rounded-lg py-1.5 hover:bg-cyan-100 flex items-center justify-center gap-1"><Type className="w-3 h-3" /> Edit Text</button>
                </>
              )}
              {selectedShape.type === "sticky" && (
                <>
                  <p className="text-[9px] text-gray-400 mt-1">Sticky Color</p>
                  <div className="flex gap-1">
                    {stickyColors.map(c => (
                      <button key={c} onClick={() => {
                        const ns = shapes.map(s => s.id === selectedId ? { ...s, color: c } : s);
                        setShapes(ns); pushHistory(ns);
                      }} className={`w-5 h-5 rounded border ${selectedShape.color === c ? "border-gray-600 scale-110" : "border-gray-200"}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}