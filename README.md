# NFL Pick'em (GitHub Pages + Firebase + The Odds API)

## Setup (about 15 minutes)
1. **Odds key:** get a free key at https://the-odds-api.com.
2. **Firebase:** create a project at console.firebase.google.com.
   - Build > Authentication > Sign-in method > enable **Google**. Under Settings > Authorized domains, add `YOURNAME.github.io`.
   - Build > Firestore Database > create (production mode).
   - Firestore > Rules: paste `firestore.rules` after replacing the three emails, then Publish.
   - Project settings > Your apps > Web app: copy the config into `index.html` (`initializeApp({...})`).
   - Project settings > Service accounts > Generate new private key (downloads a JSON file).
3. **GitHub:** push this folder to a new repo.
   - Settings > Secrets and variables > Actions > Secrets: `ODDS_API_KEY` and `FIREBASE_SERVICE_ACCOUNT` (paste the whole JSON).
   - Optional variable `WEEK1_START`: the Tuesday before Week 1 with timezone, e.g. `2026-09-08T00:00:00-04:00`.
   - Settings > Pages > Deploy from branch `main` / root.
   - Actions tab > "Sync NFL odds" > Run workflow to load the first games.
4. Share `https://YOURNAME.github.io/REPO/` with the other two players.

## Notes
- Lines refresh every 4 hours and freeze at kickoff. Run the workflow manually for a fresher line, or lower the cron interval (free tier is 500 credits/month, each run costs 1 credit for odds plus 2 for scores when needed).
- Locks are enforced by Firestore rules, not just the UI.
- Final scores come from the same API a few hours after kickoff, and grading happens automatically in the app.
- Spreads are DraftKings' line. Change `bookmakers=` in `scripts/sync.mjs` to use another book.
