import React, { useState } from 'react';
import { Camera, Edit2, MapPin, Link as LinkIcon, Calendar, BookOpen, Music, Theater, Users, UserPlus, Settings, Share2, MoreVertical, Crown, Feather, Palette, Sparkles } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { EditProfileScreen } from './EditProfileScreen';

export function ProfileScreen() {
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState('Edebiyat, sinema ve müzik tutkunu. Klasik eserlerden modern sanata kadar her şeye ilgi duyuyorum. Kitap okumak ve konser deneyimlerini paylaşmayı seviyorum.');
  const [showEditProfile, setShowEditProfile] = useState(false);

  const userProfile = {
    name: 'Ayşe Demir',
    username: '@aysedemir',
    isPremium: true, // Para yatıran üye
    location: 'İstanbul, Türkiye',
    website: 'aysedemir.com',
    joinDate: 'Ocak 2023',
    bannerImage: 'https://images.unsplash.com/photo-1665059691261-daa5bacdf826?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwYWNhZGVtaWElMjBsaWJyYXJ5JTIwYm9va3MlMjB2aW50YWdlfGVufDF8fHx8MTc2NjA2NTU5Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    profileImage: 'https://images.unsplash.com/photo-1649589244330-09ca58e4fa64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHByb2Zlc3Npb25hbCUyMHdvbWFufGVufDF8fHx8MTc2NTk3MDkxNHww&ixlib=rb-4.1.0&q=80&w=1080',
    stats: {
      followers: 1284,
      following: 342,
      booksRead: 156,
      concerts: 28,
      theaters: 45,
    },
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 150) {
      setBio(value);
    }
  };

  return (
    <div className="pb-20">
      {/* Banner */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20">
        <ImageWithFallback
          src={userProfile.bannerImage}
          alt="Profile Banner"
          className="w-full h-full object-cover"
        />
        {/* Banner Edit Button */}
        <button className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm text-primary p-2 rounded-full shadow-lg hover:bg-background transition-colors">
          <Camera className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Info Section */}
      <div className="px-4 -mt-16 relative">
        {/* Profile Picture */}
        <div className="relative inline-block">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-xl">
            <ImageWithFallback
              src={userProfile.profileImage}
              alt={userProfile.name}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Badge on Profile Picture */}
          {userProfile.isPremium && (
            <div className="absolute top-0 right-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 border-2 border-background shadow-lg flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
          )}
          {/* Profile Picture Edit Button */}
          <button className="absolute bottom-2 right-2 bg-primary text-primary-foreground p-2 rounded-full shadow-lg hover:shadow-xl transition-all">
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end mt-4 mb-4">
          <button className="p-2 rounded-xl border border-border hover:bg-muted/50 transition-colors">
            <Share2 className="w-5 h-5 text-primary" />
          </button>
          <button className="p-2 rounded-xl border border-border hover:bg-muted/50 transition-colors">
            <MoreVertical className="w-5 h-5 text-primary" />
          </button>
          <button
            className="px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
            onClick={() => setShowEditProfile(true)}
          >
            <Settings className="w-4 h-4" />
            <span>Profili Düzenle</span>
          </button>
        </div>

        {/* User Name & Username */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
              {userProfile.name}
            </h1>
            {userProfile.isPremium && (
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
                <Crown className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <p className="text-muted-foreground">{userProfile.username}</p>
        </div>

        {/* Bio Section */}
        <div className="mb-4">
          {isEditingBio ? (
            <div className="space-y-2">
              <textarea
                value={bio}
                onChange={handleBioChange}
                className="w-full p-3 rounded-xl border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={3}
                maxLength={150}
                placeholder="Kendinizden bahsedin..."
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{bio.length}/150 karakter</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditingBio(false)}
                    className="px-4 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={() => setIsEditingBio(false)}
                    className="px-4 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/30 transition-all"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <p className="text-card-foreground leading-relaxed pr-8">{bio}</p>
              <button
                onClick={() => setIsEditingBio(true)}
                className="absolute top-0 right-0 p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary transition-all"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            <span>{userProfile.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <LinkIcon className="w-4 h-4" />
            <a href={`https://${userProfile.website}`} className="text-primary hover:underline">
              {userProfile.website}
            </a>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>Katılım: {userProfile.joinDate}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Followers & Following */}
          <div className="col-span-2 flex gap-3">
            <button className="flex-1 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-2xl text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {userProfile.stats.followers.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Takipçi</p>
                </div>
              </div>
            </button>
            <button className="flex-1 bg-gradient-to-br from-secondary/10 to-accent/10 rounded-xl p-4 border border-secondary/20 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-secondary" />
                </div>
                <div className="text-left">
                  <p className="text-2xl text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {userProfile.stats.following.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Takip</p>
                </div>
              </div>
            </button>
          </div>

          {/* Books Read */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200/50 dark:border-amber-800/30">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-amber-700 dark:text-amber-500" />
              <p className="text-xs text-amber-700 dark:text-amber-500">Okuduğu Kitap</p>
            </div>
            <p className="text-2xl text-amber-900 dark:text-amber-400" style={{ fontFamily: "'Playfair Display', serif" }}>
              {userProfile.stats.booksRead}
            </p>
          </div>

          {/* Concerts */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200/50 dark:border-purple-800/30">
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-5 h-5 text-purple-700 dark:text-purple-500" />
              <p className="text-xs text-purple-700 dark:text-purple-500">Katıldığı Konser</p>
            </div>
            <p className="text-2xl text-purple-900 dark:text-purple-400" style={{ fontFamily: "'Playfair Display', serif" }}>
              {userProfile.stats.concerts}
            </p>
          </div>

          {/* Theaters */}
          <div className="col-span-2 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-800/30">
            <div className="flex items-center gap-2 mb-2">
              <Theater className="w-5 h-5 text-emerald-700 dark:text-emerald-500" />
              <p className="text-xs text-emerald-700 dark:text-emerald-500">Katıldığı Tiyatro</p>
            </div>
            <p className="text-2xl text-emerald-900 dark:text-emerald-400" style={{ fontFamily: "'Playfair Display', serif" }}>
              {userProfile.stats.theaters}
            </p>
          </div>
        </div>

        {/* Activity Tabs */}
        <div className="border-b border-border mb-6">
          <div className="flex gap-1">
            {['Gönderiler', 'Kitaplar', 'Filmler', 'Müzik'].map((tab, index) => (
              <button
                key={tab}
                className={`flex-1 py-3 px-4 transition-all ${
                  index === 0
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-primary hover:bg-muted/30'
                }`}
              >
                <span className="text-sm">{tab}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid - Placeholder */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="aspect-square bg-gradient-to-br from-muted/50 to-muted rounded-lg overflow-hidden hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfileScreen onClose={() => setShowEditProfile(false)} />
      )}
    </div>
  );
}