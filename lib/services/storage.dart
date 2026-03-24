import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

class StorageService {
  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  static SharedPreferences get _p => _prefs!;

  static List<Map<String, dynamic>> _loadList(String key) {
    try {
      final raw = _p.getString(key);
      if (raw == null) return [];
      return List<Map<String, dynamic>>.from(jsonDecode(raw) as List);
    } catch (_) { return []; }
  }

  static Future<void> _saveList(String key, List<Map<String, dynamic>> data) =>
      _p.setString(key, jsonEncode(data));

  static int _nextId(String key) {
    final n = (_p.getInt(key) ?? 0) + 1;
    _p.setInt(key, n);
    return n;
  }

  static String _receiptId() =>
      'RQ-${DateTime.now().millisecondsSinceEpoch.toRadixString(36).toUpperCase().substring(2, 8)}';

  // ── Onboarding ────────────────────────────────────────────────────────────
  static bool isOnboarded() => _p.getBool('rq:onboarded') ?? false;
  static Future<void> setOnboarded() => _p.setBool('rq:onboarded', true);

  // ── Generic key-value (used by admin_website for GitHub token) ───────────
  static String? getString(String key) => _p.getString(key);
  static Future<void> setString(String key, String value) =>
      _p.setString(key, value);

  // ── Theme ─────────────────────────────────────────────────────────────────
  static String getThemeName() => _p.getString('rq:theme') ?? 'light:oceanBreeze';
  static Future<void> setThemeName(String mode) => _p.setString('rq:theme', mode);


  // ── Quads ─────────────────────────────────────────────────────────────────
  static List<Quad> getQuads() {
    final list = _loadList('rq:quads');
    if (list.isEmpty) {
      final seed = List.generate(5, (i) => Quad(id: i + 1, name: 'Quad ${i + 1}', status: 'available'));
      _saveList('rq:quads', seed.map((q) => q.toJson()).toList());
      _p.setInt('rq:quad_seq', 5);
      return seed;
    }
    final active = getBookings().where((b) => b.status == 'active').map((b) => b.quadId).toSet();
    return list.map((j) {
      final q = Quad.fromJson(j);
      if (q.status == 'rented' && !active.contains(q.id)) return q.copyWith(status: 'available');
      return q;
    }).toList();
  }

  static Future<void> saveQuads(List<Quad> quads) =>
      _saveList('rq:quads', quads.map((q) => q.toJson()).toList());

  static Future<Quad> addQuad(String name, {String? imei}) async {
    final quads = getQuads();
    final q = Quad(id: _nextId('rq:quad_seq'), name: name.trim(), status: 'available', imei: imei);
    await saveQuads([...quads, q]);
    return q;
  }

  static Future<void> updateQuad(int id, {String? name, String? status, String? imei}) async {
    final quads = getQuads().map((q) {
      if (q.id != id) return q;
      return Quad(id: q.id, name: name ?? q.name, status: status ?? q.status,
        imageUrl: q.imageUrl, imei: imei ?? q.imei);
    }).toList();
    await saveQuads(quads);
  }

  // ── Bookings ──────────────────────────────────────────────────────────────
  static List<Booking> getBookings() =>
      _loadList('rq:bookings').map(Booking.fromJson).toList();

  static Future<void> saveBookings(List<Booking> bookings) =>
      _saveList('rq:bookings', bookings.map((b) => b.toJson()).toList());

  static List<Booking> getActive() =>
      getBookings().where((b) => b.status == 'active').toList();

  static List<Booking> getHistory() {
    final all = getBookings().where((b) => b.status == 'completed').toList();
    all.sort((a, b) => b.startTime.compareTo(a.startTime));
    return all;
  }

