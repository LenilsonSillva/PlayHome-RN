import React from "react";
import { Modal, View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Cards } from "@/components/Cards/Cards";

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PremiumModal = ({ visible, onClose }: PremiumModalProps) => {
  const plans = [
    {
      id: "trial",
      title: "Acesso Rápido",
      price: "€1,49",
      duration: "15 dias",
      icon: "clock-outline",
      color: COLORS.textSecondary
    },
    {
      id: "premium",
      title: "Premium Pro",
      price: "€3,49",
      duration: "por mês",
      icon: "crown",
      color: COLORS.amber,
      recommended: true
    },
    { id: "lifetime", title: "Mestre Vitalício", price: "€9,49", duration: "Único", icon: "infinity", color: COLORS.cyan }
  ];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Cards accentColor={COLORS.amber}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.header}>
              <MaterialCommunityIcons name="shield-check" size={50} color={COLORS.amber} />
              <CustomText variant="h1" style={styles.title}>
                UPGRADE TOTAL
              </CustomText>
              <CustomText style={styles.subtitle}>Remova todos os anúncios e jogue sem interrupções.</CustomText>
            </View>

            <ScrollView contentContainerStyle={styles.plansContainer}>
              {plans.map((plan) => (
                <TouchableOpacity key={plan.id} style={[styles.planCard, plan.recommended && styles.recommendedCard]}>
                  {plan.recommended && (
                    <View style={styles.badge}>
                      <CustomText style={styles.badgeText}>MAIS POPULAR</CustomText>
                    </View>
                  )}
                  <MaterialCommunityIcons name={plan.icon as any} size={30} color={plan.color} />
                  <View style={{ flex: 1, marginLeft: 15 }}>
                    <CustomText variant="h3" style={{ color: "#FFF" }}>
                      {plan.title}
                    </CustomText>
                    <CustomText variant="hint">{plan.duration}</CustomText>
                  </View>
                  <CustomText variant="h2" style={{ color: plan.color }}>
                    {plan.price}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.restoreBtn}>
              <CustomText variant="hint">Já comprou? Restaurar compras</CustomText>
            </TouchableOpacity>
          </Cards>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" },
  content: { width: "90%", height: "80%" },
  closeBtn: { alignSelf: "flex-end", padding: 10 },
  header: { alignItems: "center", marginBottom: 20 },
  title: { color: COLORS.amber, marginTop: 10 },
  subtitle: { textAlign: "center", color: COLORS.textSecondary, marginTop: 5 },
  plansContainer: { gap: 12, paddingBottom: 20 },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)"
  },
  recommendedCard: { borderColor: COLORS.amber, backgroundColor: "rgba(255, 191, 0, 0.05)" },
  badge: {
    position: "absolute",
    top: -10,
    right: 20,
    backgroundColor: COLORS.amber,
    paddingHorizontal: 10,
    borderRadius: 5
  },
  badgeText: { fontSize: 9, fontWeight: "bold", color: COLORS.background },
  restoreBtn: { marginTop: 15, alignItems: "center" }
});
