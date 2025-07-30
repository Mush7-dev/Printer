package com.printer.modules

import com.facebook.react.bridge.*
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.util.Base64
import java.io.ByteArrayOutputStream

class EscPosConverterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "EscPosConverter"
    }

    @ReactMethod
    fun testPrint(promise: Promise) {
        try {
            // Generate a simple test pattern - full width line
            val outputStream = ByteArrayOutputStream()
            
            // Initialize printer
            outputStream.write(byteArrayOf(0x1B, 0x40))
            
            // Print a full-width test line (48 bytes = 384 pixels)
            outputStream.write(byteArrayOf(0x1B, 0x2A, 33, 48, 0)) // 48 bytes of data
            
            // Generate 48 bytes * 3 (for 24-dot height) of alternating pattern
            for (i in 0 until 48) {
                for (k in 0 until 3) {
                    outputStream.write(0xFF) // All dots black
                }
            }
            
            outputStream.write(0x0A) // Line feed
            
            // Print another line with alternating pattern
            outputStream.write(byteArrayOf(0x1B, 0x2A, 33, 48, 0))
            for (i in 0 until 48) {
                for (k in 0 until 3) {
                    outputStream.write(if (i % 2 == 0) 0xFF else 0x00)
                }
            }
            
            outputStream.write(0x0A)
            
            val result = WritableNativeMap().apply {
                putBoolean("success", true)
                putString("escposData", Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP))
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("TEST_ERROR", "Failed to generate test: ${e.message}", e)
        }
    }

    @ReactMethod
    fun convertImageToEscPos(
        base64Image: String,
        width: Int,
        promise: Promise
    ) {
        try {
            val cleanBase64 = base64Image.replace("data:image/[a-z]+;base64,".toRegex(), "")
            
            val decodedBytes = Base64.decode(cleanBase64, Base64.DEFAULT)
            val originalBitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
                ?: throw Exception("Failed to decode image")

            val scaledBitmap = scaleBitmap(originalBitmap, width)
            
            val grayscaleBitmap = convertToGrayscale(scaledBitmap)
            
            // Log the actual dimensions
            android.util.Log.d("EscPosConverter", "Original bitmap: ${originalBitmap.width}x${originalBitmap.height}")
            android.util.Log.d("EscPosConverter", "Scaled bitmap: ${scaledBitmap.width}x${scaledBitmap.height}")
            android.util.Log.d("EscPosConverter", "Bytes per line: ${(scaledBitmap.width + 7) / 8}")
            
            val escposCommands = convertBitmapToEscPos(grayscaleBitmap)
            
            val result = WritableNativeMap().apply {
                putBoolean("success", true)
                putString("escposData", Base64.encodeToString(escposCommands, Base64.NO_WRAP))
                putMap("imageInfo", WritableNativeMap().apply {
                    putInt("width", grayscaleBitmap.width)
                    putInt("height", grayscaleBitmap.height)
                    putInt("bytesPerLine", (grayscaleBitmap.width + 7) / 8)
                })
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("CONVERSION_ERROR", "Failed to convert image: ${e.message}", e)
        }
    }

    private fun scaleBitmap(bitmap: Bitmap, targetWidth: Int): Bitmap {
        // Always scale to exact target width for thermal printer
        val aspectRatio = bitmap.height.toFloat() / bitmap.width.toFloat()
        val targetHeight = (targetWidth * aspectRatio).toInt()
        
        return Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, true)
    }

    private fun convertToGrayscale(bitmap: Bitmap): Bitmap {
        val width = bitmap.width
        val height = bitmap.height
        val grayscaleBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        
        for (x in 0 until width) {
            for (y in 0 until height) {
                val pixel = bitmap.getPixel(x, y)
                val red = Color.red(pixel)
                val green = Color.green(pixel)
                val blue = Color.blue(pixel)
                
                val gray = (0.299 * red + 0.587 * green + 0.114 * blue).toInt()
                
                // Convert to pure black/white (threshold at 128 like Node.js)
                val newPixel = if (gray < 128) Color.BLACK else Color.WHITE
                grayscaleBitmap.setPixel(x, y, newPixel)
            }
        }
        
        return grayscaleBitmap
    }

    private fun convertBitmapToEscPos(bitmap: Bitmap): ByteArray {
        val width = bitmap.width
        val height = bitmap.height
        val bytesPerLine = (width + 7) / 8
        
        val outputStream = ByteArrayOutputStream()
        
        // Initialize printer - ESC @
        outputStream.write(byteArrayOf(0x1B, 0x40))
        
        // Use GS v 0 raster graphics command like the working Node.js implementation
        // GS v 0 m xL xH yL yH d1...dk
        outputStream.write(byteArrayOf(0x1D, 0x76, 0x30, 0x00)) // GS v 0 0 (normal raster graphics)
        
        // Width in bytes (xL xH)
        outputStream.write(byteArrayOf((bytesPerLine and 0xFF).toByte(), ((bytesPerLine shr 8) and 0xFF).toByte()))
        
        // Height in dots (yL yH)
        outputStream.write(byteArrayOf((height and 0xFF).toByte(), ((height shr 8) and 0xFF).toByte()))
        
        // Convert image data to raster format - exactly like working Node.js
        for (y in 0 until height) {
            for (x in 0 until width step 8) {
                var byte = 0
                
                // Process 8 horizontal pixels into one byte
                for (bit in 0 until 8) {
                    val pixelX = x + bit
                    
                    if (pixelX < width) {
                        val pixel = bitmap.getPixel(pixelX, y)
                        
                        // Check if pixel is black (like Node.js: pixelValue === 0)
                        if (pixel == Color.BLACK) {
                            byte = byte or (1 shl (7 - bit)) // MSB first
                        }
                    }
                }
                outputStream.write(byte)
            }
        }
        
        // Add paper feed
        outputStream.write(byteArrayOf(0x0A, 0x0A, 0x0A))
        
        return outputStream.toByteArray()
    }
}