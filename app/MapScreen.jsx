import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Text, ScrollView } from "react-native";
import MapView, { Marker, Circle, PROVIDER_OSM, Callout, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { db } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "expo-router";

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeDistance, setRouteDistance] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const mapRef = useRef(null);
  const router = useRouter();

  // Add hardcoded test campaigns
  const testCampaigns = [
    {
      id: 'test1',
      title: 'Test Infaq Campaign 1',
      address: 'Google B40 Building',
      type: 'infaq',
      location: {
        latitude: 37.4219980,
        longitude: -122.0840000
      }
    },
    {
      id: 'test2',
      title: 'Test Sumbangan Campaign',
      address: 'Near Google B41',
      type: 'sumbangan',
      location: {
        latitude: 37.4220980,
        longitude: -122.0845000
      }
    },
    {
      id: 'test3',
      title: 'Test Infaq Campaign 2',
      address: 'Google B43 Area',
      type: 'infaq',
      location: {
        latitude: 37.4215980,
        longitude: -122.0838000
      }
    }
  ];

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
      
      // Fetch campaigns from Firestore
      try {
        const campaignsCollection = collection(db, "Kempen");
        const campaignsSnapshot = await getDocs(campaignsCollection);
        
        if (!campaignsSnapshot.empty) {
          // If we have data in Firestore, use it
          const campaignsData = campaignsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log("Loaded campaigns from Firestore:", campaignsData);
          setCampaigns(campaignsData);
        } else {
          // If no data in Firestore, use test campaigns
          console.log("No campaigns in Firestore, using test data");
          setCampaigns(testCampaigns);
        }
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        // Fallback to test data if error
        setCampaigns(testCampaigns);
      }
      
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

  // Calculate distance between two coordinates in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate estimated travel time based on distance
  const calculateTravelTime = (distanceInKm) => {
    // Assume average speed of 30km/h in city traffic
    const averageSpeedKmh = 30;
    const timeInHours = distanceInKm / averageSpeedKmh;
    
    // Convert to minutes for better user experience
    const timeInMinutes = Math.round(timeInHours * 60);
    
    if (timeInMinutes < 60) {
      return `${timeInMinutes} min`;
    } else {
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = timeInMinutes % 60;
      return `${hours} h ${minutes} min`;
    }
  };

  // Function to show route when marker is clicked
  const showRoute = (campaign) => {
    if (!location) return;
    
    // Set selected campaign
    setSelectedCampaign(campaign);
    
    // Calculate distance in kilometers
    const distance = calculateDistance(
      location.latitude, location.longitude,
      campaign.location.latitude, campaign.location.longitude
    );
    
    const distanceFormatted = distance.toFixed(2);
    setRouteDistance(distanceFormatted);
    
    // Calculate estimated travel time
    setEstimatedTime(calculateTravelTime(distance));
    
    // Set selected route
    setSelectedRoute({
      origin: { latitude: location.latitude, longitude: location.longitude },
      destination: { latitude: campaign.location.latitude, longitude: campaign.location.longitude },
    });
    
    // Fit map to show route
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: location.latitude, longitude: location.longitude },
          { latitude: campaign.location.latitude, longitude: campaign.location.longitude }
        ],
        { edgePadding: { top: 100, right: 100, bottom: 100, left: 100 }, animated: true }
      );
    }
  };

  // Function to clear the route
  const clearRoute = () => {
    setSelectedRoute(null);
    setRouteDistance(null);
    setEstimatedTime(null);
    setSelectedCampaign(null);
  };

  const getCampaignIcon = (type) => {
    switch (type) {
      case 'infaq':
        return (
          <View style={styles.iconBg}>
            <FontAwesome5 name="hands-helping" size={24} color="#FF6B8B" />
          </View>
        );
      case 'sumbangan':
        return (
          <View style={styles.iconBg}>
            <MaterialIcons name="restaurant" size={24} color="#FF6B8B" />
          </View>
        );
      default:
        return (
          <View style={styles.iconBg}>
            <MaterialIcons name="campaign" size={24} color="#FF6B8B" />
          </View>
        );
    }
  };

  // Format campaign date nicely
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    
    try {
      const date = timestamp instanceof Date 
        ? timestamp 
        : timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Get campaign type label
  const getCampaignTypeLabel = (type) => {
    switch (type) {
      case 'infaq':
        return 'Food Donation (Infaq)';
      case 'sumbangan':
        return 'Charity Distribution (Sumbangan)';
      default:
        return 'Other Campaign';
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#FF6B8B" style={styles.loader} />
      ) : (
        <>
          <MapView
            ref={mapRef}
            provider={PROVIDER_OSM}
            style={styles.map}
            initialRegion={{
              latitude: 37.4219980,
              longitude: -122.0840000,
              latitudeDelta: 0.004,
              longitudeDelta: 0.004,
            }}
            onMapReady={() => {
              console.log("Map is ready");
              console.log("Current campaigns:", campaigns);
            }}
          >
            {location && (
              <>
                {/* User's Current Location Marker */}
                <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }}>
                  <View style={styles.userMarker}>
                    <MaterialIcons name="my-location" size={24} color="#FF6B8B" />
                  </View>
                </Marker>

                {/* 500m Radius Circle */}
                <Circle
                  center={{ latitude: location.latitude, longitude: location.longitude }}
                  radius={500}
                  strokeColor="rgba(255, 107, 139, 0.3)"
                  fillColor="rgba(255, 107, 139, 0.1)"
                />
              </>
            )}

            {/* Campaign Markers */}
            {campaigns.map((campaign) => (
              <Marker
                key={campaign.id}
                coordinate={{
                  latitude: campaign.location?.latitude || 3.139,
                  longitude: campaign.location?.longitude || 101.6869,
                }}
                onPress={() => showRoute(campaign)}
              >
                <View style={styles.campaignMarker}>
                  {getCampaignIcon(campaign.type)}
                </View>
                <Callout tooltip onPress={() => router.push({ pathname: "/CampaignDetails", params: { id: campaign.id } })}>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{campaign.title}</Text>
                    <Text style={styles.calloutAddress}>{campaign.address}</Text>
                    <Text style={styles.calloutType}>{campaign.type}</Text>
                    <TouchableOpacity style={styles.calloutButton}>
                      <Text style={styles.calloutButtonText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </Callout>
              </Marker>
            ))}

            {/* Route Line */}
            {selectedRoute && (
              <Polyline
                coordinates={[
                  selectedRoute.origin,
                  selectedRoute.destination
                ]}
                strokeWidth={3}
                strokeColor="#FF6B8B"
                lineDashPattern={[1]}
              />
            )}
          </MapView>

          {/* Floating GPS Button */}
          <TouchableOpacity style={styles.gpsButton} onPress={goToMyLocation}>
            <MaterialIcons name="my-location" size={24} color="#FF6B8B" />
          </TouchableOpacity>

          {/* Combined Route and Campaign Information Card */}
          {selectedCampaign && (
            <View style={styles.infoCardContainer}>
              {/* Route Information Section */}
              <View style={styles.routeCard}>
                <Text style={styles.routeTitle}>Route Information</Text>
                <View style={styles.routeInfoContainer}>
                  <View style={styles.routeInfoItem}>
                    <MaterialIcons name="directions" size={20} color="#FF6B8B" />
                    <Text style={styles.routeInfoLabel}>Distance</Text>
                    <Text style={styles.routeInfoValue}>{routeDistance} km</Text>
                  </View>
                  <View style={styles.routeInfoItem}>
                    <MaterialIcons name="access-time" size={20} color="#FF6B8B" />
                    <Text style={styles.routeInfoLabel}>Est. Time</Text>
                    <Text style={styles.routeInfoValue}>{estimatedTime}</Text>
                  </View>
                </View>
              </View>

              {/* Campaign Details Section */}
              <View style={styles.campaignCard}>
                <Text style={styles.campaignCardTitle}>Campaign Details</Text>
                <View style={styles.campaignTypeContainer}>
                  {getCampaignIcon(selectedCampaign.type)}
                  <Text style={styles.campaignTypeText}>
                    {getCampaignTypeLabel(selectedCampaign.type)}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedCampaign.title}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Address:</Text>
                  <Text style={styles.detailValue}>{selectedCampaign.address}</Text>
                </View>
                
                {selectedCampaign.description && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Description:</Text>
                    <Text style={styles.detailValue}>{selectedCampaign.description}</Text>
                  </View>
                )}
                
                {selectedCampaign.createdAt && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Created:</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedCampaign.createdAt)}</Text>
                  </View>
                )}
                
                {selectedCampaign.status && (
                  <View style={styles.statusContainer}>
                    <Text style={[
                      styles.statusText, 
                      { color: selectedCampaign.status === 'active' ? '#4CAF50' : '#FF6B8B' }
                    ]}>
                      {selectedCampaign.status === 'active' ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity 
                  style={styles.clearButton} 
                  onPress={clearRoute}
                >
                  <Text style={styles.clearButtonText}>Close Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Legend */}
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Campaign Types</Text>
            <View style={styles.legendItem}>
              <View style={styles.legendIconContainer}>
                <FontAwesome5 name="hands-helping" size={16} color="#FF6B8B" />
              </View>
              <Text style={styles.legendText}>Infaq</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.legendIconContainer}>
                <MaterialIcons name="restaurant" size={16} color="#FF6B8B" />
              </View>
              <Text style={styles.legendText}>Sumbangan</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.legendIconContainer}>
                <MaterialIcons name="campaign" size={16} color="#FF6B8B" />
              </View>
              <Text style={styles.legendText}>Other</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#fff' 
  },
  map: { 
    flex: 1,
    borderRadius: 20,
    margin: 16,
    overflow: 'hidden'
  },
  loader: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  userMarker: {
    backgroundColor: '#fff',
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
  iconBg: {
    backgroundColor: '#FFF0F3',
    padding: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsButton: {
    position: "absolute",
    top: 32,
    right: 32,
    backgroundColor: "#FFF0F3",
    padding: 12,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  calloutContainer: {
    padding: 16,
    width: 200,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  calloutAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  calloutType: {
    fontSize: 12,
    color: '#FF6B8B',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  calloutButton: {
    backgroundColor: '#FFF0F3',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  calloutButtonText: {
    color: '#FF6B8B',
    fontSize: 12,
    fontWeight: '600',
  },
  legend: {
    position: 'absolute',
    bottom: 32,
    left: 32,
    right: 32,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#FFF0F3',
    borderRadius: 8,
  },
  legendText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  legendIconContainer: {
    backgroundColor: '#FFF0F3',
    padding: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCardContainer: {
    position: 'absolute',
    top: 32,
    left: 16,
    right: 16,
    backgroundColor: 'transparent',
    maxHeight: '60%',
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  routeInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  routeInfoItem: {
    alignItems: 'center',
    flex: 1,
  },
  routeInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginVertical: 4,
  },
  routeInfoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B8B',
  },
  campaignCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: 350,
  },
  campaignCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  campaignTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F3',
    padding: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  campaignTypeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B8B',
  },
  detailRow: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#FFF0F3',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FF6B8B',
    fontWeight: '600',
    fontSize: 14,
  },
});
