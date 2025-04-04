import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { db } from "./../config/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Dashboard() {
  const [listKempen, setListKempen] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchCampaigns = async () => {
    try {
      const ref = collection(db, "Kempen");
      const result = await getDocs(ref);

      const fetchedCampaigns = [];
      result.forEach((kempen) => {
        fetchedCampaigns.push({ id: kempen.id, ...kempen.data() });
      });

      setListKempen(fetchedCampaigns);
    } catch (err) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchCampaigns().finally(() => setRefreshing(false));
  }, []);

  const stats = [
    { title: 'Active Campaigns', value: listKempen.length, icon: 'campaign', color: '#4CAF50' },
    { title: 'Total Donations', value: 'RM 5,000', icon: 'attach-money', color: '#FF9800' },
    { title: 'Beneficiaries', value: '150+', icon: 'people', color: '#2196F3' },
    { title: 'NGO Partners', value: '12', icon: 'business', color: '#9C27B0' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/menuUtama')}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
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
            <TouchableOpacity onPress={() => router.push('/NearbyCampaigns')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {listKempen.length > 0 ? (
            listKempen.map((kempen) => (
              <TouchableOpacity 
                key={kempen.id} 
                style={styles.campaignCard}
                onPress={() => router.push({ pathname: "/CampaignDetails", params: { id: kempen.id } })}
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

                </View>
                <View style={styles.campaignFooter}>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Active</Text>
                  </View>
                  <Text style={styles.dateText}>Created: {new Date(kempen.createdAt?.toDate()).toLocaleDateString()}</Text>
                </View>
              </TouchableOpacity>
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FF6B8B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  seeAll: {
    color: '#FF6B8B',
    fontSize: 16,
    fontWeight: '500',
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
