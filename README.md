# Packaged Commodity Legal Metrology Compliance System

Government-grade React + Vite web application for the **Ministry of Consumer
Affairs, Food & Public Distribution** to support packaged commodity
inspection and compliance checking under the **Legal Metrology (Packaged
Commodities) Rules, 2011**.

> Current status: **Application foundation**. Routing, layouts, design system,
> error handling and module boundaries are in place. Feature modules are not
> implemented yet.

---

## Technology Stack

| Layer        | Technology                              |
| ------------ | --------------------------------------- |
| Framework    | React 19                                |
| Build tool   | Vite 8                                  |
| Routing      | React Router 7                          |
| HTTP client  | Axios                                   |
| Linting      | Oxlint                                  |
| Styling      | Plain CSS with design tokens (CSS variables) |

---

## Folder Structure

```
src/
├── assets/               # Static assets (currently empty)
├── components/           # Reusable UI components
│   ├── common/           # Dropdown, Tooltip, ErrorBoundary
│   ├── layout/           # Header, Footer, Sidebar, Breadcrumb, ScrollToTop
│   ├── forms/            # Select, Textarea (Input lives under ui/)
│   ├── feedback/         # Alert, Toast, LoadingSpinner, LoadingOverlay,
│   │                     # ErrorMessage, EmptyState
│   ├── data-display/     # Pagination, InfoCard (Table, StatusBadge under ui/)
│   ├── ui/               # Shared primitives: Button, Card, Icon, Input,
│   │                     # Modal, PageHeader, StatusBadge, Table
│   └── upload/           # Existing upload/scanner preview components
├── layouts/
│   ├── MainLayout.jsx    # Public portal shell (Header + content + Footer)
│   ├── AuthLayout.jsx    # Centered authentication shell
│   └── OfficerLayout.jsx # Internal officer/administrator shell (sidebar)
├── pages/                # Route-level pages
│   ├── Home/  About/  Contact/  Info/
│   ├── Login/  Dashboard/  ScanProduct/
│   ├── Compliance/  Inspection/  Company/  Reports/  Admin/
│   ├── ModulePlaceholder/  NotFound/
├── modules/              # Feature module scaffolds (see below)
│   ├── auth/             # Login, users, roles, permissions
│   ├── scanning/         # Camera, image, QR/barcode, OCR, Gemini
│   ├── compliance/       # Rules engine, compliance assessment
│   ├── inspection/       # Officer verification, company workflow, notices
│   └── admin/            # Reports, analytics, audit, system management
├── services/
│   ├── api/              # apiClient.js (Axios) + endpoints.js (central map)
│   ├── storage/          # authStorage.js (localStorage helpers)
│   └── ...               # Existing domain services
├── hooks/                # useModal, useMediaQuery, ...
├── context/              # AuthContext
├── routes/               # AppRoutes.jsx, ProtectedRoute.jsx, routeConfig.js
├── constants/            # Roles, statuses, image config, route map
├── utils/                # classNames, fileValidation, constants
├── styles/               # variables.css, base.css, components.css
├── App.jsx               # Router root
└── main.jsx              # Entry point
```

Each module under `src/modules/*` has its own reserved structure so five
developers can work independently:

```
modules/<module>/
├── components/   # module-specific UI (no shared component duplication)
├── pages/        # module pages wired into routes
├── services/     # module API calls
├── hooks/        # module hooks
└── utils/        # module helpers
```

---

## How to Install

```bash
npm install
```

## How to Run

```bash
npm run dev       # Start the development server
npm run build     # Production build
npm run lint      # Run Oxlint
npm run preview   # Preview the production build
```

## Environment Variable Setup

Create a `.env` file at the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Supported variables:

| Variable              | Default     | Purpose                              |
| --------------------- | ----------- | ------------------------------------ |
| `VITE_API_BASE_URL`   | `/api`      | Backend API gateway base URL         |

Example:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

**Never** put secret API keys (e.g. Gemini) directly in frontend source code.
Use environment variables, and for browser apps prefer proxying through the
backend gateway.

---

## Routes

| Path            | Layout         | Description                       |
| --------------- | -------------- | --------------------------------- |
| `/`             | MainLayout     | Public landing page              |
| `/login`        | AuthLayout     | Login (placeholder)              |
| `/dashboard`    | OfficerLayout  | Officer dashboard                |
| `/scan`         | OfficerLayout  | Product scanning                 |
| `/compliance`   | OfficerLayout  | Compliance assessment            |
| `/inspection`   | OfficerLayout  | Inspection workflow              |
| `/company`      | OfficerLayout  | Registered companies             |
| `/reports`      | OfficerLayout  | Reports & analytics              |
| `/admin`        | OfficerLayout  | System administration            |
| `/about`        | MainLayout     | About the portal                 |
| `/contact`      | MainLayout     | Contact & support                |
| `/privacy`, `/terms`, `/accessibility` | MainLayout | Legal / info pages |
| `*`             | MainLayout     | 404 / Not found                  |

Protected routes redirect to `/login` when unauthenticated. Route definitions
are centralised in `src/routes/routeConfig.js`.

---

## Module Responsibilities

| Module       | Future scope                                                                 |
| ------------ | ---------------------------------------------------------------------------- |
| **auth**     | Login, users, roles, permissions, sessions                                   |
| **scanning** | Camera, image upload, QR/barcode, image quality, image processing, OCR, Gemini |
| **compliance** | Legal Metrology rules, rule engine, compliance assessment                  |
| **inspection** | Officer verification, company details, notifications, responses, re-inspection |
| **admin**    | Reports, analytics, audit logs, system management                            |

Do **not** mix business logic between modules. Shared, generic code belongs in
`src/components`, `src/hooks`, `src/utils`, `src/services`, `src/context`, or
`src/constants`.

---

## Design System

Government-style design tokens are defined in `src/styles/variables.css`
(deep navy primary, saffron secondary, green accent). Avoid gradients,
glassmorphism, neon colours and excessive shadows/rounding. Reuse the shared
components instead of restyling per module.

---

## Development Guidelines

- Reuse shared components from `src/components`; never duplicate them in modules.
- Keep route definitions centralised in `src/routes/routeConfig.js`.
- Keep API URLs in `src/services/api/endpoints.js`; never hard-code URLs in components.
- Import the Axios instance from `src/services/api/apiClient.js`.
- Use constants from `src/constants` for roles/statuses/image limits.
- No console errors; run `npm run lint` and confirm `npm run build` passes.
- Follow existing naming conventions (PascalCase components, kebab-case files
  with CSS in the same folder).

---

## Git Collaboration

Use a feature-branch workflow. `main` always stays deployable.

```
main
 ↓
feature/auth
feature/scanning
feature/compliance
feature/inspection
feature/admin
```

Rules:

- Each developer works on **their own feature branch** (e.g. `feature/auth`).
- Do **not** push unfinished work directly to `main`.
- Keep branches short; merge into `main` only after review and after the build
  and lint pass.
- Never commit `node_modules` or `dist` (already ignored in `.gitignore`).