import React, { useMemo, useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions, LayoutAnimation } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  Easing
} from "react-native-reanimated";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { useTranslation } from "react-i18next";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { CryptoGameState, CryptoTeam } from "@/games/cryptography/types/game";
import { ImpostorBackground } from "@/components/Background/Background";

interface Props {
  gameState: CryptoGameState;
  onNextRound: () => void;
}

const { width, height } = Dimensions.get("window");

// =========================================================
// 🎇 EFEITO DE FOGOS DE ARTIFÍCIO
// =========================================================
const Particle = ({ color }: { color: string }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    const delay = Math.random() * 500;
    // O tamanho da partícula varia para dar realismo
    scale.value = withDelay(delay, withSpring(Math.random() * 0.6 + 0.4));

    // Dispara para cima e para os lados aleatoriamente
    translateY.value = withDelay(
      delay,
      withTiming(-500 - Math.random() * 300, { duration: 1500, easing: Easing.out(Easing.cubic) })
    );
    translateX.value = withDelay(
      delay,
      withTiming((Math.random() - 0.5) * width * 1.5, { duration: 1500, easing: Easing.out(Easing.cubic) })
    );

    // Desaparece suavemente no ar
    opacity.value = withDelay(delay + 800, withTiming(0, { duration: 700 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }]
  }));

  return <Animated.View style={[styles.particle, { backgroundColor: color }, animatedStyle]} />;
};

// =========================================================
// 😃 EMOJIS ANIMADOS DA EQUIPE VENCEDORA
// =========================================================
const AnimatedEmoji = ({ emoji, index, teamColor }: { emoji: string; index: number; teamColor: string }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Cada emoji pula em tempos diferentes para dar um efeito de "onda"
    translateY.value = withDelay(
      index * 150,
      withRepeat(withTiming(-20, { duration: 600, easing: Easing.inOut(Easing.ease) }), -1, true)
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <Animated.View style={[styles.emojiWrapper, { borderColor: teamColor }, animatedStyle]}>
      <CustomText style={{ fontSize: 40 }}>{emoji}</CustomText>
    </Animated.View>
  );
};

