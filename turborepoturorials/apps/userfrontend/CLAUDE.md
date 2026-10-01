@AGENTS.md

## Working rules (frontend-first)
- Mock data lives only in `app/(usersobuyaone)/dummydata/` (temporary — never delete without the owner's say-so).
- Pages get data only through `services/api.ts`, in the exact response shape documented in `api.md`, so connecting to the backend is a one-line swap.
- Keep `api.md` updated with every API (method, path, request, response shape) in the same change, and list the APIs touched at the end of each task.
- Every store flow must work end-to-end on dummy data. Write optimised, well-organised code.
