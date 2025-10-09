import React, { useState } from 'react';
import { uploadApi } from '../services/api';
import Button from './Button';

/**
 * Image Upload component with Azure Blob Storage integration
 * Generates SAS token and uploads image directly to blob storage
 */
const ImageUpload = ({ 
  containerName = 'member-images', 
  onUploadComplete, 
  onUploadError,
  currentImageUrl = null,
  label = 'Upload Image'
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  // Validate file type and size
  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, GIF, or WebP)';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      setPreviewUrl(currentImageUrl);
      return;
    }

    // Clear error and set file
    setError('');
    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');

    try {
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const fileName = `${timestamp}_${selectedFile.name.replace(/\s+/g, '_')}`;

      // Step 1: Generate SAS token
      setProgress(30);
      const sasTokenResponse = await uploadApi.generateSasToken(containerName, fileName);
      const { sasUrl } = sasTokenResponse;

      // Step 2: Upload file to blob storage
      setProgress(60);
      await uploadApi.uploadToBlob(sasUrl, selectedFile);

      // Step 3: Extract blob URL (remove SAS token from URL)
      const blobUrl = sasUrl.split('?')[0];

      setProgress(100);

      // Callback with blob URL
      if (onUploadComplete) {
        onUploadComplete(blobUrl, fileName);
      }

      // Success message
      setError('');
      
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload image. Please try again.';
      setError(errorMessage);
      
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // Clear selection
  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(currentImageUrl);
    setError('');
    setProgress(0);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-text mb-2">
        {label}
      </label>

      {/* Image Preview */}
      {previewUrl && (
        <div className="mb-4">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="max-w-xs max-h-64 rounded-md border border-gray-300 object-cover"
          />
        </div>
      )}

      {/* File Input */}
      <div className="flex items-center space-x-3">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover disabled:opacity-50"
        />
      </div>

      {/* Progress Bar */}
      {uploading && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">Uploading... {progress}%</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-3 bg-red-50 border border-red-400 text-red-700 px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      {selectedFile && !uploading && (
        <div className="mt-3 flex space-x-3">
          <Button 
            onClick={handleUpload}
            variant="primary"
            size="sm"
          >
            Upload to Azure
          </Button>
          <Button 
            onClick={handleClear}
            variant="ghost"
            size="sm"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Helper Text */}
      <p className="mt-2 text-xs text-gray-500">
        Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB.
      </p>
    </div>
  );
};

export default ImageUpload;
