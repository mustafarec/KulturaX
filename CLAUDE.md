# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proje Hakkında

KültüraX, kitap, film, müzik ve etkinlik gibi kültürel içerikleri paylaşmak ve keşfetmek için geliştirilmiş bir React Native 0.81.5 mobil uygulamasıdır (iOS/Android). Expo 54 kullanılarak geliştirilmiştir. Backend PHP API'si `/backend` dizininde bulunmaktadır.

## Derleme ve Geliştirme Komutları

```bash
# Metro dev server başlat
npm start

# Android için derle ve çalıştır
npm run android

# iOS için derle ve çalıştır
npm run ios

# Kodu lint et
npm run lint

# Testleri çalıştır
npm run test
```

**iOS Kurulumu (ilk defa veya native dependency güncellemesi sonrası):**
```bash
bundle install
bundle exec pod install
```

**Gereksinimler:** Node >= 20, Ruby (CocoaPods için), Xcode/Android Studio

**EAS Build:**
```bash
eas build --profile development    # Development build
eas build --profile preview        # Preview build
eas build --profile production     # Production build
```

## Mimari

```
src/
├── components/      # Yeniden kullanılabilir UI bileşenleri (ui/, chat/, comments/, post/, premium/)
├── context/         # React Context sağlayıcıları (Auth, Theme, WebSocket, Message, Notification)
├── hooks/           # Özel hook'lar (useApiCall, useFeed, useFeedActions, usePostInteractions)
├── navigation/      # AppNavigator, TabNavigator, AuthNavigator
├── screens/         # Ekranlar kategori bazlı (auth/, main/, social/, content/, settings/)
├── services/        # API servisleri ve harici entegrasyonlar
│   ├── api/         # Endpoint tanımları (authApi, postApi, userApi, vb.)
│   ├── client.ts    # Interceptor ve retry mantığı içeren Axios istemcisi
│   └── backendApi.ts
├── theme/           # Tema tanımları (lightTheme, dimTheme, blackTheme)
├── types/           # TypeScript tip tanımları
└── utils/           # Yardımcı fonksiyonlar
```

## Önemli Kalıplar

**Tema Sistemi:** `src/theme/theme.ts` dosyasında üç tema tanımlı - `lightTheme` (#FAF8F5), `dimTheme` (#1C1917), `blackTheme` (#000000). `useTheme()` context hook'u ile erişilir.

**API İstemcisi:** Axios tabanlı istemci (`src/services/api/client.ts`) şunları içerir:
- Otomatik retry (3 deneme, üstel geri çekilme)
- Güvenlik için HMAC-SHA256 API imzası
- SecureStore üzerinden token yönetimi
- 401 hataları için callback sistemi

**Anlık Geri Bildirim Kalıbı:** Bileşenler API ile senkronize olurken yerel state kullanır:
```typescript
const [localIsLiked, setLocalIsLiked] = useState(!!post.is_liked);
const handleLike = () => {
    setLocalIsLiked(!localIsLiked);
    api.post('/like', ...);
};
```

**Performans:** PostCard ve benzeri bileşenler gereksiz render'ları önlemek için `React.memo` ve özel karşılaştırma fonksiyonları kullanır.

**Navigasyon:** Yatay navigasyon için varsayılan animasyon `slide_from_right`'tır. React Navigation 7 kullanılır (native stack, bottom tabs, drawer).

## İçerik Türleri

Postlar şu türleri destekler: `book`, `movie`, `music`, `event`, `thought`

## Güvenlik (Backend)

- **Token:** Rastgele 64 karakterlik hex, 30 gün geçerlilik, son 7 günde kullanılırsa uzayan kayar süre (sliding expiration)
- **Şifreler:** BCRYPT ile hash'lenmiş, minimum 8 karakter ve karmaşıklık gereksinimleri
- **API İstekleri:** `X-App-Signature` header'ı ile HMAC-SHA256 imzası
- **Rate Limiting:** IP tabanlı ve kullanıcı tabanlı limitler (login: 5/5dk, register: 3/saat)
- **Veri Koruma:** Token'lar için SecureStore (iOS Keychain/Android Keystore); asla AsyncStorage kullanılmaz

## WebSocket

Gerçek zamanlı mesajlaşma `wss://mmreeo.online/ws` üzerinden yapılır. Sohbet işlevselliği için `WebSocketContext` kullanılır.

## Önemli Yapılandırma Dosyaları

| Dosya | Amaç |
|-------|------|
| `app.json` | Expo yapılandırması (bundle ID, pluginler) |
| `eas.json` | EAS Build/Submit yapılandırması |
| `tsconfig.json` | TypeScript yapılandırması |
| `babel.config.js` | Reanimated plugin'li Babel yapılandırması |
| `.env` | API_URL ve API_SIGNATURE_SECRET |

## Backend API Dokümantasyonu

Tam API dokümantasyonu `docs/API.md` dosyasında bulunmaktadır. Base URL: `https://mmreeo.online/api`
