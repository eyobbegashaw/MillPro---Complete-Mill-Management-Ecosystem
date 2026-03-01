import api from './api';
import { jwtDecode } from 'jwt-decode';

class AuthService {
  constructor() {
    this.tokenKey = 'token';
    this.refreshTokenKey = 'refreshToken';
    this.userKey = 'user';
  }

  // Login with email and password
  async login(email, password, role) {
    try {
      const response = await api.post('/auth/login', { email, password, role });
      
      if (response.data.success) {
        this.setSession(response.data);
        return { success: true, data: response.data };
      }
      
      return { success: false, error: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  }

  // Login with Google
  async googleLogin(tokenId) {
    try {
      const response = await api.post('/auth/google', { token: tokenId });
      
      if (response.data.success) {
        this.setSession(response.data);
        return { success: true, data: response.data };
      }
      
      return { success: false, error: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Google login failed'
      };
    }
  }

  // Register new user
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        this.setSession(response.data);
        return { success: true, data: response.data };
      }
      
      return { success: false, error: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  }

  // Logout
  async logout() {
    try {
      const token = this.getToken();
      if (token) {
        await api.post('/auth/logout', { token });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearSession();
    }
  }

  // Refresh token
  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await api.post('/auth/refresh', { refreshToken });
      
      if (response.data.success) {
        this.setToken(response.data.token);
        if (response.data.refreshToken) {
          this.setRefreshToken(response.data.refreshToken);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Refresh token error:', error);
      this.clearSession();
      return false;
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send reset email'
      };
    }
  }

  // Reset password
  async resetPassword(token, password) {
    try {
      const response = await api.post(`/auth/reset-password/${token}`, { password });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to reset password'
      };
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to change password'
      };
    }
  }

  // Verify email
  async verifyEmail(token) {
    try {
      const response = await api.post(`/auth/verify-email/${token}`);
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to verify email'
      };
    }
  }

  // Resend verification email
  async resendVerification(email) {
    try {
      const response = await api.post('/auth/resend-verification', { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to resend verification'
      };
    }
  }

  // Set session data
  setSession(authResult) {
    this.setToken(authResult.token);
    if (authResult.refreshToken) {
      this.setRefreshToken(authResult.refreshToken);
    }
    this.setUser(authResult.user);
  }

  // Set token
  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  // Get token
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  // Set refresh token
  setRefreshToken(token) {
    localStorage.setItem(this.refreshTokenKey, token);
  }

  // Get refresh token
  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Set user data
  setUser(user) {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Get user data
  getUser() {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Clear session
  clearSession() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired
      if (decoded.exp < currentTime) {
        this.clearSession();
        return false;
      }
      
      return true;
    } catch (error) {
      this.clearSession();
      return false;
    }
  }

  // Get user role
  getUserRole() {
    const user = this.getUser();
    return user?.role || null;
  }

  // Check if user has specific role
  hasRole(role) {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles) {
    const userRole = this.getUserRole();
    return roles.includes(userRole);
  }

  // Get token expiration time
  getTokenExpiration() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000; // Convert to milliseconds
    } catch (error) {
      return null;
    }
  }

  // Check if token is about to expire (within 5 minutes)
  isTokenExpiringSoon() {
    const expTime = this.getTokenExpiration();
    if (!expTime) return true;

    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    return expTime - currentTime < fiveMinutes;
  }
}

export default new AuthService();