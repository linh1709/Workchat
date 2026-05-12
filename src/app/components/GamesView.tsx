import { useState, useCallback, useEffect, useRef } from "react";
import { Gamepad2, Trophy, Star, RotateCcw, ChevronRight, Clock, Zap, Target, Crown, Flame, Award, ArrowLeft } from "lucide-react";

/* ============ GAME DATA ============ */
const gamesList = [
  { id: "2048", name: "2048", emoji: "🧮", color: "#eab308", desc: "Ghép số để đạt 2048", category: "Puzzle", bestScore: 4096 },
  { id: "snake", name: "Snake", emoji: "🐍", color: "#22c55e", desc: "Điều khiển rắn ăn mồi", category: "Arcade", bestScore: 120 },
  { id: "minesweeper", name: "Minesweeper", emoji: "💣", color: "#6366f1", desc: "Dò mìn cổ điển", category: "Puzzle", bestScore: 0 },
  { id: "tictactoe", name: "Tic Tac Toe", emoji: "❌", color: "#0891b2", desc: "Cờ caro 3x3 với Bot AI", category: "Strategy", bestScore: 0 },
  { id: "memory", name: "Memory Cards", emoji: "🃏", color: "#d946ef", desc: "Lật thẻ tìm cặp", category: "Puzzle", bestScore: 0 },
  { id: "flappy", name: "Flappy Bird", emoji: "🐦", color: "#f97316", desc: "Bay qua các cột ống", category: "Arcade", bestScore: 32 },
];

const leaderboard = [
  { name: "Nguyễn Minh", score: 8192, game: "2048", avatar: "#0891b2" },
  { name: "Lê Phúc", score: 240, game: "Snake", avatar: "#059669" },
  { name: "Trần Hương", score: 56, game: "Flappy Bird", avatar: "#7c3aed" },
  { name: "Phạm Lan", score: 4096, game: "2048", avatar: "#d97706" },
  { name: "Hoàng Đức", score: 180, game: "Snake", avatar: "#db2777" },
];

/* ============ 2048 GAME ============ */
type Grid2048 = number[][];

function create2048Grid(): Grid2048 {
  const grid: Grid2048 = Array(4).fill(null).map(() => Array(4).fill(0));
  addRandom(grid);
  addRandom(grid);
  return grid;
}

function addRandom(grid: Grid2048) {
  const empty: [number, number][] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (grid[r][c] === 0) empty.push([r, c]);
  if (empty.length === 0) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function slide(row: number[]): { row: number[]; score: number } {
  let score = 0;
  const filtered = row.filter(v => v !== 0);
  const result: number[] = [];
  for (let i = 0; i < filtered.length; i++) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      result.push(merged);
      score += merged;
      i++;
    } else {
      result.push(filtered[i]);
    }
  }
  while (result.length < 4) result.push(0);
  return { row: result, score };
}

function move2048(grid: Grid2048, dir: "up" | "down" | "left" | "right"): { grid: Grid2048; score: number; moved: boolean } {
  const newGrid = grid.map(r => [...r]);
  let totalScore = 0;
  let moved = false;

  if (dir === "left") {
    for (let r = 0; r < 4; r++) {
      const { row, score } = slide(newGrid[r]);
      if (row.some((v, i) => v !== newGrid[r][i])) moved = true;
      newGrid[r] = row;
      totalScore += score;
    }
  } else if (dir === "right") {
    for (let r = 0; r < 4; r++) {
      const { row, score } = slide([...newGrid[r]].reverse());
      row.reverse();
      if (row.some((v, i) => v !== newGrid[r][i])) moved = true;
      newGrid[r] = row;
      totalScore += score;
    }
  } else if (dir === "up") {
    for (let c = 0; c < 4; c++) {
      const col = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
      const { row, score } = slide(col);
      if (row.some((v, i) => v !== newGrid[i][c])) moved = true;
      for (let r = 0; r < 4; r++) newGrid[r][c] = row[r];
      totalScore += score;
    }
  } else {
    for (let c = 0; c < 4; c++) {
      const col = [newGrid[3][c], newGrid[2][c], newGrid[1][c], newGrid[0][c]];
      const { row, score } = slide(col);
      row.reverse();
      if (row.some((v, i) => v !== newGrid[i][c])) moved = true;
      for (let r = 0; r < 4; r++) newGrid[r][c] = row[r];
      totalScore += score;
    }
  }

  if (moved) addRandom(newGrid);
  return { grid: newGrid, score: totalScore, moved };
}

