"use client";

import { useEffect, useState } from "react";
import { usePuzzleState } from "@/hooks/usePuzzleState";
import { PuzzleBoard } from "@/components/PuzzleBoard";
import { HUD } from "@/components/HUD";
import { WinModal } from "@/components/WinModal";
import { Loader2, ImageOff, ShieldAlert, Trophy } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CustomGamePage() {
  const params = useParams();
  const packId = params.packId as string;

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFlagged, setIsFlagged] = useState(false);
  const [reportState, setReportState] = useState<'idle' | 'reporting' | 'reported'>('idle');
  
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

  const puzzle = usePuzzleState();

  const fetchNewImage = async () => {
    setLoading(true);
    setError(null);
    puzzle.setIsPlaying(false);
    
    try {
      const res = await fetch(`/api/custom/${packId}`);
      const data = await res.json();
      
      if (res.status === 403 && data.flagged) {
        setIsFlagged(true);
        setError(data.error);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to load custom puzzle");
      }

      const img = new Image();
      img.src = data.url;
      img.onload = () => {
        setImageUrl(data.url);
        puzzle.initPuzzle();
        setLoading(false);
      };
      img.onerror = () => {
        setError("Failed to load puzzle image.");
        setLoading(false);
      };
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const reportPuzzle = async () => {
    if (!confirm("Are you sure you want to report this puzzle for inappropriate content?")) return;
    
    setReportState('reporting');
    try {
      const res = await fetch('/api/custom/report', {
        method: 'POST',
        body: JSON.stringify({ packId }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setReportState('reported');
        setIsFlagged(true);
        setError("This puzzle pack has been suspended pending review due to a user report.");
      } else {
        throw new Error("Failed to report");
      }
    } catch (err) {
      alert("Failed to send report. Please try again later.");
      setReportState('idle');
    }
  };

  useEffect(() => {
    fetchNewImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

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

      {challengeTime && (
        <div className="mx-auto max-w-xl w-full mb-6 px-4">
          <div className="bg-amber-50 dark:bg-amber-900/10 px-5 py-4 rounded-2xl flex items-center justify-between ring-1 ring-amber-200 dark:ring-amber-900/30 shadow-sm text-left">
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

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 px-4 w-full max-w-xl mx-auto text-center">
        <Link 
          href="/" 
          className="px-6 py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold rounded-2xl shadow-sm transition-all"
        >
          View Main Game
        </Link>
        <div className="text-zinc-500 font-semibold px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/50">
          Shared Custom Pack
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <Loader2 className="w-10 h-10 animate-spin text-zinc-300 dark:text-zinc-600" />
          <p className="text-zinc-500 font-semibold tracking-wide">Loading custom puzzle...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center max-w-md mx-auto">
          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center ring-1 ${isFlagged ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 ring-red-300' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 ring-amber-200'}`}>
            <ImageOff className="w-10 h-10" />
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-4 px-4">{error}</p>
          {!isFlagged && (
            <Link
              href="/"
              className="mt-6 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold tracking-wide transition-all shadow-xl"
            >
              Play Official Puzzles
            </Link>
          )}
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

          {/* Win Modal handles logic naturally passing API image forward */}
          {puzzle.showWinModal && (
            <WinModal
              isSolved={puzzle.isSolved}
              moves={puzzle.moves}
              time={puzzle.time}
              difficulty={puzzle.difficulty}
              imageUrl={imageUrl || ""}
              onPlayAgain={puzzle.initPuzzle}
              onNewImage={fetchNewImage}
              puzzleId={`custom-${packId}`}
              onViewLeaderboard={() => {}}
              challengeTime={challengeTime}
              challengerName={challengerName}
            />
          )}

          <div className="mt-12 text-center w-full">
            <button
              onClick={reportPuzzle}
              disabled={reportState !== 'idle'}
              className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-red-500 transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
              {reportState === 'idle' ? 'Report Content' : reportState === 'reporting' ? 'Reporting...' : 'Reported'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
