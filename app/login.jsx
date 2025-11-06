import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import { Formik } from "formik";
import React, { useEffect } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import * as Yup from "yup";
import Button from "../components/Button";
import Input from "../components/Input";
import ScreenWrapper from "../components/ScreenWrapper";
import { hp, wp } from "../helpers/common";
import {
    setBranchId,
    setError,
    setLoading,
    setSessionId,
    setUser,
} from "../redux/slices/authSlice";
import { supabase } from "../supabaseClient";

// Validation schema
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const Login = () => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { user, sessionRestored } = useSelector((state) => state.auth);

  const handleLogin = async (values, { setSubmitting, setFieldError }) => {
    try {
      dispatch(setLoading(true));

      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        dispatch(setError(error.message));
        Alert.alert("Login Failed", error.message);
        setSubmitting(false);
      } else {
        dispatch(
          setUser({
            id: data.user.id,
            email: data.user.email,
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            role: data.user.app_metadata.role,
          })
        );

        // Derive branchId
        const branchIdFromAppMeta =
          data.user?.app_metadata?.branchId ||
          data.user?.app_metadata?.branch_Id;
        const branchIdFromUserMeta =
          data.user?.user_metadata?.branchId ||
          data.user?.user_metadata?.branch_Id;
        const branchId = branchIdFromAppMeta ?? branchIdFromUserMeta ?? null;

        if (branchId) {
          dispatch(setBranchId(branchId));
        }

        // Fetch active session for principal and coordinator
        const userRole = data.user.app_metadata?.role;
        const shouldFetchSession =
          (userRole === "principal" || userRole === "coordinator") && branchId;

        if (shouldFetchSession) {
          try {
            const { data: activeSessions, error: sessionError } = await supabase
              .from("session")
              .select("*")
              .eq("branch_Id", branchId)
              .eq("session_Status", true)
              .limit(1);

            if (!sessionError && activeSessions?.length > 0) {
              dispatch(setSessionId(activeSessions[0].id));
            }
          } catch (sessionErr) {
            console.error("Error fetching active session:", sessionErr);
          }
        }

        router.replace("/(tabs)/(common)/home");
        setSubmitting(false);
      }
    } catch (error) {
      dispatch(setError("An unexpected error occurred"));
      Alert.alert("Error", "An unexpected error occurred");
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (
      user?.role &&
      sessionRestored &&
      (pathname === "/login" || pathname === "/")
    ) {
      router.replace("/(tabs)/(common)/home");
    }
  }, [user, sessionRestored, pathname]);

  return (
    <ScreenWrapper style="dark" bg="#dbeafe">
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={[styles.imageWrapper, { marginTop: hp(6) }]}>
              <Image
                source={require("../assets/screens-assets/login-model.png")}
                contentFit="contain"
                style={{ height: hp(30), width: wp(100), zIndex: 1 }}
              />

              <View
                style={[
                  styles.formCard,
                  {
                    top: hp(28.2),
                    minHeight: hp(40),
                    maxHeight: "auto",
                  },
                ]}
              >
                <Text style={[styles.loginTitle, { fontSize: hp(3.2) }]}>
                  Login
                </Text>

                <View style={styles.formContainer}>
                  <Formik
                    initialValues={{ email: "", password: "" }}
                    validationSchema={LoginSchema}
                    onSubmit={handleLogin}
                  >
                    {({
                      handleChange,
                      handleBlur,
                      handleSubmit,
                      values,
                      errors,
                      touched,
                      isSubmitting,
                    }) => (
                      <>
                        <View style={{ gap: hp(1.2) }}>
                        <Input
                          type="email"
                          placeholder="Email"
                          value={values.email}
                          onChangeText={handleChange("email")}
                          onBlur={handleBlur("email")}
                          error={
                            touched.email && errors.email ? errors.email : ""
                          }
                        />
                        <Input
                          type="password"
                          placeholder="Password"
                          value={values.password}
                          onChangeText={handleChange("password")}
                          onBlur={handleBlur("password")}
                          error={
                            touched.password && errors.password
                              ? errors.password
                              : ""
                          }
                        />
                        </View>
                        <View style={{ marginTop: 16 }}>
                          <Button
                            title="Login"
                            bgColor="#1CACF3"
                            textColor="#FFFFFF"
                            onPress={handleSubmit}
                            loading={isSubmitting}
                            size="small"
                          />
                        </View>
                        <Text
                          style={[
                            styles.instituteText,
                            { fontSize: hp(1.6), marginTop: 16 },
                          ]}
                        >
                          Provided by your institute
                        </Text>
                      </>
                    )}
                  </Formik>
                </View>

                <Text
                  style={[styles.footerText, { fontSize: hp(2), marginTop: 12 }]}
                >
                  - Growvibe By{" "}
                  <Text style={styles.footerHighlight}>Devlook</Text> -
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: "#dbeafe",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  imageWrapper: {
    position: "relative",
  },
  formCard: {
    backgroundColor: "#1CACF3",
    width: "85%",
    padding: 16,
    borderRadius: 24,
    position: "absolute",
    left: "50%",
    transform: [{ translateX: -wp(42.5) }],
    alignSelf: "center",
  },
  loginTitle: {
    textAlign: "center",
    color: "#FFFFFF",
    fontWeight: "600",
  },
  formContainer: {
    width: "100%",
    marginTop: 16,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
  },
  instituteText: {
    textAlign: "center",
    color: "#6B7280", // gray-500
    fontWeight: "400",
  },
  footerText: {
    textAlign: "center",
    color: "#FFFFFF",
    fontWeight: "500",
    width: "100%",
  },
  footerHighlight: {
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default Login;
