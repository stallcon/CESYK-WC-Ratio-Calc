# CESYK Water Cement Ratio Calculator

A free, public, dependency-free web version of the original Excel water-cement ratio calculator with US Customary and Metric calculation modes.

## Features

- Runs directly in the browser
- No build step, install, backend, database, or paid software required
- Supports US Customary and Metric inputs
- Allows users to attach a ticket photo and include it in the PDF report
- Logs report date, time, and browser-provided location
- Adds project name to report details
- Looks up a nearest address from the logged GPS coordinates when the user approves the address lookup
- Includes a Mix Design and Report page for supplier details, agency details, test results, and break result fields
- Includes a Print / Save PDF report action
- Ready for GitHub Pages or any static web host

## Open the app

Open `index.html` in any modern web browser, or publish the repository with GitHub Pages.

## GitHub Pages

1. Create a new GitHub repository.
2. Add these files to the repository.
3. Push the repository to GitHub.
4. In GitHub, go to `Settings` > `Pages`.
5. Set `Source` to `GitHub Actions`.
6. The included workflow will publish the app when changes are pushed to `main`.

You can also publish without Actions by setting `Source` to `Deploy from a branch`, then selecting `main` and `/ (root)`.

## Location Lookup

The app uses browser location services to log coordinates. If the user approves the nearest-address lookup prompt, the app sends the coordinates to OpenStreetMap Nominatim and stores the returned nearest address in the report. If lookup is unavailable, the report keeps the GPS coordinates.

## Project Files

- `index.html`: page structure
- `design-testing.html`: combined mix design and report page
- `styles.css`: professional white, black, and red app styling
- `app.js`: calculator logic, unit switching, ticket photo preview, location logging, and print action
- `design-testing.js`: saved calculator summary, design/test inputs, and combined report printing
- `brand-assets.js`: embedded CESYK logo source used when the hosted page cannot load the image file directly
- `assets/logo.png`: CESYK logo used for app branding and printed reports
- `README.md`: project and publishing instructions
- `LICENSE`: MIT license
- `.nojekyll`: tells GitHub Pages to serve files directly
- `.github/workflows/pages.yml`: optional GitHub Pages deployment workflow

## Formula Source

The calculator follows the formulas from `Water-Cement Ratio Calculator.xlsx`:

- `cement = cement + fly ash + other supplementary cement material`
- `batch water weight = batch water gallons * 8.333`
- `site water weight = site water gallons * 8.333`
- `water-cement ratio = (batch water weight + site water weight) / cement`

Metric mode uses kilograms and liters:

- `batch water weight = batch water liters * 1`
- `site water weight = site water liters * 1`
- `water-cement ratio = (batch water weight + site water weight) / cement`

## License

MIT
