import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

// Services
import userApi from './services/userApi';
import { storyService } from './services/storyService';

export default function ProfileScreen() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Bio States
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [isSavingBio, setIsSavingBio] = useState(false);

  const [privateStories, setPrivateStories] = useState([]);
  const [publicStories, setPublicStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchStories()]);
    setLoading(false);
  };

  const fetchProfile = async () => {
    try {
      const res = await userApi.getCurrentUser();
      setUser(res.data);
      setBioText(res.data.bio || ''); // Initialize bio from server
    } catch (error) {
      console.error('Failed to fetch user', error);
    }
  };

  const fetchStories = async () => {
    try {
      setStoriesLoading(true);
      const [privRes, pubRes] = await Promise.all([
        storyService.getMyPrivateStories(),
        storyService.getMyPublicStories(),
      ]);
      
      setPrivateStories(privRes.data?.content || privRes.data || []);
      setPublicStories(pubRes.data?.content || pubRes.data || []);
    } catch (error) {
      console.error('Failed to fetch stories', error);
    } finally {
      setStoriesLoading(false);
    }
  };

  // --- BIO HANDLER ---
  const handleSaveBio = async () => {
    if (bioText.length > 150) {
        Alert.alert("Too long", "Bio must be under 150 characters.");
        return;
    }
    try {
      setIsSavingBio(true);
      await userApi.updateBio(bioText);
      setUser(prev => ({ ...prev, bio: bioText }));
      setIsEditingBio(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update bio. Please try again.');
    } finally {
      setIsSavingBio(false);
    }
  };

  // --- PROFILE PIC HANDLERS ---
  const handleChangeProfilePic = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow gallery access');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      setUploading(true);
      const imageUri = result.assets[0].uri;
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
        name: filename,
        type: type,
      });

      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        'http://10.0.2.2:8080/api/users/me/profile-picture',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setUser(prev => ({ ...prev, profileImageUrl: data.profileImageUrl }));
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error) {
      Alert.alert('Upload Failed', 'Network error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProfilePic = () => {
    Alert.alert('Remove photo', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            setUploading(true);
            await userApi.removeProfilePicture();
            setUser(prev => ({ ...prev, profileImageUrl: null }));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete image');
          } finally {
            setUploading(false);
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['token', 'username']);
          router.replace('/login');
        },
      },
    ]);
  };

  const renderStoryList = (stories, type) => {
    const isPrivate = type === 'PRIVATE';
    const themeColor = isPrivate ? '#1A237E' : '#2E7D32';
    const bgColor = isPrivate ? '#F0F4FF' : '#E8F5E9';

    if (storiesLoading) return <ActivityIndicator size="small" color={themeColor} style={{ margin: 20 }} />;
    
    if (stories.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Feather name={isPrivate ? "eye-off" : "globe"} size={30} color="#CFD8DC" />
          <Text style={styles.emptyStateText}>No {type.toLowerCase()} stories found.</Text>
        </View>
      );
    }

    return stories.map((story) => (
      <TouchableOpacity 
        key={story.id} 
        style={styles.storyCard}
        onPress={() => router.push(`/story/edit/${story.id}`)}
      >
        <View style={[styles.storyIconContainer, { backgroundColor: bgColor }]}>
           <Feather name={isPrivate ? "lock" : "file-text"} size={18} color={themeColor} />
        </View>
        <View style={styles.storyInfo}>
          <View style={styles.titleRowInline}>
            <Text style={styles.storyTitleText} numberOfLines={1}>{story.title}</Text>
            {!isPrivate && story.anonymous && (
              <View style={styles.anonBadge}>
                <Text style={styles.anonBadgeText}>Anonymous</Text>
              </View>
            )}
          </View>
          <Text style={styles.storyDate}>{new Date(story.createdAt).toLocaleDateString()}</Text>
        </View>
        <Feather name="chevron-right" size={20} color="#CFD8DC" />
      </TouchableOpacity>
    ));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A237E" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#1A237E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Feather name="log-out" size={24} color="#E53935" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <TouchableOpacity 
            style={styles.avatarLarge} 
            onPress={handleChangeProfilePic} 
            disabled={uploading}
          >
            {user?.profileImageUrl ? (
              <Image source={{ uri: user.profileImageUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase() || 'U'}</Text>
            )}
            
            <View style={styles.cameraIcon}>
              {uploading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Feather name="camera" size={16} color="#FFF" />
              )}
            </View>
          </TouchableOpacity>

          {user?.profileImageUrl && (
            <TouchableOpacity style={styles.removePicBtn} onPress={handleDeleteProfilePic}>
              <Text style={styles.removePicText}>Remove photo</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.username}>@{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          {/* BIO SECTION */}
          <View style={styles.bioContainer}>
            {isEditingBio ? (
              <View style={styles.bioEditWrapper}>
                <TextInput
                  style={styles.bioInput}
                  value={bioText}
                  onChangeText={setBioText}
                  placeholder="Tell the world your story..."
                  multiline
                  maxLength={150}
                  autoFocus
                />
                <View style={styles.bioActionRow}>
                    <TouchableOpacity onPress={() => {
                        setBioText(user?.bio || '');
                        setIsEditingBio(false);
                    }}>
                        <Text style={styles.bioCancelBtn}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSaveBio} disabled={isSavingBio}>
                        {isSavingBio ? (
                            <ActivityIndicator size="small" color="#1A237E" />
                        ) : (
                            <Text style={styles.bioSaveBtn}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.bioDisplayRow} 
                onPress={() => setIsEditingBio(true)}
              >
                <Text style={[styles.bioText, !user?.bio && styles.bioPlaceholder]}>
                  {user?.bio || "Add a bio..."}
                </Text>
                <Feather name="edit-3" size={14} color="#78909C" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{user?.storiesCount ?? 0}</Text>
            <Text style={styles.statLabel}>Stories</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{user?.followersCount ?? 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={() => router.push('/edit-profile')}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* VAULT SECTION */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleRow}>
              <Feather name="lock" size={18} color="#1A237E" />
              <Text style={styles.sectionTitle}>Vault (Private)</Text>
            </View>
            <TouchableOpacity onPress={fetchStories}>
              <Feather name="refresh-cw" size={16} color="#78909C" />
            </TouchableOpacity>
          </View>
          {renderStoryList(privateStories, 'PRIVATE')}
        </View>

        {/* PUBLIC STORIES SECTION */}
        <View style={[styles.sectionContainer, { marginTop: 20, marginBottom: 40 }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleRow}>
              <Feather name="globe" size={18} color="#2E7D32" />
              <Text style={[styles.sectionTitle, { color: '#2E7D32' }]}>Released Stories</Text>
            </View>
          </View>
          {renderStoryList(publicStories, 'PUBLIC')}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F0' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A237E' },
  content: { alignItems: 'center', padding: 20 },
  profileCard: { alignItems: 'center', marginBottom: 20, width: '100%' },
  avatarLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#D1E3FF', justifyContent: 'center', alignItems: 'center', marginBottom: 10, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 40, fontWeight: 'bold', color: '#1A237E' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1A237E', padding: 6, borderRadius: 20 },
  removePicBtn: { marginBottom: 10 },
  removePicText: { color: '#E53935', fontSize: 14, fontWeight: '600' },
  username: { fontSize: 24, fontWeight: 'bold', color: '#1A237E' },
  email: { fontSize: 16, color: '#78909C', marginTop: 5 },
  
  // Bio Styles
  bioContainer: { marginTop: 15, width: '100%', alignItems: 'center', paddingHorizontal: 20 },
  bioDisplayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  bioText: { fontSize: 14, color: '#455A64', textAlign: 'center', lineHeight: 20 },
  bioPlaceholder: { color: '#CFD8DC', fontStyle: 'italic' },
  bioEditWrapper: { width: '100%', backgroundColor: '#FFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  bioInput: { fontSize: 14, color: '#333', minHeight: 60, textAlignVertical: 'top' },
  bioActionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 15 },
  bioCancelBtn: { color: '#78909C', fontWeight: '500' },
  bioSaveBtn: { color: '#1A237E', fontWeight: 'bold' },

  statsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginVertical: 15 },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#1A237E' },
  statLabel: { color: '#78909C' },
  editButton: { backgroundColor: '#1A237E', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 25, marginBottom: 30 },
  editButtonText: { color: '#FFF', fontWeight: 'bold' },
  sectionContainer: { width: '100%', backgroundColor: '#FFF', borderRadius: 20, padding: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  titleRowInline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A237E', marginLeft: 8 },
  storyCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  storyIconContainer: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  storyInfo: { flex: 1 },
  storyTitleText: { fontSize: 16, fontWeight: '600', color: '#333', maxWidth: '70%' },
  storyDate: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyStateText: { color: '#78909C', marginTop: 8, fontSize: 13 },
  anonBadge: { backgroundColor: '#ECEFF1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  anonBadgeText: { fontSize: 10, color: '#78909C', fontWeight: 'bold' }
});