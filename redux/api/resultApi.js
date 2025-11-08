import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
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
            providesTags: ["Result"],
        }),
        createResult: builder.mutation({
            async queryFn(resultData) {
                const { data, error } = await supabase.functions.invoke('insert-result', {
                    body: resultData
                });

                if (error) throw error;
                return { data };
            },
            invalidatesTags: ["Result"],
        }),
    }),
});

export const {
    useGetResultsByBranchAndClassPaginatedQuery,
    useLazyGetResultsByBranchAndClassPaginatedQuery,
    useCreateResultMutation
} = resultApi;

