import React from "react";
import { View, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { useTranslation } from "react-i18next";
import { useAudio } from "@/contexts/audioContext";

// 🔥 Definimos como os botões vão funcionar
export interface AlertButtonProps {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive"; // Para mudar a cor do botão
}

interface AlertsModalProps {
  visible: boolean;
  emoji?: string;
  title?: string;
  message: string;
  buttons?: AlertButtonProps[];
  onClose: () => void;
}

export const AlertsModal = ({ visible, emoji, title, message, buttons, onClose }: AlertsModalProps) => {
  // Se não passarem nenhum botão, usamos o padrão
  const { t } = useTranslation();
  const { playSound } = useAudio();
  const showEmoji = emoji ?? "⚠️";
  const defaultButtons: AlertButtonProps[] = [{ text: t("alerts.gotIt"), onPress: onClose, style: "default" }];
  const titleText = title || t("alerts.warning");

  const activeButtons = buttons && buttons.length > 0 ? buttons : defaultButtons;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <CustomText style={styles.icon}>{showEmoji}</CustomText>

          <CustomText variant="h2" style={styles.title}>
            {titleText}
          </CustomText>

          <CustomText variant="h3" style={styles.desc}>
            {message}
          </CustomText>

          {/* 🔥 Container dinâmico para os botões */}
          <View style={activeButtons.length > 2 ? styles.buttonStack : styles.buttonRow}>
            {activeButtons.map((btn, index) => {
              const isCancel = btn.style === "cancel";
              const isDestructive = btn.style === "destructive";

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.btnBase,
                    activeButtons.length === 2 && styles.btnHalf,
                    activeButtons.length > 2 && styles.btnFull,
                    isCancel ? styles.btnCancel : isDestructive ? styles.btnDestructive : styles.btnDefault
                  ]}
                  onPress={() => {
                    if (btn.onPress) btn.onPress();
                    onClose();
                    playSound("click2");
                  }}
                >
                  <CustomText
                    variant="label"
                    style={{
                      color: isCancel ? COLORS.textPrimary : COLORS.background,
                      textAlign: "center"
                    }}
                  >
                    {btn.text}
                  </CustomText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 30
  },
  modal: {
    backgroundColor: COLORS.surface,
    padding: 30,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.amber,
    alignItems: "center",
    width: "100%"
  },
  icon: { fontSize: 50, marginBottom: 15 },
  title: {
    color: COLORS.amber,
    textAlign: "center",
    marginBottom: 10,
    textTransform: "uppercase"
  },
  desc: { color: COLORS.textSecondary, textAlign: "center", marginBottom: 25 },

  buttonRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    alignItems: "stretch",
    gap: 10
  },
  buttonStack: {
    width: "100%",
    justifyContent: "center",
    alignItems: "stretch",
    gap: 10
  },
  btnBase: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48
  },
  btnHalf: {
    flex: 1,
    marginHorizontal: 4
  },
  btnFull: {
    width: "100%"
  },
  btnDefault: {
    backgroundColor: COLORS.amber
  },
  btnCancel: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.textSecondary
  },
  btnDestructive: {
    backgroundColor: COLORS.danger
  }
});
