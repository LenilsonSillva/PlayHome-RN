import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal } from "react-native";
import { COLORS, THEME } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { Cards } from "@/components/Cards/Cards";
import { ImpostorGame, ImpostorPlayer } from "@/games/impostor/types/game";
import { PlayerAvatar } from "@/games/common/components/PlayerAvatar";

interface Props {
  data: ImpostorGame;
  onConfirmElimination: (player: ImpostorPlayer | null) => void;
}

export const EliminationPhase = ({ data, onConfirmElimination }: Props) => {
  const [target, setTarget] = useState<ImpostorPlayer | null>(null);
  const alivePlayers = data.players.filter((p) => p.isAlive);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <CustomText variant="label" style={styles.cyanText}>SISTEMA DE SEGURANÇA</CustomText>
          <CustomText variant="h1">CONTROLE DO <CustomText variant="h1" style={{color: COLORS.danger}}>HOST</CustomText></CustomText>
          <CustomText variant="body" style={styles.subtitle}>
            Selecione o tripulante para o protocolo de ejeção.
          </CustomText>
        </View>

        <View style={styles.grid}>
          {alivePlayers.map((player) => (
            <TouchableOpacity 
              key={player.id} 
              style={styles.card}
              onPress={() => setTarget(player)}
            >
              <Cards accentColor={COLORS.surfaceLight}>
                <View style={styles.cardContent}>
                  <PlayerAvatar emoji={player.emoji} color={player.color} size={50} />
                  <CustomText variant="h3" numberOfLines={1}>{player.name}</CustomText>
                  <View style={styles.targetMark}>
                    <CustomText style={styles.targetText}>[ SELECIONAR ]</CustomText>
                  </View>
                </View>
              </Cards>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.skipBtn} onPress={() => onConfirmElimination(null)}>
          <CustomText variant="label" style={styles.skipText}>PULAR PROTOCOLO DE EXPULSÃO</CustomText>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL DE CONFIRMAÇÃO */}
      <Modal visible={!!target} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Cards accentColor={COLORS.danger}>
              <View style={styles.modalInner}>
                <CustomText variant="label" style={{color: COLORS.danger}}>ALERTA CRÍTICO</CustomText>
                <CustomText variant="h2" style={styles.modalTitle}>CONFIRMAR EXPULSÃO?</CustomText>
                
                <View style={styles.preview}>
                  <PlayerAvatar emoji={target?.emoji || ""} color={target?.color || ""} size={80} />
                  <CustomText variant="h1">{target?.name}</CustomText>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancel} onPress={() => setTarget(null)}>
                    <CustomText variant="label">ABORTAR</CustomText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.confirm} 
                    onPress={() => { onConfirmElimination(target); setTarget(null); }}
                  >
                    <CustomText variant="label" style={{color: COLORS.background}}>EJETAR</CustomText>
                  </TouchableOpacity>
                </View>
              </View>
            </Cards>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 100 },
  header: { alignItems: 'center', marginBottom: 30 },
  cyanText: { color: COLORS.cyan, letterSpacing: 3 },
  subtitle: { textAlign: 'center', opacity: 0.6, marginTop: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 15 },
  card: { width: '47%', height: 160 },
  cardContent: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  targetMark: { marginTop: 5, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', width: '100%', alignItems: 'center', paddingTop: 5 },
  targetText: { fontSize: 8, color: COLORS.textSecondary, letterSpacing: 1 },
  skipBtn: { marginTop: 30, padding: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.textSecondary, borderRadius: 15, alignItems: 'center' },
  skipText: { color: COLORS.textSecondary, fontSize: 10 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  modalBox: { height: 380 },
  modalInner: { flex: 1, justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { textAlign: 'center' },
  preview: { alignItems: 'center', gap: 10 },
  modalActions: { flexDirection: 'row', gap: 15 },
  cancel: { flex: 1, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: COLORS.textSecondary, alignItems: 'center' },
  confirm: { flex: 1, padding: 15, borderRadius: 12, backgroundColor: COLORS.danger, alignItems: 'center' }
});