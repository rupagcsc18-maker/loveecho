import React, { createContext, useContext } from "react";
import Toast, { BaseToast } from "react-native-toast-message";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const ToastContext = createContext();

const EchoToast = ({ text1 }) => (
  <LinearGradient
    colors={['#1A1A2E', '#16213E']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.toast}
  >
    <Text style={styles.emoji}>🌙</Text>
    <Text style={styles.text}>{text1}</Text>
  </LinearGradient>
);

const ErrorToast = ({ text1 }) => (
  <View style={styles.errorToast}>
    <Text style={styles.errorEmoji}>⚠️</Text>
    <Text style={styles.errorText}>{text1}</Text>
  </View>
);

export const ToastProvider = ({ children }) => {

  const showSuccess = (text) => {
    Toast.show({
      type: "echo",
      text1: text,
      position: "top",
      visibilityTime: 2200,
    });
  };

  const showError = (text) => {
    Toast.show({
      type: "errorEcho",
      text1: text,
      position: "top",
      visibilityTime: 2600,
    });
  };

  return (
    <ToastContext.Provider value={{ showSuccess, showError }}>
      {children}
      <Toast config={{
        echo: (props) => <EchoToast {...props} />,
        errorEcho: (props) => <ErrorToast {...props} />,
      }} />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  toast: {
    marginTop: 50,
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  emoji: {
    fontSize: 18,
    marginRight: 10,
  },
  text: {
    color: '#EDE7F6',
    fontSize: 14,
    fontWeight: '500',
  },
  errorToast: {
    marginTop: 50,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A1C1C',
  },
  errorEmoji: {
    fontSize: 16,
    marginRight: 10,
  },
  errorText: {
    color: '#FFCDD2',
    fontSize: 14,
  },
});
