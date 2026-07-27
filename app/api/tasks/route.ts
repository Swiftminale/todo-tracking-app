import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Try fetching from Supabase first if available
    const { data: sbTasks } = await supabase.from('tasks').select('*');

    const tasks = await db.taskItem.findMany({
      where: { isDeleted: false },
      include: {
        subtasks: { where: { isDeleted: false } },
        dependsOnTask: true,
        comments: { orderBy: { createdAt: 'desc' } },
        auditLogs: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('[TASKS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      status,
      priority,
      dueDate,
      startDate,
      parentTaskId,
      dependsOnTaskId,
      isUrgent,
      isImportant,
      estimatedHours,
      hourlyRate,
      isBillable,
      assignee,
    } = body;

    const task = await db.taskItem.create({
      data: {
        title: title || 'Untitled Task',
        description: description || '',
        category: category || 'Work',
        status: status || 'To Do',
        priority: priority || 'Medium',
        dueDate: dueDate || null,
        startDate: startDate || null,
        parentTaskId: parentTaskId || null,
        dependsOnTaskId: dependsOnTaskId || null,
        isUrgent: !!isUrgent,
        isImportant: !!isImportant,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 1.0,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : 50.0,
        isBillable: isBillable !== undefined ? isBillable : true,
        assignee: assignee || 'Demo User',
        auditLogs: {
          create: {
            user: assignee || 'Demo User',
            action: 'CREATED_TASK',
            details: `Created task "${title || 'Untitled Task'}"`,
          },
        },
      },
      include: {
        subtasks: true,
        dependsOnTask: true,
        comments: true,
        auditLogs: true,
      },
    });

    // Cloud Sync to Supabase
    try {
      await supabase.from('tasks').insert([
        {
          id: task.id,
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
          status: task.status,
          due_date: task.dueDate,
          completed: task.completed,
          is_deleted: false,
        },
      ]);
    } catch (e) {
      console.log('Supabase sync notice:', e);
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('[TASKS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return new NextResponse('Missing Task ID', { status: 400 });

    const existing = await db.taskItem.findUnique({ where: { id } });
    if (!existing) return new NextResponse('Task Not Found', { status: 404 });

    const auditDetails: string[] = [];
    if (updates.status !== undefined && updates.status !== existing.status) {
      auditDetails.push(`Status changed from "${existing.status}" to "${updates.status}"`);
      if (updates.status === 'Done') updates.completed = true;
    }
    if (updates.priority !== undefined && updates.priority !== existing.priority) {
      auditDetails.push(`Priority changed from "${existing.priority}" to "${updates.priority}"`);
    }
    if (updates.completed !== undefined && updates.completed !== existing.completed) {
      auditDetails.push(updates.completed ? 'Marked task as completed' : 'Reopened task');
      if (updates.completed) updates.status = 'Done';
    }

    const task = await db.taskItem.update({
      where: { id },
      data: {
        ...updates,
        auditLogs: auditDetails.length
          ? {
              create: {
                user: 'Demo User',
                action: 'UPDATED_TASK',
                details: auditDetails.join(', '),
              },
            }
          : undefined,
      },
      include: {
        subtasks: true,
        dependsOnTask: true,
        comments: true,
        auditLogs: { orderBy: { createdAt: 'desc' } },
      },
    });

    // Cloud Sync update to Supabase
    try {
      await supabase
        .from('tasks')
        .update({
          title: task.title,
          status: task.status,
          completed: task.completed,
          priority: task.priority,
          is_deleted: task.isDeleted,
        })
        .eq('id', task.id);
    } catch (e) {
      console.log('Supabase sync notice:', e);
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('[TASKS_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
