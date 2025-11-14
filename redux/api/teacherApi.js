import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";
// teachers_without_class
export const teacherApi = createApi({
    reducerPath: "teacherApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["Teachers"],
    keepUnusedDataFor: 7200,
    endpoints: (builder) => ({
        getTeachersByBranch: builder.query({
            async queryFn(branchId) {
              const { data, error } = await supabase
                .from("teachers_with_branch")
                .select("*")
                .eq("branch_Id", branchId);
          
              if (error) throw error;
              return { data };
            },
            providesTags: ["Teachers"],
          }),
        getTeachersByBranchPaginated: builder.query({
            async queryFn({ branchId, offset = 0, limit = 5 } = {}) {
              const from = offset;
              const to = offset + limit - 1;

              const { data, error, count } = await supabase
                .from("teachers_with_branch")
                .select("*", { count: "exact" })
                .eq("branch_Id", branchId)
                .order("created_at", { ascending: false })
                .range(from, to);
          
              if (error) throw error;
              return { data: { items: data || [], total: typeof count === 'number' ? count : (data?.length || 0) } };
            },
            serializeQueryArgs: ({ endpointName }) => {
                return `${endpointName}`;
            },
            providesTags: (result) => [
                { type: "Teachers", id: "LIST" },
                ...(result?.items || []).map((teacher) => ({ type: "Teachers", id: teacher.auth_User_Id })),
            ],
          }),
          getTeachersWithoutClass: builder.query({
            async queryFn() {
              const { data, error } = await supabase
                .from("teachers_without_class")
                .select("*");
              if (error) throw error;
              return { data };
            },
            providesTags: ["Teachers"],
        }),
        getTeacherById: builder.query({
            async queryFn(authId) {
                if (!authId) return { data: null };
                const { data, error } = await supabase
                    .from("teachers_with_branch")
                    .select("*")
                    .eq("auth_User_Id", authId)
                    .maybeSingle();

                if (error) throw error;
                return { data };
            },
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                return `${endpointName}(${queryArgs || 'null'})`;
            },
            providesTags: (result, error, authId) => [
                { type: "Teachers", id: authId },
            ],
        }),
    }),
});

export const {
    useGetTeachersByBranchQuery,
    useGetTeachersByBranchPaginatedQuery,
    useLazyGetTeachersByBranchPaginatedQuery,
    useGetTeachersWithoutClassQuery,
    useGetTeacherByIdQuery,
} = teacherApi;
