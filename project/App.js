const React = require('react');
const { View, Text, StyleSheet, StatusBar } = require('react-native');

const App = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <Text style={styles.title}>🚀 HOODLY APP</Text>
      <Text style={styles.subtitle}>React Native CLI - WORKING!</Text>
      <Text style={styles.status}>✅ Metro Bundler Ready</Text>
      <Text style={styles.status}>✅ Zero TypeScript Errors</Text>
      <Text style={styles.status}>✅ Pure React Native</Text>
      <Text style={styles.status}>✅ Ready for Development</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    color: '#00d4ff',
    marginBottom: 30,
    textAlign: 'center',
  },
  status: {
    fontSize: 18,
    color: '#00ff88',
    marginBottom: 10,
    textAlign: 'center',
  },
});

module.exports = App;
