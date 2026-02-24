import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { storyService } from '../../services/storyService';
import  PostOptionsModal  from '../../components/PostOptionsModal';
import { useToast } from '../../context/ToastContext';

export default function PostScreen() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [category, setCategory] = useState('General');
  const [posting, setPosting] = useState(false);
  const [images, setImages] = useState([]); // Array of { uri }

  const categories = ['General', 'Healing', 'Love', 'Heartbreak', 'Motivation', 'Life'];
  const [showOptions, setShowOptions] = useState(false);
  const { showSuccess, showError, showInfo } = useToast();


  // 1. Pick Image Logic
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, // Requires newer Expo versions
      quality: 0.7,
    });

    if (!result.canceled) {
      // result.assets is an array of objects
      setImages([...images, ...result.assets]);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleCategorySelect = (selectedCat) => {
    setCategory(selectedCat);
    const hashtag = `#${selectedCat.toLowerCase()}`;
    if (!content.includes(hashtag)) {
      setContent(prev => {
        const separator = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
        return `${prev}${separator}${hashtag} `;
      });
    }
  };

  const toggleVisibility = () => {
    setVisibility(prev => (prev === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC'));
  };

  const onPressRelease = () => {
    if (!content.trim()) {
      showError('Empty story', 'Please write something before posting');
      return;
    }

    if (visibility === 'PRIVATE') {
      submitPost(false);
    } else {
      setShowOptions(true);
      // Alert.alert(
      //   'Release Story',
      //   'How would you like to share this with the world?',
      //   [
      //     { text: 'Post Publicly', onPress: () => submitPost(false) },
      //     { text: 'Post Anonymously', onPress: () => submitPost(true) },
      //     { text: 'Cancel', style: 'cancel' },
      //   ]
      // );
    }
  };

  const submitPost = async (isAnonymous) => {
  try {
    setPosting(true);

    await storyService.createStory({
      title: title.trim() || 'Unsaid',
      content: content.trim(),
      visibility: visibility,
      category: category.toUpperCase(),
      anonymous: isAnonymous,
      images: images
    });

    // Clear inputs
    setTitle('');
    setContent('');
    setImages([]);

    // 🔥 EchoRy emotional feedback
    showSuccess(
      visibility === 'PRIVATE'
        ? "Saved to your vault 🔒"
        : isAnonymous
        ? "Your echo reached someone 🌙"
        : "Your story is now out in the world ✨"
    );

    router.replace('/(tabs)/explore');

  } catch (error) {
    console.error("Post Error:", error.response?.data || error.message);

    showError(
      error?.response?.data?.message ||
      "Couldn't share your story. Try again."
    );

  } finally {
    setPosting(false);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={26} color="#1A237E" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.postBtn, (!content || posting) && styles.disabled]}
          disabled={!content || posting}
          onPress={onPressRelease}
        >
          {posting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.postText}>
              {visibility === 'PRIVATE' ? 'Save to Vault 🔒' : 'Release'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <TextInput
          style={styles.titleInput}
          placeholder="Give it a title (optional)"
          value={title}
          onChangeText={setTitle}
          maxLength={60}
          placeholderTextColor="#90A4AE"
        />

        <TextInput
          style={styles.bodyInput}
          placeholder="Unleash what's unsaid..."
          multiline
          value={content}
          onChangeText={setContent}
          maxLength={3000}
          placeholderTextColor="#90A4AE"
          textAlignVertical="top"
        />

        {/* 🖼 IMAGE PREVIEW AREA */}
        {images.length > 0 && (
          <ScrollView horizontal style={styles.imagePreviewList} showsHorizontalScrollIndicator={false}>
            {images.map((img, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: img.uri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImgBtn} onPress={() => removeImage(index)}>
                  <Feather name="x-circle" size={20} color="#E53935" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </ScrollView>

      {/* 📂 CATEGORY SELECTION */}
      <View style={styles.categoryContainer}>
        <Text style={styles.categoryLabel}>Select Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => handleCategorySelect(cat)}
              style={[styles.chip, category === cat && styles.activeChip]}
            >
              <Text style={[styles.chipText, category === cat && styles.activeChipText]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.footerContainer}>
        <Text style={styles.hint}>
          {visibility === 'PRIVATE' ? 'Only you can see this' : 'Anyone can see this'}
        </Text>

        <View style={styles.footer}>
          <View style={styles.toolBar}>
            <TouchableOpacity style={styles.tool} onPress={pickImage}>
              <Feather name="image" size={24} color="#FF7043" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.tool} onPress={toggleVisibility}>
              <Feather
                name={visibility === 'PRIVATE' ? 'lock' : 'unlock'}
                size={24}
                color={visibility === 'PRIVATE' ? '#E53935' : '#43A047'}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.charCount}>{content.length}/3000</Text>
        </View>

        <View style={styles.safetyBox}>
          <Feather name="shield" size={14} color="#78909C" />
          <Text style={styles.safetyText}>
            {visibility === 'PRIVATE' ? 'Vaulted.' : 'Shared.'}
          </Text>
        </View>

        {/* 🌙 POST OPTIONS MODAL */}
      <PostOptionsModal
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        onPublic={() => {
          setShowOptions(false);
          submitPost(false);
        }}
        onAnon={() => {
          setShowOptions(false);
          submitPost(true);
        }}
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  postBtn: { backgroundColor: '#FF7043', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 25, minWidth: 100, alignItems: 'center' },
  disabled: { backgroundColor: '#FFD8D6', opacity: 0.6 },
  postText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  titleInput: { fontSize: 20, fontWeight: '600', paddingHorizontal: 30, paddingVertical: 14, color: '#1A237E', borderBottomWidth: 1, borderBottomColor: '#ECEFF1' },
  bodyInput: { paddingHorizontal: 30, paddingVertical: 20, fontSize: 18, color: '#1A237E', lineHeight: 28, minHeight: 200 },
  
  // Image Preview Styles
  imagePreviewList: { paddingLeft: 30, marginBottom: 20 },
  imageContainer: { marginRight: 15, position: 'relative' },
  previewImage: { width: 100, height: 100, borderRadius: 12 },
  removeImgBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: '#FFF', borderRadius: 10 },

  categoryContainer: { paddingVertical: 10, backgroundColor: '#FAFAFA', borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  categoryLabel: { fontSize: 11, fontWeight: '700', color: '#90A4AE', marginLeft: 30, marginBottom: 8, textTransform: 'uppercase' },
  categoryScroll: { paddingHorizontal: 25, paddingBottom: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', marginHorizontal: 5, borderWidth: 1, borderColor: '#ECEFF1' },
  activeChip: { backgroundColor: '#1A237E', borderColor: '#1A237E' },
  chipText: { color: '#546E7A', fontSize: 14, fontWeight: '500' },
  activeChipText: { color: '#FFF', fontWeight: '700' },
  footerContainer: { paddingBottom: 10 },
  hint: { textAlign: 'center', color: '#90A4AE', fontSize: 12, marginBottom: 10 },
  footer: { paddingHorizontal: 30, paddingVertical: 15, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F5F5F5', alignItems: 'center' },
  toolBar: { flexDirection: 'row', alignItems: 'center' },
  tool: { marginRight: 25 },
  charCount: { color: '#CFD8DC', fontSize: 12 },
  safetyBox: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10, gap: 6 },
  safetyText: { color: '#78909C', fontSize: 12, fontWeight: '500' },
});