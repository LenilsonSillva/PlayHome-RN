import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '@/styles/theme';
import Ionicons from '@expo/vector-icons/Ionicons';


interface HeaderProps {
  centerElement: React.ReactNode;
  onOpenSettings: () => void;
}

export const Header = ({ centerElement, onOpenSettings }: HeaderProps) => {
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();

  return (
    <View style={styles.container}>
      {/* ESQUERDA: Botão Voltar ou View Vazia */}
      <View style={styles.side}>
        {canGoBack && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBtn}>
            <View style={styles.backArrow} />
          </TouchableOpacity>
        )}
      </View>

      {/* CENTRO: Onde entra o PLAYHOME ou título da fase */}
      <View style={styles.center}>
        {centerElement}
      </View>
      {/* DIREITA: Configurações */}
      <View style={styles.side}>
        <TouchableOpacity onPress={onOpenSettings} style={styles.circleBtn}>
          <Ionicons name="settings-outline" size={25} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    height: 140,
    width: '100%',
  },
  side: { width: 50, alignItems: 'center' },
  center: { flex: 1, alignItems: 'center' },
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
    width: 12, height: 12, borderLeftWidth: 2, borderBottomWidth: 2,
    borderColor: '#FFF', transform: [{ rotate: '45deg' }], marginLeft: 4
  },
});