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
    }),
});
export const { useGetOwnersWithoutSchoolIdQuery, useGetOwnersQuery } = ownerApi;
