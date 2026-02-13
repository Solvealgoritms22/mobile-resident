import { useToast } from '@/components/ui/Toast';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/translation-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

interface Comment {
    id: string;
    text: string;
    createdAt: string;
    author: {
        name: string;
        role: string;
        profileImage: string | null;
    };
}

interface Incident {
    id: string;
    type: string;
    description: string;
    status: string;
    createdAt: string;
    comments: Comment[];
}

interface IncidentDetailModalProps {
    visible: boolean;
    onClose: () => void;
    incident: Incident | null;
    onCommentAdded: () => void;
}

export function IncidentDetailModal({ visible, onClose, incident, onCommentAdded }: IncidentDetailModalProps) {
    const { t } = useTranslation();
    const { token, tenantChannel } = useAuth();
    const { showToast } = useToast();
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [displayComments, setDisplayComments] = useState<Comment[]>([]);

    useEffect(() => {
        if (incident) {
            setDisplayComments(incident.comments || []);
        }
    }, [incident]);

    useEffect(() => {
        if (!tenantChannel || !incident || !visible) return;

        const handleNewComment = (payload: { incidentReportId: string; comment: Comment }) => {
            if (payload.incidentReportId === incident.id) {
                setDisplayComments(prev => {
                    const exists = prev.some(c => c.id === payload.comment.id);
                    if (exists) return prev;
                    return [...prev, payload.comment];
                });
            }
        };

        tenantChannel.bind('commentAdded', handleNewComment);

        return () => {
            tenantChannel.unbind('commentAdded', handleNewComment);
        };
    }, [tenantChannel, incident, visible]);

    if (!incident) return null;

    const handleAddComment = async () => {
        if (!comment.trim()) return;

        setSubmitting(true);
        try {
            await axios.post(`${API_URL}/reports/${incident.id}/comments`, {
                text: comment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComment('');
            onCommentAdded();
        } catch (error) {
            console.error('Failed to add comment:', error);
            showToast(t('errorGeneric'), 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'OPEN': return '#ef4444';
            case 'INVESTIGATING': return '#f59e0b';
            case 'RESOLVED': return '#10b981';
            default: return '#64748b';
        }
    };

    const getImageUrl = (path?: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
        return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    };

    const DefaultAvatar = () => (
        <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Ionicons name="person" size={16} color="rgba(255,255,255,0.4)" />
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
            >
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>{t('incidentDetails')}</Text>
                            <Text style={styles.subtitle}>ID: {incident.id.slice(0, 8)}</Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#ffffff" />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                        <View style={styles.mainInfo}>
                            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(incident.status)}20`, borderColor: getStatusColor(incident.status) }]}>
                                <View style={[styles.statusDot, { backgroundColor: getStatusColor(incident.status) }]} />
                                <Text style={[styles.statusText, { color: getStatusColor(incident.status) }]}>{incident.status}</Text>
                            </View>
                            <Text style={styles.typeText}>{incident.type.replace('_', ' ')}</Text>
                            <Text style={styles.description}>{incident.description}</Text>
                            <Text style={styles.date}>{new Date(incident.createdAt).toLocaleString()}</Text>
                        </View>

                        <View style={styles.discussionHeader}>
                            <Ionicons name="chatbubbles-outline" size={20} color="#3b82f6" />
                            <Text style={styles.discussionTitle}>{t('discussion')} ({displayComments.length})</Text>
                        </View>

                        <View style={styles.commentsList}>
                            {displayComments.map((item) => (
                                <View key={item.id} style={styles.commentItem}>
                                    <View style={styles.commentHeader}>
                                        <View style={styles.authorInfo}>
                                            {item.author.profileImage ? (
                                                <Image
                                                    source={{ uri: getImageUrl(item.author.profileImage) ?? undefined }}
                                                    style={styles.avatar}
                                                    contentFit="cover"
                                                    placeholder={require('@/assets/images/icon.png')}
                                                    transition={200}
                                                />
                                            ) : (
                                                <DefaultAvatar />
                                            )}
                                            <View>
                                                <Text style={styles.authorName}>{item.author.name}</Text>
                                                <Text style={styles.authorRole}>{item.author.role}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.commentDate}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </View>
                                    <View style={styles.commentBubble}>
                                        <Text style={styles.commentText}>{item.text}</Text>
                                    </View>
                                </View>
                            ))}

                            {(!displayComments || displayComments.length === 0) && (
                                <View style={styles.emptyComments}>
                                    <Ionicons name="chatbox-outline" size={40} color="rgba(255,255,255,0.1)" />
                                    <Text style={styles.emptyText}>{t('noComments')}</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder={t('addCommentPlaceholder')}
                                placeholderTextColor="#64748b"
                                value={comment}
                                onChangeText={setComment}
                                multiline
                                keyboardType="default"
                            />
                            <Pressable
                                onPress={handleAddComment}
                                disabled={submitting || !comment.trim()}
                                style={[styles.sendButton, (!comment.trim() || submitting) && styles.sendButtonDisabled]}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Ionicons name="send" size={20} color="#ffffff" />
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    content: {
        height: '85%',
        backgroundColor: '#0f172a',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    subtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scroll: {
        flex: 1,
    },
    mainInfo: {
        marginBottom: 32,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    typeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: '#94a3b8',
        lineHeight: 24,
        marginBottom: 12,
    },
    date: {
        fontSize: 12,
        color: '#64748b',
    },
    discussionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    discussionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    commentsList: {
        gap: 20,
        paddingBottom: 40,
    },
    commentItem: {
        gap: 8,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    authorName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    authorRole: {
        fontSize: 10,
        color: '#3b82f6',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    commentDate: {
        fontSize: 10,
        color: '#64748b',
    },
    commentBubble: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: 20,
        borderTopLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    commentText: {
        fontSize: 14,
        color: '#e2e8f0',
        lineHeight: 20,
    },
    emptyComments: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    emptyText: {
        color: '#64748b',
        fontSize: 14,
    },
    footer: {
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        padding: 8,
        paddingLeft: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    input: {
        flex: 1,
        color: '#ffffff',
        fontSize: 14,
        maxHeight: 100,
        paddingTop: 12,
        paddingBottom: 12,
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#1e293b',
        opacity: 0.5,
    },
});
