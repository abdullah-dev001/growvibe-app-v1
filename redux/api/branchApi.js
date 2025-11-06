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
                            branch_Status: branch.branch_Status,
                            branch_Subscription_Fee: branch.branch_Subscription_Fee,
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
        updateBranch: builder.mutation({
            async queryFn(branch) {
                const { data, error } = await supabase
                    .from("branch")
                    .update({
                        branch_Name: branch.branch_Name,
                        branch_Address: branch.branch_Address,
                        branch_Contact: branch.branch_Contact,
                        branch_Status: branch.branch_Status,
                        branch_Due: branch.branch_Due,
                    })
                    .eq("id", branch.id)
                    .select();

                if (error) throw error;
                return { data };
            },
            invalidatesTags: ["Branches"],
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
    useGetBranchesBySchoolsQuery,
    useUpdateBranchMutation,
    useDeleteBranchMutation 
} = branchApi;
