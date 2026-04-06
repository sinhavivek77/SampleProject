/* ════════════════════════════════════════════════════════════════════════════
   Project Tracking Dashboard – app.js
   ════════════════════════════════════════════════════════════════════════════ */

'use strict';

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'ptd_projects';

function loadProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(SEED_DATA));
  } catch {
    return JSON.parse(JSON.stringify(SEED_DATA));
  }
}

function saveProjects(projects) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  projects: [],
  view: 'dashboard',          // 'dashboard' | 'list'
  filters: { search: '', status: '', priority: '' },
  sort: { field: null, dir: 'asc' },
  editingId: null,            // null = new project
  modalOpen: false,
  pendingDeleteId: null
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function timeAgo(isoStr) {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 2)   return 'just now';
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 7)   return `${days}d ago`;
  if (days  < 30)  return `${Math.floor(days/7)}w ago`;
  return formatDate(isoStr.slice(0, 10));
}

function daysOverdue(endDate) {
  if (!endDate) return 0;
  const diff = Date.now() - new Date(endDate + 'T00:00:00').getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

function isOverdue(p) {
  return p.endDate
    && p.status !== STATUS.COMPLETED
    && p.status !== STATUS.CANCELLED
    && new Date(p.endDate + 'T00:00:00') < new Date(todayStr() + 'T00:00:00');
}

function worstSeverity(risks) {
  const order = ['Critical', 'High', 'Medium', 'Low'];
  for (const sev of order) {
    if (risks.some(r => r.severity === sev)) return sev;
  }
  return null;
}

function statusClass(status) {
  return 'badge-status-' + status.toLowerCase().replace(/\s+/g, '-');
}

function priorityClass(priority) {
  return 'badge-priority-' + priority.toLowerCase();
}

function severityClass(severity) {
  return 'badge-severity-' + severity.toLowerCase();
}

function riskCountClass(risks) {
  const worst = worstSeverity(risks);
  if (!worst) return 'badge-priority-low';
  return severityClass(worst);
}

function escape(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Attention Logic ──────────────────────────────────────────────────────────

function getAttentionFlags(p) {
  const flags = [];
  if (isOverdue(p))                                      flags.push('overdue');
  if (p.status === STATUS.AT_RISK)                       flags.push('atrisk');
  if (p.priority === PRIORITY.CRITICAL
    && p.status !== STATUS.COMPLETED
    && p.status !== STATUS.CANCELLED)                    flags.push('critical');
  return flags;
}

function needsAttention(p) {
  return getAttentionFlags(p).length > 0;
}

function attentionSort(a, b) {
  const order = { overdue: 0, atrisk: 1, critical: 2 };
  const fa = getAttentionFlags(a);
  const fb = getAttentionFlags(b);
  const wa = fa.length ? order[fa[0]] : 99;
  const wb = fb.length ? order[fb[0]] : 99;
  if (wa !== wb) return wa - wb;
  // Secondary: most overdue first
  return daysOverdue(b.endDate) - daysOverdue(a.endDate);
}

// ─── Filtering & Sorting ──────────────────────────────────────────────────────

function applyFilters(projects) {
  const { search, status, priority } = state.filters;
  return projects.filter(p => {
    if (status   && p.status   !== status)   return false;
    if (priority && p.priority !== priority) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = [p.name, p.description, p.ae, p.architect,
        p.leadDeveloper, p.businessSponsor].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

function applySort(projects) {
  const { field, dir } = state.sort;
  if (!field) return [...projects];
  return [...projects].sort((a, b) => {
    let va = a[field] ?? '';
    let vb = b[field] ?? '';
    if (field === 'endDate' || field === 'startDate' || field === 'lastUpdated') {
      va = va || '9999';
      vb = vb || '9999';
    }
    const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
    return dir === 'asc' ? cmp : -cmp;
  });
}

// ─── Views ────────────────────────────────────────────────────────────────────

function setView(view) {
  state.view = view;
  document.getElementById('view-dashboard').classList.toggle('active', view === 'dashboard');
  document.getElementById('view-list').classList.toggle('active', view === 'list');
  document.getElementById('nav-dashboard').classList.toggle('active', view === 'dashboard');
  document.getElementById('nav-list').classList.toggle('active', view === 'list');
  if (view === 'dashboard') renderDashboard();
  else renderList();
}

// ─── Dashboard Render ─────────────────────────────────────────────────────────

function renderDashboard() {
  const ps = state.projects;
  const today = todayStr();

  // Metrics
  const total       = ps.length;
  const inProgress  = ps.filter(p => p.status === STATUS.IN_PROGRESS).length;
  const atRisk      = ps.filter(p => p.status === STATUS.AT_RISK).length;
  const overdueCnt  = ps.filter(p => isOverdue(p)).length;
  const completed   = ps.filter(p => p.status === STATUS.COMPLETED).length;

  document.getElementById('metric-total').textContent       = total;
  document.getElementById('metric-inprogress').textContent  = inProgress;
  document.getElementById('metric-atrisk').textContent      = atRisk;
  document.getElementById('metric-overdue').textContent     = overdueCnt;
  document.getElementById('metric-completed').textContent   = completed;

  // Attention panel
  const attention = ps.filter(needsAttention).sort(attentionSort);
  document.getElementById('attention-count').textContent = attention.length;
  const attentionBody = document.getElementById('attention-body');
  if (attention.length === 0) {
    attentionBody.innerHTML = `
      <div class="panel-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
        All clear — no projects need immediate attention.
      </div>`;
  } else {
    attentionBody.innerHTML = attention.map(p => {
      const flags    = getAttentionFlags(p);
      const flagClass = `flag-${flags[0]}`;
      const od       = daysOverdue(p.endDate);
      const worst    = worstSeverity(p.risks);
      const reasons  = [];
      if (flags.includes('overdue'))   reasons.push(`<span class="overdue-tag">${od}d overdue</span>`);
      if (flags.includes('atrisk'))    reasons.push(`<span class="badge badge-status-at-risk">At Risk</span>`);
      if (flags.includes('critical'))  reasons.push(`<span class="badge badge-priority-critical">Critical</span>`);

      return `
        <div class="attention-card ${flagClass}" data-id="${escape(p.id)}" onclick="editProject('${escape(p.id)}')">
          <div class="attention-card-top">
            <div class="attention-card-name">${escape(p.name)}</div>
            <span class="badge ${statusClass(p.status)}">${escape(p.status)}</span>
          </div>
          <div class="attention-card-meta">
            ${reasons.join('')}
            ${worst ? `<span class="badge ${severityClass(worst)}">${escape(worst)} risk</span>` : ''}
          </div>
          <div class="attention-card-reason">
            ${p.leadDeveloper ? `Lead: ${escape(p.leadDeveloper)}` : ''}
            ${p.endDate ? ` · Due ${formatDate(p.endDate)}` : ''}
          </div>
        </div>`;
    }).join('');
  }

  // Recent panel – last 8 updated
  const recent = [...ps].sort((a, b) =>
    new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0)
  ).slice(0, 8);
  const recentBody = document.getElementById('recent-body');
  recentBody.innerHTML = recent.map(p => `
    <div class="recent-item" onclick="editProject('${escape(p.id)}')">
      <span class="badge ${statusClass(p.status)}">${escape(p.status)}</span>
      <span class="recent-item-name">${escape(p.name)}</span>
      <span class="recent-item-time">${timeAgo(p.lastUpdated)}</span>
    </div>
  `).join('');
}

// ─── List Render ──────────────────────────────────────────────────────────────

function renderList() {
  const filtered = applySort(applyFilters(state.projects));
  document.getElementById('filter-count').textContent =
    `${filtered.length} of ${state.projects.length} project${state.projects.length !== 1 ? 's' : ''}`;

  const tbody = document.getElementById('projects-tbody');
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="table-empty">No projects match your filters.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const od = daysOverdue(p.endDate);
    const dateClass = od > 0 ? 'date-cell overdue' : 'date-cell';
    const riskBadge = p.risks.length > 0
      ? `<span class="badge risk-count-badge ${riskCountClass(p.risks)}">${p.risks.length}</span>`
      : `<span style="color:var(--color-text-muted);font-size:12px">—</span>`;
    return `
      <tr data-id="${escape(p.id)}" onclick="editProject('${escape(p.id)}')">
        <td class="project-name-cell"><span title="${escape(p.name)}">${escape(p.name)}</span></td>
        <td><span class="badge ${statusClass(p.status)}">${escape(p.status)}</span></td>
        <td><span class="badge ${priorityClass(p.priority)}">${escape(p.priority)}</span></td>
        <td class="person-cell col-ae">${escape(p.ae) || '—'}</td>
        <td class="person-cell col-architect">${escape(p.architect) || '—'}</td>
        <td class="person-cell">${escape(p.leadDeveloper) || '—'}</td>
        <td class="${dateClass}">${p.endDate ? formatDate(p.endDate) + (od > 0 ? ` <small>(${od}d late)</small>` : '') : '—'}</td>
        <td>${riskBadge}</td>
        <td class="date-cell">${timeAgo(p.lastUpdated)}</td>
      </tr>`;
  }).join('');
}

// ─── Sort ─────────────────────────────────────────────────────────────────────

function setSort(field) {
  if (state.sort.field === field) {
    state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    state.sort = { field, dir: 'asc' };
  }
  updateSortHeaders();
  renderList();
}

function updateSortHeaders() {
  document.querySelectorAll('.projects-table th.sortable').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    const icon = th.querySelector('.sort-icon');
    if (th.dataset.sort === state.sort.field) {
      th.classList.add('sort-' + state.sort.dir);
      if (icon) icon.textContent = state.sort.dir === 'asc' ? '↑' : '↓';
    } else {
      if (icon) icon.textContent = '↕';
    }
  });
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function openModal(id) {
  state.editingId = id || null;
  state.modalOpen = true;
  const project = id ? state.projects.find(p => p.id === id) : null;
  renderModal(project);
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('modal-title').textContent = project ? `Edit: ${project.name}` : 'New Project';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  state.modalOpen = false;
  state.editingId = null;
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function renderModal(p) {
  const f = p || {};
  const risks = f.risks || [];

  document.getElementById('field-name').value            = f.name || '';
  document.getElementById('field-description').value     = f.description || '';
  document.getElementById('field-status').value          = f.status || STATUS.NOT_STARTED;
  document.getElementById('field-priority').value        = f.priority || PRIORITY.MEDIUM;
  document.getElementById('field-start-date').value      = f.startDate || '';
  document.getElementById('field-end-date').value        = f.endDate || '';
  document.getElementById('field-ae').value              = f.ae || '';
  document.getElementById('field-business-sponsor').value= f.businessSponsor || '';
  document.getElementById('field-architect').value       = f.architect || '';
  document.getElementById('field-lead-dev').value        = f.leadDeveloper || '';

  renderRisks(risks);

  // Show delete button only when editing
  const deleteBtn = document.getElementById('btn-delete');
  deleteBtn.style.display = p ? 'inline-flex' : 'none';

  // Clear errors
  document.querySelectorAll('.form-error').forEach(el => el.classList.remove('visible'));
  document.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));
}

