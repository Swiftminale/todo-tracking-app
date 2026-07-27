import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const task = await db.taskItem.findUnique({
      where: { id: params.taskId },
      include: {
        subtasks: { where: { isDeleted: false } },
        dependsOnTask: true,
        comments: { orderBy: { createdAt: 'desc' } },
        auditLogs: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!task) return new NextResponse('Not Found', { status: 404 });

    return NextResponse.json(task);
  } catch (error) {
    console.error('[TASK_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    await db.taskItem.update({
      where: { id: params.taskId },
      data: { isDeleted: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[TASK_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
