import { store } from './store.js';
import { renderTasks } from './components/tasks.js';
import { renderKanbanBoard } from './components/board.js';
import { renderHabits } from './components/habits.js';
import { setupTimer } from './components/timer.js';
import { renderAnalytics } from './components/analytics.js';
import { renderQuickNotes } from './components/notes.js';
import { renderRecycleBin } from './components/trash.js';
import { getSupabaseCredentials, saveSupabaseCredentials, testSupabaseConnection } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Theme & Supabase Boot
  store.setTheme(store.state.theme);
  updateThemeIcon();

  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Attempt Supabase connection boot
  const connected = await store.initSupabaseIfAvailable();
  updateSupabaseStatusBadge(connected);

  // Render Notion Quick Notes Callout Block
  renderQuickNotes(document.getElementById('notion-quick-notes-container'));

  // Set default date input in task modal to today
  const dateInput = document.getElementById('task-date-input');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // 2. Setup Navigation & View Switching
  const navItems = document.querySelectorAll('.nav-item');
  const views = {
    tasks: document.getElementById('view-tasks'),
    habits: document.getElementById('view-habits'),
    timer: document.getElementById('view-timer'),
    analytics: document.getElementById('view-analytics'),
    trash: document.getElementById('view-trash')
  };

  function renderActiveTaskDatabaseView() {
    const container = document.getElementById('tasks-list-container');
    const currentDbView = store.state.currentDbView || 'board';

    if (currentDbView === 'board') {
      renderKanbanBoard(container);
    } else {
      renderTasks(container);
    }
  }

  function switchView(viewName) {
    navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    Object.keys(views).forEach(key => {
      if (views[key]) {
        views[key].style.display = (key === viewName) ? 'block' : 'none';
      }
    });

    // Render active view components
    if (viewName === 'tasks') {
      renderActiveTaskDatabaseView();
    } else if (viewName === 'habits') {
      renderHabits(document.getElementById('habits-list-container'));
    } else if (viewName === 'timer') {
      setupTimer(document.getElementById('timer-wrapper-container'));
    } else if (viewName === 'analytics') {
      renderAnalytics(document.getElementById('analytics-wrapper-container'));
    } else if (viewName === 'trash') {
      renderRecycleBin(document.getElementById('trash-wrapper-container'));
    }

    if (window.lucide) window.lucide.createIcons();
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = item.dataset.view;
      switchView(targetView);
    });
  });

  // 3. Database View Switcher (Board 📋, Table 📊, List 📝)
  const dbViewBtns = document.querySelectorAll('#db-view-switcher .view-switcher-btn');
  dbViewBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.dbView === store.state.currentDbView);

    btn.addEventListener('click', () => {
      dbViewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetDbView = btn.dataset.dbView;
      store.setDbView(targetDbView);
      renderActiveTaskDatabaseView();
    });
  });

  // 4. Search & Filters
  const searchInput = document.getElementById('global-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      store.state.searchQuery = e.target.value;
      if (document.getElementById('view-tasks').style.display !== 'none') {
        renderActiveTaskDatabaseView();
      }
    });
  }

  const categoryChips = document.querySelectorAll('#filter-chips-category .chip-btn');
  categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      categoryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      store.state.activeCategoryFilter = chip.dataset.category;
      renderActiveTaskDatabaseView();
    });
  });

  // 5. Clear All Data Button Handler
  const wipeBtn = document.getElementById('btn-wipe-all-data');
  if (wipeBtn) {
    wipeBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete all tasks, habits, and focus logs to start with a clean empty database?')) {
        await store.clearAllLocalAndCloudData();
        renderQuickNotes(document.getElementById('notion-quick-notes-container'));
        renderActiveTaskDatabaseView();
        alert('✨ Database completely cleared!');
      }
    });
  }

  // 6. Global openEditTaskModal definition
  window.openEditTaskModal = (taskId) => {
    const task = store.state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const modal = document.getElementById('modal-task');
    const titleHeader = document.getElementById('modal-task-title-text');
    const submitBtn = document.getElementById('btn-submit-task-form');
    const editIdInput = document.getElementById('task-edit-id-input');

    const titleInput = document.getElementById('task-title-input');
    const descInput = document.getElementById('task-desc-input');
    const categorySelect = document.getElementById('task-category-select');
    const statusSelect = document.getElementById('task-status-select');
    const prioritySelect = document.getElementById('task-priority-select');
    const dateInput = document.getElementById('task-date-input');
    const subtasksList = document.getElementById('subtask-inputs-list');

    if (titleHeader) titleHeader.textContent = 'Edit Task';
    if (submitBtn) submitBtn.textContent = 'Save Changes';
    if (editIdInput) editIdInput.value = task.id;

    if (titleInput) titleInput.value = task.title;
    if (descInput) descInput.value = task.description || '';
    if (categorySelect) categorySelect.value = task.category || 'Work';
    if (statusSelect) statusSelect.value = task.status || (task.completed ? 'done' : 'to_do');
    if (prioritySelect) prioritySelect.value = task.priority || 'Medium';
    if (dateInput) dateInput.value = task.dueDate || new Date().toISOString().split('T')[0];

    // Populate subtasks
    if (subtasksList) {
      if (task.subtasks && task.subtasks.length > 0) {
        subtasksList.innerHTML = task.subtasks.map((st, idx) => `
          <div class="subtask-input-row">
            <input type="text" class="form-input subtask-field" value="${escapeHtml(st.title)}" placeholder="Subtask ${idx + 1}">
          </div>
        `).join('');
      } else {
        subtasksList.innerHTML = '<div class="subtask-input-row"><input type="text" class="form-input subtask-field" placeholder="Subtask 1"></div>';
      }
    }

    modal.classList.add('active');
  };

  // 7. Modals setup (Task, Habit, Supabase)
  setupTaskModal();
  setupHabitModal();
  setupSupabaseModal();

  // 8. Theme Toggle
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const newTheme = store.state.theme === 'dark' ? 'light' : 'dark';
      store.setTheme(newTheme);
      updateThemeIcon();
      if (document.getElementById('view-analytics').style.display !== 'none') {
        renderAnalytics(document.getElementById('analytics-wrapper-container'));
      }
    });
  }

  // 9. Subscribe to state updates
  store.subscribe(state => {
    updateBadgesAndStats(state);
    const activeNav = document.querySelector('.nav-item.active');
    if (activeNav) {
      const activeView = activeNav.dataset.view;
      if (activeView === 'tasks') {
        renderActiveTaskDatabaseView();
      } else if (activeView === 'habits') {
        renderHabits(document.getElementById('habits-list-container'));
      } else if (activeView === 'trash') {
        renderRecycleBin(document.getElementById('trash-wrapper-container'));
      }
    }
  });

  // Initial render
  updateBadgesAndStats(store.state);
  renderActiveTaskDatabaseView();
});

