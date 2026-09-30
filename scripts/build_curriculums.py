"""Build the static curriculum library and lesson pages from main/data/curriculums.json."""
import json
import random
from html import escape
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'main'
SHELL = (ROOT / 'scripts/templates/curriculum-shell.html').read_text()
ITEMS = json.loads((SITE / 'data/curriculums.json').read_text())
# A stable shuffle keeps pagination and shared links consistent across visits.
random.Random('iristem-library-2026-09').shuffle(ITEMS)
TOPICS = sorted({topic for item in ITEMS for topic in item['topics']})
GRADES = {'3-5': 'Grades 3–5', '6-8': 'Grades 6–8', '9-12': 'Grades 9–12'}

def render(title, description, content):
    return SHELL.replace('{{TITLE}}', escape(title)).replace('{{DESCRIPTION}}', escape(description, quote=True)).replace('{{CONTENT}}', content)

def size(n):
    return f'{n / 1024 / 1024:.1f} MB'

def tags(item):
    return ''.join(f'<span class="curriculum-tag">{escape(t)}</span>' for t in item['topics'])

def grade_label(item):
    return ' · '.join(GRADES[g] for g in item['grades'])

def artwork(item):
    if 'imageTile' in item:
        tile = item['imageTile']
        if tile not in {1, 2, 5, 7, 12, 13, 14, 15}:
            raise ValueError('Use licensed stock photography for people; this atlas tile is retired.')
        return f'<span class="curriculum-generated-art" style="--art-x: {(tile % 4) * 100 / 3:.6f}%; --art-y: {(tile // 4) * 100 / 3:.6f}%"></span>'
    return f'<img src="{escape(item["image"], quote=True)}" alt="" width="800" height="450" loading="lazy" decoding="async">'

cards = []
for item in ITEMS:
    slug = item['slug']
    title = escape(item['title'])
    summary = escape(item['summary'])
    page = f'curriculum-{slug}.html'
    pdf = f'pdfs/curriculums/{slug}.pdf'
    source = escape(item.get('sourceUrl', ''), quote=True)
    host = escape(urlparse(item.get('sourceUrl', '')).netloc.removeprefix('www.'))
    citation = escape(item.get('sourceCitation', '')) or f'This curriculum draws on material from {host}.'
    source_link = f'<a href="{source}" target="_blank" rel="noopener">Read the original source <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>' if source else ''
    grade_heading = 'Grade level' if item.get('gradeBasis') == 'explicit' else 'Suggested grade level'
    credit = item.get('photoCredit')
    photo_credit = f'<p class="curriculum-photo-credit">Card photo: <a href="{escape(credit["sourceUrl"], quote=True)}" target="_blank" rel="noopener">{escape(credit["photographer"])} / Unsplash</a> · <a href="{escape(credit["licenseUrl"], quote=True)}" target="_blank" rel="noopener">{escape(credit["license"])}</a></p>' if credit else ''
    cards.append(f'''<article class="curriculum-card" data-topics="{escape('|'.join(item['topics']), quote=True)}" data-grades="{'|'.join(item['grades'])}" data-title="{escape(item['title'], quote=True)}">
      <a class="curriculum-cover" href="{page}" tabindex="-1" aria-hidden="true">{artwork(item)}</a>
      <div class="curriculum-card-body">
        <div class="curriculum-tags">{tags(item)}</div>
        <h2><a href="{page}">{title}</a></h2>
        <p class="curriculum-card-summary">{summary}</p>
        <p class="curriculum-grade-label">{grade_heading}: {grade_label(item)}</p>
        <p class="curriculum-meta">{item['pages']} pages · PDF curriculum</p>
        <a class="curriculum-card-link" href="{page}" aria-label="Explore lesson: {title}">Explore lesson <span aria-hidden="true">→</span></a>
      </div>
    </article>''')
    content = f'''<main class="curriculum-detail">
      <header class="page-header editorial-page-header">
        <div class="container">
          <a class="curriculum-back" href="curriculums.html">← All curriculums</a>
          <div class="curriculum-tags">{tags(item)}</div>
          <h1>{title}</h1>
          <div class="editorial-page-rule"></div>
          <p>Research-based curriculum · PDF lesson</p>
        </div>
      </header>
      <div class="container curriculum-detail-grid">
        <article class="curriculum-overview">
          <p class="curriculum-eyebrow">About this lesson</p>
          <h2>A closer look</h2>
          <p>{summary}</p>
          <div class="curriculum-grade-info"><h3>{grade_heading}</h3><p>{grade_label(item)}</p><p class="curriculum-grade-note">{escape(item['gradeNote'])}</p></div>
          <div class="curriculum-source"><h3>Source material</h3><p>{citation}</p>{source_link}</div>{photo_credit}
        </article>
        <aside class="curriculum-resource-panel" aria-labelledby="resources-title">
          <p class="curriculum-eyebrow">Ready for your classroom</p>
          <h2 id="resources-title">Lesson resources</h2>
          <div class="curriculum-resource"><h3>Curriculum PDF</h3><p>{item['pages']} pages · {size(item['pdfBytes'])}</p><a class="curriculum-open" href="{pdf}" download>Download PDF <span aria-hidden="true">↓</span></a></div>
        </aside>
        <section class="curriculum-preview" aria-labelledby="preview-title">
          <div class="curriculum-preview-heading"><h2 id="preview-title">Read the curriculum</h2><a href="{pdf}" target="_blank" rel="noopener">Open PDF in a new tab ↗</a></div>
          <p class="curriculum-preview-note">Preview not available on your device? Open the PDF above or download a copy.</p>
          <iframe src="{pdf}#view=FitH" title="PDF curriculum: {title}" loading="lazy"></iframe>
        </section>
      </div>
    </main>'''
    (SITE / page).write_text(render(item['title'], item['summary'], content))

