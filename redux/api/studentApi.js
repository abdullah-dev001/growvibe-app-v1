import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";
// teachers_without_class
export const studentApi = createApi({
    reducerPath: "studentApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["Students"],
    keepUnusedDataFor: 7200,
    endpoints: (builder) => ({
        getStudentsByBranchAndClass: builder.query({
            async queryFn({branchId, classId}) {
              const { data, error } = await supabase
                .from("students_with_branch_and_class")
                .select("auth_User_Id, full_Name, email")
                .eq("branch_Id", branchId)
                .eq("class_Id", classId);
          
              if (error) throw error;
              return { data };
            },
            providesTags: ["Students"],
          }),
        getStudentsByBranchAndClassPaginated: builder.query({
            async queryFn({branchId, classId, offset = 0, limit = 5} = {}) {
              const from = offset;
              const to = offset + limit - 1;

              const { data, error, count } = await supabase
                .from("students_with_branch_and_class")
                .select("auth_User_Id, user_Image, full_Name, email, profile_Status", { count: "exact" })
                .eq("branch_Id", branchId)
                .eq("class_Id", classId)
                .order("created_at", { ascending: false })
                .range(from, to);
          
              if (error) throw error;
              return { data: { items: data || [], total: typeof count === 'number' ? count : (data?.length || 0) } };
            },
            providesTags: ["Students"],
          }),
    }),
});

export const {
    useGetStudentsByBranchAndClassQuery,
    useGetStudentsByBranchAndClassPaginatedQuery,
    useLazyGetStudentsByBranchAndClassPaginatedQuery
} = studentApi;
