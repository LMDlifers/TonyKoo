import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const playwrightPath =
  process.env.PLAYWRIGHT_MODULE ||
  "/Users/kootony/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright";
const { chromium } = require(playwrightPath);

const outDir = path.resolve("videos");
fs.mkdirSync(outDir, { recursive: true });

const demos = [
  {
    file: "healthcare-agent-workflow.webm",
    title: "Agentic Healthcare Analytics",
    subtitle: "Natural-language question to reviewed analytical output",
    accent: "#2f766d",
    steps: [
      "Question intake",
      "Intent routing",
      "Schema grounding",
      "SQL execution",
      "Stats layer",
      "Human review",
      "Audited answer",
    ],
    note:
      "Demo storyboard: how a sensitive analytics request moves through checks before the final response.",
    captions: [
      "Question intake begins with intent, permission, and sensitivity context.",
      "Routing and schema grounding keep the model attached to known data boundaries.",
      "SQL, statistics, and feature steps run through deterministic checks.",
      "Human review and trace logging happen before the analytical answer is shown.",
    ],
  },
  {
    file: "faiss-cache-decision.webm",
    title: "FAISS Cache Decision Loop",
    subtitle: "Semantic reuse with freshness, scope, and fallback gates",
    accent: "#315986",
    steps: [
      "Normalize request",
      "Embed intent",
      "FAISS lookup",
      "Similarity gate",
      "Freshness check",
      "Reuse or refresh",
      "Log savings",
    ],
    note:
      "Demo storyboard: cache speed only counts when mismatch, freshness, and fallback decisions are visible.",
    captions: [
      "The request is normalized before embedding so repeated intent can be compared.",
      "FAISS retrieves similar approved requests from the semantic cache.",
      "Similarity, freshness, scope, and prompt version decide whether reuse is allowed.",
      "Fallbacks and logging keep cost savings tied to quality evidence.",
    ],
  },
  {
    file: "legal-nlp-leakage-audit.webm",
    title: "Legal NLP Leakage Audit",
    subtitle: "Judgment text to evaluation-ready case signals",
    accent: "#3d5a85",
    steps: [
      "Judgment text",
      "IRAC extraction",
      "Temporal filter",
      "Feature rows",
      "Leakage audit",
      "Baseline models",
      "Case metric",
    ],
    note:
      "Demo storyboard: high scores matter only when pre-decision facts are isolated from outcome language.",
    captions: [
      "Judgment text is converted into structured issue, rule, and fact signals.",
      "Temporal filters remove hindsight language before model evaluation.",
      "Baselines and embedding models are compared under leakage-aware splits.",
      "Case-level metrics keep the evaluation tied to realistic legal analytics use.",
    ],
  },
  {
    file: "quant-tooling-walkthrough.webm",
    title: "Yield Curve to Trading Tooling",
    subtitle: "Market data, curve assumptions, risk checks, and execution boundaries",
    accent: "#2f7d32",
    steps: [
      "Market inputs",
      "Curve engine",
      "Scenario shock",
      "Pricing layer",
      "Risk limits",
      "Paper route",
      "Report trace",
    ],
    note:
      "Demo storyboard: the useful signal is the auditable path from assumptions to risk-aware tooling.",
    captions: [
      "Market inputs flow into curve assumptions and reproducible pricing logic.",
      "Scenario shocks expose duration, convexity, and risk-limit behavior.",
      "Paper-trading boundaries separate research tooling from live execution.",
      "Traceable reports keep pricing assumptions reviewable by trading and risk users.",
    ],
  },
  {
    file: "hitl-review-workflow.webm",
    title: "Human-in-the-Loop Review Gate",
    subtitle: "Sensitive requests routed through evidence, risk, and reviewer checkpoints",
    accent: "#1f6f86",
    steps: [
      "Request intake",
      "Sensitivity check",
      "Model draft",
      "Risk gate",
      "Reviewer queue",
      "Decision log",
      "Escalate or ship",
    ],
    note:
      "Demo storyboard: human review is useful only when evidence, authority, and trace logging are part of the workflow.",
    captions: [
      "A sensitive request starts with purpose, permission, and policy context.",
      "The model draft is paired with evidence links and uncertainty signals.",
      "Risk gates decide whether the case can proceed or needs reviewer attention.",
      "Reviewer actions, escalation, and audit logs turn review into measurable system behavior.",
    ],
  },
];

function writeCaptions(demo) {
  const [first, second, third, fourth] = demo.captions;
  const vtt = `WEBVTT

00:00.000 --> 00:03.000
${first}

00:03.000 --> 00:06.000
${second}

00:06.000 --> 00:11.000
${third}

00:11.000 --> 00:16.000
${fourth}
`;

  fs.writeFileSync(path.join(outDir, demo.file.replace(/\.webm$/, ".vtt")), vtt);
}

