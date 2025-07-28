import { StyleSheet, TextInput } from 'react-native';

export const Input = ({ value, onChange, type }) => {
  return (
    <TextInput
      style={styles.textInput}
      placeholder="Enter text to print..."
      keyboardType={type}
      placeholderTextColor={'#999'}
      value={value}
      onChangeText={onChange}
      multiline
      numberOfLines={4}
    />
  );
};

const styles = StyleSheet.create({
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 12,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
});
