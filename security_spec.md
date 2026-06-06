# Security Specification and Threat Model

This document outlines the data invariants, threat vectors, and test cases for the QuantumRig Firestore Security Rules.

## 1. Data Invariants

- **Users**: Users can only read and write their own profile information (`request.auth.uid == userId`). Admin users can manage all profiles.
- **Products, Categories, Brands**: Publicly readable. Only authorized administrators can create, update, or delete catalog nodes.
- **Orders**: A user can list and get their own orders (`resource.data.userId == request.auth.uid`). Creators must assign the order to their own UID. Admins can manage all orders.
- **Coupons & Settings**: Publicly readable or readable by authenticated consumers. Only administrators can modify global application configurations and coupons.
- **Restocks & Support**: Users can create support tickets and restock requests. Users can view/delete their own requests. Admins can view and update state for all tickets and restocks.
- **Offers & Social Links**: Publicly readable. Only administrators can perform write operations.

## 2. The "Dirty Dozen" Attack Payloads (PERMISSION_DENIED Expectations)

### Payload 1: Identity Spoofing on User Creation
User `attacker_uid` tries to register a profile under user ID `victim_uid`.
```json
{
  "path": "/users/victim_uid",
  "auth": { "uid": "attacker_uid" },
  "data": { "name": "Attacker", "email": "attacker@gmail.com", "role": "user" }
}
```

### Payload 2: Privilege Escalation on User Profile
Standard user `user_uid` tries to escalate their own role to `admin`.
```json
{
  "path": "/users/user_uid",
  "auth": { "uid": "user_uid" },
  "data": { "name": "Standard User", "email": "user@gmail.com", "role": "admin" }
}
```

### Payload 3: Unauthorized Catalog Ingestion
Unauthenticated attacker tries to inject a cheap product payload.
```json
{
  "path": "/products/fake_cpu",
  "auth": null,
  "data": { "title": "Cheap Ryzen 9", "price": 10, "stockStatus": "In Stock" }
}
```

### Payload 4: Order Interception (Cross-User Read)
User `spy_uid` attempts to read an order belonging to `victim_uid`.
```json
{
  "path": "/orders/victim_order_123",
  "auth": { "uid": "spy_uid" }
}
```

### Payload 5: Coupon Manipulation
Standard user tries to create or modify coupon discounts.
```json
{
  "path": "/coupons/super_discount",
  "auth": { "uid": "user_uid" },
  "data": { "code": "99PERCENT", "discountPercentage": 99, "isActive": true }
}
```

### Payload 6: Malicious Restock Request Hijacking
User `attacker_uid` tries to submit a restock request on behalf of a victim's email address and userId.
```json
{
  "path": "/restocks/rr_123",
  "auth": { "uid": "attacker_uid" },
  "data": { "id": "rr_123", "userId": "victim_uid", "userEmail": "victim@gmail.com" }
}
```

### Payload 7: Settings Spoofing
Standard user tries to overwrite the WhatsApp or website settings values.
```json
{
  "path": "/settings/global",
  "auth": { "uid": "user_uid" },
  "data": { "whatsappUrl": "https://malicious-link.com" }
}
```

### Payload 8: Integer Overflow/Extreme Value Attack in Product Price
Standard user tries to set negative price values or infinite quantities.
```json
{
  "path": "/products/prod_123",
  "auth": { "uid": "user_uid" },
  "data": { "price": -99999 }
}
```

### Payload 9: Orphaned Reviews Injection
User tries to submit a review for a non-existent product or spoof reviewer identity.
```json
{
  "path": "/products/nonexistent/reviews/rev_123",
  "auth": { "uid": "attacker_uid" },
  "data": { "userId": "victim_uid", "rating": 5 }
}
```

### Payload 10: Social Links Hijacking
Attacker tries to poison standard navigation social links.
```json
{
  "path": "/social_links/facebook",
  "auth": { "uid": "user_uid" },
  "data": { "name": "Facebook", "url": "evil-phishing.com" }
}
```

### Payload 11: Offers Deletion
Attacker attempts unauthorized deletion of home-page promotion banners.
```json
{
  "path": "/offers/promotional_banner",
  "auth": { "uid": "user_uid" }
}
```

### Payload 12: Ticket State Forge
Unauthenticated user attempts to update ticket status to "Closed" without valid credentials.
```json
{
  "path": "/support/ticket_123",
  "auth": null,
  "data": { "status": "Closed" }
}
```
