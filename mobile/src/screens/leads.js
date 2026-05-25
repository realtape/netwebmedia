import { api } from '../api.js';

export async function renderLeads(root) {
  root.innerHTML = `
    <div class="topbar">
      <div class="title">Leads</div>
      <div style="font-size:13px;opacity:0.8" id="lead-count">—</div>
    </div>
    <div class="screen-body" id="list">
      <div class="empty"><div class="icon">⏳</div>Loading leads…</div>
    </div>
  `;

  const list = root.querySelector('#list');
  const count = root.querySelector('#lead-count');

  try {
    const res = await api.leads();
    const leads = Array.isArray(res) ? res : (res.items || res.data || []);
    count.textContent = `${leads.length} total`;

    if (leads.length === 0) {
      list.innerHTML = `
        <div class="empty">
          <div class="icon">📭</div>
          <div style="font-weight:600;margin-bottom:6px;color:var(--text)">No leads yet</div>
          <div>Once the AI qualifies prospects, they'll show up here.</div>
        </div>`;
      return;
    }

    list.innerHTML = '';
    leads.forEach(l => {
      const name = l.name || l.full_name || l.email || 'Unknown';
      const score = Number(l.score || l.qualification_score || 0);
      const meta = [l.company, l.email, l.phone].filter(Boolean).join(' · ');
      const row = document.createElement('div');
      row.className = 'lead';
      row.innerHTML = `
        <div class="lead-score ${score >= 70 ? 'hot' : ''}">${score || '·'}</div>
        <div class="lead-body">
          <div class="lead-name">${escapeHtml(name)}</div>
          <div class="lead-meta">${escapeHtml(meta || '—')}</div>
        </div>
      `;
      list.appendChild(row);
    });
  } catch (err) {
    list.innerHTML = `
      <div class="empty">
        <div class="icon">⚠️</div>
        <div style="font-weight:600;color:var(--text);margin-bottom:6px">Couldn't load leads</div>
        <div>${escapeHtml(err.message)}</div>
      </div>`;
  }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
