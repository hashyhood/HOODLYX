// Enhanced Hermes polyfill - Load BEFORE anything else
console.log('🔧 Loading enhanced Hermes polyfills...');

// Method 1: Direct global assignment
if (typeof global !== 'undefined') {
  global.__extends = global.__extends || function(d, b) {
    console.log('🔧 __extends called for:', d.name || 'unknown');
    for (var p in b) {
      if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
    }
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}

// Method 2: globalThis assignment  
if (typeof globalThis !== 'undefined') {
  globalThis.__extends = globalThis.__extends || function(d, b) {
    console.log('🔧 __extends called via globalThis for:', d.name || 'unknown');
    for (var p in b) {
      if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
    }
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}

// Method 3: Window assignment (for web)
if (typeof window !== 'undefined') {
  window.__extends = window.__extends || function(d, b) {
    for (var p in b) {
      if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
    }
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}

// Method 4: Monkey patch for tslib helpers
try {
  const tslib = require('tslib');
  if (tslib && !tslib.__extends) {
    tslib.__extends = function(d, b) {
      for (var p in b) {
        if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
      }
      function __() { this.constructor = d; }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
  }
} catch (e) {
  console.log('📦 tslib not available, using global __extends');
}

// Method 5: Patch Object.setPrototypeOf for inheritance
if (!Object.setPrototypeOf) {
  Object.setPrototypeOf = function(obj, proto) {
    obj.__proto__ = proto;
    return obj;
  };
}

console.log('✅ Enhanced Hermes polyfills loaded - ALL METHODS APPLIED');
console.log('🔍 global.__extends available:', typeof global.__extends);
console.log('🔍 globalThis.__extends available:', typeof globalThis.__extends);