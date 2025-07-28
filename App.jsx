import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  SafeAreaView,
  PermissionsAndroid,
  Platform,
  StatusBar,
  Text,
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import { Buffer } from 'buffer';
import { Button } from './src/components/Button';
import { Input } from './src/components/Input';

function App() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [serviceUUID, setServiceUUID] = useState(null);
  const [characteristicUUID, setCharacteristicUUID] = useState(null);
  const MAC_ADDRESS = '66:22:32:D6:D1:FB';

  const connectPrinter = async () => {
    try {
      setLoading(true);

      await BleManager.connect(MAC_ADDRESS);
      const info = await BleManager.retrieveServices(MAC_ADDRESS);

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
      const buffer = Buffer.from(inputText + '\n\n\n\n', 'utf-8');
      await BleManager.writeWithoutResponse(
        MAC_ADDRESS,
        serviceUUID,
        characteristicUUID,
        buffer.toJSON().data,
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Print Failed', err.message);
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
          // You can check each permission result here
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
    return () => {};
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="transparent"
        translucent
        barStyle="light-content"
      />
      <View style={styles.box}>
        <View>
          <Text style={styles.title}>Fnet</Text>
          <Text style={styles.description}>Telecom</Text>
        </View>
        <Input value={inputText} onChange={setInputText} />
      </View>
      <View style={styles.buttonWrapper}>
        <Button text="Print" onPress={printText} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    gap: 40,
    paddingHorizontal: 20,
    backgroundColor: '#344955',
    justifyContent: 'center',
  },
  buttonWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#F9AA33',
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 35,
  },
  description: {
    color: '#F9AA33',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 10,
  },
  box: {
    marginBottom: 80,
    gap: 40,
  },
});

export default App;
