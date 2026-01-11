# KültüraX API Documentation

Bu dokümantasyon, KültüraX backend API'sinin endpoint'lerini ve kullanım detaylarını içerir.

---

## Base URL

```
Production: https://mmreeo.online/api
Development: http://localhost:8000/api
```

---

## Authentication

Tüm korumalı endpoint'ler için `Authorization` header'ı gereklidir:

```
Authorization: Bearer <token>
X-Auth-Token: <token>  # Alternatif
```

### Token Alma

#### POST `/auth/login.php`
Kullanıcı girişi yapar ve token döner.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Giriş başarılı.",
  "token": "abc123...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "user",
    "is_premium": false
  }
}
```

**Rate Limit:** 5 deneme / 5 dakika (IP bazlı)

---

#### POST `/auth/register.php`
Yeni kullanıcı kaydı oluşturur.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "John",
  "surname": "Doe",
  "username": "johndoe",
  "birth_date": "1990-01-01",
  "gender": "male"
}
```

**Response (201):**
```json
{
  "message": "Kayıt başarılı. Lütfen email adresinizi doğrulayın.",
  "require_verification": true,
  "user_id": 1,
  "email": "user@example.com"
}
```

**Rate Limit:** 3 kayıt / saat (IP bazlı)

---

#### POST `/auth/verify.php`
Email doğrulama kodunu kontrol eder.

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

---

## Users

#### GET `/users/get.php`
Kullanıcı profili getirir.

**Query Parameters:**
- `user_id` (required): Kullanıcı ID
- `viewer_id` (optional): Görüntüleyen kullanıcı ID

**Response (200):**
```json
{
  "id": 1,
  "username": "johndoe",
  "full_name": "John Doe",
  "bio": "Hello world",
  "avatar_url": "https://...",
  "follower_count": 100,
  "following_count": 50,
  "is_following": true,
  "is_private": false
}
```

---

#### POST `/users/follow.php`
Kullanıcı takip/takipten çık toggle.

**Request:**
```json
{
  "followed_id": 2
}
```

**Response (200):**
```json
{
  "is_following": true,
  "request_status": null
}
```

Private hesaplar için:
```json
{
  "is_following": false,
  "request_status": "pending",
  "message": "Takip isteği gönderildi."
}
```

---

#### GET `/users/search.php`
Kullanıcı arama.

**Query Parameters:**
- `query` (required): Arama terimi

---

## Posts

#### GET `/posts/get_feed.php`
Ana feed'i getirir.

**Query Parameters:**
- `filter` (optional): `book`, `movie`, `music`, `replies`
- `search` (optional): Arama terimi

**Response:** Post dizisi

---

#### POST `/posts/create.php`
Yeni gönderi oluşturur.

**Request:**
```json
{
  "content": "Bu bir gönderi",
  "source": "KültüraX",
  "content_type": "thought",
  "topic_id": 1,
  "image_url": "https://...",
  "original_post_id": null
}
```

**Rate Limit:** 100 gönderi / saat

---

#### DELETE `/posts/delete.php`
Gönderi siler.

**Request:**
```json
{
  "post_id": 1
}
```

---

## Messages

#### POST `/messages/send.php`
Mesaj gönderir.

**Request:**
```json
{
  "receiver_id": 2,
  "content": "Merhaba!",
  "reply_to_id": null,
  "client_id": "msg_123"
}
```

**Rate Limit:** 10 mesaj / dakika

---

#### GET `/messages/inbox.php`
Mesaj kutusunu getirir.

---

#### GET `/messages/get.php`
Belirli bir konuşmayı getirir.

**Query Parameters:**
- `partner_id` (required): Karşı tarafın ID'si

---

## Notifications

#### GET `/notifications/get.php`
Bildirimleri getirir.

---

#### POST `/notifications/mark_read.php`
Bildirimi okundu olarak işaretler.

---

## WebSocket Events

WebSocket URL: `wss://mmreeo.online/ws`

### Client → Server

| Event | Payload | Açıklama |
|-------|---------|----------|
| `auth` | `{userId, token}` | Bağlantı doğrulama |
| `message` | `{receiverId, content, tempId}` | Mesaj gönder |
| `typing` | `{receiverId, isTyping}` | Yazıyor göstergesi |
| `read` | `{senderId, messageIds}` | Okundu bilgisi |
| `ping` | `{}` | Heartbeat |

### Server → Client

| Event | Payload | Açıklama |
|-------|---------|----------|
| `auth_success` | `{}` | Doğrulama başarılı |
| `message` | `{message}` | Yeni mesaj |
| `typing` | `{userId, isTyping}` | Yazıyor göstergesi |
| `read` | `{messageIds}` | Mesajlar okundu |
| `pong` | `{}` | Heartbeat yanıtı |

---

## Error Responses

Tüm endpoint'ler hata durumunda aşağıdaki formatta yanıt döner:

```json
{
  "message": "Hata açıklaması",
  "code": "ERROR_CODE"
}
```

### HTTP Status Codes

| Code | Açıklama |
|------|----------|
| 200 | Başarılı |
| 201 | Oluşturuldu |
| 400 | Geçersiz istek |
| 401 | Yetkisiz (token eksik/geçersiz) |
| 403 | Yasak (yetki yok) |
| 404 | Bulunamadı |
| 429 | Rate limit aşıldı |
| 500 | Sunucu hatası |

### Error Codes

| Code | Açıklama |
|------|----------|
| `TOKEN_EXPIRED` | Token süresi dolmuş |
| `RATE_LIMITED` | İstek limiti aşıldı |
| `VALIDATION_ERROR` | Girdi doğrulama hatası |

---

## Rate Limiting

| Endpoint | Limit | Pencere |
|----------|-------|---------|
| `/auth/login.php` | 5 | 5 dakika |
| `/auth/register.php` | 3 | 1 saat |
| `/posts/create.php` | 100 | 1 saat |
| `/messages/send.php` | 10 | 1 dakika |

---

## Security Headers

Tüm isteklerde aşağıdaki header'lar kullanılabilir:

```
X-App-Signature: <timestamp>:<hmac_signature>
```

Signature Format:
```
signature = HMAC-SHA256(timestamp:secret, secret)
header = timestamp:signature
```
