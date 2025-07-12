import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { LineChart, PieChart } from 'react-native-chart-kit';

import DatabaseService from '../services/DatabaseService';
import CurrencyService from '../services/CurrencyService';
import { shadows } from '../theme/colors';

const { width: screenWidth } = Dimensions.get('window');

const ReportsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [reportData, setReportData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    transactions: [],
    categoryData: [],
  });

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // Get date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      const transactions = await DatabaseService.getTransactionsByDateRange(startDate, endDate);
      
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Group expenses by category
      const categoryMap = {};
      transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
          if (categoryMap[t.category]) {
            categoryMap[t.category] += t.amount;
          } else {
            categoryMap[t.category] = t.amount;
          }
        });

      const categoryData = Object.entries(categoryMap)
        .map(([name, amount]) => ({
          name,
          amount,
          color: getRandomColor(),
          legendFontColor: '#7F7F7F',
          legendFontSize: 12,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6); // Top 6 categories

      setReportData({
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses,
        transactions,
        categoryData,
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRandomColor = () => {
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const renderPeriodButton = (period, label) => (
    <TouchableOpacity
      style={[
        styles.periodButton,
        selectedPeriod === period && styles.activePeriodButton
      ]}
      onPress={() => setSelectedPeriod(period)}
    >
      <Text style={[
        styles.periodButtonText,
        selectedPeriod === period && styles.activePeriodButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderSummaryCard = (title, amount, icon, color) => (
    <View style={[styles.summaryCard, shadows.small]}>
      <LinearGradient
        colors={color}
        style={styles.summaryGradient}
      >
        <View style={styles.summaryHeader}>
          <Icon name={icon} size={24} color="white" />
          <Text style={styles.summaryTitle}>{title}</Text>
        </View>
        <Text style={styles.summaryAmount}>
          {CurrencyService.formatAmount(amount)}
        </Text>
      </LinearGradient>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient 
        colors={['#f0f9ff', '#e0e7ff', '#ede9fe']} 
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient 
      colors={['#f0f9ff', '#e0e7ff', '#ede9fe']} 
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reports</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {renderPeriodButton('week', 'Week')}
            {renderPeriodButton('month', 'Month')}
            {renderPeriodButton('year', 'Year')}
          </ScrollView>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          {renderSummaryCard(
            'Income',
            reportData.totalIncome,
            'trending-up',
            ['#10b981', '#059669']
          )}
          {renderSummaryCard(
            'Expenses',
            reportData.totalExpenses,
            'trending-down',
            ['#ef4444', '#dc2626']
          )}
        </View>

        <View style={styles.summaryContainer}>
          {renderSummaryCard(
            'Net Income',
            reportData.netIncome,
            reportData.netIncome >= 0 ? 'checkmark-circle' : 'close-circle',
            reportData.netIncome >= 0 ? ['#10b981', '#059669'] : ['#ef4444', '#dc2626']
          )}
        </View>

        {/* Category Breakdown */}
        {reportData.categoryData.length > 0 && (
          <View style={[styles.chartCard, shadows.small]}>
            <Text style={styles.chartTitle}>Expenses by Category</Text>
            <PieChart
              data={reportData.categoryData}
              width={screenWidth - 60}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        {/* Transaction Count */}
        <View style={[styles.statsCard, shadows.small]}>
          <Text style={styles.statsTitle}>Transaction Summary</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Total Transactions:</Text>
            <Text style={styles.statsValue}>{reportData.transactions.length}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Income Transactions:</Text>
            <Text style={styles.statsValue}>
              {reportData.transactions.filter(t => t.type === 'income').length}
            </Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Expense Transactions:</Text>
            <Text style={styles.statsValue}>
              {reportData.transactions.filter(t => t.type === 'expense').length}
            </Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  periodContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
  },
  activePeriodButton: {
    backgroundColor: '#6366f1',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  activePeriodButtonText: {
    color: 'white',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  summaryGradient: {
    padding: 16,
    borderRadius: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 8,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  chartCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statsLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
});

export default ReportsScreen;