import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { Nunito_700Bold, useFonts } from '@expo-google-fonts/nunito';
import * as Device from 'expo-device';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Image, KeyboardAvoidingView,
  Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput
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
let not_warning = true;

// choice
// signup
// login
// otp
export default function HomeScreen() {
  const router = useRouter();
  const [userInput, setUserInput] = useState('');
  const [phone, setphone] = useState('');
  const [otp, setotp] = useState('');
  const [IdentifierState, setIdentifierState] = useState(false);//false for email,true for phone,default in email.
  const [email, setemail] = useState('');
  //const [otpStage, setOtpStage] = useState(false);
  const { userType } = useLocalSearchParams();
  const [showPopup, setShowPopup] = useState(false);
  const [popupmessage, setpopupmessage] = useState('');
  const [errormessage,seterrormessage] = useState('');
  const [currentScreen, setCurrentScreen] = useState("choice");
  const [countdown, setCountdown] = useState(60);
const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
let otp_screen = "signup_phone";
function startCountdown() {

    setCountdown(60);

    if (timerRef.current) {
        clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {

        setCountdown(previous => {

            if (previous <= 1) {

                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }

                return 0;
            }

            return previous - 1;

        });

    }, 1000);
}
const handleSubmit2  = async () =>{// for log in 
  router.push({
  pathname: '/login_page'})
}
const handleSubmit = async () => {

  try {

    const response = await fetch(
      'http://192.168.1.13:3000/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation : "generate_otp",
          name: userInput,
          phone: phone,
          email: email,
          otp: otp,
          otpstage :false,
          Identifier :IdentifierState,
        }),
      }
    );

    const data = await response.json();
    
    console.log(data);
    let phone_authenticated = data["success"];
    if(phone_authenticated){
      setCurrentScreen("otp");
      setpopupmessage ("success");
      //setOtpStage(true);
      seterrormessage ("otp is sent.");
      setShowPopup(true);
      startCountdown();
      
    }
    else {
      not_warning = false;
      setpopupmessage ("Invalid_data!");
      seterrormessage (data["message"]);
      setShowPopup(true);
    }

  } catch (error) {

    console.log('Error:', error);

  }
};
const handleReSubmit = async () => {
let data ={'success':'none','message':'none'};
  try {
   if(countdown == 0){
    const response = await fetch(
      'http://192.168.1.13:3000/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation : "generate_otp",
          name: userInput,
          phone: phone,
          email: email,
          otp: otp,
          otpstage :false,
          Identifier :IdentifierState,
        }),
      }
    );

    data = await response.json();
  }
    console.log(data);
    let phone_authenticated = data["success"];
    if(phone_authenticated && countdown == 0){
      setCurrentScreen("otp");
      setpopupmessage ("success");
      //setOtpStage(true);
      seterrormessage ("otp is sent.");
      setShowPopup(true);
      startCountdown();
      
    }
    else {
      not_warning = false;
      setpopupmessage ("PLEASE WAIT.");
      if(countdown !=0 ){
      seterrormessage ("please wait "+countdown+" seconds before requesting new otp");}
      else {
        seterrormessage (data["message"]);
      }
      setShowPopup(true);
    }

  } catch (error) {

    console.log('Error:', error);

  }
};

