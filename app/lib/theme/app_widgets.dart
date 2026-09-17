import 'dart:math';
import 'package:flutter/material.dart';
import 'app_theme.dart';

/// Cute dotted pattern background for chat and home screens
class CutePatternBackground extends StatelessWidget {
  final Widget child;
  const CutePatternBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _CutePatternPainter(
        dotColor: AppTheme.isDark
            ? AppColors.greenDark.withAlpha(40)
            : AppColors.greenPale.withAlpha(60),
        heartColor: AppTheme.isDark
            ? AppColors.greenMedium.withAlpha(25)
            : AppColors.greenLight.withAlpha(35),
      ),
      child: child,
    );
  }
}

class _CutePatternPainter extends CustomPainter {
  final Color dotColor;
  final Color heartColor;
  _CutePatternPainter({required this.dotColor, required this.heartColor});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;

    // Small dots pattern
    paint.color = dotColor;
    final dotSpacing = 28.0;
    for (double x = 0; x < size.width; x += dotSpacing) {
      for (double y = 0; y < size.height; y += dotSpacing) {
        canvas.drawCircle(Offset(x, y), 1.5, paint);
      }
    }

    // Scattered tiny hearts (very subtle)
    paint.color = heartColor;
    final rng = Random(42);
    for (int i = 0; i < 12; i++) {
      final x = rng.nextDouble() * size.width;
      final y = rng.nextDouble() * size.height;
      _drawTinyHeart(canvas, Offset(x, y), 4.0, paint);
    }
  }

  void _drawTinyHeart(Canvas canvas, Offset center, double size, Paint paint) {
    final path = Path();
    path.moveTo(center.dx, center.dy + size * 0.4);
    path.cubicTo(
      center.dx - size * 0.5, center.dy - size * 0.1,
      center.dx - size * 0.5, center.dy - size * 0.6,
      center.dx, center.dy - size * 0.3,
    );
    path.cubicTo(
      center.dx + size * 0.5, center.dy - size * 0.6,
      center.dx + size * 0.5, center.dy - size * 0.1,
      center.dx, center.dy + size * 0.4,
    );
    path.close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _CutePatternPainter old) => old.dotColor != dotColor;
}

/// Animated floating sparkle dots for the home screen
class FloatingSparkles extends StatefulWidget {
  final int count;
  const FloatingSparkles({super.key, this.count = 6});

  @override
  State<FloatingSparkles> createState() => _FloatingSparklesState();
}

class _FloatingSparklesState extends State<FloatingSparkles>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final List<_SparkleData> _sparkles;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(seconds: 8))..repeat();
    final rng = Random();
    _sparkles = List.generate(widget.count, (_) => _SparkleData(
      x: rng.nextDouble(),
      y: rng.nextDouble(),
      size: 3.0 + rng.nextDouble() * 4,
      speed: 0.3 + rng.nextDouble() * 0.5,
      phase: rng.nextDouble() * pi * 2,
    ));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (context, _) {
        return CustomPaint(
          painter: _SparklePainter(
            sparkles: _sparkles,
            progress: _ctrl.value,
            color: AppTheme.isDark
                ? AppColors.greenLight.withAlpha(50)
                : AppColors.greenMedium.withAlpha(45),
          ),
          size: Size.infinite,
        );
      },
    );
  }
}

class _SparkleData {
  final double x, y, size, speed, phase;
  _SparkleData({required this.x, required this.y, required this.size,
      required this.speed, required this.phase});
}

class _SparklePainter extends CustomPainter {
  final List<_SparkleData> sparkles;
  final double progress;
  final Color color;
  _SparklePainter({required this.sparkles, required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;
    for (final s in sparkles) {
      final t = (progress * s.speed + s.phase / (2 * pi)) % 1.0;
      final alpha = (sin(t * pi) * 200 + 55).clamp(0, 255).toInt();
      paint.color = color.withAlpha(alpha);
      final dy = s.y * size.height + sin(t * 2 * pi) * 10;
      canvas.drawCircle(Offset(s.x * size.width, dy), s.size, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _SparklePainter old) => old.progress != progress;
}

/// Smooth slide-up page transition
class SlideUpRoute<T> extends PageRouteBuilder<T> {
  final Widget page;
  SlideUpRoute({required this.page})
      : super(
          pageBuilder: (context, animation, secondaryAnimation) => page,
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            final tween = Tween(begin: const Offset(0, 0.08), end: Offset.zero)
                .chain(CurveTween(curve: Curves.easeOutCubic));
            final fadeTween = Tween(begin: 0.0, end: 1.0)
                .chain(CurveTween(curve: Curves.easeOut));
            return SlideTransition(
              position: animation.drive(tween),
              child: FadeTransition(opacity: animation.drive(fadeTween), child: child),
            );
          },
          transitionDuration: const Duration(milliseconds: 320),
        );
}

/// Cute bouncing press effect for buttons
class CutePressable extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  const CutePressable({super.key, required this.child, this.onTap});

  @override
  State<CutePressable> createState() => _CutePressableState();
}

class _CutePressableState extends State<CutePressable>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 120));
    _scale = Tween(begin: 1.0, end: 0.95).animate(
        CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _ctrl.forward(),
      onTapUp: (_) { _ctrl.reverse(); widget.onTap?.call(); },
      onTapCancel: () => _ctrl.reverse(),
      child: AnimatedBuilder(
        animation: _scale,
        builder: (context, child) => Transform.scale(scale: _scale.value, child: child),
        child: widget.child,
      ),
    );
  }
}
