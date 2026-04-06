import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, ActivityIndicator, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  runOnJS,
  interpolate,
  Easing
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { PlayerAvatar } from "@/games/common/components/PlayerAvatar";
import { ImpostorGame, ImpostorPlayer, OnlineImpostorGame } from "@/games/impostor/types/game";
import { useTranslation } from "react-i18next";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { PlayerStatusModal } from "./components/PlayerStatusModal";
import { useAlert } from "@/contexts/alertContext";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAudio } from "@/contexts/audioContext";

interface RevealPhaseProps {
  player: ImpostorPlayer;
  data: ImpostorGame | OnlineImpostorGame;
  isOnline?: boolean;
  onNext: () => void | Promise<any>;
  isLast?: boolean;
  revealedAfterReroll?: boolean;
  onPlayerReady?: () => void | Promise<any>;
}

export const RevealPhase = ({ player, data, isOnline, onNext, isLast, revealedAfterReroll, onPlayerReady }: RevealPhaseProps) => {
  const { t } = useTranslation();
  const { playSound } = useAudio();
  const { width, height } = useWindowDimensions();
  const [isFlipped, setIsFlipped] = useState(false);

  // Dimensões responsivas: altura sempre maior que largura
  const { CARD_WIDTH, CARD_HEIGHT } = useMemo(() => {
    const isPortrait = height >= width;
    let cardWidth: number;
    let cardHeight: number;

    if (isPortrait) {
      // Celular em retrato: 85% da largura
      cardWidth = Math.floor(width * 0.85);
      cardHeight = Math.floor(cardWidth * 1.4); // Altura > largura
    } else {
      // Celular em paisagem: 85% da altura
      cardHeight = Math.floor(height * 0.85);
      cardWidth = Math.floor(cardHeight / 1.3); // Mantém proporção
    }

    return { CARD_WIDTH: cardWidth, CARD_HEIGHT: cardHeight };
  }, [width, height]);

  // Tamanhos responsivos para emoji e nome
  const { avatarSize, playerNameFontSize } = useMemo(() => {
    // Avatar: 25% da altura do card (reduzido mas não muito)
    const avatar = Math.floor(CARD_HEIGHT * 0.27);
    // Nome: escala de acordo com o tamanho da tela (fonte responsiva)
    const scale = Math.min(width, height) / 375;
    const fontSize = Math.floor(22 * scale);
    return { avatarSize: avatar, playerNameFontSize: fontSize };
  }, [CARD_WIDTH, CARD_HEIGHT, width, height]);

  // Valores Animados
  const rotation = useSharedValue(0); // 0 a 180
  const waveOffset = useSharedValue(0);
  const cardOpacity = useSharedValue(0); // Começa em 0 (invisível)
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const accentColor = player.isImpostor ? COLORS.danger : player.color;
  const [isWaiting, setIsWaiting] = useState(false);
  const { showAlert } = useAlert();

  // Função para escurecer a cor do jogador para a onda
  const getWaveColor = () => {
    // Retorna a cor com 30% de opacidade preta por cima
    return "rgba(0,0,0,0.3)";
  };

  useEffect(() => {
    if (!isOnline) {
      // Resetamos o valor para o início antes de começar
      waveOffset.value = 0;

      // A onda se move lateralmente uma única vez e para no destino (-CARD_WIDTH)
      waveOffset.value = withTiming(-CARD_WIDTH, {
        duration: 1500,
        easing: Easing.out(Easing.quad) // Usei 'out' para ela parar suavemente
      });
    }
  }, [player, CARD_WIDTH]); // Reinicia sempre que o jogador mudar ou dimensões mudarem

  // Reset instantâneo ao trocar de jogador
  useEffect(() => {
    if (!isOnline) {
      rotation.value = 0;
      setIsFlipped(false);

      // Efeito de Fade In: Reseta para 0 e vai para 1
      // Inicia invisível e aparece suavemente
      cardOpacity.value = 0;
      cardOpacity.value = withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.quad)
      });
      startHandAnimation();
    }
  }, [player, revealedAfterReroll]);

  // Resets do Online diferente do Offline para não bugar a cada atualização do player.
  useEffect(() => {
    if (isOnline) {
      rotation.value = 0;
      setIsFlipped(false);

      // Efeito de Fade In: Reseta para 0 e vai para 1
      // Inicia invisível e aparece suavemente
      cardOpacity.value = 0;
      cardOpacity.value = withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.quad)
      });
      // Resetamos o valor para o início antes de começar
      waveOffset.value = 0;

      // A onda se move lateralmente uma única vez e para no destino (-CARD_WIDTH)
      waveOffset.value = withTiming(-CARD_WIDTH, {
        duration: 1500,
        easing: Easing.out(Easing.quad) // Usei 'out' para ela parar suavemente
      });
      startHandAnimation();
    }
  }, [revealedAfterReroll, player.word, CARD_WIDTH]);

  const handProgress = useSharedValue(0); // 0 = Início (Direita), 1 = Fim (Esquerda)
  const startHandAnimation = () => {
    handProgress.value = 0;

    // Criamos um loop único de 2 segundos (1.5s de movimento + 0.5s de espera)
    handProgress.value = withRepeat(
      withTiming(1, {
        duration: 1500,
        easing: Easing.linear // Linear é crucial para sincronia total
      }),
      -1, // Loop infinito
      false
    );
  };

  // Lógica do Botão "Revelar"
  const triggerManualFlip = () => {
    if (!isFlipped) {
      rotation.value = withSpring(180, { damping: 15, stiffness: 90 });
      setIsFlipped(true);
    }
    playSound("click2");
  };

  // --- LÓGICA DO GESTO ATUALIZADA ---
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Permitir o arraste apenas se ainda não finalizou a rodada ou se quer espiar de novo
      if (e.translationX < 0) {
        // Mapeia o arraste para os 180 graus
        rotation.value = Math.min(Math.max(Math.abs(e.translationX) / 1.1, 0), 180);
      }
    })
    .onEnd((e) => {
      // Verificamos se o movimento foi suficiente para considerar como "visto"
      if (e.translationX < -120 || e.velocityX < -600) {
        // Marcamos como finalizado (para aparecer o botão de Próximo)
        runOnJS(setIsFlipped)(true);
      }

      // IMPORTANTE: Independente de ter ganho ou não, o card volta para 0 (Frontal)
      rotation.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
        mass: 0.8
      });
    });

  // 🔥 2. CRIE ESTA FUNÇÃO AUXILIAR: Ela tenta ir pra próxima fase, se der erro (sem net), devolve a carta
  const executeNext = async (resolve: any, reject: any) => {
    try {
      await onNext();
      resolve();
    } catch (error) {
      cardOpacity.value = withTiming(1); // Devolve a carta para a tela
      reject(error);
    }
  };

  const handleNextAction = () => {
    playSound("click2");
    return new Promise<void>((resolve, reject) => {
      // Some com a carta (Fade Out)
      cardOpacity.value = withTiming(isOnline ? 1 : 0, { duration: 200 }, (isDone) => {
        if (isDone) {
          rotation.value = 0;
          // Pede para o JS rodar a função assíncrona que vai falar com o Servidor
          runOnJS(executeNext)(resolve, reject);
        }
      });
    });
  };

  // --- ESTILOS ANIMADOS (Giro Inverso para Esquerda) ---
  const frontStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1200 },
        { rotateY: `${-rotation.value}deg` } // Negativo gira para a esquerda
      ],
      opacity: rotation.value <= 90 ? 1 : 0,
      zIndex: rotation.value <= 90 ? 10 : 0
    };
  });

  const backStyle = useAnimatedStyle(() => {
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${180 - rotation.value}deg` }],
      opacity: rotation.value > 90 ? 1 : 0,
      zIndex: rotation.value > 90 ? 10 : 0
    };
  });

  // Estilo animado para o container pai das cartas
  const containerFadeStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    // Opcional: um leve efeito de subida (slide up) junto com o fade
    transform: [{ translateY: interpolate(cardOpacity.value, [0, 1], [20, 0]) }]
  }));

  const animatedWaveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: waveOffset.value }]
  }));

  const handAnimatedStyle = useAnimatedStyle(() => {
    // 1. Movimento: A mão corre de 80 para -80 entre 0% e 80% do tempo do loop
    const translateX = interpolate(handProgress.value, [0, 0.8], [80, -80], "clamp");

    // 2. Opacidade:
    // 0% a 10%: Fade In (Aparece)
    // 10% a 60%: Hold (Fica visível deslizando)
    // 60% a 80%: Fade Out (Some no final do rastro)
    // 80% a 100%: Invisível (Tempo para voltar à direita)
    const opacity = interpolate(handProgress.value, [0, 0.1, 0.6, 0.8], [0, 1, 1, 0], "clamp");

    return {
      opacity: isFlipped ? 0 : opacity, // Se já virou a carta, some de vez
      transform: [{ translateX }]
    };
  });

  // Fim da espera quando o jogador estiver pronto no servidor
  useEffect(() => {
    setIsWaiting(false);
  }, [player?.ready, data.phase]);

  // Função que gera a ação após o clique no botão, em conjunto com o servidor.
  const handleWaitAction = async (action: string) => {
    setIsWaiting(true);

    try {
      if (action === "nextAction") await handleNextAction();
      if (action === "onPlayerReady") await onPlayerReady?.();
      // Se der certo, a tela vai mudar sozinha, não precisa setIsWaiting(false)
    } catch (error) {
      // Se a sala não existir, ele para a bolinha e avisa o jogador!
      setIsWaiting(false);
      showAlert(t("alerts.alert"), error as string);
    }
  };

  if (!player) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, paddingTop: 140 }}>
      <View style={styles.container}>
        <View style={styles.cardArea}>
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[{ width: CARD_WIDTH, height: CARD_HEIGHT }, containerFadeStyle]}>
              {/* FACE FRONTAL (Oculta - Estilo Verso da Carta) */}
              <Animated.View style={[styles.cardBase, frontStyle, { backgroundColor: player.color }]}>
                <View style={styles.cardBorder}>
                  {/* ID no Topo */}
                  <View style={styles.topId}>
                    <Text style={styles.idText}>
                      {isOnline ? data.players.map((p) => p.name).indexOf(player.name) + 1 : data.players.indexOf(player) + 1}
                    </Text>
                  </View>

                  {/* Círculo Central com Emoji */}
                  <View style={styles.revealInfo}>
                    <PlayerAvatar
                      emoji={player.emoji}
                      color={player.color}
                      bgColor="rgba(0,0,0,0.32)"
                      borderRadius={10}
                      size={avatarSize}
                      hideScan={true}
                    />
                    <CustomText variant="h2" style={[styles.roleLabel, { fontSize: playerNameFontSize }]}>
                      {player.name.toUpperCase()}
                    </CustomText>
                  </View>

                  {/* --- CONTAINER DA ONDA --- */}
                  <View style={[styles.waveMask, { width: CARD_WIDTH, height: CARD_HEIGHT * 0.5 }]}>
                    {/* A ONDA (SVG que se move) */}
                    <Animated.View style={[styles.waveAnimatedContainer, animatedWaveStyle, { width: CARD_WIDTH * 2 }]}>
                      <Svg height="100%" width={CARD_WIDTH * 2} viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <Path
                          fill={getWaveColor()}
                          d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,181.3C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                        />
                        {/* Duplicata da onda para o loop ser infinito e sem saltos */}
                        <Path
                          x={1440}
                          fill={getWaveColor()}
                          d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,181.3C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                        />
                      </Svg>
                    </Animated.View>

                    {/* CONTEÚDO ESTÁTICO (Fica por cima da onda) */}
                    <View style={styles.staticContent}>
                      <View style={styles.bottomLabel}>
                        <CustomText variant="hint" style={[styles.swipeHint, { color: player.color + "FF" }]}>
                          {t("games.impostor_reveal_swipe")}
                        </CustomText>
                      </View>

                      <Animated.View style={[styles.handIcon, handAnimatedStyle]}>
                        <FontAwesome name="hand-pointer-o" size={50} color={player.color} />
                      </Animated.View>
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* FACE TRASEIRA (Revelada - Estilo Carta de Personagem) */}
              <Animated.View style={[styles.cardBase, backStyle, { backgroundColor: COLORS.surfaceLight }]}>
                <View style={[styles.cardBorder, { borderColor: player.color }]}>
                  <View style={styles.topId}>
                    <Text style={styles.idText}>
                      {isOnline ? data.players.map((p) => p.name).indexOf(player.name) + 1 : data.players.indexOf(player) + 1}
                    </Text>
                  </View>

                  <View style={styles.wordSection}>
                    <View style={styles.wordCloud}>
                      <CustomText>
                        {player.isImpostor ? t("games.impostor_reveal_youAre") : t("games.impostor_reveal_yourWordIs")}
                      </CustomText>
                      <CustomText 
                        variant="h1" 
                        style={[
                          styles.mainWord, 
                          { 
                            color: accentColor
                          }
                        ]}
                      >
                        {player.isImpostor ? t("games.impostor_title") : player.word}
                      </CustomText>
                    </View>
                    {player.isImpostor && player.hint && (
                      <CustomText variant="hint" style={styles.hintText}>
                        💡 {player.hint}
                      </CustomText>
                    )}
                  </View>

                  {/* Lógica de Impostores Unidos */}
                  {player.isImpostor && data.impostorsUnited && data.impostorCount > 1 && (
                    <View style={styles.unitedContainer}>
                      {/* Header com estilo de Scanner/Alerta */}
                      <View style={styles.unitedHeader}>
                        <MaterialCommunityIcons name="access-point-network" size={16} color={COLORS.danger} />
                        <CustomText variant="label" style={styles.unitedTitle}>
                          {t("games.impostor_reveal_ally")}
                        </CustomText>
                        <View style={styles.redDot} />
                      </View>

                      <View style={styles.alliesGrid}>
                        {data.players
                          .filter((p) => p.isImpostor && p.id !== player.id)
                          .map((ally) => (
                            <View key={ally.id} style={styles.allyCard}>
                              <View style={[styles.allyEmojiBg, { borderColor: ally.color }]}>
                                <Text style={styles.allyEmoji}>{ally.emoji}</Text>
                              </View>
                              <CustomText variant="body" numberOfLines={1} style={styles.allyNameLabel}>
                                {ally.name.split(" ")[0]}
                              </CustomText>
                            </View>
                          ))}
                      </View>
                    </View>
                  )}

                  {data.whoStart === player.name && (
                    <View style={styles.starterFlag}>
                      <CustomText variant="body" style={styles.starterText}>
                        ⚠️ {t("games.impostor_reveal_youStart")}
                      </CustomText>
                    </View>
                  )}
                </View>
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        </View>

        {/* ÁREA DOS DOTS PARA MOSTRAR QUEM ESTÁ PRONTO */}

        {isOnline && (
          <TouchableOpacity
            style={styles.statusReady}
            activeOpacity={0.8}
            onPress={() => {
              setStatusModalVisible(true);
              playSound("click2");
            }}
          >
            <CustomText variant="label" style={{ color: player.color }}>
              {t("games.impostor_reveal_statusBtn")}
            </CustomText>
            <View style={styles.dotsRow}>
              {data.players.map((p) => (
                <View key={p.socketId + p.name} style={[styles.dot, p.ready && styles.dotActive]} />
              ))}
            </View>
          </TouchableOpacity>
        )}

        {/* FOOTER: BOTÃO FIXO */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: !isOnline
                  ? isFlipped
                    ? player.color
                    : player.color + "AA"
                  : isFlipped
                    ? player.color
                    : player.color + "AA"
              }
            ]}
            onPress={
              !isOnline
                ? isFlipped
                  ? handleNextAction
                  : triggerManualFlip
                : isFlipped
                  ? player.ready
                    ? player.isHost
                      ? data.players.every((p) => p.ready)
                        ? () => handleWaitAction("nextAction")
                        : () => showAlert(t("alerts.impostor_wait"), t("alerts.impostor_waitOthers"))
                      : () => showAlert(t("alerts.wait"), t("alerts.impostor_hostMustStart"))
                    : () => handleWaitAction("onPlayerReady")
                  : triggerManualFlip
            }
            activeOpacity={0.8}
            disabled={isWaiting}
          >
            <CustomText
              variant="h3"
              style={{
                color: COLORS.white,
                fontWeight: "900"
              }}
            >
              {!isOnline ? (
                isFlipped ? (
                  isLast ? (
                    t("games.impostor_reveal_startMission")
                  ) : (
                    t("games.impostor_reveal_next") + " ➜"
                  )
                ) : (
                  t("games.impostor_reveal_revealNowBtn")
                )
              ) : isFlipped ? (
                player.ready ? (
                  player.isHost ? (
                    isWaiting ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      t("games.impostor_reveal_startMission")
                    )
                  ) : (
                    t("games.impostor_reveal_waitHost")
                  )
                ) : isWaiting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  t("games.impostor_reveal_isReady")
                )
              ) : (
                t("games.impostor_reveal_revealNowBtn")
              )}
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
      <PlayerStatusModal
        visible={statusModalVisible}
        onClose={() => setStatusModalVisible(false)}
        players={data.players}
        statusType="ready"
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  cardArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  cardBase: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: "hidden",
    borderRadius: 25,
    padding: 12
  },
  cardBorder: {
    flex: 1,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20
  },
  topId: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 40,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  idText: { color: "#FFF", fontWeight: "900", fontSize: 18 },
  centerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40
  },
  bottomLabel: { alignItems: "center" },
  playerName: { color: COLORS.white, textTransform: "uppercase" },
  swipeHint: {
    marginTop: 5,
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: "900"
  },
  handIcon: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center"
  },

  waveMask: {
    position: "absolute",
    bottom: 0,
    borderBottomLeftRadius: 31,
    borderBottomRightRadius: 31,
    overflow: "hidden",
    marginBlock: -20
  },

  waveAnimatedContainer: {
    position: "absolute",
    left: 0,
    bottom: 0,
    height: "100%"
  },
  staticContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    marginBottom: 25
  },

  // Back Side
  revealInfo: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    width: "100%",
    paddingBottom: 60
  },
  roleLabel: {
    backgroundColor: "rgba(0,0,0,0.2)",
    color: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    overflow: "hidden",
    textAlign: "center"
  },
  wordSection: {
    alignItems: "center",
    width: "90%",
    alignSelf: "center",
    flex: 1,
    justifyContent: "center"
  },
  wordCloud: {
    padding: 20,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
    overflow: "hidden"
  },
  mainWord: { 
    color: "#000", 
    fontSize: 36, 
    textAlign: "center",
    textShadowColor: "transparent",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },

  // Show impostor names

  unitedContainer: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.0)", // Fundo sutil para destacar do branco da carta
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 10
  },
  unitedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6
  },
  unitedTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.danger,
    letterSpacing: 1
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.danger
    // Efeito de "pulsar" opcional se você quiser animar depois
  },
  alliesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 8
  },
  allyCard: {
    alignItems: "center",
    width: 80
  },
  allyEmojiBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface, // Fundo escuro para o emoji saltar
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    // A cor da borda vem do inline style (cor do jogador)
    shadowColor: COLORS.surfaceLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4
  },
  allyEmoji: {
    fontSize: 22
  },
  allyNameLabel: {
    fontSize: 10,
    color: COLORS.textPrimary,
    marginTop: 4,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase"
  },

  hintText: {
    color: COLORS.white,
    marginTop: 10,
    fontWeight: "bold",
    textAlign: "center",
    borderWidth: 2,
    borderColor: COLORS.amber,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.1)"
  },
  statusReady: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 5
  },
  dotsRow: { flexDirection: "row", gap: 8 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.textSecondary
  },
  dotActive: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
    shadowRadius: 5,
    shadowOpacity: 1,
    elevation: 5
  },
  starterFlag: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 50,
    marginBottom: -10
  },
  starterText: {
    color: COLORS.amber,
    fontWeight: "900",
    fontSize: 14,
    fontStyle: "italic"
  },

  footer: { padding: 30, paddingBottom: 50 },
  actionBtn: {
    padding: 22,
    borderRadius: 25,
    alignItems: "center",
    elevation: 10
  }
});
