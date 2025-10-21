import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import client from "../../src/api/client";

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  items: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  payment_method: string;
  created_at: string;
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await client.get("/orders");
        setOrders(data);
      } catch (error) {
        console.error("Orders fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading)
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6f3c" />
        <Text style={{ marginTop: 10, color: "#555" }}>Loading orders...</Text>
      </SafeAreaView>
    );

  if (!orders.length)
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No orders yet.</Text>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <Text style={styles.orderTitle}>Order #{order.id}</Text>
            <Text style={styles.orderDate}>
              {new Date(order.created_at).toLocaleString()}
            </Text>

            {order.items.map((item) => (
              <View key={item.id} style={styles.orderItem}>
                <Text style={styles.itemName}>
                  {item.name ?? "Unnamed item"}
                </Text>
                <Text style={styles.itemQty}>x{item.quantity ?? 0}</Text>
                <Text style={styles.itemPrice}>
                  ₱{((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}
                </Text>
              </View>
            ))}

            <View style={styles.orderSummary}>
              <View style={styles.summaryRow}>
                <Text>Total:</Text>
                <Text>₱{Number(order.totalAmount ?? "0").toFixed(2)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text>Discount:</Text>
                <Text>₱{Number(order.discountAmount ?? "0").toFixed(2)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.finalAmount}>Final:</Text>
                <Text style={styles.finalAmount}>
                  ₱{Number(order.finalAmount ?? "0").toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text>Payment:</Text>
                <Text>{order.payment_method ?? "N/A"}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fffaf4" },
  container: { flex: 1, paddingHorizontal: 16 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 18, color: "#777" },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  orderTitle: { fontSize: 18, fontWeight: "700", color: "#ff6f3c" },
  orderDate: { fontSize: 13, color: "#555", marginBottom: 10 },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemName: { fontSize: 15, color: "#2e2e2e", flex: 1 },
  itemQty: { fontSize: 14, color: "#555", marginHorizontal: 10 },
  itemPrice: { fontSize: 15, fontWeight: "700", color: "#ff6f3c" },
  orderSummary: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  finalAmount: { fontSize: 16, fontWeight: "700", color: "#ff6f3c" },
  summaryRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 4,
},
});
