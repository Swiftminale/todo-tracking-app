import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const document = await db.document.findUnique({
      where: {
        id: params.documentId,
      },
      include: {
        childDocuments: {
          where: { isArchived: false },
          orderBy: { createdAt: 'asc' },
        },
        databases: {
          include: {
            properties: true,
            rows: true,
          },
        },
      },
    });

    if (!document) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('[DOCUMENT_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const body = await request.json();
    const { title, icon, coverImage, content, isArchived, isPublished, parentDocumentId } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (icon !== undefined) updateData.icon = icon;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (content !== undefined) updateData.content = typeof content === 'string' ? content : JSON.stringify(content);
    if (isArchived !== undefined) updateData.isArchived = isArchived;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (parentDocumentId !== undefined) updateData.parentDocumentId = parentDocumentId;

    // If archiving, recursively archive child documents as well
    if (isArchived === true) {
      const archiveChildren = async (docId: string) => {
        const children = await db.document.findMany({
          where: { parentDocumentId: docId },
        });
        for (const child of children) {
          await db.document.update({
            where: { id: child.id },
            data: { isArchived: true },
          });
          await archiveChildren(child.id);
        }
      };
      await archiveChildren(params.documentId);
    }

    const document = await db.document.update({
      where: {
        id: params.documentId,
      },
      data: updateData,
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('[DOCUMENT_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const document = await db.document.delete({
      where: {
        id: params.documentId,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('[DOCUMENT_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
