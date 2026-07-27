import { store } from '../store.js';

let saveTimeout = null;

export function renderQuickNotes(container) {
  const currentNotes = store.state.notes || '';

  container.innerHTML = `
    <div class="notion-callout">
      <div class="callout-icon">💡</div>
      <div class="callout-content">
        <div class="callout-title">Daily Scratchpad & Quick Notes</div>
        <textarea 
          id="notion-notes-textarea" 
          class="notion-textarea" 
          placeholder="Jot down quick thoughts, meeting notes, daily priorities, or slash commands... (auto-saved)"
        >${escapeHtml(currentNotes)}</textarea>
        <div class="callout-footer" id="notes-save-status">Saved</div>
      </div>
    </div>
  `;

  const textarea = container.querySelector('#notion-notes-textarea');
  const statusEl = container.querySelector('#notes-save-status');

  if (textarea) {
    textarea.addEventListener('input', (e) => {
      const val = e.target.value;
      if (statusEl) statusEl.textContent = 'Saving...';

      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(async () => {
        await store.saveNotes(val);
        if (statusEl) statusEl.textContent = 'Saved to cloud';
      }, 600);
    });
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
