import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createAddressSchema, updateAddressSchema } from '../src/validators/address.validator';
import { updateAddressSchema as userAddressSchema, updateShopDetailsSchema } from '../src/validators/auth.validator';

describe('Address Validator & GeoJSON Unit Tests', () => {
  it('should accept valid address with valid [lng, lat] coordinates', () => {
    const input = {
      receiverName: 'Souvik Das',
      phone: '9876543210',
      house: 'Flat 402, Lotus Residency',
      street: 'Sector 4, Main Market',
      landmark: 'Near City Hospital',
      label: 'Home',
      latitude: 28.6139,
      longitude: 77.209,
      formattedAddress: 'Connaught Place, New Delhi',
      isDefault: true,
    };

    const res = createAddressSchema.safeParse(input);
    assert.strictEqual(res.success, true);
    if (res.success) {
      assert.strictEqual(res.data.receiverName, 'Souvik Das');
      assert.strictEqual(res.data.latitude, 28.6139);
      assert.strictEqual(res.data.longitude, 77.209);
      assert.strictEqual(res.data.label, 'Home');
    }
  });

  it('should reject invalid latitude (> 90 or < -90)', () => {
    const input = {
      receiverName: 'John Doe',
      phone: '9876543210',
      house: 'Flat 101',
      street: 'Oak Street',
      latitude: 95.0, // Invalid latitude
      longitude: 77.209,
    };

    const res = createAddressSchema.safeParse(input);
    assert.strictEqual(res.success, false);
  });

  it('should reject invalid longitude (> 180 or < -180)', () => {
    const input = {
      receiverName: 'John Doe',
      phone: '9876543210',
      house: 'Flat 101',
      street: 'Oak Street',
      latitude: 28.6139,
      longitude: 195.0, // Invalid longitude
    };

    const res = createAddressSchema.safeParse(input);
    assert.strictEqual(res.success, false);
  });

  it('should reject missing required fields', () => {
    const input = {
      receiverName: '',
      phone: '123', // too short
      latitude: 28.6139,
      longitude: 77.209,
    };

    const res = createAddressSchema.safeParse(input);
    assert.strictEqual(res.success, false);
  });

  it('should allow partial updates in updateAddressSchema', () => {
    const input = {
      house: 'New Flat 501',
      isDefault: true,
    };

    const res = updateAddressSchema.safeParse(input);
    assert.strictEqual(res.success, true);
    if (res.success) {
      assert.strictEqual(res.data.house, 'New Flat 501');
      assert.strictEqual(res.data.isDefault, true);
    }
  });

  it('should validate primary user address updates', () => {
    const input = {
      street: '42 Park Street',
      city: 'Kolkata',
      state: 'West Bengal',
      postalCode: '700016',
    };

    const res = userAddressSchema.safeParse(input);
    assert.strictEqual(res.success, true);
    if (res.success) {
      assert.strictEqual(res.data.street, '42 Park Street');
      assert.strictEqual(res.data.city, 'Kolkata');
      assert.strictEqual(res.data.state, 'West Bengal');
      assert.strictEqual(res.data.postalCode, '700016');
    }
  });

  it('should validate shop details update including shop image', () => {
    const input = {
      shopName: "Nature's Basket",
      category: 'Fresh Organic Produce',
      address: 'Shop 14, City Center Mall',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e',
    };

    const res = updateShopDetailsSchema.safeParse(input);
    assert.strictEqual(res.success, true);
    if (res.success) {
      assert.strictEqual(res.data.shopName, "Nature's Basket");
      assert.strictEqual(res.data.image, 'https://images.unsplash.com/photo-1542838132-92c53300491e');
    }
  });
});

