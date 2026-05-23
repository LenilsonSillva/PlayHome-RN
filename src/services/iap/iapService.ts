// src/services/iap/iapService.ts
import Purchases, { PurchasesOffering, PurchasesPackage, LOG_LEVEL, CustomerInfo } from "react-native-purchases";
import { Platform } from "react-native";

const API_KEYS = {
  google: "goog_iWEkJvkgvgGkftMrNXyJZClwnxx" // SUBSTITUA PELA SUA CHAVE DO REVENUECAT
};

/**
 * Configura o RevenueCat (Chamar no App.tsx)
 */
export const setupIAP = async () => {
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  if (Platform.OS === "android") {
    await Purchases.configure({ apiKey: API_KEYS.google });
  }
};

/**
 * Busca as ofertas (packages) configuradas no RevenueCat
 */
export const getCurrentOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null) {
      return offerings.current;
    }
    return null;
  } catch (e) {
    console.error("Erro ao buscar ofertas:", e);
    return null;
  }
};

/**
 * Verifica se o usuário tem o entitlement "adfree" ativo
 */
export const isUserPremium = async (): Promise<boolean> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active["adfree"] !== "undefined";
  } catch (e) {
    return false;
  }
};

/**
 * Realiza a compra de um pacote específico
 */
export const purchasePackage = async (packageToBuy: PurchasesPackage): Promise<boolean> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
    return typeof customerInfo.entitlements.active["adfree"] !== "undefined";
  } catch (e: any) {
    if (!e.userCancelled) {
      console.error("Erro na compra:", e);
      throw e;
    }
    return false;
  }
};

/**
 * Restaura compras anteriores
 */
export const restorePurchases = async (): Promise<boolean> => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return typeof customerInfo.entitlements.active["adfree"] !== "undefined";
  } catch (e) {
    console.error("Erro ao restaurar:", e);
    return false;
  }
};
