import { store } from '../store.js';
import { playTimerBellSound, playClickSound } from '../utils/audio.js';
import confetti from 'canvas-confetti';

let timerInterval = null;
let currentMode = 'work'; // 'work', 'shortBreak', 'longBreak'
let timeLeft = 25 * 60; // seconds
let isRunning = false;
let selectedTaskId = null;

const MODES = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60
};

export function setupTimer(container) {
  renderTimerUI(container);
}

function renderTimerUI(container) {
  const pendingTasks = store.state.tasks.filter(t => !t.completed);

  container.innerHTML = `
    <div class="timer-container">
      <div class="timer-modes">
        <button class="mode-btn ${currentMode === 'work' ? 'active' : ''}" data-mode="work">Deep Focus (25m)</button>
        <button class="mode-btn ${currentMode === 'shortBreak' ? 'active' : ''}" data-mode="shortBreak">Short Break (5m)</button>
        <button class="mode-btn ${currentMode === 'longBreak' ? 'active' : ''}" data-mode="longBreak">Long Break (15m)</button>
      </div>

      <div class="timer-display" id="timer-display-text">
        ${formatTime(timeLeft)}
      </div>

      <div class="timer-controls">
        <button class="btn-timer-primary" id="btn-timer-start-pause">
          ${isRunning ? 'Pause' : 'Start'}
        </button>
        <button class="btn-secondary" id="btn-timer-reset">
          <i data-lucide="rotate-ccw" style="width: 18px; height: 18px;"></i> Reset
        </button>
      </div>

      <div class="form-group" style="width: 100%; max-width: 380px;">
        <label style="margin-bottom: 6px; font-size: 0.85rem; color: var(--text-secondary);">Focusing on Task:</label>
        <select class="task-selector-select" id="timer-task-select">
          <option value="">-- General Unscheduled Focus --</option>
          ${pendingTasks.map(t => `
            <option value="${t.id}" ${selectedTaskId === t.id ? 'selected' : ''}>
              ${t.title} (${t.estimatedMinutes || 30}m)
            </option>
          `).join('')}
        </select>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Attach button event listeners
  const startPauseBtn = container.querySelector('#btn-timer-start-pause');
  const resetBtn = container.querySelector('#btn-timer-reset');
  const taskSelect = container.querySelector('#timer-task-select');

  startPauseBtn.addEventListener('click', () => {
    playClickSound();
    if (isRunning) {
      pauseTimer(startPauseBtn);
    } else {
      startTimer(startPauseBtn, container);
    }
  });

  resetBtn.addEventListener('click', () => {
    playClickSound();
    resetTimer(startPauseBtn, container);
  });

  taskSelect.addEventListener('change', (e) => {
    selectedTaskId = e.target.value || null;
  });

  container.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playClickSound();
      const mode = btn.dataset.mode;
      switchMode(mode, container);
    });
  });
}

function switchMode(mode, container) {
  pauseTimer();
  currentMode = mode;
  timeLeft = MODES[mode];
  renderTimerUI(container);
}

function startTimer(startPauseBtn, container) {
  if (isRunning) return;
  isRunning = true;
  if (startPauseBtn) startPauseBtn.textContent = 'Pause';

  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplayText();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      isRunning = false;
      playTimerBellSound();
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });

      // Log Session to Store
      const duration = Math.round(MODES[currentMode] / 60);
      let taskTitle = 'Deep Focus Session';
      if (selectedTaskId) {
        const t = store.state.tasks.find(x => x.id === selectedTaskId);
        if (t) taskTitle = t.title;
      }
      store.logFocusSession(duration, taskTitle);

      alert(`Focus Session Completed! Awesome job on "${taskTitle}". Take a break!`);
      resetTimer(startPauseBtn, container);
    }
  }, 1000);
}

function pauseTimer(startPauseBtn) {
  if (!isRunning) return;
  clearInterval(timerInterval);
  isRunning = false;
  if (startPauseBtn) startPauseBtn.textContent = 'Start';
}

function resetTimer(startPauseBtn, container) {
  pauseTimer(startPauseBtn);
  timeLeft = MODES[currentMode];
  renderTimerUI(container);
}

function updateDisplayText() {
  const displayEl = document.getElementById('timer-display-text');
  if (displayEl) {
    displayEl.textContent = formatTime(timeLeft);
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
