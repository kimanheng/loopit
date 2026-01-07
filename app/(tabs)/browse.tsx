import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import MapView, { Marker, Region } from 'react-native-maps';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors } from '../../constants/Colors';
import { DEFAULT_USER_LOCATION, getCurrentLocation } from '../../utils/locationUtils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.04; // Initial zoom
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Threshold to group markers (relative to latitudeDelta)
const CLUSTER_THRESHOLD_RATIO = 0.12; 

interface Cluster {
  id: string;
  latitude: number;
  longitude: number;
  points: any[];
}

export default function BrowseScreen() {
  const router = useRouter();
  const rawStores = useQuery(api.stores.list, {});
  
  const [region, setRegion] = useState<Region>({
    latitude: DEFAULT_USER_LOCATION.latitude,
    longitude: DEFAULT_USER_LOCATION.longitude,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });

  const [clusters, setClusters] = useState<(any | Cluster)[]>([]);

  const stores = useMemo(() => {
    return (rawStores || []).filter(s => s.latitude && s.longitude);
  }, [rawStores]);

  useEffect(() => {
    const fetchLocation = async () => {
      const location = await getCurrentLocation();
      setRegion(prev => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude,
      }));
    };
    fetchLocation();
  }, []);

  useEffect(() => {
    if (!stores.length) return;
    
    // Simple Greedy Clustering
    const clusterThreshold = region.latitudeDelta * CLUSTER_THRESHOLD_RATIO;
    const newClusters: (any | Cluster)[] = [];
    const processed = new Set<string>();

    // 1. Convert stores to points to process
    const points = stores.map(s => ({...s}));

    points.forEach((point, index) => {
        if (processed.has(point._id)) return;

        const currentCluster: Cluster = {
            id: `cluster-${point._id}`,
            latitude: point.latitude!,
            longitude: point.longitude!,
            points: [point]
        };
        processed.add(point._id);

        // Find neighbors
        for (let i = index + 1; i < points.length; i++) {
            const otherPoint = points[i];
            if (processed.has(otherPoint._id)) continue;

            const dLat = Math.abs(point.latitude! - otherPoint.latitude!);
            const dLon = Math.abs(point.longitude! - otherPoint.longitude!);

            // Simple rectangular distance check for speed
            if (dLat < clusterThreshold && dLon < clusterThreshold) {
                currentCluster.points.push(otherPoint);
                processed.add(otherPoint._id);
            }
        }

        if (currentCluster.points.length > 1) {
            // Average the position
            const avgLat = currentCluster.points.reduce((sum, p) => sum + p.latitude!, 0) / currentCluster.points.length;
            const avgLon = currentCluster.points.reduce((sum, p) => sum + p.longitude!, 0) / currentCluster.points.length;
            currentCluster.latitude = avgLat;
            currentCluster.longitude = avgLon;
            newClusters.push(currentCluster);
        } else {
            // It's a single point
            newClusters.push(point);
        }
    });

    setClusters(newClusters);

  }, [stores, region.latitudeDelta]); // Re-cluster when zoom changes or stores change

  const onRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
  };

  const handleMarkerPress = (item: any) => {
      // If it's a single store, navigate or show details
      // For now, let's navigate to store page
      router.push(`/store/${item._id}`);
  };

  const handleClusterPress = (cluster: Cluster) => {
      // Zoom in to the cluster
      const newDelta = region.latitudeDelta / 2;
      setRegion({
          latitude: cluster.latitude,
          longitude: cluster.longitude,
          latitudeDelta: newDelta,
          longitudeDelta: newDelta * ASPECT_RATIO,
      });
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        region={region}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {clusters.map((item) => {
            const isCluster = 'points' in item;
            
            if (isCluster) {
                const cluster = item as Cluster;
                return (
                    <Marker
                        key={cluster.id}
                        coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
                        onPress={() => handleClusterPress(cluster)}
                    >
                        <View style={styles.clusterContainer}>
                            <Text style={styles.clusterText}>{cluster.points.length}</Text>
                        </View>
                    </Marker>
                );
            } else {
                const store = item;
                return (
                    <Marker
                        key={store._id}
                        coordinate={{ latitude: store.latitude!, longitude: store.longitude! }}
                        onPress={() => handleMarkerPress(store)}
                    >
                        <View style={styles.markerContainer}>
                            {store.logo ? (
                                <Image source={{ uri: store.logo }} style={styles.markerImage} />
                            ) : (
                                <View style={styles.defaultMarker}>
                                    <Ionicons name="storefront" size={20} color={Colors.white} />
                                </View>
                            )}
                        </View>
                    </Marker>
                );
            }
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  clusterContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.deepGreen,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: Colors.white,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
  },
  clusterText: {
      color: Colors.white,
      fontWeight: 'bold',
      fontSize: 16,
  },
  markerContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Colors.white,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.lightGray,
      overflow: 'hidden',
  },
  markerImage: {
      width: 44, // Match container for better clipping
      height: 44,
      borderRadius: 22,
      resizeMode: 'cover',
      overflow: 'hidden',
  },
  defaultMarker: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Colors.deepGreen,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
  },
});