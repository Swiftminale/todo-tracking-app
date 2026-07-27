import { store } from '../store.js';

export function renderRecycleBin(container) {
  const state = store.state;
  const trashedTasks = (state.tasks || []).filter(t => t.isDeleted);
  const trashedHabits = (state.habits || []).filter(h => h.isDeleted);

  const totalTrashed = trashedTasks.length + trashedHabits.length;

  if (totalTrashed === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="trash-2" style="width: 44px; height: 44px; opacity: 0.3;"></i>
        <h3 style="margin-top: 12px; font-size: 1rem; font-weight: 600;">Recycle Bin is Empty</h3>
        <p style="font-size: 0.85rem;">Deleted tasks and habits will appear here so you can restore or permanently delete them.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
      <div style="font-size: 0.88rem; color: var(--text-secondary);">
        Items in the Recycle Bin (${totalTrashed})
      </div>
      <button class="btn-secondary" id="btn-empty-trash" style="color: var(--accent-red); font-size: 0.82rem;">
        <i data-lucide="trash" style="width: 14px; height: 14px;"></i> Empty Recycle Bin
      </button>
    </div>

    <div class="notion-table-wrapper">
      <table class="notion-table">
        <thead>
          <tr>
            <th>Item Name</th>
            <th style="width: 110px;">Type</th>
            <th style="width: 120px;">Category</th>
            <th style="width: 160px;">Deleted Date</th>
            <th style="width: 140px; text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${trashedTasks.map(t => `
            <tr class="notion-tr" data-item-id="${t.id}" data-item-type="task">
              <td>
                <div class="notion-cell-title">
                  <span class="task-title-text">${escapeHtml(t.title)}</span>
                  ${t.description ? `<span class="task-title-sub">${escapeHtml(t.description)}</span>` : ''}
                </div>
              </td>
              <td><span class="notion-pill notion-badge-blue">Task</span></td>
              <td><span class="notion-pill notion-badge-gray">${t.category}</span></td>
              <td style="color: var(--text-muted); font-size: 0.78rem;">
                ${t.deletedAt ? new Date(t.deletedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
              </td>
              <td style="text-align: right;">
                <button class="btn-secondary" data-action="restore-item" style="padding: 4px 8px; font-size: 0.75rem; color: var(--accent-green);">
                  <i data-lucide="rotate-ccw" style="width: 12px; height: 12px;"></i> Restore
                </button>
                <button class="icon-btn" data-action="permanent-delete" title="Permanently Delete" style="color: var(--accent-red);">
                  <i data-lucide="x" style="width: 14px; height: 14px;"></i>
                </button>
              </td>
            </tr>
          `).join('')}

          ${trashedHabits.map(h => `
            <tr class="notion-tr" data-item-id="${h.id}" data-item-type="habit">
              <td>
                <div class="notion-cell-title">
                  <span class="task-title-text">${escapeHtml(h.name)}</span>
                </div>
              </td>
              <td><span class="notion-pill notion-badge-pink">Habit</span></td>
              <td><span class="notion-pill notion-badge-gray">${h.category}</span></td>
              <td style="color: var(--text-muted); font-size: 0.78rem;">
                ${h.deletedAt ? new Date(h.deletedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
              </td>
              <td style="text-align: right;">
                <button class="btn-secondary" data-action="restore-item" style="padding: 4px 8px; font-size: 0.75rem; color: var(--accent-green);">
                  <i data-lucide="rotate-ccw" style="width: 12px; height: 12px;"></i> Restore
                </button>
                <button class="icon-btn" data-action="permanent-delete" title="Permanently Delete" style="color: var(--accent-red);">
                  <i data-lucide="x" style="width: 14px; height: 14px;"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  const emptyBtn = container.querySelector('#btn-empty-trash');
  if (emptyBtn) {
    emptyBtn.addEventListener('click', async () => {
      if (confirm('Permanently delete all items in the Recycle Bin? This action cannot be undone.')) {
        await store.emptyRecycleBin();
        renderRecycleBin(container);
      }
    });
  }

  container.querySelectorAll('tr[data-item-id]').forEach(row => {
    const itemId = row.dataset.itemId;
    const itemType = row.dataset.itemType;

    const restoreBtn = row.querySelector('[data-action="restore-item"]');
    const permDeleteBtn = row.querySelector('[data-action="permanent-delete"]');

    if (restoreBtn) {
      restoreBtn.addEventListener('click', async () => {
        if (itemType === 'task') {
          await store.restoreTask(itemId);
        } else {
          await store.restoreHabit(itemId);
        }
        renderRecycleBin(container);
      });
    }

    if (permDeleteBtn) {
      permDeleteBtn.addEventListener('click', async () => {
        if (confirm('Permanently delete this item?')) {
          if (itemType === 'task') {
            await store.permanentlyDeleteTask(itemId);
          } else {
            await store.permanentlyDeleteHabit(itemId);
          }
          renderRecycleBin(container);
        }
      });
    }
  });
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
