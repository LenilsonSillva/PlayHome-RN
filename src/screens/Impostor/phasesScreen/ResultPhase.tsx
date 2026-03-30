import React, { useMemo, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  useAnimatedScrollHandler,
  interpolate,
  Easing
  // 🔥 Importação do Extrapolation foi removida para não dar erro no TypeScript!
} from "react-native-reanimated";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { ImpostorGame, ImpostorPlayer, OnlineImpostorGame } from "@/games/impostor/types/game";
import { useTranslation } from "react-i18next";
import { formatScoreDisplay, getScoreColor } from "@/games/impostor/utils/scoringUtils";
import { ImpostorBackground } from "@/components/Background/Background";
import { useAudio } from "@/contexts/audioContext";

interface Props {
  data: ImpostorGame | OnlineImpostorGame;
  onNextRound: () => void;
  isOnline?: boolean;
}

const ROW_HEIGHT = 77; // Altura exata da RankingRow (65 height + 12 margin)

export const ResultPhase = ({ data, onNextRound, isOnline }: Props) => {
  const { t, i18n } = useTranslation();
  const { playSound } = useAudio();
  const { width, height } = Dimensions.get("window");

  // 🔥 Única variável necessária: a posição do scroll
  const scrollY = useSharedValue(0);

  const survivors = data.players.filter((p: ImpostorPlayer) => p.isAlive);
  const impostorsAlive = survivors.filter((p: ImpostorPlayer) => p.isImpostor).length;
  const crewAlive = survivors.length - impostorsAlive;
  const crewWon = impostorsAlive === 0;

  useEffect(() => {
    crewWon ? playSound("win") : playSound("impostor");
  }, []);

  const sortedPlayers = useMemo(() => {
    return [...data.players].sort((a, b) => (b.globalScore || 0) - (a.globalScore || 0));
  }, [data.players]);

  const top3 = sortedPlayers.slice(0, 3);
  const remaining = sortedPlayers.slice(3);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Animação de Ocultar o Banner Superior
  const topContentStyle = useAnimatedStyle(() => {
    // Usando 'clamp' direto como string para evitar erros de tipagem
    const opacity = interpolate(scrollY.value, [150, 330], [1, 0], "clamp");
    const translateY = interpolate(scrollY.value, [0, 330], [0, -50], "clamp");
    return { opacity, transform: [{ translateY }] };
  });

  // =========================================================
  // 🔥 LÓGICA DE REVELAÇÃO DO RANKING
  // =========================================================
  const hasMoreThan3 = data.players.length > 3;
  const top3TotalHeight = top3.length * ROW_HEIGHT;

  const top3ContainerStyle = useAnimatedStyle(() => {
    if (!hasMoreThan3) return { height: undefined, opacity: 1, overflow: "visible" };

    // A altura cresce exatamente na mesma velocidade que o usuário rola a tela (de 0 a 150)
    const animatedHeight = interpolate(scrollY.value, [0, 150], [0, top3TotalHeight], "clamp");

    // O texto aparece suavemente
    const animatedOpacity = interpolate(scrollY.value, [40, 150], [0, 1], "clamp");

    return {
      height: animatedHeight,
      opacity: animatedOpacity,
      overflow: "hidden"
    };
  });

  return (
    <View style={styles.container}>
      <ImpostorBackground />
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        // 🔥 O TRUQUE DO ANDROID:
        // minHeight: height + 1 força o Android a liberar o scroll
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: 140,
          minHeight: height + 100
        }}
      >
        <View style={{ height: 120 }} />

        <Animated.View style={topContentStyle}>
          <View style={[styles.victoryBanner, i18n.language === "en" && { flexDirection: "column-reverse" }]}>
            <CustomText
              variant="h1"
              style={[styles.victoryTitle, { color: COLORS.textPrimary }, i18n.language === "en" && { marginBottom: 0 }]}
            >
              {crewWon
                ? t("games.impostor_result_victoryTitleFemi")
                : impostorsAlive > 1
                  ? t("games.impostor_result_victoryTitlePlural")
                  : t("games.impostor_result_victoryTitleMasc")}
            </CustomText>
            <CustomText
              variant="h1"
              style={[
                styles.victoryTitle2,
                {
                  color: crewWon ? COLORS.cyan : COLORS.danger,
                  shadowColor: crewWon ? COLORS.cyan : COLORS.danger,
                  textShadowColor: crewWon ? COLORS.cyan : COLORS.danger
                }
              ]}
            >
              {crewWon
                ? t("games.impostor_result_crewmate")
                : impostorsAlive > 1
                  ? t("games.impostor_result_impostorsTitle")
                  : t("games.impostor_result_impostorTitle")}
            </CustomText>
          </View>

          <View style={styles.podiumRow}>
            {top3[1] && <PodiumBar player={top3[1]} rank={2} height={80} delay={200} color={COLORS.textSecondary} />}
            {top3[0] && <PodiumBar player={top3[0]} rank={1} height={140} delay={0} color={COLORS.amber} isWinner />}
            {top3[2] && <PodiumBar player={top3[2]} rank={3} height={55} delay={400} color="#cd7f32" />}
          </View>
        </Animated.View>

        <View style={[styles.listContainer]}>
          <View style={styles.listHeader}>
            <View style={styles.handle} />
            <CustomText variant="label" style={styles.listTitle}>
              {t("games.impostor_result_recordTitle")}
            </CustomText>
          </View>

          <View style={styles.rankingList}>
            {/* 1️⃣ GAVETA DO TOP 3 */}
            <Animated.View style={top3ContainerStyle}>
              {top3.map((p, i) => (
                <RankingRow key={`top3-${p.id}`} player={p} rank={i + 1} isTop3 />
              ))}
            </Animated.View>

            {/* 2️⃣ RESTANTE DOS JOGADORES */}
            {remaining.map((p, i) => (
              <RankingRow key={`rest-${p.id}`} player={p} rank={i + 4} />
            ))}
          </View>
        </View>
      </Animated.ScrollView>

      <View style={styles.footer}>
        {!isOnline || (isOnline && ("isHost" in data ? data.isHost : true)) ? (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => {
              playSound("click");
              setTimeout(() => {
                onNextRound();
              }, 100);
            }}
            activeOpacity={0.8}
          >
            <CustomText variant="h3" style={styles.btnText}>
              {t("games.impostor_result_nextMission")} 🚀
            </CustomText>
          </TouchableOpacity>
        ) : (
          <CustomText variant="label" style={styles.textNotHost}>
            {t("games.impostor_result_waitHost")}
          </CustomText>
        )}
      </View>
    </View>
  );
};

