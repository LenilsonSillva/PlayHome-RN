// src/services/iapService.ts
import Purchases, { PurchasesOffering } from 'react-native-purchases';
import { Platform } from 'react-native';

const API_KEYS = {
  google: "goog_xxxxxxxxxxxxxxxxxxxxxxxx", // Pegue no painel do RevenueCat
  apple: "appl_xxxxxxxxxxxxxxxxxxxxxxxx"
};

export const setupIAP = async () => {
  Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
  if (Platform.OS === 'ios') {
    await Purchases.configure({ apiKey: API_KEYS.apple });
  } else {
    await Purchases.configure({ apiKey: API_KEYS.google });
  }
};

// Verifica se o usuário é premium (tem o entitlement ativo)
export const isUserPremium = async (): Promise<boolean> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active['premium'] !== "undefined";
  } catch (e) {
    return false;
  }
};

// Busca os preços configurados no painel
export const getCurrentOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (e) {
    return null;
  }
};

// Realiza a compra
export const purchaseProduct = async (packageToBuy: any) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
    if (typeof customerInfo.entitlements.active['premium'] !== "undefined") {
      return true; // Compra sucesso
    }
  } catch (e: any) {
    if (!e.userCancelled) {
      console.log("Erro na compra", e);
    }
  }
  return false;
};