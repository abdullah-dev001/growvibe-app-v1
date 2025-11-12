import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
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

