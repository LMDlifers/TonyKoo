# AI Engineering Lab user study

Use the same prompts against the pre-redesign baseline (commit e2317d5) and the published redesign. The automated retrieval check confirms relevant source candidates for supported tasks; it does not establish answer quality or user usefulness. The public endpoint may reject scripted requests, so run answer comparisons in an approved browser session. The owner authorised publication before the moderated pilot; treat the pilot as the remaining answer-quality assessment.

## Script for 3–5 engineers

Ask each participant to choose three realistic prompts from their role, with at least one design brief and one follow-up. Ask them to describe what decision they would make after each answer, whether the visual helped, and where evidence or assumptions were missing. Observe time to a usable answer. Do not collect private repositories, credentials, or confidential architecture. The site owner invites participants; this document is not an outreach request.

Score each answer on 0–2 for source relevance, factual support, task usefulness, visual usefulness, and clarity of assumptions; record seconds to a usable answer. Mark any fabricated figure, numeric series, or unsupported claim as a release blocker. A visual counts only when it improves the decision and has a publisher source or an Illustrative design label. Compare baseline and revised scores per task, not just an overall average.

| Task | Persona | Prompt | Expected source or outcome | Baseline score/time | Prototype score/time | Notes |
|---|---|---|---|---|---|---|
| 1 | AI engineer | When should I use RAG instead of a semantic cache for a changing policy manual? | reports-faiss-caching-llm-cost-latency |  |  |  |
| 2 | AI engineer | Design an agent evaluation that compares a simple baseline and validated success. | research-how-to-prove-an-agent-works |  |  |  |
| 3 | AI engineer | A retrieved page tells my agent to reveal its system prompt. What boundary should stop it? | primary-owasp-prompt-injection |  |  |  |
| 4 | AI engineer | What is the difference between model attention and tree search during inference? | research-when-agents-need-search |  |  |  |
| 5 | AI engineer | Our coding agent keeps losing context. How should a harness manage state? | research-how-coding-agents-find-and-change-code |  |  |  |
| 6 | AI engineer | Compare routing, parallelization, and orchestrator-worker patterns for independent tasks. | primary-anthropic-effective-agents |  |  |  |
| 7 | AI engineer | Which page explains agent evaluation and failure injection? | research-how-to-prove-an-agent-works |  |  |  |
| 8 | AI engineer | The model cites a 90% improvement that is absent from the evidence. Can we publish it? | Unknown or qualified; no invented claim |  |  |  |
| 9 | AI engineer | What changed in the newest model benchmark today? | Current source needed; offer opt-in search |  |  |  |
| 10 | AI engineer | We have only 20 held-out tasks. What limits should accompany an agent evaluation result? | primary-anthropic-agent-evals |  |  |  |
| 11 | Senior software engineer | Compare a transactional outbox with a database commit followed by a direct broker call. | primary-aws-outbox |  |  |  |
| 12 | Senior software engineer | Design idempotent retries when an API response times out after a successful write. | primary-aws-idempotent-apis |  |  |  |
| 13 | Senior software engineer | An outbox publisher crashes after sending a message. What should the consumer do? | primary-aws-outbox |  |  |  |
| 14 | Senior software engineer | Review a coding-agent harness for sandbox, durable state, and verification. | research-how-coding-agents-find-and-change-code |  |  |  |
| 15 | Senior software engineer | A design brief skips the data ownership boundary. How should we choose service boundaries? | research-how-to-choose-a-system-boundary |  |  |  |
| 16 | Senior software engineer | What should a verified release workflow check before deployment? | research-from-specification-to-verified-release |  |  |  |
| 17 | Senior software engineer | How should I test a tool-using agent after a partial external failure? | research-how-to-prove-an-agent-works |  |  |  |
| 18 | Senior software engineer | Can you confirm my private repository has no SQL injection vulnerabilities? | Unknown or qualified; no invented claim |  |  |  |
| 19 | Senior software engineer | Which library version released this morning fixes all retry bugs? | Current source needed; offer opt-in search |  |  |  |
| 20 | Senior software engineer | A prior answer said outbox delivery is exactly once. Is that guarantee justified? | primary-aws-outbox |  |  |  |
| 21 | Cloud architect | Set RTO and RPO for a multi-region disaster recovery design with a warm standby. | primary-aws-disaster-recovery |  |  |  |
| 22 | Cloud architect | Compare backup and restore, pilot light, warm standby, and active-active disaster recovery. | primary-aws-disaster-recovery |  |  |  |
| 23 | Cloud architect | Explain the shared responsibility split for an application deployed on a managed cloud service. | research-what-the-cloud-should-own |  |  |  |
| 24 | Cloud architect | Where should authorization checks live when an agent calls cloud tools? | research-where-autonomy-stops |  |  |  |
| 25 | Cloud architect | Choose a serverless database for a small Worker-backed feedback service. | primary-cloudflare-d1 |  |  |  |
| 26 | Cloud architect | A cloud architecture spans regions. What should happen after an uncertain write outcome? | primary-aws-idempotent-apis |  |  |  |
| 27 | Cloud architect | How would you test failover and recovery against an agreed RTO? | primary-aws-disaster-recovery |  |  |  |
| 28 | Cloud architect | Guarantee that my current cloud design has zero downtime and zero data loss. | Unknown or qualified; no invented claim |  |  |  |
| 29 | Cloud architect | What are the latest AWS prices for an active-active deployment today? | Current source needed; offer opt-in search |  |  |  |
| 30 | Cloud architect | We have no traffic or data-size numbers. Which deployment comparison can still be made? | research-what-the-cloud-should-own |  |  |  |

## Answer-quality follow-up

Review the 30 task results, every visual and source, and the 3–5 moderated sessions. Compare task completion and usefulness against the baseline. Review any fabricated figure, numerical series, unsupported claim, inaccessible visual, or mobile/desktop regression as a defect to fix promptly. Exa remains optional; no payment method or paid quota should be enabled for this pilot.
