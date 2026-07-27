import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { databaseId: string } }
) {
  try {
    const database = await db.database.findUnique({
      where: { id: params.databaseId },
      include: {
        properties: true,
        rows: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!database) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return NextResponse.json(database);
  } catch (error) {
    console.error('[DATABASE_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { databaseId: string } }
) {
  try {
    const body = await request.json();
    const { title, addProperty } = body;

    if (title) {
      await db.database.update({
        where: { id: params.databaseId },
        data: { title },
      });
    }

    if (addProperty) {
      await db.property.create({
        data: {
          databaseId: params.databaseId,
          name: addProperty.name || 'New Property',
          type: addProperty.type || 'TEXT',
          options: addProperty.options ? JSON.stringify(addProperty.options) : null,
        },
      });
    }

    const updated = await db.database.findUnique({
      where: { id: params.databaseId },
      include: { properties: true, rows: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[DATABASE_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
