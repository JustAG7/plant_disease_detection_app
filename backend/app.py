import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import json
import io
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Class names based on your dataset
CLASS_NAMES = [
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
    'Strawberry___Leaf_scorch',
    'Strawberry___healthy',
    'Tomato___Bacterial_spot',
    'Tomato___Early_blight',
    'Tomato___Late_blight',
    'Tomato___Leaf_Mold',
    'Tomato___Septoria_leaf_spot',
    'Tomato___Spider_mites Two-spotted_spider_mite',
    'Tomato___Target_Spot',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
    'Tomato___Tomato_mosaic_virus',
    'Tomato___healthy'
]

class PlantDiseaseModel:
    def __init__(self, model_path, device='cpu'):
        self.device = torch.device(device if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
        self.load_model(model_path)
    
    def load_model(self, model_path):
        try:
            # Load the model
            self.model = torch.load(model_path, map_location=self.device)
            self.model.eval()
            logger.info(f"Model loaded successfully from {model_path}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            # Create a dummy model for testing if load fails
            self.model = models.resnet18(pretrained=False)
            self.model.fc = nn.Linear(self.model.fc.in_features, len(CLASS_NAMES))
            self.model.eval()
            logger.info("Using dummy model for testing")
    
    def predict(self, image):
        try:
            # Preprocess image
            input_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Make prediction
            with torch.no_grad():
                outputs = self.model(input_tensor)
                probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
                confidence, predicted_idx = torch.max(probabilities, 0)
            
            predicted_class = CLASS_NAMES[predicted_idx.item()]
            confidence_score = confidence.item()
            
            return {
                'className': predicted_class,
                'confidence': confidence_score,
                'isHealthy': 'healthy' in predicted_class.lower(),
                'plantType': self._extract_plant_type(predicted_class),
                'diseaseType': self._extract_disease_type(predicted_class) if 'healthy' not in predicted_class.lower() else None
            }
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return None
    
    def _extract_plant_type(self, class_name):
        return class_name.split('___')[0].replace('_', ' ')
    
    def _extract_disease_type(self, class_name):
        parts = class_name.split('___')
        if len(parts) > 1 and 'healthy' not in parts[1].lower():
            return parts[1].replace('_', ' ')
        return None

# Initialize model
model_service = PlantDiseaseModel('plant_disease_model.pth')

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'model_loaded': model_service.model is not None})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        
        if 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        # Decode base64 image
        image_data = data['image']
        if image_data.startswith('data:image'):
            # Remove data URL prefix
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # Make prediction
        result = model_service.predict(image)
        
        if result:
            return jsonify(result)
        else:
            return jsonify({'error': 'Prediction failed'}), 500
            
    except Exception as e:
        logger.error(f"Prediction endpoint error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/predict_url', methods=['POST'])
def predict_from_url():
    try:
        import requests
        from PIL import Image
        import io
        
        data = request.get_json()
        
        if 'url' not in data:
            return jsonify({'error': 'No image URL provided'}), 400
        
        image_url = data['url']
        
        # Download image from URL
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(response.content)).convert('RGB')
        
        # Make prediction
        result = model_service.predict(image)
        
        if result:
            return jsonify(result)
        else:
            return jsonify({'error': 'Prediction failed'}), 500
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to download image from URL: {e}")
        return jsonify({'error': f'Failed to download image: {str(e)}'}), 400
    except Exception as e:
        logger.error(f"URL prediction endpoint error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
