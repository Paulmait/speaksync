import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { RootStackParamList } from '../types';
import { useScriptStore } from '../store/scriptStore';
import { 
  HomeScreen, 
  ScriptEditorScreen, 
  TeleprompterScreen,
  AuthScreen,
  SignInScreen,
  SignUpScreen,
  ProfileScreen
} from '../screens';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  colors: {
    primary: '#6366f1',
    secondary: '#f59e0b',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1f2937',
    placeholder: '#6b7280',
  },
};

export default function AppNavigator() {
  const { authState } = useScriptStore();
  const isAuthenticated = !!authState.user;

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: '#ffffff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          {isAuthenticated ? (
            // Authenticated Stack
            <>
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{
                  title: 'SpeakSync',
                  headerRight: () => (
                    <ProfileButton />
                  ),
                }}
              />
              <Stack.Screen
                name="ScriptEditor"
                component={ScriptEditorScreen}
                options={{
                  title: 'Script Editor',
                }}
              />
              <Stack.Screen
                name="Teleprompter"
                component={TeleprompterScreen}
                options={{
                  title: 'Teleprompter',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                  title: 'Profile',
                }}
              />
            </>
          ) : (
            // Authentication Stack
            <>
              <Stack.Screen
                name="Auth"
                component={AuthScreen}
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="SignIn"
                component={SignInScreen}
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="SignUp"
                component={SignUpScreen}
                options={{
                  headerShown: false,
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

// Profile Button Component
import { IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

function ProfileButton() {
  const navigation = useNavigation();
  
  return (
    <IconButton
      icon="account-circle"
      size={24}
      iconColor="#ffffff"
      onPress={() => navigation.navigate('Profile' as never)}
    />
  );
}
