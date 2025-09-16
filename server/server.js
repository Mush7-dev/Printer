const express = require('express');
const escpos = require('escpos');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.post('/convert-to-escpos', async (req, res) => {
  try {
    const { base64Image, width = 384 } = req.body;
    if (!base64Image) {
      return res.status(400).json({ error: 'base64Image is required' });
    }

    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const processedImage = await sharp(imageBuffer)
      .resize(width, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = processedImage;
    const { width: imgWidth, height: imgHeight } = info;

    const escposCommands = [];

    escposCommands.push(0x1b, 0x40);

    const bytesPerLine = Math.ceil(imgWidth / 8);

    for (let y = 0; y < imgHeight; y += 24) {
      const remainingHeight = Math.min(24, imgHeight - y);

      escposCommands.push(
        0x1b,
        0x2a,
        33,
        bytesPerLine & 0xff,
        (bytesPerLine >> 8) & 0xff,
      );

      for (let x = 0; x < imgWidth; x += 8) {
        for (let k = 0; k < 3; k++) {
          let byte = 0;
          for (let b = 0; b < 8; b++) {
            const pixelY = y + k * 8 + b;
            const pixelX = x + (7 - b);

            if (pixelY < imgHeight && pixelX < imgWidth) {
              const pixelIndex = pixelY * imgWidth + pixelX;
              const pixelValue = data[pixelIndex];

              if (pixelValue < 128) {
                byte |= 1 << b;
              }
            }
          }
          escposCommands.push(byte);
        }
      }

      escposCommands.push(0x0a);
    }

    escposCommands.push(0x1b, 0x40);

    const escposBuffer = Buffer.from(escposCommands);

    res.json({
      success: true,
      escposData: escposBuffer.toString('base64'),
      imageInfo: {
        width: imgWidth,
        height: imgHeight,
        bytesPerLine,
      },
    });
  } catch (error) {
    console.error('Error converting image:', error);
    res.status(500).json({
      error: 'Failed to convert image to ESC/POS format',
      details: error.message,
    });
  }
});

app.get('/convert-aa-png', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');

    // Read aa.png file
    const imagePath = path.join(__dirname, 'data.png');

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'aa.png file not found' });
    }

    const imageBuffer = fs.readFileSync(imagePath);

    // Convert to base64
    const base64Image = imageBuffer.toString('base64');

    // Process the image for thermal printer (384px width, larger size)
    const processedImage = await sharp(imageBuffer)
      .resize(384, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .greyscale()
      .threshold(128) // Convert to pure black/white
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = processedImage;
    const { width: imgWidth, height: imgHeight } = info;

    const escposCommands = [];

    // Initialize printer
    escposCommands.push(0x1b, 0x40); // ESC @

    const bytesPerLine = Math.ceil(imgWidth / 8);

    // Use GS v 0 raster graphics command for full width printing
    // GS v 0 m xL xH yL yH d1...dk
    escposCommands.push(0x1d, 0x76, 0x30, 0x00); // GS v 0 0 (normal raster graphics)

    // Width in bytes (xL xH)
    escposCommands.push(bytesPerLine & 0xff, (bytesPerLine >> 8) & 0xff);

    // Height in dots (yL yH)
    escposCommands.push(imgHeight & 0xff, (imgHeight >> 8) & 0xff);

    // Convert image data to raster format
    for (let y = 0; y < imgHeight; y++) {
      for (let x = 0; x < imgWidth; x += 8) {
        let byte = 0;

        // Process 8 horizontal pixels into one byte
        for (let bit = 0; bit < 8; bit++) {
          const pixelX = x + bit;

          if (pixelX < imgWidth) {
            const pixelIndex = y * imgWidth + pixelX;
            const pixelValue = data[pixelIndex];

            // If pixel is black (0), set the bit (MSB first)
            if (pixelValue === 0) {
              byte |= 1 << (7 - bit);
            }
          }
        }
        escposCommands.push(byte);
      }
    }

    // Add paper feed
    escposCommands.push(0x0a, 0x0a, 0x0a);

    const escposBuffer = Buffer.from(escposCommands);

    // Return raw ESC/POS data
    res.set('Content-Type', 'application/octet-stream');
    res.send(escposBuffer);
  } catch (error) {
    console.error('Error converting aa.png:', error);
    res.status(500).json({
      error: 'Failed to convert aa.png to ESC/POS format',
      details: error.message,
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'ESC/POS conversion server is running' });
});

app.listen(PORT, () => {});
