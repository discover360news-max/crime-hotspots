# CLAUDE.md

**Live site:** https://crimehotspots.com | **Working directory:** `astro-poc/` | **Framework:** Astro 6.0.8

---

## Start Every Session

1. Read `.memory/INDEX.md` — scan entries, open relevant ones before starting work
2. Read `docs/claude-context/site-features.md` before any implementation — states all active pages, components, scripts
3. If UI: `Glob pattern="*.astro" path="astro-poc/src/components/"` — never rebuild existing components

## Dev Commands

```bash
cd astro-poc
npm run dev      # port 4321
npm run build    # must pass before committing
npm run preview  # preview production build
```

## Hard Rules — Security

- Use `escapeHtml()` from `src/lib/escapeHtml.ts` on ALL `innerHTML` / `set:html` rendering
- Use `sanitizeUrl()` for external URLs in anchor hrefs
- Never add external domains to CSP (`public/_headers`) without justification
- Never hardcode API keys in source files
- Never remove Turnstile CAPTCHA, honeypot, or rate limiting from report forms
- Run `npm audit` periodically

## Hard Rules — Git

- Only commit when Kavell explicitly asks
- Never force push to main
- Never skip hooks (`--no-verify`)
- Never commit `.env` or secret files

## Hard Rules — Code

- Component-first: check `src/components/` before writing any UI code
- Check `docs/guides/DESIGN-TOKENS.md` before any styling change (Rose + Slate, `rounded-lg`)
- Working directory is `astro-poc/` — never work in the root (Vite version is deprecated)
- Keep page files under ~500 lines (content/simple pages) or ~600 lines (complex interactive pages like dashboards) — extract to components/scripts if larger
- No emojis unless Kavell asks
- **Interactive scripts always use `DOMContentLoaded`** — no exceptions
- **Never re-introduce `ClientRouter` / SPA / View Transitions** — removed Mar 15 2026 after causing site-wide interactive failures. Push back hard if suggested. See `.memory/entries/B002-isinline-spa-rerun.md`
- **No fancy Astro patterns** (is:inline scripts, astro:page-load, transition directives) — keep it simple: plain `<script>` + `DOMContentLoaded`

## After Kavell Confirms a Task is Complete

Update any files that were read to inform the task and are now stale. See SESSION.md for the full checklist.

## Owner

**Kavell Forde** — all decisions are open to challenge and criticism for the good of the project.
Always ask probing questions before implementing to avoid wasted effort.

---

*Full context: `.memory/INDEX.md` → entries/ | Feature registry: `docs/claude-context/site-features.md`*
