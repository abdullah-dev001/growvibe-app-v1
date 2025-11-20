import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Dashboard"],
  keepUnusedDataFor: 300, // 5 minutes cache
  endpoints: (builder) => ({
    // Admin dashboard
    getAdminDashboard: builder.query({
      async queryFn() {
        try {
          const { data, error } = await supabase.rpc("get_admin_dashboard");

          if (error) {
            return { error: { status: "CUSTOM_ERROR", data: error } };
          }

          // RPC returns array, get first item
          return { data: data?.[0] || null };
        } catch (err) {
          return { error: { status: "CUSTOM_ERROR", data: err } };
        }
      },
      providesTags: [{ type: "Dashboard", id: "admin" }],
    }),

    // Owner school dashboard
    getOwnerSchoolDashboard: builder.query({
      async queryFn({ p_school_id }) {
        try {
          if (!p_school_id) {
            return { error: { status: "CUSTOM_ERROR", data: { message: "School ID is required" } } };
          }

          const { data, error } = await supabase.rpc("get_owner_school_dashboard", {
            p_school_id,
          });

          if (error) {
            return { error: { status: "CUSTOM_ERROR", data: error } };
          }

          // RPC returns array, get first item
          return { data: data?.[0] || null };
        } catch (err) {
          return { error: { status: "CUSTOM_ERROR", data: err } };
        }
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return `${endpointName}(${queryArgs.p_school_id || "null"})`;
      },
      providesTags: (result, error, arg) => [
        { type: "Dashboard", id: `owner-school-${arg.p_school_id}` },
      ],
    }),

    // Owner branch dashboard
    getOwnerBranchDashboard: builder.query({
      async queryFn({ p_branch_id }) {
        try {
          if (!p_branch_id) {
            return { error: { status: "CUSTOM_ERROR", data: { message: "Branch ID is required" } } };
          }

          const { data, error } = await supabase.rpc("get_owner_branch_dashboard", {
            p_branch_id,
          });

          if (error) {
            return { error: { status: "CUSTOM_ERROR", data: error } };
          }

          // RPC returns array, get first item
          return { data: data?.[0] || null };
        } catch (err) {
          return { error: { status: "CUSTOM_ERROR", data: err } };
        }
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return `${endpointName}(${queryArgs.p_branch_id || "null"})`;
      },
      providesTags: (result, error, arg) => [
        { type: "Dashboard", id: `owner-branch-${arg.p_branch_id}` },
      ],
    }),

    // Principal/Coordinator branch dashboard
    getBranchDashboardForPrincipal: builder.query({
      async queryFn({ p_branch_id }) {
        try {
          if (!p_branch_id) {
            return { error: { status: "CUSTOM_ERROR", data: { message: "Branch ID is required" } } };
          }

          const { data, error } = await supabase.rpc("get_branch_dashboard_for_principal", {
            p_branch_id,
          });

          if (error) {
            return { error: { status: "CUSTOM_ERROR", data: error } };
          }

          // RPC returns array, get first item
          return { data: data?.[0] || null };
        } catch (err) {
          return { error: { status: "CUSTOM_ERROR", data: err } };
        }
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return `${endpointName}(${queryArgs.p_branch_id || "null"})`;
      },
      providesTags: (result, error, arg) => [
        { type: "Dashboard", id: `principal-branch-${arg.p_branch_id}` },
      ],
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetOwnerSchoolDashboardQuery,
  useGetOwnerBranchDashboardQuery,
  useGetBranchDashboardForPrincipalQuery,
} = dashboardApi;

