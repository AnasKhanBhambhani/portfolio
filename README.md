# Portfolio

Muhammad Anas — full-stack engineer portfolio. React 19 + Vite, Tailwind CSS v4, deployed on Vercel.

## Development

```
npm install
npm run dev
```

## Contact form

The contact form sends email via a Vercel serverless function (`api/contact.js`) using Nodemailer through Gmail SMTP. It needs two server-side environment variables set in the Vercel project (Settings → Environment Variables), **not** prefixed with `VITE_`:

- `GMAIL_USER` — your Gmail address
- `GMAIL_APP_PASSWORD` — a Google App Password (requires 2-Step Verification on the account): https://myaccount.google.com/apppasswords

See `.env.example` for local setup. Note: the plain Vite dev server does not run `/api` functions — use `vercel dev` to test the contact form locally.

## Deploy

Pushes to `main` auto-deploy via the connected Vercel Git integration.
