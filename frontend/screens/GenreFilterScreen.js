import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, ScrollView } from 'react-native';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { GENRES } from '../App';


const GET_MOVIES_BY_MULTIPLE_GENRES = gql`
  query GetMoviesByMultipleGenres($genres: [String!]!) {
    me{
      id
      moviesByMultipleGenres(genres: $genres) {
        id
        title
        genre
        rating
        review
        status
        is_favorite
        year
        runtime
        directors {
          id
          name
          country
        }
        created_at
      }
    }
  }
`;

const GET_BOOKS_BY_MULTIPLE_GENRES = gql`
  query GetBooksByMultipleGenres($genres: [String!]!) {
    me{
      id
      booksByMultipleGenres(genres: $genres) {
        id
        title
        genre
        rating
        review
        status
        is_favorite
        year
        pages
        authors {
          id
          name
          country
        }
        created_at
      }
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

export default function GenreFilterScreen({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('movies');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [genreModalVisible, setGenreModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const { data: moviesData, loading: moviesLoading, refetch: refetchMovies } = useQuery(
    GET_MOVIES_BY_MULTIPLE_GENRES,
    { variables: { genres: selectedGenres }, skip: selectedGenres.length === 0 }
  );
  
  const { data: booksData, loading: booksLoading, refetch: refetchBooks } = useQuery(
    GET_BOOKS_BY_MULTIPLE_GENRES,
    { variables: { genres: selectedGenres }, skip: selectedGenres.length === 0 }
  );
  
  const [updateMovieFavorite] = useMutation(UPDATE_MOVIE_FAVORITE);
  const [updateBookFavorite] = useMutation(UPDATE_BOOK_FAVORITE);

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } 
    else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const applyFilter = () => {
    if (selectedGenres.length === 0) {
      Alert.alert('Error', 'Please select at least one genre');
      return;
    }
    setGenreModalVisible(false);
    if (selectedTab === 'movies') {
      refetchMovies();
    } 
    else {
      refetchBooks();
    }
  };

  const toggleFavorite = async (item, type) => {
    if (type === 'movie') {
      await updateMovieFavorite({ variables: { id: item.id, is_favorite: !item.is_favorite } });
      refetchMovies();
    } 
    else {
      await updateBookFavorite({ variables: { id: item.id, is_favorite: !item.is_favorite } });
      refetchBooks();
    }
  };

  const clearAllFilters = () => {
    setSelectedGenres([]);
  };

  const isLoading = selectedTab === 'movies' ? moviesLoading : booksLoading;
  const currentData = selectedTab === 'movies'
  ? (moviesData?.me?.moviesByMultipleGenres || [])
  : (booksData?.me?.booksByMultipleGenres || []);

  const renderItem = ({ item, type }) => (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => setSelectedItem({ ...item, type })} activeOpacity={0.8}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{item.title}</Text>
          <TouchableOpacity onPress={() => toggleFavorite(item, type)}>
            <Ionicons 
              name={item.is_favorite ? "heart" : "heart-outline"} 
              size={24} 
              color={item.is_favorite ? "#FFD700" : "#ccc"} 
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.genreText}>Genre: {formatGenre(item.genre)}</Text>
        {type === 'movie' ? (
          item.directors && item.directors.length > 0 && (
            <Text style={styles.personText}>
              Director: {item.directors.map(d => d.name).join(', ')}
            </Text>
          )
        ) : (
          item.authors && item.authors.length > 0 && (
            <Text style={styles.personText}>
              Author: {item.authors.map(a => a.name).join(', ')}
            </Text>
          )
        )}
        {item.year && <Text>Year: {item.year}</Text>}
        {type === 'movie' && item.runtime && <Text>Runtime: {item.runtime} min</Text>}
        {type === 'book' && item.pages && <Text>Pages: {item.pages}</Text>}
        <Text>Rating: {item.rating || 'N/A'}/10</Text>
        <Text>Status: {item.status?.replaceAll('_', ' ') || 'N/A'}</Text>
        <Text style={styles.viewHint}>Tap to view details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Filter by Genre</Text>
      </View>
      <View style={styles.filterRow}>
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => setGenreModalVisible(true)}
        >
          <Ionicons name="filter" size={20} color="#fff" />
          <Text style={styles.filterButtonText}>Select Genres</Text>
        </TouchableOpacity>
        
        {selectedGenres.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearAllFilters}>
            <Ionicons name="close-circle" size={20} color="#fff" />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {selectedGenres.length > 0 && (
        <View style={styles.selectedGenresSection}>
          <Text style={styles.sectionTitle}>Active Filters:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
            {selectedGenres.map(genre => (
              <TouchableOpacity key={genre} style={styles.chip} onPress={() => toggleGenre(genre)}>
                <Text style={styles.chipText}>{genre} ✕</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, selectedTab === 'movies' && styles.activeTab]} 
          onPress={() => setSelectedTab('movies')}
        >
          <Text style={[styles.tabText, selectedTab === 'movies' && styles.activeTabText]}>
            Movies ({currentData.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, selectedTab === 'books' && styles.activeTab]} 
          onPress={() => setSelectedTab('books')}
        >
          <Text style={[styles.tabText, selectedTab === 'books' && styles.activeTabText]}>
            Books ({currentData.length})
          </Text>
        </TouchableOpacity>
      </View>

      {selectedGenres.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="albums-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No genre selected</Text>
          <Text style={styles.emptySubtext}>Tap "Select Genres" to choose genres to filter</Text>
        </View>
      ) : isLoading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.centerText}>Loading...</Text>
        </View>
      ) : currentData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="sad-outline" size={64} color="#ccc" />

          <Text style={styles.emptyText}>No items found</Text>

          <Text style={styles.emptySubtext}>
            No {selectedTab} found with selected genres
          </Text>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              if (selectedTab === 'movies') {
                refetchMovies();
              } else {
                refetchBooks();
              }
            }}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.refreshButtonText}>
              Refresh
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList 
          data={currentData} 
          renderItem={({ item }) => renderItem({ item, type: selectedTab === 'movies' ? 'movie' : 'book' })} 
          keyExtractor={(item) => `${selectedTab}-${item.id}`} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          onRefresh={selectedTab === 'movies' ? refetchMovies : refetchBooks}
          refreshing={isLoading}
        />
      )}

      <Modal visible={genreModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Genres to Filter</Text>
            <Text style={styles.modalSubtitle}>Choose one or more genres (OR logic)</Text>
            <FlatList
              data={GENRES}
              keyExtractor={(item) => item}
              renderItem={({ item: genre }) => (
                <TouchableOpacity 
                  style={[styles.genreOption, selectedGenres.includes(genre) && styles.genreOptionSelected]} 
                  onPress={() => toggleGenre(genre)}
                >
                  <Text style={[styles.genreOptionText, selectedGenres.includes(genre) && styles.genreOptionTextSelected]}>
                    {genre}
                  </Text>
                  {selectedGenres.includes(genre) && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              )}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.clearButton]} onPress={() => setSelectedGenres([])}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.applyButton]} onPress={applyFilter}>
                <Text style={styles.applyButtonText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
                  {selectedItem.directors.map((director) => (
                    <TouchableOpacity
                      key={director.id}
                      style={styles.personLink}
                      onPress={() => {
                        setSelectedItem(null);
                        navigation.navigate('DirectorDetail', {
                          directorId: director.id,
                          directorName: director.name,
                        });
                      }}
                    >
                      <Text style={styles.personLinkText}>
                        {director.name} {director.country ? `(${director.country})` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
              {selectedItem?.type === 'book' && selectedItem?.authors && selectedItem.authors.length > 0 && (
                <>
                  <Text style={styles.modalRow}>Author(s):</Text>
                  {selectedItem.authors.map((author) => (
                    <TouchableOpacity
                      key={author.id}
                      style={styles.personLink}
                      onPress={() => {
                        setSelectedItem(null);
                        navigation.navigate('AuthorDetail', {
                          authorId: author.id,
                          authorName: author.name,
                        });
                      }}
                    >
                      <Text style={styles.personLinkText}>
                        {author.name} {author.country ? `(${author.country})` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
              {selectedItem?.type === 'movie' && selectedItem?.year && (
                <Text style={styles.modalRow}>Year: {selectedItem.year}</Text>
              )}
              {selectedItem?.type === 'movie' && selectedItem?.runtime && (
                <Text style={styles.modalRow}>Runtime: {selectedItem.runtime} minutes</Text>
              )}
              {selectedItem?.type === 'book' && selectedItem?.year && (
                <Text style={styles.modalRow}>Year: {selectedItem.year}</Text>
              )}
              {selectedItem?.type === 'book' && selectedItem?.pages && (
                <Text style={styles.modalRow}>Pages: {selectedItem.pages}</Text>
              )}
              <Text style={styles.modalRow}>Rating: {selectedItem?.rating || 'N/A'}/10</Text>
              <Text style={styles.modalRow}>Status: {selectedItem?.status?.replaceAll('_', ' ') || 'N/A'}</Text>
              <Text style={styles.modalRow}>Favorite: {selectedItem?.is_favorite ? 'Yes' : 'No'}</Text>
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
  
  filterRow: { flexDirection: 'row', padding: 15, gap: 10 },
  filterButton: { flex: 1, backgroundColor: '#007AFF', padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  filterButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  clearButton: { backgroundColor: '#F44336', padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  clearButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  selectedGenresSection: { backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  chipContainer: { flexDirection: 'row' },
  chip: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
  chipText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 15, paddingTop: 10 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8, marginHorizontal: 5 },
  activeTab: { backgroundColor: '#007AFF' },
  tabText: { fontSize: 15, color: '#666', fontWeight: '500' },
  activeTabText: { color: '#fff', fontWeight: 'bold' },
  
  listContent: { padding: 15 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: 'bold', flex: 1, marginRight: 10 },
  genreText: { color: '#666', marginBottom: 5, fontSize: 14 },
  personText: { color: '#007AFF', marginBottom: 5, fontSize: 14 },
  viewHint: { marginTop: 8, color: '#007AFF', fontSize: 12, fontWeight: '500' },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#999', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centerText: { fontSize: 16, color: '#666' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%', maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 15, textAlign: 'center' },
  genreOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  genreOptionSelected: { backgroundColor: '#007AFF' },
  genreOptionText: { fontSize: 16, color: '#333' },
  genreOptionTextSelected: { color: '#fff', fontWeight: '500' },
  modalButtons: { flexDirection: 'row', marginTop: 15, gap: 10 },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  clearButton: { backgroundColor: '#f0f0f0' },
  clearButtonText: { color: '#666', fontWeight: 'bold' },
  applyButton: { backgroundColor: '#007AFF' },
  applyButtonText: { color: '#fff', fontWeight: 'bold' },
  
  modalCard: { width: '92%', height: '80%', backgroundColor: '#fff', borderRadius: 16, paddingTop: 46, paddingHorizontal: 18, paddingBottom: 18 },
  closeButton: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f1f1', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  closeButtonText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalContent: { paddingBottom: 12 },
  modalRow: { fontSize: 16, marginBottom: 10, color: '#333' },
  modalReview: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 14, backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8 },
  personLink: { marginBottom: 8, marginLeft: 10 },
  personLinkText: { color: '#007AFF', fontSize: 15, textDecorationLine: 'underline' },

  refreshButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10},
  refreshButtonText: { color: '#fff', marginLeft: 8, fontWeight: 'bold', fontSize: 16},
});

