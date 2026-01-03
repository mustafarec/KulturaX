# Güvenlik Politikası

## Güvenlik Açığı Bildirme

KültüraX'ın güvenliğini ciddiye alıyoruz. Bir güvenlik açığı bulduğunuzu düşünüyorsanız, lütfen aşağıdaki yönergeleri izleyerek bize bildirin.

### Bildirme Süreci

1. **E-posta ile bildirin:** security@mmreeo.online
2. **Aşağıdaki bilgileri ekleyin:**
   - Açığın detaylı açıklaması
   - Tekrar üretme adımları
   - Etkilenen bileşenler
   - Olası etki değerlendirmesi
   - (Varsa) Önerilen düzeltme

### Ne Beklenmeli

- **48 saat içinde:** İlk yanıt
- **7 gün içinde:** Değerlendirme sonucu
- **30 gün içinde:** Düzeltme planı

### Lütfen Yapmayın

- Bulduğunuz açığı kamuya açıklamayın
- Başka kullanıcıların verilerine erişmeye çalışmayın
- Hizmeti kesintiye uğratacak testler yapmayın

---

## Güvenlik Önlemleri

### Kimlik Doğrulama
- ✅ Token tabanlı kimlik doğrulama (64 karakter, rastgele)
- ✅ Token süre dolumu (30 gün)
- ✅ Otomatik token yenileme
- ✅ Şifre hashleme (bcrypt)
- ✅ Brute force koruması (rate limiting)

### Şifre Politikası
- ✅ Minimum 8 karakter
- ✅ En az 1 büyük harf
- ✅ En az 1 küçük harf
- ✅ En az 1 rakam
- ✅ En az 1 özel karakter

### Veri Koruması
- ✅ SQL Injection koruması (prepared statements)
- ✅ XSS koruması (input sanitization)
- ✅ CORS politikası
- ✅ API signature doğrulaması (HMAC-SHA256)
- ✅ HTTPS zorunlu

### Mobil Uygulama
- ✅ Şifreli token depolama (iOS Keychain, Android Keystore)
- ✅ iOS Certificate Pinning
- ✅ Android backup devre dışı
- ✅ Scoped storage kullanımı

### Rate Limiting
| Endpoint | Limit | Süre |
|----------|-------|------|
| Login | 5 deneme | 5 dakika |
| Kayıt | 3 deneme | 1 saat |
| Şifre sıfırlama | 10 deneme | 1 saat |
| Mesaj gönderme | 10 mesaj | 1 dakika |
| Gönderi oluşturma | 100 gönderi | 1 saat |
| Yorum yapma | 30 yorum | 1 saat |

---

## Desteklenen Sürümler

| Sürüm | Destekleniyor |
|-------|---------------|
| 1.x   | ✅ Evet       |
| < 1.0 | ❌ Hayır      |

---

## OWASP Mobile Top 10 Kontrolleri

### M1: Improper Platform Usage
- ✅ iOS Keychain kullanımı
- ✅ Android Keystore kullanımı
- ✅ Platform güvenlik özelliklerine uyum

### M2: Insecure Data Storage
- ✅ Hassas veriler şifreli depolanıyor
- ✅ Backup devre dışı
- ✅ Log'larda hassas veri yok

### M3: Insecure Communication
- ✅ HTTPS zorunlu
- ✅ Certificate Pinning (iOS)
- ✅ API signature doğrulaması

### M4: Insecure Authentication
- ✅ Token tabanlı kimlik doğrulama
- ✅ Güçlü şifre politikası
- ✅ Brute force koruması

### M5: Insufficient Cryptography
- ✅ bcrypt ile şifre hashleme
- ✅ HMAC-SHA256 ile API signature
- ✅ Rastgele token üretimi

### M6: Insecure Authorization
- ✅ Her endpoint'te yetki kontrolü
- ✅ Kaynak sahipliği doğrulaması
- ✅ Rol tabanlı erişim

### M7: Client Code Quality
- ✅ TypeScript kullanımı
- ✅ Input validation
- ✅ Error handling

### M8: Code Tampering
- ✅ Release build imzalı
- ✅ ProGuard/R8 ile kod obfuscation
- ⚠️ Root/Jailbreak detection (planlanıyor)

### M9: Reverse Engineering
- ✅ Kod obfuscation aktif
- ⚠️ Hassas anahtarlar env'de (iyileştirilebilir)

### M10: Extraneous Functionality
- ✅ Debug logları production'da devre dışı
- ✅ Test endpoint'leri kaldırıldı

---

## Denetim Bilgileri

**Son Güvenlik Denetimi:** 3 Ocak 2026  
**Genel Güvenlik Puanı:** 77.5/100  
**Sonraki Denetim:** Planlı

---

## İletişim

Güvenlik ile ilgili sorularınız için:  
📧 security@mmreeo.online
