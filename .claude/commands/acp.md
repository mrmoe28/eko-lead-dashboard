---
description: Add, commit, and push all changes to GitHub
---

Execute the following git workflow:

1. Run `git add -A` to stage all changes
2. Run `git status` to show what will be committed
3. Generate a meaningful commit message using Conventional Commits format based on the staged changes:
   - Use prefixes: feat, fix, chore, docs, refactor, style, test, perf
   - Format: `<type>: <description>`
   - Examples:
     - "feat: add worker-based scraper system"
     - "fix: resolve TypeScript compilation errors"
     - "chore: update dependencies"
     - "docs: add worker system documentation"
4. Run `git commit -m "<generated message>"`
5. Run `git push origin main` (or current branch)
6. Confirm success with final commit hash and push status

IMPORTANT:
- Analyze the changes to generate an accurate commit message
- Use present tense ("add" not "added")
- Be descriptive but concise
- Never commit without analyzing what changed first
- If there are no changes, inform the user
