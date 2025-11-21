import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getUserFullName } from "../../helpers/getUserFullName";
import { sendPushNotificationToUsers } from "../../helpers/sendPushNotification";
import { supabase } from "../../supabaseClient";

export const diaryApi = createApi({
    reducerPath: "diaryApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["Diary"],
    keepUnusedDataFor: 7200,
    endpoints: (builder) => ({
        getDiariesByBranchAndClassPaginated: builder.query({
            async queryFn({ branchId, classId, offset = 0, limit = 5 } = {}) {
                const from = offset;
                const to = offset + limit - 1;

                let query = supabase
                    .from("diary_view")
                    .select("*", { count: "exact" })
                    .eq("branch_Id", branchId)
                    .order("created_at", { ascending: false });

                // Add classId filter only if it's provided (not null)
                if (classId !== null && classId !== undefined) {
                    query = query.eq("class_Id", classId);
                }

                const { data, error, count } = await query.range(from, to);

                if (error) throw error;

                return { data: { items: data || [], total: typeof count === 'number' ? count : (data?.length || 0) } };
            },
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                const { branchId, classId, offset = 0, limit = 5 } = queryArgs;
                return `${endpointName}(${branchId},${classId || 'null'},${offset},${limit})`;
            },
            providesTags: (result, error, arg) => [
                { type: "Diary", id: `${arg.branchId}-${arg.classId || 'null'}` },
            ],
        }),
        getDiaryById: builder.query({
            async queryFn(diaryId) {
                try {
                    const { data, error } = await supabase
                        .from("diary_view")
                        .select("*")
                        .eq("diary_id", diaryId)
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
            providesTags: (result, error, diaryId) => [
                { type: "Diary", id: diaryId },
                { type: "Diary", id: "LIST" },
            ],
        }),
        createDiary: builder.mutation({
            async queryFn(diaryData) {
                const { data, error } = await supabase.functions.invoke('insert-diary', {
                    body: diaryData
                });

                if (error) throw error;

                // Send push notifications to class users (incharge + students)
                if (data && diaryData.class_Id && diaryData.branch_Id) {
                    try {
                        const creatorName = await getUserFullName(diaryData.created_By);
                        const notificationTitle = "New Diary Entry Created";
                        const notificationBody = `${creatorName} has created a new diary entry: "${diaryData.diary_Title || 'Diary Entry'}".`;
                        const classUserIds = [];

                        // Get class incharge (teacher)
                        const { data: classData } = await supabase
                            .from("class")
                            .select("incharge_Id")
                            .eq("id", diaryData.class_Id)
                            .maybeSingle();

                        if (classData?.incharge_Id && classData.incharge_Id !== diaryData.created_By) {
                            classUserIds.push(classData.incharge_Id);
                        }

                        // Get all students in the class
                        const { data: students } = await supabase
                            .from("student_profile")
                            .select("auth_User_Id")
                            .eq("class_Id", diaryData.class_Id)
                            .eq("branch_Id", diaryData.branch_Id);

                        if (students) {
                            students.forEach(s => {
                                if (s.auth_User_Id && s.auth_User_Id !== diaryData.created_By) {
                                    classUserIds.push(s.auth_User_Id);
                                }
                            });
                        }

                        // Send notifications
                        if (classUserIds.length > 0) {
                            await sendPushNotificationToUsers(
                                [...new Set(classUserIds)],
                                notificationTitle,
                                notificationBody,
                                {
                                    type: "diary",
                                    diaryId: data?.diary_Id || data?.id,
                                    title: diaryData.diary_Title,
                                    branchId: diaryData.branch_Id,
                                    classId: diaryData.class_Id,
                                    createdBy: diaryData.created_By,
                                }
                            );
                        }
                    } catch (notificationError) {
                        console.log("Error sending push notification:", notificationError);
                    }
                }

                return { data };
            },
            invalidatesTags: (result, error, arg) => [
                { type: "Diary", id: `${arg.branch_Id}-${arg.class_Id || 'null'}` },
            ],
        }),
        updateDiary: builder.mutation({
            async queryFn(diaryData) {
                const { data, error } = await supabase.functions.invoke('update-diary', {
                    body: diaryData
                });

                if (error) throw error;
                return { data };
            },
            invalidatesTags: (result, error, arg) => [
                { type: "Diary", id: `${arg.branch_Id}-${arg.class_Id || 'null'}` },
                { type: "Diary", id: arg.diary_Id },
            ],
        }),
    }),
});

export const {
    useGetDiariesByBranchAndClassPaginatedQuery,
    useLazyGetDiariesByBranchAndClassPaginatedQuery,
    useGetDiaryByIdQuery,
    useCreateDiaryMutation,
    useUpdateDiaryMutation
} = diaryApi;

