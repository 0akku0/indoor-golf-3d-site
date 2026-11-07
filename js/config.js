// ============================================================
// Back Nine Demo — Global Configuration
// ============================================================
// BEFORE THE LIVE DEMO: paste your SheetMonkey endpoint below.
// SHEETMONKEY_ENDPOINT: Sign in → My Forms → copy the POST URL.
// SHEET_EMBED_URL: Google Sheets → File → Share → Publish to web
//   → choose your sheet → Embed → copy the src URL.
// ============================================================

const CONFIG = {
  // ▼ PASTE SheetMonkey POST URL here (looks like …/form/xxxxxxxx)
  SHEETMONKEY_ENDPOINT: '',

  // ▼ PASTE Google Sheets embed URL here (optional — adds live sheet view to dashboard)
  SHEET_EMBED_URL: '',

  // DEMO_MODE: true  → leads also stored in localStorage so the dashboard
  //                     updates live in the same browser session (no server needed)
  DEMO_MODE: true,

  VENUE: {
    name:    'Back Nine',
    address: 'Concept venue, Singapore',
    phone:   '+65 6000 0000',
    email:   'hello@backnine.example',
    hours:   'Daily 10:00 – 24:00',
    lastBooking: '21:30',
    lastTeeOff:  '22:00',
  },
};
