import Purchases, { CustomerInfo, PurchasesPackage, LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

export interface RevenueCatConfig {
  apiKey: string;
  userId?: string;
  debugMode?: boolean;
}

export interface ProductInfo {
  identifier: string;
  title: string;
  description: string;
  price: string;
  currencyCode: string;
}

class RevenueCatService {
  private static instance: RevenueCatService;
  private isInitialized = false;
  private debugMode = false;

  static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  async initialize(config: RevenueCatConfig): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      this.debugMode = config.debugMode || false;

      // Configure RevenueCat
      await Purchases.configure({
        apiKey: config.apiKey,
        appUserID: config.userId,
      });

      // Set debug mode
      if (this.debugMode) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      this.isInitialized = true;
      this.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  async setUserId(userId: string): Promise<void> {
    try {
      await Purchases.logIn(userId);
      this.log(`User ID set to: ${userId}`);
    } catch (error) {
      console.error('Failed to set user ID:', error);
      throw error;
    }
  }

  async logOut(): Promise<void> {
    try {
      await Purchases.logOut();
      this.log('User logged out');
    } catch (error) {
      console.error('Failed to log out:', error);
      throw error;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Failed to get customer info:', error);
      throw error;
    }
  }

  async getOfferings(): Promise<any[]> {
    try {
      const offerings = await Purchases.getOfferings();
      return Object.values(offerings.all);
    } catch (error) {
      console.error('Failed to get offerings:', error);
      throw error;
    }
  }

  async getCurrentOffering(): Promise<any | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Failed to get current offering:', error);
      throw error;
    }
  }

  async getProducts(): Promise<ProductInfo[]> {
    try {
      const offering = await this.getCurrentOffering();
      if (!offering) {
        return [];
      }

      return offering.availablePackages.map((pkg: any) => ({
        identifier: pkg.product.identifier,
        title: pkg.product.title,
        description: pkg.product.description,
        price: pkg.product.priceString,
        currencyCode: pkg.product.currencyCode,
      }));
    } catch (error) {
      console.error('Failed to get products:', error);
      throw error;
    }
  }

  async purchaseProduct(productId: string): Promise<CustomerInfo> {
    try {
      const offering = await this.getCurrentOffering();
      if (!offering) {
        throw new Error('No current offering available');
      }

      const pkg = offering.availablePackages.find(
        (p: any) => p.product.identifier === productId
      );

      if (!pkg) {
        throw new Error(`Product ${productId} not found`);
      }

      const result = await Purchases.purchasePackage(pkg);
      this.log(`Purchase successful for: ${productId}`);
      return result.customerInfo;
    } catch (error) {
      console.error('Failed to purchase product:', error);
      throw error;
    }
  }

  async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
    try {
      const result = await Purchases.purchasePackage(pkg);
      this.log(`Package purchase successful: ${pkg.product.identifier}`);
      return result.customerInfo;
    } catch (error) {
      console.error('Failed to purchase package:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      this.log('Purchases restored successfully');
      return customerInfo;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  async checkSubscriptionStatus(): Promise<{
    isActive: boolean;
    activeSubscriptions: string[];
    expirationDate?: Date;
  }> {
    try {
      const customerInfo = await this.getCustomerInfo();
      const activeSubscriptions = Object.keys(customerInfo.activeSubscriptions);
      
      let expirationDate: Date | undefined;
      if (activeSubscriptions.length > 0) {
        // Get the latest expiration date
        const expirationDates = Object.values(customerInfo.allExpirationDates)
          .filter(date => date !== null)
          .map(date => new Date(date!))
          .sort((a, b) => b.getTime() - a.getTime());
        
        expirationDate = expirationDates[0];
      }

      return {
        isActive: activeSubscriptions.length > 0,
        activeSubscriptions,
        expirationDate,
      };
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      throw error;
    }
  }

  async getEntitlements(): Promise<Record<string, boolean>> {
    try {
      const customerInfo = await this.getCustomerInfo();
      const entitlements: Record<string, boolean> = {};
      
      Object.entries(customerInfo.entitlements.active).forEach(([key, entitlement]) => {
        entitlements[key] = entitlement.isActive;
      });

      return entitlements;
    } catch (error) {
      console.error('Failed to get entitlements:', error);
      throw error;
    }
  }

  isEntitlementActive(entitlementId: string): Promise<boolean> {
    return this.getEntitlements().then(entitlements => {
      return entitlements[entitlementId] || false;
    });
  }

  // Helper method for logging
  private log(message: string): void {
    if (this.debugMode) {
      console.log(`[RevenueCat] ${message}`);
    }
  }

  // Get platform-specific API key
  static getPlatformApiKey(): string {
    return Platform.select({
      ios: process.env['EXPO_PUBLIC_REVENUECAT_IOS_API_KEY'] || 'your_ios_api_key_here',
      android: process.env['EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY'] || 'your_android_api_key_here',
      default: 'your_default_api_key_here',
    });
  }
}

export default RevenueCatService;
