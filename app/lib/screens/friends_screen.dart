import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../theme/app_theme.dart';

/// Screen for managing friends and user-to-user chat
class FriendsScreen extends StatefulWidget {
  const FriendsScreen({super.key});

  @override
  State<FriendsScreen> createState() => _FriendsScreenState();
}

class _FriendsScreenState extends State<FriendsScreen> {
  List<Map<String, dynamic>> _friends = [];
  List<Map<String, dynamic>> _pendingRequests = [];
  bool _loading = true;
  final _searchCtrl = TextEditingController();
  List<Map<String, dynamic>> _searchResults = [];

  @override
  void initState() {
    super.initState();
    _loadFriends();
  }

  Future<void> _loadFriends() async {
    setState(() => _loading = true);
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;

      // Load accepted friends
      final { data: friends, error: friendsError } = await Supabase.instance.client
          .from('friends')
          .select('*, profiles!friends_friend_id_fkey(id, name, companion_gender)')
          .eq('user_id', user.id)
          .eq('status', 'accepted');

      if (friendsError == null && friends != null) {
        _friends = friends;
      }

      // Load pending requests (received)
      final { data: pending, error: pendingError } = await Supabase.instance.client
          .from('friends')
          .select('*, profiles!friends_user_id_fkey(id, name, companion_gender)')
          .eq('friend_id', user.id)
          .eq('status', 'pending');

      if (pendingError == null && pending != null) {
        _pendingRequests = pending;
      }
    } catch (e) {
      debugPrint('Error loading friends: $e');
    }
    setState(() => _loading = false);
  }

  Future<void> _searchUsers(String query) async {
    if (query.isEmpty) {
      setState(() => _searchResults = []);
      return;
    }

    try {
      final user = Supabase.instance.client.auth.currentUser;
      final { data, error } = await Supabase.instance.client
          .from('profiles')
          .select('id, name, email')
          .neq('id', user!.id)
          .ilike('name', '%$query%')
          .limit(10);

      if (error == null && data != null) {
        setState(() => _searchResults = data);
      }
    } catch (e) {
      debugPrint('Error searching users: $e');
    }
  }

  Future<void> _sendFriendRequest(String friendId) async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;

      await Supabase.instance.client.from('friends').insert({
        'user_id': user.id,
        'friend_id': friendId,
        'status': 'pending',
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Friend request sent! 💚')),
      );

      setState(() => _searchResults = []);
      _searchCtrl.clear();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  Future<void> _acceptRequest(String requestId) async {
    try {
      await Supabase.instance.client
          .from('friends')
          .update({'status': 'accepted', 'updated_at': DateTime.now().toIso8601String()})
          .eq('id', requestId);

      _loadFriends();
    } catch (e) {
      debugPrint('Error accepting request: $e');
    }
  }

  Future<void> _rejectRequest(String requestId) async {
    try {
      await Supabase.instance.client
          .from('friends')
          .delete()
          .eq('id', requestId);

      _loadFriends();
    } catch (e) {
      debugPrint('Error rejecting request: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        backgroundColor: AppTheme.bg,
        elevation: 0,
        title: Text('Friends', style: TextStyle(color: AppTheme.textMain, fontWeight: FontWeight.w600)),
        actions: [
          IconButton(
            icon: Icon(Icons.person_add_outlined, color: AppColors.greenMedium),
            onPressed: _showAddFriendDialog,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.greenPrimary))
          : RefreshIndicator(
              onRefresh: _loadFriends,
              child: CustomScrollView(
                slivers: [
                  // Search bar
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: TextField(
                        controller: _searchCtrl,
                        onChanged: _searchUsers,
                        style: TextStyle(color: AppTheme.textMain),
                        decoration: InputDecoration(
                          hintText: 'Search friends...',
                          hintStyle: TextStyle(color: AppTheme.textMuted),
                          prefixIcon: Icon(Icons.search, color: AppColors.greenMedium),
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
                  ),

                  // Search results
                  if (_searchResults.isNotEmpty)
                    SliverToBoxAdapter(
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: AppTheme.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: Column(
                          children: _searchResults.map((user) {
                            return ListTile(
                              leading: CircleAvatar(
                                backgroundColor: AppColors.greenMint,
                                child: Text(
                                  (user['name'] ?? 'U')[0].toUpperCase(),
                                  style: TextStyle(color: AppColors.greenPrimary),
                                ),
                              ),
                              title: Text(user['name'] ?? 'Unknown', style: TextStyle(color: AppTheme.textMain)),
                              subtitle: Text(user['email'] ?? '', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                              trailing: IconButton(
                                icon: Icon(Icons.person_add, color: AppColors.greenPrimary),
                                onPressed: () => _sendFriendRequest(user['id']),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ),

                  // Pending requests
                  if (_pendingRequests.isNotEmpty) ...[
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                        child: Text(
                          'Pending Requests',
                          style: TextStyle(
                            color: AppTheme.textMain,
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ),
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final request = _pendingRequests[index];
                          final sender = request['profiles'] ?? {};
                          return ListTile(
                            leading: CircleAvatar(
                              backgroundColor: AppColors.greenMint,
                              child: Text(
                                (sender['name'] ?? 'U')[0].toUpperCase(),
                                style: TextStyle(color: AppColors.greenPrimary),
                              ),
                            ),
                            title: Text(sender['name'] ?? 'Unknown', style: TextStyle(color: AppTheme.textMain)),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: Icon(Icons.check_circle, color: Colors.green),
                                  onPressed: () => _acceptRequest(request['id']),
                                ),
                                IconButton(
                                  icon: Icon(Icons.cancel, color: Colors.red),
                                  onPressed: () => _rejectRequest(request['id']),
                                ),
                              ],
                            ),
                          );
                        },
                        childCount: _pendingRequests.length,
                      ),
                    ),
                  ],

                  // Friends list
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                      child: Text(
                        _friends.isEmpty ? 'No friends yet' : 'Your Friends',
                        style: TextStyle(
                          color: AppTheme.textMain,
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ),
                  if (_friends.isEmpty)
                    SliverToBoxAdapter(
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Column(
                            children: [
                              Icon(Icons.people_outline, size: 64, color: AppTheme.textMuted),
                              const SizedBox(height: 16),
                              Text(
                                'No friends yet!\nTap + to add friends',
                                textAlign: TextAlign.center,
                                style: TextStyle(color: AppTheme.textMuted, fontSize: 14),
                              ),
                            ],
                          ),
                        ),
                      ),
                    )
                  else
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final friend = _friends[index];
                          final profile = friend['profiles'] ?? {};
                          return ListTile(
                            leading: CircleAvatar(
                              backgroundColor: AppColors.greenMint,
                              child: Text(
                                (profile['name'] ?? 'U')[0].toUpperCase(),
                                style: TextStyle(color: AppColors.greenPrimary),
                              ),
                            ),
                            title: Text(profile['name'] ?? 'Unknown', style: TextStyle(color: AppTheme.textMain)),
                            subtitle: Text('Tap to chat', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                            trailing: Icon(Icons.chevron_right, color: AppTheme.textMuted),
                            onTap: () {
                              // TODO: Open chat with friend
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Friend chat coming soon! 💬')),
                              );
                            },
                          );
                        },
                        childCount: _friends.length,
                      ),
                    ),
                ],
              ),
            ),
    );
  }

  void _showAddFriendDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.textMuted,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Add Friend',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textMain,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Search by name to send a friend request',
                style: TextStyle(color: AppTheme.textMuted),
              ),
              const SizedBox(height: 16),
              // This would open the full search screen
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    // Focus on search field
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.greenPrimary,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Search Friends'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
