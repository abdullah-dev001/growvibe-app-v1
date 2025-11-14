import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";

export const timetableApi = createApi({
    reducerPath: "timetableApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["Timetables"],
    keepUnusedDataFor: 7200,
    endpoints: (builder) => ({
        getTimetablesByClass: builder.query({
            async queryFn({ classId, weekNumber }) {
                try {
                    let query = supabase
                        .from("timetable_view")
                        .select("*")
                        .eq("class_Id", classId);
                    
                    // Filter by week_number if provided
                    if (weekNumber) {
                        query = query.eq("week_number", weekNumber);
                    }
                    
                    const { data, error } = await query
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
                const classId = queryArgs?.classId || queryArgs || 'null';
                const weekNumber = queryArgs?.weekNumber || 'null';
                return `${endpointName}(${classId}-${weekNumber})`;
            },
            providesTags: (result, error, queryArgs) => {
                const classId = queryArgs?.classId || queryArgs;
                return [
                    { type: "Timetables", id: classId },
                ];
            },
        }),
        getTimetableById: builder.query({
            async queryFn({ timetableId, classId }) {
                try {
                    const { data, error } = await supabase
                        .from("timetable_view")
                        .select("*")
                        .eq("timetable_id", timetableId)
                        .eq("class_Id", classId)
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
                return `${endpointName}(${queryArgs.timetableId}-${queryArgs.classId})`;
            },
            providesTags: (result, error, arg) => [
                { type: "Timetables", id: arg.classId },
                { type: "Timetables", id: `ITEM-${arg.timetableId}` },
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
        updateTimetable: builder.mutation({
            async queryFn(timetableData) {
                try {
                    const { data, error } = await supabase.functions.invoke('update-timetable', {
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
                { type: "Timetables", id: `ITEM-${arg.timetable_id}` },
            ],
        }),
    }),
});

export const {
    useGetTimetablesByClassQuery,
    useLazyGetTimetablesByClassQuery,
    useGetTimetableByIdQuery,
    useCreateTimetableMutation,
    useUpdateTimetableMutation
} = timetableApi;

