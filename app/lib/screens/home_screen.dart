import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/chat_provider.dart';
import '../constants/app_constants.dart';
import 'chat_screen.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final conversations = ref.watch(conversationsProvider);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Center(
                          child: Text('IM', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text("IM'U", style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                          Text(AppConstants.appVersion, style: TextStyle(color: Colors.white.withAlpha(102), fontSize: 10)),
                        ],
                      ),
                    ],
                  ),
                  IconButton(
                    onPressed: () => Navigator.pushNamed(context, '/settings'),
                    icon: const Icon(Icons.settings_outlined, color: Colors.white54, size: 22),
                  ),
                ],
              ),
            ),

            if (conversations.isNotEmpty) ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Recent', style: TextStyle(color: Colors.white.withAlpha(153), fontSize: 13, fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 100,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: conversations.length.clamp(0, 10),
                  itemBuilder: (context, index) {
                    final convo = conversations[index];
                    return GestureDetector(
                      onTap: () {
                        ref.read(activeConversationProvider.notifier).set(convo.remoteId);
                        Navigator.push(context, MaterialPageRoute(
                          builder: (_) => ChatScreen(conversationId: convo.remoteId),
                        ));
                      },
                      child: Container(
                        width: 140,
                        margin: const EdgeInsets.only(right: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF18181B),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFF27272A)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.chat_bubble_outline, color: Colors.white38, size: 18),
                            const Spacer(),
                            Text(
                              convo.title,
                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w500),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),
            ],

            Expanded(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(color: Colors.white.withAlpha(25), blurRadius: 40),
                          ],
                        ),
                        child: const Center(
                          child: Text('IM', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 24)),
                        ),
                      ),
                      const SizedBox(height: 32),
                      const Text(
                        'What can I help with?',
                        style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Ask me anything — studies, research, writing, code.',
                        style: TextStyle(fontSize: 16, color: Colors.white.withAlpha(153)),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 32),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        alignment: WrapAlignment.center,
                        children: [
                          _quickPrompt(context, ref, 'Write an essay', 'Help me write an essay about climate change'),
                          _quickPrompt(context, ref, 'Solve a problem', 'Explain the water cycle in simple terms'),
                          _quickPrompt(context, ref, 'Brainstorm ideas', 'Give me project ideas for my class'),
                          _quickPrompt(context, ref, 'Study a topic', 'Teach me about plate tectonics'),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () {
                    final convo = ref.read(conversationsProvider.notifier).createChat();
                    ref.read(activeConversationProvider.notifier).set(convo.remoteId);
                    Navigator.push(context, MaterialPageRoute(
                      builder: (_) => ChatScreen(conversationId: convo.remoteId),
                    ));
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26)),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.chat_bubble_outline, size: 20),
                      SizedBox(width: 8),
                      Text('Start Chatting', style: TextStyle(fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _quickPrompt(BuildContext context, WidgetRef ref, String label, String prompt) {
    return GestureDetector(
      onTap: () {
        final convo = ref.read(conversationsProvider.notifier).createChat();
        ref.read(activeConversationProvider.notifier).set(convo.remoteId);
        Navigator.push(context, MaterialPageRoute(
          builder: (_) => ChatScreen(conversationId: convo.remoteId, initialPrompt: prompt),
        ));
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFF18181B),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFF27272A)),
        ),
        child: Text(label, style: TextStyle(color: Colors.white.withAlpha(200), fontSize: 13)),
      ),
    );
  }
}
