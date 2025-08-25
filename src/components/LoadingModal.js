import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../constants/Constants';

const LoadingModal = ({ visible, message = 'Բեռնում...' }) => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    let timer;
    
    if (visible) {
      setShouldShow(true);
    } else {
      // Keep modal visible for minimum time to avoid flashing
      timer = setTimeout(() => {
        setShouldShow(false);
      }, 800);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [visible]);

  return (
    <Modal
      visible={shouldShow}
      animationType="fade"
      transparent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.MODAL_OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 12,
    padding: SPACING.XL,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.PRIMARY + '50',
    minWidth: 200,
  },
  loadingText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MEDIUM,
    marginTop: SPACING.MD,
    textAlign: 'center',
  },
});

export default LoadingModal;