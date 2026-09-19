import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'permission_service.dart';

/// Captures and periodically updates the user's location.
///
/// - One-shot capture on startup (fast, low accuracy)
/// - Periodic background updates every 15 minutes (when app is foreground)
/// - Stores lat/lon + timestamp in the Supabase profiles table
class LocationService {
  static bool _initialized = false;
  static Timer? _periodicTimer;
  static const _periodicInterval = Duration(minutes: 15);
  static const _accuracy = LocationAccuracy.low;
  static const _timeLimit = Duration(seconds: 15);

  /// Initialize: capture once, then start periodic updates.
  static void init() {
    if (_initialized) return;
    _initialized = true;

    // One-shot capture (non-blocking)
    captureAndSave().then((_) {
      // Start periodic after first capture
      _startPeriodic();
    });
  }

  /// Stop periodic updates (e.g., on logout).
  static void dispose() {
    _periodicTimer?.cancel();
    _periodicTimer = null;
    _initialized = false;
  }

  // ─── Periodic Updates ────────────────────────────────────────────

  static void _startPeriodic() {
    _periodicTimer?.cancel();
    _periodicTimer = Timer.periodic(_periodicInterval, (_) {
      captureAndSave();
    });
  }

  // ─── One-Shot Capture ────────────────────────────────────────────

  /// Capture current location and save to Supabase profiles table.
  /// Silently fails if permissions denied or user not logged in.
  static Future<void> captureAndSave() async {
    try {
      final granted = await PermissionService.requestLocation();
      if (!granted) return;

      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.low,
          timeLimit: Duration(seconds: 15),
        ),
      );

      await Supabase.instance.client.from('profiles').update({
        'latitude': position.latitude,
        'longitude': position.longitude,
        'location_updated_at': DateTime.now().toIso8601String(),
      }).eq('id', user.id);
    } catch (_) {
      // Silently fail — location is best-effort.
    }
  }

  /// Force an immediate location update (e.g., user tapped refresh).
  static Future<Position?> getCurrentPosition() async {
    try {
      final granted = await PermissionService.requestLocation();
      if (!granted) return null;

      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );
    } catch (_) {
      return null;
    }
  }

  /// Check if location services are enabled on the device.
  static Future<bool> isLocationEnabled() async {
    return await Geolocator.isLocationServiceEnabled();
  }
}
