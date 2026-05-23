import React, { useMemo } from "react";
import { Modal, View, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { PLAYER_ICONS } from "@/games/common/constants/icons";
import { useAudio } from "@/contexts/audioContext";

interface EmojiSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  usedEmojis?: string[];
  playerName?: string;
}

export const EmojiSelectorModal = ({ visible, onClose, onSelectEmoji, usedEmojis = [], playerName }: EmojiSelectorModalProps) => {
  const { playSound } = useAudio();
  const { width } = useWindowDimensions();

  // Calcula quantas colunas de emojis vão caber na tela
  const emojiSize = 60;
  const padding = 16;
  const numColumns = Math.floor((width - padding * 2 - 40) / (emojiSize + 10));

  // Separa emojis em usados e disponíveis
  const { usedEmojisList, availableEmojisList } = useMemo(() => {
    const used = PLAYER_ICONS.filter((emoji) => usedEmojis.includes(emoji));
    const available = PLAYER_ICONS.filter((emoji) => !usedEmojis.includes(emoji));
    return { usedEmojisList: used, availableEmojisList: available };
  }, [usedEmojis]);

  const handleSelectEmoji = (emoji: string) => {
    playSound("click2");
    onSelectEmoji(emoji);
    onClose();
  };

  const renderEmojiButton = (emoji: string, isUsed: boolean = false) => (
    <TouchableOpacity
      key={emoji}
      style={[
        styles.emojiButton,
        {
          width: (width - padding * 2 - 40) / numColumns - 10,
          opacity: isUsed ? 0.5 : 1
        }
      ]}
      onPress={() => handleSelectEmoji(emoji)}
      disabled={isUsed}
      activeOpacity={isUsed ? 0.5 : 0.7}
    >
      <CustomText style={styles.emojiText}>{emoji}</CustomText>
      {isUsed && (
        <View style={styles.usedBadge}>
          <MaterialCommunityIcons name="check" size={14} color={COLORS.background} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <MaterialCommunityIcons name="emoticon-happy-outline" size={28} color={COLORS.cyan} />
              <View style={styles.headerText}>
                <CustomText variant="h2" style={styles.title}>
                  Escolher Emoji
                </CustomText>
                {playerName && (
                  <CustomText variant="body" style={styles.playerInfo}>
                    {playerName}
                  </CustomText>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* EMOJIS DISPONÍVEIS */}
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.emojiGrid} showsVerticalScrollIndicator={false}>
            {availableEmojisList && availableEmojisList.length > 0 ? (
              <>
                <CustomText variant="label" style={styles.sectionTitle}>
                  Disponíveis ({availableEmojisList.length})
                </CustomText>
                <View style={styles.section}>{availableEmojisList.map((emoji) => renderEmojiButton(emoji, false))}</View>
              </>
            ) : null}

            {/* EMOJIS JÁ USADOS */}
            {usedEmojisList && usedEmojisList.length > 0 ? (
              <>
                <CustomText variant="label" style={styles.sectionTitle}>
                  Já Usados ({usedEmojisList.length})
                </CustomText>
                <View style={styles.section}>{usedEmojisList.map((emoji) => renderEmojiButton(emoji, true))}</View>
              </>
            ) : null}

            {!availableEmojisList || availableEmojisList.length === 0 ? (
              <CustomText variant="hint" style={{ textAlign: "center", marginTop: 20 }}>
                Nenhum emoji disponível
              </CustomText>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
    paddingBottom: 0
  },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    minHeight: "60%",
    paddingBottom: 20
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)"
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  headerText: {
    flex: 1
  },
  title: {
    color: "#FFF",
    marginBottom: 4
  },
  playerInfo: {
    color: COLORS.textSecondary,
    fontSize: 12
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)"
  },
  scrollView: {
    flex: 1
  },
  emojiGrid: {
    padding: 16
  },
  sectionTitle: {
    color: COLORS.cyan,
    marginBottom: 12,
    marginTop: 8,
    letterSpacing: 1
  },
  section: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  emojiButton: {
    height: 60,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 242, 255, 0.2)",
    position: "relative"
  },
  emojiText: {
    fontSize: 32
  },
  usedBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: COLORS.cyan,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center"
  }
});
