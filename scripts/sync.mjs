import admin from "firebase-admin";
const KEY = process.env.ODDS_API_KEY;
const START = new Date(process.env.WEEK1_START || "2026-09-08T00:00:00-04:00"); // Tuesday before Week 1
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = admin.firestore(), TS = admin.firestore.Timestamp;
const base = "https://api.the-odds-api.com/v4/sports/americanfootball_nfl";
const get = async (p) => { const r = await fetch(`${base}/${p}&apiKey=${KEY}`); const j = await r.json(); if (!r.ok) throw new Error(JSON.stringify(j)); return j; };
const now = Date.now();

// 1) Spreads (home team's line). Lines freeze once a game has kicked off.
const odds = await get("odds?regions=us&markets=spreads&oddsFormat=american&bookmakers=draftkings");
for (const g of odds) {
  const kick = new Date(g.commence_time);
  const ref = db.collection("games").doc(g.id);
  if (kick.getTime() <= now && (await ref.get()).exists) continue;
  const pt = g.bookmakers?.[0]?.markets?.find(m => m.key === "spreads")?.outcomes?.find(o => o.name === g.home_team)?.point;
  if (pt == null) continue;
  const week = Math.floor((kick - START) / (7 * 864e5)) + 1;
  await ref.set({ week, away: g.away_team, home: g.home_team, spread: pt, kickoff: TS.fromDate(kick), book: "DraftKings" }, { merge: true });
}

// 2) Final scores, only if a game started 3h+ ago and isn't graded yet (saves credits)
const open = (await db.collection("games").get()).docs.filter(d => {
  const k = d.data().kickoff.toMillis(); return !d.data().completed && k < now - 3 * 36e5 && k > now - 3 * 864e5; });
if (open.length) {
  for (const s of await get("scores?daysFrom=3")) {
    if (!s.completed || !s.scores) continue;
    const ref = db.collection("games").doc(s.id);
    if (!(await ref.get()).exists) continue;
    const sc = n => +s.scores.find(x => x.name === n).score;
    await ref.update({ aScore: sc(s.away_team), hScore: sc(s.home_team), completed: true });
  }
}
console.log("synced", odds.length, "games");
