import { store } from '../store.js';
import { playCompleteSound } from '../utils/audio.js';
import confetti from 'canvas-confetti';

export function renderTasks(container) {
  const state = store.state;
  let tasks = (state.tasks || []).filter(t => !t.isDeleted);

  // Apply Search Filter
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    tasks = tasks.filter(t => 
      t.title.toLowerCase().includes(q) || 
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  }

  // Apply Status / View Filter
  const todayStr = new Date().toISOString().split('T')[0];
  if (state.activeFilter === 'today') {
    tasks = tasks.filter(t => t.dueDate === todayStr);
  } else if (state.activeFilter === 'upcoming') {
    tasks = tasks.filter(t => t.dueDate > todayStr && !t.completed);
  } else if (state.activeFilter === 'completed') {
    tasks = tasks.filter(t => t.completed || t.status === 'done');
  } else if (state.activeFilter === 'starred') {
    tasks = tasks.filter(t => t.starred);
  } else if (state.activeFilter === 'overdue') {
    tasks = tasks.filter(t => t.dueDate < todayStr && !t.completed);
  }

  // Apply Category Filter
  if (state.activeCategoryFilter !== 'all') {
    tasks = tasks.filter(t => t.category.toLowerCase() === state.activeCategoryFilter.toLowerCase());
  }

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="check-circle-2" style="width: 44px; height: 44px; opacity: 0.3;"></i>
        <h3 style="margin-top: 12px; font-size: 1rem; font-weight: 600;">No tasks found</h3>
        <p style="font-size: 0.85rem;">Everything is clear or matches no current filter criteria.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const currentView = state.currentDbView || 'table';

  if (currentView === 'table') {
    renderTableView(container, tasks, todayStr);
  } else {
    renderListView(container, tasks, todayStr);
  }

  if (window.lucide) window.lucide.createIcons();

  attachTaskEvents(container);
}

