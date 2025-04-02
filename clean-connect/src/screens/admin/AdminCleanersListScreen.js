// src/screens/admin/AdminCleanersListScreen.js
import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, Pressable } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../../src/utils/theme'; 
import { fetchAllCleaners, verifyCleaner, selectAllCleaners, selectAdminLoading, selectAdminError, clearAdminError, clearAdminUpdateStatus, selectAdminUpdateStatus } from '../../redux/slices/adminSlice'; 
import Button from '../../components/common/Button';

const AdminCleanersListScreen = () => {
    const dispatch = useDispatch();
    const cleaners = useSelector(selectAllCleaners) || [];
    const isLoading = useSelector(selectAdminLoading);
    const error = useSelector(selectAdminError);
    const updateStatus = useSelector(selectAdminUpdateStatus);

    const [modalVisible, setModalVisible] = useState(false);
    const [cleanerToVerify, setCleanerToVerify] = useState(null); 

    console.log('[AdminScreen] Render - isLoading:', isLoading, 'error:', error, 'cleaners:', cleaners.length, 'updateStatus:', updateStatus);

    const loadCleaners = useCallback(() => {
        console.log('[AdminScreen] Dispatching fetchAllCleaners...');
        dispatch(clearAdminError());
        dispatch(clearAdminUpdateStatus());
        dispatch(fetchAllCleaners());
    }, [dispatch]);

    useEffect(() => {
        loadCleaners();
        return () => { dispatch(clearAdminUpdateStatus()); };
    }, [loadCleaners, dispatch]); 
    
    useEffect(() => {
        if (updateStatus === 'success') {
            Alert.alert("Succès", "Statut du cleaner mis à jour.");
            dispatch(clearAdminUpdateStatus()); 
        } else if (updateStatus === 'failed' && error) {
            Alert.alert("Erreur", `Mise à jour échouée: ${error}`);
            dispatch(clearAdminUpdateStatus());
            dispatch(clearAdminError());
        }
    }, [updateStatus, error, dispatch]);

    const openConfirmationModal = (cleanerId, action) => {
        console.log(`[AdminScreen] Opening modal for ID: ${cleanerId}, Action: ${action}`);
        setCleanerToVerify({ id: cleanerId, action: action });
        setModalVisible(true);
    };

    const handleConfirmAction = () => {
        if (!cleanerToVerify) return;
        const { id, action } = cleanerToVerify;
        const status = action === 'verify' ? 'verified' : 'rejected';
        console.log(`[AdminScreen] Dispatching verifyCleaner (${status}) for ID: ${id}`);
        dispatch(verifyCleaner({ cleanerId: id, status }));
        setModalVisible(false);
        setCleanerToVerify(null);
    };

    const handleCancelModal = () => {
        setModalVisible(false);
        setCleanerToVerify(null);
    };

    const renderItem = ({ item }) => {
        return (
            <View style={styles.itemContainer}>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item?.user?.firstName || 'Prénom?'} {item?.user?.lastName || 'Nom?'}</Text>
                    <Text style={styles.itemEmail}>{item?.user?.email || 'Email?'}</Text>
                    <Text style={typeof styles.itemStatus === 'function' ? styles.itemStatus(item?.verificationStatus) : styles.itemStatusDefault}>Statut: {item?.verificationStatus || 'N/A'}</Text>
                    <Text style={styles.itemSiret}>SIRET: {item?.businessDetails?.siret || 'Non fourni'}</Text>
                </View>
                <View style={styles.itemActions}>
                    {item?.verificationStatus !== 'verified' && (
                        <TouchableOpacity 
                            style={styles.actionButton} 
                            onPress={() => openConfirmationModal(item._id, 'verify')} 
                            disabled={updateStatus === 'pending'}
                         > 
                             <Ionicons name="checkmark-circle-outline" size={24} color={colors.success || 'green'} />
                        </TouchableOpacity>
                    )}
                     {item?.verificationStatus !== 'rejected' && (
                        <TouchableOpacity 
                            style={styles.actionButton} 
                            onPress={() => openConfirmationModal(item._id, 'reject')} 
                            disabled={updateStatus === 'pending'}
                         >
                             <Ionicons name="close-circle-outline" size={24} color={colors.error || 'red'} />
                        </TouchableOpacity>
                     )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Gestion des Cleaners</Text>
            
            {isLoading && cleaners.length === 0 ? (
                 <View style={styles.centeredStatus}><ActivityIndicator size="large" color={colors.primary || 'blue'} /><Text style={styles.statusText}>Chargement...</Text></View>
            ) : error ? (
                 <View style={styles.centeredStatus}><Text style={styles.errorText}>Erreur: {error}</Text></View>
            ) : (
                <FlatList
                    data={cleaners}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id || Math.random().toString()} 
                    refreshing={isLoading} 
                    onRefresh={loadCleaners} 
                    ListEmptyComponent={<View style={styles.centeredStatus}><Text style={styles.emptyText}>Aucun cleaner.</Text></View>}
                    contentContainerStyle={!cleaners || cleaners.length === 0 ? styles.emptyListContainer : {}}
                />
            )}

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={handleCancelModal}
            >
                <Pressable style={styles.modalOverlay} onPress={handleCancelModal}>
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}> 
                        <Text style={styles.modalTitle}>
                            {cleanerToVerify?.action === 'verify' ? "Confirmer Vérification" : "Confirmer Rejet"}
                        </Text>
                        <Text style={styles.modalMessage}>
                            Êtes-vous sûr de vouloir marquer ce professionnel comme 
                            {cleanerToVerify?.action === 'verify' ? " vérifié" : " rejeté"} ?
                        </Text>
                        <View style={styles.modalButtonContainer}>
                            {/* Correction: Utiliser type="outline" au lieu de textStyle */}
                            <Button 
                                title="Annuler" 
                                onPress={handleCancelModal} 
                                style={[styles.modalButton, styles.cancelButtonLayout]} // Garder style pour layout
                                type="outline" // Utiliser le type pour le style visuel
                            />
                            <Button 
                                title={cleanerToVerify?.action === 'verify' ? "Vérifier" : "Rejeter"}
                                onPress={handleConfirmAction}
                                // Appliquer le type 'danger' pour le bouton rejeter
                                type={cleanerToVerify?.action === 'reject' ? 'danger' : 'primary'}
                                style={[styles.modalButton]} // Garder style pour layout
                                loading={updateStatus === 'pending'}
                            />
                        </View>
                    </View>
                </Pressable>
            </Modal>

        </SafeAreaView>
    );
}

