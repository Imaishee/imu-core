import 'dart:async';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_theme.dart';

/// Full-screen user search with real-time debounced lookup.
/// Search by name or email. Shows friend request status for each result.
class UserSearchScreen extends StatefulWidget {
  const UserSearchScreen({super.key});

  @override
  State<UserSearchScreen> createState() => _UserSearchScreenState();
}

class _UserSearchScreenState extends State<UserSearchScreen> {
  final _searchCtrl = TextEditingController();
  final _focusNode = FocusNode();
  List<Map<String, dynamic>> _results = [];
  Map<String, String> _friendStatus = {}; // userId → 'none'|'sent'|'accepted'|'received'
  bool _loading = false;
  bool _searched = false;
  Timer? _debounce;

  String get _myId => Supabase.instance.client.auth.currentUser?.id ?? '';

  @override
  void initState() {
    super.initState();
    _focusNode.requestFocus();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  // ─── Search ──────────────────────────────────────────────────────

  void _onSearchChanged(String query) {
    _debounce?.cancel();
    if (query.trim().length < 2) {
      setState(() {
        _results = [];
        _searched = false;
      });
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 400), () {
      _search(query.trim());
    });
  }

  Future<void> _search(String query) async {
    setState(() => _loading = true);
    try {
      // Search by name OR email — only show visible users
      final nameFuture = Supabase.instance.client
          .from('profiles')
          .select('id, name, user_id')
          .neq('id', _myId)
          .eq('is_visible', true)
          .ilike('name', '%$query%')
          .limit(15);

      final idFuture = Supabase.instance.client
          .from('profiles')
          .select('id, name, user_id')
          .neq('id', _myId)
          .eq('is_visible', true)
          .ilike('id', '%$query%')
          .limit(10);

      final [nameResult, idResult] = await Future.wait([nameFuture, idFuture]);

      // Merge & deduplicate
      final Map<String, Map<String, dynamic>> merged = {};
      for (final row in [...nameResult, ...idResult]) {
        merged[row['id']] = row;
      }
      final results = merged.values.toList();

      // Check existing friend relationships
      await _checkFriendStatuses(results.map((r) => r['id'] as String).toList());

      if (mounted) {
        setState(() {
          _results = results;
          _searched = true;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _checkFriendStatuses(List<String> userIds) async {
    if (userIds.isEmpty) return;
    try {
      // Friends I sent
      final sent = await Supabase.instance.client
          .from('friends')
          .select('friend_id, status')
          .eq('user_id', _myId)
          .inFilter('friend_id', userIds) as List<Map<String, dynamic>>;

      // Friends who sent to me
      final received = await Supabase.instance.client
          .from('friends')
          .select('user_id, status')
          .eq('friend_id', _myId)
          .inFilter('user_id', userIds) as List<Map<String, dynamic>>;

      final Map<String, String> statuses = {};
      for (final row in sent) {
        statuses[row['friend_id']] = row['status'] ?? 'none';
      }
      for (final row in received) {
        final uid = row['user_id'];
        final existing = statuses[uid];
        if (existing == 'accepted' || row['status'] == 'accepted') {
          statuses[uid] = 'accepted';
        } else if (existing == null) {
          statuses[uid] = 'received';
        }
      }

      if (mounted) setState(() => _friendStatus = statuses);
    } catch (_) {}
  }

  // ─── Friend Request ──────────────────────────────────────────────

  Future<void> _sendRequest(String targetId) async {
    try {
      // Check if target user allows friend requests
      final profile = await Supabase.instance.client
          .from('profiles')
          .select('allow_friend_requests')
          .eq('id', targetId)
          .maybeSingle();

      if (profile != null && profile['allow_friend_requests'] == false) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('This user is not accepting friend requests'),
              backgroundColor: Colors.orange,
            ),
          );
        }
        return;
      }

      await Supabase.instance.client.from('friends').insert({
        'user_id': _myId,
        'friend_id': targetId,
        'status': 'pending',
      });
      setState(() => _friendStatus[targetId] = 'sent');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Friend request sent! 💚')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e')),
        );
      }
    }
  }

  Future<void> _acceptRequest(String targetId) async {
    try {
      await Supabase.instance.client
          .from('friends')
          .update({'status': 'accepted', 'updated_at': DateTime.now().toIso8601String()})
          .eq('user_id', targetId)
          .eq('friend_id', _myId);
      setState(() => _friendStatus[targetId] = 'accepted');
    } catch (e) {
      debugPrint('Error accepting: $e');
    }
  }

  // ─── UI ──────────────────────────────────────────────────────────

  Widget _buildTrailing(String userId) {
    final status = _friendStatus[userId] ?? 'none';
    switch (status) {
      case 'accepted':
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: AppColors.greenPrimary.withAlpha(25),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Text('Friends', style: TextStyle(color: AppColors.greenPrimary, fontSize: 11, fontWeight: FontWeight.w600)),
        );
      case 'sent':
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: Colors.orange.withAlpha(25),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Text('Sent', style: TextStyle(color: Colors.orange, fontSize: 11, fontWeight: FontWeight.w600)),
        );
      case 'received':
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _iconBtn(Icons.check_circle, AppColors.greenPrimary, () => _acceptRequest(userId)),
            const SizedBox(width: 4),
            _iconBtn(Icons.cancel, Colors.red.shade400, () {}),
          ],
        );
      default:
        return _iconBtn(Icons.person_add, AppColors.greenPrimary, () => _sendRequest(userId));
    }
  }

  Widget _iconBtn(IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: color.withAlpha(20),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: color, size: 20),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        backgroundColor: AppTheme.bg,
        title: Text('Find Users', style: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w700)),
      ),
      body: Column(
        children: [
          // ── Search bar ──
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              controller: _searchCtrl,
              focusNode: _focusNode,
              onChanged: _onSearchChanged,
              style: TextStyle(color: AppTheme.textMain),
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search by name or email...',
                hintStyle: TextStyle(color: AppTheme.textMuted),
                prefixIcon: Icon(Icons.search, color: AppColors.greenMedium),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: Icon(Icons.close, color: AppTheme.textMuted, size: 18),
                        onPressed: () {
                          _searchCtrl.clear();
                          setState(() {
                            _results = [];
                            _searched = false;
                          });
                        },
                      )
                    : null,
                filled: true,
                fillColor: AppTheme.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: AppTheme.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: AppTheme.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: AppColors.greenLight, width: 1.4),
                ),
              ),
            ),
          ),

          // ── Results ──
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.greenPrimary))
                : !_searched
                    ? _buildHint()
                    : _results.isEmpty
                        ? _buildEmpty()
                        : ListView.separated(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            itemCount: _results.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 4),
                            itemBuilder: (context, index) {
                              final user = _results[index];
                              final name = user['name'] ?? 'Unknown';
                              return Container(
                                decoration: BoxDecoration(
                                  color: AppTheme.surface,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(color: AppTheme.border),
                                ),
                                child: ListTile(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                                  leading: CircleAvatar(
                                    radius: 20,
                                    backgroundColor: AppColors.greenMint,
                                    child: Text(
                                      name[0].toUpperCase(),
                                      style: const TextStyle(color: AppColors.greenPrimary, fontWeight: FontWeight.w700, fontSize: 16),
                                    ),
                                  ),
                                  title: Text(name, style: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w500)),
                                  subtitle: Text(
                                    user['id']?.toString().substring(0, 8) ?? '',
                                    style: TextStyle(color: AppTheme.textMuted, fontSize: 11),
                                  ),
                                  trailing: _buildTrailing(user['id']),
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildHint() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.search, size: 56, color: AppTheme.textMuted.withAlpha(60)),
          const SizedBox(height: 12),
          Text(
            'Type a name to find users',
            style: TextStyle(color: AppTheme.textMuted, fontSize: 14),
          ),
          const SizedBox(height: 4),
          Text(
            'Search works with names and user IDs',
            style: TextStyle(color: AppTheme.textMuted.withAlpha(120), fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.person_search, size: 56, color: AppTheme.textMuted.withAlpha(60)),
          const SizedBox(height: 12),
          Text(
            'No users found',
            style: TextStyle(color: AppTheme.textMuted, fontSize: 14),
          ),
          const SizedBox(height: 4),
          Text(
            'Try a different search term',
            style: TextStyle(color: AppTheme.textMuted.withAlpha(120), fontSize: 12),
          ),
        ],
      ),
    );
  }
}
