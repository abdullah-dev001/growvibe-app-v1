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
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                return `${endpointName}(${queryArgs.offset}-${queryArgs.limit})`;
            },
            providesTags: (result, error, arg) => [
                { type: "Schools", id: "LIST" },
                ...(result?.items?.map((item) => ({ type: "Schools", id: item.id })) || []),
            ],
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
        getSchoolById: builder.query({
            async queryFn(schoolId) {
                const { data, error } = await supabase
                    .from("school")
                    .select("*")
                    .eq("id", schoolId)
                    .single();

                if (error) throw error;
                return { data };
            },
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                return `${endpointName}(${queryArgs})`;
            },
            providesTags: (result, error, arg) => [{ type: "Schools", id: arg }],
        }),
        updateSchool: builder.mutation({
            async queryFn(school) {
                const updateData = {
                    school_Name: school.school_Name,
                    school_Address: school.school_Address,
                    school_Contact: school.school_Contact,
                    school_Status: school.school_Status,
                };

                // Include logo if provided
                if (school.school_Logo !== undefined) {
                    updateData.school_Logo = school.school_Logo;
                }

                const { data, error } = await supabase
                    .from("school")
                    .update(updateData)
                    .eq("id", school.id)
                    .select();

                if (error) throw error;
                return { data };
            },
            invalidatesTags: (result, error, arg) => [
                { type: "Schools", id: "LIST" },
                { type: "Schools", id: arg.id },
            ],
        }),
    }),
});

export const {
    useCreateSchoolMutation,
    useGetSchoolsQuery,
    useGetSchoolsPaginatedQuery,
    useLazyGetSchoolsPaginatedQuery,
    useGetSchoolsByOwnerQuery,
    useGetSchoolByIdQuery,
    useUpdateSchoolMutation
} = schoolApi;
