import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { createUploadLink } from "apollo-upload-client";

const GRAPHQL_URI =
  import.meta.env.VITE_GRAPHQL_URI || "http://localhost:3000/graphql";

const uploadLink = createUploadLink({
  uri: GRAPHQL_URI,
  credentials: "include",
});

const authLink = setContext((_, { headers }) => {
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(uploadLink),
  cache: new InMemoryCache(),
});
