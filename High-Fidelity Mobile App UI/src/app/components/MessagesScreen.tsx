import React, { useState } from 'react';
import { Search, MoreVertical, Phone, Video, Send, Smile, Paperclip, Trash2, Flag, Archive, UserCheck, X } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

// Mock data for conversations
const initialConversations = [
  {
    id: 1,
    user: {
      name: 'Elif Yıldız',
      avatar: 'https://images.unsplash.com/photo-1643732994192-03856991da2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0JTIwYXZhdGFyfGVufDF8fHx8MTc2NjA0OTA3N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    lastMessage: 'Dune kitabını bitirdin mi? Çok merak ediyorum!',
    time: '5 dk',
    unread: 2,
    online: true,
  },
  {
    id: 2,
    user: {
      name: 'Can Demir',
      avatar: 'https://images.unsplash.com/photo-1624835567150-0c530a20d8cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDF8fHx8MTc2NTk2NzExMnww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    lastMessage: 'O playlist\'i dinledim, çok beğendim 🎵',
    time: '1 sa',
    unread: 0,
    online: false,
  },
  {
    id: 3,
    user: {
      name: 'Selin Acar',
      avatar: 'https://images.unsplash.com/photo-1672462478040-a5920e2c23d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBzbWlsaW5nJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1OTY2NDU4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    lastMessage: 'Bu akşam film izlemeye var mısın?',
    time: '3 sa',
    unread: 0,
    online: true,
  },
  {
    id: 4,
    user: {
      name: 'Ahmet Kaya',
      avatar: 'https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjYwMjQ5NDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    lastMessage: 'Kitap kulübü toplantısı için hazır ol!',
    time: '5 sa',
    unread: 1,
    online: false,
  },
  {
    id: 5,
    user: {
      name: 'Zeynep Yılmaz',
      avatar: 'https://images.unsplash.com/photo-1649589244330-09ca58e4fa64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc2NjAyOTA0NHww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    lastMessage: 'Yeni kitap önerilerin var mı?',
    time: '1 gün',
    unread: 0,
    online: false,
  },
  {
    id: 6,
    user: {
      name: 'Mehmet Arslan',
      avatar: 'https://images.unsplash.com/photo-1672462478040-a5920e2c23d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBzbWlsaW5nJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzY1OTY2NDU4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    lastMessage: 'Teşekkürler! Alıntı çok güzelmiş 📚',
    time: '2 gün',
    unread: 0,
    online: false,
  },
];

// Mock data for message requests
const initialMessageRequests = [
  {
    id: 101,
    user: {
      name: 'Aylin Özkan',
      avatar: 'https://images.unsplash.com/photo-1704726135027-9c6f034cfa41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2VyJTIwcG9ydHJhaXQlMjBhdmF0YXJ8ZW58MXx8fHwxNzY1OTg0ODkxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    message: 'Merhaba! Kafka üzerine yaptığın yorumları çok beğendim. Sohbet etmek isterim.',
    time: '10 dk',
  },
  {
    id: 102,
    user: {
      name: 'Burak Yıldırım',
      avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdCUyMGNhc3VhbHxlbnwxfHx8fDE3NjU5Njk4Njd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    message: 'Paylaştığın kitap listesine bayıldım! Benimle paylaşır mısın?',
    time: '2 sa',
  },
  {
    id: 103,
    user: {
      name: 'Deniz Kara',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0JTIwc21pbGV8ZW58MXx8fHwxNzY1OTY5OTM0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    message: 'Pink Floyd konseri hakkında konuşmak istiyorum 🎸',
    time: '5 sa',
  },
  {
    id: 104,
    user: {
      name: 'Emre Çelik',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdCUyMHNtaWxlfGVufDF8fHx8MTc2NTk2OTk3Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    message: 'Kitap kulübüne katılmak isterim, detayları öğrenebilir miyim?',
    time: '1 gün',
  },
];

export function MessagesScreen() {
  const [activeTab, setActiveTab] = useState<'messages' | 'requests'>('messages');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuConvId, setOpenMenuConvId] = useState<number | null>(null);
  const [conversations, setConversations] = useState(initialConversations);
  const [messageRequests, setMessageRequests] = useState(initialMessageRequests);

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread, 0);

  const handleDeleteConversation = (convId: number, userName: string) => {
    setConversations(conversations.filter(conv => conv.id !== convId));
    alert(`${userName} ile olan konuşma silindi`);
    setOpenMenuConvId(null);
  };

  const handleReportConversation = (convId: number, userName: string) => {
    alert(`${userName} şikayet edildi`);
    setOpenMenuConvId(null);
  };

  const handleArchiveConversation = (convId: number, userName: string) => {
    alert(`${userName} ile olan konuşma arşivlendi`);
    setOpenMenuConvId(null);
  };

  const handleAcceptRequest = (requestId: number) => {
    const request = messageRequests.find(req => req.id === requestId);
    if (request) {
      // Add to conversations
      const newConversation = {
        id: Date.now(), // Generate new ID
        user: request.user,
        lastMessage: request.message,
        time: request.time,
        unread: 1,
        online: false,
      };
      setConversations([newConversation, ...conversations]);
      
      // Remove from requests
      setMessageRequests(messageRequests.filter(req => req.id !== requestId));
      
      alert(`${request.user.name} kabul edildi ve mesajlar bölümüne eklendi!`);
    }
  };

  const handleDeclineRequest = (requestId: number, userName: string) => {
    setMessageRequests(messageRequests.filter(req => req.id !== requestId));
    alert(`${userName} mesaj isteği reddedildi`);
  };

  const handleDeleteRequest = (requestId: number, userName: string) => {
    setMessageRequests(messageRequests.filter(req => req.id !== requestId));
    alert(`${userName} mesaj isteği silindi`);
    setOpenMenuConvId(null);
  };

  const filteredConversations = conversations.filter(conv => 
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRequests = messageRequests.filter(req =>
    req.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-6">
      {/* Header Section */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
            Mesajlar
          </h2>
          {totalUnread > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2.5 py-1 rounded-full">
              {totalUnread} okunmamış
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Kültür ve sanat dostlarınla sohbet et
        </p>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 bg-muted/30 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 py-2.5 px-4 rounded-lg transition-all ${
              activeTab === 'messages'
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-card-foreground'
            }`}
          >
            <span className="text-sm font-medium">Mesajlar</span>
            {totalUnread > 0 && activeTab !== 'messages' && (
              <span className="ml-1.5 text-xs bg-primary text-primary-foreground px-1.5 rounded-full">
                {totalUnread}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2.5 px-4 rounded-lg transition-all ${
              activeTab === 'requests'
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-card-foreground'
            }`}
          >
            <span className="text-sm font-medium">İstekler</span>
            {messageRequests.length > 0 && activeTab !== 'requests' && (
              <span className="ml-1.5 text-xs bg-orange-500 text-white px-1.5 rounded-full">
                {messageRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={activeTab === 'messages' ? 'Mesajlarda ara...' : 'İsteklerde ara...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-muted/50 border border-border/30 rounded-xl text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
          />
        </div>
      </div>

      {/* Messages Tab Content */}
      {activeTab === 'messages' && (
        <div className="px-4 space-y-2">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className="flex items-center gap-3 p-4 bg-card hover:bg-muted/30 rounded-xl border border-border/30 transition-all cursor-pointer group"
            >
              {/* Avatar with Online Status */}
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-background">
                  <ImageWithFallback
                    src={conversation.user.avatar}
                    alt={conversation.user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {conversation.online && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                )}
              </div>

              {/* Message Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-card-foreground">
                    {conversation.user.name}
                  </h3>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {conversation.time}
                  </span>
                </div>
                <p className={`text-sm truncate ${
                  conversation.unread > 0 
                    ? 'text-card-foreground font-medium' 
                    : 'text-muted-foreground'
                }`}>
                  {conversation.lastMessage}
                </p>
              </div>

              {/* Unread Badge & More */}
              <div className="flex-shrink-0 flex items-center gap-2 relative">
                {conversation.unread > 0 && (
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                    {conversation.unread}
                  </div>
                )}
                <button
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted/50 rounded-lg transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuConvId(openMenuConvId === conversation.id ? null : conversation.id);
                  }}
                >
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* Context Menu */}
                {openMenuConvId === conversation.id && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuConvId(null);
                      }}
                    />
                    
                    {/* Menu */}
                    <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl shadow-2xl border border-border/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conversation.id, conversation.user.name);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/30"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-card-foreground">Konuşmayı Sil</span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReportConversation(conversation.id, conversation.user.name);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/30"
                      >
                        <Flag className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-card-foreground">Şikayet Et</span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchiveConversation(conversation.id, conversation.user.name);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                      >
                        <Archive className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-card-foreground">Arşivle</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {filteredConversations.length === 0 && (
            <div className="px-4 py-12 text-center">
              <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Henüz mesaj yok</p>
            </div>
          )}
        </div>
      )}

      {/* Requests Tab Content */}
      {activeTab === 'requests' && (
        <div className="px-4 space-y-2">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-card rounded-xl border border-border/30 overflow-hidden group"
            >
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-background">
                      <ImageWithFallback
                        src={request.user.avatar}
                        alt={request.user.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Request Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-card-foreground">
                        {request.user.name}
                      </h3>
                      <button
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted/50 rounded-lg transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuConvId(openMenuConvId === request.id ? null : request.id);
                        }}
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>

                      {/* Context Menu for Requests */}
                      {openMenuConvId === request.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenMenuConvId(null)}
                          />
                          <div className="absolute right-4 top-full mt-2 w-56 bg-card rounded-xl shadow-2xl border border-border/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <button
                              onClick={() => handleDeleteRequest(request.id, request.user.name)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                              <span className="text-sm text-card-foreground">İsteği Sil</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{request.time}</p>
                    <p className="text-sm text-card-foreground leading-relaxed">
                      {request.message}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeclineRequest(request.id, request.user.name)}
                    className="flex-1 py-2.5 px-4 rounded-lg border border-border hover:bg-muted/50 transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-card-foreground">Reddet</span>
                  </button>
                  <button
                    onClick={() => handleAcceptRequest(request.id)}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span className="text-sm">Kabul Et</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {filteredRequests.length === 0 && (
            <div className="px-4 py-12 text-center">
              <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-2">Yeni mesaj isteği yok</p>
              <p className="text-xs text-muted-foreground">
                Yeni birisi sana mesaj attığında burada görünecek
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
