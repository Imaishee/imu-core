import 'dart:ui';
import 'package:flutter/material.dart';

/// I'MU Liquid Glass + Cream/Green theme
class AppColors {
  // Cream palette (light)
  static const creamBg = Color(0xFFFBF6EC);
  static const creamSurface = Color(0xFFFFFDF8);
  static const creamElevated = Color(0xFFFFFFFF);
  static const creamBorder = Color(0xFFE9E0CE);

  // Green accents
  static const greenPrimary = Color(0xFF2D6A4F);
  static const greenDark = Color(0xFF1B4332);
  static const greenMedium = Color(0xFF40916C);
  static const greenLight = Color(0xFF52B788);
  static const greenPale = Color(0xFF95D5B2);
  static const greenMint = Color(0xFFD8F3DC);
  static const greenGold = Color(0xFFD4EDDA);

  // Dark palette (deep green/ink)
  static const darkBg = Color(0xFF0E1512);
  static const darkSurface = Color(0xFF16211C);
  static const darkElevated = Color(0xFF1C2A23);
  static const darkBorder = Color(0xFF2A3B32);

  // Text
  static const inkText = Color(0xFF1F2A24);
  static const inkMuted = Color(0xFF5C6B62);
  static const creamText = Color(0xFFEAF4EE);
  static const creamMuted = Color(0xFF9DB3A6);

  static const error = Color(0xFFB3541E);
}

class AppTheme {
  static bool isDark = false;

  static const _radius = 18.0;
  static const blurSigma = 18.0;

  static bool get isDarkMode => isDark;

  /// Set once from the app's actual theme mode so static getters stay consistent.
  static void setDark(bool value) => isDark = value;

  static Color get bg => isDark ? AppColors.darkBg : AppColors.creamBg;
  static Color get surface => isDark ? AppColors.darkSurface : AppColors.creamSurface;
  static Color get elevated => isDark ? AppColors.darkElevated : AppColors.creamElevated;
  static Color get border => isDark ? AppColors.darkBorder : AppColors.creamBorder;
  static Color get creamBg => AppColors.creamBg;
  static Color get darkBg => AppColors.darkBg;
  static Color get primary => AppColors.greenPrimary;
  static Color get primaryBright => isDark ? AppColors.greenLight : AppColors.greenMedium;
  static Color get textMain => isDark ? AppColors.creamText : AppColors.inkText;
  static Color get textMuted => isDark ? AppColors.creamMuted : AppColors.inkMuted;
  static Color get textSoft => isDark ? Colors.white38 : AppColors.inkMuted.withAlpha(140);
  static Color get primaryContainer => isDark ? AppColors.greenDark : AppColors.greenMint;
  static Color get onPrimary => Colors.white;

  static ThemeData get light => _build(Brightness.light);
  static ThemeData get dark => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final dark = brightness == Brightness.dark;
    final bgColor = dark ? AppColors.darkBg : AppColors.creamBg;
    final surfaceColor = dark ? AppColors.darkSurface : AppColors.creamSurface;
    final borderColor = dark ? AppColors.darkBorder : AppColors.creamBorder;
    final textColor = dark ? AppColors.creamText : AppColors.inkText;
    final mutedColor = dark ? AppColors.creamMuted : AppColors.inkMuted;

    final scheme = ColorScheme.fromSeed(
      seedColor: AppColors.greenPrimary,
      brightness: brightness,
      primary: AppColors.greenPrimary,
      surface: surfaceColor,
    ).copyWith(
      primary: AppColors.greenPrimary,
      onPrimary: Colors.white,
      secondary: AppColors.greenMedium,
      surface: surfaceColor,
      onSurface: textColor,
      error: AppColors.error,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: bgColor,
      fontFamily: 'SF Pro Display',
      textTheme: TextTheme(
        titleLarge: TextStyle(fontWeight: FontWeight.w700, color: textColor, letterSpacing: -0.5),
        titleMedium: TextStyle(fontWeight: FontWeight.w600, color: textColor),
        bodyLarge: TextStyle(color: textColor, height: 1.45),
        bodyMedium: TextStyle(color: textColor, height: 1.45),
        bodySmall: TextStyle(color: mutedColor),
        labelLarge: TextStyle(fontWeight: FontWeight.w600, color: textColor),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: textColor),
        titleTextStyle: TextStyle(fontWeight: FontWeight.w700, fontSize: 20, color: textColor, letterSpacing: -0.4),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: surfaceColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radius)),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceColor,
        hintStyle: TextStyle(color: mutedColor),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: borderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: AppColors.greenLight, width: 1.4),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.greenPrimary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: surfaceColor,
          foregroundColor: textColor,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: surfaceColor,
        side: BorderSide(color: borderColor),
        labelStyle: TextStyle(color: textColor, fontSize: 13),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      dividerTheme: DividerThemeData(color: borderColor, thickness: 1),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((s) =>
            s.contains(WidgetState.selected) ? Colors.white : mutedColor),
        trackColor: WidgetStateProperty.resolveWith((s) =>
            s.contains(WidgetState.selected) ? AppColors.greenMedium : borderColor),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: bgColor.withAlpha(240),
        modalBackgroundColor: bgColor,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: dark ? AppColors.darkElevated : Colors.white,
        contentTextStyle: TextStyle(color: textColor),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: surfaceColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      ),
      popupMenuTheme: PopupMenuThemeData(color: surfaceColor, surfaceTintColor: Colors.transparent),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: bgColor,
        indicatorColor: AppColors.greenMint,
        labelTextStyle: WidgetStateProperty.all(TextStyle(color: textColor, fontSize: 11)),
      ),
    );
  }
}

/// Frosted glass container — iOS Liquid Glass look
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;
  final BorderRadius? borderRadius;
  final Color? tint;
  final double? blur;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final Color? borderColor;

  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin = EdgeInsets.zero,
    this.borderRadius,
    this.tint,
    this.blur = AppTheme.blurSigma,
    this.onTap,
    this.onLongPress,
    this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final radius = borderRadius ?? BorderRadius.circular(AppTheme._radius);
    final t = tint ??
        (isDark
            ? const Color(0x66FFFFFF)
            : const Color(0x8CFFFFFF));

    Widget card = ClipRRect(
      borderRadius: radius,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur!, sigmaY: blur!),
        child: Container(
          padding: padding,
          margin: margin,
          decoration: BoxDecoration(
            color: t,
            borderRadius: radius,
            border: Border.all(color: borderColor ?? (isDark ? const Color(0x33FFFFFF) : const Color(0x26FFFFFF))),
            boxShadow: [
              BoxShadow(
                color: (isDark ? Colors.black : AppColors.greenDark).withAlpha(14),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: child,
        ),
      ),
    );

    if (onTap != null || onLongPress != null) {
      card = GestureDetector(onTap: onTap, onLongPress: onLongPress, child: card);
    }
    return card;
  }
}

/// Subtle top highlight like real liquid glass
class GlassHighlight extends StatelessWidget {
  final Widget child;
  const GlassHighlight({super.key, required this.child});
  @override
  Widget build(BuildContext context) {
    return ShaderMask(
      shaderCallback: (rect) => LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          Colors.white.withAlpha(70),
          Colors.white.withAlpha(8),
        ],
        stops: const [0.0, 0.4],
      ).createShader(rect),
      blendMode: BlendMode.overlay,
      child: child,
    );
  }
}