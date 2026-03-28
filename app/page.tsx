"use client";

import { useEffect, useState } from "react";
import { usePuzzleState } from "@/hooks/usePuzzleState";
import { PuzzleBoard } from "@/components/PuzzleBoard";
import { HUD } from "@/components/HUD";
import { WinModal } from "@/components/WinModal";
import { Loader2, ImageOff, Calendar, Trophy, Share2 } from "lucide-react";
import Link from "next/link";
import { Leaderboard } from "@/components/Leaderboard";
import { AnimatePresence } from "framer-motion";

export default function GamePage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [shareText, setShareText] = useState("Share Game");
  
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const puzzle = usePuzzleState();

  const fetchNewImage = async (categoryToFetch = selectedCategory) => {
    setLoading(true);
    setError(null);
    puzzle.setIsPlaying(false);
    
    try {
      const url = categoryToFetch === "all" ? "/api/game/image" : `/api/game/image?category=${categoryToFetch}`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch image");
      }
      const data = await res.json();
      setImageUrl(data.url);
      
      puzzle.initPuzzle();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    
    fetchCategories();
    fetchNewImage("all");
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
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex flex-col pt-12 p-4 sm:p-8 pb-24 sm:pb-32">
      <h1 className="flex items-center justify-center gap-4 text-center text-4xl font-black tracking-tighter text-zinc-900 dark:text-white mb-4 select-none">
        <img src="/logo.png" alt="Pawzzle Logo" className="w-12 h-12 rounded-xl ring-2 ring-zinc-900 dark:ring-white" />
        Pawzzle.
      </h1>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 px-4 w-full max-w-3xl mx-auto">
        <Link 
          href="/daily" 
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 font-bold rounded-2xl shadow-md ring-1 ring-amber-400/50 transition-all hover:scale-105 active:scale-95 text-sm sm:text-base w-full sm:w-[210px]"
        >
          <Calendar className="w-5 h-5" />
          Daily Challenge
        </Link>

        <button 
          onClick={() => setShowLeaderboard(true)}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold rounded-2xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700 transition-all hover:scale-105 active:scale-95 text-sm sm:text-base w-full sm:w-[210px]"
        >
          <Trophy className="w-5 h-5 text-amber-500" />
          Leaderboard
        </button>

        <button 
          onClick={() => {
            navigator.clipboard.writeText("Play Pawzzle: a daily sliding puzzle game!\n\nhttps://pawzzle.arnayshukla.com");
            setShareText("Copied!");
            setTimeout(() => setShareText("Share Game"), 2000);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 font-bold rounded-2xl shadow-sm ring-1 ring-blue-200 dark:ring-blue-800 transition-all hover:scale-105 active:scale-95 text-sm sm:text-base w-full sm:w-[210px]"
        >
          <Share2 className="w-5 h-5" />
          {shareText}
        </button>
      </div>

      {categories.length > 0 && (
        <div className="w-full max-w-2xl mx-auto mb-4 sm:mb-8 px-4 overflow-hidden">
          <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button
              onClick={() => {
                setSelectedCategory("all");
                fetchNewImage("all");
              }}
              className={`snap-start whitespace-nowrap px-5 py-2.5 rounded-2xl font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white ${
                selectedCategory === "all"
                  ? "bg-black text-white dark:bg-white dark:text-black shadow-md ring-1 ring-black dark:ring-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              All Images
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  fetchNewImage(cat);
                }}
                className={`snap-start whitespace-nowrap px-5 py-2.5 rounded-2xl font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white capitalize ${
                  selectedCategory === cat
                    ? "bg-black text-white dark:bg-white dark:text-black shadow-md ring-1 ring-black dark:ring-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                {cat.replace(/-/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

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
            onClick={() => fetchNewImage(selectedCategory)}
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
            onNewImage={() => fetchNewImage(selectedCategory)}
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
            onNewImage={() => fetchNewImage(selectedCategory)}
            puzzleId={`endless-${puzzle.difficulty}`}
            onViewLeaderboard={() => setShowLeaderboard(true)}
          />
        )}
        </div>
      )}

      <AnimatePresence>
        {showLeaderboard && (
          <Leaderboard 
            puzzleId={`endless-${puzzle.difficulty}`} 
            onClose={() => setShowLeaderboard(false)} 
          />
        )}
      </AnimatePresence>

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
