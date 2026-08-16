//UI is coded with Open AI :CHAT GPT
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import FooterNavigation from "@/footer_comp/footer_nav";
import Header from "@/hed_components/header";
import { Nunito_700Bold, useFonts } from '@expo-google-fonts/nunito';
import * as Device from 'expo-device';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect, useMemo, useState } from "react";
import { Image, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
const router = useRouter();
const { userId, token } = useLocalSearchParams();
const [button, setbutton] = useState("");
const [name, setName] = useState("");
const [booking, setbooking] = useState("");
const [errormessage,seterrormessage] = useState('');
const [showPopup, setShowPopup] = useState(false);
const [popupmessage, setpopupmessage] = useState('');
const [page, setPage] = useState("intro");
const [time, setTime] = useState<string | null>(null);
const [month, setMonth] = useState<string | null>(null);
const [selectedVideo, setSelectedVideo] = useState(null);
const [selectedArticle, setSelectedArticle] = useState<any>(null);
const [day, setDay] = useState<number | null>(null);
const [category, setCategory] = useState<string | null>(null);
const [medium, setMedium] = useState<string | null>(null);
const [language, setLanguage] = useState<string | null>(null);
const videos = [
  {
    title: "Hold Breathing",
    duration: "3 min",
    thumbnail: require("../../assets/thumbnails/E1.png"),
    video: require("../../assets/videos1/vid_1.mp4"),
  },
  {
    title: "Box Breathing",
    duration: "3 min",
    thumbnail: require("../../assets/thumbnails/E2.png"),
    video: require("../../assets/videos1/vid_2.mp4"),
  },
  {
    title: "Breathing 3",
    duration: "3 min",
    thumbnail: require("../../assets/thumbnails/E3.png"),
    video: require("../../assets/videos1/vid_3.mp4"),
  },
];
const articles_selection = [
  {
    title: "Productivity",
    thumbnail: require("../../assets/thumbnails/A1.png"),
    content: `
Being productive isn't about staying busy.

• Plan your day.
• Finish one task before starting another.
• Keep your phone away while working.
• Take short breaks every hour.

Remember that consistency beats motivation.
`,
  },

  {
    title: "Self Care Tips",
    thumbnail: require("../../assets/thumbnails/A2.png"),
    content: `
Taking care of yourself isn't selfish.

• Sleep 7-9 hours.
• Drink enough water.
• Exercise regularly.
• Spend time with family and friends.
• Don't ignore your emotions.

Small habits create big improvements.
`,
  },

  {
    title: "Stress Management",
    thumbnail: require("../../assets/thumbnails/A3.png"),
    content: `
Stress is a normal part of life.

Ways to reduce stress:

• Deep breathing
• Walking
• Listening to calming music
• Talking to someone you trust
• Taking breaks from work

If stress becomes overwhelming, seek professional help.
`,
  },
];
const categoryData = [
  { label: "Relationship Issues", value: "relationship" },
  { label: "Work Pressure", value: "work" },
  { label: "Academic Stress", value: "academic" },
  { label: "Anxiety", value: "anxiety" },
  { label: "Depression", value: "depression" },
  { label: "Family Problems", value: "family" },
  { label: "Financial Stress", value: "financial" },
  { label: "General Counselling", value: "general" },
];

const mediumData = [
  { label: "Phone Call", value: "call" },
  { label: "Online Meeting", value: "meeting" },
  { label: "Chat", value: "chat" },
];
const timeData = [
  { label: "09:00 AM", value: "09:00" },
  { label: "10:00 AM", value: "10:00" },
  { label: "11:00 AM", value: "11:00" },
  { label: "12:00 PM", value: "12:00" },
  { label: "01:00 PM", value: "13:00" },
  { label: "02:00 PM", value: "14:00" },
  { label: "03:00 PM", value: "15:00" },
  { label: "04:00 PM", value: "16:00" },
  { label: "05:00 PM", value: "17:00" },
];

const languageData = [
  { label: "English", value: "English" },
  { label: "Tamil", value: "Tamil" },
  { label: "Hindi", value: "Hindi" },
  { label: "Telugu", value: "Telugu" },
  { label: "Kannada", value: "Kannada" },
  { label: "Malayalam", value: "Malayalam" },
  { label: "Marathi", value: "Marathi" },
  { label: "Bengali", value: "Bengali" },
];
const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const today = new Date();

const monthData = Array.from({ length: 3}, (_, i) => {
  const date = new Date(today.getFullYear(), today.getMonth() + i, 1);

  return {
    label: monthNames[date.getMonth()],
    value: `${date.getFullYear()}-${date.getMonth() + 1}`,
  };
});
const dayData = useMemo(() => {
  if (!month) return [];

  const [year, monthNumber] = month.split("-").map(Number);

  const lastDay = new Date(year, monthNumber, 0).getDate();

  let startDay = 1;

  if (
    year === today.getFullYear() &&
    monthNumber === today.getMonth() + 1
  ) {
    startDay = today.getDate();
  }

  return Array.from(
    { length: lastDay - startDay + 1 },
    (_, i) => ({
      label: String(startDay + i),
      value: startDay + i,
    })
  );
}, [month]);

const callCounsellor = async () => {
  const phoneNumber = "9840924778"; 

  const supported = await Linking.canOpenURL(`tel:${phoneNumber}`);

  if (supported) {
    await Linking.openURL(`tel:${phoneNumber}`);
  } else {
    console.log("Calling is not supported on this device.");
  }
};
const handleSubmit = async (userId: string, token: string) => {
  try {
    const response = await fetch(
      "http://192.168.1.13:3000/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "retreve_name",
          userId,
          token,
        }),
      }
    );

    const data = await response.json();
    setName(data.message);
  } catch (err) {
    console.log(err);
  }
};
const handle_action = (action: string) => {
  setbutton(action);
  setPage("contents_page");
};
const handle_contultant = () => {
  console.log("BOOK CONSULTANT PRESSED");
  setPage("consultant_booking");
};
const handle_return = () => {
  //setbutton(action);
  setPage("intro");
};
const handle_vid = () => {
    setPage("breathing")
}
const handle_return1 = () => {
  //setbutton(action);
  setPage("contents_page");
};
const handle_pgc = () => {
  //setbutton(action);
  setPage("A1");
};

