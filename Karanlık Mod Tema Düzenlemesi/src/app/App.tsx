import { useState } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  Home, 
  MessageCircle, 
  Plus, 
  User,
  Heart,
  MessageSquare,
  Repeat2,
  Bookmark,
  Share2,
  MoreVertical,
  BookOpen,
  Film,
  Music2,
  Calendar,
  Sparkles,
  TrendingUp,
  Quote,
  Moon,
  Sun
} from 'lucide-react';

interface Post {
  id: string;
  author: string;
  username: string;
  avatar: string;
  timestamp: string;
  content: string;
  category?: {
    name: string;
    icon: 'book' | 'film' | 'music' | 'event';
  };
  likes: number;
  comments: number;
  retweets: number;
  saves: number;
  isLiked: boolean;
  isBookmarked: boolean;
  mediaType?: 'image' | 'quote' | 'review';
  mediaContent?: string;
  quoteAuthor?: string;
  rating?: number;
}

const mockPosts: Post[] = [
  {
    id: '1',
    author: 'Elif Şafak',
    username: '@elifsafak',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    timestamp: '2 saat önce',
    content: 'Dostoyevski\'nin "Suç ve Ceza" romanını yeniden okumak, her seferinde farklı bir deneyim. İnsan psikolojisinin bu kadar derinlemesine incelenmesi harika.',
    category: {
      name: 'Edebiyat',
      icon: 'book'
    },
    mediaType: 'quote',
    quoteAuthor: 'Fyodor Dostoyevski - Suç ve Ceza',
    mediaContent: '"İnsan her şeye alışır, işte bu adamın en belirgin özelliğidir."',
    likes: 1284,
    comments: 156,
    retweets: 423,
    saves: 892,
    isLiked: true,
    isBookmarked: true,
    rating: 5
  },
  {
    id: '2',
    author: 'Cem Yılmaz',
    username: '@cemyilmaz',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    timestamp: '5 saat önce',
    content: 'Christopher Nolan\'ın Oppenheimer filmi görsel bir şölen. Sinematografisi, müziği ve oyunculukları ile muhteşem bir yapım. IMAX\'te izlemenizi şiddetle tavsiye ederim.',
    category: {
      name: 'Sinema',
      icon: 'film'
    },
    mediaContent: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop',
    likes: 2156,
    comments: 287,
    retweets: 634,
    saves: 1123,
    isLiked: false,
    isBookmarked: true,
    rating: 5
  },
  {
    id: '3',
    author: 'Sezen Aksu',
    username: '@sezenaksu',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    timestamp: '1 gün önce',
    content: 'Pink Floyd\'un "The Dark Side of the Moon" albümü 50 yaşında ama hala güncelliğini koruyor. Time, Money, Us and Them... Her bir parça ayrı bir başyapıt.',
    category: {
      name: 'Müzik',
      icon: 'music'
    },
    mediaContent: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&h=400&fit=crop',
    likes: 3421,
    comments: 412,
    retweets: 891,
    saves: 2134,
    isLiked: true,
    isBookmarked: false
  },
  {
    id: '4',
    author: 'Orhan Pamuk',
    username: '@orhanpamuk',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    timestamp: '3 saat önce',
    content: 'İstanbul Modern\'deki yeni sergi harika. Türk resim sanatının 20. yüzyıldaki evrimini görmek için mükemmel bir fırsat. Bu hafta sonu mutlaka gidin.',
    category: {
      name: 'Etkinlik',
      icon: 'event'
    },
    mediaContent: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=600&h=400&fit=crop',
    likes: 892,
    comments: 94,
    retweets: 234,
    saves: 567,
    isLiked: false,
    isBookmarked: false
  }
];

