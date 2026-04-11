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
  isBlindMode?: boolean;
  blindState?: 'idle' | 'preview' | 'playing'; // Kept for backwards prop compatibility
  blindCountdown?: number | null; // Kept for backwards prop compatibility
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
  isBlindMode,
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
              backgroundImage: `url(${imageUrl})`,
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

      {/* Peek Overlay (Only used in standard mode, disabled in isBlindMode explicitly at button logic) */}
      {isPeeking && !isSolved && (
        <div className="absolute inset-0 z-20 rounded-2xl overflow-hidden pointer-events-none shadow-inner bg-zinc-200 dark:bg-zinc-800" style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: '100% 100%', backgroundPosition: 'center' }}>
          {/* Tiled Grid lines overlay */}
          <div className="w-full h-full" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
            {Array.from({length: rows * cols}).map((_, i) => (
              <div key={i} className="border border-white/20 ring-1 ring-black/5" />
            ))}
          </div>
        </div>
      )}
      
      {/* Peek Button Container (Hidden in blind mode natively!) */}
      {!isSolved && !isBlindMode && (
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
