import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";

export const checkAuthUserApi = createApi({
  reducerPath: "checkAuthUserApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["CheckAuthUser"],
  keepUnusedDataFor: 0, // Don't cache access checks for security
  endpoints: (builder) => ({
    checkUserAccess: builder.mutation({
      async queryFn(user_id) {
        try {
          // Validate user_id
          if (!user_id) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                data: {
                  message: "User ID is required",
                  logout: true,
                  reason: "No user ID provided",
                },
              },
            };
          }

          // Invoke edge function
          const { data, error } = await supabase.functions.invoke('check-user-access', {
            body: JSON.stringify({ user_id: user_id }),
          });

          // Handle Supabase function errors
          if (error) {
            console.error('Edge function error:', error);
            return {
              error: {
                status: "CUSTOM_ERROR",
                data: {
                  message: error.message || "Failed to check user access",
                  logout: true,
                  reason: "Server error",
                },
              },
            };
          }

          // Handle response data
          if (!data) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                data: {
                  message: "No response from server",
                  logout: true,
                  reason: "Server error",
                },
              },
            };
          }

          // Edge function returns { logout: boolean, reason?: string }
          // Always return as data (not error) so consuming code can check data.logout
          // This allows the app to handle logout gracefully with proper messaging
          return {
            data: {
              logout: data.logout ?? false,
              reason: data.reason || null,
            },
          };
        } catch (err) {
          console.error('Unexpected error in checkUserAccess:', err);
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: {
                message: err?.message || "An unexpected error occurred",
                logout: true,
                reason: "Server error",
              },
            },
          };
        }
      },
      // Don't invalidate tags - access checks should be fresh each time
    }),
  }),
});

export const { useCheckUserAccessMutation } = checkAuthUserApi;
