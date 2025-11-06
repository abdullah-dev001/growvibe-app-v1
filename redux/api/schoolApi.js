import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";

export const schoolApi = createApi({
    reducerPath: "schoolApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["Schools"],
    keepUnusedDataFor: 7200,
    endpoints: (builder) => ({
        createSchool: builder.mutation({
            async queryFn(school) {

                const { data, error } = await supabase
                    .from("school")
                    .insert([
                        {
                            school_Name: school.school_Name,
                            school_Address: school.school_Address,
                            school_Contact: school.school_Contact,
                            school_Status: school.school_Status,
                            school_Subscription_Fee: school.school_Subscription_Fee,
                            owner_Id: school.owner_Id,
                        },
                    ])
                    .select();

                if (error) throw error;
                return { data };
            },
            invalidatesTags: ["Schools"],
        }),
        getSchools: builder.query({
            async queryFn() {
                // Check if we have a valid session first
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError) {
                    throw sessionError;
                }
                
                if (!session) {
                    throw new Error('No authenticated session found');
                }
                
                const { data, error } = await supabase.from("school_with_owner").select("*").order("created_at", { ascending: false });
                
                if (error) {
                    throw error;
                }
                
                return { data };
            },
            providesTags: ["Schools"],
        }),
        getSchoolsPaginated: builder.query({
            async queryFn({ offset = 0, limit = 5 } = {}) {
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
                    .from("school_with_owner")
                    .select("*", { count: "exact" })
                    .order("created_at", { ascending: false })
                    .range(from, to);
                
                if (error) {
                    throw error;
                }
                
                return { data: { items: data || [], total: typeof count === 'number' ? count : (data?.length || 0) } };
            },
            providesTags: ["Schools"],
        }),
        getSchoolsByOwner: builder.query({
            async queryFn(ownerId) {
                const { data, error } = await supabase
                    .from("school_with_owner")
                    .select("*")
                    .eq("owner_Id", ownerId);

                if (error) throw error;
                return { data };
            },
            providesTags: ["Schools"],
        }),
        updateSchool: builder.mutation({
            async queryFn(school) {
                const { data, error } = await supabase
                    .from("school")
                    .update({
                        school_Name: school.school_Name,
                        school_Address: school.school_Address,
                        school_Contact: school.school_Contact,
                        school_Status: school.school_Status,
                        school_Subscription_Plan: school.school_Subscription_Plan,
                        owner_Id: school.owner_Id,
                    })
                    .eq("id", school.id)
                    .select();

                if (error) throw error;
                return { data };
            },
            invalidatesTags: ["Schools"],
        }),
    }),
});

export const {
    useCreateSchoolMutation,
    useGetSchoolsQuery,
    useGetSchoolsPaginatedQuery,
    useLazyGetSchoolsPaginatedQuery,
    useGetSchoolsByOwnerQuery,
    useUpdateSchoolMutation
} = schoolApi;
