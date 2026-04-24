# Curated by Ines — Travel Planner

A personalized AI travel planner powered by Claude, built with Next.js and deployable to Vercel in minutes.

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/curated-by-ines.git
cd curated-by-ines
npm install
```

### 2. Add your API key

```bash
cp .env.example .env.local
```

Open `.env.local` and replace `your_api_key_here` with your Anthropic API key.
Get one at: https://console.anthropic.com/

### 3. Run locally

```bash
npm run dev
```

Visit http://localhost:3000

---

## Deploy to Vercel

### Option A — Vercel Dashboard (easiest)

1. Push this repo to GitHub
2. Go to https://vercel.com/new
3. Import your GitHub repo
4. Under **Environment Variables**, add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your Anthropic API key
5. Click **Deploy**

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel
```

Then add your environment variable in the Vercel dashboard under Project → Settings → Environment Variables.

---

## Project Structure

```
curated-by-ines/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts      # Secure server-side API route (streams Claude's response)
│   ├── globals.css           # Global styles + font imports
│   ├── layout.tsx            # Root layout + metadata
│   └── page.tsx              # Home page
├── components/
│   ├── TravelPlanner.tsx     # Main planner UI (client component)
│   └── TravelPlanner.module.css
├── lib/
│   └── prompt.ts             # Your master prompt (edit here to update the AI behavior)
├── .env.example              # Environment variable template
├── .gitignore
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## Customization

### Update the AI prompt
Edit `lib/prompt.ts` — this is your full master prompt. Any changes here immediately affect how itineraries are generated.

### Change the model
In `app/api/generate/route.ts`, update the `model` field. Current: `claude-opus-4-5-20251101`.

### Adjust max output length
In `app/api/generate/route.ts`, update `max_tokens` (currently 4000).

---

## Security Note

Your `ANTHROPIC_API_KEY` lives only in `.env.local` (local) or Vercel's encrypted environment variables (production). It is **never** exposed to the browser. All API calls go through the Next.js API route at `/api/generate`.
