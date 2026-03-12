import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'screens/home/home_screen.dart';
import 'screens/active_ride_screen.dart';
import 'screens/receipt_screen.dart';
import 'screens/ride_complete_screen.dart';
import 'screens/auth/profile_screen.dart';
import 'screens/waiver_screen.dart';
import 'screens/prebook_screen.dart';
import 'screens/dunes_screen.dart';
import 'screens/admin/admin_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/onboarding_screen.dart';
import 'widgets/main_shell.dart';

final appRouter = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(path: '/splash',     builder: (_, __) => const SplashScreen()),
    GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),

    ShellRoute(
      builder: (ctx, state, child) => MainShell(child: child),
      routes: [
        GoRoute(path: '/',        builder: (_, __) => const HomeScreen()),
        GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
        GoRoute(path: '/prebook', builder: (_, __) => const PrebookScreen()),
        GoRoute(path: '/dunes',   builder: (_, __) => const DunesScreen()),
      ],
    ),
    GoRoute(
      path: '/ride/:id',
      builder: (ctx, s) => ActiveRideScreen(
          bookingId: int.parse(s.pathParameters['id']!)),
    ),
    GoRoute(
      path: '/ride_complete/:id',
      builder: (ctx, s) => RideCompleteScreen(
          bookingId: int.parse(s.pathParameters['id']!)),
    ),
    GoRoute(
      path: '/receipt/:id',
      builder: (ctx, s) => ReceiptScreen(
          bookingId: int.parse(s.pathParameters['id']!)),
    ),
    GoRoute(
      path: '/waiver/:id',
      builder: (ctx, s) => WaiverScreen(
          bookingId: int.parse(s.pathParameters['id']!)),
    ),
    GoRoute(
      path: '/admin',
      builder: (_, __) => const AdminScreen(),
    ),
  ],
);
