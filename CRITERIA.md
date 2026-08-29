# Project Criteria

## 1. Decision Document [x]
*A tradeoff stated for every stack choice, in your own words*

- [x] All six rows in reversibility order — data shape first, hosting last — each with the choice and one honest cost, never a benefit in disguise
- [x] The tradeoffs are in your words, restated for your app — not copied from a reference panel
- [x] Every row is defensible: it could answer "why this and not the alternative?" to someone who chose differently

**Done when:** You can point at any row and give a straight answer to "why this and not the alternative?"

---

## 2. Live Skeleton URL [ ]
*Loads clean from a fresh tab (and your phone)*

- [ ] A real public address — the deployed URL, not the localhost tab that's been open since morning
- [ ] Opens clean in a fresh tab; the phone-on-mobile-data check rules out a whole class of it-works-on-my-machine assumptions
- [ ] By the end of the week it doesn't just load — it takes a question and answers it

**Done when:** The URL opens on your phone, off your dev network, and the app loads clean.

---

## 3. Logs + Metrics Demonstrably Working [ ]
*You just watched a request appear*

- [ ] Structured, leveled log lines covering the edges of every request and every error — with no password, token, or raw request body in any of them
- [ ] Requests, errors, and latency readable from your host's dashboard or logs view
- [ ] "Demonstrably" is the load-bearing word: trigger a request and watch it show up — don't check this one from memory

**Done when:** You send one request right now and watch its log line appear in production.

---

## 4. Break-and-Recover Evidence [ ]
*A deliberate break, caught and rolled back*

- [ ] One controlled break, applied on purpose, with the symptom described in plain words
- [ ] The smoking-gun log line that caught it — screenshot saved
- [ ] The recovery closed all the way: the app back to working, with proof, not just "the error went away"

**Done when:** Your evidence shows all three beats — the break, the log line that caught it, and the app working again.

---

## 5. Course Corpus Ingested [ ]
*Chunk count on screen, a number you can name*

- [ ] All four Trailhead documents cleaned, chunked, embedded, and loaded — one pipeline, run start to finish
- [ ] The count comes from the vector store itself, and it's sane for the corpus — not three chunks, not three thousand
- [ ] You can state the chunk size and overlap that produced it, and one spot-check that made you trust the result

**Done when:** You run a count against the store and the number on screen matches the one in your submission.

---

## 6. Three Logged Semantic-Search Tests [ ]
*Each judged, including the meaning-only win*

- [ ] Three genuinely different queries, each logged with the top result's text and its score
- [ ] Every query judged pass or fail, with the actual reason — not "looks good"
- [ ] One query won on meaning alone, with the words that didn't overlap named explicitly — that's the evidence retrieval understands meaning, not keywords

**Done when:** Your log names the non-overlapping words on the meaning-only win, and a logged fail (if you caught one) says why it missed.

---

## 7. The Five-Line C2 Baseline Note [ ]

- [ ] Five lines: rough hours your Course 2 build cost, three specific friction points, and the one thing you refuse to repeat
- [ ] Honest beats flattering — this is the "before" every later improvement gets measured against
- [ ] Written in the final session, while the memory of the first build is still sharp

**Done when:** The five lines exist, they're specific, and you'd stand behind them as a fair picture of the first build.
