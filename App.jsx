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
  Image,
} from 'react-native';
import BleManager from 'react-native-ble-manager';
import { Buffer } from 'buffer';
import ViewShot, { captureRef } from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import { Button } from './src/components/Button';
import { Input } from './src/components/Input';
import { RefreshSvg } from './assets/Svg';

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
  const [showPreview, setShowPreview] = useState(false);
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
    console.log('=== Print Image from Server ===');
    if (!connected || !serviceUUID || !characteristicUUID) {
      Alert.alert('Printer not ready or not connected');
      return;
    }

    try {
      setDataLoading(true);

      // Send request to your server to convert aa.png to ESC/POS
      console.log('Requesting ESC/POS conversion from your server...');
      const response = await fetch('http://10.100.8.30:3001/convert-aa-png');

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Get the ESC/POS data as binary
      const escposData = await response.arrayBuffer();
      const escposBuffer = new Uint8Array(escposData);

      console.log(
        'Received ESC/POS data from your server, size:',
        escposBuffer.length,
        'bytes',
      );
      console.log('First 10 bytes:', Array.from(escposBuffer.slice(0, 10)));

      // Send to printer in one write
      console.log('Sending to printer...');
      await BleManager.writeWithoutResponse(
        MAC_ADDRESS,
        serviceUUID,
        characteristicUUID,
        Array.from(escposBuffer),
      );

      console.log('Print job sent successfully');
      Alert.alert('Success', 'aa.png image printed successfully');
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

        const escposBuffer = await capturePreviewImage();
        if (escposBuffer) {
          await printImageData(escposBuffer);
        }
        // await convertDataToImageAndPrint(data);
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
        quality: 1,
        result: 'base64',
        width: 384,
        height: undefined,
      });

      console.log('Image captured:', imageUri);
      setPreviewImage(imageUri);
      setShowPreview(true);

      const fileName = `armenian_print_preview_${Date.now()}.png`;
      const destPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      await RNFS.copyFile(imageUri, destPath);
      console.log('Armenian preview saved to:', destPath);

      // Send base64 image to server and get ESC/POS data
      const base64Image = `data:image/png;base64,${imageUri}`;

      const response = await fetch(
        'http://10.100.8.30:3001/convert-to-escpos',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            base64Image: 'gf',
            width: 384,
          }),
        },
      );

      const result = 'fd';
      console.log(result);
      if (result.success) {
        console.log('ESC/POS conversion successful:', result);
        console.log('ESC/POS data:', result.escposData);
        console.log('Image info:', result.imageInfo);

        // You can now use result.escposData for printing
        // The ESC/POS data is base64 encoded, decode it when sending to printer
        // const escposBuffer = Buffer.from(result.escposData, 'base64');
        // console.log('ESC/POS buffer ready for printing:', escposBuffer);

        // return escposBuffer;
      } else {
        console.error('ESC/POS conversion failed:', result.error);
      }
    } catch (error) {
      console.error(
        'Error capturing preview image or converting to ESC/POS:',
        error,
      );
    }
  };

  const printImageData = async escposBuffer => {
    if (!connected || !serviceUUID || !characteristicUUID) {
      Alert.alert('Printer not ready or not connected');
      return;
    }

    try {
      console.log('Printing image data to thermal printer...');

      const chunkSize = 20;
      for (let i = 0; i < escposBuffer.length; i += chunkSize) {
        const chunk = escposBuffer.slice(i, i + chunkSize);
        await BleManager.writeWithoutResponse(
          MAC_ADDRESS,
          serviceUUID,
          characteristicUUID,
          Array.from(chunk),
        );
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log('Image printed successfully');
    } catch (error) {
      console.error('Error printing image data:', error);
      Alert.alert('Error', 'Failed to print image');
    }
  };

  const convertDataToImageAndPrint = async data => {
    if (!connected || !serviceUUID || !characteristicUUID) {
      Alert.alert('Printer not ready or not connected');
      return;
    }

    try {
      const printText = formatUserDataForPrint(data);

      const ESC = 0x1b;
      const GS = 0x1d;
      const commands = [];

      commands.push(ESC, 0x40);
      commands.push(ESC, 0x61, 0x01);
      commands.push(ESC, 0x21, 0x10);
      commands.push(GS, 0x21, 0x11);

      const textBuffer = Buffer.from(printText, 'utf-8');
      const fullData = Buffer.concat([
        Buffer.from(commands),
        textBuffer,
        Buffer.from('\n\n\n\n', 'utf-8'),
      ]);

      const chunkSize = 20;
      for (let i = 0; i < fullData.length; i += chunkSize) {
        const chunk = fullData.slice(i, i + chunkSize);
        await BleManager.writeWithoutResponse(
          MAC_ADDRESS,
          serviceUUID,
          characteristicUUID,
          chunk.toJSON().data,
        );
        console.log(chunk.toJSON().data);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      Alert.alert('Success', 'Data printed successfully');
    } catch (error) {
      console.error('Error printing data:', error);
      Alert.alert('Error', 'Failed to print data');
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

      const ESC = 0x1b;
      const GS = 0x1d;
      const commands = [];

      commands.push(ESC, 0x40);

      commands.push(ESC, 0x74, 0x00);
      commands.push(GS, 0x28, 0x43, 0x02, 0x00, 0x30, 0x02);

      const textBuffer = Buffer.from(printText, 'utf-8');

      const fullData = Buffer.concat([
        Buffer.from(commands),
        textBuffer,
        Buffer.from('\n\n\n\n', 'utf-8'),
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
    ա: 'a',
    բ: 'b',
    գ: 'g',
    դ: 'd',
    ե: 'e',
    զ: 'z',
    է: 'e',
    ը: 'y',
    թ: 't',
    ժ: 'zh',
    ի: 'i',
    լ: 'l',
    խ: 'kh',
    ծ: 'ts',
    կ: 'k',
    հ: 'h',
    ձ: 'dz',
    ղ: 'gh',
    ճ: 'ch',
    մ: 'm',
    յ: 'y',
    ն: 'n',
    շ: 'sh',
    ո: 'o',
    չ: 'ch',
    պ: 'p',
    ջ: 'j',
    ռ: 'r',
    ս: 's',
    վ: 'v',
    տ: 't',
    ր: 'r',
    ց: 'ts',
    ու: 'u',
    փ: 'p',
    ք: 'k',
    և: 'ev',
    օ: 'o',
    ֆ: 'f',
    Ա: 'A',
    Բ: 'B',
    Գ: 'G',
    Դ: 'D',
    Ե: 'E',
    Զ: 'Z',
    Է: 'E',
    Ը: 'Y',
    Թ: 'T',
    Ժ: 'Zh',
    Ի: 'I',
    Լ: 'L',
    Խ: 'Kh',
    Ծ: 'Ts',
    Կ: 'K',
    Հ: 'H',
    Ձ: 'Dz',
    Ղ: 'Gh',
    Ճ: 'Ch',
    Մ: 'M',
    Յ: 'Y',
    Ն: 'N',
    Շ: 'Sh',
    Ո: 'O',
    Չ: 'Ch',
    Պ: 'P',
    Ջ: 'J',
    Ռ: 'R',
    Ս: 'S',
    Վ: 'V',
    Տ: 'T',
    Ր: 'R',
    Ց: 'Ts',
    Ու: 'U',
    Փ: 'P',
    Ք: 'K',
    Օ: 'O',
    Ֆ: 'F',
  };

  const transliterateArmenian = text => {
    return text
      .split('')
      .map(char => armenianToLatin[char] || char)
      .join('');
  };

  const camelCaseToReadable = key => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const formatUserDataForPrint = data => {
    let printText = 'ֆտսաֆ INFORMATION\n';
    printText += '==================\n';
    printText += `Mobile: ${mobileNumber}\n`;
    if (engineerName) {
      printText += `Engineer: ${engineerName}\n`;
    }
    printText += '\n';

    Object.entries(data).forEach(([key, value]) => {
      const readableKey = camelCaseToReadable(key);
      if (typeof value === 'object') {
        printText += `${readableKey}: ${JSON.stringify(value)}\n`;
      } else {
        printText += `${readableKey}: ${value}\n`;
      }
    });

    printText += '\n';
    printText += 'Notes:\n';
    printText += 'Date: ______________________\n';
    printText += '\n';
    printText += 'Price: _____________________\n';

    return printText;
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
        <Button
          text={'Print Image'}
          onPress={printImageFromServer}
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
                <Text style={styles.printableText}>ֆտսաֆ INFORMATION</Text>
                <Text style={styles.printableText}>==================</Text>
                <Text style={styles.printableText}>Mobile: {mobileNumber}</Text>
                {engineerName && (
                  <Text style={styles.printableText}>
                    Engineer: {engineerName}
                  </Text>
                )}
                {userData &&
                  Object.entries(userData).map(([key, value]) => (
                    <Text key={key} style={styles.printableText}>
                      {key}:{' '}
                      {typeof value === 'object'
                        ? JSON.stringify(value)
                        : value}
                    </Text>
                  ))}
                <Text style={styles.printableText}> </Text>
                <Text style={styles.printableText}>Notes:</Text>
                <Text style={styles.printableText}>
                  Date: ______________________
                </Text>
                <Text style={styles.printableText}> </Text>
                <Text style={styles.printableText}>
                  Price: _____________________
                </Text>
              </ViewShot>
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

      <Modal
        animationType="fade"
        transparent={true}
        visible={showPreview}
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.previewModalOverlay}>
          <View style={styles.previewModalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPreview(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.previewTitle}>Armenian Print Preview</Text>
            {previewImage && (
              <View style={styles.previewScrollView}>
                <Image
                  source={{ uri: `file://${previewImage}` }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
                <Text style={styles.previewInfo}>
                  This shows exactly what will be printed in Armenian on thermal
                  paper (384px width)
                </Text>
              </View>
            )}

            <View style={styles.previewButtonWrapper}>
              <Button
                text="Close Preview"
                onPress={() => setShowPreview(false)}
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
    fontSize: 14,
    lineHeight: 20,
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
