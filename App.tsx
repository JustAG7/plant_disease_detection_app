import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import ImagePickerComponent from './ImagePicker';
import CameraComponent from './components/CameraComponent';
import ResultsDisplay from './components/ResultsDisplay';
import * as ImagePicker from 'expo-image-picker';
import { PredictionResult } from './services/ModelService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'picker' | 'camera' | 'results'>('picker');
  const [cameraVisible, setCameraVisible] = useState(false);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);

  const handleImagesSelected = (images: ImagePicker.ImagePickerAsset[]) => {
    console.log('Selected images:', images.length);
  };

  const handlePrediction = (result: PredictionResult) => {
    setPredictions(prev => [result, ...prev]);
  };

  const handleClearResults = () => {
    setPredictions([]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'picker':
        return (
          <ImagePickerComponent 
            onImagesSelected={handleImagesSelected}
            onPrediction={handlePrediction}
            maxImages={5}
          />
        );
      case 'results':
        return (
          <ResultsDisplay 
            results={predictions}
            onClearResults={handleClearResults}
          />
        );
      default:
        return (
          <ImagePickerComponent 
            onImagesSelected={handleImagesSelected}
            onPrediction={handlePrediction}
            maxImages={5}
          />
        );
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Plant Disease Detection</Text>
        <Text style={styles.subtitle}>AI-Powered Plant Health Analysis</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'picker' && styles.activeTab]}
          onPress={() => setActiveTab('picker')}
        >
          <Text style={[styles.tabText, activeTab === 'picker' && styles.activeTabText]}>
            📸 Analyze
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, styles.cameraTab]}
          onPress={() => setCameraVisible(true)}
        >
          <Text style={styles.tabText}>📹 Live Camera</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'results' && styles.activeTab]}
          onPress={() => setActiveTab('results')}
        >
          <Text style={[styles.tabText, activeTab === 'results' && styles.activeTabText]}>
            📊 Results ({predictions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Camera Modal */}
      <CameraComponent
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onPrediction={handlePrediction}
      />

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    width: '100%',
    padding: 20,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  cameraTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
});