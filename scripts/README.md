# Curriculum pages

Lesson metadata lives in `main/data/curriculums.json`. Rebuild the library and individual lesson pages after editing metadata or the shared HTML shell:

```sh
python3 scripts/build_curriculums.py
```

The shell is `scripts/templates/curriculum-shell.html`; layout and filtering live in `main/css/curriculums.css` and `main/js/curriculums.js`.

PDFs live under `main/pdfs/curriculums`, named by lesson slug. The five newly added PDFs were renamed without changing their contents; `curriculum-pdf-renames.json` records the original names, new names, and checksums. Original lesson introductions and source links came from `iris-chat/output/canva-curriculum/lessons/*/source.json`; new lesson summaries and citations were drawn from their PDFs.

Card artwork lives in `main/img/curriculum-graphics`. Eight cards use non-human illustrations; generated people have been replaced with real stock photography. They share one generated 4×4 atlas, `generated-curriculum-atlas.png`; the zero-based `imageTile` field selects a distinct illustration using CSS background positioning. Other cards use the image at their `image` path. Stock photographs are saved in `main/img/curriculum-stock`, with photographer, source, and license records in `credits.json`. Lesson pages also show the photo credit. Use licensed stock photography for people, including hands and groups; generated artwork must be limited to non-human subjects. Do not re-enable atlas tiles 0, 3, 4, 6, 8, 9, 10, or 11. No image editing is needed to render the atlas. The earlier facts-infographic assets are retained but no longer used on cards.

Grade bands are `3-5`, `6-8`, and `9-12`. Each record has `grades`, `gradeBasis`, and `gradeNote`. Suggested bands reflect reading complexity, scientific concepts, and activities; they are explicitly labeled as suggestions. The plastics PDF explicitly identifies its audience as high school. Review these recommendations when adapting lessons or adding new records.

The build uses a seeded shuffle for a varied default order that remains stable across reloads and pagination. The library displays 12 lessons per page, with options for 24 or all lessons. Topic, grade, search, sort, page size, and current page are reflected in the URL. PowerPoints remain excluded from the website; their originals are in iris-chat.

Preview from the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory main
```

Open http://127.0.0.1:8000/curriculums.html.
