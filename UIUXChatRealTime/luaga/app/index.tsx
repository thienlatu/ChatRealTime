import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import axios from 'axios';
import { useAuth } from '../context/OAuth';
import { ChatInbox } from '../Type';

// HÀM FIX LỖI ẢNH CHO INBOX
const getValidAvatar = (url?: string) => {
  if (!url) return 'https://ui-avatars.com/api/?name=U';
  if (url.startsWith('http') || url.startsWith('data:image')) return url;
  return 'https://ui-avatars.com/api/?name=U';
};

export default function InboxScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatInbox[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [connection, setConnection] = useState<HubConnection | null>(null);
  
  // Dùng useRef để ghi nhớ các phòng đã join, tránh spam server gọi JoinRoom nhiều lần
  const joinedRooms = useRef<Set<string>>(new Set());

  const fetchChats = React.useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await axios.get<ChatInbox[]>(
        `https://ungentlemanlike-aspen-electronically.ngrok-free.dev/api/Message/inbox/${user.id}`
      );
      setChats(response.data || []);
    } catch (error) { console.error('Lỗi fetch chat:', error); } 
    finally { setLoading(false); }
  }, [user?.id]);

  useFocusEffect(React.useCallback(() => { fetchChats(); }, [fetchChats]));

  // 🔥 TIẾN TRÌNH 1: KHỞI TẠO VÀ DUY TRÌ KẾT NỐI (Chỉ chạy 1 lần duy nhất)
  useEffect(() => {
    let isMounted = true;
    if (!user?.id) return;

    const newConn = new HubConnectionBuilder()
      .withUrl("https://ungentlemanlike-aspen-electronically.ngrok-free.dev/chathub", { headers: { "ngrok-skip-browser-warning": "true" } })
      .withAutomaticReconnect()
      .build();

    newConn.start().then(() => {
      if (!isMounted) { newConn.stop(); return; }
      
      setConnection(newConn);

      // Khi có tin nhắn báo về (từ bất cứ ai trong các phòng đã join), gọi lại api lấy inbox mới nhất
      newConn.on("ReceiveMessage", () => {
        fetchChats();
      });

      // Lắng nghe thêm event hệ thống nếu có (Ví dụ: Thêm member mới)
      newConn.on("SystemMessage", () => {
        fetchChats();
      });

    }).catch(e => console.log('Lỗi kết nối SignalR:', e));

    return () => { 
      isMounted = false; 
      if (newConn.state !== HubConnectionState.Disconnected) {
         newConn.stop().catch(()=>{}); 
      }
    };
  }, [user?.id, fetchChats]); // <- Tuyệt đối không nhét chats.length vào đây nữa

  // 🔥 TIẾN TRÌNH 2: TỰ ĐỘNG JOIN VÀO CÁC PHÒNG CHAT (Chạy khi danh sách Chat tải xong)
  useEffect(() => {
    if (connection?.state === HubConnectionState.Connected && chats.length > 0) {
      chats.forEach(c => {
        // Chỉ Join nếu phòng đó chưa được join, giúp app chạy cực mượt
        if (!joinedRooms.current.has(c.id)) {
          connection.invoke("JoinRoom", c.id)
            .then(() => joinedRooms.current.add(c.id))
            .catch(() => {});
        }
      });
    }
  }, [connection, chats]); 

  const onRefresh = async () => { setRefreshing(true); await fetchChats(); setRefreshing(false); };

  const renderChatItem = ({ item }: { item: ChatInbox }) => {
    return (
      <TouchableOpacity style={styles.itemContainer} activeOpacity={0.7} onPress={() => {
        router.push({
          pathname: `/chat/${item.id}` as any,
          params: { name: item.name, avatar: item.avatar, isGroup: String(item.laNhom || false) }
        });
      }}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: getValidAvatar(item.avatar) }} style={[styles.avatar]} />
          {item.dangOnline && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.infoContainer}>
          <View style={styles.infoHeader}>
            <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={2}>
            {item.lastMessage?.includes('data:image') ? '[Hình ảnh]' : item.lastMessage}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.myAvatar} activeOpacity={0.7} onPress={() => router.push('/profile')}>
            <Image source={{ uri: getValidAvatar(user?.anhDaiDien) }} style={{ width: 36, height: 36, borderRadius: 18 }} />
            <View style={[styles.onlineDot, { width: 12, height: 12, right: 12, bottom: -2 }]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tin nhắn</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/search')}><Ionicons name="add-circle-outline" size={32} color="#D4AF37" /></TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.searchContainer} activeOpacity={0.8} onPress={() => router.push('/search')} >
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <Text style={styles.searchPlaceholder}>Tìm kiếm bạn bè, tin nhắn...</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator size="large" color="#D4AF37" style={{flex: 1}} /> : (
        <FlatList data={chats} keyExtractor={item => item.id} renderItem={renderChatItem} contentContainerStyle={{ paddingBottom: 20 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  myAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFEFEF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#D4AF37' },
  searchContainer: { flexDirection: 'row', backgroundColor: '#1E1E1E', marginHorizontal: 20, borderRadius: 20, paddingHorizontal: 15, alignItems: 'center', marginBottom: 20, height: 45 },
  searchIcon: { marginRight: 10 },
  searchPlaceholder: { color: '#888', fontSize: 16 },
  itemContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#333' },
  onlineDot: { position: 'absolute', right: 2, bottom: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#121212' },
  infoContainer: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  nameText: { color: '#FFF', fontSize: 17, fontWeight: '600', flex: 1 },
  timeText: { color: '#888', fontSize: 13 },
  lastMessage: { color: '#888', fontSize: 15 }
});