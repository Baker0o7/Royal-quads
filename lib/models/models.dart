const kOvertimeRate = 100;
const kTillNumber   = '6685024';

const kPricing = [
  {'duration': 5,  'price': 1000, 'label': '5 min'},
  {'duration': 10, 'price': 1800, 'label': '10 min'},
  {'duration': 15, 'price': 2200, 'label': '15 min'},
  {'duration': 20, 'price': 2500, 'label': '20 min'},
  {'duration': 30, 'price': 3500, 'label': '30 min'},
  {'duration': 60, 'price': 6000, 'label': '1 hour'},
];

class Quad {
  final int id;
  final String name;
  final String status;
  final String? imageUrl;
  final String? imei;

  const Quad({required this.id, required this.name, required this.status, this.imageUrl, this.imei});

  Quad copyWith({String? name, String? status}) =>
      Quad(id: id, name: name ?? this.name, status: status ?? this.status, imageUrl: imageUrl, imei: imei);

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'status': status, 'imageUrl': imageUrl, 'imei': imei};

  factory Quad.fromJson(Map<String, dynamic> j) => Quad(
      id: j['id'] as int, name: j['name'] as String,
      status: (j['status'] as String?) ?? 'available',
      imageUrl: j['imageUrl'] as String?, imei: j['imei'] as String?);
}

class Booking {
  final int id;
  final int quadId;
  final int? userId;
  final String customerName;
  final String customerPhone;
  final int duration;
  final int price;
  final int originalPrice;
  final String? promoCode;
  final DateTime startTime;
  final DateTime? endTime;
  final String status;
  final String receiptId;
  final int? rating;
  final String? feedback;
  final String quadName;
  final String? quadImageUrl;
  final bool waiverSigned;
  final int groupSize;
  final int depositAmount;
  final bool depositReturned;
  final int overtimeMinutes;
  final int overtimeCharge;
  final String? mpesaRef;

  const Booking({
    required this.id, required this.quadId, this.userId,
    required this.customerName, required this.customerPhone,
    required this.duration, required this.price, required this.originalPrice,
    this.promoCode, required this.startTime, this.endTime,
    required this.status, required this.receiptId,
    this.rating, this.feedback, required this.quadName, this.quadImageUrl,
    this.waiverSigned = false, this.groupSize = 1, this.depositAmount = 0,
    this.depositReturned = false, this.overtimeMinutes = 0,
    this.overtimeCharge = 0, this.mpesaRef,
  });

  int get totalPaid => price + overtimeCharge;

  Booking copyWith({String? status, DateTime? endTime, int? rating, String? feedback,
    int? overtimeMinutes, int? overtimeCharge, bool? depositReturned, bool? waiverSigned}) =>
    Booking(id: id, quadId: quadId, userId: userId,
      customerName: customerName, customerPhone: customerPhone,
      duration: duration, price: price, originalPrice: originalPrice,
      promoCode: promoCode, startTime: startTime,
      endTime: endTime ?? this.endTime, status: status ?? this.status, receiptId: receiptId,
      rating: rating ?? this.rating, feedback: feedback ?? this.feedback,
      quadName: quadName, quadImageUrl: quadImageUrl,
      waiverSigned: waiverSigned ?? this.waiverSigned,
      groupSize: groupSize, depositAmount: depositAmount,
      depositReturned: depositReturned ?? this.depositReturned,
      overtimeMinutes: overtimeMinutes ?? this.overtimeMinutes,
      overtimeCharge: overtimeCharge ?? this.overtimeCharge, mpesaRef: mpesaRef);

  Map<String, dynamic> toJson() => {
    'id': id, 'quadId': quadId, 'userId': userId,
    'customerName': customerName, 'customerPhone': customerPhone,
    'duration': duration, 'price': price, 'originalPrice': originalPrice,
    'promoCode': promoCode, 'startTime': startTime.toIso8601String(),
    'endTime': endTime?.toIso8601String(), 'status': status,
    'receiptId': receiptId, 'rating': rating, 'feedback': feedback,
    'quadName': quadName, 'quadImageUrl': quadImageUrl,
    'waiverSigned': waiverSigned, 'groupSize': groupSize,
    'depositAmount': depositAmount, 'depositReturned': depositReturned,
    'overtimeMinutes': overtimeMinutes, 'overtimeCharge': overtimeCharge, 'mpesaRef': mpesaRef,
  };

