import { useRouter, useLocalSearchParams  } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import * as Location from "expo-location";

export default function NearbyCampaigns() {
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  const params = useLocalSearchParams ()

  // console.log("Halooooo", params)

  const campaigns = JSON.parse(params.listKempen || "[]");

  // console.log(campaigns)

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to use this feature.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      console.log("Location saya", location)

      filterCampaigns(location.coords.latitude, location.coords.longitude);
    } catch (err) {
      console.error(err.message);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filterCampaigns = (userLat, userLon) => {
    const filtered = campaigns.filter((kempen) => {
      const distance = calculateDistance(userLat, userLon, kempen.location.latitude, kempen.location.longitude);
      return distance <= 5;
    });
    console.log(filtered)
    setFilteredCampaigns(filtered);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Nearby Campaigns</Text>
      {filteredCampaigns.length > 0 ? (
        filteredCampaigns.map((kempen, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardTitle}>{kempen.title}</Text>
            <Text style={styles.cardInfo}>📍 {kempen.address}</Text>
            <Text style={styles.cardHighlight}>💰 Infaq: {kempen.infaq}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.noDataText}>No campaigns nearby</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 32,
    paddingVertical: 100,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD95F",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
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
  },
  cardInfo: {
    fontSize: 14,
    color: "#34495e",
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
