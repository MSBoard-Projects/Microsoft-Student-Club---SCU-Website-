import apiClient from './apiClient';

// Authentication API endpoints
export const authApi = {
  // Login user
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },
};

// Members API endpoints
export const membersApi = {
  // Get all members
  getAll: async () => {
    const response = await apiClient.get('/members');
    return response.data;
  },
  
  // Get member by ID
  getById: async (id) => {
    const response = await apiClient.get(`/members/${id}`);
    return response.data;
  },
  
  // Get members by type (e.g., "High Board", "Board", "Golden Member")
  getByType: async (typeName) => {
    const response = await apiClient.get(`/members/type/${typeName}`);
    return response.data;
  },
  
  // Create new member (Admin only)
  create: async (memberData) => {
    const response = await apiClient.post('/members', memberData);
    return response.data;
  },
  
  // Update member (Admin only)
  update: async (id, memberData) => {
    const response = await apiClient.put(`/members/${id}`, memberData);
    return response.data;
  },
  
  // Delete member (Admin only)
  delete: async (id) => {
    const response = await apiClient.delete(`/members/${id}`);
    return response.data;
  },
};

// Events API endpoints
export const eventsApi = {
  // Get all events
  getAll: async () => {
    const response = await apiClient.get('/events');
    return response.data;
  },
  
  // Get upcoming events
  getUpcoming: async () => {
    const response = await apiClient.get('/events/upcoming');
    return response.data;
  },
  
  // Get featured events
  getFeatured: async () => {
    const response = await apiClient.get('/events/featured');
    return response.data;
  },
  
  // Create new event (Admin only)
  create: async (eventData) => {
    const response = await apiClient.post('/events', eventData);
    return response.data;
  },
  
  // Update event (Admin only)
  update: async (id, eventData) => {
    const response = await apiClient.put(`/events/${id}`, eventData);
    return response.data;
  },
  
  // Delete event (Admin only)
  delete: async (id) => {
    const response = await apiClient.delete(`/events/${id}`);
    return response.data;
  },
};

// Site Content API endpoints
export const siteContentApi = {
  // Get all site content
  getAll: async () => {
    const response = await apiClient.get('/sitecontent');
    return response.data;
  },
  
  // Get content by key
  getByKey: async (key) => {
    const response = await apiClient.get(`/sitecontent/${key}`);
    return response.data;
  },
  
  // Create new content (Admin only)
  create: async (contentData) => {
    const response = await apiClient.post('/sitecontent', contentData);
    return response.data;
  },
  
  // Update content (Admin only)
  update: async (key, contentData) => {
    const response = await apiClient.put(`/sitecontent/${key}`, contentData);
    return response.data;
  },
  
  // Delete content (Admin only)
  delete: async (key) => {
    const response = await apiClient.delete(`/sitecontent/${key}`);
    return response.data;
  },
};

// Admin Users API endpoints (SuperAdmin only)
export const adminUsersApi = {
  // Get all admin users
  getAll: async () => {
    const response = await apiClient.get('/admin/users');
    return response.data;
  },
  
  // Get admin user by ID
  getById: async (id) => {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data;
  },
  
  // Create new admin user
  create: async (userData) => {
    const response = await apiClient.post('/admin/users', userData);
    return response.data;
  },
  
  // Update admin user
  update: async (id, userData) => {
    const response = await apiClient.put(`/admin/users/${id}`, userData);
    return response.data;
  },
  
  // Delete admin user
  delete: async (id) => {
    const response = await apiClient.delete(`/admin/users/${id}`);
    return response.data;
  },
};

// Upload API endpoints
export const uploadApi = {
  // Generate SAS token for blob upload
  generateSasToken: async (containerName, fileName) => {
    const response = await apiClient.post('/upload/generate-sas-token', {
      containerName,
      fileName,
    });
    return response.data;
  },
  
  // Upload file to blob storage using SAS token
  uploadToBlob: async (sasUrl, file) => {
    const response = await fetch(sasUrl, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.type,
      },
      body: file,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload file to blob storage');
    }
    
    return response;
  },
};
