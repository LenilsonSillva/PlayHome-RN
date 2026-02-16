import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { PlayerAvatar } from "@/games/common/components/PlayerAvatar";
import { ImpostorGame } from "@/games/impostor/types/game";

interface Props {
  data: ImpostorGame;
  onNextRound: () => void;
}

export const ResultPhase = ({ data, onNextRound }: Props) => {
  // 1. Cálculo de Vitória (Regra: Impostores >= Tripulantes)
  const survivors = data.players.filter(p => p.isAlive);
  const impostorsAlive = survivors.filter(p => p.isImpostor).length;
  
  const crewWon = impostorsAlive === 0;

  const sortedPlayers = useMemo(() => {
    return [...data.players].sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [data.players]);

  const top3 = sortedPlayers.slice(0, 3);
  const remaining = sortedPlayers.slice(3);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* BANNER DE VITÓRIA */}
        <View style={styles.victoryBanner}>
          <CustomText variant="label" style={{ color: crewWon ? COLORS.cyan : COLORS.danger }}>
            {crewWon ? "MISSÃO BEM SUCEDIDA" : "SISTEMA COMPROMETIDO"}
          </CustomText>
          {/* COR DINÂMICA DO TÍTULO */}
          <CustomText 
            variant="h1" 
            style={[styles.victoryTitle, { color: crewWon ? COLORS.cyan : COLORS.danger }]}
          >
            {crewWon ? "VITÓRIA DA\nTRIPULAÇÃO" : "VITÓRIA DOS\nIMPOSTORES"}
          </CustomText>
        </View>

        {/* PÓDIO */}
        <View style={styles.podiumContainer}>
          <CustomText variant="label" style={styles.sectionTitle}>LÍDERES DA UNIDADE</CustomText>
          <View style={styles.podiumRow}>
            {top3[1] && (
              <View style={[styles.podiumSpot, { marginTop: 40 }]}>
                <PlayerAvatar emoji={top3[1].emoji} color={top3[1].color} size={60} hideScan />
                <CustomText variant="h3" numberOfLines={1}>{top3[1].name}</CustomText>
                <View style={[styles.bar, { height: 60, backgroundColor: COLORS.textSecondary }]} />
                <CustomText variant="h3" style={styles.pointsText}>{top3[1].score} pts</CustomText>
              </View>
            )}

            {top3[0] && (
              <View style={styles.podiumSpot}>
                <View style={styles.crown}><CustomText style={{ fontSize: 24 }}>👑</CustomText></View>
                <PlayerAvatar emoji={top3[0].emoji} color={top3[0].color} size={80} hideScan />
                <CustomText variant="h3" numberOfLines={1}>{top3[0].name}</CustomText>
                <View style={[styles.bar, { height: 100, backgroundColor: COLORS.amber }]} />
                <CustomText variant="h2" style={styles.pointsText}>{top3[0].score} pts</CustomText>
              </View>
            )}

            {top3[2] && (
              <View style={[styles.podiumSpot, { marginTop: 60 }]}>
                <PlayerAvatar emoji={top3[2].emoji} color={top3[2].color} size={50} hideScan />
                <CustomText variant="h3" numberOfLines={1}>{top3[2].name}</CustomText>
                <View style={[styles.bar, { height: 40, backgroundColor: '#8a4b08' }]} />
                <CustomText variant="h3" style={styles.pointsText}>{top3[2].score} pts</CustomText>
              </View>
            )}
          </View>
        </View>

        {/* RESTO DO RANKING */}
        <View style={styles.rankingList}>
          {remaining.map((p, i) => (
            <View key={p.id} style={styles.rankingRow}>
              <CustomText variant="h3" style={styles.rowRank}>{i + 4}º</CustomText>
              <PlayerAvatar emoji={p.emoji} color={p.color} size={35} hideScan />
              <CustomText variant="body" style={styles.rowName}>{p.name}</CustomText>
              <CustomText variant="h3" style={styles.rowPoints}>{p.score} pts</CustomText>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* BOTÃO FIXO NO RODAPÉ */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={onNextRound}>
          <CustomText variant="h3" style={{ color: COLORS.background }}>PRÓXIMA PALAVRA 🚀</CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 25, paddingTop: 30, paddingBottom: 120 },
  victoryBanner: { alignItems: 'center', marginBottom: 40 },
  victoryTitle: { textAlign: 'center', fontSize: 32, marginTop: 10, lineHeight: 38, fontWeight: '900' },
  sectionTitle: { textAlign: 'center', opacity: 0.4, marginBottom: 30, letterSpacing: 3 },
  podiumContainer: { marginBottom: 40 },
  podiumRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', height: 240 },
  podiumSpot: { flex: 1, alignItems: 'center', gap: 5 },
  bar: { width: '80%', borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  pointsText: { color: COLORS.cyan, fontWeight: '800' },
  crown: { position: 'absolute', top: -30, zIndex: 10 },
  rankingList: { gap: 10, marginBottom: 50 },
  rankingRow: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, gap: 15 },
  rowRank: { width: 35, opacity: 0.5 },
  rowName: { flex: 1, fontWeight: 'bold', color: '#fff' },
  rowPoints: { color: COLORS.cyan },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  nextBtn: { backgroundColor: COLORS.cyan, padding: 20, borderRadius: 18, alignItems: 'center' }
});