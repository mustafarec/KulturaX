/**
 * Default Images - Placeholder URL'ler yerine kullanılacak
 * 
 * via.placeholder.com yerine UI Avatars ve DiceBear servisleri kullanılıyor.
 * Bu servisler daha güvenilir ve özelleştirilebilir.
 */

// UI Avatars - İsme göre avatar oluşturur
export const getDefaultAvatar = (name: string = 'User', size: number = 150): string => {
    const encodedName = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${encodedName}&size=${size}&background=8B5CF6&color=ffffff&bold=true`;
};

// DiceBear - Rastgele avatar oluşturur
export const getRandomAvatar = (seed: string = 'default', size: number = 150): string => {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&size=${size}`;
};

// Default fallback görselleri
export const DefaultImages = {
    // Avatar placeholder
    avatar: 'https://ui-avatars.com/api/?name=User&size=150&background=8B5CF6&color=ffffff',

    // İçerik placeholder'ları
    bookCover: 'https://ui-avatars.com/api/?name=Book&size=150&background=3B82F6&color=ffffff',
    moviePoster: 'https://ui-avatars.com/api/?name=Film&size=150&background=EF4444&color=ffffff',
    musicAlbum: 'https://ui-avatars.com/api/?name=Music&size=150&background=10B981&color=ffffff',

    // Genel placeholder
    placeholder: 'https://ui-avatars.com/api/?name=Image&size=150&background=6B7280&color=ffffff',
};

export default DefaultImages;
