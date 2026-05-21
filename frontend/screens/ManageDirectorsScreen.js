import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Modal } from 'react-native';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';


const GET_ALL_DIRECTORS = gql`
  query GetAllDirectors {
    getAllDirectors {
      id
      name
      country
      birthYear
    }
  }
`;

const ADD_DIRECTOR = gql`
  mutation AddDirector($name: String!, $country: String, $birthYear: Int) {
    addDirector(name: $name, country: $country, birthYear: $birthYear) {
      id
      name
      country
      birthYear
    }
  }
`;

const UPDATE_DIRECTOR = gql`
  mutation UpdateDirector($id: ID!, $name: String, $country: String, $birthYear: Int) {
    updateDirector(id: $id, name: $name, country: $country, birthYear: $birthYear) {
      id
      name
      country
      birthYear
    }
  }
`;

const DELETE_DIRECTOR = gql`
  mutation DeleteDirector($id: ID!) {
    deleteDirector(id: $id)
  }
`;

export default function ManageDirectorsScreen({ navigation }) {
  const { data, loading, refetch } = useQuery(GET_ALL_DIRECTORS);
  const [addDirector] = useMutation(ADD_DIRECTOR);
  const [updateDirector] = useMutation(UPDATE_DIRECTOR);
  const [deleteDirector] = useMutation(DELETE_DIRECTOR);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDirector, setEditingDirector] = useState(null);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [birthYear, setBirthYear] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    try {
      if (editingDirector) {
        await updateDirector({
          variables: {
            id: editingDirector.id,
            name: name.trim(),
            country: country.trim() || null,
            birthYear: birthYear ? parseInt(birthYear) : null
          }
        });
        Alert.alert('Success', 'Director updated');
      } 
      else {
        await addDirector({
          variables: {
            name: name.trim(),
            country: country.trim() || null,
            birthYear: birthYear ? parseInt(birthYear) : null
          }
        });
        Alert.alert('Success', 'Director added');
      }
      resetForm();
      refetch();
    } 
    catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDelete = (director) => {
    Alert.alert('Delete', `Delete ${director.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDirector({ variables: { id: director.id } });
          refetch();
        }
      }
    ]);
  };

  const resetForm = () => {
    setEditingDirector(null);
    setName('');
    setCountry('');
    setBirthYear('');
    setModalVisible(false);
  };

  const openEdit = (director) => {
    setEditingDirector(director);
    setName(director.name);
    setCountry(director.country || '');
    setBirthYear(director.birthYear?.toString() || '');
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <TouchableOpacity
          style={styles.cardContent}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('DirectorDetail', {
              directorId: item.id,
              directorName: item.name,
            })
          }
        >
          <Text style={styles.name}>{item.name}</Text>
          {item.country && <Text style={styles.detail}>📍 {item.country}</Text>}
          {item.birthYear && <Text style={styles.detail}>🎂 Born: {item.birthYear}</Text>}
          <Text style={styles.viewHint}>Tap to view movies</Text>
        </TouchableOpacity>
        <View style={styles.cardButtons}>
          <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
            <Ionicons name="pencil" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Ionicons name="trash" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) return <Text style={styles.center}>Loading...</Text>;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add Director</Text>
      </TouchableOpacity>

      <FlatList
        data={data?.getAllDirectors || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        onRefresh={refetch}
        refreshing={loading}
        contentContainerStyle={styles.list}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editingDirector ? 'Edit Director' : 'Add Director'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Name *"
              value={name}
              onChangeText={setName}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Country (e.g., United States)"
              value={country}
              onChangeText={setCountry}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Birth Year (e.g., 1970)"
              value={birthYear}
              onChangeText={setBirthYear}
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, textAlign: 'center', marginTop: 50, fontSize: 18 },
  addButton: {flexDirection: 'row', backgroundColor: '#007AFF', margin: 15, padding: 15, 
                borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 8},
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  list: { padding: 15 },
  card: { backgroundColor: '#fff', borderRadius: 8, marginBottom: 10, elevation: 2 },
  cardRow: { flexDirection: 'row', padding: 15, justifyContent: 'space-between', alignItems: 'center' },
  cardContent: { flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  detail: { fontSize: 14, color: '#666', marginTop: 2 },
  viewHint: { fontSize: 12, color: '#007AFF', marginTop: 8, fontWeight: '500' },
  cardButtons: { flexDirection: 'row', gap: 10 },
  editBtn: { backgroundColor: '#4CAF50', padding: 8, borderRadius: 6 },
  deleteBtn: { backgroundColor: '#F44336', padding: 8, borderRadius: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16 },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { color: '#666', fontWeight: 'bold' },
  saveBtn: { flex: 1, backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
});

