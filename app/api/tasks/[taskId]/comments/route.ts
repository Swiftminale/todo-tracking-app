import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const body = await request.json();
    const { content, authorName } = body;

    if (!content || !content.trim()) {
      return new NextResponse('Comment content is required', { status: 400 });
    }

    const comment = await db.taskComment.create({
      data: {
        taskId: params.taskId,
        content: content.trim(),
        authorName: authorName || 'Demo User',
      },
    });

    await db.taskActivity.create({
      data: {
        taskId: params.taskId,
        user: authorName || 'Demo User',
        action: 'ADDED_COMMENT',
        details: `Added comment: "${content.substring(0, 40)}..."`,
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error('[TASK_COMMENTS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
