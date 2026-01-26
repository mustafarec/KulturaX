import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const getStyles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 60, paddingBottom: 5, backgroundColor: 'rgba(255,255,255,0)', zIndex: 10 },
    headerTitle: { fontSize: 23, fontFamily: theme.fonts.headings, color: theme.colors.primary, textAlign: 'center' },
    searchContainer: { paddingHorizontal: 20, backgroundColor: theme.colors.surface, zIndex: 9, overflow: 'hidden', justifyContent: 'center', marginTop: -10 },
    searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.inputBackground, borderRadius: theme.borderRadius.l, paddingHorizontal: 16, height: 48, borderWidth: 0 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: theme.colors.text, height: '100%', paddingVertical: 0, fontFamily: theme.fonts.main },
    searchBarWrapper: { backgroundColor: theme.colors.background, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    searchBarContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 10 },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 12, paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: theme.colors.border },
    searchCancelButton: { paddingHorizontal: 4 },
    searchCancelText: { color: theme.colors.primary, fontSize: 15, fontWeight: '600' },
    tabsContainer: { flexDirection: 'row', backgroundColor: theme.colors.background, paddingHorizontal: 20, paddingVertical: 10, zIndex: 9, gap: 12 },
    tab: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'transparent' },
    activeTab: { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    tabText: { fontSize: 15, color: theme.colors.textSecondary, fontWeight: '600', fontFamily: theme.fonts.main },
    activeTabText: { color: '#FFFFFF', fontWeight: '700' },
    headerLeft: { width: 50 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    pageTitleContainer: { alignItems: 'center', justifyContent: 'center', flex: 1 },
    headerLogo: { width: 150, height: 40, resizeMode: 'contain', tintColor: theme.colors.primary },
    contentWrapper: { flexDirection: 'row', width: SCREEN_WIDTH * 5, flex: 1 },
    page: { width: SCREEN_WIDTH, flex: 1 },
    listContainer: { paddingBottom: 100, paddingTop: 8, paddingHorizontal: 16 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
    emptyText: { fontSize: 16, color: theme.colors.textSecondary, fontFamily: theme.fonts.main, marginTop: 16 },
    // Badge Styles
    unreadBadge: { position: 'absolute', right: -6, top: -4, backgroundColor: theme.colors.error, borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.colors.surface },
    notificationBadge: { position: 'absolute', right: -6, top: -4, backgroundColor: theme.colors.primary, borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.colors.surface },
    badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 2 },
    // Sub-category Styles
    subCategoryContainer: { paddingVertical: 10 },
    subCategoryScrollContent: { paddingHorizontal: 20, gap: 10 },
    subCategoryItem: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
    subCategoryItemActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    subCategoryItemInactive: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
    subCategoryText: { fontSize: 13, fontFamily: theme.fonts.main },
    subCategoryTextActive: { color: '#FFF', fontWeight: '600' },
    subCategoryTextInactive: { color: theme.colors.text, fontWeight: '400' }
});
