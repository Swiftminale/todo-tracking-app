import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getOrCreateWorkspace() {
  let workspace = await db.workspace.findFirst();
  if (!workspace) {
    let user = await db.user.findFirst();
    if (!user) {
      user = await db.user.upsert({
        where: { email: 'demo@notion.app' },
        update: {},
        create: {
          email: 'demo@notion.app',
          name: 'Demo User',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        },
      });
    }
    workspace = await db.workspace.create({
      data: {
        name: 'Personal Workspace',
        ownerId: user.id,
      },
    });

    // Create starter documents
    const rootDoc = await db.document.create({
      data: {
        title: '🚀 Getting Started with Notion',
        icon: '🚀',
        workspaceId: workspace.id,
        content: JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: 'Welcome to your Notion Clone! 🎉' }]
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'This is a full-stack open-source Notion clone built with Next.js App Router, TypeScript, Prisma, and TipTap block editor.' }]
            },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'Features' }]
            },
            {
              type: 'taskList',
              content: [
                { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'text', text: 'Infinite sidebar page nesting' }] },
                { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'text', text: 'TipTap Block Editor with Slash Command (/) menu' }] },
                { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'text', text: 'Inline Databases: Table View & Kanban View' }] },
                { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'text', text: 'Cmd+K Quick Search & Trash Drawer' }] },
                { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'text', text: 'Emoji & Cover Art picker + Light/Dark mode' }] },
              ]
            }
          ]
        })
      }
    });

    await db.document.create({
      data: {
        title: '📋 Project Roadmap',
        icon: '📋',
        workspaceId: workspace.id,
        parentDocumentId: rootDoc.id,
        content: JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'Upcoming Milestones' }]
            },
            {
              type: 'bulletList',
              content: [
                { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Q3 Product launch' }] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Real-time collaborative editing' }] }] }
              ]
            }
          ]
        })
      }
    });
  }
  return workspace;
}

export async function GET(request: Request) {
  try {
    const workspace = await getOrCreateWorkspace();
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentDocumentId');

    const documents = await db.document.findMany({
      where: {
        workspaceId: workspace.id,
        parentDocumentId: parentId || null,
        isArchived: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('[DOCUMENTS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const workspace = await getOrCreateWorkspace();
    const body = await request.json();
    const { title, parentDocumentId, icon } = body;

    const document = await db.document.create({
      data: {
        title: title || 'Untitled',
        icon: icon || '📄',
        parentDocumentId: parentDocumentId || null,
        workspaceId: workspace.id,
        content: JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '' }],
            },
          ],
        }),
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('[DOCUMENTS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
