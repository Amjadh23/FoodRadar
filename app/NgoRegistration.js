import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './../config/firebase';
import { useRouter } from 'expo-router';

export default function NgoRegistration() {
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleRegister = async () => {
    const { nama, email, password, confirmPassword } = formData;

    if (!nama || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please complete all the information.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'The password does not match.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, 'User', uid), {
        nama,
        email,
        uid,
        role: "ngo",
        createdAt: new Date(),
      });

      Alert.alert('Success', 'NGO registered successfully!');
      router.replace('./NgoDashboard')
    } catch (error) {
      console.error(error);
      Alert.alert('Ralat', error.message);
    }
  };

  const router = useRouter('')

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        <Image
          source={require('./../assets/images/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Register NGO</Text>

        <TextInput
          placeholder="Enter NGO name"
          value={formData.nama}
          onChangeText={(text) => handleInputChange('nama', text)}
          style={styles.input}
        />

        <TextInput
          placeholder="Enter email"
          value={formData.email}
          onChangeText={(text) => handleInputChange('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          placeholder="Enter password"
          value={formData.password}
          onChangeText={(text) => handleInputChange('password', text)}
          secureTextEntry
          style={styles.input}
        />

        <TextInput
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChangeText={(text) => handleInputChange('confirmPassword', text)}
          secureTextEntry
          style={styles.input}
        />

        <Pressable style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    padding: 24,
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: 30,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B8B',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#FF6B8B',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#FF6B8B',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
