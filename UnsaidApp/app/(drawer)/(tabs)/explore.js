import React, { useState, useRef, memo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  Keyboard,
} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { storyService } from '../../services/storyService';
import userApi from '../../services/userApi';
import HashtagText from '../../components/HashtagText';
import { useRouter } from 'expo-router';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════
//  DESIGN TOKENS — Warm Cream Palette (matches app vibe)
// ═══════════════════════════════════════════════════════════
const C = {
  // Backgrounds
  bg:           '#FFFBF5',   // warm cream (matches app bg)
  cardBg:       '#FFFFFF',   // pure white cards
  surfaceWarm:  '#FFF8EE',   // warm tinted surface
  surfaceMuted: '#F5F0E8',   // muted warm surface

  // Brand
  navy:         '#1A237E',   // primary navy (matches app)
  navyLight:    '#283593',   // slightly lighter navy
  navyMuted:    '#E8EAF6',   // navy tint background

  // Accents
  green:        '#1B5E20',   // story title green (from original)
  greenSoft:    '#E8F5E9',   // soft green bg
  red:          '#E53935',   // heart / like red
  redSoft:      '#FFEBEE',   // soft red bg
  amber:        '#F59E0B',   // hashtag amber/gold
  amberSoft:    '#FFFBEB',   // soft amber bg

  // Text
  textPrimary:  '#1C2340',   // near-black with navy tint
  textSecondary:'#455A64',   // standard body text (from original)
  textMuted:    '#90A4AE',   // muted grey (from original)
  textLight:    '#B0BEC5',   // very light

  // Borders & Dividers
  border:       '#EDE8DF',   // warm grey border
  borderStrong: '#D4CFC7',   // stronger warm border

  white: '#FFFFFF',
};

