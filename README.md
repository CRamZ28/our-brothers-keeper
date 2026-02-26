# Our Brother's Keeper

> *"Carry each other's burdens, and in this way you will fulfill the law of Christ."*
> — Galatians 6:2

**Our Brother's Keeper (OBK)** is a private, invitation-based support platform that helps communities stay organized and present for grieving families — not just in the first week, but in month six, year two, and every quiet anniversary that follows.

[obkapp.com](https://obkapp.com) · Private repo, open to contributors

---

## The Story Behind It

This project started with a loss.

When my brother passed away, he left behind a wife and three young boys. In the immediate aftermath, support poured in — meals, prayers, phone calls, people showing up. And then, as life always does, it slowly moved on. Not because anyone stopped caring. But because caring without structure is hard to sustain.

I watched the gap open up. I watched a widow navigate an overwhelming amount of need with an increasingly quiet phone. I watched children grow up with their father gone and their community gradually drift — not out of indifference, but out of the ordinary chaos of living.

OBK exists because that gap is solvable. Grief doesn't have a timeline, but support usually acts like it does. This platform is an attempt to fix that.

---

## What It Does

OBK gives a grieving family a private, controlled hub where their support community can stay organized and engaged over the long term.

| Feature | What It Solves |
|---|---|
| **Needs Board** | Turn vague offers of help into specific, claimable tasks — meals, errands, childcare, lawn care |
| **Meal Train** | Coordinate scheduled meal deliveries with dietary preferences and private delivery details |
| **Events Calendar** | Keep the community informed of what matters — memorial services, court dates, birthdays, school events |
| **Family Updates** | A space for the family to share news, photos, and milestones with their support circle |
| **Memory Wall** | An interactive, drag-and-drop space to collect and share stories, memories, photos, and prayers |
| **Gift Registry** | A wishlist for practical needs — household items, school supplies, memorial gifts — with purchase tracking |
| **Messaging** | Direct communication between supporters and the family |
| **Reminders** | Personal and event-linked email reminders so no one forgets |
| **Resources** | Curated grief support guidance — faith-based, practical, and secular |
| **People & Groups** | Secure invitations, three-tier access control, and custom groups for personalized sharing |

This is not social media. There are no feeds to scroll, no engagement metrics, no notifications designed to pull you back in. Every feature exists to reduce friction between people who want to help and a family that needs it.

---

## Faith Foundation

OBK is rooted in a Christian conviction — that we are called to carry one another's burdens. The name is a reference to Scripture. The logo includes a cross. That foundation is real and it won't be hidden.

But OBK is not faith-exclusive. It is built to be genuinely welcoming to anyone who wants to love and support a grieving family, regardless of belief. The Resources section includes faith-based content, secular counseling resources, and practical support materials — because the goal is healing, and healing doesn't belong to one tradition.

If you enter this platform without faith, we hope you encounter something that makes you wonder. That's as far as we'll push it.

---

## Built With AI, Finished With Community

I'm not a developer. OBK was built using Replit's AI agent and other AI-assisted tools because I had the conviction but not the coding background to build it any other way. I took it as far as I could through persistence and passion.

This is currently a web application. I chose not to expand to mobile until the foundation was solid.

If you're a developer looking at this repository, you'll likely spot areas that need refactoring, hardening, or rethinking. You're probably right. That's exactly why this is being opened to the community — not because it's finished, but because the mission is bigger than one person's skillset.

This project was built using AI-assisted development to prove the concept. Now it needs experienced developers to harden, scale, and carry it forward.

---

## For Contributors

Before diving into the code, please read:

- [**VISION.md**](my-brothers-keeper/VISION.md) — Where this is going and why
- [**PHILOSOPHY.md**](my-brothers-keeper/PHILOSOPHY.md) — The principles every feature should be held against
- [**FOUNDER_NOTE.md**](my-brothers-keeper/FOUNDER_NOTE.md) — The personal story behind the project
- [**CONTRIBUTING.md**](my-brothers-keeper/CONTRIBUTING.md) — How to contribute, and what we will and won't merge
- [**GOVERNANCE.md**](my-brothers-keeper/GOVERNANCE.md) — How decisions get made
- [**DEPLOYMENT.md**](my-brothers-keeper/DEPLOYMENT.md) — How to run it locally and what to replace when self-hosting

### Where Help Is Most Needed

- Security hardening and privacy audit
- Mobile experience (React Native / PWA improvements)
- Accessibility compliance
- Notification reliability
- Testing coverage
- DevOps / deployment architecture
- Documentation cleanup
- Code refactoring — there are areas built quickly with AI that need a thoughtful hand

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend | Express.js + tRPC |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Replit Auth (OpenID Connect / Passport.js) |
| File Storage | Replit Object Storage (GCS sidecar) |
| Email | Resend |
| Package Manager | pnpm (workspaces) |
| Runtime | Node.js 18+ |

> **Note:** Two pieces of this stack are Replit-specific (`server/replitAuth.ts` and `server/objectStorage.ts`). Everything else is standard and portable. See [DEPLOYMENT.md](my-brothers-keeper/DEPLOYMENT.md) for what needs to be replaced when hosting elsewhere.

---

## Quick Start

```bash
cd my-brothers-keeper
cp .env.example .env      # Fill in your values
pnpm install
pnpm db:push              # Apply database schema
pnpm dev                  # Starts at http://localhost:5000
```

---

## Repository Structure

```
our-brothers-keeper/
  my-brothers-keeper/     # All application source code
    client/               # React frontend
    server/               # Express + tRPC API
    shared/               # Types and constants shared between client and server
    drizzle/              # Database schema and migration outputs
    scripts/              # Utility scripts
    tests/                # Playwright end-to-end tests
    VISION.md
    PHILOSOPHY.md
    FOUNDER_NOTE.md
    CONTRIBUTING.md
    GOVERNANCE.md
    DEPLOYMENT.md
    .env.example
  attached_assets/        # Design assets
  README.md               # You are here
```

---

## License

MIT — because grieving families deserve tools that are open, accountable, and not dependent on any one person or company staying committed.

---

*This is not a startup built to monetize grief. It is a tool built to protect families.*
*If it ever loses that focus, it has failed.*
