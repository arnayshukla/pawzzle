import { useState, useEffect, useCallback, useRef } from 'react';
import { playSound, triggerVibration } from '@/lib/sounds';
import { getDailyRandom } from '@/lib/random';

export type Difficulty = 'easy' | 'medium' | 'hard';

export const GRID_SIZES: Record<Difficulty, { rows: number; cols: number }> = {
  easy: { rows: 3, cols: 3 },
  medium: { rows: 4, cols: 4 },
  hard: { rows: 5, cols: 5 },
};

export function usePuzzleState(isDaily: boolean = false) {
  const [difficulty, setDifficulty] = useState<Difficulty>(isDaily ? 'medium' : 'easy');
  const [order, setOrder] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStartedMoving, setHasStartedMoving] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [time, setTime] = useState(0); // in seconds
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);

  // New Mechanics State
  const [showNumbers, setShowNumbers] = useState(false);
  const [isBlindMode, setIsBlindMode] = useState(false);
  const [blindState, setBlindState] = useState<'idle' | 'preview' | 'playing'>('idle');
  const [blindCountdown, setBlindCountdown] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { rows, cols } = GRID_SIZES[difficulty];
  const size = rows * cols;

  const initPuzzle = useCallback(() => {
    const initialOrder = Array.from({ length: size }, (_, i) => i);
    const prng = isDaily ? getDailyRandom() : Math.random;

    // Ensure the puzzle is actually shuffled and not solved initially
    let isShuffled = false;
    while (!isShuffled) {
      for (let i = initialOrder.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        [initialOrder[i], initialOrder[j]] = [initialOrder[j], initialOrder[i]];
      }
      isShuffled = !initialOrder.every((val, index) => val === index);
    }

    setOrder(initialOrder);
    setMoves(0);
    setTime(0);
    setIsSolved(false);
    setShowWinModal(false);
    setIsPlaying(true);
    setHasStartedMoving(false);
    setSelectedTileIndex(null);
    setShowNumbers(false);
    
    // Blind Mode resets
    if (isBlindMode) {
      setBlindState('idle');
      setBlindCountdown(null);
    }
  }, [size, isDaily, isBlindMode]);

  // Check for win
  useEffect(() => {
    if (order.length > 0 && isPlaying) {
      const isWin = order.every((val, index) => val === index);
      if (isWin) {
        setIsSolved(true);
        setIsPlaying(false);
        setHasStartedMoving(false);
        playSound('win');
        triggerVibration('success');
        setTimeout(() => setShowWinModal(true), 500);
      }
    }
  }, [order, isPlaying]);

  // Timer
  useEffect(() => {
    // Only run timer if not in blind preview
    const isPreviewing = isBlindMode && blindState !== 'playing';
    
    if (isPlaying && hasStartedMoving && !isSolved && !isPreviewing) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, hasStartedMoving, isSolved, isBlindMode, blindState]);

  // Blind Countdown logic
  useEffect(() => {
    if (blindCountdown !== null && blindCountdown > 0) {
      const id = setTimeout(() => setBlindCountdown(blindCountdown - 1), 1000);
      return () => clearTimeout(id);
    } else if (blindCountdown === 0) {
      setBlindState('playing');
      setBlindCountdown(null);
    }
  }, [blindCountdown]);

  const handleTileClick = (index: number) => {
    if (!isPlaying || isSolved) return;
    
    if (isBlindMode && blindState === 'idle') {
      setBlindState('preview');
      setBlindCountdown(parseInt(process.env.NEXT_PUBLIC_BLIND_SECONDS || '5'));
      return; // Do not swap yet
    }
    
    if (isBlindMode && blindState === 'preview') {
      return; // Ignore clicks during countdown
    }
    
    if (!hasStartedMoving) setHasStartedMoving(true);

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
    showWinModal,
    isPlaying,
    hasStartedMoving,
    selectedTileIndex,
    handleTileClick,
    initPuzzle,
    setIsPlaying,
    
    // Mechanics
    showNumbers,
    useHint: () => {
      if (!isPlaying || isSolved || showNumbers) return;
      setShowNumbers(true);
      const penalty = parseInt(process.env.NEXT_PUBLIC_HINT_PENALTY_SECONDS || '5');
      setTime(t => t + penalty);
    },
    hintPenaltyAmount: parseInt(process.env.NEXT_PUBLIC_HINT_PENALTY_SECONDS || '5'),
    isBlindMode,
    setIsBlindMode,
    blindState,
    blindCountdown,
  };
}
