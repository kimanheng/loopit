import 'react-native-gesture-handler/jestSetup';

jest.mock('expo-font');
jest.mock('expo-asset');
jest.mock('expo-location', () => ({
    requestForegroundPermissionsAsync: jest.fn(),
    getCurrentPositionAsync: jest.fn(),
    reverseGeocodeAsync: jest.fn(),
}));