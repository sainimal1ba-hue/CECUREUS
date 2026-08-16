import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import Header from "@/hed_components/header";
import { Nunito_700Bold, useFonts } from '@expo-google-fonts/nunito';
import * as Device from 'expo-device';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView, StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { Dropdown } from "react-native-element-dropdown";
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
const [userId, setUserId] = useState('')
const [showPopup, setShowPopup] = useState(false);
const [popupmessage, setpopupmessage] = useState('');
const months = [
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4},
  { label: "May", value: 5 },
  { label: "June", value: 6},
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11},
  { label: "December", value: 12 },
];
const [month, setMonth] = useState(null);
const [password, setpassword] = useState('')
const [errormessage,seterrormessage] = useState('');
const [repassword, setpassword2] = useState('')
const [showPassword, setShowPassword] = useState(false);
const [showPassword2, setShowPassword2] = useState(false);
const [currentScreen, setCurrentScreen] = useState("account_creation");
const router = useRouter();
const { userType } = useLocalSearchParams();
const { identifier } = useLocalSearchParams();
const { Identifiertype } = useLocalSearchParams();
const [day, setDay] = useState<number | null>(null);
const getDaysInMonth = (month: number | null) => {
  if (!month) return [];

  const year = new Date().getFullYear(); // Handles leap years

  const numDays = new Date(year, month, 0).getDate();

  return Array.from({ length: numDays }, (_, i) => ({
    label: `${i + 1}`,
    value: i + 1,
  }));
};
const [year, setYear] = useState<number | null>(null);
const currentYear = new Date().getFullYear();
const years = Array.from(
  { length: currentYear - 1910 + 1 },
  (_, index) => ({
    label: `${1910 + index}`,
    value: 1910 + index,
  })
);
const days = getDaysInMonth(month);
const checkCredentials = async () => {

  try {

    const response = await fetch(
      'http://192.168.1.13:3000/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation : "check_Credentials",
          password : password,
          userId :userId,
        }),
      }
    );

    const data = await response.json();
    console.log(data);
    if(!data["success"]){
      setpopupmessage ("Invalid!");
      seterrormessage (data["message"]);
      setShowPopup(true);
      console.log("password validity :"+data["success"]);
    }
    else if(password === repassword){
        console.log("password correct!");
        console.log(userType);
        setCurrentScreen ("account_details");
      }
    else{
        setpopupmessage ("Invalid!");
        seterrormessage ("re-entered password is incorrect");
        setShowPopup(true);
        console.log("password incorrect!");
      }
  }
    catch (error) {

    console.log('Error:', error);

  }}
const CreateAccount = async () => {

  try {

    const response = await fetch(
      'http://192.168.1.13:3000/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation : "CreateAccount",
          password : password,
          userId : userId,
          userType: userType,
          year : year,
          day : day,
          month : month,
          identifier : identifier ,
          identifier_type: Identifiertype ,
        }),
      }
    );

    const data = await response.json();
    console.log(data);
    if (data["success"]){
      console.log("success");
      router.push({
  pathname: "/Dashboard",
  params: {
  userId : userId,
  token : data["token"],
  userType : userType
  },
});

    }

  }
    catch (error) {

    console.log('Error:', error);

  }}
  
const [fontsLoaded] = useFonts({ Nunito_700Bold });
  return (
    <>
    <Header />
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
        keyboardShouldPersistTaps="handled">

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
        }}
      >
        <Text style={styles.popupButton}>
          Continue
        </Text>
      </Pressable>

    </ThemedView>

  </ThemedView>
</Modal>
          
