import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { BRAND_ASSETS, BRAND_COLORS, BRAND_FONTS } from '../../constants/branding';

interface BrandedHeaderProps {
  title?: string;
  showLogo?: boolean;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: {
    icon: string;
    onPress: () => void;
    testID?: string;
  };
}

export default function BrandedHeader({
  title,
  showLogo = false,
  showBackButton = false,
  onBackPress,
  rightAction,
}: BrandedHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBackButton && onBackPress && (
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={BRAND_COLORS.PRIMARY_BLUE}
            onPress={onBackPress}
          />
        )}
        {showLogo && (
          <TouchableOpacity style={styles.logoContainer}>
            <Image
              source={BRAND_ASSETS.LOGO.ICON}
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.centerSection}>
        {title && (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>

      <View style={styles.rightSection}>
        {rightAction && (
          <IconButton
            icon={rightAction.icon}
            size={24}
            iconColor={BRAND_COLORS.PRIMARY_BLUE}
            onPress={rightAction.onPress}
            {...(rightAction.testID && { testID: rightAction.testID })}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BRAND_COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.GRAY_LIGHT,
    elevation: 2,
    shadowColor: BRAND_COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  logoContainer: {
    marginLeft: 8,
  },
  logo: {
    width: 32,
    height: 32,
  },
  title: {
    fontSize: BRAND_FONTS.SIZE.LARGE,
    fontWeight: BRAND_FONTS.WEIGHT.SEMIBOLD,
    color: BRAND_COLORS.BLACK,
    textAlign: 'center',
  },
});
