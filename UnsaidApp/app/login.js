import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import userApi from './services/userApi';
import { setAuthToken } from './services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons'; // Added for the eye icon


export default function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // New state to toggle password visibility
  const [showPassword, setShowPassword] = useState(false);

 const handleLogin = async () => {
  if (!identifier || !password) {
    Alert.alert('Missing fields', 'Please enter credentials');
    return;
  }

  try {
    setLoading(true);

    const response = await userApi.login(
      identifier.trim(),
      password.trim()
    );

    const { token } = response.data;

    // ✅ ONLY THIS (stores + attaches header)
    await setAuthToken(token);

    router.replace('/(tabs)/home');

  } catch (error) {
    Alert.alert(
      'Login Failed',
      error.response?.data?.error || 'Invalid username/email or password'
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Logo Section */}
          <View style={styles.topSection}>
            <Image
              source={require('../assets/appicon.png')}
              style={styles.logo}
            />
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Please sign in to continue</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email or Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your identifier"
                placeholderTextColor="#94A3B8"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
              />
            </View>

            {/* Password Input with Eye Toggle */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, { paddingRight: 55 }]} // Space for the icon
                  secureTextEntry={!showPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={22} 
                    color="#78909C" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.loginButtonWrapper} 
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={['#8E2DE2', '#4A00E0']}
                style={styles.mainBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.mainBtnText}>
                  {loading ? 'Logging in...' : 'Log In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/register')}
              style={styles.footer}
            >
              <Text style={styles.footerText}>
                Don't have an account?{' '}
                <Text style={styles.signUpLink}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  topSection: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A237E',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#78909C',
    textAlign: 'center',
    marginBottom: 40,
    marginTop: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: 8,
    marginLeft: 5,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 55,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#1A237E',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    padding: 10,
  },
  loginButtonWrapper: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#4A00E0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mainBtn: {
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    color: '#78909C',
    fontSize: 15,
  },
  signUpLink: {
    color: '#8E2DE2',
    fontWeight: 'bold',
  },
});