import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../context/OAuth';
import { ChatInbox } from '../Type';

export default function InboxScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatInbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = React.useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await axios.get(
        `https://ungentlemanlike-aspen-electronically.ngrok-free.dev/api/Chat/danh-sach-phong/${user.id}`,
        {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        }
      );
      setChats(response.data || []);
    } catch (error) {
      console.error('Lỗi fetch danh sách chat:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useFocusEffect(
    React.useCallback(() => {
      fetchChats();
    }, [fetchChats])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  };

  const renderChatItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.itemContainer} activeOpacity={0.7} onPress={() => router.push(`/chat/${item.id}`)}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={[styles.avatar, item.unread > 0 && styles.avatarUnread]} />
        {item.unread > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{item.unread}</Text></View>}
      </View>
      <View style={styles.infoContainer}>
        <View style={styles.infoHeader}>
          <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
        <Text style={[styles.lastMessage, item.unread > 0 && styles.lastMessageUnread]} numberOfLines={2}>
          {item.lastMessage?.includes('data:image') ? '[Hình ảnh]' : item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.myAvatar} activeOpacity={0.7} onPress={() => router.push('/profile')}>
            {user?.anhDaiDien ? (
              <Image source={{ uri: user.anhDaiDien }} style={{ width: 36, height: 36, borderRadius: 18 }} />
            ) : (
              <Text style={{fontWeight: 'bold', color: '#000'}}>TH</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tin nhắn</Text>
        </View>
        
        <TouchableOpacity onPress={() => router.push('/create-group')}>
          <Ionicons name="add-circle-outline" size={32} color="#D4AF37" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.searchContainer} 
        activeOpacity={0.8}
        onPress={() => router.push('/search')} 
      >
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <Text style={styles.searchPlaceholder}>Tìm kiếm bạn bè, tin nhắn...</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : chats.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="chatbubble-outline" size={50} color="#555" />
          <Text style={{ color: '#888', fontSize: 16, marginTop: 15 }}>Chưa có cuộc trò chuyện nào</Text>
        </View>
      ) : (
        <FlatList 
          data={chats} 
          keyExtractor={item => item.id} 
          renderItem={renderChatItem} 
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
        />
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
  avatarUnread: { borderWidth: 2, borderColor: '#D4AF37' },
  badge: { position: 'absolute', right: -2, top: -2, backgroundColor: '#D4AF37', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#121212' },
  badgeText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  infoContainer: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  nameText: { color: '#FFF', fontSize: 17, fontWeight: '600', flex: 1 },
  timeText: { color: '#888', fontSize: 13 },
  lastMessage: { color: '#888', fontSize: 15 },
  lastMessageUnread: { color: '#FFF', fontWeight: '500' }
});