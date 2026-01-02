# Cron Job Kurulum Rehberi

## Sunucuya Script Yükleme

### 1. Script'i Sunucuya Kopyala
```bash
# SCP ile
scp backend/scripts/setup_cron.sh user@your-server:/path/to/kitapmuzikfilm/backend/scripts/

# veya FTP/SFTP ile manuel olarak yükle
```

### 2. Çalıştırma İzni Ver
```bash
chmod +x /path/to/backend/scripts/setup_cron.sh
```

### 3. Cron Job'u Ekle
```bash
cd /path/to/backend/scripts
./setup_cron.sh install
```

### 4. Durumu Kontrol Et
```bash
./setup_cron.sh status
```

---

## Manuel Kurulum (Script Olmadan)

Eğer script kullanmak istemiyorsan:

```bash
# Crontab düzenle
crontab -e

# Bu satırı ekle (her saat başı çalışır):
0 * * * * curl -s -X POST 'https://mmreeo.online/api/library/update_metadata.php?mode=batch&limit=50' > /dev/null 2>&1
```

### Farklı Zamanlama Örnekleri

```bash
# Her 30 dakikada bir
*/30 * * * * curl -s -X POST 'https://mmreeo.online/api/library/update_metadata.php?mode=batch&limit=30' > /dev/null 2>&1

# Günde 4 kez (00:00, 06:00, 12:00, 18:00)
0 */6 * * * curl -s -X POST 'https://mmreeo.online/api/library/update_metadata.php?mode=batch&limit=100' > /dev/null 2>&1

# Sadece gece (03:00)
0 3 * * * curl -s -X POST 'https://mmreeo.online/api/library/update_metadata.php?mode=batch&limit=200' > /dev/null 2>&1
```

---

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `./setup_cron.sh install` | Cron job ekle |
| `./setup_cron.sh remove` | Cron job kaldır |
| `./setup_cron.sh status` | Mevcut durumu göster |
| `./setup_cron.sh test` | Endpoint'i test et |

---

## Test

Cron job'un doğru çalıştığını doğrulamak için:

```bash
# Manuel test
curl -X POST "https://mmreeo.online/api/library/update_metadata.php?mode=batch&limit=5"

# Log kontrol (cron çalıştıktan sonra)
grep "update_metadata" /var/log/cron.log
```
