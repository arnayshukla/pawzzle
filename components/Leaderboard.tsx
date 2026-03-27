"use client";

import { useEffect, useState } from "react";
import { Trophy, Loader2, Clock, Hash, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ScoreEntry {
  id: string;
  name: string;
  time: number;
  moves: number;
  timestamp: number;
}

interface LeaderboardProps {
  puzzleId: string;
  onClose: () => void;
}

export function Leaderboard({ puzzleId, onClose }: LeaderboardProps) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await fetch(`/api/leaderboard?puzzleId=${puzzleId}`);
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        const data = await res.json();
        setScores(data.leaderboard || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [puzzleId]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/40 backdrop-blur-md p-4 sm:p-6 overflow-y-auto w-full h-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-md my-auto rounded-[2rem] bg-white dark:bg-zinc-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-500">
              <Trophy className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Leaderboard</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-zinc-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-amber-500" />
              <p className="font-medium">Loading top times...</p>
            </div>
          ) : error ? (
            <div className="py-12 flex flex-col items-center justify-center text-red-500 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/50">
              <AlertCircle className="w-8 h-8 mb-4" />
              <p className="font-medium">{error}</p>
            </div>
          ) : scores.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-400 text-center">
              <Trophy className="w-12 h-12 mb-4 opacity-20" />
              <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-1">No scores yet!</h3>
              <p className="text-sm">Be the first to claim the top spot.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {scores.map((score, index) => (
                <div 
                  key={score.id}
                  className="flex items-center p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full font-black text-sm mr-4 bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate pr-4">
                      {score.name}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm font-mono font-semibold">
                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                      <Clock className="w-4 h-4 text-zinc-400" />
                      {score.time}s
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                      <Hash className="w-4 h-4 text-zinc-400" />
                      {score.moves}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