function pageHtml(demo) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      width: 960px;
      height: 540px;
      background: #f8fbff;
      color: #203044;
      font-family: Arial, sans-serif;
      overflow: hidden;
    }

    .stage {
      box-sizing: border-box;
      width: 960px;
      height: 540px;
      padding: 42px 54px;
      background: linear-gradient(180deg, #ffffff 0%, #eef6f8 100%);
    }

    h1 {
      color: #17283b;
      font-size: 42px;
      line-height: 1;
      margin: 0;
    }

    p {
      color: #51677f;
      font-size: 20px;
      margin: 10px 0 0;
    }

    .rail {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(7, 1fr);
      margin: 70px 0 46px;
      position: relative;
    }

    .rail::before {
      background: #ccdae8;
      border-radius: 999px;
      content: "";
      height: 4px;
      left: 24px;
      position: absolute;
      right: 24px;
      top: 48px;
    }

    .node {
      align-items: center;
      animation: pop 14s ease-in-out infinite;
      animation-delay: calc(var(--i) * 1.05s);
      background: #ffffff;
      border: 2px solid #c4d3e3;
      border-radius: 14px;
      box-shadow: 0 14px 30px rgba(31, 41, 51, 0.08);
      display: flex;
      font-size: 16px;
      font-weight: 700;
      justify-content: center;
      min-height: 96px;
      padding: 12px;
      position: relative;
      text-align: center;
      z-index: 1;
    }

    .node::after {
      animation: ring 14s ease-in-out infinite;
      animation-delay: calc(var(--i) * 1.05s);
      border: 3px solid ${demo.accent};
      border-radius: 18px;
      content: "";
      inset: -6px;
      opacity: 0;
      position: absolute;
    }

    .log {
      align-items: stretch;
      display: grid;
      gap: 18px;
      grid-template-columns: 1.25fr 0.75fr;
    }

    .panel {
      background: #ffffff;
      border: 1px solid #d6e2ee;
      border-radius: 12px;
      box-shadow: 0 12px 28px rgba(31, 41, 51, 0.07);
      padding: 20px 22px;
    }

    .metric {
      border-bottom: 1px solid #e1eaf3;
      display: flex;
      font-size: 17px;
      justify-content: space-between;
      padding: 10px 0;
    }

    .metric:last-child {
      border-bottom: 0;
    }

    .label {
      color: #65788c;
    }

    .value {
      color: ${demo.accent};
      font-weight: 700;
    }

    .note {
      color: #38506a;
      font-size: 18px;
      line-height: 1.45;
    }

    .cursor {
      animation: blink 1s steps(2, end) infinite;
      background: ${demo.accent};
      display: inline-block;
      height: 22px;
      margin-left: 6px;
      vertical-align: -4px;
      width: 10px;
    }

    @keyframes pop {
      0%, 8%, 100% {
        border-color: #c4d3e3;
        transform: translateY(0);
      }

      4% {
        border-color: ${demo.accent};
        transform: translateY(-10px);
      }
    }

    @keyframes ring {
      0%, 9%, 100% {
        opacity: 0;
        transform: scale(0.98);
      }

      4% {
        opacity: 0.55;
        transform: scale(1.03);
      }
    }

    @keyframes blink {
      50% {
        opacity: 0;
      }
    }
  </style>
</head>
<body>
  <main class="stage">
    <h1>${demo.title}</h1>
    <p>${demo.subtitle}<span class="cursor"></span></p>
    <section class="rail">
      ${demo.steps
        .map((step, index) => `<div class="node" style="--i:${index}">${step}</div>`)
        .join("")}
    </section>
    <section class="log">
      <div class="panel">
        ${["Traceability", "Guardrail state", "Reviewer handoff", "Measurement"]
          .map(
            (label, index) =>
              `<div class="metric"><span class="label">${label}</span><span class="value">${
                ["visible", "checked", "ready", "logged"][index]
              }</span></div>`,
          )
          .join("")}
      </div>
      <div class="panel note">${demo.note}</div>
    </section>
  </main>
</body>
</html>`;
}

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const launchOptions = fs.existsSync(chromePath)
  ? { headless: true, executablePath: chromePath }
  : { headless: true };

const browser = await chromium.launch(launchOptions);

for (const demo of demos) {
  const outputPath = path.join(outDir, demo.file);
  fs.rmSync(outputPath, { force: true });
  writeCaptions(demo);

  const context = await browser.newContext({
    viewport: { width: 960, height: 540 },
    recordVideo: {
      dir: outDir,
      size: { width: 960, height: 540 },
    },
  });
  const page = await context.newPage();
  await page.goto(`data:text/html;charset=utf-8,${encodeURIComponent(pageHtml(demo))}`);
  const video = page.video();

  await page.waitForTimeout(16000);
  await context.close();

  const recordedPath = await video.path();
  fs.renameSync(recordedPath, outputPath);
  console.log(outputPath);
}

await browser.close();
