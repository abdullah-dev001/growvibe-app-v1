import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '../../supabaseClient';

export const createAuthApi = createApi({
  reducerPath: 'createAuthApi',
  baseQuery: fetchBaseQuery(),
  tagTypes: ['Auth'],
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
  }),
});

export const {
  useCreateAuthMutation,
} = createAuthApi;
