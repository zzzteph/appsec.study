import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { contextFromReq } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,                                    // VULN[graphql-introspection]
  includeStacktraceInErrorResponses: true,                // VULN[verbose-errors] stack traces leak internals
  plugins: [ApolloServerPluginLandingPageLocalDefault()]  // VULN[graphiql-exposed]
});
await server.start();

app.use('/graphql', cors(), express.json(), expressMiddleware(server, {
  context: async ({ req }) => contextFromReq(req)
}));

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log('graph GraphQL + SPA on :' + PORT));
