# Leakage Audit #001 (IBKR Mean-Reversion) Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. This is mostly a research workflow, not new code. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Publish "Tony Koo · Leakage Audits #001": a reproducible lookahead and leakage audit of the IBKR mean-reversion prototype. It ships as a Research Compiler PDF plus a `reports/` HTML page, and it doubles as the end-to-end test of Research Compiler.

**Architecture:** Run the existing linters on the prototype code. Do a manual point-in-time review against a fixed checklist. Write the findings to one JSON file. Feed sources and findings to Research Compiler (`rc`) to produce an evidence-backed PDF. Hand-port the summary into the portfolio's `reports/` HTML format and link it from one Audits card.

**Tech Stack:** Python 3.11+, `leakguard-mcp` (PyPI 0.1.1), qtype from **git** (`github.com/VernonOY/qtype`), Research Compiler (`~/Documents/Github/Report-Generator`, CLI `rc`), the portfolio `reports/*.html` template.

**Spec:** `_audit/2026-11-09-strategy-and-ui-research.md` §3, plus grill decisions Q5 to Q10 (own-name branding; audit yourself first; reuse existing linters and credit them; publish in `reports/` with one Audits card; no paid offer until 3 audits are published and someone asks).

## Global Constraints

- Series name: **Tony Koo · Leakage Audits**. Audit id `LA-001`.
- Target: `https://github.com/df-Nic/Trading-Algo`. This is a team repo: **get your teammates' OK before publishing**, and pin the audited commit SHA in the report.
- Credit the linters by name and version in the report. Never claim "zero leakage"; findings are "found / not found by these checks".
- Every finding cites `file:line` at the pinned SHA, plus a reproduction command.
- Work in a scratch clone under `~/Documents/Github/audits/LA-001/`, never inside the portfolio repo. Only the published HTML and PDF enter the portfolio.

## Review Focus

1. **The linters find nothing:** that is still a publishable result. The report then states coverage (rules run, files scanned) and the manual-checklist outcomes.
2. **The repo needs IBKR credentials or live data:** audit statically only. Never run live trading code, and never enter credentials.
3. **Team objection:** if any teammate declines, switch the target to an open-source backtest (Q6 option a) and keep this plan's steps.
4. **Research Compiler fails mid-pipeline:** record the failure as a Research Compiler issue in that repo; that is the point of this test. Ship the HTML page by hand and add the PDF later.
5. **Findings name a teammate's code:** phrase them as code facts, and offer a right of reply in the report.

---

### Task 1: Prep and consent

- [ ] **Step 1:** Message the Trading-Algo teammates asking for their OK to publish a self-audit. Wait for replies. Continue only once they agree.
- [ ] **Step 2:** `git clone https://github.com/df-Nic/Trading-Algo ~/Documents/Github/audits/LA-001/src && git -C ~/Documents/Github/audits/LA-001/src rev-parse HEAD`. Record the SHA in `LA-001/README.md`.
- [ ] **Step 3:** In a venv in `LA-001/`, run `pip install leakguard-mcp==0.1.1 "git+https://github.com/VernonOY/qtype@<pinned-sha>"`. **Never `pip install qtype`:** the PyPI name `qtype` belongs to an unrelated bazaarvoice project (checked). Read each tool's source before running it, then record the versions with `pip freeze > LA-001/tools.txt`.

### Task 2: Automated scan

- [ ] **Step 1:** Run each linter's CLI on `src/`, writing JSON to `LA-001/scan/leakguard.json` and `LA-001/scan/qtype.json`. Check `--help` first for the exact flags.
- [ ] **Step 2:** Merge the hits into `LA-001/findings.json`. Each entry is `{id, tool, rule, file, line, sha, snippet, verdict: "confirmed"|"false-positive"|"needs-review", note}`. Every hit starts as `needs-review`.

### Task 3: Manual point-in-time review

The checklist that the linters don't cover. Each item gets one entry in `findings.json` with `tool: "manual"`:

