# Tianhao (Tony) Ye

Personal website for quantitative research and risk recruiting.

This is a standalone static site. No package installation or build step is required.

## Files

- `index.html`: profile, experience, project, education, skills, and contact links.
- `styles.css`: layout and typography.
- `reading-panels.js`: section/project navigation and active sidebar links; no content blur or fading.
- `analytics.js`: consent-gated GA4 page visits and résumé / LinkedIn click events.
- `resume.pdf`: the current supplied résumé.
- `tony-ye.jpg`: profile photograph.
- `icons.svg` and `icons-LICENSE.txt`: Feather icons and their license.
- `fonts.html`, `fonts-preview.css`, `fonts-preview.js`, and `fonts-preview/`: font comparison page, self-hosted fonts, and licenses.

## Local preview

From this directory, run:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser. The font comparison page is at `/fonts.html`.

## Updating

Edit `index.html` for content and `styles.css` for appearance. When replacing `resume.pdf`, update the version query on both résumé links so returning visitors receive the new file.

This repository starts from a clean snapshot without earlier Site history or hosting configuration. The home address has been removed; the email address and phone number remain intentionally included. Review contact details and the résumé before sharing future updates.

Website files are at the repository root. Publishing through GitHub Pages is a separate step; pushing source code alone does not enable hosting.

## Analytics

GA4 stream: `G-K95ZZV60ER` (public measurement ID, not a secret). Enabled only on the production GitHub Pages portfolio. Enhanced measurement is disabled in GA; this site explicitly sends `resume_click` and `linkedin_click`, without link contents. Clicks do not prove a file was read or a profile viewed.

No Google tag loads before a visitor opts in. Declining, GPC, or Do Not Track keeps it off. Preferences expire after 180 days and can be changed in the footer. Withdrawal clears this portfolio's host-only Analytics cookies and reloads to unload the Google tag. Ad storage, ad personalization, ad user data, and Google Signals are disabled. Browser blockers and declined consent mean counts are incomplete. There is no retroactive data or visitor-name identification.

URLs sent to GA are canonicalized; unknown query parameters and fragments are excluded. Referrers are reduced to their origin. Campaign values use the fixed non-personal allowlists in `measurementContext()`; extend those deliberately if needed. Do not put recipient names, email addresses, or unique person IDs in campaign links.

Example company-level outreach links (a source label shows the link used, not verified employer identity):

- JPMorgan: `https://tonyye1016.github.io/tianhao-quant-profile/?utm_source=jpmc&utm_medium=email&utm_campaign=quant_2027`
- Société Générale: `https://tonyye1016.github.io/tianhao-quant-profile/?utm_source=sg&utm_medium=email&utm_campaign=quant_2027`
- LinkedIn: `https://tonyye1016.github.io/tianhao-quant-profile/?utm_source=linkedin&utm_medium=social&utm_campaign=portfolio`

See Analytics Reports for visits/acquisition and the event names above. Initial collection/reporting is not instantaneous. Keep enhanced measurement off to preserve this explicit collection boundary. See [Google's basic consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode) and [GA4 configuration reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/config).

Run the dependency-free analytics checks with `node --test tests/analytics.test.cjs`.
