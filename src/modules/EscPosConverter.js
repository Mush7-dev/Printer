import { NativeModules } from 'react-native';

const { EscPosConverter } = NativeModules;

if (!EscPosConverter) {
  console.warn('EscPosConverter native module is not available. Please rebuild the Android app.');
}

export default {
  convertImageToEscPos: async (base64Image, width = 384) => {
    if (!EscPosConverter) {
      throw new Error('EscPosConverter native module is not available. Please rebuild the Android app with: cd android && ./gradlew clean && cd .. && npx react-native run-android');
    }
    
    try {
      const result = await EscPosConverter.convertImageToEscPos(base64Image, width);
      return result;
    } catch (error) {
      throw new Error(`ESC/POS conversion failed: ${error.message}`);
    }
  },
  
  testPrint: async () => {
    if (!EscPosConverter) {
      throw new Error('EscPosConverter native module is not available. Please rebuild the Android app');
    }
    
    try {
      const result = await EscPosConverter.testPrint();
      return result;
    } catch (error) {
      throw new Error(`Test print failed: ${error.message}`);
    }
  },
};