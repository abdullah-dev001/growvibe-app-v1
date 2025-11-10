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
        getCoordinatorsByBranchPaginated: builder.query({
            async queryFn({ branchId, offset = 0, limit = 5 } = {}) {
              const from = offset;
              const to = offset + limit - 1;

              const { data, error, count } = await supabase
                .from("coordinators_with_branch")
                .select("*", { count: "exact" })
                .eq("branch_Id", branchId)
                .order("created_at", { ascending: false })
                .range(from, to);
          
              if (error) throw error;
              return { data: { items: data || [], total: typeof count === 'number' ? count : (data?.length || 0) } };
            },
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                const { branchId, offset = 0, limit = 5 } = queryArgs;
                return `${endpointName}(${branchId},${offset},${limit})`;
            },
            providesTags: (result, error, arg) => [
                { type: "Coordinators", id: arg.branchId },
            ],
          }),
    }),
});

export const {
    useGetCoordinatorsByBranchQuery,
    useGetCoordinatorsByBranchPaginatedQuery,
    useLazyGetCoordinatorsByBranchPaginatedQuery
} = coordinatorApi;
