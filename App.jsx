import React, { useState } from 'react';
import { StyleSheet, Alert, SafeAreaView, StatusBar } from 'react-native';
import useBluetoothManager from './src/components/BluetoothManager';
import usePrintingService from './src/components/PrintingService';
import ConnectionStatus from './src/components/ConnectionStatus';
import MainForm from './src/components/MainForm';
import UserModal from './src/components/UserModal';
import {
  MAC_ADDRESS,
  API_TOKEN,
  API_CONFIG,
  ERRORS,
  COLORS,
  SPACING,
} from './src/constants/Constants';

function App() {
  // State management with default values from constants
  const [mobileNumber, setMobileNumber] = useState('');
  const [id, setId] = useState('');
  const [engineerName, setEngineerName] = useState('Musho Poghosyan');
  const [userData, setUserData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const {
    loading,
    connected,
    serviceUUID,
    characteristicUUID,
    connectPrinter,
    reconnectAttempts,
    lastConnectionCheck,
  } = useBluetoothManager(MAC_ADDRESS);
  const { printImage, printTextFast } = usePrintingService(
    MAC_ADDRESS,
    serviceUUID,
    characteristicUUID,
    connected,
  );

  // API call to fetch user data using constants
  const fetchUserData = async () => {
    if (!mobileNumber) {
      Alert.alert('Error', ERRORS.API.MISSING_MOBILE);
      return;
    }

    try {
      setDataLoading(true);
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS}?mNumber=${mobileNumber}&customerId=${id}&token=${API_TOKEN}`,
      );
      const data = await response.json();

      if (response.ok) {
        setId('');
        setUserData(data);
        setModalVisible(true);
      } else {
        Alert.alert('Error', ERRORS.API.FETCH_FAILED);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', ERRORS.API.NETWORK_ERROR);
    } finally {
      setDataLoading(false);
    }
  };

  // Print handlers
  const handlePrintImage = previewImage =>
    printImage(previewImage, setDataLoading);
  const handlePrintTextFast = () =>
    printTextFast(userData, engineerName, setDataLoading);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="transparent"
        translucent
        barStyle="light-content"
      />

      <ConnectionStatus
        connected={connected}
        loading={loading}
        onRefresh={connectPrinter}
        reconnectAttempts={reconnectAttempts}
        lastConnectionCheck={lastConnectionCheck}
      />

      <MainForm
        mobileNumber={mobileNumber}
        setMobileNumber={setMobileNumber}
        id={id}
        setId={setId}
        engineerName={engineerName}
        setEngineerName={setEngineerName}
        onFetchData={fetchUserData}
        dataLoading={dataLoading}
      />

      <UserModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        userData={userData}
        engineerName={engineerName}
        mobileNumber={mobileNumber}
        onPrintImage={handlePrintImage}
        onPrintTextFast={handlePrintTextFast}
        setPreviewImage={setPreviewImage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SPACING.XL * 2,
    paddingHorizontal: SPACING.LG,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
  },
});

export default App;
