import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { registerRootComponent } from 'expo';
import { supabase } from './src/lib/supabase-simple';
import AppNavigator from './src/navigation/AppNavigator';

const Stack = createStackNavigator();

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      
      // Check if we have real Supabase credentials
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const hasRealCredentials = supabaseUrl && 
                                supabaseUrl !== 'https://your-project.supabase.co' &&
                                supabaseUrl.includes('.supabase.co');
      
      console.log('Supabase URL:', supabaseUrl);
      console.log('Has real credentials:', hasRealCredentials);
      
      if (!hasRealCredentials) {
        // Simulate successful login for testing
        console.log('Running in demo mode - no real Supabase connection');
        await new Promise(resolve => setTimeout(resolve, 1000));
        Alert.alert('Success', 'Demo login successful!', [
          { text: 'OK', onPress: () => navigation.replace('Main') }
        ]);
        return;
      }

      // Only try real Supabase login if we have valid credentials
      console.log('Attempting real Supabase login');
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log('Supabase error:', error);
        throw new Error(error.message || 'Login failed');
      }
      
      Alert.alert('Success', 'Login successful!', [
        { text: 'OK', onPress: () => navigation.replace('Main') }
      ]);
    } catch (error) {
      console.log('Login error:', error);
      Alert.alert('Error', error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Home Review</Text>
        <Text style={styles.subtitle}>Native App</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.note}>
          {process.env.EXPO_PUBLIC_SUPABASE_URL?.includes('.supabase.co') 
            ? 'Connected to Supabase' 
            : 'Demo mode - Configure Supabase for full functionality'}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
});

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={AppNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default registerRootComponent(App); 