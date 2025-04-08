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
  Image,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY, AI_CONFIG, CONVERSATION_STYLE } from '../config/ai-config';
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
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
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

      // Create context with app data and conversation style
      const context = `You are Ahmad, an AI assistant for the FoodRadar app. Please follow these conversation guidelines:
      
Personality: ${CONVERSATION_STYLE.personality}
Tone: ${CONVERSATION_STYLE.tone}
Format: ${CONVERSATION_STYLE.responseFormat}

IMPORTANT INSTRUCTIONS:
1. NEVER use markdown formatting like **bold**, *italic*, or \`code\` in your responses
2. NEVER use hashtags (#) for headers
3. NEVER use bullet points with asterisks (*)
4. Use natural language with proper punctuation
5. For lists, use numbers (1, 2, 3) or write in complete sentences
6. Write as if you're having a casual conversation with a friend

Current App Data:
Campaigns: ${JSON.stringify(appData?.campaigns || [])}
User Location: ${JSON.stringify(appData?.userLocation || 'Not available')}

You can help users with:
1. Finding nearby food campaigns
2. Information about specific campaigns
3. Statistics about campaigns and NGOs
4. Directions and locations
5. Types of campaigns (Infaq/Sumbangan)

Please provide accurate information based on the available data. Keep your responses natural and conversational, avoiding any markdown formatting or technical language.`;

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
      
      // Process the response to make it more human-like
      let processedResponse = response.text()
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1')     // Remove italic markdown
        .replace(/`(.*?)`/g, '$1')       // Remove code markdown
        .replace(/#{1,6}\s/g, '')        // Remove headers
        .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // Convert links to just text
        .replace(/\n{3,}/g, '\n\n')      // Remove excessive line breaks
        .replace(/\*\s/g, '• ')          // Convert asterisk bullets to bullet points
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
        .trim();
      
      // Additional processing to ensure no markdown remains
      processedResponse = processedResponse
        .replace(/\*\*/g, '')            // Remove any remaining bold markers
        .replace(/\*/g, '')              // Remove any remaining italic markers
        .replace(/`/g, '')               // Remove any remaining code markers
        .replace(/#/g, '')               // Remove any remaining hash markers
        .replace(/\[/g, '')              // Remove any remaining square brackets
        .replace(/\]/g, '')              // Remove any remaining square brackets
        .replace(/\(/g, '')              // Remove any remaining parentheses
        .replace(/\)/g, '')              // Remove any remaining parentheses
        .replace(/\n\s*\n\s*\n/g, '\n\n'); // Clean up any remaining excessive line breaks
      
      const aiMessage = {
        text: processedResponse,
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

  // Add keyboard listener to dismiss keyboard when tapping outside
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        // Scroll to bottom when keyboard appears
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    
    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 40}
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
          contentContainerStyle={styles.messagesContentContainer}
          onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
          {/* Add extra padding at the bottom to ensure content is visible above keyboard */}
          <View style={{ height: 100 }} />
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
            maxHeight={100}
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
    </TouchableWithoutFeedback>
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
  messagesContentContainer: {
    paddingBottom: 20,
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
    paddingBottom: Platform.OS === 'ios' ? 30 : 16, // Extra padding for iOS
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