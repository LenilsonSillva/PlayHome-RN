import { RewardedAd, RewardedAdEventType, AdEventType, InterstitialAd } from "react-native-google-mobile-ads";
import { isUserPremium } from "../iap/iapService";

const rewardedAdUnitId = "ca-app-pub-1764610529859221/4735804620";
const interstitialAdUnitId = "ca-app-pub-1764610529859221/5454824074";

let rewardedAd: RewardedAd | null = null;
let interstitial: InterstitialAd | null = null;
let lastAdTime = 0;
let lastShownTime = 0;
let isAdLoaded = false;
let isLoaded = false;
let roundCount = 0;

// --- EXPORTS DE ESTADO (Para os botões da UI não quebrarem) ---

export const isRewardedAdReady = () => isAdLoaded;
export const isInterstitialReady = () => isLoaded;

// --- RECOMPENSADOS ---

export const canShowAd = async () => {
  const premium = await isUserPremium();
  if (premium) return false;

  const now = Date.now();
  return now - lastAdTime >= 45000;
};

export const markAdAsShown = () => {
  lastAdTime = Date.now();
};

export const loadRewardedAd = async () => {
  // Se for premium, nem tenta carregar
  if (await isUserPremium()) return;

  rewardedAd = RewardedAd.createForAdRequest(rewardedAdUnitId);
  rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
    isAdLoaded = true;
  });
  rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
    isAdLoaded = false;
    loadRewardedAd();
  });
  rewardedAd.load();
};

export const showRewardedAd = async (onReward: () => void) => {
  const premium = await isUserPremium();
  if (premium) {
    onReward(); // Dá a recompensa direto para o premium
    return;
  }

  const ad = RewardedAd.createForAdRequest(rewardedAdUnitId);
  let rewarded = false;

  ad.addAdEventListener(RewardedAdEventType.LOADED, () => ad.show());
  ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
    rewarded = true;
    onReward();
  });
  ad.addAdEventListener(AdEventType.CLOSED, () => {
    if (!rewarded) onReward();
    loadRewardedAd();
  });
  ad.addAdEventListener(AdEventType.ERROR, () => onReward());
  ad.load();
};

// --- INTERSTITIAL ---

export const loadInterstitialAd = async () => {
  if (await isUserPremium()) return;

  interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId);
  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    isLoaded = true;
  });
  interstitial.addAdEventListener(AdEventType.ERROR, () => {
    interstitial = null;
    isLoaded = false;
    setTimeout(loadInterstitialAd, 5000);
  });
  interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    isLoaded = false;
    interstitial = null;
    loadInterstitialAd();
  });
  interstitial.load();
};

export const canShowInterstitial = async () => {
  const premium = await isUserPremium();
  if (premium) return false;

  const now = Date.now();
  return now - lastShownTime >= 60000;
};

export const shouldShowInterstitial = async () => {
  const premium = await isUserPremium();
  if (premium) return false;

  roundCount++;
  if (roundCount % 2 !== 0) return false;

  const ready = await canShowInterstitial();
  return ready && isLoaded;
};

export const showInterstitialAd = async (): Promise<void> => {
  return new Promise(async (resolve) => {
    const premium = await isUserPremium();

    if (premium || !interstitial || !isLoaded) {
      resolve();
      return;
    }

    const unsubscribe = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      unsubscribe();
      lastShownTime = Date.now();
      resolve();
    });

    interstitial.show();
  });
};
