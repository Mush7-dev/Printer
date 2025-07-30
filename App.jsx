import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import { Buffer } from 'buffer';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { Button } from './src/components/Button';
import { Input } from './src/components/Input';
import { RefreshSvg } from './assets/Svg';
import EscPosConverter from './src/modules/EscPosConverter';

function App() {
  const [mobileNumber, setMobileNumber] = useState('091551044');
  const [id, setId] = useState('');
  const [engineerName, setEngineerName] = useState('');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [connected, setConnected] = useState(false);
  const [serviceUUID, setServiceUUID] = useState(null);
  const [characteristicUUID, setCharacteristicUUID] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const dataViewRef = useRef(null);
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

  const printImageFromServer = async () => {
    if (!connected || !serviceUUID || !characteristicUUID) {
      Alert.alert('Printer not ready or not connected');
      return;
    }

    try {
      setDataLoading(true);
      const testImageBase64 = previewImage;
      const result = await EscPosConverter.convertImageToEscPos(
        `data:image/png;base64,${testImageBase64}`,
        384,
      );

      if (!result.success) {
        throw new Error('ESC/POS conversion failed');
      }

      const escposBuffer = Buffer.from(result.escposData, 'base64');

      const chunkSize = 20;
      for (let i = 0; i < escposBuffer.length; i += chunkSize) {
        const chunk = escposBuffer.slice(i, i + chunkSize);
        await BleManager.writeWithoutResponse(
          MAC_ADDRESS,
          serviceUUID,
          characteristicUUID,
          Array.from(chunk),
        );
      }
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', `Failed to print: ${error.message}`);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchUserData = async () => {
    if (!mobileNumber) {
      Alert.alert('Error', 'Please enter mobile number');
      return;
    }

    try {
      setDataLoading(true);
      const response = await fetch(
        `https://dapi.intbilling.org/api/users?mNumber=${mobileNumber}&customerId=${id}&token=${API_TOKEN}`,
      );
      const data = await response.json();

      if (response.ok) {
        setId('');
        setUserData(data);
        setModalVisible(true);

        await new Promise(resolve => setTimeout(resolve, 1000));
        capturePreviewImage();
      } else {
        Alert.alert('Error', 'Failed to fetch user data');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setDataLoading(false);
    }
  };

  const capturePreviewImage = async () => {
    try {
      if (!dataViewRef.current) {
        console.log('Data view ref not ready');
        return;
      }

      const imageUri = await captureRef(dataViewRef.current, {
        format: 'png',
        quality: 0.1,
        result: 'base64',
        width: 384,
        height: undefined,
      });

      console.log('Image captured as base64');
      setPreviewImage(`data:image/png;base64,${imageUri}`);
    } catch (error) {
      console.error(
        'Error capturing preview image or converting to ESC/POS:',
        error,
      );
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="transparent"
        translucent
        barStyle="light-content"
      />
      <View style={styles.isConnected}>
        <TouchableOpacity onPress={connectPrinter}>
          <RefreshSvg />
        </TouchableOpacity>
        {!loading ? (
          <View
            style={[
              connected ? styles.connected : styles.disconnect,
              styles.circle,
            ]}
          />
        ) : (
          <ActivityIndicator />
        )}
      </View>
      <View style={styles.box}>
        <View>
          <Text style={styles.title}>Fnet</Text>
          <Text style={styles.description}>Telecom</Text>
        </View>
        <View style={styles.dataBox}>
          <Input
            value={mobileNumber}
            type="numeric"
            onChange={setMobileNumber}
            placeholder="Enter mobile number"
          />
          <Input
            value={id}
            type="numeric"
            onChange={setId}
            placeholder="Enter user id"
          />
          <Input
            value={engineerName}
            type="default"
            onChange={setEngineerName}
            placeholder="Enter engineer name"
          />
        </View>
      </View>
      <View style={styles.buttonWrapper}>
        <Button
          text={'Fetch Data'}
          onPress={fetchUserData}
          loading={dataLoading}
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
              <ViewShot
                ref={dataViewRef}
                style={[styles.dataBox, styles.printableArea]}
              >
                <Text style={styles.printableText}>FNET Telecom</Text>
                <Text style={styles.printableText}>Գանձող: {engineerName}</Text>
                {userData && (
                  <View style={{ gap: 20 }}>
                    <Text style={[styles.printableText, { lineHeight: 24 }]}>
                      Անուն, ազգանուն: {userData.fullName}
                    </Text>
                    <Text style={styles.printableText}>
                      հասցե: {userData.address}
                    </Text>
                    <Text style={styles.printableText}>
                      Վճարման օր: {userData.expectedPaymentDay}
                    </Text>
                    <Text style={styles.printableText}>
                      Գումար: {userData.expectedPaymentAmount}
                    </Text>
                    <Text style={styles.printableText}>
                      Հեռախոսահամար: {userData.mobilePhoneNumber}
                    </Text>
                  </View>
                )}
                <Text style={styles.printableText}> </Text>
                <Text style={styles.printableText}>Ամսաթիվ:</Text>
                <Text style={styles.printableText}>______________________</Text>
                <Text style={styles.printableText}> </Text>
                <Text style={styles.printableText}>Գումար:</Text>
                <Text style={styles.printableText}>______________________</Text>
                <Text style={styles.printableText}> </Text>
              </ViewShot>
            </ScrollView>

            <View style={styles.modalButtonWrapper}>
              <Button
                text="Print Data"
                onPress={() => {
                  printImageFromServer();
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
  printableArea: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    margin: 5,
  },
  printableText: {
    color: '#000000',
    fontSize: 18, // Reduced from 18 to 14 for faster rendering and smaller image
    lineHeight: 20, // Reduced from 20 to 16 for tighter spacing
  },
  previewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewModalContent: {
    backgroundColor: '#344955',
    borderRadius: 20,
    padding: 20,
    width: '95%',
    maxHeight: '90%',
    borderWidth: 2,
    borderColor: '#F9AA33',
  },
  previewTitle: {
    color: '#F9AA33',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  previewScrollView: {
    flex: 1,
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 10,
  },
  previewInfo: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  previewButtonWrapper: {
    marginTop: 10,
  },
  isConnected: {
    position: 'absolute',
    top: 70,
    right: 20,
    gap: 10,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  circle: {
    width: 10,
    height: 10,
    borderRadius: 10,
  },
  connected: {
    backgroundColor: '#47ff82',
  },
  disconnect: {
    backgroundColor: '#ff0512',
  },
});

export default App;