const book_appointment = async () => {
    try {
    const response = await fetch(
      "http://192.168.1.13:3000/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "book_appointment",
          userId :userId,
          token:token,
          category:category,
          language:language,
          month:month,
          day:day,
          time:time,
          medium:medium
        }),
      }
    );

    const data = await response.json();
    if(data["success"]){
      setpopupmessage ("Booking Placed");
      seterrormessage (data["message"]);
      setShowPopup(true);
      //console.log("password validity :"+data["success"]);
    }
    else{
        setpopupmessage ("Booking ERROR");
      seterrormessage (data["message"]);
      setShowPopup(true);
    }
    
  } catch (err) {
    console.log(err);
  }
};
const showBooking = async () => {
    try {
    const response = await fetch(
      "http://192.168.1.13:3000/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "showBooking",
          userId :userId,
          token:token,
        }),
      }
    );
    const data = await response.json();
    console.log(data);
    setPage("showbooking");
    if(data["success"]){
      setbooking(data["appointment"]);
      console.log("Received:", data.appointment);
      //console.log("password validity :"+data["success"]);
    }
    else{
        setbooking("Could not fetch data!");
    }
  } catch (err) {
    console.log(err);
  }
};
const [fontsLoaded] = useFonts({ Nunito_700Bold });
useEffect(() => {
  if (typeof userId === "string" && typeof token === "string") {
    handleSubmit(userId, token);
  }
}, [userId, token]);
  return (
    
  <LinearGradient
    colors={['white', 'white', 'white', 'white']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.container}
  >
    <SafeAreaView style={{ flex: 1 }}>

      {/* Header */}
      <Header />

      {/* Scrollable Dashboard Content */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
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
          //console.log({otp_screen});
        }}
      >
        <Text style={styles.popupButton}>
          Continue
        </Text>
      </Pressable>

    </ThemedView>

  </ThemedView>
