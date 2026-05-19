import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, ScrollView } from 'react-native';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

const GET_MOVIES = gql`
  query GetMyMovies {
    getMyMovies {
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

const formatDateUTC = (val) => {
  if (!val) return 'N/A';
  if (typeof val === 'number') return new Date(val).toLocaleString();
  let s = String(val).trim();
  // convert `YYYY-MM-DD HH:mm:SS` to ISO `YYYY-MM-DDTHH:mm:SS`
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) s = s.replace(' ', 'T');
  // if no timezone present, treat as UTC by appending 'Z'
  if (!/[zZ]|[+\-]\d{2}:\d{2}$/.test(s) && s.includes('T')) s = s + 'Z';
  const d = new Date(s);
  if (isNaN(d)) return 'Invalid date';
  return d.toLocaleString();
};

const DELETE_MOVIE = gql`
  mutation DeleteMovie($id: ID!) {
    deleteMovie(id: $id)
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

export default function MoviesScreen({ navigation }) {
  const { data, loading, refetch } = useQuery(GET_MOVIES);
  const [deleteMovie] = useMutation(DELETE_MOVIE);
  const [updateMovieFavorite] = useMutation(UPDATE_MOVIE_FAVORITE);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMovie({ variables: { id } });
          refetch();
        },
      },
    ]);
  };

  const toggleFavorite = async (item) => {
    await updateMovieFavorite({ 
      variables: { 
        id: item.id, 
        is_favorite: !item.is_favorite 
      } 
    });
    refetch();
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => setSelectedMovie(item)} activeOpacity={0.8}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{item.title}</Text>
          <TouchableOpacity onPress={() => toggleFavorite(item)}>
            <Text style={{ fontSize: 24, color: item.is_favorite ? '#FFD700' : '#ccc' }}>
              {item.is_favorite ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text>Genre: {Array.isArray(item.genre) ? item.genre.join(', ') : item.genre || 'N/A'}</Text>
        <Text>Rating: {item.rating || 'N/A'}/10</Text>
        <Text>Status: {item.status.replaceAll('_', ' ')}</Text>
        <Text style={styles.viewHint}>Tap to view details</Text>
      </TouchableOpacity>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('AddEdit', { type: 'movie', item })}>
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <Text style={styles.center}>Loading...</Text>;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddEdit', { type: 'movie' })}>
        <Text style={styles.addButtonText}>+ Add Movie</Text>
      </TouchableOpacity>
      <FlatList 
        data={data?.getMyMovies || []} 
        renderItem={renderItem} 
        keyExtractor={(item) => item.id.toString()} 
        onRefresh={refetch} 
        refreshing={loading} 
      />

      <Modal visible={!!selectedMovie} animationType="slide" transparent onRequestClose={() => setSelectedMovie(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedMovie(null)}>
              <Text style={styles.closeButtonText}>x</Text>
            </TouchableOpacity>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedMovie?.title}</Text>
              <Text style={styles.modalRow}>Genre: {selectedMovie?.genre ? (Array.isArray(selectedMovie.genre) ? selectedMovie.genre.join(', ') : selectedMovie.genre) : 'N/A'}</Text>
              <Text style={styles.modalRow}>Rating: {selectedMovie?.rating || 'N/A'}/10</Text>
              <Text style={styles.modalRow}>Status: {selectedMovie?.status?.replaceAll('_', ' ') || 'N/A'}</Text>
              <Text style={styles.modalRow}>Favorite: {selectedMovie?.is_favorite ? 'Yes' : 'No'}</Text>
              <Text style={styles.modalRow}>Review:</Text>
              <Text style={styles.modalReview}>{selectedMovie?.review || 'No review added yet.'}</Text>
              <Text style={styles.modalRow}>
                Added on: {formatDateUTC(selectedMovie?.created_at)}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  center: { flex: 1, textAlign: 'center', marginTop: 50, fontSize: 18 },
  addButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 2 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  viewHint: { marginTop: 8, color: '#666', fontSize: 12 },
  buttonRow: { flexDirection: 'row', marginTop: 10, gap: 10 },
  editButton: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 6, flex: 1, alignItems: 'center' },
  deleteButton: { backgroundColor: '#F44336', padding: 10, borderRadius: 6, flex: 1, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '92%', height: '80%', backgroundColor: '#fff', borderRadius: 16, paddingTop: 46, paddingHorizontal: 18, paddingBottom: 18 },
  closeButton: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f1f1', justifyContent: 'center', alignItems: 'center' },
  closeButtonText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalContent: { paddingBottom: 12 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 14 },
  modalRow: { fontSize: 16, marginBottom: 10, color: '#333' },
  modalReview: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 14 },
});

