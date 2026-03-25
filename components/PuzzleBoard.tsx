"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PuzzleBoardProps {
  rows: number;
  cols: number;
  order: number[];
  selectedTileIndex: number | null;
  handleTileClick: (index: number) => void;
  imageUrl: string;
  isSolved: boolean;
}

export function PuzzleBoard({
  rows,
  cols,
  order,
  selectedTileIndex,
  handleTileClick,
  imageUrl,
  isSolved,
}: PuzzleBoardProps) {
  return (
    <div 
      className="relative w-full max-w-2xl aspect-square mx-auto bg-zinc-200 dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
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
          />
        );
      })}
    </div>
  );
}