function renderRisks(risks) {
  const container = document.getElementById('risk-list');
  container.innerHTML = risks.map((r, i) => buildRiskRow(r, i)).join('');
}

function buildRiskRow(r, idx) {
  const sevOptions = SEVERITY_LIST.map(s =>
    `<option value="${s}" ${r.severity === s ? 'selected' : ''}>${escape(s)}</option>`
  ).join('');
  return `
    <div class="risk-row" data-risk-idx="${idx}">
      <div class="risk-row-fields">
        <div class="form-field">
          <label class="form-label">Description <span class="required">*</span></label>
          <input class="form-control risk-desc" type="text" placeholder="Describe the risk…" value="${escape(r.description || '')}">
        </div>
        <div class="form-field risk-severity-col">
          <label class="form-label">Severity</label>
          <select class="form-control risk-sev">${sevOptions}</select>
        </div>
        <div class="form-field risk-mitigation">
          <label class="form-label">Mitigation Plan</label>
          <input class="form-control risk-mit" type="text" placeholder="Mitigation or owner…" value="${escape(r.mitigation || '')}">
        </div>
      </div>
      <div class="risk-remove-col">
        <button type="button" class="btn-icon" title="Remove risk" onclick="removeRiskRow(this)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>`;
}

function addRiskRow() {
  const container = document.getElementById('risk-list');
  const idx = container.children.length;
  const div = document.createElement('div');
  div.innerHTML = buildRiskRow({ severity: SEVERITY.MEDIUM }, idx);
  container.appendChild(div.firstElementChild);
}

