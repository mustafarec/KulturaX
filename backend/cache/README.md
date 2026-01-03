# Token Cache Directory

Bu dizin token doğrulama önbellek dosyalarını içerir.

## Güvenlik

- `.htaccess` ile dışarıdan erişim engellenmiştir
- Cache dosyaları otomatik olarak temizlenir (TTL: 5 dakika)

## Dosya Yapısı

```
tokens/
├── kulturax_token_abc123...cache  # SHA256 hash'lenmiş token
└── ...
```

## Manuel Temizlik

Tüm cache'i temizlemek için:
```bash
rm -rf tokens/*.cache
```

## Not

Bu dizini silmeyin. Uygulama otomatik olarak yeniden oluşturur.
