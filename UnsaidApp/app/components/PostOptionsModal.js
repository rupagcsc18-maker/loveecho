import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PostOptionsModal({ visible, onClose, onPublic, onAnon }) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="fade" transparent>
      
      {/* Background */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Bottom Sheet */}
      <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
        
        <View style={styles.handle} />

        <Text style={styles.title}>Release Story 🌙</Text>
        <Text style={styles.subtitle}>How would you like to share this with the world?</Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={onPublic}>
          <Text style={styles.primaryText}>Post Publicly</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={onAnon}>
          <Text style={styles.secondaryText}>Post Anonymously</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },

  handle: {
    width: 45,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    alignSelf: 'center',
    marginBottom: 12,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1A237E',
  },

  subtitle: {
    textAlign: 'center',
    color: '#78909C',
    marginBottom: 22,
    marginTop: 4,
  },

  primaryBtn: {
    backgroundColor: '#4A00E0',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },

  primaryText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },

  secondaryBtn: {
    backgroundColor: '#F1F5FF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 10,
  },

  secondaryText: {
    color: '#4A00E0',
    fontWeight: '600',
    fontSize: 16,
  },

  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },

  cancelText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 15,
  },
});
