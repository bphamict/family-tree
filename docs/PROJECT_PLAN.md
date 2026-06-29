# Family Tree Management System - Development Roadmap (Supabase Edition)

## Overview

This document outlines the architecture, database design, development roadmap, and best practices for building a modern Family Tree Management System using **Supabase** as the backend platform.

### Technology Stack

| Layer          | Technology               |
| -------------- | ------------------------ |
| Frontend       | Next.js                  |
| UI             | Tailwind CSS + shadcn/ui |
| Data Fetching  | React Query              |
| Forms          | React Hook Form + Zod    |
| Backend        | Supabase                 |
| Database       | PostgreSQL               |
| Authentication | Supabase Auth            |
| Storage        | Supabase Storage         |
| Realtime       | Supabase Realtime        |

---

# System Architecture

```text
                    Next.js
                       │
      React Query + Supabase Client
                       │
               Supabase Platform
                       │
 ┌────────────────────────────────────────┐
 │ PostgreSQL Database                    │
 │ Authentication                         │
 │ Storage                                │
 │ Realtime                               │
 │ Edge Functions                         │
 └────────────────────────────────────────┘
```

This architecture is suitable for small to medium-sized applications and can later be extended with a dedicated backend (e.g., NestJS) if business logic becomes more complex.

---

# Phase 1 - Authentication

Use **Supabase Auth** for user authentication.

## User Roles

* Super Admin
* Family Admin
* Editor
* Viewer

## Profiles Table

```text
profiles

id (uuid)
user_id
full_name
avatar_url
created_at
updated_at
```

---

# Phase 2 - Database Design

## families

Represents a family or clan.

```text
id
name
description
created_at
updated_at
```

---

## branches

Represents a branch within a family.

```text
id
family_id
parent_branch_id
name
description
created_at
updated_at
```

Supports unlimited hierarchical levels.

---

## persons

Stores information about each individual.

```text
id
family_id
branch_id

first_name
middle_name
last_name

gender

birth_date
death_date

birth_place
death_place

occupation

biography

avatar_url

created_at
updated_at
```

### Important

Avoid storing:

```text
father_id
mother_id
```

Instead, use a dedicated relationship table.

---

## relationships

Stores all family relationships.

```text
id

person1_id
person2_id

relationship_type

start_date
end_date

note

created_at
```

### Relationship Types

* Parent
* Child
* Spouse
* Adoptive Parent
* Guardian

This flexible approach supports:

* Multiple marriages
* Adoption
* Guardianship
* Complex family structures

---

## events

Stores family events.

```text
id

family_id

title

type

event_date

location

description

created_at
```

Examples:

* Birth
* Death
* Wedding
* Memorial Day
* Family Reunion

---

## event_members

Links people to events.

```text
event_id

person_id
```

---

## documents

Stores uploaded files.

```text
id

person_id

title

storage_path

type

created_at
```

Supported document types:

* Images
* PDF
* Birth Certificate
* Marriage Certificate
* Videos

---

# Phase 3 - Storage Structure

Use **Supabase Storage**.

Suggested buckets:

```text
avatars/
documents/
family/
grave/
marriage/
```

Example structure:

```text
avatars/person-001.jpg

documents/family-book.pdf

grave/grave-001.jpg
```

---

# Phase 4 - Authorization (Row Level Security)

Enable **Row Level Security (RLS)** from the beginning.

Users should only access data belonging to their family.

Example policy:

```sql
family_id IN (
    SELECT family_id
    FROM memberships
    WHERE user_id = auth.uid()
)
```

---

# Phase 5 - Membership

Allow users to manage multiple families.

```text
memberships

id

user_id

family_id

role

created_at
```

Available roles:

* Owner
* Admin
* Editor
* Viewer

---

# Phase 6 - User Interface

Suggested navigation:

```text
Dashboard
│
├── Families
├── Branches
├── Members
├── Family Tree
├── Timeline
├── Events
├── Documents
└── Settings
```

---

# Phase 7 - Family Tree Rendering

Avoid loading the entire family tree at once.

Recommended loading strategy:

```text
Load selected person
        │
        ▼
Load parents
        │
        ▼
Load spouses
        │
        ▼
Load children
        │
        ▼
Render graph
```