function removeRiskRow(btn) {
  btn.closest('.risk-row').remove();
}

function collectRisks() {
  return Array.from(document.querySelectorAll('#risk-list .risk-row')).map(row => ({
    id: row.dataset.riskId || uid(),
    description: row.querySelector('.risk-desc').value.trim(),
    severity:    row.querySelector('.risk-sev').value,
    mitigation:  row.querySelector('.risk-mit').value.trim()
  })).filter(r => r.description);
}

// ─── Save / Delete ────────────────────────────────────────────────────────────

function saveProject() {
  const name   = document.getElementById('field-name').value.trim();
  const status = document.getElementById('field-status').value;
  const start  = document.getElementById('field-start-date').value;
  const end    = document.getElementById('field-end-date').value;
  let valid = true;

  // Validate name
  const nameErr = document.getElementById('error-name');
  const nameCtrl = document.getElementById('field-name');
  if (!name) {
    nameErr.classList.add('visible'); nameCtrl.classList.add('error'); valid = false;
  } else {
    nameErr.classList.remove('visible'); nameCtrl.classList.remove('error');
  }

  // Validate dates
  const dateErr = document.getElementById('error-date');
  if (start && end && end < start) {
    dateErr.classList.add('visible');
    document.getElementById('field-end-date').classList.add('error');
    valid = false;
  } else {
    dateErr.classList.remove('visible');
    document.getElementById('field-end-date').classList.remove('error');
  }

  if (!valid) return;

  const project = {
    id:              state.editingId || uid(),
    name,
    description:     document.getElementById('field-description').value.trim(),
    status,
    priority:        document.getElementById('field-priority').value,
    startDate:       start,
    endDate:         end,
    ae:              document.getElementById('field-ae').value.trim(),
    businessSponsor: document.getElementById('field-business-sponsor').value.trim(),
    architect:       document.getElementById('field-architect').value.trim(),
    leadDeveloper:   document.getElementById('field-lead-dev').value.trim(),
    risks:           collectRisks(),
    lastUpdated:     new Date().toISOString()
  };

  if (state.editingId) {
    const idx = state.projects.findIndex(p => p.id === state.editingId);
    if (idx !== -1) state.projects[idx] = project;
  } else {
    state.projects.unshift(project);
  }

  saveProjects(state.projects);
  closeModal();
  showToast('Project saved successfully.', 'success');

  if (state.view === 'dashboard') renderDashboard();
  else renderList();
}

