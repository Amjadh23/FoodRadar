import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, Modal, Image, ScrollView } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { db } from "./../config/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useRouter } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import LocationPicker from './LocationPicker';
import { useSearchParams } from "expo-router/build/hooks";

const THEME_COLOR = '#FF6B8B';
const BACKGROUND_COLOR = '#F5F7FA';
const CARD_BACKGROUND = '#FFFFFF';
const TEXT_PRIMARY = '#2D3748';
const TEXT_SECONDARY = '#718096';
const BORDER_COLOR = '#E2E8F0';

export default function CreateCampaign() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState(null);
  const [type, setType] = useState(null);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [items, setItems] = useState([
    { label: "Infaq", value: "infaq" },
    { label: "Sumbangan", value: "sumbangan" },
  ]);

  const params = useSearchParams()
  const ngoName = JSON.parse(params.get('userName'))

  const router = useRouter();

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation);
    setShowLocationPicker(false);
    console.log("Selected location:", selectedLocation);
  };

  const handleSubmit = async () => {
    if (!title || !description || !address || !type) {
      Alert.alert("Error", "Please fill out all the required fields.");
      return;
    }

    if (!location || !location.latitude || !location.longitude) {
      Alert.alert("Error", "Please select a valid location.");
      return;
    }

    try {
      const campaignData = {
        title,
        description,
        address,
        location: {
          latitude: Number(location.latitude),
          longitude: Number(location.longitude)
        },
        type,
        ngoName: ngoName,
        createdAt: new Date(),
        status: 'active'
      };

      console.log("Saving campaign with data:", campaignData);

      await addDoc(collection(db, "Kempen"), campaignData);

      Alert.alert("Success", "Campaign created successfully!");
      router.replace('./NgoDashboard');
    } catch (error) {
      console.error("Error adding document: ", error);
      Alert.alert("Error", "Failed to create campaign. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: 'https://placekitten.com/100/100' }}
            style={styles.profileImage}
          />
          <View style={styles.walletContainer}>
            <MaterialIcons name="account-balance-wallet" size={16} color={THEME_COLOR} />
            <Text style={styles.walletAmount}>RM 0.00</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Create Campaign</Text>
        
        <View style={styles.card}>
          <View style={[styles.formGroup, { zIndex: open ? 0 : 1 }]}>
            <Text style={styles.label}>Campaign Title</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter a meaningful title"
                value={title}
                onChangeText={(text) => setTitle(text)}
                placeholderTextColor={TEXT_SECONDARY}
              />
            </View>
          </View>

          <View style={[styles.formGroup, { zIndex: open ? 0 : 1 }]}>
            <Text style={styles.label}>Description</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your campaign's purpose and goals"
                value={description}
                onChangeText={(text) => setDescription(text)}
                multiline
                numberOfLines={4}
                placeholderTextColor={TEXT_SECONDARY}
              />
            </View>
          </View>

          <View style={[styles.formGroup, { zIndex: open ? 0 : 1 }]}>
            <Text style={styles.label}>Location Details</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter address"
                value={address}
                onChangeText={(text) => setAddress(text)}
                placeholderTextColor={TEXT_SECONDARY}
              />
            </View>
            <TouchableOpacity 
              style={styles.locationButton}
              onPress={() => setShowLocationPicker(true)}
            >
              <MaterialIcons name="location-on" size={20} color={THEME_COLOR} />
              <Text style={styles.locationButtonText}>
                {location ? `Selected: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : "Pin on map"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.formGroup, { zIndex: 2 }]}>
            <Text style={styles.label}>Campaign Type</Text>
            <DropDownPicker
              open={open}
              value={type}
              items={items}
              setOpen={setOpen}
              setValue={setType}
              setItems={setItems}
              placeholder="Select type"
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              placeholderStyle={styles.placeholderStyle}
              textStyle={styles.dropdownText}
              listItemLabelStyle={styles.dropdownItemText}
              selectedItemLabelStyle={styles.selectedItemText}
              zIndex={1000}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Create Campaign</Text>
        </TouchableOpacity>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Modal
        visible={showLocationPicker}
        animationType="slide"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <LocationPicker
          onLocationSelect={handleLocationSelect}
          onClose={() => setShowLocationPicker(false)}
          campaignType={type}
        />
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: CARD_BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BORDER_COLOR,
  },
  walletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BACKGROUND,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  walletAmount: {
    marginLeft: 6,
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    padding: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: TEXT_PRIMARY,
    marginBottom: 24,
    marginTop: 8,
  },
  card: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginBottom: 8,
  },
  inputContainer: {
    borderRadius: 12,
    backgroundColor: BACKGROUND_COLOR,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  input: {
    backgroundColor: '#FFF0F3',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BACKGROUND_COLOR,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  locationButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: TEXT_SECONDARY,
  },
  dropdown: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  dropdownContainer: {
    backgroundColor: '#FFF0F3',
    borderRadius: 12,
    borderWidth: 0,
    marginBottom: 16,
  },
  placeholderStyle: {
    fontSize: 16,
    color: TEXT_SECONDARY,
  },
  dropdownText: {
    fontSize: 16,
    color: TEXT_PRIMARY,
  },
  dropdownItemText: {
    fontSize: 16,
    color: TEXT_PRIMARY,
    padding: 8,
  },
  selectedItemText: {
    color: THEME_COLOR,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#FF6B8B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});
