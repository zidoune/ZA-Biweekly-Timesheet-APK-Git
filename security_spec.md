# Security Specification: Chronos Timesheet & Audit

## Data Invariants
1. All timesheet records, profile settings, projects, time entries, and days off are strictly scoped under `/users/{userId}`.
2. Only authenticated users where `request.auth.uid == userId` can read or write documents within their user sub-tree.
3. Every document write requires matching `userId == request.auth.uid`.
4. Document IDs must conform to alphanumeric formatting (`isValidId`).

## The "Dirty Dozen" Threat Payloads & Denials
1. Unauthenticated read to `/users/{userId}` -> PERMISSION_DENIED
2. Unauthenticated write to `/users/{userId}` -> PERMISSION_DENIED
3. User A attempting to read User B's profile `/users/{userB}` -> PERMISSION_DENIED
4. User A attempting to create a project under User B `/users/{userB}/projects/p1` -> PERMISSION_DENIED
5. User A attempting to delete User B's entry `/users/{userB}/entries/e1` -> PERMISSION_DENIED
6. User A attempting to spoof userId in payload -> PERMISSION_DENIED
7. User attempting to write to unmapped collection `/system_logs/1` -> PERMISSION_DENIED
8. User injecting excessively long malicious ID (>128 chars) -> PERMISSION_DENIED
9. User attempting to delete another user's day off -> PERMISSION_DENIED
10. Anonymous user attempting to read entries without login -> PERMISSION_DENIED
11. Query attempting to fetch all users' entries across collections -> PERMISSION_DENIED
12. Attempting to bypass default-deny catch-all -> PERMISSION_DENIED
