import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { sendPushNotificationToUser } from "../../helpers/sendPushNotification";
import { supabase } from "../../supabaseClient";

export const paymentApi = createApi({
    reducerPath: "paymentApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["Payments"],
    keepUnusedDataFor: 7200,
    endpoints: (builder) => ({
        getPaymentsBySchool: builder.query({
            async queryFn(schoolId) {
                try {
                    const { data, error } = await supabase
                        .from("payment")
                        .select("*")
                        .eq("school_Id", schoolId)
                        .order("created_at", { ascending: false });

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
            providesTags: (result, error, schoolId) => [
                { type: "Payments", id: schoolId },
            ],
        }),
        getPaymentsBySchoolPaginated: builder.query({
            async queryFn({ schoolId, offset = 0, limit = 5 } = {}) {
                try {
                    const from = offset;
                    const to = offset + limit - 1;

                    const { data, error, count } = await supabase
                        .from("payment")
                        .select("*", { count: "exact" })
                        .eq("school_Id", schoolId)
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
                return `${endpointName}(${queryArgs?.schoolId || 'null'})`;
            },
            providesTags: (result, error, arg) => [
                { type: "Payments", id: arg?.schoolId },
            ],
        }),
        createPayment: builder.mutation({
            async queryFn(paymentData) {
                try {
                    // Insert payment
                    const { data, error } = await supabase
                        .from("payment")
                        .insert([
                            {
                                school_Id: paymentData.school_Id,
                                payment_Method: paymentData.payment_Method,
                                remaining_Due: paymentData.remaining_Due || null,
                                payment_Status: paymentData.payment_Status,
                                payment_Description: paymentData.payment_Description,
                                month: paymentData.month,
                                fee: paymentData.fee,
                            },
                        ])
                        .select();

                    if (error) {
                        return { error: { status: 'CUSTOM_ERROR', data: error } };
                    }

                    // Send push notification to school owner
                    try {
                        // Get school's owner_Id
                        const { data: schoolData, error: schoolError } = await supabase
                            .from("school")
                            .select("owner_Id, school_Name")
                            .eq("id", paymentData.school_Id)
                            .single();

                        if (!schoolError && schoolData?.owner_Id) {
                            const notificationTitle = "New Payment Created";
                            const statusText = paymentData.payment_Status ? "Paid" : "Pending";
                            const notificationBody = `A new payment of Rs.${paymentData.fee.toLocaleString("en-US")} for ${paymentData.month} (${statusText}) has been created for ${schoolData.school_Name || 'your school'}.`;
                            
                            await sendPushNotificationToUser(
                                schoolData.owner_Id,
                                notificationTitle,
                                notificationBody,
                                {
                                    type: "payment",
                                    schoolId: paymentData.school_Id,
                                    paymentId: data?.[0]?.id,
                                    month: paymentData.month,
                                    fee: paymentData.fee,
                                    status: paymentData.payment_Status ? "paid" : "pending",
                                }
                            );
                        }
                    } catch (notificationError) {
                        // Log error but don't fail the payment creation
                        console.log("Error sending push notification:", notificationError);
                    }

                    return { data };
                } catch (err) {
                    return { error: { status: 'CUSTOM_ERROR', data: err } };
                }
            },
            invalidatesTags: (result, error, arg) => [
                { type: "Payments", id: arg.school_Id },
            ],
        }),
    }),
});

export const {
    useGetPaymentsBySchoolQuery,
    useGetPaymentsBySchoolPaginatedQuery,
    useLazyGetPaymentsBySchoolPaginatedQuery,
    useCreatePaymentMutation
} = paymentApi;

