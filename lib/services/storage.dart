import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

class StorageService {
  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  static SharedPreferences get _p => _prefs!;

  // ── Onboarding ────────────────────────────────────────────────────────────
  static bool isOnboarded() => _p.getBool('rq:onboarded') ?? false;
  static Future<void> setOnboarded() => _p.setBool('rq:onboarded', true);

  // ── Theme ─────────────────────────────────────────────────────────────────
  static String getThemeName() => _p.getString('rq:theme') ?? 'dark';
  static Future<void> setThemeName(String mode) => _p.setString('rq:theme', mode);

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

  // ── Theme ─────────────────────────────────────────────────────────────────
  static ThemeMode getThemeMode() {
    final val = _p.getString('rq:theme') ?? 'dark';
    return val == 'light' ? ThemeMode.light : ThemeMode.dark;
  }
  static Future<void> setThemeMode(ThemeMode mode) =>
      _p.setString('rq:theme', mode == ThemeMode.light ? 'light' : 'dark');

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

  static List<Booking> getHistory() =>
      getBookings().where((b) => b.status == 'completed').toList();

  static Booking? getBookingById(int id) {
    try {
      return getBookings().firstWhere((b) => b.id == id);
    } catch (_) { return null; }
  }

  static Future<Booking> createBooking({
    required int quadId, int? userId,
    required String customerName, required String customerPhone,
    required int duration, required int price,
    int? originalPrice, String? promoCode, int groupSize = 1,
    int depositAmount = 0, String? mpesaRef, bool waiverSigned = false,
  }) async {
    final quads = getQuads();
    final quad  = quads.firstWhere((q) => q.id == quadId);
    if (quad.status != 'available') throw Exception('${quad.name} is not available');
    final bookings = getBookings();
    final id = _nextId('rq:booking_seq');
    final booking = Booking(
      id: id, quadId: quadId, quadName: quad.name,
      userId: userId, customerName: customerName,
      customerPhone: customerPhone, duration: duration,
      price: price, originalPrice: originalPrice ?? price,
      promoCode: promoCode, groupSize: groupSize,
      depositAmount: depositAmount, mpesaRef: mpesaRef,
      waiverSigned: waiverSigned,
      startTime: DateTime.now(), status: 'active',
      receiptId: _receiptId(),
    );
    await saveBookings([...bookings, booking]);
    await updateQuad(quadId, status: 'rented');
    return booking;
  }

  static Future<void> completeBooking(int id, int overtimeMins) async {
    final bookings = getBookings();
    final idx = bookings.indexWhere((b) => b.id == id);
    if (idx < 0) return;
    final b = bookings[idx];
    final otCharge = overtimeMins * kOvertimeRate;
    final updated = b.copyWith(
      status: 'completed',
      endTime: DateTime.now(),
      overtimeMinutes: overtimeMins,
      overtimeCharge: otCharge,
    );
    bookings[idx] = updated;
    await saveBookings(bookings);
    await updateQuad(b.quadId, status: 'available');
  }

  static Future<void> updateMpesaRef(int id, String ref) async {
    final bookings = getBookings();
    final idx = bookings.indexWhere((b) => b.id == id);
    if (idx < 0) return;
    bookings[idx] = bookings[idx].copyWith(mpesaRef: ref);
    await saveBookings(bookings);
  }

  static Future<void> submitFeedback(int id, int rating, String feedback) async {
    final bookings = getBookings();
    final idx = bookings.indexWhere((b) => b.id == id);
    if (idx < 0) return;
    bookings[idx] = bookings[idx].copyWith(rating: rating, feedback: feedback);
    await saveBookings(bookings);
  }

  static Future<void> returnDeposit(int id) async {
    final bookings = getBookings();
    final idx = bookings.indexWhere((b) => b.id == id);
    if (idx < 0) return;
    bookings[idx] = bookings[idx].copyWith(depositReturned: true);
    await saveBookings(bookings);
  }

  // ── Sales summary ─────────────────────────────────────────────────────────
  static Map<String, int> getSalesSummary() {
    final history = getHistory();
    final now = DateTime.now();
    final todayStart  = DateTime(now.year, now.month, now.day);
    final weekStart   = todayStart.subtract(const Duration(days: 6));
    final monthStart  = DateTime(now.year, now.month, 1);

    int today = 0, week = 0, month = 0, overtime = 0;
    for (final b in history) {
      final t = b.totalPaid;
      if (!b.startTime.isBefore(todayStart)) today += t;
      if (!b.startTime.isBefore(weekStart))  week  += t;
      if (!b.startTime.isBefore(monthStart)) month += t;
      overtime += b.overtimeCharge;
    }
    return {'today': today, 'week': week, 'month': month, 'overtime': overtime};
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  static List<AppUser> getUsers() =>
      _loadList('rq:users').map(AppUser.fromJson).toList();

  static Future<void> saveUsers(List<AppUser> users) =>
      _saveList('rq:users', users.map((u) => u.toJson()).toList());

  static Future<AppUser> registerUser(String name, String phone, String password) async {
    final users = getUsers();
    if (users.any((u) => u.phone == phone)) throw Exception('Phone already registered');
    final user = AppUser(id: _nextId('rq:user_seq'), name: name, phone: phone, password: password);
    await saveUsers([...users, user]);
    return user;
  }

  static Future<AppUser> loginUser(String phone, String password) async {
    final users = getUsers();
    try {
      return users.firstWhere((u) => u.phone == phone && u.password == password);
    } catch (_) { throw Exception('Invalid phone or password'); }
  }

  // ── Promos ────────────────────────────────────────────────────────────────
  static List<PromoCode> getPromos() =>
      _loadList('rq:promos').map(PromoCode.fromJson).toList();

  static Future<void> savePromos(List<PromoCode> promos) =>
      _saveList('rq:promos', promos.map((p) => p.toJson()).toList());

  static int? applyPromo(String code, int price) {
    try {
      final p = getPromos().firstWhere(
          (p) => p.code == code.toUpperCase() && p.active);
      return p.isPercent
          ? (price * (1 - p.discount / 100)).round()
          : (price - p.discount).clamp(0, price);
    } catch (_) { return null; }
  }

  // ── Admin PIN ─────────────────────────────────────────────────────────────
  static bool verifyAdminPin(String pin) => pin == (_p.getString('rq:admin_pin') ?? '1234');
  static Future<void> setAdminPin(String pin) => _p.setString('rq:admin_pin', pin);
}
