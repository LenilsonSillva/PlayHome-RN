import React, { useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, Animated, Dimensions, Easing } from 'react-native';
import { COLORS } from '@/styles/theme';

const { width, height } = Dimensions.get('window');

// Configurações para facilitar o ajuste do visual
const METEOR_COUNT = 10;
const MIN_DURATION = 2000;
const MAX_DURATION = 4500;

interface MeteorProps {
  index: number;
}

const MeteorItem = ({ index }: MeteorProps) => {
  // Valores animados individuais
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Geramos valores aleatórios para cada meteoro usando useMemo para não mudar no re-render
  const config = useMemo(() => ({
    // Posição inicial: pode começar em qualquer lugar no topo ou na direita
    startPos: {
      x: Math.random() * (width + 200),
      y: -100,
    },
    // Tamanho aleatório (alguns longos e finos, outros curtos e brilhantes)
    size: {
      w: 1 + Math.random() * 2,
      h: 60 + Math.random() * 100,
    },
    opacity: 0.1 + Math.random() * 0.5,
    delay: index * 800 + Math.random() * 4000, // Escalonar a entrada deles
  }), [index]);

  const startAnimation = useCallback(() => {
    animatedValue.setValue(0);
    
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: Math.random() * (MAX_DURATION - MIN_DURATION) + MIN_DURATION,
      easing: Easing.linear,
      useNativeDriver: true,
      delay: Math.random() * 3000, // Espera aleatória entre quedas
    }).start(() => startAnimation());
  }, [animatedValue]);

  useEffect(() => {
    startAnimation();
  }, [startAnimation]);

  // Interpolação do movimento diagonal (Caindo da direita para a esquerda)
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [config.startPos.x, config.startPos.x - width - 400],
  });

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [config.startPos.y, height + 200],
  });

  const scale = animatedValue.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 1, 1, 0], // Surge suave e some suave
  });

  return (
    <Animated.View
      style={[
        styles.meteor,
        {
          width: config.size.w,
          height: config.size.h,
          opacity: config.opacity,
          transform: [
            { translateX },
            { translateY },
            { scaleY: scale },
            { rotate: '35deg' }, // Ângulo de queda
          ],
        },
      ]}
    >
      {/* Cabeça do meteoro (ponto mais brilhante) */}
      <View style={styles.meteorHead} />
    </Animated.View>
  );
};

export const MeteorBackground = () => {
  return (
    <View style={styles.container}>
      {/* Adicionamos uma camada de estrelas estáticas ao fundo para dar profundidade */}
      {[...Array(30)].map((_, i) => (
        <View 
          key={`star-${i}`} 
          style={[
            styles.star, 
            { 
              top: Math.random() * height, 
              left: Math.random() * width,
              opacity: Math.random() * 0.5
            }
          ]} 
        />
      ))}
      
      {/* Chuva de Meteoros */}
      {[...Array(METEOR_COUNT)].map((_, i) => (
        <MeteorItem key={`meteor-${i}`} index={i} />
      ))}
    </View>
  );
};

// Precisamos importar o useCallback para a animação recursiva
import { useCallback } from 'react';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#FFF',
    borderRadius: 1,
  },
  meteor: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 99,
  },
  meteorHead: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 4,
    backgroundColor: COLORS.cyan,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  }
});