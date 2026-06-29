# Database Design

## Overview

This document describes the database architecture for the Family Tree Management System.

The application uses **PostgreSQL** (Supabase) as the primary database.

Design goals:

- Scalable
- Flexible
- Multi-tenant
- Relationship-driven
- Optimized for genealogy queries

---

# Design Principles

## Multi-Tenant

Every family owns its own data.

```text
Family A
 ├── Members
 ├── Events
 └── Documents

Family B
 ├── Members
 ├── Events
 └── Documents
```

Most business tables include:

- family_id

---

## Relationship-Based Model

Do **not** store:

- father_id
- mother_id

Instead, relationships are stored separately.

Benefits:

- Multiple marriages
- Adoption
- Guardianship
- Future extensibility

---

# Entity Relationship Diagram

```text
Families
    │
    ├── Branches
    │
    ├── Persons
    │      │
    │      ├── Relationships
    │      ├── Documents
    │      └── Events
    │
    └── Memberships
```

---

# Tables

## profiles

Purpose:

Store user profile information.

Columns:

| Column     | Type |
| ---------- | ---- |
| id         | uuid |
| user_id    | uuid |
| full_name  | text |
| avatar_url | text |

---

## families

Purpose:

Represents a family or clan.

Columns:

| Column      | Type |
| ----------- | ---- |
| id          | uuid |
| name        | text |
| description | text |

---

## memberships

Purpose:

Connect users to families.

| Column    | Type |
| --------- | ---- |
| id        | uuid |
| family_id | uuid |
| user_id   | uuid |
| role      | text |

Roles:

- owner
- admin
- editor
- viewer

---

## branches

Purpose:

Family branches.

Supports nested branches.

| Column           | Type |
| ---------------- | ---- |
| id               | uuid |
| family_id        | uuid |
| parent_branch_id | uuid |
| name             | text |

---

## persons

Purpose:

Stores family members.

| Column      | Type |
| ----------- | ---- |
| id          | uuid |
| family_id   | uuid |
| branch_id   | uuid |
| first_name  | text |
| middle_name | text |
| last_name   | text |
| gender      | text |
| birth_date  | date |
| death_date  | date |
| biography   | text |
| avatar_url  | text |

---

## relationships

Purpose:

Stores all relationships.

| Column            | Type |
| ----------------- | ---- |
| id                | uuid |
| person1_id        | uuid |
| person2_id        | uuid |
| relationship_type | text |
| start_date        | date |
| end_date          | date |

Relationship Types:

- parent
- child
- spouse
- adoptive_parent
- guardian

---

## events

Purpose:

Family events.

Examples:

- Birth
- Death
- Wedding
- Reunion

---

## event_members

Purpose:

Many-to-many relation between events and people.

---

## documents

Purpose:

Uploaded files.

Examples:

- Photos
- PDF
- Certificates

---

# Relationships

```text
Family
    │
    ├── Branch
    │      │
    │      └── Person
    │             │
    │             ├── Relationship
    │             ├── Event
    │             └── Document
```

---

# Indexes

Recommended indexes:

```sql
family_id

branch_id

birth_date

last_name

relationship_type

person1_id

person2_id
```

---

# Constraints

Examples:

- Every person belongs to one family.
- Every branch belongs to one family.
- A relationship must connect two existing persons.
- Relationship types are restricted to predefined values.

---

# Naming Conventions

Tables:

- plural
- snake_case

Examples:

- persons
- relationships
- memberships

Columns:

- snake_case

Primary Keys:

- id (UUID)

Foreign Keys:

- family_id
- person_id
- branch_id

---

# Future Tables

Possible future additions:

- cemeteries
- graves
- notifications
- audit_logs
- qr_codes
- settings
- tags

---

# Performance Considerations

- Use UUID as primary keys.
- Create indexes on frequently queried columns.
- Use PostgreSQL Functions (RPC) for genealogy queries.
- Use Recursive CTE for ancestor and descendant traversal.
- Lazy-load large family trees instead of loading everything at once.
