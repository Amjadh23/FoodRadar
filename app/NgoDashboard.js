import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function MainMenu() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const docRef = doc(db, "User", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
            console.log("User Data:", docSnap.data());
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        console.log("No user");
      }
    });

    return () => unsubscribe();
  }, []);

  const menuItems = [
    {
      title: 'Create Campaign',
      icon: <MaterialIcons name="campaign" size={32} color="#FF6B8B" />,
      onPress: () => router.push({
        pathname: '/MenuUtama',
        params: {
          userName: encodeURIComponent(JSON.stringify(userData?.nama || ''))
        },
      }),
      description: 'Create a new food distribution campaign',
    }
  ];

  const FoodRadarLogo = () => (
    <View style={styles.logoContainer}>
      <View style={styles.logoIconContainer}>
        <MaterialIcons name="restaurant" size={28} color="#FF6B8B" />
      </View>
      <Text style={styles.logoText}>
        Food<Text style={{ color: '#FF6B8B' }}>Radar</Text>
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <FoodRadarLogo />
        <Text style={styles.subtitle}>
          {userData ? `Welcome, ${userData.nama}` : 'Connect with food distribution points'}
        </Text>
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
    backgroundColor: '#FFE1E8',
    borderRadius: 12,
    padding: 8,
    marginRight: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '100%',
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    backgroundColor: '#FFF0F3',
    borderRadius: 12,
    padding: 10,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
