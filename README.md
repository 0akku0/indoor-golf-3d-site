# Back Nine: Interactive 3D Venue Website

A concept website for a fictional indoor golf simulator venue in Singapore. It's hand-coded with no templates or site builders, and it shows how a small business site can feel like an experience instead of a brochure.

> **Concept demo.** Back Nine is not a real business. Every contact detail is a placeholder, and forms store data only in your browser (localStorage).

## Highlights

- **Scroll-driven 3D homepage.** A Three.js scene moves the camera through the venue as you scroll, with content panels that reveal in sync.
- **Mobile fallback.** On phones the 3D scene is swapped for a lighter scroll layout, so the site stays fast and readable.
- **Rule-based chatbot.** A scripted assistant answers common questions and captures enquiries inside the chat, with no AI API costs.
- **Lead capture to live dashboard.** Submit the Supply & Install form in one tab and watch the lead appear in `dashboard.html` in another tab within seconds (cross-tab `storage` events).
- **Booking, membership and contact pages**, all built on a shared design system in plain CSS.

## Stack

HTML, CSS, vanilla JavaScript (ES modules), Three.js (via CDN)

## Run locally

The 3D homepage uses ES modules, so it needs a local server:

```bash
npx serve . -p 3000
# or
python -m http.server 3000
```

Then open http://localhost:3000.

## Pages

| Page | What it shows |
|------|---------------|
| `index.html` | 3D scroll homepage (desktop) / scroll layout (mobile) |
| `supply-install.html` | Multi-step lead capture form |
| `dashboard.html` | Live leads dashboard |
| `booking.html` | Pricing and booking |
| `membership.html` | Membership tiers |
| `contact.html` | Contact and directions (placeholder) |

## Swapping in a real 3D model

The scene uses placeholder geometry. To load a real model, set `USE_REAL_MODEL = true` and `REAL_MODEL_PATH` in `js/three-scene.js`, then drop a `.glb` file into `assets/`.

## Optional: sync leads to Google Sheets

Set `SHEETMONKEY_ENDPOINT` in `js/config.js` to a SheetMonkey form URL, and each lead is also posted to a Google Sheet. It's left blank in this repo.
