# Using the cellar from Claude

The same cellar files work in Claude. Three ways, depending on where you are:

1. **Claude.ai (web/app):**
   - Easiest: paste the raw URL — `https://raw.githubusercontent.com/USERNAME/REPO/main/cellar.md`
     — and ask your question. Claude fetches and reads it.
   - Or connect the GitHub repo via Claude's GitHub connector, then reference it.
   - For a permanent setup, make a Claude **Project** and put the raw URL plus the
     palate guidance from `chatgpt-gpt-instructions.md` into the project's custom
     instructions. Every chat in that project then answers from the cellar.

2. **Cowork (this app):** it reads the local mirror directly. If you clone the
   repo into your Playground folder, just ask "what should I drink with X" and it
   reads `cellar.md` from disk. No URL needed.

3. **Offline / backup:** the local clone is a full copy; the git history is a
   week-by-week record of the cellar.

The recommendation logic and taste profile are identical to the ChatGPT GPT, so
reuse the INSTRUCTIONS block from `chatgpt-gpt-instructions.md`.
