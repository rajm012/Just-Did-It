

-- ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
-- ## Table Creation

CREATE TABLE table_name (
  column1_name data_type constraints,
  column2_name data_type constraints,
  column3_name data_type constraints,
);

-- Common Data Types:
--   SERIAL - Auto-incrementing integer (for IDs)
--   INTEGER / BIGINT - Whole numbers
--   VARCHAR(n) - Variable text (max length n)
--   TEXT - Unlimited text
--   TIMESTAMP - Date and time
--   BOOLEAN - True/false
--   DECIMAL(10,2) - Exact numbers with decimals

-- Common Constraints:
--   PRIMARY KEY - Uniquely identifies each row
--   FOREIGN KEY - References another table
--   NOT NULL - Value required
--   UNIQUE - No duplicates allowed
--   CHECK (condition) - Validates data
--   DEFAULT value - Default if none provided


INSERT INTO table_name (col1, col2, col3) 
VALUES 
  (val1, val2, val3),
  (val4, val5, val6),
  (val7, val8, val9);


-- ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

-- transactions 
BEGIN;
  -- Your INSERTs here
COMMIT;

```
can also use the ROLLBACK command to undo changes if something goes wrong:
and also can use SAVEPOINT to create checkpoints within a transaction:
```

BEGIN;
  -- Your first set of INSERTs here
  SAVEPOINT first_batch;
  -- Your second set of INSERTs here
  -- If something goes wrong with the second batch, you can roll back to the savepoint
  ROLLBACK TO SAVEPOINT first_batch;
COMMIT;



-- ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
-- ## Adding permissions

sudo -u postgres psql

GRANT ALL ON SCHEMA public TO tracker_user;
GRANT ALL PRIVILEGES ON DATABASE tracker_db TO tracker_user;

ALTER DATABASE tracker_db OWNER TO tracker_user;

-- \q
-- psql -d tracker_db -U tracker_user -h localhost -W
-- \dt

-- ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
-- ## Database Schema Design

-- psql -d tracker_db -U tracker_user

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Movies table (belongs to user)
CREATE TABLE movies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  genre VARCHAR(100),
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  review TEXT,
  status VARCHAR(50) CHECK (status IN ('WATCHING', 'COMPLETED', 'PLAN_TO_WATCH', 'DROPPED')),
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Books table (belongs to user)
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  genre VARCHAR(100),
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  review TEXT,
  status VARCHAR(50) CHECK (status IN ('READING', 'COMPLETED', 'PLAN_TO_READ', 'DROPPED')),
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
-- -- ## Quick Commands Reference

-- sudo -u postgres psql
-- psql -h localhost -d tracker_db -U tracker_user
-- psql -d tracker_db -U tracker_user
-- \dt
-- \d movies

-- ## Delete all data (careful!)
TRUNCATE movies, books, users RESTART IDENTITY;


-- ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


ALTER TABLE movies ALTER COLUMN genre TYPE TEXT[];
ALTER TABLE books ALTER COLUMN genre TYPE TEXT[];


-- ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


CREATE TABLE directors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  country VARCHAR(100),
  birth_year INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE authors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  country VARCHAR(100),
  birth_year INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE movies ADD COLUMN year INTEGER, ADD COLUMN runtime INTEGER;
ALTER TABLE books ADD COLUMN year INTEGER, ADD COLUMN pages INTEGER;


CREATE TABLE movie_directors (
  movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
  director_id INTEGER REFERENCES directors(id) ON DELETE CASCADE,
  PRIMARY KEY (movie_id, director_id)
);


CREATE TABLE book_authors (
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  author_id INTEGER REFERENCES authors(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, author_id)
);


CREATE INDEX idx_movie_directors_movie_id ON movie_directors(movie_id);
CREATE INDEX idx_movie_directors_director_id ON movie_directors(director_id);
CREATE INDEX idx_book_authors_book_id ON book_authors(book_id);
CREATE INDEX idx_book_authors_author_id ON book_authors(author_id);
CREATE INDEX idx_movies_user_id ON movies(user_id);
CREATE INDEX idx_books_user_id ON books(user_id);

-- ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

INSERT INTO users (username, email, password_hash, created_at) VALUES
('raj', 'raj@mail.com', 'this', NOW()),
('yei', 'yeichen@mail.com', 'this', NOW()),
('yoi', 'yoiban@mail.com', 'this', NOW());

INSERT INTO directors (name, country, birth_year, created_at) VALUES
('Christopher Nolan', 'United Kingdom', 1970, NOW()),
('Steven Spielberg', 'United States', 1946, NOW()),
('Quentin Tarantino', 'United States', 1963, NOW()),
('Greta Gerwig', 'United States', 1983, NOW()),
('Bong Joon-ho', 'South Korea', 1969, NOW()),
('Denis Villeneuve', 'Canada', 1967, NOW()),
('Martin Scorsese', 'United States', 1942, NOW()),
('James Cameron', 'Canada', 1954, NOW()),
('David Fincher', 'United States', 1962, NOW()),
('Ridley Scott', 'United Kingdom', 1937, NOW()),
('Ava DuVernay', 'United States', 1972, NOW()),
('Taika Waititi', 'New Zealand', 1975, NOW()),
('Jordan Peele', 'United States', 1979, NOW()),
('Patty Jenkins', 'United States', 1971, NOW()),
('Wes Anderson', 'United States', 1969, NOW()),
('Vineeth Sreenivasan', 'India', 1984, NOW()),
('Dijo Jose Antony', 'India', 1988, NOW());



INSERT INTO authors (name, country, birth_year, created_at) VALUES
('Stephen King', 'United States', 1947, NOW()),
('J.K. Rowling', 'United Kingdom', 1965, NOW()),
('George R.R. Martin', 'United States', 1948, NOW()),
('Agatha Christie', 'United Kingdom', 1890, NOW()),
('Haruki Murakami', 'Japan', 1949, NOW()),
('Jane Austen', 'United Kingdom', 1775, NOW()),
('Ernest Hemingway', 'United States', 1899, NOW()),
('Gabriel García Márquez', 'Colombia', 1927, NOW()),
('Toni Morrison', 'United States', 1931, NOW()),
('Kazuo Ishiguro', 'United Kingdom', 1954, NOW()),
('Yuval Noah Harari', 'Israel', 1976, NOW()),
('Michelle Obama', 'United States', 1964, NOW()),
('Paulo Coelho', 'Brazil', 1947, NOW()),
('Dan Brown', 'United States', 1964, NOW()),
('Bryan Cox', 'United States', 1968, NOW()),
('Neil Gaiman', 'United Kingdom', 1960, NOW());


INSERT INTO movies (user_id, title, genre, rating, review, status, is_favorite, year, runtime, created_at) VALUES
(1, 'Inception', ARRAY['Sci-Fi', 'Thriller'], 10, 'Mind-blowing! Nolan at his best.', 'COMPLETED', true, 2010, 148, NOW()),
(1, 'The Dark Knight', ARRAY['Action', 'Crime', 'Drama'], 10, 'Heath Ledger''s Joker is iconic.', 'COMPLETED', true, 2008, 152, NOW()),
(1, 'Pulp Fiction', ARRAY['Crime', 'Drama'], 9, 'Tarantino''s masterpiece.', 'COMPLETED', false, 1994, 154, NOW()),
(1, 'Parasite', ARRAY['Thriller', 'Drama', 'Comedy'], 10, 'Social commentary wrapped in a thriller.', 'COMPLETED', true, 2019, 132, NOW()),
(1, 'Barbie', ARRAY['Comedy', 'Fantasy'], 8, 'Surprisingly deep and hilarious.', 'COMPLETED', true, 2023, 114, NOW());

