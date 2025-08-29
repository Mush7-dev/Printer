import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  PRINTING_CONFIG,
  DEFAULTS,
} from '../constants/Constants';
import { Button } from './Button';

const NewUserModal = ({ visible, user, onClose, onPrintImage, loading }) => {
  const [price, setPrice] = useState('');
  const dataViewRef = useRef(null);

  useEffect(() => {
    if (user) {
      setPrice('');
    }
  }, [user]);

  const captureAndPrint = async () => {
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

      console.log('Image captured as base64');
      onPrintImage(imageUri);
    } catch (error) {
      console.error('Error capturing preview image:', error);
    }
  };

  if (!user) return null;

  const displayName =
    user.name || user.customerName || user.fullName || 'Անանուն օգտատեր';
  const displayId = user.customerId || user.id || '';
  const displayPhone =
    user.mNumber || user.phoneNumber || user.mobilePhoneNumber || '';
  const displayAddress =
    user.address ||
    `${user.streetName || ''} ${user.building || ''} ${
      user.apartment || ''
    }`.trim();
  console.log(user);
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Օգտատերի տվյալներ</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Printable Content */}
            <ViewShot ref={dataViewRef} style={styles.printableArea}>
              <View style={styles.printContent}>
                <Image
                  source={require('../../assets/fnet.jpg')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
                <Text style={styles.printableText}>Գանձող: Գևորգ Ղազարյան</Text>
                {/* <Text style={styles.printableText}>
                  Անուն, ազգանուն: {displayName}
                </Text> */}
                <Text style={styles.printableText}>
                  հասցե: {displayAddress}
                </Text>
                <Text style={styles.printableText}>
                  Վճարման օր: {user.expectedPaymentDay}{' '}
                  {DEFAULTS.ARMENIAN_MONTHS[new Date().getMonth()]}
                </Text>
                {/* <Text style={styles.printableText}>
                  Գումար: {user.expectedPaymentAmount}
                </Text> */}
                <Text style={styles.printableText}>Հեռ.: {displayPhone}</Text>
                <Text style={styles.printableText}>
                  Ամսաթիվ: {new Date().toLocaleDateString('hy-AM')}
                </Text>
                <Text style={styles.printableText}>
                  Վճարված Գումար: {price || '0'}
                </Text>
                <Text style={styles.printableText} />
              </View>
            </ViewShot>

            {/* Price Input */}
            <View style={styles.priceSection}>
              <Text style={styles.sectionTitle}>Գին</Text>
              <TextInput
                style={styles.priceInput}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="Մուտքագրեք գինը (դրամ)"
                placeholderTextColor={COLORS.WHITE + '50'}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Չեղարկել</Text>
              </TouchableOpacity>
              <Button text="Տպել" onPress={captureAndPrint} loading={loading} />
            </View>
          </View>
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
    width: '90%',
    height: '80%',
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY + '50',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    backgroundColor: COLORS.PRIMARY + '20',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.PRIMARY + '50',
  },
  headerTitle: {
    fontSize: FONT_SIZES.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.ERROR + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.ERROR,
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: SPACING.LG,
  },
  userInfoCard: {
    backgroundColor: COLORS.WHITE + '10',
    borderRadius: 8,
    padding: SPACING.MD,
    marginBottom: SPACING.LG,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY + '30',
  },
  userName: {
    fontSize: FONT_SIZES.LARGE,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    marginBottom: SPACING.MD,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.XS,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.WHITE + '10',
    marginBottom: SPACING.XS,
  },
  infoLabel: {
    color: COLORS.WHITE + '80',
    fontSize: FONT_SIZES.MEDIUM,
    flex: 1,
  },
  infoValue: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MEDIUM,
    flex: 2,
    textAlign: 'right',
  },
  priceSection: {
    backgroundColor: COLORS.PRIMARY + '10',
    borderRadius: 8,
    padding: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY + '30',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    marginBottom: SPACING.SM,
  },
  priceInput: {
    backgroundColor: COLORS.WHITE + '20',
    borderRadius: 8,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY + '50',
    textAlign: 'center',
  },
  footer: {
    padding: SPACING.LG,
    borderTopWidth: 1,
    borderTopColor: COLORS.PRIMARY + '30',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.MD,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.WHITE + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.WHITE + '50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: '500',
  },
  printableArea: {
    backgroundColor: COLORS.WHITE,
    padding: SPACING.MD,
    borderRadius: 8,
    marginBottom: SPACING.MD,
  },
  printContent: {
    gap: 8,
  },
  logoImage: {
    width: 60,
    height: 45,
    alignSelf: 'center',
    marginVertical: SPACING.XS,
  },
  printableText: {
    color: COLORS.BLACK,
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: '600',
    lineHeight: SPACING.LG,
  },
});

export default NewUserModal;
