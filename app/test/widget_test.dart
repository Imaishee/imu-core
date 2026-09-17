import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:imu_app/theme/app_theme.dart';

void main() {
  tearDown(() => AppTheme.setDark(false));

  group('AppTheme static state regression', () {
    test('building light and dark themes never mutates global isDark', () {
      AppTheme.setDark(false);
      AppTheme.light;
      expect(AppTheme.isDark, isFalse);
      AppTheme.dark;
      expect(AppTheme.isDark, isFalse,
          reason: 'evaluating AppTheme.dark must not flip the global flag');
    });

    test('light mode resolves readable foreground on light background', () {
      AppTheme.setDark(false);
      expect(AppTheme.textMain, AppColors.inkText);
      expect(AppTheme.bg, AppColors.creamBg);
      expect(AppTheme.surface, AppColors.creamSurface);
    });

    test('dark mode resolves readable foreground on dark background', () {
      AppTheme.setDark(true);
      expect(AppTheme.textMain, AppColors.creamText);
      expect(AppTheme.bg, AppColors.darkBg);
      expect(AppTheme.surface, AppColors.darkSurface);
    });

    test('light theme text color contrasts with its own background', () {
      final light = AppTheme.light;
      final bg = light.scaffoldBackgroundColor;
      final fg = light.textTheme.bodyLarge!.color!;
      expect(fg, isNot(equals(bg)));
      // Light theme must pair a light bg with a dark foreground.
      expect(bg.computeLuminance(), greaterThan(fg.computeLuminance()));
    });

    test('dark theme pairs a dark bg with a light foreground', () {
      final dark = AppTheme.dark;
      final bg = dark.scaffoldBackgroundColor;
      final fg = dark.textTheme.bodyLarge!.color!;
      expect(bg.computeLuminance(), lessThan(fg.computeLuminance()));
    });

    test('theme brightness matches request', () {
      expect(AppTheme.light.brightness, Brightness.light);
      expect(AppTheme.dark.brightness, Brightness.dark);
    });
  });
}
