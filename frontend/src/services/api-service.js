import api from './api';

export const authService = {
  signup: async (name, email, password, goal) => {
    const { data } = await api.post('/auth/signup', {
      name,
      email,
      password,
      goal,
    });
    return data;
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    return data;
  },

  verifyEmail: async (token) => {
    const { data } = await api.post(`/auth/verify-email/${token}`);
    return data;
  },

  forgotPassword: async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (token, password) => {
    const { data } = await api.post(`/auth/reset-password/${token}`, {
      password,
    });
    return data;
  },

  logout: () => {
    localStorage.clear();
  },
};

export const userService = {
  getProfile: async () => {
    const { data } = await api.get('/users/me');
    return data.user;
  },

  updateProfile: async (profileData) => {
    const { data } = await api.put('/users/profile', profileData);
    return data;
  },

  getPreferences: async () => {
    const { data } = await api.get('/users/preferences');
    return data.preferences;
  },

  updatePreferences: async (preferences) => {
    const { data } = await api.put('/users/preferences', preferences);
    return data;
  },
};

export const taskService = {
  getTasksForDay: async (date) => {
    const { data } = await api.get(`/tasks/day/${date}`);
    return data.tasks;
  },

  getAllTasks: async (startDate, endDate) => {
    const { data } = await api.get('/tasks', {
      params: { startDate, endDate },
    });
    return data.tasks;
  },

  createTask: async (taskData) => {
    const { data } = await api.post('/tasks', taskData);
    return data;
  },

  updateTask: async (taskId, updates) => {
    const { data } = await api.put(`/tasks/${taskId}`, updates);
    return data;
  },

  deleteTask: async (taskId) => {
    const { data } = await api.delete(`/tasks/${taskId}`);
    return data;
  },

  clearDay: async (date) => {
    const { data } = await api.delete(`/tasks/day/${date}`);
    return data;
  },
};

export const adminService = {
  getUsers: async (page = 1, limit = 20, search = '') => {
    const { data } = await api.get('/admin/users', {
      params: { page, limit, search },
    });
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/admin/stats');
    return data.stats;
  },

  getRecentSignups: async () => {
    const { data } = await api.get('/admin/recent-signups');
    return data.users;
  },

  getTopStreaks: async () => {
    const { data } = await api.get('/admin/top-streaks');
    return data.streaks;
  },

  getUserDetail: async (userId) => {
    const { data } = await api.get(`/admin/users/${userId}`);
    return data.user;
  },

  suspendUser: async (userId) => {
    const { data } = await api.put(`/admin/users/${userId}/suspend`);
    return data;
  },

  activateUser: async (userId) => {
    const { data } = await api.put(`/admin/users/${userId}/activate`);
    return data;
  },

  deleteUser: async (userId) => {
    const { data } = await api.delete(`/admin/users/${userId}`);
    return data;
  },
};
