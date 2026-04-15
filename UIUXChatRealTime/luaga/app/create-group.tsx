import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, StyleSheet, SafeAreaView, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../context/OAuth';
import { NguoiDungDto } from '../Type';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { ids } = useLocalSearchParams<{ ids: string }>(); 
  
  const [groupName, setGroupName] = useState<string>('');
  const [members, setMembers] = useState<NguoiDungDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (ids) fetchMembers(ids.split(','));
  }, [ids]);

  const fetchMembers = async (idArray: string[]) => {
    try {
      const response = await axios.post(
        'https://ungentlemanlike-aspen-electronically.ngrok-free.dev/api/OAuth/users-by-ids',
        { userIds: idArray }
      );
      if (Array.isArray(response.data)) setMembers(response.data);
    } catch (error) { console.error('Lỗi fetch members:', error); }
  };

  const handleConfirmCreate = async () => {
    if (!groupName.trim()) { Alert.alert('Lỗi', 'Chưa nhập tên nhóm!'); return; }
    
    setIsLoading(true);
    try {
      const memIds = ids ? ids.split(',') : [];
      if (user?.id && !memIds.includes(user.id)) memIds.unshift(user.id);

      const response = await axios.post<any>(
        'https://ungentlemanlike-aspen-electronically.ngrok-free.dev/api/Message/create-room',
        { tenPhong: groupName, laNhom: true, memberIds: memIds }
      );
      
      // 🚀 CHỐT CHẶN BÊN TẠO NHÓM
      const finalRoomId = response.data?.roomId || response.data?.RoomId;
      
      if (finalRoomId) {
        router.replace({
          pathname: `/chat/${finalRoomId}` as any,
          params: { name: groupName, isGroup: 'true', memberCount: String(members.length + 1) }
        });
      } else {
        Alert.alert("Lỗi", "Không nhận được ID từ Server khi tạo nhóm.");
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Tạo nhóm thất bại!');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMember = ({ item }: { item: NguoiDungDto }) => (
    <View style={styles.memberItem}>
      <Image source={{ uri: item.anhDaiDien || 'https://ui-avatars.com/api/?name=U' }} style={styles.memberAvatar} />
      <Text style={styles.memberName}>{item.ten}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={26} color="#D4AF37" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo Nhóm Mới</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.configContainer}>
          <View style={styles.inputContainer}>
            <TextInput style={styles.input} placeholder="Tên nhóm..." placeholderTextColor="#888" value={groupName} onChangeText={setGroupName} autoFocus />
          </View>
        </View>

        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Thành viên ({members.length})</Text>
          <FlatList data={members} keyExtractor={item => item.id} renderItem={renderMember} />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.createBtn} onPress={handleConfirmCreate} disabled={isLoading}>
            <Text style={styles.createBtnText}>{isLoading ? 'ĐANG TẠO...' : 'TẠO NHÓM'}</Text>
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