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
