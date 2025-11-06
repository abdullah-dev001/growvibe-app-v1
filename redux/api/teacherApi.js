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
    }),
});

export const {
    useGetTeachersByBranchQuery,
    useGetTeachersWithoutClassQuery,
} = teacherApi;