function updateSupabaseStatusBadge(isConnected) {
  const dot = document.getElementById('supabase-status-dot');
  const text = document.getElementById('supabase-status-text');
  const dbStat = document.getElementById('stat-db-mode');

  if (isConnected) {
    if (dot) dot.className = 'status-dot online';
    if (text) text.textContent = '⚡ Supabase Connected';
    if (dbStat) dbStat.textContent = 'Supabase Cloud';
  } else {
    if (dot) dot.className = 'status-dot offline';
    if (text) text.textContent = '🔌 Local Mode';
    if (dbStat) dbStat.textContent = 'Local Storage';
  }
}

function updateBadgesAndStats(state) {
  const activeTasks = (state.tasks || []).filter(t => !t.isDeleted);
  const pendingTasks = activeTasks.filter(t => !t.completed && t.status !== 'done').length;
  const completedTasks = activeTasks.filter(t => t.completed || t.status === 'done').length;
  const activeHabitsCount = (state.habits || []).filter(h => !h.isDeleted).length;

  const trashedCount = (state.tasks || []).filter(t => t.isDeleted).length + (state.habits || []).filter(h => h.isDeleted).length;

  const maxStreak = (state.habits || []).filter(h => !h.isDeleted).reduce((max, h) => Math.max(max, h.streak || 0), 0);
  const totalFocusMins = (state.focusLogs || []).reduce((acc, log) => acc + (log.durationMinutes || 0), 0);

  // Sidebar badges
  const taskBadge = document.getElementById('nav-count-tasks');
  if (taskBadge) taskBadge.textContent = pendingTasks;

  const habitBadge = document.getElementById('nav-count-habits');
  if (habitBadge) habitBadge.textContent = activeHabitsCount;

  const trashBadge = document.getElementById('nav-count-trash');
  if (trashBadge) trashBadge.textContent = trashedCount;

  // Stat Cards
  const statCompleted = document.getElementById('stat-completed-count');
  if (statCompleted) statCompleted.textContent = completedTasks;

  const statStreak = document.getElementById('stat-active-streak');
  if (statStreak) statStreak.textContent = `${maxStreak} Days`;

  const statFocus = document.getElementById('stat-focus-hours');
  if (statFocus) statFocus.textContent = `${(totalFocusMins / 60).toFixed(1)} hrs`;
}

function updateThemeIcon() {
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.setAttribute('data-lucide', store.state.theme === 'dark' ? 'sun' : 'moon');
    if (window.lucide) window.lucide.createIcons();
  }
}

