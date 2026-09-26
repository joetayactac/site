# Joe Tayactac: personal site

A static site with no build step. Open `index.html` in a browser or serve the folder with any static host (GitHub Pages works as is).

## Structure

```
index.html              All page markup: Home, Tools, Videos, Hire me
assets/
  css/style.css         Design tokens (light/dark), layout and components
  js/app.js             Shared helpers, hash router, theme toggle, visit counter
  js/progress.js        Progress bar formula generator
  js/qr.js              QR code / barcode formula generator
  js/table.js           HTML table formula generator
  js/videos.js          YouTube gallery and "latest videos" on Home
  js/contact.js         Hire me form (email code, then Apps Script)
  img/favicon.svg
```

## Pages

The site is one page with hash routes, so old links keep working:
`#home`, `#progress`, `#qr`, `#table`, `#videos`, `#hire` (`#tools` opens the first tool).

## Settings

- **YouTube:** `CHANNEL_ID` and the optional `API_KEY` are at the top of `assets/js/videos.js`. Without a key, the latest uploads come from the channel RSS feed.
- **Hire me form:** `SCRIPT_URL` in `assets/js/contact.js`.
- **Colors:** edit the tokens at the top of `assets/css/style.css`.
