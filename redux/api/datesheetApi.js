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
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                const { branchId, classId, offset = 0, limit = 5 } = queryArgs;
                return `${endpointName}(${branchId},${classId || 'null'},${offset},${limit})`;
            },
            providesTags: (result, error, arg) => [
                { type: "Datesheet", id: `${arg.branchId}-${arg.classId || 'null'}` },
            ],
        }),
        getDatesheetById: builder.query({
            async queryFn(datesheetId) {
                try {
                    const { data, error } = await supabase
                        .from("datesheet_with_subjects")
                        .select("*")
                        .eq("datesheet_id", datesheetId)
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
            providesTags: (result, error, datesheetId) => [
                { type: "Datesheet", id: datesheetId },
                { type: "Datesheet", id: "LIST" },
            ],
        }),
        createDatesheet: builder.mutation({
            async queryFn(datesheetData) {
                const { data, error } = await supabase.functions.invoke('insert-datesheet', {
                    body: datesheetData
                });

                if (error) throw error;
                return { data };
            },
            invalidatesTags: (result, error, arg) => [
                { type: "Datesheet", id: `${arg.branch_Id}-${arg.class_Id || 'null'}` },
            ],
        }),
        updateDatesheet: builder.mutation({
            async queryFn(datesheetData) {
                const { data, error } = await supabase.functions.invoke('update-datesheet', {
                    body: datesheetData
                });

                if (error) throw error;
                return { data };
            },
            invalidatesTags: (result, error, arg) => [
                { type: "Datesheet", id: `${arg.branch_Id}-${arg.class_Id || 'null'}` },
                { type: "Datesheet", id: arg.datesheet_Id },
            ],
        }),
    }),
});

export const {
    useGetDatesheetsByBranchAndClassPaginatedQuery,
    useLazyGetDatesheetsByBranchAndClassPaginatedQuery,
    useGetDatesheetByIdQuery,
    useCreateDatesheetMutation,
    useUpdateDatesheetMutation
} = datesheetApi;

