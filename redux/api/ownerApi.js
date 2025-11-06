// owners_without_school
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../supabaseClient";

export const ownerApi = createApi({
    reducerPath: "ownerApi",
    baseQuery: fakeBaseQuery(),
    tagTypes: ["Owners"],
    keepUnusedDataFor: 7200,
    endpoints: (builder) => ({
        getOwnersWithoutSchoolId: builder.query({
            async queryFn() {
                const { data, error } = await supabase
                    .from("owners_without_school")
                    .select("*")
                
                if (error) throw error;
                return { data };
            },
            providesTags: ["Owners"],
        }),
        getOwners: builder.query({
            async queryFn() {
                const { data, error } = await supabase
                    .from("owner_with_additional_info")
                    .select("*")
                if (error) throw error;
                return { data };
            },
            providesTags: ["Owners"],
        }),
        getOwnersPaginated: builder.query({
            async queryFn({ offset = 0, limit = 5 } = {}) {
                const from = offset;
                const to = offset + limit - 1;

                const { data, error, count } = await supabase
                    .from("owner_with_additional_info")
                    .select("*", { count: "exact" })
                    .order("created_at", { ascending: false })
                    .range(from, to);

                if (error) throw error;

                return { data: { items: data || [], total: typeof count === 'number' ? count : (data?.length || 0) } };
            },
            providesTags: ["Owners"],
        }),
    }),
});
export const { useGetOwnersWithoutSchoolIdQuery, useGetOwnersQuery, useGetOwnersPaginatedQuery, useLazyGetOwnersPaginatedQuery } = ownerApi;
