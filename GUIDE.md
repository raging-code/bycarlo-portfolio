# byCarlo — Setup Guide

## File Structure

```
bycarlo/
├── app/
│   ├── globals.css     ← fonts, base styles, marquee animation
│   ├── layout.js       ← metadata / root HTML shell
│   └── page.js         ← THE ENTIRE SITE (edit everything here)
├── next.config.mjs
├── package.json
├── postcss.config.js
└── tailwind.config.js
```

---

## Step 1 — Install Node.js (if not already installed)

1. Go to https://nodejs.org and download the **LTS** version
2. Install it (default settings are fine)
3. Open a terminal in VSCode: **View → Terminal** (or `Ctrl + ~`)
4. Confirm it's installed:
   ```
   node -v
   npm -v
   ```
   Both should print version numbers.

---

## Step 2 — Open the project in VSCode

1. Open VSCode
2. Go to **File → Open Folder**
3. Select the `bycarlo` folder you received
4. You should see all 7 files in the Explorer panel on the left

---

## Step 3 — Install dependencies

In the VSCode terminal (make sure you're inside the `bycarlo` folder):

```bash
npm install
```

This installs Next.js, React, Tailwind CSS, and Framer Motion.
It may take 1–2 minutes. You'll see a `node_modules` folder appear.

---

## Step 4 — Run the dev server

```bash
npm run dev
```

Open your browser and go to:
```
http://localhost:3000
```

You should see the full byCarlo site. 🎉

---

## Step 5 — Edit your content (everything is in `app/page.js`)

### Change project info
Find the `PROJECTS` array near the top of `page.js`:

```js
const PROJECTS = [
  {
    id: "01",
    title: "Vow & Verse",        // ← project name
    type: "Wedding Website",      // ← project category
    tags: ["Next.js", ...],       // ← tech stack tags
    features: ["RSVP System"...], // ← feature list (hover reveals these)
    accentHex: "#C8B89A",         // ← color glow on the mockup
    url: "#",                     // ← replace "#" with your live URL
  },
  // ... 3 more projects
]
```

### Change taglines (Why byCarlo section)
```js
const TAGLINES = [
  "Shipped in days, not months.",
  // ← edit any of these 5 lines
]
```

### Change testimonials
```js
const TESTIMONIALS = [
  {
    quote: "...",      // ← the testimonial text
    name: "Sofia R.",  // ← client name
    role: "Bride...",  // ← client title/project
  },
]
```

### Change social links
Search for `Contact` section near the bottom of `page.js`:
```js
<SocialLink href="viber://chat?number=%2Bbycarlo" ... />
<SocialLink href="https://instagram.com/bycarlo" ... />
<SocialLink href="https://facebook.com/bycarlo" ... />
```
Replace the `href` values with your actual links.

---

## Step 6 — Build for production

When you're ready to deploy:

```bash
npm run build
```

This creates an optimized production build.

---

## Step 7 — Deploy to Vercel (recommended)

**Option A — Vercel CLI (easiest)**

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. From inside the `bycarlo` folder:
   ```bash
   vercel
   ```

3. Follow the prompts (login, confirm project name, etc.)
4. Your site will be live at `yourproject.vercel.app`

---

**Option B — Vercel GitHub (if you use Git)**

1. Push your project to a GitHub repository
2. Go to https://vercel.com → **New Project**
3. Import your GitHub repo
4. Click **Deploy** — zero config needed, Vercel auto-detects Next.js

---

## Customization Reference

| What to change | Where |
|---|---|
| Project cards | `PROJECTS` array in `page.js` |
| Taglines | `TAGLINES` array in `page.js` |
| Marquee quotes | `MARQUEE_ITEMS` array in `page.js` |
| Testimonials | `TESTIMONIALS` array in `page.js` |
| Social links | `Contact` section in `page.js` |
| Story text | `Story` component in `page.js` |
| Site title / SEO | `layout.js` |
| Colors | `tailwind.config.js` (ink / paper / mist) |
| Fonts | `globals.css` (Google Fonts import) |

---

## Troubleshooting

**"Module not found" error**
→ Run `npm install` again

**Port 3000 already in use**
→ Run `npm run dev -- -p 3001` to use a different port

**Fonts not loading**
→ Check your internet connection (fonts load from Google Fonts CDN)

**Animations look janky**
→ Make sure hardware acceleration is on in your browser settings
