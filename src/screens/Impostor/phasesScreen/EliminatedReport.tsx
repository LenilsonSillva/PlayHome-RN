import React, { useState, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform, Text, ActivityIndicator } from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { Cards } from "@/components/Cards/Cards";
import { ImpostorPlayer, OnlineImpostorGame } from "@/games/impostor/types/game";
import { PlayerAvatar } from "@/games/common/components/PlayerAvatar";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { useAlert } from "@/contexts/alertContext";
import { useAudio } from "@/contexts/audioContext";
import { showInterstitialAd } from "@/services/ads/adsService";

interface Props {
  player: ImpostorPlayer | null;
  allPlayers: ImpostorPlayer[];
  votes: Record<string, string | null>;
  wasVoting: boolean;
  onNext: () => void | Promise<void>;
  isOnline?: boolean;
  onlinePlayer?: OnlineImpostorGame;
}

export const EliminatedReport = ({ player, allPlayers, votes, wasVoting, onNext, isOnline, onlinePlayer }: Props) => {
  const { t } = useTranslation();
  const { playSound } = useAudio();
  const [showLogs, setShowLogs] = useState(false);
  const date = new Date().toLocaleDateString();
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
  const { showAlert } = useAlert();
  const [isWaiting, setIsWaiting] = useState(false);

  const handleReturnCommand = async () => {
    setIsWaiting(true);
    try {
      // Aguarda se for Promise, senão executa normalmente
      const result = onNext();
      if (result instanceof Promise) {
        await result;
      }
      // Quando chega aqui, o backend respondeu (ou offline terminou) e a tela deve mudar
    } catch (error) {
      setIsWaiting(false);
      showAlert(t("alerts.error"), error as string);
    }
  };

  const roles = [
    t("games.impostor_eliminated_function1"),
    t("games.impostor_eliminated_function2"),
    t("games.impostor_eliminated_function3"),
    t("games.impostor_eliminated_function4"),
    t("games.impostor_eliminated_function5")
  ];
  const playerRole = player
    ? player?.isImpostor
      ? t("games.impostor_eliminated_impostor")
      : roles[player?.name.length % roles.length]
    : "";

  const voteStats = useMemo(() => {
    const stats: Record<string, number> = {};
    allPlayers.forEach((p) => (stats[p.id] = 0));
    Object.values(votes).forEach((targetId) => {
      if (targetId && stats[targetId] !== undefined) stats[targetId]++;
    });
    return stats;
  }, [votes, allPlayers]);

  const totalVotes = Object.keys(votes).length || 1;
  const totalVotesNull = Object.values(votes).filter((v) => v === null).length;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: isOnline ? (onlinePlayer?.isHost ? 130 : 30) : 130 }]}
      >
        <View style={{ height: 130 }} />
        {player ? (
          <View style={styles.badgeWrapper}>
            <Cards accentColor={player.color}>
              <View style={styles.badgeHeader}>
                <CustomText style={styles.headerText}>CREW IDENTIFICATION CARD</CustomText>
                <CustomText style={styles.serialText}>SN-{player.id.slice(0, 5).toUpperCase()}</CustomText>
              </View>

              <View style={styles.badgeBody}>
                <View style={styles.avatarSection}>
                  <PlayerAvatar emoji={player.emoji} color={player.color} size={90} />
                </View>

                <View style={styles.infoSection}>
                  <View>
                    <CustomText variant="label" style={styles.smallLabel}>
                      {t("games.impostor_eliminated_name")}
                    </CustomText>
                    <CustomText variant="h3" numberOfLines={1}>
                      {player.name.toUpperCase()}
                    </CustomText>
                  </View>

                  <View>
                    <CustomText variant="label" style={styles.smallLabel}>
                      {t("games.impostor_eliminated_function")}
                    </CustomText>
                    <CustomText
                      variant="body"
                      style={[
                        styles.infoText,
                        {
                          color: player.isImpostor ? COLORS.danger : COLORS.textPrimary,
                          fontSize: 14
                        }
                      ]}
                    >
                      {playerRole}
                    </CustomText>
                  </View>

                  <View>
                    <CustomText variant="label" style={styles.smallLabel}>
                      {t("games.impostor_eliminated_status")}
                    </CustomText>
                    <CustomText variant="body" style={styles.infoText}>
                      {date} | {time}
                    </CustomText>
                  </View>
                </View>
              </View>

              <View style={styles.stamp}>
                <CustomText style={styles.stampText}>{t("games.impostor_eliminated_eliminated")}</CustomText>
              </View>
            </Cards>
          </View>
        ) : (
          /* 2. CASO DE EMPATE OU NULO: MOSTRA CARD DE AVISO */
          <View style={styles.tieWrapper}>
            <Cards accentColor={COLORS.cyan}>
              <View style={styles.tieContent}>
                <Text style={{ fontSize: 40 }}>⚖️</Text>
                <CustomText variant="h2" style={styles.tieTitle}>
                  {t("games.impostor_eliminated_tie")}
                </CustomText>
                <CustomText variant="body" style={styles.tieSubtitle}>
                  {t("games.impostor_eliminated_tieText")}
                </CustomText>
              </View>
            </Cards>
          </View>
        )}

        {wasVoting && (
          <View style={styles.statsHUD}>
            <View style={styles.sectionHeader}>
              <View style={styles.dot} />
              <CustomText variant="label" style={styles.sectionTitle}>
                {t("games.impostor_eliminated_chartTitle")}
              </CustomText>
            </View>

            <View style={styles.graphBox}>
              {allPlayers.map((p) => {
                const count = voteStats[p.id] || 0;
                const width = (count / totalVotes) * 100;
                return (
                  <View key={p.id} style={styles.barRow}>
                    <View style={styles.barInfo}>
                      <CustomText style={styles.barName}>{p.name}</CustomText>
                      <CustomText style={styles.barPercent}>
                        {Math.round(width)}%{" "}
                        {count === 0
                          ? null
                          : count === 1
                            ? `(${count} ${t("games.impostor_eliminated_votes")})`
                            : `(${count} ${t("games.impostor_eliminated_votes")}s)`}
                      </CustomText>
                    </View>
                    <View style={styles.barTrack}>
                      <LinearGradient
                        start={{ x: 1, y: 0 }}
                        end={{ x: -1, y: 0 }}
                        colors={[p.color || COLORS.cyan, "transparent"]}
                        style={[styles.barFill, { width: `${width}%` }]}
                      />
                    </View>
                  </View>
                );
              })}

              <View style={[styles.barRow, styles.nullRow]}>
                <View style={styles.barInfo}>
                  <CustomText style={styles.nullName}>{t("games.impostor_eliminated_nullVotes")}</CustomText>
                  <CustomText style={styles.barPercent}>{Math.round((totalVotesNull / totalVotes) * 100)}%</CustomText>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${(totalVotesNull / totalVotes) * 100}%`,
                        backgroundColor: "#475569"
                      }
                    ]}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.terminalBtn}
              onPress={async () => {
                playSound("click2");

                try {
                  await showInterstitialAd();
                } catch (error) {
                  console.log("Ad não disponível, continuando...");
                }
                setShowLogs(!showLogs);
              }}
            >
              <CustomText variant="label" style={styles.terminalBtnText}>
                {showLogs
                  ? "[-] " + t("games.impostor_eliminated_closeLogsAccess")
                  : "[+] " + t("games.impostor_eliminated_logsAccess")}
              </CustomText>
            </TouchableOpacity>

            {showLogs && (
              <View style={styles.terminal}>
                <ScrollView nestedScrollEnabled style={styles.terminalScroll}>
                  {Object.entries(votes).map(([voterId, votedId], idx) => {
                    const voter = allPlayers.find((ap) => ap.id === voterId);
                    const target = allPlayers.find((ap) => ap.id === votedId);
                    return (
                      <CustomText key={voterId} style={styles.terminalLine}>
                        <CustomText style={styles.terminalTime}>[{idx + 1}]: </CustomText>
                        {t("games.impostor_eliminated_crew") + ":"} {voter?.name.toUpperCase()} {"->"}{" "}
                        {t("games.impostor_eliminated_target") + ":"}{" "}
                        {target?.name.toUpperCase() || t("games.impostor_eliminated_null")}
                      </CustomText>
                    );
                  })}
                  <CustomText style={styles.terminalEnd}>{t("games.impostor_eliminated_endTransmission")}</CustomText>
                </ScrollView>
              </View>
            )}
          </View>
        )}
        {isOnline
          ? !onlinePlayer?.isHost && (
              <View style={styles.footerNavNotHost}>
                <CustomText variant="h2">⏳</CustomText>
                <CustomText variant="label" style={styles.textFooterWaitHost}>
                  {t("games.impostor_eliminated_waitHost")}
                </CustomText>
              </View>
            )
          : null}
      </ScrollView>

      {(!isOnline || (isOnline && onlinePlayer?.isHost)) && (
        <View style={styles.footerNav}>
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => {
              setTimeout(() => {
                isOnline ? handleReturnCommand() : onNext();
              }, 100);
              playSound("click");
            }}
            disabled={isWaiting}
            activeOpacity={0.8}
          >
            {isWaiting ? (
              <ActivityIndicator size="large" color={COLORS.background} />
            ) : (
              <CustomText variant="h3" style={styles.nextBtnText}>
                {t("games.impostor_eliminated_returnBtn")}
              </CustomText>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
    width: "100%"
  },

  // Estilos do Crachá
  badgeWrapper: {
    aspectRatio: 2 / 1.4,
    width: "100%",
    maxWidth: 600,
    marginBottom: 40,
    maxHeight: 400,
    alignContent: "center",
    justifyContent: "center"
  },
  badgeHeader: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  headerText: { fontSize: 8, color: COLORS.textSecondary, fontWeight: "bold" },
  serialText: {
    fontSize: 8,
    color: COLORS.textSecondary,
    fontFamily: "monospace"
  },
  badgeBody: {
    flex: 1,
    flexDirection: "row",
    padding: 15,
    gap: 15,
    alignItems: "center"
  },
  avatarSection: { justifyContent: "center" },
  infoSection: { flex: 1, gap: 8 },
  smallLabel: { fontSize: 8, opacity: 0.5, marginBottom: 2 },
  infoText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "bold" },
  terminatedText: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: "900",
    marginTop: 2
  },
  // Estilos do Carimbo
  stamp: {
    position: "absolute",
    right: 20,
    bottom: 30,
    borderWidth: 4,
    borderColor: COLORS.danger,
    padding: 8,
    borderRadius: 10,
    transform: [{ rotate: "-15deg" }],
    backgroundColor: "rgba(2, 6, 23, 0.9)",
    zIndex: 10
  },
  stampText: {
    color: COLORS.danger,
    fontWeight: "900",
    fontSize: 22,
    letterSpacing: 2
  },
  // Estilos de Empate
  tieWrapper: { height: 240, width: "100%", maxWidth: 450, marginBottom: 40 },
  tieContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 10
  },
  tieTitle: { color: COLORS.cyan, textAlign: "center" },
  tieSubtitle: {
    color: COLORS.textSecondary,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20
  },

  // Stats HUD
  statsHUD: { width: "100%", marginTop: 10, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.cyan },
  sectionTitle: { color: COLORS.cyan, fontSize: 12 },

  graphBox: {
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  barRow: { marginBottom: 18 },
  barInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6
  },
  barName: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    textTransform: "uppercase"
  },
  barPercent: { fontSize: 13, color: COLORS.cyan, fontFamily: "monospace" },
  barTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 3,
    overflow: "hidden"
  },
  barFill: { height: "100%", borderRadius: 3 },

  nullRow: { marginTop: 10, opacity: 0.6 },
  nullName: { fontSize: 10, color: COLORS.textMuted },

  // Terminal
  terminalBtn: {
    marginTop: 25,
    padding: 15,
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "rgba(0, 242, 255, 0.3)",
    borderRadius: 12
  },
  terminalBtnText: { color: COLORS.cyan, fontSize: 10 },
  terminal: {
    marginTop: 15,
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.cyan,
    height: 200
  },
  terminalScroll: { flex: 1 },
  terminalLine: {
    color: COLORS.success,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 11,
    marginBottom: 6
  },
  terminalTime: { opacity: 0.5 },
  terminalEnd: {
    color: COLORS.cyan,
    fontSize: 9,
    marginTop: 10,
    textAlign: "center"
  },

  // Footer Navigation
  footerNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.background
  },
  nextBtn: {
    backgroundColor: COLORS.cyan,
    padding: 22,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: COLORS.cyan,
    shadowRadius: 15,
    shadowOpacity: 0.3,
    elevation: 10
  },
  nextBtnText: {
    color: COLORS.background,
    fontWeight: "900",
    letterSpacing: 2
  },
  footerNavNotHost: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingInline: 20,
    paddingTop: 30,
    gap: 10
  },
  textFooterWaitHost: {
    textAlign: "center"
  }
});
