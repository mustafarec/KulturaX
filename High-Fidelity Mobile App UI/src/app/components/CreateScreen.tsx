import React, { useState } from 'react';
import { X, MessageSquare, PenLine, BookOpen, CalendarPlus, Star, Image, Film, Music as MusicIcon, Theater, MapPin, Calendar, Upload, Tag } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

type CreateTab = 'thought' | 'review' | 'book' | 'event';

interface CreateScreenProps {
  onClose: () => void;
}

export function CreateScreen({ onClose }: CreateScreenProps) {
  const [selectedType, setSelectedType] = useState<CreateTab | null>(null);
  const [thoughtText, setThoughtText] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [reviewType, setReviewType] = useState<'book' | 'film' | 'music'>('book');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookStatus, setBookStatus] = useState<'reading' | 'completed' | 'want-to-read'>('reading');
  const [eventType, setEventType] = useState<'concert' | 'theater'>('concert');
  const [eventTitle, setEventTitle] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventNotes, setEventNotes] = useState('');

  const handlePost = () => {
    // Validation: Topic must be selected for thoughts
    if (selectedType === 'thought' && !selectedTopic) {
      return;
    }
    // Handle post logic here
    console.log('Posting...', { selectedType, selectedTopic, thoughtText, reviewText, bookTitle, eventTitle });
    onClose();
  };

  const topics = [
    { id: 'literature', label: 'Edebiyat', icon: BookOpen, color: 'from-amber-600 to-orange-600' },
    { id: 'philosophy', label: 'Felsefe', icon: MessageSquare, color: 'from-purple-600 to-indigo-600' },
    { id: 'cinema', label: 'Sinema', icon: Film, color: 'from-red-600 to-pink-600' },
    { id: 'music', label: 'Müzik', icon: MusicIcon, color: 'from-emerald-600 to-teal-600' },
    { id: 'art', label: 'Sanat', icon: PenLine, color: 'from-blue-600 to-cyan-600' },
    { id: 'theater', label: 'Tiyatro', icon: Theater, color: 'from-rose-600 to-pink-600' },
  ];

  const contentTypes = [
    { 
      id: 'thought' as CreateTab, 
      label: 'Düşünce Paylaş', 
      description: 'Fikirlerinizi hızlıca paylaşın',
      icon: MessageSquare,
      color: 'from-primary to-primary/80'
    },
    { 
      id: 'review' as CreateTab, 
      label: 'İnceleme Yaz', 
      description: 'Kitap, film veya müzik inceleyin',
      icon: PenLine,
      color: 'from-secondary to-secondary/80'
    },
    { 
      id: 'book' as CreateTab, 
      label: 'Kitap Kaydet', 
      description: 'Okuma listenize ekleyin',
      icon: BookOpen,
      color: 'from-amber-700 to-amber-600'
    },
    { 
      id: 'event' as CreateTab, 
      label: 'Etkinlik Ekle', 
      description: 'Konser veya tiyatro kaydı',
      icon: CalendarPlus,
      color: 'from-emerald-800 to-teal-700'
    },
  ];

  // If no type is selected, show selection popup
  if (!selectedType) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
          onClick={onClose}
        />
        
        {/* Popup */}
        <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50 animate-in zoom-in-95 fade-in duration-200">
          <div className="bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border/50 bg-gradient-to-br from-primary/5 to-secondary/5">
              <div className="flex items-center justify-between">
                <h2 className="text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Ne Paylaşmak İstersiniz?
                </h2>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-muted/50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-primary" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Bir içerik türü seçin
              </p>
            </div>

            {/* Options Grid */}
            <div className="p-4 grid grid-cols-2 gap-3">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card hover:bg-muted/30 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-primary/30"
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  {/* Content */}
                  <div className="relative p-5 flex flex-col items-center text-center space-y-3">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <type.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-primary text-sm mb-1">{type.label}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => setSelectedType(null)} className="p-2 hover:bg-muted/50 rounded-full transition-colors">
          <X className="w-6 h-6 text-primary" />
        </button>
        <h2 className="text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
          {selectedType === 'thought' && 'Düşünce Paylaş'}
          {selectedType === 'review' && 'İnceleme Yaz'}
          {selectedType === 'book' && 'Kitap Kaydet'}
          {selectedType === 'event' && 'Etkinlik Ekle'}
        </h2>
        <button
          onClick={handlePost}
          disabled={selectedType === 'thought' && !selectedTopic}
          className={`px-6 py-2 rounded-xl transition-all ${
            selectedType === 'thought' && !selectedTopic
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/30'
          }`}
        >
          Paylaş
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Thought Tab */}
        {selectedType === 'thought' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            {/* Topic Selector */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <label className="block text-sm text-muted-foreground mb-3">
                <Tag className="w-4 h-4 inline mr-2" />
                Konu Seçin *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {topics.map((topic) => {
                  const isSelected = selectedTopic === topic.id;
                  const getTopicStyles = () => {
                    switch(topic.id) {
                      case 'literature':
                        return isSelected 
                          ? 'border-amber-600 bg-amber-600/10 text-amber-700 dark:text-amber-400' 
                          : 'border-border text-muted-foreground hover:border-amber-600/50';
                      case 'philosophy':
                        return isSelected 
                          ? 'border-purple-600 bg-purple-600/10 text-purple-700 dark:text-purple-400' 
                          : 'border-border text-muted-foreground hover:border-purple-600/50';
                      case 'cinema':
                        return isSelected 
                          ? 'border-red-600 bg-red-600/10 text-red-700 dark:text-red-400' 
                          : 'border-border text-muted-foreground hover:border-red-600/50';
                      case 'music':
                        return isSelected 
                          ? 'border-emerald-600 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400' 
                          : 'border-border text-muted-foreground hover:border-emerald-600/50';
                      case 'art':
                        return isSelected 
                          ? 'border-blue-600 bg-blue-600/10 text-blue-700 dark:text-blue-400' 
                          : 'border-border text-muted-foreground hover:border-blue-600/50';
                      case 'theater':
                        return isSelected 
                          ? 'border-rose-600 bg-rose-600/10 text-rose-700 dark:text-rose-400' 
                          : 'border-border text-muted-foreground hover:border-rose-600/50';
                      default:
                        return 'border-border text-muted-foreground';
                    }
                  };
                  
                  return (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic.id)}
                      className={`py-2.5 px-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${getTopicStyles()}`}
                    >
                      <topic.icon className="w-4 h-4" />
                      <span className="text-xs">{topic.label}</span>
                    </button>
                  );
                })}
              </div>
              {!selectedTopic && (
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                  Paylaşım yapmak için bir konu seçmelisiniz
                </p>
              )}
            </div>

            <div className="bg-card rounded-xl p-4 border border-border">
              <label className="block text-sm text-muted-foreground mb-2">Düşüncelerinizi paylaşın</label>
              <textarea
                value={thoughtText}
                onChange={(e) => setThoughtText(e.target.value)}
                placeholder="Ne düşünüyorsunuz?"
                className="w-full p-4 rounded-xl border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[200px]"
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">{thoughtText.length}/500 karakter</span>
                <button className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-lg transition-colors">
                  <Image className="w-4 h-4" />
                  <span>Görsel Ekle</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review Tab */}
        {selectedType === 'review' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            {/* Review Type Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setReviewType('book')}
                className={`flex-1 py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                  reviewType === 'book'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span className="text-sm">Kitap</span>
              </button>
              <button
                onClick={() => setReviewType('film')}
                className={`flex-1 py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                  reviewType === 'film'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                <Film className="w-4 h-4" />
                <span className="text-sm">Film</span>
              </button>
              <button
                onClick={() => setReviewType('music')}
                className={`flex-1 py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                  reviewType === 'music'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                <MusicIcon className="w-4 h-4" />
                <span className="text-sm">Müzik</span>
              </button>
            </div>

            {/* Review Title */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <label className="block text-sm text-muted-foreground mb-2">
                {reviewType === 'book' ? 'Kitap Adı' : reviewType === 'film' ? 'Film Adı' : 'Albüm/Sanatçı Adı'}
              </label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Başlık girin..."
                className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Rating */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <label className="block text-sm text-muted-foreground mb-3">Puanınız</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-all hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Text */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <label className="block text-sm text-muted-foreground mb-2">İncelemeniz</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="İncelemenizi yazın..."
                className="w-full p-4 rounded-xl border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[200px]"
                maxLength={1000}
              />
              <span className="text-xs text-muted-foreground">{reviewText.length}/1000 karakter</span>
            </div>
          </div>
        )}

        {/* Book Tab */}
        {selectedType === 'book' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            {/* Book Cover Upload */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <label className="block text-sm text-muted-foreground mb-3">Kitap Kapağı</label>
              <div className="flex gap-4">
                <div className="w-24 h-32 rounded-lg bg-gradient-to-br from-muted/50 to-muted border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-sm text-muted-foreground mb-2">Kapak fotoğrafı yükleyin veya arama yapın</p>
                  <input
                    type="text"
                    placeholder="Kitap adı ile ara..."
                    className="w-full p-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Book Title */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <label className="block text-sm text-muted-foreground mb-2">Kitap Adı *</label>
              <input
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder="Örn: Suç ve Ceza"
                className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Author */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <label className="block text-sm text-muted-foreground mb-2">Yazar *</label>
              <input
                type="text"
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
                placeholder="Örn: Fyodor Dostoyevski"
                className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Reading Status */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <label className="block text-sm text-muted-foreground mb-3">Okuma Durumu</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setBookStatus('reading')}
                  className={`py-3 px-4 rounded-xl border transition-all ${
                    bookStatus === 'reading'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <span className="text-sm">Okuyorum</span>
                </button>
                <button
                  onClick={() => setBookStatus('completed')}
                  className={`py-3 px-4 rounded-xl border transition-all ${
                    bookStatus === 'completed'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <span className="text-sm">Okudum</span>
                </button>
                <button
                  onClick={() => setBookStatus('want-to-read')}
                  className={`py-3 px-4 rounded-xl border transition-all ${
                    bookStatus === 'want-to-read'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <span className="text-sm">Okuyacağım</span>
                </button>
              </div>
            </div>

            {/* Rating (if completed) */}
            {bookStatus === 'completed' && (
              <div className="bg-card rounded-xl p-4 border border-border">
                <label className="block text-sm text-muted-foreground mb-3">Puanınız</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-all hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Event Tab */}
        {selectedType === 'event' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            {/* Event Type */}
            <div className="flex gap-2">
              <button
                onClick={() => setEventType('concert')}
                className={`flex-1 py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                  eventType === 'concert'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-400'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                <MusicIcon className="w-4 h-4" />
                <span className="text-sm">Konser</span>
              </button>
              <button
                onClick={() => setEventType('theater')}
                className={`flex-1 py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                  eventType === 'theater'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                <Theater className="w-4 h-4" />
                <span className="text-sm">Tiyatro</span>
              </button>
            </div>

            {/* Event Title */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <label className="block text-sm text-muted-foreground mb-2">
                {eventType === 'concert' ? 'Sanatçı/Konser Adı *' : 'Oyun/Tiyatro Adı *'}
              </label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder={eventType === 'concert' ? 'Örn: Radiohead' : 'Örn: Hamlet'}
                className="w-full p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Event Location */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <label className="block text-sm text-muted-foreground mb-2">Mekan</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Örn: Zorlu PSM"
                  className="w-full p-3 pl-10 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Event Date */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <label className="block text-sm text-muted-foreground mb-2">Tarih</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full p-3 pl-10 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Event Notes */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <label className="block text-sm text-muted-foreground mb-2">Notlar</label>
              <textarea
                value={eventNotes}
                onChange={(e) => setEventNotes(e.target.value)}
                placeholder="Deneyiminizi paylaşın..."
                className="w-full p-4 rounded-xl border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[150px]"
                maxLength={500}
              />
              <span className="text-xs text-muted-foreground">{eventNotes.length}/500 karakter</span>
            </div>

            {/* Event Rating */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <label className="block text-sm text-muted-foreground mb-3">Puanınız</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-all hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}