function setupTaskModal() {
  const modal = document.getElementById('modal-task');
  const openBtn = document.getElementById('btn-open-new-task-modal');
  const closeBtn = document.getElementById('btn-close-task-modal');
  const cancelBtn = document.getElementById('btn-cancel-task-modal');
  const form = document.getElementById('form-new-task');
  const addSubtaskBtn = document.getElementById('btn-add-subtask-field');
  const subtasksList = document.getElementById('subtask-inputs-list');
  const editIdInput = document.getElementById('task-edit-id-input');
  const titleHeader = document.getElementById('modal-task-title-text');
  const submitBtn = document.getElementById('btn-submit-task-form');

  const open = () => {
    if (editIdInput) editIdInput.value = '';
    if (titleHeader) titleHeader.textContent = 'Create New Task';
    if (submitBtn) submitBtn.textContent = 'Create Task';
    modal.classList.add('active');
  };

  const close = () => {
    modal.classList.remove('active');
    form.reset();
    if (editIdInput) editIdInput.value = '';
    subtasksList.innerHTML = '<div class="subtask-input-row"><input type="text" class="form-input subtask-field" placeholder="Subtask 1"></div>';
  };

  if (openBtn) openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (cancelBtn) cancelBtn.addEventListener('click', close);

  if (addSubtaskBtn) {
    addSubtaskBtn.addEventListener('click', () => {
      const count = subtasksList.querySelectorAll('.subtask-input-row').length + 1;
      const div = document.createElement('div');
      div.className = 'subtask-input-row';
      div.innerHTML = `<input type="text" class="form-input subtask-field" placeholder="Subtask ${count}">`;
      subtasksList.appendChild(div);
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('task-title-input').value.trim();
      if (!title) return;

      const editTaskId = editIdInput ? editIdInput.value : '';
      const description = document.getElementById('task-desc-input').value.trim();
      const category = document.getElementById('task-category-select').value;
      const status = document.getElementById('task-status-select').value;
      const priority = document.getElementById('task-priority-select').value;
      const dueDate = document.getElementById('task-date-input').value || new Date().toISOString().split('T')[0];

      const subtaskFields = subtasksList.querySelectorAll('.subtask-field');
      const subtasks = Array.from(subtaskFields)
        .map((field) => field.value.trim())
        .filter(val => val.length > 0)
        .map((val, idx) => ({ id: `sub-${Date.now()}-${idx}`, title: val, completed: false }));

      if (editTaskId) {
        await store.editTask(editTaskId, {
          title,
          description,
          category,
          status,
          priority,
          dueDate,
          subtasks
        });
      } else {
        await store.addTask({
          title,
          description,
          category,
          status,
          priority,
          dueDate,
          subtasks
        });
      }

      close();
    });
  }
}

function setupHabitModal() {
  const modal = document.getElementById('modal-habit');
  const openBtn = document.getElementById('btn-open-new-habit-modal');
  const closeBtn = document.getElementById('btn-close-habit-modal');
  const cancelBtn = document.getElementById('btn-cancel-habit-modal');
  const form = document.getElementById('form-new-habit');

  const open = () => modal.classList.add('active');
  const close = () => {
    modal.classList.remove('active');
    form.reset();
  };

  if (openBtn) openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (cancelBtn) cancelBtn.addEventListener('click', close);

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('habit-name-input').value.trim();
      if (!name) return;

      const category = document.getElementById('habit-category-select').value;
      const targetDaysPerWeek = document.getElementById('habit-target-input').value;
      const icon = document.getElementById('habit-icon-select').value;

      await store.addHabit({
        name,
        category,
        targetDaysPerWeek,
        icon
      });

      close();
    });
  }
}

function setupSupabaseModal() {
  const modal = document.getElementById('modal-supabase');
  const openBtn = document.getElementById('btn-open-supabase-modal');
  const closeBtn = document.getElementById('btn-close-supabase-modal');
  const form = document.getElementById('form-supabase-config');
  const testBtn = document.getElementById('btn-test-supabase');
  const clearBtn = document.getElementById('btn-clear-supabase');
  const resultDiv = document.getElementById('sb-test-result');

  const urlInput = document.getElementById('sb-url-input');
  const keyInput = document.getElementById('sb-key-input');

  const open = () => {
    const { url, key } = getSupabaseCredentials();
    if (urlInput) urlInput.value = url;
    if (keyInput) keyInput.value = key;
    if (resultDiv) resultDiv.textContent = '';
    modal.classList.add('active');
  };

  const close = () => modal.classList.remove('active');

  if (openBtn) openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);

  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      const url = urlInput.value.trim();
      const key = keyInput.value.trim();
      if (!url || !key) {
        resultDiv.style.color = '#E03E3E';
        resultDiv.textContent = '❌ Please enter both URL and Anon Key.';
        return;
      }

      resultDiv.style.color = '#D9730D';
      resultDiv.textContent = '⏳ Testing connection to Supabase...';

      const res = await testSupabaseConnection(url, key);
      if (res.success) {
        resultDiv.style.color = '#0F7B6C';
        resultDiv.textContent = '✅ Connection successful! Click "Save & Connect".';
      } else {
        resultDiv.style.color = '#E03E3E';
        resultDiv.textContent = `❌ Connection failed: ${res.error}`;
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      saveSupabaseCredentials('', '');
      await store.initSupabaseIfAvailable();
      updateSupabaseStatusBadge(false);
      close();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = urlInput.value.trim();
      const key = keyInput.value.trim();

      saveSupabaseCredentials(url, key);
      const connected = await store.initSupabaseIfAvailable();
      updateSupabaseStatusBadge(connected);

      if (connected) {
        alert('⚡ Supabase connected! Data synced with cloud PostgreSQL.');
      } else {
        alert('Credentials saved, but could not read remote tables. Make sure schema.sql was run in Supabase SQL Editor.');
      }
      close();
    });
  }
}

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}
