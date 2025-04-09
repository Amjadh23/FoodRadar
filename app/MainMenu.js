import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { auth, db } from './../config/firebase'; 

export default function MainMenu() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [currentCampaignIndex, setCurrentCampaignIndex] = useState(0);

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

    // Fetch recent campaigns
    const fetchRecentCampaigns = async () => {
      try {
        const campaignsRef = collection(db, "Kempen");
        const q = query(campaignsRef, orderBy("createdAt", "desc"), limit(5)); // Get 5 most recent campaigns
        const querySnapshot = await getDocs(q);
        
        const campaigns = [];
        querySnapshot.forEach((doc) => {
          campaigns.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setRecentCampaigns(campaigns);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      }
    };

    fetchRecentCampaigns();
    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const navigateCampaign = (direction) => {
    if (direction === 'next') {
      setCurrentCampaignIndex((prev) => 
        prev < recentCampaigns.length - 1 ? prev + 1 : prev
      );
    } else {
      setCurrentCampaignIndex((prev) => 
        prev > 0 ? prev - 1 : prev
      );
    }
  };

  const menuItems = [
    {
      title: 'Find Food',
      icon: <MaterialIcons name="restaurant" size={32} color="#FF6B8B" />,
      onPress: () => router.push('/MapScreen'),
      description: 'Find nearby food distribution areas'
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
      onPress: () => router.push('AIChatbox'),
      description: 'Get help and information about food distribution'
    }
  ];

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
        <Text style={styles.subtitle}>Welcome, {userData ? userData.nama : 'Guest'}</Text>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {recentCampaigns.length > 0 && (
          <View style={styles.announcementContainer}>
            <TouchableOpacity 
              style={styles.announcementCard}
              onPress={() => router.push({ 
                pathname: "/MapScreen", 
                params: { 
                  selectedCampaignId: recentCampaigns[currentCampaignIndex].id,
                  latitude: recentCampaigns[currentCampaignIndex].location.latitude,
                  longitude: recentCampaigns[currentCampaignIndex].location.longitude
                } 
              })}
            >
              <View style={styles.announcementIcon}>
                <MaterialIcons name="campaign" size={24} color="#fff" />
              </View>
              <View style={styles.announcementContent}>
                <Text style={styles.announcementTitle}>
                  {currentCampaignIndex === 0 ? 'New Campaign Alert!' : 'Recent Campaign'}
                </Text>
                <Text style={styles.announcementText}>
                  {recentCampaigns[currentCampaignIndex].title} at {recentCampaigns[currentCampaignIndex].address}
                </Text>
                <View style={styles.announcementFooter}>
                  <Text style={styles.dateText}>
                    {formatDate(recentCampaigns[currentCampaignIndex].createdAt)}
                  </Text>
                  <Text style={styles.announcementSubtext}>
                    Tap to view location
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.navigationButtons}>
              <TouchableOpacity 
                style={[
                  styles.navButton,
                  currentCampaignIndex === 0 && styles.navButtonDisabled
                ]}
                onPress={() => navigateCampaign('prev')}
                disabled={currentCampaignIndex === 0}
              >
                <MaterialIcons 
                  name="chevron-left" 
                  size={24} 
                  color={currentCampaignIndex === 0 ? '#ccc' : '#FF6B8B'} 
                />
              </TouchableOpacity>
              <Text style={styles.campaignCounter}>
                {currentCampaignIndex + 1}/{recentCampaigns.length}
              </Text>
              <TouchableOpacity 
                style={[
                  styles.navButton,
                  currentCampaignIndex === recentCampaigns.length - 1 && styles.navButtonDisabled
                ]}
                onPress={() => navigateCampaign('next')}
                disabled={currentCampaignIndex === recentCampaigns.length - 1}
              >
                <MaterialIcons 
                  name="chevron-right" 
                  size={24} 
                  color={currentCampaignIndex === recentCampaigns.length - 1 ? '#ccc' : '#FF6B8B'} 
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

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
  announcementContainer: {
    marginBottom: 24,
  },
  announcementCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF0F3',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  announcementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B8B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  announcementContent: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B8B',
    marginBottom: 4,
  },
  announcementText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  announcementSubtext: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
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
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFF0F3',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  campaignCounter: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});
