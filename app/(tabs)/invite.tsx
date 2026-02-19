import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/translation-context';
import { visitService } from '@/services/visitService';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';

export default function InviteScreen() {
    const { user, token } = useAuth();
    const { showToast } = useToast();
    const { t, language } = useTranslation();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [visitorName, setVisitorName] = useState('');
    const [visitorId, setVisitorId] = useState('');
    const [plate, setPlate] = useState('');
    const [duration, setDuration] = useState('4');
    const [loading, setLoading] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [companions, setCompanions] = useState('0');
    const [image, setImage] = useState<string | null>(null);
    const [assignedSpaces, setAssignedSpaces] = useState<any[]>([]);
    const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
    const [isVip, setIsVip] = useState(false);
    const [isSingleEntry, setIsSingleEntry] = useState(false);
    const [category, setCategory] = useState<string>('FAMILIAR');
    const viewRef = useRef<View>(null);

    const formatDuration = (hours: string) => {
        const h = parseInt(hours);
        if (isNaN(h)) return hours;

        if (h === 876000) return t('indefinite');
        // Check for months first if specific values match, 
        // otherwise general logic for days/hours
        if (h === 720) return `1 ${t('month')}`;
        if (h === 2160) return `3 ${t('months')}`;

        if (h >= 24) {
            // If exactly divisible by 24, show as days
            if (h % 24 === 0) {
                const days = Math.floor(h / 24);
                return `${days} ${days === 1 ? t('day') : t('days')}`;
            }
        }

        return `${h} ${t('hoursAbbr')}`;
    };

    React.useEffect(() => {
        if (step === 1) {
            fetchProfile();
        }
    }, [step]);

    const fetchProfile = async () => {
        try {
            const response = await axios.get(`${API_URL}/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data?.residentProfile?.assignedSpaces) {
                setAssignedSpaces(response.data.residentProfile.assignedSpaces);
            }
        } catch (error) {
            console.error('Error fetching profile for spaces:', error);
        }
    };

    const requestPermissions = async () => {
        if (Platform.OS !== 'web') {
            const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
            const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (cameraStatus.status !== 'granted' || libraryStatus.status !== 'granted') {
                Alert.alert('Permission Denied', 'We need camera and library permissions to upload images.');
                return false;
            }
        }
        return true;
    };

    const pickImage = async (useCamera: boolean) => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        let result;
        if (useCamera) {
            result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.4,
                base64: true,
            });
        } else {
            result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.3,
                base64: true,
            });
        }

        if (!result.canceled) {
            setImage('data:image/jpeg;base64,' + result.assets[0].base64);
        }
    };

    const handleImagePress = () => {
        Alert.alert(
            t('identityPhoto'),
            t('helpPrompt'),
            [
                { text: t('takePhoto'), onPress: () => pickImage(true) },
                { text: t('chooseGallery'), onPress: () => pickImage(false) },
                { text: t('cancel'), style: 'cancel' }
            ]
        );
    };

    const handleCreate = async () => {
        if (!visitorName) {
            showToast(t('enterName'), 'error');
            return;
        }
        setLoading(true);
        try {
            const validFrom = new Date();
            const validUntil = new Date(Date.now() + parseInt(duration) * 60 * 60 * 1000);

            const visitData = {
                hostId: user?.id,
                visitorName,
                visitorIdNumber: visitorId || 'N/A',
                licensePlate: plate || undefined,
                validFrom: validFrom.toISOString(),
                validUntil: validUntil.toISOString(),
                companionCount: parseInt(companions) || 0,
                spaceId: selectedSpaceId || undefined,
                images: image ? JSON.stringify([image]) : undefined,
                isVip: isVip,
                singleEntry: isSingleEntry,
                category,
            };

            const data = await visitService.createVisit(visitData);

            setQrCode(data.qrCode);
            setAccessCode(data.accessCode);
            showToast(t('visitCreated'), 'success');
            setStep(2);
        } catch (error: any) {
            console.error('Visit Creation Error:', error);
            showToast(error.response?.data?.message || t('failedCreateVisit'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        const formattedDuration = formatDuration(duration);
        const orgName = user?.organizationName || 'ENTRAR';
        const subject = `${t('shareSubject')} ${orgName}*`;

        const message = `${subject}\n\n${t('shareGreeting')} ${visitorName || t('friend')},\n\n${t('shareBody')}\n\n*${t('shareAccessCode')}:* ${accessCode}\n*${t('shareDuration')}:* ${formattedDuration}\n\n${t('shareInstructions')}\n\n${t('shareClosing')}`;

        try {
            if (viewRef.current) {
                const uri = await captureRef(viewRef, {
                    format: 'png',
                    quality: 0.8,
                });

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, {
                        mimeType: 'image/png',
                        dialogTitle: subject.replace(/\*/g, ''),
                        UTI: 'public.png',
                    });
                } else {
                    // Fallback for web or unsupported
                    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
                    await Linking.openURL(url);
                }
            } else {
                // Fallback if viewRef is not set
                const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
                await Linking.openURL(url);
            }
        } catch (error) {
            console.error('Failed to capture or share:', error);
            const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
            await Linking.openURL(url);
        }
    };

    if (step === 2) {
        return (
            <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
                <ScrollView
                    contentContainerStyle={{ padding: 24, alignItems: 'center', paddingTop: 80, paddingBottom: 180 }}
                    showsVerticalScrollIndicator={false}
                >
                    <BlurView intensity={80} tint="dark" style={styles.successIconBlur}>
                        <View style={styles.successIcon}>
                            <Ionicons name="checkmark" size={40} color="#ffffff" />
                        </View>
                    </BlurView>
                    <Text style={styles.successTitle}>{t('invitationCreated')}</Text>
                    <Text style={styles.successSubtitle}>
                        {t('validFor')} {formatDuration(duration)}
                    </Text>

                    <View
                        ref={viewRef}
                        collapsable={false}
                        style={{
                            width: '100%',
                            alignItems: 'center',
                            backgroundColor: '#ffffff',
                            padding: 24,
                            borderRadius: 16,
                            marginTop: 20
                        }}
                    >
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 }}>
                            {t('shareSubject').replace(/\*/g, '')} {user?.organizationName || 'ENTRAR'}
                        </Text>
                        <Text style={{ fontSize: 16, color: '#334155', marginBottom: 24 }}>
                            {t('shareGreeting')} {visitorName || t('friend')}
                        </Text>

                        <QRCode
                            value={qrCode || JSON.stringify({ name: visitorName, plate, valid: true })}
                            size={200}
                            backgroundColor="transparent"
                            color="#0f172a"
                        />

                        <View style={{ marginTop: 24, alignItems: 'center', width: '100%' }}>
                            <Text style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' }}>
                                {t('manualEntryCode')}
                            </Text>
                            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#0f172a', marginVertical: 4 }}>
                                {accessCode}
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
                            <View>
                                <Text style={{ fontSize: 12, color: '#64748b' }}>{t('visitorName')}</Text>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>{visitorName}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 12, color: '#64748b' }}>{t('shareDuration')}</Text>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>{formatDuration(duration)}</Text>
                            </View>
                        </View>

                        {plate && (
                            <View style={{ width: '100%', marginTop: 16 }}>
                                <Text style={{ fontSize: 12, color: '#64748b' }}>{t('vehiclePlate')}</Text>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>{plate}</Text>
                            </View>
                        )}

                        <Text style={{ marginTop: 24, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                            {t('shareInstructions')}
                        </Text>

                        <Text style={{ marginTop: 8, textAlign: 'center', color: '#64748b', fontSize: 14, fontStyle: 'italic' }}>
                            {t('shareClosing')}
                        </Text>
                    </View>

                    <TouchableOpacity onPress={handleShare} activeOpacity={0.8} style={{ width: '100%' }}>
                        <LinearGradient colors={['#25D366', '#1da851']} style={styles.shareButton}>
                            <Ionicons name="logo-whatsapp" size={24} color="#ffffff" />
                            <Text style={styles.shareButtonText}>{t('shareWhatsApp')}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => { setStep(1); setVisitorName(''); setPlate(''); setVisitorId(''); setCompanions('0'); setImage(null); }}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.closeButtonText}>{t('createAnother')}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </LinearGradient>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.container}>
                <BlurView intensity={80} tint="dark" style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>{t('newInvitation')}</Text>
                    <View style={{ width: 40 }} />
                </BlurView>

                <ScrollView contentContainerStyle={[styles.form, { paddingBottom: 150 }]} showsVerticalScrollIndicator={false}>
                    <BlurView intensity={20} tint="dark" style={styles.inputCard}>
                        <Text style={styles.label}>{t('visitorName')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="John Doe"
                            placeholderTextColor="#64748b"
                            value={visitorName}
                            onChangeText={setVisitorName}
                        />
                    </BlurView>

                    <BlurView intensity={20} tint="dark" style={styles.inputCard}>
                        <Text style={styles.label}>{t('visitorIdOptional')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="123-456-789"
                            placeholderTextColor="#64748b"
                            value={visitorId}
                            onChangeText={setVisitorId}
                        />
                    </BlurView>

                    <BlurView intensity={20} tint="dark" style={styles.inputCard}>
                        <Text style={styles.label}>{t('vehiclePlateOptional')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="ABC-123"
                            placeholderTextColor="#64748b"
                            value={plate}
                            onChangeText={setPlate}
                            autoCapitalize="characters"
                        />
                    </BlurView>

                    <BlurView intensity={20} tint="dark" style={styles.inputCard}>
                        <Text style={styles.label}>{t('companionsOptional')}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={t('numGuests')}
                            placeholderTextColor="#64748b"
                            value={companions}
                            onChangeText={setCompanions}
                            keyboardType="numeric"
                        />
                    </BlurView>

                    <Text style={styles.sectionTitleSmall}>{t('identityPhoto')}</Text>
                    <TouchableOpacity onPress={handleImagePress} style={styles.imagePicker}>
                        {image ? (
                            <Image source={{ uri: image }} style={styles.previewImage} />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Ionicons name="camera" size={32} color="#3b82f6" />
                                <Text style={styles.imagePlaceholderText}>{t('takePhoto')}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    {image && (
                        <Pressable onPress={() => setImage(null)} style={styles.removeImage}>
                            <Text style={styles.removeImageText}>{t('removePhoto')}</Text>
                        </Pressable>
                    )}

                    {assignedSpaces.length > 0 && (
                        <>
                            <Text style={styles.sectionTitleSmall}>{t('parkingAllocationOptional')}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.spaceSelector}>
                                <TouchableOpacity
                                    style={[styles.spaceOption, !selectedSpaceId && styles.spaceOptionActive]}
                                    onPress={() => setSelectedSpaceId(null)}
                                >
                                    <BlurView intensity={!selectedSpaceId ? 50 : 20} tint="dark" style={styles.spaceBlur}>
                                        <Text style={[styles.spaceText, !selectedSpaceId && styles.spaceTextActive]}>{t('onFoot')}</Text>
                                    </BlurView>
                                </TouchableOpacity>
                                {assignedSpaces.map((space) => (
                                    <TouchableOpacity
                                        key={space.id}
                                        style={[
                                            styles.spaceOption,
                                            selectedSpaceId === space.id && styles.spaceOptionActive,
                                            space.isOccupied && styles.spaceOptionOccupied
                                        ]}
                                        onPress={() => !space.isOccupied && setSelectedSpaceId(space.id)}
                                        disabled={space.isOccupied}
                                    >
                                        <BlurView intensity={selectedSpaceId === space.id ? 50 : 20} tint="dark" style={styles.spaceBlur}>
                                            <Ionicons
                                                name={space.isOccupied ? "lock-closed" : "car"}
                                                size={14}
                                                color={space.isOccupied ? "#ef4444" : (selectedSpaceId === space.id ? "#ffffff" : "#94a3b8")}
                                                style={{ marginBottom: 2 }}
                                            />
                                            <Text style={[
                                                styles.spaceText,
                                                selectedSpaceId === space.id && styles.spaceTextActive,
                                                space.isOccupied && styles.spaceTextOccupied
                                            ]}>
                                                {space.name}
                                            </Text>
                                            {space.isOccupied && <Text style={styles.occupiedLabel}>{t('busy')}</Text>}
                                        </BlurView>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </>
                    )}

                    <TouchableOpacity
                        style={styles.vipCheckboxContainer}
                        onPress={() => {
                            const newVip = !isVip;
                            setIsVip(newVip);
                            if (newVip) {
                                setDuration('876000'); // Indefinite
                                setIsSingleEntry(false);
                            } else {
                                setDuration('4'); // Default back to 4h
                            }
                        }}
                        activeOpacity={0.7}
                    >
                        <BlurView intensity={20} tint="dark" style={styles.vipCheckboxBlur}>
                            <View style={[styles.checkbox, isVip && styles.checkboxActive]}>
                                {isVip && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.vipLabel}>⭐ {t('vipMember')}</Text>
                                <Text style={styles.vipSubtext}>{t('noVehicleInspection')}</Text>
                            </View>
                        </BlurView>
                    </TouchableOpacity>

                    <Text style={styles.label}>{t('visitorCategory')}</Text>
                    <View style={styles.categorySelector}>
                        {[
                            { id: 'FAMILIAR', label: t('familiar'), icon: 'people' },
                            { id: 'CONTRATISTA', label: t('contratista'), icon: 'construct' },
                            { id: 'EMPLEADO', label: t('empleado'), icon: 'briefcase' },
                            { id: 'OTRO', label: t('otro'), icon: 'ellipsis-horizontal' },
                        ].map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryOption,
                                    category === cat.id && styles.categoryOptionActive
                                ]}
                                onPress={() => setCategory(cat.id)}
                            >
                                <BlurView intensity={category === cat.id ? 50 : 20} tint="dark" style={styles.categoryBlur}>
                                    <Ionicons
                                        name={cat.icon as any}
                                        size={18}
                                        color={category === cat.id ? '#ffffff' : '#94a3b8'}
                                    />
                                    <Text style={[
                                        styles.categoryText,
                                        category === cat.id && styles.categoryTextActive
                                    ]}>
                                        {cat.label}
                                    </Text>
                                </BlurView>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {!isVip && (
                        <>
                            <TouchableOpacity
                                style={styles.vipCheckboxContainer}
                                onPress={() => setIsSingleEntry(!isSingleEntry)}
                                activeOpacity={0.7}
                            >
                                <BlurView intensity={20} tint="dark" style={[styles.vipCheckboxBlur, { borderColor: 'rgba(59, 130, 246, 0.3)' }]}>
                                    <View style={[styles.checkbox, isSingleEntry && { backgroundColor: '#3b82f6', borderColor: '#3b82f6' }]}>
                                        {isSingleEntry && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.vipLabel}>{t('singleEntryPass')}</Text>
                                        <Text style={[styles.vipSubtext, { color: '#94a3b8' }]}>{t('singleEntryPassSubtext')}</Text>
                                    </View>
                                </BlurView>
                            </TouchableOpacity>

                            <Text style={styles.sectionTitleSmall}>{t('durationHours')}</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.durationSelector}
                            >
                                {[
                                    { value: '2', label: `2${t('hoursAbbr')}` },
                                    { value: '4', label: `4${t('hoursAbbr')}` },
                                    { value: '8', label: `8${t('hoursAbbr')}` },
                                    { value: '24', label: `24${t('hoursAbbr')}` },
                                    { value: '720', label: t('oneMonth') },
                                    { value: '2160', label: t('threeMonths') },
                                    { value: '876000', label: t('indefinite') },
                                ].map((opt) => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={[styles.durationOption, duration === opt.value && styles.durationOptionActive]}
                                        onPress={() => setDuration(opt.value)}
                                        activeOpacity={0.7}
                                    >
                                        <BlurView intensity={duration === opt.value ? 50 : 20} tint="dark" style={styles.durationBlur}>
                                            <Text
                                                style={[
                                                    styles.durationText,
                                                    duration === opt.value && styles.durationTextActive,
                                                    opt.label.length > 4 && { fontSize: 13 }
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {opt.label}
                                            </Text>
                                        </BlurView>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </>
                    )}

                    <Button
                        title={t('generatePass')}
                        onPress={handleCreate}
                        loading={loading}
                        icon="qr-code"
                        style={{ marginTop: 20 }}
                    />
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 24,
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 60,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    form: {
        padding: 24,
        paddingBottom: 100,
        gap: 16,
    },
    inputCard: {
        borderRadius: 20,
        padding: 20,
        overflow: 'hidden',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1.5,
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94a3b8',
        marginBottom: 8,
    },
    sectionTitleSmall: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94a3b8',
        marginTop: 8,
        marginBottom: 12,
    },
    input: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '500',
    },
    durationSelector: {
        flexDirection: 'row',
        paddingRight: 24,
        marginBottom: 32,
    },
    durationOption: {
        width: 85,
        height: 60,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginRight: 10,
    },
    durationBlur: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    durationOptionActive: {
        borderColor: '#3b82f6',
        borderWidth: 2,
    },
    durationText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#94a3b8',
    },
    durationTextActive: {
        color: '#ffffff',
    },
    // Parking Spaces
    spaceSelector: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    spaceOption: {
        width: 100,
        height: 50,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginRight: 10,
    },
    spaceOptionOccupied: {
        borderColor: 'rgba(239, 68, 68, 0.4)',
        opacity: 0.8,
    },
    spaceTextOccupied: {
        color: 'rgba(255, 255, 255, 0.4)',
    },
    occupiedLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#ef4444',
        textTransform: 'uppercase',
        marginTop: -2,
    },
    spaceBlur: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spaceOptionActive: {
        borderColor: '#3b82f6',
        borderWidth: 2,
    },
    spaceText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94a3b8',
    },
    spaceTextActive: {
        color: '#ffffff',
    },
    // Success State
    successIconBlur: {
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: 'hidden',
        marginBottom: 24,
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
        elevation: 12,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 16,
        color: '#94a3b8',
        marginBottom: 32,
    },
    qrCard: {
        width: '100%',
        padding: 32,
        borderRadius: 32,
        alignItems: 'center',
        marginBottom: 40,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 12,
    },
    removePhoto: {
        marginTop: 8,
        alignItems: 'center',
    },
    // Category Selector
    categorySelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
        marginBottom: 16,
    },
    categoryOption: {
        flex: 1,
        minWidth: '45%',
        height: 50,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    categoryOptionActive: {
        borderColor: '#3b82f6',
        borderWidth: 2,
    },
    categoryBlur: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 12,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94a3b8',
    },
    categoryTextActive: {
        color: '#ffffff',
    },
    removePhotoText: {
        color: '#ef4444',
        fontSize: 14,
    },
    accessCodeContainer: {
        marginTop: 24,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    accessCodeLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    accessCodeValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        letterSpacing: 4,
    },
    visitorNameLabel: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginTop: 16,
    },
    plateLabel: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 4,
        fontWeight: '500',
    },
    shareButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        shadowColor: '#25D366',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    shareButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        alignItems: 'center',
        padding: 16,
        marginTop: 8,
    },
    closeButtonText: {
        color: '#94a3b8',
        fontWeight: '600',
    },
    successSpaceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginTop: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    successSpaceText: {
        color: '#10b981',
        fontSize: 13,
        fontWeight: 'bold',
    },
    imagePicker: {
        height: 150,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderStyle: 'dashed',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    imagePlaceholder: {
        alignItems: 'center',
        gap: 8,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imagePlaceholderText: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    removeImage: {
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 12,
    },
    removeImageText: {
        color: '#ef4444',
        fontSize: 14,
    },
    vipCheckboxContainer: {
        marginBottom: 20,
    },
    vipCheckboxBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.3)',
        overflow: 'hidden',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#fbbf24',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: '#fbbf24',
    },
    vipLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
    vipSubtext: {
        fontSize: 12,
        color: '#fbbf24',
        marginTop: 2,
    },
});
