import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  try {
    const { name, time, moves, puzzleId } = await req.json();

    if (!name || typeof time !== 'number' || typeof moves !== 'number' || !puzzleId) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    // Generate a unique ID for this score entry
    const scoreId = randomUUID();
    
    // Composite score: time + (moves / 1000)
    // Example: 45s, 75 moves -> 45.075
    const compositeScore = time + (moves / 1000);

    // Save the dense data in a hash
    const scoreData = {
      id: scoreId,
      name: name.slice(0, 20), // limit name length
      time,
      moves,
      puzzleId,
      timestamp: Date.now(),
    };
    
    await redis.hset(`score:${scoreId}`, scoreData);

    // Add to the sorted set explicitly for this puzzleId
    // We rank by composite score (lowest is best)
    await redis.zadd(`leaderboard:${puzzleId}`, {
      score: compositeScore,
      member: scoreId,
    });

    return NextResponse.json({ success: true, scoreId, compositeScore });
  } catch (error) {
    console.error('Error saving score:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const puzzleId = searchParams.get('puzzleId');

    if (!puzzleId) {
      return NextResponse.json({ error: 'Missing puzzleId parameter' }, { status: 400 });
    }

    // Get the top 10 score IDs (lowest score first)
    const topScoreIds = await redis.zrange(`leaderboard:${puzzleId}`, 0, 9);
    
    if (!topScoreIds || topScoreIds.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    // Fetch the actual data for these IDs
    // pipelining the hash gets
    const p = redis.pipeline();
    for (const id of topScoreIds) {
      p.hgetall(`score:${id}`);
    }
    
    const scores = await p.exec();
    
    return NextResponse.json({ leaderboard: scores });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
