import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');

interface TabItem {
  key: string;
  icon: string;
  label: string;
  isCenter?: boolean;
}

const tabItems: TabItem[] = [
  { key: 'FeedStack', icon: 'home', label: 'Home' },
  { key: 'DiscoverStack', icon: 'compass', label: 'Discover' },
  { key: 'CreateStack', icon: 'add', label: 'Create', isCenter: true },
  { key: 'ChatStack', icon: 'chatbubbles', label: 'Chat' },
  { key: 'NotificationsStack', icon: 'notifications', label: 'Alerts' },
  { key: 'ProfileStack', icon: 'person', label: 'Profile' },
];

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ 
  state, 
  descriptors, 
  navigation 
}) => {
  const insets = useSafeAreaInsets();
  const activeIndex = useSharedValue(0);

  React.useEffect(() => {
    activeIndex.value = withSpring(state.index, {
      damping: 15,
      stiffness: 150,
    });
  }, [state.index]);

  const indicatorStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      activeIndex.value,
      [0, 1, 2, 3, 4, 5],
      [
        width * 0.1,
        width * 0.25,
        width * 0.4,
        width * 0.55,
        width * 0.7,
        width * 0.85,
      ]
    );

    return {
      transform: [{ translateX: translateX - 20 }],
    };
  });

  const onPress = (routeName: string, index: number) => {
    if (routeName === 'CreateStack') {
      // @ts-ignore
      navigation.navigate('CreatePost');
      return;
    }

    const event = navigation.emit({
      type: 'tabPress',
      target: state.routes[index].key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.blurContainer}>
        {/* Active indicator */}
        <Animated.View style={[styles.indicator, indicatorStyle]}>
          <LinearGradient
            colors={['#FF6AA2', '#7DE1DA']}
            style={styles.indicatorGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Tab items */}
        <View style={styles.tabsContainer}>
          {tabItems.map((item, index) => {
            const isActive = state.index === index;
            const route = state.routes[index];
            
            if (item.isCenter) {
              return (
                <TouchableOpacity
                  key={item.key}
                  style={styles.centerTabItem}
                  onPress={() => onPress(route.name, index)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#FF71B8', '#7DE1DA']}
                    style={styles.centerTabGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Icon
                      name={item.icon}
                      size={28}
                      color="#FFFFFF"
                    />
                  </LinearGradient>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={item.key}
                style={styles.tabItem}
                onPress={() => onPress(route.name, index)}
                activeOpacity={0.8}
              >
                <View style={styles.tabContent}>
                  <Icon
                    name={isActive ? item.icon : `${item.icon}-outline` as any}
                    size={24}
                    color={isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
                  />
                  <Animated.Text
                    style={[
                      styles.tabLabel,
                      isActive && styles.activeTabLabel
                    ]}
                  >
                    {item.label}
                  </Animated.Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  blurContainer: {
    height: 86,
    backgroundColor: 'rgba(14, 20, 32, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  indicator: {
    position: 'absolute',
    top: -3,
    width: 40,
    height: 3,
    borderRadius: 2,
  },
  indicatorGradient: {
    flex: 1,
    borderRadius: 2,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  centerTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -25,
  },
  centerTabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF71B8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  activeTabLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