function isGameOver2048(grid: Grid2048): boolean {
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    if (grid[r][c] === 0) return false;
    if (c < 3 && grid[r][c] === grid[r][c + 1]) return false;
    if (r < 3 && grid[r][c] === grid[r + 1][c]) return false;
  }
  return true;
}

const tileColors: Record<number, { bg: string; text: string }> = {
  0: { bg: "#cdc1b4", text: "transparent" },
  2: { bg: "#eee4da", text: "#776e65" },
  4: { bg: "#ede0c8", text: "#776e65" },
  8: { bg: "#f2b179", text: "#f9f6f2" },
  16: { bg: "#f59563", text: "#f9f6f2" },
  32: { bg: "#f67c5f", text: "#f9f6f2" },
  64: { bg: "#f65e3b", text: "#f9f6f2" },
  128: { bg: "#edcf72", text: "#f9f6f2" },
  256: { bg: "#edcc61", text: "#f9f6f2" },
  512: { bg: "#edc850", text: "#f9f6f2" },
  1024: { bg: "#edc53f", text: "#f9f6f2" },
  2048: { bg: "#edc22e", text: "#f9f6f2" },
};

function Game2048({ onBack }: { onBack: () => void }) {
  const [grid, setGrid] = useState<Grid2048>(create2048Grid);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(4096);
  const [gameOver, setGameOver] = useState(false);

  const handleKey = useCallback((e: KeyboardEvent) => {
    const dirs: Record<string, "up" | "down" | "left" | "right"> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
    const dir = dirs[e.key];
    if (!dir || gameOver) return;
    e.preventDefault();
    setGrid(prev => {
      const result = move2048(prev, dir);
      if (result.moved) {
        setScore(s => { const ns = s + result.score; if (ns > best) setBest(ns); return ns; });
        if (isGameOver2048(result.grid)) setGameOver(true);
        return result.grid;
      }
      return prev;
    });
  }, [gameOver, best]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const restart = () => { setGrid(create2048Grid()); setScore(0); setGameOver(false); };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4 w-full max-w-[360px]">
        <button onClick={onBack} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><ArrowLeft className="w-4 h-4" /></button>
        <h2 className="text-[18px] text-gray-800 flex-1">2048</h2>
        <div className="text-center px-3 py-1 bg-gray-100 rounded-lg"><p className="text-[9px] text-gray-400 uppercase">Score</p><p className="text-[14px] text-gray-800">{score}</p></div>
        <div className="text-center px-3 py-1 bg-amber-50 rounded-lg"><p className="text-[9px] text-amber-400 uppercase">Best</p><p className="text-[14px] text-amber-600">{best}</p></div>
        <button onClick={restart} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><RotateCcw className="w-4 h-4" /></button>
      </div>
      <div className="bg-[#bbada0] rounded-xl p-2.5 relative" style={{ aspectRatio: "1" }}>
        <div className="grid grid-cols-4 gap-2">
          {grid.flat().map((val, i) => {
            const c = tileColors[val] || tileColors[2048];
            return (
              <div key={i} className="w-[72px] h-[72px] rounded-lg flex items-center justify-center transition-all" style={{ backgroundColor: c.bg, color: c.text, fontSize: val > 512 ? 20 : val > 64 ? 24 : 28 }}>
                {val > 0 && val}
              </div>
            );
          })}
        </div>
        {gameOver && (
          <div className="absolute inset-0 bg-white/70 rounded-xl flex flex-col items-center justify-center gap-3" style={{ animation: "fadeInScale 0.3s ease" }}>
            <p className="text-[20px] text-gray-800">Game Over!</p>
            <p className="text-[14px] text-gray-500">Score: {score}</p>
            <button onClick={restart} className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-[13px] transition-all">Chơi lại</button>
          </div>
        )}
      </div>
      <p className="text-[11px] text-gray-400">Dùng phím mũi tên để di chuyển</p>
    </div>
  );
}