</Modal>
        {/* Dashboard widgets go here */}
{page === "intro" && (
  <>  
<ThemedText type="title" style={styles.welcomeText}>
          Hello ,{name}
          </ThemedText>
        <ThemedText type="title" style={styles.ntext}>
          How Are You Feeling Today ?
          </ThemedText>
          <View style={styles.buttonContainer}>
  <Pressable
  style={({ pressed }) => [
    styles.actionButton,
    pressed && styles.buttonPressed,
  ]}
  onPress={() => handle_action("happy")}
>
  <ThemedText style={styles.buttonText1}>😊 Happy</ThemedText>
</Pressable>

<Pressable
  style={({ pressed }) => [
    styles.actionButton,
    pressed && styles.buttonPressed,
  ]}
  onPress={() => handle_action("anxious")}
>
  <ThemedText style={styles.buttonText1}>😥 Anxious</ThemedText>
</Pressable>

<Pressable
  style={({ pressed }) => [
    styles.actionButton,
    pressed && styles.buttonPressed,
  ]}
  onPress={() => handle_action("low")}
>
  <ThemedText style={styles.buttonText1}>😔 Low</ThemedText>
</Pressable>

<Pressable
  style={({ pressed }) => [
    styles.actionButton,
    pressed && styles.buttonPressed,
  ]}
  onPress={() => handle_action("stressed")}
>
  <ThemedText style={styles.buttonText1}>😫 Stressed</ThemedText>
</Pressable>

<Pressable
  style={({ pressed }) => [
    styles.actionButton,
    pressed && styles.buttonPressed,
  ]}
  onPress={() => handle_action("exhausted")}
>
  <ThemedText style={styles.buttonText1}>😩 Exhausted</ThemedText>
</Pressable>
</View>
</> )}
{page === "contents_page" && (
  <>  
    <ThemedText type="title" style={styles.ntext}>
          Explore Our Options:
          </ThemedText>
<View style={styles.buttonContainer2}>
  <Pressable style={styles.actionButton2} onPress={callCounsellor}>
    <ThemedText style={styles.buttonText2}>😊 Talk to Someone</ThemedText>
  </Pressable>

  <Pressable style={styles.actionButton2} onPress={handle_vid}>
    <ThemedText style={styles.buttonText2}>🌿 Breathing Excersice</ThemedText>
  </Pressable>

  <Pressable style={styles.actionButton2} onPress = {handle_pgc}>
    <ThemedText style={styles.buttonText2}>🔤 Articals</ThemedText>
  </Pressable>

  <Pressable style={styles.actionButton2} onPress={handle_contultant}>
    <ThemedText style={styles.buttonText2}>🙂 Book Consultant</ThemedText>
  </Pressable>

  <Pressable style={styles.actionButton2} onPress={showBooking}>
    <ThemedText style={styles.buttonText2}>🧾 Your Bookings</ThemedText>
  </Pressable>
</View>
          <Pressable
                  style={({ pressed }) => [
                    styles.submitButton,
                    pressed && styles.buttonPressed,]}onPress={handle_return}>
             <LinearGradient colors={['orange','orange','orange']}
             start={{ x: 0, y: 0 }}
             end={{ x: 1, y: 1 }}
             style={styles.buttonGradient}>
             <Text style={styles.buttonText1}>
                Back
              </Text>
            </LinearGradient>
          </Pressable> 
  </>)}
  {page === "consultant_booking" && (
  <>  
  <View style={styles.form}>

<ThemedText style={styles.label}>
Consultant Category
</ThemedText>

<Dropdown
    style={styles.dropdown}
    data={categoryData}
    labelField="label"
    valueField="value"
    placeholder="Select Category"
    value={category}
    onChange={item => setCategory(item.value)}
/>



<ThemedText style={styles.label}>
Preferred Language
</ThemedText>

<Dropdown
    style={styles.dropdown}
    data={languageData}
    labelField="label"
    valueField="value"
    placeholder="Select Language"
    value={language}
    onChange={item => setLanguage(item.value)}
/>

<ThemedText style={styles.label}>
Booking Month
</ThemedText>

<Dropdown
    style={styles.dropdown}
    data={monthData}
    labelField="label"
    valueField="value"
    placeholder="Select Month"
    value={month}
    onChange={item=>{
        setMonth(item.value);
        setDay(null);
    }}
/>

<ThemedText style={styles.label}>
Booking Day
</ThemedText>

<Dropdown
    style={styles.dropdown}
    data={dayData}
    labelField="label"
    valueField="value"
    placeholder="Select Day"
    value={day}
    onChange={item=>setDay(item.value)}
/>
<Text style={styles.label}>
  Preferred Time Slot
</Text>

<Dropdown
  style={styles.dropdown}
  data={timeData}
  labelField="label"
  valueField="value"
  placeholder="Select Time"
  value={time}
  onChange={item => setTime(item.value)}
/>
<ThemedText style={styles.label}>
Medium of Session
</ThemedText>

<Dropdown
    style={styles.dropdown}
    data={mediumData}
    labelField="label"
    valueField="value"
    placeholder="Select Medium"
    value={medium}
    onChange={item => setMedium(item.value)}
/>

</View>
<Pressable
        style={({ pressed }) => [
          styles.submitButton,
          pressed && styles.buttonPressed,]}onPress={book_appointment}>
   <LinearGradient colors={['#1CB7AC','#1CB7AC']}
   start={{ x: 0, y: 0 }}
   end={{ x: 1, y: 1 }}
   style={styles.buttonGradient}>
   <Text style={styles.buttonText}>
      Book Appointment
    </Text>
  </LinearGradient>
</Pressable> 
<Pressable
        style={({ pressed }) => [
          styles.submitButton,
          pressed && styles.buttonPressed,]}onPress={handle_return1}>
   <LinearGradient colors={['orange','orange']}
   start={{ x: 0, y: 0 }}
   end={{ x: 1, y: 1 }}
   style={styles.buttonGradient}>
   <Text style={styles.buttonText}>
      BACK
    </Text>
  </LinearGradient>
</Pressable> 
  </>)}
   {page === "showbooking" && (
  <> 
  <Pressable
        style={({ pressed }) => [
          styles.submitButton,
          pressed && styles.buttonPressed,]}>
   <LinearGradient colors={['orange','orange']}
   start={{ x: 0, y: 0 }}
   end={{ x: 1, y: 1 }}
   style={styles.buttonGradient}>
   <Text style={styles.buttonText}>
      {booking}
    </Text>
  </LinearGradient>
</Pressable> 
<Pressable
        style={({ pressed }) => [
          styles.submitButton,
          pressed && styles.buttonPressed,]}onPress={handle_return1}>
   <LinearGradient colors={['orange','orange']}
   start={{ x: 0, y: 0 }}
   end={{ x: 1, y: 1 }}
   style={styles.buttonGradient}>
   <Text style={styles.buttonText}>
      BACK
    </Text>
  </LinearGradient>
</Pressable> 
   </>)}


