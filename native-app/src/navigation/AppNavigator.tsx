import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomesScreen from '../screens/HomesScreen';
import DetailsScreen from '../screens/DetailsScreen';
import EvaluateScreen from '../screens/EvaluateScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomesList" 
        component={HomesScreen} 
        options={{ title: 'Homes' }}
      />
      <Stack.Screen 
        name="Details" 
        component={DetailsScreen} 
        options={{ title: 'Home Details' }}
      />
      <Stack.Screen 
        name="Evaluate" 
        component={EvaluateScreen} 
        options={{ title: 'Evaluate Home' }}
      />
    </Stack.Navigator>
  );
}

// Placeholder screens for other tabs
function AddHomeScreen() {
  return null; // We'll implement this later
}

function SettingsScreen() {
  return null; // We'll implement this later
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Homes') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Add') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Homes" component={HomesStack} />
      <Tab.Screen name="Add" component={AddHomeScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
} 