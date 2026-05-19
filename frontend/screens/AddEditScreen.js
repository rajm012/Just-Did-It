import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { GENRES } from '../App';

const ADD_MOVIE = gql`
  mutation AddMovie($title: String!, $genre: [String!]!, $rating: Int, $review: String, $status: String!) {
    addMovie(title: $title, genre: $genre, rating: $rating, review: $review, status: $status) {
      id
    }
  }
`;

const UPDATE_MOVIE = gql`
  mutation UpdateMovie($id: ID!, $genre: [String!], $rating: Int, $review: String, $status: String, $is_favorite: Boolean) {
    updateMovie(id: $id, genre: $genre, rating: $rating, review: $review, status: $status, is_favorite: $is_favorite) {
      id
    }
  }
`;

const ADD_BOOK = gql`
  mutation AddBook($title: String!, $genre: [String!]!, $rating: Int, $review: String, $status: String!) {
    addBook(title: $title, genre: $genre, rating: $rating, review: $review, status: $status) {
      id
    }
  }
`;

const UPDATE_BOOK = gql`
  mutation UpdateBook($id: ID!, $genre: [String!], $rating: Int, $review: String, $status: String, $is_favorite: Boolean) {
    updateBook(id: $id, genre: $genre, rating: $rating, review: $review, status: $status, is_favorite: $is_favorite) {
      id
    }
  }
`;

export default function AddEditScreen({ route, navigation }) {
  const { type, item } = route.params || {};
  const isEdit = !!item;
  const statusOptions = type === 'book'
    ? ['COMPLETED', 'READING', 'PLAN_TO_READ', 'DROPPED']
    : ['COMPLETED', 'WATCHING', 'PLAN_TO_WATCH', 'DROPPED'];
  
  const [title, setTitle] = useState(item?.title || '');
  
  const initialGenre = item?.genre 
    ? (Array.isArray(item.genre) ? item.genre : [item.genre])
    : [];
  const [selectedGenres, setSelectedGenres] = useState(initialGenre);
  const [genreModalVisible, setGenreModalVisible] = useState(false);

  const [rating, setRating] = useState(item?.rating?.toString() || '');
  const [review, setReview] = useState(item?.review || '');
  const [status, setStatus] = useState(item?.status || 'COMPLETED');

  const [addMovie] = useMutation(ADD_MOVIE);
  const [updateMovie] = useMutation(UPDATE_MOVIE);
  const [addBook] = useMutation(ADD_BOOK);
  const [updateBook] = useMutation(UPDATE_BOOK);

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    if (selectedGenres.length === 0) {
      Alert.alert('Error', 'Please select at least one genre');
      return;
    }

    const ratingInt = rating ? parseInt(rating) : null;
    if (rating && (ratingInt < 1 || ratingInt > 10)) {
      Alert.alert('Error', 'Rating must be between 1 and 10');
      return;
    }

    try {
      if (type === 'movie') {
        if (isEdit) {
          await updateMovie({ variables: { id: item.id, genre: selectedGenres, rating: ratingInt, review: review || null, status } });
        } else {
          await addMovie({ variables: { title, genre: selectedGenres, rating: ratingInt, review: review || null, status } });
        }
      } else {
        if (isEdit) {
          await updateBook({ variables: { id: item.id, genre: selectedGenres, rating: ratingInt, review: review || null, status } });
        } else {
          await addBook({ variables: { title, genre: selectedGenres, rating: ratingInt, review: review || null, status } });
        }
      }
      navigation.goBack();
    } 
    catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Title *</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Enter title" />

      <Text style={styles.label}>Genre(s)</Text>
      <TouchableOpacity style={styles.genreSelector} onPress={() => setGenreModalVisible(true)}>
        <Text style={styles.genreSelectorText}>
          {selectedGenres.length > 0 ? selectedGenres.join(', ') : 'Select genres...'}
        </Text>
      </TouchableOpacity>

      {selectedGenres.length > 0 && (
        <View style={styles.selectedGenresContainer}>
          {selectedGenres.map(genre => (
            <TouchableOpacity key={genre} style={styles.genreChip} onPress={() => toggleGenre(genre)}>
              <Text style={styles.genreChipText}>{genre} ✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}


      <Text style={styles.label}>Rating (1-10)</Text>
      <TextInput style={styles.input} value={rating} onChangeText={setRating} placeholder="e.g., 8" keyboardType="numeric" />

      <Text style={styles.label}>Review</Text>
      <TextInput style={[styles.input, styles.textArea]} value={review} onChangeText={setReview} placeholder="Your thoughts..." multiline numberOfLines={4} />

      <Text style={styles.label}>Status</Text>
      <View style={styles.statusContainer}>
        {statusOptions.map((s) => (
          <TouchableOpacity 
            key={s} 
            style={[styles.statusButton, status === s && styles.statusActive]} 
            onPress={() => setStatus(s)}
          >
            <Text style={[styles.statusText, status === s && styles.statusTextActive]}>{s.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>{isEdit ? 'Update' : 'Add'} {type}</Text>
      </TouchableOpacity>
      
      <Modal visible={genreModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Genres</Text>
            <FlatList data={GENRES} keyExtractor={(item) => item} renderItem={({ item: genre }) => (
                <TouchableOpacity 
                  style={[styles.genreOption, selectedGenres.includes(genre) && styles.genreOptionSelected]} 
                  onPress={() => toggleGenre(genre)}
                >
                  <Text style={[styles.genreOptionText, selectedGenres.includes(genre) && styles.genreOptionTextSelected]}>
                    {genre}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.doneButton} onPress={() => setGenreModalVisible(false)}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  genreSelector: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, backgroundColor: '#f9f9f9' },
  genreSelectorText: { fontSize: 16, color: '#333' },
  selectedGenresContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  genreChip: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8 },
  genreChipText: { color: '#fff', fontSize: 14 },
  statusContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  statusButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e0e0e0', marginRight: 10, marginBottom: 10 },
  statusActive: { backgroundColor: '#007AFF' },
  statusText: { color: '#333' },
  statusTextActive: { color: '#fff' },
  submitButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 8, alignItems: 'center', marginVertical: 20 },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%', maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  genreOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  genreOptionSelected: { backgroundColor: '#007AFF' },
  genreOptionText: { fontSize: 16, color: '#333' },
  genreOptionTextSelected: { color: '#fff' },
  doneButton: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, marginTop: 15, alignItems: 'center' },
  doneButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});


