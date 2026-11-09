# Healthcare Triage

A digital triage experience that guides patients to the right care pathway. A patient describes their symptoms in their own words and gets:

- an **urgency** level: emergency, urgent or routine
- a suggested **pathway** (Cardiology, Pulmonology, Gastroenterology or General Practice)
- a recommended **consultation type**
- plain-language **next steps**

Every result is stored with an id and returned as JSON that a hospital system can consume.

```json
{
  "id": "...",
  "urgency": "urgent",
  "pathway": "Cardiology",
  "next": "schedule",
  "consultationType": "first-appointment"
}
```

> This app is a prototype and does not provide medical advice. In an emergency, call your local emergency number.

## Tech stack

Next.js, TypeScript, Tailwind CSS, Mastra (Claude), Postgres on Neon with Drizzle, Zod.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run db:migrate           # creates the table in Postgres
npm run dev
```

The app runs at http://localhost:3000.

| Variable | Description |
| --- | --- |
| `ANTHROPIC_API_KEY` | API key for the triage agent. Without it a simple built-in stub is used. |
| `DATABASE_URL` | Postgres connection string. Without it results are kept in memory. |
| `NEXT_PUBLIC_EMERGENCY_NUMBER` | Optional. If set, the emergency buttons dial it. If empty, they show a prototype notice instead. |
| `TRIAGE_MODEL` | Optional. Overrides the model. |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the code |
| `npm run db:generate` | Generate a migration after changing the schema |
| `npm run db:migrate` | Apply migrations |

## Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md): how it is built
- [docs/DESIGN.md](./docs/DESIGN.md): the UI spec
