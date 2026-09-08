All quality checks for the assignments will be posted here for to be double checked during the building of the web app

---

## W8D5A - Assemble the System

- [x] Wire the search into the skeleton seam by seam, verifying each one before connecting the next
- [x] Use the live logs as the proof for each seam — request in, result count, response code — not just a page that looks right
- [x] Pass an end-to-end test on the deployed URL: a real question returns the right passage and shows in production logs
- [x] Diagnose at least one integration bug by naming the suspect — config, path, or environment — rather than guessing
- [x] Record each seam, its log evidence, and the bug you caught and how

---

**Live URL:** https://week8-project-kp1v.vercel.app/search

**The seams I wired, in order, and how I verified each:**
1. Embed server (Render) — hit /health and watched `modelReady: true` in the JSON response
2. API route → embed server — Vercel function log showed `[search] embedding dims: 384`
3. API route → pgvector (Supabase) — Vercel function log showed `[search] rows returned: 5`
4. Search page → API route → results — button transitioned from "Warming up…" to "Search", results rendered on screen
5. Full end-to-end on deployed Vercel URL — searched on week8-project-kp1v.vercel.app and got live passages back

**The end-to-end test — the question I asked and the passage that came back:**
Query: "How many days to return boots?"
Top result (77.7% match, returns-shipping-policy.txt): "You may return boots within 30 days if they have not been worn outdoors. Trying boots on indoors — walking around the house, testing the fit on the carpet, checking how they feel with your hiking socks — is completely fine and will not void your return."

**One thing the wire-and-verify rhythm caught that big-bang would have buried:**
DATABASE_URL was missing from the Vercel environment entirely. Without seam-by-seam verification the symptom was silent — the search returned empty results with no error, making it look like a query or embedding bug. Verifying the DB seam in isolation surfaced the real suspect immediately: a missing environment variable, not broken code.