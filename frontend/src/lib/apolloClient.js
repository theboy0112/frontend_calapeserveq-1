import { ApolloClient, InMemoryCache } from "@apollo/client";
import { createUploadLink } from "apollo-upload-client";

const GRAPHQL_URI = import.meta.env.VITE_GRAPHQL_URI || "http://localhost:3000/graphql";

const uploadLink = createUploadLink({
  uri: GRAPHQL_URI,
  credentials: "include",
  headers: {
    authorization: localStorage.getItem("token")
      ? `Bearer ${localStorage.getItem("token")}`
      : "",
  },
});

export const client = new ApolloClient({
  link: uploadLink,
  cache: new InMemoryCache(),
});
