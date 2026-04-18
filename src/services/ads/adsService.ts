import { RewardedAd, RewardedAdEventType, AdEventType, InterstitialAd, TestIds } from "react-native-google-mobile-ads";
// import { isUserPremium } from "../iap/iapService";

const rewardedAdUnitId = "ca-app-pub-1764610529859221/4735804620"; // REAL

const rewardedAdUnitIdTeste = __DEV__
  ? "ca-app-pub-3940256099942544/5224354917" // TESTE
  : "ca-app-pub-1764610529859221/4735804620"; // REAL

let rewardedAd: RewardedAd | null = null;
// 🔥 CONTROLE DE SPAM
let lastAdTime = 0;
let isAdLoaded = false;

export const canShowAd = async () => {
  //const premium = await isUserPremium();
  const premium = true; // 🔥 TESTE: força como se fosse premium (sem anúncios)
  if (premium) return false;
  const now = Date.now();
  return now - lastAdTime >= 45000;
};

export const markAdAsShown = () => {
  lastAdTime = Date.now();
};

// 🔥 PRELOAD
export const loadRewardedAd = () => {
  rewardedAd = RewardedAd.createForAdRequest(rewardedAdUnitId);

  rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
    isAdLoaded = true;
  });

  rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
    isAdLoaded = false;
    loadRewardedAd(); // carrega próximo
  });

  rewardedAd.load();
};

export const isRewardedAdReady = () => isAdLoaded;

// 🔥 SHOW (CORRETO)
export const showRewardedAd = (onReward: () => void) => {
  console.log("🎬 Tentando mostrar anúncio...");

  const ad = RewardedAd.createForAdRequest(rewardedAdUnitId);

  let rewarded = false;

  const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
    console.log("✅ Anúncio carregado");
    ad.show();
  });

  const unsubscribeEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
    console.log("🎁 Recompensa concedida");
    rewarded = true;
    onReward();
  });

  const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
    console.log("❌ Anúncio fechado");

    if (!rewarded) {
      onReward(); // fallback
    }

    // prepara próximo
    loadRewardedAd();

    unsubscribeLoaded();
    unsubscribeEarned();
    unsubscribeClosed();
  });

  const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
    console.log("❌ Erro no anúncio:", error);
    onReward(); // fallback
  });

  ad.load();

  return () => {
    unsubscribeLoaded();
    unsubscribeEarned();
    unsubscribeClosed();
    unsubscribeError();
  };
};

// INTERSTITIAL

const interstitialAdUnitId = "ca-app-pub-1764610529859221/5454824074";
const interstitialAdUnitIdTeste = __DEV__ ? TestIds.INTERSTITIAL : "ca-app-pub-1764610529859221/5454824074";

let interstitial: InterstitialAd | null = null;
let isLoaded = false;

// 🚀 CARREGAR ANÚNCIO
export const loadInterstitialAd = () => {
  if (interstitial) return;

  console.log("📥 Carregando interstitial...");

  interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId);

  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    console.log("✅ Interstitial carregado");
    isLoaded = true;
  });

  interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
    console.log("❌ Erro interstitial:", error);

    interstitial = null;
    isLoaded = false;

    setTimeout(loadInterstitialAd, 2000); // retry automático 🔥
  });

  interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    console.log("❌ Interstitial fechado");

    interstitial = null;
    isLoaded = false;

    loadInterstitialAd();
  });

  interstitial.load();
};

// 🔎 VERIFICAR SE ESTÁ PRONTO
export const isInterstitialReady = () => isLoaded && interstitial !== null;

// 🎬 MOSTRAR ANÚNCIO
export const showInterstitialAd = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!interstitial || !isLoaded) {
      resolve(); // fallback silencioso
      return;
    }

    const unsubscribe = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      unsubscribe();
      resolve();
    });

    interstitial.show();
  });
};

// ⏱️ CONTROLE DE TEMPO (ANTI-SPAM)
let lastShownTime = 0;

export const canShowInterstitial = () => {
  const now = Date.now();

  // mínimo 60 segundos entre anúncios
  if (now - lastShownTime < 60000) return false;

  lastShownTime = now;
  return true;
};

// 🎯 REGRA DE EXIBIÇÃO (ex: a cada 2 rodadas)
let roundCount = 0;

export const shouldShowInterstitial = () => {
  roundCount++;

  console.log("🔄 Rodada:", roundCount);

  // mostra a cada 2 rodadas
  if (roundCount % 2 !== 0) return false;

  return canShowInterstitial() && isInterstitialReady();
};
