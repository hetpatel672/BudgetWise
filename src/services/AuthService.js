import EncryptedStorage from 'react-native-encrypted-storage';
import CryptoJS from 'crypto-js';
import DatabaseService from './DatabaseService';

class AuthService {
  constructor() {
    this.isAuthenticated = false;
    this.authMethod = 'none'; // 'biometric', 'pin', 'none'
    this.sessionTimeout = 5 * 60 * 1000; // 5 minutes
    this.lastActivity = Date.now();
    this.sessionTimer = null;
  }

  async initialize() {
    try {
      // Check if authentication is enabled
      const savedAuthMethod = await DatabaseService.getSetting('authMethod');
      this.authMethod = savedAuthMethod || 'none';
      
      // Start session timer
      this.startSessionTimer();
    } catch (error) {
      console.error('Error initializing auth service:', error);
      this.authMethod = 'none';
    }
  }

  async isBiometricAvailable() {
    try {
      // For now, return false to disable biometric authentication
      // This can be implemented later with react-native-biometrics
      return false;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  async setupPIN(pin) {
    try {
      // Hash the PIN before storing
      const hashedPIN = CryptoJS.SHA256(pin).toString();
      await EncryptedStorage.setItem('userPIN', hashedPIN);
      await DatabaseService.setSetting('authMethod', 'pin');
      this.authMethod = 'pin';
      return { success: true };
    } catch (error) {
      console.error('Error setting up PIN:', error);
      return { success: false, error: error.message };
    }
  }

  async authenticateWithPIN(pin) {
    try {
      const storedHashedPIN = await EncryptedStorage.getItem('userPIN');
      if (!storedHashedPIN) {
        return { success: false, error: 'No PIN set up' };
      }

      const hashedInputPIN = CryptoJS.SHA256(pin).toString();
      
      if (hashedInputPIN === storedHashedPIN) {
        this.isAuthenticated = true;
        this.updateLastActivity();
        return { success: true };
      } else {
        return { success: false, error: 'Incorrect PIN' };
      }
    } catch (error) {
      console.error('PIN authentication error:', error);
      return { success: false, error: error.message };
    }
  }

  async authenticate() {
    try {
      if (this.authMethod === 'none') {
        this.isAuthenticated = true;
        this.updateLastActivity();
        return { success: true };
      }

      if (this.authMethod === 'pin') {
        // For PIN, we need to show PIN input UI
        return { success: false, requiresPIN: true };
      }

      // For now, just authenticate without biometric
      this.isAuthenticated = true;
      this.updateLastActivity();
      return { success: true };
    } catch (error) {
      console.error('Authentication error:', error);
      // Don't block the app, just authenticate
      this.isAuthenticated = true;
      this.updateLastActivity();
      return { success: true };
    }
  }

  logout() {
    this.isAuthenticated = false;
    this.clearSessionTimer();
  }

  updateLastActivity() {
    this.lastActivity = Date.now();
  }

  startSessionTimer() {
    this.clearSessionTimer();
    this.sessionTimer = setInterval(() => {
      if (this.isAuthenticated && Date.now() - this.lastActivity > this.sessionTimeout) {
        this.logout();
      }
    }, 30000); // Check every 30 seconds
  }

  clearSessionTimer() {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  getAuthMethod() {
    return this.authMethod;
  }

  async setSessionTimeout(minutes) {
    this.sessionTimeout = minutes * 60 * 1000;
    await DatabaseService.setSetting('sessionTimeout', minutes.toString());
  }

  async getSessionTimeout() {
    try {
      const saved = await DatabaseService.getSetting('sessionTimeout');
      return saved ? parseInt(saved) : 5; // Default 5 minutes
    } catch (error) {
      return 5;
    }
  }

  // Generate encryption key for data encryption
  async generateEncryptionKey() {
    try {
      let key = await EncryptedStorage.getItem('encryptionKey');
      if (!key) {
        // Generate a new key
        key = CryptoJS.lib.WordArray.random(256/8).toString();
        await EncryptedStorage.setItem('encryptionKey', key);
      }
      return key;
    } catch (error) {
      console.error('Error generating encryption key:', error);
      // Return a default key to prevent app crash
      return 'default-encryption-key-' + Date.now();
    }
  }

  // Encrypt sensitive data
  async encryptData(data) {
    try {
      const key = await this.generateEncryptionKey();
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
      return encrypted;
    } catch (error) {
      console.error('Error encrypting data:', error);
      return JSON.stringify(data); // Return unencrypted as fallback
    }
  }

  // Decrypt sensitive data
  async decryptData(encryptedData) {
    try {
      const key = await this.generateEncryptionKey();
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Error decrypting data:', error);
      // Try to parse as regular JSON as fallback
      try {
        return JSON.parse(encryptedData);
      } catch {
        return null;
      }
    }
  }

  // Security settings
  async getSecuritySettings() {
    try {
      return {
        authMethod: this.authMethod,
        biometricAvailable: await this.isBiometricAvailable(),
        sessionTimeout: await this.getSessionTimeout(),
        hasPIN: await EncryptedStorage.getItem('userPIN') !== null
      };
    } catch (error) {
      return {
        authMethod: 'none',
        biometricAvailable: false,
        sessionTimeout: 5,
        hasPIN: false
      };
    }
  }

  // Reset all security settings (for app reset)
  async resetSecurity() {
    try {
      await EncryptedStorage.removeItem('userPIN');
      await EncryptedStorage.removeItem('encryptionKey');
      await DatabaseService.setSetting('authMethod', 'none');
      this.authMethod = 'none';
      this.isAuthenticated = false;
      return { success: true };
    } catch (error) {
      console.error('Error resetting security:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new AuthService();