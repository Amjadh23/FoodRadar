import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, Modal, Image, FlatList, Button } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { db } from "./../config/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useRouter } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import LocationPicker from './LocationPicker';
import { useSearchParams } from "expo-router/build/hooks";
import DateTimePicker from '@react-native-community/datetimepicker'
import Icon from 'react-native-vector-icons/Feather'


const THEME_COLOR = '#FF6B8B';
const BACKGROUND_COLOR = '#F5F7FA';
const CARD_BACKGROUND = '#FFFFFF';
const TEXT_PRIMARY = '#2D3748';
const TEXT_SECONDARY = '#718096';
const BORDER_COLOR = '#E2E8F0';

export default function menuUtama() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState(null);
  const [type, setType] = useState(null);
  const [open, setOpen] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [items, setItems] = useState([
    { label: "Infaq", value: "infaq" },
    { label: "Sumbangan", value: "sumbangan" },
  ]);

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const params = useSearchParams()
  const ngoName = JSON.parse(params.get('userName'))

  const router = useRouter();

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation);
    setShowLocationPicker(false);
    console.log("Selected location:", selectedLocation);
  };

  const onChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }
    if (selectedDate) {
      setDate(selectedDate);
      setShowPicker(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !address || !type || !date) {
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
        status: 'active',
        selectDate: date
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

  const renderContent = () => (
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

      <View style={[styles.formGroup, { zIndex: open ? 0 : 1 }]}>
        <Text style={styles.label}>Campaign Date</Text>
        <TouchableOpacity 
          style={styles.datePickerButton} 
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.dateText}>
            {date.toLocaleDateString()}
          </Text>
          <MaterialIcons name="calendar-today" size={20} color="#666" />
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            onChange={onChange}
            minimumDate={new Date()}
          />
        )}
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
  );

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
      <FlatList
        data={[1]} // Single item to render the content
        renderItem={() => (
          <>
            <Text style={styles.pageTitle}>Create Campaign</Text>
            {renderContent()}
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Create Campaign</Text>
            </TouchableOpacity>
            <View style={styles.bottomSpacing} />
          </>
        )}
        keyExtractor={() => '1'}
        showsVerticalScrollIndicator={false}
      />

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
    backgroundColor: BACKGROUND_COLOR,
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 8,
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
  pageTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: TEXT_PRIMARY,
    marginBottom: 16,
    paddingHorizontal: 8,
    marginTop: 16,
  },
  card: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginBottom: 6,
    paddingLeft: 4,
  },
  inputContainer: {
    borderRadius: 12,
    backgroundColor: '#FFF0F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  input: {
    backgroundColor: 'transparent',
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
    color: TEXT_PRIMARY,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BACKGROUND_COLOR,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  locationButtonText: {
    marginLeft: 8,
    fontSize: 15,
    color: TEXT_SECONDARY,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF0F3',
    padding: 14,
    borderRadius: 10,
  },
  dateText: {
    fontSize: 15,
    color: '#333',
  },
  dropdown: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  dropdownContainer: {
    backgroundColor: '#FFF0F3',
    borderRadius: 12,
    borderWidth: 0,
    marginTop: 6,
  },
  placeholderStyle: {
    fontSize: 15,
    color: TEXT_SECONDARY,
  },
  dropdownText: {
    fontSize: 15,
    color: TEXT_PRIMARY,
  },
  dropdownItemText: {
    fontSize: 15,
    color: TEXT_PRIMARY,
  },
  selectedItemText: {
    color: THEME_COLOR,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: THEME_COLOR,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 30,
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
