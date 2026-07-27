import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { documentId, title } = body;

    const database = await db.database.create({
      data: {
        documentId,
        title: title || 'Task Tracker',
        properties: {
          create: [
            { name: 'Name', type: 'TEXT' },
            { 
              name: 'Status', 
              type: 'SELECT', 
              options: JSON.stringify([
                { id: '1', name: 'To Do', color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
                { id: '2', name: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
                { id: '3', name: 'Done', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
              ])
            },
            { 
              name: 'Priority', 
              type: 'SELECT', 
              options: JSON.stringify([
                { id: 'p1', name: 'High 🔴', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
                { id: 'p2', name: 'Medium 🟡', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
                { id: 'p3', name: 'Low 🟢', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
              ])
            },
            { name: 'Done', type: 'CHECKBOX' },
          ],
        },
      },
      include: {
        properties: true,
        rows: true,
      },
    });

    // Create sample rows
    const statusProp = database.properties.find(p => p.name === 'Status');
    const priorityProp = database.properties.find(p => p.name === 'Priority');
    const doneProp = database.properties.find(p => p.name === 'Done');

    await db.row.createMany({
      data: [
        {
          databaseId: database.id,
          position: 1,
          properties: JSON.stringify({
            Name: 'Design Notion UI Layout',
            [statusProp?.id || 'Status']: 'In Progress',
            [priorityProp?.id || 'Priority']: 'High 🔴',
            [doneProp?.id || 'Done']: false,
          }),
        },
        {
          databaseId: database.id,
          position: 2,
          properties: JSON.stringify({
            Name: 'Implement Block Engine',
            [statusProp?.id || 'Status']: 'Done',
            [priorityProp?.id || 'Priority']: 'High 🔴',
            [doneProp?.id || 'Done']: true,
          }),
        },
        {
          databaseId: database.id,
          position: 3,
          properties: JSON.stringify({
            Name: 'Add Dark Mode & Polish',
            [statusProp?.id || 'Status']: 'To Do',
            [priorityProp?.id || 'Priority']: 'Medium 🟡',
            [doneProp?.id || 'Done']: false,
          }),
        },
      ],
    });

    const fullDatabase = await db.database.findUnique({
      where: { id: database.id },
      include: { properties: true, rows: true },
    });

    return NextResponse.json(fullDatabase);
  } catch (error) {
    console.error('[DATABASES_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
