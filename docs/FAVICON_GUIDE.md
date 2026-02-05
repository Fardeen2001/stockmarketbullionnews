# Favicon Generation Guide

## Current Setup

The project uses **Next.js 13+ dynamic icon generation** which automatically creates favicons from:
- `app/icon.js` - Generates 32x32 favicon
- `app/apple-icon.js` - Generates 180x180 Apple touch icon

## Icon Design

The new favicon design features:
- **Stock Market Chart**: Upward trending line on the left (blue/white)
- **Gold Bullion Bar**: Precious metal bar on the right (gold gradient)
- **Brand Colors**: Blue (#1e40af, #2563eb) to Gold (#fbbf24) gradient background
- **Professional Look**: Clean, modern design that represents both stocks and bullion

## How It Works

Next.js automatically:
1. Generates `/favicon.ico` from `app/icon.js`
2. Generates `/icon.png` from `app/icon.js` 
3. Generates `/apple-icon.png` from `app/apple-icon.js`

These are generated at build time and served automatically.

## Optional: Generate Static Favicon Files

If you want to create static favicon files for better compatibility:

### Method 1: Using Online Tools
1. Visit [favicon.io](https://favicon.io/favicon-generator/) or [realfavicongenerator.net](https://realfavicongenerator.net/)
2. Create a 512x512 PNG with your brand design:
   - Stock chart (upward trend) on left
   - Gold bullion bar on right
   - Blue to gold gradient background
3. Upload and generate all sizes
4. Download and place in `public/` folder:
   - `favicon.ico` (16x16, 32x32, 48x48)
   - `icon-192.png` (192x192)
   - `icon-512.png` (512x512)
   - `apple-touch-icon.png` (180x180)

### Method 2: Using Design Tools
1. Create in Figma/Photoshop/Illustrator:
   - Size: 512x512px
   - Design: Stock chart + Gold bar
   - Colors: Blue (#2563eb) to Gold (#fbbf24)
2. Export as PNG
3. Use [favicon.io](https://favicon.io/favicon-converter/) to convert to all formats

### Method 3: Programmatic Generation (Advanced)
You can use the existing `app/icon.js` and `app/apple-icon.js` files:
1. Run the Next.js build
2. Copy generated icons from `.next/` to `public/`
3. Or use a script to generate static files

## Update Manifest (if using static files)

If you generate static files, update `public/manifest.json`:

```json
{
  "name": "StockMarket Bullion",
  "short_name": "SMB",
  "description": "Stock market news, gold and silver prices, and Sharia-compliant stock analysis",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#2563EB",
  "theme_color": "#2563EB",
  "icons": [
    {
      "src": "/favicon.ico",
      "sizes": "any",
      "type": "image/x-icon"
    },
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png"
    }
  ]
}
```

## Testing

1. **Browser Tab**: Check if favicon appears in browser tab
2. **Bookmarks**: Test bookmark icon
3. **Mobile**: Test Apple touch icon on iOS devices
4. **PWA**: Test if icons appear when installing as PWA

## Current Status

✅ Dynamic icon generation is set up and working
✅ Brand-aligned design (stocks + bullion)
✅ Proper colors and gradients
✅ Optimized for small sizes (32x32)

The favicon will be automatically generated on next build!