/* ============ SNAKE GAME ============ */
function GameSnake({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const gameState = useRef<{ snake: [number, number][]; dir: [number, number]; food: [number, number]; running: boolean; interval: ReturnType<typeof setInterval> | null }>({
    snake: [[10, 10], [10, 11], [10, 12]],
    dir: [0, -1],
    food: [5, 5],
    running: false,
    interval: null,
  });

  const CELL = 16;
  const COLS = 22;
  const ROWS = 22;

  const placeFood = useCallback(() => {
    const s = gameState.current.snake;
    let fx: number, fy: number;
    do {
      fx = Math.floor(Math.random() * COLS);
      fy = Math.floor(Math.random() * ROWS);
    } while (s.some(([x, y]) => x === fx && y === fy));
    gameState.current.food = [fx, fy];
  }, []);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#f0f4f0";
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
    // grid
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, ROWS * CELL); ctx.stroke(); }
    for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(COLS * CELL, y * CELL); ctx.stroke(); }
    // food
    const [fx, fy] = gameState.current.food;
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(fx * CELL + CELL / 2, fy * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    // snake
    const snake = gameState.current.snake;
    snake.forEach(([x, y], i) => {
      ctx.fillStyle = i === 0 ? "#059669" : "#10b981";
      ctx.beginPath();
      ctx.roundRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2, 4);
      ctx.fill();
    });
  }, []);

  const tick = useCallback(() => {
    const gs = gameState.current;
    if (!gs.running) return;
    const head = gs.snake[0];
    const nh: [number, number] = [head[0] + gs.dir[0], head[1] + gs.dir[1]];
    if (nh[0] < 0 || nh[0] >= COLS || nh[1] < 0 || nh[1] >= ROWS || gs.snake.some(([x, y]) => x === nh[0] && y === nh[1])) {
      gs.running = false;
      if (gs.interval) clearInterval(gs.interval);
      setGameOver(true);
      return;
    }
    gs.snake.unshift(nh);
    if (nh[0] === gs.food[0] && nh[1] === gs.food[1]) {
      setScore(s => s + 10);
      placeFood();
    } else {
      gs.snake.pop();
    }
    draw();
  }, [draw, placeFood]);

  const startGame = useCallback(() => {
    const gs = gameState.current;
    gs.snake = [[10, 10], [10, 11], [10, 12]];
    gs.dir = [0, -1];
    gs.running = true;
    placeFood();
    setScore(0);
    setGameOver(false);
    setStarted(true);
    if (gs.interval) clearInterval(gs.interval);
    gs.interval = setInterval(tick, 120);
    draw();
  }, [draw, tick, placeFood]);

  useEffect(() => {
    draw();
    const handler = (e: KeyboardEvent) => {
      const gs = gameState.current;
      if (!gs.running) return;
      const map: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
      const nd = map[e.key];
      if (nd && !(nd[0] === -gs.dir[0] && nd[1] === -gs.dir[1])) {
        e.preventDefault();
        gs.dir = nd;
      }
    };
    window.addEventListener("keydown", handler);
    return () => { window.removeEventListener("keydown", handler); if (gameState.current.interval) clearInterval(gameState.current.interval); };
  }, [draw]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4 w-full max-w-[380px]">
        <button onClick={onBack} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><ArrowLeft className="w-4 h-4" /></button>
        <h2 className="text-[18px] text-gray-800 flex-1">Snake</h2>
        <div className="text-center px-3 py-1 bg-green-50 rounded-lg"><p className="text-[9px] text-green-500 uppercase">Score</p><p className="text-[14px] text-green-700">{score}</p></div>
        <button onClick={startGame} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><RotateCcw className="w-4 h-4" /></button>
      </div>
      <div className="relative rounded-xl overflow-hidden shadow-sm border border-gray-200">
        <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} />
        {!started && !gameOver && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-3">
            <p className="text-[16px] text-gray-700">🐍 Snake</p>
            <button onClick={startGame} className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-[13px] transition-all">Bắt đầu</button>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-3" style={{ animation: "fadeInScale 0.3s ease" }}>
            <p className="text-[20px] text-gray-800">Game Over!</p>
            <p className="text-[14px] text-gray-500">Score: {score}</p>
            <button onClick={startGame} className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-[13px] transition-all">Chơi lại</button>
          </div>
        )}
      </div>
      <p className="text-[11px] text-gray-400">Dùng phím mũi tên để điều khiển</p>
    </div>
  );
}

