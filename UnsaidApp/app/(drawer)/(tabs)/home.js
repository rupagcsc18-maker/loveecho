import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import userApi from '../../services/userApi';
import { storyService } from '../../services/storyService';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

const categories = [
  { label: 'Healing',    color: '#E8F5E9', icon: 'feather' },
  { label: 'Love',       color: '#FFD8D6', icon: 'heart' },
  { label: 'Heartbreak', color: '#F3E5F5', icon: 'activity' },
  { label: 'Motivation', color: '#FFF3E0', icon: 'zap' },
  { label: 'Life',       color: '#D1E3FF', icon: 'compass' },
  { label: 'Hope',       color: '#E1F5FE', icon: 'sun' },
];

const formatTimeAgo = (date) => {
  if (!date) return 'recent';
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// Small avatar/initial circle for story cards
function AuthorAvatar({ name, imageUrl, size = 28 }) {
  const letter = (name || 'A').charAt(0).toUpperCase();
  const colors = ['#C8E6C9', '#BBDEFB', '#F8BBD0', '#FFE0B2', '#E1BEE7'];
  const bg = colors[letter.charCodeAt(0) % colors.length];

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: bg, justifyContent: 'center', alignItems: 'center'
    }}>
      <Text style={{ fontWeight: '700', color: '#1A237E', fontSize: size * 0.45 }}>{letter}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const lottieRef = useRef(null);

  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trendingStories, setTrendingStories] = useState([]);
  const [mostLikedStories, setMostLikedStories] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    if (!refreshing) setLoading(true);
    try {
      try {
        const userRes = await userApi.getCurrentUser();
        setUsername(userRes?.data?.username || 'Storyteller');
      } catch (e) { setUsername('Storyteller'); }

      const [trendingRes, likedRes] = await Promise.allSettled([
        storyService.getTrendingStories(),
        storyService.getMostLikedStories()
      ]);

      if (trendingRes.status === 'fulfilled') {
        const data = trendingRes.value?.data;
        setTrendingStories(data?.content || data || []);
      }
      if (likedRes.status === 'fulfilled') {
        const data = likedRes.value?.data;
        setMostLikedStories(data?.content || data || []);
      }
    } catch (error) {
      console.error('Home Data Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A237E" />
        }
      >
        {/* ── HEADER ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={styles.iconHitSlop}
          >
            <Feather name="menu" size={24} color="#1A237E" />
          </TouchableOpacity>

          <View style={styles.brandContainer}>
            <Text style={styles.brand}>𝓔𝓬𝓱𝓸𝓻𝔂</Text>
            <View style={styles.lottiePen}>
              <LottieView 
  source={require('../../assets/Ink Pen.json')} 
  autoPlay 
  loop        
  style={{ width: 50, height: 50 }} 
/>
            </View>
          </View>

          <TouchableOpacity
            style={styles.profileIconButton}
            onPress={() => router.push('/profile')}
          >
            <Feather name="user" size={20} color="#1A237E" />
          </TouchableOpacity>
        </View>

        {/* ✅ Improved contrast welcome text */}
        <Text style={styles.welcome}>
          Welcome back{username ? `, ${username}` : ''} 👋
        </Text>

        {/* ── SEARCH BAR ── */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/explore')}
          activeOpacity={0.9}
        >
          <Feather name="search" size={18} color="#78909C" />
          <Text style={styles.searchPlaceholder}>Search for echoes...</Text>
        </TouchableOpacity>

        {/* ── TRENDING ── */}
        {/* ✅ View All added for consistency */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>🔥 Trending Now</Text>
          <TouchableOpacity onPress={() => router.push('/explore')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.trendingScroll}
          snapToInterval={182}
          decelerationRate="fast"
        >
          {trendingStories.length > 0 ? (
            trendingStories.map((story) => (
              <TouchableOpacity
                key={story.id}
                style={styles.trendingCard}
                onPress={() => router.push(`/story/view/${story.id}`)}
              >
                <Text style={styles.trendingTitle} numberOfLines={3}>
                  {story.title}
                </Text>
                <View style={styles.trendingMeta}>
                  <Feather name="trending-up" size={12} color="#81C784" />
                  <Text style={styles.trendingText}>
                    {story.reactionsCount || 0} echoes
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            // ✅ Empty state for trending
            <View style={styles.emptyCard}>
              <Feather name="trending-up" size={28} color="#C5CAE9" />
              <Text style={styles.emptyCardText}>No trending echoes yet.</Text>
            </View>
          )}
        </ScrollView>

        {/* ── CATEGORIES ── */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>Explore Categories</Text>
        <View style={styles.grid}>
          {categories.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.gridItem, { backgroundColor: item.color }]}
              onPress={() =>
                router.push({ pathname: '/category/[name]', params: { name: item.label } })
              }
            >
              <Feather name={item.icon} size={22} color="#1A237E" />
              <Text style={styles.gridLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── COMMUNITY FAVORITES ── */}
        <View style={styles.feedHeader}>
          <Text style={styles.sectionLabel}>🏆 Community Favorites</Text>
          <TouchableOpacity onPress={() => router.push('/explore')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {mostLikedStories.length > 0 ? (
          mostLikedStories.slice(0, 3).map((story) => (
            <TouchableOpacity
              key={story.id}
              style={styles.storyCard}
              onPress={() => router.push(`/story/view/${story.id}`)}
            >
              <View style={styles.storyTop}>
                <Text style={styles.storyTitleCard} numberOfLines={1}>
                  {story.title}
                </Text>
                <View style={styles.likeBadge}>
                  <FontAwesome name="heart" size={10} color="#E53935" />
                  <Text style={styles.likeCountText}>{story.reactionsCount || 0}</Text>
                </View>
              </View>

              <Text style={styles.storySnippet} numberOfLines={2}>
                {story.content}
              </Text>

              {/* ✅ Author row with avatar */}
              <View style={styles.storyMeta}>
                <View style={styles.authorRow}>
                  <AuthorAvatar
                    name={story.authorName || story.user?.username}
                    imageUrl={story.user?.profileImageUrl}
                    size={24}
                  />
                  <Text style={styles.authorName}>
                    @{story.authorName || story.user?.username || 'anonymous'}
                  </Text>
                </View>
                <Text style={styles.storyTime}>{formatTimeAgo(story.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          // ✅ Empty state for community favorites
          <View style={styles.emptyFavorites}>
            <Feather name="award" size={40} color="#C5CAE9" />
            <Text style={styles.emptyFavText}>No community favorites yet.</Text>
            <Text style={styles.emptyFavSub}>Be the first to share your echo!</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F0' },
  scroll: { paddingHorizontal: 20, paddingTop: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Header ──
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginLeft: 15,
  },
  brand: { fontSize: 28, fontWeight: 'bold', color: '#1A237E', fontStyle: 'italic' },
  lottiePen: { width: 50, height: 50 },
  profileIconButton: {
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 50,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconHitSlop: { padding: 5 },

  // ✅ Improved contrast (#607D8B instead of #90A4AE)
  welcome: {
    fontSize: 14,
    color: '#607D8B',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
  },

  // ── Search ──
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 13,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#1A237E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    marginBottom: 25,
  },
  searchPlaceholder: { marginLeft: 10, color: '#90A4AE', fontSize: 15 },

  // ── Section headers ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: { fontSize: 17, fontWeight: '800', color: '#1A237E', marginBottom: 12 },
  viewAllText: { color: '#5C6BC0', fontWeight: '700', fontSize: 13 },

  // ── Trending ──
  trendingScroll: { marginHorizontal: -20, paddingLeft: 20 },
  trendingCard: {
    backgroundColor: '#1A237E',
    width: 170,
    height: 120,      // ✅ taller cards (was 100)
    borderRadius: 20,
    padding: 15,
    marginRight: 12,
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#1A237E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  trendingTitle: { color: '#FFF', fontSize: 14, fontWeight: '700', lineHeight: 20 },
  trendingMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trendingText: { color: '#81C784', fontSize: 11, fontWeight: '700' },

  // ✅ Empty state for trending
  emptyCard: {
    width: width - 40,
    height: 120,
    borderRadius: 20,
    backgroundColor: '#F5F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyCardText: { color: '#9FA8DA', fontWeight: '600', fontSize: 14 },

  // ── Categories grid ──
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: {
    width: '31%',
    height: 90,       // ✅ slightly taller
    borderRadius: 20,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  gridLabel: { marginTop: 6, fontWeight: '700', color: '#1A237E', fontSize: 12 },

  // ── Community Favorites ──
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 12,
  },
  storyCard: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  storyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storyTitleCard: { fontSize: 16, fontWeight: '700', color: '#263238', flex: 1 },
  likeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  likeCountText: { color: '#E53935', fontWeight: '800', fontSize: 11 },
  storySnippet: { fontSize: 13, color: '#607D8B', marginVertical: 8, lineHeight: 18 },
  storyMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },

  // ✅ Author row with avatar
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorName: { fontSize: 11, color: '#5C6BC0', fontWeight: '700' },
  storyTime: { fontSize: 11, color: '#B0BEC5' },

  // ✅ Empty state for community favorites
  emptyFavorites: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 15,
  },
  emptyFavText: { color: '#7986CB', fontWeight: '700', fontSize: 15, marginTop: 12 },
  emptyFavSub: { color: '#B0BEC5', fontSize: 12, marginTop: 4 },
});