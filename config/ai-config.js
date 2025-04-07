// Get your API key from https://makersuite.google.com/app/apikey
// Make sure to enable the Gemini API in your Google Cloud Console
export const GEMINI_API_KEY = 'AIzaSyCH_bpKslulR56ttVJ0aCM66P1UEP6dT0o'; // Replace with your actual API key

// AI Chat Configuration
export const AI_CONFIG = {
  model: 'gemini-1.0-pro',
  temperature: 0.9,
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048,
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
  ],
};

import { db } from './../config/firebase'; // Ensure this path is correct
import { collection, getDocs } from 'firebase/firestore';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

async function fetchData() {
  try {
    const querySnapshot = await getDocs(collection(db, "YourCollectionName"));
    const data = [];
    querySnapshot.forEach((doc) => {
      data.push(doc.data());
    });
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

const sendMessage = async () => {
  if (!inputText.trim()) return;

  const userMessage = {
    text: inputText.trim(),
    isUser: true,
    timestamp: new Date().toLocaleTimeString(),
  };

  setMessages(prev => [...prev, userMessage]);
  setInputText('');
  setIsLoading(true);

  try {
    const data = await fetchData(); // Fetch data from Firebase
    const location = await getUserLocation(); // Get user location

    // Create a chat instance with data context
    const chat = model.startChat({
      history: messages.map(msg => ({
        role: msg.isUser ? "user" : "model",
        parts: [{ text: msg.text }],
      })),
      context: [
        { text: `This app contains information about NGOs. Here are some details: ${JSON.stringify(data)}` },
        { text: `User location: ${JSON.stringify(location)}` }
      ],
    });

    // Generate response
    const result = await chat.sendMessage([{ text: inputText.trim() }]);
    const response = await result.response;
    
    const aiMessage = {
      text: response.text(),
      isUser: false,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, aiMessage]);
  } catch (error) {
    console.error('Error generating AI response:', error);
    const errorMessage = {
      text: "Sorry, I couldn't process your request. Please try again.",
      isUser: false,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
  }
};

export default function AIChatbox() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();
  const router = useRouter();

  useEffect(() => {
    const introMessage = {
      text: "Hello! I'm Ahmad, your AI assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages([introMessage]);
  }, []);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Assistant</Text>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
      >
        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageWrapper,
              message.isUser ? styles.userMessageWrapper : styles.aiMessageWrapper
            ]}
          >
            {!message.isUser && (
              <Image
                source={{ uri: 'https://example.com/robot-profile.png' }} // Replace with actual image URL
                style={styles.profileImage}
              />
            )}
            <View style={[
              styles.messageBubble,
              message.isUser ? styles.userMessage : styles.aiMessage
            ]}>
              <Text style={[
                styles.messageText,
                message.isUser ? styles.userMessageText : styles.aiMessageText
              ]}>
                {message.text}
              </Text>
            </View>
            <Text style={styles.timestamp}>{message.timestamp}</Text>
          </View>
        ))}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={THEME_COLOR} />
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          placeholderTextColor="#999"
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <MaterialIcons 
            name="send" 
            size={24} 
            color={!inputText.trim() || isLoading ? '#999' : THEME_COLOR} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Add styles for profile image
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  messagesContainer: {
    flex: 1,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  aiMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
  },
  userMessage: {
    backgroundColor: '#e1f5fe',
  },
  aiMessage: {
    backgroundColor: '#fff9c4',
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: '#000',
  },
  aiMessageText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  sendButton: {
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
}); 