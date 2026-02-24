import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { storyService } from './../services/storyService';

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function BookmarksScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBookmarks(); }, []);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const res = await storyService.getMyBookmarks(0, 50);
      setStories(res.data?.content || res.data || []);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => router.push(`/story/view/${item.id}`)}
    >
      {/* User info row */}
      <View style={styles.userInfoRow}>
        <View style={[styles.miniAvatar, item.anonymous && styles.anonymousAvatar]}>
          {item.anonymous ? (
            <Feather name="user-x" size={14} color="#90A4AE" />
          ) : item.user?.profileImageUrl ? (
            <Image source={{ uri: item.user.profileImageUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarLetter}>
              {(item.user?.username || 'U').charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View>
          <Text style={styles.usernameText}>
            {item.anonymous ? 'Anonymous Soul' : (item.user?.username || 'Unknown')}
          </Text>
          <Text style={styles.timestampMini}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
      </View>

      {/* Story content */}
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardSnippet} numberOfLines={2}>{item.content}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Feather name="menu" size={26} color="#1A237E" />
        </TouchableOpacity>
        <Text style={styles.title}>Bookmarks</Text>
        <TouchableOpacity onPress={fetchBookmarks}>
          <Feather name="refresh-cw" size={20} color="#1A237E" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color="#1A237E" />
      ) : (
        <FlatList
          data={stories}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20 }}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="bookmark" size={50} color="#CFD8DC" />
              <Text style={styles.emptyText}>No saved stories yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1A237E' },

  card: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 20,
    marginBottom: 15,
    elevation: 2,
  },

  // User info row
  userInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  miniAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#E8EAF6',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10, overflow: 'hidden',
  },
  anonymousAvatar: { backgroundColor: '#ECEFF1' },
  avatarImage: { width: 34, height: 34, borderRadius: 17 },
  avatarLetter: { fontSize: 14, fontWeight: '700', color: '#1A237E' },
  usernameText: { fontSize: 13, fontWeight: '600', color: '#37474F' },
  timestampMini: { fontSize: 11, color: '#90A4AE', marginTop: 1 },

  // Story content
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1B5E20' },
  cardSnippet: { color: '#546E7A', marginTop: 6, lineHeight: 20 },

  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#90A4AE', marginTop: 10, fontSize: 16 },
});