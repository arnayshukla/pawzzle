"use client";

import { useEffect, useState } from "react";
import { usePuzzleState } from "@/hooks/usePuzzleState";
import { PuzzleBoard } from "@/components/PuzzleBoard";
import { HUD } from "@/components/HUD";
import { WinModal } from "@/components/WinModal";
import { Loader2, ImageOff } from "lucide-react";

export default function GamePage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const puzzle = usePuzzleState();

  const fetchNewImage = async () => {
    setLoading(true);
    setError(null);
    puzzle.setIsPlaying(false);
    
    try {
      const res = await fetch("/api/game/image");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch image");
      }
      const data = await res.json();
      setImageUrl(data.url);
      
      // Wait a tick for image to be somewhat ready
      setTimeout(() => {
        puzzle.initPuzzle();
      }, 100);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Watch for difficulty changes to re-init puzzle with same image
  useEffect(() => {
    if (imageUrl) {
      puzzle.initPuzzle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle.difficulty]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex flex-col pt-12 p-4 sm:p-8">
      <h1 className="flex items-center justify-center gap-4 text-center text-4xl font-black tracking-tighter text-zinc-900 dark:text-white mb-8 select-none">
        <img src="/logo.png" alt="Pawzzle Logo" className="w-12 h-12 rounded-xl" />
        Pawzzle.
      </h1>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <Loader2 className="w-10 h-10 animate-spin text-zinc-300 dark:text-zinc-600" />
          <p className="text-zinc-500 font-semibold tracking-wide">Fetching a cute dog...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center dark:bg-red-900/30 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-900/50">
            <ImageOff className="w-10 h-10" />
          </div>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-4">{error}</p>
          <button
            onClick={fetchNewImage}
            className="mt-6 px-8 py-4 bg-black text-white rounded-2xl font-bold tracking-wide dark:bg-white dark:text-black hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center w-full max-w-4xl mx-auto">
          <HUD
            moves={puzzle.moves}
            time={puzzle.time}
            difficulty={puzzle.difficulty}
            setDifficulty={puzzle.setDifficulty}
            onReset={puzzle.initPuzzle}
            onNewImage={fetchNewImage}
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

          <WinModal
            isSolved={puzzle.isSolved}
            moves={puzzle.moves}
            time={puzzle.time}
            difficulty={puzzle.difficulty}
            onPlayAgain={puzzle.initPuzzle}
            onNewImage={fetchNewImage}
          />
        </div>
      )}

      {/* Sponsorship FAB */}
      <a
        href="https://github.com/sponsors/arnayshukla"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-pink-500 text-white shadow-xl hover:scale-110 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 dark:focus:ring-offset-black"
        title="Sponsor the Developer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
      </a>
    </div>
  );
}
