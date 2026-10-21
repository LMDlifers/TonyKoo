from html.parser import HTMLParser
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
PAGES = sorted((ROOT / 'research').glob('*.html')) + sorted((ROOT / 'reports').glob('*.html'))
KEYWORDS = {
    'research/how-to-prove-an-agent-works.html': 'agent evaluation evals metrics testing validated success baselines',
    'research/when-agents-need-search.html': 'agent search reasoning tree of thoughts MCTS when to use deliberate search',
    'research/when-an-ml-model-is-ready.html': 'research model evaluation validation baseline leakage deployment readiness',
    'reports/faiss-caching-llm-cost-latency.html': 'FAISS semantic cache freshness fallback gate similarity confidence',
    'reports/agentic-healthcare-analytics.html': 'healthcare agent workflow human review SQL statistical steps clinical deployment not claimed',
    'reports/judicial-analytics-legal-nlp.html': 'legal NLP IRAC target leakage hindsight bias',
}


FACTS = {
    'reports/faiss-caching-llm-cost-latency.html': 'The proposed cache reuses an answer only if similarity, data scope, acceptable age, and prompt version checks pass. Otherwise it calls the model and logs the fallback reason and approval state.',
    'reports/agentic-healthcare-analytics.html': 'The workflow allows a human reviewer to inspect, rerun, or correct generated SQL and statistical steps before a final answer. The public case study does not claim clinical deployment.',
    'research/how-to-prove-an-agent-works.html': 'This essay recommends comparing agents with a strong simple baseline on held-out tasks, measuring independently validated success, cost, human effort, tool traces, and failures. It is published guidance, not a claim that every measure was run on a deployed agent.',
}


class PublicPage(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ''
        self.description = ''
        self.parts = []
        self.main_depth = 0
        self.skip_depth = 0
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'title':
            self.in_title = True
        elif tag == 'meta' and attrs.get('name') == 'description':
            self.description = attrs.get('content', '')
        elif tag == 'main':
            self.main_depth += 1
        elif self.main_depth and tag in ('nav', 'aside', 'footer', 'script', 'style'):
            self.skip_depth += 1

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False
        elif tag == 'main':
            self.main_depth = max(0, self.main_depth - 1)
        elif self.skip_depth and tag in ('nav', 'aside', 'footer', 'script', 'style'):
            self.skip_depth -= 1

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self.main_depth and not self.skip_depth:
            self.parts.append(data)


def compact(value):
    return re.sub(r'\s+', ' ', value).strip()


sources = []
for path in PAGES:
    page = PublicPage()
    page.feed(path.read_text(encoding='utf-8'))
    relative = path.relative_to(ROOT).as_posix()
    title = compact(page.title).split(' | ')[0]
    sources.append({
        'id': relative.replace('/', '-').removesuffix('.html'),
        'title': title,
        'url': f'https://lmdlifers.github.io/TonyKoo/{relative}',
        'path': relative,
        'kind': 'article' if path.parent.name == 'research' else 'project note',
        'summary': compact(page.description),
        'keywords': KEYWORDS.get(relative, ''),
        'facts': FACTS.get(relative, ''),
        'text': compact(' '.join(page.parts))[:10000],
    })

# Curated facts below are already stated on the public homepage.
sources.append({
    'id': 'portfolio-overview',
    'title': 'About Tony Koo — Projects, experience and contact',
    'url': 'https://lmdlifers.github.io/TonyKoo/',
    'path': 'index.html',
    'kind': 'portfolio',
    'summary': 'Tony Koo builds AI, data, and quantitative decision systems. The portfolio lists his work, experience, résumé, and contact details.',
    'keywords': 'Tony built builds projects contact email background experience role Tradition Energy SKEZI resume résumé trading contribution team',
    'text': 'Tony Koo is a data scientist and quantitative systems builder focused on agentic analytics, privacy-safe workflows, and financial engineering. The public portfolio features agentic healthcare analytics, legal NLP, FAISS caching, and quant analytics projects. It lists Data Scientist Intern work at SKEZI and Quantitative Developer Intern work at Tradition Energy. Visitors can use the portfolio contact section to reach Tony, and the résumé link gives his full public background. The public portfolio describes Tony’s contribution to the team IBKR mean-reversion prototype as Ornstein–Uhlenbeck strategy work, mean-reversion speed and signal calculations, equity adaptation, historical-data flow, and documentation; it does not substantiate live profitability.',
})

# The guide's fallback is visible and testable on the published homepage.
sources.append({
    'id': 'site-guide',
    'title': 'How the portfolio guide works',
    'url': 'https://lmdlifers.github.io/TonyKoo/',
    'path': 'index.html',
    'kind': 'site feature',
    'summary': 'The guide searches public portfolio pages even when AI answers are unavailable.',
    'keywords': 'guide assistant search AI service unavailable fallback public pages links',
    'text': 'The on-page portfolio guide always searches its approved public-page index locally. Its optional AI answer service is separate. If the AI service fails or times out, the guide still shows the closest published pages as links. This behavior is visible in the guide on the public homepage.',
})

# Only repositories already linked and described on the public portfolio are indexed.
sources.extend([
    {
        'id': 'github-profile', 'title': 'Tony Koo on GitHub',
        'url': 'https://github.com/LMDlifers', 'kind': 'public repository index',
        'summary': 'Tony’s public GitHub profile and repositories.', 'searchOnly': True,
        'text': 'Browse Tony Koo’s public GitHub profile for repositories and code samples.',
    },
    {
        'id': 'trading-algo-team-repo', 'title': 'IBKR Mean-Reversion Trading Prototype team repository',
        'url': 'https://github.com/df-Nic/Trading-Algo', 'kind': 'team repository',
        'summary': 'Public team repository linked from the portfolio project.', 'searchOnly': True,
        'text': 'Tony’s public commits cover Ornstein–Uhlenbeck strategy work, mean-reversion speed and signal calculations, equity adaptation, and project documentation. This is a team project.',
    },
])

target = ROOT / 'data' / 'guide-sources.mjs'
target.parent.mkdir(exist_ok=True)
target.write_text('export default ' + json.dumps(sources, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
print(f'Indexed {len(sources)} public pages in {target.relative_to(ROOT)}')
