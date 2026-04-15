import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../context/OAuth';
import { NguoiDungDto } from '../Type';

const formatLastSeen = (dateString?: string): string => {
  if (!dateString) return 'Chưa rõ';
  let lastSeen = new Date(dateString);
  if (isNaN(lastSeen.getTime())) {
    lastSeen = new Date(dateString + 'Z'); 
    if (isNaN(lastSeen.getTime())) return 'Chưa rõ';
  }
  const diffInMinutes = Math.floor((new Date().getTime() - lastSeen.getTime()) / 60000);
  if (diffInMinutes < 1) return 'Vừa truy cập';
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
  return lastSeen.toLocaleDateString('vi-VN');
};

const getValidAvatar = (url?: string) => {
  if (!url) return 'https://ui-avatars.com/api/?name=U';
  if (url.startsWith('http') || url.startsWith('data:image')) return url;
  return 'https://ui-avatars.com/api/?name=U';
};

export default function SearchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [search, setSearch] = useState<string>('');
  const [usersList, setUsersList] = useState<NguoiDungDto[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]); 
  const [isGroupMode, setIsGroupMode] = useState<boolean>(false); 
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (user?.id) {
        try {
          // Gửi chữ lên C#, rỗng thì gửi rỗng, gõ gì gửi đó.
          const res = await axios.get<NguoiDungDto[]>(
            `https://ungentlemanlike-aspen-electronically.ngrok-free.dev/api/OAuth/search-users`, 
            { params: { tuKhoa: search.trim(), nguoiGoiId: user.id } }
          );
          setUsersList(res.data);
        } catch (error) { 
          console.error("Lỗi:", error); 
        }
      }
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [search, user?.id]);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(item => item !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleUserClick = async (targetUser: NguoiDungDto) => {
    if (isGroupMode) { 
      // 🚀 NẾU ĐANG TẠO NHÓM: Bấm vào là TICK XANH để chọn nhiều người
      toggleSelect(targetUser.id); 
      return; 
    }

    // NẾU LÀ TÌM KIẾM BÌNH THƯỜNG: Bấm vào là gọi C# tạo phòng chat 1-1
    setIsLoading(true);
    try {
      const res = await axios.get<any>(
        `https://ungentlemanlike-aspen-electronically.ngrok-free.dev/api/Message/get-private-room/${targetUser.id}/${user?.id}`
      );
      
      const finalRoomId = res.data.roomId || res.data.RoomId;
      if (!finalRoomId) {
        Alert.alert("Lỗi", "Server không trả về ID phòng chat hợp lệ.");
        return;
      }

      router.replace({
        pathname: `/chat/${finalRoomId}` as any,
        params: { name: targetUser.ten, avatar: targetUser.anhDaiDien, isGroup: 'false', isOnline: String(targetUser.dangOnline), lastSeen: targetUser.lanCuoiOnline || '' }
      });
    } catch {
      Alert.alert("Lỗi", "Không thể bắt đầu cuộc trò chuyện.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderUser = ({ item }: { item: NguoiDungDto }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity style={styles.userItem} onPress={() => handleUserClick(item)} activeOpacity={0.7}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: getValidAvatar(item.anhDaiDien) }} style={styles.avatar} />
          {item.dangOnline && <View style={styles.onlineDot} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{item.ten}</Text>
          <Text style={styles.statusText}>{item.dangOnline ? 'Đang hoạt động' : `Hoạt động ${formatLastSeen(item.lanCuoiOnline)}`}</Text>
        </View>
        
        {/* 🚀 HIỆN TICK XANH CHO NHỮNG NGƯỜI ĐƯỢC CHỌN VÀO NHÓM */}
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
        <TouchableOpacity onPress={() => isGroupMode ? setIsGroupMode(false) : router.back()}>
          <Ionicons name="arrow-back" size={28} color="#D4AF37" />
        </TouchableOpacity>
        
        {/* 🚀 CHỖ FIX NGU: KHÔNG ĐƯỢC GIẤU THANH TÌM KIẾM ĐI NỮA! */}
        <TextInput 
          style={styles.searchInput} 
          placeholder={isGroupMode ? "Gõ tên để thêm vào nhóm..." : "Tìm kiếm tên, email..."} 
          placeholderTextColor="#888" 
          value={search} 
          onChangeText={setSearch} 
          autoFocus 
        />
      </View>

      {isLoading && <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 20 }} />}
      
      {/* 🚀 NÚT TẠO NHÓM CHỈ HIỆN KHI ĐANG Ở CHẾ ĐỘ TÌM KIẾM BÌNH THƯỜNG MÀ Ô TÌM KIẾM RỖNG */}
      {!isGroupMode && !search && (
        <TouchableOpacity style={styles.newGroupBtn} onPress={() => setIsGroupMode(true)} activeOpacity={0.7}>
          <View style={styles.newGroupIcon}><Ionicons name="people" size={22} color="#121212" /></View>
          <Text style={styles.newGroupText}>Tạo nhóm mới</Text>
        </TouchableOpacity>
      )}

      {/* DANH SÁCH SẼ NỔI LÊN KHI ÔNG GÕ CHỮ VÀO THANH TÌM KIẾM */}
      <FlatList data={usersList} keyExtractor={item => item.id} renderItem={renderUser} />

      {/* 🚀 CHỌN ĐƯỢC AI LÀ NÚT NEXT MÀU VÀNG BAY RA GÓC DƯỚI LIỀN */}
      {isGroupMode && selectedIds.length > 0 && (
        <TouchableOpacity style={styles.fabBtn} onPress={() => router.push({ pathname: '/create-group', params: { ids: selectedIds.join(',') } })}>
          <Ionicons name="arrow-forward" size={28} color="#000" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingTop: 50, backgroundColor: '#1A1A1A' },
  searchInput: { flex: 1, color: '#FFF', fontSize: 16, marginLeft: 15, backgroundColor: '#2A2A2A', padding: 10, borderRadius: 10 },
  newGroupBtn: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  newGroupIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#D4AF37', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  newGroupText: { color: '#D4AF37', fontSize: 17, fontWeight: 'bold' },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  avatarContainer: { position: 'relative', marginRight: 15 },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  onlineDot: { position: 'absolute', right: 0, bottom: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#121212' },
  userName: { color: '#FFF', fontSize: 16 },
  statusText: { color: '#888', fontSize: 13, marginTop: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#888', justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  fabBtn: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#D4AF37', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
});