import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useAuth } from '../contexts/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import LoadingView from '../components/LoadingView'
import { colors } from '../theme'

import LoginScreen from '../screens/Auth/LoginScreen'
import RegisterScreen from '../screens/Auth/RegisterScreen'
import CalendarScreen from '../screens/Main/CalendarScreen'
import LogScreen from '../screens/Main/LogScreen'
import MoreScreen from '../screens/Main/MoreScreen'
import ExercisesScreen from '../screens/Main/ExercisesScreen'
import TemplatesScreen from '../screens/Main/TemplatesScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
  const { t } = useTranslation()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
      }}
    >
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ tabBarLabel: t('nav.home'), tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} /> }}
      />
      {/*
        date를 넘기지 않는다. initialParams는 최초 마운트에만 적용되므로
        앱을 켜둔 채 자정을 넘기면 어제 날짜에 갇힌다.
        LogScreen이 화면에 들어올 때마다 오늘을 다시 계산하도록 맡긴다.
      */}
      <Tab.Screen
        name="Log"
        component={LogScreen}
        options={{ tabBarLabel: t('nav.log'), tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{ tabBarLabel: t('nav.profile'), tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  )
}

const AuthStack = createNativeStackNavigator()
const AppStack = createNativeStackNavigator()

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  )
}

function AppNavigatorInner() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="Main" component={MainTabs} />
      <AppStack.Screen name="Exercises" component={ExercisesScreen} />
      <AppStack.Screen name="Templates" component={TemplatesScreen} />
      <AppStack.Screen name="LogDetail" component={LogScreen} />
    </AppStack.Navigator>
  )
}

export default function AppNavigator() {
  const { token, loading } = useAuth()
  const isLoggedIn = !!token

  if (loading) return <LoadingView />

  return (
    <NavigationContainer>
      {isLoggedIn ? <AppNavigatorInner /> : <AuthNavigator />}
    </NavigationContainer>
  )
}