// ─── HELPERS ───────────────────────────────────────────────
const formatTimeAgo = (date) => {
  if (!date) return '';
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ─── AVATAR COMPONENT ──────────────────────────────────────
const Avatar = ({ user, anonymous, size = 38, style }) => {
  const r = size / 2;
  if (anonymous) {
    return (
      <View style={[{ width: size, height: size, borderRadius: r, backgroundColor: C.navyMuted, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#C5CAE9' }, style]}>
        <Text style={{ fontSize: size * 0.38, color: C.navy }}>✦</Text>
      </View>
    );
  }
  if (user?.profileImageUrl) {
    return (
      <View style={[{ width: size, height: size, borderRadius: r, overflow: 'hidden', borderWidth: 1.5, borderColor: C.navy }, style]}>
        <Image source={{ uri: user.profileImageUrl }} style={{ width: '100%', height: '100%' }} />
      </View>
    );
  }
  return (
    <View style={[{ width: size, height: size, borderRadius: r, backgroundColor: C.navyMuted, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: C.navy }, style]}>
      <Text style={{ fontSize: size * 0.38, fontWeight: '800', color: C.navy }}>
        {(user?.username || 'U').charAt(0).toUpperCase()}
      </Text>
    </View>
  );
};

// ─── STORY CARD ────────────────────────────────────────────
const StoryItem = memo(({ story, onLike, onOpenComments, onOpenMenu, router }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loadingMap, setLoadingMap] = useState({});
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const galleryRef = useRef(null);

  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const likeScale = useSharedValue(1);

  const TEXT_LIMIT = 180;
  const shouldShowReadMore = story.content?.length > TEXT_LIMIT;
  const hasImages = story.imageUrls?.length > 0;
  const cardContentWidth = SCREEN_WIDTH - 64; // 16 margin * 2 + 16 padding * 2

  const animatedHeart = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  const animatedLikeBtn = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const handlePressLike = () => {
    // Big heart overlay
    heartScale.value = withSequence(withSpring(1.2, { damping: 8 }), withTiming(0, { duration: 350 }));
    heartOpacity.value = withSequence(withTiming(1, { duration: 80 }), withTiming(0, { duration: 350 }));
    // Button bounce
    likeScale.value = withSequence(withSpring(1.35, { damping: 6 }), withSpring(1, { damping: 10 }));
    onLike(story.id);
  };

  const scrollToImage = (index) => {
    galleryRef.current?.scrollTo({ x: index * cardContentWidth, animated: true });
    setCurrentImgIndex(index);
  };

  return (
    <View style={styles.card}>
      {/* Heart overlay */}
      <Animated.View style={[styles.heartOverlay, animatedHeart]} pointerEvents="none">
        <FontAwesome name="heart" size={72} color={C.red} />
      </Animated.View>

      <TouchableOpacity activeOpacity={0.88} onPress={() => router.push(`/story/view/${story.id}`)}>
        {/* ── User Row ── */}
        <View style={styles.userRow}>
          <Avatar user={story.user} anonymous={story.anonymous} size={38} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.username}>
              {story.anonymous ? 'Anonymous Soul' : (story.user?.username || 'Unknown')}
            </Text>
            <Text style={styles.timestamp}>{formatTimeAgo(story.createdAt)}</Text>
          </View>
          {/* Tag pill showing post type */}
          {story.anonymous && (
            <View style={styles.anonPill}>
              <Text style={styles.anonPillText}>anon</Text>
            </View>
          )}
          <TouchableOpacity
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.moreBtn}
            onPress={(e) => { e.stopPropagation(); onOpenMenu(story); }}
          >
            <Feather name="more-horizontal" size={20} color={C.textLight} />
          </TouchableOpacity>
        </View>

        {/* ── Title ── */}
        <Text style={styles.title}>{story.title}</Text>

        {/* ── Body Text ── */}
        <HashtagText
          text={isExpanded || !shouldShowReadMore
            ? story.content
            : `${story.content?.slice(0, TEXT_LIMIT)}...`}
          style={styles.body}
          hashtagStyle={styles.hashtag}
          onPressHashtag={(tag) => router.push(`/hashtag/${tag}`)}
        />
        {shouldShowReadMore && (
          <TouchableOpacity onPress={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
            <Text style={styles.readMore}>{isExpanded ? '↑ Show less' : '↓ Read more'}</Text>
          </TouchableOpacity>
        )}

        {/* ── Image Gallery ── */}
        {hasImages && (
          <View style={styles.gallery}>
            <ScrollView
              ref={galleryRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / cardContentWidth);
                setCurrentImgIndex(idx);
              }}
            >
              {story.imageUrls.map((url, i) => (
                <View key={i} style={[styles.imgWrapper, { width: cardContentWidth }]}>
                  {loadingMap[i] !== false && (
                    <ActivityIndicator style={StyleSheet.absoluteFill} color={C.navy} />
                  )}
                  <Image
                    source={{ uri: url }}
                    style={styles.storyImg}
                    resizeMode="cover"
                    onLoad={() => setLoadingMap(p => ({ ...p, [i]: false }))}
                    onError={() => setLoadingMap(p => ({ ...p, [i]: false }))}
                  />
                </View>
              ))}
            </ScrollView>

            {/* Arrow nav */}
            {currentImgIndex > 0 && (
              <TouchableOpacity style={[styles.arrow, styles.arrowLeft]} onPress={() => scrollToImage(currentImgIndex - 1)}>
                <Feather name="chevron-left" size={16} color={C.white} />
              </TouchableOpacity>
            )}
            {currentImgIndex < story.imageUrls.length - 1 && (
              <TouchableOpacity style={[styles.arrow, styles.arrowRight]} onPress={() => scrollToImage(currentImgIndex + 1)}>
                <Feather name="chevron-right" size={16} color={C.white} />
              </TouchableOpacity>
            )}

            {/* Dot indicators */}
            {story.imageUrls.length > 1 && (
              <View style={styles.dots}>
                {story.imageUrls.map((_, i) => (
                  <View key={i} style={[styles.dot, i === currentImgIndex && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Action Row ── */}
      <View style={styles.actionRow}>
        {/* Like */}
        <Animated.View style={animatedLikeBtn}>
          <TouchableOpacity style={styles.actionBtn} onPress={handlePressLike} activeOpacity={0.7}>
            <View style={[styles.actionIconWrap, story.hasReacted && styles.actionIconWrapActive]}>
              <FontAwesome
                name={story.hasReacted ? 'heart' : 'heart-o'}
                size={17}
                color={story.hasReacted ? C.red : C.textSecondary}
              />
            </View>
            <Text style={[styles.actionLabel, story.hasReacted && { color: C.red, fontWeight: '700' }]}>
              {story.reactionsCount || 0}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Comment */}
        <TouchableOpacity style={styles.actionBtn} onPress={() => onOpenComments(story.id)} activeOpacity={0.7}>
          <View style={styles.actionIconWrap}>
            <Feather name="message-circle" size={17} color={C.textSecondary} />
          </View>
          <Text style={styles.actionLabel}>{story.comments?.length || 0}</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        {/* Timestamp on right */}
        <Text style={styles.cardTimestamp}>{formatTimeAgo(story.createdAt)}</Text>
      </View>
    </View>
  );
});

// ─── EMPTY STATE ───────────────────────────────────────────
const EmptyState = () => (
  <View style={styles.emptyWrap}>
    <Text style={styles.emptyIcon}>📭</Text>
    <Text style={styles.emptyTitle}>No echoes yet</Text>
    <Text style={styles.emptyBody}>Be the first to share something unsaid.</Text>
  </View>
);

// ─── MAIN SCREEN ───────────────────────────────────────────
export default function ExploreScreen() {
  const router = useRouter();
  const [stories, setStories] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuTargetStory, setMenuTargetStory] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [viewAllModalVisible, setViewAllModalVisible] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState(null);
  const [activeComments, setActiveComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeSort, setActiveSort] = useState('Recent');
  const [activeCategory, setActiveCategory] = useState(null);

  const SORT_OPTIONS = ['Recent', 'Trending', 'Following'];
  const CATEGORY_OPTIONS = [
    { label: 'Healing', emoji: '🌿' },
    { label: 'Love', emoji: '❤️' },
    { label: 'Heartbreak', emoji: '💔' },
    { label: 'Motivation', emoji: '⚡' },
    { label: 'Life', emoji: '🌀' },
    { label: 'Hope', emoji: '🌅' },
    { label: 'Anger', emoji: '🔥' },
    { label: 'Joy', emoji: '✨' },
  ];

  React.useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const res = await userApi.getCurrentUser();
      setCurrentUser(res.data);
    } catch (e) {}
    finally { loadStories(0); }
  };

  const loadStories = async (pageToLoad = 0, query = searchQuery) => {
    if (loading || loadingMore || (!hasMore && pageToLoad !== 0)) return;
    pageToLoad === 0 ? setRefreshing(true) : setLoadingMore(true);
    try {
      const res = query.trim().length > 0
        ? await storyService.searchStories(query, pageToLoad, PAGE_SIZE)
        : await storyService.getStories(pageToLoad, PAGE_SIZE);
      const data = res.data.content || [];
      setStories(prev => pageToLoad === 0 ? data : [...prev, ...data]);
      setHasMore(!res.data.last);
      setPage(pageToLoad);
    } catch (e) {
      console.error('Failed to load stories', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleLike = async (storyId) => {
    if (!currentUser) { Alert.alert('Login required', 'Please sign in to like ❤️'); return; }
    setStories(prev => prev.map(s =>
      s.id === storyId
        ? { ...s, hasReacted: !s.hasReacted, reactionsCount: s.hasReacted ? s.reactionsCount - 1 : s.reactionsCount + 1 }
        : s
    ));
    try { await storyService.reactToStory(storyId, 'LIKE'); }
    catch (e) { loadStories(page); }
  };

  const handleBookmark = async () => {
    if (!currentUser || !menuTargetStory) return;
    const was = menuTargetStory.isBookmarked;
    try {
      await storyService.toggleBookmark(menuTargetStory.id);
      setStories(prev => prev.map(s => s.id === menuTargetStory.id ? { ...s, isBookmarked: !was } : s));
      setMenuVisible(false);
    } catch (e) { Alert.alert('Error', 'Could not update bookmark.'); }
  };

  const openCommentsSheet = async (storyId) => {
    setSelectedStoryId(storyId);
    setViewAllModalVisible(true);
    setActiveComments([]);
    try {
      const res = await storyService.getComments(storyId, 0, 20);
      setActiveComments(res.data?.content || []);
    } catch (e) {}
  };

  const submitComment = async () => {
    if (!commentText.trim() || !currentUser) return;
    setSubmitting(true);
    try {
      const res = await storyService.addComment(selectedStoryId, commentText);
      const c = {
        id: res.data?.id || Date.now().toString(),
        userId: currentUser.username,
        text: commentText,
        createdAt: new Date().toISOString(),
        username: currentUser.username,
        profileImageUrl: currentUser.profileImageUrl,
      };
      setActiveComments(prev => [...prev, c]);
      setStories(prev => prev.map(s =>
        s.id === selectedStoryId ? { ...s, comments: [...(s.comments || []), c] } : s
      ));
      setCommentText('');
      Keyboard.dismiss();
    } catch (e) {
      Alert.alert('Error', 'Unable to post comment');
    } finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* ══ HEADER ══════════════════════════════════════════ */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Unsaid</Text>
          <Text style={styles.screenSub}>what's echoing today?</Text>
        </View>
        <TouchableOpacity style={[styles.filterBtn, (activeSort !== 'Recent' || activeCategory) && styles.filterBtnActive]} onPress={() => setFilterVisible(true)}>
          <Feather name="sliders" size={18} color={(activeSort !== 'Recent' || activeCategory) ? C.white : C.navy} />
          {(activeSort !== 'Recent' || activeCategory) && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* ══ SEARCH ══════════════════════════════════════════ */}
      <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
        <Feather name="search" size={17} color={searchFocused ? C.navy : C.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search echoes..."
          placeholderTextColor={C.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          onSubmitEditing={() => loadStories(0)}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); loadStories(0, ''); }}>
            <View style={styles.clearBtn}>
              <Feather name="x" size={12} color={C.white} />
            </View>
          </TouchableOpacity>
        )}
      </View>



      {/* ══ FEED ════════════════════════════════════════════ */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 4 }}
        onScroll={({ nativeEvent }) => {
          const near = nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >= nativeEvent.contentSize.height - 120;
          if (near && hasMore && !loadingMore) loadStories(page + 1);
        }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadStories(0)}
            tintColor={C.navy}
            colors={[C.navy]}
          />
        }
      >
        {loading && page === 0 ? (
          <ActivityIndicator size="large" color={C.navy} style={{ marginTop: 60 }} />
        ) : stories.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {stories.map(s => (
              <StoryItem
                key={s.id}
                story={s}
                onLike={handleLike}
                onOpenComments={openCommentsSheet}
                onOpenMenu={(st) => { setMenuTargetStory(st); setMenuVisible(true); }}
                router={router}
              />
            ))}
            {loadingMore && <ActivityIndicator size="small" color={C.navy} style={{ margin: 20 }} />}
            {!hasMore && stories.length > 0 && (
              <View style={styles.endWrap}>
                <View style={styles.endLine} />
                <Text style={styles.endText}>all caught up</Text>
                <View style={styles.endLine} />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ══ MENU MODAL ══════════════════════════════════════ */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuCard}>
            <View style={styles.menuHandle} />
            <TouchableOpacity style={styles.menuRow} onPress={handleBookmark}>
              <View style={[styles.menuIconCircle, { backgroundColor: C.navyMuted }]}>
                <FontAwesome name={menuTargetStory?.isBookmarked ? 'bookmark' : 'bookmark-o'} size={14} color={C.navy} />
              </View>
              <Text style={styles.menuLabel}>{menuTargetStory?.isBookmarked ? 'Remove bookmark' : 'Save story'}</Text>
              <Feather name="chevron-right" size={14} color={C.textLight} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuRow} onPress={() => { setMenuVisible(false); Alert.alert('Reported', 'Thanks for keeping Unsaid safe.'); }}>
              <View style={[styles.menuIconCircle, { backgroundColor: C.redSoft }]}>
                <Feather name="flag" size={14} color={C.red} />
              </View>
              <Text style={[styles.menuLabel, { color: C.red }]}>Report</Text>
              <Feather name="chevron-right" size={14} color={C.textLight} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ══ COMMENTS SHEET ══════════════════════════════════ */}
      <Modal visible={viewAllModalVisible} animationType="slide" transparent>
        <View style={styles.sheetBackdrop}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setViewAllModalVisible(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
            style={styles.sheet}
          >
            <View style={styles.sheetHandle} />

            {/* Sheet header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>💬 Echoes</Text>
              <TouchableOpacity onPress={() => setViewAllModalVisible(false)} style={styles.sheetClose}>
                <Feather name="x" size={16} color={C.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {activeComments.length === 0 && (
                <View style={styles.emptyComments}>
                  <Text style={{ fontSize: 28 }}>🌿</Text>
                  <Text style={styles.emptyCommentsText}>No echoes yet — add yours</Text>
                </View>
              )}
              {activeComments.map((c, i) => (
                <View key={c.id || i} style={styles.commentItem}>
                  <Avatar user={{ username: c.username, profileImageUrl: c.profileImageUrl }} size={34} />
                  <View style={[styles.commentBubble, { marginLeft: 10 }]}>
                    <View style={styles.commentMeta}>
                      <Text style={styles.commentUser}>{c.username || 'User'}</Text>
                      <Text style={styles.commentTime}>{formatTimeAgo(c.createdAt)}</Text>
                    </View>
                    <Text style={styles.commentText}>{c.text || c.content}</Text>
                  </View>
                </View>
              ))}
              <View style={{ height: 16 }} />
            </ScrollView>

            {/* Comment input */}
            <View style={styles.inputRow}>
              <Avatar
                user={{ username: currentUser?.username, profileImageUrl: currentUser?.profileImageUrl }}
                size={30}
              />
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add an echo..."
                  placeholderTextColor={C.textMuted}
                  value={commentText}
                  onChangeText={setCommentText}
                />
                <TouchableOpacity
                  onPress={submitComment}
                  disabled={submitting || !commentText.trim()}
                  style={[styles.sendBtn, (!commentText.trim()) && { opacity: 0.4 }]}
                >
                  {submitting
                    ? <ActivityIndicator size="small" color={C.white} />
                    : <Feather name="send" size={14} color={C.white} />
                  }
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      {/* ══ FILTER PANEL ════════════════════════════════════ */}
      <Modal visible={filterVisible} animationType="slide" transparent>
        <View style={styles.sheetBackdrop}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setFilterVisible(false)} />
          <View style={[styles.sheet, { height: 'auto', paddingBottom: Platform.OS === 'ios' ? 32 : 24 }]}>
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>🎛️ Filter & Sort</Text>
              <TouchableOpacity
                onPress={() => { setActiveSort('Recent'); setActiveCategory(null); }}
                style={styles.resetBtn}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>

            {/* Sort section */}
            <Text style={styles.filterSectionLabel}>Sort by</Text>
            <View style={styles.filterChipRow}>
              {SORT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.filterChip, activeSort === opt && styles.filterChipActive]}
                  onPress={() => setActiveSort(opt)}
                >
                  <Text style={[styles.filterChipText, activeSort === opt && styles.filterChipTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category section */}
            <Text style={[styles.filterSectionLabel, { marginTop: 20 }]}>Category</Text>
            <View style={styles.filterCategoryGrid}>
              {CATEGORY_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.filterCategoryChip, activeCategory === opt.label && styles.filterChipActive]}
                  onPress={() => setActiveCategory(activeCategory === opt.label ? null : opt.label)}
                >
                  <Text style={styles.filterCategoryEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.filterChipText, activeCategory === opt.label && styles.filterChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Apply button */}
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => { setFilterVisible(false); loadStories(0); }}
            >
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════
const styles = StyleSheet.create({

  // ── Layout
  container:    { flex: 1, backgroundColor: C.bg },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  screenTitle:  { fontSize: 28, fontWeight: '900', color: C.navy, letterSpacing: -0.5 },
  screenSub:    { fontSize: 12, color: C.textMuted, marginTop: 1, fontStyle: 'italic' },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: C.navyMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C5CAE9',
  },
  filterBtnActive: { backgroundColor: C.navy, borderColor: C.navy },
  filterDot: {
    position: 'absolute',
    top: 7, right: 7, width: 7, height: 7,
    borderRadius: 4, backgroundColor: C.amber,
    borderWidth: 1.5, borderColor: C.bg,
  },

  // ── Filter panel
  filterSectionLabel: {
    fontSize: 12, fontWeight: '700', color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  filterChipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterCategoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20,
    backgroundColor: C.surfaceMuted, borderWidth: 1.5, borderColor: C.border,
  },
  filterCategoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    backgroundColor: C.surfaceMuted, borderWidth: 1.5, borderColor: C.border,
  },
  filterCategoryEmoji: { fontSize: 14 },
  filterChipActive:    { backgroundColor: C.navy, borderColor: C.navy },
  filterChipText:      { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  filterChipTextActive:{ color: C.white },
  applyBtn: {
    marginTop: 24, backgroundColor: C.navy,
    borderRadius: 16, paddingVertical: 15, alignItems: 'center',
  },
  applyBtnText: { fontSize: 15, fontWeight: '800', color: C.white, letterSpacing: 0.3 },

  // ── Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: C.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1.5,
    borderColor: C.border,
    gap: 10,
    // shadow
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchBarFocused: {
    borderColor: C.navy,
    shadowOpacity: 0.08,
  },
  searchInput:  { flex: 1, fontSize: 15, color: C.textPrimary },
  clearBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Card
  card: {
    backgroundColor: C.cardBg,
    marginHorizontal: 16,
    marginVertical: 7,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#1A237E',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  // ── User row
  userRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  username:     { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  timestamp:    { fontSize: 11, color: C.textMuted, marginTop: 1 },
  anonPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: C.navyMuted,
    marginRight: 8,
  },
  anonPillText: { fontSize: 10, fontWeight: '700', color: C.navy, textTransform: 'uppercase', letterSpacing: 0.5 },
  moreBtn:      { padding: 4 },

  // ── Content
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: C.green,
    marginBottom: 8,
    letterSpacing: -0.2,
    lineHeight: 26,
  },
  body: {
    fontSize: 15,
    color: C.textSecondary,
    lineHeight: 23,
    marginBottom: 8,
  },
  hashtag:      { color: C.amber, fontWeight: '700' },
  readMore:     { color: C.navy, fontSize: 13, fontWeight: '700', marginTop: 2, marginBottom: 10 },

  // ── Gallery
  gallery: {
    marginTop: 8,
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: C.surfaceMuted,
    position: 'relative',
  },
  imgWrapper:   { height: 260, position: 'relative', justifyContent: 'center', alignItems: 'center', backgroundColor: C.surfaceMuted },
  storyImg:     { position: 'absolute', width: '100%', height: '100%' },
  arrow: {
    position: 'absolute',
    top: '42%',
    backgroundColor: 'rgba(26,35,126,0.6)',
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  arrowLeft:    { left: 10 },
  arrowRight:   { right: 10 },
  dots:         { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot:          { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive:    { backgroundColor: C.white, width: 14 },

  // ── Divider
  divider:      { height: 1, backgroundColor: C.border, marginTop: 4, marginBottom: 12 },

  // ── Actions
  actionRow:    { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 7 },
  actionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconWrapActive: { backgroundColor: C.redSoft },
  actionLabel:  { fontSize: 14, color: C.textSecondary, fontWeight: '600' },
  cardTimestamp:{ fontSize: 11, color: C.textLight, fontStyle: 'italic' },

  // ── Heart overlay
  heartOverlay: { position: 'absolute', top: '22%', left: '34%', zIndex: 99 },

  // ── Empty state
  emptyWrap:    { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyIcon:    { fontSize: 48, marginBottom: 16 },
  emptyTitle:   { fontSize: 20, fontWeight: '800', color: C.textPrimary, marginBottom: 8 },
  emptyBody:    { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22 },

  // ── End of feed
  endWrap:      { flexDirection: 'row', alignItems: 'center', marginVertical: 28, paddingHorizontal: 24, gap: 12 },
  endLine:      { flex: 1, height: 1, backgroundColor: C.border },
  endText:      { fontSize: 11, color: C.textLight, fontStyle: 'italic', letterSpacing: 0.5 },

  // ── Menu modal
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(26,35,126,0.12)', justifyContent: 'center', alignItems: 'center' },
  menuCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    width: 240,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  menuHandle:   { width: 32, height: 3, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  menuRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, gap: 12 },
  menuIconCircle: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel:    { fontSize: 14, fontWeight: '600', color: C.textPrimary, flex: 1 },
  menuDivider:  { height: 1, backgroundColor: C.border, marginHorizontal: 16 },

  // ── Comments sheet
  sheetBackdrop:{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: SCREEN_HEIGHT * 0.8,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: C.border,
  },
  sheetHandle:  { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sheetTitle:   { fontSize: 17, fontWeight: '800', color: C.textPrimary },
  sheetClose: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: C.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyComments:{ alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyCommentsText: { fontSize: 14, color: C.textMuted },

  // Comment item
  commentItem:  { flexDirection: 'row', marginBottom: 16 },
  commentBubble:{ flex: 1, backgroundColor: C.white, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border },
  commentMeta:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  commentUser:  { fontSize: 13, fontWeight: '700', color: C.textPrimary },
  commentTime:  { fontSize: 11, color: C.textMuted },
  commentText:  { fontSize: 14, color: C.textSecondary, lineHeight: 21 },

  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 6 : 12,
  },
  inputWrap:    { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 24, borderWidth: 1.5, borderColor: C.border, paddingLeft: 16, paddingRight: 6, height: 46 },
  commentInput: { flex: 1, fontSize: 14, color: C.textPrimary },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
});