  factory Booking.fromJson(Map<String, dynamic> j) => Booking(
    id: j['id'] as int, quadId: j['quadId'] as int, userId: j['userId'] as int?,
    customerName: j['customerName'] as String, customerPhone: j['customerPhone'] as String,
    duration: j['duration'] as int, price: j['price'] as int,
    originalPrice: (j['originalPrice'] ?? j['price']) as int,
    promoCode: j['promoCode'] as String?,
    startTime: DateTime.parse(j['startTime'] as String),
    endTime: j['endTime'] != null ? DateTime.parse(j['endTime'] as String) : null,
    status: (j['status'] as String?) ?? 'active',
    receiptId: (j['receiptId'] as String?) ?? '',
    rating: j['rating'] as int?, feedback: j['feedback'] as String?,
    quadName: (j['quadName'] as String?) ?? '',
    quadImageUrl: j['quadImageUrl'] as String?,
    waiverSigned: (j['waiverSigned'] as bool?) ?? false,
    groupSize: (j['groupSize'] as int?) ?? 1,
    depositAmount: (j['depositAmount'] as int?) ?? 0,
    depositReturned: (j['depositReturned'] as bool?) ?? false,
    overtimeMinutes: (j['overtimeMinutes'] as int?) ?? 0,
    overtimeCharge: (j['overtimeCharge'] as int?) ?? 0,
    mpesaRef: j['mpesaRef'] as String?);
}

class AppUser {
  final int id;
  final String name;
  final String phone;
  final String role;
  final String password;
  final String? email;

  const AppUser({required this.id, required this.name, required this.phone,
    required this.role, required this.password, this.email});

  Map<String, dynamic> toJson() => {'id': id, 'name': name, 'phone': phone,
    'role': role, 'password': password, 'email': email};

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
    id: j['id'] as int, name: (j['name'] as String?) ?? '',
    phone: (j['phone'] as String?) ?? '', role: (j['role'] as String?) ?? 'user',
    password: (j['password'] as String?) ?? '',
    email: j['email'] as String?);
}

class Promotion {
  final int id;
  final String code;
  final int discountPercentage;
  final bool isActive;

  const Promotion({required this.id, required this.code, required this.discountPercentage, required this.isActive});

  Promotion copyWith({bool? isActive}) =>
      Promotion(id: id, code: code, discountPercentage: discountPercentage, isActive: isActive ?? this.isActive);

  Map<String, dynamic> toJson() =>
      {'id': id, 'code': code, 'discountPercentage': discountPercentage, 'isActive': isActive};

  factory Promotion.fromJson(Map<String, dynamic> j) => Promotion(
      id: j['id'] as int, code: j['code'] as String,
      discountPercentage: j['discountPercentage'] as int,
      isActive: j['isActive'] == true || j['isActive'] == 1);
}

class Staff {
  final int id;
  final String name;
  final String phone;
  final String pin;
  final String role;
  final bool isActive;

  const Staff({required this.id, required this.name, required this.phone,
    required this.pin, required this.role, required this.isActive});

  Staff copyWith({bool? isActive}) =>
      Staff(id: id, name: name, phone: phone, pin: pin, role: role, isActive: isActive ?? this.isActive);

  Map<String, dynamic> toJson() =>
      {'id': id, 'name': name, 'phone': phone, 'pin': pin, 'role': role, 'isActive': isActive};

  factory Staff.fromJson(Map<String, dynamic> j) => Staff(
      id: j['id'] as int, name: j['name'] as String, phone: j['phone'] as String,
      pin: j['pin'] as String, role: (j['role'] as String?) ?? 'operator',
      isActive: (j['isActive'] as bool?) ?? true);
}

class MaintenanceLog {
  final int id;
  final int quadId;
  final String quadName;
  final String type;
  final String description;
  final int cost;
  final DateTime date;

  const MaintenanceLog({required this.id, required this.quadId, required this.quadName,
    required this.type, required this.description, required this.cost, required this.date});

  Map<String, dynamic> toJson() => {'id': id, 'quadId': quadId, 'quadName': quadName,
    'type': type, 'description': description, 'cost': cost, 'date': date.toIso8601String()};

  factory MaintenanceLog.fromJson(Map<String, dynamic> j) => MaintenanceLog(
    id: j['id'] as int, quadId: j['quadId'] as int,
    quadName: (j['quadName'] as String?) ?? '',
    type: j['type'] as String, description: j['description'] as String,
    cost: j['cost'] as int, date: DateTime.parse(j['date'] as String));
}

class Prebooking {
  final int id;
  final int? quadId;
  final String? quadName;
  final String customerName;
  final String customerPhone;
  final int duration;
  final int price;
  final DateTime scheduledFor;
  final String status;
  final DateTime createdAt;
  final String? mpesaRef;
  final String? notes;

  const Prebooking({required this.id, this.quadId, this.quadName,
    required this.customerName, required this.customerPhone,
    required this.duration, required this.price,
    required this.scheduledFor, required this.status, required this.createdAt,
    this.mpesaRef, this.notes});

