import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Text, ScrollView, Animated } from "react-native";
import MapView, { Marker, Circle, PROVIDER_OSM, Callout, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
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
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  const [isLegendVisible, setIsLegendVisible] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
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
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
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

  // Function to fetch route coordinates from OSRM
  const getRouteCoordinates = async (start, end) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson&annotations=true&steps=true`
      );
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(coord => ({
          latitude: coord[1],
          longitude: coord[0]
        }));

        // No need for offset since we're using anchor point
        return [
          start,
          ...coordinates,
          end
        ];
      }
      return null;
    } catch (error) {
      console.error('Error fetching route:', error);
      return [start, end];
    }
  };

  // Function to show route when marker is clicked
  const showRoute = async (campaign) => {
    if (!location) return;
    
    // Set selected campaign
    const now = new Date();
    const campaignDate = campaign.selectDate ? campaign.selectDate.toDate() : null;
    
    // Only consider a campaign expired if it's from a previous day
    const isExpired = campaignDate ? 
      campaignDate.getDate() < now.getDate() || 
      campaignDate.getMonth() < now.getMonth() || 
      campaignDate.getFullYear() < now.getFullYear() : false;
    
    setSelectedCampaign({
      ...campaign,
      status: isExpired ? 'expired' : 'active'
    });
    setIsBottomSheetExpanded(false);
    
    // Calculate distance in kilometers
    const distance = calculateDistance(
      location.latitude, location.longitude,
      campaign.location.latitude, campaign.location.longitude
    );
    
    const distanceFormatted = distance.toFixed(2);
    setRouteDistance(distanceFormatted);
    
    // Calculate estimated travel time
    setEstimatedTime(calculateTravelTime(distance));
    
    // Get route coordinates from OSRM
    const start = { 
      latitude: location.latitude, 
      longitude: location.longitude 
    };
    const end = { 
      latitude: campaign.location.latitude, 
      longitude: campaign.location.longitude 
    };
    
    const coordinates = await getRouteCoordinates(start, end);
    
    if (coordinates) {
      setRouteCoordinates(coordinates);
      // Set selected route
      setSelectedRoute({
        origin: start,
        destination: end,
      });
      
      // Remove the automatic map fitting to coordinates
      // This will keep the map static at its current position
    }
  };

  // Function to clear the route
  const clearRoute = () => {
    setSelectedRoute(null);
    setRouteDistance(null);
    setEstimatedTime(null);
    setSelectedCampaign(null);
    setRouteCoordinates([]);
    setIsBottomSheetExpanded(false);
  };

  // Toggle bottom sheet expansion
  const toggleBottomSheet = () => {
    setIsBottomSheetExpanded(!isBottomSheetExpanded);
  };

  const getCampaignIcon = (type) => {
    switch (type) {
      case 'infaq':
        return (
          <View style={styles.markerContainer}>
            <View style={styles.markerCircle}>
              <FontAwesome5 name="hands-helping" size={16} color="#FF6B8B" />
            </View>
          </View>
        );
      case 'sumbangan':
        return (
          <View style={styles.markerContainer}>
            <View style={styles.markerCircle}>
              <MaterialIcons name="restaurant" size={16} color="#FF6B8B" />
            </View>
          </View>
        );
      default:
        return (
          <View style={styles.markerContainer}>
            <View style={styles.markerCircle}>
              <MaterialIcons name="campaign" size={16} color="#FF6B8B" />
            </View>
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
              latitude: location?.latitude || 3.139003,
              longitude: location?.longitude || 101.686855,
              latitudeDelta: 0.002,
              longitudeDelta: 0.002,
            }}
            onMapReady={() => {
              console.log("Map is ready");
              console.log("Current campaigns:", campaigns);
              // Immediately center on user location when map is ready
              if (location) {
                mapRef.current?.animateToRegion({
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.002,
                  longitudeDelta: 0.002,
                });
              }
            }}
            onMarkerPress={(e) => {
              // Prevent default marker press behavior
              e.stopPropagation();
            }}
          >
            {location && (
              <>
                {/* User's Current Location Marker */}
                <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }}>
                  <View style={styles.userMarker}>
                    <MaterialIcons name="location-pin" size={36} color="#FF6B8B" />
                  </View>
                </Marker>
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
                anchor={{ x: 0.5, y: 0.5 }}
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
              <>
                {/* Route outline for better visibility */}
                <Polyline
                  coordinates={routeCoordinates}
                  strokeWidth={5}
                  strokeColor="rgba(255, 107, 139, 0.3)"
                  zIndex={0}
                  lineCap="round"
                  lineJoin="round"
                />
                {/* Main route line */}
                <Polyline
                  coordinates={routeCoordinates}
                  strokeWidth={3}
                  strokeColor="#FF6B8B"
                  zIndex={1}
                  lineCap="round"
                  lineJoin="round"
                />
              </>
            )}
          </MapView>

          {/* Floating GPS Button */}
          <TouchableOpacity style={styles.gpsButton} onPress={goToMyLocation}>
            <MaterialIcons name="my-location" size={24} color="#FF6B8B" />
          </TouchableOpacity>

          {/* Route Information Card (Small, Always Visible when route is selected) */}
          {selectedRoute && (
            <View style={styles.routeCardSmall}>
              <View style={styles.routeInfoContainer}>
                <View style={styles.routeInfoItem}>
                  <MaterialIcons name="directions" size={20} color="#FF6B8B" />
                  <Text style={styles.routeInfoValue}>{routeDistance} km</Text>
                </View>
                <View style={styles.routeInfoItem}>
                  <MaterialIcons name="access-time" size={20} color="#FF6B8B" />
                  <Text style={styles.routeInfoValue}>{estimatedTime}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.expandButton} 
                  onPress={toggleBottomSheet}
                >
                  <Ionicons 
                    name={isBottomSheetExpanded ? "chevron-down" : "chevron-up"} 
                    size={20} 
                    color="#FF6B8B" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Bottom Sheet for Campaign Details (Expandable) */}
          {selectedCampaign && (
            <View style={[
              styles.bottomSheet, 
              isBottomSheetExpanded ? styles.bottomSheetExpanded : styles.bottomSheetCollapsed
            ]}>
              {isBottomSheetExpanded && (
                <ScrollView style={styles.bottomSheetContent}>
                  <View style={styles.handleContainer}>
                    <View style={styles.handle} />
                  </View>
                  
                  <View style={styles.campaignHeader}>
                    <View style={styles.campaignIconLarge}>
                      {getCampaignIcon(selectedCampaign.type)}
                    </View>
                    <Text style={styles.campaignCardTitle}>{selectedCampaign.title}</Text>
                    {selectedCampaign.status && (
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: selectedCampaign.status === 'active' ? '#E7F6E9' : '#FFE8EC' }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: selectedCampaign.status === 'active' ? '#4CAF50' : '#FF6B8B' }
                        ]}>
                          {selectedCampaign.status === 'active' ? '● Active' : '● Expired'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                      <MaterialIcons name="location-on" size={24} color="#FF6B8B" />
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Location</Text>
                        <Text style={styles.infoValue}>{selectedCampaign.address}</Text>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <MaterialIcons name="category" size={24} color="#FF6B8B" />
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Campaign Type</Text>
                        <Text style={styles.infoValue}>{getCampaignTypeLabel(selectedCampaign.type)}</Text>
                      </View>
                    </View>

                    {selectedCampaign.selectDate && (
                      <View style={styles.infoRow}>
                        <MaterialIcons name="event" size={24} color="#FF6B8B" />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Date</Text>
                          <Text style={styles.infoValue}>{formatDate(selectedCampaign.selectDate)}</Text>
                        </View>
                      </View>
                    )}

                    {selectedCampaign.description && (
                      <View style={styles.infoRow}>
                        <MaterialIcons name="description" size={24} color="#FF6B8B" />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Description</Text>
                          <Text style={styles.infoValue}>{selectedCampaign.description}</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity 
                    style={[styles.actionButton, styles.closeButton]}
                    onPress={clearRoute}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          )}

          {/* Replace the existing legend with this new button and conditional legend */}
          <TouchableOpacity 
            style={styles.legendButton} 
            onPress={() => setIsLegendVisible(!isLegendVisible)}
          >
            <MaterialIcons name="legend-toggle" size={24} color="#FF6B8B" />
          </TouchableOpacity>

          {isLegendVisible && (
            <View style={[
              styles.legend,
              selectedRoute ? styles.legendWithRoute : null
            ]}>
              <View style={styles.legendHeader}>
                <Text style={styles.legendTitle}>Campaign Types</Text>
                <TouchableOpacity 
                  onPress={() => setIsLegendVisible(false)}
                  style={styles.closeLegendButton}
                >
                  <MaterialIcons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>
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
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#fff',
    margin: 0,
    padding: 0
  },
  map: { 
    flex: 1,
    width: '100%',
    height: '100%'
  },
  loader: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  userMarker: {
    //backgroundColor: '#fff',
    //padding: 8,
    //borderRadius: 16,
    //borderWidth: 2,
    //borderColor: '#FF6B8B',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  campaignMarker: {
    /*backgroundColor: '#FFF0F3',
    padding: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FF6B8B',*/
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    //backgroundColor: '#FFF0F3',
    borderRadius: 32,
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
  legendButton: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    backgroundColor: '#FFF0F3',
    padding: 12,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  legend: {
    position: 'absolute',
    bottom: 90, // Positioned above the legend button
    right: 32,
    width: 200, // Fixed width for the popup
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeLegendButton: {
    padding: 4,
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
  routeCardSmall: {
    position: 'absolute',
    top: 32,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  expandButton: {
    backgroundColor: '#FFF0F3',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  bottomSheetCollapsed: {
    bottom: -5, // Slightly visible to show there's more content
    height: 5,
  },
  bottomSheetExpanded: {
    bottom: 0,
    maxHeight: '60%',
  },
  bottomSheetContent: {
    padding: 16,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#DDD',
    borderRadius: 3,
  },
  legendWithRoute: {
    bottom: 80, // Move the legend up if there's a route display active
  },
  campaignHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 16,
  },
  campaignIconLarge: {
    width: 64,
    height: 64,
    backgroundColor: '#FFF0F3',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  campaignCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
  },
  infoSection: {
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    backgroundColor: '#FFF0F3',
    padding: 12,
    borderRadius: 12,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#FF6B8B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#FF6B8B',
    marginBottom: 32,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    padding: 2,
  },
  markerCircle: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FF6B8B',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
