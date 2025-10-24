import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = createHttpLink({
  uri: "https://queuecalape.onrender.com/graphql",
});

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

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
