import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Lỗi', 'Vui lòng điền đủ thông tin!');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        'https://ungentlemanlike-aspen-electronically.ngrok-free.dev/api/User/dang-ky', 
        {
          ten: name,
          email: email,
          matKhau: password
        },
        {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        }
      );
      
      Alert.alert('Thành công', 'Đăng ký thành công! Vui lòng đăng nhập.', [
        { text: 'OK', onPress: () => router.replace('/Login') }
      ]);
    } catch (error: any) {
      Alert.alert('Đăng ký thất bại', error.response?.data || 'Có lỗi xảy ra từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="#D4AF37" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>TẠO TÀI KHOẢN</Text>
        <Text style={styles.subtitle}>Gia nhập không gian Luxury</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Ionicons name="person-outline" size={20} color="#888" style={styles.icon} />
          <TextInput style={styles.input} placeholder="Tên hiển thị" placeholderTextColor="#888" value={name} onChangeText={setName} />
        </View>

        <View style={styles.inputGroup}>
          <Ionicons name="mail-outline" size={20} color="#888" style={styles.icon} />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888" autoCapitalize="none" value={email} onChangeText={setEmail} />
        </View>

        <View style={styles.inputGroup}>
          <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.icon} />
          <TextInput style={styles.input} placeholder="Mật khẩu" placeholderTextColor="#888" secureTextEntry value={password} onChangeText={setPassword} />
        </View>

        <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={isLoading}>
          <Text style={styles.registerBtnText}>{isLoading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG KÝ'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 30, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 60, left: 20, zIndex: 10 },
  header: { marginBottom: 40, marginTop: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#D4AF37', letterSpacing: 1 },
  subtitle: { color: '#888', fontSize: 16, marginTop: 5 },
  form: { width: '100%' },
  inputGroup: { flexDirection: 'row', backgroundColor: '#1E1E1E', borderRadius: 12, marginBottom: 20, alignItems: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: '#333' },
  icon: { marginRight: 10 },
  input: { flex: 1, color: '#FFF', height: 55, fontSize: 16 },
  registerBtn: { backgroundColor: '#D4AF37', borderRadius: 12, height: 55, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  registerBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});