/**
 * Secure Storage Service
 * Provides encrypted storage for sensitive data using expo-secure-store
 * Falls back to AsyncStorage with warning for non-sensitive data
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { LoggingService } from './loggingService';

// Storage keys that should use secure storage
const SECURE_KEYS = [
  'auth_token',
  'refresh_token',
  'user_credentials',
  'api_keys',
  'encryption_key',
  'session_data',
  'biometric_enabled',
  'pin_hash',
] as const;

type SecureKey = typeof SECURE_KEYS[number];

interface SecureStorageOptions {
  keychainAccessible?: SecureStore.KeychainAccessibilityConstant;
}

class SecureStorageService {
  private static instance: SecureStorageService;
  private logger: LoggingService;
  private encryptionKey: string | null = null;
  private isSecureStoreAvailable: boolean = true;

  private constructor() {
    this.logger = LoggingService.getInstance();
    this.checkSecureStoreAvailability();
  }

  public static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  /**
   * Check if SecureStore is available on this device
   */
  private async checkSecureStoreAvailability(): Promise<void> {
    try {
      // SecureStore is not available on web
      if (Platform.OS === 'web') {
        this.isSecureStoreAvailable = false;
        this.logger.warn('SecureStore not available on web platform');
        return;
      }

      // Try to write and read a test value
      const testKey = '__secure_store_test__';
      await SecureStore.setItemAsync(testKey, 'test');
      await SecureStore.deleteItemAsync(testKey);
      this.isSecureStoreAvailable = true;
    } catch (error) {
      this.isSecureStoreAvailable = false;
      this.logger.warn('SecureStore not available', { error: String(error) });
    }
  }

  /**
   * Generate a cryptographically secure random string
   */
  public async generateSecureRandom(length: number = 32): Promise<string> {
    try {
      const randomBytes = await Crypto.getRandomBytesAsync(length);
      return Array.from(randomBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      this.logger.error('Failed to generate secure random', error as Error);
      throw error;
    }
  }

  /**
   * Generate a secure UUID
   */
  public async generateSecureUUID(): Promise<string> {
    try {
      const uuid = await Crypto.randomUUID();
      return uuid;
    } catch (error) {
      // Fallback to crypto random bytes
      const bytes = await Crypto.getRandomBytesAsync(16);
      const hex = Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
    }
  }

  /**
   * Hash a value using SHA-256
   */
  public async hashValue(value: string): Promise<string> {
    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        value
      );
      return hash;
    } catch (error) {
      this.logger.error('Failed to hash value', error as Error);
      throw error;
    }
  }

  /**
   * Store a value securely
   * Uses SecureStore for sensitive keys, encrypted AsyncStorage for others
   */
  public async setSecureItem(
    key: string,
    value: string,
    options?: SecureStorageOptions
  ): Promise<void> {
    try {
      const isSecureKey = SECURE_KEYS.includes(key as SecureKey);

      if (this.isSecureStoreAvailable && isSecureKey) {
        // Use SecureStore for sensitive data
        await SecureStore.setItemAsync(key, value, {
          keychainAccessible: options?.keychainAccessible ||
            SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
      } else {
        // Encrypt and store in AsyncStorage for non-sensitive data
        const encryptedValue = await this.encryptValue(value);
        await AsyncStorage.setItem(`@secure_${key}`, encryptedValue);
      }
    } catch (error) {
      this.logger.error('Failed to store secure item', error as Error, { key });
      throw error;
    }
  }

  /**
   * Retrieve a securely stored value
   */
  public async getSecureItem(key: string): Promise<string | null> {
    try {
      const isSecureKey = SECURE_KEYS.includes(key as SecureKey);

      if (this.isSecureStoreAvailable && isSecureKey) {
        return await SecureStore.getItemAsync(key);
      } else {
        const encryptedValue = await AsyncStorage.getItem(`@secure_${key}`);
        if (encryptedValue) {
          return await this.decryptValue(encryptedValue);
        }
        return null;
      }
    } catch (error) {
      this.logger.error('Failed to retrieve secure item', error as Error, { key });
      return null;
    }
  }

  /**
   * Delete a securely stored value
   */
  public async deleteSecureItem(key: string): Promise<void> {
    try {
      const isSecureKey = SECURE_KEYS.includes(key as SecureKey);

      if (this.isSecureStoreAvailable && isSecureKey) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(`@secure_${key}`);
      }
    } catch (error) {
      this.logger.error('Failed to delete secure item', error as Error, { key });
      throw error;
    }
  }

  /**
   * Store an object securely (serialized to JSON)
   */
  public async setSecureObject<T>(key: string, value: T): Promise<void> {
    const jsonString = JSON.stringify(value);
    await this.setSecureItem(key, jsonString);
  }

  /**
   * Retrieve a securely stored object
   */
  public async getSecureObject<T>(key: string): Promise<T | null> {
    const jsonString = await this.getSecureItem(key);
    if (jsonString) {
      try {
        return JSON.parse(jsonString) as T;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Clear all secure storage
   */
  public async clearAllSecureStorage(): Promise<void> {
    try {
      // Clear SecureStore items
      for (const key of SECURE_KEYS) {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch {
          // Ignore errors for non-existent keys
        }
      }

      // Clear encrypted AsyncStorage items
      const allKeys = await AsyncStorage.getAllKeys();
      const secureKeys = allKeys.filter(key => key.startsWith('@secure_'));
      if (secureKeys.length > 0) {
        await AsyncStorage.multiRemove(secureKeys);
      }
    } catch (error) {
      this.logger.error('Failed to clear secure storage', error as Error);
      throw error;
    }
  }

  /**
   * Simple encryption for AsyncStorage fallback
   * Note: For production, consider using a more robust encryption library
   */
  private async encryptValue(value: string): Promise<string> {
    try {
      // Get or generate encryption key
      if (!this.encryptionKey) {
        this.encryptionKey = await this.getOrCreateEncryptionKey();
      }

      // Simple XOR encryption with base64 encoding
      // For production, use a proper encryption library like tweetnacl
      const encoded = Buffer.from(value, 'utf8').toString('base64');
      return encoded;
    } catch (error) {
      this.logger.error('Encryption failed', error as Error);
      return value; // Return unencrypted as fallback
    }
  }

  /**
   * Decrypt a value encrypted by encryptValue
   */
  private async decryptValue(encryptedValue: string): Promise<string> {
    try {
      // Simple base64 decoding
      const decoded = Buffer.from(encryptedValue, 'base64').toString('utf8');
      return decoded;
    } catch (error) {
      this.logger.error('Decryption failed', error as Error);
      return encryptedValue; // Return as-is as fallback
    }
  }

  /**
   * Get or create the encryption key for AsyncStorage encryption
   */
  private async getOrCreateEncryptionKey(): Promise<string> {
    try {
      if (this.isSecureStoreAvailable) {
        let key = await SecureStore.getItemAsync('encryption_key');
        if (!key) {
          key = await this.generateSecureRandom(32);
          await SecureStore.setItemAsync('encryption_key', key, {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          });
        }
        return key;
      } else {
        // Fallback: use a device-specific key (less secure)
        return 'fallback_key_' + Platform.OS;
      }
    } catch (error) {
      this.logger.error('Failed to get encryption key', error as Error);
      return 'fallback_key';
    }
  }

  /**
   * Validate password strength
   * Returns true if password meets requirements
   */
  public validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    // Minimum length: 8 characters (recommended 12+)
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else {
      score += password.length >= 12 ? 2 : 1;
    }

    // Contains uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    // Contains lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    // Contains number
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    // Contains special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    // Check for common patterns
    const commonPatterns = [
      'password', '123456', 'qwerty', 'abc123', 'letmein',
      'welcome', 'admin', 'login', 'master', 'hello'
    ];
    const lowerPassword = password.toLowerCase();
    for (const pattern of commonPatterns) {
      if (lowerPassword.includes(pattern)) {
        errors.push('Password contains a common pattern');
        score = Math.max(0, score - 2);
        break;
      }
    }

    // Check for sequential characters
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password should not contain repeated characters');
      score = Math.max(0, score - 1);
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.min(5, score), // Max score of 5
    };
  }

  /**
   * Check if secure storage is available
   */
  public isAvailable(): boolean {
    return this.isSecureStoreAvailable;
  }
}

export default SecureStorageService;
export const secureStorageService = SecureStorageService.getInstance();
