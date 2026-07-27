import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    const documents = await db.document.findMany({
      where: {
        isArchived: false,
        OR: [
          { title: { contains: query } },
        ],
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10,
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('[SEARCH_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
