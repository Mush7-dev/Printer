import { useState, useEffect } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import BleManager from 'react-native-ble-manager';
import { BLUETOOTH_CONFIG, ERRORS } from '../constants/Constants';

const useBluetoothManager = macAddress => {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [serviceUUID, setServiceUUID] = useState(null);
  const [characteristicUUID, setCharacteristicUUID] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastConnectionCheck, setLastConnectionCheck] = useState(Date.now());

  const connectPrinter = async () => {
    try {
      setLoading(true);

      await BleManager.connect(macAddress);
      const info = await BleManager.retrieveServices(macAddress);

      const writeChar = info.characteristics.find(
        c =>
          c.properties?.WriteWithoutResponse === 'WriteWithoutResponse' ||
          c.properties?.Write === 'Write',
      );

      if (!writeChar) {
        throw new Error(ERRORS.BLUETOOTH.NO_CHARACTERISTIC);
      }

      setServiceUUID(writeChar.service);
      setCharacteristicUUID(writeChar.characteristic);
      setConnected(true);
      setReconnectAttempts(0); // Reset reconnection attempts on successful connection
      setLastConnectionCheck(Date.now());
      console.log('Bluetooth connected successfully');
    } catch (err) {
      console.error('Connection error:', err);
      setConnected(false);

      // Auto-reconnect logic
      if (
        BLUETOOTH_CONFIG.AUTO_RECONNECT &&
        reconnectAttempts < BLUETOOTH_CONFIG.MAX_RECONNECT_ATTEMPTS
      ) {
        console.log(
          `Reconnection attempt ${reconnectAttempts + 1}/${
            BLUETOOTH_CONFIG.MAX_RECONNECT_ATTEMPTS
          }`,
        );
        setReconnectAttempts(prev => prev + 1);

        // Retry after a short delay
        setTimeout(() => {
          connectPrinter();
        }, 2000);
      } else {
        Alert.alert('Connection Failed', err.message);
        setReconnectAttempts(0); // Reset attempts after max reached
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if device is still connected
  const checkConnection = async () => {
    try {
      if (!macAddress || !connected) return;

      // Check if device is still connected
      const isConnected = await BleManager.isPeripheralConnected(
        macAddress,
        [],
      );

      if (!isConnected && connected) {
        console.log('Connection lost, attempting to reconnect...');
        setConnected(false);

        // Attempt to reconnect if auto-reconnect is enabled
        if (BLUETOOTH_CONFIG.AUTO_RECONNECT) {
          connectPrinter();
        }
      }

      setLastConnectionCheck(Date.now());
    } catch (error) {
      console.log('Connection check failed:', error);
      if (connected) {
        setConnected(false);
        if (BLUETOOTH_CONFIG.AUTO_RECONNECT) {
          connectPrinter();
        }
      }
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ])
        .then(result => {
          console.log('Permissions result:', result);
          if (
            result['android.permission.BLUETOOTH_CONNECT'] ===
              PermissionsAndroid.RESULTS.GRANTED &&
            result['android.permission.BLUETOOTH_SCAN'] ===
              PermissionsAndroid.RESULTS.GRANTED &&
            result['android.permission.ACCESS_FINE_LOCATION'] ===
              PermissionsAndroid.RESULTS.GRANTED
          ) {
            connectPrinter();
          } else {
            console.log('One or more permissions denied');
          }
        })
        .catch(error => {
          console.error('Permission request error:', error);
        });
    }
  };

  useEffect(() => {
    requestPermissions();
    BleManager.start({ showAlert: false });
  }, []);

  // Set up periodic connection checking
  useEffect(() => {
    const connectionCheckInterval = setInterval(() => {
      checkConnection();
    }, BLUETOOTH_CONFIG.CONNECTION_CHECK_INTERVAL);

    // Cleanup interval on unmount
    return () => {
      clearInterval(connectionCheckInterval);
    };
  }, [connected, macAddress]);

  return {
    loading,
    connected,
    serviceUUID,
    characteristicUUID,
    connectPrinter,
    checkConnection,
    reconnectAttempts,
    lastConnectionCheck,
  };
};

export default useBluetoothManager;
