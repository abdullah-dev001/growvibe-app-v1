import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";

export const chatApi = createApi({
    reducerPath: "chatApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["Chats", "ChatMembers"],
    keepUnusedDataFor: 7200,
    endpoints: (builder) => ({
        getUserGroupChats: builder.query({
            async queryFn() {
                try {
                    const { data, error } = await supabase
                        .from("user_group_chats")
                        .select("*")
                        .order("last_message_time", { ascending: false, nullsFirst: false });

                    if (error) {
                        return { error: { status: 'CUSTOM_ERROR', data: error } };
                    }

                    return { data: data || [] };
                } catch (err) {
                    return { error: { status: 'CUSTOM_ERROR', data: err } };
                }
            },
            providesTags: ["Chats"],
        }),
        createClassChat: builder.mutation({
            async queryFn({ classId, className, section, branchId, branchName, schoolId, createdBy, inchargeId }) {
                try {
                    // Create group name: "Class Name - Section - Branch Name (short)"
                    const branchNameShort = branchName?.length > 15 ? branchName.substring(0, 15) + '...' : branchName;
                    const groupName = `${className} - ${section} - ${branchNameShort || 'Branch'}`;

                    // Create chat group
                    const { data: chatData, error: chatError } = await supabase
                        .from("chat")
                        .insert([
                            {
                                type: "group",
                                group_Name: groupName,
                                class_Id: classId,
                                created_By: createdBy,
                                school_Id: schoolId,
                            },
                        ])
                        .select()
                        .single();

                    if (chatError) {
                        return { error: { status: 'CUSTOM_ERROR', data: chatError } };
                    }

                    // Add incharge as chat member if incharge exists
                    if (inchargeId && chatData?.id) {
                        const { error: memberError } = await supabase
                            .from("chat_member")
                            .insert([
                                {
                                    chat_Id: chatData.id,
                                    user_Id: inchargeId,
                                    role: "teacher",
                                },
                            ]);

                        if (memberError) {
                            // Error adding incharge to chat - don't fail the whole operation
                        }
                    }

                    return { data: chatData };
                } catch (err) {
                    return { error: { status: 'CUSTOM_ERROR', data: err } };
                }
            },
            invalidatesTags: ["Chats", "ChatMembers"],
        }),
        addStudentToClassChat: builder.mutation({
            async queryFn({ classId, studentId, chatId }) {
                try {
                    let chat_Id = chatId;

                    // If chatId is not provided, find the chat group for this class
                    if (!chat_Id && classId) {
                        const { data: chatData, error: chatError } = await supabase
                            .from("chat")
                            .select("id")
                            .eq("class_Id", classId)
                            .eq("type", "group")
                            .maybeSingle();

                        if (chatError) {
                            return { error: { status: 'CUSTOM_ERROR', data: chatError } };
                        }

                        if (!chatData?.id) {
                            // Chat group doesn't exist for this class
                            return { error: { status: 'CUSTOM_ERROR', data: { message: 'Chat group not found for this class' } } };
                        }

                        chat_Id = chatData.id;
                    }

                    if (!chat_Id) {
                        return { error: { status: 'CUSTOM_ERROR', data: { message: 'chat_Id is required' } } };
                    }

                    if (!studentId) {
                        return { error: { status: 'CUSTOM_ERROR', data: { message: 'user_Id is required' } } };
                    }

                    // Check if student is already a member
                    const { data: existingMember, error: checkError } = await supabase
                        .from("chat_member")
                        .select("id")
                        .eq("chat_Id", chat_Id)
                        .eq("user_Id", studentId)
                        .maybeSingle();

                    if (checkError && checkError.code !== 'PGRST116') {
                        return { error: { status: 'CUSTOM_ERROR', data: checkError } };
                    }

                    // Add student if not already a member
                    if (!existingMember) {
                        const { data: memberData, error: memberError } = await supabase
                            .from("chat_member")
                            .insert([
                                {
                                    chat_Id: chat_Id,
                                    user_Id: studentId,
                                    role: "student",
                                },
                            ])
                            .select()
                            .single();

                        if (memberError) {
                            return { error: { status: 'CUSTOM_ERROR', data: memberError } };
                        }

                        return { data: memberData };
                    }

                    return { data: existingMember };
                } catch (err) {
                    return { error: { status: 'CUSTOM_ERROR', data: err } };
                }
            },
            invalidatesTags: ["ChatMembers"],
        }),
    }),
});

export const {
    useGetUserGroupChatsQuery,
    useLazyGetUserGroupChatsQuery,
    useCreateClassChatMutation,
    useAddStudentToClassChatMutation,
} = chatApi;