  static Future<Booking> createBooking({
    required int quadId, int? userId,
    required String customerName, required String customerPhone,
    required int duration, required int price, int? originalPrice,
    String? promoCode, int groupSize = 1, int depositAmount = 0,
    String? mpesaRef, bool waiverSigned = false,
    String? guideName,
  }) async {
    final quads = getQuads();
    final quad = quads.firstWhere((q) => q.id == quadId,
        orElse: () => throw Exception('Quad not found'));
    if (quad.status != 'available') throw Exception('Quad is not available');

    final booking = Booking(
      id: _nextId('rq:booking_seq'), quadId: quadId, userId: userId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.replaceAll(RegExp(r'[\s\-().]+'), ''),
      duration: duration, price: price,
      originalPrice: originalPrice ?? price,
      promoCode: promoCode, startTime: DateTime.now(),
      status: 'active', receiptId: _receiptId(),
      quadName: quad.name, quadImageUrl: quad.imageUrl,
      waiverSigned: waiverSigned, groupSize: groupSize,
      depositAmount: depositAmount,
      mpesaRef: mpesaRef?.trim().toUpperCase(),
      guideName: guideName?.trim().isEmpty == true ? null : guideName?.trim(),
    );

    await saveBookings([...getBookings(), booking]);
    await saveQuads(quads.map((q) => q.id == quadId ? q.copyWith(status: 'rented') : q).toList());
    return booking;
  }

  static Future<void> toggleGuidePaid(int id) async {
    final bookings = getBookings().map((b) {
      if (b.id != id) return b;
      return b.copyWith(guidePaid: !b.guidePaid);
    }).toList();
    await saveBookings(bookings);
  }

  static Future<void> completeBooking(int id, int overtimeMins) async {
    int quadId = 0;
    final bookings = getBookings().map((b) {
      if (b.id != id) return b;
      quadId = b.quadId;
      return b.copyWith(
        status: 'completed', endTime: DateTime.now(),
        overtimeMinutes: overtimeMins,
        overtimeCharge: overtimeMins * kOvertimeRate,
      );
    }).toList();
    await saveBookings(bookings);
    if (quadId != 0) await updateQuad(quadId, status: 'available');
  }

  static Future<void> submitFeedback(int id, int rating, String feedback) async {
    final bookings = getBookings().map((b) =>
        b.id == id ? b.copyWith(rating: rating, feedback: feedback) : b).toList();
    await saveBookings(bookings);
  }

  /// Extend a booking by [addedMins] minutes and add [addedPrice] to its price.
  static Future<void> extendBooking(int id, int addedMins, int addedPrice) async {
    final bookings = getBookings().map((b) {
      if (b.id != id) return b;
      // Rebuild with extended duration and updated price
      return Booking(
        id: b.id, quadId: b.quadId, userId: b.userId,
        customerName: b.customerName, customerPhone: b.customerPhone,
        duration: b.duration + addedMins,
        price: b.price + addedPrice,
        originalPrice: b.originalPrice,
        promoCode: b.promoCode,
        startTime: b.startTime, endTime: b.endTime,
        status: b.status, receiptId: b.receiptId,
        rating: b.rating, feedback: b.feedback,
        quadName: b.quadName, quadImageUrl: b.quadImageUrl,
        waiverSigned: b.waiverSigned, groupSize: b.groupSize,
        depositAmount: b.depositAmount, depositReturned: b.depositReturned,
        overtimeMinutes: b.overtimeMinutes, overtimeCharge: b.overtimeCharge,
        mpesaRef: b.mpesaRef,
      );
    }).toList();
    await saveBookings(bookings);
  }

  /// Mark deposit as returned.
  static Future<void> returnDeposit(int id) async {
    final bookings = getBookings().map((b) {
      if (b.id != id) return b;
      return b.copyWith(depositReturned: true);
    }).toList();
    await saveBookings(bookings);
  }

  /// Update only the M-Pesa reference on a booking.
  static Future<void> updateBookingMpesa(int id, String mpesaRef) async {
    final bookings = getBookings().map((b) {
      if (b.id != id) return b;
      return Booking(
        id: b.id, quadId: b.quadId, userId: b.userId,
        customerName: b.customerName, customerPhone: b.customerPhone,
        duration: b.duration, price: b.price, originalPrice: b.originalPrice,
        promoCode: b.promoCode, startTime: b.startTime, endTime: b.endTime,
        status: b.status, receiptId: b.receiptId,
        rating: b.rating, feedback: b.feedback,
        quadName: b.quadName, quadImageUrl: b.quadImageUrl,
        waiverSigned: b.waiverSigned, groupSize: b.groupSize,
        depositAmount: b.depositAmount, depositReturned: b.depositReturned,
        overtimeMinutes: b.overtimeMinutes, overtimeCharge: b.overtimeCharge,
        mpesaRef: mpesaRef,
      );
    }).toList();
    await saveBookings(bookings);
  }

