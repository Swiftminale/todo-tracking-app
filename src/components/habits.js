import { store } from '../store.js';
import { playCompleteSound } from '../utils/audio.js';

export function renderHabits(container) {
  const habits = (store.state.habits || []).filter(h => !h.isDeleted);

  if (!habits || habits.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="flame" style="width: 44px; height: 44px; opacity: 0.3;"></i>
        <h3 style="margin-top: 12px; font-weight: 600;">No active habits</h3>
        <p>Create daily habits to track your consistency and build streaks!</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // Generate last 7 days headers
  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({
      dateStr: d.toISOString().split('T')[0],
      dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      isToday: i === 0
    });
  }

  container.innerHTML = `
    <div class="habits-grid">
      ${habits.map(habit => `
        <div class="habit-card" data-habit-id="${habit.id}">
          <div class="habit-header">
            <div class="habit-title-box">
              <div class="habit-icon-wrap">
                <i data-lucide="${habit.icon || 'activity'}" style="width: 20px; height: 20px;"></i>
              </div>
              <div>
                <h4 style="font-weight: 600; font-size: 0.98rem; margin-bottom: 2px;">${escapeHtml(habit.name)}</h4>
                <span style="font-size: 0.78rem; color: var(--text-secondary);">${habit.category} • Target: ${habit.targetDaysPerWeek}x/week</span>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 6px;">
              <div class="habit-streak">
                <i data-lucide="flame" style="width: 14px; height: 14px; fill: #D9730D;"></i>
                <span>${habit.streak} day streak</span>
              </div>
              <button class="icon-btn" data-action="delete-habit" title="Move to Trash">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
              </button>
            </div>
          </div>

          <div class="habit-days-row">
            ${days.map(day => {
              const isChecked = !!(habit.history && habit.history[day.dateStr]);
              return `
                <button class="day-check-btn ${isChecked ? 'checked' : ''}" data-date="${day.dateStr}">
                  <span style="font-weight: ${day.isToday ? '700' : '500'}; color: ${day.isToday ? 'var(--accent-primary)' : 'inherit'};">${day.dayLabel}</span>
                  <div class="day-circle">
                    ${isChecked ? '<i data-lucide="check" style="width: 12px; height: 12px;"></i>' : day.dayNumber}
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Attach event handlers
  container.querySelectorAll('.habit-card').forEach(card => {
    const habitId = card.dataset.habitId;

    const deleteBtn = card.querySelector('[data-action="delete-habit"]');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await store.softDeleteHabit(habitId);
      });
    }

    card.querySelectorAll('.day-check-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const dateStr = btn.dataset.date;
        const willBeChecked = !btn.classList.contains('checked');
        if (willBeChecked) {
          playCompleteSound();
        }
        await store.toggleHabitCheckIn(habitId, dateStr);
      });
    });
  });
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
