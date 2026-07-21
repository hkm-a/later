# Later

Later is a tiny, local-first inbox for links that should be dealt with later.
It intentionally stores data only in this browser using IndexedDB.

## Run

Requires Node.js 20.19+ (or 22.12+) and npm.

```bash
npm install
npm run dev
```

Use `npm run check` for TypeScript and production-build checks.

## Deliberately excluded

- Accounts, sync, and a backend
- Browser extension and bookmark import
- AI tagging, recommendations, and web-page scraping
- Teams, sharing, and mobile apps

Those are separate products until a real user need proves otherwise.
