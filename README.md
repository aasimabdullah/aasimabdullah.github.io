# BioTutor

A small biology study app that can be hosted on any static web host. It has no build step or app server. Supabase is required for account sign-in and cross-device history; add its project URL and browser-safe publishable key to enable those features.

## Run it

Open `index.html` in a modern browser, or serve the `outputs` folder with any local static file server. Keep `index.html` and `app.js` together.

## Host it

Upload all files in this folder (`index.html`, `app.js`, `auth.js`, `supabase-config.js`, `supabase-schema.sql`, and the README) to a static host such as GitHub Pages, Cloudflare Pages, or Netlify. The SQL file is for Supabase setup and does not need to be served publicly. For a simple upload-style deployment, use Netlify Drop or Cloudflare Pages direct upload. For GitHub Pages, put these files in the repository's published root (or set the Pages folder to `/outputs` if this project folder is committed as-is).

After publishing, open the site's HTTPS URL. Before Supabase is configured, the app shows account setup instructions and will not let visitors into the study space. With Supabase enabled, quiz activity and lesson history sync to the signed-in account; use **My progress → Download my backup** for a portable copy.

## Enable accounts and cross-device history

The app uses Supabase Auth for accounts and a private Postgres row for each learner's saved progress. To enable sign in:

1. Create a Supabase project.
2. In the project SQL Editor, run `supabase-schema.sql`.
3. Copy the project URL and its **publishable** key from the project's Connect/API settings into `supabase-config.js`.
4. In Supabase Auth settings, add the deployed site URL to the allowed site/redirect URLs. For email confirmation, also set the confirmation redirect URL to the deployed site.
5. Upload all files in this folder to your static host and open the HTTPS site. Use **Create account** to register; if email confirmation is enabled, confirm the email before signing in.

The publishable key is designed for browser use. Never paste a secret or service-role key into the website. The SQL enables row-level security so signed-in users can read and change only the row with their own account ID. Account passwords are handled by Supabase Auth, not stored by BioTutor. The Supabase JavaScript library is loaded from jsDelivr, so the hosted page needs internet access for sign-in and cloud sync.

## What works

- Five short guided lessons with topic navigation.
- Three-question quizzes for microbiology, molecular biology, biochemistry, genetics, and immunology.
- Viva practice with a transparent, keyword-based self-check prompt.
- Paper reader: load a PDF for browser preview or load a text file, paste an excerpt, and generate a structured reading checklist.
- Account-specific lesson history, quiz scores, topic-level summaries, and JSON export/import.
- Responsive layout for phones and desktops.

## Scope

This is a study aid, not an AI service. Lesson text is curated starter content; viva feedback is a keyword prompt; the paper checklist does not extract or verify scientific claims. PDF viewing uses the browser's built-in PDF support, and the reader guide is generated from text you paste. With Supabase configured, study history is saved to the account and follows the learner across signed-in devices. The sample lessons and questions should be checked against course materials.
