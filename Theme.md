# VidShorts Theme Rules

## Overview
VidShorts uses a **dark-first** design system built on top of ShadCN (base-vega style) with Tailwind CSS v4. All agents working on this project MUST follow these theme rules.

---

## Color Palette

### Primary Brand Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--brand-primary` | `oklch(0.65 0.25 280)` | Vibrant violet-purple – CTAs, highlights |
| `--brand-secondary` | `oklch(0.65 0.22 195)` | Cyan-teal – accents, gradients |
| `--brand-glow` | `oklch(0.55 0.28 310)` | Magenta-pink – glow effects, decorative |

### Background Scale (Dark Theme)
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `oklch(0.09 0.01 270)` | Deepest background |
| `--bg-surface` | `oklch(0.12 0.015 270)` | Card surfaces |
| `--bg-elevated` | `oklch(0.16 0.015 270)` | Elevated panels, modals |
| `--bg-overlay` | `oklch(0.20 0.015 270)` | Overlays, dropdowns |

### Semantic Colors
| Token | Usage |
|-------|-------|
| `--foreground` | Primary text – near white |
| `--muted-foreground` | Secondary text – muted gray |
| `--primary` | Primary action color – brand violet |
| `--border` | Subtle borders – white at 8% opacity |

---

## Typography

- **Font Family**: Inter (via `next/font/google`) – clean, modern, readable
- **Heading Scale**: `text-5xl` → `text-7xl` for hero; `text-3xl` → `text-4xl` for section titles
- **Body**: `text-base` with `leading-relaxed`
- **Tracking**: Use `tracking-tight` for large headings

### Heading Gradients
Headlines use gradient text:
```css
background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

---

## Gradient System

### Primary Gradient (CTA buttons, hero backgrounds)
```css
background: linear-gradient(135deg, oklch(0.65 0.25 280), oklch(0.65 0.22 195));
```

### Glow Gradient (decorative orbs)
```css
background: radial-gradient(ellipse, oklch(0.55 0.28 310 / 0.3), transparent 70%);
```

### Card Gradient Border
Use subtle gradient borders on cards:
```css
border: 1px solid oklch(1 0 0 / 0.08);
background: linear-gradient(145deg, oklch(0.12 0.015 270), oklch(0.16 0.015 270));
```

---

## Component Rules

### Buttons
- **Primary CTA**: Gradient background (`brand-primary` → `brand-secondary`), white text, `px-8 py-3`, `rounded-xl`
- **Secondary**: `outline` variant with border glow on hover
- **Ghost**: Transparent with subtle hover state

### Cards
- Background: `--bg-surface` with slight gradient
- Border: 1px solid white at 8% opacity
- Border-radius: `--radius-xl` (1.4× base)
- Hover: subtle `transform: translateY(-4px)` + glow shadow

### Navigation
- Sticky header with `backdrop-blur-xl`
- Background: `oklch(0.09 0.01 270 / 0.8)` (semi-transparent deep dark)
- Border-bottom: 1px solid white at 6% opacity

---

## Animation Principles

1. **Micro-interactions**: All interactive elements have `transition-all duration-300`
2. **Hover lifts**: Cards lift on hover with `translateY(-4px)` and shadow deepening
3. **Gradient pulses**: CTA buttons have subtle shimmer animation
4. **Fade-in on scroll**: Sections animate in with `opacity-0` → `opacity-100`
5. **Floating elements**: Decorative orbs use `animate-float` (custom keyframe, 6s infinite)

### Custom Keyframes
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

---

## Spacing & Layout

- **Container max-width**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Section padding**: `py-24 lg:py-32`
- **Grid gaps**: `gap-8` for cards, `gap-12` for major sections
- **Border-radius base**: `0.625rem` (10px)

---

## Dark Mode (Default)

This app is **dark-first**. The `<html>` element always carries the `dark` class. Do NOT implement a light/dark toggle unless explicitly requested.

```tsx
// layout.tsx – always dark
<html lang="en" className="dark ...">
```

---

## Icon Library

Use **Lucide React** for all icons. Icons must be sized consistently:
- Small (inline): `size-4`
- Medium (feature): `size-6`
- Large (hero): `size-10` or `size-12`

---

## Agent Rules Summary

1. **Always use dark theme** – apply `dark` class to `<html>`, never omit it
2. **Use brand gradient** for primary CTAs and headings
3. **Glow effects** on hero sections using `radial-gradient` orbs
4. **Glassmorphism** for cards: `backdrop-blur` + semi-transparent backgrounds
5. **Smooth animations** – all interactions must have transitions
6. **Inter font** is the primary typeface
7. **No light mode** – build only for dark unless user requests toggle
8. **ShadCN components** must be used where available (Button, Badge, Card, etc.)
9. **Keep sections full-width** with constrained inner containers
10. **Mobile-first** responsive design using Tailwind breakpoints