const handlereturn = () => {
  console.log("BACK PRESSED");
  setCurrentScreen("choice");
  router.push('/');
};
const handlback = () => {
  console.log("otp BACK PRESSED");
  //setOtpStage (false);
  setCurrentScreen("signup_phone");
};
const handlOtpSubmission = async () => {
  console.log("verification....");
  //setOtpStage (true);
  try {
    const response = await fetch(
      'http://192.168.1.13:3000/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: "verify_otp",
          name: userInput,
          phone: phone,
          email: email,
          otp: otp,
          otpstage : true,
          Identifier : IdentifierState,
        }),
      }
    );
    const data = await response.json();
    
    console.log(data);
    let phone_authenticated = data["success"];
    let identifier_type = "email";
    if ( IdentifierState){identifier_type = "phone";}
    if(phone_authenticated){
      setCurrentScreen("otp");
      //setOtpStage(false);
      setpopupmessage ("success");
      seterrormessage (data["message"]);
      setShowPopup(true);
      //router.push('/account_creation');
      router.push({
  pathname: "/account_creation",
  params: {
  userType: userType,
  identifier : phone,
  Identifiertype : identifier_type,
  },
});
      
    }
    else {
      not_warning = false;
      setpopupmessage ("Invalid_data!");
      seterrormessage (data["message"]);
      setShowPopup(true);
    }

  } catch (error) {

    console.log('Error:', error);

  }
  

  //setCurrentScreen("signup_phone");
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
        <Modal
  visible={showPopup}
  transparent={true}
  animationType="fade">

  <ThemedView style={styles.overlay}>

    <ThemedView style={styles.popup}>

      <Text style={styles.popupTitle}>
        {popupmessage}
      </Text>

      <Text style={styles.popupMessage}>
        {errormessage}
      </Text>
      <Pressable
        onPress={() => {
          setShowPopup(false);
          //setOtpStage(not_warning);
          console.log({otp_screen});
        }}
      >
        <Text style={styles.popupButton}>
          Continue
        </Text>
      </Pressable>

    </ThemedView>

  </ThemedView>
</Modal>
<ThemedView style={styles.heroSection}>
          <Image
          source={require('../../assets/logo.png')}
          style={{
            width: 200,
            height: 160,
            resizeMode: 'contain',
            }}/>

        </ThemedView>
{currentScreen === "choice" && (
  <>
 <Pressable
        style={({ pressed }) => [
          styles.submitButton,
          pressed && styles.buttonPressed,]}onPress={() => setCurrentScreen("signup")}>
   <LinearGradient colors={['#1CB7AC','#1CB7AC']}
   start={{ x: 10, y: 0 }}
   end={{ x: 1, y: 1 }}
   style={styles.buttonGradient}>
   <Text style={styles.buttonText}>
     Sign up
    </Text>
  </LinearGradient>
 </Pressable>

 <Pressable
        style={({ pressed }) => [
          styles.submitButton1,
          pressed && styles.buttonPressed,]}onPress={handleSubmit2}>
   <LinearGradient colors={['orange','orange']}
   start={{ x: 0, y: 0 }}
   end={{ x: 1, y: 1 }}
   style={styles.buttonGradient}>
   <Text style={styles.buttonText}>
     LogIn 
    </Text>
  </LinearGradient>
 </Pressable> 
 </>
)} 
{currentScreen === "signup" && (
  <>
  <Pressable
        style={({ pressed }) => [
          styles.submitButton,
          pressed && styles.buttonPressed,]}onPress={() => {setCurrentScreen("signup_phone");
          setIdentifierState(true);}
          }>
   <LinearGradient colors={['orange','orange','orange']}
   start={{ x: 0, y: 0 }}
   end={{ x: 1, y: 1 }}
   style={styles.buttonGradient}>
   <Text style={styles.buttonText}>
      Mobile otp
    </Text>
  </LinearGradient>
</Pressable> 
<Text style={styles.planetext}>
      OR
    </Text>
<Pressable
        style={({ pressed }) => [
          styles.submitButton1,
          pressed && styles.buttonPressed,]}onPress={handlereturn}>
   <LinearGradient colors={['orange','orange','orange']}
   start={{ x: 0, y: 0 }}
   end={{ x: 1, y: 1 }}
   style={styles.buttonGradient}>
   <Text style={styles.buttonText}>
      Email Verification
    </Text>
  </LinearGradient>
</Pressable> 
</>
)}

