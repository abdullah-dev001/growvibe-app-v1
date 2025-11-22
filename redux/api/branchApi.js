import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";

export const branchApi = createApi({
    reducerPath: "branchApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["Branches"],
    keepUnusedDataFor: 7200,
    endpoints: (builder) => ({
        createBranch: builder.mutation({
            async queryFn(branch) {
                const { data, error } = await supabase
                    .from("branch")
                    .insert([
                        {
                            school_Id: branch.school_Id,
                            branch_Name: branch.branch_Name,
                            branch_Address: branch.branch_Address,
                            branch_Contact: branch.branch_Contact,
                            branch_Subscription_Fee: branch.branch_Subscription_Fee,
                            branch_Status: branch.branch_Status,
                        },
                    ])

                if (error) throw error;
                return { data };
            },
            invalidatesTags: ["Branches"],
        }),
        getBranchesBySchool: builder.query({
            async queryFn(schoolId) {
                // Check if we have a valid session first
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError) {
                    throw sessionError;
                }
                
                if (!session) {
                    throw new Error('No authenticated session found');
                }
                
                const { data, error } = await supabase
                    .from("branch")
                    .select("*")
                    .order("created_at", { ascending: false })
                    .eq("school_Id", schoolId);
                    
                if (error) {
                    throw error;
                }
                
                return { data };
            },
            providesTags: ["Branches"],
        }),
        getBranchesBySchoolPaginated: builder.query({
            async queryFn({ schoolId, offset = 0, limit = 5 } = {}) {
                // Check if we have a valid session first
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError) {
                    throw sessionError;
                }
                
                if (!session) {
                    throw new Error('No authenticated session found');
                }
                
                const from = offset;
                const to = offset + limit - 1;

                const { data, error, count } = await supabase
                    .from("branch")
                    .select("*", { count: "exact" })
                    .order("created_at", { ascending: false })
                    .eq("school_Id", schoolId)
                    .range(from, to);
                    
                if (error) {
                    throw error;
                }
                
                return { data: { items: data || [], total: typeof count === 'number' ? count : (data?.length || 0) } };
            },
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                return `${endpointName}(${queryArgs.schoolId}-${queryArgs.offset}-${queryArgs.limit})`;
            },
            providesTags: (result, error, arg) => [
                { type: "Branches", id: "LIST" },
                ...(result?.items?.map((item) => ({ type: "Branches", id: item.id })) || []),
            ],
        }),
        getBranchesBySchools: builder.query({
            async queryFn(schoolIds) {
                if (!schoolIds || schoolIds.length === 0) {
                    return { data: [] };
                }
                
                const { data, error } = await supabase
                    .from("branch")
                    .select("*")
                    .in("school_Id", schoolIds);
                
                if (error) throw error;
                return { data };
            },
            providesTags: ["Branches"],
        }),
        getBranchById: builder.query({
            async queryFn(branchId) {
                const { data, error } = await supabase
                    .from("branch")
                    .select("*")
                    .eq("id", branchId)
                    .single();

                if (error) throw error;
                return { data };
            },
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                return `${endpointName}(${queryArgs})`;
            },
            providesTags: (result, error, arg) => [{ type: "Branches", id: arg }],
        }),
        updateBranch: builder.mutation({
            async queryFn(branch) {
                const { data, error } = await supabase
                    .from("branch")
                    .update({
                        branch_Name: branch.branch_Name,
                        branch_Address: branch.branch_Address,
                        branch_Contact: branch.branch_Contact,
                        branch_Subscription_Fee: branch.branch_Subscription_Fee,
                        branch_Status: branch.branch_Status,
                    })
                    .eq("id", branch.id)
                    .select();

                if (error) throw error;
                return { data };
            },
            invalidatesTags: (result, error, arg) => [
                { type: "Branches", id: "LIST" },
                { type: "Branches", id: arg.id },
            ],
        }),
        deleteBranch: builder.mutation({
            async queryFn(branchId) {
                const { data, error } = await supabase
                    .from("branch")
                    .delete()
                    .eq("id", branchId)
                    .select();

                if (error) throw error;
                return { data };
            },
            invalidatesTags: ["Branches"],
        }),
    }),
});

export const { 
    useCreateBranchMutation, 
    useGetBranchesBySchoolQuery,
    useGetBranchesBySchoolPaginatedQuery,
    useLazyGetBranchesBySchoolPaginatedQuery,
    useGetBranchesBySchoolsQuery,
    useGetBranchByIdQuery,
    useUpdateBranchMutation,
    useDeleteBranchMutation 
} = branchApi;
