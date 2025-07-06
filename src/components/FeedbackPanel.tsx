import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  Portal,
  Modal,
  IconButton,
  RadioButton,
  Chip,
  Surface,
  Divider,
} from 'react-native-paper';
import FeedbackService from '../services/feedbackService';
import {
  FeedbackSubmission,
  FeedbackCategory,
  FeedbackAttachment,
} from '../types';

interface FeedbackPanelProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmitted?: (feedbackId: string) => void;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  visible,
  onDismiss,
  onSubmitted
}) => {
  const [selectedType, setSelectedType] = useState<FeedbackSubmission['type']>('general_feedback');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<FeedbackSubmission['priority']>('medium');
  const [email, setEmail] = useState('');
  const [allowFollowUp, setAllowFollowUp] = useState(true);
  const [categories, setCategories] = useState<FeedbackCategory[]>([]);
  const [attachments, setAttachments] = useState<FeedbackAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackService = FeedbackService.getInstance();

  useEffect(() => {
    if (visible) {
      loadCategories();
      resetForm();
    }
  }, [visible]);

  const loadCategories = () => {
    const cats = feedbackService.getCategories();
    setCategories(cats);
  };

  const resetForm = () => {
    setSelectedType('general_feedback');
    setSelectedCategory('general');
    setTitle('');
    setDescription('');
    setPriority('medium');
    setEmail('');
    setAllowFollowUp(true);
    setAttachments([]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your feedback.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please describe your feedback.');
      return;
    }

    setIsSubmitting(true);
    try {
      const feedbackId = await feedbackService.submitFeedback(
        selectedType,
        selectedCategory,
        title.trim(),
        description.trim(),
        priority,
        attachments,
        email.trim() ? {
          email: email.trim(),
          allowFollowUp,
          preferredContactMethod: 'email'
        } : undefined
      );

      Alert.alert(
        'Feedback Submitted',
        'Thank you for your feedback! We\'ll review it and get back to you if needed.',
        [{ text: 'OK', onPress: onDismiss }]
      );

      if (onSubmitted) {
        onSubmitted(feedbackId);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
      console.error('Feedback submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <Card style={styles.mainCard}>
          <Card.Content>
            <View style={styles.header}>
              <Text style={styles.title}>📝 Send Feedback</Text>
              <IconButton
                icon="close"
                onPress={onDismiss}
                style={styles.closeButton}
              />
            </View>

            <ScrollView style={styles.scrollView}>
              <Card style={styles.sectionCard}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Feedback Type</Text>
                  <RadioButton.Group
                    onValueChange={(value) => setSelectedType(value as FeedbackSubmission['type'])}
                    value={selectedType}
                  >
                    <View style={styles.radioOption}>
                      <RadioButton value="bug_report" />
                      <Text style={styles.radioLabel}>🐛 Bug Report</Text>
                    </View>
                    <View style={styles.radioOption}>
                      <RadioButton value="feature_request" />
                      <Text style={styles.radioLabel}>💡 Feature Request</Text>
                    </View>
                    <View style={styles.radioOption}>
                      <RadioButton value="improvement_suggestion" />
                      <Text style={styles.radioLabel}>⚡ Improvement Suggestion</Text>
                    </View>
                    <View style={styles.radioOption}>
                      <RadioButton value="general_feedback" />
                      <Text style={styles.radioLabel}>💬 General Feedback</Text>
                    </View>
                  </RadioButton.Group>
                </Card.Content>
              </Card>

              <Card style={styles.sectionCard}>
                <Card.Content>
                  <TextInput
                    label="Title"
                    value={title}
                    onChangeText={setTitle}
                    style={styles.input}
                    mode="outlined"
                    placeholder="Brief description of your feedback"
                  />

                  <TextInput
                    label="Description"
                    value={description}
                    onChangeText={setDescription}
                    style={styles.textArea}
                    mode="outlined"
                    multiline
                    numberOfLines={6}
                    placeholder="Please provide detailed information..."
                  />

                  <TextInput
                    label="Email (Optional)"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    mode="outlined"
                    keyboardType="email-address"
                    placeholder="your@email.com"
                  />
                </Card.Content>
              </Card>
            </ScrollView>

            <Divider style={styles.divider} />

            <View style={styles.footer}>
              <Button
                mode="outlined"
                onPress={onDismiss}
                style={styles.cancelButton}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                loading={isSubmitting}
                disabled={isSubmitting || !title.trim() || !description.trim()}
              >
                Submit Feedback
              </Button>
            </View>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 20,
  },
  mainCard: {
    flex: 1,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    margin: 0,
  },
  scrollView: {
    flex: 1,
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  input: {
    marginBottom: 16,
  },
  textArea: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#2196F3',
  },
});

export default FeedbackPanel;
