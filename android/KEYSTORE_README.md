# Android Keystore Bilgileri

> ⚠️ **UYARI:** Bu bilgileri güvenli bir yerde saklayın (1Password, Vault, vb.)
> Bu dosya commit edilMEMELİDİR!

## Production Keystore

- **Dosya:** `app/keystore/release.keystore`
- **Alias:** `kulturax-release`
- **Şifre:** `KulturaX2026Secure!`
- **Geçerlilik:** 10.000 gün (~27 yıl)
- **Algoritma:** RSA 2048-bit

## Keystore Fingerprint Alma

```bash
keytool -list -v -keystore app/keystore/release.keystore -alias kulturax-release
```

## Google Play Console için SHA-1/SHA-256

```bash
keytool -list -v -keystore app/keystore/release.keystore -alias kulturax-release -storepass KulturaX2026Secure!
```

## Önemli Notlar

1. **Keystore dosyasını asla kaybetmeyin** - Aynı uygulama tekrar imzalanamaz
2. **Şifreyi güvenli yerde saklayın** - 1Password, LastPass, Vault vb.
3. **Git'e commit etmeyin** - `.gitignore`'a eklenmiştir
4. **Yedek alın** - Farklı bir lokasyona yedekleyin

## CI/CD Entegrasyonu

GitHub Actions için keystore'u base64 encode edip secret olarak ekleyin:

```bash
base64 -i app/keystore/release.keystore | pbcopy
```

Sonra GitHub Secrets'a ekleyin:
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
