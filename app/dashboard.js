import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { db } from "./../config/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Dashboard() {
  const [listKempen, setListKempen] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [totalNGOs, setTotalNGOs] = useState(0);
  const router = useRouter();

  const fetchCampaigns = async () => {
    try {
      const ref = collection(db, "Kempen");
      const result = await getDocs(ref);

      const fetchedCampaigns = [];
      result.forEach((kempen) => {
        const campaignData = { id: kempen.id, ...kempen.data() };
        // Check if campaign is active based on selectDate
        if (campaignData.selectDate) {
          const campaignDate = campaignData.selectDate.toDate();
          const now = new Date();
          campaignData.status = campaignDate > now ? 'active' : 'expired';
        } else {
          campaignData.status = 'active'; // Default to active if no date set
        }
        fetchedCampaigns.push(campaignData);
      });

      setListKempen(fetchedCampaigns);
    } catch (err) {
      console.error(err.message);
    }
  };

  const fetchTotalNGOs = async () => {
    try {
      const ref = collection(db, "User");
      const result = await getDocs(ref);
      const ngoCount = result.docs.filter(doc => doc.data().role === "ngo").length;
      setTotalNGOs(ngoCount);
    } catch (err) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchTotalNGOs();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchCampaigns(), fetchTotalNGOs()]).finally(() => setRefreshing(false));
  }, []);

  const stats = [
    { title: 'Active Campaigns', value: listKempen.length, icon: 'campaign', color: '#4CAF50' },
    { title: 'NGO Partners', value: totalNGOs, icon: 'business', color: '#9C27B0' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                <MaterialIcons name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Campaigns</Text>
          </View>

          {listKempen.length > 0 ? (
            listKempen.map((kempen) => (
              <View 
                key={kempen.id} 
                style={styles.campaignCard}
              >
                <View style={styles.campaignHeader}>
                  <MaterialIcons name="campaign" size={24} color="#4CAF50" />
                  <Text style={styles.campaignTitle}>{kempen.title}</Text>
                </View>
                <View style={styles.campaignInfo}>
                  <View style={styles.infoRow}>
                    <MaterialIcons name="location-on" size={16} color="#666" />
                    <Text style={styles.infoText}>{kempen.address}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <MaterialIcons name="category" size={16} color="#666" />
                    <Text style={styles.infoText}>{kempen.type}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <FontAwesome name="info-circle" size={16} color="#666" />
                    <Text style={styles.infoText}> {'Prepare by '}{kempen.ngoName ? kempen.ngoName : ''} </Text>
                  </View>
                  {kempen.selectDate && (
                    <View style={styles.infoRow}>
                      <MaterialIcons name="event" size={16} color="#666" />
                      <Text style={styles.infoText}>
                        Date: {kempen.selectDate.toDate().toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.campaignFooter}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: kempen.status === 'active' ? '#E7F6E9' : '#FFE8EC' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: kempen.status === 'active' ? '#4CAF50' : '#FF6B8B' }
                    ]}>
                      {kempen.status === 'active' ? '● Active' : '● Expired'}
                    </Text>
                  </View>
                  {/* <Text style={styles.dateText}>Created: {new Date(kempen.createdAt?.toDate()).toLocaleDateString()}</Text> */}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="campaign" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No active campaigns</Text>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => router.push('/menuUtama')}
              >
                <Text style={styles.createButtonText}>Create Campaign</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF6B8B',
  },
  scrollView: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#FFF0F3',
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  campaignCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#FFF0F3',
  },
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  campaignTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  campaignInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  campaignFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFF0F3',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF6B8B',
  },
  dateText: {
    color: '#666',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
