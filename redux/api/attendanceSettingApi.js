import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";

export const attendanceSettingApi = createApi({
  reducerPath: "attendanceSettingApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["AttendanceSetting"],
  endpoints: (builder) => ({
    getAttendanceSetting: builder.query({
      async queryFn({ schoolId, branchId }) {
        try {
          if (!schoolId || !branchId) {
            return { data: null };
          }

          const { data, error } = await supabase
            .from("attendance_setting")
            .select("*")
            .eq("school_Id", schoolId)
            .eq("branch_Id", branchId)
            .maybeSingle();

          if (error) {
            return { error: { status: "CUSTOM_ERROR", data: error } };
          }

          return { data: data || null };
        } catch (err) {
          return { error: { status: "CUSTOM_ERROR", data: err } };
        }
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { schoolId, branchId } = queryArgs || {};
        return `${endpointName}(${schoolId || "null"},${branchId || "null"})`;
      },
      providesTags: (result, error, arg) => [
        { type: "AttendanceSetting", id: `school-${arg.schoolId}-branch-${arg.branchId}` },
      ],
    }),
    upsertAttendanceSetting: builder.mutation({
      async queryFn({ school_Id, branch_Id, holiday }) {
        try {
          if (!school_Id || !branch_Id || typeof holiday === "undefined") {
            return { error: { status: "VALIDATION_ERROR", data: "Missing required fields" } };
          }

          const { data, error } = await supabase
            .from("attendance_setting")
            .upsert(
              {
                school_Id,
                branch_Id,
                holiday,
              },
              {
                onConflict: "school_Id,branch_Id",
                ignoreDuplicates: false,
              }
            )
            .select()
            .single();

          if (error) {
            return { error: { status: "CUSTOM_ERROR", data: error } };
          }

          return { data };
        } catch (err) {
          return { error: { status: "CUSTOM_ERROR", data: err } };
        }
      },
      invalidatesTags: (result, error, arg) => [
        { type: "AttendanceSetting", id: `school-${arg.school_Id}-branch-${arg.branch_Id}` },
      ],
    }),
  }),
});

export const {
  useGetAttendanceSettingQuery,
  useUpsertAttendanceSettingMutation,
} = attendanceSettingApi;

