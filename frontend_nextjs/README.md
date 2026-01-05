# frontend_nextjs (Task Manager UI)

This is a static-export compatible Next.js (App Router) SPA for the Task Management app.

## Backend API base URL (required for browser API calls)

The UI calls the backend REST API directly from the browser.

- Environment variable:
  - `NEXT_PUBLIC_API_BASE`
- Default (when not set): `http://localhost:3001`

Local dev defaults (recommended):
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

Example:

```bash
# from task-management-system-302621-302630/frontend_nextjs
export NEXT_PUBLIC_API_BASE="http://localhost:3001"
npm run dev
```

### Common integration notes

- The frontend sends `Authorization: Bearer <accessToken>` on API requests.
- The frontend also sets `credentials: "include"` to support optional cookie-based auth.
- If the backend returns **401**, the frontend will automatically clear the persisted session
  (localStorage) so the UI returns to a logged-out state cleanly.

## Session behavior (persistence)

This frontend is designed to work with `output: "export"` (pure SPA).  
Because static export cannot rely on Next.js server sessions, the app persists the auth session client-side:

- After login/register, the returned session (access token + user) is stored in `localStorage`
- On reload/redeploy, the app reads `localStorage` and resumes the session
- Logout clears local state immediately (best-effort call to backend logout)

## UI/UX enhancements (what changed)

The UI was refreshed to be more interactive, clean, and accessible while keeping existing auth + tasks CRUD behavior intact:

- Polished light theme using:
  - primary `#3b82f6`, accent/success `#06b6d4`, muted `#64748b`, error `#EF4444`
  - background `#f9fafb`, surface `#ffffff`, text `#111827`
- Subtle motion/feedback:
  - button hover/press micro-interactions
  - modal open/close transitions
  - toast enter/exit animations
  - skeleton loading placeholders for task list initial load
- Tasks dashboard improvements:
  - search input (title/description/status/priority)
  - status filter chips (All / Todo / In progress / Done)
  - pill badges for status and priority
  - inline status toggle (cycles todo → in_progress → done) using existing optimistic update logic
  - responsive grid layout for tasks (desktop/tablet friendly)
- Navigation polish:
  - refined sidebar active styling
  - top bar avatar initials when logged in
- Accessibility:
  - consistent focus-visible rings
  - modal ARIA improvements (`aria-describedby`, keyboard Escape support)

## Notes

- The UI expects backend endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/tasks`
  - `POST /api/tasks`
  - `PUT /api/tasks/:id`
  - `DELETE /api/tasks/:id`

If those endpoints are not available yet (404), you will see retry guidance in the UI.
