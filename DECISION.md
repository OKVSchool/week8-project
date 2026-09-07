# Stack Decision Document

Choices listed in reversibility order — hardest to undo first, easiest last.

| # | Decision | Choice | Honest Cost |
|---|---|---|---|
| 1 | Data Shape | Relational | The cost of locking the schema first is that it takes actual changes to the coding to change it rather than using a form built into the website. |
| 2 | Database | PostgreSQL | Choosing PostgreSQL requires a migration to be ran for changes to new items that need to be tracked and an issue with the migration can cost a loss of data. |
| 3 | Backend Language | JavaScript / TypeScript (Node) | Ruby makes many decisions for you and I wanted to keep that control when building my site. Between Python and Node, Node handles many requests at the same time which is useful for quick additions like adding customer information or parts but does not handle complex computing like Python does. The computing is not required for the tasks it is currently being built for, however, if I needed it to actually calculate costs or generate PDF invoices for customers, Node would not be able to handle it. |
| 4 | Backend Framework | Next.js (full-stack) | Next.js keeps front and backend speaking the same language. If Next.js changes, it will affect the whole app rather than just one segment. |
| 5 | Frontend | React (via Next.js) | React has a similar issue to the Backend Framework. It keeps the frontend and backend the same language but will require an entire rebuild if it changes. |
| 6 | Hosting | Vercel | Vercel only opens when a request is made so multiple requests at a time could cause them to fail whereas Render keeps it open at all times mitigating this issue. |

---

## Search UI Assembly Plan

- [x] Wire `app/api/search/route.ts` to the `chunks` table in Supabase → check: `fetch('/api/search?q=return+policy')` in the browser console returns results with scores.
- [x] Wire the API route to `scripts/search.js` output → check: top result and score from the route match the script for the same query.
- [x] Wire `app/search/page.tsx` to the API route → check: submitting "sick leave" stores the results array in React state with no network errors.
- [x] Wire the results list to the page state → check: three cards render in the browser showing source, score, and chunk text with no blank or `[object Object]` cards.
- [ ] Wire the deployed app to Vercel → check: one live search on `week8-project-kp1v.vercel.app` returns the same top result as local dev.
