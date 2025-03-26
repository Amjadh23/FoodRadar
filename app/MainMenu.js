import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

export default function MainMenu() {
  const router = useRouter();

  const menuItems = [
    {
      title: 'Find Food',
      icon: <MaterialIcons name="restaurant" size={32} color="#FF6B8B" />,
      onPress: () => router.push('/MapScreen'),
      description: 'Find nearby food distribution areas'
    },
    {
      title: 'NGO Registration',
      icon: <MaterialIcons name="people" size={32} color="#FF6B8B" />,
      onPress: () => router.push('/NGORegistration'),
      description: 'Register your NGO organization'
    },
    {
      title: 'Create Campaign',
      icon: <MaterialIcons name="campaign" size={32} color="#FF6B8B" />,
      onPress: () => router.push('/menuUtama'),
      description: 'Create a new food distribution campaign'
    },
    {
      title: 'Dashboard',
      icon: <MaterialIcons name="dashboard" size={32} color="#FF6B8B" />,
      onPress: () => router.push('/dashboard'),
      description: 'View your campaigns and statistics'
    },
    {
      title: 'Chatbot',
      icon: <FontAwesome5 name="robot" size={32} color="#FF6B8B" />,
      onPress: () => router.push('/Chatbot'),
      description: 'Get help and information about food distribution'
    }
  ];

  // Logo component for FoodRadar
  const FoodRadarLogo = () => (
    <View style={styles.logoContainer}>
      <View style={styles.logoIconContainer}>
        <FontAwesome5 name="utensils" size={28} color="#FF6B8B" />
      </View>
      <Text style={styles.logoText}>
        Food<Text style={{color: '#FF6B8B'}}>Radar</Text>
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <FoodRadarLogo />
        <Text style={styles.subtitle}>Connect with food distribution points</Text>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.iconContainer}>
                {item.icon}
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  menuGrid: {
    flexDirection: 'column',
    marginBottom: 24,
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFF0F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 