import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const documents = await db.document.findMany({
      where: {
        isArchived: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('[TRASH_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
