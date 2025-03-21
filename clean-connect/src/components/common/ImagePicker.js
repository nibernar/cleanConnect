import React, { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../utils/theme';

/**
 * Image picker component that allows selecting images from camera or gallery
 * @param {function} onImageSelected - Function called when image is selected with URI as parameter
 * @param {string} initialImage - Initial image URI
 * @param {string} title - Title for the picker
 * @param {boolean} multiple - Allow multiple image selection
 */
const ImagePicker = ({ 
  onImageSelected, 
  initialImage = null, 
  title = 'Ajouter une photo', 
  multiple = false 
}) => {
  const [image, setImage] = useState(initialImage);

  const requestPermission = async () => {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission refusée',
        'Nous avons besoin de votre permission pour accéder à votre galerie.'
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: multiple,
      });

      if (!result.canceled && result.assets) {
        const selectedImage = result.assets[0].uri;
        setImage(selectedImage);
        onImageSelected(selectedImage);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sélection de l\'image.');
    }
  };

  const takePhoto = async () => {
    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission refusée',
        'Nous avons besoin de votre permission pour accéder à votre caméra.'
      );
      return;
    }

    try {
      const result = await ExpoImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const selectedImage = result.assets[0].uri;
        setImage(selectedImage);
        onImageSelected(selectedImage);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la prise de photo.');
    }
  };

  const showOptions = () => {
    Alert.alert(
      'Ajouter une photo',
      'Choisissez une source',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Prendre une photo', onPress: takePhoto },
        { text: 'Choisir depuis la galerie', onPress: pickImage },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <TouchableOpacity style={styles.pickerContainer} onPress={showOptions}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera" size={40} color={colors.primary} />
            <Text style={styles.placeholderText}>Ajouter une photo</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.bodySmall,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
  },
  placeholderText: {
    ...typography.body,
    color: colors.primary,
    marginTop: spacing.sm,
  },
});

export default ImagePicker;