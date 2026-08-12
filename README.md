# Hacker House Goa 2026 Frame Builder

A fast, browser-based frame generator for **Hacker House Goa 2026**. Upload one photo and export a share-ready PFP frame or a wide Builder ID card with your name, stack, and builder class.

## Live Demo

Paste your Vercel link here after deployment:

```text
[https://your-vercel-deployment-link.vercel.app](https://hacker-house-goa-tawny.vercel.app/)
```

## Features

- Upload JPG, PNG, WEBP, HEIC, or HEIF photos
- Generate a square HH Goa PFP frame
- Generate a wide Builder ID card
- Add name, stack/role, builder class, and optional footer line
- Random builder class regeneration
- Client-side canvas rendering, no account or backend required
- Responsive green/yellow/pink Hacker House Goa themed UI

## Tech Stack

- React
- TypeScript
- Vite
- Canvas API
- `heic2any` for HEIC/HEIF conversion
- `lucide-react` icons

## Getting Started

Install dependencies:

```powershell
npm.cmd install
```

Run locally:

```powershell
npm.cmd run dev
```

Open the local URL shown by Vite, usually:

```text
http://localhost:5173
```

Build for production:

```powershell
npm.cmd run build
```

Preview the production build:

```powershell
npm.cmd run preview
```

## Project Structure

```text
src/
  App.tsx                    Main app UI and generator flow
  styles.css                 Responsive Hacker House Goa styling
  assets/hero.png            Hero artwork
  utils/canvasGenerator.ts   PFP and Builder ID canvas exports
  utils/imageProcessor.ts    Upload validation and image resizing
  utils/heicConverter.ts     HEIC/HEIF conversion helper
  utils/titleGenerator.ts    Builder class/title suggestions
```

## Deployment

This app is ready to deploy on Vercel.

Recommended Vercel settings:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

After deployment, replace the placeholder in the **Live Demo** section with your Vercel URL.

## License

For Hacker House Goa 2026 event/demo use.
