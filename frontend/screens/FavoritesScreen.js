import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';

const GET_FAVORITE_MOVIES = gql`
  query GetFavoriteMovies {
    getFavoriteMovies {
      id
      title
      genre
      rating
      review
      status
      is_favorite
      year
      directors {
        id
        name
      }
      created_at
    }
  }
`;

const GET_FAVORITE_BOOKS = gql`
  query GetFavoriteBooks {
    getFavoriteBooks {
      id
      title
      genre
      rating
      review
      status
      is_favorite
      year
      authors {
        id
        name
      }
      created_at
    }
  }
`;

const UPDATE_MOVIE_FAVORITE = gql`
  mutation UpdateMovie($id: ID!, $is_favorite: Boolean!) {
    updateMovie(id: $id, is_favorite: $is_favorite) {
      id
      is_favorite
    }
  }
`;

const UPDATE_BOOK_FAVORITE = gql`
  mutation UpdateBook($id: ID!, $is_favorite: Boolean!) {
    updateBook(id: $id, is_favorite: $is_favorite) {
      id
      is_favorite
    }
  }
`;

const formatGenre = (genre) => {
  if (Array.isArray(genre)) return genre.join(', ');
  return genre || 'N/A';
};

const formatDateUTC = (val) => {
  if (!val) return 'N/A';
  if (typeof val === 'number') return new Date(val).toLocaleString();
  let s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) s = s.replace(' ', 'T');
  if (!/[zZ]|[+\-]\d{2}:\d{2}$/.test(s) && s.includes('T')) s = s + 'Z';
  const d = new Date(s);
  if (isNaN(d)) return 'Invalid date';
  return d.toLocaleString();
};

