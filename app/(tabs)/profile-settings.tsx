import { authService } from '@/services/auth';
import { languageLearningService } from '@/services/openai';
import { AVAILABLE_LANGUAGES, settingsService, UserSettings, VocabularyWord } from '@/services/settings';
import { usageService } from '@/services/usage';
import { useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'profile' | 'settings' | 'vocabulary';

export default function ProfileSettingsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showCustomInstructions, setShowCustomInstructions] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [updatingSettings, setUpdatingSettings] = useState<Set<string>>(new Set());

  // Refresh data when tab comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return;
      }

      const [settingsResult, vocabularyResult, statsResult] = await Promise.all([
        settingsService.getUserSettings(currentUser.user_id),
        settingsService.getVocabulary(currentUser.user_id),
        usageService.getUserStats(currentUser.user_id)
      ]);

      if (settingsResult.settings) {
        setSettings(settingsResult.settings);
        setCustomInstructions(settingsResult.settings.custom_instructions || '');
      }

      if (vocabularyResult.vocabulary) {
        setVocabulary(vocabularyResult.vocabulary);
      }

      if (statsResult.stats) {
        setUserStats(statsResult.stats);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    if (!settings) return;
    
    // Prevent rapid toggling
    if (updatingSettings.has(key)) return;

    // Update local state immediately for responsiveness
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
    setUpdatingSettings(prev => new Set(prev).add(key));

    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) return;

      const result = await settingsService.updateSettings(currentUser.user_id, { [key]: value });

      if (result.settings) {
        // Update with server response to ensure consistency
        setSettings(result.settings);
        // Update the language learning service with new settings
        languageLearningService.updateSettings(result.settings);
      } else if (result.error) {
        // Revert local state if server update failed
        setSettings(prev => prev ? { ...prev, [key]: !value } : null);
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      // Revert local state if server update failed
      setSettings(prev => prev ? { ...prev, [key]: !value } : null);
      Alert.alert('Error', 'Failed to update setting');
    } finally {
      setUpdatingSettings(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const updateCustomInstructions = async () => {
    if (!settings) return;

    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) return;

      const result = await settingsService.updateSettings(currentUser.user_id, {
        custom_instructions: customInstructions.trim() || null
      });

      if (result.settings) {
        setSettings(result.settings);
        setShowCustomInstructions(false);
        // Update the language learning service with new settings
        languageLearningService.updateSettings(result.settings);
      } else if (result.error) {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update custom instructions');
    }
  };

  const selectLanguage = async (languageCode: string) => {
    await updateSetting('target_language', languageCode);
    setShowLanguageSelector(false);
  };

  const deleteVocabularyWord = async (wordId: string) => {
    Alert.alert(
      'Delete Word',
      'Are you sure you want to delete this word from your vocabulary?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await settingsService.deleteVocabularyWord(wordId);
              if (result.error) {
                Alert.alert('Error', result.error);
              } else {
                // Remove the word from local state immediately
                setVocabulary(prev => prev.filter(word => word.id !== wordId));
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete word');
            }
          },
        },
      ]
    );
  };

  const getLanguageName = (code: string) => {
    const language = AVAILABLE_LANGUAGES.find(lang => lang.code === code);
    return language ? language.name : code;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    }).format(amount);
  };

  const renderProfileTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usage Statistics</Text>
        
        {userStats ? (
          <>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Input Tokens</Text>
              <Text style={styles.statValue}>{userStats.total_input_tokens.toLocaleString()}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Output Tokens</Text>
              <Text style={styles.statValue}>{userStats.total_output_tokens.toLocaleString()}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Cost</Text>
              <Text style={styles.statValue}>{formatCurrency(userStats.total_cost_usd)}</Text>
            </View>

            {Object.keys(userStats.usage_by_model).length > 0 && (
              <View style={styles.modelBreakdown}>
                <Text style={styles.subsectionTitle}>Usage by Model</Text>
                {Object.entries(userStats.usage_by_model).map(([model, data]: [string, any]) => (
                  <View key={model} style={styles.modelItem}>
                    <Text style={styles.modelName}>{model}</Text>
                    <Text style={styles.modelStats}>
                      Input: {data.input_tokens.toLocaleString()} | 
                      Output: {data.output_tokens.toLocaleString()} | 
                      Cost: {formatCurrency(data.cost_usd)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <Text style={styles.noDataText}>No usage data available</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={async () => {
            await authService.signOut();
          }}
        >
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Language Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Target Language</Text>
        <TouchableOpacity
          style={styles.languageSelector}
          onPress={() => setShowLanguageSelector(true)}
        >
          <Text style={styles.languageText}>
            {getLanguageName(settings?.target_language || 'spanish')}
          </Text>
          <Text style={styles.changeText}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Learning Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Learning Preferences</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Always correct sentences</Text>
            <Text style={styles.settingDescription}>
              Automatically correct grammatical errors and explain why
            </Text>
          </View>
          <Switch
            value={settings?.always_correct_sentences || false}
            onValueChange={(value) => updateSetting('always_correct_sentences', value)}
            disabled={updatingSettings.has('always_correct_sentences')}
          />
        </View>

        {/* Correction strictness sub-settings */}
        {settings?.always_correct_sentences && (
          <View style={styles.subSettingsContainer}>
            <Text style={styles.subSettingsTitle}>Correction Types:</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.subSettingLabel}>Correct punctuation</Text>
                <Text style={styles.settingDescription}>
                  Fix missing or incorrect punctuation marks
                </Text>
              </View>
              <Switch
                value={settings?.correct_punctuation || false}
                onValueChange={(value) => updateSetting('correct_punctuation', value)}
                disabled={updatingSettings.has('correct_punctuation')}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.subSettingLabel}>Correct capitalization</Text>
                <Text style={styles.settingDescription}>
                  Fix capitalization errors (proper nouns, sentence starts)
                </Text>
              </View>
              <Switch
                value={settings?.correct_capitalization || false}
                onValueChange={(value) => updateSetting('correct_capitalization', value)}
                disabled={updatingSettings.has('correct_capitalization')}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.subSettingLabel}>Correct accents</Text>
                <Text style={styles.settingDescription}>
                  Fix missing or incorrect accent marks
                </Text>
              </View>
              <Switch
                value={settings?.correct_accents || false}
                onValueChange={(value) => updateSetting('correct_accents', value)}
                disabled={updatingSettings.has('correct_accents')}
              />
            </View>
          </View>
        )}

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Suggest natural alternatives</Text>
            <Text style={styles.settingDescription}>
              Provide more natural or colloquial ways to express ideas
            </Text>
          </View>
          <Switch
            value={settings?.suggest_natural_alternatives || false}
            onValueChange={(value) => updateSetting('suggest_natural_alternatives', value)}
            disabled={updatingSettings.has('suggest_natural_alternatives')}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Show verb conjugations</Text>
            <Text style={styles.settingDescription}>
              Display all conjugations when you make conjugation errors
            </Text>
          </View>
          <Switch
            value={settings?.show_verb_conjugations || false}
            onValueChange={(value) => updateSetting('show_verb_conjugations', value)}
            disabled={updatingSettings.has('show_verb_conjugations')}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Explain tense usage</Text>
            <Text style={styles.settingDescription}>
              Explain which tense to use and why when you use the wrong tense
            </Text>
          </View>
          <Switch
            value={settings?.explain_tense_usage || false}
            onValueChange={(value) => updateSetting('explain_tense_usage', value)}
            disabled={updatingSettings.has('explain_tense_usage')}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Track vocabulary</Text>
            <Text style={styles.settingDescription}>
              Automatically track words you use in conversations
            </Text>
          </View>
          <Switch
            value={settings?.track_vocabulary || false}
            onValueChange={(value) => updateSetting('track_vocabulary', value)}
            disabled={updatingSettings.has('track_vocabulary')}
          />
        </View>
      </View>

      {/* Custom Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Instructions</Text>
        <Text style={styles.sectionDescription}>
          Add your own specific instructions for the AI assistant
        </Text>
        
        {showCustomInstructions ? (
          <View style={styles.customInstructionsContainer}>
            <TextInput
              style={styles.customInstructionsInput}
              value={customInstructions}
              onChangeText={setCustomInstructions}
              placeholder="Enter your custom instructions..."
              multiline
              numberOfLines={4}
            />
            <View style={styles.customInstructionsButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setCustomInstructions(settings?.custom_instructions || '');
                  setShowCustomInstructions(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={updateCustomInstructions}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.customInstructionsButton}
            onPress={() => setShowCustomInstructions(true)}
          >
            <Text style={styles.customInstructionsButtonText}>
              {settings?.custom_instructions ? 'Edit Instructions' : 'Add Instructions'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  const renderVocabularyTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vocabulary ({vocabulary.length} words)</Text>
        <Text style={styles.sectionDescription}>
          Words you've used in your conversations
        </Text>
        
        {vocabulary.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No vocabulary words yet</Text>
            <Text style={styles.emptySubtext}>Words will be added as you chat</Text>
          </View>
        ) : (
          <View style={styles.vocabularyListContainer}>
            <FlatList
              data={vocabulary}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.vocabularyItem}>
                  <View style={styles.vocabularyInfo}>
                    <Text style={styles.vocabularyWord}>{item.word}</Text>
                    {item.translation && (
                      <Text style={styles.vocabularyTranslation}>{item.translation}</Text>
                    )}
                    {item.part_of_speech && (
                      <Text style={styles.vocabularyPartOfSpeech}>{item.part_of_speech}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteVocabularyWord(item.id)}
                  >
                    <Text style={styles.deleteButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              )}
              style={styles.vocabularyList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile & Settings</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'profile' && styles.activeTabButton]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'profile' && styles.activeTabButtonText]}>
            Profile
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'settings' && styles.activeTabButton]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'settings' && styles.activeTabButtonText]}>
            Settings
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'vocabulary' && styles.activeTabButton]}
          onPress={() => setActiveTab('vocabulary')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'vocabulary' && styles.activeTabButtonText]}>
            Vocabulary
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'profile' && renderProfileTab()}
      {activeTab === 'settings' && renderSettingsTab()}
      {activeTab === 'vocabulary' && renderVocabularyTab()}

      {/* Language Selector Modal */}
      {showLanguageSelector && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLanguageSelector(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.languageList}>
              {AVAILABLE_LANGUAGES.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    settings?.target_language === language.code && styles.selectedLanguageOption
                  ]}
                  onPress={() => selectLanguage(language.code)}
                >
                  <Text style={[
                    styles.languageOptionName,
                    settings?.target_language === language.code && styles.selectedLanguageOptionName
                  ]}>
                    {language.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#007AFF',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  section: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 16,
    color: '#333',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modelBreakdown: {
    marginTop: 16,
  },
  modelItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modelName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  modelStats: {
    fontSize: 12,
    color: '#666',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  languageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  changeText: {
    fontSize: 14,
    color: '#007AFF',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  customInstructionsButton: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  customInstructionsButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  customInstructionsContainer: {
    gap: 12,
  },
  customInstructionsInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  customInstructionsButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  vocabularyListContainer: {
    flex: 1,
    minHeight: 200,
  },
  vocabularyList: {
    flex: 1,
  },
  vocabularyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  vocabularyInfo: {
    flex: 1,
    marginRight: 12,
  },
  vocabularyWord: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  vocabularyTranslation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  vocabularyPartOfSpeech: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 20,
    color: '#ff3b30',
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  languageList: {
    padding: 20,
  },
  languageOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  selectedLanguageOption: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  languageOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedLanguageOptionName: {
    color: '#007AFF',
  },
  subSettingsContainer: {
    marginTop: 16,
    marginBottom: 16,
    paddingLeft: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  subSettingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subSettingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
}); 