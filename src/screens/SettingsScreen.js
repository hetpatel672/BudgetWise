import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

import DatabaseService from '../services/DatabaseService';
import AuthService from '../services/AuthService';
import CurrencyService from '../services/CurrencyService';
import { shadows } from '../theme/colors';

const SettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    currency: 'USD',
    notifications: true,
    biometric: false,
    darkMode: false,
    autoBackup: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const currency = await DatabaseService.getSetting('currency') || 'USD';
      const notifications = await DatabaseService.getSetting('notifications') !== 'false';
      const biometric = await DatabaseService.getSetting('biometric') === 'true';
      const darkMode = await DatabaseService.getSetting('darkMode') === 'true';
      const autoBackup = await DatabaseService.getSetting('autoBackup') === 'true';

      setSettings({
        currency,
        notifications,
        biometric,
        darkMode,
        autoBackup,
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      await DatabaseService.setSetting(key, value.toString());
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const handleCurrencyChange = () => {
    Alert.alert(
      'Change Currency',
      'Currency selection will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Data export functionality will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleImportData = () => {
    Alert.alert(
      'Import Data',
      'Data import functionality will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset App',
      'This will delete all your data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseService.clearAllData();
              await AuthService.resetSecurity();
              Alert.alert('Success', 'App has been reset successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset app');
            }
          }
        }
      ]
    );
  };

  const renderSettingItem = (icon, title, subtitle, onPress, rightComponent) => (
    <TouchableOpacity
      style={[styles.settingItem, shadows.small]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Icon name={icon} size={20} color="#6366f1" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || <Icon name="chevron-forward" size={20} color="#9ca3af" />}
    </TouchableOpacity>
  );

  const renderSwitchItem = (icon, title, subtitle, value, onValueChange) => (
    <View style={[styles.settingItem, shadows.small]}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Icon name={icon} size={20} color="#6366f1" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
        thumbColor={value ? '#ffffff' : '#f3f4f6'}
      />
    </View>
  );

  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  if (loading) {
    return (
      <LinearGradient 
        colors={['#f0f9ff', '#e0e7ff', '#ede9fe']} 
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
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
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Profile Section */}
        {renderSection('Profile', (
          <View>
            {renderSettingItem(
              'person-circle',
              'Account',
              'Manage your account settings',
              () => Alert.alert('Info', 'Account management coming soon')
            )}
          </View>
        ))}

        {/* Preferences Section */}
        {renderSection('Preferences', (
          <View>
            {renderSettingItem(
              'card',
              'Currency',
              `Current: ${settings.currency}`,
              handleCurrencyChange
            )}
            {renderSwitchItem(
              'notifications',
              'Notifications',
              'Enable push notifications',
              settings.notifications,
              (value) => updateSetting('notifications', value)
            )}
            {renderSwitchItem(
              'moon',
              'Dark Mode',
              'Use dark theme',
              settings.darkMode,
              (value) => updateSetting('darkMode', value)
            )}
          </View>
        ))}

        {/* Security Section */}
        {renderSection('Security', (
          <View>
            {renderSwitchItem(
              'finger-print',
              'Biometric Authentication',
              'Use fingerprint or face ID',
              settings.biometric,
              (value) => updateSetting('biometric', value)
            )}
            {renderSettingItem(
              'lock-closed',
              'Change PIN',
              'Update your security PIN',
              () => Alert.alert('Info', 'PIN management coming soon')
            )}
          </View>
        ))}

        {/* Data Section */}
        {renderSection('Data', (
          <View>
            {renderSwitchItem(
              'cloud-upload',
              'Auto Backup',
              'Automatically backup your data',
              settings.autoBackup,
              (value) => updateSetting('autoBackup', value)
            )}
            {renderSettingItem(
              'download',
              'Export Data',
              'Export your data to file',
              handleExportData
            )}
            {renderSettingItem(
              'cloud-download',
              'Import Data',
              'Import data from file',
              handleImportData
            )}
          </View>
        ))}

        {/* About Section */}
        {renderSection('About', (
          <View>
            {renderSettingItem(
              'information-circle',
              'App Version',
              '1.0.0',
              () => Alert.alert('BudgetWise', 'Version 1.0.0\nBuild 1')
            )}
            {renderSettingItem(
              'help-circle',
              'Help & Support',
              'Get help and contact support',
              () => Alert.alert('Info', 'Help & Support coming soon')
            )}
            {renderSettingItem(
              'document-text',
              'Privacy Policy',
              'Read our privacy policy',
              () => Alert.alert('Info', 'Privacy Policy coming soon')
            )}
          </View>
        ))}

        {/* Danger Zone */}
        {renderSection('Danger Zone', (
          <TouchableOpacity
            style={[styles.dangerItem, shadows.small]}
            onPress={handleResetApp}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#fee2e2' }]}>
                <Icon name="trash" size={20} color="#ef4444" />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: '#ef4444' }]}>
                  Reset App
                </Text>
                <Text style={styles.settingSubtitle}>
                  Delete all data and reset the app
                </Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={20} color="#ef4444" />
          </TouchableOpacity>
        ))}
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginHorizontal: 20,
  },
  settingItem: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dangerItem: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
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

export default SettingsScreen;