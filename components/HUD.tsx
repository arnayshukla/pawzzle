"use client";

import { Difficulty } from "@/hooks/usePuzzleState";
import { Timer, Hash, RefreshCcw } from "lucide-react";

interface HUDProps {
  moves: number;
  time: number;
  difficulty: Difficulty;
  setDifficulty: (diff: Difficulty) => void;
  onReset: () => void;
  onNewImage: () => void;
  isDaily?: boolean;
}

export function HUD({ moves, time, difficulty, setDifficulty, onReset, onNewImage, isDaily }: HUDProps) {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 w-full max-w-2xl mx-auto mb-8 p-4 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
      <div className="flex items-center gap-6 pl-2">
        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
          <Timer className="w-5 h-5" />
          <span className="font-mono text-xl font-semibold tracking-tight">{formatTime(time)}</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
          <Hash className="w-5 h-5" />
          <span className="font-mono text-xl font-semibold tracking-tight">{moves}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isDaily && (
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm font-semibold cursor-pointer ring-1 ring-black/5 dark:ring-white/10 hover:ring-black/20 dark:hover:ring-white/20 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        )}

        {!isDaily && (
          <button
            onClick={onReset}
            className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:scale-105 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white"
            title="Restart Puzzle"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        )}

        {!isDaily && (
          <button
            onClick={onNewImage}
            className="px-5 py-3 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-sm hover:scale-105 active:scale-95 transition-all shadow-md hover:shadow-lg"
          >
            New Image
          </button>
        )}
      </div>
    </div>
  );
}
