import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient'; // Importação necessária
import { COLORS } from '@/styles/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

interface HeaderProps {
  centerElement: React.ReactNode;
  onOpenSettings: () => void;
  position?: 'absolute' | 'relative';
}

export const Header = ({ centerElement, onOpenSettings, position = 'relative' }: HeaderProps) => {
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();

  return (
    <LinearGradient
  // Ajuste as cores: Sólido no topo para esconder o que sobe no scroll, 
  // transparente na base para o fundo aparecer
  colors={[COLORS.background, 'rgba(2, 6, 23, 0.8)', 'transparent']}
  // O 0.6 garante que a cor sólida cubra toda a área dos botões (config e voltar)
  locations={[0, 0.6, 1]} 
  style={[styles.container, { position }]}
>
      {/* ESQUERDA: Botão Voltar */}
      <View style={styles.side}>
        {canGoBack && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBtn}>
            <View style={styles.backArrow} />
          </TouchableOpacity>
        )}
      </View>

      {/* CENTRO */}
      <View style={styles.center}>
        {centerElement}
      </View>

      {/* DIREITA: Configurações */}
      <View style={styles.side}>
        <TouchableOpacity onPress={onOpenSettings} style={styles.circleBtn}>
          <Ionicons name="settings-outline" size={25} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50, // Espaço para a Notch/StatusBar
    height: 140,
    width: '100%',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  side: { 
    width: 50, 
    alignItems: 'center' 
  },
  center: { 
    flex: 1, 
    alignItems: 'center',
    justifyContent: 'center'
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  backArrow: {
    width: 12, 
    height: 12, 
    borderLeftWidth: 2, 
    borderBottomWidth: 2,
    borderColor: '#FFF', 
    transform: [{ rotate: '45deg' }], 
    marginLeft: 4
  },
});