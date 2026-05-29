# Montage Events — PRD

## Original Problem Statement
> "I'm building an event management website for my friend. This is the files refine it to its best and change to a react or other framework to make it look better and smoother."

## Brand
Montage Events (Shah Alam, Selangor, Malaysia). Owner contact: Mr. Jo (+60 13-344 6521).
Services: Bar & Beverages, Sound & Lighting, 360° Photobooth & Videography, Game Corners, Entertainers, Event Planning.

## Architecture
- **Frontend**: React (CRA) + Tailwind + Shadcn UI. Premium neon party aesthetic (Unbounded display + Outfit body + Boogaloo tagline).
- **Backend**: FastAPI + MongoDB. Minimal endpoints for bookings + token-gated admin.
- **Routing**: `/` (public site), `/admin` (admin panel).

## User Personas
1. **Visitor / Potential client** — discovers services, browses gallery/clients, submits enquiry that opens WhatsApp.
2. **Montage owner (Mr. Jo)** — visits `/admin`, logs in with token, reviews/deletes bookings.

## Core Requirements (static)
- All original content preserved (services, photos, gallery videos, 29 client logos, Mr. Jo contact).
- WhatsApp-first booking flow (form opens wa.me with pre-filled message).
- Smooth, polished motion; cinematic neon dark aesthetic; data-testid on all interactives.

## What's Been Implemented (2026-02-14)
- Hero with auto-slideshow (4 slides), particle lights, disco ball, animated neon gradient tagline.
- Services bento grid (6 cards) → Shadcn Sheet side-panel with photos/details + WhatsApp CTA.
- Clients section with infinite CSS marquee (29 logos).
- Experience bento grid (large + 5 image cards).
- Gallery with 6 videos + 26 photos masonry, lightbox preview.
- About section with 3 info panels.
- Contact section with full booking form (validates, POSTs to `/api/bookings`, opens WhatsApp).
- Floating WhatsApp button (desktop) with pulse animation.
- Glassmorphic header (mobile menu).
- Admin panel `/admin`: token login (localStorage persistence), dashboard with stats + booking list + delete.
- Backend: POST `/api/bookings`, POST `/api/admin/verify`, GET `/api/admin/bookings`, DELETE `/api/admin/bookings/{id}`.
- 100% backend + 100% frontend tests passing (testing_agent_v3 iteration_1).

## Backlog (prioritized)
### P1
- Email/Telegram notification when a new booking is submitted.
- Lazy-load and CDN-optimize Google Drive image URLs.
- Per-service availability calendar (Shadcn calendar).

### P2
- Public route per service (`/services/:key`) for SEO.
- Multi-language toggle (EN / Bahasa Malaysia).
- Testimonials section + Google Reviews integration.
- Owner can upload media via admin (currently static).

### P3
- Stripe deposit option for confirmed bookings.
- Instagram feed embed.
- Analytics dashboard (events / mo, conversion).

## Credentials
See `/app/memory/test_credentials.md`. Admin token: `montage2026`.
