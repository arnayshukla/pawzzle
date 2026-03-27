import { useState, useEffect, useCallback, useRef } from 'react';
import { playSound, triggerVibration } from '@/lib/sounds';

export type Difficulty = 'easy' | 'medium' | 'hard';

export const GRID_SIZES: Record<Difficulty, { rows: number; cols: number }> = {
  easy: { rows: 3, cols: 3 },
  medium: { rows: 4, cols: 4 },
  hard: { rows: 5, cols: 5 },
};

export function usePuzzleState() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [order, setOrder] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [time, setTime] = useState(0); // in seconds
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { rows, cols } = GRID_SIZES[difficulty];
  const size = rows * cols;

  const initPuzzle = useCallback(() => {
    const initialOrder = Array.from({ length: size }, (_, i) => i);
    
    // Ensure the puzzle is actually shuffled and not solved initially
    let isShuffled = false;
    while (!isShuffled) {
      for (let i = initialOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [initialOrder[i], initialOrder[j]] = [initialOrder[j], initialOrder[i]];
      }
      isShuffled = !initialOrder.every((val, index) => val === index);
    }

    setOrder(initialOrder);
    setMoves(0);
    setTime(0);
    setIsSolved(false);
    setIsPlaying(true);
    setSelectedTileIndex(null);
  }, [size]);

  // Check for win
  useEffect(() => {
    if (order.length > 0 && isPlaying) {
      const isWin = order.every((val, index) => val === index);
      if (isWin) {
        setIsSolved(true);
        setIsPlaying(false);
        playSound('win');
        triggerVibration('success');
      }
    }
  }, [order, isPlaying]);

  // Timer
  useEffect(() => {
    if (isPlaying && !isSolved) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isSolved]);

  const handleTileClick = (index: number) => {
    if (!isPlaying || isSolved) return;

    if (selectedTileIndex === null) {
      setSelectedTileIndex(index);
      triggerVibration('light');
    } else {
      if (selectedTileIndex === index) {
         setSelectedTileIndex(null);
         return;
      }
      
      const newOrder = [...order];
      const temp = newOrder[index];
      newOrder[index] = newOrder[selectedTileIndex];
      newOrder[selectedTileIndex] = temp;

      setOrder(newOrder);
      setMoves((m) => m + 1);
      setSelectedTileIndex(null);
      playSound('click');
      triggerVibration('light');
    }
  };

  return {
    difficulty,
    setDifficulty,
    rows,
    cols,
    order,
    moves,
    time,
    isSolved,
    isPlaying,
    selectedTileIndex,
    handleTileClick,
    initPuzzle,
    setIsPlaying,
  };
}
