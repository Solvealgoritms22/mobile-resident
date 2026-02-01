import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type Language = 'en' | 'es';

interface TranslationContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
    en: {
        // Tabs
        tabHome: 'Home',
        tabInvite: 'Invite',
        tabVehicles: 'Vehicles',
        tabProfile: 'Profile',

        // Profile
        residentAccount: 'RESIDENT ACCOUNT',
        activeMember: 'Active Member',
        accountDetails: 'Account Details',
        email: 'Email',
        identification: 'Identification',
        phoneNumber: 'Phone Number',
        accessRole: 'Access Role',
        settingsSystem: 'Settings & System',
        pushNotifications: 'Push Notifications',
        arrivalAlerts: 'Arrival and visit alerts',
        privacySecurity: 'Privacy & Security',
        language: 'Language',
        appLanguage: 'Change app language',
        signOut: 'Sign Out',
        signOutConfirm: 'Are you sure you want to sign out?',
        cancel: 'Cancel',
        version: 'Version',
        soon: 'SOON',

        // Login
        residentPortal: 'Resident Portal',
        signInSubtitle: 'Sign in to manage your visits',
        loginButton: 'Sign In',
        welcomeBack: 'Welcome back!',
        enterEmailPass: 'Please enter both email and password',
        errorLogin: 'Login failed. Check credentials.',

        // Home
        welcome: 'Welcome',
        resident: 'Resident',
        quickActions: 'Quick Actions',
        inviteGuest: 'Invite Guest',
        myVehicles: 'My Vehicles',
        securityContacts: 'Security',
        reportIncident: 'Report Incident',
        emergency: 'Emergency',
        activeInvitations: 'Active Invitations',
        noActiveInvites: 'No active invitations',
        getHelp: 'GET HELP',

        // Invitations
        newInvitation: 'New Invitation',
        visitorName: 'Visitor Name',
        visitorId: 'Visitor ID',
        idNumber: 'ID Number',
        vehiclePlate: 'Vehicle Plate',
        companions: 'Companions',
        selectParking: 'Select Parking',
        validFrom: 'Valid From',
        validUntil: 'Valid Until',
        createInvite: 'Create Invitation',
        processing: 'Processing...',
        selectSpace: 'Please select a parking space',
        enterName: 'Please enter visitor name',
        visitCreated: 'Invitation created successfully',
        failedCreateVisit: 'Failed to create invitation',
        invitationCreated: 'Invitation Created!',
        validFor: 'Valid for',
        manualEntryCode: 'MANUAL ENTRY CODE',
        noVehicle: 'No Vehicle',
        shareWhatsApp: 'Share on WhatsApp',
        createAnother: 'Create Another',
        visitorIdOptional: 'Visitor ID (Optional)',
        vehiclePlateOptional: 'Vehicle Plate (Optional)',
        companionsOptional: 'Companions (Optional)',
        numGuests: 'Number of guests',
        identityPhoto: 'Document/Identity Photo',
        takePhoto: 'Take Photo',
        chooseGallery: 'Choose from Gallery',
        removePhoto: 'Remove Photo',
        parkingAllocationOptional: 'Parking Allocation (Optional)',
        onFoot: 'On Foot',
        busy: 'Busy',
        durationHours: 'Duration (Hours)',
        generatePass: 'Generate Pass',
        hoursAbbr: 'h',

        // Contacts
        officialContacts: 'Official Contacts',
        searchContactsPlaceholder: 'Search support or security...',
        noContactsFound: 'No contacts found',
        errorCallNotSupported: 'Calling is not supported on this device',
        errorWhatsAppNotSupported: 'WhatsApp is not installed or the browser could not be opened',

        // Visitors
        visitorHistory: 'Visitor History',
        totalRecords: 'total records',
        startDate: 'Start Date',
        endDate: 'End Date',
        viewPass: 'View Pass',
        noVisitorsFound: 'No Visitors found',
        adjustFilterHint: 'Try adjusting your date filter',

        // Reports
        reportService: 'Report Service',
        helpPrompt: 'What can we help you with?',
        maintenance: 'Maintenance',
        security: 'Security',
        support: 'Support',
        other: 'Other',
        details: 'Details',
        reportDetailsPlaceholder: 'Provide more details about your request...',
        submitting: 'Submitting...',
        sendReport: 'Send Report',
        reportSubmittedTitle: 'Report Submitted',
        reportSubmittedMessage: 'Your report has been received and will be reviewed shortly.',
        errorReportFailed: 'Failed to submit report. Please try again.',
        errorReportSelectType: 'Please select type and provide description',
        reportTitle: 'Report',
        typeMaintenance: 'Maintenance',
        typeSecurity: 'Security',
        typeSupport: 'Support',
        typeOther: 'Other',

        // Parking
        parkingStatus: 'Parking Status',
        available: 'Available',
        occupied: 'Occupied',
        myAssignedSpots: 'My Assigned Spots',
        noAssignedSpots: "You don't have any assigned parking spots yet. Please contact administration if this is an error.",

        // Localized Identity Pass
        identityPass: 'Identity Pass',
        scanHint: 'Scan this code at entry points',
        verifiedIdentity: 'VERIFIED IDENTITY',
        lastUpdated: 'Last updated: Just now',
        personalNote: 'This pass is personal and non-transferable. Use it for building access and identification.',

        // Share Message
        shareSubject: '*Invitation to COSEVI*',
        shareGreeting: 'Hello',
        friend: 'Friend',
        shareBody: 'I have generated an invitation for you.',
        shareAccessCode: 'Access Code',
        shareDuration: 'Duration',
        shareInstructions: 'Please show the QR code or use the manual code at the entrance.',
        shareClosing: 'See you soon!',

        // Dashboard Home Access
        homeAccess: 'Home Access',
        unitNotAssigned: 'Unit Not Assigned',
        viewIdentityPass: 'View Identity Pass',
        active: 'Active',
        pending: 'Pending',
        total: 'Total',
        recentVisitors: 'Recent Visitors',
        seeAll: 'See All',
        noRecentVisitors: 'No recent visitors',
        identityNotSet: 'Identity Not Set',
        emergencyConfirm: 'Do you need immediate assistance?',
        securityNotified: 'Security has been notified',
        failedAlert: 'Failed to send alert',
    },
    es: {
        // Tabs
        tabHome: 'Inicio',
        tabInvite: 'Invitar',
        tabVehicles: 'Vehículos',
        tabProfile: 'Perfil',

        // Profile
        residentAccount: 'CUENTA DE RESIDENTE',
        activeMember: 'Miembro Activo',
        accountDetails: 'Detalles de la Cuenta',
        email: 'Correo',
        identification: 'Identificación',
        phoneNumber: 'Teléfono',
        accessRole: 'Rol de Acceso',
        settingsSystem: 'Ajustes y Sistema',
        pushNotifications: 'Notificaciones Push',
        arrivalAlerts: 'Alertas de llegada y visitas',
        privacySecurity: 'Privacidad y Seguridad',
        language: 'Idioma',
        appLanguage: 'Cambiar idioma de la app',
        signOut: 'Cerrar Sesión',
        signOutConfirm: '¿Está seguro de que desea cerrar sesión?',
        cancel: 'Cancelar',
        version: 'Versión',
        soon: 'PRONTO',

        // Login
        residentPortal: 'Portal de Residente',
        signInSubtitle: 'Inicie sesión para gestionar sus visitas',
        loginButton: 'Iniciar Sesión',
        welcomeBack: '¡Bienvenido de nuevo!',
        enterEmailPass: 'Por favor ingrese correo y contraseña',
        errorLogin: 'Error al iniciar sesión. Verifique sus credenciales.',

        // Home
        welcome: 'Bienvenido',
        resident: 'Residente',
        quickActions: 'Acciones Rápidas',
        inviteGuest: 'Invitar Huésped',
        myVehicles: 'Mis Vehículos',
        securityContacts: 'Seguridad',
        reportIncident: 'Reportar Incidente',
        emergency: 'Emergencia',
        activeInvitations: 'Invitaciones Activas',
        noActiveInvites: 'No hay invitaciones activas',
        getHelp: 'OBTENER AYUDA',

        // Invitations
        newInvitation: 'Nueva Invitación',
        visitorName: 'Nombre del Visitante',
        visitorId: 'ID del Visitante',
        idNumber: 'Número de ID',
        vehiclePlate: 'Placa del Vehículo',
        companions: 'Acompañantes',
        selectParking: 'Seleccionar Parqueo',
        validFrom: 'Desde',
        validUntil: 'Hasta',
        createInvite: 'Crear Invitación',
        processing: 'Procesando...',
        selectSpace: 'Por favor seleccione un parqueo',
        enterName: 'Por favor ingrese el nombre del visitante',
        visitCreated: 'Invitación creada exitosamente',
        failedCreateVisit: 'Error al crear la invitación',
        invitationCreated: '¡Invitación Creada!',
        validFor: 'Válido por',
        manualEntryCode: 'CÓDIGO DE ENTRADA MANUAL',
        noVehicle: 'Sin Vehículo',
        shareWhatsApp: 'Compartir en WhatsApp',
        createAnother: 'Crear Otra',
        visitorIdOptional: 'Número de ID (Opcional)',
        vehiclePlateOptional: 'Placa del Vehículo (Opcional)',
        companionsOptional: 'Acompañantes (Opcional)',
        numGuests: 'Número de invitados',
        identityPhoto: 'Foto de Documento/Identidad',
        takePhoto: 'Tomar Foto',
        chooseGallery: 'Elegir de Galería',
        removePhoto: 'Eliminar Foto',
        parkingAllocationOptional: 'Asignación de Parqueo (Opcional)',
        onFoot: 'A Pie',
        durationHours: 'Duración (Horas)',
        generatePass: 'Generar Pase',
        hoursAbbr: 'h',
        busy: 'Ocupado',

        // Contacts
        officialContacts: 'Contactos Oficiales',
        searchContactsPlaceholder: 'Buscar soporte o seguridad...',
        noContactsFound: 'No se encontraron contactos',
        errorCallNotSupported: 'Las llamadas no son compatibles en este dispositivo',
        errorWhatsAppNotSupported: 'WhatsApp no está instalado o no se pudo abrir el navegador',

        // Visitors
        visitorHistory: 'Historial de Visitantes',
        totalRecords: 'registros totales',
        startDate: 'Fecha Inicio',
        endDate: 'Fecha Fin',
        viewPass: 'Ver Pase',
        noVisitorsFound: 'No se encontraron visitantes',
        adjustFilterHint: 'Intente ajustar el filtro de fecha',

        // Reports
        reportService: 'Servicio de Reportes',
        helpPrompt: '¿En qué podemos ayudarle?',
        maintenance: 'Mantenimiento',
        security: 'Seguridad',
        support: 'Soporte',
        other: 'Otro',
        details: 'Detalles',
        reportDetailsPlaceholder: 'Proporcione más detalles sobre su solicitud...',
        submitting: 'Enviando...',
        sendReport: 'Enviar Reporte',
        reportSubmittedTitle: 'Reporte Enviado',
        reportSubmittedMessage: 'Su reporte ha sido recibido y será revisado pronto.',
        errorReportFailed: 'Error al enviar reporte. Por favor intente de nuevo.',
        errorReportSelectType: 'Por favor seleccione un tipo y proporcione una descripción',
        reportTitle: 'Reportar Incidente',
        typeMaintenance: 'Mantenimiento',
        typeSecurity: 'Seguridad',
        typeSupport: 'Soporte',
        typeOther: 'Otro',

        // Parking
        parkingStatus: 'Estado del Parqueo',
        available: 'Disponible',
        occupied: 'Ocupado',
        myAssignedSpots: 'Mis Lugares Asignados',
        noAssignedSpots: 'Aún no tiene lugares de parqueo asignados. Contacte a la administración si es un error.',

        // Localized Identity Pass
        identityPass: 'Pase de Identidad',
        scanHint: 'Escanee este código en los puntos de entrada',
        verifiedIdentity: 'IDENTIDAD VERIFICADA',
        lastUpdated: 'Última actualización: Ahora mismo',
        personalNote: 'Este pase es personal e intransferible. Úselo para acceso al edificio e identificación.',

        // Share Message
        shareSubject: '*Invitación a COSEVI*',
        shareGreeting: 'Hola',
        friend: 'Amigo/a',
        shareBody: 'He generado una invitación para ti.',
        shareAccessCode: 'Código de Acceso',
        shareDuration: 'Duración',
        shareInstructions: 'Por favor muestra el código QR o usa el código manual en la entrada.',
        shareClosing: '¡Nos vemos pronto!',

        // Dashboard Home Access
        homeAccess: 'Acceso al Hogar',
        unitNotAssigned: 'Unidad no asignada',
        viewIdentityPass: 'Ver Pase de Identidad',
        active: 'Activo',
        pending: 'Pendiente',
        total: 'Total',
        recentVisitors: 'Visitantes Recientes',
        seeAll: 'Ver Todo',
        noRecentVisitors: 'No hay visitantes recientes',
        identityNotSet: 'Identidad no establecida',
        emergencyConfirm: '¿Necesita asistencia inmediata?',
        securityNotified: 'Seguridad ha sido notificada',
        failedAlert: 'Error al enviar alerta',
    }
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem('cosevi_app_lang');
            if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
                setLanguageState(savedLanguage as Language);
            }
        } catch (error) {
            console.error('Error loading language:', error);
        } finally {
            setIsInitialized(true);
        }
    };

    const setLanguage = async (lang: Language) => {
        try {
            await AsyncStorage.setItem('cosevi_app_lang', lang);
            setLanguageState(lang);
        } catch (error) {
            console.error('Error saving language:', error);
        }
    };

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    if (!isInitialized) return null;

    return (
        <TranslationContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </TranslationContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(TranslationContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    return context;
}
