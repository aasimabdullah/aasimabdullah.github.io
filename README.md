# BioTutor

A small, static biology study app. It runs in a browser and can be hosted on any static web host. It has no build step, account, backend, external font, or API key.

## Run it

Open `index.html` in a modern browser, or serve the `outputs` folder with any local static file server. Keep `index.html` and `app.js` together.

## Host it

Upload the contents of this folder (`index.html`, `app.js`, and this README) to a static host such as GitHub Pages, Cloudflare Pages, or Netlify. For a simple upload-style deployment, use Netlify Drop or Cloudflare Pages direct upload. For GitHub Pages, put these files in the repository's published root (or set the Pages folder to `/outputs` if this project folder is committed as-is).

After publishing, open the site's HTTPS URL. No environment variables or secrets are needed. Browser local storage keeps quiz activity on that device and browser; use **My progress → Download my backup** to carry a copy elsewhere.

## What works

- Five short guided lessons with topic navigation.
- Three-question quizzes for microbiology, molecular biology, biochemistry, genetics, and immunology.
- Viva practice with a transparent, keyword-based self-check prompt.
- Paper reader: load a PDF for browser preview or load a text file, paste an excerpt, and generate a structured reading checklist.
- Local progress, topic-level quiz summaries, and JSON export/import.
- Responsive layout for phones and desktops.

## Scope

This is an offline-friendly study aid, not an AI service. Lesson text is curated starter content; viva feedback is a keyword prompt; the paper checklist does not extract or verify scientific claims. PDF viewing uses the browser's built-in PDF support, and the reader guide is generated from text you paste. Progress is local to one browser unless you export and restore a backup. The sample lessons and questions should be checked against course materials.
