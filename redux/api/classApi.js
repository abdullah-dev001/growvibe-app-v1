import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";

export const resolveTeacherClassId = async (teacherAuthId) => {
  if (!teacherAuthId) {
    return null;
  }

  try {
    const { data: classRows, error: classError } = await supabase
      .from("class")
      .select("id")
      .eq("incharge_Id", teacherAuthId)
      .limit(1);

    if (!classError && classRows && classRows.length > 0) {
      return classRows[0]?.id || null;
    }
  } catch (error) {
    // Error fetching class from class table
  }

  try {
    const { data: teacherRows, error: teacherError } = await supabase
      .from("teachers_with_branch")
      .select("class_id")
      .eq("auth_User_Id", teacherAuthId)
      .limit(1);

    if (!teacherError && teacherRows && teacherRows.length > 0) {
      return teacherRows[0]?.class_id || null;
    }

    const shouldTryLowercase =
      (teacherError && teacherError.code === "42703") ||
      (!teacherError && (!teacherRows || teacherRows.length === 0));

    if (shouldTryLowercase) {
      const { data: teacherRowsLower, error: teacherErrorLower } = await supabase
        .from("teachers_with_branch")
        .select("class_id")
        .eq("auth_user_id", teacherAuthId)
        .limit(1);

      if (!teacherErrorLower && teacherRowsLower && teacherRowsLower.length > 0) {
        return teacherRowsLower[0]?.class_id || null;
      }
    }
  } catch (error) {
    // Error fetching class from teachers_with_branch
  }

  return null;
};

