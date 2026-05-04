# CESYK Water Cement Ratio Calculator

A free, public, dependency-free web version of the original Excel water-cement ratio calculator with US Customary and Metric calculation modes.

## Features

- Runs directly in the browser
- No build step, install, backend, database, or paid software required
- Supports US Customary and Metric inputs
- Allows users to attach a ticket photo to the report
- Logs report date, time, and browser-provided location
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

## Project Files

- `index.html`: page structure
- `styles.css`: professional white, black, and red app styling
- `app.js`: calculator logic, unit switching, ticket photo preview, location logging, and print action
- `README.md`: project and publishing instructions
- `LICENSE`: MIT license
- `.nojekyll`: tells GitHub Pages to serve files directly
- `.github/workflows/pages.yml`: optional GitHub Pages deployment workflow

## Formula Source

The calculator follows the formulas from `Water-Cement Ratio Calculator.xlsx`:

- `cement factor = (cement + fly ash) * 0.32`
- `plant water weight = plant water gallons * 8.333`
- `site water weight = site water gallons * 8.333`
- `water-cement ratio = (plant water weight + site water weight) / (cement + fly ash)`

Metric mode uses kilograms and liters:

- `plant water weight = plant water liters * 1`
- `site water weight = site water liters * 1`
- `water-cement ratio = (plant water weight + site water weight) / (cement + fly ash)`

## License

MIT
