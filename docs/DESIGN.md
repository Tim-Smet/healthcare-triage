# Design spec

Source of truth for the UI. Direction: **clinical calm** (look) + **guided steps** (flow). Mockups: https://claude.ai/artifact/TYP4TEDBHDz4hygTEVaSyJ (boards 1, 5 and 3).

Principles:
- Calm and plain. One question per screen, no jargon.
- Emergency help is always one tap away.
- Never rely on color alone. Urgency always has a text label.

## Tokens

### Color

| Token | Hex | Use |
| --- | --- | --- |
| `bg` | `#F4F8F8` | Page background |
| `surface` | `#FFFFFF` | Cards, inputs, option cards |
| `ink` | `#0F2A2E` | Body text, headings, dark button |
| `ink-muted` | `#3B5156` | Secondary text |
| `ink-subtle` | `#4A6266` | Captions, labels (min 4.5:1 on `bg`) |
| `border` | `#D5E3E4` | Card and footer borders |
| `border-input` | `#6F8A8E` | Inputs, unselected option cards, chips (3:1 against white, WCAG 1.4.11; verify the final hex) |
| `divider` | `#E1ECEC` | Lines inside cards |
| `primary` | `#0E7C86` | Primary button, selected state, focus ring |
| `primary-ink` | `#0B6169` | Primary-colored text on light backgrounds |
| `primary-tint` | `#E8F4F5` | Selected option card, safety note, summary strip |
| `primary-tint-2` | `#E3F1F2` | Number badges |
| `urgent-bg` / `urgent-ink` | `#FDF1DC` / `#8A4B08` | Urgent pill |
| `emergency` | `#B3261E` | Emergency screen background |
| `emergency-ink` | `#A8281F` | Emergency button outline and text on light backgrounds |

Pills: **Urgent** uses `urgent-bg` / `urgent-ink`. **Routine** uses `primary-tint-2` / `primary-ink`. **Emergency** has no pill, because it replaces the whole screen.

### Type

Inter (400, 500, 600, 700). One family everywhere.

| Role | Desktop | Mobile | Weight | Notes |
| --- | --- | --- | --- | --- |
| Page title | 46–52px / 1.08 | 32px / 1.1 | 700 | letter-spacing -0.03em |
| Result heading | 40px | 28px | 700 | letter-spacing -0.02em |
| Lead | 18px / 1.5 | 16–17px | 400 | `ink-muted` |
| Body | 15–17px / 1.45 | same | 400 | |
| Button | 17px | 16px | 600 | |
| Caption | 14px | 12–14px | 400 | |
| Overline | 12px | 11px | 700 | UPPERCASE, letter-spacing 0.1em, `ink-subtle` |

### Shape, space, elevation

- Radius: card 24, option card 16 (mobile 14), input 14, buttons and pills fully rounded (height / 2).
- Page padding: 56px desktop, 20px mobile. Header 72px / 64px. Footer 64px.
- Gaps: 8, 12, 14, 16, 20, 28, 56.
- Card shadow: `0 12px 40px rgba(15, 42, 46, 0.07)`. Cards only, nothing else gets a shadow.
- Breakpoint: single column below ~900px.

### Accessibility rules

- Touch targets are at least 44px high. Primary buttons 52px, option cards 72px desktop / 56px mobile.
- Focus ring on every interactive element: `3px solid primary`, offset 2px.
- Real `<button>`, `<a>`, `<input>` + `<label>`. Option cards are a `<fieldset>` of radios (visually hidden `<legend>`), not clickable divs.
- Icon-only buttons need `aria-label`. Decorative SVG gets `aria-hidden`.
- Text contrast is at least 4.5:1. Don't use `primary` on `bg` for small text; use `primary-ink`.

## Accessibility requirements

Target: **WCAG 2.2 level AA** ([Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)). The mockups predate this section, so the only visual change is `border-input` above.

