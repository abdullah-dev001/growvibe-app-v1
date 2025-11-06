import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { hp } from "../helpers/common";

export default function Topbar() {
  return (
    <View style={styles.container}>
      <Image
        transition={500}
        cachePolicy={"disk"}
        contentFit="contain"
        style={styles.logo}
        source={require("../assets/screens-assets/growvibe-light.png")}
      />

      <Pressable style={styles.avatarContainer}>
        <Image
          transition={500}
          cachePolicy={"disk"}
          contentFit="cover"
          style={styles.avatar}
          source={{
            uri: "https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=928",
          }}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  logo: {
    height: hp(8),
    width: hp(8),
  },
  avatarContainer: {
    borderRadius: 9999,
    overflow: 'hidden',
    height: hp(4.4),
    width: hp(4.4),
  },
  avatar: {
    height: '100%',
    width: '100%',
    borderRadius: 100,
  },
});
