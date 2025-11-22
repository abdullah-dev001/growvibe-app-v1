import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import WhiteFadeGradient from "../assets/screens-assets/WhiteFadeGradient";
import Button from "../components/Button";
import { hp, wp } from "../helpers/common";

export default function Index() {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      router.replace("/(tabs)/(common)/home");
    }
  }, [isAuthenticated, user, router]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={[styles.headerText, { fontSize: wp(22), marginTop: hp(9) }]}>
        Devlook
      </Text>

      <View style={styles.mainContent}>
        <View style={styles.imageContainer}>
          <Image
            source={require("../assets/screens-assets/get-started-model.png")}
            contentFit="contain"
            style={{ height: hp(70), width: wp(100) }}
            cachePolicy="disk"
          />
        </View>

        <View style={[styles.gradientContainer, { height: hp(65) }]}>
          <WhiteFadeGradient />
          <View style={styles.textContainer}>
            <Text style={styles.title}>GrowVibe.</Text>
            <Text style={[styles.subtitle, { fontSize: hp(1.8) }]}>
              One app to manage your entire school journey smarter, safer, and
              more connected than ever before.
            </Text>
            <View style={{ width: wp(85), marginTop: hp(1.6), marginBottom: hp(6) }}>
              <Button
                title="Step Into Smarter Learning"
                onPress={() => router.push("/login")}
                size="medium"
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1CACF3",
  },
  headerText: {
    color: "#FFFFFF",
    opacity: 0.35,
    fontWeight: "600",
    width: "100%",
    textAlign: "center",
    fontFamily: "Poppins-SemiBold",
  },
  mainContent: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 200,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  gradientContainer: {
    width: "100%",
    position: "relative",
  },
  textContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: "600",
    letterSpacing: -0.9,
    textAlign: "center",
    lineHeight: hp(7),
    fontFamily: "Poppins-SemiBold",
  },
  subtitle: {
    color: "#4B5563", // gray-600
    width: "85%",
    fontWeight: "400",
    textAlign: "center",
    fontFamily: "Poppins-Regular",
  },
});
