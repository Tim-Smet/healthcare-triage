# Healthcare Triage

A digital triage experience that guides patients to the right care pathway. Instead of choosing a specialist themselves, a patient describes their symptoms in their own words and gets:

- a clear **urgency** level: emergency, urgent or routine
- a suggested **pathway** (e.g. Cardiology, Pulmonology, Gastroenterology, General Practice)
- a recommended **consultation type** (e.g. check-up, cardiography, first appointment)
- plain-language **next steps**, such as emergency instructions or scheduling

Each result is stored with an id and returned as structured JSON, so a hospital system (scheduling, contact center, EHR) can consume it.

```json
{
  "id": "...",
  "urgency": "urgent",
  "pathway": "Cardiology",
  "next": "schedule",
  "consultationType": "check-up"
}
```

> This app is a prototype and does not provide medical advice. In an emergency, call your local emergency number.

## How it works

Deterministic safety rules check for red-flag symptoms first and can force an emergency outcome. An AI agent then ranks likely pathways and picks a consultation type. The AI can raise urgency but never lower it. See [ARCHITECTURE.md](./ARCHITECTURE.md) for details.

## Tech stack

- Next.js (React) with TypeScript
- Tailwind CSS
- Postgres on Neon
- Mastra for AI orchestration
- Zod for validation

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev
```

Environment variables:

| Name | Description |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string |
| `ANTHROPIC_API_KEY` | API key for the LLM used by the triage agent |

The app runs at http://localhost:3000.
