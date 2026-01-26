# Path of Exile Item Data Browser

A static web application that provides detailed data and visualizations for Path of Exile item categories. Browse categories, view items in stash tab-style visualizations, access raw JSON data, and submit new item data.

## Features

- **Browse Categories**: Explore available item categories (Scarabs, Divination Cards, Breach Splinters, Breachstones, Catalysts, Delirium Orbs, Essences, Fossils, Legion Emblems, Legion Splinters, Oils, Tattoos)
- **Stash Tab Visualization**: View items in an in-game style stash tab using HTML5 Canvas (for grid categories)
- **List View**: Browse items in a simple list format with names and icons (for new categories like tattoos and runegrafts)
- **Dual View**: Grid categories now display both grid and list views side-by-side, with list view showing item names and calculated weights for easy scanning
- **Item Details**: See detailed information about each item
- **Statistics Charts**: View data trends and distributions using Chart.js
- **Raw JSON Access**: Direct links to JSON data for programmatic access
- **Data Submission**: Submit new items via guided form or bulk import
- **Dataset Submission Wizard**: Submit new datasets with name, description, sources, date, input items, and item counts through an intuitive form interface
- **Dataset Access**: Browse and download datasets for each category, view dataset metadata and sources
- **Dataset Details**: View comprehensive dataset information including metadata, sources, input items, and output items
- **Weight Calculations**: Calculate item weights using Maximum Likelihood Estimation (MLE)
- **Bayesian Weight Estimates**: View Bayesian MCMC-based weight estimates with uncertainty quantification (posterior distributions, credible intervals) - runs entirely client-side
- **Contribution Guide**: Learn how to contribute datasets with category-specific guidelines and quality requirements

## Tech Stack

- **Build Tool**: Vite
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Visualizations**: Chart.js (statistics), HTML5 Canvas (stash tabs)
- **Form Submissions**: EmailJS
- **Testing**: Vitest (unit tests), Playwright (E2E tests)
- **Bayesian Inference**: Client-side MCMC (Metropolis-Hastings) sampler for Bayesian inference - no backend or JAGS required
- **Statistics**: simple-statistics library for posterior statistics computation

## Prerequisites

- Node.js 18+ and npm (for development)
- Modern web browser (Chrome, Firefox, Safari, Edge - latest 2 versions)
- **Mobile browsers supported**: Chrome Mobile, Safari Mobile, Firefox Mobile
- **No additional dependencies required** - Bayesian inference runs entirely in the browser

## Mobile Support

The application is fully responsive and optimized for mobile devices:
- **Mobile-first design**: Optimized for screens 320px and wider
- **Touch-friendly**: All interactive elements meet 44x44px minimum touch target requirements
- **Responsive navigation**: Hamburger menu on mobile, full navigation on desktop
- **Mobile-optimized forms**: Full-width inputs with appropriate mobile keyboard types
- **Responsive visualizations**: Charts and canvas visualizations scale appropriately for mobile screens
- **Orientation support**: Layouts adapt to both portrait and landscape orientations

### Testing on Mobile

To test the mobile experience:
1. Use browser DevTools device emulation (F12 → Toggle device toolbar)
2. Test at breakpoints: 320px, 375px, 768px, 1024px
3. Test in both portrait and landscape orientations
4. Run E2E tests: `npm run test:e2e` (includes mobile viewport tests)

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure EmailJS** (Optional - required for submission functionality):
   - Create an account at https://www.emailjs.com
   - Create email service and templates
   - Copy `.env.example` to `.env.local` and fill in your EmailJS credentials

3. **Start Frontend Development Server**:
   ```bash
   npm run dev
   ```
   Server starts at `http://localhost:5173`

## Development

- **Development Server**: `npm run dev`
- **Build for Production**: `npm run build`
- **Preview Production Build**: `npm run preview`
- **Run Tests**: `npm test`
- **Run Tests with UI**: `npm run test:ui`
- **Run Tests with Coverage**: `npm run test:coverage`
- **Run E2E Tests**: `npm run test:e2e`
- **Lint Code**: `npm run lint`
- **Fix Linting Issues**: `npm run lint:fix`