/* ============ TIC TAC TOE ============ */
function GameTicTacToe({ onBack }: { onBack: () => void }) {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isX, setIsX] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [scores, setScores] = useState({ x: 0, o: 0, draw: 0 });

  const checkWinner = (b: (string | null)[]): string | null => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a, bb, c] of lines) if (b[a] && b[a] === b[bb] && b[a] === b[c]) return b[a];
    return b.every(v => v) ? "draw" : null;
  };

  const botMove = useCallback((b: (string | null)[]) => {
    const empty = b.map((v, i) => v === null ? i : -1).filter(i => i >= 0);
    if (empty.length === 0) return;
    // Simple AI: try to win, then block, then center, then random
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const mark of ["O", "X"]) {
      for (const [a, bb, c] of lines) {
        const vals = [b[a], b[bb], b[c]];
        if (vals.filter(v => v === mark).length === 2 && vals.includes(null)) {
          const idx = [a, bb, c][vals.indexOf(null)];
          return idx;
        }
      }
    }
    if (b[4] === null) return 4;
    return empty[Math.floor(Math.random() * empty.length)];
  }, []);

  const handleClick = (i: number) => {
    if (board[i] || winner || !isX) return;
    const newBoard = [...board];
    newBoard[i] = "X";
    const w = checkWinner(newBoard);
    if (w) {
      setBoard(newBoard);
      setWinner(w);
      if (w === "X") setScores(s => ({ ...s, x: s.x + 1 }));
      else if (w === "draw") setScores(s => ({ ...s, draw: s.draw + 1 }));
      return;
    }
    setBoard(newBoard);
    setIsX(false);
    // Bot turn
    setTimeout(() => {
      const botIdx = botMove(newBoard);
      if (botIdx === undefined) return;
      const nb = [...newBoard];
      nb[botIdx] = "O";
      setBoard(nb);
      const w2 = checkWinner(nb);
      if (w2) {
        setWinner(w2);
        if (w2 === "O") setScores(s => ({ ...s, o: s.o + 1 }));
        else if (w2 === "draw") setScores(s => ({ ...s, draw: s.draw + 1 }));
      } else {
        setIsX(true);
      }
    }, 400);
  };

  const restart = () => { setBoard(Array(9).fill(null)); setIsX(true); setWinner(null); };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-4 w-full max-w-[300px]">
        <button onClick={onBack} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><ArrowLeft className="w-4 h-4" /></button>
        <h2 className="text-[18px] text-gray-800 flex-1">Tic Tac Toe</h2>
        <button onClick={restart} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><RotateCcw className="w-4 h-4" /></button>
      </div>
      <div className="flex gap-4">
        <div className={`px-3 py-1.5 rounded-lg text-center ${isX && !winner ? "bg-cyan-50 ring-2 ring-cyan-200" : "bg-gray-50"}`}><p className="text-[9px] text-gray-400">Bạn (X)</p><p className="text-[16px] text-cyan-600">{scores.x}</p></div>
        <div className="px-3 py-1.5 rounded-lg text-center bg-gray-50"><p className="text-[9px] text-gray-400">Hoà</p><p className="text-[16px] text-gray-500">{scores.draw}</p></div>
        <div className={`px-3 py-1.5 rounded-lg text-center ${!isX && !winner ? "bg-red-50 ring-2 ring-red-200" : "bg-gray-50"}`}><p className="text-[9px] text-gray-400">Bot (O)</p><p className="text-[16px] text-red-500">{scores.o}</p></div>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {board.map((val, i) => (
          <button key={i} onClick={() => handleClick(i)}
            className={`w-[80px] h-[80px] rounded-xl text-[28px] transition-all flex items-center justify-center ${val ? "bg-gray-50" : "bg-white hover:bg-gray-50 cursor-pointer"} border border-gray-200 shadow-sm`}
            style={{ animation: val ? "fadeInScale 0.15s ease" : undefined }}>
            {val === "X" && <span className="text-cyan-500">✕</span>}
            {val === "O" && <span className="text-red-400">○</span>}
          </button>
        ))}
      </div>
      {winner && (
        <div className="text-center" style={{ animation: "fadeInScale 0.2s ease" }}>
          <p className="text-[15px] text-gray-700">{winner === "draw" ? "Hoà!" : winner === "X" ? "Bạn thắng! 🎉" : "Bot thắng! 🤖"}</p>
          <button onClick={restart} className="mt-2 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-[12px] transition-all">Ván mới</button>
        </div>
      )}
    </div>
  );
}

