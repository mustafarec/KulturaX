import React, { useState } from 'react';
import { ArrowLeft, Crown, Check, Sparkles, Zap, BookOpen, MessageCircle, TrendingUp, Eye } from 'lucide-react';

interface PremiumScreenProps {
  onClose: () => void;
}

export function PremiumScreen({ onClose }: PremiumScreenProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const benefits = [
    {
      icon: Crown,
      title: 'Premium Rozet',
      description: 'Profil ve gönderilerinizde emerald-teal gradient taç ikonu',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Eye,
      title: 'Öncelikli Görünürlük',
      description: 'Gönderileriniz daha fazla kişiye ulaşır',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: TrendingUp,
      title: 'Gelişmiş İstatistikler',
      description: 'Detaylı içerik analizi ve takipçi istatistikleri',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: BookOpen,
      title: 'Sınırsız Okuma Listeleri',
      description: 'İstediğiniz kadar okuma listesi ve koleksiyon oluşturun',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      icon: MessageCircle,
      title: 'Öncelikli Destek',
      description: '7/24 premium destek ekibimize erişim',
      gradient: 'from-red-500 to-orange-500',
    },
    {
      icon: Sparkles,
      title: 'Özel Temalar',
      description: 'Sadece premium üyelere özel renk temaları',
      gradient: 'from-indigo-500 to-purple-500',
    },
  ];

  const plans = [
    {
      id: 'monthly',
      name: 'Aylık',
      price: '₺49',
      period: '/ay',
      description: 'İstediğiniz zaman iptal edebilirsiniz',
      popular: false,
    },
    {
      id: 'yearly',
      name: 'Yıllık',
      price: '₺399',
      period: '/yıl',
      description: '2 ay bedava! (₺33/ay)',
      popular: true,
      savings: '%32 tasarruf',
    },
  ];

  const handleSubscribe = () => {
    alert(`${selectedPlan === 'monthly' ? 'Aylık' : 'Yıllık'} plan için ödeme sayfasına yönlendiriliyorsunuz...`);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-br from-emerald-500 to-teal-600">
        <div className="flex items-center gap-4 px-5 py-4">
          <button
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-amber-300" />
              <h1 className="text-xl text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                Premium Üyelik
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-5 pb-12 pt-6 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border-2 border-white/20">
          <Crown className="w-10 h-10 text-amber-300" />
        </div>
        <h2 className="text-3xl text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
          Premium'a Geçin
        </h2>
        <p className="text-white/90 leading-relaxed max-w-sm mx-auto">
          Kültür ve sanat deneyiminizi bir üst seviyeye taşıyın. Özel ayrıcalıklardan yararlanın.
        </p>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-5 -mt-6 pb-32">
        {/* Benefits */}
        <section className="bg-card rounded-2xl shadow-2xl shadow-primary/10 border border-border/50 p-5 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
              Premium Avantajlar
            </h3>
          </div>

          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center flex-shrink-0`}>
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-card-foreground font-medium mb-1">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Plans */}
        <section className="mb-6">
          <h3 className="text-lg text-primary mb-4 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
            Planınızı Seçin
          </h3>

          <div className="space-y-3">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id as 'monthly' | 'yearly')}
                className={`w-full p-5 rounded-2xl border-2 transition-all relative ${
                  selectedPlan === plan.id
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                    : 'border-border/50 bg-card hover:border-primary/30'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full">
                    <span className="text-xs text-white font-medium">En Popüler</span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  <div className="text-left">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </div>
                    <p className="text-card-foreground font-medium mt-1">{plan.name}</p>
                  </div>

                  {selectedPlan === plan.id ? (
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full border-2 border-muted" />
                  )}
                </div>

                <p className="text-sm text-muted-foreground text-left">{plan.description}</p>
                
                {plan.savings && (
                  <div className="mt-3 inline-block px-3 py-1 bg-emerald-500/10 text-emerald-600 text-xs font-medium rounded-full">
                    {plan.savings}
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Features Comparison */}
        <section className="bg-card rounded-2xl shadow-lg shadow-primary/5 border border-border/50 p-5 mb-6">
          <h3 className="text-lg text-primary mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ücretsiz vs Premium
          </h3>

          <div className="space-y-3">
            {[
              { feature: 'Temel sosyal özellikler', free: true, premium: true },
              { feature: 'Premium rozet', free: false, premium: true },
              { feature: 'Öncelikli görünürlük', free: false, premium: true },
              { feature: 'Gelişmiş istatistikler', free: false, premium: true },
              { feature: 'Sınırsız okuma listeleri', free: false, premium: true },
              { feature: 'Özel temalar', free: false, premium: true },
              { feature: 'Öncelikli destek', free: false, premium: true },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <span className="text-sm text-card-foreground">{item.feature}</span>
                <div className="flex items-center gap-6">
                  <div className="w-16 flex justify-center">
                    {item.free ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </div>
                  <div className="w-16 flex justify-center">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-6 mt-4 pt-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground w-16 text-center">Ücretsiz</span>
            <span className="text-xs text-muted-foreground w-16 text-center">Premium</span>
          </div>
        </section>

        {/* Trust Badges */}
        <div className="text-center mb-6 space-y-3">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-green-600" />
              <span>Güvenli ödeme</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-green-600" />
              <span>İstediğiniz zaman iptal</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
            İlk 7 gün ücretsiz deneme. İstediğiniz zaman iptal edebilirsiniz.
          </p>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/50 p-5 shadow-2xl">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSubscribe}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-2xl hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 font-medium"
          >
            <Zap className="w-5 h-5" />
            <span>Premium'a Başla - 7 Gün Ücretsiz</span>
          </button>
          <p className="text-xs text-center text-muted-foreground mt-3">
            {selectedPlan === 'monthly' ? '₺49/ay' : '₺399/yıl (₺33/ay)'}
          </p>
        </div>
      </div>
    </div>
  );
}
