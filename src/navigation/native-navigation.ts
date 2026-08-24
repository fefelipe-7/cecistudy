import { registerPlugin } from '@capacitor/core';

/**
 * Bridge to NativeNavigation plugin (iOS) for edge swipe-back gesture.
 * Provides methods to enable gesture and report canGoBack state.
 * Listens for native gesture events to trigger logical navigation.
 */
export interface NativeNavigationPlugin {
  enableSwipeBack(): Promise<void>;
  setCanGoBack(value: { value: boolean }): Promise<void>;
  getCanGoBack(): Promise<{ value: boolean }>;
}

const NativeNavigation = registerPlugin<NativeNavigationPlugin>('NativeNavigation');

export const nativeNavigation = {
  enable: () => NativeNavigation.enableSwipeBack(),
  setCanGoBack: (value: boolean) => NativeNavigation.setCanGoBack({ value }),
  getCanGoBack: () => NativeNavigation.getCanGoBack(),
};

// Event listeners are typically set up in the app bootstrap (App.tsx)
// Example usage in App.tsx/AppContext:
//   import { nativeNavigation } from '@/navigation/native-navigation';
//
//   useEffect(() => {
//     if (Capacitor.isNativePlatform()) {
//       nativeNavigation.enable();
//       // Subscribe to completed event to trigger logical navigation
//       window.addEventListener('swipeBackCompletedFromNative', () => {
//         // Handled via Capacitor listener bridge in AppContext
//       });
//     }
//   }, []);
//
//   // Whenever canGoBack changes in AppContext:
//   nativeNavigation.setCanGoBack(app.canGoBack);