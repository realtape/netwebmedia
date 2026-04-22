# NetWebMedia App

Capacitor wrapper: iOS + Android + web, all from one codebase. Reuses the existing `https://netwebmedia.com/api/` endpoints.

## Stack
- Vite (vanilla JS, no framework lock-in)
- Capacitor 6 (iOS 13+, Android 7+)
- Brand CSS matches `netwebmedia.com` (Navy #010F3B + Orange #FF671F, Inter + Poppins)

## v0.1 features
- Login via `/api/auth/login`
- Home dashboard (placeholder metrics)
- AI chat tab — wired to `/api/public/chat` (same KB as the website bot)
- Leads tab — wired to `/api/resources/contacts`
- Account tab — sign out, external links via in-app browser
- Dark status bar, splash screen, haptics, secure token storage (Preferences)

## Run the web preview

```
cd app
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Build web

```
npm run build    # outputs app/dist/
```

## Add iOS platform (requires macOS + Xcode)

```
npm run cap:add:ios
npm run ios         # opens Xcode
```

Xcode → Signing & Capabilities → select Team → Run on simulator or device.

## Add Android platform (requires Android Studio)

```
npm run cap:add:android
npm run android     # opens Android Studio
```

## Environment

API base defaults to `https://netwebmedia.com/api`. Override with:

```
VITE_API_BASE=https://staging.netwebmedia.com/api npm run dev
```

## Next steps before App Store submission

1. **Apple Developer account** ($99/yr) — Carlos enrolls in person/via ID verification
2. **Google Play Console** ($25 one-time) — same
3. **App icon** (1024×1024 + generated sizes) — creative-director agent
4. **Splash screen** — Navy bg, NWM mark
5. **Screenshots** — 6.7" + 6.1" + 5.5" iPhone, 7" + 10" tablet
6. **Privacy labels** (App Store) + data safety form (Play)
7. **Push notifications** — wire `/api/notifications/register-device` (TODO)
8. **Biometric unlock** — add `@capacitor-community/biometric-auth` (TODO v0.2)
9. **TestFlight** / **Internal Testing** → public review
