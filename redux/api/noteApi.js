import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getUserFullName } from "../../helpers/getUserFullName";
import { sendPushNotificationToUsers } from "../../helpers/sendPushNotification";
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
                                is_For_Entire_Branch: noteData.is_For_Entire_Branch,
                                specific_Class: noteData.specific_Class,
                                class_Name: noteData.class_Name,
                                branch_Id: noteData.branch_Id,
                                school_Id: noteData.school_Id,
                            },
                        ])
                        .select();

                    if (error) {
                        return { error: { status: 'CUSTOM_ERROR', data: error } };
                    }

                    // Send push notifications based on note target
                    try {
                        const creatorName = await getUserFullName(noteData.created_By);
                        const notificationTitle = "New Note Created";
                        let notificationBody = `${creatorName} has created a new note: "${noteData.note_Title}".`;
                        let userIds = [];

                        if (noteData.is_For_Entire_Branch) {
                            // Send to all users in the branch (except creator)
                            // Get all users from different profile tables for this branch
                            const allUserIds = [];

                            // Get principals
                            const { data: principals } = await supabase
                                .from("principal_profile")
                                .select("auth_Id")
                                .eq("branch_Id", noteData.branch_Id);

                            if (principals) {
                                principals.forEach(p => {
                                    if (p.auth_Id && p.auth_Id !== noteData.created_By) {
                                        allUserIds.push(p.auth_Id);
                                    }
                                });
                            }

                            // Get coordinators
                            const { data: coordinators } = await supabase
                                .from("coordinator_profile")
                                .select("auth_Id")
                                .eq("branch_Id", noteData.branch_Id);

                            if (coordinators) {
                                coordinators.forEach(c => {
                                    if (c.auth_Id && c.auth_Id !== noteData.created_By) {
                                        allUserIds.push(c.auth_Id);
                                    }
                                });
                            }

                            // Get teachers
                            const { data: teachers } = await supabase
                                .from("teacher_profile")
                                .select("auth_Id")
                                .eq("branch_Id", noteData.branch_Id);

                            if (teachers) {
                                teachers.forEach(t => {
                                    if (t.auth_Id && t.auth_Id !== noteData.created_By) {
                                        allUserIds.push(t.auth_Id);
                                    }
                                });
                            }

                            // Get students
                            const { data: students } = await supabase
                                .from("student_profile")
                                .select("auth_Id")
                                .eq("branch_Id", noteData.branch_Id);

                            if (students) {
                                students.forEach(s => {
                                    if (s.auth_Id && s.auth_Id !== noteData.created_By) {
                                        allUserIds.push(s.auth_Id);
                                    }
                                });
                            }

                            userIds = [...new Set(allUserIds)]; // Remove duplicates
                        } else if (noteData.specific_Class) {
                            // Send to class incharge and all students in that class
                            const classUserIds = [];

                            // Get class incharge (teacher)
                            const { data: classData } = await supabase
                                .from("class")
                                .select("incharge_Id")
                                .eq("id", noteData.specific_Class)
                                .maybeSingle();

                            if (classData?.incharge_Id && classData.incharge_Id !== noteData.created_By) {
                                classUserIds.push(classData.incharge_Id);
                            }

                            // Get all students in the class
                            const { data: students } = await supabase
                                .from("student_profile")
                                .select("auth_Id")
                                .eq("class_Id", noteData.specific_Class)
                                .eq("branch_Id", noteData.branch_Id);

                            if (students) {
                                students.forEach(s => {
                                    if (s.auth_Id && s.auth_Id !== noteData.created_By) {
                                        classUserIds.push(s.auth_Id);
                                    }
                                });
                            }

                            userIds = [...new Set(classUserIds)]; // Remove duplicates
                        }

                        // Send notifications to all target users
                        if (userIds.length > 0) {
                            await sendPushNotificationToUsers(
                                userIds,
                                notificationTitle,
                                notificationBody,
                                {
                                    type: "note",
                                    noteId: data?.[0]?.id,
                                    title: noteData.note_Title,
                                    description: noteData.note_Description,
                                    expireDate: noteData.expire_Date,
                                    isForEntireBranch: noteData.is_For_Entire_Branch,
                                    specificClass: noteData.specific_Class,
                                    className: noteData.class_Name,
                                    branchId: noteData.branch_Id,
                                    schoolId: noteData.school_Id,
                                    createdBy: noteData.created_By,
                                }
                            );
                        }
                    } catch (notificationError) {
                        // Log error but don't fail the note creation
                        console.log("Error sending push notification:", notificationError);
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
                    .from("note_view")
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
                        .from("note_view")
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
        getNoteById: builder.query({
            async queryFn(noteId) {
                try {
                    const { data, error } = await supabase
                        .from("note_view")
                        .select("*")
                        .eq("id", noteId)
                        .single();

                    if (error) {
                        return { error: { status: 'CUSTOM_ERROR', data: error } };
                    }
                    return { data: data || null };
                } catch (err) {
                    return { error: { status: 'CUSTOM_ERROR', data: err } };
                }
            },
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                return `${endpointName}(${queryArgs})`;
            },
            providesTags: (result, error, noteId) => [
                { type: "Notes", id: noteId },
                { type: "Notes", id: "LIST" },
            ],
        }),
        getLatestNotesByBranchAndClass: builder.query({
            async queryFn({ branchId, classId, limit = 3 }) {
                try {
                    let query = supabase
                        .from("note_view")
                        .select("note_Title, note_Description, created_at, is_For_Entire_Branch, created_by_role")
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
                        .from("note_view")
                        .select("note_Title, note_Description, created_at, is_For_Entire_Branch, created_by_role, id", { count: "exact" })
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
                            class_Name: noteData.class_Name,
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
            invalidatesTags: (result, error, arg) => [
                { type: "Notes", id: arg.branch_Id },
                { type: "Notes", id: arg.id },
            ],
        }),
        deleteNote: builder.mutation({
            async queryFn({ noteId, branchId }) {
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
            invalidatesTags: (result, error, arg) => [
                { type: "Notes", id: arg.branchId },
            ],
        }),
    }),
});

export const { 
    useCreateNoteMutation, 
    useGetNotesByBranchIdQuery,
    useGetNotesByBranchIdPaginatedQuery,
    useGetNotesByBranchAndClassPaginatedQuery,
    useGetLatestNotesByBranchAndClassQuery,
    useGetNoteByIdQuery,
    useUpdateNoteMutation,
    useDeleteNoteMutation
} = noteApi;

export const {
    useLazyGetNotesByBranchIdPaginatedQuery,
    useLazyGetNotesByBranchAndClassPaginatedQuery
} = noteApi;