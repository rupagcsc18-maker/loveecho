import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from './services/api';
import LottieView from 'lottie-react-native';

export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
  const checkLogin = async () => {
    try {
      const token = await restoreAuthToken();

      if (token) {
        router.replace('/(tabs)/home');
        return;
      }

    } catch (e) {
      console.log("Token restore failed", e);
    }

    setChecking(false);
  };

  checkLogin();
}, []);


  // While checking token → show loader
  if (checking) {
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
        <ActivityIndicator size="large"/>
      </View>
    );
  }

  // 👇 Your original welcome UI below
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.animationContainer}>
        <LottieView
          source={require('../assets/welcome.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.brandTitle}>Echory</Text>
        <Text style={styles.description}>
          Share your story, free your heart. A safe space for everything left unsaid.
        </Text>

        <TouchableOpacity 
          style={styles.loginBtn}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.signUpBtn} 
          onPress={() => router.push('/register')}
        >
          <Text style={styles.signUpText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F7F3F0' // Creamy background from logo texture
  },
  animationContainer: { 
    flex: 1.2, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  lottie: { 
    width: '80%', 
    height: '80%' 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 30, 
    alignItems: 'center' 
  },
  welcomeText: { 
    fontSize: 20, 
    color: '#7C5DA3' // Muted Purple from logo accents
  },
  brandTitle: { 
    fontSize: 48, 
    color: '#1A2B56', // Deep Navy from the logo text
    fontWeight: 'bold',
    fontStyle: 'italic', // Added to match the script style of the logo
  },
  description: { 
    textAlign: 'center', 
    color: '#555E78', // Desaturated Navy for readability
    marginBottom: 40, 
    lineHeight: 22 
  },
  loginBtn: { 
    backgroundColor: '#1A2B56', // Primary Navy
    width: '100%', 
    height: 55, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 15,
    // Optional: Subtle shadow for depth
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loginText: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#FFF' 
  },
  signUpBtn: { 
    backgroundColor: 'transparent', 
    width: '100%', 
    height: 55, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: '#26A69A' // Teal/Cyan accent from logo
  },
  signUpText: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#26A69A' 
  },
});