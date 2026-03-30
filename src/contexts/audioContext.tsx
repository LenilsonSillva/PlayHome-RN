import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUDIO_KEY = "@playhome_audio_enabled";

const soundAssets = {
  click: require("../../assets/sounds/click.wav"),
  click2: require("../../assets/sounds/click2.wav"),
  alert: require("../../assets/sounds/alert.wav"),
  end: require("../../assets/sounds/end.wav"),
  impostor: require("../../assets/sounds/impostor.wav"),
  skip: require("../../assets/sounds/skip.wav"),
  success: require("../../assets/sounds/success.wav"),
  win: require("../../assets/sounds/win.wav")
};

interface AudioContextData {
  isAudioEnabled: boolean;
  toggleAudio: () => Promise<void>;
  playSound: (name: keyof typeof soundAssets) => void;
}

const AudioContext = createContext<AudioContextData>({} as AudioContextData);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Pré-carregamento dos players
  const clickPlayer = useAudioPlayer(soundAssets.click);
  const click2Player = useAudioPlayer(soundAssets.click2);
  const alertPlayer = useAudioPlayer(soundAssets.alert);
  const endPlayer = useAudioPlayer(soundAssets.end);
  const impostorPlayer = useAudioPlayer(soundAssets.impostor);
  const skipPlayer = useAudioPlayer(soundAssets.skip);
  const successPlayer = useAudioPlayer(soundAssets.success);
  const winPlayer = useAudioPlayer(soundAssets.win);

  useEffect(() => {
    AsyncStorage.getItem(AUDIO_KEY).then((value) => {
      if (value !== null) setIsAudioEnabled(JSON.parse(value));
    });
  }, []);

  const toggleAudio = useCallback(async () => {
    const newValue = !isAudioEnabled;
    setIsAudioEnabled(newValue);
    await AsyncStorage.setItem(AUDIO_KEY, JSON.stringify(newValue));
  }, [isAudioEnabled]);

  const playSound = useCallback(
    (name: keyof typeof soundAssets) => {
      // 1. LÓGICA DE VIBRAÇÃO (Sempre executa, independente do áudio)
      switch (name) {
        case "click":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
          break;
        case "click2":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case "success":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case "skip":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case "end":
        case "impostor":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case "win":
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
      }

      // 2. LÓGICA DE ÁUDIO (Só executa se isAudioEnabled for true)
      if (isAudioEnabled) {
        const playerMap = {
          click: clickPlayer,
          click2: click2Player,
          alert: alertPlayer,
          end: endPlayer,
          impostor: impostorPlayer,
          skip: skipPlayer,
          success: successPlayer,
          win: winPlayer
        };

        const player = playerMap[name];

        if (player) {
          player.seekTo(0);
          player.play();
        }
      }
    },
    [isAudioEnabled, clickPlayer, click2Player, alertPlayer, endPlayer, impostorPlayer, skipPlayer, successPlayer, winPlayer]
  );

  return <AudioContext.Provider value={{ isAudioEnabled, toggleAudio, playSound }}>{children}</AudioContext.Provider>;
};

export const useAudio = () => useContext(AudioContext);
