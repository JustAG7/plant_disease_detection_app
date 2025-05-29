import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { modelService, PredictionResult } from '../services/ModelService';

interface CameraComponentProps {
  visible: boolean;
  onClose: () => void;
  onPrediction: (result: PredictionResult) => void;
}

export default function CameraComponent({ visible, onClose, onPrediction }: CameraComponentProps) {
  // All hooks must be called at the top level in the same order every time
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastPrediction, setLastPrediction] = useState<PredictionResult | null>(null);
  const [autoCapture, setAutoCapture] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const loadModel = useCallback(async () => {
    const loaded = await modelService.loadModel();
    if (!loaded) {
      Alert.alert('Error', 'Failed to load the plant disease detection model');
    }
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    if (!cameraRef.current || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo) {
        // Analyze the captured image
        const prediction = await modelService.predictImage(photo.uri);
        
        if (prediction) {
          setLastPrediction(prediction);
          onPrediction(prediction);
          
          // Show result alert
          const message = prediction.isHealthy 
            ? `Plant appears healthy!\nPlant: ${prediction.plantType}\nConfidence: ${(prediction.confidence * 100).toFixed(1)}%`
            : `Disease detected!\nPlant: ${prediction.plantType}\nDisease: ${prediction.diseaseType}\nConfidence: ${(prediction.confidence * 100).toFixed(1)}%`;
          
          Alert.alert('Analysis Result', message);
        } else {
          Alert.alert('Error', 'Failed to analyze the image');
        }
      }
    } catch (error) {
      console.error('Error capturing and analyzing:', error);
      Alert.alert('Error', 'Failed to capture and analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, onPrediction]);

  const toggleAutoCapture = useCallback(() => {
    setAutoCapture(!autoCapture);
    if (!autoCapture) {
      // Start auto capture mode
      Alert.alert(
        'Auto Capture Mode',
        'Camera will automatically analyze plants in view every 3 seconds',
        [{ text: 'OK' }]
      );
    }
  }, [autoCapture]);

  useEffect(() => {
    if (visible && !modelService.isModelLoaded()) {
      loadModel();
    }
  }, [visible, loadModel]);

  // Auto capture effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoCapture && visible && !isAnalyzing) {
      interval = setInterval(() => {
        captureAndAnalyze();
      }, 3000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoCapture, visible, isAnalyzing, captureAndAnalyze]);

  // Early returns for permission handling
  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.permissionContainer}>
            <Text style={styles.message}>We need your permission to show the camera</Text>
            <TouchableOpacity style={styles.button} onPress={requestPermission}>
              <Text style={styles.buttonText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <Text style={styles.headerButtonText}>✕ Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Detection</Text>
          <TouchableOpacity style={styles.headerButton} onPress={toggleCameraFacing}>
            <Text style={styles.headerButtonText}>🔄 Flip</Text>
          </TouchableOpacity>
        </View>

        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.overlay}>
            {/* Detection frame */}
            <View style={styles.detectionFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            
            {/* Analysis indicator */}
            {isAnalyzing && (
              <View style={styles.analysisIndicator}>
                <ActivityIndicator size="large" color="white" />
                <Text style={styles.analysisText}>Analyzing...</Text>
              </View>
            )}

            {/* Last prediction display */}
            {lastPrediction && !isAnalyzing && (
              <View style={styles.predictionDisplay}>
                <Text style={styles.predictionTitle}>Last Result:</Text>
                <Text style={[
                  styles.predictionText,
                  { color: lastPrediction.isHealthy ? '#4CAF50' : '#F44336' }
                ]}>
                  {lastPrediction.isHealthy ? '✓ Healthy' : '⚠ Disease Detected'}
                </Text>
                <Text style={styles.predictionDetails}>
                  {lastPrediction.plantType}
                  {lastPrediction.diseaseType && ` - ${lastPrediction.diseaseType}`}
                </Text>
                <Text style={styles.confidenceText}>
                  {(lastPrediction.confidence * 100).toFixed(1)}% confidence
                </Text>
              </View>
            )}
          </View>
        </CameraView>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, autoCapture && styles.activeButton]}
            onPress={toggleAutoCapture}
          >
            <Text style={styles.controlButtonText}>
              {autoCapture ? '⏹ Stop Auto' : '🔄 Auto Scan'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, isAnalyzing && styles.disabledButton]}
            onPress={captureAndAnalyze}
            disabled={isAnalyzing}
          >
            <Text style={styles.captureButtonText}>
              {isAnalyzing ? 'Analyzing...' : '📸 Analyze'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={() => setLastPrediction(null)}>
            <Text style={styles.controlButtonText}>🗑 Clear</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 20,
    fontSize: 16,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  headerButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  headerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    margin: 20,
  },
  detectionFrame: {
    flex: 1,
    margin: 40,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#4CAF50',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  analysisIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    borderRadius: 10,
  },
  analysisText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  predictionDisplay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 15,
    borderRadius: 10,
  },
  predictionTitle: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },
  predictionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  predictionDetails: {
    color: 'white',
    fontSize: 14,
    marginBottom: 3,
  },
  confidenceText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  controlButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#4CAF50',
  },
  controlButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  captureButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 50,
    minWidth: 120,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  captureButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 10,
  },
  closeButton: {
    backgroundColor: '#666',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