/* ============ MEMORY CARDS ============ */
function GameMemory({ onBack }: { onBack: () => void }) {
  const emojis = ["🎨", "🚀", "🔥", "💎", "🌟", "🎯", "🎪", "🎵"];
  const [cards, setCards] = useState<{ emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [flippedIdx, setFlippedIdx] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);

  const initCards = useCallback(() => {
    const pairs = [...emojis, ...emojis].sort(() => Math.random() - 0.5).map(emoji => ({ emoji, flipped: false, matched: false }));
    setCards(pairs);
    setFlippedIdx([]);
    setMoves(0);
    setMatches(0);
  }, []);

  useEffect(() => { initCards(); }, [initCards]);

  const handleFlip = (i: number) => {
    if (cards[i].flipped || cards[i].matched || flippedIdx.length >= 2) return;
    const newCards = [...cards];
    newCards[i].flipped = true;
    const newFlipped = [...flippedIdx, i];
    setCards(newCards);
    setFlippedIdx(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      if (newCards[newFlipped[0]].emoji === newCards[newFlipped[1]].emoji) {
        setTimeout(() => {
          const nc = [...newCards];
          nc[newFlipped[0]].matched = true;
          nc[newFlipped[1]].matched = true;
          setCards(nc);
          setFlippedIdx([]);
          setMatches(m => m + 1);
        }, 500);
      } else {
        setTimeout(() => {
          const nc = [...newCards];
          nc[newFlipped[0]].flipped = false;
          nc[newFlipped[1]].flipped = false;
          setCards(nc);
          setFlippedIdx([]);
        }, 800);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4 w-full max-w-[340px]">
        <button onClick={onBack} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><ArrowLeft className="w-4 h-4" /></button>
        <h2 className="text-[18px] text-gray-800 flex-1">Memory Cards</h2>
        <div className="text-center px-3 py-1 bg-violet-50 rounded-lg"><p className="text-[9px] text-violet-400 uppercase">Moves</p><p className="text-[14px] text-violet-600">{moves}</p></div>
        <button onClick={initCards} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><RotateCcw className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {cards.map((card, i) => (
          <button key={i} onClick={() => handleFlip(i)}
            className={`w-[72px] h-[72px] rounded-xl text-[24px] transition-all duration-300 flex items-center justify-center border ${card.matched ? "bg-green-50 border-green-200 opacity-70" : card.flipped ? "bg-white border-violet-200 shadow-md" : "bg-gradient-to-br from-violet-500 to-purple-600 border-transparent shadow-sm hover:shadow-md hover:scale-105 cursor-pointer"}`}>
            {(card.flipped || card.matched) ? card.emoji : <span className="text-white text-[16px]">?</span>}
          </button>
        ))}
      </div>
      {matches === emojis.length && (
        <div className="text-center" style={{ animation: "fadeInScale 0.3s ease" }}>
          <p className="text-[16px] text-gray-700">Hoàn thành! 🎉</p>
          <p className="text-[12px] text-gray-400">{moves} lượt lật</p>
          <button onClick={initCards} className="mt-2 px-4 py-1.5 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-[12px] transition-all">Chơi lại</button>
        </div>
      )}
    </div>
  );
}

/* ============ MINESWEEPER ============ */
function GameMinesweeper({ onBack }: { onBack: () => void }) {
  const ROWS = 9, COLS = 9, MINES = 10;
  type Cell = { mine: boolean; revealed: boolean; flagged: boolean; count: number };

  const createBoard = useCallback((): Cell[][] => {
    const board: Cell[][] = Array(ROWS).fill(null).map(() => Array(COLS).fill(null).map(() => ({ mine: false, revealed: false, flagged: false, count: 0 })));
    let placed = 0;
    while (placed < MINES) {
      const r = Math.floor(Math.random() * ROWS), c = Math.floor(Math.random() * COLS);
      if (!board[r][c].mine) { board[r][c].mine = true; placed++; }
    }
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].mine) count++;
      }
      board[r][c].count = count;
    }
    return board;
  }, []);

  const [board, setBoard] = useState<Cell[][]>(createBoard);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const reveal = (b: Cell[][], r: number, c: number) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || b[r][c].revealed || b[r][c].flagged) return;
    b[r][c].revealed = true;
    if (b[r][c].count === 0 && !b[r][c].mine) {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) reveal(b, r + dr, c + dc);
    }
  };

  const handleClick = (r: number, c: number) => {
    if (gameOver || won || board[r][c].flagged || board[r][c].revealed) return;
    const nb = board.map(row => row.map(cell => ({ ...cell })));
    if (nb[r][c].mine) {
      nb.forEach(row => row.forEach(cell => { if (cell.mine) cell.revealed = true; }));
      setBoard(nb);
      setGameOver(true);
      return;
    }
    reveal(nb, r, c);
    setBoard(nb);
    // Check win
    const unrevealed = nb.flat().filter(c => !c.revealed && !c.mine).length;
    if (unrevealed === 0) setWon(true);
  };

  const handleFlag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameOver || won || board[r][c].revealed) return;
    const nb = board.map(row => row.map(cell => ({ ...cell })));
    nb[r][c].flagged = !nb[r][c].flagged;
    setBoard(nb);
  };

  const restart = () => { setBoard(createBoard()); setGameOver(false); setWon(false); };
  const countColors: Record<number, string> = { 1: "#2563eb", 2: "#059669", 3: "#dc2626", 4: "#7c3aed", 5: "#d97706", 6: "#0891b2", 7: "#000", 8: "#6b7280" };
  const flagsLeft = MINES - board.flat().filter(c => c.flagged).length;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4 w-full max-w-[340px]">
        <button onClick={onBack} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><ArrowLeft className="w-4 h-4" /></button>
        <h2 className="text-[18px] text-gray-800 flex-1">Minesweeper</h2>
        <div className="text-center px-3 py-1 bg-indigo-50 rounded-lg"><p className="text-[9px] text-indigo-400 uppercase">Flags</p><p className="text-[14px] text-indigo-600">{flagsLeft}</p></div>
        <button onClick={restart} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><RotateCcw className="w-4 h-4" /></button>
      </div>
      <div className="bg-gray-100 rounded-xl p-1.5 border border-gray-200">
        {board.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => (
              <button key={c} onClick={() => handleClick(r, c)} onContextMenu={e => handleFlag(e, r, c)}
                className={`w-[34px] h-[34px] text-[13px] flex items-center justify-center border border-gray-200/50 transition-all ${cell.revealed ? (cell.mine ? "bg-red-100" : "bg-white") : "bg-gray-200 hover:bg-gray-300 cursor-pointer shadow-sm"}`}>
                {cell.revealed ? (cell.mine ? "💣" : cell.count > 0 ? <span style={{ color: countColors[cell.count] }}>{cell.count}</span> : "") : cell.flagged ? "🚩" : ""}
              </button>
            ))}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-400">Click trái để mở, click phải để cắm cờ</p>
      {(gameOver || won) && (
        <div className="text-center" style={{ animation: "fadeInScale 0.2s ease" }}>
          <p className="text-[15px] text-gray-700">{won ? "Bạn thắng! 🎉" : "Boom! 💥"}</p>
          <button onClick={restart} className="mt-2 px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[12px] transition-all">Chơi lại</button>
        </div>
      )}
    </div>
  );
}

