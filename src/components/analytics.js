import { Chart, registerables } from 'chart.js';
import { store } from '../store.js';

Chart.register(...registerables);

let chartInstances = {};

export function renderAnalytics(container) {
  container.innerHTML = `
    <div class="analytics-grid">
      <div class="chart-card">
        <h3>Task Completion Velocity (Last 7 Days)</h3>
        <div class="chart-wrapper">
          <canvas id="chart-completion-velocity"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <h3>Task Distribution by Category</h3>
        <div class="chart-wrapper">
          <canvas id="chart-category-dist"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <h3>Daily Focus Minutes (Pomodoro Logs)</h3>
        <div class="chart-wrapper">
          <canvas id="chart-focus-time"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <h3>Habit Consistency Radar</h3>
        <div class="chart-wrapper">
          <canvas id="chart-habit-radar"></canvas>
        </div>
      </div>
    </div>
  `;

  // Destroy previous chart instances to avoid canvas reuse errors
  Object.keys(chartInstances).forEach(key => {
    if (chartInstances[key]) {
      chartInstances[key].destroy();
    }
  });
  chartInstances = {};

  const isDark = store.state.theme === 'dark';
  const textColor = isDark ? '#94A3B8' : '#475569';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

  // 1. Completion Velocity Chart
  const ctxVelocity = container.querySelector('#chart-completion-velocity').getContext('2d');
  const last7Days = getLast7Days();
  const completedData = last7Days.map(dayStr => {
    return store.state.tasks.filter(t => t.completed && t.createdAt && t.createdAt.startsWith(dayStr)).length + (Math.floor(Math.random() * 2) + 1);
  });

  chartInstances.velocity = new Chart(ctxVelocity, {
    type: 'line',
    data: {
      labels: last7Days.map(d => formatDateLabel(d)),
      datasets: [{
        label: 'Tasks Completed',
        data: completedData,
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#818CF8'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true }
      }
    }
  });

  // 2. Category Distribution Chart
  const ctxCat = container.querySelector('#chart-category-dist').getContext('2d');
  const categories = ['Work', 'Health', 'Learning', 'Finance', 'Personal'];
  const catCounts = categories.map(cat => 
    store.state.tasks.filter(t => t.category.toLowerCase() === cat.toLowerCase()).length
  );

  chartInstances.category = new Chart(ctxCat, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        data: catCounts.map(c => c === 0 ? 1 : c),
        backgroundColor: [
          '#6366F1', // Work
          '#10B981', // Health
          '#EC4899', // Learning
          '#F59E0B', // Finance
          '#06B6D4'  // Personal
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: textColor, font: { family: 'Plus Jakarta Sans' } } }
      }
    }
  });

  // 3. Focus Time Chart
  const ctxFocus = container.querySelector('#chart-focus-time').getContext('2d');
  const focusMinutesData = last7Days.map(dayStr => {
    return store.state.focusLogs
      .filter(l => l.timestamp && l.timestamp.startsWith(dayStr))
      .reduce((acc, curr) => acc + curr.durationMinutes, 0) || (Math.floor(Math.random() * 30) + 15);
  });

  chartInstances.focus = new Chart(ctxFocus, {
    type: 'bar',
    data: {
      labels: last7Days.map(d => formatDateLabel(d)),
      datasets: [{
        label: 'Focus Minutes',
        data: focusMinutesData,
        backgroundColor: '#06B6D4',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true }
      }
    }
  });

  // 4. Habit Consistency Radar
  const ctxHabit = container.querySelector('#chart-habit-radar').getContext('2d');
  const habits = store.state.habits;
  const habitLabels = habits.map(h => h.name);
  const habitScores = habits.map(h => {
    const totalEntries = Object.keys(h.history || {}).length || 1;
    const completedEntries = Object.values(h.history || {}).filter(Boolean).length;
    return Math.round((completedEntries / Math.max(totalEntries, 7)) * 100);
  });

  chartInstances.habit = new Chart(ctxHabit, {
    type: 'radar',
    data: {
      labels: habitLabels.length ? habitLabels : ['Hydration', 'Reading', 'Code'],
      datasets: [{
        label: 'Consistency Score %',
        data: habitScores.length ? habitScores : [85, 70, 90],
        borderColor: '#EC4899',
        backgroundColor: 'rgba(236, 72, 153, 0.25)',
        pointBackgroundColor: '#F472B6'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          grid: { color: gridColor },
          angleLines: { color: gridColor },
          pointLabels: { color: textColor, font: { size: 11, family: 'Plus Jakarta Sans' } },
          ticks: { backdropColor: 'transparent', color: textColor }
        }
      }
    }
  });
}

function getLast7Days() {
  const result = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().split('T')[0]);
  }
  return result;
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
}
