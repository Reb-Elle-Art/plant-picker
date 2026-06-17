# Daily Briefing — Cron Job Instructions
_Embed these instructions verbatim in the daily-briefing cron job payload message._

---

## NEWS SOURCES (Fresh Search — No Domain Restrictions)

Always do fresh web searches. This list is for REPUTATION METADATA only — not a filter.

### Green tier (include normally, no further vetting):
reuters.com, apnews.com, bbc.com, npr.org, theguardian.com, nytimes.com, washingtonpost.com, wsj.com, economist.com, politico.com, axios.com, bloomberg.com, theprogress.com, scotusblog.com, law.com, abajournal.com

### Yellow tier (include with note if relevant):
techcrunch.com, theverge.com, arstechnica.com, wired.com, mittr.org, boston.com, wbur.org

### Red tier ⚠️ (flag if included):
breitbart.com, infowars.com — include only if Breaking/urgent AND has some attribution

Unknown outlets: fresh evaluation — check for author, sourcing, correction policy.

---

## TOPICS BY FREQUENCY

| Frequency | Topics |
|-----------|--------|
| **Daily** | AI, Stock Market, US Politics, EU Politics |
| **2-3x/week** | Law (media cases), Law (field changes), Law + AI, Paralegal/AI jobs |
| **Weekly** | Boston concerts, Music releases, Boston city government |

---

## NEWS GATHERING PROCESS

1. For each active topic for today, run a fresh web search (no domain restrictions)
2. Apply source reputation metadata above — green = auto-include, yellow = note, red = ⚠️ flag
3. Unknown sources: evaluate on the fly (author? sourcing? correction policy?)
4. Synthesize 1-2 sentence summary of the topic landscape
5. Include 3-5 relevant links **with URLs** (required — always cite the source)
6. Format per topic:
   - Green: [Topic]: [summary]
   - Yellow: [Topic]: [summary] (source: [outlet])
   - Red ⚠️: [Topic]: [summary] ⚠️ [source notes]

---

## LIFE SECTIONS (from Supabase or local tracker)

- **feeds**: Check for new posts since last briefing
- **reading**: Reading queue (next 1-2 items)
- **projects**: Current projects with deadline
- **tasks**: Today's to-do items
- **hobbies**: Daily practices

---

## TELEGRAM OUTPUT FORMAT (Plain Text Only)

```
Daily Briefing — [DATE]

[Topic]: [1-2 sentence summary] [source URL]
[Topic]: [1-2 sentence summary] [source URL]
...

[New Creator Posts]: [count or links]
[Reading Queue]: [items]
[WIP Project]: [current project] (Due: [date])
[Today's Tasks]:
- [task 1]
- [task 2]
...

Full version: [here.now URL]
```

**Rule: Every topic summary must include at least one source URL. No exceptions.**

---

## "TELL ME MORE" TRIGGER

When user says "tell me more about [topic]", "dig deeper on [topic]", "more on [topic]":
1. Run targeted search on that sub-topic
2. Return 1-3 specific article links with short descriptions
3. Include source attribution and reliability flag if applicable

---

## FULL HTML OUTPUT

Save to `data/briefings/YYYY-MM-DD.html` and publish to here.now.

---

_Created: 2026-04-30_
