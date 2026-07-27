import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const task = await db.taskItem.findUnique({ where: { id: params.taskId } });
    if (!task) return new NextResponse('Not Found', { status: 404 });

    let updated;
    if (!task.isTimerRunning) {
      // Start timer
      updated = await db.taskItem.update({
        where: { id: params.taskId },
        data: {
          isTimerRunning: true,
          timerStartedAt: new Date(),
          auditLogs: {
            create: {
              user: 'Demo User',
              action: 'STARTED_TIMER',
              details: 'Started task timer',
            },
          },
        },
      });
    } else {
      // Stop timer and calculate elapsed hours
      const startedAt = task.timerStartedAt ? new Date(task.timerStartedAt).getTime() : Date.now();
      const elapsedMs = Date.now() - startedAt;
      const additionalHours = parseFloat((elapsedMs / (1000 * 60 * 60)).toFixed(2));
      const newActualHours = parseFloat((task.actualHours + additionalHours).toFixed(2));

      updated = await db.taskItem.update({
        where: { id: params.taskId },
        data: {
          isTimerRunning: false,
          timerStartedAt: null,
          actualHours: newActualHours,
          auditLogs: {
            create: {
              user: 'Demo User',
              action: 'STOPPED_TIMER',
              details: `Logged ${additionalHours} hours (Total: ${newActualHours}h)`,
            },
          },
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[TASK_TIMER_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
