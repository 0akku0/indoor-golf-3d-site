// ============================================================
// Back Nine Demo — Scripted Chatbot
// ============================================================
// Rule-based, zero API cost. Handles common venue questions +
// Supply & Install lead capture flow via quick-reply trees.
// ============================================================

(function () {
  'use strict';

  const TYPING_DELAY_MIN = 700;
  const TYPING_DELAY_MAX = 1400;
  const STORAGE_KEY = 'cg_leads_v1';

  // ── conversation state ───────────────────────────────────
  let conversationStarted = false;
  let siFlow = null; // tracks install enquiry progress

  // ── DOM refs (populated after DOMContentLoaded) ──────────
  let launcher, badge, window_, messages, input, sendBtn;

  // ── Helpers ──────────────────────────────────────────────
  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'chat-typing';
    el.id = 'typing-indicator';
    el.innerHTML = `
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>`;
    messages.appendChild(el);
    scrollToBottom();
    return el;
  }

  function removeTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  function addMessage(role, html) {
    const msg = document.createElement('div');
    msg.className = `chat-msg ${role}`;
    msg.innerHTML = `<div class="msg-bubble">${html}</div>`;
    messages.appendChild(msg);
    scrollToBottom();
    return msg;
  }

  function addQuickReplies(options, onSelect) {
    removeQuickReplies();
    const wrap = document.createElement('div');
    wrap.className = 'chat-quick-replies';
    wrap.id = 'quick-replies';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quick-reply-btn';
      btn.textContent = opt.label;
      btn.addEventListener('click', () => {
        disableQuickReplies();
        addMessage('user', escHtml(opt.label));
        respond(opt.value || opt.label);
      });
      wrap.appendChild(btn);
    });
    messages.appendChild(wrap);
    scrollToBottom();
  }

  function removeQuickReplies() {
    const el = document.getElementById('quick-replies');
    if (el) el.remove();
  }

  function disableQuickReplies() {
    document.querySelectorAll('.quick-reply-btn').forEach(b => b.disabled = true);
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function botSay(html, delay) {
    return new Promise(resolve => {
      const d = delay !== undefined ? delay : rand(TYPING_DELAY_MIN, TYPING_DELAY_MAX);
      const typing = showTyping();
      setTimeout(() => {
        typing.remove();
        addMessage('bot', html);
        resolve();
      }, d);
    });
  }

  // ── Supply & Install in-chat lead form ───────────────────
  function showSIForm() {
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg bot';
    wrap.innerHTML = `
      <div class="chat-si-form">
        <div class="si-title">Simulator Installation Enquiry</div>
        <input id="si-chat-name"    type="text"   placeholder="Your name *" />
        <input id="si-chat-email"   type="email"  placeholder="Email address *" />
        <input id="si-chat-phone"   type="tel"    placeholder="Phone / WhatsApp" />
        <input id="si-chat-company" type="text"   placeholder="Company (if applicable)" />
        <select id="si-chat-budget">
          <option value="">Budget range</option>
          <option value="under_20k">Under $20k</option>
          <option value="20k_40k">$20k – $40k</option>
          <option value="40k_70k">$40k – $70k</option>
          <option value="70k_100k">$70k – $100k</option>
          <option value="above_100k">Above $100k</option>
        </select>
        <select id="si-chat-timeline">
          <option value="">Timeline</option>
          <option value="asap">ASAP</option>
          <option value="1_3m">1–3 months</option>
          <option value="3_6m">3–6 months</option>
          <option value="6m_plus">6+ months</option>
          <option value="researching">Just researching</option>
        </select>
        <button class="si-submit" id="si-chat-submit">Send Enquiry →</button>
      </div>`;
    messages.appendChild(wrap);
    scrollToBottom();

    document.getElementById('si-chat-submit').addEventListener('click', submitSIChat);
  }

  async function submitSIChat() {
    const name   = document.getElementById('si-chat-name').value.trim();
    const email  = document.getElementById('si-chat-email').value.trim();
    if (!name || !email) {
      document.getElementById('si-chat-name').style.borderColor  = name  ? '' : 'var(--orange)';
      document.getElementById('si-chat-email').style.borderColor = email ? '' : 'var(--orange)';
      return;
    }
    const phone   = document.getElementById('si-chat-phone').value.trim();
    const company = document.getElementById('si-chat-company').value.trim();
    const budget  = document.getElementById('si-chat-budget').value;
    const timeline= document.getElementById('si-chat-timeline').value;

    const payload = {
      full_name: name, email, phone, company,
      budget_range: budget, timeline,
      source: 'Chat Widget',
      submitted_at: new Date().toISOString(),
      id: Date.now().toString(36),
    };

    // Save to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      existing.unshift(payload);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      window.dispatchEvent(new CustomEvent('cg:lead_saved'));
    } catch(e) {}

    // POST to SheetMonkey as URL-ENCODED form data (NOT JSON)
    const endpoint = (typeof CONFIG !== 'undefined') ? CONFIG.SHEETMONKEY_ENDPOINT : '';
    if (endpoint && !endpoint.includes('PASTE_YOUR_ENDPOINT')) {
      const body = new URLSearchParams(payload).toString();
      console.log('[Back Nine chatbot] POSTing lead to SheetMonkey:', payload);
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })
        .then(res => console.log('[Back Nine chatbot] SheetMonkey status:', res.status, res.ok ? 'OK ✅' : 'FAILED ❌'))
        .catch(err => console.error('[Back Nine chatbot] SheetMonkey POST threw:', err));
    }

    // Remove form, show confirmation
    document.querySelector('.chat-si-form')?.closest('.chat-msg')?.remove();
    addMessage('user', escHtml(name + ' — ' + email));
    await botSay(`✅ <strong>Got it, ${escHtml(name.split(' ')[0])}!</strong> Your enquiry is logged. Our team will reach out within 24 hours to discuss your simulator installation. In the meantime, feel free to visit our showroom at <a href="contact.html">the studio</a>.`, 800);
    addQuickReplies([
      { label: '📞 Call us now',   value: '__phone' },
      { label: '🏌️ Book a Bay',    value: '__book' },
      { label: '← Main menu',     value: '__menu' },
    ], respond);
  }

  // ── Main response engine ──────────────────────────────────
  async function respond(input) {
    removeQuickReplies();
    const txt = (input || '').toLowerCase().trim();

    // --- Menu shortcuts ---
    if (txt === '__menu' || txt === 'menu' || txt === 'hi' || txt === 'hello' || txt === 'hey') {
      return showMenu();
    }
    if (txt === '__phone') {
      await botSay(`📞 Call us: <a href="tel:+6560000000"><strong>+65 6000 0000</strong></a><br>We're available daily 10:00–24:00.`);
      return addQuickReplies([{ label: '← Back', value: '__menu' }], respond);
    }
    if (txt === '__book') {
      await botSay(`Ready to book? Head to our <a href="booking.html"><strong>Booking page</strong></a> — Regular Bays from <strong>$70/hr</strong>, Private Room from <strong>$80/hr</strong>. Members save 20%.`);
      return addQuickReplies([{ label: '← Back', value: '__menu' }], respond);
    }
    if (txt === '__email') {
      await botSay(`📧 Email us at <a href="mailto:hello@backnine.example"><strong>hello@backnine.example</strong></a>`);
      return addQuickReplies([{ label: '← Back', value: '__menu' }], respond);
    }

    // --- Hours & location ---
    if (txt.includes('hour') || txt.includes('open') || txt.includes('close') || txt.includes('time') || txt === '__hours') {
      await botSay(`🕙 We're open <strong>daily 10:00 – 24:00</strong> (last booking 21:30, last tee-off 22:00).<br><br>We're at <strong>Concept venue, Singapore</strong>, Singapore.`);
      return addQuickReplies([
        { label: '🗺️ Parking',    value: '__parking' },
        { label: '📞 Call us',    value: '__phone' },
        { label: '← Back',       value: '__menu' },
      ], respond);
    }

    // --- Parking ---
    if (txt.includes('park') || txt === '__parking') {
      await botSay(`🅿️ <strong>Nearest Parking:</strong> Parking is available nearby, and the studio is a short walk from the MRT. (This is a concept venue.)`);
      return addQuickReplies([
        { label: '← Back to hours', value: '__hours' },
        { label: '← Main menu',     value: '__menu' },
      ], respond);
    }

    // --- Pricing ---
    if (txt.includes('price') || txt.includes('cost') || txt.includes('rate') || txt.includes('how much') || txt === '__pricing') {
      await botSay(`
        <strong>Bay Pricing</strong><br>
        🏌️ Regular Bay — <strong>$70/hr</strong> (Members: $55/hr)<br>
        🏠 Private Room — <strong>$80/hr</strong> (Members: $65/hr)<br><br>
        Private Room fits up to 10 guests, 4m screen, 4K laser projector + Bluetooth speakers.
      `);
      return addQuickReplies([
        { label: '🎫 Book now',      value: '__book' },
        { label: '🪙 Membership',    value: '__membership' },
        { label: '← Back',          value: '__menu' },
      ], respond);
    }

    // --- Booking ---
    if (txt.includes('book') || txt.includes('reserv') || txt.includes('slot') || txt === '__book') {
      await botSay(`You can book online via our <a href="booking.html"><strong>Booking page</strong></a>, or call <a href="tel:+6560000000">+65 6000 0000</a>.<br><br>⏰ Last booking: 21:30 | Last tee-off: 22:00`);
      return addQuickReplies([
        { label: '💰 Check pricing', value: '__pricing' },
        { label: '← Back',          value: '__menu' },
      ], respond);
    }

    // --- Membership ---
    if (txt.includes('member') || txt === '__membership') {
      await botSay(`Our membership gives you <strong>20–25% off all bay rates</strong>:<br><br>🏌️ Bay: $55/hr (save $15)<br>🏠 Private Room: $65/hr (save $15)<br><br>Full membership details on our <a href="membership.html">Membership page</a>.`);
      return addQuickReplies([
        { label: '💰 Pricing',    value: '__pricing' },
        { label: '📞 Enquire',   value: '__phone' },
        { label: '← Back',       value: '__menu' },
      ], respond);
    }

    // --- Private room ---
    if (txt.includes('private') || txt.includes('room') || txt.includes('event') || txt === '__private') {
      await botSay(`Our <strong>Private Room</strong> is perfect for corporate events, birthday parties, and group play:<br><br>• 4-metre wide screen<br>• 4K laser projector<br>• Bluetooth speakers<br>• Up to <strong>10 guests</strong><br>• $80/hr (members $65/hr)`);
      return addQuickReplies([
        { label: '🎫 Book it',    value: '__book' },
        { label: '← Back',       value: '__menu' },
      ], respond);
    }

    // --- Hole in one ---
    if (txt.includes('hole') || txt.includes('prize') || txt.includes('win')) {
      await botSay(`🏆 <strong>Hole-in-One Challenge:</strong> Score a hole-in-one and win <strong>10 hours of free play</strong> (valued at $700)!`);
      return addQuickReplies([{ label: '← Back', value: '__menu' }], respond);
    }

    // --- Simulator / technology ---
    if (txt.includes('simulator') || txt.includes('tech') || txt.includes('software') || txt.includes('impact') || txt === '__tech') {
      await botSay(`We use <strong>tour-grade launch-monitor simulators</strong> with premium accuracy. Back Nine also supply and install home and commercial simulators.<br><br>Interested in getting one for your space?`);
      return addQuickReplies([
        { label: '📋 Get an install quote', value: '__si' },
        { label: '← Back',                 value: '__menu' },
      ], respond);
    }

    // --- Supply & Install ---
    if (txt.includes('install') || txt.includes('supply') || txt.includes('purchase') || txt.includes('buy') || txt === '__si') {
      await botSay(`We can supply and install a <strong>premium golf simulator</strong> in your home, office, or commercial venue anywhere in Singapore.<br><br>Leave your details and we'll get back to you within 24 hours with a tailored quote.`);
      setTimeout(() => { showSIForm(); scrollToBottom(); }, 600);
      return;
    }

    // --- Location ---
    if (txt.includes('locat') || txt.includes('where') || txt.includes('address') || txt.includes('find') || txt === '__location') {
      await botSay(`📍 <strong>Concept venue, Singapore</strong>, Singapore.<br><br>Easy parking and a short walk from the MRT.<strong>CityBot</strong>, your Back Nine assistant. What can I help you with today?`, 600);
    } else if (withGreeting) {
      await botSay(`What else can I help you with?`, 500);
    }
    addQuickReplies([
      { label: '🕙 Hours & location',       value: '__hours' },
      { label: '💰 Pricing',               value: '__pricing' },
      { label: '🎫 How to book',            value: '__book' },
      { label: '🏠 Private Room',           value: '__private' },
      { label: '🪙 Membership',             value: '__membership' },
      { label: '🖥️ Simulator tech',        value: '__tech' },
      { label: '📦 Install a simulator',   value: '__si' },
    ], respond);
  }

  // --- Handle free-text input ---
  async function handleUserInput() {
    const txt = input.value.trim();
    if (!txt) return;
    input.value = '';
    input.style.height = 'auto';
    disableQuickReplies();
    addMessage('user', escHtml(txt));
    await respond(txt);
  }

  // ── Init ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    launcher = document.getElementById('chat-launcher');
    badge    = document.getElementById('chat-badge');
    window_  = document.getElementById('chat-window');
    messages = document.getElementById('chat-messages');
    input    = document.getElementById('chat-input');
    sendBtn  = document.getElementById('chat-send');

    if (!launcher) return; // chatbot not on this page

    // Launcher toggle
    launcher.addEventListener('click', () => {
      const open = window_.classList.toggle('open');
      launcher.classList.toggle('open', open);
      if (open) {
        if (badge) badge.classList.add('hidden');
        if (!conversationStarted) showMenu(true);
        setTimeout(() => input && input.focus(), 350);
      }
    });

    // Send on button click
    sendBtn && sendBtn.addEventListener('click', handleUserInput);

    // Send on Enter (shift+enter = newline)
    input && input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleUserInput();
      }
    });

    // Auto-resize textarea
    input && input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    });

    // Show badge after 5s if not yet opened (simulates incoming message)
    setTimeout(() => {
      if (!conversationStarted && badge) badge.classList.remove('hidden');
    }, 5000);
  });
})();
