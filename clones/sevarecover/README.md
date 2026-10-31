# SevaRecover portfolio demo

Open `index.html` through the portfolio's static HTTP server. The portfolio's
Play In Frame and Live Demo actions both load this app with `?theme=light`,
matching the original light/green public service recovery interface. The
portfolio screenshot is captured from this app, not the older blue demo.

This directory contains an exported production build, not the original React
source. The entry bundle has three integration changes: image paths are relative
to this directory, and the router history uses URL hashes so navigation and
refreshes work on static hosting without taking over the portfolio's routes.
The theme provider reads the small `portfolio-theme.js` adapter, which accepts
an explicit light/dark launch theme and safely stores the user's theme choices.
The in-app theme switch remains available. Preserve these changes when replacing the exported build, ideally by configuring
relative assets and a HashRouter in the original source before rebuilding.

The exported app points to `http://127.0.0.1:8000` for its API. The static
portfolio does not include that backend. Sign-in, live analysis, and other API
features require a running compatible service; this integration does not
configure a production API or simulate successful backend responses.