{currentScreen === "account_creation" && (
  <>  
  <ThemedView style={styles.heroSection}>
          <ThemedText type="title" style={styles.welcomeText}>
          Create A New Account :
          </ThemedText>
        </ThemedView>  
<ThemedView type="backgroundElement" style={styles.stepContainer}>
            <ThemedText>
              User ID:
            </ThemedText>
          <LinearGradient
          colors={['#1CB7AC','#1CB7AC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientBorder}>
            <TextInput style={styles.input} value = {userId} onChangeText={setUserId} placeholder = "Enter an ID :" placeholderTextColor="white"  />
          </LinearGradient>
          <ThemedText>
            Set1 Password:
            </ThemedText>
          <LinearGradient
    colors={['orange','orange']}
    style={styles.gradientBorder}
>

    <View style={styles.passwordContainer}>

        <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={setpassword}
            placeholder="Type a strong password"
            placeholderTextColor="white"
            secureTextEntry={!showPassword}
        />

        <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
        >
            <Text style={{fontSize:20}}>
                {showPassword ? "🔓" : "🔒"}
            </Text>
        </Pressable>

    </View>

</LinearGradient>
<ThemedText>
            Retype  Password:
            </ThemedText>
          <LinearGradient
    colors={['orange','orange']}
    style={styles.gradientBorder}
>

    <View style={styles.passwordContainer}>

        <TextInput
            style={styles.passwordInput}
            value={repassword}
            onChangeText={setpassword2}
            placeholder=" Retype password"
            placeholderTextColor="white"
            secureTextEntry={!showPassword2}
        />

        <Pressable
            onPress={() => setShowPassword2(!showPassword2)}
            style={styles.eyeButton}
        >
            <Text style={{fontSize:20}}>
                {showPassword2 ? "🔓" : "🔒"}
            </Text>
        </Pressable>

    </View>

</LinearGradient>
</ThemedView>
<Pressable
        style={({ pressed }) => [
          styles.submitButton1,
          pressed && styles.buttonPressed,]}onPress={checkCredentials}>
   <LinearGradient colors={['orange','orange']}
   start={{ x: 0, y: 0 }}
   end={{ x: 1, y: 1 }}
   style={styles.buttonGradient}>
   <Text style={styles.buttonText}>
      Next
    </Text>
  </LinearGradient>
</Pressable> 
</> )}
{currentScreen === "account_details" && (<> 
   <ThemedText type="title" style={styles.welcomeText}>
          DATE OF BIRTH :
    </ThemedText>
<Dropdown
  style={styles.dropdown}
  placeholderStyle={styles.placeholder}
  selectedTextStyle={styles.selectedText}
  data={months}
  labelField="label"
  valueField="value"
  placeholder="Select Month"
  value={month}
  onChange={item => {
    setMonth(item.value);
    setDay(null); // Reset day when month changes
  }}
/>
<Dropdown
  style={styles.dropdownd}
  placeholderStyle={styles.placeholder}
  selectedTextStyle={styles.selectedText}
  data={days}
  labelField="label"
  valueField="value"
  placeholder="Select Day"
  value={day}
  onChange={item => setDay(item.value)}
/>
<Dropdown
  style={styles.dropdown}
  placeholderStyle={styles.placeholder}
  selectedTextStyle={styles.selectedText}
  data={years}
  labelField="label"
  valueField="value"
  placeholder="Select Year"
  value={year}
  maxHeight={300}
  onChange={item => setYear(item.value)}
/>
<Pressable
        style={({ pressed }) => [
          styles.submitButton1,
          pressed && styles.buttonPressed,]}onPress={CreateAccount}>
   <LinearGradient colors={['orange','orange']}
   start={{ x: 0, y: 0 }}
   end={{ x: 1, y: 1 }}
   style={styles.buttonGradient}>
   <Text style={styles.buttonText}>
      create Account
    </Text>
  </LinearGradient>
  </Pressable>
 </>)}

{Platform.OS === 'web' && <WebBadge />}
    </SafeAreaView>
    </ScrollView>
  </KeyboardAvoidingView>
</LinearGradient>
</>
)}


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
  dropdown: {
  width: 250,
  height: 55,
  borderRadius: 25,
  backgroundColor: "gray",
  paddingHorizontal: 15,
},
dropdownd: {
  width: 250,
  height: 55,
  borderRadius: 25,
  backgroundColor: "gray",
  paddingHorizontal: 15,
},

placeholder: {
  color: "#AAAAAA",
  fontSize: 16,
},

selectedText: {
  color: "white",
  fontSize: 16,
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
  fontFamily: 'Nunito_700Bold',
  color:'lightblue',
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
passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
},

passwordInput: {
    flex: 1,
    color: "white",
    padding: 12,
},

eyeButton: {
    width: 45,
    justifyContent: "center",
    alignItems: "center",
},
});
