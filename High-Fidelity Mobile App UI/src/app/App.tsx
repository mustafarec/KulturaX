import React, { useState, useEffect } from 'react';
import { Menu, Search, House, Compass, Plus, Bell, User, Heart, MessageCircle, Music, Play, Pause, SkipBack, SkipForward, Volume2, TrendingUp, BookOpen, Quote, Repeat2, Bookmark, EllipsisVertical, Flag, ThumbsUp, ThumbsDown, Send, MessageSquare, Film, Settings, Hash, Crown } from 'lucide-react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { ExploreScreen } from './components/ExploreScreen';
import { NotificationsScreen } from './components/NotificationsScreen';
import { MessagesScreen } from './components/MessagesScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { CreateScreen } from './components/CreateScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { PremiumScreen } from './components/PremiumScreen';

// Mock data for posts
const posts = [
  {
    id: 1,
    type: 'book',
    category: 'book',
    isFollowing: true,
    isTrending: true,
    user: {
      name: 'Ayşe Demir',
      avatar: 'https://images.unsplash.com/photo-1704726135027-9c6f034cfa41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2VyJTIwcG9ydHJhaXQlMjBhdmF0YXJ8ZW58MXx8fHwxNzY1OTg0ODkxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    content: '"Dune" okumaya başladım ve kesinlikle hayatımın en epik bilim kurgu deneyimi olacak gibi! Frank Herbert\'in yarattığı dünya inanılmaz detaylı. 📚',
    bookCover: 'https://images.unsplash.com/photo-1645394183074-9b334d15a605?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkdW5lJTIwYm9vayUyMGNvdmVyfGVufDF8fHx8MTc2NTk4NDg5MHww&ixlib=rb-4.1.0&q=80&w=1080',
    bookTitle: 'Dune',
    bookAuthor: 'Frank Herbert',
    quote: 'Korku aklı öldürür. Korku, tam yok oluşa götüren küçük ölümdür.',
    pageNumber: 8,
    likes: 234,
    comments: 45,
    timeAgo: '2 saat önce',
  },
  {
    id: 2,
    type: 'music',
    category: 'music',
    isFollowing: true,
    isTrending: true,
    user: {
      name: 'Mehmet Kaya',
      avatar: 'https://images.unsplash.com/photo-1704726135027-9c6f034cfa41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2VyJTIwcG9ydHJhaXQlMjBhdmF0YXJ8ZW58MXx8fHwxNzY1OTg0ODkxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    content: 'Bu sabah çalışırken dinlediğim playlist. Sonbahar havasıyla mükemmel uyum sağlıyor. 🎵',
    albumCover: 'https://images.unsplash.com/photo-1635135449992-c3438898371b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwdmlueWwlMjByZWNvcmR8ZW58MXx8fHwxNzY1OTg0ODkxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    trackTitle: 'Autumn Dreams',
    artist: 'Vinyl Sessions',
    duration: '3:45',
    currentTime: '1:23',
    likes: 187,
    comments: 28,
    timeAgo: '5 saat önce',
  },
  {
    id: 3,
    type: 'book',
    category: 'book',
    isFollowing: true,
    isTrending: false,
    user: {
      name: 'Zeynep Yılmaz',
      avatar: 'https://images.unsplash.com/photo-1704726135027-9c6f034cfa41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2VyJTIwcG9ydHJhaXQlMjBhdmF0YXJ8ZW58MXx8fHwxNzY1OTg0ODkxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    content: 'Klasiklere geri dönüş yapmak isteyenler için harika bir başlangıç. Her sayfada yeni bir perspektif keşfediyorum.',
    bookCover: 'https://images.unsplash.com/photo-1760120482171-d9d5468f75fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGFzc2ljJTIwbGl0ZXJhdHVyZSUyMGJvb2t8ZW58MXx8fHwxNzY1OTg0ODkxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    bookTitle: 'Klasik Edebiyat',
    bookAuthor: 'Çeşitli Yazarlar',
    quote: 'Hayat, yaşanmaya değer olmaktan çok, anlaşılmaya değer bir şeydir.',
    pageNumber: 42,
    likes: 156,
    comments: 32,
    timeAgo: '1 gün önce',
  },
  {
    id: 4,
    type: 'movie',
    category: 'movie',
    isFollowing: false,
    isTrending: true,
    user: {
      name: 'Can Özdemir',
      avatar: 'https://images.unsplash.com/photo-1704726135027-9c6f034cfa41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2VyJTIwcG9ydHJhaXQlMjBhdmF0YXJ8ZW58MXx8fHwxNzY1OTg0ODkxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    content: 'Blade Runner 2049\'u yeniden izledim. Sinematografisi gerçekten başyapıt seviyesinde. Roger Deakins\'in görsel dili muhteşem. 🎬',
    moviePoster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMHBvc3RlcnxlbnwxfHx8fDE3MzQ1MzA0OTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    movieTitle: 'Blade Runner 2049',
    director: 'Denis Villeneuve',
    year: '2017',
    rating: 9.2,
    likes: 312,
    comments: 67,
    timeAgo: '3 saat önce',
  },
  {
    id: 5,
    type: 'music',
    category: 'music',
    isFollowing: false,
    isTrending: true,
    user: {
      name: 'Elif Şahin',
      avatar: 'https://images.unsplash.com/photo-1704726135027-9c6f034cfa41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2VyJTIwcG9ydHJhaXQlMjBhdmF0YXJ8ZW58MXx8fHwxNzY1OTg0ODkxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    content: 'Caz dinlerken çalışmak bambaşka bir huzur veriyor. Miles Davis klasikleri ile harika bir gün geçirdim. 🎺',
    albumCover: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXp6JTIwbXVzaWN8ZW58MXx8fHwxNzM0NTMwNDkwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    trackTitle: 'So What',
    artist: 'Miles Davis',
    duration: '9:22',
    currentTime: '4:15',
    likes: 245,
    comments: 41,
    timeAgo: '6 saat önce',
  },
  {
    id: 6,
    type: 'movie',
    category: 'movie',
    isFollowing: true,
    isTrending: false,
    user: {
      name: 'Deniz Akar',
      avatar: 'https://images.unsplash.com/photo-1704726135027-9c6f034cfa41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2VyJTIwcG9ydHJhaXQlMjBhdmF0YXJ8ZW58MXx8fHwxNzY1OTg0ODkxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    content: 'Parasite filmini izledikten sonra toplumsal sınıf farkları hakkında çok düşünmeye başladım. Bong Joon-ho dehası! 🏆',
    moviePoster: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjBwb3N0ZXJ8ZW58MXx8fHwxNzM0NTMwNDkwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    movieTitle: 'Parasite',
    director: 'Bong Joon-ho',
    year: '2019',
    rating: 9.5,
    likes: 421,
    comments: 89,
    timeAgo: '1 gün önce',
  },
];

// Mock data for unread messages count
const totalUnreadMessages = 3;

function App() {
  const [activeTab, setActiveTab] = useState('Trendler');
  const [contentCategory, setContentCategory] = useState<'all' | 'book' | 'movie' | 'music'>('all');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'feed' | 'explore' | 'notifications' | 'messages' | 'profile'>('feed');
  const [showCreateScreen, setShowCreateScreen] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<number>>(new Set());
  const [openMenuPostId, setOpenMenuPostId] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSettingsScreen, setShowSettingsScreen] = useState(false);
  const [showPremiumScreen, setShowPremiumScreen] = useState(false);

  const toggleLike = (postId: number) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const toggleSave = (postId: number) => {
    setSavedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleReport = (postId: number) => {
    alert('Gönderi şikayet edildi');
    setOpenMenuPostId(null);
  };

  const handleLikeContent = (postId: number) => {
    alert('Bu içeriği beğendin');
    setOpenMenuPostId(null);
  };

  const handleDislikeContent = (postId: number) => {
    alert('Bu içeriği beğenmedin - Daha az benzer içerik gösterilecek');
    setOpenMenuPostId(null);
  };

  // Filter posts based on active tab and category
  const getFilteredPosts = () => {
    let filtered = posts;

    if (activeTab === 'Trendler') {
      filtered = posts.filter(post => post.isTrending);
    } else if (activeTab === 'Takip') {
      filtered = posts.filter(post => post.isFollowing);
    }

    if (contentCategory !== 'all') {
      filtered = filtered.filter(post => post.category === contentCategory);
    }

    return filtered;
  };

  const filteredPosts = getFilteredPosts();

  return (
    <div className="min-h-screen bg-background pb-24 relative">
      {/* Create Screen Modal */}
      {showCreateScreen && <CreateScreen onClose={() => setShowCreateScreen(false)} />}
      
      {/* Settings Screen Modal */}
      {showSettingsScreen && <SettingsScreen onClose={() => setShowSettingsScreen(false)} />}

      {/* Premium Screen Modal */}
      {showPremiumScreen && <PremiumScreen onClose={() => setShowPremiumScreen(false)} />}

      {/* Sidebar Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Drawer */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85%] bg-card z-50 shadow-2xl animate-in slide-in-from-left duration-300">
            {/* Menu Header */}
            <div className="p-6 border-b border-border/50 bg-gradient-to-br from-primary/5 to-secondary/5">
              <h2 className="text-2xl text-primary mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                KulturaX
              </h2>
              <p className="text-sm text-muted-foreground">Kültür ve sanat platformu</p>
            </div>

            {/* Menu Items */}
            <nav className="p-4 space-y-1">
              {/* Premium Button - Featured */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setShowPremiumScreen(true);
                }}
                className="w-full mb-3 p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-xl hover:shadow-emerald-500/30 transition-all text-left relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Crown className="w-5 h-5 text-amber-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Premium'a Geç</p>
                    <p className="text-xs text-white/80">Özel ayrıcalıklardan yararlan</p>
                  </div>
                  <div className="text-white/60">→</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  // Search action
                }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-muted/50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <span className="text-primary">Arama</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  // Topics action
                }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-muted/50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Hash className="w-5 h-5 text-white" />
                </div>
                <span className="text-primary">Konular</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setCurrentScreen('messages');
                }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-muted/50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-primary">Mesajlar</span>
                  {totalUnreadMessages > 0 && (
                    <span className="min-w-[20px] h-[20px] bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center px-1.5">
                      {totalUnreadMessages}
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setCurrentScreen('notifications');
                }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-muted/50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-primary">Bildirimler</span>
                  <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setCurrentScreen('profile');
                }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-muted/50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="text-primary">Profil</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setShowSettingsScreen(true);
                }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-muted/50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <span className="text-primary">Ayarlar</span>
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Paper texture overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Mobile Container */}
      <div className="max-w-md mx-auto relative">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center justify-between px-5 py-4">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-2 -ml-2 hover:bg-muted/50 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-primary" />
            </button>
            
            <h1 className="tracking-wide text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
              KulturaX
            </h1>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentScreen('notifications')}
                className={`p-2 hover:bg-muted/50 rounded-lg transition-colors relative ${
                  currentScreen === 'notifications' ? 'text-primary' : 'text-primary'
                }`}
              >
                <Bell className="w-6 h-6" />
                {/* Notification Badge */}
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
              </button>
              <button className="p-2 -mr-2 hover:bg-muted/50 rounded-lg transition-colors">
                <Search className="w-6 h-6 text-primary" />
              </button>
            </div>
          </div>

          {/* Tab Selector */}
          {currentScreen === 'feed' && (
            <>
              <div className="flex items-center gap-1 px-5 pb-3">
                {['Trendler', 'Takip'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setContentCategory('all'); // Reset category when changing tabs
                    }}
                    className={`flex-1 py-2.5 px-4 rounded-xl transition-all duration-200 ${
                      activeTab === tab
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Category Filter (Only for Trendler and Takip tabs) */}
              {(activeTab === 'Trendler' || activeTab === 'Takip') && (
                <div className="px-5 pb-3">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    {[
                      { value: 'all', label: 'Tümü', icon: TrendingUp },
                      { value: 'book', label: 'Kitaplar', icon: BookOpen },
                      { value: 'movie', label: 'Filmler', icon: Film },
                      { value: 'music', label: 'Müzik', icon: Music },
                    ].map((category) => (
                      <button
                        key={category.value}
                        onClick={() => setContentCategory(category.value as 'all' | 'book' | 'movie' | 'music')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${
                          contentCategory === category.value
                            ? 'bg-secondary/20 text-primary border border-primary/30'
                            : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        <category.icon className="w-4 h-4" />
                        <span className="text-sm">{category.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </header>

        {/* Main Content */}
        <main>
          {currentScreen === 'feed' ? (
            <div className="px-4 py-6 space-y-6">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="bg-card rounded-2xl shadow-lg shadow-primary/5 overflow-hidden border border-border/50"
            >
              {/* User Info */}
              <div className="flex items-center gap-3 p-4 pb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-muted">
                  <ImageWithFallback
                    src={post.user.avatar}
                    alt={post.user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-card-foreground">{post.user.name}</p>
                  <p className="text-xs text-muted-foreground">{post.timeAgo}</p>
                </div>
                
                {/* Three Dot Menu */}
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)}
                    className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground hover:text-primary"
                  >
                    <EllipsisVertical className="w-5 h-5" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {openMenuPostId === post.id && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setOpenMenuPostId(null)}
                      />
                      
                      {/* Menu */}
                      <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl shadow-2xl border border-border/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <button
                          onClick={() => handleReport(post.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/30"
                        >
                          <Flag className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-card-foreground">Şikayet Et</span>
                        </button>
                        
                        <button
                          onClick={() => handleLikeContent(post.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/30"
                        >
                          <ThumbsUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-card-foreground">Bu İçeriği Beğendim</span>
                        </button>
                        
                        <button
                          onClick={() => handleDislikeContent(post.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                        >
                          <ThumbsDown className="w-4 h-4 text-orange-600" />
                          <span className="text-sm text-card-foreground">Bu İçeriği Beğenmedim</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Content Text */}
              <div className="px-4 pb-3">
                <p className="text-card-foreground leading-relaxed">{post.content}</p>
              </div>

              {/* Book/Music/Movie Content */}
              {post.type === 'book' ? (
                <div className="px-4 pb-4 space-y-3">
                  {/* Book Info Card */}
                  <div className="bg-muted/30 rounded-xl p-4 flex gap-4">
                    <div className="w-20 h-28 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                      <ImageWithFallback
                        src={post.bookCover}
                        alt={post.bookTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-primary mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {post.bookTitle}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">{post.bookAuthor}</p>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-secondary" />
                        <span className="text-xs text-secondary">Şu an okuyor</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quote Card */}
                  {post.quote && (
                    <div className="relative bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-5 border-l-4 border-primary/30">
                      <Quote className="w-8 h-8 text-primary/20 absolute top-3 right-3" />
                      <div className="relative">
                        <p 
                          className="text-primary/90 leading-relaxed mb-3 italic pr-8"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          "{post.quote}"
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            Sayfa {post.pageNumber}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : post.type === 'movie' ? (
                <div className="px-4 pb-4">
                  <div className="bg-muted/30 rounded-xl p-4 flex gap-4">
                    <div className="w-24 h-36 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                      <ImageWithFallback
                        src={post.moviePoster}
                        alt={post.movieTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-primary mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {post.movieTitle}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-1">{post.director}</p>
                      <p className="text-xs text-muted-foreground mb-3">{post.year}</p>
                      <div className="flex items-center gap-2">
                        <Film className="w-4 h-4 text-amber-600" />
                        <span className="text-xs text-amber-600">★ {post.rating}/10</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-4 pb-4">
                  <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-xl p-4">
                    <div className="flex gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                        <ImageWithFallback
                          src={post.albumCover}
                          alt={post.trackTitle}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <p className="text-primary mb-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
                          {post.trackTitle}
                        </p>
                        <p className="text-sm text-muted-foreground">{post.artist}</p>
                      </div>
                    </div>

                    {/* Music Player Controls */}
                    <div className="space-y-3">
                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: '37%' }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{post.currentTime}</span>
                          <span>{post.duration}</span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-center gap-6">
                        <button className="text-primary/60 hover:text-primary transition-colors">
                          <SkipBack className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="w-11 h-11 flex items-center justify-center bg-primary rounded-full text-primary-foreground hover:shadow-lg hover:shadow-primary/30 transition-all"
                        >
                          {isPlaying ? (
                            <Pause className="w-5 h-5" fill="currentColor" />
                          ) : (
                            <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                          )}
                        </button>
                        <button className="text-primary/60 hover:text-primary transition-colors">
                          <SkipForward className="w-5 h-5" />
                        </button>
                        <button className="text-primary/60 hover:text-primary transition-colors">
                          <Volume2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Engagement */}
              <div className="flex items-center justify-between px-4 pb-4 pt-2 border-t border-border/30">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-2 transition-colors group ${
                      likedPosts.has(post.id) ? 'text-red-600' : 'text-muted-foreground hover:text-red-600'
                    }`}
                  >
                    <Heart
                      className="w-5 h-5 transition-all"
                      fill={likedPosts.has(post.id) ? 'currentColor' : 'none'}
                    />
                    <span className="text-sm">{likedPosts.has(post.id) ? post.likes + 1 : post.likes}</span>
                  </button>
                  <button className="flex items-center gap-2 text-muted-foreground hover:text-blue-600 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-2 text-muted-foreground hover:text-green-600 transition-colors">
                    <Repeat2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => alert('Gönderi mesaj olarak gönderildi')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-purple-600 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={() => toggleSave(post.id)}
                  className={`transition-colors ${
                    savedPosts.has(post.id) ? 'text-amber-600' : 'text-muted-foreground hover:text-amber-600'
                  }`}
                >
                  <Bookmark
                    className="w-5 h-5 transition-all"
                    fill={savedPosts.has(post.id) ? 'currentColor' : 'none'}
                  />
                </button>
              </div>
            </article>
          ))}</div>
          ) : currentScreen === 'explore' ? (
            <ExploreScreen />
          ) : currentScreen === 'notifications' ? (
            <NotificationsScreen />
          ) : currentScreen === 'messages' ? (
            <MessagesScreen />
          ) : (
            <ProfileScreen />
          )}
        </main>

        {/* Floating Bottom Navigation */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
          <div 
            className="bg-card/40 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-primary/10 border border-border/30 px-6 py-4"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-center justify-around">
              {[
                { icon: House, label: 'Ana Sayfa', screen: 'feed' },
                { icon: Compass, label: 'Keşfet', screen: 'explore' },
                { icon: Plus, label: 'Ekle', isCenter: true },
                { icon: MessageSquare, label: 'Mesajlar', screen: 'messages', hasUnread: totalUnreadMessages > 0, unreadCount: totalUnreadMessages },
                { icon: User, label: 'Profil', screen: 'profile' },
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (item.isCenter) {
                      setShowCreateScreen(true);
                    } else if (item.screen) {
                      setCurrentScreen(item.screen as 'feed' | 'explore' | 'notifications' | 'messages' | 'profile');
                    }
                  }}
                  className={`flex flex-col items-center gap-1 transition-all relative ${
                    item.isCenter
                      ? 'relative -mt-8'
                      : (currentScreen === item.screen ? 'text-primary' : 'text-muted-foreground hover:text-primary')
                  }`}
                >
                  {item.isCenter ? (
                    <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:scale-105">
                      <item.icon className="w-6 h-6" />
                    </div>
                  ) : (
                    <>
                      <item.icon className="w-6 h-6" />
                      {item.hasUnread && item.unreadCount && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-medium rounded-full flex items-center justify-center px-1">
                          {item.unreadCount}
                        </span>
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}

export default App;