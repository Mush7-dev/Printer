import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export const Button = ({ onPress, svg, text }) => {
  return (
    <TouchableOpacity
      style={[styles.button, styles.printButton]}
      onPress={onPress}
    >
      {text ? <Text style={styles.text}>{text}</Text> : svg}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#F9AA33',
    fontSize: 16,
    fontWeight: 600,
  },
});
