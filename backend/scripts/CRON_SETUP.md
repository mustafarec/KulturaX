# Cron Job Kurulum Kılavuzu

Oluşturduğumuz `backend/scripts/cron_cleanup.php` dosyasının sunucuda düzenli çalışması için aşağıdaki adımları izleyin.

## 1. Manuel Test (Önerilen)

Önce scriptin hatasız çalıştığını teyit etmek için sunucunuzda SSH üzerinden manuel çalıştırın:

```bash
php /var/www/kulturax/api/scripts/cron_cleanup.php
```

**Beklenen Çıktı:**
```text
Starting cleanup job...
Cleaning up rate_limits table...
Deleted X old rate limit records.
Cleaning up user_sessions table...
Deleted Y expired sessions.
Cleaning up file-based rate limit cache...
Deleted Z expired cache files.
Cleanup completed in 0.XXXX seconds.
```

## 2. Crontab'a Ekleme

Scriptin her saat başı otomatik çalışması için crontab'a ekleyin.

1.  Crontab düzenleyicisini açın:
    ```bash
    crontab -e
    ```

2.  Dosyanın en altına şu satırı ekleyin:
    ```cron
    # Her saat başı KulturaX temizlik scriptini çalıştır
    0 * * * * /usr/bin/php /var/www/kulturax/api/scripts/cron_cleanup.php >> /var/log/kulturax_cron.log 2>&1
    ```

    *   **/usr/bin/php**: PHP'nin tam yolu (`which php` komutuyla teyit edin).
    *   **/var/www/kulturax/api/scripts/cron_cleanup.php**: Scriptin tam yolu.
    *   **>> /var/log/...**: Çıktıları log dosyasına yazar.

3.  Kaydedip çıkın (`Ctrl+O`, `Enter`, `Ctrl+X` veya `:wq`).

4.  Cron'un eklendiğini doğrulayın:
    ```bash
    crontab -l
    ```

## 3. İzinler

Dosyanın çalıştırılabilir olduğundan emin olun:

```bash
chmod +x /var/www/kulturax/api/scripts/cron_cleanup.php
```
