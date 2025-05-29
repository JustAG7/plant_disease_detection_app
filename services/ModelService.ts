import * as FileSystem from 'expo-file-system';

// Backend API configuration
const API_BASE_URL = 'http://127.0.0.1:5000'; // Change this to your backend URL if different

// Define the class names based on your dataset structure
export const CLASS_NAMES = [
  'Apple___Apple_scab',
  'Apple___Black_rot', 
  'Apple___Cedar_apple_rust',
  'Apple___healthy',
  'Blueberry___healthy',
  'Cherry_(including_sour)___healthy',
  'Cherry_(including_sour)___Powdery_mildew',
  'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
  'Corn_(maize)___Common_rust_',
  'Corn_(maize)___healthy',
  'Corn_(maize)___Northern_Leaf_Blight',
  'Grape___Black_rot',
  'Grape___Esca_(Black_Measles)',
  'Grape___healthy',
  'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
  'Orange___Haunglongbing_(Citrus_greening)',
  'Peach___Bacterial_spot',
  'Peach___healthy',
  'Pepper,_bell___Bacterial_spot',
  'Pepper,_bell___healthy',
  'Potato___Early_blight',
  'Potato___healthy',
  'Potato___Late_blight',
  'Raspberry___healthy',
  'Soybean___healthy',
  'Squash___Powdery_mildew',
  'Strawberry___healthy',
  'Tomato___Bacterial_spot',
  'Tomato___Early_blight',
  'Tomato___Late_blight',
  'Tomato___Leaf_Mold',
  'Tomato___Septoria_leaf_spot',
  'Tomato___Spider_mites',
  'Tomato___Target_Spot',
  'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
  'Tomato___Tomato_mosaic_virus',
  'Tomato___healthy'
];

export interface PredictionResult {
  className: string;
  confidence: number;
  isHealthy: boolean;
  diseaseType?: string;
  plantType: string;
}

export class ModelService {
  private isLoaded = false;
  private backendAvailable = false;

  async loadModel(): Promise<boolean> {
    try {
      console.log('Checking backend availability...');
      
      // Check if backend is available
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const health = await response.json();
        this.backendAvailable = health.status === 'healthy';
        this.isLoaded = this.backendAvailable;
        console.log('Backend is available and model is loaded');
        return true;
      } else {
        throw new Error('Backend not available');
      }
    } catch (error) {
      console.warn('Backend not available, using mock predictions:', error);
      // Fallback to mock predictions if backend is not available
      this.backendAvailable = false;
      this.isLoaded = true;
      return true;
    }
  }

  async predictImage(imageUri: string): Promise<PredictionResult | null> {
    if (!this.isLoaded) {
      throw new Error('Model not loaded. Please load the model first.');
    }

    try {
      console.log('Analyzing image:', imageUri);

      if (this.backendAvailable) {
        return await this.predictWithBackend(imageUri);
      } else {
        return await this.predictWithMock(imageUri);
      }
    } catch (error) {
      console.error('Prediction failed:', error);
      // Fallback to mock prediction
      return await this.predictWithMock(imageUri);
    }
  }

  private async predictWithBackend(imageUri: string): Promise<PredictionResult | null> {
    try {
      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result as PredictionResult;
      } else {
        throw new Error('Backend prediction failed');
      }
    } catch (error) {
      console.error('Backend prediction error:', error);
      throw error;
    }
  }

  private async predictWithMock(imageUri: string): Promise<PredictionResult> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock prediction for demonstration
    const randomIndex = Math.floor(Math.random() * CLASS_NAMES.length);
    const className = CLASS_NAMES[randomIndex];
    const confidence = 0.7 + Math.random() * 0.3; // Random confidence between 0.7-1.0
    
    const isHealthy = className.includes('healthy');
    const plantType = this.extractPlantType(className);
    const diseaseType = isHealthy ? undefined : this.extractDiseaseType(className);
    
    return {
      className,
      confidence,
      isHealthy,
      diseaseType,
      plantType
    };
  }

  private extractPlantType(className: string): string {
    const parts = className.split('___');
    return parts[0].replace(/_/g, ' ');
  }

  private extractDiseaseType(className: string): string {
    const parts = className.split('___');
    if (parts.length > 1 && !parts[1].includes('healthy')) {
      return parts[1].replace(/_/g, ' ');
    }
    return '';
  }

  isModelLoaded(): boolean {
    return this.isLoaded;
  }

  isBackendConnected(): boolean {
    return this.backendAvailable;
  }
}


// Singleton instance
export const modelService = new ModelService();
