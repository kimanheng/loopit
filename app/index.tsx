import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';

export default function Index() {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
        <ActivityIndicator size="large" color={Colors.deepGreen} />
      </View>
    );
  }

  if (isAuthenticated) {
    if (user?.userType === 'business') {
        return <Redirect href="/business-profile" />;
    }
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/auth/landing" />;
  }
}