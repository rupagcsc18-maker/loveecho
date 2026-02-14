import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  ImageBackground,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { storyService } from '../../services/storyService';
import userApi from '../../services/userApi';
import HashtagText from '../../components/HashtagText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Screen Width - Screen Margins (16*2) - Card Padding (20*2)
const IMAGE_WIDTH = SCREEN_WIDTH - 72; 

const backgroundImage = require('../../assets/storyBg2.png');

const formatTimeAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const imageScrollRef = useRef(null);
  const inputRef = useRef(null);
  
  const [story, setStory] = useState(null);
  const [comments, setComments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState({});

  useEffect(() => {
    init();
  }, [id]);

  const init = async () => {
    try {
      setLoading(true);
      const [storyRes, userRes] = await Promise.all([
        storyService.getStoryById(id),
        userApi.getCurrentUser().catch(() => ({ data: null }))
      ]);
      
      setStory(storyRes.data);
      setCurrentUser(userRes.data);
      
      // Load comments from response if present, else fetch
      if (storyRes.data.comments) {
        setComments(storyRes.data.comments);
      } else {
        const commentRes = await storyService.getComments(id, 0, 50);
        setComments(commentRes.data?.content || []);
      }
    } catch (error) {
      console.error("Init Error:", error);
      Alert.alert("Error", "Could not load story details.");
    } finally {
      setLoading(false);
    }
  };

  const scrollImages = (direction) => {
    const nextIndex = direction === 'next' ? currentImgIndex + 1 : currentImgIndex - 1;
    if (nextIndex >= 0 && nextIndex < (story?.imageUrls?.length || 0)) {
      imageScrollRef.current?.scrollTo({
        x: nextIndex * IMAGE_WIDTH,
        animated: true
      });
      setCurrentImgIndex(nextIndex);
    }
  };

  const onImageScroll = (event) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / IMAGE_WIDTH);
    if (slide !== currentImgIndex && slide >= 0) {
      setCurrentImgIndex(slide);
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) return Alert.alert("Login Required", "Please log in.");
    const isBookmarked = story.isBookmarked;
    setStory({ ...story, isBookmarked: !isBookmarked });
    try {
      await storyService.toggleBookmark(id);
    } catch (e) {
      setStory({ ...story, isBookmarked: isBookmarked });
    }
  };

  const handleLike = async () => {
    if (!currentUser) return Alert.alert("Login Required", "Please log in.");
    const isLiked = story.hasReacted;
    setStory({
      ...story,
      hasReacted: !isLiked,
      reactionsCount: isLiked ? story.reactionsCount - 1 : story.reactionsCount + 1
    });
    try {
      await storyService.reactToStory(id, 'LIKE');
    } catch (e) { init(); }
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await storyService.addComment(id, commentText, replyingTo?.id);
      
      const newComment = {
        id: Date.now().toString(),
        text: replyingTo ? `@${replyingTo.username} ${commentText}` : commentText,
        username: currentUser.username,
        profileImageUrl: currentUser.profileImageUrl,
        createdAt: new Date().toISOString(),
        isReply: !!replyingTo
      };

      setComments(prev => [newComment, ...prev]);
      setCommentText('');
      setReplyingTo(null);
      Keyboard.dismiss();
    } catch (e) {
      Alert.alert("Error", "Failed to post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2D4F1E" /></View>;
  if (!story) return <View style={styles.center}><Text>Story not found</Text></View>;

  const hasImages = Array.isArray(story.imageUrls) && story.imageUrls.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={backgroundImage} style={styles.backgroundImage} resizeMode="cover">
        <View style={styles.tintOverlay} />
        
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconCircle}>
              <Feather name="arrow-left" size={22} color="#444" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Story Echo</Text>
            <TouchableOpacity onPress={handleBookmark} style={styles.iconCircle}>
              <FontAwesome 
                name={story.isBookmarked ? "bookmark" : "bookmark-o"} 
                size={20} 
                color={story.isBookmarked ? "#1E88E5" : "#444"} 
              />
            </TouchableOpacity>
          </View>

          <ScrollView 
            ref={scrollViewRef} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.contentCard}>
              <View style={styles.userSection}>
                <View style={[styles.avatar, story.anonymous && styles.anonymousAvatar]}>
                  {story.anonymous ? (
                    <Feather name="user-x" size={20} color="#90A4AE" />
                  ) : (
                    <Image source={{ uri: story.user?.profileImageUrl }} style={styles.avatarImage} />
                  )}
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.username}>{story.anonymous ? 'Anonymous' : story.user?.username}</Text>
                  <Text style={styles.date}>{formatTimeAgo(story.createdAt)}</Text>
                </View>
              </View>

              <Text style={styles.title}>{story.title}</Text>
              
              <HashtagText text={story.content} style={styles.contentBody} />

              {/* IMAGE GALLERY */}
              {hasImages && (
                <View style={styles.galleryWrapper}>
                  <ScrollView
                    ref={imageScrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={onImageScroll}
                    scrollEventThrottle={16}
                    decelerationRate="fast"
                    snapToInterval={IMAGE_WIDTH}
                  >
                    {story.imageUrls.map((url, index) => (
                      <View key={`${url}-${index}`} style={styles.imageContainer}>
                        <Image 
                          source={{ uri: url }} 
                          style={styles.storyImage} 
                          onLoad={() => setLoadedImages(prev => ({...prev, [index]: true}))}
                        />
                        {!loadedImages[index] && (
                          <View style={styles.imageLoader}>
                            <ActivityIndicator color="#2D4F1E" />
                          </View>
                        )}
                      </View>
                    ))}
                  </ScrollView>

                  {currentImgIndex > 0 && (
                    <TouchableOpacity 
                      style={[styles.navArrow, styles.leftArrow]} 
                      onPress={() => scrollImages('prev')}
                    >
                      <Feather name="chevron-left" size={24} color="#FFF" />
                    </TouchableOpacity>
                  )}

                  {currentImgIndex < story.imageUrls.length - 1 && (
                    <TouchableOpacity 
                      style={[styles.navArrow, styles.rightArrow]} 
                      onPress={() => scrollImages('next')}
                    >
                      <Feather name="chevron-right" size={24} color="#FFF" />
                    </TouchableOpacity>
                  )}

                  {story.imageUrls.length > 1 && (
                    <View style={styles.paginationRow}>
                      {story.imageUrls.map((_, i) => (
                        <View 
                          key={`dot-${i}`} 
                          style={[styles.dot, currentImgIndex === i && styles.activeDot]} 
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <FontAwesome name="heart" size={14} color="#E53935" />
                  <Text style={styles.statText}>{story.reactionsCount || 0}</Text>
                </View>
                <Text style={styles.statText}>{comments.length} echoes</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.inlineActionRow}>
                <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                  <FontAwesome name={story.hasReacted ? "heart" : "heart-o"} size={18} color={story.hasReacted ? "#E53935" : "#555"} />
                  <Text style={[styles.actionButtonText, story.hasReacted && {color: "#E53935"}]}>Like</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => inputRef.current?.focus()}>
                  <Feather name="message-circle" size={18} color="#555" />
                  <Text style={styles.actionButtonText}>Echo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleBookmark}>
                   <FontAwesome name={story.isBookmarked ? "bookmark" : "bookmark-o"} size={17} color={story.isBookmarked ? "#1E88E5" : "#555"} />
                   <Text style={[styles.actionButtonText, story.isBookmarked && {color: "#1E88E5"}]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.commentSectionTitle}>Community Echoes</Text>
            
            {comments.map((item, index) => (
              <View key={item.id || index} style={[styles.commentItem, item.isReply && { marginLeft: 40 }]}>
                <Image source={{ uri: item.profileImageUrl }} style={styles.commentAvatar} />
                <View style={styles.commentBubble}>
                  <Text style={styles.commentUser}>{item.username}</Text>
                  <Text style={styles.commentText}>{item.text}</Text>
                  <TouchableOpacity onPress={() => {setReplyingTo(item); inputRef.current?.focus();}} style={styles.replyButton}>
                    <Text style={styles.replyButtonText}>Reply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* FIXED INPUT AREA */}
          <View style={styles.footer}>
            {replyingTo && (
              <View style={styles.replyingBar}>
                <Text style={styles.replyingText}>Replying to <Text style={{fontWeight: '700'}}>{replyingTo.username}</Text></Text>
                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                  <Feather name="x-circle" size={18} color="#90A4AE" />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.commentInputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Share your thoughts..."
                placeholderTextColor="#90A4AE"
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity style={styles.sendButton} onPress={handlePostComment} disabled={!commentText.trim()}>
                <MaterialCommunityIcons name="send" size={22} color={commentText.trim() ? "#FFF" : "#B0BEC5"} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF5E6' },
  backgroundImage: { flex: 1 },
  tintOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(253, 245, 230, 0.2)' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    height: 60,
    backgroundColor: 'rgba(253, 245, 230, 0.9)', 
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#2D4F1E' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16 },
  contentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    padding: 20, 
    borderRadius: 24,
    elevation: 4,
    marginBottom: 25,
  },
  userSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', overflow: 'hidden', borderWidth: 1, borderColor: '#EEE' },
  avatarImage: { width: '100%', height: '100%' },
  userInfo: { marginLeft: 12 },
  username: { fontSize: 14, fontWeight: '700', color: '#333' },
  date: { fontSize: 11, color: '#90A4AE', marginTop: 2 },
  title: { fontSize: 22, fontWeight: '800', color: '#2D4F1E', marginBottom: 10 },
  galleryWrapper: {
    marginTop: 15,
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    height: 300,
    width: '100%',
    backgroundColor: '#F5F5F5',
  },
  imageContainer: {
    width: IMAGE_WIDTH,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5'
  },
  storyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  imageLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center'
  },
  navArrow: {
    position: 'absolute',
    top: '45%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  leftArrow: { left: 10 },
  rightArrow: { right: 10 },
  paginationRow: {
    position: 'absolute',
    bottom: 15,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  activeDot: { backgroundColor: '#FFF', width: 12 },
  contentBody: { fontSize: 16, color: '#444', lineHeight: 26 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 13, fontWeight: '600', color: '#78909C' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 15 },
  inlineActionRow: { flexDirection: 'row', justifyContent: 'space-around' },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  actionButtonText: { fontSize: 13, fontWeight: '700', color: '#555' },
  commentSectionTitle: { fontSize: 15, fontWeight: '800', color: '#2D4F1E', marginLeft: 5, marginBottom: 15 },
  commentItem: { flexDirection: 'row', marginBottom: 16, gap: 12 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEE' },
  commentBubble: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: 12, borderRadius: 18, borderTopLeftRadius: 2, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  commentUser: { fontWeight: '700', fontSize: 13, color: '#333' },
  commentText: { fontSize: 14, color: '#555', marginTop: 2 },
  replyButton: { marginTop: 6 },
  replyButtonText: { fontSize: 11, fontWeight: '800', color: '#78909C' },
  footer: { padding: 12, backgroundColor: 'rgba(253, 245, 230, 0.95)', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  replyingBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 8, backgroundColor: '#F5F5F5', borderRadius: 10, marginBottom: 8 },
  replyingText: { fontSize: 12, color: '#666' },
  commentInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, backgroundColor: '#FFF', borderRadius: 25, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  sendButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#2D4F1E', justifyContent: 'center', alignItems: 'center' }
});