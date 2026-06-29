# Project Plan

## Overview

This document defines the development plan for the Family Tree Management System.

The project is built incrementally, starting from core infrastructure to advanced genealogy features.

---

## Goals

- Build a scalable family tree system
- Support multi-family (multi-tenant)
- Ensure secure data with Supabase RLS
- Enable relationship-based genealogy model
- Provide interactive visualization

---

## Development Phases

---

## Phase 1: Project Setup

**Goal:** Initialize core infrastructure

Tasks:

- Setup Next.js project (App Router)
- Setup Supabase project
- Configure environment variables
- Setup folder structure
- Configure TypeScript + ESLint
- Setup shadcn/ui
- Setup Cursor rules

Output:

- Running base app
- Connected Supabase

---

## Phase 2: Authentication System

**Goal:** Enable user login & identity

Tasks:

- Supabase Auth setup
- Login / Register UI
- Session management
- Protected routes
- User profile table

Output:

- Users can sign in/out securely

---

## Phase 3: Family Management

**Goal:** Multi-tenant family system

Tasks:

- Create families table
- Membership system (roles)
- Invite users to family
- Switch between families
- RLS policies for isolation

Output:

- Users belong to families securely

---

## Phase 4: Member Management

**Goal:** Manage family members

Tasks:

- Create persons table
- CRUD members
- Upload avatar (Supabase Storage)
- Basic profile page
- Search members

Output:

- Family members can be managed

---

## Phase 5: Relationship System

**Goal:** Build genealogy model

Tasks:

- Create relationships table
- Support:
  - parent-child
  - spouse
  - adoption
- Relationship service layer
- Validation rules

Output:

- Graph-based family relationships

---

## Phase 6: Family Tree Visualization

**Goal:** Visual representation

Tasks:

- Tree rendering UI
- Zoom / pan support
- Expand / collapse nodes
- Lazy loading large trees
- Optimize rendering performance

Output:

- Interactive family tree UI

---

## Phase 7: Events & Timeline

**Goal:** Add historical context

Tasks:

- Events table
- Birth / death / marriage events
- Timeline UI
- Link events to persons

Output:

- Chronological family history

---

## Phase 8: Documents & Media

**Goal:** Store family records

Tasks:

- Supabase Storage integration
- Upload images, PDFs
- Attach documents to persons/events
- Media gallery UI

Output:

- Family archive system

---

## Phase 9: Search & Optimization

**Goal:** Improve performance & UX

Tasks:

- Full-text search
- Index optimization
- RPC queries for tree traversal
- Pagination & lazy loading
- Caching strategies

Output:

- Fast and scalable system

---

## Phase 10: Advanced Features (Optional)

- QR code for members
- AI relationship suggestions
- Public family tree sharing
- Multi-language support
- Export to PDF / GEDCOM

---

## Milestone Strategy

Each phase must:

1. Be fully completed
2. Be tested manually
3. Be reviewed before moving to next phase
4. Not mix multiple phases at once

---

## Development Rules

- Follow `.cursor/rules/*`
- Always implement feature-by-feature
- Do not skip phases
- Prefer simplicity over premature optimization
- Use Supabase as backend of record

---

## Success Definition

The project is considered successful when:

- Users can create and manage families
- Relationships are correctly modeled
- Family tree is visually interactive
- Data is secure (RLS enforced)
- System is scalable for large families