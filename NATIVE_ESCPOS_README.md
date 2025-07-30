# Native ESC/POS Image Converter for Android

This implementation replaces the Node.js server-based image to ESC/POS conversion with a native Android module, allowing the React Native app to work completely offline.

## Implementation Overview

### 1. Native Android Module
- **Location**: `/android/app/src/main/java/com/printer/modules/`
- **Main Classes**:
  - `EscPosConverterModule.kt`: Core conversion logic
  - `EscPosConverterPackage.kt`: React Native package registration

### 2. Features
- Converts base64 images to ESC/POS commands
- Image scaling to thermal printer width (default 384px)
- Grayscale conversion
- Dithering for better print quality
- ESC/POS bitmap mode command generation

### 3. JavaScript Integration
- **Module**: `/src/modules/EscPosConverter.js`
- Simple async interface for React Native components

## Usage

```javascript
import EscPosConverter from './src/modules/EscPosConverter';

// Convert image to ESC/POS
const result = await EscPosConverter.convertImageToEscPos(base64Image, width);

if (result.success) {
  // Decode the base64 ESC/POS data
  const escposBuffer = Buffer.from(result.escposData, 'base64');
  
  // Send to printer via Bluetooth
  await BleManager.writeWithoutResponse(
    MAC_ADDRESS,
    serviceUUID,
    characteristicUUID,
    Array.from(escposBuffer)
  );
}
```

## Building and Testing

1. Clean and rebuild the Android app:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx react-native run-android
   ```

2. Test the implementation:
   - Connect to Bluetooth printer
   - Use "Print Image" button to test
   - Use "Fetch Data" to capture and print user data

## ESC/POS Command Structure

The native module generates the following ESC/POS command sequence:
1. Initialize printer: `ESC @` (0x1B 0x40)
2. Set bitmap mode: `ESC * 33` for 24-dot density
3. Image data in bitmap format
4. Line feed: `LF` (0x0A)
5. Reset printer: `ESC @`

## Advantages Over Server Implementation

1. **Offline Operation**: No network dependency
2. **Better Performance**: Direct processing on device
3. **Privacy**: Image data stays on device
4. **Lower Latency**: No network round-trip
5. **Reduced Complexity**: No server maintenance

## Troubleshooting

- If module not found, ensure you've rebuilt the Android app
- Check Android Studio logcat for native module errors
- Verify Bluetooth permissions are granted
- Ensure printer supports ESC/POS bitmap mode