options = ''.join(f'<option value="{escape(t, quote=True)}">{escape(t)}</option>' for t in TOPICS)
grade_options = ''.join(f'<option value="{key}">{label}</option>' for key, label in GRADES.items())
content = f'''<main>
  <header class="page-header editorial-page-header"><div class="container">
    <p class="curriculum-eyebrow">Explore · Learn · Teach</p><h1>Curriculums</h1><div class="editorial-page-rule"></div>
    <p>Bring climate research into the classroom. Explore {len(ITEMS)} lessons on our planet, our health, and the communities we call home—with a downloadable PDF for every lesson.</p>
    <a class="curriculum-browse-link" href="#curriculum-library">Find your next lesson ↓</a>
  </div></header>
  <section class="curriculum-library container" id="curriculum-library" aria-label="Curriculum library">
    <form class="curriculum-toolbar" role="search" onsubmit="return false">
      <div class="curriculum-search"><label for="curriculum-search">Find a lesson</label><input id="curriculum-search" type="search" placeholder="Search topics, titles, or keywords" aria-controls="curriculum-grid"></div>
      <div class="curriculum-filter"><label for="curriculum-topic">Topic</label><select id="curriculum-topic" aria-controls="curriculum-grid"><option value="">All topics</option>{options}</select></div>
      <div class="curriculum-filter"><label for="curriculum-grade">Grade level</label><select id="curriculum-grade" aria-controls="curriculum-grid" aria-describedby="curriculum-grade-help"><option value="">All grades</option>{grade_options}</select></div>
      <div class="curriculum-filter"><label for="curriculum-sort">Sort by</label><select id="curriculum-sort" aria-controls="curriculum-grid"><option value="original">Mixed order</option><option value="az">Title: A–Z</option><option value="za">Title: Z–A</option></select></div>
      <button type="button" class="curriculum-reset" id="curriculum-reset">Reset filters</button>
    </form>
    <p class="curriculum-grade-help" id="curriculum-grade-help">Grade ranges are suggested unless specified in the PDF. Choose what fits your students and adapt as needed.</p>
    <div class="curriculum-results"><p id="curriculum-count" role="status" aria-live="polite">{len(ITEMS)} lessons</p><div class="curriculum-page-size"><label for="curriculum-page-size">Lessons per page</label><select id="curriculum-page-size" aria-controls="curriculum-grid"><option value="12">12</option><option value="24">24</option><option value="all">All {len(ITEMS)}</option></select></div></div>
    <noscript><p>All lessons are shown below. Enable JavaScript to search and filter.</p></noscript>
    <div class="curriculum-grid" id="curriculum-grid" tabindex="-1">{''.join(cards)}</div>
    <div class="curriculum-empty" id="curriculum-empty" hidden><h2>No lessons found</h2><p>Try a broader keyword or choose another topic.</p><button type="button" class="curriculum-reset" id="curriculum-empty-reset">Show all lessons</button></div>
    <nav id="curriculum-pagination" class="curriculum-pagination" aria-label="Curriculum pages" hidden></nav>
  </section>
</main>'''
(SITE / 'curriculums.html').write_text(render('Curriculums', f'Explore {len(ITEMS)} climate, health, energy, and community resilience lessons with downloadable PDF curriculums.', content))
print(f'Built curriculum library and {len(ITEMS)} lesson pages.')
