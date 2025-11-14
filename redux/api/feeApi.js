import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";

export const feeApi = createApi({
  reducerPath: "feeApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Fees"],
  keepUnusedDataFor: 7200,
  endpoints: (builder) => ({
    getFeesByStudentPaginated: builder.query({
      async queryFn({ studentId, offset = 0, limit = 10 } = {}) {
        try {
          const from = offset;
          const to = offset + limit - 1;

          const { data, error, count } = await supabase
            .from("student_fee")
            .select("*", { count: "exact" })
            .eq("student_Id", studentId)
            .order("created_at", { ascending: false })
            .range(from, to);

          if (error) {
            return { error: { status: 'CUSTOM_ERROR', data: error } };
          }
          return { data: { items: data || [], total: typeof count === 'number' ? count : (data?.length || 0) } };
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', data: err } };
        }
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return `${endpointName}(${queryArgs?.studentId || 'null'})`;
      },
      providesTags: (result, error, arg) => [
        { type: "Fees", id: arg?.studentId },
        { type: "Fees", id: "LIST" },
      ],
    }),
    createFee: builder.mutation({
      async queryFn(feeData) {
        try {
          const { data, error } = await supabase
            .from("student_fee")
            .insert([
              {
                branch_Id: feeData.branch_Id,
                student_Id: feeData.student_Id,
                month: feeData.month,
                fee_Status: feeData.fee_Status,
                fee: feeData.fee,
                remaining_Fee: feeData.remaining_Fee,
                class_Id: feeData.class_Id,
                school_Id: feeData.school_Id,
              },
            ])
            .select();

          if (error) {
            return { error: { status: 'CUSTOM_ERROR', data: error } };
          }
          return { data };
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', data: err } };
        }
      },
      invalidatesTags: (result, error, arg) => [
        { type: "Fees", id: arg.student_Id },
        { type: "Fees", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetFeesByStudentPaginatedQuery,
  useLazyGetFeesByStudentPaginatedQuery,
  useCreateFeeMutation,
} = feeApi;

