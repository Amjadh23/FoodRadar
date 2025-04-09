import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Pressable,
  Alert, 
  Image
} from 'react-native';
import React, { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';

export default function Login() {
  const [userData, setUserData] = useState({
    emel: '',
    password: '',
  });

  const router = useRouter();

  const handleInputChange = (key, value) => {
    setUserData((prevState) => ({ ...prevState, [key]: value }));
  };

  const inputFields = [
    { key: 'emel', placeholder: 'Email', keyboardType: 'email-address' },
    { key: 'password', placeholder: 'Password', secureTextEntry: true },
  ];

  const handleLogin = async () => {
    const { emel, password } = userData;

    if (!emel || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, emel, password);

      const uid = result.user.uid;
      const userRef = doc(db, 'User', uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const user = userDoc.data();
        console.log('User:', user);

        if(user.role === 'user') {
          router.replace('./MainMenu')
        } else {
          router.replace('./NgoDashboard');
        }
      } else {
        Alert.alert('Error', 'No user exist.');
      }
    } catch (error) {
      // Only show the user-friendly message, don't log the error
      Alert.alert(
        'Login Failed',
        'The email or password you entered is incorrect. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.loginContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIconContainer}>
            <MaterialIcons name="restaurant" size={48} color="#FF6B8B" />
          </View>
          <Text style={styles.logoText}>
            Food<Text style={{ color: '#FF6B8B' }}>Radar</Text>
          </Text>
        </View>

        <Text style={styles.subtitle}>Connect with food distribution points</Text>

        {inputFields.map((field) => (
          <TextInput
            key={field.key}
            style={styles.input}
            placeholder={field.placeholder}
            placeholderTextColor="#888"
            keyboardType={field.keyboardType || 'default'}
            secureTextEntry={field.secureTextEntry || false}
            onChangeText={(text) => handleInputChange(field.key, text)}
          />
        ))}

        <Pressable style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </Pressable>

        <Text style={styles.registerText}>
          Want to register your NGO?{' '}
          <Link href="/NgoRegistration">
            <Text style={styles.link}>Register NGO</Text>
          </Link>
        </Text>

        <Text style={styles.registerText}>
          No Account?{' '}
          <Link href="/UserRegister">
            <Text style={styles.link}>Register Account</Text>
          </Link>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  loginContainer: {
    width: '100%',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'center',
  },
  input: {
    height: 50,
    width: '100%',
    borderColor: '#FF6B8B',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#FFF0F3',
  },
  button: {
    backgroundColor: '#FF6B8B',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
  link: {
    color: '#FF6B8B',
    fontWeight: '500',
  },
});