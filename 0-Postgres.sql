

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


-- ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
-- ## DATA Seeding

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
-- ## Insert Test Data

INSERT INTO users (username, email, password_hash) 
VALUES ('testuser', 'test@example.com', 'temp_placeholder');

INSERT INTO movies (user_id, title, genre, rating, review, status, is_favorite) 
VALUES 
(1, 'Inception', 'Sci-Fi', 9, 'Mind bending!', 'COMPLETED', true),
(1, 'Dark Knight', 'Action', 10, 'Masterpiece', 'COMPLETED', true),
(1, 'Dune 2', 'Sci-Fi', 8, 'Visual treat', 'PLAN_TO_WATCH', false);

INSERT INTO books (user_id, title, genre, rating, review, status, is_favorite) 
VALUES 
(1, 'Atomic Habits', 'Self-help', 9, 'Life changing', 'COMPLETED', true),
(1, 'Dune', 'Sci-Fi', 8, 'Classic', 'READING', false);

SELECT * FROM movies WHERE user_id = 1;
SELECT * FROM books WHERE user_id = 1;


-- ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
-- ## Key SQL Querys

SELECT * FROM movies WHERE user_id = $1 ORDER BY created_at DESC;

INSERT INTO movies (user_id, title, genre, rating, review, status) 
VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;

UPDATE movies 
SET rating = $1, review = $2, status = $3, is_favorite = $4 
WHERE id = $5 AND user_id = $6 RETURNING *;

DELETE FROM movies WHERE id = $1 AND user_id = $2;

SELECT * FROM movies WHERE user_id = $1 AND status = $2;

SELECT * FROM movies WHERE user_id = $1 AND title ILIKE $2;


-- ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
-- -- ## Quick Commands Reference

-- psql -d tracker_db -U tracker_user
-- \dt
-- \d movies

-- ## Delete all data (careful!)
TRUNCATE movies, books, users RESTART IDENTITY;


-- ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

