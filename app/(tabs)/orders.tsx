import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View
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
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await client.get("/orders");
      setOrders(data);
    } catch (error) {
      console.error("Orders fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  if (loading)
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ff6f3c" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </SafeAreaView>
    );

  if (!orders.length)
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.emptyText}>You haven’t placed any orders yet 🧾</Text>
      </SafeAreaView>
    );

  const renderOrderCard = ({ item }: { item: Order }) => (
    <Animated.View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderTitle}>Order #{item.id}</Text>
        <Text style={styles.orderDate}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>

      {item.items.map((orderItem) => (
        <View key={orderItem.id} style={styles.orderItemRow}>
          <Text style={styles.itemName}>{orderItem.name}</Text>
          <Text style={styles.itemQty}>x{orderItem.quantity}</Text>
          <Text style={styles.itemPrice}>
            ₱{(orderItem.price * orderItem.quantity).toFixed(2)}
          </Text>
        </View>
      ))}

      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text>₱{Number(item.totalAmount ?? 0).toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Discount</Text>
          <Text>-₱{Number(item.discountAmount ?? 0).toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.finalLabel}>Total</Text>
          <Text style={styles.finalLabel}>₱{Number(item.finalAmount ?? 0).toFixed(2)}</Text>
        </View>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentMethod}>{item.payment_method}</Text>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={orders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fffaf4",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#777",
    fontSize: 15,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  orderHeader: {
    marginBottom: 8,
  },
  orderTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ff6f3c",
  },
  orderDate: {
    fontSize: 13,
    color: "#888",
  },
  orderItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  itemQty: {
    fontSize: 14,
    color: "#777",
    width: 40,
    textAlign: "center",
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ff6f3c",
  },
  summaryContainer: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginTop: 8,
    paddingTop: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryLabel: {
    color: "#666",
  },
  finalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ff6f3c",
  },
  paymentRow: {
    marginTop: 6,
    alignItems: "flex-end",
  },
  paymentMethod: {
    fontSize: 13,
    color: "#555",
    backgroundColor: "#ffecd6",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
  },
});
