import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sun, Moon, Shield, Eye, EyeOff, UserX, Trash2, Languages, ChevronRight, Lock, AlertTriangle } from 'lucide-react';

interface SettingsScreenProps {
  onClose: () => void;
}

export function SettingsScreen({ onClose }: SettingsScreenProps) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if dark mode is already set in localStorage or system preference
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('tr');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFreezeConfirm, setShowFreezeConfirm] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Apply theme changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const languages = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ];

  const blockedUsers = [
    { id: 1, name: 'Ali Veli', username: '@aliveli', avatar: 'https://images.unsplash.com/photo-1704726135027-9c6f034cfa41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2VyJTIwcG9ydHJhaXQlMjBhdmF0YXJ8ZW58MXx8fHwxNzY1OTg0ODkxfDA&ixlib=rb-4.1.0&q=80&w=1080' },
    { id: 2, name: 'Ayşe Yılmaz', username: '@ayseyilmaz', avatar: 'https://images.unsplash.com/photo-1704726135027-9c6f034cfa41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2VyJTIwcG9ydHJhaXQlMjBhdmF0YXJ8ZW58MXx8fHwxNzY1OTg0ODkxfDA&ixlib=rb-4.1.0&q=80&w=1080' },
  ];

  const handleDeleteAccount = () => {
    alert('Hesabınız silme işlemi için e-posta gönderildi. Lütfen e-postanızı kontrol edin.');
    setShowDeleteConfirm(false);
  };

  const handleFreezeAccount = () => {
    alert('Hesabınız donduruldu. Tekrar giriş yaptığınızda hesabınız aktif olacaktır.');
    setShowFreezeConfirm(false);
  };

  const handleUnblock = (userId: number) => {
    alert('Kullanıcı engeli kaldırıldı');
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-4 px-5 py-4">
          <button
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-muted/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
          <h1 className="text-xl text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ayarlar
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-md mx-auto p-5 space-y-6">
        {/* Appearance Section */}
        <section className="bg-card rounded-2xl shadow-lg shadow-primary/5 border border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border/30 bg-gradient-to-r from-primary/5 to-secondary/5">
            <h2 className="text-primary font-medium">Görünüm</h2>
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  {isDarkMode ? <Moon className="w-5 h-5 text-white" /> : <Sun className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <p className="text-card-foreground font-medium">Tema</p>
                  <p className="text-xs text-muted-foreground">{isDarkMode ? 'Karanlık Mod' : 'Aydınlık Mod'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`relative w-14 h-8 rounded-full transition-all ${
                  isDarkMode ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${
                    isDarkMode ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="bg-card rounded-2xl shadow-lg shadow-primary/5 border border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border/30 bg-gradient-to-r from-primary/5 to-secondary/5">
            <h2 className="text-primary font-medium">Gizlilik ve Güvenlik</h2>
          </div>
          
          <div className="divide-y divide-border/30">
            {/* Private Account */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    {isPrivateAccount ? <Lock className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <p className="text-card-foreground font-medium">Gizli Hesap</p>
                    <p className="text-xs text-muted-foreground">
                      {isPrivateAccount ? 'Hesabın gizli' : 'Hesabın herkes tarafından görülebilir'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPrivateAccount(!isPrivateAccount)}
                  className={`relative w-14 h-8 rounded-full transition-all ${
                    isPrivateAccount ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${
                      isPrivateAccount ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Blocked Users */}
            <div className="p-4">
              <button
                onClick={() => setShowBlockedUsers(true)}
                className="w-full flex items-center justify-between hover:bg-muted/30 -m-4 p-4 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                    <UserX className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-card-foreground font-medium">Engellenen Kullanıcılar</p>
                    <p className="text-xs text-muted-foreground">{blockedUsers.length} kullanıcı engellendi</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </section>

        {/* Language Section */}
        <section className="bg-card rounded-2xl shadow-lg shadow-primary/5 border border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border/30 bg-gradient-to-r from-primary/5 to-secondary/5">
            <h2 className="text-primary font-medium">Dil ve Bölge</h2>
          </div>
          
          <div className="p-4">
            <button
              onClick={() => setShowLanguageModal(true)}
              className="w-full flex items-center justify-between hover:bg-muted/30 -m-4 p-4 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Languages className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-card-foreground font-medium">Dil</p>
                  <p className="text-xs text-muted-foreground">
                    {languages.find(l => l.code === selectedLanguage)?.name}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </section>

        {/* Account Management Section */}
        <section className="bg-card rounded-2xl shadow-lg shadow-primary/5 border border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border/30 bg-gradient-to-r from-red-500/10 to-orange-500/10">
            <h2 className="text-red-600 font-medium">Hesap Yönetimi</h2>
          </div>
          
          <div className="divide-y divide-border/30">
            {/* Freeze Account */}
            <div className="p-4">
              <button
                onClick={() => setShowFreezeConfirm(true)}
                className="w-full flex items-center justify-between hover:bg-muted/30 -m-4 p-4 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-card-foreground font-medium">Hesabı Dondur</p>
                    <p className="text-xs text-muted-foreground">Geçici olarak hesabını devre dışı bırak</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Delete Account */}
            <div className="p-4">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-between hover:bg-red-50/50 -m-4 p-4 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-red-600 font-medium">Hesabı Sil</p>
                    <p className="text-xs text-muted-foreground">Kalıcı olarak hesabını sil</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Blocked Users Modal */}
      {showBlockedUsers && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShowBlockedUsers(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="sticky top-0 bg-card/95 backdrop-blur-xl border-b border-border/50 p-5 flex items-center justify-between">
              <h3 className="text-lg text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
                Engellenen Kullanıcılar
              </h3>
              <button
                onClick={() => setShowBlockedUsers(false)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-5 space-y-3">
              {blockedUsers.length > 0 ? (
                blockedUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-muted">
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-card-foreground font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.username}</p>
                    </div>
                    <button
                      onClick={() => handleUnblock(user.id)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all text-sm"
                    >
                      Engeli Kaldır
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <UserX className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Henüz engellenmiş kullanıcı yok</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShowLanguageModal(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl shadow-2xl max-h-[70vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="sticky top-0 bg-card/95 backdrop-blur-xl border-b border-border/50 p-5">
              <h3 className="text-lg text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
                Dil Seçin
              </h3>
            </div>
            
            <div className="p-5 space-y-2">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLanguage(lang.code);
                    setShowLanguageModal(false);
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                    selectedLanguage === lang.code
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <span className="text-3xl">{lang.flag}</span>
                  <span className="flex-1 text-left text-card-foreground font-medium">{lang.name}</span>
                  {selectedLanguage === lang.code && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
            <div className="bg-card rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in duration-200">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl text-center text-primary mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                Hesabı Sil
              </h3>
              <p className="text-center text-muted-foreground mb-6 text-sm leading-relaxed">
                Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz kalıcı olarak silinecektir.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 bg-muted text-card-foreground rounded-xl hover:bg-muted/70 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  Evet, Sil
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Freeze Account Confirmation Modal */}
      {showFreezeConfirm && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
            <div className="bg-card rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in duration-200">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl text-center text-primary mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                Hesabı Dondur
              </h3>
              <p className="text-center text-muted-foreground mb-6 text-sm leading-relaxed">
                Hesabınızı dondurmak istediğinizden emin misiniz? Tekrar giriş yaptığınızda hesabınız otomatik olarak aktif olacaktır.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFreezeConfirm(false)}
                  className="flex-1 px-4 py-3 bg-muted text-card-foreground rounded-xl hover:bg-muted/70 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleFreezeAccount}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Evet, Dondur
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}