// =========================================================
// 🚀 COMPONENTES VISUAIS PUROS (Nenhuma lógica de altura aqui)
// =========================================================

interface rankingRowProps {
  player: ImpostorPlayer;
  rank: number;
  isTop3?: boolean;
}

const RankingRow = ({ player, rank, isTop3 }: rankingRowProps) => {
  const { t, i18n } = useTranslation();

  const rankEnglishAbrev = (rankValue: number) => {
    if (i18n.language === "en") {
      if (rankValue === 1) return t("games.impostor_result_first");
      if (rankValue === 2) return t("games.impostor_result_second");
      if (rankValue === 3) return t("games.impostor_result_third");
      return t("games.impostor_result_moreRanking");
    }
    return t("games.impostor_result_moreRanking");
  };

  return (
    <View style={[styles.rankingRow, isTop3 && { backgroundColor: "rgba(0, 242, 255, 0.05)" }]}>
      <CustomText variant="h3" style={styles.rowRank}>
        {rank}
        <CustomText variant="body" style={{ color: COLORS.textPrimary }}>
          {rankEnglishAbrev(rank)}
        </CustomText>
      </CustomText>
      <Text style={styles.rowEmoji}>{player.emoji}</Text>
      <View style={{ flex: 1 }}>
        <CustomText variant="body" style={styles.rowName}>
          {player.name}
        </CustomText>
        {player.isImpostor && (
          <CustomText variant="body" style={[styles.rowName, { fontSize: 12, color: COLORS.danger, fontStyle: "italic" }]}>
            Impostor
          </CustomText>
        )}
      </View>
      <CustomText
        variant="h3"
        style={[
          styles.rowPoints,
          { color: getScoreColor(player.score, COLORS.greenLight, COLORS.danger), fontSize: 11, marginRight: 8 }
        ]}
      >
        {formatScoreDisplay(player.score)}
      </CustomText>
      <CustomText variant="h3" style={styles.rowPoints}>
        {player.globalScore || 0} pts
      </CustomText>
    </View>
  );
};

