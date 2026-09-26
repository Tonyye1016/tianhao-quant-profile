# Tianhao (Tony) Ye

Personal website for quantitative research and risk recruiting.

This is a standalone static site. No package installation or build step is required.

## Files

- `index.html`: profile, experience, project, education, skills, and contact links.
- `styles.css`: layout and typography.
- `reading-panels.js`: section navigation and scroll-focus effects.
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
