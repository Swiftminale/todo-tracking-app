import { store } from '../store.js';
import { playCompleteSound } from '../utils/audio.js';
import confetti from 'canvas-confetti';

export function renderKanbanBoard(container) {
  let tasks = filterTasks((store.state.tasks || []).filter(t => !t.isDeleted));

  const columns = [
    { id: 'to_do', title: 'To Do', badgeClass: 'notion-badge-gray', count: 0 },
    { id: 'in_progress', title: 'In Progress', badgeClass: 'notion-badge-blue', count: 0 },
    { id: 'done', title: 'Done', badgeClass: 'notion-badge-green', count: 0 }
  ];

  columns.forEach(col => {
    col.count = tasks.filter(t => (t.status || (t.completed ? 'done' : 'to_do')) === col.id).length;
  });

  container.innerHTML = `
    <div class="kanban-board">
      ${columns.map(col => {
        const colTasks = tasks.filter(t => (t.status || (t.completed ? 'done' : 'to_do')) === col.id);
        return `
          <div class="kanban-column" data-column-id="${col.id}">
            <div class="kanban-column-header">
              <span class="notion-pill ${col.badgeClass}">${col.title}</span>
              <span class="column-count">${col.count}</span>
            </div>
            
            <div class="kanban-cards-list">
              ${colTasks.length === 0 ? `
                <div class="kanban-empty-card">No tasks</div>
              ` : colTasks.map(task => renderKanbanCard(task)).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Attach event handlers for status updates, edit, and soft delete
  container.querySelectorAll('.kanban-card').forEach(card => {
    const taskId = card.dataset.taskId;

    card.addEventListener('click', async (e) => {
      const statusSelect = e.target.closest('.kanban-status-select');
      const starBtn = e.target.closest('[data-action="star-task"]');
      const editBtn = e.target.closest('[data-action="edit-task"]');
      const deleteBtn = e.target.closest('[data-action="delete-task"]');

      if (statusSelect) {
        e.stopPropagation();
      } else if (starBtn) {
        e.stopPropagation();
        await store.toggleTaskStarred(taskId);
      } else if (editBtn) {
        e.stopPropagation();
        window.openEditTaskModal(taskId);
      } else if (deleteBtn) {
        e.stopPropagation();
        await store.softDeleteTask(taskId);
      }
    });

    const statusSelect = card.querySelector('.kanban-status-select');
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

function renderKanbanCard(task) {
  const catClass = getCategoryPillClass(task.category);
  const prioClass = getPriorityPillClass(task.priority);
  const subtasksDone = (task.subtasks || []).filter(st => st.completed).length;

  return `
    <div class="kanban-card ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
      <div class="kanban-card-title-row">
        <span class="kanban-card-title">${escapeHtml(task.title)}</span>
        <div style="display: flex; gap: 2px;">
          <button class="icon-btn" data-action="edit-task" title="Edit Task">
            <i data-lucide="edit-2" style="width: 13px; height: 13px;"></i>
          </button>
          <button class="icon-btn ${task.starred ? 'starred' : ''}" data-action="star-task" title="Star task">
            <i data-lucide="star" style="width: 13px; height: 13px; fill: ${task.starred ? '#F59E0B' : 'none'};"></i>
          </button>
          <button class="icon-btn" data-action="delete-task" title="Move to Trash">
            <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
          </button>
        </div>
      </div>

      ${task.description ? `<p class="kanban-card-desc">${escapeHtml(task.description)}</p>` : ''}

      <div class="kanban-card-properties">
        <select class="kanban-status-select notion-select-sm">
          <option value="to_do" ${(task.status || 'to_do') === 'to_do' ? 'selected' : ''}>To Do</option>
          <option value="in_progress" ${(task.status) === 'in_progress' ? 'selected' : ''}>In Progress</option>
          <option value="done" ${(task.status) === 'done' || task.completed ? 'selected' : ''}>Done</option>
        </select>

        <span class="notion-pill ${catClass}">${task.category}</span>
        <span class="notion-pill ${prioClass}">${task.priority}</span>

        ${task.subtasks && task.subtasks.length > 0 ? `
          <span class="notion-pill notion-badge-gray" style="font-size: 0.72rem;">
            <i data-lucide="check-square" style="width: 11px; height: 11px; margin-right: 3px;"></i>
            ${subtasksDone}/${task.subtasks.length}
          </span>
        ` : ''}
      </div>
    </div>
  `;
}

function filterTasks(tasks) {
  const state = store.state;
  let result = [...tasks];

  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    result = result.filter(t => 
      t.title.toLowerCase().includes(q) || 
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  if (state.activeFilter === 'today') {
    result = result.filter(t => t.dueDate === todayStr);
  } else if (state.activeFilter === 'upcoming') {
    result = result.filter(t => t.dueDate > todayStr && !t.completed);
  } else if (state.activeFilter === 'completed') {
    result = result.filter(t => t.completed || t.status === 'done');
  } else if (state.activeFilter === 'starred') {
    result = result.filter(t => t.starred);
  } else if (state.activeFilter === 'overdue') {
    result = result.filter(t => t.dueDate < todayStr && !t.completed);
  }

  if (state.activeCategoryFilter !== 'all') {
    result = result.filter(t => t.category.toLowerCase() === state.activeCategoryFilter.toLowerCase());
  }

  return result;
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
