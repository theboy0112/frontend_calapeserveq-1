import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// Use environment variable for the backend URL
// Make sure to create a .env file with: VITE_GRAPHQL_URI=https://queuecalape.onrender.com/graphql
const GRAPHQL_URI = import.meta.env.VITE_GRAPHQL_URI || "https://queuecalape.onrender.com/graphql";

// Create HTTP link
const httpLink = createHttpLink({
  uri: GRAPHQL_URI,
  credentials: "include", // include cookies if your backend uses them
});

// Attach Authorization header with token if it exists
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("token");
  const nextHeaders = { ...headers };
  if (token) {
    nextHeaders.authorization = `Bearer ${token}`;
  } else if (nextHeaders.authorization) {
    delete nextHeaders.authorization;
  }
  return { headers: nextHeaders };
});

// Create Apollo Client
export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});