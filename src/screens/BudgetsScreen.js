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

const BudgetsScreen = ({ navigation }) => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const allBudgets = await DatabaseService.getBudgets();
      setBudgets(allBudgets);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBudgets();
    setRefreshing(false);
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return '#ef4444';
    if (progress >= 80) return '#f59e0b';
    return '#10b981';
  };

  const renderBudget = ({ item }) => {
    const progress = item.amount > 0 ? (item.spent / item.amount) * 100 : 0;
    const remaining = Math.max(0, item.amount - item.spent);

    return (
      <TouchableOpacity
        style={[styles.budgetItem, shadows.small]}
        activeOpacity={0.7}
      >
        <View style={styles.budgetHeader}>
          <View style={styles.budgetInfo}>
            <Text style={styles.budgetName}>{item.name}</Text>
            <Text style={styles.budgetCategory}>{item.category}</Text>
          </View>
          <View style={styles.budgetAmounts}>
            <Text style={styles.budgetSpent}>
              {CurrencyService.formatAmount(item.spent, item.currency)}
            </Text>
            <Text style={styles.budgetTotal}>
              of {CurrencyService.formatAmount(item.amount, item.currency)}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: getProgressColor(progress)
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: getProgressColor(progress) }]}>
            {progress.toFixed(1)}%
          </Text>
        </View>

        <View style={styles.budgetFooter}>
          <Text style={styles.remainingText}>
            {CurrencyService.formatAmount(remaining, item.currency)} remaining
          </Text>
          <Text style={styles.periodText}>{item.period}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="wallet-outline" size={64} color="#9ca3af" />
      <Text style={styles.emptyStateText}>No budgets yet</Text>
      <Text style={styles.emptyStateSubtext}>
        Create your first budget to track spending
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
        <Text style={styles.title}>Budgets</Text>
        <TouchableOpacity style={styles.addButton}>
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            style={styles.addButtonGradient}
          >
            <Icon name="add" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          style={styles.summaryGradient}
        >
          <Text style={styles.summaryTitle}>Total Budget</Text>
          <Text style={styles.summaryAmount}>
            {CurrencyService.formatAmount(
              budgets.reduce((sum, budget) => sum + budget.amount, 0)
            )}
          </Text>
          <Text style={styles.summarySubtext}>
            {budgets.length} active budget{budgets.length !== 1 ? 's' : ''}
          </Text>
        </LinearGradient>
      </View>

      {/* Budgets List */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading budgets...</Text>
          </View>
        ) : budgets.length > 0 ? (
          <FlatList
            data={budgets}
            renderItem={renderBudget}
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
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
  },
  summaryGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 100,
  },
  budgetItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  budgetCategory: {
    fontSize: 14,
    color: '#6b7280',
  },
  budgetAmounts: {
    alignItems: 'flex-end',
  },
  budgetSpent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  budgetTotal: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingText: {
    fontSize: 14,
    color: '#374151',
  },
  periodText: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
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

export default BudgetsScreen;