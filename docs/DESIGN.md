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

Not designed yet: the **routine** pill. Proposal: `primary-tint-2` background with `primary-ink` text. Needs a contrast check.

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
| `OptionCard` | Radio + label in a bordered card. Selected: 2.5px `primary` border + `primary-tint` fill + semibold. 2×2 grid desktop, stacked mobile. |
| `SymptomInput` | Labelled textarea, 4 rows, no resize, 17px text, 1.5px `border-input`. |
| `Chip` | 44px pill, used for example symptoms. |
| `SummaryCard` | "WHAT YOU TOLD US" overline, quoted text, Edit button. Desktop: white card in the right column. Mobile: `primary-tint` strip under the options. |
| `SafetyNote` | `primary-tint` box: "Feeling worse right now? Severe chest pain, trouble breathing or fainting: call your local emergency number." Desktop shows it under the summary, mobile folds it into the footer text. |
| `UrgencyPill` | Dot + label ("Urgent"). 32px high. One variant per urgency level. |
| `ResultCard` | Overline, `UrgencyPill`, pathway heading, consultation type, numbered "What to do next" list, dark CTA, "Result saved" caption. |
| `StepActions` | Back (secondary) + Continue (primary). Mobile: pinned to the bottom with a top border, above the disclaimer. |
| `DisclaimerFooter` | "This is a prototype and does not give medical advice. In an emergency, call your local emergency number." |

## Screens and flow

1. **Describe** (`/`): headline, `SymptomInput`, "Check my symptoms", example chips. Step 1 of 3.
2. **Details** (`/`, step 2): one question per screen, `OptionCard` group, `SummaryCard` alongside. The mockup shows "How long have you had these symptoms?". Which questions are asked is still open.
3. **Result** (`/triage/[id]`): `ResultCard` full page. Mockup is the right-hand card of board 1.
4. **Emergency** (full screen, replaces the flow): `emergency` background, white text, "Call emergency services now.", reason, a white "While you wait" card, a large white call button, a "Why am I seeing this?" outline button. Triggered by the red-flag rules, and also when the AI returns `emergency`.

Layout, desktop: header, then a two-column grid (`1.5fr 1fr`, gap 56) with the step content on the left and summary plus safety note on the right, then the footer. Mobile: header, scrolling content, pinned `StepActions`.

## Copy

- Plain language, second person, no jargon.
- Urgency labels: Emergency, Urgent, Routine.
- Button labels name the action: "Check my symptoms", "Schedule a check-up".

## Open items

- Routine pill colors (above).
- The emergency mockup used Space Grotesk for headings. Spec says Inter everywhere, so build it in Inter unless you want a second font.
- Screens 1, 3 and the emergency screen only exist as parts of other boards. Draw them in the final style before building the pages.
- Dark mode: out of scope for now.

## Tailwind

Tokens above map to CSS variables, then to the Tailwind theme (`bg`, `ink`, `primary`, etc.). Create them once in the global stylesheet and use the names above in components, never raw hex.
