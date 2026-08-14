import { SafeAreaView } from 'react-native-safe-area-context'
import { common } from '../theme'

// 모든 화면의 바깥 껍데기. 다섯 화면이 각자 safe: { flex: 1, backgroundColor }를
// 선언하고 있었다.
export default function Screen({ children, style }) {
  return <SafeAreaView style={[common.screen, style]}>{children}</SafeAreaView>
}
