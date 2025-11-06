import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";
// teachers_without_class
export const coordinatorApi = createApi({
    reducerPath: "coordinatorApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["Coordinators"],
    keepUnusedDataFor: 7200,
    endpoints: (builder) => ({
        getCoordinatorsByBranch: builder.query({
            async queryFn(branchId) {
              const { data, error } = await supabase
                .from("coordinators_with_branch")
                .select("*")
                .eq("branch_Id", branchId);
          
              if (error) throw error;
              return { data };
            },
            providesTags: ["Coordinators"],
          }),
    }),
});

export const {
    useGetCoordinatorsByBranchQuery
} = coordinatorApi;
