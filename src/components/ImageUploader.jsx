import React, { useState } from 'react';
import { Form, Spinner, Alert } from 'react-bootstrap';
import { vendorApi } from '../services/api';

/**
 * Image Uploader Component
 * 
 * This component provides image upload functionality for product images
 * It handles both main product images and additional/sub images
 */
const ImageUploader = ({ 
  onImageUploaded, 
  isMainImage = true,
  buttonLabel = "Upload Image",
  className = ""
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', isMainImage ? 'main' : 'support');
      
      // Call the vendor API to upload the image
      const response = await vendorApi.uploadProductImage(formData);
      console.log(response);
      if (response.data && response.data.success) {
        const imageUrl = response.data.imageUrl;
        onImageUploaded(imageUrl, isMainImage);
      } else {
        throw new Error(response.data?.message || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      <div className="d-flex align-items-center gap-2">
        <Form.Control 
          type="file" 
          accept="image/*" 
          onChange={handleImageUpload} 
          disabled={uploading}
        />
        {uploading && <Spinner animation="border" size="sm" />}
      </div>
      
      {error && (
        <Alert variant="danger" className="mt-2 py-1 px-2">
          <small>{error}</small>
        </Alert>
      )}
    </div>
  );
};

export default ImageUploader;
