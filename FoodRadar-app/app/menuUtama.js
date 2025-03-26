import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { db } from "./../config/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useRouter } from 'expo-router'

const menuUtama = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState(null);
  const [type, setType] = useState(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: "Infaq", value: "infaq" },
    { label: "Sumbangan", value: "sumbangan" },
  ]);

  const router = useRouter()

  const handleSubmit = async () => {
    if (!title || !description || !address || !location || !type) {
      Alert.alert("Error", "Please fill out all the fields.");
      return;
    }

    try {

      await addDoc(collection(db, "Kempen"), {
        title,
        description,
        address,
        location,
        type,
        createdAt: new Date(),
      });

      Alert.alert("Success", "NGO details submitted successfully!");
      console.log({ title, description, address, location, type });

      setTitle("");
      setDescription("");
      setAddress("");
      setLocation(null);
      setType(null);

      router.replace('./dashboard')
    } catch (error) {
      console.error("Error adding document: ", error);
      Alert.alert("Error", "Failed to submit NGO details.");
    }
  };

  const handleLocationPick = () => {

    setLocation({ latitude: 48.8566, longitude: 2.3522 }); 
    Alert.alert("Location Selected", "Coordinates: 2.947688, 101.864990");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Enter NGO title"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Enter NGO description"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Enter NGO address"
        value={address}
        onChangeText={setAddress}
      />

      <Text style={styles.label}>Location</Text>
      <TouchableOpacity style={styles.uploadBtn} onPress={handleLocationPick}>
        <Text style={styles.uploadTxt}>
          {location ? `Lat: ${location.latitude}, Lng: ${location.longitude}` : "Select Location"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>Type</Text>
      <DropDownPicker
        open={open}
        value={type}
        items={items}
        setOpen={setOpen}
        setValue={setType}
        setItems={setItems}
        placeholder="Select NGO type"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainerStyle}
        placeholderStyle={styles.placeholderStyle}
      />

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitTxt}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 100,
    backgroundColor: "#f8f9fa",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#212529",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    color: "#495057",
    backgroundColor: "#ffffff",
  },
  uploadBtn: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  uploadTxt: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#ffffff",
  },
  dropdownContainerStyle: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ced4da",
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#6c757d",
  },
  submitBtn: {
    backgroundColor: "#28a745",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  submitTxt: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default menuUtama;
