// Central State & Store Manager for PulseTask (With Edit & Recycle Bin)

import { 
  getSupabase, 
  fetchTasksFromSupabase, 
  insertTaskToSupabase, 
  updateTaskInSupabase, 
  permanentlyDeleteTaskFromSupabase,
  emptyTrashInSupabase, 
  updateSubtaskInSupabase,
  fetchHabitsFromSupabase,
  insertHabitToSupabase,
  updateHabitInSupabase,
  permanentlyDeleteHabitFromSupabase,
  toggleHabitHistoryInSupabase,
  insertFocusLogToSupabase,
  fetchNotesFromSupabase,
  saveNotesToSupabase
} from './supabase.js';

const STORAGE_KEYS = {
  TASKS: 'pulsetask_tasks_v4',
  HABITS: 'pulsetask_habits_v4',
  FOCUS_LOGS: 'pulsetask_focus_logs_v4',
  THEME: 'pulsetask_theme_v4',
  NOTES: 'pulsetask_notes_v4',
  DB_VIEW: 'pulsetask_db_view_v4'
};

export class Store {
  constructor() {
    this.listeners = [];
    this.isSupabaseConnected = false;
    this.state = {
      tasks: this.load(STORAGE_KEYS.TASKS, []),
      habits: this.load(STORAGE_KEYS.HABITS, []),
      focusLogs: this.load(STORAGE_KEYS.FOCUS_LOGS, []),
      notes: this.load(STORAGE_KEYS.NOTES, ""),
      theme: this.load(STORAGE_KEYS.THEME, 'dark'),
      currentDbView: this.load(STORAGE_KEYS.DB_VIEW, 'board'),
      activeFilter: 'all',
      searchQuery: '',
      activeCategoryFilter: 'all'
    };
  }

  async initSupabaseIfAvailable() {
    const sb = getSupabase();
    if (!sb) {
      this.isSupabaseConnected = false;
      return false;
    }

    try {
      const cloudTasks = await fetchTasksFromSupabase();
      const cloudHabits = await fetchHabitsFromSupabase();
      const cloudNotes = await fetchNotesFromSupabase();

      if (cloudTasks !== null) {
        this.state.tasks = cloudTasks;
        this.save(STORAGE_KEYS.TASKS, cloudTasks);
      }

      if (cloudHabits !== null) {
        this.state.habits = cloudHabits;
        this.save(STORAGE_KEYS.HABITS, cloudHabits);
      }

      if (cloudNotes !== null) {
        this.state.notes = cloudNotes;
        this.save(STORAGE_KEYS.NOTES, cloudNotes);
      }

      this.isSupabaseConnected = true;
      this.notify();
      return true;
    } catch (e) {
      console.warn('Supabase fetch failed, continuing in Local Storage mode:', e);
      this.isSupabaseConnected = false;
      return false;
    }
  }

