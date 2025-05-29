import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { PredictionResult } from '../services/ModelService';

interface ResultsDisplayProps {
  results: PredictionResult[];
  onClearResults: () => void;
}

export default function ResultsDisplay({ results, onClearResults }: ResultsDisplayProps) {
  const handleClearResults = () => {
    Alert.alert(
      'Clear Results',
      'Are you sure you want to clear all results?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: onClearResults },
      ]
    );
  };

  const getResultIcon = (result: PredictionResult) => {
    if (result.isHealthy) {
      return '✅';
    } else {
      return result.confidence > 0.8 ? '⚠️' : '❓';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4CAF50';
    if (confidence >= 0.6) return '#FF9800';
    return '#F44336';
  };

  const formatPlantName = (plantType: string) => {
    return plantType
      .split(/[_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatDiseaseName = (diseaseType?: string) => {
    if (!diseaseType) return '';
    return diseaseType
      .split(/[_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (results.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No analysis results yet</Text>
        <Text style={styles.emptySubtext}>
          Use the camera or image picker to analyze plants
        </Text>
      </View>
    );
  }

  const healthyCount = results.filter(r => r.isHealthy).length;
  const diseaseCount = results.length - healthyCount;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analysis Results ({results.length})</Text>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearResults}>
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{healthyCount}</Text>
          <Text style={styles.statLabel}>Healthy</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#F44336' }]}>{diseaseCount}</Text>
          <Text style={styles.statLabel}>Diseases</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {results.length > 0 ? ((healthyCount / results.length) * 100).toFixed(0) : 0}%
          </Text>
          <Text style={styles.statLabel}>Health Rate</Text>
        </View>
      </View>

      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {results.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultIcon}>{getResultIcon(result)}</Text>
              <View style={styles.resultInfo}>
                <Text style={styles.plantName}>
                  {formatPlantName(result.plantType)}
                </Text>
                <Text style={[
                  styles.statusText,
                  { color: result.isHealthy ? '#4CAF50' : '#F44336' }
                ]}>
                  {result.isHealthy ? 'Healthy' : formatDiseaseName(result.diseaseType)}
                </Text>
              </View>
              <View style={styles.confidenceContainer}>
                <Text style={[
                  styles.confidenceText,
                  { color: getConfidenceColor(result.confidence) }
                ]}>
                  {(result.confidence * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
            
            {!result.isHealthy && result.diseaseType && (
              <View style={styles.diseaseDetails}>
                <Text style={styles.diseaseTitle}>Disease Information:</Text>
                <Text style={styles.diseaseText}>
                  {formatDiseaseName(result.diseaseType)}
                </Text>
                {result.confidence < 0.7 && (
                  <Text style={styles.warningText}>
                    ⚠️ Low confidence - consider taking another photo
                  </Text>
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    backgroundColor: '#F44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  resultItem: {
    backgroundColor: 'white',
    marginVertical: 5,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  resultInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confidenceContainer: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  diseaseDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  diseaseTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  diseaseText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  warningText: {
    fontSize: 12,
    color: '#FF9800',
    fontStyle: 'italic',
  },
});