function editProject(id) {
  openModal(id);
}

function confirmDeleteProject() {
  const id = state.editingId;
  if (!id) return;
  const p = state.projects.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
  state.projects = state.projects.filter(x => x.id !== id);
  saveProjects(state.projects);
  closeModal();
  showToast('Project deleted.', 'success');
  if (state.view === 'dashboard') renderDashboard();
  else renderList();
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(msg, type = '') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 3000);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  state.projects = loadProjects();

  // Nav
  document.getElementById('nav-dashboard').addEventListener('click', () => setView('dashboard'));
  document.getElementById('nav-list').addEventListener('click', () => setView('list'));

  // New project button
  document.getElementById('btn-new-project').addEventListener('click', () => openModal(null));

  // Modal close
  document.getElementById('btn-modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });
  document.getElementById('btn-modal-cancel').addEventListener('click', closeModal);

  // Modal save
  document.getElementById('btn-modal-save').addEventListener('click', saveProject);

  // Modal delete
  document.getElementById('btn-delete').addEventListener('click', confirmDeleteProject);

  // Add risk
  document.getElementById('btn-add-risk').addEventListener('click', addRiskRow);

  // Filters
  document.getElementById('filter-search').addEventListener('input', e => {
    state.filters.search = e.target.value;
    renderList();
  });
  document.getElementById('filter-status').addEventListener('change', e => {
    state.filters.status = e.target.value;
    renderList();
  });
  document.getElementById('filter-priority').addEventListener('change', e => {
    state.filters.priority = e.target.value;
    renderList();
  });
  document.getElementById('filter-clear').addEventListener('click', () => {
    state.filters = { search: '', status: '', priority: '' };
    document.getElementById('filter-search').value   = '';
    document.getElementById('filter-status').value   = '';
    document.getElementById('filter-priority').value = '';
    renderList();
  });

  // Sort headers
  document.querySelectorAll('.projects-table th.sortable').forEach(th => {
    th.addEventListener('click', () => setSort(th.dataset.sort));
  });

  // Keyboard shortcut: Escape to close modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && state.modalOpen) closeModal();
  });

  // Initial render
  setView('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
