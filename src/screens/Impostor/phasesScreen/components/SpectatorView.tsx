import React from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import { PlayerAvatar } from "@/games/common/components/PlayerAvatar";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import {
  ImpostorPlayer,
  OnlineImpostorGame
} from "@/games/impostor/types/game";

const { width } = Dimensions.get("window");

export function SpectatorView({ gameData }: { gameData: OnlineImpostorGame }) {
  const rawPlayers = gameData?.players ?? gameData?.allPlayers ?? [];
  const players = rawPlayers.map((p: ImpostorPlayer) => ({
    id: p.id ?? p.socketId,
    name: p.name,
    emoji: p.emoji,
    color: p.color,
    isAlive: p.isAlive !== false,
    voted: !!p.voted,
    ready: !!p.ready,
    score: p.score ?? 0
  }));

  return (
    <View style={styles.wrapper}>
      {/* Simulação de Scanline com bordas */}
      <View style={styles.scanline} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.liveBadge}>
            <View style={styles.dot} />
            <CustomText
              variant="label"
              style={{ color: COLORS.danger, fontSize: 10 }}
            >
              LIVE FEED
            </CustomText>
          </View>
          <CustomText variant="h1">
            OBSERVADOR{" "}
            <CustomText variant="h1" style={{ color: COLORS.textSecondary }}>
              TÁTICO
            </CustomText>
          </CustomText>
          <CustomText variant="hint">
            Monitoramento de tripulação em tempo real
          </CustomText>
        </View>

        <View style={styles.statusBox}>
          <CustomText variant="label">
            ESTADO DO SISTEMA:{" "}
            <CustomText style={{ color: COLORS.cyan }}>
              {gameData.phase?.toUpperCase()}
            </CustomText>
          </CustomText>
        </View>

        <View style={styles.squadGrid}>
          {players.map((p: any) => (
            <View
              key={p.id}
              style={[styles.playerCard, !p.isAlive && styles.deadCard]}
            >
              <PlayerAvatar
                emoji={p.emoji}
                color={p.isAlive ? p.color : COLORS.textSecondary}
                size={50}
                hideScan={!p.isAlive}
              />

              <View style={styles.playerInfo}>
                <CustomText variant="h3" numberOfLines={1}>
                  {p.name}
                </CustomText>
                <CustomText
                  variant="hint"
                  style={{ color: p.isAlive ? COLORS.success : COLORS.danger }}
                >
                  {p.isAlive ? "SINAL ATIVO" : "SINAL PERDIDO"}
                </CustomText>
              </View>

              <View style={styles.meta}>
                <CustomText style={styles.scoreText}>{p.score} PTS</CustomText>
                {gameData.phase === "voting" && p.isAlive && (
                  <View
                    style={[
                      styles.statusTag,
                      p.voted && { backgroundColor: COLORS.success }
                    ]}
                  >
                    <CustomText style={styles.tagText}>
                      {p.voted ? "VOTOU" : "..."}
                    </CustomText>
                  </View>
                )}
              </View>

              {!p.isAlive && (
                <View style={styles.kiaBadge}>
                  <CustomText style={styles.kiaText}>KIA</CustomText>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <CustomText variant="hint">
            AGUARDANDO FINALIZAÇÃO DA MISSÃO...
          </CustomText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: COLORS.background, paddingTop: 80 },
  scanline: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 2,
    borderTopColor: "rgba(0,242,255,0.05)",
    zIndex: 100
  },
  container: { padding: 25, paddingTop: 60, paddingBottom: 100 },
  header: { alignItems: "center", marginBottom: 30 },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.danger,
    padding: 5,
    borderRadius: 5,
    marginBottom: 10
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.danger },
  statusBox: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20
  },
  squadGrid: { gap: 12 },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 16,
    gap: 15
  },
  deadCard: { opacity: 0.5 },
  playerInfo: { flex: 1 },
  meta: { alignItems: "flex-end", gap: 5 },
  scoreText: { fontSize: 10, color: COLORS.amber, fontWeight: "bold" },
  statusTag: {
    backgroundColor: COLORS.textSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  tagText: { fontSize: 8, fontWeight: "900", color: "#FFF" },
  kiaBadge: {
    position: "absolute",
    right: 20,
    borderWidth: 1,
    borderColor: COLORS.danger,
    padding: 2,
    borderRadius: 4,
    transform: [{ rotate: "-15deg" }]
  },
  kiaText: { color: COLORS.danger, fontSize: 10, fontWeight: "bold" },
  footer: { marginTop: 40, alignItems: "center" }
});