## Project Structure

```
src/
├── models/          # Data models (Item, Category, ValidationResult)
├── services/        # Business logic (data loading, dataset loading, validation, routing, email)
├── visualization/   # Canvas and chart rendering
├── forms/           # Form handling (guided form, import)
├── pages/           # Page components (home, category list, item detail, dataset view, etc.)
├── components/      # Reusable components (dataset list, dataset detail, navigation)
├── utils/           # Utility functions (dataset parser, download, etc.)
└── main.js          # Application entry point

public/
├── data/            # JSON data files (scarabDetails.json, etc.)
└── assets/          # Static assets (images, styles)

tests/
├── unit/            # Unit tests
├── integration/     # Integration/E2E tests
└── fixtures/        # Test data fixtures
```

## Data Files

Item data is stored in JSON files in `public/data/`:
- `scarabs/scarabs.json` - Scarab items
- `divinationCards/divinationCards.json` - Divination card items
- `breachSplinter/breachSplinter.json` - Breach Splinters items
- `breachstones/breachStones.json` - Breachstones items
- `catalysts/catalysts.json` - Catalysts items
- `deliriumOrbs/deliriumOrbs.json` - Delirium Orbs items
- `essences/essences.json` - Essences items
- `fossils/fossils.json` - Fossils items
- `legionEmblems/legionEmblems.json` - Legion Emblems items
- `legionSplinters/legionSplinters.json` - Legion Splinters items
- `oils/oils.json` - Oils items
- `tattoos/tattos.json` - Tattoos items

### Dataset Files

Datasets are stored alongside category data in `public/data/{category}/dataset/` or `public/data/{category}/datasets/` directories:
- `{category}/dataset/dataset1.json`, `dataset2.json`, etc. - Dataset files for each category
- Example: `public/data/breachSplinter/dataset/dataset1.json`
- Each dataset contains metadata (name, date, patch), sources, input items, and output items with weights

### Contribution Guide Content

Contribution guide content is stored in `public/contributions/`:
- `index.json` - Metadata about which categories have specific guidelines
- `generic.html` - Generic contribution guidelines (fallback for categories without specific content)
- `categories/{categoryId}.html` - Category-specific contribution guidelines
- Example: `public/contributions/categories/scarabs.html`

## Direct JSON Access

Access raw JSON data directly:
- Category data: `/data/{categoryId}/{categoryId}.json` or `/data/{categoryId}Details.json`
- Dataset data: `/data/{categoryId}/dataset/dataset{N}.json` or `/data/{categoryId}/datasets/dataset{N}.json`
- Examples: 
  - `/data/scarabs/scarabs.json`
  - `/data/breachSplinter/dataset/dataset1.json`

## Deployment

This application is deployed to GitHub Pages and is available at [PoeData.dev](https://PoeData.dev).

### GitHub Pages Setup

1. **Custom Domain Configuration**:
   - The `CNAME` file in `public/` contains the custom domain `PoeData.dev`
   - This file is automatically copied to `dist/` during the build process
   - GitHub Pages will serve the site from this custom domain

2. **Automatic Deployment**:
   - The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically builds and deploys the site on every push to the `main` branch
   - The workflow runs tests, builds the production bundle, and deploys to GitHub Pages

3. **Manual Deployment**:
   - You can also trigger a manual deployment using the "Run workflow" button in the GitHub Actions tab

4. **DNS Configuration**:
   - Ensure your DNS is configured to point `PoeData.dev` to GitHub Pages
   - Add the following DNS records:
     - Type: `A` records pointing to GitHub Pages IPs: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
     - Or Type: `CNAME` record pointing to `{username}.github.io` (if using a user/org page)

5. **GitHub Repository Settings**:
   - Go to Settings → Pages
   - Source should be set to "GitHub Actions" (not "Deploy from a branch")
   - The custom domain should be configured in Settings → Pages → Custom domain

## License

MIT

