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
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import { Buffer } from 'buffer';
import { Button } from './src/components/Button';
import { Input } from './src/components/Input';

function App() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [connected, setConnected] = useState(false);
  const [serviceUUID, setServiceUUID] = useState(null);
  const [characteristicUUID, setCharacteristicUUID] = useState(null);
  const MAC_ADDRESS = '66:22:32:D6:D1:FB';
  const API_TOKEN =
    '9F7C1B92D8A44F4BB9E6BDE21A7F68A1C3D4EAB8F9F60D3A82B4C78E7F23C9AB';

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

  const fetchUserData = async () => {
    if (!mobileNumber) {
      Alert.alert('Error', 'Please enter mobile number');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `https://dapi.intbilling.org/api/users?mNumber=${mobileNumber}&token=${API_TOKEN}`,
      );
      const data = await response.json();

      if (response.ok) {
        setUserData(data);
        setModalVisible(true);
      } else {
        Alert.alert('Error', 'Failed to fetch user data');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const printUserData = async () => {
    if (!connected || !serviceUUID || !characteristicUUID) {
      Alert.alert('Printer not ready or not connected');
      return;
    }

    if (!userData) {
      Alert.alert('Error', 'No user data to print');
      return;
    }

    try {
      const printText = formatUserDataForPrint(userData);
      
      // ESC/POS commands
      const ESC = 0x1B;
      const GS = 0x1D;
      const commands = [];
      
      // Initialize printer
      commands.push(ESC, 0x40); // ESC @ - Initialize printer
      
      // Enable UTF-8 encoding mode
      commands.push(ESC, 0x74, 0x00); // ESC t 0 - Select character code table (PC437)
      commands.push(GS, 0x28, 0x43, 0x02, 0x00, 0x30, 0x02); // GS ( C - Select UTF-8 encoding
      
      // Convert text to UTF-8 buffer
      const textBuffer = Buffer.from(printText, 'utf-8');
      
      // Combine commands with text
      const fullData = Buffer.concat([
        Buffer.from(commands),
        textBuffer,
        Buffer.from('\n\n\n\n', 'utf-8')
      ]);
      
      await BleManager.writeWithoutResponse(
        MAC_ADDRESS,
        serviceUUID,
        characteristicUUID,
        fullData.toJSON().data,
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Print Failed', err.message);
    }
  };

  // Armenian to Latin transliteration map
  const armenianToLatin = {
    'ա': 'a', 'բ': 'b', 'գ': 'g', 'դ': 'd', 'ե': 'e', 'զ': 'z',
    'է': 'e', 'ը': 'y', 'թ': 't', 'ժ': 'zh', 'ի': 'i', 'լ': 'l',
    'խ': 'kh', 'ծ': 'ts', 'կ': 'k', 'հ': 'h', 'ձ': 'dz', 'ղ': 'gh',
    'ճ': 'ch', 'մ': 'm', 'յ': 'y', 'ն': 'n', 'շ': 'sh', 'ո': 'o',
    'չ': 'ch', 'պ': 'p', 'ջ': 'j', 'ռ': 'r', 'ս': 's', 'վ': 'v',
    'տ': 't', 'ր': 'r', 'ց': 'ts', 'ու': 'u', 'փ': 'p', 'ք': 'k',
    'և': 'ev', 'օ': 'o', 'ֆ': 'f',
    'Ա': 'A', 'Բ': 'B', 'Գ': 'G', 'Դ': 'D', 'Ե': 'E', 'Զ': 'Z',
    'Է': 'E', 'Ը': 'Y', 'Թ': 'T', 'Ժ': 'Zh', 'Ի': 'I', 'Լ': 'L',
    'Խ': 'Kh', 'Ծ': 'Ts', 'Կ': 'K', 'Հ': 'H', 'Ձ': 'Dz', 'Ղ': 'Gh',
    'Ճ': 'Ch', 'Մ': 'M', 'Յ': 'Y', 'Ն': 'N', 'Շ': 'Sh', 'Ո': 'O',
    'Չ': 'Ch', 'Պ': 'P', 'Ջ': 'J', 'Ռ': 'R', 'Ս': 'S', 'Վ': 'V',
    'Տ': 'T', 'Ր': 'R', 'Ց': 'Ts', 'Ու': 'U', 'Փ': 'P', 'Ք': 'K',
    'Օ': 'O', 'Ֆ': 'F'
  };

  const transliterateArmenian = (text) => {
    return text.split('').map(char => armenianToLatin[char] || char).join('');
  };

  const formatUserDataForPrint = data => {
    let printText = 'USER INFORMATION\n';
    printText += '==================\n';
    printText += `Mobile: ${mobileNumber}\n`;
    printText += '\n';

    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object') {
        printText += `${key}: ${JSON.stringify(value)}\n`;
      } else {
        printText += `${key}: ${value}\n`;
      }
    });

    // Transliterate Armenian characters to Latin for printing
    return transliterateArmenian(printText);
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
        <Input
          value={mobileNumber}
          type="numeric"
          onChange={setMobileNumber}
          placeholder="Enter mobile number"
        />
      </View>
      <View style={styles.buttonWrapper}>
        <Button
          text={loading ? 'Loading...' : 'Fetch Data'}
          onPress={fetchUserData}
          disabled={loading}
        />
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>User Data</Text>

            <ScrollView style={styles.dataScrollView}>
              <View style={styles.dataBox}>
                <Text style={styles.dataText}>Mobile: {mobileNumber}</Text>
                {userData &&
                  Object.entries(userData).map(([key, value]) => (
                    <Text key={key} style={styles.dataText}>
                      {key}:{' '}
                      {typeof value === 'object'
                        ? JSON.stringify(value)
                        : value}
                    </Text>
                  ))}
              </View>
            </ScrollView>

            <View style={styles.modalButtonWrapper}>
              <Button
                text="Print Data"
                onPress={() => {
                  printUserData();
                  setModalVisible(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#344955',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: '#F9AA33',
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#F9AA33',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalTitle: {
    color: '#F9AA33',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  dataScrollView: {
    maxHeight: 300,
    marginBottom: 20,
  },
  dataBox: {
    gap: 8,
  },
  dataText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  modalButtonWrapper: {
    marginTop: 10,
  },
});

export default App;
