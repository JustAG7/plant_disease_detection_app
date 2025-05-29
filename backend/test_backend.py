import requests
import base64
import json
from PIL import Image
import io

def test_backend():
    """Test the Flask backend endpoints"""
    base_url = "http://127.0.0.1:5000"
    
    # Test health endpoint
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        print(f"Health check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Health check failed: {e}")
        return False
    
    # Test image prediction with a sample image
    print("\nTesting image prediction...")
    try:
        # Create a small test image
        test_image = Image.new('RGB', (224, 224), color='green')
        buffer = io.BytesIO()
        test_image.save(buffer, format='JPEG')
        image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        payload = {'image': image_base64}
        response = requests.post(f"{base_url}/predict", 
                               json=payload, 
                               headers={'Content-Type': 'application/json'},
                               timeout=10)
        
        print(f"Prediction response: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Prediction result: {json.dumps(result, indent=2)}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Prediction test failed: {e}")
    
    # Test URL prediction
    print("\nTesting URL prediction...")
    try:
        # Use a sample plant image URL
        test_url = "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400"
        payload = {'url': test_url}
        response = requests.post(f"{base_url}/predict_url", 
                               json=payload, 
                               headers={'Content-Type': 'application/json'},
                               timeout=15)
        
        print(f"URL prediction response: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"URL prediction result: {json.dumps(result, indent=2)}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"URL prediction test failed: {e}")

if __name__ == "__main__":
    test_backend()
