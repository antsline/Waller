import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  RoleSelection: undefined;
  PlayerProfileSetup: undefined;
  FanProfileSetup: undefined;
};

// Main Tabs
export type MainTabParamList = {
  Home: undefined;
  CreatePost: undefined;
  MyPage: undefined;
};

// Home Stack (投稿詳細などを含む)
export type HomeStackParamList = {
  HomeFeed: undefined;
  PostDetail: { postId: string };
  UserProfile: { userId: string };
};

// MyPage Stack (プロフィール編集などを含む)
export type MyPageStackParamList = {
  MyPageProfile: undefined;
  EditProfile: undefined;
  PostDetail: { postId: string };
  UserProfile: { userId: string };
};

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Screen Props
export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<
  MainTabParamList,
  T
>;

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> = NativeStackScreenProps<
  HomeStackParamList,
  T
>;

export type MyPageStackScreenProps<T extends keyof MyPageStackParamList> = NativeStackScreenProps<
  MyPageStackParamList,
  T
>;
