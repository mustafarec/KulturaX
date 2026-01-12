# Production'a Geçiş Kontrol Listesi

Bu doküman, uygulamayı yayına almadan önce yapılması gereken değişiklikleri içerir.

---

## 🎯 AdMob Reklam Entegrasyonu

### 1. AdMob Hesap Kurulumu
- [ ] [AdMob Console](https://admob.google.com) üzerinden hesap oluştur/giriş yap
- [ ] Uygulamayı kaydet (Android & iOS için ayrı ayrı)
- [ ] Ödeme bilgilerini ekle

### 2. Ad Unit Oluşturma
- [ ] **Android Banner Ad Unit** oluştur
  - AdMob → Apps → KültüraX (Android) → Ad Units → Add Ad Unit → Banner
  - Ad Unit ID'yi kopyala (örn: `ca-app-pub-XXXXXXXX/YYYYYYYY`)
  
- [ ] **iOS Banner Ad Unit** oluştur (iOS için)
  - Aynı adımları iOS için tekrarla

### 3. Kod Değişiklikleri

#### `app.json` - App ID'leri Güncelle
```json
"plugins": [
  [
    "react-native-google-mobile-ads",
    {
      "androidAppId": "ca-app-pub-GERCEK_ANDROID_APP_ID",
      "iosAppId": "ca-app-pub-GERCEK_IOS_APP_ID"
    }
  ]
]
```

#### `src/services/AdService.ts` - Ad Unit ID'leri Güncelle
```typescript
const PRODUCTION_AD_UNITS = {
    android: {
        banner: 'ca-app-pub-SIZIN_ANDROID_BANNER_ID',
    },
    ios: {
        banner: 'ca-app-pub-SIZIN_IOS_BANNER_ID',
    },
};
```

### 4. Test Cihazları (Önemli!)
Production'da kendi cihazınızda test ederken, cihazı test cihazı olarak ekleyin:
```typescript
// AdService.ts içinde initializeAds fonksiyonuna ekle
await mobileAds().setRequestConfiguration({
    testDeviceIdentifiers: ['CIHAZ_ID'], // Logcat'ten alınır
});
```

---

## 🔥 Firebase Yapılandırması

### Android
- [ ] `android/app/google-services.json` dosyasının doğru package name ile olduğundan emin ol
- [ ] Package name: `com.anonymous.kitapmuzikfilm`

### iOS
- [ ] `ios/GoogleService-Info.plist` dosyasını ekle

---

## 📦 Build & Release

### Android
```bash
# Release APK oluştur
npx expo run:android --variant release

# AAB oluştur (Play Store için)
cd android && ./gradlew bundleRelease
```

### Prebuild Sonrası Yapılacaklar
Her `npx expo prebuild --clean` sonrası:
- [ ] `android/build.gradle` → `com.google.gms:google-services` classpath ekle
- [ ] `android/app/build.gradle` → `apply plugin: "com.google.gms.google-services"` ekle
- [ ] `android/build.gradle` → Notifee maven repository ekle
- [ ] `android/app/google-services.json` dosyasını kopyala

---

## ⚠️ Önemli Notlar

1. **Test reklamlarına gerçek modda tıklamayın** - Hesap banlanabilir
2. **App-ads.txt** dosyasını web sitenize ekleyin (AdMob panelinden indirin)
3. **GDPR/Rıza yönetimi** - Avrupa kullanıcıları için reklam izni alın
4. **Çocuk güvenliği (COPPA)** - Hedef kitlenize göre ayarlayın

---

## 📊 Gelir Takibi

- AdMob Dashboard: https://admob.google.com
- Firebase Analytics ile entegre edin (isteğe bağlı)

---

Son güncelleme: 2026-01-12
