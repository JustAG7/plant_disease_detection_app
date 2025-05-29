import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Modal,
  Dimensions,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { modelService, PredictionResult } from './services/ModelService';

interface ImagePickerComponentProps {
  onImagesSelected?: (images: ImagePicker.ImagePickerAsset[]) => void;
  onPrediction?: (result: PredictionResult) => void;
  maxImages?: number;
}

export default function ImagePickerComponent({ 
  onImagesSelected, 
  onPrediction,
  maxImages = 10 
}: ImagePickerComponentProps) {
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  // Add state for preview modal
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{ [key: string]: PredictionResult }>({});

  useEffect(() => {
    // Load model when component mounts
    loadModel();
  }, []);

  const loadModel = async () => {
    if (!modelService.isModelLoaded()) {
      await modelService.loadModel();
    }
  };

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need camera roll permission to upload images');
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        const updatedImages = [...images, ...result.assets];
        // Check if we exceed the max number of images
        if (maxImages && updatedImages.length > maxImages) {
          Alert.alert('Too many images', `You can only select up to ${maxImages} images`);
          return;
        }
        console.log('Selected images:', updatedImages);
        setImages(updatedImages);
        if (onImagesSelected) {
          onImagesSelected(updatedImages);
        }
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  // Preview image handler
  const handlePreviewImage = (index: number) => {
    setSelectedImageIndex(index);
    setPreviewVisible(true);
  };

  // Navigate to next image
  const nextImage = () => {
    setSelectedImageIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Navigate to previous image
  const previousImage = () => {
    setSelectedImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need camera permission to take photos');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        const updatedImages = [...images, ...result.assets];
        // Check if we exceed the max number of images
        if (maxImages && updatedImages.length > maxImages) {
          Alert.alert('Too many images', `You can only select up to ${maxImages} images`);
          return;
        }
        
        setImages(updatedImages);
        if (onImagesSelected) {
          onImagesSelected(updatedImages);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };
  const removeImage = (index: number) => {
    const removedImage = images[index];
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    
    // Remove analysis result for this image
    if (removedImage.uri && analysisResults[removedImage.uri]) {
      const newResults = { ...analysisResults };
      delete newResults[removedImage.uri];
      setAnalysisResults(newResults);
    }
    
    if (onImagesSelected) {
      onImagesSelected(updatedImages);
    }
  };

  const analyzeImage = async (imageUri: string) => {
    if (analysisResults[imageUri] || !modelService.isModelLoaded()) {
      return; // Already analyzed or model not loaded
    }

    setIsAnalyzing(true);
    try {
      const result = await modelService.predictImage(imageUri);
      if (result) {
        setAnalysisResults(prev => ({
          ...prev,
          [imageUri]: result
        }));
        
        if (onPrediction) {
          onPrediction(result);
        }
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      Alert.alert('Error', 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeAllImages = async () => {
    if (images.length === 0) {
      Alert.alert('No Images', 'Please select images first');
      return;
    }

    if (!modelService.isModelLoaded()) {
      Alert.alert('Model Loading', 'Please wait for the model to load');
      return;
    }

    setIsAnalyzing(true);
    try {
      for (const image of images) {
        if (!analysisResults[image.uri]) {
          await analyzeImage(image.uri);
        }
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getResultForImage = (imageUri: string): PredictionResult | undefined => {
    return analysisResults[imageUri];
  };
  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.pickButton]}
          onPress={pickImages}
        >
          <Text style={styles.buttonText}>Pick Images</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.cameraButton]}
          onPress={takePhoto}
        >
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
        {images.length > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.analyzeButton, isAnalyzing && styles.disabledButton]}
            onPress={analyzeAllImages}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.buttonText}>Analyze All</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {images.length > 0 && (
        <Text style={styles.imagesTitle}>
          Selected Images ({images.length}/{maxImages})
        </Text>
      )}
      
      <ScrollView 
        horizontal={false} 
        contentContainerStyle={styles.imagesContainer}
      >
        {images.map((image, index) => {
          const result = getResultForImage(image.uri);
          return (
            <View key={index} style={styles.imageWrapper}>
              <TouchableOpacity onPress={() => handlePreviewImage(index)}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.image}
                  resizeMode="cover"
                />
                {result && (
                  <View style={[
                    styles.resultOverlay,
                    { backgroundColor: result.isHealthy ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)' }
                  ]}>
                    <Text style={styles.resultText}>
                      {result.isHealthy ? '✓ Healthy' : '⚠ Disease'}
                    </Text>
                    <Text style={styles.confidenceText}>
                      {(result.confidence * 100).toFixed(0)}%
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>              <TouchableOpacity
                style={styles.analyzeImageButton}
                onPress={() => analyzeImage(image.uri)}
                disabled={isAnalyzing || !!result}
              >
                <Text style={styles.analyzeButtonText}>
                  {result ? '✓' : '🔍'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal
        visible={previewVisible}
        transparent={true}
        onRequestClose={() => setPreviewVisible(false)}
        animationType="fade"
      >
        <View style={styles.previewContainer}>
          <SafeAreaView style={styles.previewContent}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setPreviewVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            
            {images.length > 0 && (
              <>
                <Image
                  source={{ uri: images[selectedImageIndex].uri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
                
                {images.length > 1 && (
                  <View style={styles.navigationContainer}>
                    <TouchableOpacity 
                      style={styles.navigationButton} 
                      onPress={previousImage}
                    >
                      <Text style={styles.navigationButtonText}>◀</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.imageCounter}>
                      {selectedImageIndex + 1} / {images.length}
                    </Text>
                    
                    <TouchableOpacity 
                      style={styles.navigationButton} 
                      onPress={nextImage}
                    >
                      <Text style={styles.navigationButtonText}>▶</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  pickButton: {
    backgroundColor: '#4CAF50',
    marginRight: 10,
  },  cameraButton: {
    backgroundColor: '#2196F3',
    marginLeft: 10,
  },
  analyzeButton: {
    backgroundColor: '#FF9800',
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  imagesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: 10,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: 5,
  },
  imageWrapper: {
    width: '30%',
    aspectRatio: 1,
    margin: 5,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },  removeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'red',
    borderRadius: 15,
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  analyzeImageButton: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    backgroundColor: '#FF9800',
    borderRadius: 15,
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  previewImage: {
    width: width - 40,
    height: height - 200,
    borderRadius: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 30,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '80%',
    position: 'absolute',
    bottom: 50,
  },
  navigationButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },  imageCounter: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 4,
    alignItems: 'center',
  },
  resultText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  confidenceText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});