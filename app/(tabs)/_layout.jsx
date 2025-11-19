import { Image } from "expo-image";
import { Tabs, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import Chat from "../../assets/icons/Chat";
import Home from "../../assets/icons/Home";
import Profile from "../../assets/icons/Profile";
import Support from "../../assets/icons/Support";
import ScreenWrapper from "../../components/ScreenWrapper";
import { COLORS } from "../../constants/theme";
import { hp } from "../../helpers/common";
import { useCheckUserAccessMutation } from "../../redux/api/checkAuthUserApi";
import { logout as logoutAction } from "../../redux/slices/authSlice";
import { supabase } from "../../supabaseClient";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();
  const [checkUserAccess] = useCheckUserAccessMutation();
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  useEffect(() => {
    if (!user || hasCheckedAccess || isCheckingAccess) return;

    const checkAccess = async () => {
      setIsCheckingAccess(true);
      const handleForcedLogout = async (message) => {
        Alert.alert("Access Denied", message || "Your account has been deactivated.");
        await supabase.auth.signOut();
        dispatch(logoutAction());
        setHasCheckedAccess(false);
        router.replace('/login');
      };

      try {
        const { data: accessCheck, error: accessError } = await checkUserAccess(user.id);

        if (accessError) {
          await handleForcedLogout(accessError.data?.message || "Something went wrong");
          return;
        }

        if (accessCheck?.logout) {
          await handleForcedLogout(accessCheck.reason);
          return;
        }

        setHasCheckedAccess(true);
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [user, hasCheckedAccess, isCheckingAccess]);

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <ScreenWrapper style={{ backgroundColor: "white", flex: 1 }}>
        <Tabs
          style={{ borderTopWidth: 1, borderTopColor: "#E5E7EB", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: COLORS.primary,
            tabBarStyle: {
              backgroundColor: "white",
              paddingHorizontal: hp(1.2),
              paddingTop: hp(2.4),
              paddingBottom: insets.bottom,
              height: Platform.OS === "ios" ? hp(12) : hp(10) + insets.bottom,
              borderTopLeftRadius: hp(2),
              borderTopRightRadius: hp(2),
            },
          }}
        >
          <Tabs.Screen
            name="(common)/home"
            options={{
              tabBarLabel: ({ color }) => (
                <Text
                  style={{
                    color,
                    fontSize: hp(1.3),
                    fontWeight: "500",
                    letterSpacing: -0.4,
                  }}
                >
                  Home
                </Text>
              ),
              tabBarIcon: ({ color }) => (
                <Home color={color} size={hp(2.9)} strokeWidth={1.6} />
              ),
              tabBarButton: (props) => (
                <TouchableOpacity {...props} activeOpacity={1} />
              ),
            }}
          />

          <Tabs.Screen
            name="(common)/chat"
            options={{
              tabBarItemStyle: { marginRight: hp(7.5) },
              tabBarLabel: ({ color }) => (
                <Text
                  style={{
                    color,
                    fontSize: hp(1.3),
                    fontWeight: "500",
                    letterSpacing: -0.4,
                  }}
                >
                  Chat
                </Text>
              ),
              tabBarIcon: ({ color }) => (
                <Chat color={color} size={hp(2.9)} strokeWidth={1.6} />
              ),
              tabBarButton: (props) => (
                <TouchableOpacity {...props} activeOpacity={1} />
              ),
            }}
          />

          <Tabs.Screen
            name="(common)/support"
            options={{
              tabBarLabel: ({ color }) => (
                <Text
                  style={{
                    color,
                    fontSize: hp(1.3),
                    fontWeight: "500",
                    letterSpacing: -0.4,
                  }}
                >
                  Support
                </Text>
              ),
              tabBarIcon: ({ color }) => (
                <Support color={color} size={hp(2.9)} strokeWidth={1.6} />
              ),
              tabBarButton: (props) => (
                <TouchableOpacity {...props} activeOpacity={1} />
              ),
            }}
          />

          <Tabs.Screen
            name="(common)/profile"
            options={{
              tabBarLabel: ({ color }) => (
                <Text
                  style={{
                    color,
                    fontWeight: "500",
                    fontSize: hp(1.3),
                    letterSpacing: -0.4,
                  }}
                >
                  Profile
                </Text>
              ),
              tabBarIcon: ({ color }) => (
                <Profile color={color} size={hp(2.9)} strokeWidth={1.6} />
              ),
              tabBarButton: (props) => (
                <TouchableOpacity {...props} activeOpacity={1} />
              ),
            }}
          />
        </Tabs>

        <Pressable
          onPress={() => router.push('/screens/adminProfile')}
          style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}
        >
          <View
            style={{
              position: "absolute",
              bottom: Platform.OS === "ios" ? hp(8) : hp(5.5) + insets.bottom,
              left: "50%",
              transform: [{ translateX: -hp(4.5) }],
              width: hp(9),
              height: hp(9),
              overflow: "hidden",
              borderRadius: hp(4.5),
              backgroundColor: COLORS.primary,
              alignItems: "center",
              justifyContent: "center",
              elevation: 6,
            }}
          >
            <Image
              transition={500}
              cachePolicy={"disk"}
              contentFit="contain"
              style={{ width: hp(9), height: hp(9), borderRadius: hp(4.5), overflow: "hidden", objectFit: "cover" }}
              source={require("../../assets/screens-assets/devlookchatbot.png")}
            />
          </View>
        </Pressable>
      </ScreenWrapper>
    </View>
  );
}
