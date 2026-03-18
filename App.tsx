import React from "react";
// 🔥 PASSO 1: Importar a configuração do i18n aqui no topo!
// Isso inicializa as traduções antes de qualquer tela carregar.
import "@/i18n";
import { StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SplashScreen } from "@/screens/SplashScreen/SplashScreen";
import { COLORS } from "@/styles/theme";
import HomeScreen from "@/screens/Home/HomeScreen";
import ImpostorLobby from "@/screens/Impostor/lobby";
import { PlayersProvider } from "@/contexts/playersContext";
import { SocketProvider } from "@/contexts/socketContext";
import { AlertProvider } from "@/contexts/alertContext";
import { OfflineImpostorGameScreen } from "@/screens/Impostor/gameScreen/OfflineImpostorGameScreen";
import { OnlineImpostorGameScreen } from "@/screens/Impostor/gameScreen/OnlineImpostorGameScreen";
import { CryptographyLobby } from "@/screens/Criptography/lobby";
import { OfflineCryptographyGameScreen } from "@/screens/Criptography/gameScreen/OfflineCryptographyGameScreen";

// Tipagem das rotas
export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  ImpostorLobby: undefined;
  CryptographyLobby: undefined;
  ImpostorGame: { config: any }; // Você pode definir o tipo correto para config conforme necessário;
  OnlineImpostorGame: { config: any };
  OfflineCryptographyGame: { config: any }
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AlertProvider>
      <SocketProvider>
        <PlayersProvider>
          <NavigationContainer>
            <StatusBar
              barStyle="light-content"
              backgroundColor={COLORS.background}
            />

            <Stack.Navigator
              initialRouteName="Splash"
              screenOptions={{
                headerShown: false,
                animation: "fade"
              }}
            >
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="ImpostorLobby" component={ImpostorLobby} />
              <Stack.Screen name="CryptographyLobby" component={CryptographyLobby} />
              <Stack.Screen
                name="OfflineCryptographyGame"
                component={OfflineCryptographyGameScreen}
              />
              <Stack.Screen
                name="ImpostorGame"
                component={OfflineImpostorGameScreen}
              />
              <Stack.Screen
                name="OnlineImpostorGame"
                component={OnlineImpostorGameScreen}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </PlayersProvider>
      </SocketProvider>
    </AlertProvider>
  );
}
