import { StyleSheet, Platform, Dimensions } from 'react-native';

const { height, width } = Dimensions.get('window');

export const getStyles = (theme: any, insets: any) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            paddingHorizontal: 20,
            paddingBottom: 20,
            paddingTop: insets.top + 10,
        },
        headerContent: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
        },
        backButton: {
            padding: 8,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 8,
        },
        headerTitle: {
            fontSize: 20,
            color: 'white',
            fontFamily: Platform.OS === 'ios' ? 'PlayfairDisplay-Regular' : 'PlayfairDisplay',
            fontWeight: '600',
        },
        heroSection: {
            paddingHorizontal: 20,
            paddingBottom: 40,
            paddingTop: 10,
            alignItems: 'center',
        },
        heroIconContainer: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'rgba(255,255,255,0.1)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.2)',
        },
        heroTitle: {
            fontSize: 28,
            color: 'white',
            fontFamily: Platform.OS === 'ios' ? 'PlayfairDisplay-Regular' : 'PlayfairDisplay',
            marginBottom: 12,
            textAlign: 'center',
        },
        heroDescription: {
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            lineHeight: 22,
            maxWidth: 300,
        },
        contentContainer: {
            flex: 1,
            backgroundColor: theme.colors.background,
            marginTop: -24,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 24,
            paddingHorizontal: 20,
        },
        sectionCard: {
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
            elevation: 5,
        },
        benefitsHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text,
            fontFamily: Platform.OS === 'ios' ? 'PlayfairDisplay-Regular' : 'PlayfairDisplay',
        },
        benefitItem: {
            flexDirection: 'row',
            marginBottom: 16,
            gap: 16,
        },
        benefitIconContainer: {
            width: 48,
            height: 48,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
        },
        benefitTextContainer: {
            flex: 1,
        },
        benefitTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
            marginBottom: 4,
        },
        benefitDescription: {
            fontSize: 13,
            color: theme.colors.textSecondary,
            lineHeight: 18,
        },
        planButton: {
            backgroundColor: theme.colors.surface,
            borderWidth: 2,
            borderRadius: 16,
            padding: 20,
            marginBottom: 12,
            position: 'relative',
        },
        selectedPlan: {
            borderColor: theme.colors.primary,
            backgroundColor: 'rgba(16, 185, 129, 0.05)', // light version of primary/emerald
        },
        unselectedPlan: {
            borderColor: theme.colors.border,
        },
        popularBadge: {
            position: 'absolute',
            top: -12,
            alignSelf: 'center',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 20,
            zIndex: 1,
        },
        popularText: {
            color: 'white',
            fontSize: 12,
            fontWeight: '600',
        },
        planHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        planPriceContainer: {
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: 4,
        },
        planPrice: {
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.colors.primary,
            fontFamily: Platform.OS === 'ios' ? 'PlayfairDisplay-Regular' : 'PlayfairDisplay',
        },
        planPeriod: {
            fontSize: 14,
            color: theme.colors.textSecondary,
        },
        planName: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
            marginTop: 4,
        },
        radioButton: {
            width: 28,
            height: 28,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
        },
        planDescription: {
            fontSize: 14,
            color: theme.colors.textSecondary,
        },
        savingsBadge: {
            marginTop: 12,
            alignSelf: 'flex-start',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
        },
        savingsText: {
            color: '#10b981', // emerald-500
            fontSize: 12,
            fontWeight: '600',
        },
        comparisonRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        featureName: {
            flex: 1,
            fontSize: 14,
            color: theme.colors.text,
        },
        checkContainer: {
            flexDirection: 'row',
            width: 100,
            justifyContent: 'space-between',
        },
        checkColumn: {
            width: 40,
            alignItems: 'center',
        },
        comparisonHeader: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginBottom: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
        },
        trustBadges: {
            alignItems: 'center',
            marginVertical: 24,
            gap: 12,
        },
        trustCheckRow: {
            flexDirection: 'row',
            gap: 24,
        },
        trustItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        trustText: {
            fontSize: 12,
            color: theme.colors.textSecondary,
        },
        footer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.colors.surface,
            padding: 20,
            paddingBottom: insets.bottom + 10,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
        },
        ctaButton: {
            borderRadius: 16,
            overflow: 'hidden',
        },
        ctaContent: {
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
        },
        ctaText: {
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
        },
        footerSubtext: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            marginTop: 12,
        },
    });
};
