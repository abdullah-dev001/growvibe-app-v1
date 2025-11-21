import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getUserFullName } from "../../helpers/getUserFullName";
import { sendPushNotificationToUser } from "../../helpers/sendPushNotification";
import { supabase } from "../../supabaseClient";

export const taskApi = createApi({
  reducerPath: "taskApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Tasks"],
  keepUnusedDataFor: 7200,
  endpoints: (builder) => ({
    getTasksPaginated: builder.query({
      async queryFn({
        school_Id,
        branch_Id,
        created_By,
        assigned_To,
        offset = 0,
        limit = 10,
      } = {}) {
        try {
          const from = offset;
          const to = offset + limit - 1;

          let query = supabase
            .from("task_view")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(from, to);

          if (school_Id) {
            query = query.eq("school_Id", school_Id);
          }
          if (branch_Id) {
            query = query.eq("branch_Id", branch_Id);
          }
          if (created_By) {
            query = query.eq("created_By", created_By);
          }
          if (assigned_To) {
            query = query.eq("assigned_To", assigned_To);
          }

          const { data, error, count } = await query;

          if (error) {
            return { error: { status: "CUSTOM_ERROR", data: error } };
          }

          return {
            data: {
              items: data || [],
              total:
                typeof count === "number" ? count : data?.length || 0,
            },
          };
        } catch (err) {
          return { error: { status: "CUSTOM_ERROR", data: err } };
        }
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const {
          school_Id,
          branch_Id,
          created_By,
          assigned_To,
          offset = 0,
          limit = 10,
        } = queryArgs || {};
        return `${endpointName}(${school_Id || "null"},${
          branch_Id || "null"
        },${created_By || "null"},${assigned_To || "null"},${offset},${limit})`;
      },
      providesTags: (result, error, arg) => [
        { type: "Tasks", id: "LIST" },
        arg?.school_Id
          ? { type: "Tasks", id: `school-${arg.school_Id}` }
          : { type: "Tasks", id: "school-null" },
      ],
    }),
    createTask: builder.mutation({
      async queryFn(taskData) {
        try {
          const { data, error } = await supabase
            .from("task")
            .insert([
              {
                school_Id: taskData.school_Id,
                branch_Id: taskData.branch_Id,
                created_By: taskData.created_By,
                title: taskData.title,
                description: taskData.description,
                priority: taskData.priority,
                status: taskData.status,
                assigned_To: taskData.assigned_To,
              },
            ])
            .select();

          if (error) {
            return { error: { status: "CUSTOM_ERROR", data: error } };
          }

          // Send push notification to assigned user
          if (data && data[0] && taskData.assigned_To) {
            try {
              // Get creator's name for personalization
              const creatorName = await getUserFullName(taskData.created_By);

              const priorityText = taskData.priority ? taskData.priority.charAt(0).toUpperCase() + taskData.priority.slice(1) : "Medium";
              const notificationTitle = "New Task Assigned";
              const notificationBody = `${creatorName} has assigned you a new ${priorityText.toLowerCase()} priority task: "${taskData.title}".`;
              
              await sendPushNotificationToUser(
                taskData.assigned_To,
                notificationTitle,
                notificationBody,
                {
                  type: "task",
                  taskId: data[0].id,
                  schoolId: taskData.school_Id,
                  branchId: taskData.branch_Id,
                  createdBy: taskData.created_By,
                  title: taskData.title,
                  priority: taskData.priority || "medium",
                  status: taskData.status || "pending",
                }
              );
            } catch (notificationError) {
              // Log error but don't fail the task creation
              console.log("Error sending push notification:", notificationError);
            }
          }

          return { data };
        } catch (err) {
          return { error: { status: "CUSTOM_ERROR", data: err } };
        }
      },
      invalidatesTags: (result, error, arg) => [
        { type: "Tasks", id: "LIST" },
        arg?.school_Id
          ? { type: "Tasks", id: `school-${arg.school_Id}` }
          : { type: "Tasks", id: "school-null" },
      ],
    }),
    updateTaskStatus: builder.mutation({
      async queryFn({ id, status }) {
        try {
          const { data, error } = await supabase
            .from("task")
            .update({ status })
            .eq("id", id)
            .select();

          if (error) {
            return { error: { status: "CUSTOM_ERROR", data: error } };
          }
          return { data };
        } catch (err) {
          return { error: { status: "CUSTOM_ERROR", data: err } };
        }
      },
      invalidatesTags: [{ type: "Tasks", id: "LIST" }],
    }),
  }),
});

export const {
  useGetTasksPaginatedQuery,
  useLazyGetTasksPaginatedQuery,
  useCreateTaskMutation,
  useUpdateTaskStatusMutation,
} = taskApi;


