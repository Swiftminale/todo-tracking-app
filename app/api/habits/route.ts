import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const habits = await db.habitItem.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(habits);
  } catch (error) {
    console.error('[HABITS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, icon, targetDaysPerWeek } = body;

    const habit = await db.habitItem.create({
      data: {
        name: name || 'New Habit',
        category: category || 'Health',
        icon: icon || 'flame',
        targetDaysPerWeek: targetDaysPerWeek ? parseInt(targetDaysPerWeek) : 7,
        history: '{}',
      },
    });

    // Sync to Supabase
    try {
      await supabase.from('habits').insert([
        {
          id: habit.id,
          name: habit.name,
          category: habit.category,
          target_days_per_week: habit.targetDaysPerWeek,
          icon: habit.icon,
          is_deleted: false,
        },
      ]);
    } catch (e) {
      console.log('Supabase sync notice:', e);
    }

    return NextResponse.json(habit);
  } catch (error) {
    console.error('[HABITS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, dateStr, toggleCheck, isDeleted } = body;

    if (isDeleted !== undefined) {
      const updated = await db.habitItem.update({
        where: { id },
        data: { isDeleted },
      });

      try {
        await supabase.from('habits').update({ is_deleted: isDeleted }).eq('id', id);
      } catch (e) {}

      return NextResponse.json(updated);
    }

    if (dateStr) {
      const habit = await db.habitItem.findUnique({ where: { id } });
      if (!habit) return new NextResponse('Not Found', { status: 404 });

      const historyMap = habit.history ? JSON.parse(habit.history) : {};
      if (toggleCheck) {
        historyMap[dateStr] = true;
      } else {
        delete historyMap[dateStr];
      }

      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        if (historyMap[key]) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      const updated = await db.habitItem.update({
        where: { id },
        data: {
          history: JSON.stringify(historyMap),
          streak,
        },
      });

      try {
        await supabase.from('habits').update({ streak }).eq('id', id);
      } catch (e) {}

      return NextResponse.json(updated);
    }

    return new NextResponse('Bad Request', { status: 400 });
  } catch (error) {
    console.error('[HABITS_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
