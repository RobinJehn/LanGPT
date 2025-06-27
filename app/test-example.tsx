import ExampleConversationLoader from '@/components/ExampleConversationLoader';
import { ExampleMessage } from '@/services/exampleConversation';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TestExampleScreen() {
  const [messages, setMessages] = useState<ExampleMessage[]>([]);
  const [settings, setSettings] = useState<any>(null);

  const handleLoadConversation = (conversation: ExampleMessage[]) => {
    setMessages(conversation);
  };

  const handleLoadSettings = (newSettings: any) => {
    setSettings(newSettings);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ExampleConversationLoader 
          onLoadConversation={handleLoadConversation}
          onLoadSettings={handleLoadSettings}
        />
        
        {messages.length > 0 && (
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Messages loaded:</Text>
              <Text style={styles.infoValue}>{messages.length}</Text>
            </View>
            
            {settings && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Settings:</Text>
                <Text style={styles.infoValue}>
                  {Object.entries(settings)
                    .filter(([key, value]) => typeof value === 'boolean' && value)
                    .map(([key]) => key.replace(/_/g, ' '))
                    .join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
  },
}); 