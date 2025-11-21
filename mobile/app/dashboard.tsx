import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { api } from '../services/api';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'sales' | 'items'>('overview');
  
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [itemsData, setItemsData] = useState<any>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [dashboard, sales, items] = await Promise.all([
        api.getDashboardSummary(),
        api.getDailySales(getDateDaysAgo(7), new Date().toISOString()),
        api.getPopularItems(getDateDaysAgo(30), new Date().toISOString(), 5),
      ]);
      
      setDashboardData(dashboard);
      setSalesData(sales);
      setItemsData(items);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAllData();
  };

  const getDateDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };

  const formatCurrency = (amount: number) => {
    return `LKR ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const renderOverviewTab = () => {
    if (!dashboardData) return null;

    const statusColors = {
      PENDING: '#FF9800',
      READY: '#4CAF50',
      COMPLETED: '#2196F3',
      CANCELLED: '#f44336',
    };

    const pieData = dashboardData.statusBreakdown.map((item: any, index: number) => ({
      name: item.status,
      population: item.count,
      color: statusColors[item.status as keyof typeof statusColors] || '#999',
      legendFontColor: '#333',
      legendFontSize: 12,
    }));

    return (
      <ScrollView style={styles.tabContent}>
        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <Text style={styles.statLabel}>Today&apos;s Orders</Text>
            <Text style={styles.statValue}>{dashboardData.today.orders}</Text>
            <Text style={[styles.statChange, dashboardData.today.ordersChange >= 0 ? styles.positive : styles.negative]}>
              {dashboardData.today.ordersChange >= 0 ? '↑' : '↓'} {Math.abs(dashboardData.today.ordersChange).toFixed(1)}%
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.statLabel}>Today&apos;s Revenue</Text>
            <Text style={styles.statValue}>{formatCurrency(dashboardData.today.revenue)}</Text>
            <Text style={[styles.statChange, dashboardData.today.revenueChange >= 0 ? styles.positive : styles.negative]}>
              {dashboardData.today.revenueChange >= 0 ? '↑' : '↓'} {Math.abs(dashboardData.today.revenueChange).toFixed(1)}%
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <Text style={styles.statLabel}>Month Orders</Text>
            <Text style={styles.statValue}>{dashboardData.month.orders}</Text>
            <Text style={[styles.statChange, dashboardData.month.ordersChange >= 0 ? styles.positive : styles.negative]}>
              {dashboardData.month.ordersChange >= 0 ? '↑' : '↓'} {Math.abs(dashboardData.month.ordersChange).toFixed(1)}%
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FCE4EC' }]}>
            <Text style={styles.statLabel}>Pending Orders</Text>
            <Text style={styles.statValue}>{dashboardData.pending.count}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        {/* Status Breakdown */}
        {pieData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Order Status (This Month)</Text>
            <PieChart
              data={pieData}
              width={screenWidth - 64}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}
      </ScrollView>
    );
  };

  const renderSalesTab = () => {
    if (!salesData || !salesData.dailyData) return null;

    const chartData = {
      labels: salesData.dailyData.slice(-7).map((d: any) => {
        const date = new Date(d.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      datasets: [
        {
          data: salesData.dailyData.slice(-7).map((d: any) => d.totalSales),
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <ScrollView style={styles.tabContent}>
        {/* Summary Stats */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Sales Summary (Last 30 Days)</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Revenue:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(salesData.summary.totalRevenue)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Orders:</Text>
            <Text style={styles.summaryValue}>{salesData.summary.totalOrders}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Avg Daily Sales:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(salesData.summary.averageDailySales)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Paid:</Text>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>{formatCurrency(salesData.summary.totalPaid)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Unpaid:</Text>
            <Text style={[styles.summaryValue, { color: '#f44336' }]}>{formatCurrency(salesData.summary.totalUnpaid)}</Text>
          </View>
        </View>

        {/* Sales Chart */}
        {chartData.datasets[0].data.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Daily Sales (Last 7 Days)</Text>
            <LineChart
              data={chartData}
              width={screenWidth - 64}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#4CAF50',
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}
      </ScrollView>
    );
  };

  const renderItemsTab = () => {
    if (!itemsData || !itemsData.items) return null;

    const chartData = {
      labels: itemsData.items.map((item: any) => 
        item.itemName.length > 10 ? item.itemName.substring(0, 10) + '...' : item.itemName
      ),
      datasets: [
        {
          data: itemsData.items.map((item: any) => item.totalRevenue),
        },
      ],
    };

    return (
      <ScrollView style={styles.tabContent}>
        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Popular Items (Last 30 Days)</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Items:</Text>
            <Text style={styles.summaryValue}>{itemsData.summary.totalItems}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Sold:</Text>
            <Text style={styles.summaryValue}>{itemsData.summary.totalQuantitySold.toFixed(0)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Revenue:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(itemsData.summary.totalRevenue)}</Text>
          </View>
        </View>

        {/* Bar Chart */}
        {chartData.datasets[0].data.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Top 5 Items by Revenue</Text>
            <BarChart
              data={chartData}
              width={screenWidth - 64}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
              }}
              style={styles.chart}
              yAxisLabel="LKR "
              yAxisSuffix=""
              fromZero
            />
          </View>
        )}

        {/* Items List */}
        <View style={styles.itemsList}>
          {itemsData.items.map((item: any, index: number) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.itemName}</Text>
                <Text style={styles.itemStats}>
                  Qty: {item.totalQuantity.toFixed(1)} • Orders: {item.orderCount}
                </Text>
              </View>
              <Text style={styles.itemRevenue}>{formatCurrency(item.totalRevenue)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manager Dashboard</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.tabActive]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'sales' && styles.tabActive]}
          onPress={() => setSelectedTab('sales')}
        >
          <Text style={[styles.tabText, selectedTab === 'sales' && styles.tabTextActive]}>
            Sales
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'items' && styles.tabActive]}
          onPress={() => setSelectedTab('items')}
        >
          <Text style={[styles.tabText, selectedTab === 'items' && styles.tabTextActive]}>
            Items
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#4CAF50']} />
        }
      >
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'sales' && renderSalesTab()}
        {selectedTab === 'items' && renderItemsTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#4CAF50',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: (screenWidth - 48) / 2,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  positive: {
    color: '#4CAF50',
  },
  negative: {
    color: '#f44336',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemsList: {
    marginTop: 8,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemStats: {
    fontSize: 12,
    color: '#666',
  },
  itemRevenue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});
