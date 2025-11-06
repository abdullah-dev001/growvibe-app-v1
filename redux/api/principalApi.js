import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";
// teachers_without_class
export const principalApi = createApi({
    reducerPath: "principalApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["Principals"],
    keepUnusedDataFor: 7200,
    endpoints: (builder) => ({
        getPrincipalsByBranch: builder.query({
            async queryFn(branchId) {
              const { data, error } = await supabase
                .from("principals_with_branch")
                .select("*")
                .eq("branch_Id", branchId);
          
              if (error) throw error;
              return { data };
            },
            providesTags: ["Principals"],
          }),
          
    }),
});

export const {
    useGetPrincipalsByBranchQuery
} = principalApi;
