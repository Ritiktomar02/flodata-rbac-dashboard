# Flodata · Dynamic RBAC Dashboard Platform

A secure, multi-user dashboard platform where access to features, data, and UI elements is controlled dynamically through Role-Based Access Control. Built as a take-home for **Flodata Analytics**.

- **Stack:** MERN (MongoDB · Express · React 19 · Node.js)
- **Auth:** JWT in an httpOnly cookie
- **Authorization:** Module + action permissions, plus **field-level rules** (hidden + read-only) enforced on **both API and UI**
- **Dashboard:** Drag-and-drop grid (`react-grid-layout`) with chart / table / stat widgets, saved per user
- **Live demo:** [flodata-rbac-dashboard.vercel.app](https://flodata-rbac-dashboard.vercel.app)
- **Walkthrough video:** [Watch on Google Drive](https://drive.google.com/file/d/1IpqC_W-yOKldO4nNVrB75hMlPFGPYpee/view?usp=sharing)

---

## Repository structure

```
flodata-rbac-dashboard/
├── backend/
│   ├── config/                  # db connection
│   ├── controllers/             # user, role, dashboard, audit
│   ├── middlewares/             # auth + requirePermission
│   ├── models/                  # User, Role, Dashboard, AuditLog
│   ├── routes/                  # /user, /roles, /dashboard, /audit
│   ├── utils/                   # token cookie helper
│   ├── scripts/seed.js          # 4 sample roles + 4 sample users
│   ├── server.js
│   └── package.json
└── frontend/
    ├── public/favicon.svg
    ├── src/
    │   ├── components/          # Sidebar, Input, RoleEditor, UserFormModal, LoadingSpinner
    │   │   ├── widgets/         # Stat, Table, Chart
    │   │   └── dashboard/       # AddWidgetModal
    │   ├── pages/               # Login, Dashboard, RolesPage, UsersPage, AuditPage
    │   ├── context/             # UserContext + UserProvider
    │   ├── services/api.js      # endpoint URLs
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    └── package.json
```

---

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB (local at `mongodb://localhost:27017` or Atlas)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env       # then edit secrets
npm run seed               # seeds 4 roles and 4 users
npm run dev                # http://localhost:8080
```

`backend/.env`:

```env
PORT=8080
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/flodata-rbac
JWT_SECRET=replace-me-with-a-long-random-string
CLIENT_URL=http://localhost:5173
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env       # VITE_BASE_URL=http://localhost:8080
npm run dev                # http://localhost:5173
```

The login screen has one-click chips for each sample role.

---

## Sample users (seeded)

| Email | Password | Role | What they can do |
|---|---|---|---|
| `admin@flodata.test`   | `Admin@123`   | **Admin**   | Full user CRUD, full role CRUD, audit log, full sales data, edit dashboard |
| `manager@flodata.test` | `Manager@123` | **Manager** | Read + edit users (but **email is read-only**), full sales data, edit dashboard |
| `analyst@flodata.test` | `Analyst@123` | **Analyst** | Sales data **without customer/rep** PII, edit dashboard, no users/roles |
| `viewer@flodata.test`  | `Viewer@123`  | **Viewer**  | Top-line revenue only — **margin/cost/customer/rep hidden**, view-only dashboard |

Try the same dashboard with each role — the table loses columns, stat widgets switch to "Restricted by your role", and the edit/add buttons disappear for Viewer.

To see read-only field protection in action: log in as Manager → Users page → click the pencil to edit any user → the email field is disabled and labelled "Read-only". Trying to PATCH it via curl returns `403 "These fields are read-only for your role: email"`.

---

## RBAC design

There are **three layers** of access control, each enforced on the backend and reflected in the UI.

### 1. Module + action (CRUD)

Each role has an array of `{ module, actions[] }` permissions. Modules are open strings — `dashboard`, `users`, `roles`, `sales`, `audit` — so adding a new area only needs a new entry, no schema change. Actions are CRUD: `create`, `read`, `update`, `delete`.

The middleware `requirePermission(module, action)` is attached to every protected route:

```js
// backend/routes/role-route.js
router.delete("/delete/:roleId", isUser, requirePermission("roles", "delete"), deleteRole);
```

### 2. Attribute-level (field-level) rules

For data-bearing modules, a role can declare `hiddenFields` (read protection) and `readOnlyFields` (write protection).

**Hidden fields** — `sales` is the demo case. The dashboard data API strips hidden keys server-side:

```js
// backend/controllers/dashboard-controller.js
const hidden = req.fieldRules?.[schema.module]?.hidden || new Set();
const rows = datasets[name].map((r) => filterRow(r, hidden));
```

A Viewer's `/dashboard/dataset/sales` response simply doesn't contain `cost`, `margin`, `customer`, or `rep` keys — verifiable in DevTools.

**Read-only fields** — `users` is the demo case. The user update endpoint rejects any payload that touches a read-only field:

```js
// backend/controllers/user-controller.js
const readOnly = req.fieldRules?.users?.readOnly || new Set();
const blocked  = Object.keys(updates).filter((k) => readOnly.has(k));
if (blocked.length) return res.status(403).json({
  message: `These fields are read-only for your role: ${blocked.join(", ")}`
});
```

The auth snapshot exposes the same rules to the frontend so edit forms can disable inputs proactively:

```js
auth.permissions.users.includes("update")
auth.fieldRules.sales.hiddenFields.includes("margin")
auth.fieldRules.users.readOnlyFields.includes("email")
auth.dashboard.canEditLayout
```

### 3. Dashboard-builder capabilities

Separate from CRUD — these flags shape the **builder experience**, not the data. Each role declares:

- `dashboard.canEditLayout` — whether the user can drag/resize/add/remove widgets
- `dashboard.allowedWidgets` — which widget types they may add (`chart`, `table`, `stat`)

A Viewer with no edit rights still sees a dashboard, just immutably.

---

## Key flows

### Authentication

- `POST /user/login` — returns user + `auth` snapshot, sets `token` httpOnly cookie (1 day)
- `POST /user/logout` — clears cookie
- `GET /user/profile` — re-fetches user + auth snapshot (used after role changes)

### Role management UI

- `RolesPage` lists all roles as cards
- `RoleEditor` is a modal with three sections:
  - **Permissions matrix** — checkbox grid of modules × CRUD. Cells show `—` for action/module pairs that are not wired in this build.
  - **Field-level rules** — per module, two chip rows: red for hidden, amber for read-only. Each module declares which kinds of rules it actually enforces.
  - **Dashboard builder** — `canEditLayout` + allowed widget types

System roles (Admin/Manager/Analyst/Viewer) are flagged `isSystem` and protected from deletion / Admin from modification.

### User management UI

- `UsersPage` lists users in a table
- **+ New User** button (gated by `users:create`) opens a modal with username, email, password, and a role multi-picker
- **Pencil** button per row (gated by `users:update`) opens an Edit User modal — fields flagged read-only for your role render `disabled`
- **Trash** button per row (gated by `users:delete`) — you can't delete yourself
- Per-row checkboxes assign roles; **Save** appears when the row is dirty
- Saving your own roles refreshes the local `auth` snapshot, so the sidebar updates immediately

### Audit log

Every role and user change is recorded in `AuditLog`:
`role.create / role.update / role.delete / user.create / user.update / user.delete / user.assign-roles`. Visible to anyone with `audit:read` (Admin only by default).

### Dashboard builder

- `react-grid-layout` (Responsive) for drag/resize/reorder
- Widget positions are stored in 12-col coordinates; the frontend scales them per breakpoint (lg/md/sm/xs/xxs) so the layout stays consistent on every screen size
- Each user has one `Dashboard` document storing their `widgets` array
- `Reset` restores a sensible default layout
- Widgets fetch their own data from `/dashboard/dataset/:name` or `/dashboard/stats`
- All those endpoints re-check permissions and field rules on every request

---

## API reference

### `/user`
| Method | Endpoint | Auth |
|---|---|---|
| POST   | `/login` | — |
| POST   | `/logout` | — |
| GET    | `/profile` | logged in |
| GET    | `/all` | `users:read` |
| POST   | `/create` | `users:create` |
| PUT    | `/update/:userId` | `users:update` (rejects writes to read-only fields) |
| DELETE | `/delete/:userId` | `users:delete` |
| PUT    | `/assign-roles` | `users:update` |

### `/roles`
| Method | Endpoint | Auth |
|---|---|---|
| GET    | `/all` | `roles:read` |
| POST   | `/create` | `roles:create` |
| PUT    | `/update/:roleId` | `roles:update` |
| DELETE | `/delete/:roleId` | `roles:delete` |

### `/dashboard`
| Method | Endpoint | Auth |
|---|---|---|
| GET  | `/me` | `dashboard:read` |
| PUT  | `/me` | `dashboard:update` |
| POST | `/reset` | `dashboard:update` |
| GET  | `/stats` | `dashboard:read` + sales filter |
| GET  | `/dataset/:name` | `dashboard:read` + `<module>:read` (response is field-filtered) |

### `/audit`
| Method | Endpoint | Auth |
|---|---|---|
| GET | `/all` | `audit:read` |

---

## Walkthrough script (for the demo video)

1. Sign in as **Admin** → sidebar shows Dashboard, Roles, Users, Audit. Dashboard shows all 4 stat tiles populated.
2. Open **Roles** → create a role "Sales Lead": tick `sales: read`, `dashboard: read, update`, allow chart + stat widgets, in field rules add `sales` and click `cost` (hidden).
3. Open **Users** → click **+ New User**, create one with the Sales Lead role assigned. Save.
4. Log out → log in with that new user → no `cost` column on the table, "Total Cost" tile says "Restricted by your role". Open DevTools → Network → `/dashboard/dataset/sales` — `cost` key is missing from every row.
5. Log in as **Manager** → Users page → edit any user → email field is disabled with a Lock icon. Try a curl PATCH against the email — server returns `403`.
6. Log in as **Analyst** → revenue and margin both work, customer/rep columns gone in the table.
7. Log in as **Viewer** → sidebar shrinks to just Dashboard, edit button is gone, Margin and Cost tiles say "Restricted by your role".
8. Open **Audit** as Admin — every role create / user create / role assignment from the demo appears.

---

## Notes

- **Datasets are in-memory** to keep the demo runnable with just a fresh MongoDB. A real implementation would query Mongo and reuse the same `filterRow` helper.
- **The Admin system role is protected from edits** — otherwise a careless save could lock everyone out of role management.
- **You cannot delete yourself** — the user-delete endpoint blocks `userId === req.userId`.
- **No public sign-up.** New users come from the seed script or `POST /user/create` (gated by `users:create`). RBAC is the focus, not signup ergonomics.
