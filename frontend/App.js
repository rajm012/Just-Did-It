import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { setContext } from '@apollo/client/link/context';
import { CommonActions, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import MoviesScreen from './screens/MoviesScreen';
import BooksScreen from './screens/BooksScreen';
import AddEditScreen from './screens/AddEditScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import { Ionicons } from '@expo/vector-icons';


const MYIP = '172.16.23.134';

const httpLink = createHttpLink({
  uri: `http://${MYIP}:4000/graphql`,
});

const authLink = setContext(async (_, { headers }) => {
  const token = await AsyncStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();


// export across the app for easy access
export const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
  'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller'
];

function MainTabs() {
  const handleLogout = async (navigation) => {
    await AsyncStorage.removeItem('token');
    await client.clearStore();
    navigation.getParent()?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  };

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        headerShown: true,
        headerTitleAlign: 'center',
        headerRight: ({ tintColor }) => (
          <TouchableOpacity
            onPress={() => handleLogout(navigation)}
            style={{ marginRight: 16 }}
          >
            <Ionicons name="log-out-outline" size={24} color={tintColor || '#007AFF'} />
          </TouchableOpacity>
        ),
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Movies') iconName = 'film';
          else if (route.name === 'Books') iconName = 'book';
          else if (route.name === 'Favorites') iconName = focused ? 'heart' : 'heart-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Movies" component={MoviesScreen} />
      <Tab.Screen name="Books" component={BooksScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <ApolloProvider client={client}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="AddEdit" component={AddEditScreen} options={{ title: 'Add/Edit Item' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </ApolloProvider>
  );
}
