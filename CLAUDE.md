# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "Bonnenmonster" (Receipt Monster), a Progressive Web App (PWA) for scanning invoices and receipts and storing the extracted data in Baserow. The app uses Google's Gemini AI to analyze invoice/receipt images and extract structured data.

**Tech Stack**: React 18 + TypeScript + Vite + Tailwind CSS + Google Gemini AI + Baserow API

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (default: http://localhost:5173)
npm run dev

# Build for production (outputs to ./docs for GitHub Pages)
npm run build

# Preview production build locally
npm run preview
```

## Environment Setup

Create a `.env.local` file with:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

Note: The app also stores Gemini API key and Baserow credentials (API URL, API key, table ID) in localStorage via the Settings modal, so `.env.local` is optional for local development.

## Architecture

### Core Data Flow

1. **Image Upload** → User selects receipt image via [ImageUploader.tsx](components/ImageUploader.tsx)
2. **AI Analysis** → Image converted to base64 and sent to Gemini API via [geminiService.ts](services/geminiService.ts)
3. **Data Extraction** → Gemini returns structured JSON matching `ReceiptData` interface
4. **Display & Save** → Data shown in [ReceiptDataDisplay.tsx](components/ReceiptDataDisplay.tsx), optionally saved to Baserow via [baserowService.ts](services/baserowService.ts)

### File Structure

The codebase has a dual structure (root and `src/` mirror each other):
- Root level: `App.tsx`, `components/`, `services/`, `types.ts`
- `src/` directory: Contains identical copies of the above

**When editing, always modify both locations** to maintain consistency.

### Key Files

- [App.tsx](App.tsx) - Main application component with state management for image upload, analysis, and settings
- [types.ts](types.ts) - Core TypeScript interfaces:
  - `ReceiptData`: Extracted receipt fields (date, supplierName, totalAmount, vatAmount, netAmount, lineItems)
  - `LineItem`: Individual line items with description, amounts, VAT rate, and selection state
  - `AppConfig`: User configuration (apiUrl, apiKey, tableId, geminiApiKey)
- [services/geminiService.ts](services/geminiService.ts) - Gemini AI integration with structured output schema
- [services/baserowService.ts](services/baserowService.ts) - Baserow API integration for saving receipts
- [components/LineItemsSelector.tsx](components/LineItemsSelector.tsx) - UI component for selecting/deselecting line items

### Gemini AI Integration

The app uses Gemini 2.5 Flash model with structured output:
- Schema enforces required fields: date (YYYY-MM-DD), supplierName, totalAmount, vatAmount, netAmount
- Optional field: lineItems (array of individual items on the receipt)
- Prompt is in Dutch: "Analyseer deze factuur en extraheer de volgende informatie..."
- Uses `@google/genai` SDK with response schema validation
- Automatically adds unique IDs and selection state to extracted line items

### Baserow Integration

Saves to Baserow using field names:
- `Datum` (date)
- `Leverancier` (supplier name)
- `Totaal Bedrag` (total amount - recalculated based on selected items)
- `BTW Bedrag` (VAT amount - recalculated based on selected items)
- `Netto Bedrag` (net amount - recalculated based on selected items)
- `Items` (comma-separated list of selected item descriptions) - OPTIONAL
- `Aantal Items` (count of selected items) - OPTIONAL
- `Photo` (file upload - receipt image)

**Line Item Selection**:
When a receipt contains multiple line items (e.g., multiple products on one receipt), users can:
- View each item separately with checkboxes
- Deselect unwanted items (e.g., personal vs. business expenses)
- See real-time recalculation of totals based on selected items
- Save only the selected items and their recalculated totals to Baserow

**Photo Upload Process:**
1. `uploadPhotoToBaserow()` - Uploads image file via multipart/form-data to `{apiUrl}/api/user-files/upload-file/`
2. Returns `BaserowFileUploadResponse` with file metadata
3. File metadata added to row data as array: `[{ name: uploadedFile.name }]`
4. Photo upload is optional - if it fails, receipt data is still saved without the photo

Endpoints:
- File upload: `{apiUrl}/api/user-files/upload-file/` (POST, multipart/form-data)
- Row creation: `{apiUrl}/api/database/rows/table/{tableId}/?user_field_names=true` (POST, JSON)

### PWA Features

This is a fully functional Progressive Web App with:

**Manifest** ([public/manifest.json](public/manifest.json)):
- `start_url` and `scope` set to `/bonnenmonster/` (GitHub Pages base path)
- Standalone display mode for app-like experience
- Portrait orientation for mobile-first usage
- SVG icons (inline data URIs) for app icon

**Service Worker** ([public/service-worker.js](public/service-worker.js)):
- Cache name: `bonnenmonster-v2`
- Caches app shell (index.html, manifest.json) on install
- Network-first strategy with runtime caching for assets
- Excludes API requests from caching (Gemini AI, Baserow, CDN)
- `skipWaiting()` and `clients.claim()` for immediate activation

**Installation**:
- Install prompt handled in [App.tsx](App.tsx) via `beforeinstallprompt` event
- Shows install button in header when PWA is installable
- Service worker registered using `import.meta.env.BASE_URL` for correct path resolution

**PWA Assets Location**:
- Source: `public/` directory (manifest.json, service-worker.js)
- Build output: Automatically copied to `docs/` by Vite's publicDir option

## Build Configuration

[vite.config.ts](vite.config.ts) is configured for GitHub Pages deployment:
- `base: '/bonnenmonster/'` - matches GitHub repository name (update if deploying elsewhere)
- `build.outDir: 'docs'` - outputs to docs/ for GitHub Pages hosting
- `publicDir: 'public'` - PWA assets (manifest.json, service-worker.js) copied from public/ to docs/

**Important**:
- If deploying to a different repository, update `base` in vite.config.ts AND `start_url`/`scope` in public/manifest.json
- Service worker base path is automatically handled via `import.meta.env.BASE_URL` in index.tsx

## Language

The entire application UI and error messages are in Dutch. Keep this consistent when modifying user-facing strings.
