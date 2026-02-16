import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS } from '../../styles/theme';
import { CustomText } from '../../styles/customText';
import { RootStackParamList } from 'App';

// Tipando as props da tela
type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export const SplashScreen = ({ navigation }: Props) => {
  
  useEffect(() => {
    // Timer para navegar para a Home após 3 segundos
    const timer = setTimeout(() => {
      // .replace não permite voltar para a Splash pelo botão "voltar" do Android
      navigation.replace('Home');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <CustomText variant="h1">
        PLAY
        <CustomText variant="h1" style={{ color: COLORS.textSecondary }}>
          HOME
        </CustomText>
      </CustomText>
      
      <ActivityIndicator 
        color={COLORS.cyan} 
        size="large" 
        style={{ marginTop: 20 }} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});