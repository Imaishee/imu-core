import 'package:flutter_test/flutter_test.dart';
import 'package:imu_app/models/alarm_item.dart';
import 'package:imu_app/models/class_schedule.dart';
import 'package:imu_app/providers/chat_provider.dart';
import 'package:imu_app/services/ai_actions_service.dart';
import 'package:imu_app/services/alarm_service.dart';

void main() {
  group('AlarmItem repeat days', () {
    test('migrates the legacy display string into real day numbers', () {
      final item = AlarmItem.fromMap({
        'id': 1,
        'label': 'Gym',
        'time': '06:30',
        'day': 'Mon, Wed',
        'enabled': true,
      });
      expect(item.days, [1, 3],
          reason: 'the old string was stored but never used for scheduling');
    });

    test('legacy "One-time" maps to no repeat days', () {
      final item = AlarmItem.fromMap(
          {'id': 1, 'label': 'x', 'time': '09:00', 'day': 'One-time'});
      expect(item.days, isEmpty);
    });

    test('round-trips the new days list', () {
      const item = AlarmItem(
          id: 5, label: 'Class', time: '08:00', days: [1, 5, 7]);
      final restored = AlarmItem.fromMap(item.toMap());
      expect(restored.days, [1, 5, 7]);
      expect(restored.time, '08:00');
    });

    test('deduplicates and sorts invalid/duplicate day input', () {
      final item = AlarmItem.fromMap({
        'id': 1,
        'label': 'x',
        'time': '09:00',
        'days': [3, 1, 1, 9, 0],
      });
      expect(item.days, [1, 3]);
    });

    test('dayString describes one-time, every day and subsets', () {
      expect(const AlarmItem(id: 1, label: 'a', time: '07:00').dayString,
          '07:00 · One-time');
      expect(
          const AlarmItem(id: 1, label: 'a', time: '07:00', days: [1, 2, 3, 4, 5, 6, 7])
              .dayString,
          '07:00 · Every day');
      expect(
          const AlarmItem(id: 1, label: 'a', time: '07:00', days: [1, 3]).dayString,
          '07:00 · Mon, Wed');
    });
  });

  group('AlarmService notification ids', () {
    test('stay inside Android 32-bit range', () {
      final huge = DateTime.now().millisecondsSinceEpoch;
      for (var d = 0; d < 7; d++) {
        final id = AlarmService.alarmNotificationId(huge, d);
        expect(id, greaterThanOrEqualTo(0));
        expect(id, lessThan(2147483647),
            reason: 'oversized ids collide after Android narrows them to int');
      }
    });

    test('are unique per day for the same alarm', () {
      final ids = {for (var d = 0; d < 7; d++) AlarmService.alarmNotificationId(123456, d)};
      expect(ids.length, 7);
    });

    test('differ between alarms', () {
      expect(AlarmService.alarmNotificationId(111, 0),
          isNot(AlarmService.alarmNotificationId(222, 0)));
    });
  });

  group('AI action time normalisation', () {
    test('passes 24h times through', () {
      expect(AiActionsService.normalizeTime('09:00'), '09:00');
      expect(AiActionsService.normalizeTime('23:59'), '23:59');
    });

    test('expands single-digit hours and bare hours', () {
      expect(AiActionsService.normalizeTime('7:00'), '07:00');
      expect(AiActionsService.normalizeTime('7'), '07:00');
    });

    test('converts 12-hour clock including midnight and noon', () {
      expect(AiActionsService.normalizeTime('7:00 PM'), '19:00');
      expect(AiActionsService.normalizeTime('2:00pm'), '14:00');
      expect(AiActionsService.normalizeTime('12:30 PM'), '12:30');
      expect(AiActionsService.normalizeTime('12:00 AM'), '00:00');
      expect(AiActionsService.normalizeTime('12:00 PM'), '12:00');
    });

    test('falls back to a sane default when unparseable', () {
      expect(AiActionsService.normalizeTime(''), '08:00');
      expect(AiActionsService.normalizeTime('later'), '08:00');
    });
  });

  group('AI action day normalisation', () {
    test('resolves abbreviations and case', () {
      expect(AiActionsService.normalizeDay('mon'), 'Monday');
      expect(AiActionsService.normalizeDay('WEDNESDAY'), 'Wednesday');
      expect(AiActionsService.normalizeDay('fri'), 'Friday');
    });

    test('normalises weekday numbers for alarms', () {
      expect(AiActionsService.normalizeDays([3, 1, 1, 9]), [1, 3]);
      expect(AiActionsService.normalizeDays(null), isEmpty);
      expect(AiActionsService.normalizeDays('Mon'), isEmpty);
    });

    test('formats display time', () {
      expect(AiActionsService.prettyTime('00:00'), '12:00 AM');
      expect(AiActionsService.prettyTime('07:05'), '7:05 AM');
      expect(AiActionsService.prettyTime('13:05'), '1:05 PM');
    });
  });

  group('Timetable dedupe', () {
    ClassSchedule cls(String code, String day, String start) => ClassSchedule(
          id: '$code-$day-$start',
          courseName: 'Course $code',
          courseCode: code,
          day: day,
          startTime: start,
          endTime: '10:00',
        );

    test('detects an identical course/day/time as a duplicate', () {
      final existing = [cls('CSE201', 'Monday', '09:00')];
      expect(AiActionsService.isDuplicate(existing, cls('CSE201', 'Monday', '09:00')),
          isTrue);
    });

    test('allows a different day or time', () {
      final existing = [cls('CSE201', 'Monday', '09:00')];
      expect(AiActionsService.isDuplicate(existing, cls('CSE201', 'Tuesday', '09:00')),
          isFalse);
      expect(AiActionsService.isDuplicate(existing, cls('CSE201', 'Monday', '11:00')),
          isFalse);
    });
  });

  group('Chat scheduling intent gate', () {
    test('routes scheduling-shaped messages to the action endpoint', () {
      expect(MessagesNotifier.looksLikeScheduling('set an alarm for 7am'), isTrue);
      expect(MessagesNotifier.looksLikeScheduling('add Data Structures on Monday'),
          isTrue);
      expect(MessagesNotifier.looksLikeScheduling('here is my timetable'), isTrue);
      expect(MessagesNotifier.looksLikeScheduling('remind me to study at 9'), isTrue);
      expect(MessagesNotifier.looksLikeScheduling('delete my class'), isTrue);
    });

    test('leaves ordinary chat on the streaming path', () {
      expect(MessagesNotifier.looksLikeScheduling('explain recursion'), isFalse);
      expect(MessagesNotifier.looksLikeScheduling('what is a stack'), isFalse);
      expect(MessagesNotifier.looksLikeScheduling('write me an essay'), isFalse);
    });
  });

  group('AiActionOutcome', () {
    test('reports changes and a human message', () {
      const outcome = AiActionOutcome(applied: ['Set alarm "Gym" at 6:30 AM']);
      expect(outcome.hasChanges, isTrue);
      expect(outcome.message, contains('Gym'));
    });

    test('is inert with no applied actions', () {
      const outcome = AiActionOutcome(reply: 'Sorry, I could not find that.');
      expect(outcome.hasChanges, isFalse);
    });
  });
}
