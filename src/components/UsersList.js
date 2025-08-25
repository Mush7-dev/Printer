import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
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

const UsersList = ({ users, onPrintImage, loading, onClose }) => {
  const [userPrices, setUserPrices] = useState({});
  const printViewRef = useRef(null);

  useEffect(() => {
    // Initialize prices for all users
    const initialPrices = {};
    users.forEach(user => {
      const userId = user.id || user.customerId || user.mNumber;
      initialPrices[userId] = '';
    });
    setUserPrices(initialPrices);
  }, [users]);

  const handlePriceChange = (userId, price) => {
    setUserPrices(prev => ({
      ...prev,
      [userId]: price,
    }));
  };

  const handlePrintAll = async () => {
    try {
      if (!printViewRef.current) {
        console.log('Print view ref not ready');
        return;
      }

      const imageUri = await captureRef(printViewRef.current, {
        format: PRINTING_CONFIG.IMAGE.FORMAT,
        quality: PRINTING_CONFIG.IMAGE.QUALITY,
        result: 'base64',
        width: PRINTING_CONFIG.IMAGE.WIDTH,
        height: undefined,
      });

      console.log('All users image captured as base64');
      onPrintImage(imageUri);
    } catch (error) {
      console.error('Error capturing users image:', error);
    }
  };

  if (!users || users.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Օգտատերերը չեն գտնվել</Text>
      </View>
    );
  }

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header with close button */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Գտնվել է {users.length} օգտատեր</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Hidden printable content */}
          <ViewShot ref={printViewRef} style={styles.printableArea}>
            <View style={styles.printContent}>
              <Image
                source={require('../../assets/fnet.jpg')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.printableText}>{DEFAULTS.COMPANY_NAME}</Text>
              <Text style={styles.printableText}>
                Ամսաթիվ: {new Date().toLocaleDateString('hy-AM')}
              </Text>
              <Text style={styles.printableText}>
                Ընդհանուր օգտատերեր: {users.length}
              </Text>
              <Text style={styles.printableText}>
                ================================
              </Text>

              {users.map((user, index) => {
                const userId = user.id || user.customerId || user.mNumber;
                const displayName =
                  user.name ||
                  user.customerName ||
                  user.fullName ||
                  'Անանուն օգտատեր';
                const displayId = user.customerId || user.id || '';
                const displayPhone =
                  user.mNumber ||
                  user.phoneNumber ||
                  user.mobilePhoneNumber ||
                  '';
                const displayAddress =
                  user.address ||
                  `${user.streetName || ''} ${user.building || ''} ${
                    user.apartment || ''
                  }`.trim();
                const price = userPrices[userId] || '0';

                return (
                  <View key={userId || index} style={styles.printUserSection}>
                    <Text style={styles.printableText}>
                      {index + 1}. {displayName}
                    </Text>
                    {displayId && (
                      <Text style={styles.printableText}> ID: {displayId}</Text>
                    )}
                    {displayPhone && (
                      <Text style={styles.printableText}>
                        {' '}
                        Հեռ: {displayPhone}
                      </Text>
                    )}
                    {displayAddress && (
                      <Text style={styles.printableText}>
                        {' '}
                        Հասցե: {displayAddress}
                      </Text>
                    )}
                    <Text style={styles.printableText}>
                      Գումար: {price} դրամ
                    </Text>
                    <Text style={styles.printableText}>
                      Ստորագրություն: _______________
                    </Text>
                    <Text style={styles.printableText}> </Text>
                  </View>
                );
              })}

              <Text style={styles.printableText}>
                ================================
              </Text>
              <Text style={styles.printableText}>
                Ընդհանուր գումար:{' '}
                {users.reduce((sum, user) => {
                  const userId = user.id || user.customerId || user.mNumber;
                  const price = parseFloat(userPrices[userId]) || 0;
                  return sum + price;
                }, 0)}{' '}
                դրամ
              </Text>
            </View>
          </ViewShot>

          {/* Visible user list for editing prices */}
          {users.map((user, index) => {
            const userId = user.id || user.customerId || user.mNumber;
            const displayName =
              user.name || user.customerName || 'Անանուն օգտատեր';
            const displayId = user.customerId || user.id || '';
            const displayPhone = user.mNumber || user.phoneNumber || '';
            const displayAddress =
              user.address ||
              `${user.streetName || ''} ${user.building || ''} ${
                user.apartment || ''
              }`.trim();

            return (
              <View key={userId || index} style={styles.userCard}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{displayName}</Text>
                  {displayId && (
                    <Text style={styles.userDetail}>ID: {displayId}</Text>
                  )}
                  {displayPhone && (
                    <Text style={styles.userDetail}>Հեռ: {displayPhone}</Text>
                  )}
                  {displayAddress && (
                    <Text style={styles.userDetail}>
                      Հասցե: {displayAddress}
                    </Text>
                  )}
                </View>

                <View style={styles.priceContainer}>
                  <Text style={styles.priceLabel}>Գին (դրամ)</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={userPrices[userId] || ''}
                    onChangeText={text => handlePriceChange(userId, text)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={COLORS.WHITE + '50'}
                  />
                </View>
              </View>
            );
          })}
        </ScrollView>

          <View style={styles.printButtonContainer}>
            <Button
              text="Տպել բոլորը"
              onPress={handlePrintAll}
              loading={loading}
            />
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
    width: '95%',
    height: '90%',
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
    fontSize: FONT_SIZES.LARGE,
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
  container: {
    flex: 1,
    padding: SPACING.MD,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
  },
  emptyText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MEDIUM,
    textAlign: 'center',
  },
  title: {
    fontSize: FONT_SIZES.LARGE,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    marginBottom: SPACING.MD,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    marginBottom: SPACING.MD,
  },
  userCard: {
    backgroundColor: COLORS.WHITE + '10',
    borderRadius: 8,
    padding: SPACING.MD,
    marginBottom: SPACING.SM,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY + '30',
  },
  userInfo: {
    marginBottom: SPACING.SM,
  },
  userName: {
    color: COLORS.PRIMARY,
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: 'bold',
    marginBottom: SPACING.XS / 2,
  },
  userDetail: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.SMALL,
    marginBottom: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.SM,
    paddingTop: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: COLORS.WHITE + '20',
  },
  priceLabel: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MEDIUM,
  },
  priceInput: {
    backgroundColor: COLORS.WHITE + '20',
    borderRadius: 6,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MEDIUM,
    minWidth: 100,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: COLORS.PRIMARY + '50',
  },
  printButtonContainer: {
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.WHITE + '20',
  },
  printableArea: {
    backgroundColor: COLORS.WHITE,
    padding: SPACING.MD,
    borderRadius: 8,
    marginBottom: SPACING.MD,
  },
  printContent: {
    gap: SPACING.XS,
  },
  logoImage: {
    width: 60,
    height: 45,
    alignSelf: 'center',
    marginVertical: SPACING.XS,
  },
  printableText: {
    color: COLORS.BLACK,
    fontSize: FONT_SIZES.LARGE,
    lineHeight: SPACING.LG,
  },
  printUserSection: {
    marginBottom: SPACING.XS,
  },
});

export default UsersList;
