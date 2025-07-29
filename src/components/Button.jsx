import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';

export const Button = ({ onPress, svg, text, loading = false, disabled = false }) => {
  return (
    <TouchableOpacity
      style={[styles.button, styles.printButton, (disabled || loading) && styles.disabled]}
      onPress={disabled || loading ? undefined : onPress}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#F9AA33" />
          {text && <Text style={[styles.text, styles.loadingText]}>{text}</Text>}
        </View>
      ) : (
        text ? <Text style={styles.text}>{text}</Text> : svg
      )}
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
  disabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    marginLeft: 8,
  },
});
