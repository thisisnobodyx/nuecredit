# nueCredit Website

## Project Structure

```
nuecredit/
├── index.html          ← Homepage
├── pages/
│   ├── partners.html   ← B2B Partner Program
│   ├── about.html      ← About page (add next)
│   ├── blog.html       ← Blog (add next)
│   └── contact.html    ← Contact (add next)
├── css/
│   └── globals.css     ← ALL shared styles live here
├── js/
│   └── main.js         ← ALL shared JS lives here
├── vercel.json         ← Vercel config
└── .gitignore
```

## Adding a New Page

1. Copy any existing page in `/pages/`
2. Update the `<link>` to `../css/globals.css`
3. Update the `<script>` to `../js/main.js`
4. Only put page-specific styles in a `<style>` block in that file
5. Push to GitHub → auto-deploys to Vercel

## Adding Global Styles

Open `css/globals.css` and add your styles there.
They will be available on every page automatically.

---

## Deploy: First Time Setup

### 1. Create GitHub repo
```bash
cd nuecredit
git init
git add .
git commit -m "initial commit"
gh repo create nuecredit --public --source=. --remote=origin --push
```
> Requires GitHub CLI: https://cli.github.com

### 2. Install Vercel CLI
```bash
npm install -g vercel
```

### 3. Deploy to Vercel
```bash
vercel --prod
```
- Follow the prompts (link to your account, set project name)
- Your site will be live at `nuecredit.vercel.app` (or custom domain)

---

## Deploy: After Every Update

```bash
git add .
git commit -m "describe your change"
git push
```
Vercel auto-deploys on every push to `main`. Done.

Or deploy manually anytime:
```bash
vercel --prod
```

---

## Connect a Custom Domain

In Vercel dashboard → Project → Settings → Domains → Add `nuecredit.com`
Then update your DNS with the values Vercel gives you.
