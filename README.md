# Path of Exile Item Data Browser

A static web application that provides detailed data and visualizations for Path of Exile item categories. Browse categories, view items in stash tab-style visualizations, access raw JSON data, and submit new item data.

## Features

- **Browse Categories**: Explore available item categories (Scarabs, Divination Cards, etc.)
- **Stash Tab Visualization**: View items in an in-game style stash tab using HTML5 Canvas
- **Item Details**: See detailed information about each item
- **Statistics Charts**: View data trends and distributions using Chart.js
- **Raw JSON Access**: Direct links to JSON data for programmatic access
- **Data Submission**: Submit new items via guided form or bulk import

## Tech Stack

- **Build Tool**: Vite
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Visualizations**: Chart.js (statistics), HTML5 Canvas (stash tabs)
- **Form Submissions**: EmailJS
- **Testing**: Vitest (unit tests), Playwright (E2E tests)

## Prerequisites

- Node.js 18+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge - latest 2 versions)

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure EmailJS** (Optional - required for submission functionality):
   - Create an account at https://www.emailjs.com
   - Create email service and templates
   - Copy `.env.example` to `.env.local` and fill in your EmailJS credentials

3. **Start Development Server**:
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
├── services/        # Business logic (data loading, validation, routing, email)
├── visualization/   # Canvas and chart rendering
├── forms/           # Form handling (guided form, import)
├── pages/           # Page components (home, category list, item detail, etc.)
├── utils/           # Utility functions
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
- `scarabDetails.json` - Scarab items
- `divinationCardDetails.json` - Divination card items

## Direct JSON Access

Access raw JSON data directly:
- Category data: `/public/data/{categoryId}Details.json`
- Example: `/public/data/scarabDetails.json`

## License

MIT

