import { authService } from '@/services/auth';
import { languageLearningService, StructuredResponse } from '@/services/openai';
import { AVAILABLE_LANGUAGES, settingsService, UserSettings } from '@/services/settings';
import { UserProfile } from '@/services/supabase';
import { usageService } from '@/services/usage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  structuredResponse?: StructuredResponse;
}

export default function HomeScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedModel, setSelectedModel] = useState('gpt-4.1-nano');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const insets = useSafeAreaInsets();

  const loadUserSettings = useCallback(async () => {
    if (!user) return;
    const { settings } = await settingsService.getUserSettings(user.user_id);
    if (settings) {
      setUserSettings(settings);
      languageLearningService.updateSettings(settings);
    }
  }, [user, setUserSettings]);

  const checkAuth = useCallback(async () => {
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) {
      router.replace('/auth/login');
      return;
    }
    setUser(currentUser);
    await loadUserSettings();
  }, [setUser, loadUserSettings]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Reload settings when returning to this screen
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadUserSettings();
      }
    }, [user, loadUserSettings])
  );

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Always use the latest settings
      const structuredResponse = await languageLearningService.sendMessage(
        inputText, 
        user?.user_id,
        selectedModel,
        userSettings || undefined
      );
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: structuredResponse.response,
        isUser: false,
        timestamp: new Date(),
        structuredResponse: structuredResponse,
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert(
        'Error',
        'Failed to get response from AI assistant. Please check your API key and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewConversation = () => {
    languageLearningService.startNewConversation();
    // Re-apply user settings to the new conversation
    if (userSettings) {
      languageLearningService.updateSettings(userSettings);
    }
    setMessages([]);
  };

  const getAvailableModels = () => {
    return usageService.getAvailableModels();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    }).format(amount);
  };

  const estimateMessageCost = () => {
    if (!inputText.trim()) return 0;
    // Rough estimate: 1 word ≈ 1.3 tokens, response ≈ 2x input length
    const estimatedInputTokens = Math.ceil(inputText.split(' ').length * 1.3);
    const estimatedOutputTokens = estimatedInputTokens * 2;
    return usageService.estimateCost(selectedModel, estimatedInputTokens, estimatedOutputTokens);
  };

  const getLanguageName = (code: string) => {
    const language = AVAILABLE_LANGUAGES.find(lang => lang.code === code);
    return language ? language.name : code;
  };

  const renderCorrections = (corrections: any[]) => (
    <View style={styles.correctionsContainer}>
      <Text style={styles.correctionsTitle}>Corrections:</Text>
      {corrections.map((correction, index) => (
        <View key={index} style={styles.correctionItem}>
          <View style={styles.correctionText}>
            <Text style={styles.originalText}>&quot;{correction.original || ''}&quot;</Text>
            <Text style={styles.correctionArrow}> → </Text>
            <Text style={styles.correctedText}>&quot;{correction.corrected || ''}&quot;</Text>
          </View>
          <Text style={styles.explanationText}>{correction.explanation || ''}</Text>
        </View>
      ))}
    </View>
  );

  const renderVocabulary = (vocabulary: any[]) => (
    <View style={styles.vocabularyContainer}>
      <Text style={styles.vocabularyTitle}>Vocabulary:</Text>
      {vocabulary.map((vocab, index) => (
        <View key={index} style={styles.vocabularyItem}>
          <Text style={styles.vocabularyWord}>{vocab.word || ''}</Text>
          {vocab.translation && (
            <Text style={styles.vocabularyTranslation}> - {vocab.translation}</Text>
          )}
          {vocab.part_of_speech && (
            <Text style={styles.vocabularyPartOfSpeech}> ({vocab.part_of_speech})</Text>
          )}
          {vocab.example_sentence && (
            <Text style={styles.vocabularyExample}>&quot;{vocab.example_sentence}&quot;</Text>
          )}
        </View>
      ))}
    </View>
  );

  const renderNaturalAlternatives = (alternatives: any[]) => (
    <View style={styles.alternativesContainer}>
      <Text style={styles.alternativesTitle}>Natural Alternatives:</Text>
      {alternatives.map((alt, index) => (
        <View key={index} style={styles.alternativeItem}>
          <Text style={styles.originalText}>&quot;{alt.original || ''}&quot;</Text>
          <Text style={styles.alternativesText}>
            Better: {Array.isArray(alt.alternatives) ? alt.alternatives.join(', ') : ''}
          </Text>
          <Text style={styles.explanationText}>{alt.explanation || ''}</Text>
        </View>
      ))}
    </View>
  );

  const renderVerbConjugations = (conjugations: any[]) => (
    <View style={styles.conjugationsContainer}>
      <Text style={styles.conjugationsTitle}>Verb Conjugations:</Text>
      {conjugations.map((conj, index) => (
        <View key={index} style={styles.conjugationItem}>
          <Text style={styles.verbText}>{conj.verb || ''} ({conj.tense || ''})</Text>
          <Text style={styles.conjugationsText}>
            {Array.isArray(conj.conjugations) ? conj.conjugations.join(', ') : ''}
          </Text>
          <Text style={styles.explanationText}>{conj.explanation || ''}</Text>
        </View>
      ))}
    </View>
  );

  const renderTenseExplanation = (explanations: any[]) => (
    <View style={styles.tenseContainer}>
      <Text style={styles.tenseTitle}>Tense Usage:</Text>
      {explanations.map((exp, index) => (
        <View key={index} style={styles.tenseItem}>
          <Text style={styles.incorrectText}>&quot;{exp.incorrect_usage || ''}&quot;</Text>
          <Text style={styles.correctTenseText}>Use: {exp.correct_tense || ''}</Text>
          <Text style={styles.explanationText}>{exp.explanation || ''}</Text>
          {exp.examples && Array.isArray(exp.examples) && exp.examples.length > 0 && (
            <Text style={styles.examplesText}>Examples: {exp.examples.join(', ')}</Text>
          )}
        </View>
      ))}
    </View>
  );

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.botMessage]}>
      <Text style={[styles.messageText, item.isUser ? styles.userMessageText : styles.botMessageText]}>
        {item.text}
      </Text>
      
      {/* Render structured learning features for bot messages */}
      {!item.isUser && item.structuredResponse && (
        <View style={styles.learningFeatures}>
          {userSettings?.always_correct_sentences && 
           item.structuredResponse.corrections && 
           item.structuredResponse.corrections.length > 0 && 
            renderCorrections(item.structuredResponse.corrections)}
          
          {userSettings?.track_vocabulary && 
           item.structuredResponse.vocabulary && 
           item.structuredResponse.vocabulary.length > 0 && 
            renderVocabulary(item.structuredResponse.vocabulary)}
          
          {userSettings?.suggest_natural_alternatives && 
           item.structuredResponse.natural_alternatives && 
           item.structuredResponse.natural_alternatives.length > 0 && 
            renderNaturalAlternatives(item.structuredResponse.natural_alternatives)}
          
          {userSettings?.show_verb_conjugations && 
           item.structuredResponse.verb_conjugations && 
           item.structuredResponse.verb_conjugations.length > 0 && 
            renderVerbConjugations(item.structuredResponse.verb_conjugations)}
          
          {userSettings?.explain_tense_usage && 
           item.structuredResponse.tense_explanation && 
           item.structuredResponse.tense_explanation.length > 0 && 
            renderTenseExplanation(item.structuredResponse.tense_explanation)}
        </View>
      )}
      
      <Text style={styles.timestamp}>
        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  // Platform-aware input padding
  const inputPaddingBottom = Platform.OS === 'ios'
    ? insets.bottom > 0 ? insets.bottom : 16
    : 16;

  if (!user) {
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <Text style={styles.title}>LanGPT</Text>
          <Text style={styles.subtitle}>
            Learning {getLanguageName(userSettings?.target_language || 'spanish')}
          </Text>
          
          <View style={styles.headerControls}>
            <TouchableOpacity 
              style={styles.modelButton} 
              onPress={() => setShowModelSelector(true)}
            >
              <Text style={styles.modelButtonText}>{selectedModel}</Text>
            </TouchableOpacity>
            
            {messages.length > 0 && (
              <TouchableOpacity style={styles.newChatButton} onPress={startNewConversation}>
                <Text style={styles.newChatButtonText}>New Chat</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          inverted={false}
        />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>AI is thinking...</Text>
          </View>
        )}

        <View style={[styles.inputContainer, { paddingBottom: inputPaddingBottom }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              onKeyPress={handleKeyPress}
              placeholder={`Ask me anything about ${getLanguageName(userSettings?.target_language || 'spanish')}...`}
              placeholderTextColor="#999"
              multiline
              maxLength={500}
              returnKeyType="send"
            />
            {inputText.trim() && (
              <Text style={styles.costEstimate}>
                Est: {formatCurrency(estimateMessageCost())}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Model Selector Modal */}
      <Modal
        visible={showModelSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModelSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select AI Model</Text>
              <TouchableOpacity onPress={() => setShowModelSelector(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modelList}>
              {getAvailableModels().map((model) => (
                <TouchableOpacity
                  key={model.name}
                  style={[
                    styles.modelOption,
                    selectedModel === model.name && styles.selectedModelOption
                  ]}
                  onPress={() => {
                    setSelectedModel(model.name);
                    setShowModelSelector(false);
                  }}
                >
                  <Text style={[
                    styles.modelOptionName,
                    selectedModel === model.name && styles.selectedModelOptionName
                  ]}>
                    {model.name}
                  </Text>
                  <Text style={styles.modelOptionPricing}>
                    Input: ${model.input_price}/1K | Output: ${model.output_price}/1K
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  modelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  modelButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  newChatButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
  },
  newChatButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
    marginRight: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f9f9f9',
  },
  costEstimate: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
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
  modelList: {
    padding: 20,
  },
  modelOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  selectedModelOption: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  modelOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedModelOptionName: {
    color: '#007AFF',
  },
  modelOptionPricing: {
    fontSize: 14,
    color: '#666',
  },
  learningFeatures: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  correctionsContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  correctionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  correctionItem: {
    marginBottom: 8,
  },
  correctionText: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  originalText: {
    fontSize: 14,
    color: '#dc3545',
    textDecorationLine: 'line-through',
  },
  correctionArrow: {
    marginHorizontal: 8,
    color: '#856404',
    fontWeight: 'bold',
  },
  correctedText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
  },
  explanationText: {
    fontSize: 12,
    color: '#856404',
    fontStyle: 'italic',
  },
  vocabularyContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#d1ecf1',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#17a2b8',
    width: '100%',
    alignSelf: 'stretch',
  },
  vocabularyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0c5460',
    marginBottom: 8,
  },
  vocabularyItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  vocabularyWord: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c5460',
  },
  vocabularyTranslation: {
    fontSize: 12,
    color: '#6c757d',
  },
  vocabularyPartOfSpeech: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  vocabularyExample: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    fontStyle: 'italic',
  },
  alternativesContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#d4edda',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  alternativesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 8,
  },
  alternativeItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  alternativesText: {
    fontSize: 12,
    color: '#155724',
    fontWeight: '500',
    marginTop: 4,
  },
  conjugationsContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8d7da',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  conjugationsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#721c24',
    marginBottom: 8,
  },
  conjugationItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  verbText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#721c24',
  },
  conjugationsText: {
    fontSize: 12,
    color: '#721c24',
    marginTop: 4,
  },
  tenseContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#e2e3e5',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6c757d',
  },
  tenseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
  },
  tenseItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  incorrectText: {
    fontSize: 14,
    color: '#dc3545',
    textDecorationLine: 'line-through',
  },
  correctTenseText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
    marginTop: 4,
  },
  examplesText: {
    fontSize: 12,
    color: '#495057',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
