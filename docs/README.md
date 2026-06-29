# Family Tree Management System

A modern, scalable, and collaborative Family Tree Management System built with **Next.js** and **Supabase**.

## Overview

This project aims to provide a comprehensive platform for managing family genealogy, including:

- Family and branch management
- Family member profiles
- Parent-child relationships
- Marriage records
- Interactive family tree visualization
- Timeline and family events
- Document and photo management
- Multi-user collaboration with role-based access control

The system is designed to be scalable, secure, and easy to maintain by leveraging Supabase's built-in services.

---

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Query
- React Hook Form
- Zod

### Backend

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime
- PostgreSQL Functions (RPC)

---

## Project Goals

- Build an interactive family tree
- Support multiple families (multi-tenant)
- Secure data with Row Level Security (RLS)
- Store documents and family photos
- Support future mobile applications
- Provide import/export functionality
- Enable real-time collaboration

---

## Project Structure

```text
docs/
├── PROJECT_PLAN.md
├── REQUIREMENTS.md
└── DATABASE_DESIGN.md

src/
├── app/

supabase/
├── migrations/
├── functions/
├── seed.sql
└── config.toml
```

---

## Development Roadmap

The project will be developed incrementally:

- Phase 1 — Authentication & User Profiles
- Phase 2 — Family & Branch Management
- Phase 3 — Family Members
- Phase 4 — Relationships & Family Tree
- Phase 5 — Events & Timeline
- Phase 6 — Documents & Media
- Phase 7 — Security & Audit Logs
- Phase 8 — Import & Export

See **docs/PROJECT_PLAN.md** for detailed planning.

---

## Core Features

- Authentication
- Multi-family support
- Family member management
- Parent-child relationships
- Marriage management
- Interactive family tree
- Timeline
- Events
- Document management
- Image upload
- QR Codes (future)
- Notifications (future)
- Multi-language support (future)

---

## Architecture Principles

- PostgreSQL as the single source of truth
- Relationship-based data model
- RPC for complex queries
- Row Level Security by default
- Lazy loading for large family trees
- Modular and scalable architecture

---

## Contributing

Contributions are welcome.

Please read the project documentation before submitting pull requests.

---

## License

MIT License
