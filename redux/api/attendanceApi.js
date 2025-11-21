import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getUserFullName } from "../../helpers/getUserFullName";
import { sendPushNotificationToUsers } from "../../helpers/sendPushNotification";
import { supabase } from "../../supabaseClient";

export const attendanceApi = createApi({
  reducerPath: "attendanceApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Attendance"],
  keepUnusedDataFor: 7200,
  endpoints: (builder) => ({
    createAttendance: builder.mutation({
      async queryFn(attendanceData) {
        try {
          const { data, error } = await supabase.functions.invoke("insert-attendance", {
            body: attendanceData,
          });

          if (error) {
            return { error: { status: "CUSTOM_ERROR", data: error } };
          }

          // Send push notifications to users whose attendance was marked
          if (data && attendanceData.users && attendanceData.users.length > 0) {
            try {
              const markedBy = attendanceData.marked_By || attendanceData.created_By;
              const creatorName = await getUserFullName(markedBy);
              const notificationTitle = "Attendance Marked";
              let notificationBody = "";
              let userIds = [];

              // Get user IDs from the attendance data (users array contains user_Id)
              const userAuthIds = attendanceData.users
                .map(u => u.user_Id)
                .filter(id => id && id !== markedBy);

              userIds = [...new Set(userAuthIds)];

              // If attendance is for a class (students), also notify class incharge
              if (attendanceData.class_Id && attendanceData.branch_Id) {
                const { data: classData } = await supabase
                  .from("class")
                  .select("incharge_Id")
                  .eq("id", attendanceData.class_Id)
                  .maybeSingle();

                if (classData?.incharge_Id && classData.incharge_Id !== markedBy) {
                  userIds.push(classData.incharge_Id);
                }

                notificationBody = `${creatorName} has marked attendance for ${attendanceData.date || 'today'}.`;
              } else if (attendanceData.branch_Id && attendanceData.users[0]?.role) {
                // For teachers/branch-based attendance
                const role = attendanceData.users[0].role;
                notificationBody = `${creatorName} has marked ${role} attendance for ${attendanceData.date || 'today'}.`;
              } else {
                notificationBody = `${creatorName} has marked your attendance for ${attendanceData.date || 'today'}.`;
              }

              // Send notifications
              if (userIds.length > 0) {
                await sendPushNotificationToUsers(
                  [...new Set(userIds)],
                  notificationTitle,
                  notificationBody,
                  {
                    type: "attendance",
                    date: attendanceData.date,
                    branchId: attendanceData.branch_Id,
                    classId: attendanceData.class_Id,
                    role: attendanceData.users[0]?.role,
                    markedBy: markedBy,
                  }
                );
              }
            } catch (notificationError) {
              console.log("Error sending push notification:", notificationError);
            }
          }

          return { data };
        } catch (err) {
          return { error: { status: "CUSTOM_ERROR", data: err } };
        }
      },
      invalidatesTags: (result, error, arg) => {
        const tags = [{ type: "Attendance", id: "LIST" }];
        // For students: invalidate by classId, for teachers: invalidate by branchId and role
        if (arg.class_Id) {
          tags.push({ type: "Attendance", id: `class-${arg.class_Id}` });
          tags.push({ type: "Attendance", id: `date-${arg.date}-class-${arg.class_Id}` });
        } else if (arg.branch_Id && arg.users && arg.users.length > 0) {
          // Get role from first user (all users should have same role)
          const role = arg.users[0]?.role;
          if (role) {
            tags.push({ type: "Attendance", id: `date-${arg.date}-branch-${arg.branch_Id}-role-${role}` });
          }
        }
        return tags;
      },
    }),
    updateAttendance: builder.mutation({
      async queryFn(attendanceData) {
        try {
          const { data, error } = await supabase.functions.invoke("update-attendance", {
            body: attendanceData,
          });

          if (error) {
            return { error: { status: "CUSTOM_ERROR", data: error } };
          }
          return { data };
        } catch (err) {
          return { error: { status: "CUSTOM_ERROR", data: err } };
        }
      },
      invalidatesTags: (result, error, arg) => {
        const tags = [{ type: "Attendance", id: "LIST" }];
        // For students: invalidate by classId, for teachers: invalidate by branchId and role
        if (arg.class_Id) {
          tags.push({ type: "Attendance", id: `class-${arg.class_Id}` });
          tags.push({ type: "Attendance", id: `date-${arg.date}-class-${arg.class_Id}` });
        } else if (arg.branch_Id && arg.users && arg.users.length > 0) {
          // Get role from first user (all users should have same role)
          const role = arg.users[0]?.role;
          if (role) {
            tags.push({ type: "Attendance", id: `date-${arg.date}-branch-${arg.branch_Id}-role-${role}` });
          }
        }
        return tags;
      },
    }),
    getAttendanceByDateAndClass: builder.query({
      async queryFn({ date, class_Id }) {
        try {
          const { data, error } = await supabase
            .from("daily_attendance_detailed_view")
            .select("*")
            .eq("date", date)
            .eq("class_Id", class_Id)
            .order("user_full_name", { ascending: true });

          if (error) {
            return { error: { status: "CUSTOM_ERROR", data: error } };
          }
          return { data: data || [] };
        } catch (err) {
          return { error: { status: "CUSTOM_ERROR", data: err } };
        }
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { date, class_Id } = queryArgs || {};
        return `${endpointName}(${date || "null"},${class_Id || "null"})`;
      },
      providesTags: (result, error, arg) => [
        { type: "Attendance", id: "LIST" },
        { type: "Attendance", id: `date-${arg.date}-class-${arg.class_Id}` },
      ],
    }),
    getAttendanceByDateAndBranch: builder.query({
      async queryFn({ date, branch_Id, role }) {
        try {
          const { data, error } = await supabase
            .from("daily_attendance_detailed_view")
            .select("*")
            .eq("date", date)
            .eq("branch_Id", branch_Id)
            .eq("user_role", role)
            .is("class_Id", null)
            .order("user_full_name", { ascending: true });

          if (error) {
            return { error: { status: "CUSTOM_ERROR", data: error } };
          }
          return { data: data || [] };
        } catch (err) {
          return { error: { status: "CUSTOM_ERROR", data: err } };
        }
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { date, branch_Id, role } = queryArgs || {};
        return `${endpointName}(${date || "null"},${branch_Id || "null"},${role || "null"})`;
      },
      providesTags: (result, error, arg) => [
        { type: "Attendance", id: "LIST" },
        { type: "Attendance", id: `date-${arg.date}-branch-${arg.branch_Id}-role-${arg.role}` },
      ],
    }),
    getAttendanceByAttendanceId: builder.query({
      async queryFn({ attendanceId, date, class_Id, branch_Id, role }) {
        try {
          if (!date) {
            return { data: [] };
          }

          let query = supabase
            .from("daily_attendance_detailed_view")
            .select("*")
            .eq("date", date);

          // For students: filter by classId, for teachers: filter by branchId and role, no classId
          if (class_Id) {
            query = query.eq("class_Id", class_Id);
          } else if (branch_Id && role) {
            query = query.eq("branch_Id", branch_Id).eq("user_role", role).is("class_Id", null);
          }

          const { data, error } = await query.order("user_full_name", { ascending: true });

          if (error) {
            return { error: { status: "CUSTOM_ERROR", data: error } };
          }
          return { data: data || [] };
        } catch (err) {
          return { error: { status: "CUSTOM_ERROR", data: err } };
        }
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { attendanceId, date, class_Id, branch_Id, role } = queryArgs || {};
        return `${endpointName}(${attendanceId || "null"},${date || "null"},${class_Id || "null"},${branch_Id || "null"},${role || "null"})`;
      },
      providesTags: (result, error, arg) => [
        { type: "Attendance", id: arg.attendanceId },
        { type: "Attendance", id: `date-${arg.date}-${arg.class_Id ? `class-${arg.class_Id}` : `branch-${arg.branch_Id}-role-${arg.role}`}` },
      ],
    }),
    markOwnAttendance: builder.mutation({
      async queryFn(attendanceData) {
        try {
          // Use upsert to handle duplicate records (based on unique constraint)
          const { data, error } = await supabase
            .from("daily_attendance")
            .upsert(
              {
                date: attendanceData.date,
                user_Id: attendanceData.user_Id,
                school_Id: attendanceData.school_Id,
                branch_Id: attendanceData.branch_Id,
                class_Id: attendanceData.class_Id,
                status: attendanceData.status,
                role: attendanceData.role,
                marked_By: attendanceData.marked_By,
              },
              {
                onConflict: 'date,user_Id,class_Id,school_Id',
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
        { type: "Attendance", id: "LIST" },
        { type: "Attendance", id: `user-${arg.user_Id}-date-${arg.date}` },
        { type: "Attendance", id: `today-${arg.user_Id}` },
      ],
    }),
    getTodayAttendanceByUser: builder.query({
      async queryFn({ userId, date, school_Id, branch_Id }) {
        try {
          if (!userId || !date || !school_Id) {
            return { data: null };
          }

          let query = supabase
            .from("daily_attendance")
            .select("*")
            .eq("user_Id", userId)
            .eq("date", date)
            .eq("school_Id", school_Id);

          if (branch_Id) {
            query = query.eq("branch_Id", branch_Id);
          }

          const { data, error } = await query
            .order("created_at", { ascending: false })
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
        const { userId, date, school_Id, branch_Id } = queryArgs || {};
        return `${endpointName}(${userId || "null"},${date || "null"},${school_Id || "null"},${branch_Id || "null"})`;
      },
      providesTags: (result, error, arg) => [
        { type: "Attendance", id: `user-${arg.userId}-date-${arg.date}` },
        { type: "Attendance", id: `today-${arg.userId}` },
      ],
    }),
    getStudentMonthlyAnalytics: builder.query({
      async queryFn({ p_class_id, p_user_id, p_role, p_month, p_year }) {
        try {
          if (!p_class_id || !p_user_id || !p_role || !p_month || !p_year) {
            return { error: { status: "CUSTOM_ERROR", data: { message: "Missing required parameters" } } };
          }

          const { data, error } = await supabase.rpc("get_student_monthly_analytics", {
            p_class_id,
            p_user_id,
            p_role,
            p_month,
            p_year,
          });

          if (error) {
            return { error: { status: "CUSTOM_ERROR", data: error } };
          }
          // Handle array response - RPC returns array with one object
          const result = Array.isArray(data) && data.length > 0 ? data[0] : (data || null);
          return { data: result };
        } catch (err) {
          return { error: { status: "CUSTOM_ERROR", data: err } };
        }
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { p_class_id, p_user_id, p_role, p_month, p_year } = queryArgs || {};
        return `${endpointName}(${p_class_id || "null"},${p_user_id || "null"},${p_role || "null"},${p_month || "null"},${p_year || "null"})`;
      },
      providesTags: (result, error, arg) => [
        { type: "Attendance", id: `analytics-${arg.p_user_id}-${arg.p_month}-${arg.p_year}` },
      ],
    }),
    getTeacherMonthlyAnalytics: builder.query({
      async queryFn({ p_user_id, p_role, p_month, p_year }) {
        try {
          if (!p_user_id || !p_role || !p_month || !p_year) {
            return { error: { status: "CUSTOM_ERROR", data: { message: "Missing required parameters" } } };
          }

          const { data, error } = await supabase.rpc("get_teacher_monthly_analytics", {
            p_user_id,
            p_role,
            p_month,
            p_year,
          });

          if (error) {
            return { error: { status: "CUSTOM_ERROR", data: error } };
          }
          // Handle array response - RPC returns array with one object
          const result = Array.isArray(data) && data.length > 0 ? data[0] : (data || null);
          return { data: result };
        } catch (err) {
          return { error: { status: "CUSTOM_ERROR", data: err } };
        }
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { p_user_id, p_role, p_month, p_year } = queryArgs || {};
        return `${endpointName}(${p_user_id || "null"},${p_role || "null"},${p_month || "null"},${p_year || "null"})`;
      },
      providesTags: (result, error, arg) => [
        { type: "Attendance", id: `analytics-${arg.p_user_id}-${arg.p_month}-${arg.p_year}` },
      ],
    }),
  }),
});

export const {
  useCreateAttendanceMutation,
  useUpdateAttendanceMutation,
  useGetAttendanceByDateAndClassQuery,
  useLazyGetAttendanceByDateAndClassQuery,
  useGetAttendanceByAttendanceIdQuery,
  useMarkOwnAttendanceMutation,
  useGetTodayAttendanceByUserQuery,
  useGetAttendanceByDateAndBranchQuery,
  useGetStudentMonthlyAnalyticsQuery,
  useGetTeacherMonthlyAnalyticsQuery,
} = attendanceApi;