{page === "breathing" && (

<View>

{videos.map((item,index)=>(

<Pressable
    key={index}
    style={styles.videoCard}
    onPress={()=>{
        setSelectedVideo(item.video);
        setPage("player");
    }}
>

<Image
source={item.thumbnail}
style={styles.thumbnail}
/>
 
 <ThemedText style={styles.videoDuration}>
Duration :{item.duration}
</ThemedText>

<ThemedText style={styles.videoDuration}>
{item.title}
</ThemedText>

</Pressable>


))}

<Pressable
style={styles.submitButton}
onPress={()=>setPage("contents_page")}
>

<LinearGradient
colors={["orange","orange"]}
style={styles.buttonGradient}
>

<Text style={styles.buttonText}>
Back
</Text>

</LinearGradient>

</Pressable>


</View>

)}

{page === "player" && selectedVideo && (

<View style={{flex:1}}>

<VideoPlayer source={selectedVideo}/>

<Pressable
style={styles.submitButton}
onPress={()=>setPage("breathing")}
>

<LinearGradient
colors={["orange","orange"]}
style={styles.buttonGradient}
>

<Text style={styles.buttonText}>
Back
</Text>

</LinearGradient>

</Pressable>

</View>

)}

{page === "A1" && (
  <> 
<Pressable
style={styles.submitButton}
onPress={()=>setPage("Ap1")}
>

<LinearGradient
colors={["orange","gold"]}
style={styles.buttonGradient}
>

<Text style={styles.buttonText}>
Productivity-Articals
</Text>

</LinearGradient>

</Pressable>
<Pressable
style={styles.submitButton}
onPress={()=>setPage("Ap2")}
>

<LinearGradient
colors={["orange","gold"]}
style={styles.buttonGradient}
>

<Text style={styles.buttonText}>
 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;
 Self Care 
 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</Text>

</LinearGradient>

</Pressable>

<Pressable
style={styles.submitButton}
onPress={()=>setPage("Ap3")}
>

<LinearGradient
colors={["orange","gold"]}
style={styles.buttonGradient}
>

<Text style={styles.buttonText}>
Stress Management
</Text>

</LinearGradient>

</Pressable>
<Pressable
style={styles.submitButton}
onPress={()=>setPage("contents_page")}
>

<LinearGradient
colors={["orange","orange"]}
style={styles.buttonGradient}
>

<Text style={styles.buttonText}>
Back
</Text>

</LinearGradient>

</Pressable>
 </>)}
{page === "Ap1" && (
  <>
  <Image
      source={require("../../assets/thumbnails/A1.png")}
      style={{
        width: "100%",
        height: 220,
      }}
      resizeMode="cover"
    />
    <Text
      style={{
        fontSize: 20,
        fontFamily: "Nunito_700Bold",
        color: "#2E4F4F",
        marginTop: 20,
        marginHorizontal: 20,
      }}
    >{`Being productive doesn't mean working every minute of the day. It means using your time wisely and focusing on what truly matters.
Tips on Being Productive : 
• Start each day with a clear plan.

• Break large tasks into smaller, manageable steps.

• Remove distractions such as unnecessary phone notifications.

• Take short breaks to keep your mind fresh.

• Celebrate small achievements instead of waiting for perfection.

Productivity is built through consistency, not by overworking yourself. Even small progress each day adds up over time. Remember that rest is also part of being productive. A healthy mind performs better than an exhausted one.`}
</Text>
<Pressable
style={styles.submitButton}
onPress={()=>setPage("A1")}
>

<LinearGradient
colors={["orange","orange"]}
style={styles.buttonGradient}
>

<Text style={styles.buttonText}>
Back
</Text>

</LinearGradient>

</Pressable>

   </>)}
{page === "Ap2" && (
  <>
  <Image
      source={require("../../assets/thumbnails/A2.png")}
      style={{
        width: "100%",
        height: 220,
      }}
      resizeMode="cover"
    />
    <Text
      style={{
        fontSize: 20,
        fontFamily: "Nunito_700Bold",
        color: "#2E4F4F",
        marginTop: 20,
        marginHorizontal: 20,
      }}
    >{`Taking care of yourself is not a luxury. It is an important part of maintaining good mental and physical health.

Self-care doesn't have to be complicated. Small daily habits can make a big difference.

• Get at least 7 to 8 hours of sleep each night.

• Drink enough water throughout the day.

• Eat balanced meals and avoid skipping breakfast.

• Spend a few minutes outdoors whenever possible.

• Exercise regularly, even if it's just a 20-minute walk.

• Take short breaks while studying or working to refresh your mind.

• Limit excessive screen time and social media when it becomes overwhelming.

• Stay connected with friends and family. Talking to someone you trust can help reduce stress.

• Make time for hobbies that bring you joy, such as reading, music, drawing, or sports.

• Remember that it's okay to ask for help when you need it.

Self-care is about treating yourself with the same kindness that you would show someone you care about. Building healthy habits one step at a time can improve your mood, reduce stress, and help you feel more confident every day.`}
</Text>
<Pressable
style={styles.submitButton}
onPress={()=>setPage("A1")}
>

<LinearGradient
colors={["orange","orange"]}
style={styles.buttonGradient}
>

<Text style={styles.buttonText}>
Back
</Text>

</LinearGradient>

</Pressable>

   </>)}
{page === "Ap3" && (
  <>
  <Image
      source={require("../../assets/thumbnails/A3.png")}
      style={{
        width: "100%",
        height: 220,
      }}
      resizeMode="cover"
    />
    <Text
      style={{
        fontSize: 20,
        fontFamily: "Nunito_700Bold",
        color: "#2E4F4F",
        marginTop: 20,
        marginHorizontal: 20,
      }}
    >{`Stress is a normal part of life, but learning how to manage it can improve both your mental and physical well-being.

Everyone experiences stress differently. The goal isn't to eliminate stress completely, but to handle it in healthy ways.

• Take slow, deep breaths when you feel overwhelmed.

• Break large tasks into smaller, manageable steps.

• Get enough sleep each night to help your mind recover.

• Exercise regularly, even a short walk can reduce stress.

• Spend time with people who support and encourage you.

• Listen to calming music or practice relaxation techniques.

• Take regular breaks from work, studies, or screens.

• Focus on what you can control instead of worrying about everything at once.

• Don't hesitate to ask for help when you need it.

Remember that experiencing stress does not mean you are weak. It is a natural response to challenges. By building 
healthy habits and taking care of yourself, you can become more resilient and better prepared to face difficult situations. If stress begins to interfere with your daily life or feels overwhelming for a long period of time, consider speaking with a trusted person or a mental health professional.`}
</Text>
<Pressable
style={styles.submitButton}
onPress={()=>setPage("A1")}
>

<LinearGradient
colors={["orange","orange"]}
style={styles.buttonGradient}
>

<Text style={styles.buttonText}>
Back
</Text>

</LinearGradient>

</Pressable>

   </>)}

        {Platform.OS === 'web' && <WebBadge />}

      </ScrollView>

      {/* Footer Navigation */}
      <FooterNavigation />

    </SafeAreaView>
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
  
