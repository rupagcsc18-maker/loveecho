import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  ImageBackground,
  Alert,
  TextInput,
  Dimensions,
  Image,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { storyService } from '../../services/storyService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const backgroundImage = require('../../assets/storyBg.jpg');

// Math: Paper padding is 20 on each side, so container is screen - 40
const CONTAINER_WIDTH = SCREEN_WIDTH - 40;

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const imageScrollRef = useRef(null);
  
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  useEffect(() => {
    if (id) fetchStoryDetails();
  }, [id]);

  const fetchStoryDetails = async () => {
    try {
      setLoading(true);
      const res = await storyService.getStoryById(id); 
      setStory(res.data);
      setEditTitle(res.data.title);
      setEditContent(res.data.content);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onImageScroll = (event) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / CONTAINER_WIDTH);
    if (slide !== currentImgIndex) {
      setCurrentImgIndex(slide);
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Gallery access is needed to add images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const newUris = result.assets.map(asset => asset.uri);
      setStory(prev => ({
        ...prev,
        imageUrls: [...prev.imageUrls, ...newUris]
      }));
    }
  };

  const handleRemoveImage = (index) => {
    Alert.alert("Remove Image", "Delete this image from the story?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => {
          const updatedUrls = story.imageUrls.filter((_, i) => i !== index);
          setStory({ ...story, imageUrls: updatedUrls });
          if (currentImgIndex >= updatedUrls.length && updatedUrls.length > 0) {
            setCurrentImgIndex(updatedUrls.length - 1);
          }
      }}
    ]);
  };

  const handleToggleVisibility = async () => {
    const nextStatus = story.visibility === 'PRIVATE' ? 'Public' : 'Private';
    Alert.alert("Visibility", `Change to ${nextStatus}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: async () => {
          try {
            setIsToggling(true);
            const res = await storyService.toggleVisibility(id);
            setStory(res.data);
          } catch (e) {
            Alert.alert('Error', 'Action failed');
          } finally {
            setIsToggling(false);
          }
      }}
    ]);
  };

  const handleUpdate = async () => {
    try {
      setIsSaving(true);
      // Backend should receive the updated imageUrls array (mix of URLs and local URIs)
      await storyService.editStory(id, { 
        title: editTitle, 
        content: editContent,
        imageUrls: story.imageUrls 
      });
      setIsEditing(false);
      Alert.alert("Success", "Story updated!");
      fetchStoryDetails(); // Refresh to sync Cloudinary URLs
    } catch (error) {
      Alert.alert("Error", "Could not update story");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Story", "This is permanent. Continue?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await storyService.deleteStory(id);
            router.back();
          } catch (e) {
            Alert.alert("Error", "Delete failed");
          }
      }}
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1A237E" /></View>;
  if (!story) return <View style={styles.center}><Text>Story not found</Text></View>;

  const hasImages = Array.isArray(story.imageUrls) && story.imageUrls.length > 0;

  return (
    <ImageBackground source={backgroundImage} style={styles.backgroundImage}>
      <SafeAreaView style={styles.safeArea}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconCircle}>
            <Feather name="arrow-left" size={24} color="#1A237E" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            {!isEditing && (
              <>
                <TouchableOpacity onPress={handleToggleVisibility} style={[styles.iconCircle, {marginRight: 10}]} disabled={isToggling}>
                  {isToggling ? <ActivityIndicator size="small" color="#1A237E" /> : 
                  <Feather name={story.visibility === 'PRIVATE' ? 'lock' : 'globe'} size={20} color={story.visibility === 'PRIVATE' ? '#E53935' : '#43A047'} />}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsEditing(true)} style={[styles.iconCircle, {marginRight: 10}]}>
                  <Feather name="edit-2" size={20} color="#1A237E" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete} style={styles.iconCircle}>
                  <Feather name="trash-2" size={20} color="#E53935" />
                </TouchableOpacity>
              </>
            )}
            {isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.iconCircle}>
                <Feather name="x" size={24} color="#78909C" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.paperEffect}>
            {/* CONTENT AREA */}
            {isEditing ? (
              <>
                <TextInput style={styles.titleInput} value={editTitle} onChangeText={setEditTitle} placeholder="Title" />
                <TextInput style={styles.contentInput} value={editContent} onChangeText={setEditContent} multiline placeholder="Content" />
                <TouchableOpacity style={styles.addImageBtn} onPress={handlePickImage}>
                  <Feather name="image" size={18} color="#1A237E" />
                  <Text style={styles.addImageText}>Add Images</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{story.title}</Text>
                  <View style={[styles.badge, { backgroundColor: story.visibility === 'PRIVATE' ? '#FFEBEE' : '#E8F5E9' }]}>
                    <Text style={[styles.badgeText, { color: story.visibility === 'PRIVATE' ? '#E53935' : '#43A047' }]}>{story.visibility}</Text>
                  </View>
                </View>
                <Text style={styles.date}>{new Date(story.createdAt).toLocaleDateString()}</Text>
                <View style={styles.divider} />
                <Text style={styles.storyContent}>{story.content}</Text>
              </>
            )}

            {/* GALLERY AREA (BELOW CONTENT) */}
            {hasImages && (
              <View style={styles.galleryContainer}>
                <ScrollView
                  ref={imageScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={onImageScroll}
                  scrollEventThrottle={16}
                  snapToInterval={CONTAINER_WIDTH}
                  decelerationRate="fast"
                >
                  {story.imageUrls.map((url, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <TouchableOpacity 
                        activeOpacity={isEditing ? 0.7 : 1} 
                        onPress={() => isEditing && handleRemoveImage(index)}
                        style={{flex: 1}}
                      >
                        <Image source={{ uri: url }} style={styles.image} />
                        {isEditing && (
                          <View style={styles.removeOverlay}>
                            <MaterialIcons name="cancel" size={42} color="rgba(255, 255, 255, 0.9)" />
                            <Text style={styles.removeText}>Tap to Remove</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
                {story.imageUrls.length > 1 && (
                  <View style={styles.pagination}>
                    {story.imageUrls.map((_, i) => (
                      <View key={i} style={[styles.dot, currentImgIndex === i && styles.activeDot]} />
                    ))}
                  </View>
                )}
              </View>
            )}

            {isEditing && (
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1 },
  safeArea: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { backgroundColor: 'rgba(255,255,255,0.8)', padding: 8, borderRadius: 20, justifyContent: 'center', alignItems: 'center', minWidth: 40 },
  scrollContent: { padding: 20 },
  paperEffect: { backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 15, padding: 20, minHeight: 480 },
  
  // Content Styles
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1A237E', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginLeft: 10 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  date: { fontSize: 12, color: '#78909C', marginVertical: 5 },
  divider: { height: 1, backgroundColor: '#DDD', marginVertical: 15 },
  storyContent: { fontSize: 17, lineHeight: 26, color: '#333', fontStyle: 'italic' },
  
  // Editing Styles
  titleInput: { fontSize: 22, fontWeight: 'bold', borderBottomWidth: 1, borderColor: '#CCC', marginBottom: 15, padding: 5 },
  contentInput: { fontSize: 16, minHeight: 150, textAlignVertical: 'top' },
  addImageBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#1A237E', borderStyle: 'dashed', marginTop: 10 },
  addImageText: { marginLeft: 8, color: '#1A237E', fontWeight: 'bold', fontSize: 13 },
  saveBtn: { backgroundColor: '#1A237E', padding: 15, borderRadius: 10, marginTop: 25, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold' },

  // Gallery Styles
  galleryContainer: { width: '100%', height: 260, marginTop: 30, borderRadius: 12, overflow: 'hidden', backgroundColor: '#111' },
  imageWrapper: { width: CONTAINER_WIDTH, height: 260 },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  removeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginTop: 8 },
  pagination: { flexDirection: 'row', position: 'absolute', bottom: 12, alignSelf: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 3 },
  activeDot: { backgroundColor: '#FFF', width: 14 }
});