// ============================================================
// Back Nine Demo — Lead Form Submission
// ============================================================
// Handles the Supply & Install form:
//   1. Client-side validation
//   2. POST to SheetMonkey
//   3. Fallback: save to localStorage (DEMO_MODE)
//   4. Show confirmation state
// ============================================================

(function () {
  'use strict';

  const STORAGE_KEY = 'cg_leads_v1';

  // --- Persist lead to localStorage (demo + cross-tab dashboard) ---
  function saveLead(data) {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      existing.unshift({
        ...data,
        id: Date.now().toString(36),
        submitted_at: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      // Trigger storage event for dashboard in another tab
      // (storage event only fires in OTHER tabs; dispatch manually for same tab)
      window.dispatchEvent(new CustomEvent('cg:lead_saved'));
    } catch (e) {
      console.warn('localStorage unavailable:', e);
    }
  }

  // --- Simple field validation ---
  function validateForm(form) {
    let valid = true;
    form.querySelectorAll('[data-required]').forEach(field => {
      const group = field.closest('.form-group');
      if (!field.value.trim()) {
        group && group.classList.add('has-error');
        valid = false;
      } else {
        group && group.classList.remove('has-error');
      }
    });
    // Email validation
    const emailField = form.querySelector('[type="email"]');
    if (emailField && emailField.value) {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value);
      const group = emailField.closest('.form-group');
      if (!ok) {
        group && group.classList.add('has-error');
        valid = false;
      }
    }
    return valid;
  }

  // --- Submit handler ---
  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    if (!validateForm(form)) {
      form.querySelector('.has-error [data-required], .has-error input, .has-error select')
        ?.focus();
      return;
    }

    const submitBtn = form.querySelector('[data-submit]');
    const originalLabel = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-spinner"></span> Sending…';

    // Build payload
    const fd = new FormData(form);
    const payload = {};
    fd.forEach((v, k) => { payload[k] = v; });
    payload.source = 'Supply & Install Form';
    payload.page_url = window.location.href;

    let success = false;

    // 1. POST to SheetMonkey as URL-ENCODED form data (what SheetMonkey expects — NOT JSON)
    const endpoint = (typeof CONFIG !== 'undefined') ? CONFIG.SHEETMONKEY_ENDPOINT : '';
    if (endpoint && !endpoint.includes('PASTE_YOUR_ENDPOINT')) {
      try {
        const body = new URLSearchParams(payload).toString();
        console.log('[Back Nine] POSTing lead to SheetMonkey:', endpoint, payload);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        });
        success = res.ok;
        console.log('[Back Nine] SheetMonkey response status:', res.status, res.ok ? 'OK ✅' : 'FAILED ❌');
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          console.warn('[Back Nine] SheetMonkey error body:', txt);
        }
      } catch (err) {
        console.error('[Back Nine] SheetMonkey POST threw (network/CORS):', err);
      }
    } else {
      console.warn('[Back Nine] No SheetMonkey endpoint set — still in placeholder mode. Edit js/config.js.');
    }

    // 2. Always save to localStorage for demo dashboard (independent of SheetMonkey)
    saveLead(payload);
    success = true; // demo dashboard always works; check console above for real SheetMonkey status

    // 3. Show confirmation
    if (success) {
      const formWrap = form.closest('[data-form-wrap]') || form.parentElement;
      const successEl = document.querySelector('[data-form-success]');
      if (successEl) {
        formWrap.style.display = 'none';
        successEl.classList.add('visible');
        // Populate summary
        const nameEl = successEl.querySelector('[data-name]');
        const coEl   = successEl.querySelector('[data-company]');
        if (nameEl) nameEl.textContent = payload.full_name || '';
        if (coEl)   coEl.textContent   = payload.company   || '';
      }
    } else {
      // Restore button if POST failed (shouldn't happen in demo)
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalLabel;
      alert('Something went wrong. Please try again or email hello@backnine.example directly.');
    }
  }

  // --- Clear all errors on input ---
  function clearErrorOnInput(form) {
    form.addEventListener('input', e => {
      const group = e.target.closest('.form-group');
      if (group && e.target.value.trim()) group.classList.remove('has-error');
    }, true);
    form.addEventListener('change', e => {
      const group = e.target.closest('.form-group');
      if (group && e.target.value) group.classList.remove('has-error');
    }, true);
  }

  // --- Init ---
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('si-lead-form');
    if (!form) return;
    form.addEventListener('submit', handleSubmit);
    clearErrorOnInput(form);
  });
})();
