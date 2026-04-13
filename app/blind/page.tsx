"use client";

import { useEffect, useState } from "react";
import { usePuzzleState } from "@/hooks/usePuzzleState";
import { PuzzleBoard } from "@/components/PuzzleBoard";
import { HUD } from "@/components/HUD";
import { WinModal } from "@/components/WinModal";
import { Loader2, ImageOff, Calendar, Trophy, Share2, Check } from "lucide-react";
import Link from "next/link";
import { Leaderboard } from "@/components/Leaderboard";
import { AnimatePresence } from "framer-motion";
import { PushSubscriber } from "@/components/PushSubscriber";
import { CustomPackCreator } from "@/components/CustomPackCreator";
import { EyeOff, X, Camera } from "lucide-react";
export default function BlindGamePage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [shareText, setShareText] = useState("Share Game");
  
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCustomPackModal, setShowCustomPackModal] = useState(false);
  
  // Challenge Mechanics
  const [challengeTime, setChallengeTime] = useState<number | undefined>();
  const [challengerName, setChallengerName] = useState<string | undefined>();
  
  const puzzle = usePuzzleState();

  const clearChallengeState = () => {
    if (challengeTime !== undefined) {
      setChallengeTime(undefined);
      setChallengerName(undefined);
      const url = new URL(window.location.href);
      url.searchParams.delete("challengeTime");
      url.searchParams.delete("challenger");
      url.searchParams.delete("key");
      url.searchParams.delete("diff");
      window.history.replaceState({}, '', url.toString());
    }
  };

  const fetchNewImage = async (categoryToFetch = selectedCategory) => {
    setLoading(true);
    setError(null);
    puzzle.setIsPlaying(false);
    clearChallengeState();
    
    try {
      // Round Robin Queue Logic
      let queueStr = sessionStorage.getItem(`pawzzle_queue_${categoryToFetch}`);
      let queue: string[] = queueStr ? JSON.parse(queueStr) : [];
      
      if (queue.length === 0) {
        // Fetch fresh list of all keys
        const listUrl = categoryToFetch === "all" ? "/api/game/image/list" : `/api/game/image/list?category=${categoryToFetch}`;
        const listRes = await fetch(listUrl);
        if (!listRes.ok) throw new Error("Failed to fetch image list");
        const listData = await listRes.json();
        
        queue = listData.keys;
        // Fisher-Yates Shuffle
        for (let i = queue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [queue[i], queue[j]] = [queue[j], queue[i]];
        }
      }
      
      const nextKey = queue.pop();
      sessionStorage.setItem(`pawzzle_queue_${categoryToFetch}`, JSON.stringify(queue));
      
      if (!nextKey) throw new Error("No images available");

      // Secure payload using proxy
      const res = await fetch(`/api/game/image?key=${encodeURIComponent(nextKey)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch image");
      }
      const data = await res.json();
      
      if (data.key) setImageKey(data.key);
      
      const img = new Image();
      img.src = data.url;
      img.onload = () => {
        setImageUrl(data.url);
        puzzle.initPuzzle();
        setLoading(false);
      };
      img.onerror = () => {
        setError("Failed to load image");
        setLoading(false);
      };
    } catch (err: any) {
      setError(err.message);
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
    
    // Check for Endless Challenge params
    const params = new URLSearchParams(window.location.search);
    const ct = params.get("challengeTime");
    const cn = params.get("challenger");
    const imgKeyParam = params.get("key");

    const diff = params.get("diff");

    if (ct && !isNaN(parseInt(ct))) setChallengeTime(parseInt(ct));
    if (cn) setChallengerName(cn);

    if (diff && ["easy", "medium", "hard"].includes(diff)) {
      puzzle.setDifficulty(diff as any);
    }

    if (imgKeyParam) {
      setImageKey(imgKeyParam);
      // Quickly fetch its dedicated signed URL
      fetch(`/api/game/image?key=${encodeURIComponent(imgKeyParam)}`)
        .then(res => res.json())
        .then(data => {
            if (data.url) {
              const img = new Image();
              img.src = data.url;
              img.onload = () => {
                setImageUrl(data.url);
                puzzle.initPuzzle();
                setLoading(false);
              };
              img.onerror = () => fetchNewImage("all");
            } else {
              fetchNewImage("all");
            }
        })
        .catch(() => fetchNewImage("all")); // Fallback if key deleted
    } else {
      fetchNewImage("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Watch for difficulty changes to re-init puzzle with same image
  useEffect(() => {
    if (imageUrl) {
      puzzle.initPuzzle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle.difficulty]);

  useEffect(() => {
    // Force blind mode natively
    puzzle.setIsBlindMode(true);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex flex-col pt-12 p-4 sm:p-8 pb-24 sm:pb-32">
      <header className="flex items-center justify-between w-full max-w-2xl mx-auto mb-8 px-4">
        <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-black tracking-tighter text-zinc-900 dark:text-white select-none">
          <img src="/logo.png" alt="Pawzzle Logo" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl ring-2 ring-zinc-900 dark:ring-white shadow-sm" />
          <span className="hidden min-[380px]:inline">Blind Mode.</span>
        </h1>
        
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button 
            onClick={() => {
              navigator.clipboard.writeText("Play Pawzzle: a daily sliding puzzle game!\n\nhttps://pawzzle.arnayshukla.com");
              setShareText("Copied!");
              setTimeout(() => setShareText("Share Game"), 2000);
            }}
            className={`flex shrink-0 w-11 h-11 sm:w-12 sm:h-12 items-center justify-center font-bold rounded-2xl shadow-sm ring-1 transition-all hover:scale-105 active:scale-95 ${
              shareText === "Copied!" 
                ? "bg-green-500 text-white ring-green-600" 
                : "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 ring-blue-200 dark:ring-blue-800"
            }`}
            title="Share Game"
          >
            {shareText === "Copied!" ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
          
          <div className="transform scale-[0.85] sm:scale-100 origin-right">
            <PushSubscriber />
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center mb-8 px-4 w-full max-w-xl mx-auto">
         <Link href="/" className="px-5 py-3 w-full max-w-sm text-center bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold rounded-2xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white flex items-center justify-center gap-2">
            Go Back
         </Link>
      </div>

      {challengeTime && (
        <div className="mx-auto max-w-xl w-full mb-6">
          <div className="bg-amber-50 dark:bg-amber-900/10 px-5 py-4 rounded-2xl flex items-center justify-between ring-1 ring-amber-200 dark:ring-amber-900/30 shadow-sm">
            <div className="flex flex-col">
              <span className="text-amber-700 dark:text-amber-500 font-bold text-[10px] sm:text-xs tracking-widest uppercase mb-0.5">Active Challenge</span>
              <span className="text-zinc-900 dark:text-white font-bold text-sm sm:text-base">Beat {challengerName ? `${challengerName}'s` : 'target'} time: <span className="text-amber-600 dark:text-amber-400">{challengeTime}s</span>!</span>
            </div>
            <div className="flex bg-amber-100 dark:bg-amber-900/30 h-10 w-10 shrink-0 items-center justify-center rounded-full text-amber-600 dark:text-amber-500">
               <Trophy className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {categories.length > 0 && !challengeTime && (
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
            showNumbers={puzzle.showNumbers}
            useHint={puzzle.useHint}
            hintPenaltyAmount={puzzle.hintPenaltyAmount}
            isBlindMode={puzzle.isBlindMode}
            setIsBlindMode={puzzle.setIsBlindMode}
            isPlaying={puzzle.isPlaying}
            hasStartedMoving={puzzle.hasStartedMoving}
            isSolved={puzzle.isSolved}
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
                showNumbers={puzzle.showNumbers}
                isBlindMode={puzzle.isBlindMode}
                blindState={puzzle.blindState}
                blindCountdown={puzzle.blindCountdown}
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
            puzzleId={`blind-${puzzle.difficulty}`}
            onViewLeaderboard={() => setShowLeaderboard(true)}
            isEndless={true}
            imageKey={imageKey}
            challengeTime={challengeTime}
            challengerName={challengerName}
          />
        )}
        </div>
      )}

      <AnimatePresence>
        {showLeaderboard && (
          <Leaderboard 
            puzzleId={`blind-${puzzle.difficulty}`} 
            onClose={() => setShowLeaderboard(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCustomPackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div 
              className="absolute inset-0" 
              onClick={() => setShowCustomPackModal(false)}
            />
            <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setShowCustomPackModal(false)}
                className="absolute -top-12 right-0 md:-right-12 p-2 bg-zinc-800 text-white hover:bg-zinc-700 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <CustomPackCreator />
            </div>
          </div>
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
