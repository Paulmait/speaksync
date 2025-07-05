import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';

interface RichTextToolbarProps {
  onInsertBold: () => void;
  onInsertItalic: () => void;
}

export default function RichTextToolbar({ onInsertBold, onInsertItalic }: RichTextToolbarProps) {
  return (
    <View style={styles.toolbar}>
      <IconButton
        icon="format-bold"
        mode="contained"
        size={20}
        onPress={onInsertBold}
        iconColor="#374151"
        containerColor="#f3f4f6"
      />
      <IconButton
        icon="format-italic"
        mode="contained"
        size={20}
        onPress={onInsertItalic}
        iconColor="#374151"
        containerColor="#f3f4f6"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    gap: 4,
  },
});
