import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  API_CONFIG,
  API_TOKEN,
} from '../constants/Constants';
import { Button } from './Button';
import LoadingModal from './LoadingModal';

const LocationSelector = ({ onUsersLoaded, onLocationChange }) => {
  const [districts, setDistricts] = useState([]);
  const [areas, setAreas] = useState([]);
  const [streets, setStreets] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedStreet, setSelectedStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [apartment, setApartment] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingStreets, setLoadingStreets] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);

  useEffect(() => {
    fetchDistricts();
  }, []);

  const fetchDistricts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DISTRICTS}?token=${API_TOKEN}`,
      );
      const data = await response.json();
      if (response.ok && data) {
        setDistricts(Array.isArray(data) ? data : [data]);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async districtName => {
    try {
      setLoadingAreas(true);
      setAreas([]);
      setStreets([]);
      setSelectedArea('');
      setSelectedStreet('');

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${
          API_CONFIG.ENDPOINTS.AREAS
        }?districtName=${encodeURIComponent(districtName)}&token=${API_TOKEN}`,
      );
      const data = await response.json();
      if (response.ok && data) {
        setAreas(Array.isArray(data) ? data : [data]);
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
    } finally {
      setLoadingAreas(false);
    }
  };

  const fetchStreets = async (districtName, areaName) => {
    try {
      setLoadingStreets(true);
      setStreets([]);
      setSelectedStreet('');

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${
          API_CONFIG.ENDPOINTS.STREETS
        }?districtName=${encodeURIComponent(
          districtName,
        )}&areaName=${encodeURIComponent(areaName)}&token=${API_TOKEN}`,
      );
      const data = await response.json();
      console.log(data);
      if (response.ok && data) {
        setStreets(Array.isArray(data) ? data : [data]);
      }
    } catch (error) {
      console.error('Error fetching streets:', error);
    } finally {
      setLoadingStreets(false);
    }
  };

  const fetchSingleUser = async () => {
    if (!mobileNumber) {
      return;
    }

    try {
      setLoadingUser(true);
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER}?mNumber=${mobileNumber}&token=${API_TOKEN}`;
      console.log('Fetching user:', url);

      const response = await fetch(url);
      const data = await response.json();
      console.log('User response:', data);

      if (response.ok && data) {
        const usersArray = Array.isArray(data) ? data : [data];
        onUsersLoaded(usersArray);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      onUsersLoaded([]);
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchUsersByLocation = async () => {
    if (!selectedDistrict || !selectedArea || !selectedStreet || !building) {
      return;
    }

    try {
      setLoadingUser(true);
      let url = `${API_CONFIG.BASE_URL}${
        API_CONFIG.ENDPOINTS.USERS
      }?districtName=${encodeURIComponent(
        selectedDistrict,
      )}&areaName=${encodeURIComponent(
        selectedArea,
      )}&streetName=${encodeURIComponent(
        selectedStreet,
      )}&building=${encodeURIComponent(building)}&token=${API_TOKEN}`;

      if (apartment) {
        url += `&appartament=${encodeURIComponent(apartment)}`;
      }

      console.log('Fetching users by location:', url);
      const response = await fetch(url);
      const data = await response.json();
      console.log('Location users response:', data);

      if (response.ok && data) {
        const usersArray = Array.isArray(data) ? data : [data];
        onUsersLoaded(usersArray);
      }
    } catch (error) {
      console.error('Error fetching users by location:', error);
      onUsersLoaded([]);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleDistrictChange = value => {
    setSelectedDistrict(value);
    if (value) {
      fetchAreas(value);
    }
    onLocationChange({ district: value, area: '', street: '' });
  };

  const handleAreaChange = value => {
    setSelectedArea(value);
    if (value && selectedDistrict) {
      fetchStreets(selectedDistrict, value);
    }
    onLocationChange({ district: selectedDistrict, area: value, street: '' });
  };

  const handleStreetChange = value => {
    setSelectedStreet(value);
    onLocationChange({
      district: selectedDistrict,
      area: selectedArea,
      street: value,
    });
    if (value) {
      // Automatically fetch users when street is selected
      setTimeout(() => {
        fetchUsersForStreet(value);
      }, 500);
    }
  };

  const fetchUsersForStreet = async streetName => {
    if (!selectedDistrict || !selectedArea || !streetName) {
      return;
    }
    console.log(streetName);
    try {
      setLoading(true);
      const url = `${API_CONFIG.BASE_URL}${
        API_CONFIG.ENDPOINTS.USERS
      }?districtName=${encodeURIComponent(
        selectedDistrict,
      )}&areaName=${encodeURIComponent(
        selectedArea,
      )}&streetName=${encodeURIComponent(streetName)}&token=${API_TOKEN}`;
      console.log(url);
      const response = await fetch(url);
      const data = await response.json();
      console.log(data);
      if (response.ok && data) {
        const usersArray = Array.isArray(data) ? data : [data];
        console.log(usersArray);
        onUsersLoaded(usersArray);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      onUsersLoaded([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Mobile Number Search */}
      <View style={styles.searchSection}>
        <Text style={styles.sectionTitle}>Փնտրել ըստ հեռախոսահամարի</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={mobileNumber}
            onChangeText={setMobileNumber}
            placeholder="Մուտքագրեք բջջային համարը"
            placeholderTextColor={COLORS.WHITE + '50'}
            keyboardType="numeric"
          />
          <Button
            text="Փնտրել"
            onPress={fetchSingleUser}
            loading={loadingUser}
          />
        </View>
      </View>

      <View style={styles.divider}>
        <Text style={styles.dividerText}>ԿԱՄ</Text>
      </View>

      {/* Location Selection */}
      <Text style={styles.title}>Ընտրեք տեղադրությունը</Text>

      {/* District Selector */}
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Շրջան</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.PRIMARY} />
        ) : (
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedDistrict}
              onValueChange={handleDistrictChange}
              style={styles.picker}
            >
              <Picker.Item label="Ընտրեք շրջան" value="" />
              {districts.map((district, index) => (
                <Picker.Item
                  key={index}
                  label={
                    typeof district === 'string'
                      ? district
                      : district.name || district.districtName || ''
                  }
                  value={
                    typeof district === 'string'
                      ? district
                      : district.name || district.districtName || ''
                  }
                />
              ))}
            </Picker>
          </View>
        )}
      </View>

      {/* Area Selector */}
      {selectedDistrict && (
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Տարածք</Text>
          {loadingAreas ? (
            <ActivityIndicator color={COLORS.PRIMARY} />
          ) : (
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedArea}
                onValueChange={handleAreaChange}
                style={styles.picker}
                enabled={areas.length > 0}
              >
                <Picker.Item label="Ընտրեք տարածք" value="" />
                {areas.map((area, index) => (
                  <Picker.Item
                    key={index}
                    label={
                      typeof area === 'string'
                        ? area
                        : area.name || area.areaName || ''
                    }
                    value={
                      typeof area === 'string'
                        ? area
                        : area.name || area.areaName || ''
                    }
                  />
                ))}
              </Picker>
            </View>
          )}
        </View>
      )}

      {/* Street Selector */}
      {selectedArea && (
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Փողոց</Text>
          {loadingStreets ? (
            <ActivityIndicator color={COLORS.PRIMARY} />
          ) : (
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedStreet}
                onValueChange={handleStreetChange}
                style={styles.picker}
                enabled={streets.length > 0}
              >
                <Picker.Item label="Ընտրեք փողոց" value="" />
                {streets.map((street, index) => (
                  <Picker.Item
                    key={index}
                    label={
                      typeof street === 'string'
                        ? street
                        : street.name || street.streetName || ''
                    }
                    value={
                      typeof street === 'string'
                        ? street
                        : street.name || street.streetName || ''
                    }
                  />
                ))}
              </Picker>
            </View>
          )}
        </View>
      )}

      {/* Building and Apartment Inputs */}
      {selectedStreet && (
        <View style={styles.addressSection}>
          <View style={styles.inputRow}>
            <View style={styles.inputColumn}>
              <Text style={styles.label}>Շենք *</Text>
              <TextInput
                style={styles.input}
                value={building}
                onChangeText={setBuilding}
                placeholder="Շենքի համար"
                placeholderTextColor={COLORS.WHITE + '50'}
              />
            </View>
            <View style={styles.inputColumn}>
              <Text style={styles.label}>Բնակարան</Text>
              <TextInput
                style={styles.input}
                value={apartment}
                onChangeText={setApartment}
                placeholder="Բնակարանի համար"
                placeholderTextColor={COLORS.WHITE + '50'}
              />
            </View>
          </View>
          <Button
            text="Փնտրել օգտատեր"
            onPress={fetchUsersByLocation}
            loading={loadingUser}
            disabled={!building}
          />
        </View>
      )}

      <LoadingModal
        visible={loadingUser || loading || loadingAreas || loadingStreets}
        message={
          loadingUser
            ? 'Բեռնում է օգտատերերի տվյալները...'
            : loadingAreas
            ? 'Բեռնում է տարածքները...'
            : loadingStreets
            ? 'Բեռնում է փողոցները...'
            : 'Բեռնում է շրջանները...'
        }
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.MD,
    marginTop: 40,
  },
  searchSection: {
    marginBottom: SPACING.LG,
    padding: SPACING.MD,
    backgroundColor: COLORS.PRIMARY + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY + '30',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    marginBottom: SPACING.SM,
  },
  inputContainer: {
    gap: SPACING.SM,
  },
  input: {
    backgroundColor: COLORS.WHITE + '20',
    borderRadius: 8,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY + '50',
  },
  divider: {
    alignItems: 'center',
    marginVertical: SPACING.LG,
  },
  dividerText: {
    color: COLORS.WHITE + '70',
    fontSize: FONT_SIZES.SMALL,
    fontWeight: 'bold',
  },
  title: {
    fontSize: FONT_SIZES.LARGE,
    color: COLORS.WHITE,
    fontWeight: 'bold',
    marginBottom: SPACING.MD,
    textAlign: 'center',
  },
  pickerContainer: {
    marginBottom: SPACING.MD,
  },
  label: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MEDIUM,
    marginBottom: SPACING.XS,
  },
  pickerWrapper: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 60,
    color: COLORS.BLACK,
  },
  addressSection: {
    marginTop: SPACING.MD,
    padding: SPACING.MD,
    backgroundColor: COLORS.PRIMARY + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY + '30',
    marginBottom: 30,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.SM,
    marginBottom: SPACING.MD,
  },
  inputColumn: {
    flex: 1,
  },
});

export default LocationSelector;