export default function FavoritesScreen({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('movies');
  const [selectedItem, setSelectedItem] = useState(null);
  
  const { data: moviesData, loading: moviesLoading, refetch: refetchMovies } = useQuery(GET_FAVORITE_MOVIES);
  const { data: booksData, loading: booksLoading, refetch: refetchBooks } = useQuery(GET_FAVORITE_BOOKS);
  const [updateMovieFavorite] = useMutation(UPDATE_MOVIE_FAVORITE);
  const [updateBookFavorite] = useMutation(UPDATE_BOOK_FAVORITE);

  const toggleFavorite = async (item, type) => {
    if (type === 'movie') {
      await updateMovieFavorite({ variables: { id: item.id, is_favorite: false } });
      refetchMovies();
    } else {
      await updateBookFavorite({ variables: { id: item.id, is_favorite: false } });
      refetchBooks();
    }
  };

  const renderMovieItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => setSelectedItem({ ...item, type: 'movie' })} activeOpacity={0.8}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{item.title}</Text>
          <TouchableOpacity onPress={() => toggleFavorite(item, 'movie')}>
            <Ionicons name="heart" size={24} color="#FFD700" />
          </TouchableOpacity>
        </View>
        <Text style={styles.genreText}>Genre: {formatGenre(item.genre)}</Text>
        {item.directors && item.directors.length > 0 && (
          <Text style={styles.directorText}>
            Director: {item.directors.map(d => d.name).join(', ')}
          </Text>
        )}
        {item.year && <Text>Year: {item.year}</Text>}
        <Text>Rating: {item.rating || 'N/A'}/10</Text>
        <Text style={styles.viewHint}>Tap to view details</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBookItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => setSelectedItem({ ...item, type: 'book' })} activeOpacity={0.8}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{item.title}</Text>
          <TouchableOpacity onPress={() => toggleFavorite(item, 'book')}>
            <Ionicons name="heart" size={24} color="#FFD700" />
          </TouchableOpacity>
        </View>
        <Text style={styles.genreText}>Genre: {formatGenre(item.genre)}</Text>
        {item.authors && item.authors.length > 0 && (
          <Text style={styles.authorText}>
            Author: {item.authors.map(a => a.name).join(', ')}
          </Text>
        )}
        {item.year && <Text>Year: {item.year}</Text>}
        <Text>Rating: {item.rating || 'N/A'}/10</Text>
        <Text style={styles.viewHint}>Tap to view details</Text>
      </TouchableOpacity>
    </View>
  );

  if (moviesLoading || booksLoading) return <Text style={styles.center}>Loading...</Text>;

  const movies = moviesData?.getFavoriteMovies || [];
  const books = booksData?.getFavoriteBooks || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Favorites</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'movies' && styles.activeTab]} 
          onPress={() => setSelectedTab('movies')}
        >
          <Text style={[styles.tabText, selectedTab === 'movies' && styles.activeTabText]}>
            Movies ({movies.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'books' && styles.activeTab]} 
          onPress={() => setSelectedTab('books')}
        >
          <Text style={[styles.tabText, selectedTab === 'books' && styles.activeTabText]}>
            Books ({books.length})
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'movies' ? (
        movies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No favorite movies</Text>
            <Text style={styles.emptySubtext}>Tap the heart on any movie to add it here</Text>
          </View>
        ) : (
          <FlatList 
            data={movies} 
            renderItem={renderMovieItem} 
            keyExtractor={(item) => `movie-${item.id}`} 
            onRefresh={refetchMovies}
            refreshing={moviesLoading}
            contentContainerStyle={styles.listContent}
          />
        )
      ) : (
        books.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No favorite books</Text>
            <Text style={styles.emptySubtext}>Tap the heart on any book to add it here</Text>
          </View>
        ) : (
          <FlatList 
            data={books} 
            renderItem={renderBookItem} 
            keyExtractor={(item) => `book-${item.id}`} 
            onRefresh={refetchBooks}
            refreshing={booksLoading}
            contentContainerStyle={styles.listContent}
          />
        )
      )}

      {/* Item Details Modal */}
      <Modal visible={!!selectedItem} animationType="slide" transparent onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedItem(null)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedItem?.title}</Text>
              <Text style={styles.modalRow}>Genre: {formatGenre(selectedItem?.genre)}</Text>
              
              {selectedItem?.type === 'movie' && selectedItem?.directors && selectedItem.directors.length > 0 && (
                <>
                  <Text style={styles.modalRow}>Director(s):</Text>
                  {selectedItem.directors.map((director, idx) => (
                    <TouchableOpacity 
                      key={idx}
                      style={styles.linkButton}
                      onPress={() => {
                        setSelectedItem(null);
                        navigation.navigate('DirectorDetail', { directorId: director.id, directorName: director.name });
                      }}
                    >
                      <Text style={styles.linkText}>{director.name}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
              
              {selectedItem?.type === 'book' && selectedItem?.authors && selectedItem.authors.length > 0 && (
                <>
                  <Text style={styles.modalRow}>Author(s):</Text>
                  {selectedItem.authors.map((author, idx) => (
                    <TouchableOpacity 
                      key={idx}
                      style={styles.linkButton}
                      onPress={() => {
                        setSelectedItem(null);
                        navigation.navigate('AuthorDetail', { authorId: author.id, authorName: author.name });
                      }}
                    >
                      <Text style={styles.linkText}>{author.name}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
              
              {selectedItem?.year && <Text style={styles.modalRow}>Year: {selectedItem.year}</Text>}
              {selectedItem?.runtime && <Text style={styles.modalRow}>Runtime: {selectedItem.runtime} minutes</Text>}
              {selectedItem?.pages && <Text style={styles.modalRow}>Pages: {selectedItem.pages}</Text>}
              <Text style={styles.modalRow}>Rating: {selectedItem?.rating || 'N/A'}/10</Text>
              <Text style={styles.modalRow}>Status: {selectedItem?.status?.replaceAll('_', ' ') || 'N/A'}</Text>
              <Text style={styles.modalRow}>Review:</Text>
              <Text style={styles.modalReview}>{selectedItem?.review || 'No review added yet.'}</Text>
              <Text style={styles.modalRow}>
                Added on: {formatDateUTC(selectedItem?.created_at)}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#007AFF', padding: 20, paddingTop: 15, paddingBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  center: { flex: 1, textAlign: 'center', marginTop: 50, fontSize: 18 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 15, paddingTop: 10 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8, marginHorizontal: 5 },
  activeTab: { backgroundColor: '#007AFF' },
  tabText: { fontSize: 15, color: '#666', fontWeight: '500' },
  activeTabText: { color: '#fff', fontWeight: 'bold' },
  listContent: { padding: 15 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 12, elevation: 2 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: 'bold', flex: 1, marginRight: 10 },
  genreText: { color: '#666', marginBottom: 3, fontSize: 14 },
  directorText: { color: '#007AFF', marginBottom: 3, fontSize: 14 },
  authorText: { color: '#007AFF', marginBottom: 3, fontSize: 14 },
  viewHint: { marginTop: 8, color: '#666', fontSize: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#999', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '92%', height: '80%', backgroundColor: '#fff', borderRadius: 16, paddingTop: 46, paddingHorizontal: 18, paddingBottom: 18 },
  closeButton: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f1f1', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  closeButtonText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalContent: { paddingBottom: 12 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 14 },
  modalRow: { fontSize: 16, marginBottom: 10, color: '#333' },
  modalReview: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 14, backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8 },
  linkButton: { marginBottom: 8, marginLeft: 10 },
  linkText: { color: '#007AFF', fontSize: 15, textDecorationLine: 'underline' },
});

