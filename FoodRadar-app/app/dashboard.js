import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import * as Location from "expo-location";
import { db } from "./../config/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Dashboard() {
  const [listKempen, setListKempen] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const ref = collection(db, "Kempen");
        const result = await getDocs(ref);

        const fetchedCampaigns = [];
        result.forEach((kempen) => {
          fetchedCampaigns.push(kempen.data());
        });

        setListKempen(fetchedCampaigns);
      } catch (err) {
        console.error(err.message);
      }
    };

    fetchCampaigns();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>NGO Campaigns</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {listKempen.length > 0 ? (
          listKempen.map((kempen, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.cardTitle}>{kempen.title}</Text>
              <Text style={styles.cardInfo}>📍 {kempen.address}</Text>
              <Text style={styles.cardHighlight}>💰 Infaq: {kempen.infaq}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No campaigns nearby</Text>
        )}
      </ScrollView>
      <Pressable onPress={() => router.push({ pathname: "./NearbyCampaigns", params: { listKempen: JSON.stringify(listKempen) } })}>
        <Text>Find Nearby Campaigns</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 32,
    paddingVertical: 100,
    alignItems: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD95F",
    marginBottom: 16,
  },
  scrollView: {
    marginTop: 10,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 250,
    height: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFD95F",
    marginBottom: 8,
  },
  cardInfo: {
    fontSize: 14,
    color: "#34495e",
    marginBottom: 6,
  },
  cardHighlight: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFD95F",
  },
  noDataText: {
    fontSize: 16,
    color: "#7f8c8d",
    alignSelf: "center",
    marginTop: 20,
  },
});