thumbnail: {
  width: "100%",
  height: 200,
},

videoTitle: {
  fontSize: 18,
  fontFamily: "Nunito_700Bold",
  paddingHorizontal: 15,
  paddingTop: 12,
},

videoDuration: {
  color: "gray",
  paddingHorizontal: 15,
  paddingBottom: 15,
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
  buttonContainer: {
  marginTop: 10,
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  paddingHorizontal: 20,
  gap: 16,
},
buttonPressed: {
  transform: [{ scale: 0.95 }],
  opacity: 0.8,
},
actionButton: {
  width: "47%",
  aspectRatio: 1.6,
  backgroundColor: "#FFFFFF",
  alignSelf:"center",
  borderWidth: 2,
  borderColor: "#6FD3C2",
  borderRadius: 18,

  justifyContent: "center",
  alignItems: "flex-start",   

  paddingLeft: 16,            // Space from the left edge
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 6,
  shadowOffset: {
    width: 0,
    height: 3,
  },
  elevation: 3,
},

buttonText1: {
  fontSize: 18,
  fontFamily: "Nunito_700Bold",
  color: "#2E4F4F",
  textAlign: "center",
},
  submitButton: {
  alignSelf: "center",
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
submitButton2: {
  alignSelf: "center",
  backgroundColor: 'gray',
  paddingVertical: 90,
  paddingHorizontal:20,
  borderRadius: 20,
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
  fontSize : 30,
  fontFamily: 'Nunito_700Bold',
  color:'black'
},
ntext:{
  textAlign: 'center',
  fontSize : 15,
  fontFamily: 'Nunito_700Bold',
  color:'gray'
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
form: {
    paddingHorizontal: 20,
    marginTop: 20,
},

label: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: "#2E4F4F",
    marginBottom: 8,
    marginTop: 18,
},

dropdown: {
    height: 55,
    borderWidth: 2,
    borderColor: "#6FD3C2",
    borderRadius: 14,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
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
buttonContainer2: {
  marginTop: 35,
  paddingHorizontal: 20,
  gap: 16,
},

actionButton2: {
  backgroundColor: "#FFFFFF",
  borderWidth: 2,
  borderColor: "#6FD3C2", // Light teal
  borderRadius: 18,
  paddingVertical: 18,
  paddingHorizontal: 20,

  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 6,
  shadowOffset: {
    width: 0,
    height: 3,
  },
  elevation: 3,
},
videoCard:{
    margin:15,
    backgroundColor:"white",
    borderRadius:18,
    overflow:"hidden",
    elevation:4,
},

buttonText2: {
  fontSize: 18,
  fontFamily: "Nunito_700Bold",
  color: "#2E4F4F",
  textAlign: "center",
},
});
function VideoPlayer({source}:{source:any}){

const player = useVideoPlayer(source,(player)=>{

player.play();

});

return(

<VideoView
  player={player}
  style={{
    width: "100%",
    height: 450,
  }}
  nativeControls={true}
/>

);

}