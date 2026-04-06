import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  Linking,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useTranslation } from "react-i18next";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { Header } from "@/components/Header/Header";
import { SettingsModal } from "@/components/SettingsModal/SettingsModal";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ImpostorBackground } from "@/components/Background/Background";
import { useAudio } from "@/contexts/audioContext";

const { width, height } = Dimensions.get("window");
const ITEM_WIDTH = width * 0.82;
const GAP = 12;
const FULL_ITEM_SIZE = ITEM_WIDTH + GAP;

export default function HomeScreen() {
  const { t } = useTranslation();
  const { playSound } = useAudio();
  const navigation = useNavigation<any>();
  const [openModal, setOpenModal] = useState(false);
  const [suggestionModal, setSuggestionModal] = useState(false);
  const [suggestionText, setSuggestionText] = useState("");

  const scrollX = useRef(new Animated.Value(0)).current;

  const DATA = [
    {
      id: "1",
      title: t("games.impostor_title"),
      label: t("home.card_subTitleImpostor"),
      icon: "incognito",
      color: COLORS.danger,
      desc: t("games.impostor_desc"),
      minPlayers: 3,
      tags: [t("home.card_typeMystery"), t("home.card_typeParty")],
      navigate: () => navigation.navigate("ImpostorLobby")
    },
    {
      id: "2",
      title: t("games.cripto_title"),
      label: t("home.card_subTitleCrypto"),
      icon: "key-variant",
      color: COLORS.cyan,
      desc: t("games.cripto_desc"),
      minPlayers: 4,
      tags: [t("home.card_typeTeams"), t("home.card_typeCode")],
      navigate: () => navigation.navigate("CryptographyLobby")
    },
    {
      id: "sugestao",
      title: t("home.card_suggestions"),
      label: t("home.card_subTitleSuggestion"),
      icon: "lightbulb-on-outline",
      color: COLORS.white,
      desc: t("home.card_playerIdea"),
      minPlayers: 1,
      tags: [t("home.card_typeCommu"), t("home.card_typeFuture")],
      navigate: () => {
        setSuggestionModal(true);
        playSound("click2");
      }
    }
  ];

  const handleSendEmail = () => {
    const subject = "My Suggestion - App PlayHome";
    const body = suggestionText;
    const email = "usuperinteractive@gmail.com";
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(url);
    setSuggestionModal(false);
    setSuggestionText("");
  };

  const renderItem = ({ item, index }: any) => {
    const inputRange = [(index - 1) * FULL_ITEM_SIZE, index * FULL_ITEM_SIZE, (index + 1) * FULL_ITEM_SIZE];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: "clamp"
    });

    return (
      <Animated.View style={[styles.cardWrapper, { transform: [{ scale }] }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={item.navigate}
          style={[styles.touchable, { borderColor: item.color + "40" }]}
        >
          <LinearGradient colors={["#1c1c1c", "#0f0f0f"]} style={styles.cardGradient}>
            <View style={[styles.glow, { backgroundColor: item.color }]} />

            <View style={styles.cardHeader}>
              <View style={[styles.badge, { borderColor: item.color + "50" }]}>
                <MaterialCommunityIcons
                  name={item.id === "sugestao" ? "email-outline" : "account-group"}
                  size={14}
                  color={item.color}
                />
                <CustomText style={[styles.badgeText, { color: item.color }]}>
                  {item.id === "sugestao" ? t("home.card_minSuggestion") : `${t("home.card_min")} ${item.minPlayers}`}
                </CustomText>
              </View>
              <MaterialCommunityIcons name={item.icon} size={32} color={item.color} />
            </View>

            <View style={styles.cardContent}>
              <CustomText variant="label" style={[styles.label, { color: item.color }]}>
                {item.label}
              </CustomText>
              <CustomText style={styles.title}>{item.title}</CustomText>

              <View style={styles.tagContainer}>
                {item.tags.map((tag: string) => (
                  <View key={tag} style={styles.tag}>
                    <CustomText style={styles.tagText}>{tag.toUpperCase()}</CustomText>
                  </View>
                ))}
              </View>

              <CustomText variant="body" style={styles.description}>
                {item.desc}
              </CustomText>
            </View>

            <View style={styles.cardFooter}>
              <View style={[styles.playBtn, { backgroundColor: item.color }]}>
                <CustomText style={styles.playBtnText}>
                  {item.id === "sugestao" ? t("home.card_sendIdeaBtn") : t("home.card_playBtn")}
                </CustomText>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#000" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <ImpostorBackground scanner={false} />
      <StatusBar barStyle="light-content" />
      <Header
        centerElement={
          <View style={styles.hudWrapper}>
            <View style={styles.bracketLeft} />
            <CustomText style={styles.hudText}>
              PLAY<CustomText style={{ color: COLORS.textSecondary, fontSize: 25 }}>HOME</CustomText>
            </CustomText>
            <View style={styles.bracketRight} />
          </View>
        }
        onOpenSettings={() => setOpenModal(true)}
        hideBack
      />

      <Animated.FlatList
        data={DATA}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={FULL_ITEM_SIZE}
        decelerationRate="fast"
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
        renderItem={renderItem}
      />
      <View style={styles.pagination}>
        {DATA.map((item, i) => {
          const scaleX = scrollX.interpolate({
            inputRange: [(i - 1) * FULL_ITEM_SIZE, i * FULL_ITEM_SIZE, (i + 1) * FULL_ITEM_SIZE],
            outputRange: [1, 2.5, 1], // Simula o width esticando de 1x para 2.5x
            extrapolate: "clamp"
          });

          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: item.color,
                  transform: [{ scaleX }]
                }
              ]}
            />
          );
        })}
      </View>

      <SettingsModal visible={openModal} onClose={() => setOpenModal(false)} />

      {/* MODAL DE SUGESTÕES */}
      <Modal visible={suggestionModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.suggestionContent}>
            <View style={styles.suggestionHeader}>
              <MaterialCommunityIcons name="lightbulb-on" size={30} color={COLORS.white} />
              <CustomText variant="h2" style={{ color: "#FFF", marginTop: 10 }}>
                {t("home.modal_newIdea")}
              </CustomText>
              <CustomText variant="body" style={{ color: "#888", textAlign: "center" }}>
                {t("home.modal_sugDesc")}
              </CustomText>
            </View>

            <TextInput
              style={styles.suggestionInput}
              placeholder={t("home.modal_playerDesc")}
              placeholderTextColor="#555"
              multiline
              value={suggestionText}
              onChangeText={setSuggestionText}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setSuggestionModal(false);
                  playSound("click2");
                }}
              >
                <CustomText style={{ color: "#FFF" }}>{t("alerts.cancel")}</CustomText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendBtn, !suggestionText && { opacity: 0.5 }]}
                onPress={() => {
                  handleSendEmail();
                  playSound("click");
                }}
                disabled={!suggestionText}
              >
                <CustomText style={{ color: "#000", fontWeight: "900" }}>{t("home.modal_send")}</CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  headerLogo: { fontSize: 20, fontWeight: "900", color: "#FFF", letterSpacing: 3 },
  hudWrapper: {
    flexDirection: "row",
    alignItems: "center"
  },
  hudText: {
    fontSize: 25,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 1,
    marginHorizontal: 12
  },
  bracketLeft: {
    width: 8,
    height: 24,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: "rgba(255,255,255,0.2)"
  },
  bracketRight: {
    width: 8,
    height: 24,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: "rgba(255,255,255,0.2)"
  },
  listContent: { paddingHorizontal: (width - ITEM_WIDTH) / 2, alignItems: "center" },
  cardWrapper: { width: ITEM_WIDTH, height: height * 0.58, marginHorizontal: GAP / 2 },
  touchable: { flex: 1, borderRadius: 35, borderWidth: 1.5, borderColor: "#252525", overflow: "hidden" },
  cardGradient: { flex: 1, padding: 25 },
  glow: { position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: 60, opacity: 0.1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5
  },
  badgeText: { fontSize: 10, fontWeight: "900" },
  cardContent: { flex: 1 },
  label: { fontSize: 11, letterSpacing: 2, fontWeight: "900", marginBottom: 5 },
  title: { fontSize: 35, fontWeight: "900", color: "#FFF", lineHeight: 42, marginBottom: 15 },
  tagContainer: { flexDirection: "row", gap: 8, marginBottom: 20 },
  tag: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)"
  },
  tagText: { fontSize: 9, color: "#888", fontWeight: "bold" },
  description: { color: "#aaa", fontSize: 15, lineHeight: 22 },
  cardFooter: { marginTop: "auto" },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 18,
    gap: 5
  },
  playBtnText: { color: "#000", fontWeight: "900", fontSize: 14, letterSpacing: 1 },
  pagination: { flexDirection: "row", justifyContent: "center", alignItems: "center", height: 80, gap: 12 },
  dot: { height: 6, width: 10, borderRadius: 3 }, // Width fixo, a escala faz o resto

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", padding: 20 },
  suggestionContent: { backgroundColor: "#111", borderRadius: 30, padding: 25, borderWidth: 1, borderColor: "#222" },
  suggestionHeader: { alignItems: "center", marginBottom: 20 },
  suggestionInput: {
    backgroundColor: "#080808",
    borderRadius: 20,
    padding: 20,
    color: "#FFF",
    height: 150,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#333"
  },
  modalActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, gap: 10 },
  cancelBtn: { flex: 1, padding: 18, alignItems: "center" },
  sendBtn: { flex: 2, backgroundColor: COLORS.white, padding: 18, borderRadius: 15, alignItems: "center" }
});
