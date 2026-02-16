import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable
} from "react-native";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { Cards } from "@/components/Cards/Cards";
import { ImpostorPlayer } from "@/games/impostor/types/game";

interface Props {
  player: ImpostorPlayer | null;
  onClose: () => void;
}

export const ReviewWordModal = ({ player, onClose }: Props) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(false); // Reseta o estado de exibição da palavra sempre que um novo jogador for selecionado para revisão
  }, [player]);

  if (!player) return null;

  return (
    <Modal visible={!!player} transparent animationType="fade">
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.container}>
          <Cards accentColor={player.color}>
            <View style={styles.content}>
              <CustomText variant="label" style={{ color: player.color }}>
                ACESSO PRIVADO: {player.name}
              </CustomText>

              {!show ? (
                <TouchableOpacity
                  style={styles.decryptBtn}
                  onPress={() => setShow(true)}
                >
                  <CustomText variant="h3" style={{ color: COLORS.background }}>
                    DESCRIPTOGRAFAR SINAL
                  </CustomText>
                </TouchableOpacity>
              ) : (
                <View style={styles.wordBox}>
                  <CustomText variant="hint">{player.isImpostor ? "VOCÊ É O " : "SUA PALAVRA É: "}</CustomText>
                  <CustomText
                    variant="h1"
                    style={{ color: player.isImpostor ? COLORS.danger : player.color, fontSize: 38, textAlign: "center" }}
                  >
                    {player.isImpostor ? "IMPOSTOR" : player.word}
                  </CustomText>
                  {player.isImpostor && player.hint && (
                    <CustomText variant="hint" style={styles.hintText}>
                      💡 {player.hint}
                    </CustomText>
                  )}
                </View>
              )}

              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <CustomText variant="label">FECHAR TERMINAL</CustomText>
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
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: 25
  },
  container: { width: "100%", height: 320 },
  content: { flex: 1, alignItems: "center", justifyContent: "space-between" },
  decryptBtn: {
    backgroundColor: COLORS.cyan,
    padding: 20,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 40
  },
  wordBox: { alignItems: "center", marginTop: 30, gap: 10 },
  hintText: { color: COLORS.amber, textAlign: "center", marginTop: 10 },
  closeBtn: { padding: 10, opacity: 0.5, backgroundColor: COLORS.surfaceLight, borderRadius: 8, marginBottom: 20 }
});