  load(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l(this.state));
  }

  setDbView(viewName) {
    this.state.currentDbView = viewName;
    this.save(STORAGE_KEYS.DB_VIEW, viewName);
    this.notify();
  }

  async saveNotes(content) {
    this.state.notes = content;
    this.save(STORAGE_KEYS.NOTES, content);

    if (this.isSupabaseConnected) {
      await saveNotesToSupabase(content);
    }
  }

  async clearAllLocalAndCloudData() {
    this.state.tasks = [];
    this.state.habits = [];
    this.state.focusLogs = [];
    this.state.notes = "";

    this.save(STORAGE_KEYS.TASKS, []);
    this.save(STORAGE_KEYS.HABITS, []);
    this.save(STORAGE_KEYS.FOCUS_LOGS, []);
    this.save(STORAGE_KEYS.NOTES, "");

    const sb = getSupabase();
    if (sb && this.isSupabaseConnected) {
      try {
        await sb.from('subtasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await sb.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await sb.from('habit_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await sb.from('habits').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await sb.from('focus_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await sb.from('user_notes').delete().neq('id', 0);
      } catch (e) {
        console.error('Failed to wipe Supabase tables:', e);
      }
    }

    this.notify();
  }

  // --- Task Methods ---
  async addTask(taskData) {
    const tempId = 'task-' + Date.now();
    const newTask = {
      id: tempId,
      title: taskData.title,
      description: taskData.description || '',
      category: taskData.category || 'Work',
      priority: taskData.priority || 'Medium',
      status: taskData.status || 'to_do',
      dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
      completed: taskData.status === 'done',
      starred: !!taskData.starred,
      isDeleted: false,
      deletedAt: null,
      estimatedMinutes: parseInt(taskData.estimatedMinutes, 10) || 30,
      actualMinutes: 0,
      subtasks: taskData.subtasks || [],
      createdAt: new Date().toISOString()
    };

    this.state.tasks = [newTask, ...this.state.tasks];
    this.save(STORAGE_KEYS.TASKS, this.state.tasks);
    this.notify();

    if (this.isSupabaseConnected) {
      const realId = await insertTaskToSupabase(newTask);
      if (realId) {
        newTask.id = realId;
        this.save(STORAGE_KEYS.TASKS, this.state.tasks);
        this.notify();
      }
    }

    return newTask;
  }

  async editTask(id, updatedFields) {
    this.state.tasks = this.state.tasks.map(t => {
      if (t.id === id) {
        return {
          ...t,
          ...updatedFields,
          completed: updatedFields.status === 'done' ? true : (updatedFields.completed !== undefined ? updatedFields.completed : t.completed)
        };
      }
      return t;
    });

    this.save(STORAGE_KEYS.TASKS, this.state.tasks);
    this.notify();

    if (this.isSupabaseConnected) {
      await updateTaskInSupabase(id, updatedFields);
    }
  }

  async updateTaskStatus(id, newStatus) {
    const isCompleted = newStatus === 'done';

    this.state.tasks = this.state.tasks.map(task => {
      if (task.id === id) {
        return {
          ...task,
          status: newStatus,
          completed: isCompleted
        };
      }
      return task;
    });

    this.save(STORAGE_KEYS.TASKS, this.state.tasks);
    this.notify();

    if (this.isSupabaseConnected) {
      await updateTaskInSupabase(id, { status: newStatus, completed: isCompleted });
    }
  }

  async toggleTaskComplete(id) {
    let updatedCompleted = false;
    let newStatus = 'to_do';

    this.state.tasks = this.state.tasks.map(task => {
      if (task.id === id) {
        updatedCompleted = !task.completed;
        newStatus = updatedCompleted ? 'done' : 'to_do';
        return {
          ...task,
          completed: updatedCompleted,
          status: newStatus,
          subtasks: task.subtasks.map(st => ({ ...st, completed: updatedCompleted }))
        };
      }
      return task;
    });

    this.save(STORAGE_KEYS.TASKS, this.state.tasks);
    this.notify();

    if (this.isSupabaseConnected) {
      await updateTaskInSupabase(id, { completed: updatedCompleted, status: newStatus });
    }
  }

  async toggleSubtask(taskId, subtaskId) {
    let newCompletedState = false;

    this.state.tasks = this.state.tasks.map(task => {
      if (task.id === taskId) {
        const updatedSubtasks = task.subtasks.map(st => {
          if (st.id === subtaskId) {
            newCompletedState = !st.completed;
            return { ...st, completed: newCompletedState };
          }
          return st;
        });
        const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);
        return {
          ...task,
          subtasks: updatedSubtasks,
          completed: allDone ? true : task.completed,
          status: allDone ? 'done' : task.status
        };
      }
      return task;
    });

    this.save(STORAGE_KEYS.TASKS, this.state.tasks);
    this.notify();

    if (this.isSupabaseConnected) {
      await updateSubtaskInSupabase(subtaskId, newCompletedState);
    }
  }

  async toggleTaskStarred(id) {
    let nextStarred = false;
    this.state.tasks = this.state.tasks.map(t => {
      if (t.id === id) {
        nextStarred = !t.starred;
        return { ...t, starred: nextStarred };
      }
      return t;
    });

    this.save(STORAGE_KEYS.TASKS, this.state.tasks);
    this.notify();

    if (this.isSupabaseConnected) {
      await updateTaskInSupabase(id, { starred: nextStarred });
    }
  }

  // --- Soft Delete & Recycle Bin ---
  async softDeleteTask(id) {
    const nowStr = new Date().toISOString();
    this.state.tasks = this.state.tasks.map(t => 
      t.id === id ? { ...t, isDeleted: true, deletedAt: nowStr } : t
    );

    this.save(STORAGE_KEYS.TASKS, this.state.tasks);
    this.notify();

    if (this.isSupabaseConnected) {
      await updateTaskInSupabase(id, { isDeleted: true });
    }
  }

  async restoreTask(id) {
    this.state.tasks = this.state.tasks.map(t => 
      t.id === id ? { ...t, isDeleted: false, deletedAt: null } : t
    );

    this.save(STORAGE_KEYS.TASKS, this.state.tasks);
    this.notify();

    if (this.isSupabaseConnected) {
      await updateTaskInSupabase(id, { isDeleted: false });
    }
  }

  async permanentlyDeleteTask(id) {
    this.state.tasks = this.state.tasks.filter(t => t.id !== id);
    this.save(STORAGE_KEYS.TASKS, this.state.tasks);
    this.notify();

    if (this.isSupabaseConnected) {
      await permanentlyDeleteTaskFromSupabase(id);
    }
  }

  // --- Habit Methods ---
  async addHabit(habitData) {
    const newHabit = {
      id: 'habit-' + Date.now(),
      name: habitData.name,
      category: habitData.category || 'Health',
      targetDaysPerWeek: parseInt(habitData.targetDaysPerWeek, 10) || 5,
      streak: 0,
      icon: habitData.icon || 'activity',
      isDeleted: false,
      deletedAt: null,
      history: {}
    };

    this.state.habits = [newHabit, ...this.state.habits];
    this.save(STORAGE_KEYS.HABITS, this.state.habits);
    this.notify();

    if (this.isSupabaseConnected) {
      const realId = await insertHabitToSupabase(newHabit);
      if (realId) {
        newHabit.id = realId;
        this.save(STORAGE_KEYS.HABITS, this.state.habits);
        this.notify();
      }
    }
  }

  async softDeleteHabit(id) {
    const nowStr = new Date().toISOString();
    this.state.habits = this.state.habits.map(h => 
      h.id === id ? { ...h, isDeleted: true, deletedAt: nowStr } : h
    );

    this.save(STORAGE_KEYS.HABITS, this.state.habits);
    this.notify();

    if (this.isSupabaseConnected) {
      await updateHabitInSupabase(id, { isDeleted: true });
    }
  }

  async restoreHabit(id) {
    this.state.habits = this.state.habits.map(h => 
      h.id === id ? { ...h, isDeleted: false, deletedAt: null } : h
    );

    this.save(STORAGE_KEYS.HABITS, this.state.habits);
    this.notify();

    if (this.isSupabaseConnected) {
      await updateHabitInSupabase(id, { isDeleted: false });
    }
  }

  async permanentlyDeleteHabit(id) {
    this.state.habits = this.state.habits.filter(h => h.id !== id);
    this.save(STORAGE_KEYS.HABITS, this.state.habits);
    this.notify();

    if (this.isSupabaseConnected) {
      await permanentlyDeleteHabitFromSupabase(id);
    }
  }

  async emptyRecycleBin() {
    this.state.tasks = this.state.tasks.filter(t => !t.isDeleted);
    this.state.habits = this.state.habits.filter(h => !h.isDeleted);

    this.save(STORAGE_KEYS.TASKS, this.state.tasks);
    this.save(STORAGE_KEYS.HABITS, this.state.habits);
    this.notify();

    if (this.isSupabaseConnected) {
      await emptyTrashInSupabase();
    }
  }

  async toggleHabitCheckIn(id, dateStr) {
    let newCompletedState = false;
    let newStreak = 0;

    this.state.habits = this.state.habits.map(habit => {
      if (habit.id === id) {
        newCompletedState = !habit.history[dateStr];
        const newHistory = { ...habit.history, [dateStr]: newCompletedState };

        const today = new Date();
        for (let i = 0; i < 60; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const k = d.toISOString().split('T')[0];
          if (newHistory[k]) newStreak++;
          else break;
        }

        return { ...habit, history: newHistory, streak: newStreak };
      }
      return habit;
    });

    this.save(STORAGE_KEYS.HABITS, this.state.habits);
    this.notify();

    if (this.isSupabaseConnected) {
      await toggleHabitHistoryInSupabase(id, dateStr, newCompletedState, newStreak);
    }
  }

  // --- Focus Timer Methods ---
  async logFocusSession(durationMinutes, taskTitle = 'Deep Work') {
    const newLog = {
      id: 'log-' + Date.now(),
      durationMinutes,
      taskTitle,
      timestamp: new Date().toISOString()
    };

    this.state.focusLogs = [newLog, ...this.state.focusLogs];
    this.save(STORAGE_KEYS.FOCUS_LOGS, this.state.focusLogs);
    this.notify();

    if (this.isSupabaseConnected) {
      await insertFocusLogToSupabase(newLog);
    }
  }

  setTheme(theme) {
    this.state.theme = theme;
    this.save(STORAGE_KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
    this.notify();
  }
}

export const store = new Store();
