import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  try {
    const { name, time, moves, puzzleId } = await req.json();

    if (!name || typeof time !== 'number' || typeof moves !== 'number' || !puzzleId) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    const scoreId = randomUUID();
    
    // Composite score: time + (moves / 1000)
    // Example: 45s, 75 moves -> 45.075
    const compositeScore = time + (moves / 1000);

    // Save the dense data in a single JSON structure
    const scoreData = {
      id: scoreId,
      name: name.slice(0, 20), // limit name length
      time,
      moves,
      puzzleId,
      timestamp: Date.now(),
    };
    
    // By providing the JSON string straight to ZADD as the member,
    // we eliminate the need for secondary hashes. @upstash/redis auto-stringifies!
    // Using a new _v2 namespace key avoids crashing on older scoreId-only formats.
    await redis.zadd(`leaderboard_v2:${puzzleId}`, {
      score: compositeScore,
      member: scoreData, 
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

    // Get the top 10 scores in a single command! (lowest score first)
    // @upstash/redis automatically JSON.parses the members!
    const topScores = await redis.zrange(`leaderboard_v2:${puzzleId}`, 0, 9);
    
    if (!topScores || topScores.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }
    
    // Return them directly to the frontend.
    return NextResponse.json({ leaderboard: topScores });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
