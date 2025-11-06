import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";

export const sessionApi = createApi({
    reducerPath: "sessionApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["Sessions"],
    keepUnusedDataFor: 7200,
    endpoints: (builder) => ({
        createSession: builder.mutation({
            async queryFn(session) {
                try {
                    const { data, error } = await supabase
                        .from("session")
                        .insert([
                            {
                                session_Name: session.session_Name,
                                session_Status: session.session_Status,
                                session_Start: session.session_Start,
                                session_End: session.session_End,
                                branch_Id: session.branch_Id,
                            },
                        ])
                        .select();

                    if (error) {
                        return { error: { status: 'CUSTOM_ERROR', data: error } };
                    }
                    return { data };
                } catch (err) {
                    return { error: { status: 'CUSTOM_ERROR', data: err } };
                }
            },
            invalidatesTags: ["Sessions"],
        }),
        getSessionsByBranchId: builder.query({
            async queryFn(branchId) {
                const { data, error } = await supabase
                    .from("session")
                    .select("*")
                    .eq("branch_Id", branchId);
                
                if (error) throw error;
                return { data };
            },
            providesTags: ["Sessions"],
        }),
        updateSession: builder.mutation({
            async queryFn(session) {
                const { data, error } = await supabase
                    .from("session")
                    .update({
                        session_Name: session.session_Name,
                        session_Status: session.session_Status,
                        session_Start: session.session_Start,
                        session_End: session.session_End,
                        branch_Id: session.branch_Id,
                    })
                    .eq("id", session.id)
                    .select();

                if (error) throw error;
                return { data };
            },
            invalidatesTags: ["Sessions"],
        }),
        deleteSession: builder.mutation({
            async queryFn(sessionId) {
                const { data, error } = await supabase
                    .from("session")
                    .delete()
                    .eq("id", sessionId)
                    .select();

                if (error) throw error;
                return { data };
            },
            invalidatesTags: ["Sessions"],
        }),
        getActiveSessionByBranchId: builder.query({
            async queryFn(branchId) {
                const { data, error } = await supabase
                    .from("session")
                    .select("*")
                    .eq("branch_Id", branchId)
                    .eq("session_Status", true);

                if (error) throw error;
                return { data };
            },
            providesTags: ["Sessions"],
        }),
    }),
});

export const { 
    useCreateSessionMutation, 
    useGetSessionsByBranchIdQuery,
    useUpdateSessionMutation,
    useDeleteSessionMutation,
    useGetActiveSessionByBranchIdQuery
} = sessionApi;
