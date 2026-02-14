import api from './api';

const followApi = {

  // ➕ FOLLOW / SEND REQUEST
  followUser: (userId) =>
    api.post(`/follow/${userId}`),

  // ✅ ACCEPT FOLLOW REQUEST
  acceptRequest: (userId) =>
    api.post(`/follow/accept/${userId}`),

  // ❌ REJECT FOLLOW REQUEST
  rejectRequest: (userId) =>
    api.post(`/follow/reject/${userId}`),

  // 🔄 CANCEL SENT FOLLOW REQUEST
  cancelRequest: (userId) =>
    api.delete(`/follow/cancel/${userId}`),

  // 🚫 UNFOLLOW USER
  unfollowUser: (userId) =>
    api.delete(`/follow/${userId}`),

  // 📥 GET PENDING REQUESTS (for logged-in user)
  getPendingRequests: () =>
    api.get('/follow/requests'),

  // 👥 GET FOLLOWERS
  getFollowers: (userId) =>
    api.get(`/follow/followers/${userId}`),

  // 👣 GET FOLLOWING
  getFollowing: (userId) =>
    api.get(`/follow/following/${userId}`),

};

export default followApi;
