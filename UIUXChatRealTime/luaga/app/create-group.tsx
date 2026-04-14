import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, StyleSheet, SafeAreaView, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAuth } from '../context/OAuth';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { ids } = useLocalSearchParams<{ ids: string }>(); 
  
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('https://ui-avatars.com/api/?name=Group&background=D4AF37&color=fff');
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (ids) {
      fetchMembers(ids.split(','));
    }
  }, [ids]);

  const fetchMembers = async (idArray: string[]) => {
    try {
      const response = await axios.post(
        'https://ungentlemanlike-aspen-electronically.ngrok-free.dev/api/User/lay-thong-tin-users',
        { userIds: idArray },
        { headers: { 'ngrok-skip-browser-warning': 'true' } }
      );
      
      if (Array.isArray(response.data)) {
        setMembers(response.data);
      } else {
        setMembers(idArray.map((id, index) => ({
          id: id,
          ten: `User ${index + 1}`,
          anhDaiDien: 'https://ui-avatars.com/api/?name=U&background=333&color=fff'
        })));
      }
    } catch (error) {
      console.error('Lỗi fetch members:', error);
      setMembers(idArray.map((id, index) => ({
        id: id,
        ten: `User ${index + 1}`,
        anhDaiDien: 'https://ui-avatars.com/api/?name=U&background=333&color=fff'
      })));
    }
  };

  const pickAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) setGroupAvatar(result.assets[0].uri);
  };

  const handleConfirmCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Khoan đã', 'Ông chưa nhập tên nhóm kìa!');
      return;
    }
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('ten', groupName);
      formData.append('nguoiTaoId', user?.id || '');
      formData.append('memberIds', ids || '');
      
      if (groupAvatar && !groupAvatar.startsWith('https://')) {
        formData.append('file', {
          uri: Platform.OS === 'ios' ? groupAvatar.replace('file://', '') : groupAvatar,
          name: 'group.jpg',
          type: 'image/jpeg',
        } as any);
      }
      
      const response = await axios.post(
        'https://ungentlemanlike-aspen-electronically.ngrok-free.dev/api/Chat/tao-nhom',
        formData,
        { 
          headers: { 
            'Content-Type': 'multipart/form-data',
            'ngrok-skip-browser-warning': 'true' 
          } 
        }
      );
      
      if (response.data?.id) {
        Alert.alert('Thành công', 'Tạo nhóm thành công!', [
          { text: 'OK', onPress: () => router.replace(`/chat/${response.data.id}`) }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data || 'Tạo nhóm thất bại!');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMember = ({ item }: { item: any }) => (
    <View style={styles.memberItem}>
      <Image source={{ uri: item.anhDaiDien }} style={styles.memberAvatar} />
      <Text style={styles.memberName}>{item.ten}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#D4AF37" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo Nhóm Mới</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.configContainer}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickAvatar}>
            <Image source={{ uri: groupAvatar }} style={styles.avatar} />
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={16} color="#000" />
            </View>
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="Đặt tên nhóm..." 
              placeholderTextColor="#888" 
              value={groupName} 
              onChangeText={setGroupName} 
              autoFocus
            />
          </View>
        </View>

        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Thành viên ({members.length})</Text>
          <FlatList 
            data={members} 
            keyExtractor={item => item.id} 
            renderItem={renderMember} 
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.createBtn} onPress={handleConfirmCreate} disabled={isLoading}>
            <Text style={styles.createBtnText}>{isLoading ? 'ĐANG TẠO...' : 'TẠO NHÓM'}</Text>
            {!isLoading && <Ionicons name="checkmark-circle-outline" size={20} color="#000" style={{ marginLeft: 8 }} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#1A1A1A' },
  backBtn: { width: 26 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  configContainer: { paddingHorizontal: 30, paddingVertical: 20, alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#D4AF37' },
  cameraIcon: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#D4AF37', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#121212' },
  inputContainer: { width: '100%' },
  input: { backgroundColor: '#1E1E1E', color: '#FFF', borderRadius: 12, paddingHorizontal: 15, height: 50, fontSize: 16, borderWidth: 1, borderColor: '#333' },
  membersSection: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  sectionTitle: { color: '#888', fontSize: 14, marginBottom: 15, fontWeight: '600' },
  memberItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  memberName: { color: '#FFF', fontWeight: '500' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#1E1E1E' },
  createBtn: { backgroundColor: '#D4AF37', borderRadius: 12, height: 55, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  createBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' }
});