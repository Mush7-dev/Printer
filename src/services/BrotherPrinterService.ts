import BleManager from 'react-native-ble-manager';
import { Buffer } from 'buffer';
import {
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

interface PrinterDevice {
  id: string;
  name: string;
  rssi: number;
}

class BrotherPrinterService {
  private static instance: BrotherPrinterService;
  private connectedPrinter: string | null = null;
  private scanning = false;

  // Brother PT-P710BT specific service and characteristic UUIDs
  private readonly SERVICE_UUID = '49535343-fe7d-4ae5-8fa9-9fafd205e455';
  private readonly WRITE_CHARACTERISTIC_UUID =
    '49535343-8841-43f4-a8d4-ecbe34729bb3';

  private constructor() {
    BleManager.start({ showAlert: false });
  }

  static getInstance(): BrotherPrinterService {
    if (!BrotherPrinterService.instance) {
      BrotherPrinterService.instance = new BrotherPrinterService();
    }
    return BrotherPrinterService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const apiLevel = Platform.Version;

      if (apiLevel < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Bluetooth Permission',
            message:
              'This app needs access to Bluetooth to connect to the printer.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          result['android.permission.BLUETOOTH_SCAN'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.BLUETOOTH_CONNECT'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.ACCESS_FINE_LOCATION'] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      }
    }
    return true;
  }

  async scanForPrinters(): Promise<PrinterDevice[]> {
    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      throw new Error('Bluetooth permissions not granted');
    }

    if (this.scanning) {
      return [];
    }

    this.scanning = true;
    const devices: PrinterDevice[] = [];

    return new Promise((resolve, reject) => {
      const stopHandler = bleManagerEmitter.addListener(
        'BleManagerStopScan',
        () => {
          this.scanning = false;
          stopHandler.remove();
          discoverHandler.remove();
          resolve(devices);
        },
      );

      const discoverHandler = bleManagerEmitter.addListener(
        'BleManagerDiscoverPeripheral',
        device => {
          if (device.name && device.name.includes('PT-P710BT')) {
            devices.push({
              id: device.id,
              name: device.name || 'Unknown Printer',
              rssi: device.rssi,
            });
          }
        },
      );

      BleManager.scan([], 5, false).catch(error => {
        this.scanning = false;
        stopHandler.remove();
        discoverHandler.remove();
        reject(error);
      });
    });
  }

  async connectToPrinter(deviceId: string): Promise<void> {
    try {
      await BleManager.connect(deviceId);
      const peripheralInfo = await BleManager.retrieveServices(deviceId);
      console.log('Connected to printer:', peripheralInfo);
      this.connectedPrinter = deviceId;
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      throw error;
    }
  }

  async disconnectPrinter(): Promise<void> {
    if (this.connectedPrinter) {
      try {
        await BleManager.disconnect(this.connectedPrinter);
        this.connectedPrinter = null;
      } catch (error) {
        console.error('Failed to disconnect:', error);
      }
    }
  }

  async printLabel(text: string): Promise<void> {
    if (!this.connectedPrinter) {
      throw new Error('No printer connected');
    }

    try {
      // Brother P-touch label printer command structure
      // This is a simplified version - actual implementation would need complete ESC/P command set
      const commands: number[] = [];

      // Initialize printer
      commands.push(0x1b, 0x40); // ESC @

      // Set print density
      commands.push(0x1b, 0x7e, 0x31, 0x00);

      // Set character size
      commands.push(0x1b, 0x58, 0x00, 0x30, 0x00);

      // Convert text to bytes
      const textBytes = Buffer.from(text, 'utf8');
      commands.push(...Array.from(textBytes));

      // Print and feed
      commands.push(0x0c); // FF (Form Feed)

      // Convert to buffer
      const data = Buffer.from(commands);

      // Send data to printer
      await BleManager.writeWithoutResponse(
        this.connectedPrinter,
        this.SERVICE_UUID,
        this.WRITE_CHARACTERISTIC_UUID,
        Array.from(data),
      );

      console.log('Print command sent successfully');
    } catch (error) {
      console.error('Failed to print:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connectedPrinter !== null;
  }

  getConnectedPrinterId(): string | null {
    return this.connectedPrinter;
  }
}

export default BrotherPrinterService;
