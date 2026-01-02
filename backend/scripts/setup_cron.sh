#!/bin/bash
# =============================================================================
# Cron Job Setup Script for Metadata Updater
# 
# Bu script sunucuda cron job ekler ve kaldırır.
# 
# Kullanım:
#   ./setup_cron.sh install   - Cron job'u ekle
#   ./setup_cron.sh remove    - Cron job'u kaldır
#   ./setup_cron.sh status    - Mevcut durumu göster
#   ./setup_cron.sh test      - Metadata update'i manuel çalıştır
# =============================================================================

# Konfigürasyon - Kendi domain'inizi buraya yazın
API_BASE_URL="https://mmreeo.online/api"
METADATA_ENDPOINT="${API_BASE_URL}/library/update_metadata.php"
CLICK_CLEANUP_LIMIT=50

# Cron job tanımları
CRON_METADATA_UPDATE="0 * * * * curl -s -X POST '${METADATA_ENDPOINT}?mode=batch&limit=${CLICK_CLEANUP_LIMIT}' > /dev/null 2>&1"
CRON_MARKER="# kitapmuzikfilm-metadata-update"

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}! $1${NC}"
}

install_cron() {
    echo "Cron job ekleniyor..."
    
    # Mevcut crontab'ı al
    existing_cron=$(crontab -l 2>/dev/null || echo "")
    
    # Zaten ekli mi kontrol et
    if echo "$existing_cron" | grep -q "$CRON_MARKER"; then
        print_warning "Cron job zaten ekli!"
        show_status
        return 0
    fi
    
    # Yeni cron job ekle
    (echo "$existing_cron"; echo "$CRON_MARKER"; echo "$CRON_METADATA_UPDATE") | crontab -
    
    if [ $? -eq 0 ]; then
        print_success "Cron job başarıyla eklendi!"
        echo ""
        echo "Eklenen job:"
        echo "  Her saat başı metadata update çalışacak"
        echo "  Endpoint: $METADATA_ENDPOINT"
        echo ""
        show_status
    else
        print_error "Cron job eklenirken hata oluştu!"
        return 1
    fi
}

remove_cron() {
    echo "Cron job kaldırılıyor..."
    
    # Mevcut crontab'ı al ve marker'lı satırları çıkar
    existing_cron=$(crontab -l 2>/dev/null || echo "")
    
    if ! echo "$existing_cron" | grep -q "$CRON_MARKER"; then
        print_warning "Kaldırılacak cron job bulunamadı!"
        return 0
    fi
    
    # Marker ve sonraki satırı kaldır
    echo "$existing_cron" | grep -v "$CRON_MARKER" | grep -v "update_metadata.php" | crontab -
    
    if [ $? -eq 0 ]; then
        print_success "Cron job başarıyla kaldırıldı!"
    else
        print_error "Cron job kaldırılırken hata oluştu!"
        return 1
    fi
}

show_status() {
    echo "Mevcut cron job durumu:"
    echo "========================"
    
    cron_list=$(crontab -l 2>/dev/null)
    
    if echo "$cron_list" | grep -q "update_metadata.php"; then
        print_success "Metadata Update cron job aktif"
        echo ""
        echo "Aktif job'lar:"
        echo "$cron_list" | grep -A1 "$CRON_MARKER" | head -2
    else
        print_warning "Metadata Update cron job bulunamadı"
    fi
    
    echo ""
}

test_endpoint() {
    echo "Metadata Update endpoint test ediliyor..."
    echo "Endpoint: $METADATA_ENDPOINT"
    echo ""
    
    # GET - Eksik metadata listesi
    echo "1. Eksik metadata listesi alınıyor..."
    response=$(curl -s "${METADATA_ENDPOINT}?limit=5")
    echo "Yanıt: $response"
    echo ""
    
    # POST - Batch update
    echo "2. Batch update çalıştırılıyor..."
    response=$(curl -s -X POST "${METADATA_ENDPOINT}?mode=batch&limit=3")
    echo "Yanıt: $response"
    echo ""
    
    print_success "Test tamamlandı!"
}

# Ana script
case "$1" in
    install)
        install_cron
        ;;
    remove)
        remove_cron
        ;;
    status)
        show_status
        ;;
    test)
        test_endpoint
        ;;
    *)
        echo "Kullanım: $0 {install|remove|status|test}"
        echo ""
        echo "Komutlar:"
        echo "  install  - Cron job'u ekle (her saat metadata update)"
        echo "  remove   - Cron job'u kaldır"
        echo "  status   - Mevcut cron job durumunu göster"
        echo "  test     - Metadata update endpoint'ini test et"
        echo ""
        echo "Örnek:"
        echo "  $0 install   # Cron job ekle"
        echo "  $0 test      # Endpoint'i test et"
        exit 1
        ;;
esac

exit 0