{currentScreen === "signup_phone" && (
  <>
        <ThemedView type="backgroundElement" style={styles.stepContainer}>
            <ThemedText>
              Name:
            </ThemedText>
          <LinearGradient
          colors={['#1CB7AC','#1CB7AC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientBorder}>
            <TextInput style={styles.input} value = {userInput} onChangeText={setUserInput} placeholder = "Enter your name:" placeholderTextColor="white" />
          </LinearGradient>
          <ThemedText>
            Phone Number:
            </ThemedText>
          <LinearGradient
          colors={['orange','orange']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientBorder}>
            <TextInput style={styles.input} value = {phone} onChangeText={setphone} placeholder = "Enter phone no:" placeholderTextColor="white" />
          </LinearGradient>
        </ThemedView>
        <Pressable
        style={({ pressed }) => [
          styles.submitButton,
          pressed && styles.buttonPressed,]}onPress={handleSubmit}>
   <LinearGradient colors={['#1CB7AC','#1CB7AC']}
   start={{ x: 0, y: 0 }}
   end={{ x: 1, y: 1 }}
   style={styles.buttonGradient}>
   <Text style={styles.buttonText}>
     Send OTP
    </Text>
  </LinearGradient>
</Pressable> 
<Pressable
        style={({ pressed }) => [
          styles.submitButton1,
          pressed && styles.buttonPressed,]}onPress={handlereturn}>
   <LinearGradient colors={['orange','orange','orange']}
   start={{ x: 0, y: 0 }}
   end={{ x: 1, y: 1 }}
   style={styles.buttonGradient}>
   <Text style={styles.buttonText}>
      Back
    </Text>
  </LinearGradient>
</Pressable> 
</>
)} 
{currentScreen === "otp" && (<>

<ThemedView type="backgroundElement" style={styles.stepContainer}>
            <ThemedText>
              OTP:
            </ThemedText>
          <LinearGradient
          colors={['#1CB7AC','#1CB7AC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientBorder}>
            <TextInput style={styles.input} value = {otp} onChangeText={setotp} placeholder = "ENTER OTP" placeholderTextColor="white" />
          </LinearGradient>
          </ThemedView>
          <Pressable
        style={({ pressed }) => [
          styles.submitButton,
          pressed && styles.buttonPressed,]}onPress={handlOtpSubmission}>
   <LinearGradient colors={['#1CB7AC','#1CB7AC']}
   start={{ x: 0, y: 0 }}
   end={{ x: 1, y: 1 }}
   style={styles.buttonGradient}>
   <Text style={styles.buttonText}>
     Verify OTP
    </Text>
  </LinearGradient>
</Pressable> 
<Pressable
        style={({ pressed }) => [
          styles.submitButton2,
          pressed && styles.buttonPressed,]}onPress={handleReSubmit}>
   <LinearGradient colors={['#1CB7AC','#1CB7AC']}
   start={{ x: 0, y: 0 }}
   end={{ x: 1, y: 1 }}
   style={styles.buttonGradient}>
   <Text style={styles.buttonText}>
     RESEND OTP IN:{countdown}s
    </Text>
  </LinearGradient>
</Pressable> 
<Pressable
        style={({ pressed }) => [
          styles.submitButton1,
          pressed && styles.buttonPressed,]}onPress={handlback}>
   <LinearGradient colors={['orange','orange','orange']}
   start={{ x: 0, y: 0 }}
   end={{ x: 1, y: 1 }}
   style={styles.buttonGradient}>
   <Text style={styles.buttonText}>
      Back
    </Text>
  </LinearGradient>
</Pressable> 
</>
)}

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
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop : 70,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    backgroundColor: 'white',
    
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
    paddingVertical: Spacing.four,
    borderRadius: Spacing.five,
    marginTop: 0,
    backgroundColor: 'gray',
  },
  submitButton: {
  backgroundColor: 'gray',
  paddingVertical: 0,
  paddingHorizontal:0,
  borderRadius: 40,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 60,
  shadowColor: '#F4B400',
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.9,
  shadowRadius: 8,

  elevation: 8,
 },
 submitButton1: {
  backgroundColor: 'gray',
  paddingVertical: 0,
  paddingHorizontal:0,
  borderRadius: 40,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 5,
  shadowColor: '#F4B400',
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.9,
  shadowRadius: 8,

  elevation: 8,
 },
submitButton2: {
  backgroundColor: 'gray',
  paddingVertical: 0,
  paddingHorizontal:0,
  borderRadius: 40,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 5,
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
  color:'black',
  fontSize : 20
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
  paddingHorizontal: 35,
  borderRadius: 40,
  alignItems: 'center',
},

buttonText: {
  fontSize: 20,
  fontFamily: 'Nunito_700Bold',
  color: 'white',
},
planetext: {
  fontSize: 20,
  fontFamily: 'Nunito_700Bold',
  color: 'black',
},
overlay: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(219, 216, 255, 0.5)',
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