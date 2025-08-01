import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Input } from './Input';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { Button } from './Button';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  PRINTING_CONFIG,
  DEFAULTS,
  APP_CONFIG,
} from '../constants/Constants';

const UserModal = ({
  modalVisible,
  setModalVisible,
  userData,
  engineerName,
  onPrintImage,
  setPreviewImage,
}) => {
  const dataViewRef = useRef(null);
  const [uri, setUri] = useState('');
  const [price, setPrice] = useState('');
  const capturePreviewImage = async () => {
    try {
      if (!dataViewRef.current) {
        console.log('Data view ref not ready');
        return;
      }

      const imageUri = await captureRef(dataViewRef.current, {
        format: PRINTING_CONFIG.IMAGE.FORMAT,
        quality: PRINTING_CONFIG.IMAGE.QUALITY,
        result: 'base64',
        width: PRINTING_CONFIG.IMAGE.WIDTH,
        height: undefined,
      });
      setUri(imageUri);
      onPrintImage(imageUri);
      console.log('Image captured as base64');
      setPreviewImage(`data:image/png;base64,${imageUri}`);
    } catch (error) {
      console.error(
        'Error capturing preview image or converting to ESC/POS:',
        error,
      );
    }
  };

  return (
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
            onPress={() => {
              setModalVisible(false);
            }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.modalTitle}>User Data</Text>

          <ScrollView style={styles.dataScrollView}>
            <ViewShot
              ref={dataViewRef}
              style={[styles.dataBox, styles.printableArea]}
            >
              <Text style={styles.printableText}>{DEFAULTS.COMPANY_NAME}</Text>
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
                    Վճարման օր: {userData.expectedPaymentDay}{' '}
                    {DEFAULTS.ARMENIAN_MONTHS[new Date().getMonth()]}
                  </Text>
                  <Text style={styles.printableText}>
                    Գումար: {userData.expectedPaymentAmount}
                  </Text>
                  <Text style={styles.printableText}>
                    Հեռ.: {userData.mobilePhoneNumber}
                  </Text>
                  <Text style={styles.printableText}>
                    Ամսաթիվ: {new Date().toLocaleDateString('hy-AM')}
                  </Text>
                  <Text style={styles.printableText}>
                    Վճարված Գումար: {price}
                  </Text>
                  <Text style={styles.printableText}></Text>
                  <Text style={styles.printableText}></Text>
                </View>
              )}
            </ViewShot>
          </ScrollView>

          <View style={styles.priceInputWrapper}>
            <Input
              value={price}
              type="numeric"
              onChange={setPrice}
              placeholder="Enter price"
            />
          </View>

          <View style={styles.modalButtonWrapper}>
            <Button
              text="📸 Print"
              disabled={!price.trim()}
              onPress={async () => {
                await capturePreviewImage();
                setUri('');
                setPrice('');
                setModalVisible(false);
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.MODAL_OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: SPACING.LG,
    padding: SPACING.LG,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  closeButton: {
    position: 'absolute',
    right: SPACING.SM,
    top: SPACING.SM,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.PRIMARY,
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
  },
  modalTitle: {
    color: COLORS.PRIMARY,
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  dataScrollView: {
    maxHeight: 300,
    marginBottom: SPACING.LG,
  },
  dataBox: {
    gap: SPACING.SM / 2,
  },
  printableArea: {
    backgroundColor: COLORS.WHITE,
    padding: SPACING.MD,
    borderRadius: SPACING.SM / 2,
    margin: SPACING.XS,
  },
  printableText: {
    color: COLORS.BLACK,
    fontSize: FONT_SIZES.LARGE,
    lineHeight: SPACING.LG,
  },
  priceInputWrapper: {
    marginBottom: SPACING.SM,
  },
  modalButtonWrapper: {
    marginTop: SPACING.SM,
  },
});

export default UserModal;
