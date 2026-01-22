import api from './api';

const userApi = {

  // 📝 REGISTER USER
  register: (userData) =>
    api.post('/users/register', userData),

  // 🔐 LOGIN
  login: (usernameOrEmail, password) =>
    api.post('/users/login', {
      usernameOrEmail,
      password,
    }),

  // 👤 GET PUBLIC USER PROFILE
  getUserByUsername: (username) =>
    api.get(`/users/${username}`),

  // 🙋‍♀️ GET CURRENT LOGGED-IN USER
  getCurrentUser: () =>
    api.get('/users/me'),

  // 📸 UPLOAD PROFILE PICTURE
  // We removed the manual 'Content-Type'. 
  // We also added a specific config object to allow for longer upload times.
  uploadProfilePicture: (formData) =>
    api.post('/users/me/profile-picture', formData, {
      transformRequest: (data) => data, // Ensures Axios doesn't stringify the FormData
      timeout: 60000, // 60 second timeout specifically for uploads
    }),

  // ✏️ UPDATE PROFILE
  updateProfile: (data) =>
    api.put('/users/me', data),

  // 🗑️ REMOVE PROFILE PICTURE
  removeProfilePicture: () =>
    api.delete('/users/me/profile-picture'),

};

export default userApi;