import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";
import { clearAuth, setAuth } from "../slices/authSlice";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    signIn: builder.mutation({
      async queryFn({ email, password }, { dispatch }) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          dispatch(setAuth(data));
          return { data };
        } catch (err) {
          return { error: { message: err.message } };
        }
      },
    }),
    signOut: builder.mutation({
      async queryFn(_arg, { dispatch }) {
        try {
          await supabase.auth.signOut();
          dispatch(clearAuth());
          return { data: true };
        } catch (err) {
          return { error: { message: err.message } };
        }
      },
    }),
  }),
});

export const { useSignInMutation, useSignOutMutation } = authApi;