/* ============ MAIN GAMES VIEW ============ */
export function GamesView() {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const handleBack = () => setActiveGame(null);

  if (activeGame === "2048") return <div className="h-full flex items-center justify-center bg-white"><Game2048 onBack={handleBack} /></div>;
  if (activeGame === "snake") return <div className="h-full flex items-center justify-center bg-white"><GameSnake onBack={handleBack} /></div>;
  if (activeGame === "tictactoe") return <div className="h-full flex items-center justify-center bg-white"><GameTicTacToe onBack={handleBack} /></div>;
  if (activeGame === "memory") return <div className="h-full flex items-center justify-center bg-white"><GameMemory onBack={handleBack} /></div>;
  if (activeGame === "minesweeper") return <div className="h-full flex items-center justify-center bg-white"><GameMinesweeper onBack={handleBack} /></div>;
  if (activeGame === "flappy") return (
    <div className="h-full flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-4 w-full max-w-[300px]">
          <button onClick={handleBack} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"><ArrowLeft className="w-4 h-4" /></button>
          <h2 className="text-[18px] text-gray-800 flex-1">Flappy Bird</h2>
        </div>
        <div className="w-[300px] h-[300px] bg-gradient-to-b from-sky-200 to-sky-100 rounded-2xl flex items-center justify-center border border-sky-200">
          <div className="text-center"><p className="text-[40px] mb-2">🐦</p><p className="text-[14px] text-gray-600">Coming soon!</p><p className="text-[11px] text-gray-400 mt-1">Đang phát triển...</p></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full bg-white overflow-y-auto">
      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/20">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[20px] text-gray-800">Games</h1>
            <p className="text-[12px] text-gray-400">Giải trí cùng đồng nghiệp</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { icon: <Gamepad2 className="w-4 h-4 text-violet-500" />, label: "Games", value: gamesList.length, bg: "bg-violet-50" },
            { icon: <Trophy className="w-4 h-4 text-amber-500" />, label: "Top Score", value: "8,192", bg: "bg-amber-50" },
            { icon: <Flame className="w-4 h-4 text-orange-500" />, label: "Streak", value: "5 ngày", bg: "bg-orange-50" },
            { icon: <Clock className="w-4 h-4 text-cyan-500" />, label: "Đã chơi", value: "2.5h", bg: "bg-cyan-50" },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-xl px-3.5 py-3 flex items-center gap-2.5`}>
              <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">{s.icon}</div>
              <div><p className="text-[14px] text-gray-800">{s.value}</p><p className="text-[10px] text-gray-400">{s.label}</p></div>
            </div>
          ))}
        </div>

        {/* Games Grid */}
        <h2 className="text-[13px] text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Zap className="w-3.5 h-3.5" />Tất cả Games</h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {gamesList.map(game => (
            <button key={game.id} onClick={() => setActiveGame(game.id)}
              className="group bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 transition-all text-left">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px]" style={{ backgroundColor: game.color + "15" }}>
                  {game.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-gray-800 group-hover:text-gray-900">{game.name}</p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{game.category}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-gray-400 mb-2">{game.desc}</p>
              {game.bestScore > 0 && (
                <div className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] text-amber-600">Best: {game.bestScore.toLocaleString()}</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        <h2 className="text-[13px] text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Crown className="w-3.5 h-3.5 text-amber-500" />Bảng xếp hạng</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {leaderboard.map((entry, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-all border-b border-gray-100 last:border-b-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] shrink-0 ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-gray-200 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-400"}`}>
                {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] text-white shrink-0" style={{ backgroundColor: entry.avatar }}>{entry.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-gray-800 truncate">{entry.name}</p>
                <p className="text-[10px] text-gray-400">{entry.game}</p>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400" />
                <span className="text-[12px] text-gray-700">{entry.score.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}