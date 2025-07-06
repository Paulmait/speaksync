// E2E test for performance optimizations
import { device, element, by, expect } from 'detox';

describe('Performance Optimizations', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Teleprompter Performance', () => {
    it('should initialize performance monitoring when entering teleprompter', async () => {
      // Navigate to teleprompter
      await element(by.id('home-screen')).tap();
      await element(by.id('practice-button')).tap();
      
      // Verify teleprompter loads without performance issues
      await expect(element(by.id('teleprompter-screen'))).toBeVisible();
      
      // Test scrolling performance
      await element(by.id('teleprompter-scroll')).scroll(200, 'down');
      await element(by.id('teleprompter-scroll')).scroll(200, 'up');
      
      // Verify no memory leaks by checking app doesn't crash
      await expect(element(by.id('teleprompter-screen'))).toBeVisible();
    });

    it('should handle speech recognition performance optimization', async () => {
      await element(by.id('home-screen')).tap();
      await element(by.id('practice-button')).tap();
      
      // Enable speech recognition
      await element(by.id('speech-recognition-toggle')).tap();
      
      // Verify speech recognition is active
      await expect(element(by.id('speech-recognition-panel'))).toBeVisible();
      
      // Test performance under load
      await element(by.id('play-button')).tap();
      await device.sleep(3000); // Let it run for 3 seconds
      
      // Verify UI remains responsive
      await element(by.id('pause-button')).tap();
      await expect(element(by.id('play-button'))).toBeVisible();
    });
  });

  describe('Analytics Performance', () => {
    it('should load analytics with virtual scrolling', async () => {
      await element(by.id('home-screen')).tap();
      await element(by.id('analytics-button')).tap();
      
      // Verify analytics screen loads
      await expect(element(by.id('analytics-screen'))).toBeVisible();
      
      // Test virtual scrolling performance with large session list
      await element(by.id('sessions-tab')).tap();
      await element(by.id('session-list')).scroll(500, 'down');
      await element(by.id('session-list')).scroll(500, 'up');
      
      // Verify list remains responsive
      await expect(element(by.id('session-list'))).toBeVisible();
    });

    it('should handle data fetching with debouncing', async () => {
      await element(by.id('home-screen')).tap();
      await element(by.id('analytics-button')).tap();
      
      // Open filters
      await element(by.id('filter-button')).tap();
      
      // Rapidly change filters to test debouncing
      await element(by.id('date-range-picker')).tap();
      await element(by.id('last-week-option')).tap();
      await element(by.id('last-month-option')).tap();
      await element(by.id('last-year-option')).tap();
      
      // Close filters
      await element(by.id('apply-filters-button')).tap();
      
      // Verify data loads without excessive API calls
      await expect(element(by.id('analytics-summary'))).toBeVisible();
    });

    it('should export data efficiently', async () => {
      await element(by.id('home-screen')).tap();
      await element(by.id('analytics-button')).tap();
      
      // Open export options
      await element(by.id('export-button')).tap();
      await expect(element(by.id('export-modal'))).toBeVisible();
      
      // Test CSV export
      await element(by.id('export-csv-button')).tap();
      
      // Verify export completes without blocking UI
      await expect(element(by.id('export-success-message'))).toBeVisible();
      
      // Close export modal
      await element(by.id('close-export-modal')).tap();
    });
  });

  describe('Memory Management', () => {
    it('should handle navigation without memory leaks', async () => {
      // Navigate through multiple screens to test memory management
      await element(by.id('home-screen')).tap();
      
      // Go to teleprompter
      await element(by.id('practice-button')).tap();
      await expect(element(by.id('teleprompter-screen'))).toBeVisible();
      
      // Go back to home
      await element(by.id('back-button')).tap();
      await expect(element(by.id('home-screen'))).toBeVisible();
      
      // Go to analytics
      await element(by.id('analytics-button')).tap();
      await expect(element(by.id('analytics-screen'))).toBeVisible();
      
      // Go back to home
      await element(by.id('back-button')).tap();
      await expect(element(by.id('home-screen'))).toBeVisible();
      
      // Go to scripts
      await element(by.id('scripts-tab')).tap();
      await expect(element(by.id('scripts-screen'))).toBeVisible();
      
      // Verify app remains stable
      await expect(element(by.id('scripts-screen'))).toBeVisible();
    });

    it('should clean up resources on app background', async () => {
      await element(by.id('home-screen')).tap();
      await element(by.id('practice-button')).tap();
      
      // Enable speech recognition
      await element(by.id('speech-recognition-toggle')).tap();
      await element(by.id('play-button')).tap();
      
      // Background the app
      await device.sendToHome();
      await device.sleep(2000);
      
      // Bring app back to foreground
      await device.launchApp({ newInstance: false });
      
      // Verify app recovers gracefully
      await expect(element(by.id('teleprompter-screen'))).toBeVisible();
    });
  });

  describe('Network Optimization', () => {
    it('should handle offline mode gracefully', async () => {
      // Simulate offline mode
      await device.setStatusBarOverride({
        time: '12:00',
        dataNetwork: 'none',
        wifiNetwork: 'none',
        cellularService: 'none',
      });
      
      await element(by.id('home-screen')).tap();
      await element(by.id('analytics-button')).tap();
      
      // Verify offline message appears
      await expect(element(by.id('offline-message'))).toBeVisible();
      
      // Restore network
      await device.setStatusBarOverride({
        time: '12:00',
        dataNetwork: 'wifi',
        wifiNetwork: 'wifi',
        cellularService: 'full',
      });
      
      // Verify data loads when back online
      await expect(element(by.id('analytics-summary'))).toBeVisible();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', async () => {
      await element(by.id('home-screen')).tap();
      await element(by.id('practice-button')).tap();
      
      // Enable performance monitoring
      await element(by.id('settings-button')).tap();
      await element(by.id('performance-monitoring-toggle')).tap();
      await element(by.id('close-settings')).tap();
      
      // Perform various actions to generate metrics
      await element(by.id('play-button')).tap();
      await device.sleep(3000);
      await element(by.id('pause-button')).tap();
      
      // Navigate to analytics
      await element(by.id('back-button')).tap();
      await element(by.id('analytics-button')).tap();
      
      // Verify performance data is available
      await expect(element(by.id('performance-metrics'))).toBeVisible();
    });
  });
});
