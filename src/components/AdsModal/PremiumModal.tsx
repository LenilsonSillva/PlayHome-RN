import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  StatusBar
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { getCurrentOfferings, purchasePackage, restorePurchases } from "@/services/iap/iapService";
import { PurchasesPackage } from "react-native-purchases";
import { useAlert } from "@/contexts/alertContext";
import { useTranslation } from "react-i18next";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

export const PremiumModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const { t } = useTranslation();
  const { showAlert } = useAlert(); // 🔥 Hook de Alerta
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedId, setSelectedId] = useState<string>("$rc_monthly");
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const PLAN_THEMES: Record<string, any> = {
    Week: {
      title: t("premiumModal.week"),
      sub: t("premiumModal.week_sub"),
      icon: "flash",
      color: "#00F2FF",
      label: t("premiumModal.weekly_label")
    },
    $rc_monthly: {
      title: t("premiumModal.monthly"),
      sub: t("premiumModal.monthly_sub"),
      icon: "crown",
      color: "#FFB800",
      label: t("premiumModal.monthly_label"),
      isPopular: true
    },
    $rc_lifetime: {
      title: t("premiumModal.lifetime"),
      sub: t("premiumModal.lifetime_sub"),
      icon: "infinity",
      color: "#BF5AF2",
      label: t("premiumModal.lifetime_label")
    }
  };

  useEffect(() => {
    if (visible) {
      loadData();
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true })
      ]).start();
    }
  }, [visible]);

  const loadData = async () => {
    setIsLoading(true);
    const offerings = await getCurrentOfferings();
    if (offerings?.availablePackages) {
      const order: any = { week: 1, $rc_monthly: 2, $rc_lifetime: 3 };
      const sorted = [...offerings.availablePackages].sort((a, b) => (order[a.identifier] || 99) - (order[b.identifier] || 99));
      setPackages(sorted);
    }
    setIsLoading(false);
  };

  // 🔥 COMPRA COM ALERTA
  const onBuy = async () => {
    const pkg = packages.find((p) => p.identifier === selectedId);
    if (!pkg) return;

    setIsPurchasing(true);
    try {
      const success = await purchasePackage(pkg);
      if (success) {
        showAlert(t("alerts.welldone"), t("alerts.premium_success"), "✅"); // "Parabéns!", "Agora você é um usuário Premium!"
        onClose();
      }
    } catch (error) {
      showAlert(t("alerts.error"), t("alerts.purchase_error"), "❌"); // "Erro", "Não foi possível completar a compra."
    } finally {
      setIsPurchasing(false);
    }
  };

  // 🔥 RESTAURAÇÃO COM ALERTA
  const handleRestore = async () => {
    setIsPurchasing(true);
    try {
      const success = await restorePurchases();
      if (success) {
        showAlert(t("alerts.success"), t("alerts.restore_success"), "✅"); // "Sucesso", "Suas compras foram restauradas!"
        onClose();
      } else {
        showAlert(t("alerts.warning"), t("alerts.restore_not_found")); // "Aviso", "Nenhuma compra encontrada nesta conta."
      }
    } catch (error) {
      showAlert(t("alerts.error"), t("alerts.restore_error"), "❌"); // "Erro", "Erro ao conectar com a loja."
    } finally {
      setIsPurchasing(false);
    }
  };

  const activeTheme = PLAN_THEMES[selectedId] || PLAN_THEMES["$rc_monthly"];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <View style={styles.mainContainer}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.bgGlow, { backgroundColor: activeTheme.color }]} />

          {/* BOTÃO FECHAR */}
          <TouchableOpacity style={styles.topCloseBtn} onPress={onClose} disabled={isPurchasing}>
            <MaterialCommunityIcons name="close" size={24} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <View style={[styles.iconRing, { borderColor: activeTheme.color }]}>
                <MaterialCommunityIcons name={activeTheme.icon} size={40} color={activeTheme.color} />
              </View>
              <CustomText variant="h1" style={styles.title}>
                {t("premiumModal.title")}
              </CustomText>
              <CustomText style={styles.subtitle}>{t("premiumModal.subtitle")}</CustomText>
            </View>

            {isLoading ? (
              <ActivityIndicator color={COLORS.cyan} size="large" style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.list}>
                {packages.map((pkg) => {
                  const theme = PLAN_THEMES[pkg.identifier];
                  const isSelected = selectedId === pkg.identifier;

                  return (
                    <TouchableOpacity
                      key={pkg.identifier}
                      activeOpacity={0.8}
                      onPress={() => setSelectedId(pkg.identifier)}
                      style={[
                        styles.planCard,
                        isSelected && { borderColor: theme.color, backgroundColor: "rgba(255,255,255,0.08)" }
                      ]}
                    >
                      {theme?.isPopular && (
                        <View style={[styles.popularBadge, { backgroundColor: theme.color }]}>
                          <CustomText style={styles.popularText}>{t("premiumModal.pop")}</CustomText>
                        </View>
                      )}

                      <View
                        style={[styles.planIconCircle, { backgroundColor: isSelected ? theme?.color : "rgba(255,255,255,0.1)" }]}
                      >
                        <MaterialCommunityIcons name={theme?.icon || "star"} size={24} color={isSelected ? "#000" : "#FFF"} />
                      </View>

                      <View style={{ flex: 1, marginLeft: 15 }}>
                        <CustomText style={styles.planTitle}>{theme?.title}</CustomText>
                        <CustomText style={styles.planSub}>{theme?.sub}</CustomText>
                      </View>

                      <View style={{ alignItems: "flex-end" }}>
                        <CustomText style={[styles.planPrice, isSelected && { color: theme?.color }]}>
                          {pkg.product.priceString}
                        </CustomText>
                        <View style={[styles.radio, isSelected && { borderColor: theme?.color }]}>
                          {isSelected && <View style={[styles.radioInner, { backgroundColor: theme?.color }]} />}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.footerInfo}>
              <MaterialCommunityIcons name="shield-check" size={16} color="rgba(255,255,255,0.4)" />
              <CustomText style={styles.footerInfoText}>{t("premiumModal.footerInfo")}</CustomText>
            </View>
          </ScrollView>

          <View style={styles.ctaContainer}>
            <TouchableOpacity disabled={isPurchasing} onPress={onBuy} style={styles.ctaButton}>
              <LinearGradient
                colors={[activeTheme.color, shadeColor(activeTheme.color, -40)]}
                style={styles.ctaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isPurchasing ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <CustomText style={styles.ctaText}>{t("premiumModal.cta")}</CustomText>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRestore} disabled={isPurchasing} style={styles.restoreBtn}>
              <CustomText style={styles.restoreText}>{t("premiumModal.restore")}</CustomText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

function shadeColor(color: string, percent: number) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);
  R = Math.floor((R * (100 + percent)) / 100);
  G = Math.floor((G * (100 + percent)) / 100);
  B = Math.floor((B * (100 + percent)) / 100);
  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;
  let RR = R.toString(16).length == 1 ? "0" + R.toString(16) : R.toString(16);
  let GG = G.toString(16).length == 1 ? "0" + G.toString(16) : G.toString(16);
  let BB = B.toString(16).length == 1 ? "0" + B.toString(16) : B.toString(16);
  return "#" + RR + GG + BB;
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.85)" },
  sheet: {
    backgroundColor: "#0A0B10",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    height: SCREEN_HEIGHT * 0.9,
    width: SCREEN_WIDTH,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)"
  },
  topCloseBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 10
  },
  bgGlow: {
    position: "absolute",
    top: -150,
    alignSelf: "center",
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.15,
    transform: [{ scaleX: 2 }]
  },
  scrollContent: { padding: 30, paddingBottom: 180 },
  header: { alignItems: "center", marginTop: 10, marginBottom: 40 },
  iconRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "rgba(255,255,255,0.03)"
  },
  title: { fontSize: 28, fontWeight: "900", color: "#FFF", letterSpacing: 2 },
  subtitle: { color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 5, textAlign: "center" },
  list: { gap: 15 },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10
  },
  popularText: { fontSize: 10, fontWeight: "900", color: "#000" },
  planIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center"
  },
  planTitle: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  planSub: { color: "rgba(255,255,255,0.4)", fontSize: 12 },
  planPrice: { fontSize: 18, fontWeight: "900", color: "#FFF", marginBottom: 5 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center"
  },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    gap: 8
  },
  footerInfoText: { color: "rgba(255,255,255,0.3)", fontSize: 11 },
  ctaContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 30,
    paddingBottom: 40,
    backgroundColor: "#0A0B10",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)"
  },
  ctaButton: { width: "100%", height: 65, borderRadius: 20, overflow: "hidden" },
  ctaGradient: { flex: 1, justifyContent: "center", alignItems: "center" },
  ctaText: { color: "#000", fontWeight: "900", fontSize: 16, letterSpacing: 1 },
  restoreBtn: { marginTop: 15, alignItems: "center" },
  restoreText: { color: "rgba(255,255,255,0.4)", fontSize: 12, textDecorationLine: "underline" }
});
