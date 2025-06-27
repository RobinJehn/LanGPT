import { exampleConversation, exampleSettings, getExampleConversation } from '@/services/exampleConversation';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ExampleConversationLoaderProps {
  onLoadConversation: (messages: any[]) => void;
  onLoadSettings: (settings: any) => void;
}

export default function ExampleConversationLoader({ onLoadConversation, onLoadSettings }: ExampleConversationLoaderProps) {
  const loadFullExample = () => {
    onLoadConversation(exampleConversation);
    onLoadSettings(exampleSettings.allFeatures);
    Alert.alert('Success', 'Loaded full example conversation with all features enabled');
  };

  const loadCorrectionsOnly = () => {
    const filteredConversation = getExampleConversation({
      always_correct_sentences: true,
      track_vocabulary: false,
      suggest_natural_alternatives: false,
      show_verb_conjugations: false,
      explain_tense_usage: false,
    });
    onLoadConversation(filteredConversation);
    onLoadSettings(exampleSettings.correctionsOnly);
    Alert.alert('Success', 'Loaded example conversation with corrections only');
  };

  const loadVocabularyOnly = () => {
    const filteredConversation = getExampleConversation({
      always_correct_sentences: false,
      track_vocabulary: true,
      suggest_natural_alternatives: false,
      show_verb_conjugations: false,
      explain_tense_usage: false,
    });
    onLoadConversation(filteredConversation);
    onLoadSettings(exampleSettings.vocabularyOnly);
    Alert.alert('Success', 'Loaded example conversation with vocabulary tracking only');
  };

  const loadConjugationsOnly = () => {
    const filteredConversation = getExampleConversation({
      always_correct_sentences: false,
      track_vocabulary: false,
      suggest_natural_alternatives: false,
      show_verb_conjugations: true,
      explain_tense_usage: false,
    });
    onLoadConversation(filteredConversation);
    onLoadSettings(exampleSettings.conjugationsOnly);
    Alert.alert('Success', 'Loaded example conversation with verb conjugations only');
  };

  const loadNaturalAlternativesOnly = () => {
    const filteredConversation = getExampleConversation({
      always_correct_sentences: false,
      track_vocabulary: false,
      suggest_natural_alternatives: true,
      show_verb_conjugations: false,
      explain_tense_usage: false,
    });
    onLoadConversation(filteredConversation);
    onLoadSettings({
      ...exampleSettings.vocabularyOnly,
      suggest_natural_alternatives: true,
    });
    Alert.alert('Success', 'Loaded example conversation with natural alternatives only');
  };

  const loadTenseExplanationsOnly = () => {
    const filteredConversation = getExampleConversation({
      always_correct_sentences: false,
      track_vocabulary: false,
      suggest_natural_alternatives: false,
      show_verb_conjugations: false,
      explain_tense_usage: true,
    });
    onLoadConversation(filteredConversation);
    onLoadSettings({
      ...exampleSettings.vocabularyOnly,
      explain_tense_usage: true,
    });
    Alert.alert('Success', 'Loaded example conversation with tense explanations only');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Load Example Conversation</Text>
      <Text style={styles.subtitle}>Choose a configuration to test different UI features:</Text>
      
      <TouchableOpacity style={styles.button} onPress={loadFullExample}>
        <Text style={styles.buttonText}>All Features</Text>
        <Text style={styles.buttonSubtext}>Corrections, vocabulary, conjugations, alternatives, tense explanations</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={loadCorrectionsOnly}>
        <Text style={styles.buttonText}>Corrections Only</Text>
        <Text style={styles.buttonSubtext}>Grammar and spelling corrections</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={loadVocabularyOnly}>
        <Text style={styles.buttonText}>Vocabulary Only</Text>
        <Text style={styles.buttonSubtext}>Word tracking and translations</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={loadConjugationsOnly}>
        <Text style={styles.buttonText}>Verb Conjugations Only</Text>
        <Text style={styles.buttonSubtext}>Verb conjugation tables</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={loadNaturalAlternativesOnly}>
        <Text style={styles.buttonText}>Natural Alternatives Only</Text>
        <Text style={styles.buttonSubtext}>More natural phrase suggestions</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={loadTenseExplanationsOnly}>
        <Text style={styles.buttonText}>Tense Explanations Only</Text>
        <Text style={styles.buttonSubtext}>Tense usage explanations</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
}); 