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
import { ImpostorGameScreen } from "@/screens/Impostor/gameScreen/impostorGameScreen";

// Tipagem das rotas
export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  ImpostorLobby: undefined;
  ImpostorGame: { config: any } // Você pode definir o tipo correto para config conforme necessário;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
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
          <Stack.Screen name="ImpostorGame" component={ImpostorGameScreen}/>
        </Stack.Navigator>
      </NavigationContainer>
    </PlayersProvider>
  );
}
