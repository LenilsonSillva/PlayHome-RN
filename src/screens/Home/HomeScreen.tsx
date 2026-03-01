import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  ImageBackground
} from "react-native";
import { useTranslation } from "react-i18next";
import { COLORS } from "@/styles/theme";
import { CustomText } from "@/styles/customText";
import { Cards } from "@/components/Cards/Cards";
import { Header } from "@/components/Header/Header";
import { SettingsModal } from "@/components/SettingsModal/SettingsModal";
import { useNavigation } from "expo-router";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width * 0.85;
const GAP = 20;
const SPACER = (width - ITEM_WIDTH) / 2;

export default function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [openModal, setOpenModal] = useState<boolean>(false);
  const scrollX = useRef(new Animated.Value(0)).current;

  const DATA = [
    {
      id: "1",
      title: t("games.impostor_title"),
      icon: "🤫",
      color: COLORS.danger,
      desc: t("games.impostor_desc"),
      img: require("../../../assets/bgImpostor.png"),
      navigate: ()=>navigation.navigate("ImpostorLobby")
    },
    {
      id: "2",
      title: t("games.cripto_title"),
      icon: "🔑",
      color: COLORS.cyan,
      desc: t("games.cripto_desc"),
      img: require("../../../assets/bgCrip.png"),
      navigate: ()=>''
    }
  ];

  const HomeLogo = (
    <View style={styles.logoContainer}>
      <CustomText style={styles.mainLogoText}>
        PLAY
        <CustomText style={{ color: COLORS.textSecondary, fontSize: 40 }}>
          HOME
        </CustomText>
      </CustomText>
      <CustomText variant="hint" style={styles.mainSubtitle}>
        {t("home.main_subtitle")?.toUpperCase()}
      </CustomText>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        centerElement={HomeLogo}
        onOpenSettings={() => {
          setOpenModal(true);
        }}
      />

      {/* SETAS FLUTUANTES (Z-INDEX 100) */}
      <View style={styles.arrowOverlay} pointerEvents="none">
        <CustomText style={styles.arrow}>〈</CustomText>
        <CustomText style={styles.arrow}>〉</CustomText>
      </View>

      <View style={styles.carouselContainer}>
        <Animated.FlatList
          data={DATA}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_WIDTH + GAP}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: SPACER }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          renderItem={({ item, index }) => {
            const inputRange = [
              (index - 1) * (ITEM_WIDTH + GAP),
              index * (ITEM_WIDTH + GAP),
              (index + 1) * (ITEM_WIDTH + GAP)
            ];

            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.85, 1, 0.85],
              extrapolate: "clamp"
            });
            const rotateY = scrollX.interpolate({
              inputRange,
              outputRange: ["30deg", "0deg", "-30deg"],
              extrapolate: "clamp"
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: "clamp"
            });

            return (
              <Animated.View
                style={[
                  styles.cardWrapper,
                  {
                    opacity,
                    transform: [{ scale }, { rotateY }, { perspective: 1000 }]
                  }
                ]}
              >
                <TouchableOpacity activeOpacity={0.9} style={{ flex: 1 }} onPress={item.navigate}>
                  <Cards accentColor={item.color}>
                    <ImageBackground
                      source={item.img}
                      style={{ position: "static", opacity: 0.4 }}
                    />
                    <View style={styles.emojiWrapper}>
                      <CustomText
                        style={[styles.largeEmoji, { shadowColor: item.color }]}
                      >
                        {item.icon}
                      </CustomText>
                    </View>

                    <View style={styles.textCenter}>
                      <CustomText
                        variant="h2"
                        style={{ color: item.color, textAlign: "center" }}
                      >
                        {item.title}
                      </CustomText>
                      <CustomText
                        variant="body"
                        numberOfLines={4}
                        style={[
                          styles.cardDesc,
                          { color: COLORS.textSecondary }
                        ]}
                      >
                        {item.desc}
                      </CustomText>
                    </View>

                    <View
                      style={[styles.actionBtn, { borderColor: item.color }]}
                    >
                      <CustomText variant="label" style={{ color: item.color }}>
                        {t("home.connect_btn")} →
                      </CustomText>
                    </View>
                  </Cards>
                </TouchableOpacity>
              </Animated.View>
            );
          }}
        />
      </View>

      <SettingsModal visible={openModal} onClose={() => setOpenModal(false)} onToggleReview={()=>{}} reviewEnabled/>

      {/* INDICADORES ANIMADOS */}
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {DATA.map((_, i) => {
            const scaleX = scrollX.interpolate({
              inputRange: [
                (i - 1) * (ITEM_WIDTH + GAP),
                i * (ITEM_WIDTH + GAP),
                (i + 1) * (ITEM_WIDTH + GAP)
              ],
              outputRange: [1, 2.5, 1],
              extrapolate: "clamp"
            });
            const dotOpacity = scrollX.interpolate({
              inputRange: [
                (i - 1) * (ITEM_WIDTH + GAP),
                i * (ITEM_WIDTH + GAP),
                (i + 1) * (ITEM_WIDTH + GAP)
              ],
              outputRange: [0.2, 1, 0.2],
              extrapolate: "clamp"
            });

            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    opacity: dotOpacity,
                    transform: [{ scaleX }],
                    backgroundColor: DATA[i].color
                  }
                ]}
              />
            );
          })}
        </View>
        <CustomText variant="hint" style={styles.swipeText}>
          {t("home.swipe_hint")}
        </CustomText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  logoContainer: { alignItems: "center" },
  mainLogoText: {
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: -2,
    color: "#FFF",
    lineHeight: 50
  },
  mainSubtitle: {
    fontSize: 8,
    fontFamily: "Open Sans",
    letterSpacing: 5,
    color: COLORS.cyan,
    borderWidth: 1,
    borderRadius: 3,
    borderColor: COLORS.cyan,
    paddingInline: 10,
    paddingBlock: 1.5
  },

  arrowOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    zIndex: 100
  },
  arrow: { fontSize: 34, color: "rgba(255,255,255,0.2)", fontWeight: "200" },

  carouselContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  cardWrapper: {
    width: ITEM_WIDTH,
    height: 480,
    marginHorizontal: GAP / 30,
    alignSelf: "center",
    marginBottom: 50
  },

  emojiWrapper: {
    height: 100,
    justifyContent: "center",
    alignItems: "center"
  },

  largeEmoji: {
    fontSize: 80,
    lineHeight: 90,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 15
  }, // LineHeight evita cortes no topo

  textCenter: { alignItems: "center", gap: 10 },
  cardDesc: { textAlign: "center", fontSize: 14 },

  actionBtn: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    marginTop: 20
  },

  footer: { alignItems: "center", paddingBottom: 60 },
  pagination: { flexDirection: "row", gap: 12, marginBottom: 15 },
  dot: { height: 2.5, width: 12, borderRadius: 5 },
  swipeText: { opacity: 0.35, fontSize: 10, letterSpacing: 1.5 }
});
