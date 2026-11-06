import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sanitizeOrderResponse } from '../src/controllers/order.controller';
import { calculateRoadRoute } from '../src/services/routing.service';
import { parseCookies } from '../src/services/socket.service';

describe('Live Delivery Tracking & Order Lifecycle Tests', () => {
  const customerId = '654321654321654321654321';
  const otherCustomerId = '654321654321654321654322';
  const shopOwnerId = '654321654321654321654323';
  const riderId = '654321654321654321654324';

  const baseOrder = {
    _id: '678901678901678901678901',
    user: customerId,
    shop: shopOwnerId,
    items: [
      {
        productId: 'prod_1',
        name: 'Fresh Farm Tomatoes',
        price: 40,
        quantity: 2,
        image: '/tomato.jpg',
      },
    ],
    deliveryAddress: {
      receiverName: 'Test Customer',
      phone: '9876543210',
      house: 'Flat 101, Lotus Apts',
      street: 'Station Road',
      label: 'Home',
      location: {
        type: 'Point',
        coordinates: [77.209, 28.6139],
      },
    },
    subtotal: 80,
    deliveryFee: 0,
    handlingFee: 5,
    totalAmount: 85,
  };

  it('1. Privacy Guard: Customer cannot see rider details before RIDER_ACCEPTED (ORDER_PLACED, SHOP_ACCEPTED, FINDING_RIDER, RIDER_ASSIGNED)', () => {
    const preAcceptanceStatuses = [
      'ORDER_PLACED',
      'SHOP_ACCEPTED',
      'FINDING_RIDER',
      'RIDER_ASSIGNED',
    ];

    for (const status of preAcceptanceStatuses) {
      const order = {
        ...baseOrder,
        status,
        deliveryPartner: {
          _id: riderId,
          name: 'Rider Ramesh',
          phone: '9876543219',
          deliveryDetails: { vehicleType: 'Motorbike' },
        },
        riderLocation: {
          latitude: 28.62,
          longitude: 77.21,
          updatedAt: new Date(),
        },
      };

      const customerView = sanitizeOrderResponse(order, 'customer', customerId);
      assert.strictEqual(
        customerView.deliveryPartner,
        null,
        `Rider details must be hidden in status: ${status}`
      );
      assert.strictEqual(
        customerView.riderLocation,
        null,
        `Rider location must be hidden in status: ${status}`
      );
      assert.strictEqual(customerView.isLiveTrackingActive, false);
    }
  });

  it('2. Privacy Guard: Customer CAN see permitted rider profile & coordinates after RIDER_ACCEPTED', () => {
    const inFlightStatuses = ['RIDER_ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'];

    for (const status of inFlightStatuses) {
      const order = {
        ...baseOrder,
        status,
        deliveryPartner: {
          _id: riderId,
          name: 'Rider Ramesh',
          phone: '9876543219',
          deliveryDetails: { vehicleType: 'TVS Jupiter Scooter', vehicleNumber: 'DL 01 AB 1234' },
        },
        riderLocation: {
          latitude: 28.62,
          longitude: 77.21,
          updatedAt: new Date(),
        },
      };

      const customerView = sanitizeOrderResponse(order, 'customer', customerId);
      assert.ok(customerView.deliveryPartner, `Rider profile should be visible in ${status}`);
      assert.strictEqual(customerView.deliveryPartner.name, 'Rider Ramesh');
      assert.strictEqual(customerView.riderLocation.latitude, 28.62);
      assert.strictEqual(customerView.isLiveTrackingActive, true);
    }
  });

  it('3. Terminal Lifecycle Guard: DELIVERED and CANCELLED stop live tracking', () => {
    const terminalStatuses = ['DELIVERED', 'CANCELLED'];

    for (const status of terminalStatuses) {
      const order = {
        ...baseOrder,
        status,
        deliveryPartner: {
          _id: riderId,
          name: 'Rider Ramesh',
        },
        riderLocation: {
          latitude: 28.62,
          longitude: 77.21,
        },
      };

      const customerView = sanitizeOrderResponse(order, 'customer', customerId);
      assert.strictEqual(customerView.isLiveTrackingActive, false, `Tracking must cease for ${status}`);
    }
  });

  it('4. Road Routing calculation returns valid coordinates and positive distance/duration', async () => {
    const route = await calculateRoadRoute(77.209, 28.6139, 77.22, 28.63);

    assert.ok(route.coordinates.length >= 2, 'Route must have at least start and end coordinates');
    assert.ok(route.distanceKm > 0, 'Distance must be positive');
    assert.ok(route.durationMinutes > 0, 'Duration must be positive');
    assert.ok(route.etaText.includes('min'), 'ETA text should be formatted properly');
  });

  it('5. Socket Cookie Parser correctly extracts JWT token for authentication', () => {
    const cookieString = 'token=xyz_jwt_token_123; other_cookie=abc; sessionId=456';
    const parsed = parseCookies(cookieString);

    assert.strictEqual(parsed['token'], 'xyz_jwt_token_123');
    assert.strictEqual(parsed['other_cookie'], 'abc');
  });
});
