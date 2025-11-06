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
                .select("*")
                .eq("branch_Id", branchId)
                .eq("class_Id", classId);
          
              if (error) throw error;
              return { data };
            },
            providesTags: ["Students"],
          }),
    }),
});

export const {
    useGetStudentsByBranchAndClassQuery
} = studentApi;
