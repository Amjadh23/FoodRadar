import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_OSM } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

export default function LocationPicker({ onLocationSelect, onClose, campaignType = 'infaq' }) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required to show your position.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location.coords);
      setSelectedLocation(location.coords); // Set initial marker at current location
    })();
  }, []);

  const handleMapPress = (event) => {
    // Only set new location if not currently dragging
    if (!isDragging) {
      setSelectedLocation(event.nativeEvent.coordinate);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    }
  };

  // Campaign marker based on type
  const getCampaignMarker = () => {
    return (
      <View style={styles.campaignMarker}>
        {campaignType === 'infaq' ? (
          <FontAwesome5 name="hands-helping" size={24} color="#FF6B8B" />
        ) : campaignType === 'sumbangan' ? (
          <MaterialIcons name="restaurant" size={24} color="#FF6B8B" />
        ) : (
          <MaterialIcons name="campaign" size={24} color="#FF6B8B" />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_OSM}
        style={styles.map}
        initialRegion={{
          latitude: currentLocation?.latitude || 37.4219980,
          longitude: currentLocation?.longitude || -122.0840000,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        }}
        onPress={handleMapPress}
      >
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            draggable={true}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e) => {
              setIsDragging(false);
              setSelectedLocation(e.nativeEvent.coordinate);
            }}
            pinColor="#FF6B8B"
          />
        )}
      </MapView>

      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          Tap on the map to select a location or drag the marker
        </Text>
      </View>

      <View style={styles.locationInfo}>
        <Text style={styles.locationInfoText}>
          {selectedLocation ? 
            `Selected: ${selectedLocation.latitude.toFixed(5)}, ${selectedLocation.longitude.toFixed(5)}` : 
            "No location selected"
          }
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.confirmButton]} 
          onPress={handleConfirm}
        >
          <Text style={[styles.buttonText, styles.confirmButtonText]}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
    borderRadius: 20,
    margin: 16,
    overflow: 'hidden'
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  campaignMarker: {
    backgroundColor: '#FFF0F3',
    padding: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FF6B8B',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  confirmButton: {
    backgroundColor: '#FF6B8B',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButtonText: {
    color: '#fff',
  },
  instructions: {
    position: 'absolute',
    top: 32,
    left: 24,
    right: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  instructionsText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  locationInfo: {
    position: 'absolute',
    top: 100,
    left: 24,
    right: 24,
    backgroundColor: '#FFF0F3',
    padding: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationInfoText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
}); 