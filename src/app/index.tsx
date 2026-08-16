import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { Nunito_700Bold, useFonts } from '@expo-google-fonts/nunito';
import * as Device from 'expo-device';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Image, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function getDevMenuHint() {
  if (Platform.OS === 'web') {
    return <ThemedText type="small">use browser devtools</ThemedText>;
  }
  if (Device.isDevice) {
    return (
      <ThemedText type="small">
        shake device or press <ThemedText type="code">m</ThemedText> in terminal
      </ThemedText>
    );
  }
  const shortcut = Platform.OS === 'android' ? 'cmd+m (or ctrl+m)' : 'cmd+d';
  return (
    <ThemedText type="small">
      press <ThemedText type="code">{shortcut}</ThemedText>
    </ThemedText>
  );
}
export default function HomeScreen() {
const router = useRouter();
const handleSubmit = async () => {
  let userstate = "individual";
  try {

    const response = await fetch(
      'http://192.168.1.13:3000',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );

    const data = await response.json();
    console.log(data);

  } catch (error) {

    console.log('Error:', error);

  }
};
const handleIndividual = () => {
  console.log("INDIVIDUAL PRESSED");
  router.push({
  pathname: '/individual_login',
  params: {
  userType: "individual",
  },
});
  console.log(router);
};
const [fontsLoaded] = useFonts({ Nunito_700Bold });
  return (
   <LinearGradient
   colors={['white','white','white','gray']}
   start={{ x: 0, y: 0 }}
   end={{ x: 1, y: 1 }}
   style={styles.container}>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >

      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <Image
          source={require('../../assets/logo.png')}
          style={{
            width: 200,
            height: 160,
            resizeMode: 'contain',
            }}/>
            
          <ThemedText type="title" style={styles.welcomeText}>
          Welcome 
          </ThemedText>
        </ThemedView>

        
        <Pressable
        style={({ pressed }) => [
          styles.submitButton,
          pressed && styles.buttonPressed,]}onPress={handleIndividual}>
   <LinearGradient colors={['#1CB7AC','#1CB7AC']}
   start={{ x: 0, y: 0 }}
   end={{ x: 1, y: 1 }}
   style={styles.buttonGradient}>
   <Text style={styles.buttonText}>
    👤I am an Individual
    </Text>
  </LinearGradient>
</Pressable>
<Pressable
        style={({ pressed }) => [
          styles.submitButton,
          pressed && styles.buttonPressed,]}onPress={handleSubmit}>
   <LinearGradient colors={['orange','orange']}
   start={{ x: 0, y: 0 }}
   end={{ x: 1, y: 1 }}
   style={styles.buttonGradient}>
   <Text style={styles.buttonText}>
    🏢I am an Employee
    </Text>
  </LinearGradient>
</Pressable>  
{Platform.OS === 'web' && <WebBadge />}
    </SafeAreaView>
    </ScrollView>
  </KeyboardAvoidingView>
</LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    //paddingBottom: BottomTabInset + 130,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    //paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    backgroundColor: 'white',
    fontFamily:'Nunito_700Bold',
    
  },
  title: {
    textAlign: 'center',
  },
  code: {
    textTransform: 'uppercase',
    
  },
  stepContainer: {
    gap: Spacing.one,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    marginTop: 0,
    backgroundColor: 'gray',
  },
  submitButton: {
  backgroundColor: 'gray',
  paddingVertical: 0,
  paddingHorizontal:0,
  borderRadius: 30,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 20,

  shadowColor: '#F4B400',
  shadowOffset: {   
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.9,
  shadowRadius: 8,

  elevation: 8,
},

welcomeText:{
  textAlign: 'center',
  fontFamily: 'Nunito_700Bold',
  color:'gray'
},
buttonPressed: {
  transform: [{ scale: 0.95 }],
  opacity: 0.8,
},
gradientBorder: {
  padding: 2,
  borderRadius: 12,
  width: '100%',
},
input: {
  backgroundColor: '#1A1A1A',
  color: 'white',
  borderWidth: 2,
  borderColor: '',
  borderRadius: 10,
  padding: 12,
},
gradientInput: {
  borderRadius: 12,
  padding: 12,
},

transparentInput: {
  color: 'white',
},
buttonGradient: {
  paddingVertical: 15,
  paddingHorizontal: 40,
  borderRadius: 30,
  
  alignItems: 'center',
},

buttonText: {
  fontSize: 20,
  fontFamily: 'Nunito_700Bold',
  color: 'white',
},
overlay: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.97)',
},

popup: {
  width: 300,
  backgroundColor: '#1A1A1A',
  borderRadius: 25,
  padding: 25,
  alignItems: 'center',
},

popupTitle: {
  fontSize: 24,
  fontWeight: 'bold',
  color: 'white',
  marginBottom: 10,
},

popupMessage: {
  fontSize: 16,
  color: '#87CEEB',
  textAlign: 'center',
  marginBottom: 20,
},

popupButton: {
  fontSize: 18,
  fontWeight: 'bold',
  color: 'white',
},
});
