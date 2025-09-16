import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  View,
  Text,
} from 'react-native';
import useBluetoothManager from './src/components/BluetoothManager';
import usePrintingService from './src/components/PrintingService';
import ConnectionStatus from './src/components/ConnectionStatus';
import LocationSelector from './src/components/LocationSelector';
import UsersList from './src/components/UsersList';
import NewUserModal from './src/components/NewUserModal';
import {
  MAC_ADDRESS,
  ERRORS,
  COLORS,
  SPACING,
  SUCCESS_MESSAGES,
} from './src/constants/Constants';

function App() {
  // State management
  const [users, setUsers] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({
    district: '',
    area: '',
    street: '',
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUsersList, setShowUsersList] = useState(false);
  const locationSelectorRef = useRef(null);

  const {
    loading,
    connected,
    serviceUUID,
    characteristicUUID,
    connectPrinter,
    reconnectAttempts,
    lastConnectionCheck,
  } = useBluetoothManager(MAC_ADDRESS);

  const { printMultipleUsers, printImage, abortPrint } = usePrintingService(
    MAC_ADDRESS,
    serviceUUID,
    characteristicUUID,
    connected,
  );

  // Handle users loaded from LocationSelector
  const handleUsersLoaded = loadedUsers => {
    if (loadedUsers.length === 1) {
      // Single user - show modal
      setSelectedUser(loadedUsers[0]);
      setModalVisible(true);
      setUsers([]);
      setShowUsersList(false);
    } else {
      // Multiple users - show list modal
      setUsers(loadedUsers);
      setSelectedUser(null);
      setModalVisible(false);
      setShowUsersList(true);
    }
  };

  // Handle location change
  const handleLocationChange = location => {
    setCurrentLocation(location);
    if (!location.street) {
      // Clear users if street is not selected
      setUsers([]);
      setShowUsersList(false);
    }
  };

  // Handle printing single user image from modal
  const handlePrintImage = async imageBase64 => {
    if (!connected) {
      Alert.alert('Error', ERRORS.BLUETOOTH.NOT_CONNECTED);
      return;
    }

    try {
      setDataLoading(true);
      await printImage(imageBase64, setDataLoading);
      // Alert.alert('Success', SUCCESS_MESSAGES.PRINT_SUCCESS);
      // setModalVisible(false);
      // setSelectedUser(null);
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', ERRORS.PRINTING.PRINT_FAILED);
    } finally {
      setDataLoading(false);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedUser(null);
    if (locationSelectorRef.current) {
      locationSelectorRef.current.clearMobileInput();
    }
  };

  // Handle users list close
  const handleUsersListClose = () => {
    setShowUsersList(false);
    setUsers([]);
    if (locationSelectorRef.current) {
      locationSelectorRef.current.clearMobileInput();
    }
  };

  // Handle stop printing
  const handleStopPrinting = () => {
    if (abortPrint) {
      abortPrint();
    }
    setDataLoading(false);
  };

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

      {/* <View style={styles.header}>
        <Text style={styles.title}>Fnet</Text>
        <Text style={styles.subtitle}>Telecom</Text>
      </View> */}

      <LocationSelector
        ref={locationSelectorRef}
        onUsersLoaded={handleUsersLoaded}
        onLocationChange={handleLocationChange}
      />

      {showUsersList && (
        <UsersList
          users={users}
          onPrintImage={handlePrintImage}
          loading={dataLoading}
          onClose={handleUsersListClose}
          onStopPrinting={handleStopPrinting}
        />
      )}

      <NewUserModal
        visible={modalVisible}
        user={selectedUser}
        onClose={handleModalClose}
        onPrintImage={handlePrintImage}
        loading={dataLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SPACING.XL * 2,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.MD,
  },
  title: {
    color: COLORS.PRIMARY,
    fontSize: 35,
    fontWeight: '900',
  },
  subtitle: {
    color: COLORS.PRIMARY,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default App;