function renderTableView(container, tasks, todayStr) {
  container.innerHTML = `
    <div class="notion-table-wrapper">
      <table class="notion-table">
        <thead>
          <tr>
            <th style="width: 40px;"></th>
            <th>Task Name</th>
            <th style="width: 120px;">Status</th>
            <th style="width: 110px;">Category</th>
            <th style="width: 100px;">Priority</th>
            <th style="width: 120px;">Due Date</th>
            <th style="width: 110px;">Checklist</th>
            <th style="width: 110px; text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map(task => {
            const isDone = task.completed || task.status === 'done';
            const isOverdue = task.dueDate < todayStr && !isDone;
            const subtaskCompletedCount = (task.subtasks || []).filter(st => st.completed).length;

            return `
              <tr class="notion-tr ${isDone ? 'completed' : ''}" data-task-id="${task.id}">
                <td>
                  <div class="custom-checkbox ${isDone ? 'checked' : ''}" data-action="toggle-complete">
                    ${isDone ? '<i data-lucide="check" style="width: 13px; height: 13px;"></i>' : ''}
                  </div>
                </td>
                <td>
                  <div class="notion-cell-title">
                    <span class="task-title-text">${escapeHtml(task.title)}</span>
                    ${task.description ? `<span class="task-title-sub">${escapeHtml(task.description)}</span>` : ''}
                  </div>
                </td>
                <td>
                  <select class="kanban-status-select notion-select-sm" data-action="change-status">
                    <option value="to_do" ${(task.status || 'to_do') === 'to_do' ? 'selected' : ''}>To Do</option>
                    <option value="in_progress" ${(task.status) === 'in_progress' ? 'selected' : ''}>In Progress</option>
                    <option value="done" ${isDone ? 'selected' : ''}>Done</option>
                  </select>
                </td>
                <td><span class="notion-pill ${getCategoryPillClass(task.category)}">${task.category}</span></td>
                <td><span class="notion-pill ${getPriorityPillClass(task.priority)}">${task.priority}</span></td>
                <td>
                  <span class="due-date ${isOverdue ? 'overdue' : ''}">
                    <i data-lucide="calendar" style="width: 13px; height: 13px;"></i>
                    ${task.dueDate === todayStr ? 'Today' : task.dueDate}
                  </span>
                </td>
                <td>
                  ${task.subtasks && task.subtasks.length > 0 ? `
                    <span class="notion-pill notion-badge-gray">
                      ${subtaskCompletedCount}/${task.subtasks.length} subtasks
                    </span>
                  ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">-</span>'}
                </td>
                <td style="text-align: right;">
                  <button class="icon-btn" data-action="edit-task" title="Edit Task">
                    <i data-lucide="edit-2" style="width: 14px; height: 14px;"></i>
                  </button>
                  <button class="icon-btn ${task.starred ? 'starred' : ''}" data-action="toggle-star" title="Star task">
                    <i data-lucide="star" style="width: 14px; height: 14px; fill: ${task.starred ? '#F59E0B' : 'none'};"></i>
                  </button>
                  <button class="icon-btn" data-action="delete-task" title="Move to Trash">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderListView(container, tasks, todayStr) {
  container.innerHTML = tasks.map(task => {
    const isDone = task.completed || task.status === 'done';
    const isOverdue = task.dueDate < todayStr && !isDone;
    const subtaskCompletedCount = (task.subtasks || []).filter(st => st.completed).length;

    return `
      <div class="task-card ${isDone ? 'completed' : ''}" data-task-id="${task.id}">
        <div class="task-header">
          <div class="custom-checkbox ${isDone ? 'checked' : ''}" data-action="toggle-complete">
            ${isDone ? '<i data-lucide="check" style="width: 14px; height: 14px;"></i>' : ''}
          </div>

          <div class="task-main">
            <div class="task-title-row">
              <span class="task-title">${escapeHtml(task.title)}</span>
            </div>
            
            ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}

            <div class="task-tags">
              <span class="notion-pill ${getCategoryPillClass(task.category)}">${task.category}</span>
              <span class="notion-pill ${getPriorityPillClass(task.priority)}">${task.priority}</span>
              <span class="due-date ${isOverdue ? 'overdue' : ''}">
                <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
                ${isOverdue ? 'Overdue: ' + task.dueDate : task.dueDate === todayStr ? 'Today' : task.dueDate}
              </span>
            </div>

            ${task.subtasks && task.subtasks.length > 0 ? `
              <div class="subtasks-list">
                <div style="font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">
                  Checklist (${subtaskCompletedCount}/${task.subtasks.length})
                </div>
                ${task.subtasks.map(st => `
                  <div class="subtask-item ${st.completed ? 'completed' : ''}">
                    <div class="custom-checkbox ${st.completed ? 'checked' : ''}" data-action="toggle-subtask" data-subtask-id="${st.id}" style="width: 15px; height: 15px;">
                      ${st.completed ? '<i data-lucide="check" style="width: 10px; height: 10px;"></i>' : ''}
                    </div>
                    <span>${escapeHtml(st.title)}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <div class="task-actions">
            <button class="icon-btn" data-action="edit-task" title="Edit Task">
              <i data-lucide="edit-2" style="width: 15px; height: 15px;"></i>
            </button>
            <button class="icon-btn ${task.starred ? 'starred' : ''}" data-action="toggle-star">
              <i data-lucide="star" style="width: 15px; height: 15px; fill: ${task.starred ? '#F59E0B' : 'none'};"></i>
            </button>
            <button class="icon-btn" data-action="delete-task" title="Move to Trash">
              <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function attachTaskEvents(container) {
  container.querySelectorAll('[data-task-id]').forEach(el => {
    const taskId = el.dataset.taskId;

    el.addEventListener('click', async (e) => {
      const toggleComplete = e.target.closest('[data-action="toggle-complete"]');
      const toggleSubtask = e.target.closest('[data-action="toggle-subtask"]');
      const toggleStar = e.target.closest('[data-action="toggle-star"]');
      const editBtn = e.target.closest('[data-action="edit-task"]');
      const deleteTask = e.target.closest('[data-action="delete-task"]');
      const changeStatus = e.target.closest('[data-action="change-status"]');

      if (toggleComplete) {
        e.stopPropagation();
        const currentTask = store.state.tasks.find(t => t.id === taskId);
        if (currentTask && !currentTask.completed) {
          playCompleteSound();
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        }
        await store.toggleTaskComplete(taskId);
      } else if (toggleSubtask) {
        e.stopPropagation();
        const subtaskId = toggleSubtask.dataset.subtaskId;
        await store.toggleSubtask(taskId, subtaskId);
      } else if (toggleStar) {
        e.stopPropagation();
        await store.toggleTaskStarred(taskId);
      } else if (editBtn) {
        e.stopPropagation();
        window.openEditTaskModal(taskId);
      } else if (deleteTask) {
        e.stopPropagation();
        await store.softDeleteTask(taskId);
      } else if (changeStatus) {
        e.stopPropagation();
      }
    });

    const statusSelect = el.querySelector('[data-action="change-status"]');
    if (statusSelect) {
      statusSelect.addEventListener('change', async (e) => {
        const newStatus = e.target.value;
        if (newStatus === 'done') {
          playCompleteSound();
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        }
        await store.updateTaskStatus(taskId, newStatus);
      });
    }
  });
}

function getCategoryPillClass(cat) {
  switch ((cat || '').toLowerCase()) {
    case 'work': return 'notion-badge-purple';
    case 'health': return 'notion-badge-green';
    case 'learning': return 'notion-badge-pink';
    case 'finance': return 'notion-badge-amber';
    default: return 'notion-badge-blue';
  }
}

function getPriorityPillClass(prio) {
  switch ((prio || '').toLowerCase()) {
    case 'urgent': return 'notion-badge-red';
    case 'high': return 'notion-badge-amber';
    case 'medium': return 'notion-badge-blue';
    default: return 'notion-badge-gray';
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}
