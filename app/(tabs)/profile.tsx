import { API_URL } from "@/src/api/apiUrl";
import client from "@/src/api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    discount_type: "",
  });

  const fetchUser = async () => {
    try {
      const response = await client.get("/users/me");
      setUser(response.data);
      setForm({
        full_name: response.data.full_name || "",
        phone: response.data.phone || "",
        discount_type: response.data.discount_type || "",
      });
    } catch (error: any) {
      Alert.alert("Error", "Failed to load user info");
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem("token");
        router.replace("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace("/login");
        },
      },
    ]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      const image = result.assets[0];
      const formData = new FormData();
      formData.append("photo", {
        uri: image.uri,
        name: "profile.jpg",
        type: "image/jpeg",
      } as any);

      try {
        const res = await client.post("/users/upload-profile-photo", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setUser({ ...user, profile_photo: res.data.photoUrl });
        Alert.alert("Success", "Profile photo updated!");
      } catch (err) {
        Alert.alert("Error", "Failed to upload photo");
      }
    }
  };

  const saveChanges = async () => {
    try {
      await client.put("/users/profile", form);
      Alert.alert("Success", "Profile updated!");
      setEditing(false);
      fetchUser();
    } catch {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ff6f3c" />
      </View>
    );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <TouchableOpacity onPress={pickImage}>
          {user.profile_photo ? (
            <Image
              source={{
                uri: `${API_URL.replace(
                  /\/api\/?$/,
                  ""
                )}/${user.profile_photo?.replace(/^\/?/, "")}`,
              }}
              style={styles.profileImage}
              onError={(e) =>
                console.log("Image load error:", e.nativeEvent.error)
              }
            />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Text style={{ color: "#aaa", fontSize: 24 }}>👤</Text>
            </View>
          )}
        </TouchableOpacity>

        {editing ? (
          <>
            <TextInput
              style={styles.input}
              value={form.full_name}
              onChangeText={(text) => setForm({ ...form, full_name: text })}
              placeholder="Full Name"
            />
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={(text) => setForm({ ...form, phone: text })}
              placeholder="Phone"
            />
            <TextInput
              style={styles.input}
              value={form.discount_type}
              onChangeText={(text) => setForm({ ...form, discount_type: text })}
              placeholder="Discount Type"
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveChanges}>
              <Text style={styles.saveText}>Save Changes</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.name}>{user.full_name}</Text>
            <Text style={styles.email}>{user.email}</Text>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{user.phone || "-"}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Discount Type:</Text>
              <Text style={styles.value}>{user.discount_type || "None"}</Text>
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditing(true)}
            >
              <Text style={styles.editText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: "center", backgroundColor: "#fffaf4" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    marginVertical: 40,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: "#ff6f3c",
    marginBottom: 15,
  },
  profilePlaceholder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  name: { fontSize: 22, fontWeight: "700", color: "#2e2e2e" },
  email: { fontSize: 15, color: "#777", marginBottom: 20 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
  },
  label: { fontWeight: "600", color: "#555" },
  value: { color: "#333" },
  editButton: {
    marginTop: 20,
    backgroundColor: "#ffd5c2",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  editText: { color: "#ff6f3c", fontWeight: "600" },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderColor: "#eee",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#ff6f3c",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginTop: 10,
  },
  saveText: { color: "#fff", fontWeight: "700" },
  logoutButton: {
    marginTop: 20,
    backgroundColor: "#ff6f3c",
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 30,
  },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
