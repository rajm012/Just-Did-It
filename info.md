
# Just Did It

## Introduction

Just made to keep track of the Movies-Book which are not our primary task to do but we do the same to make ourselves feel better and elevate ourselves not in professional but in personal life space.

"Just Did it" is a simple app make using the expo-go, react-native, grapghQL and postgresql. Made to store the info and other stuffs related to the movies watched or books read. Currently, we have very limited features with limited info to store but surely we can extend it to store much more info and stuffs.

It's basically a logger but for hobbies.


## Requirements

### Tech Requirements
In general for the whole app we have used the Javascript(JS) for the same, even for the DB's call as we are using the GraphQL then everything comes to the JS only.

**Tech Stacks**
- Frontend: Expo Go + React-Native
- Database: Postgres
- API Layer: GraphQL
- Backend: Node + Express
- State Management: Apollo Client
- Authentication: JWT


To work on this, you should know just the basic syntax of the JS and have the architecture in your head and everything else can be deduced or done in a seemless manner.


### Functional Requirements
- SignUp
- Login
- Add a book-movie
- Update a book-movie
- Delete a book-movie


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


## Implementation

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

npm init -y

npm install @apollo/server express graphql pg dotenv bcrypt jsonwebtoken cors

npm install -D nodemon

# Now create the file .env and put variables like 'DATABASE_URL', 'PORT', 'JWT_SECRET' in it
# now will create other files eventually
```


3. **Frontend SetUp**
Using Expo-go and react-native

```bash
npx create-expo-app frontend --template blank
cd frotend

npm install @apollo/client graphql @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs @react-native-async-storage/async-storage

npx expo install react-native-screens react-native-safe-area-context expo-vector-icons


# now will create the files and so
# and can run the expo as npx expo start and user arg --tunnel iff using ngrok to share the same

```


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
    - LoginScreen.js
    - SignupScreen.js
    - MoviesScreen.js
    - BooksScreen.js
    - AddEidtScreen.js
```


## References

- [React Native](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [GraphQL](https://www.apollographql.com/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

- [GraphQL with Node.js](https://www.apollographql.com/docs/apollo-server/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [JWT Authentication](https://jwt.io/introduction)

- All the basic codes-snippets-fxns were written by me but to make error free and more professional, used some LLMs to format (not to write full code, just for formatting the unstructured code).


