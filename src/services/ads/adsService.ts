import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
} from "react-native-google-mobile-ads";

const adUnitId = "ca-app-pub-1764610529859221/4735804620";

let rewardedAd: RewardedAd | null = null;

// 🔥 CONTROLE DE SPAM
let lastAdTime = 0;

export const canShowAd = () => {
  const now = Date.now();
  if (now - lastAdTime < 45000) return false; // 45 segundos
  lastAdTime = now;
  return true;
};

// 🔥 LOAD
export const loadRewardedAd = () => {
  rewardedAd = RewardedAd.createForAdRequest(adUnitId);

  rewardedAd.load();
};

// 🔥 SHOW
export const showRewardedAd = (onReward: () => void) => {
  if (!rewardedAd) {
    onReward(); // fallback
    return;
  }

  const unsubscribeLoaded = rewardedAd.addAdEventListener(
    RewardedAdEventType.LOADED,
    () => {
      rewardedAd?.show();
    }
  );

  const unsubscribeEarned = rewardedAd.addAdEventListener(
    RewardedAdEventType.EARNED_REWARD,
    () => {
      onReward();
    }
  );

  const unsubscribeClosed = rewardedAd.addAdEventListener(
    AdEventType.CLOSED,
    () => {
      loadRewardedAd(); // já carrega o próximo
    }
  );

  rewardedAd.load();

  return () => {
    unsubscribeLoaded();
    unsubscribeEarned();
    unsubscribeClosed();
  };
};