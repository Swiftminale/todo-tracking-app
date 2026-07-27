// Supabase Client Integration Service

const DEFAULT_SUPABASE_URL = 'https://yickimqwaqdwxpmvbomj.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpY2tpbXF3YXFkd3hwbXZib21qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNTczOTMsImV4cCI6MjEwMDczMzM5M30.nulRsQ4uobMZ7kLvaWyFPcxqLzWTwoFfqRV1qHAbd_g';

const SUPABASE_STORAGE_KEYS = {
  URL: 'pulsetask_sb_url',
  KEY: 'pulsetask_sb_key'
};

let supabaseClient = null;

export function getSupabaseCredentials() {
  const url = localStorage.getItem(SUPABASE_STORAGE_KEYS.URL) || 
              (import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 
              DEFAULT_SUPABASE_URL;

  const key = localStorage.getItem(SUPABASE_STORAGE_KEYS.KEY) || 
              (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 
              DEFAULT_SUPABASE_KEY;

  return { url, key };
}

export function saveSupabaseCredentials(url, key) {
  if (url) localStorage.setItem(SUPABASE_STORAGE_KEYS.URL, url.trim());
  else localStorage.removeItem(SUPABASE_STORAGE_KEYS.URL);

  if (key) localStorage.setItem(SUPABASE_STORAGE_KEYS.KEY, key.trim());
  else localStorage.removeItem(SUPABASE_STORAGE_KEYS.KEY);

  supabaseClient = null; // reset instance
}

export function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const { url, key } = getSupabaseCredentials();
  if (!url || !key) return null;

  try {
    const createClient = window.supabase?.createClient;
    if (createClient) {
      supabaseClient = createClient(url, key);
      return supabaseClient;
    }
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
  }
  return null;
}

export async function testSupabaseConnection(url, key) {
  try {
    const createClient = window.supabase?.createClient;
    if (!createClient) return { success: false, error: 'Supabase JS library not loaded yet' };

    const client = createClient(url, key);
    const { data, error } = await client.from('tasks').select('id').limit(1);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Unknown network error' };
  }
}

// --- Supabase Cloud Data CRUD ---

export async function fetchTasksFromSupabase() {
  const sb = getSupabase();
  if (!sb) return null;

  const { data: tasks, error: taskErr } = await sb
    .from('tasks')
    .select('*, subtasks(*)');

  if (taskErr) {
    console.error('Supabase fetch tasks error:', taskErr);
    return null;
  }

  return tasks.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description || '',
    category: t.category || 'Work',
    priority: t.priority || 'Medium',
    status: t.status || (t.completed ? 'done' : 'to_do'),
    dueDate: t.due_date || new Date().toISOString().split('T')[0],
    completed: !!t.completed,
    starred: !!t.starred,
    isDeleted: !!t.is_deleted,
    deletedAt: t.deleted_at,
    estimatedMinutes: t.estimated_minutes || 30,
    actualMinutes: t.actual_minutes || 0,
    createdAt: t.created_at,
    subtasks: (t.subtasks || []).map(st => ({
      id: st.id,
      title: st.title,
      completed: !!st.completed
    }))
  }));
}

export async function insertTaskToSupabase(task) {
  const sb = getSupabase();
  if (!sb) return null;

  const { data: insertedTask, error: taskErr } = await sb
    .from('tasks')
    .insert([{
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      status: task.status || 'to_do',
      due_date: task.dueDate,
      completed: task.completed,
      starred: task.starred,
      is_deleted: false,
      estimated_minutes: task.estimatedMinutes
    }])
    .select()
    .single();

  if (taskErr || !insertedTask) {
    console.error('Error inserting task to Supabase:', taskErr);
    return null;
  }

  if (task.subtasks && task.subtasks.length > 0) {
    const subtaskPayload = task.subtasks.map(st => ({
      task_id: insertedTask.id,
      title: st.title,
      completed: st.completed
    }));
    await sb.from('subtasks').insert(subtaskPayload);
  }

  return insertedTask.id;
}

