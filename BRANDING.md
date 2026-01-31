# Branding Guidelines - StockMarket Bullion

## Brand Name
**StockMarket Bullion**

## Domain
**stockmarketbullion.com**

## Logo
- Primary logo: SVG format (`/public/logo.svg`)
- Favicon: Generated via `app/icon.js` (32x32 PNG)
- Apple Touch Icon: `/public/apple-touch-icon.png` (180x180 PNG)

## Color Scheme
- Primary Blue: `#2563EB` (blue-600)
- Secondary Blue: `#1D4ED8` (blue-700)
- Gold Accent: `#FBBF24` (for metals section)
- Green: `#10B981` (for Sharia compliant badges)

## Typography
- Primary Font: Geist Sans (via Next.js)
- Monospace Font: Geist Mono (for code/data)

## Usage Guidelines

### Logo Usage
- Always use the full logo with text "StockMarket Bullion" in navigation
- Logo should link to homepage
- Minimum size: 40px height for readability

### Domain References
- Always use `https://stockmarketbullion.com` in production
- Use `http://localhost:3000` only for local development
- Update `NEXT_PUBLIC_SITE_URL` environment variable accordingly

### Brand Name Usage
- Use "StockMarket Bullion" (two words, capital M and B)
- In titles: "StockMarket Bullion | [Page Title]"
- In metadata: Include brand name for SEO

## Files to Update for Logo
1. Replace `/public/logo.svg` with your custom logo design
2. Create `/public/logo.png` (recommended sizes: 200x60, 400x120)
3. Create `/public/favicon.ico` (16x16, 32x32, 48x48 sizes)
4. Create `/public/apple-touch-icon.png` (180x180)

## Current Logo Implementation
The logo component (`components/Logo.js`) currently uses:
- A placeholder with "SMB" initials in a blue rounded square
- Text "StockMarket Bullion" next to it
- Can be updated to use actual logo image when available

## SEO Branding
- Site name in all meta tags: "StockMarket Bullion"
- Domain in all URLs: "stockmarketbullion.com"
- Consistent branding across all pages and metadata
