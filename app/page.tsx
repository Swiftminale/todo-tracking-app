import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let doc = await db.document.findFirst({
    where: { isArchived: false, parentDocumentId: null },
    orderBy: { createdAt: 'asc' },
  });

  if (!doc) {
    const user = await db.user.upsert({
      where: { email: 'demo@notion.app' },
      update: {},
      create: {
        email: 'demo@notion.app',
        name: 'Demo User',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      },
    });

    let workspace = await db.workspace.findFirst({
      where: { ownerId: user.id },
    });

    if (!workspace) {
      workspace = await db.workspace.create({
        data: { name: 'Personal Workspace', ownerId: user.id },
      });
    }

    doc = await db.document.create({
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
              content: [{ type: 'text', text: 'Start taking notes, organizing tasks with inline tables, or creating sub-pages.' }]
            }
          ]
        }),
      },
    });
  }

  if (doc) {
    redirect(`/documents/${doc.id}`);
  }

  return (
    <div className="flex items-center justify-center h-screen text-xs text-muted-foreground">
      Redirecting to workspace...
    </div>
  );
}
