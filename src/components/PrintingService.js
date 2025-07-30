import { Alert } from 'react-native';
import { Buffer } from 'buffer';
import BleManager from 'react-native-ble-manager';
import EscPosConverter from '../modules/EscPosConverter';
import { 
  PRINTING_CONFIG, 
  ERRORS, 
  SUCCESS_MESSAGES, 
  DEFAULTS 
} from '../constants/Constants';

export const usePrintingService = (macAddress, serviceUUID, characteristicUUID, connected) => {
  const printImage = async (previewImage, setDataLoading) => {
    if (!connected || !serviceUUID || !characteristicUUID) {
      Alert.alert('Error', ERRORS.BLUETOOTH.NOT_CONNECTED);
      return;
    }

    try {
      setDataLoading(true);
      const testImageBase64 = previewImage;
      const result = await EscPosConverter.convertImageToEscPos(
        `data:image/png;base64,${testImageBase64}`,
        PRINTING_CONFIG.IMAGE.WIDTH,
      );

      if (!result.success) {
        throw new Error(ERRORS.PRINTING.CONVERSION_FAILED);
      }

      const escposBuffer = Buffer.from(result.escposData, 'base64');

      const chunkSize = PRINTING_CONFIG.ESCPOS.CHUNK_SIZE_SAFE;
      for (let i = 0; i < escposBuffer.length; i += chunkSize) {
        const chunk = escposBuffer.slice(i, i + chunkSize);
        await BleManager.writeWithoutResponse(
          macAddress,
          serviceUUID,
          characteristicUUID,
          Array.from(chunk),
        );
      }

      Alert.alert('Success', SUCCESS_MESSAGES.IMAGE_PRINT_SUCCESS);
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', `Failed to print: ${error.message}`);
    } finally {
      setDataLoading(false);
    }
  };

  const printTextFast = async (userData, engineerName, setDataLoading) => {
    if (!connected || !serviceUUID || !characteristicUUID) {
      Alert.alert('Error', ERRORS.BLUETOOTH.NOT_CONNECTED);
      return;
    }

    try {
      setDataLoading(true);
      const startTime = Date.now();
      console.log('Starting ULTRA-FAST text printing...');
      
      // Build text content quickly using constants
      let textContent = `${DEFAULTS.COMPANY_NAME}\n`;
      textContent += `${DEFAULTS.SEPARATOR}\n`;
      if (engineerName) {
        textContent += `Գանձող: ${engineerName}\n`;
      }
      if (userData) {
        textContent += `Անուն: ${userData.fullName}\n`;
        textContent += `հասցե: ${userData.address}\n`;
        textContent += `Վճարման օր: ${userData.expectedPaymentDay}\n`;
        textContent += `Գումար: ${userData.expectedPaymentAmount}\n`;
        textContent += `Հեռախոս: ${userData.mobilePhoneNumber}\n`;
      }
      textContent += `\nԱմսաթիվ: ____________________\n`;
      textContent += `Գումար: ____________________\n`;
      
      const conversionStart = Date.now();
      const result = await EscPosConverter.printTextDirectly(textContent);
      console.log(`Text ESC/POS conversion took: ${Date.now() - conversionStart}ms`);

      if (!result.success) {
        throw new Error(ERRORS.PRINTING.CONVERSION_FAILED);
      }

      const escposBuffer = Buffer.from(result.escposData, 'base64');
      console.log(`Text ESC/POS data size: ${escposBuffer.length} bytes`);

      // Ultra-fast transmission
      const transmissionStart = Date.now();
      const chunkSize = PRINTING_CONFIG.ESCPOS.CHUNK_SIZE;
      
      for (let i = 0; i < escposBuffer.length; i += chunkSize) {
        const chunk = escposBuffer.slice(i, i + chunkSize);
        await BleManager.writeWithoutResponse(
          macAddress,
          serviceUUID,
          characteristicUUID,
          Array.from(chunk),
        );
      }
      
      console.log(`Text BLE transmission took: ${Date.now() - transmissionStart}ms`);
      console.log(`Total FAST text print time: ${Date.now() - startTime}ms`);
      Alert.alert('Success', SUCCESS_MESSAGES.TEXT_PRINT_SUCCESS);
    } catch (error) {
      console.error('Fast text print error:', error);
      Alert.alert('Error', `Failed to print text: ${error.message}`);
    } finally {
      setDataLoading(false);
    }
  };

  return {
    printImage,
    printTextFast,
  };
};

export default usePrintingService;