const CategoryIcon = ({ type }: { type: 'book' | 'film' | 'music' | 'event' }) => {
  const iconClass = "w-3.5 h-3.5";
  switch (type) {
    case 'book': return <BookOpen className={iconClass} />;
    case 'film': return <Film className={iconClass} />;
    case 'music': return <Music2 className={iconClass} />;
    case 'event': return <Calendar className={iconClass} />;
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'trendler' | 'takip'>('trendler');
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [darkMode, setDarkMode] = useState(true);

  const toggleLike = (id: string) => {
    setPosts(posts.map(post => 
      post.id === id ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 } : post
    ));
  };

  const toggleBookmark = (id: string) => {
    setPosts(posts.map(post => 
      post.id === id ? { ...post, isBookmarked: !post.isBookmarked, saves: post.isBookmarked ? post.saves - 1 : post.saves + 1 } : post
    ));
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50">
          <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
            <button className="p-2.5 -ml-2 hover:bg-accent/50 rounded-xl transition-all">
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            
            <div className="flex items-center gap-2">
              <h1 className="text-2xl tracking-tight text-foreground" style={{ fontFamily: 'var(--font-serif)' }}>
                KültüraX
              </h1>
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 hover:bg-accent/50 rounded-xl transition-all"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-foreground" />
                ) : (
                  <Moon className="w-5 h-5 text-foreground" />
                )}
              </button>
              <button className="p-2.5 hover:bg-accent/50 rounded-xl transition-all">
                <Search className="w-5 h-5 text-foreground" />
              </button>
              <button className="p-2.5 hover:bg-accent/50 rounded-xl transition-all relative">
                <Bell className="w-5 h-5 text-foreground" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="max-w-2xl mx-auto px-4 flex gap-1">
            <button
              onClick={() => setActiveTab('trendler')}
              className={`px-8 py-4 rounded-t-2xl transition-all relative ${
                activeTab === 'trendler'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
              }`}
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trendler
              </span>
              {activeTab === 'trendler' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('takip')}
              className={`px-8 py-4 rounded-t-2xl transition-all relative ${
                activeTab === 'takip'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
              }`}
            >
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Takip
              </span>
              {activeTab === 'takip' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>
              )}
            </button>
          </div>
        </div>

        {/* Feed */}
        <main className="max-w-2xl mx-auto pb-24 px-4">
          <div className="space-y-4 pt-4">
            {posts.map((post) => (
              <article key={post.id} className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="p-5">
                  {/* Post Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <img 
                      src={post.avatar} 
                      alt={post.author}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-border/50"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium text-foreground" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem' }}>
                              {post.author}
                            </h3>
                            <span className="text-sm text-muted-foreground">@{post.username.replace('@', '')}</span>
                            <span className="text-sm text-muted-foreground">·</span>
                            <span className="text-sm text-muted-foreground">{post.timestamp}</span>
                          </div>
                          {post.category && (
                            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                              <CategoryIcon type={post.category.icon} />
                              <span className="text-xs font-medium">{post.category.name}</span>
                            </div>
                          )}
                        </div>
                        <button className="p-1.5 hover:bg-accent/50 rounded-lg transition-all">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="mb-4">
                    <p className="text-foreground leading-relaxed mb-3">
                      {post.content}
                    </p>

                    {/* Quote Block */}
                    {post.mediaType === 'quote' && post.mediaContent && (
                      <div className="relative rounded-xl bg-muted/30 border border-border/50 p-5 my-3">
                        <Quote className="absolute top-4 left-4 w-8 h-8 text-primary/20" />
                        <p className="text-foreground/90 italic pl-8 leading-relaxed" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem' }}>
                          {post.mediaContent}
                        </p>
                        {post.quoteAuthor && (
                          <p className="text-sm text-muted-foreground mt-3 pl-8">
                            — {post.quoteAuthor}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Image Media */}
                    {post.mediaContent && post.mediaType !== 'quote' && (
                      <div className="rounded-xl overflow-hidden mt-3 border border-border/50">
                        <img 
                          src={post.mediaContent} 
                          alt="Post media"
                          className="w-full h-64 object-cover"
                        />
                      </div>
                    )}

                    {/* Rating */}
                    {post.rating && (
                      <div className="flex items-center gap-1 mt-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span 
                            key={i}
                            className={i < post.rating! ? 'text-primary' : 'text-border'}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/30">
                    <button 
                      onClick={() => toggleLike(post.id)}
                      className="flex items-center gap-2 group"
                    >
                      <div className="p-2 rounded-full group-hover:bg-pink-500/10 transition-all">
                        <Heart 
                          className={`w-5 h-5 transition-all ${
                            post.isLiked 
                              ? 'fill-pink-500 text-pink-500' 
                              : 'text-muted-foreground group-hover:text-pink-500'
                          }`} 
                        />
                      </div>
                      <span className={`text-sm font-medium ${post.isLiked ? 'text-pink-500' : 'text-muted-foreground'}`}>
                        {post.likes.toLocaleString('tr-TR')}
                      </span>
                    </button>

                    <button className="flex items-center gap-2 group">
                      <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-all">
                        <MessageSquare className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 transition-all" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground group-hover:text-blue-500">
                        {post.comments.toLocaleString('tr-TR')}
                      </span>
                    </button>

                    <button className="flex items-center gap-2 group">
                      <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-all">
                        <Repeat2 className="w-5 h-5 text-muted-foreground group-hover:text-green-500 transition-all" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground group-hover:text-green-500">
                        {post.retweets.toLocaleString('tr-TR')}
                      </span>
                    </button>

                    <button 
                      onClick={() => toggleBookmark(post.id)}
                      className="flex items-center gap-2 group"
                    >
                      <div className="p-2 rounded-full group-hover:bg-primary/10 transition-all">
                        <Bookmark 
                          className={`w-5 h-5 transition-all ${
                            post.isBookmarked 
                              ? 'fill-primary text-primary' 
                              : 'text-muted-foreground group-hover:text-primary'
                          }`} 
                        />
                      </div>
                      <span className={`text-sm font-medium ${post.isBookmarked ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}>
                        {post.saves.toLocaleString('tr-TR')}
                      </span>
                    </button>

                    <button className="group">
                      <div className="p-2 rounded-full group-hover:bg-accent transition-all">
                        <Share2 className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-all" />
                      </div>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border/50">
          <div className="max-w-2xl mx-auto px-4 h-20 flex items-center justify-around">
            <button className="p-3 rounded-xl text-primary bg-primary/10 transition-all">
              <Home className="w-6 h-6" />
            </button>
            <button className="p-3 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
              <Search className="w-6 h-6" />
            </button>
            <button className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 -mt-6">
              <Plus className="w-7 h-7" strokeWidth={2.5} />
            </button>
            <button className="p-3 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
              <MessageCircle className="w-6 h-6" />
            </button>
            <button className="p-3 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
              <User className="w-6 h-6" />
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
