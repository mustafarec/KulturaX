import React, { useState } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Crown } from 'lucide-react-native';
import { PremiumModal } from './PremiumModal';

interface PremiumButtonProps {
    style?: any;
}

/**
 * Premium butonu
 * 
 * NOT: Superwall entegrasyonu geçici olarak devre dışı.
 * Google Play Console hazır olduğunda aktif edilecek.
 * 
 * TODO: Superwall'u aktif etmek için:
 * 1. Google Play Console'da uygulama oluştur
 * 2. Subscription ürünü tanımla
 * 3. Superwall Dashboard'da ürünü ekle
 * 4. Bu dosyadaki usePlacement kodunu uncomment yap
 */
export const PremiumButton: React.FC<PremiumButtonProps> = ({ style }) => {
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={style}>
                <LinearGradient
                    colors={['#10b981', '#0d9488']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10 }}
                >
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                        <Crown size={18} color="#fcd34d" fill="#fcd34d" strokeWidth={2.5} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>Premium'a Geç</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>Özel ayrıcalıklardan yararlan</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
            <PremiumModal visible={modalVisible} onClose={() => setModalVisible(false)} />
        </>
    );
};
