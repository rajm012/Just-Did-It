import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';

const GET_DIRECTOR_DETAILS = gql`
  query GetDirector($id: ID!) {
    getDirector(id: $id) {
      id
      name
      country
      birthYear
      movieCount
      movies {
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

export default function DirectorDetailScreen({ route, navigation }) {
  const { directorId, directorName } = route.params;
  const { data, loading } = useQuery(GET_DIRECTOR_DETAILS, {
    variables: { id: directorId }
  });

  if (loading) return <Text style={styles.center}>Loading...</Text>;

  const director = data?.getDirector;
  if (!director) return <Text style={styles.center}>Director not found</Text>;

  const renderMovie = ({ item }) => (
    <TouchableOpacity 
      style={styles.movieCard}
      onPress={() => navigation.navigate('AddEdit', { type: 'movie', item })}
    >
      <View style={styles.movieRow}>
        <Text style={styles.movieTitle}>{item.title}</Text>
        {item.is_favorite && <Ionicons name="heart" size={16} color="#FFD700" />}
      </View>
      <Text style={styles.movieInfo}>Genre: {formatGenre(item.genre)}</Text>
      {item.year && <Text style={styles.movieInfo}>Year: {item.year}</Text>}
      {item.rating && <Text style={styles.movieInfo}>Rating: {item.rating}/10</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{director.name}</Text>
        {director.country && <Text style={styles.country}>Country: {director.country}</Text>}
        {director.birthYear && <Text style={styles.birthYear}>Born: {director.birthYear}</Text>}
        <Text style={styles.movieCount}>Total Movies: {director.movieCount}</Text>
      </View>

      <Text style={styles.sectionTitle}>Filmography</Text>
      <FlatList
        data={director.movies}
        renderItem={renderMovie}
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
  movieCount: { fontSize: 14, color: '#007AFF', marginTop: 8, fontWeight: 'bold' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', padding: 15, backgroundColor: '#fff', marginTop: 10 },
  listContent: { padding: 15 },
  movieCard: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 2 },
  movieRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  movieTitle: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  movieInfo: { fontSize: 14, color: '#666', marginTop: 2 },
});

