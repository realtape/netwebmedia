# NWM Video Factory — Remotion-backed short-form video pipeline

Programmatic video renderer for NetWebMedia clients. Write React → get MP4.

## Run locally

```bash
cd video-factory
npm install
npm start          # starts Express renderer on :3030
# or preview in browser:
npm run preview
```

## Config the PHP API to use it

In `/home/webmed6/.netwebmedia-config.php`:

```php
'remotion_render_url' => 'http://127.0.0.1:3030/render',
```

Then `POST /api/video/render` from the CRM will render synchronously in ~30-120s for a 10-18s clip.

## Architecture

```
CRM UI  →  PHP /api/video/render  →  Node server.js /render  →  Remotion bundle → MP4 on disk
                                                                                → served from /video-out/*.mp4
```

## Templates

- `quote-card` (10s, 9:16): quote + author + brand color
- `product-reel` (18s, 9:16): 3-step bulleted product explainer with intro + CTA
- `before-after` (12s, 9:16): image swipe reveal

## Adding a new template

1. Create `src/compositions/MyTemplate.tsx` exporting a React component + Props type.
2. Register it in `src/index.tsx` with `<Composition id="my-template" ...>`.
3. Add field spec to `vid_templates()` in `api-php/routes/video.php`.

## Moving to AWS Lambda (when volume justifies)

Swap `renderMedia` with `@remotion/lambda`'s `renderMediaOnLambda`. Per-render cost drops to ~$0.05 and concurrency scales to hundreds.
