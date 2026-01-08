import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../context/LanguageContext';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { Id } from '../../convex/_generated/dataModel';
import ImageUpload from '../../components/ImageUpload';
import { uploadImage } from '../../utils/imageUpload';
import MapView, { Marker } from 'react-native-maps';
import OLC from 'open-location-code';

const olc = new OLC.OpenLocationCode();

export default function StoreDetailsScreen() {
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  
  const updateStore = useMutation(api.stores.updateStore);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const store = useQuery(api.stores.get, { id: storeId as Id<"stores"> });

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState('');
  const [logo, setLogo] = useState('');
  const [plusCode, setPlusCode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationDescription, setLocationDescription] = useState('');
  
  // Local selection state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (store) {
      setName(store.name);
      setCategory(store.category);
      setImage(store.image || '');
      setLogo(store.logo || '');
      setPlusCode(store.plusCode || '');
      setLatitude(store.latitude || null);
      setLongitude(store.longitude || null);
      setLocationDescription(store.locationDescription || '');
    }
  }, [store]);

  // Derived location from Plus Code for preview
  const derivedLocation = useMemo(() => {
    if (!plusCode || plusCode.length < 8) return null;
    try {
        const area = olc.decode(plusCode);
        return {
            latitude: area.latitudeCenter,
            longitude: area.longitudeCenter
        };
    } catch (e) {
        return null;
    }
  }, [plusCode]);

  // Update map state when valid plus code is entered
  useEffect(() => {
      if (derivedLocation) {
          setLatitude(derivedLocation.latitude);
          setLongitude(derivedLocation.longitude);
      }
  }, [derivedLocation]);

  const handleUpdate = async () => {
    if (!name || !category) {
      Alert.alert('Error', 'Name and Category are required');
      return;
    }

    if (!plusCode) {
         Alert.alert('Error', 'Plus Code is required.');
         return;
    }

    // Validate Plus Code one last time
    let latNum: number | undefined;
    let lngNum: number | undefined;
    try {
        const codeArea = olc.decode(plusCode);
        latNum = codeArea.latitudeCenter;
        lngNum = codeArea.longitudeCenter;
    } catch (e) {
        Alert.alert('Error', 'Invalid Plus Code.');
        return;
    }

    setSaving(true);
    try {
      let imageStorageId = undefined;
      let logoStorageId = undefined;

      if (selectedImage) {
          imageStorageId = await uploadImage(selectedImage, generateUploadUrl);
      }

      if (selectedLogo) {
          logoStorageId = await uploadImage(selectedLogo, generateUploadUrl);
      }

      await updateStore({
        storeId: storeId as Id<"stores">,
        name,
        category,
        imageStorageId,
        logoStorageId,
        latitude: latNum,
        longitude: lngNum,
        plusCode,
        locationDescription,
      });
      Alert.alert('Success', 'Store details updated!');
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update store');
    } finally {
        setSaving(false);
    }
  };

  if (!store) return <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}><Text>Loading...</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
            <ScrollView 
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="always"
            >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.deepGreen} />
                </TouchableOpacity>
                <Text style={[styles.title, { fontFamily: fonts.heading }]}>Store Details</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.imagesContainer}>
                    <View style={styles.coverImageContainer}>
                        <ImageUpload 
                            initialImage={image}
                            onImageSelected={setSelectedImage}
                            aspect={[16, 9]}
                        />
                    </View>
                    <View style={styles.logoContainer}>
                        <ImageUpload 
                            initialImage={logo}
                            onImageSelected={setSelectedLogo}
                            aspect={[1, 1]}
                            shape="circle"
                        />
                    </View>
                </View>

                <Text style={[styles.label, { fontFamily: fonts.body }]}>Store Name</Text>
                <TextInput
                style={[styles.input, { fontFamily: fonts.body }]}
                value={name}
                onChangeText={setName}
                />

                <Text style={[styles.label, { fontFamily: fonts.body }]}>Category</Text>
                <View style={styles.categoryContainer}>
                    {['Meals', 'Baked Goods', 'Groceries', 'Vegan'].map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.categoryChip, category === cat && styles.categoryActive]}
                            onPress={() => setCategory(cat)}
                        >
                            <Text style={[
                                styles.categoryText, 
                                { fontFamily: fonts.body },
                                category === cat && styles.categoryTextActive
                            ]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { fontFamily: fonts.heading }]}>Location</Text>
                </View>

                <Text style={[styles.label, { fontFamily: fonts.body }]}>Plus Code</Text>
                <TextInput
                style={[styles.input, { fontFamily: fonts.body }]}
                value={plusCode}
                onChangeText={setPlusCode}
                placeholder="e.g. 9C3XGV74+2V"
                autoCapitalize="characters"
                />

                {/* Map Preview - only if valid */}
                {derivedLocation && (
                    <View style={styles.mapPreviewContainer}>
                        <MapView
                            style={styles.map}
                            region={{
                                latitude: latitude || 11.5564, // Default or store loc
                                longitude: longitude || 104.9282,
                                latitudeDelta: 0.005,
                                longitudeDelta: 0.005,
                            }}
                            scrollEnabled={true}
                            zoomEnabled={true}
                        >
                            {latitude && longitude && (
                                <Marker coordinate={{ latitude, longitude }}>
                                    <View style={styles.customMarker}>
                                        <Image 
                                            source={{ uri: selectedLogo || logo }} 
                                            style={styles.markerImage} 
                                            contentFit="cover"
                                        />
                                    </View>
                                </Marker>
                            )}
                        </MapView>
                    </View>
                )}

                <Text style={[styles.label, { fontFamily: fonts.body }]}>Location Description</Text>
                <TextInput
                style={[styles.input, { fontFamily: fonts.body, height: 80 }]}
                value={locationDescription}
                onChangeText={setLocationDescription}
                placeholder="e.g. Entrance next to the station"
                multiline
                />

                <TouchableOpacity 
                    style={[styles.button, saving && styles.buttonDisabled]} 
                    onPress={handleUpdate}
                    disabled={saving}
                >
                {saving ? (
                    <ActivityIndicator color={Colors.white} />
                ) : (
                    <Text style={[styles.buttonText, { fontFamily: fonts.heading }]}>Save Changes</Text>
                )}
                </TouchableOpacity>
            </View>
            </ScrollView>
        </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
      padding: 20,
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 30,
  },
  backBtn: {
      marginRight: 16,
  },
  title: {
    fontSize: 24,
    color: Colors.deepGreen,
  },
  form: {
    gap: 16,
  },
  imagesContainer: {
      marginBottom: 40, // Space for the overlapping logo
      position: 'relative',
  },
  coverImageContainer: {
      width: '100%',
  },
  logoContainer: {
      position: 'absolute',
      bottom: -40,
      left: 20,
      zIndex: 10,
  },
  label: {
    fontSize: 16,
    color: Colors.black,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
    height: 56,
    textAlignVertical: 'center',
  },
  categoryContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 8,
  },
  categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: '#f0f0f0',
      borderWidth: 1,
      borderColor: 'transparent',
  },
  categoryActive: {
      backgroundColor: '#e6f4ea',
      borderColor: Colors.deepGreen,
  },
  categoryText: {
      color: Colors.black,
  },
  categoryTextActive: {
      color: Colors.deepGreen,
      fontWeight: 'bold',
  },
  sectionHeader: {
      marginTop: 20,
      marginBottom: 10,
  },
  sectionTitle: {
      fontSize: 20,
      color: Colors.deepGreen,
  },
  mapPreviewContainer: {
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  map: {
      width: '100%',
      height: '100%',
  },
  customMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.deepGreen,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  markerImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  helperText: {
      color: Colors.gray,
      fontSize: 12,
      marginBottom: 16,
      marginTop: -4,
  },
  button: {
    backgroundColor: Colors.deepGreen,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
      opacity: 0.7,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
  },
});