export async function updateTaskInSupabase(id, updates) {
  const sb = getSupabase();
  if (!sb) return;

  const payload = {};
  if (updates.completed !== undefined) payload.completed = updates.completed;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.starred !== undefined) payload.starred = updates.starred;
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
  if (updates.isDeleted !== undefined) {
    payload.is_deleted = updates.isDeleted;
    payload.deleted_at = updates.isDeleted ? new Date().toISOString() : null;
  }

  await sb.from('tasks').update(payload).eq('id', id);

  // Sync subtasks if editing subtasks array
  if (updates.subtasks) {
    await sb.from('subtasks').delete().eq('task_id', id);
    if (updates.subtasks.length > 0) {
      const subtaskPayload = updates.subtasks.map(st => ({
        task_id: id,
        title: st.title,
        completed: st.completed
      }));
      await sb.from('subtasks').insert(subtaskPayload);
    }
  }
}

export async function permanentlyDeleteTaskFromSupabase(id) {
  const sb = getSupabase();
  if (!sb) return;

  await sb.from('tasks').delete().eq('id', id);
}

export async function emptyTrashInSupabase() {
  const sb = getSupabase();
  if (!sb) return;

  await sb.from('tasks').delete().eq('is_deleted', true);
  await sb.from('habits').delete().eq('is_deleted', true);
}

export async function updateSubtaskInSupabase(subtaskId, completed) {
  const sb = getSupabase();
  if (!sb) return;

  await sb.from('subtasks').update({ completed }).eq('id', subtaskId);
}

export async function fetchHabitsFromSupabase() {
  const sb = getSupabase();
  if (!sb) return null;

  const { data: habits, error: habitErr } = await sb
    .from('habits')
    .select('*, habit_history(*)');

  if (habitErr) return null;

  return habits.map(h => {
    const historyObj = {};
    (h.habit_history || []).forEach(hh => {
      historyObj[hh.check_date] = hh.completed;
    });

    return {
      id: h.id,
      name: h.name,
      category: h.category || 'Health',
      targetDaysPerWeek: h.target_days_per_week || 5,
      streak: h.streak || 0,
      icon: h.icon || 'activity',
      isDeleted: !!h.is_deleted,
      deletedAt: h.deleted_at,
      history: historyObj
    };
  });
}

export async function insertHabitToSupabase(habit) {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('habits')
    .insert([{
      name: habit.name,
      category: habit.category,
      target_days_per_week: habit.targetDaysPerWeek,
      icon: habit.icon,
      is_deleted: false
    }])
    .select()
    .single();

  return data ? data.id : null;
}

export async function updateHabitInSupabase(id, updates) {
  const sb = getSupabase();
  if (!sb) return;

  const payload = {};
  if (updates.isDeleted !== undefined) {
    payload.is_deleted = updates.isDeleted;
    payload.deleted_at = updates.isDeleted ? new Date().toISOString() : null;
  }

  await sb.from('habits').update(payload).eq('id', id);
}

export async function permanentlyDeleteHabitFromSupabase(id) {
  const sb = getSupabase();
  if (!sb) return;

  await sb.from('habits').delete().eq('id', id);
}

export async function toggleHabitHistoryInSupabase(habitId, checkDate, completed, newStreak) {
  const sb = getSupabase();
  if (!sb) return;

  await sb.from('habits').update({ streak: newStreak }).eq('id', habitId);

  if (completed) {
    await sb.from('habit_history').upsert({
      habit_id: habitId,
      check_date: checkDate,
      completed: true
    }, { onConflict: 'habit_id,check_date' });
  } else {
    await sb.from('habit_history').delete().match({ habit_id: habitId, check_date: checkDate });
  }
}

export async function insertFocusLogToSupabase(log) {
  const sb = getSupabase();
  if (!sb) return;

  await sb.from('focus_logs').insert([{
    duration_minutes: log.durationMinutes,
    task_title: log.taskTitle
  }]);
}

export async function fetchNotesFromSupabase() {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('user_notes')
    .select('content')
    .eq('id', 1)
    .single();

  if (error || !data) return null;
  return data.content;
}

export async function saveNotesToSupabase(content) {
  const sb = getSupabase();
  if (!sb) return;

  await sb.from('user_notes').upsert({
    id: 1,
    content,
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' });
}