let styles = {};
try {
    styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background || '#f8f9fa' },
        title: { ...typography.h2, padding: spacing.md || 15, textAlign: 'center', borderBottomWidth:1, borderBottomColor: colors.border || '#eee', backgroundColor:'white' },
        errorText: { color: colors.error || 'red', textAlign: 'center' },
        emptyText: { textAlign: 'center', color: colors.textSecondary || 'grey' },
        centeredStatus: { flex: 1, alignItems:'center', justifyContent:'center', padding: spacing.md || 15 },
        statusText: { marginTop: spacing.sm || 10, color: colors.textSecondary || 'grey' },
        emptyListContainer: { flexGrow: 1, justifyContent: 'center' },
        itemContainer: { flexDirection: 'row', backgroundColor: 'white', padding: spacing.md || 15, marginVertical: spacing.xs || 5, marginHorizontal: spacing.md || 15, borderRadius: 8, alignItems:'center' },
        itemInfo: { flex: 1, marginRight: spacing.sm || 10 },
        itemName: { ...typography.h4, fontWeight: 'bold' },
        itemEmail: { ...typography.bodySmall, color: colors.textSecondary || 'grey' },
        itemStatus: (status) => ({ ...typography.bodySmall, fontWeight:'bold', marginTop: spacing.xs || 5, color: status === 'verified' ? (colors.success || 'green') : status === 'rejected' ? (colors.error || 'red') : (colors.warning || 'orange') }),
        itemStatusDefault: { ...typography.bodySmall, fontWeight:'bold', marginTop: spacing.xs || 5, color: colors.textSecondary || 'grey' },
        itemSiret: { ...typography.bodySmall, color: colors.textSecondary || 'grey', marginTop: spacing.xs || 5 },
        itemActions: { flexDirection: 'row' },
        actionButton: { padding: spacing.xs || 5, marginLeft: spacing.xs || 5 }, 
        modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
        modalContent: { backgroundColor: 'white', padding: spacing.lg || 20, borderRadius: 10, width: '85%', maxWidth: 400, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
        modalTitle: { ...typography.h3, fontWeight: 'bold', marginBottom: spacing.md || 15, textAlign: 'center' },
        modalMessage: { ...typography.body, textAlign: 'center', marginBottom: spacing.lg || 20, lineHeight: 22 },
        modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
        modalButton: { flex: 1, marginHorizontal: spacing.sm || 5 },
        cancelButtonLayout: { /* Plus besoin de styles ici si type='outline' suffit */ },
        // Style pour le bouton Rejeter (utilisera type='danger')
        // rejectConfirmButton: { backgroundColor: colors.error || 'red' }
    });
} catch(e) { 
    console.error("Style error AdminCleaners:", e); 
    styles=StyleSheet.create({ container:{flex:1}, title:{fontSize:18, padding:10}, errorText:{color:'red'}, emptyText:{}, statusText:{}, centeredStatus:{flex:1}, emptyListContainer:{}, itemContainer:{flexDirection:'row', padding:10, margin:5}, itemInfo:{flex:1}, itemName:{}, itemEmail:{}, itemStatusDefault:{}, itemSiret:{}, itemActions:{}, actionButton:{padding:5}, modalOverlay:{flex:1}, modalContent:{padding:20}, modalTitle:{fontSize:16}, modalMessage:{}, modalButtonContainer:{flexDirection:'row'}, modalButton:{flex:1, marginHorizontal:5}, cancelButtonLayout:{}, rejectConfirmButton:{} }); 
}

export default AdminCleanersListScreen;