INSERT INTO movies (user_id, title, genre, rating, review, status, is_favorite, year, runtime, created_at) VALUES
(2, 'Titanic', ARRAY['Romance', 'Drama'], 9, 'Heartbreaking and beautiful.', 'COMPLETED', true, 1997, 194, NOW()),
(2, 'La La Land', ARRAY['Musical', 'Romance', 'Drama'], 9, 'Beautiful cinematography.', 'COMPLETED', true, 2016, 128, NOW()),
(2, 'Everything Everywhere All at Once', ARRAY['Action', 'Adventure', 'Sci-Fi'], 10, 'What did I just watch? Amazing!', 'WATCHING', true, 2022, 139, NOW());

INSERT INTO movies (user_id, title, genre, rating, review, status, is_favorite, year, runtime, created_at) VALUES
(3, 'Goodfellas', ARRAY['Biography', 'Crime', 'Drama'], 10, 'Scorsese at his peak.', 'COMPLETED', true, 1990, 145, NOW()),
(3, 'The Matrix', ARRAY['Action', 'Sci-Fi'], 9, 'Revolutionary for its time.', 'COMPLETED', true, 1999, 136, NOW()),
(3, 'Jana Gana Mana', ARRAY['Crime', 'Thriller'], 9, 'A gripping thriller.', 'COMPLETED', true, 2022, 180, NOW());



INSERT INTO books (user_id, title, genre, rating, review, status, is_favorite, year, pages, created_at) VALUES
(1, 'The Shining', ARRAY['Horror', 'Thriller'], 9, 'Stephen King at his finest.', 'COMPLETED', true, 1977, 447, NOW()),
(1, 'Harry Potter', ARRAY['Fantasy', 'Adventure'], 8, 'The book that started it all.', 'COMPLETED', true, 1997, 309, NOW()),
(1, 'A Game of Thrones', ARRAY['Fantasy', 'Epic'], 9, 'Incredible world-building.', 'READING', false, 1996, 694, NOW()),
(1, 'Sapiens', ARRAY['History', 'Non-fiction'], 10, 'Mind-expanding.', 'COMPLETED', true, 2011, 443, NOW());

INSERT INTO books (user_id, title, genre, rating, review, status, is_favorite, year, pages, created_at) VALUES
(2, 'Pride and Prejudice', ARRAY['Romance', 'Classic'], 9, 'Timeless romance.', 'COMPLETED', true, 1813, 279, NOW()),
(2, 'One Hundred Years of Solitude', ARRAY['Magical Realism', 'Literary Fiction'], 10, 'Masterpiece of magical realism.', 'READING', true, 1967, 417, NOW()),
(2, 'Becoming', ARRAY['Biography', 'Memoir'], 9, 'Inspirational and honest.', 'COMPLETED', true, 2018, 448, NOW());

INSERT INTO books (user_id, title, genre, rating, review, status, is_favorite, year, pages, created_at) VALUES
(3, 'The Alchemist', ARRAY['Adventure', 'Philosophical'], 7, 'Simple but profound.', 'COMPLETED', false, 1988, 163, NOW()),
(3, 'American Gods', ARRAY['Fantasy', 'Mythology'], 8, 'Creative and epic.', 'READING', true, 2001, 465, NOW()),
(3, 'The Quantum Universe', ARRAY['Sci-Fi'], 8, 'Science at it`s best.', 'READING', true, 2018, 465, NOW());



INSERT INTO movie_directors (movie_id, director_id)
SELECT m.id, d.id
FROM movies m, directors d
WHERE m.title = 'Inception' AND d.name = 'Christopher Nolan';

INSERT INTO movie_directors (movie_id, director_id)
SELECT m.id, d.id
FROM movies m, directors d
WHERE m.title = 'The Dark Knight' AND d.name = 'Christopher Nolan';

INSERT INTO movie_directors (movie_id, director_id)
SELECT m.id, d.id
FROM movies m, directors d
WHERE m.title = 'Pulp Fiction' AND d.name = 'Quentin Tarantino';

INSERT INTO movie_directors (movie_id, director_id)
SELECT m.id, d.id
FROM movies m, directors d
WHERE m.title = 'Parasite' AND d.name = 'Bong Joon-ho';

