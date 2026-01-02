import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

// Pending navigation for cold starts
let pendingNavigation: { name: string; params?: Record<string, unknown> } | null = null;

export function navigate(name: string, params?: Record<string, unknown>) {
    if (navigationRef.isReady()) {
        navigationRef.dispatch(
            CommonActions.navigate({
                name,
                params,
            })
        );
    } else {
        // Store for later when navigation becomes ready (cold start from notification)
        pendingNavigation = { name, params };
        // Retry after a delay
        retryNavigation(name, params, 5);
    }
}

function retryNavigation(name: string, params: Record<string, unknown> | undefined, retries: number) {
    if (retries <= 0) {
        console.log('NavigationService: Max retries reached, giving up');
        pendingNavigation = null;
        return;
    }

    setTimeout(() => {
        if (navigationRef.isReady()) {
            console.log('NavigationService: Navigation now ready, navigating to', name);
            navigationRef.dispatch(
                CommonActions.navigate({
                    name,
                    params,
                })
            );
            pendingNavigation = null;
        } else {
            console.log('NavigationService: Navigation still not ready, retrying...', retries - 1, 'left');
            retryNavigation(name, params, retries - 1);
        }
    }, 500);
}

// Called when NavigationContainer becomes ready
export function onNavigationReady() {
    if (pendingNavigation) {
        console.log('NavigationService: Processing pending navigation to', pendingNavigation.name);
        navigationRef.dispatch(
            CommonActions.navigate({
                name: pendingNavigation.name,
                params: pendingNavigation.params,
            })
        );
        pendingNavigation = null;
    }
}

