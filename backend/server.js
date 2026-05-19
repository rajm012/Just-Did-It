
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});


const normalizeRow = (r) => {
  if (!r) return r;
  const created_at = r.created_at
    ? (r.created_at instanceof Date ? r.created_at.toISOString() : new Date(r.created_at).toISOString())
    : null;
  return { ...r, created_at };
};

const normalizeRows = (rows) => (Array.isArray(rows) ? rows.map(normalizeRow) : rows);

const typeDefs = fs.readFileSync('./schema.graphql', 'utf8');

// Get user from token
const getUser = (token) => {
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

const resolvers = {
  Query: {
    getMyMovies: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        'SELECT * FROM movies WHERE user_id = $1 ORDER BY created_at DESC',
        [user.userId]
      );
      return normalizeRows(result.rows);
    },

    getMyBooks: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        'SELECT * FROM books WHERE user_id = $1 ORDER BY created_at DESC',
        [user.userId]
      );
      return normalizeRows(result.rows);
    },

    getMoviesByStatus: async (_, { status }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        'SELECT * FROM movies WHERE user_id = $1 AND status = $2',
        [user.userId, status]
      );
      return normalizeRows(result.rows);
    },
    
    getBooksByStatus: async (_, { status }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        'SELECT * FROM books WHERE user_id = $1 AND status = $2',
        [user.userId, status]
      );
      return normalizeRows(result.rows);
    },

    searchMovies: async (_, { term }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        'SELECT * FROM movies WHERE user_id = $1 AND (title ILIKE $2 OR EXISTS (SELECT 1 FROM unnest(genre) AS g WHERE g ILIKE $2))',
        [user.userId, `%${term}%`]
      );
      return normalizeRows(result.rows);
    },

    searchBooks: async (_, { term }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        'SELECT * FROM books WHERE user_id = $1 AND (title ILIKE $2 OR EXISTS (SELECT 1 FROM unnest(genre) AS g WHERE g ILIKE $2))',
        [user.userId, `%${term}%`]
      );
      return normalizeRows(result.rows);
    },

    getFavoriteMovies: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        'SELECT * FROM movies WHERE user_id = $1 AND is_favorite = true ORDER BY created_at DESC',
        [user.userId]
      );
      return normalizeRows(result.rows);
    },

    getFavoriteBooks: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        'SELECT * FROM books WHERE user_id = $1 AND is_favorite = true ORDER BY created_at DESC',
        [user.userId]
      );
      return normalizeRows(result.rows);
    },

  },

  Mutation: {
    signup: async (_, { username, email, password }) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
        [username, email, hashedPassword]
      );
      const user = result.rows[0];
      const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET);
      return { token, user };
    },

    login: async (_, { email, password }) => {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      const user = result.rows[0];
      if (!user) throw new Error('User not found');
      
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) throw new Error('Invalid password');
      
      const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET);
      return { token, user: { id: user.id, username: user.username, email: user.email } };
    },

    addMovie: async (_, { title, genre, rating, review, status }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        'INSERT INTO movies (user_id, title, genre, rating, review, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [user.userId, title, genre, rating, review, status]
      );
      const row = result.rows[0];
      return normalizeRow(row);
    },

    updateMovie: async (_, { id, genre, rating, review, status, is_favorite }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        'UPDATE movies SET genre = COALESCE($1, genre), rating = COALESCE($2, rating), review = COALESCE($3, review), status = COALESCE($4, status), is_favorite = COALESCE($5, is_favorite) WHERE id = $6 AND user_id = $7 RETURNING *',
        [genre, rating, review, status, is_favorite, id, user.userId]
      );
      const row = result.rows[0];
      return normalizeRow(row);
    },

    deleteMovie: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      await pool.query('DELETE FROM movies WHERE id = $1 AND user_id = $2', [id, user.userId]);
      return true;
    },

    addBook: async (_, { title, genre, rating, review, status }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const normalizedStatus = status === 'WATCHING'
        ? 'READING'
        : status === 'PLAN_TO_WATCH'
          ? 'PLAN_TO_READ'
          : status;
      const result = await pool.query(
        'INSERT INTO books (user_id, title, genre, rating, review, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [user.userId, title, genre, rating, review, normalizedStatus]
      );
      const row = result.rows[0];
      return normalizeRow(row);
    },

    updateBook: async (_, { id, genre, rating, review, status, is_favorite }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const normalizedStatus = status === 'WATCHING'
        ? 'READING'
        : status === 'PLAN_TO_WATCH'
          ? 'PLAN_TO_READ'
          : status;
      const result = await pool.query(
        'UPDATE books SET genre = COALESCE($1, genre), rating = COALESCE($2, rating), review = COALESCE($3, review), status = COALESCE($4, status), is_favorite = COALESCE($5, is_favorite) WHERE id = $6 AND user_id = $7 RETURNING *',
        [genre, rating, review, normalizedStatus, is_favorite, id, user.userId]
      );
      const row = result.rows[0];
      return normalizeRow(row);
    },

    deleteBook: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      await pool.query('DELETE FROM books WHERE id = $1 AND user_id = $2', [id, user.userId]);
      return true;
    }
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

startStandaloneServer(server, {
  listen: { port: process.env.PORT || 4000 },
  context: async ({ req }) => {
    const token = req.headers.authorization || '';
    const user = getUser(token.replace('Bearer ', ''));
    return { user };
  },
  }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

