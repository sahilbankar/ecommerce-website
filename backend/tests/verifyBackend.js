const http = require('http');
const app = require('../app');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Brand = require('../models/brandModel');
const Coupon = require('../models/couponModel');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');
const { verifyRazorpaySignature } = require('../services/razorpayService');

let server;
let port = 5098;

/**
 * Helper to make HTTP requests against local Express test server
 */
const request = (method, path, headers = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: 'localhost',
        port,
        method,
        path,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(responseBody);
            resolve({ status: res.statusCode, body: json, headers: res.headers });
          } catch {
            resolve({ status: res.statusCode, body: responseBody, headers: res.headers });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
};

const runAllTests = async () => {
  console.log('====================================================');
  console.log(' Starting Step 10 - Backend Verification Suite');
  console.log('====================================================\n');

  server = app.listen(port);
  console.log(`[Test Server] Listening on http://localhost:${port}`);

  let passed = 0;
  let total = 0;

  const assert = (condition, description) => {
    total++;
    if (condition) {
      console.log(`  ✓ PASSED: ${description}`);
      passed++;
    } else {
      console.error(`  ✗ FAILED: ${description}`);
    }
  };

  try {
    // 1. Health Check API Test
    console.log('\n--- 1. Testing Health Check & Server Setup ---');
    const healthRes = await request('GET', '/api/v1/health');
    assert(healthRes.status === 200 && healthRes.body.success === true, 'Health check GET /api/v1/health returns 200 OK');

    // 2. Error Handling & 404 Route Test
    console.log('\n--- 2. Testing Centralized Error Handling & 404 Handler ---');
    const notFoundRes = await request('GET', '/api/v1/nonexistent-route-path');
    assert(notFoundRes.status === 404 && notFoundRes.body.success === false, '404 handler returns structured JSON error payload');

    // 3. Authentication & Validation Test
    console.log('\n--- 3. Testing Authentication & Input Validation ---');
    const invalidRegRes = await request('POST', '/api/v1/auth/register', {}, { name: '', email: 'invalid-email', password: '123' });
    assert(invalidRegRes.status === 400 && invalidRegRes.body.errors.length > 0, 'Validation fails cleanly for invalid registration inputs');

    // 4. Authorization & RBAC Middleware Test
    console.log('\n--- 4. Testing Authorization & Role Guards (RBAC) ---');
    const unauthorizedRes = await request('GET', '/api/v1/auth/me');
    assert(unauthorizedRes.status === 401 && unauthorizedRes.body.message.includes('token missing'), 'Protected route rejects unauthorized request without Bearer token');

    const adminGuardRes = await request('GET', '/api/v1/admin/stats');
    assert(adminGuardRes.status === 401, 'Admin stats route requires authentication token');

    // 5. Database Schema & Models Compilation Verification
    console.log('\n--- 5. Testing Database Schemas & Instance Methods ---');
    const testUser = new User({
      name: 'Test Customer',
      email: 'testcustomer@example.com',
      password: 'password123',
      role: 'customer'
    });
    assert(typeof testUser.generateAccessToken === 'function', 'User model instance has generateAccessToken method');
    assert(typeof testUser.generateRefreshToken === 'function', 'User model instance has generateRefreshToken method');

    const token = testUser.generateAccessToken();
    assert(typeof token === 'string' && token.length > 20, 'User generateAccessToken produces valid JWT string');

    const testCoupon = new Coupon({
      code: 'TEST20',
      discountType: 'percentage',
      discountAmount: 20,
      minPurchase: 100,
      expiresAt: new Date(Date.now() + 86400000)
    });
    const validity = testCoupon.isValid(150);
    assert(validity.valid === true, 'Coupon isValid instance method verifies eligible purchase amount');
    assert(Product.modelName === 'Product', 'Product Mongoose model loaded cleanly');
    assert(Category.modelName === 'Category', 'Category Mongoose model loaded cleanly');
    assert(Brand.modelName === 'Brand', 'Brand Mongoose model loaded cleanly');

    // 6. Image Upload Middleware & Cloudinary Helper Verification
    console.log('\n--- 6. Testing Image Upload & Cloudinary Service ---');
    assert(typeof uploadToCloudinary === 'function', 'uploadToCloudinary helper function exists and is exported');
    assert(typeof deleteFromCloudinary === 'function', 'deleteFromCloudinary helper function exists and is exported');

    // 7. Payment Service & Signature Verification Test
    console.log('\n--- 7. Testing Payment Gateway Services & Signatures ---');
    const isSignatureValid = verifyRazorpaySignature('order_test123', 'pay_test123', 'invalid_sig');
    assert(isSignatureValid === false, 'Razorpay HMAC signature verification correctly flags invalid signatures');

  } catch (error) {
    console.error('Fatal error during test execution:', error);
  } finally {
    server.close();
    console.log('\n====================================================');
    console.log(` Verification Completed: ${passed}/${total} Tests Passed (${Math.round((passed / total) * 100)}%)`);
    console.log('====================================================');
    process.exit(passed === total ? 0 : 1);
  }
};

runAllTests();
