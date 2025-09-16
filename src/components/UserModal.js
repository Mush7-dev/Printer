import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Input } from './Input';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { Button } from './Button';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  PRINTING_CONFIG,
  DEFAULTS,
} from '../constants/Constants';

const UserModal = ({
  modalVisible,
  setModalVisible,
  userData,
  engineerName,
  onPrintImage,
  setPreviewImage,
  setMobileNumber,
}) => {
  const dataViewRef = useRef(null);
  const [price, setPrice] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
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

          <Text style={styles.modalTitle}>Օգտատիրոջ տվյալներ</Text>

          <View style={styles.monthSelectorWrapper}>
            <Text style={styles.monthLabel}>Ամիս</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedMonth}
                onValueChange={itemValue => setSelectedMonth(itemValue)}
                style={styles.picker}
                dropdownIconColor={COLORS.PRIMARY}
              >
                {DEFAULTS.ARMENIAN_MONTHS.map((month, index) => (
                  <Picker.Item
                    key={index}
                    label={month}
                    value={index}
                    style={styles.pickerItem}
                  />
                ))}
              </Picker>
            </View>
          </View>
          <ScrollView style={styles.dataScrollView}>
            <ViewShot
              ref={dataViewRef}
              style={[styles.dataBox, styles.printableArea]}
            >
              {userData && (
                <View style={{ gap: 20 }}>
                  <Image
                    source={require('../../assets/fnet.jpg')}
                    style={styles.dateImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.printableText}>
                    Գանձող: {engineerName}
                  </Text>
                  {/* <Text style={[styles.printableText, { lineHeight: 24 }]}>
                    Անուն, ազգանուն: {userData.fullName}
                  </Text> */}
                  <Text style={styles.printableText}>
                    հասցե: {userData.address}
                  </Text>
                  <Text style={styles.printableText}>
                    Վճարման օր: {userData.expectedPaymentDay}{' '}
                    {DEFAULTS.ARMENIAN_MONTHS[selectedMonth]}
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
              placeholder="Մուտքագրեք գումարը"
            />
          </View>

          <View style={styles.modalButtonWrapper}>
            <Button
              text="🖨️ Տպել"
              disabled={!price.trim()}
              onPress={async () => {
                await capturePreviewImage();
                setPrice('');
                setMobileNumber('');
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
    fontSize: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  logoImage: {
    width: 80,
    height: 60,
    marginBottom: SPACING.XS,
  },
  dateImage: {
    width: 85,
    height: 60,
    alignSelf: 'center',
    marginVertical: SPACING.XS,
  },
  priceInputWrapper: {
    marginBottom: SPACING.SM,
  },
  modalButtonWrapper: {
    marginTop: SPACING.SM,
  },
  monthSelectorWrapper: {
    marginBottom: SPACING.SM,
    paddingVertical: SPACING.SM,
  },
  monthLabel: {
    color: COLORS.PRIMARY,
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: 'bold',
    marginBottom: SPACING.XS,
  },
  pickerContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SPACING.SM / 2,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY + '50',
  },
  picker: {
    color: COLORS.BLACK,
    height: 50,
  },
  pickerItem: {
    color: COLORS.BLACK,
    fontSize: FONT_SIZES.MEDIUM,
  },
});

export default UserModal;