  static Booking? getBookingById(int id) {
    try { return getBookings().firstWhere((b) => b.id == id); }
    catch (_) { return null; }
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  static List<AppUser> getUsers() =>
      _loadList('rq:users').map(AppUser.fromJson).toList();

  static Future<void> saveUsers(List<AppUser> users) =>
      _saveList('rq:users', users.map((u) => u.toJson()).toList());

  static Future<AppUser> loginUser(String phone, String password) async {
    final norm = phone.replaceAll(RegExp(r'[\s\-().]+'), '');
    try {
      return getUsers().firstWhere((u) =>
          u.phone.replaceAll(RegExp(r'[\s\-().]+'), '') == norm &&
          u.password == password);
    } catch (_) { throw Exception('Invalid phone number or password'); }
  }

  static Future<AppUser> registerUser(String name, String phone, String password) async {
    if (name.trim().isEmpty) throw Exception('Name is required');
    final norm = phone.replaceAll(RegExp(r'[\s\-().]+'), '');
    if (norm.length < 9) throw Exception('Enter a valid phone number');
    if (password.length < 4) throw Exception('Password must be at least 4 characters');
    final users = getUsers();
    if (users.any((u) => u.phone.replaceAll(RegExp(r'[\s\-().]+'), '') == norm)) {
      throw Exception('Phone number already registered');
    }
    final u = AppUser(id: _nextId('rq:user_seq'), name: name.trim(),
        phone: norm, role: 'user', password: password);
    await saveUsers([...users, u]);
    return u;
  }


  // ── Promotions ────────────────────────────────────────────────────────────
  static List<Promotion> getPromotions() =>
      _loadList('rq:promotions').map(Promotion.fromJson).toList();

  static Future<void> savePromotions(List<Promotion> promos) =>
      _saveList('rq:promotions', promos.map((p) => p.toJson()).toList());

  static int? applyPromo(String code, int price) {
    try {
      final p = getPromotions().firstWhere(
          (p) => p.isActive && p.code.toUpperCase() == code.toUpperCase());
      return (price * (1 - p.discountPercentage / 100)).round();
    } catch (_) { return null; }
  }

  // ── Staff ─────────────────────────────────────────────────────────────────
  static List<Staff> getStaff() => _loadList('rq:staff').map(Staff.fromJson).toList();
  static Future<void> saveStaff(List<Staff> staff) =>
      _saveList('rq:staff', staff.map((s) => s.toJson()).toList());

  // ── Maintenance ───────────────────────────────────────────────────────────
  static List<MaintenanceLog> getMaintenance() =>
      _loadList('rq:maintenance').map(MaintenanceLog.fromJson).toList();
  static Future<void> saveMaintenance(List<MaintenanceLog> logs) =>
      _saveList('rq:maintenance', logs.map((l) => l.toJson()).toList());

  // ── Prebookings ───────────────────────────────────────────────────────────
  static List<Prebooking> getPrebookings() =>
      _loadList('rq:prebookings').map(Prebooking.fromJson).toList();
  static Future<void> savePrebookings(List<Prebooking> items) =>
      _saveList('rq:prebookings', items.map((p) => p.toJson()).toList());

  // ── Admin PIN ─────────────────────────────────────────────────────────────
  static String getAdminPin() => _p.getString('rq:admin_pin') ?? '1234';
  static Future<void> setAdminPin(String pin) => _p.setString('rq:admin_pin', pin);
  static bool verifyAdminPin(String pin) => pin == getAdminPin();

  // ── Analytics ─────────────────────────────────────────────────────────────
  static Map<String, int> getSalesSummary() {
    final history = getHistory();
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    final weekStart  = todayStart.subtract(Duration(days: now.weekday - 1));
    final monthStart = DateTime(now.year, now.month, 1);

    int total = 0, today = 0, week = 0, month = 0, overtime = 0;
    for (final b in history) {
      final rev = b.price + b.overtimeCharge;
      total   += rev;
      overtime += b.overtimeCharge;
      if (!b.startTime.isBefore(todayStart)) today += rev;
      if (!b.startTime.isBefore(weekStart))  week  += rev;
      if (!b.startTime.isBefore(monthStart)) month += rev;
    }
    return {'total': total, 'today': today, 'week': week, 'month': month, 'overtime': overtime};
  }

  // ── Incidents ─────────────────────────────────────────────────────────────
  static List<IncidentReport> getIncidents() =>
      _loadList('rq:incidents').map(IncidentReport.fromJson).toList();
  static Future<void> saveIncidents(List<IncidentReport> items) =>
      _saveList('rq:incidents', items.map((i) => i.toJson()).toList());
  static Future<IncidentReport> addIncident({
    required String quadName, required String customerName,
    required String type, required String description,
    required String reportedBy, int? bookingId,
  }) async {
    final items = getIncidents();
    final inc = IncidentReport(
      id: _nextId('rq:incident_seq'), bookingId: bookingId,
      quadName: quadName, customerName: customerName,
      type: type, description: description,
      date: DateTime.now(), reportedBy: reportedBy,
    );
    await saveIncidents([...items, inc]);
    return inc;
  }

  // ── Loyalty ───────────────────────────────────────────────────────────────
  static Map<String, dynamic> _loadMap(String key) {
    try {
      final raw = _p.getString(key);
      if (raw == null) return {};
      return Map<String, dynamic>.from(jsonDecode(raw) as Map);
    } catch (_) { return {}; }
  }

  static Future<void> _saveMap(String key, Map<String, dynamic> data) =>
      _p.setString(key, jsonEncode(data));

  static LoyaltyAccount? getLoyaltyAccount(String phone) {
    final all = _loadMap('rq:loyalty');
    if (!all.containsKey(phone)) return null;
    return LoyaltyAccount.fromJson(
        Map<String, dynamic>.from(all[phone] as Map));
  }

  static Future<void> addLoyaltyPoints(String phone, int pointsEarned) async {
    final all = _loadMap('rq:loyalty');
    LoyaltyAccount acc;
    if (all.containsKey(phone)) {
      final existing = LoyaltyAccount.fromJson(
          Map<String, dynamic>.from(all[phone] as Map));
      acc = LoyaltyAccount(
        phone: phone,
        points: existing.points + pointsEarned,
        totalEarned: existing.totalEarned + pointsEarned,
        totalRides: existing.totalRides + 1,
      );
    } else {
      acc = LoyaltyAccount(
        phone: phone, points: pointsEarned,
        totalEarned: pointsEarned, totalRides: 1,
      );
    }
    all[phone] = acc.toJson();
    await _saveMap('rq:loyalty', all);
  }

  static Future<void> redeemLoyaltyPoints(String phone, int points) async {
    final all = _loadMap('rq:loyalty');
    if (!all.containsKey(phone)) return;
    final existing = LoyaltyAccount.fromJson(
        Map<String, dynamic>.from(all[phone] as Map));
    final updated = LoyaltyAccount(
      phone: phone,
      points: (existing.points - points).clamp(0, 999999),
      totalEarned: existing.totalEarned,
      totalRides: existing.totalRides,
    );
    all[phone] = updated.toJson();
    await _saveMap('rq:loyalty', all);
  }

  // ── Dynamic pricing ───────────────────────────────────────────────────────
  static List<DynamicPricingRule> getDynamicPricing() {
    final items = _loadList('rq:dynamic_pricing');
    if (items.isEmpty) {
      final defaults = [
        DynamicPricingRule(id:1, label:'Early Bird',  startHour:6,  endHour:9,  multiplier:0.9, active:false),
        DynamicPricingRule(id:2, label:'Morning',     startHour:9,  endHour:12, multiplier:1.0, active:true),
        DynamicPricingRule(id:3, label:'Afternoon',   startHour:12, endHour:16, multiplier:1.0, active:true),
        DynamicPricingRule(id:4, label:'Peak (4-6pm)',startHour:16, endHour:18, multiplier:1.25,active:false),
        DynamicPricingRule(id:5, label:'Sunset',      startHour:18, endHour:20, multiplier:1.5, active:false),
        DynamicPricingRule(id:6, label:'Off-peak',    startHour:20, endHour:6,  multiplier:0.8, active:false),
      ];
      _saveList('rq:dynamic_pricing',
          defaults.map((r) => r.toJson()).toList());
      return defaults;
    }
    return items.map(DynamicPricingRule.fromJson).toList();
  }

  static Future<void> saveDynamicPricing(List<DynamicPricingRule> rules) =>
      _saveList('rq:dynamic_pricing', rules.map((r) => r.toJson()).toList());

  static double getCurrentPriceMultiplier() {
    final hour = DateTime.now().hour;
    final rules = getDynamicPricing();
    for (final r in rules) {
      if (!r.active) continue;
      if (r.startHour <= r.endHour) {
        if (hour >= r.startHour && hour < r.endHour) return r.multiplier;
      } else {
        // Overnight rule (e.g. 20-6)
        if (hour >= r.startHour || hour < r.endHour) return r.multiplier;
      }
    }
    return 1.0;
  }

  // ── Waiver expiry ─────────────────────────────────────────────────────────
  static bool hasValidWaiver(String phone) {
    final raw = _p.getString('rq:waiver:$phone');
    if (raw == null) return false;
    final signed = DateTime.tryParse(raw);
    if (signed == null) return false;
    return DateTime.now().difference(signed).inDays < 30;
  }

  static Future<void> recordWaiverSigned(String phone) =>
      _p.setString('rq:waiver:$phone', DateTime.now().toIso8601String());

  // ── Emergency contacts ────────────────────────────────────────────────────
  static String? getEmergencyContact(String phone) =>
      _p.getString('rq:emergency:$phone');
  static Future<void> setEmergencyContact(String phone, String contact) =>
      _p.setString('rq:emergency:$phone', contact);

  // ── Shift clock-in/out ────────────────────────────────────────────────────
  static bool isStaffClockedIn(int staffId) =>
      _p.getBool('rq:shift:$staffId') ?? false;
  static Future<void> clockIn(int staffId) async {
    await _p.setBool('rq:shift:$staffId', true);
    await _p.setString('rq:shift_start:$staffId',
        DateTime.now().toIso8601String());
  }
  static Future<void> clockOut(int staffId) async {
    await _p.setBool('rq:shift:$staffId', false);
  }
  static DateTime? getShiftStart(int staffId) {
    final raw = _p.getString('rq:shift_start:$staffId');
    return raw != null ? DateTime.tryParse(raw) : null;
  }
  // ── Backup & Restore ──────────────────────────────────────────────────────
  static const List<String> _backupKeys = [
    'rq:quads', 'rq:bookings', 'rq:prebookings', 'rq:promotions',
    'rq:incidents', 'rq:staff', 'rq:maintenance', 'rq:loyalty',
    'rq:admin_pin', 'rq:theme', 'rq:onboarded',
    'rq:quad_seq', 'rq:booking_seq', 'rq:incident_seq', 'rq:user_seq',
    'rq:dynamic_pricing',
  ];

  /// Export all app data as a JSON string
  static Map<String, dynamic> exportBackup() {
    final data = <String, dynamic>{};
    for (final key in _backupKeys) {
      // Keys may be stored as String, int, bool or double
      final val = _p.get(key);
      if (val != null) data[key] = val.toString();
    }
    data['_version'] = 1;
    data['_exported'] = DateTime.now().toIso8601String();
    return data;
  }

  /// Import data from a JSON backup map. Returns list of restored keys.
  static Future<List<String>> importBackup(Map<String, dynamic> data) async {
    final restored = <String>[];
    for (final key in _backupKeys) {
      final val = data[key];
      if (val is String) {
        await _p.setString(key, val);
        restored.add(key);
      }
    }
    return restored;
  }

  /// Reset all app data (keeps PIN and theme)
  static Future<void> resetAllData() async {
    const keepKeys = {'rq:admin_pin', 'rq:theme', 'rq:onboarded'};
    for (final key in _backupKeys) {
      if (!keepKeys.contains(key)) await _p.remove(key);
    }
  }

}
