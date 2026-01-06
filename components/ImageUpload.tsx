import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface ImageUploadProps {
  label?: string;
  initialImage?: string;
  onImageSelected: (uri: string) => void;
  aspect?: [number, number];
  shape?: 'rectangle' | 'circle';
}

export default function ImageUpload({ label, initialImage, onImageSelected, aspect = [4, 3], shape = 'rectangle' }: ImageUploadProps) {
  const [preview, setPreview] = useState(initialImage);

  useEffect(() => {
    if (initialImage) {
      setPreview(initialImage);
    }
  }, [initialImage]);

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: aspect,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setPreview(uri);
      onImageSelected(uri);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity 
        style={[
            styles.uploadArea, 
            shape === 'circle' && styles.uploadAreaCircle
        ]} 
        onPress={pickImage} 
      >
        {preview ? (
          <View style={{ width: '100%', height: '100%' }}>
            <Image source={{ uri: preview }} style={[styles.preview, shape === 'circle' && styles.previewCircle]} />
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="cloud-upload-outline" size={32} color={Colors.gray} />
            <Text style={styles.placeholderText}>Tap to upload</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: Colors.black,
    marginBottom: 8,
  },
  uploadArea: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  uploadAreaCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  previewCircle: {
      borderRadius: 60,
  },
  placeholder: {
    alignItems: 'center',
  },
  placeholderText: {
    color: Colors.gray,
    marginTop: 8,
  },
});
