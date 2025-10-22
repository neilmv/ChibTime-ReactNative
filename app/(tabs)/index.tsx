import { API_URL } from "@/src/api/apiUrl";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import client from "../../src/api/client";
import { MenuItem } from "../../src/types/models";

interface CategoryGroup {
  category_name: string;
  category_description?: string;
  items: MenuItem[];
}
interface CartItem {
  menu_item: MenuItem;
  quantity: number;
}

export default function HomeScreen() {
  const [menu, setMenu] = useState<CategoryGroup[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartVisible, setCartVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const { data } = await client.get("/menu");
        const grouped: Record<string, MenuItem[]> = {};

        data.forEach((item: MenuItem) => {
          const category = item.category_name || "Uncategorized";
          if (!grouped[category]) grouped[category] = [];
          grouped[category].push(item);
        });

        const groupedArray = Object.keys(grouped).map((category) => ({
          category_name: category,
          category_description:
            grouped[category][0]?.category_description ?? "",
          items: grouped[category],
        }));

        setMenu(groupedArray);
      } catch (error) {
        console.error("Menu fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menu_item.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menu_item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { menu_item: item, quantity: 1 }];
    });
  };

  const removeFromCart = (item: MenuItem) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.menu_item.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const subtotal = cart.reduce(
    (sum, i) => sum + i.menu_item.price * i.quantity,
    0
  );
  const total = subtotal - discount;

  const applyDiscount = () => {
    if (discountCode.toLowerCase() === "save20") {
      setDiscount(subtotal * 0.2);
      Alert.alert("Discount Applied", "20% off your order!");
    } else {
      setDiscount(0);
      Alert.alert("Invalid Code", "Try SAVE20 for 20% off.");
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart.length) return Alert.alert("Cart empty", "Add items first.");

    try {
      const items = cart.map((i) => ({
        menu_item_id: i.menu_item.id,
        quantity: i.quantity,
      }));

      await client.post("/orders", {
        items,
        discount_type: discount > 0 ? "SAVE20" : "none",
        payment_method: "cash",
      });

      setCart([]);
      setDiscount(0);
      setDiscountCode("");
      setCartVisible(false);
      setOrderSuccess(true);
    } catch (error) {
      console.error("Order error:", error);
      Alert.alert("Error", "Failed to place order.");
    }
  };

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6f3c" />
        <Text style={{ marginTop: 10, color: "#555" }}>Loading menu...</Text>
      </View>
    );

  return (
    <>
      <LinearGradient colors={["#ff8c42", "#ff6f3c"]} style={styles.headerBar}>
        <Text style={styles.headerText}>🍔 ChibTime</Text>
        <Text style={styles.headerSubtitle}>Order your cravings fast!</Text>
      </LinearGradient>

      <View style={styles.categoryTabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabs}
        >
          {menu.map((cat) => {
            const isActive = selectedCategory === cat.category_name;
            return (
              <TouchableOpacity
                key={cat.category_name}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() =>
                  setSelectedCategory(isActive ? null : cat.category_name)
                }
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                >
                  {cat.category_name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={
          selectedCategory
            ? menu.find((m) => m.category_name === selectedCategory)?.items ||
              []
            : menu.flatMap((m) => m.items)
        }
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.menuGrid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => addToCart(item)}
          >
            {item.image_url ? (
              <Image
                source={{
                  uri: `${API_URL.replace(
                    /\/api\/?$/,
                    ""
                  )}/${item.image_url?.replace(/^\/?/, "")}`,
                }}
                style={styles.image}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={{ color: "#aaa" }}>No image</Text>
              </View>
            )}
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>
              {typeof item.price === "number" ? item.price.toFixed(2) : "0.00"}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addToCart(item)}
            >
              <Text style={styles.addButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {cart.length > 0 && (
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => setCartVisible(true)}
        >
          <Text style={styles.cartButtonText}>
            🛒 {cart.length} items • ₱{total.toFixed(2)}
          </Text>
        </TouchableOpacity>
      )}

      {/* Cart Modal */}
      <Modal visible={cartVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.cartModal}>
            <Text style={styles.cartTitle}>🛍️ Your Cart</Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {cart.map((i) => (
                <View key={i.menu_item.id} style={styles.cartItem}>
                  <Text style={styles.cartItemText}>{i.menu_item.name}</Text>
                  <View style={styles.qtyControl}>
                    <TouchableOpacity
                      onPress={() => removeFromCart(i.menu_item)}
                      style={styles.qtyButton}
                    >
                      <Text style={{ color: "#fff" }}>−</Text>
                    </TouchableOpacity>
                    <Text style={{ marginHorizontal: 8 }}>{i.quantity}</Text>
                    <TouchableOpacity
                      onPress={() => addToCart(i.menu_item)}
                      style={styles.qtyButton}
                    >
                      <Text style={{ color: "#fff" }}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text>₱{(i.menu_item.price * i.quantity).toFixed(2)}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.discountRow}>
              <TextInput
                placeholder="Promo code"
                placeholderTextColor="#aaa"
                style={styles.discountInput}
                value={discountCode}
                onChangeText={setDiscountCode}
              />
              <Pressable style={styles.applyBtn} onPress={applyDiscount}>
                <Text style={styles.applyText}>Apply</Text>
              </Pressable>
            </View>

            <Text style={styles.total}>Subtotal: ₱{subtotal.toFixed(2)}</Text>
            {discount > 0 && (
              <Text style={styles.discountText}>− ₱{discount.toFixed(2)}</Text>
            )}
            <Text style={styles.finalTotal}>Total: ₱{total.toFixed(2)}</Text>

            <Pressable style={styles.placeOrder} onPress={handlePlaceOrder}>
              <Text style={styles.placeOrderText}>Confirm Order</Text>
            </Pressable>

            <Pressable
              style={[styles.placeOrder, { backgroundColor: "#ccc" }]}
              onPress={() => setCartVisible(false)}
            >
              <Text style={[styles.placeOrderText, { color: "#333" }]}>
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Order Success */}
      <Modal visible={orderSuccess} animationType="fade" transparent>
        <View style={styles.successOverlay}>
          <View style={styles.successModal}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>Order Placed!</Text>
            <Text style={styles.successText}>
              Your order has been placed successfully.
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => setOrderSuccess(false)}
            >
              <Text style={styles.successButtonText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerBar: { paddingTop: 60, paddingBottom: 20, alignItems: "center" },
  headerText: { color: "#fff", fontSize: 28, fontWeight: "800" },
  headerSubtitle: { color: "#fff", fontSize: 14, opacity: 0.9 },
  menuGrid: { padding: 12 },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    paddingBottom: 10,
  },
  image: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  imagePlaceholder: {
    width: "100%",
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
  },
  itemName: {
    fontWeight: "600",
    fontSize: 16,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  itemPrice: {
    color: "#ff6f3c",
    fontWeight: "700",
    fontSize: 15,
    paddingHorizontal: 10,
  },
  addButton: {
    backgroundColor: "#ff6f3c",
    paddingVertical: 8,
    borderRadius: 10,
    marginHorizontal: 10,
    marginTop: 5,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "600" },
  cartButton: {
    position: "absolute",
    bottom: 25,
    right: 20,
    backgroundColor: "#ff6f3c",
    padding: 15,
    borderRadius: 40,
    elevation: 6,
  },
  cartButtonText: { color: "#fff", fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  cartModal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "90%",
  },
  cartTitle: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cartItemText: { flex: 1, fontWeight: "600" },
  qtyControl: { flexDirection: "row", alignItems: "center" },
  qtyButton: {
    backgroundColor: "#ff6f3c",
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  discountRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  discountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
  },
  applyBtn: {
    backgroundColor: "#ff6f3c",
    padding: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  applyText: { color: "#fff", fontWeight: "600" },
  total: { textAlign: "right", marginTop: 10, fontWeight: "600" },
  discountText: {
    textAlign: "right",
    color: "green",
    fontWeight: "600",
    marginTop: 5,
  },
  finalTotal: {
    textAlign: "right",
    marginTop: 8,
    fontWeight: "700",
    fontSize: 16,
  },
  placeOrder: {
    backgroundColor: "#ff6f3c",
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 15,
    alignItems: "center",
  },
  placeOrderText: { color: "#fff", fontWeight: "700" },
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successModal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    width: "80%",
    alignItems: "center",
  },
  successIcon: { fontSize: 50 },
  successTitle: { fontSize: 22, fontWeight: "700", marginVertical: 10 },
  successText: { textAlign: "center", color: "#555", marginBottom: 15 },
  successButton: {
    backgroundColor: "#ff6f3c",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  successButtonText: { color: "#fff", fontWeight: "700" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fffaf4",
  },
  categoryTabsContainer: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  categoryTabs: { paddingHorizontal: 10, alignItems: "center" },
  tabButton: {
    backgroundColor: "#f7f7f7",
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginHorizontal: 6,
    elevation: 2,
  },
  tabButtonActive: { backgroundColor: "#ff6f3c" },
  tabLabel: { color: "#555", fontWeight: "600", fontSize: 15 },
  tabLabelActive: { color: "#fff", fontWeight: "700" },
});
