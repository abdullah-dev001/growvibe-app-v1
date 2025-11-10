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
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                const { branchId, offset = 0, limit = 5 } = queryArgs;
                return `${endpointName}(${branchId},${offset},${limit})`;
            },
            providesTags: (result, error, arg) => [
                { type: "Notes", id: arg.branchId },
            ],
        }),
        getLatestNotesByBranchAndClass: builder.query({
            async queryFn({ branchId, classId, limit = 3 }) {
                try {
                    let query = supabase
                        .from("note")
                        .select("note_Title, note_Description, created_at, is_For_Entire_Branch, created_By_Role")
                        .eq("branch_Id", branchId)
                        .order("created_at", { ascending: false })
                        .limit(limit);

                    // Filter: specific_Class is null OR equals classId
                    if (classId !== null && classId !== undefined) {
                        // Get notes where specific_Class is null (entire branch) OR equals classId
                        query = query.or(`specific_Class.is.null,specific_Class.eq.${classId}`);
                    } else {
                        // If no classId, only get notes for entire branch (specific_Class is null)
                        query = query.is("specific_Class", null);
                    }
                    
                    const { data, error } = await query;
                    
                    if (error) {
                        return { error: { status: 'CUSTOM_ERROR', data: error } };
                    }
                    
                    return { data: data || [] };
                } catch (err) {
                    return { error: { status: 'CUSTOM_ERROR', data: err } };
                }
            },
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                const { branchId, classId } = queryArgs;
                return `${endpointName}(${branchId},${classId || 'null'})`;
            },
            providesTags: (result, error, arg) => [
                { type: "Notes", id: `${arg.branchId}-${arg.classId || 'null'}` },
            ],
        }),
        getNotesByBranchAndClassPaginated: builder.query({
            async queryFn({ branchId, classId, offset = 0, limit = 5 }) {
                try {
                    let query = supabase
                        .from("note")
                        .select("note_Title, note_Description, created_at, is_For_Entire_Branch, created_By_Role, id", { count: "exact" })
                        .eq("branch_Id", branchId)
                        .order("created_at", { ascending: false })
                        .range(offset, offset + limit - 1);

                    // Filter: specific_Class is null OR equals classId
                    if (classId !== null && classId !== undefined) {
                        // Get notes where specific_Class is null (entire branch) OR equals classId
                        query = query.or(`specific_Class.is.null,specific_Class.eq.${classId}`);
                    } else {
                        // If no classId, only get notes for entire branch (specific_Class is null)
                        query = query.is("specific_Class", null);
                    }
                    
                    const { data, error, count } = await query;
                    
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
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                const { branchId, classId, offset = 0, limit = 5 } = queryArgs;
                return `${endpointName}(${branchId},${classId || 'null'},${offset},${limit})`;
            },
            providesTags: (result, error, arg) => [
                { type: "Notes", id: `${arg.branchId}-${arg.classId || 'null'}` },
            ],
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
    useGetNotesByBranchAndClassPaginatedQuery,
    useGetLatestNotesByBranchAndClassQuery,
    useUpdateNoteMutation,
    useDeleteNoteMutation
} = noteApi;

export const {
    useLazyGetNotesByBranchIdPaginatedQuery,
    useLazyGetNotesByBranchAndClassPaginatedQuery
} = noteApi;