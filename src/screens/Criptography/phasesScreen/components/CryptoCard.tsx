import React, { useEffect, useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { PlayerAvatar } from "@/games/common/components/PlayerAvatar";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { CryptoPlayer } from "@/games/cryptography/types/game";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");
const CARD_WIDTH = Math.floor(width * 0.82);
const CARD_HEIGHT = 440;
const SWIPE_THRESHOLD = width * 0.25;

interface CryptoCardProps {
  mode: "interception" | "infiltration";
  word: string | null;
  operator: CryptoPlayer | undefined;
  teamColor: string;
  isTimerRunning: boolean;
  isRoundActive: boolean;
  skipsLeft?: number;
  onAction: (type: "correct" | "skip") => void;
  onStartTimer?: () => void;
}

export const CryptoCard = ({
  mode,
  word,
  operator,
  teamColor,
  isTimerRunning,
  isRoundActive,
  skipsLeft,
  onAction,
  onStartTimer
}: CryptoCardProps) => {
  const { t } = useTranslation();
  const [, setIsRevealed] = useState(false);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const fadeProgress = useSharedValue(0);

  const cardScale = useSharedValue(0.8);
  const waveOffset = useSharedValue(0);

  const handleStart = () => {
    if (!isTimerRunning) onStartTimer?.();
  };
  const handleReveal = (val: boolean) => setIsRevealed(val);
  const handleAction = (type: "correct" | "skip") => {
    onAction(type);
  };

  useEffect(() => {
    waveOffset.value = 0;
    waveOffset.value = withTiming(-CARD_WIDTH, {
      duration: 1500,
      easing: Easing.out(Easing.quad)
    });
  }, [word]);

  useEffect(() => {
    setIsRevealed(false);
    translateX.value = 0;
    translateY.value = 0;
    fadeProgress.value = 0;
    cardScale.value = 0.8;
    cardScale.value = withSpring(1, { damping: 18, stiffness: 150 });
  }, [word]);

  const panGesture = Gesture.Pan()
    .enabled(isRoundActive || !isTimerRunning)
    .onTouchesDown(() => {
      runOnJS(handleStart)();
      runOnJS(handleReveal)(true);
      fadeProgress.value = withTiming(1, { duration: 150 });
    })
    .onTouchesUp(() => {
      if (Math.abs(translateX.value) < SWIPE_THRESHOLD) {
        fadeProgress.value = withTiming(0, { duration: 400 });
        runOnJS(handleReveal)(false);
      }
    })
    .onUpdate((e) => {
      if (!isRoundActive) return;

      if (e.translationX < 0 && skipsLeft === 0) {
        translateX.value = e.translationX * 0.15;
      } else {
        translateX.value = e.translationX;
      }
      translateY.value = e.translationY * 0.1;
    })
    .onEnd((e) => {
      if (!isRoundActive) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        return;
      }

      if (e.translationX > SWIPE_THRESHOLD || e.velocityX > 800) {
        translateX.value = withTiming(width * 1.5, { duration: 200 }, () => {
          runOnJS(handleAction)("correct");
        });
      } else if ((e.translationX < -SWIPE_THRESHOLD || e.velocityX < -800) && skipsLeft && skipsLeft > 0) {
        translateX.value = withTiming(-width * 1.5, { duration: 200 }, () => {
          runOnJS(handleAction)("skip");
        });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const animatedMainCardStyle = useAnimatedStyle(() => {
    const rotateZ = interpolate(translateX.value, [-width / 2, width / 2], [-8, 8], Extrapolation.CLAMP);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotateZ}deg` },
        { scale: cardScale.value }
      ]
    };
  });

  const frontStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fadeProgress.value, [0, 1], [1, 0]),
    zIndex: fadeProgress.value <= 0.5 ? 2 : 1
  }));

  const backStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fadeProgress.value, [0, 1], [0, 1]),
    zIndex: fadeProgress.value > 0.5 ? 2 : 1
  }));

  const correctOverlay = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
    backgroundColor: "rgba(34, 197, 94, 0.4)"
  }));

  const skipOverlay = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
    backgroundColor: "rgba(239, 68, 68, 0.4)"
  }));

  const waveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: waveOffset.value }]
  }));

  const bgCorrectStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0.5, 1.2], Extrapolation.CLAMP) }]
  }));

  const bgSkipStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(translateX.value, [0, -SWIPE_THRESHOLD], [0.5, 1.2], Extrapolation.CLAMP) }]
  }));

  return (
    <View style={styles.cardArea}>
      <View style={styles.bgIconsContainer}>
        <Animated.View style={[styles.bgIcon, bgCorrectStyle]}>
          <View style={[styles.iconCircle, { backgroundColor: "rgba(34,197,94,0.15)", borderColor: COLORS.success }]}>
            <MaterialCommunityIcons name="check-bold" size={50} color={COLORS.success} />
          </View>
        </Animated.View>

        <Animated.View style={[styles.bgIcon, bgSkipStyle]}>
          <View style={[styles.iconCircle, { backgroundColor: "rgba(255,0,60,0.15)", borderColor: COLORS.danger }]}>
            <MaterialCommunityIcons name="close-thick" size={50} color={COLORS.danger} />
          </View>
        </Animated.View>
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.cardWrapper, animatedMainCardStyle]}>
          <Animated.View style={[styles.cardSide, backStyle, { backgroundColor: COLORS.surfaceLight }]}>
            <View style={[styles.cardBorder, { borderColor: teamColor }]}>
              <Animated.View style={[StyleSheet.absoluteFillObject, correctOverlay, { borderRadius: 20 }]} />
              <Animated.View style={[StyleSheet.absoluteFillObject, skipOverlay, { borderRadius: 20 }]} />

              <View style={styles.wordSection}>
                <CustomText variant="label" style={{ color: COLORS.textSecondary, marginBottom: 15 }}>
                  {t("games.cryptography_card_wordIs")}
                </CustomText>
                <CustomText variant="h1" adjustsFontSizeToFit numberOfLines={2} style={[styles.theWord, { color: teamColor }]}>
                  {word}
                </CustomText>
              </View>

              {mode === "infiltration" || (isTimerRunning && mode === "interception") ? (
                <View style={styles.swipeHints}>
                  <CustomText
                    variant="label"
                    style={{ color: skipsLeft && skipsLeft > 0 ? COLORS.danger : COLORS.textSecondary }}
                  >
                    {mode === "interception"
                      ? "← " + t("games.cryptography_card_pass")
                      : "← " + t("games.cryptography_card_skip")}
                  </CustomText>
                  <CustomText variant="label" style={{ color: COLORS.success }}>
                    {t("games.cryptography_card_correct")} →
                  </CustomText>
                </View>
              ) : null}
            </View>
          </Animated.View>

          <Animated.View style={[styles.cardSide, frontStyle, { backgroundColor: teamColor }]}>
            <View style={styles.cardBorder}>
              <View style={styles.revealInfo}>
                <PlayerAvatar
                  emoji={operator?.emoji || ""}
                  color={teamColor}
                  bgColor="rgba(0,0,0,0.32)"
                  borderRadius={10}
                  size={130}
                  hideScan={true}
                />
                <CustomText variant="h2" style={styles.operatorName}>
                  {operator?.name.toUpperCase()}
                </CustomText>
                <CustomText variant="label" style={{ color: "rgba(0,0,0,0.35)", marginTop: 5 }}>
                  {t("games.cryptography_card_taticalOperator")}
                </CustomText>
              </View>

              <View style={styles.waveMask}>
                <Animated.View style={[styles.waveContainer, waveAnimatedStyle]}>
                  <Svg height="100%" width={CARD_WIDTH * 2} viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <Path
                      fill="rgba(0,0,0,0.3)"
                      d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,181.3C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    />
                    <Path
                      x={1440}
                      fill="rgba(0,0,0,0.3)"
                      d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,181.3C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    />
                  </Svg>
                </Animated.View>
                <View style={styles.staticContent}>
                  <MaterialCommunityIcons
                    name={isTimerRunning ? "gesture-swipe" : "fingerprint"}
                    size={45}
                    color={"rgba(255,255,255,0.7)"}
                  />
                  <CustomText variant="h3" style={{ color: teamColor, marginTop: 10 }}>
                    {isTimerRunning
                      ? t("games.cryptography_card_swipeCard")
                      : mode === "infiltration"
                        ? t("games.cryptography_card_holdToStart")
                        : t("games.cryptography_card_holdToSee")}
                  </CustomText>
                </View>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  cardArea: { flex: 1, justifyContent: "center", alignItems: "center", width: "100%" },

  bgIconsContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15
  },
  bgIcon: { alignItems: "center", justifyContent: "center" },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed"
  },

  cardWrapper: { width: CARD_WIDTH, height: CARD_HEIGHT },
  cardSide: { ...StyleSheet.absoluteFillObject, backfaceVisibility: "hidden", borderRadius: 25, padding: 12, elevation: 10 },
  cardBorder: {
    flex: 1,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "space-between"
  },

  revealInfo: { alignItems: "center", marginTop: 40 },
  operatorName: {
    backgroundColor: "rgba(0,0,0,0.3)",
    color: "#FFF",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 15,
    overflow: "hidden"
  },

  waveMask: {
    position: "absolute",
    bottom: 0,
    width: CARD_WIDTH - 24,
    height: 180,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: "hidden"
  },
  waveContainer: { position: "absolute", left: 0, bottom: 0, height: "100%", width: CARD_WIDTH * 2 },
  staticContent: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", paddingTop: 80 },

  wordSection: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20, width: "100%" },
  theWord: { fontSize: 38, textTransform: "uppercase", textAlign: "center" },
  swipeHints: { flexDirection: "row", justifyContent: "space-between", width: "100%", paddingHorizontal: 20, paddingBottom: 20 }
});
