# Three Logged Semantic-Search Tests

Live deployment: https://week8-project-kp1v.vercel.app/search
Model: Xenova/all-MiniLM-L6-v2 (384-dim) | Corpus: 237 chunks from four Trailhead Supply Co. documents

---

## Test 1 — Meaning-Only Win

**Query:** "What if I feel too sick to come in to work?"

**Top result (score 0.5505):** Sick Leave & Leaves of Absence
> "If you're sick, stay home. We're a small team that handles gear, helps customers face to face and shares a break room — pushing through a contagious illness to come in helps no one."

**Verdict: PASS**
The passage never uses "feel," "to work," or "come in." The handbook says "shift" and "floor," not "work." Vector search bridged "too sick to come in" to "contagious illness" on meaning alone.

---

## Test 2 — Straightforward

**Query:** "What is the deadline to return a purchased item?"

**Top result (score 0.6470):**
> "Once we receive and inspect your returned item, refunds are issued to the original payment method used for the purchase. Refunds post within 5 to 7 business days after we receive the item."

**Verdict: FAIL**
The chunk matches the general return topic but answers the refund processing time, not the return window deadline. The wrong part of the policy surfaced.

---

## Test 3 — Edge Case

**Query:** "What is the store owner's name?"

**Top result (score 0.5196):**
> "For floor and product questions, ask Priya Nair."

**Verdict: FAIL**
Priya Nair is a point of contact, not the owner. The model matched "owner" to an authority figure. The handbook uses "founders," which doesn't map cleanly to "owner," and there is no named store owner in the corpus.
