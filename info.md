
# Just Did It

## Introduction

As a youth, We all love to explore multiple things and two most prominent ways to do the same is via Reading Books and Watching Movies.  Issue comes when we fail to keep track of content on basis of Completed-Planning-Dropped-Continuing, this app solves this problem. Here one can keep track of their movies/books along with their rating, personal notes and many more.

It's basically a logger but for hobbies.

"Just Did it" is a simple app make using the Expo-Go, React-Native, GrapghQL and PostgreSQL Made to store the info and other stuffs related to the movies watched or books read. Currently, we have very limited features with limited info to store but surely we can extend it to store much more info and stuffs.


## Requirements

### Tech Requirements
In general, for the whole app we have used the Javascript (JS) as a programming language, even for the DB's call as we are using the GraphQL then everything comes to the JS only. 

**Tech Stacks**
- Frontend: Expo Go + React-Native
- Database: Postgres
- API Layer: GraphQL
- Backend: Node + Express
- State Management: Apollo Client
- Authentication: JWT


### Functional Requirements
- User signup & login (JWT) & SignOut
- Add/Edit/Del movies and books
- Link movies to directors and books to authors (many-to-many)
- Favorites: mark/unmark items
- Filter by genres
- View all items by an author-director
- Manage authors + directors (add/update/delete)
- Detailed modals for movies/books/authors/directors with full info


## System Design

### Data Flow
- User interacts with Native UI
- Client send query-mutation to backend
- Server receives requests
- Validate that it's legitimate call
- Fxns execute the SQL queries
- DB returns the data
- Response is sent back
- Client now update the UI data


## DB Design

As I knew that I have to make this stuff in a limited timeframe so I do not have to add all the features so i selected which features to keep with a proper reason that why it should be there, so now I have the idea if what to make and this makes us clear of which datas I have to store and why (minimal storage).


### Table Definitions

Below is the basic DB structure:

```sql
CREATE TABLE users (
  id, username,
  mail, password,
);


CREATE TABLE movies (
  id, user_id,
  title, genre,
  rating, review, status,
);


CREATE TABLE books (
  id, user_id,
  title, genre,
  rating, review, status,
);
```

As my app involves users who will be stories their data related to books and tables with basic CRUD ops, so these simple tables will do the work.


### ER Diagram


            |--- [Movies]
[Users] ----|
            |--- [Books]



Users -> Movies [One to many]
Users -> Books  [One to many]

Users -> Movies [PK: id, FK: userID]
Users -> Books  [PK: id, FK: userID]


## Environment & Setup

Prerequisites
  - Node 18+ recommended
  - PostgreSQL database
  - Expo CLI for frontend (or use Expo Go)


### SetUps

1. **Database SetUp(ubuntu)**

```bash
sudp apt update
sudo apt install postgresql postgresql-contrib -y

sudo -u postgres psql
CREATE DATABASE tracker_db;
CREATE USER tracker_user WITH PASSWORD 'this123';
GRANT ALL PRIVILEGES ON DATABASE tracker_db TO tecker_user;

\q

psql -d tracker_db -U tracker_user -h localhost -W
# Now feed the postgresql cmds from above for tables+seeds
```


2. **Backend SetUp**

In Node+Express with empty template

```bash
mkdir backend
cd backend
npm install
node server.js

# now will create other files eventually
```

Keep these in the `.env` file:

```bash
DATABASE_URL=postgres://USER:PASS@HOST:PORT/DBNAME
JWT_SECRET=your_jwt_secret
PORT=4000
```


3. **Frontend SetUp**
Using Expo-go and react-native

- Configure API host in `frontend/App.js` means update `MYIP` of the machine/IP where the backend runs.

- Install and run
```bash
npx create-expo-app frontend --template blank
cd frontend
npm install
npx expo start

# now will create the files and so, and can run the expo as npx expo start and user arg --tunnel iff using ngrok to share the same

```
- Use Expo Go (emulator) to open the app.


### File Structure

```
backend/
- server.js
- schema.graphql
- .env
- node_modules/

frontend/
- App.js
- node_modules/
- screens/
    ├── AddEditScreen.js
    ├── AuthorDetailScreen.js
    ├── BooksScreen.js
    ├── DirectorDetailScreen.js
    ├── FavoritesScreen.js
    ├── GenreFilterScreen.js
    ├── LoginScreen.js
    ├── ManageAuthorsScreen.js
    ├── ManageDirectorsScreen.js
    ├── MoviesScreen.js
    └── SignupScreen.js
```

### Files Explained
- Backend GraphQL schema: `backend/schema.graphql`
- Backend server & resolvers: `backend/server.js`
- SQL setup scripts: `0-Postgres.sql, 1-GraphQL.sql`
- Frontend roots: `frontend/App.js, frontend/index.js`
- Frontend auths: `SignupScreen.js`, `LoginScreen.js`
- Other screens: `frontend/screens/`
  - `MoviesScreen.js` - List movies, Edit/Del, movie details
  - `BooksScreen.js` - List books, Edit/Del, book details
  - `AddEditScreen.js` - Add or Edit movie/book
  - `FavoritesScreen.js` - Favorites with tabs
  - `GenreFilterScreen.js` - Filter by one or multiple genres
  - `ManageAuthorsScreen.js / ManageDirectorsScreen.js` - CRUD for people
  - `AuthorDetailScreen.js / DirectorDetailScreen.js` - View Bibliography/Filmography


*(Visit these files to see the implementation details and much more.)*


## References

- [React Native](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [GraphQL](https://www.apollographql.com/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

- [GraphQL with Node.js](https://www.apollographql.com/docs/apollo-server/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [JWT Authentication](https://jwt.io/introduction)

- All the basic codes-snippets-fxns were written by me but to make error free and more professional, used some LLMs to format (not to write full code, just for formatting the unstructured code).


## Issues
- Always connect your laptop and mobile on the same WI-Fi Network to connect it efficiently
- We are using the `IP` in `frontend` to connect to backend, so whenever you disconnect from your Wi-Fi then your again need to find your IP
- Resolvers return `created_at` as ISO strings via `normalizeRow` in `backend`

