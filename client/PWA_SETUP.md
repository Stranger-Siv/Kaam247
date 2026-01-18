# PWA Setup Guide for Kaam247

## ✅ Completed Steps

1. ✅ Installed `vite-plugin-pwa`
2. ✅ Configured `vite.config.js` with PWA plugin
3. ✅ Created `public/manifest.json`
4. ✅ Updated `index.html` with manifest link and theme-color
5. ✅ Created icons directory

## 📋 Next Steps: Generate Icons

### Option 1: Using the provided script (Recommended)

1. Install sharp (image processing library):
   ```bash
   cd client
   npm install sharp --save-dev
   ```

2. Run the icon generation script:
   ```bash
   node generate-icons.js
   ```

This will generate:
- `public/icons/icon-192.png` (192x192)
- `public/icons/icon-512.png` (512x512)

### Option 2: Manual creation

If you prefer to create icons manually:

1. Open `public/logo.svg` in an image editor
2. Create two PNG files:
   - `public/icons/icon-192.png` (192x192 pixels)
   - `public/icons/icon-512.png` (512x512 pixels)
3. Use a dark background (#0f172a) with the logo centered
4. Ensure icons are square and properly sized

### Option 3: Online tool

Use an online SVG to PNG converter:
1. Upload `public/logo.svg`
2. Set size to 192x192, export as `icon-192.png`
3. Set size to 512x512, export as `icon-512.png`
4. Place both files in `public/icons/`

## 🚀 Build and Deploy

Once icons are generated:

1. Build the app:
   ```bash
   npm run build
   ```

2. Deploy to Netlify as usual

3. Verify PWA:
   - Open Chrome DevTools → Application → Manifest
   - Check Lighthouse → PWA score
   - Look for "Install" button in address bar
   - On mobile: "Add to Home Screen" should appear

## ✅ Verification Checklist

- [ ] Icons generated (`icon-192.png` and `icon-512.png` exist)
- [ ] Build completes successfully
- [ ] Manifest shows correctly in DevTools
- [ ] Install prompt appears in browser
- [ ] App opens in standalone mode when installed
- [ ] Service worker is registered
- [ ] Offline functionality works (cached assets)

## 📱 Testing on Mobile

1. Open the deployed site on your mobile device
2. Look for "Add to Home Screen" prompt
3. Install the app
4. Open from home screen
5. Verify it opens in standalone mode (no browser UI)

## 🔧 Configuration Details

- **Theme Color**: `#0f172a` (dark slate)
- **Background Color**: `#0f172a` (dark slate)
- **Display Mode**: `standalone` (no browser UI)
- **Orientation**: `portrait` (mobile-first)
- **Auto Update**: Enabled (service worker auto-updates)

## 🐛 Troubleshooting

### Icons not showing
- Ensure icons are in `public/icons/` directory
- Check file names match manifest exactly
- Verify icons are PNG format

### Install prompt not appearing
- Ensure site is served over HTTPS
- Check manifest.json is accessible
- Verify service worker is registered

### Build errors
- Check `vite-plugin-pwa` is installed
- Verify vite.config.js syntax is correct
- Check console for specific errors

