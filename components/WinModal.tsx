"use client";

import { useEffect, useState } from "react";
import { Trophy, RefreshCcw, Image as ImageIcon } from "lucide-react";
import { Difficulty } from "@/hooks/usePuzzleState";
import { motion, AnimatePresence } from "framer-motion";

interface WinModalProps {
  isSolved: boolean;
  moves: number;
  time: number;
  difficulty: Difficulty;
  onPlayAgain: () => void;
  onNewImage: () => void;
}

export function WinModal({
  isSolved,
  moves,
  time,
  difficulty,
  onPlayAgain,
  onNewImage,
}: WinModalProps) {
  const [bestMoves, setBestMoves] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  useEffect(() => {
    if (isSolved) {
      const storedBestMoves = localStorage.getItem(`bestMoves_${difficulty}`);
      const storedBestTime = localStorage.getItem(`bestTime_${difficulty}`);

      let newRecord = false;

      if (!storedBestMoves || moves < parseInt(storedBestMoves)) {
        localStorage.setItem(`bestMoves_${difficulty}`, moves.toString());
        setBestMoves(moves);
        newRecord = true;
      } else {
        setBestMoves(parseInt(storedBestMoves));
      }

      if (!storedBestTime || time < parseInt(storedBestTime)) {
        localStorage.setItem(`bestTime_${difficulty}`, time.toString());
        setBestTime(time);
        newRecord = true;
      } else {
        setBestTime(parseInt(storedBestTime));
      }

      setIsNewHighScore(newRecord);
    }
  }, [isSolved, moves, time, difficulty]);

  if (!isSolved) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-full max-w-sm rounded-[2rem] bg-white dark:bg-zinc-900 p-8 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 text-center relative overflow-hidden"
        >
          {isNewHighScore && (
            <div className="absolute top-0 left-0 w-full bg-[#FFE500] text-amber-900 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-sm">
              New High Score!
            </div>
          )}
          
          <div className="mx-auto mt-6 mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFE500]/20">
            <Trophy className="h-10 w-10 text-[#D4B000]" />
          </div>
          
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
            Pawfect!
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 font-medium">
            You solved the {difficulty} puzzle.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 ring-1 ring-zinc-100 dark:ring-zinc-800">
              <p className="text-xs uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500 mb-1">Time</p>
              <p className="text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-50">{time}s</p>
              {bestTime && (
                <p className="text-xs font-semibold text-zinc-400 mt-2">Best: {bestTime}s</p>
              )}
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 ring-1 ring-zinc-100 dark:ring-zinc-800">
              <p className="text-xs uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500 mb-1">Moves</p>
              <p className="text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-50">{moves}</p>
              {bestMoves && (
                <p className="text-xs font-semibold text-zinc-400 mt-2">Best: {bestMoves}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onNewImage}
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-black px-4 py-4 text-sm font-bold tracking-wide text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl dark:bg-white dark:text-black"
            >
              <ImageIcon className="w-5 h-5" />
              Play Next Image
            </button>
            <button
              onClick={onPlayAgain}
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-zinc-100 px-4 py-4 text-sm font-bold tracking-wide text-zinc-900 transition-all hover:scale-[1.02] active:scale-[0.98] hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
            >
              <RefreshCcw className="w-5 h-5" />
              Replay Exact Puzzle
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
