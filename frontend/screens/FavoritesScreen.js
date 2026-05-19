import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, ScrollView } from 'react-native';
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
  const { data: moviesData, loading: moviesLoading, refetch: refetchMovies } = useQuery(GET_FAVORITE_MOVIES);
  const { data: booksData, loading: booksLoading, refetch: refetchBooks } = useQuery(GET_FAVORITE_BOOKS);
  const [updateMovieFavorite] = useMutation(UPDATE_MOVIE_FAVORITE);
  const [updateBookFavorite] = useMutation(UPDATE_BOOK_FAVORITE);
  const [selectedItem, setSelectedItem] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const toggleFavorite = async (item, type) => {
    if (type === 'movie') {
      await updateMovieFavorite({ variables: { id: item.id, is_favorite: false } });
      refetchMovies();
    } else {
      await updateBookFavorite({ variables: { id: item.id, is_favorite: false } });
      refetchBooks();
    }
  };

  const renderItem = ({ item, type }) => (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => setSelectedItem({ ...item, type })} activeOpacity={0.8}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{item.title}</Text>
          <TouchableOpacity onPress={() => toggleFavorite(item, type)}>
            <Ionicons name="heart" size={24} color="#FFD700" />
          </TouchableOpacity>
        </View>
        <Text>Genre: {Array.isArray(item.genre) ? item.genre.join(', ') : item.genre || 'N/A'}</Text>
        <Text>Rating: {item.rating || 'N/A'}/10</Text>
        <Text>Status: {item.status?.replaceAll('_', ' ') || 'N/A'}</Text>
        <Text style={styles.viewHint}>Tap to view details</Text>
      </TouchableOpacity>
    </View>
  );

  if (moviesLoading || booksLoading) return <Text style={styles.center}>Loading...</Text>;

  const movies = moviesData?.getFavoriteMovies || [];
  const books = booksData?.getFavoriteBooks || [];
  const currentData = selectedTab === 'movies' ? movies : books;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (selectedTab === 'movies') await refetchMovies();
      else await refetchBooks();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'movies' && styles.activeTab]} 
          onPress={() => setSelectedTab('movies')}
        >
          <Text style={[styles.tabText, selectedTab === 'movies' && styles.activeTabText]}>Movies ({movies.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'books' && styles.activeTab]} 
          onPress={() => setSelectedTab('books')}
        >
          <Text style={[styles.tabText, selectedTab === 'books' && styles.activeTabText]}>Books ({books.length})</Text>
        </TouchableOpacity>
      </View>

      <FlatList 
        data={currentData}
        renderItem={({ item }) => renderItem({ item, type: selectedTab === 'movies' ? 'movie' : 'book' })}
        keyExtractor={(item) => `${selectedTab}-${item.id}`}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No favorites yet</Text>
            <Text style={styles.emptySubtext}>Tap the star on any movie or book to add it here</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={!!selectedItem} animationType="slide" transparent onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedItem(null)}>
              <Text style={styles.closeButtonText}>x</Text>
            </TouchableOpacity>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedItem?.title}</Text>
              <Text style={styles.modalRow}>Genre: {selectedItem?.genre ? (Array.isArray(selectedItem.genre) ? selectedItem.genre.join(', ') : selectedItem.genre) : 'N/A'}</Text>
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
  center: { flex: 1, textAlign: 'center', marginTop: 50, fontSize: 18 },
  tabContainer: { flexDirection: 'row', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#007AFF' },
  tabText: { fontSize: 16, color: '#666' },
  activeTabText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginHorizontal: 20, marginBottom: 10, elevation: 2 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  title: { fontSize: 18, fontWeight: 'bold' },
  viewHint: { marginTop: 8, color: '#666', fontSize: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#999', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '92%', height: '80%', backgroundColor: '#fff', borderRadius: 16, paddingTop: 46, paddingHorizontal: 18, paddingBottom: 18 },
  closeButton: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f1f1', justifyContent: 'center', alignItems: 'center' },
  closeButtonText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalContent: { paddingBottom: 12 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 14 },
  modalRow: { fontSize: 16, marginBottom: 10, color: '#333' },
  modalReview: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 14 },
  refreshButton: { marginTop: 16, backgroundColor: '#007AFF', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  refreshButtonText: { color: '#fff', fontWeight: 'bold' },
});