| Criterion | Requirement in this app |
| --- | --- |
| 1.4.3 Contrast (AA) | Text is at least 4.5:1 (3:1 at 24px+). Use `primary-ink`, not `primary`, for small colored text. |
| 1.4.11 Non-text contrast (AA) | Form control boundaries, the focus ring and the selected state are at least 3:1 against their background. |
| 1.4.1 Use of color (A) | Urgency always shows a text label. The selected `OptionCard` also changes border weight and font weight. |
| 1.4.4 / 1.4.10 Resize, reflow (AA) | Works at 200% zoom and 320px width with no horizontal scroll. Use `rem` for type and spacing. |
| 2.4.11 Focus not obscured (AA) | The pinned mobile `StepActions` bar must never cover the focused element. Add bottom `scroll-padding` equal to the bar height. |
| 2.4.2 / 2.4.3 Page title, focus order (A) | Each step has its own `<title>`. On step change, move focus to the step heading. |
| 2.5.8 Target size (AA) | Minimum 24px. We build to 44px. |
| 3.2.6 Consistent help (A) | `EmergencyButton` stays in the same place on every screen. |
| 3.3.1 / 3.3.3 Errors (A, AA) | Errors are text, say how to fix the problem, and are linked to the field with `aria-describedby`. An empty symptom box gets an inline error. |
| 3.3.2 Labels (A) | Every input has a visible `<label>`. |
| 3.3.7 Redundant entry (A) | Never ask for the same information twice. Keep answers in state across steps and prefill them on Edit. |
| 4.1.3 Status messages (AA) | "Checking your symptoms…", the result and any error are announced through an `aria-live="polite"` region. |

Not applicable: 2.5.7 Dragging (no drag interactions), 3.3.8 Accessible authentication (no login).

Plain language is a product requirement too (3.1.5 is AAA, but we follow it): short sentences, no medical jargon without an explanation.

## Components

| Component | Notes |
| --- | --- |
| `AppHeader` | Logo, nav (How it works, Privacy), `EmergencyButton`. On mobile the nav is dropped and the button stays. |
| `EmergencyButton` | Outlined pill. Desktop: ink outline, "Emergency? Call now". Mobile: `emergency-ink` outline, phone icon, "Emergency". |
| `Stepper` | Desktop: 3 numbered circles joined by lines (done = filled check, current = outlined + bold label, upcoming = grey). Mobile: "Step 2 of 3 · Details" + progress bar. |
| `Button` | `primary` (filled), `secondary` (outlined primary), `dark` (ink fill, used for the result CTA), `text` (underlined link-style, e.g. Edit). 52px high. |
| `OptionCard` | Radio or checkbox + label in a bordered card. Selected: 2.5px `primary` border + `primary-tint` fill + semibold. Grid on desktop, stacked on mobile. Radios sit in a `<fieldset>`, checkboxes too (with the question as `<legend>`). |
| `SymptomInput` | Labelled textarea, 4 rows, no resize, 17px text, 1.5px `border-input`. |
| `Chip` | 44px pill, used for example symptoms. |
| `SummaryCard` | "WHAT YOU TOLD US" overline, quoted text, Edit button. Desktop: white card in the right column. Mobile: `primary-tint` strip under the options. |
| `SafetyNote` | `primary-tint` box: "Feeling worse right now? Severe chest pain, trouble breathing or fainting: call your local emergency number." Desktop shows it under the summary, mobile folds it into the footer text. |
| `UrgencyPill` | Dot + label, 32px high, 14px bold. Variants: Urgent (`urgent-bg` / `urgent-ink`) and Routine (`primary-tint-2` / `primary-ink`). Emergency has no pill. |
| `ResultCard` | Overline, `UrgencyPill`, pathway heading, consultation type, numbered "What to do next" list, dark CTA, "Result saved" caption. |
| `StepActions` | Back (secondary) + Continue (primary). Mobile: pinned to the bottom with a top border, above the disclaimer. |
| `DisclaimerFooter` | "This is a prototype and does not give medical advice. In an emergency, call your local emergency number." |

## Screens and flow

Layout, desktop: header, then a two-column grid (`1.5fr 1fr`, gap 56), then the footer. Mobile: header, scrolling content, pinned `StepActions`. Screens 1–3 share this shell and the `Stepper`.

### 1. Describe (`/`, step 1 of 3)

