import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';

const GET_AUTHOR_DETAILS = gql`
  query GetAuthor($id: ID!) {
    getAuthor(id: $id) {
      id
      name
      country
      birthYear
      bookCount
      books {
        id
        title
        year
        rating
        genre
        is_favorite
      }
      created_at
    }
  }
`;

const formatGenre = (genre) => {
  if (Array.isArray(genre)) return genre.join(', ');
  return genre || 'N/A';
};

export default function AuthorDetailScreen({ route, navigation }) {
  const { authorId, authorName } = route.params;
  const { data, loading } = useQuery(GET_AUTHOR_DETAILS, {
    variables: { id: authorId }
  });

  if (loading) return <Text style={styles.center}>Loading...</Text>;

  const author = data?.getAuthor;
  if (!author) return <Text style={styles.center}>Author not found</Text>;

  const renderBook = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookCard}
      onPress={() => navigation.navigate('AddEdit', { type: 'book', item })}
    >
      <View style={styles.bookRow}>
        <Text style={styles.bookTitle}>{item.title}</Text>
        {item.is_favorite && <Ionicons name="heart" size={16} color="#FFD700" />}
      </View>
      <Text style={styles.bookInfo}>Genre: {formatGenre(item.genre)}</Text>
      {item.year && <Text style={styles.bookInfo}>Year: {item.year}</Text>}
      {item.rating && <Text style={styles.bookInfo}>Rating: {item.rating}/10</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{author.name}</Text>
        {author.country && <Text style={styles.country}>Country: {author.country}</Text>}
        {author.birthYear && <Text style={styles.birthYear}>Born: {author.birthYear}</Text>}
        <Text style={styles.bookCount}>Total Books: {author.bookCount}</Text>
      </View>

      <Text style={styles.sectionTitle}>Bibliography</Text>
      <FlatList
        data={author.books}
        renderItem={renderBook}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, textAlign: 'center', marginTop: 50, fontSize: 18 },
  header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  name: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  country: { fontSize: 16, color: '#666', marginBottom: 4 },
  birthYear: { fontSize: 16, color: '#666', marginBottom: 4 },
  bookCount: { fontSize: 14, color: '#007AFF', marginTop: 8, fontWeight: 'bold' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', padding: 15, backgroundColor: '#fff', marginTop: 10 },
  listContent: { padding: 15 },
  bookCard: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 2 },
  bookRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bookTitle: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  bookInfo: { fontSize: 14, color: '#666', marginTop: 2 },
});

