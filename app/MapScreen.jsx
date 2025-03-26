import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import MapView, { Marker, Circle, PROVIDER_OSM } from "react-native-maps";
import * as Location from "expo-location";
import { MaterialIcons } from "@expo/vector-icons"; // Import icon library

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required to show your position.");
        setLoading(false);
        return;
      }

      let userLocation = await Location.getCurrentPositionAsync({});
      setLocation(userLocation.coords);
      setLoading(false);
    })();
  }, []);

  const goToMyLocation = async () => {
    let userLocation = await Location.getCurrentPositionAsync({});
    setLocation(userLocation.coords);

    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      });
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#ff5733" style={styles.loader} />
      ) : (
        <>
          <MapView
            ref={mapRef}
            provider={PROVIDER_OSM}
            style={styles.map}
            region={{
              latitude: location?.latitude || 3.139,
              longitude: location?.longitude || 101.6869,
              latitudeDelta: 0.004,
              longitudeDelta: 0.004,
            }}
          >
            {location && (
              <>
                {/* User's Current Location Marker */}
                <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} />

                {/* 30km Radius Circle */}
                <Circle
                  center={{ latitude: location.latitude, longitude: location.longitude }}
                  radius={500} 
                  strokeColor="rgba(0, 150, 255, 0.5)"
                  fillColor="rgba(0, 150, 255, 0.2)"
                />
              </>
            )}
          </MapView>

          {/* Floating GPS Button */}
          <TouchableOpacity style={styles.gpsButton} onPress={goToMyLocation}>
            <MaterialIcons name="my-location" size={24} color="black" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  gpsButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 50,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
});
