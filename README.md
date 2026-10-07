# Grand Bid Prix

E-Cell JNTU Hyderabad event app: bid on 24 car parts, build a car in your team garage, race it live.

- Live: https://grand-bid-prix.vercel.app
- Everything is one file, `index.html` (CSS in `<style id="app-css">`, JS in `<script id="app-js">`), plus a small build relay in `api/build.js`.
- Keep it single-file and never write a literal closing `</script>` inside the JS — team package pages are generated from this page's own CSS/JS.

## Contributing

Fork the repo, make your change, open a pull request against `main`. Vercel posts a preview link on every PR; merges to `main` deploy to production.
