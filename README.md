# Jin's Cellar (data mirror)

A weekly snapshot of my wine cellar, exported from CellarTracker via Supabase.
Two files are regenerated each week and committed here, so the git history is
a running backup of the cellar over time:

- **`cellar.md`** — readable table of the current cellar plus recent ratings.
  This is what chat assistants (ChatGPT, Claude) read.
- **`cellar.json`** — the same data, structured, for precise/programmatic use.

## How it refreshes

`export-cellar.mjs` pulls three read-only Supabase views (`v_drink_status`,
`v_consumed_history`, `v_cellar_critics`) and writes the two files. The
GitHub Action in `.github/workflows/refresh-cellar.yml` runs it every Monday
and commits any changes. No server to run.

## One-time setup

1. Create this repo on GitHub (public, so chats can read the raw file with no auth).
2. Add the script, the workflow, and this README (drag-and-drop upload is fine).
3. In **Settings → Secrets and variables → Actions**, add two repository secrets:
   - `SUPABASE_URL` = `https://ahofommkgdrpedivuxai.supabase.co`
   - `SUPABASE_KEY` = the Supabase **publishable** key (read-only; the same one
     used by the dashboard, so not sensitive).
4. Go to the **Actions** tab, open *Refresh cellar export*, and click
   **Run workflow** once to generate the first `cellar.json` / `cellar.md`.
5. (Optional) Mirror to your computer: clone the repo or add it in GitHub
   Desktop, so you always have a local copy.

## The raw URLs (for chats)

After the first run, the readable file is at:

```
https://raw.githubusercontent.com/USERNAME/REPO/main/cellar.md
```

Replace `USERNAME/REPO` with your repo path. Use that URL in the ChatGPT and
Claude setup (see `chatgpt-gpt-instructions.md` and `claude-access-notes.md`).
