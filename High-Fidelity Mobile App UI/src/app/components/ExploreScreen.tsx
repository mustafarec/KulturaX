import React, { useState } from 'react';
import { TrendingUp, Film, BookOpen, Calendar, MapPin, Clock, Star, Ticket, Users, Music } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ExploreDetailScreen } from './ExploreDetailScreen';

// Mock data
const trendingTopics = [
  { id: 1, name: 'Bilim Kurgu', count: '2.4K', color: 'from-primary/20 to-secondary/20' },
  { id: 2, name: 'Klasik Edebiyat', count: '1.8K', color: 'from-secondary/20 to-accent/20' },
  { id: 3, name: 'Caz Müzik', count: '1.2K', color: 'from-accent/20 to-primary/20' },
  { id: 4, name: 'Psikoloji', count: '3.1K', color: 'from-primary/20 to-accent/20' },
  { id: 5, name: 'Felsefe', count: '2.7K', color: 'from-secondary/20 to-primary/20' },
];

const trendingMovies = [
  {
    id: 1,
    title: 'Blade Runner 2049',
    director: 'Denis Villeneuve',
    year: '2017',
    rating: 4.5,
    duration: '2s 44dk',
    genre: 'Bilim Kurgu',
    description: 'Eski bir Blade Runner\'ın ortaya çıkışı, bir LAPD subayını toplumun geleceğini tehdit edebilecek uzun süredir gizli kalan bir sırrı ortaya çıkarma arayışına götürür.',
    cast: ['Ryan Gosling', 'Harrison Ford', 'Ana de Armas', 'Jared Leto'],
    poster: 'https://images.unsplash.com/photo-1655367574486-f63675dd69eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMHBvc3RlciUyMGNpbmVtYXxlbnwxfHx8fDE3NjYwMzE0NTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 2,
    title: 'The Grand Budapest Hotel',
    director: 'Wes Anderson',
    year: '2014',
    rating: 4.8,
    duration: '1s 39dk',
    genre: 'Komedi',
    description: 'Bir otel görevlisinin ve onun genç protejisinin maceraları, ünlü bir Avrupa otelinde geçer. İki dünya savaşı arasında, değerli bir Rönesans tablosunun çalınması ve ailenin büyük bir servetinin kurtarılması ile ilgili.',
    cast: ['Ralph Fiennes', 'Tony Revolori', 'Saoirse Ronan', 'Willem Dafoe'],
    poster: 'https://images.unsplash.com/photo-1628432136678-43ff9be34064?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGFzc2ljJTIwZmlsbSUyMHBvc3RlcnxlbnwxfHx8fDE3NjYwNDYyNDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 3,
    title: 'Inception',
    director: 'Christopher Nolan',
    year: '2010',
    rating: 4.7,
    duration: '2s 28dk',
    genre: 'Bilim Kurgu',
    description: 'Bir hırsız, kurbanlarının bilinçaltına girerek şirket sırlarını çalar. Ancak bu sefer tersine bir görev alır: bir fikri yerleştirmek.',
    cast: ['Leonardo DiCaprio', 'Marion Cotillard', 'Tom Hardy', 'Elliot Page'],
    poster: 'https://images.unsplash.com/photo-1655367574486-f63675dd69eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMHBvc3RlciUyMGNpbmVtYXxlbnwxfHx8fDE3NjYwMzE0NTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

const trendingBooks = [
  {
    id: 1,
    title: 'Norwegian Wood',
    author: 'Haruki Murakami',
    genre: 'Roman',
    year: '1987',
    rating: 4.3,
    pages: 296,
    publisher: 'Vintage',
    description: 'Tokyo\'da üniversiteye giden Toru Watanabe, ilk aşkının intiharından sonra hayatını yeniden inşa etmeye çalışır. Geçmiş ve şimdi arasında gidip gelen bu dokunaklı aşk hikayesi, kayıp ve anılar üzerine.',
    cover: 'https://images.unsplash.com/photo-1487147264018-f937fba0c817?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rJTIwY292ZXIlMjBkZXNpZ258ZW58MXx8fHwxNzY1OTM2Nzc1fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 2,
    title: 'Suç ve Ceza',
    author: 'Fyodor Dostoyevski',
    genre: 'Klasik',
    year: '1866',
    rating: 4.9,
    pages: 671,
    publisher: 'İş Bankası Kültür',
    description: 'Fakir bir öğrenci olan Raskolnikov, bir tefecinin öldürülmesinin topluma faydalı olacağını düşünür. Ancak cinayetin ardından vicdanı ile hesaplaşmak zorunda kalır.',
    cover: 'https://images.unsplash.com/photo-1633099158362-17b8ba5b27db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwYm9vayUyMHN0YWNrfGVufDF8fHx8MTc2NjA0NjI0OHww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 3,
    title: '1984',
    author: 'George Orwell',
    genre: 'Distopya',
    year: '1949',
    rating: 4.6,
    pages: 328,
    publisher: 'Can Yayınları',
    description: 'Totaliter bir rejimin hüküm sürdüğü distopik bir dünyada, Winston Smith gerçeği ve özgürlüğü aramaya başlar. Big Brother her yerdedir ve her şeyi görmektedir.',
    cover: 'https://images.unsplash.com/photo-1645394183074-9b334d15a605?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkdW5lJTIwYm9vayUyMGNvdmVyfGVufDF8fHx8MTc2NTk4NDg5MHww&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

const trendingMusic = [
  {
    id: 1,
    title: 'Kind of Blue',
    artist: 'Miles Davis',
    album: 'Kind of Blue',
    genre: 'Caz',
    releaseYear: '1959',
    rating: 4.9,
    tracks: 5,
    description: 'Caz tarihinin en önemli ve en çok satan albümlerinden biri. Modal caz türünün başyapıtı olarak kabul edilir.',
    cover: 'https://images.unsplash.com/photo-1635135449992-c3438898371b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwdmlueWwlMjByZWNvcmR8ZW58MXx8fHwxNjYwNDYyNDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 2,
    title: 'The Dark Side of the Moon',
    artist: 'Pink Floyd',
    album: 'The Dark Side of the Moon',
    genre: 'Progressive Rock',
    releaseYear: '1973',
    rating: 4.8,
    tracks: 10,
    description: 'Pink Floyd\'un en ikonik albümü. Modern hayatın baskıları, zaman, ölüm ve delilik temalarını işler.',
    cover: 'https://images.unsplash.com/photo-1619983081563-430f63602796?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW55bCUyMHJlY29yZCUyMGFsYnVtfGVufDF8fHx8MTc2NjA0NjI0OHww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 3,
    title: 'Abbey Road',
    artist: 'The Beatles',
    album: 'Abbey Road',
    genre: 'Rock',
    releaseYear: '1969',
    rating: 4.7,
    tracks: 17,
    description: 'The Beatles\'ın son kaydettiği albüm. "Come Together" ve "Here Comes the Sun" gibi klasik şarkıları içerir.',
    cover: 'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMGFsYnVtJTIwdmlueWx8ZW58MXx8fHwxNzY2MDQ2MjQ4fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

const currentEvents = [
  {
    id: 1,
    title: 'İstanbul Film Festivali',
    description: 'Dünya sinemasından seçkin filmler ve yönetmen söyleşileri',
    date: '15-25 Mart 2024',
    location: 'Kadıköy, İstanbul',
    time: '19:00',
    attendees: 234,
    organizer: 'İstanbul Kültür Sanat Vakfı',
    image: 'https://images.unsplash.com/photo-1758978029869-55b1223f0878?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwZXZlbnQlMjBwb3N0ZXJ8ZW58MXx8fHwxNjYwNDYyNDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 2,
    title: 'Kitap Okuma Kulübü Buluşması',
    description: 'Bu ay "Simyacı" kitabını tartışıyoruz. Kahve eşliğinde keyifli bir söyleşi',
    date: '20 Mart 2024',
    location: 'Beyoğlu, İstanbul',
    time: '14:00',
    attendees: 45,
    organizer: 'Kitap Severler Kulübü',
    image: 'https://images.unsplash.com/photo-1719935115623-4857df23f3c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBleGhpYml0aW9uJTIwZ2FsbGVyeXxlbnwxfHx8fDE3NjU5NDI2ODd8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 3,
    title: 'Caz Akşamları: Canlı Performans',
    description: 'Klasik caz standardları ve doğaçlama performanslar',
    date: '22 Mart 2024',
    location: 'Nişantaşı, İstanbul',
    time: '21:00',
    attendees: 156,
    organizer: 'Nardis Jazz Club',
    image: 'https://images.unsplash.com/photo-1635135449992-c3438898371b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwdmlueWwlMjByZWNvcmR8ZW58MXx8fHwxNjYwNDYyNDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

export function ExploreScreen() {
  const [selectedDetail, setSelectedDetail] = useState<any>(null);

  const handleMovieClick = (movie: typeof trendingMovies[0]) => {
    setSelectedDetail({
      type: 'movie',
      id: movie.id,
      title: movie.title,
      image: movie.poster,
      director: movie.director,
      year: movie.year,
      rating: movie.rating,
      duration: movie.duration,
      genre: movie.genre,
      description: movie.description,
      cast: movie.cast,
    });
  };

  const handleBookClick = (book: typeof trendingBooks[0]) => {
    setSelectedDetail({
      type: 'book',
      id: book.id,
      title: book.title,
      image: book.cover,
      author: book.author,
      genre: book.genre,
      year: book.year,
      rating: book.rating,
      pages: book.pages,
      publisher: book.publisher,
      description: book.description,
    });
  };

  const handleMusicClick = (music: typeof trendingMusic[0]) => {
    setSelectedDetail({
      type: 'music',
      id: music.id,
      title: music.title,
      image: music.cover,
      artist: music.artist,
      album: music.album,
      genre: music.genre,
      releaseYear: music.releaseYear,
      rating: music.rating,
      tracks: music.tracks,
      description: music.description,
    });
  };

  const handleEventClick = (event: typeof currentEvents[0]) => {
    setSelectedDetail({
      type: 'event',
      id: event.id,
      title: event.title,
      image: event.image,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      attendees: event.attendees,
      organizer: event.organizer,
    });
  };

  if (selectedDetail) {
    return <ExploreDetailScreen data={selectedDetail} onClose={() => setSelectedDetail(null)} />;
  }

  return (
    <div className="pb-6">
      {/* Trending Topics Section */}
      <section className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
              Trend Konular
            </h2>
          </div>
          <button className="text-sm text-secondary hover:text-primary transition-colors">
            Tümünü Gör
          </button>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {trendingTopics.map((topic) => (
            <button
              key={topic.id}
              className={`flex-shrink-0 bg-gradient-to-br ${topic.color} rounded-xl px-5 py-4 border border-border/50 hover:shadow-lg hover:shadow-primary/10 transition-all`}
            >
              <p className="text-primary mb-1 whitespace-nowrap">{topic.name}</p>
              <p className="text-xs text-muted-foreground">{topic.count} gönderi</p>
            </button>
          ))}
        </div>
      </section>

      {/* Trending Movies Section */}
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-primary" />
            <h2 className="text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
              Trend Filmler
            </h2>
          </div>
          <button className="text-sm text-secondary hover:text-primary transition-colors">
            Tümünü Gör
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {trendingMovies.map((movie) => (
            <div
              key={movie.id}
              onClick={() => handleMovieClick(movie)}
              className="flex-shrink-0 w-36 bg-card rounded-xl overflow-hidden shadow-lg shadow-primary/5 border border-border/50 hover:shadow-xl hover:shadow-primary/10 transition-all cursor-pointer"
            >
              <div className="h-48 bg-muted overflow-hidden">
                <ImageWithFallback
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <h3 className="text-sm text-primary mb-1 line-clamp-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {movie.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">{movie.director}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{movie.year}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-accent fill-accent" />
                    <span className="text-xs text-primary">{movie.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Books Section */}
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
              Trend Kitaplar
            </h2>
          </div>
          <button className="text-sm text-secondary hover:text-primary transition-colors">
            Tümünü Gör
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {trendingBooks.map((book) => (
            <div
              key={book.id}
              onClick={() => handleBookClick(book)}
              className="flex-shrink-0 w-32 bg-card rounded-xl overflow-hidden shadow-lg shadow-primary/5 border border-border/50 hover:shadow-xl hover:shadow-primary/10 transition-all cursor-pointer"
            >
              <div className="h-44 bg-muted overflow-hidden">
                <ImageWithFallback
                  src={book.cover}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <h3 className="text-sm text-primary mb-1 line-clamp-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {book.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-1">{book.author}</p>
                <span className="inline-block text-xs text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                  {book.genre}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Music Section */}
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            <h2 className="text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
              Trend Müzik
            </h2>
          </div>
          <button className="text-sm text-secondary hover:text-primary transition-colors">
            Tümünü Gör
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {trendingMusic.map((music) => (
            <div
              key={music.id}
              onClick={() => handleMusicClick(music)}
              className="flex-shrink-0 w-36 bg-card rounded-xl overflow-hidden shadow-lg shadow-primary/5 border border-border/50 hover:shadow-xl hover:shadow-primary/10 transition-all cursor-pointer"
            >
              <div className="h-36 bg-muted overflow-hidden relative">
                <ImageWithFallback
                  src={music.cover}
                  alt={music.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                    <Music className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-sm text-primary mb-1 line-clamp-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {music.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">{music.artist}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{music.releaseYear}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-accent fill-accent" />
                    <span className="text-xs text-primary">{music.rating}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Current Events Section */}
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
              Güncel Etkinlikler
            </h2>
          </div>
          <button className="text-sm text-secondary hover:text-primary transition-colors">
            Tümünü Gör
          </button>
        </div>
        
        <div className="space-y-4">
          {currentEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => handleEventClick(event)}
              className="bg-card rounded-2xl overflow-hidden shadow-lg shadow-primary/5 border border-border/50 hover:shadow-xl hover:shadow-primary/10 transition-all cursor-pointer"
            >
              <div className="h-40 bg-muted overflow-hidden">
                <ImageWithFallback
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-primary mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {event.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  {event.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-card-foreground">
                    <Calendar className="w-4 h-4 text-secondary" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-card-foreground">
                    <Clock className="w-4 h-4 text-secondary" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-card-foreground">
                    <MapPin className="w-4 h-4 text-secondary" />
                    <span>{event.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{event.attendees} katılımcı</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      alert('Etkinliğe katılım onaylandı!');
                    }}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all"
                  >
                    <Ticket className="w-4 h-4" />
                    <span className="text-sm">Katıl</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
