# Plant Disease Detection App

A React Native Expo app with AI-powered plant disease detection using PyTorch models. This app allows users to analyze plant images through both static image analysis and live camera feed.

## Features

- 📸 **Image Analysis**: Upload or capture photos to detect plant diseases
- 📹 **Live Camera Detection**: Real-time plant health analysis using device camera
- 🔬 **AI-Powered**: Uses PyTorch models for accurate disease identification
- 📊 **Results Tracking**: View analysis history and statistics
- 🎯 **Multi-Plant Support**: Supports various plant types (tomato, apple, corn, etc.)

## Setup Instructions

### Frontend (React Native)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npx expo start
   ```

3. **Run on device**:
   - Scan QR code with Expo Go app (iOS/Android)
   - Or use simulators: `npx expo start --ios` or `npx expo start --android`

### Backend (Python)

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Place your trained model**:
   - Copy your `.pth` model file to `backend/plant_disease_model.pth`
   - Or update the path in `backend/app.py`

4. **Start the Flask server**:
   ```bash
   python app.py
   ```

The backend will run on `http://localhost:5000`

## Model Integration

### Using Your Own .pth Model

1. **Place your model file** in the `backend/` directory as `plant_disease_model.pth`

2. **Update class names** in both:
   - `backend/app.py` - Update the `CLASS_NAMES` list
   - `services/ModelService.ts` - Update the `CLASS_NAMES` array

3. **Model Requirements**:
   - Input: 224x224 RGB images
   - Output: Classification logits for plant disease classes
   - Format: PyTorch (.pth) model file

## App Usage

### 1. Image Analysis Tab
- **Pick Images**: Select photos from device gallery
- **Take Photo**: Capture new images with camera
- **Analyze All**: Process all selected images for disease detection

### 2. Live Camera Tab
- **Start Camera**: Opens live camera feed
- **Auto Scan**: Automatically analyzes plants every 3 seconds
- **Manual Capture**: Tap "📸 Analyze" to capture and analyze current frame

### 3. Results Tab
- **View History**: See all previous analysis results
- **Statistics**: Health rate and disease counts

## Configuration

Update the backend URL in `services/ModelService.ts` for your environment:
```typescript
const API_BASE_URL = 'http://your-backend-url:5000';
```