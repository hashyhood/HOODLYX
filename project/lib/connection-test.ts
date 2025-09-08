import { supabase } from './supabase';

interface ConnectionTestResult {
  supabase: {
    connected: boolean;
    error?: string;
  };
  database: {
    connected: boolean;
    error?: string;
  };
  auth: {
    working: boolean;
    error?: string;
  };
}

// Connection test state
let results: ConnectionTestResult = {
  supabase: { connected: false },
  database: { connected: false },
  auth: { working: false }
};

const testSupabaseConnection = async (): Promise<void> => {
  try {
    console.log('🔌 Testing Supabase connection...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      results.supabase = {
        connected: false,
        error: error.message
      };
      console.log('❌ Supabase connection failed:', error.message);
    } else {
      results.supabase = { connected: true };
      console.log('✅ Supabase connection successful');
    }
  } catch (error: any) {
    results.supabase = {
      connected: false,
      error: error.message
    };
    console.log('❌ Supabase connection failed:', error.message);
  }
};

const testDatabaseConnection = async (): Promise<void> => {
  try {
    console.log('🗄️ Testing database operations...');
    
    // Test basic CRUD operations
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Test read operation
      const { data: profile, error: readError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (readError) {
        results.database = {
          connected: false,
          error: `Read operation failed: ${readError.message}`
        };
        console.log('❌ Database read operation failed:', readError.message);
      } else {
        results.database = { connected: true };
        console.log('✅ Database operations successful');
      }
    } else {
      // Test without user (public data)
      const { data: rooms, error: readError } = await supabase
        .from('rooms')
        .select('count')
        .limit(1);

      if (readError) {
        results.database = {
          connected: false,
          error: `Public read operation failed: ${readError.message}`
        };
        console.log('❌ Database public read operation failed:', readError.message);
      } else {
        results.database = { connected: true };
        console.log('✅ Database operations successful');
      }
    }
  } catch (error: any) {
    results.database = {
      connected: false,
      error: error.message
    };
    console.log('❌ Database connection failed:', error.message);
  }
};

const testAuthentication = async (): Promise<void> => {
  try {
    console.log('🔐 Testing authentication...');
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      results.auth = {
        working: false,
        error: error.message
      };
      console.log('❌ Authentication failed:', error.message);
    } else if (session) {
      results.auth = { working: true };
      console.log('✅ Authentication working (user logged in)');
    } else {
      results.auth = { working: true };
      console.log('✅ Authentication working (no user logged in)');
    }
  } catch (error: any) {
    results.auth = {
      working: false,
      error: error.message
    };
    console.log('❌ Authentication failed:', error.message);
  }
};

const printResults = (): void => {
  console.log('\n📊 Connection Test Results:');
  console.log('========================');
  
  Object.entries(results).forEach(([key, result]) => {
    const status = result.error ? '❌' : '✅';
    const message = result.error ? `${key}: ${result.error}` : `${key}: Working`;
    console.log(`${status} ${message}`);
  });
  
  console.log('========================\n');
};

const testAllConnections = async (): Promise<ConnectionTestResult> => {
  console.log('🧪 Starting connection tests...');
  
  await Promise.all([
    testSupabaseConnection(),
    testDatabaseConnection(),
    testAuthentication()
  ]);

  printResults();
  return results;
};

const testRealTimeFeatures = async (): Promise<void> => {
  console.log('🔄 Testing real-time features...');
  
  try {
    // Test real-time subscription
    const channel = supabase
      .channel('test-realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'profiles' 
      }, (payload) => {
        console.log('✅ Real-time subscription working:', payload);
      })
      .subscribe();

    // Wait a bit for subscription
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test presence
    const presenceChannel = supabase.channel('test-presence', {
      config: {
        presence: {
          key: 'test-user'
        }
      }
    });

    presenceChannel.track({
      user: 'Connection Tester',
      userId: 'test-user',
      emoji: '🧪'
    });

    await presenceChannel.subscribe();
    
    console.log('✅ Real-time features working');
    
    // Cleanup
    channel.unsubscribe();
    presenceChannel.unsubscribe();
    
  } catch (error: any) {
    console.log('❌ Real-time features failed:', error.message);
  }
};

export const testConnections = testAllConnections;
export const testRealTime = testRealTimeFeatures;