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

const getUser = (token) => {
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } 
  catch {
    return null;
  }
};


const getOrCreateDirector = async (name, country = null, birthYear = null) => {
  let result = await pool.query('SELECT * FROM directors WHERE name = $1', [name]);
  if (result.rows.length > 0) return result.rows[0];
  
  result = await pool.query(
    'INSERT INTO directors (name, country, birth_year) VALUES ($1, $2, $3) RETURNING *',
    [name, country, birthYear]
  );
  return result.rows[0];
};

const getOrCreateAuthor = async (name, country = null, birthYear = null) => {
  let result = await pool.query('SELECT * FROM authors WHERE name = $1', [name]);
  if (result.rows.length > 0) return result.rows[0];
  
  result = await pool.query(
    `INSERT INTO authors (name, country, birth_year) 
      VALUES ($1, $2, $3) 
      RETURNING *`,
    [name, country, birthYear]
  );
  return result.rows[0];
};

const getMovieDirectors = async (movieId) => {
  const result = await pool.query(
    `SELECT d.* FROM directors d
     JOIN movie_directors md ON md.director_id = d.id
     WHERE md.movie_id = $1`,
    [movieId]
  );
  return normalizeRows(result.rows);
};

const getBookAuthors = async (bookId) => {
  const result = await pool.query(
    `SELECT a.* FROM authors a
     JOIN book_authors ba ON ba.author_id = a.id
     WHERE ba.book_id = $1`,
    [bookId]
  );
  return normalizeRows(result.rows);
};

const getDirectorMovies = async (directorId, userId = null) => {
  let query = `
    SELECT m.* FROM movies m
    JOIN movie_directors md ON md.movie_id = m.id
    WHERE md.director_id = $1
  `;
  let params = [directorId];
  
  if (userId) {
    query += ` AND m.user_id = $2`;
    params.push(userId);
  }
  
  query += ` ORDER BY m.created_at DESC`;
  const result = await pool.query(query, params);
  return normalizeRows(result.rows);
};

const getAuthorBooks = async (authorId, userId = null) => {
  let query = `
    SELECT b.* FROM books b
    JOIN book_authors ba ON ba.book_id = b.id
    WHERE ba.author_id = $1
  `;
  let params = [authorId];
  
  if (userId) {
    query += ` AND b.user_id = $2`;
    params.push(userId);
  }
  
  query += ` ORDER BY b.created_at DESC`;
  const result = await pool.query(query, params);
  return normalizeRows(result.rows);
};

const resolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        `SELECT id, username, email 
          FROM users WHERE id = $1`,
        [user.userId]
      );
      return result.rows[0];
    },
    
    getUser: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        `SELECT id, username, email 
          FROM users WHERE id = $1`,
        [id]
      );
      return result.rows[0];
    },
    
    getAllDirectors: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        'SELECT * FROM directors ORDER BY name'
      );
      return normalizeRows(result.rows);
    },
    
    getDirector: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        'SELECT * FROM directors WHERE id = $1', [id]
      );
      return result.rows[0];
    },
    
    getAllAuthors: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        'SELECT * FROM authors ORDER BY name'
      );
      return normalizeRows(result.rows);
    },
    
    getAuthor: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        'SELECT * FROM authors WHERE id = $1', [id]
      );
      return result.rows[0];
    },
  },
  
  Mutation: {
    signup: async (_, { username, email, password }) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `INSERT INTO users (username, email, password_hash) 
         VALUES ($1, $2, $3) RETURNING id, username, email`,
        [username, email, hashedPassword]
      );
      const user = result.rows[0];
      const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET);
      return { token, user };
    },
    
    login: async (_, { email, password }) => {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      if (!user) throw new Error('User not found');
      
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) throw new Error('Invalid password');
      
      const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET);
      return { token, user: { id: user.id, username: user.username, email: user.email } };
    },
    
    addMovie: async (_, { title, genre, rating, review, status, year, runtime, directorNames }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      
      const result = await pool.query(
        `INSERT INTO movies (user_id, title, genre, rating, review, status, year, runtime) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [user.userId, title, genre, rating, review, status, year, runtime]
      );
      const movie = result.rows[0];
      
      if (directorNames && directorNames.length > 0) {
        for (const directorName of directorNames) {
          const director = await getOrCreateDirector(directorName);
          await pool.query(
            `INSERT INTO movie_directors (movie_id, director_id) 
              VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [movie.id, director.id]
          );
        }
      }
      
      return normalizeRow(movie);
    },
    
    updateMovie: async (_, { id, genre, rating, review, status, is_favorite, year, runtime }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        `UPDATE movies 
         SET genre = COALESCE($1, genre), rating = COALESCE($2, rating), review = COALESCE($3, review), 
             status = COALESCE($4, status), is_favorite = COALESCE($5, is_favorite),
             year = COALESCE($6, year), runtime = COALESCE($7, runtime)
         WHERE id = $8 AND user_id = $9 RETURNING *`,
        [genre, rating, review, status, is_favorite, year, runtime, id, user.userId]
      );
      return normalizeRow(result.rows[0]);
    },
    
    deleteMovie: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      await pool.query(
        `DELETE FROM movies 
          WHERE id = $1 AND user_id = $2`, [id, user.userId]
      );
      return true;
    },
    
    addBook: async (_, { title, genre, rating, review, status, year, pages, authorNames }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      
      const normalizedStatus = status === 'WATCHING' ? 'READING'
        : status === 'PLAN_TO_WATCH' ? 'PLAN_TO_READ' : status;
      
      const result = await pool.query(
        `INSERT INTO books (user_id, title, genre, rating, review, status, year, pages) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [user.userId, title, genre, rating, review, normalizedStatus, year, pages]
      );
      const book = result.rows[0];
      
      if (authorNames && authorNames.length > 0) {
        for (const authorName of authorNames) {
          const author = await getOrCreateAuthor(authorName);
          await pool.query(
            'INSERT INTO book_authors (book_id, author_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [book.id, author.id]
          );
        }
      }
      
      return normalizeRow(book);
    },
    
    updateBook: async (_, { id, genre, rating, review, status, is_favorite, year, pages }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      
      let normalizedStatus = status;
      if (status) {
        normalizedStatus = status === 'WATCHING' ? 'READING'
          : status === 'PLAN_TO_WATCH' ? 'PLAN_TO_READ' : status;
      }
      
      const result = await pool.query(
        `UPDATE books 
         SET genre = COALESCE($1, genre), rating = COALESCE($2, rating), review = COALESCE($3, review), 
             status = COALESCE($4, status), is_favorite = COALESCE($5, is_favorite),
             year = COALESCE($6, year), pages = COALESCE($7, pages)
         WHERE id = $8 AND user_id = $9 RETURNING *`,
        [genre, rating, review, normalizedStatus, is_favorite, year, pages, id, user.userId]
      );
      return normalizeRow(result.rows[0]);
    },
    
    deleteBook: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      await pool.query('DELETE FROM books WHERE id = $1 AND user_id = $2', [id, user.userId]);
      return true;
    },
    
    addDirector: async (_, { name, country, birthYear }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        'INSERT INTO directors (name, country, birth_year) VALUES ($1, $2, $3) RETURNING *',
        [name, country, birthYear]
      );
      return normalizeRow(result.rows[0]);
    },
    
    updateDirector: async (_, { id, name, country, birthYear }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        'UPDATE directors SET name = COALESCE($1, name), country = COALESCE($2, country), birth_year = COALESCE($3, birth_year) WHERE id = $4 RETURNING *',
        [name, country, birthYear, id]
      );
      return normalizeRow(result.rows[0]);
    },
    
    deleteDirector: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      await pool.query('DELETE FROM directors WHERE id = $1', [id]);
      return true;
    },
    
    addAuthor: async (_, { name, country, birthYear }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        'INSERT INTO authors (name, country, birth_year) VALUES ($1, $2, $3) RETURNING *',
        [name, country, birthYear]
      );
      return normalizeRow(result.rows[0]);
    },
    
    updateAuthor: async (_, { id, name, country, birthYear }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        'UPDATE authors SET name = COALESCE($1, name), country = COALESCE($2, country), birth_year = COALESCE($3, birth_year) WHERE id = $4 RETURNING *',
        [name, country, birthYear, id]
      );
      return normalizeRow(result.rows[0]);
    },
    
    deleteAuthor: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      await pool.query(
        'DELETE FROM authors WHERE id = $1', [id]
      );
      return true;
    },
  },
  
  // resolver chains  // 
  User: {
    movies: async (parent, _, { user }) => {
      if (!user || parent.id !== user.userId) throw new Error('Not authorized');
      const result = await pool.query(
        `SELECT * FROM movies 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [parent.id]
      );
      return normalizeRows(result.rows);
    },
    
    favoriteMovies: async (parent, _, { user }) => {
      if (!user || parent.id !== user.userId) throw new Error('Not authorized');
      const result = await pool.query(
        `SELECT * FROM movies 
         WHERE user_id = $1 AND is_favorite = true 
         ORDER BY created_at DESC`,
        [parent.id]
      );
      return normalizeRows(result.rows);
    },
    
    moviesByMultipleGenres: async (parent, { genres }, { user }) => {
      if (!user || parent.id !== user.userId) throw new Error('Not authorized');
      const result = await pool.query(
        `SELECT * FROM movies 
         WHERE user_id = $1 AND genre && $2::text[] 
         ORDER BY created_at DESC`,
        [parent.id, genres]
      );
      return normalizeRows(result.rows);
    },
    
    books: async (parent, _, { user }) => {
      if (!user || parent.id !== user.userId) throw new Error('Not authorized');
      const result = await pool.query(
        `SELECT * FROM books 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [parent.id]
      );
      return normalizeRows(result.rows);
    },
    
    favoriteBooks: async (parent, _, { user }) => {
      if (!user || parent.id !== user.userId) throw new Error('Not authorized');
      const result = await pool.query(
        `SELECT * FROM books 
         WHERE user_id = $1 AND is_favorite = true 
         ORDER BY created_at DESC`,
        [parent.id]
      );
      return normalizeRows(result.rows);
    },
    
    booksByMultipleGenres: async (parent, { genres }, { user }) => {
      if (!user || parent.id !== user.userId) throw new Error('Not authorized');
      const result = await pool.query(
        `SELECT * FROM books 
         WHERE user_id = $1 AND genre && $2::text[] 
         ORDER BY created_at DESC`,
        [parent.id, genres]
      );
      return normalizeRows(result.rows);
    },
  },
  
  Director: {
    movies: async (parent, _, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return await getDirectorMovies(parent.id, user.userId);
    },
    
    movieCount: async (parent, _, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        `SELECT COUNT(*) FROM movie_directors md
         JOIN movies m ON m.id = md.movie_id
         WHERE md.director_id = $1 AND m.user_id = $2`,
        [parent.id, user.userId]
      );
      return parseInt(result.rows[0].count);
    },
  },
  
  Author: {
    books: async (parent, _, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return await getAuthorBooks(parent.id, user.userId);
    },
    
    bookCount: async (parent, _, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await pool.query(
        `SELECT COUNT(*) FROM book_authors ba
         JOIN books b ON b.id = ba.book_id
         WHERE ba.author_id = $1 AND b.user_id = $2`,
        [parent.id, user.userId]
      );
      return parseInt(result.rows[0].count);
    },
  },
  
  Movie: {
    directors: async (parent, _, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return await getMovieDirectors(parent.id);
    },
  },
  
  Book: {
    authors: async (parent, _, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return await getBookAuthors(parent.id);
    },
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

