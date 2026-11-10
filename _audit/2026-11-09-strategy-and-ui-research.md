# Strategy + UI research: portfolio, LeakGuard, research generator

> **Correction (2026-11-10):** §4's `file:line` refs and linter counts came from a local checkout that was 48 commits behind `origin/main`. The live-site screenshots and findings are current. The plan `docs/superpowers/plans/2026-11-10-portfolio-polish.md` has the refs re-linted against origin/main.

Date: 2026-11-09. Lenses: grilling (Matt Pocock), lateral inversion, taste-skill, Hallmark audit.
Sources: live site (desktop and 375px), Hallmark `sloplint` on `index.html`, web research with URLs below.

## 1. Headline findings

Labels: **[checked]** means I verified it this session. **[reported]** means a research subagent found it and I did not re-verify it; a few of those came from its memory rather than a fetched page.

0. **Your strongest asset is already built [checked].** `~/Documents/Github/Report-Generator`, called "Research Compiler", is an evidence-backed report compiler. It goes sources → EvidenceItems → assessed ReportClaims → PDF/DOCX, with a BuildFingerprint and a lineage manifest. It has 514 offline tests and is at milestone v0.7. It already does what Gemini's "auditor voice" promised. The leakage idea fits inside it as a **validation rule pack**, not as a separate product.
1. **The name and the product already exist [checked].** `leakguard-mcp` is on PyPI (v0.1.1, MIT): a local MCP server and CLI that lints agent-written pandas/numpy/polars code for lookahead bias, 10 rules, non-zero exit for CI. https://pypi.org/pypi/leakguard-mcp/json (checked).
2. **Python lookahead linters are already common [reported]:** qtype, backtest-audit, overfit-gauntlet, temporal-leaks, the replaybt auditor, the FLOX detector (also MCP), freqtrade lookahead-analysis. The research found **no SQL lookahead linter**, but an empty search does not prove none exists.
3. **[reported] "Counterpoint: Adversarial Equity Research Desk"** is a June 2026 hackathon project with almost the same dual-engine idea. https://lablab.ai/submissions/wac1h2z74zdr8c0qchamkn4l
4. **None of Gemini's names are free.** Dyad is [checked]; the others are [reported], and Counterpoint Research and Cadence came from memory.
   - Counterpoint: Counterpoint Research, plus the hackathon project above.
   - Tandem: an AI agent startup, a healthcare AI company and a UK bank.
   - Dyad: an open-source AI app builder (github.com/dyad-sh/dyad).
   - Cadence: Cadence Design Systems and Uber's Cadence workflow engine.
5. **[reported] "Verified citations" does not set a product apart.** Hebbia, Brightwave and Rogo all advertise it.
6. **Gemini fact check** (the MCP, Bumblebee and 40% items are [reported]; the 403 item is [checked]):
   - MCP donated to the Linux Foundation's Agentic AI Foundation: true (2025-12-09).
   - Perplexity Bumblebee: true (May 2026).
   - "40% of MCP servers vulnerable": not supported. The nearest source says 41% need no authentication, which is a different claim. Other estimates run from 7% to 67%.
   - "research/ returns 403": false. `/TonyKoo/research/` returns 200.

## 2. Grilling Gemini's own conversation

- **It flips to match the latest prompt.**
  - You asked "why not both?" and it answered "the optimal playbook".
  - You mentioned Pocock and it said "the two-front war kills solo projects".
  - You mentioned your research generator and it brought the ecosystem back.
  - Each answer was confident and agreed with you. Treat none of them as a verdict.
- **It never checked whether the product already existed.** One PyPI search would have found leakguard-mcp.
- **Demand is assumed, not shown.** The 2026 papers (Look-Ahead-Bench, DatedGPT, FinCAD) study *model memory* leaking the future. A SQL linter cannot catch that. The research found no practitioner threads asking for a SQL leakage tool. The closest evidence is one blog post: revised `epsActual` values drove 15% of an LLM backtest's trades. https://dev.to/lizhuojunx86/the-epsactual-that-wasnt-15-of-an-llm-backtests-trades-were-decided-on-data-that-didnt-exist-17k3
- **The pricing tiers are made up.** No buyer was named, interviewed or priced.
- **There is a likely ceiling it never mentioned [reported, read the paper before relying on it].** arXiv 2607.04958 reportedly shows lookahead freedom can be checked statically only for PIT and vintage reads, and is undecidable when availability depends on the data values. A SQL linter can only flag syntactic patterns. It cannot guarantee "zero leakage", and Gemini's pitch promised exactly that.

