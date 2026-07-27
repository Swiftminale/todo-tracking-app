// PulseTask Automated Test Suite (QA Unit & Integration Tests)
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

// --- Mock Browser Environment for Node.js ---
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

global.localStorage = new LocalStorageMock();
global.window = {
  localStorage: global.localStorage,
  AudioContext: class {
    constructor() {
      this.state = 'running';
      this.currentTime = 0;
    }
    createOscillator() {
      return {
        type: 'sine',
        frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {},
        start: () => {},
        stop: () => {}
      };
    }
    createGain() {
      return {
        gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {}
      };
    }
    destination = {}
  }
};
global.document = {
  documentElement: {
    setAttribute: (attr, val) => {
      global.document.documentElement[attr] = val;
    }
  }
};
global.import = { meta: { env: {} } };

// Import Store
import { Store } from '../src/store.js';
import { getSupabaseCredentials, saveSupabaseCredentials } from '../src/supabase.js';
import { playCompleteSound, playTimerBellSound, playClickSound } from '../src/utils/audio.js';

describe('1. Store State Management & Task Operations', () => {
  let store;

  beforeEach(() => {
    global.localStorage.clear();
    store = new Store();
  });

  test('TC-ST-01: Store initializes with default state values', () => {
    assert.deepEqual(store.state.tasks, []);
    assert.deepEqual(store.state.habits, []);
    assert.deepEqual(store.state.focusLogs, []);
    assert.equal(store.state.notes, '');
    assert.equal(store.state.theme, 'dark');
    assert.equal(store.state.currentDbView, 'board');
  });

  test('TC-ST-02: Task Creation - Add new task to store', async () => {
    const taskData = {
      title: 'Complete QA Test Plan',
      description: 'Write test cases and execute suite',
      category: 'Work',
      priority: 'High',
      status: 'to_do',
      dueDate: '2026-07-28',
      estimatedMinutes: 45,
      subtasks: [{ id: 'sub-1', title: 'Subtask 1', completed: false }]
    };

    const task = await store.addTask(taskData);

    assert.equal(store.state.tasks.length, 1);
    assert.equal(store.state.tasks[0].title, 'Complete QA Test Plan');
    assert.equal(store.state.tasks[0].completed, false);
    assert.equal(store.state.tasks[0].isDeleted, false);
    assert.equal(store.state.tasks[0].subtasks.length, 1);
  });

  test('TC-ST-03: Task Editing - Update existing task fields', async () => {
    const task = await store.addTask({ title: 'Initial Title', priority: 'Low' });
    await store.editTask(task.id, { title: 'Updated Title', priority: 'Urgent', status: 'done' });

    const updated = store.state.tasks.find(t => t.id === task.id);
    assert.equal(updated.title, 'Updated Title');
    assert.equal(updated.priority, 'Urgent');
    assert.equal(updated.status, 'done');
    assert.equal(updated.completed, true);
  });

  test('TC-ST-04: Task Status Toggle & Completion', async () => {
    const task = await store.addTask({ title: 'Test Status', status: 'to_do' });
    
    await store.updateTaskStatus(task.id, 'in_progress');
    assert.equal(store.state.tasks[0].status, 'in_progress');
    assert.equal(store.state.tasks[0].completed, false);

    await store.toggleTaskComplete(task.id);
    assert.equal(store.state.tasks[0].completed, true);
    assert.equal(store.state.tasks[0].status, 'done');
  });

  test('TC-ST-05: Subtask Completion & Parent Auto-Completion Logic', async () => {
    const task = await store.addTask({
      title: 'Task with subtasks',
      subtasks: [
        { id: 'st-1', title: 'Sub 1', completed: false },
        { id: 'st-2', title: 'Sub 2', completed: false }
      ]
    });

    await store.toggleSubtask(task.id, 'st-1');
    assert.equal(store.state.tasks[0].subtasks[0].completed, true);
    assert.equal(store.state.tasks[0].completed, false);

    // Toggle remaining subtask -> Task should auto-complete
    await store.toggleSubtask(task.id, 'st-2');
    assert.equal(store.state.tasks[0].subtasks[1].completed, true);
    assert.equal(store.state.tasks[0].completed, true);
    assert.equal(store.state.tasks[0].status, 'done');
  });

  test('TC-ST-06: Task Starring', async () => {
    const task = await store.addTask({ title: 'Important Task' });
    assert.equal(store.state.tasks[0].starred, false);

    await store.toggleTaskStarred(task.id);
    assert.equal(store.state.tasks[0].starred, true);

    await store.toggleTaskStarred(task.id);
    assert.equal(store.state.tasks[0].starred, false);
  });

  test('TC-ST-07: Soft Delete & Recycle Bin Restoration', async () => {
    const task = await store.addTask({ title: 'Task to Trash' });
    
    // Soft delete
    await store.softDeleteTask(task.id);
    assert.equal(store.state.tasks[0].isDeleted, true);
    assert.notEqual(store.state.tasks[0].deletedAt, null);

    // Restore
    await store.restoreTask(task.id);
    assert.equal(store.state.tasks[0].isDeleted, false);
    assert.equal(store.state.tasks[0].deletedAt, null);

    // Permanent delete
    await store.softDeleteTask(task.id);
    await store.permanentlyDeleteTask(task.id);
    assert.equal(store.state.tasks.length, 0);
  });
});

