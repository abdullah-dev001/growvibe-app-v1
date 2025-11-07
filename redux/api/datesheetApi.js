import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";

export const datesheetApi = createApi({
    reducerPath: "datesheetApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["Datesheet"],
    keepUnusedDataFor: 7200,
    endpoints: (builder) => ({
        getDatesheetsByBranchAndClassPaginated: builder.query({
            async queryFn({ branchId, classId, offset = 0, limit = 5 } = {}) {
                const from = offset;
                const to = offset + limit - 1;

                let query = supabase
                    .from("datesheet_with_subjects")
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
            providesTags: ["Datesheet"],
        }),
        createDatesheet: builder.mutation({
            async queryFn(datesheetData) {
                const { data, error } = await supabase.functions.invoke('insert-datesheet', {
                    body: datesheetData
                });

                if (error) throw error;
                return { data };
            },
            invalidatesTags: ["Datesheet"],
        }),
    }),
});

export const {
    useGetDatesheetsByBranchAndClassPaginatedQuery,
    useLazyGetDatesheetsByBranchAndClassPaginatedQuery,
    useCreateDatesheetMutation
} = datesheetApi;