INSERT INTO movie_directors (movie_id, director_id)
SELECT m.id, d.id
FROM movies m, directors d
WHERE m.title = 'Barbie' AND d.name = 'Greta Gerwig';

INSERT INTO movie_directors (movie_id, director_id)
SELECT m.id, d.id
FROM movies m, directors d
WHERE m.title = 'Titanic' AND d.name = 'James Cameron';

INSERT INTO movie_directors (movie_id, director_id)
SELECT m.id, d.id
FROM movies m, directors d
WHERE m.title = 'La La Land' AND d.name = 'Ridley Scott';

INSERT INTO movie_directors (movie_id, director_id)
SELECT m.id, d.id
FROM movies m, directors d
WHERE m.title = 'Goodfellas' AND d.name = 'Martin Scorsese';

INSERT INTO movie_directors (movie_id, director_id)
SELECT m.id, d.id
FROM movies m, directors d
WHERE m.title = 'The Matrix' AND d.name = 'Denis Villeneuve';

INSERT INTO movie_directors (movie_id, director_id)
SELECT m.id, d.id
FROM movies m, directors d
WHERE m.title = 'Jana Gana Mana' AND d.name = 'Dijo Jose Antony';


INSERT INTO book_authors (book_id, author_id)
SELECT b.id, a.id
FROM books b, authors a
WHERE b.title = 'The Shining' AND a.name = 'Stephen King';

INSERT INTO book_authors (book_id, author_id)
SELECT b.id, a.id
FROM books b, authors a
WHERE b.title = 'Harry Potter' AND a.name = 'J.K. Rowling';

INSERT INTO book_authors (book_id, author_id)
SELECT b.id, a.id
FROM books b, authors a
WHERE b.title = 'A Game of Thrones' AND a.name = 'George R.R. Martin';

INSERT INTO book_authors (book_id, author_id)
SELECT b.id, a.id
FROM books b, authors a
WHERE b.title = 'Sapiens' AND a.name = 'Yuval Noah Harari';

INSERT INTO book_authors (book_id, author_id)
SELECT b.id, a.id
FROM books b, authors a
WHERE b.title = 'Pride and Prejudice' AND a.name = 'Jane Austen';

INSERT INTO book_authors (book_id, author_id)
SELECT b.id, a.id
FROM books b, authors a
WHERE b.title = 'One Hundred Years of Solitude' AND a.name = 'Gabriel García Márquez';

INSERT INTO book_authors (book_id, author_id)
SELECT b.id, a.id
FROM books b, authors a
WHERE b.title = 'Becoming' AND a.name = 'Michelle Obama';

INSERT INTO book_authors (book_id, author_id)
SELECT b.id, a.id
FROM books b, authors a
WHERE b.title = 'The Alchemist' AND a.name = 'Paulo Coelho';

INSERT INTO book_authors (book_id, author_id)
SELECT b.id, a.id
FROM books b, authors a
WHERE b.title = 'American Gods' AND a.name = 'Neil Gaiman';


SELECT 'Movies' as Type, COUNT(*) as Count FROM movies
UNION ALL
SELECT 'Books', COUNT(*) FROM books
UNION ALL
SELECT 'Directors', COUNT(*) FROM directors
UNION ALL
SELECT 'Authors', COUNT(*) FROM authors;

SELECT 
  m.title,
  m.rating,
  m.year,
  STRING_AGG(d.name, ', ') as directors
FROM movies m
LEFT JOIN movie_directors md ON md.movie_id = m.id
LEFT JOIN directors d ON d.id = md.director_id
GROUP BY m.id
ORDER BY m.user_id;

SELECT 
  b.title,
  b.rating,
  b.year,
  STRING_AGG(a.name, ', ') as authors
FROM books b
LEFT JOIN book_authors ba ON ba.book_id = b.id
LEFT JOIN authors a ON a.id = ba.author_id
GROUP BY b.id
ORDER BY b.user_id;

-- ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


