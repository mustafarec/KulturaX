/**
 * SuperwallService - Paywall ve abonelik yönetimi
 * 
 * expo-superwall hook-based API kullanır.
 * 
 * Kurulum:
 * 1. App.tsx'de SuperwallProvider ile uygulamayı sarmalayın
 * 2. Component'lerde useSuperwall veya usePlacement hook'larını kullanın
 * 
 * Örnek kullanım:
 * ```tsx
 * import { useSuperwall } from 'expo-superwall';
 * 
 * function MyComponent() {
 *   const { identify, reset, subscriptionStatus } = useSuperwall();
 *   
 *   // Kullanıcı login olduğunda
 *   await identify(userId);
 *   
 *   // Abonelik durumu kontrolü
 *   if (subscriptionStatus === 'ACTIVE') {
 *     // Premium özellikler
 *   }
 * }
 * ```
 * 
 * Paywall tetikleme:
 * ```tsx
 * import { usePlacement } from 'expo-superwall';
 * 
 * function PremiumFeatureButton() {
 *   const { register, state } = usePlacement('premium_feature');
 *   
 *   const handlePress = async () => {
 *     const result = await register();
 *     if (result.status === 'userAccess') {
 *       // Kullanıcı erişime sahip, devam et
 *     }
 *   };
 * }
 * ```
 */

// Re-export hooks and components from expo-superwall
export {
    SuperwallProvider,
    useSuperwall,
    usePlacement,
    useSuperwallEvents
} from 'expo-superwall';

// Superwall API key constants - .env dosyasından yüklenecek
export const SUPERWALL_API_KEYS = {
    ios: process.env.SUPERWALL_IOS_API_KEY || 'your_ios_api_key_here',
    android: process.env.SUPERWALL_ANDROID_API_KEY || 'your_android_api_key_here',
};

