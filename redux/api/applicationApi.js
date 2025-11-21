import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getUserFullName } from "../../helpers/getUserFullName";
import { sendPushNotificationToUser } from "../../helpers/sendPushNotification";
import { supabase } from "../../supabaseClient";

// Helper: resolve assigned_To for an application based on role and context
export const resolveApplicationAssignedTo = async ({
  role,
  schoolId,
  branchId,
  classId,
}) => {
  if (!role) return null;

  try {
    // Student: assign to class incharge (teacher)
    if (role === "student") {
      if (!classId) return null;
      const { data, error } = await supabase
        .from("class")
        .select("incharge_Id")
        .eq("id", classId)
        .limit(1)
        .single();

      if (error) return null;
      return data?.incharge_Id || null;
    }

    // Teacher: assign to coordinator (by school)
    if (role === "teacher") {
      if (!schoolId) return null;
      const { data, error } = await supabase
        .from("coordinator_profile")
        .select("auth_Id")
        .eq("school_Id", schoolId)
        .limit(1);

      if (error || !data || data.length === 0) return null;
      return data[0]?.auth_Id || null;
    }

    // Coordinator: assign to principal
    if (role === "coordinator") {
      if (!schoolId) return null;
      const { data, error } = await supabase
        .from("principal_profile")
        .select("auth_Id")
        .eq("school_Id", schoolId)
        .limit(1);

      if (error || !data || data.length === 0) return null;
      return data[0]?.auth_Id || null;
    }

    // Principal: assign to owner
    if (role === "principal") {
      if (!schoolId) return null;

      // Owner profile doesn't have school_Id, so fetch from school table
      const { data: schoolData, error: schoolErr } = await supabase
        .from("school")
        .select("owner_Id")
        .eq("id", schoolId)
        .limit(1)
        .single();

      if (schoolErr || !schoolData || !schoolData.owner_Id) return null;

      // owner_Id from school table is the owner's auth_Id
      return schoolData.owner_Id;
    }

    // Owner cannot create applications in this flow
    return null;
  } catch (_err) {
    return null;
  }
};

export const applicationApi = createApi({
  reducerPath: "applicationApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Applications"],
  keepUnusedDataFor: 7200,
  endpoints: (builder) => ({
    getApplicationsPaginated: builder.query({
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
            .from("application_view")
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
        { type: "Applications", id: "LIST" },
        arg?.school_Id
          ? { type: "Applications", id: `school-${arg.school_Id}` }
          : { type: "Applications", id: "school-null" },
      ],
    }),
    createApplication: builder.mutation({
      async queryFn(applicationData) {
        try {
          const { data, error } = await supabase
            .from("application")
            .insert([
              {
                school_Id: applicationData.school_Id,
                branch_Id: applicationData.branch_Id,
                created_By: applicationData.created_By,
                title: applicationData.title,
                description: applicationData.description,
                assigned_To: applicationData.assigned_To,
                status: applicationData.status,
                attachment_Url: applicationData.attachment_Url || null,
              },
            ])
            .select();

          if (error) {
            return { error: { status: "CUSTOM_ERROR", data: error } };
          }

          // Send push notification to assigned user
          if (data && data[0] && applicationData.assigned_To) {
            try {
              // Get creator's name for personalization
              const creatorName = await getUserFullName(applicationData.created_By);

              const notificationTitle = "New Application Assigned";
              const notificationBody = `${creatorName} has created a new application: "${applicationData.title}" and assigned it to you.`;
              
              await sendPushNotificationToUser(
                applicationData.assigned_To,
                notificationTitle,
                notificationBody,
                {
                  type: "application",
                  applicationId: data[0].id,
                  schoolId: applicationData.school_Id,
                  branchId: applicationData.branch_Id,
                  createdBy: applicationData.created_By,
                  title: applicationData.title,
                  status: applicationData.status || "pending",
                }
              );
            } catch (notificationError) {
              // Log error but don't fail the application creation
              console.log("Error sending push notification:", notificationError);
            }
          }

          return { data };
        } catch (err) {
          return { error: { status: "CUSTOM_ERROR", data: err } };
        }
      },
      invalidatesTags: (result, error, arg) => [
        { type: "Applications", id: "LIST" },
        arg?.school_Id
          ? { type: "Applications", id: `school-${arg.school_Id}` }
          : { type: "Applications", id: "school-null" },
      ],
    }),
    updateApplicationStatus: builder.mutation({
      async queryFn({ id, status }) {
        try {
          const { data, error } = await supabase
            .from("application")
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
      invalidatesTags: [{ type: "Applications", id: "LIST" }],
    }),
  }),
});

export const {
  useGetApplicationsPaginatedQuery,
  useLazyGetApplicationsPaginatedQuery,
  useCreateApplicationMutation,
  useUpdateApplicationStatusMutation,
} = applicationApi;


