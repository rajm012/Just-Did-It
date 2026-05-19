

```
--------------------------------------------------------------------------------

Graphql: Query language for APIs, designed to allow clients to request exactly the data they need and nothing more. 
        It provides a more efficient and flexible alternative to REST APIs. By META. Runtime for executing those queries
        using a type system you define for your data. It allows clients to specify exactly what data they need, and the 
        server will return only that data, reducing over-fetching and under-fetching of data.  also supports 
        real-time updates through subscriptions, making it a powerful tool for building modern APIs.

--------------------------------------------------------------------------------

REST approach:
    /users/1 → gets user details
    /users/1/posts → gets their posts
    /users/1/followers → gets their followers   

GraphQL approach:
    {query {
        user(id: "1") {
            name
            email
            posts {
                title
                likes
            }
            followers {
                name
            }
        }
    }

--------------------------------------------------------------------------------

Feature	            What it does
Query	            Read/fetch data
Mutation	        Write/modify data (create, update, delete)
Subscription	    Real-time data using WebSockets
Strong typing	    Schema defines exactly what data types exist and what you can query
Single endpoint	    Unlike REST with many URLs,  uses one endpoint (e.g., /)
Introspection	    You can ask the API itself what queries it supports (auto-documentation)

--------------------------------------------------------------------------------

Over-fetching: Getting more data than you need (wastes bandwidth, slows apps).
        Example: REST returns 50 fields, but your UI only needs 3.

Under-fetching: Getting too little data, so you need multiple requests.
        Example: REST needs 3 round trips to get posts, user, and comments.

--------------------------------------------------------------------------------

Built-in Documentation:
        Because the schema is introspectable, tools like GraphiQL or Apollo Studio give you 
        live documentation and autocomplete.

--------------------------------------------------------------------------------

Aspect	            REST	                    
Data fetching	    Multiple endpoints	        One endpoint, flexible query
Data size	        Fixed by server	            Client specifies exact fields
Round trips	        Often multiple	            Usually one
Versioning	        New endpoint URLs	        Add fields to schema
Caching	            HTTP caching (simple)	    Requires client-side cache (Apollo, URQL)
File uploads	    Easy	                    Needs extra setup
Learning curve	    Gentle	                    Steeper initially

--------------------------------------------------------------------------------

SCHEMA DEFINITION ( SDL):
        type User {
            id: ID!
            name: String!
            email: String!
            posts: [Post!]!
        }
        type Post {
            id: ID!
            title: String!
            likes: Int
        }
        type Query {
            user(id: ID!): User
            posts(limit: Int): [Post!]!
        }
        type Mutation {
            createPost(title: String!): Post!
        }

--------------------------------------------------------------------------------

Backend resolvers(Node.js):
    const resolvers = {
        Query: {
            user: (parent, args) => db.findUserById(args.id),
        },
        User: {
            posts: (parent) => db.findPostsByUserId(parent.id),
        },
    };

--------------------------------------------------------------------------------

Common  tools & ecosystem:
    Apollo Client (React, Vue, iOS, Android)
    Relay (React, built by Facebook)
    URQL (lightweight alternative)
    GraphQL Yoga / Apollo Server (backend)
    Hasura (auto- from Postgres)
    GraphiQL (in-browser IDE to explore any  API)

--------------------------------------------------------------------------------

```


-- Command to create the database and user
-- 6 core concepts: Queries-Mutations-Variables-Fragments-Aliases-Directives


