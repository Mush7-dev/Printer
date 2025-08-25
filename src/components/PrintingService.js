import { Alert } from 'react-native';
import { Buffer } from 'buffer';
import { useRef } from 'react';
import BleManager from 'react-native-ble-manager';
import EscPosConverter from '../modules/EscPosConverter';
import { PRINTING_CONFIG, ERRORS, DEFAULTS } from '../constants/Constants';

export const usePrintingService = (
  macAddress,
  serviceUUID,
  characteristicUUID,
  connected,
) => {
  const printAbortControllerRef = useRef(null);
  const printImage = async (previewImage, setDataLoading) => {
    if (!connected || !serviceUUID || !characteristicUUID) {
      Alert.alert('Error', ERRORS.BLUETOOTH.NOT_CONNECTED);
      return;
    }

    try {
      setDataLoading(true);

      // Create abort controller for this print job
      printAbortControllerRef.current = new AbortController();

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
        // Check if printing was aborted
        if (printAbortControllerRef.current?.signal.aborted) {
          console.log('Print job aborted');
          throw new Error('Print job was cancelled');
        }

        const chunk = escposBuffer.slice(i, i + chunkSize);
        await BleManager.writeWithoutResponse(
          macAddress,
          serviceUUID,
          characteristicUUID,
          Array.from(chunk),
        );
      }
    } catch (error) {
      console.error('Print error:', error);
      if (error.message !== 'Print job was cancelled') {
        Alert.alert('Error', `Failed to print: ${error.message}`);
      }
    } finally {
      setDataLoading(false);
      printAbortControllerRef.current = null;
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
        const currentDate = new Date();
        const currentMonthArmenian =
          DEFAULTS.ARMENIAN_MONTHS[currentDate.getMonth()];
        textContent += `Վճարման օր: ${userData.expectedPaymentDay} ${currentMonthArmenian}\n`;
        textContent += `Գումար: ${userData.expectedPaymentAmount}\n`;
        textContent += `Հեռախոս: ${userData.mobilePhoneNumber}\n`;
      }
      textContent += `\nԱմսաթիվ: ____________________\n`;
      textContent += `Գումար: ____________________\n`;
      const conversionStart = Date.now();
      const result = await EscPosConverter.printTextDirectly(textContent);

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

      console.log(
        `Text BLE transmission took: ${Date.now() - transmissionStart}ms`,
      );
      console.log(`Total FAST text print time: ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('Fast text print error:', error);
      Alert.alert('Error', `Failed to print text: ${error.message}`);
    } finally {
      setDataLoading(false);
    }
  };

  const printMultipleUsers = async (usersWithPrices, location) => {
    if (!connected || !serviceUUID || !characteristicUUID) {
      Alert.alert('Error', ERRORS.BLUETOOTH.NOT_CONNECTED);
      return;
    }

    try {
      console.log('Starting multi-user printing...');

      // Build text content for all users
      let textContent = `${DEFAULTS.COMPANY_NAME}\n`;
      textContent += `${DEFAULTS.SEPARATOR}\n`;

      // Add location info
      if (location) {
        textContent += `Շրջան: ${location.district}\n`;
        textContent += `Տարածք: ${location.area}\n`;
        textContent += `Փողոց: ${location.street}\n`;
        textContent += `${DEFAULTS.SEPARATOR}\n`;
      }

      // Add current date
      const currentDate = new Date();
      const day = currentDate.getDate();
      const month = DEFAULTS.ARMENIAN_MONTHS[currentDate.getMonth()];
      const year = currentDate.getFullYear();
      textContent += `Ամսաթիվ: ${day} ${month} ${year}\n`;
      textContent += `${DEFAULTS.SEPARATOR}\n\n`;

      // Add each user with their price
      usersWithPrices.forEach((user, index) => {
        const displayName =
          user.name || user.customerName || user.fullName || 'Անանուն';
        const displayId = user.customerId || user.id || '';
        const displayPhone =
          user.mNumber || user.phoneNumber || user.mobilePhoneNumber || '';
        const displayAddress =
          user.address ||
          `${user.building || ''} ${user.apartment || ''}`.trim() ||
          '';

        textContent += `${index + 1}. ${displayName}\n`;

        if (displayId) {
          textContent += `   ID: ${displayId}\n`;
        }
        if (displayPhone) {
          textContent += `   Հեռ: ${displayPhone}\n`;
        }
        if (displayAddress) {
          textContent += `   Հասցե: ${displayAddress}\n`;
        }

        textContent += `   Գումար: ${user.price} դրամ\n`;
        textContent += `   Ստորագրություն: _______________\n`;
        textContent += '\n';
      });

      // Add total
      const totalAmount = usersWithPrices.reduce((sum, user) => {
        const price = parseFloat(user.price) || 0;
        return sum + price;
      }, 0);

      textContent += `${DEFAULTS.SEPARATOR}\n`;
      textContent += `Ընդհանուր գումար: ${totalAmount} դրամ\n`;
      textContent += `Օգտատերերի քանակ: ${usersWithPrices.length}\n`;
      textContent += `${DEFAULTS.SEPARATOR}\n\n\n`;

      // Convert to ESC/POS
      const result = await EscPosConverter.printTextDirectly(textContent);

      if (!result.success) {
        throw new Error(ERRORS.PRINTING.CONVERSION_FAILED);
      }

      const escposBuffer = Buffer.from(result.escposData, 'base64');
      console.log(`Multi-user ESC/POS data size: ${escposBuffer.length} bytes`);

      // Transmit data
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

      console.log('Multi-user printing completed successfully');
    } catch (error) {
      console.error('Multi-user print error:', error);
      throw error;
    }
  };

  const abortPrint = () => {
    if (printAbortControllerRef.current) {
      printAbortControllerRef.current.abort();
      console.log('Print job abort requested');
    }
  };

  return {
    printImage,
    printTextFast,
    printMultipleUsers,
    abortPrint,
  };
};

export default usePrintingService;
