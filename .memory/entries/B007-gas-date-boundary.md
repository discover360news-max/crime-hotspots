---
id: B007
type: bug
status: active
created: 2026-03-02
updated: 2026-03-07
related: [B004, B010, F004]
---

## Summary
`filterCrimesByDateRange()` normalizes all crime dates to noon (12:00:00). When the blog automation trigger runs at 10AM, the end-day boundary sits at 10:00 AM. Crimes on the last day (normalized to 12:00 PM) fail the `<= 10:00 AM` check and are silently excluded.

## Fix
ALL date boundaries in GAS stats functions MUST use explicit setHours:
```js
const start = new Date(startDate);
start.setHours(0, 0, 0, 0);      // captures any time on first day

const end = new Date(endDate);
end.setHours(23, 59, 59, 999);   // captures any time on last day
```
Additionally, the window was changed from 7 days (`- 6`) to 8 days (`- 7`) as a buffer for timestamp-less data.

## Known Issues / Gotchas
- `validateBlogDataReadiness()` already had correct `setHours(12,0,0,0)` — only `generateBlogStatistics()` + `generateBlogData()` were wrong
- Files fixed: `weeklyBlogAutomation.gs`, `socialMediaStats.gs`, `blogDataGenerator.gs`
- This is separate from the timezone mismatch in B004 — that's about sheet vs CSV; this is about boundary precision

## Change Log
- 2026-03-02: Discovered during blog murder count debugging; fixed in all three GAS files
