import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  useColorScheme,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import BrotherPrinterService from './src/services/BrotherPrinterService';
import { Buffer } from 'buffer';

interface PrinterDevice {
  id: string;
  name: string;
  rssi: number;
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [textToPrint, setTextToPrint] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const [inputText, setInputText] = useState('Hello World');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [serviceUUID, setServiceUUID] = useState<string | null>(null);
  const [characteristicUUID, setCharacteristicUUID] = useState<string | null>(
    null,
  );
  const MAC_ADDRESS = '66:22:32:D6:D1:FB';

  const [connectedPrinter, setConnectedPrinter] =
    useState<PrinterDevice | null>(null);
  const [availablePrinters, setAvailablePrinters] = useState<PrinterDevice[]>(
    [],
  );

  const printerService = BrotherPrinterService.getInstance();

  useEffect(() => {
    BleManager.start({ showAlert: false });
    return () => {
      printerService.disconnectPrinter();
    };
  }, []);

  const connectPrinter = async () => {
    try {
      setLoading(true);

      await BleManager.connect(MAC_ADDRESS);
      const info = await BleManager.retrieveServices(MAC_ADDRESS);

      console.log('Discovered services:', JSON.stringify(info, null, 2));

      const writeChar = info.characteristics.find(
        c =>
          c.properties?.WriteWithoutResponse === 'WriteWithoutResponse' ||
          c.properties?.Write === 'Write',
      );

      if (!writeChar) {
        throw new Error('No writable characteristic found.');
      }

      setServiceUUID(writeChar.service);
      setCharacteristicUUID(writeChar.characteristic);
      setConnected(true);

      Alert.alert('Printer connected & ready!');
    } catch (err) {
      console.error(err);
      Alert.alert('Connection Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const printText = async () => {
    if (!connected || !serviceUUID || !characteristicUUID) {
      Alert.alert('Printer not ready or not connected');
      return;
    }

    try {
      const buffer = Buffer.from(inputText + '\n\n', 'utf-8');
      await BleManager.writeWithoutResponse(
        MAC_ADDRESS,
        serviceUUID,
        characteristicUUID,
        buffer.toJSON().data,
      );
      Alert.alert('Printed!');
    } catch (err) {
      console.error(err);
      Alert.alert('Print Failed', err.message);
    }
  };

  const connectToPrinter = async (printer: PrinterDevice) => {
    setIsConnecting(true);
    try {
      await printerService.connectToPrinter(printer.id);
      setConnectedPrinter(printer);
      Alert.alert('Connected', `Successfully connected to ${printer.name}!`);
    } catch (error: any) {
      Alert.alert(
        'Connection Error',
        error?.message || 'Failed to connect to printer.',
      );
      console.error(error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectPrinter = async () => {
    try {
      await printerService.disconnectPrinter();
      setConnectedPrinter(null);
      Alert.alert('Disconnected', 'Printer disconnected successfully.');
    } catch (error: any) {
      console.error('Disconnect error:', error);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, isDarkMode && styles.darkContainer]}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={[styles.title, isDarkMode && styles.darkText]}>
            Bluetooth Printer
          </Text>
        </View>

        {/* Connection Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            Status
          </Text>
          <View style={[styles.statusCard, isDarkMode && styles.darkCard]}>
            <Text style={[styles.statusText, isDarkMode && styles.darkText]}>
              {connectedPrinter
                ? `Connected to: ${connectedPrinter.name}`
                : 'Not connected'}
            </Text>
            {connectedPrinter && (
              <TouchableOpacity
                style={[styles.button, styles.disconnectButton]}
                onPress={connectPrinter}
              >
                <Text style={styles.buttonText}>Disconnect</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Scan for Printers */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.button, styles.scanButton]}
            onPress={connectPrinter}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Scan for Printers</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Available Printers */}
        {availablePrinters.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              Available Printers
            </Text>
            {availablePrinters.map(printer => (
              <TouchableOpacity
                key={printer.id}
                style={[
                  styles.printerItem,
                  isDarkMode && styles.darkCard,
                  connectedPrinter?.id === printer.id &&
                    styles.connectedPrinter,
                ]}
                onPress={() => connectToPrinter(printer)}
                disabled={isConnecting}
              >
                <Text
                  style={[styles.printerName, isDarkMode && styles.darkText]}
                >
                  {printer.name}
                </Text>
                <Text
                  style={[styles.printerRssi, isDarkMode && styles.darkSubText]}
                >
                  Signal: {printer.rssi} dBm
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Text Input for Printing */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            Text to Print
          </Text>
          <TextInput
            style={[styles.textInput, isDarkMode && styles.darkInput]}
            placeholder="Enter text to print..."
            placeholderTextColor={isDarkMode ? '#666' : '#999'}
            value={textToPrint}
            onChangeText={setTextToPrint}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={[
              styles.button,
              styles.printButton,
              (!connectedPrinter || isPrinting) && styles.disabledButton,
            ]}
            onPress={printText}
          >
            {isPrinting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Print Text</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  darkSubText: {
    color: '#ccc',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkCard: {
    backgroundColor: '#333',
  },
  statusText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButton: {
    backgroundColor: '#007AFF',
  },
  printButton: {
    backgroundColor: '#4CAF50',
    marginTop: 15,
  },
  disconnectButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignSelf: 'flex-start',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  printerItem: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  connectedPrinter: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  printerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  printerRssi: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  darkInput: {
    backgroundColor: '#333',
    borderColor: '#555',
    color: '#fff',
  },
});

export default App;
