import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import axios from 'axios';
import { useAuth } from '../../context/OAuth';
import { TinNhanDto } from '../../Type';

const formatMessageTime = (dateString?: string): string => {
  if (!dateString) return '';
  let date = new Date(dateString);
  if (isNaN(date.getTime())) {
    date = new Date(dateString + 'Z'); 
    if (isNaN(date.getTime())) return '';
  }
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const formatLastSeen = (dateString?: string): string => {
  if (!dateString) return '';
  let lastSeen = new Date(dateString);
  if (isNaN(lastSeen.getTime())) {
    lastSeen = new Date(dateString + 'Z'); 
    if (isNaN(lastSeen.getTime())) return '';
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

export default function ChatRoomScreen() {
  const router = useRouter();
  const { id, name, avatar, isGroup, isOnline, lastSeen, memberCount } = useLocalSearchParams<{ 
    id: string, name?: string, avatar?: string, isGroup?: string, isOnline?: string, lastSeen?: string, memberCount?: string 
  }>();
  
  const { user } = useAuth();
  const [text, setText] = useState<string>('');
  const [messages, setMessages] = useState<TinNhanDto[]>([]);
  const [connection, setConnection] = useState<HubConnection | null>(null);

  // 🚀 BẮT CHẾT CÁI LỖI "UNDEFINED"
  useEffect(() => {
    if (!id || id === 'undefined') {
      Alert.alert("Lỗi", "Vào phòng chat thất bại (Thiếu ID). Vui lòng trở lại danh sách!");
      return;
    }
    if (!user?.id) return;

    const loadHistory = async () => {
      try {
        const res = await axios.get<{ message: string, data: TinNhanDto[] }>(
          `https://ungentlemanlike-aspen-electronically.ngrok-free.dev/api/Message/all/${id}`
        );
        setMessages(res.data.data || []);
      } catch (e) { console.log("Lỗi load history", e); }
    };

    const newConnection = new HubConnectionBuilder()
      .withUrl("https://ungentlemanlike-aspen-electronically.ngrok-free.dev/chathub", { headers: { "ngrok-skip-browser-warning": "true" } })
      .withAutomaticReconnect().build();
    setConnection(newConnection);
    loadHistory();
  }, [id, user?.id]);

  useEffect(() => {
    if (!id || id === 'undefined') return;

    let isMounted = true;
    const startSignalR = async () => {
      if (!connection) return;
      try {
        await connection.start();
        if (!isMounted) { await connection.stop(); return; }
        await connection.invoke("JoinRoom", id); 
        connection.on("ReceiveMessage", (messageDto: TinNhanDto) => {
          setMessages(prev => [messageDto, ...prev]);
        });
      } catch (e) {}
    };
    startSignalR();
    return () => { 
      isMounted = false; 
      if (connection && connection.state !== HubConnectionState.Disconnected) {
         connection.stop().catch(()=>{}); 
      }
    };
  }, [connection, id]);

  const handleSendText = async () => {
    if (!text.trim()) return;
    try {
      await axios.post(
        'https://ungentlemanlike-aspen-electronically.ngrok-free.dev/api/Message/send', 
        { phongChatId: id, nguoiGuiId: user?.id, loaiTinNhan: 1, noiDung: text }
      );
      setText('');
    } catch { Alert.alert("Lỗi", "Gửi tin nhắn thất bại!"); }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.5, base64: true 
    });
    if (!result.canceled && result.assets[0].base64 && user?.id) {
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      try {
        await axios.post('https://ungentlemanlike-aspen-electronically.ngrok-free.dev/api/Message/send', { 
           phongChatId: id, nguoiGuiId: user.id, loaiTinNhan: 2, noiDung: base64Img 
        });
      } catch { Alert.alert("Lỗi", "Up ảnh thất bại"); }
    }
  };

  const renderMessage = ({ item }: { item: TinNhanDto }) => {
    const isMe = item.nguoiGuiId === user?.id;
    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageMe : styles.messageThem]}>
        {!isMe && <Image source={{ uri: getValidAvatar(item.anhDaiDien) }} style={styles.msgAvatar} />}
        <View style={styles.bubbleContainer}>
          {!isMe && isGroup === 'true' && <Text style={styles.senderName}>{item.tenNguoiGui}</Text>}
          {item.loaiTinNhan === 1 ? (
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
              <Text style={[styles.messageText, isMe ? styles.textMe : styles.textThem]}>{item.noiDung}</Text>
              <Text style={[styles.timeText, isMe ? styles.timeMe : styles.timeThem]}>{formatMessageTime(item.ngayTao)}</Text>
            </View>
          ) : (
            <View style={styles.imageBubble}>
              <Image source={{ uri: item.noiDung }} style={styles.messageImage} />
              <View style={styles.imageTimeContainer}><Text style={styles.imageTimeText}>{formatMessageTime(item.ngayTao)}</Text></View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={28} color="#D4AF37" /></TouchableOpacity>
        <View style={styles.headerAvatarContainer}>
          <Image source={{ uri: getValidAvatar(avatar) }} style={styles.headerAvatar} />
          {isOnline === 'true' && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{name || `Phòng chat`}</Text>
          {isGroup === 'true' ? (
            <Text style={styles.headerStatus}>Nhóm • {memberCount || 'Nhiều'} thành viên</Text>
          ) : (
            <Text style={[styles.headerStatus, isOnline === 'true' ? { color: '#4CAF50' } : null]}>
              {isOnline === 'true' ? 'Đang hoạt động' : `Trực tuyến ${formatLastSeen(lastSeen)}`}
            </Text>
          )}
        </View>
      </View>
      <FlatList data={messages} keyExtractor={item => item.id} renderItem={renderMessage} inverted contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }} />
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachBtn} onPress={pickImage}><Ionicons name="image-outline" size={24} color="#D4AF37" /></TouchableOpacity>
        <TextInput style={styles.input} placeholder="Nhập tin nhắn..." placeholderTextColor="#888" value={text} onChangeText={setText} multiline />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSendText} disabled={!text}><Ionicons name="send" size={20} color={text ? "#000" : "#888"} /></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingTop: 50, backgroundColor: '#1A1A1A', borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { marginRight: 5 },
  headerAvatarContainer: { position: 'relative', marginRight: 15 },
  headerAvatar: { width: 42, height: 42, borderRadius: 21 },
  onlineDot: { position: 'absolute', right: 0, bottom: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#1A1A1A' },
  headerInfo: { flex: 1 },
  headerName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  headerStatus: { color: '#888', fontSize: 13, marginTop: 2 },
  messageWrapper: { marginBottom: 15, flexDirection: 'row', alignItems: 'flex-end' },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 10 },
  messageMe: { justifyContent: 'flex-end' },
  messageThem: { justifyContent: 'flex-start' },
  bubbleContainer: { maxWidth: '75%' },
  senderName: { color: '#888', fontSize: 12, marginBottom: 4, marginLeft: 2 },
  bubble: { padding: 10, paddingHorizontal: 14, borderRadius: 20 },
  bubbleMe: { backgroundColor: '#D4AF37', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#1E1E1E', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 16 },
  textMe: { color: '#000' },
  textThem: { color: '#FFF' },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  timeMe: { color: 'rgba(0,0,0,0.6)' },
  timeThem: { color: '#666' },
  imageBubble: { borderRadius: 15, overflow: 'hidden', backgroundColor: '#1E1E1E', position: 'relative' },
  messageImage: { width: 220, height: 300, resizeMode: 'cover' },
  imageTimeContainer: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  imageTimeText: { color: '#FFF', fontSize: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, backgroundColor: '#1A1A1A', paddingBottom: Platform.OS === 'ios' ? 30 : 10 },
  attachBtn: { padding: 10, justifyContent: 'center' },
  input: { flex: 1, backgroundColor: '#2A2A2A', color: '#FFF', borderRadius: 20, paddingHorizontal: 15, paddingTop: 12, paddingBottom: 12, maxHeight: 100, fontSize: 16 },
  sendBtn: { backgroundColor: '#D4AF37', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10, marginBottom: 2 },
});