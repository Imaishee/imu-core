import 'package:flutter/foundation.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:speech_to_text/speech_recognition_result.dart';

/// Hold-to-talk voice input service.
/// User holds mic button → listening starts → release → text auto-sends.
class VoiceService {
  final SpeechToText _speech = SpeechToText();
  bool _initialized = false;
  bool _listening = false;

  bool get isListening => _listening;

  /// Initialize speech recognition (call once at startup).
  Future<bool> initialize() async {
    if (_initialized) return _speech.isAvailable;
    _initialized = true;
    try {
      return await _speech.initialize(
        onError: (error) => debugPrint('Speech error: ${error.errorMsg}'),
        onStatus: (status) => debugPrint('Speech status: $status'),
      );
    } catch (e) {
      debugPrint('Speech init failed: $e');
      return false;
    }
  }

  /// Start listening. Calls [onResult] with partial/final text.
  /// User should call [stopListening] when they release the mic button.
  Future<void> startListening({
    required void Function(String text, bool isFinal) onResult,
  }) async {
    if (_listening) return;

    final available = await initialize();
    if (!available) return;

    _listening = true;
    await _speech.listen(
      onResult: (SpeechRecognitionResult result) {
        onResult(result.recognizedWords, result.finalResult);
      },
      listenFor: const Duration(seconds: 30),
      pauseFor: const Duration(seconds: 3),
      localeId: 'en_US',
      cancelOnError: true,
      partialResults: true,
    );
  }

  /// Stop listening and return the last recognized text.
  Future<String> stopListening() async {
    if (!_listening) return '';
    _listening = false;
    await _speech.stop();
    return _speech.lastRecognizedWords;
  }

  /// Cancel listening without returning text.
  Future<void> cancelListening() async {
    _listening = false;
    await _speech.cancel();
  }

  void dispose() {
    _speech.cancel();
  }
}
