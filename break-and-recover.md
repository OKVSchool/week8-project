# Break-and-Recover Evidence

Live deployment: https://week8-project-kp1v.vercel.app

---

## The Break

**What was changed on purpose:** Added `throw new Error('deliberate break')` inside the health check handler in `app/api/health/route.ts`.

**Symptom in plain words:** Opened the health check page and it did not load. The browser returned a 500 error — "The server responded with a 500 error."

---

## The Smoking-Gun Log Line

From the terminal logs:
```
{"level":"error","event":"health.check.failed","error":"deliberate break","ts":"2026-09-07T03:10:24.515Z"}
```

**What it points to:** The structured logger caught the thrown error and identified the handler as the source of the failure.

---

## The Recovery

**How it was fixed:** Removed `throw new Error('deliberate break')` from `app/api/health/route.ts` and redeployed.

**Proof the app was back:** Reran the health check page — it returned `{"status":"ok"}`. Terminal logs confirmed:
```
GET /api/health 200 in 78ms (next.js: 56ms, proxy.ts: 10ms, application-code: 12ms)
```

The 200 response and matching log line confirmed the recovery was complete.
