import { View, ActivityIndicator } from 'react-native'
import { colors, common } from '../theme'

export default function LoadingView() {
  return (
    <View style={common.centered}>
      <ActivityIndicator color={colors.primary} />
    </View>
  )
}
