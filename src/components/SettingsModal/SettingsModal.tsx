import React, { useEffect, useState } from "react";
import { Modal, View, StyleSheet, TouchableOpacity, Pressable, LayoutAnimation } from "react-native";
import { useTranslation } from "react-i18next";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { Cards } from "@/components/Cards/Cards";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { clearGlobalUsedWords } from "@/games/common/utils/wordStorage";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAudio } from "@/contexts/audioContext";
import { ScrollView, GestureHandlerRootView } from "react-native-gesture-handler";

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

// Lista de idiomas para a seleção
const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "en-GB", label: "English (UK)", flag: "🇬🇧" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "pt-PT", label: "Português (PT)", flag: "🇵🇹" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "es-419", label: "Español (LATAM)", flag: "🇲🇽" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" }
];

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
  const { playSound, isAudioEnabled, toggleAudio } = useAudio();
  const [isLangListVisible, setIsLangListVisible] = useState(false); // Controle da tela de idiomas
  const [changeRevealIcon, setChangeRevealIcon] = useState(false);
  const [changeDBIcon, setChangeDBIcon] = useState(false);

  // Alternar Áudio
  const handleToggleAudio = () => {
    // Toca o som antes de desligar para dar o feedback final
    toggleAudio();
  };

  useEffect(() => {
    playSound("click2");
  }, [isAudioEnabled]);

  // Função para alternar entre a lista de idiomas e as configurações
  const toggleLangList = () => {
    playSound("click2");
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsLangListVisible(!isLangListVisible);
  };

  // Função para selecionar o idioma e voltar
  const handleSelectLanguage = (code: string) => {
    playSound("click2");
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    i18n.changeLanguage(code);
    setIsLangListVisible(false);
  };

  const changeWordBtn = () => {
    playSound("click2");
    setChangeRevealIcon(true);
    onReroll && onReroll();
    setTimeout(() => setChangeRevealIcon(false), 2000);
  };

  const handleResetHistory = () => {
    playSound("click2");
    setChangeDBIcon(true);
    clearGlobalUsedWords();
    setTimeout(() => setChangeDBIcon(false), 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            onPress={() => {
              onClose();
              playSound("click2");
            }}
          />

          <View style={styles.modalContent}>
            {/* O Card muda de cor quando a lista de idiomas está aberta */}
            <Cards accentColor={isLangListVisible ? COLORS.cyan : COLORS.amber}>
              <View style={styles.innerLayout}>
                {/* CABEÇALHO DINÂMICO */}
                <View style={styles.header}>
                  <CustomText variant="label" style={{ color: isLangListVisible ? COLORS.cyan : COLORS.amber, fontSize: 14 }}>
                    {isLangListVisible ? t("home.lang_label") : t("home.settings_title")}
                  </CustomText>
                  <View style={[styles.line, { backgroundColor: isLangListVisible ? COLORS.cyan : COLORS.amber }]} />
                </View>

                {!isLangListVisible ? (
                  // --- VISÃO ORIGINAL DAS CONFIGURAÇÕES ---
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
                          {changeRevealIcon ? (
                            <MaterialIcons name="done-outline" size={24} color={COLORS.cyan} />
                          ) : (
                            <FontAwesome5 name="exchange-alt" size={24} color={COLORS.cyan} />
                          )}
                        </View>
                      </TouchableOpacity>
                    )}

                    {showReviewWordBtn && (
                      <TouchableOpacity
                        style={styles.optionRow}
                        onPress={() => {
                          onToggleReview?.(!reviewEnabled);
                          playSound("click2");
                        }}
                      >
                        <View>
                          <CustomText variant="h3" style={styles.whiteText}>
                            {t("games.impostor_discuss_reviewWord")}
                          </CustomText>
                          <CustomText variant="hint">{t("games.impostor_discuss_reviewClick")}</CustomText>
                        </View>
                        <View style={[styles.switch, { borderColor: reviewEnabled ? COLORS.success : COLORS.textSecondary }]}>
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

                    {/* BOTÃO PARA ABRIR LISTA DE IDIOMAS */}
                    <TouchableOpacity style={styles.optionRow} onPress={toggleLangList}>
                      <View>
                        <CustomText variant="h3" style={styles.whiteText}>
                          {t("home.lang_label")}
                        </CustomText>
                        <CustomText variant="hint">{t("home.lang_sub_label")}</CustomText>
                      </View>
                      <View style={styles.badge}>
                        <CustomText style={{ fontSize: 24 }}>
                          {/* 
                          Procura o idioma atual. 
                          1. Tenta o código exato (ex: pt-PT)
                          2. Se não achar, tenta o simplificado (ex: pt)
                          3. Fallback para bandeira dos EUA
                      */}
                          {LANGUAGES.find((l) => l.code === i18n.language)?.flag ||
                            LANGUAGES.find((l) => l.code === i18n.language.split("-")[0])?.flag ||
                            "🇺🇸"}
                        </CustomText>
                      </View>
                    </TouchableOpacity>

                    {/* CONFIGURAÇÃO DE ÁUDIO */}
                    <TouchableOpacity style={styles.optionRow} onPress={handleToggleAudio}>
                      <View>
                        <CustomText variant="h3" style={styles.whiteText}>
                          {t("home.settings_audioTitle")}
                        </CustomText>
                        <CustomText variant="hint">{t("home.settings_audioSubTitle")}</CustomText>
                      </View>
                      <View style={[styles.switch, { borderColor: isAudioEnabled ? COLORS.success : COLORS.textSecondary }]}>
                        <View
                          style={[
                            styles.switchDot,
                            {
                              backgroundColor: isAudioEnabled ? COLORS.success : COLORS.textSecondary,
                              marginLeft: isAudioEnabled ? 22 : 2
                            }
                          ]}
                        />
                      </View>
                    </TouchableOpacity>

                    {showResetWords && (
                      <TouchableOpacity style={styles.optionRow} onPress={handleResetHistory}>
                        <View style={{ width: "80%" }}>
                          <CustomText variant="h3" style={styles.whiteText}>
                            {t("home.settings_clearDBTitle")}
                          </CustomText>
                          <CustomText variant="hint">{t("home.settings_clearDBSub")}</CustomText>
                        </View>
                        <View style={styles.badge}>
                          {changeDBIcon ? (
                            <MaterialIcons name="done-outline" size={24} color={COLORS.cyan} />
                          ) : (
                            <MaterialCommunityIcons name="database-refresh" size={24} color={COLORS.danger} />
                          )}
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  // --- VISÃO DA LISTA DE IDIOMAS (SCROLL) ---
                  <View style={styles.langListContainer}>
                    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} nestedScrollEnabled={true}>
                      <View style={{ height: 30 }}></View>
                      {LANGUAGES.map((lang) => {
                        // Compara o código exato para evitar duplicidade visual em variações regionais
                        const isSelected = i18n.language === lang.code;

                        return (
                          <TouchableOpacity
                            key={lang.code}
                            style={[styles.langItem, isSelected && styles.langItemSelected]}
                            onPress={() => handleSelectLanguage(lang.code)}
                          >
                            <CustomText style={{ fontSize: 20, marginRight: 15 }}>{lang.flag}</CustomText>
                            <CustomText variant="h3" style={{ color: isSelected ? COLORS.cyan : COLORS.white, flex: 1 }}>
                              {lang.label}
                            </CustomText>
                            {isSelected && <MaterialIcons name="check-circle" size={20} color={COLORS.cyan} />}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* BOTÃO FECHAR / VOLTAR */}
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: isLangListVisible ? COLORS.cyan : COLORS.amber }]}
                  onPress={() => {
                    isLangListVisible ? toggleLangList() : onClose();
                    playSound("click2");
                  }}
                >
                  <CustomText variant="label" style={{ color: COLORS.background, fontWeight: "900" }}>
                    {t("home.back_btn")}
                  </CustomText>
                </TouchableOpacity>
              </View>
            </Cards>
          </View>
        </View>
      </GestureHandlerRootView>
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
    height: 520 // Altura levemente maior para comportar a lista com scroll
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
  langListContainer: {
    flex: 1,
    maxHeight: 380,
    marginBottom: 10
  },
  langItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 5
  },
  langItemSelected: {
    backgroundColor: "rgba(0, 242, 255, 0.1)"
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
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 10
  }
});
