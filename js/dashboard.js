// ============================================================
// Back Nine Demo — Leads Dashboard
// ============================================================
// Reads from localStorage (cg_leads_v1) and renders a live table.
// Listens for storage events (cross-tab) and the custom cg:lead_saved
// event (same-tab) so the view updates within seconds of a submission.
// ============================================================

(function () {
  'use strict';

  const STORAGE_KEY = 'cg_leads_v1';
  let lastCount = 0;

  function getLeads() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
  }

  function fmt(isoStr) {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return d.toLocaleString('en-SG', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function budgetLabel(v) {
    const map = {
      'under_20k':   '< $20k',
      '20k_40k':     '$20k–$40k',
      '40k_70k':     '$40k–$70k',
      '70k_100k':    '$70k–$100k',
      'above_100k':  '$100k+',
    };
    return map[v] || v || '—';
  }

  function timelineLabel(v) {
    const map = {
      'asap':         'ASAP',
      '1_3m':         '1–3 months',
      '3_6m':         '3–6 months',
      '6m_plus':      '6+ months',
      'researching':  'Just researching',
    };
    return map[v] || v || '—';
  }

  function renderStats(leads) {
    const el = id => document.getElementById(id);
    if (el('stat-total'))   el('stat-total').textContent   = leads.length;
    if (el('stat-today'))   el('stat-today').textContent   = leads.filter(l => {
      if (!l.submitted_at) return false;
      const d = new Date(l.submitted_at);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length;
    if (el('stat-hot')) {
      const hot = leads.filter(l =>
        ['asap','1_3m'].includes(l.timeline) ||
        ['above_100k','70k_100k'].includes(l.budget_range)
      ).length;
      el('stat-hot').textContent = hot;
    }
    if (el('stat-sources')) {
      const chatLeads = leads.filter(l => l.source === 'Chat Widget').length;
      el('stat-sources').textContent = chatLeads;
    }
  }

  function renderTable(leads) {
    const tbody = document.getElementById('leads-tbody');
    const empty = document.getElementById('leads-empty');
    if (!tbody) return;

    const newCount = leads.length;
    const isFirstLoad = lastCount === 0;

    if (leads.length === 0) {
      tbody.innerHTML = '';
      if (empty) empty.style.display = '';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = leads.map((lead, i) => {
      const isNew = !isFirstLoad && i < (newCount - lastCount);
      const dims = [lead.dim_w, lead.dim_h, lead.dim_d]
        .filter(Boolean).join(' × ') || '—';
      const dimsUnit = dims !== '—' ? dims + ' m' : '—';

      return `
      <tr class="${isNew ? 'new-row' : ''}">
        <td class="td-name">${esc(lead.full_name || '—')}</td>
        <td class="td-company">${esc(lead.company || '—')}</td>
        <td>${esc(lead.email || '—')}</td>
        <td class="nowrap">${esc(lead.phone || '—')}</td>
        <td>${budgetLabel(lead.budget_range)}</td>
        <td>${timelineLabel(lead.timeline)}</td>
        <td>${dimsUnit}</td>
        <td>${esc(lead.intended_use || '—')}</td>
        <td class="text-muted nowrap">${fmt(lead.submitted_at)}</td>
      </tr>`;
    }).join('');

    lastCount = newCount;
  }

  function render() {
    const leads = getLeads();
    renderStats(leads);
    renderTable(leads);
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Demo: seed a sample lead so the table isn't empty on first open
  function seedSampleIfEmpty() {
    const leads = getLeads();
    if (leads.length === 0) {
      const sample = {
        full_name:    'Demo Contact',
        company:      '(Sample — fill the form live!)',
        email:        'demo@example.com',
        phone:        '+65 9000 0000',
        budget_range: '40k_70k',
        timeline:     '3_6m',
        dim_w: '6', dim_h: '3.5', dim_d: '8',
        intended_use: 'Office',
        notes:        'This row is a placeholder. Submit the form on the Supply & Install page to see a live lead appear here.',
        source:       'Dashboard Seed',
        submitted_at: new Date(Date.now() - 86400000).toISOString(),
        id:           'seed',
      };
      const arr = [sample];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.getElementById('dashboard-page');
    if (!page) return;

    seedSampleIfEmpty();
    lastCount = getLeads().length;
    render();

    // Cross-tab updates
    window.addEventListener('storage', e => {
      if (e.key === STORAGE_KEY) render();
    });

    // Same-tab update (from lead-form.js)
    window.addEventListener('cg:lead_saved', () => {
      render();
    });

    // Polling fallback — catches SheetMonkey-sourced leads if user has the
    // sheet linked via a custom sync (not implemented, but good practice)
    setInterval(render, 5000);
  });
})();
