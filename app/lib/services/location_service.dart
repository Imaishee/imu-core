import 'package:geolocator/geolocator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'permission_service.dart';

/// Captures the user's location and stores it in the Supabase profiles table.
class LocationService {
  static bool _attempted = false;

  /// Try to capture and save location once per session.
  static Future<void> captureAndSave() async {
    if (_attempted) return;
    _attempted = true;

    try {
      final granted = await PermissionService.requestLocation();
      if (!granted) return;

      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.low,
          timeLimit: Duration(seconds: 10),
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
}
