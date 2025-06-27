import { authService } from '@/services/auth';
import { exampleConversation } from '@/services/exampleConversation';
import { languageLearningService, StructuredResponse } from '@/services/openai';
import { AVAILABLE_LANGUAGES, settingsService, UserSettings } from '@/services/settings';
import { UserProfile } from '@/services/supabase';
import { usageService } from '@/services/usage';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [isMockMode, setIsMockMode] = useState(false);
  const settingsLoadedRef = useRef(false);

  const loadUserSettings = useCallback(async () => {
    if (!user || settingsLoadedRef.current) return;
    try {
      const { settings } = await settingsService.getUserSettings(user.user_id);
      if (settings) {
        setUserSettings(settings);
        languageLearningService.updateSettings(settings);
        settingsLoadedRef.current = true;
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  }, [user]);

  const checkAuth = useCallback(async () => {
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) {
      router.replace('/auth/login');
      return;
    }
    setUser(currentUser);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Load settings when user changes
  useEffect(() => {
    if (user) {
      settingsLoadedRef.current = false;
      loadUserSettings();
    }
  }, [user, loadUserSettings]);

  // Reload settings when returning to this screen (but only if not already loaded)
  useFocusEffect(
    React.useCallback(() => {
      if (user && !settingsLoadedRef.current) {
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
      let structuredResponse: StructuredResponse;

      if (isMockMode) {
        // Generate mock response based on user input
        structuredResponse = generateMockResponse(inputText, userSettings || undefined);
      } else {
        // Use real API
        structuredResponse = await languageLearningService.sendMessage(
          inputText, 
          user?.user_id,
          selectedModel,
          userSettings || undefined
        );
      }
      
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

  // Generate mock response for testing
  const generateMockResponse = (userInput: string, settings?: UserSettings): StructuredResponse => {
    const lowerInput = userInput.toLowerCase();
    const targetLanguage = settings?.target_language || 'spanish';
    
    // Base response
    let response = `¡Excelente pregunta! Te ayudo con eso.`;
    
    // Mock structured response
    const mockResponse: StructuredResponse = {
      response: response
    };

    // Add corrections if enabled and input contains common mistakes
    if (settings?.always_correct_sentences) {
      if (lowerInput.includes('hola') && !lowerInput.includes('¡')) {
        mockResponse.corrections = [{
          original: userInput,
          corrected: userInput.replace('hola', '¡Hola!'),
          explanation: 'Missing opening exclamation mark for greetings.',
          has_issue: true
        }];
      } else if (lowerInput.includes('como') && lowerInput.includes('estas')) {
        mockResponse.corrections = [{
          original: userInput,
          corrected: userInput.replace('como', '¿cómo?'),
          explanation: 'Missing accent on "cómo" and question marks.',
          has_issue: true
        }];
      }
    }

    // Add vocabulary if enabled
    if (settings?.track_vocabulary) {
      const words = userInput.split(' ').filter(word => word.length > 2);
      if (words.length > 0) {
        mockResponse.vocabulary = words.slice(0, 3).map(word => ({
          word: word,
          translation: `[${word} translation]`,
          part_of_speech: 'noun'
        }));
      }
    }

    // Add verb conjugations if enabled
    if (settings?.show_verb_conjugations) {
      if (lowerInput.includes('estar') || lowerInput.includes('ser')) {
        mockResponse.verb_conjugations = [{
          verb: 'estar',
          tense: 'present',
          conjugations: [
            { pronoun: 'yo', form: 'estoy' },
            { pronoun: 'tú', form: 'estás' },
            { pronoun: 'él/ella/usted', form: 'está' },
            { pronoun: 'nosotros', form: 'estamos' },
            { pronoun: 'vosotros', form: 'estáis' },
            { pronoun: 'ellos/ellas/ustedes', form: 'están' }
          ],
          explanation: 'Use "estar" for temporary states and locations.'
        }];
      }
    }

    // Add natural alternatives if enabled
    if (settings?.suggest_natural_alternatives && mockResponse.corrections) {
      mockResponse.natural_alternatives = [{
        original: userInput,
        alternatives: [
          '¿Cómo estás?',
          '¿Qué tal estás?',
          '¿Cómo te va?'
        ],
        explanation: 'These are more natural ways to ask how someone is doing.',
        has_issue: true
      }];
    }

    // Add tense explanations if enabled
    if (settings?.explain_tense_usage) {
      if (lowerInput.includes('ayer') && lowerInput.includes('voy')) {
        mockResponse.tense_explanation = [{
          original: 'presente',
          correct_tense: 'pretérito',
          explanation: 'Use the preterite tense for completed actions in the past.',
          examples: ['Ayer fui al parque.', 'La semana pasada visité a mi familia.'],
          has_issue: true
        }];
      }
    }

    return mockResponse;
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

  const loadExampleConversation = () => {
    setMessages(exampleConversation);
    // Set example settings to enable all features
    const exampleSettings: UserSettings = {
      id: 'mock-settings-id',
      user_id: user?.user_id || 'mock-user-id',
      target_language: 'spanish',
      always_correct_sentences: true,
      track_vocabulary: true,
      suggest_natural_alternatives: true,
      show_verb_conjugations: true,
      explain_tense_usage: true,
      correct_accents: true,
      correct_punctuation: true,
      correct_capitalization: true,
      custom_instructions: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setUserSettings(exampleSettings);
    languageLearningService.updateSettings(exampleSettings);
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
    <View style={[styles.card, styles.correctionsContainer]}>
      <View style={styles.cardHeaderRow}>
        <MaterialCommunityIcons name="pencil" size={20} color="#ffc107" style={{ marginRight: 8 }} />
        <Text style={styles.correctionsTitle}>Corrections</Text>
      </View>
      {corrections.map((correction, index) => (
        correction.has_issue && (
          <View key={index} style={styles.correctionItem}>
            <View style={styles.correctionTextRow}>
              <Text style={styles.originalText}>{correction.original || ''}</Text>
              <Feather name="arrow-right" size={16} color="#856404" style={{ marginHorizontal: 8 }} />
              <Text style={styles.correctedText}>{correction.corrected || ''}</Text>
            </View>
            <Text style={styles.correctionExplanation}>{correction.explanation || ''}</Text>
          </View>
        )
      ))}
    </View>
  );

  // const renderVocabulary = (vocabulary: any[]) => (
  //   <View style={styles.vocabularyContainer}>
  //     <Text style={styles.vocabularyTitle}>Vocabulary:</Text>
  //     {vocabulary.map((vocab, index) => (
  //       <View key={index} style={styles.vocabularyItem}>
  //         <Text style={styles.vocabularyWord}>{vocab.word || ''}</Text>
  //         {vocab.translation && (
  //           <Text style={styles.vocabularyTranslation}> - {vocab.translation}</Text>
  //         )}
  //         {vocab.part_of_speech && (
  //           <Text style={styles.vocabularyPartOfSpeech}> ({vocab.part_of_speech})</Text>
  //         )}
  //       </View>
  //     ))}
  //   </View>
  // );

  const renderNaturalAlternatives = (alternatives: any[]) => (
    <View style={[styles.card, styles.alternativesContainer]}>
      <View style={styles.cardHeaderRow}>
        <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color="#17a2b8" style={{ marginRight: 8 }} />
        <Text style={styles.alternativesTitle}>Natural Alternatives</Text>
      </View>
      {alternatives.map((alt, index) => (
        alt.has_issue && (
          <View key={index} style={styles.alternativeItem}>
            <View style={styles.alternativesList}>
              {Array.isArray(alt.alternatives) && alt.alternatives.map((altText: string, i: number) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bulletPoint}>{'\u2022'}</Text>
                  <Text style={styles.alternativesText}>{altText}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.alternativesExplanation}>{alt.explanation || ''}</Text>
          </View>
        )
      ))}
    </View>
  );

  const renderVerbConjugations = (conjugations: any[]) => {
    if (!conjugations || conjugations.length === 0) return null;

    // Group by tense
    const tenseGroups: { [tense: string]: any[] } = {};
    conjugations.forEach(conj => {
      if (!tenseGroups[conj.tense]) tenseGroups[conj.tense] = [];
      tenseGroups[conj.tense].push(conj);
    });

    return (
      <View style={[styles.card, styles.conjugationsContainer]}>
        <View style={styles.cardHeaderRow}>
          <FontAwesome5 name="book-open" size={18} color="#dc3545" style={{ marginRight: 8 }} />
          <Text style={styles.conjugationsTitle}>Verb Conjugations</Text>
        </View>
        {Object.entries(tenseGroups).map(([tense, verbs], groupIdx) => {
          // For imperativo, use only the appropriate pronouns
          let allPronouns: string[] = [];
          if (tense.toLowerCase().includes('imperativo')) {
            allPronouns = ['tú', 'usted', 'vosotros', 'ustedes'];
          } else {
            // Collect all unique pronouns from all verbs in this tense
            allPronouns = Array.from(new Set(
              verbs.flatMap((v: any) => v.conjugations.map((c: any) => c.pronoun))
            ));
          }
          // Remove empty pronouns (for infinitive)
          allPronouns = allPronouns.filter(Boolean);
          return (
            <View key={groupIdx} style={styles.conjugationItem}>
              <View style={styles.conjugationHeaderRow}>
                {verbs.map((v: any, i: number) => (
                  <React.Fragment key={i}>
                    <Text style={styles.verbText}>{v.verb}</Text>
                    <View style={styles.tenseBadge}><Text style={styles.tenseBadgeText}>{v.tense}</Text></View>
                    {i < verbs.length - 1 && <Text style={{ marginHorizontal: 4 }}>|</Text>}
                  </React.Fragment>
                ))}
              </View>
              <View style={{ /* overflow: 'auto' */ }}>
                <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                  <View style={{ width: 90 }} />
                  {verbs.map((v: any, i: number) => (
                    <Text key={i} style={[styles.verbText, { minWidth: 80, textAlign: 'center' }]}>{v.verb}</Text>
                  ))}
                </View>
                {allPronouns.map((pronoun, rowIdx) => (
                  <View key={rowIdx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <Text style={[styles.conjugationForm, { width: 90 }]}>{pronoun}</Text>
                    {verbs.map((v: any, colIdx: number) => {
                      const found = v.conjugations.find((c: any) => c.pronoun === pronoun);
                      return (
                        <Text key={colIdx} style={[styles.conjugationForm, { minWidth: 80, textAlign: 'center' }]}>
                          {found ? found.form : ''}
                        </Text>
                      );
                    })}
                  </View>
                ))}
              </View>
              {verbs.map((v: any, i: number) => (
                <Text key={i} style={styles.conjugationExplanation}>{v.explanation || ''}</Text>
              ))}
            </View>
          );
        })}
      </View>
    );
  };

  const renderTenseExplanation = (explanations: any[]) => (
    <View style={[styles.card, styles.tenseContainer]}>
      <View style={styles.cardHeaderRow}>
        <MaterialCommunityIcons name="clock-outline" size={20} color="#6c757d" style={{ marginRight: 8 }} />
        <Text style={styles.tenseTitle}>Tense Usage</Text>
      </View>
      {explanations.map((exp, index) => (
        exp.has_issue && (
          <View key={index} style={styles.tenseItem}>
            <Text style={styles.incorrectText}>{exp.original_tense || ''}</Text>
            <Text style={styles.correctTenseText}>Use: {exp.correct_tense || ''}</Text>
            <Text style={styles.tenseExplanation}>{exp.explanation || ''}</Text>
            {exp.examples && Array.isArray(exp.examples) && exp.examples.length > 0 && (
              <Text style={styles.examplesText}>Examples: {exp.examples.join(', ')}</Text>
            )}
          </View>
        )
      ))}
    </View>
  );

  const renderMessage = ({ item }: { item: Message }) => {
    // Filter out natural alternatives that are already shown in corrections
    const filteredNaturalAlternatives = item.structuredResponse?.natural_alternatives?.filter(alt => {
      if (!item.structuredResponse?.corrections) return true;
      
      // Check if any of the alternatives match any correction's corrected text
      const correctedTexts = item.structuredResponse.corrections.map(correction => correction.corrected);
      return !alt.alternatives?.some(alternative => 
        correctedTexts.includes(alternative)
      );
    }) || [];

    return (
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
            
            {/*
            {userSettings?.track_vocabulary && 
             item.structuredResponse.vocabulary && 
             item.structuredResponse.vocabulary.length > 0 && 
              renderVocabulary(item.structuredResponse.vocabulary)}
            */}
            
            {userSettings?.suggest_natural_alternatives && 
             filteredNaturalAlternatives.length > 0 && 
              renderNaturalAlternatives(filteredNaturalAlternatives)}
            
            {userSettings?.show_verb_conjugations && 
             item.structuredResponse.verb_conjugations && 
             item.structuredResponse.verb_conjugations.length > 0 && 
              renderVerbConjugations(item.structuredResponse.verb_conjugations)}
            
            {userSettings?.explain_tense_usage && 
             item.structuredResponse.tense_explanation && 
             item.structuredResponse.tense_explanation.length > 0 && 
             item.structuredResponse.tense_explanation.some(
               (exp: any) => exp.original_tense && exp.correct_tense && exp.original_tense !== exp.correct_tense
             ) &&
              renderTenseExplanation(
                item.structuredResponse.tense_explanation.filter(
                  (exp: any) => exp.original_tense && exp.correct_tense && exp.original_tense !== exp.correct_tense
                )
              )}
          </View>
        )}
        
        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

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
            {isMockMode && ' (Mock Mode)'}
          </Text>
          
          <View style={styles.headerControls}>
            <TouchableOpacity 
              style={[styles.mockToggleButton, isMockMode && styles.mockToggleButtonActive]} 
              onPress={() => setIsMockMode(!isMockMode)}
            >
              <Text style={[styles.mockToggleButtonText, isMockMode && styles.mockToggleButtonTextActive]}>
                {isMockMode ? 'Mock' : 'Real'}
              </Text>
            </TouchableOpacity>
            
            {isMockMode && (
              <TouchableOpacity 
                style={styles.loadExampleButton} 
                onPress={loadExampleConversation}
              >
                <Text style={styles.loadExampleButtonText}>Load Example</Text>
              </TouchableOpacity>
            )}
            
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

        <View style={[styles.inputContainer]}>
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
  mockToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  mockToggleButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  mockToggleButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  mockToggleButtonTextActive: {
    color: '#007AFF',
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
  card: {
    borderRadius: 14,
    backgroundColor: '#fff',
    marginBottom: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  correctionsContainer: {
    backgroundColor: '#fffbe6',
    borderLeftWidth: 5,
    borderLeftColor: '#ffc107',
  },
  correctionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
  },
  correctionItem: {
    marginBottom: 8,
  },
  correctionTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  originalText: {
    fontSize: 15,
    color: '#dc3545',
    textDecorationLine: 'line-through',
    marginRight: 4,
  },
  correctedText: {
    fontSize: 15,
    color: '#28a745',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  correctionExplanation: {
    fontSize: 13,
    color: '#856404',
    fontStyle: 'italic',
    marginBottom: 6,
    marginLeft: 24,
  },
  alternativesContainer: {
    backgroundColor: '#e6f9fa',
    borderLeftWidth: 5,
    borderLeftColor: '#17a2b8',
  },
  alternativesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#155724',
  },
  alternativesList: {
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#17a2b8',
    marginRight: 6,
    marginTop: 1,
  },
  alternativesText: {
    fontSize: 15,
    color: '#155724',
    flexShrink: 1,
  },
  alternativesExplanation: {
    fontSize: 13,
    color: '#155724',
    fontStyle: 'italic',
    marginLeft: 24,
    marginBottom: 6,
  },
  conjugationsContainer: {
    backgroundColor: '#fdeaea',
    borderLeftWidth: 5,
    borderLeftColor: '#dc3545',
  },
  conjugationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#721c24',
  },
  conjugationItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  conjugationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  verbText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#721c24',
    marginRight: 8,
  },
  tenseBadge: {
    backgroundColor: '#f8d7da',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  tenseBadgeText: {
    fontSize: 12,
    color: '#dc3545',
    fontWeight: 'bold',
  },
  conjugationTable: {
    flexDirection: 'column',
    marginBottom: 2,
    marginLeft: 12,
  },
  conjugationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  conjugationForm: {
    fontSize: 15,
    color: '#721c24',
    marginRight: 8,
  },
  conjugationExplanation: {
    fontSize: 13,
    color: '#721c24',
    fontStyle: 'italic',
    marginLeft: 24,
    marginBottom: 6,
  },
  tenseContainer: {
    backgroundColor: '#f4f4f6',
    borderLeftWidth: 5,
    borderLeftColor: '#6c757d',
  },
  tenseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
  },
  tenseExplanation: {
    fontSize: 13,
    color: '#495057',
    fontStyle: 'italic',
    marginLeft: 24,
    marginBottom: 6,
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
    fontSize: 13,
    color: '#495057',
    fontStyle: 'italic',
    marginLeft: 24,
    marginBottom: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alternativeItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  loadExampleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  loadExampleButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
