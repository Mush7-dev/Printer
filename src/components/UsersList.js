import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
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
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [userImages, setUserImages] = useState({});
  const printViewRef = useRef(null);
  const userPrintRefs = useRef({});

  useEffect(() => {
    // Initialize prices for all users
    const initialPrices = {};
    users.forEach(user => {
      const userId = user.id || user.customerId || user.mNumber;
      initialPrices[userId] = '';
    });
    setUserPrices(initialPrices);
    // Reset selections when users change
    setSelectedUsers(new Set());
    setSelectAll(false);
    // Reset user images
    setUserImages({});
    userPrintRefs.current = {};
  }, [users]);

  const handlePriceChange = (userId, price) => {
    setUserPrices(prev => ({
      ...prev,
      [userId]: price,
    }));
  };

  const handleUserSelection = userId => {
    setSelectedUsers(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(userId)) {
        newSelected.delete(userId);
      } else {
        newSelected.add(userId);
      }

      // Update select all state
      setSelectAll(newSelected.size === users.length);

      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all
      setSelectedUsers(new Set());
      setSelectAll(false);
    } else {
      // Select all
      const allUserIds = users.map(
        user => user.id || user.customerId || user.mNumber,
      );
      setSelectedUsers(new Set(allUserIds));
      setSelectAll(true);
    }
  };

  const handleCaptureUserImage = async userId => {
    try {
      const userRef = userPrintRefs.current[userId];
      if (!userRef) {
        console.log('User ref not ready for:', userId);
        return;
      }

      const imageUri = await captureRef(userRef, {
        format: PRINTING_CONFIG.IMAGE.FORMAT,
        quality: PRINTING_CONFIG.IMAGE.QUALITY,
        result: 'data-uri',
        width: PRINTING_CONFIG.IMAGE.WIDTH,
        height: undefined,
      });

      setUserImages(prev => ({
        ...prev,
        [userId]: imageUri,
      }));

      console.log('User image captured for:', userId);
    } catch (error) {
      console.error('Error capturing user image:', error);
    }
  };

  const handlePrintSelected = async () => {
    try {
      if (!printViewRef.current) {
        console.log('Print view ref not ready');
        return;
      }

      if (selectedUsers.size === 0) {
        alert('Խնդրում ենք ընտրել առնվազն մեկ օգտատեր');
        return;
      }

      const imageUri = await captureRef(printViewRef.current, {
        format: PRINTING_CONFIG.IMAGE.FORMAT,
        quality: PRINTING_CONFIG.IMAGE.QUALITY,
        result: 'base64',
        width: PRINTING_CONFIG.IMAGE.WIDTH,
        height: undefined,
      });

      console.log('Selected users image captured as base64');
      onPrintImage(imageUri);
    } catch (error) {
      console.error('Error capturing users image:', error);
    }
  };

  if (!users || users.length === 0) {
    return (
      <Modal
        visible={true}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Օգտատերերը չեն գտնվել</Text>
            </View>
          </View>
        </View>
      </Modal>
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
          {/* Header with select all and close button */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>
                Գտնվել է {users.length} օգտատեր
              </Text>
              <TouchableOpacity
                style={styles.selectAllContainer}
                onPress={handleSelectAll}
              >
                <View
                  style={[
                    styles.checkbox,
                    selectAll && styles.checkboxSelected,
                  ]}
                >
                  {selectAll && <Text style={styles.checkboxText}>✓</Text>}
                </View>
                <Text style={styles.selectAllText}>Ընտրել բոլորը</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {users.map((user, index) => {
              const userId = user.id || user.customerId || user.mNumber;
              const displayName =
                user.name || user.fullName || 'Անանուն օգտատեր';
              const displayId = user.customerId || user.id || '';
              const displayPhone = user.mNumber || user.phoneNumber || '';
              const displayAddress =
                user.address ||
                `${user.streetName || ''} ${user.building || ''} ${
                  user.apartment || ''
                }`.trim();

              const isSelected = selectedUsers.has(userId);

              return (
                <View key={userId || index} style={styles.userCard}>
                  <View style={styles.userHeader}>
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => handleUserSelection(userId)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                        ]}
                      >
                        {isSelected && (
                          <Text style={styles.checkboxText}>✓</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{displayName}</Text>
                      {displayId && (
                        <Text style={styles.userDetail}>ID: {displayId}</Text>
                      )}
                      {displayPhone && (
                        <Text style={styles.userDetail}>
                          Հեռ: {displayPhone}
                        </Text>
                      )}
                      {displayAddress && (
                        <Text style={styles.userDetail}>
                          Հասցե: {displayAddress}
                        </Text>
                      )}
                    </View>
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

                  {/* Individual user print view (hidden) */}
                  <ViewShot
                    ref={ref => (userPrintRefs.current[userId] = ref)}
                    style={styles.hiddenPrintView}
                  >
                    <View style={styles.individualPrintContent}>
                      <Image
                        source={require('../../assets/fnet.jpg')}
                        style={styles.dateImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.printableText}>
                        Գանձող: Արմեն Հովհաննիսյան
                      </Text>
                      <Text style={[styles.printableText, { lineHeight: 24 }]}>
                        Անուն, ազգանուն: {displayName}
                      </Text>
                      <Text style={styles.printableText}>
                        հասցե: {displayAddress}
                      </Text>
                      <Text style={styles.printableText}>
                        Վճարման օր: {user.expectedPaymentDay}{' '}
                        {DEFAULTS.ARMENIAN_MONTHS[new Date().getMonth()]}
                      </Text>
                      <Text style={styles.printableText}>
                        Գումար: {user.expectedPaymentAmount}
                      </Text>
                      <Text style={styles.printableText}>
                        Հեռ.: {displayPhone}
                      </Text>
                      <Text style={styles.printableText}>
                        Ամսաթիվ: {new Date().toLocaleDateString('hy-AM')}
                      </Text>
                      <Text style={styles.printableText}>
                        Վճարված Գումար: {userPrices[userId] || '0'}
                      </Text>
                    </View>
                  </ViewShot>

                  {/* Capture button and preview */}
                  <View style={styles.captureSection}>
                    <TouchableOpacity
                      style={styles.captureButton}
                      onPress={() => handleCaptureUserImage(userId)}
                    >
                      <Text style={styles.captureButtonText}>
                        Ստեղծել պատկեր
                      </Text>
                    </TouchableOpacity>

                    {userImages[userId] && (
                      <View style={styles.imagePreviewContainer}>
                        <Text style={styles.previewLabel}>Նախադիտում:</Text>
                        <Image
                          source={{ uri: userImages[userId] }}
                          style={styles.imagePreview}
                          resizeMode="contain"
                        />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
            {/* Hidden printable content */}
            <ViewShot ref={printViewRef} style={styles.printableArea}>
              <View style={styles.printContent}>
                {users
                  .filter(user => {
                    const userId = user.id || user.customerId || user.mNumber;
                    return selectedUsers.has(userId);
                  })
                  .map((user, index) => {
                    console.log(user.fullName);
                    const userId = user.id || user.customerId || user.mNumber;
                    const displayName = user.fullName || 'Անանուն օգտատեր';
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
                      <View
                        key={userId || index}
                        style={styles.printUserSection}
                      >
                        <Image
                          source={require('../../assets/fnet.jpg')}
                          style={styles.dateImage}
                          resizeMode="contain"
                        />
                        <Text style={styles.printableText}>
                          Գանձող: Արմեն Հովհաննիսյան
                        </Text>
                        <Text
                          style={[styles.printableText, { lineHeight: 24 }]}
                        >
                          Անուն, ազգանուն: {displayName}
                        </Text>
                        <Text style={styles.printableText}>
                          հասցե: {displayAddress}
                        </Text>
                        <Text style={styles.printableText}>
                          Վճարման օր: {user.expectedPaymentDay}{' '}
                          {DEFAULTS.ARMENIAN_MONTHS[new Date().getMonth()]}
                        </Text>
                        <Text style={styles.printableText}>
                          Գումար: {user.expectedPaymentAmount}
                        </Text>
                        <Text style={styles.printableText}>
                          Հեռ.: {displayPhone}
                        </Text>
                        <Text style={styles.printableText}>
                          Ամսաթիվ: {new Date().toLocaleDateString('hy-AM')}
                        </Text>
                        <Text style={styles.printableText}>
                          Վճարված Գումար: {price}
                        </Text>
                        <Text style={styles.printableText}></Text>
                      </View>
                    );
                  })}

                {/* <Text style={styles.printableText}>
                  ================================
                </Text> */}
                {/* <Text style={styles.printableText}>
                  Ընդհանուր գումար:{' '}
                  {users.reduce((sum, user) => {
                    const userId = user.id || user.customerId || user.mNumber;
                    const price = parseFloat(userPrices[userId]) || 0;
                    return sum + price;
                  }, 0)}{' '}
                  դրամ
                </Text> */}
              </View>
            </ViewShot>

            {/* Visible user list for editing prices */}
          </ScrollView>

          <View style={[styles.printButtonContainer, { marginBottom: 10 }]}>
            <Button
              text={`Տպել ընտրվածները (${selectedUsers.size})`}
              onPress={handlePrintSelected}
              loading={loading}
              disabled={selectedUsers.size === 0}
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
  headerLeft: {
    flex: 1,
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.SM,
  },
  selectAllText: {
    color: COLORS.PRIMARY,
    fontSize: FONT_SIZES.MEDIUM,
    marginLeft: SPACING.SM,
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    marginRight: SPACING.MD,
    paddingTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.PRIMARY,
  },
  checkboxText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
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
    marginBottom: SPACING.LG,
    gap: 10,
  },
  dateImage: {
    width: 60,
    height: 45,
    alignSelf: 'center',
    marginVertical: SPACING.XS,
  },
  hiddenPrintView: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    opacity: 0,
  },
  individualPrintContent: {
    backgroundColor: COLORS.WHITE,
    padding: SPACING.MD,
    gap: SPACING.XS,
  },
  captureSection: {
    marginTop: SPACING.MD,
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.WHITE + '20',
  },
  captureButton: {
    backgroundColor: COLORS.PRIMARY + '80',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  captureButtonText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: 'bold',
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  previewLabel: {
    color: COLORS.BLACK,
    fontSize: FONT_SIZES.LARGE,
    lineHeight: SPACING.LG,
  },
  imagePreview: {
    width: 200,
    height: 300,
    backgroundColor: COLORS.WHITE,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY + '30',
  },
});

export default UsersList;