- [ ] Signal at bar *t* uses only data ≤ *t*: check `shift`, `rolling`, `resample` and z-score windows.
- [ ] Mean and standard deviation for the z-score are fitted on train only, with no full-sample normalisation.
- [ ] Order fill price is not the same bar's close the signal was computed on.
- [ ] IBKR historical bars: adjusted vs unadjusted prices; were split and dividend adjustments made after the fact?
- [ ] Train/test split is chronological, and parameters weren't tuned on the test period.
- [ ] Survivorship: SPY only, so state the scope rather than claiming a pass.
- [ ] Resolve every `needs-review` to `confirmed` or `false-positive`, each with a one-line reason.

### Task 4: Compile with Research Compiler

**Cost note:** `rc research` in `production_research` mode calls an LLM provider. `rc doctor` checks for an NVIDIA Model API key, and live calls may cost money. `--no-discovery` plus `--mode strict_corpus` keeps it to your own files: no web or academic API discovery.

- [ ] **Step 1:** `cd ~/Documents/Github/Report-Generator && pip install -e . && rc doctor`. Expected: typst, pandoc and the API key all OK.
- [ ] **Step 2:** `rc init ~/Documents/Github/audits/LA-001/rc && cd ~/Documents/Github/audits/LA-001/rc`
- [ ] **Step 3:** Acquire each source as a local file:
  - `rc acquire ../findings.json --title "LA-001 findings"`
  - `rc acquire ../scan/leakguard.json --title "leakguard-mcp 0.1.1 output"`
  - `rc acquire ../scan/qtype.json --title "qtype output"`
  - `rc acquire ../README.md --title "Audit scope and pinned SHA"`

  Then run `rc sources -v`. Expected: 4 sources.
- [ ] **Step 4:** Run:
  ```bash
  rc research "Lookahead and leakage audit of IBKR mean-reversion prototype" \
    --description "Assess each finding in findings.json at the pinned SHA; state coverage and limits" \
    --profile technical_report --no-discovery --mode strict_corpus --max-rounds 2
  ```
  Then `rc review`. Resolve each claim with `rc review --claim <id> --approve` or `--reject`.
- [ ] **Step 5:** `rc compile --profile technical_report --output ../out`, then `rc status`, to get the BuildFingerprint id. Then `rc reproduce <build_id>`. Expected: a reproducible verdict. Never use `--allow-unverified`.
- [ ] **Step 6:** File each Research Compiler defect you hit as an issue or note in `Report-Generator`. Don't fix them in this plan.

### Task 5: Publish on the portfolio

**Files:**
- Create: `reports/leakage-audit-001-ibkr-mean-reversion.html` (copy `reports/yield-curve-quant-engineering-notes.html` as the template)
- Create: `files/LA-001.pdf`
- Modify: `index.html` (one Audits card in the `#portfolio` grid, linking the HTML report)
- Modify: `scripts/smoke-responsive.mjs` (add the new report to `pages`)

- [ ] **Step 1:** Add `"/reports/leakage-audit-001-ibkr-mean-reversion.html"` to `pages` in `smoke-responsive.mjs`. Run it. Expected: FAIL, missing page.
- [ ] **Step 2:** Write the page with these sections, in order:
  - Scope, with the SHA, tools and versions
  - Method
  - Findings table (`id`, `file:line`, verdict, fix)
  - What these checks cannot catch (model-memory leakage, value-dependent availability)
  - Reproduce
  - Right of reply
  - PDF download
- [ ] **Step 3:** Add the card with the title "Leakage Audit #001: IBKR mean-reversion".
- [ ] **Step 4:** Run `smoke-responsive.mjs`, `check-launch-readiness.mjs` and `check-polish.mjs`. Expected: all PASS.
- [ ] **Step 5:** Commit: `content: publish leakage audit 001`.

**Next:** LA-002 targets an open-source repo (e.g. `virattt/ai-hedge-fund`). Write your own SQL or point-in-time rules only for gaps that LA-001 and LA-002 expose. Make no paid offer until LA-003 is published and someone asks.
