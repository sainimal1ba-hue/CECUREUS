import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
export default function FooterNavigation() {
  const router = useRouter();

  return (
    <View style={styles.container}>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/Dashboard")}
      >
        <Text style={styles.text2}>🏠</Text>
        <Text style={styles.text}>Home</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/Dashboard")}
      >
        <Text style={styles.text2}>🔍</Text>
        <Text style={styles.text}>Explore</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/Dashboard")}
      >
        <Text style={styles.text2}>🐼</Text>
        <Text style={styles.text}>AI</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/Dashboard")}
      >
        <Text style={styles.text2}>👤</Text>
        <Text style={styles.text}>Profile</Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 75,
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",

    borderTopWidth: 1,
    borderTopColor: "gray",
  },

  button: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  text: {
    color: "gray",
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    marginTop: 4,
  },
  text2: {
    fontSize: 20,
  },
});