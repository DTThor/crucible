# Icon assets

The PWA manifest references three PNGs that aren't checked in:

- `icon-192.png` (192×192) — Android/Chrome install icon
- `icon-512.png` (512×512) — splash screens, larger devices
- `icon-maskable-512.png` (512×512, maskable safe zone) — Android adaptive icon
- `apple-touch-icon.png` (180×180) — iOS home screen

`icon.svg` is the source. Quick way to generate them:

1. Visit https://realfavicongenerator.net
2. Upload `icon.svg`
3. Download the package
4. Drop the four PNGs into this folder

Or, locally with ImageMagick:

```bash
cd public/icons
magick icon.svg -resize 192x192 icon-192.png
magick icon.svg -resize 512x512 icon-512.png
magick icon.svg -resize 512x512 -background "#0b0f14" -gravity center -extent 512x512 icon-maskable-512.png
magick icon.svg -resize 180x180 apple-touch-icon.png
```

Until you generate them the app still runs — Safari/Chrome will fall back to a default. iOS install will work but the home-screen icon will be ugly.
