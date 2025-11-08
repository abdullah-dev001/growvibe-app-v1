import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";

export const leaderboardApi = createApi({
    reducerPath: "leaderboardApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["Leaderboard"],
    keepUnusedDataFor: 7200,
    endpoints: (builder) => ({
        getLeaderboardsByBranchAndClassPaginated: builder.query({
            async queryFn({ branchId, classId, offset = 0, limit = 5 } = {}) {
                const from = offset;
                const to = offset + limit - 1;

                let query = supabase
                    .from("leaderboard_view")
                    .select("*", { count: "exact" })
                    .eq("branch_id", branchId)
                    .order("created_at", { ascending: false });

                // Add classId filter only if it's provided (not null)
                if (classId !== null && classId !== undefined) {
                    query = query.eq("class_id", classId);
                }

                const { data, error, count } = await query.range(from, to);

                if (error) throw error;

                // Handle both formats: array of objects with nested students, or flattened rows
                let leaderboards = [];
                
                if (data && data.length > 0) {
                    // Check if data is already in the expected format (array with nested students)
                    if (data[0].students && Array.isArray(data[0].students)) {
                        // Data is already in the correct format
                        leaderboards = data.map((item) => ({
                            leaderboard_id: item.leaderboard_id || item.id,
                            title: item.title || item.leaderboard_title,
                            expire_date: item.expire_date,
                            class_id: item.class_id,
                            branch_id: item.branch_id,
                            created_at: item.created_at,
                            created_by: item.created_by,
                            students: (item.students || []).map((student) => ({
                                studentId: student.studentId || student.student_id,
                                fullName: student.fullName || student.full_name,
                                email: student.email,
                                userImage: student.userImage || student.user_image,
                                rank: student.rank,
                            })),
                        }));
                    } else {
                        // Data is flattened, need to group by leaderboard_id
                        const leaderboardsMap = new Map();

                        (data || []).forEach((row) => {
                            const leaderboardId = row.leaderboard_id;

                            if (!leaderboardsMap.has(leaderboardId)) {
                                leaderboardsMap.set(leaderboardId, {
                                    leaderboard_id: row.leaderboard_id,
                                    title: row.title || row.leaderboard_title,
                                    expire_date: row.expire_date,
                                    class_id: row.class_id,
                                    branch_id: row.branch_id,
                                    created_at: row.created_at,
                                    created_by: row.created_by,
                                    students: [],
                                });
                            }

                            const leaderboard = leaderboardsMap.get(leaderboardId);

                            // Add student if not already added
                            const studentId = row.student_id || row.studentId;
                            if (studentId && !leaderboard.students.find(s => 
                                (s.studentId || s.student_id) === studentId
                            )) {
                                leaderboard.students.push({
                                    studentId: studentId,
                                    fullName: row.full_name || row.fullName,
                                    email: row.email,
                                    userImage: row.user_image || row.userImage,
                                    rank: row.rank,
                                });
                            }
                        });

                        leaderboards = Array.from(leaderboardsMap.values());
                    }
                }

                // Sort by created_at
                leaderboards.sort((a, b) => {
                    const dateA = new Date(a.created_at || 0);
                    const dateB = new Date(b.created_at || 0);
                    return dateB - dateA; // Descending order
                });

                return { 
                    data: { 
                        items: leaderboards || [], 
                        total: typeof count === 'number' ? count : (leaderboards?.length || 0) 
                    } 
                };
            },
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                const { branchId, classId, offset = 0, limit = 5 } = queryArgs;
                return `${endpointName}(${branchId},${classId || 'null'},${offset},${limit})`;
            },
            providesTags: (result, error, arg) => [
                { type: "Leaderboard", id: `${arg.branchId}-${arg.classId || 'null'}` },
            ],
        }),
        createLeaderboard: builder.mutation({
            async queryFn(leaderboardData) {
                const { data, error } = await supabase.functions.invoke('insert-leaderboard', {
                    body: leaderboardData
                });

                if (error) throw error;
                return { data };
            },
            invalidatesTags: (result, error, arg) => [
                { type: "Leaderboard", id: `${arg.branch_Id}-${arg.class_Id || 'null'}` },
            ],
        }),
    }),
});

export const {
    useGetLeaderboardsByBranchAndClassPaginatedQuery,
    useLazyGetLeaderboardsByBranchAndClassPaginatedQuery,
    useCreateLeaderboardMutation
} = leaderboardApi;

