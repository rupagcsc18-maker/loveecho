import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import userApi from './services/userApi';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons'; // Icon library included in Expo

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // New state for password visibility
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await userApi.register({ username, email, password });
      Alert.alert('Success', 'Account created successfully!');
      router.push('/login');
    } catch (error) {
  console.log("REGISTER ERROR:", error);
  console.log("REGISTER RESPONSE:", error?.response);
  console.log("REGISTER DATA:", error?.response?.data);

  let message = "Unknown error";

  if (error.response) {
    // Server responded
    message = error.response?.data?.error || "Server rejected request";
  } 
  else if (error.request) {
    // Request sent but no response
    message = "Cannot reach server (network / https / sleep)";
  } 
  else {
    // Something else
    message = error.message;
  }

  Alert.alert("Registration Failed", message);
}
  }

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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the Echory community</Text>

            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Choose a unique username"
                placeholderTextColor="#94A3B8"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input with Eye Icon */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, { paddingRight: 50 }]} // Extra padding for the icon
                  secureTextEntry={!showPassword}
                  placeholder="Create a strong password"
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

            {/* Gradient Sign Up Button */}
            <TouchableOpacity 
              style={styles.btnWrapper} 
              onPress={handleRegister}
              disabled={loading}
            >
              <LinearGradient
                colors={['#8E2DE2', '#4A00E0']}
                style={styles.mainBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.mainBtnText}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/login')}
              style={styles.footer}
            >
              <Text style={styles.footerText}>
                Already have an account?{' '}
                <Text style={styles.loginLink}>Log In</Text>
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
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  logo: {
    width: 180,
    height: 180,
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
    marginBottom: 30,
    marginTop: 5,
  },
  inputContainer: {
    marginBottom: 18,
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
    width: '100%',
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
    padding: 5,
  },
  btnWrapper: {
    marginTop: 15,
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
    marginTop: 25,
    alignItems: 'center',
  },
  footerText: {
    color: '#78909C',
    fontSize: 15,
  },
  loginLink: {
    color: '#8E2DE2',
    fontWeight: 'bold',
  },
});