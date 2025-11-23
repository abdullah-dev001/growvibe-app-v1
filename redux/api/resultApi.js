import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getUserFullName } from "../../helpers/getUserFullName";
import { sendPushNotificationToUsers } from "../../helpers/sendPushNotification";
import { supabase } from "../../supabaseClient";

export const resultApi = createApi({
    reducerPath: "resultApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["Result"],
    keepUnusedDataFor: 7200,
    endpoints: (builder) => ({
        getResultsByBranchAndClassPaginated: builder.query({
            async queryFn({ branchId, studentId, offset = 0, limit = 5 } = {}) {
                // First, get all data (view returns flattened rows - one per subject)
                let query = supabase
                    .from("result_with_details")
                    .select("*", { count: "exact" })
                    .eq("branch_Id", branchId)
                    .order("result_created_at", { ascending: false });

                // Filter by studentId if provided (must be a valid UUID)
                // UUID format: 8-4-4-4-12 hexadecimal characters
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                let shouldFilterByStudent = false;
                if (studentId !== null && studentId !== undefined && studentId !== '') {
                    if (uuidRegex.test(studentId)) {
                        query = query.eq("student", studentId);
                        shouldFilterByStudent = true;
                    }
                    // If not a valid UUID, we'll filter on client side after grouping
                }

                const { data, error, count } = await query;

                if (error) throw error;

                // Transform flattened data into nested structure
                // Group by result_id, then by student_result_id
                const resultsMap = new Map();

                (data || []).forEach((row) => {
                    const resultId = row.result_id;

                    // Initialize result if not exists
                    if (!resultsMap.has(resultId)) {
                        resultsMap.set(resultId, {
                            id: resultId,
                            branch_Id: row.branch_Id,
                            result_Title: row.result_Title,
                            result_Description: row.result_Description,
                            total_Marks: row.total_result_marks,
                            expire_Date: row.expire_Date,
                            created_at: row.result_created_at,
                            result_students: [],
                        });
                    }

                    const result = resultsMap.get(resultId);

                    // If this row has student data
                    if (row.student_result_id) {
                        // Find or create student result
                        let studentResult = result.result_students.find(
                            (sr) => sr.student_result_id === row.student_result_id
                        );

                        if (!studentResult) {
                            studentResult = {
                                student_result_id: row.student_result_id,
                                student: row.student,
                                total_Marks: row.student_total_marks,
                                created_at: row.student_result_created_at,
                                subjects: [],
                            };
                            result.result_students.push(studentResult);
                        }

                        // If this row has subject data, add it
                        if (row.subject_result_id) {
                            const subjectExists = studentResult.subjects.some(
                                (s) => s.subject_result_id === row.subject_result_id
                            );
                            if (!subjectExists) {
                                studentResult.subjects.push({
                                    subject_result_id: row.subject_result_id,
                                    subject_Name: row.subject_Name,
                                    obtained_Makrs: row.obtained_Makrs,
                                    total_Marks: row.subject_total_marks,
                                    created_at: row.subject_result_created_at,
                                });
                            }
                        }
                    }
                });

                // Convert map to array and sort by created_at
                let groupedResults = Array.from(resultsMap.values()).sort((a, b) => {
                    const dateA = new Date(a.created_at || 0);
                    const dateB = new Date(b.created_at || 0);
                    return dateB - dateA; // Descending order
                });

                // Filter by studentId on client side if it wasn't a valid UUID
                if (studentId !== null && studentId !== undefined && studentId !== '' && !shouldFilterByStudent) {
                    groupedResults = groupedResults.filter((result) => {
                        // Check if any student in result_students matches the studentId
                        return result.result_students.some((studentResult) => 
                            studentResult.student === studentId
                        );
                    });
                }

                // Apply pagination
                const paginatedResults = groupedResults.slice(offset, offset + limit);
                const total = groupedResults.length;

                return { 
                    data: { 
                        items: paginatedResults || [], 
                        total: total 
                    } 
                };
            },
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                const { branchId, studentId, offset = 0, limit = 5 } = queryArgs;
                return `${endpointName}(${branchId},${studentId || 'null'},${offset},${limit})`;
            },
            providesTags: (result, error, arg) => [
                { type: "Result", id: `${arg.branchId}-${arg.studentId || 'null'}` },
            ],
        }),
        createResult: builder.mutation({
            async queryFn(resultData) {
                const { data, error } = await supabase.functions.invoke('insert-result', {
                    body: resultData
                });

                if (error) throw error;

                // Send push notifications to class users (incharge + students)
                // First, get the student's class_Id from student_profile
                if (data && resultData.student_Id && resultData.branch_Id) {
                    try {
                        // Get student's class_Id (student_Id is auth_Id)
                        const { data: studentData } = await supabase
                            .from("student_profile")
                            .select("class_Id")
                            .eq("auth_Id", resultData.student_Id)
                            .maybeSingle();

                        if (studentData?.class_Id) {
                            const creatorName = await getUserFullName(resultData.created_By);
                            const notificationTitle = "New Result Published";
                            const notificationBody = `${creatorName} has published a new result: "${resultData.result_Title || 'Result'}".`;
                            const classUserIds = [];

                            // Get class incharge (teacher)
                            const { data: classData } = await supabase
                                .from("class")
                                .select("incharge_Id")
                                .eq("id", studentData.class_Id)
                                .maybeSingle();

                            if (classData?.incharge_Id && classData.incharge_Id !== resultData.created_By) {
                                classUserIds.push(classData.incharge_Id);
                            }

                            // Get all students in the class
                            const { data: students } = await supabase
                                .from("student_profile")
                                .select("auth_Id")
                                .eq("class_Id", studentData.class_Id)
                                .eq("branch_Id", resultData.branch_Id);

                            if (students) {
                                students.forEach(s => {
                                    if (s.auth_Id && s.auth_Id !== resultData.created_By) {
                                        classUserIds.push(s.auth_Id);
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
                                        type: "result",
                                        resultId: data?.result_Id || data?.id,
                                        title: resultData.result_Title,
                                        branchId: resultData.branch_Id,
                                        classId: studentData.class_Id,
                                        studentId: resultData.student_Id,
                                        createdBy: resultData.created_By,
                                    }
                                );
                            }
                        }
                    } catch (notificationError) {
                        console.log("Error sending push notification:", notificationError);
                    }
                }

                return { data };
            },
            invalidatesTags: (result, error, arg) => [
                { type: "Result", id: `${arg.branch_Id}-${arg.student_Id || 'null'}` },
            ],
        }),
    }),
});

export const {
    useGetResultsByBranchAndClassPaginatedQuery,
    useLazyGetResultsByBranchAndClassPaginatedQuery,
    useCreateResultMutation
} = resultApi;

