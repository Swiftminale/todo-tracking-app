import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs = await db.focusLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 20,
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error('[TIMER_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { durationMinutes, taskTitle } = body;

    const log = await db.focusLog.create({
      data: {
        durationMinutes: durationMinutes || 25,
        taskTitle: taskTitle || 'Deep Focus Session',
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error('[TIMER_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
