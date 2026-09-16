import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/knowledge_service.dart';

final knowledgeServiceProvider = Provider((ref) => KnowledgeService());

final knowledgeNodesProvider = StateNotifierProvider<KnowledgeNotifier, List<Map<String, dynamic>>>((ref) {
  return KnowledgeNotifier(ref);
});

class KnowledgeNotifier extends StateNotifier<List<Map<String, dynamic>>> {
  final Ref _ref;

  KnowledgeNotifier(this._ref) : super([]);

  Future<void> extractFromConversation(String text) async {
    final nodes = await _ref.read(knowledgeServiceProvider).extractKnowledge(text);
    state = [...state, ...nodes];
  }

  Future<void> loadKnowledge() async {
    final nodes = await _ref.read(knowledgeServiceProvider).queryKnowledge();
    state = nodes;
  }
}

final knowledgeGraphProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.read(knowledgeServiceProvider).getFullGraph();
});
