# Project Agent Instructions

- Treat `spec.md` and `architecture.md` as the approved product and technical references. Keep them in sync when an approved requirement changes.
- Keep lottery statistics and historical simulations deterministic and explainable. A simulated round may use only data that was available before that round; never claim that analysis improves or guarantees winning odds.
- Enforce the access boundary: signed-out visitors can use only the random six-number preview; account features require Kakao authentication and must stay scoped to the authenticated user.
- Keep external credentials server-side. Scheduled draw imports and result checks must be safe to retry without duplicating data or notifications.
- Follow the selected stack in `architecture.md`; add dependencies only when the current stack cannot reasonably meet a documented requirement.
