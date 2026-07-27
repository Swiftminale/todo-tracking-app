import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { databaseId, properties } = body;

    const lastRow = await db.row.findFirst({
      where: { databaseId },
      orderBy: { position: 'desc' },
    });

    const newPosition = (lastRow?.position || 0) + 1;

    const row = await db.row.create({
      data: {
        databaseId,
        position: newPosition,
        properties: JSON.stringify(properties || { Name: 'New Row' }),
      },
    });

    return NextResponse.json(row);
  } catch (error) {
    console.error('[ROWS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { rowId, properties, position } = body;

    const updateData: any = {};
    if (properties !== undefined) updateData.properties = JSON.stringify(properties);
    if (position !== undefined) updateData.position = position;

    const row = await db.row.update({
      where: { id: rowId },
      data: updateData,
    });

    return NextResponse.json(row);
  } catch (error) {
    console.error('[ROWS_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rowId = searchParams.get('rowId');

    if (!rowId) {
      return new NextResponse('Missing rowId', { status: 400 });
    }

    await db.row.delete({
      where: { id: rowId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ROWS_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
