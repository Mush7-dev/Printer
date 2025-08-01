import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Input } from './Input';
import { Button } from './Button';
import { COLORS, SPACING, FONT_SIZES } from '../constants/Constants';

const MainForm = ({
  mobileNumber,
  setMobileNumber,
  id,
  setId,
  engineerName,
  setEngineerName,
  onFetchData,
  dataLoading,
}) => {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>Fnet</Text>
        <Text style={styles.description}>Telecom</Text>
      </View>
      <View style={styles.dataBox}>
        <Input
          value={mobileNumber}
          type="numeric"
          onChange={setMobileNumber}
          placeholder="Մուտքագրեք բջջային համարը"
        />
        <Input
          value={id}
          type="numeric"
          onChange={setId}
          placeholder="Մուտքագրեք հաճախորդի ID-ն"
        />
        <Input
          value={engineerName}
          type="default"
          onChange={setEngineerName}
          placeholder="Մուտքագրեք ինժեների անունը"
        />
      </View>
      <View style={styles.buttonWrapper}>
        <Button
          text={'Տվյալների ստացում'}
          onPress={onFetchData}
          loading={dataLoading}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: SPACING.XL,
    justifyContent: 'center',
  },
  title: {
    color: COLORS.PRIMARY,
    textAlign: 'center',
    fontWeight: '900',
    fontSize: FONT_SIZES.XXL,
  },
  description: {
    color: COLORS.PRIMARY,
    textAlign: 'center',
    fontWeight: '500',
    fontSize: FONT_SIZES.SMALL,
  },
  dataBox: {
    gap: SPACING.SM / 2,
  },
  buttonWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MainForm;
