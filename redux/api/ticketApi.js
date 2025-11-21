import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getUserFullName } from "../../helpers/getUserFullName";
import { sendPushNotificationToUser } from "../../helpers/sendPushNotification";
import { supabase } from "../../supabaseClient";

export const ticketApi = createApi({
    reducerPath: "ticketApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["Tickets", "TicketReplies"],
    keepUnusedDataFor: 7200,
    endpoints: (builder) => ({
        getTickets: builder.query({
            async queryFn({ userId, role }) {
                try {
                    let query = supabase
                        .from("ticket_view")
                        .select("*");
                    
                    // Filter by created_By if user is not admin
                    if (role !== 'admin' && userId) {
                        query = query.eq("created_By", userId);
                    }
                    
                    // Order by created_at descending
                    const { data, error } = await query.order("created_at", { ascending: false });
                    
                    if (error) {
                        return { error: { status: 'CUSTOM_ERROR', data: error } };
                    }
                    
                    return { data: data || [] };
                } catch (err) {
                    return { error: { status: 'CUSTOM_ERROR', data: err } };
                }
            },
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                const { userId, role } = queryArgs;
                return `${endpointName}(${userId || 'null'},${role || 'null'})`;
            },
            providesTags: ["Tickets"],
        }),
        getTicketReplies: builder.query({
            async queryFn(ticketId) {
                try {
                    // Fetch from ticket_reply_view by ticket_Id
                    const { data, error } = await supabase
                        .from("ticket_reply_view")
                        .select("*")
                        .eq("ticket_Id", ticketId)
                        .order("created_at", { ascending: true });
                    
                    if (error) {
                        return { error: { status: 'CUSTOM_ERROR', data: error } };
                    }
                    
                    return { data: data || [] };
                } catch (err) {
                    return { error: { status: 'CUSTOM_ERROR', data: err } };
                }
            },
            providesTags: (result, error, ticketId) => [
                { type: "TicketReplies", id: ticketId },
            ],
        }),
        createTicket: builder.mutation({
            async queryFn(ticketData) {
                try {
                    const { data, error } = await supabase.functions.invoke('insert-ticket', {
                        body: ticketData
                    });

                    if (error) {
                        return { error: { status: 'CUSTOM_ERROR', data: error } };
                    }

                    // Send push notification to admin
                    try {
                        // Get admin's auth_Id from admin_profile table
                        const { data: adminData, error: adminError } = await supabase
                            .from('admin_profile')
                            .select('auth_Id')
                            .order('created_at', { ascending: true })
                            .limit(1)
                            .maybeSingle();

                        if (!adminError && adminData?.auth_Id) {
                            // Get creator's name for personalization (role not available in ticketData, so it will try all tables)
                            const creatorName = await getUserFullName(ticketData.created_By);

                            const priorityText = ticketData.ticket_Priority || "Medium";
                            const notificationTitle = "New Support Ticket Created";
                            const notificationBody = `${creatorName} has created a new ${priorityText.toLowerCase()} priority ticket: "${ticketData.ticket_Title}".`;
                            
                            await sendPushNotificationToUser(
                                adminData.auth_Id,
                                notificationTitle,
                                notificationBody,
                                {
                                    type: "ticket",
                                    ticketId: data?.id || data?.data?.id,
                                    createdBy: ticketData.created_By,
                                    title: ticketData.ticket_Title,
                                    priority: ticketData.ticket_Priority || "Medium",
                                    status: "open",
                                }
                            );
                        }
                    } catch (notificationError) {
                        // Log error but don't fail the ticket creation
                        console.log("Error sending push notification:", notificationError);
                    }

                    return { data };
                } catch (err) {
                    return { error: { status: 'CUSTOM_ERROR', data: err } };
                }
            },
            invalidatesTags: ["Tickets"],
        }),
        createTicketReply: builder.mutation({
            async queryFn(replyData) {
                try {
                    const { data, error } = await supabase
                        .from("ticket_reply")
                        .insert([
                            {
                                ticket_Id: replyData.ticket_Id,
                                reply: replyData.reply,
                                created_By: replyData.created_By,
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
                { type: "TicketReplies", id: arg.ticket_Id },
                { type: "Tickets" },
            ],
        }),
        updateTicketStatus: builder.mutation({
            async queryFn({ ticketId, status }) {
                try {
                    const { data, error } = await supabase
                        .from("ticket")
                        .update({ ticket_Status: status })
                        .eq("id", ticketId)
                        .select();

                    if (error) {
                        return { error: { status: 'CUSTOM_ERROR', data: error } };
                    }
                    return { data };
                } catch (err) {
                    return { error: { status: 'CUSTOM_ERROR', data: err } };
                }
            },
            invalidatesTags: ["Tickets"],
        }),
    }),
});

export const {
    useGetTicketsQuery,
    useLazyGetTicketsQuery,
    useGetTicketRepliesQuery,
    useLazyGetTicketRepliesQuery,
    useCreateTicketMutation,
    useCreateTicketReplyMutation,
    useUpdateTicketStatusMutation
} = ticketApi;