const PodiumBar = ({ player, rank, height: targetHeight, delay, color, isWinner }: any) => {
  const { t, i18n } = useTranslation();
  const barHeight = useSharedValue(0);

  useEffect(() => {
    barHeight.value = withDelay(delay, withTiming(targetHeight, { duration: 1500, easing: Easing.out(Easing.back(1.5)) }));
  }, []);

  const rankEnglishAbrev = (rankValue: number) => {
    if (i18n.language === "en") {
      if (rankValue === 1) return t("games.impostor_result_first");
      if (rankValue === 2) return t("games.impostor_result_second");
      if (rankValue === 3) return t("games.impostor_result_third");
      return t("games.impostor_result_moreRanking");
    }
    return t("games.impostor_result_moreRanking");
  };

  const barStyle = useAnimatedStyle(() => ({ height: barHeight.value }));

  return (
    <View style={styles.podiumSpot}>
      {isWinner && <Text style={styles.crown}>👑</Text>}
      <Text style={styles.podiumEmoji}>{player.emoji}</Text>
      <CustomText variant="h3" numberOfLines={1} style={styles.podiumName}>
        {player.name}
      </CustomText>
      <Animated.View style={[styles.bar, { backgroundColor: color }, barStyle]}>
        <Text style={styles.rankLabel}>
          {rank}
          <CustomText variant="body" style={{ color: "rgba(0,0,0,0.3)" }}>
            {rankEnglishAbrev(rank)}
          </CustomText>
        </Text>
      </Animated.View>
      <CustomText variant="h3" style={[styles.podiumScore, { color }]}>
        {player.globalScore || 0} pts
      </CustomText>
    </View>
  );
};

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  victoryBanner: { alignItems: "center", marginBottom: 30 },
  victoryTitle: {
    textAlign: "center",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 38,
    marginBottom: -30,
    width: "100%"
  },
  victoryTitle2: {
    textAlign: "center",
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 1,
    textShadowRadius: 5,
    textShadowOffset: { height: 0, width: 0 },
    shadowRadius: 10,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.5
  },

  podiumRow: { flexDirection: "row", justifyContent: "center", alignItems: "flex-end", height: 280, marginBottom: 40 },
  podiumSpot: { flex: 1, alignItems: "center" },
  podiumEmoji: { fontSize: 48, marginBottom: 5 },
  podiumName: { color: "#FFF", fontSize: 15, fontWeight: "700", textTransform: "uppercase", marginBottom: 5 },
  podiumScore: { fontSize: 16, fontWeight: "900", marginTop: 8 },
  crown: { fontSize: 26, position: "absolute", top: -25 },
  bar: {
    width: "80%",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 8
  },
  rankLabel: { fontWeight: "900", fontSize: 20, color: "rgba(0,0,0,0.3)" },

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

  rankingList: { paddingHorizontal: 20 },
  rankingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginBottom: 12,
    overflow: "hidden",
    height: 65
  },
  rowRank: { width: 40, opacity: 0.3, fontSize: 18, fontWeight: "900" },
  rowEmoji: { fontSize: 28, marginRight: 15 },
  rowName: { fontWeight: "bold", color: "#fff", fontSize: 20 },
  rowPoints: { color: COLORS.cyan, fontWeight: "900", fontSize: 18 },

  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 25, paddingBottom: 45, backgroundColor: COLORS.surface },
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
  btnText: { color: COLORS.background, fontWeight: "900", letterSpacing: 1, fontSize: 18 },
  textNotHost: { textAlign: "center" }
});
