import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '../../supabaseClient';

export const createAuthApi = createApi({
  reducerPath: 'createAuthApi',
  baseQuery: fetchBaseQuery(),
  tagTypes: ['Auth', 'Owners', 'Principals', 'Coordinators', 'Teachers', 'Students'],
  endpoints: (builder) => ({
    createAuth: builder.mutation({
      async queryFn({ email, password, status, role, school_Id, branch_Id,fullName,salary,fee,class_Id }) {
        const { data, error } = await supabase.functions.invoke("create-auth", {
          body: { email, password, status, role, school_Id, branch_Id,fullName,salary,fee,class_Id }
        });
        if (error) return { error: { message: error.message } };
        return {data};
      },
    }),
    updateAuth: builder.mutation({
      async queryFn({ user_Id, email, password, status, role, school_Id, branch_Id, fullName, salary, fee, class_Id }) {
        const { data, error } = await supabase.functions.invoke("update-auth", {
          body: { user_Id, email, password, status, role, school_Id, branch_Id, fullName, salary, fee, class_Id }
        });
        if (error) return { error: { message: error.message } };
        return {data};
      },
      invalidatesTags: ['Auth', 'Owners', 'Principals', 'Coordinators', 'Teachers', 'Students'],
    }),
  }),
});

export const {
  useCreateAuthMutation,
  useUpdateAuthMutation,
} = createAuthApi;
