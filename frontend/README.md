# Site — NFC Student Attendance Dashboard

Dashboard for the NFC student attendance system.

## Tech Stack

- Next.js, React, TypeScript
- Tailwind CSS

## Packages

- Framer Motion
- Lucide React
- Axios, TanStack Query, Zustand

## Getting Started

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Set `NEXT_PUBLIC_API_URL` in `.env` to the backend's public URL before building
for production. This value is included in the frontend bundle, so do not put
secrets in `NEXT_PUBLIC_` variables.