describe('2. Habit Tracker & Streak Algorithm', () => {
  let store;

  beforeEach(() => {
    global.localStorage.clear();
    store = new Store();
  });

  test('TC-HB-01: Habit Creation & Attributes', async () => {
    await store.addHabit({ name: 'Morning Jog', category: 'Health', targetDaysPerWeek: 5, icon: 'dumbbell' });
    assert.equal(store.state.habits.length, 1);
    assert.equal(store.state.habits[0].name, 'Morning Jog');
    assert.equal(store.state.habits[0].streak, 0);
  });

  test('TC-HB-02: Habit Check-in & Dynamic Streak Calculation', async () => {
    await store.addHabit({ name: 'Daily Reading', targetDaysPerWeek: 7 });
    const habitId = store.state.habits[0].id;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check in yesterday
    await store.toggleHabitCheckIn(habitId, yesterdayStr);
    // Check in today
    await store.toggleHabitCheckIn(habitId, todayStr);

    assert.equal(store.state.habits[0].history[todayStr], true);
    assert.equal(store.state.habits[0].history[yesterdayStr], true);
    assert.equal(store.state.habits[0].streak, 2);

    // Uncheck today -> Streak recalculates
    await store.toggleHabitCheckIn(habitId, todayStr);
    assert.equal(store.state.habits[0].history[todayStr], false);
  });
});

describe('3. Focus Logs, Notes & Theme Persistence', () => {
  let store;

  beforeEach(() => {
    global.localStorage.clear();
    store = new Store();
  });

  test('TC-FL-01: Focus Session Logging', async () => {
    await store.logFocusSession(25, 'Code Review Task');
    assert.equal(store.state.focusLogs.length, 1);
    assert.equal(store.state.focusLogs[0].durationMinutes, 25);
    assert.equal(store.state.focusLogs[0].taskTitle, 'Code Review Task');
  });

  test('TC-NT-01: Quick Notes Persistence', async () => {
    await store.saveNotes('Remember to update documentation');
    assert.equal(store.state.notes, 'Remember to update documentation');
    assert.equal(global.localStorage.getItem('pulsetask_notes_v4'), JSON.stringify('Remember to update documentation'));
  });

  test('TC-TM-01: Theme Toggle & DOM Data Attribute Update', () => {
    store.setTheme('light');
    assert.equal(store.state.theme, 'light');
    assert.equal(global.document.documentElement['data-theme'], 'light');

    store.setTheme('dark');
    assert.equal(store.state.theme, 'dark');
    assert.equal(global.document.documentElement['data-theme'], 'dark');
  });

  test('TC-WP-01: Clear All Data (Wipe Database)', async () => {
    await store.addTask({ title: 'Task 1' });
    await store.addHabit({ name: 'Habit 1' });
    await store.logFocusSession(30, 'Focus 1');
    await store.saveNotes('Notes 1');

    await store.clearAllLocalAndCloudData();

    assert.equal(store.state.tasks.length, 0);
    assert.equal(store.state.habits.length, 0);
    assert.equal(store.state.focusLogs.length, 0);
    assert.equal(store.state.notes, '');
  });
});

describe('4. Supabase Credentials & Audio Utilities', () => {
  beforeEach(() => {
    global.localStorage.clear();
  });

  test('TC-SB-01: Credentials Storage and Retrieval', () => {
    saveSupabaseCredentials('https://custom-project.supabase.co', 'custom-key-123');
    const creds = getSupabaseCredentials();
    assert.equal(creds.url, 'https://custom-project.supabase.co');
    assert.equal(creds.key, 'custom-key-123');
  });

  test('TC-AU-01: Audio Synthesizer Execution Without Error', () => {
    assert.doesNotThrow(() => playCompleteSound());
    assert.doesNotThrow(() => playTimerBellSound());
    assert.doesNotThrow(() => playClickSound());
  });
});

describe('5. HTML Schema & Element ID Integrity Check', () => {
  test('TC-DOM-01: index.html contains all required containers and modal IDs', () => {
    const htmlPath = path.resolve(process.cwd(), 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    const requiredIDs = [
      'tasks-list-container',
      'habits-list-container',
      'timer-wrapper-container',
      'analytics-wrapper-container',
      'trash-wrapper-container',
      'notion-quick-notes-container',
      'modal-task',
      'modal-habit',
      'modal-supabase',
      'global-search-input',
      'btn-open-new-task-modal',
      'btn-open-new-habit-modal',
      'btn-open-supabase-modal',
      'btn-wipe-all-data',
      'theme-toggle'
    ];

    requiredIDs.forEach(id => {
      assert.ok(htmlContent.includes(`id="${id}"`), `Missing required element ID in index.html: ${id}`);
    });
  });
});
