# KültüraX Security Best Practices

Bu dokümantasyon, KültüraX uygulamasında uygulanan güvenlik önlemlerini ve best practice'leri içerir.

---

## 🔐 Authentication

### Token Yönetimi

| Özellik | Değer |
|---------|-------|
| Token Tipi | Random 64 karakter hex string |
| Geçerlilik Süresi | 30 gün |
| Otomatik Yenileme | Son 7 günde kullanılırsa uzar (Sliding Expiration) |
| Depolama (Frontend) | SecureStore (iOS Keychain / Android Keystore) |
| Depolama (Backend) | `users` tablosunda hash olarak |

### Password Policy

Şifre gereksinimleri:
- ✅ Minimum 8 karakter
- ✅ En az 1 büyük harf
- ✅ En az 1 küçük harf
- ✅ En az 1 rakam
- ✅ En az 1 özel karakter (!@#$%^&* vb.)

Hash algoritması: `PASSWORD_BCRYPT`

---

## 🛡️ API Security

### Input Validation

Tüm kullanıcı girdileri `Validator` class'ı ile doğrulanır:

```php
// Email validasyonu
Validator::validateEmail($email);

// String validasyonu (length check)
Validator::validateString($input, $minLength, $maxLength);

// Integer validasyonu (range check)
Validator::validateInteger($input, $min, $max);

// Sanitization
Validator::sanitizeInput($input); // XSS koruması
```

### SQL Injection Koruması

Tüm veritabanı sorguları **Prepared Statements** kullanır:

```php
// ✅ Doğru
$stmt = $conn->prepare("SELECT * FROM users WHERE id = :id");
$stmt->bindParam(':id', $userId);
$stmt->execute();

// ❌ Yanlış (KULLANILMIYOR)
$query = "SELECT * FROM users WHERE id = " . $userId;
```

### XSS Koruması

Tüm kullanıcı girdileri sanitize edilir:

```php
$input = htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
```

### API Signature

Mobil uygulamadan gelen istekler HMAC-SHA256 ile imzalanır:

```
Header: X-App-Signature: <timestamp>:<signature>
Signature: HMAC-SHA256(timestamp:secret, secret)
```

---

## 🚦 Rate Limiting

### IP Bazlı Limitler

| Endpoint | Limit | Süre |
|----------|-------|------|
| Login | 5 deneme | 5 dakika |
| Register | 3 kayıt | 1 saat |
| Password Reset | 3 istek | 15 dakika |

### User Bazlı Limitler

| İşlem | Limit | Süre |
|-------|-------|------|
| Post oluşturma | 100 | 1 saat |
| Mesaj gönderme | 10 | 1 dakika |
| Yorum yazma | 50 | 1 saat |

### Cloudflare Entegrasyonu

IP adresleri Cloudflare üzerinden doğru şekilde alınır:

```php
function getClientIp() {
    if (isset($_SERVER["HTTP_CF_CONNECTING_IP"])) {
        return $_SERVER["HTTP_CF_CONNECTING_IP"];
    }
    if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($ips[0]);
    }
    return $_SERVER['REMOTE_ADDR'];
}
```

---

## 🔒 Data Protection

### Hassas Veri Depolama (Frontend)

| Platform | Yöntem |
|----------|--------|
| iOS | Keychain (SecureStore) |
| Android | EncryptedSharedPreferences (Keystore) |

Depolanan veriler:
- Auth token
- User data (ID, email, username)
- FCM token

### Hassas Veri Koruması (Backend)

| Veri | Koruma |
|------|--------|
| Şifre | BCRYPT hash |
| Email | Plaintext (gerekli) |
| Token | 64 char random hex |

### Güvenli Olmayan Yerlerde Saklanmaz

- ❌ AsyncStorage (şifresiz)
- ❌ LocalStorage
- ❌ URL parametreleri
- ❌ Log dosyaları

---

## 🚫 Block & Spam Protection

### Spam Detection

```php
$spamKeywords = ['viagra', 'casino', 'xxx', 'porn', ...];

// Link spam kontrolü (3+ link = spam)
if (preg_match_all('/https?:\/\//', $text) > 3) {
    return true; // Spam
}
```

### User Blocking

- Bloke edilen kullanıcı mesaj gönderemez
- Bloke edilen kullanıcı profil göremez
- Bloke çift yönlü kontrol edilir

---

## 📋 Security Checklist

### Backend

- [x] Prepared Statements (SQL Injection)
- [x] Input Sanitization (XSS)
- [x] Rate Limiting (Brute Force)
- [x] Password Hashing (BCRYPT)
- [x] Token Expiry (30 gün)
- [x] User Enumeration Prevention (login)
- [x] Error Message Hiding (production)
- [x] CORS Configuration
- [x] File Upload Validation (MIME + extension)

### Frontend

- [x] SecureStore (token/user data)
- [x] API Signature
- [x] Token refresh mechanism
- [x] 401 handler (auto logout)
- [x] Network error handling

---

## 🔄 Incident Response

### Token Compromise

1. Kullanıcıyı logout yap
2. Token'ı veritabanından sil
3. Şifre değişikliği iste
4. Tüm cihazlardan çıkış yap

### Rate Limit Bypass Attempt

1. IP'yi logla
2. Geçici ban uygula
3. Cloudflare firewall rule ekle

---

## 📞 Reporting Security Issues

Güvenlik açıkları için: security@mmreeo.online
