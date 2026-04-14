import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAuth } from '../context/OAuth';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, login } = useAuth(); 
  
  const [name, setName] = useState(user?.ten || 'La Tu Thien');
  const [avatar, setAvatar] = useState(user?.anhDaiDien || 'https://ui-avatars.com/api/?name=Thien&background=D4AF37&color=fff');
  const [isLoading, setIsLoading] = useState(false);

  const pickAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], 
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Tên không được để trống!');
      return;
    }
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('id', user?.id || '');
      formData.append('ten', name);
      
      if (avatar && !avatar.startsWith('https://')) {
        formData.append('file', {
          uri: Platform.OS === 'ios' ? avatar.replace('file://', '') : avatar,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        } as any);
      }
      
      const response = await axios.post(
        'https://ungentlemanlike-aspen-electronically.ngrok-free.dev/api/User/cap-nhat-ho-so',
        formData,
        { 
          headers: { 
            'Content-Type': 'multipart/form-data',
            'ngrok-skip-browser-warning': 'true' 
          } 
        }
      );
      
      if (response.data) {
        login(response.data);
        Alert.alert('Thành công', 'Cập nhật hồ sơ thành công!');
        router.back();
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data || 'Cập nhật hồ sơ thất bại!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/Login');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={28} color="#D4AF37" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ sơ của tôi</Text>
        <TouchableOpacity onPress={handleLogout}><Ionicons name="log-out-outline" size={28} color="#FF3B30" /></TouchableOpacity>
      </View>

      <View style={styles.body}>
        <TouchableOpacity style={styles.avatarContainer} onPress={pickAvatar}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={20} color="#000" />
          </View>
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên hiển thị</Text>
          <TextInput 
            style={styles.input} 
            value={name}
            onChangeText={setName}
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput 
            style={[styles.input, { color: '#888', backgroundColor: '#111' }]} 
            value={user?.email || ''}
            editable={false}
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isLoading}>
          <Text style={styles.saveBtnText}>{isLoading ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#1A1A1A' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  body: { padding: 30, alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 40 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#D4AF37' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#D4AF37', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#121212' },
  inputGroup: { width: '100%', marginBottom: 30 },
  label: { color: '#888', marginBottom: 10, fontSize: 14 },
  input: { backgroundColor: '#1E1E1E', color: '#FFF', height: 55, borderRadius: 12, paddingHorizontal: 15, fontSize: 16, borderWidth: 1, borderColor: '#333' },
  saveBtn: { backgroundColor: '#D4AF37', width: '100%', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' }
});