import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import MapView, { Marker, PROVIDER_OSM } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import debounce from 'lodash/debounce';

export default function LocationPicker({ onLocationSelect, onClose, campaignType = 'infaq' }) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const mapRef = useRef(null);

  // Create a debounced search function
  const debouncedSearch = useCallback(
    debounce(async (text) => {
      if (!text.trim()) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            text
          )}&format=json&limit=5&addressdetails=1`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'FoodRadar-App'  // Required by Nominatim's usage policy
            }
          }
        );

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Received non-JSON response from server");
        }

        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Location access is required to show your position.");
          return;
        }

        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });

        const currentCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setCurrentLocation(currentCoords);
        setSelectedLocation(currentCoords);

        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...currentCoords,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          }, 1000);
        }
      } catch (error) {
        console.error("Error getting location:", error);
        Alert.alert("Error", "Could not get your current location.");
      }
    })();
  }, []);

  const handleSearch = async (location) => {
    setIsSearching(true);
    try {
      const newLocation = {
        latitude: parseFloat(location.lat),
        longitude: parseFloat(location.lon),
      };

      setSelectedLocation(newLocation);
      setSearchQuery(location.display_name || '');
      setSuggestions([]);
      setShowSuggestions(false);
      
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...newLocation,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        }, 1000);
      }
    } catch (error) {
      console.error("Error searching location:", error);
      Alert.alert("Error", "Failed to process location data.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (text) => {
    setSearchQuery(text);
    if (text.trim()) {
      setShowSuggestions(true);
      debouncedSearch(text);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const onMapReady = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...currentLocation,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      }, 1000);
    }
  };

  const handleMapPress = (event) => {
    if (!isDragging) {
      setSelectedLocation(event.nativeEvent.coordinate);
      setShowSuggestions(false);
      setSearchQuery('');  // Clear search when manually selecting location
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    }
  };

  // Campaign marker based on type
  const getCampaignIcon = () => {
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
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search location..."
            value={searchQuery}
            onChangeText={handleSearchInputChange}
            onFocus={() => setShowSuggestions(true)}
          />
          {isSearching ? (
            <ActivityIndicator size="small" color="#FF6B8B" style={styles.searchIcon} />
          ) : (
            <TouchableOpacity 
              onPress={() => {
                setShowSuggestions(false);
                setSearchQuery('');
                setSuggestions([]);
              }} 
              style={styles.searchIcon}
            >
              {showSuggestions || searchQuery ? (
                <Ionicons name="close" size={24} color="#FF6B8B" />
              ) : (
                <Ionicons name="search" size={24} color="#FF6B8B" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Suggestions List */}
        {showSuggestions && suggestions.length > 0 && (
          <ScrollView 
            style={styles.suggestionsContainer}
            keyboardShouldPersistTaps="handled"
          >
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={`${suggestion.place_id}-${index}`}
                style={styles.suggestionItem}
                onPress={() => handleSearch(suggestion)}
              >
                <MaterialIcons name="location-on" size={20} color="#FF6B8B" />
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {suggestion.display_name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <MapView
        ref={mapRef}
        provider={PROVIDER_OSM}
        style={styles.map}
        initialRegion={{
          latitude: 3.139003,
          longitude: 101.686855,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        }}
        onMapReady={onMapReady}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            draggable={true}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e) => {
              setIsDragging(false);
              setSelectedLocation(e.nativeEvent.coordinate);
              setSearchQuery('');  // Clear search when manually moving marker
            }}
            pinColor="#FF6B8B"
          />
        )}
      </MapView>

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
  searchContainer: {
    position: 'absolute',
    top: 32,
    left: 24,
    right: 24,
    zIndex: 1,
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  searchIcon: {
    padding: 8,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 200,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
    flex: 1,
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
  }
}); 