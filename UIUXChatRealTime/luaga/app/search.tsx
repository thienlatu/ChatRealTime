import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../context/OAuth';
import { NguoiDungDto } from '../Type';

export default function SearchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [search, setSearch] = useState('');
  const [usersList, setUsersList] = useState<NguoiDungDto[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]); 
  
  // 🚀 Cơ chế Telegram: Nút bật tắt chế độ tạo nhóm
  const [isGroupMode, setIsGroupMode] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (search.trim().length > 0 && user?.id) {
        try {
          const res = await axios.get(
            `https://ungentlemanlike-aspen-electronically.ngrok-free.dev/api/User/tim-kiem`, 
            {
              params: { tuKhoa: search, nguoiGoiId: user.id },
              headers: { 'ngrok-skip-browser-warning': 'true' }
            }
          );
          setUsersList(res.data);
        } catch (error) {
          console.error("Lỗi tìm kiếm:", error);
        }
      } else {
        setUsersList([]);
      }
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [search, user?.id]);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };


  const handleUserClick = async (targetUserId: string) => {
    if (isGroupMode) {
      toggleSelect(targetUserId); 
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(
        'https://ungentlemanlike-aspen-electronically.ngrok-free.dev/api/Chat/tao-phong-1-1', 
        { nguoiTaoId: user?.id, nguoiNhanId: targetUserId },
        { headers: { 'ngrok-skip-browser-warning': 'true' } }
      );
      
      // Lấy được ID Phòng (PhongChatId) thật sự rồi mới vào phòng
      router.replace(`/chat/${res.data.phongChatId}`);
    } catch (e) {
      Alert.alert("Lỗi", "Không thể bắt đầu cuộc trò chuyện. Hãy chắc chắn Backend C# đã có API tao-phong-1-1.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextToCreateGroup = () => {
    if (selectedIds.length === 0) return;
    router.push({ 
      pathname: '/create-group', 
      params: { ids: selectedIds.join(',') } 
    });
  };
  //test

  const renderUser = ({ item }: { item: NguoiDungDto }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity style={styles.userItem} onPress={() => handleUserClick(item.id)} activeOpacity={0.7}>
        <Image source={{ uri: item.anhDaiDien || 'https://ui-avatars.com/api/?name=User' }} style={styles.avatar} />
        <Text style={styles.userName}>{item.ten}</Text>
        {isGroupMode && (
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Ionicons name="checkmark" size={16} color="#000" />}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Nút Back quay lại hoặc hủy chế độ tạo nhóm */}
        <TouchableOpacity onPress={() => isGroupMode ? setIsGroupMode(false) : router.back()}>
          <Ionicons name="arrow-back" size={28} color="#D4AF37" />
        </TouchableOpacity>
        
        {isGroupMode ? (
          <Text style={styles.headerTitle}>Chọn thành viên mới</Text>
        ) : (
          <TextInput 
            style={styles.searchInput} 
            placeholder="Tìm kiếm theo tên hoặc email..." 
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        )}
      </View>

      {isLoading && <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 20 }} />}

      {/* 🚀 NÚT TẠO NHÓM THEO CHUẨN TELEGRAM */}
      {!isGroupMode && !search && (
        <TouchableOpacity style={styles.newGroupBtn} onPress={() => setIsGroupMode(true)} activeOpacity={0.7}>
          <View style={styles.newGroupIcon}>
            <Ionicons name="people" size={22} color="#121212" />
          </View>
          <Text style={styles.newGroupText}>Tạo nhóm mới</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={usersList}
        keyExtractor={item => item.id}
        renderItem={renderUser}
      />

      {/* 🚀 NÚT CHUYỂN TIẾP CHO TẠO NHÓM NỔI Ở GÓC DƯỚI */}
      {isGroupMode && selectedIds.length > 0 && (
        <TouchableOpacity style={styles.fabBtn} onPress={handleNextToCreateGroup}>
          <Ionicons name="arrow-forward" size={28} color="#000" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingTop: 50, backgroundColor: '#1A1A1A' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 15, flex: 1 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 16, marginLeft: 15, backgroundColor: '#2A2A2A', padding: 10, borderRadius: 10 },
  
  newGroupBtn: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  newGroupIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#D4AF37', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  newGroupText: { color: '#D4AF37', fontSize: 17, fontWeight: 'bold' },

  userItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  avatar: { width: 46, height: 46, borderRadius: 23, marginRight: 15 },
  userName: { color: '#FFF', fontSize: 16, flex: 1 },
  
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#888', justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  
  fabBtn: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#D4AF37', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
});