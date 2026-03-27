"use client";

import { useEffect, useState } from "react";
import { usePuzzleState } from "@/hooks/usePuzzleState";
import { PuzzleBoard } from "@/components/PuzzleBoard";
import { HUD } from "@/components/HUD";
import { WinModal } from "@/components/WinModal";
import { Loader2, ImageOff, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";

export default function DailyChallengePage() {
  const puzzle = usePuzzleState(true); // isDaily = true
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [seedDate, setSeedDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);

  const fetchDailyImage = async () => {
    setLoading(true);
    setError(null);
    puzzle.setIsPlaying(false);
    
    try {
      const res = await fetch("/api/game/daily");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch daily challenge");
      }
      const data = await res.json();
      setImageUrl(data.url);
      setSeedDate(data.seedDate);
      
      const storageKey = `pawzzle_daily_${data.seedDate}`;
      const existingRecord = localStorage.getItem(storageKey);
      
      if (existingRecord) {
        setHasPlayedToday(true);
        // Load the solved state! (we don't strictly need to reload the whole board since they won, just tell them)
      } else {
        puzzle.initPuzzle();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save state to localstorage when they win!
  useEffect(() => {
    if (puzzle.isSolved && seedDate && !hasPlayedToday) {
      const storageKey = `pawzzle_daily_${seedDate}`;
      localStorage.setItem(storageKey, JSON.stringify({
        solved: true,
        moves: puzzle.moves,
        time: puzzle.time
      }));
      setHasPlayedToday(true);
    }
  }, [puzzle.isSolved, seedDate, puzzle.moves, puzzle.time, hasPlayedToday]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex flex-col pt-8 p-4 sm:p-8">
      <Link href="/" className="fixed top-6 left-6 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors z-50 flex items-center gap-2 font-medium">
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Back</span>
      </Link>

      <h1 className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center text-4xl font-black tracking-tighter text-amber-500 dark:text-amber-400 mb-8 select-none">
        <img src="/logo.png" alt="Pawzzle Logo" className="w-12 h-12 rounded-xl ring-2 ring-amber-400" />
        Daily Canine
      </h1>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <Loader2 className="w-10 h-10 animate-spin text-amber-300 dark:text-amber-600" />
          <p className="text-amber-600 dark:text-amber-500 font-semibold tracking-wide">Fetching today's challenge...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center ring-1 ring-red-200">
            <ImageOff className="w-10 h-10" />
          </div>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-4">{error}</p>
        </div>
      ) : hasPlayedToday && imageUrl && puzzle.order.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center max-w-md mx-auto fade-in">
           <div className="text-5xl">🐾</div>
           <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">You've completed today's challenge!</h2>
           <p className="text-zinc-600 dark:text-zinc-400">Come back tomorrow for a new puzzle. In the meantime, try endless mode!</p>
           <button
              onClick={() => {
                const data = JSON.parse(localStorage.getItem(`pawzzle_daily_${seedDate}`) || "{}");
                const text = `Pawzzle Daily 🐾 ${seedDate}\nLevel: medium\nMoves: ${data.moves || 'N/A'} | Time: ${data.time || 'N/A'}s\nhttps://pawzzle.arnayshukla.com/daily`;
                navigator.clipboard.writeText(text);
                alert("Copied to clipboard!");
              }}
              className="mt-4 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-xl"
            >
              Share Today's Result
            </button>
            <Link href="/" className="mt-2 text-zinc-500 underline font-medium hover:text-black dark:hover:text-white">
              Play Endless Mode
            </Link>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center w-full max-w-4xl mx-auto">
          <HUD
            moves={puzzle.moves}
            time={puzzle.time}
            difficulty={puzzle.difficulty}
            setDifficulty={puzzle.setDifficulty}
            onReset={puzzle.initPuzzle}
            onNewImage={fetchDailyImage}
            isDaily={true}
          />
          
          {imageUrl && puzzle.order.length > 0 && (
            <div className="w-full relative px-2 sm:px-0">
              <PuzzleBoard
                rows={puzzle.rows}
                cols={puzzle.cols}
                order={puzzle.order}
                selectedTileIndex={puzzle.selectedTileIndex}
                handleTileClick={puzzle.handleTileClick}
                imageUrl={imageUrl}
                isSolved={puzzle.isSolved}
              />
            </div>
          )}

          {/* Win Modal */}
          {puzzle.showWinModal && (
            <WinModal
              isSolved={puzzle.isSolved}
              moves={puzzle.moves}
              time={puzzle.time}
              difficulty={puzzle.difficulty}
              imageUrl={imageUrl || ""}
              onPlayAgain={puzzle.initPuzzle}
              onNewImage={fetchDailyImage}
              isDaily={true}
              seedDate={seedDate}
            />
          )}
        </div>
      )}
    </div>
  );
}