export const RoundResult = ({ gameState, onNextRound }: Props) => {
  const { t, i18n } = useTranslation();
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // 🏆 ORDENAÇÃO GERAL (Por pontos totais para o Bottom Sheet)
  const sortedTeams = useMemo(() => {
    return [...gameState.teams].sort((a, b) => b.score - a.score);
  }, [gameState.teams]);

  // ⭐ VENCEDOR DA RODADA (Destaque do Topo)
  const roundWinnerTeam = useMemo(() => {
    return [...gameState.teams].sort((a, b) => b.roundScore - a.roundScore)[0];
  }, [gameState.teams]);

  // Animação de esconder o cabeçalho ao rolar a tela
  const topContentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [100, 320], [1, 0], Extrapolation.CLAMP);
    const translateY = interpolate(scrollY.value, [0, 200], [0, -30], Extrapolation.CLAMP);
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <View style={styles.container}>
      <ImpostorBackground />

      {/* 🔥 FOGOS DE ARTIFÍCIO NO FUNDO */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 30 }).map((_, i) => {
          const colors = [COLORS.cyan, COLORS.danger, COLORS.amber, COLORS.success, COLORS.white, roundWinnerTeam.color];
          const color = colors[i % colors.length];
          return <Particle key={i} color={color} />;
        })}
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 60, paddingBottom: 140, minHeight: height + 1 }}
      >
        {/* Altura para a StatusBar transparente*/}
        <View style={{ height: 90 }} />
        <Animated.View style={topContentStyle}>
          {/* BANNER DE VITÓRIA DA RODADA */}
          <View style={styles.victoryBanner}>
            <CustomText variant="h1" style={styles.victoryTitle}>
              EQUIPE VENCEDORA
            </CustomText>
            <CustomText
              variant="h1"
              style={[styles.victoryTitle2, { color: roundWinnerTeam.color, textShadowColor: roundWinnerTeam.color }]}
            >
              {roundWinnerTeam.name.toUpperCase()}
            </CustomText>
            <View style={styles.winnerScoreContainer}>
              <CustomText variant="h3" style={styles.winnerScore}>
                +{roundWinnerTeam.roundScore}
              </CustomText>
              <CustomText variant="label" style={{ color: COLORS.white }}>
                {" "}
                ACERTOS NESTA RODADA
              </CustomText>
            </View>
          </View>

          {/* EMOJIS ANIMADOS DA EQUIPE */}
          <View style={styles.winnerEmojisContainer}>
            {roundWinnerTeam.players.map((p, idx) => (
              <AnimatedEmoji key={p.id} emoji={p.emoji || "👤"} index={idx} teamColor={roundWinnerTeam.color} />
            ))}
          </View>
        </Animated.View>

        {/* BOTTOM SHEET: RANKING GERAL */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <View style={styles.handle} />
            <CustomText variant="label" style={styles.listTitle}>
              RANKING GERAL DE MISSÃO
            </CustomText>
          </View>

          <View style={styles.rankingList}>
            {sortedTeams.map((team, index) => (
              <TeamReportCard key={team.id} team={team} rank={index + 1} />
            ))}
          </View>
        </View>
      </Animated.ScrollView>

      {/* FOOTER FIXO */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={onNextRound} activeOpacity={0.8}>
          <CustomText variant="h3" style={styles.btnText}>
            {t("games.cryptography_result_nextMission", "NOVA RODADA")} 🚀
          </CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// =========================================================
// 🚀 CARD DO RELATÓRIO DA EQUIPE
// =========================================================
const TeamReportCard = ({ team, rank }: { team: CryptoTeam; rank: number }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  // ESTATÍSTICAS DA RODADA ATUAL
  const roundHits = team.roundScore || 0;
  // @ts-ignore
  const roundErrors = team.roundErrors || 0;
  const roundTotalAttempts = roundHits + roundErrors;
  const roundEfficiency = roundTotalAttempts > 0 ? Math.round((roundHits / roundTotalAttempts) * 100) : 0;

  // @ts-ignore
  const roundAvgTime = roundHits > 0 && team.roundTimeSpent ? (team.roundTimeSpent / 1000 / roundHits).toFixed(1) : "0.0";

  // MVP DESTE TIME ESPECÍFICO
  const teamMvp = useMemo(() => {
    // @ts-ignore
    if (!team.operatorStats) return null;
    let bestOpId: string | null = null;
    let maxWords = 0;

    // @ts-ignore
    Object.entries(team.operatorStats).forEach(([playerId, words]) => {
      if (words > maxWords) {
        maxWords = words as number;
        bestOpId = playerId;
      }
    });

    if (!bestOpId || maxWords === 0) return null;
    const playerObj = team.players.find((p) => p.id === bestOpId);
    return playerObj ? { player: playerObj, words: maxWords } : null;
  }, [team]);

  // SEPARAÇÃO DE PALAVRAS ANTIGAS vs ATUAIS
  const totalWords = team.wordsGuessed || [];
  const splitIndex = Math.max(0, totalWords.length - roundHits);
  const pastWords = totalWords.slice(0, splitIndex);
  const currentRoundWords = totalWords.slice(splitIndex);

  const memberNames = team.players.map((p) => p.name).join(", ");

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.teamCard}>
      {/* Cabeçalho */}
      <View style={[styles.teamHeader, { borderLeftColor: team.color }]}>
        <CustomText variant="h2" style={styles.rankNumber}>
          {rank}º
        </CustomText>
        <View style={{ flex: 1 }}>
          <CustomText variant="h3" style={{ color: team.color }}>
            {team.name}
          </CustomText>
          <CustomText variant="label" style={styles.membersList} numberOfLines={2}>
            {memberNames}
          </CustomText>
          <CustomText variant="hint" style={{ color: COLORS.success, marginTop: 4, fontSize: 16 }}>
            {team.score} pts totais ({roundHits} na rodada)
          </CustomText>
        </View>
      </View>

      {/* Grid de Estatísticas */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <CustomText variant="label" style={styles.statLabel}>
            Acertos
          </CustomText>
          <CustomText variant="h3" style={{ color: COLORS.success }}>
            {roundHits}
          </CustomText>
        </View>
        <View style={styles.statItem}>
          <CustomText variant="label" style={styles.statLabel}>
            Erros/Pulos
          </CustomText>
          <CustomText variant="h3" style={{ color: COLORS.danger }}>
            {roundErrors}
          </CustomText>
        </View>
        <View style={styles.statItem}>
          <CustomText variant="label" style={styles.statLabel}>
            Eficiência
          </CustomText>
          <CustomText variant="h3" style={{ color: roundEfficiency >= 70 ? COLORS.cyan : COLORS.amber }}>
            {roundEfficiency}%
          </CustomText>
        </View>
        <View style={styles.statItem}>
          <CustomText variant="label" style={styles.statLabel}>
            Tempo Médio
          </CustomText>
          <CustomText variant="h3" style={{ color: COLORS.white }}>
            {roundAvgTime}s
          </CustomText>
        </View>
      </View>

      {/* 🔥 O OPERADOR DESTAQUE DA EQUIPE VEM AQUI */}
      {teamMvp && (
        <View style={styles.teamMvpContainer}>
          <MaterialCommunityIcons name="star-shooting" size={16} color={COLORS.amber} />
          <CustomText variant="label" style={{ color: COLORS.textSecondary, marginLeft: 8, flex: 1 }}>
            MELHOR OPERADOR: <CustomText style={{ color: COLORS.white }}>{teamMvp.player.name}</CustomText>
          </CustomText>
        </View>
      )}

      {/* Botão Expandir Palavras */}
      <TouchableOpacity style={styles.expandBtn} onPress={toggleExpand} activeOpacity={0.7}>
        <CustomText variant="label" style={{ color: COLORS.textSecondary }}>
          {isExpanded
            ? `${t("games.cryptography_result_hideHits", "OCULTAR ACERTOS")} ▴`
            : `${t("games.cryptography_result_viewHits", "VER ACERTOS")} (${totalWords.length}) ▾`}
        </CustomText>
      </TouchableOpacity>

      {/* Lista de Palavras */}
      {isExpanded && (
        <View style={styles.wordsContainer}>
          {totalWords.length > 0 ? (
            <View style={styles.wordsGrid}>
              {pastWords.map((word, idx) => (
                <View key={`past-${idx}`} style={styles.wordTag}>
                  <CustomText variant="label" style={styles.wordText}>
                    {word}
                  </CustomText>
                </View>
              ))}

              {currentRoundWords.map((word, idx) => (
                <View
                  key={`current-${idx}`}
                  style={[styles.wordTagCurrent, { borderColor: team.color, backgroundColor: team.color + "20" }]}
                >
                  <CustomText variant="label" style={[styles.wordTextCurrent, { color: team.color }]}>
                    {word}
                  </CustomText>
                </View>
              ))}
            </View>
          ) : (
            <CustomText variant="hint" style={styles.noWordsText}>
              Nenhum sinal interceptado.
            </CustomText>
          )}
        </View>
      )}
    </View>
  );
};

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  particle: {
    position: "absolute",
    bottom: height * 0.35, // Começa do limite do Bottom Sheet
    left: width / 2, // Nasce do centro
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5
  },

  victoryBanner: { alignItems: "center", marginBottom: 40, gap: 10 },
  victoryTitle: { color: COLORS.textSecondary, fontSize: 18, letterSpacing: 2 },
  victoryTitle2: { fontSize: 40, fontWeight: "900", letterSpacing: 1, textShadowRadius: 10, shadowOpacity: 0.5, marginTop: -5 },

  winnerScoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 10
  },
  winnerScore: { color: COLORS.success },

  winnerEmojisContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 15,
    marginBottom: 40,
    paddingHorizontal: 20
  },
  emojiWrapper: {
    width: 70,
    height: 70,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginBottom: 8
  },

  listContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopColor: "rgba(0, 242, 255, 0.3)",
    paddingTop: 20,
    minHeight: "100%"
  },
  listHeader: { alignItems: "center", marginBottom: 25 },
  handle: { width: 45, height: 5, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 10, marginBottom: 15 },
  listTitle: { color: COLORS.cyan, opacity: 0.6, letterSpacing: 3, fontSize: 12 },

  rankingList: { paddingHorizontal: 20, gap: 15 },

  teamCard: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    overflow: "hidden"
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderLeftWidth: 4,
    backgroundColor: "rgba(255,255,255,0.02)"
  },
  rankNumber: { fontSize: 24, color: COLORS.textSecondary, width: 45 },
  membersList: { color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 2, textTransform: "uppercase" },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 15,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)"
  },
  statItem: { width: "47%", backgroundColor: "rgba(0,0,0,0.2)", padding: 10, borderRadius: 8, alignItems: "center" },
  statLabel: { fontSize: 10, color: COLORS.textSecondary, marginBottom: 5 },

  teamMvpContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    backgroundColor: "rgba(255,255,255,0.01)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.02)"
  },

  expandBtn: {
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.02)"
  },

  wordsContainer: {
    padding: 15,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)"
  },
  wordsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  wordTag: {
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)"
  },
  wordText: { color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 },
  wordTagCurrent: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  wordTextCurrent: { fontSize: 10, textTransform: "uppercase", letterSpacing: 1, fontWeight: "bold" },
  noWordsText: { textAlign: "center", fontStyle: "italic", opacity: 0.5 },

  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 25, paddingBottom: 45, backgroundColor: COLORS.surface },
  nextBtn: { backgroundColor: COLORS.cyan, padding: 22, borderRadius: 20, alignItems: "center", elevation: 10 },
  btnText: { color: COLORS.background, fontWeight: "900", letterSpacing: 1, fontSize: 18 }
});
