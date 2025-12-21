import React, { useState } from 'react';
import { ArrowLeft, Camera, X, Check, MapPin, Link as LinkIcon, User, Mail, AtSign, Calendar } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface EditProfileScreenProps {
  onClose: () => void;
}

export function EditProfileScreen({ onClose }: EditProfileScreenProps) {
  const [formData, setFormData] = useState({
    name: 'Ayşe Demir',
    username: 'aysedemir',
    email: 'ayse.demir@email.com',
    bio: 'Edebiyat, sinema ve müzik tutkunu. Klasik eserlerden modern sanata kadar her şeye ilgi duyuyorum. Kitap okumak ve konser deneyimlerini paylaşmayı seviyorum.',
    location: 'İstanbul, Türkiye',
    website: 'aysedemir.com',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const currentProfile = {
    bannerImage: 'https://images.unsplash.com/photo-1665059691261-daa5bacdf826?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwYWNhZGVtaWElMjBsaWJyYXJ5JTIwYm9va3MlMjB2aW50YWdlfGVufDF8fHx8MTc2NjA2NTU5Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    profileImage: 'https://images.unsplash.com/photo-1649589244330-09ca58e4fa64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHByb2Zlc3Npb25hbCUyMHdvbWFufGVufDF8fHx8MTc2NTk3MDkxNHww&ixlib=rb-4.1.0&q=80&w=1080',
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'İsim gereklidir';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Kullanıcı adı gereklidir';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-posta gereklidir';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }

    if (formData.bio.length > 150) {
      newErrors.bio = 'Biyografi en fazla 150 karakter olabilir';
    }

    if (formData.website && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.website)) {
      newErrors.website = 'Geçerli bir web sitesi adresi girin (örn: orneksite.com)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      setIsSaving(true);
      // Simulate API call
      setTimeout(() => {
        setIsSaving(false);
        alert('Profil başarıyla güncellendi!');
        onClose();
      }, 1000);
    }
  };

  const handleImageUpload = (type: 'profile' | 'banner') => {
    alert(`${type === 'profile' ? 'Profil fotoğrafı' : 'Kapak fotoğrafı'} yükleme ekranı açılacak`);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 -ml-2 hover:bg-muted/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-primary" />
            </button>
            <h1 className="text-xl text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
              Profili Düzenle
            </h1>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-primary text-primary-foreground rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>Kaydediliyor...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Kaydet</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-md mx-auto">
        {/* Banner Image Section */}
        <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20">
          <ImageWithFallback
            src={currentProfile.bannerImage}
            alt="Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3">
            <button
              onClick={() => handleImageUpload('banner')}
              className="bg-background/90 backdrop-blur-sm text-primary px-4 py-2 rounded-xl shadow-lg hover:bg-background transition-colors flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span className="text-sm">Kapak Değiştir</span>
            </button>
          </div>
        </div>

        {/* Profile Picture Section */}
        <div className="px-5 -mt-16 relative mb-6">
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-xl">
              <ImageWithFallback
                src={currentProfile.profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => handleImageUpload('profile')}
              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            >
              <Camera className="w-8 h-8 text-white" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="px-5 pb-8 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              İsim
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.name ? 'border-red-500' : 'border-border'
              } bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
              placeholder="İsminizi girin"
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <X className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <AtSign className="w-4 h-4" />
              Kullanıcı Adı
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={`w-full pl-8 pr-4 py-3 rounded-xl border ${
                  errors.username ? 'border-red-500' : 'border-border'
                } bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
                placeholder="kullaniciadi"
              />
            </div>
            {errors.username && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <X className="w-3 h-3" />
                {errors.username}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              E-posta
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.email ? 'border-red-500' : 'border-border'
              } bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
              placeholder="ornek@email.com"
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <X className="w-3 h-3" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              Biyografi
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.bio ? 'border-red-500' : 'border-border'
              } bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all`}
              rows={4}
              maxLength={150}
              placeholder="Kendinizden bahsedin..."
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                {formData.bio.length}/150 karakter
              </p>
              {errors.bio && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {errors.bio}
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Konum
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="Şehir, Ülke"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Web Sitesi
            </label>
            <input
              type="text"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.website ? 'border-red-500' : 'border-border'
              } bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
              placeholder="orneksite.com"
            />
            {errors.website && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <X className="w-3 h-3" />
                {errors.website}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              https:// eklemenize gerek yok
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex gap-3">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900 dark:text-blue-300 font-medium mb-1">
                  Profil Bilgileri
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                  Profil bilgileriniz herkese açıktır. Gizlilik ayarlarını değiştirmek için Ayarlar sayfasını ziyaret edin.
                </p>
              </div>
            </div>
          </div>

          {/* Delete Account Link */}
          <div className="pt-4 border-t border-border/50">
            <button
              onClick={() => alert('Hesap silme işlemi için Ayarlar > Hesap Yönetimi bölümüne gidin')}
              className="text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              Hesabımı silmek istiyorum
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
