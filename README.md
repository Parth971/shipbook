# Shipbook

A ship log with a gate.

You pile up the work that will go to production together. Some of it is a note. Some of it is breaking. Some of it is a command that must run before or after the push. When you ship, you walk that list in order. The pile becomes history with a date.

It is not a CI dashboard, not a changelog, and not a runbook. Those three glued together.

Deploys are often more than “just push code” — migrations, SQL, Terraform, Fluent Bit restarts, S3 path moves, one-off scripts. That human work keeps getting lost. Shipbook exists so it doesn’t.

## How it works

1. **Accumulate** entries on the current ship. Tag them as normal, breaking, or action required.
2. **Attach run items** that must happen before or after the push, in order.
3. **Ship** by walking the checklist: before the push → code is live → after the push. You cannot mark it shipped until every run item is done.
4. **Keep history.** A completed ship is archived with its date, entries, and run items. A fresh ship starts.

## Words

| | |
|---|---|
| **Ship** | The pile waiting to go out |
| **Entry** | One item in that pile |
| **Run item** | Something you must do, not just remember — timed `before` or `after` the push |
| **Ship** (verb) | Walk the gate and log it as history |

## Data

Shipbook is a static app. Everything lives in this browser. There is no backend.

Use **Data & backup** in the app to export or restore a JSON file before you clear browser data or switch machines.

## Run locally

```bash
npm install
npm run dev
```

`npm run build` writes the production site to `dist/`.

## GitHub Pages

Pushes to `main` build and deploy via `.github/workflows/deploy-pages.yml`.

In the GitHub repo: **Settings → Pages → Source → GitHub Actions**.
