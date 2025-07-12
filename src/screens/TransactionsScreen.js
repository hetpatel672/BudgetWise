import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

import DatabaseService from '../services/DatabaseService';
import CurrencyService from '../services/CurrencyService';
import { shadows } from '../theme/colors';

const TransactionsScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadTransactions();
  }, [filterType]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const filters = filterType !== 'all' ? { type: filterType } : {};
      const allTransactions = await DatabaseService.getTransactions(100, 0, filters);
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const getCategoryIcon = (category, type) => {
    const iconMap = {
      'Food & Dining': 'restaurant',
      'Transportation': 'car',
      'Shopping': 'bag',
      'Entertainment': 'game-controller',
      'Bills & Utilities': 'receipt',
      'Healthcare': 'medical',
      'Education': 'school',
      'Travel': 'airplane',
      'Salary': 'briefcase',
      'Freelance': 'laptop',
      'Investment': 'trending-up',
    };

    return iconMap[category] || (type === 'income' ? 'add-circle' : 'remove-circle');
  };

  const getCategoryColor = (type) => {
    return type === 'income' ? ['#10b981', '#059669'] : ['#ef4444', '#dc2626'];
  };

  const formatDate = (date) => {
    const transactionDate = new Date(date);
    return transactionDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderTransaction = ({ item }) => (
    <TouchableOpacity
      style={[styles.transactionItem, shadows.small]}
      activeOpacity={0.7}
    >
      <View style={styles.transactionContent}>
        <LinearGradient
          colors={getCategoryColor(item.type)}
          style={styles.iconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon 
            name={getCategoryIcon(item.category, item.type)} 
            size={20} 
            color="white" 
          />
        </LinearGradient>

        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription} numberOfLines={1}>
            {item.description || item.category || 'Transaction'}
          </Text>
          <Text style={styles.transactionCategory}>
            {item.category} • {formatDate(item.date)}
          </Text>
        </View>

        <View style={styles.amountContainer}>
          <Text style={[
            styles.transactionAmount,
            { color: item.type === 'income' ? '#10b981' : '#ef4444' }
          ]}>
            {item.type === 'income' ? '+' : '-'}
            {CurrencyService.formatAmount(item.amount, item.currency)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (type, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterType === type && styles.activeFilterButton
      ]}
      onPress={() => setFilterType(type)}
    >
      <Text style={[
        styles.filterButtonText,
        filterType === type && styles.activeFilterButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="receipt-outline" size={64} color="#9ca3af" />
      <Text style={styles.emptyStateText}>No transactions found</Text>
      <Text style={styles.emptyStateSubtext}>
        Start by adding your first transaction
      </Text>
    </View>
  );

  return (
    <LinearGradient 
      colors={['#f0f9ff', '#e0e7ff', '#ede9fe']} 
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <TouchableOpacity style={styles.addButton}>
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            style={styles.addButtonGradient}
          >
            <Icon name="add" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderFilterButton('all', 'All')}
          {renderFilterButton('income', 'Income')}
          {renderFilterButton('expense', 'Expense')}
          {renderFilterButton('transfer', 'Transfer')}
        </ScrollView>
      </View>

      {/* Transactions List */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : transactions.length > 0 ? (
          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
          />
        ) : (
          renderEmptyState()
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  addButtonGradient: {
    flex: 1,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#6366f1',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 100,
  },
  transactionItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    padding: 16,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#6b7280',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
});

export default TransactionsScreen;