## 3. Lateral pass: inversion

Assumptions in the current plan, each flipped. Every flip asks the same question: where is the flipped version already true?

| # | Assumption | Flip | Where the flip is true | Verdict |
|---|---|---|---|---|
| 1 | The product is software (CLI, SaaS) | The product is a **published finding** | SemiAnalysis, short-seller reports, Consumer Reports. The writing is what earns, and the tool stays internal. | **Live** |
| 2 | Sell shovels to the miners | Shovels are now commodities. Agents write a linter in a weekend (7+ already exist). | The AI tooling market in 2026: the linter category filled within months. | **Live**: the shovel thesis is weak for code tools |
| 3 | Users run the tool themselves | **You run it for them**: a paid audit | Smart-contract audits (Trail of Bits, Code4rena contests). Same shape: an artifact plus a signed report. | **Live** |
| 4 | Build the tool, then the community | Publish audits first, build the tool later | The academic benchmarks above. Hindenburg-style research leads with the finding. | Live (merges with #1) |
| 5 | Monthly subscription | Pay per audit, or bounty | Code4rena, bug bounties | Live (merges with #3) |
| 6 | Reach users on GitHub and HN | Reach them inside *their* repo (PR comments) | Dependabot, but that is backed by a platform. | Dead for a solo builder |
| 7 | Financial users won't tolerate errors | They tolerate errors | Nowhere that pays | **Dead**: the original belief holds |

**Meta-pattern:** every Gemini option assumed the asset is *code*. In 2026 code is the cheap part. Your scarce assets are judgment, which the portfolio already shows through evidence boundaries and leakage awareness, and a **research generator that already outputs PDF reports**. The flips that survived (1, 3, 4, 5) point to one shape:

> **Publish leakage audits as reports.** Take public AI trading claims, open-source backtests and LLM-finance papers. Run your checker (Python via existing linters, plus your own SQL rules), then publish the findings as a PDF and HTML report. The tool stays a means to that end.

Why this direction ranks first:
- It reuses what you have: Research Compiler (claims, evidence, lineage and PDF are already built), the site's existing `reports/` page format, and the case-study structure.
- It needs no SaaS, billing or community to start.
- Every report is portfolio proof and distribution at the same time.
- It leads naturally to paid audits (#3) if anyone asks.

Weakest point: audits of public repos can annoy their authors. Keep them factual, reproducible and polite, and offer the author a reply.

## 4. UI audit: live site

Method: Hallmark `audit` (linter, before-record, judged from screenshots) plus taste-skill checklist. The render tier did not run because puppeteer is missing, so I took screenshots in the in-app browser instead. **No project files were changed.**

**What the page is for:** recruiters and hiring managers deciding "is Tony credible for quant/AI-data roles?" The one action is to open a case study or make contact.

**What works and should stay:**
- The thesis H1, "Tony Koo builds decision systems.", is strong and unusual.
- Case studies follow problem → build → evidence boundary → limits. This is the site's real differentiator.
- The structured sanitized reports in `reports/`.
- The 375px layout holds: there is no sideways scroll (`scrollWidth` equals the 375px viewport, measured), and the buttons go full width.

**What reads as generated or template.** Most of the 885 linter FAILs are colour literals (gate 48), and many of those come from the vendor Font Awesome file `all.min.css`, so the raw count overstates the problem. The findings below cover your own `index.html` and `css/style.css` only.
- **Eyebrows everywhere.** Tracked-caps labels sit above almost every heading ("AI SYSTEMS / QUANT TOOLING / DATA PRODUCTS", "FEATURED PROJECTS", "TESTIMONIALS", "SELECTED OUTCOMES"). That is 20 eyebrows and 38 tracked-caps labels (gates 54, 67). Delete them; the headings already say it.
- **Too long.** The page is about 14,000px tall at 375px wide, roughly 17 phone screens, across 9 sections (portfolio, proof, about, resume, testimonials, reading, writing, certifications, contact). About 1,000 words are visible (measured in the browser), against Hallmark's target of about 450 visible words; the linter's 3,100 also counts collapsed content. Cut it to hero, projects, evidence, about/CV and contact; move reading and certifications to subpages.
- **Too many ways into the chat.** The nav has CHAT, the hero has "Ask the AI Engineering Lab", a floating "Ask me" bubble sits on top, and the hero has two buttons. The chat competes with the case studies, which are the proof. Keep one entry point.
- **The "Explore the field" scene is a toy.** The pixel-art scene with Work/Ideas/Methods and Summer/Snow toggles costs a whole screen right after the hero and tells a recruiter nothing. Move it below the projects or onto the lab page.
- **The project deck hides the work.** The carousel shows "1 / n" plus a tab strip, so 4 of 5 projects sit behind clicks. Default to the grid view; it already exists.
- **Labels in a mono face.** The line "Quant developer + AI data systems engineer" repeats the eyebrow in a third type voice.
- **Two italic words inside h4s** (`index.html:713`, `index.html:727`, gate 38i).
- **Decorative status dots** (`index.html:343`), and "SKEZI - Data Scientist Intern" uses a hyphen as a separator (gate 63).

**Technical defects:**
- `transition: all` appears 21 times (`css/style.css:331`, `css/style.css:439`, …). List the properties instead.
- The hero uses `min-height: calc(100vh - 70px)` (`css/style.css:4206`). Use `svh`/`dvh`, or mobile browser bars cause jumps.
- `overflow-x: hidden` on `body.command-open` (`css/style.css:5825`) breaks sticky elements. Use `clip`.
- Some content is hidden at rest (`opacity: 0`) until a script reveals it: `.sidebar-nav` (`css/style.css:961`) and `.resumeSubsection` (`css/style.css:1398`). With JavaScript off or broken, that content is invisible (gate 62).
- Image grid tracks use a bare `1fr` (`css/style.css:3252`, `css/style.css:3854`). Use `minmax(0, 1fr)`.
- Two icon libraries (Font Awesome + Feather), and three text faces: Karla, Lato and Inconsolata. Pick one icon set; Lato is used in only 4 rules, so fold it into Karla.
- The `.hero-scroll-hint` animation loops forever with no pause or reduced-motion stop (`css/style.css:822`).
- Dark-mode surfaces don't set their text colour (warning 41, about 18 rules).

**Taste-skill lens:** a portfolio is a *service* page: people get hired. That calls for real proof up front (real screenshots of the agent trace, the IBKR prototype, the reports) and flat grounds, not a starfield and a mood scene. The skill's bar is "says plainly what is sold, shows the real thing on every screen." Your hero says it plainly. The second screen shows a toy, not the work.

**Lightest fix that settles most of it:** a *polish* pass. Keep the layout. Cut the eyebrows, move the scene, make grid the default, keep one chat entry, and fix the six technical defects. Only cutting the page to five sections needs a restructure.

## 5. Open questions (grill round 1)

See the chat reply. The decisions are yours. Nothing above should be built until they are settled.

## Polish result (2026-11-10)

Branch polish/hallmark-audit, commits since 2d77078 (listed newest first in the log, ending with da052dc "fix: css defects from hallmark audit", 73f5fab "feat: open project browser in grid view", cf99291 "fix: use svh for hero min-height", 44cac3c "feat: move field scene below projects").

Sloplint gate counts, before to after: 6a 1 to 0, 10a 21 to 0, 34 3 to 2, 38i 4 to 0, 50 3 to 0, 54 10 to 0, 62 4 to 3, 63 10 to 0. Totals went from 1149 FAIL, 217 REFLEX, 47 WARN to 1080 FAIL, 211 REFLEX, 48 WARN. The two runs list files in a different order and the after run also scans the vendored css/all.min.css, so totals are not a strict like-for-like comparison.

The --kept check reports FAIL for #evidence, #proof, #testimonials and a missing resume pdf link, plus WARN for ids such as commandPalette and backToTop. The before record in .hallmark/before.json came from a stale checkout 48 commits behind. None of these links or ids exist in the true pre-polish page (2d77078), so they are record noise, not regressions. Real kept regressions: none.

Waived on purpose: findAskDialog uses 100vw because it is a full-screen modal. The .sidebar-nav, .motion-reveal and .loading-fact rules are state-driven, so the linter reads their hidden or initial states as defects.

Screenshot verdict (1440x900 and 375x812, before and after): the hero now reads alone on the first screen, with the field scene gone from it, and the featured projects section opens in grid view as the next thing. Nothing overlaps or is cut. Not fixed here: the "Find" nav item has a different font and case from its neighbours, and the right half of the desktop hero is empty.
