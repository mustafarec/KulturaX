# CI/CD Keystore Kurulumu

Bu döküman, GitHub Actions ile Android release build'leri için keystore yapılandırmasını açıklar.

## Gerekli GitHub Secrets

Aşağıdaki secret'ları GitHub repository ayarlarından ekleyin:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Açıklama | Nasıl Elde Edilir |
|-------------|----------|-------------------|
| `ANDROID_KEYSTORE_BASE64` | Base64 encoded keystore dosyası | Aşağıdaki komutla |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore şifresi | `KulturaX2026Secure!` |
| `ANDROID_KEY_ALIAS` | Key alias | `kulturax-release` |
| `ANDROID_KEY_PASSWORD` | Key şifresi | `KulturaX2026Secure!` |
| `SUPERWALL_IOS_API_KEY` | Superwall iOS API key | Dashboard'dan |
| `SUPERWALL_ANDROID_API_KEY` | Superwall Android API key | Dashboard'dan |

## Keystore'u Base64'e Çevirme

### Windows (PowerShell)
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("android\app\keystore\release.keystore")) | Set-Clipboard
```

### macOS/Linux
```bash
base64 -i android/app/keystore/release.keystore | pbcopy  # macOS
base64 android/app/keystore/release.keystore | xclip      # Linux
```

## Workflow Kullanımı

### Otomatik Build (Tag Push)
```bash
git tag v1.0.0
git push origin v1.0.0
```

Bu, otomatik olarak:
1. APK ve AAB build'i başlatır
2. Artifacts olarak yükler
3. GitHub Release oluşturur

### Manuel Build
1. GitHub → Actions → "Android Release Build"
2. "Run workflow" butonuna tıklayın
3. Build type seçin (release/debug)
4. "Run workflow" ile başlatın

## Build Artifacts

Build sonrası indirilebilir dosyalar:
- `app-release-apk`: Signed APK (test için)
- `app-release-aab`: Signed AAB (Play Store için)

Artifacts 30 gün saklanır.

## Troubleshooting

### "Keystore file not found"
- Secret'ın doğru base64 encode edildiğinden emin olun
- Keystore dosya yolunu kontrol edin

### "Invalid keystore password"
- `ANDROID_KEYSTORE_PASSWORD` secret'ını kontrol edin
- Şifrede özel karakterler varsa quotes kullanmayın

### "Key alias not found"
- `ANDROID_KEY_ALIAS` değerinin doğru olduğundan emin olun
- Keystore'daki alias: `kulturax-release`

## Güvenlik Notları

⚠️ **ÖNEMLİ:**
- Secret'ları asla commit etmeyin
- Keystore dosyasını repository'ye eklemeyin
- `.gitignore`'da keystore dosyaları listelenmiştir
- Secret'lara sadece yetkili kişiler erişebilmelidir
