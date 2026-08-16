import { Image, StyleSheet, Text, View } from "react-native";

export default function Header() {
  return (
    <View style={styles.header}>
      <Image
        source={require("@/assets/logo.png")}
        style={styles.logo}
      />

      <Text style={styles.title}>
        CecureUs
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 100,
    paddingTop: 30,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
  },

  logo: {
    width: 100,
    height: 40,
    resizeMode: "contain",
    marginRight: 12,
  },

  title: {
    fontSize: 25,
    fontFamily: 'Nunito_700Bold',
    color: "orange",
  },
});