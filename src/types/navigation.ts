import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native'

export type AuthStackParamList = {
  Login: undefined
  ProfileSetup: undefined
}

export type HomeStackParamList = {
  Feed: undefined
  ClipDetail: { clipId: string }
  UserProfile: { userId: string }
}

export type DictionaryStackParamList = {
  TrickList: undefined
  TrickDetail: { trickId: string }
  NewTrickModal: undefined
  ClipDetail: { clipId: string }
}

export type MyPageStackParamList = {
  MyPage: undefined
  EditProfile: undefined
  BestPlayManage: undefined
  Settings: undefined
  WebView: { uri: string; title: string }
}

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>
  DictionaryTab: NavigatorScreenParams<DictionaryStackParamList>
  CreateClip: undefined
  MyPageTab: NavigatorScreenParams<MyPageStackParamList>
}

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>
  Main: NavigatorScreenParams<MainTabParamList>
}

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>

export type HomeScreenProps<T extends keyof HomeStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >

export type DictionaryScreenProps<T extends keyof DictionaryStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<DictionaryStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >

export type MyPageScreenProps<T extends keyof MyPageStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<MyPageStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >
