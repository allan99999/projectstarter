---
name: mobile-app-builder
description: Build production-ready mobile apps with React Native and Expo. Covers project setup, navigation, native features, offline sync, push notifications, authentication, and app store deployment. Use when creating a mobile app, building with React Native, setting up Expo projects, implementing native features, or when user mentions "mobile app", "React Native", "Expo", "iOS app", "Android app", or "cross-platform app".
---

# Mobile App Builder

Build production-ready mobile applications with React Native and Expo, including navigation, native integrations, offline support, and app store deployment.

## Quick start

Tell me what you want to build, and I'll set up a complete mobile app with:
- Expo project with TypeScript
- File-based navigation (Expo Router)
- State management and data fetching
- Native features (camera, notifications, biometrics)
- Offline-first architecture
- Authentication flow
- App store deployment configuration

Example: "Create a mobile app for tracking fitness workouts with user accounts and offline support"

**Note**: For authentication, use the `/better-auth` skill which provides comprehensive auth setup compatible with React Native.

## Instructions

### Step 1: Gather requirements

Ask the user for key details:
1. **App purpose**: What does this app do?
2. **Target platforms**: iOS, Android, or both?
3. **Key features**: Authentication, camera, notifications, location, etc.
4. **Offline needs**: Does the app need to work offline?
5. **Design style**: Minimal, feature-rich, specific brand guidelines?

### Step 2: Initialize project structure

Create a well-organized Expo project:

```
app-name/
├── src/
│   ├── app/                    # Expo Router screens
│   │   ├── (auth)/            # Auth screens (login, register)
│   │   ├── (tabs)/            # Main tab navigation
│   │   ├── (modals)/          # Modal screens
│   │   └── _layout.tsx        # Root layout
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   └── features/          # Feature-specific components
│   ├── hooks/                 # Custom hooks
│   ├── providers/             # Context providers
│   ├── services/              # API and native services
│   ├── stores/                # State management
│   ├── utils/                 # Utilities
│   ├── constants/             # App constants
│   └── types/                 # TypeScript types
├── assets/                    # Images, fonts, etc.
├── .env.example              # Environment template
├── app.json                  # Expo config
├── eas.json                  # EAS Build config
├── tsconfig.json
├── package.json
└── README.md
```

### Step 3: Set up core project

Initialize and configure the Expo project:

1. **Create new project**:
   ```bash
   npx create-expo-app@latest app-name -t expo-template-blank-typescript
   cd app-name
   ```

2. **Install essential dependencies**:
   ```bash
   # Navigation
   npx expo install expo-router expo-linking expo-constants expo-status-bar

   # UI essentials
   npx expo install react-native-safe-area-context react-native-screens
   npx expo install react-native-gesture-handler react-native-reanimated

   # Data and storage
   npx expo install @react-native-async-storage/async-storage
   npx expo install expo-secure-store

   # Data fetching
   npm install @tanstack/react-query
   npm install axios
   ```

3. **Configure app.json** for Expo Router:
   ```json
   {
     "expo": {
       "name": "App Name",
       "slug": "app-name",
       "scheme": "appname",
       "web": {
         "bundler": "metro",
         "output": "static"
       },
       "plugins": ["expo-router"]
     }
   }
   ```

4. **Add scripts** to package.json:
   ```json
   {
     "scripts": {
       "start": "expo start",
       "android": "expo start --android",
       "ios": "expo start --ios",
       "build:dev": "eas build --profile development",
       "build:preview": "eas build --profile preview",
       "build:prod": "eas build --profile production",
       "submit": "eas submit"
     }
   }
   ```

### Step 4: Set up navigation

Configure Expo Router for file-based navigation:

1. **Create root layout** `src/app/_layout.tsx`:
   ```typescript
   import { Stack } from 'expo-router'
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
   import { AuthProvider } from '@/providers/AuthProvider'
   import { ThemeProvider } from '@/providers/ThemeProvider'

   const queryClient = new QueryClient()

   export default function RootLayout() {
     return (
       <QueryClientProvider client={queryClient}>
         <AuthProvider>
           <ThemeProvider>
             <Stack screenOptions={{ headerShown: false }}>
               <Stack.Screen name="(tabs)" />
               <Stack.Screen name="(auth)" />
               <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
             </Stack>
           </ThemeProvider>
         </AuthProvider>
       </QueryClientProvider>
     )
   }
   ```

2. **Create tab layout** `src/app/(tabs)/_layout.tsx`:
   ```typescript
   import { Tabs } from 'expo-router'
   import { Home, Search, User, Settings } from 'lucide-react-native'

   export default function TabLayout() {
     return (
       <Tabs
         screenOptions={{
           tabBarActiveTintColor: '#007AFF',
           headerShown: false,
         }}
       >
         <Tabs.Screen
           name="index"
           options={{
             title: 'Home',
             tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
           }}
         />
         <Tabs.Screen
           name="search"
           options={{
             title: 'Search',
             tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
           }}
         />
         <Tabs.Screen
           name="profile"
           options={{
             title: 'Profile',
             tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
           }}
         />
       </Tabs>
     )
   }
   ```

3. **Create screen files** for each route

See [expo-setup.md](references/expo-setup.md) for detailed navigation patterns.

### Step 5: Implement authentication

Set up protected routes and auth flow:

1. **Create AuthProvider** `src/providers/AuthProvider.tsx`:
   ```typescript
   import { createContext, useContext, useEffect, useState } from 'react'
   import { useRouter, useSegments } from 'expo-router'
   import * as SecureStore from 'expo-secure-store'
   import { api } from '@/services/api'

   interface User {
     id: string
     email: string
     name: string
   }

   interface AuthContextType {
     user: User | null
     isLoading: boolean
     signIn: (email: string, password: string) => Promise<void>
     signUp: (email: string, password: string, name: string) => Promise<void>
     signOut: () => Promise<void>
   }

   const AuthContext = createContext<AuthContextType | null>(null)

   export function AuthProvider({ children }: { children: React.ReactNode }) {
     const [user, setUser] = useState<User | null>(null)
     const [isLoading, setIsLoading] = useState(true)
     const segments = useSegments()
     const router = useRouter()

     // Check auth on mount
     useEffect(() => {
       checkAuth()
     }, [])

     // Protect routes
     useEffect(() => {
       if (isLoading) return

       const inAuthGroup = segments[0] === '(auth)'

       if (!user && !inAuthGroup) {
         router.replace('/login')
       } else if (user && inAuthGroup) {
         router.replace('/(tabs)')
       }
     }, [user, segments, isLoading])

     async function checkAuth() {
       try {
         const token = await SecureStore.getItemAsync('authToken')
         if (token) {
           const userData = await api.getUser(token)
           setUser(userData)
         }
       } catch {
         await SecureStore.deleteItemAsync('authToken')
       } finally {
         setIsLoading(false)
       }
     }

     async function signIn(email: string, password: string) {
       const { token, user } = await api.login(email, password)
       await SecureStore.setItemAsync('authToken', token)
       setUser(user)
     }

     async function signUp(email: string, password: string, name: string) {
       const { token, user } = await api.register(email, password, name)
       await SecureStore.setItemAsync('authToken', token)
       setUser(user)
     }

     async function signOut() {
       await SecureStore.deleteItemAsync('authToken')
       setUser(null)
     }

     return (
       <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
         {children}
       </AuthContext.Provider>
     )
   }

   export const useAuth = () => {
     const context = useContext(AuthContext)
     if (!context) throw new Error('useAuth must be used within AuthProvider')
     return context
   }
   ```

2. **Create auth screens** in `src/app/(auth)/`

### Step 6: Add native features

Integrate platform capabilities based on requirements:

**Push Notifications**:
```bash
npx expo install expo-notifications expo-device
```

**Camera & Media**:
```bash
npx expo install expo-camera expo-image-picker expo-media-library
```

**Location**:
```bash
npx expo install expo-location
```

**Biometrics**:
```bash
npx expo install expo-local-authentication
```

**Haptics**:
```bash
npx expo install expo-haptics
```

See [native-features.md](references/native-features.md) for implementation patterns.

### Step 7: Implement offline support

Set up offline-first architecture with React Query:

1. **Configure persisted queries**:
   ```typescript
   import { QueryClient } from '@tanstack/react-query'
   import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
   import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
   import AsyncStorage from '@react-native-async-storage/async-storage'
   import NetInfo from '@react-native-community/netinfo'
   import { onlineManager } from '@tanstack/react-query'

   // Sync online status
   onlineManager.setEventListener((setOnline) => {
     return NetInfo.addEventListener((state) => {
       setOnline(!!state.isConnected)
     })
   })

   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         gcTime: 1000 * 60 * 60 * 24, // 24 hours
         staleTime: 1000 * 60 * 5, // 5 minutes
         networkMode: 'offlineFirst',
       },
       mutations: {
         networkMode: 'offlineFirst',
       },
     },
   })

   const persister = createAsyncStoragePersister({
     storage: AsyncStorage,
     key: 'APP_CACHE',
   })
   ```

2. **Create data hooks with optimistic updates**

### Step 8: Build UI components

Create reusable, accessible UI components:

