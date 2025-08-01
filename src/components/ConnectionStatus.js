import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from 'react-native';
import { RefreshSvg } from '../../assets/Svg';
import { COLORS, SPACING, UI_CONFIG } from '../constants/Constants';

const ConnectionStatus = ({
  connected,
  loading,
  onRefresh,
  reconnectAttempts = 0,
  lastConnectionCheck,
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  const getStatusText = () => {
    if (loading) return 'Միանում է...';
    if (connected) return 'Միացված է';
    if (reconnectAttempts > 0)
      return `Վերամիանում է... (${reconnectAttempts}/3)`;
    return 'Անջատված է';
  };

  const getLastCheckText = () => {
    if (!lastConnectionCheck) return '';
    const now = Date.now();
    const diffSeconds = Math.floor((now - lastConnectionCheck) / 1000);
    return `Վերջին ստուգում: ${diffSeconds}վ առաջ`;
  };

  return (
    <TouchableOpacity
      style={styles.isConnected}
      onPress={() => setShowDetails(!showDetails)}
      onLongPress={onRefresh}
    >
      <View style={styles.statusContainer}>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <RefreshSvg />
        </TouchableOpacity>
        {!loading ? (
          <View
            style={[
              connected ? styles.connected : styles.disconnect,
              styles.circle,
              reconnectAttempts > 0 && styles.reconnecting,
            ]}
          />
        ) : (
          <ActivityIndicator color={COLORS.PRIMARY} size="small" />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  isConnected: {
    position: 'absolute',
    top: 70,
    right: SPACING.LG,
    gap: SPACING.SM,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.XS,
  },
  statusDetails: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: SPACING.XS,
    padding: SPACING.XS,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    minWidth: 120,
  },
  statusText: {
    color: COLORS.WHITE,
    fontSize: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  checkText: {
    color: COLORS.PRIMARY,
    fontSize: 8,
    textAlign: 'center',
  },
  refreshButton: {
    padding: SPACING.XS,
  },
  circle: {
    width: UI_CONFIG.DIMENSIONS.CONNECTION_INDICATOR_SIZE,
    height: UI_CONFIG.DIMENSIONS.CONNECTION_INDICATOR_SIZE,
    borderRadius: UI_CONFIG.DIMENSIONS.CONNECTION_INDICATOR_SIZE,
  },
  connected: {
    backgroundColor: COLORS.SUCCESS,
  },
  disconnect: {
    backgroundColor: COLORS.ERROR,
  },
  reconnecting: {
    backgroundColor: COLORS.PRIMARY,
  },
});

export default ConnectionStatus;
