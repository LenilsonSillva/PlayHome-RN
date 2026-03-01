import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { COLORS } from '@/styles/theme';
import { CustomText } from '@/styles/customText';

export const NewHostModal = ({ onConfirm }: { onConfirm: () => void }) => {
  return (
    <Modal transparent animationType="fade" visible={true}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <CustomText style={styles.icon}>👑</CustomText>
          <CustomText variant="h2" style={styles.title}>
            VOCÊ É O NOVO COMANDANTE!
          </CustomText>
          <CustomText style={styles.desc}>
            O comandante anterior desconectou. Você agora controla o jogo.
          </CustomText>
          <TouchableOpacity style={styles.btn} onPress={onConfirm}>
            <CustomText variant="label" style={{color: COLORS.background}}>ENTENDIDO</CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  modal: { backgroundColor: COLORS.surface, padding: 30, borderRadius: 20, borderWidth: 2, borderColor: COLORS.amber, alignItems: 'center', width: '100%' },
  icon: { fontSize: 50, marginBottom: 15 },
  title: { color: COLORS.amber, textAlign: 'center', marginBottom: 10 },
  desc: { color: COLORS.textSecondary, textAlign: 'center', marginBottom: 25 },
  btn: { backgroundColor: COLORS.amber, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, width: '100%', alignItems: 'center' }
});