"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Image as ImageIcon } from "lucide-react";

interface PuzzleBoardProps {
  rows: number;
  cols: number;
  order: number[];
  selectedTileIndex: number | null;
  handleTileClick: (index: number) => void;
  imageUrl: string;
  isSolved: boolean;
  
  // Mechanics
  showNumbers?: boolean;
  blindState?: 'idle' | 'preview' | 'playing';
  blindCountdown?: number | null;
}

export function PuzzleBoard({
  rows,
  cols,
  order,
  selectedTileIndex,
  handleTileClick,
  imageUrl,
  isSolved,
  showNumbers,
  blindState,
  blindCountdown,
}: PuzzleBoardProps) {
  const [isPeeking, setIsPeeking] = useState(false);

  return (
    <div className="relative group w-full max-w-2xl mx-auto rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 select-none">
      <div 
        className="relative w-full aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-2xl overflow-hidden"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: isSolved ? "0px" : "2px", // Remove gaps when solved!
      }}
    >
      {order.map((tileId, index) => {
        // tileId represents which piece of the original image this is.
        const originalRow = Math.floor(tileId / cols);
        const originalCol = tileId % cols;

        // Calculate background position
        // If cols = 3, width is 300%. background-position goes from 0% to 100%
        // x-pos = (originalCol / (cols - 1)) * 100
        const bgPosX = cols > 1 ? (originalCol / (cols - 1)) * 100 : 0;
        const bgPosY = rows > 1 ? (originalRow / (rows - 1)) * 100 : 0;

        const isSelected = selectedTileIndex === index;

        return (
          <motion.div
            key={tileId} // Using tileId correctly handles layout animations when swapping!
            layout
            initial={false}
            animate={{
              scale: isSelected ? 0.93 : 1,
              zIndex: isSelected ? 10 : 1,
              borderRadius: isSolved ? "0px" : isSelected ? "12px" : "4px",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={() => handleTileClick(index)}
            className={cn(
              "cursor-pointer bg-zinc-300 dark:bg-zinc-700 w-full h-full transform-gpu",
              isSelected && "ring-4 ring-black dark:ring-white ring-inset shadow-2xl",
              !isSolved && "hover:opacity-90"
            )}
            style={{
              backgroundImage: (blindState === 'playing' && !isSolved) ? 'none' : `url(${imageUrl})`,
              backgroundSize: `${cols * 100}% ${rows * 100}%`,
              backgroundPosition: `${bgPosX}% ${bgPosY}%`,
            }}
          >
            {showNumbers && (blindState !== 'preview' && blindState !== 'idle') && (
              <span className="absolute top-1 left-1.5 text-[10px] sm:text-xs font-black text-white mix-blend-difference drop-shadow-md opacity-90">
                {tileId + 1}
              </span>
            )}
          </motion.div>
        );
      })}
      </div>

      {/* Peek or Blind Preview Overlay */}
      {(isPeeking || blindState === 'idle' || blindState === 'preview') && !isSolved && (
        <div className="absolute inset-0 z-20 rounded-2xl overflow-hidden pointer-events-none shadow-inner bg-zinc-200 dark:bg-zinc-800" style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          {/* Tiled Grid lines overlay */}
          <div className="w-full h-full" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
            {Array.from({length: rows * cols}).map((_, i) => (
              <div key={i} className="border border-white/20 ring-1 ring-black/5" />
            ))}
          </div>
        </div>
      )}
      
      {/* Blind Countdown Overlay Text */}
      {blindState === 'preview' && blindCountdown !== null && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/50 rounded-2xl pointer-events-none backdrop-blur-[2px]">
           <span className="text-white text-6xl sm:text-7xl font-black drop-shadow-2xl animate-pulse">
             {blindCountdown}
           </span>
           <span className="text-white/90 font-bold mt-4 text-xs sm:text-sm uppercase tracking-widest drop-shadow-md">Memorize carefully...</span>
        </div>
      )}

      {/* Start Blind Overlay Text */}
      {blindState === 'idle' && !isSolved && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 hover:bg-black/20 rounded-2xl backdrop-blur-[2px] transition-all cursor-pointer group"
             onClick={() => handleTileClick(0)} // Triggers the start!
        >
           <div className="bg-white/10 px-6 py-4 rounded-2xl backdrop-blur-md ring-1 ring-white/20 shadow-2xl pointer-events-none group-hover:scale-105 transition-transform">
             <span className="text-white text-lg sm:text-xl font-black drop-shadow-md">
               Click to Start Blind Preview
             </span>
           </div>
        </div>
      )}

      {/* Peek Button Container */}
      {!isSolved && blindState !== 'idle' && blindState !== 'preview' && blindState !== 'playing' && (
        <button 
          className="absolute -top-3 -right-3 sm:-right-4 sm:-top-4 z-30 p-2.5 sm:p-3 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 shadow-xl ring-1 ring-black/10 dark:ring-white/10 rounded-full text-zinc-700 dark:text-zinc-300 transition-transform active:scale-95 cursor-help"
          onPointerDown={(e) => { e.preventDefault(); setIsPeeking(true); }}
          onPointerUp={() => setIsPeeking(false)}
          onPointerLeave={() => setIsPeeking(false)}
          onContextMenu={(e) => e.preventDefault()}
          title="Hold to peek at original image"
        >
          <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}
    </div>
  );
}
