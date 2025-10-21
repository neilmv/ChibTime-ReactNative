import { API_URL } from "@/src/api/apiUrl";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartVisible, setCartVisible] = useState(false);
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
           category_description: grouped[category][0]?.category_description ?? "",
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
      } else {
        return [...prev, { menu_item: item, quantity: 1 }];
      }
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

  const cartTotal = cart.reduce(
    (sum, i) => sum + i.menu_item.price * i.quantity,
    0
  );

  const handlePlaceOrder = async () => {
    if (!cart.length) return;
    try {
      const items = cart.map((i) => ({
        menu_item_id: i.menu_item.id,
        quantity: i.quantity,
      }));

      const discount_type = "none";
      const payment_method = "cash";

      await client.post("/orders", { items, discount_type, payment_method });

      // Show success modal instead of Alert
      setCart([]);
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
      <Modal visible={orderSuccess} animationType="fade" transparent={true}>
        <View style={styles.successOverlay}>
          <View style={styles.successModal}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>Order Placed!</Text>
            <Text style={styles.successText}>
              Your order has been successfully placed. Thank you!
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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>🍔 ChibTime Menu</Text>

        {menu.map((category) => (
          <View key={category.category_name} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.category_name}</Text>
            <Text style={styles.categoryDesc}>
              {category.category_description ?? ""}
            </Text>

            <View style={styles.grid}>
              {category.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  activeOpacity={0.8}
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
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Text style={{ color: "#aaa" }}>No image</Text>
                    </View>
                  )}

                  <View style={styles.cardContent}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <Text style={styles.itemPrice}>
                      ₱{Number(item.price || 0).toFixed(2)}
                    </Text>

                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => addToCart(item)}
                    >
                      <Text style={styles.addButtonText}>Add to Cart</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => setCartVisible(true)}
        >
          <Text style={styles.cartButtonText}>🛒 {cartTotal.toFixed(2)}</Text>
        </TouchableOpacity>
      )}

      {/* Cart Modal */}
      <Modal visible={cartVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.cartModal}>
            <Text style={styles.cartTitle}>Your Cart</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {cart.map((i) => (
                <View key={i.menu_item.id} style={styles.cartItem}>
                  <Text>{i.menu_item.name}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                      onPress={() => removeFromCart(i.menu_item)}
                      style={styles.qtyButton}
                    >
                      <Text style={{ color: "#fff" }}>-</Text>
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
            <Text style={styles.total}>Total: ₱{cartTotal.toFixed(2)}</Text>
            <Pressable style={styles.placeOrder} onPress={handlePlaceOrder}>
              <Text style={styles.placeOrderText}>Place Order</Text>
            </Pressable>
            <Pressable
              style={[
                styles.placeOrder,
                { backgroundColor: "#ccc", marginTop: 10 },
              ]}
              onPress={() => setCartVisible(false)}
            >
              <Text style={[styles.placeOrderText, { color: "#333" }]}>
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fffaf4", padding: 16 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ff6f3c",
    textAlign: "center",
    marginBottom: 25,
  },
  categorySection: { marginBottom: 30 },
  categoryTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2e2e2e",
    marginBottom: 12,
  },
  categoryDesc: {
    fontSize: 14,
    color: "#777",
    marginBottom: 12,
    lineHeight: 18,
    fontStyle: "italic",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#fff",
    width: "48%",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  image: { width: "100%", height: 120 },
  imagePlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: { padding: 10 },
  itemName: { fontSize: 16, fontWeight: "600", color: "#2e2e2e" },
  itemDesc: { fontSize: 13, color: "#777", marginVertical: 4 },
  itemPrice: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#ff6f3c",
    marginBottom: 6,
  },
  addButton: {
    backgroundColor: "#ff6f3c",
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  cartButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#ff6f3c",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 6,
  },
  cartButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  cartModal: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  cartTitle: { fontSize: 20, fontWeight: "700", marginBottom: 15 },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  qtyButton: {
    backgroundColor: "#ff6f3c",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  total: { fontSize: 18, fontWeight: "700", marginTop: 10, textAlign: "right" },
  placeOrder: {
    backgroundColor: "#ff6f3c",
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 15,
    alignItems: "center",
  },
  placeOrderText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successModal: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2e2e2e",
    marginBottom: 10,
  },
  successText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  successButton: {
    backgroundColor: "#ff6f3c",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  successButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
