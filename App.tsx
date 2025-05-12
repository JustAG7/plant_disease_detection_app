import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import ImagePickerComponent from './ImagePicker'
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  const handleImagesSelected = (images: ImagePicker.ImagePickerAsset[]) => {
    console.log('Selected images:', images.length);
    // Do something with the selected images
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Plant Disease Detection</Text>
      </View>
      <ImagePickerComponent 
        onImagesSelected={handleImagesSelected}
        maxImages={5}
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
});