- Left: title "Tell us what you're feeling, in your own words.", lead "We'll point you to the right kind of care, so you don't have to know which specialist to pick.", labelled `SymptomInput` ("Your symptoms"), `Button` primary "Continue", caption "Takes about a minute", then example `Chip`s ("Persistent cough", "Stomach pain after eating") that fill the textarea when pressed.
- Right: `SafetyNote` only. There is no summary yet.
- Mobile: same order, with `StepActions` pinned (Continue only, no Back).
- Empty submit: inline error under the textarea, "Tell us what's bothering you so we can help." Focus moves to the textarea.

### 2. Details (`/`, step 2 of 3)

One question per screen, with the caption "Question n of 3" above the title. Back on question 1 returns to Describe. Continue on question 3 submits and goes to Result. A radio question needs an answer before Continue enables. Right column (mobile: strip): `SummaryCard` with the symptom text and the answers so far, then `SafetyNote`.

| # | Title | Type | Options |
| --- | --- | --- | --- |
| 1 | How long have you had these symptoms? | Radio, 2×2 grid | Less than a day · A few days · A few weeks · Months or longer |
| 2 | How strong are your symptoms? | Radio, one column | Mild: I can do everything as usual · Moderate: it gets in the way · Severe: it's hard to do anything |
| 3 | Do you have any of these as well? Select all that apply. | Checkbox, 2×3 grid | Shortness of breath · Dizziness or fainting · Fever · Nausea or vomiting · Pain that spreads to arm, jaw or back · None of these |

"None of these" is exclusive: selecting it clears the others, and selecting any other clears it. Question 3 needs at least one selection. A red-flag match at any point goes straight to the Emergency screen.

### 3. Result (`/triage/[id]`, step 3 of 3)

- Stepper shows all three steps done. Title "Here's what we suggest."
- Left: `ResultCard`, containing:
  - overline "YOUR RESULT" and `UrgencyPill`
  - pathway as the heading (for example "Cardiology") and "Recommended: a **check-up** with a heart specialist"
  - "What to do next", 2–3 numbered steps
  - dark `Button` named after the action ("Schedule a check-up")
  - caption "Result saved. You can share the link with your clinic."
- Right (mobile: strip below the card): `SummaryCard` with the symptom text and the three answers, no Edit link, then `SafetyNote`.
- Loading: card replaced by "Checking your symptoms…" in an `aria-live="polite"` region. No spinner-only states.
- If the AI fails, show the fallback result (Urgent, General Practice) in the same card with no error styling. The patient always gets guidance.

### 4. Emergency (full screen, replaces the flow)

Shown when a red-flag rule matches, or when the final result is `emergency`. No header, stepper or footer. Inter throughout.

- Background `emergency` (`#B3261E`), white text, padding 32/24 on mobile. On desktop the same content sits in a centered column, max 560px.
- Eyebrow: warning icon + "EMERGENCY", 14px, 600, letter-spacing 0.12em.
- Title: "Call emergency services now." 46px / 1.04, 700, letter-spacing -0.02em.
- Reason: 18px / 1.5, one plain sentence naming the matched symptoms and why it matters, for example "Crushing chest pain with shortness of breath can be a sign of a heart problem that needs help right away."
- "While you wait" card: white, radius 20, padding 20, ink text, three numbered steps with `emergency` number badges. Default steps: "Sit down and try to stay calm." · "Unlock your front door if you can." · "Don't drive yourself to the hospital."
- Primary action, pinned to the bottom: white button, 68px high, `emergency` text, 20px / 700, phone icon, "Call your emergency number". It is a `tel:` link; the number is configured per deployment.
- Secondary: outlined white button, 52px, "Why am I seeing this?", which reveals the matched reason and the disclaimer.
- Focus ring on this screen is white.

## Copy

- Plain language, second person, no jargon.
- Urgency labels: Emergency, Urgent, Routine.
- Button labels name the action: "Check my symptoms", "Schedule a check-up".

## Tailwind

Tokens above map to CSS variables, then to the Tailwind theme (`bg`, `ink`, `primary`, etc.). Create them once in the global stylesheet and use the names above in components, never raw hex.
