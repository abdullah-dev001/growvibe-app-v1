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
        getPrincipalsByBranchPaginated: builder.query({
            async queryFn({ branchId, offset = 0, limit = 5 } = {}) {
              const from = offset;
              const to = offset + limit - 1;

              const { data, error, count } = await supabase
                .from("principals_with_branch")
                .select("*", { count: "exact" })
                .eq("branch_Id", branchId)
                .order("created_at", { ascending: false })
                .range(from, to);
          
              if (error) throw error;
              return { data: { items: data || [], total: typeof count === 'number' ? count : (data?.length || 0) } };
            },
            providesTags: ["Principals"],
          }),
          
    }),
});

export const {
    useGetPrincipalsByBranchQuery,
    useGetPrincipalsByBranchPaginatedQuery,
    useLazyGetPrincipalsByBranchPaginatedQuery
} = principalApi;
