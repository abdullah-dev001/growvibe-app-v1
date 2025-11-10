import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";

export const profileApi = createApi({
    reducerPath: "profileApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["Profile"],
    keepUnusedDataFor: 7200,
    endpoints: (builder) => ({
        getProfileByRole: builder.query({
            async queryFn({ userId, role }) {
                try {
                    let tableName = '';
                    
                    // Map role to table name
                    switch (role) {
                        case 'admin':
                        case 'owner':
                            tableName = 'admin_profile';
                            break;
                        case 'coordinator':
                            tableName = 'coordinator_profile';
                            break;
                        case 'principal':
                            tableName = 'principal_profile';
                            break;
                        case 'teacher':
                            tableName = 'teacher_profile';
                            break;
                        case 'student':
                            tableName = 'student_profile';
                            break;
                        default:
                            return { error: { status: 'CUSTOM_ERROR', data: { message: `Unknown role: ${role}` } } };
                    }

                    if (!tableName) {
                        return { error: { status: 'CUSTOM_ERROR', data: { message: 'Invalid role' } } };
                    }

                    // Fetch profile based on auth_Id
                    const { data, error } = await supabase
                        .from(tableName)
                        .select("*")
                        .eq("auth_Id", userId)
                        .single();

                    if (error) {
                        // If no profile found, return null instead of error
                        if (error.code === 'PGRST116') {
                            return { data: null };
                        }
                        return { error: { status: 'CUSTOM_ERROR', data: error } };
                    }

                    return { data };
                } catch (err) {
                    return { error: { status: 'CUSTOM_ERROR', data: err } };
                }
            },
            providesTags: (result, error, arg) => [
                { type: "Profile", id: `${arg.role}-${arg.userId}` },
            ],
        }),
    }),
});

export const {
    useGetProfileByRoleQuery,
    useLazyGetProfileByRoleQuery
} = profileApi;

