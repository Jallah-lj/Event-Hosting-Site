# PWA Icon Generation

You need to generate the PWA icons from the SVG source. You can use tools like:

## Option 1: Using sharp (Node.js)

```bash
npm install sharp
```

```javascript
const sharp = require('sharp');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  sharp('icons/icon.svg')
    .resize(size, size)
    .png()
    .toFile(`icons/icon-${size}x${size}.png`);
});
```

## Option 2: Using ImageMagick

```bash
# Install ImageMagick
sudo apt-get install imagemagick

# Convert SVG to PNG at various sizes
for size in 72 96 128 144 152 192 384 512; do
  convert -background none -resize ${size}x${size} icons/icon.svg icons/icon-${size}x${size}.png
done
```

## Option 3: Online Tools

- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator
- https://maskable.app/editor

## Required Icons

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Additional Icons Needed

- badge-72x72.png (for notification badges)
- events-icon.png (for shortcuts)
- tickets-icon.png (for shortcuts)
- create-icon.png (for shortcuts)
- og-image.png (for social media sharing, 1200x630)