1. **Button component** with haptics:
   ```typescript
   import { Pressable, Text, StyleSheet, Platform } from 'react-native'
   import * as Haptics from 'expo-haptics'
   import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

   const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

   interface ButtonProps {
     title: string
     onPress: () => void
     variant?: 'primary' | 'secondary' | 'outline'
     disabled?: boolean
   }

   export function Button({ title, onPress, variant = 'primary', disabled }: ButtonProps) {
     const scale = useSharedValue(1)

     const animatedStyle = useAnimatedStyle(() => ({
       transform: [{ scale: scale.value }],
     }))

     const handlePressIn = () => {
       scale.value = withSpring(0.95)
       if (Platform.OS !== 'web') {
         Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
       }
     }

     const handlePressOut = () => {
       scale.value = withSpring(1)
     }

     return (
       <AnimatedPressable
         onPress={onPress}
         onPressIn={handlePressIn}
         onPressOut={handlePressOut}
         disabled={disabled}
         style={[styles.button, styles[variant], disabled && styles.disabled, animatedStyle]}
       >
         <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
       </AnimatedPressable>
     )
   }
   ```

2. **Create consistent design system**

### Step 9: Configure EAS Build

Set up builds for development, preview, and production:

1. **Initialize EAS**:
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```

2. **Configure eas.json**:
   ```json
   {
     "cli": { "version": ">= 5.0.0" },
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal",
         "ios": { "simulator": true }
       },
       "preview": {
         "distribution": "internal",
         "android": { "buildType": "apk" }
       },
       "production": {
         "autoIncrement": true
       }
     },
     "submit": {
       "production": {
         "ios": {
           "appleId": "your@email.com",
           "ascAppId": "123456789"
         },
         "android": {
           "serviceAccountKeyPath": "./google-services.json"
         }
       }
     }
   }
   ```

3. **Build commands**:
   ```bash
   # Development build
   eas build --platform ios --profile development

   # Preview build for testing
   eas build --platform android --profile preview

   # Production build
   eas build --platform all --profile production
   ```

See [deployment.md](references/deployment.md) for app store submission.

### Step 10: Document and test

Finalize the mobile app:

1. **Write README.md** with:
   - App description
   - Setup instructions
   - Development workflow
   - Build and deployment steps
   - Environment variables

2. **Test on devices**:
   - Test on real iOS and Android devices
   - Test offline functionality
   - Test push notifications
   - Performance profiling

3. **Create run instructions**

## Best practices

### Code organization
- Use file-based routing with Expo Router
- Separate UI components from business logic
- Keep screens thin, move logic to hooks/services
- Group related functionality together

### Performance
- Use FlashList instead of FlatList for long lists
- Memoize components and callbacks
- Use Reanimated for 60fps animations
- Optimize images with expo-image
- Monitor with React DevTools

### User experience
- Add haptic feedback for interactions
- Support dark mode
- Handle loading and error states
- Show offline indicators
- Implement pull-to-refresh

### Security
- Store tokens in SecureStore, not AsyncStorage
- Use HTTPS for all API calls
- Validate inputs
- Don't store secrets in code
- Use environment variables

### Testing
- Test on real devices (not just simulators)
- Test poor network conditions
- Test with different device sizes
- Test accessibility features

## Common patterns

### Navigation
```typescript
import { router } from 'expo-router'

// Navigate
router.push('/profile/123')

// Replace (no back)
router.replace('/login')

// Go back
router.back()

// With params
router.push({
  pathname: '/product/[id]',
  params: { id: '123' },
})
```

### API service
```typescript
import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
})

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export { api }
```

### Platform-specific code
```typescript
import { Platform, StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
})
```

## Advanced features

For advanced topics, see reference documentation:
- [Expo Setup](references/expo-setup.md) - Project config, navigation, theming
- [Native Features](references/native-features.md) - Camera, notifications, biometrics, location
- [Deployment](references/deployment.md) - EAS Build, app store submission, OTA updates

## Dependencies

Core dependencies installed by this skill:
- `expo` - Development platform
- `expo-router` - File-based navigation
- `react-native-reanimated` - Animations
- `react-native-gesture-handler` - Gestures
- `@tanstack/react-query` - Data fetching/caching

Storage:
- `@react-native-async-storage/async-storage` - General storage
- `expo-secure-store` - Secure credential storage

Common native features:
- `expo-notifications` - Push notifications
- `expo-camera` - Camera access
- `expo-local-authentication` - Biometrics
- `expo-haptics` - Haptic feedback
- `expo-location` - GPS/location

## Output format

When building a mobile app, I will:

1. Ask clarifying questions about requirements
2. Create the project structure
3. Set up Expo with TypeScript
4. Configure navigation with Expo Router
5. Implement authentication flow
6. Add requested native features
7. Set up offline support if needed
8. Build reusable UI components
9. Configure EAS Build for deployment
10. Add README with setup instructions
11. Provide commands to run the app

The result will be a production-ready mobile app following best practices.
