import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tasks = await db.taskItem.findMany({ where: { isDeleted: false } });
    const habits = await db.habitItem.findMany({ where: { isDeleted: false } });
    const focusLogs = await db.focusLog.findMany();

    return NextResponse.json({
      tasks,
      habits,
      focusLogs,
    });
  } catch (error) {
    console.error('[ANALYTICS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
