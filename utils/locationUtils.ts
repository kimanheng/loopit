import * as Location from 'expo-location';

export const DEFAULT_USER_LOCATION = {
    latitude: 11.5564,
    longitude: 104.9282
};

export const getCurrentLocation = async () => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            return DEFAULT_USER_LOCATION;
        }

        const location = await Location.getCurrentPositionAsync({});
        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };
    } catch (error) {
        console.error('Error getting location:', error);
        return DEFAULT_USER_LOCATION;
    }
};

export const getAddressFromCoords = async (latitude: number, longitude: number) => {
    try {
        const [address] = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
        });

        if (address) {
            // Priority: Name (like "Tuel Kork") -> Street -> District -> City
            const name = address.name || address.street || address.district || address.city || 'Unknown Location';
            const city = address.city || address.region || '';
            return city ? `${name}, ${city}` : name;
        }
        return 'Unknown Location';
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return 'Unknown Location';
    }
};

export const calculateDistance = (lat1?: number, lon1?: number, lat2?: number, lon2?: number): string => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 'Unknown';

    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km

    if (d < 1) {
        return `${(d * 1000).toFixed(0)} m`;
    }
    return `${d.toFixed(1)} km`;
};

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}