  Prebooking copyWith({String? status, String? mpesaRef, String? notes}) =>
    Prebooking(
      id: id, quadId: quadId, quadName: quadName,
      customerName: customerName, customerPhone: customerPhone,
      duration: duration, price: price, scheduledFor: scheduledFor,
      status: status ?? this.status, createdAt: createdAt,
      mpesaRef: mpesaRef ?? this.mpesaRef,
      notes: notes ?? this.notes);

  Map<String, dynamic> toJson() => {'id': id, 'quadId': quadId, 'quadName': quadName,
    'customerName': customerName, 'customerPhone': customerPhone, 'duration': duration,
    'price': price, 'scheduledFor': scheduledFor.toIso8601String(),
    'status': status, 'createdAt': createdAt.toIso8601String(),
    'mpesaRef': mpesaRef, 'notes': notes};

  factory Prebooking.fromJson(Map<String, dynamic> j) => Prebooking(
    id: j['id'] as int, quadId: j['quadId'] as int?, quadName: j['quadName'] as String?,
    customerName: j['customerName'] as String, customerPhone: j['customerPhone'] as String,
    duration: j['duration'] as int, price: j['price'] as int,
    scheduledFor: DateTime.parse(j['scheduledFor'] as String),
    status: (j['status'] as String?) ?? 'pending',
    createdAt: DateTime.parse(j['createdAt'] as String),
    mpesaRef: j['mpesaRef'] as String?,
    notes: j['notes'] as String?);
}

// ─────────────────────────────────────────────────────────────────────────────
// New feature models
// ─────────────────────────────────────────────────────────────────────────────

class IncidentReport {
  final int id;
  final int? bookingId;
  final String quadName;
  final String customerName;
  final String type;        // 'fall' | 'mechanical' | 'medical' | 'other'
  final String description;
  final DateTime date;
  final String reportedBy;

  const IncidentReport({
    required this.id, this.bookingId,
    required this.quadName, required this.customerName,
    required this.type, required this.description,
    required this.date, required this.reportedBy,
  });

  Map<String, dynamic> toJson() => {
    'id': id, 'bookingId': bookingId, 'quadName': quadName,
    'customerName': customerName, 'type': type,
    'description': description, 'date': date.toIso8601String(),
    'reportedBy': reportedBy,
  };

  factory IncidentReport.fromJson(Map<String, dynamic> j) => IncidentReport(
    id: j['id'] as int,
    bookingId: j['bookingId'] as int?,
    quadName: (j['quadName'] as String?) ?? '',
    customerName: (j['customerName'] as String?) ?? '',
    type: (j['type'] as String?) ?? 'other',
    description: (j['description'] as String?) ?? '',
    date: DateTime.parse(j['date'] as String),
    reportedBy: (j['reportedBy'] as String?) ?? '',
  );
}

class LoyaltyAccount {
  final String phone;
  final int points;
  final int totalEarned;
  final int totalRides;

  const LoyaltyAccount({
    required this.phone, required this.points,
    required this.totalEarned, required this.totalRides,
  });

  Map<String, dynamic> toJson() => {
    'phone': phone, 'points': points,
    'totalEarned': totalEarned, 'totalRides': totalRides,
  };

  factory LoyaltyAccount.fromJson(Map<String, dynamic> j) => LoyaltyAccount(
    phone: j['phone'] as String,
    points: (j['points'] as int?) ?? 0,
    totalEarned: (j['totalEarned'] as int?) ?? 0,
    totalRides: (j['totalRides'] as int?) ?? 0,
  );
}

class DynamicPricingRule {
  final int id;
  final String label;     // 'morning', 'peak', 'sunset', 'offpeak'
  final int startHour;    // 0-23
  final int endHour;      // 0-23
  final double multiplier;
  final bool active;

  const DynamicPricingRule({
    required this.id, required this.label,
    required this.startHour, required this.endHour,
    required this.multiplier, required this.active,
  });

  Map<String, dynamic> toJson() => {
    'id': id, 'label': label, 'startHour': startHour,
    'endHour': endHour, 'multiplier': multiplier, 'active': active,
  };

  factory DynamicPricingRule.fromJson(Map<String, dynamic> j) =>
      DynamicPricingRule(
        id: j['id'] as int,
        label: (j['label'] as String?) ?? '',
        startHour: (j['startHour'] as int?) ?? 0,
        endHour: (j['endHour'] as int?) ?? 23,
        multiplier: ((j['multiplier'] as num?) ?? 1.0).toDouble(),
        active: (j['active'] as bool?) ?? true,
      );
}
