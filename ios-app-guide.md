# iPhone App Options for Biochemist Cards

This guide outlines several approaches to turn the trading card gallery into an iPhone app, from simplest to most feature-rich.

## Option 1: Progressive Web App (PWA) - Easiest

**Effort:** Minimal (add a few lines of code)
**Distribution:** No App Store needed - students add to home screen

A PWA lets users "install" the website to their iPhone home screen where it looks and feels like a native app.

### What you get:
- App icon on home screen
- Full-screen experience (no browser chrome)
- Works offline once cached
- No App Store approval needed

### To implement:
Add these files to the repository:

**manifest.json:**
```json
{
  "name": "Biochemists Through Time",
  "short_name": "BioChem Cards",
  "description": "Trading cards of famous biochemists",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a237e",
  "theme_color": "#1a237e",
  "icons": [
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Add to index.html <head>:**
```html
<link rel="manifest" href="manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="icons/icon-192.png">
```

**Instructions for students:**
1. Open the site in Safari on iPhone
2. Tap the Share button
3. Tap "Add to Home Screen"
4. The app icon appears on their home screen

---

## Option 2: Capacitor Wrapper - Moderate

**Effort:** A few hours
**Distribution:** TestFlight (free for 90 days) or App Store ($99/year)

Capacitor wraps your existing website in a native iOS shell.

### What you get:
- Real iOS app
- Can distribute via TestFlight to students
- Access to native features (if needed)
- App Store distribution option

### Setup:
```bash
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init "BioChem Cards" com.uva.biochemcards
npx cap add ios
npx cap copy
npx cap open ios
```

Then build in Xcode and deploy via TestFlight.

---

## Option 3: React Native / SwiftUI - Most Work

**Effort:** Significant (rebuild the app)
**Distribution:** App Store

A fully native app built from scratch.

### When to consider:
- You want native gestures and animations
- You need offline-first with local database
- You want to add gamification features
- Long-term maintained app

### Features a native app could add:
- Card collection/deck building
- Quiz mode ("Who discovered the alpha helix?")
- Flashcard study mode
- AR mode (view cards in 3D)
- Push notifications for new cards

---

## Recommendation

**Start with Option 1 (PWA).** It requires almost no extra work and gives students a nice "app-like" experience. If you find you want more native features later, you can upgrade to Option 2 (Capacitor) since it uses the same codebase.

### Quick PWA Implementation

I can add the PWA files right now if you'd like. Just let me know and I'll:
1. Create the manifest.json
2. Update index.html with the required meta tags
3. Create placeholder icons (you can replace with UVA-branded ones)
4. Add a simple service worker for offline support

This would take the current website and make it "installable" on iPhones with no additional development needed.
