import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";

export const timetableApi = createApi({
    reducerPath: "timetableApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["Timetables"],
    keepUnusedDataFor: 7200,
    endpoints: (builder) => ({
        getTimetablesByClass: builder.query({
            async queryFn(classId) {
                try {
                    const { data, error } = await supabase
                        .from("timetable_view")
                        .select("*")
                        .eq("class_Id", classId)
                        .order("week_number", { ascending: true })
                        .order("day", { ascending: true });

                    if (error) {
                        return { error: { status: 'CUSTOM_ERROR', data: error } };
                    }
                    return { data: data || [] };
                } catch (err) {
                    return { error: { status: 'CUSTOM_ERROR', data: err } };
                }
            },
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                return `${endpointName}(${queryArgs || 'null'})`;
            },
            providesTags: (result, error, classId) => [
                { type: "Timetables", id: classId },
            ],
        }),
        createTimetable: builder.mutation({
            async queryFn(timetableData) {
                try {
                    const { data, error } = await supabase.functions.invoke('insert-timetable', {
                        body: timetableData
                    });

                    if (error) {
                        return { error: { status: 'CUSTOM_ERROR', data: error } };
                    }
                    return { data };
                } catch (err) {
                    return { error: { status: 'CUSTOM_ERROR', data: err } };
                }
            },
            invalidatesTags: (result, error, arg) => [
                { type: "Timetables", id: arg.class_Id },
            ],
        }),
    }),
});

export const {
    useGetTimetablesByClassQuery,
    useLazyGetTimetablesByClassQuery,
    useCreateTimetableMutation
} = timetableApi;

