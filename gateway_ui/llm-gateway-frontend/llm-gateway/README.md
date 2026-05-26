# LLM Gateway — Frontend

Production-grade React dashboard and marketing site for the LLM Gateway API.

## Stack

- **React 18** + **Vite**
- **Tailwind CSS** (warm professional palette)
- **TanStack Query v5** (data fetching, caching)
- **React Router v6** (public + protected routes)
- **Supabase** (Google OAuth 2.0)
- **Recharts** (analytics charts)
- **Prism.js** (syntax highlighting)
- **Lucide React** (icons)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
VITE_API_BASE_URL=https://your-backend.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Enable **Google** as an OAuth provider in Authentication → Providers
3. Add your domain to the allowed redirect URLs
4. Copy the Project URL and anon key into `.env.local`

### 4. Run development server

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

## Project Structure

```
src/
  components/       # Reusable UI components (Logo, CodeBlock, StatCard, Badge, etc.)
  layouts/          # PublicLayout (navbar), DashboardLayout (sidebar)
  pages/            # LandingPage, DocsPage, ModelsPage, DashboardPage, KeysPage, UsagePage, RoutesPage
  lib/              # supabase.js, api.js (Axios with JWT interceptor)
  hooks/            # useAuth (AuthContext + AuthProvider)
  queries/          # TanStack Query hooks for all admin endpoints
  router.jsx        # Route definitions with auth guards
  App.jsx           # Root with AuthProvider + RouterProvider
```

## Routes

| Path | Auth | Description |
|------|------|-------------|
| `/` | Public (redirects if authed) | Landing page |
| `/docs` | Public | Documentation |
| `/models` | Public | Model directory |
| `/dashboard` | Protected | Overview with charts |
| `/keys` | Protected | API key management |
| `/usage` | Protected | Usage logs & analytics |
| `/routes` | Protected | Routing configuration |

## API Endpoints Used

All protected endpoints attach the Supabase JWT automatically via the Axios interceptor.

| Method | Path | Used in |
|--------|------|---------|
| `GET` | `/admin/keys` | Keys page |
| `POST` | `/admin/keys` | Create key modal |
| `DELETE` | `/admin/keys/{id}` | Deactivate key |
| `GET` | `/admin/quota` | Dashboard overview |
| `GET` | `/admin/usage` | Usage page + dashboard charts |
| `GET` | `/admin/models` | Routes page |

## Design System

Warm, light-mode professional palette — no dark mode, no gradients, no glassmorphism.

| Token | Value |
|-------|-------|
| Background | `#f6efe7` |
| Card | `#fffaf5` |
| Sidebar | `#e8dece` |
| Text Primary | `#2b2b2b` |
| Text Secondary | `#6f6a63` |
| Accent (Burnt Orange) | `#c96a3d` |
| Success (Olive Green) | `#657153` |
| Border | `#d8cdbd` |
| Danger | `#b54a3f` |
| Warning | `#c98a3d` |
