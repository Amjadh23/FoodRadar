import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from '../config/ai-config';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as Location from 'expo-location';

const THEME_COLOR = '#FF6B8B';
const BACKGROUND_COLOR = '#F5F7FA';

const ROBOT_ICON = 'https://cdn-icons-png.flaticon.com/512/4712/4712027.png';

export default function AIChatbox() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [appData, setAppData] = useState(null);
  const scrollViewRef = useRef();
  const router = useRouter();

  // Fetch application data
  useEffect(() => {
    const fetchAppData = async () => {
      try {
        // Fetch campaigns
        const campaignsSnapshot = await getDocs(collection(db, "Kempen"));
        const campaigns = [];
        campaignsSnapshot.forEach((doc) => {
          campaigns.push({ id: doc.id, ...doc.data() });
        });

        // Get user's location
        let location = null;
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const position = await Location.getCurrentPositionAsync({});
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        }

        // Store all data
        setAppData({
          campaigns,
          userLocation: location,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error fetching app data:', error);
      }
    };

    fetchAppData();
  }, []);

  // Add introduction message when component mounts
  useEffect(() => {
    const introMessage = {
      text: "Hello! I'm Ahmad, your AI assistant. I can help you with information about food campaigns, NGOs, and nearby locations. How can I assist you today?",
      isUser: false,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages([introMessage]);
  }, []);

  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro-002",
    generationConfig: {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    },
  });

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
      // Filter out the introduction message and create chat history
      const chatHistory = messages
        .filter((msg, index) => index !== 0) // Skip the introduction message
        .map(msg => ({
          role: msg.isUser ? "user" : "model",
          parts: [{ text: msg.text }],
        }));

      // Create context with app data
      const context = `You are Ahmad, an AI assistant for the FoodRadar app. Here is the current data about the app:
      
Current Campaigns: ${JSON.stringify(appData?.campaigns || [])}
User Location: ${JSON.stringify(appData?.userLocation || 'Not available')}

You can help users with:
1. Finding nearby food campaigns
2. Information about specific campaigns
3. Statistics about campaigns and NGOs
4. Directions and locations
5. Types of campaigns (Infaq/Sumbangan)

Please provide accurate information based on the available data.`;

      // Create a chat instance with filtered history and context
      const chat = model.startChat({
        history: chatHistory,
      });

      // Generate response with context
      const result = await chat.sendMessage([
        { text: context },
        { text: inputText.trim() }
      ]);
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
        <View style={styles.headerContent}>
          <View style={styles.headerImageContainer}>
            <Image
              source={{ uri: ROBOT_ICON }}
              style={[styles.headerProfileImage, { tintColor: THEME_COLOR }]}
            />
          </View>
          <View>
            <Text style={styles.headerTitle}>Ahmad</Text>
            <Text style={styles.headerSubtitle}>AI Assistant</Text>
          </View>
        </View>
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
              <View style={styles.messageImageContainer}>
                <Image
                  source={{ uri: ROBOT_ICON }}
                  style={[styles.profileImage, { tintColor: THEME_COLOR }]}
                />
              </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  headerImageContainer: {
    backgroundColor: '#FFF0F3',
    borderRadius: 20,
    padding: 8,
    marginRight: 12,
  },
  headerProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
  },
  aiMessageWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  userMessage: {
    backgroundColor: THEME_COLOR,
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    padding: 8,
  },
  messageImageContainer: {
    backgroundColor: '#FFF0F3',
    borderRadius: 16,
    padding: 6,
    marginRight: 8,
  },
  profileImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
}); 