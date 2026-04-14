import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import axios from 'axios';
import { useAuth } from '../../context/OAuth';
import { TinNhanDto } from '../../Type';

export default function ChatRoomScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<TinNhanDto[]>([]);
  const [connection, setConnection] = useState<HubConnection | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const loadHistory = async () => {
      try {
        const res = await axios.get(
          `https://ungentlemanlike-aspen-electronically.ngrok-free.dev/api/Chat/${id}/history`,
          { headers: { 'ngrok-skip-browser-warning': 'true' } }
        );
        setMessages(res.data);
      } catch (e) {
        console.log("Lỗi load history", e);
      }
    };

    const newConnection = new HubConnectionBuilder()
      .withUrl("https://ungentlemanlike-aspen-electronically.ngrok-free.dev/chathub", {
        headers: { "ngrok-skip-browser-warning": "true" }
      })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
    loadHistory();
  }, [id, user?.id]);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          connection.invoke("JoinRoom", id).catch(e => console.log(e)); 
          connection.on("ReceiveMessage", (messageDto: TinNhanDto) => {
            setMessages(prev => [messageDto, ...prev]);
          });
        })
        .catch(e => console.log('Kết nối Hub thất bại: ', e));
    }
    return () => { connection?.stop(); };
  }, [connection, id]);

  const handleSendText = async () => {
    if (!text.trim()) return;
    try {
      await axios.post(
        'https://ungentlemanlike-aspen-electronically.ngrok-free.dev/api/Chat/send-text', 
        {
          phongChatId: id,
          nguoiGuiId: user?.id,
          noiDung: text
        },
        { headers: { 'ngrok-skip-browser-warning': 'true' } }
      );
      setText('');
    } catch {
      Alert.alert("Lỗi", "Gửi tin nhắn thất bại!");
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled && user?.id) {
      const formData = new FormData();
      formData.append('phongChatId', id);
      formData.append('nguoiGuiId', user.id);
      
      formData.append('file', {
        uri: Platform.OS === 'ios' ? result.assets[0].uri.replace('file://', '') : result.assets[0].uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any);

      try {
        await axios.post(
          'https://ungentlemanlike-aspen-electronically.ngrok-free.dev/api/Chat/send-image', 
          formData, 
          {
            headers: { 
              'Content-Type': 'multipart/form-data',
              'ngrok-skip-browser-warning': 'true' 
            }
          }
        );
      } catch {
        Alert.alert("Lỗi", "Up ảnh thất bại");
      }
    }
  };

  const renderMessage = ({ item }: { item: TinNhanDto }) => {
    const isMe = item.nguoiGuiId === user?.id;
    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageMe : styles.messageThem]}>
        {!isMe && <Image source={{ uri: item.anhDaiDien || 'https://ui-avatars.com/api/?name=U' }} style={styles.msgAvatar} />}
        
        {item.loaiTinNhan === 1 ? (
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
            <Text style={[styles.messageText, isMe ? styles.textMe : styles.textThem]}>{item.noiDung}</Text>
          </View>
        ) : (
          <View style={styles.imageBubble}>
            <Image source={{ uri: item.noiDung }} style={styles.messageImage} />
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#D4AF37" />
        </TouchableOpacity>
        <Image source={{ uri: 'https://ui-avatars.com/api/?name=Room&background=333&color=fff' }} style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>Phòng: {id.substring(0, 8)}...</Text>
          <Text style={styles.headerStatus}>Đang hoạt động</Text>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
          <Ionicons name="image-outline" size={24} color="#D4AF37" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#888"
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSendText} disabled={!text}>
          <Ionicons name="send" size={20} color={text ? "#000" : "#888"} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingTop: 50, backgroundColor: '#1A1A1A', borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { marginRight: 5 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 15 },
  headerInfo: { flex: 1 },
  headerName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  headerStatus: { color: '#D4AF37', fontSize: 13 },
  messageWrapper: { marginBottom: 15, flexDirection: 'row', alignItems: 'flex-end' },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 10 },
  messageMe: { justifyContent: 'flex-end' },
  messageThem: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 20 },
  bubbleMe: { backgroundColor: '#D4AF37', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#1E1E1E', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 16 },
  textMe: { color: '#000' },
  textThem: { color: '#FFF' },
  imageBubble: { maxWidth: '75%', borderRadius: 15, overflow: 'hidden', backgroundColor: '#1E1E1E' },
  messageImage: { width: 220, height: 300, resizeMode: 'cover' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, backgroundColor: '#1A1A1A', paddingBottom: Platform.OS === 'ios' ? 30 : 10 },
  attachBtn: { padding: 10, justifyContent: 'center' },
  input: { flex: 1, backgroundColor: '#2A2A2A', color: '#FFF', borderRadius: 20, paddingHorizontal: 15, paddingTop: 12, paddingBottom: 12, maxHeight: 100, fontSize: 16 },
  sendBtn: { backgroundColor: '#D4AF37', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10, marginBottom: 2 },
});