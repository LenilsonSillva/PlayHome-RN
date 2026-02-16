import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CustomText } from '@/styles/customText';
import { COLORS } from '@/styles/theme';

export const LobbyOnline = () => {
  return (
    <View style={styles.container}>
      <CustomText style={styles.icon}>📡</CustomText>
      <CustomText variant="h2">CONEXÃO INSTÁVEL</CustomText>
      <CustomText style={{ textAlign: 'center', opacity: 0.6 }}>
        Os protocolos de rede estão sendo calibrados. Em breve você poderá enfrentar impostores de outras galáxias.
      </CustomText>
      <View style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 15 },
  icon: { fontSize: 60 },
  loader: { width: 100, height: 2, backgroundColor: COLORS.cyan, marginTop: 20 }
});