```
--------------------------------------------------------------------------------

## Basic Query Syntax

### Simple field request
            {
                user {
                    name
                    email
                }
            }


### With arguments
            {
                user(id: "123") {
                    name
                    email
                }
            }


### Nested fields
            {
                user(id: "123") {
                    name
                    email
                    posts {
                        title
                        likes
                        comments {
                            text
                            author
                        }
                    }
                }
            }


### Multiple top-level queries
            {
                user(id: "123") {
                    name
                }
                recentPosts(limit: 5) {
                    title
                    date
                }
            }

--------------------------------------------------------------------------------

## Operation Types & Names

Every  request is one of three operation types:
### Query (fetch data)
            query GetUser {
                user(id: "123") {
                    name
                    email
                }
            }


### Mutation (write data)
            mutation CreatePost {
                createPost(title: "Hello ", content: "Learning syntax") {
                    id
                    title
                    createdAt
                }
            }


### Subscription (real-time)
            subscription OnNewPost {
                newPost {
                    title
                    author
                }
            }


--------------------------------------------------------------------------------

## Variables (Making queries reusable)

### Define the query with $variableName
            query GetUser($userId: ID!) {
                user(id: $userId) {
                    name
                    email
                }
            }


### Send variables separately
            {
                "userId": "123"
            }

            -- With default values
            query GetUser($userId: ID! = "123") {
                user(id: $userId) {
                    name
                }
            }

            -- Multiple variables example
            query GetPaginatedPosts($userId: ID!, $limit: Int = 10, $offset: Int = 0) {
                user(id: $userId) {
                    posts(limit: $limit, offset: $offset) {
                    title
                    }
                }
            }

            -- Variables sent:
            {
                "userId": "456",
                "limit": 5
            }

--------------------------------------------------------------------------------

## Aliases (renaming fields)

            -- When you need the same field with different arguments:
            {
                post1: post(id: "1") {
                    title
                }
                post2: post(id: "2") {
                    title
                }
            }

            -- Response:
            {
                "data": {
                    "post1": { "title": "First post" },
                    "post2": { "title": "Second post" }
                }
            }

--------------------------------------------------------------------------------

## Fragments (reusable field sets)

### Without fragments (repetitive)
            {
                user1: user(id: "1") {
                    name
                    email
                    age
                }
                user2: user(id: "2") {
                    name
                    email
                    age
                }
            }


### With fragments (clean)
            fragment UserDetails on User {
                name
                email
                age
            }

            {
                user1: user(id: "1") {
                    ...UserDetails
                }
                user2: user(id: "2") {
                    ...UserDetails
                }
            }


### Fragments with nested fields
            fragment PostInfo on Post {
                title
                likes
                comments {
                    text
                    author
                }
            }

            fragment UserInfo on User {
                name
                posts {
                    ...PostInfo
                }
            }

            query {
                user(id: "123") {
                    ...UserInfo
                }
            }

--------------------------------------------------------------------------------

## Directives (conditional fields)

Include or exclude fields based on variables:
### @include - include field if true
            query GetUser($showEmail: Boolean!) {
                user(id: "123") {
                    name
                    email @include(if: $showEmail)
                }
            }

### @skip - skip field if true
            query GetUser($hideAge: Boolean!) {
                user(id: "123") {
                    name
                    age @skip(if: $hideAge)
                }
            }

--------------------------------------------------------------------------------


## Mutation Syntax (creating, updating, deleting)

### Create
        mutation CreateUser($name: String!, $email: String!) {
            createUser(input: { name: $name, email: $email }) {
                id
                name
                email
                createdAt
            }
        }

### Update
        mutation UpdatePost($postId: ID!, $newTitle: String!) {
            updatePost(id: $postId, title: $newTitle) {
                id
                title
                updatedAt
            }
        }

### Delete
        mutation DeleteComment($commentId: ID!) {
            deleteComment(id: $commentId) {
                success
                message
            }
        }

### Multiple mutations in one request (sequentially)
        mutation CreateUserAndPost($userName: String!, $postTitle: String!) {
            createUser(name: $userName) {
                id
                name
            }
            createPost(title: $postTitle, userId: $userId) {
                id
                title
            }
        }

They run sequentially. Second mutation can't use first mutation's result directly unless your schema supports it.

--------------------------------------------------------------------------------

## Input Types (complex arguments)

When you have many arguments, use an input object:
### Schema definition
            input UserInput {
                name: String!
                email: String!
                age: Int
                address: AddressInput
            }

            input AddressInput {
                street: String
                city: String
            }


### Mutation using input type
            mutation RegisterUser($userData: UserInput!) {
                registerUser(input: $userData) {
                    id
                    name
                }
            }


### Variables:
            {
                "userData": {
                    "name": "Alice",
                    "email": "alice@example.com",
                    "age": 30,
                    "address": {
                    "street": "123 Main St",
                    "city": "Metropolis"
                    }
                }
            }

--------------------------------------------------------------------------------

## Field Arguments (advanced)
Some fields can take arguments at any level, not just top-level:
            {
                user(id: "123") {
                    name
                    # Get only first 3 posts, sorted by likes
                    posts(limit: 3, sortBy: LIKES) {
                        title
                        likes
                        # Get first 2 comments of each post
                        comments(limit: 2) {
                            text
                        }
                    }
                }
            }

--------------------------------------------------------------------------------

## Example

### Fragment for reusable user fields
            fragment BasicUser on User {
                id
                name
                profilePicture(size: 100)
            }

### Fragment for post with conditional content
            fragment PostDetails on Post {
                id
                title
                createdAt
                likesCount
                comments(limit: $commentsLimit) {
                    ...CommentDetails
                }
            }

            fragment CommentDetails on Comment {
                id
                text
                author {
                    ...BasicUser
                }
            }

### Main query with variables
            query GetUserProfile(
                $userId: ID!, 
                $includePosts: Boolean = true,
                $postsLimit: Int = 5,
                $commentsLimit: Int = 3
                ) {
                user(id: $userId) {
                    ...BasicUser
                    email @include(if: $includeEmail)  # Assuming $includeEmail is defined
                    bio
                    
                    # Conditional posts
                    posts(limit: $postsLimit) @include(if: $includePosts) {
                        ...PostDetails
                    }
                    
                    followers(limit: 10) {
                        ...BasicUser
                    }
                }
            
                # Another unrelated query in same request
                siteStats {
                    totalUsers
                    totalPosts
                }
            }

--------------------------------------------------------------------------------

## Syntax 

| Element                   | Syntax                            |
|---------------------------|-----------------------------------|
| Query                     | query GetUser { ... }             |
| Mutation                  | mutation CreateUser { ... }       |
| Subscription              | subscription OnNewPost { ... }    |
| Variable                  | $userId: ID!                      |
| Alias                     | john: user(id: "john")            |
| Fragment                  | fragment Name on Type { fields }  |
| Include                   | email @include(if: $show)         |
| Skip                      | age @skip(if: $hide)              |
| Argument                  | posts(limit: 5)                   |
| Input object              | { name: "Alice", email: "..." }   |

--------------------------------------------------------------------------------

## Scalar types
    - Int - whole number
    - Float - decimal number
    - String - text
    - Boolean - true/false
    - ID - unique identifier
    - Custom scalars like DateTime, JSON, URL (defined by server)


## Missing operation name when using variables
    # Wrong
    query($id: ID!) { ... }

    # Correct
    query GetUser($id: ID!) { ... }


## Forgetting the ! for required variables
    # Wrong (id could be null)
    query GetUser($id: ID)

    # Correct (id must be provided)
    query GetUser($id: ID!)


## Mismatched types
    # Wrong: passing string where Int expected
    $limit: "5"   # should be 5 (no quotes)

    # Correct
    $limit: 5

--------------------------------------------------------------------------------

```
