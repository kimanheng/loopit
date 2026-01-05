import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../context/LanguageContext';

export default function BrowseScreen() {
  const { fonts } = useLanguage();
  return (
    <View style={styles.container}>
      <Text style={[styles.text, { fontFamily: fonts.heading }]}>Map View Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  text: {
    fontSize: 24,
    color: Colors.deepGreen,
  },
});