import React, { useState } from 'react';
import { ArrowLeft, Star, Calendar, Clock, MapPin, Users, Ticket, Heart, Share2, Bookmark, Play, Music, Film, BookOpen, MessageCircle, ThumbsUp, MoreVertical } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

type ContentType = 'movie' | 'book' | 'music' | 'event';

interface DetailData {
  type: ContentType;
  id: number;
  title: string;
  image: string;
  // Movie specific
  director?: string;
  year?: string;
  rating?: number;
  duration?: string;
  genre?: string;
  description?: string;
  cast?: string[];
  // Book specific
  author?: string;
  pages?: number;
  publisher?: string;
  // Music specific
  artist?: string;
  album?: string;
  tracks?: number;
  releaseYear?: string;
  // Event specific
  date?: string;
  time?: string;
  location?: string;
  attendees?: number;
  organizer?: string;
}

interface ExploreDetailScreenProps {
  data: DetailData;
  onClose: () => void;
}

export function ExploreDetailScreen({ data, onClose }: ExploreDetailScreenProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(Math.floor(Math.random() * 500) + 100);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
  };

  const reviews = [
    {
      id: 1,
      user: 'Elif Demir',
      avatar: 'https://images.unsplash.com/photo-1643732994192-03856991da2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0JTIwYXZhdGFyfGVufDF8fHx8MTc2NjA0OTA3N3ww&ixlib=rb-4.1.0&q=80&w=1080',
      rating: 5,
      comment: 'Harika bir deneyimdi! Kesinlikle tavsiye ederim.',
      time: '2 gün önce',
    },
    {
      id: 2,
      user: 'Can Yılmaz',
      avatar: 'https://images.unsplash.com/photo-1624835567150-0c530a20d8cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDF8fHx8MTc2NTk2NzExMnww&ixlib=rb-4.1.0&q=80&w=1080',
      rating: 4,
      comment: 'Çok güzeldi ama biraz uzun.',
      time: '1 hafta önce',
    },
  ];

  const renderIcon = () => {
    switch (data.type) {
      case 'movie':
        return <Film className="w-5 h-5" />;
      case 'book':
        return <BookOpen className="w-5 h-5" />;
      case 'music':
        return <Music className="w-5 h-5" />;
      case 'event':
        return <Calendar className="w-5 h-5" />;
    }
  };

  const renderTypeLabel = () => {
    switch (data.type) {
      case 'movie':
        return 'Film';
      case 'book':
        return 'Kitap';
      case 'music':
        return 'Müzik';
      case 'event':
        return 'Etkinlik';
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-muted/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`p-2 hover:bg-muted/50 rounded-lg transition-colors ${
                isSaved ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-primary' : ''}`} />
            </button>
            <button className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-md mx-auto pb-8">
        {/* Hero Image */}
        <div className="relative h-80 bg-gradient-to-br from-primary/20 to-secondary/20">
          <ImageWithFallback
            src={data.image}
            alt={data.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
          
          {/* Type Badge */}
          <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
            {renderIcon()}
            <span className="text-sm text-primary">{renderTypeLabel()}</span>
          </div>

          {/* Play/Action Button for Music/Movie */}
          {(data.type === 'music' || data.type === 'movie') && (
            <button className="absolute bottom-4 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:shadow-lg hover:shadow-primary/50 transition-all">
              <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
            </button>
          )}
        </div>

        {/* Main Info */}
        <div className="px-5 -mt-6 relative">
          <div className="bg-card rounded-2xl border border-border/50 shadow-xl p-5">
            <h1
              className="text-primary text-2xl mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {data.title}
            </h1>

            {/* Metadata */}
            <div className="space-y-2 mb-4">
              {data.director && (
                <p className="text-sm text-muted-foreground">
                  Yönetmen: <span className="text-card-foreground">{data.director}</span>
                </p>
              )}
              {data.author && (
                <p className="text-sm text-muted-foreground">
                  Yazar: <span className="text-card-foreground">{data.author}</span>
                </p>
              )}
              {data.artist && (
                <p className="text-sm text-muted-foreground">
                  Sanatçı: <span className="text-card-foreground">{data.artist}</span>
                </p>
              )}
              {data.organizer && (
                <p className="text-sm text-muted-foreground">
                  Düzenleyen: <span className="text-card-foreground">{data.organizer}</span>
                </p>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border/30">
              {data.rating && (
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-accent fill-accent" />
                  <span className="text-sm text-primary">{data.rating}</span>
                </div>
              )}
              {data.year && (
                <span className="text-sm text-muted-foreground">{data.year}</span>
              )}
              {data.releaseYear && (
                <span className="text-sm text-muted-foreground">{data.releaseYear}</span>
              )}
              {data.duration && (
                <span className="text-sm text-muted-foreground">{data.duration}</span>
              )}
              {data.pages && (
                <span className="text-sm text-muted-foreground">{data.pages} sayfa</span>
              )}
              {data.tracks && (
                <span className="text-sm text-muted-foreground">{data.tracks} şarkı</span>
              )}
              {data.genre && (
                <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                  {data.genre}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleLike}
                className={`flex-1 py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                  isLiked
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-primary' : ''}`} />
                <span className="text-sm">{likesCount} Beğeni</span>
              </button>
              <button className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">Yorum Yap</span>
              </button>
            </div>
          </div>
        </div>

        {/* Event Details */}
        {data.type === 'event' && (
          <div className="px-5 mt-6">
            <div className="bg-card rounded-2xl border border-border/50 p-5 space-y-3">
              <h3
                className="text-primary mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Etkinlik Detayları
              </h3>
              
              {data.date && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tarih</p>
                    <p className="text-sm text-card-foreground">{data.date}</p>
                  </div>
                </div>
              )}
              
              {data.time && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Saat</p>
                    <p className="text-sm text-card-foreground">{data.time}</p>
                  </div>
                </div>
              )}
              
              {data.location && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Konum</p>
                    <p className="text-sm text-card-foreground">{data.location}</p>
                  </div>
                </div>
              )}
              
              {data.attendees !== undefined && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Katılımcılar</p>
                    <p className="text-sm text-card-foreground">{data.attendees} kişi</p>
                  </div>
                </div>
              )}

              <button className="w-full mt-4 py-3 px-4 rounded-xl bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2">
                <Ticket className="w-5 h-5" />
                <span>Etkinliğe Katıl</span>
              </button>
            </div>
          </div>
        )}

        {/* Description */}
        {data.description && (
          <div className="px-5 mt-6">
            <div className="bg-card rounded-2xl border border-border/50 p-5">
              <h3
                className="text-primary mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Açıklama
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {data.description}
              </p>
            </div>
          </div>
        )}

        {/* Cast (for movies) */}
        {data.cast && data.cast.length > 0 && (
          <div className="px-5 mt-6">
            <div className="bg-card rounded-2xl border border-border/50 p-5">
              <h3
                className="text-primary mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Oyuncular
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.cast.map((actor, index) => (
                  <span
                    key={index}
                    className="text-xs bg-muted/50 text-card-foreground px-3 py-1.5 rounded-full border border-border/30"
                  >
                    {actor}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="px-5 mt-6">
          <div className="bg-card rounded-2xl border border-border/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-primary"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Yorumlar
              </h3>
              <span className="text-sm text-muted-foreground">{reviews.length} yorum</span>
            </div>

            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="pb-4 border-b border-border/30 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <ImageWithFallback
                        src={review.avatar}
                        alt={review.user}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-card-foreground font-medium">{review.user}</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-accent fill-accent" />
                          <span className="text-xs text-muted-foreground">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{review.comment}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{review.time}</span>
                        <button className="text-xs text-secondary hover:text-primary transition-colors">
                          Yanıtla
                        </button>
                        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                          <ThumbsUp className="w-3 h-3" />
                          <span>12</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
