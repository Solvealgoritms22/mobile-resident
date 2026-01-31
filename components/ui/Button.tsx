import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    icon?: keyof typeof Ionicons.prototype.props.name;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button = ({
    title,
    onPress,
    loading = false,
    disabled = false,
    variant = 'primary',
    icon,
    style,
    textStyle
}: ButtonProps) => {

    const getVariantColors = () => {
        switch (variant) {
            case 'danger': return ['#ef4444', '#dc2626', '#b91c1c'];
            case 'secondary': return ['#475569', '#334155', '#1e293b'];
            case 'ghost': return ['transparent', 'transparent'];
            default: return ['#3b82f6', '#2563eb', '#1d4ed8'];
        }
    };

    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.8}
            style={[styles.container, style, isDisabled && styles.disabled]}
        >
            <LinearGradient
                colors={getVariantColors() as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                    <View style={styles.content}>
                        {icon && <Ionicons name={icon as any} size={20} color="#ffffff" style={styles.icon} />}
                        <Text style={[styles.text, textStyle]}>{title}</Text>
                    </View>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        overflow: 'hidden',
        height: 56,
        marginVertical: 8,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    icon: {
        marginRight: 10,
    },
    disabled: {
        opacity: 0.6,
    }
});
