import { CssStyle, UnitType } from 'figma-tree-parser'
import { UserComponentSetting } from './userComponentSetting'

export type messageTypes =
  | { type: 'notify-copy-success' }
  | { type: 'new-css-style-set'; cssStyle: CssStyle }
  | { type: 'new-unit-type-set'; unitType: UnitType }
  | { type: 'update-user-component-settings'; userComponentSettings: UserComponentSetting[] }