export const classApi = createApi({
    reducerPath: "classApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["Classes", "Teachers"],
    keepUnusedDataFor: 7200,
    endpoints: (builder) => ({
        createClass: builder.mutation({
            async queryFn(classData) {
                // First, get branch name for chat group
                let branchName = '';
                if (classData.branch_Id) {
                    try {
                        const { data: branchData, error: branchError } = await supabase
                            .from("branch")
                            .select("branch_Name")
                            .eq("id", classData.branch_Id)
                            .single();
                        
                        if (!branchError && branchData) {
                            branchName = branchData.branch_Name || '';
                        }
                    } catch (err) {
                        // Continue even if branch fetch fails
                    }
                }

                let enforcedClassStatus = classData.class_Status;
                if (classData.session_Id) {
                    try {
                        const { data: sessionRow } = await supabase
                            .from("session")
                            .select("session_Status")
                            .eq("id", classData.session_Id)
                            .single();
                        if (sessionRow && sessionRow.session_Status === false) {
                            enforcedClassStatus = false;
                        }
                    } catch (_) {
                        // ignore session fetch errors, fall back to provided status
                    }
                }

                // Create the class
                const { data, error } = await supabase
                    .from("class")
                    .insert([
                        {
                            branch_Id: classData.branch_Id,
                            class_Name: classData.class_Name,
                            school_Id: classData.school_Id,
                            section: classData.section,
                            session_Id: classData.session_Id,
                            class_Status: enforcedClassStatus,
                            incharge_Id: classData.incharge_Id,
                        },
                    ])
                    .select();

                if (error) throw error;

                // Create chat group for the class
                if (data && data.length > 0) {
                    const createdClass = data[0];
                    try {
                        // Create chat group
                        const branchNameShort = branchName?.length > 15 ? branchName.substring(0, 15) + '...' : branchName;
                        const groupName = `${classData.class_Name} - ${classData.section} - ${branchNameShort || 'Branch'}`;

                        const { data: chatData, error: chatError } = await supabase
                            .from("chat")
                            .insert([
                                {
                                    type: "group",
                                    group_Name: groupName,
                                    class_Id: createdClass.id,
                                    created_By: classData.created_By || null,
                                    school_Id: classData.school_Id,
                                },
                            ])
                            .select()
                            .single();

                        // Add incharge as chat member if incharge exists
                        if (!chatError && chatData?.id && classData.incharge_Id) {
                            await supabase
                                .from("chat_member")
                                .insert([
                                    {
                                        chat_Id: chatData.id,
                                        user_Id: classData.incharge_Id,
                                        role: "teacher",
                                    },
                                ]);
                        }
                    } catch (chatErr) {
                        // Error creating chat group - don't fail class creation
                    }
                }

                return { data };
            },
            invalidatesTags: ["Classes", "Teachers"],
        }),
        getClassesWithSummaryByBranchAndSession: builder.query({
            async queryFn({ branchId, sessionId }) {
              const { data, error } = await supabase
                .from("class_with_summary")
                .select("*")
                .eq("branch_Id", branchId)
                .eq("session_Id", sessionId);
          
              if (error) throw error;
              return { data };
            },
            providesTags: ["Classes"],
          }),
        getClassesWithSummaryByBranchAndSessionPaginated: builder.query({
            async queryFn({ branchId, sessionId, offset = 0, limit = 5 } = {}) {
              const from = offset;
              const to = offset + limit - 1;

              const { data, error, count } = await supabase
                .from("class_with_summary")
                .select("*", { count: "exact" })
                .eq("branch_Id", branchId)
                .eq("session_Id", sessionId)
                .order("created_at", { ascending: false })
                .range(from, to);
          
              if (error) throw error;
              return { data: { items: data || [], total: typeof count === 'number' ? count : (data?.length || 0) } };
            },
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                return `${endpointName}(${queryArgs.branchId}-${queryArgs.sessionId}-${queryArgs.offset}-${queryArgs.limit})`;
            },
            providesTags: (result, error, arg) => [
                { type: "Classes", id: "LIST" },
                ...(result?.items?.map((item) => ({ type: "Classes", id: item.class_id })) || []),
            ],
          }),          
        getClassesByBranch: builder.query({
            async queryFn(branchId) {
                const { data, error } = await supabase
                    .from("class")
                    .select("id, class_Name, section")
                    .eq("branch_Id", branchId);

                if (error) throw error;
                return { data };
            },
            providesTags: ["Classes"],
        }),
        getClassById: builder.query({
            async queryFn(classId) {
                try {
                    const { data, error } = await supabase
                        .from("class")
                        .select("*")
                        .eq("id", classId)
                        .single();

                    if (error) {
                        // If no class found, return null instead of error
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
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                return `${endpointName}(${queryArgs})`;
            },
            providesTags: (result, error, arg) => [
                { type: "Classes", id: arg },
            ],
        }),
        updateClass: builder.mutation({
            async queryFn(classData) {
                let enforcedClassStatus = classData.class_Status;
                if (classData.session_Id) {
                    try {
                        const { data: sessionRow } = await supabase
                            .from("session")
                            .select("session_Status")
                            .eq("id", classData.session_Id)
                            .single();
                        if (sessionRow && sessionRow.session_Status === false) {
                            enforcedClassStatus = false;
                        }
                    } catch (_) {
                        // ignore
                    }
                }

                const { data, error } = await supabase
                    .from("class")
                    .update({
                        class_Name: classData.class_Name,
                        school_Id: classData.school_Id,
                        section: classData.section,
                        session_Id: classData.session_Id,
                        class_Status: enforcedClassStatus,
                        incharge_Id: classData.incharge_Id || null,
                    })
                    .eq("id", classData.id)
                    .select();

                if (error) throw error;
                return { data };
            },
            invalidatesTags: (result, error, arg) => [
                { type: "Classes", id: "LIST" },
                { type: "Classes", id: arg.id },
                "Teachers",
            ],
        }),
        deleteClass: builder.mutation({
            async queryFn(classId) {
                const { data, error } = await supabase
                    .from("class")
                    .delete()
                    .eq("id", classId)
                    .select();

                if (error) throw error;
                return { data };
            },
            invalidatesTags: ["Classes"],
        }),
    }),
});

export const {
    useCreateClassMutation,
    useGetClassesWithSummaryByBranchAndSessionQuery,
    useGetClassesWithSummaryByBranchAndSessionPaginatedQuery,
    useLazyGetClassesWithSummaryByBranchAndSessionPaginatedQuery,
    useGetClassesByBranchQuery,
    useGetClassByIdQuery,
    useLazyGetClassByIdQuery,
    useUpdateClassMutation,
    useDeleteClassMutation
} = classApi;
