import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/OAuth';
import axios, { AxiosError } from 'axios';
import { NguoiDungDto } from '../Type';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Lỗi', 'Vui lòng nhập đủ email và mật khẩu!');

    setIsLoading(true);
    try {
      // 🚀 GỌI ĐÚNG API OAUTH
      const res = await axios.post<NguoiDungDto>(
        'https://ungentlemanlike-aspen-electronically.ngrok-free.dev/api/OAuth/login', 
        { email, matKhau: password }
      );
      
      if (res.data) {
        login(res.data); // API trả về thẳng Object User
      }
    } catch (error) {
      const e = error as AxiosError<{ message?: string }>;
      Alert.alert('Đăng nhập thất bại', e.response?.data?.message || 'Sai thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.logoContainer}>
        <Ionicons name="diamond-outline" size={80} color="#D4AF37" />
        <Text style={styles.title}>LUXURY CHAT</Text>
        <Text style={styles.subtitle}>Đẳng cấp kết nối</Text>
      </View>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Ionicons name="mail-outline" size={20} color="#888" style={styles.icon} />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888" value={email} onChangeText={setEmail} autoCapitalize="none" />
        </View>
        <View style={styles.inputGroup}>
          <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.icon} />
          <TextInput style={styles.input} placeholder="Mật khẩu" placeholderTextColor="#888" secureTextEntry value={password} onChangeText={setPassword} />
        </View>
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={isLoading}>
          <Text style={styles.loginBtnText}>{isLoading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}</Text>
        </TouchableOpacity>
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Chưa có tài khoản? </Text>
          <Link href="/Regiter" asChild>
            <TouchableOpacity><Text style={styles.registerLink}>Đăng ký ngay</Text></TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// (Giữ nguyên StyleSheet dưới này)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', padding: 30 },
  logoContainer: { alignItems: 'center', marginBottom: 50 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#D4AF37', marginTop: 10, letterSpacing: 2 },
  subtitle: { color: '#888', fontSize: 16, marginTop: 5 },
  form: { width: '100%' },
  inputGroup: { flexDirection: 'row', backgroundColor: '#1E1E1E', borderRadius: 12, marginBottom: 20, alignItems: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: '#333' },
  icon: { marginRight: 10 },
  input: { flex: 1, color: '#FFF', height: 55, fontSize: 16 },
  loginBtn: { backgroundColor: '#D4AF37', borderRadius: 12, height: 55, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  loginBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  registerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  registerText: { color: '#888', fontSize: 15 },
  registerLink: { color: '#D4AF37', fontSize: 15, fontWeight: 'bold' }
});