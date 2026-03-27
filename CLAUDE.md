# CLAUDE.md — `admin/`

> Rules for the internal Next.js admin panel.
> Also read the root `CLAUDE.md` before working here.

---

## What This App Is

Internal admin dashboard used by the team to manage users, content, and platform data.
Not public-facing. Communicates with `backend/` only via HTTP API — never directly imports from `backend/`.

## Stack

- Next.js (App Router)
- TypeScript (strict — no `any`)
- Tailwind CSS (no inline styles)

---

## Folder Structure

```
admin/
└── src/
    ├── app/              ← ROUTING ONLY (Next.js App Router)
    │   ├── (auth)/
    │   │   └── login/page.tsx
    │   ├── dashboard/page.tsx
    │   ├── users/
    │   │   ├── page.tsx
    │   │   └── [id]/page.tsx
    │   ├── videos/
    │   │   ├── page.tsx
    │   │   └── [id]/page.tsx
    │   ├── layout.tsx
    │   └── api/          ← Thin proxy routes to backend only
    │
    ├── pages/            ← FULL PAGE COMPOSITIONS
    │   ├── auth/
    │   │   └── Login.page.tsx
    │   ├── dashboard/
    │   │   └── Dashboard.page.tsx
    │   ├── users/
    │   │   ├── UserList.page.tsx
    │   │   └── UserDetail.page.tsx
    │   └── videos/
    │       ├── VideoList.page.tsx
    │       └── VideoDetail.page.tsx
    │
    ├── components/
    │   ├── ui/           ← Atoms: Button, Input, Modal, Table, Badge
    │   ├── layout/       ← AdminNavbar, AdminSidebar, PageWrapper
    │   ├── forms/        ← FormField, ValidationMessage, SearchBar
    │   └── features/     ← UserTable, VideoTable, StatsGrid, etc.
    │
    ├── hooks/            ← Custom hooks (useAdminData, useTable, etc.)
    ├── lib/
    │   ├── api.ts        ← All fetch/axios calls to backend
    │   ├── formatters.ts
    │   └── validators.ts
    ├── types/            ← Shared TypeScript types
    └── styles/
        └── globals.css
```

---

## The Two-Layer Rule (Same as frontend — always enforced)

### `app/` — Routing Only
- One `page.tsx` per route
- Imports **exactly one** page component
- Metadata exports only
- **Zero** `useState`, `useEffect`, or JSX logic

### `pages/` — Composition Only
- Assembles components
- May use hooks and manage state
- No routing concerns

```tsx
// ✅ Correct — admin/src/app/users/page.tsx
import { UserListPage } from '@/pages/users/UserList.page';
export default function UsersRoute() { return <UserListPage />; }
```

---

## Admin vs Frontend — Key Differences

| | `frontend/` | `admin/` |
|---|---|---|
| Audience | End users | Internal team |
| Auth | User JWT | Admin JWT (separate role) |
| Access | Public routes | All routes protected by default |
| Data scope | Own user's data | All users' data |

All routes in admin should be protected. Add a global auth check in `admin/src/app/layout.tsx` or via a middleware.

---

## API Calls

All calls go through `src/lib/api.ts`. Never fetch directly inside a component.

```ts
// ✅ src/lib/api.ts
export async function getAllUsers(): Promise<User[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
}
```

---

## Styling

```tsx
✅  className={cn('px-4 py-2', isActive && 'bg-blue-600')}
❌  style={{ padding: '8px 16px' }}
```

---

## File Naming

| Type | Pattern | Example |
|---|---|---|
| Route | `lowercase/page.tsx` | `app/users/page.tsx` |
| Page | `PascalCase.page.tsx` | `UserList.page.tsx` |
| Component | `PascalCase.tsx` | `UserTable.tsx` |
| Hook | `useCamelCase.ts` | `useAdminData.ts` |
| Types | `name.types.ts` | `user.types.ts` |

---

## PR Checklist

- [ ] `app/page.tsx` has only metadata + one page import — no logic
- [ ] All routes are protected (no unauthenticated access)
- [ ] All API calls go through `lib/api.ts`
- [ ] No `style={{}}` — Tailwind + `cn()` only
- [ ] No `any` types
- [ ] Components are reusable (no admin-page-specific hardcoding)
- [ ] No direct imports from `backend/` or `frontend/`
