import React, { useState } from "react";
import { Modal, View, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { Cards } from "@/components/Cards/Cards";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { clearGlobalUsedWords } from "@/games/common/utils/wordStorage";
import { useAlert } from "@/contexts/alertContext";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  showChangeWordBtn?: boolean;
  onReroll?: () => void;
  reviewEnabled?: boolean;
  onToggleReview?: (val: boolean) => void;
  showReviewWordBtn?: boolean;
  showResetWords?: boolean;
}

export const SettingsModal = ({
  visible,
  onClose,
  showChangeWordBtn,
  onReroll,
  reviewEnabled,
  onToggleReview,
  showReviewWordBtn,
  showResetWords
}: SettingsModalProps) => {
  const { t, i18n } = useTranslation();
  const { showAlert } = useAlert();
  const [changeRevealIcon, setChangeRevealIcon] = useState(false);
  const [changeDBIcon, setChangeDBIcon] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const changeLanguage = () => {
    const langs = ["pt", "en", "es"];
    const current = i18n.resolvedLanguage || "pt";
    const nextIndex = (langs.indexOf(current) + 1) % langs.length;
    i18n.changeLanguage(langs[nextIndex]);
  };

  const changeWordBtn = () => {
    setChangeRevealIcon(true);
    onReroll && onReroll();
    setTimeout(() => setChangeRevealIcon(false), 2000);
  };

  const handleResetHistory = () => {
    setChangeDBIcon(true);
    clearGlobalUsedWords();
    setTimeout(() => setChangeDBIcon(false), 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Overlay escuro */}
      <View style={styles.overlay}>
        {/* Área externa para fechar ao clicar fora */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Container do Card com altura fixa*/}
        <View style={styles.modalContent}>
          <Cards accentColor={COLORS.amber}>
            <View style={styles.innerLayout}>
              {/* CABEÇALHO */}
              <View style={styles.header}>
                <CustomText variant="label" style={{ color: COLORS.amber, fontSize: 14 }}>
                  {t("home.settings_title")}
                </CustomText>
                <View style={[styles.line, { backgroundColor: COLORS.amber }]} />
              </View>

              {/* OPÇÕES */}
              <View style={styles.optionsBody}>
                {showChangeWordBtn && (
                  <TouchableOpacity style={styles.optionRow} onPress={changeWordBtn}>
                    <View>
                      <CustomText variant="h3" style={styles.whiteText}>
                        {t("games.impostor_reveal_changeWord")}
                      </CustomText>
                      <CustomText variant="hint">{t("games.impostor_reveal_changeWord_sub")}</CustomText>
                    </View>
                    <View style={styles.badge}>
                      <CustomText variant="h3" style={{ color: COLORS.cyan }}>
                        {changeRevealIcon ? (
                          <MaterialIcons name="done-outline" size={24} color={COLORS.cyan} />
                        ) : (
                          <FontAwesome5 name="exchange-alt" size={24} color={COLORS.cyan} />
                        )}
                      </CustomText>
                    </View>
                  </TouchableOpacity>
                )}

                {showReviewWordBtn && (
                  <TouchableOpacity style={styles.optionRow} onPress={() => onToggleReview?.(!reviewEnabled)}>
                    <View>
                      <CustomText variant="h3" style={styles.whiteText}>
                        {t("games.impostor_discuss_reviewWord")}
                      </CustomText>
                      <CustomText variant="hint">{t("games.impostor_discuss_reviewClick")}</CustomText>
                    </View>

                    <View
                      style={[
                        styles.switch,
                        {
                          borderColor: reviewEnabled ? COLORS.success : COLORS.textSecondary
                        }
                      ]}
                    >
                      <View
                        style={[
                          styles.switchDot,
                          {
                            backgroundColor: reviewEnabled ? COLORS.success : COLORS.textSecondary,
                            marginLeft: reviewEnabled ? 22 : 2
                          }
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.optionRow} onPress={changeLanguage}>
                  <View>
                    <CustomText variant="h3" style={styles.whiteText}>
                      {t("home.lang_label")}
                    </CustomText>
                    <CustomText variant="hint">{t("home.lang_sub_label")}</CustomText>
                  </View>
                  <View style={styles.badge}>
                    <CustomText variant="h3" style={{ color: COLORS.cyan }}>
                      {(i18n.resolvedLanguage || "pt").toUpperCase()}
                    </CustomText>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionRow} onPress={() => setSoundEnabled(!soundEnabled)}>
                  <View>
                    <CustomText variant="h3" style={styles.whiteText}>
                      {t("home.settings_audioTitle")}
                    </CustomText>
                    <CustomText variant="hint">{t("home.settings_audioSubTitle")}</CustomText>
                  </View>

                  <View
                    style={[
                      styles.switch,
                      {
                        borderColor: soundEnabled ? COLORS.success : COLORS.textSecondary
                      }
                    ]}
                  >
                    <View
                      style={[
                        styles.switchDot,
                        {
                          backgroundColor: soundEnabled ? COLORS.success : COLORS.textSecondary,
                          marginLeft: soundEnabled ? 22 : 2
                        }
                      ]}
                    />
                  </View>
                </TouchableOpacity>
                {showResetWords && (
                  <TouchableOpacity style={styles.optionRow} onPress={handleResetHistory}>
                    <View>
                      <CustomText variant="h3" style={styles.whiteText}>
                        {t("home.settings_clearDBTitle")}
                      </CustomText>
                      <CustomText variant="hint">{t("home.settings_clearDBSub")}</CustomText>
                    </View>

                    <View style={styles.badge}>
                      <CustomText variant="h3" style={{ color: COLORS.cyan }}>
                        {changeDBIcon ? (
                          <MaterialIcons name="done-outline" size={24} color={COLORS.cyan} />
                        ) : (
                          <MaterialCommunityIcons name="database-refresh" size={24} color={COLORS.cyan} />
                        )}
                      </CustomText>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              {/* BOTÃO FECHAR */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <CustomText variant="label" style={{ color: COLORS.background, fontWeight: "900" }}>
                  {t("home.back_btn")}
                </CustomText>
              </TouchableOpacity>
            </View>
          </Cards>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center"
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  modalContent: {
    width: "85%",
    maxWidth: 400,
    height: 480 // Altura fixa garante que o Cards não colapse
  },
  innerLayout: {
    flex: 1,
    justifyContent: "space-between"
  },
  header: {
    alignItems: "center",
    marginTop: 10
  },
  line: {
    width: 50,
    height: 3,
    borderRadius: 2,
    marginTop: 10
  },
  optionsBody: {
    flex: 1,
    justifyContent: "center",
    gap: 15
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)"
  },
  whiteText: {
    color: "#FFF"
  },
  badge: {
    backgroundColor: "rgba(0, 242, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 242, 255, 0.2)"
  },
  /* SWITCH ESTILO HUD */
  switch: {
    width: 50,
    height: 26,
    borderRadius: 15,
    borderWidth: 2,
    justifyContent: "center"
  },
  switchDot: {
    width: 18,
    height: 18,
    borderRadius: 9
  },
  closeButton: {
    backgroundColor: COLORS.amber,
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 10
  }
});
