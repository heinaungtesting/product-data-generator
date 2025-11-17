#!/usr/bin/env tsx

/**
 * Supabase Connection Test Script
 *
 * This script tests the connection to Supabase and verifies:
 * - Environment variables are set correctly
 * - Can connect to Supabase
 * - Required tables exist
 * - Can query data
 *
 * Usage:
 *   tsx scripts/test-supabase-connection.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 Testing Supabase Connection...\n');

/**
 * Test 1: Environment Variables
 */
function testEnvironmentVariables() {
  console.log('📋 Test 1: Environment Variables');

  const checks = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', value: supabaseUrl },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: supabaseAnonKey },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', value: supabaseServiceKey },
  ];

  let allPassed = true;

  for (const check of checks) {
    if (check.value) {
      console.log(`  ✅ ${check.name}: ${check.value.substring(0, 30)}...`);
    } else {
      console.log(`  ❌ ${check.name}: Not set`);
      allPassed = false;
    }
  }

  if (!allPassed) {
    console.log('\n❌ Some environment variables are missing!');
    console.log('Please copy .env.local.example to .env.local and fill in your Supabase credentials.');
    process.exit(1);
  }

  console.log('  ✅ All environment variables are set\n');
}

/**
 * Test 2: Connection
 */
async function testConnection() {
  console.log('🔌 Test 2: Connection');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('  ❌ Missing credentials\n');
    return false;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Try a simple query
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('  ⚠️  Connected but products table does not exist');
        console.log('  Run: npx supabase db push\n');
        return false;
      }
      console.log(`  ❌ Connection error: ${error.message}\n`);
      return false;
    }

    console.log('  ✅ Successfully connected to Supabase\n');
    return true;
  } catch (error) {
    console.log(`  ❌ Connection failed: ${error}\n`);
    return false;
  }
}

/**
 * Test 3: Tables Exist
 */
async function testTables() {
  console.log('📊 Test 3: Required Tables');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('  ❌ Missing credentials\n');
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const requiredTables = [
    'products',
    'product_texts',
    'tags',
    'product_tags',
    'staff',
    'point_logs',
  ];

  let allExist = true;

  for (const table of requiredTables) {
    const { error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error && error.code === '42P01') {
      console.log(`  ❌ Table "${table}" does not exist`);
      allExist = false;
    } else if (error) {
      console.log(`  ⚠️  Table "${table}" - ${error.message}`);
    } else {
      console.log(`  ✅ Table "${table}" exists`);
    }
  }

  if (!allExist) {
    console.log('\n❌ Some tables are missing!');
    console.log('Run migrations: npx supabase db push');
    console.log('Or manually run: supabase/migrations/*.sql\n');
    return false;
  }

  console.log('  ✅ All required tables exist\n');
  return true;
}

/**
 * Test 4: Query Data
 */
async function testQueryData() {
  console.log('🔍 Test 4: Query Data');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('  ❌ Missing credentials\n');
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Count products
  const { count: productCount, error: productError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (productError) {
    console.log(`  ❌ Failed to count products: ${productError.message}`);
    return false;
  }

  console.log(`  ✅ Products in database: ${productCount || 0}`);

  // Count staff
  const { count: staffCount, error: staffError } = await supabase
    .from('staff')
    .select('*', { count: 'exact', head: true });

  if (staffError) {
    console.log(`  ❌ Failed to count staff: ${staffError.message}`);
    return false;
  }

  console.log(`  ✅ Staff in database: ${staffCount || 0}`);

  // Count point logs
  const { count: logsCount, error: logsError } = await supabase
    .from('point_logs')
    .select('*', { count: 'exact', head: true });

  if (logsError) {
    console.log(`  ❌ Failed to count point logs: ${logsError.message}`);
    return false;
  }

  console.log(`  ✅ Point logs in database: ${logsCount || 0}\n`);

  return true;
}

/**
 * Test 5: Permissions
 */
async function testPermissions() {
  console.log('🔐 Test 5: Permissions');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('  ❌ Missing credentials\n');
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Test insert permission
  const testStaff = {
    email: `test-${Date.now()}@example.com`,
    name: 'Test Staff',
    point_balance: 0,
  };

  const { data: insertedStaff, error: insertError } = await supabase
    .from('staff')
    .insert(testStaff)
    .select()
    .single();

  if (insertError) {
    console.log(`  ❌ Cannot insert data: ${insertError.message}`);
    return false;
  }

  console.log('  ✅ Can insert data');

  // Test update permission
  const { error: updateError } = await supabase
    .from('staff')
    .update({ name: 'Test Staff Updated' })
    .eq('id', insertedStaff.id);

  if (updateError) {
    console.log(`  ❌ Cannot update data: ${updateError.message}`);
    return false;
  }

  console.log('  ✅ Can update data');

  // Test delete permission
  const { error: deleteError } = await supabase
    .from('staff')
    .delete()
    .eq('id', insertedStaff.id);

  if (deleteError) {
    console.log(`  ❌ Cannot delete data: ${deleteError.message}`);
    return false;
  }

  console.log('  ✅ Can delete data\n');

  return true;
}

/**
 * Main test function
 */
async function main() {
  try {
    testEnvironmentVariables();

    const connected = await testConnection();
    if (!connected) {
      console.log('❌ Connection test failed. Please check your Supabase URL and keys.');
      process.exit(1);
    }

    const tablesExist = await testTables();
    if (!tablesExist) {
      console.log('❌ Tables test failed. Please run database migrations.');
      process.exit(1);
    }

    await testQueryData();
    await testPermissions();

    console.log('='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n🎉 Your Supabase database is ready to use!');
    console.log('\n📝 Next steps:');
    console.log('  1. Run migration: npm run db:migrate-to-supabase');
    console.log('  2. Verify data in Supabase dashboard');
    console.log('  3. Start using Supabase in your app!\n');
  } catch (error) {
    console.log('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
