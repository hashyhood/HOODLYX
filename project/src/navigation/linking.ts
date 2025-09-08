import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from './RootNavigator';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['hoodly://', 'https://hoodly.app', 'https://www.hoodly.app'],
  config: {
    screens: {
      Auth: {
        screens: {
          AuthHome: 'auth',
          Login: 'login',
          Register: 'register',
        },
      },
      Main: {
        screens: {
          TabNavigator: {
            screens: {
              FeedStack: {
                screens: {
                  FeedHome: '',
                  Stories: 'stories',
                },
              },
              DiscoverStack: {
                screens: {
                  DiscoverHome: 'discover',
                  Search: 'search',
                },
              },
              ChatStack: {
                screens: {
                  ChatsList: 'chat',
                  PrivateChat: 'chat/:friendId',
                  GroupChat: 'group/:roomId',
                  CreateChat: 'chat/create',
                },
              },
              NotificationsStack: {
                screens: {
                  NotificationsHome: 'notifications',
                },
              },
              ProfileStack: {
                screens: {
                  ProfileHome: 'profile',
                },
              },
            },
          },
          // Modal screens
          PostDetails: 'post/:postId',
          UserProfile: 'user/:userId',
          CreatePost: 'create-post',
          Camera: 'camera',
          StoryView: 'story/:storyId/:userId',
          CreateStory: 'create-story',
          LiveStream: 'live/:streamId?',
          Settings: 'settings',
          EditProfile: 'edit-profile',
          Friends: 'friends',
          FriendRequests: 'friend-requests',
        },
      },
    },
  },
};