Use lazy loading for better performance.

Recommended libraries:

* React Flow
* D3.js (advanced customization)

---

# Phase 8 - SQL Views

Create SQL Views to simplify common queries.

Example:

```sql
family_tree_view
```

The view should join:

* Person
* Parents
* Children
* Spouses

Frontend query:

```sql
SELECT *
FROM family_tree_view;
```

---

# Phase 9 - PostgreSQL Functions (RPC)

Complex queries should be implemented as PostgreSQL Functions and exposed through Supabase RPC.

Recommended functions:

```text
rpc_get_family_tree()

rpc_get_ancestors()

rpc_get_descendants()

rpc_search_person()

rpc_family_statistics()
```

Example:

```typescript
const { data } = await supabase.rpc("rpc_get_ancestors", {
  person_id: id,
});
```

Advantages:

* Better performance
* Less network traffic
* Centralized business logic
* Easier maintenance

---

# Phase 10 - Realtime

Use Supabase Realtime to automatically synchronize:

* New family members
* Updated profiles
* Uploaded photos
* Family events
* Timeline changes

No manual page refresh required.

---

# Recommended Development Roadmap

## Sprint 1

### Foundation

* Initialize Supabase
* Configure Authentication
* User Profiles

Deliverable:

* User login
* User profile management

---

## Sprint 2

### Family Management

* Families
* Branches
* Memberships
* Role management

Deliverable:

* Multi-family support

---

## Sprint 3

### Family Members

* Person management
* Relationship management

Deliverable:

* CRUD for family members

---

## Sprint 4

### Family Tree

* Graph visualization
* Expand/collapse nodes
* Search members
* Lazy loading

Deliverable:

* Interactive family tree

---

## Sprint 5

### Timeline & Events

* Family events
* Timeline
* Memorial dates
* Birthdays

Deliverable:

* Historical timeline

---

## Sprint 6

### File Management

* Avatar upload
* Documents
* Photos

Deliverable:

* Media management

---

## Sprint 7

### Security

* Row Level Security
* Audit Logs
* Activity History

Deliverable:

* Secure multi-tenant system

---

## Sprint 8

### Import & Export

* CSV Import
* Excel Import
* PDF Export
* Excel Export

Deliverable:

* Data migration support

---

# Best Practices

## 1. Never Store Parent IDs Directly

Avoid:

```text
father_id
mother_id
```

Instead:

```text
relationships
```

Benefits:

* Supports multiple marriages
* Adoption
* Guardianship
* Future extensibility

---

## 2. Keep Business Logic in PostgreSQL

Use:

* Recursive CTE
* SQL Views
* PostgreSQL Functions (RPC)

Avoid implementing complex family tree algorithms on the frontend.

---

## 3. Enable RLS Early

Design all tables with Row Level Security from the beginning to avoid major refactoring later.

---

## 4. Use Lazy Loading

Family trees can become very large.

Only load:

* Parents
* Children
* Spouses
* Nearby relatives

instead of the entire dataset.

---

## 5. Organize Storage

Separate uploaded files into dedicated folders or buckets:

```text
avatars/
documents/
events/
grave/
family/
```

---

# Future Enhancements

* QR Code for each family member
* Family Timeline
* Cemetery Management
* Interactive Relationship Graph
* AI-powered Relationship Detection
* GEDCOM Import/Export
* Multi-language Support
* Mobile Application
* Notifications for Birthdays and Memorial Days
* Offline Support
* Version History
* Audit Logs
* Public Family Tree Sharing
* Printable Family Books (PDF)

---

# Conclusion

Supabase provides an excellent foundation for building a modern Family Tree Management System. Its built-in PostgreSQL database, authentication, storage, realtime capabilities, and Row Level Security significantly reduce backend development time while maintaining scalability.

For advanced features such as ancestor traversal, descendant lookup, or relationship graphs, leverage PostgreSQL Functions (RPC), Recursive CTEs, and SQL Views instead of moving complex logic to the frontend.

This architecture is production-ready, scalable, and can evolve into a full-featured genealogy platform without requiring major architectural changes.
