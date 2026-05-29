import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MQTTProvider } from './src/components/MQTTContext'; // Import the provider

import DashboardScreen from './src/screens/DashboardScreen';
import ConfigScreen from './src/screens/ConfigScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <MQTTProvider> 
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Dashboard">
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Config" component={ConfigScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </MQTTProvider>
  );
}