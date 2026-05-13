import { createRouter, createWebHistory } from "vue-router";

import HomeView from "../views/HomeView.vue";
import AboutView from "../views/AboutView.vue";
import EventsView from "../views/EventsView.vue";
import EventDetailView from "../views/EventDetailView.vue";
import RegisterEventView from "../views/RegisterEventView.vue";
import GamesView from "../views/GamesView.vue";
import GameDetailView from "../views/GameDetailView.vue";
import LeaderboardView from "../views/LeaderboardView.vue";
import LoginView from "../views/auth/LoginView.vue";
import RegisterView from "../views/auth/RegisterView.vue";
import DashboardView from "../views/dashboard/DashboardView.vue";
import DashboardProfileView from "../views/dashboard/DashboardProfileView.vue";
import DashboardRegistrationsView from "../views/dashboard/DashboardRegistrationsView.vue";
import DashboardSettingsView from "../views/dashboard/DashboardSettingsView.vue";
import FriendsView from "../views/dashboard/DashboardFriendsView.vue";  // ← moved to dashboard folder
import NotFoundView from "../views/NotFoundView.vue";

// ── Council ─────────────────────────────────────────────
import CouncilsView from "../views/council/CouncilsView.vue";
import CouncilDetailView from "../views/council/CouncilDetailView.vue";
import CouncilCreateView from "../views/council/CouncilCreateView.vue";
import CouncilDashboardView from "../views/council/CouncilDashboardView.vue";

// ── Chat (standalone full-screen layout, not inside DashboardView) ──
import ChatView from "../views/chat/ChatView.vue";
import EditChatView from "../views/chat/EditChat.vue";
import DashboardHomeView from "../views/dashboard/DashboardHomeView.vue";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) return savedPosition;
        return { top: 0, behavior: 'smooth' };
    },
    routes: [

        // ── Public ──────────────────────────────────────────
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: '/about',
            name: 'about',
            component: AboutView
        },
        {
            path: '/leaderboard',
            name: 'leaderboard',
            component: LeaderboardView
        },

        // ── Events ──────────────────────────────────────────
        {
            path: '/events',
            name: 'events',
            component: EventsView
        },
        {
            path: '/events/:id',
            name: 'event-detail',
            component: EventDetailView,
            props: true
        },
        {
            path: '/register/:id',
            name: 'event-register',
            component: RegisterEventView,
            props: true,
            meta: { requiresAuth: true }
        },

        // ── Games ───────────────────────────────────────────
        {
            path: '/games',
            name: 'games',
            component: GamesView
        },
        {
            path: '/games/:id',
            name: 'game-detail',
            component: GameDetailView,
            props: true
        },

        // ── Council ─────────────────────────────────────────
        // IMPORTANT: /council/create must be before /council/:id
        // or "create" will be caught as an :id param
        {
            path: '/council',
            name: 'councils',
            component: CouncilsView
        },
        {
            path: '/council/create',
            name: 'council-create',
            component: CouncilCreateView,
            meta: { requiresAuth: true }
        },
        {
            path: '/council/:id',
            name: 'council-detail',
            component: CouncilDetailView,
            props: true
        },
        {
            path: '/council/:id/dashboard',
            name: 'council-dashboard',
            component: CouncilDashboardView,
            props: true,
            meta: { requiresAuth: true }
        },

        // ── Chat (full-screen, own layout — NOT inside DashboardView) ──
        // Flattened: ChatView reads route.params.roomId directly,
        // no need for a nested route pointing to itself
        {
            path: '/dashboard/chats',
            name: 'chat',
            component: ChatView,
            meta: { requiresAuth: true }
        },
        {
            path: '/dashboard/chats/:roomId',
            name: 'chat-room',
            component: ChatView,
            props: true,
            meta: { requiresAuth: true }
        },
        {
            path: '/dashboard/edit/chat/:id',
            name: 'editChat',
            component: EditChatView,
            props: true,
            meta: { requiresAuth: true }
        },

        // ── Auth ────────────────────────────────────────────
        {
            path: '/login',
            name: 'login',
            component: LoginView,
            meta: { guestOnly: true }
        },
        {
            path: '/register',
            name: 'register',
            component: RegisterView,
            meta: { guestOnly: true }
        },

        // ── Dashboard (auth protected) ───────────────────────
        // Friends and Chat are intentionally NOT children here —
        // they use their own full-screen layouts (no dashboard sidebar).
        {
            path: '/dashboard',
            name: 'dashboard',
            component: DashboardView,
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',           // /dashboard → default tab
                    name: 'dashboard-home',
                    component: DashboardHomeView
                },
                {
                    path: 'profile',
                    name: 'dashboard-profile',
                    component: DashboardProfileView
                },
                {
                    path: 'registrations',
                    name: 'dashboard-registrations',
                    component: DashboardRegistrationsView
                },
                {
                    path: 'settings',
                    name: 'dashboard-settings',
                    component: DashboardSettingsView
                },
                {
                    path: 'friends',
                    name: 'friends',
                    component: FriendsView
                }
            ]
        },

        // ── 404 ─────────────────────────────────────────────
        {
            path: '/:pathMatch(.*)*',
            name: 'not-found',
            component: NotFoundView
        }
    ]
});

// ── Navigation Guards ────────────────────────────────────
router.beforeEach((to, from, next) => {
    const isLoggedIn = !!localStorage.getItem('token');

    if (to.meta.requiresAuth && !isLoggedIn) {
        next({ name: 'login', query: { redirect: to.fullPath } });
        return;
    }

    if (to.meta.guestOnly && isLoggedIn) {
        next({ name: 'dashboard' });
        return;
    }

    next();
});

export default router;