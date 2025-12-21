import React, { useState } from 'react';
import { Heart, MessageCircle, UserPlus, BookOpen, Calendar, Sparkles, BellRing, Film, Music, Bookmark, Quote } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

// Mock data for notifications
const notifications = [
  {
    id: 1,
    type: 'like',
    user: {
      name: 'Elif Yıldız',
      avatar: 'https://images.unsplash.com/photo-1643732994192-03856991da2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0JTIwYXZhdGFyfGVufDF8fHx8MTc2NjA0OTA3N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    message: '"Dune" paylaşımını beğendi',
    time: '5 dakika önce',
    isRead: false,
  },
  {
    id: 2,
    type: 'comment',
    user: {
      name: 'Can Demir',
      avatar: 'https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjYwMjQ5NDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    message: 'gönderine yorum yaptı: "Harika bir kitap, ben de yeni bitirdim!"',
    time: '15 dakika önce',
    isRead: false,
  },
  {
    id: 3,
    type: 'follow',
    user: {
      name: 'Selin Acar',
      avatar: 'https://images.unsplash.com/photo-1672462478040-a5920e2c23d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBzbWlsaW5nJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1OTY2NDU4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    message: 'seni takip etmeye başladı',
    time: '1 saat önce',
    isRead: false,
  },
  {
    id: 4,
    type: 'recommendation',
    user: {
      name: 'KulturaX',
      avatar: '',
    },
    message: 'Beğenebileceğin yeni bir kitap: "1984" - George Orwell',
    time: '2 saat önce',
    isRead: true,
    icon: BookOpen,
  },
  {
    id: 5,
    type: 'event',
    user: {
      name: 'KulturaX',
      avatar: '',
    },
    message: 'İstanbul Film Festivali yarın başlıyor! Biletini aldın mı?',
    time: '3 saat önce',
    isRead: true,
    icon: Calendar,
  },
  {
    id: 6,
    type: 'like',
    user: {
      name: 'Ahmet Kaya',
      avatar: 'https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjYwMjQ5NDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    message: 'alıntını beğendi',
    time: '5 saat önce',
    isRead: true,
  },
  {
    id: 7,
    type: 'activity',
    user: {
      name: 'Zeynep Yılmaz',
      avatar: 'https://images.unsplash.com/photo-1643732994192-03856991da2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0JTIwYXZhdGFyfGVufDF8fHx8MTc2NjA0OTA3N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    message: '"Suç ve Ceza" kitabını okumaya başladı',
    time: '1 gün önce',
    isRead: true,
  },
  {
    id: 8,
    type: 'comment',
    user: {
      name: 'Mehmet Arslan',
      avatar: 'https://images.unsplash.com/photo-1672462478040-a5920e2c23d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBzbWlsaW5nJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1OTY2NDU4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    message: 've 3 kişi daha müzik paylaşımına yorum yaptı',
    time: '1 gün önce',
    isRead: true,
  },
  {
    id: 9,
    type: 'like',
    user: {
      name: 'Deniz Tekin',
      avatar: 'https://images.unsplash.com/photo-1643732994192-03856991da2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0JTIwYXZhdGFyfGVufDF8fHx8MTc2NjA0OTA3N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    message: 'film önerini beğendi',
    time: '6 saat önce',
    isRead: true,
  },
  {
    id: 10,
    type: 'follow',
    user: {
      name: 'Cem Öztürk',
      avatar: 'https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjYwMjQ5NDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    message: 'seni takip etmeye başladı',
    time: '8 saat önce',
    isRead: true,
  },
  {
    id: 11,
    type: 'comment',
    user: {
      name: 'Ayşe Koç',
      avatar: 'https://images.unsplash.com/photo-1643732994192-03856991da2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0JTIwYXZhdGFyfGVufDF8fHx8MTc2NjA0OTA3N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    message: 'gönderine yorum yaptı: "Bu kitabı ben de çok sevdim!"',
    time: '10 saat önce',
    isRead: true,
  },
  {
    id: 12,
    type: 'follow',
    user: {
      name: 'Burak Yılmaz',
      avatar: 'https://images.unsplash.com/photo-1672462478040-a5920e2c23d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBzbWlsaW5nJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1OTY2NDU4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    message: 'seni takip etmeye başladı',
    time: '12 saat önce',
    isRead: true,
  },
  {
    id: 13,
    type: 'like',
    user: {
      name: 'Fatma Şen',
      avatar: 'https://images.unsplash.com/photo-1643732994192-03856991da2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0JTIwYXZhdGFyfGVufDF8fHx8MTc2NjA0OTA3N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    message: 've 2 kişi daha müzik listeni beğendi',
    time: '1 gün önce',
    isRead: true,
  },
  {
    id: 14,
    type: 'recommendation',
    user: {
      name: 'KulturaX',
      avatar: '',
    },
    message: 'Yeni çıkan "Dune: Part Two" filmi senin için önerildi',
    time: '1 gün önce',
    isRead: true,
    icon: Film,
  },
];

// Helper function to get notification icon
const getNotificationIcon = (notification: typeof notifications[0]) => {
  if (notification.icon) {
    const Icon = notification.icon;
    return <Icon className="w-5 h-5" />;
  }
  
  switch (notification.type) {
    case 'like':
      return <Heart className="w-5 h-5" />;
    case 'comment':
      return <MessageCircle className="w-5 h-5" />;
    case 'follow':
      return <UserPlus className="w-5 h-5" />;
    case 'activity':
      return <BookOpen className="w-5 h-5" />;
    case 'recommendation':
      return <Sparkles className="w-5 h-5" />;
    case 'event':
      return <Calendar className="w-5 h-5" />;
    default:
      return <BellRing className="w-5 h-5" />;
  }
};

// Helper function to get icon background color
const getIconBgColor = (type: string) => {
  switch (type) {
    case 'like':
      return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400';
    case 'comment':
      return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
    case 'follow':
      return 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400';
    case 'activity':
      return 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
    case 'recommendation':
      return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';
    case 'event':
      return 'bg-primary/10 text-primary';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function NotificationsScreen() {
  const [activeFilter, setActiveFilter] = useState<'Tümü' | 'Beğeniler' | 'Yorumlar' | 'Takip' | 'Öneriler'>('Tümü');
  
  // Filter notifications based on active filter
  const getFilteredNotifications = () => {
    switch (activeFilter) {
      case 'Beğeniler':
        return notifications.filter(n => n.type === 'like');
      case 'Yorumlar':
        return notifications.filter(n => n.type === 'comment');
      case 'Takip':
        return notifications.filter(n => n.type === 'follow');
      case 'Öneriler':
        return notifications.filter(n => n.type === 'recommendation' || n.type === 'event');
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="pb-6">
      {/* Header Section */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
            Bildirimler
          </h2>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2.5 py-1 rounded-full">
              {unreadCount} yeni
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Son aktivitelerinizi ve güncellemeleri takip edin
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['Tümü', 'Beğeniler', 'Yorumlar', 'Takip', 'Öneriler'].map((filter) => (
            <button
              key={filter}
              className={`flex-shrink-0 px-4 py-2 rounded-xl transition-all ${
                filter === activeFilter
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
              onClick={() => setActiveFilter(filter as 'Tümü' | 'Beğeniler' | 'Yorumlar' | 'Takip' | 'Öneriler')}
            >
              <span className="text-sm">{filter}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-4 space-y-2">
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex gap-3 p-4 rounded-xl border transition-all hover:shadow-md ${
              notification.isRead
                ? 'bg-card border-border/30'
                : 'bg-primary/5 border-primary/20 shadow-sm'
            }`}
          >
            {/* Avatar or Icon */}
            <div className="flex-shrink-0">
              {notification.user.avatar ? (
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-background">
                    <ImageWithFallback
                      src={notification.user.avatar}
                      alt={notification.user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Type Icon Badge */}
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${getIconBgColor(notification.type)} border-2 border-background`}>
                    {getNotificationIcon(notification)}
                  </div>
                </div>
              ) : (
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getIconBgColor(notification.type)}`}>
                  {getNotificationIcon(notification)}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-card-foreground leading-relaxed mb-1">
                <span className="font-medium">{notification.user.name}</span>{' '}
                <span className="text-muted-foreground">{notification.message}</span>
              </p>
              <p className="text-xs text-muted-foreground">{notification.time}</p>
            </div>

            {/* Unread Indicator */}
            {!notification.isRead && (
              <div className="flex-shrink-0 pt-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="px-4 pt-6">
        <button className="w-full py-3 rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted transition-colors">
          Daha Fazla Yükle
        </button>
      </div>
    </div>
  );
}