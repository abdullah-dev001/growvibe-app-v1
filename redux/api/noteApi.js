import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";

export const noteApi = createApi({
    reducerPath: "noteApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["Notes"],
    keepUnusedDataFor: 7200,
    endpoints: (builder) => ({
        createNote: builder.mutation({
            async queryFn(noteData) {
                try {
                    const { data, error } = await supabase
                        .from("note")
                        .insert([
                            {
                                note_Title: noteData.note_Title,
                                note_Description: noteData.note_Description,
                                expire_Date: noteData.expire_Date,
                                created_By: noteData.created_By,
                                created_By_Name: noteData.created_By_Name,
                                created_By_Role: noteData.created_By_Role,
                                is_For_Entire_Branch: noteData.is_For_Entire_Branch,
                                specific_Class: noteData.specific_Class,
                                branch_Id: noteData.branch_Id,
                                school_Id: noteData.school_Id,
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
            invalidatesTags: ["Notes"],
        }),
        getNotesByBranchId: builder.query({
            async queryFn(branchId) {
                const { data, error } = await supabase
                    .from("note")
                    .select("*")
                    .eq("branch_Id", branchId)
                    .order("created_at", { ascending: false });
                
                if (error) throw error;
                return { data };
            },
            providesTags: ["Notes"],
        }),
        getNotesByBranchIdPaginated: builder.query({
            async queryFn({ branchId, offset = 0, limit = 5 }) {
                try {
                    const { data, error, count } = await supabase
                        .from("note")
                        .select("*", { count: "exact" })
                        .eq("branch_Id", branchId)
                        .order("created_at", { ascending: false })
                        .range(offset, offset + limit - 1);
                    
                    if (error) {
                        return { error: { status: 'CUSTOM_ERROR', data: error } };
                    }
                    
                    return {
                        data: {
                            items: data || [],
                            count: count || 0,
                        },
                    };
                } catch (err) {
                    return { error: { status: 'CUSTOM_ERROR', data: err } };
                }
            },
            providesTags: ["Notes"],
        }),
        updateNote: builder.mutation({
            async queryFn(noteData) {
                try {
                    const { data, error } = await supabase
                        .from("note")
                        .update({
                            note_Title: noteData.note_Title,
                            note_Description: noteData.note_Description,
                            expire_Date: noteData.expire_Date,
                            is_For_Entire_Branch: noteData.is_For_Entire_Branch,
                            specific_Class: noteData.specific_Class,
                        })
                        .eq("id", noteData.id)
                        .select();

                    if (error) {
                        return { error: { status: 'CUSTOM_ERROR', data: error } };
                    }
                    return { data };
                } catch (err) {
                    return { error: { status: 'CUSTOM_ERROR', data: err } };
                }
            },
            invalidatesTags: ["Notes"],
        }),
        deleteNote: builder.mutation({
            async queryFn(noteId) {
                try {
                    const { data, error } = await supabase
                        .from("note")
                        .delete()
                        .eq("id", noteId)
                        .select();

                    if (error) {
                        return { error: { status: 'CUSTOM_ERROR', data: error } };
                    }
                    return { data };
                } catch (err) {
                    return { error: { status: 'CUSTOM_ERROR', data: err } };
                }
            },
            invalidatesTags: ["Notes"],
        }),
    }),
});

export const { 
    useCreateNoteMutation, 
    useGetNotesByBranchIdQuery,
    useGetNotesByBranchIdPaginatedQuery,
    useUpdateNoteMutation,
    useDeleteNoteMutation
} = noteApi;

export const {
    useLazyGetNotesByBranchIdPaginatedQuery
} = noteApi;