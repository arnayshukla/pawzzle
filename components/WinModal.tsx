"use client";

import { useEffect, useState } from "react";
import { Trophy, RefreshCcw, Image as ImageIcon, ZoomIn, X } from "lucide-react";
import confetti from "canvas-confetti";
import { Difficulty } from "@/hooks/usePuzzleState";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface WinModalProps {
  isSolved: boolean;
  moves: number;
  time: number;
  difficulty: Difficulty;
  imageUrl: string;
  onPlayAgain: () => void;
  onNewImage: () => void;
  isDaily?: boolean;
  seedDate?: string;
  puzzleId: string;
}

export function WinModal({
  isSolved,
  moves,
  time,
  difficulty,
  imageUrl,
  onPlayAgain,
  onNewImage,
  isDaily,
  seedDate,
  puzzleId,
}: WinModalProps) {
  const [enlarged, setEnlarged] = useState(false);
  const [bestMoves, setBestMoves] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Leaderboard State
  const [playerName, setPlayerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleDailyShare = () => {
    const text = `Pawzzle Daily 🐾 ${seedDate}\nLevel: ${difficulty}\nMoves: ${moves} | Time: ${time}s\nhttps://pawzzle.arnayshukla.com/daily`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitScore = async () => {
    if (!playerName.trim()) return;
    setIsSubmitting(true);
    setSubmitError("");
    
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playerName,
          time,
          moves,
          puzzleId
        })
      });
      
      if (!res.ok) throw new Error("Failed to submit score");
      setHasSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || "Could not submit score");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isSolved) {
      // Fire confetti when modal opens
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
      });

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
      <div className="fixed inset-0 z-[100] flex items-center items-stretch sm:items-center justify-center bg-zinc-950/40 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="w-full max-w-sm my-auto rounded-[2rem] bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 text-center relative overflow-hidden"
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
          <p className="text-zinc-500 dark:text-zinc-400 mb-6 font-medium">
            You solved the {difficulty} puzzle.
          </p>

          <div
            className="w-full h-32 sm:h-40 rounded-xl overflow-hidden mb-6 cursor-zoom-in ring-1 ring-black/10 dark:ring-white/10 group relative bg-zinc-100 dark:bg-zinc-800 flex-shrink-0"
            onClick={() => setEnlarged(true)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Solved puzzle" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors duration-300">
               <ZoomIn className="text-white opacity-0 group-hover:opacity-100 drop-shadow-lg w-8 h-8 transition-opacity duration-300 scale-75 group-hover:scale-100" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 sm:mb-8">
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

          {/* Leaderboard Submission Block */}
          {!hasSubmitted ? (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 text-left">
              <label htmlFor="playerName" className="block text-xs uppercase tracking-wider font-bold text-amber-700 dark:text-amber-500 mb-2">
                Submit to Leaderboard
              </label>
              <div className="flex gap-2">
                <input
                  id="playerName"
                  type="text"
                  placeholder="Enter your name..."
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                  className="flex-1 min-w-0 w-full bg-white dark:bg-zinc-800 rounded-xl px-4 py-2 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                  onKeyDown={(e) => e.key === 'Enter' && submitScore()}
                />
                <button
                  onClick={submitScore}
                  disabled={!playerName.trim() || isSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shrink-0"
                >
                  {isSubmitting ? "..." : "Save"}
                </button>
              </div>
              {submitError && <p className="text-red-500 text-xs mt-2 font-medium">{submitError}</p>}
            </div>
          ) : (
             <div className="mb-6 p-4 rounded-2xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-500 font-bold text-sm text-center">
               Score successfully submitted!
             </div>
          )}

          <div className="flex flex-col gap-3">
            {isDaily ? (
              <>
                <button
                  onClick={handleDailyShare}
                  className="flex items-center justify-center gap-2 w-full rounded-2xl bg-blue-600 px-4 py-4 text-sm font-bold tracking-wide text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl hover:bg-blue-700"
                >
                  {copied ? "Copied to Clipboard!" : "Share Daily Result"}
                </button>
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 w-full rounded-2xl bg-zinc-100 px-4 py-4 text-sm font-bold tracking-wide text-zinc-900 transition-all hover:scale-[1.02] active:scale-[0.98] hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
                >
                  Play Endless Mode
                </Link>
              </>
            ) : (
              <>
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
                  Back to Game
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Enlarged Image Overlay */}
        <AnimatePresence>
          {enlarged && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 p-2 sm:p-8 cursor-zoom-out"
              onClick={() => setEnlarged(false)}
            >
              <button 
                className="absolute top-4 right-4 sm:top-8 sm:right-8 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white backdrop-blur-sm transition-colors"
                onClick={(e) => { e.stopPropagation(); setEnlarged(false); }}
              >
                <X className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={imageUrl} 
                alt="Enlarged solved puzzle" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}
