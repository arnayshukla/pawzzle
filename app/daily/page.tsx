"use client";

import { useEffect, useState } from "react";
import { usePuzzleState } from "@/hooks/usePuzzleState";
import { PuzzleBoard } from "@/components/PuzzleBoard";
import { HUD } from "@/components/HUD";
import { WinModal } from "@/components/WinModal";
import { Loader2, ImageOff, ArrowLeft, Trophy, Share2, Check } from "lucide-react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { Leaderboard } from "@/components/Leaderboard";
import { PushSubscriber } from "@/components/PushSubscriber";

export default function DailyChallengePage() {
  const puzzle = usePuzzleState(true); // isDaily = true
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [seedDate, setSeedDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [dailyData, setDailyData] = useState<{ moves: number; time: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [shareText, setShareText] = useState("Share Challenge");

  // Challenge Mechanics
  const [challengeTime, setChallengeTime] = useState<number | undefined>();
  const [challengerName, setChallengerName] = useState<string | undefined>();

  useEffect(() => {
    // Parse challenge parameters strictly on the client to avoid SSR hydration mismatches
    const params = new URLSearchParams(window.location.search);
    const ct = params.get("challengeTime");
    const cn = params.get("challenger");
    const diff = params.get("diff");
    if (ct && !isNaN(parseInt(ct))) setChallengeTime(parseInt(ct));
    if (cn) setChallengerName(cn);
    if (diff && ["easy", "medium", "hard"].includes(diff)) {
      puzzle.setDifficulty(diff as any);
    }
  }, []);

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
      setSeedDate(data.seedDate);
      
      const storageKey = `pawzzle_daily_${data.seedDate}`;
      const existingRecord = localStorage.getItem(storageKey);
      
      const img = new Image();
      img.src = data.url;
      img.onload = () => {
        setImageUrl(data.url);
        if (existingRecord) {
          setHasPlayedToday(true);
          try {
            setDailyData(JSON.parse(existingRecord));
          } catch (e) {
            // ignore
          }
        } else {
          puzzle.initPuzzle();
        }
        setLoading(false);
      };
      img.onerror = () => {
        setError("Failed to load daily image");
        setLoading(false);
      };
    } catch (err: any) {
      setError(err.message);
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

      <h1 className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center text-4xl font-black tracking-tighter text-amber-500 dark:text-amber-400 mb-6 select-none">
        <img src="/logo.png" alt="Pawzzle Logo" className="w-12 h-12 rounded-xl ring-2 ring-amber-400" />
        Daily Canine
      </h1>

      <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 mb-8 px-4 w-full max-w-xl mx-auto">
        <Link 
          href="/" 
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 h-[52px] sm:h-14 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95 text-[15px] sm:text-base whitespace-nowrap"
        >
          Endless Mode
        </Link>

        {seedDate && (
          <button 
            onClick={() => setShowLeaderboard(true)}
            className="flex shrink-0 w-[52px] h-[52px] sm:w-14 sm:h-14 items-center justify-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold rounded-2xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700 transition-all hover:scale-105 active:scale-95"
            title="Leaderboard"
          >
            <Trophy className="w-5 h-5 text-amber-500" />
          </button>
        )}

        <button 
          onClick={() => {
            navigator.clipboard.writeText("Play the Pawzzle Daily Canine Challenge!\n\nhttps://pawzzle.arnayshukla.com/daily");
            setShareText("Copied!");
            setTimeout(() => setShareText("Share Challenge"), 2000);
          }}
          className={`flex shrink-0 w-[52px] h-[52px] sm:w-14 sm:h-14 items-center justify-center font-bold rounded-2xl shadow-sm ring-1 transition-all hover:scale-105 active:scale-95 ${
            shareText === "Copied!" 
              ? "bg-green-500 text-white ring-green-600" 
              : "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 ring-blue-200 dark:ring-blue-800"
          }`}
          title="Share Challenge"
        >
          {shareText === "Copied!" ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
        </button>

        <PushSubscriber />
      </div>

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
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center max-w-md mx-auto fade-in w-full">
           <div className="text-5xl">🐾</div>
           <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">You've completed today's challenge!</h2>
           
           {dailyData && (
             <div className="grid grid-cols-2 gap-4 w-full">
               <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-5 ring-1 ring-zinc-200 dark:ring-zinc-800 shadow-sm">
                 <p className="text-xs uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500 mb-1">Time</p>
                 <p className="text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-50">{dailyData.time}s</p>
               </div>
               <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-5 ring-1 ring-zinc-200 dark:ring-zinc-800 shadow-sm">
                 <p className="text-xs uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500 mb-1">Moves</p>
                 <p className="text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-50">{dailyData.moves}</p>
               </div>
             </div>
           )}

           <p className="text-zinc-600 dark:text-zinc-400 mt-2">Come back tomorrow for a new puzzle. In the meantime, try endless mode!</p>
           
             <button
               onClick={() => {
                 const text = `Pawzzle Daily 🐾 ${seedDate}\nLevel: medium\nMoves: ${dailyData?.moves || 'N/A'} | Time: ${dailyData?.time || 'N/A'}s\nhttps://pawzzle.arnayshukla.com/daily`;
                 navigator.clipboard.writeText(text);
                 setCopied(true);
                 setTimeout(() => setCopied(false), 2000);
               }}
               className="mt-2 flex items-center justify-center w-full px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
             >
               {copied ? "Copied to Clipboard!" : "Share Today's Result"}
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
              puzzleId={`daily-${seedDate}`}
              onViewLeaderboard={() => setShowLeaderboard(true)}
              challengeTime={challengeTime}
              challengerName={challengerName}
            />
          )}
        </div>
      )}
      
      <AnimatePresence>
        {showLeaderboard && seedDate && (
          <Leaderboard 
            puzzleId={`daily-${seedDate}`} 
            onClose={() => setShowLeaderboard(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
