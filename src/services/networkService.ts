import NetInfo from '@react-native-community/netinfo';

export class NetworkService {
  private static instance: NetworkService;
  private onlineStatus: boolean = true;
  private listeners: ((isOnline: boolean) => void)[] = [];

  static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Monitor network state changes
    NetInfo.addEventListener(state => {
      const isOnline = state.isConnected && state.isInternetReachable;
      if (isOnline !== this.onlineStatus) {
        this.onlineStatus = isOnline ?? false;
        this.notifyListeners();
      }
    });

    // Get initial network state
    NetInfo.fetch().then(state => {
      this.onlineStatus = (state.isConnected && state.isInternetReachable) ?? false;
      this.notifyListeners();
    });
  }

  isOnline(): boolean {
    return this.onlineStatus;
  }

  addListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.onlineStatus));
  }

  async waitForConnection(timeout: number = 30000): Promise<boolean> {
    if (this.isOnline()) {
      return true;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeout);

      const unsubscribe = this.addListener((isOnline) => {
        if (isOnline) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }
}

export const networkService = NetworkService.getInstance();
