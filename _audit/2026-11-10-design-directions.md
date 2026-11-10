# Design directions: making the portfolio memorable without slop

Date: 2026-11-10. Method: web research (every URL below was fetched on 2026-11-10 unless marked otherwise), then a lateral-thinking pass using the analogy technique. The post skill's baseline test was adapted from social posts to this page.

## Baseline: the portfolio everyone builds

A dark page with a centred hero, a name and a tagline, and two buttons. Below that sit a row of filter chips, a grid of identical project cards, a section of testimonials and a contact band. Every direction below is tested against this baseline, and any that this page could already be is dead.

The site as it stands after the polish is this baseline. That is why it reads as boring.

## What the research found

- The sites people remember make **the site itself the work**: Ciechanowski, https://ciechanow.ski/ and Nicky Case, https://ncase.me/.
- Many also keep **a dated work log**: Simon Willison, https://simonwillison.net/ and https://til.simonwillison.net/.
- Some **show how sure the author is**:
  - Gwern tags each page with its confidence and status: https://gwern.net/
  - Jepsen dates every analysis and pins the version tested: https://jepsen.io/analyses
- Some **version the site itself** and keep the old versions: Lynn Fisher, https://lynnandtonic.com/archive/
- Some **show notes by how finished they are**: Maggie Appleton's garden marks notes as seedlings, budding or evergreen: https://maggieappleton.com/garden
- **Quant and finance people who turn their domain into the interface are rare.** Searches turned up mostly templates and AI demos. That gap is the opening.
- **2025–2026 commentary on AI slop names these tells:**
  - purple or indigo accents
  - a centred hero with one call to action
  - three icon boxes in a row
  - a large radius on everything
  - small labels above headings in tracked capitals
  - fake "Live" pills
  - uniform sizing everywhere
  - everything visible at once

  Sources: https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website, https://noqta.tn/en/blog/ai-design-slop-overused-ui-patterns-fix-2026, https://world.hey.com/kostac/spot-the-slop-a-ui-designer-s-guide-to-fixing-ai-defaults-4c448c9c
- **Pixel or isometric art earns its place when data drives it.** Jason Long's isometric contribution graph draws real activity as block height: https://github.com/jasonlong/isometric-contributions

## Lateral pass (analogy)

The problem's structure in one sentence: a visitor with little time has to judge whether one person's claims can be trusted, when the proof is mostly private and the first screen is all the attention they give.

| Domain | Mechanism it uses on that problem | What it becomes on the site |
|---|---|---|
| Clinical-trial registry (operational) | A claim is registered with a date before the results come in, and every amendment stays visible | Each case study gets a registered date and a changelog, and the site gets a dated lab log in the style of Jepsen |
| Nutrition label (regulatory, social) | One fixed format lets you compare items in seconds | Every project gets the same **evidence label**: data used, how it was evaluated, what it does not claim, status and date. This replaces the near-identical diagram cards |
| Honest signalling in birds (biological) | A signal that costs a lot to produce is trusted because it is hard to fake | Show proof that is hard to fake: a Research Compiler PDF with its BuildFingerprint, a reproduce command, a real failing check |
| Museum diorama (cultural) | Visitors walk up to an exhibit and read its placard | The field characters become exhibits, and clicking one opens that project's evidence label |
| Airport departures board (operational) | One board shows the real state of every flight | The hero shows the systems you have built, each with its real state (running, in progress, archived) and the date it last changed |

**Dead flips:** none died outright. The departures board is the weakest: unless every state and date is real, it turns into the fake "Live" pill tell. Build it only from dated facts.

**Meta-pattern:** every transplant that worked makes trust **cheap to check**, through a fixed format, a date or proof that is hard to fake. The current page asserts things instead of letting visitors check them. The field scene was memorable but decorative, and it gets its value back when it is tied to real evidence.

## Shortlist to build, ranked

1. **Put the field back in the hero, driven by real status.** Each character stands for a real system, shows its real state and date, and opens that project's evidence label when clicked. This fixes the boring first screen and turns the toy into proof.
2. **An evidence label per project.** One fixed panel per project, replacing the near-identical diagram cards. The case studies already hold the content; this changes only its form.
3. **A dated lab log.** A short stream of dated entries: Leakage Audit #001, Research Compiler releases and shipped reports. It feeds on the audit series and needs no new kind of content.
4. **The receipts.** Link each report's PDF with its BuildFingerprint and a reproduce command. Proof that costs effort to produce is what makes visitors trust it.
5. **A colophon.** A one-page note on how the site is built and checked, including `check-polish`, the Hallmark gates and the field art pipeline. Cheap to make, and rare on portfolios.

**Remaining slop tells to remove while doing this:**
- Tracked capitals in the nav, in the "FEATURED PROJECTS" section title and in the filter chips
- The centred section titles with a bar underneath
- The empty "My Projects" header box
- Pill shapes on everything

**Never add:** fake metrics, a "Live" pill without a real date behind it, gradient glows, or a terminal or Bloomberg look used as decoration.
